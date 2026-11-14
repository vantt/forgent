#!/usr/bin/env node
// Equivalence harness for the capability read door (evidence, not a test).
//
//   node compare-capability-reads.mjs --base <worktree> --head <worktree> --out <dir> [--run <name>] [--base-target <cargo dir>]
//
// Each side (a registered git worktree, or the main checkout) runs in its own child process with that
// checkout's own modules and the same host binary and native addon: both are staged once from the base
// checkout and copied byte for byte into the head checkout's staging directory, so no Rust difference between
// the two commits can show up as a difference in an answer. The child loads the effective runner section
// of a fresh project (shipped standard), of this repo and of a synthetic edge matrix built from the first,
// asks every question below per capability name, and writes canonical JSON. The parent compares the two
// outputs question by question. A difference is allowed only when an entry of ALLOWLIST (named after a row
// of the plan's intended deltas) claims it; anything else fails. Full outputs stay under --out; the summary
// committed as evidence carries digests and delta names only.
//
// Exit 0: no failure. Exit 1: a failure, or a bad invocation.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const PROTOTYPE_NAMES = Object.freeze(['constructor', 'toString', 'hasOwnProperty', '__proto__']);
const RIGORS = Object.freeze(['low', 'standard', 'high', 'critical']);

// ---- intended deltas ------------------------------------------------------------------------------
// Each entry names a row of plan.md "Intended deltas". `claims({input, question, name})` is true only for the
// narrow slice of the matrix where that delta shows.
const ALLOWLIST = Object.freeze([
  {
    delta: 'prototype-names',
    claims: ({ name }) => PROTOTYPE_NAMES.includes(name),
  },
  {
    delta: 'non-object-entry',
    claims: ({ input, question }) => input === 'm-entries' && ['registeredCapability', 'proposalRefusals', 'operationCapability'].includes(question),
  },
  {
    delta: 'string-aliases',
    claims: ({ input, question }) => input === 'm-aliases' && ['registeredCapability', 'proposalRefusals'].includes(question),
  },
]);

const sha = (text) => `sha256:${crypto.createHash('sha256').update(text).digest('hex')}`;

