# Git phase 02: scope and Inspect checkpoint

Base: `6b39f6179`, branch `git/p02-scope-refs`. No commit or staging performed. `impact-analysis: inactive` (capability query returned zero providers).

Implemented the Rust transaction-local scope from the shared embedded registry, verified close-only borrowed handles with Rust owner lifetimes, and the dormant Inspect Rust/addon/Node facade. Reused holder-lock acquire/validate/borrow/drain/release, Git's hardened driver, ref pages and batched path reads. Prior-art search (`git log --all -G 'BorrowedHandle|LockScope|snapshotWrites'`) found phase-01 contracts/reads, no removed Rust scope to resurrect. Release-settle code remains unchanged; `port.rs` additions are localized to BorrowedHandle/AsRef and the two borrow signatures.

Proof covers all 1,024 subsets of registry ranks against R30 acquisition profiles, Node/Rust registry parity, same-rank refusal before filesystem effects, independent scopes, replaced authority, close-only copies and exactly one inherited description slot. Inspect covers porcelain-v2 byte paths, pinned diff with both move halves, explicit absence/error, shallow traversal, batched objects/paths, worktree pages, trunk uncertainty and streamed snapshots. Real repositories cover files/reftable; the byte-path test round-trips every non-NUL/non-slash byte. The new diff test exposed and fixed hardening flags appended after `--` (they were being treated as paths).

**Topology:** registered linked worktrees work with the supplied trusted main checkout, even after poisoning the worker gitfile. Automatic trusted-main discovery is not added: worker `.git` cannot grant authority. A gitfile passed as the trusted main root now refuses `trusted-main-gitfile-unsupported`; separate-git-dir is explicitly unsupported. Unix snapshots reject symlink parents and never read FIFOs; non-Unix snapshots refuse `snapshot-platform-unsupported`.

**Blocking scope gap:** the private descriptions WeakMap and `borrows` counter are in `src/holder-lock/index.mjs`, excluded from the execution write scope. A separate handover module cannot safely access them. That file must be authorized before implementing the one-shot addon capability/External handover. No fd-number export or alternate map was added. Refs/Remote and their mutation proofs remain unimplemented, so this is not phase completion. The board's required lane update is also outside scope and remains for the coordinator.

| Step | State |
|---|---|
| 1 Rust scope | Implemented and tested |
| 2 opaque handover | Rust-owned borrowing only; Node capability/External bridge blocked |
| 3 Inspect | Implemented; Windows snapshot support remains pending |
| 4 Refs | Pending handover; no mutation surface added |
| 5 non-event Remote | Pending handover; no mutation surface added |
| 6 census | Intake below; phase 07 must finish data-flow/runtime classification |

## Validation

Exact commands from this checkout (Cargo target selection remains caller-owned):

```sh
cargo build -p fgos
cargo build --release -p fgos -p fgctl -p fgos-node-addon
cargo test -p fgos-holder-lock -p fgos-git -p fgos-node-addon
cargo clippy -p fgos-holder-lock -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
cargo test -p fgos-holder-lock --test scope_rank
cargo test -p fgos-git --test inspect
p02_host="$(cargo metadata --no-deps --format-version=1 | python3 -c 'import json,sys; print(json.load(sys.stdin)["target_directory"] + "/release/fgos")')"
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN="$p02_host" node --test test/git/inspect.test.mjs test/git/native-load.test.mjs test/architecture.test.mjs test/holder-lock/*.test.mjs
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN="$p02_host" npm test
git diff --check
```

Rust suite and clippy pass (the addon Rust harness emits expected missing Node-API-symbol messages outside Node, then exits 0). New Rust tests: 5 scope + 3 Inspect pass; real Node Inspect, addon load and architecture tests pass. The broader Node run initially had 130 pass / 11 fail / 21 skip: four lacked release addon fixtures; after building those, the fence-specific rerun passed two and refused two activation cases because this PID namespace hides host processes. Six stop-check failures have the same host-view restriction; the legacy-v1 fence fixture also lacks its historical `yaml` package. Existing skips include Windows/network-filesystem vectors and unavailable nested bwrap. `npm test` stops before suite execution with EROFS opening `/home/vantt/.local/state/fgos/locks/full-suite.lock`; no gate was bypassed. Refs/Remote/handover test files do not exist because those operations are pending. Full host-side npm, Windows and the remaining mutation vectors are not proven.

MDView preview was attempted with `mdview open` and refused because its database is read-only in this sandbox.

