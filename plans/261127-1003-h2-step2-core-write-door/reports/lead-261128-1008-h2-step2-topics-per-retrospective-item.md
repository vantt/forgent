# H2 step 2: topics per retrospective item

Plan `261127-1003-h2-step2-core-write-door`, phase 6. Status of this report: baseline and G2 measured; the after
count waits for retrospective items (the pool is empty).

## 1. Baseline

The old retrospective writer opened **0.53 new topics per retrospective item** in the only month it ran against the
registry (September 2026: 147 topics over 277 items; 0.61 per item that attested). In the 30 days before the phase 4
land (2026-10-28 to 2026-11-27) no item moved from `retrospective` to `cleanup`, so the window the phase file names
holds no items; the last such moves were on 2026-10-25.

| Month of the move to cleanup | Items | Items that attested | New topics opened | Topics per item |
|---|---|---|---|---|
| 2026-08 | 492 | 0 | 0 | 0 |
| 2026-09 | 277 | 240 | 147 | 0.531 |
| 2026-10 | 2 | 0 | 0 | 0 |
| 30 days before phase 4 | 0 | 0 | 0 | none |

All 147 topics that have a `doc.reserve` were opened for a retrospective item; none was opened on a person's request.
In August items reached cleanup through linked documents or decisions, not registry attestation, so they open no
topic in the registry; whatever they wrote as files is not counted here.

**Query.** The event store was exported unconfined by the supervisor
(`fgos events export --out .fgos/runtime/tmp/h2-step2-events`, 45,545 events) and read by
[`baseline-topics-per-item.mjs`](baseline-topics-per-item.mjs); its output is
[`baseline-topics-per-item.json`](baseline-topics-per-item.json). The attribution: `topic.register` and `doc.reserve`
carry no work-item id, and the 343 `doc.register` events are one bulk registration of existing files whose
`sourceCaptureIds` hold paths. The old writer registered a topic, reserved its slot, and attested its item against
it (`doc.attest`, `captureId` = item id). A topic therefore counts as opened by an item when it has a `doc.reserve`
and that item is the first, by its move to cleanup, whose `doc.attest` names it. The phase file's first idea
(join through `doc.register` `sourceCaptureIds`) finds nothing, for the reason above.

## 2. After

Not measured yet. On 2026-11-28 no work item is at status `retrospective` (`fgos list --all`: 0 retrospective,
2 cleanup). Steps 2, 3 and 5 of the phase need at least five real items.

## 3. Where search lost to the scan

Not measured yet; it reads the `fgos.doc.locate` records of the after period. Section 4 gives the same counts for the G2 calls.

## 4. English notes over the Vietnamese specs (G2)

Gold set: [`g2-gold-en-over-vi.yaml`](g2-gold-en-over-vi.yaml), 17 cases, each with at least one Vietnamese platform
spec section as a right answer. One agent wrote 18 notes from source code without opening `docs/`; a second agent
chose the gold sections and dropped one note no document carries; seven cases match their section only in part
([notes](g2-gold-en-over-vi-notes.md)). The drafts for per-case locate calls are in [`g2-drafts/`](g2-drafts/).

**Result** (run unconfined by the supervisor on the ready index, 2026-11-28, profile `fgos-docs@f2df908502a8`,
1,009 notes; [`g2-eval.json`](g2-eval.json)):

| Measure | Value |
|---|---|
| Cases with an owner | 17 of 17 |
| Recall at 3 | 0.4706 (8 of 17) |
| Recall at 10 | 0.6471 (11 of 17) |
| Right section first, of the hits that name a section | 6 of 11 |
| Top-10 misses | en-vi-02, 03, 04, 06, 07, 08 |

For comparison, the 2026-11-12 measurement found a Vietnamese note over English documents ranked a right unit in the
top 3 for 0% of queries. English over the Vietnamese specs does far better (47%), but a third of the notes still
miss the top 10.

**Would `mentions` have caught the misses?** The per-case locate answers are in [`g2-locate/`](g2-locate/), one
call per note on the ready index (none `partial`).

| Miss | Backticked names in the note | Right document among the mentions |
|---|---|---|
| en-vi-02 | `transitionWork`, `reason`, `ask`, `answer` (the last three past the 20-section cap) | no |
| en-vi-03 | none | no |
| en-vi-04 | `gate-command-missing` | **yes**, flagged `missedBySearch` |
| en-vi-06 | none | no |
| en-vi-07 | none | no |
| en-vi-08 | none | no |

The scan rescued 1 of the 6 misses, the one note carrying an exact error code. Four are G1 in a new form (prose with
no names); one is G7 (only common names). Over all 17 calls: 8 terms, 93 mention sections, 80 of them
`missedBySearch`, in 3 calls (18%); 3 terms hit the cap, all in en-vi-02. The large `missedBySearch` count is mostly
the common words of en-vi-02 (71 sections), which is why the procedure lets the writer mark such a term `too-common`.
Where the search already found the right document, the scan added it again for en-vi-13 and en-vi-18 and missed it
for en-vi-09 (its term `mergedTreeAlreadyVerified` appears only in other documents).

## 5. G1 residue

Not measured yet; it comes from the after items.
