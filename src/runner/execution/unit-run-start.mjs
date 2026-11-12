// src/runner/execution/unit-run-start.mjs — how a unit run comes to exist: a fresh admission, or a resume
// taken up again from its unit.json. Whatever the caller or the record got wrong is refused here, by name,
// before any seat binds; run.mjs runs the pattern on what this returns.
// Architecture guard: MUST NOT import src/state/**, src/runner/coordination/**, src/runner/worktree.mjs, or src/runner/merge.mjs

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { publishMutableProjection } from '../../native/proof-helpers.mjs';
import { canonicalJson } from '../../native/door.mjs';
import { parseYaml } from '../../util/yaml.mjs';
import { createLockScope } from '../../holder-lock/index.mjs';
import { adoptRun } from '../../run-supervisor/client.mjs';
import { dispatchCwdHolder, dispatchInFlightError, admitSuccessor } from '../../run-supervisor/cwd-lock.mjs';
import { expandGenerated, matchesWriteScope } from '../dispatch/write-scope.mjs';
import { createGitInspect, gitPortOptions } from '../../git/inspect.mjs';
import { shippedCatalog } from '../dispatch/shipped-catalog.mjs';
import { resolveMutatingCwdPosture } from '../dispatch/execution-contract.mjs';
import { declaredOperationFields } from '../dispatch/assignment.mjs';
import { assertRunTimeoutMs, runnerOriginsOf } from '../dispatch/config.mjs';
import { RunnerConfigError } from '../dispatch/runner-config-error.mjs';
import { AgentNotFoundError, resolveAgentDefinition } from '../agent-definitions.mjs';
import { validateUnit, normalizeWorkflowLink } from './unit.mjs';
import { CaseAdmissionRefusedError, PORT_MISSING } from './case-admission-port.mjs';
import { assertPinnedAccountsUsable } from './account-pin.mjs';
import { agentCliMissingRefusal } from './bind.mjs';
import { simulateUnitBindings } from './dry-bind.mjs';
import { assertNoSeatTier, effectiveRigorOf, SeatResolutionError } from './seat-resolver.mjs';
import { isSeatRecord, collaborationOfRecord } from './legacy-seat-read.mjs';
import { loopRunsVerify, paramTableOf } from './loops/index.mjs';
import { resolveCollaboration, CollaborationError } from './patterns/catalog.mjs';
import { commitOnBranch } from './commit-unit-work.mjs';
import { seedSync } from './unit-sync.mjs';
import { resolveUnitInputs } from './handoff-refs.mjs';
import { acquireUnitControl } from './unit-control.mjs';
import { currentAttemptOf, lastAttempts } from './unit-state.mjs';

/**
 * The text of a unit's persona, read once so every attempt and resume renders the same definition. A name
 * no tier defines is rendered by name; a definition that cannot be parsed throws its named problem.
 */
function unitPersonaPin(persona, mainRoot, workflow) {
  if (typeof persona !== 'string') return null;
  try {
    const { name, digest, text, identity } = resolveAgentDefinition(persona, { projectRoot: mainRoot, workflow });
    return { name, digest, text, identity };
  } catch (err) {
    if (err instanceof AgentNotFoundError) return null;
    throw err;
  }
}

/** A resume cannot go past a commit that landed holding paths outside the unit's write scope. */
function assertNoStrayCommit(unitRunId, unitRecord, mainRoot) {
  for (const attempt of lastAttempts(unitRecord)) {
    const commit = attempt.commit;
    if (commit?.status !== 'failed' || commit.reason !== 'committed-set-mismatch' || !commit.sha) continue;
    if (!commitOnBranch(unitRecord.worktree, commit.sha, mainRoot)) continue;
    const diff = [...(commit.unexpected ?? []).map((p) => `+${p}`), ...(commit.missing ?? []).map((p) => `-${p}`)].join(', ');
    throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": commit ${commit.sha} is already on the branch but does not hold exactly the files of its write scope (${diff}; + is outside the scope, - is missing); inspect it and take it off the branch by hand (git reset HEAD~1 keeps its files in the worktree), then resume`);
  }
}

/** An attempt handed to a supervisor whose controller went away before recording its outcome. */
export function leftByDeadController(attempt, assignmentsDir) {
  if (!attempt || attempt.outcome !== undefined || typeof attempt.assignmentId !== 'string') return false;
  const prior = currentAttemptOf(assignmentsDir, attempt.assignmentId);
  return prior !== null && fs.existsSync(path.join(prior.dir, 'envelope.json'));
}

