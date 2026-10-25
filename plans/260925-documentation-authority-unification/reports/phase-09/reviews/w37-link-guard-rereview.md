# W37 re-review: link guard rework (b467e09fe)

This read-only review of `b467e09fe` checks it against the three REWORK items of
[w35](w35-link-guard-review.md) and the [w36 brief](../w36-link-guard-rework-brief.md).
Authority: L13-4.1, L13-26.2 and L13-28 in [owner-answers.md](../owner-answers.md).
Machine record: [w37-link-guard-rereview.json](w37-link-guard-rereview.json).

## Verdicts

| Area | Verdict | Severity |
| --- | --- | --- |
| 1. Moved-source resurrection fixed (`tree()`), probes on real composed states | APPROVE | none |
| 1. The 11 Related entries; Related and clickable retargets agree | APPROVE | none |
| 1. Control isolation, with mutation kills | APPROVE | none |
| 2. `related:36` successor, the 11 literal rows, `related:64` as rule 2.3 | APPROVE | none |
| 3. Rule 2.4 labels and the new stale-label check | APPROVE | none |
| 4. Record integrity: duplicate row id `L13-28:related:86` | **REWORK** | medium |
| 4. Replay of all 88 patches and 104 added or changed rows | APPROVE | none |
| 5. Receipt claims | APPROVE (historical section rewritten in place) | low |
| 5. Related `#fragment` operands vs product `relatedPaths` | APPROVE (widen the guard-3 duty) | low |
| 6. Proofs | APPROVE | none |
| 7. Shard-2 park-judgment change | APPROVE | none |

Counts: 10 APPROVE, 1 REWORK (0 high, 1 medium, 2 low).

## Key evidence

- **The w35 high item is fixed.** `tree()` is now `(pin | states) - moving`. On the real `compose(HEAD)` states, all 21 edited move-set sources are present in `states`.
  - Clickable probes into `doc-governance`, `routing-handoff-contract` and `transitional-switchboard` each raise exactly one `moved-target`.
  - A Related entry into each of the 21 sources also raises exactly one `moved-target`.
  - Reverting `tree()` makes `controls.py` fail on the new clickable control. Disabling the label append makes it fail on the stale-label control.
- **The 11 Related entries follow the rule order.**
  - Five self-sources point at anchors that equal the slugs of their pinned H1s.
  - Six cross-file entries point at their move destinations.
  - Rows into `routing-handoff-contract.md`, `io-contract.md`, `doc-governance.md`, `transitional-switchboard.md` and `README.md` each share one destination across Related and clickable rows.
- **Rule-2.2 rows.**
  - `related:36` now targets `docs/platform/seat-binding/spec.md#51-…`, per L13-4.1.
  - The 11 rows left literal are four external `mdview` absolute paths, six files deleted in `2180b4e72` (not renamed), and the untracked ClaudeKit `privacy-block.cjs`. Each carries five `successorChecks` sources.
  - I found no successor for any of them.
- **Labels.**
  - An independent oracle checked 600 labels on retargeted links: none is stale.
  - All 80 relabels change only the label and keep descriptive text and `§`/`mục` locators.
  - Injected stale labels (reverting five relabels; old basename, old relative path or repo-rooted path; a fresh link) each raise exactly one `stale-label`. A descriptive label raises none.
  - HTML `<a href>` labels are not checked, but none exist.
- **w37-6 (REWORK, medium).** `L13-28:related:86` is used for two rows: the old architect-readme row and the new coexistence composed-by-owner row.
  - The new rows were numbered 86..96, but 86 was already taken.
  - `check.py` keys `owner_files` by row id, so that one id now owns both files.
  - No proof asserts that row ids are unique.
  - Fix: renumber the coexistence row and add an id-uniqueness assertion.

## Proofs run

All exit 0:

- `check.py --pin HEAD`: 595 files, 229 proposals, 20 links, 0 findings. Only `sourceCommit` changed in `check.json`; it was restored.
- `controls.py`: 25 controls.
- `check_shard.py --all`: 0 unresolved, 24 `duplicateOfChain`. The transient `chain-check-b467e09fe.json` was removed.

Scratch was in `/tmp/fgos-work/w37rev`, removed. No git writes. No edits besides these two files.
