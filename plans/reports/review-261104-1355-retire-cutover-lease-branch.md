# Review: retire documentation-cutover lease (`doc/retire-cutover-lease` @ c7a354e1d on cbfb9c3ce)

Verdict: **REWORK** (small). The removal is complete and the generated artifacts are consistent. Two Medium items remain. M1 loses a proof whose behaviour still exists, which design principle 8 forbids. M2 is lease-era code left inside `landRunnerItem` (L10/RUL104: delete the old path whole). Both are quick fixes.

## What I checked (read-only)

- Grep of src bin scripts packages apps .githooks test docs core domains .claude/skills .agents plugins for the lease/docs-lease/callerCheckout/admission symbols, `DOCS_LEASE`, `documentation-cutover` and `reference-transaction`. The only hits left are retirement notes, decision history, CHANGELOG, generic `reference-transaction` uses (the Rust driver/publication tests, `git-one-door-scan.mjs` HOOK_NAMES, and the `land-vs-manual-commit.test.mjs:95` fixture, which writes its own hook) and the citation-drift baseline D8 entry, whose source line is kept. Nothing calls these symbols any more.
- Mutation census: a fresh `scan()`+`census()` gives the same bytes as the committed `mutation-census.v1.json`. `verifyCensus` passes (1240 files) and the scan reports 0 undeclared sites. The emptied declarations file is fine.
- `node test/rust-host/generate-vectors.mjs --check` exits 0, so the vectors came from the generator. `node scripts/export-command-selectors.mjs --check` exits 0 (routes match the registry). `check-decision-citation-drift.mjs` reports no new findings.
- Every edited src module resolves its imports (dynamic `import()`). No unused imports were introduced (the flagged ones were already there before this change).
- `.githooks/pre-commit`: the order of every other guard is unchanged (event-path, stale-index, .fgos deletion, worker .fgos, root-file, census, config, convention, then the rest). The `reference-transaction` argv branch only wrapped `main()` in an else, so nothing became unreachable. `fs` and `execFileSync` are still used.
- `case.opened.payload.callerCheckout`: the only readers of the payload are `case-projection` (frame/kind), `case-inherit` (requestDigest/baseCommit) and `case-admission-port` (parent). Old events still read correctly.
- Doctor registry doc list, setup checks test, the lock count of 23 (both test regexes) and the rank-10 note all agree with the registry. No inbound links to the old anchors remain. The new anchor `#documentation-cutover-write-lease-retired` resolves.
- Removed tests: every case in the two deleted files is about the lease. The borrowed-description probe is owned by `test/e2e/main-checkout-borrow-hook.test.mjs`. In the edited files, the non-lease cases are unchanged, apart from the M1 gap.

## Medium

**M1 — runner Land "target chosen under the slot" lost its only proof** (`test/runner/merge-land.test.mjs`, removed race test, formerly line 124)
- The removed test `runner Land refuses a scoped branch when the lease is acquired after admission` also asserted `args.request.target === undefined` ("no resolution bytes require a pre-slot target"). It also checked that the land went onto the target Land chose, not the one pinned earlier.
- That behaviour still exists: `src/runner/merge.mjs:929` has `...(files.length > 0 && { target: pinned })`. `docs/platform/git/spec.md` §7 (line ~361) still names `merge-land.test.mjs` as its owning proof.
- No surviving merge-land test advances the target between the pin and `prepare`. `root verification reuse tolerates…` advances it before the call. Workflow's door keeps its proof (`units-runner.test.mjs:140`); the runner door does not.
- Failure scenario: someone reverts this to always pass `target: pinned`. The suite stays green, and sequential `approve`/`sync-root` lands then go stale or refuse.
- Fix: add a runner twin of `units-runner.test.mjs:140` to merge-land.test.mjs. Mock `GitLand.prototype.prepare`, advance main inside it, assert `args.request.target === undefined`, then assert `outcome === 'merged'` and parents `[selectedTarget, source]`.

**M2 — lease-era scaffolding left in `landRunnerItem`** (`src/runner/merge.mjs:873-874, 884-885, 903, 973, 1007-1009`)
- Compared with `97dd62aa7^1` (the shape before the lease):
  - The lease hoisted `let pinned = resolveRefSha(target)` and `const source = resolveRefSha(branch)` above the no-wait probe and the seal so that `admitLease` could run first. Today `pinned` is a dead store: it is overwritten at line 903 before anything reads it.
  - The comment "After read-only admission, no-wait refuses … before any write" describes an admission that no longer exists. It used to read "before any read".
  - `if (err instanceof MergeError) throw err;` at line 973 existed only for the `admitLease` MergeErrors raised inside the try. Nothing in the try throws MergeError any more, so it is dead.
- Observable change compared with before the lease: an unknown branch or target now throws StoreError before `lock-held` (no-wait) and before the `merge-blocked-other-item` outcome. Previously those answered first.
- Fix: restore the pre-lease order. Use `const pinned`/`const source` after `sealProjectBeforeLand` with the original comment, drop the MergeError rethrow, and collapse the `{ throw err; }` braces.

## Low

- **L1** `src/runner/execution/run.mjs:621-628`. The lease moved roots resolution in front of `sweepAttempts`. The new comment, "only a typed notARepository answer permits read-only work outside Git. Other root failures stop before reclamation or any writes", repeats the reason `admitDocumentationExecution` gave. Before the lease, a roots failure still reclaimed homes and then threw (`rootsFailure`). Restore the old order, or say why the new one is kept on its own merits.
- **L2** `bin/fgos.mjs:2865`. The stale comment "A confined writer must be refused before lease admission needs a lock or an addon" should be reworded. The `cwd: process.cwd()` added to the workflow start/answer/resume params during the lease era is harmless, but only the lease needed it.
- **L3** The commit is typed `refactor(docs)`, but it removes a user-visible verb and a doctor check, and most of the change is code. A better subject would be something like `feat(runner)!: remove the documentation-cutover lease` or `chore(runner): …`. There are no plan ids or AI mentions.
- **L4** CHANGELOG `[Unreleased]` now carries both the lease additions (lines ~73-82) and the removal line. Activated releases did ship `docs-lease`, so keeping both is defensible. This is a note only.

## Positive (risk calibration)

- Only the admission plumbing was removed from `mergeWorkflowBranch` (it now matches the pre-lease shape apart from the `inspect` const), from `retargetMember`/approve/sync-root/promote (`callerCheckout`, `ctx.cwd`), from `prepareWorkflowRun`/`answerWorkflow`/`resume*` (the `admitRecordedWorkflow` calls; the `hold` destructuring was handled correctly in both answer doors), and from `runUnit`.
- `case-verbs.test.mjs`: the renamed integrate test keeps every non-lease assertion.

## Recommended actions

1. M1: add the runner-door slot-target proof to merge-land.test.mjs.
2. M2: restore the pre-lease head and catch of `landRunnerItem`.
3. L1/L2: fix the comments, or restore the sweep order in run.mjs.

## Unresolved questions

- L1: was resolve-before-sweep in run.mjs introduced only for the lease (it arrived in the 97dd62aa7 squash), or did a separate hardening fix need it?

Status: DONE_WITH_CONCERNS
Summary: REWORK. Removal is complete and the generated artifacts verify, but runner Land lost its only slot-target proof (M1) and lease-era reorder/dead code remains in landRunnerItem (M2).
