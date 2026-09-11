# Metehan Çiftçi — Kişisel Web Sitesi

Minimal, hızlı ve responsive kişisel portföy sitesi. Saf HTML, CSS ve JavaScript ile yazılmıştır; framework yoktur.

## Proje yapısı

```text
website/
├── index.html          # Ana sayfa (içerik burada)
├── css/
│   └── style.css       # Tema, layout, bileşenler
├── js/
│   └── main.js         # Tema, mobil menü, reveal
├── assets/
│   ├── images/         # Görseller (isteğe bağlı)
│   └── icons/          # İkonlar (isteğe bağlı)
├── favicon.svg
└── README.md
```

## Yerel olarak açma

En basit yol: `index.html` dosyasını tarayıcıda açmak.

Önerilen yol — yerel sunucu:

```bash
cd website
python3 -m http.server 8080
```

Ardından tarayıcıda: [http://127.0.0.1:8080](http://127.0.0.1:8080)

Node kullanıyorsan:

```bash
npx serve .
```

## İçerikleri değiştirme

Tüm metinler `index.html` içindedir.

| Ne | Nerede |
| --- | --- |
| İsim / logo | `.logo` ve hero başlığı |
| Hakkımda metni | `#hakkimda` içindeki paragraf |
| E-posta | `mailto:` linki (`hello@example.com`) |
| Canonical / OG URL | `<head>` içindeki `example.com` değerleri |
| Sosyal linkler | Footer / iletişimdeki yorum satırlarını aç |

Tema rengi ve boşluklar için `css/style.css` içindeki `:root` değişkenlerini düzenle.

## Yeni proje kartı ekleme

`#project-grid` içine şu bloğu kopyala:

```html
<article class="project-card reveal">
  <h3 class="project-name">Proje Adı</h3>
  <p class="project-desc">Kısa açıklama.</p>
  <p class="project-tech">Tech · Stack · Here</p>
  <a
    class="btn btn-ghost"
    href="https://ornek-link.com"
    target="_blank"
    rel="noopener noreferrer"
    >Projeyi görüntüle</a
  >
</article>
```

`href="#"` yerine gerçek proje URL’sini yaz.

## Dark mode

- Varsayılan: cihazın `prefers-color-scheme` ayarı
- Navbar’daki tema butonu seçimi `localStorage` anahtarı `theme` ile saklar
- İlk yüklemede flash olmaması için `index.html` başındaki kısa script tema uygular

## GitHub Pages ile yayınlama

1. Bu klasörü bir GitHub deposuna koy (`website` kök veya `docs/` / `gh-pages` branch).
2. Repo → **Settings → Pages**
3. Source: **Deploy from a branch**
4. Branch: `main` (veya `gh-pages`), klasör: `/` (kök) veya `/docs`
5. Kaydet; birkaç dakika sonra `https://<kullanici>.github.io/<repo>/` adresinde yayında olur

`index.html` içindeki `canonical` ve Open Graph URL’lerini canlı adresinle güncelle.

## Vercel ile yayınlama

1. [vercel.com](https://vercel.com) → projeyi import et
2. Framework Preset: **Other**
3. Root Directory: `website` (repo kökündeyse boş bırak)
4. Build Command: boş / gerekmez
5. Output Directory: `.` (statik dosyalar)

## Netlify ile yayınlama

1. [netlify.com](https://netlify.com) → **Add new site → Import**
2. Build command: boş
3. Publish directory: `website` (veya depo köküyse `.`)
4. Deploy

Sürükle-bırak ile de `website` klasörünü Netlify Drop’a yükleyebilirsin.

## Özellikler

- Sticky navbar + mobil hamburger menü
- Light / dark tema
- Smooth scroll ve hafif fade-in (reduced-motion saygılı)
- Semantic HTML, klavye odağı, skip link
- Proje kartları grid ile responsive

## Lisans

Kişisel kullanım için serbestçe düzenleyebilirsin.
