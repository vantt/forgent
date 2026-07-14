#!/usr/bin/env node
// repo-divorce — workshop tool that separates the forgent product tree (and its
// .git) into ./repo, then re-homes the bee workshop above it. Zero-dependency,
// Node ESM. This mutates a whole workspace: always --dry-run first, rehearse
// --execute on a throwaway copy, and only run --execute for real behind the
// explicit untrack confirmation. Every git call carries an explicit -C path.
//
// Classification (single algorithm, filesystem-level — covers ignored/untracked
// too, not just `git ls-files`):
//   workshop  = the deny-list below (bee machinery, build memory, tooling)
//   product   = the enumerated top-level set that becomes the clean ./repo
//   doctrine  = AGENTS.md / CLAUDE.md — split at the swap step, not moved as-is
//   git-meta  = .git — travels with the whole-tree move and stays in ./repo (D1)
//   anything else at top level -> STOP-ASK, non-zero exit (guard for future entries)
//
// Execute is the 6-step sequence proven by the validating move-semantics probe
// (TEST B): whole-tree move -> doctrine swap -> untrack commit (point of no
// return) -> workshop extract -> workshop git init -> config patch.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

// --- Classification ---------------------------------------------------------

// Deny-list: paths that stay in the workshop (per CONTEXT D2 + scripts/).
export const WORKSHOP_PATHS = [
  '.bee',
  '.claude',
  '.agents',
  '.codex',
  'plans',
  'upstreams',
  'scripts',
  'docs/history',
  'docs/distillery',
  'docs/reference-learning-system.md',
  'docs/naming.md',
];

// Enumerated product set: everything that becomes the clean ./repo (per D2).
export const PRODUCT_PATHS = [
  'src',
  'test',
  'bin',
  '.fgos',
  '.fgos-runner.json',
  'package.json',
  'README.md',
  'LICENSE',
  '.gitignore',
  '.gitnexus',
  'docs/specs',
  'docs/platform-foundations.md',
  'docs/backlog.md',
  'docs/routing-handoff-contract.md',
  'docs/decisions',
];

export const DOCTRINE_PATHS = ['AGENTS.md', 'CLAUDE.md'];
export const GIT_META_PATHS = ['.git'];

const JOURNAL_BASENAME = '.repo-divorce-checkpoint.json';
const BACKUP_BASENAME = '.repo-divorce-backup';

function matchesAny(rel, prefixes) {
  return prefixes.some((p) => rel === p || rel.startsWith(p + '/'));
}

// Classify one path relative to the workspace root.
export function classify(rel) {
  const p = rel.replace(/\/+$/, '');
  if (matchesAny(p, GIT_META_PATHS)) return 'git-meta';
  if (DOCTRINE_PATHS.includes(p)) return 'doctrine';
  if (matchesAny(p, WORKSHOP_PATHS)) return 'workshop';
  if (matchesAny(p, PRODUCT_PATHS)) return 'product';
  return 'unknown';
}

// A top-level dir is a split parent when some classified path lives beneath it
// (only docs/ today) — its children are classified individually rather than the
// dir being flagged unknown. A genuinely unknown dir has no such children.
export function isSplitParent(name) {
  const prefix = name + '/';
  return [...WORKSHOP_PATHS, ...PRODUCT_PATHS].some((p) => p.startsWith(prefix));
}

// Walk the top level of `root` and classify every entry (recursing into split
// parents). Returns the full plan plus any entries that classify to nothing.
export function planWorkspace(root) {
  const plan = [];
  const unknown = [];
  for (const name of fs.readdirSync(root)) {
    if (name === 'repo' || name === JOURNAL_BASENAME || name === BACKUP_BASENAME) continue;
    const cat = classify(name);
    if (cat !== 'unknown') {
      plan.push({ path: name, category: cat });
      continue;
    }
    if (isSplitParent(name)) {
      for (const child of fs.readdirSync(path.join(root, name))) {
        const rel = `${name}/${child}`;
        const ccat = classify(rel);
        if (ccat === 'unknown') unknown.push(rel);
        else plan.push({ path: rel, category: ccat });
      }
      continue;
    }
    unknown.push(name);
  }
  return { plan, unknown };
}

// --- Checkpoint journal (reverse-move rollback before point of no return) ----

export class Journal {
  constructor(file) {
    this.file = file;
    this.ops = [];
    this.pointOfNoReturn = false;
  }

