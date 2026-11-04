// dispatch/transport.mjs — executor adapters, command resolution, attestation (D7,
// tsk-2uf-1).
//
// WHERE THE AGENT RUNS: not here. `EXECUTOR_ADAPTERS` is registered at the
// bottom of this file, but both adapters only name what a seat is; the agent
// itself runs as an attempt of the run supervisor (`executeAssignment`,
// `src/run-supervisor/`), and the interactive round -- pane, agent, brief,
// receipt, exit -- is `herdr-round.mjs`.
//
// What IS here: the worktree-dispatch attestation
// (`captureDispatchAttestation`), `resolveExecutorCommand` (the
// prompt/model → argv substitution + cross-provider gate) and the executor
// adapter port (`EXECUTOR_ADAPTERS`). Split out of the former
// `src/runner/dispatch.mjs` (2204 lines, 6 concerns in one file) —
// pure move, no behavior change; `src/runner/dispatch.mjs` re-exports every
// name below unchanged as a barrel. See `docs/history/dispatch-activation-
// and-handoff-redesign/CONTEXT.md` D7 for the split rationale.
//
// SECURITY (security panel): the executor command is always an argv array,
// never a shell string — the prompt and model are substituted
// per-array-element into `executor.args`, so arbitrary shell metachars inside
// a work item's title/refs/verify text stay inert (they reach the child
// process as literal argv, never interpreted by a shell).

import path from 'node:path';
import fs from 'node:fs';
import { createGitInspect, gitPortOptions } from '../../git/inspect.mjs';
import { inspectEntries, inspectPath } from '../../util/git-paths.mjs';
import { RunnerConfigError, assertReasoningEffort } from './config.mjs';
import { resolveExecutorConfig } from './resolve.mjs';
import { credentialStoreOf } from './provider-capacity.mjs';
import { renderReasoningEffortArgs, checkLaunchedModel } from './provider-adapter.mjs';
import { resolveHerdrBin } from './terminal-slot.mjs';
import { DispatchError } from './dispatch-error.mjs';

import {
  DEFAULT_ADAPTER,
  EXECUTOR_ADAPTER_NAMES,
  ADAPTER_REGISTRY,
  EXECUTOR_ADAPTERS,
  registerExecutorAdapter,
  getAdapterMetadata,
  DISPATCH_DEPTH_ENV,
  MAX_DISPATCH_DEPTH,
  currentDispatchDepth,
  resolveExecutorEnv,
} from './adapters.mjs';

// Raised by every adapter here and by `herdr-round.mjs`; owned by neither, so
// the two never have to import each other. Re-exported so callers that have
// always taken it from this module keep working.
export {
  DispatchError,
  DEFAULT_ADAPTER,
  EXECUTOR_ADAPTER_NAMES,
  ADAPTER_REGISTRY,
  EXECUTOR_ADAPTERS,
  registerExecutorAdapter,
  getAdapterMetadata,
  DISPATCH_DEPTH_ENV,
  MAX_DISPATCH_DEPTH,
  currentDispatchDepth,
  resolveExecutorEnv,
};

export { resolveHerdrBin };

/**
 * Substitute `{prompt}` and `{model}` into the resolved executor's `args` —
 * PER ARRAY ELEMENT (never joined into one shell string, per the security
 * panel). `executorId`/`fgosDir`, when given, select a executor override
 * ahead of the global `cfg.executor` (D4/D6, tsk-62v; the intermediate
 * per-tier `executors.<tier>` override this comment used to describe was
 * retired at tsk-in1-2 D6 — 0 live entries); every field omitted keeps
 * every pre-tsk-62v caller's behavior identical. Returns
 * `{ command, args, adapter, provider }` — `adapter` names the C9 v2
 * executor interface's adapter (`EXECUTOR_ADAPTERS` key) this command
 * should run through, defaulting to `DEFAULT_ADAPTER` when the executor
 * block does not declare one; `provider` (D7, tsk-62v, additive) is the
 * executor block's own `provider` display alias when present, else
 * `command` itself.
 */
