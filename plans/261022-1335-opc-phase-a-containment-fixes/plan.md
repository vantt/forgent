---
title: "OPC Phase A: containment fixes inside today's shape"
description: "Remove the 2 ms poll, bound the post-kill wait, name the mount refusal, watch pgroup escapees of contained children, and one conformance suite for every containment driver."
status: in-progress
priority: P2
effort: 2d
branch: opc/phase-a
tags: [process, git, containment, conformance]
blockedBy: []
blocks: []
created: 2026-10-22
---

# OPC Phase A: containment fixes inside today's shape

**Tóm tắt cho owner.** Plan thi công năm việc của Phase A mà anh đã duyệt (10-22 13:40):
- bỏ vòng poll 2 ms;
- chặn chỗ treo sau `kill_all`;
- đặt tên lỗi `containment-mount-refused` và cho doctor nói lý do chọn driver;
- vá lỗ E4 trên `linux-pgroup` bằng cơ chế đánh dấu môi trường sẵn có;
- gom một bộ conformance chung cho mọi driver.

Không thêm cơ chế mới. Ước tính khoảng 200 dòng src, test không tăng dòng, 2 ngày. Phase 00 đo nền (gồm thời gian chạy suite, theo câu hỏi của anh về tốc độ test); phase 05 đo lại sau. HARDEN duyệt diff phần Git, TEST duyệt bộ conformance. Plan này chờ anh duyệt trước khi code.

## Source of truth

- [Arbitration](../reports/council-261022-1251-opc-arbitration.md) §3 (A1–A5), §5 deletion list, §6 proofs, §7 coordination, §8 owner answers.
- Seat reports alongside it.
- Phase B (native operation domain) is **out of scope**: it is deferred to the §4 trigger.
- Reads keep kernel containment (owner Q3 a).

## Outcome and acceptance

| # | Criterion | Proof |
|---|---|---|
| AC1 | No contained Git child waits in a fixed sleep. The per-child overhead drops by about 1.4 ms (speed seat). | phase 05 micro row, interleaved against the phase 00 baseline |
| AC2 | A refused `kill_all` after a deadline or output limit returns `containment-unproven` within a bound and never hangs. | phase 01 driver test (a member stopped with SIGSTOP) |
| AC3 | A refused bwrap mount surfaces as `namespace-unavailable: containment-mount-refused: <bwrap line>`, and doctor `process-containment` names the driver and why it was chosen. | phase 02 tests |
| AC4 | On `linux-pgroup`, a contained read that ran user code never reports plain success while a marked `setsid` escapee survives. | phase 03 crate test in `packages/git/rust`, using an injected `LinuxPgroup` driver |
| AC5 | One conformance body per behaviour, instantiated for `bwrap-pidns`, `linux-pgroup`, `macos-tree` and `windows-job`; net test lines ≤ 0; CI runs it on changes to `packages/process/**`. | phase 04; TEST review |
| AC6 | E1 still held, E4 held on both Linux drivers, E3 rows within budget, `npm test` and `cargo test --workspace` green. Suite wall time and contained-git census are recorded before and after. | phase 00 and phase 05 |

## Phases

| # | Phase | Depends on | Reviewer | Status |
|---|---|---|---|---|
| 00 | [Baseline measurements](phase-00-baseline-measurements.md) | — | — | pending |
| 01 | [Contained branch: exit wake and bounded kill wait (A1, A2)](phase-01-contained-branch-wake-and-bounded-wait.md) | 00 | HARDEN (`forgent-a8`) | pending |
| 02 | [Mount refusal name and driver-choice reason (A3)](phase-02-mount-refusal-and-driver-reason.md) | HARDEN T1 phase 4 on main | HARDEN | pending |
| 03 | [pgroup escapee watch for contained children (A4)](phase-03-pgroup-escapee-watch.md) | 01 | HARDEN | pending |
| 04 | [One containment conformance suite (A5)](phase-04-containment-conformance-suite.md) | 01, 02 | TEST (`forgent-f8`) | pending |
| 05 | [Proofs, docs and landing](phase-05-proofs-docs-landing.md) | 01–04 | HARDEN + TEST | pending |

Phases 01 and 03 both edit the contained branch of `packages/git/rust/src/driver.rs`, so they run in sequence. Phase 02 waits for HARDEN T1 phase 4, which lands the stderr capture in `containment/linux.rs`; if that is late, phases 03 and 04 go first.

## Frame (approved scope and budget)

- **Files that may change:**
  - `packages/process/rust/src/containment/{mod,linux,pgroup}.rs`;
  - the contained branch of `packages/git/rust/src/driver.rs` (≈ :1165-1245) and its `user_code_may_run`;
  - the host route that reports `containment` to doctor;
  - `src/setup/run-supervisor-checks.mjs` (`checkProcessContainment`);
  - `packages/process/rust/tests/*containment*`, `spawn_fds_leak.rs`;
  - crate tests in `packages/git/rust`;
  - `.github/workflows/process-containment.yml`;
  - `packages/process/contracts/containment.port.v1.json` (error causes only, no new operation);
  - `docs/platform/process/spec.md` §10, `docs/platform/git/spec.md` §15 E4;
  - `CHANGELOG.md`.
- **Budget:** about 200 src lines added (net), net test lines ≤ 0, docs ≤ 60 lines, 2 days. Leaving the frame is a decision question to the owner.
- **Not in scope:**
  - an anchor or any new port operation (Phase B);
  - a config key;
  - a lazy probe;
  - moving reads off the pid namespace;
  - Git's submodule-aware `check_config`, beyond what A4 needs (a separate GIT item);
  - leaked `cat-file --batch` readers (a separate GIT item).

## Coordination

- HARDEN T1 phase 4 owns the stderr-capture edit in `containment/linux.rs` (`spawn_in`/`end_failed_spawn`). OPC phase 02 builds on it and never edits those lines in parallel.
- HARDEN reviews every diff to `packages/git/**`, with its full suite run and an R2 re-measure (accepted 10-22).
- TEST reviews phase 04 before it lands. Quiet windows are asked from TEST and HARDEN for phases 00 and 05.
- Land per phase on main from the linked worktree. Update the OPC board row and log the same turn.

## Rollback

Every phase is a code revert. There is no persisted state, no record format change and no config key.
