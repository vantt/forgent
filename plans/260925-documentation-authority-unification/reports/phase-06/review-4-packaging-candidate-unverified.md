# Review 4: Packaging-distribution candidate-unverified list and identical-unit exceptions

Reviewer: reviewer:claude-session:a4954387@2026-10-14
Author session: codex-session:8@2026-10-13
Review mode: ordinary
Request commit: 33d36aadd
Content commit: baef3a075

## Scope and method

Machine check under A28 item 2, not a per-unit truth review. Inputs: `candidate-unverified-packaging-distribution.json` (692 tuples), `identical-unit-exceptions-packaging-distribution.json` (2 groups), review packs candidate-unverified-01..04. The worktree was read only (`git status --short` is empty at the end). Everything below was recomputed in my own scratch dir, not copied from the author's verification file.

- (a) Units: for every tuple I read `git show baef3a075:<path>`, ran `extractMarkdownConservationUnits` (exported by `scripts/generate-doc-inventory.mjs`), and compared the `textDigest` of the unit at that anchor with `unitDigest`.
- (b) Eligibility: I read the header and status lines of all 22 distinct files at `baef3a075`. I also compared each file's authority with `transitional-switchboard.json`.
- (c) Equality with the reverse-open set: I copied `/tmp/fgos-work/packaging-review/registry.json` (sha256 fa9e1a6c..., unchanged after the run) into scratch. I refreshed a scratch inventory at HEAD 33d36aadd (the registry is bound to that commit, no carry-forward needed). I ran the scoped strict E gate with the nine `--scope` sources from `packaging-distribution-placement.json`, `--previous-registry reports/identity-registry.json`, and both decision directories. This was one gate run at a time. The repo was not written.
- Sample: I drew 10 random units (seed 20261014) from the 692 shown in the four packs. For the whole list I also checked which units are not byte-identical at B0 `dbe5c4328` and where their text comes from.

## Results

| Item | Verdict | Note |
|---|---|---|
| (a) 692 tuples, unit exists at path/anchor with that digest at baef3a075 | ok | 692 of 692 match, 0 missing anchors, 0 digest mismatches, 0 duplicate claim IDs, `count` field equals row count. |
| (b) File eligibility under A28 item 2 | ok | 22 files, all `authorityStatus: candidate`, none canonical: 18 non-history files with Design status Candidate (4) or Draft (14), plus 4 history files (distribution-baseline, migration-map, rewrite-plan, track-closeout), each also Candidate or Draft. The promoted portal `README.md` contributes no tuple. |
| (b) Header wording "Canonical: Yes, after review" | ok | All files except the decision file and the two migration-history files (those say `Canonical: No`) carry this phrase, which is the candidate template, not the gate's canonical flag (`Canonical: Yes` alone). The switchboard scope that is promoted is only `README.md`. Observation only: the promotion step must not read the phrase as already canonical. |
| (c) List equals strict E reverse-open set | ok | My run of the scoped strict E gate gives `candidate-blocks-unreferenced` = 692, and the set of (claimId, path, anchor, unitDigest) tuples equals the committed list in both directions (0 extra, 0 missing). The other open data are 407 not-reviewed, 1 partial-carry, 2 identical groups, 1 dropped-unreviewed, as in the request. Fatal findings equal the same five open categories only. |
| Identical-unit exception group 1 (digest 6d8e01ea, migration-map unheaded-block-5 and rewrite-plan unheaded-block-14) | ok | Both source units recompute to the same digest, and both target units at `history/documentation-migration/{migration-map,rewrite-plan}.md` (unheaded-block-7 and -16) match it. It is the same target-tree code block, under "2. Target Area Shape" / "4. Proposed Target Shape", and each copy sits in its own source document's section. Two owners are legitimate (different source contexts). |
| Identical-unit exception group 2 (digest 0a60f4e2, README unheaded-block-10 and scope-map unheaded-block-10) | ok | Both are the sentence "Use this rule to decide whether a detail belongs in packaging/distribution:" under "Boundary Rule". Targets are `README.md#unheaded-block-39` and `spec.md#unheaded-block-60`, which mirror the source documents (README, and scope-map via spec.md under "Historical Document Split"). Digests verified at source and target. |
| Exception list equals computed multi-owner groups | ok | Grouping the 407 decision rows by source digest with more than one target owner gives exactly these 2 groups with these 4 claim IDs. |
| Sample of 10 units for unlabelled invented claims | ok | 8 of the 10 are byte-identical to the same file at B0 (pre-batch candidate text, for example spec 4-runtime-selection, activation-binding status rule, code-panel P9, implementation-alignment unheaded-block-3). The other 2 are batch-authored and labelled: the setup-doctor-registry header (Provenance and "Do not use this for" lines) and the "Added in candidate" retained-detail note. No invented behavioural claim found. |
| Wider check of the 111 units that differ from B0 | ok | 49 are title or heading units whose header changed. 54 start with "Added in candidate" or are template header blocks. The remaining ones were traced: the spec.md Windows channel and the setup-doctor `convention-conformance` text exist in main's own `docs/platform` files at 3e30ecd37 (merged upstream edits). The distribution-pin field table exists at B0. The installed-default decision file is a labelled proposal (Candidate, Canonical: No) and its cited commits 4db6ee7e5 and c831811fa exist. Nothing found that is unlabelled and invented. |

## Notes

- The two identical groups still show `reviewStatus: pending`, as the request states. That is not a defect of this check.
- This is a conservation and eligibility check only. I did not verify the truth of any candidate assertion against code (promotion and the 30-unit truth sample cover that).

Status: DONE