## Phase-07 census intake

The scan covered `src`, `bin`, `scripts`, `packages`, `apps`, `.githooks`, canonical skills and generated shipped skills. The following 66 files have literal, multiline, injectable-exec, shell-string, borrowed or Rust-variable Git sites outside standalone test directories. Line lists identify spawn doors, including wrapper definitions whose argv comes from callers; they are not counts of Git effects. Inline Rust test sites are retained and classified, not mistaken for production. This intake is not the complete §12 data-flow/runtime proof: generic executors, all wrapper callers and dynamically assembled binaries must be resolved by phase 07's scanner and spy.

Reproduce the broad intake with:

```sh
rg -n 'child_process|runBorrowed|spawnWithLocks|Command::new|execSync|execFileFn|execFileSync|spawnSync' src bin scripts packages apps .githooks
rg -n '\bgit\b|gitArgs|gitBin|gitContext|gitAt|gitQuiet' src bin scripts packages apps .githooks
rg -n '\bgit (worktree|add|commit|push|fetch|merge|branch|checkout|reset|clean|update-ref|config|mv|rm|tag|rebase|cherry-pick|apply)\b' core/skills domains .agents/skills plugins/fgOS/skills .claude/skills --glob '*.md'
```

| Spawn file:lines | Family | Port / migration owner |
|---|---|---|
| `.githooks/pre-commit:46,210,227,237,257,258,263,285,297,326,327,364,372,382,395,411,447` | Hook read context | 05/07 hook context |
| `bin/fgos.mjs:169,1039,1624,1693,1795,3444,4226,4244` | Merge/worktree/ref/remote + readers | 02/03/05/06 ports; 07 migration |
| `packages/distribution/rust/src/lib.rs:187` | Rust Inspect readers (+ inline fixtures) | 07 Rust-readers |
| `packages/distribution/rust/src/workspace.rs:32` | Rust Inspect readers (+ inline fixtures) | 07 Rust-readers |
| `packages/git/rust/src/driver.rs:2062,2158` | Git driver/test fixtures | 01/02; 07 gate |
| `packages/git/rust/src/wal.rs:2129` | Git driver/test fixtures | 01/02; 07 gate |
| `packages/herdr-fgos-common/rust/src/fgos.rs:348` | Rust Inspect readers (+ inline fixtures) | 07 Rust-readers |
| `packages/holder-lock/rust/src/borrow_vectors.rs:78,415` | Production sandbox probe | 07 named probe class |
| `packages/holder-lock/rust/src/route.rs:502` | Holder listings (invert dependency) | 07 holder-listings |
| `packages/observe/rust/src/case_journal.rs:120` | Rust Inspect readers (+ inline fixtures) | 07 Rust-readers |
| `packages/observe/rust/src/metrics_cli/harness.rs:184` | Rust Inspect readers (+ inline fixtures) | 07 Rust-readers |
| `packages/observe/rust/src/sources/claude_transcripts.rs:74,380,381,386,392,397,404` | Rust Inspect readers (+ inline fixtures) | 07 Rust-readers |
| `packages/observe/rust/src/sources/repo.rs:20,39,53` | Rust Inspect readers (+ inline fixtures) | 07 Rust-readers |
| `scripts/event-store/v-spawn-bench.mjs:44,60` | Sandbox fixture/benchmark | 07 sandbox classification |
| `scripts/git/e3-bench.mjs:41,149,231,232,233` | Sandbox fixture/benchmark | 07 sandbox classification |
| `scripts/knowledge-canary.mjs:39,40` | Sandbox fixture/benchmark | 07 sandbox classification |
| `scripts/knowledge-migration.mjs:288,292` | Tracked move + stage | 05 ScopedCommit; 07 scripts |
| `scripts/measure-coordination-baseline.mjs:321,322,331` | Outer script Inspect | 07 scripts/readers |
| `scripts/measure-verify-cost.mjs:24` | Outer script Inspect | 07 scripts/readers |
| `scripts/prepare-release.mjs:142` | Outer script Inspect | 07 scripts/readers |
| `scripts/probe-storytelling-material.mjs:25` | Outer script Inspect | 07 scripts/readers |
| `scripts/regenerate-observe-fixtures.mjs:41,42` | Sandbox fixture/benchmark | 07 sandbox classification |
| `scripts/test-proof-inventory.mjs:290` | Outer script Inspect | 07 scripts/readers |
| `scripts/test-select-mutate.mjs:237,248,263,279` | Worktree via injectable exec | 03 Worktree; 07 scripts |
| `scripts/test-select-promote-report.mjs:113` | Outer script Inspect | 07 scripts/readers |
| `scripts/test-select.mjs:80,92,93,94,95` | Outer script Inspect | 07 scripts/readers |
| `scripts/test-timing.mjs:37,59` | Outer script Inspect | 07 scripts/readers |
| `scripts/verify-fanout-overlap.mjs:32` | Outer script Inspect | 07 scripts/readers |
| `src/cli/version.mjs:26` | Node Inspect readers | 07 readers |
| `src/holder-lock/fences.mjs:123,161` | Holder listings (invert dependency) | 07 holder-listings |
| `src/runner/attestation-guard.mjs:16` | Node Inspect readers | 07 readers |
| `src/runner/claim-liveness.mjs:14,66` | Node Inspect readers | 07 readers |
| `src/runner/dispatch/assignment-runner.mjs:1231` | Node Inspect readers | 07 readers |
| `src/runner/dispatch/cli.mjs:158` | Node Inspect readers | 07 readers |
| `src/runner/dispatch/settlement.mjs:141,163,183` | Node Inspect readers | 07 readers |
| `src/runner/dispatch/transport.mjs:137` | Node Inspect readers | 07 readers |
| `src/runner/dispatch/trust-store.mjs:158` | Node Inspect readers | 07 readers |
| `src/runner/execution/commit-unit-work.mjs:44,91` | Unit commit / snapshot / topology | 05 ports; 07 Unit |
| `src/runner/execution/partial-writes.mjs:42` | Unit commit / snapshot / topology | 05 ports; 07 Unit |
| `src/runner/execution/run.mjs:110,121` | Unit commit / snapshot / topology | 05 ports; 07 Unit |
| `src/runner/loop.mjs:234,292,874,875` | Merge/worktree/ref/remote + readers | 02/03/05/06 ports; 07 migration |
| `src/runner/main-fgos-checkpoint.mjs:17` | Injected checkpoint argv | ES event duty; 05/07 non-event |
| `src/runner/merge.mjs:94,1402,1511,1524,1530,1549,1564,1565,1637,1679,1681,1684,1687,1725,1733,1746,1756,1767` | Merge/worktree/ref/remote + readers | 02/03/05/06 ports; 07 migration |
| `src/runner/operation-choice.mjs:534` | Node Inspect readers | 07 readers |
| `src/runner/paths.mjs:32,44,77,226` | Node Inspect readers | 07 readers |
| `src/runner/promote-preflight.mjs:13` | Node Inspect readers | 07 readers |
| `src/runner/repo-locks.mjs:89` | Merge/worktree/ref/remote + readers | 02/03/05/06 ports; 07 migration |
| `src/runner/session.mjs:64` | Merge/worktree/ref/remote + readers | 02/03/05/06 ports; 07 migration |
| `src/runner/work-dispatch.mjs:217` | Node Inspect readers | 07 readers |
| `src/runner/worktree.mjs:156,168,225,327,332,341,418` | Merge/worktree/ref/remote + readers | 02/03/05/06 ports; 07 migration |
| `src/setup/git-hooks.mjs:18,41,107,121,146` | Hooks config | 06 RepositoryConfig; 07 setup |
| `src/setup/registrations.mjs:358,3490,4096,4226,6388,6413,6465` | Node Inspect readers | 07 readers |
| `src/state/cleanup-harness.mjs:79` | Node Inspect readers | 07 readers |
| `src/state/drift-status.mjs:34` | Node Inspect readers | 07 readers |
| `src/state/events-compaction.mjs:186,187` | Legacy event-file operations | ES cutover; 07 verify removal |
| `src/state/events-jsonl-truncation-guard.mjs:312,421,430` | Legacy event-file operations | ES cutover; 07 verify removal |
| `src/state/postland-drift.mjs:21` | Node Inspect readers | 07 readers |
| `src/state/store.mjs:619,629` | Node Inspect readers | 07 readers |
| `src/state/tool-registry.mjs:180` | Node Inspect readers | 07 readers |
| `src/verbs/merge/approve.mjs:481` | Merge/worktree/ref/remote + readers | 02/03/05/06 ports; 07 migration |
| `src/verbs/merge/sync-root.mjs:221` | Merge/worktree/ref/remote + readers | 02/03/05/06 ports; 07 migration |
| `src/verbs/state/edit.mjs:70,99` | Node Inspect readers | 07 readers |
| `src/verbs/state/move.mjs:7` | Node Inspect readers | 07 readers |
| `src/workflow/dir-guard.mjs:24` | Workflow Inspect / integrate writer | 07 Workflow (delete integrate) |
| `src/workflow/integrate.mjs:14,47` | Workflow Inspect / integrate writer | 07 Workflow (delete integrate) |
| `src/workflow/runner.mjs:307,316` | Workflow Inspect / integrate writer | 07 Workflow (delete integrate) |

