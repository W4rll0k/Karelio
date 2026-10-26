# Karelio doğrulama raporu

İlk doğrulama: **25 Ekim 2026**. Son sürümün 74 testi, TypeScript kontrolü ve üretim derlemesi **26 Ekim 2026** tarihinde yeniden başarıyla tamamlandı.

## Üretim derlemesi ve otomatik testler

- **74 test başarılı:** 40 içerik/doğrulama testi, 34 QR üretimi ve çıktı testi.
- **TypeScript kontrolü ve Vite üretim derlemesi başarılı.** Yayına hazır dosyalar `dist/` altında üretildi.
- Sites üretim derleme yardımcısı da başarıyla tamamlandı.

İçerik testleri yedi QR türünü; boş/geçersiz girişleri, açık HTTPS önerisini, Wi-Fi özel karakterlerini, Türkçe ve çok satırlı metni, vCard alan kaçışlarını ve UTF-8 satır katlamasını, e-posta/SMS kodlamasını kapsar. Kullanıcının form nesnesinin değiştirilmediği de kontrol edilir.

QR üretim testlerinde bağımsız **jsQR** çözücüsü kullanıldı; SVG dosyaları **sharp** ile piksele dönüştürüldü. Bağlantı, Türkçe metin, Wi-Fi, vCard, e-posta ve telefon örnekleri dört nokta/köşe stili birleşiminde çözüldü. Renkli ve logolu örnekler 512, 1024 ve 2048 pikselde okundu. Yoğun bir QR içindeki merkez hizalama deseninin logo varken korunması, en az dört modüllük boş kenar, logo boyutu sınırı, kontrast uyarıları ve kapasite hataları da kontrol edildi.

## Gerçek tarayıcı indirmeleri

Arayüzün indirme düğmeleriyle oluşturulan dosyalar, doğrudan indirme klasöründen okunarak ayrıca doğrulandı:

| Kontrol | PNG | SVG |
| --- | --- | --- |
| Dosya adı | `karelio-baglanti.png` | `karelio-baglanti.svg` |
| Boyut | 1024 × 1024 piksel | 1024 × 1024; ölçeklenebilir vektör |
| Bağımsız çözücü sonucu | `https://example.com` | `https://example.com` |
| Boş kenar bildirimi | Aynı SVG'den raster çıktı | 4 modül |

PNG ve SVG'nin rasterleştirilmiş hali için 33 × 33 modül merkezindeki tüm RGBA örnekleri karşılaştırıldı: **renk farkı 0**, uyuşmayan merkez sayısı **0**. Böylece bu örnekte iki indirme biçiminin aynı QR tasarımını taşıdığı doğrulandı.

Arayüzden bir PNG logo yüklenerek ikinci bir indirme de yapıldı. Bu örnekte kobalt ön plan (`#315cf5`), yuvarlatılmış noktalar ve köşeler kullanıldı:

| Logolu çıktı kontrolü | Sonuç |
| --- | --- |
| Dosyalar | `karelio-logolu.png`, `karelio-logolu.svg` |
| Boyut | Her ikisi de 1024 × 1024 |
| Bağımsız çözücü | Her ikisi de `https://example.com` olarak okundu |
| SVG logo verisi | PNG görseli dosyanın içine gömülü |
| PNG'de gerçek logo pikselleri | Gömülü logoya özgü renk, hem indirilen PNG'nin hem rasterleştirilmiş SVG'nin merkezinde doğrulandı |
| Tasarım eşleşmesi | 37 × 37 modül merkezinin tamamı uyumlu; en büyük kanal farkı 1/255 |

Bu kontrol gerçek tarayıcı logo yükleme, önizleme ve PNG/SVG indirme akışını kapsar. Doğrulanmış dört dosyanın kopyaları teslimdeki `karelio-examples/` klasöründedir. Örnek bağlantı `example.com` alan adını kullanır; gerçek kullanıcı verisi içermez.

## Doğrulamanın sınırları

- Fiziksel telefon kamerasıyla, basılı kâğıt üzerinde veya tüm tarayıcı/işletim sistemi birleşimlerinde test yapılmadı.
- QR'ın metin içeriğinin doğru çözülmesi; her cihazın Wi-Fi ağına bağlanma, kişi ekleme veya SMS uygulamasını açma davranışını aynı şekilde uygulayacağı anlamına gelmez.
- Pano izni ve işletim sistemi panosunun içeriği bu bağımsız dosya doğrulamasının kapsamı dışındadır.

## Tekrar çalıştırma

Normal geliştirme ortamında:

```sh
pnpm test
pnpm build
```

Bu teslimin çalıştırıldığı ortamda Windows komut yorumlayıcısı bulunmadığı için Sites yardımcısına yalnızca süreç ortamı üzerinden PowerShell yolu verildi. Projeye makineye özgü bir kabuk ayarı eklenmedi. Testler aynı Vitest çalıştırıcısıyla tamamlandı.