/**
 * Worktree-dispatch attestation (tsk-2ig, D1/D3 of docs/history/parallel-
 * decomposition-footprint-avoidance/CONTEXT.md — mức 1, advisory-only):
 * chụp `baseCommit`/`headRef` NGAY TRƯỚC khi dispatch — captured by the
 * launcher itself, never trusted from whatever the dispatched executor
 * later reports.
 *
 * `attestRoot`, when given, is read instead of `fgosDir`'s own root
 * (tsk-4hl fix, independent review after tsk-2ig merged): a worker
 * dispatched via `spawnWorker` runs inside its OWN dispatch worktree
 * (`fgw/<id>`, `loop.mjs`'s `wt.path`), a DIFFERENT checkout than
 * `fgosDir`'s root (always the main checkout, ADR0020 — worktrees never
 * carry their own `.fgos/`). Reading `fgosDir`'s root unconditionally used
 * to attest the main checkout's HEAD regardless of which branch the
 * worker actually dispatched on — correct only for a first-attempt ROOT
 * item (whose dispatch branch happens to fork from main's then-current
 * tip), wrong for a leaf (forks from `fgw/<rootId>`, not main) or a retry
 * (the branch already carries the prior attempt's own commits).
 * `spawnWorker` passes its own worktree `cwd` as `attestRoot`;
 * a caller with no worktree of its own (genuinely running against
 * `fgosDir`'s own root) omits it, unchanged.
 *
 * Fail-safe either way: a git read that cannot resolve (detached checkout
 * weirdness, no `.git`, etc.) never throws and never blocks dispatch —
 * this is advisory metadata, not a precondition (same "advisory, không tự
 * fail" stance `frozen-judge.mjs` already states for its own checks).
 * Returns `{baseCommit, headRef}`, either field `null` when it could not
 * be read.
 */
export function captureDispatchAttestation(fgosDir, attestRoot) {
  const repoRoot = attestRoot ?? (fgosDir ? path.dirname(fgosDir) : null);
  if (!repoRoot) return { baseCommit: null, headRef: null };
  const read = (fn) => {
    try {
      return fn();
    } catch {
      return null;
    }
  };
  const inspect = read(() => createGitInspect(gitPortOptions(repoRoot)));
  if (!inspect) return { baseCommit: null, headRef: null };
  const head = read(() => inspect.resolveCommit({ name: 'HEAD' }));
  return {
    baseCommit: typeof head === 'string' ? head : null,
    headRef: read(() => checkedOutBranch(inspect)), // null on detached HEAD, never a throw
  };
}

// The short name of the branch the inspected checkout has checked out, from
// its own row of the worktree list; null when that checkout is detached.
function checkedOutBranch(inspect) {
  const { worktreeRoot } = inspect.resolveRepo();
  if (!worktreeRoot) return null;
  const own = fs.realpathSync(worktreeRoot);
  const row = inspectEntries((page) => inspect.listWorktrees(page)).find((entry) => {
    try { return fs.realpathSync(inspectPath(entry.path)) === own; } catch { return false; }
  });
  return row?.branch?.startsWith('refs/heads/') ? row.branch.slice('refs/heads/'.length) : null;
}

