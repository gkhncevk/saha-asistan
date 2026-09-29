# AI_LOG — SahaRehber

Bu dosya, çalışmada yapay zekayı nasıl kullandığımı, hangi öneriyi kabul ettiğimi, hangisini değiştirdiğimi ve sonucu nasıl doğruladığımı kayıt altına alır.

- **Süre başlangıcı:** 29.09.2026 15:52 (İstanbul)
- **Araç:** Claude Code (Claude Opus 5.5), masaüstü uygulaması. Kod üretimi, terminal komutları ve tarayıcıda test aynı oturumda yapıldı.
- **Ön hazırlık (süre başlamadan):** Neon hesabı ve boş bir Frankfurt projesi oluşturuldu, git e-postası ayarlandı. Ürün kodu süre başladıktan sonra yazıldı.

## Görev dağılımı

| Ben (Gökhan) | Claude |
|---|---|
| Hizmet konusunu seçmek, kapsam ve öncelik kararları | Seçenekleri ve riskleri sunmak |
| Teknoloji yığınını onaylamak | Kodu ve testleri yazmak |
| Üretilen kodu okuyup anlamak, sorular sormak | Her adımı gerçek komutla doğrulamak (test, curl, tarayıcı) |
| Canlı ortamı ve formu kendim denemek | README/AI_LOG taslağı |

## Kararlar

### 1. Hizmet konusu: üretim tesisleri için bakım/arıza asistanı
- Claude üç seçenek sundu: doküman/görev otomasyonu, gümrük sınıflandırma ön kontrolü (GTİP projeme dayalı), şirket içi RAG bilgi asistanı.
- **Reddettiğim:** GTİP'i reddettim; zaten bu alanda projem olduğu için hazır bir işi yeniden paketlemiş gibi görünmek istemedim. Görev metnindeki örnek (görev otomasyonu) de bana çok genel geldi; daha niş bir konu istedim.
- **Kabul ettiğim:** Niş bir konu isteyince Claude "üretim tesisleri için bakım ve arıza asistanı" fikrini önerdi, ben onayladım. İkna eden gerekçeler: somut bir kullanıcı var (sahadaki teknisyen); kullanıcı telefonla çalıştığı için mobil öncelik bir gereklilik hâline geliyor; "kaynak göster, bilmiyorsa söyle" ilkesi GTİP projemde önem verdiğim açıklanabilirlik yaklaşımının başka bir alana taşınması.

### 2. Teknoloji: Next.js 16 + Neon Postgres + Vercel (fra1)
- Tanıdığım araçlar, en az riskli canlıya alma yolu. Vercel'de dosya sistemi kalıcı olmadığı için SQLite/JSON dosyası **bilinçli olarak reddedildi**.
- Prisma yerine düz SQL (Neon tagged template): her sorguyu görüşmede satır satır açıklayabilmek için. Tagged template değerleri parametre olarak gönderir, SQL metnine eklemez.
- Next.js 16 kurulunca `AGENTS.md` "API'ler eğitim verinizden farklı olabilir" uyarısı verdi; Claude kod yazmadan önce `node_modules/next/dist/docs` altındaki Route Handler dokümanını okudu.

### 3. Tek doğrulama şeması (Zod) iki tarafta
- `src/lib/talep-schema.ts` hem formda hem API'de kullanılıyor. Sunucu istemciye güvenmiyor, her isteği yeniden doğruluyor.
- Aynı kurallar veritabanında `CHECK` kısıtı olarak da var (`db/schema.sql`): uygulama kodu hatalı olsa bile geçersiz veri tabloya giremez.
- Zod 4'ün API'si (trim, `z.email`, `flattenError`) eğitim verisine güvenilmeden gerçek pakette küçük bir `node -e` betiğiyle denendi.

### 4. Kötüye kullanım önlemleri
- **Hız sınırı:** aynı IP'den 10 dakikada en fazla 5 deneme. Sunucusuz ortamda bellek istekler arasında kalıcı olmadığı için sayaç **veritabanında** tutuluyor. Geçersiz denemeler de sayılıyor (doğrulamadan önce kaydediliyor).
- **IP adresi açık saklanmıyor:** gizli tuzla HMAC-SHA256 (`IP_HASH_SALT`).
- **Honeypot alanı:** Yaygın yaklaşım bota sahte "başarılı" dönmek; **bunu reddettim** çünkü görev "başarı mesajı yalnızca kayıt başarılı olduğunda" diyor. Bot 400 alıyor.
- **Çift kayıt önleme:** form her doldurma için bir `istekAnahtari` (UUID) üretiyor, DB'de `UNIQUE`. Ağ hatası sonrası tekrar gönderimde ikinci kayıt açılmıyor, aynı referans dönüyor.
- Gövde boyutu 10 KB ile sınırlı (413), JSON dışı içerik 415.

