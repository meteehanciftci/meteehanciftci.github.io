# Denge — proje kuralları

Denge’nin aktif sürümü yalnızca harcama defteri ve banka/ödeme kaynağı tanımlama kapsamındadır. Kullanıcının açık onayı olmadan gelir, bakiye, borç, bütçe, yatırım veya diğer finans modülleri geliştirilemez.

## Güvenlik ve veri

- Finansal kayıtları loglara yazma.
- Üyelik, sunucu, analiz SDK’sı veya reklam ekleme.
- IBAN, kart numarası, CVV, banka şifresi, müşteri numarası, limit veya bakiye isteme.
- Şifrelenmemiş yedeği şifreli gibi tanıtma.
- `fallbackToDestructiveMigration` kullanma; mevcut kayıtları silen güncelleme yapma.
- applicationId `com.harcamadefteri.app` değerini koru.

## Kapsam

Testlerin başarılı olması sonraki modülü geliştirme izni değildir. Kullanıcı tablette bu sürümü açıkça onaylayana kadar kapsamı genişletme.
