#!/usr/bin/env node
// Golden recorder for the Execution pure core: the Unit contract, the run request and the pattern catalog.
//
// It runs the Node modules `src/runner/execution/{unit,run-request}.mjs` and `src/runner/execution/patterns/*.mjs`
// over a fixed list of inputs and writes what they answered (a value, or the refusal with its class, message and
// code) to `packages/execution/contracts/core-unit/*.v1.json`. The Rust tests of `fgos-execution`
// (`packages/execution/rust/tests/core_unit.rs`) replay those files; nothing in them is written by hand but the
// inputs below.
//
// Four answers come from siblings that live in other modules, so the vector records them as the Node answer
// to the same question (`host`): the declared-seat check and the run-timeout bounds (Unit), the `--timeout` text
// parse (run request), and the loop parameter tables, checker seats and declared-seat check (catalog). The Rust modules ask a trait for them; a
// later phase wires the real implementations, and these recorded answers are what the trait stands for here.
// Answers that need the Rust host or the config addon (the Convention plan-name rule, the runner config read,
// persona lookup) are never asked here: no input below reaches them.
//
// Usage: node test/golden-recorders/core-unit.recorder.mjs [--repo <dir>] [--check]
//   --check  record in memory and compare with the committed files instead of writing them.
// Deleted with the Node modules it imports (phase 20/21).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const repoFlag = args.indexOf('--repo');
const ROOT = path.resolve(repoFlag >= 0 ? args[repoFlag + 1] : path.join(here, '..', '..'));
const CHECK = args.includes('--check');
const OUT = path.join(ROOT, 'packages/execution/contracts/core-unit');
const load = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);

const unitMod = await load('src/runner/execution/unit.mjs');
const reqMod = await load('src/runner/execution/run-request.mjs');
const catalogMod = await load('src/runner/execution/patterns/catalog.mjs');
const entriesMod = await load('src/runner/execution/patterns/catalog-entries.mjs');
const retiredMod = await load('src/runner/execution/patterns/retired-keys.mjs');
const seatMod = await load('src/runner/execution/seat-resolver.mjs');
const loopsMod = await load('src/runner/execution/loops/index.mjs');
const timeoutMod = await load('src/runner/dispatch/run-timeout.mjs');
const rigorMod = await load('src/runner/rigor.mjs');
const adaptersMod = await load('src/runner/dispatch/adapters.mjs');
const configMod = await load('src/runner/dispatch/config.mjs');
const tierLadder = JSON.parse(fs.readFileSync(path.join(ROOT, 'packages/seat-binding/contracts/seat-binding.tier-ladder.v1.json'), 'utf8'));
const TIERS = tierLadder.tiers.map((tier) => tier.name);

/** The JSON a value has once it leaves the process: what a vector can hold. */
const plain = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

function refusal(err) {
  const out = { name: err?.name ?? 'Error', message: String(err?.message ?? err) };
  for (const key of ['code', 'phase', 'path', 'paths', 'detail', 'source', 'at']) {
    if (err?.[key] !== undefined && err[key] !== null) out[key] = plain(err[key]);
  }
  return out;
}

/** What `fn` answered: `{ ok }` or `{ error }`. */
function answer(fn) {
  try {
    return { ok: plain(fn()) ?? null };
  } catch (err) {
    return { error: refusal(err) };
  }
}

// ---------------------------------------------------------------- unit

const BASE = { id: 'u1', objective: 'Do the work', capability: 'execute' };
const unitInputs = [
  ['minimal valid unit', BASE],
  ['trims every text', { id: '  u1 ', objective: ' Do it ', capability: ' code:review ', persona: ' p ', verify: ' npm test ', pattern: ' reviewed ' }],
  ['not an object: null', null],
  ['not an object: array', []],
  ['not an object: string', 'unit'],
  ...['executor', 'provider', 'model', 'invocation', 'actors', 'overrides'].map((field) => [`refuses ${field}`, { ...BASE, [field]: 'x' }]),
  ['null disallowed field still refused', { ...BASE, executor: null }],
  ['id missing', { objective: 'o', capability: 'c' }],
  ['id blank', { ...BASE, id: '  ' }],
  ['id not a string', { ...BASE, id: 7 }],
  ['objective missing', { id: 'u', capability: 'c' }],
  ['objective blank', { ...BASE, objective: ' ' }],
  ['objective null', { ...BASE, objective: null }],
  ['capability missing', { id: 'u', objective: 'o' }],
  ['capability blank', { ...BASE, capability: '' }],
  ['rigor each value', { ...BASE, rigor: 'critical' }],
  ['rigor null is absent', { ...BASE, rigor: null }],
  ['rigor unknown', { ...BASE, rigor: 'extreme' }],
  ['rigor not a string', { ...BASE, rigor: 3 }],
  ['writes canonicalised and deduplicated', { ...BASE, writes: ['src/a.mjs', './src//b/', 'src/a.mjs', ' docs/** '] }],
  ['writes not an array', { ...BASE, writes: 'src' }],
  ['writes null is not an array', { ...BASE, writes: null }],
  ['writes absolute', { ...BASE, writes: ['/etc/passwd'] }],
  ['writes parent segment', { ...BASE, writes: ['a/../b'] }],
  ['writes empty entry', { ...BASE, writes: ['  '] }],
  ['writes not a string', { ...BASE, writes: [5] }],
  ['writes pathspec magic', { ...BASE, writes: [':(glob)x'] }],
  ['writes loose double star', { ...BASE, writes: ['a**b'] }],
  ['writes collapses consecutive double stars', { ...BASE, writes: ['a/**/**/b'] }],
  ['syncBase with writes', { ...BASE, writes: ['x'], syncBase: 'main' }],
  ['syncBase makes a sync-only unit without an objective', { id: 's', capability: 'execute', writes: ['x'], syncBase: 'origin/main' }],
  ['syncBase with explicit syncOnly', { ...BASE, writes: ['x'], syncBase: 'main', syncOnly: true }],
  ['syncBase needs writes', { ...BASE, syncBase: 'main' }],
  ['syncBase bad: leading dash', { ...BASE, writes: ['x'], syncBase: '-x' }],
  ['syncBase bad: range', { ...BASE, writes: ['x'], syncBase: 'a..b' }],
  ['syncBase bad: lock suffix', { ...BASE, writes: ['x'], syncBase: 'a.lock' }],
  ['syncBase bad: trailing slash', { ...BASE, writes: ['x'], syncBase: 'a/' }],
  ['syncBase bad: leading slash', { ...BASE, writes: ['x'], syncBase: '/a' }],
  ['syncBase bad: space', { ...BASE, writes: ['x'], syncBase: 'a b' }],
  ['syncBase bad: revision expression', { ...BASE, writes: ['x'], syncBase: 'HEAD~1' }],
  ['syncBase null', { ...BASE, writes: ['x'], syncBase: null }],
  ['syncOnly without syncBase', { ...BASE, syncOnly: true }],
  ['syncOnly false', { ...BASE, writes: ['x'], syncBase: 'main', syncOnly: false }],
  ['dependsOn trimmed', { ...BASE, dependsOn: [' a ', 'b'] }],
  ['dependsOn not an array', { ...BASE, dependsOn: 'a' }],
  ['dependsOn blank entry', { ...BASE, dependsOn: ['a', ' '] }],
  ['pattern null is absent', { ...BASE, pattern: null }],
  ['pattern blank', { ...BASE, pattern: ' ' }],
  ['pattern not a string', { ...BASE, pattern: 4 }],
  ['inputs of every kind', { ...BASE, inputs: ['docs/a.md', 'unit-run:ur-1/producer', 'gate-answer:wf-1/step-2'] }],
  ['inputs not an array', { ...BASE, inputs: 'a' }],
  ['inputs absolute path', { ...BASE, inputs: ['/a'] }],
  ['inputs parent segment', { ...BASE, inputs: ['a/../b'] }],
  ['inputs backslash', { ...BASE, inputs: ['a\\b'] }],
  ['inputs bad unit-run ref', { ...BASE, inputs: ['unit-run:only'] }],
  ['inputs bad unit-run ref with space', { ...BASE, inputs: ['unit-run:a b/c'] }],
  ['inputs bad gate-answer ref', { ...BASE, inputs: ['gate-answer:a/b/c'] }],
  ['inputs blank', { ...BASE, inputs: [' '] }],
  ['inputs not a string', { ...BASE, inputs: [3] }],
  ['anonymizeInputs true kept', { ...BASE, anonymizeInputs: true }],
  ['anonymizeInputs false dropped', { ...BASE, anonymizeInputs: false }],
  ['anonymizeInputs not a boolean', { ...BASE, anonymizeInputs: 'yes' }],
  ['blind true kept', { ...BASE, blind: true }],
  ['blind false dropped', { ...BASE, blind: false }],
  ['blind not a boolean', { ...BASE, blind: 1 }],
  ['prefer strings and entries', { ...BASE, prefer: [' a ', { executor: ' b ', invocation: ' i ' }, { executor: 'c' }] }],
  ['prefer not an array', { ...BASE, prefer: 'a' }],
  ['prefer blank string', { ...BASE, prefer: [' '] }],
  ['prefer entry without executor', { ...BASE, prefer: [{ invocation: 'i' }] }],
  ['prefer entry with an extra key', { ...BASE, prefer: [{ executor: 'a', extra: 1 }] }],
  ['prefer entry with a blank invocation', { ...BASE, prefer: [{ executor: 'a', invocation: ' ' }] }],
  ['prefer entry an array', { ...BASE, prefer: [['a']] }],
  ['prefer entry null', { ...BASE, prefer: [null] }],
  ['seats valid', { ...BASE, seats: [{ seat: 'a', role: 'producer' }, { seat: 'j', role: 'judge', tier: TIERS[0], persona: ' p ' }] }],
  ['seats empty', { ...BASE, seats: [] }],
  ['seats duplicate', { ...BASE, seats: [{ seat: 'a', role: 'producer' }, { seat: 'a', role: 'producer' }] }],
  ['seats bad role', { ...BASE, seats: [{ seat: 'a', role: 'boss' }] }],
  ['seats bad tier', { ...BASE, seats: [{ seat: 'a', role: 'producer', tier: 'nope' }] }],
  ['seats unknown key', { ...BASE, seats: [{ seat: 'a', role: 'producer', x: 1 }] }],
  ['seats reserved id', { ...BASE, seats: [{ seat: 'verify', role: 'producer' }] }],
  ['tier valid', { ...BASE, tier: TIERS[0] }],
  ['tier unknown', { ...BASE, tier: 'platinum' }],
  ['persona blank', { ...BASE, persona: ' ' }],
  ['persona not a string', { ...BASE, persona: 1 }],
  ['timeoutMs valid', { ...BASE, timeoutMs: 600000 }],
  ['timeoutMs at the floor', { ...BASE, timeoutMs: 60000 }],
  ['timeoutMs at the ceiling', { ...BASE, timeoutMs: 14400000 }],
  ['timeoutMs below the floor', { ...BASE, timeoutMs: 59999 }],
  ['timeoutMs above the ceiling', { ...BASE, timeoutMs: 14400001 }],
  ['timeoutMs fractional', { ...BASE, timeoutMs: 90000.5 }],
  ['timeoutMs a string', { ...BASE, timeoutMs: '90m' }],
  ['timeoutMs null', { ...BASE, timeoutMs: null }],
  ['verify blank', { ...BASE, verify: ' ' }],
  ['verify not a string', { ...BASE, verify: true }],
  ['plan with phase', { ...BASE, plan: { dir: 'plans/260101-0000-x', phase: 3 } }],
  ['plan bad shape', { ...BASE, plan: 'plans/x' }],
  ['skills deduplicated and trimmed', { ...BASE, skills: [' a ', 'b', 'a'] }],
  ['skills empty', { ...BASE, skills: [] }],
  ['skills blank entry', { ...BASE, skills: ['a', ' '] }],
  ['skills not an array', { ...BASE, skills: 'a' }],
  ['expectedOutputs trimmed', { ...BASE, expectedOutputs: [' out.md '] }],
  ['expectedOutputs not an array', { ...BASE, expectedOutputs: 'a' }],
  ['expectedOutputs blank', { ...BASE, expectedOutputs: [''] }],
  ['stanceOptions trimmed', { ...BASE, stanceOptions: [' yes ', 'no'] }],
  ['stanceOptions duplicate', { ...BASE, stanceOptions: ['a', 'a'] }],
  ['stanceOptions reserved other', { ...BASE, stanceOptions: ['a', 'other'] }],
  ['stanceOptions not an array', { ...BASE, stanceOptions: 'a' }],
  ['stanceOptions null', { ...BASE, stanceOptions: null }],
  ['stanceOptions blank', { ...BASE, stanceOptions: ['a', ' '] }],
  ['stanceOptions empty list kept', { ...BASE, stanceOptions: [] }],
  ['every field at once', {
    id: 'full', objective: 'o', capability: 'code:implement', rigor: 'high', writes: ['a'], dependsOn: ['x'], pattern: 'panel',
    prefer: ['e'], seats: [{ seat: 'a', role: 'producer' }], tier: TIERS[0], persona: 'p', timeoutMs: 120000, verify: 'v',
    skills: ['s'], plan: { dir: 'plans/260101-0000-x' }, syncBase: 'main', inputs: ['i'], anonymizeInputs: true, blind: true,
    stanceOptions: ['y'], expectedOutputs: ['e'],
  }],
];