Additional data-flow edges to carry into phase 07:

| Edge / surface | Family and owner |
|---|---|
| `src/holder-lock/{index,hold-transport}.mjs`, `packages/holder-lock/rust/src/{port,borrow_windows}.rs` | Generic command/argv primitives can run Git; retain the primitives below the Git driver, remove external Git callers (07 gate). |
| `src/runner/{promote-engine,claim-port,iron-law-gate}.mjs`, `src/verbs/merge/promote-to-component.mjs`, `src/runner/execution/unit-sync.mjs`, `src/runner/dispatch/stray-writes.mjs` | Delegated callers of merge/worktree/Inspect/snapshot wrappers; 07 Work/Unit/readers. |
| `src/runner/execution/commit-unit-work.mjs:430` | Direct repository-hook replay, despite a non-Git executable; 05 hook port / 07 Unit. |
| `src/runner/github-adapter.mjs` | `gh` remote merge: consumer-authorized GitHub transport, 07 Work merge; never a local Land bypass. |
| `scripts/{run-tests,test-timing,test-select-coverage-map,test-select-mutate}.mjs` | Generic test/process wrappers plus injected executors; follow resolved argv and include their callers, 07 gate/scripts. |
| `scripts/{ci-external-consumer,fgos-shell-integration}.sh` | Raw shell Git at 144-146 (sandbox init/config), 60/132 (bootstrap topology reads); 07 sandbox/bootstrap classification. |
| `scripts/install-git-hooks.mjs` | Delegates to setup hooks config; 06 port / 07 setup. |
| `packages/git/rust/src/driver.rs` | Canonical hardened containment/borrow spawn; 01/02 driver, 07 sole accepted product door. |
| `packages/git/rust/tests/**`, `packages/holder-lock/rust/tests/**`, `apps/fgos/tests/**`, `apps/fgctl/tests/**`, inline `cfg(test)` modules | Real fixture/proof Git; 07 named sandbox class, no product exception. |
| `core/skills/fgos-run/SKILL.md:25` | Positive raw worktree-add guidance; 03 typed worktree door / 07 skill migration. |
| `domains/coding/skills/fgos-coding-{implement/references/verify-commit-and-iron-law.md,knowledge/SKILL.md}` | Positive add/commit instructions; 07 ScopedCommit/skill migration. |
| `domains/coding/skills/_shared/coding-cell-policy.md:87-88` | Positive merge/worktree-remove sequence; 07 skill migration. |
| `domains/coding/skills/fgos-coding-planning/references/bootstrap-and-lane.md:32` | Historical `git mv` reference, not an execution instruction; 07 classify separately. |
| `core/skills/_shared/{private-cell-worktree,catchup-self-recovery,executor-dispatch-fallback}.md`, coding AGENTS/worktree-safety, plugin deliver/pick/approve | Read guidance, diagnostics, prohibitions or descriptions; 07 preserve prohibitions and remove positive write guidance. |
| `.agents/skills/**`, `plugins/fgOS/skills/**`, `.claude/skills/**` | Generated mirrors of the above: regenerate from canonical sources; 07, never hand edit. |

Needs writes: `src/holder-lock/index.mjs` for the required private-map handover seam; `plans/261017-1313-fgos-platform-program-board/plan.md` for the mandated lane update. The requested report path is retained verbatim; convention generation was queried and returned the same slug with the current minute (0708).

Status: BLOCKED
Summary: Rust scope and dormant Inspect are implemented and tested; the Node private-map handover requires an excluded file, leaving Refs/Remote and full phase proofs pending.
Concerns/Blockers: authorize the holder-lock facade seam; rerun host-only validation and finish phase 02 before review/merge.
Context refs:
- plans/261018-0914-git-component-fgos-git/phase-02-lockscope-inspect-refs-remote.md
- docs/platform/git/spec.md §2/3/5/7/10
- docs/platform/holder-lock/spec.md §5/9/19
