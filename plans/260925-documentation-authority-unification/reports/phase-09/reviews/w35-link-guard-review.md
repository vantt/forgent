# W35 review: whole-population link guard (8ea185bfd)

Pin of record and replay: `0557f175b`. Proofs ran at HEAD `d0d0e1aab`, which
differs from `8ea185bfd` only in `plan.md`. Machine record:
[w35-link-guard-review.json](w35-link-guard-review.json). Authority: L13-24, L13-26
and L13-28 in [owner-answers.md](../owner-answers.md). Brief:
[w34-link-guard-brief.md](../w34-link-guard-brief.md).

## Verdicts

| Area | Verdict | Severity |
| --- | --- | --- |
| 1. linkGuard population and resolution | **REWORK** (composed move-set sources count as existing) | high |
| 1. Parser coverage (CommonMark oracle) | APPROVE (latent gaps, 0 occurrences) | low |
| 2. 398 literal occurrences | APPROVE (wording: 394 fences + 4 code spans) | low |
| 3. Rule order: successor before literal | **REWORK** (`related:36` has an L13-4.1 successor) | medium |
| 3. Rule 2.4 labels | **REWORK** (49 retargeted links keep old file-name labels) | medium |
| 3. Mechanical record (all 285 rows / 82 patches) | APPROVE | none |
| 4. Row 125 | APPROVE | none |
| 5. Gateway YAML (L13-28.5) | APPROVE | low |
| 6. Controls / F door | APPROVE (no control for the case in w35-1) | low |
| 7. Shard edits / `check_shard --all` | APPROVE (mark 3 changed proposals for delta review) | low |

Counts: 7 APPROVE, 3 REWORK (1 high, 2 medium).

## Key findings

- **w35-1 (high).** `links.tree()` uses `(pin - moveSet) | composedStates`.
  - That adds back 21 move-set sources that F composes, such as `docs/doc-governance.md`, `docs/transitional-switchboard.md`, `docs/routing-handoff-contract.md` and `docs/README.md`.
  - **11 Related entries** in `docs/platform` still point into the move set after F. Five are self-sources; six have a successor in another file.
  - A probe shows the weakening. An injected `[gov](../doc-governance.md)` passes `linkGuard`, but the old `linkIntoMoveSet` semantics flag it.
  - The record also treats the same target two ways. It retargets clickable links into `docs/routing-handoff-contract.md` and `docs/io-contract.md` as moved, but leaves the Related entry into the same file.
  - So the receipt's "Related into move set 67 → 0" is false.
- **w35-2 (medium).** `L13-28:related:36` was made literal from a move-set `to:null`.
  - L13-4.1 names `docs/platform/seat-binding/spec.md` as the verbatim-carry successor, and that file exists. This is the same trap as row 125.
  - `related:64` is a self-source under 2.3, but is labelled 2.2. The result is the same; only the label and evidence are wrong.
- **w35-3 (medium).** 49 retargeted links keep the old file name as their label.
  - Examples: `[doc-governance.md](../../../governance.md)`, `[workflow.md](workflow/spec.md)`, and about 38 rows of `[host-invocation-provider-routing.md](spec.md#…)` in the host-invocation ledger.
  - Rule 2.4 was applied only to w33's 11 labels.

## What was verified

- **Parser agreement.** An independent CommonMark oracle (markdown-it-py) ran over the composed post-F tree, with product `relatedPaths` for Related headers and `listAnchors` for anchors. It covered 628 files and 2,701 destinations, the same multiset as `links.population()`, and found 0 failures.
- **Literal occurrences.** All 398 were checked with parser block tokens, not a sample: 394 are in fences, mostly `~~~~` snapshot wrappers, and 4 are multi-line inline code spans in `P00.1.md`. None is a link.
  - The current product `check-doc-candidate-status` `stripCode` would still count them.
  - Record the duty that guard 3 must agree with this witness as a machine F duty, not only in receipt prose.
- **Records.** All 82 patches round-trip. All 285 rows compose exactly through their basis stages. All destinations and anchors exist.
  - All 64 rule-2.3 rows match the old source's H1 and an existing anchor.
  - Row 125's intermediate hash `8ce81ee7…` is reproduced, and its final hash `15feba80…` is explained.
- **Proofs.**
  - `check.py --pin HEAD` exits 0. `check.json` changed only in `sourceCommit` and was restored.
  - `controls.py` exits 0 with 21 controls.
  - Three mutations of `links.py` each make `controls.py` exit 1: anchor check off, empty scan, moved paths kept.
  - `check_shard.py --all` exits 0 with 0 unresolved. The transient `chain-check-d0d0e1aab.json` was removed.

Scratch was under `/tmp/fgos-work/w35rev`, removed. No git writes. No repo file was
edited besides these two review files.
