import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { proposeFrame, ProposeFrameError, FRAME_ALLOWANCE } from '../../src/workflow/propose-frame.mjs';
import { resolveFrame, parseFrameFlag } from '../../src/workflow/case-start.mjs';
import { shippedCatalog } from '../../src/runner/dispatch/shipped-catalog.mjs';

const catalog = () => ({ runnerConfig: {}, shipped: shippedCatalog() });
const frameDefaults = { fallbackPerSeat: 2, deviationsBeforeAsk: 2 };
const propose = (slices, extra = {}) => proposeFrame({ slices, catalog: catalog(), frameDefaults, ...extra });

const slice = (id, rigor = 'standard', extra = {}) => ({ id, writes: [`src/${id}.mjs`], pattern: 'reviewed', rigor, kind: 'code', ...extra });
const many = (n, rigor, prefix) => Array.from({ length: n }, (_, i) => slice(`${prefix}-${i + 1}`, rigor));

// ---- the arithmetic -------------------------------------------------------------------------------

test('a frame counts each writing slice, the repeats a high rigor slice draws, and one spare writing dispatch', () => {
  const { frame, breakdown } = propose([slice('a', 'standard'), slice('b', 'high'), slice('c', 'high')]);
  assert.equal(breakdown.writingSlices, 3);
  assert.equal(breakdown.fixes, FRAME_ALLOWANCE.fixPerSlice.high * 2 + FRAME_ALLOWANCE.fixPerSlice.standard);
  assert.equal(frame.mutatingDispatches, 3 + 2 + 1);
});

test('read-only dispatches are the validation, the lock, a diagnosis, the gate, a spare and each read-only slice', () => {
  const readOnly = { id: 'look', writes: [], pattern: 'solo', rigor: 'standard', kind: 'code' };
  const { frame, breakdown } = propose([slice('a'), readOnly]);
  assert.deepEqual(breakdown.reads, { readOnlySlices: 1, validatePlan: 1, lockDecisions: 1, diagnoses: 1, earlyReviews: 0, followUps: 0, gate: 1, spare: 1 });
  assert.equal(frame.dispatches, frame.mutatingDispatches + 6);
  assert.equal(frame.mutatingDispatches, 1 + 0 + 1);
});

test('a case that continues a closed one does not repeat the plan validation or the decision lock', () => {
  const fresh = propose([slice('a')]);
  const inherited = propose([slice('a')], { inherit: true });
  assert.equal(fresh.frame.dispatches - inherited.frame.dispatches, 2);
  assert.equal(inherited.frame.mutatingDispatches, fresh.frame.mutatingDispatches);
  assert.equal(inherited.breakdown.reads.validatePlan, 0);
  assert.equal(inherited.breakdown.reads.lockDecisions, 0);
});

test('a slice that asks for an early review adds one read-only dispatch', () => {
  const plain = propose([slice('a')]);
  const reviewed = propose([slice('a', 'standard', { earlyReview: true })]);
  assert.equal(reviewed.frame.dispatches - plain.frame.dispatches, 1);
});

test('nothing writing means no writing dispatch, no spare writing dispatch and no gate', () => {
  const { frame, breakdown } = propose([{ id: 'look', writes: [], pattern: 'solo', rigor: 'standard', kind: 'code' }]);
  assert.equal(frame.mutatingDispatches, 0);
  assert.equal(breakdown.spareWrites, 0);
  assert.equal(breakdown.reads.gate, 0);
});

test('the rigor floor is the lowest rigor among the slices', () => {
  assert.equal(propose([slice('a', 'high'), slice('b', 'standard')]).frame.rigorFloor, 'standard');
  assert.equal(propose([slice('a', 'high'), slice('b', 'critical')]).frame.rigorFloor, 'high');
  const doc = { id: 'doc', writes: ['docs/x.md'], pattern: 'solo', rigor: 'low', kind: 'docs' };
  assert.equal(propose([slice('a', 'high'), doc]).frame.rigorFloor, 'low');
});

