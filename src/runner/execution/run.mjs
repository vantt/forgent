// src/runner/execution/run.mjs — Single execution door (fgos run) and verifiable mutating gate
// Architecture guard: MUST NOT import src/state/**, src/runner/coordination/**, src/runner/worktree.mjs, or src/runner/merge.mjs (A4 boundary)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

import { validateUnit, normalizeWorkflowLink } from './unit.mjs';
import {
  assertCaseAdmissionPort, CaseAdmissionRefusedError, normalizeCaseRef, seatLaunchesOf, seatLaunchesUsed,
  PORT_MISSING, SEAT_LAUNCH_CEILING,
} from './case-admission-port.mjs';
import { expandGenerated, partitionPaths } from '../dispatch/write-scope.mjs';
import { bind, nextCandidate, retrySameCandidate } from './bind.mjs';
import { credentialFaultPools, inspectAccountRotation, mayRotateAccount, triedBindingsOf } from './account-rotation.mjs';
import { assertPinnedAccountsUsable, runnerConfigForBinding } from './account-pin.mjs';
import { simulateUnitBindings } from './dry-bind.mjs';
import { worktreeSnapshot, writesSince } from './partial-writes.mjs';
import { createSeatLedger } from './seat-ledger.mjs';
import { resolveSeats, assertNoSeatTier, effectiveRigorOf } from './seat-resolver.mjs';
import { isSeatRecord } from './legacy-seat-read.mjs';
import { assertSeatId } from '../../convention/seat-id.mjs';
import { runPattern } from './patterns/index.mjs';
import { resolvePattern } from './patterns/presets.mjs';
import { verifyCommandOf } from './patterns/reviewed.mjs';
import { runCommand } from '../goal-check.mjs';
import { executeAssignment } from '../dispatch/assignment-runner.mjs';
import { declaredOperationFields } from '../dispatch/assignment.mjs';
import { createCredentialProbe } from '../dispatch/provider-credential-probe.mjs';
import { ensureRunnerConfigForDir, RunnerConfigError, assertRunTimeoutMs } from '../dispatch/config.mjs';
import { commitOnBranch, commitUnitWork, foreignIndexDetail, preflightUnitWorktree } from './commit-unit-work.mjs';
import { assertSyncResumable, commitRoundWithSync, effectiveWriteScope, runPendingSync, seedSync, syncBrief, syncSummary } from './unit-sync.mjs';
import { AgentNotFoundError, resolveAgentDefinition } from '../agent-definitions.mjs';
import { parseYaml } from '../../util/yaml.mjs';
import { dispatchCwdHolder, admitSuccessor, recordCustodyHandoff } from '../dispatch/cwd-lock.mjs';
import { reportRefsOf, resolveUnitInputs, copyHandoffsInto, refIsHiddenFromBlind, plainInputName, isSeatInput } from './handoff-refs.mjs';
import { outcomeOfRunResult, readUnitRunHistory } from './unit-run-history.mjs';
import { writeUnitSummary } from './unit-summary.mjs';
import { createConfinementCredentialRenewal } from '../dispatch/confinement/cleanup.mjs';
import { sweepAttempts } from '../../run-supervisor/sweep.mjs';
import { adoptRun } from '../../run-supervisor/client.mjs';
import { installCancelOnSignal, assertNotCancelled, RunCancelledError } from '../../run-supervisor/cancel-registry.mjs';
import { cancelOnSignalEnabled } from '../../run-supervisor/cancel-opt-in.mjs';
import { readCancelWaitMs } from '../../run-supervisor/gate-kill-grace.mjs';
import { listGenerations } from '../dispatch/run-lock.mjs';
import { acquireUnitControl } from './unit-control.mjs';
import { currentAttemptOf, lastAttempts } from './unit-state.mjs';
import { createLockScope } from '../../holder-lock/index.mjs';
import { defaultConfinementTempRoots } from '../dispatch/confinement/backend-registry.mjs';

/** Write `file` atomically so a reader never sees half a record. */
function writeJsonAtomic(file, value) {
  const tmp = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
    fs.renameSync(tmp, file);
  } catch (error) {
    // Removing the partial temp file is best effort; the write error is the one to report.
    try { fs.rmSync(tmp, { force: true }); } catch { /* keep the write error */ }
    throw error;
  }
}

function publishUnitSummary(unitDir) {
  try { writeUnitSummary(unitDir); }
  catch (error) {
    console.warn(`fgos: could not write derived unit summary for "${path.basename(unitDir)}": ${error.message}`);
  }
}

/**
 * `{ personaPin }` for an assignment policy when the persona bound for this seat carries pinned
 * text, else nothing. An override scoped to this very seat wins; otherwise the unit's own persona,
 * pinned when the unit run started, applies to whichever seat bound that same name. Matching on
 * name keeps a pin from reaching a seat that resolved a different persona.
 */
function pinnedPersonaFor(unitRecord, seatId, persona) {
  const hit = (unitRecord.overrides ?? []).find((o) => o?.personaPin && o.scope?.seat === seatId && o.persona === persona);
  if (hit) return { personaPin: hit.personaPin };
  const unitPin = unitRecord.personaPin;
  return unitPin && unitPin.name === persona ? { personaPin: unitPin } : {};
}

/**
 * The text of a unit's persona, read once from the persona tiers so every attempt and resume
 * renders the same definition, including one that lives only in the workspace tier. A name no tier
 * defines keeps today's rendering by name; the one-liner already refuses it before the run. A definition
 * that exists but cannot be parsed or has the wrong shape throws its named problem.
 */
function unitPersonaPin(persona, mainRoot) {
  if (typeof persona !== 'string') return null;
  try {
    const { name, digest, text } = resolveAgentDefinition(persona, { projectRoot: mainRoot });
    return { name, digest, text };
  } catch (err) {
    if (err instanceof AgentNotFoundError) return null;
    throw err;
  }
}

/**
 * Whether this process runs inside a live herdr session: herdr exports HERDR_ENV=1 and the
 * socket path into every pane it starts. A caller that already knows passes
 * `session.herdrPresent` and skips the probe.
 */
export function detectHerdrPresent(env = process.env) {
  if (env.HERDR_ENV !== '1') return false;
  const socket = env.HERDR_SOCKET_PATH;
  return typeof socket === 'string' && socket !== '' && fs.existsSync(socket);
}

/**
 * Resolve git main checkout root and worktree path without importing worktree.mjs.
 */
export function resolveGitRoots(cwd = process.cwd()) {
  let toplevel;
  try {
    toplevel = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    throw new RunnerConfigError(`fgos run must run inside a git repository (cwd: ${cwd}): ${err.message}`);
  }

  let gitCommonDir;
  try {
    gitCommonDir = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      cwd: toplevel,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    gitCommonDir = '.git';
  }

  const resolvedCommon = path.resolve(toplevel, gitCommonDir);
  const mainCheckoutRoot = path.dirname(resolvedCommon);

  let realWorktree, realMain;
  try {
    realWorktree = fs.realpathSync(toplevel);
  } catch {
    realWorktree = path.resolve(toplevel);
  }
  try {
    realMain = fs.realpathSync(mainCheckoutRoot);
  } catch {
    realMain = path.resolve(mainCheckoutRoot);
  }

  return {
    worktreeRoot: realWorktree,
    mainCheckoutRoot: realMain,
    isLinkedWorktree: realWorktree !== realMain,
  };
}

/**
 * Capture snapshot of runner config from the main checkout root.
 */
export function snapshotRunnerConfig(mainCheckoutRoot, runnerConfig) {
  const cfg = runnerConfig ?? ensureRunnerConfigForDir(mainCheckoutRoot);
  const filtered = {
    capabilities: cfg.capabilities || {},
    patterns: cfg.patterns || {},
    rigorToTier: cfg.rigorToTier || {},
    modelPolicies: cfg.modelPolicies || {},
    executors: cfg.executors || {},
    governance: cfg.governance || null,
  };
  const serialized = JSON.stringify(filtered);
  const hash = crypto.createHash('sha256').update(serialized).digest('hex');
  return {
    hash,
    runner: cfg,
  };
}

/**
 * A producer attempt whose agent turn passed but whose runner commit failed: a resume commits it
 * again without spawning the agent. Not when the failed commit is still on the branch carrying
 * paths outside the scope; a person has to take that commit off first.
 */
function commitPending(attempt, worktree, mainRoot, custody) {
  const commit = attempt?.commit;
  if (commit?.status !== 'failed') return false;
  return !(commit.reason === 'committed-set-mismatch' && commit.sha && commitOnBranch(worktree, commit.sha, mainRoot, custody));
}

/** A resume cannot go past a commit that landed holding paths outside the unit's write scope. */
function assertNoStrayCommit(unitRunId, unitRecord, mainRoot) {
  for (const attempt of lastAttempts(unitRecord)) {
    const commit = attempt.commit;
    if (commit?.status !== 'failed' || commit.reason !== 'committed-set-mismatch' || !commit.sha) continue;
    if (!commitOnBranch(unitRecord.worktree, commit.sha, mainRoot)) continue;
    const diff = [
      ...(commit.unexpected ?? []).map((p) => `+${p}`),
      ...(commit.missing ?? []).map((p) => `-${p}`),
    ].join(', ');
    throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": commit ${commit.sha} is already on the branch but does not hold exactly the files of its write scope (${diff}; + is outside the scope, - is missing); inspect it and take it off the branch by hand (git reset HEAD~1 keeps its files in the worktree), then resume`);
  }
}

