# Karelio

**Bağlantını kareye dönüştür.**

Karelio, QR kodlarını tarayıcıda oluşturan açık kaynak bir React ve TypeScript uygulamasıdır. Üyelik, sunucu uygulaması, ücretli API ve API anahtarı gerektirmez.

## Özellikler

- Bağlantı, serbest metin, Wi-Fi, vCard kişi kartı, e-posta, SMS ve telefon QR türleri.
- Tür değiştirirken sayfa açık kaldığı sürece korunan form alanları.
- Canlı önizleme; renk paletleri, nokta ve köşe stilleri, yerel logo işleme.
- 512, 1024 ve 2048 piksel PNG; ölçeklenebilir SVG indirme.
- Destekleyen güvenli tarayıcı ortamlarında QR görselini panoya kopyalama.
- Sistem tercihinden başlayan açık/koyu tema, klavye navigasyonu ve azaltılmış hareket desteği.
- Türkçe arayüz, kendi sunucundan sunulan Inter yazı tipi ve izleme içermeyen çalışma.
- Karelio için tasarlanan karelerin birleşme animasyonu ve akıcı arayüz geçişleri. Hareket azaltma tercihi desteklenir; normal imleç korunur.

## Kurulum

Node.js **22.12 veya üzeri** ve `package.json` içindeki `packageManager` alanıyla uyumlu **pnpm** kullanın. Corepack varsa `corepack enable` ile etkinleştirebilirsiniz.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Terminalin gösterdiği yerel adresi açın. Yerel geliştirmede bir `.env` dosyası veya API anahtarı gerekmez.

## Derleme ve test

```sh
pnpm test
pnpm build
pnpm preview
```

`pnpm test` otomatik kontrolleri, `pnpm build` TypeScript kontrolünü ve üretim derlemesini çalıştırır. Yayına hazır dosyalar `dist/` altında oluşur. `pnpm preview` bu dosyaları yerelde incelemek içindir; üretim sunucusu olarak kullanılmamalıdır.

Doğrulama kapsamı ve çalıştırılan kontrollerin sonuçları teslim öncesinde ayrıca raporlanır. Testlerin geçmesi her QR tasarımının her telefon veya baskı koşulunda okunacağı anlamına gelmez.

## Statik yayımlama

GitHub'a yükleme için adım adım Türkçe rehber: [YAYINLAMA.md](YAYINLAMA.md). Hazır otomatik test/derleme/yayımlama iş akışı `.github/workflows/deploy.yml` dosyasındadır.

1. `pnpm install --frozen-lockfile` ve `pnpm build` komutlarını çalıştırın.
2. `dist/` içeriğini HTTPS destekleyen statik bir barındırma hizmetine yükleyin.
3. Yayındaki sayfada QR oluşturma, PNG/SVG indirme ve mobil görünümü kontrol edin.

Vite yapılandırmasında `base: './'` kullanılır; dosyalar alan adı kökünde veya GitHub Pages proje alt dizininde sunulabilir. GitHub Pages için **Settings → Pages → Source → GitHub Actions** seçip Node.js 22 ve pnpm ile oluşturulan `dist/` klasörünü Pages artefaktı olarak yayımlayın. Bu proje henüz gerçek bir depo adresi belirtmez; yayımladıktan sonra kendi depo ve site bağlantılarınızı ekleyebilirsiniz.

HTTPS, panoya görsel yazma gibi tarayıcı özellikleri için gereklidir. `localhost` geliştirme sırasında güvenli bağlam sayılır. Desteklenmeyen tarayıcılarda PNG indirme alternatifi kullanılabilir.

## Kod yapısı ve sorumluluklar

