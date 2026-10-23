---
phase: 1
title: "Sync, V4 fixes re-check, preconditions, shared-file announcement"
status: pending
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Sync, V4 fixes re-check, preconditions, shared-file announcement

## Goal

Start V5 from a branch that holds the closed V4 fixes. Fix the base commits, the CLI versions and the shared-file picture, and hand the controller the exact board announcement.

## Context

- A V4 fix step runs on `mailbox/v1-v3` before this phase. It is meant to close review findings H1, H2, M1, M2, M5 and M6 (`../261022-1501-mailbox-v4-claude-live-end-to-end/reports/code-review-v4.md`).
- V5 builds on those fixes and must not re-implement them. If one is missing, this phase stops (see the steps).

## Steps

1. Sync.

   ```bash
   cd /home/vantt/projects/forgent-mailbox || exit 1
   git status --short
   ```

   A dirty tree means another session is working here: stop and report. Then:

   ```bash
   git fetch origin && git merge --no-edit origin/main
   ```

   Record the V5 base commit (`git rev-parse HEAD`) and `origin/main` in this file's notes.
2. Memory: `free -g | awk '/Mem:/{print $7}'` must be ≥ 8. Then run the baseline and check that it is green:

   ```bash
   CARGO_BUILD_JOBS=4 timeout 1800 cargo test --locked -p fgos-mailbox -p fgos-mailbox-core -p fgos -- --test-threads=4 2>&1 | tee .fgos/runtime/tmp/mailbox-v5/p1-baseline.log
   echo "exit=$?"
   ```

3. **Re-check the V4 fixes on the branch.** Each needs the fix in code and a test that kills the review's mutation. Run the named test and note its file and title:
   - **H1:** the test-only entry's `hook` verb exits 0 with empty stdout on a usage error, with a case in `tests/test_hook_entry.rs`. V5's product entry inherits the rule (phase 6).
   - **H2:** the isolation comment in `scripts/lib/mailbox-live-cli.mjs` no longer claims that writes are prevented.
   - **M1:** `write_started` is a three-state flag set with `compare_exchange`, and a `hook_shell.rs` test observes `Writing` on the first `write` (it kills mutation M1).
   - **M2:** the live harness calls `setAsideReplacedAuth` after a Codex run and refuses to lay out a case while `setAsideAuthFiles` is non-empty.
   - **M5:** `resolveBlindHiddenRoots` creates the mailbox root only on the launch path, and the ref checks pass `{ create: false }` or survive `EACCES`/`ENOTDIR`.
   - **M6:** either a bounded-prefix payload read, or a measured largest payload plus a quiet reason that `last_drain_at`/`status` can see.

   **If any one is missing, stop and report BLOCKED with the list.** Do not fix it inside V5; the V4 fix step owns it.
4. **Prerequisites.**
   - `grep -rn "is_attempt_writer_id" packages/identity/rust/src` is expected to find nothing; phase 4 adds the function.
   - `grep -n "fn resolve_topology" packages/git/rust/src/driver.rs` must find the disk-only topology read (expected `pub(crate)`, around line 418). Phase 6 exposes it as `fgos_git::main_checkout_root` (plan decision 3).
   - Check whether the Config component's crate (CFG lane) is on `origin/main` (`ls packages/config* 2>/dev/null; git log origin/main --oneline -- 'packages/config*' | head`). Record the answer: phase 4's loader uses it if it exists (plan decision 4).
   - `grep -n "native_kinds" packages/host-runtime/contracts/*.json` is expected to find nothing.
   - Record each result.
