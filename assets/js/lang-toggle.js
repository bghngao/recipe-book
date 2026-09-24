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
      sauce: "Sauces",
      drink: "Drinks"
    },
    ja: {
      main: "メイン料理",
      dessert: "デザート",
      sauce: "ソース",
      drink: "ドリンク"
    }
  };

  const UI_LABELS = {
    en: {
      breadcrumb: "Breadcrumb",
      home: "Home",
      search: "Search recipes or ingredients",
      siteTitle: "Family Recipe Book",
      toggle: "Switch to Japanese"
    },
    ja: {
      breadcrumb: "パンくずリスト",
      home: "ホーム",
      search: "レシピ名または材料で検索",
      siteTitle: "ファミリーレシピブック",
      toggle: "英語に切り替える"
    }
  };

  const STORAGE_KEY = "preferredLanguage";

  const readStoredLanguage = () => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.warn("lang-toggle: could not read language preference", error);
      return null;
    }
  };

  const saveLanguage = lang => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (error) {
      console.warn("lang-toggle: could not save language preference", error);
    }
  };

  /* =========================================================
     State
     ========================================================= */
  const availableLangs = langSections.map(section => section.dataset.lang);
  const browserLang = navigator.language.startsWith("ja") ? "ja" : "en";
  const savedLang = readStoredLanguage();
  const urlLang = new URL(window.location.href).searchParams.get("lang");

  let currentLang =
    urlLang && availableLangs.includes(urlLang)
      ? urlLang
      : savedLang && availableLangs.includes(savedLang)
      ? savedLang
      : availableLangs.includes(browserLang)
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

  const pageTitleFor = lang => {
    const h1 = getActiveSection(lang)?.querySelector("h1");
    if (!h1) return "";

    return h1.textContent.replace(/^[^\p{L}\p{N}]+/u, "").trim();
  };

  const updateDocumentTitle = lang => {
    const pageTitle = pageTitleFor(lang);
    if (pageTitle) document.title = `${pageTitle} | ${UI_LABELS[lang].siteTitle}`;
  };

  const updateSearchText = lang => {
    const input = document.getElementById("header-search");
    const label = document.querySelector(".header-search-label");
    const searchText = UI_LABELS[lang].search;

    if (input) {
      input.placeholder = searchText;
      input.setAttribute("aria-label", searchText);
    }

    if (label) label.textContent = searchText;
  };

  const updateBreadcrumbs = lang => {
    const currentEl = document.querySelector(".breadcrumb-current");
    const genreEl = document.querySelector(".breadcrumb-genre");
    const homeEl = document.querySelector(".breadcrumb-home");
    const navEl = document.querySelector(".breadcrumb-nav");

    const pageTitle = pageTitleFor(lang);
    if (currentEl && pageTitle) currentEl.textContent = pageTitle;
    if (homeEl) homeEl.textContent = UI_LABELS[lang].home;
    if (navEl) navEl.setAttribute("aria-label", UI_LABELS[lang].breadcrumb);

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

  const updateToggleAccessibility = lang => {
    toggleBtn.setAttribute("aria-label", UI_LABELS[lang].toggle);
  };

  const updateLanguageUrl = lang => {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", lang);
    window.history.replaceState(null, "", url.toString());
  };

  /*
     English and Japanese are rendered as separate page sections. Switching
     their display state while the reader is partway down a recipe otherwise
     leaves the browser at the same absolute scroll offset, which can show a
     different part of the translated recipe.

     Remember the visible content block and its viewport position so the
     matching block in the other language can be put in the same place.
  */
  const capturePageContext = section => {
    if (!section) return null;

    const blocks = Array.from(section.querySelectorAll("h1, .container"));
    if (blocks.length === 0) return null;

    const headerBottom = document.querySelector(".site-header")?.getBoundingClientRect().bottom || 0;
    const referenceY = headerBottom + 1;
    let blockIndex = 0;

    blocks.forEach((block, index) => {
      if (block.getBoundingClientRect().top <= referenceY) blockIndex = index;
    });

    return {
      blockIndex,
      top: blocks[blockIndex].getBoundingClientRect().top,
      openDetails: Array.from(section.querySelectorAll("details")).map(details => details.open)
    };
  };

  const restorePageContext = (section, context) => {
    if (!section || !context) return;

    Array.from(section.querySelectorAll("details")).forEach((details, index) => {
      if (index < context.openDetails.length) details.open = context.openDetails[index];
    });

    const blocks = Array.from(section.querySelectorAll("h1, .container"));
    const block = blocks[Math.min(context.blockIndex, blocks.length - 1)];
    if (!block) return;

    window.scrollBy(0, block.getBoundingClientRect().top - context.top);
  };

  const applyLanguage = (lang, preservePageContext = false) => {
    const pageContext = preservePageContext
      ? capturePageContext(getActiveSection(currentLang))
      : null;

    currentLang = lang;
    saveLanguage(lang);

    updateVisibility(lang);
    updateBadges(lang);
    updateDocumentTitle(lang);
    updateBreadcrumbs(lang);
    updateSearchText(lang);
    updateToggleVisibility();
    updateToggleAccessibility(lang);
    updateLanguageUrl(lang);

    document.documentElement.lang = lang;
    document.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang } }));

    if (pageContext) {
      restorePageContext(getActiveSection(lang), pageContext);
    }
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
      currentLang === "en" && availableLangs.includes("ja")
        ? "ja"
        : "en";

    applyLanguage(nextLang, true);
  });
});
