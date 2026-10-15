# Báo cáo triển khai 5.1: resolver writer identity sang crate Rust

- Ngày: 2026-10-15. Worktree `.claude/worktrees/agent-ac970642d8c2e90a0`, nhánh `worktree-agent-ac970642d8c2e90a0`, đã rebase lên main `2d8ad918c` (đã có W1' beacon). Chưa merge, chưa push, chưa activate.
- Plan: [plan.md](../plan.md). Phản biện: [trong phiên](review-in-process-261015-2140-identity-resolver-plan.md), [Astra vòng 1](red-team-astra-r1-261015-2210-identity-resolver-plan.md), [Astra vòng 2](red-team-astra-r2-261015-2300-identity-resolver-plan.md).

## Đã làm

| Phase | Kết quả | Commit |
|---|---|---|
| 00 | Thiết kế + 3 lượt phản biện (11 + 7 + 3 phát hiện, nhận hết, không bác điểm nào) | `bf90f71d4`, `3e0981d60`, `975e77670`, `a3e3ae387` |
| 01 | Crate `packages/session-identity/rust` (luật, cổng `ProcessTree`, driver `/proc`/`getsid`/Windows), contract + 20 vector env + 14 vector cây, route native `identity`, catalog, projector | `6564f3ccf` |
| 02 | Observe dùng crate: xoá `resolve_writer_id`, `friction.rs` không tự đọc env | `44786ade0` |
| 03 | Facade Node (`src/util/session-identity.mjs`), module lá `src/util/host-bin-path.mjs` (`resolveWorkspaceInstallationBin` gọi lại nó), prime trước lock + bộ đếm lock + `identity-in-lock`, hook, caller phụ, lane CI Windows | `283e8ea3f` |
| 04 | Doctor `writer-identity-resolvable`, spec `docs/platform/session-identity/spec.md`, io-contract, component-boundary, reading-map, observe, distribution, node-to-rust, AGENTS.md, CHANGELOG | `37ebb0699` |
| — | Drift guard (manifest, envelope vector, danh sách doctor), fixture hook beacon | `c2429d035`, `884b3b142` |

Tiêu chí 1 (không còn `resolve_writer_id|walkAncestors|procPpidOf|MAX_HOPS`): đạt.

## Test

- `cargo test -p fgos-session-identity -p fgos-observe -p fgos -p fgos-host-runtime` (env đã bỏ ba biến session): 37 suite, **211 pass, 0 fail**. Một lần trước rebase `external_process_tests::test_supervisor_cancellation_path` đỏ, chạy lại xanh (flake có sẵn, không liên quan).
- Node, `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<debug host của nhánh>`: `test/{state,util,runner,cli,e2e,setup,rust-host,scripts,convention}` = **6686 test, 6591 pass, 9 fail, 11 skip**. 8 fail ở `main-checkout-activity-beacon` (fixture chưa copy module lá) đã sửa → 40/40 xanh; 1 fail `herdr-reconciliation` #20 (live herdr) chạy riêng xanh (flake đã biết). Không chạy full `npm test` (Lead làm ở phase 06).
- Bằng chứng hành vi: test đa process có wrapper đọc owner của lock; bỏ prime ở `settleClaim`/`claimWork` thì test đỏ với `identity-in-lock` (đã thử đột biến rồi trả lại).
- `check-decision-codes`: 375 phát hiện, giống hệt main (không phải hồi quy).

## Cổng S6 (lời gọi thật, binary release của nhánh)

Repo nháp chạy đúng `.githooks/pre-commit` "at home": base = hook + src của main, branch = của nhánh, branch tìm binary qua `activation.json`. Xen kẽ, warm N=60, cold N=30 (đẩy page cache binary trước mỗi lần). Máy đang tải 3,7–9 (agent khác chạy).

| | base min/med/p95 | branch min/med/p95 | Thêm |
|---|---|---|---|
| agent env, warm | 41.11 / 52.58 / 63.00 | 44.82 / 55.49 / 65.17 | p95 **+2.17**, med +2.91 |
| agent env, cold | 42.23 / 45.69 / 53.37 | 47.69 / 52.34 / 64.07 | med **+6.65**, p95 +10.69 |
| shell trần, warm | 41.69 / 44.42 / 49.31 | 45.14 / 47.72 / 52.95 | p95 **+3.64**, med +3.29 |
| shell trần, cold | 43.08 / 46.63 / 70.87 | 48.03 / 53.73 / 78.82 | med **+7.10**, p95 +7.95 |

Lần đo trước (N=40) cho warm p95 +5.05 / +2.07 và cold med +9.02 / +8.50. Riêng exec `fgos identity`: warm 1.48–1.77 ms median, cold 5.08 ms median (placebo không đẩy cache 1.92 ms).

Kết luận: **warm đạt** (≤5 ms p95). **Cold chưa đạt chắc chắn**: thêm 6.6–9 ms median so với ngưỡng ≤6 ms, đo trên máy đang tải; riêng exec lạnh đã ~5 ms (page-in binary 3.5 MB), phần còn lại là import + tìm binary. Lead cần đo lại trên máy rảnh trước khi land (harness: `scratchpad/51/gate/prepare.sh`, `bench.mjs`, `exec-cold.mjs`). Nếu vẫn vượt: đây là chi phí cố hữu của O1 (exec binary riêng) ở lần đầu sau khi cache bị đẩy, chỉ xảy ra một lần; cần anh quyết nới ngưỡng cold hay giảm kích thước binary (việc riêng).

## Lead tự quyết thêm khi làm

- Lỗi tham số `fgos identity` thoát mã 1 như mọi lỗi projector native khác (plan ghi 4); không có envelope.
- Năm chỗ `clearBeaconIfOwn(dir, resolveWriterIdentity(dir).id)` trong `bin/fgos.mjs` không bọc try/catch: ngay trước đó `moveWork` đã resolve cùng dir nên luôn trúng cache; thêm nhánh lỗi là code chết.
- `appendEvent` trong `loop.mjs` truyền `dir` (trước đây registry bị dò ở `.fgos/events/`).
- Test `writer_identifier_cannot_escape_store` của Observe đổi theo luật mới: id dạng traversal bị luật identity loại, writer rơi về shard `pid-*` trong store; `.`/`..` vẫn bị Observe từ chối.
- Boundary test của Observe cho phép thêm đúng `fgos-session-identity` (nền, nằm dưới Observe).

## Điểm gặp W1'

W1' đã land trên main trước khi em rebase. Hook mới không còn `resolveIdentity`; em đặt try/catch quanh `resolveWriterIdentity` ở chỗ ghi beacon (`.githooks/pre-commit` khoảng dòng 520). Ba fixture hook e2e copy thêm `src/util/host-bin-path.mjs`.

## Việc của Lead (phase 06)

Theo [runbook](../phase-06-landing-drain-activation.md): full `npm test` với `FGOS_HOST_BIN` trỏ host build từ checkout tích hợp; đo lại cổng S6 cold trên máy rảnh; quiesce; drain **mọi** claim mở bằng bản cũ (hôm nay có 12, 3 của `"2548"`); merge; activate ngay; restart process sống lâu; doctor.

## Ngoài phạm vi, ghi lại (RUL11)

- `scripts/fgos-shell-integration.sh` và `packages/herdr-fgos-common/rust/src/fgos.rs` vẫn có bản riêng của luật tìm binary (theo shim ở `.fgos/installation/bin/fgos`).
- `packages/observe/rust/src/store_lock.rs` và crate identity là hai bộ đọc `/proc`; gom vào process-facts (4.2).
- `getMainFgosDir` và `git rev-parse HEAD` vẫn exec git bên trong `events.lock` (B6, thuộc 4.3).
