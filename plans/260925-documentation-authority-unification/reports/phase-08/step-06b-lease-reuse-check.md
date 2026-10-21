# Step 6b, read-only first: reuse check for the documentation-cutover write lease

Read-only. No file in any repo or worktree was changed, no lease was acquired, and the board was not updated.

## 0. Pins

- **main** = `10c412c901c4d6759a228a4859678aa5269b3081` (HEAD subject: "docs(board): add the rule-management lane …").
- **Plan branch input** = `plan/260925-documentation-authority-unification` @ `e9bf0650e38e68348f900dd54de9d14508bad92c` (phase-08 Step 6b, `cutover-write-lease-design.md` including "Current-door refinement", owner-answers L12-13 and L12-15).
- **Blob ids at main** (12 hex): `src/holder-lock/index.mjs` 732e1a104343 · `packages/holder-lock/contracts/lock-registry.v1.json` 760aa6d58f77 · `lock-registry.schema.v1.json` 11425e8fd1ee · `docs/platform/holder-lock/spec.md` 2015667d7eb9 · `docs/platform/git/spec.md` 4aa034eee7f0 · `src/runner/repo-locks.mjs` 759a038df6c6 · `.githooks/pre-commit` 5f1a0dc5d559 · `src/runner/execution/bind.mjs` ed82e6758cb7 · `src/runner/execution/run.mjs` c985f45189b3 · `src/workflow/case-verbs.mjs` 71a7a6b6c003 · `src/runner/merge.mjs` 807295bd748d · `src/setup/registrations.mjs` 2781d3b5886d · `packages/git/rust/src/driver.rs` 85afdd5693b0 · `packages/git/rust/src/land.rs` 97e18f42c85a · board `plan.md` 48138c997e2b.
- **Path correction:** `src/runner/main-checkout-lock.mjs` no longer exists at main. The repo-lock door was moved by `cd7ed1207`, and `withMainCheckout` now lives at `src/runner/repo-locks.mjs:62`.

## (a) Reuse matrix: ten owner requirements, mapped to current doors

All `file:line` references are at main `10c412c90`.

