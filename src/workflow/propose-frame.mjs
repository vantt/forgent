// src/workflow/propose-frame.mjs — the case frame a set of slices needs, computed instead of guessed
// Architecture guard: MUST NOT import src/state/** or src/runner/coordination/** (A4 boundary)
//
// A pure function: slices already classified (what each writes, its pattern and rigor) go in; the counters
// of a case frame come out, in the shape `resolveFrame` reads. The seat launches of a slice are read from the
// pattern catalog through `resolveCollaboration`, the same resolver a run uses, so a frame sized here admits
// what the run door will plan. How much slack a frame carries (fix dispatches, spare dispatches) is a table
// below, calibrated against the frames of real cases; it is data, so a calibration changes one constant.

import { RIGOR_ORDER } from './case-projection.mjs';
import { resolveCollaboration } from '../runner/execution/patterns/catalog.mjs';

/**
 * Slack a frame carries beyond the slices themselves.
 *
 * - `fixPerSlice`: writing dispatches a slice of that rigor is expected to need again after its checkers
 *   find something. A slice reviewed at `high` rigor drew a repeat in most of the recorded cases; a
 *   standard slice rarely did.
 * - `spareWrites`: one writing dispatch kept for the unexpected, whenever anything writes at all.
 * - `diagnoses`: read-only diagnosis dispatches a case is given by default.
 * - `spareReads`: one read-only dispatch kept for the unexpected.
 */
export const FRAME_ALLOWANCE = Object.freeze({
  fixPerSlice: Object.freeze({ low: 0, standard: 0, high: 1, critical: 1 }),
  spareWrites: 1,
  diagnoses: 1,
  spareReads: 1,
});

/** Slice kinds that never need a rigor of `standard` or more: documents only. */
const DOC_KIND = 'docs';

export class ProposeFrameError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ProposeFrameError';
    this.code = code;
  }
}

const isCount = (n) => Number.isInteger(n) && n >= 0;

function checkSlice(slice, index) {
  const where = `slice ${index}${typeof slice?.id === 'string' ? ` "${slice.id}"` : ''}`;
  if (!slice || typeof slice !== 'object') throw new ProposeFrameError(`${where} must be an object`, 'slice-invalid');
  if (typeof slice.id !== 'string' || slice.id === '') throw new ProposeFrameError(`${where} needs an id`, 'slice-invalid');
  // `some` and `forEach` skip the holes of a sparse array, so the elements are walked by index.
  const wellFormedWrites = Array.isArray(slice.writes) && Array.from({ length: slice.writes.length }, (_, i) => slice.writes[i]).every((w) => typeof w === 'string' && w !== '');
  if (!wellFormedWrites) {
    throw new ProposeFrameError(`${where} needs "writes", a list of paths (empty for a read-only slice)`, 'slice-invalid');
  }
  if (typeof slice.pattern !== 'string' || slice.pattern === '') throw new ProposeFrameError(`${where} needs a pattern`, 'slice-invalid');
  if (!RIGOR_ORDER.includes(slice.rigor)) {
    throw new ProposeFrameError(`${where} rigor must be one of [${RIGOR_ORDER.join(', ')}], got "${String(slice.rigor)}"`, 'slice-invalid');
  }
  if (slice.writes.length > 0 && slice.kind !== DOC_KIND && RIGOR_ORDER.indexOf(slice.rigor) < RIGOR_ORDER.indexOf('standard')) {
    throw new ProposeFrameError(`${where} writes outside documents at rigor ${slice.rigor}; code is reviewed at standard or more`, 'code-slice-below-standard');
  }
}

/**
 * Seat launches a slice plans for one dispatch, times the fallback a seat may use: the number a frame must
 * allow per dispatch for the run door to admit the slice.
 */
function seatLaunchesOfSlice(slice, { runnerConfig, shipped, fallbackPerSeat }) {
  const unit = { pattern: slice.pattern, rigor: slice.rigor, writes: slice.writes, ...(slice.capability ? { capability: slice.capability } : {}) };
  let collaboration;
  try {
    collaboration = resolveCollaboration({ unit, selectors: { callerString: slice.pattern }, runnerConfig, shipped });
  } catch (err) {
    throw new ProposeFrameError(`slice "${slice.id}": pattern "${slice.pattern}" at rigor ${slice.rigor} does not resolve (${err.message})`, err.code ?? 'pattern-unresolved');
  }
  if (!isCount(collaboration.launchBound)) {
    throw new ProposeFrameError(`slice "${slice.id}": pattern "${slice.pattern}" plans no known number of seat launches`, 'launch-bound-unknown');
  }
  return collaboration.launchBound * fallbackPerSeat;
}

