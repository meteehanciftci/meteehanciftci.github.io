(() => {
  const root = document.documentElement;
  const themeToggle = document.getElementById("theme-toggle");
  const menuToggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("primary-nav");
  const header = document.querySelector(".site-header");

  function systemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(theme, { persist = false } = {}) {
    root.setAttribute("data-theme", theme);
    if (persist) localStorage.setItem("theme", theme);
    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç",
      );
    }
  }

  const stored = localStorage.getItem("theme");
  applyTheme(stored === "light" || stored === "dark" ? stored : systemTheme());

  themeToggle?.addEventListener("click", () => {
    const next =
      root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next, { persist: true });
  });

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (event) => {
      if (!localStorage.getItem("theme")) {
        applyTheme(event.matches ? "dark" : "light");
      }
    });

  function closeMenu() {
    if (!nav || !menuToggle) return;
    nav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Menüyü aç");
    document.body.classList.remove("nav-open");
  }

  function openMenu() {
    if (!nav || !menuToggle) return;
    nav.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Menüyü kapat");
    document.body.classList.add("nav-open");
  }

  menuToggle?.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    if (expanded) closeMenu();
    else openMenu();
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) closeMenu();
  });

  const onScroll = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    revealEls.forEach((el) => observer.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }
})();
