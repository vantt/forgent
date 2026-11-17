// Runs one vector of packages/execution/contracts/executor-model.v1.json or bind.v1.json against the Node functions
// that derive the executor facts and bind a seat. The same file serves whoever records the vectors and the test that
// replays them, so the two can never read a vector differently. A vector is
// `{ name, fact, entry?, runner?, machine?, args?, leaseRead?, decided?, expect }`; `machine` describes the machine facts a derivation reads (what is on PATH, the confinement backend registry, the
// home directory, lease state, files and a git repository), so a vector never depends on the machine running it.

import fs from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureScriptAddon } from '../../scripts/lib/git-ports.mjs';
import { withDefaultExecutor, validateRunnerConfigShape } from '../../src/runner/dispatch/config.mjs';
import { familyOf, renderedEffortLevels } from '../../src/runner/dispatch/provider-adapter.mjs';
import { lookupExecutor } from '../../src/runner/dispatch/resolve.mjs';
import { resolveExecutorGovernance, resolveExecutorProvider } from '../../src/runner/dispatch/executor-governance.mjs';
import { capabilityConfinementOf } from '../../src/runner/execution/capability-config.mjs';
import { credentialStoreOf, providerAccountInventory, readAccountStateOverlay } from '../../src/runner/dispatch/provider-capacity.mjs';
import { legacyStateKey, readLlmAccounts } from '../../src/runner/dispatch/llm-accounts.mjs';
import { decideExecutorDispatchMechanism } from '../../src/runner/dispatch/mechanism.mjs';
import { resolvePostureInvocation } from '../../src/runner/dispatch/confinement/policies.mjs';
import { toolProvidersOf } from '../../src/runner/dispatch/tool-providers.mjs';
import { accountQuarantineOf, agentCliMissingRefusal, bind, explainSeat } from '../../src/runner/execution/bind.mjs';
import { explainCapability } from '../../src/runner/execution/explain.mjs';
import { seatConfigDigestOf } from '../../src/runner/execution/seat-policy.mjs';
import { effectiveRigorOf } from '../../src/runner/execution/seat-resolver.mjs';

const REGISTRY_ENV = 'FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH';

/** The answer of a call as plain JSON; a throw is an answer too, named by its error class and code. */
function answerOf(call) {
  try {
    return JSON.parse(JSON.stringify(call() ?? null));
  } catch (err) {
    return { error: { name: err.name, ...(err.code === undefined ? {} : { code: err.code }), message: err.message } };
  }
}

/**
 * Builds the machine a vector describes under a temporary directory and runs `fn` with it:
 * `pathCommands` (the only programs on PATH), `registry` (absent when null or missing, a document, or raw text),
 * `home` (when a fact expands it; left alone otherwise, the Git port needs the real one), `accountState` (the lease state file), `files` (relative path -> text) and `git` (a repository with one commit).
 */
export function withMachine(machine = {}, fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'executor-model-vector-'));
  const saved = { PATH: process.env.PATH, HOME: process.env.HOME, [REGISTRY_ENV]: process.env[REGISTRY_ENV] };
  try {
    const binDir = path.join(root, 'bin');
    fs.mkdirSync(binDir);
    for (const command of machine.pathCommands ?? []) fs.writeFileSync(path.join(binDir, command), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
    const registryPath = path.join(root, 'confinement-backends.json');
    if (machine.registry !== undefined && machine.registry !== null) {
      fs.writeFileSync(registryPath, typeof machine.registry === 'string' ? machine.registry : JSON.stringify(machine.registry));
    }
    const runtimeDir = path.join(root, 'runtime');
    fs.mkdirSync(runtimeDir);
    if (machine.accountState) fs.writeFileSync(path.join(runtimeDir, 'state.json'), JSON.stringify(machine.accountState));
    const repoRoot = path.join(root, 'repo');
    fs.mkdirSync(repoRoot);
    for (const [relative, text] of Object.entries(machine.files ?? {})) {
      fs.mkdirSync(path.dirname(path.join(repoRoot, relative)), { recursive: true });
      fs.writeFileSync(path.join(repoRoot, relative), text);
    }
    if (machine.git) {
      const git = (...args) => execFileSync('git', ['-C', repoRoot, '-c', 'user.name=vector', '-c', 'user.email=vector@example.invalid', ...args], { stdio: 'ignore' });
      git('init', '-q');
      git('commit', '-q', '--allow-empty', '-m', 'vector');
      // The Git port runs the machine's git, so the one program a repository vector needs on PATH is the real one.
      fs.symlinkSync(execFileSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).trim(), path.join(binDir, 'git'));
    }
    process.env.PATH = binDir;
    if (machine.home !== undefined) process.env.HOME = machine.home;
    process.env[REGISTRY_ENV] = registryPath;
    return fn({ binDir, registryPath, runtimeDir, repoRoot });
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    fs.rmSync(root, { recursive: true, force: true });
  }
}