| # | Owner requirement (§6 + L12-15) | Existing door (exact pin) | Thin adaptation needed | Proof |
|---|---|---|---|---|
| 1 | No TTL, fail closed, explicit abandon | `acquire` in `src/holder-lock/index.mjs:293` (`acquireSync` :245; `probe` :365; `lockHolders` :396; `LockHandle.release` :113). It is a kernel lock with no TTL and no pid self-recognition (holder-lock spec §1, line 27: "no decision … derived from a pid, a TTL"). A holder that dies releases the lock by dying (`repo-locks.mjs:3-6`). | The kernel handle only **serializes transitions** (acquire, release, abandon). The committed held sidecar is the freeze authority. Abandon refuses while `probe` reports `held`. Otherwise abandon requires owner confirmation plus a written reason, because the holder is a string session id, so its liveness cannot be decided (design §3.7). There is no clear/reclaim API to restore. | Missing. Needed: a multiprocess test (holder dies → sidecar still held → refused), live-holder abandon refusal, explicit abandon/release. Pattern to reuse: `test/holder-lock/facade-multiprocess.test.mjs`. |
| 2 | Non-holder dispatch refused at `fgos run`, `fgos workflow start`, `bind()` | `fgos run` → `runUnit` (`bin/fgos.mjs:2942` → `run.mjs:415`). `bind()` is called at `run.mjs:931`, and its refusal is returned at `:933-938`. Workflow steps go through `runUnit` (`src/workflow/runner.mjs:412,433`). `startWorkflow` is at `case-verbs.mjs:124` and `startWorkflowDetached` at `:86`, entered from `bin/fgos.mjs:2304-2341`. `bind()` is at `bind.mjs:453`: per-candidate rejection, then the lead-inline fallback at `:500-515`, then `refused` at `:517-520`. The assignment runner also imports `bind` (`dispatch/assignment-runner.mjs:50`). | (i) A whole-call refusal at the **top** of `bind()` driven by `ctx.lease` and reason `documentation-cutover-lease`. It must not be a per-candidate rejection, or the inline fallback at :500 would absorb it. `bind()` stays pure: the lease state comes in through ctx. (ii) An admission check in `runUnit` before the unit run exists, next to the case-admission port (`run.mjs:505,619-638`). (iii) An early refusal in `prepareWorkflowRun` (`case-start.mjs:273`) so `workflow start` fails before anything opens. Holder recognition: the Unit's worktree is the cutover worktree **and** its token file matches the sidecar digest. That means no new env variable and no new flag. | Missing. Wiring proofs extend `test/runner/execution/bind.test.mjs`, `test/runner/execution/run-case-admission.test.mjs` and `test/workflow/case-admission*.test.mjs`. |
| 3 | Merge refused only when changed paths intersect scope; code-only merges proceed | `landRunnerItem` (`merge.mjs:1126`) is the single consumer door. Callers: `approve.mjs:543,705`, `sync-root.mjs:130`, `promote-engine.mjs:75`. `landedFiles = changedFiles(…)` at `merge.mjs:1171`, before `port.prepare` at :1183. Land publishes with hooks **off** (`land.rs:159` `checkout_call_borrowed(…, false)`), so pre-commit never sees a land. | Refuse between :1171 and :1173 when `landedFiles ∩ scope ≠ ∅` and the caller is not the holder, with a typed `MergeError` code. Do not use `withMainCheckout` (L12-15). | Missing. Extend `test/runner/merge-land.test.mjs` with one scope merge refused and one code-only merge passing. |
| 4 | Fixed scope `docs/**`, `AGENTS.md`, `CLAUDE.md`, switchboard md + json, `core/skills`, `.agents/skills`, `plugins/fgOS/skills` | No existing door. The scope list goes in the wrapper as a frozen constant, not as config (no `registerConfigDefault`). | One exported constant and one `intersectsScope(paths)` helper, shared by every gate (DRY). See (d) item 3: the sidecar path itself should also be refused to non-holders. | Unit test of the matcher, including literal byte paths. |
| 5 | Primitive reuse (no parallel lock or liveness) | Holder-lock facade plus registry. Rank 10 allows kind `lease` (`lock-registry.v1.json:5`). The no-legacy row pattern is `worktree-admin` (:193-203, `v1Shape/v1Path/fence: null`). `resolveLock` is at `src/holder-lock/registry.mjs:82`. Rust embeds the registry (`packages/holder-lock/rust/src/scope.rs:40` `include_str!`). | New row: `{name: "documentation-cutover", kind: "lease", scope: "repo", rank: 10, v3Path: "<fgosDir>/locks/documentation-cutover.lock", v1Shape: null, v1Path: null, fence: null}`. Rank 10 lets the holder keep the handle across Land (slot 20, admin 40, main 50), and Land accepts lower held ranks (git spec §9). **Schema change needed:** `owner` enum (`schema:52` = `4.2, 4.3, 4.4, 6.2, event-store, git`) has no value for this lane. Holder-lock spec §7 (line 144) lists the owners. Both need the Holder-lock owner's agreement through the board. `fgosDir` = the trusted main `.fgos`, resolved the way `repo-locks.mjs:84-85` does it (`gitPortOptions(...).trustedMain`). | Existing tests cover the row: `test/holder-lock/registry-contract.test.mjs` (schema validity, unique names, rank/kind table at :89-105). Rust rebuild/release-tree tests pick it up. No new registry test is needed. |
| 6 | Rehearsal (acquire, refused commit/dispatch/merge, abandon, release) on a throwaway worktree | All needed doors exist: `fgos worktree create`/`remove` (git spec §3 Worktree), the `fgos run` disposable worktree, and Land on a disposable branch. | A rehearsal script or runbook that goes only through the new door verb plus the existing doors. No test-only switch. | To do (Step 6b reviewer/proof). Owned by the rehearsal record, not by a duplicated unit test. |
| 7 | Phase 8 delivery | n/a | Build is sequenced by (c). Delivery is still possible inside Phase 8 only after SEAT lands (see (c)). | n/a |
| 8 | Reference-transaction guard, through the typed Git boundary | No reference-transaction hook exists (`.githooks/` = `pre-commit` only). Git's typed doors run with a trusted `core.hooksPath` that suppresses repository hooks (`driver.rs:1006-1017`). Only `Policy::HookContext` (ScopedCommit, `scoped_commit.rs:646`) runs repository hooks. Land is hooks-off (`land.rs:159`). Publication is hooks-off by contract (git spec §4, line 217). `refs/fgos/*` is outside the lease scope anyway. Hook install and ownership: RepositoryConfig `ensureHooks`/`inspectHooks` (git spec §3 line 121, §11 line 534). Hook contract: §7 (lines 325, 331, 337). | A new `.githooks/reference-transaction`. A `sh` fast path exits unless `$1 = prepared` and a stdin line names the target or plan branch ref. Then: held sidecar → for each update, compute changed paths `old..new` with `git diff-tree` and refuse a non-holder **only** on scope intersection. A refs-only guard would also refuse Work's `.fgos` checkpoint ScopedCommit on main, which runs hooks, and that would break decision 3. The guard also refuses deletion or non-fast-forward of the plan branch ref while held. **Integration through the boundary** means: register the hook in Git spec §7's hook contract and in the RepositoryConfig `inspectHooks` provenance/doctor gap. It does not mean a second Git-side ref guard. Land's coverage stays in requirement 3. | Missing. Needed tests: `update-ref`, `--no-verify` commit, ff `merge`/`pull`, rebase, `cherry-pick`, `am` on the target branch are refused for scope paths and pass for `.fgos`-only updates; the hook resolves the main `.fgos` from a linked worktree. Evidence for that last point: `pre-commit:475` `repoRoot = path.resolve(__dirname,'..')` plus the absolute hooksPath rule (git spec G-004). |
| 9 | Random holder token outside the environment | No existing door. `resolveWriterIdentity` (`src/util/session-identity.mjs:165`) is an identity, not proof of possession (design §6.9). | The token is generated at acquire with `crypto.randomBytes` into a git-ignored file in the cutover worktree. The **committed sidecar stores only its sha256**, never the token. Refusal messages name no identity. Holder workers are recognized by the worktree token file (requirement 2), never by env. | Missing. Test: an env-exported session id does not pass any gate; the committed sidecar contains no token. |
| 10 | Committed held sidecar; held plus missing lock fails, checked by doctor and the commit hook | Doctor registry `registerCheck` (`registrations.mjs:178`). The existing precondition check is `main-checkout-hook-wired` (:1594). The commit hook's unconditional guard slot is before `hookRunsAtHome` (`pre-commit:484-502`) and **before** the borrower early exit (`:530`). Convention door for the sidecar path: `fgos convention path` at build time. | Holder-lock lock files are created once and never removed (`index.mjs:182-187`), and the kernel lock is free between holder processes. So "held sidecar + no kernel holder" is the **normal** in-lease state, and the L12-15 reading applies: held means refuse every non-holder, regardless of the kernel lock. One doctor row, `documentation-cutover-lease`: fail while held (age, holder digest); fail if the reference-transaction hook is not wired. One pre-commit guard placed before `:504`. | Missing. Test: `git clean -fdX` / lock file deleted → commit, dispatch and merge are still refused, and doctor fails. |

