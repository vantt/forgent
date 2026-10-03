// src/runner/execution/run.mjs — Single execution door (fgos run) and verifiable mutating gate
// Architecture guard: MUST NOT import src/state/**, src/runner/coordination/**, src/runner/worktree.mjs, or src/runner/merge.mjs (A4 boundary)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, execSync } from 'node:child_process';

import { validateUnit } from './unit.mjs';
import { bind, nextCandidate } from './bind.mjs';
import { runPattern } from './patterns/index.mjs';
import { executeAssignment } from '../dispatch/assignment-runner.mjs';
import { ensureRunnerConfigForDir, RunnerConfigError } from '../dispatch/config.mjs';
import { commitUnitWork } from './commit-unit-work.mjs';
import { reapOrphanedConfinementResources, resolveConfinementTempRoot } from '../dispatch/confinement/cleanup.mjs';

/**
 * Map a settled RunResult onto the outcome vocabulary the collaboration patterns use.
 * A provider limit is an infra failure carrying its own code, so a caller can tell
 * "this provider has no quota" from any other infrastructure failure.
 */
export function outcomeOfRunResult(runResult) {
  const category = runResult?.classification?.outcome?.category ?? 'ok';
  const failureCode = runResult?.classification?.failure?.code;
  if (category === 'ok') return 'pass';
  if (category === 'verdict' && runResult?.classification?.assessment?.verdict === 'findings') return 'findings';
  if (category === 'blocked') return 'blocked';
  if (category === 'policy') return 'policy-refusal';
  if (category === 'infra' && (failureCode === 'provider-limit' || failureCode === 'paused-limit')) return 'provider-limit';
  return 'execution-failure';
}

