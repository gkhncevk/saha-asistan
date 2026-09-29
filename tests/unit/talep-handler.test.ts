import { describe, expect, it, vi } from "vitest";
import {
  AZAMI_GOVDE_BAYT,
  HIZ_SINIRI,
  talepOlustur,
  type TalepDeposu,
} from "@/lib/server/talep-handler";

// Gerçek veritabanı yerine bellekte çalışan sahte depo: aynı sözleşmeyi uygular,
// istenirse hata fırlatacak şekilde ayarlanabilir.
function sahteDepo(ayar: { kayitHatasi?: boolean; denemeHatasi?: boolean } = {}) {
  const kayitlar = new Map<string, number>();
  const denemeler = new Map<string, number>();
  const depo: TalepDeposu = {
    async denemeKaydet(ipHash) {
      if (ayar.denemeHatasi) throw new Error("db kapalı");
      const sayi = (denemeler.get(ipHash) ?? 0) + 1;
      denemeler.set(ipHash, sayi);
      return sayi;
    },
    async talepKaydet(talep) {
      if (ayar.kayitHatasi) throw new Error("db kapalı");
      const mevcut = kayitlar.get(talep.istekAnahtari);
      if (mevcut) return { id: mevcut, yeni: false };
      const id = kayitlar.size + 1;
      kayitlar.set(talep.istekAnahtari, id);
      return { id, yeni: true };
    },
  };
  return { depo, kayitlar };
}

const gecerliTalep = () => ({
  ad: "Deneme Kullanıcı",
  eposta: "deneme@ornek-tesis.test",
  hizmet: "ariza-asistani",
  aciklama: "Test verisi: 12 CNC tezgahı ve yaklaşık 40 PDF kılavuz için asistan kurulumu.",
  istekAnahtari: crypto.randomUUID(),
});

function istek(govde: unknown, basliklar: Record<string, string> = {}) {
  return new Request("http://localhost/api/talepler", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.7", ...basliklar },
    body: typeof govde === "string" ? govde : JSON.stringify(govde),
  });
}

const bagimliliklar = (depo: TalepDeposu) => ({ depo, ipHash: (ip: string) => `hash:${ip}`, logla: vi.fn() });