/**
 * The frame a set of classified slices needs.
 *
 * A slice that writes is a writing dispatch; one that does not is a read-only dispatch. The rigor floor is the
 * lowest rigor of any slice, read-only ones included, because admission refuses a dispatch below the floor. Writing dispatches
 * are the writing slices, the repeats their rigor makes likely, and one spare. Read-only dispatches are the
 * read-only slices, a plan validation and a decision lock (both dropped when `inherit` is true: the case
 * continues one that already did them), the diagnoses, one early review per slice that asks for one, one
 * whole-worktree gate when anything writes, and one spare.
 *
 * @param {object} params
 * @param {Array<{ id: string, writes: string[], pattern: string, rigor: string, kind?: string, capability?: string, earlyReview?: boolean }>} params.slices
 * @param {object} params.catalog `{ runnerConfig, shipped }`: what `resolveCollaboration` reads
 * @param {{ fallbackPerSeat: number, deviationsBeforeAsk: number }} params.frameDefaults the guide's own counts, passed through
 * @param {boolean} [params.inherit] the case continues a closed one (its validation and lock are not repeated)
 * @param {object} [params.allowance] a calibration instead of FRAME_ALLOWANCE
 * @returns {{
 *   frame: { dispatches: number, mutatingDispatches: number, seatLaunchesPerDispatch: number, fallbackPerSeat: number, deviationsBeforeAsk: number, rigorFloor: string },
 *   breakdown: { writingSlices: number, fixes: number, spareWrites: number, reads: Record<string, number>, seatLaunches: Array<{ id: string, perDispatch: number }> },
 * }}
 */
export function proposeFrame({ slices, catalog, frameDefaults, inherit = false, allowance = FRAME_ALLOWANCE }) {
  if (!Array.isArray(slices) || slices.length === 0) throw new ProposeFrameError('a frame needs at least one slice', 'no-slices');
  if (!isCount(frameDefaults?.fallbackPerSeat) || !isCount(frameDefaults?.deviationsBeforeAsk)) {
    throw new ProposeFrameError('the guide must state numeric fallbackPerSeat and deviationsBeforeAsk', 'frame-defaults-missing');
  }
  const seen = new Set();
  for (let i = 0; i < slices.length; i += 1) {
    const slice = slices[i];
    checkSlice(slice, i);
    if (seen.has(slice.id)) throw new ProposeFrameError(`slice id "${slice.id}" appears twice`, 'slice-duplicate');
    seen.add(slice.id);
  }

  const { fallbackPerSeat, deviationsBeforeAsk } = frameDefaults;
  const writing = slices.filter((s) => s.writes.length > 0);
  const readOnly = slices.filter((s) => s.writes.length === 0);

  const fixes = writing.reduce((sum, s) => sum + (allowance.fixPerSlice[s.rigor] ?? 0), 0);
  const spareWrites = writing.length > 0 ? allowance.spareWrites : 0;
  const mutatingDispatches = writing.length + fixes + spareWrites;

  const reads = {
    readOnlySlices: readOnly.length,
    validatePlan: inherit ? 0 : 1,
    lockDecisions: inherit ? 0 : 1,
    diagnoses: allowance.diagnoses,
    earlyReviews: slices.filter((s) => s.earlyReview === true).length,
    gate: writing.length > 0 ? 1 : 0,
    spare: allowance.spareReads,
  };
  const dispatches = mutatingDispatches + Object.values(reads).reduce((a, b) => a + b, 0);

  const launches = slices.map((s) => ({ id: s.id, perDispatch: seatLaunchesOfSlice(s, { ...catalog, fallbackPerSeat }) }));
  const seatLaunchesPerDispatch = Math.max(...launches.map((l) => l.perDispatch));

  const floor = slices.reduce((lowest, s) => (RIGOR_ORDER.indexOf(s.rigor) < RIGOR_ORDER.indexOf(lowest) ? s.rigor : lowest), 'critical');

  return {
    frame: { dispatches, mutatingDispatches, seatLaunchesPerDispatch, fallbackPerSeat, deviationsBeforeAsk, rigorFloor: floor },
    breakdown: { writingSlices: writing.length, fixes, spareWrites, reads, seatLaunches: launches },
  };
}
