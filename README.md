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

In **Settings → Pages**, select **Deploy from a branch**, then `main` and
`/ (root)`. GitHub Pages builds and deploys the source after merge; this CI
workflow only validates it. The bundle uses `github-pages` 232, the published
Pages dependency set, including Jekyll 3.10.0, Liquid 4.0.4, Kramdown 2.4.0,
and jekyll-sass-converter 1.5.2. Do not add a separate Jekyll or Sass converter
pin: the Pages gem owns those versions.

The Pages gem also applies the Pages plugin whitelist, safe mode, and Markdown
defaults. Both the build and verifier load it. Ruby 3.3 with Bundler 2.6.7 is
compatible with this bundle and is used by CI; the managed Pages service controls
its own Ruby runtime and deployment settings. Branch deployments use GitHub's
managed dependencies rather than installing this repository's lockfile. When
GitHub updates its published set, update the Pages gem pin and lockfile together,
then rerun CI. See [GitHub Pages dependencies](https://pages.github.com/versions/).

For project Pages URLs under `/recipe-book`, configure the appropriate `baseurl`
in `_config.yml` before deployment; custom domains or user/organization sites
may use an empty base URL. CI respects the configured URL prefix. Publishing and
repository Pages settings are separate from this PR.

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request targeting `main` and every
push to `main`, without path filters. Both jobs use GitHub-hosted Ubuntu runners
with only `contents: read` permission and no deployment credentials.

- **Tests** uses Node.js 24 and runs `npm test`. The tests use Node built-ins, so
  no npm install or npm lockfile is needed.
- **Jekyll Build** uses Ruby 3.3 and `ruby/setup-ruby` to install and cache the
  GitHub Pages dependencies in `Gemfile.lock` using Bundler 2.6.7 with frozen
  resolution. It reports the selected Pages versions and runs a
  complete production `bundle exec jekyll build --trace`, then
  `bundle exec ruby scripts/verify-site.rb`. Verification checks the homepage,
  every recipe's generated page, rendered layout, and nonempty English/Japanese
  sections inside the recipe body. Each JSON search-index entry must match its
  source recipe's URL, English/Japanese titles, genre, and ingredient arrays,
  including field presence and types. It also checks nonempty, unchanged CSS,
  JavaScript, image and robots assets. The build job runs `tests/verify-site.rb`
  to prove that missing/empty language content, missing/corrupted/mismatched
  search fields, malformed indexes, duplicate entries, and commented-out markup
  fail validation. This does not deploy the site or test browser behavior or
  external fonts.

To reproduce locally after `bundle install`:

```bash
npm test
JEKYLL_ENV=production bundle exec jekyll build --trace
bundle exec ruby tests/verify-site.rb
bundle exec ruby scripts/verify-site.rb
```

Commit both `Gemfile` and `Gemfile.lock` when updating gems. Update the
`github-pages` pin to the published Pages version and run
`bundle update github-pages`, repeat the checks above, and review the lockfile
diff.
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