## Karşılaşılan sorunlar ve çözümler

- **npm bağımlılık çakışması:** Vitest 5, `@types/node >= 22` istiyordu; şablon 20 ile geliyordu. `--force`/`--legacy-peer-deps` ile geçiştirmek yerine `@types/node` sürümü, Vercel'in Node 24 çalışma ortamıyla uyumlu olacak şekilde 24'e yükseltildi.
- **Boş alan mesajı:** Tarayıcıda denerken boş "Ad soyad" alanı için "en az 2 karakter olmalı" mesajı çıktı; boş alan için daha anlaşılır "Lütfen adınızı ve soyadınızı yazın" mesajı eklendi.
- **Hata özeti yanlış zamanda çıkıyordu (E2E yakaladı):** "Hatalı alan düzeltilince hata kaybolur" testi, tek bir alandan çıkınca (blur) üstteki "şu alanları düzeltin" özetinin de belirdiğini gösterdi. Özet yalnızca gönderim denemesinden sonra görünmeli. `ozetAcik` durumu eklendi.
- **Klavye testi macOS'ta başarısız oldu, uygulama hatası değildi:** Kapalı `<select>` üzerinde ↓ tuşu macOS'ta listeyi açıyor, Windows'ta değeri değiştiriyor. İlk düzeltme denemesi (seçenek adını yazmak) da başarısız oldu, çünkü açılır liste odağı kaydırdı. Son hâli: select'e **Tab ile ulaşıldığı** doğrulanıyor, değer API ile seçiliyor. Yerel select'in klavye erişimi tarayıcının sorumluluğunda.
- **Gerçek kayıt E2E testi 429 aldı:** Art arda çalıştırmalarda hız sınırı devreye girdi; bu, sınırın çalıştığını da gösterdi. Test, yerelde rastgele bir belgeleme IP'si (203.0.113.x) gönderiyor. Bunun canlıda sınırı atlatmaya yaramadığı ayrıca doğrulandı (aşağıda).
- **README iddiası testle çürüdü:** README'ye "dokunma hedefleri ≥ 44 px" yazdıktan sonra bunu ölçen bir E2E testi eklendi; başlıktaki logo bağlantısı (32 px) ve gizli "Talep formuna geç" bağlantısı yakalandı. İkincisinde `px-4 py-3` sınıfları `sr-only`'nin `padding:0` kuralını eziyordu, bağlantı gizliyken 24 px yer kaplıyordu. Padding yalnızca odakta uygulanacak şekilde değiştirildi.
- **`vercel link` `.env.local`'ı güncelledi:** Değerlerin üzerine yazılıp yazılmadığı maskeli çıktıyla kontrol edildi; yalnızca `VERCEL_OIDC_TOKEN` eklenmişti, bizim değerler korunmuştu. Gizli değerler Vercel'e ekrana basılmadan dosyadan aktarıldı.
- **"Proje çok basit görünüyor" geri bildirimi:** Teslimi tamamlandıktan sonra sayfanın görsel olarak sade kaldığını düşündüm. Claude görselliğin ayrıca puanlanmadığını ama ilk izlenimin önemli olduğunu söyleyip 4 iyileştirme önerdi (ikonlar, animasyonlu örnek ekran, "bugün / SahaRehber ile" karşılaştırması, SSS). Gerçek bir AI sohbet özelliği eklemeyi ise kapsam dışı bıraktık: görev istemiyor, risk getiriyor, görüşmede açıklamam gereken kodu büyütüyor. Karşılaştırma bölümünde uydurma istatistik ("%60 daha hızlı" gibi) **bilinçli olarak kullanılmadı**; yalnızca süreç farkı anlatıldı.
- **Animasyon kodu hiç eklenmemişti, negatif kontrol yakaladı:** "Hareketi azalt" tercihi için bir test yazıldı ve geçti. Testin anlamlı olup olmadığını görmek için gecikmeyi sıfırlayan CSS kuralını kaldırıp tekrar çalıştırdık; test **yine geçti**. İnceleyince, önceki bir komut zincirinde `grep` 0 döndürdüğü için CSS'i ekleyen adımın hiç çalışmadığı ortaya çıktı. CSS eklendi; artık test kural varken geçiyor, kural kaldırılınca başarısız oluyor. Tarayıcıda da ölçüldü: 300 ms'de cevap opaklığı 0, 2 sn'de 1.
- **CI ilk çalıştırmada başarısız oldu:** `tsc` temiz ortamda `LayoutProps` tipini bulamadı. Bu tip Next.js'in `.next/types` altına ürettiği bir tip; yerelde `.next` olduğu için fark edilmemişti. Hata yerelde `.next` kaldırılarak aynen üretildi, CI'a `next typegen` adımı eklendi.

