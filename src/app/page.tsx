import TalepFormu from "@/components/TalepFormu";

// İçerik sırası: ne yapıyoruz → hangi sorunu çözüyoruz → kimin için →
// nasıl çalışıyor → neden güvenilir → talep. Ziyaretçi forma geldiğinde
// neyi talep ettiğini bilsin diye form en sonda, ama her yerden tek tıkla ulaşılabilir.

const sorunlar = [
  {
    baslik: "Cevap yüzlerce sayfalık PDF'te",
    metin:
      "Makine durduğunda teknisyen, arıza kodunun anlamını ve çözüm adımlarını üretici kılavuzlarında sayfa sayfa arıyor. Üstelik çoğu zaman sahada, elinde yalnızca telefonuyla.",
  },
  {
    baslik: "Bilgi kişilerde kalıyor",
    metin:
      "Hangi arızanın nasıl çözüldüğü deneyimli ustaların hafızasında. O kişi izinde ya da vardiya dışındaysa aynı sorun baştan çözülüyor.",
  },
  {
    baslik: "Geçmiş arızalar tekrar kullanılmıyor",
    metin:
      "Arıza kayıtları bakım yazılımında ya da Excel'de birikiyor ama bir sonraki arızada kimse onlara bakmıyor.",
  },
];

const kimlerIcin = [
  {
    rol: "Bakım teknisyeni",
    fayda: "Arıza kodunu ya da belirtiyi yazar, adım adım çözümü ve kaynağını telefonunda görür.",
  },
  {
    rol: "Bakım şefi",
    fayda: "Ekibin hangi arızalarda takıldığını görür; deneyimli ustaların bilgisini tüm vardiyalara taşır.",
  },
  {
    rol: "Tesis / üretim müdürü",
    fayda: "Duruş süresini kısaltmaya yönelik somut bir araç edinir; mevcut bakım yazılımını değiştirmek zorunda kalmaz.",
  },
];

const adimlar = [
  {
    baslik: "Dokümanlarınızı topluyoruz",
    metin: "Makine kılavuzları, bakım talimatları ve geçmiş arıza kayıtları, bugün hangi formatta duruyorsa oradan alınır.",
  },
  {
    baslik: "Asistanı tesisinize göre kuruyoruz",
    metin: "Makinelerinize, arıza kodlarınıza ve kendi terminolojinize göre ayarlanır; ekibinizle birlikte test edilir.",
  },
  {
    baslik: "Ekibiniz sahadan soruyor",
    metin: "Teknisyen telefondan sorar; asistan cevabı hangi dokümanın hangi sayfasından aldığını göstererek verir.",
  },
];

const ilkeler = [
  {
    baslik: "Her cevabın kaynağı görünür",
    metin: "Adımlar, dayandığı kılavuz sayfası ya da arıza kaydıyla birlikte gösterilir; teknisyen tek dokunuşla doğrulayabilir.",
  },
  {
    baslik: "Bilmiyorsa bilmediğini söyler",
    metin: "Dokümanlarda dayanak bulamadığında tahmin yürütmez, sorunun bir uzmana yönlendirilmesini önerir.",
  },
  {
    baslik: "Güvenlik talimatı önce gelir",
    metin: "Kılavuzdaki kilitleme-etiketleme (LOTO) ve güvenlik uyarıları, çözüm adımlarından önce gösterilir.",
  },
];

