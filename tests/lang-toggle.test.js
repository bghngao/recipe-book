const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const script = fs.readFileSync(
  path.join(__dirname, "..", "assets", "js", "lang-toggle.js"),
  "utf8"
);

class FakeClassList {
  constructor(classes = []) {
    this.classes = new Set(classes);
  }

  contains(className) {
    return this.classes.has(className);
  }

  toggle(className, force) {
    if (force === undefined) {
      force = !this.classes.has(className);
    }

    if (force) this.classes.add(className);
    else this.classes.delete(className);
    return force;
  }
}

class FakeElement {
  constructor({ classes = [], dataset = {}, textContent = "", top = 0, open = false } = {}) {
    this.attributes = {};
    this.classList = new FakeClassList(classes);
    this.dataset = dataset;
    this.listeners = new Map();
    this.open = open;
    this.placeholder = "";
    this.selectorMap = new Map();
    this.style = {};
    this.textContent = textContent;
    this.top = top;
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  click() {
    this.listeners.get("click")?.({ target: this });
  }

  getBoundingClientRect() {
    return { top: this.top, bottom: this.top };
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    return this.selectorMap.get(selector) || [];
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }
}

function makeLanguageSection(lang, title, blockTops, detailStates = []) {
  const heading = new FakeElement({ textContent: title, top: blockTops[0] });
  const containers = blockTops.slice(1).map(top => new FakeElement({ top }));
  const details = detailStates.map(open => new FakeElement({ open }));
  const section = new FakeElement({ classes: ["lang"], dataset: { lang } });

  section.selectorMap.set("h1", [heading]);
  section.selectorMap.set("h1, .container", [heading, ...containers]);
  section.selectorMap.set("details", details);

  return { section, details };
}

function loadToggle({
  browserLanguage = "en-US",
  savedLanguage = null,
  genre = "drink",
  enBlockTops = [100, 200, 300],
  jaBlockTops = [100, 200, 300],
  enDetails = [],
  jaDetails = [],
  languages = ["en", "ja"],
  storageThrows = false,
  urlLanguage = null
} = {}) {
  const toggle = new FakeElement();
  const search = new FakeElement();
  const breadcrumbCurrent = new FakeElement();
  const breadcrumbGenre = new FakeElement();
  const breadcrumbHome = new FakeElement();
  const breadcrumbNav = new FakeElement();
  const searchLabel = new FakeElement();
  const header = new FakeElement({ top: 80 });
  header.getBoundingClientRect = () => ({ top: 0, bottom: 80 });

  const en = makeLanguageSection("en", "🍰 Butter Mochi", enBlockTops, enDetails);
  const ja = makeLanguageSection("ja", "🍰 バターモチ", jaBlockTops, jaDetails);
  const sectionsByLanguage = { en, ja };
  const sections = languages.map(lang => sectionsByLanguage[lang].section);
  const badges = languages.map(lang => new FakeElement({ dataset: { lang } }));
  const domReadyListeners = [];
  const dispatchedEvents = [];
  const scrollCalls = [];
  const storage = new Map();

  if (savedLanguage !== null) storage.set("preferredLanguage", savedLanguage);

  const document = {
    body: { dataset: { genre } },
    documentElement: { lang: "en" },
    title: "",
    addEventListener(type, listener) {
      if (type === "DOMContentLoaded") domReadyListeners.push(listener);
    },
    dispatchEvent(event) {
      dispatchedEvents.push(event);
    },
    getElementById(id) {
      return { "toggle-btn": toggle, "header-search": search }[id] || null;
    },
    querySelector(selector) {
      return {
        ".breadcrumb-current": breadcrumbCurrent,
        ".breadcrumb-genre": breadcrumbGenre,
        ".breadcrumb-home": breadcrumbHome,
        ".breadcrumb-nav": breadcrumbNav,
        ".header-search-label": searchLabel,
        ".site-header": header
      }[selector] || null;
    },
    querySelectorAll(selector) {
      if (selector === ".lang") return sections;
      if (selector === ".lang-badge") return badges;
      return [];
    }
  };

  class CustomEvent {
    constructor(type, options) {
      this.type = type;
      this.detail = options.detail;
    }
  }

  const initialUrl = new URL("https://example.test/recipes/butter-mochi/");
  if (urlLanguage) initialUrl.searchParams.set("lang", urlLanguage);
  const window = {
    history: {
      replaceState(_state, _title, url) {
        window.location.href = String(url);
      }
    },
    location: { href: initialUrl.toString() },
    scrollBy: (x, y) => scrollCalls.push([x, y])
  };

  vm.runInNewContext(script, {
    CustomEvent,
    document,
    localStorage: {
      getItem(key) {
        if (storageThrows) throw new Error("Storage unavailable");
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        if (storageThrows) throw new Error("Storage unavailable");
        storage.set(key, value);
      }
    },
    navigator: { language: browserLanguage },
    URL,
    window
  });

  assert.equal(domReadyListeners.length, 1);
  domReadyListeners[0]();

  return {
    badges,
    breadcrumbCurrent,
    breadcrumbGenre,
    breadcrumbHome,
    breadcrumbNav,
    dispatchedEvents,
    document,
    en,
    ja,
    scrollCalls,
    search,
    searchLabel,
    storage,
    toggle,
    window
  };
}

test("initializes from the saved language and translates a drink breadcrumb", () => {
  const page = loadToggle({ savedLanguage: "ja", genre: "drink" });

  assert.equal(page.document.documentElement.lang, "ja");
  assert.equal(page.en.section.classList.contains("active"), false);
  assert.equal(page.ja.section.classList.contains("active"), true);
  assert.equal(page.badges[1].classList.contains("active"), true);
  assert.equal(page.breadcrumbCurrent.textContent, "バターモチ");
  assert.equal(page.breadcrumbGenre.textContent, "ドリンク");
  assert.equal(page.breadcrumbHome.textContent, "ホーム");
  assert.equal(page.breadcrumbNav.attributes["aria-label"], "パンくずリスト");
  assert.equal(page.search.placeholder, "レシピ名または材料で検索");
  assert.equal(page.searchLabel.textContent, "レシピ名または材料で検索");
  assert.equal(page.toggle.attributes["aria-label"], "英語に切り替える");
  assert.equal(page.document.title, "バターモチ | ファミリーレシピブック");
  assert.equal(page.storage.get("preferredLanguage"), "ja");
  assert.equal(new URL(page.window.location.href).searchParams.get("lang"), "ja");
  assert.equal(page.dispatchedEvents.at(-1).detail.lang, "ja");
});

test("toggles to English and updates the drink breadcrumb and preference", () => {
  const page = loadToggle({ savedLanguage: "ja", genre: "drink" });

  page.toggle.click();

  assert.equal(page.document.documentElement.lang, "en");
  assert.equal(page.en.section.classList.contains("active"), true);
  assert.equal(page.ja.section.classList.contains("active"), false);
  assert.equal(page.breadcrumbCurrent.textContent, "Butter Mochi");
  assert.equal(page.breadcrumbGenre.textContent, "Drinks");
  assert.equal(page.breadcrumbHome.textContent, "Home");
  assert.equal(page.breadcrumbNav.attributes["aria-label"], "Breadcrumb");
  assert.equal(page.search.placeholder, "Search recipes or ingredients");
  assert.equal(page.searchLabel.textContent, "Search recipes or ingredients");
  assert.equal(page.toggle.attributes["aria-label"], "Switch to Japanese");
  assert.equal(page.document.title, "Butter Mochi | Family Recipe Book");
  assert.equal(page.storage.get("preferredLanguage"), "en");
  assert.equal(new URL(page.window.location.href).searchParams.get("lang"), "en");
});

test("preserves the corresponding content block and expanded categories", () => {
  const page = loadToggle({
    savedLanguage: "en",
    enBlockTops: [-800, -500, -100],
    jaBlockTops: [20, 120, 250],
    enDetails: [true, false, true],
    jaDetails: [false, true, false]
  });

  page.toggle.click();

  assert.deepEqual(page.ja.details.map(details => details.open), [true, false, true]);
  assert.deepEqual(page.scrollCalls, [[0, 350]]);
});

test("uses the browser language when there is no saved preference", () => {
  const page = loadToggle({ browserLanguage: "ja-JP" });

  assert.equal(page.document.documentElement.lang, "ja");
  assert.equal(page.ja.section.classList.contains("active"), true);
});

test("uses a shared URL language instead of the saved preference", () => {
  const page = loadToggle({ savedLanguage: "en", urlLanguage: "ja" });

  assert.equal(page.document.documentElement.lang, "ja");
  assert.equal(page.ja.section.classList.contains("active"), true);
  assert.equal(page.storage.get("preferredLanguage"), "ja");
});

test("hides the toggle when the page has only one language", () => {
  const page = loadToggle({ languages: ["en"] });

  assert.equal(page.toggle.style.display, "none");
});

test("continues to work when browser storage is unavailable", () => {
  const page = loadToggle({ browserLanguage: "ja-JP", storageThrows: true });

  assert.equal(page.document.documentElement.lang, "ja");
  page.toggle.click();
  assert.equal(page.document.documentElement.lang, "en");
  assert.equal(new URL(page.window.location.href).searchParams.get("lang"), "en");
});
