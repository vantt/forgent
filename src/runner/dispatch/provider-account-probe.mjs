// One provider account, every CLI configured for it, started at the same moment through the door a real
// read-only dispatch uses (executeAssignment with a read-only posture binding: confinement, private home,
// leased login copied in, herdr pane for a herdr-spawn invocation), with a trivial read-only prompt. The
// point is to tell an ACCOUNT fault (dead login, quota: every CLI fails the same way) from a HARNESS fault
// (the login answers when called directly, but a CLI stops at a trust prompt, a sandbox refusal, a version
// bug inside fgOS's own confinement). A direct leg runs first: one cheap call per login store with the
// account's own login, no sandbox and no pane, under the account lock. Diagnostic only: it picks nothing and
// schedules nothing; `record` hands what the direct leg found to the capacity layer's one probe door.
//
// It reuses what exists instead of adding a second engine: the Assignment door itself (the same object a
// Workflow unit dispatch hands it), the stop cause and provider signal the settled run carries (the agent
// protocol judged the CLI's last words, this reads no wording of its own for a login or a quota), the herdr
// diagnosis a blocked round already writes, and the RUL75 renewal opt-in. The account is pinned by handing
// the door a runner config whose inventory holds only that account, so the lease cannot pick another one
// and a quarantine still refuses it, as it would for real.

import fs from 'node:fs';
import path from 'node:path';

import { legacyStateKey } from './llm-accounts.mjs';
import {
  acquireAccountLock, accountCredentialSources, commandCli, describeProviderSignal, expandCredentialHome, credentialSourceForCli, credentialStoreOf,
  providerAccountInventory, recordAccountProbe,
} from './provider-capacity.mjs';
import { createCredentialProbe, credentialProbeCommand } from './provider-credential-probe.mjs';
import { LEASE_CONFLICT_FAILURE_CODE, runOutcome } from './run-result.mjs';
import { MODEL_POLICY_TIERS } from './config.mjs';
import { parseTierCell } from './tier-cell.mjs';

export const ACCOUNT_PROBE_PROMPT = 'Account probe: there is no task. Reply with the single word OK.';
export const ACCOUNT_PROBE_LEGS = ['direct', 'harness', 'both'];
export const DEFAULT_ACCOUNT_PROBE_TIMEOUT_MS = 3 * 60 * 1000;

const TRUST_PATTERN = /trust this folder|do you trust|trust the files/i;
const SANDBOX_PATTERN = /read-only file system|\bEROFS\b|bwrap:|operation not permitted|confinement (?:was declared|refused)|confinement-/i;
const TIMEOUT_PATTERN = /time[sd]?[-_ ]?out/i;

/** Which CLI an invocation runs, by the basename of its command. */
function cliOf(invocation) {
  return commandCli(invocation?.command) ?? '';
}

/** The CLI a credential layout logs in, the same layouts the unlock probe names. */
function cliForCredential(source) {
  if (source?.kind === 'codex-home') return 'codex';
  const files = Array.isArray(source?.files) ? source.files : [];
  if (source?.kind === 'home-files' && files.includes('agent.db')) return 'omp';
  if (source?.kind === 'home-files' && files.includes('auth.json')) return 'pi';
  return null;
}

const CREDENTIAL_ENV = ['CODEX_HOME', 'PI_CODING_AGENT_DIR', 'HOME'];

/**
 * The invocations of `provider`'s executors that run as `accountId`, each with how the account reaches it:
 * - `lease`: a confined invocation that reads a login store the account has (its per-CLI store of that key,
 *   or the one store whose layout that CLI logs in); the capacity layer copies that store into the home,
 *   exactly as a real dispatch does;
 * - `env`: the invocation's own credential env names one of the account's store homes;
 * - `name`: the invocation id ends with `-<accountId>` (config convention `<bin>-<mode>-<account>`),
 *   for a CLI that keeps its own login of the same account in its own directory.
 * Only `via: "cli"` invocations; `executorId` narrows to one executor.
 */
