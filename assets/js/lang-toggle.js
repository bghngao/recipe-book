document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn   = document.getElementById("toggle-btn");
  const langSections = Array.from(document.querySelectorAll(".lang"));
  const langBadges   = Array.from(document.querySelectorAll(".lang-badge"));

  if (!toggleBtn || langSections.length === 0) return;

  /* =========================================================
     Configuration
     ========================================================= */
  const GENRE_LABELS = {
    en: { main: "Main Dishes", dessert: "Desserts", sauce: "Sauces" },
    ja: { main: "メイン料理",  dessert: "デザート",  sauce: "ソース"  }
  };

  const STORAGE_KEY = "preferredLanguage";

  /* =========================================================
     State
     ========================================================= */
  const availableLangs = langSections.map(s => s.dataset.lang);
  const browserLang    = navigator.language.startsWith("ja") ? "ja" : "en";
  const savedLang      = localStorage.getItem(STORAGE_KEY);

  let currentLang =
    savedLang && availableLangs.includes(savedLang)
      ? savedLang
      : availableLangs.includes(browserLang)
        ? browserLang
        : availableLangs[0];

  /* =========================================================
     Helpers
     ========================================================= */
  const getActiveSection = lang =>
    langSections.find(s => s.dataset.lang === lang);

  const updateVisibility = lang => {
    langSections.forEach(s => {
      s.classList.toggle("active", s.dataset.lang === lang);
    });
  };

  const updateBadges = lang => {
    langBadges.forEach(b => {
      b.classList.toggle("active", b.dataset.lang === lang);
    });
  };

  const updateHeaderTitle = lang => {
    const titleEl = document.querySelector(".site-title");
    if (!titleEl) return;
    const h1 = getActiveSection(lang)?.querySelector("h1");
    if (h1) titleEl.textContent = h1.textContent;
  };

  const updateBreadcrumbs = lang => {
    const homeEl    = document.querySelector(".breadcrumb-link");
    const currentEl = document.querySelector(".breadcrumb-current");
    const genreEl   = document.querySelector(".breadcrumb-genre");

    if (homeEl) homeEl.textContent = lang === "ja" ? "ホーム" : "Home";

    const h1 = getActiveSection(lang)?.querySelector("h1");
    if (currentEl && h1) currentEl.textContent = h1.textContent;

    const pageGenre = document.body.dataset.genre;
    if (genreEl && pageGenre && GENRE_LABELS[lang]?.[pageGenre]) {
      genreEl.textContent = GENRE_LABELS[lang][pageGenre];
    }
  };

  /* Update the header search placeholder to match the active language */
  const updateSearchPlaceholder = lang => {
    const input = document.getElementById("header-search");
    if (!input) return;
    const key = `placeholder${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
    input.placeholder = input.dataset[key] || input.placeholder;
    input.setAttribute("aria-label",
      lang === "ja" ? "レシピを検索" : "Search recipes"
    );
  };

  const updateToggleVisibility = () => {
    if (availableLangs.length === 1) toggleBtn.style.display = "none";
  };

  const applyLanguage = lang => {
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);

    updateVisibility(lang);
    updateBadges(lang);
    updateHeaderTitle(lang);
    updateBreadcrumbs(lang);
    updateSearchPlaceholder(lang);
    updateToggleVisibility();

    document.documentElement.lang = lang;

    /* Notify other scripts that the language changed */
    document.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang } }));
  };

  /* =========================================================
     Init
     ========================================================= */
  applyLanguage(currentLang);

  /* =========================================================
     Events
     ========================================================= */
  toggleBtn.addEventListener("click", () => {
    const nextLang =
      currentLang === "en" && availableLangs.includes("ja") ? "ja" : "en";
    applyLanguage(nextLang);
  });
});
