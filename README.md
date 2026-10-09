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

Use Ruby 3.3 and Bundler (the version in `Gemfile.lock`):

```bash
bundle install
bundle exec jekyll serve
```

Then open the local URL printed by Jekyll.

## Deploy to GitHub Pages

Push this repository to GitHub and enable Pages for the branch containing the site. GitHub Pages will build the Jekyll site automatically.

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request targeting `main` and every
push to `main`, without path filters. Both jobs use GitHub-hosted Ubuntu runners
with only `contents: read` permission and no deployment credentials.

- **Tests** uses Node.js 24 and runs `npm test`. The tests use Node built-ins, so
  no npm install or npm lockfile is needed.
- **Jekyll Build** uses Ruby 3.3 and `ruby/setup-ruby` to install and cache the
  exact dependencies in `Gemfile.lock` with frozen Bundler resolution. It runs a
  complete production `bundle exec jekyll build --trace`, then
  `bundle exec ruby scripts/verify-site.rb`. Verification checks the homepage,
  every recipe's generated page, rendered layout and bilingual content, complete
  JSON search indexes, and nonempty, unchanged CSS, JavaScript, image and robots
  assets. This does not deploy the site or test browser behavior/external fonts.

To reproduce locally after `bundle install`:

```bash
npm test
JEKYLL_ENV=production bundle exec jekyll build --trace
bundle exec ruby scripts/verify-site.rb
```

Commit both `Gemfile` and `Gemfile.lock` when updating gems. Run `bundle update`
(or update a specific gem), repeat the checks above, and review the lockfile diff.
Jekyll's generated output and local Bundler files are ignored; development and CI
files are excluded from the published site via `_config.yml`.

### Make checks mandatory in Protect Main

After this workflow has run on a pull request, open the repository's **Settings →
Rules → Rulesets → Protect Main** (create a branch ruleset with that name if it
does not exist). Set enforcement to **Active** and target `main`. Enable
**Require a pull request before merging** and **Require status checks to pass**.
Add the exact checks **Tests** and **Jekyll Build**, selecting GitHub Actions as
their source when offered. Enable **Require branches to be up to date before
merging** if desired, review bypass permissions, and save the ruleset. These job
names are stable required-check contexts; keep them unchanged or update the
ruleset together with any rename. Ruleset configuration requires repository admin
access and is separate from adding this workflow. If enabling a merge queue,
add a `merge_group` workflow trigger before making these checks required there.
