# Denge 2.0 — çalıştırılan testler

Bu dosya yalnızca bu ortamda gerçekten çalıştırılan testleri içerir. Kullanıcının tableti kullanılmadı. Performans sayısı uydurulmadı.

## Çalıştırılan

| Test | Komut | Sonuç | Gözlem |
|---|---|---|---|
| Para, filtre, migration, yedek senaryoları 1–11, 13 (otomatik) | `npx tsx lib/denge.check.ts` | geçti | 125,50 + 75,25 = 200,75; 100 + 75,25 = 175,25; sil/geri al; kaynak değişince toplam aynı; aynı bankada iki kaynak bir kez sayıldı; ad/arşiv geçmişi bozmadı; kaynaksız eski kayıt korundu; katalog tekrar hazırlığı çoğaltmadı; bozuk JSON mevcut state’i değiştirmedi; aynı yedek id ile birleşince çoğalmadı |
| Ay sınırı ve eski yedek göçü | `npx tsx lib/ledger.check.ts` | geçti | 31 Ağustos / 1 Eylül ayrıldı; amount 10 → 1000 kuruş |
| TypeScript | `npx tsc --noEmit` | geçti | İlk turda 4 derleme hatası vardı; düzeltildi, tekrar geçti |
| ESLint | `npm run lint` | geçti | `Date.now()` render saflığı düzeltildi |
| Next.js üretim derlemesi | `npm run build` | geçti | Statik export, 10 sayfa |
| Android debug APK | `npx cap sync android` + `./gradlew assembleDebug` | geçti | `android/app/build/outputs/apk/debug/app-debug.apk` ve `public/denge-2.0.apk` |

## Çalıştırılmayan

- Emülatör / cihaz UI testleri (bağlı cihaz yok)
- Kullanıcının tableti
- Uçak modu / TalkBack / büyük yazı / döndürme (senaryo 12, 14, 15) — tablette `TEST_PLANI.md` ile yapılacak
- Uygulamayı kapatıp açma (senaryo 9) — depolama birim testinde göç doğrulandı, süreç yeniden oluşturma tablette

## Bilinen sınırlar

- Uygulama Capacitor + WebView’dir; Jetpack Compose / Room değildir. Tabletteki mevcut kayıtlar aynı applicationId ile WebView depolamasında kalır.
- Çalışma alanında eski kişisel finans uygulaması yoktu; banka kataloğu burada kuruldu.
- Yapı Kredi, Halkbank, QNB, TEB, ING, HSBC, Kuveyt Türk, Türkiye Finans, Albaraka, Vakıf Katılım, Fibabanka, Odeabank logoları alternatif baş harf simgesidir.
- APK debug imzalıdır. Önceki debug APK ile aynı debug keystore varsayılır; bu ortamda önceki keystore doğrulanamadı.

Durum: tablet kullanıcı kabul testi bekleniyor.
