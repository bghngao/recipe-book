# Family Recipe Book

A bilingual static recipe blog built with Jekyll Markdown collections and ready for GitHub Pages.

## Features

- Recipes live in the `_recipes` collection.
- Recipe pages are generated as static pages at `/recipes/<recipe-name>/`.
- English/Japanese language toggle is stored in `localStorage`.
- One shared search bar finds recipes by recipe name or by ingredients from `ingredients_en` / `ingredients_ja` front matter.

## Add a recipe

Create a Markdown file in `_recipes/` with front matter like:

```yaml
---
layout: default
title: Example Recipe
title_en: Example Recipe
title_ja: 例のレシピ
genre: main
order: 1
ingredients_en:
  - Butter
  - Eggs
ingredients_ja:
  - バター
  - 卵
---
```

The combined search uses recipe titles plus the `ingredients_en` and `ingredients_ja` arrays, so keep those arrays in sync with the displayed ingredient list.

## Run locally

If you have Jekyll installed:

```bash
jekyll serve
```

Then open the local URL printed by Jekyll.

## Deploy to GitHub Pages

Push this repository to GitHub and enable Pages for the branch containing the site. GitHub Pages will build the Jekyll site automatically.
