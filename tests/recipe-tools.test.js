const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const script = fs.readFileSync(
  path.join(__dirname, "..", "assets", "js", "recipe-tools.js"),
  "utf8"
);

class FakeClassList {
  constructor() {
    this.classes = new Set();
  }

  contains(name) {
    return this.classes.has(name);
  }

  add(name) {
    this.classes.add(name);
  }

  remove(name) {
    this.classes.delete(name);
  }

  toggle(name, force) {
    if (force) this.classes.add(name);
    else this.classes.delete(name);
  }
}

class FakeElement {
  constructor({ dataset = {}, textContent = "" } = {}) {
    this.attributes = {};
    this.checked = false;
    this.children = [];
    this.classList = new FakeClassList();
    this.dataset = dataset;
    this.disabled = false;
    this.listeners = new Map();
    this.selectorMap = new Map();
    this.textContent = textContent;
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  closest() {
    return this.closestElement || null;
  }

  prepend(child) {
    child.parentElement = this;
    this.children.unshift(child);
  }

  querySelector(selector) {
    return this.selectorMap.get(selector)?.[0] || null;
  }

  querySelectorAll(selector) {
    return this.selectorMap.get(selector) || [];
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }
}

function makeSection(lang, ingredientName) {
  const section = new FakeElement({ dataset: { lang } });
  const row = new FakeElement();
  const name = new FakeElement({ textContent: ingredientName });
  const heading = new FakeElement();
  const instructionContainer = new FakeElement();
  const step = new FakeElement({ textContent: "Mix well." });

  row.selectorMap.set(".column-left-ingredient", [name]);
  instructionContainer.selectorMap.set("ol > li", [step]);
  heading.closestElement = instructionContainer;
  section.selectorMap.set(".ingredient-quantity", [row]);
  section.selectorMap.set(".title-instruction", [heading]);

  return { row, section, step };
}

function loadRecipeTools({ wakeLockSupported = false } = {}) {
  const en = makeSection("en", "Salt");
  const ja = makeSection("ja", "塩");
  const wakeToggle = new FakeElement();
  const wakeLabel = new FakeElement();
  const resetButton = new FakeElement();
  const status = new FakeElement();
  const tools = new FakeElement();
  const inputs = [];
  const documentListeners = new Map();
  const domReadyListeners = [];
  const storage = new Map([
    ["recipeProgress:/recipes/example/", JSON.stringify({ ingredient: { 0: true }, step: {} })]
  ]);
  let wakeRequests = 0;
  let confirmResult = true;

  const document = {
    documentElement: { lang: "en" },
    visibilityState: "visible",
    addEventListener(type, listener) {
      if (type === "DOMContentLoaded") domReadyListeners.push(listener);
      else documentListeners.set(type, listener);
    },
    createElement(tagName) {
      const element = new FakeElement();
      if (tagName === "input") inputs.push(element);
      return element;
    },
    getElementById(id) {
      return {
        "wake-lock-toggle": wakeToggle,
        "reset-progress-btn": resetButton,
        "recipe-tools-status": status
      }[id] || null;
    },
    querySelector(selector) {
      return {
        ".wake-lock-label": wakeLabel,
        ".recipe-tools": tools
      }[selector] || null;
    },
    querySelectorAll(selector) {
      if (selector === ".lang") return [en.section, ja.section];
      if (selector === ".recipe-progress-checkbox") return inputs;

      const match = selector.match(/data-progress-type="(.+?)".*data-progress-index="(.+?)"/);
      if (match) {
        return inputs.filter(input =>
          input.dataset.progressType === match[1] && input.dataset.progressIndex === match[2]
        );
      }
      return [];
    }
  };

  const navigator = {};
  if (wakeLockSupported) {
    navigator.wakeLock = {
      async request() {
        wakeRequests += 1;
        return {
          addEventListener() {},
          async release() {}
        };
      }
    };
  }

  const window = {
    confirm: () => confirmResult,
    location: { pathname: "/recipes/example/" }
  };

  vm.runInNewContext(script, {
    console,
    document,
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value)
    },
    navigator,
    window
  });
  domReadyListeners[0]();

  return {
    documentListeners,
    en,
    inputs,
    ja,
    resetButton,
    status,
    storage,
    tools,
    wakeLabel,
    wakeRequests: () => wakeRequests,
    wakeToggle
  };
}

test("restores, synchronizes, and resets bilingual checklist progress", () => {
  const page = loadRecipeTools();
  const ingredientInputs = page.inputs.filter(input => input.dataset.progressType === "ingredient");

  assert.equal(page.inputs.length, 4);
  assert.equal(ingredientInputs.every(input => input.checked), true);
  assert.equal(page.en.row.classList.contains("recipe-progress-complete"), true);
  assert.equal(page.ja.row.classList.contains("recipe-progress-complete"), true);

  ingredientInputs[0].checked = false;
  ingredientInputs[0].listeners.get("change")();
  assert.equal(ingredientInputs.every(input => !input.checked), true);

  page.resetButton.listeners.get("click")();
  assert.equal(page.inputs.every(input => !input.checked), true);
  assert.equal(page.status.textContent, "Checklist reset");
});

test("disables unsupported wake lock and translates recipe tool labels", () => {
  const page = loadRecipeTools();

  assert.equal(page.wakeToggle.disabled, true);
  assert.equal(page.wakeLabel.textContent, "Keep screen awake unavailable");
  assert.equal(page.tools.attributes["aria-label"], "Recipe tools");

  page.documentListeners.get("languageChanged")({ detail: { lang: "ja" } });
  assert.equal(page.wakeLabel.textContent, "画面オン機能は利用できません");
  assert.equal(page.tools.attributes["aria-label"], "レシピツール");
});

test("requests a screen wake lock when enabled", async () => {
  const page = loadRecipeTools({ wakeLockSupported: true });

  page.wakeToggle.checked = true;
  await page.wakeToggle.listeners.get("change")();

  assert.equal(page.wakeRequests(), 1);
  assert.equal(page.status.textContent, "Screen will stay awake");
});
