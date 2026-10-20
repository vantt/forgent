# Git phase 07, unit 17: outer scripts, skills, fixture repositories

Worktree `git/p07-scripts` (from `7d931a0a2`). Nothing was staged or committed. Skills and fixtures ran as two sub-lanes with disjoint files; the scripts were done by the lead. Census regenerated: [scout-261020-1702-git-p07-u17-census.md](scout-261020-1702-git-p07-u17-census.md) (5383 candidates, digest `415d5df4…72aa`).

## 1. Outer scripts

There are two doors, both new, small and in `scripts/lib/`:

- **`git-ports.mjs`**: every outer script reaches its own repository through this file, which provides Inspect and ScopedCommit.
  - Under a host, the payload's addon loads.
  - Run as plain `node scripts/x.mjs` from a source checkout, the script has no payload. `ensureScriptAddon` then stages the checkout's addon with the test launcher's fast path (`test/helpers/git-addon.mjs`).
  - Smoke test: `verify-fanout-overlap.mjs` run with plain node from this linked worktree resolved the main checkout and passed.
- **`sandbox-git.mjs`**: the named sandbox-setup class from spec §13. `sandboxGit(root)` refuses a call in three cases:
  - the call names no repository (`-C`, `--git-dir`, `cwd` or an absolute `init` path);
  - any repository or absolute path argument lies outside `root`;
  - otherwise it runs the call, but first drops the repository-redirecting `GIT_*` variables. Identity variables stay.

  `gitVersion()` provides the benchmark environment record.

Per script:

| Script | Change |
|---|---|
| `probe-storytelling-material`, `measure-verify-cost`, `verify-fanout-overlap` | Their three copies of `rev-parse --git-common-dir` are gone. They use `mainCheckoutRoot()` (Inspect `trustedMainRoot`). |
| `test-timing` | `isGitClean` reads Inspect `status` (`untracked: 'normal'`). A probe confirmed it has porcelain v1's shape: a symlink is bare `target`, a real directory is `sub/`. `gitHead` uses `resolveCommit`. |
| `prepare-release` | The clean check reads Inspect `status`. The printed `git add/commit/tag/push` release steps are text for a human operator, not a spawn. |
| `measure-coordination-baseline` | Dirty fingerprint = status entries plus a digest of each dirty file's bytes, instead of the `status -z` + `diff -p` text. It is a report identifier only; no consumer compares the old value. HEAD comes from `resolveCommit`. |
| `event-store/v-spawn-bench` | The fixture repo goes through `sandboxGit`. The checkout's HEAD and `a4b1278ae` ancestry come from Inspect (`resolveCommit`, `ancestry`). |
| `git/e3-bench` (31 sites) | Every fixture call goes through one `git` bound to the mode's fresh root with `bindSandbox` (run, rollback, census child, scoped-census worker). The census child now gets `--root`. The baseline file comes from Inspect `pathsAtRevision` on the bench's own loaded addon, to avoid a second addon load. `checkoutHead` comes from `resolveCommit`. The raw-spawn baseline rows now include the guard's cost (realpath checks, microseconds against a millisecond spawn). |
| `regenerate-observe-fixtures`, `knowledge-canary` | Their sandbox setup goes through `sandboxGit`. The canary also refuses to run on its own checkout. |
| `knowledge-migration` | **ScopedCommit with both literal paths** (spec §3 line 116). Per move, in order: `preflight`, frontmatter write, rename, `commit({writes:[old,new]})`. On any failure the path and the original content are restored before any registry event. One commit per move, subject `docs(knowledge): move <old> to <new>`. |
| `test-select-mutate` | Uses the runner's own detached-checkout door (`createVerifyCheckout` + guarded `removeWorktree`) through an injectable `checkouts` pair. The mutated file is restored after classification, and its symlinks are unlinked before removal. A checkout that still holds run bytes is **preserved and reported, never forced** (`remove -f` is gone). |
| `ci-external-consumer.sh/.ps1` | Classified as named sandbox (external-consumer CI) with a comment at the init site. |

Git-shaped spawn lines, HEAD vs now:
- Moved to ports (now 0): `knowledge-migration` 2→0, `test-select-mutate` 4→0, `test-timing` 2→0, `measure-coordination-baseline` 3→0, the three common-dir readers 1→0 each, `prepare-release` 1→0.
- Now through the sandbox door: `e3-bench`, `v-spawn-bench` (1 fixture line), `knowledge-canary`, `regenerate-observe-fixtures`.

## 2. Skills (sub-lane)

Sources were edited, then `npm run build:skills` was run. `plugins/fgOS/skills/{deliver,pick,…}` launchers are hand-written sources; `skill-wrappers.test.mjs:675-677` asserts they are not generated.

- **`_shared/private-cell-worktree.md`**
  - Open: `fgos worktree create "$wt" --branch "$branch" --base "$base"`.
  - Close: `fgos worktree remove "$wt" --delivered-to "$base"`.
  - The `--force` advice is replaced by "read the refusal, fix the cause, rerun".
