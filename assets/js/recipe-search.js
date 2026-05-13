/* =============================================================
   recipe-search.js
   Single live search bar for static Jekyll pages.
   Searches recipe titles and ingredient front matter in English/Japanese.
   ============================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const dataEl = document.getElementById("recipe-data");
  const searchInput = document.getElementById("header-search");
  const searchResults = document.getElementById("header-search-results");

  if (!dataEl || !searchInput || !searchResults) return;

  let recipes = [];
  try {
    recipes = JSON.parse(dataEl.textContent);
  } catch (e) {
    console.warn("recipe-search: could not parse recipe data", e);
    return;
  }

  let currentLang = document.documentElement.lang || "en";

  const titleFor = (recipe, lang) =>
    lang === "ja"
      ? (recipe.title_ja || recipe.title_en || recipe.title)
      : (recipe.title_en || recipe.title_ja || recipe.title);

  const genreLabel = (genre, lang) => {
    const labels = {
      en: { main: "Main Dishes", dessert: "Desserts", sauce: "Sauces" },
      ja: { main: "メイン料理", dessert: "デザート", sauce: "ソース" }
    };
    return labels[lang]?.[genre] || genre || "";
  };

  const normalise = value =>
    String(value || "")
      .toLowerCase()
      .replace(/\(.*?\)/g, "")
      .replace(/（.*?）/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const unique = values => Array.from(new Set(values.filter(Boolean)));

  const matchingIngredients = (recipe, query, normalisedQuery) => {
    const ingredients = unique([
      ...(recipe.ingredients_en || []),
      ...(recipe.ingredients_ja || [])
    ]);

    return ingredients.filter(ingredient => {
      const raw = String(ingredient || "");
      return normalise(raw).includes(normalisedQuery) || raw.includes(query);
    });
  };

  const recipeMatches = query => {
    const trimmedQuery = query.trim();
    const normalisedQuery = normalise(trimmedQuery);

    if (!normalisedQuery) return [];

    return recipes
      .map(recipe => {
        const titleEn = normalise(recipe.title_en || recipe.title || "");
        const titleJa = normalise(recipe.title_ja || recipe.title || "");
        const titleHit = titleEn.includes(normalisedQuery) || titleJa.includes(normalisedQuery);
        const ingredientHits = matchingIngredients(recipe, trimmedQuery, normalisedQuery);

        if (!titleHit && ingredientHits.length === 0) return null;

        return {
          recipe,
          titleHit,
          ingredientHits: ingredientHits.slice(0, 3)
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        /* Put direct title matches before ingredient-only matches, then alphabetise. */
        if (a.titleHit !== b.titleHit) return a.titleHit ? -1 : 1;
        return titleFor(a.recipe, currentLang).localeCompare(titleFor(b.recipe, currentLang), currentLang);
      });
  };

  const hideResults = () => {
    searchResults.hidden = true;
    searchInput.setAttribute("aria-expanded", "false");
  };

  const showResults = matches => {
    searchResults.innerHTML = "";

    if (matches.length === 0) {
      const li = document.createElement("li");
      li.className = "header-search-no-results";
      li.textContent = currentLang === "ja"
        ? "レシピまたは材料が見つかりませんでした"
        : "No recipes or ingredients found";
      searchResults.appendChild(li);
    } else {
      matches.forEach(({ recipe, titleHit, ingredientHits }) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = recipe.url;
        a.setAttribute("role", "option");

        const left = document.createElement("span");
        left.className = "search-result-main";

        const name = document.createElement("span");
        name.className = "search-result-title";
        name.textContent = titleFor(recipe, currentLang);
        left.appendChild(name);

        if (ingredientHits.length > 0) {
          const chips = document.createElement("span");
          chips.className = "search-result-chips";

          ingredientHits.forEach(ingredient => {
            const chip = document.createElement("span");
            chip.className = "ingredient-match-chip";
            chip.textContent = ingredient;
            chips.appendChild(chip);
          });

          left.appendChild(chips);
        } else if (titleHit) {
          const chip = document.createElement("span");
          chip.className = "recipe-title-match-chip";
          chip.textContent = currentLang === "ja" ? "レシピ名" : "Recipe name";
          left.appendChild(chip);
        }

        const genre = document.createElement("span");
        genre.className = "search-result-genre";
        genre.textContent = genreLabel(recipe.genre, currentLang);

        a.appendChild(left);
        a.appendChild(genre);
        li.appendChild(a);
        searchResults.appendChild(li);
      });
    }

    searchResults.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");
  };

  const runSearch = query => {
    const q = query.trim();
    if (!q) {
      hideResults();
      return;
    }

    showResults(recipeMatches(q));
  };

  searchInput.addEventListener("input", e => runSearch(e.target.value));

  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim()) runSearch(searchInput.value);
  });

  searchInput.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      searchInput.value = "";
      hideResults();
      return;
    }

    if (searchResults.hidden) return;

    const links = Array.from(searchResults.querySelectorAll("a"));
    if (!links.length) return;

    const focused = searchResults.querySelector("a:focus");
    const idx = links.indexOf(focused);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      links[(idx + 1) % links.length].focus();
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      links[(idx - 1 + links.length) % links.length].focus();
    }
  });

  document.addEventListener("click", e => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      hideResults();
    }
  });

  document.addEventListener("languageChanged", e => {
    currentLang = e.detail.lang;
    searchInput.placeholder = currentLang === "ja"
      ? "レシピ名または材料で検索"
      : "Search recipes or ingredients";
    searchInput.setAttribute("aria-label", searchInput.placeholder);

    if (searchInput.value.trim()) runSearch(searchInput.value);
  });
});
