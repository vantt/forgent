// The signal ladder: given what was observed about a running worker, decide
// whether the round is over and, if so, what kind of over.
//
// Pure on purpose. Every reading it consumes is gathered by the caller, and
// every consequence it names is applied by the caller. That is what makes the
// hard part -- the ordering, and the counting -- testable without a terminal,
// an agent, or a clock.
//
// The order is the whole design, and it is not negotiable:
//
//   1. Truth       the worker's own result file. Beats every other signal,
//                  including a report that the agent is gone: a worker that
//                  wrote its result and then exited did finish.
//   2. Blocked     the agent is sitting on something only a person can
//                  answer. Naming this beats any timeout, because the repair
//                  is different -- answer it, do not retry it.
//   3. Died        the process is no longer there. Nothing else can be true.
//   4. Ceiling     past the absolute bound, regardless of how busy it looks.
//   5. Stale       no progress for too long. Only here is the screen read,
//                  and only here can a paused-on-limit be told apart from a
//                  genuinely idle worker.
//
// Two rules exist because getting them wrong kills healthy work:
//
//   - A liveness read that FAILS is `unknown`, never `absent`. A gate may
//     refuse on bad information; a decision to kill may not.
//   - `died` requires consecutive `absent` readings, and a single `unknown`
//     RESETS the count. absent/unknown/absent must never end a healthy run.
//
// `agent_status` appears here only as a progress hint and as the blocked
// signal. It never concludes that work finished -- it was wrong about that
// twice in production, once before the agent had started at all and once in a
// gap between two tool calls of a single turn.

/** Every terminal outcome this ladder can reach. */
export const LADDER_OUTCOMES = Object.freeze([
  'settled',
  'blocked',
  'died',
  'timed-out-ceiling',
  'paused-limit',
  'timed-out-idle',
]);

/** What a liveness probe may report. `unknown` is what a failed read returns. */
export const LIVENESS_READINGS = Object.freeze(['present', 'absent', 'unknown']);

/** How many consecutive `absent` readings before a worker is called dead. */
export const DEFAULT_DEATH_THRESHOLD = 3;

/**
 * Screen text that means "this agent is paused by a provider limit, not
 * broken". NOT MEASURED: no provider's exact wording has been captured in
 * this repo yet, so these are conservative guesses kept deliberately generic,
 * and the list is replaceable per executor. A miss costs a `timed-out-idle`
 * instead of a `paused-limit` -- the pane is kept either way, so a wrong
 * guess here loses a label, never a worker.
 */
export const DEFAULT_USAGE_LIMIT_PATTERNS = Object.freeze([
  /usage limit/i,
  /rate limit/i,
  /quota (?:exceeded|reached)/i,
  /too many requests/i,
  /try again (?:later|in \d)/i,
]);

/**
 * What happens to the pane for each outcome.
 *
 * `keep-always` is stronger than `keep`: a run paused on a provider limit
 * keeps its pane even under a caller that closes everything, because that
 * pane is the only place the reset time is written.
 */
export const PANE_FATE = Object.freeze({
  settled: 'close',
  blocked: 'keep',
  died: 'keep',
  'timed-out-ceiling': 'keep',
  'timed-out-idle': 'keep',
  'paused-limit': 'keep-always',
});

/** Resolve the pane decision for an outcome. `closeAlways` is the automated
 * caller's sweep; it overrides `keep` but never `keep-always`. */
export function paneFateFor(outcome, { closeAlways = false } = {}) {
  const fate = PANE_FATE[outcome] ?? 'keep';
  if (fate === 'keep-always') return 'keep';
  if (closeAlways) return 'close';
  return fate === 'close' ? 'close' : 'keep';
}

/** The first line of `screen` that reads like a provider limit, or null.
 * Returns the line itself, not just a boolean -- a person reading the failure
 * needs the sentence, including whatever reset time it carries. */
