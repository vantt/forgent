# P03.1 — Fix Round 1 Report

Responding to independent Reviewer (`reviewer-report.md`/`reviewer-findings.json`)
and Red-Team (`redteam-report.md`/`redteam-findings.json`) findings against
commits `a0536301`, `b7805868`, `da1aaea8`, `d61808c9`. All six findings
addressed; five fixed with a genuine, verified-to-fail-without-the-fix test
each, one investigated and left unchanged with evidence for why.

## 1. HIGH (Reviewer R-P03.1-01) — `show.mjs`'s `isRefOwnedBySession` mirror gap

**Fixed.** `src/verbs/coordination/show.mjs`:
- `isRefOwnedBySession` gained a `HUMAN_TURN_REF_PREFIX` branch (owned iff
  `humanTurnIds.has(id)`) mirroring the existing `CONTRIBUTION_REF_PREFIX`
  branch exactly, plus the matching bare-id near-miss refusal
  (`if (humanTurnIds.has(ref)) return false;`).
- `refOwnedOpts` (the object built once per `show` call and threaded into
  every `isRefOwnedBySession` call) now includes
  `humanTurnIds: new Set(coordinationState.humanTurns.map((r) => r.turnId))` —
  it was previously entirely absent, so the new branch above would have
  silently defaulted to an empty set even after being added.
- Module header comment (the one stating the "every write-door rule change
  must be mirrored here in the same commit" invariant) updated to name the
  `human-turn:` namespace as a second example alongside `contribution:`.

**Test:** `test/verbs/coordination-run-driver-steps.test.mjs`, "show marks
a bare turnId disposition ref as NOT owned, and a human-turn:<id> ref as
owned" — hand-crafts one disposition (via the raw `appendEvent` primitive,
bypassing `recordDriverDisposition` entirely, the same technique this
file's own pre-existing "show marks a disposition ref as NOT session-owned"
test uses) with `targetRef: 'turn_1'` (bare) and
`evidenceRefs: ['human-turn:turn_1']` (prefixed), against a real recorded
turn. Asserts `targetRefOwnedBySession === false` and
`evidenceRefsOwnedBySession === [true]`.

**Verified to fail without the fix:**
```
$ git stash push --keep-index -- src/verbs/coordination/show.mjs
$ node --test test/verbs/coordination-run-driver-steps.test.mjs
✖ show marks a bare turnId disposition ref as NOT owned, and a human-turn:<id> ref as owned ...
  AssertionError: a bare turn id must never render as an owned ref ...
  true !== false
$ git stash pop
```

## 2. MEDIUM (Reviewer R-P03.1-02 / Red-Team Finding 1) — replay missing the `attributedTo` ref-shape refusal

**Fixed the code, not the doc** (per instruction: "the smaller lie-to-truth
distance", and Red-Team's own recommendation). `src/runner/coordination/replay.mjs`'s
`human-turn-recorded` branch gained the fourth check, placed right after
the panel-actor check, matching `store.mjs:1445`'s condition exactly:

```js
if (/^asgn_/.test(attributedTo.id) || attributedTo.id.startsWith(CONTRIBUTION_REF_PREFIX) || attributedTo.id.startsWith(HUMAN_TURN_REF_PREFIX)) {
  throw new CoordinationError('validation', `... attributes the turn to "${attributedTo.id}", which is shaped like a driver-authored ref ...`);
}
```

**Doc reconciliation** (`coordination-session.md`'s Human Turn Provenance
section): T1's Mechanism column now says "all-FOUR `attributedTo`
refusals... each re-checked independently at replay" and names the
pre-fix inconsistency explicitly. T8's Mechanism column now lists the
ref-shape check among what replay re-validates (it previously omitted it —
correctly, since the code didn't have it yet — and is updated to match the
new, complete code). The "Refusals (write door and replay, independently)"
heading paragraph gained a parenthetical pointing at the corrected T1/T8
rows. CHANGELOG.md's `[Unreleased]` entry updated in place (still
unreleased, no separate changelog entry needed) to mention the fix-round-1
replay-parity work.

