// dispatch/resolve.mjs — unit -> executor -> model/tier/command resolution
// (D7, tsk-2uf-1): `modelForTier`, the purpose/executorId resolution chain
// (`resolveExecutorIdForPurpose`/`resolveExecutorAndOverrides`), and
// `resolveExecutorConfig` (the executor-block resolve + cross-provider
// governance gate `dispatch/transport.mjs`'s `resolveExecutorCommand`
// calls). Split out of the former `src/runner/dispatch.mjs` (2204 lines, 6
// concerns in one file) — pure move, no behavior change;
// `src/runner/dispatch.mjs` re-exports every name below unchanged as a
// barrel. See `docs/history/dispatch-activation-and-handoff-redesign/
// CONTEXT.md` D7 for the split rationale.

import { RunnerConfigError, EXECUTOR_CARRIES, CLAUDE_CLI_COMMANDS, DEFAULT_TIER_TO_POLICY } from './config.mjs';

/**
 * Resolve `tier` (per D6; falls back to `work.mjs`'s declared default when a
 * work item omits `tier`, per D7b) to a model name. An unknown tier — one
 * work.mjs's `TIERS` allows but the resolved table does not cover, or any
 * other string — is a validation error: dispatch time is where that drift
 * would first bite (per D6's own original reasoning, unchanged by D9).
 *
 * tsk-5tm-5 D9: `cfg.modelPolicies` (provider-keyed, 5-tier) is preferred
 * when present — `providerModel` (default `"claude"`, every pre-D9 call
 * site) selects which provider's table to read, and `tier` maps onto one
 * of `MODEL_POLICY_TIERS` via `DEFAULT_TIER_TO_POLICY`, unless
 * `rigorOverrides` (a executor's own override map, threaded in by the
 * caller) names a different policy tier for this specific work tier.
 * Falls back to the legacy flat `cfg.models[tier]` lookup, byte-identical
 * to every pre-D9 caller, when `cfg.modelPolicies` is absent — this
 * signature's first two positional params are UNCHANGED (D9's own
 * constraint): `loop.mjs`'s `modelForTier(config, tier)` call site keeps
 * working exactly as before, options object omitted entirely.
 */
