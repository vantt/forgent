// One executor, one tiny read-only seat through the door a real read-only dispatch uses (the same one the
// account probe uses), then a report of where its CLI wrote the session in the attempt home, whether
// finalize-home kept it, and where the kept copy is. Agent CLIs change where they write often; this is
// the repeatable check, so a CLI upgrade is judged in minutes per executor. Read-only: it changes no
// config and repairs nothing, it names the `runner.yaml` line to change when the declared folder is wrong.
//
// It never reads session content: names, counts and sizes only, because a session can hold secrets.

import fs from 'node:fs';
import path from 'node:path';

import { probeContract, withProbeBinding, readRunOutcome } from './provider-account-probe.mjs';
import { MODEL_POLICY_TIERS } from './config.mjs';
import { parseTierCell } from './tier-cell.mjs';
import { credentialStoreOf } from './provider-capacity.mjs';
import { OWNERSHIP_MARKER_FILE } from './confinement/cleanup.mjs';

export const SESSION_PROBE_PROMPT = 'Session probe: there is no task. Reply with the single word OK.';
export const DEFAULT_SESSION_PROBE_TIMEOUT_MS = 3 * 60 * 1000;

/** The categories a probe ends in; only `kept` is success. */
export const SESSION_PROBE_CATEGORIES = Object.freeze([
  'kept', 'run-failed', 'no-private-home', 'dir-undeclared', 'dir-mismatch', 'no-session-written', 'copy-failed',
]);

/**
 * The cheapest model `executorId` is allowed: the first cell of its family's weakest tier that names a model.
 * Null when the family declares none, and the invocation default applies.
 */
export function cheapestModelFor(cfg, executorId) {
  const executor = cfg?.executors?.[executorId];
  const family = executor?.providerModel ?? executor?.provider ?? executorId;
  const tiers = cfg?.modelPolicies?.[family] ?? {};
  for (const tier of MODEL_POLICY_TIERS) {
    if (tiers[tier] === undefined) continue;
    try {
      const entry = parseTierCell(tiers[tier], family)[0];
      if (entry?.model) return entry.model;
    } catch { /* a malformed cell is skipped; the config check names it */ }
  }
  return null;
}

/**
 * The invocation a probe runs: the one named by `invocationId`, else the first confined `cli` invocation of the
 * executor in declaration order (a private home exists only under confinement).
 */
export function sessionProbeInvocation(cfg, executorId, invocationId = null) {
  const executor = cfg?.executors?.[executorId];
  if (!executor || executor.kind === 'tool') {
    throw new Error(`no agent executor "${executorId}" in the runner config`);
  }
  const invocations = (executor.invocations ?? []).filter((inv) => inv?.via === 'cli');
  const chosen = invocationId
    ? invocations.find((inv) => inv.id === invocationId)
    : invocations.find((inv) => (inv.confinement ?? executor.confinement)?.backend) ?? invocations[0];
  if (!chosen) {
    throw new Error(invocationId
      ? `executor "${executorId}" has no cli invocation "${invocationId}" (has: ${invocations.map((inv) => inv.id).join(', ') || 'none'})`
      : `executor "${executorId}" has no cli invocation to probe`);
  }
  return { ...chosen, command: chosen.command ?? executor.command };
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function treeSize(dir) {
  let files = 0;
  let bytes = 0;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return { files, bytes }; }
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const inner = treeSize(entryPath);
      files += inner.files;
      bytes += inner.bytes;
    } else if (entry.isFile()) {
      files += 1;
      bytes += fs.lstatSync(entryPath).size;
    }
  }
  return { files, bytes };
}

/**
 * What the probe says from what the run left in its run directory: the finalize-home step record (where the
 * CLI wrote, what was kept, the warnings) read against the invocation's declaration. Pure over the files.
 */
