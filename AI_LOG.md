# AI_LOG — SahaRehber

Bu dosya, çalışmada yapay zekayı nasıl kullandığımı, hangi öneriyi kabul ettiğimi, hangisini değiştirdiğimi ve sonucu nasıl doğruladığımı kayıt altına alır.

- **Süre başlangıcı:** 29.09.2026 15:52 (İstanbul)
- **Araç:** Claude Code (Claude Opus 5.5), masaüstü uygulaması. Kod üretimi, terminal komutları ve tarayıcıda test aynı oturumda yapıldı.
- **Commit geçmişi:** Commit'leri Claude Code benim hesabımla attı. Commit mesajlarındaki `Co-Authored-By: Claude` satırlarını teslimden önce kaldırdım (dosya içerikleri değişmedi); yapay zekanın katkısı bu dosyada ayrıntılı olarak belgelenmiştir.
- **Ön hazırlık (süre başlamadan):** Neon hesabı ve boş bir Frankfurt projesi oluşturuldu, git e-postası ayarlandı. Ürün kodu süre başladıktan sonra yazıldı.

## Süre (dürüst döküm)

Commit saatlerine göre (29.09.2026):

| Zaman | İş | Yaklaşık süre |
|---|---|---|
| 15:52–17:05 | Çekirdek ürün: form, API, veritabanı, birim + E2E testleri, CI, canlıya alma, README/AI_LOG | ~1 sa 15 dk |
| 17:05–18:02 | Postman koleksiyonu (API testleri) | ~1 sa |
| 18:00–23:00 arası | Ara verdim; bu sürede ayrıca Postman'i öğrenip kendi testlerimi yazdım (öğrenme amaçlı, ürüne kod eklemedi) | ürün emeğine sayılmadı |
| 23:00–23:47 | İki tur arayüz iyileştirmesi, formun yukarı taşınması | ~45 dk |

**Ürüne harcanan aktif emek: yaklaşık 3 saat.** Görev tanımındaki 3–4 saatlik hedefin içinde. Bunun dışında kodu anlamak için Claude'a repo dışında ayrı bir öğrenme rehberi hazırlattım.

## Görev dağılımı

| Ben (Gökhan) | Claude |
|---|---|
| Hizmet konusunu seçmek, kapsam ve öncelik kararları | Seçenekleri ve riskleri sunmak |
| Teknoloji yığınını onaylamak | Kodu ve testleri yazmak |
| Testleri kendi makinemde çalıştırmak, API'yi Postman ile kendim test etmek | Her adımı gerçek komutla doğrulamak (test, curl, tarayıcı) |
| Kodu anlamak: Claude'a hazırlattığım öğrenme rehberiyle sürüyor | README/AI_LOG taslağı |

## Kararlar

### 1. Hizmet konusu: üretim tesisleri için bakım/arıza asistanı
- Claude üç seçenek sundu: doküman/görev otomasyonu, gümrük sınıflandırma ön kontrolü (GTİP projeme dayalı), şirket içi RAG bilgi asistanı.
- **Reddettiğim:** GTİP'i reddettim; zaten bu alanda projem olduğu için hazır bir işi yeniden paketlemiş gibi görünmek istemedim. Görev metnindeki örnek (görev otomasyonu) de bana çok genel geldi; daha niş bir konu istedim.
- **Kabul ettiğim:** Niş bir konu isteyince Claude "üretim tesisleri için bakım ve arıza asistanı" fikrini önerdi, ben onayladım. İkna eden gerekçeler: somut bir kullanıcı var (sahadaki teknisyen); kullanıcı telefonla çalıştığı için mobil öncelik bir gereklilik hâline geliyor; "kaynak göster, bilmiyorsa söyle" ilkesi GTİP projemde önem verdiğim açıklanabilirlik yaklaşımının başka bir alana taşınması.

