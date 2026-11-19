#!/usr/bin/env node
// Records the golden vectors of the Execution pure core (outcome, seat resolver, legacy seat read, loops,
// history outcome, case paths, hand-off rules, unit record rules, admission contract) from the Node modules
// that own them today. The Rust crate `fgos-execution` replays them (packages/execution/rust/tests/core_loops.rs).
// The vectors are written, never hand-edited: rerun this recorder to change one.
//
// Usage: node test/golden-recorders/core-loops.recorder.mjs [--out <dir>]
// Output: <out>/{outcome,seats,legacy,loops,records}.v1.json (default packages/execution/contracts/core-loops).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as outcome from '../../src/runner/execution/outcome.mjs';
import * as seats from '../../src/runner/execution/seat-resolver.mjs';
import * as legacy from '../../src/runner/execution/legacy-seat-read.mjs';
import * as loops from '../../src/runner/execution/loops/index.mjs';
import { roleUnit } from '../../src/runner/execution/loops/role-tasks.mjs';
import { verifyCommandOf, verifySeatResult } from '../../src/runner/execution/loops/verify.mjs';
import { patternHistoryOutcome } from '../../src/runner/execution/loops/history-outcome.mjs';
import { reviewedHistoryOutcome, extractFindings } from '../../src/runner/execution/loops/reviewed.mjs';
import * as casePaths from '../../src/runner/execution/case-run-paths.mjs';
import * as handoff from '../../src/runner/execution/handoff-refs.mjs';
import * as admission from '../../src/runner/execution/case-admission-port.mjs';
import { extractStance, buildUnitSummary, serializeUnitSummary, UNIT_SUMMARY_CONTRACT } from '../../src/runner/execution/unit-summary.mjs';
import { readUnitRunSeats } from '../../src/runner/execution/unit-run-history.mjs';
import { lastAttempts, deriveUnitState } from '../../src/runner/execution/unit-state.mjs';
import crypto from 'node:crypto';
import { normalizeWorkflowLink, normalizePlanRef } from '../../src/runner/execution/unit.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const argOut = process.argv.indexOf('--out');
const outDir = argOut > 0 ? path.resolve(process.argv[argOut + 1]) : path.join(root, 'packages/execution/contracts/core-loops');

// What a call answered: its value, or the error it threw (class, code, message, and the located detail).
function answer(fn) {
  try {
    const value = fn();
    return { ok: value === undefined ? null : JSON.parse(JSON.stringify(value)) };
  } catch (error) {
    return { error: { class: error.name === 'SeatResolutionError' ? 'SeatResolutionError' : error.name, code: error.code ?? '', message: error.message, ...(error.at !== undefined ? { at: error.at } : {}), ...(error.detail !== undefined ? { detail: error.detail } : {}) } };
  }
}
const cases = [];
const addTo = (list) => (id, fn, args, extra = {}) => {
  const impl = typeof fn === 'string' ? fn : fn.name;
  list.push({ id, fn: impl, args, expected: extra.expected ?? answer(() => extra.call(...args)) });
};

