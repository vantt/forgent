// test/runner/execution/bind.test.mjs -- the ask a seat is bound with, built from the seat ledger and the unit.
// Every decision the bind makes from that ask is owned by packages/execution/contracts/bind.v1.json.

import test from 'node:test';
import assert from 'node:assert/strict';
import { askFor } from '../../../src/runner/execution/bind.mjs';
import { createSeatLedger } from '../../../src/runner/execution/seat-ledger.mjs';

const POSTURE = { readOnly: true, writer: false, forceOutOfProcess: true, stance: false, verdict: true };
const seatOf = (seat, role = 'reviewer') => ({ seat, role, posture: POSTURE });

// The run and the dry bind both ask through askFor, so this is the one proof that both hold independence both ways.
test('the bind ask holds a seat to the executor of a seat bound earlier that must differ from it', () => {
  const unit = { id: 'u1', capability: 'docs:write', writes: [] };
  const ledger = createSeatLedger();
  // The checker binds first and names the producer, not bound yet: its id stays, and nothing is excluded.
  assert.deepEqual(askFor({ seat: seatOf('checker'), unit, independentOf: ['producer'] }, ledger).independentOf, ['producer']);
  ledger.note('checker', 'codex');
  ledger.noteDependence('checker', ['producer']);
  // The producer names no independence of its own, yet it may not share the checker's executor.
  assert.deepEqual(askFor({ seat: seatOf('producer', 'producer'), unit }, ledger).independentOf, ['codex']);
});

test('a reviewed unit that declares a tier asks its producer and checker seats at it, naming the unit as the source', () => {
  const unit = { id: 'review-it', capability: 'docs:write', writes: [], tier: 'flagship' };
  const ledger = createSeatLedger();
  for (const seat of [seatOf('red-team'), seatOf('producer', 'producer')]) {
    const ask = askFor({ seat, unit }, ledger, { workflowId: 'wf' });
    assert.deepEqual(ask.workflowTier, { tier: 'flagship', source: 'workflow:wf/review-it' }, seat.seat);
  }
});
