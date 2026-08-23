# tsk-60r — plan

Mode: small

Lane-gate: 1 flag applies (existing covered behavior — `src/intake/
discovery.mjs`/`test/intake/discovery.test.mjs` already carry an extensive
test suite, 1617 lines). No auth, no authorization, no data model change,
no audit/security, no external-system change, no public-contract change
(`fgos discover` is an internal CLI verb, not an external-facing API), no
cross-platform, no weak-proof area, single domain. A few files, no gray
areas — D1-D3 in `CONTEXT.md` already fully lock the fix shape.

## Approach

Per D1 (`docs/history/discover-clear-verdict-stale-park/CONTEXT.md`), add
a guard to `resolveDiscovery`'s clear-verdict path
(`src/intake/discovery.mjs`) that refuses when `work.status ===
'awaiting-human'` at the point the plain (non-`--force`) agree-path is
about to call `moveStage` (currently around line 726-728, right after the
`if (typeof verdict.verify === 'string' && verdict.verify.trim())` block
at 642-718 falls through without disputing). Error via `StoreError`, same
class the analogous `--force` guard already throws
(`discovery.mjs:695-700`), with message text pointing at `fgos answer <id>
--text ...` as the resume path — mirroring that guard's own wording per
D1.

Files touched:
- `src/intake/discovery.mjs` — the guard itself.
- `test/intake/discovery.test.mjs` — two new tests (see Proof surface).

No split — one honest piece of work: a single guard clause plus its
tests, entirely inside `resolveDiscovery`.

### Rejected alternative

Auto-resume via `answerAwaiting` instead of refusing — rejected per D1,
matching tsk-nfa's own D1 rejection of the same alternative for the
`--force` branch (blurs the audit trail: looks like a person answered the
park when only a re-run of `discover` did).

## Proof surface

Verify (already recorded on the item, D3 — vacuous-pass-safe per
`docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md`):

```
out=$(node --test --test-name-pattern="tsk-60r" test/intake/discovery.test.mjs 2>&1); fail=$(echo "$out" | grep -oE "^. fail [0-9]+" | grep -oE "[0-9]+$"); test "$fail" = "0" && echo "$out" | grep -qE "^. .*tsk-60r D1"
```

Confirmed by hand against the current (unfixed) code: exits 1 (no test
named with "tsk-60r D1" exists yet) — not vacuous.

Two named tests to add to `test/intake/discovery.test.mjs`, matching the
file's existing naming convention (`resolveDiscovery <behavior> (<item-id>
<D-ID>)`):

1. `resolveDiscovery refuses a caller-supplied clear verdict when
   work.status is already awaiting-human from an earlier park (tsk-60r
   D1)` — set up an item already parked in `awaiting-human` (e.g. via a
   prior `putInAwaiting` call or direct fixture state matching how a
   verify-dispute park leaves it), then call `resolveDiscovery` with a
   caller-supplied clear verdict and a verify the second pass would
   accept; assert it throws `StoreError` with a message naming `fgos
   answer` as the resume path, and that neither `stage` nor `status`
   changed as a result.
2. `resolveDiscovery still advances normally on a caller-supplied clear
   verdict when work.status is not awaiting-human (tsk-60r D1, unchanged
   behavior)` — regression guard: same clear verdict, item NOT parked,
   confirms the existing byte-identical advance-to-decompose behavior
   still holds (this is what the existing test at line 1545,
   `resolveDiscovery skips judgeDiscovery and advances to decompose on a
   caller-supplied clear verdict`, already partially covers — this new
   test exists specifically so the verify's `--test-name-pattern="tsk-60r"`
   filter has a passing case to report alongside the refusal case, not
   because the old test was insufficient on its own).

Risk map: low. Single guard clause added to a well-covered function; the
new guard only fires on a narrow precondition (`work.status ===
'awaiting-human'` reached via the plain agree fall-through) that the
existing test suite's other ~20 `resolveDiscovery` tests never construct,
so no risk of an existing test's fixture accidentally tripping the new
guard. impact-analysis capability gate: GitNexus present, posture `full`
(re-checked this session) — not load-bearing here; the change is additive
(a new early-return/throw), not a rename or signature change, so no
blast-radius query beyond reading the function's own callers, already
done in `CONTEXT.md`'s scout (the sync `discover` verb and the async
runner sweep, per `resolveDiscovery`'s own docstring, both call through
this one function — the guard applies identically to both callers).

## Assumptions

- Exact `StoreError` category/exit code — planning leaves this to match
  the `--force` guard's own precedent (`discovery.mjs:696-699` uses
  category `'validation'`) unless implementation finds a concrete reason
  to diverge. Not material enough to lock as a separate `CONTEXT.md`
  decision (implementation detail, per `fgos-coding-exploring`'s own filter,
  already deferred there).
- Guard placement: checked once, right before the existing `moveStage`
  call at the end of the clear-verdict branch (after the dispute/force
  block, whether or not that block ran) — covers every way the plain
  agree-path can be reached, without duplicating the check inside the
  dispute block too (which already has its own `--force`-scoped check for
  the disagree case).