export function matchUsageLimit(screen, patterns = DEFAULT_USAGE_LIMIT_PATTERNS) {
  if (typeof screen !== 'string' || !screen) return null;
  for (const raw of screen.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (patterns.some((p) => p.test(line))) return line;
  }
  return null;
}

/**
 * Run the ladder once.
 *
 * `observation` is what was just read:
 *   resultFilePresent  the worker's own result file exists
 *   liveness           'present' | 'absent' | 'unknown' (failed read -> unknown)
 *   agentState         herdr's agent_status, or 'unknown'
 *   lastProgressAt     epoch ms of the last progress signal, or null
 *   startedAt          epoch ms the round began
 *   now                epoch ms
 *   screen             screen text, supplied ONLY after a previous call
 *                      asked for it via `needsScreen`
 *
 * `limits` carries `idleTimeoutMs`, `ceilingMs`, `deathThreshold` and
 * `usageLimitPatterns`; `prior` carries `absentStreak` from the last call.
 *
 * Returns `{ outcome, reason, screenLine, absentStreak, needsScreen }`.
 * `outcome` is null while the round is still running. `absentStreak` is
 * always returned so the caller threads it straight back in. `needsScreen`
 * asks the caller to read the screen and call again -- the screen is read
 * when progress has gone stale, never on every tick.
 */
export function evaluateLadder({ observation = {}, limits = {}, prior = {} } = {}) {
  const {
    resultFilePresent = false,
    liveness = 'unknown',
    agentState = 'unknown',
    lastProgressAt = null,
    startedAt = 0,
    now = Date.now(),
    screen = null,
  } = observation;
  const {
    idleTimeoutMs = 0,
    ceilingMs = 0,
    deathThreshold = DEFAULT_DEATH_THRESHOLD,
    usageLimitPatterns = DEFAULT_USAGE_LIMIT_PATTERNS,
  } = limits;

  // Count first, so the streak is correct in every returned shape -- including
  // the ones that return early. `unknown` resets it: an unreadable probe is
  // not evidence of absence.
  const absentStreak = liveness === 'absent' ? (prior.absentStreak ?? 0) + 1 : 0;
  const settle = (outcome, reason, screenLine = null) => ({
    outcome, reason, screenLine, absentStreak, needsScreen: false,
  });

  // 1. Truth. A result file outranks everything, including an absent process:
  // a worker that wrote its result and exited did the work.
  if (resultFilePresent) {
    return settle('settled', 'the worker wrote its result file');
  }

  // 2. Blocked. A different kind of stuck, with a different repair.
  if (agentState === 'blocked') {
    return settle('blocked', 'the agent is waiting on input only a person can give');
  }

  // 3. Died. Consecutive absences only.
  if (absentStreak >= deathThreshold) {
    return settle('died', `no agent process in the pane on ${absentStreak} consecutive reads`);
  }

  // 4. Ceiling. Absolute, regardless of how busy the worker looks.
  if (ceilingMs > 0 && now - startedAt >= ceilingMs) {
    return settle('timed-out-ceiling', `past the absolute ceiling of ${ceilingMs}ms`);
  }

  // 5. Stale. `working` is itself progress, so a busy agent is never stale.
  const progressRef = lastProgressAt ?? startedAt;
  const idleFor = now - progressRef;
  const stale = agentState !== 'working' && idleTimeoutMs > 0 && idleFor >= idleTimeoutMs;
  if (!stale) {
    return { outcome: null, reason: null, screenLine: null, absentStreak, needsScreen: false };
  }

  // The screen is read here and nowhere else. Asking for it costs one extra
  // tick, and only on a round that has already stopped making progress.
  if (screen === null) {
    return { outcome: null, reason: null, screenLine: null, absentStreak, needsScreen: true };
  }

  const limitLine = matchUsageLimit(screen, usageLimitPatterns);
  if (limitLine) {
    return settle('paused-limit', 'the screen says a provider limit was reached', limitLine);
  }
  return settle('timed-out-idle', `no progress for ${idleFor}ms`);
}