**Test:** `test/runner/coordination-replay.test.mjs`, three new cases (one
per reserved shape — `asgn_`, `contribution:`, `human-turn:`), each
hand-appending a raw `human-turn-recorded` event via `appendRawHumanTurn`
(never through `recordHumanTurn`) and asserting `replaySession` throws
`category === 'validation'` matching `/shaped like a driver-authored ref/`.

**Verified to fail without the fix:** all three new tests failed (event
replayed clean, no throw) when `src/runner/coordination/replay.mjs` was
stashed; confirmed passing after restore alongside the other 25
pre-existing tests in that file (28/28).

## 3. MEDIUM (Reviewer R-P03.1-03) — no `turnId` shape guard at the store door

**Fixed.** `src/runner/coordination/store.mjs` gained `assertHumanTurnIdShape`,
a direct mirror of the existing `assertContributionIdShape` (no path
separator, no `..`, must not itself start with `CONTRIBUTION_REF_PREFIX`
or `HUMAN_TURN_REF_PREFIX`), called at the very top of `recordHumanTurn`
before `resolveSessionPaths` — the identical placement
`recordContributionLink` already uses for its own id-shape guard.

Per Reviewer's own stated concern (unresolved question in their report): I
did NOT reorder or touch `assertDispositionRefOwnedBySession`'s existing
early-`return` structure for `contribution:`/`human-turn:` — guarding the
id SHAPE at the write door (this fix) is what the Reviewer explicitly
recommended over reordering the scan, "precisely to avoid changing
pre-existing `contribution:` behavior in this cell." Confirmed no
`contribution:`-path behavior changed: the full focused suite (742/742,
below) includes every pre-existing contribution-ledger test, unchanged.

**Test:** `test/runner/coordination-human-turn.test.mjs`, three new cases:
a `turnId` containing `/`, a `turnId` containing `..`, and a `turnId`
starting with `contribution:` or `human-turn:` (both sub-cases in one
test). Each asserts `category === 'validation'` and a message match.

**Verified to fail without the fix:** all three failed (no throw at all —
`recordHumanTurn` appended the malformed `turnId` successfully) when
`store.mjs` was stashed; 25/28 passed, exactly the 3 new ones failing.

## 4. MEDIUM (Red-Team Finding 2) — replay never validated `respondsToRefs` ownership

**Fixed.** `replay.mjs`'s `human-turn-recorded` branch gained a loop over
`event.payload.respondsToRefs` (when present), checked BEFORE this turn's
own id is added to the running `humanTurnIds` tracking set (so a turn
citing itself is correctly treated as "not yet recorded", matching the
append-only-log self-reference impossibility the
`deliberation-contribution-linked` branch already relies on):
- `human-turn:`-prefixed entries must name a turn already walked
  (`out-of-order-ref` otherwise) — the SAME category the adjacent
  disposition-targetRef check right below it already uses for the
  identical "not yet recorded" condition.
- `contribution:`-prefixed entries must name a contribution already linked
  (`dangling-ref` otherwise).
- A bare id matching either a known turn or a known contribution is a
  near-miss (`validation`), mirroring the write door's own near-miss
  refusal.

