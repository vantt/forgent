import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateLadder,
  matchUsageLimit,
  paneFateFor,
  LADDER_OUTCOMES,
  PANE_FATE,
  DEFAULT_DEATH_THRESHOLD,
} from '../../src/runner/dispatch/liveness.mjs';

// The ladder is where a healthy worker gets killed by mistake, so these tests
// are mostly about what must NOT happen: an unreadable probe must not read as
// death, a busy agent must not read as idle, and nothing at all may outrank
// the worker's own result file.

const BASE = { startedAt: 1000, now: 2000, liveness: 'present', agentState: 'working' };
const LIMITS = { idleTimeoutMs: 5000, ceilingMs: 60000, deathThreshold: 3 };

const run = (observation, limits = LIMITS, prior = {}) =>
  evaluateLadder({ observation: { ...BASE, ...observation }, limits, prior });

test('the result file outranks everything, including a process that is already gone', () => {
  const r = run({ resultFilePresent: true, liveness: 'absent', agentState: 'blocked', now: 999999 }, LIMITS, { absentStreak: 99 });
  assert.equal(r.outcome, 'settled');
});

test('a blocked agent is named blocked, not timed out', () => {
  const r = run({ agentState: 'blocked', now: 999999 });
  assert.equal(r.outcome, 'blocked');
  assert.match(r.reason, /person/);
});

test('death needs consecutive absences, and reaching the threshold is what settles it', () => {
  let prior = {};
  for (let i = 1; i < DEFAULT_DEATH_THRESHOLD; i += 1) {
    const r = run({ liveness: 'absent' }, LIMITS, prior);
    assert.equal(r.outcome, null, `absence ${i} must not settle on its own`);
    assert.equal(r.absentStreak, i);
    prior = r;
  }
  const final = run({ liveness: 'absent' }, LIMITS, prior);
  assert.equal(final.outcome, 'died');
  assert.equal(final.absentStreak, DEFAULT_DEATH_THRESHOLD);
});

test('absent, unknown, absent never kills a healthy run -- one unknown resets the count', () => {
  const a = run({ liveness: 'absent' }, LIMITS, {});
  assert.equal(a.absentStreak, 1);

  const u = run({ liveness: 'unknown' }, LIMITS, a);
  assert.equal(u.absentStreak, 0, 'a failed read is not evidence of absence');
  assert.equal(u.outcome, null);

  const b = run({ liveness: 'absent' }, LIMITS, u);
  assert.equal(b.absentStreak, 1, 'the streak starts over, it does not resume');
  assert.equal(b.outcome, null);
});

test('a present reading also clears the streak', () => {
  const a = run({ liveness: 'absent' }, LIMITS, { absentStreak: 2 });
  assert.equal(a.absentStreak, 3);
  const p = run({ liveness: 'present' }, LIMITS, { absentStreak: 2 });
  assert.equal(p.absentStreak, 0);
});

test('the absolute ceiling fires even while the agent is busy', () => {
  const r = run({ agentState: 'working', now: 1000 + 60000 });
  assert.equal(r.outcome, 'timed-out-ceiling');
});

test('a working agent is never stale, however long since the last log write', () => {
  const r = run({ agentState: 'working', lastProgressAt: 1000, now: 1000 + 59000 });
  assert.equal(r.outcome, null, 'working IS progress');
  assert.equal(r.needsScreen, false);
});

test('going stale asks for the screen once, rather than reading it every tick', () => {
  const r = run({ agentState: 'idle', lastProgressAt: 1000, now: 1000 + 6000 });
  assert.equal(r.outcome, null);
  assert.equal(r.needsScreen, true, 'the screen is read only after progress stops');
});

test('a stale worker whose screen says a provider limit was hit is paused, not timed out', () => {
  const r = run({
    agentState: 'idle',
    lastProgressAt: 1000,
    now: 1000 + 6000,
    screen: 'thinking...\nYou have reached your usage limit. Try again in 3 hours.\n',
  });
  assert.equal(r.outcome, 'paused-limit');
  assert.match(r.screenLine, /usage limit/i);
  assert.match(r.screenLine, /3 hours/, 'the whole sentence is kept, reset time included');
});

test('a stale worker with an ordinary screen is a plain idle timeout', () => {
  const r = run({
    agentState: 'idle',
    lastProgressAt: 1000,
    now: 1000 + 6000,
    screen: 'waiting for something to happen',
  });
  assert.equal(r.outcome, 'timed-out-idle');
  assert.equal(r.screenLine, null);
});

test('with no progress ever recorded, staleness is measured from the start of the round', () => {
  const fresh = run({ agentState: 'idle', lastProgressAt: null, now: 1000 + 4000 });
  assert.equal(fresh.outcome, null);
  const stale = run({ agentState: 'idle', lastProgressAt: null, now: 1000 + 5000, screen: 'nothing here' });
  assert.equal(stale.outcome, 'timed-out-idle');
});

test('a zero idleTimeout disables staleness entirely rather than making everything stale', () => {
  const r = run({ agentState: 'idle', lastProgressAt: 1000, now: 999999 }, { ...LIMITS, idleTimeoutMs: 0, ceilingMs: 0 });
  assert.equal(r.outcome, null);
  assert.equal(r.needsScreen, false);
});

test('every outcome the ladder can return has a declared pane fate', () => {
  for (const outcome of LADDER_OUTCOMES) {
    assert.ok(PANE_FATE[outcome], `${outcome} must declare what happens to its pane`);
  }
});

test('only a settled round closes its pane; a failed one keeps the screen readable', () => {
  assert.equal(paneFateFor('settled'), 'close');
  for (const outcome of ['blocked', 'died', 'timed-out-idle', 'timed-out-ceiling', 'paused-limit']) {
    assert.equal(paneFateFor(outcome), 'keep', `${outcome} must leave its pane open`);
  }
});

test('close-always sweeps failed panes but never one paused on a provider limit', () => {
  assert.equal(paneFateFor('timed-out-idle', { closeAlways: true }), 'close');
  assert.equal(paneFateFor('died', { closeAlways: true }), 'close');
  assert.equal(
    paneFateFor('paused-limit', { closeAlways: true }),
    'keep',
    'that pane is the only place the reset time is written',
  );
});

test('matchUsageLimit returns the line itself and ignores blank noise', () => {
  assert.equal(matchUsageLimit(''), null);
  assert.equal(matchUsageLimit(null), null);
  assert.equal(matchUsageLimit('all fine here'), null);
  assert.equal(matchUsageLimit('\n\n  Rate limit exceeded  \n'), 'Rate limit exceeded');
});

test('an unknown outcome defaults to keeping the pane rather than closing it', () => {
  assert.equal(paneFateFor('something-nobody-declared'), 'keep');
});
