Verdicts: 256 APPROVE / 7 REWORK

# W23 review: G6 park judgments, shard 2

## Scope and method

- Reviewed `preserve-premise/park-judgments/shard-2.json` and `shard-2.md` from commit `b677076c0`, at the shard pin `c94545de5`.
- `docs/` has no diff between the pin and the reviewed HEAD `587222468`.
- Checked against the brief (`w22-g6-park-judgments-brief.md`), ruling L13-20, and the `proof.json` rows listed in `shard-2-ids.json`.
- Every one of the 263 rows got its own verdict. For each row I read the bound passage, its section heading and the file header at the pin. One row per verdict is in [w23-g6-shard-2-review.json](w23-g6-shard-2-review.json).
- `python3 -B …/check_shard_2.py --shard 2` exits 0: 263 rows, 12 groups, 16 patches.
- I replayed all 16 prepared patches myself in a tempdir (`patch --batch --fuzz=0 -p1`, forward and reverse):
  - all 16 reach `proposedSha256` and restore the source bytes;
  - each one changes exactly its listed lines.
- Successor claims were checked against the ledger maps (`area-map-root-authorities.md`, `area-map-whole-system-architecture.md`, `area-map-runner.md`) and the successor bytes at the pin.

## REWORK (7 rows, all medium)

### R1. Removed-door banners keep a dead decision locator (f04047, f04287)

- The two knowledge docs open with a 2026-10-14 "Removed door" banner. The banner is current framing that sits above the history; it is not part of that history.
- Its text "(decision 0062 in `docs/specs/runner.md`)" tells the reader where the authority for that present claim lives.
- The shard repoints the same parenthetical-citation form in f06833 and f06835, so these two rows are judged inconsistently.
- At cutover, decision 0062 moves to `docs/platform/runner/decisions/h-36d872fbb0e5.md` (heading at line 1722; `area-map-runner.md:50`; listed in the proof `sourceSuccessors`).
- **Fix:** repoint with a one-token patch, or explain why a banner citation counts as lineage.

### R2. Self-referencing repoint (f06461)

- The `Related:` header of `docs/platform/architecture-map.md` lists its own legacy source. Line 16 says so: "Provenance: Promoted anchor from docs/architecture-map.md".
- The patch makes the file list itself.
- The shard preserves the same own-source Related shape in f06794 (governance), f06504, f06823, f06702 and f06591.
- **Fix:** re-judge as preserve-confirmed lineage, or remove the entry.

### R3. Placement-map patch breaks the tree (f06790, f06791)

- The patch swaps `README.md` and `doc-governance.md` at the `docs/` root of the governance §2 "Target platform docs" tree for `platform/documentation/operations/portals/docs-portal.md` and `platform/governance.md`.
- Result:
  - those paths become direct children of `docs/`;
  - the `platform/` subtree below still omits them;
  - `templates/` stays, although the templates are archived to history.
- f07134 (approved) tells writers to "Follow the placement map in docs/platform/governance.md §2", so the broken tree would be live guidance.
- **Fix:** either a coherent tree edit (drop the moved root entries, put `governance.md` under `platform/`), or an owned park for the governance-carry owner.

### R4. Live mapping destination left unowned (f06920, f06933)

- Line 189 of `release-boundaries.md` and line 326 of `component-protocol.md` also hold a live link: "[the retained component-boundary advisory](../../../architect/component-boundary/component-boundary-advisory.md)".
- That link resolves to this row's own operand. The proof marks the operand `removedByMoveOrStep6`, with successor `docs/platform/component-boundary.md`.
- No other proof row covers that link. Preserving the row therefore leaves a dead clickable route and a false "retained".
- `shard-2.md` admits the destination is unassigned; these rows are where it should be assigned.
- **Fix:** repoint only the right-hand link.
- The literal-excerpt rows f06916 and f06932 (inside the fenced excerpts) are correctly preserved.

## Cross-cutting finding for the Lead

### X1. Preserved links in docs/platform/** will not resolve after F (decision needed before F)

