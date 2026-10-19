# Step 02i defect diff against step-02h

Input committed tree: `c5efdf003417b6f68441d9297c1d0519b12f68b1`. Consumer bytes are read only with `git ls-tree` / `git cat-file` at this commit. All existence, kind, directory-mirror and successor checks use that tree; the working directory is never a target-existence source.

The [complete machine diff](step-02i-defect-diff.json) compares reference, complete expression, rule, role, owner, anchor, action, patch, successor note and carriage policy for all step-02h source-span joins. It records **679 changed source rows**, two newly found source units and **75 review finding joins**. This is an unsampled author disposition ledger, not an independent acceptance verdict.

## L12-25 differential witnesses

Counts below cover the explicitly enumerated real defect witnesses, not an extrapolated census-wide error rate. Every listed before row demonstrably fails its independently stated expected outcome; every joined after row passes. The complete changed-row ledger remains the full-population diff.

| Class | Before → after |
|---|---:|
| 01-migration-state | 12 → 0 |
| 02-verified-object-pins | 7 → 0 |
| 03-wrapped-complete-references | 10 → 0 |
| 03-wrapped-markdown-link | 1 → 0 |
| 04-source-locator-and-proof-preserved | 22 → 0 |
| 04-history-header-self-reference | 1 → 0 |
| 05-source-carriage-heading | 2 → 0 |
| 06-operative-reading-list | 2 → 0 |
| 07-section-bounded-line-locators | 2 → 0 |
| 08-generated-rows | 2 → 0 |
| 08-checker-scan-scope | 1 → 0 |
| 09-planning-list-is-reader | 2 → 0 |
| 09-retired-handoff-checkpoint | 1 → 0 |
| 10-legacy-tree-semantics | 3 → 0 |
| 10-fragment-carriage-successor | 4 → 0 |
| settled-retired-read | 1 → 0 |
| exact-retained-subfolder-file | 1 → 0 |

The 10 requested classes include their subcases. The two additional settled/exact-file rows are separate witnesses. Source/header witnesses already correct in step-02h are invariant guards and are not counted as invented regressions.

## Inherited L12-21 through L12-24

All prior defect predicates remain at zero after regeneration, including block-context writers, migration precedence, trailing slash, whole placeholders, code specifiers, directory mirror prefixes, retained history, deleted-target notes, migration-plan source locators, retired checkpoints, exact Observe spec and alias-free carriage. The legacy directory-mirror measurement excludes `legacy-tree-semantic`: L12-25 parks assertions about the legacy tree itself. It continues to test operative navigation mirrors.

The [review data](step-02i-review-data.json) retains every per-baseline class count and source row ID. The [probe suite](step-02i-probes.py) retains all 113 earlier differential probes and adds 79, for **192 old-fail/new-pass probes**, plus 9 syntax cases and 8 snapshot mutation checks.

The candidate switchboard has **61 migration-state edges**. The fragment witnesses retain mechanically checked `#literal-snapshot` successor notes without executable patches. Verbatim carriage is preserved without requiring an alias. Phase 9 must exclude its historical broken links from the post-cutover link check; this is an obligation, not a checker edit.

Two newly captured units: a wrapped `[Dispatch Control / Plane]` label in `architecture/work-integration.md:61`, and a blockquote-wrapped `docs/reference/forgentx-tool-registry-configuration.md` in the stateful-verb knowledge how-to at line 19.

Reproduce this diff without writing consumers: `python3 step-02i-diff.py` from this report directory (stdout JSON). Mechanical replay: `python3 step-02i-replay.py --input-commit HEAD`. Semantic A50 review and Step 3/5 proof remain open.
