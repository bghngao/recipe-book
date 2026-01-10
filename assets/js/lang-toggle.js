document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggle-btn");
  const langSections = Array.from(document.querySelectorAll(".lang"));
  const langBadges = Array.from(document.querySelectorAll(".lang-badge"));

  if (!toggleBtn || langSections.length === 0) return;

  /* =========================================================
     Configuration
     ========================================================= */
  const GENRE_LABELS = {
    en: {
      main: "Main Dishes",
      dessert: "Desserts",
      sauce: "Sauces"
    },
    ja: {
      main: "メイン料理",
      dessert: "デザート",
      sauce: "ソース"
    }
  };

  /* =========================================================
     State
     ========================================================= */
  const availableLangs = langSections.map(section => section.dataset.lang);
  const browserLang = navigator.language.startsWith("ja") ? "ja" : "en";

  let currentLang = availableLangs.includes(browserLang)
    ? browserLang
    : availableLangs[0];

  /* =========================================================
     Helpers
     ========================================================= */
  const getActiveSection = lang =>
    langSections.find(section => section.dataset.lang === lang);

  const updateVisibility = lang => {
    langSections.forEach(section => {
      section.classList.toggle("active", section.dataset.lang === lang);
    });
  };

  const updateBadges = lang => {
    langBadges.forEach(badge => {
      badge.classList.toggle("active", badge.dataset.lang === lang);
    });
  };

  const updateHeaderTitle = lang => {
    const titleEl = document.querySelector(".site-title");
    if (!titleEl) return;

    const h1 = getActiveSection(lang)?.querySelector("h1");
    if (h1) titleEl.textContent = h1.textContent;
  };

  const updateBreadcrumbs = lang => {
    const homeEl = document.querySelector(".breadcrumb-link");
    const currentEl = document.querySelector(".breadcrumb-current");
    const genreEl = document.querySelector(".breadcrumb-genre");

    if (homeEl) {
      homeEl.textContent = lang === "ja" ? "ホーム" : "Home";
    }

    const h1 = getActiveSection(lang)?.querySelector("h1");
    if (currentEl && h1) {
      currentEl.textContent = h1.textContent;
    }

    const pageGenre = document.body.dataset.genre;
    if (genreEl && pageGenre && GENRE_LABELS[lang]?.[pageGenre]) {
      genreEl.textContent = GENRE_LABELS[lang][pageGenre];
    }
  };

  const updateToggleVisibility = () => {
    if (availableLangs.length === 1) {
      toggleBtn.style.display = "none";
    }
  };

  const applyLanguage = lang => {
    updateVisibility(lang);
    updateBadges(lang);
    updateHeaderTitle(lang);
    updateBreadcrumbs(lang);
    updateToggleVisibility();
  };

  /* =========================================================
     Init
     ========================================================= */
  applyLanguage(currentLang);

  /* =========================================================
     Events
     ========================================================= */
  toggleBtn.addEventListener("click", () => {
    currentLang = currentLang === "en" ? "ja" : "en";
    applyLanguage(currentLang);
  });
});