export function accountInvocations(cfg, { provider, accountId, executorId = null } = {}) {
  const family = legacyStateKey(provider);
  const account = providerAccountInventory(cfg)?.[family]?.accounts?.[accountId] ?? null;
  const homes = new Set(accountCredentialSources(account).map((source) => expandCredentialHome(source.home)).filter(Boolean));
  // An account with one store per CLI logs in exactly the CLIs it names; a single store logs in the CLI
  // its layout belongs to.
  const leases = (cli) => (account?.credentialSources ? Boolean(credentialSourceForCli(account, cli)) : cli === cliForCredential(account?.credentialSource));
  const found = [];
  for (const [id, executor] of Object.entries(cfg?.executors ?? {})) {
    if (executorId && id !== executorId) continue;
    if (!executorId && legacyStateKey(executor?.providerModel ?? executor?.provider) !== family) continue;
    for (const inv of Array.isArray(executor?.invocations) ? executor.invocations : []) {
      if (inv?.via !== 'cli' || !inv.id) continue;
      const confined = Boolean((inv.confinement ?? executor.confinement)?.backend);
      const store = credentialStoreOf(inv);
      let via = null;
      if (confined && store && account && leases(store.use)) via = 'lease';
      else if (CREDENTIAL_ENV.some((key) => homes.has(expandCredentialHome(inv.env?.[key])))) via = 'env';
      else if (inv.id.endsWith(`-${accountId}`)) via = 'name';
      if (via) found.push({ executorId: id, invocationId: inv.id, cli: cliOf(inv), adapter: inv.adapter ?? 'cli-spawn', confined, via });
    }
  }
  return { provider: family, accountId, account, invocations: found };
}

/**
 * The runner config handed to the dispatch door: the provider's inventory narrowed to the one account,
 * under whichever spelling the config declares it. Nothing else changes.
 */
export function configPinnedToAccount(cfg, { provider, accountId }) {
  const family = legacyStateKey(provider);
  const providers = {};
  for (const [key, entry] of Object.entries(cfg?.providers ?? {})) {
    if (legacyStateKey(key) !== family) providers[key] = entry;
    else if (entry?.accounts?.[accountId]) providers[key] = { ...entry, accounts: { [accountId]: entry.accounts[accountId] } };
  }
  // A pool declared in llmAccounts is the lease's source for that provider, so the pin narrows it too.
  const llmAccounts = {};
  for (const [pool, accounts] of Object.entries(cfg?.llmAccounts ?? {})) {
    if (legacyStateKey(pool) !== family) llmAccounts[pool] = accounts;
    else if (accounts?.[accountId]) llmAccounts[pool] = { [accountId]: accounts[accountId] };
  }
  return { ...cfg, providers, ...(cfg?.llmAccounts !== undefined ? { llmAccounts } : {}) };
}

/**
 * The model a real seat would ask `executorId` for on an account of `family`'s pool: the strongest tier whose
 * cell names an entry that pool serves. A probe on the invocation default (often a light model) proves the
 * login, not that the account serves the model its seats run. With no such cell the invocation default is
 * probed, and the row says so.
 */
export function probeModelFor(cfg, { executorId, family }) {
  const executor = cfg?.executors?.[executorId];
  const cellFamily = executor?.providerModel ?? executor?.provider ?? executorId;
  const tiers = cfg?.modelPolicies?.[cellFamily] ?? {};
  for (const tier of [...MODEL_POLICY_TIERS].reverse()) {
    if (tiers[tier] === undefined) continue;
    let entries;
    try { entries = parseTierCell(tiers[tier], cellFamily); } catch { continue; }
    const served = entries.find((entry) => legacyStateKey(entry.pool) === family);
    if (served) return { model: served.model, modelSource: `${cellFamily}.${tier}` };
  }
  return { model: null, modelSource: 'invocation-default' };
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function readText(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return ''; }
}

