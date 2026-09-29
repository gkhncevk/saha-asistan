# SahaRehber: bakım ve arıza asistanı talep sayfası

**Canlı adres:** https://saha-asistani.vercel.app

Üretim tesisleri için kurgusal bir hizmetin landing page'i ve talep formu. SahaRehber, makine kılavuzlarını ve arıza kayıtlarını sahadaki teknisyenin telefondan sorgulayabildiği, **her cevabın kaynağını gösteren** bir asistana dönüştürdüğünü anlatıyor. Ziyaretçinin talebi sunucuda doğrulanıp Postgres'e kalıcı olarak kaydediliyor.

> Hizmet, sayfadaki makine ve arıza örnekleri kurgusaldır. Yalnızca kurgusal test verisi kullanın.

- Yapay zeka kullanımı ve kararlar: [AI_LOG.md](AI_LOG.md)

## Teknoloji

| Katman | Seçim | Neden |
|---|---|---|
| Uygulama | Next.js 16 (App Router), TypeScript, Tailwind 4 | Sayfa ve API aynı projede, tek dağıtım |
| Doğrulama | Zod 4, **tek şema** (`src/lib/talep-schema.ts`) istemci ve sunucuda | Kurallar iki tarafta ayrışmaz |
| Veritabanı | Neon Postgres (Frankfurt), `@neondatabase/serverless` | Sunucusuz ortamda kalıcı kayıt; düz, parametreli SQL |
| Barındırma | Vercel, fonksiyon bölgesi `fra1` (`vercel.json`) | Veritabanıyla aynı bölge |
| Test | Vitest (birim/API), Playwright (uçtan uca, masaüstü + mobil) | |

Başlangıç şablonu: `create-next-app` (Next.js resmi şablonu). Şablondan yalnızca proje iskeleti ve yapılandırma kaldı; `src/`, `db/`, `scripts/`, `tests/` altındaki tüm dosyalar bu çalışma için yazıldı.

## Veri akışı

```
Tarayıcı (TalepFormu.tsx)
  1. Zod şemasıyla doğrula → hata varsa istek atma, hata özetini göster
  2. POST /api/talepler  { ad, eposta, hizmet, aciklama, istekAnahtari, website* }
        │                                     * honeypot, gerçek kullanıcı görmez
        ▼
API (src/lib/server/talep-handler.ts)
  3. Content-Type JSON mı? (415)  Gövde ≤ 10 KB mı? (413)  JSON geçerli mi? (400)
  4. IP'yi HMAC'le, denemeyi kaydet, son 10 dk'da > 5 ise → 429 + Retry-After
  5. Honeypot doluysa → 400 (bota sahte başarı dönülmez)
  6. Aynı Zod şemasıyla yeniden doğrula → 422 + alan bazlı hatalar
  7. INSERT … ON CONFLICT (istek_anahtari) DO NOTHING
        yeni kayıt → 201 { ok: true, referans: "SR-00012" }
        aynı anahtar tekrar → 200, aynı referans (ikinci kayıt yok)
        DB hatası → 503, ok:false (kişisel veri loglanmaz)
        ▼
Tarayıcı
  8. Başarı yalnızca: HTTP 200/201 VE ok:true VE referans varsa
     Diğer her durumda hata mesajı; girilen bilgiler formda kalır
```

## Güvenlik ve kötüye kullanım önlemleri

| Risk | Önlem | Nerede |
|---|---|---|
| İstemci doğrulamasını atlama | Sunucu her isteği aynı şemayla yeniden doğrular; DB'de `CHECK` kısıtları | `talep-handler.ts`, `db/schema.sql` |
| SQL injection | Tüm sorgular tagged template, değerler parametre olarak gider | `neon-depo.ts` |
| Form spam / kaba kuvvet | IP başına 10 dk'da 5 deneme (geçersizler dahil), sayaç DB'de | `talep-handler.ts`, `istek_denemeleri` |
| `X-Forwarded-For` taklidiyle sınırı atlama | Vercel başlığı kendisi yazıyor; canlıda sahte IP'lerle denendi, 429 geldi | AI_LOG doğrulama tablosu |
| Bot gönderimi | Honeypot alanı | `TalepFormu.tsx` |
| Çift tıklama / tekrar gönderim | İstemci UUID'si + DB `UNIQUE`; buton gönderim sırasında kilitli | |
| Büyük gövde | 10 KB sınırı | |
| Gizli bilgilerin sızması | `DATABASE_URL`, `IP_HASH_SALT` yalnızca ortam değişkeninde; `.env*` git dışı; `server-only` ile DB kodu istemci paketine giremez | |
| Kişisel veri | IP açık saklanmaz (HMAC-SHA256 + gizli tuz); hata loglarına form içeriği yazılmaz | |

