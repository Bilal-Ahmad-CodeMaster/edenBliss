import fs from "fs";
import path from "path";

const root = ".next/static/chunks";

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, acc);
    else if (name.endsWith(".js")) acc.push(p);
  }
  return acc;
}

const files = walk(root);
const defined = new Set();
const required = new Map();
const reDef = /\/\*\*\*\/ "([^"]+)":/g;
const reReq = /__webpack_require__\(\/\*![\s\S]*?\*\/ \\"([^"\\]+)\\"\)/g;

for (const file of files) {
  const s = fs.readFileSync(file, "utf8");
  for (const m of s.matchAll(reDef)) defined.add(m[1]);
  for (const m of s.matchAll(reReq)) {
    if (!required.has(m[1])) required.set(m[1], new Set());
    required.get(m[1]).add(file.replaceAll("\\", "/"));
  }
}

const byFile = new Map();
for (const file of files) {
  const s = fs.readFileSync(file, "utf8");
  const defs = new Set();
  const reqs = new Set();
  for (const m of s.matchAll(reDef)) defs.add(m[1]);
  for (const m of s.matchAll(reReq)) reqs.add(m[1]);
  byFile.set(file.replaceAll("\\", "/"), { defs, reqs });
}

const shop = ".next/static/chunks/app/(atelier)/shop/page.js";
const companions = [
  shop,
  ".next/static/chunks/main-app.js",
  ".next/static/chunks/app/layout.js",
  ".next/static/chunks/app/(atelier)/layout.js",
  ".next/static/chunks/app/(editorial)/layout.js",
  ".next/static/chunks/app/error.js",
  ".next/static/chunks/app/loading.js",
  ".next/static/chunks/app/(atelier)/shop/loading.js",
];
const available = new Set();
for (const file of companions) {
  const entry = byFile.get(file);
  if (!entry) {
    console.log("NO FILE", file);
    continue;
  }
  for (const id of entry.defs) available.add(id);
}
const shopReqs = byFile.get(shop)?.reqs ?? new Set();
const missingFromShop = [...shopReqs].filter((id) => !available.has(id));
console.log("shop requires", shopReqs.size, "available", available.size, "missing from loaded set", missingFromShop.length);
for (const id of missingFromShop.slice(0, 40)) {
  const owners = [];
  for (const [file, entry] of byFile) {
    if (entry.defs.has(id)) owners.push(file);
  }
  console.log("MISSING", id);
  console.log("  defined in", owners.join(" | ") || "(nowhere)");
}