/** The first line of `text` matching `pattern`, trimmed. */
function lineMatching(text, pattern) {
  if (typeof text !== 'string') return null;
  return text.split(/\r?\n/).map((l) => l.trim()).find((l) => l && pattern.test(l)) ?? null;
}

/**
 * One outcome class and the line that shows it. `ok` is whether the dispatch settled; `text` is what it
 * printed and what the runner said about it; `cause` and `providerSignal` are what the settled run says about
 * a provider stop (`credential`, `quota` or `provider`: the agent protocol's verdict on the CLI's last words);
 * the run directory adds the herdr diagnosis a blocked round wrote. Classes: ok, blocked-trust-prompt, auth,
 * quota, sandbox, timeout, other.
 */
export function classifyAccountProbe({ ok = false, text = '', failureCode = null, cause = null, providerSignal = null, runDir = null } = {}) {
  const diagnosis = runDir ? readJson(path.join(runDir, 'herdr-diagnosis.json')) : null;
  const visibility = runDir ? readJson(path.join(runDir, 'visibility.json')) : null;
  const explain = diagnosis?.explain ?? null;
  const screen = [diagnosis?.detectionScreen, explain?.promptText, visibility?.screen].filter(Boolean).join('\n');
  const all = [text, screen].filter(Boolean).join('\n');

  if (ok) return { outcome: 'ok', evidence: lineMatching(text, /\bOK\b/) ?? lineMatching(text, /\S/) ?? 'settled' };
  const matchedRule = explain?.matchedRule ?? null;
  const extra = matchedRule ? { matchedRule } : {};
  if ((matchedRule && /trust/i.test(matchedRule)) || TRUST_PATTERN.test(screen)) {
    return { outcome: 'blocked-trust-prompt', evidence: lineMatching(screen, /trust this folder/i) ?? lineMatching(screen, /trust/i) ?? `herdr rule ${matchedRule}`, ...extra };
  }
  if (failureCode === 'provider-limit') {
    const signal = describeProviderSignal(providerSignal);
    if (cause === 'credential') return { outcome: 'auth', evidence: signal ?? 'the login is rejected', ...extra };
    if (cause === 'quota') return { outcome: 'quota', evidence: signal ?? 'the account has used up its quota', ...extra };
    if (cause === 'provider') return { outcome: 'other', evidence: signal ?? 'the provider refused the call', ...extra };
  }
  const sandbox = lineMatching(all, SANDBOX_PATTERN);
  if (sandbox) return { outcome: 'sandbox', evidence: sandbox, ...extra };
  if (TIMEOUT_PATTERN.test(String(failureCode ?? '')) || lineMatching(all, /timed out/i)) {
    return { outcome: 'timeout', evidence: lineMatching(all, /timed out|timeout/i) ?? String(failureCode), ...extra };
  }
  return { outcome: 'other', evidence: lineMatching(all, /\S/) ?? String(failureCode ?? 'no output'), ...extra };
}

const ACCOUNT_FAULTS = new Set(['auth', 'quota']);

/**
 * Who failed, from both legs. Direct rows (`leg: 'direct'`, a `no-probe` layout is no evidence) say what the
 * account's own login does; harness rows count only when `inVerdict`: a confined invocation (the read-only
 * door confines every round, and an invocation that declares no sandbox binds no private home, so its CLI
 * finds its own login directory mounted read-only and stops before it answers) that the account was not
 * quarantined for.
 * - healthy: every counted row answered;
 * - account-fault: every direct row is a login or quota stop and no counted harness row answered (with no direct
 *   row, every counted harness row is a login or quota stop); a harness row that answered against dead direct
 *   rows means the legs contradict, which is `mixed`;
 * - harness-fault: every direct row answered, some counted harness row did not;
 * - mixed: anything else; nothing-to-probe: neither leg has a row.
 */
