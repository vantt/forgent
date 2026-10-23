# Census custody follow-up receipt

Pin: `3d0169f390e21c67bc3fc69081fd1bc07186599f` (HEAD at execution). This supersedes the W1 receipt at `bade6b6b3`, not its historical evidence. **Records task complete; G2 remains unmet**, without independent approval or final-pin F coverage.

## Changes and result

- `join.py --pin <commit> --rescan` resolves an explicit commit and reads its tracked blobs; omitting `--pin` still selects HEAD.
- All **1,126 original ids / 140 files** remain set-equal to the frozen register: **646 owning-test joins, 293 exact grade-record REJECT confirmations, 187 owned judgments**. The latter still comprise 159 fixture, 21 drifted-grade and seven other rows. No old grade, register or source was rewritten.
- The **27 fixture rows whose sources were deleted** now name deleting commit **`5a33989fa39e0eb3d3253ddb4189cb502f93bd21`** (seat-binding conversion removal). One additional reader row has the same deletion: 28 absent-source judgments total, not shared-helper failures.
- `pc-d-0185` and `pc-d-0186` now name **`packages/git/rust/tests/recovery_matrix.rs:recovery_matrix_all_payload_kinds`**, not its ignored subprocess. Rust locators name the actual test attribute and separately the function line. The YAML golden locator and loader line are derived from source, not constants.
- All **116 empty-proof helper rows** explicitly say that no same-file caller is proved; none claims joined custody.

## Post-pin coverage

`post-pin-dynamics.json` reuses the unchanged Step 02l grammar and Step 07 subtraction, preserving the review's occurrence identities across exact diff-line rebinding. All **132 reviewed sites bind** at this pin: **77 owning-test joins + 55 source-judged non-document REJECTs**. Each of the **13 reader hints has a distinct individual reason**, distinguishing lease stdout, config-source reads, a reported config filename, a lock resource name, YAML scalar typing and config warnings/comments. A nearby docs cue is not evidence of a document read.

Rescan also finds **11 later dynamic sites**: ten fixture joins and one separately judged repository-root default in `scripts/lib/doc-git-reads.mjs`. Total delta: **143 = 87 proof joins + 56 source judgments**, zero unlisted reviewed sites. Source judgments are bound to the full source digest at this execution pin; later source drift must be rejudged, not inherited. These are proposed grades, **not independent approval**.

`post-pin-literals.json` retains **16 delta occurrences**: three YAML parser-fixture joins, five Config authoring-fixture joins, and **eight owned judgments** (two generated workflow instructions, five live standard-runner descriptions, one presenter contract citation). All 13 originally judgment-required literals have their own reason, including the five now joined through `authoring_equivalence.rs`. Fixtures stay frozen; generated/live surfaces need their own co-cut review.

## Evidence and replay

```sh
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/census-join/join.py --pin 3d0169f390e21c67bc3fc69081fd1bc07186599f --rescan
python3 -B plans/260925-documentation-authority-unification/reports/phase-09/preserve-premise/verify.py --pin 3d0169f390e21c67bc3fc69081fd1bc07186599f
```

Both exit 0. `../preserve-premise/verification.json` records two isolated runs, identical stdout and **eight byte-identical G2/G6 artifacts**, equal to delivered files; exact identities, deleted-source custody, reader reasons and Rust/YAML locators are checked. Proof names are custody locators, not claims that product tests ran.

Reuse: W1 join, Node bundled Acorn, unchanged census grammar, grade records and Git diff rebinding; extended the existing Rust test/helper custody rather than adding a scanner. Prior-art history: `bade6b6b3` introduced this records proof; `5e512a829` introduced the recovery parent/subprocess relationship. No removed product mechanism was restored.

No Git mutation, fgOS CLI, lifecycle, `.fgos`/secret read, product-source edit, full suite, product owning test, pair accounting or preview service. Product tests were unnecessary for records-only custody; temporary Git fixtures are allowed by the brief, not a reason to filter tests. Impact-analysis: **degraded/unqueried under no-CLI**. Independent review, eight literal judgments, 187 original judgments, final F refresh and accounting remain Lead custody. Markdown preview deferred to Lead to avoid out-of-scope service state. `needsWrites: []`.
