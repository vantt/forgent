# Preserve-premise fixes receipt

Status: **Scoped fixes verified; combined G2/G6 remains stopped at the G2 pin.** No gate acceptance, authority flip or independent approval is claimed.
Source pin: `4178dcc6e3445d5d9b8ffd55963cdd02a418af73`; baseline/checkout HEAD: `eb744281d`.
Read first: [brief](../w8-g6-fix-brief.md), [parks review](../reviews/w8-g6-parks-review.md), [judgments review](../reviews/w8-g6-judgments-review.md), [ruling L13-10](../owner-answers.md#l13-10--g6-exhaustive-reviews-and-file-level-framing-lead-2026-10-24-2100).
Evidence: [row delta](fix-delta.json), [double replay](fix-replay.json), [verification](verification.json), [misc checks](../misc-fix/checks.json), [prepared patch](prepared-patches.json).

## Reused mechanism and scope

Extended the existing operand step, `historical_evidence`, exact span binding, physical-move simulator and owning G6 assertions. Prior art: `git log -S'historical_evidence'` identifies `bade6b6b3` and `b25dadae2`; the earlier sentence receipt records `ad94156cf` (whole-unit rule) and `9d6070828` (physical-line restriction). L13-10 adds two explicitly bounded file-level rules; it does not restore unrestricted whole-unit framing. No executor, product mechanism or authority change was designed.

Only this directory and `misc-fix/{receipt.md,checks.json}` were written. Scratch is exclusively `/tmp/fgos-work/w8-g6-fix/`. The simulator's scratch guard was moved there. No Git mutation, fgOS CLI/lifecycle, workspace `.fgos/`, secrets, docs/product edit, test suite, service or pair accounting. Impact-analysis: **degraded/unqueried** (brief forbids the CLI, no exposed GitNexus tool). Markdown preview stays with Lead to avoid extra service/state writes.

## Operand normalization

Strip a trailing numeric line/range locator and leading `@`; expand an unambiguous truncated path from the bound line; resolve explicit relative destinations at their consumer. Prose prefixes such as `<repo>/` are not repository paths, punctuation is not part of a path, and ambiguous expansions supply no new target. Safe non-wildcard operands outside `docs/` keep their pin presence after this docs-only move; absent, unsafe and wildcard operands never gain presence.

All **15 class-A rows** now confirm: 11 through stable operands and four through dated archive evidence (their normalized operands are also stable). The general rule additionally confirms f08493 (closing prose delimiter) and f08561 (truncated bound path); neither gains historical framing. All identities and operands are in `fix-delta.json`. There are **13 operand controls**, with positive and negative coverage for every requested rule, plus relative, ambiguous, unsafe, wildcard, absent and moved-docs cases.

## Removed sources: 25 concrete actions

All 25 stay **owned parks**, not inherited preserves or automatic retirements. Each row names its holder, holder digest, exact row/operand, bound source unit and why recheck is necessary:

- **24 reading-map rows:** `docs/reading-map.md`. These are live navigation/source summaries (including decision/history summaries that are themselves navigation); a non-identical replacement map must be checked before carrying or dropping the clause.
- **f08335:** `docs/platform/workflow/spec.md`. Its foundational-laws link is live spec navigation, not a historical event to retire automatically.

The source retires **with no move destination**; the holder is explicitly a recheck action, not a fictitious physical successor. No blocker prints an empty successor list. `fix-delta.json#noDestinationActions` contains the per-row choices and reasons. The original **38** work-state retire-with-tree exclusions remain unchanged.

## File-level historical framing

A source must bind and survive before either rule can confirm it. Evidence quotes an actual header marker; dated-location evidence also names the real path and its date token. Existing sentence/carriage evidence takes precedence.

| New evidence rule | Before: park | Before: stable operand | After: history | Files |
|---|---:|---:|---:|---:|
| External repository header under `docs/distillery/sources/` or `reports/` | 137 | 32 | 169 | 12 |
| Dated Markdown report/plan under `archive/plans/` or `plans/reports/` | 182 | 3 | 185 | 120 |

Thus **319 parks become historical confirmations**, and 35 already-stable rows now have stronger historical evidence. The review's approximate population is not a hardcoded expected count: deep-dives/porting-log files outside the approved distillery locations do not acquire file-level evidence. All affected IDs and their before/after counts are recorded in `fix-delta.json#fileRules`.

The **10 file-evidence controls** include four positives and six negatives: missing outside-repo marker, a marker only in the body, wrong location, undated report, live `docs/history/` location and missing real header. No live `docs/history/<feature>/` convention is historicized. The previous ten sentence/binding negatives and five example/placeholder positives remain, as do the physical simulator's three negatives.

## Repoints and deferred composition

There are **six explicit `repoint-proposal` results**, not parks or confirmations:

- f08113 → `docs/platform/packaging-distribution/history/distribution-vision.md`.
- f08071 → `docs/platform/coexistence/spec.md`.
- f06985 → `docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md` (the strategy holder, not the broader portal or protocol contract).
- f07526/f07527/f07528 → the three holders required by the brief.

`prepared-patches.json` holds **one unapplied unified patch** for `docs/platform/proposals/dispatch-control-plane-redesign.md`, covering lines **22, 29, 33, 37** together, with preimage/proposed digests and exact replacements. The owning assertions reconstruct the proposed bytes and diff without editing the document. Both sibling rows are now repoint proposals.

`history-wrapper-proposals.json#compositionInstructions` records later work only: put notes after the header fence and before the snapshot, merge the notes in the 73 two-note files, use the actual flip date rather than the draft's 2026-10-23, and change f06391's “records” to “recorded” when composing. No notes or wording changes were applied to docs. All **163** wrapper positions and **73/73** review-batch files remain covered.

## Counts

Before is the delivered proof at baseline HEAD, at the same source pin; it is not an older source tree.

| Result | Before | After |
|---|---:|---:|
| Source-confirmed history/provenance/carriage | 2,574 | 2,926 |
| Stable operand reachability | 1,416 | 1,394 |
| Park: unconfirmed premise | 959 | 623 |
| Park: unbound passage | 137 | 137 |
| Park: absent source | 2 | 2 |
| Park: source removed by cutover | 162 | 162 |
| Proposed dated wrapper note | 163 | 163 |
| Explicit repoint proposal | 0 | 6 |
| Bounded confirmations | 3,990 | 4,320 |
| Total parks | 1,260 | 924 |
| Open rows: parks + notes + repoints | 1,423 | 1,093 |

The old proof counted f07526 as a park despite its repoint disposition; it now has a coherent repoint result. Two formerly confirmed siblings move out of confirmations. **4,320 + 924 + 163 + 6 = 5,413**, preserving **4,804 + 609** identities, 38 exclusions, 136 catalog batches, 27 zero-edge batches and the full 130 + 33 batch population. There are **373 result changes**; `fix-delta.json` also records operand/evidence/action changes without a result change (502 changed rows total).

## Commands and limits of proof

- `python3 -B .../preserve-premise/proof.py --pin 4178dcc6e`: exit **0**. Two isolated final runs with that exact argument also exit **0**. Stdout and **all five generated artifacts** (including the prepared patch) are byte-identical to each other and delivered bytes; sizes and SHA-256 values are in `fix-replay.json`.
- `misc-fix/verify.py`, executed through the scratch-only adapter recorded verbatim in `verification.json`: exit **0**. It repeats two G6 runs at the recorded pin, compares its four owning outputs, checks all historical bindings and doctor registrations, and executes the **entire updated owning G6 assertion section verbatim**. Only its scratch path and its rebind subprocess's scratch path are redirected; no assertion, pin or output location changes. Checks remain in `misc-fix/checks.json`.
- Unmodified `python3 -B .../preserve-premise/verify.py --pin HEAD`: exit **1**, **only at the early G2 delivered-pin equality assertion**, before any G6 replay. HEAD is intentional for this combined check because later source edits already exist; G6 itself stays at the requested historical pin. G2 is still at `3d0169f390e21c67bc3fc69081fd1bc07186599f`. No G2 check was weakened or bypassed, and no combined pass is claimed.
- `git diff --check`: exit **0**; `git diff --name-only HEAD -- docs src scripts test packages apps` is empty.

The exact commands, exits, stderr, adapter and script hashes are linked above. G2 refresh/shared-pin replay, independent review, all remaining parks and composition before the authority flip stay with Lead. Earlier `sentence-*`, `misc-checks.json` and `historical-pin-diagnostic.json` files are historical evidence of the preceding wave, not current verification.