test('a read-only slice at a lower rigor than the writing slices lowers the floor so admission accepts it', () => {
  const look = { id: 'look', writes: [], pattern: 'solo', rigor: 'low', kind: 'code' };
  assert.equal(propose([slice('a', 'high'), look]).frame.rigorFloor, 'low');
});

test('the counts the guide fixes are passed through, never widened', () => {
  const { frame } = propose([slice('a')]);
  assert.equal(frame.fallbackPerSeat, frameDefaults.fallbackPerSeat);
  assert.equal(frame.deviationsBeforeAsk, frameDefaults.deviationsBeforeAsk);
});

// ---- the seat launches come from the catalog -------------------------------------------------------

test('seat launches per dispatch are the catalog launch bound of the heaviest slice times the fallback per seat', () => {
  const { frame, breakdown } = propose([slice('a', 'standard'), slice('b', 'high')]);
  const perSlice = Object.fromEntries(breakdown.seatLaunches.map((l) => [l.id, l.perDispatch]));
  assert.ok(perSlice.b >= perSlice.a, 'a higher rigor never plans fewer seat launches');
  assert.equal(frame.seatLaunchesPerDispatch, Math.max(perSlice.a, perSlice.b));
  assert.equal(perSlice.a % frameDefaults.fallbackPerSeat, 0);
});

test('a solo slice plans fewer seat launches than a reviewed one at the same rigor', () => {
  const solo = propose([slice('a', 'standard', { pattern: 'solo' })]).breakdown.seatLaunches[0].perDispatch;
  const reviewed = propose([slice('a', 'standard')]).breakdown.seatLaunches[0].perDispatch;
  assert.ok(solo < reviewed);
});

test('a frame the proposal returns is accepted by the case start as a narrowing of the guide defaults', () => {
  const { frame } = propose(many(3, 'high', 'x'));
  const guide = {
    id: 'coding/feature',
    frameDefaults: {
      dispatches: 'set-at-approval', mutatingDispatches: 'set-at-approval', seatLaunchesPerDispatch: 'set-at-approval',
      fallbackPerSeat: 2, deviationsBeforeAsk: 2, rigorFloor: 'set-at-approval',
    },
  };
  const flags = Object.fromEntries(Object.entries(frame).map(([k, v]) => [k, typeof v === 'number' ? String(v) : v]));
  assert.deepEqual(resolveFrame(guide, flags), frame);
});

// ---- refusals --------------------------------------------------------------------------------------

test('a frame for no slice is refused', () => {
  assert.throws(() => propose([]), (e) => e instanceof ProposeFrameError && e.code === 'no-slices');
});

test('a code slice below standard rigor is refused, a document slice is not', () => {
  assert.throws(() => propose([slice('a', 'low')]), (e) => e.code === 'code-slice-below-standard');
  assert.doesNotThrow(() => propose([{ id: 'doc', writes: ['docs/x.md'], pattern: 'solo', rigor: 'low', kind: 'docs' }]));
});

test('an unknown pattern is refused', () => {
  assert.throws(() => propose([slice('a', 'standard', { pattern: 'no-such-pattern' })]), (e) => e instanceof ProposeFrameError);
});

test('a guide that does not state its fallback and deviation counts is refused', () => {
  assert.throws(() => proposeFrame({ slices: [slice('a')], catalog: catalog(), frameDefaults: { fallbackPerSeat: 'set-at-approval', deviationsBeforeAsk: 2 } }), (e) => e.code === 'frame-defaults-missing');
});

