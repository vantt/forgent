# w2-g4-code review: G4 git-one-door code (898989f21 + 7d9a33a2d) at ae9b9a6ef

Result: 17 APPROVE, 2 REWORK. Full verdicts are in `w2-g4-code-review.json`.

## Verified by recomputation
- The pinned generators are byte-exact. `scripts/generate-doc-inventory.mjs` is a52981ff… and `scripts/generate-shipped-path-inventory.mjs` is 0f1cd7e1…. Both owning test files match f59e0b639.
- No new Git port. The only file changed under `packages/git` is the census JSON. `src/git` is unchanged.
- The census matches the scan. `census(scan())` at ae9b9a6ef is byte-equal to `packages/git/contracts/mutation-census.v1.json`. It lists 26 sites, and the exemption proposal covers all 26 with a reason and a retirement condition. The locators match.
- `check-evidence-relocation` keeps its live-index stage/mode/blob drift check (raw `gitIndex`, declared). `trackedPaths` is index-based, so it is equivalent to `ls-files`. An unborn HEAD still fails closed.
- Check B is true in both manifests (step10-round5 and step10-sync4d). Check A is false; that belongs to G1 and G3, not this gate.
- Tests that ran:
  - doc-git-reads 3/3
  - check-evidence-relocation 41/41
  - check-doc-constitution 65/65
  - verify-phase-02 6/6
  - generate-doc-inventory 96/96
  - generate-shipped-path-inventory 10/10
  - check-doc-retirement 36/36
  - doc-review-format 25/25
  - doc-candidate-conservation 60/60
  - doc-decision-review 14/14
  - one-door 4/6. The 2 failures are git-addon-unavailable, the known environment limit. The edited test passes.

## REWORK
1. **HIGH: the verifier cleanup now always leaks a worktree.** Locators: `scripts/verify-phase-01.mjs:448-455` and `scripts/verify-phase-02.mjs:341-348`.
   - Both verifiers run `npm install`/`npm ci` inside the temp worktree.
   - The worktree is created by `createDetached`, not by `provisionWorktree`, so nothing records the ignored `node_modules` as regenerable.
   - `Worktree.remove` therefore refuses with `worktree-ignored-bytes-preserved` (`packages/git/rust/src/worktree.rs:339`, contract in `CHANGELOG.md:146`).
   - Result: every run leaves a registered linked worktree plus a full `node_modules` in tmpdir.
   - The CHANGELOG and exemption text describe this as an occasional retention.
   - Fix: remove the dependency bytes the verifier installed itself, or record them through the existing provisioning record, before calling `removeWorktree`.
2. **MEDIUM: an avoidable census site.** Locator: `scripts/lib/doc-git-reads.mjs:76`.
   - The raw `cat-file --batch` branch only runs when a caller raises `maxSize` above 31 MiB.
   - No production caller does; only the test does.
   - Fix: drop the branch. The pinned generator keeps its own raw reader. Then remove the exemption row.

## Note (APPROVE)
The verifiers now take changed paths from Inspect `diff`, which runs without rename detection. A rename therefore lists both the old and the new path. That is stricter than before, but the forbidden-path result and `changedPathCount` can differ from historical receipts when the range contains a rename.

## Not run
- The verify-phase-01/02 runs end to end, because they need `git worktree add` in this repository.
- A scratch probe of `removeWorktree`, which was refused with `git-fence-missing`. The REWORK 1 finding therefore rests on the source code and the documented port contract.
