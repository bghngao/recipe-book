---
layout: default
title: Home
---

<button id="toggle-btn">日本語</button>

{% assign genres = "main,dessert,sauce" | split: "," %}

<!-- English -->
<div class="lang active" data-lang="en">
  <h1 class="title-recipe">🍲 Family Recipe Book</h1>

  {% for genre in genres %}
  <details class="container">
    <summary class="title-ingredient">
      {% case genre %}
        {% when "main" %} 🍝 Main Dishes
        {% when "dessert" %} 🍰 Desserts
        {% when "sauce" %} 🥣 Sauces
      {% endcase %}
    </summary>

    <ul>
      {% assign recipes = site.recipes | where: "genre", genre | sort: "order" %}
      {% for recipe in recipes %}
        <li>
          <a href="{{ recipe.url | relative_url }}">
            {{ recipe.title_en }}
          </a>
        </li>
      {% endfor %}
    </ul>
  </details>
  {% endfor %}
</div>

<!-- Japanese -->
<div class="lang" data-lang="ja">
  <h1 class="title-recipe">🍲 レシピ集</h1>

  {% for genre in genres %}
  <details class="container">
    <summary class="title-ingredient">
      {% case genre %}
        {% when "main" %} 🍝 メイン料理
        {% when "dessert" %} 🍰 デザート
        {% when "sauce" %} 🥣 ソース
      {% endcase %}
    </summary>

    <ul>
      {% assign recipes = site.recipes | where: "genre", genre | sort: "order" %}
      {% for recipe in recipes %}
        <li>
          <a href="{{ recipe.url | relative_url }}">
            {{ recipe.title_ja }}
          </a>
        </li>
      {% endfor %}
    </ul>
  </details>
  {% endfor %}
</div>
