# w5-g4 wrapper review: declarations (2e57b8bc1) + wrapper-caller binding (db4b7de4d), at 1975d4403

Verdicts: 6 APPROVE, 1 REWORK. Full rows are in w5-g4-wrapper-review.json. I checked all 25 declarations.

## REWORK

1. **HIGH: escaping callers still inherit a pass-through declaration.** `declaredSiteId` (`scripts/git-one-door-scan.mjs`, about line 2484) uses only `valueFlowCalls(...).calls` and drops `.escapes`. The general scanner treats these same escapes as red. In the control fixture, an undeclared binary-param wrapper called through `.call` or stored in an array becomes an `unresolved-binary` site. A declared wrapper hides them instead. I tested this on a `git archive HEAD` copy at /tmp/fgos-work/w5-g4-review/tree, which scans clean at baseline:
   - `.githooks/pre-commit` `leaseGitRead`: I added `git.call(null, ['update-ref','refs/heads/main','HEAD'])` in `guardCommit` (`src/runner/documentation-cutover-lease-hook.mjs`). Result: **0 sites**, and the hook verb check still passes. This is a write in the shipped hook path.
   - `scripts/verify-phase-02.mjs` `run`: I added `run.call(null,'git',['push','--force',...])` and `Reflect.apply(run, null, ['git',['push','--force',...]])`. Result: **0 sites** for both.
   - `scripts/check-evidence-relocation.mjs` `git`: I added `git.call(...)`, `Reflect.apply(git, ...)` and `const tbl=[git]; tbl[0](r,['reset','--hard','HEAD'])`. Result: **0 sites** for all three.

   A patched copy of the scanner prints the escapes it detects but drops: `called through .call/.apply`, `passed to an unresolved callee`, `stored in an array`. So the code comment "a new caller cannot inherit an exemption" and the matching sentence in `docs/platform/git/spec.md` are false for these shapes.

   **Fix:** in `declaredSiteId`, compute `const flow = owner ? valueFlowCalls(ctx, file, owner) : { calls: [], escapes: [] }`, use `flow.calls` for the callers, and return `escapes: flow.escapes`. In `applyDeclarations`, refuse with `invalid(\`wrapper escapes for ${entry.path}: ${escapes[0]}\`)` when `escapes.length` is non-zero and `entry.class !== 'configured-binary'`. Configured-binary sites can stay as they are: their binary comes from parsed config, not from the caller. That is why `src/runner/merge.mjs:992`, which has one escape at line 919 today, keeps matching. At HEAD no tooling or hook declaration has an escape, so nothing has to be re-declared. Add `.call`, `Reflect.apply` and array-stored callers to the `WRAPPERS` loop in `test/scripts/git-one-door-declarations.test.mjs`, and amend the spec sentence to say that escaping callers refuse the declaration.

## APPROVE highlights

- **Ordinary callers are bound (check 1).** The scan throws `stale or ambiguous Git declaration` for each of these new callers on the real files: a direct same-file caller, a local alias (`const g2 = git`), a higher-order pass (`hop(git, r)`), `git.bind(...)`, a cross-file named import, a namespace import, a hook caller with a write verb, and a `run('git', ['push','--force'])` added in `verifyForbiddenPhase02Diff`.
- **0 undeclared at HEAD, and reproducible (check 2).** In W, `node scripts/git-one-door-scan.mjs --json` exited 0 with 0 sites. Two runs were byte-identical (sha256 `27688108...`). Class counts: 19 declared-tooling-exemption, 23 hook-read-context, 92 configured-binary. The in-memory `census(scan())` matched the committed census byte for byte on two runs (sha256 `aa5f73d0...`), and `verifyCensus` passes (1127 files).
- **censusDrift (check 3).** The change adds one clause for one exact path (`|| name === GIT_DECLARATIONS_PATH`). Every other file is still judged by `kindOf`, so an edited source cannot pass. The census records the declarations file under `f115aa3b...`, which equals the sha256 of the file at HEAD. The test passes 3/3 in W with the release `FGOS_HOST_BIN`. In the /tmp copy with the clause removed, the new test fails ("census does not match the staged files (scripts/lib/git-one-door-declarations.v1.json)") and the other two still pass. With the clause restored, it passes 3/3.
- **The 25 declarations (check 4)** split into 1 hook, 5 configured-binary and 19 tooling. db4b7de4d changed only 9 siteIds; every reason and `retireWhen` is the same text the w4 review approved.
  - 17 sites have a literal verb and are bound by their exact call text.
  - 8 sites have non-literal argv and are bound by their caller multiset. That is narrower than before. `generate-doc-inventory.mjs:166` is over-bound only because of its pathspec spread, which is harmless.
  - The hook's 9 claimed verbs equal the observed caller verbs.
- **Style (check 5)** matches the file: the same `budget` reset idiom and the same comment style. No plan ids appear in code comments or test titles. The prior MEDIUM (the spec did not name the declaration input) is closed by the spec paragraph db4b7de4d added.

## Informational, outside this diff

- **Scanner false negative, present before these commits:** `export { runner as r2 }` on a binary-param wrapper, plus a caller in another file that runs `r2('git', ['reset','--hard'])`, gives **0 sites** even with no declarations at all (fixture at /tmp/fgos-work/w5-g4-review/ctl). Named and namespace imports are resolved; only aliased exports are lost. File this as a separate scanner item.
- The `verify-phase-02.mjs:127` reason still says "a callback the scanner cannot resolve". The site's family record agrees, but the declaration identity now does resolve 1 caller. The wording is slightly stale and does not need to change now.
- Declaration reasons and the spec cite owner record ids such as `L13-6` and `phase-06`. These are in data and docs, not code, and were accepted before.

## Environment

The /tmp copy built its own addon via cargo under /tmp/fgos-work/w5-g4-review/tree/target. Nothing in W was written except these two report files, and `git status` in W was clean before I wrote them.