**Test:** four new cases in `coordination-replay.test.mjs`: dangling
`human-turn:` respondsTo, dangling `contribution:` respondsTo, bare-id
near-miss, and one POSITIVE case (a real two-turn chain where the second
turn's `respondsToRefs` legally cites the first) proving the fix does not
over-refuse a legal reference.

**Verified to fail without the fix:** the three rejection cases all
"passed through" (no throw, turn recorded into `humanTurns` as if the
dangling/bare ref were fine) when `replay.mjs` was stashed — same stash
run as finding 2 above (both fixes live in the same file/hunk set, tested
together: 6 new tests all failed pre-fix, all pass post-fix, 28/28 total).

## 5. LOW (Reviewer R-P03.1-05 / Red-Team Finding 3) — no `artifactRef` workspace containment

**Fixed.** `src/verbs/coordination/run.mjs`'s `human-turn` step dispatcher
now computes `path.relative(ctx.cwd, resolvedArtifactPath)` immediately
after resolving `step.artifactRef`, and refuses with a named `StoreError`
when that relative path starts with `..` or is itself absolute (the
standard "escaped the root" test — catches both a `../` traversal and an
absolute path in one check, since `path.relative` from `cwd` to a path
outside it always yields one of those two shapes). Placed before the
`fs.readFileSync` call, so an escaping path never even gets opened.

I deliberately did NOT add the SAME charset restriction `turnId`/
`respondsToRefs` get (`assertSafeId`, which would also reject the path
separators every real relative artifact path needs, e.g.
`"human/1-person.md"`) — containment is the right-shaped fix for a real
file path; a charset ban would break the legitimate case schema.mjs's own
`validateHumanTurnStep` comment already documents (a genuine relative path
with subdirectories).

**Scope note:** Red-Team's Finding 3 also named a symlink-swap-after-recording
scenario ("recorded revision unchanged, nothing re-checks it"). That is
not a containment gap — it is the same property EVERY content-addressed
hash in this codebase has (a `revision` pin is a point-in-time hash,
correctly never re-verified against a mutable target after the fact,
exactly like `deliberation-contribution-linked`'s own disclosed limitation
"`revision` currency is checked once, at link time" in this same contract
doc). Not fixed, not silently dropped either — named here as intentionally
out of this fix's scope, consistent with an already-disclosed, whole-kernel
property rather than a `human-turn`-specific gap.

**Test:** two new cases in `coordination-run-driver-steps.test.mjs`: a
`../`-relative escape to a real file in a fresh OS temp dir outside the
workspace, and an absolute path to the same kind of file. Both assert a
`StoreError` matching `/outside the working directory/`.

**Verified to fail without the fix:** both new tests failed (file read and
hashed successfully, `appended: true`) when `run.mjs` was stashed; 55/57
passed, exactly the 2 new ones failing.

## 6. LOW (Red-Team Finding 4) — self-attribution check is exact-string

**Investigated, left unchanged — already-consistent-behavior, not a bug.**
Grepped `src/runner/coordination/**` and `src/verbs/coordination/**` for
`toLowerCase`/`toUpperCase`/`localeCompare`: **zero hits**, confirmed live
just before writing this report. Every identity comparison in this module
— `assertDriverIdentity` (used by `authorizeOperation`,
`recordDriverDisposition`, `recordSpecialistAuthorization`,
`recordAggregationValidation`, `recordContributionLink`, and my own
`recordHumanTurn`), the declared-actor-id membership check
(`declaredActorIds.has(...)`), `findExistingManifest`'s writerId
comparison in `run.mjs`, and this human-turn door's own self-attribution
check — is exact-string, case-sensitive, with no exception anywhere.
Introducing case-insensitive comparison for JUST this one check would be
the inconsistent choice, not the safe one: it would create a single
special case that disagrees with how the SAME driver identity is compared
everywhere else a session touches it (e.g. `assertDriverIdentity` itself,
called on the exact same `recordedBy` value two lines above the check Red
Team flagged), which is a worse property than the informational
"visually confusable in the ledger" observation Red Team raised.

**Test added (characterization, not a behavior change):**
`test/runner/coordination-human-turn.test.mjs`, "recordHumanTurn
self-attribution check is exact-string (case-sensitive), matching every
other identity comparison in this module" — asserts a case-variant of the
driver id IS accepted (`appended: true`), documenting the intentional
behavior so a future change cannot silently drift into inconsistency
without failing a named test.

## Test Counts

Verified with `git show d61808c9:<file> | grep -c '^test('` against the
current file, per suite:

| Suite | Before fix round 1 (commit `d61808c9`) | After | Delta |
|---|---|---|---|
| `coordination-human-turn.test.mjs` | 24 | 28 | +4 (turnId shape ×3, case-sensitivity characterization ×1) |
| `coordination-replay.test.mjs` | 21 | 28 | +7 (ref-shape ×3, respondsToRefs ×4) |
| `coordination-run-driver-steps.test.mjs` | 54 | 57 | +3 (show mirror ×1, artifactRef containment ×2) |
| Focused suite total | 728 | **742** | +14 |

4 + 7 + 3 = 14, matching the focused-suite delta exactly.

## Real Command Output — Focused Suite (post-fix)

```
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
  'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' \
  'test/cli/coordination.test.mjs' 'test/architecture.test.mjs'
```

**742 tests, 742 pass, 0 fail.** Raw log:
`proofs/P03.1/fix-round-1-focused-suite-run.log`.

## Real Command Output — Full `npm test` (post-fix)

**5680 tests, 5671 pass, 3 fail — 0 new failures.** Raw log:
`proofs/P03.1/fix-round-1-full-test-run.log`. The 3 failures map to
baseline items 1 ("legacy durable-doing ask/answer"), 2 ("docs-index
missing-quadrant"), and 4 ("coordination-example-requests-valid" /
resume-example placeholder chars) by exact file/test-name match. Baseline
item 3 (the live `codex`/`glm-cli` executor flake) did not fire on this
run — a network-dependent case, matching the same non-determinism the
original doer report and the Reviewer's own independent run both already
observed (Reviewer's own run also showed 3/4, not 4/4, for the identical
reason).

## `detect_changes` Output (post-fix)

`--scope all` (isolated working-tree diff against HEAD, i.e. exactly this
fix round's own uncommitted work at the time it was run): **7 files, 8
symbols**, risk CRITICAL (same fan-in-driven label as before — no new
information). Raw output: `proofs/P03.1/fix-round-1-detect-changes-isolated-diff.log`.

Cross-checked against the real diff rather than trusted at face value: 4 of
the 8 listed "changed" symbols in `store.mjs`
(`knownContributionsFromEvents`, `asCoordinationError`, `recordContributionLink`,
`category`) are NOT functions this fix round touched —
`git diff --stat` for this fix round's 4 touched files shows
**0 deletions** in `store.mjs`/`replay.mjs`/`run.mjs` (pure insertions:
+104/-5 total, all 5 deletions in `show.mjs`'s own two edited lines) and
**0 net line-count change** anywhere outside my own new code. The
mismatch is GitNexus's line-hunk-to-symbol attribution picking up nearby,
untouched symbols because my inserted `assertHumanTurnIdShape` function
shifted the line numbers of code below it (including
`recordContributionLink`, `asCoordinationError`, `knownContributionsFromEvents`)
— a mapping artifact, not a real behavior change, the same caveat named
for the CRITICAL risk labels in the original doer report.

`--scope compare --base-ref main`: 264 files, 1396 symbols (whole-branch
divergence from `main`, same caveat as the original report — not a useful
per-cell signal on its own). Raw output:
`proofs/P03.1/fix-round-1-detect-changes-vs-main.log`.

## Files Changed This Fix Round

- `src/runner/coordination/replay.mjs` — attributedTo ref-shape re-check + respondsToRefs re-validation
- `src/runner/coordination/store.mjs` — `assertHumanTurnIdShape` + call site
- `src/verbs/coordination/run.mjs` — artifactRef workspace containment
- `src/verbs/coordination/show.mjs` — `isRefOwnedBySession` mirror + `refOwnedOpts` wiring
- `docs/architect/agent-coordination/contracts/coordination-session.md` — T1/T8 reconciliation, turnId-shape/artifactRef-containment mentions
- `CHANGELOG.md` — in-place update to the still-`[Unreleased]` entry
- `test/runner/coordination-human-turn.test.mjs` (+4)
- `test/runner/coordination-replay.test.mjs` (+7)
- `test/verbs/coordination-run-driver-steps.test.mjs` (+3)
- This report + updated proof logs

## Unresolved Questions Carried Forward

- Reviewer's own unresolved question ("was the ref-shape replay omission
  deliberate?") is now moot — closed by fixing the code.
- Red-Team's own unresolved question 3 ("should `appendEvent`'s
  'tests-only' re-export be enforced rather than merely commented?") is
  NOT addressed by this fix round — it is a pre-existing, whole-module
  property (`appendEvent` is re-exported for every event kind's tests, not
  something this cell introduced or widened), out of scope for a
  human-turn-specific fix round. Naming it here rather than silently
  dropping it, per the same disclosure standard the rest of this track
  uses.

Status: DONE
Summary: All 6 findings addressed — 5 fixed with a test verified to fail without the fix (stash-and-rerun proof for each), 1 (case-sensitivity) investigated and left as consistent, documented behavior. Focused suite 742/742, full suite 3/3 pre-existing-baseline failures only (0 new), detect_changes isolated diff cross-checked against the real git diff.
Concerns/Blockers: None blocking.
