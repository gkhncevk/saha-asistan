"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import {
  alanHatalari,
  HIZMETLER,
  hizmetEtiketi,
  SINIRLAR,
  talepSchema,
  type AlanHatalari,
} from "@/lib/talep-schema";

type Alan = "ad" | "eposta" | "hizmet" | "aciklama";
const ALAN_SIRASI: Alan[] = ["ad", "eposta", "hizmet", "aciklama"];
const ALAN_ADLARI: Record<Alan, string> = {
  ad: "Ad soyad",
  eposta: "E-posta",
  hizmet: "Hizmet",
  aciklama: "Açıklama",
};
const ZAMAN_ASIMI_MS = 15_000;

type Durum =
  | { tur: "bos" }
  | { tur: "gonderiliyor" }
  | { tur: "basarili"; referans: string; hizmet: string }
  | { tur: "hata"; mesaj: string };

const bosDegerler = { ad: "", eposta: "", hizmet: "", aciklama: "" };

// crypto.randomUUID yalnızca güvenli bağlamda (https/localhost) var; telefonla
// yerel ağdan http ile test edilirken de çalışsın diye yedek üretici.
function yeniAnahtar(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export default function TalepFormu() {
  const kimlik = useId();
  const [degerler, setDegerler] = useState(bosDegerler);
  const [hatalar, setHatalar] = useState<AlanHatalari>({});
  const [dokunulan, setDokunulan] = useState<Partial<Record<Alan, boolean>>>({});
  const [durum, setDurum] = useState<Durum>({ tur: "bos" });
  // Aynı form doldurma için sabit kalır; ağ hatası sonrası tekrar denemede
  // sunucu bunu görüp ikinci kayıt açmaz. Yalnızca başarılı kayıttan sonra yenilenir.
  const istekAnahtari = useRef<string | null>(null);
  const ozetRef = useRef<HTMLDivElement>(null);
  const basariRef = useRef<HTMLHeadingElement>(null);
  const alanRefleri = useRef<Partial<Record<Alan, HTMLElement | null>>>({});

  const id = (alan: string) => `${kimlik}-${alan}`;
  const gonderiliyor = durum.tur === "gonderiliyor";

  function dogrula(yeniDegerler = degerler): AlanHatalari {
    const sonuc = talepSchema.safeParse({ ...yeniDegerler, istekAnahtari: "00000000-0000-4000-8000-000000000000" });
    return sonuc.success ? {} : alanHatalari(sonuc.error);
  }

  function degistir(alan: Alan, deger: string) {
    const yeni = { ...degerler, [alan]: deger };
    setDegerler(yeni);
    // Kullanıcı yazarken hata göstermek yerine, alana bir kez dokunduktan sonra
    // hatayı canlı güncelliyoruz (düzeltince hemen kaybolsun).
    if (dokunulan[alan]) setHatalar((h) => ({ ...h, [alan]: dogrula(yeni)[alan] }));
  }

  function birak(alan: Alan) {
    setDokunulan((d) => ({ ...d, [alan]: true }));
    setHatalar((h) => ({ ...h, [alan]: dogrula()[alan] }));
  }

  function hatalariGoster(yeniHatalar: AlanHatalari) {
    setHatalar(yeniHatalar);
    setDokunulan({ ad: true, eposta: true, hizmet: true, aciklama: true });
    // Ekran okuyucu kullanıcısı hataların özetini duysun; özet içindeki
    // bağlantılarla ilgili alana atlayabilir.
    requestAnimationFrame(() => ozetRef.current?.focus());
  }

  async function gonder(olay: FormEvent<HTMLFormElement>) {
    olay.preventDefault();
    if (gonderiliyor) return;

    const istemciHatalari = dogrula();
    if (Object.values(istemciHatalari).some(Boolean)) {
      setDurum({ tur: "bos" });
      hatalariGoster(istemciHatalari);
      return;
    }

    istekAnahtari.current ??= yeniAnahtar();
    const website = (new FormData(olay.currentTarget).get("website") as string) ?? "";
    setHatalar({});
    setDurum({ tur: "gonderiliyor" });

    const iptal = new AbortController();
    const zamanlayici = setTimeout(() => iptal.abort(), ZAMAN_ASIMI_MS);
    try {
      const yanit = await fetch("/api/talepler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...degerler, istekAnahtari: istekAnahtari.current, website }),
        signal: iptal.signal,
      });
      const govde = await yanit.json().catch(() => null);

      // Başarıyı yalnızca sunucu kaydı onayladığında gösteriyoruz.
      if ((yanit.status === 201 || yanit.status === 200) && govde?.ok === true && typeof govde.referans === "string") {
        setDurum({ tur: "basarili", referans: govde.referans, hizmet: degerler.hizmet });
        setDegerler(bosDegerler);
        setDokunulan({});
        istekAnahtari.current = null;
        requestAnimationFrame(() => basariRef.current?.focus());
        return;
      }

      if (yanit.status === 422 && govde?.alanlar) {
        setDurum({ tur: "bos" });
        hatalariGoster(govde.alanlar);
        return;
      }

      setDurum({
        tur: "hata",
        mesaj:
          govde?.mesaj ??
          "Talebiniz kaydedilemedi. Bilgileriniz formda duruyor; lütfen biraz sonra tekrar deneyin.",
      });
    } catch (hata) {
      const zamanAsimi = hata instanceof DOMException && hata.name === "AbortError";
      setDurum({
        tur: "hata",
        mesaj: zamanAsimi
          ? "Sunucu zamanında yanıt vermedi. Talebiniz kaydedilmemiş olabilir; bilgileriniz formda duruyor, tekrar gönderebilirsiniz (aynı talep ikinci kez kaydedilmez)."
          : "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin; bilgileriniz formda duruyor.",
      });
    } finally {
      clearTimeout(zamanlayici);
    }
  }

  if (durum.tur === "basarili") {
    return (
      <div role="status" className="rounded-xl border-2 border-emerald-700 bg-emerald-50 p-6">
        <h3 ref={basariRef} tabIndex={-1} className="text-xl font-semibold text-emerald-900">
          Talebiniz kaydedildi
        </h3>
        <p className="mt-2 text-slate-800">
          Referans numaranız: <strong className="font-mono text-lg">{durum.referans}</strong>
        </p>
        <p className="mt-1 text-slate-700">Seçtiğiniz hizmet: {hizmetEtiketi(durum.hizmet)}</p>
        <p className="mt-3 text-sm text-slate-700">
          Bu bir değerlendirme çalışmasıdır: talep veritabanına kaydedildi, ancak e-posta gönderilmez.
        </p>
        <button
          type="button"
          onClick={() => setDurum({ tur: "bos" })}
          className="mt-5 min-h-11 rounded-lg border-2 border-slate-900 px-4 py-2 font-medium text-slate-900 hover:bg-white"
        >
          Yeni talep oluştur
        </button>
      </div>
    );
  }

  const hataliAlanlar = ALAN_SIRASI.filter((a) => hatalar[a]?.length);

  return (
    <form onSubmit={gonder} noValidate aria-busy={gonderiliyor} className="space-y-6">
      {hataliAlanlar.length > 0 && (
        <div
          ref={ozetRef}
          tabIndex={-1}
          role="alert"
          aria-labelledby={id("ozet-baslik")}
          className="rounded-lg border-2 border-red-700 bg-red-50 p-4"
        >
          <h3 id={id("ozet-baslik")} className="font-semibold text-red-900">
            Gönderilmeden önce {hataliAlanlar.length} alanı düzeltin:
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {hataliAlanlar.map((alan) => (
              <li key={alan}>
                <a
                  href={`#${id(alan)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    alanRefleri.current[alan]?.focus();
                  }}
                  className="text-red-900 underline underline-offset-2"
                >
                  {ALAN_ADLARI[alan]}: {hatalar[alan]?.[0]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Alan etiket="Ad soyad" alanId={id("ad")} hata={hatalar.ad?.[0]}>
        {(aria) => (
          <input
            {...aria}
            ref={(el) => {
              alanRefleri.current.ad = el;
            }}
            name="ad"
            type="text"
            autoComplete="name"
            maxLength={SINIRLAR.adMax}
            value={degerler.ad}
            onChange={(e) => degistir("ad", e.target.value)}
            onBlur={() => birak("ad")}
            className={girdiSinifi(!!hatalar.ad?.length)}
          />
        )}
      </Alan>

      <Alan
        etiket="E-posta"
        alanId={id("eposta")}
        hata={hatalar.eposta?.[0]}
        ipucu="Size bu adresten dönüş yapacağız."
      >
        {(aria) => (
          <input
            {...aria}
            ref={(el) => {
              alanRefleri.current.eposta = el;
            }}
            name="eposta"
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={SINIRLAR.epostaMax}
            value={degerler.eposta}
            onChange={(e) => degistir("eposta", e.target.value)}
            onBlur={() => birak("eposta")}
            className={girdiSinifi(!!hatalar.eposta?.length)}
          />
        )}
      </Alan>

      <Alan etiket="Hangi hizmetle ilgileniyorsunuz?" alanId={id("hizmet")} hata={hatalar.hizmet?.[0]}>
        {(aria) => (
          <select
            {...aria}
            ref={(el) => {
              alanRefleri.current.hizmet = el;
            }}
            name="hizmet"
            value={degerler.hizmet}
            onChange={(e) => degistir("hizmet", e.target.value)}
            onBlur={() => birak("hizmet")}
            className={girdiSinifi(!!hatalar.hizmet?.length)}
          >
            <option value="">Bir hizmet seçin</option>
            {HIZMETLER.map((h) => (
              <option key={h.deger} value={h.deger}>
                {h.etiket}
              </option>
            ))}
          </select>
        )}
      </Alan>

      <Alan
        etiket="Açıklama"
        alanId={id("aciklama")}
        hata={hatalar.aciklama?.[0]}
        ipucu={`Tesisiniz ve ihtiyacınız: makine türleri, yaklaşık doküman sayısı, bugün arızaları nasıl çözdüğünüz. En az ${SINIRLAR.aciklamaMin} karakter.`}
        sayac={`${degerler.aciklama.length} / ${SINIRLAR.aciklamaMax}`}
      >
        {(aria) => (
          <textarea
            {...aria}
            ref={(el) => {
              alanRefleri.current.aciklama = el;
            }}
            name="aciklama"
            rows={5}
            maxLength={SINIRLAR.aciklamaMax}
            value={degerler.aciklama}
            onChange={(e) => degistir("aciklama", e.target.value)}
            onBlur={() => birak("aciklama")}
            className={girdiSinifi(!!hatalar.aciklama?.length)}
          />
        )}
      </Alan>

      {/* Honeypot: ekranda ve ekran okuyucuda görünmez; yalnızca botlar doldurur. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={id("website")}>Web siteniz (boş bırakın)</label>
        <input id={id("website")} name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>

      <div aria-live="polite" role="status" className="sr-only">
        {gonderiliyor ? "Talebiniz gönderiliyor." : ""}
      </div>

      {durum.tur === "hata" && (
        <div role="alert" className="rounded-lg border-2 border-red-700 bg-red-50 p-4 text-red-900">
          <p className="font-semibold">Talep gönderilemedi</p>
          <p className="mt-1">{durum.mesaj}</p>
        </div>
      )}

      <p className="text-sm text-slate-700">
        Lütfen yalnızca kurgusal test verisi girin. Bilgileriniz yalnızca bu talebe dönüş için saklanır.
      </p>

      <button
        type="submit"
        disabled={gonderiliyor}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 text-lg font-semibold text-white hover:bg-slate-700 disabled:cursor-wait disabled:bg-slate-600 sm:w-auto"
      >
        {gonderiliyor && (
          <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        {gonderiliyor ? "Gönderiliyor…" : "Talebi gönder"}
      </button>
    </form>
  );
}

function girdiSinifi(hatali: boolean) {
  return [
    "mt-2 block w-full rounded-lg border-2 bg-white px-3 py-3 text-base text-slate-900",
    hatali ? "border-red-700" : "border-slate-500",
  ].join(" ");
}

function Alan({
  etiket,
  alanId,
  hata,
  ipucu,
  sayac,
  children,
}: {
  etiket: string;
  alanId: string;
  hata?: string;
  ipucu?: string;
  sayac?: string;
  children: (aria: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
    "aria-required": true;
  }) => React.ReactNode;
}) {
  const aciklayanlar = [ipucu && `${alanId}-ipucu`, hata && `${alanId}-hata`].filter(Boolean).join(" ");
  return (
    <div>
      <label htmlFor={alanId} className="block font-semibold text-slate-900">
        {etiket} <span className="font-normal text-slate-700">(zorunlu)</span>
      </label>
      {ipucu && (
        <p id={`${alanId}-ipucu`} className="mt-1 text-sm text-slate-700">
          {ipucu}
        </p>
      )}
      {children({
        id: alanId,
        "aria-invalid": !!hata,
        "aria-describedby": aciklayanlar || undefined,
        "aria-required": true,
      })}
      <div className="mt-1 flex items-start justify-between gap-4">
        {hata ? (
          <p id={`${alanId}-hata`} className="text-sm font-medium text-red-800">
            <span className="sr-only">Hata: </span>
            {hata}
          </p>
        ) : (
          <span />
        )}
        {sayac && <span className="shrink-0 text-sm text-slate-700">{sayac}</span>}
      </div>
    </div>
  );
}