  static load(file) {
    const j = new Journal(file);
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    j.ops = raw.ops || [];
    j.pointOfNoReturn = Boolean(raw.pointOfNoReturn);
    return j;
  }

  record(op) {
    this.ops.push(op);
    this.flush();
  }

  markPointOfNoReturn() {
    this.pointOfNoReturn = true;
    this.flush();
  }

  flush() {
    fs.writeFileSync(
      this.file,
      JSON.stringify({ pointOfNoReturn: this.pointOfNoReturn, ops: this.ops }, null, 2),
    );
  }

  clear() {
    fs.rmSync(this.file, { force: true });
  }
}

function reverseOp(op) {
  if (op.type === 'move') {
    fs.mkdirSync(path.dirname(op.from), { recursive: true });
    fs.renameSync(op.to, op.from);
  } else if (op.type === 'overwrite') {
    fs.copyFileSync(op.backup, op.path);
    fs.rmSync(op.backup, { force: true });
  } else if (op.type === 'create') {
    fs.rmSync(op.path, { recursive: true, force: true });
  }
}

// Reverse every checkpointed op in LIFO order. Refuses once the untrack commit
// (point of no return, D1) has been recorded — past that, recovery is a manual
// git revert + reverse move, documented in the report, not an undo of moves.
export function rollback(root) {
  const journalFile = path.join(root, JOURNAL_BASENAME);
  if (!fs.existsSync(journalFile)) {
    throw new Error('rollback: no checkpoint journal found — nothing to reverse');
  }
  const journal = Journal.load(journalFile);
  if (journal.pointOfNoReturn) {
    throw new Error(
      'rollback: refused — the untrack commit (point of no return) already ran; ' +
        'recover manually via git revert + reverse move (see script header)',
    );
  }
  for (let i = journal.ops.length - 1; i >= 0; i--) reverseOp(journal.ops[i]);
  journal.clear();
  fs.rmSync(path.join(root, BACKUP_BASENAME), { recursive: true, force: true });
}

// --- Git + fs helpers -------------------------------------------------------

function git(cwd, args) {
  return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });
}

// Postcheck for step 1: a whole-tree move keeps the working tree matching the
// index, so no tracked path may show as modified/deleted/renamed. Untracked
// (`??`) entries are expected and allowed.
function assertLayoutIntact(repoDir) {
  const out = git(repoDir, ['status', '--porcelain']);
  const drift = out.split('\n').filter((l) => l.length && !l.startsWith('??'));
  if (drift.length) {
    throw new Error(`postcheck failed: tracked-file drift after whole-tree move:\n${drift.join('\n')}`);
  }
}

