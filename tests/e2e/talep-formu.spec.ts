import { expect, test, type Page } from "@playwright/test";

const GECERLI = {
  ad: "E2E Test Teknisyen",
  eposta: "e2e@ornek-tesis.test",
  hizmet: "Arıza ve bakım asistanı kurulumu",
  aciklama: "Kurgusal E2E test verisi: 8 pres, 30 PDF kılavuz, arıza kayıtları Excel'de.",
};

async function formuDoldur(page: Page) {
  await page.getByLabel("Ad soyad").fill(GECERLI.ad);
  await page.getByLabel("E-posta").fill(GECERLI.eposta);
  await page.getByLabel("Hangi hizmetle ilgileniyorsunuz?").selectOption({ label: GECERLI.hizmet });
  await page.getByLabel("Açıklama").fill(GECERLI.aciklama);
}

const gonderButonu = (page: Page) => page.getByRole("button", { name: /Talebi gönder|Gönderiliyor/ });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("sayfa hizmeti ve talep formunu doğru sırada sunar", async ({ page }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Arıza kodunu yazın");
  const basliklar = await page.getByRole("heading", { level: 2 }).allTextContents();
  expect(basliklar.at(-1)).toContain("Keşif görüşmesi talep edin");
  await page.getByRole("link", { name: "Keşif görüşmesi talep et" }).click();
  await expect(page).toHaveURL(/#talep$/);
});

test("mobilde ve masaüstünde yatay kaydırma yok", async ({ page }) => {
  const tasma = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(tasma).toBe(false);
});

test("ilk Tab 'Talep formuna geç' bağlantısını gösterir ve forma götürür", async ({ page, isMobile }) => {
  test.skip(isMobile, "Klavye akışı masaüstünde sınanıyor");
  await page.keyboard.press("Tab");
  const atla = page.getByRole("link", { name: "Talep formuna geç" });
  await expect(atla).toBeFocused();
  const kutu = await atla.boundingBox();
  expect(kutu!.height).toBeGreaterThanOrEqual(44);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#talep$/);
});

test("mobilde görünen tüm dokunma hedefleri en az 44 px yüksekliğinde", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Dokunma hedefi ölçütü mobil için");
  const kucukler = await page.evaluate(() =>
    [...document.querySelectorAll("a, button, input, select, textarea")]
      .filter((e) => !e.closest("[aria-hidden=true]"))
      .map((e) => ({ ad: (e.textContent || e.getAttribute("name") || "").trim().slice(0, 30), r: e.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 1 && r.height > 1 && r.height < 44)
      .map(({ ad, r }) => `${ad}: ${Math.round(r.height)}px`),
  );
  expect(kucukler).toEqual([]);
});

test("boş gönderimde hata özeti gösterir, odağı özete taşır, istek atmaz", async ({ page }) => {
  let istekSayisi = 0;
  page.on("request", (r) => r.url().includes("/api/talepler") && istekSayisi++);

  await gonderButonu(page).click();

  const ozet = page.getByRole("alert").filter({ hasText: "alanı düzeltin" });
  await expect(ozet).toBeVisible();
  await expect(ozet).toBeFocused();
  await expect(page.getByLabel("Ad soyad")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Lütfen bir hizmet seçin.").first()).toBeVisible();

  // Özetteki bağlantı ilgili alana odak taşır.
  await ozet.getByRole("link", { name: /E-posta/ }).click();
  await expect(page.getByLabel("E-posta")).toBeFocused();
  expect(istekSayisi).toBe(0);
});

test("hatalı alan düzeltilince hata mesajı kaybolur", async ({ page }) => {
  const eposta = page.getByLabel("E-posta");
  await eposta.fill("yanlis");
  await eposta.blur();
  await expect(page.getByText("Geçerli bir e-posta adresi yazın")).toBeVisible();
  await eposta.fill("dogru@ornek.test");
  await expect(page.getByText("Geçerli bir e-posta adresi yazın")).toBeHidden();
  await expect(eposta).toHaveAttribute("aria-invalid", "false");
});

test("gerçek kayıt: başarı mesajı ve referans numarası yalnızca sunucu kaydedince gelir", async ({ page }) => {
  // Hız sınırı IP başına 10 dakikada 5 deneme. Yerelde art arda çalıştırmalar
  // sınıra takılmasın diye her çalıştırmada rastgele bir belgeleme IP'si (TEST-NET-3).
  // Vercel bu başlığı kendisi yazdığı için canlı ortamda etkisi yoktur.
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `203.0.113.${Math.floor(Math.random() * 254) + 1}` });
  await formuDoldur(page);
  const yanitBekle = page.waitForResponse((r) => r.url().includes("/api/talepler"));
  await gonderButonu(page).click();
  const yanit = await yanitBekle;

  expect(yanit.status()).toBe(201);
  const govde = await yanit.json();
  const basari = page.getByRole("heading", { name: "Talebiniz kaydedildi" });
  await expect(basari).toBeVisible();
  await expect(basari).toBeFocused();
  await expect(page.getByText(govde.referans)).toBeVisible();
});

test("klavyeyle doldurulup Enter ile gönderilebilir", async ({ page, isMobile }) => {
  test.skip(isMobile, "Klavye akışı masaüstünde sınanıyor");
  await page.route("**/api/talepler", (r) =>
    r.fulfill({ status: 201, json: { ok: true, referans: "SR-99999", mesaj: "Talebiniz kaydedildi." } }),
  );
  await page.getByRole("link", { name: "Talep oluştur" }).focus();
  await page.keyboard.press("Enter");
  await page.getByLabel("Ad soyad").focus();
  await page.keyboard.type(GECERLI.ad);
  await page.keyboard.press("Tab");
  await page.keyboard.type(GECERLI.eposta);
  await page.keyboard.press("Tab");
  // Tab sırası: select'e klavyeyle ulaşılıyor. Yerel select'in açılır listesi
  // işletim sistemine göre farklı davrandığı için (macOS'ta ok tuşu listeyi açar)
  // değer API ile seçiliyor; select'in kendisi tarayıcıda klavyeyle kullanılabilir.
  const hizmet = page.getByLabel("Hangi hizmetle ilgileniyorsunuz?");
  await expect(hizmet).toBeFocused();
  await hizmet.selectOption({ label: GECERLI.hizmet });
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Açıklama")).toBeFocused();
  await page.keyboard.type(GECERLI.aciklama);
  await page.getByLabel("E-posta").press("Enter");
  await expect(page.getByRole("heading", { name: "Talebiniz kaydedildi" })).toBeVisible();
});

test("sunucu 503 dönerse başarı göstermez, hatayı açıklar, girilen bilgiler korunur", async ({ page }) => {
  await page.route("**/api/talepler", (r) =>
    r.fulfill({ status: 503, json: { ok: false, kod: "sunucu_hatasi", mesaj: "Talebiniz şu anda kaydedilemedi." } }),
  );
  await formuDoldur(page);
  await gonderButonu(page).click();

  await expect(page.getByRole("alert").filter({ hasText: "Talep gönderilemedi" })).toBeVisible();
  await expect(page.getByText("Talebiniz kaydedildi")).toHaveCount(0);
  await expect(page.getByLabel("Ad soyad")).toHaveValue(GECERLI.ad);
  await expect(page.getByLabel("Açıklama")).toHaveValue(GECERLI.aciklama);
});

test("sunucu ok:true dese bile referans yoksa başarı göstermez", async ({ page }) => {
  await page.route("**/api/talepler", (r) => r.fulfill({ status: 201, json: { ok: true } }));
  await formuDoldur(page);
  await gonderButonu(page).click();
  await expect(page.getByRole("alert").filter({ hasText: "Talep gönderilemedi" })).toBeVisible();
  await expect(page.getByText("Talebiniz kaydedildi")).toHaveCount(0);
});

test("ağ bağlantısı koparsa anlaşılır hata verir, bilgiler korunur", async ({ page }) => {
  await page.route("**/api/talepler", (r) => r.abort("internetdisconnected"));
  await formuDoldur(page);
  await gonderButonu(page).click();
  await expect(page.getByRole("alert").filter({ hasText: "Sunucuya ulaşılamadı" })).toBeVisible();
  await expect(page.getByLabel("E-posta")).toHaveValue(GECERLI.eposta);
});

test("gönderim sürerken buton kilitlenir, çift tıklama ikinci istek atmaz; tekrar denemede aynı anahtar kullanılır", async ({
  page,
}) => {
  const anahtarlar: string[] = [];
  let ilk = true;
  await page.route("**/api/talepler", async (r) => {
    anahtarlar.push(r.request().postDataJSON().istekAnahtari);
    await new Promise((c) => setTimeout(c, 800));
    if (ilk) {
      ilk = false;
      return r.fulfill({ status: 503, json: { ok: false, kod: "sunucu_hatasi", mesaj: "Geçici hata" } });
    }
    return r.fulfill({ status: 201, json: { ok: true, referans: "SR-12345", mesaj: "Talebiniz kaydedildi." } });
  });
  await formuDoldur(page);

  await gonderButonu(page).click();
  await expect(page.getByRole("button", { name: "Gönderiliyor…" })).toBeDisabled();
  await gonderButonu(page).click({ force: true });
  await expect(page.getByRole("alert").filter({ hasText: "Geçici hata" })).toBeVisible();
  expect(anahtarlar).toHaveLength(1);

  await gonderButonu(page).click();
  await expect(page.getByText("SR-12345")).toBeVisible();
  expect(anahtarlar).toHaveLength(2);
  expect(anahtarlar[1]).toBe(anahtarlar[0]);
});

test("hız sınırına takılınca kullanıcıya ne yapacağını söyler", async ({ page }) => {
  await page.route("**/api/talepler", (r) =>
    r.fulfill({
      status: 429,
      json: { ok: false, kod: "cok_fazla_istek", mesaj: "Kısa sürede çok fazla deneme yapıldı. Lütfen 10 dakika sonra tekrar deneyin." },
    }),
  );
  await formuDoldur(page);
  await gonderButonu(page).click();
  await expect(page.getByRole("alert").filter({ hasText: "10 dakika sonra" })).toBeVisible();
});

test("sunucu doğrulaması istemciyi atlasa bile alan hatalarını forma yansıtır", async ({ page }) => {
  await page.route("**/api/talepler", (r) =>
    r.fulfill({
      status: 422,
      json: { ok: false, kod: "dogrulama", mesaj: "x", alanlar: { eposta: ["Bu alan adından talep kabul edilmiyor."] } },
    }),
  );
  await formuDoldur(page);
  await gonderButonu(page).click();
  await expect(page.getByText("Bu alan adından talep kabul edilmiyor.").first()).toBeVisible();
  await expect(page.getByLabel("E-posta")).toHaveAttribute("aria-invalid", "true");
});
