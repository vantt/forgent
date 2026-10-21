# Git phase 07, unit 16: Node and Rust readers onto Inspect

Branch `git/p07-readers` from `7d931a0a2`. Nothing is committed. Census used: `scout-261020-1616-git-p07-u13-census.md`, families "Node readers" and "Rust/outer readers".

## What moved

**Shared helper.** `src/util/git-paths.mjs` gains two functions:
- `inspectEntries(read)` walks every page of a paged Inspect read.
- `inspectPath(bytes)` turns an Inspect byte path into a string.

**Node, every Git read moved to Inspect:**

| File | Old read | Inspect operation |
|---|---|---|
| `runner/paths.mjs` | `--show-toplevel`, `rev-parse HEAD` | `resolveRepo().worktreeRoot`, `resolveCommit('HEAD')` |
| | `--git-common-dir` | `resolveRepo().trustedMainRoot` |
| | content root `worktree list` | `checkoutPathForBranch` |
| `runner/dispatch/trust-store.mjs` | `--git-common-dir` | `resolveRepo().commonDir` |
| `runner/dispatch/assignment-runner.mjs` | worktree list | `listWorktrees` (now NUL-safe) |
| `runner/dispatch/transport.mjs` | `captureDispatchAttestation` | `resolveCommit('HEAD')`, plus the checkout's own `listWorktrees` row for `headRef` (detached → null) |
| `runner/work-dispatch.mjs` | its private `gitIn` (deleted) | `captureDispatchAttestation` (now exported), `safeGitHead`, Inspect `status` (any entry) |
| `runner/operation-choice.mjs` | `rev-list --count trunk..fgw/<id>` | `compareCommits().right` |
| `state/postland-drift.mjs` | show-ref, merge-base, both diffs | `resolveRef`, `compareCommits().mergeBase`, paged `diff` |
| `state/store.mjs` (`checkPlanEvidence`) | `rev-parse --verify`, `cat-file -e` | `resolveRef`, `pathsAtRevision` (present or not-a-blob = exists) |
| `verbs/state/edit.mjs` | two raw `--git-common-dir` copies | `resolveMainCheckoutRoot` (one door) |
| `verbs/state/move.mjs` | `merge-base --is-ancestor` | `resolveCommit` ×2 + `ancestry`; any failure → `StoreError('validation')`, as before |

**Node, partly moved.** Each of these files still makes one raw read, because no Inspect operation exists for it (see needsWrites):
- `runner/settlement.mjs`: `safeGitHead` → `resolveCommit`; `safeGitCommittedDiffFiles` → paged `diff`.
- `runner/claim-liveness.mjs`: worktree list → `checkoutPathForBranch`; the checkout's status → Inspect `status`, with `.fgos` filtered out.
- `runner/promote-preflight.mjs`: worktree list → `checkoutPathForBranch`; merge-base → `compareCommits`.
- `state/drift-status.mjs`: branch existence → `resolveRef`; is-ancestor → `ancestry`; ahead/behind/last-synced → one `compareCommits`; "introduces nothing" → `compareContent(mergeBase, tip)`.

**Rust (observe).**
- `fgos-observe` now depends on `fgos-git`, as Git spec §4 names it a consumer.
- New `sources/repo.rs::open_repository(root)`: holder-lock state root → `GitDriver::new` → `resolve_repo`.
- `case_journal::get_git_head` → `resolve_commit_ref("HEAD")`.
- `claude_transcripts::get_valid_cwds` → paged `list_worktrees` (byte paths).

## Changed assertion

`packages/observe/rust/tests/boundary_test.rs`. Authority: Git spec §4 ("Rust consumers (observe, fgos-work-state) link fgos-git in-process").
- **Old:** `vec!["fgos-holder-lock", "fgos-host-runtime", "fgos-session-identity"]`
- **New:** `vec!["fgos-git", "fgos-holder-lock", "fgos-host-runtime", "fgos-session-identity"]`, with the comment naming Git as a foundation crate.

No other assertion changed.

## Judgment calls

- **Domain/kernel-layer files left unmigrated:** `runner/attestation-guard.mjs`, `state/cleanup-harness.mjs`, `state/tool-registry.mjs` (domain) and `cli/version.mjs` (kernel).
  - Importing the infra facade breaks `test/architecture.test.mjs` (one-directional-layer).
  - The precedent is `events-jsonl-truncation-guard`, which was reclassified to infra when it switched to the port. The manifest is coordinator-reserved, so this is a needsWrite.
  - The two edits were written, then reverted to keep the tree green. They are ready to reapply: `cleanup-harness` threads one lazily opened port through the recursion, and `attestation-guard` uses `resolveCommit` + `ancestry`.