function canonical(value) {
  if (value === undefined) return '"__undefined__"';
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

// ================================================================================================
// Child: one side, in its own process.
// ================================================================================================

class Missing extends Error {}

async function childMain(args) {
  const { root, out, project, repoDir, side } = args;
  const load = async (rel) => import(pathToFileURL(path.join(root, rel)).href);
  const has = (rel) => fs.existsSync(path.join(root, rel));
  const mods = {
    config: await load('src/runner/dispatch/config.mjs'),
    seatPolicy: await load('src/runner/execution/seat-policy.mjs'),
    seatResolver: await load('src/runner/execution/seat-resolver.mjs'),
    verify: await load('src/runner/execution/loops/verify.mjs'),
    resolve: await load('src/runner/dispatch/resolve.mjs'),
    opCap: await load('src/runner/operation-capability.mjs'),
    request: await load('src/runner/dispatch/confinement/request.mjs'),
    plan: await load('src/runner/dispatch/plan.mjs'),
    run: await load('src/runner/execution/run.mjs'),
    legacy: await load('src/runner/execution/legacy-seat-read.mjs'),
    lint: await load('src/report/capability-plan-lint.mjs'),
    propose: await load('src/workflow/propose.mjs'),
    proposeValidate: await load('src/workflow/propose-validate.mjs'),
    bind: await load('src/runner/execution/bind.mjs'),
    shipped: await load('src/runner/dispatch/shipped-catalog.mjs'),
    port: has('src/runner/execution/capability-config.mjs') ? await load('src/runner/execution/capability-config.mjs') : null,
  };

  const registeredCapabilityOf = mods.port?.registeredCapabilityOf ?? mods.config.registeredCapabilityOf;
  if (typeof registeredCapabilityOf !== 'function') throw new Missing('registeredCapabilityOf');
  if (side === 'head' && !mods.port) throw new Missing('capability-config.mjs');

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const standard = clone(mods.config.loadRunnerConfigForDir(project));
  const repo = clone(mods.config.loadRunnerConfigForDir(repoDir));

  // ---- the synthetic matrix, built from the standard section ----
  const withCaps = (base, patch) => {
    const cfg = clone(base);
    cfg.capabilities = { ...cfg.capabilities, ...patch };
    return cfg;
  };
  const executorIds = Object.keys(standard.executors ?? {});
  const firstExecutor = executorIds.find((id) => standard.executors[id]?.kind !== 'tool') ?? executorIds[0];
  const secondExecutor = executorIds.find((id) => id !== firstExecutor && standard.executors[id]?.kind !== 'tool') ?? firstExecutor;
  const matrix = {};
  matrix['m-verify'] = withCaps(standard, {
    'code:implement': { ...(standard.capabilities['code:implement'] ?? {}), verify: 'node gate.mjs' },
    'code:*': { ...(standard.capabilities['code:*'] ?? {}), verify: 'node prefix-gate.mjs' },
    'blank:verify': { verify: '   ' },
    'review': { ...(standard.capabilities.review ?? {}), verify: 'node review-gate.mjs' },
  });
  matrix['m-nested'] = { runner: matrix['m-verify'] };
  matrix['m-both'] = {
    capabilities: { 'code:implement': { persona: 'flat-persona', minCheckers: ['reviewer'] } },
    runner: { capabilities: { 'code:implement': { persona: 'nested-persona', minCheckers: ['tester'] }, 'docs:write': { persona: 'nested-docs' } } },
  };
  matrix['m-persona-minc'] = withCaps(standard, {
    'code:implement': { ...(standard.capabilities['code:implement'] ?? {}), persona: 'exact-persona', minCheckers: ['reviewer'] },
    'code:*': { ...(standard.capabilities['code:*'] ?? {}), persona: 'prefix-persona', minCheckers: ['tester'] },
    'code:debug': { persona: 'debug-persona', minCheckers: [] },
    'docs:*': { persona: 'docs-prefix-persona', rigor: 'high' },
  });
  const invocations = standard.executors?.[firstExecutor]?.invocations;
  const firstInvocation = Array.isArray(invocations) ? invocations[0]?.id : Object.keys(invocations ?? {})[0];
  matrix['m-prefer'] = withCaps(standard, {
    'pref:string': { prefer: firstExecutor },
    'pref:list': { prefer: [firstExecutor, secondExecutor] },
    'pref:pinned': { prefer: [{ executor: firstExecutor, invocation: firstInvocation }, secondExecutor] },
    'pref:*': { prefer: [secondExecutor] },
    'pref:inherits': { description: 'no prefer of its own' },
  });
  matrix['m-prefer-blank'] = withCaps(standard, { 'pref:blank': { prefer: '   ' }, 'pref:empty': { prefer: [] }, 'pref:*': { prefer: [secondExecutor] } });
  matrix['m-entries'] = withCaps(standard, { 'null:entry': null, 'string:entry': 'x', 'array:entry': ['x'], 'object:entry': { description: 'ok' }, 'null:review': null, 'string:review': 'x', 'array:review': ['x'] });
  matrix['m-aliases'] = withCaps(standard, {
    'alias:string': { aliases: 'wide-alias-name' },
    'alias:one': { aliases: ['dup', 'solo-alias'] },
    'alias:two': { aliases: ['dup'] },
    'alias:own': { aliases: ['alias:one'] },
  });
  matrix['m-nocolon'] = withCaps(standard, {
    plain: { persona: 'plain-persona', rigor: 'high', minCheckers: ['reviewer'], verify: 'node plain.mjs' },
    'plain:x': { description: 'with a colon' },
    review: { ...(standard.capabilities.review ?? {}), rigor: 'critical' },
  });
  {
    // Prototype names as own capability keys and executor ids: JSON.parse makes `__proto__` an own key.
    const protoCaps = JSON.parse(`{${PROTOTYPE_NAMES.map((n) => `${JSON.stringify(n)}: {"description": "proto ${n}", "persona": "p-${n.replace(/_/g, '')}", "prefer": ${JSON.stringify(firstExecutor)}}`).join(',')}}`);
    const protoExecutors = JSON.parse(`{${PROTOTYPE_NAMES.map((n) => `${JSON.stringify(n)}: ${JSON.stringify(standard.executors?.[firstExecutor] ?? {})}`).join(',')}}`);
    const cfg = clone(standard);
    cfg.capabilities = { ...Object.fromEntries(Object.entries(cfg.capabilities)), ...Object.fromEntries(Object.entries(protoCaps)) };
    for (const name of PROTOTYPE_NAMES) Object.defineProperty(cfg.capabilities, name, { value: protoCaps[name], enumerable: true, configurable: true, writable: true });
    cfg.executors = { ...cfg.executors };
    for (const name of PROTOTYPE_NAMES) Object.defineProperty(cfg.executors, name, { value: protoExecutors[name], enumerable: true, configurable: true, writable: true });
    matrix['m-proto-own'] = cfg;
  }
  matrix['m-proto-absent'] = clone(standard);
  matrix['m-rigor'] = withCaps(standard, { 'rigor:bad': { rigor: 'extreme' }, 'rigor:ok': { rigor: 'critical' } });

  const inputs = { standard, repo, ...matrix };

  // ---- names per input ----
  const namesOf = (cfg) => {
    const section = cfg?.capabilities ?? cfg?.runner?.capabilities ?? {};
    const declared = section && typeof section === 'object' ? Object.keys(section) : [];
    const aliases = declared.flatMap((n) => (Array.isArray(section[n]?.aliases) ? section[n].aliases : []));
    const executors = Object.keys(cfg?.executors ?? cfg?.runner?.executors ?? {});
    const extra = ['code:review', 'review', 'nope:x', 'code', 'docs:other', 'wide', 'alias-name', ...PROTOTYPE_NAMES];
    return [...new Set([...declared, ...aliases, ...executors, ...extra].filter((n) => typeof n === 'string'))].sort();
  };
  const flat = (cfg) => (cfg && typeof cfg === 'object' && !('capabilities' in cfg) && cfg.runner && typeof cfg.runner === 'object' ? cfg.runner : cfg);

  // ---- questions ----
  const guide = { id: 'coding/feature', frameDefaults: { dispatches: 'set-at-approval', mutatingDispatches: 'set-at-approval', seatLaunchesPerDispatch: 'set-at-approval', fallbackPerSeat: 2, deviationsBeforeAsk: 2, rigorFloor: 'set-at-approval' }, activities: [{ id: 'judge-ambiguity', effects: 'none', unit: { pattern: 'solo' } }, { id: 'validate-plan', effects: 'none', unit: { pattern: 'reviewed' } }, { id: 'implement-item', effects: 'writes', unit: { pattern: 'reviewed' } }, { id: 'review-item', effects: 'none' }] };
  const fakePorts = (files) => {
    const dirs = new Set(['.']);
    for (const file of files) for (let at = path.posix.dirname(file); at !== '.'; at = path.posix.dirname(at)) dirs.add(at);
    return {
      repo: { stat: (p) => (files.includes(p) ? 'file' : dirs.has(p) ? 'dir' : null), listFiles: (s) => (s === '.' ? files : files.filter((f) => f === s || f.startsWith(`${s}/`))), findTests: () => [], crateOf: () => null },
      headCommit: () => 'c0ffee0000000000000000000000000000000000',
      findInherit: () => null,
    };
  };
  const shippedCheckers = mods.shipped.shippedCatalog().loops.reviewed.checkersByRigor;

  const attempt = (fn) => {
    try {
      return fn();
    } catch (err) {
      if (err instanceof Missing) throw err;
      return { threw: `${err?.name ?? 'Error'}: ${err?.message ?? String(err)}` };
    }
  };
  const summarizeResolved = (r) => ({ executorId: r.executorId, configured: r.configured, bindingSource: r.bindingSource, invocationId: r.invocationId ?? null, candidates: r.candidates ?? null, hasExecutor: Boolean(r.executor) });

  // Per-input questions (no name).
  const onceQuestions = {
    seatConfigDigest: (cfg) => mods.seatPolicy.seatConfigDigestOf(cfg).digest,
    snapshotHash: (cfg) => mods.run.snapshotRunnerConfig(repoDir, cfg).hash,
    validateShape: (cfg) => {
      mods.config.validateRunnerConfigShape(cfg, 'matrix');
      return 'valid';
    },
    lint: (cfg, names) => {
      const text = `# Phase\n\n## Units\n${names.map((n, i) => `- unit: u${i}\n  capability: ${JSON.stringify(n)}\n  rigor: standard\n  writes: []\n  dependsOn: []\n  pattern: reviewed\n  objective: "probe"\n`).join('\n')}`;
      const result = mods.lint.lintPhaseUnits(text, { config: { runner: cfg } });
      return { ok: result.ok, findings: result.findings.map((f) => `${f.code}|${f.unit ?? ''}|${f.message}`) };
    },
    proposal: (cfg) => {
      const files = ['plans/p/plan.md', 'src/a.mjs', 'docs/note.md'];
      const p = mods.propose.proposeFromSlices({
        manifest: { slices: [{ id: 'a', objective: 'Do a', writes: ['src/a.mjs'], verify: 'node check-a.mjs' }] },
        plan: 'plans/p/plan.md', guide, runnerConfig: cfg, shipped: mods.shipped.shippedCatalog(), ports: fakePorts(files), worktree: '/wt/case', branch: 'case/p',
      });
      return p.refusals.map((r) => `${r.code}|${r.detail}`);
    },
  };

  // Per-name questions.
  const nameQuestions = {
    effectiveRigor: (cfg, name) => [mods.seatResolver.effectiveRigorOf({ capability: name }, cfg), mods.seatResolver.effectiveRigorOf({ capability: name, rigor: 'low' }, cfg, { fallback: 'standard' })],
    checkerPlan: (cfg, name) => Object.fromEntries(RIGORS.map((rigor) => [rigor, attempt(() => mods.seatResolver.checkerPlanOf({ capability: name, rigor }, cfg, { shippedCheckersByRigor: shippedCheckers }))])),
    registeredCapability: (cfg, name) => registeredCapabilityOf(flat(cfg), name) ?? null,
    verifyCommand: (cfg, name) => mods.verify.verifyCommandOf({ capability: name }, cfg) ?? null,
    executorAndOverrides: (cfg, name) => summarizeResolved(mods.resolve.resolveExecutorAndOverrides(cfg, name)),
    capabilityDetailsExecutor: (cfg, name) => mods.resolve.resolveCapabilityDetailsFromHints({ cfg, executorId: name, resolvedExecutor: Object.hasOwn(cfg.executors ?? {}, name) ? cfg.executors[name] : undefined, hints: {} }),
    capabilityDetailsCandidate: (cfg, name) => mods.resolve.resolveCapabilityDetailsFromHints({ cfg, hints: { candidates: [name] } }),
    confinement: (cfg, name) => {
      const req = mods.request.buildConfinementRequest({ capability: name, executorId: 'probe', cfg, context: { runDir: '/probe/run' }, dispatchId: 'disp_probe', anchorCapability: null });
      const r = req.requirement ?? {};
      return { mode: r.mode, policyId: r.policyId ?? null, anchor: r.anchor ?? null, omitted: r.omitted ?? false };
    },
    dispatchPlan: (cfg, name) => {
      const plan = mods.plan.compileDispatchPlan(cfg, { for: name });
      return { mechanism: plan.mechanism, executorId: plan.executorId ?? null, capability: plan.capability ?? null, reasonCodes: plan.reasonCodes ?? null, configured: plan.configured ?? null };
    },
    legacyChecker: (cfg, name) => mods.legacy.legacySeatsOf({ pattern: 'reviewed', unit: { capability: name, rigor: 'standard' }, configSnapshot: { runner: cfg } }).map((s) => s.seat),
    proposalRefusals: (cfg, name) => {
      const files = ['src/a.mjs'];
      const ports = fakePorts(files).repo;
      const verdict = mods.proposeValidate.validateProposal({ slices: [{ id: 's', writes: ['src/a.mjs'], rigor: 'standard', capability: name, followUp: { capability: name } }], runnerConfig: cfg, ports });
      return verdict.refusals.map((r) => `${r.code}|${r.detail}`);
    },
    bind: (cfg, name) => {
      const binding = mods.bind.bind(
        { unit: { id: 'probe', capability: name, writes: [] }, seat: 'producer', role: 'producer', readOnly: false, overrides: [], raiseAuthorized: false },
        { runnerConfig: cfg, session: { headless: true, postureAtLaunch: true } },
      );
      const copy = clone(binding);
      if (copy?.bindingInput) delete copy.bindingInput.hostVersion;
      return copy;
    },
  };
  // Per-domain question: the operation capability derivation.
  const domainQuestion = (cfg, domain) => mods.opCap.deriveOperationCapability({ result: { kind: 'advisory' } }, { domain }, cfg);

  const results = {};
  for (const [inputName, cfg] of Object.entries(inputs)) {
    const names = namesOf(cfg);
    const domains = [...new Set(names.filter((n) => n.includes(':')).map((n) => n.split(':')[0]))].sort();
    const answers = {};
    const put = (question, key, fn) => {
      try {
        answers[question] ??= {};
        answers[question][key] = fn();
      } catch (err) {
        if (err instanceof Missing) throw err;
        answers[question][key] = { threw: `${err?.name ?? 'Error'}: ${err?.message ?? String(err)}` };
      }
    };
    for (const [question, fn] of Object.entries(onceQuestions)) put(question, '-', () => fn(cfg, names));
    for (const [question, fn] of Object.entries(nameQuestions)) for (const name of names) put(question, name, () => fn(cfg, name));
    for (const domain of domains) put('operationCapability', domain, () => domainQuestion(cfg, domain));
    results[inputName] = answers;
  }
  fs.writeFileSync(out, JSON.stringify(results));
}

// ================================================================================================
// Parent
// ================================================================================================

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--child') args.child = true;
    else if (arg.startsWith('--')) args[arg.slice(2)] = argv[++i];
  }
  return args;
}