**Removed or inapplicable prior art.** The design §2 rows `acquireMainCheckoutLock`, `forceReclaimAmbiguousLock` and `fgos unlock` TTL are historical. The Holder-lock facade replaced them and Git 04 custody landed. `withMainCheckout` (`repo-locks.mjs:62`) is callback-scoped (`withRepoLock` :28-54 releases in `finally`), so it is used only for brief cutover ref/commit operations, per L12-15. `fgos dispatch execute` is gone. `dispatch decide` uses `compileDispatchPlan` (`dispatch/plan.mjs:56`), not `bind()`. The design §3.3 "decide reports unavailable" visibility is optional and is not an owner requirement.

## (b) Implementation file set (thin wrapper)

**Code**

- NEW `src/runner/documentation-cutover-lease.mjs`: acquire, inspect, release and abandon; sidecar read/write; token; scope constant and matcher; `leaseAdmission()`. This is one module. Check its row in `docs/architecture-manifest.json` (`test/architecture.test.mjs`).
- `packages/holder-lock/contracts/lock-registry.v1.json` (row) and `lock-registry.schema.v1.json` (owner enum).
- `.githooks/pre-commit` (one guard) and NEW `.githooks/reference-transaction`.
- `packages/git/contracts/mutation-census.v1.json`: regenerate it. It records `.githooks/pre-commit:<line>` sites, so any hook edit shifts them, and the new hook gets scanned.
- `src/runner/execution/bind.mjs` (top-of-call refusal) and `src/runner/execution/run.mjs` (`runUnit` admission plus `ctx.lease`).
- `src/workflow/case-start.mjs` (`prepareWorkflowRun` early refusal; `case-verbs.mjs` is unchanged if both start paths go through `prepareWorkflowRun`).
- `src/runner/merge.mjs` (`landRunnerItem` scope gate).
- `bin/fgos.mjs` and `src/cli/command-registry.mjs`: one door verb (acquire, status, release, abandon).
- `src/setup/registrations.mjs`: one doctor row.