## Erişilebilirlik ve kullanılabilirlik

- Her alanın görünür `<label>`'ı, ipucu ve hata metni `aria-describedby` ile bağlı; hatalı alan `aria-invalid`.
- Gönderimde hata varsa üstte **hata özeti** çıkar, odak özete taşınır; özetteki bağlantılar ilgili alana odaklar.
- Başarıda odak başarı başlığına taşınır; "gönderiliyor" durumu `aria-live` ile duyurulur.
- Görünür odak halkası (`:focus-visible`, 3 px), metin kontrastı WCAG AA (slate-700+ beyaz üzerinde), `prefers-reduced-motion` desteği.
- Mobil öncelikli: kullanıcı sahada telefonla. 375 px'te yatay taşma yok (E2E testi), dokunma hedefleri ≥ 44 px, e-posta alanında `inputMode="email"`.
- "Talep formuna geç" atlama bağlantısı, `lang="tr"`.
- Hero'daki örnek ekran animasyonu `prefers-reduced-motion` tercihinde kapanır (testli). SSS bölümü yerel `<details>` ile: klavye ve ekran okuyucu desteği tarayıcıdan gelir.
- İkonlar yalnızca süs amaçlı (`aria-hidden`), anlamı her zaman yanındaki metin taşır.

## Kurulum

Gereksinimler: Node.js 22+, bir Postgres veritabanı (ör. ücretsiz Neon projesi).

```bash
npm install
cp .env.example .env.local      # DATABASE_URL ve IP_HASH_SALT değerlerini doldurun
npm run db:migrate              # tabloları oluşturur (tekrar çalıştırmak güvenli)
npm run dev                     # http://localhost:3000
```

`IP_HASH_SALT` için: `openssl rand -hex 32`

## Testler

```bash
npm test                        # 24 birim/API testi (veritabanı gerekmez)
npm run test:e2e                # 15 senaryo × masaüstü/mobil = 30 test (27 çalışır, 3 cihaza özel atlanır)
BASE_URL=https://saha-asistani.vercel.app npm run test:e2e   # aynı testler canlıya karşı
npm run test:api                # Postman koleksiyonu (Newman), varsayılan olarak canlıya karşı
npm run test:api -- --env-var baseUrl=http://localhost:3000   # yerel sunucuya karşı
```

**Postman koleksiyonu:** [`postman/SahaRehber.postman_collection.json`](postman/SahaRehber.postman_collection.json). Postman'de *Import* ile içe aktarıp *Run collection* diyebilirsiniz. 8 istek ve 30 otomatik kontrol içerir: geçerli talep 201, aynı anahtarla tekrar 200 ve aynı referans, 422 alan hataları, honeypot 400, bozuk JSON 400, yanlış içerik türü 415, büyük gövde 413, GET 405, tüm yanıtlarda `no-store` ve 5 sn altı yanıt süresi. Koleksiyonda hız sınırına sayılan 4 istek var; aynı ağdan 10 dakika içinde iki kez çalıştırılırsa 429 alınması beklenir. Newman, eski alt bağımlılıkları `npm audit`'te 19 açık gösterdiği için projeye bağımlılık olarak eklenmedi, `npx` ile anlık çalıştırılıyor.