### 2. Teknoloji: Next.js 16 + Neon Postgres + Vercel (fra1)
- Tanıdığım araçlar, en az riskli canlıya alma yolu. Vercel'de dosya sistemi kalıcı olmadığı için SQLite/JSON dosyası **bilinçli olarak reddedildi**.
- Prisma yerine düz SQL (Neon tagged template): her sorguyu görüşmede satır satır açıklayabilmek için. Tagged template değerleri parametre olarak gönderir, SQL metnine eklemez.
- Next.js 16 kurulunca şablonla gelen `AGENTS.md` (teslimden önce `.claude/` ayar klasörüyle birlikte repodan kaldırıldı, `next.config.ts` içinde `agentRules: false`) "API'ler eğitim verinizden farklı olabilir" uyarısı verdi; Claude kod yazmadan önce `node_modules/next/dist/docs` altındaki Route Handler dokümanını okudu.

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
- **İkinci görsel tur, kendi projemi referans gösterdim:** Sayfayı hâlâ sade bulup Claude'a önceki bir projemi (ynsocial klinik listesi) örnek olarak verdim. Claude kaynak kodunu ve ekran görüntüsünü inceleyip oradaki dili uyarladı: serif başlık (Source Serif 4) + Inter gövde, başlıkta italik vurgu, koyu hero bandı, hero'da yarı saydam kutucuklar, sol kenarı vurgulu kartlar. **Almadığımız:** o projedeki sayısal istatistik kutucukları (ör. "24 doğrulanmış klinik"). Bu hizmet kurgusal olduğu için sayılar uydurma olurdu; kutucuklara sayı yerine özellik yazıldı. Ekran görüntüsünde telefon mockup'ının paneldeki durum etiketlerini kapattığı ve serif başlığın 5 satıra taşdığı görüldü; yerleşim ve boyut düzeltildi. Sonra birim + E2E testleri yeniden çalıştırıldı (24/24, 27/27).
- **Formu yukarı taşıdım, şablon kalıplarını azalttım (benim kararım):** Formun sayfanın en altında kaldığını ve sayfanın "hazır AI şablonu" gibi göründüğünü düşündüm. Claude seçenekleri sundu; ben şunları seçtim: form "Nasıl çalışır?"ın hemen arkasına taşındı (güven ve SSS formun altına), hero'daki ızgara/ışıma efekti, başlık üstündeki hap etiket ve bölümlerin büyük harfli etiketleri kaldırıldı. Yerine alana özgü bir dokunuş olarak hero altına sarı-siyah iş güvenliği şeridi eklendi. Formu hero'ya koyma seçeneğini seçmedim: ziyaretçi neyi talep ettiğini bilmeden forma gelmesin. E2E'deki içerik sırası testi yeni sıraya göre güncellendi (form, "Nasıl çalışır?"ın hemen arkasında olmalı).
- **Yorumları silme fikrinden vazgeçtim:** Koddaki yorumları silmek istedim; Claude yorumların "ne"yi değil "neden"i anlattığını (ör. hız sınırının doğrulamadan önce sayılması, honeypot'ta sahte başarı dönülmemesi) ve değerlendirmede kararların görünür olmasının önemli olduğunu söyledi. Yorumlar kaldı.
- **Animasyon kodu hiç eklenmemişti, negatif kontrol yakaladı:** "Hareketi azalt" tercihi için bir test yazıldı ve geçti. Testin anlamlı olup olmadığını görmek için gecikmeyi sıfırlayan CSS kuralını kaldırıp tekrar çalıştırdık; test **yine geçti**. İnceleyince, önceki bir komut zincirinde `grep` 0 döndürdüğü için CSS'i ekleyen adımın hiç çalışmadığı ortaya çıktı. CSS eklendi; artık test kural varken geçiyor, kural kaldırılınca başarısız oluyor. Tarayıcıda da ölçüldü: 300 ms'de cevap opaklığı 0, 2 sn'de 1.
- **Postman koleksiyonu (API testleri), iki bulgu:** (1) İlk Newman çalıştırmasında "yanıt süresi < 5 sn" kontrolü başarısız oldu (6,3 sn). Neden Next.js dev sunucusunun route'u ilk istekte derlemesiydi; ısınmış sunucuda 401 ms, canlıda ortalama 266 ms. Eşik korundu. (2) İkinci çalıştırmada 429'lar geldi: yereldeki rastgele test IP'sini ekleyen script `pm.collectionVariables.get('baseUrl')` ile koleksiyonun varsayılan (canlı) adresine bakıyordu, Newman'a `--env-var` ile verilen `localhost`'u görmüyordu. `pm.variables.get` (tüm değişken katmanlarını çözer) ile düzeltildi. Sonuç: yerelde ve canlıda 30/30 kontrol.
- **Newman bağımlılık olarak eklenmedi:** `npm i -D newman` sonrası `npm audit` 19 açık (1 kritik) gösterdi; hepsi Newman'ın eski alt bağımlılıklarındaydı. Açıklı paketleri projeye sokmak yerine bağımlılık geri alındı (`found 0 vulnerabilities`), Newman `npx` ile anlık çalıştırılıyor.
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
| API testleri (Postman/Newman) | `npm run test:api` yerel ve canlı | 8 istek, 30/30 kontrol; canlı ortalama yanıt 266 ms |
| CI | GitHub Actions: lint, typegen, tsc, birim, build, Playwright | İlk çalıştırma `LayoutProps` nedeniyle başarısız → düzeltildi (yukarıda) |

## AI önerisini kabul etmediğim / değiştirdiğim yerler (özet)

- GTİP konusunu önerdi → reddettim, niş bir bakım asistanı konusu seçtim.
- Honeypot'ta bota sahte başarı dönmek yaygın bir kalıp → görevin "başarı yalnızca kayıt varsa" kuralıyla çeliştiği için 400 dönülüyor.
- Bağımlılık çakışmasında `--force` kolay yol → tip paketini gerçekten uyumlu sürüme yükselttik.
- Hız sınırını bellekte tutmak en basit yol → sunucusuz ortamda istekler arası kalıcı olmadığı için veritabanında.
- Klavye testinde ilk iki yaklaşım platforma bağlı çıktı → testin neyi kanıtlaması gerektiği yeniden tanımlandı (Tab sırası + Enter ile gönderim).

## Benim kontrollerim (Gökhan)

- **Testleri kendi terminalimde çalıştırdım (29.09.2026, 16:54–16:58):** `npm test` 24/24; `npm run test:e2e` 27 geçti, 3 bilinçli atlama; `npx playwright test --headed --project=masaustu` ile testlerin tarayıcıda formu doldurup gönderişini izledim, 14 geçti.
- **API'yi Postman ile kendim test ettim.** Postman'i kurup canlı API'ye ilk isteklerimi elle gönderdim:
  - İlk denemede yöntemi `GET` bıraktığım için **405 Method Not Allowed** aldım. Sunucunun doğru davrandığını, hatanın benim isteğimde olduğunu gördüm; `POST` ile **201** ve `SR-00036` referansı döndü.
  - Geçersiz alanlarla gönderdim: **422**, dört alanın hatası ayrı ayrı listelendi; cevapta `referans` yoktu.
  - Bu isteğe dört otomatik test yazdım (`pm.test`): durum 422, `ok` false, `kod` "dogrulama", `referans` alanı yok. Yazarken parantez hataları yaptım ve düzelttim. Bir testte `pm.response.to.not.have.property("")` yazmıştım; Claude bunun **her zaman geçen, hiçbir şeyi kontrol etmeyen** bir test olduğunu gösterdi, düzelttik.
  - **Negatif kontrol:** Beklenen değeri bilerek `"yanlis"` yaptım; test `AssertionError: expected 'dogrulama' to equal 'yanlis'` ile kırmızıya döndü, diğer üç test yeşil kaldı. Geri aldım.
  - Postman'in yapay zekası 422 yanıtını görünce "Fix request body validation errors" önerdi; **reddettim**, çünkü 422 bilerek ürettiğimiz beklenen sonuçtu.
  - Hazır koleksiyonu içe aktardım; içe aktarımda istek sırasının değiştiğini (6. istek 2 ile 3 arasına girdi) fark ettik. 1. ve 2. istek birbirine bağımlı (2, 1'in kaydettiği istek anahtarını kullanıyor), diğerleri bağımsız olduğu için sonuç etkilenmiyor.
- **Tasarım için kendi projemi referans verdim:** Sayfayı sade bulunca önceki projemi (ynsocial klinik listesi) örnek gösterdim; tipografi ve kart dili oradan uyarlandı (yukarıda).
- **Karşılaştığım sorun:** İlk denemede E2E başlamadı: "Another next dev server is already running". Ben ayrı bir terminalde `npm run dev` çalıştırmıştım, arka planda Claude'un sunucusu da açıktı; Next.js 16 aynı klasörde ikinci `next dev`'e izin vermiyor. Claude'un sunucusu ayrıca `.next` klasörü üzerinde `build` çalıştırıldığı için bozulmuş, 404 dönüyordu; kapatıldı. README'ye not eklendi.