export default function Sayfa() {
  return (
    <>
      <a
        href="#talep"
        className="sr-only z-50 rounded-lg bg-slate-900 font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:px-4 focus:py-3"
      >
        Talep formuna geç
      </a>

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href="#" className="flex min-h-11 items-center gap-2 text-lg font-bold text-slate-900">
            <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-md bg-amber-400 text-slate-950">
              SR
            </span>
            SahaRehber
          </a>
          <nav aria-label="Ana menü" className="flex items-center gap-1 sm:gap-4">
            <a href="#nasil" className="hidden min-h-11 items-center px-2 text-slate-800 hover:underline sm:inline-flex">
              Nasıl çalışır?
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
        <section aria-labelledby="hero-baslik" className="bg-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-20">
            <div>
              <p className="font-semibold text-amber-800">Üretim tesisleri için yapay zeka destekli bakım asistanı</p>
              <h1 id="hero-baslik" className="mt-3 text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
                Arıza kodunu yazın, çözüm adımlarını kaynağıyla birlikte görün.
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
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-slate-900 px-6 py-3 text-lg font-semibold text-slate-900 hover:bg-slate-100"
                >
                  Nasıl çalışır?
                </a>
              </div>
            </div>

            {/* Ürün fikrini anlatan statik örnek ekran (gerçek bir yapay zeka çağrısı yapılmaz). */}
            <figure className="mx-auto w-full max-w-sm">
              <div className="rounded-3xl border-8 border-slate-900 bg-slate-50 p-4 shadow-xl">
                <p className="rounded-2xl rounded-br-sm bg-slate-900 px-4 py-3 text-white">
                  HX-400 presinde E-217 hatası var, hidrolik basınç düşük.
                </p>
                <div className="mt-3 rounded-2xl rounded-bl-sm border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800">
                  <p className="font-semibold text-red-800">⚠ Önce makineyi durdurup kilitleyin (LOTO).</p>
                  <ol className="mt-2 list-decimal space-y-1 pl-5">
                    <li>Hidrolik yağ seviyesini gösterge camından kontrol edin.</li>
                    <li>Pompa emiş filtresinde tıkanma olup olmadığına bakın.</li>
                    <li>Basınç ayar valfini kılavuzdaki değere göre kontrol edin.</li>
                  </ol>
                  <p className="mt-3 border-t border-slate-200 pt-2 text-xs text-slate-700">
                    Kaynak: HX-400 Bakım Kılavuzu, s. 212 · Arıza kaydı #1843
                  </p>
                </div>
              </div>
              <figcaption className="mt-3 text-center text-sm text-slate-700">
                Örnek ekran: kurgusal makine ve veriler.
              </figcaption>
            </figure>
          </div>
        </section>

        {/* 2. Sorun */}
        <section aria-labelledby="sorun-baslik" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="sorun-baslik" className="text-3xl font-bold text-slate-950">
            Makine durduğunda zaman kılavuzda kayboluyor
          </h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {sorunlar.map((s) => (
              <li key={s.baslik} className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-slate-950">{s.baslik}</h3>
                <p className="mt-2 text-slate-700">{s.metin}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* 3. Kimin için */}
        <section aria-labelledby="kim-baslik" className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 id="kim-baslik" className="text-3xl font-bold text-slate-950">
              Kimin işini kolaylaştırır?
            </h2>
            <ul className="mt-8 grid gap-6 md:grid-cols-3">
              {kimlerIcin.map((k) => (
                <li key={k.rol} className="border-l-4 border-amber-500 pl-4">
                  <h3 className="text-lg font-semibold text-slate-950">{k.rol}</h3>
                  <p className="mt-2 text-slate-700">{k.fayda}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4. Nasıl çalışır */}
        <section id="nasil" aria-labelledby="nasil-baslik" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-16 sm:px-6">
          <h2 id="nasil-baslik" className="text-3xl font-bold text-slate-950">
            Nasıl çalışır?
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {adimlar.map((a, i) => (
              <li key={a.baslik} className="rounded-xl border border-slate-200 bg-white p-6">
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 place-items-center rounded-full bg-amber-400 font-bold text-slate-950"
                >
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-950">{a.baslik}</h3>
                <p className="mt-2 text-slate-700">{a.metin}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 5. Güven */}
        <section aria-labelledby="ilke-baslik" className="bg-slate-900 text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 id="ilke-baslik" className="text-3xl font-bold">
              Sahada güvenilebilecek bir asistan
            </h2>
            <ul className="mt-8 grid gap-6 md:grid-cols-3">
              {ilkeler.map((ilke) => (
                <li key={ilke.baslik}>
                  <h3 className="text-lg font-semibold text-amber-300">{ilke.baslik}</h3>
                  <p className="mt-2 text-slate-200">{ilke.metin}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6. Talep */}
        <section id="talep" aria-labelledby="talep-baslik" className="scroll-mt-4 bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-5">
            <div className="md:col-span-2">
              <h2 id="talep-baslik" className="text-3xl font-bold text-slate-950">
                Keşif görüşmesi talep edin
              </h2>
              <p className="mt-4 text-slate-700">
                Tesisinizi ve bugün arızaları nasıl çözdüğünüzü kısaca anlatın. Talebinizi aldıktan sonra, dokümanlarınızın
                asistana uygun olup olmadığını birlikte değerlendireceğimiz bir görüşme planlarız.
              </p>
              <p className="mt-4 text-slate-700">Tüm alanlar zorunludur.</p>
            </div>
            <div className="md:col-span-3">
              <TalepFormu />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-700 sm:px-6">
          <p>
            SahaRehber kurgusal bir hizmettir; ENTEKSİS uygulama çalışması için hazırlanmıştır. Sayfadaki makine, doküman
            ve arıza örnekleri gerçek değildir.
          </p>
        </div>
      </footer>
    </>
  );
}
