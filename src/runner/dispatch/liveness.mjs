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
// Three rules exist because getting them wrong kills healthy work. All three
// are the same rule: a reading that could not be taken is not evidence.
//
//   - A liveness read that FAILS is `unknown`, never `absent`. A gate may
//     refuse on bad information; a decision to kill may not.
//   - `died` requires consecutive `absent` readings, and a single `unknown`
//     RESETS the count. absent/unknown/absent must never end a healthy run.
//   - Time nobody could observe does not count towards `stale`. An interval
//     in which `agent_status` could not be read is not an interval spent
//     watching a worker do nothing, so the caller reports it as blind and it
//     is taken back out of the idle measurement. A herdr outage longer than
//     the idle window used to end a healthy round `timed-out-idle` -- a
//     claim about a worker nobody looked at.
//
// The converse is also true: herdr ANSWERING that the pane is not found is a
// reading, not a failure to take one. A closed pane has no agent in it, so
// that answer is `absent` and counts towards `died` like any other absence.
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
  'provider-limit',
  'timed-out-idle',
]);

/** What a liveness probe may report. `unknown` is what a failed read returns. */
export const LIVENESS_READINGS = Object.freeze(['present', 'absent', 'unknown']);

/** How many consecutive `absent` readings before a worker is called dead. */
export const DEFAULT_DEATH_THRESHOLD = 3;

/**
 * Screen text that means "this agent is paused by a provider limit, not
 * broken". Mostly NOT MEASURED: most of these are conservative guesses kept
 * deliberately generic, and the list is replaceable per executor. The one
 * measured wording is the codex pane's "Selected model is at capacity. Please
 * try a different model." (captured 2026-10-05). A miss costs a
 * `timed-out-idle` instead of a `paused-limit` -- the pane is kept either way,
 * so a wrong guess here loses a label, never a worker.
 */
export const DEFAULT_USAGE_LIMIT_PATTERNS = Object.freeze([
  /usage limit/i,
  /rate limit/i,
  /quota (?:exceeded|reached)/i,
  /too many requests/i,
  /try again (?:later|in \d)/i,
  /model is at capacity/i,
]);

/**
 * Screen text that means "this agent cannot reach its provider because its credential is dead",
 * not "it is thinking". The pane shows the error and the agent sits idle, so without this the
 * round waits out the whole idle timeout and ends as `timed-out-idle`. Anchored to wordings
 * measured on a real pane (pi: "OAuth refresh failed for xai ... invalid_grant") plus the
 * standard login prompts. The round ends as `provider-limit`: the provider cannot serve now,
 * so the walk moves to the next candidate; the capacity classifier reads the same line and
 * quarantines the account as an auth fault, not a quota one.
 */
export const AUTH_FAILURE_PATTERNS = Object.freeze([
  /oauth (?:token )?refresh failed/i,
  /\binvalid_grant\b/i,
  /(?:please )?run \/login/i,
  /authentication (?:failed|required)/i,
  /login required/i,
  /not logged in/i,
  /api key.{0,20}(?:missing|invalid|expired)/i,
]);

/** How long an agent has to sit not-working before its screen is read for a credential failure. */
export const AUTH_PROBE_IDLE_MS = 15000;

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
  'provider-limit': 'keep-always',
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
 * What an agent that herdr calls `working` can be stuck on.
 *
 * The ladder reads the screen only once progress has stopped, and `working` counts as progress, so a
 * pane that keeps saying `working` while it is really parked on a provider error is never looked at
 * and the round runs to its absolute ceiling with no fallback (seen 2026-10-05: a codex pane that
 * printed "Selected model is at capacity" and sat there for fifteen minutes).
 *
 * These patterns are deliberately narrow, because a working agent legitimately prints all kinds of
 * text, "rate limit" included. They match a line that STARTS with the CLI's own error marker and
 * names the condition. Only measured wordings belong here.
 */
export const WORKING_STALL_PATTERNS = Object.freeze([
  /^■.*model is at capacity/i,
]);

/** How long the same stall line has to stand on the screen before a working agent is called limited. */
export const WORKING_STALL_PROBE_MS = 30000;

/** How many lines from the bottom of the screen are read for it. */
export const WORKING_STALL_TAIL_LINES = 15;

/**
 * Look at the tail of the screen of an agent that reports `working`.
 *
 * Pure, like the ladder: the caller reads the screen, threads `next` back in, and acts on `outcome`.
 * One sighting is not a verdict, because an agent can print the line and recover. The same line still
 * on the screen a full `probeMs` later is: a recovering agent has printed more by then and the line
 * has scrolled out of the tail.
 *
 * @param {{ screen: string|null, now: number, prior?: { line?: string|null, since?: number|null },
 *           probeMs?: number, patterns?: RegExp[] }} args
 * @returns {{ outcome: 'provider-limit'|null, reason: string|null, screenLine: string|null,
 *             next: { line: string|null, since: number|null } }}
 */