export function modelForTier(cfg, tier, { providerModel = 'claude', rigorOverrides } = {}) {
  const policies = cfg && cfg.modelPolicies;
  if (policies) {
    const providerPolicy = policies[providerModel];
    if (!providerPolicy || typeof providerPolicy !== 'object') {
      throw new RunnerConfigError(`no modelPolicies configured for provider "${providerModel}".`);
    }
    const policyTier = (rigorOverrides && rigorOverrides[tier]) || DEFAULT_TIER_TO_POLICY[tier];
    if (!policyTier || typeof providerPolicy[policyTier] !== 'string') {
      throw new RunnerConfigError(`no model configured for tier "${tier}" (policy tier "${policyTier}") under provider "${providerModel}".`);
    }
    return providerPolicy[policyTier];
  }
  const models = cfg && cfg.models;
  if (!models || typeof tier !== 'string' || !(tier in models)) {
    throw new RunnerConfigError(`no model configured for tier "${tier}".`);
  }
  return models[tier];
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
 * signal beyond the OS's own ENOENT on a missing binary). Ask `fgos tool
 * query --status present/stale` directly at the call site instead.
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
 * own args template verbatim — never a hardcoded literal copy of
 * `DEFAULT_RUNNER_CONFIG` — so a project's own `--allowedTools`/
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
 * Resolve a executorId from a declared PURPOSE (`for`, D5/D6, tsk-1o7) —
 * the purpose-based binding US-027 requires: a caller like a gather branch
 * never has a pre-registered executorId to match by name, since its
 * prompt is composed at runtime (tsk-2ie5/tsk-2c1, the first real
 * consumer). Scans `cfg.executors` for the first entry whose own `for`
 * ARRAY includes `purpose` (D15, tsk-in1-4: `for` widened from a single
 * value to `string[]` — one executor can serve multiple capabilities at
 * once); returns `null` when none is registered — a legitimate, expected
 * state (no gather-purpose executor configured yet), never thrown as an
 * error here so a caller can cleanly fall back to its own native dispatch
 * instead of treating "not configured" as malformed config.
 *
 * (tsk-in1-4 D10: re-confirmed at shaping time — namespace conflict #3
 * between `executorIdForWork`'s job-identity result and this registry's
 * own executor-name keys is resolved by reusing this exact function,
 * unchanged, never by changing how `executors` is keyed.)
 */
export function resolveExecutorIdForPurpose(cfg, purpose) {
  const executors = cfg && cfg.executors && typeof cfg.executors === 'object' ? cfg.executors : {};
  for (const [id, executor] of Object.entries(executors)) {
    if (executor && Array.isArray(executor.for) && executor.for.includes(purpose)) return id;
  }
  return null;
}

/**
 * Resolve a `executorId`-OR-purpose name to its real serving executor,
 * applying `capabilities.<name>.prefer`/`overrides` (2026-08-16 user
 * decision, `docs/decisions/0033-...md`'s sibling `docs/history/
 * capability-capacity-remodel/CONTEXT.md` D1/D2) — the ONE place every
 * `cfg.executors[executorId]` lookup in this file should go through
 * instead of tracing it out ad hoc (D4: `spawnWorker` used to have its
 * own separate inline lookup for model resolution, distinct from
 * `resolveExecutorConfig`'s own internal one — fixing only one left them
 * resolving inconsistently after a duplicate `executors.<id>` entry is
 * removed in favor of `for`/`prefer`).
 *
 * Order (D1): (1) a literal `cfg.executors[executorIdOrPurpose]` entry
 * always wins first, unchanged from every pre-this-item caller's own
 * behavior — this is the deep-customization escape-hatch (a different
 * `command`/`args` entirely), never touched by `overrides`. (2) failing
 * that, `cfg.capabilities[executorIdOrPurpose].prefer` names a real
 * registered executor directly — no requirement that the executor also
 * self-declare a matching `for` entry (D5, `docs/history/capability-
 * capacity-remodel/CONTEXT.md`, supersedes D2's own symmetry requirement:
 * the reverse check forced a second config edit per wiring decision
 * without a proportional safety benefit — a careless `prefer` edit could
 * add a careless `for` entry just as easily). `prefer` naming an executor
 * id that does not exist at all still throws loud (`RunnerConfigError`),
 * matching every other shape-validation gate in this file. (3) failing
 * that, the existing
 * `resolveExecutorIdForPurpose` scan (unchanged, still the "first `for`
 * match wins" behavior for a purpose with no `prefer` set). (4) nothing
 * found — `{executorId: null, configured: false}`, a legitimate,
 * expected state, never thrown.
 *
 * `overrides` (D2, only when resolved via step 2) is returned, never
 * applied here — each call site decides what it means for ITS OWN
 * resolution, and only 4 fields are ever eligible
 * (`rigorOverrides`/`providerModel`/`tier`/`model` — never `command`/
 * `args`/`adapter`/`invocations`, D2: a capability can retune HOW
 * strongly its executor works, never WHAT command actually runs).
 * `rigorOverrides`/`providerModel` matter to every model-computing call
 * site (`spawnWorker` and `executeExecutorCli` both). `tier`/`model`
 * (a raw, direct override — no `modelForTier` computation at all) only
 * ever mattered for `executeExecutorCli`'s own ad hoc dispatch, the
 * exact same pre-existing scope a plain `executor.tier`/`executor.model`
 * already had before this item — `spawnWorker` resolves `tier` from the
 * WORK ITEM's own classification (`work.tier`, a scope/effort judgment
 * made once at Discovery, not a per-executor opt-out) and never accepted
 * a raw literal model override at all; a capability's `overrides.tier`/
 * `.model` were never meant to reach that door, and self-review found
 * (and left) that scope boundary undisturbed rather than wiring
 * `work.tier` open to being silently overridden by dispatch config.
 */
export function resolveExecutorAndOverrides(cfg, executorIdOrPurpose) {
  const executors = cfg && cfg.executors && typeof cfg.executors === 'object' ? cfg.executors : {};
  if (executors[executorIdOrPurpose]) {
    return { executorId: executorIdOrPurpose, executor: executors[executorIdOrPurpose], overrides: undefined, configured: true };
  }
  const preferred = cfg && cfg.capabilities && typeof cfg.capabilities === 'object' ? cfg.capabilities[executorIdOrPurpose]?.prefer : undefined;
  if (preferred) {
    const executor = executors[preferred];
    if (!executor) {
      throw new RunnerConfigError(
        `runner config capabilities.${executorIdOrPurpose}.prefer names "${preferred}" but no such executor is registered.`,
      );
    }
    return { executorId: preferred, executor, overrides: cfg.capabilities[executorIdOrPurpose].overrides, configured: true };
  }
  const found = resolveExecutorIdForPurpose(cfg, executorIdOrPurpose);
  if (found) {
    return { executorId: found, executor: executors[found], overrides: undefined, configured: true };
  }
  return { executorId: null, executor: undefined, overrides: undefined, configured: false };
}

// Exported (additive, D7 module split): `dispatch/transport.mjs`'s
// `resolveExecutorCommand` calls this cross-module now that it lives in a
// sibling file — was a bare same-file `function` before the split
// (byte-identical value/behavior, only newly reachable from outside this
// file).
export function resolveExecutorConfig(cfg, tier, executorId, fgosDir, contentCarries, resolvedAgentType) {
  const resolved = executorId ? resolveExecutorAndOverrides(cfg, executorId) : undefined;
  const executorEntry = resolved?.executor;
  // Self-review finding: `executorId` below is the CALLER's own requested
  // id/purpose (e.g. "fgos-coding-implement"), never rewritten to the
  // executor `prefer` actually resolved (e.g. "agy") -- every error
  // message already citing `executorId` stays worded exactly as before
  // (zero risk to existing message-text expectations), but the
  // `allowCrossProvider` remediation line is the one place an imprecise
  // id gives actively WRONG advice ("set executors.fgos-coding-
  // implement.allowCrossProvider" -- not a real executors key at all
  // when resolved via `prefer`), so that one message names the real
  // resolved id too when it differs.
  const realExecutorId = resolved?.executorId;

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
  // Gate B3 (D9, tsk-in1-4): when `invocations` IS present but none of
  // them is `via:"cli"` (e.g. `gitnexus`'s mcp-only entry), that is a
  // executor structurally incapable of being dispatched this way — throw
  // explicitly rather than falling through to the global executor as if
  // the executor were merely metadata-only. Silently spawning the global
  // Claude executor in gitnexus's name would hide exactly the kind of
  // caller mistake this gate exists to catch ("bẫy B1" from shaping:
  // an mcp identifier misread as a spawnable command).
  const invocations = Array.isArray(executorEntry?.invocations) ? executorEntry.invocations : undefined;
  const cliInvocation = invocations?.find((inv) => inv.via === 'cli');
  if (invocations && !cliInvocation) {
    throw new RunnerConfigError(
      `executor "${executorId}" declares "invocations" but none is dispatchable via "cli" (has: ${invocations.map((inv) => inv.via).join('/')}) — resolveExecutorConfig only ever spawns a cli invocation; this executor cannot be dispatched this way.`,
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
  const byExecutor = cliInvocation
    ? { command: cliInvocation.command, args: cliInvocation.args, adapter: cliInvocation.adapter, provider: executorEntry.provider, env: cliInvocation.env ?? executorEntry.env }
    : executorEntry && (executorEntry.adapter || executorEntry.command)
      ? executorEntry
      : resolvedViaAgentType
        ? buildAgentTypeExecutor(cfg.executor, effectiveAgentType)
        : undefined;
  const executor = byExecutor ?? (cfg && cfg.executor);
  if (!executor || typeof executor.command !== 'string' || !Array.isArray(executor.args)) {
    throw new RunnerConfigError('runner config "executor" must have a string "command" and an "args" array.');
  }

  // Declared egress & Cross-provider governance (D1/D2/D6):
  // Inspect providerFamily and effective egress {kind, target, content}.
  // An env override (e.g. ANTHROPIC_BASE_URL, OPENAI_BASE_URL, BASE_URL)
  // or a non-Claude command/provider routes egress to a cross-provider backend.
  const envBlock = executor.env ?? cliInvocation?.env ?? executorEntry?.env;
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

  const providerFamily =
    typeof executorEntry?.providerModel === 'string' && executorEntry.providerModel.trim()
      ? executorEntry.providerModel
      : typeof executorEntry?.provider === 'string' && executorEntry.provider.trim()
        ? executorEntry.provider
        : CLAUDE_CLI_COMMANDS.includes(executor.command)
          ? 'claude'
          : executor.command;

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
    const remediationId = realExecutorId && realExecutorId !== executorId ? realExecutorId : executorId;
    const resolvedNote = realExecutorId && realExecutorId !== executorId ? ` (resolved via capabilities."${executorId}".prefer to executor "${realExecutorId}")` : '';
    throw new RunnerConfigError(
      `executor "${executorId}"${resolvedNote} resolves to cross-provider egress target "${egressTarget}" — prompt content would leave the Claude ecosystem. Set executors.${remediationId}.allowCrossProvider: true to permit this.`,
    );
  }

  return {
    ...executor,
    governance,
  };
}
