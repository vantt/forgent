# w4-g4-declare review: G4 declarations (2e57b8bc1) + D3c verifier cleanup (5069820ca), at 77db6ed2b

Verdicts: 12 APPROVE, 2 REWORK. Full rows are in w4-g4-declare-review.json. Every item was checked; none was sampled.

## REWORK
1. **HIGH: siteId binds the spawn site, not the argv/caller set (fail-open).** For argv-passthrough wrappers, a declaration exempts every future caller. Scratch probe on the real files: adding `git(r, ['reset','--hard','HEAD'])` to `scripts/check-evidence-relocation.mjs`, or `run('git', ['push','--force','origin','HEAD'])` inside `verifyForbiddenPhase02Diff` (`scripts/verify-phase-02.mjs:127`), still gives **0 sites**. Before the declarations, both were red. The `.githooks/pre-commit` `leaseGitRead` declaration has the same shape: its `verbs` list is an unchecked claim. It matches today's callers in `src/runner/documentation-cutover-lease-hook.mjs`. This contradicts the owner-review note's "a new call in the same path remains undeclared". Fix: fold the sorted caller-call digests into siteId for passthrough sites, or declare the caller sites themselves, or refuse declarations on unresolved-argv wrappers. Also add a test that adds a write caller through a declared wrapper. The other 17 tooling sites carry literal read verbs in the hashed call text and are not affected.
2. **MEDIUM (route to Lead/Git owner): spec not updated.** `docs/platform/git/spec.md` section 12 lists the named classes and the census contract. It mentions neither `declared-tooling-exemption` nor the declaration input. The spec was outside the Doer's writable list.

## APPROVE highlights
- 25 declarations equal the proposal's 25 (1/10/9/5), each with reason and retireWhen.
- I regenerated the census twice with census(scan()) through Inspect. Both runs are byte-identical, sha256 `5a7af356…`, equal to the committed census, with 0 sites. verifyCensus passes.
- Line shifts keep identity. An edited or removed call fails with "stale or ambiguous". Duplicate or missing declarations fail closed.
- The new class is justified against the existing ones. The hook read set adds only `show-ref` and `diff-tree`. The doctor wiring test passes. The pinned blobs `a52981ff…` and `0f1cd7e1…` are unchanged.
- D3c: setup outputs are recorded before npm runs and reclaimed before the guarded removeWorktree, and the symlink is not followed. The 16/16 tests passed, with no leaked worktree or /tmp dir. Residual risk: phase-01 `npm install` can rewrite package-lock.json, which keeps the worktree with a warning (documented).

## Tests (single files)
declarations 6/6; census wiring 1/1; doc-git-reads 3/3; verify-phase-02 16/16. `test/git/one-door.test.mjs` is 4/6, an environment limit: `git-addon-not-shipped` / `lock-driver-unavailable` in listFiles.

## Environment note
The first scanner invocation built the addon via cargo into the review worktree's pre-existing ignored `target/` (no tracked change). I read only `releasePath` from main `.fgos/installation/activation.json`.