export function resolveExecutorCommand(cfg, { prompt, model, tier, executorId, fgosDir, attestRoot, contentCarries, resolvedAgentType, invocationId, reasoningEffort, requestedModel } = {}) {
  // Captured BEFORE resolveExecutorConfig, not after (D3) — cheap and
  // unconditional so the same call site works regardless of whether the
  // resolved executor turns out to be same-provider or cross-provider;
  // resolveExecutorConfig below is still the sole authority on which
  // executor actually gets used.
  const attestation = captureDispatchAttestation(fgosDir, attestRoot);
  // `invocationId` (executor-id-consolidation Step 2.1): optional, names a
  // specific `invocations[]` entry by its own `id` — omitted by every
  // pre-existing caller, so resolveExecutorConfig's own Gate B2 default
  // ("first via:cli") is unchanged unless a caller opts in.
  const executor = resolveExecutorConfig(cfg, tier, executorId, fgosDir, contentCarries, resolvedAgentType, invocationId);
  const adapter = executor.adapter ?? DEFAULT_ADAPTER;
  if (!(adapter in EXECUTOR_ADAPTERS)) {
    throw new RunnerConfigError(
      `runner config declares unknown executor adapter "${adapter}" (known: ${Object.keys(EXECUTOR_ADAPTERS).join(', ')}).`,
    );
  }
  // A requested reasoning-effort level, for every door that builds argv here:
  // validated once (canonical vocabulary, then the executor's own declared
  // levels) and rendered into the template, so an adapter that rebuilds argv
  // from the template carries it too.
  let argsTemplate = executor.args;
  let effortApplied;
  if (reasoningEffort !== undefined) {
    assertReasoningEffort(reasoningEffort, { supported: executor.supports?.reasoningEffort, executorId });
    const rendered = renderReasoningEffortArgs({ command: executor.command, args: executor.args, effort: reasoningEffort });
    if (!rendered) {
      throw new RunnerConfigError(
        `executor "${executorId}" runs "${path.basename(String(executor.command))}", which has no reasoning-effort control fgOS can set -- drop --effort or pick an invocation whose CLI takes one (claude, codex, agy, pi, omp).`,
      );
    }
    argsTemplate = rendered.args;
    effortApplied = { requested: reasoningEffort, ...rendered.control };
  }
  const legacyArgs = argsTemplate.map((arg) => {
    if (typeof arg !== 'string') {
      throw new RunnerConfigError('runner config "executor.args" entries must all be strings.');
    }
    return arg.split('{prompt}').join(prompt).split('{model}').join(model);
  });
  const args = legacyArgs;
  const MAX_ARG_STRLEN = 131072;
  for (let i = 0; i < args.length; i++) {
    if (typeof args[i] === 'string' && Buffer.byteLength(args[i]) > MAX_ARG_STRLEN) {
      process.stderr.write(
        `fgos: warning: executor argument at index ${i} exceeds Linux MAX_ARG_STRLEN 128 KiB (${Buffer.byteLength(args[i])} bytes); spawn may fail with E2BIG. Consider delivery via file-pointer.\n`,
      );
    }
  }
  return {
    command: executor.command,
    args,
    // The args BEFORE substitution. An adapter that must NOT put the prompt on
    // a command line (herdr-spawn: the prompt goes to a file, one pointer goes
    // through the terminal) needs to know exactly which entries carried it,
    // and the `{prompt}` placeholder says so precisely where string-matching
    // the substituted result only guesses. Additive: every existing caller
    // destructures a subset of this object and is unaffected.
    argsTemplate,
    env: executor.env,
    liveOutput: executor.liveOutput,
    interactiveMode: executor.interactiveMode,
    adapter,
    // An explicit `executor.provider` display alias (e.g. "gemini") still
    // wins first — that is a deliberate, separately-tested concept distinct
    // from the model-routing family (an executor can alias to "gemini" while
    // its `providerModel`/family is "gemini"). The fallback, though, used
    // to be the raw `executor.command` — ignoring `providerModel` entirely
    // and showing e.g. "claude" for glm (routed to z-ai via env
    // override) or the raw non-Claude command for any executor with no
    // alias of its own. `executor.governance.providerFamily` is
    // resolve.mjs's own deriveProviderFamily(executorEntry,
    // executor.command) result, already computed correctly a few lines
    // above in resolveExecutorConfig — the correct fallback.
    // How the prompt reaches an interactive worker: `file-pointer` (default)
    // writes it to disk and types a pointer, `inline` types it whole.
    promptDelivery: executor.promptDelivery,
    // The declared execution posture. An adapter that can confine a worker
    // needs to know what it was told to do, and the config door has already
    // refused any bypass that did not declare full confinement.
    permissionMode: executor.permissionMode,
    confinement: executor.confinement,
    provider: executor.provider ?? executor.governance.providerFamily,
    baseCommit: attestation.baseCommit,
    headRef: attestation.headRef,
    // governance (self-review finding, 2026-08-25): resolveExecutorConfig
    // already computes this (providerFamily + egress{kind,target,content})
    // -- it was being discarded here, so the real production dispatch path
    // (spawnWorker -> loop.mjs's `executor.dispatch` event) never recorded
    // which dispatches were cross-provider, the entire stated purpose of
    // the D1/D2/D6 governance work. Additive only: every existing caller
    // that destructures a subset of this object is unaffected.
    governance: executor.governance,
    method: executor.method,
    url: executor.url,
    headers: executor.headers,
    body: executor.body,
    // The login store this launch reads, declared or inferred from an older config; null when it reads none.
    credentialStore: credentialStoreOf(executor),
    // What the effort flag rendered to, when one was requested.
    ...(effortApplied ? { reasoningEffort: effortApplied } : {}),
    // The pre-spawn half of the model check; collectModelWarnings adds what
    // the CLI's own output says once the run ends.
    modelCheck: checkLaunchedModel({ requested: requestedModel, launched: model, args }),
  };
}