function unitVectors() {
  return unitInputs.map(([name, input]) => {
    const host = {};
    if (input && typeof input === 'object' && !Array.isArray(input)) {
      if (input.seats !== undefined) {
        host.seats = answer(() => seatMod.checkDeclaredSeats(input.seats, 'unit.seats', { tiers: TIERS }));
      }
      if (input.timeoutMs !== undefined) host.timeoutProblem = plain(timeoutMod.runTimeoutProblem(input.timeoutMs, 'unit.timeoutMs'));
    }
    return { name, input: plain(input) ?? null, host, expect: answer(() => unitMod.validateUnit(input)) };
  });
}

const normalizerInputs = {
  normalizeStanceOptions: [[], ['a', ' b '], ['a', 'a'], ['other'], [' '], ['a', 3], 'a', null, {}],
  normalizeWorkflowLink: [
    undefined, null,
    { caseId: 'c1', activity: 'a1', reservationId: 'r1' },
    { runId: 'run1', stepId: 'step1', unitId: 'u1' },
    { caseId: ' c ', activity: ' a ' },
    { caseId: 'c' },
    { activity: 'a' },
    { caseId: 'c', activity: 'a', reservationId: ' ' },
    { caseId: 'c', runId: 'r', activity: 'a', stepId: 's' },
    'link', [], 3,
  ],
  normalizePlanRef: [
    undefined, null,
    { dir: 'plans/260101-0000-x' }, { dir: 'x' }, { dir: './plans/x/' }, { dir: ' plans/x// ' }, { dir: 'plans/' }, { dir: '' },
    { dir: 'plans/a/b' }, { dir: 'plans/a\\b' }, { dir: '..' }, { dir: 'plans/..' }, { dir: '.' }, { dir: 'plans/.' },
    { dir: 'plans/x', phase: 3 }, { dir: 'plans/x', phase: '3' }, { dir: 'plans/x', phase: ' 6b ' }, { dir: 'plans/x', phase: null },
    { dir: 'plans/x', phase: 0 }, { dir: 'plans/x', phase: -1 }, { dir: 'plans/x', phase: 1.5 }, { dir: 'plans/x', phase: '' },
    { dir: 'plans/x', phase: 'a b' }, { dir: 'plans/x', phase: '.x' }, { dir: 'plans/x', phase: 'a.b_c-d' }, { dir: 'plans/x', phase: true },
    { phase: 1 }, { dir: 4 }, 'plans/x', [], 7,
  ],
};

function normalizerVectors() {
  const out = [];
  for (const [fn, inputs] of Object.entries(normalizerInputs)) {
    for (const input of inputs) {
      out.push({ fn, input: input === undefined ? { $undefined: true } : plain(input), expect: answer(() => unitMod[fn](input)) });
    }
  }
  return out;
}

// ---------------------------------------------------------------- run request

const requestFromFlagsInputs = [
  undefined, {}, { params: '{"a":1,"b":[2]}' }, { params: '{}' }, { params: '[1]' }, { params: 'null' }, { params: '"s"' },
  { params: '{bad' }, { params: true }, { params: 5 },
  { param: 'k=v' }, { param: ['a=1', 'b=two=2'] }, { param: true }, { param: 7 }, { param: [1] }, { param: 'novalue' }, { param: '=v' },
  { param: 'k=' }, { param: ['a=1', 'a=2'] }, { params: '{"a":1}', param: 'a=2' }, { params: '{"a":1}', param: 'b=2' },
  { param: [] }, { params: '{"__proto__":1}', param: 'constructor=x' },
];

const foldInputs = [
  [[], 'timeoutMs', 90000],
  [[{ scope: 'producer' }], 'reasoningEffort', 'high'],
  [[{ scope: 'producer', reasoningEffort: 'low' }], 'reasoningEffort', 'high'],
  [[{ reasoningEffort: 'low' }, { scope: 'x' }], 'reasoningEffort', 'high'],
  [[{ scope: 'a' }, { scope: 'b', account: 'p/x' }], 'account', 'openai/work'],
  [[null, { scope: 'a' }], 'timeoutMs', 60000],
  [['text', {}], 'timeoutMs', 60000],
  [[{ tier: 't' }], 'account', 'p/a'],
];

const planFlagInputs = [
  [{}], [{ phase: '3' }], [{ plan: true }], [{ plan: '' }], [{ plan: 'plans/x', phase: true }], [{ plan: 'plans/x', phase: '' }],
  [{ plan: 'a/b' }], [{ plan: '..' }], [{ plan: 'plans/x', phase: 'a b' }], [{ plan: 'plans/.' }],
];

/** The shell's side of `buildRunRequest`: injected, recorded in each vector so the Rust host answers the same. */
function rootsFor(roots) {
  return {
    cwd: roots.cwd,
    gitRoots: (dir) => {
      if (roots.gitFails) throw new Error('not a git repository');
      return { mainCheckoutRoot: roots.main, isLinkedWorktree: dir === roots.linkedAt || (roots.linkedAt === '*') };
    },
    caseAdmission: {
      confinedWriteRefusal: () => roots.confined ?? null,
      activityUnitOf: ({ caseId, activity }) => (roots.activityUnit === undefined ? undefined : { ...roots.activityUnit, caseId, activity }),
      createPort: ({ repoRoot }) => ({ port: 'case-admission', repoRoot }),
    },
  };
}