/**
 * An attempt of the supervisor era whose outcome the controller never recorded: it was handed to a
 * supervisor and the controller went away before reading the answer.
 */
function leftByDeadController(attempt, assignmentsDir) {
  if (!attempt || attempt.outcome !== undefined || typeof attempt.assignmentId !== 'string') return false;
  const prior = currentAttemptOf(assignmentsDir, attempt.assignmentId);
  return prior !== null && fs.existsSync(path.join(prior.dir, 'envelope.json'));
}

/** The newest `seatSchema` of a unit record this release can resume. It writes schema 1, so a record
 * that carries a later one came from a newer release: resuming it here would run it under rules this
 * release does not know. Read-only inspection of the record is unaffected. */
const KNOWN_SEAT_SCHEMA = 1;

function assertRecordNotFromNewerRelease(unitRunId, unitRecord) {
  const schema = unitRecord?.seatSchema;
  if (schema === undefined || schema === null) return;
  if (typeof schema === 'number' && schema <= KNOWN_SEAT_SCHEMA) return;
  throw new RunnerConfigError(
    `cannot resume unit run "${unitRunId}": unit.json field seatSchema is ${JSON.stringify(schema)}, written by a newer release than this one; resume it with that release`,
    { code: 'record-from-newer-release' },
  );
}

/**
 * A resume never starts a second agent over an attempt the previous controller left: an attempt whose
 * supervisor still works (or an adopter) is named and refused, an attempt from before the run supervisor
 * is refused for the doctor to settle. Only a closed attempt is carried on from. Asks the adopt door,
 * read-only, for every attempt whose outcome the dead controller never recorded.
 */
function assertAttemptsResumable(unitRunId, unitRecord, assignmentsDir) {
  for (const attempt of lastAttempts(unitRecord)) {
    if (!leftByDeadController(attempt, assignmentsDir)) continue;
    const prior = currentAttemptOf(assignmentsDir, attempt.assignmentId);
    const { state } = adoptRun(prior.dir, { probeOnly: true });
    if (state === 'closed') continue;
    const look = 'fgos dispatch inspect';
    if (state === 'legacy-run') {
      throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": attempt "${prior.runId}" ran before the run supervisor and cannot be judged (${prior.dir}); fgos doctor --fix settles it`, { code: 'attempt-legacy-run' });
    }
    throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": attempt "${prior.runId}" is still ${state} (${prior.dir}); look with \`${look}\` and resume once it has closed`, { code: 'attempt-still-running', attemptState: state });
  }
}

/**
 * How one dispatch of `attempt` enters the admission ledger. A dispatch the previous controller started
 * and never read the outcome of keeps its retry id, so the dispatch finds that attempt again and takes
 * its settled result instead of running the agent; a dispatch with no such history, or whose attempt
 * was abandoned before it started or cancelled by the person, gets a new id and names the attempt it follows.
 */
function admissionIdentityFor(attempt, { unitRunId, assignmentId, worktree, assignmentsDir }) {
  const current = currentAttemptOf(assignmentsDir, assignmentId);
  const abandoned = () => {
    if (!current) return false;
    // A run from before the supervisor that the legacy sweep settled has no result to carry on from.
    try {
      if (JSON.parse(fs.readFileSync(path.join(current.dir, 'run.json'), 'utf8')).settlement === 'abandoned-legacy') return true;
    } catch { /* no status record: judged by its envelope below */ }
    if (!fs.existsSync(path.join(current.dir, 'envelope.json'))) return false;
    if (adoptRun(current.dir, { probeOnly: true }).state !== 'closed') return false;
    try {
      const outcome = String(JSON.parse(fs.readFileSync(path.join(current.dir, 'receipt.json'), 'utf8')).outcome);
      // Never started, or stopped by the person's Ctrl-C: neither is a result to carry on from.
      return outcome.startsWith('abandoned') || outcome === 'cancelled';
    } catch { return false; }
  };
  // The ledger, not the directory, says whether the previous dispatch was admitted: a controller that
  // died between the admission commit and the directory's publication is completed by the same id.
  const generations = listGenerations(path.join(assignmentsDir, assignmentId, 'admission', 'generations'));
  const admitted = attempt.dispatchRetryId !== undefined && generations.some((g) => g.record?.retryId === attempt.dispatchRetryId);
  const continuing = attempt.outcome === undefined && admitted && !abandoned();
  const retryId = continuing ? attempt.dispatchRetryId : `${assignmentId}~${crypto.randomBytes(6).toString('hex')}`;
  return {
    retryId,
    predecessorRunId: generations.at(-1)?.record?.runId ?? null,
    destination: worktree,
    payloadDigest: crypto.createHash('sha256').update(`${unitRunId}|${assignmentId}`).digest('hex'),
  };
}

/**
 * The operation a Work step declared for this unit, checked before anything is dispatched: the
 * operation must be one the step declares, never human-only, its stamped mutation must agree
 * with the unit's write scope, and the unit runs `solo` (one assignment for one operation).
 * Returns the operation fields every producer assignment of the unit carries.
 */
function declaredOperationOf(declared, unit, patternName, { taskSpecRoot } = {}) {
  if (!declared || typeof declared !== 'object') throw new RunnerConfigError('runUnit: declared must be an object');
  for (const key of ['workId', 'domain', 'stage', 'operation']) {
    if (typeof declared[key] !== 'string' || !declared[key].trim()) {
      throw new RunnerConfigError(`runUnit: declared.${key} must be a non-empty string`);
    }
  }
  if (!Array.isArray(declared.operations)) {
    throw new RunnerConfigError('runUnit: declared.operations must be the step\'s operations');
  }
  const fields = declaredOperationFields({
    domain: declared.domain,
    workflow: declared.workflow ?? null,
    stage: declared.stage,
    operation: declared.operation,
    operations: declared.operations,
    taskSpecRoot,
  });
  if (fields.dispatch === 'human-only') {
    throw new RunnerConfigError(`runUnit: operation "${declared.operation}" is human-only and is never dispatched`);
  }
  const unitReadOnly = (unit.writes ?? []).length === 0;
  if ((fields.mutation === 'read-only') !== unitReadOnly) {
    throw new RunnerConfigError(`runUnit: operation "${declared.operation}" is ${fields.mutation} but the unit ${unitReadOnly ? 'writes nothing' : 'declares writes'}`);
  }
  // Through the same resolver the run uses, so a preset or an object form cannot slip past.
  const { patternName: resolved } = resolvePattern(patternName);
  if (resolved !== 'solo') {
    throw new RunnerConfigError(`runUnit: a unit carrying operation "${declared.operation}" runs solo, not "${resolved}"`);
  }
  return fields;
}

/** The sha256 hex digests of report revisions the caller stands behind; anything else is refused before the run. */
function checkedAcceptedReports(accepted) {
  if (accepted === undefined) return [];
  if (!Array.isArray(accepted) || accepted.some((d) => typeof d !== 'string' || !/^[0-9a-f]{64}$/.test(d))) {
    throw new RunnerConfigError('runUnit: acceptedReports must be sha256 hex digests');
  }
  return [...new Set(accepted)];
}

/** Absolute paths whose bytes a result is bound to; anything else is refused before the run. */
function checkedPinInputs(pinInputs) {
  if (pinInputs === undefined) return [];
  if (!Array.isArray(pinInputs) || pinInputs.some((p) => typeof p !== 'string' || !path.isAbsolute(p))) {
    throw new RunnerConfigError('runUnit: pinInputs must be absolute paths');
  }
  return [...new Set(pinInputs)];
}

function foreignIndexRefusal(tag, round, paths) {
  return {
    outcome: 'policy-refusal',
    ...tag,
    round,
    refused: { reason: 'foreign-staged-index', detail: foreignIndexDetail(paths), paths },
  };
}

/** The preflight refusal of a writing seat: an open merge this run did not start, or a foreign index. */
function preflightRefusal(tag, round, { foreignMerge, foreignStaged }) {
  if (foreignMerge) {
    return {
      outcome: 'policy-refusal',
      ...tag,
      round,
      refused: { reason: 'merge-in-progress', detail: `the worktree has a merge in progress (MERGE_HEAD ${foreignMerge}) that this run did not start; finish or abort it (git merge --abort), then run again` },
    };
  }
  return foreignStaged.length > 0 ? foreignIndexRefusal(tag, round, foreignStaged) : null;
}

/**
 * The pattern a fresh run uses: an object form a caller passes wins over the unit's own, then the
 * caller's name, else solo. One computation for the declared-operation check, the pin check, the
 * admission ceiling and the run itself; a resume reads the one its unit.json recorded instead.
 */