- **`fgos-run/SKILL.md`**: no "pure git" integration. The runner commits the declared writes and merges nothing.
- **`catchup-self-recovery.md`**: describes a "trial merge" (a signal, not an instruction).
- **`deliver`/`pick`**: "Never run a raw `git reset --hard`" now has no status-check loophole and points at `fgos main-checkout-reset`.
- **`distill`**: spawns are classed as "skill-owned reference clone". **Judgment call:** `pull --ff-only` now runs only for clones under `<root>/upstreams/`. Before this, a `local:` source pointing at the user's own repository was pulled.
- **`instruction-audit.mjs`**: `check-ignore` stays as a read, commented "shipped skill script has no Inspect door".
- **Closed with no change:** read-only or prohibition text in coding-worker-contract, executor-dispatch-fallback, architecture-panel, lock-fence, instruction-audit docs, approve, cleanup-*, discover*, plan*, retro-next, merge-loop, return, and the domains/coding references.

## 3. Fixture repositories (sub-lane, plus one lead fix)

These now carry the fence through `test/helpers/git-fixture.mjs`, with `.fgos/locks/` ignored wherever the tree is later staged with `git add -A`:
- `runner-loop`, `synthetic-domain`, `fixture-marketing-domain`, `compound-learn-lifecycle`, `self-improve-loop`;
- `main-checkout-hook-repo.mjs`, which builds the repos for borrow-hook, lock-hook and activity-beacon;
- `main-checkout-lock-hook-worktree-commit`, `fgos-stage`, `invocation-fault-log`, `dispatch-retired-doors`;
- the three `fgos-return` repos. `fgos-stage-3` was already on the helper.

**Lead fix:** the hook builder keeps its own seed, so `commit.gpgsign false` is still set before the seed commit (it would sign on a machine with global signing). It calls `activateGitFixture` after the seed.

In `runner-loop`, `git-fence-missing` went from 12 occurrences to 0.

`test/scripts/knowledge-migration`, `test-timing` and `prepare-release` fixtures use `initFixtureRepo`.

## Changed assertions

| File | Old | New | Why |
|---|---|---|---|
| test/scripts/knowledge-migration.test.mjs (locked index) | title "…(both "git mv" and the fallback "git add" fail)…"; `/git add.*failed to stage it/` | title "a locked git index makes the scoped commit of the move fail…"; `/the scoped commit failed to record it/` | Spec §3 l.116: the move is one ScopedCommit, and no `git add` exists any more. Every rollback, registry and rerun assertion is unchanged and passes. |
| test/scripts/test-timing.test.mjs (9 `isGitClean` cases) | `isGitClean(cwd, () => '<porcelain text>')` | `isGitClean(cwd, status('<same porcelain text>'))`, an adapter to status entries | The input now comes from Inspect status. The same 9 inputs give the same 9 expected booleans. |
| test/scripts/test-timing.test.mjs (gatherEnvironment) | `exec: () => 'deadbeef\n'` | `resolveHead: () => 'deadbeef'` | Injected collaborator renamed; `env.sha === 'deadbeef'` unchanged. |
| test/scripts/test-select-mutate.test.mjs | fake `execFileFn` answering `git worktree add`; integration with raw `worktree add`/`remove -f` | fake `checkouts.create(label)`; integration through `headCheckouts` | Same ledger, baseline-once and run-count assertions. |

**Added:** real-repo `readStatus` shape (test-timing); dirty-tree refusal (prepare-release); the move commit is exactly `D old / A new` with a clean tree (knowledge-migration); the mutant file is restored and the checkout removed (mutate integration).

## Verification

Wrapper: `node <scratchpad>/run-node-tests.mjs <files>`. It sets umask 077 and `FGOS_STATE_ROOT`/`FGOS_TEST_FIXTURE_ROOT` under `/tmp/fgos-work/u17` with mode 700 (forced: the inherited `~/.local/state/fgos` is read-only here), then calls `ensureGitAddon`.

- **Scripts batch:** architecture, test-timing, prepare-release, knowledge-migration, test-select-mutate, probe-storytelling-material, skills/knowledge-canary, event-store/v-spawn-bench, git/e3-census, git/scoped-commit (its e3-bench scoped-census test passes: TAP ok 1).
  - One failure, environmental: the mutate integration test. `/home/vantt/projects/forgent/.git` and `.fgos/locks` are read-only in this sandbox, so the old raw `git worktree add` would fail here too.
  - Also green: `runner/assignment-enumerator-guard`, the three hook e2e files after the builder fix.