/** The newest `seatSchema` this release resumes (it writes 2); a later one came from a newer release. */
const KNOWN_SEAT_SCHEMA = 2;

function assertRecordNotFromNewerRelease(unitRunId, unitRecord) {
  const schema = unitRecord?.seatSchema;
  if (schema === undefined || schema === null || (typeof schema === 'number' && schema <= KNOWN_SEAT_SCHEMA)) return;
  throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": unit.json field seatSchema is ${JSON.stringify(schema)}, written by a newer release than this one; resume it with that release`, { code: 'record-from-newer-release' });
}

/** The collaboration pin a resume runs under, refused by name when it cannot be read or names nothing registered. */
function assertCollaborationPinUsable(unitRunId, collaboration, configSnapshot, liveCfg) {
  const refuse = (why) => new RunnerConfigError(`cannot resume unit run "${unitRunId}": collaboration pin ${why}`, { code: 'collaboration-pin-unusable' });
  if (!collaboration || typeof collaboration !== 'object') throw refuse('is unreadable');
  const pattern = collaboration.pattern?.name;
  if (!pattern || typeof pattern !== 'string') throw refuse('has invalid pattern name');
  const effective = collaboration.effective;
  if (!effective || typeof effective !== 'object') throw refuse('has invalid effective block');
  if (typeof effective.loop !== 'string' || !paramTableOf(effective.loop)) throw refuse(`names unregistered loop "${effective.loop}"`);
  if (effective.params === null || typeof effective.params !== 'object' || Array.isArray(effective.params)) throw refuse('has invalid effective params');
  const registered = [shippedCatalog()?.patterns, configSnapshot?.runner?.patterns, liveCfg?.patterns ?? liveCfg?.runner?.patterns];
  if (!registered.some((patterns) => Object.hasOwn(patterns ?? {}, pattern))) throw refuse(`names unregistered pattern "${pattern}"`);
}

/**
 * A resume never starts a second agent over an attempt the previous controller left: only a closed one (asked
 * of the adopt door, read-only) is carried on from; a live or pre-supervisor one is refused by name.
 */
function assertAttemptsResumable(unitRunId, unitRecord, assignmentsDir) {
  for (const attempt of lastAttempts(unitRecord)) {
    if (!leftByDeadController(attempt, assignmentsDir)) continue;
    const prior = currentAttemptOf(assignmentsDir, attempt.assignmentId);
    const { state } = adoptRun(prior.dir, { probeOnly: true });
    if (state === 'closed') continue;
    const look = 'fgos dispatch inspect';
    if (state === 'legacy-run') {
      throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": attempt "${prior.runId}" ran before the run supervisor and cannot be judged (${prior.dir}); look with \`${look}\``, { code: 'attempt-legacy-run' });
    }
    throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": attempt "${prior.runId}" is still ${state} (${prior.dir}); look with \`${look}\` and resume once it has closed`, { code: 'attempt-still-running', attemptState: state });
  }
}

/**
 * The operation fields every producer assignment carries, checked before dispatch: one the step declares,
 * never human-only, its mutation agreeing with the write scope, and the unit runs `solo`.
 */
