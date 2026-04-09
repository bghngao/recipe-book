/* =============================================================
   recipe-search.js
   Handles:
     1. Header name search   — live dropdown on every page
     2. Ingredient search    — panel on the index page only
   Both features read from the #recipe-data JSON block that
   Jekyll embeds at build time in default.html.
   ============================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     0. Load recipe index
     ========================================================= */
  const dataEl = document.getElementById("recipe-data");
  if (!dataEl) return;

  let recipes = [];
  try {
    recipes = JSON.parse(dataEl.textContent);
  } catch (e) {
    console.warn("recipe-search: could not parse recipe data", e);
    return;
  }

  /* =========================================================
     Shared helpers
     ========================================================= */

  /* Current UI language, kept in sync via the languageChanged event */
  let currentLang = document.documentElement.lang || "en";

  document.addEventListener("languageChanged", e => {
    currentLang = e.detail.lang;
    /* Re-run any active searches so results flip language */
    triggerHeaderSearch();
    triggerIngredientSearch();
  });

  const titleFor = (recipe, lang) =>
    lang === "ja"
      ? (recipe.title_ja || recipe.title_en)
      : (recipe.title_en || recipe.title_ja);

  const genreLabel = (genre, lang) => {
    const labels = {
      en: { main: "Main Dishes", dessert: "Desserts", sauce: "Sauces" },
      ja: { main: "メイン料理",  dessert: "デザート",  sauce: "ソース"  }
    };
    return labels[lang]?.[genre] || genre;
  };

  /* Normalise a string for fuzzy matching:
     lowercase, strip bracketed notes like (Optional) / （お好みで） */
  const normalise = str =>
    str
      .toLowerCase()
      .replace(/\(.*?\)/g, "")   // remove (…)
      .replace(/（.*?）/g, "")   // remove （…）
      .trim();

  /* =========================================================
     1. HEADER NAME SEARCH
     ========================================================= */
  const headerInput   = document.getElementById("header-search");
  const headerResults = document.getElementById("header-search-results");

  const triggerHeaderSearch = () => {
    if (headerInput) runHeaderSearch(headerInput.value);
  };

  const showHeaderResults = items => {
    if (!headerResults) return;
    headerResults.innerHTML = "";

    if (items.length === 0) {
      const li = document.createElement("li");
      li.className = "header-search-no-results";
      li.textContent = currentLang === "ja"
        ? "レシピが見つかりませんでした"
        : "No recipes found";
      headerResults.appendChild(li);
    } else {
      items.forEach(recipe => {
        const li  = document.createElement("li");
        const a   = document.createElement("a");
        a.href    = recipe.url;
        a.setAttribute("role", "option");

        const name  = document.createTextNode(titleFor(recipe, currentLang));
        const genre = document.createElement("span");
        genre.className = "search-result-genre";
        genre.textContent = genreLabel(recipe.genre, currentLang);

        a.appendChild(name);
        a.appendChild(genre);
        li.appendChild(a);
        headerResults.appendChild(li);
      });
    }

    headerResults.hidden = false;
  };

  const hideHeaderResults = () => {
    if (headerResults) headerResults.hidden = true;
  };

  const runHeaderSearch = query => {
    if (!headerInput || !headerResults) return;
    const q = query.trim().toLowerCase();
    if (!q) { hideHeaderResults(); return; }

    const matches = recipes.filter(r => {
      const en = (r.title_en || "").toLowerCase();
      const ja = (r.title_ja || "").toLowerCase();
      return en.includes(q) || ja.includes(q);
    });

    showHeaderResults(matches);
  };

  if (headerInput) {
    headerInput.addEventListener("input", e => runHeaderSearch(e.target.value));

    headerInput.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        hideHeaderResults();
        headerInput.value = "";
      }
      /* Arrow-key navigation through results */
      if (!headerResults || headerResults.hidden) return;
      const links = Array.from(headerResults.querySelectorAll("a"));
      if (!links.length) return;
      const focused = headerResults.querySelector("a:focus");
      const idx     = links.indexOf(focused);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        links[(idx + 1) % links.length].focus();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        links[(idx - 1 + links.length) % links.length].focus();
      }
    });

    /* Close dropdown when clicking outside */
    document.addEventListener("click", e => {
      if (!headerInput.contains(e.target) && !headerResults?.contains(e.target)) {
        hideHeaderResults();
      }
    });

    /* Reopen if user clicks back into the filled input */
    headerInput.addEventListener("focus", () => {
      if (headerInput.value.trim()) runHeaderSearch(headerInput.value);
    });
  }

  /* =========================================================
     2. INGREDIENT SEARCH (index page only)
     ========================================================= */

  /* There are two independent inputs — one per language section.
     Both write to the same shared state so switching language
     while a search is active preserves the results. */

  const ingInputEn     = document.getElementById("ingredient-search-en");
  const ingInputJa     = document.getElementById("ingredient-search-ja");
  const ingResultsEn   = document.getElementById("ingredient-results-en");
  const ingResultsJa   = document.getElementById("ingredient-results-ja");
  const ingEmptyEn     = document.getElementById("ingredient-empty-en");
  const ingEmptyJa     = document.getElementById("ingredient-empty-ja");

  /* Only wire up if the page has the ingredient panel */
  if (!ingInputEn && !ingInputJa) return;

  let lastIngredientQuery = "";

  const triggerIngredientSearch = () => {
    if (lastIngredientQuery) runIngredientSearch(lastIngredientQuery);
  };

  const buildIngredientResults = (matches, lang) => {
    const resultsList = lang === "ja" ? ingResultsJa  : ingResultsEn;
    const emptyMsg    = lang === "ja" ? ingEmptyJa    : ingEmptyEn;

    if (!resultsList) return;

    resultsList.innerHTML = "";

    if (matches.length === 0) {
      resultsList.hidden = true;
      if (emptyMsg) emptyMsg.hidden = false;
      return;
    }

    if (emptyMsg) emptyMsg.hidden = true;

    matches.forEach(({ recipe, matchedIngredients }) => {
      const li = document.createElement("li");
      const a  = document.createElement("a");
      a.href   = recipe.url;

      /* Recipe title */
      const nameSpan = document.createElement("span");
      nameSpan.textContent = titleFor(recipe, lang);

      /* Genre tag */
      const genreTag = document.createElement("span");
      genreTag.className   = "result-genre-tag";
      genreTag.textContent = genreLabel(recipe.genre, lang);

      /* Matched ingredient chips — show the matched raw ingredient names */
      const chipsWrapper = document.createElement("span");
      chipsWrapper.style.marginLeft = "6px";
      matchedIngredients.forEach(ing => {
        const chip = document.createElement("span");
        chip.className   = "ingredient-match-chip";
        chip.textContent = ing;
        chipsWrapper.appendChild(chip);
      });

      const left = document.createElement("span");
      left.appendChild(nameSpan);
      left.appendChild(chipsWrapper);

      a.appendChild(left);
      a.appendChild(genreTag);
      li.appendChild(a);
      resultsList.appendChild(li);
    });

    resultsList.hidden = false;
  };

  const runIngredientSearch = query => {
    lastIngredientQuery = query;
    const q = normalise(query);

    if (!q) {
      [ingResultsEn, ingResultsJa].forEach(el => { if (el) el.hidden = true; });
      [ingEmptyEn,   ingEmptyJa  ].forEach(el => { if (el) el.hidden = true; });
      return;
    }

    /* Build match list once, display for both languages */
    const matches = [];

    recipes.forEach(recipe => {
      /* Check English ingredients */
      const hitEn = (recipe.ingredients_en || []).filter(ing =>
        normalise(ing).includes(q)
      );
      /* Check Japanese ingredients */
      const hitJa = (recipe.ingredients_ja || []).filter(ing =>
        ing.includes(query.trim())           /* Japanese: don't lowercase */
        || normalise(ing).includes(q)
      );

      const allHits = [...new Set([...hitEn, ...hitJa])];
      if (allHits.length > 0) {
        matches.push({ recipe, matchedIngredients: allHits.slice(0, 3) });
      }
    });

    buildIngredientResults(matches, "en");
    buildIngredientResults(matches, "ja");
  };

  const attachIngredientInput = input => {
    if (!input) return;
    input.addEventListener("input", e => runIngredientSearch(e.target.value));
    input.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        input.value = "";
        runIngredientSearch("");
      }
    });
  };

  attachIngredientInput(ingInputEn);
  attachIngredientInput(ingInputJa);

  /* Keep the two inputs in sync when the user types in either one */
  if (ingInputEn && ingInputJa) {
    ingInputEn.addEventListener("input", () => { ingInputJa.value = ingInputEn.value; });
    ingInputJa.addEventListener("input", () => { ingInputEn.value = ingInputJa.value; });
  }
});
