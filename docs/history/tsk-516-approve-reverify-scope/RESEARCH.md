# RESEARCH — tsk-516 (mở rộng phạm vi re-verify của `fgos approve`)

Accumulating record. Each round appends its own dated section; never
overwrite an earlier round.

## Round 1 — 2026-08-11 (stage `discovery`)

### Asked

Are the item's own claims true as written, from repo evidence:

1. `runGoalCheck` re-runs only `item.verify`, never the full suite.
2. `fgos approve` / the merge path re-verifies with that same narrow command.
3. The tsk-1m0 evidence chain (70a88ff / 2564c8f landed red on main,
   fixed later by a separate commit 2e15dc3).
4. Does anything in the repo already widen this gate?

### Checked (repo-first; every claim below has a real path)

- `src/runner/goal-check.mjs:33-36` — `runGoalCheck(item, cwd, timeoutMs)`
  spawns literally `item.verify` (`spawn(item.verify, {shell:true, cwd})`)
  and judges by exit status alone. The file's own header states the
  contract: "run the item's own `verify` — the literal command string".
  **Claim 1 confirmed.** No branch anywhere in this file consults a
  project-level suite command.
- Call sites of `runGoalCheck` (`rg -n "runGoalCheck" src bin test`):
  - `src/runner/merge.mjs:877` — the already-merged (ancestor) path.
  - `src/runner/merge.mjs:938` — the **post-merge** verify, run in
    `repoRoot` after `git merge --no-commit`; `!check.passed` →
    `{outcome:'verify-fail'}` + `git merge --abort`.
  - `bin/fgos.mjs:2447` — `return` on the branch source, inside a
    disposable detached worktree.
  - `bin/fgos.mjs:2517` — `return` on the main-source path.
  - `src/runner/loop.mjs:394,784` — the runner's own dispatch paths.
  Every one passes the same `item` and therefore the same `item.verify`.
  **Claim 2 confirmed:** approve's merge-time re-verify is the same narrow
  command the item already ran; nothing broadens it at the merge boundary.
- Evidence chain (`git log`/`git show` in this checkout):
  - `70a88ffd feat(tsk-1m0): add enduser-docs-index-stale doctor check + fix`
  - `2564c8fb Merge branch 'fgw/tsk-1m0'`
  - `2e15dc30 fix(architecture-manifest): register src/report/enduser-index-generate.mjs`
    — its own message says: *"Missing from the manifest since tsk-1m0
    landed the file, breaking the manifest-completeness and
    import-direction tests on main."* Diff is one line in
    `docs/architecture-manifest.json`.
  **Claim 3 confirmed**, including the "separate later commit, not
  tsk-1m0's own work" part — 2e15dc30 is a distinct commit authored after
  the merge, and `git log 70a88ffd..2e15dc30` shows unrelated items
  (tsk-psb, tsk-5lr, tsk-49u) landing in between, i.e. main sat red across
  several other merges.
- Existing widening mechanisms — searched `rg -n "npm test|npm run test"
  src bin`: only doc/example strings in `src/cli/command-registry.mjs`
  (:101,:102,:155,:295) where `"npm test"` appears as a sample `--verify`
  value. No code path runs a project-level suite. `.fgos/config.json`
  carries only `timeoutMs: 900000` on the verify side — no scope key.
  `.githooks/pre-commit` does not run tests either.
  **Claim 4: nothing already widens it.** The gap is real, not
  already-covered.

### Also found (relevant, not asked)

- Widening to the full suite inherits an existing flake surface:
  `docs/journals/260728-2245-lifecycle-sync-gates-three-latent-bugs.md:72`
  records tsk-3ld — tests that "pass in isolation, flake intermittently in
  full suite". A whole-suite merge gate would convert those flakes into
  merge blocks. Finding only; the scope call belongs to `fgos-coding-planning`.
- `docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md:13,60`
  already tells a person to "rule out an unrelated failure elsewhere in
  the full suite first" — i.e. the narrow/broad divergence is already
  known operationally and worked around by hand today.
- The merge path's failure handling is already built for a red gate
  (`merge.mjs:938-947` aborts the merge and returns `verify-fail`), so a
  broader check has a defined failure route; it is not a new mechanism.

### Verdict

**clear** — the goal (widen approve's re-verify beyond `item.verify` so
regressions outside a narrow verify cannot land on main) is fully
determinable from the evidence above, and every factual premise in the
item's description checks out against real paths and real commits.

Proposed verify: `node --test test/runner/goal-check.test.mjs` (already
set on the item at clarify). Noted for the next stage: the behavior being
changed may land in `src/runner/merge.mjs` rather than
`src/runner/goal-check.mjs`, in which case the verify command should move
with it — a planning-stage decision, not settled here.

### Still open (for the next stage, not blocking)

- What "broader" means concretely — full `npm test`, or a targeted
  always-on subset (e.g. `test/architecture.test.mjs`) — and whether it
  runs at `return`, at `approve`, or both. Product/scope call:
  `fgos-coding-planning`.
- How the flake risk above is absorbed. Same owner.
