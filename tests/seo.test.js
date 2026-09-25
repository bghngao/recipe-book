const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.join(__dirname, "..");

test("prevents pages from being indexed", () => {
  const layout = fs.readFileSync(
    path.join(projectRoot, "_layouts", "default.html"),
    "utf8"
  );

  assert.match(
    layout,
    /<meta\s+name=["']robots["']\s+content=["']noindex,\s*nofollow["']\s*\/?>/i
  );
});

test("discourages all crawler access", () => {
  const robots = fs.readFileSync(path.join(projectRoot, "robots.txt"), "utf8");

  assert.match(robots, /^User-agent:\s*\*\s*$/im);
  assert.match(robots, /^Disallow:\s*\/\s*$/im);
});
