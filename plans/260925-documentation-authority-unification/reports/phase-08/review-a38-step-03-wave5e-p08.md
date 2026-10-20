# Review a38 step-03 wave5e part p08

Pin ae141550c2e022310de7a0efea757580c0b2479f. Read-only. No checker or probe run. Both files were read from the pin: the git spec (1032 lines) by outline plus every edge region and a full grep for legacy paths, the governance file (500 lines) whole.

## docs/platform/git/spec.md

- Set: batch-101. Stratum: patched (also mandatory-threshold, 271 KB). Verdict: **ok**. Edges reviewed: 2 of 2, plus the complete diff.
- maps-j-06901 (L48, `docs/specs/runner.md`). Patch to `docs/platform/runner/spec.md` at Phase 9. The target exists at the pin. The source is a header Related list entry that names the whole runner area, with no section locator. A whole-file target is right.
- maps-j-06902 (L49, `docs/specs/distribution.md`). Patch to `docs/platform/packaging-distribution/spec.md` at Phase 9. The target exists at the pin. This is the same whole-area Related navigation. The sibling entry `packaging-distribution/README.md` is native and untouched.
- Diff: exactly these two spans change, in one fenced header block. Surrounding text and the line structure are intact, and each replacement is the complete original path form.
- Missed references: none. A full scan of the file for `docs/specs`, `docs/architect`, `docs/decisions` and `docs/history` finds only L48 and L49. Bare D-ADR numbers (D-ADR0055, 0057, 0058, 0042) carry no path, so they are not edges (L12-49). The `AGENTS.md` mention at L1031 is not a retiring path.
- Record text: nothing to report.

## docs/platform/governance.md

- Set: batch-102. Stratum: unpatched (empty diff, confirmed). Verdict: **ok**. Edges reviewed: 13 of 13, comprising 10 inventory edges and 3 author-added edges.

| Edge | Line | Disposition | Judgment |
|---|---|---|---|
| 06903 | 9 | preserve | Provenance line naming retained root `docs/doc-governance.md`. It is lineage (L12-47). The file exists. Correct. |
| 06904, 06905 | 17, 18 | preserve | Wrapper Related entries for the retained roots `doc-governance.md` and `reading-map.md`. Neither is in a retiring root. Correct. |
| 06906, 06907 | 96 | phase9-row-flip (shared unit, line-L96) | "During migration, existing docs/specs/** and docs/architect/** remain valid legacy/current sources". Migration status is the subject, so it flips (L12-35(2)). Correct. |
| 06908 | 472 | preserve | `[reading-map.md](../reading-map.md)` resolves to the retained `docs/reading-map.md`. Correct. |
| 06909 | 476 | parked, description-rewrite | Live "source design discussion" row pointing at the retiring `docs/architect/documentation-system-design.md`. Its only candidate holder is `docs/platform/documentation/architecture/documentation-system-design.md`. I read that file's header: "non-canonical candidate conservation carrier... Canonical for: Nothing". The park claim is true, so carriage is not a patch target (L12-30, L12-34). Correct. |
| 06910 | 488 | preserve | Source Metadata capture, Provenance line (L12-47 and L12-40). Correct. |
| 06911 | 495 | preserve | Source Metadata capture, Related list, retained `docs/reading-map.md`. Correct. |
| 06912 | 499 | preserve | Source Metadata capture, Related list, retiring `docs/architect/documentation-system-design.md`. Correctly kept separate from the live Related row at L476. Correct. |
| L50C3, L51C3, L52C3 (author-added) | 50-52 | preserve | The fenced `docs/` target tree lists `README.md`, `doc-governance.md` and `reading-map.md`. The stated parent is `docs/`, and all three are retained roots that exist at the pin. Correct. |

- Missed references: none found. Checked against the full source:
  - Fenced tree leaves at L56-79 and L326-339 resolve under their stated parents (`docs/platform/`, `docs/platform/<area>/`). Each is candidate-native or an abstract layout, not a retiring path.
  - Lines 457-475 (switchboard and `migration-authoring-rules` links, the `platform/proposals/documentation-system-unification.md` mention) resolve to existing native paths under `docs/platform/`.
  - `docs/transitional-switchboard.md` at L496, inside the captured header, is not in a retiring root and is not a retained-root target per the checker's definition, so it needs no edge.
  - There is no other mention of `docs/specs`, `docs/architect`, `docs/decisions` or `docs/history` as a path.
- Record-text notes (not rework):
  - 06911's reason does not mention that L495 sits in the captured Source Metadata region. The disposition is unaffected.
  - The L471 and L473 link labels (`README.md`, `transitional-switchboard.md`) are stale beside native destinations. These are the source's own links, not edges. This is an advisory observation only; no change is required here.

## Counts

| Set / stratum | Reviewed | Rework |
|---|---|---|
| batch-101 patched (includes the mandatory file) | 1 | 0 |
| batch-102 unpatched | 1 | 0 |
| Part p08 total | 2 files, 15 edges | 0 |

## Lead-judgment questions

None. The batch-089 open lead-ruling is not in this part.

Status: DONE
Summary: Both files (git/spec.md, 2 patch edges; governance.md, 13 edges) are ok with no outcome defects. Dispositions, targets and parks verified against the pin.