function fail(message) {
  process.stderr.write(`compare-capability-reads: ${message}\n`);
  process.exit(1);
}

function registeredCheckouts(cwd) {
  const text = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd, encoding: 'utf8' });
  return text.split('\n').filter((l) => l.startsWith('worktree ')).map((l) => fs.realpathSync(l.slice('worktree '.length)));
}


/**
 * One host binary and one addon for both sides. Base stages them from its own sources (one cargo build, reused);
 * head gets the same bytes copied into its own staging directory, with a manifest that names head as the
 * payload, which is what the in-process door checks.
 */
async function stageDoor({ base, head, baseTarget }) {
  const lib = async (root, rel) => import(pathToFileURL(path.join(root, rel)).href);
  const baseStage = await lib(base, 'scripts/lib/git-addon-stage.mjs');
  const baseEnv = { ...process.env, CARGO_TARGET_DIR: baseTarget ?? path.join(base, 'target') };
  delete baseEnv.FGOS_HOST_BIN;
  const staged = baseStage.ensureGitAddon(baseEnv, base);
  const forBase = { FGOS_HOST_BIN: baseEnv.FGOS_HOST_BIN, FGOS_ACTIVE_RELEASE_PATH: baseEnv.FGOS_ACTIVE_RELEASE_PATH, FGOS_ACTIVE_MANIFEST_PATH: baseEnv.FGOS_ACTIVE_MANIFEST_PATH };
  if (base === head) return { base: forBase, head: forBase };

  const headStage = await lib(head, 'scripts/lib/git-addon-stage.mjs');
  const manifestLib = await lib(head, 'scripts/lib/dev-host-manifest.mjs');
  const dir = headStage.gitAddonDirectory(head);
  fs.mkdirSync(dir, { recursive: true });
  const addonFile = path.join(dir, 'fgos.node');
  const hostBin = path.join(dir, 'fgos');
  fs.copyFileSync(staged.addon, addonFile);
  fs.copyFileSync(staged.hostBin, hostBin);
  fs.chmodSync(hostBin, 0o755);
  const manifestPath = path.join(dir, 'manifest.json');
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifestLib.devHostManifest({ checkoutRoot: head, fgosBin: hostBin, addonFile }), null, 2)}\n`);
  const headEnv = manifestLib.devHostEnv({}, { fgosBin: hostBin, checkoutRoot: head, manifestPath });
  return { base: forBase, head: headEnv };
}

function runSide({ side, root, out, project, repoDir, env }) {
  const child = spawnSync(process.execPath, [SELF, '--child', '--root', root, '--out', out, '--project', project, '--repoDir', repoDir, '--side', side], {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: 20 * 60 * 1000,
  });
  if (child.status !== 0) return { error: `${side} exited ${child.status}${child.signal ? ` (${child.signal})` : ''}: ${(child.stderr || child.stdout || '').slice(-1200)}` };
  return { results: JSON.parse(fs.readFileSync(out, 'utf8')) };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.base || !args.head || !args.out) fail('usage: --base <worktree> --head <worktree> --out <dir> [--run <name>] [--summary <file>]');
  const base = fs.realpathSync(args.base);
  const head = fs.realpathSync(args.head);
  const registered = registeredCheckouts(head);
  for (const [label, dir] of [['base', base], ['head', head]]) if (!registered.includes(dir)) fail(`${label} ${dir} is not a registered worktree or the main checkout`);
  const out = path.resolve(args.out);
  fs.mkdirSync(out, { recursive: true });
  const run = args.run ?? 'run';

  const door = await stageDoor({ base, head, baseTarget: args['base-target'] });

  const project = fs.mkdtempSync(path.join(out, 'fresh-project-'));
  const sides = {};
  for (const [side, root] of [['base', base], ['head', head]]) {
    sides[side] = runSide({ side: side === 'head' && base === head ? 'base' : side, root, out: path.join(out, `${run}.${side}.json`), project, repoDir: head, env: door[side] });
    if (sides[side].error) fail(sides[side].error);
  }
  fs.rmSync(project, { recursive: true, force: true });

  const failures = [];
  const notes = [];
  const summary = {};
  const baseResults = sides.base.results;
  const headResults = sides.head.results;
  for (const input of Object.keys(headResults)) {
    summary[input] = {};
    if (!baseResults[input]) {
      notes.push(`input ${input} missing at base: skipped`);
      continue;
    }
    for (const question of Object.keys(headResults[input])) {
      const headQ = headResults[input][question];
      const baseQ = baseResults[input][question];
      if (!baseQ) {
        notes.push(`question ${question} missing at base (${input}): skipped`);
        continue;
      }
      const allowed = new Set();
      for (const key of new Set([...Object.keys(headQ), ...Object.keys(baseQ)])) {
        if (!(key in headQ)) {
          failures.push({ input, question, name: key, reason: 'missing at head' });
          continue;
        }
        if (!(key in baseQ)) {
          notes.push(`${question}/${key} missing at base (${input}): skipped`);
          continue;
        }
        if (canonical(headQ[key]) === canonical(baseQ[key])) continue;
        const claim = ALLOWLIST.find((entry) => entry.claims({ input, question, name: key }));
        if (claim) allowed.add(claim.delta);
        else failures.push({ input, question, name: key, reason: 'differs', base: sha(canonical(baseQ[key])), head: sha(canonical(headQ[key])) });
      }
      summary[input][question] = { base: sha(canonical(baseQ)), head: sha(canonical(headQ)), allowlisted: [...allowed].sort() };
    }
    for (const question of Object.keys(baseResults[input])) if (!(question in headResults[input])) failures.push({ input, question, reason: 'question missing at head' });
  }

  const report = { run, failures: failures.length, notes: notes.length, inputs: summary };
  const summaryFile = args.summary ?? path.join(out, `${run}.summary.json`);
  fs.writeFileSync(summaryFile, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(out, `${run}.failures.json`), `${JSON.stringify({ failures, notes }, null, 2)}\n`);
  process.stdout.write(`compare-capability-reads: ${failures.length} failure(s), ${notes.length} note(s); summary ${summaryFile}\n`);
  for (const f of failures.slice(0, 30)) process.stdout.write(`  FAIL ${f.input} ${f.question}${f.name ? `/${f.name}` : ''}: ${f.reason}\n`);
  process.exit(failures.length === 0 ? 0 : 1);
}

const args = parseArgs(process.argv.slice(2));
if (args.child) {
  childMain(args).catch((err) => {
    process.stderr.write(`${err?.stack ?? err}\n`);
    process.exit(2);
  });
} else {
  main().catch((err) => fail(err?.stack ?? String(err)));
}
