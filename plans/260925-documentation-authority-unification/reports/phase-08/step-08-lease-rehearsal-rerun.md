# Step 08: documentation-cutover lease rehearsal, rerun through `npm run fgos:dev`

Date: 2026-10-23. Source: the plan worktree `forgentX-phase00-documentation-authority-unification` at HEAD `44ca64559`, cloned with `--no-hardlinks` into the disposable `/tmp/fgos-work/lease-rehearsal2/repo`. All fgOS verbs ran from the clone's working tree through `npm run fgos:dev`, which builds the clone's Rust host and runs the clone's `bin/fgos.mjs` payload. Nothing ran against the plan worktree or the real repo. The scratch tree was deleted afterwards; only this report is left.

## Verdict

- **Every lease behaviour asked for passed except one.**
  - Status, doctor, acquire, both refused commit paths, the refused `fgos run`, the refused non-holder and foreign Land, both allowed commits, the race, release with its drift report, abandon and re-acquire, and the rollback proof all behaved as intended.
  - The holder token appears in no output.
- **Concern 1: the holder's Land of a scoped change did not publish on the real clone.**
  - The Land door admitted the holder. It then failed because it could not create its candidate worktree within the Git driver's 120 s deadline (`borrow-deadline: killed-after-grace`).
  - The plan-branch tree is 4.43 GB tracked (4.28 GB under `plans/`). A plain `git worktree add` of it took 2 min 22 s on this machine.
  - The same behaviour passes in its owning test on a small fixture (`test/runner/merge-land.test.mjs`).
  - **A Land into a checkout of this size will hit the same deadline on this machine**, lease or no lease.
- **Concern 2: every non-JSON `docs-lease` sub-verb exits 1 after printing its message.** See defect D1 below. A human-mode `acquire`, `release` or `abandon` would commit and still report failure.

## Environment notes

- **Dev door wrapper.** Each fgOS call ran as `cd <cwd>; env -u FGOS_STATE_ROOT -u XDG_STATE_HOME -u CLAUDE_CODE_SESSION_ID -u FGOS_SESSION_ID -u FGOS_DOCS_LEASE_TOKEN FGOS_STATE_HOME=$B/state/fgos PATH=$HOME/.cargo/bin:$PATH CARGO_TARGET_DIR=$B/repo/target npm --prefix $B/repo run --silent fgos:dev -- <verb…>`, where `$B=/tmp/fgos-work/lease-rehearsal2`.
  - `INIT_CWD` keeps the caller's cwd, which is holder, other, repo or foreign depending on the step.
  - The first debug build took 5 min 31 s.
- **Clone setup.**
  - `git checkout -B main 44ca64559`, then the origin remote and the plan branch were removed.
  - `core.hooksPath .githooks` was set.
  - Linked worktrees `$B/holder` (branch holder-wt) and `$B/other` (branch other-wt) were added, and `$B/foreign` was created with `git init`.
  - `node_modules` was copied with `cp -al` from the plan worktree.
