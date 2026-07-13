#!/usr/bin/env node
// ref-scan — portable reference-learning helper. Zero npm deps, Node 18+.
// Sets up and maintains a project-local learning area (docs/references/)
// with incremental cursors per source. Markdown stays the source of truth;
// this script only computes deltas and performs mechanical, atomic updates.
//
// Usage:
//   ref-scan.mjs init [--root <dir>]
//   ref-scan.mjs add <name> --type git-repo|paper|living-doc --url <url> [--root <dir>]
//   ref-scan.mjs delta <name> [--root <dir>]
//   ref-scan.mjs seal <name> [--domains all|d1,d2] [--version <v>] [--root <dir>]
//   ref-scan.mjs check [<name>] [--root <dir>]
//   ref-scan.mjs rank [--root <dir>]        # candidates by impact score R*E/F
//
// Refusal format: ERROR (rule) / WHY (reason) / FIX (next action).

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const REFS_DIR = "docs/references";
const CLONES_DIR = "references";
const MARK_START = "# REF-SCAN:START";
const MARK_END = "# REF-SCAN:END";
const TYPES = ["git-repo", "paper", "living-doc"];

// ---------- small utils ----------

function fail(error, why, fix) {
  console.error(`ERROR: ${error}\nWHY: ${why}\nFIX: ${fix}`);
  process.exit(2);
}

function writeAtomic(file, content) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, file);
}

function git(repoDir, args, opts = {}) {
  try {
    return execFileSync("git", ["-C", repoDir, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", opts.quietErr ? "ignore" : "pipe"],
    }).trim();
  } catch (e) {
    if (opts.soft) return null;
    throw e;
  }
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) args[a.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    else args._.push(a);
  }
  return args;
}