- 36 approved preserve-confirmed rows in `docs/platform/**` keep a reference that will not resolve after F:
  - 27 clickable markdown links to files removed at F (f06799, the host-invocation "source …" Related rows, the coverage-matrix rows, and the vision "Preserved from" rows);
  - 9 own-source `Related:` header paths (f06504, f06591, f06697, f06699, f06700, f06702, f06794, f06823, f07205).
- Their semantics are correct. These are lineage, not authority routes.
- But the Phase 9 cutover must land guard 3, a "link and anchor check inside docs/platform/**" (`phase-09-atomic-platform-authority-cutover.md:34-38`). The existing `links-resolve` gate in `scripts/check-doc-candidate-status.mjs` also counts Related paths.
- The Lead needs to settle one of these before F:
  - guard 3 exempts source-labelled lineage links and own-source Related entries;
  - those links become code spans or point to the successor holders.
- Each affected row's JSON entry carries a pointer to this finding.
- f06698 (`[../contracts/](../contracts/)` in a history template) is already broken at the pin.

## Approved groups (256 rows)

| Group | Rows | Why the premise holds |
|---|---:|---|
| completed-work | 109 | Past-tense item, incident or verification narrative, quoted captures, and Source/verify sections. Operands identify the event's subject. Distinctions checked: f03897 vs f03898; f04255 vs f04271; f04211–f04215 (already absent at the pin, a closed rollup list). |
| literal-input | 7 | A pattern, regex prefix, fenced diagnostic, example path or fenced code comment. |
| migration-inventory | 18 | The header says "Canonical for: Migration bookkeeping only"; the body says "temporary migration aid". The operand is already absent at the pin. |
| history-wrapper | 8 | Own-source Related entries and template placeholders inside History or candidate wrappers. |
| audit-history | 15 | `Document type: History`, "Do not use this for: Current canonical authority". |
| source-relationship | 29 | Source-labelled lineage rows (subject to X1). |
| frozen-metadata | 3 | Inside the fenced "Source Metadata (Added in candidate)" headers. |
| restored-host-source | 22 | Verbatim-restored excerpts and commit-pinned restoration notes. f06920 and f06933 are excluded (R4). |
| correction-evidence | 3 | A40/A19 receipt; "A22 rebindings are pending; no truth approval carried." |
| distribution-history | 11 | "Use old docs as source material, not final authority"; the portal Source type line. |
| law-successor | 6 | The successor units at `docs/platform/platform-foundations.md` (99–106, 113–136, 239–266) carry the operands. The non-identical opening is disclosed. |
| live-route | 25 | Current Related entries, normative citations and instructions. Ledger targets verified; patches minimal and replayable. Excludes f06461, f06790 and f06791. |

Low or informational notes on approved rows:

- **f06787, f07112:** the anchors follow the extractor slug (single hyphen). GitHub's slug would be `#l7--durability-ladder` (`AGENTS.md:359`) or start with `0035--`. Both anchors sit in code spans, so they are not clickable.
- **f06805:** the cited rule sits in cli-io-contract §4, not the bound §3. The holder file is correct.
- **f06808:** sibling `x-specs` entries (`docs/specs/work-state.md`, `docs/specs/runner.md`, lines 54–55) have no proof rows. F composition must cover them, or the list ends up half-repointed.
- **f03757, f03758:** borderline. Approved as the rationale for a past reversal.

## Process notes

- The checker is `check_shard_2.py`, not the shared `check_shard.py` the brief names. `shard-2.md` discloses the rename. It passes.
- The record makes no owned-park or `needsFlipDate` claims, so none are disputed.

## Commands (all run read-only)

| Command | Exit |
|---|---:|
| `python3 -B …/park-judgments/check_shard_2.py --shard 2` | 0 |
| independent patch replay, 16 files, forward and reverse | 0 |
| `git show` / `git grep` at `c94545de5` for framing, ledger, slug and guard sources | 0 |
| row/proof cross-joins (`python3 -B`, scratch in `/tmp/fgos-work/w23s2.*`, deleted) | 0 |