function chosenPattern(options, unit) {
  const callerPattern = options.pattern && typeof options.pattern === 'object' ? options.pattern : null;
  return callerPattern || unit.pattern || options.pattern || 'solo';
}

const portMissing = () => new RunnerConfigError(
  'runUnit: a Unit that writes (or names a case) needs the case admission port in options.caseAdmission; none was given',
  { code: PORT_MISSING },
);

/** A standalone writing run needs the affirmative `unbound`; every other answer, a missing view included, refuses. */
function requireFreeWorktree(port, worktree) {
  const binding = port.resolveBinding({ worktree });
  if (binding?.answer === 'unbound') return;
  const answer = binding?.answer ?? 'binding-view-unavailable';
  const owner = binding?.record?.caseId ? ` (case ${binding.record.caseId})` : '';
  throw new CaseAdmissionRefusedError({ code: answer, condition: binding?.condition ?? `worktree ${worktree} is not free for a run that names no case: ${answer}${owner}` });
}

/**
 * Refuse a pinned account before a unit run exists: each seat an `account` override applies to
 * (bound the way the run would bind it) must take that account, at least one seat must, and the
 * account must not be quarantined now.
 */
async function assertAccountPinsBeforeRun(unit, runnerConfig, options) {
  const overrides = options.overrides ?? [];
  if (!overrides.some((o) => o && typeof o === 'object' && o.account !== undefined)) return;
  const { seats } = await simulateUnitBindings(
    { ...unit, pattern: chosenPattern(options, unit) },
    runnerConfig,
    { session: { herdrPresent: options.session?.herdrPresent ?? detectHerdrPresent(), ...(options.session ?? {}) }, overrides },
  );
  const refused = seats.find((r) => r.refused?.reason?.startsWith('account-pin'));
  if (refused) throw new RunnerConfigError(`cannot pin the account for seat "${refused.seat}": ${refused.refused.detail}`);
  if (!seats.some((r) => r.account)) {
    const why = seats.filter((r) => r.accountSkipped).map((r) => `seat "${r.seat}": ${r.accountSkipped.detail}`);
    throw new RunnerConfigError(`the pinned account applies to no seat of this unit${why.length ? ` (${why.join('; ')})` : ': no seat its override names binds here'}`);
  }
  assertPinnedAccountsUsable(seats, { runnerConfig, runtimeDir: options.providerCapacityRuntimeDir, what: 'cannot start the unit run' });
}

/**
 * Main headless unit execution entrypoint.
 *
 * @param {object} options
 * @param {string} [options.unitPath] Path to unit YAML/JSON file or '-' for stdin
 * @param {object} [options.unitData] Raw unit object (in-memory)
 * @param {string} [options.pattern] Pattern name or preset
 * @param {Array} [options.overrides] Array of overrides [{scope, origin, executor, invocation, tier, persona, reasoningEffort, account, timeoutMs}]
 * @param {string} [options.resumeUnitRunId] Unit run ID to resume
 * @param {string} [options.repoRoot] Main repository root
 * @param {string} [options.cwd] Current working directory / worktree
 * @param {string} [options.worktree] Explicit worktree path
 * @param {object} [options.session] Session context { provider, tier, hasNativeAgent, herdrPresent, headless }
 * @param {object} [options.declared] Work step operation this unit runs: { workId, domain, workflow,
 *   stage, operation, operations } (operations are the step's operation objects). Stored in unit.json.
 * @param {string[]} [options.pinInputs] Absolute paths whose bytes the dispatch hashes at launch
 *   (`inputDigests` of the result). Stored in unit.json.
 * @param {object} [options.runnerConfig] Runner config the caller already resolved (e.g. from
 *   `--config <path>`); snapshotted into unit.json instead of reading `.fgos/config.json`.
 * @param {Function} [options.onLog] Log callback
 * @returns {Promise<{unitRunId: string, outcome: string, rounds: number, results: Array}>}
 */
export async function runUnit(options = {}) {
  assertNotCancelled();
  // `admission` is what the case admission port answered for this run; `settled` says it was handed back.
  const scope = { control: null, custody: null, handedOff: false, admission: null, unitRecord: null };
  const uninstall = holdCancelOnSignal(options);
  let result;
  let failure = null;
  try {
    result = await runUnitBody(options, scope);
    scope.handedOff = true;
    return result;
  } catch (error) {
    failure = error;
    throw error;
  } finally {
    try {
      try { if (scope.handedOff) recordCustodyHandoff(scope.custody, result); }
      finally { scope.custody?.release(); }
    } finally {
      try { scope.control?.release(); } catch { /* a seat that cannot be released is taken over as a dead holder */ }
      // After custody is released: the worktree is quiet, so the port may release the binding it took for this run.
      settleAdmission(scope, result, failure);
      uninstall();
    }
  }
}

/**
 * Hand the reservation back, once: after the pattern settled, or when the run failed. A cancelled run
 * is not settled: it stays live as a dead controller leaves it, and the resume carries on. A run that
 * never got a unit directory settles as `not-started`. The core writes nothing to the ledger before this.
 */
function settleAdmission(scope, result, failure) {
  const admission = scope.admission;
  if (!admission || admission.settled) return;
  if (failure instanceof RunCancelledError) return;
  admission.settled = true;
  const outcome = failure ? (admission.started ? 'execution-failure' : 'not-started') : result.outcome;
  try {
    admission.port.settle(admission.reservationId, {
      caseId: admission.caseId,
      outcome,
      unitRunId: admission.started ? admission.unitRunId : null,
      results: result?.results ?? [],
      seatLaunchesUsed: scope.unitRecord ? seatLaunchesUsed(scope.unitRecord) : 0,
      frameExhausted: scope.ceilingHit === true,
    });
  } catch (error) {
    console.warn(`fgos: could not settle reservation "${admission.reservationId}" of case "${admission.caseId}": ${error.message}`);
  }
}

// A process that asked for it (the CLI entry, `enableCancelOnSignal`) has Ctrl-C and SIGTERM cancel every
// attempt it delivered (cancel-registry.mjs). One handler serves all units running in the process:
// installed with the first, removed with the last. Any other caller keeps its own signal handling.
let cancelHolders = 0;
let removeCancelHandlers = null;
function holdCancelOnSignal(options) {
  if (!cancelOnSignalEnabled()) return () => {};
  if (cancelHolders === 0) {
    const projectRoot = options.repoRoot ?? (() => { try { return resolveGitRoots(options.cwd ?? process.cwd()).mainCheckoutRoot; } catch { return undefined; } })();
    removeCancelHandlers = installCancelOnSignal({ cancelWaitMs: readCancelWaitMs({ projectRoot }) });
  }
  cancelHolders += 1;
  return () => {
    cancelHolders -= 1;
    if (cancelHolders === 0) { removeCancelHandlers?.(); removeCancelHandlers = null; }
  };
}

