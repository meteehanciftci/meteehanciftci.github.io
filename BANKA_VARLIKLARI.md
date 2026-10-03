# Banka varlıkları

Çalışma alanında eski kişisel finans uygulaması yoktu. Banka kataloğu Denge içinde, verilen sözleşmeye göre kuruldu. React/WebView içine yabancı bir banka modülü gömülmedi.

Logolar uygulamayla paketlenir (`public/banks`). İlk açılışta ve internet kapalıyken de bu dosyalar kullanılır. Uzak logo API’si yoktur.

`logoKey` kalıcı bir metin anahtarıdır. Android drawable kimliği saklanmaz.

Üç harfli kodlar (`ISB`, `GRN` …) yalnızca uygulama içi kısa gösterimdir. Resmi banka, EFT veya SWIFT kodu olarak sunulmaz ve veritabanı kimliği değildir.

## Doğrulanmış logolar

Wikimedia Commons üzerinden indirildi. Markalar ilgili bankalara aittir. Dosyalar tanımlama amacıyla, çevrimdışı gösterim için paketlenmiştir. Renkleri ve en-boy oranları değiştirilmedi.

| logoKey | Banka | Dosya | Kaynak | Not |
|---|---|---|---|---|
| ziraat | T.C. Ziraat Bankası | `public/banks/ziraat.svg` | Commons: *Ziraat Bankası 2025 Logo.svg* — bireysel.ziraatbank.com.tr | Resmi SVG kaynağı belirtilmiş |
| isbank | Türkiye İş Bankası | `public/banks/isbank.svg` | Commons: *Türkiye İş Bankası logo.svg* | Metin logosu |
| garanti | Garanti BBVA | `public/banks/garanti.svg` | Commons: *Garanti BBVA 2019.svg* | 2019 kelime işareti |
| akbank | Akbank | `public/banks/akbank.svg` | Commons: *Akbank logo 2025.svg* | 2025 kelime işareti |
| vakifbank | VakıfBank | `public/banks/vakifbank.svg` | Commons: *Vakıfbank logo.svg* | Kelime işareti |
| denizbank | DenizBank | `public/banks/denizbank.svg` | Commons: *DenizBank logo 2026.svg* | 2026 kelime işareti |
| enpara | Enpara | `public/banks/enpara.svg` | Commons: *Enpara.com Logo.svg* | |
| sekerbank | Şekerbank | `public/banks/sekerbank.svg` | Commons: *Şekerbank logo.svg* | |
| ziraatkatilim | Ziraat Katılım | `public/banks/ziraatkatilim.svg` | Commons: *Ziraat Katılım Bankası Logo.svg* | |
| emlakkatilim | Emlak Katılım | `public/banks/emlakkatilim.svg` | Commons: *Emlak Katılım logo.svg* | |
| aktifbank | Aktif Bank | `public/banks/aktifbank.svg` | Commons: *Aktif Bank logo.svg* | |
| anadolubank | Anadolubank | `public/banks/anadolubank.svg` | Commons: *Anadolubank logo.svg* | |

## Alternatif simge kullanan bankalar

Doğrulanabilir, paketlenmeye uygun resmi logo bulunamadı veya kaynak güvenilir değildi. Rastgele ikon gerçek logo gibi gösterilmedi. Uygulama baş harflerden nötr bir plaka üretir; banka kullanılamaz olmaz.

| logoKey | Banka |
|---|---|
| yapikredi | Yapı Kredi |
| halkbank | Halkbank |
| qnb | QNB |
| teb | TEB |
| ing | ING |
| hsbc | HSBC |
| kuveytturk | Kuveyt Türk |
| turkiyefinans | Türkiye Finans |
| albaraka | Albaraka Türk |
| vakifkatilim | Vakıf Katılım |
| fibabanka | Fibabanka |
| odeabank | Odeabank |
| manual | Kullanıcının eklediği diğer banka |

QNB için eski Finansbank kelime işareti bilinçli olarak kullanılmadı.

## Kullanım koşulları

Bankaların logoları ticari markadır. Buradaki kopyalar yalnızca kullanıcının kendi cihazında, ödeme kaynağını tanımak içindir. Marka renkleri uygulama temasına boyanmaz (`logo-plate` nötr zemindir, Compose/CSS tint uygulanmaz).