export function evaluateWorkingScreen({ screen, now, prior = {}, probeMs = WORKING_STALL_PROBE_MS, patterns = WORKING_STALL_PATTERNS } = {}) {
  const kept = { line: prior.line ?? null, since: prior.since ?? null };
  // An unreadable screen is no evidence either way.
  if (typeof screen !== 'string' || screen === '') {
    return { outcome: null, reason: null, screenLine: null, next: kept };
  }
  const line = matchUsageLimit(screen, patterns);
  if (!line) {
    return { outcome: null, reason: null, screenLine: null, next: { line: null, since: null } };
  }
  if (kept.line !== line || kept.since === null) {
    return { outcome: null, reason: null, screenLine: null, next: { line, since: now } };
  }
  if (now - kept.since >= probeMs) {
    return {
      outcome: 'provider-limit',
      reason: `the screen has said a provider limit was reached for ${now - kept.since}ms while the agent reports working`,
      screenLine: line,
      next: kept,
    };
  }
  return { outcome: null, reason: null, screenLine: null, next: kept };
}

/**
 * Run the ladder once.
 *
 * `observation` is what was just read:
 *   resultFilePresent  the worker's own result file exists
 *   liveness           'present' | 'absent' | 'unknown' (failed read -> unknown;
 *                      herdr answering "pane not found" is `absent`, not a failed read)
 *   livenessCause      why an `absent` reading is absent, when the probe knows (names the
 *                      `died` reason); optional
 *   agentState         herdr's agent_status, or 'unknown'
 *   lastProgressAt     epoch ms of the last progress signal, or null
 *   blindMs            ms since `lastProgressAt` during which the caller
 *                      could not read the agent's status at all
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
    livenessCause = null,
    agentState = 'unknown',
    lastProgressAt = null,
    blindMs = 0,
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
    return settle('died', livenessCause
      ? `${livenessCause} on ${absentStreak} consecutive reads`
      : `no agent process in the pane on ${absentStreak} consecutive reads`);
  }

  // 4. Ceiling. Absolute, regardless of how busy the worker looks.
  if (ceilingMs > 0 && now - startedAt >= ceilingMs) {
    return settle('timed-out-ceiling', `past the absolute ceiling of ${ceilingMs}ms`);
  }

  // 5. Stale. `working` is itself progress, so a busy agent is never stale --
  // and neither is one nobody could look at. `blindMs` is the part of this
  // window in which the agent's status could not be read at all; taking it
  // back out is what keeps a herdr outage from being reported as a worker
  // that stopped working. The ceiling above is deliberately not adjusted:
  // it is an absolute bound on the round, not a claim about the worker.
  const progressRef = lastProgressAt ?? startedAt;
  const idleFor = Math.max(0, now - progressRef - blindMs);
  const notWorking = agentState !== 'working';
  const stale = notWorking && idleTimeoutMs > 0 && idleFor >= idleTimeoutMs;
  if (!stale) {
    // A dead credential leaves the agent idle with the error on its screen: look for it long
    // before the idle timeout, so the next candidate starts minutes sooner.
    if (!notWorking || idleFor < AUTH_PROBE_IDLE_MS) {
      return { outcome: null, reason: null, screenLine: null, absentStreak, needsScreen: false };
    }
    if (screen === null) {
      return { outcome: null, reason: null, screenLine: null, absentStreak, needsScreen: true };
    }
    const earlyAuthLine = matchUsageLimit(screen, AUTH_FAILURE_PATTERNS);
    if (earlyAuthLine) {
      return settle('provider-limit', 'the screen says the provider credential failed', earlyAuthLine);
    }
    return { outcome: null, reason: null, screenLine: null, absentStreak, needsScreen: false };
  }

  // The screen is read here and nowhere else. Asking for it costs one extra
  // tick, and only on a round that has already stopped making progress.
  if (screen === null) {
    return { outcome: null, reason: null, screenLine: null, absentStreak, needsScreen: true };
  }

  const authLine = matchUsageLimit(screen, AUTH_FAILURE_PATTERNS);
  if (authLine) {
    return settle('provider-limit', 'the screen says the provider credential failed', authLine);
  }
  const limitLine = matchUsageLimit(screen, usageLimitPatterns);
  if (limitLine) {
    return settle('provider-limit', 'the screen says a provider limit was reached', limitLine);
  }
  return settle('timed-out-idle', `no progress for ${idleFor}ms`);
}