const ROOTS = { cwd: '/repo/work', main: '/repo', linkedAt: '/repo/work' };
const buildInputs = [
  ['a prompt builds a read-only unit', { flags: {}, positional: ['Summarise the repo'], roots: ROOTS }],
  ['prompt with every unit flag but the ones that read config', { flags: { writes: 'src/a.mjs, docs', input: 'a.md,b.md', capability: 'code:implement', rigor: 'high', verify: 'npm test' }, positional: ['Fix it'], roots: ROOTS }],
  ['prompt id slug folds accents and punctuation', { flags: {}, positional: ['  Sửa lỗi đăng nhập — Ünïcode!! '], roots: ROOTS }],
  ['prompt id slug keeps the ASCII part of a mixed fold', { flags: {}, positional: ['Mix ¼ cup at 40°C, ŉ ℡'], roots: ROOTS }],
  ['prompt id slug falls back to task', { flags: {}, positional: ['!!!'], roots: ROOTS }],
  ['prompt id slug is cut at forty characters', { flags: {}, positional: ['a'.repeat(30) + ' ' + 'b'.repeat(30)], roots: ROOTS }],
  ['empty prompt', { flags: {}, positional: [''], roots: ROOTS }],
  ['blank prompt', { flags: {}, positional: ['   '], roots: ROOTS }],
  ['no way to say what to run', { flags: {}, positional: [], roots: ROOTS }],
  ['prompt and --unit', { flags: { unit: 'u.json' }, positional: ['x'], roots: ROOTS }],
  ['prompt and --resume', { flags: { resume: 'ur-1' }, positional: ['x'], roots: ROOTS }],
  ['--unit and --resume', { flags: { unit: 'u.json', resume: 'ur-1' }, positional: [], roots: ROOTS }],
  ['two prompts', { flags: {}, positional: ['a', 'b'], roots: ROOTS }],
  ['--unit file', { flags: { unit: 'u.json' }, positional: [], roots: ROOTS }],
  ['--unit from stdin with a directory and a worktree', { flags: { unit: '-', dir: '/other', worktree: '/wt' }, positional: [], roots: ROOTS }],
  ['--resume', { flags: { resume: 'ur-9' }, positional: [], roots: ROOTS }],
  ['--sync alone builds a sync-only unit', { flags: { sync: 'main', writes: 'src' }, positional: [], roots: ROOTS }],
  ['--sync with a prompt', { flags: { sync: 'main', writes: 'src' }, positional: ['merge it'], roots: ROOTS }],
  ['--sync needs --writes', { flags: { sync: 'main' }, positional: [], roots: ROOTS }],
  ['--sync needs a ref', { flags: { sync: true, writes: 'src' }, positional: [], roots: ROOTS }],
  ['--sync with --unit', { flags: { sync: 'main', unit: 'u.json' }, positional: [], roots: ROOTS }],
  ['--sync with --resume', { flags: { sync: 'main', resume: 'ur' }, positional: [], roots: ROOTS }],
  ['prompt-only flag with --unit: writes', { flags: { unit: 'u.json', writes: 'a' }, positional: [], roots: ROOTS }],
  ['prompt-only flag with --resume: provider', { flags: { resume: 'ur', provider: 'x' }, positional: [], roots: ROOTS }],
  ['prompt-only flag with --unit: plan', { flags: { unit: 'u.json', plan: 'plans/x' }, positional: [], roots: ROOTS }],
  ['prompt-only flag with --unit: phase', { flags: { unit: 'u.json', phase: '2' }, positional: [], roots: ROOTS }],
  ['prompt-only flag with --unit: verify', { flags: { unit: 'u.json', verify: 'x' }, positional: [], roots: ROOTS }],
  ['--writes needs a path', { flags: { writes: ',' }, positional: ['x'], roots: ROOTS }],
  ['--writes bare', { flags: { writes: true }, positional: ['x'], roots: ROOTS }],
  ['--writes needs a linked worktree', { flags: { writes: 'src' }, positional: ['x'], roots: { ...ROOTS, linkedAt: '/nowhere' } }],
  ['--writes --worktree names where it runs', { flags: { writes: 'src', worktree: '/repo/wt/../wt2' }, positional: ['x'], roots: { ...ROOTS, linkedAt: '/repo/wt2' } }],
  ['--input needs a path', { flags: { input: ' , ' }, positional: ['x'], roots: ROOTS }],
  ['--input bare', { flags: { input: true }, positional: ['x'], roots: ROOTS }],
  ['--capability bare', { flags: { capability: true }, positional: ['x'], roots: ROOTS }],
  ['--rigor empty', { flags: { rigor: '' }, positional: ['x'], roots: ROOTS }],
  ['--verify bare', { flags: { verify: true }, positional: ['x'], roots: ROOTS }],
  ['--dir is normalised and git is not asked', { flags: { dir: '/abs/rel/../proj' }, positional: ['x'], roots: { ...ROOTS, gitFails: true } }],
  ['no --dir and git cannot say', { flags: {}, positional: ['x'], roots: { ...ROOTS, gitFails: true } }],
  ['--dir with dot segments and a trailing slash', { flags: { dir: '/up/./proj/' }, positional: ['x'], roots: ROOTS }],
  ['--effort folds into a reasoningEffort override', { flags: { effort: 'high' }, positional: ['x'], roots: ROOTS }],
  ['--effort bare', { flags: { effort: true }, positional: ['x'], roots: ROOTS }],
  ['--effort empty', { flags: { effort: '' }, positional: ['x'], roots: ROOTS }],
  ['--timeout parses a duration', { flags: { timeout: '90m' }, positional: ['x'], roots: ROOTS }],
  ['--timeout in seconds and hours', { flags: { timeout: '2h', override: '{"scope":"producer"}' }, positional: ['x'], roots: ROOTS }],
  ['--timeout below the floor', { flags: { timeout: '30s' }, positional: ['x'], roots: ROOTS }],
  ['--timeout above the ceiling', { flags: { timeout: '5h' }, positional: ['x'], roots: ROOTS }],
  ['--timeout without a unit', { flags: { timeout: '90' }, positional: ['x'], roots: ROOTS }],
  ['--timeout bare', { flags: { timeout: true }, positional: ['x'], roots: ROOTS }],
  ['--timeout on a resumed run', { flags: { resume: 'ur', timeout: '90m' }, positional: [], roots: ROOTS }],
  ['--timeout too large to count', { flags: { timeout: '99999999999999999999h' }, positional: ['x'], roots: ROOTS }],
  ['--timeout in milliseconds', { flags: { timeout: '600000ms' }, positional: ['x'], roots: ROOTS }],
  ['--account pins the account', { flags: { account: 'openai/work' }, positional: ['x'], roots: ROOTS }],
  ['--account bare', { flags: { account: true }, positional: ['x'], roots: ROOTS }],
  ['--account on a resumed run', { flags: { resume: 'ur', account: 'a/b' }, positional: [], roots: ROOTS }],
  ['--effort --timeout --account fold together over an --override list', { flags: { override: '[{"scope":"producer","reasoningEffort":"low"},{"tier":"high"}]', effort: 'max', timeout: '60m', account: 'p/a' }, positional: ['x'], roots: ROOTS }],
  ['--override one object', { flags: { override: '{"scope":"checker","model":"m"}' }, positional: ['x'], roots: ROOTS }],
  ['--override bad JSON', { flags: { override: '{nope' }, positional: ['x'], roots: ROOTS }],
  ['--override JSON null', { flags: { override: 'null' }, positional: ['x'], roots: ROOTS }],
  ['--override empty', { flags: { override: '' }, positional: ['x'], roots: ROOTS }],
  ['--params and --param become a request', { flags: { params: '{"maxRounds":3}', param: ['rebuttal=true'] }, positional: ['x'], roots: ROOTS }],
  ['--param conflict', { flags: { param: ['a=1', 'a=2'] }, positional: ['x'], roots: ROOTS }],
  ['--param conflicts with --params', { flags: { params: '{"a":1}', param: 'a=2' }, positional: ['x'], roots: ROOTS }],
  ['--params invalid', { flags: { params: '[]' }, positional: ['x'], roots: ROOTS }],
  ['--param bare', { flags: { param: true }, positional: ['x'], roots: ROOTS }],
  ['--params on a resumed run', { flags: { resume: 'ur', params: '{}' }, positional: [], roots: ROOTS }],
  ['--param on a resumed run', { flags: { resume: 'ur', param: 'a=1' }, positional: [], roots: ROOTS }],
  ['--pattern and --stance-options pass through', { flags: { pattern: 'panel', 'stance-options': 'yes|no|maybe' }, positional: ['x'], roots: ROOTS }],
  ['--stance-options bare', { flags: { 'stance-options': true }, positional: ['x'], roots: ROOTS }],
  ['--stance-options empty', { flags: { 'stance-options': '' }, positional: ['x'], roots: ROOTS }],
  ['--case names the case and its activity', { flags: { case: 'c-1', activity: 'review', route: 'should', reason: 'because' }, positional: ['x'], roots: { ...ROOTS, activityUnit: { objective: 'from the guide' } } }],
  ['--case without an activity unit answer', { flags: { case: 'c-1', activity: 'review' }, positional: ['x'], roots: ROOTS }],
  ['--case needs --activity', { flags: { case: 'c-1' }, positional: ['x'], roots: ROOTS }],
  ['--activity needs --case', { flags: { activity: 'review' }, positional: ['x'], roots: ROOTS }],
  ['--route needs --case', { flags: { route: 'should' }, positional: ['x'], roots: ROOTS }],
  ['--reason needs --case', { flags: { reason: 'r' }, positional: ['x'], roots: ROOTS }],
  ['--route unknown', { flags: { case: 'c', activity: 'a', route: 'must' }, positional: ['x'], roots: ROOTS }],
  ['--reason bare', { flags: { case: 'c', activity: 'a', reason: true }, positional: ['x'], roots: ROOTS }],
  ['--case bare', { flags: { case: true, activity: 'a' }, positional: ['x'], roots: ROOTS }],
  ['--case on a resumed run', { flags: { resume: 'ur', case: 'c', activity: 'a' }, positional: [], roots: ROOTS }],
  ['--case route may-instead and unlisted', { flags: { case: 'c', activity: 'a', route: 'unlisted' }, positional: ['x'], roots: ROOTS }],
  ['--plan bare is refused before the config is read', { flags: { plan: true }, positional: ['x'], roots: ROOTS }],
  ['--phase without --plan', { flags: { phase: '3' }, positional: ['x'], roots: ROOTS }],
  ['--phase bare', { flags: { plan: 'plans/x', phase: true }, positional: ['x'], roots: ROOTS }],
  ['--plan with a nested directory', { flags: { plan: 'a/b' }, positional: ['x'], roots: ROOTS }],
  ['a writing run from a confined worker is refused', { flags: { writes: 'src' }, positional: ['x'], roots: { ...ROOTS, confined: 'the ledger is read-only here' }, depth: '2' }],
  ['a read-only run from a confined worker goes on', { flags: {}, positional: ['x'], roots: { ...ROOTS, confined: 'never asked' }, depth: '1' }],
  ['a confined writing run names its case', { flags: { writes: 'src', case: 'c-7', activity: 'a' }, positional: ['x'], roots: { ...ROOTS, confined: 'case c-7 is sealed' }, depth: '1' }],
  ['dispatch depth zero is not confined', { flags: { writes: 'src' }, positional: ['x'], roots: { ...ROOTS, confined: 'never asked' }, depth: '0' }],
  ['dispatch depth garbage reads as zero', { flags: { writes: 'src' }, positional: ['x'], roots: { ...ROOTS, confined: 'never asked' }, depth: 'abc' }],
  ['a confined writing run when git cannot say asks with the working directory', { flags: { writes: 'src' }, positional: ['x'], roots: { ...ROOTS, gitFails: true, confined: 'sealed' }, depth: '1' }],
];

