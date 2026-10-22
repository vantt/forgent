// Doctor rows for Seat Binding: `seat-binding-config` (the project config is in the seat-binding schema),
// `seat-binding-drain` (nothing still drives a unit run whose seats were keyed by role) and
// `seat-binding-dry-bind` (every seat of every Workflow unit binds under the committed config).
// The drain row never reads the runner config, so it runs on an unconverted workspace.

import fs from 'node:fs';
import path from 'node:path';
import { sharedConfigFilePath, readSharedConfig } from '../config/shared-config-file.mjs';
import { SEAT_BINDING_SCHEMA_VERSION } from '../runner/dispatch/config.mjs';
import { createSeatBindingClient } from '../seat-binding/client.mjs';
import { isSeatRecord } from '../runner/execution/legacy-seat-read.mjs';
import { unitControlDir } from '../runner/execution/unit-control.mjs';
import { inspectRunControl } from '../runner/dispatch/run-lock.mjs';
import { readWorkflowEvents, projectWorkflowState } from '../workflow/store.mjs';
import { listAssignmentRuns } from '../runner/dispatch/assignment-layout.mjs';
import { ladderCommentLines } from './seat-binding-conversion.mjs';
import { simulateUnitBindings } from '../runner/execution/dry-bind.mjs';
import { loadWorkflowDefinitions, withUnreadableDefinitions, workflowRoots, workflowUnitContract } from './workflow-definition-files.mjs';

const MAX_LISTED = 8;
const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const readJson = (file) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };
const listed = (items) => (items.length > MAX_LISTED ? `${items.slice(0, MAX_LISTED).join('; ')}; and ${items.length - MAX_LISTED} more` : items.join('; '));

/**
 * The project's runner section is in the seat-binding schema: no `rigorToTier`, and the schema marker an
 * older release refuses. A `$comment` that differs from the crate's ladder is reported, not failed:
 * `fgos setup` refreshes it.
 */
export function checkSeatBindingConfig(cwd) {
  const file = sharedConfigFilePath(cwd);
  let runner;
  try {
    runner = readSharedConfig(cwd).runner;
  } catch (err) {
    return { passed: false, message: err.message };
  }
  if (!isPlainObject(runner) || Object.keys(runner).length === 0) {
    return { passed: true, message: 'no runner section yet: the first run writes one in the seat-binding schema' };
  }
  const marker = runner.patterns?.seatBinding?.schema;
  const problems = [];
  if (Object.hasOwn(runner, 'rigorToTier')) problems.push('it still carries "rigorToTier", which no longer exists');
  if (marker === undefined) problems.push('it has no runner.patterns.seatBinding.schema');
  else if (marker !== SEAT_BINDING_SCHEMA_VERSION) problems.push(`its schema is ${JSON.stringify(marker)}, this release writes ${SEAT_BINDING_SCHEMA_VERSION}`);
  if (problems.length > 0) {
    return {
      passed: false,
      message: `${file}#runner is not in the seat-binding schema (${problems.join('; ')}): run \`fgos setup\` to convert it. Setup copies the file to ${file}.pre-seat-binding-<time> first; to roll back, activate the previous release and restore that copy together`,
    };
  }
  if (runner.$comment === undefined) return { passed: true, message: `${file}#runner is in the seat-binding schema` };
  let ladder;
  try {
    ladder = ladderCommentLines(createSeatBindingClient({ cwd, fgosDir: path.join(cwd, '.fgos') }).tierLadder().definitions);
  } catch (err) {
    return { passed: true, message: `${file}#runner is in the seat-binding schema; its $comment was not compared with the tier ladder (${err.code ?? 'error'}: ${err.message})` };
  }
  if (JSON.stringify(runner.$comment) !== JSON.stringify(ladder)) {
    return { passed: true, message: `${file}#runner is in the seat-binding schema; its $comment differs from the tier ladder: run \`fgos setup\` to refresh it` };
  }
  return { passed: true, message: `${file}#runner is in the seat-binding schema` };
}