- `src/main.tsx`: React başlangıcı, yerel yazı tipi ve stil yükleme.
- `src/App.tsx`: sayfa düzeni, ortak durum ve bileşenlerin bağlanması.
- `src/components/TypeSelector.tsx`: QR türleri ve ok tuşlarıyla erişilebilir sekme navigasyonu. `value` ve `onChange` alır; seçili sekmenin paneli `content-panel` kimliğiyle eşleşir.
- `src/components/ContentForm.tsx`: seçili türe ait alanlar, görünür etiketler, doğrulama mesajları ve açık protokol önerileri.
- `src/components/DesignControls.tsx`: renkler, paletler, nokta/köşe stili ve doğrulanan logo yükleme ayarları.
- `src/components/ThemeToggle.tsx`: sistem temasını izler; kullanıcı açık bir tercih yaparsa yalnızca `karelio-theme` anahtarını saklar.
- `src/components/Information.tsx`: kullanım adımları, SSS ve gizlilik açıklaması.
- `src/lib/payload.ts`: QR türleri ve içeriğin biçimlendirilmesi/doğrulanması.
- `src/lib/qr.ts`: QR matrisi, dört modüllük boş alan, hata düzeltme, logo işleme, SVG ve PNG üretimi.
- `src/styles.css`: responsive düzen, temalar, odak durumları ve hareket tercihleri.
- `vite.config.ts`: React, Tailwind CSS ve göreli statik dosya yolları.

QR matrisinin üretilmesi açık kaynak `qrcode` paketine dayanır; QR standardı yeniden uygulanmaz. Görsel oluşturma katmanı aynı içerik ve tasarım durumundan önizleme ve dosya çıktısı oluşturur. QR türleri `url`, `text`, `wifi`, `vcard`, `email`, `sms` ve `phone` değerlerini kullanır.

## Gizlilik

QR içeriği, Wi-Fi parolaları, kişi bilgileri ve logolar tarayıcı içinde işlenir. Form verileri bir sunucuya gönderilmez, URL'ye eklenmez veya kalıcı tarayıcı depolamasına yazılmaz. Sayfa yenilendiğinde form durumu kaybolur. Formu temizleme işlemi hassas alanları ve logoyu da kaldırır. Yalnızca açıkça seçilen tema yerel depolamada saklanır.

Analitik, izleme, uzaktan yazı tipi, harici QR üretim servisi veya reklam SDK'sı yoktur. Inter dosyaları uygulamayla aynı kaynaktan sunulur. Statik barındırma hizmeti normal HTTP isteklerinden IP adresi ve tarayıcı bilgisi gibi teknik metadata alabilir; bu isteklere formun içeriği eklenmez. Daha sonra analitik, dış font veya sunucu hizmeti eklerseniz hem buradaki hem arayüzdeki gizlilik metnini güncelleyin.

İndirilen QR görseli kendi içeriğini taşır. QR'ı okuyabilen kişiler o bilgiye erişebilir; bir Wi-Fi parolası QR içine konduğunda şifrelenmiş sayılmaz. Bağlantı QR'ı hedef siteyi açtığında o sitenin kendi gizlilik uygulamaları geçerlidir.

## Sınırlar

- Statik QR kodlar kendiliğinden süre aşımına uğramaz; web bağlantısının çalışması hedef adrese bağlıdır.
- İndirilen QR kodun içeriği sonradan değiştirilemez. Taramaları sayma veya dinamik yönlendirme yoktur.
- QR kapasitesi sınırlıdır; çok uzun metinler ve kişi kartları daha büyük veya üretilemeyen kodlarla sonuçlanabilir.
- Wi-Fi, vCard, SMS ve e-posta yorumlama davranışı telefonun kamera ve uygulamalarına göre değişebilir.
- Kontrast uyarısı bir taranabilirlik garantisi değildir. Logo, yuvarlatılmış noktalar, baskı boyutu, kâğıt ve kamera koşulları okumayı etkiler.
- En az dört modüllük boş kenar korunmalıdır. İndirmeden ve baskıdan sonra gerçek cihazlarla test edin.
- Tarayıcı panoya yazmayı reddedebilir; PNG/SVG indirme her zaman temel aktarım yoludur.

## Lisans

Karelio'nun proje kodu [MIT lisansı](LICENSE) altındadır. Telif sahibi başlangıçta “Karelio contributors” olarak belirtilmiştir; dağıtımdan önce proje sahipliğinize göre güncelleyebilirsiniz. Üçüncü taraf paket ve yazı tipi lisansları kendi koşullarını korur. [Üçüncü taraf atıfları](public/THIRD_PARTY_NOTICES.txt) React, React DOM, Scheduler, Lucide, qrcode, dijkstrajs, Inter ve Tailwind CSS lisans metinlerini içerir ve üretim derlemesine otomatik kopyalanır. Bu dosyayı dağıtımla birlikte koruyun; bağımlılıkları güncellerseniz atıfları da gözden geçirin.
