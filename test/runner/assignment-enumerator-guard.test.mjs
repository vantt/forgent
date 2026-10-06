// Every directory listing under `.fgos/assignments` must go through
// src/runner/dispatch/assignment-layout.mjs, which knows that assignments nest
// (`unit/<seat>/<round>/runs/<attempt>`), stops at `runs/`, and never follows
// symlinks. A private walker that only lists the top level silently misses
// nested runs, which is exactly how nested panel runs went unseen before.
//
// The guard is behavioral rather than name-based: it finds every call that
// lists a directory (readdir/readdirSync/opendir/opendirSync, plus same-file
// wrappers that pass their parameter to one of those) and follows the call's
// path argument back through same-file bindings: `const`/`let` definitions,
// `for (... of <iterable>)` loop variables (so a loop over a `roots` array of
// assignment directories is caught) and same-file function parameters. A
// listing is an assignment-tree listing when that derivation reaches the
// literal segment 'assignments' or an identifier/call named after an
// assignment directory. Every such listing outside assignment-layout.mjs must
// appear in ALLOWED with the reason it is not a tree walker of its own.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const LAYOUT_OWNER = 'src/runner/dispatch/assignment-layout.mjs';
const SCAN_ROOTS = ['src', 'scripts', 'apps', 'bin'];
const SOURCE_EXT = /\.(?:mjs|cjs|js)$/;
const SKIP_DIRS = new Set(['node_modules', 'target', 'dist', '.git']);
const LIST_PRIMITIVE = /\b(?:readdirSync|readdir|opendirSync|opendir)\s*\(/g;
// A path expression is assignment-tree derived when it names the segment or
// an assignment directory helper (assignmentDir, assignmentsDir, asgnDir...).
const ASSIGNMENT_SEED = /['"`][^'"`\n]*\bassignments\b[^'"`\n]*['"`]|\b(?:assignments?|asgn)\w*(?:Dir|Root|Base|Path)\w*\b|\bassignmentDir\b/i;

// Key: `<file>: <callee>(<first argument>)`, whitespace collapsed. Each entry
// is an existing direct reader with a reason it is not a competing tree walker.
const ALLOWED = new Map([
  // Unit semantics (latest round, fallback seat, outcome mapping) belong to
  // the unit owner. It walks one known unit directory's seats and rounds, not
  // the assignments tree, and its nested shape is the layout's own shape.
  ['src/runner/execution/unit-run-history.mjs: readdirSync(unitDir)', 'unit owner: seats of one known unit directory'],
  ['src/runner/execution/unit-run-history.mjs: readdirSync(roleDir)', 'unit owner: rounds of one known seat directory'],
  ['src/runner/execution/unit-run-history.mjs: readdirSync(runsDir)', 'unit owner: numbered attempts of one known round'],
  // The unit summary writer shares the unit owner's seat/round rules to decide
  // whether a unit still has an attempt in flight.
  ['src/runner/execution/unit-summary.mjs: readdirSync(unitDir)', 'unit owner: seats of one known unit directory'],
  ['src/runner/execution/unit-summary.mjs: readdirSync(roleDir)', 'unit owner: rounds of one known seat directory'],
  ['src/runner/execution/unit-summary.mjs: readdirSync(runsDir)', 'unit owner: attempts of one known round'],
  // Unit summary backfill lists only top-level `unit-run-*` directories (units
  // are always top-level) and hands each one to the unit owner.
  ['scripts/backfill-unit-summaries.mjs: readdirSync(root)', 'unit discovery: top-level unit directories, delegated to the unit owner'],
  // Assignment-id allocation: lists only immediate children to find ids that
  // share a newly minted flat id prefix. Nested unit ids never use that prefix.
  ['src/runner/dispatch/assignment.mjs: readdirSync(assignmentsDir)', 'id allocation: top-level names sharing a new flat id prefix'],
  // Work-driver gate evidence: flat work assignments only (work assignments are
  // never nested); restricted to dispatched attempts of a matching assignment.
  ['src/runner/operation-choice.mjs: readdirSync(assignmentsDir)', 'work-driver gate evidence: flat work assignments only'],
  ['src/runner/operation-choice.mjs: readdirSync(dispatchedDir)', 'dispatch markers of one known assignment'],
  ['src/runner/operation-choice.mjs: readdirSync(runsDir)', 'attempts of one known assignment, filtered to dispatched markers'],
  // Run-attempt admission and command queues of one already-resolved
  // assignment or run directory; never discovery across assignments.
  ['src/runner/dispatch/assignment-runner.mjs: readdirSync(commandsDir)', 'command queue of one resolved run'],
  ['src/runner/dispatch/assignment-runner.mjs: readdirSync(runsDir)', 'attempt numbering of one resolved assignment'],
  ['src/runner/dispatch/herdr-reconcile.mjs: readdirSync(od)', 'worker outbox of one resolved run'],
  ['src/runner/dispatch/runtime-inspection.mjs: readdirSync(genDir)', 'generation records of one resolved run'],
  ['src/runner/dispatch/runtime-inspection.mjs: readdirSync(commandsDir)', 'command queue of one resolved run'],
  // Maintainer script: copies a measurement corpus's companion assignments
  // into a scratch root; it never reads runs or reports run visibility.
  ['scripts/measure-coordination-baseline.mjs: readdirSync(companionAssignmentsDir)', 'corpus copy into a scratch root, not a run reader'],
]);

function sourceFiles() {
  const files = [];
  const visit = (dir) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && SOURCE_EXT.test(entry.name)) files.push(full);
    }
  };
  for (const scanRoot of SCAN_ROOTS) visit(path.join(root, scanRoot));
  return files.sort();
}