export function accountProbeVerdict(rows) {
  const direct = rows.filter((r) => r.leg === 'direct' && r.outcome !== 'no-probe');
  const harness = rows.filter((r) => r.leg !== 'direct' && r.inVerdict);
  const counted = [...direct, ...harness];
  if (!counted.length) return 'nothing-to-probe';
  if (counted.every((r) => r.outcome === 'ok')) return 'healthy';
  if (direct.length ? direct.every((r) => ACCOUNT_FAULTS.has(r.outcome)) && !harness.some((r) => r.outcome === 'ok') : harness.every((r) => ACCOUNT_FAULTS.has(r.outcome))) return 'account-fault';
  if (direct.length && direct.every((r) => r.outcome === 'ok')) return 'harness-fault';
  return 'mixed';
}

const DIRECT_OUTCOMES = { login: 'auth', 'usage-limit': 'quota' };

/**
 * Leg 1: one call per login store of the account with the account's own login (no sandbox, no pane), each
 * under the account lock, on the model the harness leg asks the same CLI for. `probe` and `acquireLock`
 * are injectable; the defaults are the unlock probe's own call and the account lock.
 * Outcomes: ok, auth, quota, other, no-probe (a layout fgOS has no call for).
 */
export async function runDirectLeg({
  cfg, plan, probe = createCredentialProbe(), acquireLock = acquireAccountLock, runtimeDir, now = Date.now,
} = {}) {
  const { account, provider, accountId } = plan;
  const stores = account?.credentialSources
    ? Object.entries(account.credentialSources).map(([cli, source]) => ({ cli, source }))
    : accountCredentialSources(account).map((source) => ({ cli: cliForCredential(source), source }));
  const rows = [];
  for (const { cli, source } of stores) {
    const inv = plan.invocations.find((i) => i.cli === cli);
    const picked = inv ? probeModelFor(cfg, { executorId: inv.executorId, family: provider }) : { model: null, modelSource: 'invocation-default' };
    const base = { leg: 'direct', cli, store: source?.home ?? null, model: picked.model, modelSource: picked.modelSource };
    if (!credentialProbeCommand(source)) {
      rows.push({ ...base, outcome: 'no-probe', reason: null, providerSignal: null, exitCode: null, evidence: 'no probe exists for this credential layout', elapsedMs: 0 });
      continue;
    }
    const startedAt = now();
    let lock = null;
    let result;
    try {
      lock = await acquireLock({ runtimeDir, provider, accountId });
      result = await probe({ provider, accountId, account, cli, model: picked.model, spawnHolding: lock.spawnHolding });
    } catch (err) {
      result = { ok: false, detail: err?.message ?? String(err) };
    } finally {
      try { lock?.release(); } catch { /* a release problem must not turn a probe answer into a failure */ }
    }
    rows.push({
      ...base,
      outcome: result?.ok === true ? 'ok' : (DIRECT_OUTCOMES[result?.reason] ?? 'other'),
      reason: result?.reason ?? null,
      providerSignal: result?.providerSignal ?? null,
      exitCode: result?.exitCode ?? null,
      evidence: result?.detail ?? (result?.ok === true ? 'answered' : null),
      elapsedMs: result?.elapsedMs ?? now() - startedAt,
    });
  }
  return rows;
}

/** The inline execution contract of one probe: read-only, one run, the prompt as its objective. */
export function probeContract({ prompt = ACCOUNT_PROBE_PROMPT, timeoutMs = DEFAULT_ACCOUNT_PROBE_TIMEOUT_MS } = {}) {
  return {
    objective: prompt,
    contextRefs: [],
    constraints: [],
    expectedOutputs: ['the single word OK'],
    mutation: 'read-only',
    evidence: { required: 'reported' },
    role: 'reviewer',
    budget: { timeoutMs, maxRuns: 1 },
  };
}

/**
 * A built Assignment bound the way a Workflow unit binds one: the executor, the invocation and the
 * read-only posture, so the door confines it, leases the account and copies its login.
 */