/** The facts the launch view carries for each executor, read through the one door that builds it. */
function launchFactsOf(runner, session) {
  ensureScriptAddon();
  const unit = { id: 'executor-model-vector', capability: 'execute', writes: [] };
  const { launchView } = explainSeat({ unit, role: 'producer' }, { runnerConfig: runner, session: { headless: true, ...session } }, { chain: false });
  if (!launchView) throw new Error('the seat was refused before a launch view was built');
  return launchView.executors;
}

const evaluators = {
  defaultExecutor: ({ runner }) => withDefaultExecutor(runner),
  family: ({ entry, args }) => familyOf(entry ?? args.source ?? null, args.command),
  executorLookup: ({ runner, args }) => lookupExecutor(runner, args.executorId),
  governance: ({ runner, args }) => {
    const { resolvedProvider } = resolveExecutorProvider({ runnerConfig: runner, primaryExecutor: args.primaryExecutor, options: args.options });
    const { canonicalProvider } = resolveExecutorGovernance({ primaryExecutor: args.primaryExecutor, providerModel: resolvedProvider, options: args.options });
    return { resolvedProvider, canonicalProvider };
  },
  capabilityConfinement: ({ runner, args }) => capabilityConfinementOf(runner, args.capability),
  credentialStore: ({ args }) => credentialStoreOf(args.invocation),
  effortLevels: ({ args }) => renderedEffortLevels(args.command),
  mechanism: ({ runner, args }) => decideExecutorDispatchMechanism(runner, args.executorId, { hasLiveTaskAccess: args.hasLiveTaskAccess === true }),
  posture: ({ runner, args }, paths) => resolvePostureInvocation(args.candidate, 'read-only', { runnerConfig: runner, herdrPresent: args.herdrPresent === true, registryPath: paths.registryPath, envPath: paths.binDir }),
  launchFacts: ({ runner, args }) => launchFactsOf(runner, args.session ?? {}),
  missingCli: ({ runner, args }, paths) => agentCliMissingRefusal(runner, { hasNativeAgent: args.hasNativeAgent === true, pathEnv: paths.binDir }),
  accountQuarantine: ({ runner, args }, paths) => accountQuarantineOf(runner, args.account, { runtimeDir: paths.runtimeDir, now: args.now }),
  accountInventory: ({ runner }) => providerAccountInventory(runner),
  llmAccounts: ({ runner }) => readLlmAccounts(runner),
  stateKey: ({ args }) => legacyStateKey(args.pool),
  toolProviders: ({ runner, args }, paths) => {
    ensureScriptAddon(); // the staleness probe reads HEAD through the Git port
    return toolProvidersOf(runner, { capability: args.capability, repoRoot: paths.repoRoot, pathEnv: paths.binDir });
  },
  validate: ({ runner }) => { validateRunnerConfigShape(runner, 'vector runner'); return { ok: true }; },
};

/**
 * Runs `fn` with the clock reading `now`: Node's bind reads `Date.now()` where the Rust bind takes `now` as an input,
 * so a vector states the time it is bound at.
 */
function at(now, fn) {
  if (now === undefined) return fn();
  const real = Date.now;
  Date.now = () => now;
  try {
    return fn();
  } finally {
    Date.now = real;
  }
}

/** A binding as `bind` answers it: the host version is the route's, not the bind's, so it is not part of the answer. */
function bindingAnswer(binding) {
  if (binding?.bindingInput) delete binding.bindingInput.hostVersion;
  return binding;
}

/** The bind's session over the vector machine: its PATH is the machine's. */
const sessionOf = (args, paths) => ({ ...(args.session ?? {}), pathEnv: paths.binDir });

/** Lease state the bind reads (`args.accounts` names the assignment), as `bind` takes it. */
const accountsOf = (args, paths) => (args.accounts ? { runtimeDir: paths.runtimeDir, ...(args.accounts.assignmentId ? { assignmentId: args.accounts.assignmentId } : {}) } : undefined);