// ---- the recorded cases ----------------------------------------------------------------------------
//
// Every case below ran under a frame the owner approved. `approved` is that frame and `spent` is what the
// case's ledger recorded (reservations, and how many of them wrote). The slices are what the case set out to
// do. The ledger does not tie a dispatch to a slice, so for the main case the slice count and rigor come from
// the plan's own list (14 slices up to the setup conversion, 10 of them raised to high); for the later cases
// the slices are the writing dispatches of the ledger, each a different write set. Write paths are
// representative, the arithmetic does not read them.
//
// Two bounds hold for every case: the proposal is not smaller than what the case spent, and not wider than
// one and a half times what was approved. Six of the seven cases were sized to what they ran, and there the
// proposal is also not smaller than the approved frame. The successor case was approved with headroom for
// slices it never opened (24 dispatches, 14 writing; it ran 6 and 4), so only the two bounds apply to it.

const std = (n, prefix) => many(n, 'standard', prefix);
const RECORDED_CASES = [
  {
    name: 'main case', ledger: 'wf-run-1792986771290-0cee70ca',
    approved: { dispatches: 30, mutating: 22 }, spent: { dispatches: 25, mutating: 22 },
    slices: [...many(10, 'high', 'raised'), ...std(4, 'plain')],
  },
  {
    name: 'successor case', ledger: 'wf-run-1793156600638-bf25ac2d',
    approved: { dispatches: 24, mutating: 14 }, spent: { dispatches: 6, mutating: 4 },
    slices: std(4, 'rest'), sizedToWork: false,
  },
  { name: 'first fix round', ledger: 'wf-run-1793204727428-cb058862', approved: { dispatches: 8, mutating: 4 }, spent: { dispatches: 5, mutating: 3 }, slices: std(3, 'fix') },
  { name: 'second fix round', ledger: 'wf-run-1793213132570-50ce60a7', approved: { dispatches: 6, mutating: 2 }, spent: { dispatches: 4, mutating: 2 }, slices: std(2, 'fix') },
  { name: 'third fix round', ledger: 'wf-run-1793244359873-ac20a7a4', approved: { dispatches: 6, mutating: 2 }, spent: { dispatches: 4, mutating: 2 }, slices: std(2, 'fix') },
  { name: 'fourth fix round', ledger: 'wf-run-1793252785917-d7c7021a', approved: { dispatches: 9, mutating: 4 }, spent: { dispatches: 5, mutating: 3 }, slices: std(3, 'fix') },
  { name: 'fifth fix round', ledger: 'wf-run-1793266874143-8e6d800b', approved: { dispatches: 7, mutating: 3 }, spent: { dispatches: 4, mutating: 2 }, slices: std(2, 'fix') },
];

for (const c of RECORDED_CASES) {
  test(`the frame proposed for the ${c.name} covers what it spent and stays within one and a half times what was approved`, (t) => {
    const { frame } = propose(c.slices);
    const ratio = (n, d) => (n / d).toFixed(2);
    t.diagnostic(`${c.name} (${c.ledger}): approved ${c.approved.dispatches}/${c.approved.mutating}, spent ${c.spent.dispatches}/${c.spent.mutating}, proposed ${frame.dispatches}/${frame.mutatingDispatches}, ratio to approved ${ratio(frame.dispatches, c.approved.dispatches)}/${ratio(frame.mutatingDispatches, c.approved.mutating)}`);
    assert.ok(frame.dispatches >= c.spent.dispatches, `dispatches ${frame.dispatches} < spent ${c.spent.dispatches}`);
    assert.ok(frame.mutatingDispatches >= c.spent.mutating, `writing dispatches ${frame.mutatingDispatches} < spent ${c.spent.mutating}`);
    assert.ok(frame.dispatches <= c.approved.dispatches * 1.5, `dispatches ${frame.dispatches} > 1.5 x approved ${c.approved.dispatches}`);
    assert.ok(frame.mutatingDispatches <= c.approved.mutating * 1.5, `writing dispatches ${frame.mutatingDispatches} > 1.5 x approved ${c.approved.mutating}`);
    if (c.sizedToWork !== false) {
      assert.ok(frame.dispatches >= c.approved.dispatches, `dispatches ${frame.dispatches} < approved ${c.approved.dispatches}`);
      assert.ok(frame.mutatingDispatches >= c.approved.mutating, `writing dispatches ${frame.mutatingDispatches} < approved ${c.approved.mutating}`);
    }
    assert.equal(frame.rigorFloor, 'standard');
  });
}

