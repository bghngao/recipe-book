---
layout: default
title: Home
---

{% assign genres = "main,dessert,sauce" | split: "," %}

<!-- ================= ENGLISH ================= -->
<div class="lang" data-lang="en">
  <h1 class="title-recipe">🍲 Recipe Book</h1>

  <!-- Ingredient Search Panel -->
  <div class="container ingredient-search-panel">
    <h2 class="title-ingredient">🔍 Find by Ingredient</h2>
    <div class="ingredient-search-row">
      <input
        id="ingredient-search-en"
        class="ingredient-search-input"
        type="search"
        autocomplete="off"
        spellcheck="false"
        placeholder="e.g. butter, coconut milk…"
        aria-label="Search by ingredient"
      >
    </div>
    <ul id="ingredient-results-en" class="ingredient-results" hidden></ul>
    <p id="ingredient-empty-en" class="ingredient-empty" hidden>No recipes found with that ingredient.</p>
  </div>

  <!-- Genre Accordions -->
  {% for genre in genres %}
    {% assign recipes = site.recipes | where: "genre", genre | sort: "order" %}
    {% if recipes.size > 0 %}
      <details class="container" open>
        <summary class="title-ingredient">
          {% case genre %}
            {% when "main" %} 🍝 Main Dishes
            {% when "dessert" %} 🍰 Desserts
            {% when "sauce" %} 🥣 Sauces
          {% endcase %}
        </summary>
        <ul class="recipe-list">
          {% for recipe in recipes %}
            <li class="recipe-list-item" data-title-en="{{ recipe.title_en | default: recipe.title }}" data-title-ja="{{ recipe.title_ja | default: recipe.title }}">
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

  <!-- 食材検索パネル -->
  <div class="container ingredient-search-panel">
    <h2 class="title-ingredient">🔍 食材で探す</h2>
    <div class="ingredient-search-row">
      <input
        id="ingredient-search-ja"
        class="ingredient-search-input"
        type="search"
        autocomplete="off"
        spellcheck="false"
        placeholder="例：バター、ココナッツミルク…"
        aria-label="食材で検索"
      >
    </div>
    <ul id="ingredient-results-ja" class="ingredient-results" hidden></ul>
    <p id="ingredient-empty-ja" class="ingredient-empty" hidden>その食材を使ったレシピが見つかりませんでした。</p>
  </div>

  <!-- ジャンル別アコーディオン -->
  {% for genre in genres %}
    {% assign recipes = site.recipes | where: "genre", genre | sort: "order" %}
    {% if recipes.size > 0 %}
      <details class="container" open>
        <summary class="title-ingredient">
          {% case genre %}
            {% when "main" %} 🍝 メイン料理
            {% when "dessert" %} 🍰 デザート
            {% when "sauce" %} 🥣 ソース
          {% endcase %}
        </summary>
        <ul class="recipe-list">
          {% for recipe in recipes %}
            <li class="recipe-list-item" data-title-en="{{ recipe.title_en | default: recipe.title }}" data-title-ja="{{ recipe.title_ja | default: recipe.title }}">
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
