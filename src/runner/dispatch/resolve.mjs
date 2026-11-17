// dispatch/resolve.mjs — unit -> executor -> model/tier/command resolution
// (D7, tsk-2uf-1): the executor-id lookup (`lookupExecutor`), and
// `resolveExecutorConfig` (the executor-block resolve + cross-provider
// governance gate `dispatch/transport.mjs`'s `resolveExecutorCommand`
// calls). Split out of the former `src/runner/dispatch.mjs` (2204 lines, 6
// concerns in one file) — pure move, no behavior change;
// `src/runner/dispatch.mjs` re-exports every name below unchanged as a
// barrel. See `docs/history/dispatch-activation-and-handoff-redesign/
// CONTEXT.md` D7 for the split rationale.

import { familyOf } from './provider-adapter.mjs';
import { EXECUTOR_CARRIES, CLAUDE_CLI_COMMANDS, EXECUTOR_MISSING_MESSAGE } from './config.mjs';
import { RunnerConfigError } from './runner-config-error.mjs';
import { capabilityConfinementOf, hasCapabilityEntry, registeredCapabilityOf } from '../execution/capability-config.mjs';
import { servedCapabilitiesOf } from './tool-providers.mjs';

/**
 * Canonical capability identity for a dispatch, independent of any Work item.
 * `hints` carries what the caller knows about what the dispatch is FOR:
 * extra candidate capability names, one capability to prefer when it is a
 * candidate, and a label to fall back to when nothing else resolves. A Work-driven
 * caller derives those from its Workflow step (src/runner/work-compat.mjs).
 *
 * Single, order-independent resolution rules: an explicit purpose wins; else a
 * candidate with required confinement, then any configured confinement, then the
 * preferred one, then a registered capability, then the first sorted candidate.
 */
export function resolveCapabilityDetailsFromHints({
  cfg,
  executorId,
  resolvedExecutor,
  purpose,
  hints,
} = {}) {
  const { candidates = [], preferred = null, fallbackLabel = null } = hints ?? {};
  const resolveAlias = (name) => (!name || typeof name !== 'string' ? name : registeredCapabilityOf(cfg, name) ?? name);

  const explicitPurpose = purpose && typeof purpose === 'string' && purpose.trim()
    ? resolveAlias(purpose.trim())
    : null;

  const candidateSet = new Set(candidates);

  // A tool executor's declared capabilities (`for: [...]`). An agent executor
  // declares none: what it does is the dispatch's to say, never inferred here.
  for (const f of servedCapabilitiesOf(resolvedExecutor)) {
    if (typeof f === 'string' && f.trim()) {
      candidateSet.add(f.trim());
    }
  }

  // Executor ID itself
  if (executorId && typeof executorId === 'string') {
    candidateSet.add(executorId);
  }

  // Normalize all candidates through aliases
  const normalizedCandidates = Array.from(candidateSet)
    .map((c) => resolveAlias(c))
    .filter(Boolean);

  let capability = explicitPurpose;
  if (!capability && normalizedCandidates.length === 0) {
    capability = fallbackLabel ?? executorId ?? '(unknown-capability)';
  }

  // 1. Any candidate with required confinement (confinement.mode === 'required') wins!
  const requiredCandidates = normalizedCandidates.filter(
    (c) => capabilityConfinementOf(cfg, c)?.mode === 'required',
  );
  if (!capability && requiredCandidates.length > 0) {
    requiredCandidates.sort();
    capability = requiredCandidates[0];
  }

  // 2. Any candidate with configured confinement wins next
  const configuredConfinementCandidates = normalizedCandidates.filter(
    (c) => Boolean(capabilityConfinementOf(cfg, c)),
  );
  if (!capability && configuredConfinementCandidates.length > 0) {
    configuredConfinementCandidates.sort();
    capability = configuredConfinementCandidates[0];
  }

  // 3. The caller's preferred capability, when it is a candidate
  if (!capability && preferred && normalizedCandidates.includes(preferred)) {
    capability = preferred;
  }

  // 4. Prefer registered capabilities in cfg.capabilities
  const registeredCandidates = normalizedCandidates.filter((c) => hasCapabilityEntry(cfg, c));
  if (!capability && registeredCandidates.length > 0) {
    registeredCandidates.sort();
    capability = registeredCandidates[0];
  }

  // 5. Fallback: sorted candidates first.
  if (!capability) {
    normalizedCandidates.sort();
    capability = normalizedCandidates[0];
  }

  const policyAnchors = normalizedCandidates
    .filter((candidate) => candidate !== capability && capabilityConfinementOf(cfg, candidate));
  const requiredAnchors = policyAnchors.filter(
    (candidate) => capabilityConfinementOf(cfg, candidate)?.mode === 'required',
  ).sort();
  const anchorCapability = requiredAnchors[0] ?? policyAnchors.sort()[0] ?? null;

  return { capability, anchorCapability };
}

