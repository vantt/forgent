// Every directory listing under `.fgos/assignments` must go through
// src/runner/dispatch/assignment-layout.mjs, which knows that assignments nest
// (`unit/<seat>/<round>/runs/<attempt>`), stops at `runs/`, and never follows
// symlinks. A private walker that only lists the top level silently misses
// nested runs, which is exactly how nested panel runs went unseen before.
//
// How the guard decides. Each source file is lexed first (comments blanked,
// strings, template literals and regex literals recognized), so a listing that
// follows an inline block comment is still code and a commented-out call is
// not. It then finds every call that lists a directory: readdir/readdirSync/
// opendir/opendirSync, glob/globSync, an import alias of any of them, and
// same-file one-line wrappers that pass their parameter straight to one. The
// call's path argument (every argument, for glob, whose `cwd` option carries
// the path) is followed back through same-file bindings: `const`/`let`/`var`
// definitions and plain assignments, including ones Prettier wraps over
// several lines; `for (... of <iterable>)` loop variables; the parameters of
// a callback handed to `<receiver>.forEach/map/...(...)`, which take the
// receiver's value; and the parameters of same-file functions and class or
// object methods, which take the value of every argument at their call sites.
// A listing is an assignment-tree listing when that derivation reaches the
// literal segment 'assignments' or an identifier/call named after an
// assignment directory, or when the listed directory is later joined with a
// run-layout segment ('runs', 'run.json', ...). A listing of a directory
// derived from `.fgos` itself is one too when it would descend into the tree:
// a `{ recursive: true }` listing, a listing inside a function that calls
// itself, or a worklist walker that pops its next directory off a stack.
//
// Every such listing outside assignment-layout.mjs must appear in ALLOWED,
// keyed by file, enclosing named function (`<module>` at top level) and the
// call text, with the EXACT number of times that call occurs there and the
// reason it is not a tree walker of its own. A new listing in an allow-listed
// function, a second walker under the same variable name, or a new function in
// an allow-listed file all change the count or the key and fail the guard.
//
// What the guard does NOT catch (it is a lexical analysis, not a type-aware
// one, so do not read a green run as proof that no private walker exists):
// - a path handed to a wrapper defined in ANOTHER file (parameters are only
//   followed within one file), or a path built in another file and imported;
// - a path spelled so that no literal contains the segment, such as
//   `'assign' + 'ments'`, or computed at runtime from data;
// - a primitive reached through a computed member (`fs['readdirSync']`),
//   `Reflect.apply`, `eval`, a worker thread, or a shell (`ls`, `find`) run
//   through child_process;
// - a callback whose path comes from something other than its receiver, for
//   example `walkWith(base, (dir) => fs.readdirSync(dir))` with `walkWith`
//   defined in another file;
// - a self-descending walker over `.fgos` that neither recurses by name, nor
//   lists recursively, nor pops a worklist.
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
const PRIMITIVES = ['readdirSync', 'readdir', 'opendirSync', 'opendir', 'globSync', 'glob'];
const GLOB_PRIMITIVE = /^glob(?:Sync)?$/;
// A path expression is assignment-tree derived when it names the segment or
// an assignment directory helper (assignmentDir, assignmentsDir, asgnDir...).
const ASSIGNMENT_SEED = /['"`][^'"`\n]*\bassignments\b[^'"`\n]*['"`]|\b(?:assignments?|asgn)\w*(?:Dir|Root|Base|Path)\w*\b|\bassignmentDir\b/i;
// A path expression is the state root when it ends at the `.fgos` segment or
// a `.fgos` directory helper (fgosDir, fgosDirFromRoot, resolveFgosDir...)
// with no further segment joined after it: `path.join(fgosDir, 'events')` is
// a subdirectory, not the root.
const STATE_SEED = /['"`](?:[^'"`\n]*\/)?\.fgos\/?['"`]|\b\w*(?:fgos|Fgos)\w*(?:Dir|Root|Path)\b/g;
// Segments that only the assignment layout uses: descending from a listed
// directory into one of these means the listing walks that layout.
const LAYOUT_MARKER = /['"`](?:runs|assignment\.json|result\.json|run\.json)['"`]/;
const CALLBACK_METHODS = 'forEach|map|flatMap|filter|some|every|find|findLast|reduce|then';

// Key: `<file>: <enclosing function>: <callee>(<first argument>)`, whitespace
// collapsed; `count` is how many times exactly that call occurs there. Each
// entry is an existing direct reader with a reason it is not a competing tree
// walker.
const ALLOWED = new Map([
  // Unit semantics (latest round, fallback seat, outcome mapping) belong to
  // the unit owner. It walks one known unit directory's seats and rounds, not
  // the assignments tree, and its nested shape is the layout's own shape.
  ['src/runner/execution/unit-run-history.mjs: readUnitRunSeats: readdirSync(unitDir)', { count: 1, reason: 'unit owner: seats of one known unit directory' }],
  ['src/runner/execution/unit-run-history.mjs: readUnitRunSeats: readdirSync(roleDir)', { count: 1, reason: 'unit owner: rounds of one known seat directory' }],
  ['src/runner/execution/unit-run-history.mjs: readUnitRunSeats: readdirSync(runsDir)', { count: 1, reason: 'unit owner: numbered attempts of one known round' }],
  // The unit summary writer shares the unit owner's seat/round rules to decide
  // whether a unit still has an attempt in flight.
  ['src/runner/execution/unit-summary.mjs: unitHasActiveRun: readdirSync(unitDir)', { count: 1, reason: 'unit owner: seats of one known unit directory' }],
  ['src/runner/execution/unit-summary.mjs: unitHasActiveRun: readdirSync(roleDir)', { count: 1, reason: 'unit owner: rounds of one known seat directory' }],
  ['src/runner/execution/unit-summary.mjs: unitHasActiveRun: readdirSync(runsDir)', { count: 1, reason: 'unit owner: attempts of one known round' }],
  // Unit summary backfill lists only top-level `unit-run-*` directories (units
  // are always top-level) and hands each one to the unit owner.
  ['scripts/backfill-unit-summaries.mjs: backfillUnitSummaries: readdirSync(root)', { count: 1, reason: 'unit discovery: top-level unit directories, delegated to the unit owner' }],
  // Assignment-id allocation: lists only immediate children to find ids that
  // share a newly minted flat id prefix. Nested unit ids never use that prefix.
  ['src/runner/dispatch/assignment.mjs: createAssignmentId: readdirSync(assignmentsDir)', { count: 1, reason: 'id allocation: top-level names sharing a new flat id prefix' }],
  // Work-driver gate evidence: flat work assignments only (work assignments are
  // never nested); restricted to dispatched attempts of a matching assignment.
  ['src/runner/operation-choice.mjs: findLatestAssignmentRunResult: readdirSync(assignmentsDir)', { count: 1, reason: 'work-driver gate evidence: flat work assignments only' }],
  ['src/runner/operation-choice.mjs: findLatestAssignmentRunResult: readdirSync(dispatchedDir)', { count: 1, reason: 'dispatch markers of one known assignment' }],
  ['src/runner/operation-choice.mjs: findLatestAssignmentRunResult: readdirSync(runsDir)', { count: 1, reason: 'attempts of one known assignment, filtered to dispatched markers' }],
  // Run-attempt admission and command queues of one already-resolved
  // assignment or run directory; never discovery across assignments.
  ['src/runner/dispatch/assignment-runner.mjs: admitRunAttempt: readdirSync(runsDir)', { count: 2, reason: 'attempt numbering and abandoned-staging cleanup of one resolved assignment' }],
  ['src/runner/dispatch/assignment-runner.mjs: executeAssignment: readdirSync(commandsDir)', { count: 1, reason: 'command queue of one resolved run' }],
  ['src/runner/dispatch/assignment-runner.mjs: isCliSpawnRunStillWorking: readdirSync(commandsDir)', { count: 1, reason: 'command queue of one resolved run' }],
  ['src/runner/dispatch/herdr-reconcile.mjs: reconcileHerdrSpawnRun: readdirSync(od)', { count: 1, reason: 'worker outbox of one resolved run' }],
  ['src/runner/dispatch/runtime-inspection.mjs: admissions: readdirSync(genDir)', { count: 1, reason: 'generation records of one resolved run' }],
  ['src/runner/dispatch/runtime-inspection.mjs: derivePhase: readdirSync(commandsDir)', { count: 1, reason: 'command queue of one resolved run' }],
  // Maintainer script: replays a coordination measurement corpus in a scratch
  // root. It lists the corpus's session directories (the detector sees the
  // assignments directories next to the corpus derived from the same path)
  // and copies its companion assignments; it never reads runs or reports run
  // visibility.
  ['scripts/measure-coordination-baseline.mjs: replayCorpusFromDirectory: readdirSync(corpusDir)', { count: 1, reason: 'session directories of a measurement corpus, not assignments' }],
  ['scripts/measure-coordination-baseline.mjs: replayCorpusFromDirectory: readdirSync(companionAssignmentsDir)', { count: 1, reason: 'corpus copy into a scratch root, not a run reader' }],
  // The test runner snapshots every file of the repository's `.fgos` store
  // before and after a suite to report leaked writes. It compares file
  // contents and never interprets assignments or runs.
  ['scripts/run-tests.mjs: walk: readdirSync(currentDir)', { count: 1, reason: 'whole-store file snapshot for leak detection, not a run reader' }],
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

const REGEX_AFTER_WORD = new Set(['return', 'typeof', 'case', 'in', 'of', 'new', 'delete', 'void', 'throw', 'else', 'do', 'yield', 'await', 'instanceof']);

/**
 * Two same-length views of a source file. `code` has comments blanked
 * (newlines kept) and everything else intact. `shape` also blanks the inside
 * of string, template and regex literals (template `${...}` code stays), so
 * brackets and separators inside literals never shift depth.
 */
export function lexSource(source) {
  const code = source.split('');
  const shape = source.split('');
  const blank = (view, from, to) => { for (let k = from; k < to; k++) if (view[k] !== '\n') view[k] = ' '; };
  const n = source.length;
  const templateResume = [];
  let braces = 0;
  let last = null; // previous significant token: { kind: 'punct'|'word'|'value', text }
  let i = 0;
  const scanTemplate = (from) => {
    let j = from;
    while (j < n) {
      if (source[j] === '\\') { j += 2; continue; }
      if (source[j] === '`') { blank(shape, from, j); return { end: j + 1, interpolation: false }; }
      if (source[j] === '$' && source[j + 1] === '{') { blank(shape, from, j); return { end: j + 2, interpolation: true }; }
      j++;
    }
    blank(shape, from, n);
    return { end: n, interpolation: false };
  };
  const enterTemplate = (from) => {
    const { end, interpolation } = scanTemplate(from);
    if (interpolation) { templateResume.push(braces); braces++; last = { kind: 'punct', text: '{' }; } else last = { kind: 'value' };
    return end;
  };
  while (i < n) {
    const c = source[i];
    const next = source[i + 1];
    if (c === '/' && next === '/') {
      let j = source.indexOf('\n', i);
      if (j < 0) j = n;
      blank(code, i, j); blank(shape, i, j); i = j; continue;
    }
    if (c === '/' && next === '*') {
      let j = source.indexOf('*/', i + 2);
      j = j < 0 ? n : j + 2;
      blank(code, i, j); blank(shape, i, j); i = j; continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && source[j] !== c && source[j] !== '\n') j += source[j] === '\\' ? 2 : 1;
      blank(shape, i + 1, Math.min(j, n));
      i = j + 1; last = { kind: 'value' }; continue;
    }
    if (c === '`') { i = enterTemplate(i + 1); continue; }
    if (c === '}' && templateResume.length && templateResume.at(-1) === braces - 1) {
      templateResume.pop(); braces--; i = enterTemplate(i + 1); continue;
    }
    if (c === '/') {
      const regexAllowed = !last
        || (last.kind === 'punct' && !')]}'.includes(last.text))
        || (last.kind === 'word' && REGEX_AFTER_WORD.has(last.text));
      if (regexAllowed) {
        let j = i + 1;
        let inClass = false;
        while (j < n && source[j] !== '\n') {
          if (source[j] === '\\') { j += 2; continue; }
          if (source[j] === '[') inClass = true;
          else if (source[j] === ']') inClass = false;
          else if (source[j] === '/' && !inClass) break;
          j++;
        }
        blank(shape, i + 1, Math.min(j, n));
        j++;
        while (j < n && /[a-z]/i.test(source[j])) j++;
        i = j; last = { kind: 'value' }; continue;
      }
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i + 1;
      while (j < n && /[\w$]/.test(source[j])) j++;
      const word = source.slice(i, j);
      last = REGEX_AFTER_WORD.has(word) ? { kind: 'word', text: word } : { kind: 'value' };
      i = j; continue;
    }
    if (/[0-9]/.test(c)) {
      let j = i + 1;
      while (j < n && /[\w.]/.test(source[j])) j++;
      i = j; last = { kind: 'value' }; continue;
    }
    if (c === '{') braces++;
    else if (c === '}') braces = Math.max(0, braces - 1);
    if (!/\s/.test(c)) last = { kind: 'punct', text: c };
    i++;
  }
  return { code: code.join(''), shape: shape.join('') };
}

const OPEN = '([{';
const CLOSE = ')]}';

// Index just past the bracket group that opens at `open` (shape view).
function closeOf(shape, open) {
  let depth = 0;
  for (let i = open; i < shape.length; i++) {
    if (OPEN.includes(shape[i])) depth++;
    else if (CLOSE.includes(shape[i]) && --depth === 0) return i + 1;
  }
  return shape.length;
}

// Index of the bracket that opens the group closing at `close` (shape view).
function openOf(shape, close) {
  let depth = 0;
  for (let i = close; i >= 0; i--) {
    if (CLOSE.includes(shape[i])) depth++;
    else if (OPEN.includes(shape[i]) && --depth === 0) return i;
  }
  return 0;
}

// The expression that starts at `from` (after `=` or `of`): it ends at `;`
// or `,` at depth 0, at a bracket that closes an enclosing group, or at a line
// break that does not continue the expression. Brackets may span lines.
function expressionEnd(shape, from) {
  let i = from;
  while (i < shape.length && /\s/.test(shape[i])) i++;
  let depth = 0;
  for (; i < shape.length; i++) {
    const c = shape[i];
    if (OPEN.includes(c)) depth++;
    else if (CLOSE.includes(c)) { if (depth === 0) return i; depth--; }
    else if (depth === 0 && (c === ';' || c === ',')) return i;
    else if (depth === 0 && c === '\n') {
      const before = shape.slice(from, i).trimEnd().slice(-1);
      const after = shape.slice(i).trimStart()[0] ?? '';
      if (!/[=+\-*/%&|?:.,(]/.test(before) && !/[.?:+\-*/%&|]/.test(after)) return i;
    }
  }
  return shape.length;
}

const collapse = (text) => text.replace(/\s+/g, ' ').trim();
const identifiers = (text) => text.match(/[A-Za-z_$][\w$]*/g) ?? [];
const escape = (name) => name.replace(/\$/g, '\\$');
const KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'with', 'await', 'typeof', 'new', 'import', 'super']);

/** Assignment-tree listings in one source file, one entry per call, keyed for ALLOWED. */
export function assignmentListings(rel, rawSource) {
  const { code, shape } = lexSource(rawSource);
  // Text of the argument list whose `(` is at `open`, comment-free; shape-measured.
  const argsAt = (open) => code.slice(open + 1, closeOf(shape, open) - 1);
  const firstArgAt = (open) => {
    const end = closeOf(shape, open) - 1;
    let depth = 0;
    for (let i = open + 1; i < end; i++) {
      if (OPEN.includes(shape[i])) depth++;
      else if (CLOSE.includes(shape[i])) depth--;
      else if (shape[i] === ',' && depth === 0) return code.slice(open + 1, i).trim();
    }
    return code.slice(open + 1, end).trim();
  };

  // Top-level statements are the binding scopes; names resolve within a scope
  // plus module-level constants.
  const scopes = [];
  {
    let depth = 0;
    let offset = 0;
    for (const line of shape.split('\n')) {
      if (depth === 0 && line.trim() && !/^[\s})\].]/.test(line)) {
        if (scopes.length) scopes.at(-1).end = offset;
        scopes.push({ start: offset, end: shape.length });
      }
      for (const c of line) {
        if (OPEN.includes(c)) depth++;
        else if (CLOSE.includes(c)) depth = Math.max(0, depth - 1);
      }
      offset += line.length + 1;
    }
  }
  const scopeOf = (index) => Math.max(0, scopes.findIndex((s) => index >= s.start && index < s.end));
  const moduleScopes = new Set(scopes.map((s, i) => (/^\s*(?:export\s+)?(?:const|let|var)\s/.test(code.slice(s.start, s.end)) ? i : -1)).filter((i) => i >= 0));

  // Bindings: name -> expressions it may hold, per scope. A callback's
  // parameters are kept apart: they carry a path into the callback, but an
  // entry name handed to `.filter((f) => ...)` is not a directory descended into.
  const defs = scopes.map(() => new Map());
  const callbackDefs = scopes.map(() => new Map());
  const bind = (index, name, expr, into = defs) => {
    const scopeDefs = into[scopeOf(index)];
    if (!scopeDefs.has(name)) scopeDefs.set(name, []);
    scopeDefs.get(name).push(expr);
  };
  const patternNames = (pattern) => (/^[{[]/.test(pattern) ? identifiers(pattern.replace(/[A-Za-z_$][\w$]*\s*:/g, '').replace(/=[^,}\]]*/g, '')) : [pattern]);
  const patternAt = (from) => {
    let i = from;
    while (/\s/.test(shape[i] ?? '')) i++;
    if (shape[i] === '{' || shape[i] === '[') { const end = closeOf(shape, i); return { text: code.slice(i, end), end }; }
    const m = /^[A-Za-z_$][\w$]*/.exec(code.slice(i, i + 200));
    return m ? { text: m[0], end: i + m[0].length } : null;
  };
  for (const m of shape.matchAll(/\b(?:const|let|var)\s+/g)) {
    const pattern = patternAt(m.index + m[0].length);
    if (!pattern) continue;
    const eq = /^\s*=(?![=>])/.exec(shape.slice(pattern.end, pattern.end + 50));
    if (eq) {
      const from = pattern.end + eq[0].length;
      for (const name of patternNames(pattern.text)) bind(m.index, name, code.slice(from, expressionEnd(shape, from)));
      continue;
    }
    const of = /^\s+of\s+/.exec(shape.slice(pattern.end, pattern.end + 50));
    if (of) {
      const from = pattern.end + of[0].length;
      for (const name of patternNames(pattern.text)) bind(m.index, name, code.slice(from, expressionEnd(shape, from)));
    }
  }
  for (const m of shape.matchAll(/(?:^|[;{}\n(,])\s*([A-Za-z_$][\w$]*)\s*=(?![=>])/g)) {
    const from = m.index + m[0].length;
    bind(m.index, m[1], code.slice(from, expressionEnd(shape, from)));
  }
  // `<receiver>.forEach((d) => ...)`: the callback's parameters take the receiver's value.
  const receiverBefore = (dot) => {
    let j = dot - 1;
    while (j >= 0 && /\s/.test(shape[j])) j--;
    while (j >= 0) {
      if (shape[j] === ')' || shape[j] === ']') { j = openOf(shape, j) - 1; continue; }
      if (/[\w$.?]/.test(shape[j])) { j--; continue; }
      break;
    }
    return code.slice(j + 1, dot);
  };
  const callbackHead = new RegExp(`\\.\\s*(?:${CALLBACK_METHODS})\\s*\\(\\s*(?:async\\s*)?(?:function\\s*\\*?\\s*[\\w$]*\\s*\\(|\\(|([A-Za-z_$][\\w$]*)\\s*=>)`, 'g');
  for (const m of shape.matchAll(callbackHead)) {
    const receiver = receiverBefore(m.index);
    let params = [];
    if (m[1]) params = [m[1]];
    else {
      const open = m.index + m[0].length - 1;
      params = patternNames(code.slice(open + 1, closeOf(shape, open) - 1).trim()).flatMap((p) => identifiers(p.replace(/=.*$/s, '')));
    }
    for (const param of params) bind(m.index, param, receiver, callbackDefs);
  }

  // Same-file functions and methods: name -> { params, regions }.
  const fns = new Map();
  const regions = [];
  const definitionAt = new Set();
  const addFunction = (name, nameIndex, paramOpen, kind) => {
    const paramClose = closeOf(shape, paramOpen);
    const params = identifiers(code.slice(paramOpen + 1, paramClose - 1).replace(/=[^,)]*/g, '').replace(/[A-Za-z_$][\w$]*\s*:/g, ''));
    let bodyStart = paramClose;
    while (bodyStart < shape.length && /\s/.test(shape[bodyStart])) bodyStart++;
    if (kind === 'arrow') {
      const arrow = /^=>\s*/.exec(shape.slice(bodyStart, bodyStart + 20));
      if (arrow) bodyStart += arrow[0].length;
    }
    const end = shape[bodyStart] === '{' ? closeOf(shape, bodyStart) : expressionEnd(shape, bodyStart);
    if (!fns.has(name)) fns.set(name, { params: [], simple: true, heads: [] });
    const fn = fns.get(name);
    fn.params.push(...params);
    fn.simple &&= !/[{[=]/.test(code.slice(paramOpen + 1, paramClose - 1));
    fn.heads.push({ start: nameIndex, paramOpen, paramClose, end, params, kind, scope: scopeOf(nameIndex) });
    definitionAt.add(nameIndex);
    regions.push({ name, start: nameIndex, end });
  };
  for (const m of shape.matchAll(/\bfunction\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/g)) {
    addFunction(m[1], m.index + m[0].indexOf(m[1], 8), m.index + m[0].length - 1, 'function');
  }
  for (const m of shape.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\s*\*?\s*[\w$]*\s*\(|\(|([A-Za-z_$][\w$]*)\s*=>)/g)) {
    const nameIndex = m.index + m[0].indexOf(m[1]);
    if (m[2]) {
      const paramIndex = m.index + m[0].lastIndexOf(m[2]);
      const end = expressionEnd(shape, m.index + m[0].length);
      const bodyStart = m.index + m[0].length;
      const bodyEnd = shape.slice(bodyStart).trimStart()[0] === '{' ? closeOf(shape, shape.indexOf('{', bodyStart)) : end;
      if (!fns.has(m[1])) fns.set(m[1], { params: [], simple: true, heads: [] });
      const fn = fns.get(m[1]);
      fn.params.push(m[2]);
        fn.heads.push({ start: nameIndex, paramOpen: paramIndex, paramClose: paramIndex + m[2].length, end: bodyEnd, params: [m[2]], scope: scopeOf(nameIndex) });
      definitionAt.add(nameIndex);
      regions.push({ name: m[1], start: nameIndex, end: bodyEnd });
      continue;
    }
    const open = m.index + m[0].length - 1;
    // `const f = (x)` is an arrow only when `=>` follows the parameter list.
    const isFunctionKeyword = /function\s*\*?\s*[\w$]*\s*\($/.test(m[0]);
    if (!isFunctionKeyword && !/^\s*=>/.test(shape.slice(closeOf(shape, open), closeOf(shape, open) + 10))) continue;
    addFunction(m[1], nameIndex, open, isFunctionKeyword ? 'function' : 'arrow');
  }
  // Class and object-literal methods: `name(params) {`, with optional modifiers.
  for (const m of shape.matchAll(/(?:^|[\n;{},])\s*(?:(?:static|async|get|set)\s+|\*\s*)*([A-Za-z_$][\w$]*)\s*\(/g)) {
    if (KEYWORDS.has(m[1])) continue;
    const open = m.index + m[0].length - 1;
    const close = closeOf(shape, open);
    if (!/^\s*\{/.test(shape.slice(close, close + 20))) continue;
    addFunction(m[1], m.index + m[0].lastIndexOf(m[1]), open, 'method');
  }
  for (const fn of fns.values()) {
    for (const head of fn.heads) {
      head.nested = head.kind !== 'method' && regions.some((r) => r.start < head.start && head.start < r.end);
    }
  }
  // Import aliases of a listing primitive: `import { readdirSync as ls }`, `const { readdirSync: ls } = fs`.
  const primitives = new Set(PRIMITIVES);
  for (const m of code.matchAll(/\b(readdirSync|readdir|opendirSync|opendir|globSync|glob)\s+as\s+([A-Za-z_$][\w$]*)/g)) primitives.add(m[2]);
  for (const m of code.matchAll(/\b(readdirSync|readdir|opendirSync|opendir|globSync|glob)\s*:\s*([A-Za-z_$][\w$]*)\s*[,}]/g)) primitives.add(m[2]);
  const isGlob = (callee) => GLOB_PRIMITIVE.test(callee) || [...code.matchAll(/\b(globSync|glob)\s+as\s+([A-Za-z_$][\w$]*)/g)].some((m) => m[2] === callee);

  // Call sites of same-file functions and methods (method calls are `.name(`).
  const calls = [];
  for (const [name] of fns) {
    for (const m of shape.matchAll(new RegExp(`(?<![\\w$])${escape(name)}\\s*\\(`, 'g'))) {
      if (definitionAt.has(m.index)) continue;
      calls.push({ name, index: m.index, args: argsAt(m.index + m[0].length - 1) });
    }
  }

  // Fixed-point taint of names reached from a seed, per scope plus module level.
  // With `endsThere`, an expression only counts when nothing quoted follows the
  // last seed or tainted name in it (a joined segment leaves the root).
  const taintFrom = (seed, { endsThere = false } = {}) => {
    const tainted = scopes.map(() => new Set());
    const moduleTainted = new Set();
    const isTainted = (expr, scope) => {
      const hit = (id) => tainted[scope].has(id) || moduleTainted.has(id);
      if (!endsThere) return new RegExp(seed.source, seed.flags.replace('g', '')).test(expr) || identifiers(expr).some(hit);
      let last = -1;
      for (const m of expr.matchAll(new RegExp(seed.source, 'g'))) last = Math.max(last, m.index + m[0].length);
      for (const m of expr.matchAll(/(?<![\w$.])[A-Za-z_$][\w$]*/g)) if (hit(m[0])) last = Math.max(last, m.index + m[0].length);
      return last >= 0 && !/['"`]/.test(expr.slice(last));
    };
    for (let changed = true; changed;) {
      changed = false;
      const mark = (set, name) => { if (!set.has(name)) { set.add(name); changed = true; } };
      for (const all of [defs, callbackDefs]) {
        all.forEach((scopeDefs, scope) => {
          for (const [name, exprs] of scopeDefs) {
            if (exprs.some((expr) => isTainted(expr, scope))) mark(moduleScopes.has(scope) ? moduleTainted : tainted[scope], name);
          }
        });
      }
      for (const { name, index, args } of calls) {
        const scope = scopeOf(index);
        if (!isTainted(args, scope)) continue;
        // A call reaches a definition in its own top-level statement when
        // there is one (two nested helpers may share a name), else the ones
        // callable from anywhere: top-level functions and methods.
        const heads = fns.get(name).heads;
        const local = heads.filter((head) => head.scope === scope);
        for (const head of local.length ? local : heads.filter((h) => !h.nested)) for (const param of head.params) mark(tainted[head.scope], param);
      }
    }
    return isTainted;
  };
  const fromAssignments = taintFrom(ASSIGNMENT_SEED);
  const fromState = taintFrom(STATE_SEED, { endsThere: true });

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
  const scopeText = (scope) => code.slice(scopes[scope].start, scopes[scope].end);
  const descendsIntoLayout = (arg, scope) => {
    const names = new Set(identifiers(arg).flatMap((id) => [...derivedFrom(id, scope)]));
    return scopeText(scope).split('\n').some((line) => LAYOUT_MARKER.test(line) && identifiers(line).some((id) => names.has(id)));
  };
  const enclosing = (index) => {
    let best = null;
    for (const region of regions) {
      if (index > region.start && index < region.end && (!best || region.end - region.start < best.end - best.start)) best = region;
    }
    return best;
  };
  // A walker that descends by itself: it calls its own function, or pops the
  // next directory off a worklist.
  const descendsByItself = (arg, index, scope) => {
    const region = enclosing(index);
    if (region) {
      const body = shape.slice(region.start, region.end);
      const selfCalls = [...body.matchAll(new RegExp(`(?<![\\w$])${escape(region.name)}\\s*\\(`, 'g'))].length;
      if (selfCalls > 1) return true;
    }
    return identifiers(arg).some((id) => (defs[scope].get(id) ?? []).some((expr) => /\.\s*(?:pop|shift)\s*\(\s*\)/.test(expr)));
  };

  // One-line helpers that hand a plain parameter straight to a primitive,
  // e.g. `const dirs = (dir) => { try { return fs.readdirSync(dir, ...) } ... }`.
  const wrappers = new Map();
  for (const [name, fn] of fns) {
    if (!fn.simple || !fn.params.length || fn.heads.length !== 1) continue;
    const head = fn.heads[0];
    const lineEnd = shape.indexOf('\n', head.start);
    const line = shape.slice(head.start, lineEnd < 0 ? shape.length : lineEnd);
    for (const m of line.matchAll(new RegExp(`(?<![\\w$])(?:${[...primitives].map(escape).join('|')})\\s*\\(`, 'g'))) {
      if (fn.params.includes(firstArgAt(head.start + m.index + m[0].length - 1))) wrappers.set(name, head);
    }
  }

  const found = [];
  const callees = [...primitives, ...wrappers.keys()].map(escape).join('|');
  for (const m of shape.matchAll(new RegExp(`(?<![\\w$])(${callees})\\s*\\(`, 'g'))) {
    if (definitionAt.has(m.index)) continue;
    const open = m.index + m[0].length - 1;
    const arg = firstArgAt(open);
    if (!arg) continue;
    const scope = scopeOf(m.index);
    // A one-line wrapper's own body lists its parameter; its call sites carry the path.
    if ([...wrappers.values()].some((head) => m.index > head.start && m.index < head.end
      && identifiers(code.slice(head.paramOpen, head.paramClose)).includes(arg))) continue;
    const args = argsAt(open);
    const listsAssignments = isGlob(m[1])
      ? fromAssignments(args, scope)
      : fromAssignments(arg, scope) || descendsIntoLayout(arg, scope);
    const walksState = !listsAssignments && fromState(isGlob(m[1]) ? args : arg, scope)
      && (/\brecursive\s*:\s*(?!false\b)/.test(args) || (isGlob(m[1]) && /\*\*/.test(args)) || descendsByItself(arg, m.index, scope));
    if (listsAssignments || walksState) found.push(`${rel}: ${enclosing(m.index)?.name ?? '<module>'}: ${m[1]}(${collapse(arg)})`);
  }
  return found;
}

function scanRepository() {
  const counts = new Map();
  for (const file of sourceFiles()) {
    const rel = path.relative(root, file).split(path.sep).join('/');
    if (rel === LAYOUT_OWNER) continue;
    for (const key of assignmentListings(rel, fs.readFileSync(file, 'utf8'))) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

test('no assignment-tree directory listing exists outside the layout owner unless allow-listed with its exact count and a reason', () => {
  const found = scanRepository();
  const unexpected = [...found]
    .filter(([key, count]) => count > (ALLOWED.get(key)?.count ?? 0))
    .map(([key, count]) => (ALLOWED.has(key) ? `  ${key}  (found ${count}, allowed ${ALLOWED.get(key).count})` : `  ${key}  (found ${count}, not allowed)`))
    .sort();
  assert.deepEqual(unexpected, [], [
    'New directory listing(s) under .fgos/assignments outside assignment-layout.mjs:',
    ...unexpected,
    'Assignments nest (unit/<seat>/<round>/runs/<attempt>); a private walker misses nested runs.',
    'Fix: enumerate through scanAssignmentLayout / listAssignmentRuns / findRunDir in',
    `${LAYOUT_OWNER}, or resolve one directory with assignmentDir(). If this listing truly`,
    'reads inside one already-resolved assignment/run directory (or a unit owner\'s own',
    'directory), add it to ALLOWED in this test (or raise its count) with the reason it is',
    'not tree discovery. A second listing in an allow-listed function needs its own review.',
  ].join('\n'));
});

test('every allow-listed assignment listing still exists with its count, so the allow-list cannot go stale', () => {
  const found = scanRepository();
  const stale = [...ALLOWED]
    .filter(([key, { count }]) => (found.get(key) ?? 0) < count)
    .map(([key, { count }]) => `${key}  (allowed ${count}, found ${found.get(key) ?? 0})`)
    .sort();
  assert.deepEqual(stale, [], `Remove or update these ALLOWED entries; the listing they describe is gone, moved or changed:\n${stale.join('\n')}`);
  for (const [key, { count, reason }] of ALLOWED) {
    assert.ok(Number.isInteger(count) && count > 0, `${key} needs a positive count`);
    assert.ok(reason.trim().length > 0, `${key} needs a reason`);
  }
});

test('detector recognizes direct, derived, wrapped and roots-loop listings and ignores unrelated directories', () => {
  const detect = (code) => assignmentListings('probe.mjs', code);
  assert.deepEqual(detect(`const base = path.join(fgosDir, 'assignments');\nfor (const id of fs.readdirSync(base)) {}`), ['probe.mjs: <module>: readdirSync(base)']);
  assert.deepEqual(detect(`const runs = path.join(fgosDir, '.fgos/assignments', id, 'runs');\nfs.readdirSync(runs);`), ['probe.mjs: <module>: readdirSync(runs)']);
  assert.deepEqual(
    detect(`const roots = [path.join(fgosDir, 'assignments'), legacy];\nfor (const r of roots) {\n  for (const e of fs.readdirSync(r)) {}\n}`),
    ['probe.mjs: <module>: readdirSync(r)'],
  );
  assert.deepEqual(
    detect(`const dirs = (dir) => fs.readdirSync(dir, { withFileTypes: true });\nconst base = path.join(root, '.fgos', 'assignments');\nfor (const id of dirs(base)) {}`),
    ['probe.mjs: <module>: dirs(base)'],
  );
  assert.deepEqual(
    detect(`function walk(dir) {\n  for (const e of fs.readdirSync(dir)) walk(path.join(dir, e));\n}\nwalk(path.join(fgosDir, 'assignments'));`),
    ['probe.mjs: walk: readdirSync(dir)'],
  );
  assert.deepEqual(detect(`function f(id) {\n  const dir = assignmentDir(fgosDir, id);\n  return fsp.readdir(dir);\n}`), ['probe.mjs: f: readdir(dir)']);
  // Listing an unnamed directory and then descending into the run layout is a walk too.
  assert.deepEqual(
    detect(`export function seats(unitDir) {\n  for (const e of fs.readdirSync(unitDir)) {\n    const runs = path.join(unitDir, e.name, 'runs');\n  }\n}`),
    ['probe.mjs: seats: readdirSync(unitDir)'],
  );
  assert.deepEqual(detect(`const d = path.join(root, 'workflow-runs');\nfs.readdirSync(d);\n// fs.readdirSync(path.join(x, 'assignments'))`), []);
});

test('detector keys each listing by its enclosing function and reports every occurrence', () => {
  const detect = (code) => assignmentListings('probe.mjs', code);
  const twice = `function a(fgosDir) {\n  const base = path.join(fgosDir, 'assignments');\n  fs.readdirSync(base);\n  fs.readdirSync(base);\n}\nfunction b(fgosDir) {\n  const base = path.join(fgosDir, 'assignments');\n  return fs.readdirSync(base);\n}`;
  assert.deepEqual(detect(twice), ['probe.mjs: a: readdirSync(base)', 'probe.mjs: a: readdirSync(base)', 'probe.mjs: b: readdirSync(base)']);
  // An anonymous callback is attributed to the named function around it.
  assert.deepEqual(
    detect(`export function scan(fgosDir) {\n  return ids.map((id) => fs.readdirSync(path.join(fgosDir, 'assignments', id)));\n}`),
    ["probe.mjs: scan: readdirSync(path.join(fgosDir, 'assignments', id))"],
  );
});

test('detector follows multi-line bindings, callback and method parameters, globs, aliases and recursive state walks', () => {
  const detect = (code) => assignmentListings('probe.mjs', code);
  // Prettier wraps a long path.join over several lines.
  assert.deepEqual(detect(`function f(root) {\n  const base = path.join(\n    root,\n    '.fgos',\n    'assignments',\n  );\n  return fs.readdirSync(base);\n}`), ['probe.mjs: f: readdirSync(base)']);
  assert.deepEqual(detect(`function f(root) {\n  const base =\n    path.join(root, 'assignments');\n  return fs.readdirSync(base);\n}`), ['probe.mjs: f: readdirSync(base)']);
  // A callback's parameter takes its receiver's value.
  assert.deepEqual(
    detect(`function f(fgosDir) {\n  [path.join(fgosDir, 'assignments'), other].forEach((d) => fs.readdirSync(d));\n}`),
    ['probe.mjs: f: readdirSync(d)'],
  );
  assert.deepEqual(detect(`function f(dirs) {\n  dirs.assignmentsDirs.map(function (d) { return fs.readdirSync(d); });\n}`), ['probe.mjs: f: readdirSync(d)']);
  // A class method's parameter takes the value of its call sites.
  assert.deepEqual(
    detect(`class Scanner {\n  list(dir) {\n    const out = [];\n    for (const e of fs.readdirSync(dir)) out.push(e);\n    return out;\n  }\n}\nnew Scanner().list(path.join(fgosDir, 'assignments'));`),
    ['probe.mjs: list: readdirSync(dir)'],
  );
  // Globs carry the directory in their options or their pattern.
  assert.deepEqual(detect(`function f(fgosDir) {\n  return fs.globSync('**/result.json', { cwd: path.join(fgosDir, 'assignments') });\n}`), ["probe.mjs: f: globSync('**/result.json')"]);
  assert.deepEqual(detect(`async function f() {\n  for await (const p of fsp.glob('.fgos/assignments/**/run.json')) {}\n}`), ["probe.mjs: f: glob('.fgos/assignments/**/run.json')"]);
  assert.deepEqual(detect(`function f(root) {\n  return fs.globSync('**/*.json', { cwd: path.join(root, '.fgos') });\n}`), ["probe.mjs: f: globSync('**/*.json')"]);
  // An import alias of a primitive is still a primitive.
  assert.deepEqual(detect(`import { readdirSync as ls } from 'node:fs';\nfunction f(fgosDir) {\n  return ls(path.join(fgosDir, 'assignments'));\n}`), ["probe.mjs: f: ls(path.join(fgosDir, 'assignments'))"]);
  // Walking the whole state root descends into assignments.
  assert.deepEqual(
    detect(`function f(root) {\n  return fs.readdirSync(path.join(root, '.fgos'), { recursive: true }).filter((p) => p.startsWith('assignments/'));\n}`),
    ["probe.mjs: f: readdirSync(path.join(root, '.fgos'))"],
  );
  assert.deepEqual(detect(`function walk(dir) {\n  for (const e of fs.readdirSync(dir)) walk(path.join(dir, e));\n}\nwalk(fgosDir);`), ['probe.mjs: walk: readdirSync(dir)']);
  assert.deepEqual(
    detect(`function f(fgosDir) {\n  const stack = [fgosDir];\n  while (stack.length) {\n    const dir = stack.pop();\n    for (const e of fs.readdirSync(dir)) stack.push(path.join(dir, e));\n  }\n}`),
    ['probe.mjs: f: readdirSync(dir)'],
  );
  // A flat listing of the state root, or a walk of another subtree of it, is not an assignments walk.
  assert.deepEqual(detect(`function f(fgosDir) {\n  return fs.readdirSync(path.join(fgosDir, 'events'));\n}`), []);
  assert.deepEqual(detect(`function f(fgosDir) {\n  return fs.readdirSync(fgosDir);\n}`), []);
  assert.deepEqual(
    detect(`function f(cwd) {\n  const dirs = [path.join(cwd, '.fgos', 'coordination-protocols')];\n  function scan(dir) {\n    for (const e of fs.readdirSync(dir)) scan(path.join(dir, e));\n  }\n  for (const d of dirs) scan(d);\n}`),
    [],
  );
  // Two nested helpers sharing a name each take only their own call sites' values.
  assert.deepEqual(
    detect(`function a(other) {\n  function walk(dir) { return fs.readdirSync(dir); }\n  return walk(other);\n}\nfunction b(fgosDir) {\n  function walk(d) {\n    return fs.readdirSync(d);\n  }\n  return walk(path.join(fgosDir, 'assignments'));\n}`),
    ['probe.mjs: walk: readdirSync(d)'],
  );
});

test('lexer: comments never hide code and never create it', () => {
  const detect = (code) => assignmentListings('probe.mjs', code);
  assert.deepEqual(detect(`const base = path.join(fgosDir, 'assignments');\n/* note */ fs.readdirSync(base);`), ['probe.mjs: <module>: readdirSync(base)']);
  assert.deepEqual(detect(`const base = path.join(fgosDir, 'assignments');\n/*\n * fs.readdirSync(base);\n */\nconst url = 'http://x//y'; fs.readdirSync(base);`), ['probe.mjs: <module>: readdirSync(base)']);
  assert.deepEqual(detect(`const base = path.join(fgosDir, 'assignments');\nconst re = /\\/*x/; // fs.readdirSync(base)\nconst s = \`\${a}/* not a comment */\`;`), []);
  const { code } = lexSource(`a /* b */ c // d\n'e // f' \`g \${h /* i */} j\``);
  assert.equal(code, `a         c     \n'e // f' \`g \${h        } j\``);
});
