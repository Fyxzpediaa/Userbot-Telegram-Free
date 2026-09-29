#!/usr/bin/env node
// settings-tool.js  read | render | validate  -- helper for the bash installer.
// Secrets are only ever passed through environment variables (never argv) and never printed.
"use strict";
const fs = require("fs");
const path = require("path");

const STRING_KEYS = ["name", "api_hash", "bot_token", "botUsername", "menuImage", "fyxzgatewayApiKey",
  "fyxzgatewayBaseUrl", "qrisImage", "payment.dana", "payment.gopay", "payment.ovo", "version"];
const NUMBER_KEYS = ["api_id", "id_owner"];
const ALL_KEYS = ["name", "api_id", "api_hash", "id_owner", "bot_token", "botUsername", "menuImage",
  "fyxzgatewayApiKey", "fyxzgatewayBaseUrl", "qrisImage", "payment.dana", "payment.gopay", "payment.ovo", "version"];

const get = (o, k) => k.split(".").reduce((v, p) => (v == null ? v : v[p]), o);
const envName = (k) => "FYX_S_" + k.replace(/\./g, "_");

function load(file) {
  const p = path.resolve(file);
  delete require.cache[p];
  return require(p);
}

const [cmd, a, b] = process.argv.slice(2);

if (cmd === "read") {
  // Prints ALL_KEYS values separated by NUL (empty when missing / unreadable file).
  let s = {};
  try { s = load(a); } catch (e) { /* first install: nothing to read */ }
  process.stdout.write(ALL_KEYS.map((k) => { const v = get(s, k); return v == null ? "" : String(v); }).join("\0") + "\0");
} else if (cmd === "render") {
  let out = fs.readFileSync(a, "utf8");
  out = out.replace(/\{\{([\w.]+)\}\}/g, (_, k) => {
    const v = process.env[envName(k)] || "";
    if (NUMBER_KEYS.includes(k)) {
      if (!/^\d+$/.test(v)) { console.error("ERROR: field '" + k + "' must be numeric."); process.exit(2); }
      return v;
    }
    if (!STRING_KEYS.includes(k)) { console.error("ERROR: unknown template field '" + k + "'."); process.exit(2); }
    return JSON.stringify(v);
  });
  fs.writeFileSync(b, out, { mode: 0o600 });
} else if (cmd === "validate") {
  const quiet = process.argv.includes("--quiet");
  const ok = (m) => { if (!quiet) console.log("✓ " + m); };
  const warn = (m) => { if (!quiet) console.log("! " + m); };
  let s, bad = 0;
  try { s = load(a); } catch (e) { console.error("ERROR: settings.js cannot be loaded: " + e.message.split("\n")[0]); process.exit(1); }
  if (!s || typeof s !== "object") { console.error("ERROR: settings.js must export an object."); process.exit(1); }
  const fail = (m) => { console.error("✗ " + m); bad++; };

  if (Number.isSafeInteger(s.id_owner) && s.id_owner > 0) ok("Owner configured"); else fail("Owner: id_owner must be a positive number");
  if (Number.isSafeInteger(s.api_id) && s.api_id > 0 && typeof s.api_hash === "string" && /^[0-9a-fA-F]{32}$/.test(s.api_hash)) ok("Telegram API configured");
  else fail("Telegram API: api_id must be a number and api_hash a 32-char hex string");
  if (typeof s.name === "string" && s.name.trim()) ok("Bot name configured"); else fail("Bot name (name) is empty");

  if (s.bot_token) {
    if (!/^\d{6,12}:[A-Za-z0-9_-]{30,}$/.test(String(s.bot_token))) fail("Bot panel: bot_token has an invalid format");
    else if (!s.botUsername) fail("Bot panel: botUsername is required when bot_token is set");
    else ok("Bot panel (button menu) configured");
  } else warn("Bot panel disabled (bot_token empty) - text commands still work");

  if (s.fyxzgatewayApiKey && /^https?:\/\//.test(s.fyxzgatewayBaseUrl || "")) ok("Payment gateway configured");
  else warn("Payment gateway not configured (optional)");

  process.exit(bad ? 1 : 0);
} else {
  console.error("usage: settings-tool.js read|render|validate ...");
  process.exit(64);
}