/**
 * Resolve which executor block applies for `tier`/`executorId` (P41/D
 * a4fe4c2b, generalized executor-aware, D4/D6 tsk-62v). Precedence (D4;
 * tsk-in1-2 D6 retired the intermediate `executors.<tier>` rung — 0 live
 * entries, had already caused a real bug per tsk-5tm D10):
 * `executors.<executorId>` (only when that entry declares its own
 * `command`/`adapter` — a executor entry naming neither is metadata-only
 * and falls through) > `executor` (global). No `executorId` given at all
 * keeps every pre-tsk-62v call site's behavior identical.
 *
 * A `executors.<executorId>` entry naming no `command`/`adapter` of its
 * own but declaring `agentType` (D1/D2, tsk-3sw) resolves via
 * `buildAgentTypeExecutor` instead of falling all the way through to
 * `executor` (global) — still ahead of that fallback in the same
 * precedence slot `command`/`adapter` already occupy.
 *
 * Presence/staleness of a `executors.<executorId>` entry's own tool is no
 * longer checked here (tsk-5tm-1 D1: retired — 2/3 real entries were
 * `kind:"task"`, for which this never ran, and the third's `needs` added no
 * signal beyond the OS's own ENOENT on a missing binary). Ask `fgos dispatch
 * decide --for <capability>` instead: it probes the tool live (`toolProvidersOf`).
 *
 * Cross-provider governance (D2/D3, tsk-32n): once the winning `executor`
 * is resolved below, a `kind: "cli"` executor whose FINAL resolved
 * `command` is not in `CLAUDE_CLI_COMMANDS` requires
 * `executor.allowCrossProvider === true` — absent or `false` throws
 * `RunnerConfigError` here, before any dispatch. Checked on the resolved
 * `command` (never on `executor.kind` alone, and never on `provider`): a
 * `kind: "cli"` executor naming no `command`/`adapter` of its own falls
 * through to `executor` (global, D4 above), ordinarily Claude's
 * own CLI — gating on declared `kind` alone would false-positive that
 * case, and `provider` is a freely-overridable display alias, not the
 * command actually spawned.
 */
/**
 * Derive a real, spawnable executor block for a `kind:"task"` executor that
 * declares only `agentType` (no own `command`/`args`) — D1/D2, tsk-3sw,
 * Claude-only for now (this item's own `CONTEXT.md`: multi-provider
 * `agentType` support is `tsk-53h`'s separate follow-on, not built here).
 * Reuses `baseExecutor`'s (the already-resolved `cfg.executor`, guaranteed
 * `{command,args}`-shaped by `validateExecutorShape` at config-load time)
 * own args template verbatim — never a hardcoded literal copy of the
 * default executor — so a project's own `--allowedTools`/
 * `--permission-mode` customization carries through to its agentType
 * executors too. Strips the `'--model','{model}'` pair (D2: the named
 * agent definition's own pinned `model:` frontmatter wins, never overridden
 * by the work item's `tier`) and appends `'--agent', agentType`.
 */