/**
 * The agent's own argv, with the prompt taken out of it.
 *
 * `argsTemplate` is the executor's args BEFORE substitution, so an entry that
 * carried the prompt is identifiable exactly -- by the `{prompt}` placeholder
 * itself, not by string-matching the substituted result. The fallback for a
 * caller that passes no template compares against the prompt text, which is
 * long and unique enough to be reliable but is a fallback, not the contract.
 */
export function agentArgsWithoutPrompt({ argsTemplate, args, prompt, model }) {
  if (Array.isArray(argsTemplate)) {
    return argsTemplate
      .filter((arg) => typeof arg === 'string' && !arg.includes('{prompt}'))
      .map((arg) => arg.split('{model}').join(model ?? ''));
  }
  const effective = Array.isArray(args) ? args : [];
  if (!prompt) return effective;
  return effective.filter((arg) => !String(arg).includes(prompt));
}

/**
 * Both executor adapters are registered so the executor config, the planner and the confinement
 * authority know what a seat is (a local process or a pane a person can watch, a prepared exact
 * invocation, a receipt), but neither is run through `execute`: every agent runs as an attempt of the
 * run supervisor (`executeAssignment`, which prepares the brief, the sandbox and, for a pane, the
 * folder-trust entry and hands the attempt over; docs/platform/run-supervisor/spec.md). A caller that
 * reaches an adapter directly has no attempt to hand over and is refused by name.
 */
function registerSupervisedOnlyAdapter(adapterName, meta) {
  const adapter = (invocation, opts) => Promise.reject(new DispatchError(
    `${adapterName}-supervised-only`,
    `executor for work "${opts?.workId}" refused: ${adapterName} runs as an attempt of the run supervisor, started by executeAssignment (fgos run); it cannot be executed directly.`,
    { workId: opts?.workId, tier: opts?.tier, model: opts?.model },
  ));
  Object.assign(adapter, { execute: adapter, ...meta });
  registerExecutorAdapter(adapterName, adapter, meta);
}

registerSupervisedOnlyAdapter(DEFAULT_ADAPTER, {
  locus: 'local-process',
  preparedInvocationContract: 'exact-v1',
  receiptContract: 'confinement-adapter-receipt.v1',
});

registerSupervisedOnlyAdapter('herdr-spawn', {
  locus: 'herdr-pane',
  preparedInvocationContract: 'exact-v1',
  receiptContract: 'herdr-adapter-receipt.v1',
});
