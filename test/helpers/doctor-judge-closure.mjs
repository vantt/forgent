// The Node modules a bridged doctor row is judged by, and the step that removes the row from the bridge.
//
// A bridged row's body lives in `src/setup/registrations.mjs` (inline or by calling a function of another module).
// What it reads is what its registration reaches: the identifiers of the `registerCheck` call, followed through the
// top-level functions of the same file, resolved to the modules they import. That set is the row's judge
// (`judge` in packages/distribution/contracts/doctor-registry.v1.json); the import closure of those modules, taken
// from the architecture manifest's edges, says which layers the row still reads in Node. A layer is Node-owned
// until the step that moves it: tier 5 is the Execution layer (S5 owns the read door of bind/decide/tool/agents,
// S6a the rest), tier 6 the Workflow (S6b) and tier 7 and above whatever Work lifecycle and the surface still hold
// (S7). Packaging (`src/setup`) and the layers with a Rust owner are not a reason to stay in Node.
import fs from 'node:fs';
import path from 'node:path';
import { lexSource } from '../../scripts/lib/js-source-lexer.mjs';

/** The order of the steps that remove a bridged row; `S4` is "moves inside this step". */
export const STEP_ORDER = ['S4', 'S5', 'S6a', 'S6b', 'S7'];

/** The modules the read door of Execution (S5) moves; every other tier-5 module is S6a's. */
export const S5_MODULES = new Set([
  'src/runner/agent-listing.mjs',
  'src/runner/execution/bind.mjs',
  'src/runner/dispatch/decide.mjs',
  'src/runner/dispatch/config.mjs',
  'src/state/tool-registry.mjs',
  'src/runner/dispatch/hook.mjs',
]);

/** The step that moves `file` out of Node, given its tier; `S4` for a file that is no reason to stay. */
export function stepOfFile(file, tier) {
  if (file.startsWith('src/seat-binding/') || S5_MODULES.has(file)) return 'S5';
  if (file.startsWith('src/setup/')) return 'S4';
  if (tier === 5) return 'S6a';
  if (tier === 6) return 'S6b';
  if (tier >= 7) return 'S7';
  return 'S4';
}

const IDENT = /[A-Za-z_$][\w$]*/g;

/** The import map of a module: local name to repo-relative path of the module it comes from (relative specifiers only). */
function importMap(file, code) {
  const map = new Map();
  const dir = path.dirname(file);
  const add = (names, specifier) => {
    if (!specifier.startsWith('.')) return;
    const target = path.posix.normalize(path.posix.join(dir, specifier));
    for (const name of names) map.set(name, target);
  };
  for (const m of code.matchAll(/\bimport\s+([^;]*?)\s+from\s*(['"])([^'"]+)\2/gms)) {
    const clause = m[1];
    const names = [];
    const braces = clause.match(/\{([^}]*)\}/s);
    if (braces) {
      for (const part of braces[1].split(',')) {
        const [, local] = /(?:[\w$]+\s+as\s+)?([\w$]+)\s*$/.exec(part.trim()) ?? [];
        if (local) names.push(local);
      }
    }
    const rest = clause.replace(/\{[^}]*\}/s, '').replace(/\*\s+as\s+([\w$]+)/, (_, ns) => { names.push(ns); return ''; });
    for (const word of rest.split(',').map((w) => w.trim()).filter(Boolean)) names.push(word);
    add(names, m[3]);
  }
  return map;
}

/** End index (exclusive) of the bracketed group opening at `shape[open]`. */
function closeOf(shape, open) {
  const pair = { '{': '}', '(': ')', '[': ']' }[shape[open]];
  let depth = 0;
  for (let i = open; i < shape.length; i++) {
    if (shape[i] === shape[open]) depth++;
    else if (shape[i] === pair && --depth === 0) return i + 1;
  }
  throw new Error('unbalanced source');
}

/** The top-level statements of a module as `{ start, end }`, split at a `;` or at the end of a function or class body. */
function topLevelStatements(shape) {
  const statements = [];
  let start = 0;
  let i = 0;
  const skipSpace = () => { while (i < shape.length && /\s/.test(shape[i])) i++; };
  skipSpace();
  start = i;
  while (i < shape.length) {
    const c = shape[i];
    if ('{(['.includes(c)) {
      const end = closeOf(shape, i);
      const head = shape.slice(start, i);
      i = end;
      // A function or class declaration, or a loop or branch, ends with its body.
      const declaration = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function\b|class\b)/.test(shape.slice(start, end).trimStart())
        && /\)\s*$|\bclass\s+[\w$]+(?:\s+extends\s+[\w$.]+)?\s*$|\bfunction\s*\*?\s*[\w$]*\s*\([^)]*\)\s*$/.test(head);
      const control = /^(?:for|while|if|switch)\s*\([\s\S]*\)\s*$/.test(head.trim());
      if (c === '{' && (declaration || control)) {
        statements.push({ start, end: i });
        skipSpace();
        start = i;
      }
      continue;
    }
    if (c === ';') {
      statements.push({ start, end: i + 1 });
      i++;
      skipSpace();
      start = i;
      continue;
    }
    i++;
  }
  if (start < shape.length && shape.slice(start).trim()) statements.push({ start, end: shape.length });
  return statements;
}