// Comments discuss directory listings in prose; only code counts.
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .split('\n')
    .map((line) => (/^\s*\/\//.test(line) ? '' : line))
    .join('\n');
}

// Same-length copy with string contents blanked, used only to measure
// bracket depth so a quoted brace cannot shift a scope boundary.
function maskStrings(source) {
  return source.replace(/(['"`])(?:\\.|(?!\1)[^\\\n])*\1/g, (lit) => lit[0] + ' '.repeat(lit.length - 2) + lit[0]);
}

// Text of the balanced argument list starting right after `(` at `open`.
function argumentText(source, open) {
  let depth = 1;
  let i = open;
  for (; i < source.length && depth > 0; i++) {
    if (source[i] === '(') depth++;
    else if (source[i] === ')') depth--;
  }
  return source.slice(open, i - 1);
}

function firstArgument(args) {
  let depth = 0;
  for (let i = 0; i < args.length; i++) {
    const c = args[i];
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ',' && depth === 0) return args.slice(0, i).trim();
  }
  return args.trim();
}

const collapse = (text) => text.replace(/\s+/g, ' ').trim();
const identifiers = (text) => text.match(/[A-Za-z_$][\w$]*/g) ?? [];
const escape = (name) => name.replace(/\$/g, '\\$');
// Segments that only the assignment layout uses: descending from a listed
// directory into one of these means the listing walks that layout.
const LAYOUT_MARKER = /['"`](?:runs|assignment\.json|result\.json|run\.json)['"`]/;

// Top-level statements (functions, module constants) are the scopes; names
// are resolved within a scope plus module-level constants.
function topLevelScopes(source) {
  const masked = maskStrings(source);
  const scopes = [];
  let depth = 0;
  let offset = 0;
  for (const line of masked.split('\n')) {
    if (depth === 0 && line.trim() && !/^[\s})\].]/.test(line)) {
      if (scopes.length) scopes.at(-1).end = offset;
      scopes.push({ start: offset, end: source.length });
    }
    for (const c of line) {
      if ('([{'.includes(c)) depth++;
      else if (')]}'.includes(c)) depth = Math.max(0, depth - 1);
    }
    offset += line.length + 1;
  }
  return scopes.map((scope) => ({ ...scope, text: source.slice(scope.start, scope.end) }));
}

// Name -> expressions it may hold within one scope.
function bindings(text) {
  const defs = new Map();
  const add = (name, expr) => { if (!defs.has(name)) defs.set(name, []); defs.get(name).push(expr); };
  const names = (pattern) => (/^[{[]/.test(pattern) ? identifiers(pattern.replace(/[A-Za-z_$][\w$]*\s*:/g, '')) : [pattern]);
  for (const m of text.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*|\{[^}]*\}|\[[^\]]*\])\s*=\s*([^;\n]+)/g)) {
    for (const name of names(m[1])) add(name, m[2]);
  }
  for (const m of text.matchAll(/(?:^|[;{}\n])\s*([A-Za-z_$][\w$]*)\s*=(?![=>])\s*([^;\n]+)/g)) add(m[1], m[2]);
  for (const m of text.matchAll(/for\s*\(\s*(?:const|let|var)\s+([A-Za-z_$][\w$]*|\{[^}]*\}|\[[^\]]*\])\s+of\s+([^\n]+)/g)) {
    for (const name of names(m[1])) add(name, m[2]);
  }
  return defs;
}

