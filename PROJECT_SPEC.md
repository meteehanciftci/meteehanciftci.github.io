# Denge — ürün kapsamı (sürüm 2.0)

Denge, tablette kullanılan kişisel bir harcama defteridir.

Temel kullanım: harcama ekle → kategori seç → ödeme kaynağı seç → kaydet. Gerektiğinde kaydı bul, düzenle, sil veya yedekle.

## Bu sürümde var

- Harcama ekleme, listeleme, ayrıntı, düzenleme, silme
- Silinen harcama için kısa süreli geri alma
- Kategori oluşturma ve yönetimi
- Banka kataloğu ve paketlenmiş logolar
- Kullanıcıya ait ödeme kaynakları (nakit, vadesiz hesap, kredi kartı, ek hesap)
- Tarih, kategori, banka ve ödeme kaynağı filtreleri
- Görüntülenen harcamaların toplamı (filtre varsa “Filtrelenen toplam”)
- JSON yedekleme / geri yükleme
- CSV dışa aktarma (tam yedek değildir)
- Tema ve tutarları gizleme

## Bu sürümde yok

Gelir, bakiye, transfer, kredi kartı borcu, ekstre, ek hesap faizi, taksit motoru, iade, bütçe, hedef, yatırım, açık bankacılık, SMS, fiş tarama, yapay zekâ, abonelik otomasyonu, gelişmiş raporlar.

Bunlar için “Yakında” kartı veya boş menü yoktur. Analiz ve AI ana gezinmeden çıkarıldı; eski sınıf/AI alanları veride korunur.

## Banka ve ödeme kaynağı

- Banka kurum bilgisidir.
- Ödeme kaynağı, kullanıcının o kurumdaki hesabı veya kartıdır.
- Nakit banka değildir ve banka sayısına dahil edilmez.
- Türler yalnızca sınıflandırmadır; bakiye veya borç hesaplanmaz.
- Kullanılmış kaynak silinmez, arşivlenir.
- Kullanılmış kaynağın bankası veya türü değiştirilmez.

## Veri

- Tutarlar kuruş cinsinden tamsayıdır.
- İşlem günü `YYYY-MM-DD` olarak İstanbul takvim günüdür.
- Şema sürümü 5. Eski v4 kayıtlar dönüştürülür; kaynaksız harcamalar rastgele bankaya atanmaz.
- applicationId: `com.harcamadefteri.app`
- versionName: 2.0 · versionCode: 7

## Mimari notu

Mevcut çalışan uygulama Capacitor + Next.js sarmalayıcısıdır. Tabletteki kayıtlar aynı applicationId ve WebView depolamasıyla korunur. Bu sürüm native Jetpack Compose / Room projesi değildir; kişisel finans web uygulaması da çalışma alanında yoktu.