- **Skills:** `npm run build:skills` ("19 plugin dev-skill(s) mirrored"). docs/run-doors-doctrine, setup/skill-wrappers (127/127), test/skills/*, distribution/source-payload: 164 tests, 0 failures.
- **Fixtures**, baseline vs after:
  - Identical: dispatch-retired-doors 12/12, invocation-fault-log 9/9, compound-learn 2/2, marketing 6/6, borrow-hook 9/9, lock-hook 5/5, lock-hook-worktree-commit 17/17, activity-beacon 5/5, fgos-stage-3 9/9, fgos-return 58/58.
  - fgos-stage 8/1: bwrap refused, same before.
  - self-improve 0/1, synthetic 3/1 and runner-loop 8/14 now stop at `nested-write-from-confined-worker` instead of the fence. This session is a confined worker.
- `git diff --check`: clean. No Rust changed. No full `npm test`, no E3.
- **Needs the outer host** (no bwrap, not a confined worker, writable main `.git`): the mutate integration test, runner-loop, synthetic-domain, self-improve-loop, fgos-stage's plan test. Also a real `node scripts/test-select-mutate.mjs` nightly run, to see how often removal preserves a checkout.

## Census rows (my families)

**Closed**
- **Scripts on ports:**
  - probe-storytelling-material, measure-verify-cost, verify-fanout-overlap, test-timing, prepare-release, measure-coordination-baseline (Inspect);
  - knowledge-migration (ScopedCommit);
  - test-select-mutate (Worktree via the verify-checkout door).
- **Named sandbox:**
  - git/e3-bench, event-store/v-spawn-bench, regenerate-observe-fixtures, knowledge-canary, ci-external-consumer.sh/.ps1;
  - `scripts/lib/sandbox-git.mjs`, which is the door itself.
- **Not Git (regex `.exec`, ps, tar, gh, cargo, node):** check-decision-citation-drift, check-locked-decisions-heading-drift, next-doc-id, herdr-cockpit-notify, measure-p08-performance, package-release-assets, stress-test-files, test-select-compare, test-select-coverage-map, lib/test-file-watchdog, run-rust-dev-host.
- **Skills:** the rows listed in §2, sources and renders.
- **Fixtures:** every file in §3.

**Open (no Inspect operation)**
- `test-select.mjs` 80–95: rename-detecting committed/staged/unstaged diffs. Moving it would lose `renamedFrom`/`renamedTo` (asserted).
- `test-proof-inventory.mjs` 290: `diff --unified=0 <ref> -- <paths>`, worktree against a commit.
- `test-select-promote-report.mjs` 113: `remote get-url origin`. Inspect `remoteTracking` returns a URL only when there is no upstream.
- `fgos-shell-integration.sh` 60, 132: a shell function in the user's shell, read-only common-dir lookup, no door from shell.
- `lib/test-git-config-guard.mjs`: a read inside every test process's child_process wrapper. Moving it to Inspect would load the addon in every test process (second-load risk against e3's own descriptor). This is a gate decision.
- **Skills:**
  - private-cell-worktree Close `git merge --no-ff` / `git branch -d`: no fgOS verb lands or deletes a non-item branch.
  - The `git add/commit` lines in domains/coding knowledge and implement references: no in-session commit verb.
- **Not mine:** build-rust-distribution, run-tests (gate).

## needsWrites

1. `domains/coding/skills/_shared/coding-cell-policy.md:88`: `-> git worktree remove <worktree-path>` → `-> fgos worktree remove <worktree-path> --delivered-to <target-branch>`, then `npm run build:skills`. This is the last `git worktree add/remove` instruction left in skill text.
2. `packages/git` Inspect (coordinator):
   - `diff({before, after?, index?, worktree?, renames: true})` with entries `{change, path, oldPath}`, for test-select;
   - `diffText({before, worktree: true, paths})`, for test-proof-inventory;
   - `remoteUrl({remote})`, for promote-report.
3. `CHANGELOG.md` [Unreleased]:
   - "knowledge-migration commits each document move as its own commit instead of leaving staged renames";
   - "the nightly mutation run no longer force-removes its checkouts; one that still holds run bytes is kept and reported";
   - "distill pulls only reference clones under its own `upstreams/` directory".

## Side finding

`private-cell-worktree.md` teaches `fgos coordination run --cwd …`. `coordination` is not a verb in `bin/fgos.mjs`. Separate item.

Status: DONE_WITH_CONCERNS
Summary: Outer scripts reach Git only through two named doors (`scripts/lib/git-ports.mjs` for Inspect/ScopedCommit, `scripts/lib/sandbox-git.mjs` for script-owned sandbox repos). knowledge-migration commits moves through ScopedCommit and test-select-mutate uses the guarded Worktree door. Skill text points to `fgos worktree create/remove`. Every listed fixture repo carries the activation fence through the shared helper.
Concerns/Blockers: Five reads stay raw until Inspect gains rename-aware diffs, a worktree patch and a remote-URL read. One skill source (domains/coding) and the CHANGELOG lines are needsWrites. The lifecycle e2e files and the mutate integration test need the outer host.