export function withProbeBinding(assignment, { executorId, invocationId }) {
  return {
    ...assignment,
    binding: { executor: executorId, invocation: invocationId, posture: 'read-only' },
    policy: { ...(assignment.policy ?? {}), preferExecutor: executorId, preferInvocation: invocationId },
  };
}

/** What a RunResult says, read back from where the door wrote it. */
export function readRunOutcome(runResult, { repoRoot }) {
  const stdoutLog = runResult?.runtime?.stdoutLog ? path.resolve(repoRoot, runResult.runtime.stdoutLog) : null;
  const runDir = stdoutLog ? path.dirname(stdoutLog) : null;
  const visibility = runDir ? readJson(path.join(runDir, 'visibility.json')) : null;
  const claim = runDir ? readJson(path.join(runDir, 'outbox', 'result-1.json')) : null;
  const text = [
    claim?.summary,
    stdoutLog ? readText(stdoutLog).slice(-16 * 1024) : '',
    runDir ? readText(path.join(runDir, 'stderr.log')).slice(-16 * 1024) : '',
    runResult?.runnerNote?.summary,
  ].filter(Boolean).join('\n');
  // The CLI answered when its execution completed, whatever the verdict: a worker that replied but wrote
  // no result claim is a reporting gap of the round, not a fault of the CLI or the account.
  const outcome = runResult ? runOutcome(runResult) : null;
  return {
    ok: outcome?.executed === 'completed' && !outcome.failure,
    text,
    failureCode: outcome?.failure?.code ?? null,
    cause: outcome?.failure?.cause ?? null,
    providerSignal: outcome?.failure?.providerSignal ?? null,
    runDir,
    runId: runResult?.runId ?? null,
    paneId: visibility?.paneId ?? null,
    terminalKey: visibility?.terminalKey ?? null,
    herdrSession: visibility?.herdrSession ?? null,
  };
}

/**
 * Probe one account: the direct leg first (`leg` direct or both), then every invocation of the account at
 * once through the dispatch door (`leg` harness or both), one row per CLI, then close the panes the rounds
 * left open. A harness round the account's quarantine refused is `quarantined` and out of the verdict. With
 * `record`, the direct rows go to `recordProbe` (the capacity layer's `recordAccountProbe`); the harness
 * leg is a real dispatch and records its own faults. `createAssignment(contract)` builds and claims an inline Assignment;
 * `dispatch(assignment, { runnerConfig })` is the Assignment door and resolves to a RunResult;
 * `closePane({ paneId, herdrSession, terminalKey })` closes one pane by its terminal-control key. All three are injectable for tests.
 */