const HEX = '-HEX4';
function maskIds(value) {
  if (Array.isArray(value)) return value.map(maskIds);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k === 'id' && typeof v === 'string' && /^adhoc-.*-[0-9a-f]{4}$/.test(v) ? v.replace(/-[0-9a-f]{4}$/, HEX) : maskIds(v)]));
  return value;
}

function buildVectors() {
  return buildInputs.map(([name, spec]) => {
    const previous = process.env[adaptersMod.DISPATCH_DEPTH_ENV];
    if (spec.depth === undefined) delete process.env[adaptersMod.DISPATCH_DEPTH_ENV];
    else process.env[adaptersMod.DISPATCH_DEPTH_ENV] = spec.depth;
    try {
      const expect = answer(() => reqMod.buildRunRequest({ ...spec.flags }, [...spec.positional], rootsFor(spec.roots)));
      // The run-timeout rule is the runner config's: record its answer to the same text.
      const timeoutText = spec.flags.timeout;
      const hostTimeout = typeof timeoutText === 'string' && timeoutText !== '' ? answer(() => configMod.parseRunTimeout(timeoutText)) : undefined;
      return {
        name,
        ...(hostTimeout !== undefined ? { hostTimeout } : {}),
        flags: plain(spec.flags),
        positional: spec.positional,
        roots: plain(spec.roots),
        ...(spec.depth !== undefined ? { dispatchDepth: spec.depth } : {}),
        expect: maskIds(expect),
      };
    } finally {
      if (previous === undefined) delete process.env[adaptersMod.DISPATCH_DEPTH_ENV];
      else process.env[adaptersMod.DISPATCH_DEPTH_ENV] = previous;
    }
  });
}

function runRequestVectors() {
  return {
    requestFromFlags: requestFromFlagsInputs.map((flags) => ({ flags: flags === undefined ? { $undefined: true } : plain(flags), expect: answer(() => reqMod.requestFromFlags(flags)) })),
    foldRunSetting: foldInputs.map(([overrides, key, value]) => {
      const before = JSON.stringify(overrides);
      const result = answer(() => reqMod.foldRunSetting(overrides, key, value));
      return { overrides: plain(overrides), key, value, inputUnchanged: JSON.stringify(overrides) === before, expect: result };
    }),
    planFromFlags: planFlagInputs.map(([flags]) => ({ flags: plain(flags), mainRoot: '/repo', expect: answer(() => reqMod.planFromFlags(flags, '/repo')) })),
    buildRunRequest: buildVectors(),
  };
}

// ---------------------------------------------------------------- patterns

const SHIPPED = {
  seatBinding: { schema: 2 },
  solo: { promise: 'One worker.', loop: 'solo' },
  reviewed: { promise: 'Producer then checkers.', loop: 'reviewed' },
  panel: { promise: 'Producers then a synthesizer.', loop: 'panel' },
  debate: { promise: 'Two sides and a judge.', loop: 'debate' },
  'code-change': { promise: 'Code with review.', loop: 'reviewed', invariants: { minCheckers: { atLeast: ['reviewer', 'red-team'] } } },
  consult: { promise: 'Advice only.', loop: 'solo', invariants: { seats: { fixed: [{ seat: 'advisor', role: 'producer' }] } } },
  'with-defaults': { promise: 'Tuned.', loop: 'reviewed', defaults: { maxRounds: 3, minCheckers: ['reviewer'], roleTasks: { producer: 'write it', reviewer: 'check it' } }, invariants: { maxRounds: { fixed: 3 } } },
};