function buildAgentTypeExecutor(baseExecutor, agentType) {
  const args = [];
  for (let i = 0; i < baseExecutor.args.length; i++) {
    if (baseExecutor.args[i] === '--model' && baseExecutor.args[i + 1] === '{model}') {
      i++; // also skip the paired value token
      continue;
    }
    args.push(baseExecutor.args[i]);
  }
  args.push('--agent', agentType);
  return { command: baseExecutor.command, args };
}

/**
 * The executor registered under `executorId`: a literal `cfg.executors[executorId]` entry, else the
 * default executor (named by nothing, by `executor`, or by its own command or first invocation). It
 * looks a name up and chooses nothing; the executor a purpose runs on is Seat Binding's answer
 * (`purposeSeatOf` in `plan.mjs`). Nothing found is `{executorId: null, configured: false}`, a
 * legitimate state, never thrown.
 */
export function lookupExecutor(cfg, executorId) {
  const executors = cfg && cfg.executors && typeof cfg.executors === 'object' ? cfg.executors : {};
  if (executors[executorId]) {
    return { executorId, executor: executors[executorId], configured: true, bindingSource: 'executor-id' };
  }
  if (!executorId && cfg?.executor) {
    return { executorId: cfg.executor.command ?? 'executor', executor: cfg.executor, configured: true, bindingSource: 'default' };
  }
  if (cfg?.executor && (executorId === 'executor' || executorId === cfg.executor.command || executorId === cfg.executor.invocations?.[0]?.command || executorId === cfg.executor.invocations?.[0]?.id)) {
    return { executorId, executor: cfg.executor, configured: true, bindingSource: 'default' };
  }
  return { executorId: null, executor: undefined, configured: false, bindingSource: null };
}