## Doğrulama adımları

| Ne | Nasıl | Sonuç |
|---|---|---|
| API iş mantığı | `npm test`: sahte depo ile 24 test (başarı, 422, 429, 503, honeypot, idempotency, 400/413/415) | 24/24 geçti |
| Testler gerçekten hata yakalıyor mu? | Koda kasıtlı hata eklendi: DB hatasında sahte `201 ok:true` dönmesi | İlgili test **kırmızıya döndü**; kod geri alındı, 24/24 |
| DB yokken sahte başarı yok | Gerçek dev sunucusuna `curl` ile POST, `DATABASE_URL` boşken | `HTTP 503`, `ok:false` |
| Tarayıcıda boş gönderim | Uygulama içi tarayıcıda boş form gönderildi | Hata özeti çıktı, odak özete gitti, 4 alan `aria-invalid=true` |
| Tarayıcıda sunucu hatası | Geçerli verilerle gönderim, DB bağlı değil | Kırmızı hata kutusu, başarı yok, girilen veriler formda korundu |
| Tip ve stil | `tsc --noEmit`, `eslint` | Hatasız |
| Gerçek kalıcı kayıt (yerel) | `curl` ile POST, ardından Neon'da `SELECT` | 201 `SR-00001`, satır DB'de; e-posta küçük harfe çevrilmiş, IP yalnızca hash |
| İdempotency (gerçek DB) | Aynı gövde + aynı `istekAnahtari` iki kez | 1. istek 201, 2. istek 200 ve **aynı** referans; tek satır |
| Hız sınırı (gerçek DB) | Aynı IP'den 6 geçersiz istek | `422 422 422 422 422 429` |
| DB kısıtları | Uygulamayı atlayıp Neon'a doğrudan geçersiz `INSERT` | `violates check constraint` ile reddedildi |
| Tarayıcıda başarılı akış | Uygulama içi tarayıcıda form dolduruldu | "Talebiniz kaydedildi", referans görüntülendi, odak başarı başlığında |
| Mobil | 375×812 görünüm, `scrollWidth` ölçümü | Yatay taşma yok |
| Uçtan uca | `npm run test:e2e` (Playwright, masaüstü + mobil) | 27 geçti, 3 bilinçli atlama (cihaza özel testler) |
| "Hareketi azalt" testi anlamlı mı? | Gecikmeyi sıfırlayan CSS kuralı kaldırılıp test tekrar çalıştırıldı | Kural yokken **başarısız**, varken geçiyor |
| **Canlı** kalıcı kayıt | `https://saha-asistani.vercel.app/api/talepler`'e POST, sonra Neon'da `SELECT` | 201 `SR-00011`, satır DB'de |
| **Canlı** bölge | Yanıttaki `x-vercel-id` başlığı | `fra1::fra1`: fonksiyon Frankfurt'ta, DB ile aynı bölge |
| **Canlı** IP taklidiyle sınırı atlatma | Her istekte farklı sahte `X-Forwarded-For` ve `X-Real-IP` ile 7 istek | 5 denemeden sonra 429: Vercel başlığı kendisi yazıyor, taklit işe yaramıyor |
| CI | GitHub Actions: lint, typegen, tsc, birim, build, Playwright | İlk çalıştırma `LayoutProps` nedeniyle başarısız → düzeltildi (yukarıda) |

## AI önerisini kabul etmediğim / değiştirdiğim yerler (özet)

- GTİP konusunu önerdi → reddettim, niş bir bakım asistanı konusu seçtim.
- Honeypot'ta bota sahte başarı dönmek yaygın bir kalıp → görevin "başarı yalnızca kayıt varsa" kuralıyla çeliştiği için 400 dönülüyor.
- Bağımlılık çakışmasında `--force` kolay yol → tip paketini gerçekten uyumlu sürüme yükselttik.
- Hız sınırını bellekte tutmak en basit yol → sunucusuz ortamda istekler arası kalıcı olmadığı için veritabanında.
- Klavye testinde ilk iki yaklaşım platforma bağlı çıktı → testin neyi kanıtlaması gerektiği yeniden tanımlandı (Tab sırası + Enter ile gönderim).
