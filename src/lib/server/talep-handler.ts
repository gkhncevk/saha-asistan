import { alanHatalari, talepSchema, type AlanHatalari, type Talep } from "@/lib/talep-schema";

// Route handler'ın iş mantığı. Veritabanı ve IP hash'i dışarıdan verilir;
// böylece testlerde gerçek veritabanı olmadan hata senaryoları denenebilir.

export const HIZ_SINIRI = { pencereDakika: 10, azamiDeneme: 5 } as const;
export const AZAMI_GOVDE_BAYT = 10_000;

export interface TalepDeposu {
  /** Denemeyi kaydeder ve penceredeki toplam deneme sayısını (bu dahil) döner. */
  denemeKaydet(ipHash: string, pencereDakika: number): Promise<number>;
  /** Talebi kaydeder. Aynı istek anahtarıyla daha önce kayıt varsa onun id'sini döner. */
  talepKaydet(talep: Talep, ipHash: string): Promise<{ id: number; yeni: boolean }>;
}

export interface HandlerBagimliliklari {
  depo: TalepDeposu;
  ipHash: (ip: string) => string;
  logla?: (mesaj: string, hata?: unknown) => void;
}

export type TalepYaniti =
  | { ok: true; referans: string; mesaj: string }
  | { ok: false; kod: string; mesaj: string; alanlar?: AlanHatalari };

export function referansNo(id: number): string {
  return `SR-${String(id).padStart(5, "0")}`;
}

function yanit(durum: number, govde: TalepYaniti, ekBasliklar: Record<string, string> = {}) {
  return Response.json(govde, {
    status: durum,
    headers: { "Cache-Control": "no-store", ...ekBasliklar },
  });
}

export function istemciIp(istek: Request): string {
  // Vercel x-forwarded-for başlığını kendisi yazar; ilk değer istemcinin IP'sidir.
  const ileri = istek.headers.get("x-forwarded-for");
  return ileri?.split(",")[0]?.trim() || istek.headers.get("x-real-ip") || "bilinmiyor";
}

export async function talepOlustur(istek: Request, b: HandlerBagimliliklari): Promise<Response> {
  const logla = b.logla ?? ((m, h) => console.error(m, h));

  if (!istek.headers.get("content-type")?.includes("application/json")) {
    return yanit(415, { ok: false, kod: "icerik_turu", mesaj: "İstek JSON formatında olmalı." });
  }

  // Gövdeyi okumadan önce boyutu kontrol et; başlık yoksa okuduktan sonra tekrar bak.
  const bildirilen = Number(istek.headers.get("content-length") ?? 0);
  if (bildirilen > AZAMI_GOVDE_BAYT) {
    return yanit(413, { ok: false, kod: "cok_buyuk", mesaj: "Gönderilen veri çok büyük." });
  }

  let ham: string;
  try {
    ham = await istek.text();
  } catch {
    return yanit(400, { ok: false, kod: "gecersiz_istek", mesaj: "İstek okunamadı." });
  }
  if (new TextEncoder().encode(ham).length > AZAMI_GOVDE_BAYT) {
    return yanit(413, { ok: false, kod: "cok_buyuk", mesaj: "Gönderilen veri çok büyük." });
  }

  let govde: unknown;
  try {
    govde = JSON.parse(ham);
  } catch {
    return yanit(400, { ok: false, kod: "gecersiz_json", mesaj: "İstek gövdesi geçerli JSON değil." });
  }

  // Hız sınırı, doğrulamadan ÖNCE sayılır: geçersiz isteklerle yapılan
  // denemeler de sınıra takılsın.
  let ipHash: string;
  let denemeSayisi: number;
  try {
    ipHash = b.ipHash(istemciIp(istek));
    denemeSayisi = await b.depo.denemeKaydet(ipHash, HIZ_SINIRI.pencereDakika);
  } catch (hata) {
    logla("Hız sınırı kaydı başarısız", hata);
    return yanit(503, {
      ok: false,
      kod: "sunucu_hatasi",
      mesaj: "Talebiniz şu anda kaydedilemedi. Bilgileriniz formda duruyor; lütfen biraz sonra tekrar deneyin.",
    });
  }
  if (denemeSayisi > HIZ_SINIRI.azamiDeneme) {
    return yanit(
      429,
      {
        ok: false,
        kod: "cok_fazla_istek",
        mesaj: `Kısa sürede çok fazla deneme yapıldı. Lütfen ${HIZ_SINIRI.pencereDakika} dakika sonra tekrar deneyin.`,
      },
      { "Retry-After": String(HIZ_SINIRI.pencereDakika * 60) },
    );
  }

  // Honeypot: gerçek kullanıcılar bu gizli alanı görmez ve doldurmaz.
  // Bota sahte başarı DÖNMÜYORUZ; görev "başarı yalnızca kayıt varsa" diyor.
  if (typeof govde === "object" && govde !== null && "website" in govde && (govde as Record<string, unknown>).website) {
    return yanit(400, { ok: false, kod: "reddedildi", mesaj: "Talep gönderilemedi." });
  }

  const sonuc = talepSchema.safeParse(govde);
  if (!sonuc.success) {
    return yanit(422, {
      ok: false,
      kod: "dogrulama",
      mesaj: "Lütfen işaretli alanları düzeltin.",
      alanlar: alanHatalari(sonuc.error),
    });
  }

  try {
    const { id, yeni } = await b.depo.talepKaydet(sonuc.data, ipHash);
    return yanit(yeni ? 201 : 200, {
      ok: true,
      referans: referansNo(id),
      mesaj: yeni ? "Talebiniz kaydedildi." : "Bu talep daha önce kaydedilmişti.",
    });
  } catch (hata) {
    // Kişisel veriyi loga yazmıyoruz; yalnızca hata.
    logla("Talep kaydı başarısız", hata);
    return yanit(503, {
      ok: false,
      kod: "sunucu_hatasi",
      mesaj: "Talebiniz şu anda kaydedilemedi. Bilgileriniz formda duruyor; lütfen biraz sonra tekrar deneyin.",
    });
  }
}
