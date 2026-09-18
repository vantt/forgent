# P03.1 Independent Reviewer Report — human-turn trusted-input door

Reviewer: independent second pass. Formed from the code, tests, and the
P03.1 spec/contract text only; the Doer's own report in this directory was
not read.

Scope reviewed: commits `a0536301`, `b7805868`, `da1aaea8`, `d61808c9` on
branch `group-thinking-plan-loop` (`git diff f7485c03..HEAD`).

## Verdict

The slice is well built and genuinely additive. The write door is real —
every refusal the spec asks for exists in `recordHumanTurn` and is
individually tested against the real door, not a mock. Replay is a real
second gate against hand-written logs, not a rubber stamp. The `revision`
hash is computed by the request door from the file's actual bytes and a
missing file fails loudly.

Six findings, one HIGH. The HIGH is a mirror that was not updated in the
same commit, in violation of an invariant that module states in its own
header comment. The rest are replay/write-door asymmetries and doc
overclaims.

## 1. Scope discipline — clean

Additive only. `git diff --name-only` touches nothing outside
`src/runner/coordination/{schema,store,replay}.mjs`,
`src/verbs/coordination/{schema,run,show}.mjs`, their tests, docs, and one
CHANGELOG line.

Explicitly checked and confirmed absent: no `STATUS_VALUES` or disposition
enum widened; no `fgos ask` / `fgos answer` touched; no new subverb; no
classification/heuristic enum on the human turn itself (`attributedTo` is
`{type:"person", id}` only, and a test asserts any third field is
rejected).

Existing kinds' validation is not reachable by the new code. The four new
field names (`respondsToRefs`, `recordedBy`, `turnOrdinal`, `attributedTo`)
were each grepped in `src/runner/coordination/schema.mjs`: all four appear
only in the new `human-turn-recorded` spec rows and the shared validator
branches. Because `validateEventPayload`'s shared branches only fire for
fields a kind's own `accepted` list contains, no existing kind's behavior
changes. The one edit to an existing test is a message string
(`"...or \"human-turn\""`), which is correct.

## 2. Refusal logic — all six exist and are real

Read at `src/runner/coordination/store.mjs:1393-1500`. Confirmed by
reading, not by string search:

| Refusal | Location | Real |
|---|---|---|
| `attributedTo.id === recordedBy.id` | store.mjs:1432 | yes |
| panel actor as `attributedTo.id` | store.mjs:1438-1444 | yes |
| driver-authored ref shape as `attributedTo.id` | store.mjs:1445 | yes |
| `turnOrdinal` must be `max+1` | store.mjs:1466-1472 | yes |
| `externalRef` uniqueness | store.mjs:1474-1480 | yes |
| `turnId` immutability / identical-payload idempotence | store.mjs:1455-1464 | yes |

Two structural details worth crediting, both verified: the `attributedTo`
refusals run *before* the idempotency read, so a byte-identical repeat of
an already-illegal payload is refused again rather than absorbed as
"already recorded"; and the idempotency comparison canonicalizes the two
nested objects, so key insertion order cannot make an identical payload
look different.

## 3. Replay re-validation — real, but incomplete

`replay.mjs:241-306` genuinely re-derives driver identity, self-attribution,
panel-actor attribution, duplicate `turnId`, `externalRef` reuse, and
ordinal contiguity from the raw log. The tests exercise it with
hand-appended `events.jsonl` lines (`appendRawHumanTurn`), not with events
that already passed the write door — that is the right test shape.

Two invariants are **not** re-checked: the `attributedTo` ref-shape refusal
(finding R-P03.1-02) and `respondsToRefs` ownership (R-P03.1-04). Both
reproduced empirically.

## 4. File-hash binding — correct

`src/verbs/coordination/run.mjs:586-599`. `revision` is computed
(`createHash('sha256').update(artifactBytes)`) after `readFileSync`, never
accepted from the request — and `validateHumanTurnStep`'s allowed-key set
excludes both `revision` and `recordedBy`, with a dedicated test for each
rejection. ENOENT/EISDIR raise a named `StoreError` naming the resolved
path; any other errno is rethrown unswallowed. One residual noted as LOW:
the path is not constrained to the workspace (R-P03.1-05).