async function runUnitBody(options, scope) {
  if (options.resumeUnitRunId && options.stanceOptions !== undefined) {
    throw new RunnerConfigError('cannot provide stanceOptions when resuming a unit run: the stored question is immutable');
  }
  // Private homes left by an earlier run (a failed round that kept its pane)
  // hold a copy of an account login; `fgos run` is the one door every such run
  // goes through, so it is also where the ones whose pane has since closed are
  // reclaimed. Best effort: a reap problem never blocks the run.
  const cwd = options.cwd ?? process.cwd();
  // A directory that is no git checkout still gets its homes reclaimed; the run then refuses as before.
  let roots = null;
  let rootsFailure = null;
  try { roots = resolveGitRoots(cwd); } catch (err) { rootsFailure = err; }
  const mainRoot = options.repoRoot ? path.resolve(options.repoRoot) : roots?.mainCheckoutRoot;
  try {
    sweepAttempts({ assignmentsRoot: mainRoot ? path.join(mainRoot, '.fgos', 'assignments') : undefined });
  } catch { /* best effort */ }
  if (rootsFailure) throw rootsFailure;
  const worktreePath = options.worktree ? path.resolve(options.worktree) : roots.worktreeRoot;
  const caseRef = normalizeCaseRef(options.caseRef);
  const port = options.caseAdmission === undefined ? null : assertCaseAdmissionPort(options.caseAdmission);

  let unit;
  let unitRunId;
  let unitRecord;
  let declaredOp = null;
  // The seat launches the admission handed this run (kept in unit.json, so a resume keeps the same bound).
  let admittedCeiling = null;
  // sha256 of the revisions of a settled report its caller stands behind (see handoff-refs `accept`); kept in
  // unit.json so a resume and every seat's own inputs read the same.
  let acceptedReports = [];
  const assignmentsDir = path.join(mainRoot, '.fgos', 'assignments');

  if (options.resumeUnitRunId) {
    unitRunId = options.resumeUnitRunId;
    const unitDir = path.join(assignmentsDir, unitRunId);
    const unitJsonPath = path.join(unitDir, 'unit.json');
    if (!fs.existsSync(unitJsonPath)) {
      throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": unit.json not found at "${unitJsonPath}"`);
    }
    // A record written before seats existed keys its attempts by role name. It stays readable (history,
    // summaries, hand-off refs) and is never resumed: that would re-enter it under the new keys.
    if (!isSeatRecord(JSON.parse(fs.readFileSync(unitJsonPath, 'utf8')))) {
      throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": record-predates-seat-binding (its seats were keyed by role name; start the work again as a new unit run)`, { code: 'record-predates-seat-binding' });
    }
    // One controller per unit: a live one (the run itself, or another resume) refuses this resume; one
    // that died is taken over. Taken before unit.json is read, so a resume that waited behind another
    // never works from a record that other one has since moved on.
    const control = acquireUnitControl(unitDir, unitRunId);
    if (control.status !== 'acquired') {
      throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": another controller drives it${control.holder?.pid ? ` (PID ${control.holder.pid})` : ''}`, { code: 'resume-in-progress' });
    }
    scope.control = control;
    unitRecord = JSON.parse(fs.readFileSync(unitJsonPath, 'utf8'));
    assertRecordNotFromNewerRelease(unitRunId, unitRecord);
    unit = validateUnit(unitRecord.unit);
    // A writing run is never resumed without the port, and a standalone one only into a free worktree.
    const resumeLink = normalizeWorkflowLink(unitRecord.workflow);
    if (unit.writes.length > 0 || unitRecord.sync) {
      if (!port) throw portMissing();
      if (!resumeLink) requireFreeWorktree(port, worktreePath);
    }
    // The reservation the first run recorded is the one this resume settles; it is never admitted again.
    if (port && resumeLink?.reservationId) {
      scope.admission = { port, caseId: resumeLink.caseId, reservationId: resumeLink.reservationId, unitRunId, started: true, settled: false };
    }
    if (!Array.isArray(unitRecord.resolvedInputs)) {
      throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": unit.json has no resolvedInputs`);
    }

    assertAttemptsResumable(unitRunId, unitRecord, assignmentsDir);

    // A mutating dispatch holds the worktree's dispatch-cwd lock while its
    // worker runs; resuming under a live holder would launch a second worker
    // into the same worktree.
    const cwdHolder = dispatchCwdHolder(path.join(mainRoot, '.fgos'), worktreePath);
    if (cwdHolder) {
      const who = cwdHolder.pid ? `another process (PID ${cwdHolder.pid})` : 'another process';
      throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": ${who} holds lock at "${cwdHolder.lockPath}"`);
    }
    assertNoStrayCommit(unitRunId, unitRecord, mainRoot);
    assertSyncResumable(unitRunId, unitRecord, mainRoot);
    assertPinnedAccountsUsable(lastAttempts(unitRecord).filter((a) => a.outcome !== 'pass').map((a) => a.binding ?? {}), {
      runnerConfig: unitRecord.configSnapshot?.runner,
      runtimeDir: options.providerCapacityRuntimeDir,
      what: `cannot resume unit run "${unitRunId}"`,
    });
    if (unitRecord.declared) declaredOp = declaredOperationOf(unitRecord.declared, unit, unitRecord.pattern);
  } else {
    if (options.declared === undefined && options.pinInputs !== undefined) {
      throw new RunnerConfigError('runUnit: pinInputs needs declared');
    }
    let raw;
    if (options.unitData) {
      raw = options.unitData;
    } else if (options.unitPath === '-') {
      const stdinContent = fs.readFileSync(0, 'utf8');
      try {
        raw = JSON.parse(stdinContent);
      } catch {
        raw = parseYaml(stdinContent, { filename: '<stdin>' });
      }
    } else if (options.unitPath) {
      const content = fs.readFileSync(path.resolve(options.unitPath), 'utf8');
      try {
        raw = JSON.parse(content);
      } catch {
        raw = parseYaml(content, { filename: options.unitPath });
      }
    } else {
      throw new RunnerConfigError('runUnit requires --unit <file|-> or unitData');
    }

    // A seat's tier is a recommendation only a registered workflow may make; a unit read from a file or
    // from stdin never carries one.
    if (!options.unitData) assertNoSeatTier(raw?.seats, 'a unit file');
    unit = validateUnit(options.stanceOptions === undefined ? raw : { ...raw, stanceOptions: options.stanceOptions });
    // Checked before the unit directory exists: an operation the step does not allow leaves nothing
    // behind. The pattern checked is the one the run will use (see patternName below).
    if (options.declared !== undefined) {
      declaredOp = declaredOperationOf(options.declared, unit, chosenPattern(options, unit), { taskSpecRoot: mainRoot });
    }
    const pinInputs = options.declared !== undefined ? checkedPinInputs(options.pinInputs) : [];
    acceptedReports = checkedAcceptedReports(options.acceptedReports);
    // A run timeout in an override is checked before the unit run exists (bind() checks it again).
    for (const ov of options.overrides ?? []) {
      if (ov && typeof ov === 'object' && ov.timeoutMs !== undefined) assertRunTimeoutMs(ov.timeoutMs, 'override timeoutMs');
    }
    const configSnapshot = snapshotRunnerConfig(mainRoot, options.runnerConfig);
    // The seats the pattern fills, resolved once before anything exists: an undeclared or invalid seat
    // list refuses the run here, and the record keeps the list so a resume never recomputes it.
    const seats = resolveSeats({ pattern: chosenPattern(options, unit), unit, runnerConfig: configSnapshot.runner });
    // A pinned account is checked before the unit run exists: every seat it applies to must bind an
    // executor whose provider lists it, and it must not be quarantined now.
    await assertAccountPinsBeforeRun(unit, configSnapshot.runner, options);
    // A sync ref is resolved to its commit once, before the run exists; a resume merges that commit.
    const sync = seedSync(unit, { worktree: worktreePath, mainRoot });
    const writing = unit.writes.length > 0 || Boolean(sync);
    if (writing && options.forceSharedCwd === true) throw Object.assign(new RunnerConfigError('--force-shared-cwd cannot be used with writes', { code: 'custody-required' }), { cwd: worktreePath, executorId: null, capability: unit.capability });
    // Admission comes first, then custody, then the unit directory: a refusal leaves nothing behind.
    // A writing Unit with no port is refused here; a standalone one runs only into a free worktree.
    if ((writing || caseRef) && !port) throw portMissing();
    const unitRunIdAtAdmission = `unit-run-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    if (writing && !caseRef) requireFreeWorktree(port, worktreePath);
    if (caseRef) {
      const pattern = chosenPattern(options, unit);
      const admitted = port.admit({
        unitRunId: unitRunIdAtAdmission,
        caseRef,
        activity: caseRef.activity,
        writes: unit.writes,
        worktree: fs.realpathSync(worktreePath),
        readOnly: !writing,
        pattern: resolvePattern(pattern).patternName,
        seatLaunches: seatLaunchesOf({ pattern, unit, runnerConfig: configSnapshot.runner }),
        blind: unit.blind === true,
        handoffRefs: unit.inputs,
        // The rigor the unit runs at (its own or its capability's, the stronger), so the frame's floor is
        // judged against what the seats will actually bind at.
        rigor: effectiveRigorOf(unit, configSnapshot.runner),
      });
      if (admitted.refused) throw new CaseAdmissionRefusedError(admitted.refused);
      scope.admission = { port, caseId: admitted.caseId, reservationId: admitted.reservationId, unitRunId: unitRunIdAtAdmission, started: false, settled: false };
      admittedCeiling = admitted.seatLaunchCeiling ?? null;
      options.onCaseAdmitted?.({ caseId: admitted.caseId, reservationId: admitted.reservationId });
    }
    if (writing) {
      scope.custody = admitSuccessor(createLockScope('unit-custody'), path.join(mainRoot, '.fgos'), worktreePath);
    }
    // Resolved before the unit directory exists, so a ref that points nowhere leaves nothing behind.
    unitRunId = unitRunIdAtAdmission;
    const unitDir = path.join(assignmentsDir, unitRunId);
    // A persona file that cannot be parsed or has the wrong shape refuses the run here, before the unit
    // directory exists, instead of seating a silently different persona.
    const personaPin = unitPersonaPin(unit.persona, mainRoot);
    let resolved;
    try {
      // A blind unit's roles each get their copies in their own directory at dispatch, so nothing is copied here.
      resolved = resolveUnitInputs(
        unit.inputs,
        mainRoot,
        {
          accept: acceptedReports,
          ...(unit.blind
            ? { blind: true, anonymize: unit.anonymizeInputs === true }
            : unit.anonymizeInputs ? { anonymizeInto: path.join(unitDir, 'inputs') } : {}),
        },
      );
    } catch (err) {
      fs.rmSync(unitDir, { recursive: true, force: true });
      throw err;
    }
    fs.mkdirSync(unitDir, { recursive: true });

    unitRecord = {
      unit,
      seatSchema: 1,
      seats,
      workflow: scope.admission ? normalizeWorkflowLink({ caseId: scope.admission.caseId, activity: caseRef.activity, reservationId: scope.admission.reservationId }) : null,
      ...(admittedCeiling !== null ? { seatLaunchCeiling: admittedCeiling } : {}),
      pattern: options.pattern ?? unit.pattern ?? 'solo',
      overrides: options.overrides || [],
      configSnapshot,
      // The scope this run may write, widened once to the render targets of generated sources it
      // touches. A resumed run reads it back and never recomputes it against a changed config.
      writeScope: expandGenerated(unit.writes, configSnapshot.runner.generatedPaths ?? []),
      ...(personaPin ? { personaPin } : {}),
      resolvedInputs: resolved.refs,
      ...(acceptedReports.length > 0 ? { acceptedReports } : {}),
      // Which input each neutral name stands for; only the owner reads this, never a role.
      ...(unit.anonymizeInputs || unit.blind ? { inputMap: resolved.inputMap } : {}),
      worktree: fs.realpathSync(worktreePath),
      ...(sync ? { sync } : {}),
      // The Work step operation and the files its verdict is bound to; a resume reads them back
      // from here and never takes them from its caller again.
      ...(options.declared !== undefined ? {
        declared: {
          workId: options.declared.workId,
          domain: options.declared.domain,
          ...(options.declared.workflow ? { workflow: options.declared.workflow } : {}),
          stage: options.declared.stage,
          operation: options.declared.operation,
          operations: options.declared.operations,
        },
        pinInputs,
      } : {}),
      createdBy: process.env.USER || 'system',
      createdAt: new Date().toISOString(),
      execution: { status: 'running' },
    };

    fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(unitRecord, null, 2));
    if (scope.admission) scope.admission.started = true;
    const fresh = acquireUnitControl(unitDir, unitRunId);
    if (fresh.status !== 'acquired') throw new RunnerConfigError(`unit run "${unitRunId}" is already driven by another controller`, { code: 'resume-in-progress' });
    scope.control = fresh;
    // Told once, as soon as the run exists and before any seat can start, so a caller can record
    // the id and resume this run if it dies. Not called for a resumed run: its id is already known.
    options.onUnitRunCreated?.(unitRunId);
  }

  if (!scope.custody && (unit.writes.length > 0 || unitRecord.sync)) {
    if (options.forceSharedCwd === true) throw Object.assign(new RunnerConfigError('--force-shared-cwd cannot be used with writes', { code: 'custody-required' }), { cwd: unitRecord.worktree, executorId: null, capability: unit.capability });
    scope.custody = admitSuccessor(createLockScope('unit-custody'), path.join(mainRoot, '.fgos'), unitRecord.worktree);
  }

  scope.unitRecord = unitRecord;
  const seatLaunchCeiling = unitRecord.seatLaunchCeiling ?? null;
  const unitDir = path.join(assignmentsDir, unitRunId);
  if (options.resumeUnitRunId) {
    const summaryFile = path.join(unitDir, 'unit-summary.json');
    try {
      if (fs.lstatSync(summaryFile).isFile()) fs.unlinkSync(summaryFile);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new RunnerConfigError(`cannot invalidate published summary before resuming "${unitRunId}": ${error.message}`);
      }
    }
  }
  delete unitRecord.settlement;
  unitRecord.execution = { status: 'running' };
  writeJsonAtomic(path.join(unitDir, 'unit.json'), unitRecord);
  const settle = (outcome) => {
    unitRecord.settlement = { outcome, settledAt: new Date().toISOString() };
    unitRecord.execution = { status: 'settled' };
    writeJsonAtomic(path.join(unitDir, 'unit.json'), unitRecord);
    publishUnitSummary(unitDir);
  };

  let executionSettled = false;
  try {

  // A producer round whose commit is still pending is not settled yet: the pattern asks for it
  // again, and runRole commits it without spawning the agent.
  // The same for a round whose controller died before it read the outcome: the attempt may have settled
  // on its own, and the resume carries on from that result (commit, then the rest) instead of skipping it.
  const pendingCommitKeys = () => new Set(Object.entries(unitRecord.bindings ?? {})
    .filter(([, attempts]) => {
      const last = attempts[attempts.length - 1];
      return commitPending(last, unitRecord.worktree, mainRoot, scope.custody) || leftByDeadController(last, assignmentsDir);
    })
    .map(([key]) => key));
  const history = () => {
    const pending = pendingCommitKeys();
    return readUnitRunHistory(unitDir).filter((h) => !pending.has(`${h.seat}/${h.round ?? 1}`));
  };

  // Which executors filled which seat; `independentOf` seat ids resolve through it (see seat-ledger.mjs).
  // Bind, publish to the ledger and launch are ordered per unit run: the ledger read, the bind and the
  // publish of one seat queue behind the seats listed before it, and a group of seats launches only once
  // every seat of the group is bound.
  const seatLedger = createSeatLedger();

  // Bindings recorded in unit.json, per seat/round, one entry per attempt (the first binding,
  // then one per provider-limit fallback). A resumed run reuses them instead of binding again,
  // so a resume never changes which executor or transport a seat was already given.
  if (!unitRecord.bindings || typeof unitRecord.bindings !== 'object') unitRecord.bindings = {};
  for (const attempts of Object.values(unitRecord.bindings)) {
    for (const attempt of attempts) seatLedger.note(attempt.seat, attempt.binding?.executor);
  }
  // Pools whose login failed in this unit and that a seat then walked away from: no later fallback
  // walk of the unit lands on one (a resumed run rebuilds the set from its attempts).
  const credentialFaultPoolSet = credentialFaultPools(unitRecord);
  const persistUnitRecord = () => writeJsonAtomic(path.join(unitDir, 'unit.json'), unitRecord);

  // One dispatch of an already-bound role. Returns the settled outcome of that attempt.
  const dispatchBound = async ({ bound, seat, round, readOnly, assignmentId, assignmentDir, session, inputs = [], objective = unit.objective, admission }) => {
    // A pinned account leases from an inventory holding only that account (account-pin.mjs).
    const runnerConfig = runnerConfigForBinding(unitRecord.configSnapshot.runner, bound);
    fs.mkdirSync(assignmentDir, { recursive: true });

    // What the unit names (already resolved to paths), then the accounts of the seats whose
    // work this seat judges (a panel synthesizer reads its members' reports).
    let contextRefs = [...new Set([...unitRecord.resolvedInputs, ...reportRefsOf(inputs, { mainRoot, worktree: unitRecord.worktree })])];
    if (unit.blind) {
      // A blind seat reads only its own directory of the run state, so what lies elsewhere in it
      // reaches the role as a copy there, byte for byte; the copies are what its refs list.
      const inRun = contextRefs.filter((ref) => refIsHiddenFromBlind(ref, mainRoot));
      const entries = [
        ...(unitRecord.inputMap ?? []),
        ...inRun.map((source, i) => ({ name: `${plainInputName((unitRecord.inputMap?.length ?? 0) + i, source, mainRoot)}${path.extname(source)}`, source })),
      ];
      contextRefs = [...contextRefs.filter((ref) => !inRun.includes(ref)), ...copyHandoffsInto(assignmentDir, entries)];
    }

    // What an earlier run's same seat left for this seat: its own previous result, copied
    // into its own directory whether the unit is blind or not.
    if (unit.inputs.some(isSeatInput)) {
      contextRefs = [...contextRefs, ...copyHandoffsInto(assignmentDir, resolveUnitInputs(unit.inputs, mainRoot, { seat: seat.seat, accept: unitRecord.acceptedReports ?? [] }).inputMap)];
    }

    // A unit that runs a Work step operation is that operation's assignment: its seat keeps its
    // name in provenance.role and its directory, the assignment carries the operation's role and stamp.
    // The seat that does the unit's own work (its posture says it writes) carries the operation.
    const carriesOperation = declaredOp && seat.posture.writer;
    const operationFields = carriesOperation ? {
      workId: unitRecord.declared.workId,
      domain: declaredOp.domain,
      ...(declaredOp.workflow ? { workflow: declaredOp.workflow } : {}),
      stage: declaredOp.stage,
      operation: declaredOp.operation,
      dispatch: declaredOp.dispatch,
      taskSpec: declaredOp.taskSpec,
      skills: declaredOp.skills,
      ...(declaredOp.contractTemplate ? { contractTemplate: declaredOp.contractTemplate } : {}),
      evidence: declaredOp.evidence,
      resultKind: declaredOp.resultKind,
      ...(declaredOp.onAdvance ? { onAdvance: declaredOp.onAdvance } : {}),
    } : {};
    const assignment = {
      assignmentId,
      unitRunId,
      seat: seat.seat,
      role: carriesOperation ? declaredOp.role : seat.role,
      posture: seat.posture,
      round,
      ...operationFields,
      // The role's own task when the pattern gave it a unit of its own (a reviewer is told to
      // review, not to redo the work); otherwise the unit's objective.
      objective,
      mutation: readOnly ? 'read-only' : 'mutating',
      binding: bound,
      provenance: {
        kind: 'unit-run',
        unitRunId,
        seat: seat.seat,
        role: seat.role,
        posture: seat.posture,
        round,
        binding: bound,
        ...(carriesOperation ? { declared: declaredOp.declared } : {}),
      },
      expectedOutputs: unit.expectedOutputs || [],
      contextRefs,
      writes: effectiveWriteScope(unitRecord),
      // The conflicted files of a merge the runner left open for this writing seat: settlement
      // counts the seat's edits to them as its evidence, though they were dirty at launch.
      ...(!readOnly && unitRecord.sync?.status === 'conflicted' ? { syncConflicts: [...unitRecord.sync.conflicts] } : {}),
      policy: {
        tier: bound.tier,
        preferExecutor: bound.executor,
        preferInvocation: bound.invocation,
        preferPersona: bound.persona,
        // The rigor the unit asked for, so the policy's own rigor reads match what bind tiered on.
        ...(unit.rigor ? { rigor: unit.rigor } : {}),
        // The persona text a caller pinned for this role when it supplied the override: the prompt
        // renders that text, never a file read again at dispatch time.
        ...pinnedPersonaFor(unitRecord, seat.seat, bound.persona),
      },
    };

    const runResult = await executeAssignment(assignment, {
      cwd: unitRecord.worktree,
      repoRoot: mainRoot,
      custody: readOnly ? null : scope.custody,
      // The case this launch was admitted into, so the worker's environment names it and no other.
      ...(scope.admission ? { caseContext: { caseId: scope.admission.caseId, reservationId: scope.admission.reservationId } } : {}),
      runnerConfig,
      // The admission identity of this dispatch: a resume of an attempt whose outcome was never read
      // finds that attempt again (and its settled result) instead of admitting a new one.
      ...admission,
      providerCredentialProbe: createCredentialProbe(),
      providerCredentialRenew: createConfinementCredentialRenewal({ tempRoots: defaultConfinementTempRoots }),
      cliOverride: {
        preferExecutor: bound.executor,
        // bind() already chose the invocation that carries bound.transport: the executor's
        // herdr-spawn one for 'herdr', its cli one otherwise.
        preferInvocation: bound.invocation,
        tier: bound.tier,
        model: bound.model,
        // The pool that serves `model`; the lease takes the account from it.
        ...(bound.pool ? { pool: bound.pool } : {}),
        // A level bind() accepted from an override; the launch renders it into the CLI's flag.
        ...(bound.reasoningEffort ? { reasoningEffort: bound.reasoningEffort } : {}),
      },
      isReadOnlyMode: readOnly,
      // The run's own time when bind() took one (override or unit); otherwise `runner.timeoutMs`.
      ...(bound.timeoutMs ? { timeoutMs: bound.timeoutMs } : {}),
      session,
      ...(carriesOperation ? { operations: unitRecord.declared.operations, pinInputs: unitRecord.pinInputs ?? [] } : {}),
      ...(options.providerCapacityRuntimeDir ? { providerCapacityRuntimeDir: options.providerCapacityRuntimeDir } : {}),
      // Every role of a blind unit is dispatched blind or refused, never run unblind.
      ...(unit.blind ? { blind: true } : {}),
    });

    return {
      outcome: outcomeOfRunResult(runResult),
      seat: seat.seat,
      role: seat.role,
      posture: seat.posture,
      round,
      runResult,
      binding: bound,
    };
  };

  // Helper to run one seat: bind it, publish the binding, then launch it.
  const runRole = async ({ seat, unit: rUnit, round = 1, independentOf = [], preferIndependentOf = [], inputs = [], batch }) => {
    assertNotCancelled();
    const seatId = seat.seat;
    // A seat id names a directory and a ref segment of this run; only Convention's ids reach a path.
    assertSeatId(seatId);
    const seatTag = { seat: seatId, role: seat.role, posture: seat.posture };
    const readOnly = seat.posture.readOnly;
    const runnerConfig = unitRecord.configSnapshot.runner;
    const session = {
      provider: options.session?.provider,
      tier: options.session?.tier,
      hasNativeAgent: options.session?.hasNativeAgent ?? false,
      herdrPresent: options.session?.herdrPresent ?? detectHerdrPresent(),
      headless: options.session?.headless ?? true,
    };

    // What bind() is asked for this seat. The independence and the spread are read from the ledger when
    // the ask is built, so they see exactly the seats bound before this one.
    const askOf = () => ({
      unit: rUnit || unit,
      seat: seatId,
      role: seat.role,
      posture: seat.posture,
      ...(seat.persona ? { persona: seat.persona } : {}),
      readOnly,
      independentOf: seatLedger.resolve(independentOf),
      ...(preferIndependentOf.length > 0 ? { preferIndependentOf: seatLedger.seats(preferIndependentOf) } : {}),
      overrides: unitRecord.overrides || [],
      ...(unit.blind ? { blind: true } : {}),
    });
    const bindCtx = { runnerConfig, session };

    const key = `${seatId}/${round}`;
    const recorded = unitRecord.bindings[key] ?? [];
    let attemptNo = recorded.length > 0 ? recorded.length - 1 : 0;
    // Ledger read, bind and publish are one queued step: seats started together bind one after the other
    // in the order they were listed, each seeing the executors its earlier siblings were just given, even
    // when a bind takes time.
    let bound;
    try {
      bound = await seatLedger.serialize(() => {
        const first = recorded.length > 0 ? recorded[recorded.length - 1].binding : bind(askOf(), bindCtx);
        if (!first.refused) seatLedger.note(seatId, first.executor);
        return first;
      });
    } finally {
      batch?.arrive();
    }
    // A group of seats launches only after every seat of the group is bound.
    await batch?.bound;

    if (bound.refused) {
      return {
        outcome: 'policy-refusal',
        ...seatTag,
        round,
        refused: bound.refused,
      };
    }

    const writeScope = effectiveWriteScope(unitRecord);
    // A merge a sync left open for this round is concluded first (unit-sync.mjs), then the rest.
    const commitWork = (summarySource, runResult, excludePaths) => {
      const commit = commitRoundWithSync(unitRecord, mainRoot, () => commitUnitWork({
        worktree: unitRecord.worktree,
        // The gitdir and hooks come from the main checkout, never from the worker-writable worktree.
        repoRoot: mainRoot,
        custody: scope.custody,
        unitId: summarySource.id,
        summary: runResult?.agentClaim?.summary,
        objective: summarySource.objective,
        scope: writeScope,
        changedFiles: runResult?.evidence?.changedFiles ?? null,
        excludePaths,
        needsWrites: runResult?.agentClaim?.needsWrites,
      }), excludePaths, scope.custody);
      persistUnitRecord();
      return commit;
    };

    // The consent the admission stood on is checked again just before a writing round is committed,
    // through the same port object the run was given; a refusal commits nothing.
    const writeGate = (changedFiles) => {
      const admission = scope.admission;
      if (!admission) return null;
      const verdict = admission.port.recheckEffect(admission.reservationId, { caseId: admission.caseId, paths: changedFiles ?? [] });
      return verdict?.refused ? { reason: verdict.refused.code, detail: verdict.refused.condition } : null;
    };

    // The agent already did this round's work and only the runner commit failed: commit again,
    // never spawn the agent a second time.
    const lastRecorded = recorded[recorded.length - 1];
    if (!readOnly && commitPending(lastRecorded, unitRecord.worktree, mainRoot, scope.custody)) {
      const refusal = preflightRefusal(seatTag, round, preflightUnitWorktree({ worktree: unitRecord.worktree, repoRoot: mainRoot, custody: scope.custody, scope: writeScope, sync: unitRecord.sync }));
      if (refusal) return refusal;
      assertNotCancelled();
      const prior = readUnitRunHistory(unitDir).find((h) => h.seat === seatId && (h.round ?? 1) === round);
      const gate = writeGate(prior?.runResult?.evidence?.changedFiles);
      if (gate) return { outcome: 'policy-refusal', ...seatTag, round, refused: gate };
      const excludePaths = lastRecorded.preExistingInScope ?? [];
      let commit = commitWork(rUnit || unit, prior?.runResult, excludePaths);
      if (commit.status === 'no-changes') {
        // The agent's in-scope files are gone (cleaned up with the index): that is not a pass.
        // Files a sync merge commit of this round took are not missing.
        const inMerge = commit.sync?.files ?? [];
        const missing = partitionPaths((prior?.runResult?.evidence?.changedFiles ?? [])
          .filter((p) => !excludePaths.includes(p) && !inMerge.includes(p)), writeScope).inScope;
        if (missing.length > 0) {
          commit = { ...commit, status: 'failed', reason: 'work-missing', missing,
            error: `the files this round changed in scope are no longer in the worktree: ${missing.join(', ')}; run the unit again` };
        }
      }
      lastRecorded.commit = commit;
      lastRecorded.outcome = commit.status === 'failed' ? 'execution-failure' : 'pass';
      persistUnitRecord();
      return { outcome: lastRecorded.outcome, ...seatTag, round, runResult: prior?.runResult, binding: lastRecorded.binding, commit };
    }

    if (bound.mechanism === 'inline') {
      if (!readOnly) return { outcome: 'policy-refusal', ...seatTag, round, refused: { reason: 'custody-domain-required', detail: 'a mutating producer needs a supervised declared domain', cwd: unitRecord.worktree, executorId: bound.executor, capability: unit.capability } };
      if (!seat.posture.inlineAllowed) {
        throw new RunnerConfigError(`seat "${seatId}" cannot be bound inline (its posture keeps it out of the session; G2 / Q-A violation)`);
      }
      const nonce = crypto.randomBytes(16).toString('hex');
      const pendingRecord = {
        unitRunId,
        ...seatTag,
        round,
        nonce,
        binding: bound,
        createdAt: new Date().toISOString(),
      };
      fs.writeFileSync(path.join(unitDir, 'pending-inline.json'), JSON.stringify(pendingRecord, null, 2));
      return {
        outcome: 'blocked',
        ...seatTag,
        round,
        pendingInline: { nonce, seat: seatId, round },
      };
    }

    // Before a mutating producer is spawned: an index someone else staged refuses the run (the
    // runner stages only what it chose), and files already dirty in scope are recorded so the
    // runner never commits them. A resumed attempt keeps what its first launch saw.
    let preExistingInScope = [];
    if (!readOnly) {
      const preflight = preflightUnitWorktree({ worktree: unitRecord.worktree, repoRoot: mainRoot, custody: scope.custody, scope: writeScope, sync: unitRecord.sync });
      const refusal = preflightRefusal(seatTag, round, preflight);
      if (refusal) return refusal;
      preExistingInScope = recorded[0]?.preExistingInScope ?? preflight.preExistingInScope;
    }

    // Out-of-process dispatch, with provider-limit failover: when the agent stops on a provider
    // limit or a dead credential, the same executor first runs again on another account of its
    // provider, then the next candidate of the capability's prefer pool runs; each attempt gets a
    // fresh pane/process and the failed one is left exactly as it was (its pane stays open). With
    // nothing left the outcome stays provider-limit -- no other executor is guessed at.
    let lastResult = null;
    for (;;) {
      const assignmentId = attemptNo === 0 ? `${unitRunId}/${seatId}/${round}` : `${unitRunId}/${seatId}/${round}-fb${attemptNo}`;
      const assignmentDir = path.join(unitDir, seatId, attemptNo === 0 ? String(round) : `${round}-fb${attemptNo}`);

      const attempts = unitRecord.bindings[key] ?? (unitRecord.bindings[key] = []);
      // The seat-launch ceiling the admission handed this run: a launch that would pass it does not
      // happen. A seat that already ran keeps what it has (a provider limit stays one, with
      // `fallbackExhausted`); a seat that never ran is refused by name, never reported as `blocked`.
      if (attempts[attemptNo]?.dispatchRetryId === undefined && seatLaunchCeiling !== null && seatLaunchesUsed(unitRecord) >= seatLaunchCeiling) {
        scope.ceilingHit = true;
        const detail = `the seat-launch ceiling of ${seatLaunchCeiling} for this Unit is spent`;
        if (attemptNo === 0) return { outcome: 'policy-refusal', ...seatTag, round, refused: { reason: SEAT_LAUNCH_CEILING, detail } };
        return {
          ...(lastResult ?? { outcome: 'provider-limit', ...seatTag, round }),
          fallbackExhausted: {
            from: { executor: bound.executor, invocation: bound.invocation, transport: bound.transport },
            reason: SEAT_LAUNCH_CEILING,
            detail,
          },
        };
      }
      if (attempts.length <= attemptNo) {
        attempts.push({
          seat: seatId,
          role: seat.role,
          round,
          assignmentId,
          binding: bound,
          transport: bound.transport,
          invocation: bound.invocation,
          fallbackFrom: bound.provenance?.fallbackFrom ?? null,
          ...(readOnly ? {} : { preExistingInScope }),
          boundAt: new Date().toISOString(),
        });
        persistUnitRecord();
      }
      // What the worktree looks like as this writing seat launches, so a provider limit can tell
      // whether the seat changed it (partial-writes.mjs). Taken again at every launch, a resumed
      // one included: what a person kept before resuming is not this launch's work. A read-only
      // seat is sandboxed and records none, so a change it could not have made never stops it.
      if (!readOnly) {
        try {
          attempts[attemptNo].writeBaseline = worktreeSnapshot({ worktree: unitRecord.worktree, repoRoot: mainRoot });
        } catch (error) {
          attempts[attemptNo].writeBaseline = { error: error.message };
        }
        persistUnitRecord();
      }

      // A writing seat over a merge left open for it is told which files hold the conflicts.
      const objective = `${(rUnit || unit).objective}${readOnly ? '' : syncBrief(unitRecord.sync)}`;
      // Recorded before the dispatch: a controller that dies from here on is resumed from this id.
      const admission = admissionIdentityFor(attempts[attemptNo], { unitRunId, assignmentId, worktree: unitRecord.worktree, assignmentsDir });
      attempts[attemptNo].dispatchRetryId = admission.retryId;
      delete attempts[attemptNo].outcome;
      persistUnitRecord();
      assertNotCancelled();
      const result = await dispatchBound({ bound, seat, round, readOnly, assignmentId, assignmentDir, session, inputs, objective, admission });
      lastResult = result;

      // The worker only writes files; this trusted code, outside the confinement, commits the
      // ones inside the write scope. No change is recorded as such, and a commit that cannot be
      // made fails the round. Paths changed outside the scope are reported, never committed.
      if (!readOnly && result.outcome === 'pass') {
        // A pass whose commit never started is picked up by the resume: the work is on disk, the commit is pending.
        assertNotCancelled();
        const gate = writeGate(result.runResult?.evidence?.changedFiles);
        if (gate) {
          result.outcome = 'policy-refusal';
          result.refused = gate;
        } else {
          const commit = commitWork(rUnit || unit, result.runResult, attempts[attemptNo].preExistingInScope ?? preExistingInScope);
          result.commit = commit;
          attempts[attemptNo].commit = commit;
          if (commit.status === 'failed') result.outcome = 'execution-failure';
        }
      }

      attempts[attemptNo].outcome = result.outcome;
      attempts[attemptNo].runId = result.runResult?.runId ?? null;
      const credentialFault = result.outcome === 'provider-limit' && result.runResult?.classification?.failure?.cause === 'credential';
      if (credentialFault) attempts[attemptNo].failureCause = 'credential';
      persistUnitRecord();

      if (result.outcome !== 'provider-limit') return result;

      // A provider failure first goes to another account of the same provider: the same executor
      // and invocation run again as a new attempt and the lease picks the next ranked account. It
      // stops when no usable account is left, or after as many retries as the provider has
      // accounts (never a loop on one account), and only then does the walk leave the provider.
      let rotationsSpent = 0;
      for (let at = attemptNo; at > 0 && attempts[at]?.fallbackFrom?.kind === 'account-rotation'; at -= 1) rotationsSpent += 1;
      // Two cases end the seat here and leave the decision to a person. A writing seat that already
      // changed the worktree is never run again on top of its own half-done work (checked first, so
      // a pinned seat still names what it changed). And a pinned account is hard: its limit is never
      // answered with another account or executor.
      const stopRetry = (reason, detail, extra = {}) => {
        attempts[attemptNo].retryStopped = { reason, ...extra };
        persistUnitRecord();
        return {
          ...result,
          fallbackExhausted: {
            from: { executor: bound.executor, invocation: bound.invocation, transport: bound.transport },
            reason,
            detail,
            ...extra,
            ...(rotationsSpent > 0 ? { accountRotations: rotationsSpent } : {}),
          },
        };
      };
      const pinned = bound.account ? { accountPinned: `${bound.account.pool}/${bound.account.id}` } : {};
      const baseline = attempts[attemptNo].writeBaseline;
      if (baseline) {
        let changed;
        try {
          if (baseline.error) throw new Error(`no baseline was taken at launch: ${baseline.error}`);
          changed = writesSince(baseline, { worktree: unitRecord.worktree, repoRoot: mainRoot });
        } catch (error) {
          return stopRetry('partial-writes', `could not tell whether the seat changed the worktree (${error.message}), so it is not run again by itself`, { paths: [], ...pinned });
        }
        if (changed.paths.length > 0 || changed.headMoved) {
          const what = [changed.paths.join(', '), changed.headMoved ? 'HEAD moved' : ''].filter(Boolean).join('; ');
          return stopRetry('partial-writes', `the seat changed the worktree before its provider limit (${what}); it is not run again on top of that work: keep, finish or undo the changes, then resume`, { paths: changed.paths, headMoved: changed.headMoved, ...pinned });
        }
      }
      if (bound.account) {
        return stopRetry('account-pinned', `account "${bound.account.pool}/${bound.account.id}" was pinned, so the seat is not moved to another account or executor; pin another account or wait for this one`);
      }
      const rotation = bound.pool ? inspectAccountRotation({ runnerConfig, pool: bound.pool, runtimeDir: options.providerCapacityRuntimeDir }) : null;
      if (mayRotateAccount(rotation, rotationsSpent)) {
        bound = retrySameCandidate(bound, { accountsHealthy: rotation.healthy });
        attemptNo += 1;
        continue;
      }

      if (credentialFault && bound.pool) credentialFaultPoolSet.add(bound.pool);
      // The independence and the spread are read again now: sibling seats may have changed executors
      // since this seat first bound, and a hard `independentOf` must hold for the executor it falls back to.
      // The read, the walk and the publish are one queued step, so two seats whose providers fail at once
      // never both pick their next candidate from the same stale view of each other.
      const current = bound;
      const next = await seatLedger.serialize(() => {
        const candidate = nextCandidate(current, askOf(), bindCtx, 'provider-limit', {
          tried: triedBindingsOf(attempts, attemptNo + 1),
          excludePools: [...credentialFaultPoolSet],
        });
        if (!candidate.refused && candidate.mechanism !== 'inline') seatLedger.note(seatId, candidate.executor);
        return candidate;
      });
      if (next.refused || next.mechanism === 'inline') {
        return {
          ...result,
          fallbackExhausted: {
            from: { executor: bound.executor, invocation: bound.invocation, transport: bound.transport },
            reason: next.refused ? next.refused.reason : 'only-inline-candidate-left',
            detail: next.refused ? next.refused.detail : 'no out-of-process candidate is left to run this seat',
            ...(rotationsSpent > 0 ? { accountRotations: rotationsSpent } : {}),
          },
        };
      }

      bound = next;
      attemptNo += 1;
    }
  };

  // The deterministic check a round ends with: the unit's own `verify`, else its capability's. It
  // runs through the one bounded command runner (goal-check.mjs), for at most `runner.timeoutMs`;
  // running past that is a failed verify that says so, never a hang.
  const verify = async (targetUnit) => {
    assertNotCancelled();
    const runnerConfig = unitRecord.configSnapshot.runner;
    const verifyCmd = verifyCommandOf(targetUnit, runnerConfig);
    if (!verifyCmd) return { pass: true };

    // The verify child borrows the Unit's custody lease, so a controller death cannot free the
    // worktree while it still writes.
    const outcome = await runCommand(verifyCmd, unitRecord.worktree, runnerConfig.timeoutMs, { custody: scope.custody });
    if (outcome.passed) return { pass: true };
    const how = outcome.timedOut
      ? `timed out after ${runnerConfig.timeoutMs}ms`
      : outcome.status === null ? 'could not run' : `exited ${outcome.status}`;
    const tail = outcome.output.trim().split('\n').slice(-20).join('\n');
    return {
      pass: false,
      findings: [`Verification command ${how}: ${verifyCmd}${tail ? `\n${tail}` : ''}`],
    };
  };

  // A caller that passes `{ pattern, params }` is choosing the pattern's params as well as its
  // name, so that object form wins over the unit's own pattern string.
  // A resume runs the pattern its unit.json recorded, never one its caller names now.
  const patternName = options.resumeUnitRunId && unitRecord.pattern
    ? unitRecord.pattern
    : chosenPattern(options, unit);
  unitRecord.pattern = patternName;
  persistUnitRecord();

  // A unit with a syncBase merges it before any seat runs. A refusal, or a sync-only unit whose
  // merge needed no worker, ends the run here; a conflicted merge stays open for the producer.
  if (unitRecord.sync) {
    assertNotCancelled();
    const early = runPendingSync(unitRecord, mainRoot, persistUnitRecord, scope.custody);
    if (early) {
      executionSettled = true;
      settle(early.outcome);
      return { unitRunId, outcome: early.outcome, rounds: 0, results: early.results ?? [], findings: [], sync: syncSummary(unitRecord.sync) };
    }
  }

  const patternResult = await runPattern(patternName, unit, unitRecord.configSnapshot.runner, {
    runRole,
    verify,
    history,
    // A pattern that would start another round asks whether `seats` more launches fit under the ceiling.
    hasLaunchRoom: (seats = 1) => {
      const room = seatLaunchCeiling === null || seatLaunchesUsed(unitRecord) + seats <= seatLaunchCeiling;
      if (!room) scope.ceilingHit = true;
      return room;
    },
  });
  executionSettled = true;
  if (fs.existsSync(path.join(unitDir, 'pending-inline.json'))) {
    unitRecord.execution = { status: 'pending-inline' };
    persistUnitRecord();
  } else {
    settle(patternResult.outcome);
  }

  // A reviewed run with nothing to verify says so: a pass without a verify is not a verified pass.
  const unverified = resolvePattern(patternName).patternName === 'reviewed' && !verifyCommandOf(unit, unitRecord.configSnapshot.runner);
  return {
    unitRunId,
    outcome: patternResult.outcome,
    rounds: patternResult.rounds,
    results: patternResult.results,
    findings: patternResult.findings || [],
    ...(unitRecord.sync ? { sync: syncSummary(unitRecord.sync) } : {}),
    ...(unverified ? { verify: { ran: false, reason: 'no verify command: set unit.verify, pass --verify, or declare capabilities.<capability>.verify' } } : {}),
  };
  } catch (error) {
    // A cancelled run is not a failed one: it stays as a dead controller leaves it, and the resume carries on.
    if (!executionSettled && !(error instanceof RunCancelledError)) {
      // The execution error is what the caller must see; failing to record the settlement is
      // reported beside it, never instead of it.
      try { settle('execution-failure'); }
      catch (settleError) {
        console.warn(`fgos: could not record the failed settlement of unit run "${unitRunId}": ${settleError.message}`);
      }
    }
    throw error;
  }
}

/**
 * Record inline producer run result with once-issued nonce and verified evidence.
 *
 * @param {object} params
 * @param {string} params.unitRunId
 * @param {string} [params.seat] the seat id; `role` is accepted as its older spelling
 * @param {number} params.round
 * @param {string} params.nonce
 * @param {string[]} params.evidenceRefs
 * @param {object} [params.result]
 * @param {string} [params.repoRoot]
 * @returns {{ok: boolean, unitRunId: string, seat: string, round: number}}
 */
export function recordInlineRun(params = {}) {
  const { unitRunId, round, nonce, evidenceRefs, result = {}, repoRoot } = params;
  const seat = params.seat ?? params.role;
  if (!unitRunId || !seat || round === undefined || !nonce) {
    throw new RunnerConfigError('recordInlineRun requires unitRunId, seat, round, and nonce');
  }
  assertSeatId(seat);

  const roots = resolveGitRoots(repoRoot || process.cwd());
  const mainRoot = repoRoot ? path.resolve(repoRoot) : roots.mainCheckoutRoot;
  const unitDir = path.join(mainRoot, '.fgos', 'assignments', unitRunId);
  const pendingFile = path.join(unitDir, 'pending-inline.json');

  if (!fs.existsSync(pendingFile)) {
    throw new RunnerConfigError(`no pending inline run found for unit run "${unitRunId}" (nonce may be expired or already used)`);
  }

  let pending;
  try {
    pending = JSON.parse(fs.readFileSync(pendingFile, 'utf8'));
  } catch (err) {
    throw new RunnerConfigError(`corrupt pending-inline.json for unit run "${unitRunId}": ${err.message}`);
  }

  if (pending.seat !== seat || pending.posture?.inlineAllowed !== true) {
    throw new RunnerConfigError(`recordInlineRun refused: only the seat that was waiting inline may record an inline run, got seat "${seat}"`);
  }

  if (pending.nonce !== nonce) {
    throw new RunnerConfigError('recordInlineRun refused: invalid nonce');
  }

  if (Number(pending.round) !== Number(round)) {
    throw new RunnerConfigError(`recordInlineRun refused: round mismatch (pending ${pending.round}, got ${round})`);
  }

  if (!Array.isArray(evidenceRefs) || evidenceRefs.length === 0) {
    throw new RunnerConfigError('recordInlineRun requires non-empty evidenceRefs');
  }

  const unitJson = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
  const worktree = unitJson.worktree;

  for (const ref of evidenceRefs) {
    const resolvedPath = path.resolve(worktree, ref);
    if (!fs.existsSync(resolvedPath)) {
      throw new RunnerConfigError(`recordInlineRun refused: evidenceRef "${ref}" does not exist on disk at "${resolvedPath}"`);
    }
  }

  // Consume nonce
  fs.unlinkSync(pendingFile);

  // Write settled result
  const attemptDir = path.join(unitDir, seat, String(round), 'runs', '01');
  fs.mkdirSync(attemptDir, { recursive: true });

  const recordPayload = {
    unitRunId,
    seat,
    role: pending.role,
    round,
    recordedAt: new Date().toISOString(),
    binding: pending.binding ?? null,
    evidenceRefs,
    result,
  };
  fs.writeFileSync(path.join(attemptDir, 'result.json'), JSON.stringify(recordPayload, null, 2));
  const { patternName } = resolvePattern(unitJson.pattern ?? unitJson.unit?.pattern ?? 'solo');
  if (patternName === 'solo') {
    unitJson.settlement = { outcome: outcomeOfRunResult(recordPayload), settledAt: recordPayload.recordedAt };
    unitJson.execution = { status: 'settled' };
  } else {
    delete unitJson.settlement;
    unitJson.execution = { status: 'pending' };
  }
  writeJsonAtomic(path.join(unitDir, 'unit.json'), unitJson);
  if (patternName === 'solo') publishUnitSummary(unitDir);

  return {
    ok: true,
    unitRunId,
    seat,
    round,
  };
}
