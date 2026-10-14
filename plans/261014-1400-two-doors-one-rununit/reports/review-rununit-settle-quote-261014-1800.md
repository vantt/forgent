# Review — 73b081cf4 NUL-separated git status / committed diff in settlement

Scope: `src/runner/dispatch/settlement.mjs` (`safeGitStatusFiles`, `safeGitCommittedDiffFiles`, new `isStorePath`), `test/runner/assignment-runresult.test.mjs` tail. Read-only review; focused tests run.

## Verdict

The core fix is correct. On git 2.34.1 I confirmed empirically that `status --porcelain=v1 -z -uall` emits `XY new\0orig\0` for renames, that the `R`/`C` check on both X and Y consumes the source entry, that names come back unquoted with edge spaces kept, and that unmerged (`UU`, `AA`, …), `??` and ` A` (intent-to-add) entries parse through `slice(3)`. Ignored files are not listed (no `--ignored`), and the `.fgos` filter works the same as before. Downstream, `snapshotDirtyBeforeFiles` / `findMutatedDirtyBeforeFiles` (`assignment-runner.mjs:286`, `settlement.mjs:52`) take arrays and `path.join` them. Before this fix, quoted names hashed as "absent" there, so mutation detection could not see them; that now works. Nothing else in the settle path re-parses git output line by line. `operation-choice.mjs:1639` and `detached-run-supervisor.mjs:899` only pass arrays through.

No High findings. The Medium and Low findings below are places where the new parser still differs from `commit-unit-work.mjs`. The commit rewrote this exact code, so it was the natural place to line the two up, and it did not.

## Medium

### M1 — Rename source half is dropped, so an out-of-scope deletion is invisible to `commitUnitWork.outOfScope`
- `settlement.mjs:174` (`i += 1` skips the source path). `settlement.mjs:191` runs `diff --name-only -z` without `--no-renames`, so git's default rename detection reports only the new path for a committed rename (confirmed: `git mv old.md 'tài liệu .md'` and commit, the diff lists only the new name).
- In contrast, `commit-unit-work.mjs:128-131` (`changedPaths`) keeps both halves, and `commit-unit-work.mjs:112,261` use `--no-renames`.
- Failure scenario: the agent runs `git mv src/x.mjs docs/guide/x.md` + `git add -N`, or any intent-to-add rename (` R new\0old`, which is not in the cached diff, so `foreign-staged-index` does not fire). Write scope is `docs/guide/**`.
  - `changedPaths` returns `[docs/guide/x.md, src/x.mjs]`.
  - `partitionPaths` puts `src/x.mjs` in `outOfScope`.
  - `commit-unit-work.mjs:222` keeps it only if `changedFiles` has it, and settlement's `changedFiles` does not.
  - Result: the out-of-scope deletion is silently not reported, and it is also absent from settlement attribution and the `outside-write-scope-correlated` warning.
  - The committed-rename path (agent commits itself) loses the source path from `changedFiles` the same way.
- This is not a regression (the old code also took `split(' -> ')[1]`). But the commit's own doc comment ("A rename or copy names its new path only") states the asymmetry as intended without reconciling it with the consumer.
- Fix: in `safeGitStatusFiles`, push `entries[++i]` (the source) as well, like `changedPaths`. Add `--no-renames` to `safeGitCommittedDiffFiles`. `computeChangedFiles` is a set union, so both halves land in `changedFiles` as `new-dirty-after-run` / `committed-after-run`, which is the truthful answer. Also check that `dirtyBefore`/`dirtyAfter` set-difference still holds. It does: both sides come from the same function, so a pre-existing rename yields both halves in both sets and cancels out.

## Low