const P = (patterns, extra = {}) => ({ shipped: SHIPPED, effective: patterns, ...extra });
const originsFor = (list) => list;
const catalogInputs = [
  ['the shipped catalog alone', P({})],
  ['no shipped and no effective', { shipped: {}, effective: {} }],
  ['options absent', {}],
  ['a custom pattern', P({ mine: { promise: 'Mine.', loop: 'panel', defaults: { maxRounds: 2 } } })],
  ['a custom pattern without a promise', P({ mine: { loop: 'solo' } })],
  ['a custom pattern with a blank promise', P({ mine: { promise: ' ', loop: 'solo' } })],
  ['a custom pattern without a loop', P({ mine: { promise: 'p' } })],
  ['a custom pattern with an unknown loop', P({ mine: { promise: 'p', loop: 'swarm' } })],
  ['an override that keeps the shipped loop and adds defaults', P({ reviewed: { defaults: { maxRounds: 5 } } })],
  ['an override cannot change the loop', P({ reviewed: { loop: 'panel' } })],
  ['an override cannot change the promise', P({ solo: { promise: 'Other.' } })],
  ['an override may repeat the promise', P({ solo: { promise: 'One worker.' } })],
  ['an override of an invariant may add elements', P({ 'code-change': { invariants: { minCheckers: { atLeast: ['reviewer', 'red-team', 'tester'] } } } })],
  ['an override dropping an atLeast element', P({ 'code-change': { invariants: { minCheckers: { atLeast: ['reviewer'] } } } })],
  ['an override emptying the invariants', P({ 'code-change': { invariants: {} } })],
  ['an override emptying a fixed invariant', P({ consult: { invariants: {} } })],
  ['an override changing a fixed invariant', P({ 'with-defaults': { invariants: { maxRounds: { fixed: 1 } } } })],
  ['an override naming an atLeast as a non-object', P({ 'code-change': { invariants: { minCheckers: 'x' } } })],
  ['an override naming atLeast without a list', P({ 'code-change': { invariants: { minCheckers: { fixed: ['reviewer'] } } } })],
  ['a non-object effective entry keeps the shipped one', P({ solo: 'x', 'code-change': 5 })],
  ['a non-object effective custom entry is only reported', P({ mine: 'x' })],
  ['an undefined-free null entry', P({ solo: null })],
  ['retired key: defaultRule', P({ defaultRule: true })],
  ['retired key: reviewed.maxRounds', P({ reviewed: { maxRounds: 3 } })],
  ['retired key: reviewed.checkersByRigor', P({ reviewed: { checkersByRigor: {} } })],
  ['retired pattern: research-fan-out-gated', P({ 'research-fan-out-gated': { promise: 'p', loop: 'panel' } })],
  ['reserved name seatBinding as a pattern', P({ seatBinding: { loop: 'solo', promise: 'x' } })],
  ['seatBinding schema marker alone is fine', P({ seatBinding: { schema: 2 } })],
  ['an unknown entry key', P({ solo: { colour: 'red' } })],
  ['defaults not an object', P({ solo: { defaults: 3 } })],
  ['invariants not an object', P({ solo: { invariants: [] } })],
  ['defaults parameter the loop does not read', P({ solo: { defaults: { maxRounds: 3 } } })],
  ['maxRounds not a positive integer', P({ reviewed: { defaults: { maxRounds: 0 } } })],
  ['maxRounds fractional', P({ reviewed: { defaults: { maxRounds: 1.5 } } })],
  ['minCheckers empty', P({ reviewed: { defaults: { minCheckers: [] } } })],
  ['minCheckers not a list', P({ reviewed: { defaults: { minCheckers: 'reviewer' } } })],
  ['minCheckers unknown seat', P({ reviewed: { defaults: { minCheckers: ['reviewer', 'wizard'] } } })],
  ['minCheckers entry not a string', P({ reviewed: { defaults: { minCheckers: [1, { a: 1 }] } } })],
  ['rebuttal not a boolean', P({ debate: { defaults: { rebuttal: 'yes' } } })],
  ['rebuttal boolean', P({ debate: { defaults: { rebuttal: false } } })],
  ['roleTasks not an object', P({ reviewed: { defaults: { roleTasks: 'x' } } })],
  ['roleTasks text not a string', P({ reviewed: { defaults: { roleTasks: { producer: 3 } } } })],
  ['roleTasks unknown target', P({ reviewed: { defaults: { roleTasks: { ghost: 'x' } } } })],
  ['roleTasks valid targets of a panel', P({ panel: { defaults: { roleTasks: { panelist: 'a', synthesizer: 'b' } } } })],
  ['roleTasks valid targets of a debate', P({ debate: { defaults: { roleTasks: { thesis: 'a', antithesis: 'b', judge: 'c', 'thesis-rebuttal': 'd', 'antithesis-rebuttal': 'e' } } } })],
  ['roleTasks targets from declared seats', P({ debate: { defaults: { seats: [{ seat: 'pro', role: 'producer' }, { seat: 'con', role: 'producer' }, { seat: 'jj', role: 'judge' }], roleTasks: { 'pro-rebuttal': 'x', pro: 'y' } } } })],
  ['roleTasks of a reviewed pattern with declared seats', P({ reviewed: { defaults: { seats: [{ seat: 'maker', role: 'producer' }, { seat: 'eye', role: 'reviewer' }], roleTasks: { maker: 'x', reviewer: 'y' } } } })],
  ['roleTasks of a reviewed pattern take the checker seats', P({ reviewed: { defaults: { minCheckers: ['tester'], roleTasks: { tester: 'x', reviewer: 'y', 'red-team': 'z' } } } })],
  ['roleTasks of a solo pattern', P({ solo: { defaults: { roleTasks: { producer: 'x' } } } })],
  ['seats valid for a solo loop', P({ mine: { promise: 'p', loop: 'solo', defaults: { seats: [{ seat: 'one', role: 'producer' }] } } })],
  ['seats wrong count for a solo loop', P({ mine: { promise: 'p', loop: 'solo', defaults: { seats: [{ seat: 'one', role: 'producer' }, { seat: 'two', role: 'producer' }] } } })],
  ['seats wrong role for a solo loop', P({ mine: { promise: 'p', loop: 'solo', defaults: { seats: [{ seat: 'one', role: 'judge' }] } } })],
  ['seats valid for a reviewed loop', P({ mine: { promise: 'p', loop: 'reviewed', defaults: { seats: [{ seat: 'p', role: 'producer' }, { seat: 'r', role: 'reviewer' }, { seat: 'rt', role: 'red-team' }] } } })],
  ['seats two producers for a reviewed loop', P({ mine: { promise: 'p', loop: 'reviewed', defaults: { seats: [{ seat: 'a', role: 'producer' }, { seat: 'b', role: 'producer' }] } } })],
  ['seats a judge in a reviewed loop', P({ mine: { promise: 'p', loop: 'reviewed', defaults: { seats: [{ seat: 'a', role: 'producer' }, { seat: 'b', role: 'judge' }] } } })],
  ['seats valid for a panel loop', P({ mine: { promise: 'p', loop: 'panel', defaults: { seats: [{ seat: 'a', role: 'producer' }, { seat: 'b', role: 'producer' }, { seat: 's', role: 'synthesizer' }] } } })],
  ['seats a panel without a synthesizer', P({ mine: { promise: 'p', loop: 'panel', defaults: { seats: [{ seat: 'a', role: 'producer' }] } } })],
  ['seats a panel without a producer', P({ mine: { promise: 'p', loop: 'panel', defaults: { seats: [{ seat: 's', role: 'synthesizer' }] } } })],
  ['seats a panel with a judge', P({ mine: { promise: 'p', loop: 'panel', defaults: { seats: [{ seat: 'a', role: 'producer' }, { seat: 's', role: 'synthesizer' }, { seat: 'j', role: 'judge' }] } } })],
  ['seats valid for a debate loop', P({ mine: { promise: 'p', loop: 'debate', defaults: { seats: [{ seat: 'a', role: 'producer' }, { seat: 'b', role: 'producer' }, { seat: 'j', role: 'judge' }] } } })],
  ['seats a debate with three producers', P({ mine: { promise: 'p', loop: 'debate', defaults: { seats: [{ seat: 'a', role: 'producer' }, { seat: 'b', role: 'producer' }, { seat: 'c', role: 'producer' }, { seat: 'j', role: 'judge' }] } } })],
  ['seats a debate without a judge', P({ mine: { promise: 'p', loop: 'debate', defaults: { seats: [{ seat: 'a', role: 'producer' }, { seat: 'b', role: 'producer' }] } } })],
  ['seats a debate with a synthesizer', P({ mine: { promise: 'p', loop: 'debate', defaults: { seats: [{ seat: 'a', role: 'producer' }, { seat: 'b', role: 'producer' }, { seat: 'j', role: 'judge' }, { seat: 's', role: 'synthesizer' }] } } })],
  ['seats not an array', P({ mine: { promise: 'p', loop: 'solo', defaults: { seats: 'x' } } })],
  ['seats empty', P({ mine: { promise: 'p', loop: 'solo', defaults: { seats: [] } } })],
  ['seats duplicate id', P({ mine: { promise: 'p', loop: 'panel', defaults: { seats: [{ seat: 'a', role: 'producer' }, { seat: 'a', role: 'producer' }, { seat: 's', role: 'synthesizer' }] } } })],
  ['seats bad role', P({ mine: { promise: 'p', loop: 'solo', defaults: { seats: [{ seat: 'a', role: 'king' }] } } })],
  ['seats reserved id', P({ mine: { promise: 'p', loop: 'solo', defaults: { seats: [{ seat: 'verify', role: 'producer' }] } } })],
  ['seats unknown key', P({ mine: { promise: 'p', loop: 'solo', defaults: { seats: [{ seat: 'a', role: 'producer', color: 'x' }] } } })],
  ['invariant with both forms', P({ mine: { promise: 'p', loop: 'reviewed', invariants: { minCheckers: { atLeast: ['reviewer'], fixed: ['reviewer'] } } } })],
  ['invariant with neither form', P({ mine: { promise: 'p', loop: 'reviewed', invariants: { minCheckers: {} } } })],
  ['invariant with an extra key', P({ mine: { promise: 'p', loop: 'reviewed', invariants: { minCheckers: { atLeast: ['reviewer'], also: 1 } } } })],
  ['invariant atLeast on a scalar parameter', P({ mine: { promise: 'p', loop: 'reviewed', invariants: { maxRounds: { atLeast: [1] } } } })],
  ['invariant fixed on minCheckers', P({ mine: { promise: 'p', loop: 'reviewed', invariants: { minCheckers: { fixed: ['reviewer'] } } } })],
  ['invariant atLeast empty', P({ mine: { promise: 'p', loop: 'reviewed', invariants: { minCheckers: { atLeast: [] } } } })],
  ['invariant atLeast unknown seat', P({ mine: { promise: 'p', loop: 'reviewed', invariants: { minCheckers: { atLeast: ['reviewer', 'gnome'] } } } })],
  ['invariant atLeast entry not a string', P({ mine: { promise: 'p', loop: 'reviewed', invariants: { minCheckers: { atLeast: [3] } } } })],
  ['invariant fixed maxRounds invalid', P({ mine: { promise: 'p', loop: 'reviewed', invariants: { maxRounds: { fixed: -1 } } } })],
  ['invariant fixed rebuttal', P({ mine: { promise: 'p', loop: 'debate', invariants: { rebuttal: { fixed: true } } } })],
  ['invariant fixed seats', P({ mine: { promise: 'p', loop: 'solo', invariants: { seats: { fixed: [{ seat: 'a', role: 'producer' }] } } } })],
  ['invariant not an object', P({ mine: { promise: 'p', loop: 'reviewed', invariants: { maxRounds: 3 } } })],
  ['invariant parameter the loop does not read', P({ mine: { promise: 'p', loop: 'solo', invariants: { rebuttal: { fixed: true } } } })],
  ['origins name the layer of a problem', P({ mine: { promise: 'p', loop: 'swarm' } }, { origins: originsFor([{ path: 'runner.patterns.mine.loop', layer: 'project' }, { path: 'runner.patterns.mine', layer: 'global' }]) })],
  ['origins prefer project over global over shipped', P({ reviewed: { loop: 'panel', promise: 'x' } }, { origins: originsFor([{ path: 'runner.patterns.reviewed', layer: 'shipped' }, { path: 'runner.patterns.reviewed.loop', layer: 'standard' }, { path: 'runner.patterns.reviewed.promise', layer: 'global' }, { path: 'runner.patterns.reviewed[0]', layer: 'project' }, { path: 'runner.patterns.reviewedX', layer: 'project' }]) })],
  ['origins on a retired key', P({ reviewed: { maxRounds: 3 } }, { origins: originsFor([{ path: 'runner.patterns.reviewed', layer: 'project' }]) })],
  ['origins that are not a list', P({ mine: { promise: 'p', loop: 'swarm' } }, { origins: { path: 'x' } })],
  ['origins with unknown layers and holes', P({ mine: { promise: 'p', loop: 'swarm' } }, { origins: originsFor([null, { path: 'runner.patterns.mine', layer: 'weird' }, { path: 'runner.patterns.mine.loop' }]) })],
  ['throwOnError throws the first problem', P({ mine: { loop: 'swarm' } }, { throwOnError: true })],
  ['throwOnError with no problem', P({ mine: { promise: 'p', loop: 'solo' } }, { throwOnError: true })],
  ['shipped override with defaults merges the sections', P({ 'with-defaults': { defaults: { maxRounds: 9 } } })],
  ['an effective entry with a shipped name inside the reserved names', P({ defaultRule: { promise: 'p', loop: 'solo' } })],
  ['a pattern named __proto__ is a custom pattern', JSON.parse('{"shipped":{},"effective":{"__proto__":{"promise":"p","loop":"solo"}}}')],
];