5. **CLI versions.** Read the installed versions without a model: `claude --version`, `command codex --version` (bypassing the owner's zsh function: `~/.local/bin/codex --version`), `~/.local/bin/agy --version`.
   - Compare with `packages/mailbox/contracts/adapters.v1.json` `testedAgainst`. On 2026-10-23 these were Claude Code 2.1.308, Codex 0.161.0 and agy 1.4.4, all already listed.
   - If a version is not listed, phase 2's probes also re-record that CLI through the recorder, as V4 phase 2 did. Add the extra invocations to the live count and tell the controller before any run.
6. **Shared files: who else touches them now.** For each file below, run:

   ```bash
   git log --since=2026-10-21 --format='%h %ad %s' --date=format:%m-%d.%H:%M origin/main -- <file>
   ```

   Then read the board rows `IDENT`, `HARDEN`, `DOC`, `TEST`, `CFG`, `COOK`, `GIT` (`/home/vantt/projects/forgent/plans/261017-1313-fgos-platform-program-board/plan.md`, sections "Các luồng" and "File chung dễ va"). Record per file which lane last changed it and whether that lane is still running. Expected on 2026-10-23: IDENT and HARDEN T1 changed `main.rs`, `command-routes.json`, `command-registry.mjs`, `registrations.mjs` and `packages/identity` on 10-22.
7. **Hand the board announcement to the controller.** Phase 1 never edits the board; the text is in the next section. Write it verbatim into this file's notes and into the phase report message.
8. End: commit nothing unless the merge produced a commit; push the branch.

## Board announcement (the controller posts it; Vietnamese, as the board is)

> **MAIL V5 bắt đầu** (lead triển khai: ak-cook, nhánh `mailbox/v1-v3`, worktree `/home/vantt/projects/forgent-mailbox`; plan `plans/261023-0013-mailbox-v5-native-hook-door/`). Chỉ sửa trên nhánh, **không merge main ở V5**, merge `origin/main` vào nhánh đầu và cuối mỗi phase. File chung V5 sẽ sửa:
> - `apps/fgos/src/main.rs` (nhánh native cho kind `hook mailbox`, khai bằng `native_kinds` trong bảng route; thêm dòng `mailbox` vào `NATIVE_SUBCOMMANDS`), `apps/fgos/src/cli_presenter.rs`, `apps/fgos/src/cli_projector.rs`, test `test/cli/{subcommand-flag-drift,fgos-manifest,unknown-flag-rejection}.test.mjs` và test đếm catalog trong `packages/host-runtime`, `apps/fgos/src/wiring/mod.rs` (+ file mới `wiring/mailbox_hook.rs`, `wiring/mailbox_verbs.rs`), `apps/fgos/Cargo.toml`, `Cargo.lock`;
> - `packages/host-runtime/contracts/command-route-annotations.json` và `command-routes.json` (sinh lại; trường mới `native_kinds` cho selector `hook`; selector mới `mailbox`), `packages/host-runtime/rust/src/catalog.rs` (ba operation `mailbox.*`), `scripts/export-command-selectors.mjs`, `test/rust-host/command-routes.test.mjs`, `docs/platform/host-invocation-routing/spec.md` và `contracts/command-route-descriptor.md`;
> - `src/cli/command-registry.mjs` (verb `mailbox`, kind `mailbox` của `hook`), `bin/fgos.mjs` (`handleHook`: kind `mailbox` im lặng, thoát 0);
> - `src/setup/agent-hooks.mjs` (bốn hàm cài gộp thành một bảng, thêm dòng mailbox cho Claude Code và Codex), `src/setup/registrations.mjs` (`registerConfigDefault` cho `mailbox`), test `test/setup/agent-hooks.test.mjs`, `claude-code-hooks.test.mjs`, `registrations.test.mjs`;
> - `packages/identity/rust/src/{attempt.rs,lib.rs,session.rs}` + file mới `cli_dirs.rs` (`is_attempt_writer_id`, `claude_config_dir`), `packages/observe/rust/src/sources/claude_transcripts.rs` (dùng chung `claude_config_dir`, xoá bản riêng);
> - `packages/git/rust/src/{driver.rs,lib.rs}` và một dòng trong `docs/platform/git/spec.md` (mở hàm đọc đĩa `main_checkout_root` tách từ `resolve_topology`, không subprocess, không ghi; **GIT/HARDEN duyệt diff Git theo luật owner ở dòng OPC**);
> - `docs/routing-handoff-contract.md` (một đoạn trỏ sang spec mailbox, lớp `peer`; spec §13 đã hứa), `docs/platform/agent-mailbox/spec.md`;
> - `packages/git/contracts/mutation-census.v1.json` (sinh lại), `test/suite-baseline.json` (chỉ nếu bộ kiểm trùng đòi), `test/cli/dispatch-retired-doors.test.mjs` (một ca cho `hook mailbox` qua legacy).
>
> **Không** đụng `CHANGELOG.md` (để V7). Luồng đang chạm cùng file: IDENT (identity, command-routes, command-registry, registrations, main.rs), HARDEN T1 (main.rs, registrations), DOC (main.rs, `docs/platform/*/spec.md`), TEST (suite-baseline), CFG (`packages/observe`, đọc `config.json` bằng Rust), COOK (`bin/fgos.mjs`), GIT/HARDEN (`packages/git`: hàm `main_checkout_root`). **Báo CFG:** MAIL V5 thêm một bộ đọc Rust mục `mailbox` của `.fgos/config.json` (`packages/mailbox/rust/store/src/limits.rs`) và `registerConfigDefault('mailbox')`; khi CFG chuyển bộ đọc Rust sang crate Config thì bộ đọc này đi cùng (bên land sau làm). Theo luật owner: bên land sau soát thay đổi của bên kia; MAIL không land ở V5 nên MAIL là bên sau và tự soát mỗi lần merge.

## Verification

- The baseline log ends with `exit=0`.
- The V4 fix checklist: six lines, each naming a file and a test title.
- The notes record the versions and the shared-file table.

## Risks

- The V4 fix step is still running when this phase starts. In that case, wait; do not merge partial work.
- A main merge brings an identity, route or registry change from IDENT or HARDEN. Keep both intents; regenerate the routes and the census; do not hand-merge `command-routes.json`.

## Notes (filled during the phase)

_Base commit, origin/main, V4 fix checklist, versions, shared-file table._
