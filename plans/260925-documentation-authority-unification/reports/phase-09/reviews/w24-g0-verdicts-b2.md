Verdicts: 294 APPROVE / 6 REWORK

# G0 per-row verdicts, batch 2

Pin: `dbc8d6655fe9fb3b77f67930eb0c9a18cb91bb9f` (HEAD; worktree clean). Rows come from `g0join/verdict-batches/batch-2.json`: 150 `s9-runner-01.json /claims/*` and 150 `s14-resync-b.json /bindingRefresh/*`. Machine-readable verdicts: [w24-g0-verdicts-b2.json](w24-g0-verdicts-b2.json).

## Method

- **Stored values:** each ledger row was read at its JSON pointer. `targetOwner`, `targetAnchor`, `targetUnitDigest` and `bindingSha256` equal the batch row for all 300 rows.
- **Binding hash:** recomputed with `ledgerfix/bindings.py` `digest()`. 300 of 300 match.
- **Target unit digest:** recomputed with the repository's own extractor. This was a copy of `g0fix/extract-units.mjs` with only its scratch directory redirected; both embedded Step 0 extractors agree. For all 300 rows the anchor is unique and `textDigest` equals `targetUnitDigest`. Self-inclusive ancestry equals `targetAncestry`. No native addon was mapped.
- **The claim for each row:**
  - s9 rows: the frozen source unit, found by `sourceUnitDigest` across all 50 git revisions of `docs/specs/runner.md`.
  - s14 refresh rows over s12: the superseded row's `sourceContent`.
  - s14 refresh rows over s11: the duty passage and the HEAD legacy holder unit.
  - Each non-identical pair was compared word by word. The `resync-a` adjudications and current legacy source were used only as context.

## Approvals (294)

- **259 byte-identical carries:** the claim digest equals the target digest. These are 130 s9 rows and 129 s12-derived refresh rows.
- **15 s11-derived refresh rows:** the target unit and section are byte-identical to the legacy holder unit at HEAD.
  - D-ADR0062 and D-ADR0035 narratives.
  - Knowledge-registry redesign §7.2, §7.3, §7.4, §13.5, §14.1 and §14.3.
  - Platform-foundations Business Rules, Edge Cases and Open Gaps.
- **6 s12-derived refresh rows with changed text:**
  - Relative-link rebase only.
  - Two headings whose section changed only by that rebase.
  - Workflow YAML front matter conserved verbatim inside a provenance fence.
- **14 s9 rows with changed text:**
  - 10 are `supersede` rows. Each changes only by a labelled retirement note, a link or line rebase, or the current Seat Binding / case-linkage truth that matches current `docs/specs/runner.md`.
  - 4 are `move` headings whose title is unchanged or only gained a qualifying annotation.
  - Non-blocking: several rationales still cite the older A41 evidence or say "Full native unit digest equal" after the resync-a rebind.

## REWORK (6) — `move` rows whose target no longer carries the frozen claim

Each row is recorded as `move` with "Full native unit digest equal", but `sourceUnitDigest != targetUnitDigest`. The resync-a rebind refreshed the target digest in place and kept `move`. Each needs a `supersede` (or retire) disposition with the resync-a adjudication as evidence, or a rebind.

- **s9 /claims/11:** the source says rigor maps through `runner.rigorToTier` to tier and drives effort. The target says rigor never decides tier or effort (D-ADR0072).
- **s9 /claims/14:** the claim (an explicit `tier` channel that may only raise the tier; the legacy tier field is migrated at load) is bound to the rigor paragraph `unheaded-block-4`, not to the `unheaded-block-7` its rationale names. The target refuses tier raises, and the migration sentence is lost.
- **s9 /claims/15:** the source says a capability must not declare model or tier. The target says a capability declares `tier`/`maxTier`.
- **s9 /claims/133:** the vocabulary table's tier cell is rewritten ("rigorToTier deleted") and every `runner.md:N` citation is renumbered.
- **s9 /claims/154:** "Workflow integrates the Work lifecycle" becomes "Workflow does not know Work (historical DAG)". The text also adds debate and the two doors.
- **s9 /claims/250:** a dated decision-history audit has its write-door citation changed from `withEventsLock`/`appendEventLocked` (events.mjs) to `withStateTx` (hot-lock.mjs) without a label.

Related observation: /claims/11 and /claims/14 bind the same target unit.