const ageOf = (iso, now) => {
  const ms = now - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return 'age unknown';
  const minutes = Math.round(ms / 60000);
  return minutes < 120 ? `${minutes} min` : `${Math.round(minutes / 60)} h`;
};

/**
 * Stop predicate for landing the seat-binding release: it fails only while a unit run written before
 * seats existed (no `seatSchema` in its `unit.json`) still has a controller alive. Each is listed with its
 * path, unit run, age and controller; it finishes on the old release, or its session stops. A pre-fence
 * record nobody drives is information: after landing a resume is refused as `record-predates-seat-binding`
 * and its history stays readable through the legacy read path. A workflow run still open (parked at a
 * gate, or running) is information too: role-keyed refs it hands on resolve through that same path.
 */
export function checkSeatBindingDrain(cwd, { now = Date.now() } = {}) {
  const assignmentsDir = path.join(cwd, '.fgos', 'assignments');
  const live = [];
  const dead = [];
  // Unit runs are found through the assignment layout owner: a unit run is the first segment of its assignment ids.
  const unitDirs = [...new Set([...listAssignmentRuns(path.join(cwd, '.fgos'))].map(({ assignmentId }) => assignmentId.split('/')[0]))]
    .filter((name) => fs.existsSync(path.join(assignmentsDir, name, 'unit.json'))).sort();
  for (const unitRunId of unitDirs) {
    const unitDir = path.join(assignmentsDir, unitRunId);
    const record = readJson(path.join(unitDir, 'unit.json'));
    if (record === null || isSeatRecord(record)) continue;
    const control = inspectRunControl(unitControlDir(unitDir));
    if (control.held === true) {
      live.push(`${unitDir} (unit run ${unitRunId}, ${ageOf(record.createdAt, now)} old, controller ${control.holder?.id ?? 'unknown'})`);
      continue;
    }
    const summary = readJson(path.join(unitDir, 'unit-summary.json'));
    if (summary && summary.outcome !== 'unknown' && summary.outcome !== 'undetermined') continue;
    dead.push(unitRunId);
  }
  const notes = [];
  if (dead.length > 0) {
    notes.push(`info: ${dead.length} unit run(s) written before seats existed have no controller and no summary (${listed(dead)}): after landing each is refused as record-predates-seat-binding on resume, and its history stays readable through the legacy read path`);
  }
  const open = openWorkflowRuns(cwd);
  if (open.length > 0) {
    notes.push(`info: ${open.length} workflow run(s) are still open (${listed(open)}): role-keyed refs they hand on resolve through the legacy read path`);
  }
  if (live.length > 0) {
    return {
      passed: false,
      message: `${live.length} unit run(s) written before seats existed still have a controller: ${listed(live)} -- wait for each to finish on the active release, or stop its session${notes.length > 0 ? `; ${notes.join('; ')}` : ''}`,
    };
  }
  return { passed: true, message: notes.length > 0 ? `no pre-seat unit run has a live controller; ${notes.join('; ')}` : 'no pre-seat unit run has a live controller' };
}

/** `<id> (parked|running)` for each workflow run that is neither completed nor failed. */
function openWorkflowRuns(cwd) {
  const runsDir = path.join(cwd, '.fgos', 'workflow-runs');
  let ids = [];
  try { ids = fs.readdirSync(runsDir).sort(); } catch { return []; }
  const open = [];
  for (const workflowRunId of ids) {
    let status;
    try { status = projectWorkflowState(readWorkflowEvents({ repoRoot: cwd, workflowRunId })).status; } catch { continue; }
    if (status === 'parked' || status === 'running') open.push(`${workflowRunId} ${status}`);
  }
  return open;
}

