#!/usr/bin/env node
// instruction-audit — mechanical scan of a repository's agent instruction
// surface. Zero npm deps, Node 18+. Read-only: it never edits the files it
// measures.
//
// It answers the questions a reviewer would otherwise count by hand:
//   - which instruction files each agent runtime loads on every turn, and
//     how large that always-loaded set is;
//   - which paragraphs reach the same runtime more than once (an installer
//     writing one block into both CLAUDE.md and AGENTS.md while CLAUDE.md
//     @imports AGENTS.md is the classic case);
//   - which generated marker blocks exist and who wrote them;
//   - which Claude Code hooks are registered more than once for the same
//     event, which point at scripts that are missing or git-ignored (so they
//     break in a fresh clone or worktree), and which point outside the repo.
//
// Usage:
//   instruction-audit.mjs [--root <dir>] [--json] [--min-chars <n>]
//
// Exit code is always 0 on a completed scan: findings are data for the
// skill's judgement steps, not a gate.

import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const ROOT = path.resolve(opt("--root", process.cwd()));
const MIN_CHARS = Number(opt("--min-chars", "120"));
const AS_JSON = flag("--json");

// ---------- small utils ----------

const rel = (p) => path.relative(ROOT, p) || ".";
const exists = (p) => {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
};
const readText = (p) => {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
};
const listDir = (dir, re) => {
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => re.test(f))
      .sort()
      .map((f) => path.join(dir, f));
  } catch {
    return [];
  }
};
const approxTokens = (bytes) => Math.round(bytes / 4);