- **`safeGitStatusFiles` stays raw.** Inspect `status` cannot skip a submodule's internal dirt (no `--ignore-submodules=dirty`, and no submodule field). The existing test "…skips a submodule's own dirt" pins that behaviour, so I did not migrate it rather than weaken the test.
- **One Inspect port per top-level call.** Measured cost: creating a port is about 60 ms (`loadNativeAddon` re-hashes the 84 MB addon each time); one read is about 40 ms.
- **Small behaviour edges:**
  - An orphan root branch, which shares no merge base with its target, now reports 0 ahead/behind in `driftStatus`. Before, it reported raw counts.
  - The error texts of `edit` (no repo) and `move` (reachability failure) are reworded.
  - Paths from `resolveMainCheckoutRoot` and trust roots are now canonical (realpath).
- **Rust rows left open for a decision:**
  - `distribution/workspace.rs` is `fgos init`'s bootstrap read. It runs before a state root necessarily exists, and `GitDriver::new` requires a trusted, existing state root.
  - `distribution/lib.rs` (`--short` HEAD) and the paired `cli/version.mjs`: Inspect has no abbreviation.
  - `herdr-fgos-common/fgos.rs`: its consumers `herdr-dashboard` and `apps/fgos-gateway` are outside the workspace, with their own lockfiles outside my scope.

## Census rows

**Closed: Git reads migrated.**
- `src/runner/paths.mjs`
- `src/runner/dispatch/trust-store.mjs`
- `src/runner/dispatch/assignment-runner.mjs` (line 920 is a regex)
- `src/runner/dispatch/transport.mjs` (line 391 is the executor spawn, not Git)
- `src/runner/work-dispatch.mjs`
- `src/runner/operation-choice.mjs` (line 2053 is a regex)
- `src/state/postland-drift.mjs`
- `src/state/store.mjs` (lines 652/1865/1869 are regexes or `.git` file reads)
- `src/verbs/state/edit.mjs`
- `src/verbs/state/move.mjs`
- `packages/observe/rust/src/case_journal.rs`
- `packages/observe/rust/src/sources/claude_transcripts.rs:74`. Lines 380–404 are classified as a Rust test sandbox repo (§13).

**Closed: non-Git candidates.**
- *Regex `.exec`:*
  - `intake/plan-verdict-from-plan-md`, `intake/plan`
  - `report/capability-plan-lint`, `report/context-render`
  - `run-supervisor/cancel-registry`
  - `dispatch/{assignment-layout,config,execution-contract,operation-prompt-templates,reconciliation-planner,recovery-planner,run-lock,terminal-slot}`
  - `execution/unit-run-history`, `state/retrospective-doors`, `util/third-party/js-yaml`
- *Comments:* `dispatch/resolve`.
- *SQLite `db.exec`:* `dispatch/provider-credential-renewal`.
- *Other binaries:*
  - host, provider, herdr or bwrap: `run-supervisor/{client,direct-launch}`, `dispatch/{provider-capacity,provider-credential-probe,worker-session-boot}`, `confinement/probes/harness`, `terminal-control/client`, `util/{host-bin,session-identity}`
  - fgos, cargo or gateway: `fanout-batch`, `gateway-control`
  - user goal shell: `goal-check`
- *`.git` file reads, not a spawn:* `dispatch/runtime-inspection`.
- *Rust:*
  - `apps/fgos-gateway/src/gateway.rs`, `apps/fgos/src/legacy_exec.rs`
  - `distribution/{fetch,git_gate}.rs`; `distribution/init.rs` (node, launcher, fgos; line 2080 is a test `command -v git`)
  - `durable-file`, `host-runtime/*`, `process/*`, `run-supervisor/*`, `terminal-control/driver/herdr.rs`
  - `git/node-addon/examples/e3_fixture.rs` (a thread)

**Open.**

| Row | Why |
|---|---|
| `src/cli/version.mjs:26` | Kernel layer, plus no abbreviation operation |
| `src/runner/attestation-guard.mjs` | Domain layer |
| `src/state/cleanup-harness.mjs` | Domain layer; the cherry-pick count also has no operation |
| `src/state/tool-registry.mjs:180` | Domain layer |
| `src/runner/claim-liveness.mjs:36` | `log -1 --format=%ct <branch>`: no operation |
| `src/runner/promote-preflight.mjs:49` | `merge-tree`: no operation |
| `src/state/drift-status.mjs:112` | `rev-list --cherry-pick` count: no operation |
| `src/runner/dispatch/settlement.mjs:163` | Submodule-dirt status mode |
| `packages/observe/rust/src/sources/repo.rs` (all), `metrics_cli/harness.rs:184` | `rev-list --count`, `ls-files`: no operation |
| `packages/distribution/rust/src/{workspace,lib}.rs` | Decision question below |
| `packages/herdr-fgos-common/rust/src/fgos.rs:348` | Lockfiles outside scope |

## needsWrites (exact)

