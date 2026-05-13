---
layout: default
title: Home
---

{% assign genres = "main,dessert,sauce,drink" | split: "," %}

<!-- ================= ENGLISH ================= -->
<div class="lang" data-lang="en">
  <h1 class="title-recipe">🍲 Recipe Book</h1>

  {% for genre in genres %}
    {% assign recipes = site.recipes | where: "genre", genre | sort: "order" %}
    {% if recipes.size > 0 %}
      <details class="container">
        <summary class="title-ingredient">
          {% case genre %}
            {% when "main" %} 🍝 Main Dishes
            {% when "dessert" %} 🍰 Desserts
            {% when "sauce" %} 🥣 Sauces
            {% when "drink" %} 🍹 Drinks
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

  {% for genre in genres %}
    {% assign recipes = site.recipes | where: "genre", genre | sort: "order" %}
    {% if recipes.size > 0 %}
      <details class="container">
        <summary class="title-ingredient">
          {% case genre %}
            {% when "main" %} 🍝 メイン料理
            {% when "dessert" %} 🍰 デザート
            {% when "sauce" %} 🥣 ソース
            {% when "drink" %} 🍹 ドリンク
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