function overlayDir(srcDir, destDir, journal, backupDir) {
  if (!fs.existsSync(srcDir)) return;
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      overlayDir(src, dest, journal, backupDir);
      continue;
    }
    if (fs.existsSync(dest)) {
      fs.mkdirSync(backupDir, { recursive: true });
      const backup = path.join(backupDir, `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      fs.copyFileSync(dest, backup);
      journal.record({ type: 'overwrite', path: dest, backup });
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      journal.record({ type: 'create', path: dest });
    }
    fs.copyFileSync(src, dest);
  }
}

// --- Execute steps (each exported for unit testing on tmp trees) ------------

// Step 1 — move the whole workspace (every top-level entry, incl. .git) into
// repo/. Only the whole-tree move keeps `git status` layout-intact (TEST B).
export function stepWholeTreeMove(root, journal) {
  const repoDir = path.join(root, 'repo');
  if (fs.existsSync(repoDir)) throw new Error('step 1: repo/ already exists — aborting');
  fs.mkdirSync(repoDir);
  journal.record({ type: 'create', path: repoDir });
  for (const name of fs.readdirSync(root)) {
    if (name === 'repo' || name === JOURNAL_BASENAME || name === BACKUP_BASENAME) continue;
    const from = path.join(root, name);
    const to = path.join(repoDir, name);
    fs.renameSync(from, to);
    journal.record({ type: 'move', from, to });
  }
  assertLayoutIntact(repoDir);
  return repoDir;
}

// Step 2 — swap doctrine + reading-map from the staged tree (cell 2 owns its
// contents). Contract: stagedDir has repo/ (overlaid onto ./repo) and workshop/
// (overlaid onto the root, where the workshop doctrine lives after extract).
export function stepSwapDoctrine(root, journal, stagedDir) {
  const backupDir = path.join(root, BACKUP_BASENAME);
  if (!fs.existsSync(stagedDir)) {
    throw new Error(`step 2: staged doctrine dir not found: ${stagedDir}`);
  }
  overlayDir(path.join(stagedDir, 'repo'), path.join(root, 'repo'), journal, backupDir);
  overlayDir(path.join(stagedDir, 'workshop'), root, journal, backupDir);
}

// Step 3 — untrack the workshop, write repo/.gitignore, make the single untrack
// commit. This is the point of no return (D1): it demands explicit confirmation
// unless --yes (rehearsal copies only). Non-interactive without --yes = refuse.
export async function stepUntrack(root, journal, opts) {
  const confirmed = await confirmPointOfNoReturn(opts);
  if (!confirmed) {
    throw new Error(
      'step 3: refused — the untrack commit is the point of no return and needs ' +
        'explicit confirmation (or --yes on a rehearsal copy)',
    );
  }
  const repoDir = path.join(root, 'repo');
  const workshopPresent = WORKSHOP_PATHS.filter((rel) => fs.existsSync(path.join(repoDir, rel)));
  for (const rel of workshopPresent) {
    git(repoDir, ['rm', '-r', '--cached', '--quiet', '--', rel]);
  }
  const ignoreFile = path.join(repoDir, '.gitignore');
  const existing = fs.existsSync(ignoreFile) ? fs.readFileSync(ignoreFile, 'utf8') : '';
  const block = ['', '# Workshop tree — untracked in the product repo (repo divorce)', ...workshopPresent.map((p) => `/${p}/`)].join('\n');
  fs.writeFileSync(ignoreFile, existing.replace(/\s*$/, '') + '\n' + block + '\n');
  git(repoDir, ['add', '.gitignore']);
  git(repoDir, ['commit', '--quiet', '-m', 'chore: untrack workshop tree from product repo']);
  journal.markPointOfNoReturn();
}

// Step 4 — extract the workshop back above ./repo at the filesystem level, so
// ignored workshop content (.bee/state.json, logs, upstreams) travels with its
// directory while ignored product content (.gitnexus, .fgos/state.json) stays.
export function stepExtractWorkshop(root, journal) {
  const repoDir = path.join(root, 'repo');
  for (const rel of WORKSHOP_PATHS) {
    const from = path.join(repoDir, rel);
    if (!fs.existsSync(from)) continue;
    const to = path.join(root, rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.renameSync(from, to);
    journal.record({ type: 'move', from, to });
  }
  // Postcheck: bee hooks resolve from the workshop root ($CLAUDE_PROJECT_DIR).
  if (!fs.existsSync(path.join(root, '.bee'))) {
    throw new Error('step 4: postcheck failed — .bee did not land at the workshop root');
  }
}

// Step 5 — give the workshop its own light git repo; ./repo stays nested and
// ignored so the two repos never swallow each other (D4).
export function stepGitInitWorkshop(root) {
  git(root, ['init', '--quiet']);
  const ignore = ['repo/', 'node_modules/', JOURNAL_BASENAME, BACKUP_BASENAME + '/', ''].join('\n');
  fs.writeFileSync(path.join(root, '.gitignore'), ignore);
  git(root, ['add', '-A']);
  git(root, ['commit', '--quiet', '-m', 'chore: initialize workshop repo']);
}

// Step 6 — repoint the recorded commands at ./repo via a targeted text-edit.
// The config is not strict JSON (trailing comma), so never JSON.parse round-trip.
export function stepPatchConfig(root) {
  const file = path.join(root, '.bee', 'config.json');
  let text = fs.readFileSync(file, 'utf8');
  const edits = [
    ['"test": "npm test"', '"test": "cd repo && npm test"'],
    [
      '"verify": "npm test && node .claude/skills/distill/scripts/distill.mjs check"',
      '"verify": "cd repo && npm test && node ../.claude/skills/distill/scripts/distill.mjs check"',
    ],
  ];
  for (const [from, to] of edits) {
    if (!text.includes(from)) {
      throw new Error(`step 6: config command not found (already patched or drifted?): ${from}`);
    }
    text = text.replace(from, to);
  }
  fs.writeFileSync(file, text);
}

// --- Confirmation -----------------------------------------------------------

async function confirmPointOfNoReturn(opts) {
  if (opts && opts.yes) return true;
  if (opts && typeof opts.confirm === 'function') return await opts.confirm();
  if (!process.stdin.isTTY) return false;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await new Promise((resolve) =>
      rl.question('This is the point of no return (untrack commit). Type "yes" to proceed: ', resolve),
    );
    return answer.trim().toLowerCase() === 'yes';
  } finally {
    rl.close();
  }
}

// --- Orchestration ----------------------------------------------------------

export function formatPlan({ plan, unknown }) {
  const lines = ['repo-divorce migration plan', ''];
  const groups = { product: [], workshop: [], doctrine: [], 'git-meta': [] };
  for (const item of plan) groups[item.category].push(item.path);
  for (const cat of ['product', 'workshop', 'doctrine', 'git-meta']) {
    lines.push(`${cat} (${groups[cat].length}):`);
    for (const p of groups[cat].sort()) lines.push(`  ${p}`);
    lines.push('');
  }
  if (unknown.length) {
    lines.push(`UNKNOWN — STOP-ASK (${unknown.length}):`);
    for (const p of unknown.sort()) lines.push(`  ${p}`);
    lines.push('');
  }
  return lines.join('\n');
}

function parseArgs(argv) {
  const opts = { mode: null, root: process.cwd(), yes: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') opts.mode = 'dry-run';
    else if (a === '--execute') opts.mode = 'execute';
    else if (a === '--rollback') opts.mode = 'rollback';
    else if (a === '--yes') opts.yes = true;
    else if (a === '--root') opts.root = path.resolve(argv[++i]);
    else if (a === '--help' || a === '-h') opts.mode = 'help';
    else throw new Error(`unknown argument: ${a}`);
  }
  return opts;
}

const USAGE = `Usage: repo-divorce --dry-run | --execute | --rollback [--root <path>] [--yes]

  --dry-run    Classify the whole tree and print the plan. Zero mutation.
  --execute    Run the 6-step migration (whole-tree move -> doctrine swap ->
               untrack commit -> workshop extract -> workshop git init ->
               config patch). Prompts before the untrack commit unless --yes.
  --rollback   Reverse checkpointed moves taken before the untrack commit.
  --root       Workspace root to operate on (default: cwd). Use a /tmp copy to
               rehearse --execute; --yes is for rehearsal copies only.`;

async function runExecute(root, opts) {
  const journal = new Journal(path.join(root, JOURNAL_BASENAME));
  const { unknown } = planWorkspace(root);
  if (unknown.length) {
    throw new Error(`execute refused — unclassified top-level entries (STOP-ASK):\n  ${unknown.join('\n  ')}`);
  }
  const repoDir = stepWholeTreeMove(root, journal);
  const stagedDir = path.join(repoDir, 'scripts', 'repo-divorce-staged');
  stepSwapDoctrine(root, journal, stagedDir);
  await stepUntrack(root, journal, opts);
  stepExtractWorkshop(root, journal);
  stepGitInitWorkshop(root);
  stepPatchConfig(root);
  journal.clear();
  fs.rmSync(path.join(root, BACKUP_BASENAME), { recursive: true, force: true });
}

export async function main(argv) {
  const opts = parseArgs(argv);
  if (opts.mode === 'help' || opts.mode === null) {
    process.stdout.write(USAGE + '\n');
    return opts.mode === 'help' ? 0 : 1;
  }
  if (opts.mode === 'dry-run') {
    const result = planWorkspace(opts.root);
    process.stdout.write(formatPlan(result) + '\n');
    if (result.unknown.length) {
      process.stderr.write('STOP-ASK: unclassified top-level entries above — resolve before executing.\n');
      return 2;
    }
    return 0;
  }
  if (opts.mode === 'rollback') {
    rollback(opts.root);
    process.stdout.write('rollback complete — checkpointed moves reversed.\n');
    return 0;
  }
  if (opts.mode === 'execute') {
    await runExecute(opts.root, opts);
    process.stdout.write('execute complete — product at ./repo, workshop re-homed above it.\n');
    return 0;
  }
  return 1;
}

// Run only when invoked directly, not when imported by the test file.
if (import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((err) => {
      process.stderr.write(String(err && err.message ? err.message : err) + '\n');
      process.exit(1);
    });
}
