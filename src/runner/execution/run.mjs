// src/runner/execution/run.mjs — Single execution door (fgos run) and verifiable mutating gate
// Architecture guard: MUST NOT import src/state/**, src/runner/coordination/**, src/runner/worktree.mjs, or src/runner/merge.mjs (A4 boundary)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, execSync } from 'node:child_process';

import { validateUnit, normalizeWorkflowLink } from './unit.mjs';
import { expandGenerated, partitionPaths } from '../dispatch/write-scope.mjs';
import { bind, nextCandidate, retrySameCandidate, getProviderFamily } from './bind.mjs';
import { credentialFaultFamilies, inspectAccountRotation, mayRotateAccount } from './account-rotation.mjs';
import { createRoleExecutorLedger } from './role-ledger.mjs';
import { runPattern } from './patterns/index.mjs';
import { resolvePattern } from './patterns/presets.mjs';
import { executeAssignment } from '../dispatch/assignment-runner.mjs';
import { createCredentialProbe } from '../dispatch/provider-credential-probe.mjs';
import { ensureRunnerConfigForDir, RunnerConfigError } from '../dispatch/config.mjs';
import { commitOnBranch, commitUnitWork, foreignIndexDetail, preflightUnitWorktree } from './commit-unit-work.mjs';
import { dispatchLockFile, parseCompositePidIdentity } from '../main-checkout-lock.mjs';
import { reportRefsOf, resolveUnitInputs, copyHandoffsInto, refIsHiddenFromBlind, plainInputName, isSeatInput } from './handoff-refs.mjs';
import { outcomeOfRunResult, readUnitRunHistory } from './unit-run-history.mjs';
import { writeUnitSummary } from './unit-summary.mjs';
import { reapOrphanedConfinementResources, resolveConfinementTempRoot, createConfinementCredentialRenewal } from '../dispatch/confinement/cleanup.mjs';
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
 * `{ personaPin }` for an assignment policy when an override scoped to this very role bound `persona`
 * with pinned text, else nothing. Matching on role and name keeps one role's pin from reaching another
 * role that happens to resolve the same persona name from the capability.
 */
