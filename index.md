---
layout: default
title: Home
---

{% assign genres = "main,dessert,sauce" | split: "," %}

<!-- ================= ENGLISH ================= -->
<div class="lang" data-lang="en">
  <h1 class="title-recipe">🍲 Recipe Book</h1>

  <section class="container search-panel" aria-labelledby="ingredient-search-title-en">
    <h2 id="ingredient-search-title-en" class="title-ingredient">Search by Ingredient</h2>
    <label for="ingredient-search-en" class="search-label">Find recipes containing:</label>
    <input id="ingredient-search-en" class="ingredient-search-input" type="search" autocomplete="off" placeholder="e.g. butter, egg, pineapple">
    <p id="ingredient-empty-en" class="ingredient-empty" hidden>No recipes contain that ingredient.</p>
    <ul id="ingredient-results-en" class="ingredient-results" hidden></ul>
  </section>

  {% for genre in genres %}
    {% assign recipes = site.recipes | where: "genre", genre | sort: "order" %}
    {% if recipes.size > 0 %}
      <details class="container">
        <summary class="title-ingredient">
          {% case genre %}
            {% when "main" %} 🍝 Main Dishes
            {% when "dessert" %} 🍰 Desserts
            {% when "sauce" %} 🥣 Sauces
          {% endcase %}
        </summary>

        <ul>
          {% for recipe in recipes %}
            <li>
              <a href="{{ recipe.url | relative_url }}">
                {{ recipe.title_en | default: recipe.title }}
              </a>
            </li>
          {% endfor %}
        </ul>
      </details>
    {% endif %}
  {% endfor %}
</div>

<!-- ================= JAPANESE ================= -->
<div class="lang" data-lang="ja">
  <h1 class="title-recipe">🍲 料理本</h1>

  <section class="container search-panel" aria-labelledby="ingredient-search-title-ja">
    <h2 id="ingredient-search-title-ja" class="title-ingredient">材料で検索</h2>
    <label for="ingredient-search-ja" class="search-label">この材料を含むレシピ:</label>
    <input id="ingredient-search-ja" class="ingredient-search-input" type="search" autocomplete="off" placeholder="例：バター、卵、パイナップル">
    <p id="ingredient-empty-ja" class="ingredient-empty" hidden>その材料を含むレシピは見つかりませんでした。</p>
    <ul id="ingredient-results-ja" class="ingredient-results" hidden></ul>
  </section>

  {% for genre in genres %}
    {% assign recipes = site.recipes | where: "genre", genre | sort: "order" %}
    {% if recipes.size > 0 %}
      <details class="container">
        <summary class="title-ingredient">
          {% case genre %}
            {% when "main" %} 🍝 メイン料理
            {% when "dessert" %} 🍰 デザート
            {% when "sauce" %} 🥣 ソース
          {% endcase %}
        </summary>

        <ul>
          {% for recipe in recipes %}
            <li>
              <a href="{{ recipe.url | relative_url }}">
                {{ recipe.title_ja | default: recipe.title }}
              </a>
            </li>
          {% endfor %}
        </ul>
      </details>
    {% endif %}
  {% endfor %}
</div>