**Spec and changelog owners**

- `docs/platform/holder-lock/spec.md` §7 (row, owner) — Holder-lock owner.
- `docs/platform/git/spec.md` §7 hook contract (lease guard plus reference-transaction hook) — Git owner.
- The runtime-state/doctor row in `docs/specs/distribution.md`, per design §5. Phase 9 retires `docs/specs/**`, so place it in the target that cutover maps.
- `CHANGELOG.md` `[Unreleased]`.

**Tests**

- NEW `test/runner/documentation-cutover-lease.test.mjs` (owning proof).
- Hook tests next to `test/githooks/`.
- Extensions of `bind.test.mjs`, `run-case-admission.test.mjs`, `merge-land.test.mjs` and the workflow admission tests.
- `test/suite-baseline.json` if the TEST lane's `suite:` gate requires it.

**Not in the set**

- The `assertDocWriteAllowed` helper for the 25 unconfirmed writers (design §3.2). It is not one of the ten owner decisions, and the commit and ref gates catch their results. It is a Lead-optional design item.
- `decide` visibility.

## (c) Collision intersection with the board (main pin, board blob 48138c997e2b)

"File chung dễ va" rows: line 104 onward. Lane rows: "Các luồng".

| File(s) | Lane | Status at pin | Verdict |
|---|---|---|---|
| `src/runner/execution/bind.mjs` (1088-line rewrite), `run.mjs` (+436/−), `src/setup/registrations.mjs`, `bin/fgos.mjs`, `CHANGELOG.md`, `src/workflow/*` incl. `case-admission-port.mjs`, `case-start.mjs` | **SEAT** (`seat-binding-wave` = `22d02f15c`; `seat-p09` running 09→11; land time not set). Source: `git diff --stat main...seat-binding-wave` | running, not on main | **BLOCKING collision.** The `bind()` signature is already changed on SEAT (`bind(ask, ctx, { walk })`, seat-binding-wave `bind.mjs:540`). The dispatch gate must be written on post-SEAT bytes. |
| `packages/holder-lock/contracts/lock-registry.v1.json` (+schema), `docs/platform/holder-lock/spec.md` | Holder-lock owner. **HARDEN T1** (phase 02 reviews `src/holder-lock/*` and the registry; pending, gated on SEAT landed). **MAIL V2** wants a `mailbox` row in the same file (MAIL is ready, not started). Board row "lock-registry … 4.4a/4.3-R" lanes have all landed. | HARDEN running (T0); T1 pending; MAIL not started | **Needs coordination, not blocking.** Agree the row, rank 10 and the owner enum with the Holder-lock owner/HARDEN through the board before build. MAIL lands its row independently, and the later lander rebases. |
| `src/setup/registrations.mjs`, `CHANGELOG.md`, `docs/platform/*/spec.md`, `packages/git/contracts/mutation-census.v1.json`, `test/suite-baseline.json` | HARDEN (every layer), SEAT, TEST (`forgent-f8`, running), GIT, DOC | running | **Sequencing (rebase-later rule).** Message the HARDEN, TEST and GIT owners before merge. The census is regenerated by its own build step. |
| `docs/platform/git/spec.md` §7, `.githooks/pre-commit` | **GIT** (07–08 landed; E3 ScopedCommit fixes in flight in `packages/git/rust`, with no spec change); HARDEN T2 later | running (E3) | **No file overlap with E3's Rust files.** The §7 text edit needs the Git owner's consent. |
| Git 04 custody | GIT | **landed** (main `d49800451`; owner machine 10-19 18:41, log.md line 118; second machine 15:39, line 128) | No in-flight custody. **Clear.** |
| `bin/fgos.mjs`, skills | **COOK** (P5 active; P6 not running, waits for SEAT land). P6 may touch `core/skills/fgos-cook` (inside the lease scope). | not running | No build collision beyond `bin/fgos.mjs`, which is already sequenced behind SEAT. **Window rule:** COOK P6 skill edits must not straddle the lease window (precondition 3). |
| `src/runner/merge.mjs` | Board row: 4.3-R and GIT G4 (both landed). SEAT does not touch it. | — | **Clear.** |
| `.githooks/reference-transaction` (new), new lease module, new tests | none | — | **Clear.** |
| MAIL | V2 registry row only | ready, not started | **Clear** (rebase if it lands first). |