function declaredOperationOf(declared, unit, loop, { taskSpecRoot } = {}) {
  if (!declared || typeof declared !== 'object') throw new RunnerConfigError('runUnit: declared must be an object');
  for (const key of ['workId', 'domain', 'stage', 'operation']) {
    if (typeof declared[key] !== 'string' || !declared[key].trim()) throw new RunnerConfigError(`runUnit: declared.${key} must be a non-empty string`);
  }
  if (!Array.isArray(declared.operations)) throw new RunnerConfigError('runUnit: declared.operations must be the step\'s operations');
  const { domain, stage, operation, operations } = declared;
  const fields = declaredOperationFields({ domain, workflow: declared.workflow ?? null, stage, operation, operations, taskSpecRoot });
  if (fields.dispatch === 'human-only') throw new RunnerConfigError(`runUnit: operation "${declared.operation}" is human-only and is never dispatched`);
  const unitReadOnly = (unit.writes ?? []).length === 0;
  if ((fields.mutation === 'read-only') !== unitReadOnly) {
    throw new RunnerConfigError(`runUnit: operation "${declared.operation}" is ${fields.mutation} but the unit ${unitReadOnly ? 'writes nothing' : 'declares writes'}`);
  }
  if (loop !== 'solo') throw new RunnerConfigError(`runUnit: a unit carrying operation "${declared.operation}" runs solo, not "${loop}"`);
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

/**
 * The branch a writing Unit builds on, as its caller knows it: `{ branch, baseSha, outOfScopeOnBranch }`, where the
 * paths are what the base Unit's own branch carries outside its scope (inherited by this one) and `branch` and
 * `baseSha` are null when the caller has no base to compare with. Anything else is refused before the run.
 */
function checkedBranchBase(value) {
  if (value === undefined) return null;
  const named = (v) => typeof v === 'string' && v.trim() !== '';
  const refuse = () => new RunnerConfigError('runUnit: branchBase must be { branch, baseSha, outOfScopeOnBranch } with branch and baseSha both names or both null', { phase: 'pre-admission' });
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw refuse();
  const { branch, baseSha, outOfScopeOnBranch } = value;
  const paired = (named(branch) && named(baseSha)) || (branch === null && baseSha === null);
  if (!paired || !Array.isArray(outOfScopeOnBranch) || !outOfScopeOnBranch.every(named)) throw refuse();
  return { branch, baseSha, outOfScopeOnBranch: [...new Set(outOfScopeOnBranch)].sort() };
}

/**
 * The paths the Unit's branch carries outside its write scope since its base: every commit on it counts, a resumed
 * round's or one the producer made itself. Inspect returns literal path bytes, so a name Git would quote
 * (non-ASCII, spaces) is matched as it is. The scope is the one the run recorded (`writes` widened to generated
 * render targets). Throws when the branch cannot be compared with its base.
 *
 * @returns {string[]} sorted; empty when the Unit has no base to compare with
 */
export function branchPathsOutsideScope(unitRecord, mainRoot) {
  const { branch, baseSha } = unitRecord.branchBase ?? {};
  if (!branch || !baseSha) return [];
  const inspect = createGitInspect(gitPortOptions(mainRoot));
  const tip = inspect.resolveCommit({ name: branch });
  if (!tip) throw new RunnerConfigError('cannot resolve writing branch');
  const scope = unitRecord.writeScope ?? unitRecord.unit.writes;
  const outside = new Set();
  let cursor;
  do {
    const page = inspect.diff({ before: baseSha, after: tip, cursor, maxEntries: 4096 });
    for (const entry of page.entries) {
      const file = Buffer.from(entry.path).toString();
      if (!matchesWriteScope(file, scope)) outside.add(file);
    }
    cursor = page.nextCursor;
  } while (cursor);
  return [...outside].sort();
}

const portMissing = () => new RunnerConfigError('runUnit: a Unit that writes (or names a case) needs the case admission port in options.caseAdmission; none was given', { code: PORT_MISSING });

/** A standalone writing run needs the affirmative `unbound`; every other answer, a missing view included, refuses. */
function requireFreeWorktree(port, worktree) {
  const binding = port.resolveBinding({ worktree });
  if (binding?.answer === 'unbound') return;
  const answer = binding?.answer ?? 'binding-view-unavailable';
  const owner = binding?.record?.caseId ? ` (case ${binding.record.caseId})` : '';
  throw new CaseAdmissionRefusedError({ code: answer, condition: binding?.condition ?? `worktree ${worktree} is not free for a run that names no case: ${answer}${owner}` });
}

const ACCOUNT_PIN_MODES = ['strict', 'where-served'];

/**
 * Refuse, before a unit run exists, what the calling door has no authority for (accepting a dependence, a
 * tier raised by an override or its persona: no door is authorized yet) and a pinned account that no seat
 * takes (unless the caller asked `accountPin: 'where-served'`), that a seat it applies to refuses, or that is
 * quarantined now. A pin never moves a seat to another pool: `strict`, the default, refuses a run whose pin no
 * seat takes; `where-served` runs such a unit unpinned and each seat's provenance keeps why.
 */
async function assertDoorChoicesBeforeRun(unit, runnerConfig, options, collaboration, herdrPresent) {
  const noAgentCli = agentCliMissingRefusal(runnerConfig, options.session ?? {});
  if (noAgentCli) throw new RunnerConfigError(`${noAgentCli.reason}: ${noAgentCli.detail}; ${noAgentCli.fix}`, { code: noAgentCli.reason, phase: 'pre-admission' });
  if (options.accountPin !== undefined && !ACCOUNT_PIN_MODES.includes(options.accountPin)) {
    throw new RunnerConfigError(`accountPin must be one of ${ACCOUNT_PIN_MODES.join(', ')}, got ${JSON.stringify(options.accountPin)}`, { phase: 'pre-admission' });
  }
  const overrides = options.overrides ?? [];
  const objects = overrides.filter((o) => o && typeof o === 'object');
  if (options.raiseAuthorized !== true && objects.some((o) => o.acceptDependence === true)) {
    throw new RunnerConfigError(
      'dependence-acceptance-unauthorized: accepting a dependence between seats needs an authorized door; no door of this release is authorized, so every seat keeps the independence its pattern asks for',
      { code: 'dependence-acceptance-unauthorized', phase: 'pre-admission' },
    );
  }
  const pinsAccount = objects.some((o) => o.account !== undefined);
  const mayRaise = objects.some((o) => o.tier !== undefined) || objects.some((o) => o.persona !== undefined);
  if (!pinsAccount && !mayRaise) return;
  const { seats } = await simulateUnitBindings(unit, runnerConfig, {
    session: { herdrPresent: herdrPresent(), ...(options.session ?? {}) },
    overrides,
    raiseAuthorized: options.raiseAuthorized === true,
    workflowId: options.workflowId,
    collaboration: collaboration ?? options.collaboration,
  });
  const unauthorized = seats.find((r) => r.refused?.reason === 'tier-escalation-unauthorized');
  if (unauthorized) {
    throw new RunnerConfigError(`tier-escalation-unauthorized: ${unauthorized.refused.detail}`, { code: 'tier-escalation-unauthorized', phase: 'pre-admission' });
  }
  if (!pinsAccount) return;
  const refused = seats.find((r) => r.refused?.reason?.startsWith('account-pin'));
  if (refused) throw new RunnerConfigError(`cannot pin the account for seat "${refused.seat}": ${refused.refused.detail}`);
  if (!seats.some((r) => r.account)) {
    if (options.accountPin === 'where-served') return;
    const why = seats.filter((r) => r.accountSkipped).map((r) => `seat "${r.seat}": ${r.accountSkipped.detail}`);
    throw new RunnerConfigError(`the pinned account applies to no seat of this unit${why.length ? ` (${why.join('; ')})` : ': no seat its override names binds here'}`);
  }
  assertPinnedAccountsUsable(seats, { runnerConfig, runtimeDir: options.providerCapacityRuntimeDir, what: 'cannot start the unit run' });
}

/** Whether a unit changes its worktree: it declares writes, or it merges a sync base. */
export const writesWorktree = (unit, sync) => unit.writes.length > 0 || Boolean(sync);

const sharedCwdRefusal = (cwd, unit) => Object.assign(
  new RunnerConfigError('--force-shared-cwd cannot be used with writes', { code: 'custody-required' }),
  { cwd, executorId: null, capability: unit.capability },
);

/** `unit.json` read back for a resume; a file that does not parse is refused by name, never a bare SyntaxError. */
function readUnitRecord(unitRunId, unitJsonPath) {
  try {
    return JSON.parse(fs.readFileSync(unitJsonPath, 'utf8'));
  } catch (error) {
    throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": unit-record-unreadable: ${unitJsonPath} (${error.message})`, { code: 'unit-record-unreadable', path: unitJsonPath });
  }
}

/** A unit given as data, or read from a file or stdin (JSON first, else YAML). */
function readUnitSource(options) {
  if (options.unitData) return options.unitData;
  if (!options.unitPath) throw new RunnerConfigError('runUnit requires --unit <file|-> or unitData');
  const fromStdin = options.unitPath === '-';
  const content = fs.readFileSync(fromStdin ? 0 : path.resolve(options.unitPath), 'utf8');
  try {
    return JSON.parse(content);
  } catch {
    return parseYaml(content, { filename: fromStdin ? '<stdin>' : options.unitPath });
  }
}

/** A unit run taken up again from its `unit.json`, under one controller; whatever makes it unsafe is refused by name. */
export function loadResumedUnit({ options, scope, mainRoot, worktreePath, port, assignmentsDir, liveConfig, withAccounts, snapshot, assertRepository }) {
  const unitRunId = options.resumeUnitRunId;
  const unitDir = path.join(assignmentsDir, unitRunId);
  const unitJsonPath = path.join(unitDir, 'unit.json');
  if (!fs.existsSync(unitJsonPath)) {
    throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": unit.json not found at "${unitJsonPath}"`);
  }
  // A record keyed by role name (before seats) stays readable but is never resumed.
  if (!isSeatRecord(readUnitRecord(unitRunId, unitJsonPath))) {
    throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": record-predates-seat-binding (its seats were keyed by role name; start the work again as a new unit run)`, { code: 'record-predates-seat-binding' });
  }
  // One controller per unit (a dead one is taken over), taken before unit.json is read so the record is current.
  const control = acquireUnitControl(unitDir, unitRunId);
  if (control.status !== 'acquired') {
    throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": another controller drives it${control.holder?.pid ? ` (PID ${control.holder.pid})` : ''}`, { code: 'resume-in-progress' });
  }
  scope.control = control;
  const unitRecord = readUnitRecord(unitRunId, unitJsonPath);
  assertRecordNotFromNewerRelease(unitRunId, unitRecord);
  // The caller knows the base as it is now; a resume without one keeps what the run recorded.
  const branchBase = checkedBranchBase(options.branchBase);
  if (branchBase) unitRecord.branchBase = branchBase;
  let runnerConfigForLoop;
  if (unitRecord.collaboration) {
    assertCollaborationPinUsable(unitRunId, unitRecord.collaboration, unitRecord.configSnapshot, liveConfig());
    runnerConfigForLoop = unitRecord.configSnapshot?.runner ?? {};
  } else {
    const decoded = collaborationOfRecord(unitRecord, { shipped: shippedCatalog() });
    unitRecord.collaboration = decoded.collaboration;
    runnerConfigForLoop = decoded.runner;
    if (unitRecord.configSnapshot) unitRecord.configSnapshot.runner = decoded.runner;
  }
  const unit = validateUnit(unitRecord.unit);
  const writing = writesWorktree(unit, unitRecord.sync);
  assertRepository(writing);
  // A writing run is never resumed without the port, and a standalone one only into a free worktree.
  const resumeLink = normalizeWorkflowLink(unitRecord.workflow);
  if (writing) {
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

  // A resume binds from the config as it is now; attempts bound earlier keep the hash they were bound from.
  const currentSnapshot = snapshot();
  if (currentSnapshot.hash !== unitRecord.configSnapshot?.hash) {
    for (const attempts of Object.values(unitRecord.bindings ?? {})) {
      for (const attempt of attempts) attempt.configHash ??= unitRecord.configSnapshot?.hash;
    }
    const frozenLoops = runnerConfigForLoop?.loops ?? unitRecord.configSnapshot?.runner?.loops;
    const frozenPatterns = runnerConfigForLoop?.patterns ?? unitRecord.configSnapshot?.runner?.patterns;
    const frozen = { ...(frozenLoops ? { loops: frozenLoops } : {}), ...(frozenPatterns ? { patterns: frozenPatterns } : {}) };
    unitRecord.configSnapshot = { ...currentSnapshot, runner: { ...currentSnapshot.runner, ...frozen } };
    runnerConfigForLoop = unitRecord.configSnapshot.runner;
  }

  // A live dispatch-cwd holder means a worker still runs in this worktree.
  const cwdHolder = dispatchCwdHolder(path.join(mainRoot, '.fgos'), worktreePath);
  if (cwdHolder) throw dispatchInFlightError(worktreePath, cwdHolder);
  assertNoStrayCommit(unitRunId, unitRecord, mainRoot);
  assertPinnedAccountsUsable(lastAttempts(unitRecord).filter((a) => a.outcome !== 'pass').map((a) => a.binding ?? {}), {
    runnerConfig: withAccounts(unitRecord.configSnapshot?.runner ?? {}),
    runtimeDir: options.providerCapacityRuntimeDir,
    what: `cannot resume unit run "${unitRunId}"`,
  });
  const declaredOp = unitRecord.declared ? declaredOperationOf(unitRecord.declared, unit, unitRecord.collaboration?.effective?.loop ?? unitRecord.pattern) : null;
  if (writing) {
    if (options.forceSharedCwd === true) throw sharedCwdRefusal(unitRecord.worktree, unit);
    scope.custody = admitSuccessor(createLockScope('unit-custody'), path.join(mainRoot, '.fgos'), unitRecord.worktree);
  }
  return { unit, unitRunId, unitRecord, declaredOp, runnerConfigForLoop };
}

/** A new unit run: checked, admitted and in custody before its directory and first `unit.json` exist. */
export async function admitFreshUnit({ options, scope, mainRoot, worktreePath, caseRef, port, assignmentsDir, liveConfig, withAccounts, snapshot, assertRepository, herdrPresent }) {
  if (options.declared === undefined && options.pinInputs !== undefined) throw new RunnerConfigError('runUnit: pinInputs needs declared');
  const raw = readUnitSource(options);
  // A seat's tier is a recommendation only a registered workflow may make, never a unit file.
  if (!options.unitData) assertNoSeatTier(raw?.seats, 'a unit file');
  const unit = validateUnit(options.stanceOptions === undefined ? raw : { ...raw, stanceOptions: options.stanceOptions });
  assertRepository(writesWorktree(unit, unit.syncBase));

  let collaboration;
  try {
    collaboration = resolveCollaboration({
      unit,
      selectors: {
        callerObject: typeof options.pattern === 'object' && options.pattern !== null ? options.pattern : null,
        callerString: typeof options.pattern === 'string' && options.pattern ? options.pattern : null,
        activityUnit: options.activityUnit,
      },
      request: options.request ?? null,
      inCase: Boolean(caseRef),
      reason: caseRef?.reason ?? options.reason ?? options.request?.reason ?? null,
      runnerConfig: liveConfig(),
      shipped: shippedCatalog(),
      origins: options.runnerConfig ? null : runnerOriginsOf(liveConfig()),
    });
  } catch (err) {
    if (err instanceof CollaborationError || err instanceof SeatResolutionError) throw new RunnerConfigError(err.message, { code: err.code, phase: 'pre-admission' });
    throw err;
  }
  const loop = collaboration.pin.effective.loop;
  const explicitVerify = [options.verify, unit.verify].some((v) => typeof v === 'string' && v.trim());
  if (!loopRunsVerify(loop) && explicitVerify) {
    throw new RunnerConfigError(
      `runUnit: loop "${loop}" has no verify checkpoint; pass no --verify or set no unit.verify, or use a loop that verifies (solo, reviewed)`,
      { code: 'verify-command-unsupported', phase: 'pre-admission' },
    );
  }
  // An operation the step does not allow is refused against the loop the run will use.
  const declaredOp = options.declared !== undefined ? declaredOperationOf(options.declared, unit, loop, { taskSpecRoot: mainRoot }) : null;
  // Policy wins before seedSync or preflight can touch a native Git port or borrow custody.
  if (unit.writes.length > 0 && resolveMutatingCwdPosture(worktreePath).reason === 'main-checkout') {
    throw new RunnerConfigError(`runUnit refused -- cwd "${worktreePath}" resolves to the main checkout ("${mainRoot}"); a mutating dispatch must run in a linked git worktree, never the main checkout`);
  }
  const pinInputs = options.declared !== undefined ? checkedPinInputs(options.pinInputs) : [];
  const acceptedReports = checkedAcceptedReports(options.acceptedReports);
  const branchBase = checkedBranchBase(options.branchBase);
  // A run timeout in an override is checked before the unit run exists (bind() checks it again).
  for (const ov of options.overrides ?? []) {
    if (ov && typeof ov === 'object' && ov.timeoutMs !== undefined) assertRunTimeoutMs(ov.timeoutMs, 'override timeoutMs');
  }
  const configSnapshot = snapshot();
  await assertDoorChoicesBeforeRun(unit, withAccounts(configSnapshot.runner), options, collaboration, herdrPresent);
  // A sync ref is resolved to its commit once, before the run exists; a resume merges that commit.
  const sync = seedSync(unit, { worktree: worktreePath, mainRoot });
  const writing = writesWorktree(unit, sync);
  if (writing && options.forceSharedCwd === true) throw sharedCwdRefusal(worktreePath, unit);
  // Custody of a writing run first, so a busy worktree refuses before any reservation exists; then admission, then the unit directory.
  // A standalone writing run goes only into a free worktree.
  if ((writing || caseRef) && !port) throw portMissing();
  const unitRunId = `unit-run-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  if (writing && !caseRef) requireFreeWorktree(port, worktreePath);
  if (writing) scope.custody = admitSuccessor(createLockScope('unit-custody'), path.join(mainRoot, '.fgos'), worktreePath);
  let admittedCeiling = null;
  if (caseRef) {
    const reason = caseRef.reason ?? options.reason ?? options.request?.reason ?? null;
    const admitted = port.admit({
      unitRunId,
      caseRef: { ...caseRef, ...(reason ? { reason } : {}) },
      activity: caseRef.activity,
      writes: unit.writes,
      worktree: fs.realpathSync(worktreePath),
      readOnly: !writing,
      pattern: collaboration.pin.pattern.name,
      seatLaunches: collaboration.launchBound,
      blind: unit.blind === true,
      handoffRefs: unit.inputs,
      // The rigor the seats will bind at (the unit's own or its capability's, the stronger).
      rigor: effectiveRigorOf(unit, configSnapshot.runner),
      reason,
    });
    if (admitted.refused) throw new CaseAdmissionRefusedError(admitted.refused);
    scope.admission = { port, caseId: admitted.caseId, reservationId: admitted.reservationId, unitRunId, started: false, settled: false };
    admittedCeiling = admitted.seatLaunchCeiling ?? null;
    options.onCaseAdmitted?.({ caseId: admitted.caseId, reservationId: admitted.reservationId });
  }
  const unitDir = path.join(assignmentsDir, unitRunId);
  const personaPin = unitPersonaPin(unit.persona, mainRoot, options.personaScope);
  let resolved;
  try {
    // A blind unit's roles each get their copies in their own directory at dispatch, so nothing is copied here.
    resolved = resolveUnitInputs(unit.inputs, mainRoot, {
      accept: acceptedReports,
      ...(unit.blind
        ? { blind: true, anonymize: unit.anonymizeInputs === true }
        : unit.anonymizeInputs ? { anonymizeInto: path.join(unitDir, 'inputs') } : {}),
    });
  } catch (err) {
    fs.rmSync(unitDir, { recursive: true, force: true });
    throw err;
  }
  const declared = options.declared;
  const unitRecord = {
    unit,
    seatSchema: 2,
    seats: collaboration.seats,
    ...(typeof options.workflowId === 'string' && options.workflowId ? { workflowId: options.workflowId } : {}),
    workflow: scope.admission ? normalizeWorkflowLink({ caseId: scope.admission.caseId, activity: caseRef.activity, reservationId: scope.admission.reservationId }) : null,
    ...(admittedCeiling !== null ? { seatLaunchCeiling: admittedCeiling } : {}),
    collaboration: {
      ...collaboration.pin,
      pattern: { ...collaboration.pin.pattern, digest: crypto.createHash('sha256').update(canonicalJson(collaboration.entry)).digest('hex') },
    },
    pattern: collaboration.pin.pattern.name,
    overrides: options.overrides || [],
    configSnapshot,
    // Widened once to the render targets of generated sources; a resume reads it back, never recomputes it.
    writeScope: expandGenerated(unit.writes, configSnapshot.runner.generatedPaths ?? []),
    ...(personaPin ? { personaPin } : {}),
    ...(branchBase ? { branchBase } : {}),
    resolvedInputs: resolved.refs,
    ...(acceptedReports.length > 0 ? { acceptedReports } : {}),
    // Which input each neutral name stands for; only the owner reads this, never a role.
    ...(unit.anonymizeInputs || unit.blind ? { inputMap: resolved.inputMap } : {}),
    worktree: fs.realpathSync(worktreePath),
    ...(sync ? { sync } : {}),
    // The Work step operation and the files its verdict is bound to; a resume reads them back from here.
    ...(declared !== undefined ? {
      declared: {
        workId: declared.workId, ...(declared.title ? { title: declared.title } : {}), domain: declared.domain,
        ...(declared.workflow ? { workflow: declared.workflow } : {}), stage: declared.stage, operation: declared.operation, operations: declared.operations,
      },
      pinInputs,
    } : {}),
    createdBy: process.env.USER || 'system',
    createdAt: new Date().toISOString(),
    execution: { status: 'running' },
  };
  publishMutableProjection(path.join(unitDir, 'unit.json'), unitRecord);
  if (scope.admission) scope.admission.started = true;
  const control = acquireUnitControl(unitDir, unitRunId);
  if (control.status !== 'acquired') throw new RunnerConfigError(`unit run "${unitRunId}" is already driven by another controller`, { code: 'resume-in-progress' });
  scope.control = control;
  // Told once, before any seat starts, so a caller can record the id to resume a run that dies.
  options.onUnitRunCreated?.(unitRunId);
  return { unit, unitRunId, unitRecord, declaredOp, runnerConfigForLoop: null };
}
