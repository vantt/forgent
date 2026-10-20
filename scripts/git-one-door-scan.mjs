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
// Named classes (spec §13) are reported apart from product sites and never by path alone:
//   - git-driver: Command::new inside fgos-git's own crate source, the one door;
//   - sandbox-door: the shared sandbox door (scripts/lib/sandbox-git.mjs), recognised because its
//     spawn carries the sandbox marker `Symbol.for('fgos.git.sandbox-door')`; using the marker anywhere
//     else is itself a site;
//   - production-sandbox-probe: a Rust Git spawn whose repository the same function creates under
//     `temp_dir()`;
//   - hook-read-context: a read-verb Git spawn inside a shipped hook (`.githooks/`);
//   - rust-test: Rust code under `tests/` or `#[cfg(test)]`.
//
// Usage: node scripts/git-one-door-scan.mjs [--json] [--root <dir>] [--write-census]
// The release build writes the census (packages/git/contracts/mutation-census.v1.json); doctor's
// `git-mutation-one-door` reads it back through verifyCensus.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lexSource } from './lib/js-source-lexer.mjs';
import { shellRunsGit } from './lib/git-spawn-match.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SCAN_ROOTS = ['src', 'bin', 'scripts', 'packages', 'apps', '.githooks', 'core/skills'];
const SKIP_DIRS = new Set(['node_modules', 'target', '.git', 'dist', 'fixtures']);
const JS_EXT = new Set(['.mjs', '.js', '.cjs']);
const SPAWN_FNS = ['execFileSync', 'execFile', 'spawnSync', 'spawn', 'execSync', 'exec'];
const SHELL_FNS = new Set(['execSync', 'exec']);
const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash', 'cmd', 'cmd.exe', 'powershell', 'pwsh']);
const PASSTHROUGH = new Set(['env', 'nice', 'timeout', 'xargs', 'sudo', 'nohup', 'stdbuf', 'npx']);
const HOOK_NAMES = new Set(['pre-commit', 'prepare-commit-msg', 'commit-msg', 'post-commit', 'pre-push', 'pre-rebase', 'post-checkout', 'post-merge', 'pre-receive', 'post-receive', 'update', 'reference-transaction', 'pre-merge-commit', 'post-rewrite']);
const READ_VERBS = new Set(['reflog', 'config --get', 'config --get-all', 'config --list', 'rev-parse', 'diff', 'show', 'cat-file', 'ls-files', 'ls-tree', 'log', 'merge-base', 'for-each-ref', 'symbolic-ref', 'rev-list', 'var', 'version', '--version', 'check-attr', 'check-ignore', 'name-rev', 'describe']);
const WRITE_VERBS = /\bgit\s+(?:-C\s+\S+\s+)?(add|commit|push|pull|fetch|merge|rebase|reset|checkout|switch|restore|rm|mv|stash|tag|cherry-pick|revert|am|apply|clean|init|clone|update-ref|update-index|gc|prune|notes|hook\s+run|worktree\s+(?:add|remove|prune|move|lock|unlock|repair)|branch\s+-[dDfmM]|config\s+(?!--get|-l|--list)[\w.-]+\s+\S)/;
const PROHIBITION = /\b(never|not|don't|do not|no longer|instead of|refuse[sd]?|forbid|rather than|without)\b/i;

const rel = (root, file) => path.relative(root, file).split(path.sep).join('/');
const lineOf = (text, index) => text.slice(0, index).split('\n').length;
const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');

export function listFiles(root, roots = SCAN_ROOTS) {
  const out = [];
  const walk = (dir) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (!SKIP_DIRS.has(entry.name)) walk(full); continue; }
      if (entry.isFile()) out.push(full);
    }
  };
  for (const r of roots) {
    const full = path.join(root, r);
    if (fs.existsSync(full)) (fs.statSync(full).isDirectory() ? walk(full) : out.push(full));
  }
  return out.sort();
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
  if (value.external) return 'external';
  if (value.object !== undefined) return 'unknown';
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
  return spans;
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
const budget = { steps: 0, limit: 4000 };

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
    if (++budget.steps > budget.limit) return [{ unknown: `${expr.trim().slice(0, 60)} (data flow too deep)` }];
    expr = expr.trim().replace(/^await\s+/, '').replace(/^\(([\s\S]*)\)$/, '$1').trim();
    if (depth > 40) return [{ unknown: `${expr} (data flow too deep)` }];
    if (expr.startsWith('{') && lexSource(expr).shape.trimEnd().endsWith('}')) return [{ object: expr, file: this, at: index }];
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
    // `.trim()` keeps the value it trims; a declared `verify` command is consumer data however it is reached.
    if (/(?:\?\.|\.)trim\(\s*\)$/.test(shapeExpr)) return this.evaluate(expr.replace(/(?:\?\.|\.)trim\(\s*\)$/, ''), index, depth + 1);
    if (/(?:\?\.|\.)verify$/.test(shapeExpr)) return [{ external: `consumer verify command (${expr})` }];
    const pick = /^([\s\S]+?)\s*(?:\?\.|\.)\s*(?:find|findLast|at)\s*\(/.exec(shapeExpr);
    if (pick && splitArgs(shapeExpr, pick[0].length - 1).close === shapeExpr.trimEnd().length - 1) return this.elements(expr.slice(0, pick[1].length), index, depth + 1);
    const indexed = /^([A-Za-z_$][\w$.]*)\s*\[[^\[\]]+\]$/.exec(shapeExpr);
    if (indexed) return this.elements(indexed[1], index, depth + 1);
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
    const member = /^([A-Za-z_$][\w$]*)((?:\??\.[A-Za-z_$][\w$]*)+)$/.exec(expr);
    if (member) return this.memberValue(member[1], member[2].split(/\??\./).filter(Boolean), index, depth);
    const id = /^[A-Za-z_$][\w$]*$/.test(expr) ? expr : null;
    if (!id) return [{ unknown: expr }];
    // A parameter of the enclosing function: the caller decides.
    for (let fn = enclosing(this.spans, index); fn; fn = enclosing(this.spans, fn.from - 1)) {
      const at = fn.params.findIndex((p) => paramNames(p).includes(id));
      if (at >= 0) {
        const head = this.code.slice(fn.from, fn.bodyFrom);
        const fallback = new RegExp(`\\b${id.replace(/\$/g, '\\$')}\\s*=(?!=)\\s*`).exec(head);
        const fallbackText = fallback ? head.slice(fallback.index + fallback[0].length, fallback.index + fallback[0].length + statementEnd(lexSource(head.slice(fallback.index + fallback[0].length)).shape, 0)) : null;
        const defaults = fallbackText ? this.evaluate(fallbackText, fn.bodyFrom, depth + 1) : [];
        return [{ param: id, index: at, fn, destructured: /[{[]/.test(fn.params[at]), path: [], defaults }, ...defaults];
      }
      if (fn.from <= 0) break;
    }
    // The binding visible at `index`: `const id = ...` or `const { key: id } = ...`, in the innermost
    // function that encloses both, the nearest preceding one there, else the first one in that scope.
    const binding = this.binding(id, index);
    if (!binding) return [{ unknown: expr }];
    if (binding.key !== undefined) {
      const start = binding.m.index + binding.m[0].length;
      return this.property(this.code.slice(start, statementEnd(this.shape, start)), [binding.key], start, depth + 1);
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
    expr = expr.trim();
    if (depth > 40) return [{ unknown: expr }];
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
    if (/^[A-Za-z_$][\w$]*(?:\??\.[A-Za-z_$][\w$]*)+$/.test(expr)) {
      return this.evaluate(expr, index, depth + 1).map((v) => (v.external || v.param !== undefined ? (v.param !== undefined ? { ...v, elements: true } : v) : { unknown: `elements of ${expr}` }));
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
      if (!target) return [{ unknown: `elements of ${expr}` }];
      const out = returnTexts(target.file, target.fn).flatMap(({ text, at }) => target.file.elements(text, at, depth + 1));
      const argText = splitArgs(shape, call[0].length - 1).args.map(({ from, to }) => expr.slice(from, to));
      return out.flatMap((v) => {
        if (v.param === undefined || v.fn !== target.fn) return [v];
        const a = argText[v.index];
        if (a === undefined) return [];
        return v.elements ? this.elements(a, index, depth + 1) : this.evaluate(a, index, depth + 1);
      });
    }
    if (/^[A-Za-z_$][\w$]*$/.test(expr)) {
      for (let fn = enclosing(this.spans, index); fn; fn = enclosing(this.spans, fn.from - 1)) {
        const at = fn.params.findIndex((p) => paramNames(p).includes(expr));
        if (at >= 0) return [{ param: expr, index: at, fn, destructured: /[{[]/.test(fn.params[at]), path: [], defaults: [], elements: true, rest: fn.params[at].trim().startsWith('...') }];
        if (fn.from <= 0) break;
      }
      const b = this.binding(expr, index);
      if (b?.array) {
        const start = b.m.index + b.m[0].length;
        return this.elements(this.code.slice(start, statementEnd(this.shape, start)), start, depth + 1);
      }
      if (b && !b.of && b.key === undefined && b.m[1].startsWith('=')) {
        const start = b.m.index + b.m[0].length;
        return this.elements(this.code.slice(start, statementEnd(this.shape, start)), start, depth + 1);
      }
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
    const target = this.ctx && resolveFunction(this.ctx, this, callee);
    if (!target) return [{ unknown: expr }];
    const out = [];
    for (const v of returnValues(target.file, target.fn, depth + 1)) {
      if (v.param !== undefined && v.fn === target.fn) {
        const a = v.rest ? argText.slice(v.index).join(', ') : argText[v.index];
        if (a === undefined) continue; // undefined is not a binary; a default is already among the values
        if (v.elements) { out.push(...this.elements(v.rest ? `[${a}]` : a, index, depth + 1)); continue; }
        out.push(...(v.destructured || v.path.length ? this.property(a, [...(v.destructured ? [v.param] : []), ...v.path], index, depth + 1) : this.evaluate(a, index, depth + 1)));
      } else out.push(v.object !== undefined && !v.call ? { ...v, call: { fn: target.fn, argText, caller: this, index } } : v);
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
    const out = [];
    for (const v of base) {
      if (v.param !== undefined) out.push({ ...v, path: [...v.path, ...keys] });
      else if (v.object !== undefined) out.push(...bindCall(v, [...v.file.property(v.object, keys, v.at, depth + 1), ...v.file.writes(v, keys, depth + 1)], depth));
      else if (v.external) out.push(v);
      else out.push({ unknown: label });
    }
    return out;
  }

  /** Values a bound object receives after its literal: `name.key = x` and `name[expr] = x`. */
  writes(v, keys, depth, leaf = 'value') {
    if (!v.bound || depth > 40) return [];
    const [key, ...rest] = keys;
    const name = v.bound.replace(/\$/g, '\\$');
    const re = new RegExp(`(?<![\\w$.])${name}\\s*(\\.\\s*${key.replace(/\$/g, '\\$')}\\b|\\[)`, 'g');
    const out = [];
    for (let m; (m = re.exec(this.shape));) {
      let after = m.index + m[0].length;
      if (m[1] === '[') after = splitArgs(this.shape, after - 1).close + 1;
      const eq = /^\s*=(?![=>])\s*/.exec(this.shape.slice(after));
      if (!eq) continue;
      const s = after + eq[0].length;
      out.push(...this.property(this.code.slice(s, statementEnd(this.shape, s)), rest, s, depth + 1, leaf));
    }
    return out;
  }

  /** The `command:` value of an object literal or of the identifier bound to one. */
  property(expr, keys, index, depth = 0, leaf = 'value') {
    if (typeof keys === 'string') keys = [keys];
    expr = expr.trim();
    if (!keys.length) return leaf === 'elements' ? this.elements(expr, index, depth + 1) : this.evaluate(expr, index, depth + 1);
    if (depth > 40) return [{ unknown: expr }];
    const [key, ...rest] = keys;
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
    const values = this.evaluate(expr, index, depth + 1);
    const out = [];
    for (const v of values) {
      if (v.param !== undefined) out.push({ ...v, path: [...v.path, ...keys] });
      else if (v.object !== undefined) out.push(...bindCall(v, [...v.file.property(v.object, keys, v.at, depth + 1, leaf), ...v.file.writes(v, keys, depth + 1, leaf)], depth));
      else if (v.external) out.push(v);
      else out.push({ unknown: `${expr}.${keys.join('.')}` });
    }
    return out;
  }
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

const returning = new Set();
/** Possible values a function returns: its `return` expressions (not nested functions'), or an arrow body. */
function returnValues(file, fn, depth) {
  const key = `${file.name}:${fn.from}`;
  if (returning.has(key) || depth > 40) return [{ unknown: `${fn.name}() (recursive)` }];
  returning.add(key);
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
    returning.delete(key);
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
  const fns = new Map();
  const spaces = new Set();
  const borrowed = new Set();
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
      if (named) for (const part of named[1].split(',')) {
        const [orig, alias] = part.trim().split(/\s+as\s+/);
        if (orig === 'runBorrowed') borrowed.add(alias ?? orig);
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
      const rhs = m[2].trim().replace(/;$/, '');
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
  return { fns, spaces, borrowed };
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
  return results.flatMap((r) => {
    if (r.param === undefined || r.fn !== v.call.fn) return [r];
    const a = r.rest ? v.call.argText.slice(r.index).join(', ') : v.call.argText[r.index];
    if (a === undefined) return [];
    if (r.elements) return v.call.caller.elements(r.rest ? `[${a}]` : a, v.call.index, depth + 1);
    return r.destructured || r.path.length ? v.call.caller.property(a, [...(r.destructured ? [r.param] : []), ...r.path], v.call.index, depth + 1) : v.call.caller.evaluate(a, v.call.index, depth + 1);
  });
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
  const first = argText(0);
  if (first === undefined) return [{ value: { unknown: '(no argument)' } }];
  const options = argText(SHELL_FNS.has(site.fn) ? 1 : 2) ?? argText(1) ?? '';
  const values = file.evaluate(first, at);
  if (SHELL_FNS.has(site.fn) || /\bshell\s*:\s*(true|['"])/.test(options)) {
    return values.map((value) => ({ value, shell: true }));
  }
  return values.map((value) => ({ value, argvText: argText(1) }));
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

function firstVerbs(file, open) {
  // Literal argv verbs at a call: the first literal in the argv array after global options.
  const { args } = splitArgs(file.shape, open);
  const argv = args[1] ? file.code.slice(args[1].from, args[1].to) : '';
  const lits = [...argv.matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
  let i = 0;
  while (i < lits.length && /^(-C|-c|--git-dir|--work-tree)$/.test(lits[i])) i += 2;
  return lits[i] === 'config' ? `config ${lits[i + 1]}` : lits[i];
}

function scanJs(name, source, ctx) {
  const file = ctx.js.get(name) ?? new JsFile(name, source, ctx);
  ctx.js.set(name, file);
  for (const site of jsCallSites(file)) {
    budget.steps = 0;
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
  if (value.external) return `(${value.external})`;
  return `? ${String(value.unknown).replace(/\s+/g, ' ').slice(0, 80)}`;
}

function importersOf(ctx, file) {
  return [...ctx.js.values()].filter((other) => other !== file && [...other.code.matchAll(/(?:import|export)\s*\{[^}]*\}\s*from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]/g)].some((m) => {
    const spec = m[1] ?? m[2];
    return spec.startsWith('.') && path.posix.normalize(path.posix.join(path.posix.dirname(other.name), spec)) === file.name;
  }));
}

// Calls of a function `fnName` defined in `file`: same file, and importers by relative specifier.
function callersOf(ctx, file, fnName) {
  if (!fnName) return [];
  const out = [];
  const find = (f, local) => {
    const re = new RegExp(`(?:(?<![\\w$.])|(?<=\\bthis\\.))${local.replace(/\$/g, '\\$')}\\s*\\(`, 'g');
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
  if (!exported) return out;
  for (const other of ctx.js.values()) {
    if (other === file) continue;
    for (const m of other.code.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
      if (!m[2].startsWith('.')) continue;
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(other.name), m[2]));
      if (target !== file.name) continue;
      for (const part of m[1].split(',')) {
        const [orig, alias] = part.trim().split(/\s+as\s+/);
        if (orig === fnName) find(other, alias ?? orig);
      }
    }
  }
  return out;
}

/** Whether any scanned file names `fn` other than at its definition or in an import/export clause. */
function referenced(ctx, file, fn) {
  const name = fn.name.replace(/\$/g, '\\$');
  for (const f of ctx.js.values()) {
    const shape = f.shape.replace(/(?:import|export)\s*\{[^}]*\}\s*from\s*['"][^'"]*['"]|import\s+[^;]*?\s+from\s*['"][^'"]*['"]/g, (m) => ' '.repeat(m.length));
    for (const m of shape.matchAll(new RegExp(`(?<![\\w$])${name}(?![\\w$])`, 'g'))) {
      if (f === file && f.spans.some((s) => s.name === fn.name && m.index < s.from && m.index >= s.from - fn.name.length - 40 && /^[\s\w$]*\(?$/.test(f.shape.slice(m.index + fn.name.length, s.from + 1)))) continue;
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
    // runBorrowed's own spawn of `spec.command`: every runBorrowed call is already a site of its own.
    if (fn?.name === 'runBorrowed' && childProcessBindings(w.file).borrowed.has('runBorrowed')) continue;
    const key = `${w.record.path}:${w.record.line}:${fn?.name}:${value.param}:${(value.path ?? []).join('.')}`;
    if (seen.has(key) || seen.size > 20000) continue;
    seen.add(key);
    const callers = callersOf(ctx, w.file, fn?.name);
    if (!callers.length && fn?.name && !referenced(ctx, w.file, fn)) {
      // Nothing in the payload names it outside its definition and import clauses: no product data flow
      // reaches it. Tests that call it are watched by the runtime spy.
      ctx.classes.push({ ...w.record, class: 'uncalled-wrapper', function: fn.name });
      continue;
    }
    if (!callers.length) {
      ctx.raw.push({ ...w.record, family: 'unresolved-binary', binary: `${w.record.binary} (no caller found for ${fn?.name ?? 'anonymous function'})`, file: w.file, site: w.site, enclosing: enclosing(w.file.spans, w.site.open) });
      continue;
    }
    for (const c of callers) {
      budget.steps = 0;
      const { args } = splitArgs(c.file.shape, c.open);
      const arg = args[value.index];
      let values;
      if (!arg) continue; // undefined is not a binary; a default is already among the values
      else if (value.elements) {
        const text = value.rest ? `[${args.slice(value.index).map(({ from, to }) => c.file.code.slice(from, to)).join(', ')}]` : c.file.code.slice(arg.from, arg.to);
        values = c.file.elements(text, c.open, 0);
      } else {
        const text = c.file.code.slice(arg.from, arg.to);
        const keys = [...(value.destructured ? [value.param] : []), ...(value.path ?? [])];
        values = keys.length ? c.file.property(text, keys, c.open) : c.file.evaluate(text, c.open);
        if (keys.length && values.length === 0) continue; // the default applies
      }
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
  const fns = [...code.matchAll(/\bfn\s+(\w+)\s*(?:<[^>]*>)?\s*\(([^)]*)\)[^{;]*\{/g)].map((m) => {
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
      expr = expr.trim().replace(/^&\*?|\?$|\.(?:as_str|as_ref|clone|as_os_str|to_path_buf|to_owned|to_string|into|as_path|into_iter|collect(?:::<[^>]*>)?)\(\)$|\.map\(\s*Into::into\s*\)$|\.with_extension\([^()]*\)$|\.(?:unwrap_or_default|unwrap)\(\)$|\.expect\(\s*"[^"]*"\s*\)$/g, '').trim();
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
    const call = /^([a-z_]\w*)\s*\(/i.exec(expr);
    if (call && !fns.some((f) => f.name === call[1])) {
      // A local closure (`let pick = |..| body`): its body.
      const closure = new RegExp(`\\blet\\s+${call[1]}\\s*=\\s*(?:move\\s*)?\\|[^|]*\\|\\s*([^;]+);`).exec(code);
      if (closure) return evalRust(source.slice(closure.index + closure[0].indexOf(closure[1]), closure.index + closure[0].length - 1), closure.index, depth + 1);
      // A function of this crate imported by `use` (`tail_shim_path` from `shim.rs`).
      const other = model.ctx && [...model.ctx.rust.values()].find((m) => m !== model && m.name.replace(/\/src\/.*$/, '') === name.replace(/\/src\/.*$/, '') && m.fns.some((f) => f.name === call[1] && /\bpub\b[^;{]*$/.test(m.code.slice(Math.max(0, f.from - 30), f.from))));
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
    const callee = call && fns.find((f) => f.name === call[1]);
    if (callee && !/^(Some|Ok|Err)$/.test(call[1])) {
      const out = rustExits(model, callee).flatMap((e) => evalRust(e, callee.bodyFrom + 1, depth + 1));
      return out.length ? out : [{ unknown: expr }];
    }
    const path = [...expr.matchAll(/(?:\.join|PathBuf::from|Path::new)\(\s*([^()]*?)\s*\)/g)].map((m) => m[1]);
    if (path.length && /(?:\.join|PathBuf::from|Path::new)\([^()]*\)\s*(?:\)\s*)*$/.test(expr)) return path.flatMap((p) => evalRust(p, index, depth + 1)).map((v) => (v.lit !== undefined ? { lit: v.lit.split('/').pop() } : v));
    // A field of a parameter or of `self` (`spec.argv[0]`, `self.config.executable_path`, `config.bin()`):
    // resolved where values of that type are built.
    const field = /^([a-z_]\w*)((?:\s*\.\s*[a-z_]\w*(?:\(\))?)+)(\s*\[\s*0\s*\])?$/i.exec(expr);
    const fn = within(index);
    if (field && fn && (field[1] === 'self' || new RegExp(`\\b${field[1]}\\s*:`).test(fn.params))) {
      return [{ param: field[1], fn, path: field[2].split('.').map((k) => k.trim()).filter(Boolean), first: Boolean(field[3]) }];
    }
    if (field && fn) {
      // A local built by `Type::parse(..)` / `Type::new(..)` / `Type { .. }`: a value of that type.
      const local = new RegExp(`\\blet\\s+(?:mut\\s+)?${field[1]}\\b[^=;]*=\\s*([A-Z]\\w*)(?:::\\w+\\s*\\(|\\s*\\{)`).exec(code.slice(fn.bodyFrom, index));
      if (local) return [{ param: field[1], fn, type: local[1], path: field[2].split('.').map((k) => k.trim()).filter(Boolean), first: Boolean(field[3]) }];
    }
    const firstOf = /^([a-z_]\w*)\s*\[\s*0\s*\]$/i.exec(expr);
    if (firstOf) {
      if (fn && new RegExp(`\\b${firstOf[1]}\\s*:`).test(fn.params)) return [{ param: firstOf[1], fn, path: [], first: true }];
      const d = new RegExp(`\\blet\\s+(?:mut\\s+)?${firstOf[1]}\\b[^=;]*=\\s*(?:vec!\\s*)?\\[\\s*([^,\\]]+)`).exec(code.slice(fn?.bodyFrom ?? 0, index));
      if (d) return evalRust(d[1], index, depth + 1);
    }
    const id = /^[a-z_][\w]*$/i.test(expr) ? expr : null;
    if (!id) return [{ unknown: expr }];
    if (fn && new RegExp(`\\b${id}\\s*:`).test(fn.params)) return [{ param: id, fn, path: [] }];
    // `let Some((program, args)) = spec.argv.split_first()`: the first element.
    const split = new RegExp(`\\blet\\s+Some\\(\\(\\s*${id}\\s*,[^=]*=\\s*([^;]+?)\\s*\\.split_first\\(\\)`).exec(code.slice(fn?.bodyFrom ?? 0, index));
    if (split) return evalRust(`${source.slice((fn?.bodyFrom ?? 0) + split.index + split[0].indexOf(split[1]), (fn?.bodyFrom ?? 0) + split.index + split[0].indexOf(split[1]) + split[1].length)}[0]`, index, depth + 1);
    const decl = new RegExp(`\\b(?:let\\s+(?:mut\\s+)?|const\\s+|static\\s+)${id}\\b[^=;]*=\\s*([^;]+);`, 'g');
    let found = null;
    for (let m; (m = decl.exec(code));) if (!found || m.index < index) found = m;
    if (!found) return [{ unknown: expr }];
    let init = source.slice(found.index + found[0].indexOf(found[1]), found.index + found[0].length - 1).trim();
    init = init.replace(/\.into_iter\(\)$/, '');
    return evalRust(init, found.index, depth + 1);
  };
  model.eval = evalRust;
  return model;
}

/** A function's result expressions: `return x;` and a tail expression, `Ok(..)`/`Some(..)` unwrapped. */
function rustExits(model, fn) {
  const body = model.source.slice(fn.bodyFrom + 1, fn.to);
  const exits = [...body.matchAll(/\breturn\s+([^;]+);/g)].map((m) => m[1]);
  const tail = body.trim().split(/;\s*\n/).pop().trim();
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
      if (!visible(m, c[1] === '.')) continue;
      if ((c[1] === '.') !== selfParam) continue; // a method is called as `.name(`, a free function is not
      if (m !== model && c[1] !== '.' && m.fns.some((f) => f.name === fn.name)) continue; // that file's own function of the name
      if (c[1] === '::') { const q = /(\w+)::$/.exec(m.code.slice(Math.max(0, c.index - 40), c.index + 2)); if (q && q[1] !== stem && !/^(self|super|crate|Self)$/.test(q[1]) && q[1] !== implType) continue; }
      const args = rustArgs(m, c.index + c[0].length - 1);
      const at = selfParam && c[1] === '.' ? pos - 1 : pos;
      if (args[at]) out.push({ model: m, index: c.index, arg: args[at] });
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
  if (depth > 4) return [{ value: { unknown: 'argv data flow too deep' }, at: { path: model.name, line: lineOf(model.source, value.fn.from) } }];
  const out = [];
  const keep = (m, index, values) => {
    for (const v of values) {
      if (v.param !== undefined) out.push(...rustResolve(ctx, m, v, depth + 1));
      else out.push({ value: v, at: { path: m.name, line: lineOf(m.source, index) } });
    }
  };
  if (!value.path.length) {
    const callers = rustCallers(ctx, model, value.fn, value.param);
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
              const v = m.eval(x, f.bodyFrom + 1);
              for (const r of v) {
                if (r.param === 'self' && r.path.length) next = { model: m, value: { ...r, path: [...r.path, ...keys] } };
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
  let expr = text.trim().replace(/^&/, '').replace(/(?:\.join\([^()]*\)|\.as_path\(\)|\.to_path_buf\(\))+$/, '').trim();
  if (/\btemp_dir\(\)/.test(expr)) return true;
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
        if (cls === 'git' && repo && fn && (rustTempRepo(ctx, model, fn, repo) || (/temp_dir\(\)/.test(code.slice(fn.bodyFrom, fn.to)) && /\binit\b/.test(source.slice(fn.bodyFrom, fn.to))))) {
          ctx.classes.push({ ...record, class: 'production-sandbox-probe', function: fn.name, repository: repo.trim() }); continue;
        }
        ctx.raw.push({ ...site, family: cls === 'unknown' || cls === 'param' ? 'unresolved-binary' : cls === 'hook' ? 'hook-spawn' : 'rust' });
      }
    }
  }
}

// ---------- shell and skill text ----------

function scanShell(name, source, ctx) {
  source.split('\n').forEach((text, i) => {
    const line = text.replace(/(^|\s)#.*$/, '');
    if (!shellRunsGit(line)) return;
    const record = { path: name, line: i + 1, spawn: 'shell', binary: line.trim().slice(0, 80) };
    if (name.startsWith('.githooks/') && !WRITE_VERBS.test(line)) { ctx.classes.push({ ...record, class: 'hook-read-context' }); return; }
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

export function scan({ root = REPO, roots = SCAN_ROOTS, files } = {}) {
  const ctx = { js: new Map(), rust: new Map(), raw: [], wrappers: [], classes: [], markers: [] };
  const list = files ?? listFiles(root, roots);
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
  for (const s of ctx.raw) {
    const { file, site, enclosing: _e, ...record } = s;
    if (doors.has(record.path) && file && /\[\s*SANDBOX_DOOR\s*\]/.test(file.code.slice(site.open, splitArgs(file.shape, site.open).close))) {
      ctx.classes.push({ ...record, class: 'sandbox-door' }); continue;
    }
    if (record.path.startsWith('.githooks/') && file && record.family === 'spawn') {
      const callers = s.callers ?? [];
      const own = firstVerbs(file, site.open);
      const verbs = own ? [own] : callers.map((c) => { const [p, l] = c.split(/:(?=\d+$)/); const f = ctx.js.get(p); const line = f.source.split('\n')[Number(l) - 1] ?? ''; const lits = [.../\[\s*['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/.exec(line) ?? []]; return lits[1] === 'config' ? `config ${lits[2]}` : lits[1]; });
      if (verbs.every((v) => v && READ_VERBS.has(v))) { ctx.classes.push({ ...record, class: 'hook-read-context', verbs }); continue; }
    }
    sites.push(record);
  }
  const key = (s) => `${s.path}:${String(s.line).padStart(6, '0')}:${s.binary}`;
  const unique = (list) => [...new Map(list.map((s) => [key(s), s])).values()].sort((a, b) => key(a).localeCompare(key(b)));
  const finalSites = unique(sites);
  const classes = unique(ctx.classes);
  const families = {};
  for (const s of finalSites) families[s.family] = (families[s.family] ?? 0) + 1;
  const classCounts = {};
  for (const c of classes) classCounts[c.class] = (classCounts[c.class] ?? 0) + 1;
  return { sites: finalSites, families, classes, classCounts, files: digests };
}

/** The census written by the build: zero sites expected; the digest binds it to the scanned payload. */
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
  const result = scan({ root });
  if (argv.includes('--write-census')) writeMutationCensus(root, result);
  if (argv.includes('--json')) process.stdout.write(`${JSON.stringify({ sites: result.sites, families: result.families, classCounts: result.classCounts, classes: result.classes }, null, 2)}\n`);
  else {
    for (const s of result.sites) process.stdout.write(`${s.family}\t${s.path}:${s.line}\t${s.spawn}\t${s.binary}${s.callers ? `\t(${s.callers.length} callers)` : ''}\n`);
    process.stdout.write(`${result.sites.length} undeclared site(s) ${JSON.stringify(result.families)}; classes ${JSON.stringify(result.classCounts)}\n`);
  }
  return result.sites.length === 0 ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