export function describeSessionKeep({ runDir, invocation, executorId }) {
  const step = runDir ? readJson(path.join(runDir, 'steps', 'finalize-home.json')) : null;
  const detail = step?.detail ?? null;
  const store = credentialStoreOf(invocation);
  const declaredSessionDir = store?.sessionDir ?? null;
  const loginFiles = new Set([OWNERSHIP_MARKER_FILE, ...(store?.files ?? [])]);
  // Entries of the home that are not login files: where a session can be. A directory the login files sit in
  // (`bin/fd`) is not one of them.
  const observedSessionPaths = (detail?.homeLayout ?? [])
    .filter((entry) => !loginFiles.has(entry.path) && ![...loginFiles].some((file) => file.startsWith(`${entry.path}/`)))
    .map(({ path: entryPath, kind, files, bytes }) => ({ path: entryPath, kind, files, bytes }));
  const transcriptPath = detail?.transcriptPath ? path.join(runDir, detail.transcriptPath) : null;
  const size = transcriptPath ? treeSize(transcriptPath) : { files: 0, bytes: 0 };
  const warnings = (detail?.warnings ?? []).map(({ code, message }) => ({ code, message }));
  const suggested = observedSessionPaths.find((entry) => entry.kind === 'dir' && /session/i.test(entry.path) && entry.files > 0);
  const fix = suggested && suggested.path !== declaredSessionDir
    ? `set sessionDir: ${suggested.path} on executors.${executorId}.invocations[${invocation.id}].credentialStore in core/config-standard/runner.yaml`
    : null;
  return { step, declaredSessionDir, observedSessionPaths, transcriptPath, ...size, warnings, fix, hasHome: Number(detail?.homes ?? 0) > 0 };
}

function categoryOf({ ranOk, keep }) {
  if (!ranOk) return 'run-failed';
  if (keep.transcriptPath) return 'kept';
  if (!keep.hasHome) return 'no-private-home';
  if (keep.warnings.some((w) => w.code === 'session-copy-failed')) return 'copy-failed';
  if (keep.declaredSessionDir === null) return 'dir-undeclared';
  return keep.fix ? 'dir-mismatch' : 'no-session-written';
}

/**
 * Run the probe seat and report `{ executorId, invocationId, model, outcome, category, kept, declaredSessionDir,
 * observedSessionPaths, transcriptPath, files, sizeBytes, fix, warnings, runDir }`. `createAssignment(contract)`
 * builds and claims an inline Assignment; `dispatch(assignment, { runnerConfig, cliOverride })` is the Assignment
 * door and resolves to a RunResult; both are injectable for tests.
 */
export async function runSessionProbe({
  cfg, executorId, invocationId = null, repoRoot, model, timeoutMs = DEFAULT_SESSION_PROBE_TIMEOUT_MS,
  prompt = SESSION_PROBE_PROMPT, createAssignment, dispatch,
} = {}) {
  const invocation = sessionProbeInvocation(cfg, executorId, invocationId);
  const probeModel = model ?? cheapestModelFor(cfg, executorId);
  const assignment = withProbeBinding(createAssignment(probeContract({ prompt, timeoutMs })), { executorId, invocationId: invocation.id });
  const cliOverride = { preferExecutor: executorId, preferInvocation: invocation.id, ...(probeModel ? { model: probeModel } : {}) };
  let run;
  try {
    run = readRunOutcome(await dispatch(assignment, { runnerConfig: cfg, cliOverride }), { repoRoot });
  } catch (err) {
    run = { ok: false, text: err?.message ?? String(err), runDir: err?.runDir ?? null };
  }
  const keep = describeSessionKeep({ runDir: run.runDir, invocation, executorId });
  const category = categoryOf({ ranOk: run.ok, keep });
  return {
    executorId,
    invocationId: invocation.id,
    model: probeModel,
    outcome: run.ok ? 'ok' : 'failed',
    category,
    kept: category === 'kept',
    declaredSessionDir: keep.declaredSessionDir,
    observedSessionPaths: keep.observedSessionPaths,
    transcriptPath: keep.transcriptPath,
    files: keep.files,
    sizeBytes: keep.bytes,
    fix: keep.fix,
    warnings: keep.warnings,
    runDir: run.runDir,
    ...(run.ok ? {} : { evidence: String(run.text ?? '').split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? null }),
  };
}
