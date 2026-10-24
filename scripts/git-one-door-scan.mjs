#!/usr/bin/env node
// git-one-door-scan.mjs -- the static half of the one-door gate (Git spec §12, V-GATE).
//
// A Git write is any child process whose resolved binary is `git` or a repository hook, with any argv,
// unless it runs through the private CLI driver of fgos-git. This scan follows every spawn site --
// child_process, holder-lock's runBorrowed, execSync/shell strings and Rust Command::new -- back through
// variables, `??`/`||`/ternaries and wrapper parameters to the binary it can run. A wrapper whose
// binary is a parameter is resolved at each caller; callers of a Git wrapper are counted on the site.
// A binary the scan cannot resolve counts as a site: unknown data flow is never assumed safe.
//
// The scan lists every file of its root (inside a repository: tracked and untracked non-ignored paths,
// read through Inspect) and skips no directory by its name. It judges the product the root's owners
// declare: the Node payload package.json ships (`files`, `bin`), every crate the root Cargo workspace
// names (members and its separately built `exclude` crates) and the installed hooks directory. Files
// outside that declaration (tests, fixtures, records) are counted per top-level directory in the
// census; a root that declares nothing (a probe tree) is judged whole.
//
// Named classes (spec §13) are reported apart from product sites and never by path alone:
//   - git-driver: Command::new inside fgos-git's own crate source, the one door;
//   - sandbox-door: the shared sandbox door (scripts/lib/sandbox-git.mjs), recognised because its
//     spawn carries the sandbox marker `Symbol.for('fgos.git.sandbox-door')`; using the marker anywhere
//     else is itself a site;
//   - production-sandbox-probe: a Rust Git spawn whose repository the same function creates under
//     `temp_dir()`;
//   - hook-read-context: a read-verb Git spawn inside a shipped hook (`.githooks/`);
//   - rust-test: Rust code under `tests/` or `#[cfg(test)]`;
//   - standalone-skill-script: code of a skill whose own SKILL.md declares `metadata.oneDoor: standalone`
//     (owner decision 2026-10-20): outside the product one-door boundary, reported and counted.
// Explicit owner declarations extend these classes by exact path + function/call digest, never by
// line number. Pass-through argv binds the sorted multiset of resolved wrapper caller-call digests;
// unresolved caller escapes refuse the declaration, except for configured-binary provenance.
// Hook verb claims must equal the callers' literal read verbs.
// Tooling that cannot use an existing port has its own declared-tooling-exemption class; every
// declaration carries its reason and retirement condition and must match exactly one raw site.
//
// Usage: node scripts/git-one-door-scan.mjs [--json] [--root <dir>] [--write-census]
// The release build writes the census (packages/git/contracts/mutation-census.v1.json); doctor's
// `git-mutation-one-door` reads it back through verifyCensus.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lexSource } from './lib/js-source-lexer.mjs';
import { STANDALONE_SKILL_CLASS, shellRunsGit, standaloneSkillOf } from './lib/git-spawn-match.mjs';
import { repositoryDirs, repositoryFiles } from './lib/git-dir-layout.mjs';
import { createGitInspect, gitPortOptions } from '../src/git/inspect.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// The hooks directory `fgos setup` wires as core.hooksPath (src/setup/git-hooks.mjs).
const HOOKS_DIR = '.githooks';
const JS_EXT = new Set(['.mjs', '.js', '.cjs']);
const SPAWN_FNS = ['execFileSync', 'execFile', 'spawnSync', 'spawn', 'execSync', 'exec'];
const SHELL_FNS = new Set(['execSync', 'exec']);
const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash', 'cmd', 'cmd.exe', 'powershell', 'pwsh']);
const PASSTHROUGH = new Set(['env', 'nice', 'timeout', 'xargs', 'sudo', 'nohup', 'stdbuf', 'npx']);
const HOOK_NAMES = new Set(['pre-commit', 'prepare-commit-msg', 'commit-msg', 'post-commit', 'pre-push', 'pre-rebase', 'post-checkout', 'post-merge', 'pre-receive', 'post-receive', 'update', 'reference-transaction', 'pre-merge-commit', 'post-rewrite']);
// Verbs that only read, keyed by `hookVerb`: `reflog` and `symbolic-ref` count only in their read forms.
const READ_VERBS = new Set(['reflog show', 'reflog exists', 'config --get', 'config --get-all', 'config --list', 'rev-parse', 'diff', 'show', 'cat-file', 'ls-files', 'ls-tree', 'show-ref', 'diff-tree', 'log', 'merge-base', 'for-each-ref', 'symbolic-ref read', 'rev-list', 'var', 'version', '--version', 'check-attr', 'check-ignore', 'name-rev', 'describe']);
const WRITE_VERBS = /\bgit\s+(?:-C\s+\S+\s+)?(add|commit|push|pull|fetch|merge|rebase|reset|checkout|switch|restore|rm|mv|stash|tag|cherry-pick|revert|am|apply|clean|init|clone|update-ref|update-index|gc|prune|notes|hook\s+run|worktree\s+(?:add|remove|prune|move|lock|unlock|repair)|branch\s+-[dDfmM]|config\s+(?!--get|-l|--list)[\w.-]+\s+\S)/;
const PROHIBITION = /\b(never|not|don't|do not|no longer|instead of|refuse[sd]?|forbid|rather than|without)\b/i;

const rel = (root, file) => path.relative(root, file).split(path.sep).join('/');
const lineOf = (text, index) => text.slice(0, index).split('\n').length;
const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');

/** Every file of `root`, relative to it: inside a repository its tracked and untracked non-ignored
 * paths, read through Inspect (`openInspect()` opens the port); outside one, every file on disk. No
 * directory is left out by its name. */
export function listFiles(root, openInspect = () => createGitInspect(gitPortOptions(root))) {
  if (repositoryDirs(root)) {
    const files = repositoryFiles(root, openInspect());
    if (files) return [...files].sort();
  }
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) out.push(rel(root, full));
    }
  };
  walk(root);
  return out.sort();
}

/**
 * The product `root`'s owners declare, as a predicate over relative paths, or null when `root`
 * declares none (then every file is judged): the Node payload its package.json ships (`files`,
 * `bin`, package.json itself), every crate its Cargo workspace names (members, and the crates it
 * builds on their own under `exclude`), and the hooks directory `fgos setup` installs. Files outside
 * it (tests, fixtures, records) are counted in the census, never judged as product.
 */
