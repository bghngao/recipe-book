# Family Recipe Book

A bilingual static recipe blog built with Jekyll Markdown collections and ready for GitHub Pages.

## Features

- Recipes live in the `_recipes` collection.
- Recipe pages are generated as static pages at `/recipes/<recipe-name>/`.
- English/Japanese language toggle is stored in `localStorage`.
- Header search finds recipes by name.
- Home-page ingredient search finds all recipes whose `ingredients_en` or `ingredients_ja` front matter contains the entered ingredient.

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

The ingredient search uses the `ingredients_en` and `ingredients_ja` arrays, so keep those in sync with the displayed ingredient list.

## Run locally

If you have Jekyll installed:

```bash
jekyll serve
```

Then open the local URL printed by Jekyll.

## Deploy to GitHub Pages

Push this repository to GitHub and enable Pages for the branch containing the site. GitHub Pages will build the Jekyll site automatically.
