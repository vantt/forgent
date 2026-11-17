// Runs one vector of packages/execution/contracts/executor-model.v1.json against the Node functions that derive
// the executor facts. The same file serves whoever records the vectors and the one test that replays them, so the
// two can never read a vector differently. A vector is `{ name, fact, entry?, runner?, machine?, args?, expect }`;
// `machine` describes the machine facts a derivation reads (what is on PATH, the confinement backend registry, the
// home directory, lease state, files and a git repository), so a vector never depends on the machine running it.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureScriptAddon } from '../../scripts/lib/git-ports.mjs';
import { withDefaultExecutor, validateRunnerConfigShape } from '../../src/runner/dispatch/config.mjs';
import { familyOf, renderedEffortLevels } from '../../src/runner/dispatch/provider-adapter.mjs';
import { lookupExecutor } from '../../src/runner/dispatch/resolve.mjs';
import { resolveExecutorGovernance, resolveExecutorProvider } from '../../src/runner/dispatch/executor-governance.mjs';
import { capabilityConfinementOf } from '../../src/runner/execution/capability-config.mjs';
import { credentialStoreOf, providerAccountInventory } from '../../src/runner/dispatch/provider-capacity.mjs';
import { legacyStateKey, readLlmAccounts } from '../../src/runner/dispatch/llm-accounts.mjs';
import { decideExecutorDispatchMechanism } from '../../src/runner/dispatch/mechanism.mjs';
import { resolvePostureInvocation } from '../../src/runner/dispatch/confinement/policies.mjs';
import { toolProvidersOf } from '../../src/runner/dispatch/tool-providers.mjs';
import { accountQuarantineOf, agentCliMissingRefusal, explainSeat } from '../../src/runner/execution/bind.mjs';

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
function withMachine(machine = {}, fn) {
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

/** Every derived fact a vector may name. */
export const VECTOR_FACTS = Object.freeze(Object.keys(evaluators));

/** The answer the Node functions give for one vector (never throws; a refusal is part of the answer). */
export function evaluateVector(vector) {
  const evaluate = evaluators[vector.fact];
  if (!evaluate) throw new Error(`vector "${vector.name}" names the unknown fact "${vector.fact}"`);
  return answerOf(() => withMachine(vector.machine, (paths) => evaluate({ args: {}, ...vector }, paths)));
}
