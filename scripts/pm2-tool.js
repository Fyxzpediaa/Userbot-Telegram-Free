#!/usr/bin/env node
// pm2-tool.js has|online|info <name>   (reads `pm2 jlist` output from stdin)
// PM2 may print banners such as "[PM2] Spawning PM2 daemon" before the JSON, so find the JSON line.
"use strict";
const [cmd, name] = process.argv.slice(2);
let d = "";
process.stdin.on("data", (c) => (d += c)).on("end", () => {
  let list = [];
  for (const line of d.split("\n").reverse()) {
    const t = line.trim();
    if (t.startsWith("[")) { try { list = JSON.parse(t); break; } catch (e) { /* not the JSON line */ } }
  }
  const p = list.find((x) => x.name === name);
  const e = (p && p.pm2_env) || {};
  if (cmd === "has") process.exit(p ? 0 : 1);
  if (cmd === "online") process.exit(e.status === "online" ? 0 : 1);
  if (cmd === "info") {
    if (!p) { console.log("not running"); process.exit(0); }
    const up = e.pm_uptime && e.status === "online" ? Math.floor((Date.now() - e.pm_uptime) / 60000) + " min" : "-";
    console.log(e.status + "  (restarts: " + (e.restart_time || 0) + ", uptime: " + up + ", mem: " + Math.round(((p.monit || {}).memory || 0) / 1048576) + " MB)");
    process.exit(0);
  }
  process.exit(64);
});