1. **`docs/architecture-manifest.json`**: set these files to `"infra"`, then reapply the reverted edits:
   - `src/runner/attestation-guard.mjs`, `src/state/tool-registry.mjs`, `src/state/cleanup-harness.mjs`: domain → infra.
   - `src/state/cleanup-pool.mjs`: domain → infra. It imports `cleanup-harness`, and nothing in `src/bin` imports it.
   - `src/cli/version.mjs`: kernel → infra.
2. **`packages/git` Inspect operations plus `src/git/inspect.mjs` method list (Land-leftovers lane):**
   - `commitTime({ revision }) -> number` (seconds, committer time)
   - `status({ untracked, ignoreSubmodules: 'none'|'dirty' })`, or a `submodule` field on `StatusEntry`
   - `mergeTreeConflicts({ base, ours, theirs }) -> { conflicted: bool, paths }`. It is shared with `merge.mjs`'s raw `merge-tree`.
   - `unmatchedCommitCount({ upstream, head }) -> number` (`rev-list --count --cherry-pick --right-only --no-merges upstream...head`)
   - `countCommits({ revision }) -> number`
   - `trackedPaths({ revision }) -> paged byte paths`
   - `abbreviateCommit({ oid }) -> string`. Needed unless the owner accepts a full OID (decision below).
   - Rust: `GitDriver::open_at(path)`. It replaces the open-driver-then-resolve sequence that observe, `git_grant` and the addon each repeat.
3. **`src/runner/worktree.mjs`:** delete `findCheckoutPath`, which no longer has a caller (L10).
4. **`herdr-dashboard/Cargo.lock`, `apps/fgos-gateway/Cargo.lock`:** needed when `herdr-fgos-common` takes `fgos-git`.

## Ideas (not done; owner chooses)

- Memoize the verified addon in `loadNativeAddon`, keyed by path and digest. Every `createGitInspect` currently hashes 84 MB, about 60 ms. Callers that open several ports per command, such as `worktree.mjs`' `inspectGit` per helper, pay that each time.

## Verification

**Node.** Every Node test ran through a wrapper (`$SCRATCH/run-node-tests.mjs`) that sets umask 077, calls `ensureGitAddon(env)`, sets `FGOS_STATE_ROOT=/tmp/fgos-work/u16/state` and `FGOS_TEST_FIXTURE_ROOT=/tmp/fgos-work/u16/fixtures` (both mode 700), then runs `node --test`.

Files run:
- architecture
- `runner/{assignment-runresult,claim-liveness,dispatch-trust-store,operation-choice,paths,promote-preflight,claim-port,dispatch-brief,dispatch,herdr-private-home-trust,loop,spawn-worker,work-unit-for,assignment-provenance,merge-quoted-paths,dispatch-reconciliation-import-graph}`
- `state/{drift-status,postland-drift,store,work-size-rigor}`
- `cli/{fgos-edit,fgos-merge,fgos-move}`, `direct/fgos-edit`, `parity/edit-parity`
- `intake/{discovery,plan}`, `report/context-render`, `setup/checks`

**Baseline.** The same files were run on HEAD bytes in this same checkout and environment:
- HEAD: 161 failing tests.
- After my changes: the same set. No new failure, none fixed.

Every remaining failure is environmental:
- EROFS on `~/.local/state/fgos/attestations`;
- bwrap "No permissions";
- `nested-write-from-confined-worker`.

**Rust.**
- `FGOS_STATE_ROOT=/tmp/fgos-work/u16/rstate cargo test -p fgos-observe`: all ok. The external-worktree test exercises `list_worktrees`.
- `cargo clippy --locked -p fgos-observe --all-targets -- -D warnings`: clean.
- `cargo test --locked -p fgos-work-state -p fgos-run-result`: ok.

**Other.**
- `git diff --check`: clean.
- Impact analysis was not run.

**Needs the outer host:** the bwrap/confinement suites, and anything that writes the real state root. Observe tests need a writable, mode-700 state root (`GitDriver::new`).

## Decision question (owner)

- **What is happening:** `fgos init`'s workspace-root read and the version commit (Node + Rust) are raw Git.
- **Cause:** `GitDriver` needs an existing trusted state root, which is not guaranteed at init bootstrap, and Inspect cannot abbreviate an OID.
- **Options:**
  - (a) The driver creates its own state root, and version shows the full OID: small; visible output change plus a CHANGELOG line.
  - (b) Add `abbreviateCommit`, and init creates the state root before resolving: two new pieces.
  - (c) Name init's workspace read a bootstrap exemption: keeps a raw read and fails "allowlist zero".
- **Recommendation:** (a).
- **Scope:** these four rows only.

Status: DONE_WITH_CONCERNS
Summary: Git reads in 10 Node reader files and two observe Rust readers now go through Inspect (partly in 4 more), with no new test failures against a HEAD baseline. Domain/kernel-layer readers wait for a manifest reclassification, and several reads wait for new Inspect operations.
Concerns/Blockers: Manifest layer change, six new Inspect operations, and the init/version decision; see needsWrites.
