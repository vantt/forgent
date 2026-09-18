# P03.1 Reviewer Recheck — fix round 1

Recheck of the three fix-round commits (`2a601d5c`, `db65f2a3`, `c48d0de7`)
against my six original findings in `reviewer-findings.json`. Scope is
verification of those six only, not a fresh audit. Every verdict below rests
on my own re-executed repro or my own grep/read, not on the Doer's fix-round
report.

## Verdict table

| Finding | Severity | Verdict |
|---|---|---|
| R-P03.1-01 | HIGH | **FIXED** |
| R-P03.1-02 | MEDIUM | **FIXED** |
| R-P03.1-03 | MEDIUM | **FIXED** |
| R-P03.1-04 | MEDIUM | **FIXED** (one narrower residual, newly observed) |
| R-P03.1-05 | LOW | **FIXED** (one narrower residual, newly observed) |
| R-P03.1-06 | LOW | **FIXED** |

**6/6 fixed, 0/6 not fixed, 0/6 partial.**

---

## R-P03.1-01 (HIGH) — show.mjs ownership mirror — FIXED

`src/verbs/coordination/show.mjs:56` now takes `humanTurnIds`, adds the
`human-turn:` prefix branch (:66-68) and the bare-id near-miss (:76), and
`refOwnedOpts` (:283) populates the set from `coordinationState.humanTurns`
— accepted turns only, correctly mirroring the adjacent `contributionIds`
line's post-terminal posture.

Re-ran my original repro. Both directions of the divergence are gone:

```
A write door refuses bare "turn_1": validation
A show targetRefOwnedBySession = false (must be false)     <- was true
B write door refuses path-shaped turnId: validation -> vector unreachable
C write door refuses human-turn:never_recorded: dangling-ref
```

The false positive (case A) is closed directly. The false negative (case B,
`human-turn:../victim`) is closed structurally: the R-03 shape guard now
refuses that `turnId` at the write door, so the ref can no longer be
created. The valid-ref case still reports `owned=true`, and now for the
right reason — via the new prefix branch rather than the unconditional
fall-through that produced the correct answer by accident before.

The new regression test is honest: it hand-crafts a bare `turn_1`
`targetRef` and a valid `human-turn:turn_1` `evidenceRefs` entry onto **one**
disposition via the raw `appendEvent` primitive, so it fails pre-fix in both
directions rather than only one.

## R-P03.1-02 (MEDIUM) — replay attributedTo ref-shape — FIXED

`src/runner/coordination/replay.mjs:269-275` now applies the identical
three-prefix test as `store.mjs:1445`. Re-ran my original hand-written-log
repro:

```
R1 replay refused: validation session "c1": "human-turn-recorded" event "turn_1"
   attributes the turn to "asgn_deadbeefca...                 <- previously ACCEPTED
R2 replay refused: validation                                 <- previously ACCEPTED
```

Doc reconciliation checked independently. T1 now enumerates all four
`attributedTo` refusals and states each is re-checked at replay, and names
the pre-fix gap explicitly rather than papering over it. T8's list now
includes the ref-shape check and `respondsToRefs[]`. The two rows are
mutually consistent and both match the code. The `**Refusals (write door and
replay, independently)**` heading at :857 is now true of both layers. The
CHANGELOG line was corrected in the same round.

## R-P03.1-03 (MEDIUM) — turnId shape guard — FIXED

`assertHumanTurnIdShape` exists at `store.mjs:1347-1367` and is called as
the **first statement** of `recordHumanTurn` (`store.mjs:1422`), before
`resolveSessionPaths` and before the lock. It mirrors
`assertContributionIdShape` rule-for-rule and additionally rejects a leading
`human-turn:`. It correctly returns early for the non-string/empty case,
leaving that to `validateEventPayload`.

It actually rejects, verified live:

```
R4 write door refused: validation recordHumanTurn: turnId "../../../etc/passwd"
   must not contain a path separator                          <- previously ACCEPTED
R5 write door refused: validation   (turnId "human-turn:spoof") <- previously ACCEPTED
```

The Doer took the recommended route (guard the id shape) rather than
reordering `assertDispositionRefOwnedBySession`'s prefix branch ahead of the
segment scan, so pre-existing `contribution:` behavior is untouched. That
was the right call.

## R-P03.1-04 (MEDIUM) — replay respondsToRefs — FIXED

`replay.mjs:298-331` now re-checks each entry: `human-turn:` →
`out-of-order-ref` if not already walked; `contribution:` → `dangling-ref` if
never linked; bare id matching a known turn/contribution → `validation`
near-miss. Checked before this turn's own id joins `humanTurnIds`, so a turn
cannot cite itself. `contributionIds` is confirmed in scope (declared
`replay.mjs:126`, populated at :499) and is correctly running state, matching
the append-only discipline.

My original repro:

```
R3 replay refused: out-of-order-ref                           <- previously ACCEPTED
```

**Newly observed residual (not part of the original finding).** Replay's
check is an inline reimplementation covering the two reserved namespaces and
the bare-id near-miss — it does not run the cross-session / `asgn_` segment
scan that `assertDispositionRefOwnedBySession` runs at the write door.
Demonstrated:

```
A replay ACCEPTED cross-session respondsToRefs = ["coordination/sessions/victim/session.json"]
A write door refused: validation | recordHumanTurn: respondsToRefs[0]: ref
  "coordination/sessions/victim/session.json" names a different coordination session
```

This is strictly narrower than what I originally reported (which was "no
validation at all") and the harm I named — a turn responding to a turn that
never existed — is genuinely closed, so the finding is FIXED. Two follow-ups
worth a line in the backlog rather than a block:

- T8 now says replay re-validates "`respondsToRefs[]` ownership" without
  qualification. At the write door "ownership" includes the cross-session
  scan; at replay it does not. One qualifying clause would make the row
  exact again.
- The same-shape-different-code duplication between the replay branch and
  `assertDispositionRefOwnedBySession` is the same drift risk that produced
  R-P03.1-01. Worth watching if a third rule is ever added.

## R-P03.1-05 (LOW) — artifactRef containment — FIXED

`src/verbs/coordination/run.mjs:587-604` computes
`path.relative(ctx.cwd, resolvedArtifactPath)` and refuses when it starts
with `..` or is itself absolute. That is the correct standard test — it
handles the prefix-collision case (`cwd=/a/b`, target `/a/bc/x` → `../bc/x`)
that a naive `startsWith(cwd)` gets wrong, and the absolute-result branch
covers Node's cross-drive/UNC edge. It is placed before `readFileSync`, so
an out-of-workspace path is never opened, not merely never recorded. Two
tests cover it (relative `../` traversal and an absolute path), both
asserting the specific message.

**Newly observed residual:** there is no `realpath` call (grep confirmed: no
hits in `run.mjs`), so a symlink that lives *inside* the workspace but points
outside it still passes containment and gets hashed. Same class as the
original finding but a different vector, and unreachable except from an
operator-authored request file — informational, not a reopen.

## R-P03.1-06 (LOW) — test gaps — FIXED

All three named gaps are covered: the `show` ownership mirror (1 test,
both directions on one disposition), the replay `attributedTo` ref-shape
re-check (3 tests, one per prefix), and replay `respondsToRefs` (4 tests:
dangling `human-turn:`, dangling `contribution:`, bare-id near-miss, and one
positive real-chain case). The `turnId` shape guard adds 3 more. The commit
message states each new test was verified to fail without its matching fix
via per-file stash; I did not re-do that per-test, but I independently
confirmed the *pre-fix* behavior for every finding via my own repros above,
which is the same claim from the other direction.

## Item 6 — case-sensitivity disposition ("not a bug") — ACCEPTED

I verified the grep claim myself rather than accepting it:

```
$ grep -rn "toLowerCase|toUpperCase|localeCompare|normalize(" src/runner/coordination/   -> ZERO HITS
$ grep -rn "toLowerCase|toUpperCase|localeCompare"            src/verbs/coordination/    -> ZERO HITS
$ grep -rn "toLowerCase|toUpperCase|localeCompare"            src/runner/deliberation/   -> ZERO HITS
```

Confirmed. Case-sensitive, exact-string identity comparison is this module
family's universal existing convention, not an oversight local to the
human-turn door. Making only `attributedTo.id` case-insensitive would make
it the sole identity field in the module with different matching semantics
than `recordedBy`/`authorizedBy`/`validatedBy`/`linkedBy`/actor ids — a
worse, more surprising state than the current one. A characterization test
pinning the existing behavior is the right response, and changing the
convention is a module-wide decision, not a P03.1 cell decision. I accept
"not a bug" as the disposition.

## Test runs (mine, independently executed)

Focused suite:

```
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
    'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' \
    'test/cli/coordination.test.mjs' 'test/architecture.test.mjs'
ℹ tests 742
ℹ pass 742
ℹ fail 0
ℹ skipped 0
ℹ duration_ms 12607.501057
```

Confirms 742/742. (Was 728 at my first review; +14 new tests.)

Full suite:

```
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 npm test
ℹ tests 5680
ℹ pass 5671
ℹ fail 3
ℹ skipped 6
ℹ duration_ms 191570.082246

✖ failing tests:
✖ ask/answer round-trip on a genuinely legacy durable-doing item (no claim):
  answer clamps to todo — awaiting-human -> doing no longer exists
✖ fgos docs-index tolerates a missing quadrant dir (tutorials has no alias)
  with no crash and no entries from it
✖ coordination-example-requests-valid passes against this repo's own real,
  published example requests + protocols
```

All three map exactly to recorded baseline items 1, 2, and 3. Baseline item 4
(live codex usage-limit) did not fire, as on my first run — expected for a
network-dependent case, not a regression. **Zero new failures.** Test count
5666 → 5680 (+14), matching the focused-suite delta exactly, which confirms
the fix round added no tests outside the coordination surface.

## Unresolved questions

- Should T8's `respondsToRefs[]` clause be qualified to note that replay's
  ownership check is namespace-scoped and does not include the cross-session
  segment scan the write door runs? (Doc precision only; the code behavior is
  reasonable as-is.)
- Is `realpath` resolution wanted for `artifactRef`, or is an in-workspace
  symlink pointing outside acceptable given the operator-authored trust model
  for request files?

Neither blocks the cell.
