import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateLadder,
  evaluateWorkingScreen,
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

test('an absence that names its cause carries that cause into the died reason', () => {
  let prior = {};
  let r;
  for (let i = 0; i < DEFAULT_DEATH_THRESHOLD; i += 1) {
    r = run({ liveness: 'absent', livenessCause: 'herdr reports pane p1 not found' }, LIMITS, prior);
    prior = r;
  }
  assert.equal(r.outcome, 'died');
  assert.match(r.reason, /pane p1 not found on 3 consecutive reads/);
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
  assert.equal(r.outcome === 'provider-limit' || r.outcome === 'paused-limit', true);
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
    paneFateFor('provider-limit', { closeAlways: true }),
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

test('matchUsageLimit recognises the wording a codex pane printed when its model was at capacity', () => {
  // Captured from a real pane (2026-10-05): the agent stalled on this line and the round could only
  // time out idle, instead of reporting a provider limit that the runner can fall back from.
  const screen = [
    '• Ran out=/work/outbox',
    '■ Selected model is at capacity. Please try a different model.',
    '• Reconnected. No input was resent.',
  ].join('\n');
  assert.equal(matchUsageLimit(screen), '■ Selected model is at capacity. Please try a different model.');
  assert.equal(matchUsageLimit('Planning capacity for the next quarter'), null, 'ordinary talk about capacity is not a provider limit');
});

const CAPACITY_LINE = '■ Selected model is at capacity. Please try a different model.';
const PROBE = { probeMs: 30000 };

test('a working agent whose screen shows the capacity error is a provider limit once the line has stood for a probe interval', () => {
  const screen = `• Ran something\n${CAPACITY_LINE}\n• Reconnected. No input was resent.\n── ⠋ Working ──`;
  const first = evaluateWorkingScreen({ screen, now: 100000, prior: {}, ...PROBE });
  assert.equal(first.outcome, null, 'one sighting is not enough: a healthy agent can print the line and recover');
  assert.equal(first.next.line, CAPACITY_LINE);

  const tooSoon = evaluateWorkingScreen({ screen, now: 100000 + 10000, prior: first.next, ...PROBE });
  assert.equal(tooSoon.outcome, null);
  assert.deepEqual(tooSoon.next, first.next, 'the first sighting time is kept, not restarted');

  const stood = evaluateWorkingScreen({ screen, now: 100000 + 30000, prior: first.next, ...PROBE });
  assert.equal(stood.outcome, 'provider-limit');
  assert.equal(stood.screenLine, CAPACITY_LINE);
  assert.match(stood.reason, /working/);
});

test('a capacity line that has gone from the screen resets the watch', () => {
  const seen = evaluateWorkingScreen({ screen: CAPACITY_LINE, now: 1000, prior: {}, ...PROBE });
  const recovered = evaluateWorkingScreen({ screen: 'the agent carried on and wrote a file', now: 20000, prior: seen.next, ...PROBE });
  assert.equal(recovered.outcome, null);
  assert.deepEqual(recovered.next, { line: null, since: null });
  const again = evaluateWorkingScreen({ screen: CAPACITY_LINE, now: 60000, prior: recovered.next, ...PROBE });
  assert.equal(again.outcome, null, 'a later sighting starts a new interval');
});

test('text that only talks about capacity or limits is never taken for a provider limit while the agent is working', () => {
  for (const screen of [
    'The model is at capacity according to the docs I am reading',
    'let me explain the rate limit handling in this module',
    'usage limit: see src/limits.mjs',
    'Selected model is at capacity',
  ]) {
    const a = evaluateWorkingScreen({ screen, now: 1000, prior: {}, ...PROBE });
    const b = evaluateWorkingScreen({ screen, now: 1000 + 60000, prior: a.next, ...PROBE });
    assert.equal(b.outcome, null, screen);
  }
});

test('an unreadable screen changes nothing', () => {
  assert.equal(evaluateWorkingScreen({ screen: null, now: 1, prior: {}, ...PROBE }).outcome, null);
  assert.equal(evaluateWorkingScreen({ screen: '', now: 1, prior: { line: CAPACITY_LINE, since: 0 }, ...PROBE }).outcome, null);
});

test('an unknown outcome defaults to keeping the pane rather than closing it', () => {
  assert.equal(paneFateFor('something-nobody-declared'), 'keep');
});

test('an interval nobody could observe does not count towards stale', () => {
  // Twelve seconds with a 5s idle window, but nine of them were an outage in
  // which the agent's status could not be read at all. Three seconds of
  // actual watching is not a stalled worker -- and calling it one would be a
  // statement about a worker nobody looked at, which is the same mistake
  // `unknown` liveness exists to prevent.
  const observed = { agentState: 'idle', lastProgressAt: 1000, now: 13000 };
  assert.equal(run(observed).needsScreen, true, 'without the blind time it reads as stale');
  const seen = run({ ...observed, blindMs: 9000 });
  assert.equal(seen.outcome, null, 'with it, the round is still running');
  // `outcome: null` alone is not enough -- the ladder also returns that while
  // asking for the screen, which is itself a step towards ending the round.
  assert.equal(seen.needsScreen, false, 'and it is not even on the way to being called stale');
});

test('blind time only defers staleness, it does not cancel it', () => {
  // Once the outage ends, the clock resumes rather than restarting: a worker
  // that really has stopped is still caught, just not on evidence nobody had.
  const r = run({ agentState: 'idle', lastProgressAt: 1000, now: 20000, blindMs: 9000, screen: 'ready' });
  assert.equal(r.outcome, 'timed-out-idle');
  assert.match(r.reason, /no progress for 10000ms/, 'the reported idle time excludes the blind interval');
});

test('the ceiling is not adjusted for blind time -- it bounds the round, not the worker', () => {
  const r = run(
    { agentState: 'idle', lastProgressAt: 1000, now: 70000, blindMs: 60000 },
    { ...LIMITS, ceilingMs: 60000 },
  );
  assert.equal(r.outcome, 'timed-out-ceiling');
});
