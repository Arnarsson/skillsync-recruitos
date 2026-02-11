#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOTS = ["app", "components"];
const EXT = ".tsx";

const ignored = new Set([
  "components/ui/Breadcrumbs.tsx",
]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && full.endsWith(EXT)) out.push(full);
  }
  return out;
}

function hasLikelyHardcodedText(src) {
  const jsxText = />[^<>{}]*[A-Za-zÆØÅæøå]{3,}[^<>{}]*</g;
  const quoted = /["'`][A-Za-zÆØÅæøå][^"'`\n]{4,}["'`]/g;
  return jsxText.test(src) || quoted.test(src);
}

function run() {
  const files = ROOTS.flatMap((root) => walk(root));
  const offenders = [];

  for (const file of files) {
    if (ignored.has(file)) continue;
    const src = fs.readFileSync(file, "utf8");
    const hasI18nHook = /\buseLanguage\(/.test(src);
    if (!hasI18nHook && hasLikelyHardcodedText(src)) offenders.push(file);
  }

  if (offenders.length === 0) {
    console.log("i18n-audit: OK");
    return;
  }

  console.log("i18n-audit: found files with likely hardcoded UI text and no useLanguage():");
  for (const file of offenders) console.log(`- ${file}`);
  console.log(`total: ${offenders.length}`);
  process.exitCode = 1;
}

run();