test('the seat launches planned grow with rigor and the per-dispatch ceiling the owner approved before covers the heaviest recorded slice', () => {
  const per = (rigor) => propose([slice('a', rigor)]).frame.seatLaunchesPerDispatch;
  assert.ok(per('standard') < per('high'));
  assert.ok(per('high') < per('critical'));
  const approvedPerDispatch = 12;
  for (const c of RECORDED_CASES) {
    assert.ok(propose(c.slices).frame.seatLaunchesPerDispatch <= approvedPerDispatch, `${c.name} asks for more seat launches per dispatch than the approved frame allowed`);
  }
});

test('a document slice whose kind names a follow-up review adds one read-only dispatch for it', () => {
  const doc = (id, extra = {}) => ({ id, writes: [`docs/${id}.md`], pattern: 'solo', rigor: 'low', kind: 'docs', ...extra });
  const without = propose([slice('a'), doc('d1')]);
  const withFollowUp = propose([slice('a'), doc('d1', { followUp: { capability: 'review', pattern: 'solo' } })]);
  assert.equal(withFollowUp.breakdown.reads.followUps, 1);
  assert.equal(withFollowUp.frame.dispatches - without.frame.dispatches, 1);
  assert.equal(withFollowUp.frame.mutatingDispatches, without.frame.mutatingDispatches);
});

test('a read pass the case runs besides its slices raises the seat-launch ceiling without adding a dispatch', () => {
  const docs = { id: 'note', writes: ['docs/note.md'], pattern: 'solo', rigor: 'low', kind: 'docs' };
  const alone = propose([docs]);
  const withPass = propose([docs], { readPasses: [{ id: 'validate-plan', pattern: 'reviewed', rigor: 'standard' }] });
  assert.equal(alone.frame.seatLaunchesPerDispatch, 2);
  assert.equal(withPass.frame.seatLaunchesPerDispatch, 8, 'a reviewed pass at standard plans four seat launches, twice with fallback');
  assert.equal(withPass.frame.dispatches, alone.frame.dispatches, 'the pass is already counted among the reads');
  assert.deepEqual(withPass.breakdown.seatLaunches.map((l) => l.id), ['note', 'validate-plan']);
});

// ---- the --frame text ------------------------------------------------------------------------------

test('the --frame text is key=value pairs split on "," with each side trimmed, a value may hold "="', () => {
  assert.deepEqual(parseFrameFlag('dispatches=3'), { dispatches: '3' });
  assert.deepEqual(parseFrameFlag(' dispatches = 3 , rigorFloor=high '), { dispatches: '3', rigorFloor: 'high' });
  assert.deepEqual(parseFrameFlag('note=a=b'), { note: 'a=b' });
  assert.deepEqual(parseFrameFlag('rigorFloor='), { rigorFloor: '' });
});

test('a --frame pair with no key or no "=" is refused by name', () => {
  for (const text of ['=3', 'dispatches', 'dispatches=3,', ',', ' =3']) {
    assert.throws(() => parseFrameFlag(text), /--frame takes key=value pairs/, JSON.stringify(text));
  }
});

test('the case start narrows the guide defaults from the --frame text exactly as from the parsed pairs', () => {
  const guide = { id: 'g', frameDefaults: { dispatches: 5, mutatingDispatches: 2, fallbackPerSeat: 2, deviationsBeforeAsk: 1, rigorFloor: 'standard' } };
  assert.deepEqual(resolveFrame(guide, 'dispatches=3,rigorFloor=high'), resolveFrame(guide, { dispatches: '3', rigorFloor: 'high' }));
  assert.equal(resolveFrame(guide, 'dispatches=3,rigorFloor=high').dispatches, 3);
  assert.throws(() => resolveFrame(guide, 'dispatches=9'), /widens the guide's default 5/);
});
