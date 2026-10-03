# Denge 2.0 — tablet kabul test planı

Her senaryoyu tablette uygulayın. Sonucu işaretleyin.

Uygulama: Denge 2.0 (versionCode 7), `com.harcamadefteri.app`

## 1. Türkçe tutar toplamı

Adımlar:

1. Yeni bir aya geçin veya filtreleri temizleyin.
2. 125,50 TL harcama ekleyin.
3. 75,25 TL harcama ekleyin.

Beklenen: Harcama toplamı 200,75 TL.

Sonuç: [ ] geçti  [ ] kaldı  Not: ________

## 2. Üçüncü kayıt

Adımlar: 100 TL daha ekleyin.

Beklenen: Toplam 300,75 TL. (Otomatik testte 100 + 75,25 = 175,25 TL senaryosu da vardır.)

Sonuç: [ ] geçti  [ ] kaldı  Not: ________

## 3. Sil ve geri al

Adımlar:

1. İkinci harcamayı silin.
2. “Geri al”a dokunun.

Beklenen: Silince toplam ilk kayıt kadar azalır. Geri alınca önceki toplama döner.

Sonuç: [ ] geçti  [ ] kaldı  Not: ________

## 4. Kaynak değişince toplam aynı kalır

Adımlar:

1. Bir harcamanın ödeme kaynağını değiştirin.
2. Eski ve yeni kaynak filtrelerine bakın.

Beklenen: Genel toplam değişmez. Eski kaynak filtresi o kaydı göstermez; yeni kaynak gösterir.

Sonuç: [ ] geçti  [ ] kaldı  Not: ________

## 5. Aynı bankada iki kaynak

Adımlar:

1. Aynı bankaya iki kaynak ekleyin.
2. Her birinden bir harcama kaydedin.
3. Banka filtresini uygulayın.

Beklenen: İki harcama birer kez görünür. Toplam iki kez sayılmaz.

Sonuç: [ ] geçti  [ ] kaldı  Not: ________

## 6. Yeniden adlandır / arşivle

Adımlar:

1. Kullanılmış bir kaynağı yeniden adlandırın.
2. Arşivleyin.
3. Eski harcamayı açın.

Beklenen: Harcamalar silinmez, toplam değişmez. Arşivli kaynak geçmişte görünür. Yeni harcama seçiminde varsayılan olarak gelmez.

Sonuç: [ ] geçti  [ ] kaldı  Not: ________

## 7. Kaynaksız eski kayıt

Adımlar: Varsa eski kaydı açın. Yoksa yedekten kaynaksız bir kayıt yükleyin.

Beklenen: Kayıt durur. “Ödeme kaynağı belirtilmemiş” görünür. Zorunlu kaynak değişikliği istenmez.

Sonuç: [ ] geçti  [ ] kaldı  Not: ________

## 8. Mükerrer kayıt yok

Adımlar:

1. Bankalar ekranını birkaç kez açıp kapatın.
2. Aynı harcama formunu hızlıca iki kez kaydetmeyi deneyin.

Beklenen: Katalog bankaları çoğalmaz. Çift dokunuş ikinci harcama üretmez.

Sonuç: [ ] geçti  [ ] kaldı  Not: ________

## 9. Kapatıp açma

Adımlar: Uygulamayı tamamen kapatın, yeniden açın.

Beklenen: Harcamalar, kaynaklar ve kategoriler yerindedir.

Sonuç: [ ] geçti  [ ] kaldı  Not: ________

## 10. JSON yedek

Adımlar:

1. JSON yedek oluşturun.
2. Geri yüklemeden önce onay metnini okuyun.
3. Aynı yedeği tekrar yükleyin.

Beklenen: Kayıtlar, ilişkiler ve tutarlar eşleşir. İkinci yükleme çoğaltmaz.

Sonuç: [ ] geçti  [ ] kaldı  Not: ________

## 11. Bozuk yedek

Adımlar: Geçersiz bir dosyayı geri yüklemeyi deneyin.

Beklenen: Hata gösterilir. Mevcut veri değişmez.

Sonuç: [ ] geçti  [ ] kaldı  Not: ________

## 12. Çevrimdışı

Adımlar: Uçağa alın. Banka seçin, harcama ekleyin, yedek oluşturun.

Beklenen: Logolar, katalog, kayıt ve yedek internet olmadan çalışır.

Sonuç: [ ] geçti  [ ] kaldı  Not: ________

## 13. Ay sınırı ve arama

Adımlar:

1. 31 Ağustos tarihli bir harcama ekleyin, Eylül’e geçin.
2. “125,50”, “1.250,50” ve geçersiz “125.50” girin.
3. Boş ayı ve çok kayıtlı ayı açın.

Beklenen: 31 Ağustos Eylül’e kaymaz. Geçersiz tutar sessizce başka değere dönmez.

Sonuç: [ ] geçti  [ ] kaldı  Not: ________

## 14. Tablet düzeni

Adımlar: Yatay, dikey, dar pencere, koyu tema, büyük yazı.

Beklenen: Liste okunur, düğmeler basılır, logo ezilmez. Genişte liste+ayrıntı, darda tek panel.

Sonuç: [ ] geçti  [ ] kaldı  Not: ________

## 15. Dönüş ve form taslağı

Adımlar: Yeni harcama formunu yarıda bırakıp ekranı döndürün.

Beklenen: Kaydedilmiş veriler durur. Form açıksa tutar ve seçimler mümkün olduğunca korunur.

Sonuç: [ ] geçti  [ ] kaldı  Not: ________

## Kurulum

Adımlar: Bu APK’yı mevcut uygulamanın üzerine kurun. applicationId değişmemeli.

Beklenen: Eski harcamalar silinmez.

Sonuç: [ ] geçti  [ ] kaldı  Not: ________
