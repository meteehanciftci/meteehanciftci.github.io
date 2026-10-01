# Harcama Defteri

AI destekli kişisel harcama defteri. Kayıtlar İhtiyaç / İstek / Lüks olarak sınıflanır; analiz cihaz üzerinde, çevrimdışı çalışır. Muhasebe, banka veya borç uygulaması değildir.

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

1. **+ Harcama Ekle** — yer, tutar, ödeme, sınıf, kategori.
2. Ana ekran — dönem toplamı, sınıf dağılımı, trend, içgörü, son kayıtlar.
3. **Tümü** — arama (ör. “geçen ayki lüks”), sınıf / kategori / tutar filtresi.
4. Bir kayda dokunun — düzenle veya sil.
5. **Analiz** — sınıf, kategori, işletme, zaman, ödeme ve Harcama AI.
6. **Ayarlar** — AI’yi kapatma, isteğe bağlı hedefler, CSV / JSON.

İlk açılışta örnek harcamalar yüklenir. Kayıtlar yalnızca elle eklenen tüketimlerdir.

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