// Exported (additive, D7 module split): `dispatch/transport.mjs`'s
// `resolveExecutorCommand` calls this cross-module now that it lives in a
// sibling file — was a bare same-file `function` before the split
// (byte-identical value/behavior, only newly reachable from outside this
// file).
export function resolveExecutorConfig(cfg, tier, executorId, fgosDir, contentCarries, resolvedAgentType, invocationId) {
  const executorEntry = executorId ? lookupExecutor(cfg, executorId).executor : undefined;

  // D15/tsk-5td, first real gate — carries answers "CAI GI duoc di", never
  // "CO duoc ra ngoai khong" (allowCrossProvider's own question, checked
  // separately below): when the executor declares a content-permission
  // class, the caller must self-declare what THIS dispatch actually
  // carries (`contentCarries`) — fail closed (never silently allow) when
  // the executor opts into this gate but the caller passes nothing, since
  // there is then no way to prove the dispatch is safe. `repo-content` is
  // the wider, riskier class (it covers `user-text` plus repo paths/
  // content); a executor declaring `carries: "user-text"` refuses a
  // `repo-content` dispatch before any spawn (verify item 8, tsk-2c1) —
  // a executor declaring `carries: "repo-content"` accepts either.
  if (executorEntry && executorEntry.carries !== undefined) {
    if (contentCarries === undefined) {
      throw new RunnerConfigError(
        `executor "${executorId}" declares "carries: ${executorEntry.carries}" but this dispatch did not declare what content it carries — pass an explicit content class before dispatch.`,
      );
    }
    if (!EXECUTOR_CARRIES.includes(contentCarries)) {
      throw new RunnerConfigError(
        `dispatch content class must be one of ${EXECUTOR_CARRIES.join('/')}, got: ${JSON.stringify(contentCarries)}.`,
      );
    }
    if (contentCarries === 'repo-content' && executorEntry.carries === 'user-text') {
      throw new RunnerConfigError(
        `executor "${executorId}" declares "carries: user-text" but this dispatch carries repo-content — refused before spawn (tsk-5td D15).`,
      );
    }
  }

  // tsk-5tm-4 D11: an invocations[]-shaped executor resolves through its
  // own invocation, ahead of the flat command/args check below — real
  // entries declare one shape or the other, never both, but invocations[]
  // wins on the (currently hypothetical) case they do.
  //
  // Gate B2 (D9, tsk-in1-4): select the invocation whose `via` is `"cli"`
  // specifically — never blindly `invocations[0]` — since `cli-spawn` is
  // the only mechanism this function ever actually dispatches through; a
  // executor declaring, say, `[{via:"mcp",...}, {via:"cli",...}]` must
  // still resolve the cli one regardless of array order.
  //
  // executor-id-consolidation Step 2.1: an executor can declare MULTIPLE
  // `via:"cli"` invocations (e.g. a full-write default alongside a
  // read-only/confined variant) — Gate B2's original "first cli match"
  // pick cannot distinguish between them at all. `invocationId`, when
  // passed, names exactly which one (the invocation Seat Binding picked);
  // every caller that never names one keeps the "first via:cli" pick.
  const requestedInvocationId = invocationId;
  //
  // Gate B3 (D9, tsk-in1-4): when `invocations` IS present but none of
  // them is `via:"cli"` (e.g. `gitnexus`'s mcp-only entry), that is a
  // executor structurally incapable of being dispatched this way — throw
  // explicitly rather than falling through to the global executor as if
  // the executor were merely metadata-only. Silently spawning the global
  // Claude executor in gitnexus's name would hide exactly the kind of
  // caller mistake this gate exists to catch ("bẫy B1" from shaping:
  // an mcp identifier misread as a spawnable command).
  const invocations = Array.isArray(executorEntry?.invocations) ? executorEntry.invocations : undefined;
  const cliInvocation = requestedInvocationId
    ? invocations?.find((inv) => inv.id === requestedInvocationId && inv.via === 'cli')
    : invocations?.find((inv) => inv.via === 'cli');
  if (invocations && !cliInvocation) {
    throw new RunnerConfigError(
      requestedInvocationId
        ? `executor "${executorId}" has no "invocations" entry with "id": "${requestedInvocationId}" dispatchable via "cli" (has: ${invocations.map((inv) => `${inv.id ?? '(no id)'}:${inv.via}`).join(', ')}).`
        : `executor "${executorId}" declares "invocations" but none is dispatchable via "cli" (has: ${invocations.map((inv) => inv.via).join('/')}) — resolveExecutorConfig only ever spawns a cli invocation; this executor cannot be dispatched this way.`,
    );
  }
  // D15/D20/D22 (review finding H1, tsk-397): `executorEntry.agentType`
  // (an executor's own static config) always wins first when set --
  // `resolvedAgentType` (the caller's D20 eligibility-inversion result,
  // resolveAgentTypeForTaskSpec via src/runner/agent-roster.mjs) only
  // ever fills in when the executor declares NONE of its own, so this
  // stays additive: an executor that already names a real agentType is
  // completely unaffected, and every executor with its own command/args/
  // invocations (agy, claude, codex, pi -- every real executor this repo
  // configures today) never reaches this branch at all regardless of
  // what resolvedAgentType is, since `resolvedViaAgentType` below already
  // requires a command-less, invocation-less entry.
  const effectiveAgentType = executorEntry?.agentType ?? resolvedAgentType;
  const resolvedViaAgentType = !cliInvocation && !(executorEntry && (executorEntry.adapter || executorEntry.command)) && Boolean(effectiveAgentType && cfg && cfg.executor);
  let defaultCliInvocation = null;
  if (!executorEntry && cfg?.executor?.invocations) {
    defaultCliInvocation = cfg.executor.invocations.find((inv) => inv.via === 'cli');
  }
  const byExecutor = cliInvocation
    ? { command: cliInvocation.command, args: cliInvocation.args, adapter: cliInvocation.adapter, provider: executorEntry?.provider, env: cliInvocation.env, liveOutput: cliInvocation.liveOutput, interactiveMode: cliInvocation.interactiveMode, promptDelivery: cliInvocation.promptDelivery, permissionMode: cliInvocation.permissionMode, confinement: cliInvocation.confinement, credentialStore: cliInvocation.credentialStore ?? null }
    : executorEntry && (executorEntry.adapter || executorEntry.command)
      ? executorEntry
      : defaultCliInvocation
        ? { command: defaultCliInvocation.command, args: defaultCliInvocation.args, adapter: defaultCliInvocation.adapter, provider: cfg?.executor?.provider, env: defaultCliInvocation.env ?? cfg?.executor?.env, liveOutput: defaultCliInvocation.liveOutput, interactiveMode: defaultCliInvocation.interactiveMode, promptDelivery: defaultCliInvocation.promptDelivery, permissionMode: defaultCliInvocation.permissionMode, confinement: defaultCliInvocation.confinement, credentialStore: defaultCliInvocation.credentialStore ?? null }
        : resolvedViaAgentType
          ? buildAgentTypeExecutor(cfg.executor, effectiveAgentType)
          : undefined;
  if (!byExecutor && !cfg?.executor) throw new RunnerConfigError(EXECUTOR_MISSING_MESSAGE, { code: 'runner-executor-missing' });
  const executor = byExecutor ?? cfg.executor;
  if (typeof executor.command !== 'string' || !Array.isArray(executor.args)) {
    throw new RunnerConfigError('runner config "executor" must have a string "command" and an "args" array.');
  }

  // Declared egress & Cross-provider governance (D1/D2/D6):
  // Inspect providerFamily and effective egress {kind, target, content}.
  // An env override (e.g. ANTHROPIC_BASE_URL, OPENAI_BASE_URL, BASE_URL)
  // or a non-Claude command/provider routes egress to a cross-provider backend.
  const envBlock = executor.env ?? cliInvocation?.env;
  const envTarget = envBlock?.ANTHROPIC_BASE_URL || envBlock?.OPENAI_BASE_URL || envBlock?.BASE_URL;
  // Security review finding (self-review, 2026-08-25): a substring check
  // (`envTarget.includes('api.anthropic.com')`) is bypassable by any URL
  // that merely CONTAINS that literal text anywhere — a path segment
  // (`https://evil.example.com/api.anthropic.com`), a query param, or a
  // subdomain-lookalike host all read as "same-provider" under a substring
  // test, silently clearing the cross-provider gate this check exists to
  // enforce. Real hostname comparison, fail-closed: an unparseable URL is
  // never trusted as "still Anthropic" — it counts as an override, same as
  // any other non-matching host.
  const isAnthropicApiHost = (urlString) => {
    try {
      const { hostname } = new URL(urlString);
      return hostname === 'api.anthropic.com' || hostname.endsWith('.api.anthropic.com');
    } catch {
      return false;
    }
  };
  const isEnvUrlOverride = typeof envTarget === 'string' && envTarget.trim().length > 0 && !isAnthropicApiHost(envTarget);

  const providerFamily = familyOf(executorEntry, executor.command);

  const egressTarget = isEnvUrlOverride ? envTarget : executor.command;

  const isCrossProvider =
    isEnvUrlOverride ||
    !CLAUDE_CLI_COMMANDS.includes(executor.command) ||
    (executorEntry?.providerModel !== undefined && executorEntry.providerModel !== 'claude');

  const egressKind = isCrossProvider ? 'cross-provider' : 'same-provider';
  const egressContent = executorEntry?.carries ?? contentCarries ?? 'repo-content';

  const governance = {
    providerFamily,
    egress: {
      kind: egressKind,
      target: egressTarget,
      content: egressContent,
    },
  };

  if (executorEntry && !resolvedViaAgentType && egressKind === 'cross-provider' && executorEntry.allowCrossProvider !== true) {
    throw new RunnerConfigError(
      `executor "${executorId}" resolves to cross-provider egress target "${egressTarget}" — prompt content would leave the Claude ecosystem. Set executors.${executorId}.allowCrossProvider: true to permit this.`,
      { code: 'governance.cross-provider-not-permitted' },
    );
  }

  return {
    ...executor,
    // The executor's declared capabilities (e.g. which reasoningEffort levels
    // it accepts) live on the entry, not on the invocation picked above.
    ...(executorEntry?.supports && !executor.supports ? { supports: executorEntry.supports } : {}),
    governance,
  };
}