// The session every seat is bound against: headless, no lead, no herdr session. What a person's own session
// would add is not the config's business, and a doctor row must give the same answer wherever it runs.
const DRY_BIND_SESSION = Object.freeze({ headless: true, herdrPresent: false });

// A refusal that says the config has no answer for the seat is information, not a failure: no pool is
// configured for the capability (nothing names an executor), a pool has no usable account in the config
// view, or the capability is served by a tool executor. Every other refusal is a policy refusal and fails.
const INFO_REFUSALS = new Map([
  ['no-candidate', 'no pool configured'],
  ['headless-no-executor', 'no pool configured'],
  ['pool-unusable', 'account state'],
  ['pool-excluded', 'account state'],
  ['not-an-agent-seat', 'tool executor'],
]);

/**
 * Binds every seat of every Workflow unit the way a run would, without a lease and without starting anything
 * (`simulateUnitBindings` is the same crate call a run makes, seats in resolver order with the earlier seats
 * published to the later). A policy refusal fails the row; the rest is listed as information: capabilities
 * with no pool, account-state refusals, tiers lowered by `maxTier` and seats that share a provider family.
 *
 * @param {string} cwd Project root (its own core/ and domains/ workflows are read too).
 * @param {object} options
 * @param {string} options.packageRoot Root holding the shipped core/ and domains/.
 * @param {() => object} options.loadRunnerConfig Returns the project's runner config; may throw.
 */
export async function checkSeatBindingDryBind(cwd, { packageRoot, loadRunnerConfig }) {
  let runnerConfig;
  try {
    runnerConfig = loadRunnerConfig(cwd);
  } catch (err) {
    return { passed: true, message: `runner config not loadable here, seats not bound: ${err.message}` };
  }
  const loaded = loadWorkflowDefinitions(workflowRoots(cwd, packageRoot));
  const problems = [];
  const info = [];
  let units = 0;
  let bound = 0;
  for (const wf of loaded.workflows.values()) {
    for (const step of wf.steps) {
      for (const u of step?.units ?? []) {
        const unit = workflowUnitContract(u);
        if (typeof unit.capability !== 'string') continue;
        units += 1;
        const label = `${wf.id}/${step.id}/${u.id} (capability "${unit.capability}")`;
        let seats;
        try {
          ({ seats } = await simulateUnitBindings(unit, runnerConfig, { session: DRY_BIND_SESSION, workflowId: wf.id }));
        } catch (err) {
          problems.push(`${label}: could not be evaluated (${err.message})`);
          continue;
        }
        for (const seat of seats) {
          if (seat.refused) {
            const kind = INFO_REFUSALS.get(seat.refused.reason);
            if (kind) info.push(`${label}: seat ${seat.seat} not bound, ${kind} (${seat.refused.reason})`);
            else problems.push(`${label}: seat ${seat.seat} refused for ${seat.refused.reason}: ${seat.refused.detail}`);
            continue;
          }
          bound += 1;
          if (seat.loweredFrom) info.push(`${label}: seat ${seat.seat} runs at ${seat.tier}, lowered from ${seat.loweredFrom.from} by max-tier-cap (${seat.loweredFrom.fromSource})`);
          if (seat.sharesFamilyWith?.length > 0) info.push(`${label}: seat ${seat.seat}=${seat.executor} shares a provider family with ${seat.sharesFamilyWith.join(', ')} (a preference, not a failure)`);
        }
      }
    }
  }
  const notes = info.length > 0 ? `; info (${info.length}): ${listed(info)}` : '';
  if (problems.length > 0) {
    return withUnreadableDefinitions({ passed: false, message: `${problems.length} seat(s) are refused by policy: ${problems.join(' | ')}${notes}` }, loaded.unreadable);
  }
  return withUnreadableDefinitions({ passed: true, message: units === 0 ? 'no Workflow unit to bind' : `${bound} seat(s) of ${units} Workflow unit(s) bind${notes}` }, loaded.unreadable);
}