// Same-file function name -> { params, scope index, simple (plain identifier params) }.
function functions(scopes) {
  const fns = new Map();
  scopes.forEach(({ text }, scope) => {
    const record = (name, list) => {
      const simple = !/[{[=]/.test(list);
      fns.set(name, { params: identifiers(list.replace(/=[^,)]*/g, '')), scope, simple });
    };
    for (const m of text.matchAll(/function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/g)) record(m[1], m[2]);
    for (const m of text.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\s*\*?\s*\(([^)]*)\)|\(([^)]*)\)\s*=>|([A-Za-z_$][\w$]*)\s*=>)/g)) {
      record(m[1], m[2] ?? m[3] ?? m[4] ?? '');
    }
  });
  return fns;
}

/** Assignment-tree listings in one source file, keyed for ALLOWED. */
export function assignmentListings(rel, rawSource) {
  const source = stripComments(rawSource);
  const scopes = topLevelScopes(source);
  const defs = scopes.map(({ text }) => bindings(text));
  const moduleScopes = scopes.map((s, i) => (/^\s*(?:export\s+)?(?:const|let|var)\s/.test(s.text) ? i : -1)).filter((i) => i >= 0);
  const fns = functions(scopes);
  const tainted = scopes.map(() => new Set());
  const moduleTainted = new Set();
  const isTainted = (expr, scope) => ASSIGNMENT_SEED.test(expr)
    || identifiers(expr).some((id) => tainted[scope].has(id) || moduleTainted.has(id));
  const calls = [];
  scopes.forEach(({ text }, scope) => {
    for (const name of fns.keys()) {
      for (const m of text.matchAll(new RegExp(`(?<![\\w$.])${escape(name)}\\s*\\(`, 'g'))) {
        calls.push({ name, scope, args: argumentText(text, m.index + m[0].length) });
      }
    }
  });
  for (let changed = true; changed;) {
    changed = false;
    const mark = (set, name) => { if (!set.has(name)) { set.add(name); changed = true; } };
    defs.forEach((scopeDefs, scope) => {
      for (const [name, exprs] of scopeDefs) {
        if (exprs.some((expr) => isTainted(expr, scope))) mark(moduleScopes.includes(scope) ? moduleTainted : tainted[scope], name);
      }
    });
    for (const { name, scope, args } of calls) {
      if (isTainted(args, scope)) for (const param of fns.get(name).params) mark(tainted[fns.get(name).scope], param);
    }
  }
  // Names derived from `name` in one scope, including itself.
  const derivedFrom = (name, scope) => {
    const set = new Set([name]);
    for (let grew = true; grew;) {
      grew = false;
      for (const [other, exprs] of defs[scope]) {
        if (!set.has(other) && exprs.some((expr) => identifiers(expr).some((id) => set.has(id)))) { set.add(other); grew = true; }
      }
    }
    return set;
  };
  const descendsIntoLayout = (arg, scope) => {
    const names = new Set(identifiers(arg).flatMap((id) => [...derivedFrom(id, scope)]));
    return scopes[scope].text.split('\n').some((line) => LAYOUT_MARKER.test(line) && identifiers(line).some((id) => names.has(id)));
  };
  // One-line helpers that hand a plain parameter straight to a primitive,
  // e.g. `const dirs = (dir) => { try { return fs.readdirSync(dir, ...) } ... }`.
  const wrappers = new Map();
  for (const [name, fn] of fns) {
    if (!fn.simple || !fn.params.length) continue;
    const head = new RegExp(`(?:function\\s*\\*?\\s*${escape(name)}\\s*\\(|\\b(?:const|let|var)\\s+${escape(name)}\\s*=)[^\\n]*`).exec(scopes[fn.scope].text);
    if (!head) continue;
    for (const m of head[0].matchAll(LIST_PRIMITIVE)) {
      if (fn.params.includes(firstArgument(argumentText(head[0], m.index + m[0].length)))) wrappers.set(name, fn);
    }
  }
  const found = new Set();
  const callee = new RegExp(`(?<![\\w$])(readdirSync|readdir|opendirSync|opendir${[...wrappers.keys()].map((w) => `|${escape(w)}`).join('')})\\s*\\(`, 'g');
  scopes.forEach(({ text }, scope) => {
    for (const m of text.matchAll(callee)) {
      if (/(?:function\s*\*?\s*|(?:const|let|var)\s+)$/.test(text.slice(Math.max(0, m.index - 20), m.index))) continue;
      const arg = firstArgument(argumentText(text, m.index + m[0].length));
      if (!arg) continue;
      // A one-line wrapper's own body lists its parameter; its call sites carry the path.
      if ([...wrappers.values()].some((fn) => fn.scope === scope && fn.params.includes(arg))) continue;
      if (isTainted(arg, scope) || descendsIntoLayout(arg, scope)) found.add(`${rel}: ${m[1]}(${collapse(arg)})`);
    }
  });
  return [...found];
}

