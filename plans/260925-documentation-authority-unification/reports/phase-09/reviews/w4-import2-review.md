# w4-import2 review (77db6ed2b)

APPROVE 18 / REWORK 2. Exhaustive recomputation, no sampling.

## REWORK
- **data-dictionary-rows-adapted-carry**: s16 binding distribution.md unheaded-block-5 -> spec.md unheaded-block-90 is an adapted carry that drops main's new clause 'from the route's reconcile-scan, each with its pane id' (row 7 terminal-allocations) with no partial-carry residual or member binding; the fact lives only in terminal-control/spec.md:153 which this row does not bind. Row 5h's 'together with every directory under it' is covered by the same doc's decision line 741. Add the clause or record a residual/member binding (docs/platform/packaging-distribution/spec.md '| 7 |' row; ledger/decisions/s16-import2-resync.json sourceBindings[3])
- **source-pin-provenance**: Recorded input pin 92260972c (legacy-drift.json head replayed by --check; binding-refresh sourceHEAD used by verify.py git show; merge-accounting inputHEAD; checks.json; exceptions previousMainMergeAccounting.inputCommit) is not an ancestor of 77db6ed2b: it is the pre-rebase twin of 5965143b4, reachable only from branch plan/260925-w1-d1. Inputs verified identical (docs, ledger, exceptions), so content holds, but the replays break once that branch is deleted and gc'd. Repin to 5965143b4 or record the equivalence and keep a ref (reports/phase-09/late-areas/legacy-drift.json#/head; import2/binding-refresh.json#/sourceHEAD)

## APPROVE
- changelog-union: Unreleased: 13 first-parent-new + 21 main-new lines all present, no extra/dropped lines, base deletions none; all other sections byte-equal to both parents
- registry-check-list: Doc check list (141) set-equal and sorted vs DOCTOR_CHECKS from importing src/setup/registrations.mjs at bc5589ed7 (141 unique); p1 had 143 incl. stale git-transport-config/terminal-config, main lacked documentation-cutover-lease
- registry-fix-list: Doc fix list (32) set-equal vs FIX_REGISTRATIONS at bc5589ed7 (32); terminal-dir removed, identity-machine-key added
- registry-rename-and-retained-section: git-repository-config text taken from main; 'Retained Distribution Source Detail' byte-equal to first parent at merge; its one remaining terminal-dir side effect corrected in 4b62385cb to main's wording; zero git-transport-config/terminal-dir/terminal-config left in docs/platform at 77db6ed2b
- other-merge-hunks: Remaining --cc hunks (component-boundary.md table, git/spec.md section 7/8, registrations.mjs imports) are clean adjacent unions of both sides
- census-regenerated: Independent scan() over bc5589ed7 tracked product files (1107) with an addon descriptor in scratch reproduces committed mutation-census.v1.json byte-for-byte; self-digest ok; 25 sites, identical site identities (excluding line) to first parent
- merge-accounting-completeness: mainCommits set-equal to rev-list bc5589ed7^1..^2 (233); changedPaths equal base..main and p1..merge (348); families sum 348; incomingPlatformPaths equal main's docs/platform changes (7)
- legacy-drift-rerun: scan-legacy-drift.mjs rerun at 77db6ed2b in a scratch clone: 33 files, 3066 units, 0 not-proven-carried, 0 missing; records identical to committed legacy-drift.json; --check exit 0
- legacy-files-in-import: Main changed exactly 4 legacy files (docs/specs distribution, observe, reading-map, runner); docs/architect and docs/decisions untouched
- rul108-replaces-rul101: RUL108 rule, both 2026-10-23 decisions and the RUL101 superseded history line occur verbatim (once) in packaging-distribution/spec.md; RUL101 block exact-digest carried; vendored-yaml-parser.md now a historical pointer
- setup-side-effect-carry: Main's setup scenario text (terminal store creates <stateRoot>/terminal) carried verbatim, unit exact-digest
- observe-carry: PI_SESSION_ID added; only difference from source line is the rebased identity link
- runner-carry: Main's changed runner rule line present verbatim
- reading-map-holder: All three updated Terminal/Git/YAML entries present verbatim once in docs/reading-map.md section 5; transitional note and knowledge routes untouched
- rebind-rows-recompute: All 264 changed/new ledger rows (5965143b4->4b62385cb, 144 shards) recomputed independently: 0 bindingSha256 mismatches under the declared sorted compact UTF-8 JSON+LF 4-key/group recipe; each resolves to exactly one unit with self-inclusive ancestry at 77db6ed2b; 194/194 placement witnesses match neighbours; 11 unhashed rows were unhashed before too
- stale-rows-sweep: Of 1068 rows targeting the 12 import/resync docs, 52 stale (all component-boundary.md) are each superseded with a valid successor; no effective stale row
- phase09-incoming-list: Seven incoming docs/platform paths added exactly, framed as union/deduplicate
- ratchet-exceptions: Only expectedDigest changed on 4 rows, each equals current bytes; previousMainMergeAccounting objectSha256 recomputed (4957bd9e...); ratchet clean at 77db6ed2b