const loopOfInputs = [
  ['solo', { runner: { patterns: { solo: { loop: 'solo' } } } }],
  ['reviewed', { effective: { runner: { patterns: { reviewed: { loop: 'reviewed' } } } } }],
  ['panel', { patterns: { panel: { loop: 'panel' } } }],
  ['debate', { debate: { loop: 'debate' } }],
  ['missing', { patterns: { solo: { loop: 'solo' } } }],
  ['solo', {}],
  ['solo', null],
  ['solo', undefined],
  ['', { solo: { loop: 'solo' } }],
  [null, { solo: { loop: 'solo' } }],
  [3, { solo: { loop: 'solo' } }],
  ['solo', { solo: { loop: 5 } }],
  ['solo', { solo: null }],
  ['constructor', { runner: { patterns: {} } }],
  ['toString', {}],
  ['__proto__', { patterns: {} }],
  ['solo', { effective: { patterns: { solo: { loop: 'panel' } } }, patterns: { solo: { loop: 'solo' } } }],
  ['solo', { runner: { patterns: 'x' }, patterns: { solo: { loop: 'solo' } } }],
  ['solo', 'text'],
];

const retiredInputs = [
  undefined, null, '', 0, 'runner.patterns.defaultRule', 'runner.patterns.defaultRule.extra', 'runner.patterns.defaultRuleX',
  'runner.patterns.reviewed.maxRounds', 'runner.patterns.reviewed.maxRounds.x', 'runner.patterns.reviewed.checkersByRigor',
  'runner.patterns.research-fan-out-gated', 'runner.patterns.research-fan-out-gated.loop', 'runner.patterns.solo', 'other.key',
  [], ['runner.patterns.defaultRule'], 5, true,
  {}, { defaultRule: true }, { defaultRule: null }, { reviewed: { maxRounds: 1 } }, { reviewed: { checkersByRigor: {} } },
  { reviewed: { maxRounds: 1, checkersByRigor: {} }, defaultRule: 1 }, { 'research-fan-out-gated': {} }, { reviewed: null }, { reviewed: [] },
  { reviewed: 'x' }, { solo: { maxRounds: 1 } }, { 'runner.patterns.defaultRule': 1 },
];

const sentenceInputs = [
  undefined, null, '', 'runner.patterns.defaultRule', 'runner.patterns.reviewed.maxRounds', 'runner.patterns.nothing',
  { key: 'runner.patterns.defaultRule' }, { key: 'some.key', instruction: 'do this' }, { key: 'some.key' }, { key: 'runner.patterns.reviewed.maxRounds', instruction: 'custom' },
  { key: 'x', instruction: '' },
];


/** The declared-seat answers the catalog check asks for: one per `seats` value of a defaults section and per `fixed` seats invariant. */
function catalogSeatOracle(shipped, effective) {
  const seats = [];
  const declaredEntries = [...Object.entries(shipped ?? {}), ...Object.entries(effective && typeof effective === 'object' ? effective : {})];
  for (const [pname, entry] of declaredEntries) {
    for (const [label, val] of [[`pattern "${pname}" defaults.seats`, entry?.defaults?.seats], [`pattern "${pname}" invariants.seats`, entry?.invariants?.seats?.fixed]]) {
      if (val !== undefined && !seats.some((x) => x.label === label && JSON.stringify(x.raw) === JSON.stringify(val))) seats.push({ label, raw: plain(val), expect: answer(() => seatMod.checkDeclaredSeats(val, label)) });
    }
  }
  return seats;
}

/** The declared-seat answers a collaboration resolution asks of each carrier of a `seats` value. */
function carrierSeatOracle(options) {
  const out = [];
  const unit = options.unit ?? {};
  const selectors = options.selectors ?? {};
  const add = (label, val) => {
    if (val === undefined || out.some((x) => x.label === label && JSON.stringify(x.raw) === JSON.stringify(val))) return;
    out.push({ label, raw: plain(val), expect: answer(() => seatMod.checkDeclaredSeats(val, label)) });
  };
  if (selectors.callerObject && typeof selectors.callerObject === 'object') add('caller object.seats', selectors.callerObject.params?.seats);
  add('unit pattern.seats', unit.pattern?.params?.seats);
  add('unit.seats', unit.params?.seats);
  add('unit.seats', unit.seats);
  add('request.seats', options.request?.params?.seats);
  add('activity unit.seats', selectors.activityUnit?.params?.seats);
  add('activity unit.seats', selectors.activityUnit?.seats);
  return out;
}

// ---------------------------------------------------------------- collaboration

