// One executor, one tiny read-only seat through the one execution door (`runUnit`, handed in by the caller:
// Dispatch never imports the layer above it), bound by the executor, invocation and weakest tier it is
// pinned to so the cheapest model of its family runs, then a report of where its CLI wrote the session in the attempt home, whether
// finalize-home kept it, and where the kept copy is. Agent CLIs change where they write often; this is
// the repeatable check, so a CLI upgrade is judged in minutes per executor. Read-only: it changes no
// config and repairs nothing, it names the `runner.yaml` line to change when the declared folder is wrong.
//
// It never reads session content: names, counts and sizes only, because a session can hold secrets.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { readRunOutcome } from './provider-account-probe.mjs';
import { MODEL_POLICY_TIERS } from './config.mjs';
import { credentialStoreOf } from './provider-capacity.mjs';
import { OWNERSHIP_MARKER_FILE } from './confinement/cleanup.mjs';

export const SESSION_PROBE_PROMPT = 'Session probe: there is no task. Reply with the single word OK.';

/** The categories a probe ends in; only `kept` is success. */
export const SESSION_PROBE_CATEGORIES = Object.freeze([
  'kept', 'run-failed', 'no-private-home', 'dir-undeclared', 'dir-mismatch', 'no-session-written', 'copy-failed',
]);

/** The weakest tier of the ladder: the cheapest model each family allows. */
export const CHEAPEST_TIER = MODEL_POLICY_TIERS[0];

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

// A seat that failed on the provider's side (quota, a dead login) can still have written and kept its
// session; what the probe judges is the session, so a kept copy wins over the seat's own outcome.
function categoryOf({ ranOk, keep }) {
  if (keep.transcriptPath) return 'kept';
  if (!ranOk) return 'run-failed';
  if (!keep.hasHome) return 'no-private-home';
  if (keep.warnings.some((w) => w.code === 'session-copy-failed')) return 'copy-failed';
  if (keep.declaredSessionDir === null) return 'dir-undeclared';
  return keep.fix ? 'dir-mismatch' : 'no-session-written';
}

/**
 * Run the probe seat and report `{ executorId, invocationId, model, outcome, category, kept, declaredSessionDir,
 * observedSessionPaths, transcriptPath, files, sizeBytes, fix, warnings, runDir }`. `runUnit(options)` is the
 * execution door and resolves to `{ outcome, results[] }`; it is injectable for tests.
 */
export async function runSessionProbe({
  cfg, executorId, invocationId = null, repoRoot, cwd = repoRoot, prompt = SESSION_PROBE_PROMPT, runUnit,
} = {}) {
  if (typeof runUnit !== 'function') throw new Error('the session probe needs the execution door (runUnit)');
  const invocation = sessionProbeInvocation(cfg, executorId, invocationId);
  const unitData = { id: `probe-session-${crypto.randomBytes(3).toString('hex')}`, objective: prompt, capability: 'execute', writes: [] };
  const overrides = [{ executor: executorId, invocation: invocation.id, tier: CHEAPEST_TIER }];
  let run;
  let bound = null;
  try {
    const unit = await runUnit({ unitData, overrides, raiseAuthorized: false, repoRoot, cwd });
    const last = unit?.results?.at(-1) ?? null;
    bound = last?.binding ?? null;
    run = last?.runResult
      ? readRunOutcome(last.runResult, { repoRoot })
      : { ok: false, text: `the unit ended as ${unit?.outcome ?? 'unknown'} with no seat result`, runDir: null };
  } catch (err) {
    run = { ok: false, text: err?.message ?? String(err), runDir: err?.runDir ?? null };
  }
  const keep = describeSessionKeep({ runDir: run.runDir, invocation, executorId });
  const category = categoryOf({ ranOk: run.ok, keep });
  return {
    executorId,
    invocationId: invocation.id,
    model: bound?.model ?? null,
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
