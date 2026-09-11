import { motion, useReducedMotion } from "framer-motion";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=80";
const ABOUT_IMAGE =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80";

const projects = [
  { name: "Liman", meta: "Marka sitesi · 2025" },
  { name: "Atlas Defter", meta: "Ürün arayüzü · 2025" },
  { name: "Sessiz Saat", meta: "Kampanya · 2024" },
];

export default function App() {
  const reduceMotion = useReducedMotion();

  const fadeUp = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 28 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: reduceMotion ? 0 : 0.12 + i * 0.1,
        duration: reduceMotion ? 0.01 : 0.7,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    }),
  };

  return (
    <div className="site">
      <header className="nav">
        <a className="nav__brand" href="#top">
          Kıyı
        </a>
        <ul className="nav__links">
          <li>
            <a href="#hakkinda">Hakkında</a>
          </li>
          <li>
            <a href="#isler">İşler</a>
          </li>
          <li>
            <a href="#iletisim">İletişim</a>
          </li>
        </ul>
        <a className="nav__cta" href="#iletisim">
          Proje başlat
        </a>
      </header>

      <main id="top">
        <section className="hero" aria-label="Ana bölüm">
          <div className="hero__media" aria-hidden="true">
            <img
              src={HERO_IMAGE}
              alt=""
              width={2400}
              height={1600}
              fetchPriority="high"
            />
            <div className="hero__shade" />
          </div>

          <div className="hero__content">
            <motion.h1
              className="hero__brand"
              initial="hidden"
              animate="show"
              custom={0}
              variants={fadeUp}
            >
              Kıyı
            </motion.h1>
            <motion.p
              className="hero__headline"
              initial="hidden"
              animate="show"
              custom={1}
              variants={fadeUp}
            >
              Sakin, net ve akılda kalan web deneyimleri.
            </motion.p>
            <motion.p
              className="hero__lede"
              initial="hidden"
              animate="show"
              custom={2}
              variants={fadeUp}
            >
              Markalar için sade arayüzler, güçlü tipografi ve atmosferli
              sayfalar tasarlıyoruz.
            </motion.p>
            <motion.div
              className="hero__actions"
              initial="hidden"
              animate="show"
              custom={3}
              variants={fadeUp}
            >
              <a className="btn btn--primary" href="#isler">
                Seçilmiş işler
              </a>
              <a className="btn btn--ghost" href="#iletisim">
                Konuşalım
              </a>
            </motion.div>
          </div>
        </section>

        <section className="section about" id="hakkinda">
          <div className="section__inner">
            <p className="section__label">Hakkında</p>
            <h2 className="section__title">Gürültüyü azalt, hikâyeyi öne çıkar.</h2>
            <p className="section__text">
              Kıyı; ürün lansmanları, stüdyo siteleri ve kişisel markalar için
              tek bir net mesaj etrafında kurulan web siteleri üretir.
            </p>

            <div className="about__grid">
              <motion.div
                className="about__visual"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <img
                  src={ABOUT_IMAGE}
                  alt="Aydınlık bir stüdyo çalışma alanı"
                  width={1600}
                  height={1067}
                  loading="lazy"
                />
                <p className="about__caption">
                  Her sayfa bir kompozisyon: marka, cümle, görüntü.
                </p>
              </motion.div>
              <div>
                <p className="section__text">
                  Tipografi, ritim ve gerçek mekân görselleriyle ilk ekranda
                  güven veren bir izlenim bırakırız. Kart yığınları ve gereksiz
                  rozetler yok — sadece okunan bir hikâye.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section work" id="isler">
          <div className="section__inner">
            <p className="section__label">İşler</p>
            <h2 className="section__title">Seçilmiş projeler</h2>
            <p className="section__text">
              Farklı sektörlerde aynı ilke: sakin yüzey, güçlü marka sinyali.
            </p>
            <ul className="work__list">
              {projects.map((project, index) => (
                <motion.li
                  key={project.name}
                  className="work__item"
                  initial={{ opacity: 0, x: reduceMotion ? 0 : -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{
                    delay: reduceMotion ? 0 : index * 0.08,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <span className="work__name">{project.name}</span>
                  <span className="work__meta">{project.meta}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section contact" id="iletisim">
          <div className="section__inner">
            <p className="section__label">İletişim</p>
            <h2 className="section__title">Yeni bir site mi düşünüyorsun?</h2>
            <p className="section__text">
              Kısa bir brieften sonra yön, ton ve ilk ekran kompozisyonunu
              birlikte netleştirelim.
            </p>
            <div className="contact__row">
              <a className="btn btn--primary" href="mailto:merhaba@kiyi.studio">
                E-posta gönder
              </a>
              <a className="contact__email" href="mailto:merhaba@kiyi.studio">
                merhaba@kiyi.studio
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>
          <strong>Kıyı</strong> — dijital stüdyo
        </p>
        <p>© {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
