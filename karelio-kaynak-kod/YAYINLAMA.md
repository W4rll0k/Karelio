# GitHub Pages ile yayımlama

Bu proje statik bir sitedir. Veritabanı, API anahtarı veya ayrı sunucu gerekmez.

1. GitHub hesabında yeni bir **public** depo oluştur. Örneğin `karelio` adını kullanabilirsin.
2. Kaynak ZIP dosyasını bilgisayarında aç. İçindeki dosyaları deponun köküne yükle. ZIP dosyasını tek parça olarak yükleme; `.github`, `src`, `public`, `tests` klasörleri ve `package.json` depo kökünde olmalı.
3. Ana dalın adı `main` olsun. Farklı bir ad kullanıyorsan `.github/workflows/deploy.yml` içindeki `branches: [main]` satırını güncelle.
4. Depoda **Settings → Pages → Build and deployment → Source → GitHub Actions** seç.
5. **Actions → Karelio - GitHub Pages → Run workflow** düğmesiyle yayımlamayı başlat. Sonraki `main` güncellemelerinde işlem otomatik çalışır.
6. İşlem yeşil olduğunda **Settings → Pages** sayfasında gerçek site adresin görünür.

İş akışı bağımlılıkları kurar, testleri çalıştırır, üretim derlemesini oluşturur ve `dist/` içeriğini yayımlar. `base: './'` sayesinde bu tek sayfalı uygulamanın dosyaları depo alt dizininde de yüklenir.

GitHub hesabının erişim ve Pages ayarları bu dosyalardan yapılamaz. Yayına alma işlemi hesabın içinde tamamlanmalıdır. Hesabı bağlayıp depo bağlantısını paylaşırsan bu adımlar birlikte yürütülebilir. Parola veya erişim anahtarını sohbet içinde paylaşma.

## Hazır site ZIP dosyası

`karelio-yayina-hazir.zip`, derlenmiş siteyi içerir. Bu ZIP'in içeriği herhangi bir statik barındırma hizmetine doğrudan yüklenebilir. Geliştirme yapmak ve GitHub Actions kullanmak için kaynak kod ZIP'ini tercih et.

Yayımladıktan sonra gerçek site adresinde bir QR oluşturup telefonunla tara; PNG ve SVG indirmelerini kontrol et.