- **Onboarding was required.** Without it, the first `acquire` refused with `git-fence-missing` because the controller activation fence did not exist. These are the exact commands I ran:
  1. `cargo build --locked --release --workspace` in the clone, which took 52 s.
  2. `node scripts/build-rust-distribution.mjs --out $B/release`, which gave artifact `sha256:9c5495de…b138`.
  3. `fgctl init --from $B/release` with `HOME=$B/home` and `FGOS_STATE_HOME=$B/state/fgos`. It was refused twice before it ran:
     - `untrusted-driver-directory`: the state directory must be mode 0700. I recreated `$B/state/fgos` as 0700.
     - `pin-mismatch`: the committed `.fgos/distribution.json` pins `sha256:df7a1a04…2759`, a release this tree cannot rebuild. I changed the pin in the scratch working tree to the staged digest, ran init with `env -C $B/repo` (from the shell's own cwd it had refused with `git-predecessor-writer-live`, naming my own shell), and then restored the file with `git checkout -- .fgos/distribution.json`.
  4. Result: `.fgos/locks/activation.lock/TOMBSTONE` was placed and init exited 0.
  5. Side effect: init rewrote the tracked `.fgos/coexistence.json`. It stayed modified, uncommitted, in the scratch main checkout.
- **State root.**
  - Every call from onboarding onward used `FGOS_STATE_HOME=$B/state/fgos`.
  - Before that, the first `status` and `doctor` calls and the failed `acquire` ran with the default machine state root `~/.local/state/fgos`. That is machine state, not a `.fgos/` directory. I removed nothing there.
- **Pre-commit hook needs a host binary.**
  - A plain `git commit` in a linked worktree refuses with `cannot resolve the writer identity (host-missing)`.
  - Allowed commits therefore ran with `FGOS_HOST_BIN=<clone>/.fgos/runtime/git-addon/<id>/fgos`, the persistent working-tree host the dev door stages, plus the same `FGOS_STATE_HOME`.
  - The refused docs commit was run both ways (steps 5 and 5b). The lease refusal fires first either way.
- **Land door.**
  - No CLI Land path works without work items: `approve` and `sync-root` both need store items.
  - So the Land steps used the **module door**: `landRunnerItem(repo, {id, verify:'true'}, {branch, callerCheckout, lockWaitMs:0})` from `src/runner/merge.mjs`, which is the function `approve` and `sync-root` call.
  - It ran with `FGOS_HOST_BIN`, `FGOS_ACTIVE_RELEASE_PATH` and `FGOS_ACTIVE_MANIFEST_PATH` pointing at the dev-staged host and manifest, the same values the dev door exports.
  - Scoped and out-of-scope test branches were built with `commit-tree`, so no hook was involved in creating them.
- **Race.**
  - Nothing outside the code can drive the admission-to-publish timing.
  - So I ran the owning test file on its own: `node --test test/runner/merge-land.test.mjs`, with `FGOS_HOST_BIN` set to the binary `fgos:dev` built (staged copy), `FGOS_STATE_HOME` and `TMPDIR` inside `$B`.

## Steps

| # | Step | Command (cwd) | Expected | Actual | Result |
|---|------|---------------|----------|--------|--------|
| 1 | Status, lease free | `docs-lease status --json` (repo) | free | `{"state":"free","held":false,"sidecar":null}`, exit 0. Human mode printed `documentation-cutover lease is free`, then exit 1 (D1). | PASS (D1 noted) |
| 2 | Doctor row, free | `doctor` (repo), row `documentation-cutover-lease` | passed; hook wired | `passed:true`, "no documentation-cutover lease is held; reference-transaction hook wired" | PASS |
| 3 | Acquire | `docs-lease acquire --worktree $B/holder --json` (repo) | acquired; one sidecar commit on main; token only in the holder's ignored `.fgos/` | `result:"acquired"`, tokenHash `e985fcd3…52e5`, baseCommit 44ca64559, scopeDigests for the 7 roots. Main gained `114f2394a chore(docs): acquired documentation cutover lease`, which touches only `plans/documentation-cutover-lease.json`. The token file is ignored by `.gitignore:42 .fgos/*.token`. | PASS |
| 4 | Status and doctor, held | `docs-lease status --json` (other); `doctor` (repo) | held; doctor flags the hold | `state:"held", held:true, worktree:$B/holder, kernelLock:"free"` (the kernel lock serializes transitions only). Doctor: `passed:false`, "documentation-cutover lease is actively held (age: 59s); frozen scope: docs/**, AGENTS.md, CLAUDE.md, …switchboard.json, core/skills/**, .agents/skills/**, plugins/fgOS/skills/**, plans/documentation-cutover-lease.json" | PASS |
| 5 | Refused: non-holder commit touching `docs/` | `git commit -m "docs: non-holder edit"` (other; staged `docs/README.md`) | refused by pre-commit | "commit refused: the documentation-cutover write lease is held; non-holder commits to scoped paths are refused", exit 1, HEAD unchanged | PASS |
| 5b | Same, with host env | `FGOS_HOST_BIN=… git commit` (other; `docs/rehearsal-nonholder2.md`) | refused | Same message, exit 1 | PASS |
| 6a | `--no-verify` commit on the other branch | `git commit --no-verify` (other) | allowed on a non-main ref | `[other-wt 2c6d2c01a] docs: bypass attempt`, exit 0. Only main is guarded. | PASS (as designed) |
| 6b | Refused: `update-ref` main to the bypass commit | `git update-ref refs/heads/main 2c6d2c01a 114f2394a` (other) | refused by reference-transaction | "reference-transaction refused: reference update touches documentation scope or an unauthorized lease transition; failing closed / fatal: in 'prepared' phase, update aborted", exit 128; main still 114f2394a | PASS |
| 6c | Refused: fast-forward `update-ref` with a docs-only child of main | `git update-ref refs/heads/main ede08210c 114f2394a` (other; diff = `docs/README.md` only) | refused | Same refusal, exit 128; main unchanged | PASS |
| 7 | Refused: non-holder `fgos run`, read-only unit | `run "List the files in the docs directory and summarize them." --json` (other) | dispatch refusal before side effects | `fgos: documentation cutover lease is held; non-holder operations are refused`, exit 4. No new `.fgos/assignments/*`. One side effect, see note N1. | PASS (N1) |
| 8 | Refused: non-holder Land of a scoped branch | module door, branch `scoped-nonholder` (adds `docs/rehearsal-nonholder.md`), `callerCheckout=$B/other` | `documentation-cutover-lease` refusal; main unchanged | `{"error":"documentation cutover lease is held; non-holder operations are refused","code":"documentation-cutover-lease"}`; main 114f2394a before and after; no file on main | PASS |
| 9a | Refused: foreign caller, scoped branch | module door, `scoped-nonholder`, `callerCheckout=$B/foreign` | refused | `{"error":"documentation cutover lease is held; caller checkout must belong to the gated repository","code":"documentation-cutover-lease"}` | PASS |
| 9b | Refused: foreign caller, out-of-scope branch | module door, `code-foreign` (adds `rehearsal/foreign-code.txt`), `callerCheckout=$B/foreign` | refused (the foreign check comes before the path check) | Same refusal as 9a; main unchanged | PASS |
| 9c | Information only: `fgos run` with cwd in the foreign repo | `run "…" --worktree $B/foreign --json` (foreign) | gates the foreign repo, which has no lease | It wrote a default runner config into `foreign/.fgos/config.json`, then `outcome:"policy-refusal"`, `headless-no-executor`, exit 4. Not a lease case: the run door gates its own cwd repository. | n/a |
| 10 | Allowed: out-of-scope non-holder commit | `FGOS_HOST_BIN=… git commit` (other; `src/rehearsal-nonholder.txt`) | allowed | `[other-wt 9c00559f1] chore: non-holder out-of-scope change`, exit 0 | PASS |
| 11 | Allowed: holder commit to `docs/` | `FGOS_HOST_BIN=… git commit` (holder; `docs/rehearsal-holder.md`) | allowed | `[holder-wt f0946db4f] docs: holder scoped change`, exit 0 | PASS |
| 12 | Allowed: holder Land of a scoped change | module door, branch `scoped-holder` (child of main, adds `docs/rehearsal-holder-land.md`), `callerCheckout=$B/holder` | merged; main gains the docs file | Admission passed (no lease error). Land returned `outcome:"merge-failed-unclassified"`, error `{"code":"recovery-required","cause":"borrow-deadline: killed-after-grace","operationId":"lc-b4f32e93…"}`. Main unchanged. Doctor `git-operation-journal` then showed 2 pending `WorktreeCreate` operations (one per attempt) for `repo/.fgos/runtime/git-candidates/<id>`. Cause: the candidate `git worktree add` has a 120 s borrow deadline (`packages/git/rust/src/driver.rs`, `Duration::from_secs(120)`), and checking out this 4.43 GB tree took 2:22 (measured with a plain `git worktree add`). Owning test on a small fixture: `✔ a held documentation lease permits a code-only land and its holder can land scoped files`. | **FAIL on the real clone** (environment: tree size vs deadline); PASS in the owning test |
| 13 | Race: lease acquired between a non-holder Land's admission and its publish | `node --test test/runner/merge-land.test.mjs` (single file, `FGOS_HOST_BIN` = dev-built host) | refused; main keeps the lease commit; branch and worktree untouched | `✔ runner Land refuses a scoped branch when the lease is acquired after admission` with subtests `✔ before prepare`, `✔ after prepare`, `✔ before publish`. The file passed 22 of 22 tests, 0 failures. | PASS |
| 14a | Refused: non-holder release | `docs-lease release --json` (other) | not-holder | `fgos: caller is not the lease holder`, exit 1 | PASS |
| 14 | Release, with drift report | `docs-lease release --json` (holder) | released; drift reported; token removed | `result:"released"`, `drift:[]`, `releaseScopeDigests` equal to the acquire digests, commit `33915ab3a` touching only the sidecar. Token gone from holder and none in main. Drift is empty because step 12 published nothing to main. | PASS (empty drift) |
| 15a | Acquire again | `docs-lease acquire --worktree $B/holder --json` (repo) | acquired | `acquired`, tokenHash `78ca4672…92a6`, commit `4e4431f1a` | PASS |
| 15b | Abandon without a reason | `docs-lease abandon --owner-confirmed --json` (repo) | refused | "abandon requires --owner-confirmed and a written --reason", exit 1 | PASS |
| 15c | Owner abandon with a reason | `docs-lease abandon --owner-confirmed --reason "Rehearsal: holder session simulated as crashed" --json` (repo, non-holder) | abandoned and committed | `result:"abandoned"`, `abandon.reason` recorded, `ageMs:14083`, commit `b00a5a7f6`. `status` shows `state:"abandoned", held:false`. The holder's now-stale token file is left in place, by design. | PASS |
| 15e | Acquire after abandon | `docs-lease acquire --worktree $B/holder --json` | acquired | `acquired`, tokenHash `32a4a30d…368a`, commit `db532cdc2` | PASS |
| 15f | Release | `docs-lease release --json` (holder) | released | `released`, `drift:[]`, commit `fd1086405` | PASS |
| 16 | Rollback proof | `git rev-list 44ca64559..main` plus per-commit files | only the lease commits on main; no residue | 6 commits, each touching only `plans/documentation-cutover-lease.json`: 114f2394a acquired, 33915ab3a released, 4e4431f1a acquired, b00a5a7f6 abandoned, db532cdc2 acquired, fd1086405 released. Total diff from base: that one file, +42. Final sidecar `released`, `drift=[]`. No `docs/rehearsal-*` on main. Every token file is gone (repo, holder, other). Residue outside history, see note N2. | PASS (N2) |
| 17 | Doctor row, final | `doctor` (repo) | passed | `passed:true`, "no documentation-cutover lease is held; reference-transaction hook wired" | PASS |
| 18 | Token never in output | Scanned all 1236 captured output files (rehearsal logs and session task outputs): every 64-hex string was SHA-256 hashed and compared with the 3 holder token hashes | 0 matches | 66 007 candidates, **0 preimage hits**. The CLI prints only `tokenHash` and `tokenPath`. | PASS |

## Defects and notes

- **D1. Human-mode `docs-lease` exits 1.** Without `--json`, `bin/fgos.mjs` case `docs-lease` prints its line and returns `undefined`. The generic output stage then calls `wrapEnvelope(undefined)`, which fails with `fgos: The "data" argument must be of type string or an instance of Buffer, TypedArray, or DataView. Received undefined`, and the process exits 1.
  - Observed on `status`.
  - The same code shape applies to `acquire`, `release` and `abandon`. For those three the commit happens before the crash, so the transition succeeds but the command reports failure.
  - Every state-changing step above used `--json`.
- **N1. Refused `fgos run` leaves one file.** The refused run created or touched `repo/.fgos/workflow-runs/.bindings/.root`, a 28-byte file containing "fgos workflow case bindings". No unit record or assignment was written.
- **N2. Residue outside main's history.**
  - The two Land attempts in step 12 left 2 unresolved `WorktreeCreate` operations in the Git operation journal (`git-operation-journal: pendingCount 2`), plus partial candidate directories under `repo/.fgos/runtime/git-candidates/`. Lease transitions after them still committed normally.
  - The tracked `.fgos/coexistence.json` is modified by `fgctl init`.
  - The scratch tree, including both, was deleted.
- **N3. The documented onboarding cannot run from a clone of this branch.** `fgctl init` refuses a clone with `pin-mismatch` because of the committed project pin. Onboarding a clone of this branch needs either the pinned release staged or a pin edit, as recorded above.
