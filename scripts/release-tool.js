#!/usr/bin/env node
// release-tool.js parse <release.json> <asset-glob>
// Prints: tag \t assetId \t assetName \t checksumAssetId \t checksumAssetName   (checksum fields may be empty)
"use strict";
const fs = require("fs");
const [cmd, file, glob] = process.argv.slice(2);
if (cmd !== "parse") { console.error("usage: release-tool.js parse <json> <glob>"); process.exit(64); }
let rel;
try { rel = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { console.error("Invalid release JSON."); process.exit(1); }
const esc = (s) => s.replace(/[.+^${}()|[\]\\]/g, "\\$&");
const re = new RegExp("^" + glob.split("*").map(esc).join(".*") + "$");
const assets = Array.isArray(rel.assets) ? rel.assets : [];
const pkg = assets.find((a) => re.test(a.name) && !/\.(sha256|sha256sum|sig|asc)$/i.test(a.name));
if (!pkg || !rel.tag_name) process.exit(1);
const sum = assets.find((a) => a.name === pkg.name + ".sha256") || assets.find((a) => a.name === pkg.name + ".sha256sum")
  || assets.find((a) => /^(sha256sums?|checksums?)(\.txt)?$/i.test(a.name));
console.log([rel.tag_name, pkg.id, pkg.name, sum ? sum.id : "", sum ? sum.name : ""].join("\t"));
