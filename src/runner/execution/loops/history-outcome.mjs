/**
 * The terminal outcome a pattern's settled history establishes, without dispatching anything.
 * Incomplete history cannot establish completion and stays unknown (null). Read from the seats a unit
 * record lists (or, for a pre-fence record, the seats legacy-seat-read derives), by seat id.
 */

import { reviewedHistoryOutcome } from './reviewed.mjs';

const ERROR_OUTCOMES = Object.freeze(['execution-failure', 'policy-refusal', 'provider-limit', 'blocked']);

const seatResult = (history, seat, round = 1) => history.find((h) => h.seat === seat && (h.round ?? 1) === round);

function debateOutcome(params, seats, history) {
  const sides = seats.filter((s) => s.role === 'producer').map((s) => s.seat);
  const judge = seats.find((s) => s.role === 'judge')?.seat;
  const rounds = params?.rebuttal === false ? [1] : [1, 2];
  const sideResults = rounds.flatMap((round) => sides.map((side) => seatResult(history, side, round)));
  if (sideResults.some((r) => !r)) {
    // A side that ended in error ends the debate at that round.
    return sideResults.find((r) => r && ERROR_OUTCOMES.includes(r.outcome))?.outcome ?? null;
  }
  const error = sideResults.find((r) => ERROR_OUTCOMES.includes(r.outcome));
  if (error) return error.outcome;
  return seatResult(history, judge)?.outcome ?? null;
}

function panelOutcome(seats, history) {
  const members = seats.filter((s) => s.posture?.stance).map((s) => history.find((h) => h.seat === s.seat));
  if (members.some((r) => !r)) return null;
  const error = members.find((r) => ERROR_OUTCOMES.includes(r.outcome));
  if (error) return error.outcome;
  const synthesizer = seats.find((s) => s.role === 'synthesizer');
  return history.find((h) => h.seat === synthesizer?.seat)?.outcome ?? null;
}

/**
 * @param {object} args
 * @param {string} args.patternName solo | reviewed | panel | debate
 * @param {object} args.params pattern params
 * @param {object} args.unit the unit contract of the record
 * @param {object} args.cfg the runner config the run used
 * @param {Array<{ seat: string, role: string, posture: object }>} args.seats the seats the unit had
 * @param {Array<{ seat: string, round: number, outcome: string }>} args.history final settled record per seat/round
 * @returns {string|null}
 */
export function patternHistoryOutcome({ patternName, params, unit, cfg, seats, history }) {
  switch (patternName) {
    case 'reviewed': return reviewedHistoryOutcome(unit, cfg, history, params, seats);
    case 'solo': return history.find((h) => h.seat === seats[0]?.seat)?.outcome ?? null;
    case 'debate': return debateOutcome(params, seats, history);
    case 'panel': return panelOutcome(seats, history);
    default: return null;
  }
}