### L1 — Untracked nested repo and dirty submodule handling differ from `changedPaths`
- `settlement.mjs:175` keeps `nested/` (trailing slash; confirmed in probe output `"?? nested/"`). `commit-unit-work.mjs:129` strips it to `nested`. As a result, `agentChanged.has('nested')` is false at `commit-unit-work.mjs:222`, and an out-of-scope nested repo is not reported.
- `settlement.mjs:162` lacks `--ignore-submodules=dirty`, which `commit-unit-work.mjs:122` passes. If the agent edits only inside a submodule `vendor/lib` (scope `vendor/**`):
  - settlement `changedFiles = ['vendor/lib']`, but `changedPaths` is empty, so the result is `no-changes`.
  - On the `commitPending` retry path (`run.mjs:520-526`) this becomes `work-missing` ("run the unit again"), which can never succeed.
- Fix: strip the trailing `/` and pass `--ignore-submodules=dirty` in `safeGitStatusFiles`. Better still, see L3.

### L2 — Non-UTF-8 path bytes are decoded lossily
- `settlement.mjs:163,192` use `encoding: 'utf8'`. A Latin-1 name `lat\xe9.md` decodes to `lat�.md` (confirmed).
- Effects: `snapshotDirtyBeforeFiles` records `exists:false`, so mutation detection is blind for that file. Scope matching compares against a name that does not exist on disk.
- `commit-unit-work.mjs` decodes the same way, so the two at least agree, and `git add -- <U+FFFD path>` errors out loudly (`git-error`) rather than doing something wrong. Acceptable for now. Note it in the doc comment: "byte for byte" is only true for UTF-8 names.

### L3 — Three hand-rolled parsers for the same porcelain -z format
- `settlement.mjs:159` (`safeGitStatusFiles`), `commit-unit-work.mjs:119` (`changedPaths`), and `worktree.mjs:408` (`checkoutDirtyPaths`, which also skips the rename source) each parse it, and they already disagree on rename halves, trailing slash and submodules (M1, L1). This is the "parallel reimplementation" smell, and per RUL11 it should be consolidated here.
- Fix: export one `parsePorcelainZ(output, { keepRenameSource, stripDirSlash })`, or reuse `changedPaths` semantics, and have settlement call it.

### L4 — Backslash in a filename is now exact but always out of scope
- `write-scope.mjs:131` rejects any `relPath` containing `\`. A legal Linux name like `a\b.md` now reaches it byte for byte, and it is always classed out of scope. Same result as before (the quoted form also contained `\`), so this is informational only.

### L5 — Test gaps
- The three new tests pass (`node --test --test-name-pattern="byte for byte|Vietnamese"`: 3/3).
- They would fail on the old code: the quoted spelling, the trimmed `' lề .md'`, and the `'.md'` you would get if the rename source were misread as a status line. So they are not phantom tests.
- Not covered:
  - (a) A rename in the Y column (` R`, intent-to-add); only the X-column `R ` is tested.
  - (b) An untracked nested repo or a dirty submodule.
  - (c) The motivating consumer path: a non-ASCII in-scope file through `commitUnitWork` `outOfScope` filtering and the `run.mjs` `work-missing` check. The third test stops at settlement attribution/warnings.
- The comment at test tail line ~1732 says git "pads nothing", which is confusing. The bug was the reader's own `trim()`, not git padding.
- Fix: add a `commitUnitWork` test with `changedFiles` containing a Vietnamese out-of-scope name, asserting it appears in `outOfScope`. When M1 is fixed, add a rename test asserting both halves.

## Unresolved questions
- Is reporting only the new path of a rename a deliberate product choice, for example to keep `changedFiles` aligned with the agent's claim? If so, `commitUnitWork` should map the source back instead. If not, M1's fix applies.

Status: DONE_WITH_CONCERNS
Summary: The NUL-separated parsing is correct, the tests pass, and it fixes quoted and edge-space names end to end. But `safeGitStatusFiles`/`safeGitCommittedDiffFiles` still differ from `commit-unit-work.mjs`'s `changedPaths` on rename source halves, nested-repo trailing slashes and dirty submodules. That lets an out-of-scope rename-deletion go unreported and can produce a `work-missing` retry that never succeeds.