function pinnedPersonaFor(overrides, role, persona) {
  const hit = (overrides ?? []).find((o) => o?.personaPin && o.scope?.role === role && o.persona === persona);
  return hit ? { personaPin: hit.personaPin } : {};
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
export function snapshotRunnerConfig(mainCheckoutRoot) {
  const cfg = ensureRunnerConfigForDir(mainCheckoutRoot);
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

/** The last attempt of each role/round: the one a resume continues from. */
function lastAttempts(unitRecord) {
  return Object.values(unitRecord.bindings ?? {}).map((attempts) => attempts[attempts.length - 1]).filter(Boolean);
}

/**
 * A producer attempt whose agent turn passed but whose runner commit failed: a resume commits it
 * again without spawning the agent. Not when the failed commit is still on the branch carrying
 * paths outside the scope; a person has to take that commit off first.
 */
function commitPending(attempt, worktree, mainRoot) {
  const commit = attempt?.commit;
  if (commit?.status !== 'failed') return false;
  return !(commit.reason === 'committed-set-mismatch' && commit.sha && commitOnBranch(worktree, commit.sha, mainRoot));
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

function foreignIndexRefusal(role, round, paths) {
  return {
    outcome: 'policy-refusal',
    role,
    round,
    refused: { reason: 'foreign-staged-index', detail: foreignIndexDetail(paths), paths },
  };
}

/**
 * Main headless unit execution entrypoint.
 *
 * @param {object} options
 * @param {string} [options.unitPath] Path to unit YAML/JSON file or '-' for stdin
 * @param {object} [options.unitData] Raw unit object (in-memory)
 * @param {string} [options.pattern] Pattern name or preset
 * @param {Array} [options.overrides] Array of overrides [{scope, origin, executor, invocation, tier, persona}]
 * @param {string} [options.resumeUnitRunId] Unit run ID to resume
 * @param {string} [options.repoRoot] Main repository root
 * @param {string} [options.cwd] Current working directory / worktree
 * @param {string} [options.worktree] Explicit worktree path
 * @param {object} [options.session] Session context { provider, tier, hasNativeAgent, herdrPresent, headless }
 * @param {Function} [options.onLog] Log callback
 * @returns {Promise<{unitRunId: string, outcome: string, rounds: number, results: Array}>}
 */
export async function runUnit(options = {}) {
  if (options.resumeUnitRunId && options.stanceOptions !== undefined) {
    throw new RunnerConfigError('cannot provide stanceOptions when resuming a unit run: the stored question is immutable');
  }
  // Private homes left by an earlier run (a failed round that kept its pane)
  // hold a copy of an account login; `fgos run` is the one door every such run
  // goes through, so it is also where the ones whose pane has since closed are
  // reclaimed. Best effort: a reap problem never blocks the run.
  try { reapOrphanedConfinementResources({ tempRoot: resolveConfinementTempRoot() }); } catch { /* best effort */ }

  const cwd = options.cwd ?? process.cwd();
  const roots = resolveGitRoots(cwd);
  const mainRoot = options.repoRoot ? path.resolve(options.repoRoot) : roots.mainCheckoutRoot;
  const worktreePath = options.worktree ? path.resolve(options.worktree) : roots.worktreeRoot;
  const workflowLink = normalizeWorkflowLink(options.workflow);

  let unit;
  let unitRunId;
  let unitRecord;
  const assignmentsDir = path.join(mainRoot, '.fgos', 'assignments');

  if (options.resumeUnitRunId) {
    unitRunId = options.resumeUnitRunId;
    const unitDir = path.join(assignmentsDir, unitRunId);
    const unitJsonPath = path.join(unitDir, 'unit.json');
    if (!fs.existsSync(unitJsonPath)) {
      throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": unit.json not found at "${unitJsonPath}"`);
    }
    unitRecord = JSON.parse(fs.readFileSync(unitJsonPath, 'utf8'));
    unit = validateUnit(unitRecord.unit);
    if (!Array.isArray(unitRecord.resolvedInputs)) {
      throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": unit.json has no resolvedInputs`);
    }

    // A mutating dispatch holds `.fgos/dispatch--<cwd>.lock` with a composite
    // "pid:acquiredAtMs:rand" identity while its worker runs; resuming under a
    // live holder would launch a second worker into the same worktree.
    const lockPath = path.join(mainRoot, '.fgos', dispatchLockFile(worktreePath));
    let holder;
    try {
      holder = JSON.parse(fs.readFileSync(lockPath, 'utf8'))?.pid;
    } catch {
      holder = undefined;
    }
    const pid = Number.isInteger(holder) ? holder : parseCompositePidIdentity(holder)?.pid;
    if (Number.isInteger(pid) && pid > 0) {
      let alive;
      try {
        process.kill(pid, 0);
        alive = true;
      } catch (err) {
        alive = err.code === 'EPERM';
      }
      if (alive) {
        throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": another process (PID ${pid}) holds lock at "${lockPath}"`);
      }
    }
    assertNoStrayCommit(unitRunId, unitRecord, mainRoot);
  } else {
    let raw;
    if (options.unitData) {
      raw = options.unitData;
    } else if (options.unitPath === '-') {
      const stdinContent = fs.readFileSync(0, 'utf8');
      try {
        raw = JSON.parse(stdinContent);
      } catch {
        const YAML = await import('yaml');
        raw = (YAML.default || YAML).parse(stdinContent);
      }
    } else if (options.unitPath) {
      const content = fs.readFileSync(path.resolve(options.unitPath), 'utf8');
      try {
        raw = JSON.parse(content);
      } catch {
        const YAML = await import('yaml');
        raw = (YAML.default || YAML).parse(content);
      }
    } else {
      throw new RunnerConfigError('runUnit requires --unit <file|-> or unitData');
    }

    unit = validateUnit(options.stanceOptions === undefined ? raw : { ...raw, stanceOptions: options.stanceOptions });
    // Resolved before the unit directory exists, so a ref that points nowhere leaves nothing behind.
    unitRunId = `unit-run-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const unitDir = path.join(assignmentsDir, unitRunId);
    let resolved;
    try {
      // A blind unit's roles each get their copies in their own directory at dispatch, so nothing is copied here.
      resolved = resolveUnitInputs(
        unit.inputs,
        mainRoot,
        unit.blind
          ? { blind: true, anonymize: unit.anonymizeInputs === true }
          : unit.anonymizeInputs ? { anonymizeInto: path.join(unitDir, 'inputs') } : {},
      );
    } catch (err) {
      fs.rmSync(unitDir, { recursive: true, force: true });
      throw err;
    }
    fs.mkdirSync(unitDir, { recursive: true });

    const configSnapshot = snapshotRunnerConfig(mainRoot);
    unitRecord = {
      unit,
      workflow: workflowLink,
      pattern: options.pattern ?? unit.pattern ?? 'solo',
      overrides: options.overrides || [],
      configSnapshot,
      // The scope this run may write, widened once to the render targets of generated sources it
      // touches. A resumed run reads it back and never recomputes it against a changed config.
      writeScope: expandGenerated(unit.writes, configSnapshot.runner.generatedPaths ?? []),
      resolvedInputs: resolved.refs,
      // Which input each neutral name stands for; only the owner reads this, never a role.
      ...(unit.anonymizeInputs || unit.blind ? { inputMap: resolved.inputMap } : {}),
      worktree: fs.realpathSync(worktreePath),
      createdBy: process.env.USER || 'system',
      createdAt: new Date().toISOString(),
      execution: { status: 'running' },
    };

    fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(unitRecord, null, 2));
    // Told once, as soon as the run exists and before any seat can start, so a caller can record
    // the id and resume this run if it dies. Not called for a resumed run: its id is already known.
    options.onUnitRunCreated?.(unitRunId);
  }

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
  const pendingCommitKeys = () => new Set(Object.entries(unitRecord.bindings ?? {})
    .filter(([, attempts]) => commitPending(attempts[attempts.length - 1], unitRecord.worktree, mainRoot))
    .map(([key]) => key));
  const history = () => {
    const pending = pendingCommitKeys();
    return readUnitRunHistory(unitDir).filter((h) => !pending.has(`${h.role}/${h.round ?? 1}`));
  };

  // Which executors played which role; `independentOf` role names resolve through it (see role-ledger.mjs).
  const roleLedger = createRoleExecutorLedger();
  const noteRoleExecutor = roleLedger.note;
  const resolveIndependence = roleLedger.resolve;

  // Bindings recorded in unit.json, per role/round, one entry per attempt (the first binding,
  // then one per provider-limit fallback). A resumed run reuses them instead of binding again,
  // so a resume never changes which executor or transport a role was already given.
  if (!unitRecord.bindings || typeof unitRecord.bindings !== 'object') unitRecord.bindings = {};
  for (const attempts of Object.values(unitRecord.bindings)) {
    for (const attempt of attempts) noteRoleExecutor(attempt.role, attempt.binding?.executor);
  }
  // Provider families whose login failed in this unit and that a seat then walked away from: no
  // later fallback walk of the unit lands on one (a resumed run rebuilds the set from its attempts).
  const credentialFaultFamilySet = credentialFaultFamilies(unitRecord);
  const persistUnitRecord = () => writeJsonAtomic(path.join(unitDir, 'unit.json'), unitRecord);

  // One dispatch of an already-bound role. Returns the settled outcome of that attempt.
  const dispatchBound = async ({ bound, role, round, readOnly, assignmentId, assignmentDir, session, inputs = [], objective = unit.objective }) => {
    const runnerConfig = unitRecord.configSnapshot.runner;
    fs.mkdirSync(assignmentDir, { recursive: true });

    // What the unit names (already resolved to paths), then the accounts of the roles whose
    // work this role judges (a panel synthesizer reads its panelists' reports).
    let contextRefs = [...new Set([...unitRecord.resolvedInputs, ...reportRefsOf(inputs, { mainRoot, worktree: unitRecord.worktree })])];
    if (unit.blind) {
      // A blind role reads only its own directory of the run state, so what lies elsewhere in it
      // reaches the role as a copy there, byte for byte; the copies are what its refs list.
      const inRun = contextRefs.filter((ref) => refIsHiddenFromBlind(ref, mainRoot));
      const entries = [
        ...(unitRecord.inputMap ?? []),
        ...inRun.map((source, i) => ({ name: `${plainInputName((unitRecord.inputMap?.length ?? 0) + i, source, mainRoot)}${path.extname(source)}`, source })),
      ];
      contextRefs = [...contextRefs.filter((ref) => !inRun.includes(ref)), ...copyHandoffsInto(assignmentDir, entries)];
    }

    // What an earlier run's same seat left for this role: the role's own previous result, copied
    // into its own directory whether the unit is blind or not.
    if (unit.inputs.some(isSeatInput)) {
      contextRefs = [...contextRefs, ...copyHandoffsInto(assignmentDir, resolveUnitInputs(unit.inputs, mainRoot, { seat: role }).inputMap)];
    }

    const assignment = {
      assignmentId,
      unitRunId,
      role,
      round,
      // The role's own task when the pattern gave it a unit of its own (a reviewer is told to
      // review, not to redo the work); otherwise the unit's objective.
      objective,
      mutation: readOnly ? 'read-only' : 'mutating',
      binding: bound,
      provenance: {
        kind: 'unit-run',
        unitRunId,
        role,
        round,
        binding: bound,
      },
      expectedOutputs: unit.expectedOutputs || [],
      contextRefs,
      writes: unitRecord.writeScope ?? unit.writes ?? [],
      policy: {
        tier: bound.tier,
        preferExecutor: bound.executor,
        preferInvocation: bound.invocation,
        preferPersona: bound.persona,
        // The persona text a caller pinned for this role when it supplied the override: the prompt
        // renders that text, never a file read again at dispatch time.
        ...pinnedPersonaFor(unitRecord.overrides, role, bound.persona),
      },
    };

    const runResult = await executeAssignment(assignment, {
      cwd: unitRecord.worktree,
      repoRoot: mainRoot,
      runnerConfig,
      providerCredentialProbe: createCredentialProbe(),
      providerCredentialRenew: createConfinementCredentialRenewal({ tempRoots: defaultConfinementTempRoots }),
      cliOverride: {
        preferExecutor: bound.executor,
        // bind() already chose the invocation that carries bound.transport: the executor's
        // herdr-spawn one for 'herdr', its cli one otherwise.
        preferInvocation: bound.invocation,
        tier: bound.tier,
        model: bound.model,
        // A level bind() accepted from an override; the launch renders it into the CLI's flag.
        ...(bound.reasoningEffort ? { reasoningEffort: bound.reasoningEffort } : {}),
      },
      isReadOnlyMode: readOnly,
      session,
      ...(options.providerCapacityRuntimeDir ? { providerCapacityRuntimeDir: options.providerCapacityRuntimeDir } : {}),
      // Every role of a blind unit is dispatched blind or refused, never run unblind.
      ...(unit.blind ? { blind: true } : {}),
    });

    return {
      outcome: outcomeOfRunResult(runResult),
      role,
      round,
      runResult,
      binding: bound,
    };
  };

  // Helper to run a role
  const runRole = async ({ role, unit: rUnit, readOnly = false, round = 1, independentOf = [], preferIndependentOf = [], inputs = [] }) => {
    const runnerConfig = unitRecord.configSnapshot.runner;
    const session = {
      provider: options.session?.provider,
      tier: options.session?.tier,
      hasNativeAgent: options.session?.hasNativeAgent ?? false,
      herdrPresent: options.session?.herdrPresent ?? detectHerdrPresent(),
      headless: options.session?.headless ?? true,
    };

    const ask = {
      unit: rUnit || unit,
      role,
      readOnly,
      independentOf: resolveIndependence(independentOf),
      ...(preferIndependentOf.length > 0 ? { preferIndependentOf: roleLedger.seats(preferIndependentOf) } : {}),
      overrides: unitRecord.overrides || [],
      ...(unit.blind ? { blind: true } : {}),
    };
    const bindCtx = { runnerConfig, session };

    const key = `${role}/${round}`;
    const recorded = unitRecord.bindings[key] ?? [];
    let attemptNo = recorded.length > 0 ? recorded.length - 1 : 0;
    let bound = recorded.length > 0 ? recorded[recorded.length - 1].binding : bind(ask, bindCtx);

    if (bound.refused) {
      return {
        outcome: 'policy-refusal',
        role,
        round,
        refused: bound.refused,
      };
    }

    // Recorded before anything awaits: roles started together (panelists) bind one after the
    // other in this same tick, so each sees the executors its siblings were just given.
    noteRoleExecutor(role, bound.executor);

    const writeScope = unitRecord.writeScope ?? unit.writes ?? [];
    const commitWork = (summarySource, runResult, excludePaths) => commitUnitWork({
      worktree: unitRecord.worktree,
      // The gitdir and hooks come from the main checkout, never from the worker-writable worktree.
      repoRoot: mainRoot,
      unitId: summarySource.id,
      summary: runResult?.agentClaim?.summary,
      scope: writeScope,
      changedFiles: runResult?.evidence?.changedFiles ?? null,
      excludePaths,
      needsWrites: runResult?.agentClaim?.needsWrites,
    });

    // The agent already did this round's work and only the runner commit failed: commit again,
    // never spawn the agent a second time.
    const lastRecorded = recorded[recorded.length - 1];
    if (!readOnly && commitPending(lastRecorded, unitRecord.worktree, mainRoot)) {
      const { foreignStaged } = preflightUnitWorktree({ worktree: unitRecord.worktree, repoRoot: mainRoot, scope: writeScope });
      if (foreignStaged.length > 0) return foreignIndexRefusal(role, round, foreignStaged);
      const prior = readUnitRunHistory(unitDir).find((h) => h.role === role && (h.round ?? 1) === round);
      const excludePaths = lastRecorded.preExistingInScope ?? [];
      let commit = commitWork(rUnit || unit, prior?.runResult, excludePaths);
      if (commit.status === 'no-changes') {
        // The agent's in-scope files are gone (cleaned up with the index): that is not a pass.
        const missing = partitionPaths((prior?.runResult?.evidence?.changedFiles ?? [])
          .filter((p) => !excludePaths.includes(p)), writeScope).inScope;
        if (missing.length > 0) {
          commit = { ...commit, status: 'failed', reason: 'work-missing', missing,
            error: `the files this round changed in scope are no longer in the worktree: ${missing.join(', ')}; run the unit again` };
        }
      }
      lastRecorded.commit = commit;
      lastRecorded.outcome = commit.status === 'failed' ? 'execution-failure' : 'pass';
      persistUnitRecord();
      return { outcome: lastRecorded.outcome, role, round, runResult: prior?.runResult, binding: lastRecorded.binding, commit };
    }

    if (bound.mechanism === 'inline') {
      if (role !== 'producer') {
        throw new RunnerConfigError(`checker role "${role}" cannot be bound inline (G2 / Q-A violation)`);
      }
      const nonce = crypto.randomBytes(16).toString('hex');
      const pendingRecord = {
        unitRunId,
        role,
        round,
        nonce,
        binding: bound,
        createdAt: new Date().toISOString(),
      };
      fs.writeFileSync(path.join(unitDir, 'pending-inline.json'), JSON.stringify(pendingRecord, null, 2));
      return {
        outcome: 'blocked',
        role,
        round,
        pendingInline: { nonce, role, round },
      };
    }

    // Before a mutating producer is spawned: an index someone else staged refuses the run (the
    // runner stages only what it chose), and files already dirty in scope are recorded so the
    // runner never commits them. A resumed attempt keeps what its first launch saw.
    let preExistingInScope = [];
    if (!readOnly) {
      const preflight = preflightUnitWorktree({ worktree: unitRecord.worktree, repoRoot: mainRoot, scope: writeScope });
      if (preflight.foreignStaged.length > 0) return foreignIndexRefusal(role, round, preflight.foreignStaged);
      preExistingInScope = recorded[0]?.preExistingInScope ?? preflight.preExistingInScope;
    }

    // Out-of-process dispatch, with provider-limit failover: when the agent stops on a provider
    // limit or a dead credential, the same executor first runs again on another account of its
    // provider, then the next candidate of the capability's prefer pool runs; each attempt gets a
    // fresh pane/process and the failed one is left exactly as it was (its pane stays open). With
    // nothing left the outcome stays provider-limit -- no other executor is guessed at.
    for (;;) {
      const assignmentId = attemptNo === 0 ? `${unitRunId}/${role}/${round}` : `${unitRunId}/${role}/${round}-fb${attemptNo}`;
      const assignmentDir = path.join(unitDir, role, attemptNo === 0 ? String(round) : `${round}-fb${attemptNo}`);

      const attempts = unitRecord.bindings[key] ?? (unitRecord.bindings[key] = []);
      if (attempts.length <= attemptNo) {
        attempts.push({
          role,
          round,
          assignmentId,
          binding: bound,
          transport: bound.transport,
          invocation: bound.invocation,
          fallbackFrom: bound.provenance?.fallbackFrom ?? null,
          // Where this attempt's candidate walk resumed (-1 = from the start of the pool). A retry
          // on another account of the same candidate resumes exactly where the attempt it retries did.
          skipCandidateIndex: attemptNo === 0 ? -1
            : bound.provenance?.fallbackFrom?.kind === 'account-rotation' ? (attempts[attemptNo - 1]?.skipCandidateIndex ?? -1)
              : (attempts[attemptNo - 1]?.binding?.candidateIndex ?? -1),
          candidateIndex: bound.candidateIndex ?? null,
          ...(readOnly ? {} : { preExistingInScope }),
          boundAt: new Date().toISOString(),
        });
        persistUnitRecord();
      }

      const result = await dispatchBound({ bound, role, round, readOnly, assignmentId, assignmentDir, session, inputs, objective: (rUnit || unit).objective });

      // The worker only writes files; this trusted code, outside the confinement, commits the
      // ones inside the write scope. No change is recorded as such, and a commit that cannot be
      // made fails the round. Paths changed outside the scope are reported, never committed.
      if (!readOnly && result.outcome === 'pass') {
        const commit = commitWork(rUnit || unit, result.runResult, attempts[attemptNo].preExistingInScope ?? preExistingInScope);
        result.commit = commit;
        attempts[attemptNo].commit = commit;
        if (commit.status === 'failed') result.outcome = 'execution-failure';
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
      const rotation = inspectAccountRotation({ runnerConfig, executorId: bound.executor, runtimeDir: options.providerCapacityRuntimeDir });
      if (mayRotateAccount(rotation, rotationsSpent)) {
        bound = retrySameCandidate(bound, { provider: rotation.provider, accountsHealthy: rotation.healthy });
        attemptNo += 1;
        continue;
      }

      if (credentialFault) credentialFaultFamilySet.add(getProviderFamily(runnerConfig, bound.executor).toLowerCase());
      // The spread is read again now: sibling seats may have changed executors since this seat first bound.
      const walkAsk = preferIndependentOf.length > 0 ? { ...ask, preferIndependentOf: roleLedger.seats(preferIndependentOf) } : ask;
      const next = nextCandidate(bound, walkAsk, bindCtx, 'provider-limit', { excludeFamilies: [...credentialFaultFamilySet] });
      if (next.refused || next.mechanism === 'inline') {
        return {
          ...result,
          fallbackExhausted: {
            from: { executor: bound.executor, invocation: bound.invocation, transport: bound.transport },
            reason: next.refused ? next.refused.reason : 'only-inline-candidate-left',
            detail: next.refused ? next.refused.detail : 'no out-of-process candidate is left to run this role',
            ...(rotationsSpent > 0 ? { accountRotations: rotationsSpent } : {}),
          },
        };
      }

      noteRoleExecutor(role, next.executor);
      bound = next;
      attemptNo += 1;
    }
  };

  // Helper for verify command
  const verify = async (targetUnit) => {
    const runnerConfig = unitRecord.configSnapshot.runner;
    const verifyCmd = targetUnit.verify || runnerConfig.capabilities?.[targetUnit.capability]?.verify;
    if (!verifyCmd || typeof verifyCmd !== 'string') {
      return { pass: true };
    }

    try {
      execSync(verifyCmd, {
        cwd: unitRecord.worktree,
        stdio: ['ignore', 'pipe', 'pipe'],
        encoding: 'utf8',
        timeout: 60000,
      });
      return { pass: true };
    } catch (err) {
      return {
        pass: false,
        findings: [`Verification command failed: ${verifyCmd} (${err.message})`],
      };
    }
  };

  // A caller that passes `{ pattern, params }` is choosing the pattern's params as well as its
  // name, so that object form wins over the unit's own pattern string.
  const callerPattern = options.pattern && typeof options.pattern === 'object' ? options.pattern : null;
  const patternName = callerPattern || unit.pattern || options.pattern || 'solo';
  unitRecord.pattern = patternName;
  persistUnitRecord();
  const patternResult = await runPattern(patternName, unit, unitRecord.configSnapshot.runner, {
    runRole,
    verify,
    history,
  });
  executionSettled = true;
  if (fs.existsSync(path.join(unitDir, 'pending-inline.json'))) {
    unitRecord.execution = { status: 'pending-inline' };
    persistUnitRecord();
  } else {
    settle(patternResult.outcome);
  }

  return {
    unitRunId,
    outcome: patternResult.outcome,
    rounds: patternResult.rounds,
    results: patternResult.results,
    findings: patternResult.findings || [],
  };
  } catch (error) {
    if (!executionSettled) {
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
 * @param {string} params.role
 * @param {number} params.round
 * @param {string} params.nonce
 * @param {string[]} params.evidenceRefs
 * @param {object} [params.result]
 * @param {string} [params.repoRoot]
 * @returns {{ok: boolean, unitRunId: string, role: string, round: number}}
 */
export function recordInlineRun(params = {}) {
  const { unitRunId, role, round, nonce, evidenceRefs, result = {}, repoRoot } = params;
  if (!unitRunId || !role || round === undefined || !nonce) {
    throw new RunnerConfigError('recordInlineRun requires unitRunId, role, round, and nonce');
  }

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

  if (pending.role !== 'producer' || role !== 'producer') {
    throw new RunnerConfigError(`recordInlineRun refused: only producer role may record inline run, got role "${role}"`);
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
  const attemptDir = path.join(unitDir, role, String(round), 'runs', '01');
  fs.mkdirSync(attemptDir, { recursive: true });

  const recordPayload = {
    unitRunId,
    role,
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
    role,
    round,
  };
}
