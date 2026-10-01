# Harcama Defteri

Günlük harcamaları dört alanla kaydeden, mobil öncelikli bir gider defteri. Veriler tarayıcıda (localStorage) tutulur; sunucu gerekmez.

## Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) açın.

Üretim derlemesi:

```bash
npm run build
npx serve out
```

## Kullanım

1. **+ Harcama Ekle** — yer, miktar, ödeme yöntemi, kategori.
2. Ana ekranda **Bu Ay** toplamı ve son harcamalar.
3. **Tümü** — arama ve tarih / kategori / ödeme filtresi.
4. Bir kayda dokunun — düzenle veya sil.
5. **Özet** — seçilen ayın toplamı ve kırılımlar.
6. **Ayarlar** — kategori ve ödeme yöntemlerini yönetin.

İlk açılışta örnek harcamalar yüklenir. Kayıtlar yalnızca elle eklenen gerçek harcamalardır (transfer, kart ödemesi, ekstre içe aktarma yok).

## Android APK (tablet)

Tablete yüklemek için debug APK’yı indirin ve “bilinmeyen kaynaklar”a izin vererek kurun.

```bash
npm install
npm run build:apk
```

Çıktı: `android/app/build/outputs/apk/debug/app-debug.apk`

Tablette:

1. APK dosyasını tablete kopyalayın (USB, Drive, e-posta).
2. Ayarlar → Güvenlik → **Bilinmeyen kaynaklar** / **Bu kaynaktan yükle** açık olsun.
3. Dosyaya dokunup **Yükle**.
4. Başlatıcıda **Harcama Defteri** görünür.

USB ile (bilgisayarda Android SDK varsa):

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```
