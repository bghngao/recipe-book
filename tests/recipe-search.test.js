const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const script = fs.readFileSync(
  path.join(__dirname, "..", "assets", "js", "recipe-search.js"),
  "utf8"
);

class FakeElement {
  constructor() {
    this.attributes = {};
    this.children = [];
    this.hidden = true;
    this.listeners = new Map();
    this.textContent = "";
    this.value = "";
    this.ownerDocument = null;
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  contains(target) {
    return target === this || this.children.includes(target);
  }

  focus() {
    if (this.ownerDocument) this.ownerDocument.activeElement = this;
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  set innerHTML(value) {
    if (value === "") this.children = [];
  }

  querySelector() {
    return null;
  }

  querySelectorAll(selector) {
    if (selector === "a") {
      return this.children.flatMap(child => child.children.filter(grandchild => grandchild.tagName === "a"));
    }
    return [];
  }
}

function loadSearch(language) {
  const data = new FakeElement();
  const input = new FakeElement();
  const results = new FakeElement();
  const documentListeners = new Map();
  const domReadyListeners = [];

  data.textContent = JSON.stringify([
    {
      title_en: "Plantation Ice Tea",
      title_ja: "プランテーションアイスティー",
      url: "/recipes/plantation-ice-tea/",
      genre: "drink",
      ingredients_en: ["Black tea"],
      ingredients_ja: ["紅茶"]
    },
    {
      title_en: "Zzz Ice Tea",
      title_ja: "ズズズアイスティー",
      url: "/recipes/zzz-ice-tea/",
      genre: "drink",
      ingredients_en: ["Black tea"],
      ingredients_ja: ["紅茶"]
    }
  ]);

  const document = {
    activeElement: null,
    documentElement: { lang: language },
    addEventListener(type, listener) {
      if (type === "DOMContentLoaded") domReadyListeners.push(listener);
      else documentListeners.set(type, listener);
    },
    createElement(tagName) {
      const element = new FakeElement();
      element.tagName = tagName;
      element.ownerDocument = document;
      return element;
    },
    getElementById(id) {
      return {
        "recipe-data": data,
        "header-search": input,
        "header-search-results": results
      }[id] || null;
    }
  };

  input.ownerDocument = document;
  results.ownerDocument = document;

  vm.runInNewContext(script, { console, document });
  domReadyListeners[0]();

  input.value = language === "ja" ? "アイスティー" : "Ice Tea";
  input.listeners.get("input")({ target: input });

  const link = results.children[0].children[0];
  const genre = link.children[1];
  return { document, genre, input, results };
}

test("shows the English label for drink search results", () => {
  const { genre, results } = loadSearch("en");

  assert.equal(results.hidden, false);
  assert.equal(genre.textContent, "Drinks");
});

test("shows the Japanese label for drink search results", () => {
  const { genre, results } = loadSearch("ja");

  assert.equal(results.hidden, false);
  assert.equal(genre.textContent, "ドリンク");
});

test("continues keyboard navigation after focus moves into search results", () => {
  const { document, input, results } = loadSearch("en");
  const links = results.querySelectorAll("a");
  const keyEvent = key => ({ key, preventDefault() {} });

  input.listeners.get("keydown")(keyEvent("ArrowDown"));
  assert.equal(document.activeElement, links[0]);

  results.listeners.get("keydown")(keyEvent("ArrowDown"));
  assert.equal(document.activeElement, links[1]);

  results.listeners.get("keydown")(keyEvent("ArrowUp"));
  assert.equal(document.activeElement, links[0]);

  results.listeners.get("keydown")(keyEvent("Escape"));
  assert.equal(document.activeElement, input);
  assert.equal(input.value, "");
  assert.equal(results.hidden, true);
});