const write = (name, about, body) => {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${name}.v1.json`), `${JSON.stringify({ version: `core-loops-${name}.v1`, about, ...body }, null, 1)}\n`);
};

const posture = (o = {}) => ({ readOnly: false, writer: false, forceOutOfProcess: false, stance: false, verdict: false, ...o });

// ---------------------------------------------------------------------------------------------------- outcome
{
  const list = [];
  const add = addTo(list);
  for (const o of ['pass', 'findings', 'execution-failure', 'policy-refusal', 'provider-limit', 'blocked', 'not-started', 'undetermined', 'unknown', '', 'toString']) {
    // exitCodeForOutcome reads an inherited key ('toString') as a function, so that one value is not recorded for it.
    add(`outcomeClass ${JSON.stringify(o)}`, 'outcomeClass', [o], { call: (v) => outcome.outcomeClass(v) });
    add(`isVerdict ${JSON.stringify(o)}`, 'isVerdict', [o], { call: outcome.isVerdict });
    add(`isInfrastructure ${JSON.stringify(o)}`, 'isInfrastructure', [o], { call: outcome.isInfrastructure });
    add(`rebindsOnResume ${JSON.stringify(o)}`, 'rebindsOnResume', [o], { call: outcome.rebindsOnResume });
    if (o !== 'toString') add(`exitCodeForOutcome ${JSON.stringify(o)}`, 'exitCodeForOutcome', [o], { call: outcome.exitCodeForOutcome });
  }
  add('exitCodeForOutcome partial-writes', 'exitCodeForOutcome', ['partial-writes'], { call: outcome.exitCodeForOutcome });
  const verdictSeat = { seat: 'reviewer', round: 1, outcome: 'pass', posture: posture({ verdict: true }) };
  const unitCases = {
    'infrastructure outcome, nothing else': { outcome: 'execution-failure' },
    'not-started is infrastructure': { outcome: 'not-started', results: [] },
    'a pass is not infrastructure': { outcome: 'pass' },
    'out of scope writes rule infrastructure out': { outcome: 'execution-failure', outOfScope: ['a.txt'] },
    'a refused seat is never infrastructure': { outcome: 'execution-failure', results: [{ seat: 'producer', refused: { reason: 'x', detail: 'y' } }] },
    'a verdict seat that reached a verdict rules it out': { outcome: 'execution-failure', results: [verdictSeat] },
    'a verdict seat that failed does not': { outcome: 'execution-failure', results: [{ ...verdictSeat, outcome: 'execution-failure' }] },
    'a pre-fence checker named by role reached a verdict': { outcome: 'execution-failure', results: [{ role: 'red-team-1', outcome: 'findings' }] },
  };
  for (const [name, unit] of Object.entries(unitCases)) add(`infrastructure: ${name}`, 'infrastructure', [unit], { call: outcome.infrastructure });
  add('infrastructure: no result at all', 'infrastructure', [{}], { call: outcome.infrastructure });
  for (const [o, scope] of [['pass', []], ['pass', ['x']], ['findings', ['x']], ['blocked', ['x']]]) {
    add(`outcomeAfterScopeRule ${o} ${scope.length}`, 'outcomeAfterScopeRule', [o, scope], { call: outcome.outcomeAfterScopeRule });
  }
  add('evaluationsOf: verify, checker verdict, producer and unfinished evaluators', 'evaluationsOf', [[
    { seat: 'producer', round: 1, outcome: 'pass', posture: posture({ writer: true }) },
    { seat: 'reviewer', outcome: 'findings', posture: posture({ verdict: true }) },
    { seat: 'tester', round: 2, outcome: 'pass', posture: posture() },
    { seat: 'red-team', round: 2, outcome: 'execution-failure', posture: posture({ verdict: true }) },
    { seat: 'verify', round: 2, outcome: 'pass' },
    { role: 'verifier', round: 3, outcome: 'findings' },
    { role: 'reviewer', outcome: 'pass' },
    { seat: 'noise', outcome: 'surprise' },
  ]], { call: outcome.evaluationsOf });
  add('evaluationsOf: nothing', 'evaluationsOf', [[]], { call: outcome.evaluationsOf });
  write('outcome', 'Outcome vocabulary of Execution: classes, predicates, the scope rule, evaluations and the exit code table, recorded from src/runner/execution/outcome.mjs. A case is { id, fn, args, expected }, expected being { ok } or { error }.', {
    tables: {
      validOutcomes: outcome.VALID_OUTCOMES,
      errorOutcomes: outcome.ERROR_OUTCOMES,
      notStarted: outcome.NOT_STARTED_OUTCOME,
      undetermined: outcome.UNDETERMINED_OUTCOME,
      exitCodes: outcome.OUTCOME_EXIT_CODES,
    },
    cases: list,
  });
}

// ---------------------------------------------------------------------------------------------------- seats
const runnerCfg = {
  capabilities: {
    'code:implement': { rigor: 'high', verify: 'npm test' },
    'code:*': { minCheckers: ['reviewer'] },
    review: { rigor: 'critical', minCheckers: [] },
    docs: { rigor: 'low', minCheckers: 'tester', verify: '   ' },
    'weird:x': { rigor: 'bogus' },
  },
  loops: { reviewed: { checkersByRigor: { low: ['reviewer'], standard: ['reviewer'], high: ['reviewer', 'red-team'], critical: ['reviewer', 'red-team'] } } },
};
const shippedRigor = { standard: ['reviewer'], high: ['reviewer', 'red-team'] };
{
  const list = [];
  const add = addTo(list);
  const declared = (...entries) => entries.map(([seat, role, extra]) => ({ seat, role, ...(extra ?? {}) }));
  const resolve = (o) => seats.resolveSeats(o);
  const unitW = { id: 'u', objective: 'do', writes: ['src'], capability: 'code:implement' };
  const unitR = { id: 'u', objective: 'do', writes: [], capability: 'review' };
  const resolveCases = {
    'solo default writes': { loop: 'solo', unit: unitW, runnerConfig: runnerCfg },
    'solo default read only': { loop: 'solo', unit: unitR, runnerConfig: runnerCfg },
    'loop from pattern string': { pattern: 'solo', unit: unitW },
    'loop from pattern object with params': { pattern: { pattern: 'solo', params: { seats: declared(['maker', 'producer', { persona: ' sage ' }]) } }, unit: unitW },
    'solo declared tier and persona': { loop: 'solo', params: { seats: declared(['maker', 'producer', { persona: 'sage', tier: 'high' }]) }, unit: unitW },
    'solo declared two seats': { loop: 'solo', params: { seats: declared(['a', 'producer'], ['b', 'producer']) }, unit: unitW },
    'solo declared wrong role': { loop: 'solo', params: { seats: declared(['a', 'judge']) }, unit: unitW },
    'seats from the unit': { loop: 'solo', unit: { ...unitW, seats: declared(['own', 'producer']) } },
    'seats preresolved pass through': { loop: 'solo', params: { seats: [{ seat: 'x', role: 'producer', posture: posture({ writer: true }) }] }, unit: unitW },
    'seats not an array': { loop: 'solo', params: { seats: 'x' }, unit: unitW },
    'seats empty': { loop: 'solo', params: { seats: [] }, unit: unitW },
    'seat entry not object': { loop: 'solo', params: { seats: ['a'] }, unit: unitW },
    'seat unknown key': { loop: 'solo', params: { seats: [{ seat: 'a', role: 'producer', extra: 1 }] }, unit: unitW },
    'seat reserved id verify': { loop: 'solo', params: { seats: declared(['verify', 'producer']) }, unit: unitW },
    'seat reserved layout id': { loop: 'solo', params: { seats: declared(['runs', 'producer']) }, unit: unitW },
    'seat id with capitals': { loop: 'solo', params: { seats: declared(['Maker', 'producer']) }, unit: unitW },
    'seat id missing': { loop: 'solo', params: { seats: [{ role: 'producer' }] }, unit: unitW },
    'seat id duplicate': { loop: 'panel', params: { seats: declared(['a', 'producer'], ['a', 'synthesizer']) }, unit: unitW },
    'seat role unknown': { loop: 'solo', params: { seats: declared(['a', 'wizard']) }, unit: unitW },
    'seat persona blank': { loop: 'solo', params: { seats: [{ seat: 'a', role: 'producer', persona: '  ' }] }, unit: unitW },
    'reviewed default high rigor': { loop: 'reviewed', unit: unitW, runnerConfig: runnerCfg },
    'reviewed default critical read only': { loop: 'reviewed', unit: unitR, runnerConfig: runnerCfg },
    'reviewed low falls back to standard row': { loop: 'reviewed', unit: { id: 'u', objective: 'x', rigor: 'low' }, runnerConfig: { loops: { reviewed: { checkersByRigor: { standard: ['reviewer'] } } } } },
    'reviewed shipped table': { loop: 'reviewed', unit: { id: 'u', objective: 'x' }, runnerConfig: {}, shippedCheckersByRigor: shippedRigor },
    'reviewed missing table': { loop: 'reviewed', unit: { id: 'u', objective: 'x' }, runnerConfig: {} },
    'reviewed low missing table': { loop: 'reviewed', unit: { id: 'u', objective: 'x', rigor: 'low' }, runnerConfig: {} },
    'reviewed capability minCheckers string tester': { loop: 'reviewed', unit: { id: 'u', objective: 'x', capability: 'docs' }, runnerConfig: runnerCfg },
    'reviewed prefix capability minCheckers': { loop: 'reviewed', unit: { id: 'u', objective: 'x', capability: 'code:other' }, runnerConfig: runnerCfg, shippedCheckersByRigor: shippedRigor },
    'reviewed code default red-team': { loop: 'reviewed', unit: { id: 'u', objective: 'x', capability: 'code' }, runnerConfig: {}, shippedCheckersByRigor: shippedRigor },
    'reviewed requested checkers': { loop: 'reviewed', params: { minCheckers: ['tester', 'red-team'] }, unit: { id: 'u', objective: 'x' }, runnerConfig: {}, shippedCheckersByRigor: shippedRigor },
    'reviewed requested one string': { loop: 'reviewed', params: { minCheckers: 'tester' }, unit: { id: 'u', objective: 'x' }, runnerConfig: {}, shippedCheckersByRigor: shippedRigor },
    'reviewed requested unknown checker': { loop: 'reviewed', params: { minCheckers: ['wizard'] }, unit: { id: 'u', objective: 'x' }, runnerConfig: {}, shippedCheckersByRigor: shippedRigor },
    'reviewed floors': { loop: 'reviewed', floors: { minCheckers: [{ name: 'red-team', source: 'gate' }, 'tester'] }, unit: { id: 'u', objective: 'x' }, runnerConfig: {}, shippedCheckersByRigor: shippedRigor },
    'reviewed bad capability rigor': { loop: 'reviewed', unit: { id: 'u', objective: 'x', capability: 'weird:x' }, runnerConfig: runnerCfg },
    'reviewed bad unit rigor': { loop: 'reviewed', unit: { id: 'u', objective: 'x', rigor: 'extreme' }, runnerConfig: runnerCfg },
    'reviewed declared seats match': { loop: 'reviewed', params: { seats: declared(['maker', 'producer'], ['look', 'reviewer', { tier: 'x' }], ['poke', 'red-team']) }, unit: unitW, runnerConfig: runnerCfg },
    'reviewed declared tester takes reviewer role': { loop: 'reviewed', params: { minCheckers: ['tester'], seats: declared(['maker', 'producer'], ['look', 'reviewer'], ['poke', 'red-team'], ['run', 'reviewer']) }, unit: unitW, runnerConfig: runnerCfg },
    'reviewed declared missing checker': { loop: 'reviewed', params: { seats: declared(['maker', 'producer'], ['look', 'reviewer']) }, unit: unitW, runnerConfig: runnerCfg },
    'reviewed declared extra checker': { loop: 'reviewed', params: { seats: declared(['maker', 'producer'], ['look', 'reviewer'], ['poke', 'red-team'], ['more', 'reviewer']) }, unit: unitW, runnerConfig: runnerCfg },
    'reviewed declared weakens invariant': { loop: 'reviewed', floors: { minCheckers: [{ name: 'red-team', source: 'gate' }] }, params: { seats: declared(['maker', 'producer'], ['look', 'reviewer']) }, unit: { id: 'u', objective: 'x' }, runnerConfig: {}, shippedCheckersByRigor: shippedRigor },
    'reviewed declared two producers': { loop: 'reviewed', params: { seats: declared(['a', 'producer'], ['b', 'producer']) }, unit: unitW, runnerConfig: runnerCfg },
    'panel declared': { loop: 'panel', params: { seats: declared(['m1', 'producer'], ['m2', 'producer'], ['sum', 'synthesizer']) }, unit: unitW },
    'panel read only synthesizer': { loop: 'panel', params: { seats: declared(['m1', 'producer'], ['sum', 'synthesizer']) }, unit: unitR },
    'panel without seats': { loop: 'panel', unit: unitW },
    'panel no synthesizer': { loop: 'panel', params: { seats: declared(['m1', 'producer']) }, unit: unitW },
    'panel stray role': { loop: 'panel', params: { seats: declared(['m1', 'producer'], ['s', 'synthesizer'], ['j', 'judge']) }, unit: unitW },
    'research-fan-out becomes a panel': { loop: 'research-fan-out', unit: unitR },
    'debate declared order': { loop: 'debate', params: { seats: declared(['j', 'judge'], ['pro', 'producer'], ['con', 'producer']) }, unit: unitW },
    'debate one side': { loop: 'debate', params: { seats: declared(['pro', 'producer'], ['j', 'judge']) }, unit: unitW },
    'debate without seats': { loop: 'debate', unit: unitW },
    'unknown loop': { loop: 'swarm', unit: unitW },
  };
  for (const [name, options] of Object.entries(resolveCases)) add(`resolveSeats: ${name}`, 'resolveSeats', [options], { call: resolve });
  const rawDeclared = [[{ seat: 'a', role: 'producer', persona: ' p ', tier: 'x' }], 'seats', { tiers: ['x', 'y'] }];
  add('checkDeclaredSeats: trims persona, keeps tier', 'checkDeclaredSeats', rawDeclared, { call: seats.checkDeclaredSeats });
  add('checkDeclaredSeats: tier outside the ladder', 'checkDeclaredSeats', [[{ seat: 'a', role: 'producer', tier: 'z' }], 'seats', { tiers: ['x', 'y'] }], { call: seats.checkDeclaredSeats });
  add('checkDeclaredSeats: label shows in the message', 'checkDeclaredSeats', [[{ seat: 'a', role: 'nope' }], 'unit.seats'], { call: seats.checkDeclaredSeats });
  add('checkDeclaredSeats: not an array', 'checkDeclaredSeats', [{}, 'seats'], { call: seats.checkDeclaredSeats });
  add('checkDeclaredSeats: seat id of the wrong type', 'checkDeclaredSeats', [[{ seat: 5, role: 'producer' }], 'seats'], { call: seats.checkDeclaredSeats });
  for (const [name, args] of Object.entries({
    solo: { loop: 'solo', unit: unitW },
    'reviewed default rounds': { loop: 'reviewed', unit: unitW, runnerConfig: runnerCfg },
    'reviewed three rounds': { loop: 'reviewed', params: { maxRounds: 3 }, unit: unitW, runnerConfig: runnerCfg },
    'panel': { loop: 'panel', params: { seats: declared(['m1', 'producer'], ['m2', 'producer'], ['s', 'synthesizer']) }, unit: unitW },
    'debate with rebuttal': { loop: 'debate', params: { seats: declared(['p', 'producer'], ['c', 'producer'], ['j', 'judge']) }, unit: unitW },
    'debate without rebuttal': { loop: 'debate', params: { rebuttal: false, seats: declared(['p', 'producer'], ['c', 'producer'], ['j', 'judge']) }, unit: unitW },
    'unknown loop is null': { loop: 'swarm', unit: unitW },
    'error from the resolver': { loop: 'panel', unit: unitW },
  })) add(`seatLaunchesOf: ${name}`, 'seatLaunchesOf', [args], { call: seats.seatLaunchesOf });
  for (const seat of [{ role: 'producer', posture: posture({ stance: true }) }, { role: 'synthesizer' }, { role: 'judge' }, { role: 'producer', posture: posture() }, { role: 'red-team' }, { role: 'reviewer', posture: { stance: false } }]) {
    add(`seatKind ${JSON.stringify(seat)}`, 'seatKind', [seat], { call: seats.seatKind });
  }
  const record = {
    unit: { id: 'unit-1', tier: 'fast' },
    workflowId: 'wf',
    seats: [{ seat: 'maker', role: 'producer', posture: posture({ writer: true }), persona: 'sage', tier: 'high' }, { seat: 'look', role: 'reviewer', posture: posture({ readOnly: true }) }],
  };
  add('bindSeatOf: a recorded seat with its own tier', 'bindSeatOf', [record, 'maker'], { call: seats.bindSeatOf });
  add('bindSeatOf: a recorded seat takes its unit tier', 'bindSeatOf', [record, 'look'], { call: seats.bindSeatOf });
  add('bindSeatOf: an unlisted seat is the producer', 'bindSeatOf', [record, 'other'], { call: seats.bindSeatOf });
  add('bindSeatOf: no tier anywhere', 'bindSeatOf', [{ seats: [] }, 'x'], { call: seats.bindSeatOf });
  add('workflowTierOf: no workflow id', 'workflowTierOf', [{ seat: 's', tier: 't' }, { id: 'u' }, undefined], { call: seats.workflowTierOf });
  add('assertNoSeatTier: clean', 'assertNoSeatTier', [[{ seat: 'a' }], 'unit file'], { call: seats.assertNoSeatTier });
  add('assertNoSeatTier: carries a tier', 'assertNoSeatTier', [[{ seat: 'a', tier: 'x' }], 'unit file'], { call: seats.assertNoSeatTier });
  add('assertNoUnitTier: carries a tier', 'assertNoUnitTier', [{ tier: 'x' }, 'stdin'], { call: seats.assertNoUnitTier });
  add('assertNoUnitTier: clean', 'assertNoUnitTier', [{}, 'stdin'], { call: seats.assertNoUnitTier });
  for (const [name, args] of Object.entries({ 'unit rigor wins': [{ rigor: 'critical', capability: 'docs' }, runnerCfg], 'capability rigor stronger': [{ rigor: 'low', capability: 'code:implement' }, runnerCfg], 'fallback': [{}, {}], 'bad value': [{ rigor: 'x' }, {}] })) {
    add(`effectiveRigorOf: ${name}`, 'effectiveRigorOf', [...args, { fallback: 'standard' }], { call: seats.effectiveRigorOf });
  }
  add('effectiveRigorOf: no fallback', 'effectiveRigorOf', [{}, {}, {}], { call: seats.effectiveRigorOf });
  for (const [name, unit] of Object.entries({ high: unitW, critical: unitR, low: { capability: 'docs' }, none: {} })) {
    add(`requiresDistinctFamilies: ${name}`, 'requiresDistinctFamilies', [unit, runnerCfg], { call: seats.requiresDistinctFamilies });
  }
  add('checkerPlanOf: contributions by source', 'checkerPlanOf', [{ id: 'u', capability: 'code:implement', rigor: 'critical' }, runnerCfg, { requested: ['tester', { name: 'red-team', source: 'by-hand' }], floors: { minCheckers: ['reviewer'] }, slot: 'workflow', shippedCheckersByRigor: shippedRigor }], { call: seats.checkerPlanOf });
  add('checkerPlanOf: a request slot', 'checkerPlanOf', [{ id: 'u' }, runnerCfg, { requested: ['tester'], slot: 'request' }], { call: seats.checkerPlanOf });
  add('checkerPlanOf: a param slot', 'checkerPlanOf', [{ id: 'u' }, runnerCfg, { requested: ['tester'], slot: 'param:x' }], { call: seats.checkerPlanOf });
  add('checkerPlanOf: an array is the request', 'checkerPlanOf', [{ id: 'u' }, runnerCfg, ['tester']], { call: seats.checkerPlanOf });
  write('seats', 'Seat resolution, recorded from src/runner/execution/seat-resolver.mjs. A case is { id, fn, args, expected }; resolveSeats takes the options object with unit, runnerConfig, params, floors and shippedCheckersByRigor as given.', { tables: { roles: seats.SEAT_ROLES, loops: seats.LOOP_NAMES, checkerSeats: seats.CHECKER_SEATS, reserved: seats.RESERVED_SEAT_IDS, verifySeat: seats.VERIFY_SEAT, syncSeat: seats.SYNC_SEAT }, cases: list });
}

// ---------------------------------------------------------------------------------------------------- legacy
{
  const list = [];
  const add = addTo(list);
  const shipped = {
    patterns: { solo: { loop: 'solo' }, review: { loop: 'reviewed', defaults: { minCheckers: ['reviewer'] }, params: { maxRounds: 4 } }, custom: { loop: 'panel', defaults: { rebuttal: true } } },
    loops: { reviewed: { maxRounds: 2 } },
  };
  const records = {
    'solo by name': { pattern: 'solo', unit: { id: 'u' } },
    'solo from unit pattern': { unit: { id: 'u', pattern: 'solo' } },
    'consult preset names its role': { pattern: 'consult' },
    'object pattern with params': { pattern: { pattern: 'solo', params: { role: 'advisor' } } },
    'no pattern at all': { unit: { id: 'u' } },
    'reviewed standard unit': { pattern: 'reviewed', unit: { id: 'u', capability: 'docs' } },
    'reviewed high rigor in code': { pattern: 'reviewed', unit: { id: 'u', rigor: 'high', capability: 'code:implement' } },
    'reviewed with snapshot table and params': { pattern: { pattern: 'reviewed', params: { minCheckers: ['tester', 'reviewer'] } }, unit: { id: 'u', rigor: 'low' }, configSnapshot: { runner: { patterns: { reviewed: { checkersByRigor: { low: ['red-team'] }, maxRounds: 5 } }, capabilities: { docs: { minCheckers: ['red-team'] } } } } },
    'reviewed min checkers as one string': { pattern: { pattern: 'reviewed', params: { minCheckers: 'tester' } }, unit: { id: 'u' } },
    'code-change preset': { pattern: 'code-change', unit: { id: 'u' } },
    'rfc preset': { pattern: 'rfc', unit: { id: 'u' } },
    'panel default three': { pattern: 'panel' },
    'panel with member count from the snapshot': { pattern: 'panel', configSnapshot: { runner: { patterns: { panel: { members: 2 } } } } },
    'research fan out': { pattern: 'research-fan-out' },
    'research fan out gated with role list': { pattern: { pattern: 'research-fan-out-gated', params: { role: ['alpha', 'beta'] } } },
    'debate': { pattern: 'debate' },
    'unknown pattern': { pattern: 'swarm' },
    'a fenced record keeps its seats': { seatSchema: 2, seats: [{ seat: 'x', role: 'producer', posture: posture() }], pattern: 'debate' },
    'seatSchema zero is pre-fence': { seatSchema: 0, pattern: 'solo' },
    'a fenced record with no seat list': { seatSchema: 1 },
    'stored collaboration is returned as is': { collaboration: { pattern: { name: 'solo' }, effective: { loop: 'solo', params: {}, seats: [] } }, configSnapshot: { runner: { a: 1 } } },
  };
  for (const [name, record] of Object.entries(records)) {
    add(`legacySeatsOf: ${name}`, 'legacySeatsOf', [record], { call: legacy.legacySeatsOf });
    add(`isSeatRecord: ${name}`, 'isSeatRecord', [record], { call: legacy.isSeatRecord });
    add(`seatsOfRecord: ${name}`, 'seatsOfRecord', [record], { call: legacy.seatsOfRecord });
    add(`collaborationOfRecord: ${name}`, 'collaborationOfRecord', [record, { shipped }], { call: legacy.collaborationOfRecord });
  }
  add('collaborationOfRecord: a shipped catalog without a patterns key', 'collaborationOfRecord', [{ pattern: 'review' }, { shipped: shipped.patterns }], { call: legacy.collaborationOfRecord });
  add('collaborationOfRecord: no shipped catalog', 'collaborationOfRecord', [{ pattern: 'reviewed' }, {}], { call: legacy.collaborationOfRecord });
  add('collaborationOfRecord: a shipped pattern whose defaults the selector overrides', 'collaborationOfRecord', [{ pattern: { pattern: 'review', params: { maxRounds: 9 } } }, { shipped }], { call: legacy.collaborationOfRecord });
  add('collaborationOfRecord: custom pattern with stored seats', 'collaborationOfRecord', [{ pattern: 'custom', seatSchema: 2, seats: [{ seat: 'a', role: 'producer', persona: 'p', tier: 't', posture: posture() }] }, { shipped }], { call: legacy.collaborationOfRecord });
  for (const result of [
    { seat: 'producer' }, { role: 'reviewer' }, { seat: null, role: 'judge' }, {}, { seat: 'verify' }, { seat: 'verifier' }, { role: 'verify' }, { seat: 'verify2' },
    { seat: 'red-team-2' }, { seat: 'checker-a' }, { seat: 'reviewer', posture: posture({ verdict: true }) }, { seat: 'reviewer', posture: posture() }, { seat: 'tester', posture: {} },
  ]) {
    add(`isVerdictResult ${JSON.stringify(result)}`, 'isVerdictResult', [result], { call: legacy.isVerdictResult });
    add(`isVerifyResult ${JSON.stringify(result)}`, 'isVerifyResult', [result], { call: legacy.isVerifyResult });
    add(`seatKeyOf ${JSON.stringify(result)}`, 'seatKeyOf', [result], { call: legacy.seatKeyOf });
  }
  add('legacyFamilyOf: from the run policy', 'legacyFamilyOf', [{ runResult: { policy: { providerModel: 'codex' } } }], { call: legacy.legacyFamilyOf });
  add('legacyFamilyOf: none', 'legacyFamilyOf', [{}], { call: legacy.legacyFamilyOf });
  write('legacy', 'The legacy seat read, recorded from src/runner/execution/legacy-seat-read.mjs: which seats a record written before seats existed had, whether a record is fenced, and how a record without `collaboration` decodes. collaborationOfRecord is given { shipped } as its second argument.', { cases: list });
}

// ---------------------------------------------------------------------------------------------------- loops
{
  const list = [];
  const add = addTo(list);
  const params = (roleTasks) => ({ roleTasks });
  const baseUnit = { id: 'u', objective: 'fix the bug', capability: 'code:implement', writes: ['src'] };
  for (const kind of ['synthesizer', 'thesis', 'antithesis', 'thesis-rebuttal', 'antithesis-rebuttal', 'judge', 'reviewer', 'red-team', 'producer', 'panelist']) {
    add(`roleUnit: ${kind}`, 'roleUnit', [baseUnit, { seat: `s-${kind}`, kind, params: {}, findings: [] }], { call: roleUnit });
  }
  add('roleUnit: seat named after a kind', 'roleUnit', [baseUnit, { seat: 'reviewer' }], { call: roleUnit });
  add('roleUnit: override by seat id wins over kind', 'roleUnit', [baseUnit, { seat: 'a', kind: 'reviewer', params: params({ a: 'Look at {objective} twice', reviewer: 'no' }) }], { call: roleUnit });
  add('roleUnit: override without placeholder appends the objective', 'roleUnit', [baseUnit, { seat: 'a', params: params({ a: 'Be brief.' }) }], { call: roleUnit });
  add('roleUnit: dollar signs in the objective are text', 'roleUnit', [{ ...baseUnit, objective: 'cost $& and $1' }, { seat: 'a', params: params({ a: 'X {objective} Y {objective}' }) }], { call: roleUnit });
  add('roleUnit: findings are listed for a producer', 'roleUnit', [baseUnit, { seat: 'producer', kind: 'producer', findings: ['one', 'two'] }], { call: roleUnit });
  add('roleUnit: findings after a task', 'roleUnit', [baseUnit, { seat: 'a', kind: 'reviewer', findings: ['x'] }], { call: roleUnit });
  add('roleUnit: stance options for a panelist', 'roleUnit', [{ ...baseUnit, stanceOptions: ['yes', 'no'] }, { seat: 'm1', kind: 'panelist', stance: true }], { call: roleUnit });
  add('roleUnit: stance without options changes nothing', 'roleUnit', [baseUnit, { seat: 'm1', kind: 'panelist', stance: true }], { call: roleUnit });
  add('roleUnit: findings and stance together', 'roleUnit', [{ ...baseUnit, stanceOptions: ['a'] }, { seat: 'm', kind: 'synthesizer', stance: true, findings: ['f'] }], { call: roleUnit });
  add('roleUnit: a non-text override is ignored', 'roleUnit', [baseUnit, { seat: 'a', kind: 'producer', params: params({ a: 5 }) }], { call: roleUnit });
  for (const [name, answerValue] of Object.entries({ pass: { pass: true }, findings: { findings: ['x', 'y'] }, 'findings default': {}, timeout: { infrastructure: 'timeout', error: 'slow' }, 'not run': { infrastructure: 'not-run' }, undefinedAnswer: undefined })) {
    add(`verifySeatResult: ${name}`, 'verifySeatResult', [answerValue ?? null, 3], { call: (a, r) => verifySeatResult(a ?? undefined, r) });
  }
  const cfgVerify = { capabilities: { 'code:implement': { verify: 'npm test' }, blank: { verify: '  ' }, num: { verify: 5 } } };
  for (const [name, unit] of Object.entries({ 'own verify': { verify: 'make' }, 'capability verify': { capability: 'code:implement' }, 'blank capability verify': { capability: 'blank' }, 'non-string verify': { capability: 'num' }, 'own non-string wins': { verify: 7, capability: 'code:implement' }, none: {} })) {
    add(`verifyCommandOf: ${name}`, 'verifyCommandOf', [unit, cfgVerify], { call: verifyCommandOf });
  }
  for (const [name, args] of Object.entries({ 'one string': ['a'], list: [['a', { x: 1 }]], none: [undefined] })) void name, args;
  for (const f of [{ findings: ['a'] }, { findings: [], outcome: 'findings', seat: 'reviewer' }, { findings: 'text' }, { finding: 'single' }, { outcome: 'findings' }, { outcome: 'pass' }, null]) {
    add(`extractFindings ${JSON.stringify(f)}`, 'extractFindings', [f], { call: extractFindings });
  }
  for (const name of ['solo', 'reviewed', 'panel', 'debate', 'swarm']) {
    add(`loopRunsVerify ${name}`, 'loopRunsVerify', [name], { call: loops.loopRunsVerify });
    add(`paramTableOf ${name}`, 'paramTableOf', [name], { call: loops.paramTableOf });
  }

  // ---- scripted loop runs: the engine's part is played by a table of answers.
  const seatsDecl = (...entries) => entries.map(([seat, role]) => ({ seat, role }));
  const runs = [];
  const unit = { id: 'u', objective: 'fix', capability: 'code:implement', writes: ['src'] };
  const noVerifyUnit = { id: 'u', objective: 'fix', writes: ['src'] };
  const res = (seat, outcomeValue, extra = {}) => ({ seat, outcome: outcomeValue, ...extra });
  const rres = (seat, round, outcomeValue, extra = {}) => ({ seat, round, outcome: outcomeValue, ...extra });
  const run = (id, scenario) => runs.push({ id, ...scenario });
  const verifyCfg = { capabilities: { 'code:implement': { verify: 'npm test', rigor: 'standard', minCheckers: [] } }, loops: { reviewed: { checkersByRigor: { standard: ['reviewer'], high: ['reviewer', 'red-team'] } } } };
  const reviewedParams = { maxRounds: 3 };
  run('solo passes without a verify command', { loop: 'solo', unit: noVerifyUnit, cfg: {}, params: {}, results: { 'producer/1': res('producer', 'pass') } });
  run('solo fails and goes no further', { loop: 'solo', unit: unit, cfg: verifyCfg, params: {}, results: { 'producer/1': res('producer', 'execution-failure') } });
  run('solo passes then verify passes', { loop: 'solo', unit: unit, cfg: verifyCfg, params: {}, results: { 'producer/1': res('producer', 'pass') }, verify: [{ pass: true }] });
  run('solo verify finds', { loop: 'solo', unit: unit, cfg: verifyCfg, params: {}, results: { 'producer/1': res('producer', 'pass') }, verify: [{ findings: ['lint'] }] });
  run('solo verify cannot run', { loop: 'solo', unit: unit, cfg: verifyCfg, params: {}, results: { 'producer/1': res('producer', 'pass') }, verify: [{ infrastructure: 'timeout', error: 'slow' }] });
  run('solo reuses a passed producer and passed verify', { loop: 'solo', unit: unit, cfg: verifyCfg, params: {}, history: [res('producer', 'pass'), rres('verify', 1, 'pass', { findings: [] })], results: {} });
  run('solo reuses a passed producer and runs verify', { loop: 'solo', unit: unit, cfg: verifyCfg, params: {}, history: [res('producer', 'pass')], results: {}, verify: [{ pass: true }] });
  run('solo with a declared seat', { loop: 'solo', unit: noVerifyUnit, cfg: {}, params: { seats: seatsDecl(['maker', 'producer']) }, results: { 'maker/1': res('maker', 'blocked') } });
  run('solo with a bad seat declaration', { loop: 'solo', unit: noVerifyUnit, cfg: {}, params: { seats: seatsDecl(['maker', 'judge']) }, results: {} });
  const chk = (extra = {}) => ({ loop: 'reviewed', unit, cfg: verifyCfg, shipped: undefined, params: reviewedParams, ...extra });
  run('reviewed passes in one round', chk({ results: { 'producer/1': rres('producer', 1, 'pass'), 'reviewer/1': rres('reviewer', 1, 'pass') }, verify: [{ pass: true }] }));
  run('reviewed finds, the producer fixes, the second round passes', chk({
    results: {
      'producer/1': rres('producer', 1, 'pass'), 'reviewer/1': rres('reviewer', 1, 'findings', { findings: ['missing test', 'typo'] }),
      'producer/2': rres('producer', 2, 'pass'), 'reviewer/2': rres('reviewer', 2, 'pass'),
    },
    verify: [{ pass: true }, { pass: true }],
  }));
  run('reviewed keeps finding to the last round', chk({
    params: { maxRounds: 2 },
    results: { 'producer/1': rres('producer', 1, 'pass'), 'reviewer/1': rres('reviewer', 1, 'findings', { findings: ['a'] }), 'producer/2': rres('producer', 2, 'pass'), 'reviewer/2': rres('reviewer', 2, 'findings', { findings: ['b'] }) },
    verify: [{ findings: ['v1'] }, { findings: ['v2'] }],
  }));
  run('reviewed verify alone finds', chk({ results: { 'producer/1': rres('producer', 1, 'pass'), 'reviewer/1': rres('reviewer', 1, 'pass'), 'producer/2': rres('producer', 2, 'pass'), 'reviewer/2': rres('reviewer', 2, 'pass') }, verify: [{ findings: ['lint'] }, { pass: true }] }));
  run('reviewed verify cannot run ends the round in error', chk({ results: { 'producer/1': rres('producer', 1, 'pass'), 'reviewer/1': rres('reviewer', 1, 'pass') }, verify: [{ infrastructure: 'not-run' }] }));
  run('reviewed producer fails', chk({ results: { 'producer/1': rres('producer', 1, 'provider-limit') } }));
  const changedNothing = { runResult: { classification: { confidence: { level: 'no-evidence' }, assessment: { verdict: 'inconclusive' } } } };
  run('reviewed producer that changed nothing still goes to its checks', chk({ unit: noVerifyUnit, cfg: { loops: verifyCfg.loops }, results: { 'producer/1': rres('producer', 1, 'execution-failure', changedNothing), 'reviewer/1': rres('reviewer', 1, 'pass') } }));
  run('reviewed producer that crashed stops even with a classification', chk({ unit: noVerifyUnit, cfg: { loops: verifyCfg.loops }, results: { 'producer/1': rres('producer', 1, 'execution-failure', { runResult: { classification: { ...changedNothing.runResult.classification, failure: { kind: 'crash' } } } }) } }));
  run('reviewed a checker fails', chk({ unit: noVerifyUnit, cfg: { loops: verifyCfg.loops }, results: { 'producer/1': rres('producer', 1, 'pass'), 'reviewer/1': rres('reviewer', 1, 'blocked') } }));
  run('reviewed high rigor needs distinct families and two checkers', chk({ unit: { ...noVerifyUnit, rigor: 'high' }, cfg: { loops: verifyCfg.loops }, results: { 'producer/1': rres('producer', 1, 'pass'), 'reviewer/1': rres('reviewer', 1, 'pass'), 'red-team/1': rres('red-team', 1, 'pass') } }));
  run('reviewed resumes a fully settled history', chk({
    history: [rres('producer', 1, 'pass'), rres('reviewer', 1, 'findings', { findings: ['a'] }), rres('verify', 1, 'pass', { findings: [] })],
    results: { 'producer/2': rres('producer', 2, 'pass'), 'reviewer/2': rres('reviewer', 2, 'pass') }, verify: [{ pass: true }],
  }));
  run('reviewed resumes a round whose checker never reported', chk({
    history: [rres('producer', 1, 'pass')], results: { 'reviewer/1': rres('reviewer', 1, 'pass') }, verify: [{ pass: true }],
  }));
  run('reviewed resumes with a failed checker rerun and passed verify reused', chk({
    history: [rres('producer', 1, 'pass'), rres('reviewer', 1, 'execution-failure'), rres('verify', 1, 'pass', { findings: [] })], results: { 'reviewer/1': rres('reviewer', 1, 'pass') },
  }));
  run('reviewed resume ends on a settled error', chk({ history: [rres('producer', 1, 'blocked')], results: {} }));
  run('reviewed a seat-launch ceiling stops the second round', chk({
    launchRoom: 1, results: { 'producer/1': rres('producer', 1, 'pass'), 'reviewer/1': rres('reviewer', 1, 'findings', { findings: ['a'] }) }, verify: [{ pass: true }],
  }));
  run('reviewed a ceiling with room lets the second round run', chk({
    launchRoom: 5, results: { 'producer/1': rres('producer', 1, 'pass'), 'reviewer/1': rres('reviewer', 1, 'findings', { findings: ['a'] }), 'producer/2': rres('producer', 2, 'pass'), 'reviewer/2': rres('reviewer', 2, 'pass') }, verify: [{ pass: true }, { pass: true }],
  }));
  run('reviewed declared seats with a tester', chk({
    unit: noVerifyUnit, cfg: { loops: verifyCfg.loops }, params: { maxRounds: 1, minCheckers: ['tester'], seats: seatsDecl(['maker', 'producer'], ['look', 'reviewer'], ['run', 'reviewer']) },
    results: { 'maker/1': rres('maker', 1, 'pass'), 'look/1': rres('look', 1, 'pass'), 'run/1': rres('run', 1, 'findings') },
  }));
  run('reviewed without maxRounds is refused', chk({ params: {}, results: {} }));
  run('reviewed with a bad maxRounds is refused', chk({ params: { maxRounds: 0 }, results: {} }));
  run('reviewed with a bad rigor is refused', chk({ unit: { ...noVerifyUnit, rigor: 'extreme' }, cfg: { loops: verifyCfg.loops }, results: {} }));
  run('reviewed gets the default red-team for code work', chk({ unit: { id: 'u', objective: 'fix', capability: 'code', writes: ['src'] }, cfg: {}, shipped: { standard: ['reviewer'] }, results: { 'producer/1': rres('producer', 1, 'pass'), 'reviewer/1': rres('reviewer', 1, 'pass'), 'red-team/1': rres('red-team', 1, 'findings', { findings: ['x'] }), 'producer/2': rres('producer', 2, 'pass'), 'reviewer/2': rres('reviewer', 2, 'pass'), 'red-team/2': rres('red-team', 2, 'pass') } }));
  run('reviewed uses the shipped checker table', chk({ unit: noVerifyUnit, cfg: {}, shipped: { standard: ['reviewer'] }, results: { 'producer/1': rres('producer', 1, 'pass'), 'reviewer/1': rres('reviewer', 1, 'pass') } }));
  const panelSeats = seatsDecl(['m1', 'producer'], ['m2', 'producer'], ['sum', 'synthesizer']);
  run('panel members then the synthesizer', { loop: 'panel', unit: { ...noVerifyUnit, stanceOptions: ['a', 'b'] }, cfg: {}, params: { seats: panelSeats }, results: { 'm1/1': res('m1', 'pass'), 'm2/1': res('m2', 'pass'), 'sum/1': res('sum', 'pass') } });
  run('panel a member fails', { loop: 'panel', unit: noVerifyUnit, cfg: {}, params: { seats: panelSeats }, results: { 'm1/1': res('m1', 'pass'), 'm2/1': res('m2', 'provider-limit') } });
  run('panel reuses passed members', { loop: 'panel', unit: noVerifyUnit, cfg: {}, params: { seats: panelSeats }, history: [res('m1', 'pass')], results: { 'm2/1': res('m2', 'pass'), 'sum/1': res('sum', 'findings') } });
  run('panel reuses everything', { loop: 'panel', unit: noVerifyUnit, cfg: {}, params: { seats: panelSeats }, history: [res('m1', 'pass'), res('m2', 'pass'), res('sum', 'pass')], results: {} });
  run('panel role task override', { loop: 'panel', unit: noVerifyUnit, cfg: {}, params: { seats: panelSeats, roleTasks: { sum: 'Merge: {objective}' } }, results: { 'm1/1': res('m1', 'pass'), 'm2/1': res('m2', 'pass'), 'sum/1': res('sum', 'pass') } });
  run('panel without seats is refused', { loop: 'panel', unit: noVerifyUnit, cfg: {}, params: {}, results: {} });
  const debateSeats = seatsDecl(['pro', 'producer'], ['con', 'producer'], ['judge', 'judge']);
  run('debate with rebuttal', { loop: 'debate', unit: noVerifyUnit, cfg: {}, params: { seats: debateSeats }, results: {
    'pro/1': rres('pro', 1, 'pass'), 'con/1': rres('con', 1, 'pass'), 'pro/2': rres('pro', 2, 'pass'), 'con/2': rres('con', 2, 'pass'), 'judge/1': res('judge', 'pass'),
  } });
  run('debate without rebuttal', { loop: 'debate', unit: noVerifyUnit, cfg: {}, params: { seats: debateSeats, rebuttal: false }, results: { 'pro/1': rres('pro', 1, 'pass'), 'con/1': rres('con', 1, 'pass'), 'judge/1': res('judge', 'findings') } });
  run('debate a side fails in round one', { loop: 'debate', unit: noVerifyUnit, cfg: {}, params: { seats: debateSeats }, results: { 'pro/1': rres('pro', 1, 'pass'), 'con/1': rres('con', 1, 'blocked') } });
  run('debate a side fails in round two', { loop: 'debate', unit: noVerifyUnit, cfg: {}, params: { seats: debateSeats }, results: { 'pro/1': rres('pro', 1, 'pass'), 'con/1': rres('con', 1, 'pass'), 'pro/2': rres('pro', 2, 'execution-failure'), 'con/2': rres('con', 2, 'pass') } });
  run('debate reuses round one and the judge', { loop: 'debate', unit: noVerifyUnit, cfg: {}, params: { seats: debateSeats }, history: [rres('pro', 1, 'pass'), rres('con', 1, 'pass'), res('judge', 'pass')], results: { 'pro/2': rres('pro', 2, 'pass'), 'con/2': rres('con', 2, 'pass') } });
  run('debate rebuttal false as null still rebuts', { loop: 'debate', unit: noVerifyUnit, cfg: {}, params: { seats: debateSeats, rebuttal: null }, results: { 'pro/1': rres('pro', 1, 'pass'), 'con/1': rres('con', 1, 'pass'), 'pro/2': rres('pro', 2, 'pass'), 'con/2': rres('con', 2, 'pass'), 'judge/1': res('judge', 'pass') } });
  run('debate with one side is refused', { loop: 'debate', unit: noVerifyUnit, cfg: {}, params: { seats: seatsDecl(['pro', 'producer'], ['judge', 'judge']) }, results: {} });
  run('an unknown loop is refused', { loop: 'swarm', unit: noVerifyUnit, cfg: {}, params: {}, results: {} });
  run('an effective loop carries its seats beside its params', { loop: 'panel', effectiveSeats: panelSeats, unit: noVerifyUnit, cfg: {}, params: {}, results: { 'm1/1': res('m1', 'pass'), 'm2/1': res('m2', 'pass'), 'sum/1': res('sum', 'pass') } });

  const describeCall = (args) => ({
    seat: args.seat.seat,
    objective: args.unit.objective,
    ...(args.round !== undefined ? { round: args.round } : {}),
    ...(args.preferIndependentOf !== undefined ? { preferIndependentOf: args.preferIndependentOf } : {}),
    ...(args.independentOf !== undefined ? { independentOf: args.independentOf } : {}),
    ...(args.inputs !== undefined ? { inputs: args.inputs.map((r) => ({ seat: r?.seat, round: r?.round, outcome: r?.outcome })) } : {}),
    ...(args.batch !== undefined ? { batch: args.batch.size } : {}),
  });
  const recorded = [];
  for (const scenario of runs) {
    const calls = [];
    const verifyAnswers = [...(scenario.verify ?? [])];
    const hooks = {
      runRole: async (args) => {
        calls.push(describeCall(args));
        const key = `${args.seat.seat}/${args.round ?? 1}`;
        if (!Object.hasOwn(scenario.results, key)) throw new Error(`recorder script has no result for ${key}`);
        return scenario.results[key];
      },
      verify: async () => {
        calls.push({ verify: true });
        if (verifyAnswers.length === 0) throw new Error('recorder script has no verify answer');
        return verifyAnswers.shift();
      },
      history: scenario.history ?? [],
      ...(scenario.launchRoom !== undefined ? { hasLaunchRoom: (n) => n <= scenario.launchRoom } : {}),
      ...(scenario.shipped ? { shippedCheckersByRigor: scenario.shipped } : {}),
    };
    const effective = scenario.effectiveSeats ? { loop: scenario.loop, params: scenario.params, seats: scenario.effectiveSeats } : { loop: scenario.loop, params: scenario.params };
    let expected;
    try {
      expected = { ok: JSON.parse(JSON.stringify(await loops.runLoop(effective, scenario.unit, scenario.cfg, hooks))), calls };
    } catch (error) {
      expected = { error: { class: error.name === 'SeatResolutionError' ? 'SeatResolutionError' : error.name, code: error.code ?? '', message: error.message, ...(error.at !== undefined ? { at: error.at } : {}), ...(error.detail !== undefined ? { detail: error.detail } : {}) }, calls };
    }
    recorded.push({ id: scenario.id, loop: scenario.loop, unit: scenario.unit, cfg: scenario.cfg, effective, history: scenario.history ?? [], launchRoom: scenario.launchRoom ?? null, shippedCheckersByRigor: scenario.shipped ?? null, results: scenario.results, verify: scenario.verify ?? [], expected });
  }

  // ---- history outcomes
  const hist = [];
  const histAdd = (id, args) => hist.push({ id, args, expected: answer(() => patternHistoryOutcome(args)) });
  const rg = { maxRounds: 2 };
  const rseats = (extra = []) => [{ seat: 'producer', role: 'producer', posture: posture({ writer: true }) }, { seat: 'reviewer', role: 'reviewer', posture: posture({ verdict: true }) }, ...extra];
  histAdd('solo: producer only', { loop: 'solo', params: {}, unit: noVerifyUnit, cfg: {}, seats: [{ seat: 'maker', role: 'producer' }], history: [{ seat: 'maker', round: 1, outcome: 'pass' }] });
  histAdd('solo: nothing settled', { loop: 'solo', params: {}, unit: noVerifyUnit, cfg: {}, seats: [{ seat: 'maker', role: 'producer' }], history: [] });
  histAdd('solo: default seat id', { loop: 'solo', params: {}, unit: noVerifyUnit, cfg: {}, seats: [], history: [{ seat: 'producer', outcome: 'blocked' }] });
  histAdd('solo verified: verify settled', { loop: 'solo', params: {}, unit, cfg: verifyCfg, seats: [{ seat: 'producer', role: 'producer' }], history: [{ seat: 'producer', round: 1, outcome: 'pass' }, { seat: 'verify', round: 1, outcome: 'findings' }] });
  histAdd('solo verified: verify missing', { loop: 'solo', params: {}, unit, cfg: verifyCfg, seats: [{ seat: 'producer', role: 'producer' }], history: [{ seat: 'producer', round: 1, outcome: 'pass' }] });
  histAdd('solo verified: producer failed', { loop: 'solo', params: {}, unit, cfg: verifyCfg, seats: [{ seat: 'producer', role: 'producer' }], history: [{ seat: 'producer', round: 1, outcome: 'provider-limit' }] });
  histAdd('solo verified: producer missing', { loop: 'solo', params: {}, unit, cfg: verifyCfg, seats: [{ seat: 'producer', role: 'producer' }], history: [] });
  histAdd('solo verified: a later-round verify is found by seat', { loop: 'solo', params: {}, unit, cfg: verifyCfg, seats: [], history: [{ seat: 'producer', round: 2, outcome: 'pass' }, { seat: 'verify', round: 2, outcome: 'pass' }] });
  histAdd('reviewed: first round passes', { loop: 'reviewed', params: rg, unit: noVerifyUnit, cfg: {}, seats: rseats(), history: [{ seat: 'producer', round: 1, outcome: 'pass' }, { seat: 'reviewer', round: 1, outcome: 'pass' }] });
  histAdd('reviewed: findings then pass', { loop: 'reviewed', params: rg, unit: noVerifyUnit, cfg: {}, seats: rseats(), history: [{ seat: 'producer', round: 1, outcome: 'pass' }, { seat: 'reviewer', round: 1, outcome: 'findings' }, { seat: 'producer', round: 2, outcome: 'pass' }, { seat: 'reviewer', round: 2, outcome: 'pass' }] });
  histAdd('reviewed: findings at the last round', { loop: 'reviewed', params: rg, unit: noVerifyUnit, cfg: {}, seats: rseats(), history: [{ seat: 'producer', round: 1, outcome: 'pass' }, { seat: 'reviewer', round: 1, outcome: 'findings' }, { seat: 'producer', round: 2, outcome: 'pass' }, { seat: 'reviewer', round: 2, outcome: 'findings' }] });
  histAdd('reviewed: round two missing', { loop: 'reviewed', params: rg, unit: noVerifyUnit, cfg: {}, seats: rseats(), history: [{ seat: 'producer', round: 1, outcome: 'pass' }, { seat: 'reviewer', round: 1, outcome: 'findings' }] });
  histAdd('reviewed: producer failed', { loop: 'reviewed', params: rg, unit: noVerifyUnit, cfg: {}, seats: rseats(), history: [{ seat: 'producer', round: 1, outcome: 'blocked' }] });
  histAdd('reviewed: checker failed', { loop: 'reviewed', params: rg, unit: noVerifyUnit, cfg: {}, seats: rseats(), history: [{ seat: 'producer', round: 1, outcome: 'pass' }, { seat: 'reviewer', round: 1, outcome: 'execution-failure' }] });
  histAdd('reviewed: verify holds the verdict', { loop: 'reviewed', params: rg, unit, cfg: verifyCfg, seats: rseats(), history: [{ seat: 'producer', round: 1, outcome: 'pass' }, { seat: 'reviewer', round: 1, outcome: 'pass' }, { seat: 'verify', round: 1, outcome: 'findings' }, { seat: 'producer', round: 2, outcome: 'pass' }, { seat: 'reviewer', round: 2, outcome: 'pass' }, { seat: 'verify', round: 2, outcome: 'pass' }] });
  histAdd('reviewed: no maxRounds is refused', { loop: 'reviewed', params: {}, unit: noVerifyUnit, cfg: {}, seats: rseats(), history: [] });
  const dseats = [{ seat: 'pro', role: 'producer' }, { seat: 'con', role: 'producer' }, { seat: 'judge', role: 'judge' }];
  const dfull = [rres('pro', 1, 'pass'), rres('con', 1, 'pass'), rres('pro', 2, 'pass'), rres('con', 2, 'pass'), res('judge', 'findings')];
  histAdd('debate: ruled', { loop: 'debate', params: {}, unit: noVerifyUnit, cfg: {}, seats: dseats, history: dfull });
  histAdd('debate: not ruled yet', { loop: 'debate', params: {}, unit: noVerifyUnit, cfg: {}, seats: dseats, history: dfull.slice(0, 4) });
  histAdd('debate: a side failed with the round incomplete', { loop: 'debate', params: {}, unit: noVerifyUnit, cfg: {}, seats: dseats, history: [rres('pro', 1, 'pass'), rres('con', 1, 'blocked')] });
  histAdd('debate: a side failed in a complete history', { loop: 'debate', params: {}, unit: noVerifyUnit, cfg: {}, seats: dseats, history: [rres('pro', 1, 'pass'), rres('con', 1, 'pass'), rres('pro', 2, 'provider-limit'), rres('con', 2, 'pass')] });
  histAdd('debate: no rebuttal', { loop: 'debate', params: { rebuttal: false }, unit: noVerifyUnit, cfg: {}, seats: dseats, history: [rres('pro', 1, 'pass'), rres('con', 1, 'pass'), res('judge', 'pass')] });
  const pseats = [{ seat: 'm1', role: 'producer', posture: posture({ stance: true }) }, { seat: 'm2', role: 'producer', posture: posture({ stance: true }) }, { seat: 'sum', role: 'synthesizer', posture: posture() }];
  histAdd('panel: synthesized', { loop: 'panel', params: {}, unit: noVerifyUnit, cfg: {}, seats: pseats, history: [res('m1', 'pass'), res('m2', 'pass'), res('sum', 'findings')] });
  histAdd('panel: a member missing', { loop: 'panel', params: {}, unit: noVerifyUnit, cfg: {}, seats: pseats, history: [res('m1', 'pass'), res('sum', 'pass')] });
  histAdd('panel: a member failed', { loop: 'panel', params: {}, unit: noVerifyUnit, cfg: {}, seats: pseats, history: [res('m1', 'pass'), res('m2', 'blocked')] });
  histAdd('panel: synthesizer missing', { loop: 'panel', params: {}, unit: noVerifyUnit, cfg: {}, seats: pseats, history: [res('m1', 'pass'), res('m2', 'pass')] });
  histAdd('unknown loop is null', { loop: 'swarm', params: {}, unit: noVerifyUnit, cfg: {}, seats: [], history: [] });
  const reviewedDirect = [];
  void reviewedDirect;
  write('loops', 'Loop rules, recorded from src/runner/execution/loops/*.mjs. `cases` are plain functions ({ id, fn, args, expected }). `runs` play a loop with a table of answers: each role call is answered by results["<seat>/<round or 1>"], the n-th verify call by verify[n]; expected holds the loop result and the calls in order (a verify call is { verify: true }; a call lists the seat id, the objective it was told, and the optional round, preferIndependentOf, independentOf, inputs as { seat, round, outcome } and the size of its batch). `history` cases are patternHistoryOutcome calls.', {
    paramTables: Object.fromEntries(['solo', 'reviewed', 'panel', 'debate'].map((n) => [n, loops.paramTableOf(n)])),
    defaultRebuttal: loops.DEFAULT_REBUTTAL,
    cases: list,
    runs: recorded,
    history: hist,
  });
}

// ---------------------------------------------------------------------------------------------------- records
{
  const list = [];
  const add = addTo(list);
  for (const id of ['a', 'A1', 'a.b_c-d', '.hidden', '..', '', 'a/b', 'a b', '-lead', 'x'.repeat(128), 'x'.repeat(129), 'é']) {
    add(`isCaseId ${JSON.stringify(id.length > 20 ? `${id.length} chars` : id)}`, 'isCaseId', [id], { call: casePaths.isCaseId });
  }
  const fgosDir = '/proj/.fgos';
  add('runsRoot', 'runsRoot', [fgosDir], { call: () => casePaths.runsRoot('/proj') });
  add('runDirOf: a case', 'runDirOf', [fgosDir, 'case-1'], { call: () => casePaths.runDirOf('/proj', 'case-1') });
  add('runDirOf: refuses a bad id', 'runDirOf', [fgosDir, '../x'], { call: () => casePaths.runDirOf('/proj', '../x') });
  for (const [c, s] of [['case-1', 'gate'], ['case-1', 'a b'], ['case-1', '..'], ['bad/', 'gate'], ['case-1', ''], ['case-1', 'a/b'], ['case-1', 'ok.step']]) {
    add(`gateAnswerFile ${c} ${s}`, 'gateAnswerFile', [fgosDir, c, s], { call: () => casePaths.gateAnswerFile('/proj', c, s) });
  }
  // hand-off rules
  for (const i of [0, 1, 25, 26, 27, 51, 52, 701, 702, 703]) add(`anonymousInputName ${i}`, 'anonymousInputName', [i], { call: handoff.anonymousInputName });
  for (const input of ['unit-run:abc/{seat}', 'unit-run:abc/producer', 'unit-run:abc/', 'unit-run:/{seat}', 'gate-answer:r/s', 'gate-answer:r/s/x', 'plans/a.md', 'unit-run:abc/{seat}x']) {
    add(`isSeatInput ${input}`, 'isSeatInput', [input], { call: handoff.isSeatInput });
  }
  const fgos = '/proj/.fgos';
  for (const [i, source] of [[0, `${fgos}/assignments/unit-run-1/producer/1/runs/01/report.md`], [1, `${fgos}/assignments/unit-run-1/producer/1/report.md`], [2, `${fgos}/workflow-runs/c1/gate-answers/gate.md`], [3, `${fgos}/other/x.txt`], [4, '/elsewhere/doc.md'], [5, `${fgos}/assignments/unit-run-1/producer/1/solo/report.txt`]]) {
    add(`plainInputName ${i} ${source.replace(fgos, '<fgos>')}`, 'plainInputName', [i, source, fgos], { call: (n, s, d) => handoff.plainInputName(n, s, '/proj') });
  }
  void fgos;
  // hand-off report refs: the Node function reads real files, so each case builds a small tree under a temp root
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'core-loops-'));
  const sha = (text) => crypto.createHash('sha256').update(text).digest('hex');
  const reportCases = [];
  const reportCase = (id, files, record, accept) => {
    for (const [file, text] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(tmp, file)), { recursive: true });
      fs.writeFileSync(path.join(tmp, file), text);
    }
    const expected = answer(() => path.relative(tmp, handoff.reportRefOf(record, { mainRoot: tmp, accept })));
    if (expected.error) expected.error = { reason: expected.error.message.replace(/^handoff-ref-unresolved: /, '') };
    reportCases.push({ id, files, record, accept: accept === undefined ? null : accept instanceof Set ? { digests: [...accept] } : accept, expected });
    for (const file of Object.keys(files)) fs.rmSync(path.join(tmp, file), { force: true });
  };
  const settledRecord = (file, digest, extra = {}) => ({ seat: 'producer', round: 1, runResult: { settleReports: [{ path: file, sha256: digest }], ...extra } });
  reportCase('a settled report with its bytes', { 'r/a.md': 'one' }, settledRecord('r/a.md', sha('one')));
  reportCase('a settled report whose bytes changed', { 'r/b.md': 'two' }, settledRecord('r/b.md', sha('one')));
  reportCase('a changed report the caller accepts as any', { 'r/c.md': 'two' }, settledRecord('r/c.md', sha('one')), 'any');
  reportCase('a changed report whose revision the caller names', { 'r/d.md': 'two' }, settledRecord('r/d.md', sha('one')), new Set([sha('two')]));
  reportCase('a changed report whose revision the caller does not name', { 'r/e.md': 'two' }, settledRecord('r/e.md', sha('one')), new Set([sha('three')]));
  reportCase('a missing settled report', {}, settledRecord('r/missing.md', sha('one')), 'any');
  reportCase('a claim artifact when nothing settled', {}, { seat: 'producer', round: 2, runResult: { evidence: { artifacts: ['', 'out/claim.json'] } } });
  reportCase('no report at all', {}, { role: 'reviewer', round: 3, runResult: {} });
  reportCase('a record with no run result', {}, {});
  fs.rmSync(tmp, { recursive: true, force: true });

  // timestamps as the summary reads them
  const stamps = ['2026-04-31T00:00:00Z', '2026-02-32T00:00:00Z', '2026-11-19T24:00:00Z', '2026-11-19T24:00:01Z', '2026-11-19T23:60:00Z', '2026-11-19T10:00:00+24:00', '2026-11-19T10:00:00.Z', '2026-11-19t10:00:00z', '2026-11-19 10:00:00Z', '2026-11-19T10:00:00+0700', '2026-11-19T02:50:03.539Z', '2026-11-19T02:50:03Z', '2026-11-19T09:50:03+07:00', '2026-11-19T02:50:03-05:30', '2026-11-19', '2024-02-29T00:00:00.000Z', '2023-02-29T00:00:00Z', '2026-13-01T00:00:00Z', '2026-11-19T25:00:00Z', '2026-11-19T02:50:03.5Z', '2026-11-19T02:50:03.123456Z', 'yesterday', '', '2026-11-19T02:50Z', '1969-12-31T23:59:59.999Z', '0001-01-01T00:00:00Z'];
  const stampCases = stamps.map((text) => ({ text, ms: Number.isFinite(Date.parse(text)) ? Date.parse(text) : null }));

  // stance, workflow link, plan ref
  const stance = (claim, opts) => add(`extractStance ${JSON.stringify(claim)} ${JSON.stringify(opts)}`, 'extractStance', [claim ?? null, opts], { call: (c, o) => extractStance(c ?? undefined, o) });
  for (const claim of [undefined, {}, { stance: 'x' }, { stance: null }, { stance: [] }, { stance: { choice: 'a' } }, { stance: { choice: 'a', confidence: 0.5 } }, { stance: { choice: 'other', confidence: 1 } }, { stance: { choice: 'zzz' } }, { stance: { choice: 'a', confidence: 2 } }, { stance: { choice: 'a', confidence: -0.1 } }, { stance: { choice: 'a', confidence: 'x' } }, { stance: { choice: 'a', confidence: null } }, { stance: { choice: 5 } }]) stance(claim, ['a', 'b']);
  stance({ stance: { choice: 'a' } }, []);
  for (const v of [undefined, null, {}, { caseId: 'c', activity: 'a' }, { runId: 'r', stepId: 's', reservationId: ' x ' }, { caseId: ' ', activity: 'a' }, [], 'x', { caseId: 'c', stepId: 's' }]) {
    add(`workflowLink ${JSON.stringify(v)}`, 'workflowLinkOf', [v ?? null], { call: (x) => { try { return normalizeWorkflowLink(x ?? undefined); } catch { return null; } } });
  }
  for (const v of [undefined, null, { dir: 'plans/a' }, { dir: 'a' }, { dir: './plans/a/' }, { dir: 'plans/a', phase: 3 }, { dir: 'plans/a', phase: ' p1 ' }, { dir: 'plans/a', phase: '-x' }, { dir: 'plans/a', phase: 1.5 }, { dir: 'plans/a', phase: -1 }, { dir: 'plans/a', phase: true }, { dir: 'plans/' }, { dir: 'plans/a/b' }, { dir: 'plans/..' }, { dir: 'plans/a\\b' }, { dir: 5 }, [], 'plans/a', { dir: 'plans/a', phase: null }]) {
    add(`planRef ${JSON.stringify(v)}`, 'planRefOf', [v ?? null], { call: (x) => { try { return normalizePlanRef(x ?? undefined); } catch { return null; } } });
  }

  // the unit summary of the corpus, from the seats read out of each run directory
  const summaries = [];
  for (const name of ['v3-solo-settled', 'v3-open-attempt']) {
    const unitDir = path.join(root, 'packages/execution/contracts/corpus', name);
    const record = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
    const rawSeats = JSON.parse(JSON.stringify(readUnitRunSeats(unitDir)));
    const summary = buildUnitSummary(unitDir);
    summaries.push({ id: `corpus ${name}`, corpus: name, rawSeats, active: false, expected: JSON.parse(JSON.stringify(summary)), serialized: serializeUnitSummary(summary), record: undefined });
    void record;
  }
  // variations on the same inputs: only what the pure builder reads changes
  const synth = (id, mutate, options = {}) => {
    const base = JSON.parse(fs.readFileSync(path.join(root, 'packages/execution/contracts/corpus/v3-solo-settled/unit.json'), 'utf8'));
    const rawSeats = JSON.parse(JSON.stringify(readUnitRunSeats(path.join(root, 'packages/execution/contracts/corpus/v3-solo-settled'))));
    const record = mutate(base, rawSeats) ?? base;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'core-loops-unit-'));
    const unitDir = path.join(dir, options.unitRunId ?? 'unit-run-x');
    fs.mkdirSync(unitDir);
    fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(record));
    // an attempt directory with a run.json and no result.json marks an open run when the record has no status
    for (const seat of rawSeats) {
      const seatDir = path.join(unitDir, seat.seat, String(seat.round));
      for (const attempt of seat.attempts) {
        const runDir = path.join(seatDir, 'runs', attempt.runName);
        fs.mkdirSync(runDir, { recursive: true });
        fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify(attempt.runResult));
        if (attempt.assignment) fs.writeFileSync(path.join(seatDir, 'assignment.json'), JSON.stringify(attempt.assignment));
      }
    }
    const read = JSON.parse(JSON.stringify(readUnitRunSeats(unitDir)));
    let summary;
    let error = null;
    try { summary = buildUnitSummary(unitDir, { legacyCompletion: options.legacyCompletion ?? null }); } catch (e) { error = e.message; }
    fs.rmSync(dir, { recursive: true, force: true });
    summaries.push({ id, record, rawSeats: read, unitRunId: options.unitRunId ?? 'unit-run-x', legacyCompletion: options.legacyCompletion ?? null, active: false, expected: error ? { error } : { ok: JSON.parse(JSON.stringify(summary)) } });
  };
  synth('a settlement on the record decides the outcome', (r) => { r.settlement = { outcome: 'findings', settledAt: '2026-11-19T03:00:00Z', infrastructure: false, infrastructureReason: 'x', refused: [{ seat: 'producer' }], verify: { ran: true, passed: false } }; });
  synth('a settlement with a bad timestamp is not one', (r) => { r.settlement = { outcome: 'findings', settledAt: 'soon' }; });
  synth('a settlement with an unknown outcome is not one', (r) => { r.settlement = { outcome: 'great', settledAt: '2026-11-19T03:00:00Z' }; });
  synth('a legacy completion settles a record with none', (r) => { delete r.settlement; }, { unitRunId: 'unit-run-x', legacyCompletion: { unitRunId: 'unit-run-x', outcome: 'blocked', settledAt: '2026-11-19T04:00:00Z', evidence: { source: 'ledger' }, workflow: { caseId: 'c', activity: 'a' } } });
  synth('a completion of another unit run is refused', () => {}, { legacyCompletion: { unitRunId: 'someone-else', outcome: 'pass', settledAt: '2026-11-19T04:00:00Z' } });
  synth('a record with no pattern is undetermined', (r) => { delete r.collaboration; delete r.pattern; delete r.unit.pattern; r.seatSchema = 2; });
  synth('a pinned reviewed record with checker seats', (r, raw) => {
    r.collaboration = { effective: { loop: 'reviewed', params: { maxRounds: 2 } }, provenance: { params: { maxRounds: 'default' }, checkers: {} } };
    r.seats = [{ seat: 'producer', role: 'producer', posture: posture({ writer: true }) }, { seat: 'reviewer', role: 'reviewer', posture: posture({ verdict: true }) }];
    r.unit.verify = undefined;
    const prod = raw[0];
    const checker = JSON.parse(JSON.stringify(prod));
    checker.seat = 'reviewer';
    checker.attempts[0].runResult = { ...checker.attempts[0].runResult, executorId: 'codex' };
    checker.attempts[0].outcome = 'pass';
    checker.final = checker.attempts[0];
    raw.push(checker);
  });
  synth('plan and workflow links on the record', (r) => { r.workflow = { runId: 'w1', stepId: 's1' }; r.unit.plan = { dir: 'plans/p', phase: 2 }; });
  synth('a bad plan reference is left out', (r) => { r.unit.plan = { dir: 'plans/a/b' }; });
  void summaries;

  // unit state
  const attemptRecord = { bindings: { 'producer/1': [{ assignmentId: 'u/producer/1', n: 1 }, { assignmentId: 'u/producer/1', n: 2 }], 'reviewer/1': [], 'x/1': [{ n: 3 }, null] } };
  add('lastAttempts picks the last of each seat/round', 'lastAttempts', [attemptRecord], { call: lastAttempts });
  add('lastAttempts of a record with no bindings', 'lastAttempts', [{}], { call: lastAttempts });
  const stateRows = [
    ['a passed summary completes', { summary: { outcome: 'pass' } }],
    ['a failed summary fails', { summary: { outcome: 'blocked' } }],
    ['an unknown summary is not a verdict', { summary: { outcome: 'unknown' } }],
    ['an undetermined summary is not a verdict', { summary: { outcome: 'undetermined' }, controllerHeld: false }],
    ['a summary with no outcome fails', { summary: {} }],
    ['an open attempt keeps it running', { record: attemptRecord, attempts: { 'u/producer/1': 'open' } }],
    ['a closed attempt awaits resume', { record: attemptRecord, attempts: { 'u/producer/1': 'closed' } }],
    ['a legacy-abandoned attempt awaits resume', { record: attemptRecord, attempts: { 'u/producer/1': 'abandoned-legacy' } }],
    ['no admitted attempt awaits resume', { record: attemptRecord, attempts: {} }],
    ['no record awaits resume', {}],
  ];
  const unitStates = stateRows.map(([id, f]) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'core-loops-state-'));
    const unitDir = path.join(dir, 'unit-run-42');
    fs.mkdirSync(unitDir);
    if (f.summary) fs.writeFileSync(path.join(unitDir, 'unit-summary.json'), JSON.stringify(f.summary));
    if (f.record) fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify(f.record));
    const states = {};
    for (const [assignmentId, state] of Object.entries(f.attempts ?? {})) {
      if (state === 'not-admitted') continue;
      const base = path.join(dir, assignmentId);
      fs.mkdirSync(path.join(base, 'admission', 'generations'), { recursive: true });
      fs.writeFileSync(path.join(base, 'admission', 'generations', '0000000001.json'), JSON.stringify({ attempt: 1, runId: 'run-1' }));
      fs.mkdirSync(path.join(base, 'runs', '01'), { recursive: true });
      if (state === 'abandoned-legacy') fs.writeFileSync(path.join(base, 'runs', '01', 'run.json'), JSON.stringify({ settlement: 'abandoned-legacy' }));
      states[path.join(base, 'runs', '01')] = state === 'open' ? 'live' : 'closed';
    }
    // A held controller needs the process-identity addon, which a source checkout does not ship; the replay
    // covers that one answer by hand (core_loops.rs, `a held controller keeps a unit run running`).
    const expected = JSON.parse(JSON.stringify(deriveUnitState(unitDir, { probe: (attemptDir) => ({ state: states[attemptDir] ?? 'closed' }) })));
    fs.rmSync(dir, { recursive: true, force: true });
    return { id, unitRunId: 'unit-run-42', summary: f.summary ?? null, record: f.record ?? null, attempts: f.attempts ?? {}, expected };
  });

  // admission contract
  const facts = { outcome: 'findings', started: { value: true, reason: null }, infrastructure: false, outOfScope: ['a'], outOfScopeOnBranch: [], evaluations: [{ kind: 'verify', seat: 'verify', round: 1, passed: false }], launches: { ceiling: 3, used: 2, ceilingHit: false }, results: [{ seat: 'producer' }] };
  add('unitRunSettle: a unit that ran', 'unitRunSettle', [{ caseId: 'c1', unitRunId: 'ur-1' }, facts], { call: admission.unitRunSettle });
  add('unitRunSettle: a unit that never started carries no run id', 'unitRunSettle', [{ caseId: 'c1', unitRunId: 'ur-1' }, { ...facts, started: { value: false, reason: 'refused' }, launches: { ceiling: null, used: 0, ceilingHit: true } }], { call: admission.unitRunSettle });
  add('releasedUnitRunSettle', 'releasedUnitRunSettle', ['c9'], { call: admission.releasedUnitRunSettle });
  for (const v of [undefined, null, { caseId: ' c ', activity: ' a ', unitId: 'u', route: 'should', reason: ' r ', extra: 1 }, { caseId: 'c' }, { activity: 'a' }, 'c', [], { caseId: 'c', activity: 'a', route: '  ' }]) {
    add(`normalizeCaseRef ${JSON.stringify(v)}`, 'normalizeCaseRef', [v ?? null], { call: (x) => admission.normalizeCaseRef(x ?? undefined) });
  }
  for (const r of [{ outcome: 'abandoned-before-brief' }, { outcome: 'abandonedX' }, { reason: 'terminal:foreground-not-agent' }, { outcome: 'done' }, {}, undefined]) {
    add(`briefNeverReached ${JSON.stringify(r)}`, 'briefNeverReached', [r ?? null], { call: (x) => admission.briefNeverReached(x ?? undefined) });
  }
  const launch = (extra = {}) => ({ dispatchRetryId: 'r', ...extra });
  for (const [name, rec] of Object.entries({
    'none launched': { bindings: { 'p/1': [{}] } },
    'all undelivered': { bindings: { 'p/1': [launch({ briefNotDelivered: true })], 'q/1': [launch({ briefNotDelivered: true })] } },
    'one delivered': { bindings: { 'p/1': [launch({ briefNotDelivered: true }), launch()] } },
    'a lease conflict is no launch': { bindings: { 'p/1': [launch({ leaseConflict: true }), launch({ briefNotDelivered: true })] } },
    'no bindings': {},
  })) {
    add(`noBriefDelivered: ${name}`, 'noBriefDelivered', [rec], { call: admission.noBriefDelivered });
    add(`seatLaunchesUsed: ${name}`, 'seatLaunchesUsed', [rec], { call: admission.seatLaunchesUsed });
  }
  add('CaseAdmissionRefusedError message', 'caseAdmissionRefusedMessage', [{ code: 'frame-exhausted', condition: 'no dispatch left' }], { call: (r) => new admission.CaseAdmissionRefusedError(r).message });
  add('portMissing and ceiling codes', 'admissionCodes', [], { expected: { ok: { portMissing: admission.PORT_MISSING, ceiling: admission.SEAT_LAUNCH_CEILING, contract: admission.UNIT_RUN_RESULT_CONTRACT } } });
  write('records', 'Case paths, hand-off rules, unit summary pieces, unit state and the admission contract, recorded from the Node modules named in each case. `cases` are plain functions ({ id, fn, args, expected }). `reportRefs` resolve the account a seat result left against a small tree of files (path relative to the main root, or the refusal reason). `timestamps` are Date.parse answers. `summaries` rebuild the unit summary from the seats read out of a run directory (rawSeats); a corpus entry names the unit record by its directory under corpus/.', {
    cases: list,
    reportRefs: reportCases,
    timestamps: stampCases,
    summaries,
    unitStates,
  });
}
console.log(`core-loops vectors written to ${path.relative(root, outDir) || '.'}`);