const RC_SHIPPED = {
  patterns: {
    ...SHIPPED,
    'seated-panel': { promise: 'Named seats.', loop: 'panel', defaults: { seats: [{ seat: 'a', role: 'producer' }, { seat: 'b', role: 'producer' }, { seat: 'syn', role: 'synthesizer' }] } },
    'seated-debate': { promise: 'Named sides.', loop: 'debate', defaults: { seats: [{ seat: 'pro', role: 'producer' }, { seat: 'con', role: 'producer' }, { seat: 'jj', role: 'judge' }], roleTasks: { judge: 'decide' } } },
  },
  loops: { reviewed: { checkersByRigor: { standard: ['reviewer'], high: ['reviewer', 'red-team'], critical: ['reviewer', 'red-team', 'tester'] } } },
};
const U = { id: 'u1', objective: 'o', capability: 'execute' };
const UR = { ...U, capability: 'code:implement', rigor: 'high' };
const PANEL_SEATS = [{ seat: 'x', role: 'producer' }, { seat: 'y', role: 'producer' }, { seat: 's', role: 'synthesizer' }];
const DEBATE_SEATS = [{ seat: 'p1', role: 'producer' }, { seat: 'p2', role: 'producer' }, { seat: 'j', role: 'judge' }];
const RC = (extra) => ({ shipped: RC_SHIPPED, unit: U, ...extra });
const collaborationInputs = [
  ['no selector reads solo', RC({})],
  ['a unit with no pattern in a case with no activity reads solo', RC({ inCase: true })],
  ['a caller string selects reviewed', RC({ unit: UR, selectors: { callerString: 'reviewed' } })],
  ['a caller object selects a pattern by name', RC({ selectors: { callerObject: 'reviewed' } })],
  ['a caller object with params', RC({ selectors: { callerObject: { pattern: 'reviewed', params: { maxRounds: 2 } } } })],
  ['a caller object with debate rebuttal', RC({ selectors: { callerObject: { pattern: 'seated-debate', params: { rebuttal: false } } } })],
  ['a unit pattern by name', RC({ unit: { ...UR, pattern: 'reviewed' } })],
  ['a unit pattern object with params', RC({ unit: { ...UR, pattern: { pattern: 'reviewed', params: { maxRounds: 4, minCheckers: ['tester'] } } } })],
  ['a unit with its own params', RC({ unit: { ...UR, pattern: 'reviewed', params: { maxRounds: 6 } } })],
  ['a panel from the unit seats', RC({ unit: { ...U, pattern: 'panel', seats: PANEL_SEATS } })],
  ['a panel from params seats and role tasks', RC({ unit: { ...U, pattern: 'panel', params: { seats: PANEL_SEATS, roleTasks: { synthesizer: 'combine' } } } })],
  ['a debate from the unit seats with the built-in rebuttal', RC({ unit: { ...U, pattern: 'debate', seats: DEBATE_SEATS } })],
  ['a debate with rebuttal off', RC({ unit: { ...U, pattern: 'debate', seats: DEBATE_SEATS, params: { rebuttal: false } } })],
  ['a pattern whose defaults declare the seats', RC({ unit: { ...U, pattern: 'seated-panel' } })],
  ['a pattern default overlaid by the unit seats', RC({ unit: { ...U, pattern: 'seated-debate', seats: [{ seat: 'q1', role: 'producer' }, { seat: 'q2', role: 'producer' }, { seat: 'jj2', role: 'judge' }] } })],
  ['pattern defaults supply maxRounds and role tasks', RC({ unit: { ...UR, pattern: 'with-defaults' } })],
  ['the loop config supplies a parameter', RC({ unit: { ...UR, pattern: 'reviewed' }, runnerConfig: { loops: { reviewed: { maxRounds: 7 } } } })],
  ['the loop config under runner supplies a parameter', RC({ unit: { ...UR, pattern: 'reviewed' }, runnerConfig: { runner: { loops: { reviewed: { maxRounds: 8 } } } } })],
  ['a pattern floor adds checkers to the requested ones', RC({ unit: { ...UR, pattern: 'code-change', params: { minCheckers: ['tester'] } } })],
  ['a pattern floor with no requested checkers', RC({ unit: { ...UR, pattern: 'code-change' } })],
  ['a fixed seats invariant pins the seats', RC({ unit: { ...U, pattern: 'consult' } })],
  ['a unit that weakens a fixed invariant', RC({ unit: { ...UR, pattern: 'with-defaults', params: { maxRounds: 5 } } })],
  ['a unit that restates a fixed invariant', RC({ unit: { ...UR, pattern: 'with-defaults', params: { maxRounds: 3 } } })],
  ['a request that weakens a fixed invariant', RC({ unit: { ...UR, pattern: 'with-defaults' }, request: { params: { maxRounds: 9 } } })],
  ['a project pattern from the runner config', RC({ unit: { ...UR, pattern: 'mine' }, runnerConfig: { runner: { patterns: { mine: { promise: 'Mine.', loop: 'reviewed', defaults: { maxRounds: 2 } } } } } })],
  ['a project pattern under patterns', RC({ unit: { ...U, pattern: 'mine' }, runnerConfig: { patterns: { mine: { promise: 'Mine.', loop: 'solo' } } } })],
  ['an unknown pattern', RC({ unit: { ...U, pattern: 'ghost' } })],
  ['an invalid catalog refuses before anything else', RC({ runnerConfig: { patterns: { mine: { loop: 'swarm' } } } })],
  ['conflicting selectors', RC({ unit: { ...U, pattern: 'panel' }, selectors: { callerString: 'reviewed' } })],
  ['agreeing selectors', RC({ unit: { ...UR, pattern: 'reviewed' }, selectors: { callerString: 'reviewed', callerObject: 'reviewed' } })],
  ['an empty selector string is no selector', RC({ unit: { ...U, pattern: '' }, selectors: { callerString: '' } })],
  ['a request of params', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { params: { maxRounds: 3 } } })],
  ['a request of scalars as strings', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: ['maxRounds=4'] } })],
  ['a request scalar boolean', RC({ unit: { ...U, pattern: 'debate', seats: DEBATE_SEATS }, request: { scalars: [['rebuttal', 'false']] } })],
  ['a request scalar as a key and value object', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: [{ key: 'maxRounds', value: '5' }] } })],
  ['a request scalar as an own-entries object', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: [{ maxRounds: 2 }] } })],
  ['a request scalars map', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: { maxRounds: '2' } } })],
  ['a request scalar of a negative integer', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: ['maxRounds=-2'] } })],
  ['a request scalar of a non-integer', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: ['maxRounds=two'] } })],
  ['a request scalar with a decimal', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: ['maxRounds=2.5'] } })],
  ['a request scalar number below one', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: [{ key: 'maxRounds', value: 0 }] } })],
  ['a request scalar integer true', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: [{ key: 'maxRounds', value: true }] } })],
  ['a request scalar boolean invalid', RC({ unit: { ...U, pattern: 'debate', seats: DEBATE_SEATS }, request: { scalars: ['rebuttal=maybe'] } })],
  ['a request scalar for a parameter that is not scalar', RC({ unit: { ...U, pattern: 'panel', seats: PANEL_SEATS }, request: { scalars: ['seats=x'] } })],
  ['a request scalar for an unknown parameter', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: ['ghost=1'] } })],
  ['a request scalar given twice', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: ['maxRounds=1', 'maxRounds=2'] } })],
  ['a request scalar also in params', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { params: { maxRounds: 1 }, scalars: ['maxRounds=2'] } })],
  ['a request scalar without a delimiter', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: ['maxRounds'] } })],
  ['a request scalar with an empty value', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: [{ key: 'maxRounds', value: '' }] } })],
  ['a request scalar with a null value', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: [{ key: 'maxRounds', value: null }] } })],
  ['a request scalar with an object value', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: [{ key: 'maxRounds', value: { a: 1 } }] } })],
  ['a request scalar with an array value', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: [{ key: 'maxRounds', value: [1] }] } })],
  ['a request scalar with an empty key', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: [['', '1']] } })],
  ['a request scalar array entry too long', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: [['a', 'b', 'c']] } })],
  ['a request scalar array entry empty', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: [[]] } })],
  ['a request scalar object entry empty', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: [{}] } })],
  ['a request scalar item of a bad type', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: [5] } })],
  ['a request scalars of a bad type', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { scalars: 'maxRounds=1' } })],
  ['a request that is not an object', RC({ unit: { ...UR, pattern: 'reviewed' }, request: 'x' })],
  ['a request null is no request', RC({ unit: { ...UR, pattern: 'reviewed' }, request: null })],
  ['request params that are not an object', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { params: [] } })],
  ['request role tasks are not requestable', RC({ unit: { ...U, pattern: 'panel', seats: PANEL_SEATS }, request: { params: { roleTasks: { x: 'y' } } } })],
  ['a request parameter the loop does not read', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { params: { rebuttal: true } } })],
  ['a request parameter out of its domain', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { params: { maxRounds: 0 } } })],
  ['a request of seats', RC({ unit: { ...U, pattern: 'panel' }, request: { params: { seats: PANEL_SEATS } } })],
  ['a request of invalid seats', RC({ unit: { ...U, pattern: 'panel', seats: PANEL_SEATS }, request: { params: { seats: 'x' } } })],
  ['a request in a case needs a reason', RC({ unit: { ...UR, pattern: 'reviewed' }, inCase: true, request: { params: { maxRounds: 3 } } })],
  ['a request in a case with a blank reason', RC({ unit: { ...UR, pattern: 'reviewed' }, inCase: true, reason: '  ', request: { params: { maxRounds: 3 } } })],
  ['a request in a case with a reason', RC({ unit: { ...UR, pattern: 'reviewed' }, inCase: true, reason: '  the review is long  ', request: { params: { maxRounds: 3 } } })],
  ['an activity baseline in a case', RC({ unit: UR, inCase: true, selectors: { activityUnit: { pattern: 'reviewed', params: { maxRounds: 2 } } } })],
  ['an activity baseline with loose seats', RC({ unit: U, inCase: true, selectors: { activityUnit: { pattern: 'panel', seats: PANEL_SEATS } } })],
  ['an activity pattern outside a case is ignored', RC({ unit: U, selectors: { activityUnit: { pattern: 'reviewed' } } })],
  ['an explicit pattern swaps the activity pattern', RC({ unit: { ...UR, pattern: 'reviewed' }, inCase: true, selectors: { activityUnit: { pattern: 'code-change' } } })],
  ['a swap with a request keeps the request reason', RC({ unit: { ...UR, pattern: 'reviewed' }, inCase: true, reason: 'because', request: { params: { maxRounds: 2 } }, selectors: { activityUnit: { pattern: 'code-change' } } })],
  ['a swap reads the activity invariants', RC({ unit: { ...U, pattern: 'solo' }, inCase: true, selectors: { activityUnit: { pattern: 'code-change' } } })],
  ['a swap whose loop does not read the activity invariant', RC({ unit: { ...U, pattern: 'panel', seats: PANEL_SEATS }, inCase: true, selectors: { activityUnit: { pattern: 'consult' } } })],
  ['a swap to the same pattern is no swap', RC({ unit: { ...UR, pattern: 'reviewed' }, inCase: true, selectors: { activityUnit: { pattern: 'reviewed' } } })],
  ['an activity unit naming an unknown pattern', RC({ unit: U, inCase: true, selectors: { activityUnit: { pattern: 'ghost' } } })],
  ['activity params that are not an object', RC({ unit: U, inCase: true, selectors: { activityUnit: { pattern: 'reviewed', params: 'x' } } })],
  ['activity params of an unknown key', RC({ unit: U, inCase: true, selectors: { activityUnit: { pattern: 'reviewed', params: { ghost: 1 } } } })],
  ['activity params out of domain', RC({ unit: U, inCase: true, selectors: { activityUnit: { pattern: 'reviewed', params: { maxRounds: 0 } } } })],
  ['an activity unit with no pattern checks its params against solo', RC({ unit: U, inCase: true, selectors: { activityUnit: { params: { maxRounds: 2 } } } })],
  ['unit params that are not an object', RC({ unit: { ...U, params: [] } })],
  ['unit pattern params that are not an object', RC({ unit: { ...U, pattern: { pattern: 'reviewed', params: 'x' } } })],
  ['caller object params that are not an object', RC({ selectors: { callerObject: { pattern: 'reviewed', params: 'x' } } })],
  ['a caller object param the loop does not read', RC({ selectors: { callerObject: { pattern: 'reviewed', params: { ghost: 1 } } } })],
  ['a unit param the loop does not read', RC({ unit: { ...UR, pattern: 'reviewed', params: { rebuttal: true } } })],
  ['a unit pattern param out of domain', RC({ unit: { ...UR, pattern: { pattern: 'reviewed', params: { maxRounds: 1.5 } } } })],
  ['a minCheckers param naming an unknown checker', RC({ unit: { ...UR, pattern: 'reviewed', params: { minCheckers: ['ghost'] } } })],
  ['a rebuttal param that is not a boolean', RC({ unit: { ...U, pattern: 'debate', seats: DEBATE_SEATS, params: { rebuttal: 'no' } } })],
  ['role tasks that are not a map of strings', RC({ unit: { ...U, pattern: 'panel', seats: PANEL_SEATS, params: { roleTasks: { synthesizer: 3 } } } })],
  ['role tasks that are an array', RC({ unit: { ...U, pattern: 'panel', seats: PANEL_SEATS, params: { roleTasks: [] } } })],
  ['unit seats the declared-seat check refuses', RC({ unit: { ...U, pattern: 'panel', seats: 'x' } })],
  ['unit loose seats and params seats: params win', RC({ unit: { ...U, pattern: 'panel', seats: PANEL_SEATS, params: { seats: [{ seat: 'm', role: 'producer' }, { seat: 'n', role: 'producer' }, { seat: 'z', role: 'synthesizer' }] } } })],
  ['a request bound under the loop bound', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { params: { maxRounds: 1 } }, runnerConfig: { loops: { reviewed: { bounds: { maxRounds: { min: 2, max: 5 } } } } } })],
  ['a request bound over the loop bound', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { params: { maxRounds: 9 } }, runnerConfig: { loops: { reviewed: { bounds: { maxRounds: { min: 2, max: 5 } } } } } })],
  ['a request inside the loop bound', RC({ unit: { ...UR, pattern: 'reviewed' }, request: { params: { maxRounds: 3 } }, runnerConfig: { loops: { reviewed: { bounds: { maxRounds: { min: 2, max: 5 } } } } } })],
  ['a unit value outside the loop bound is not checked', RC({ unit: { ...UR, pattern: 'reviewed', params: { maxRounds: 9 } }, runnerConfig: { loops: { reviewed: { bounds: { maxRounds: { min: 2, max: 5 } } } } } })],
  ['origins name the layer of the selected pattern', RC({ unit: { ...UR, pattern: 'reviewed' }, origins: [{ path: 'runner.patterns.reviewed.defaults', layer: 'global' }] })],
  ['origins that do not name the pattern fall back to equality', RC({ unit: { ...UR, pattern: 'reviewed' }, origins: [{ path: 'runner.patterns.other', layer: 'project' }] })],
  ['an overridden shipped entry is a project pattern', RC({ unit: { ...UR, pattern: 'reviewed' }, runnerConfig: { patterns: { reviewed: { defaults: { maxRounds: 2 } } } } })],
  ['a reviewed unit by rigor critical', RC({ unit: { ...UR, rigor: 'critical', pattern: 'reviewed' } })],
  ['a reviewed unit by rigor standard', RC({ unit: { ...U, capability: 'review', rigor: 'standard', pattern: 'reviewed' } })],
  ['options with nothing but the shipped catalog', { shipped: RC_SHIPPED }],
  ['no shipped catalog', { unit: U }],
  ['a unit that is not an object', RC({ unit: 'x' })],
];