export async function runAccountProbe({
  cfg, provider, accountId, executorId = null, invocationIds = null, repoRoot,
  prompt = ACCOUNT_PROBE_PROMPT, timeoutMs = DEFAULT_ACCOUNT_PROBE_TIMEOUT_MS, leg = 'both', record = false,
  createAssignment, dispatch, closePane, probe, acquireLock, recordProbe = recordAccountProbe, runtimeDir, now = Date.now,
} = {}) {
  const plan = accountInvocations(cfg, { provider, accountId, executorId });
  if (!plan.account) {
    throw new Error(`no account "${accountId}" for provider "${plan.provider}" in runner.providers (~/.fgos/private/accounts.yaml)`);
  }
  const directRows = leg === 'harness'
    ? []
    : await runDirectLeg({ cfg, plan, ...(probe ? { probe } : {}), ...(acquireLock ? { acquireLock } : {}), runtimeDir, now });
  const wanted = leg === 'direct' ? [] : invocationIds ? plan.invocations.filter((i) => invocationIds.includes(i.invocationId)) : plan.invocations;
  const runnerConfig = configPinnedToAccount(cfg, { provider, accountId });
  // Ids are claimed one after another before anything starts: claiming is check-then-act on disk.
  const assignments = wanted.map((inv) => ({
    inv,
    assignment: withProbeBinding(createAssignment(probeContract({ prompt, timeoutMs })), inv),
  }));

  const rows = await Promise.all(assignments.map(async ({ inv, assignment }) => {
    const startedAt = now();
    const probed = probeModelFor(cfg, { executorId: inv.executorId, family: plan.provider });
    let run;
    try {
      // The pin travels both on the Assignment (what it is bound to) and as the door's override (what the
      // door actually launches), exactly as a Workflow unit dispatch passes it.
      // The probe names the account it probes; the lease takes exactly that one.
      const cliOverride = { preferExecutor: inv.executorId, preferInvocation: inv.invocationId, leaseAccount: accountId, ...(probed.model ? { model: probed.model } : {}) };
      run = readRunOutcome(await dispatch(assignment, { runnerConfig, cliOverride }), { repoRoot });
    } catch (err) {
      run = { ok: false, text: err?.message ?? String(err), failureCode: err?.errorClass ?? null, runDir: err?.runDir ?? null, paneId: err?.paneId ?? null, terminalKey: err?.terminalKey ?? null, herdrSession: err?.herdrSession ?? null };
    }
    const classified = classifyAccountProbe(run);
    const { evidence, matchedRule } = classified;
    // A lease refused for the account's quarantine says nothing about the harness.
    const quarantined = run.failureCode === LEASE_CONFLICT_FAILURE_CODE;
    const outcome = quarantined ? 'quarantined' : classified.outcome;
    // A settled round closes its own pane, so a refused close here means there was nothing left open.
    const pane = run.paneId ? (closePane({ paneId: run.paneId, herdrSession: run.herdrSession, terminalKey: run.terminalKey }) ? 'closed-by-probe' : 'not-open') : null;
    return {
      leg: 'harness',
      cli: inv.cli,
      invocationId: inv.invocationId,
      executorId: inv.executorId,
      adapter: inv.adapter,
      confined: inv.confined,
      inVerdict: inv.confined && !quarantined,
      account: inv.via,
      model: probed.model,
      modelSource: probed.modelSource,
      outcome,
      evidence,
      ...(matchedRule ? { matchedRule } : {}),
      assignmentId: assignment.assignmentId,
      runDir: run.runDir,
      paneId: run.paneId,
      ...(pane ? { pane } : {}),
      elapsedMs: now() - startedAt,
    };
  }));
  const results = [...directRows, ...rows];
  const verdict = accountProbeVerdict(results);
  const report = { provider: plan.provider, accountId, verdict, results };
  if (record) {
    try {
      recordProbe({
        provider: plan.provider, accountId, verdict, source: 'probe-account', runtimeDir,
        direct: directRows.filter((r) => r.outcome !== 'no-probe').map((r) => ({ ...r, ok: r.outcome === 'ok' })),
      });
      report.recorded = true;
    } catch (err) {
      report.recorded = false;
      report.recordError = err?.message ?? String(err);
    }
  }
  return report;
}

/**
 * Probe every enabled account of every provider, one after another (two families can share one login home,
 * and parallel rounds would open every pane at once). A disabled account is listed as skipped; an account
 * whose probe throws is listed with its error and the sweep goes on. `doors` are `runAccountProbe`'s.
 */
export async function runAccountSweep({ cfg, ...doors } = {}) {
  const accounts = [];
  for (const [provider, entry] of Object.entries(providerAccountInventory(cfg))) {
    for (const [accountId, account] of Object.entries(entry?.accounts ?? {})) {
      if (account?.disabled === true) { accounts.push({ provider, accountId, skipped: 'disabled' }); continue; }
      try {
        accounts.push(await runAccountProbe({ cfg, provider, accountId, ...doors }));
      } catch (err) {
        accounts.push({ provider, accountId, error: err?.message ?? String(err) });
      }
    }
  }
  return { accounts };
}