## 5. Test quality

52 new tests. I looked specifically for a test that would still pass with
its refusal deleted and did not find one — assertions check error class
plus category and/or a message regex, and the revision test independently
recomputes the expected hash rather than echoing the reported value.

The gap I did find is structural, not vague: the `show` test constructs its
disposition with `targetRef: '$ref:produce'`, so no `human-turn:` ref ever
reaches `isRefOwnedBySession` — which is exactly why the HIGH finding
shipped green (R-P03.1-06).

## 6. Threat-model honesty

T2, T3, T4, T5, T7 are accurate. T6 is honestly disclosed as open by
design and I agree it cannot be closed in-process.

**T1 is overclaimed.** "re-checked independently at replay" is true for the
self-attribution and panel-actor halves and false for the driver-authored-
ref-shape half. Counter-scenario, executed: a hand-written
`human-turn-recorded` event with `attributedTo: {type:"person", id:
"asgn_deadbeefcafe0001"}` replays clean and lands in `humanTurns`; the
identical payload is refused by `recordHumanTurn`. Same for
`id: "contribution:x1"`.

The prose heading at `coordination-session.md:854` ("Refusals (write door
and replay, independently)") carries the same error, and the CHANGELOG
sentence does too. Notably the **T8 row's own list is accurate** — it
enumerates what replay re-validates and correctly omits the ref-shape
check. So the document contradicts itself; T8 is the honest row.

**T8's "Narrowed, not fully closed"** is the right disposition, but its
residual is understated by the two replay gaps above: a forger does not
need to hold the real driver identity to slip a driver-authored-ref-shaped
`attributedTo` or a fabricated `respondsToRefs` past replay.

## 7. Test runs

Focused suite:

```
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test \
    'test/runner/coordination-*.test.mjs' 'test/verbs/coordination-*.test.mjs' \
    'test/cli/coordination.test.mjs' 'test/architecture.test.mjs'
ℹ tests 728
ℹ suites 0
ℹ pass 728
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 11845.954693
```

Full suite:

```
$ FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 npm test
ℹ tests 5666
ℹ pass 5657
ℹ fail 3
ℹ skipped 6
ℹ duration_ms 186673.509814

✖ failing tests:
✖ ask/answer round-trip on a genuinely legacy durable-doing item (no claim):
  answer clamps to todo — awaiting-human -> doing no longer exists
✖ fgos docs-index tolerates a missing quadrant dir (tutorials has no alias)
  with no crash and no entries from it
✖ coordination-example-requests-valid passes against this repo's own real,
  published example requests + protocols
```

All three map to the track's recorded baseline (`index.md` Baseline §, items
1, 2, 3). Baseline item 4 (live codex usage-limit) did not fire on this run,
which is expected for a network-dependent case. Test count grew 5614 → 5666
(+52). **No new failures.**

## Recommended actions, in order

1. Fix `isRefOwnedBySession` + `refOwnedOpts` for the `human-turn:`
   namespace, and extend the existing `show` test to cover it (R-P03.1-01).
2. Add the `attributedTo` ref-shape check to `replay.mjs`, or correct
   `coordination-session.md:854`, the T1 row, and the CHANGELOG line to
   match reality (R-P03.1-02).
3. Add a `turnId` shape guard mirroring `assertContributionIdShape`
   (R-P03.1-03).
4. Re-check `respondsToRefs` at replay, or disclose the gap in T8
   (R-P03.1-04).
5. Optional: constrain or document `artifactRef` resolution (R-P03.1-05).

## Unresolved questions

- Was the omission of the `attributedTo` ref-shape check from replay
  deliberate (on the theory that a forger able to hand-write the log could
  also just pick a plain-looking id)? If so, the doc should say that rather
  than claim the check runs at replay.
- Is `assertDispositionRefOwnedBySession`'s early `return` for namespaced
  refs — which skips the cross-session segment scan — intended to be
  permanent for `contribution:` as well? R-P03.1-03 recommends guarding the
  id shape rather than reordering the scan, precisely to avoid changing
  pre-existing `contribution:` behavior in this cell.