function collaborationVectors() {
  const cases = [];
  for (const [name, options] of collaborationInputs) {
    const effectivePatterns = options.runnerConfig?.runner?.patterns ?? options.runnerConfig?.patterns ?? {};
    const hostSeats = [...catalogSeatOracle(options.shipped?.patterns, effectivePatterns), ...carrierSeatOracle(options)];
    const call = () => catalogMod.resolveCollaboration({ ...options });
    const expect = answer(call);
    const record = { name, options: plain(options), hostSeats, expect };
    if (expect.ok) {
      const result = call();
      const unit = options.unit ?? {};
      const runnerConfig = options.runnerConfig ?? {};
      const { entries } = entriesMod.checkCatalog({ shipped: options.shipped?.patterns, effective: effectivePatterns, origins: options.origins ?? null, throwOnError: true });
      const floors = [];
      const addFloors = (entry, pname) => { for (const c of entry?.invariants?.minCheckers?.atLeast ?? []) floors.push({ name: c, source: `pattern-invariant:${pname}` }); };
      addFloors(result.entry, result.pin.pattern.name);
      const swapped = result.pin.requested?.pattern ?? null;
      if (swapped) addFloors(entries[options.selectors.activityUnit.pattern], options.selectors.activityUnit.pattern);
      const seatInput = {
        loop: result.loop, params: result.params, floors: floors.length > 0 ? { minCheckers: floors } : undefined, unit, runnerConfig,
        slot: result.pin.provenance.params.minCheckers, shippedCheckersByRigor: options.shipped?.loops?.reviewed?.checkersByRigor,
      };
      const seating = { input: plain(seatInput), resolveSeats: answer(() => seatMod.resolveSeats(seatInput)), seatLaunchesOf: answer(() => seatMod.seatLaunchesOf(seatInput)) };
      if (result.loop === 'reviewed') {
        const planOptions = { requested: result.params.minCheckers, floors: seatInput.floors, slot: seatInput.slot, shippedCheckersByRigor: seatInput.shippedCheckersByRigor };
        seating.checkerPlan = { unit: plain(unit), runnerConfig: plain(runnerConfig), options: plain(planOptions), expect: answer(() => seatMod.checkerPlanOf(unit, runnerConfig, planOptions)) };
      }
      record.hostSeating = seating;
      // The whole answer must be the one the seat answers rebuild; a mismatch means the input above differs from the real call.
      if (JSON.stringify(plain(result.seats)) !== JSON.stringify(seating.resolveSeats.ok)) throw new Error(`recorder: seat input of "${name}" differs from the real call`);
    } else if (expect.error.name === 'SeatResolutionError' && !hostSeats.some((x) => x.expect.error && x.expect.error.message === expect.error.message)) {
      throw new Error(`recorder: "${name}" fails in a seat module (${expect.error.message}); give it an input that fails in the catalog or a carrier check`);
    }
    cases.push(record);
  }
  return cases;
}

function patternVectors() {
  const tableKeys = {};
  for (const loop of ['solo', 'reviewed', 'panel', 'debate']) tableKeys[loop] = Object.keys(loopsMod.paramTableOf(loop));
  const host = {
    loopNames: [...seatMod.LOOP_NAMES],
    paramTables: tableKeys,
    paramDefs: Object.fromEntries(['solo', 'reviewed', 'panel', 'debate'].map((loop) => [loop, plain(loopsMod.paramTableOf(loop))])),
    defaultRebuttal: loopsMod.DEFAULT_REBUTTAL,
    checkerSeats: plain(seatMod.CHECKER_SEATS),
  };
  const catalog = catalogInputs.map(([name, options]) => {
    const seats = catalogSeatOracle(options.shipped, options.effective);
    const result = answer(() => {
      const { entries, merged, problems } = entriesMod.checkCatalog({ ...options });
      return { entries, mergedEqualsEntries: merged === entries, problems: problems.map(refusal) };
    });
    return { name, options: plain(options), hostSeats: seats, expect: result };
  });
  return {
    host,
    checkCatalog: catalog,
    resolveCollaboration: collaborationVectors(),
    loopOf: loopOfInputs.map(([name, options]) => ({ name: name === undefined ? { $undefined: true } : plain(name), options: options === undefined ? { $undefined: true } : plain(options), expect: answer(() => catalogMod.loopOf(name, options)) })),
    detectRetiredPatternKeys: retiredInputs.map((input) => ({ input: input === undefined ? { $undefined: true } : plain(input), expect: answer(() => retiredMod.detectRetiredPatternKeys(input)) })),
    formatRetiredKeySentence: sentenceInputs.map((item) => ({ item: item === undefined ? { $undefined: true } : plain(item), expect: answer(() => retiredMod.formatRetiredKeySentence(item)) })),
    constants: {
      retiredGatedName: retiredMod.RETIRED_GATED_NAME,
      reservedPatternNames: [...retiredMod.RESERVED_PATTERN_NAMES],
      seatBindingMarkerPath: retiredMod.SEAT_BINDING_MARKER_PATH,
      retiredConfigKeys: plain(retiredMod.RETIRED_CONFIG_KEYS),
    },
    collaborationError: [
      ['param-invalid', 'bad value'], ['x-code', 'with source', { source: 'project', path: 'a.b' }], ['a b c', 'swapped-code'], ['only a message'],
      ['code-only-no-message', undefined], ['code', ''],
    ].map(([code, message, options]) => {
      const err = entriesMod.CollaborationError(code, message, options);
      return { code, message: message ?? null, options: options ?? null, expect: refusal(err) };
    }),
  };
}

// ---------------------------------------------------------------- write

const files = {
  'unit.v1.json': {
    contract: 'core-unit-validate.v1',
    doc: 'validateUnit and its normalizers as Node answers them. `host` is what the declared-seat check and the run-timeout rule answered for the same input. `$undefined` marks an absent argument. A refusal whose text ends in a write-scope sentence is compared by its prefix `unit.writes[i] must be a non-empty repo-relative path: `.',
    tiers: TIERS,
    rigorValues: [...rigorMod.RIGOR_VALUES],
    validateUnit: unitVectors(),
    normalizers: normalizerVectors(),
  },
  'run-request.v1.json': {
    contract: 'core-run-request.v1',
    doc: 'The flag-to-request rules of `fgos run` as Node answers them, with the shell side (working directory, git roots, case admission) injected as recorded in each vector. An id ending in -HEX4 stands for four random hex digits.',
    ...runRequestVectors(),
  },
  'patterns.v1.json': {
    contract: 'core-patterns.v1',
    doc: 'The pattern catalog check, loopOf and the retired-key rules as Node answers them. `host` is the sibling answers the catalog reads (loop names and parameter tables, checker seats); each catalog case carries the declared-seat answers it asked.',
    shipped: SHIPPED,
    ...patternVectors(),
  },
};

fs.mkdirSync(OUT, { recursive: true });
let drift = 0;
for (const [name, body] of Object.entries(files)) {
  const text = `${JSON.stringify(body, null, 1)}\n`;
  const file = path.join(OUT, name);
  if (CHECK) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) {
      drift += 1;
      process.stderr.write(`drift: ${path.relative(ROOT, file)}\n`);
    }
  } else {
    fs.writeFileSync(file, text);
    process.stdout.write(`wrote ${path.relative(ROOT, file)} (${text.length} bytes)\n`);
  }
}
if (CHECK) process.exit(drift === 0 ? 0 : 1);
