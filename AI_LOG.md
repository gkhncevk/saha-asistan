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
- **Değiştirdiğim:** GTİP'i reddettim; zaten bu alanda projem olduğu için hazır bir işi yeniden paketlemiş gibi görünmek istemedim. Görev metnindeki örnek (görev otomasyonu) çok genel kaldı.
- **Seçtiğim:** Sahadaki bakım teknisyenine yönelik, cevabın kaynağını gösteren asistan. Neden: niş ve somut bir kullanıcı var; kullanıcı sahada telefonla çalıştığı için mobil öncelik bir gereklilik hâline geliyor; "kaynak göster, bilmiyorsa söyle" ilkesi GTİP projemde öğrendiğim açıklanabilirlik yaklaşımının başka bir alana taşınması.

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

## Doğrulama adımları

| Ne | Nasıl | Sonuç |
|---|---|---|
| API iş mantığı | `npm test`: sahte depo ile 24 test (başarı, 422, 429, 503, honeypot, idempotency, 400/413/415) | 24/24 geçti |
| Testler gerçekten hata yakalıyor mu? | Koda kasıtlı hata eklendi: DB hatasında sahte `201 ok:true` dönmesi | İlgili test **kırmızıya döndü**; kod geri alındı, 24/24 |
| DB yokken sahte başarı yok | Gerçek dev sunucusuna `curl` ile POST, `DATABASE_URL` boşken | `HTTP 503`, `ok:false` |
| Tarayıcıda boş gönderim | Uygulama içi tarayıcıda boş form gönderildi | Hata özeti çıktı, odak özete gitti, 4 alan `aria-invalid=true` |
| Tarayıcıda sunucu hatası | Geçerli verilerle gönderim, DB bağlı değil | Kırmızı hata kutusu, başarı yok, girilen veriler formda korundu |
| Tip ve stil | `tsc --noEmit`, `eslint` | Hatasız |
