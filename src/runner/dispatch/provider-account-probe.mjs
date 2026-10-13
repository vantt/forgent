// One provider account, every CLI configured for it, started at the same moment through the door a real
// read-only dispatch uses (executeAssignment with a read-only posture binding: confinement, private home,
// leased login copied in, herdr pane for a herdr-spawn invocation), with a trivial read-only prompt. The
// point is to tell an ACCOUNT fault (dead login, quota: every CLI fails the same way) from a CLI fault
// (one CLI stops at a trust prompt, a sandbox refusal, a version bug, while another CLI on the same login
// answers). Diagnostic only: it picks nothing and schedules nothing.
//
// It reuses what exists instead of adding a second engine: the Assignment door itself (the same object a
// Workflow unit dispatch hands it), the credential wordings of provider-auth-failure.mjs, the quota
// wording of the unlock probe, the herdr diagnosis a blocked round already writes, and the RUL75 renewal
// opt-in. The account is pinned by handing the door a runner config whose inventory holds only that
// account, so the lease cannot pick another one and a quarantine still refuses it, as it would for real.

import fs from 'node:fs';
import path from 'node:path';

import { matchAuthFailureLine } from './provider-auth-failure.mjs';
import { expandCredentialHome } from './provider-credential-probe.mjs';
import { normalizeProviderFamily } from './provider-adapter.mjs';
import { providerAccountInventory } from './provider-capacity.mjs';
import { runOutcome } from './run-result.mjs';

export const ACCOUNT_PROBE_PROMPT = 'Account probe: there is no task. Reply with the single word OK.';
export const DEFAULT_ACCOUNT_PROBE_TIMEOUT_MS = 3 * 60 * 1000;

const QUOTA_PATTERN = /usage limit|quota|rate limit/i;
const TRUST_PATTERN = /trust this folder|do you trust|trust the files/i;
const SANDBOX_PATTERN = /read-only file system|\bEROFS\b|bwrap:|operation not permitted|confinement (?:was declared|refused)|confinement-/i;
const TIMEOUT_PATTERN = /time[sd]?[-_ ]?out/i;

