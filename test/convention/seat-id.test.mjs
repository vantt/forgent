// The seat id rule is Convention's: the Rust crate and this loader read the same contract entry and
// run the same golden vectors. A seat id becomes a path and ref segment, so traversal never reaches one.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { seatIdProblem, isSeatId, assertSeatId, reservedSeatIds } from '../../src/convention/seat-id.mjs';
import { resolveUnitInputs, HandoffRefError } from '../../src/runner/execution/handoff-refs.mjs';
import { checkDeclaredSeats } from '../../src/runner/execution/seat-resolver.mjs';

const golden = JSON.parse(fs.readFileSync(new URL('../../packages/convention/contracts/convention.golden.v1.json', import.meta.url), 'utf8'));

test('the shared golden vectors give the same answer here as in the Rust crate', () => {
  const cases = golden.identifierCases.filter((c) => c.rule === 'seat-id');
  assert.ok(cases.length >= 20);
  for (const { value, expectedError } of cases) {
    assert.equal(seatIdProblem(value), expectedError, JSON.stringify(value));
  }
});

test('reserved names are exactly the contract list and cover the names the run layout owns', () => {
  for (const name of ['runs', 'outbox', 'inbox', 'inputs', 'unit-control', 'sync', 'verify']) {
    assert.ok(reservedSeatIds().includes(name), name);
    assert.equal(isSeatId(name), false, name);
  }
  assert.throws(() => assertSeatId('runs'), /reserved/);
  assert.throws(() => assertSeatId('../x'), /must be 1-40 characters/);
  assert.equal(assertSeatId('red-team'), 'red-team');
});

test('the workflow-facing seat declaration refuses traversal and reserved ids', () => {
  for (const bad of ['../x', 'a/b', '..', 'runs', 'Bad', '']) {
    assert.throws(() => checkDeclaredSeats([{ seat: bad, role: 'producer' }]), /seat/, bad);
  }
});

test('a hand-off ref cannot reach outside the run directory through a seat segment', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-seat-id-'));
  fs.mkdirSync(path.join(root, '.fgos', 'assignments', 'unit-run-a'), { recursive: true });
  for (const seat of ['../unit-run-a', 'a%2Fb', '..', 'runs']) {
    assert.throws(() => resolveUnitInputs([`unit-run:unit-run-a/${seat}`], root), (err) => err instanceof HandoffRefError || /seat|ref/i.test(err.message), seat);
  }
});