/** The answers of packages/execution/contracts/bind.v1.json: the bind, the explain answer, the pre-admission facts, the config slice and its digest, effective rigor. */
const bindEvaluators = {
  bind: ({ runner, args }, paths) => at(args.now, () => bindingAnswer(bind(args.ask, { runnerConfig: runner, session: sessionOf(args, paths), accounts: accountsOf(args, paths) }, { walk: args.walk ?? {} }))),
  explain: ({ runner, args }, paths) => at(args.now, () => explainCapability(runner, { capability: args.capability, rigor: args.rigor, session: sessionOf(args, paths) })),
  preflight: ({ runner, args }, paths) => at(args.now, () => {
    const missing = agentCliMissingRefusal(runner, sessionOf(args, paths));
    const until = args.pin ? accountQuarantineOf(runner, args.pin, { runtimeDir: paths.runtimeDir, now: args.now }) : null;
    return { ...(missing ? { agentCliMissing: missing } : {}), ...(until !== null ? { pinQuarantinedUntil: until } : {}) };
  }),
  seatConfig: ({ runner }) => seatConfigDigestOf(runner),
  effectiveRigor: ({ runner, args }) => effectiveRigorOf(args.unit, runner, { fallback: 'standard' }) ?? null,
};

/** Every derived fact a vector of executor-model.v1.json may name. */
export const VECTOR_FACTS = Object.freeze(Object.keys(evaluators));

/** Every answer a vector of bind.v1.json may name. */
export const BIND_FACTS = Object.freeze(Object.keys(bindEvaluators));

const evaluatorOf = (vector) => {
  const evaluate = evaluators[vector.fact] ?? bindEvaluators[vector.fact];
  if (!evaluate) throw new Error(`vector "${vector.name}" names the unknown fact "${vector.fact}"`);
  return evaluate;
};

/** The answer the Node functions give for one vector (never throws; a refusal is part of the answer). */
export function evaluateVector(vector) {
  const evaluate = evaluatorOf(vector);
  return answerOf(() => withMachine(vector.machine, (paths) => evaluate({ args: {}, ...vector }, paths)));
}

/**
 * The one reason a vector may be marked `decided`: the explicit invocation rule the owner chose on 2026-11-17, after
 * the Node bind was written (generic forms as D-ADR0077 (invocation names state their confinement) names them). A mark
 * with any other text is refused, so the mark cannot become a general way to silence a vector.
 */
export const DECIDED_RULE = "invocation choice is an explicit rule (owner, 2026-11-17): a generic form <cli>-<cli|herdr>[-bwrap] before a named one, the session's transport first (herdr inside herdr), then declared order; a pin is kept";

/**
 * Why a `decided` vector is not a valid statement of the decided rule, or null when it is: its mark must be the
 * decided rule, its `expect` must be written, and Node must still answer differently (when Node answers the rule, the
 * mark is removed and the vector re-recorded). `got` is Node's answer.
 */
export function decidedProblem(vector, got) {
  if (vector.decided !== DECIDED_RULE) return `${vector.name}: a vector may be marked decided only for the explicit invocation rule`;
  if (vector.expect === null || vector.expect === undefined) return `${vector.name}: a decided vector states its expect by hand; it is null`;
  if (isDeepStrictEqual(got, vector.expect)) return `${vector.name}: Node now answers the decided rule; remove the decided mark and re-record`;
  return null;
}

/** The facts that read lease state through Dispatch's adapter. */
const LEASE_READERS = new Set(['accountQuarantine', 'bind', 'preflight']);

/**
 * What Dispatch's adapter (`readAccountStateOverlay`) reads from the vector's lease state, the account state a binder
 * that takes it as an input is handed; undefined when the vector's fact reads no lease state or it has none.
 */
export function leaseReadOf(vector) {
  const args = vector.args ?? {};
  if (!LEASE_READERS.has(vector.fact) || !vector.machine?.accountState) return undefined;
  if (vector.fact === 'bind' && !args.accounts) return undefined;
  return withMachine(vector.machine, (paths) => readAccountStateOverlay({
    runtimeDir: paths.runtimeDir,
    ...(args.accounts?.assignmentId ? { assignmentId: args.accounts.assignmentId } : {}),
    now: args.now ?? Date.now(),
  }));
}