/** Write `file` atomically so a reader never sees half a record. */
function writeJsonAtomic(file, value) {
  const tmp = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
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
  // Private homes left by an earlier run (a failed round that kept its pane)
  // hold a copy of an account login; `fgos run` is the one door every such run
  // goes through, so it is also where the ones whose pane has since closed are
  // reclaimed. Best effort: a reap problem never blocks the run.
  try { reapOrphanedConfinementResources({ tempRoot: resolveConfinementTempRoot() }); } catch { /* best effort */ }

  const cwd = options.cwd ?? process.cwd();
  const roots = resolveGitRoots(cwd);
  const mainRoot = options.repoRoot ? path.resolve(options.repoRoot) : roots.mainCheckoutRoot;
  const worktreePath = options.worktree ? path.resolve(options.worktree) : roots.worktreeRoot;

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

    // Check in-flight lock for holder
    const safeKey = worktreePath.replace(/[^a-zA-Z0-9_-]/g, '_');
    const lockPath = path.join(mainRoot, '.fgos', `dispatch--${safeKey}.lock`);
    if (fs.existsSync(lockPath)) {
      try {
        const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
        const pid = lockData?.pid;
        if (typeof pid === 'number') {
          let alive = false;
          try {
            process.kill(pid, 0);
            alive = true;
          } catch {
            alive = false;
          }
          if (alive) {
            throw new RunnerConfigError(`cannot resume unit run "${unitRunId}": another process (PID ${pid}) holds lock at "${lockPath}"`);
          }
        }
      } catch (err) {
        if (err instanceof RunnerConfigError) throw err;
      }
    }
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

    unit = validateUnit(raw);
    unitRunId = `unit-run-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const unitDir = path.join(assignmentsDir, unitRunId);
    fs.mkdirSync(unitDir, { recursive: true });

    const configSnapshot = snapshotRunnerConfig(mainRoot);
    unitRecord = {
      unit,
      overrides: options.overrides || [],
      configSnapshot,
      worktree: fs.realpathSync(worktreePath),
      createdBy: process.env.USER || 'system',
      createdAt: new Date().toISOString(),
    };

    fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(unitRecord, null, 2));
  }

  const unitDir = path.join(assignmentsDir, unitRunId);

  // Helper to read history. A role/round has one assignment directory per attempt: `<round>`
  // for the first binding and `<round>-fb<n>` for each fallback after a provider limit; the
  // latest attempt is the one that counts.
  const history = () => {
    const records = [];
    if (!fs.existsSync(unitDir)) return records;
    try {
      const entries = fs.readdirSync(unitDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const role = entry.name;
          const roleDir = path.join(unitDir, role);
          const latestByRound = new Map();
          for (const roundEntry of fs.readdirSync(roleDir, { withFileTypes: true })) {
            if (!roundEntry.isDirectory()) continue;
            const match = /^(\d+)(?:-fb(\d+))?$/.exec(roundEntry.name);
            if (!match) continue;
            const round = Number.parseInt(match[1], 10);
            const fallbackNo = match[2] ? Number.parseInt(match[2], 10) : 0;
            // A resumed binding runs again as a later attempt of the same assignment.
            const runsDir = path.join(roleDir, roundEntry.name, 'runs');
            const attempts = fs.existsSync(runsDir)
              ? fs.readdirSync(runsDir).filter((name) => /^\d+$/.test(name)).sort()
              : [];
            const latestAttempt = attempts.reverse().find((name) => fs.existsSync(path.join(runsDir, name, 'result.json')));
            if (!latestAttempt) continue;
            const resultFile = path.join(runsDir, latestAttempt, 'result.json');
            const known = latestByRound.get(round);
            if (!known || fallbackNo > known.fallbackNo) latestByRound.set(round, { fallbackNo, resultFile });
          }
          for (const [round, { resultFile }] of latestByRound) {
            try {
              const runResult = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
              records.push({ role, round, outcome: outcomeOfRunResult(runResult), runResult });
            } catch {
              // Ignore corrupted result
            }
          }
        }
      }
    } catch {
      // Best effort history read
    }
    return records;
  };

  // Executors bound to each role in this unit run. `independentOf` names roles ('producer');
  // bind() compares provider families, so a role name has to be turned into the executor(s)
  // that played it before it can exclude anything. A role not bound yet stays a role name and
  // excludes nothing.
  const executorsByRole = new Map();
  const noteRoleExecutor = (role, executorId) => {
    if (!executorId) return;
    if (!executorsByRole.has(role)) executorsByRole.set(role, new Set());
    executorsByRole.get(role).add(executorId);
  };
  const resolveIndependence = (names) =>
    (names || []).flatMap((name) => (executorsByRole.has(name) ? [...executorsByRole.get(name)] : [name]));

  // Bindings recorded in unit.json, per role/round, one entry per attempt (the first binding,
  // then one per provider-limit fallback). A resumed run reuses them instead of binding again,
  // so a resume never changes which executor or transport a role was already given.
  if (!unitRecord.bindings || typeof unitRecord.bindings !== 'object') unitRecord.bindings = {};
  for (const attempts of Object.values(unitRecord.bindings)) {
    for (const attempt of attempts) noteRoleExecutor(attempt.role, attempt.binding?.executor);
  }
  const persistUnitRecord = () => writeJsonAtomic(path.join(unitDir, 'unit.json'), unitRecord);

  // One dispatch of an already-bound role. Returns the settled outcome of that attempt.
  const dispatchBound = async ({ bound, role, round, readOnly, assignmentId, assignmentDir, session }) => {
    const runnerConfig = unitRecord.configSnapshot.runner;
    fs.mkdirSync(assignmentDir, { recursive: true });

    const assignment = {
      assignmentId,
      unitRunId,
      role,
      round,
      objective: unit.objective,
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
      contextRefs: unit.inputs || [],
      writes: unit.writes || [],
      policy: {
        tier: bound.tier,
        preferExecutor: bound.executor,
        preferInvocation: bound.invocation,
        preferPersona: bound.persona,
      },
    };

    const runResult = await executeAssignment(assignment, {
      cwd: unitRecord.worktree,
      repoRoot: mainRoot,
      runnerConfig,
      cliOverride: {
        preferExecutor: bound.executor,
        // bind() already chose the invocation that carries bound.transport: the executor's
        // herdr-spawn one for 'herdr', its cli one otherwise.
        preferInvocation: bound.invocation,
        tier: bound.tier,
        model: bound.model,
      },
      isReadOnlyMode: readOnly,
      session,
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
  const runRole = async ({ role, unit: rUnit, readOnly = false, round = 1, independentOf = [], inputs = [] }) => {
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
      overrides: unitRecord.overrides || [],
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

    // Out-of-process dispatch, with provider-limit fallback: when the agent stops on a provider
    // limit, the next candidate of the capability's prefer pool runs in a fresh pane/process and
    // the limited one is left exactly as it was (its pane stays open). With no candidate left
    // the outcome stays provider-limit -- no other executor is guessed at.
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
          boundAt: new Date().toISOString(),
        });
        persistUnitRecord();
      }

      const result = await dispatchBound({ bound, role, round, readOnly, assignmentId, assignmentDir, session });

      // The worker only writes files; this trusted code, outside the confinement, commits them.
      // No change is recorded as such, and a commit that cannot be made fails the round.
      if (!readOnly && result.outcome === 'pass') {
        const commit = commitUnitWork({
          worktree: unitRecord.worktree,
          unitId: (rUnit || unit).id,
          summary: result.runResult?.agentClaim?.summary,
        });
        result.commit = commit;
        attempts[attemptNo].commit = commit;
        if (commit.status === 'failed') result.outcome = 'execution-failure';
      }

      attempts[attemptNo].outcome = result.outcome;
      attempts[attemptNo].runId = result.runResult?.runId ?? null;
      persistUnitRecord();

      if (result.outcome !== 'provider-limit') return result;

      const next = nextCandidate(bound, ask, bindCtx, 'provider-limit');
      if (next.refused || next.mechanism === 'inline') {
        return {
          ...result,
          fallbackExhausted: {
            from: { executor: bound.executor, invocation: bound.invocation, transport: bound.transport },
            reason: next.refused ? next.refused.reason : 'only-inline-candidate-left',
            detail: next.refused ? next.refused.detail : 'no out-of-process candidate is left to run this role',
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

  const patternName = unit.pattern || options.pattern || 'solo';
  const patternResult = await runPattern(patternName, unit, unitRecord.configSnapshot.runner, {
    runRole,
    verify,
    history,
  });

  return {
    unitRunId,
    outcome: patternResult.outcome,
    rounds: patternResult.rounds,
    results: patternResult.results,
    findings: patternResult.findings || [],
  };
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
    evidenceRefs,
    result,
  };
  fs.writeFileSync(path.join(attemptDir, 'result.json'), JSON.stringify(recordPayload, null, 2));

  return {
    ok: true,
    unitRunId,
    role,
    round,
  };
}