function scanRepository() {
  const found = new Set();
  for (const file of sourceFiles()) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    if (rel === LAYOUT_OWNER) continue;
    for (const key of assignmentListings(rel, fs.readFileSync(file, 'utf8'))) found.add(key);
  }
  return found;
}

test('no assignment-tree directory listing exists outside the layout owner unless allow-listed with a reason', () => {
  const found = scanRepository();
  const unexpected = [...found].filter((key) => !ALLOWED.has(key)).sort();
  assert.deepEqual(unexpected, [], [
    'New directory listing(s) under .fgos/assignments outside assignment-layout.mjs:',
    ...unexpected.map((key) => `  ${key}`),
    'Assignments nest (unit/<seat>/<round>/runs/<attempt>); a private walker misses nested runs.',
    'Fix: enumerate through scanAssignmentLayout / listAssignmentRuns / findRunDir in',
    `${LAYOUT_OWNER}, or resolve one directory with assignmentDir(). If this listing truly`,
    'reads inside one already-resolved assignment/run directory (or a unit owner\'s own',
    'directory), add it to ALLOWED in this test with the reason it is not tree discovery.',
  ].join('\n'));
});

test('every allow-listed assignment listing still exists, so the allow-list cannot go stale', () => {
  const found = scanRepository();
  const stale = [...ALLOWED.keys()].filter((key) => !found.has(key)).sort();
  assert.deepEqual(stale, [], `Remove or update these ALLOWED entries; the listing they describe is gone or changed:\n${stale.join('\n')}`);
  for (const [key, reason] of ALLOWED) assert.ok(reason.trim().length > 0, `${key} needs a reason`);
});

test('detector recognizes direct, derived, wrapped and roots-loop listings and ignores unrelated directories', () => {
  const detect = (code) => assignmentListings('probe.mjs', code);
  assert.deepEqual(detect(`const base = path.join(fgosDir, 'assignments');\nfor (const id of fs.readdirSync(base)) {}`), ['probe.mjs: readdirSync(base)']);
  assert.deepEqual(detect(`const runs = path.join(fgosDir, '.fgos/assignments', id, 'runs');\nfs.readdirSync(runs);`), ['probe.mjs: readdirSync(runs)']);
  assert.deepEqual(
    detect(`const roots = [path.join(fgosDir, 'assignments'), legacy];\nfor (const r of roots) {\n  for (const e of fs.readdirSync(r)) {}\n}`),
    ['probe.mjs: readdirSync(r)'],
  );
  assert.deepEqual(
    detect(`const dirs = (dir) => fs.readdirSync(dir, { withFileTypes: true });\nconst base = path.join(root, '.fgos', 'assignments');\nfor (const id of dirs(base)) {}`),
    ['probe.mjs: dirs(base)'],
  );
  assert.deepEqual(
    detect(`function walk(dir) {\n  for (const e of fs.readdirSync(dir)) walk(path.join(dir, e));\n}\nwalk(path.join(fgosDir, 'assignments'));`),
    ['probe.mjs: readdirSync(dir)'],
  );
  assert.deepEqual(detect(`const dir = assignmentDir(fgosDir, id);\nawait fsp.readdir(dir);`), ['probe.mjs: readdir(dir)']);
  // Listing an unnamed directory and then descending into the run layout is a walk too.
  assert.deepEqual(
    detect(`export function seats(unitDir) {\n  for (const e of fs.readdirSync(unitDir)) {\n    const runs = path.join(unitDir, e.name, 'runs');\n  }\n}`),
    ['probe.mjs: readdirSync(unitDir)'],
  );
  assert.deepEqual(detect(`const d = path.join(root, 'workflow-runs');\nfs.readdirSync(d);\n// fs.readdirSync(path.join(x, 'assignments'))`), []);
});
