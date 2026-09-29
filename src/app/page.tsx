import Ikon, { type IkonAdi } from "@/components/Ikon";
import TalepFormu from "@/components/TalepFormu";

// İçerik sırası: ne yapıyoruz → hangi sorunu çözüyoruz → bugün/yarın farkı →
// kimin için → nasıl çalışıyor → neden güvenilir → sık sorulanlar → talep.
// Ziyaretçi forma geldiğinde neyi talep ettiğini bilsin diye form en sonda,
// ama her yerden tek tıkla ulaşılabilir.

const sorunlar: { ikon: IkonAdi; baslik: string; metin: string }[] = [
  {
    ikon: "dokuman",
    baslik: "Cevap yüzlerce sayfalık PDF'te",
    metin:
      "Makine durduğunda teknisyen, arıza kodunun anlamını ve çözüm adımlarını üretici kılavuzlarında sayfa sayfa arıyor. Üstelik çoğu zaman sahada, elinde yalnızca telefonuyla.",
  },
  {
    ikon: "kisiler",
    baslik: "Bilgi kişilerde kalıyor",
    metin:
      "Hangi arızanın nasıl çözüldüğü deneyimli ustaların hafızasında. O kişi izinde ya da vardiya dışındaysa aynı sorun baştan çözülüyor.",
  },
  {
    ikon: "gecmis",
    baslik: "Geçmiş arızalar tekrar kullanılmıyor",
    metin:
      "Arıza kayıtları bakım yazılımında ya da Excel'de birikiyor ama bir sonraki arızada kimse onlara bakmıyor.",
  },
];

const bugun = [
  "Makinenin kılavuzunu bul (klasörde mi, e-postada mı, üreticinin sitesinde mi?)",
  "Yüzlerce sayfalık PDF'te arıza kodunu ara",
  "Bulamazsan deneyimli ustayı telefonla ara, müsait olmasını bekle",
  "Çözüm bir deftere ya da hiçbir yere yazılmaz",
];

const saharehberIle = [
  "Telefondan arıza kodunu veya belirtiyi yaz",
  "Önce güvenlik uyarısını, sonra adım adım çözümü gör",
  "Kaynağa dokunup kılavuzun ilgili sayfasını aç, doğrula",
  "Çözüm arıza kaydına eklenir, bir sonraki teknisyen de görür",
];

const kimlerIcin: { ikon: IkonAdi; rol: string; fayda: string }[] = [
  {
    ikon: "anahtar",
    rol: "Bakım teknisyeni",
    fayda: "Arıza kodunu ya da belirtiyi yazar, adım adım çözümü ve kaynağını telefonunda görür.",
  },
  {
    ikon: "pano",
    rol: "Bakım şefi",
    fayda: "Ekibin hangi arızalarda takıldığını görür; deneyimli ustaların bilgisini tüm vardiyalara taşır.",
  },
  {
    ikon: "fabrika",
    rol: "Tesis / üretim müdürü",
    fayda: "Duruş süresini kısaltmaya yönelik somut bir araç edinir; mevcut bakım yazılımını değiştirmek zorunda kalmaz.",
  },
];

const adimlar: { ikon: IkonAdi; baslik: string; metin: string }[] = [
  {
    ikon: "yukle",
    baslik: "Dokümanlarınızı topluyoruz",
    metin: "Makine kılavuzları, bakım talimatları ve geçmiş arıza kayıtları, bugün hangi formatta duruyorsa oradan alınır.",
  },
  {
    ikon: "ayar",
    baslik: "Asistanı tesisinize göre kuruyoruz",
    metin: "Makinelerinize, arıza kodlarınıza ve kendi terminolojinize göre ayarlanır; ekibinizle birlikte test edilir.",
  },
  {
    ikon: "telefon",
    baslik: "Ekibiniz sahadan soruyor",
    metin: "Teknisyen telefondan sorar; asistan cevabı hangi dokümanın hangi sayfasından aldığını göstererek verir.",
  },
];

