---
phase: 8
title: "Branch docs, full gates, hand-off"
status: done
priority: P2
effort: "3h"
dependencies: [7]
---

# Phase 8: Branch docs, full gates, hand-off

## Goal

Leave V1 provable by a stranger on the branch: the spec and the two indexes say where the crate is and what V1 decided, every repository gate is green on top of a fresh main, the branch is pushed, and the controller has a short report. Nothing merges to main.

## Steps

1. **Sync** (plan.md § "Branch sync rule").
2. **Docs on the branch only** (L5 question 6; settled facts go into the area spec):
   - `docs/platform/agent-mailbox/spec.md`: header `Implementation status:` → "V1 (`fgos-mailbox-core`) built on branch `mailbox/v1-v3`, not on main; V2-V7 not started"; header `Source (planned)` keeps the store path planned and names the core as existing on the branch. §5.5: record the chosen escape (plan decision 8) in one paragraph, and correct the reply-command example to the §6.1 verb shape (`send --to <name> --reply-to <id> <body>`, decision 15). §5.3/§12: add the three Q1 keys with "provisional, owner question open", the order of refusal checks (decision 4), the shared `unregistered` sender (decision 12) and the lifetime-cap exemption pending Q3. §16: add owner questions Q1-Q3 as open items. §17: one row "V1 implementation decisions (agent, inside the signed frame): decisions 1-16 of `plans/261021-2255-mailbox-v1-core-crate/plan.md`", by "planning lead (agent)", status "applied on branch; numbers stay unsigned; Q1-Q3 open". Never attribute an agent decision to the owner.
   - `docs/specs/reading-map.md` line 54: replace "chưa có mã … source (dự kiến): `packages/mailbox`" with the core's path and crate name, marked "nhánh `mailbox/v1-v3`, chưa vào main".
   - `docs/platform/component-boundary.md` line 88: "implementation not started" → "V1 core built on branch `mailbox/v1-v3`".
   - Do not touch `CHANGELOG.md`: V1 is not user visible; spec §12 and §14 put the line at V7.
   - Do not add a doctor check: spec §12 and the owner decision of 2026-10-19 put it at V7. Do not add the config-merge registration either; that is this plan's own choice (decision 1: V1 has no runtime reader), and the rung that first reads configuration at runtime (V5) registers `limits.v1.json` through `registerConfigDefault`. Say so in the spec without citing the 2026-10-19 decision for it.
3. **Census**: `node scripts/git-one-door-scan.mjs --write-census` (the spec and index edits do not change hashed product files, but run it to be sure the census matches the branch).
4. **Full gates** (inside `/home/vantt/projects/forgent-mailbox`; run the branch sync again immediately before them, and rerun all of them if the merge brought changes):

   ```bash
   cargo fmt --all -- --check
   cargo clippy --locked --workspace --all-targets -- -D warnings
   cargo test --locked --workspace
   npm test
   cargo tree -p fgos-mailbox-core -e normal --depth 1
   ```

   Compare with phase 1's baseline. A failure that also fails on main is reported with its exact command and output and left alone; a failure that main does not have is fixed on the branch before this phase counts as done.
5. **Review**: run a code review of `git diff origin/main...mailbox/v1-v3 -- packages/mailbox Cargo.toml` (the installed `code-reviewer` agent or `ak:code-review`), focused on: purity (and the lint described as narrowing, not enforcing, rule 3), every number from the contract, every `MailboxState` field covered by `tests/snapshot.rs`, every per-sender map bounded by bindings plus one, one owning test per behaviour, no test-only branch. Apply accepted findings on the branch.
6. **Final sync, commit and push the branch**: branch sync once more; if it brought changes, rerun step 4; one commit `docs(mailbox): record the V1 core on its branch`; `git push -u origin mailbox/v1-v3` (the branch is shared across leads; never push or merge it into main).
7. **Hand-off report** to the controller (path from `fgos convention path --kind report --type closing --slug mailbox-v1-core-crate --json`): commits, test counts per file, gate results against the baseline, the open owner question Q1, and the next rung (V3 on the same branch; V2 once the lock row exists). The controller updates board row `MAIL` on main.

## Acceptance criteria

- `cargo test -p fgos-mailbox-core --locked` green on top of a main merged within this phase; all gates of step 4 green or failing identically on main.
- `git log origin/main..mailbox/v1-v3` shows only mailbox commits and merges from main; `git log origin/mailbox/v1-v3..origin/main` is empty right after the final sync; main has no commit from this plan except the plan files.
- The spec, reading map and component boundary on the branch name the crate and its status.

## Risks