| Katman | Kapsanan senaryolar |
|---|---|
| Birim / API (`tests/unit`) | Başarılı kayıt 201 · DB hatasında 503 ve başarı yok · hız sınırı kaydı başarısızsa başarı yok · 422 alan hataları · eksik alanlı istek · yalnızca boşluk · idempotent tekrar · 429 + Retry-After · IP'ler birbirini etkilemez · honeypot · bozuk JSON 400 · yanlış içerik türü 415 · büyük gövde 413 · `no-store` · şema sınır değerleri |
| Uçtan uca (`tests/e2e`) | İçerik sırası · yatay taşma yok · mobilde dokunma hedefleri ≥ 44 px · ilk Tab'da atlama bağlantısı · "hareketi azalt" tercihinde animasyonsuz · boş gönderimde hata özeti + odak + istek atılmaz · hata düzeltilince kaybolur · **gerçek DB kaydı** ve referans · klavye ile gönderim · 503'te bilgiler korunur · `ok:true` ama referans yoksa başarı yok · ağ kopması · çift tıklama tek istek, tekrar denemede aynı anahtar · 429 mesajı · sunucu 422 hatasının forma yansıması |

CI (GitHub Actions): lint, tip kontrolü, birim testleri, build ve Playwright (CI'da DB olmadığı için yalnızca "gerçek kayıt" testi atlanır).

**Not:** Next.js 16 aynı klasörde ikinci bir `next dev` sürecine izin vermez. `npm run dev` açıkken `npm run test:e2e` çalıştırırsanız Playwright kendi sunucusunu başlatamaz. Açık sunucuyu kapatın ya da adresini verin: `BASE_URL=http://localhost:3001 npm run test:e2e`. Ayrıca `next dev` açıkken aynı klasörde `next build` çalıştırmayın; ikisi `.next/` klasörünü paylaşır ve dev sunucusu bozulabilir.

Hız sınırı canlıda da geçerli: aynı ağdan 10 dakikada 5'ten fazla gönderim yapılırsa 429 alınır. Canlıya karşı E2E çalıştırırken bu sınıra dikkat edin.

## Bilinen eksikler ve bilinçli tercihler

- **E-posta gönderilmiyor.** Talep yalnızca veritabanına kaydediliyor; başarı ekranı bunu açıkça söylüyor.
- **Talepleri görüntüleyen bir yönetim paneli yok.** Kayıtlar Neon konsolundan ya da SQL ile görülebilir. Kimlik doğrulamalı bir panel kapsam dışı bırakıldı.
- **Hız sınırı IP bazlı.** Aynı NAT arkasındaki (ör. fabrika ağı) kullanıcılar sınırı paylaşır; 10 dakikada 5 deneme gerçek kullanım için yeterli görüldü. Eşzamanlı isteklerde sayım en fazla birkaç istek sapabilir (atomik sayaç değil).
- **`istek_denemeleri` tablosu temizlenmiyor.** Üretimde periyodik bir silme işi (ör. 1 günden eski kayıtlar) gerekir.
- **Zaman aşımından sonra formu düzenleyip tekrar gönderme:** İstek anahtarı yalnızca başarılı kayıttan sonra yenilendiği için, ilk istek sunucuda gerçekte kaydedilmiş ama yanıtı kaybolmuşsa, kullanıcının düzenleyip tekrar gönderdiği içerik yeni kayıt açmaz; eski kaydın referansı döner. Çözüm: alan değiştiğinde anahtarı yenilemek ya da sunucuda aynı anahtar ve farklı içerik için 409 Conflict dönmek.
- **Referans numaraları ardışık olmayabilir.** Postgres, reddedilen/tekrarlanan INSERT'lerde de sıra numarası tüketir; referans yalnızca benzersizdir.
- **Tek (açık) tema.** Kontrastı tek yerden garanti etmek için karanlık tema eklenmedi.
- **Hero'daki telefon ekranı statik bir örnektir**, gerçek yapay zeka çağrısı yapılmaz.

## Proje yapısı

```
src/app/page.tsx                  Landing page içeriği
src/app/api/talepler/route.ts     POST endpoint (ince katman)
src/components/TalepFormu.tsx     Form, durumlar, erişilebilirlik
src/lib/talep-schema.ts           Ortak Zod şeması (istemci + sunucu)
src/lib/server/talep-handler.ts   API iş mantığı (bağımlılıklar enjekte edilir → test edilebilir)
src/lib/server/neon-depo.ts       SQL sorguları, IP HMAC
db/schema.sql                     Tablolar ve CHECK kısıtları
scripts/migrate.mjs               Şemayı veritabanına uygular
tests/unit, tests/e2e             Vitest ve Playwright testleri
```
