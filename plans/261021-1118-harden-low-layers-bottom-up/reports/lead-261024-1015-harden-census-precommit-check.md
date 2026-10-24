# HARDEN lead report: census drift check in pre-commit (2026-10-24)

Branch harden/census-precommit-check, commit 8ba869cd0 (pushed, not merged).

## Design
Census records sha256 of every file the scan judges (declared product, kinds js/rust/shell/skill). Drift = staged digest differs from staged census digest. So the hook compares, with no scan and no cargo:
- staged census (`git show :census`) vs staged blob digest of each staged path inside `declaredProduct(root)`;
- added/changed/deleted all covered (absent digest vs present);
- census own digest self-check (`censusDigestMatches`).
Refusal names `node scripts/git-one-door-scan.mjs --write-census` and the census path. Real skip only when no covered path is staged, or repo has no census / copied hook has no scan module.
Placement: after root guard, before the home early-exit, so linked worktrees are checked too. MERGE_HEAD not special-cased (merge staging must match too); data-loss guards untouched and run earlier.

## Reused
`declaredProduct`, `kindOf`, `censusDigestMatches`, `sha256`, `MUTATION_CENSUS_PATH` from scripts/git-one-door-scan.mjs. One new exported function there, `censusDrift` (18 lines). No second scanner, census format unchanged, full check in test/git/one-door.test.mjs untouched.

## Why the scan was slow
The 18 s is the Node scan itself (~6.7 s warm, 7 s user) plus cargo staging the git addon (`ensureGitAddon`/git-ports inspectRepo) on a cold target (21.7 s here). The scoped check needs neither.

## Measured (hook up to and including census step)
- commit touching one covered file (refused, drift): 0.135 s total
- commit touching no covered file (docs md): 0.105 s total (passes census step; later pre-existing steps then refuse on host-missing in this worktree, unrelated)
Target was <= 3 s.

## Limits (documented in spec)
A change to the product declaration itself (package.json files/bin, Cargo workspace members) is not seen by the per-file check; still caught by one-door.test.mjs and the release build. Content-level site/line drift always changes a digest, so it is covered.

## Gates
- test/githooks/census-drift.test.mjs (new, 2 tests: refused until census staged then accepted; no covered path passes), test/githooks/event-layout.test.mjs, test/e2e/root-file-guard-hook.test.mjs, test/git/one-door.test.mjs: all pass (focused).
- `node scripts/git-one-door-scan.mjs --root .`: exactly the 5 unresolved-binary sites.
- Census regenerated in the commit (hook + scan changed; also absorbs line-number shifts): +67/-29 generated lines.

## Net lines (hand-written)
hook +38, scan +18, test +55 (new), CHANGELOG +1, spec +2.
Docs: CHANGELOG [Unreleased], docs/platform/git/spec.md section 12 dated sentence.

## Notes
Tests that copy the hook (main-checkout fixtures) are unaffected: no census there, and copy without scripts/ skips.
Plain cargo used CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/harden-census-target (left in place).

## Follow-up commit (OPC review: merge, three Lows)
- Bytes vs text: the scan hashes `sha256(readFileSync(file,'utf8'))`, a decoded utf8 string, not raw bytes. The hook already decodes the staged blob as utf8, the identical input; switching to a buffer would diverge on invalid sequences. Comment added in the hook saying so.
- Refusal text now ends "(a merge needs a regenerated census, not either side's)".
- Spec sentence added: hook judges with the scanner of the checkout whose hook runs (via core.hooksPath), so a branch changing kindOf/declaredProduct is judged by main's rules until it lands; same trust choice as `../src`.
- Not done, possible later: batch the per-file `git cat-file blob` child into one `cat-file --batch`.
- Census regenerated (hook changed); focused tests census-drift, event-layout, root-file-guard, one-door: 32 pass, 0 fail.