- Merge conflicts on `Cargo.toml`, `Cargo.lock` and the mutation census at each sync: resolve on the branch, regenerate the census and the lock, rerun the proof.
- A gate red on main for reasons outside the mailbox: reported, not fixed here (RUL11: separate item).

## Implementation notes (2026-10-22)

- Docs on the branch: spec header (implementation status, source, last reviewed), §5.1.1 (exact key before key prefix; the `unregistered_…` label; writer-key bound), §5.3 (order of checks 0-10, the shared `unregistered` sender, lifetime caps for heads only, two-tier counters), §5.5 (corrected reply command; the chosen escape), §6.4 (`last_drain_at` and `schema_version` rules; a V5 note that `resolve_workspace_root` exists, leaving the old sentence for V5 to correct as the plan says), §12 (the three Q1 keys, the limits contract, config-merge registration at V5), §17 (owner decisions Q1-Q3 of 2026-10-21; V1 implementation decisions by the planning lead (agent); the review fixes by the controller as plan owner (agent)). `docs/specs/reading-map.md` and `docs/platform/component-boundary.md` name the crate on this branch. No CHANGELOG line, no doctor check (V7).
- Deviations:
  - **Formatting gate scoped to the crate** (controller decision, 2026-10-21): the gate is `cargo fmt -p fgos-mailbox-core -- --check`, not `cargo fmt --all -- --check`. Main already fails the workspace check in 175 files outside `packages/mailbox` (phase 1 baseline); they belong to other lanes and are tracked as item `tsk-hls`.
  - Owner questions Q1-Q3 were answered before this phase, so they go to §17 as owner decisions, not to §16 as open items.
  - The code-review step (step 5) is left to the controller, which runs an independent final review of the whole crate.
- Gates (run twice: on main `57cb8ca68`, then again after the final merge of main `9670da5ff`, same results):
  - crate: fmt clean, clippy clean, `cargo test -p fgos-mailbox-core --locked` 78 passed, 0 failed; `cargo tree` shows serde only.
  - `cargo clippy --locked --workspace --all-targets -- -D warnings`: exit 0.
  - `cargo test --workspace --locked`: exit 0; 1321 passed, 0 failed, 11 ignored.
  - `npm test`: exit 1; 8709 tests, 8595 passed, 18 failed, 31 skipped, 65 todo; plus two suite-level errors (a leaked `fgos-direct-repo-*` temp dir from `test/run-supervisor/support/direct-harness.mjs`, and `.fgos/runtime/git-addon/<id>/manifest.json` modified).
    - 17 failures (`test/rust-host/fgctl-upgrade.test.mjs` 15, `test/rust-host/fgctl-init-download-sources.test.mjs` 2) also fail on main: the same files run in the main checkout at `180ed62fd` failed 23 of 48, a superset of the branch's 17.
    - The 18th, `test/scripts/run-test-canary.test.mjs` "wrapper overhead … median under 250ms", is a timing bound (265 ms measured under the full suite's load); it passes on the branch when run alone.
    - The two suite-level leaks come from run-supervisor and git-addon tests; the branch changes no Node, JavaScript or test file outside the Rust crate, so they are not caused by it. They were not reproduced on main (that needs a full suite run in the owner's main checkout).
- Final gate run, after the last merge of main `30053b8a3` (merge `4772a01f6`; `Cargo.toml` kept both new members, `packages/mailbox/rust/core` and `packages/seat-binding/rust`; `Cargo.lock` and the census regenerated):
  - crate: fmt clean, clippy clean, 78 passed, 0 failed; `cargo tree` serde only. Workspace clippy exit 0.
  - `cargo test --workspace --locked`: exit 0; 1335 passed, 0 failed, 11 ignored.
  - `npm test`: exit 1; 8848 tests, 8731 passed, 21 failed, 31 skipped, 65 todo; one suite-level error (a leaked `fgos-direct-repo-*` temp dir).
    - 19 failures also fail on main `30053b8a3` (a detached scratch worktree at that commit, outside the repository, removed afterwards): the 17 fgctl ones, `test/runner/assignment-dispatch.test.mjs` "decideExecutorCli resolves dispatch plan for an assignment" and `test/runner/dispatch.test.mjs` "codex's cli-bypass invocation …"; main fails 114 of 424 in those six files.
    - Two fail only under the full suite's load and pass alone on the branch and on main: the canary "wrapper overhead … under 250ms" (265 ms measured) and `test/seat-binding/route-doctor-check.test.mjs` "the row fails on a host that has no seat-binding route" (`spawnSync … EPIPE` from its fake host).
    - The branch changes no Node, JavaScript or test file; none of these failures is caused by it.