/** Which CLI an invocation runs, by the basename of its command. */
function cliOf(invocation) {
  return path.basename(String(invocation?.command ?? '')).toLowerCase();
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
 * - `lease`: a confined invocation with a private home whose CLI the account's credential layout logs in;
 *   the capacity layer copies that account's login into the home, exactly as a real dispatch does;
 * - `env`: the invocation's own credential env names the account's home;
 * - `name`: the invocation id ends with `-<accountId>` (config convention `<bin>-<mode>-<account>`),
 *   for a CLI that keeps its own login of the same account in its own directory.
 * Only `via: "cli"` invocations; `executorId` narrows to one executor.
 */
export function accountInvocations(cfg, { provider, accountId, executorId = null } = {}) {
  const family = normalizeProviderFamily(provider);
  const account = providerAccountInventory(cfg)?.[family]?.accounts?.[accountId] ?? null;
  const source = account?.credentialSource ?? null;
  const home = expandCredentialHome(source?.home);
  const leasedCli = cliForCredential(source);
  const found = [];
  for (const [id, executor] of Object.entries(cfg?.executors ?? {})) {
    if (executorId && id !== executorId) continue;
    if (!executorId && normalizeProviderFamily(executor?.providerModel ?? executor?.provider) !== family) continue;
    for (const inv of Array.isArray(executor?.invocations) ? executor.invocations : []) {
      if (inv?.via !== 'cli' || !inv.id) continue;
      const confined = Boolean((inv.confinement ?? executor.confinement)?.backend);
      const privateHome = (inv.resourceBindings ?? []).some((b) => b?.resource === 'private-home');
      let via = null;
      if (confined && privateHome && leasedCli && cliOf(inv) === leasedCli) via = 'lease';
      else if (home && CREDENTIAL_ENV.some((key) => expandCredentialHome(inv.env?.[key]) === home)) via = 'env';
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
  const family = normalizeProviderFamily(provider);
  const providers = {};
  for (const [key, entry] of Object.entries(cfg?.providers ?? {})) {
    if (normalizeProviderFamily(key) !== family) providers[key] = entry;
    else if (entry?.accounts?.[accountId]) providers[key] = { ...entry, accounts: { [accountId]: entry.accounts[accountId] } };
  }
  return { ...cfg, providers };
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
 * printed and what the runner said about it; the run directory adds the herdr diagnosis a blocked round
 * wrote. Classes: ok, blocked-trust-prompt, auth, quota, sandbox, timeout, other.
 */
export function classifyAccountProbe({ ok = false, text = '', failureCode = null, runDir = null } = {}) {
  const diagnosis = runDir ? readJson(path.join(runDir, 'herdr-diagnosis.json')) : null;
  const visibility = runDir ? readJson(path.join(runDir, 'visibility.json')) : null;
  const explain = diagnosis?.explain ?? null;
  const screen = [diagnosis?.detectionScreen, explain?.promptText, visibility?.screen].filter(Boolean).join('\n');
  const all = [text, screen].filter(Boolean).join('\n');

  if (ok) {
    const auth = matchAuthFailureLine(all);
    if (auth) return { outcome: 'auth', evidence: auth };
    return { outcome: 'ok', evidence: lineMatching(text, /\bOK\b/) ?? lineMatching(text, /\S/) ?? 'settled' };
  }
  const matchedRule = explain?.matchedRule ?? null;
  const extra = matchedRule ? { matchedRule } : {};
  if ((matchedRule && /trust/i.test(matchedRule)) || TRUST_PATTERN.test(screen)) {
    return { outcome: 'blocked-trust-prompt', evidence: lineMatching(screen, /trust this folder/i) ?? lineMatching(screen, /trust/i) ?? `herdr rule ${matchedRule}`, ...extra };
  }
  const auth = matchAuthFailureLine(all);
  if (auth) return { outcome: 'auth', evidence: auth, ...extra };
  const quota = lineMatching(all, QUOTA_PATTERN);
  if (quota) return { outcome: 'quota', evidence: quota, ...extra };
  const sandbox = lineMatching(all, SANDBOX_PATTERN);
  if (sandbox) return { outcome: 'sandbox', evidence: sandbox, ...extra };
  if (TIMEOUT_PATTERN.test(String(failureCode ?? '')) || lineMatching(all, /timed out/i)) {
    return { outcome: 'timeout', evidence: lineMatching(all, /timed out|timeout/i) ?? String(failureCode), ...extra };
  }
  return { outcome: 'other', evidence: lineMatching(all, /\S/) ?? String(failureCode ?? 'no output'), ...extra };
}

const ACCOUNT_FAULTS = new Set(['auth', 'quota']);

/** Account fault when every CLI failed the same account-level way; CLI fault when some answered. */
export function accountProbeVerdict(rows) {
  if (!rows.length) return 'nothing-to-probe';
  if (rows.every((r) => r.outcome === 'ok')) return 'healthy';
  if (rows.every((r) => ACCOUNT_FAULTS.has(r.outcome))) return 'account-fault';
  if (rows.some((r) => r.outcome === 'ok')) return 'cli-fault';
  return 'mixed';
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
    runDir,
    runId: runResult?.runId ?? null,
    paneId: visibility?.paneId ?? null,
    herdrSession: visibility?.herdrSession ?? null,
  };
}

/**
 * Start every invocation of the account at once and report one row per CLI, then close the panes the
 * rounds left open. `createAssignment(contract)` builds and claims an inline Assignment;
 * `dispatch(assignment, { runnerConfig })` is the Assignment door and resolves to a RunResult;
 * `closePane({ paneId, herdrSession })` closes one pane. All three are injectable for tests.
 */
export async function runAccountProbe({
  cfg, provider, accountId, executorId = null, invocationIds = null, repoRoot,
  prompt = ACCOUNT_PROBE_PROMPT, timeoutMs = DEFAULT_ACCOUNT_PROBE_TIMEOUT_MS,
  createAssignment, dispatch, closePane, now = Date.now,
} = {}) {
  const plan = accountInvocations(cfg, { provider, accountId, executorId });
  if (!plan.account) {
    throw new Error(`no account "${accountId}" for provider "${plan.provider}" in runner.providers (~/.fgos/config.json)`);
  }
  const wanted = invocationIds ? plan.invocations.filter((i) => invocationIds.includes(i.invocationId)) : plan.invocations;
  const runnerConfig = configPinnedToAccount(cfg, { provider, accountId });
  // Ids are claimed one after another before anything starts: claiming is check-then-act on disk.
  const assignments = wanted.map((inv) => ({
    inv,
    assignment: withProbeBinding(createAssignment(probeContract({ prompt, timeoutMs })), inv),
  }));

  const rows = await Promise.all(assignments.map(async ({ inv, assignment }) => {
    const startedAt = now();
    let run;
    try {
      // The pin travels both on the Assignment (what it is bound to) and as the door's override (what the
      // door actually launches), exactly as a Workflow unit dispatch passes it.
      const cliOverride = { preferExecutor: inv.executorId, preferInvocation: inv.invocationId };
      run = readRunOutcome(await dispatch(assignment, { runnerConfig, cliOverride }), { repoRoot });
    } catch (err) {
      run = { ok: false, text: err?.message ?? String(err), failureCode: err?.errorClass ?? null, runDir: err?.runDir ?? null, paneId: err?.paneId ?? null, herdrSession: err?.herdrSession ?? null };
    }
    const { outcome, evidence, matchedRule } = classifyAccountProbe(run);
    // A settled round closes its own pane, so a refused close here means there was nothing left open.
    const pane = run.paneId ? (closePane({ paneId: run.paneId, herdrSession: run.herdrSession }) ? 'closed-by-probe' : 'not-open') : null;
    return {
      cli: inv.cli,
      invocationId: inv.invocationId,
      executorId: inv.executorId,
      adapter: inv.adapter,
      confined: inv.confined,
      account: inv.via,
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
  return { provider: plan.provider, accountId, verdict: accountProbeVerdict(rows), results: rows };
}