**Verdict: the build needs sequencing, and the dispatch-gate slice is blocked.**

- **Blocked until SEAT lands on main:** `bind.mjs`, `run.mjs`, `registrations.mjs`, `bin/fgos.mjs`, `CHANGELOG.md`, workflow admission. Per Step 6b this collision **stops the build slice and goes to the big lead (`forgentx-95`, who also runs SEAT) for sequencing.**
- **Could be prepared on a branch from main now, landing after SEAT:** the wrapper module, the registry row (after Holder-lock-owner agreement), both hooks, the merge gate and the tests. Preparing them is not landing them.

Holder-lock registry coordination: **not done.** This worker made no board write and claims no coordination receipt.

## (d) Conflicts with current Git/Holder-lock contracts

**No conflict that reverses an owner decision was found.** Four refinements fall within the Lead's A42 authority because they implement the decisions literally on current doors:

1. **Decision 10: "lock file absent".** Under Holder-lock the lock file is never removed (`index.mjs:182-187`) and the kernel lock lives only with its process (`repo-locks.mjs:3-6`). "Held plus absent lock" is the normal in-lease state. L12-15 already settles it: the held sidecar refuses every non-holder.
2. **Decision 8: "it runs for every ref update".** This is false for fgOS's own typed doors, which suppress hooks (`driver.rs:1006-1017`, `land.rs:159`; git spec §4:217). The hook covers raw Git plus ScopedCommit. Land is covered by the merge gate (requirement 3). The hook must diff paths by scope, or it would block Work's main checkpoint commit and break decision 3.
3. **Where the gates read "held".** The design commits the sidecar "under the plan reports directory" (the plan branch). Gates in other worktrees must read it from a ref, through Inspect `readObjects`/`pathsAtRevision`, and a deleted plan branch must not reopen the freeze. The recommendation, as a Lead decision:
   - The holder lands the held sidecar onto **main**. `plans/**` is outside the scope, so the code-only path allows it.
   - Every gate reads `refs/heads/main:<sidecar>`.
   - The sidecar path joins the non-holder refused set while held. This self-protects the record; it does not widen decision 4's documentation scope.
   - The alternative is to read it from the plan branch and also guard that ref in the reference-transaction hook. That is weaker: a typed-door branch delete runs hooks-off.