/** The names a top-level statement declares. */
function declaredNames(text) {
  const t = text.trimStart();
  let m = /^(?:export\s+)?(?:async\s+)?function\s*\*?\s*([\w$]+)/.exec(t);
  if (m) return [m[1]];
  m = /^(?:export\s+)?class\s+([\w$]+)/.exec(t);
  if (m) return [m[1]];
  m = /^(?:export\s+)?(?:const|let|var)\s+([\w$]+)\s*=/.exec(t);
  return m ? [m[1]] : [];
}

/**
 * The relative modules the registration of doctor row (`call` is `registerCheck`) or fix (`registerFix`) `id`
 * reaches in `registrations`'s source (`file` is its repo-relative path): the identifiers of the statement that
 * names `id` (or, for the rows registered by a loop over their ids, the loop), followed through the file's own
 * top-level declarations.
 */
export function judgeModulesOf(file, source, id, call = 'registerCheck') {
  const { code, shape } = lexSource(source);
  const imports = importMap(file, code);
  const statements = topLevelStatements(shape);
  const declared = new Map();
  for (const s of statements) for (const name of declaredNames(shape.slice(s.start, s.end))) declared.set(name, s);
  const quoted = [`'${id}'`, `"${id}"`, `\`${id}\``];
  // A row registered from a loop: its id is a template (`event-store-${name}`) over a list of the suffixes.
  const loop = id.startsWith('event-store-') ? `'${id.slice('event-store-'.length)}'` : null;
  const registrations = statements.filter((s) => {
    const text = code.slice(s.start, s.end);
    if (!text.includes(`${call}(`)) return false;
    return quoted.some((q) => text.includes(q)) || (loop !== null && text.includes(loop) && text.includes('event-store-${'));
  });
  if (registrations.length === 0) throw new Error(`no ${call} statement names ${id}`);
  const modules = new Set();
  const seen = new Set();
  const visit = (statement) => {
    if (seen.has(statement)) return;
    seen.add(statement);
    const text = shape.slice(statement.start, statement.end);
    for (const m of text.matchAll(IDENT)) {
      if (text[m.index - 1] === '.') continue;
      const name = m[0];
      if (imports.has(name)) modules.add(imports.get(name));
      else if (declared.has(name)) visit(declared.get(name));
    }
  };
  registrations.forEach(visit);
  return [...modules].sort();
}

/** Every file reachable from `starts` along `edges` (`[from, to]` pairs), the starts included. */
export function closureOf(starts, edges) {
  const next = new Map();
  for (const [from, to] of edges) {
    if (!next.has(from)) next.set(from, []);
    next.get(from).push(to);
  }
  const seen = new Set(starts);
  const queue = [...starts];
  while (queue.length > 0) {
    for (const to of next.get(queue.shift()) ?? []) {
      if (!seen.has(to)) { seen.add(to); queue.push(to); }
    }
  }
  return seen;
}

/** The step that removes a row judged by `modules`: the highest step among the files their closure reaches. */
export function stepOfClosure(modules, edges, tierOf) {
  let best = 0;
  for (const file of closureOf(modules, edges)) {
    const rank = STEP_ORDER.indexOf(stepOfFile(file, tierOf(file)));
    if (rank > best) best = rank;
  }
  return STEP_ORDER[best];
}

/** The text of `file` under `root`. */
export function readSource(root, file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

/**
 * Failures of the bridged entries of the registry. Each `entries` item is `{ kind, id, owner, judge }`; `judgeOf`
 * recomputes an entry's judge modules from the registration, `stepOf` is the step of a module list's closure. An
 * entry fails when its recorded judge is not what the registration reaches, when its label is not the highest step
 * the closure reaches, and, named apart, when the label is higher than the closure needs (nothing Node-only is left
 * to wait for, so the row must move to Rust now). Entries owned by Rust are not judged here.
 */
export function bridgeFailures(entries, { judgeOf, stepOf }) {
  const failures = [];
  for (const entry of entries) {
    if (!entry.owner.startsWith('bridge:')) continue;
    const label = entry.owner.slice('bridge:'.length);
    const who = `${entry.kind} ${entry.id}`;
    if (!STEP_ORDER.includes(label)) {
      failures.push(`${who}: bridge:${label} names no step (${STEP_ORDER.join(', ')})`);
      continue;
    }
    const reached = judgeOf(entry);
    if (JSON.stringify(reached) !== JSON.stringify(entry.judge)) {
      failures.push(`${who}: records judge ${JSON.stringify(entry.judge)} but its registration reaches ${JSON.stringify(reached)}`);
      continue;
    }
    const step = stepOf(reached);
    if (step === label) continue;
    failures.push(STEP_ORDER.indexOf(step) < STEP_ORDER.indexOf(label)
      ? `${who}: labelled bridge:${label} but what it reads is gone from Node after ${step}: move it to Rust or relabel it`
      : `${who}: labelled bridge:${label} but it still reads a layer that stays in Node until ${step}`);
  }
  return failures;
}
