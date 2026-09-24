const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const recipesDirectory = path.join(__dirname, "..", "_recipes");
const recipeFiles = fs.readdirSync(recipesDirectory).filter(file => file.endsWith(".md"));

function readRecipe(file) {
  const content = fs.readFileSync(path.join(recipesDirectory, file), "utf8");
  const frontMatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(frontMatter, `${file} must have YAML front matter`);

  const scalar = key => {
    const match = frontMatter[1].match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
    return match?.[1].trim() || "";
  };

  return { content, file, genre: scalar("genre"), order: Number(scalar("order")) };
}

test("every recipe has complete bilingual content", () => {
  recipeFiles.map(readRecipe).forEach(({ content, file }) => {
    assert.equal((content.match(/data-lang="en"/g) || []).length, 1, `${file} needs one English section`);
    assert.equal((content.match(/data-lang="ja"/g) || []).length, 1, `${file} needs one Japanese section`);
    assert.match(content, /^ingredients_en:/m, `${file} needs English search ingredients`);
    assert.match(content, /^ingredients_ja:/m, `${file} needs Japanese search ingredients`);
  });
});

test("recipe order values are positive and unique within each genre", () => {
  const recipesByGenre = new Map();
  recipeFiles.map(readRecipe).forEach(recipe => {
    if (!recipesByGenre.has(recipe.genre)) recipesByGenre.set(recipe.genre, []);
    recipesByGenre.get(recipe.genre).push(recipe);
  });

  recipesByGenre.forEach((recipes, genre) => {
    recipes.forEach(recipe => {
      assert.ok(Number.isInteger(recipe.order) && recipe.order > 0, `${recipe.file} needs a positive order`);
    });

    const orders = recipes.map(recipe => recipe.order);
    assert.equal(new Set(orders).size, orders.length, `${genre} recipe order values must be unique`);
  });
});