describe("POST /api/talepler", () => {
  it("geçerli talebi kaydeder, 201 ve referans numarası döner", async () => {
    const { depo, kayitlar } = sahteDepo();
    const yanit = await talepOlustur(istek(gecerliTalep()), bagimliliklar(depo));
    expect(yanit.status).toBe(201);
    expect(await yanit.json()).toMatchObject({ ok: true, referans: "SR-00001" });
    expect(kayitlar.size).toBe(1);
  });

  it("veritabanı hatasında başarı DÖNMEZ: 503 ve ok:false", async () => {
    const { depo } = sahteDepo({ kayitHatasi: true });
    const b = bagimliliklar(depo);
    const yanit = await talepOlustur(istek(gecerliTalep()), b);
    expect(yanit.status).toBe(503);
    const govde = await yanit.json();
    expect(govde.ok).toBe(false);
    expect(govde).not.toHaveProperty("referans");
    expect(b.logla).toHaveBeenCalled();
  });

  it("hız sınırı kaydı yapılamazsa da başarı dönmez", async () => {
    const { depo, kayitlar } = sahteDepo({ denemeHatasi: true });
    const yanit = await talepOlustur(istek(gecerliTalep()), bagimliliklar(depo));
    expect(yanit.status).toBe(503);
    expect(kayitlar.size).toBe(0);
  });

  it("geçersiz alanlarda 422 ve alan bazlı hatalar döner, kayıt açmaz", async () => {
    const { depo, kayitlar } = sahteDepo();
    const yanit = await talepOlustur(
      istek({ ad: "A", eposta: "gecersiz", hizmet: "yok", aciklama: "kısa", istekAnahtari: crypto.randomUUID() }),
      bagimliliklar(depo),
    );
    expect(yanit.status).toBe(422);
    const govde = await yanit.json();
    expect(Object.keys(govde.alanlar).sort()).toEqual(["aciklama", "ad", "eposta", "hizmet"]);
    expect(kayitlar.size).toBe(0);
  });

  it("istemci doğrulamasını atlayan eksik alanlı isteği reddeder", async () => {
    const { depo } = sahteDepo();
    const yanit = await talepOlustur(istek({ ad: "Deneme Kullanıcı" }), bagimliliklar(depo));
    expect(yanit.status).toBe(422);
  });

  it("baştaki/sondaki boşlukları temizler; yalnızca boşluktan oluşan açıklamayı kabul etmez", async () => {
    const { depo } = sahteDepo();
    const yanit = await talepOlustur(istek({ ...gecerliTalep(), aciklama: " ".repeat(50) }), bagimliliklar(depo));
    expect(yanit.status).toBe(422);
  });

  it("aynı istek anahtarıyla tekrar gönderimde ikinci kayıt açmaz, aynı referansı döner", async () => {
    const { depo, kayitlar } = sahteDepo();
    const talep = gecerliTalep();
    const ilk = await talepOlustur(istek(talep), bagimliliklar(depo));
    const ikinci = await talepOlustur(istek(talep), bagimliliklar(depo));
    expect(ilk.status).toBe(201);
    expect(ikinci.status).toBe(200);
    expect((await ikinci.json()).referans).toBe((await ilk.json()).referans);
    expect(kayitlar.size).toBe(1);
  });

  it(`aynı IP'den ${HIZ_SINIRI.azamiDeneme} denemeden sonrasını 429 ile reddeder`, async () => {
    const { depo } = sahteDepo();
    const durumlar: number[] = [];
    for (let i = 0; i < HIZ_SINIRI.azamiDeneme; i++) {
      durumlar.push((await talepOlustur(istek(gecerliTalep()), bagimliliklar(depo))).status);
    }
    expect(durumlar).toEqual(Array(HIZ_SINIRI.azamiDeneme).fill(201));
    const son = await talepOlustur(istek(gecerliTalep()), bagimliliklar(depo));
    expect(son.status).toBe(429);
    expect(son.headers.get("retry-after")).toBe(String(HIZ_SINIRI.pencereDakika * 60));
  });

  it("farklı IP'ler birbirinin sınırını etkilemez", async () => {
    const { depo } = sahteDepo();
    for (let i = 0; i < HIZ_SINIRI.azamiDeneme + 1; i++) {
      await talepOlustur(istek(gecerliTalep()), bagimliliklar(depo));
    }
    const baskaIp = await talepOlustur(istek(gecerliTalep(), { "x-forwarded-for": "198.51.100.1" }), bagimliliklar(depo));
    expect(baskaIp.status).toBe(201);
  });

  it("honeypot alanı doluysa kayıt açmaz ve sahte başarı dönmez", async () => {
    const { depo, kayitlar } = sahteDepo();
    const yanit = await talepOlustur(istek({ ...gecerliTalep(), website: "http://spam.test" }), bagimliliklar(depo));
    expect(yanit.status).toBe(400);
    expect((await yanit.json()).ok).toBe(false);
    expect(kayitlar.size).toBe(0);
  });

  it("bozuk JSON'a 400 döner", async () => {
    const { depo } = sahteDepo();
    expect((await talepOlustur(istek("{bozuk"), bagimliliklar(depo))).status).toBe(400);
  });

  it("JSON olmayan içerik türüne 415 döner", async () => {
    const { depo } = sahteDepo();
    const yanit = await talepOlustur(
      istek("ad=x", { "content-type": "application/x-www-form-urlencoded" }),
      bagimliliklar(depo),
    );
    expect(yanit.status).toBe(415);
  });

  it(`${AZAMI_GOVDE_BAYT} bayttan büyük gövdeyi 413 ile reddeder`, async () => {
    const { depo } = sahteDepo();
    const yanit = await talepOlustur(
      istek({ ...gecerliTalep(), aciklama: "x".repeat(AZAMI_GOVDE_BAYT + 1) }),
      bagimliliklar(depo),
    );
    expect(yanit.status).toBe(413);
  });

  it("yanıtlar önbelleğe alınmaz", async () => {
    const { depo } = sahteDepo();
    const yanit = await talepOlustur(istek(gecerliTalep()), bagimliliklar(depo));
    expect(yanit.headers.get("cache-control")).toBe("no-store");
  });
});
