import { ArrowDownToLine, ChevronDown, MousePointer2, Palette, ShieldCheck } from 'lucide-react';

const steps = [
  { number: '01', title: 'İçeriğini ekle', body: 'Bir bağlantı, Wi-Fi ağı ya da iletişim kartı. Paylaşmak istediğin bilgiyi seç ve doldur.', Icon: MousePointer2 },
  { number: '02', title: 'Kendine göre tasarla', body: 'Renklerini belirle, noktaları şekillendir, dilersen logonu ekle. Değişiklikleri anında gör.', Icon: Palette },
  { number: '03', title: 'İndir ve paylaş', body: 'QR kodunu PNG veya SVG olarak indir. Kullanmadan önce telefonunla tarayıp kontrol et.', Icon: ArrowDownToLine },
];

const questions = [
  {
    question: 'QR kodumun kullanım süresi var mı?',
    answer: 'Hayır. Karelio statik QR kodlar oluşturur; bu kodlar kendiliğinden süre aşımına uğramaz. Bir bağlantı paylaşıyorsan çalışmaya devam etmesi hedef web adresinin erişilebilir olmasına bağlıdır.',
  },
  {
    question: 'İndirdiğim QR kodun içeriğini daha sonra değiştirebilir miyim?',
    answer: 'Statik QR kodun içeriği görselin içine yazılır ve sonradan değiştirilemez. Bilgilerin değiştiğinde yeni bir QR kod oluşturup paylaşmalısın. Karelio sonradan adres değiştirme veya yönlendirme hizmeti sunmaz.',
  },
  {
    question: 'Wi-Fi şifrem ve diğer bilgilerim güvende mi?',
    answer: 'QR oluşturma ve logo işleme kendi tarayıcında gerçekleşir. Form içeriği Karelio tarafından sunucuya gönderilmez veya kalıcı depolamaya yazılmaz. Ancak QR kodu tarayan kişi kodun içerdiği bilgileri okuyabilir; Wi-Fi şifresi gibi hassas içerikleri yalnızca güvendiğin kişilerle paylaş.',
  },
  {
    question: 'QR kodu baskıda kullanabilir miyim?',
    answer: 'Evet. SVG, büyütüldüğünde netliğini koruduğu için baskıya uygundur. Koyu ön plan, açık arka plan ve kodun etrafındaki boş alan okunabilirliği destekler. Çok büyük logolardan kaçın; gerçek baskı boyutunda ve farklı telefonlarla tarama testi yap. Hiçbir renk veya logo ayarı her koşulda taranabilirlik garantisi vermez.',
  },
  {
    question: 'Kaç kişinin taradığını görebilir miyim?',
    answer: 'Karelio taramaları izlemez ve tarama istatistiği sunmaz. Hesap, abonelik veya API anahtarı gerekmez; indirdiğin statik QR kod Karelio sunucusuna bağlanmadan okunabilir. QR kod bir web adresi içeriyorsa, o siteye girdiğinde hedef sitenin kendi gizlilik kuralları geçerli olur.',
  },
];

export default function Information() {
  return (
    <>
      <section className="how-section" id="nasil-calisir" aria-labelledby="how-title">
        <div className="section-heading">
          <span className="eyebrow">KARMAŞAYA YER YOK</span>
          <h2 id="how-title">Üç küçük adım. Sonsuz olasılık.</h2>
          <p>Fikrinden paylaşmaya, sadece birkaç saniye.</p>
        </div>
        <div className="steps-grid">
          {steps.map(({ number, title, body, Icon }) => (
            <article className="step-card" key={number}>
              <div className="step-top"><span className="step-icon"><Icon size={22} strokeWidth={1.7} aria-hidden="true" /></span><span className="step-number" aria-hidden="true">{number}</span></div>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="faq-section" id="sss" aria-labelledby="faq-title">
        <div className="section-heading faq-heading">
          <span className="eyebrow">AKLINDA SORU KALMASIN</span>
          <h2 id="faq-title">Merak edilenler.</h2>
          <p>QR kodlar hakkında birkaç iyi cevap.</p>
        </div>
        <div className="faq-list">
          {questions.map(({ question, answer }) => (
            <details className="faq-item" key={question}>
              <summary><span>{question}</span><ChevronDown size={19} aria-hidden="true" /></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="privacy-note" id="gizlilik" aria-labelledby="privacy-title">
        <span className="privacy-icon"><ShieldCheck size={24} strokeWidth={1.7} aria-hidden="true" /></span>
        <div>
          <h2 id="privacy-title">Bilgilerin sana ait.</h2>
          <p>QR içeriğin ve logon tarayıcında işlenir; Karelio bunları hiçbir sunucuya göndermez. Form bilgileri kalıcı olarak kaydedilmez, sayfayı yenilediğinde silinir. Yalnızca seçtiğin tema bu cihazda saklanır. Analitik ve izleme kullanılmaz; yazı tipleri siteyle birlikte sunulur. Siteyi barındıran hizmet, normal sayfa isteklerine ait IP adresi ve tarayıcı bilgisi gibi teknik verileri alabilir; QR formunun içeriği bu isteklere eklenmez.</p>
        </div>
      </section>
    </>
  );
}