4. **Live-holder abandon refusal.** Liveness can only be `probe` = `held` (holder-lock law: no pid or TTL). For a string session id, abandon otherwise needs an owner flag plus a written reason, exactly as design §3.7 says.

**Five-part packet (prepared only in case the Lead judges item 2 an owner-design conflict; the recommendation is not to route it):**

- **What:** owner decision 8 assumes a repository `reference-transaction` hook sees every ref update. At main `10c412c90`, Git's typed doors (Land, Refs, Publication, Worktree) run with a trusted hooks-disabled `core.hooksPath` (`driver.rs:1006-1017`, `land.rs:159`; git spec §4 line 217). Only ScopedCommit and raw Git fire the hook.
- **Cause:** Git component C1/V-TRUST hardening (owner Q1 era), which postdates the 2026-10-06 design.
- **Options:**
  - **A.** Keep the hook for raw Git plus ScopedCommit, with path-scope diffing; Land is covered by the `landRunnerItem` scope gate. Cost: about 0.5 day, already in (e). No owner wait.
  - **B.** Add a lease check inside Git's Rust Land/Refs ports. Cost: a Git-owned contract change during GIT E3 and HARDEN T2, a cross-lane wait and Git-owner review of about 1–2 days, and Git would gain consumer semantics, which the spec forbids ("Git never imports Work").
  - **C.** Drop the hook and rely on the release-time tree-id comparison only. That reverses decision 8, so it is owner-only.
- **Recommendation:** A, decided by the Lead under A42 and recorded. No owner question.
- **Scope:** design §6 decision 8 wording and §3.3 gate table only. Decisions 1–7, 9 and 10 are untouched.

## (e) Re-estimate (build + rehearsal)

The plan carries 6b at **1.25–2.5 Doer days**. Measured against this file set:

| Work | Doer days |
|---|---|
| Wrapper, sidecar, token, door verb | 0.5–0.75 |
| Registry row, schema and spec | 0.1–0.25 |
| Pre-commit guard, reference-transaction hook (fast path, scope diff, linked-worktree resolution) and census regeneration | 0.5–0.75 |
| `bind()`, `runUnit` and workflow-start admission on post-SEAT bytes | 0.25–0.5 |
| Merge gate | 0.25 |
| Doctor row | 0.25 |
| Owning tests, including bypass attempts and multiprocess holder death | 0.75–1 |
| Rehearsal on a disposable worktree | 0.5 |
| Spec and changelog | 0.25 |
| Rebase onto SEAT | 0.25 |
| **Total** | **≈3.5–4.75 Doer days** |

On top of that: independent review of about 1 day, and a calendar wait for the SEAT land. That wait is not effort, but it can push 6b-build past the rest of Phase 8 unless the non-dispatch slice is prepared first. **Delta vs plan: +2.25 days at the top end.** The serial Doer sum becomes about **10.75–17 days** (8.75–15 + 2 to 2.25), before review.

## Concerns

- I used Bash to write four read-only copies of main-pinned files into the shared scratchpad root: `git-spec.md`, `hl-spec.md`, `board.md` and `log.md`. If files with those names already existed there, they were overwritten.
- I did not read `log.md` whole; I grepped it by lane id and date only.

Status: DONE_WITH_CONCERNS
Summary: Every one of the ten owner requirements maps onto current main doors with thin adaptations (Holder-lock `acquire` with a rank-10 lease row plus a schema owner-enum change, a held-sidecar authority, gates in pre-commit, a new reference-transaction hook, `runUnit`/`bind()`/workflow start, and `landRunnerItem`), and no conflict needs the owner. The build collides with SEAT (in flight on `bind.mjs`, `run.mjs`, `registrations.mjs`, `bin/fgos.mjs`, CHANGELOG, workflow), so it must go to the big lead for sequencing after the SEAT land; the Holder-lock registry row still needs owner/HARDEN coordination; the estimate rises to about 3.5–4.75 Doer days plus review.
