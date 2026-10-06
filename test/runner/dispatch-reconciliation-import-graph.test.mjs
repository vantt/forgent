import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

// Real transitive static-import graph walk: lex each visited file (comments
// blanked, string/template/regex literals recognized), find its own static
// `import` and `export ... from` statements wherever they sit, and recurse into
// whatever they resolve to. This is NOT a name/regex text-scan of arbitrary
// repo files -- a shallow scan limited to reconciliation-planner.mjs's own
// source alone would have missed a two-hop static
// re-export (visibility-session.mjs used to re-export reconcileHerdrSpawnRun
// from herdr-round.mjs at its top level) that pulled the whole cli-spawn
// process-control adapter chain into this graph transitively, even though
// reconciliation-planner.mjs's own file never names any of those symbols.
// That re-export was dead code (verified: nothing in the repo imports
// reconcileHerdrSpawnRun from visibility-session.mjs's own path, only
// directly from herdr-round.mjs) and is removed as part of this same fix --
// this test is what proves the removal actually closed the gap, and what
// catches any future re-introduction.
//
// No subtree is cut off: the walk goes through every static import, including
// run-result.mjs and provider-capacity.mjs, which earlier versions of this
// test treated as leaves. That carve-out had gone stale -- provider-capacity.mjs
// had gained relative imports (provider-adapter, process-identity and, at one
// point, liveness.mjs, a banned module) while the comment still said it had
// none. Walking through them is what keeps that from happening again.
//
// What this proves and what it does not:
// - The static closure (what loading reconcile.mjs and reconciliation-planner.mjs
//   evaluates) is exactly `expected`, and a child Node process that really
//   imports both modules, recording every module its loader hook sees, loads
//   exactly that set plus allowed builtins. A load form the lexer cannot see
//   (createRequire, an absolute or package self-reference specifier, top-level
//   `await import(...)`) still shows up in the runtime set.
// - Dynamic `import()` inside a function is NOT followed, and the runtime
//   check only loads the modules; it calls nothing. visibility-session.mjs's
//   exported reconcileRun lazily imports herdr-round.mjs and
//   assignment-runner.mjs (both banned here); its only caller today is the
//   state read verb, not reconcile. Nothing in this test stops a future
//   reconcile change from calling reconcileRun -- the lazy edges are only
//   pinned below as a tripwire, so a new or changed one gets reviewed.
// - The banned-call scan is lexical defense in depth over the closure's own
//   code; an alias it cannot see (for example a kill function handed in as an
//   argument from outside the closure) is not caught by it.
const STATIC_IMPORT_RE = /(?<![\w$.])import(?=\s*['"{*\w$])(?!\s*\()|(?<![\w$.])export(?=\s*[*{])/g;
const IMPORT_FROM_RE = /^import\s*(?:[\w$]+\s*,?\s*)?(?:\*\s*as\s+[\w$]+|\{[^}]*\})?\s*from\s*(?=['"])|^import\s*(?=['"])|^export\s*(?:\*(?:\s*as\s+[\w$]+)?|\{[^}]*\})\s*from\s*(?=['"])/;
const DYNAMIC_IMPORT_RE = /(?<![\w$.])import\s*\(\s*(['"`])([^'"`]+)\1/g;

const REGEX_AFTER_WORD = new Set(['return', 'typeof', 'case', 'in', 'of', 'new', 'delete', 'void', 'throw', 'else', 'do', 'yield', 'await', 'instanceof']);

/**
 * Two same-length views of a source file. `code` has comments blanked
 * (newlines kept) and everything else intact. `shape` also blanks the inside
 * of string, template and regex literals (template `${...}` code stays), so
 * nothing inside a literal is mistaken for a statement.
 */
export function lexSource(source) {
  const code = source.split('');
  const shape = source.split('');
  const blank = (view, from, to) => { for (let k = from; k < to; k++) if (view[k] !== '\n') view[k] = ' '; };
  const n = source.length;
  const templateResume = [];
  let braces = 0;
  let last = null;
  let i = 0;
  const enterTemplate = (from) => {
    let j = from;
    while (j < n) {
      if (source[j] === '\\') { j += 2; continue; }
      if (source[j] === '`') { blank(shape, from, j); last = { kind: 'value' }; return j + 1; }
      if (source[j] === '$' && source[j + 1] === '{') {
        blank(shape, from, j);
        templateResume.push(braces); braces++; last = { kind: 'punct', text: '{' };
        return j + 2;
      }
      j++;
    }
    blank(shape, from, n);
    return n;
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
    if (c === '/' && (!last || (last.kind === 'punct' && !')]}'.includes(last.text)) || (last.kind === 'word' && REGEX_AFTER_WORD.has(last.text)))) {
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

/** Static import/re-export specifiers and dynamic import() specifiers of one source text. */
export function moduleSpecifiers(source) {
  const { code, shape } = lexSource(source);
  const staticSpecifiers = [];
  for (const m of shape.matchAll(STATIC_IMPORT_RE)) {
    const head = IMPORT_FROM_RE.exec(shape.slice(m.index));
    if (!head) continue;
    const quote = m.index + head[0].length;
    const end = code.indexOf(code[quote], quote + 1);
    staticSpecifiers.push(code.slice(quote + 1, end));
  }
  const dynamicSpecifiers = [...code.matchAll(DYNAMIC_IMPORT_RE)]
    .filter((m) => shape.slice(m.index, m.index + 6) === 'import')
    .map((m) => m[2]);
  return { staticSpecifiers, dynamicSpecifiers };
}

// Concrete modules -- named explicitly, each confirmed by direct reading, not
// by guessing at names -- that implement process-control, retry/relaunch,
// admission, resume/reattach, reassignment, cancellation, or takeover. This
// list documents exactly what the walk below must never reach; the walk's
// own exact-set assertion further down is the load-bearing proof, this is
// the human-readable cross-check for it.
const BANNED_FILES = [
  'src/runner/dispatch/detached-run-supervisor.mjs', // process-control adapter: child_process.spawn, worker PGID signalling, receipt publication
  'src/runner/dispatch/herdr-round.mjs', // process-control: prepares/briefs/signals one interactive herdr round
  'src/runner/dispatch/herdr-agent.mjs', // herdr client: spawns/queries live herdr panes
  'src/runner/dispatch/worker-home.mjs', // creates/removes a spawned worker's confined home directory
  'src/runner/dispatch/trust-store.mjs', // seeds trust for a spawned worker
  'src/runner/dispatch/worker-session-boot.mjs', // resume/reattach: ensures a live worker session exists
  'src/runner/dispatch/liveness.mjs', // process-control signal ladder / pane-fate escalation
  'src/runner/dispatch/assignment-runner.mjs', // launch/execution and Run-lifecycle driving
  'src/runner/dispatch/plan.mjs', // admission: DispatchPlan compiler, Run generation admission
  'src/runner/dispatch/recovery-planner.mjs', // resume/reassign/retry recommendation planning
  'src/runner/recovery.mjs', // retry decision matrix
  'src/verbs/dispatch/recover.mjs', // recovery verb: observes/applies resume/reassign for a standalone Run
  'src/runner/claim-port.mjs', // work-item claim admission gate
  'src/runner/dispatch/run-lock.mjs', // run-lock ledger writer
  'src/runner/dispatch/confinement/policies.mjs', // worker confinement policy for a spawned process
  'src/runner/dispatch/confinement/bypass-pairing.mjs', // confinement bypass pairing for a spawned process
].map((p) => path.join(root, p));

for (const banned of BANNED_FILES) {
  test(`banned-module sanity: ${path.relative(root, banned)} exists on disk (keeps the banned list honest, not fictional)`, () => {
    assert.equal(fs.existsSync(banned), true, `expected ${banned} to exist -- update BANNED_FILES if this module moved`);
  });
}

// Builtins the closure may load. Process creation (child_process, cluster)
// and anything else is refused, whichever way it is spelled.
const ALLOWED_BUILTINS = new Set(['fs', 'path', 'crypto', 'os', 'async_hooks', 'worker_threads', 'url', 'util']);
const builtinName = (specifier) => specifier.replace(/^node:/, '').split('/')[0];

// Defense in depth: even a file legitimately in the graph must never itself
// perform a process-control call. The scan runs on the lexed code view, so
// prose in comments (reconciliation-planner.mjs discusses "child_process.spawn,
// worker PGID signalling") never matches and code after an inline comment is
// still scanned. Strings stay in the view, so a call spelled inside a string
// fails safe.
const BANNED_CALLS = [
  ['process-spawning call', /(?<![\w$])(?:spawn|spawnSync|execSync|execFile|execFileSync|fork)\s*\(/],
  ['signal sent through .kill(...)', /\.\s*kill\s*\(/],
  ['signal sent through .signal(...)', /\.\s*signal\s*\(/],
  ['process.kill reached by a computed member', /\bprocess\s*(?:\?\.)?\s*\[\s*['"`]kill['"`]\s*\]/],
  ['process.kill taken as a value', /\bprocess\s*(?:\?\.|\.)\s*kill\b(?!\s*\()/],
  ['kill destructured from process', /\{[^}]*\bkill\b[^}]*\}\s*=\s*(?:globalThis\s*\.\s*)?process\b/],
];
// `process.kill(pid, 0)` delivers no signal: it only asks whether a pid exists
// (provider-capacity.mjs's isPidAlive lease probe, and the planner's
// `process.kill.call(process, pid, 0)`). It is liveness evidence, not process
// control, so it is the one kill form allowed in this graph.
const SIGNAL_ZERO_PROBE = /\bprocess\s*\.\s*kill\s*(?:\.\s*call\s*\(\s*process\s*,|\()\s*[A-Za-z_$][\w$.]*\s*,\s*0\s*\)/g;

/** Banned-call findings in one source text: [label, matched text]. */
export function bannedCalls(source) {
  const { code } = lexSource(source);
  const scanned = code.replace(SIGNAL_ZERO_PROBE, (probe) => ' '.repeat(probe.length));
  return BANNED_CALLS.flatMap(([label, pattern]) => {
    const m = pattern.exec(scanned);
    return m ? [[label, m[0]]] : [];
  });
}

function resolveSpecifier(file, specifier) {
  if (specifier.startsWith('node:') || !/^[./]/.test(specifier)) return { builtin: specifier };
  let target = path.resolve(path.dirname(file), specifier);
  if (!path.extname(target)) target += '.mjs';
  return { file: target };
}

function walk(file, seen, lazy) {
  if (seen.has(file)) return;
  seen.add(file);
  const source = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file);
  assert.deepEqual(bannedCalls(source), [], `${rel} matched a banned process-control call pattern`);
  const { staticSpecifiers, dynamicSpecifiers } = moduleSpecifiers(source);
  for (const specifier of dynamicSpecifiers) lazy.add(`${rel} -> ${specifier}`);
  for (const specifier of staticSpecifiers) {
    const { file: target, builtin } = resolveSpecifier(file, specifier);
    if (builtin) {
      assert.ok(builtin.startsWith('node:') && ALLOWED_BUILTINS.has(builtinName(builtin)),
        `${rel} imports "${builtin}"; the reconcile closure may only import relative modules and the builtins ${[...ALLOWED_BUILTINS].join(', ')}`);
      continue;
    }
    walk(target, seen, lazy);
  }
}

const ENTRY_POINTS = ['src/verbs/dispatch/reconcile.mjs', 'src/runner/dispatch/reconciliation-planner.mjs'].map((p) => path.join(root, p));

// Strongest proof: the whole real transitive closure is EXACTLY this known,
// hand-verified set -- not merely "does not contain a banned name". Any
// future import added anywhere in this graph must show up here as a
// deliberate, reviewed addition, never silently.
const EXPECTED_CLOSURE = [
  'src/verbs/dispatch/reconcile.mjs',
  'src/runner/dispatch/reconciliation-planner.mjs',
  'src/runner/dispatch/runtime-inspection.mjs',
  'src/runner/dispatch/run-result.mjs',
  'src/runner/dispatch/visibility-session.mjs',
  'src/runner/dispatch/worker-artifacts.mjs',
  'src/runner/dispatch/provider-capacity.mjs',
  'src/config/global-config.mjs',
  'src/config/shared-config-file.mjs',
  'src/setup/config-merge.mjs',
  // Pure leaf (node:crypto + worker_threads' threadId): unique temp-file
  // names for the planner's and visibility-session's write-then-rename.
  'src/util/unique-tmp-tag.mjs',
  // Read-only assignment layout (node:fs + node:path only): runtime
  // inspection and findRunningRuns enumerate nested runs through it.
  'src/runner/dispatch/assignment-layout.mjs',
  // Pure contract table run-result.mjs consults for isAssessmentRequired;
  // no imports of its own. Reached now that run-result.mjs is walked through.
  'src/runner/dispatch/agent-result-claim-contract.mjs',
  // provider-capacity.mjs's own imports, reached now that it is walked through:
  // provider-family normalization (node:fs/node:path; its only write is a
  // best-effort shadow-binder telemetry append, no process control) ...
  'src/runner/dispatch/provider-adapter.mjs',
  // ... the auth-failure wording table, a leaf with no imports, kept apart
  // so provider-capacity never imports liveness.mjs for it ...
  'src/runner/dispatch/provider-auth-failure.mjs',
  // ... and /proc boot-id/start-time reads that decide lease holder
  // identity (node:fs only; no signals, no spawn).
  'src/runner/dispatch/process-identity.mjs',
].map((p) => path.join(root, p)).sort();

// The lazy edges inside the closure. These modules are not loaded by reconcile;
// they are listed so a new or retargeted dynamic import in the closure is a
// reviewed change rather than a silent one.
const EXPECTED_LAZY_EDGES = [
  'src/runner/dispatch/visibility-session.mjs -> ./assignment-runner.mjs',
  'src/runner/dispatch/visibility-session.mjs -> ./herdr-round.mjs',
];

test('reconcile use-case + reconciliation-planner transitive import graph excludes process-control/retry/admission/resume/reassignment/cancellation/takeover modules', () => {
  const seen = new Set();
  const lazy = new Set();
  for (const entry of ENTRY_POINTS) walk(entry, seen, lazy);

  for (const banned of BANNED_FILES) {
    assert.equal(seen.has(banned), false, `reconcile's real import graph must never reach ${path.relative(root, banned)}`);
  }
  assert.deepEqual([...seen].sort(), EXPECTED_CLOSURE);
  assert.deepEqual([...lazy].sort(), EXPECTED_LAZY_EDGES,
    'a dynamic import() in the reconcile closure changed; review whether reconcile can now reach it and update EXPECTED_LAZY_EDGES');
});

test('importing reconcile and the reconciliation planner in a fresh process loads exactly the static closure and allowed builtins', () => {
  // A synchronous loader hook records every module the child's loader is asked
  // for while it imports both entry points. It only imports; it calls nothing.
  const probe = [
    "import { registerHooks } from 'node:module';",
    'const seen = new Set();',
    'registerHooks({ load(url, context, next) { seen.add(url); return next(url, context); } });',
    'for (const target of JSON.parse(process.env.RECONCILE_CLOSURE_ENTRIES)) await import(target);',
    'process.stdout.write(JSON.stringify([...seen]));',
  ].join('\n');
  const stdout = execFileSync(process.execPath, ['--input-type=module', '--eval', probe], {
    cwd: root,
    encoding: 'utf8',
    timeout: 30_000,
    env: { ...process.env, RECONCILE_CLOSURE_ENTRIES: JSON.stringify(ENTRY_POINTS.map((file) => pathToFileURL(file).href)) },
  });
  const loaded = JSON.parse(stdout);
  const files = loaded.filter((url) => url.startsWith('file:')).map((url) => fileURLToPath(url)).sort();
  const others = loaded.filter((url) => !url.startsWith('file:'));
  for (const banned of BANNED_FILES) assert.ok(!files.includes(banned), `loading reconcile loaded ${path.relative(root, banned)}`);
  assert.deepEqual(files, EXPECTED_CLOSURE, 'the modules really loaded differ from the static closure; a load form the static walk cannot see was added');
  const refused = others.filter((url) => !(url.startsWith('node:') && ALLOWED_BUILTINS.has(builtinName(url))));
  assert.deepEqual(refused, [], 'loading reconcile loaded a module outside the closure and the allowed builtins');
});

test('static import scan finds every static form and ignores comments, strings and dynamic import()', () => {
  const statics = (source) => moduleSpecifiers(source).staticSpecifiers;
  assert.deepEqual(statics("import{a}from'./a.mjs';import'./b.mjs';import * as c from'./c.mjs'"), ['./a.mjs', './b.mjs', './c.mjs']);
  assert.deepEqual(statics("const z = 1; import './d.mjs'; export * from './e.mjs'; export * as f from \"./f.mjs\";"), ['./d.mjs', './e.mjs', './f.mjs']);
  assert.deepEqual(statics("import {\n  a,\n  b,\n} from './g.mjs';\nexport { h } from './h.mjs';\nimport def, { i } from './i.mjs';"), ['./g.mjs', './h.mjs', './i.mjs']);
  assert.deepEqual(statics("// import './x.mjs'\n/* import './y.mjs' */\nconst s = \"import './z.mjs'\";\nconst t = `from './w.mjs'`;\nexport const v = 1;\nexport { v as u };"), []);
  assert.deepEqual(moduleSpecifiers("async function f() { return import('./lazy.mjs'); }\nconst m = import.meta.url;").dynamicSpecifiers, ['./lazy.mjs']);
});

test('banned-call scan sees code around inline comments and every spelling of a signal', () => {
  const caught = (source) => bannedCalls(source).map(([label]) => label);
  assert.deepEqual(caught("/* x */ process.kill(pid, 'SIGTERM')"), ['signal sent through .kill(...)']);
  assert.deepEqual(caught("const a = 1; /*\n * note\n */ process.kill(pid, 9)"), ['signal sent through .kill(...)']);
  assert.deepEqual(caught("process['kill'](pid, 'SIGTERM')"), ['process.kill reached by a computed member']);
  assert.deepEqual(caught('const { kill } = process;\nkill(pid);'), ['kill destructured from process']);
  assert.deepEqual(caught('const { kill: k } = globalThis.process;'), ['kill destructured from process']);
  assert.deepEqual(caught('const k = process.kill.bind(process);'), ['process.kill taken as a value']);
  assert.deepEqual(caught('const k = process.kill;'), ['process.kill taken as a value']);
  assert.deepEqual(caught('spawnSync(cmd, args)'), ['process-spawning call']);
  assert.deepEqual(caught('child.kill()'), ['signal sent through .kill(...)']);
  assert.deepEqual(caught('process.kill(pid, 0); process.kill(pid, 9);'), ['signal sent through .kill(...)']);
  assert.deepEqual(caught('process.kill.call(process, pid, 9);'), ['process.kill taken as a value']);
  // The liveness probe, prose in comments, and an unrelated `kill` word are not calls.
  assert.deepEqual(caught('const alive = process.kill(pid, 0) && process.kill.call(process, other.pid, 0);\n// process.kill(pid, 9) is never sent\n/* spawn(x) */\nconst killSwitch = 1;'), []);
});

test('boundary test: src/runner/dispatch/** does not reference pick/return verbs or appendEvent (R1 / M10)', () => {
  const dispatchDir = path.join(root, 'src/runner/dispatch');
  const forbiddenPattern = /['"]pick['"]|['"]return['"]|\bappendEvent\b/;

  function getFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.mjs') || entry.name.endsWith('.js'))) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const files = getFiles(dispatchDir);
  assert.ok(files.length > 5, `expected at least 5 dispatch files, found ${files.length}`);

  const violations = [];
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (forbiddenPattern.test(line)) {
        violations.push(`${path.relative(root, file)}:${idx + 1}: ${line.trim()}`);
      }
    });
  }

  assert.deepEqual(violations, [], `src/runner/dispatch/** must not reference 'pick', 'return', or appendEvent:\n${violations.join('\n')}`);
});

test('boundary test: dispatch core does not import operation-choice, fanout-batch, or dispatch-log (F4 / R1 / R2)', () => {
  const dispatchCoreFiles = [
    'src/runner/dispatch/config.mjs',
    'src/runner/dispatch/resolve.mjs',
    'src/runner/dispatch/mechanism.mjs',
    'src/runner/dispatch/transport.mjs',
    'src/runner/dispatch/prepare.mjs',
    'src/runner/dispatch/cli.mjs',
    'src/runner/dispatch/plan.mjs',
  ];

  const bannedUpward = ['operation-choice', 'fanout-batch', 'dispatch-log'];
  for (const rel of dispatchCoreFiles) {
    const filePath = path.join(root, rel);
    const content = fs.readFileSync(filePath, 'utf8');
    for (const banned of bannedUpward) {
      assert.equal(
        content.includes(banned),
        false,
        `${rel} must not import or reference upward module ${banned}`,
      );
    }
  }
});

test('boundary test: src/runner/dispatch/** contains no lifecycle verb imports or dynamic return/pick spawns (M1b, M1c)', () => {
  const dispatchDir = path.join(root, 'src/runner/dispatch');
  const forbiddenImports = ['settleClaim', 'claimWork', 'appendEvent', 'pickWork', 'returnWork'];
  const forbiddenModulePatterns = [/\/state\/claim\.mjs$/, /\/state\/settle\.mjs$/, /\/verbs\/work\//];

  function getFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...getFiles(fullPath));
      } else if (entry.isFile() && (entry.name.endsWith('.mjs') || entry.name.endsWith('.js'))) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const files = getFiles(dispatchDir);
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const rel = path.relative(root, file);

    // M1b: Check AST / static import clauses
    const importRegex = /import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
    let m;
    while ((m = importRegex.exec(content)) !== null) {
      const named = m[1] ? m[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0]) : [];
      const defaultImport = m[2];
      const source = m[3];

      for (const sym of forbiddenImports) {
        assert.equal(named.includes(sym), false, `${rel} statically imports lifecycle symbol '${sym}' (M1b violation)`);
        assert.notEqual(defaultImport, sym, `${rel} default-imports lifecycle symbol '${sym}' (M1b violation)`);
      }
      for (const pat of forbiddenModulePatterns) {
        assert.equal(pat.test(source), false, `${rel} imports forbidden lifecycle module '${source}' (M1b violation)`);
      }
    }

    // Direct named symbol checks in source
    for (const sym of forbiddenImports) {
      assert.equal(
        new RegExp(`\\b${sym}\\b`).test(content),
        false,
        `${rel} references lifecycle function '${sym}' (M1b violation)`,
      );
    }

    // M1c: Check dynamic concatenation / spawning of 'return' or 'pick'
    const dynamicReturnPick = /['"]\s*\+\s*['"]turn['"]|['"]\s*\+\s*['"]ick['"]|['"]re['"]\s*\+|['"]pi['"]\s*\+|\[\s*['"]re['"]\s*,\s*['"]turn['"]\s*\]|\[\s*['"]pi['"]\s*,\s*['"]ck['"]\s*\]/;
    assert.equal(
      dynamicReturnPick.test(content),
      false,
      `${rel} dynamically constructs 'return' or 'pick' verb string (M1c violation)`,
    );

    // M1d: Check dynamic property construction for lifecycle operations (e.g. ['settle' + 'Claim'])
    const dynamicLifecycleProps = /['"]\s*\+\s*['"](?:Claim|Work|Event)['"]|['"](?:settle|claim|pick|append)['"]\s*\+/;
    assert.equal(
      dynamicLifecycleProps.test(content),
      false,
      `${rel} dynamically accesses lifecycle properties (M1d violation)`,
    );
  }
});

test('boundary test: dispatch core modules import no Work-layer module and name no Work lookup (R2 / ME)', () => {
  const strictDispatchCoreFiles = [
    'src/runner/dispatch/config.mjs',
    'src/runner/dispatch/mechanism.mjs',
    'src/runner/dispatch/transport.mjs',
    'src/runner/dispatch/plan.mjs',
    'src/runner/dispatch/resolve.mjs',
    'src/runner/dispatch/prepare.mjs',
    'src/runner/dispatch/settlement.mjs',
    'src/runner/dispatch/run-result.mjs',
    'src/runner/dispatch/runtime-inspection.mjs',
    'src/runner/dispatch/brief.mjs',
    'src/runner/dispatch/proof-helpers.mjs',
    'src/runner/dispatch/herdr-reconcile.mjs',
    'src/runner/dispatch/recovery-planner.mjs',
  ];

  const WORK_LOOKUP_SYMBOLS = [
    'executorIdForWork',
    'resolveCapabilityIdentityDetails',
    'resolveCapabilityIdentity',
    'buildPrompt',
  ];

  const IMPORT_OR_EXPORT_RE = /(?:import|export)\s+(?:\{([^}]+)\}|(\*\s+as\s+\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/g;

  for (const rel of strictDispatchCoreFiles) {
    const filePath = path.join(root, rel);
    const content = fs.readFileSync(filePath, 'utf8');

    // Rule 1: no reference to the retired stage-graph/step-fsm modules, nor to the domain registry
    for (const retired of ['workflow-stage-graphs', 'stage-fsm', 'domain-registry', 'step-fsm']) {
      assert.equal(content.includes(retired), false, `${rel} must not import or reference ${retired}`);
    }

    // Rule 2: no import from the Work-layer bridge, with no exception
    assert.equal(
      /from\s+['"][^'"]*work-(?:compat|dispatch)(?:\.mjs)?['"]/.test(content),
      false,
      `${rel} must not import from work-compat.mjs or work-dispatch.mjs`,
    );

    // Rule 3: Strict enforcement of Work lookup symbols (R2 / mutation ME lock)
    // Core modules must not import or re-export Work lookups except authorized allowlist
    let m;
    const re = new RegExp(IMPORT_OR_EXPORT_RE.source, 'g');
    while ((m = re.exec(content)) !== null) {
      const namedClause = m[1];
      const defaultImport = m[3];
      const sourceModule = m[4];

      const names = [];
      if (namedClause) {
        names.push(...namedClause.split(',').map((s) => s.trim().split(/\s+as\s+/)[0]).filter(Boolean));
      }
      if (defaultImport) names.push(defaultImport);

      for (const sym of WORK_LOOKUP_SYMBOLS) {
        if (names.includes(sym)) {
          assert.fail(
            `${rel} statically imports/exports forbidden Work lookup symbol '${sym}' from '${sourceModule}' (R2 boundary violation / ME)`
          );
        }
      }
    }

    // Rule 4: For the 10 completely decoupled core modules, forbid all identifier references to Work lookups
    {
      for (const sym of WORK_LOOKUP_SYMBOLS) {
        assert.equal(
          new RegExp(`\\b${sym}\\b`).test(content),
          false,
          `${rel} contains forbidden reference to Work lookup symbol '${sym}' (R2 boundary violation / ME)`,
        );
      }
    }
  }

  // Work Driver compatibility lookups (executorIdForWork, resolveCapabilityIdentityDetails, buildPrompt)
  // are relocated to leaf module src/runner/work-compat.mjs, avoiding cyclic dependencies.
  const resolveSource = fs.readFileSync(path.join(root, 'src/runner/dispatch/resolve.mjs'), 'utf8');
  const prepareSource = fs.readFileSync(path.join(root, 'src/runner/dispatch/prepare.mjs'), 'utf8');
  assert.equal(resolveSource.includes('operation-choice'), false, 'resolve.mjs must not import operation-choice');
  assert.equal(prepareSource.includes('operation-choice'), false, 'prepare.mjs must not import operation-choice');

  // The Work layer may build on dispatch's generic resolvers; the reverse is what the rules above forbid.

  // Verify cli.mjs (dispatch CLI surface) uses documented allowlist and does not import work-compat directly
  const cliSource = fs.readFileSync(path.join(root, 'src/runner/dispatch/cli.mjs'), 'utf8');
  assert.equal(/from\s+['"][^'"]*work-compat(?:\.mjs)?['"]/.test(cliSource), false, 'cli.mjs must not import work-compat directly');
});


test('boundary test: dispatch core has no cyclic dependencies > 2 (SCC analysis, F4)', () => {
  const IMPORT_RE = /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"](\.{1,2}\/[^'"]+)['"]/g;
  function getImports(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = [];
    let m;
    while ((m = IMPORT_RE.exec(content)) !== null) {
      let resolved = path.resolve(path.dirname(filePath), m[1]);
      if (!path.extname(resolved)) {
        if (fs.existsSync(resolved + '.mjs')) resolved += '.mjs';
        else if (fs.existsSync(resolved + '.js')) resolved += '.js';
      }
      imports.push(resolved);
    }
    return imports;
  }

  const graph = new Map();
  function scan(file) {
    if (graph.has(file)) return;
    graph.set(file, []);
    if (!fs.existsSync(file)) return;
    try {
      const imps = getImports(file);
      graph.set(file, imps);
      for (const imp of imps) {
        if (imp.startsWith(root) && !imp.includes('node_modules')) {
          scan(imp);
        }
      }
    } catch {}
  }

  const dispatchDir = path.join(root, 'src/runner/dispatch');
  for (const f of fs.readdirSync(dispatchDir)) {
    if (f.endsWith('.mjs')) scan(path.join(dispatchDir, f));
  }

  let index = 0;
  const indices = new Map();
  const lowlinks = new Map();
  const onStack = new Map();
  const stack = [];
  const sccs = [];

  function strongConnect(v) {
    indices.set(v, index);
    lowlinks.set(v, index);
    index++;
    stack.push(v);
    onStack.set(v, true);

    for (const w of graph.get(v) || []) {
      if (!indices.has(w)) {
        strongConnect(w);
        lowlinks.set(v, Math.min(lowlinks.get(v), lowlinks.get(w)));
      } else if (onStack.get(w)) {
        lowlinks.set(v, Math.min(lowlinks.get(v), indices.get(w)));
      }
    }

    if (lowlinks.get(v) === indices.get(v)) {
      const scc = [];
      let w;
      do {
        w = stack.pop();
        onStack.set(w, false);
        scc.push(w);
      } while (w !== v);
      if (scc.length > 2 && scc.some((p) => p.includes('src/runner/dispatch/'))) {
        sccs.push(scc.map((p) => path.relative(root, p)));
      }
      if (scc.length > 1) {
        const rels = scc.map((p) => path.relative(root, p));
        const bannedInCycle = [
          'src/runner/dispatch/resolve.mjs',
          'src/runner/dispatch/prepare.mjs',
          'src/runner/operation-choice.mjs',
          'src/runner/fanout-batch.mjs',
        ];
        for (const b of bannedInCycle) {
          assert.equal(
            rels.includes(b),
            false,
            `${b} must not participate in any import cycle (found in SCC: ${JSON.stringify(rels)})`,
          );
        }
      }
    }
  }

  for (const node of graph.keys()) {
    if (!indices.has(node)) {
      strongConnect(node);
    }
  }

  assert.deepEqual(sccs, [], `dispatch modules must have no SCC cycle > 2 (found: ${JSON.stringify(sccs)})`);
});