const ilkeler: { ikon: IkonAdi; baslik: string; metin: string }[] = [
  {
    ikon: "kaynak",
    baslik: "Her cevabın kaynağı görünür",
    metin: "Adımlar, dayandığı kılavuz sayfası ya da arıza kaydıyla birlikte gösterilir; teknisyen tek dokunuşla doğrulayabilir.",
  },
  {
    ikon: "soru",
    baslik: "Bilmiyorsa bilmediğini söyler",
    metin: "Dokümanlarda dayanak bulamadığında tahmin yürütmez, sorunun bir uzmana yönlendirilmesini önerir.",
  },
  {
    ikon: "kalkan",
    baslik: "Güvenlik talimatı önce gelir",
    metin: "Kılavuzdaki kilitleme-etiketleme (LOTO) ve güvenlik uyarıları, çözüm adımlarından önce gösterilir.",
  },
];

const sss = [
  {
    soru: "Hangi doküman türleriyle çalışıyor?",
    cevap:
      "Üretici kılavuzları (PDF), taranmış eski kılavuzlar, bakım talimatları ve arıza kayıtları (Excel, CSV ya da bakım yazılımınızın dışa aktarımı). Taranmış belgeler metne dönüştürülerek eklenir.",
  },
  {
    soru: "Verilerimiz nerede tutuluyor?",
    cevap:
      "Kurulum tesisinizin tercihine göre yapılır: kendi sunucularınızda ya da Türkiye veya AB'deki bir bulut bölgesinde. Dokümanlarınız başka bir müşterinin asistanında kullanılmaz.",
  },
  {
    soru: "Mevcut bakım yazılımımızı (CMMS) değiştirmemiz gerekir mi?",
    cevap:
      "Hayır. Asistan, mevcut yazılımınızdaki arıza kayıtlarını okuyacak şekilde entegre edilir; ekibiniz alışık olduğu sistemi kullanmaya devam eder.",
  },
  {
    soru: "Asistan yanlış bir cevap verirse ne olur?",
    cevap:
      "Her cevap kaynağıyla gösterildiği için teknisyen adımları kılavuzdan doğrulayabilir. Dayanak bulunamayan sorularda asistan tahmin yürütmez, konunun bir uzmana iletilmesini önerir. Teknisyenler hatalı cevapları tek dokunuşla işaretleyebilir.",
  },
];

