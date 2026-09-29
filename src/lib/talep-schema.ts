import { z } from "zod";

// Bu dosya hem tarayıcıda hem sunucuda kullanılır: iki tarafta aynı kurallar
// geçerli olsun diye tek kaynak burasıdır. Sunucu yine de istemciye güvenmez,
// gelen her isteği bu şemayla yeniden doğrular.

export const HIZMETLER = [
  { deger: "ariza-asistani", etiket: "Arıza ve bakım asistanı kurulumu" },
  { deger: "dokuman-dijitallestirme", etiket: "Kılavuz ve doküman dijitalleştirme" },
  { deger: "cmms-entegrasyonu", etiket: "Mevcut bakım yazılımına (CMMS) entegrasyon" },
  { deger: "emin-degilim", etiket: "Emin değilim, birlikte karar verelim" },
] as const;

const HIZMET_DEGERLERI = HIZMETLER.map((h) => h.deger) as [
  (typeof HIZMETLER)[number]["deger"],
  ...(typeof HIZMETLER)[number]["deger"][],
];

export const SINIRLAR = {
  adMin: 2,
  adMax: 80,
  epostaMax: 254,
  aciklamaMin: 20,
  aciklamaMax: 2000,
} as const;

export const talepSchema = z.object({
  ad: z
    .string("Lütfen adınızı ve soyadınızı yazın.")
    .trim()
    .min(1, "Lütfen adınızı ve soyadınızı yazın.")
    .min(SINIRLAR.adMin, `Ad soyad en az ${SINIRLAR.adMin} karakter olmalı.`)
    .max(SINIRLAR.adMax, `Ad soyad en fazla ${SINIRLAR.adMax} karakter olabilir.`),
  eposta: z
    .string("Lütfen e-posta adresinizi yazın.")
    .trim()
    .toLowerCase()
    .min(1, "Lütfen e-posta adresinizi yazın.")
    .max(SINIRLAR.epostaMax, "E-posta adresi çok uzun.")
    .pipe(z.email("Geçerli bir e-posta adresi yazın (ör. ad@firma.com).")),
  hizmet: z.enum(HIZMET_DEGERLERI, "Lütfen bir hizmet seçin."),
  aciklama: z
    .string("Lütfen ihtiyacınızı kısaca anlatın.")
    .trim()
    .min(1, "Lütfen ihtiyacınızı kısaca anlatın.")
    .min(
      SINIRLAR.aciklamaMin,
      `Açıklama en az ${SINIRLAR.aciklamaMin} karakter olmalı; tesisiniz ve ihtiyacınız hakkında biraz daha bilgi verin.`,
    )
    .max(SINIRLAR.aciklamaMax, `Açıklama en fazla ${SINIRLAR.aciklamaMax} karakter olabilir.`),
  // Tarayıcının her form doldurma için ürettiği anahtar. Aynı talep ağ hatası
  // sonrası tekrar gönderilirse sunucu ikinci bir kayıt açmaz.
  istekAnahtari: z.uuid("Geçersiz istek anahtarı."),
});

export type TalepGirdisi = z.input<typeof talepSchema>;
export type Talep = z.output<typeof talepSchema>;
export type AlanHatalari = Partial<Record<keyof Talep, string[]>>;

export function alanHatalari(error: z.ZodError<TalepGirdisi>): AlanHatalari {
  return z.flattenError(error).fieldErrors as AlanHatalari;
}

export function hizmetEtiketi(deger: string): string {
  return HIZMETLER.find((h) => h.deger === deger)?.etiket ?? deger;
}
