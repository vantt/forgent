# w8-g6-judgments review: G6 dated-note judgments and overturns

Verdicts: **163 APPROVE, 1 REWORK** (164 rows). The full list is in [w8-g6-judgments-review.json](w8-g6-judgments-review.json).

- Commit reviewed: f2162d9ff.
- Source pin: 4178dcc6e.
- This was a read-only review. I made no git writes and did not run the fgos CLI or any test suite.

## Scope

- **All 163 `judgment-preserve-with-dated-note` rows** in `preserve-premise/judgments.json`. This is the same id set as `history-wrapper-proposals.json`.
- **Every overturn in `proof.json`.** I counted a row as an overturn when its disposition is neither `preserve` nor `owned-park`. Only one row qualifies: **f07526** (`repoint-proposal`). Its `result` field still says `park-unconfirmed-preserve-premise`, so it is counted inside the 959 unconfirmed parks.
- **Not in scope:** the 1,259 owned parks. They are covered by w8-g6-parks-review.

## How each row was checked

I used a script to read each row's bound line at the pin and at HEAD. All 163 source files and both successor files are byte-equal at the two commits. For each row I checked:

- **Span:** the span matches `docs/specs/runner.md` exactly (1-based columns), and the bound line holds only one such citation.
- **Position:** the bound line sits before `## Literal Snapshot`. 86 "Superseded by" lines are inside the fenced header block. 77 framing lines are outside it.
- **Cutover effects:**
  - The operand is removed at cutover: `docs/specs/runner.md` splits into 17 holders.
  - The source file survives and does not move.
  - The successor is present at HEAD.
- **Successor type:**
  - The "Superseded by: … ownership/owners" lines map to `docs/platform/runner/spec.md`.
  - Every CoordinationSession framing line maps to `docs/platform/runner/decisions/h-aabefc85f0c9.md`, whose line 25 is the exact section heading.
- **Header class:**
  - 156 rows are `Document type: History` wrappers.
  - 3 rows are tables under `history/documentation-migration/`. These count as history class by path under L12-26(8).
  - 4 rows are retained playbooks. Their sentence is the dated retirement framing that L12-35(3) names.
- **Related lines:** in every header that has a Related `docs/specs/runner.md` line, that line is patched in the Step 3 records. So after the cut, "the legacy runner citation above" refers to only one line.
- **Completeness:** I scanned the pin independently. No wrapper line of this shape outside a snapshot lacks a dated-note row. The remaining NO-ROW hits are `agent-coordination/spec.md:20`, which is patched (maps-j-06546), plus verification/how-to lines that are not wrapper framing.

## REWORK

**f07526** (`docs/platform/proposals/dispatch-control-plane-redesign.md:29`)

The repoint target `docs/platform/agent-coordination/architecture/dispatch-control-plane.md` is correct. The problem is the rest of the same file:

- **Line 22 becomes false.** It declares "The three inline-code legacy paths are retained pending cutover." Repointing only line 29 breaks that statement.
- **Two sibling lines stay dead.** Lines 33 (f07527) and 37 (f07528) are the same kind of "retained at / start at" navigation under that declaration. Both would remain `docs/architect/…` pointers after the cut. Today they are confirmed preserves.

**Fix:** compose one patch that does all of the following:
- Line 29 → `docs/platform/agent-coordination/architecture/dispatch-control-plane.md`.
- Line 33 → `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md`.
- Line 37 → `docs/platform/agent-coordination/README.md`.
- Line 22: replace "The three inline-code legacy paths are retained pending cutover" with "The three inline-code legacy paths were repointed to their docs/platform holders at cutover".
- Reclassify f07527 and f07528 from `preserve-source-confirmed-history` to `repoint-proposal`.
- Optionally, record f07526's result as a repoint rather than an unconfirmed park.

## Notes (non-blocking, for the composer)

- **Placement:** each "Superseded by" note goes after the header's closing fence, never inside the fenced header. Each framing note goes right after its sentence, before `## Literal Snapshot`.
- **Two notes per file:** 73 files carry both a header note and a framing note. Merging them into one note that names both successors is allowed and smaller.
- **Note date:** "2026-10-23 cutover note (effective only after the authority flip)" is true only if read as the date the note was written. The flip has not happened yet. Using the real flip date at compose time would be clearer.
- **f06391:** the sentence says "`docs/specs/runner.md` records" in the present tense. The note makes this clear, and "recorded" would be cleaner.