export function declaredProduct(root) {
  let pkg = null;
  let cargo = null;
  try { pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')); } catch { /* none declared */ }
  try { cargo = fs.readFileSync(path.join(root, 'Cargo.toml'), 'utf8'); } catch { /* none declared */ }
  if (!Array.isArray(pkg?.files) && !cargo) return null;
  const crates = (key) => [...(new RegExp(`^\\s*${key}\\s*=\\s*\\[([^\\]]*)\\]`, 'm').exec(cargo ?? '')?.[1] ?? '').matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const bins = typeof pkg?.bin === 'string' ? [pkg.bin] : Object.values(pkg?.bin ?? {});
  const entries = [...(pkg?.files ?? []), ...bins, 'package.json', ...crates('members'), ...crates('exclude'), HOOKS_DIR]
    .map((entry) => path.posix.normalize(entry.replaceAll('\\', '/')).replace(/\/$/, ''));
  return (name) => entries.some((entry) => name === entry || name.startsWith(`${entry}/`));
}

function kindOf(name, source) {
  const ext = path.extname(name);
  if (JS_EXT.has(ext)) return 'js';
  if (ext === '.rs') return 'rust';
  if (ext === '.sh') return 'shell';
  if (ext === '.md' && /(^|\/)skills\//.test(name)) return 'skill';
  if (!ext && source.startsWith('#!')) return /node/.test(source.split('\n', 1)[0]) ? 'js' : 'shell';
  return null;
}

// ---------- shared value model ----------
// A value is a set of possibilities: {lit: '...'} | {param: name, fn} | {unknown: text} | {self: true}.

function binaryClass(value) {
  if (value.self) return 'other';
  if (value.fnref) return 'other'; // a function is no program name
  if (value.external) return 'external';
  // An object or array literal is no program: child_process refuses any binary that is not a string.
  if (value.object !== undefined) return 'other';
  if (value.unknown !== undefined) return 'unknown';
  if (value.param !== undefined) return 'param';
  const v = value.lit.trim();
  const base = v.split(/[\\/]/).pop().replace(/\.exe$/i, '');
  if (base === 'git') return 'git';
  if (HOOK_NAMES.has(base) || /(^|\/)\.githooks\/|(^|\/)hooks\//.test(v)) return 'hook';
  if (SHELLS.has(base)) return 'shell';
  if (PASSTHROUGH.has(base)) return 'passthrough';
  return 'other';
}

// ---------- JavaScript ----------

// A property path is a list of keys; `*` is any one element and `**` one or more nested elements, so a
// path that a recursion deepens (a deep merge reading `existing[key]` again and again) stays finite.
function normalPath(path) {
  const out = [];
  for (const key of path) {
    const last = out.at(-1);
    if ((key === '*' || key === '**') && (last === '*' || last === '**')) out[out.length - 1] = '**';
    else out.push(key);
  }
  return out;
}

function splitArgs(shape, open) {
  // `open` indexes the '(' of a call; returns [{from, to}] for each top-level argument and the close index.
  const args = [];
  let depth = 0;
  let start = open + 1;
  for (let i = open; i < shape.length; i++) {
    const c = shape[i];
    if ('([{'.includes(c)) { depth++; continue; }
    if (')]}'.includes(c)) {
      depth--;
      if (depth === 0) { if (shape.slice(start, i).trim()) args.push({ from: start, to: i }); return { args, close: i }; }
      continue;
    }
    if (c === ',' && depth === 1) { args.push({ from: start, to: i }); start = i + 1; }
  }
  return { args, close: shape.length };
}

function functionSpans(shape) {
  // Every function-like body with its name (when it has one) and its parameter names.
  const spans = [];
  const header = /(?:\bfunction\s*\*?\s*([A-Za-z_$][\w$]*)?\s*\(|\b([A-Za-z_$][\w$]*)\s*[:=]\s*(?:async\s+)?(?:function\s*\*?\s*\w*\s*)?\(|(?<=^|[\s,{(=:?])(?:async\s+)?\(|\b([A-Za-z_$][\w$]*)\s*\()/g;
  for (let m; (m = header.exec(shape));) {
    const open = m.index + m[0].length - 1; // every header alternative ends at its parameter list's `(`
    if (open < 0) continue;
    const { args, close } = splitArgs(shape, open);
    let k = close + 1;
    while (/\s/.test(shape[k] ?? '')) k++;
    let arrow = false;
    if (shape.slice(k, k + 2) === '=>') { arrow = true; k += 2; while (/\s/.test(shape[k] ?? '')) k++; }
    else if (shape[k] !== '{') continue;
    const name = m[1] ?? m[2] ?? m[3] ?? null;
    if (!arrow && !m[1] && !m[2] && m[3] && /^(if|for|while|switch|catch|with|return|typeof|function)$/.test(m[3])) continue;
    if (!arrow && !m[0].includes('function') && !m[3]) continue;
    let end;
    if (shape[k] === '{') {
      let depth = 0;
      for (end = k; end < shape.length; end++) { if (shape[end] === '{') depth++; else if (shape[end] === '}' && --depth === 0) break; }
    } else {
      let depth = 0;
      for (end = k; end < shape.length; end++) {
        const c = shape[end];
        if ('([{'.includes(c)) depth++; else if (')]}'.includes(c)) { if (depth-- === 0) break; } else if ((c === ',' || c === ';') && depth === 0) break;
      }
    }
    const params = args.map(({ from, to }) => shape.slice(from, to));
    spans.push({ name, from: open, bodyFrom: k, to: end, params });
    header.lastIndex = open + 1;
  }
  // An arrow with one bare parameter (`const scoped = ctx => ...`).
  for (const m of shape.matchAll(/(?:\b([A-Za-z_$][\w$]*)\s*[:=]\s*)?(?<![\w$.])(?:async\s+)?([A-Za-z_$][\w$]*)\s*=>/g)) {
    const at = m.index + m[0].lastIndexOf(m[2]);
    if (m[2] === 'async' || (m[1] && /^(?:const|let|var)$/.test(m[1]))) continue;
    let k = m.index + m[0].length;
    while (/\s/.test(shape[k] ?? '')) k++;
    let end;
    if (shape[k] === '{') {
      let depth = 0;
      for (end = k; end < shape.length; end++) { if (shape[end] === '{') depth++; else if (shape[end] === '}' && --depth === 0) break; }
    } else {
      let depth = 0;
      for (end = k; end < shape.length; end++) {
        const c = shape[end];
        if ('([{'.includes(c)) depth++; else if (')]}'.includes(c)) { if (depth-- === 0) break; } else if ((c === ',' || c === ';') && depth === 0) break;
      }
    }
    spans.push({ name: m[1] ?? null, from: at, bodyFrom: k, to: end, params: [m[2]] });
  }
  return spans.sort((a, b) => a.from - b.from);
}

function paramNames(text) {
  // Names bound by a parameter, including destructured ones and their defaults.
  const names = [];
  const cleaned = text.replace(/=[^,}\]]*/g, '');
  for (const m of cleaned.matchAll(/(?:\.\.\.)?([A-Za-z_$][\w$]*)\s*(?::\s*([A-Za-z_$][\w$]*))?/g)) names.push(m[2] ?? m[1]);
  return names;
}

function enclosing(spans, index) {
  let best = null;
  for (const s of spans) if (s.bodyFrom <= index && index <= s.to && (!best || s.bodyFrom >= best.bodyFrom)) best = s;
  return best;
}

// Each spawn site gets a bounded share of evaluation steps; past it the binary is unknown, never safe.
// Within one share, an expression already evaluated at the same place gives the same values. One met again
// while it is still being evaluated (a cycle: `x = { ...x, extra }`) starts from no values and is evaluated
// again until its values stop growing; past a few rounds it is also unknown. Nothing computed from a cycle
// still in progress is kept.
const budget = { steps: 0, limit: 300000, memo: new Map(), stack: [] };
const MAX_CYCLE_ROUNDS = 4;
const valueKey = (v) => JSON.stringify([v.lit, v.external, v.unknown, v.self, v.param, v.fn?.from, v.file?.name, v.path, v.object, v.at, v.bound]);
// One copy of each value: a binding reached through several call paths otherwise multiplies
// per step until one array overflows the stack in a spread push.
function uniqueValues(values) {
  const seen = new Set();
  return values.filter((v) => !seen.has(valueKey(v)) && seen.add(valueKey(v)));
}
function memoized(key, compute) {
  const { memo, stack } = budget;
  const known = memo.get(key);
  if (known?.done) return known.value;
  if (known) {
    // A cycle back to an entry still in progress: everything evaluated since depends on its current value.
    known.hit = true;
    for (let i = stack.lastIndexOf(known) + 1; i < stack.length; i++) stack[i].tainted = true;
    return known.value;
  }
  const entry = { value: [], done: false, hit: false, tainted: false };
  memo.set(key, entry);
  stack.push(entry);
  try {
    for (let round = 1; ; round++) {
      entry.hit = false;
      const out = compute();
      const grew = out.some((v) => !entry.value.some((w) => valueKey(w) === valueKey(v)));
      entry.value = out;
      if (!entry.hit || !grew) break;
      if (round >= MAX_CYCLE_ROUNDS) { entry.value = [...out, { unknown: `${key.split('\0').pop().slice(0, 60)} (cyclic data flow)` }]; break; }
    }
    if (entry.tainted) memo.delete(key); else entry.done = true;
    return entry.value;
  } finally {
    stack.pop();
  }
}
// How deep one evaluation may nest: a configuration value crosses many modules on its way to a spawn.
const MAX_DEPTH = 200;

class JsFile {
  constructor(name, source, ctx) {
    this.ctx = ctx;
    this.name = name;
    this.source = source;
    const { code, shape } = lexSource(source);
    this.code = code;
    this.shape = shape;
    this.spans = functionSpans(shape);
  }

  text(from, to) { return this.code.slice(from, to).trim(); }

  /** Possible values of expression `expr` (code text) evaluated at `index`. */
  evaluate(expr, index, depth = 0) {
    return memoized(`e\0${this.name}\0${index}\0${expr.trim()}`, () => this.evaluateOnce(expr, index, depth));
  }

  evaluateOnce(expr, index, depth) {
    if (++budget.steps > budget.limit) return [{ unknown: `${expr.trim().slice(0, 60)} (data flow too deep)` }];
    expr = expr.trim().replace(/^await\s+/, '').replace(/^\(([\s\S]*)\)$/, '$1').trim();
    if (depth > MAX_DEPTH) return [{ unknown: `${expr} (data flow too deep)` }];
    if (expr.startsWith('{') && lexSource(expr).shape.trimEnd().endsWith('}')) return [{ object: expr, file: this, at: index }];
    if (expr.startsWith('[') && splitArgs(lexSource(expr).shape, 0).close === lexSource(expr).shape.trimEnd().length - 1) return [{ object: expr, file: this, at: index, array: true }];
    const str = /^(['"])((?:\\.|(?!\1).)*)\1$/s.exec(expr);
    if (str) return [{ lit: str[2] }];
    const tpl = /^`([^`]*)`$/s.exec(expr);
    if (tpl) return [{ lit: tpl[1] }];
    if (/^process\.execPath$/.test(expr)) return [{ self: true }];
    if (/^process\.argv\b/.test(expr)) return [{ external: 'command-line arguments' }];
    if (/^(null|undefined|false|true|-?\d+(\.\d+)?)$/.test(expr)) return []; // not a binary: spawn would throw
    const env = /^process\.env(?:\.([A-Za-z_]\w*)|\[\s*['"]([^'"]+)['"]\s*\])$/.exec(expr);
    if (env) return [{ external: `env ${env[1] ?? env[2]}` }];
    if (tpl === null && /^`[\s\S]*`$/.test(expr)) return this.template(expr, index, depth);
    const shapeExpr = lexSource(expr).shape;
    // A conditional binds loosest: `a || b ? c : d` yields c or d.
    const q = topLevel(shapeExpr, '?');
    if (q >= 0) {
      const c = topLevel(shapeExpr.slice(q + 1), ':');
      if (c >= 0) return [...this.evaluate(expr.slice(q + 1, q + 1 + c), index, depth + 1), ...this.evaluate(expr.slice(q + 2 + c), index, depth + 1)];
    }
    for (const op of ['??', '||']) {
      const at = topLevel(shapeExpr, op);
      if (at >= 0) return [...this.evaluate(expr.slice(0, at), index, depth + 1), ...this.evaluate(expr.slice(at + op.length), index, depth + 1)];
    }
    // `a && b` is `b`, or a falsy `a`, which is no binary.
    const and = topLevel(shapeExpr, '&&');
    if (and >= 0) return this.evaluate(expr.slice(and + 2), index, depth + 1);
    // `.trim()` keeps the value it trims; a declared `verify` command is consumer data however it is reached.
    if (/(?:\?\.|\.)trim\(\s*\)$/.test(shapeExpr)) return this.evaluate(expr.replace(/(?:\?\.|\.)trim\(\s*\)$/, ''), index, depth + 1);
    if (/(?:\?\.|\.)verify$/.test(shapeExpr)) return [{ external: `consumer verify command (${expr})` }];
    // `.filter`/`.slice`/... of an array holds a subset of its elements: the same possible values.
    const narrowed = /^([\s\S]+?)\s*\.\s*(?:filter|slice|concat|reverse|sort)\s*\(/.exec(shapeExpr);
    if (narrowed && splitArgs(shapeExpr, narrowed[0].length - 1).close === shapeExpr.trimEnd().length - 1) return this.evaluate(expr.slice(0, narrowed[1].length), index, depth + 1);
    const pick = /^([\s\S]+?)\s*(?:\?\.|\.)\s*(?:find|findLast|at)\s*\(/.exec(shapeExpr);
    if (pick && splitArgs(shapeExpr, pick[0].length - 1).close === shapeExpr.trimEnd().length - 1) return this.elements(expr.slice(0, pick[1].length), index, depth + 1);
    const indexed = /^([A-Za-z_$][\w$]*(?:\??\.[A-Za-z_$][\w$]*)*)\s*(?:\?\.)?\[([^\[\]]+)\]$/.exec(shapeExpr);
    if (indexed) return /^\s*\d+\s*$/.test(indexed[2]) ? this.property(expr.slice(0, indexed[1].length), [indexed[2].trim()], index, depth + 1) : this.elements(expr.slice(0, indexed[1].length), index, depth + 1);
    // `table[key].command`: the property read off any element.
    const indexedMember = /^([A-Za-z_$][\w$]*(?:\??\.[A-Za-z_$][\w$]*)*)\s*(?:\?\.)?\[([^\[\]]+)\]((?:\??\.[A-Za-z_$][\w$]*)+)$/.exec(shapeExpr);
    if (indexedMember) return this.property(expr.slice(0, indexedMember[1].length), [/^\s*\d+\s*$/.test(indexedMember[2]) ? indexedMember[2].trim() : '*', ...indexedMember[3].split(/\??\./).filter(Boolean)], index, depth + 1);
    const ctor = /^new\s+URL\s*\(/.exec(shapeExpr);
    if (ctor && splitArgs(shapeExpr, ctor[0].length - 1).close === shapeExpr.trimEnd().length - 1) return this.callValue('new URL', expr, ctor[0].length - 1, index, depth);
    const callMember = /^([A-Za-z_$][\w$.]*)\s*\(/.exec(shapeExpr);
    if (callMember) {
      const close = splitArgs(shapeExpr, callMember[0].length - 1).close;
      const tail = shapeExpr.slice(close + 1).trim();
      if (tail && /^(?:\??\.[A-Za-z_$][\w$]*)+$/.test(tail)) {
        const keys = tail.split(/\??\./).filter(Boolean);
        if (/^[A-Z][A-Z0-9]*_[A-Z0-9_]+$/.test(keys.at(-1))) return [{ external: `env ${keys.at(-1)}` }];
        return this.access(this.evaluate(expr.slice(0, close + 1), index, depth + 1), keys, expr, depth);
      }
    }
    const call = /^([A-Za-z_$][\w$.]*)\s*\(/.exec(shapeExpr);
    if (call && splitArgs(shapeExpr, call[0].length - 1).close === shapeExpr.trimEnd().length - 1) return this.callValue(call[1], expr, call[0].length - 1, index, depth);
    // `make().method(args)`: the method of the object the call returns.
    const chained = /^([\s\S]+\))\s*(?:\?\.|\.)\s*([A-Za-z_$][\w$]*)\s*\(/.exec(shapeExpr);
    if (chained && this.ctx && topLevel(shapeExpr.slice(0, chained[1].length), '?') < 0 && splitArgs(shapeExpr, chained[0].length - 1).close === shapeExpr.trimEnd().length - 1) {
      const argText = splitArgs(shapeExpr, chained[0].length - 1).args.map(({ from, to }) => expr.slice(from, to));
      const out = this.evaluate(expr.slice(0, chained[1].length), index, depth + 1).flatMap((holder) => {
        const target = holder.object !== undefined ? objectMethod(this.ctx, holder, chained[2]) : null;
        return target ? bindCall(holder, this.returnsOf(target, argText, index, depth), depth) : [{ unknown: expr }];
      });
      return out.length ? out : [{ unknown: expr }];
    }
    const member = /^([A-Za-z_$][\w$]*)((?:\??\.[A-Za-z_$][\w$]*)+)$/.exec(expr);
    if (member) return this.memberValue(member[1], member[2].split(/\??\./).filter(Boolean), index, depth);
    const id = /^[A-Za-z_$][\w$]*$/.test(expr) ? expr : null;
    if (!id) return [{ unknown: expr }];
    // A parameter of the enclosing function: the caller decides.
    for (let fn = enclosing(this.spans, index); fn; fn = enclosing(this.spans, fn.from - 1)) {
      const at = fn.params.findIndex((p) => paramNames(p).includes(id));
      if (at >= 0) {
        const head = this.code.slice(fn.from, fn.bodyFrom);
        const fallback = new RegExp(`\\b${id.replace(/\$/g, '\\$')}\\s*=(?![=>])\\s*`).exec(head);
        const fallbackText = fallback ? head.slice(fallback.index + fallback[0].length, fallback.index + fallback[0].length + statementEnd(lexSource(head.slice(fallback.index + fallback[0].length)).shape, 0)) : null;
        const defaults = fallbackText ? this.evaluate(fallbackText, fn.bodyFrom, depth + 1) : [];
        return [{ param: id, index: at, fn, file: this, destructured: /[{[]/.test(fn.params[at]), path: [], defaults }, ...defaults];
      }
      if (fn.from <= 0) break;
    }
    // The binding visible at `index`: `const id = ...` or `const { key: id } = ...`, in the innermost
    // function that encloses both, the nearest preceding one there, else the first one in that scope.
    const binding = this.binding(id, index);
    if (!binding) {
      // A constant imported from a relative module: its value there.
      const imported = this.ctx && importedBinding(this.ctx, this, id);
      if (imported) return imported.file.evaluate(imported.name, imported.file.code.length, depth + 1);
      // A function declared here or imported: the function itself, as a value.
      const fnref = this.ctx && resolveFunction(this.ctx, this, id);
      return fnref ? [{ fnref }] : [{ unknown: expr }];
    }
    if (binding.key !== undefined) {
      const start = binding.m.index + binding.m[0].length;
      return this.property(this.code.slice(start, statementEnd(this.shape, start)), [binding.key], start, depth + 1);
    }
    if (binding.ofIndex !== undefined) {
      const start = binding.m.index + binding.m[0].length;
      const iterable = this.code.slice(start, statementEnd(this.shape, start)).trim();
      // `Object.entries(x)` pairs a key (a string, no binary) with an element of `x`.
      const entries = /^Object\.entries\s*\(([\s\S]*)\)$/.exec(iterable);
      if (entries) return binding.ofIndex === 0 ? [] : binding.ofIndex === 1 ? this.elements(entries[1], start, depth + 1) : [];
      return this.property(iterable, ['*', String(binding.ofIndex)], start, depth + 1);
    }
    if (binding.of || binding.array) {
      const start = binding.m.index + binding.m[0].length;
      return this.elements(this.code.slice(start, statementEnd(this.shape, start)), start, depth + 1);
    }
    const found = binding.m;
    const start = found.index + found[0].length;
    const end = statementEnd(this.shape, start);
    // An object bound here may be filled in later (`out[key] = ...`): property reads see those writes.
    const values = (found[1].startsWith('=') ? this.evaluate(this.code.slice(start, end), start, depth + 1) : []).map((v) => (v.object !== undefined && !v.bound ? { ...v, bound: id } : v));
    // Later assignments to a `let` count too.
    const assign = new RegExp(`(?<![\\w$.])${id.replace(/\$/g, '\\$')}\\s*=(?!=)\\s*`, 'g');
    for (let m; (m = assign.exec(this.shape));) {
      if (m.index === found.index + found[0].indexOf(id) || this.shape.slice(Math.max(0, m.index - 6), m.index).match(/(const|let|var)\s*$/)) continue;
      // Only writes to this binding: not one a nested function's own parameter or declaration shadows.
      if (this.binding(id, m.index)?.m.index !== found.index) continue;
      let shadowed = false;
      for (let fn = enclosing(this.spans, m.index); fn && fn.bodyFrom > (binding.scope?.bodyFrom ?? -1); fn = enclosing(this.spans, fn.from - 1)) {
        if (fn.params.some((p) => paramNames(p).includes(id))) { shadowed = true; break; }
        if (fn.from <= 0) break;
      }
      if (shadowed) continue;
      const s = m.index + m[0].length;
      values.push(...this.evaluate(this.code.slice(s, statementEnd(this.shape, s)), s, depth + 1));
    }
    return values;
  }

  /** Possible values of the elements of an array expression: a literal, a name bound to one, `.filter`/`.slice` of one. */
  elements(expr, index, depth) {
    return memoized(`l\0${this.name}\0${index}\0${expr.trim()}`, () => this.elementsOnce(expr, index, depth));
  }

  elementsOnce(expr, index, depth) {
    expr = expr.trim();
    for (let inner; expr.startsWith('(') && splitArgs(lexSource(expr).shape, 0).close === lexSource(expr).shape.trimEnd().length - 1 && (inner = expr.slice(1, -1).trim());) expr = inner;
    if (++budget.steps > budget.limit) return [{ unknown: `elements of ${expr.slice(0, 60)} (data flow too deep)` }];
    if (depth > MAX_DEPTH) return [{ unknown: `${expr.slice(0, 60)} (data flow too deep)` }];
    const shape = lexSource(expr).shape;
    if (shape.startsWith('[') && splitArgs(shape, 0).close === shape.trimEnd().length - 1) {
      return splitArgs(shape, 0).args.flatMap(({ from, to }) => {
        const item = expr.slice(from, to).trim();
        return item.startsWith('...') ? this.elements(item.slice(3), index, depth + 1) : this.evaluate(item, index, depth + 1);
      });
    }
    const q = topLevel(shape, '?');
    if (q >= 0) {
      const c = topLevel(shape.slice(q + 1), ':');
      if (c >= 0) return [...this.elements(expr.slice(q + 1, q + 1 + c), index, depth + 1), ...this.elements(expr.slice(q + 2 + c), index, depth + 1)];
    }
    for (const op of ['??', '||']) {
      const at = topLevel(shape, op);
      if (at >= 0) return [...this.elements(expr.slice(0, at), index, depth + 1), ...this.elements(expr.slice(at + op.length), index, depth + 1)];
    }
    if (shape.startsWith('{') && splitArgs(shape, 0).close === shape.trimEnd().length - 1) {
      // An object's values, as `Object.keys`/`[k]` reads see them.
      return splitArgs(shape, 0).args.flatMap(({ from, to }) => {
        const item = expr.slice(from, to).trim();
        if (item.startsWith('...')) return this.elements(item.slice(3), index, depth + 1);
        const colon = topLevel(lexSource(item).shape, ':');
        return this.evaluate(colon >= 0 ? item.slice(colon + 1) : item, index, depth + 1);
      });
    }
    const narrowed = /^([\s\S]+?)\s*\.\s*(?:filter|slice|concat|reverse|sort)\s*\(/.exec(shape);
    if (narrowed && splitArgs(shape, narrowed[0].length - 1).close === shape.trimEnd().length - 1) return this.elements(expr.slice(0, narrowed[1].length), index, depth + 1);
    if (/^process\.argv\b/.test(expr)) return [{ external: 'command-line arguments' }];
    // `table[key]` and `table[key].list`: the elements of what any element holds there.
    const indexed = /^([A-Za-z_$][\w$]*(?:\??\.[A-Za-z_$][\w$]*)*)\s*(?:\?\.)?\[[^\[\]]+\]((?:\??\.[A-Za-z_$][\w$]*)*)$/.exec(shape);
    if (indexed) return this.property(expr.slice(0, indexed[1].length), ['*', ...indexed[2].split(/\??\./).filter(Boolean), '*'], index, depth + 1);
    if (/^[A-Za-z_$][\w$]*(?:\??\.[A-Za-z_$][\w$]*)+$/.test(expr)) {
      return this.evaluate(expr, index, depth + 1).flatMap((v) => {
        if (v.object !== undefined) return bindCall(v, v.file.elements(v.object, v.at, depth + 1), depth); // an object literal's values
        return [v.external || v.param !== undefined ? (v.param !== undefined ? { ...v, path: normalPath([...v.path, '*']) } : v) : { unknown: `elements of ${expr}` }];
      });
    }
    const mapped = /^([\s\S]+?)\s*\.\s*(?:map|flatMap)\s*\(/.exec(shape);
    if (mapped && splitArgs(shape, mapped[0].length - 1).close === shape.trimEnd().length - 1) {
      // `xs.map((x) => body)`: the callback's result, its parameter standing for an element.
      const cb = splitArgs(shape, mapped[0].length - 1).args[0];
      const text = cb ? expr.slice(cb.from, cb.to).trim() : '';
      const arrow = /^(?:async\s*)?(?:\(([^)]*)\)|([A-Za-z_$][\w$]*))\s*=>\s*([\s\S]+)$/.exec(text);
      if (arrow && !arrow[3].trim().startsWith('{')) return this.evaluate(arrow[3], index, depth + 1).map((v) => (v.param !== undefined ? { unknown: `element of ${expr}` } : v));
      return [{ unknown: `elements of ${expr}` }];
    }
    const call = /^([A-Za-z_$][\w$.]*)\s*\(/.exec(shape);
    if (call && splitArgs(shape, call[0].length - 1).close === shape.trimEnd().length - 1) {
      if (call[1] === 'JSON.parse') return [{ external: 'configuration file data' }];
      const target = this.ctx && resolveFunction(this.ctx, this, call[1]);
      if (!target) return this.follow(this.evaluate(expr, index, depth + 1), [], `elements of ${expr}`, depth, 'elements');
      const out = returnTexts(target.file, target.fn).flatMap(({ text, at }) => target.file.elements(text, at, depth + 1));
      const argText = splitArgs(shape, call[0].length - 1).args.map(({ from, to }) => expr.slice(from, to));
      return out.flatMap((v) => (v.param === undefined || v.fn !== target.fn ? [v] : argumentValues(this, v, argText, index, depth)));
    }
    if (/^[A-Za-z_$][\w$]*$/.test(expr)) {
      for (let fn = enclosing(this.spans, index); fn; fn = enclosing(this.spans, fn.from - 1)) {
        const at = fn.params.findIndex((p) => paramNames(p).includes(expr));
        if (at >= 0) return [{ param: expr, index: at, fn, file: this, destructured: /[{[]/.test(fn.params[at]), path: ['*'], defaults: [], rest: fn.params[at].trim().startsWith('...') }];
        if (fn.from <= 0) break;
      }
      const b = this.binding(expr, index);
      if (b?.array) {
        const start = b.m.index + b.m[0].length;
        return this.elements(this.code.slice(start, statementEnd(this.shape, start)), start, depth + 1);
      }
      // A local or imported name: the elements of every value it is bound or later assigned.
      return this.follow(this.evaluate(expr, index, depth + 1), [], `elements of ${expr}`, depth, 'elements');
    }
    return [{ unknown: `elements of ${expr}` }];
  }

  binding(id, index) {
    const name = id.replace(/\$/g, '\\$');
    const candidates = [];
    const destr = /\b(?:const|let|var)\s*\{([^}]*)\}\s*=\s*/g;
    for (let m; (m = destr.exec(this.shape));) {
      const part = this.code.slice(m.index, m.index + m[0].length).match(/\{([^}]*)\}/)[1].split(',').map((x) => x.trim()).find((x) => new RegExp(`^(?:([\\w$]+)\\s*:\\s*)?${name}(?:\\s*=.*)?$`).test(x));
      if (part) candidates.push({ m, key: /^([\w$]+)\s*:/.exec(part)?.[1] ?? id });
    }
    const decl = new RegExp(`\\b(?:const|let|var)\\s+${name}\\s*(=\\s*|;|\\n)`, 'g');
    for (let m; (m = decl.exec(this.shape));) candidates.push({ m });
    const arr = /\b(?:const|let|var)\s*\[([^\]]*)\]\s*=\s*/g;
    for (let m; (m = arr.exec(this.shape));) {
      const parts = this.code.slice(m.index, m.index + m[0].length).match(/\[([^\]]*)\]/)[1].split(',').map((x) => x.trim());
      if (parts.some((x) => x.replace(/^\.\.\./, '').replace(/\s*=.*$/, '') === id)) candidates.push({ m, array: true });
    }
    const loop = new RegExp(`\\bfor\\s*\\(\\s*(?:const|let|var)\\s+${name}\\s+of\\s+`, 'g');
    for (let m; (m = loop.exec(this.shape));) candidates.push({ m, of: true });
    // `for (const [key, value] of entries)`: position `ofIndex` of each element.
    const loopPair = /\bfor\s*\(\s*(?:const|let|var)\s*\[([^\]]*)\]\s+of\s+/g;
    for (let m; (m = loopPair.exec(this.shape));) {
      const at = this.code.slice(m.index, m.index + m[0].length).match(/\[([^\]]*)\]/)[1].split(',').map((x) => x.trim().replace(/\s*=.*$/, '')).indexOf(id);
      if (at >= 0) candidates.push({ m, of: true, ofIndex: at });
    }
    const visible = candidates.map((c) => ({ ...c, scope: enclosing(this.spans, c.m.index) })).filter((c) => !c.scope || (c.scope.bodyFrom <= index && index <= c.scope.to));
    if (!visible.length) return null;
    const depthOf = (c) => c.scope?.bodyFrom ?? -1;
    const inner = Math.max(...visible.map(depthOf));
    const own = visible.filter((c) => depthOf(c) === inner).sort((a, b) => a.m.index - b.m.index);
    return own.filter((c) => c.m.index < index).at(-1) ?? own[0];
  }

  /** `${a}b` style templates: the basename is the last interpolation joined to the literal tail. */
  template(expr, index, depth) {
    const body = expr.slice(1, -1);
    const lastOpen = body.lastIndexOf('${');
    const close = body.indexOf('}', lastOpen);
    const tail = body.slice(close + 1);
    if (tail.includes('/')) return [{ lit: tail.split('/').pop() }];
    return this.evaluate(body.slice(lastOpen + 2, close), index, depth + 1).map((v) => (v.lit !== undefined ? { lit: v.lit + tail } : v));
  }

  /** Values of `callee(args)`: path joins keep their last segment; local and imported functions return. */
  callValue(callee, expr, open, index, depth) {
    const shapeExpr = lexSource(expr).shape;
    const { args } = splitArgs(shapeExpr, open);
    const argText = args.map(({ from, to }) => expr.slice(from, to));
    if (/^path\.(join|resolve|normalize)$/.test(callee)) {
      const last = argText.at(-1)?.trim();
      if (last === undefined) return [{ unknown: expr }];
      return last.startsWith('...') ? this.elements(last.slice(3), index, depth + 1) : this.evaluate(last, index, depth + 1);
    }
    if (/^(fileURLToPath|url\.fileURLToPath)$/.test(callee) || callee === 'new URL') return argText.length ? this.evaluate(argText[0], index, depth + 1) : [{ unknown: expr }];
    if (callee === 'JSON.parse') return [{ external: 'configuration file data' }];
    if (/^(fs\.realpathSync|path\.basename|String)$/.test(callee)) return argText.length ? this.evaluate(argText[0], index, depth + 1) : [{ unknown: expr }];
    if (callee === 'Object.freeze') return argText.length ? this.evaluate(argText[0], index, depth + 1) : [{ unknown: expr }];
    // `registry.get(key)` on a module-private Map: any value the module stores in it.
    const mapGet = /^([A-Za-z_$][\w$]*)\.get$/.exec(callee);
    const stored = mapGet && this.mapValues(mapGet[1], index, depth);
    if (stored) return stored;
    // `obj.method(args)`: the method of each object `obj` may hold, returning with its own arguments bound.
    // On a parameter, the method of whatever its callers pass, applied to these arguments.
    if (this.ctx && callee.includes('.')) {
      const dot = callee.lastIndexOf('.');
      const method = callee.slice(dot + 1);
      const out = this.evaluate(callee.slice(0, dot), index, depth + 1).flatMap((holder) => {
        if (holder.param !== undefined && !holder.applied) return [{ ...holder, applied: { pre: [...holder.path, method], argText, caller: this, index }, path: [] }];
        const target = holder.object !== undefined ? objectMethod(this.ctx, holder, method) : null;
        if (target) return bindCall(holder, this.returnsOf(target, argText, index, depth), depth);
        // A literal with no such member, no spread and no later writes: the call throws, no program runs.
        if (holder.object !== undefined && !holder.bound && !holder.array && literalMember(holder.object, method) === null
          && !splitArgs(lexSource(holder.object).shape, 0).args.some(({ from, to }) => holder.object.slice(from, to).trim().startsWith('...'))
          && !new RegExp(`(?:^\\{|,)\\s*(?:async\\s+)?${method}\\s*\\(`).test(lexSource(holder.object).shape)) return [];
        return [{ unknown: expr }];
      });
      return out.length ? out : [{ unknown: expr }];
    }
    const target = this.ctx && resolveFunction(this.ctx, this, callee);
    if (target) return this.returnsOf(target, argText, index, depth, expr);
    // A call of a name that holds a function: what that function returns. A parameter holding one is
    // resolved where the caller passes the function (`sanitize(raw)` with `{ sanitize: sanitizeConfig }`).
    if (!this.ctx || !IDENT_RE.test(callee)) return [{ unknown: expr }];
    const out = this.evaluate(callee, index, depth + 1).flatMap((held) => {
      if (held.fnref) return this.returnsOf(held.fnref, argText, index, depth, expr);
      if (held.param !== undefined && !held.applied) return [{ ...held, applied: { pre: held.path, argText, caller: this, index }, path: [] }];
      return [{ unknown: expr }];
    });
    return out.length ? out : [{ unknown: expr }];
  }

  /**
   * Values stored in the Map bound to `id`: `new Map([[k, v], ...])` entries and every `id.set(k, v)` in this
   * module. Null when `id` is no module-private Map or the Map goes anywhere but its own get/set/has calls.
   */
  mapValues(id, index, depth) {
    const b = this.binding(id, index);
    if (!b || b.key !== undefined || b.of || b.array || !b.m[1].startsWith('=')) return null;
    const start = b.m.index + b.m[0].length;
    const init = this.code.slice(start, statementEnd(this.shape, start)).trim();
    const ctor = /^new\s+(?:Weak)?Map\s*\(/.exec(init);
    if (!ctor || /\bexport\s+$/.test(this.shape.slice(Math.max(0, b.m.index - 8), b.m.index))) return null;
    const name = id.replace(/\$/g, '\\$');
    const uses = [...this.shape.matchAll(new RegExp(`(?<![\\w$.])${name}\\b`, 'g'))].filter((m) => m.index !== b.m.index + b.m[0].indexOf(id));
    if (uses.some((m) => !/^\s*\.\s*(?:get|set|has|delete|keys|size)\b/.test(this.shape.slice(m.index + id.length)))) return null;
    const out = [];
    const { args: [entries] } = splitArgs(lexSource(init).shape, ctor[0].length - 1);
    if (entries) out.push(...this.property(init.slice(entries.from, entries.to), ['*', '1'], start, depth + 1));
    for (const m of this.shape.matchAll(new RegExp(`(?<![\\w$.])${name}\\s*\\.\\s*set\\s*\\(`, 'g'))) {
      const open = m.index + m[0].length - 1;
      const value = splitArgs(this.shape, open).args[1];
      if (value) out.push(...this.evaluate(this.code.slice(value.from, value.to), open, depth + 1));
    }
    return out;
  }

  /** What calling `target` with `argText` (evaluated here) returns. */
  returnsOf(target, argText, index, depth, expr = target.fn.name) {
    const out = [];
    for (const v of returnValues(target.file, target.fn, depth + 1)) {
      // An omitted argument is not a binary; a default is already among the values.
      if (v.param !== undefined && v.fn === target.fn) out.push(...argumentValues(this, v, argText, index, depth));
      else if (v.object === undefined) out.push(v);
      else {
        // An object returned through more than one call keeps every call, innermost first.
        const call = { fn: target.fn, argText, caller: this, index };
        const within = (c) => (c ? { ...c, outer: within(c.outer) } : call);
        out.push({ ...v, call: within(v.call) });
      }
    }
    return out.length ? out : [{ unknown: expr }];
  }

  memberValue(root, keys, index, depth) {
    // A Work item's or capability's declared verification command: consumer data, never product code.
    if (keys.at(-1) === 'verify') return [{ external: `consumer verify command (${root}.${keys.join('.')})` }];
    if (root === 'process' && keys[0] === 'env') return [{ external: `env ${keys[1] ?? '*'}` }];
    if (root === 'process' && keys[0] === 'execPath') return [{ self: true }];
    // An upper-case key read off an environment map (`env.FGOS_HOST_BIN`, `rest.FGOS_HERDR_BIN`).
    if (/^[A-Z][A-Z0-9]*_[A-Z0-9_]+$/.test(keys.at(-1))) return [{ external: `env ${keys.at(-1)}` }];
    return this.access(this.evaluate(root, index, depth + 1), keys, `${root}.${keys.join('.')}`, depth);
  }

  /** `keys` read off each possible value. */
  access(base, keys, label, depth) {
    return this.follow(base, keys, label, depth);
  }

  /** `keys` (`*` for any element) read off each possible value; with `leaf` 'elements', that value's elements. */
  follow(base, keys, label, depth, leaf = 'value') {
    if (!keys.length && leaf === 'value') return base;
    const tail = leaf === 'elements' ? [...keys, '*'] : keys;
    const out = [];
    for (const v of base) {
      if (v.param !== undefined) out.push({ ...v, path: normalPath([...v.path, ...tail]) });
      else if (v.object !== undefined) out.push(...bindCall(v, [...v.file.property(v.object, keys, v.at, depth + 1, leaf), ...(keys.length ? v.file.writes(v, keys, depth + 1, leaf) : [])], depth));
      else if (v.external) out.push(v);
      else if (v.lit !== undefined || v.self) continue; // a string has no property that is a binary
      else out.push(v.unknown !== undefined ? v : { unknown: label });
    }
    return uniqueValues(out);
  }

  /** Values a bound object receives after its literal: `name.key = x` and `name[expr] = x`. */
  writes(v, keys, depth, leaf = 'value') {
    if (!v.bound || depth > MAX_DEPTH) return [];
    const [key, ...rest] = keys;
    const name = v.bound.replace(/\$/g, '\\$');
    const re = key === '*' || key === '**' ? new RegExp(`(?<![\\w$.])${name}\\s*(\\[)`, 'g') : new RegExp(`(?<![\\w$.])${name}\\s*(\\.\\s*${key.replace(/\$/g, '\\$')}\\b|\\[)`, 'g');
    const out = [];
    for (let m; (m = re.exec(this.shape));) {
      let after = m.index + m[0].length;
      if (m[1] === '[') after = splitArgs(this.shape, after - 1).close + 1;
      const eq = /^\s*=(?![=>])\s*/.exec(this.shape.slice(after));
      if (!eq) continue;
      const s = after + eq[0].length;
      const text = this.code.slice(s, statementEnd(this.shape, s));
      out.push(...this.property(text, rest, s, depth + 1, leaf));
      if (key === '**') out.push(...this.property(text, keys, s, depth + 1, leaf));
    }
    return out;
  }

  /** The `command:` value of an object literal or of the identifier bound to one. */
  property(expr, keys, index, depth = 0, leaf = 'value') {
    if (typeof keys === 'string') keys = [keys];
    return memoized(`p\0${this.name}\0${index}\0${leaf}\0${keys.join('.')}\0${expr.trim()}`, () => this.propertyOnce(expr, keys, index, depth, leaf));
  }

  propertyOnce(expr, keys, index, depth, leaf) {
    expr = expr.trim();
    if (++budget.steps > budget.limit) return [{ unknown: `${expr.slice(0, 60)}.${keys.join('.')} (data flow too deep)` }];
    if (!keys.length) return leaf === 'elements' ? this.elements(expr, index, depth + 1) : this.evaluate(expr, index, depth + 1);
    if (depth > MAX_DEPTH) return [{ unknown: `${expr.slice(0, 60)} (data flow too deep)` }];
    const [key, ...rest] = keys;
    // `*` is any element: the elements of this value, then the rest of the path off each one.
    if (key === '*') return this.follow(this.elements(expr, index, depth + 1), rest, `elements of ${expr}`, depth, leaf);
    if (key === '**') {
      const items = this.elements(expr, index, depth + 1);
      return [...this.follow(items, rest, `elements of ${expr}`, depth, leaf), ...this.follow(items, keys, `elements of ${expr}`, depth, leaf)];
    }
    if (expr.startsWith('[') && splitArgs(lexSource(expr).shape, 0).close === lexSource(expr).shape.trimEnd().length - 1) {
      // Element `n` of an array literal: that item, unless a spread before it moves it (then any element).
      if (/^\d+$/.test(key)) {
        const items = splitArgs(lexSource(expr).shape, 0).args.map(({ from, to }) => expr.slice(from, to).trim());
        const n = Number(key);
        if (items.slice(0, n + 1).some((item) => item.startsWith('...'))) return this.property(expr, ['*', ...rest], index, depth + 1, leaf);
        return items[n] === undefined ? [] : this.property(items[n], rest, index, depth + 1, leaf);
      }
      return []; // a named property of an array literal (`.length`) is no binary
    }
    if (expr.startsWith('{')) {
      const shape = lexSource(expr).shape;
      const m = new RegExp(`(?:^\\{|,)\\s*${key}\\s*(:|,|\\})`).exec(shape.replace(/\{(?=[^{]*$)/, '{'));
      let hit = null;
      // A top-level `key:` or shorthand `key` in the literal.
      let d = 0;
      for (let i = 0; i < shape.length; i++) {
        const c = shape[i];
        if ('([{'.includes(c)) { d++; if (d === 1) { const mm = new RegExp(`^\\s*${key}\\s*(:|,|\\})`).exec(shape.slice(i + 1)); if (mm) { hit = { at: i + 1 + mm.index, m: mm }; break; } } continue; }
        if (')]}'.includes(c)) { d--; continue; }
        if (c === ',' && d === 1) { const mm = new RegExp(`^\\s*${key}\\s*(:|,|\\})`).exec(shape.slice(i + 1)); if (mm) { hit = { at: i + 1, m: mm }; break; } }
      }
      void m;
      if (!hit) {
        // Not set here: whatever a top-level `...spread` supplies.
        const { args: items } = splitArgs(shape, 0);
        const spreads = items.map(({ from, to }) => expr.slice(from, to).trim()).filter((item) => item.startsWith('...'));
        return spreads.flatMap((item) => this.property(item.slice(3), keys, index, depth + 1, leaf));
      }
      if (hit.m[1] !== ':') return this.property(key, rest, index, depth + 1, leaf);
      const s = hit.at + hit.m[0].length;
      const value = expr.slice(s, s + statementEnd(lexSource(expr.slice(s)).shape, 0));
      return this.property(value, rest, index, depth + 1, leaf);
    }
    return this.follow(this.evaluate(expr, index, depth + 1), keys, `${expr}.${keys.join('.')}`, depth, leaf);
  }
}

/** The module and local name of a binding `id` imported into `file` from a relative module, if it is declared there. */
function importedBinding(ctx, file, id) {
  for (const m of file.code.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    if (!m[2].startsWith('.')) continue;
    for (const part of m[1].split(',')) {
      const [orig, alias] = part.trim().split(/\s+as\s+/);
      if ((alias ?? orig) !== id || !IDENT_RE.test(orig ?? '')) continue;
      const other = ctx.js.get(path.posix.normalize(path.posix.join(path.posix.dirname(file.name), m[2])));
      if (other && other.binding(orig, other.code.length)) return { file: other, name: orig };
    }
  }
  return null;
}

let depthOfReexport = 0;
/** A function named `callee` visible in `file`: defined there, or imported from a relative module. */
function resolveFunction(ctx, file, callee) {
  if (callee.includes('.')) return null;
  const local = file.spans.find((s) => s.name === callee);
  if (local) return { file, fn: local };
  for (const m of file.code.matchAll(/(?:import|export)\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    if (!m[2].startsWith('.')) continue;
    for (const part of m[1].split(',')) {
      const [orig, alias] = part.trim().split(/\s+as\s+/);
      if ((alias ?? orig) !== callee) continue;
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file.name), m[2]));
      const other = ctx.js.get(target) ?? ctx.load?.(target);
      const fn = other?.spans.find((s) => s.name === orig);
      if (fn) return { file: other, fn };
      // `export { orig } from` / `import { orig } ...; export { orig }` chains.
      if (other && depthOfReexport++ < 8) { try { const r = resolveFunction(ctx, other, orig); if (r) return r; } finally { depthOfReexport--; } }
    }
  }
  return null;
}

/** The method `name` of the object literal `holder` holds (`{ name(...) {...} }`, `name: (...) =>`), or a
 * function its `name:` property names. */
function objectMethod(ctx, holder, name) {
  const file = holder.file;
  let at = file.code.indexOf(holder.object, holder.at);
  if (at < 0) at = file.code.indexOf(holder.object);
  if (at < 0) return null;
  const end = at + holder.object.length;
  const outer = enclosing(file.spans, at);
  const fn = file.spans.find((s) => s.name === name && s.from > at && s.to < end && enclosing(file.spans, s.from - 1) === outer && literalMemberAt(file.shape, s) >= 0);
  if (fn) return { file, fn };
  const ref = literalMember(holder.object, name)?.trim();
  return ref && /^[A-Za-z_$][\w$]*$/.test(ref) ? resolveFunction(ctx, file, ref) : null;
}

// A recursive function is entered again under the next call's arguments, a bounded number of times: each
// level reads one more key of a finite property path (a deep merge), and past the bound the value is unknown.
const returning = new Map();
const MAX_REENTRY = 1;
/** Possible values a function returns: its `return` expressions (not nested functions'), or an arrow body. */
function returnValues(file, fn, depth) {
  const key = `${file.name}:${fn.from}`;
  const active = returning.get(key) ?? 0;
  if (active >= MAX_REENTRY || depth > MAX_DEPTH) return [{ unknown: `${fn.name}() (recursive)` }];
  returning.set(key, active + 1);
  try {
    if (file.shape[fn.bodyFrom] !== '{') return file.evaluate(file.code.slice(fn.bodyFrom, fn.to), fn.bodyFrom, depth);
    const out = [];
    const re = /\breturn\b\s*/g;
    re.lastIndex = fn.bodyFrom;
    for (let m; (m = re.exec(file.shape)) && m.index < fn.to;) {
      if (enclosing(file.spans, m.index) !== fn) continue;
      const s = m.index + m[0].length;
      const end = statementEnd(file.shape, s);
      const text = file.code.slice(s, end).trim();
      if (!text) continue;
      out.push(...file.evaluate(text, s, depth));
    }
    return out.length ? out : [{ unknown: `${fn.name}() (no return value)` }];
  } finally {
    if (active) returning.set(key, active); else returning.delete(key);
  }
}

/** The expressions a function returns, with their offsets. */
function returnTexts(file, fn) {
  if (file.shape[fn.bodyFrom] !== '{') return [{ text: file.code.slice(fn.bodyFrom, fn.to), at: fn.bodyFrom }];
  const out = [];
  const re = /\breturn\b\s*/g;
  re.lastIndex = fn.bodyFrom;
  for (let m; (m = re.exec(file.shape)) && m.index < fn.to;) {
    if (enclosing(file.spans, m.index) !== fn) continue;
    const s = m.index + m[0].length;
    const text = file.code.slice(s, statementEnd(file.shape, s)).trim();
    if (text) out.push({ text, at: s });
  }
  return out;
}

function topLevel(shape, op) {
  let depth = 0;
  for (let i = 0; i < shape.length; i++) {
    const c = shape[i];
    if ('([{'.includes(c)) depth++; else if (')]}'.includes(c)) depth--;
    else if (depth === 0 && shape.startsWith(op, i)) {
      if (op === '?' && (shape[i + 1] === '?' || shape[i + 1] === '.' || shape[i - 1] === '?')) { i++; continue; }
      if (op === ':' ) return i;
      return i;
    }
  }
  return -1;
}

function statementEnd(shape, start) {
  let depth = 0;
  for (let i = start; i < shape.length; i++) {
    const c = shape[i];
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) { if (depth-- === 0) return i; }
    else if (depth === 0 && (c === ';' || c === ',' || c === '\n')) {
      if (c === '\n' && /[?:+|&(,=]\s*$/.test(shape.slice(start, i))) continue;
      if (c === '\n' && /^\s*[?:.|&]/.test(shape.slice(i + 1, i + 40))) continue;
      return i;
    }
  }
  return shape.length;
}

function childProcessBindings(file) {
  // Local names that are child_process spawn functions, and namespace objects for child_process.
  // Memoized per file; an import cycle reads the bindings found so far.
  if (file.cpBindings) return file.cpBindings;
  const fns = new Map();
  const spaces = new Set();
  const borrowed = new Set();
  file.cpBindings = { fns, spaces, borrowed };
  const src = file.code;
  const cp = /['"](?:node:)?child_process['"]/;
  for (const m of src.matchAll(/import\s+([^;]*?)\s+from\s+(['"][^'"]+['"])/g)) {
    const clause = m[1];
    if (cp.test(m[2])) {
      const def = /^([A-Za-z_$][\w$]*)/.exec(clause);
      if (def && !clause.startsWith('{')) spaces.add(def[1]);
      const star = /\*\s*as\s+([A-Za-z_$][\w$]*)/.exec(clause);
      if (star) spaces.add(star[1]);
      const named = /\{([^}]*)\}/.exec(clause);
      if (named) for (const part of named[1].split(',')) {
        const [orig, alias] = part.trim().split(/\s+as\s+/);
        if (SPAWN_FNS.includes(orig)) fns.set(alias ?? orig, orig);
      }
    } else {
      const named = /\{([^}]*)\}/.exec(clause);
      // A spawn function another module of the tree exports under a name of its own.
      const spec = m[2].slice(1, -1);
      const from = spec.startsWith('.') && file.ctx?.js.get(path.posix.normalize(path.posix.join(path.posix.dirname(file.name), spec)));
      const exported = from && from !== file ? childProcessBindings(from).fns : new Map();
      if (named) for (const part of named[1].split(',')) {
        const [orig, alias] = part.trim().split(/\s+as\s+/);
        if (orig === 'runBorrowed') borrowed.add(alias ?? orig);
        else if (exported.has(orig) && new RegExp(`export\\s+(?:const|let|var)\\s+${orig.replace(/\$/g, '\\$')}\\b|export\\s*\\{[^}]*\\b${orig.replace(/\$/g, '\\$')}\\b`).test(from.code)) fns.set(alias ?? orig, exported.get(orig));
      }
    }
  }
  for (const m of src.matchAll(/(?:const|let|var)\s+([^=;]+?)\s*=\s*(?:await\s+)?(?:require|import)\(\s*['"](?:node:)?child_process['"]\s*\)/g)) {
    const lhs = m[1].trim();
    if (lhs.startsWith('{')) for (const part of lhs.slice(1, -1).split(',')) {
      const [orig, alias] = part.trim().split(/\s*:\s*/);
      if (SPAWN_FNS.includes(orig)) fns.set(alias ?? orig, orig);
    } else spaces.add(lhs);
  }
  if (/function\s+runBorrowed\s*\(/.test(src)) borrowed.add('runBorrowed');
  // Injected spawn functions: a parameter or destructured default (`exec = execFileSync`).
  for (const [local, orig] of [...fns]) {
    for (const m of src.matchAll(new RegExp(`([A-Za-z_$][\\w$]*)\\s*=\\s*${local.replace(/\$/g, '\\$')}\\s*(?=[,)}])`, 'g'))) fns.set(m[1], orig);
  }
  // Aliases: `const run = cp.spawnSync`, `const exec = opts.exec ?? execFileSync`.
  for (let changed = true; changed;) {
    changed = false;
    for (const m of src.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([^;\n]+)/g)) {
      if (fns.has(m[1])) continue;
      // `promisify(execFile)` calls the spawn function with the same arguments.
      const rhs = m[2].trim().replace(/;$/, '').replace(/^(?:[\w$]+\.)?promisify\(\s*([\w$.]+)\s*\)$/, '$1');
      const ref = /^(?:[\w$.]+\s*(?:\?\?|\|\|)\s*)*([\w$.]+)$/.exec(rhs)?.[1];
      if (!ref) continue;
      for (const [name, orig] of [...fns]) if (ref === name) { fns.set(m[1], orig); changed = true; break; }
      if (fns.has(m[1])) continue;
      for (const ns of spaces) {
        const mm = new RegExp(`^${ns}\\.(${SPAWN_FNS.join('|')})$`).exec(ref);
        if (mm) { fns.set(m[1], mm[1]); changed = true; break; }
      }
    }
  }
  return file.cpBindings;
}

function jsCallSites(file) {
  const { fns, spaces, borrowed } = childProcessBindings(file);
  const sites = [];
  const { shape } = file;
  const push = (fn, open, via) => sites.push({ fn, open, via });
  for (const [local, orig] of fns) {
    const re = new RegExp(`(?<![\\w$.])${local.replace(/\$/g, '\\$')}\\s*\\(`, 'g');
    for (let m; (m = re.exec(shape));) {
      if (/function\s*$/.test(shape.slice(Math.max(0, m.index - 12), m.index))) continue;
      push(orig, m.index + m[0].length - 1, local);
    }
  }
  for (const ns of spaces) {
    const re = new RegExp(`(?<![\\w$.])${ns}\\s*\\.\\s*(${SPAWN_FNS.join('|')})\\s*\\(`, 'g');
    for (let m; (m = re.exec(shape));) push(m[1], m.index + m[0].length - 1, `${ns}.${m[1]}`);
    // A computed member (`cp[name](..)`): the spawn function its key names; a key the scan cannot
    // read is a call of an unknown child_process function.
    const computed = new RegExp(`(?<![\\w$.])${ns}\\s*(?:\\?\\.)?\\[`, 'g');
    for (let m; (m = computed.exec(shape));) {
      const close = splitArgs(shape, m.index + m[0].length - 1).close;
      const call = /^\s*(?:\?\.)?\(/.exec(shape.slice(close + 1, close + 8));
      if (!call) continue;
      const key = file.code.slice(m.index + m[0].length, close);
      const names = file.evaluate(key, m.index).map((v) => v.lit);
      const open = close + 1 + call[0].length - 1;
      if (names.length && names.every((n) => n !== undefined)) for (const n of names) { if (SPAWN_FNS.includes(n)) push(n, open, `${ns}[${n}]`); }
      else push('computed', open, `${ns}[${key.trim()}]`);
    }
  }
  for (const local of borrowed) {
    const re = new RegExp(`(?<![\\w$.])${local}\\s*\\(`, 'g');
    for (let m; (m = re.exec(shape));) {
      if (/function\s*$/.test(shape.slice(Math.max(0, m.index - 12), m.index))) continue;
      push('runBorrowed', m.index + m[0].length - 1, local);
    }
  }
  return sites;
}

/** The command a launcher runs: its first operand after options (`env`: after `NAME=value`; `timeout`: after the duration). */
function launchedCommand(launcher, operands) {
  const base = launcher.split(/[\\/]/).pop().replace(/\.exe$/i, '');
  let duration = base === 'timeout';
  for (const o of operands) {
    if (o.lit !== undefined && (o.lit.startsWith('-') || (base === 'env' && /^[A-Za-z_]\w*=/.test(o.lit)))) continue;
    if (duration) { duration = false; continue; }
    return [o];
  }
  return [{ unknown: `${base} with no command operand` }];
}

/** Values read off an object a call returned: the callee's parameters there are that call's arguments. */
function bindCall(v, results, depth) {
  if (!v.call) return results;
  const { outer } = v.call;
  // An object read out of a bound one keeps its calls: its own parameters are bound when it is read.
  const bound = results.flatMap((r) => (r.param !== undefined && r.fn === v.call.fn
    ? argumentValues(v.call.caller, r, v.call.argText, v.call.index, depth).map((a) => withCalls(a, outer))
    : [withCalls(r, v.call)]));
  return outer ? bindCall({ call: outer }, bound, depth) : bound;
}

/** Object value `v` with the call chain `chain` after its own calls (innermost first), once. */
function withCalls(v, chain) {
  if (v.object === undefined || !chain) return v;
  for (let c = v.call; c; c = c.outer) if (c === chain) return v;
  const append = (c) => (c ? { ...c, outer: append(c.outer) } : chain);
  return { ...v, call: append(v.call) };
}

/**
 * Values of the argument a parameter value `v` stands for, evaluated in `caller` at `index`: the argument
 * (or, for a rest parameter, the arguments from its position on) read at `v`'s property path, where `*` is
 * any element. An omitted argument is not a binary.
 */
function argumentValues(caller, v, argText, index, depth) {
  const a = v.rest ? `[${argText.slice(v.index).join(', ')}]` : argText[v.index];
  if (a === undefined) return [];
  if (v.applied) {
    // The parameter held a function that was called: the functions passed here, applied to that call's arguments.
    const pre = [...(v.destructured ? [v.param] : []), ...v.applied.pre];
    const { caller: at, argText: args, index: where } = v.applied;
    return (pre.length ? caller.property(a, pre, index, depth + 1) : caller.evaluate(a, index, depth + 1)).flatMap((held) => {
      if (held.fnref) return at.follow(at.returnsOf(held.fnref, args, where, depth + 1), v.path, `${held.fnref.fn.name}(...)`, depth);
      if (held.param !== undefined && !held.applied) return [{ ...held, applied: { ...v.applied, pre: held.path }, path: v.path }];
      return held.unknown !== undefined ? [held] : [];
    });
  }
  const keys = [...(v.destructured ? [v.param] : []), ...v.path];
  return keys.length ? caller.property(a, keys, index, depth + 1) : caller.evaluate(a, index, depth + 1);
}

/** The source text of `key`'s value in an object literal, or null. */
function literalMember(text, key) {
  text = text.trim();
  if (!text.startsWith('{')) return null;
  const shape = lexSource(text).shape;
  for (const { from, to } of splitArgs(shape, 0).args) {
    const m = new RegExp(`^\\s*${key}\\s*:`).exec(shape.slice(from, to));
    if (m) return text.slice(from + m[0].length, to);
  }
  return null;
}

/** Possible binaries for one spawn call: [{value, shellText?}] */
function jsBinaries(file, site) {
  const { args } = splitArgs(file.shape, site.open);
  const argText = (i) => (args[i] ? file.code.slice(args[i].from, args[i].to) : undefined);
  const at = site.open;
  if (site.fn === 'runBorrowed') {
    const spec = argText(1);
    if (spec === undefined) return [{ value: { unknown: '(no spec)' } }];
    return file.property(spec, 'command', at).flatMap((value) => {
      if (binaryClass(value) !== 'shell') return [{ value, argv: undefined, specArgs: /\bargs\s*:/.test(spec) }];
      // A borrowed shell runs its argv's script operands: each element is judged as a shell string.
      const args = literalMember(spec, 'args');
      if (args === null) return [{ value: { unknown: `${describe(value)} with unknown args` } }];
      return file.elements(args, at, 0).map((script) => ({ value: script, shell: true }));
    });
  }
  if (site.fn === 'computed') return [{ value: { unknown: `computed child_process member ${site.via}` } }];
  const first = argText(0);
  if (first === undefined) return [{ value: { unknown: '(no argument)' } }];
  const options = argText(SHELL_FNS.has(site.fn) ? 1 : 2) ?? argText(1) ?? '';
  const values = file.evaluate(first, at);
  const shell = SHELL_FNS.has(site.fn) || shellOption(file, options, at);
  if (shell === true) return values.map((value) => ({ value, shell: true }));
  const direct = values.map((value) => ({ value, argvText: argText(1) }));
  // Options the scan cannot read may set `shell`: the binary is judged both ways.
  return shell === 'maybe' ? [...direct, ...values.map((value) => ({ value, shell: true }))] : direct;
}

/** Whether spawn options `text` set `shell`: true, false, or 'maybe' when the options cannot be
 * read. An identifier is read through its declaration, a spread through its operand. */
function shellOption(file, text, at, depth = 0) {
  text = text.trim();
  if (!text || text.startsWith('[') || /^['"`]/.test(text) || /^(?:undefined|null)$/.test(text)) return false;
  if (depth > 4) return 'maybe';
  if (IDENT_RE.test(text)) {
    const b = file.binding(text, at);
    if (!b || b.of || b.array || b.key) return 'maybe';
    const start = b.m.index + b.m[0].length;
    if (file.shape[start] !== '{') return 'maybe';
    return shellOption(file, file.code.slice(start, splitArgs(file.shape, start).close + 1), b.m.index, depth + 1);
  }
  if (!text.startsWith('{')) return 'maybe';
  const { shape } = lexSource(text);
  let found = false;
  for (const { from, to } of splitArgs(shape, 0).args) {
    const member = text.slice(from, to).trim();
    if (member.startsWith('...')) {
      const inner = shellOption(file, member.slice(3), at, depth + 1);
      if (inner === true) return true;
      if (inner === 'maybe') found = 'maybe';
      continue;
    }
    const value = /^shell\s*(?::\s*([\s\S]*))?$/.exec(member);
    if (!value) continue;
    if (value[1] === undefined) return 'maybe'; // `{ shell }`
    if (/^(?:false|0|null|undefined)$/.test(value[1].trim())) return found;
    return /^(?:true|['"`])/.test(value[1].trim()) ? true : 'maybe';
  }
  return found;
}

function classifyJs(file, site, entry) {
  // -> 'git' | 'hook' | 'unknown' | 'param' | 'other'
  const { value } = entry;
  if (entry.shell) {
    if (value.lit !== undefined) return shellRunsGit(value.lit) ? 'git' : 'other';
    const cls = binaryClass(value);
    return cls === 'param' || cls === 'external' ? cls : value.self ? 'other' : 'unknown';
  }
  const cls = binaryClass(value);
  if (cls === 'shell' || cls === 'passthrough') {
    const argv = entry.argvText ?? '';
    const literals = [...argv.matchAll(/(['"`])((?:\\.|(?!\1).)*)\1/gs)].map((m) => m[2]);
    if (cls === 'shell') {
      if (literals.some(shellRunsGit)) return 'git';
      if (/^\s*\[\s*['"]-l?c['"]\s*,\s*['"`]/.test(argv) || !/-l?c/.test(argv)) return 'other';
      // `['-c', script]` with the script in a variable: judge the script text it holds.
      const operand = /^\s*\[\s*['"]-l?c['"]\s*,\s*([A-Za-z_$][\w$]*)\s*\]\s*$/.exec(argv);
      const text = operand && scriptText(file, operand[1], site.open);
      return text === null || text === undefined ? 'unknown' : shellRunsGit(text) ? 'git' : 'other';
    }
    return literals.some((l) => binaryClass({ lit: l }) === 'git') ? 'git' : 'other';
  }
  return cls;
}

/** The shell text a name holds: a string or template literal; a `${x}` inside double quotes is one data
 * operand (it cannot start a command), any other interpolation must evaluate to literals. null: unknown. */
function scriptText(file, id, index) {
  const b = file.binding(id, index);
  if (!b || b.key !== undefined || b.of || b.array || !b.m[1].startsWith('=')) return null;
  const start = b.m.index + b.m[0].length;
  const tick = file.code[start] === '`' ? file.shape.indexOf('`', start + 1) : -1;
  const init = file.code.slice(start, tick >= 0 ? tick + 1 : statementEnd(file.shape, start)).trim();
  const str = /^(['"])((?:\\.|(?!\1).)*)\1$/s.exec(init);
  if (str) return str[2];
  if (!/^`[\s\S]*`$/.test(init)) return null;
  let text = '';
  let unknown = false;
  const body = init.slice(1, -1);
  for (let i = 0; i < body.length;) {
    if (body.startsWith('${', i)) {
      let close = i + 2;
      for (let d = 1; close < body.length; close++) { if (body[close] === '{') d++; else if (body[close] === '}' && --d === 0) break; }
      const expr = body.slice(i + 2, close);
      const quoted = (text.split('"').length - 1) % 2 === 1;
      if (quoted) text += '__operand__';
      else {
        const values = file.evaluate(expr, index);
        if (!values.length || values.some((v) => v.lit === undefined)) unknown = true;
        else text += values.map((v) => v.lit).join(' ');
      }
      i = close + 1;
      continue;
    }
    text += body[i++];
  }
  return unknown ? null : text;
}

/** The verb of a Git argv (its words after `git`), in the form READ_VERBS keys: `config` with its
 * first option, `reflog` with its subcommand (`show` when none), and `symbolic-ref` as `read` only
 * when it names one ref and sets or deletes nothing. */
function hookVerb(words) {
  let i = 0;
  while (i < words.length && /^(-C|-c|--git-dir|--work-tree)$/.test(words[i])) i += 2;
  const [verb, ...rest] = words.slice(i);
  if (verb === 'config') return `config ${rest[0]}`;
  if (verb === 'reflog') return `reflog ${rest[0] && !rest[0].startsWith('-') ? rest[0] : 'show'}`;
  if (verb === 'symbolic-ref') {
    const sets = rest.some((w) => /^(-d|--delete|-m)$/.test(w)) || rest.filter((w) => !w.startsWith('-')).length !== 1;
    return `symbolic-ref ${sets ? 'write' : 'read'}`;
  }
  return verb;
}

function firstVerbs(file, open) {
  // Literal argv verbs at a call: the literals of the argv array.
  const { args } = splitArgs(file.shape, open);
  const argv = args[1] ? file.code.slice(args[1].from, args[1].to) : '';
  const lits = [...argv.matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
  return lits.length ? hookVerb(lits) : undefined;
}

function scanJs(name, source, ctx) {
  const file = ctx.js.get(name) ?? new JsFile(name, source, ctx);
  ctx.js.set(name, file);
  for (const site of jsCallSites(file)) {
    budget.steps = 0; budget.memo.clear(); budget.stack.length = 0;
    for (const entry of jsBinaries(file, site)) {
      const cls = classifyJs(file, site, entry);
      const line = lineOf(source, site.open);
      const record = { path: name, line, spawn: site.via, binary: describe(entry.value) };
      if (cls === 'other') continue;
      if (cls === 'external') { ctx.classes.push({ ...record, class: 'configured-binary' }); continue; }
      if (cls === 'param') { ctx.wrappers.push({ file, site, entry, record }); continue; }
      ctx.raw.push({ ...record, family: cls === 'unknown' ? 'unresolved-binary' : cls === 'hook' ? 'hook-spawn' : entry.shell ? 'shell' : site.fn === 'runBorrowed' ? 'borrowed' : 'spawn', file, site, enclosing: enclosing(file.spans, site.open) });
    }
  }
  // The consumer-command marker is accepted only on a spawn whose binary is not a literal: it marks data
  // the consumer declared, so it can never stand on a spawn of `git` or any other fixed program.
  for (const site of jsCallSites(file)) {
    const { args, close } = splitArgs(file.shape, site.open);
    if (!/Symbol\.for\(\s*['"]fgos\.git\.consumer-command['"]\s*\)|\bCONSUMER_COMMAND\b/.test(file.code.slice(site.open, close))) continue;
    const first = args[0] ? file.code.slice(args[0].from, args[0].to) : '';
    if (file.evaluate(first, site.open).some((v) => v.lit !== undefined || v.self)) ctx.raw.push({ path: name, line: lineOf(source, site.open), spawn: site.via, binary: 'consumer-command marker on a fixed program', family: 'consumer-marker' });
  }
  // The marker is defined once (the shared matcher) and set only by a door's own Git spawn.
  const definition = /export\s+const\s+SANDBOX_DOOR\s*=\s*Symbol\.for\(\s*['"]fgos\.git\.sandbox-door['"]\s*\)/.test(file.code);
  const uses = [...file.code.matchAll(/Symbol\.for\(\s*['"]fgos\.git\.sandbox-door['"]\s*\)|\bSANDBOX_DOOR\b/g)];
  if (uses.length > (definition ? 2 : 0)) ctx.markers.push({ path: name, line: lineOf(source, uses[definition ? 2 : 0].index) });
}

function describe(value) {
  if (value.lit !== undefined) return value.lit.length > 80 ? `${value.lit.slice(0, 77)}...` : value.lit;
  if (value.param !== undefined) return `param ${value.param}`;
  if (value.self) return '(self)';
  if (value.fnref) return `(function ${value.fnref.fn.name})`;
  if (value.external) return `(${value.external})`;
  return `? ${String(value.unknown).replace(/\s+/g, ' ').slice(0, 80)}`;
}

function importersOf(ctx, file) {
  ctx.importers ??= new Map();
  if (!ctx.importers.has(file.name)) ctx.importers.set(file.name, findImporters(ctx, file));
  return ctx.importers.get(file.name);
}

function findImporters(ctx, file) {
  return [...ctx.js.values()].filter((other) => other !== file && [...other.code.matchAll(/(?:import|export)\s*(?:\{[^}]*\}|\*(?:\s*as\s+[A-Za-z_$][\w$]*)?)\s*from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]/g)].some((m) => {
    const spec = m[1] ?? m[2];
    return spec.startsWith('.') && path.posix.normalize(path.posix.join(path.posix.dirname(other.name), spec)) === file.name;
  }));
}

// Calls of a function `fnName` defined in `file`: same file, and importers by relative specifier.
function callersOf(ctx, file, fnName) {
  if (!fnName) return [];
  const cache = (ctx.callerCache ??= new Map());
  const cacheKey = `${file.name}\0${fnName}`;
  if (!cache.has(cacheKey)) cache.set(cacheKey, findCallers(ctx, file, fnName));
  return cache.get(cacheKey);
}

function findCallers(ctx, file, fnName) {
  const out = [];
  const find = (f, local) => {
    const re = new RegExp(`(?:(?<![\\w$.])|(?<=\\.\\.\\.)|(?<=\\bthis\\.))${local.replace(/\$/g, '\\$')}\\s*\\(`, 'g');
    for (let m; (m = re.exec(f.shape));) {
      if (/(function|async)\s*\*?\s*$/.test(f.shape.slice(Math.max(0, m.index - 14), m.index))) continue;
      const open = m.index + m[0].length - 1;
      const fn = enclosing(f.spans, open);
      if (fn && fn.name === local && fn.from === open) continue; // the definition itself
      if (f === file && f.spans.some((s) => s.name === local && s.from === open)) continue;
      out.push({ file: f, open });
    }
  };
  find(file, fnName);
  const name = fnName.replace(/\$/g, '\\$');
  // Aliases in this file and its importers, including a parameter default (`spawn = fnName`).
  for (const f of [file, ...importersOf(ctx, file)]) {
    for (const m of f.shape.matchAll(new RegExp(`(?:\\b(?:const|let|var)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*[^;\\n]*(?<![\\w$.])|([A-Za-z_$][\\w$]*)\\s*=\\s*)${name}\\b(?!\\s*\\()(?=\\s*[,;)}\\n?:|])`, 'g'))) {
      const alias = m[1] ?? m[2];
      if (alias && alias !== fnName) find(f, alias);
    }
  }
  // A registry member or a stored method: called as `.key(` or, under a computed key, `table[key](`.
  const valueRe = new RegExp(`[{,]\\s*(?:(?:([A-Za-z_$][\\w$]*)|['"][^'"]+['"])\\s*:\\s*)?${name}\\s*(?=[,}])|\\.\\s*([A-Za-z_$][\\w$]*)\\s*=\\s*${name}\\b`, 'g');
  for (const holder of [file, ...importersOf(ctx, file)]) {
    for (const m of holder.shape.matchAll(valueRe)) {
      const key = m[1] ?? m[2] ?? (/['"]\s*:/.test(m[0]) ? null : fnName);
      // The table this member sits in: `const table = { ... }` / `Object.freeze({ ... })` around it.
      let table = null;
      for (const t of holder.shape.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:Object\.freeze\(\s*)?\{/g)) {
        const open = t.index + t[0].length - 1;
        if (open <= m.index && splitArgs(holder.shape, open).close > m.index) table = t[1];
      }
      for (const f of [holder, ...importersOf(ctx, holder)]) {
        const res = table ? [new RegExp(`(?<![\\w$.])${table.replace(/\$/g, '\\$')}\\s*\\[[^\\]\\n]+\\]\\s*\\(`, 'g')] : [];
        if (key) res.push(new RegExp(`\\.\\s*${key.replace(/\$/g, '\\$')}\\s*\\(`, 'g'));
        for (const re of res) for (let c; (c = re.exec(f.shape));) out.push({ file: f, open: c.index + c[0].length - 1 });
      }
    }
  }
  const exported = new RegExp(`export\\s+(?:async\\s+)?(?:function\\s*\\*?\\s*|const\\s+|let\\s+)${fnName}\\b|export\\s*\\{[^}]*\\b${fnName}\\b`).test(file.code);
  if (!exported) return dedupeCalls(out);
  const names = (other, spec) => spec.startsWith('.') && path.posix.normalize(path.posix.join(path.posix.dirname(other.name), spec)) === file.name;
  for (const other of ctx.js.values()) {
    if (other === file) continue;
    for (const m of other.code.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]|(?:const|let|var)\s*\{([^}]*)\}\s*=\s*await\s+import\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      if (!names(other, m[2] ?? m[4])) continue;
      for (const part of (m[1] ?? m[3]).split(',')) {
        const [orig, alias] = part.trim().split(m[1] !== undefined ? /\s+as\s+/ : /\s*:\s*/);
        if (orig === fnName) find(other, alias ?? orig);
      }
    }
    // A namespace import, static or dynamic: called as `ns.fnName(`.
    for (const m of other.code.matchAll(/import\s*\*\s*as\s+([A-Za-z_$][\w$]*)\s+from\s*['"]([^'"]+)['"]|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+import\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      if (!names(other, m[2] ?? m[4])) continue;
      const re = new RegExp(`(?<![\\w$.])${(m[1] ?? m[3]).replace(/\$/g, '\\$')}\\s*\\.\\s*${name}\\s*\\(`, 'g');
      for (let c; (c = re.exec(other.shape));) out.push({ file: other, open: c.index + c[0].length - 1 });
    }
    // A re-export (`export { fnName as alias } from`, `export * from`): the callers of that module's name.
    for (const m of other.code.matchAll(/export\s*(?:\{([^}]*)\}|\*)\s*from\s*['"]([^'"]+)['"]/g)) {
      if (!names(other, m[2]) || (ctx.reexporting ??= new Set()).has(`${other.name}:${fnName}`)) continue;
      let part = m[1] === undefined ? fnName : null;
      for (const x of (m[1] ?? '').split(',')) {
        const [orig, alias] = x.trim().split(/\s+as\s+/);
        if (orig === fnName) part = alias ?? orig;
      }
      if (!part) continue;
      ctx.reexporting.add(`${other.name}:${fnName}`);
      try { out.push(...findCallers(ctx, other, part)); } finally { ctx.reexporting.delete(`${other.name}:${fnName}`); }
    }
  }
  return dedupeCalls(out);
}

function dedupeCalls(calls) {
  return [...new Map(calls.map((c) => [`${c.file.name}:${c.open}`, c])).values()];
}

// ---------- function values ----------
// A function handed on as a value -- an alias, an argument, an object property, a table entry, a return
// value, `.bind(...)` -- is called wherever that value is called. The flow follows the value together with
// the property path it sits under (`return { spawnHolding }`, later read as `lock.spawnHolding`), through
// local and imported functions. A value passed to a callee the scan cannot resolve flows to every
// parameter that destructures its key and every read of that key. A flow this model cannot follow (an
// array element, `.call`, an unresolved callee taking the function itself) is an escape: the wrapper then
// keeps its site, whatever call sites were found.

const IDENT = '[A-Za-z_$][\\w$]*';
const IDENT_RE = new RegExp(`^${IDENT}$`);
const esc = (name) => name.replace(/\$/g, '\\$');
const MAX_FLOW_ITEMS = 200;
// Built-ins that inspect or print a value and never call a function inside it.
const NO_FLOW_CALLEES = /^(?:JSON\.stringify|Object\.(?:keys|is|isFrozen|getOwnPropertyNames|hasOwn)|Array\.isArray|String|Number|Boolean|console\.\w+|assert(?:\.\w+)?|Reflect\.(?:has|ownKeys)|process\.(?:stdout|stderr)\.write)$/;

/** What a reference at `index` sits in: the nearest unmatched opener, `,`, `;`, assignment `=`, object
 * key `:`, `return` or arrow `=>` before it, skipping the operands of `??`, `||` and `?:` around it. A
 * newline alone never ends the walk (object literals span lines); a `}` that ends a line before does. */
function flowContext(shape, index) {
  let depth = 0;
  for (let i = index - 1; i >= 0; i--) {
    const c = shape[i];
    if (c === '}' && depth === 0 && /^[ \t]*\n/.test(shape.slice(i + 1, index))) return { stop: ';', at: i }; // a block ended the statement before
    if (')]}'.includes(c)) { depth++; continue; }
    if ('([{'.includes(c)) { if (depth-- === 0) return { stop: c, at: i }; continue; }
    if (depth !== 0) continue;
    if (c === ';' || c === ',') return { stop: c, at: i };
    if (c === '>' && shape[i - 1] === '=') return { stop: 'return', at: i };
    if (c === '=' && !'=!<>'.includes(shape[i - 1]) && shape[i + 1] !== '=' && shape[i + 1] !== '>') return { stop: '=', at: i };
    if (c === ':' && new RegExp(`[{,]\\s*(?:${IDENT}|['"][^'"]*['"]|\\[[^\\]]*\\])\\s*$`).test(shape.slice(Math.max(0, i - 200), i))) return { stop: ':', at: i };
    if (/\breturn$/.test(shape.slice(Math.max(0, i - 6), i + 1)) && /[\s(]/.test(shape[i + 1] ?? ' ')) return { stop: 'return', at: i };
  }
  return { stop: ';', at: -1 };
}

/** Where function span `fn` is a method or property of an object literal (`{ name(...) {`, `, name: (...) =>`),
 * the index just after the `{` or `,` that starts its member; else -1. */
function literalMemberAt(shape, fn) {
  if (!fn.name) return -1;
  const before = shape.slice(Math.max(0, fn.from - 4000), fn.from);
  const m = new RegExp(`[{,]\\s*(?:async\\s+)?${esc(fn.name)}\\s*(?::\\s*(?:async\\s*)?(?:function\\s*\\*?\\s*${IDENT}?\\s*)?)?$`).exec(before);
  return m ? fn.from - before.length + m.index + 1 : -1;
}

/** Call sites `fn` (a function defined in `file`) reaches as a value, and the flows that escape. */
function valueFlowCalls(ctx, file, fn) {
  ctx.valueFlow ??= new Map();
  const memo = `${file.name}:${fn.from}`;
  if (!ctx.valueFlow.has(memo)) ctx.valueFlow.set(memo, computeValueFlow(ctx, file, fn));
  return ctx.valueFlow.get(memo);
}

function computeValueFlow(ctx, file, fn) {
  const calls = [];
  const escapes = [];
  const items = [];
  const seen = new Set();
  const followed = new Set();
  const escape = (f, at, why) => escapes.push(`${why} (${f.name}:${lineOf(f.source, Math.max(0, at))})`);
  const push = (item) => {
    if (item.path.length > 4) return; // a cycle such as `fn.execute = fn`: shorter paths already cover its reads
    const key = `${item.kind}:${item.file.name}:${item.scope?.from ?? -1}:${item.name}:${item.path.join('.')}`;
    if (seen.has(key)) return;
    if (seen.size >= MAX_FLOW_ITEMS) { escape(item.file, 0, 'value flow too wide'); return; }
    seen.add(key);
    items.push(item);
  };
  const scopeOf = (f, id, at) => {
    for (let s = enclosing(f.spans, at); s; s = enclosing(f.spans, s.from - 1)) {
      if (s.params.some((p) => paramNames(p).includes(id))) return s;
      if (s.from <= 0) break;
    }
    return f.binding(id, at)?.scope ?? null;
  };
  // A parameter receiving the value (at `path`): a plain name, or a destructuring that takes its key.
  const intoParam = (f, span, param, path, at) => {
    const text = param.trim();
    if (text.startsWith('...')) { escape(f, at, 'passed into a rest parameter'); return; }
    if (text.startsWith('{')) {
      const pattern = text.slice(0, splitArgs(lexSource(text).shape, 0).close + 1);
      if (!path.length) { escape(f, at, 'destructured as a function'); return; }
      for (const [key, local] of destructuredPairs(pattern)) if (key === path[0]) push({ kind: 'name', file: f, scope: span, name: local, path: path.slice(1) });
      return;
    }
    const name = text.replace(/\s*=[\s\S]*$/, '');
    if (IDENT_RE.test(name)) push({ kind: 'name', file: f, scope: span, name, path });
    else escape(f, at, 'passed into an unreadable parameter');
  };
  // A value handed to a callee the scan cannot resolve, under a key: every receiver of that key.
  const byKey = (f, at, path) => {
    if (!path.length) { escape(f, at, 'passed to an unresolved callee'); return; }
    const index = keyIndex(ctx);
    for (const d of index.destructured.get(path[0]) ?? []) push({ kind: 'name', file: d.file, scope: d.scope, name: d.local, path: path.slice(1) });
    for (const r of index.reads.get(path[0]) ?? []) {
      const start = r.at - (/[\w$.?\][)]*$/.exec(r.file.shape.slice(Math.max(0, r.at - 200), r.at))?.[0].length ?? 0);
      follow(r.file, start, r.at + r.length, path.slice(1));
    }
  };
  // The expression [start, end) in `f` holds the function at property `path` of its value. Follows
  // are queued and drained by the loop below, never nested: a key read in many files would otherwise
  // chain one follow inside the next until the stack runs out.
  const pending = [];
  const follow = (...flow) => { pending.push(flow); };
  const drain = () => { while (pending.length) followNow(...pending.shift()); };
  const followNow = (f, start, end, path) => {
    const flowKey = `${f.name}:${start}:${end}:${path.join('.')}`;
    if (followed.has(flowKey)) return;
    followed.add(flowKey);
    for (;;) {
      const tail = f.shape.slice(end, end + 200);
      let m;
      if (path.length) {
        if ((m = new RegExp(`^\\s*(?:\\?\\.|\\.)\\s*(${IDENT})`).exec(tail))) {
          if (m[1] !== path[0] && path[0] !== '*') return; // another property: not this value
          end += m[0].length; path = path.slice(1); continue;
        }
        if ((m = /^\s*(?:\?\.)?\[/.exec(tail))) { end = splitArgs(f.shape, end + m[0].length - 1).close + 1; path = path.slice(1); continue; }
        if (/^\s*(?:\?\.)?\(/.test(tail)) return; // calling the holder: its result is not the holder
      } else {
        if ((m = /^\s*(?:\?\.|\.)\s*bind\s*\(/.exec(tail))) { end = splitArgs(f.shape, end + m[0].length - 1).close + 1; continue; }
        if ((m = /^\s*(?:\?\.)?\(/.exec(tail))) { calls.push({ file: f, open: end + m[0].length - 1 }); return; }
        if (/^\s*(?:\?\.|\.)\s*(?:call|apply)\s*\(/.test(tail)) { escape(f, end, 'called through .call/.apply'); return; }
        if (/^\s*(?:\?\.|\.)/.test(tail)) return; // a property of the function itself
      }
      break;
    }
    if (/^\s*=(?![=>])/.test(f.shape.slice(end, end + 4))) return; // the place is written, not read
    // Tested, not passed on: `typeof fn`, `!fn`, `fn === x`, `fn && x`, `fn ? a : b`, `key in fn`.
    if (/(?:\btypeof|\bvoid|\bdelete|!|[=!]==?|\binstanceof|\bin)\s*$/.test(f.shape.slice(Math.max(0, start - 12), start))) return;
    if (/^\s*(?:[=!]==?|&&|\binstanceof\b|\bin\b|\?(?![.?]))/.test(f.shape.slice(end, end + 12))) return;
    const { stop, at } = flowContext(f.shape, start);
    const head = f.shape.slice(Math.max(0, at - 300), at);
    let m;
    if (stop === '=') {
      if ((m = /\b(?:const|let|var)\s*\{([^}]*)\}\s*$/.exec(head))) {
        if (!path.length) { escape(f, at, 'destructured as a function'); return; }
        for (const [key, local] of destructuredPairs(`{${f.code.slice(at - m[0].length, at).match(/\{([^}]*)\}/)[1]}}`)) if (key === path[0]) push({ kind: 'name', file: f, scope: enclosing(f.spans, at), name: local, path: path.slice(1) });
        return;
      }
      if ((m = new RegExp(`(?<![\\w$.])(${IDENT})\\s*$`).exec(head))) { push({ kind: 'name', file: f, scope: scopeOf(f, m[1], at), name: m[1], path }); return; }
      if ((m = new RegExp(`(?<![\\w$.])(${IDENT})\\s*(?:\\?\\.)?\\[[^\\]\\n]*\\]\\s*$`).exec(head))) { push({ kind: 'name', file: f, scope: scopeOf(f, m[1], at), name: m[1], path: ['*', ...path] }); return; }
      if ((m = new RegExp(`(?<![\\w$.])(${IDENT})((?:\\s*\\.\\s*${IDENT})+)\\s*$`).exec(head))) {
        push({ kind: 'name', file: f, scope: scopeOf(f, m[1], at), name: m[1], path: [...m[2].split('.').map((k) => k.trim()).filter(Boolean), ...path] });
        return;
      }
      escape(f, at, 'assigned to an unreadable place');
      return;
    }
    if (stop === ':') {
      const key = new RegExp(`(?:(${IDENT})|['"]([^'"]*)['"]|\\[[^\\]]*\\])\\s*$`).exec(head);
      let outer = flowContext(f.shape, at);
      while (outer.stop === ',' || outer.stop === ':') outer = flowContext(f.shape, outer.at);
      if (outer.stop !== '{') { escape(f, at, 'an unreadable object key'); return; }
      follow(f, outer.at, splitArgs(f.shape, outer.at).close + 1, [key?.[1] ?? key?.[2] ?? '*', ...path]);
      return;
    }
    if (stop === 'return') {
      const span = f.shape[at] === '>' ? f.spans.find((s) => s.from < at && at < s.bodyFrom) : enclosing(f.spans, at);
      if (!span?.name) { escape(f, at, 'returned from an anonymous function'); return; }
      if (literalMemberAt(f.shape, span) >= 0) { escape(f, at, `returned from method ${span.name}`); return; }
      for (const c of directCalls(ctx, f, span.name)) {
        const callee = new RegExp(`${IDENT}(?:\\s*\\.\\s*${IDENT})*\\s*(?:\\?\\.)?\\s*$`).exec(c.file.shape.slice(Math.max(0, c.open - 200), c.open));
        follow(c.file, c.open - (callee?.[0].length ?? 0), splitArgs(c.file.shape, c.open).close + 1, path);
      }
      return;
    }
    let outer = { stop, at };
    while (outer.stop === ',' || outer.stop === ':') outer = flowContext(f.shape, outer.at);
    const ref = f.shape.slice(start, end).trim();
    if (outer.stop === '{') {
      const close = splitArgs(f.shape, outer.at).close + 1;
      const spread = f.shape.slice(Math.max(0, start - 3), start) === '...';
      if (!spread && !IDENT_RE.test(ref)) return; // a statement inside a block: the value is not kept
      if (spread && !path.length) return; // spreading a function copies its own properties, not the function
      if (!/(?:[=(,:?[]|\breturn|=>)\s*$/.test(f.shape.slice(Math.max(0, outer.at - 12), outer.at))) return; // a block, not an object literal
      follow(f, outer.at, close, spread ? path : [ref, ...path]);
      return;
    }
    if (outer.stop === '(') {
      const calleeMatch = new RegExp(`(${IDENT}(?:\\s*\\.\\s*${IDENT})*)\\s*(?:\\?\\.)?\\s*$`).exec(f.shape.slice(Math.max(0, outer.at - 200), outer.at));
      const callee = calleeMatch?.[1].replace(/\s+/g, '');
      const close = splitArgs(f.shape, outer.at).close + 1;
      if (!callee) { follow(f, outer.at, close, path); return; } // parentheses around the value
      if (/^(if|while|switch|for|typeof|catch|with)$/.test(callee)) return; // tested, not kept
      const { args } = splitArgs(f.shape, outer.at);
      const index = args.findIndex(({ from, to }) => from <= start && end <= to);
      if (index < 0) return;
      if (callee === 'Reflect.set' && index === 2) {
        const table = f.code.slice(args[0].from, args[0].to).trim();
        if (IDENT_RE.test(table)) push({ kind: 'name', file: f, scope: scopeOf(f, table, outer.at), name: table, path: ['*', ...path] });
        else escape(f, outer.at, 'stored into an unreadable table');
        return;
      }
      if (callee === 'Object.freeze') { follow(f, outer.at - calleeMatch[0].length, close, path); return; }
      if (NO_FLOW_CALLEES.test(callee) || (callee === 'Reflect.set' && index === 0)) return; // reads or prints the value, never calls it
      const target = resolveFunction(ctx, f, callee);
      if (target && target.fn.params[index] !== undefined) { intoParam(target.file, target.fn, target.fn.params[index], path, outer.at); return; }
      byKey(f, outer.at, path);
      return;
    }
    if (outer.stop === '[') { escape(f, outer.at, 'stored in an array'); return; }
    if (outer.stop === ';') {
      if (/\bexport\s+default\s*$/.test(f.shape.slice(Math.max(0, start - 20), start))) escape(f, start, 'exported as default');
      return; // an expression statement: the value is not kept
    }
    escape(f, at, 'an unreadable use');
  };

  const member = literalMemberAt(file.shape, fn);
  if (member >= 0) {
    // A method or property of an object literal: the literal holds it under its name.
    let outer = flowContext(file.shape, member);
    while (outer.stop === ',' || outer.stop === ':') outer = flowContext(file.shape, outer.at);
    if (outer.stop === '{') follow(file, outer.at, splitArgs(file.shape, outer.at).close + 1, [fn.name]);
    else escape(file, fn.from, 'a member of an unreadable object');
  } else if (fn.name) {
    push({ kind: 'name', file, scope: enclosing(file.spans, fn.from - 1), name: fn.name, path: [], origin: true });
  } else {
    // An anonymous callback can still be assigned to a named local (`const run = fallback ||
    // ((command, args) => ...))`). Follow that expression to its binding, then to its calls.
    follow(file, fn.from, fn.to + (file.shape[fn.bodyFrom] === '{' ? 1 : 0), []);
  }
  drain();
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const f = item.file;
    // A module-level binding is read wherever it is imported.
    if (!item.scope && new RegExp(`export\\s+(?:const|let|var|(?:async\\s+)?function\\s*\\*?)\\s*${esc(item.name)}\\b|export\\s*\\{[^}]*\\b${esc(item.name)}\\b`).test(f.code)) {
      for (const [other, alias] of importedAs(ctx, f, item.name)) push({ ...item, file: other, name: alias, origin: false });
    }
    f.flowShape ??= f.shape.replace(/(?:import|export)\s*\{[^}]*\}\s*from\s*['"][^'"]*['"]/g, (m) => ' '.repeat(m.length));
    const shape = f.flowShape;
    const from = item.scope ? item.scope.from : 0;
    const to = item.scope ? item.scope.to : shape.length;
    const re = new RegExp(`(?<![\\w$.])${esc(item.name)}(?![\\w$])`, 'g');
    re.lastIndex = from;
    for (let m; (m = re.exec(shape)) && m.index <= to;) {
      const at = m.index;
      const after = at + item.name.length;
      if (/(?:\bfunction\s*\*?|\b(?:const|let|var)|\.\.\.)\s*$/.test(shape.slice(Math.max(0, at - 12), at))) continue;
      if (f.spans.some((s) => s.name === item.name && s.from >= after && /^\s*(?:=\s*(?:async\s*)?(?:function\s*\*?\s*\w*\s*)?)?\($/.test(shape.slice(after, s.from + 1)))) continue; // a definition
      if (/^\s*:(?!:)/.test(shape.slice(after)) && /[{,]\s*$/.test(shape.slice(Math.max(0, at - 40), at))) continue; // an object key
      const params = f.spans.find((s) => s.from < at && at < s.bodyFrom && shape.slice(s.from, s.bodyFrom).includes('('));
      if (params) {
        // Inside a parameter list: a default value flows into its parameter; a parameter name is a declaration.
        const dflt = new RegExp(`(${IDENT})\\s*=\\s*[^,]*$`).exec(shape.slice(params.from + 1, at));
        if (dflt && params.params.some((p) => paramNames(p).includes(dflt[1]))) push({ kind: 'name', file: f, scope: params, name: dflt[1], path: item.path });
        continue;
      }
      if (item.origin && /^\s*\.\s*[A-Za-z_$][\w$]*\s*=(?![=>])/.test(shape.slice(after, after + 80))) continue; // `fn.prop = ...` describes the function
      follow(f, at, after, item.path);
    }
    drain();
  }
  return { calls, escapes };
}

/** Calls of a named function by name: in its own file and where it is imported (under any alias). */
function directCalls(ctx, file, fnName) {
  const out = [];
  const find = (f, local) => {
    for (const m of f.shape.matchAll(new RegExp(`(?<![\\w$.])${esc(local)}\\s*\\(`, 'g'))) {
      const open = m.index + m[0].length - 1;
      if (f.spans.some((s) => s.from === open)) continue; // the definition itself
      if (/(?:function|async)\s*\*?\s*$/.test(f.shape.slice(Math.max(0, m.index - 14), m.index))) continue;
      out.push({ file: f, open });
    }
  };
  find(file, fnName);
  for (const [other, alias] of importedAs(ctx, file, fnName)) find(other, alias);
  return out;
}

/** [file, local name] for every relative `import { name }` of `file`'s export `name`. */
function importedAs(ctx, file, name) {
  const out = [];
  for (const other of importersOf(ctx, file)) {
    for (const m of other.code.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
      if (path.posix.normalize(path.posix.join(path.posix.dirname(other.name), m[2])) !== file.name) continue;
      for (const part of m[1].split(',')) {
        const [orig, alias] = part.trim().split(/\s+as\s+/);
        if (orig === name) out.push([other, alias ?? orig]);
      }
    }
  }
  return out;
}

/** Every member read `.key` and every destructuring of `key` in the payload, by key, built once. */
function keyIndex(ctx) {
  if (ctx.keyIndex) return ctx.keyIndex;
  const reads = new Map();
  const destructured = new Map();
  const add = (map, key, entry) => { if (!map.has(key)) map.set(key, []); map.get(key).push(entry); };
  for (const f of ctx.js.values()) {
    for (const m of f.shape.matchAll(/(?:\?\.|\.)\s*([A-Za-z_$][\w$]*)(?![\w$])/g)) add(reads, m[1], { file: f, at: m.index, length: m[0].length });
    const patterns = [
      ...f.spans.flatMap((span) => span.params.filter((p) => p.trim().startsWith('{')).map((p) => ({ text: p, scope: span }))),
      ...[...f.shape.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}\s*=/g)].map((m) => ({ text: `{${f.code.slice(m.index, m.index + m[0].length).match(/\{([^}]*)\}/)[1]}}`, scope: enclosing(f.spans, m.index) })),
    ];
    for (const { text, scope } of patterns) {
      for (const [key, local] of destructuredPairs(text)) add(destructured, key, { file: f, scope, local });
    }
  }
  ctx.keyIndex = { reads, destructured };
  return ctx.keyIndex;
}

/** The [key, local] pairs a destructuring pattern `{ ... }` binds. */
function destructuredPairs(pattern) {
  const text = pattern.trim();
  if (!text.startsWith('{')) return [];
  const shape = lexSource(text).shape;
  const out = [];
  for (const { from, to } of splitArgs(shape, 0).args) {
    const m = new RegExp(`^(${IDENT})\\s*(?::\\s*(${IDENT}))?\\s*(?:=[\\s\\S]*)?$`).exec(shape.slice(from, to).trim());
    if (m) out.push([m[1], m[2] ?? m[1]]);
  }
  return out;
}

/** Whether any scanned file names `fn` other than at its definition or in an import/export clause. */
function referenced(ctx, file, fn) {
  const name = fn.name.replace(/\$/g, '\\$');
  // Another module can name this function only by importing it (or re-exporting it).
  for (const f of [file, ...importersOf(ctx, file)]) {
    const shape = f.shape.replace(/(?:import|export)\s*\{[^}]*\}\s*from\s*['"][^'"]*['"]|import\s+[^;]*?\s+from\s*['"][^'"]*['"]/g, (m) => ' '.repeat(m.length));
    for (const m of shape.matchAll(new RegExp(`(?<![\\w$])${name}(?![\\w$])`, 'g'))) {
      // `obj.name` is a property of something else, unless `obj` is a namespace import of this module.
      if (/\.\s*$/.test(shape.slice(Math.max(0, m.index - 4), m.index))) {
        const ns = /([A-Za-z_$][\w$]*)\s*\.\s*$/.exec(shape.slice(Math.max(0, m.index - 60), m.index))?.[1];
        if (!ns || f === file || !new RegExp(`import\\s*\\*\\s*as\\s+${ns}\\b|\\b${ns}\\s*=\\s*await\\s+import\\s*\\(`).test(f.code)) continue;
      }
      if (f === file && f.spans.some((s) => s.name === fn.name && m.index < s.from && m.index >= s.from - fn.name.length - 40 && /^[\s\w$:=*]*\(?$/.test(f.shape.slice(m.index + fn.name.length, s.from + 1)))) continue;
      return true;
    }
  }
  return false;
}

function resolveWrappers(ctx) {
  // A spawn whose binary is a parameter: resolve the argument at every caller, transitively.
  const queue = [...ctx.wrappers];
  const seen = new Set();
  while (queue.length) {
    const w = queue.shift();
    const { value } = w.entry;
    const fn = value.fn;
    // The function the parameter belongs to may sit in another module than the call that reached it.
    const home = value.file ?? w.file;
    // runBorrowed's own spawn of `spec.command`: every runBorrowed call is already a site of its own.
    if (fn?.name === 'runBorrowed' && childProcessBindings(w.file).borrowed.has('runBorrowed')) continue;
    const key = `${w.record.path}:${w.record.line}:${fn?.name}:${value.param}:${(value.path ?? []).join('.')}`;
    if (seen.has(key) || seen.size > 20000) continue;
    seen.add(key);
    let callers = callersOf(ctx, home, fn?.name);
    // Called by name or not, the function may also be called wherever it travels as a value: both count.
    const flow = fn?.name ? valueFlowCalls(ctx, home, fn) : null;
    if (flow) callers = dedupeCalls([...callers, ...flow.calls]);
    if (!callers.length && fn?.name && !referenced(ctx, home, fn)) {
      // Nothing in the payload names it outside its definition and import clauses: no product data flow
      // reaches it. Tests that call it are watched by the runtime spy.
      ctx.classes.push({ ...w.record, class: 'uncalled-wrapper', function: fn.name });
      continue;
    }
    if (!callers.length) {
      ctx.raw.push({ ...w.record, family: 'unresolved-binary', binary: `${w.record.binary} (no caller found for ${fn?.name ?? 'anonymous function'})`, file: w.file, site: w.site, enclosing: enclosing(w.file.spans, w.site.open) });
      continue;
    }
    // The value also goes somewhere the flow cannot follow: the call sites found are not all of them.
    if (flow?.escapes.length) ctx.raw.push({ ...w.record, family: 'unresolved-binary', binary: `${w.record.binary} (${fn.name} escapes: ${flow.escapes[0]})`, file: w.file, site: w.site, enclosing: enclosing(w.file.spans, w.site.open) });
    for (const c of callers) {
      budget.steps = 0; budget.memo.clear(); budget.stack.length = 0;
      const { args } = splitArgs(c.file.shape, c.open);
      const arg = args[value.index];
      if (!arg) continue; // undefined is not a binary; a default is already among the values
      const values = argumentValues(c.file, value, args.map(({ from, to }) => c.file.code.slice(from, to)), c.open, -1);
      if (values.length === 0) continue; // the default applies
      // A launcher (`timeout`, `env`, a shell) runs its argv: read the argv the wrapper takes from the same parameter.
      const argvKey = new RegExp(`^\\s*${String(value.param).replace(/\$/g, '\\$')}((?:\\.[A-Za-z_$][\\w$]*)+)\\s*$`).exec(w.entry.argvText ?? '');
      const expanded = [];
      for (const v of values) {
        const k = binaryClass(v);
        if (!w.entry.shell && argvKey && arg && (k === 'passthrough' || k === 'shell')) {
          const text = c.file.code.slice(arg.from, arg.to);
          const keys = [...(value.destructured ? [value.param] : []), ...argvKey[1].split('.').filter(Boolean)];
          const operands = c.file.property(text, keys, c.open, 0, 'elements');
          if (k === 'passthrough') { expanded.push(...launchedCommand(v.lit, operands)); continue; }
          expanded.push(...operands.map((o) => ({ ...o, shellOperand: true })));
          continue;
        }
        expanded.push(v);
      }
      for (const v of expanded) {
        const entry = { ...w.entry, value: v, ...(v.shellOperand ? { shell: true } : {}) };
        const cls = entry.shell ? (v.lit !== undefined ? (shellRunsGit(v.lit) ? 'git' : 'other') : binaryClass(v) === 'param' || binaryClass(v) === 'external' ? binaryClass(v) : 'unknown') : binaryClass(v);
        const record = { path: c.file.name, line: lineOf(c.file.source, c.open), spawn: `${fn.name} -> ${w.record.path}:${w.record.line}`, binary: describe(v) };
        if (cls === 'external') ctx.classes.push({ ...record, class: 'configured-binary' });
        else if (cls === 'param') queue.push({ file: c.file, site: { ...w.site, open: c.open }, entry, record, via: key });
        else if (cls === 'git' || cls === 'hook' || cls === 'unknown' || cls === 'shell' || cls === 'passthrough') {
          ctx.raw.push({ ...record, family: cls === 'unknown' ? 'unresolved-binary' : cls === 'hook' ? 'hook-spawn' : 'wrapper-caller', file: c.file, site: { ...w.site, open: c.open }, enclosing: enclosing(c.file.spans, c.open) });
        }
      }
    }
  }
}

function countGitCallers(ctx) {
  // A Git spawn inside a named function: count the function's callers on the site (wrappers counted).
  for (const s of ctx.raw) {
    if (!s.file || !s.enclosing?.name || s.family === 'unresolved-binary') continue;
    const callers = callersOf(ctx, s.file, s.enclosing.name);
    if (callers.length) s.callers = callers.map((c) => `${c.file.name}:${lineOf(c.file.source, c.open)}`);
  }
}

// ---------- Rust ----------

function lexRust(source) {
  const out = source.split('');
  const blank = (from, to) => { for (let k = from; k < to; k++) if (out[k] !== '\n') out[k] = ' '; };
  const n = source.length;
  for (let i = 0; i < n;) {
    const c = source[i];
    if (c === '/' && source[i + 1] === '/') { let j = source.indexOf('\n', i); if (j < 0) j = n; blank(i, j); i = j; continue; }
    if (c === '/' && source[i + 1] === '*') { let j = source.indexOf('*/', i + 2); j = j < 0 ? n : j + 2; blank(i, j); i = j; continue; }
    const raw = /^b?r(#*)"/.exec(source.slice(i, i + 12));
    if (raw && !/[\w]/.test(source[i - 1] ?? '')) { const close = `"${raw[1]}`; const j = source.indexOf(close, i + raw[0].length); i = j < 0 ? n : j + close.length; continue; }
    if (c === '"') { let j = i + 1; while (j < n && source[j] !== '"') j += source[j] === '\\' ? 2 : 1; i = j + 1; continue; }
    if (c === "'") {
      const ch = /^'(?:\\.[^']*|[^'\\])'/.exec(source.slice(i, i + 12));
      if (ch) { i += ch[0].length; continue; }
      i++; continue; // a lifetime
    }
    i++;
  }
  return out.join('');
}

function rustTestRanges(code) {
  const ranges = [];
  for (const m of code.matchAll(/#\[cfg\((?:all\()?test\b[^\]]*\]\s*(?:#\[[^\]]*\]\s*)*(?:pub(?:\([^)]*\))?\s+)?(mod\s+\w+\s*\{|fn\s+\w+[^{]*\{)/g)) {
    const open = m.index + m[0].length - 1;
    let depth = 0;
    let end = open;
    for (; end < code.length; end++) { if (code[end] === '{') depth++; else if (code[end] === '}' && --depth === 0) break; }
    ranges.push([m.index, end]);
  }
  return ranges;
}

function rustModel(name, source) {
  const code = lexRust(source);
  const testFile = /(^|\/)tests\//.test(name) || /(^|\/)benches\//.test(name);
  const tests = rustTestRanges(code);
  const block = (open) => { let depth = 0; let end = open; for (; end < code.length; end++) { if (code[end] === '{') depth++; else if (code[end] === '}' && --depth === 0) break; } return end; };
  // Generic parameters may nest one level (`fn run<S: AsRef<OsStr>>(..)`).
  const fns = [...code.matchAll(/\bfn\s+(\w+)\s*(?:<(?:[^<>]|<[^<>]*>)*>)?\s*\(([^)]*)\)[^{;]*\{/g)].map((m) => {
    const open = m.index + m[0].length - 1;
    return { name: m[1], params: m[2], from: m.index, bodyFrom: open, to: block(open) };
  });
  const impls = [...code.matchAll(/\bimpl\b(?:\s*<[^>]*>)?\s+(?:[\w:<>, ]+\s+for\s+)?([A-Za-z_]\w*)(?:<[^>{]*>)?\s*\{/g)].map((m) => ({ type: m[1], from: m.index, to: block(m.index + m[0].length - 1) }));
  const within = (i) => fns.filter((f) => f.bodyFrom <= i && i <= f.to).sort((a, b) => b.bodyFrom - a.bodyFrom)[0];
  const inTest = (i) => testFile || tests.some(([a, b]) => a <= i && i <= b);
  const model = { name, source, code, testFile, tests, fns, impls, within, inTest };
  const evalRust = (expr, index, depth = 0) => {
    for (let prev; prev !== expr;) {
      prev = expr;
      expr = expr.trim().replace(/^\(\s*([\s\S]*?)\s*\)$/, (m, inner) => (rustBalanced(inner) ? inner : m)).replace(/^&\*?|\?$|\.(?:as_str|as_ref|clone|as_os_str|to_path_buf|to_owned|to_string|to_string_lossy|into_owned|into_os_string|into|as_path|into_iter|ok|collect(?:::<[^>]*>)?)\(\)$|\.map\(\s*Into::into\s*\)$|\.with_extension\([^()]*\)$|\.(?:unwrap_or_default|unwrap)\(\)$|\.expect\(\s*"[^"]*"\s*\)$/g, '').trim();
    }
    // A string-keyed index into parsed data (`launch["command"]`): configuration, not product code.
    if (/\[\s*"[^"]+"\s*\]|\.get\(\s*"[^"]+"\s*\)/.test(expr)) return [{ external: `parsed configuration (${expr.replace(/\s+/g, ' ').slice(0, 60)})` }];
    if (/std::env::var(?:_os)?\(/.test(expr) && !/split_paths/.test(expr)) return [{ external: `env ${/var(?:_os)?\(\s*"([^"]+)"/.exec(expr)?.[1] ?? '*'}` }];
    if (depth > 6) return [{ unknown: expr }];
    const lit = /^"((?:\\.|[^"\\])*)"$/.exec(expr);
    if (lit) return [{ lit: lit[1] }];
    if (/current_exe\(\)|env!\(\s*"CARGO_BIN_EXE_|std::env::args/.test(expr)) return [{ self: true }];
    const ifElse = /^if\b[^{]*\{\s*([\s\S]*?)\s*\}\s*else\s*\{\s*([\s\S]*?)\s*\}$/.exec(expr);
    if (ifElse) return [...evalRust(ifElse[1], index, depth + 1), ...evalRust(ifElse[2], index, depth + 1)];
    // `None` and an `Err(..)` carry no program.
    if (/^None(?:\s*\[\s*0\s*\])?$/.test(expr) || /^Err\s*\(/.test(expr)) return [];
    // `match x { Some(p) => a, None => b }`: every arm's value, a binding standing for the scrutinee.
    const arms = rustMatchArms(expr);
    if (arms) return arms.flatMap(({ pattern, body }) => evalRust(rustBindArm(pattern, arms.scrutinee, body), index, depth + 1));
    // `cond.then(|| v)` is `v` or `None`.
    const then = /^[\s\S]+\.then\(\s*(?:move\s*)?\|\s*\|\s*([\s\S]+)\)$/.exec(expr);
    if (then && rustBalanced(then[1])) return evalRust(then[1], index, depth + 1);
    // `LIST.iter().map(PathBuf::from).find(..)`: an element of the list.
    const pick = /^([\s\S]+?)\.(?:iter|into_iter)\(\)(?:\.(?:map\(\s*(?:\w+::)*\w+\s*\)|copied\(\)|cloned\(\)))*\.(?:find\([\s\S]*\)|next\(\)|last\(\))$/.exec(expr);
    if (pick) return rustElements(pick[1], index, depth + 1);
    // A call by bare name, or through a module path of this crate (`pick::herdr_bin()`); a path into
    // std, core or alloc names no function of this crate.
    const qualified = /^(?!(?:std|core|alloc)::)((?:[a-z_][a-z0-9_]*::)+)([a-z_][a-z0-9_]*)\s*\(/.exec(expr);
    const call = qualified ? [qualified[0], qualified[2]] : /^([a-z_]\w*)\s*\(/i.exec(expr);
    if (call && (qualified || !fns.some((f) => f.name === call[1]))) {
      // A local closure (`let pick = |..| body`): its body.
      const closure = new RegExp(`\\blet\\s+${call[1]}\\s*=\\s*(?:move\\s*)?\\|[^|]*\\|\\s*([^;]+);`).exec(code);
      if (closure) return evalRust(source.slice(closure.index + closure[0].indexOf(closure[1]), closure.index + closure[0].length - 1), closure.index, depth + 1);
      // A function of this crate imported by `use` (`tail_shim_path` from `shim.rs`), or reached
      // through a module path: in this crate, else the one module file of that name in another crate
      // (`fgos::resolve_fgos` from a dependency's `fgos.rs`).
      const exports = (m) => m.fns.some((f) => f.name === call[1] && /\bpub\b[^;{]*$/.test(m.code.slice(Math.max(0, f.from - 30), f.from)));
      const crateOf = (n) => n.replace(/\/src\/.*$/, '');
      const models = model.ctx ? [...model.ctx.rust.values()].filter((m) => m !== model && exports(m)) : [];
      const module = qualified?.[1].split('::').filter(Boolean).at(-1);
      const elsewhere = module ? models.filter((m) => m.name.endsWith(`/${module}.rs`) || m.name.endsWith(`/${module}/mod.rs`)) : [];
      const other = models.find((m) => crateOf(m.name) === crateOf(name)) ?? (elsewhere.length === 1 ? elsewhere[0] : undefined);
      if (other) {
        const f = other.fns.find((x) => x.name === call[1]);
        const out = rustExits(other, f).flatMap((e) => other.eval(e, f.bodyFrom + 1, depth + 1)).flatMap((v) => {
          // Its parameters are this call's arguments.
          if (v.param === undefined || v.fn !== f || v.path?.length) return [v];
          const pos = f.params.split(',').findIndex((p) => new RegExp(`^\\s*(?:mut\\s+)?${v.param}\\s*:`).test(p));
          const args = rustArgs(model, index + expr.indexOf('(') >= 0 ? code.indexOf('(', index) : index);
          void args;
          const parts = expr.slice(expr.indexOf('(') + 1, expr.lastIndexOf(')')).split(',');
          return parts[pos] === undefined ? [{ unknown: expr }] : evalRust(parts[pos], index, depth + 1);
        });
        return out.length ? out : [{ unknown: expr }];
      }
    }
    const callee = call && !qualified && fns.find((f) => f.name === call[1]);
    if (callee && !/^(Some|Ok|Err)$/.test(call[1])) {
      const out = rustExits(model, callee).flatMap((e) => evalRust(e, callee.bodyFrom + 1, depth + 1));
      return out.length ? out : [{ unknown: expr }];
    }
    const path = [...expr.matchAll(/(?:\.join|PathBuf::from|Path::new)\(\s*([^()]*?)\s*\)/g)].map((m) => m[1]);
    if (path.length && /(?:\.join|PathBuf::from|Path::new)\([^()]*\)\s*(?:\)\s*)*$/.test(expr)) return path.flatMap((p) => evalRust(p, index, depth + 1)).map((v) => (v.lit !== undefined ? { lit: v.lit.split('/').pop() } : v));
    // A field of a parameter or of `self` (`spec.argv[0]`, `self.config.executable_path`, `config.bin()`):
    // resolved where values of that type are built.
    const field = /^([a-z_]\w*)((?:\s*\.\s*(?:[a-z_]\w*(?:\(\))?|\d+))+)(\s*\[\s*0\s*\])?$/i.exec(expr);
    const fn = within(index);
    if (field && fn && (field[1] === 'self' || new RegExp(`\\b${field[1]}\\s*:`).test(fn.params))) {
      return [{ param: field[1], fn, path: field[2].split('.').map((k) => k.trim()).filter(Boolean), first: Boolean(field[3]) }];
    }
    if (field && fn) {
      // A local built by `Type::parse(..)` / `Type::new(..)` / `Type { .. }`: a value of that type.
      const local = new RegExp(`\\blet\\s+(?:mut\\s+)?${field[1]}\\b[^=;]*=\\s*([A-Z]\\w*)(?:::\\w+\\s*\\(|\\s*\\{)`).exec(code.slice(fn.bodyFrom, index));
      if (local) return [{ param: field[1], fn, type: local[1], path: field[2].split('.').map((k) => k.trim()).filter(Boolean), first: Boolean(field[3]) }];
    }
    // The first `it.next()` on an iterator local is its first element.
    const next = /^([a-z_]\w*)\s*\.\s*next\(\)$/i.exec(expr);
    if (next && fn && (code.slice(fn.bodyFrom, index).match(new RegExp(`\\b${next[1]}\\s*\\.\\s*next\\(`, 'g')) ?? []).length === 0) return evalRust(`${next[1]}[0]`, index, depth + 1);
    const firstOf = /^([a-z_]\w*)\s*\[\s*0\s*\]$/i.exec(expr);
    if (firstOf) {
      if (fn && new RegExp(`\\b${firstOf[1]}\\s*:`).test(fn.params)) return [{ param: firstOf[1], fn, path: [], first: true }];
      const d = new RegExp(`\\blet\\s+(?:mut\\s+)?${firstOf[1]}\\b[^=;]*=\\s*(?:vec!\\s*)?\\[\\s*([^,\\]]+)`).exec(code.slice(fn?.bodyFrom ?? 0, index));
      if (d) {
        // An argv `[program, "-C", repo, ..]` names its repository: kept with the program it starts.
        const open = (fn?.bodyFrom ?? 0) + d.index + d[0].lastIndexOf('[');
        const items = rustArgs(model, open).map((a) => a.text.trim().replace(/\.into\(\)$/, ''));
        const at = items.indexOf('"-C"');
        const repo = at >= 1 && items[at + 1] ? { model, fn, text: items[at + 1] } : null;
        return evalRust(d[1], index, depth + 1).map((v) => (repo && !v.sandboxRepo ? { ...v, sandboxRepo: repo } : v));
      }
      // `let argv = shape(&spec.argv);`: the first element of the Vec that local function returns.
      const c = new RegExp(`\\blet\\s+(?:mut\\s+)?${firstOf[1]}\\b[^=;]*=\\s*(?:self\\s*\\.\\s*)?([a-z_]\\w*)\\s*\\(([^;]*)\\)\\s*\\??\\s*;`).exec(code.slice(fn?.bodyFrom ?? 0, index));
      const callee = c && fns.find((f) => f.name === c[1]);
      if (callee) return firstReturned(callee, c[2], index, depth + 1);
      // A Vec read out of parsed data (`request.get("argv")...collect()`): its elements are that data too.
      const read = new RegExp(`\\blet\\s+(?:mut\\s+)?${firstOf[1]}\\b[^=;]*=\\s*([^;]+);`).exec(code.slice(fn?.bodyFrom ?? 0, index));
      if (read) {
        const values = evalRust(read[1], index, depth + 1);
        if (values.length && values.every((v) => v.external)) return values;
        // A field or method result of a parameter (`helper.argv()`): its first element, resolved there.
        if (values.length && values.every((v) => v.param !== undefined)) return values.map((v) => ({ ...v, first: true }));
      }
    }
    const id = /^[a-z_][\w]*$/i.test(expr) ? expr : null;
    if (!id) return [{ unknown: expr }];
    if (fn && new RegExp(`\\b${id}\\s*:`).test(fn.params)) return [{ param: id, fn, path: [] }];
    // `let Some((program, args)) = spec.argv.split_first()`: the first element.
    const split = new RegExp(`\\blet\\s+Some\\(\\(\\s*${id}\\s*,[^=]*=\\s*([^;]+?)\\s*\\.split_first\\(\\)`).exec(code.slice(fn?.bodyFrom ?? 0, index));
    if (split) return evalRust(`${source.slice((fn?.bodyFrom ?? 0) + split.index + split[0].indexOf(split[1]), (fn?.bodyFrom ?? 0) + split.index + split[0].indexOf(split[1]) + split[1].length)}[0]`, index, depth + 1);
    // `if let Some(id) = expr {`, `while let Some(id) = expr {` and `let Some(id) = expr else {`: the
    // value the Option holds.
    const before = code.slice(fn?.bodyFrom ?? 0, index);
    const someLet = [...before.matchAll(new RegExp(`\\blet\\s+(?:Some|Ok)\\(\\s*(?:ref\\s+)?(?:mut\\s+)?${id}\\s*\\)\\s*=\\s*`, 'g'))].at(-1);
    if (someLet) {
      const from = (fn?.bodyFrom ?? 0) + someLet.index + someLet[0].length;
      const end = rustLetEnd(code, from);
      return evalRust(source.slice(from, end), from, depth + 1);
    }
    // A closure parameter (`opt.map(|p| ..)`): what the receiver holds.
    const closure = [...before.matchAll(new RegExp(`([a-z_][\\w.]*)\\s*\\.\\s*(?:map|and_then|filter|inspect|is_some_and|map_or_else)\\(\\s*(?:move\\s*)?\\|\\s*&?${id}\\s*(?::[^|]*)?\\|`, 'g'))].at(-1);
    if (closure) return evalRust(closure[1], (fn?.bodyFrom ?? 0) + closure.index, depth + 1);
    const decl = new RegExp(`\\b(?:let\\s+(?:mut\\s+)?|const\\s+|static\\s+)${id}\\b[^=;]*=\\s*([^;]+);`, 'g');
    let found = null;
    for (let m; (m = decl.exec(code));) if (!found || m.index < index) found = m;
    if (!found) return [{ unknown: expr }];
    let init = source.slice(found.index + found[0].indexOf(found[1]), found.index + found[0].length - 1).trim();
    init = init.replace(/\.into_iter\(\)$/, '');
    return evalRust(init, found.index, depth + 1);
  };
  // The first element of the Vec `f` returns when called with `argText`: its literal's first item, or the
  // first `push` into the local it returns. Parameters of `f` are this call's arguments.
  const firstReturned = (f, argText, index, depth) => {
    const body = code.slice(f.bodyFrom, f.to);
    const args = argText.split(',');
    const firstOfExit = (e) => {
      e = e.trim().replace(/^(?:Ok|Some)\(([\s\S]*)\)$/, '$1').replace(/\.clone\(\)$/, '');
      if (/^Err\s*\(/.test(e)) return [];
      const arms = rustMatchArms(e);
      if (arms) return arms.flatMap(({ pattern, body: arm }) => firstOfExit(rustBindArm(pattern, arms.scrutinee, arm)));
      const lit = /^(?:vec!\s*)?\[\s*([^,\]]+)/.exec(e);
      if (lit) return evalRust(lit[1], f.bodyFrom + 1, depth + 1);
      if (!/^[a-z_]\w*$/i.test(e)) return [{ unknown: `first element of ${e}` }];
      // A local built as `vec![first, ..]` and pushed onto afterwards.
      const built = new RegExp(`\\blet\\s+(?:mut\\s+)?${e}\\b[^=;]*=\\s*vec!\\s*\\[\\s*([^,\\]]+)`).exec(body);
      if (built) return evalRust(built[1], f.bodyFrom + built.index, depth + 1);
      // Bound by `let Some(e) = .. else`: the first element of what the Option holds.
      const held = new RegExp(`\\blet\\s+Some\\(\\s*${e}\\s*\\)\\s*=\\s*`).exec(body);
      if (held) {
        const from = f.bodyFrom + held.index + held[0].length;
        return evalRust(`${source.slice(from, rustLetEnd(code, from)).trim().replace(/^&/, '')}[0]`, from, depth + 1);
      }
      const push = new RegExp(`\\b${e}\\.push\\(`).exec(body);
      if (!push || !new RegExp(`\\blet\\s+mut\\s+${e}\\b[^=;]*=\\s*Vec::`).test(body.slice(0, push.index))) return [{ unknown: `first element of ${e}` }];
      const open = f.bodyFrom + push.index + push[0].length - 1;
      const [first] = rustArgs(model, open);
      return first ? evalRust(first.text, open, depth + 1) : [{ unknown: `first element of ${e}` }];
    };
    const out = rustExits(model, f).map((e) => e.replace(/^[\s\S]*\}\s*([a-z_]\w*)$/i, '$1')).flatMap(firstOfExit).flatMap((v) => {
      if (v.param === undefined || v.fn !== f || v.path?.length) return [v];
      const pos = f.params.split(',').findIndex((p) => new RegExp(`^\\s*(?:mut\\s+)?${v.param}\\s*:`).test(p));
      if (args[pos] === undefined) return [{ unknown: `${f.name} argument ${v.param}` }];
      const arg = args[pos].trim().replace(/^&/, '');
      return evalRust(v.first ? `${arg}[0]` : arg, index, depth + 1);
    });
    return out.length ? out : [{ unknown: `first element of ${f.name}()` }];
  };
  // The elements of a list: an array or `vec!` literal, or the const or local bound to one.
  const rustElements = (list, index, depth) => {
    let text = list.trim();
    const d = /^[a-z_]\w*$/i.test(text) && new RegExp(`\\b(?:let\\s+(?:mut\\s+)?|const\\s+|static\\s+)${text}\\s*(?::[^=]*)?=\\s*`).exec(code);
    if (d) text = source.slice(d.index + d[0].length, rustLetEnd(code, d.index + d[0].length)).trim();
    const arr = /^(?:vec!\s*)?\[([\s\S]*)\]$/.exec(text);
    if (!arr) return [{ unknown: `elements of ${list}` }];
    return rustSplit(arr[1]).flatMap((item) => evalRust(item, index, depth + 1));
  };
  model.eval = evalRust;
  return model;
}

/** Whether brackets in `text` balance and never close more than they opened. */
function rustBalanced(text) {
  let d = 0;
  for (const ch of text) { if ('([{'.includes(ch)) d++; else if (')]}'.includes(ch) && --d < 0) return false; }
  return d === 0;
}

/** Top-level comma-separated parts of `text`. */
function rustSplit(text) {
  const parts = [];
  let d = 0;
  let s = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if ('([{'.includes(ch)) d++;
    else if (')]}'.includes(ch)) d--;
    else if (ch === ',' && d === 0) { parts.push(text.slice(s, i)); s = i + 1; }
  }
  parts.push(text.slice(s));
  return parts.map((p) => p.trim()).filter(Boolean);
}

/** Where the right side of `let PAT = expr` ends: its `;`, the `{` of `if let`/`while let`, or `else`. */
function rustLetEnd(code, from) {
  let d = 0;
  for (let i = from; i < code.length; i++) {
    const ch = code[i];
    if (d === 0 && (ch === ';' || ch === '{' || /^\selse\b/.test(code.slice(i, i + 6)))) return i;
    if ('([{'.includes(ch)) d++;
    else if (')]}'.includes(ch)) d--;
  }
  return code.length;
}

/** The arms of a `match scrutinee { pat => body, ... }` expression, or null. */
function rustMatchArms(expr) {
  const head = /^match\s+/.exec(expr);
  if (!head || !expr.endsWith('}')) return null;
  let open = -1;
  for (let i = head[0].length, d = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === '{' && d === 0) { open = i; break; }
    if ('([{'.includes(ch)) d++; else if (')]}'.includes(ch)) d--;
  }
  if (open < 0) return null;
  const inner = expr.slice(open + 1, -1);
  const arms = [];
  let i = 0;
  while (i < inner.length) {
    const arrow = inner.indexOf('=>', i);
    if (arrow < 0) break;
    const pattern = inner.slice(i, arrow).trim().replace(/^,/, '').trim();
    let j = arrow + 2;
    while (/\s/.test(inner[j] ?? '')) j++;
    let end = j;
    for (let d = 0; end < inner.length; end++) {
      const ch = inner[end];
      if ('([{'.includes(ch)) d++;
      else if (')]}'.includes(ch)) { d--; if (d === 0 && inner[j] === '{' && end > j) { end++; break; } }
      else if (ch === ',' && d === 0) break;
    }
    arms.push({ pattern, body: inner.slice(j, end).trim().replace(/^\{([\s\S]*)\}$/, '$1').trim() });
    i = end + 1;
  }
  arms.scrutinee = expr.slice(head[0].length, open).trim().replace(/^&/, '');
  return arms;
}

/** An arm's body with the name its `Some(name)` / `Ok(name)` pattern binds read as the scrutinee itself. */
function rustBindArm(pattern, scrutinee, body) {
  const bound = /^(?:Some|Ok)\(\s*(?:ref\s+)?([a-z_]\w*)\s*\)$/.exec(pattern);
  return bound ? body.replace(new RegExp(`\\b${bound[1]}\\b`, 'g'), `(${scrutinee})`) : body;
}

/** A function's result expressions: `return x;` and a tail expression, `Ok(..)`/`Some(..)` unwrapped. */
function rustExits(model, fn) {
  const body = model.source.slice(fn.bodyFrom + 1, fn.to);
  const exits = [...body.matchAll(/\breturn\s+([^;]+);/g)].map((m) => m[1]);
  // The tail expression, after any blocks that close before it.
  const tail = body.trim().split(/;\s*\n/).pop().trim().replace(/^(?:\}\s*)+/, '');
  if (tail && !tail.endsWith(';')) exits.push(tail);
  return exits.map((e) => e.trim().replace(/^(?:Ok|Some)\(([\s\S]*)\)$/, '$1'));
}

/** Top-level comma-separated parts of the bracketed text starting at `open`. */
function rustArgs(model, open) {
  const { code, source } = model;
  const parts = [];
  let d = 0;
  let s = open + 1;
  for (let e = open; e < code.length; e++) {
    const ch = code[e];
    if ('([{'.includes(ch)) d++;
    else if (')]}'.includes(ch)) { if (--d === 0) { if (source.slice(s, e).trim()) parts.push({ text: source.slice(s, e), at: s }); break; } }
    else if (ch === ',' && d === 1) { parts.push({ text: source.slice(s, e), at: s }); s = e + 1; }
  }
  return parts;
}

/** Non-test calls of `fn` across the Rust tree, with the argument at the parameter `param`. */
function rustCallers(ctx, model, fn, param) {
  const params = fn.params.split(',').map((p) => p.trim()).filter(Boolean);
  const selfParam = /^&?\s*(?:mut\s+)?self\b/.test(params[0] ?? '');
  const pos = params.findIndex((p) => new RegExp(`^(?:mut\\s+)?${param}\\s*:`).test(p));
  const out = [];
  // Visibility bounds the callers: private -> this file; pub(crate)/pub(super) -> this crate; pub -> this
  // crate and files that name the module (`borrow_vectors::run`) or, for a method, the impl's type.
  const vis = /\bpub(\s*\([^)]*\))?\s+(?:async\s+)?(?:unsafe\s+)?$/.exec(model.code.slice(Math.max(0, fn.from - 40), fn.from));
  const crate = (n) => n.replace(/\/src\/.*$/, '/src/');
  const stem = model.name.replace(/^.*\//, '').replace(/\.rs$/, '');
  const implType = model.impls.filter((i) => i.from <= fn.from && fn.to <= i.to).sort((a, b) => b.from - a.from)[0]?.type;
  const visible = (m, viaMethod) => m === model || (vis && crate(m.name) === crate(model.name))
    || (vis && !vis[1] && (viaMethod ? implType && new RegExp(`\\b${implType}\\b`).test(m.code) : new RegExp(`\\b${/^(lib|mod|main)$/.test(stem) ? '\\w+' : stem}::`).test(m.code)));
  for (const m of ctx.rust.values()) {
    if (m !== model && !new RegExp(`\\b${fn.name}\\b`).test(m.code)) continue;
    if (!visible(m, false) && !visible(m, true)) continue;
    for (const c of m.code.matchAll(new RegExp(`(\\.|::|\\b)${fn.name}\\s*\\(`, 'g'))) {
      if (m === model && c.index >= fn.from && c.index <= fn.bodyFrom) continue;
      if (/\bfn\s+$/.test(m.code.slice(Math.max(0, c.index - 8), c.index))) continue;
      if (m.inTest(c.index)) continue;
      // A path names this function by its module (also under a `use module as alias`) or its impl type.
      const q = c[1] === '::' ? /(\w+)::$/.exec(m.code.slice(Math.max(0, c.index - 40), c.index + 2)) : null;
      const named = q && (q[1] === stem || q[1] === implType || new RegExp(`\\buse\\s+(?:[\\w:]*::)?${stem}\\s+as\\s+${q[1]}\\s*;`).test(m.code));
      if (!visible(m, c[1] === '.' || (named && q[1] === implType))) continue;
      if ((c[1] === '.') !== selfParam) continue; // a method is called as `.name(`, a free function is not
      if (m !== model && c[1] !== '.' && !named && m.fns.some((f) => f.name === fn.name)) continue; // that file's own function of the name
      if (q && !named && !/^(self|super|crate|Self)$/.test(q[1])) continue;
      const args = rustArgs(m, c.index + c[0].length - 1);
      const at = selfParam && c[1] === '.' ? pos - 1 : pos;
      if (args[at]) out.push({ model: m, index: c.index, arg: args[at] });
    }
  }
  return out;
}

/**
 * A parameter of an N-API constructor (`#[napi(constructor)]` in an impl of `Type`) crosses from Node: it is
 * the argument at the same position of each `new <addon>.Type(...)` in the JavaScript payload, resolved
 * there. A JavaScript parameter continues through the JavaScript callers. Null when `fn` is no N-API
 * constructor.
 */
function napiCallers(ctx, model, value) {
  const fn = value.fn;
  if (!/#\[napi\(\s*constructor\s*\)\]\s*(?:#\[[^\]]*\]\s*)*(?:pub\s+)?$/.test(model.code.slice(Math.max(0, fn.from - 80), fn.from))) return null;
  const type = model.impls.filter((i) => i.from <= fn.from && fn.to <= i.to).sort((a, b) => b.from - a.from)[0]?.type;
  const pos = fn.params.split(',').map((p) => p.trim()).filter(Boolean).findIndex((p) => new RegExp(`^(?:mut\\s+)?${value.param}\\s*:`).test(p));
  if (!type || pos < 0) return null;
  const out = [];
  for (const file of ctx.js.values()) {
    for (const m of file.shape.matchAll(new RegExp(`\\bnew\\s+(?:[A-Za-z_$][\\w$]*\\.)*${type}\\s*\\(`, 'g'))) {
      const open = m.index + m[0].length - 1;
      const arg = splitArgs(file.shape, open).args[pos];
      if (!arg) continue;
      budget.steps = 0; budget.memo.clear(); budget.stack.length = 0;
      const line = lineOf(file.source, open);
      for (const v of file.evaluate(file.code.slice(arg.from, arg.to), open)) {
        const record = { path: file.name, line, spawn: `N-API ${type} -> ${model.name}:${lineOf(model.source, fn.from)}`, binary: describe(v) };
        if (v.param !== undefined) ctx.wrappers.push({ file, site: { open }, entry: { value: v }, record });
        else out.push({ value: v, at: { path: file.name, line } });
      }
    }
  }
  return out;
}

/** The type of `root` inside `fn`: its parameter's declared type, or the enclosing impl's for `self`. */
function rustRootType(model, fn, root) {
  if (root === 'self') return model.impls.filter((i) => i.from <= fn.from && fn.to <= i.to).sort((a, b) => b.from - a.from)[0]?.type ?? null;
  const p = new RegExp(`\\b${root}\\s*:\\s*&?\\s*(?:'\\w+\\s+)?(?:mut\\s+)?(?:[\\w]+::)*([A-Z]\\w*)`).exec(fn.params);
  return p?.[1] ?? null;
}

/** Field `key`'s type in `struct Type`. */
function rustFieldType(ctx, type, key) {
  for (const m of ctx.rust.values()) {
    const s = new RegExp(`\\bstruct\\s+${type}\\b[^{;]*\\{`).exec(m.code);
    if (!s) continue;
    const body = m.code.slice(s.index, m.code.indexOf('}', s.index));
    const f = new RegExp(`\\b${key}\\s*:\\s*(?:Option<)?(?:[\\w]+::)*([A-Z]\\w*)`).exec(body);
    if (f) return f[1];
  }
  return null;
}

/**
 * Possible binaries a parameter or a field of one carries, resolved where the function is called or the
 * type is built (non-test code only). Each result: {value, at: {path, line}}.
 */
function rustResolve(ctx, model, value, depth = 0) {
  const out = rustResolveOnce(ctx, model, value, depth);
  // The repository an argv names travels with the program it resolves to.
  return value.sandboxRepo ? out.map((r) => (r.value.sandboxRepo ? r : { ...r, value: { ...r.value, sandboxRepo: value.sandboxRepo } })) : out;
}

function rustResolveOnce(ctx, model, value, depth) {
  if (depth > 8) return [{ value: { unknown: 'argv data flow too deep' }, at: { path: model.name, line: lineOf(model.source, value.fn.from) } }];
  const out = [];
  const keep = (m, index, values) => {
    for (const v of values) {
      if (v.param !== undefined) out.push(...rustResolve(ctx, m, v, depth + 1));
      else out.push({ value: v, at: { path: m.name, line: lineOf(m.source, index) } });
    }
  };
  if (!value.path.length) {
    const callers = rustCallers(ctx, model, value.fn, value.param);
    // An N-API constructor is also called from Node: those callers count beside the Rust ones.
    const fromNode = napiCallers(ctx, model, value);
    if (fromNode) out.push(...fromNode);
    if (!callers.length && fromNode) return out;
    if (!callers.length) return [{ value: { uncalled: value.fn.name }, at: { path: model.name, line: lineOf(model.source, value.fn.from) } }];
    for (const c of callers) {
      const text = value.first ? `${c.arg.text.trim().replace(/^&/, '').replace(/(?:\.into_iter\(\)|\.map\(\s*Into::into\s*\)|\.collect(?:::<[^>]*>)?\(\)|\.to_vec\(\)|\.clone\(\))+$/, '')}[0]` : c.arg.text;
      const lit = value.first && /^\s*&?\s*(?:vec!\s*)?\[\s*([^,\]]+)/.exec(c.arg.text);
      keep(c.model, c.index, c.model.eval(lit ? lit[1] : text, c.arg.at));
    }
    return out;
  }
  // Walk the field chain to the struct and field that finally holds the binary.
  let type = value.type ?? rustRootType(model, value.fn, value.param);
  let keys = [...value.path];
  while (type && keys.length) {
    const key = keys.shift();
    if (key.endsWith('()')) {
      // A method: its result, read as fields of the same type.
      const name = key.slice(0, -2);
      let next = null;
      for (const m of ctx.rust.values()) {
        for (const impl of m.impls.filter((i) => i.type === type)) {
          const f = m.fns.find((x) => x.name === name && impl.from <= x.from && x.to <= impl.to);
          if (!f) continue;
          for (const e of rustExits(m, f)) {
            const branch = /^if\b[^{]*\{\s*([\s\S]*?)\s*\}\s*else\s*\{\s*([\s\S]*?)\s*\}$/.exec(e);
            for (const x of branch ? [branch[1], branch[2]] : [e]) {
              // The first element of a method's `vec![..]` result is its first item.
              const item = value.first && !keys.length && /^(?:vec!\s*)?\[\s*([^,\]]+)/.exec(x.trim());
              const v = m.eval(item ? item[1] : x, f.bodyFrom + 1);
              for (const r of v) {
                if (r.param === 'self' && r.path.length) next = { model: m, value: { ...r, path: [...r.path, ...keys], first: item ? false : value.first } };
                else keep(m, f.bodyFrom, [r]);
              }
            }
          }
        }
      }
      if (!next) return out;
      out.push(...rustResolve(ctx, next.model, next.value, depth + 1));
      return out;
    }
    if (!keys.length || keys[0].endsWith('()')) {
      if (keys.length) { type = rustFieldType(ctx, type, key) ?? type; continue; }
      out.push(...rustConstructions(ctx, type, key, value.first, depth));
      return out;
    }
    type = rustFieldType(ctx, type, key);
  }
  if (!type) out.push({ value: { unknown: `field ${value.param}.${value.path.join('.')} of an unknown type` }, at: { path: model.name, line: lineOf(model.source, value.fn.from) } });
  return out;
}

/** Every non-test value of `Type { key: ... }` (or `Self { ... }` inside its impl); deserialised types are configuration. */
function rustConstructions(ctx, type, key, first, depth) {
  const out = [];
  let derives = false;
  for (const m of ctx.rust.values()) {
    const def = new RegExp(`#\\[derive\\(([^)]*)\\)\\]\\s*(?:#\\[[^\\]]*\\]\\s*)*(?:pub(?:\\([^)]*\\))?\\s+)?struct\\s+${type}\\b`).exec(m.code);
    if (def && /Deserialize/.test(def[1])) derives = true;
    const selfSpans = m.impls.filter((i) => i.type === type);
    if (/^\d+$/.test(key)) {
      // A tuple struct: `Type(a, b)` (any module path before it), or `Type` passed as its constructor
      // function (`.map(Type)`), whose field 0 is what the receiver holds.
      for (const lit of m.code.matchAll(new RegExp(`(?<![\\w])(?:\\w+::)*(${type}|Self)\\s*\\(`, 'g'))) {
        if (lit[1] === 'Self' && !selfSpans.some((i) => i.from <= lit.index && lit.index <= i.to)) continue;
        if (/\b(?:struct|enum|impl|for|trait|fn)\s+(?:<[^>]*>\s*)?(?:\w+::)*$/.test(m.code.slice(Math.max(0, lit.index - 30), lit.index)) || m.inTest(lit.index)) continue;
        const part = rustArgs(m, lit.index + lit[0].length - 1)[Number(key)];
        if (!part) continue;
        for (const v of m.eval(first ? `${part.text.trim()}[0]` : part.text, part.at)) {
          if (v.param !== undefined) out.push(...rustResolve(ctx, m, v, depth + 1));
          else out.push({ value: v, at: { path: m.name, line: lineOf(m.source, lit.index) } });
        }
      }
      for (const ctor of m.code.matchAll(new RegExp(`([\\s\\S]{0,200}?)\\.\\s*map\\(\\s*(?:\\w+::)*${type}\\s*\\)`, 'g'))) {
        if (key !== '0' || m.inTest(ctor.index)) continue;
        const receiver = /([A-Za-z_][\w:]*(?:\([^()]*\))?(?:\s*\.\s*\w+\([^()]*\))*)\s*$/.exec(m.source.slice(ctor.index, ctor.index + ctor[1].length))?.[1];
        for (const v of receiver ? m.eval(receiver, ctor.index + ctor[1].length) : [{ unknown: `${type} built from an unknown value` }]) {
          if (v.param !== undefined) out.push(...rustResolve(ctx, m, v, depth + 1));
          else out.push({ value: v, at: { path: m.name, line: lineOf(m.source, ctor.index + ctor[1].length) } });
        }
      }
      continue;
    }
    for (const lit of m.code.matchAll(new RegExp(`(?<![\\w:])(${type}|Self)\\s*\\{`, 'g'))) {
      if (lit[1] === 'Self' && !selfSpans.some((i) => i.from <= lit.index && lit.index <= i.to)) continue;
      if (/\b(?:struct|enum|impl|for|trait)\s+(?:<[^>]*>\s*)?$/.test(m.code.slice(Math.max(0, lit.index - 20), lit.index))) continue;
      if (m.inTest(lit.index)) continue;
      const parts = rustArgs(m, lit.index + lit[0].length - 1);
      const part = parts.find((p) => new RegExp(`^\\s*${key}\\s*(?::|$)`).test(p.text));
      if (!part) { if (parts.some((p) => /^\s*\.\./.test(p.text))) out.push({ value: { unknown: `${type} {..} update syntax` }, at: { path: m.name, line: lineOf(m.source, lit.index) } }); continue; }
      let text = part.text.includes(':') ? part.text.slice(part.text.indexOf(':') + 1) : key;
      if (first) {
        const v = /^\s*(?:vec!\s*)?\[\s*([^,\]]+)/.exec(text);
        text = v ? v[1] : `${text.trim().replace(/(?:\.into_iter\(\)|\.map\(\s*Into::into\s*\)|\.collect(?:::<[^>]*>)?\(\)|\.to_vec\(\)|\.clone\(\))+$/, '')}[0]`;
      }
      for (const v of m.eval(text, part.at)) {
        if (v.param !== undefined) out.push(...rustResolve(ctx, m, v, depth + 1));
        else out.push({ value: v, at: { path: m.name, line: lineOf(m.source, lit.index) } });
      }
    }
  }
  if (derives) out.push({ value: { external: `deserialized configuration (${type}.${key})` }, at: null });
  if (!out.length) out.push({ value: { unknown: `no construction of ${type}.${key} found` }, at: null });
  return out;
}

/** Whether the repository expression `text` (evaluated in `fn`) is always a directory under `temp_dir()`. */
function rustTempRepo(ctx, model, fn, text, depth = 0) {
  if (depth > 6 || !fn) return false;
  let expr = text.trim().replace(/^&/, '').replace(/(?:\.join\([^()]*\)|\.as_path\(\)|\.to_path_buf\(\)|\.to_string_lossy\(\)|\.into_owned\(\))+$/, '').trim();
  if (/\btemp_dir\(\)/.test(expr)) return true;
  // `self.field`: every non-test construction of the impl's type sets it to a temp repository.
  const own = /^self\s*\.\s*([a-z_]\w*)$/.exec(expr);
  if (own) {
    const type = rustRootType(model, fn, 'self');
    const built = [];
    for (const m of ctx.rust.values()) {
      for (const lit of m.code.matchAll(new RegExp(`(?<![\\w:])${type}\\s*\\{`, 'g'))) {
        if (m.inTest(lit.index) || /\b(?:struct|impl|for)\s+(?:<[^>]*>\s*)?$/.test(m.code.slice(Math.max(0, lit.index - 20), lit.index))) continue;
        const part = rustArgs(m, lit.index + lit[0].length - 1).find((p) => new RegExp(`^\\s*${own[1]}\\s*(?::|$)`).test(p.text));
        if (part) built.push({ m, fn: m.within(lit.index), text: part.text.includes(':') ? part.text.slice(part.text.indexOf(':') + 1) : own[1] });
      }
    }
    return built.length > 0 && built.every((b) => rustTempRepo(ctx, b.m, b.fn, b.text, depth + 1));
  }
  if (!/^[a-z_]\w*$/i.test(expr)) return false;
  if (new RegExp(`\\b${expr}\\s*:`).test(fn.params)) {
    const callers = rustCallers(ctx, model, fn, expr);
    return callers.length > 0 && callers.every((c) => rustTempRepo(ctx, c.model, c.model.within(c.index), c.arg.text, depth + 1));
  }
  const decl = new RegExp(`\\blet\\s+(?:mut\\s+)?${expr}\\b[^=;]*=\\s*([^;]+);`).exec(model.code.slice(fn.bodyFrom, fn.to));
  if (!decl) return false;
  const init = model.source.slice(fn.bodyFrom + decl.index + decl[0].indexOf(decl[1]), fn.bodyFrom + decl.index + decl[0].length - 1);
  return rustTempRepo(ctx, model, fn, init.replace(/\.map_err\([\s\S]*\)\??$/, '').replace(/\?$/, ''), depth + 1);
}

function scanRust(model, ctx) {
  const { name, source, code, within } = model;
  const aliases = ['Command', ...[...code.matchAll(/\bCommand\s+as\s+([A-Za-z_]\w*)/g)].map((m) => m[1])];
  for (const m of code.matchAll(new RegExp(`(?<![\\w])(?:\\w+::)*(?:${aliases.join('|')})::new\\s*\\(`, 'g'))) {
    const open = m.index + m[0].length - 1;
    let depth = 0;
    let close = open;
    for (; close < code.length; close++) { if (code[close] === '(') depth++; else if (code[close] === ')' && --depth === 0) break; }
    const expr = source.slice(open + 1, close);
    const line = lineOf(source, m.index);
    const inTest = model.inTest(m.index);
    const fn = within(m.index);
    const tail = source.slice(close, close + 400);
    const repo = /\.arg\(\s*"-C"\s*\)\s*\.arg\(\s*([^()]+?)\s*\)/.exec(tail)?.[1] ?? /\.current_dir\(\s*([^()]+?)\s*\)/.exec(tail)?.[1];
    for (const value of model.eval(expr, m.index)) {
      const record = { path: name, line, spawn: 'Command::new', binary: describe(value.param !== undefined ? { unknown: `${value.param}${value.path.length ? `.${value.path.join('.')}` : ''} of ${value.fn.name}` } : value) };
      if (inTest) {
        // Test code is reported apart, and only where it can run Git (a fixed other program is not listed).
        if (binaryClass(value) !== 'other') ctx.classes.push({ ...record, class: 'rust-test' });
        continue;
      }
      let resolved = [{ value, at: { path: name, line } }];
      let runner = false;
      if (value.param !== undefined) { resolved = rustResolve(ctx, model, value); runner = true; }
      for (const { value: v, at } of resolved) {
        let cls = v.uncalled ? 'uncalled' : binaryClass(v);
        if (cls === 'shell' && !/\.arg\(\s*"-l?c"\s*\)|\.args\(\s*\[\s*"-l?c"/.test(tail)) cls = 'other';
        if (cls === 'shell') {
          // The script operand after `-c`: `.arg("-c").arg("...")` or `.args(["-c", "..."])`.
          const script = /"-l?c"\s*\)\s*\.arg\(\s*"((?:\\.|[^"\\])*)"|"-l?c"\s*,\s*"((?:\\.|[^"\\])*)"/.exec(tail);
          cls = script ? (shellRunsGit(script[1] ?? script[2]) ? 'git' : 'other') : shellRunsGit(tail) ? 'git' : 'unknown';
          if (cls === 'other') continue;
        }
        const where = at ?? { path: name, line };
        const site = { ...record, path: where.path, line: where.line, ...(runner ? { spawn: `${record.spawn} <- ${name}:${line}` } : {}), binary: v.uncalled ? `(uncalled ${v.uncalled})` : describe(v) };
        if (cls === 'other') { if (runner) ctx.classes.push({ ...record, class: 'argv-runner', resolvedAt: `${where.path}:${where.line}`, binary: describe(v) }); continue; }
        if (cls === 'external') { ctx.classes.push({ ...site, class: 'configured-binary' }); continue; }
        if (cls === 'uncalled') { ctx.classes.push({ ...site, class: 'uncalled-wrapper' }); continue; }
        if (/^packages\/git\/rust\/src\//.test(where.path) && (cls === 'git' || (runner && cls !== 'hook'))) { ctx.classes.push({ ...site, class: 'git-driver' }); continue; }
        if (cls === 'git' && repo && fn && rustTempRepo(ctx, model, fn, repo)) {
          ctx.classes.push({ ...record, class: 'production-sandbox-probe', function: fn.name, repository: repo.trim() }); continue;
        }
        // A program reached through an argv runner whose argv names its repository (`[git, "-C", repo]`):
        // the same probe when that repository is a temp directory the probe creates.
        const named = v.sandboxRepo;
        if (cls === 'git' && named && rustTempRepo(ctx, named.model, named.fn, named.text)) {
          ctx.classes.push({ ...site, class: 'production-sandbox-probe', function: named.fn?.name, repository: named.text.trim() }); continue;
        }
        ctx.raw.push({ ...site, family: cls === 'unknown' || cls === 'param' ? 'unresolved-binary' : cls === 'hook' ? 'hook-spawn' : 'rust' });
      }
    }
  }
}

// ---------- shell and skill text ----------

// Commands that never run their operands: a quoted operand of one is text, not a command. A script
// function counts when every command of its body that reads its arguments is one of these (`die`).
const DATA_COMMANDS = new Set(['echo', 'printf', ':']);

function shellDataFunctions(source) {
  const fns = new Set();
  for (const m of source.matchAll(/^\s*([\w-]+)\s*\(\)\s*\{(.*)\}\s*$/gm)) {
    const users = m[2].split(/;|&&|\|\|/).map((c) => c.trim()).filter((c) => /\$[*@1-9]|\$\{[*@1-9]/.test(c));
    if (users.length && users.every((c) => DATA_COMMANDS.has(c.split(/\s+/)[0]))) fns.add(m[1]);
  }
  return fns;
}

/** The line with every quoted operand of a data command blanked, keeping `$(...)` and backtick
 * substitutions inside double quotes: those still run. An operand whose output is piped into a shell
 * stays a script. */
function shellCodeOf(line, dataCommands) {
  let out = '';
  for (let i = 0; i < line.length;) {
    const q = line[i];
    if ((q !== '"' && q !== "'") || line[i - 1] === '\\') { out += q; i += 1; continue; }
    let end = i + 1;
    while (end < line.length && !(line[end] === q && (q === "'" || line[end - 1] !== '\\'))) end += 1;
    const inner = line.slice(i + 1, end);
    const word = out.split(/;|&&|\|\||\||\(|\{|`|\b(?:then|do|else)\b/).pop().trim().replace(/^(?:\w+=\S*\s+)*/, '').split(/\s+/)[0];
    if (!dataCommands.has(word)) out += q + inner + q;
    else if (/\|\s*(?:\S*\/)?(?:sh|bash|zsh|dash)\b/.test(line.slice(end + 1))) out += ` ; ${inner} ; `; // text piped into a shell is a script
    else {
      const subs = q === '"' ? [...inner.matchAll(/\$\((?:[^()]|\([^()]*\))*\)|`[^`]*`/g)].map((m) => m[0]) : [];
      out += `${q}${subs.join(' ; ')}${q}`;
    }
    i = end + 1;
  }
  return out;
}

function scanShell(name, source, ctx) {
  const dataCommands = new Set([...DATA_COMMANDS, ...shellDataFunctions(source)]);
  source.split('\n').forEach((text, i) => {
    const line = shellCodeOf(text.replace(/(^|\s)#.*$/, ''), dataCommands);
    if (!shellRunsGit(line)) return;
    const record = { path: name, line: i + 1, spawn: 'shell', binary: line.trim().slice(0, 80) };
    // A hook line reads only when every git command on it is a read verb in its read form.
    const commands = [...line.matchAll(/(?:^|[;&|(`]|\$\()\s*(?:\S*\/)?git\s+([^;&|)`]*)/g)].map((m) => hookVerb(m[1].trim().split(/\s+/).map((w) => w.replace(/^["']|["']$/g, ''))));
    if (name.startsWith(`${HOOKS_DIR}/`) && commands.length && commands.every((verb) => READ_VERBS.has(verb))) { ctx.classes.push({ ...record, class: 'hook-read-context', verbs: commands }); return; }
    ctx.raw.push({ ...record, family: 'shell' });
  });
}

function scanSkill(name, source, ctx) {
  source.split('\n').forEach((text, i) => {
    for (const span of [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1]).concat(/^\s{4,}|^\s*\$ /.test(text) ? [text] : [])) {
      if (!WRITE_VERBS.test(span)) continue;
      if (PROHIBITION.test(text)) continue;
      ctx.raw.push({ path: name, line: i + 1, spawn: 'skill text', binary: span.slice(0, 80), family: 'skill' });
    }
  });
}

// ---------- driver ----------

// Shipped with scripts/, so verifyCensus binds this input just like the other Node payload files.
export const GIT_DECLARATIONS_PATH = 'scripts/lib/git-one-door-declarations.v1.json';

/** Comment-blanked call text, without preceding lines or offsets. */
function declarationCallText(file, open) {
  let start = open;
  while (/\s/.test(file.shape[start - 1] ?? '')) start--;
  let depth = 0;
  let i = start - 1;
  for (; i >= 0; i--) {
    const c = file.shape[i];
    if (')]}'.includes(c)) { depth++; continue; }
    if (depth) { if ('([{'.includes(c)) depth--; continue; }
    if (/[\w$.]/.test(c) || (c === '?' && file.shape[i + 1] === '.')) continue;
    // Whitespace around member/index/call syntax belongs to the callee, not `return`/`await`.
    if (/\s/.test(c) && (/\.$/.test(file.shape.slice(0, i).trimEnd())
      || /^[.(\[]/.test(file.shape.slice(i + 1, start).trimStart()))) continue;
    break;
  }
  return file.code.slice(i + 1, start).trim() + file.code.slice(open, splitArgs(file.shape, open).close + 1);
}

/** A literal argv verb, preserving unknown operands rather than mistaking their string fragments
 * for a verb. Spreads are unresolved: they can insert options or a verb, including write forms. */
function declarationVerb(argv) {
  const text = argv.trim();
  const shape = lexSource(text).shape;
  if (!text.startsWith('[') || splitArgs(shape, 0).close !== text.length - 1) return undefined;
  const items = splitArgs(shape, 0).args.map(({ from, to }) => text.slice(from, to).trim());
  if (items.some(item => item.startsWith('...'))) return undefined;
  const words = items.map(item => /^(['"])((?:\\.|(?!\1).)*)\1$/s.exec(item)?.[2]);
  let i = 0;
  for (; i < words.length;) {
    if (/^(-C|-c|--git-dir|--work-tree)$/.test(words[i] ?? '')) { i += 2; continue; }
    if (/^(?:--(?:no-replace-objects|no-optional-locks|bare|literal-pathspecs)|--(?:git-dir|work-tree)=.+)$/.test(words[i] ?? '')) { i++; continue; }
    break;
  }
  if (!words[i] || words[i].startsWith('-')) return undefined;
  return hookVerb(words.slice(i).map(word => word ?? '__operand__'));
}

/** A pass-through site's identity also binds the sorted call digests of its wrapper. Reuse both
 * caller resolvers: a callback handed under a key, or an anonymous local, is not called by name. */
function declaredSiteId(ctx, file, site) {
  const owner = enclosing(file.spans, site.open);
  let fn = owner;
  while (fn && !fn.name) fn = enclosing(file.spans, fn.from - 1);
  const call = declarationCallText(file, site.open);
  const { args } = splitArgs(file.shape, site.open);
  const argv = args[1] ? file.code.slice(args[1].from, args[1].to) : '';
  const verb = declarationVerb(argv);
  if (verb) return { siteId: `${fn?.name ?? '<module>'}:${sha256(call)}`, callerVerbs: [verb] };
  const flow = owner ? valueFlowCalls(ctx, file, owner) : { calls: [], escapes: [] };
  const callers = owner ? dedupeCalls([
    ...(owner.name ? callersOf(ctx, file, owner.name) : []),
    ...flow.calls,
  ]) : [];
  const callerDigests = callers.map(c => sha256(`${c.file.name}\0${declarationCallText(c.file, c.open)}`)).sort();
  budget.steps = 0; budget.memo.clear(); budget.stack.length = 0;
  const parameters = argv ? file.elements(argv, site.open, 0).filter(v => v.param !== undefined) : [];
  const callerVerbs = callers.flatMap(c => {
    const { args: supplied } = splitArgs(c.file.shape, c.open);
    return parameters.map(v => {
      const arg = supplied[v.index];
      return arg ? declarationVerb(c.file.code.slice(arg.from, arg.to)) : undefined;
    });
  });
  return { siteId: `${fn?.name ?? '<module>'}:${sha256(JSON.stringify([call, callerDigests]))}`, callerDigests, callerVerbs, escapes: flow.escapes };
}

/** Owner declarations classify raw sites only; stale/ambiguous inputs never yield a green census. */
function applyDeclarations(root, sites, classes, digests, observedVerbs) {
  let bytes;
  try { bytes = fs.readFileSync(path.join(root, GIT_DECLARATIONS_PATH), 'utf8'); }
  catch (err) { if (err.code === 'ENOENT') return sites; throw err; }
  const invalid = (detail) => { throw new Error(`invalid Git declaration: ${detail}`); };
  let doc;
  try { doc = JSON.parse(bytes); } catch { invalid('unreadable JSON'); }
  if (doc?.schema !== 'git-one-door-declarations.v1' || !Array.isArray(doc.declarations)) invalid('expected git-one-door-declarations.v1');
  digests[GIT_DECLARATIONS_PATH] = sha256(bytes);
  const declared = new Set();
  const matched = new Set();
  const text = (v) => typeof v === 'string' && v.trim().length > 0;
  for (const entry of doc.declarations) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)
      || Object.keys(entry).some(k => !['path', 'siteId', 'class', 'reason', 'retireWhen', 'verbs'].includes(k))
      || !text(entry.path) || path.posix.normalize(entry.path) !== entry.path
      || /[\\\\*?\[\]{}:\x00]/.test(entry.path) || path.posix.isAbsolute(entry.path) || entry.path.split('/').some(p => p === '..' || p === '.')
      || !/^(?:[A-Za-z_$][\w$]*|<module>):[a-f0-9]{64}$/.test(entry.siteId)
      || !text(entry.reason) || !text(entry.retireWhen)
      || !['hook-read-context', 'configured-binary', 'declared-tooling-exemption'].includes(entry.class)) invalid('expected exact path, siteId, supported class, reason and retireWhen');
    const key = `${entry.path}\0${entry.siteId}`;
    if (declared.has(key)) invalid(`duplicate ${entry.path} ${entry.siteId}`);
    declared.add(key);
    const found = sites.filter(s => s.path === entry.path && s.siteId === entry.siteId);
    if (found.length !== 1) throw new Error(`stale or ambiguous Git declaration: ${entry.path} ${entry.siteId} matched ${found.length} sites`);
    const [site] = found;
    const { escapes = [] } = site;
    if (escapes.length && entry.class !== 'configured-binary') invalid(`wrapper escapes for ${entry.path}: ${escapes[0]}`);
    const verbs = observedVerbs.get(site);
    if (entry.class === 'hook-read-context') {
      if (!entry.path.startsWith(`${HOOKS_DIR}/`) || site.binary !== 'git'
        || !Array.isArray(entry.verbs) || !entry.verbs.length || !entry.verbs.every(v => READ_VERBS.has(v))
        || !verbs?.length || verbs.some(v => !v || !entry.verbs.includes(v))
        || entry.verbs.some(v => !verbs.includes(v))) invalid(`hook read verbs for ${entry.path}: declared verbs must equal literal caller verbs`);
    } else if (entry.verbs !== undefined) invalid(`verbs on non-hook ${entry.path}`);
    if (entry.class === 'configured-binary' && site.family !== 'unresolved-binary') invalid(`fixed program is not configured data: ${entry.path}`);
    classes.push({ ...site, ...entry });
    matched.add(site);
  }
  return sites.filter(s => !matched.has(s));
}

export function scan({ root = REPO, files, openInspect } = {}) {
  const ctx = { js: new Map(), rust: new Map(), raw: [], wrappers: [], classes: [], markers: [] };
  // Outside the declared product, files are counted per top-level directory, never parsed.
  const outsideProduct = {};
  let list = files;
  if (!list) {
    const product = declaredProduct(root);
    list = [];
    for (const name of listFiles(root, openInspect)) {
      if (!product || product(name)) list.push(path.join(root, name));
      else outsideProduct[name.split('/')[0]] = (outsideProduct[name.split('/')[0]] ?? 0) + 1;
    }
  }
  const digests = {};
  for (const full of list) {
    const name = rel(root, full);
    if (!JS_EXT.has(path.extname(name)) || name === 'scripts/git-one-door-scan.mjs') continue;
    try { ctx.js.set(name, new JsFile(name, fs.readFileSync(full, 'utf8'), ctx)); } catch { /* unreadable: skipped below too */ }
  }
  for (const full of list) {
    const name = rel(root, full);
    if (path.extname(name) !== '.rs') continue;
    try { const m = rustModel(name, fs.readFileSync(full, 'utf8')); m.ctx = ctx; ctx.rust.set(name, m); } catch { /* unreadable: skipped below too */ }
  }
  for (const full of list) {
    const name = rel(root, full);
    if (name === 'scripts/git-one-door-scan.mjs') continue;
    let source;
    try { source = fs.readFileSync(full, 'utf8'); } catch { continue; }
    const kind = kindOf(name, source);
    if (!kind) continue;
    digests[name] = sha256(source);
    if (kind === 'js') scanJs(name, source, ctx);
    else if (kind === 'rust') scanRust(ctx.rust.get(name) ?? rustModel(name, source), ctx);
    else if (kind === 'shell') scanShell(name, source, ctx);
    else if (kind === 'skill') scanSkill(name, source, ctx);
  }
  resolveWrappers(ctx);
  countGitCallers(ctx);
  // The sandbox door: its spawn carries the marker. A marker anywhere else is a site of its own.
  const doors = new Set();
  for (const mk of ctx.markers) {
    const file = ctx.js.get(mk.path);
    const own = file && ctx.raw.some((s) => s.path === mk.path);
    if (own) doors.add(mk.path); else ctx.raw.push({ path: mk.path, line: mk.line, spawn: 'sandbox marker', binary: 'marker outside the sandbox door', family: 'sandbox-marker' });
  }
  const sites = [];
  const observedVerbs = new Map();
  for (const s of ctx.raw) {
    const { file, site, enclosing: _e, ...record } = s;
    const skill = standaloneSkillOf(path.join(root, record.path), root);
    if (skill) { ctx.classes.push({ ...record, class: STANDALONE_SKILL_CLASS, skill }); continue; }
    if (doors.has(record.path) && file && /\[\s*SANDBOX_DOOR\s*\]/.test(file.code.slice(site.open, splitArgs(file.shape, site.open).close))) {
      ctx.classes.push({ ...record, class: 'sandbox-door' }); continue;
    }
    if (record.path.startsWith(`${HOOKS_DIR}/`) && file && record.family === 'spawn') {
      const callers = s.callers ?? [];
      const own = firstVerbs(file, site.open);
      const verbs = own ? [own] : callers.map((c) => {
        const [p, l] = c.split(/:(?=\d+$)/);
        const line = ctx.js.get(p).source.split('\n')[Number(l) - 1] ?? '';
        const argv = /\[([^\]]*)\]/.exec(line)?.[1] ?? '';
        const lits = [...argv.matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
        return lits.length ? hookVerb(lits) : undefined;
      });
      if (verbs.every((v) => v && READ_VERBS.has(v))) { ctx.classes.push({ ...record, class: 'hook-read-context', verbs }); continue; }
    }
    if (file && site) {
      const { callerVerbs, ...identity } = declaredSiteId(ctx, file, site);
      const identified = { ...record, ...identity };
      observedVerbs.set(identified, callerVerbs);
      sites.push(identified);
    } else sites.push(record);
  }
  const key = (s) => `${s.path}:${String(s.line).padStart(6, '0')}:${s.binary}`;
  const unique = (list) => [...new Map(list.map((s) => [key(s), s])).values()].sort((a, b) => key(a).localeCompare(key(b)));
  const finalSites = unique(applyDeclarations(root, sites, ctx.classes, digests, observedVerbs));
  const classes = unique(ctx.classes);
  const families = {};
  for (const s of finalSites) families[s.family] = (families[s.family] ?? 0) + 1;
  const classCounts = {};
  for (const c of classes) classCounts[c.class] = (classCounts[c.class] ?? 0) + 1;
  return { sites: finalSites, families, classes, classCounts, files: digests, outsideProduct };
}

/** The census written by the build: zero sites expected; the digest binds it to the scanned payload. It records the product only: counts of files outside it change with every plan or report and are printed by the scan, never persisted. */
export function census(result) {
  const payloadDigest = sha256(JSON.stringify(Object.entries(result.files).sort(([a], [b]) => a.localeCompare(b))));
  return { schema: 'mutation-census.v1', payloadDigest, files: result.files, sites: result.sites, classes: result.classes };
}

export function censusDigestMatches(doc) {
  return doc && doc.schema === 'mutation-census.v1'
    && doc.payloadDigest === sha256(JSON.stringify(Object.entries(doc.files ?? {}).sort(([a], [b]) => a.localeCompare(b))));
}

export const MUTATION_CENSUS_PATH = 'packages/git/contracts/mutation-census.v1.json';

/** Regenerates `root`'s mutation census (the release build calls this before staging its sources). */
export function writeMutationCensus(root, result = scan({ root })) {
  const target = path.join(root, MUTATION_CENSUS_PATH);
  const bytes = `${JSON.stringify(census(result), null, 2)}\n`;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (fs.existsSync(target) && fs.readFileSync(target, 'utf8') === bytes) return target;
  fs.writeFileSync(`${target}.${process.pid}.tmp`, bytes);
  fs.renameSync(`${target}.${process.pid}.tmp`, target);
  return target;
}

/**
 * The scan-free drift check for commit time: the staged paths whose census digest a regenerated census
 * would change. `changes` maps a staged path to its staged source (null when deleted). It judges the same
 * files the scan digests (declared product, scannable kind), so a clean answer means the census still
 * matches every staged file; a change to the product declaration itself is left to the full scan.
 */
export function censusDrift(doc, root, changes) {
  if (!censusDigestMatches(doc)) return [MUTATION_CENSUS_PATH];
  const product = declaredProduct(root);
  const drift = [];
  for (const [name, source] of changes) {
    if (name === 'scripts/git-one-door-scan.mjs' || (product && !product(name))) continue;
    // The declarations file is a recorded scan input (not code), so it is judged by digest like the sources it declares.
    const digest = source !== null && (kindOf(name, source) || name === GIT_DECLARATIONS_PATH) ? sha256(source) : undefined;
    if (doc.files[name] !== digest) drift.push(name);
  }
  return drift;
}

// The Node payload a release ships whole; Rust sources are compiled in, so they are not on disk there.
const NODE_PAYLOAD = /^(src|bin|scripts|core)\//;

/** The `git-mutation-one-door` verdict for a census and the payload it was built from. */
export function verifyCensus(doc, payloadRoot) {
  if (!censusDigestMatches(doc)) return { passed: false, message: 'mutation census missing, unreadable or its digest does not match its own file list; rebuild the release' };
  const drift = [];
  for (const [name, digest] of Object.entries(doc.files)) {
    if (!NODE_PAYLOAD.test(name)) continue;
    let bytes;
    try { bytes = fs.readFileSync(path.join(payloadRoot, name), 'utf8'); } catch { drift.push(`${name} (missing)`); continue; }
    if (sha256(bytes) !== digest) drift.push(name);
  }
  if (drift.length) return { passed: false, message: `mutation census was not built from this payload: ${drift.slice(0, 5).join(', ')}${drift.length > 5 ? ` and ${drift.length - 5} more` : ''}` };
  const sites = doc.sites ?? [];
  if (sites.length) return { passed: false, message: `${sites.length} Git spawn site(s) outside the fgos-git driver: ${sites.slice(0, 5).map((s) => `${s.path}:${s.line} (${s.family})`).join(', ')}${sites.length > 5 ? ', ...' : ''}` };
  return { passed: true, message: `no Git writer outside the fgos-git driver (${Object.keys(doc.files).length} files scanned, payload digest ${doc.payloadDigest.slice(0, 12)})` };
}

async function main(argv) {
  const opt = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : undefined; };
  const root = path.resolve(opt('--root') ?? REPO);
  // Run as a plain script, the checkout's own addon is staged before Inspect lists the files.
  const { inspectRepo } = await import('./lib/git-ports.mjs');
  const result = scan({ root, openInspect: () => inspectRepo(root) });
  if (argv.includes('--write-census')) writeMutationCensus(root, result);
  if (argv.includes('--json')) process.stdout.write(`${JSON.stringify({ sites: result.sites, families: result.families, classCounts: result.classCounts, classes: result.classes, outsideProduct: result.outsideProduct }, null, 2)}\n`);
  else {
    for (const s of result.sites) process.stdout.write(`${s.family}\t${s.path}:${s.line}\t${s.spawn}\t${s.binary}${s.callers ? `\t(${s.callers.length} callers)` : ''}\n`);
    process.stdout.write(`${result.sites.length} undeclared site(s) ${JSON.stringify(result.families)}; classes ${JSON.stringify(result.classCounts)}; outside the declared product ${JSON.stringify(result.outsideProduct)}\n`);
  }
  return result.sites.length === 0 ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // Not a top-level await: main's import of the script addon door imports this module back.
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}
