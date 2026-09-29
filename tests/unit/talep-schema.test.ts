import { describe, expect, it } from "vitest";
import { alanHatalari, SINIRLAR, talepSchema } from "@/lib/talep-schema";

const taban = {
  ad: "Deneme Kullanıcı",
  eposta: "Deneme@Ornek-Tesis.test",
  hizmet: "cmms-entegrasyonu",
  aciklama: "Test verisi: mevcut bakım yazılımımızla entegrasyon istiyoruz.",
  istekAnahtari: "3f1c2b8e-6a8b-4c55-9d2f-2f7a0d6c9e11",
};

describe("talepSchema", () => {
  it("geçerli veriyi kabul eder; e-postayı küçük harfe çevirip boşlukları kırpar", () => {
    const sonuc = talepSchema.parse({ ...taban, ad: "  Deneme Kullanıcı  " });
    expect(sonuc.eposta).toBe("deneme@ornek-tesis.test");
    expect(sonuc.ad).toBe("Deneme Kullanıcı");
  });

  it.each([
    ["ad", "A"],
    ["ad", "x".repeat(SINIRLAR.adMax + 1)],
    ["eposta", "ornek.com"],
    ["eposta", "a@b"],
    ["hizmet", "listede-olmayan"],
    ["aciklama", "çok kısa"],
    ["aciklama", "x".repeat(SINIRLAR.aciklamaMax + 1)],
    ["istekAnahtari", "uuid-degil"],
  ])("%s alanında geçersiz değeri reddeder: %s", (alan, deger) => {
    const sonuc = talepSchema.safeParse({ ...taban, [alan]: deger });
    expect(sonuc.success).toBe(false);
    if (!sonuc.success) expect(alanHatalari(sonuc.error)).toHaveProperty(alan);
  });

  it("hata mesajları Türkçe ve kullanıcıya yöneliktir", () => {
    const sonuc = talepSchema.safeParse({ ...taban, eposta: "yanlis" });
    expect(sonuc.success).toBe(false);
    if (!sonuc.success) expect(alanHatalari(sonuc.error).eposta?.[0]).toMatch(/Geçerli bir e-posta/);
  });
});