function Bolum({
  id,
  baslikId,
  baslik,
  ust,
  children,
  className = "",
}: {
  id?: string;
  baslikId: string;
  baslik: string;
  ust?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={baslikId} className={`scroll-mt-20 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        {ust && <p className="font-semibold uppercase tracking-wide text-amber-800">{ust}</p>}
        <h2 id={baslikId} className="mt-2 max-w-3xl text-3xl font-bold text-slate-950 sm:text-4xl">
          {baslik}
        </h2>
        {children}
      </div>
    </section>
  );
}

export default function Sayfa() {
  return (
    <>
      <a
        href="#talep"
        className="sr-only z-50 rounded-lg bg-slate-900 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:px-4 focus:py-3"
      >
        Talep formuna geç
      </a>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="#" className="flex min-h-11 items-center gap-2 text-lg font-bold text-slate-900">
            <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-lg bg-amber-400 text-slate-950">
              <Ikon ad="anahtar" className="h-5 w-5" />
            </span>
            SahaRehber
          </a>
          <nav aria-label="Ana menü" className="flex items-center gap-1 sm:gap-2">
            <a href="#nasil" className="hidden min-h-11 items-center px-3 text-slate-800 hover:underline md:inline-flex">
              Nasıl çalışır?
            </a>
            <a href="#sss" className="hidden min-h-11 items-center px-3 text-slate-800 hover:underline md:inline-flex">
              Sık sorulanlar
            </a>
            <a
              href="#talep"
              className="inline-flex min-h-11 items-center rounded-lg bg-slate-900 px-4 font-semibold text-white hover:bg-slate-700"
            >
              Talep oluştur
            </a>
          </nav>
        </div>
      </header>

      <main id="icerik" className="flex-1">
        {/* 1. Değer önerisi */}
        <section aria-labelledby="hero-baslik" className="relative overflow-hidden bg-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,#fef3c7_0,transparent_45%),radial-gradient(circle_at_10%_90%,#e2e8f0_0,transparent_40%)]"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-20">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-900">
                <Ikon ad="fabrika" className="h-4 w-4" />
                Üretim tesisleri için yapay zeka destekli bakım asistanı
              </p>
              <h1 id="hero-baslik" className="mt-5 text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
                Arıza kodunu yazın, çözüm adımlarını <span className="text-amber-700">kaynağıyla birlikte</span> görün.
              </h1>
              <p className="mt-5 text-lg text-slate-700">
                SahaRehber, tesisinizin makine kılavuzlarını ve geçmiş arıza kayıtlarını sahadaki teknisyenin telefondan
                sorgulayabildiği bir asistana dönüştürür. Her cevap, alındığı dokümanın sayfasını gösterir.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#talep"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-slate-900 px-6 py-3 text-lg font-semibold text-white hover:bg-slate-700"
                >
                  Keşif görüşmesi talep et
                </a>
                <a
                  href="#nasil"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-slate-900 bg-white px-6 py-3 text-lg font-semibold text-slate-900 hover:bg-slate-100"
                >
                  Nasıl çalışır?
                </a>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
                {["Kaynak gösteren cevaplar", "Mevcut CMMS ile çalışır", "Sahada, telefondan"].map((m) => (
                  <li key={m} className="flex items-center gap-1.5">
                    <Ikon ad="tik" className="h-4 w-4 text-emerald-700" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>

            {/* Ürün fikrini anlatan statik örnek ekran (gerçek bir yapay zeka çağrısı yapılmaz). */}
            <figure className="mx-auto w-full max-w-sm">
              <div className="rounded-[2.5rem] border-[10px] border-slate-900 bg-slate-100 shadow-2xl">
                <div className="flex items-center justify-between rounded-t-[1.9rem] bg-slate-900 px-5 pb-2 pt-1 text-xs text-slate-300">
                  <span>09:41</span>
                  <span className="h-1.5 w-16 rounded-full bg-slate-700" aria-hidden="true" />
                  <span>Hat 2 · Pres</span>
                </div>
                <div className="space-y-3 p-4">
                  <p className="saha-belir ml-8 rounded-2xl rounded-br-sm bg-slate-900 px-4 py-3 text-sm text-white">
                    HX-400 presinde E-217 hatası var, hidrolik basınç düşük.
                  </p>
                  <div className="saha-belir saha-gecikme-1 rounded-2xl rounded-bl-sm border border-slate-300 bg-white p-4 text-sm text-slate-800 shadow-sm">
                    <p className="flex items-start gap-2 rounded-lg bg-red-50 p-2 font-semibold text-red-800">
                      <Ikon ad="uyari" className="mt-0.5 h-4 w-4 shrink-0" />
                      Önce makineyi durdurup kilitleyin (LOTO).
                    </p>
                    <ol className="mt-3 list-decimal space-y-1.5 pl-5">
                      <li>Hidrolik yağ seviyesini gösterge camından kontrol edin.</li>
                      <li>Pompa emiş filtresinde tıkanma olup olmadığına bakın.</li>
                      <li>Basınç ayar valfini kılavuzdaki değere göre kontrol edin.</li>
                    </ol>
                    <div className="saha-belir saha-gecikme-2 mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">
                        <Ikon ad="kaynak" className="h-3.5 w-3.5" />
                        HX-400 Bakım Kılavuzu · s. 212
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800">
                        <Ikon ad="gecmis" className="h-3.5 w-3.5" />
                        Arıza kaydı #1843
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <figcaption className="mt-4 text-center text-sm text-slate-700">
                Örnek ekran: kurgusal makine ve veriler.
              </figcaption>
            </figure>
          </div>
        </section>

        {/* 2. Sorun */}
        <Bolum baslikId="sorun-baslik" ust="Sorun" baslik="Makine durduğunda zaman kılavuzda kayboluyor">
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {sorunlar.map((s) => (
              <li key={s.baslik} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-slate-800">
                  <Ikon ad={s.ikon} />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-950">{s.baslik}</h3>
                <p className="mt-2 text-slate-700">{s.metin}</p>
              </li>
            ))}
          </ul>
        </Bolum>

        {/* 3. Bugün / SahaRehber ile */}
        <Bolum baslikId="fark-baslik" ust="Fark" baslik="Aynı arıza, iki farklı sabah" className="bg-white">
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-300 bg-slate-50 p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Ikon ad="arama" className="h-5 w-5" />
                Bugün
              </h3>
              <ol className="mt-4 space-y-3">
                {bugun.map((m) => (
                  <li key={m} className="flex gap-3 text-slate-700">
                    <Ikon ad="carpi" className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
                    {m}
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-xl border-2 border-emerald-700 bg-emerald-50 p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-emerald-900">
                <Ikon ad="telefon" className="h-5 w-5" />
                SahaRehber ile
              </h3>
              <ol className="mt-4 space-y-3">
                {saharehberIle.map((m) => (
                  <li key={m} className="flex gap-3 text-slate-800">
                    <Ikon ad="tik" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                    {m}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Bolum>

        {/* 4. Kimin için */}
        <Bolum baslikId="kim-baslik" ust="Kimin için" baslik="Kimin işini kolaylaştırır?">
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {kimlerIcin.map((k) => (
              <li key={k.rol} className="flex gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-amber-400 text-slate-950">
                  <Ikon ad={k.ikon} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">{k.rol}</h3>
                  <p className="mt-1 text-slate-700">{k.fayda}</p>
                </div>
              </li>
            ))}
          </ul>
        </Bolum>

        {/* 5. Nasıl çalışır */}
        <Bolum id="nasil" baslikId="nasil-baslik" ust="Süreç" baslik="Nasıl çalışır?" className="bg-white">
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {adimlar.map((a, i) => (
              <li key={a.baslik} className="relative rounded-xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid h-10 w-10 place-items-center rounded-full bg-slate-900 font-bold text-white"
                  >
                    {i + 1}
                  </span>
                  <Ikon ad={a.ikon} className="h-6 w-6 text-slate-700" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-950">{a.baslik}</h3>
                <p className="mt-2 text-slate-700">{a.metin}</p>
              </li>
            ))}
          </ol>
        </Bolum>

        {/* 6. Güven */}
        <section aria-labelledby="ilke-baslik" className="bg-slate-900 text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
            <p className="font-semibold uppercase tracking-wide text-amber-300">İlkeler</p>
            <h2 id="ilke-baslik" className="mt-2 text-3xl font-bold sm:text-4xl">
              Sahada güvenilebilecek bir asistan
            </h2>
            <ul className="mt-10 grid gap-8 md:grid-cols-3">
              {ilkeler.map((ilke) => (
                <li key={ilke.baslik}>
                  <Ikon ad={ilke.ikon} className="h-8 w-8 text-amber-300" />
                  <h3 className="mt-3 text-lg font-semibold text-amber-300">{ilke.baslik}</h3>
                  <p className="mt-2 text-slate-200">{ilke.metin}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 7. Sık sorulanlar: yerel <details>, klavye ve ekran okuyucu desteği tarayıcıdan gelir */}
        <Bolum id="sss" baslikId="sss-baslik" ust="Sık sorulanlar" baslik="Aklınıza takılabilecekler">
          <div className="mt-10 max-w-3xl divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {sss.map((s) => (
              <details key={s.soru} className="group p-5">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-950 [&::-webkit-details-marker]:hidden">
                  {s.soru}
                  <span
                    aria-hidden="true"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-xl leading-none text-slate-700 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-slate-700">{s.cevap}</p>
              </details>
            ))}
          </div>
        </Bolum>

        {/* 8. Talep */}
        <section id="talep" aria-labelledby="talep-baslik" className="scroll-mt-20 bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-5 md:py-20">
            <div className="md:col-span-2">
              <p className="font-semibold uppercase tracking-wide text-amber-800">Talep</p>
              <h2 id="talep-baslik" className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
                Keşif görüşmesi talep edin
              </h2>
              <p className="mt-4 text-slate-700">
                Tesisinizi ve bugün arızaları nasıl çözdüğünüzü kısaca anlatın. Talebinizi aldıktan sonra, dokümanlarınızın
                asistana uygun olup olmadığını birlikte değerlendireceğimiz bir görüşme planlarız.
              </p>
              <ul className="mt-6 space-y-3 text-slate-700">
                {[
                  "Görüşme ücretsizdir, bağlayıcı değildir.",
                  "Örnek bir kılavuzunuzla kısa bir deneme yapabiliriz.",
                  "Tüm alanlar zorunludur.",
                ].map((m) => (
                  <li key={m} className="flex gap-2">
                    <Ikon ad="tik" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-8 md:col-span-3">
              <TalepFormu />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-300">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm sm:px-6 md:flex-row md:items-center md:justify-between">
          <p className="flex items-center gap-2 font-semibold text-white">
            <Ikon ad="anahtar" className="h-4 w-4 text-amber-300" />
            SahaRehber
          </p>
          <p>
            Kurgusal bir hizmettir; ENTEKSİS uygulama çalışması için hazırlanmıştır. Sayfadaki makine, doküman ve arıza
            örnekleri gerçek değildir.
          </p>
        </div>
      </footer>
    </>
  );
}
