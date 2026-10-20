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
  const header = /(?:\bfunction\s*\*?\s*([A-Za-z_$][\w$]*)?\s*\(|\b([A-Za-z_$][\w$]*)\s*[:=]\s*(?:async\s+)?(?:function\s*\*?\s*\w*\s*)?\(|(?:^|[\s,{(=])(?:async\s+)?\(|\b([A-Za-z_$][\w$]*)\s*\()/g;
  for (let m; (m = header.exec(shape));) {
    const open = shape.indexOf('(', m.index + (m[0].startsWith('(') ? 0 : 0));
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
    if (/^(null|undefined|false)$/.test(expr)) return []; // not a binary: spawn would throw
    const env = /^process\.env(?:\.([A-Za-z_]\w*)|\[\s*['"]([^'"]+)['"]\s*\])$/.exec(expr);
    if (env) return [{ external: `env ${env[1] ?? env[2]}` }];
    if (tpl === null && /^`[\s\S]*`$/.test(expr)) return this.template(expr, index, depth);
    const shapeExpr = lexSource(expr).shape;
    for (const op of ['??', '||']) {
      const at = topLevel(shapeExpr, op);
      if (at >= 0) return [...this.evaluate(expr.slice(0, at), index, depth + 1), ...this.evaluate(expr.slice(at + op.length), index, depth + 1)];
    }
    const q = topLevel(shapeExpr, '?');
    if (q >= 0) {
      const c = topLevel(shapeExpr.slice(q + 1), ':');
      if (c >= 0) return [...this.evaluate(expr.slice(q + 1, q + 1 + c), index, depth + 1), ...this.evaluate(expr.slice(q + 2 + c), index, depth + 1)];
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
    // `const { id } = expr` / `const { key: id } = expr`.
    const destr = new RegExp(`\\b(?:const|let|var)\\s*\\{([^}]*)\\}\\s*=\\s*`, 'g');
    let dfound = null;
    for (let m; (m = destr.exec(this.shape));) {
      const part = this.code.slice(m.index, m.index + m[0].length).match(/\{([^}]*)\}/)[1].split(',').map((x) => x.trim()).find((x) => new RegExp(`^(?:([\\w$]+)\\s*:\\s*)?${id.replace(/\$/g, '\\$')}(?:\\s*=.*)?$`).test(x));
      if (part && (!dfound || m.index < index)) dfound = { m, key: /^([\w$]+)\s*:/.exec(part)?.[1] ?? id };
    }
    if (dfound) {
      const start = dfound.m.index + dfound.m[0].length;
      return this.property(this.code.slice(start, statementEnd(this.shape, start)), [dfound.key], start, depth + 1);
    }
    // The nearest preceding binding of the name in this file, else the first one.
    const decl = new RegExp(`\\b(?:const|let|var)\\s+${id.replace(/\$/g, '\\$')}\\s*(=\\s*|;|\\n)`, 'g');
    let found = null;
    for (let m; (m = decl.exec(this.shape));) { if (!found || m.index < index) found = m; }
    if (!found) return [{ unknown: expr }];
    const start = found.index + found[0].length;
    const end = statementEnd(this.shape, start);
    const values = found[1].startsWith('=') ? this.evaluate(this.code.slice(start, end), start, depth + 1) : [];
    // Later assignments to a `let` count too.
    const assign = new RegExp(`(?<![\\w$.])${id.replace(/\$/g, '\\$')}\\s*=(?!=)\\s*`, 'g');
    for (let m; (m = assign.exec(this.shape));) {
      if (m.index === found.index + found[0].indexOf(id) || this.shape.slice(Math.max(0, m.index - 6), m.index).match(/(const|let|var)\s*$/)) continue;
      const s = m.index + m[0].length;
      values.push(...this.evaluate(this.code.slice(s, statementEnd(this.shape, s)), s, depth + 1));
    }
    return values;
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
    if (/^path\.(join|resolve|normalize)$/.test(callee)) return argText.length ? this.evaluate(argText.at(-1), index, depth + 1) : [{ unknown: expr }];
    if (/^(fs\.realpathSync|path\.basename|String)$/.test(callee)) return argText.length ? this.evaluate(argText[0], index, depth + 1) : [{ unknown: expr }];
    const target = this.ctx && resolveFunction(this.ctx, this, callee);
    if (!target) return [{ unknown: expr }];
    const out = [];
    for (const v of returnValues(target.file, target.fn, depth + 1)) {
      if (v.param !== undefined && v.fn === target.fn) {
        const a = argText[v.index];
        if (a === undefined) { out.push({ unknown: `${expr} (argument omitted)` }); continue; }
        out.push(...(v.destructured || v.path.length ? this.property(a, [...(v.destructured ? [v.param] : []), ...v.path], index, depth + 1) : this.evaluate(a, index, depth + 1)));
      } else out.push(v);
    }
    return out.length ? out : [{ unknown: expr }];
  }

  memberValue(root, keys, index, depth) {
    // A Work item's or capability's declared verification command: consumer data, never product code.
    if (keys.at(-1) === 'verify') return [{ external: `consumer verify command (${root}.${keys.join('.')})` }];
    if (root === 'process' && keys[0] === 'env') return [{ external: `env ${keys[1] ?? '*'}` }];
    if (root === 'process' && keys[0] === 'execPath') return [{ self: true }];
    const base = this.evaluate(root, index, depth + 1);
    const out = [];
    for (const v of base) {
      if (v.param !== undefined) out.push({ ...v, path: [...v.path, ...keys] });
      else if (v.object !== undefined) out.push(...v.file.property(v.object, keys, v.at, depth + 1));
      else if (v.external) out.push(v);
      else out.push({ unknown: `${root}.${keys.join('.')}` });
    }
    return out;
  }

  /** The `command:` value of an object literal or of the identifier bound to one. */
  property(expr, keys, index, depth = 0) {
    if (typeof keys === 'string') keys = [keys];
    expr = expr.trim();
    if (!keys.length) return this.evaluate(expr, index, depth + 1);
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
      if (!hit) return /\.\.\./.test(shape) ? [{ unknown: expr }] : [];
      if (hit.m[1] !== ':') return this.property(key, rest, index, depth + 1);
      const s = hit.at + hit.m[0].length;
      const value = expr.slice(s, s + statementEnd(lexSource(expr.slice(s)).shape, 0));
      return this.property(value, rest, index, depth + 1);
    }
    const values = this.evaluate(expr, index, depth + 1);
    const out = [];
    for (const v of values) {
      if (v.param !== undefined) out.push({ ...v, path: [...v.path, ...keys] });
      else if (v.object !== undefined) out.push(...v.file.property(v.object, keys, v.at, depth + 1));
      else if (v.external) out.push(v);
      else out.push({ unknown: `${expr}.${keys.join('.')}` });
    }
    return out;
  }
}

/** A function named `callee` visible in `file`: defined there, or imported from a relative module. */
function resolveFunction(ctx, file, callee) {
  if (callee.includes('.')) return null;
  const local = file.spans.find((s) => s.name === callee);
  if (local) return { file, fn: local };
  for (const m of file.code.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    if (!m[2].startsWith('.')) continue;
    for (const part of m[1].split(',')) {
      const [orig, alias] = part.trim().split(/\s+as\s+/);
      if ((alias ?? orig) !== callee) continue;
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file.name), m[2]));
      const other = ctx.js.get(target) ?? ctx.load?.(target);
      const fn = other?.spans.find((s) => s.name === orig);
      if (fn) return { file: other, fn };
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

/** Possible binaries for one spawn call: [{value, shellText?}] */
function jsBinaries(file, site) {
  const { args } = splitArgs(file.shape, site.open);
  const argText = (i) => (args[i] ? file.code.slice(args[i].from, args[i].to) : undefined);
  const at = site.open;
  if (site.fn === 'runBorrowed') {
    const spec = argText(1);
    if (spec === undefined) return [{ value: { unknown: '(no spec)' } }];
    return file.property(spec, 'command', at).map((value) => ({ value, argv: undefined, specArgs: /\bargs\s*:/.test(spec) }));
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
    if (cls === 'shell') return literals.some(shellRunsGit) ? 'git' : /^\s*\[\s*['"]-l?c['"]\s*,\s*['"`]/.test(argv) || !/-l?c/.test(argv) ? 'other' : 'unknown';
    return literals.some((l) => binaryClass({ lit: l }) === 'git') ? 'git' : 'other';
  }
  return cls;
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

function resolveWrappers(ctx) {
  // A spawn whose binary is a parameter: resolve the argument at every caller, transitively.
  const queue = [...ctx.wrappers];
  const seen = new Set();
  while (queue.length) {
    const w = queue.shift();
    const { value } = w.entry;
    const fn = value.fn;
    const key = `${w.record.path}:${w.record.line}:${fn?.name}:${value.param}:${(value.path ?? []).join('.')}`;
    if (seen.has(key) || seen.size > 20000) continue;
    seen.add(key);
    const callers = callersOf(ctx, w.file, fn?.name);
    if (!callers.length) {
      ctx.raw.push({ ...w.record, family: 'unresolved-binary', binary: `${w.record.binary} (no caller found for ${fn?.name ?? 'anonymous function'})`, file: w.file, site: w.site, enclosing: enclosing(w.file.spans, w.site.open) });
      continue;
    }
    for (const c of callers) {
      budget.steps = 0;
      const { args } = splitArgs(c.file.shape, c.open);
      const arg = args[value.index];
      let values;
      if (!arg) { if (value.defaults?.length || value.destructured) continue; values = [{ unknown: '(argument omitted)' }]; }
      else {
        const text = c.file.code.slice(arg.from, arg.to);
        const keys = [...(value.destructured ? [value.param] : []), ...(value.path ?? [])];
        values = keys.length ? c.file.property(text, keys, c.open) : c.file.evaluate(text, c.open);
        if (keys.length && values.length === 0) continue; // the default applies
      }
      for (const v of values) {
        const entry = { ...w.entry, value: v };
        const cls = w.entry.shell ? classifyJs(c.file, c, entry) : binaryClass(v);
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

function scanRust(name, source, ctx) {
  const code = lexRust(source);
  const testFile = /(^|\/)tests\//.test(name) || /(^|\/)benches\//.test(name);
  const tests = rustTestRanges(code);
  const fns = [...code.matchAll(/\bfn\s+(\w+)\s*(?:<[^>]*>)?\s*\(([^)]*)\)[^{;]*\{/g)].map((m) => {
    const open = m.index + m[0].length - 1;
    let depth = 0;
    let end = open;
    for (; end < code.length; end++) { if (code[end] === '{') depth++; else if (code[end] === '}' && --depth === 0) break; }
    return { name: m[1], params: m[2], from: m.index, bodyFrom: open, to: end };
  });
  const within = (i) => fns.filter((f) => f.bodyFrom <= i && i <= f.to).sort((a, b) => b.bodyFrom - a.bodyFrom)[0];
  const evalRust = (expr, index, depth = 0) => {
    expr = expr.trim().replace(/^&\*?|\?$|\.as_str\(\)$|\.as_ref\(\)$|\.clone\(\)$|\.as_os_str\(\)$/g, '').trim();
    if (/std::env::var(?:_os)?\(/.test(expr) && !/split_paths/.test(expr)) return [{ external: `env ${/var(?:_os)?\(\s*"([^"]+)"/.exec(expr)?.[1] ?? '*'}` }];
    if (depth > 6) return [{ unknown: expr }];
    const lit = /^"((?:\\.|[^"\\])*)"$/.exec(expr);
    if (lit) return [{ lit: lit[1] }];
    if (/current_exe\(\)|env!\(\s*"CARGO_BIN_EXE_|std::env::args/.test(expr)) return [{ self: true }];
    const ifElse = /^if\b[^{]*\{\s*([\s\S]*?)\s*\}\s*else\s*\{\s*([\s\S]*?)\s*\}$/.exec(expr);
    if (ifElse) return [...evalRust(ifElse[1], index, depth + 1), ...evalRust(ifElse[2], index, depth + 1)];
    const call = /^([a-z_]\w*)\s*\(/i.exec(expr);
    const callee = call && fns.find((f) => f.name === call[1]);
    if (callee && !/^(Some|Ok|Err)$/.test(call[1])) {
      const body = source.slice(callee.bodyFrom + 1, callee.to);
      const exits = [...body.matchAll(/\breturn\s+([^;]+);/g)].map((m) => m[1]);
      const tail = body.trim().split(/;\s*\n/).pop().trim();
      if (tail && !tail.endsWith(';')) exits.push(tail);
      const out = exits.flatMap((e) => evalRust(e.replace(/^Ok\(([\s\S]*)\)$/, '$1'), callee.bodyFrom + 1, depth + 1));
      return out.length ? out : [{ unknown: expr }];
    }
    const path = [...expr.matchAll(/(?:\.join|PathBuf::from|Path::new)\(\s*([^()]*?)\s*\)/g)].map((m) => m[1]);
    if (path.length && /(?:\.join|PathBuf::from|Path::new)\([^()]*\)\s*(?:\)\s*)*$/.test(expr)) return path.flatMap((p) => evalRust(p, index, depth + 1)).map((v) => (v.lit !== undefined ? { lit: v.lit.split('/').pop() } : v));
    const id = /^[a-z_][\w]*$/i.test(expr) ? expr : null;
    if (!id) return [{ unknown: expr }];
    const fn = within(index);
    if (fn && new RegExp(`\\b${id}\\s*:`).test(fn.params)) return [{ param: id, fn }];
    const decl = new RegExp(`\\b(?:let\\s+(?:mut\\s+)?|const\\s+|static\\s+)${id}\\b[^=;]*=\\s*([^;]+);`, 'g');
    let found = null;
    for (let m; (m = decl.exec(code));) if (!found || m.index < index) found = m;
    if (!found) return [{ unknown: expr }];
    return evalRust(source.slice(found.index + found[0].indexOf(found[1]), found.index + found[0].length - 1), found.index, depth + 1);
  };
  for (const m of code.matchAll(/Command::new\s*\(/g)) {
    const open = m.index + m[0].length - 1;
    let depth = 0;
    let close = open;
    for (; close < code.length; close++) { if (code[close] === '(') depth++; else if (code[close] === ')' && --depth === 0) break; }
    const expr = source.slice(open + 1, close);
    const line = lineOf(source, m.index);
    const inTest = testFile || tests.some(([a, b]) => a <= m.index && m.index <= b);
    const fn = within(m.index);
    const tail = code.slice(close, close + 400);
    for (let value of evalRust(expr, m.index)) {
      let cls = binaryClass(value);
      if (cls === 'param') {
        // Resolve at callers in the same file.
        const callers = [...code.matchAll(new RegExp(`\\b${value.fn.name}\\s*\\(`, 'g'))].filter((c) => c.index !== value.fn.from + code.slice(value.fn.from).indexOf(value.fn.name));
        const pos = value.fn.params.split(',').findIndex((p) => new RegExp(`\\b${value.param}\\s*:`).test(p));
        const resolved = callers.flatMap((c) => {
          const o = c.index + c[0].length - 1;
          let d = 0; let e = o; const parts = []; let s = o + 1;
          for (; e < code.length; e++) { const ch = code[e]; if ('([{'.includes(ch)) d++; else if (')]}'.includes(ch)) { if (--d === 0) { parts.push(source.slice(s, e)); break; } } else if (ch === ',' && d === 1) { parts.push(source.slice(s, e)); s = e + 1; } }
          return parts[pos] === undefined ? [] : evalRust(parts[pos], c.index);
        });
        const classes = resolved.map(binaryClass);
        cls = !resolved.length || classes.some((k) => k === 'unknown' || k === 'param') ? 'unknown' : classes.includes('git') ? 'git' : classes.includes('hook') ? 'hook' : 'other';
        value = { unknown: `param ${value.param} of ${value.fn.name}` };
      }
      if (cls === 'shell' && !/\.arg\(\s*"-l?c"\s*\)/.test(tail)) cls = 'other';
      if (cls === 'shell') cls = shellRunsGit(tail) ? 'git' : 'unknown';
      if (cls === 'other') continue;
      const record = { path: name, line, spawn: 'Command::new', binary: describe(value) };
      if (inTest) { ctx.classes.push({ ...record, class: 'rust-test' }); continue; }
      if (/^packages\/git\/rust\/src\//.test(name) && cls === 'git') { ctx.classes.push({ ...record, class: 'git-driver' }); continue; }
      if (fn && /temp_dir\(\)/.test(code.slice(fn.bodyFrom, fn.to)) && cls === 'git' && /\.current_dir\(|\.arg\(\s*"-C"\s*\)/.test(tail) && /\binit\b/.test(source.slice(fn.bodyFrom, fn.to))) {
        ctx.classes.push({ ...record, class: 'production-sandbox-probe', function: fn.name }); continue;
      }
      ctx.raw.push({ ...record, family: cls === 'unknown' ? 'unresolved-binary' : cls === 'hook' ? 'hook-spawn' : 'rust' });
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
  const ctx = { js: new Map(), raw: [], wrappers: [], classes: [], markers: [] };
  const list = files ?? listFiles(root, roots);
  const digests = {};
  for (const full of list) {
    const name = rel(root, full);
    if (!JS_EXT.has(path.extname(name)) || name === 'scripts/git-one-door-scan.mjs') continue;
    try { ctx.js.set(name, new JsFile(name, fs.readFileSync(full, 'utf8'), ctx)); } catch { /* unreadable: skipped below too */ }
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
    else if (kind === 'rust') scanRust(name, source, ctx);
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