function findRoot(args) {
  if (args.root) return path.resolve(args.root);
  let dir = process.cwd();
  while (true) {
    if (fs.existsSync(path.join(dir, REFS_DIR))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function requireRoot(args) {
  const root = findRoot(args);
  if (!root)
    fail(
      `no learning area found upward from ${process.cwd()}`,
      `every command except init needs an existing ${REFS_DIR}/ directory`,
      `run "ref-scan.mjs init" at the project root first, or pass --root <dir>`
    );
  return root;
}

// ---------- frontmatter (minimal YAML: flat "key: value" + flow lists) ----------

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const data = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].replace(/\s+#.*$/, "").trim();
    if (v.startsWith("[") && v.endsWith("]"))
      v = v.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
    data[kv[1]] = v === "null" || v === "" ? null : v;
  }
  return { data, raw: m[0] };
}

function setFrontmatterKeys(text, updates) {
  const fm = parseFrontmatter(text);
  if (!fm) throw new Error("no frontmatter");
  let raw = fm.raw;
  for (const [k, v] of Object.entries(updates)) {
    const rendered = Array.isArray(v) ? `[${v.join(", ")}]` : String(v);
    const re = new RegExp(`^${k}:.*$`, "m");
    if (re.test(raw)) raw = raw.replace(re, `${k}: ${rendered}`);
    else raw = raw.replace(/\n---$/, `\n${k}: ${rendered}\n---`);
  }
  return text.replace(fm.raw, raw);
}

// ---------- shared lookups ----------

function sourcePath(root, name) {
  return path.join(root, REFS_DIR, "sources", `${name}.md`);
}

function loadSource(root, name) {
  const file = sourcePath(root, name);
  if (!fs.existsSync(file)) {
    const avail = fs.existsSync(path.join(root, REFS_DIR, "sources"))
      ? fs.readdirSync(path.join(root, REFS_DIR, "sources")).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")).join(", ")
      : "(none)";
    fail(`unknown source "${name}"`, `no index file at ${file}`, `pick one of: ${avail} — or create it with "ref-scan.mjs add ${name} --type <t> --url <u>"`);
  }
  const text = fs.readFileSync(file, "utf8");
  const fm = parseFrontmatter(text);
  if (!fm || !fm.data.type)
    fail(`source "${name}" has no parseable frontmatter with a "type" key`, `delta/seal/check need type + cursor fields to operate`, `fix the frontmatter of ${file} (see extract-rules.md in the ref-scan skill)`);
  return { file, text, meta: fm.data };
}

function loadTaxonomy(root) {
  const file = path.join(root, REFS_DIR, "taxonomy.txt");
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8").split("\n")
    .map((l) => l.replace(/#.*$/, "").trim()).filter(Boolean);
}

function cloneDir(root, name, meta) {
  return path.join(root, meta.local || path.join(CLONES_DIR, name));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---------- templates (embedded so the script alone can bootstrap) ----------

const T = {
  taxonomy: `# Learning-domain taxonomy — one kebab-case domain per line, '#' comments allowed.
harness
skills
hooks
workflow
orchestration
context-memory
planning
quality-gates
docs-style
tooling
config-packaging
repo-layout
safety
self-improvement
ux
testing-evals
`,
  intake: `# Intake Queue

Nguồn học mới chờ triage. Gặp gì hay — repo, paper, blog, docs — thả vào đây ngay. Triage: đáng học → \`ref-scan.mjs add <name> --type <t> --url <u>\` rồi xóa dòng; không đáng → xóa kèm lý do.

| Nguồn | Type (đoán) | URL | Ngày thêm | Vì sao đáng chú ý |
|---|---|---|---|---|
`,
  matrix: `# Feature Comparison Matrix

So sánh tính năng giữa các learning sources. Mỗi domain một bảng; ô có ✓ link về entry trong \`sources/<name>.md#<slug>\`. Ký hiệu: ✓ có | ~ một phần | ✗ không | ? chưa khảo sát. Matrix là curated view — chỉ hàng có đối chiếu đáng giá, không exhaustive.
`,
  portingLog: `# Porting Log

Nguồn sự thật duy nhất về trạng thái porting. Tính năng bị từ chối vẫn ghi lại kèm lý do.

Status: \`candidate\` → \`planned\` → \`in-progress\` → \`ported\` / \`adapted\` / \`rejected\`

| Feature | Nguồn | Status | Đích | Commit | Ghi chú / Lý do |
|---|---|---|---|---|---|
`,
  source: (name, type, url) => {
    const cursor =
      type === "git-repo"
        ? `local: ${CLONES_DIR}/${name}\nlast_analyzed_commit: null\nlast_analyzed_date: null`
        : type === "paper"
          ? `extracted_date: null`
          : `last_analyzed_version: null\nlast_analyzed_date: null`;
    return `---\nname: ${name}\ntype: ${type}\nurl: ${url}\n${cursor}\ndomains_covered: []\n---\n\n# ${name} — Feature Index\n\n> Chưa phân tích. Chạy \`ref-scan.mjs delta ${name}\` để bắt đầu.\n`;
  },
  gitignoreBlock: `${MARK_START}\n/${CLONES_DIR}/\n${MARK_END}\n`,
};

// ---------- commands ----------

function cmdInit(args) {
  const root = args.root ? path.resolve(args.root) : process.cwd();
  const refs = path.join(root, REFS_DIR);
  const created = [];
  for (const d of [path.join(refs, "sources"), path.join(root, CLONES_DIR)])
    if (!fs.existsSync(d)) { fs.mkdirSync(d, { recursive: true }); created.push(path.relative(root, d) + "/"); }
  const files = {
    [path.join(refs, "taxonomy.txt")]: T.taxonomy,
    [path.join(refs, "intake.md")]: T.intake,
    [path.join(refs, "comparison-matrix.md")]: T.matrix,
    [path.join(refs, "porting-log.md")]: T.portingLog,
  };
  for (const [f, content] of Object.entries(files))
    if (!fs.existsSync(f)) { writeAtomic(f, content); created.push(path.relative(root, f)); }
  // Managed .gitignore block — never touch bytes outside the markers.
  const gi = path.join(root, ".gitignore");
  const giText = fs.existsSync(gi) ? fs.readFileSync(gi, "utf8") : "";
  const alreadyIgnored = giText.split("\n").some((l) => l.trim() === `/${CLONES_DIR}/` || l.trim() === `${CLONES_DIR}/`);
  if (giText.includes(MARK_START)) {
    // refresh block content only
    const updated = giText.replace(new RegExp(`${MARK_START}[\\s\\S]*?${MARK_END}\\n?`), T.gitignoreBlock);
    if (updated !== giText) { writeAtomic(gi, updated); created.push(".gitignore (refreshed block)"); }
  } else if (!alreadyIgnored) {
    writeAtomic(gi, giText + (giText.endsWith("\n") || giText === "" ? "" : "\n") + T.gitignoreBlock);
    created.push(".gitignore (appended block)");
  }
  console.log(created.length ? `Initialized learning area at ${root}:\n  - ${created.join("\n  - ")}` : `Learning area at ${root} already up to date — nothing written.`);
  console.log(`Next: drop candidate sources into ${REFS_DIR}/intake.md, then "ref-scan.mjs add <name> --type <t> --url <u>".`);
}

function cmdAdd(args) {
  const [name] = args._;
  if (!name || !args.type || !args.url)
    fail("add needs <name> --type --url", "a source file cannot be scaffolded without its identity and cursor type", `ref-scan.mjs add beegog --type git-repo --url https://github.com/x/y`);
  if (!TYPES.includes(args.type))
    fail(`unknown type "${args.type}"`, `cursor semantics differ per type`, `use one of: ${TYPES.join(" | ")}`);
  const root = requireRoot(args);
  const file = sourcePath(root, name);
  if (fs.existsSync(file))
    fail(`source "${name}" already exists`, `overwriting would destroy its cursor and entries`, `edit ${path.relative(root, file)} directly, or pick another name`);
  writeAtomic(file, T.source(name, args.type, args.url));
  console.log(`Created ${path.relative(root, file)} (type: ${args.type}).`);
  if (args.type === "git-repo") console.log(`Next: git clone ${args.url} ${CLONES_DIR}/${name} && ref-scan.mjs delta ${name}`);
  else if (args.type === "paper") console.log(`Next: save a copy under ${CLONES_DIR}/${name}/, extract once, then "ref-scan.mjs seal ${name}".`);
  else console.log(`Next: fetch ${args.url}, extract, then "ref-scan.mjs seal ${name} --version <v>".`);
}

function deltaGitRepo(root, name, meta) {
  const repo = cloneDir(root, name, meta);
  if (!fs.existsSync(path.join(repo, ".git")))
    fail(`clone missing at ${path.relative(root, repo)}`, `git-repo deltas are computed against a local clone`, `git clone ${meta.url} ${path.relative(root, repo)}`);
  if (git(repo, ["pull", "--ff-only", "--quiet"], { soft: true, quietErr: true }) === null)
    console.error("(warn: pull failed — using local state)");
  const head = git(repo, ["rev-parse", "--short", "HEAD"]);
  const last = meta.last_analyzed_commit;
  if (!last) {
    console.log(`== ${name}: never analyzed — FULL SCAN needed ==\nHEAD: ${head}\nTop-level:\n${git(repo, ["ls-tree", "--name-only", "HEAD"])}`);
    return;
  }
  if (git(repo, ["rev-parse", "--short", `${last}^{commit}`], { soft: true, quietErr: true }) === null)
    fail(`recorded cursor "${last}" is not a commit in the clone`, `the frontmatter was hand-edited badly or the clone was recreated with different history`, `verify history ("git -C ${path.relative(root, repo)} log"), then re-seal with "ref-scan.mjs seal ${name}" after a fresh full scan`);
  if (git(repo, ["rev-parse", "--short", last]) === head) {
    console.log(`== ${name}: up to date (last analyzed = HEAD = ${head}) ==`);
  } else {
    console.log(`== ${name}: commits since ${last} ==`);
    console.log(git(repo, ["log", "--format=%h %ad %s", "--date=short", `${last}..HEAD`]));
    console.log(`\n== changed files ==\n${git(repo, ["diff", "--stat", `${last}..HEAD`])}`);
    console.log(`\nAfter analysis: ref-scan.mjs seal ${name}`);
  }
}

function cmdDelta(args) {
  const [name] = args._;
  if (!name) fail("delta needs <name>", "there is no default source", "ref-scan.mjs delta <name>");
  const root = requireRoot(args);
  const { meta } = loadSource(root, name);
  // domain backfill check (skip when never analyzed — the full scan covers everything)
  const analyzed = meta.last_analyzed_commit || meta.extracted_date || meta.last_analyzed_version;
  const covered = Array.isArray(meta.domains_covered) ? meta.domains_covered : [];
  const missing = loadTaxonomy(root).filter((d) => !covered.includes(d));
  if (analyzed && missing.length)
    console.log(`== ${name}: domains needing BACKFILL (scan current snapshot for these only) ==\n  - ${missing.join("\n  - ")}\n`);
  if (meta.type === "git-repo") return deltaGitRepo(root, name, meta);
  if (meta.type === "paper")
    return console.log(meta.extracted_date
      ? `== ${name}: paper, extracted ${meta.extracted_date} — immutable, no delta ==`
      : `== ${name}: paper, never extracted ==\nRead it once, extract entries, then: ref-scan.mjs seal ${name}`);
  console.log(`== ${name}: living-doc ==\nrecorded: version=${meta.last_analyzed_version || "null"} date=${meta.last_analyzed_date || "null"}\nFetch ${meta.url}, compare changelog/version against the recorded cursor, extract what changed, then: ref-scan.mjs seal ${name} --version <new>`);
}

function cmdSeal(args) {
  const [name] = args._;
  if (!name) fail("seal needs <name>", "sealing writes a cursor into one source file", "ref-scan.mjs seal <name>");
  const root = requireRoot(args);
  const { file, text, meta } = loadSource(root, name);
  const updates = {};
  if (meta.type === "git-repo") {
    const repo = cloneDir(root, name, meta);
    updates.last_analyzed_commit = git(repo, ["rev-parse", "--short", "HEAD"]);
    updates.last_analyzed_date = today();
  } else if (meta.type === "paper") {
    updates.extracted_date = today();
  } else {
    if (!args.version && !meta.last_analyzed_version)
      fail("living-doc seal needs --version <v>", "without a version/date cursor the next delta has nothing to compare against", `ref-scan.mjs seal ${name} --version <v> (use a changelog version or the fetch date)`);
    if (args.version) updates.last_analyzed_version = args.version;
    updates.last_analyzed_date = today();
  }
  if (args.domains) {
    const tax = loadTaxonomy(root);
    const covered = new Set(Array.isArray(meta.domains_covered) ? meta.domains_covered : []);
    for (const d of args.domains === "all" ? tax : String(args.domains).split(",").map((s) => s.trim())) {
      if (tax.length && !tax.includes(d))
        fail(`domain "${d}" is not in taxonomy.txt`, `domains_covered must stay comparable with the taxonomy for backfill detection`, `add it to ${REFS_DIR}/taxonomy.txt first, or fix the spelling`);
      covered.add(d);
    }
    updates.domains_covered = [...covered];
  }
  writeAtomic(file, setFrontmatterKeys(text, updates));
  console.log(`Sealed ${name}: ${Object.entries(updates).map(([k, v]) => `${k}=${Array.isArray(v) ? `[${v.length}]` : v}`).join(", ")}`);
}

function checkSource(root, name, taxonomy, matrixText) {
  const problems = [];
  const { text, meta } = loadSource(root, name);
  if (!TYPES.includes(meta.type)) problems.push(`type "${meta.type}" invalid`);
  const covered = Array.isArray(meta.domains_covered) ? meta.domains_covered : [];
  const unknown = covered.filter((d) => taxonomy.length && !taxonomy.includes(d));
  if (unknown.length) problems.push(`domains_covered not in taxonomy: ${unknown.join(", ")}`);
  const missing = taxonomy.filter((d) => !covered.includes(d));
  const analyzed = meta.last_analyzed_commit || meta.extracted_date || meta.last_analyzed_version;
  if (analyzed && missing.length) problems.push(`backfill needed: ${missing.join(", ")}`);
  if (meta.type === "git-repo" && meta.last_analyzed_commit) {
    const repo = cloneDir(root, name, meta);
    if (!fs.existsSync(path.join(repo, ".git"))) problems.push(`clone missing at ${path.relative(root, repo)}`);
    else {
      if (git(repo, ["rev-parse", `${meta.last_analyzed_commit}^{commit}`], { soft: true, quietErr: true }) === null)
        problems.push(`cursor ${meta.last_analyzed_commit} not a commit in clone`);
      // Where-path spot check: backticked path-like tokens must suffix-match a tracked file.
      // Entries marked Status: moved-to-*/removed legitimately point at paths gone from HEAD — skip them.
      const tracked = git(repo, ["ls-files"]).split("\n");
      const missingPaths = [];
      for (const block of text.split(/^### /m).slice(1)) {
        if (/\*\*Status:\*\*\s*(moved-to-|removed)/.test(block)) continue;
        for (const line of block.match(/^- \*\*Where:\*\*.*$/gm) || [])
          for (const tok of line.match(/`([^`]+)`/g) || []) {
            const p = tok.slice(1, -1).replace(/\/$/, "");
            if (!/[/.]/.test(p) || /[ *|]/.test(p)) continue; // not a concrete path
            if (!tracked.some((f) => f === p || f.startsWith(p + "/") || f.endsWith("/" + p) || f.includes("/" + p + "/"))) missingPaths.push(p);
          }
      }
      if (missingPaths.length) problems.push(`Where paths not found in clone HEAD: ${[...new Set(missingPaths)].join(", ")}`);
    }
  }
  // matrix anchors pointing into this source must resolve to a real "### slug" heading
  const slugs = new Set((text.match(/^### (.+)$/gm) || []).map((h) => h.slice(4).trim()));
  for (const mLink of matrixText.matchAll(new RegExp(`\\]\\(sources/${name}\\.md#([a-z0-9-]+)\\)`, "g")))
    if (!slugs.has(mLink[1])) problems.push(`matrix links to missing anchor #${mLink[1]}`);
  return problems;
}

function cmdCheck(args) {
  const root = requireRoot(args);
  const taxonomy = loadTaxonomy(root);
  const matrixFile = path.join(root, REFS_DIR, "comparison-matrix.md");
  const matrixText = fs.existsSync(matrixFile) ? fs.readFileSync(matrixFile, "utf8") : "";
  const names = args._[0]
    ? [args._[0]]
    : fs.readdirSync(path.join(root, REFS_DIR, "sources")).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""));
  let bad = 0;
  for (const name of names) {
    const problems = checkSource(root, name, taxonomy, matrixText);
    console.log(problems.length ? `✗ ${name}\n  - ${problems.join("\n  - ")}` : `✓ ${name}`);
    if (problems.length) bad++;
  }
  process.exit(bad ? 1 : 0);
}

function cmdRank(args) {
  const root = requireRoot(args);
  const logFile = path.join(root, REFS_DIR, "porting-log.md");
  if (!fs.existsSync(logFile))
    fail("porting-log.md not found", "rank reads candidate rows from the porting log", `run "ref-scan.mjs init" or create ${REFS_DIR}/porting-log.md`);
  const scored = [];
  const unscored = [];
  for (const line of fs.readFileSync(logFile, "utf8").split("\n")) {
    if (!/^\|/.test(line) || !/\|\s*candidate\s*\|/.test(line)) continue;
    const cells = line.split("|").map((c) => c.trim());
    const feature = cells[1] || "?";
    const m = line.match(/R([1-3])\s*E([1-3])\s*F([1-3])/);
    if (m) {
      const [r, e, f] = [Number(m[1]), Number(m[2]), Number(m[3])];
      scored.push({ feature, r, e, f, score: (r * e) / f });
    } else unscored.push(feature);
  }
  scored.sort((a, b) => b.score - a.score || a.f - b.f);
  console.log("Candidates by impact (score = R×E/F — derived, never stored):");
  for (const s of scored)
    console.log(`  ${s.score.toFixed(1).padStart(4)}  R${s.r} E${s.e} F${s.f}  ${s.feature}`);
  if (unscored.length)
    console.log(`\nUnscored candidates (add "R# E# F#" to their Score cell):\n  - ${unscored.join("\n  - ")}`);
  console.log(`\nDeep-dive hints: high R×E rows where the matrix shows sources diverging (hòa/~) — see deep-dive-protocol.md.`);
}

// ---------- dispatch ----------

const [cmd, ...rest] = process.argv.slice(2);
const args = parseArgs(rest);
const commands = { init: cmdInit, add: cmdAdd, delta: cmdDelta, seal: cmdSeal, check: cmdCheck, rank: cmdRank };
if (!commands[cmd])
  fail(`unknown command "${cmd || ""}"`, "ref-scan only automates the mechanical parts of the learning lifecycle", `use one of: ${Object.keys(commands).join(" | ")} (see header comment for flags)`);
commands[cmd](args);