// Read of the user's project (check-ignore writes nothing); a shipped skill script has no Inspect door.
function gitIgnored(file) {
  try {
    execFileSync("git", ["-C", ROOT, "check-ignore", "-q", file], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function gitCheckoutOf(p) {
  let dir = path.resolve(p);
  while (dir !== path.dirname(dir)) {
    if (exists(path.join(dir, ".git"))) return dir;
    dir = path.dirname(dir);
  }
  return null;
}

function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  return m ? m[1] : "";
}

// ---------- instruction surface ----------

// `@path` imports in Claude memory files: a line-leading or space-preceded
// token outside code fences and inline code.
function claudeImports(file, text) {
  const found = [];
  let fenced = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const stripped = line.replace(/`[^`]*`/g, "");
    for (const m of stripped.matchAll(/(?:^|\s)@([~./\w-][^\s]*)/g)) {
      const raw = m[1].replace(/[),.;:]+$/, "");
      if (raw.includes("@") || !/[./]/.test(raw)) continue;
      const target = raw.startsWith("~")
        ? path.join(process.env.HOME || "", raw.slice(1))
        : path.resolve(path.dirname(file), raw);
      if (exists(target)) found.push(target);
    }
  }
  return found;
}

function expandClaude(entry, seen, order, depth = 0) {
  if (depth > 5) return;
  order.push(entry);
  if (seen.has(entry)) return;
  seen.add(entry);
  const text = readText(entry);
  if (text == null) return;
  for (const imp of claudeImports(entry, text)) expandClaude(imp, seen, order, depth + 1);
}

function claudeSurface() {
  const always = [];
  const conditional = [];
  const roots = ["CLAUDE.md", ".claude/CLAUDE.md", "CLAUDE.local.md"]
    .map((f) => path.join(ROOT, f))
    .filter(exists);
  const seen = new Set();
  for (const r of roots) expandClaude(r, seen, always);
  for (const f of listDir(path.join(ROOT, ".claude/rules"), /\.md$/)) {
    const fm = frontmatter(readText(f) || "");
    if (/^paths\s*:/m.test(fm)) conditional.push(f);
    else always.push(f);
  }
  return { always, conditional };
}

function nestedAgentsFiles() {
  const out = [];
  const skip = new Set([".git", "node_modules", "target", "dist", "build", ".fgos", "archive"]);
  const walk = (dir, depth) => {
    if (depth > 4) return;
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (!skip.has(e.name) && !e.name.startsWith(".")) walk(path.join(dir, e.name), depth + 1);
      } else if (e.name === "AGENTS.md" && dir !== ROOT) {
        out.push(path.join(dir, e.name));
      }
    }
  };
  walk(ROOT, 0);
  return out.sort();
}

function surfaces() {
  const claude = claudeSurface();
  const at = (f) => path.join(ROOT, f);
  const agents = exists(at("AGENTS.md")) ? [at("AGENTS.md")] : [];
  const nested = nestedAgentsFiles();
  return {
    "claude-code": claude,
    "agents-md (codex, omp/pi, others)": { always: agents, conditional: nested },
    gemini: { always: [at("GEMINI.md")].filter(exists), conditional: [] },
    cursor: {
      always: [at(".cursorrules")].filter(exists),
      conditional: listDir(at(".cursor/rules"), /\.mdc?$/),
    },
    copilot: {
      always: [at(".github/copilot-instructions.md")].filter(exists),
      conditional: listDir(at(".github/instructions"), /\.instructions\.md$/),
    },
  };
}

// ---------- duplicate paragraphs within one runtime's load set ----------

function paragraphs(file) {
  const text = readText(file) || "";
  const lines = text.split(/\r?\n/);
  const out = [];
  let buf = [];
  let start = 1;
  const flush = (endLine) => {
    const body = buf.join("\n").trim();
    if (body) out.push({ file, line: start, endLine, body });
    buf = [];
  };
  lines.forEach((l, i) => {
    if (l.trim() === "") {
      flush(i);
      start = i + 2;
    } else {
      if (!buf.length) start = i + 1;
      buf.push(l);
    }
  });
  flush(lines.length);
  return out;
}

const normalize = (s) => s.toLowerCase().replace(/\s+/g, " ").replace(/[*_`>#-]/g, "").trim();

function duplicateParagraphs(loadOrder) {
  const groups = new Map();
  const counted = new Map();
  for (const file of loadOrder) {
    // a file reached twice through imports is read twice
    counted.set(file, (counted.get(file) || 0) + 1);
    if (counted.get(file) > 1) continue;
    for (const p of paragraphs(file)) {
      const n = normalize(p.body);
      if (n.length < MIN_CHARS) continue;
      const h = crypto.createHash("sha1").update(n).digest("hex");
      if (!groups.has(h)) groups.set(h, []);
      groups.get(h).push(p);
    }
  }
  const dupes = [...groups.values()].filter((g) => g.length > 1);
  const bytes = dupes.reduce((s, g) => s + Buffer.byteLength(g[0].body) * (g.length - 1), 0);
  const twiceLoaded = [...counted.entries()].filter(([, c]) => c > 1).map(([f, c]) => ({ file: rel(f), times: c }));
  return {
    groups: dupes.map((g) => ({
      preview: g[0].body.split("\n")[0].slice(0, 100),
      bytes: Buffer.byteLength(g[0].body),
      at: g.map((p) => `${rel(p.file)}:${p.line}`),
    })),
    duplicatedBytes: bytes,
    filesLoadedMoreThanOnce: twiceLoaded,
  };
}

// ---------- generated marker blocks ----------

function markerBlocks(files) {
  const out = [];
  const re = /<!--\s*([A-Za-z][\w-]*)[:\s-]+(start|begin)\b([^>]*)-->/gi;
  for (const f of new Set(files)) {
    const text = readText(f) || "";
    for (const m of text.matchAll(re)) {
      const line = text.slice(0, m.index).split("\n").length;
      out.push({ owner: `${m[1]}${m[3].trim() ? " " + m[3].trim().replace(/^:/, "") : ""}`, at: `${rel(f)}:${line}` });
    }
  }
  const byOwner = {};
  for (const b of out) (byOwner[b.owner] ||= []).push(b.at);
  return byOwner;
}

// ---------- Claude Code hooks ----------

function hookScript(command) {
  const m = command.match(/["']?([^\s"';]*\.(?:cjs|mjs|js|sh|py|ts))["']?/g);
  if (!m) return null;
  return m[m.length - 1].replace(/["']/g, "");
}

function resolveScript(script) {
  return script
    .replace(/\$\{?CLAUDE_PROJECT_DIR\}?/g, ROOT)
    .replace(/^~(?=\/)/, process.env.HOME || "~");
}

function hooksReport() {
  const files = [".claude/settings.json", ".claude/settings.local.json"].map((f) => path.join(ROOT, f)).filter(exists);
  const registrations = [];
  const foreign = [];
  for (const f of files) {
    let json;
    try {
      json = JSON.parse(readText(f));
    } catch (e) {
      registrations.push({ file: rel(f), error: `invalid JSON: ${e.message}` });
      continue;
    }
    // An absolute path that does not exist, or lives inside a different git
    // checkout, usually means the config was copied from another clone.
    const scan = (cmd, where) => {
      for (const m of cmd.matchAll(/(?<![\w}$.])(\/[^\s"';]+\/[^\s"';]+)/g)) {
        if (!exists(m[1])) {
          foreign.push({ file: rel(f), where, path: m[1], problem: "does not exist" });
          continue;
        }
        const owner = gitCheckoutOf(m[1]);
        if (owner && owner !== ROOT) foreign.push({ file: rel(f), where, path: m[1], problem: `inside another checkout ${owner}` });
      }
    };
    for (const [event, groups] of Object.entries(json.hooks || {})) {
      for (const g of groups) {
        const matcher = (g.matcher || "*").split("|").map((s) => s.trim()).sort().join("|");
        for (const h of g.hooks || []) {
          const command = h.command || "";
          const script = hookScript(command);
          const guarded = /\[\s*-[fe]\s/.test(command) || /\|\|\s*exit 0/.test(command);
          registrations.push({ file: rel(f), event, matcher, script, command, guarded });
          scan(command, `hooks.${event}`);
        }
      }
    }
    if (json.statusLine?.command) scan(json.statusLine.command, "statusLine");
  }

  const key = (r) => `${r.event} | ${r.matcher} | ${r.script || r.command}`;
  const groups = new Map();
  for (const r of registrations.filter((r) => !r.error)) {
    if (!groups.has(key(r))) groups.set(key(r), []);
    groups.get(key(r)).push(r);
  }
  const duplicates = [...groups.entries()]
    .filter(([, g]) => g.length > 1)
    .map(([k, g]) => ({ key: k, count: g.length, forms: g.map((r) => `${r.file}${r.guarded ? " (guarded)" : ""}`) }));

  const scriptState = new Map();
  for (const r of registrations) {
    if (!r.script || scriptState.has(r.script)) continue;
    const abs = resolveScript(r.script);
    const inRepo = abs.startsWith(ROOT + path.sep);
    scriptState.set(r.script, {
      script: r.script,
      present: exists(abs),
      gitIgnored: inRepo && exists(abs) ? gitIgnored(abs) : false,
    });
  }
  const unguardedFragile = registrations
    .filter((r) => r.script && !r.guarded && r.file === ".claude/settings.json")
    .filter((r) => {
      const s = scriptState.get(r.script);
      return !s.present || s.gitIgnored;
    })
    .map((r) => `${r.event} ${r.script}${scriptState.get(r.script).present ? " (git-ignored)" : " (missing)"}`);

  return {
    files: files.map(rel),
    total: registrations.length,
    duplicates,
    missingScripts: [...scriptState.values()].filter((s) => !s.present).map((s) => s.script),
    unguardedFragile: [...new Set(unguardedFragile)],
    foreignPaths: foreign,
  };
}

// ---------- assemble ----------

function main() {
  const surf = surfaces();
  const runtimes = {};
  const allLoaded = [];
  for (const [name, s] of Object.entries(surf)) {
    if (!s.always.length && !s.conditional.length) continue;
    const unique = [...new Set(s.always)];
    const bytes = s.always.reduce((sum, f) => sum + Buffer.byteLength(readText(f) || ""), 0);
    runtimes[name] = {
      alwaysLoaded: unique.map((f) => ({
        file: rel(f),
        lines: (readText(f) || "").split("\n").length,
        bytes: Buffer.byteLength(readText(f) || ""),
      })),
      alwaysLoadedBytes: bytes,
      approxTokens: approxTokens(bytes),
      conditional: s.conditional.map(rel),
      duplicates: duplicateParagraphs(s.always),
    };
    allLoaded.push(...s.always, ...s.conditional);
  }
  const report = {
    root: ROOT,
    scannedAt: new Date().toISOString(),
    runtimes,
    markerBlocks: markerBlocks(allLoaded),
    hooks: hooksReport(),
  };

  if (AS_JSON) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    return;
  }

  const out = [];
  out.push(`instruction-audit  ${report.root}`);
  for (const [name, r] of Object.entries(runtimes)) {
    out.push(`\n## ${name}: always-loaded ${r.alwaysLoadedBytes} B (~${r.approxTokens} tokens)`);
    for (const f of r.alwaysLoaded) out.push(`  ${f.file}  ${f.lines} lines, ${f.bytes} B`);
    if (r.conditional.length) out.push(`  conditional (path-scoped / nested): ${r.conditional.length} file(s)`);
    const d = r.duplicates;
    if (d.filesLoadedMoreThanOnce.length)
      out.push(`  files loaded more than once: ${d.filesLoadedMoreThanOnce.map((x) => `${x.file} x${x.times}`).join(", ")}`);
    if (d.groups.length) {
      out.push(`  duplicated paragraphs: ${d.groups.length} group(s), ~${d.duplicatedBytes} B read twice or more`);
      for (const g of d.groups.slice(0, 15)) out.push(`    - "${g.preview}"  at ${g.at.join(", ")}`);
      if (d.groups.length > 15) out.push(`    … ${d.groups.length - 15} more (use --json)`);
    }
  }
  const mb = Object.entries(report.markerBlocks);
  if (mb.length) {
    out.push(`\n## generated marker blocks`);
    for (const [owner, at] of mb) out.push(`  ${owner}: ${at.join(", ")}${at.length > 1 ? "  <- same block in several files" : ""}`);
  }
  const h = report.hooks;
  if (h.files.length) {
    out.push(`\n## hooks (${h.files.join(", ")}): ${h.total} registration(s)`);
    if (h.duplicates.length) {
      out.push(`  duplicate registrations: ${h.duplicates.length}`);
      for (const d of h.duplicates) out.push(`    - ${d.count}x ${d.key}  [${d.forms.join("; ")}]`);
    }
    if (h.unguardedFragile.length) {
      out.push(`  unguarded hooks whose script is missing or git-ignored (break in fresh clones/worktrees):`);
      for (const u of h.unguardedFragile) out.push(`    - ${u}`);
    }
    if (h.missingScripts.length) out.push(`  missing scripts: ${h.missingScripts.join(", ")}`);
    if (h.foreignPaths.length) {
      out.push(`  absolute paths that are missing or belong to another checkout:`);
      for (const f of h.foreignPaths) out.push(`    - ${f.file} ${f.where}: ${f.path} (${f.problem})`);
    }
  }
  process.stdout.write(out.join("\n") + "\n");
}

main();
