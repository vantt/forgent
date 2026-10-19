import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAgentName, isReadyState, READY_STATES } from '../../src/runner/dispatch/herdr-agent.mjs';

// What is left of the herdr agent vocabulary after every herdr call moved
// behind terminal-control: ready states and the agent-name rule. The argv of
// each herdr command, the two answer shapes (stdout success, stderr failure),
// plain-text versus enveloped screens and the detector verdict are tested in
// the driver crate (packages/terminal-control/rust/tests/herdr_driver_*.rs).

test('done is a ready state, not an error -- a --no-focus pane settles there', () => {
  assert.deepEqual([...READY_STATES], ['idle', 'done']);
  assert.equal(isReadyState('done'), true);
  assert.equal(isReadyState('idle'), true);
  assert.equal(isReadyState('working'), false);
  assert.equal(isReadyState('blocked'), false);
});

test('agent names are normalized to something herdr accepts as a target', () => {
  assert.equal(normalizeAgentName('FGOS/Work Item 5'), 'fgos-work-item-5');
  assert.equal(normalizeAgentName('---'), 'fgos-agent');
  assert.equal(normalizeAgentName(''), 'fgos-agent');
  assert.ok(normalizeAgentName('x'.repeat(200)).length <= 48);
});


test('a long work id loses its middle, never the suffix that makes it unique', () => {
  const longId = 'tsk-a-very-long-work-item-identifier-indeed-here';
  const first = normalizeAgentName(`fgos-${longId}-${(1700000000000).toString(36)}`);
  const second = normalizeAgentName(`fgos-${longId}-${(1700000000001).toString(36)}`);

  // 32 is herdr's own limit, from its own refusal message. This assertion
  // said 48 and passed while the code was wrong: 48 is not a limit anything
  // has, and the first dispatch of a real capability was refused at 35.
  assert.ok(first.length <= 32, `still within what herdr accepts, got ${first.length}`);
  // Truncating the tail would take the timestamp with it, and herdr addresses
  // agents by name -- two rounds of one item would then be the same agent.
  assert.notEqual(first, second, 'two rounds of the same item are two agents');
  // 24 of the 32-character budget is head, so the recognisable prefix is
  // enough to identify the item; the remaining 8 are a hash of the FULL
  // cleaned string, not a literal tail slice.
  assert.ok(first.startsWith('fgos-tsk-a-very-'), `enough head to recognise the item, got ${first}`);
  assert.match(first.slice(-8), /^[a-f0-9]{8}$/, 'suffix is a hash, not a literal tail slice');
  assert.notEqual(first.slice(-8), second.slice(-8), 'different inputs produce different hash suffixes');
});

test('L11: a literal tail slice would have collided; the hash suffix does not', () => {
  // Two inputs engineered to share the same 16-char head AND the same
  // 16-char tail that the OLD head+tail middle-trim used to keep verbatim --
  // under that scheme both truncated to the exact same 32-character name.
  // Only the middle differs, which a literal slice throws away entirely.
  const head = 'a'.repeat(24);
  const tail = 'b'.repeat(16);
  const first = normalizeAgentName(`${head}1${tail}`);
  const second = normalizeAgentName(`${head}2${tail}`);
  assert.notEqual(first, second, 'a hash of the full string must not collide the way a literal tail slice did');
});

test('a name that already fits is untouched', () => {
  assert.equal(normalizeAgentName('fgos-tsk-1-abc'), 'fgos-tsk-1-abc');
});

test('a real capability id fits -- the name that herdr actually refused', () => {
  // `executeExecutorCli` passes the capability id as the workId, so a dispatch
  // of `fgos-coding-implement` builds `fgos-fgos-coding-implement-<ts36>`:
  // 35 characters, three over what herdr accepts, and refused as
  // `invalid_agent_name` after the pane was already open.
  const name = normalizeAgentName(`fgos-fgos-coding-implement-${(1788794800000).toString(36)}`);
  assert.ok(name.length <= 32, `got ${name.length}: ${name}`);
  assert.match(name, /^[a-z][a-z0-9_-]*$/, "and still matches herdr's own character rule");
});
