---
title: "4.4a Rust callers lên holder-lock: fgctl, install.lock, observe"
description: "Chuyển activation lock, phép kiểm main checkout của fgctl, install.lock và observe store lock sang crate fgos-holder-lock của 4.2; xoá đường v1 cùng phase; nằm trên đường găng trước cutover main checkout của 4.3"
status: pending
priority: P1
effort: 16h
branch: worktree-agent-ae86665b911b82fc1
tags: [holder-lock, kernel-lock, rust, fgctl, observe, cutover]
created: 2026-10-16
---

# Plan 4.4a: Rust callers lên holder-lock

- **Thực hiện thiết kế r6**: [design-261016-1238-...-v3-r6.md](../reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md) §11 entry 4.4 (phần Rust callers), §6.0 cổng lock, §6.0.1 luật miền của holder trước, §6.1.1 luật description, §6.2 bảng kind (activation, install, observe là `mutex` hạng 80), §6.8 bảng hình dạng (dòng "Rust `fgctl` đọc `main-checkout.lock`"), §6.9 state root. Phản biện: kongming vòng 1 K4 và Argon R3-11 (thứ tự: `fgctl` mới phải activate trước khi 4.3 đặt tombstone `main-checkout.lock`), [kongming vòng 3](../reports/red-team-kongming-261016-1018-lock-and-run-supervisor-foundation-v3-r3-review.md) §3 K4.
- **Xây trên plan 4.2** [plans/261016-1104-holder-lock-kernel-lock-foundation/](../261016-1104-holder-lock-kernel-lock-foundation/plan.md): dùng nguyên crate `fgos-holder-lock` (cổng, driver `flock`, luật 6.0.1, `state_root`/`lock_root`), registry `packages/holder-lock/contracts/lock-registry.v1.json`, `placeFences`/`fenceStatus` của P04 4.2, các check doctor của P11 4.2. Plan này **không** định nghĩa lại contract nào của 4.2; chỉ thêm dòng registry và caller.
- **Quyết định của anh 2026-10-16 áp vào đây:** một người dùng, không tương thích ngược; cutover dừng-toàn-bộ, xoá đường v1 trong cùng phase, dữ liệu cũ vẫn đọc được qua đường đọc duy nhất (ở đây không có dữ liệu cần đọc lại: lock không mang dữ liệu); đích đa nền tảng, Linux trước, cổng trung lập OS; không work item; song song hoá.
- Impact-analysis: GitNexus có mặt nhưng plan này dùng trích dẫn grep có số dòng (tầng `full` không bảo đảm phủ từng file, tsk-38h); executor chạy `impact` trước khi sửa từng symbol theo CLAUDE.md.
- Component boundary: **không đổi** bản đồ (holder-lock đã có ở 4.2; đây chỉ chuyển caller). Ghi `No component-boundary change` trong báo cáo landing.

## Phạm vi

Trong 4.4a:
- `fgctl` activation lock ([`init.rs:170-287`](../../packages/distribution/rust/src/init.rs) `ActivationLockGuard`, 11 chỗ gọi) sang kernel lock qua crate.
- Phép kiểm main checkout của `fgctl` ([`lock.rs:209-257`](../../packages/distribution/rust/src/lock.rs) `check_main_checkout_lock`, 7 chỗ gọi trong `init.rs`) sang `probe` của crate trên đường v3; đường đọc v1 chỉ còn nhánh "tombstone = đã chuyển" cho tới khi 4.3 xoá nó (Lead D2).
- `install.lock` ([`store.rs:24-57`](../../packages/distribution/rust/src/store.rs) `InstallLockGuard`) sang kernel lock phạm vi máy.
- Observe store lock ([`store_lock.rs:139-205`](../../packages/observe/rust/src/store_lock.rs) `acquire_store_lock`, 6 chỗ gọi) sang kernel lock; ghi shard snapshot ([`snapshot.rs:65-75`](../../packages/observe/rust/src/metrics_cli/snapshot.rs)) vào trong lock (Lead D4).
- Registry thêm 3 dòng; hàng rào tombstone cho 3 đường v1; doctor/docs/CHANGELOG; landing ba workspace.

Ngoài (bàn giao, [phase 06](phase-06-cross-platform-drivers-handoff.md)): **4.4b** driver Windows `lockfileex` + `job-object` và driver chứa process macOS; probe macOS mượn qua kế thừa (X2 đã đo xanh, r6 §12.10). Ngoài: mọi lock Node (4.2, 4.3); xoá hẳn đường đọc v1 `main-checkout.lock` trong `lock.rs` (4.3 P08, vì đó là cutover của họ main checkout).

## Lead tự quyết

| # | Quyết định | Lý do |
|---|---|---|
| D1 | Ba lock vào registry thành ba dòng riêng: `activation` (repo, `<fgosDir>/locks/activation.lock`), `install` (machine, `<lockRoot>/install.lock`), `observe` (repo, `<fgosDir>/locks/observe.lock`); cả ba `mutex` hạng 80, `fence: tombstone`, owner `4.4` | Registry 4.2 gộp ba lock vào một dòng "theo 4.4" ([phase-00 4.2](../261016-1104-holder-lock-kernel-lock-foundation/phase-00-contracts-and-registry.md)); `placeFences` và `lock-holders` của 4.2 đi theo registry nên ba dòng là đủ để doctor/hàng rào phủ chúng, không thêm code check |
| D2 | `check_main_checkout_lock` = `probe(main-checkout)` trên đường v3 (`LOCK_SH\|LOCK_NB`, không giữ) **cộng** đường đọc v1 chỉ thêm một nhánh: `.fgos/main-checkout.lock` là thư mục (tombstone) → bỏ qua v1. Không giữ main mutex qua publish | (a) Giữ hợp đồng chỉ-đọc hiện có (đầu file `lock.rs:1`): `run_tail` chạy `fgos setup` Node có thể checkpoint main; giữ EX qua tail sẽ tự chặn. (b) Giữa lúc 4.4a land và 4.3 land, writer Node vẫn dùng v1 file: bỏ hẳn v1 thì `fgctl` mù với họ. (c) Nhánh tombstone làm `fgctl` mới chịu được hàng rào của 4.3 — đúng điều kiện đường găng. Xoá phần v1 còn lại là việc của 4.3 P08 cùng cutover họ main |
| D3 | Không giữ `LockScope` trong Rust; thứ tự trong `fgctl` cố định trong code: `probe(main-checkout)` (không giữ) → `activation` (80). `install` (80) chỉ giữ trong `stage_release`, luôn **trước** `activation` và đã nhả ([`init.rs:821`](../../packages/distribution/rust/src/init.rs) stage rồi [`:941-947`](../../packages/distribution/rust/src/init.rs) mới lock) | Hai lock hạng 80 không bao giờ lồng nhau; test P01 khẳng định thứ tự bằng trace (không cần cơ chế hạng ở Rust) |
| D4 | Ghi shard snapshot đi dưới observe lock | `writeln!` trên `File` có thể là nhiều `write`; hai process cùng writer id (subagent cùng phiên Claude chung `CLAUDE_CODE_SESSION_ID`, giới hạn đã ghi ở [hội đồng §2.2](../reports/architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md)) có thể xen dòng. Mọi ghi vào `.fgos/observe` một cửa |
| D5 | Windows giữa 4.4a và 4.4b: crate trả `unavailable` → `fgctl init/upgrade/repair` từ chối có tên `lock-driver-unavailable` (activation, install), observe ghi lỗi có tên. Không lùi về v1 | Quyết định A2 của anh trong plan 4.2. Driver Windows đã hết bị chặn (r6 §12.12) và là 4.4b |
| D6 | Giữ tên kiểu công khai `ActivationLockGuard`, `InstallLockGuard`, `StoreLockGuard` (bọc `Handle` của crate, `Drop` = đóng description, không `LOCK_UN`), giữ biến thể lỗi `ActivationLockHeld`, `LockError::AlreadyInProgress`, `ObserveLockError::Timeout` | Caller và test hiện có dựa trên các tên này (11 + 2 + 6 chỗ gọi); đổi tên không đem lại gì |

## Phase và phụ thuộc

Tiền đề cứng: **4.2 đã land và activate** (crate `fgos-holder-lock`, registry, `placeFences`, check doctor có trên main).

| Phase | Nội dung | Phụ thuộc | Wave | Giờ |
|---|---|---|---|---|
| [00](phase-00-registry-rows.md) | 3 dòng registry + test registry | 4.2 landed | 0 | 1 |
| [01](phase-01-fgctl-activation-and-main-probe.md) | `fgctl`: activation lock + `check_main_checkout_lock` qua crate | 00 | 1 | 4 |
| [02](phase-02-install-lock.md) | `install.lock` phạm vi máy qua crate | 00 | 1 | 2 |
| [03](phase-03-observe-store-lock.md) | Observe store lock + shard snapshot qua crate | 00 | 1 | 3 |
| [04](phase-04-fences-doctor-docs-changelog.md) | Biến `stateRoot` cho registry, test hàng rào, docs, CHANGELOG | 00 (docs); 01–03 (test hàng rào) | 1 | 3 |
| [05](phase-05-integration-landing-activation.md) | Tích hợp, full test, dừng-toàn-bộ, cài `fgctl` mới, activate 3 workspace, đặt hàng rào | 00–04 | 2 | 3 (Lead) |
| [06](phase-06-cross-platform-drivers-handoff.md) | Bàn giao 4.4b (Windows, macOS) | 05 | track riêng | — |

```text
wave 0: P00
wave 1: P01 ∥ P02 ∥ P03 ∥ P04(docs)   (file rời nhau; P04 chạy test hàng rào sau khi 01–03 vào nhánh tích hợp)
wave 2: P05 (Lead)  ──> mở khoá cutover main checkout của 4.3
sau:    P06 → 4.4b
```

Nhánh tích hợp `rust-callers/integration` (worktree `.claude/worktrees/rc-integration`), tạo từ main sau khi 4.2 land. Mỗi phase nhánh `rust-callers/pNN-<slug>`, worktree `.claude/worktrees/rc-pNN`, tạo từ đỉnh nhánh tích hợp đầu wave. Thứ tự merge: P00 → P01 → P02 → P03 → P04. Chủ file dùng chung: registry → P00; `Cargo.lock` gốc → ai merge sau sinh lại bằng `cargo build`; `CHANGELOG.md`, docs → P04. Không phase nào sửa `bin/fgos.mjs`, `test/test-ownership.mjs`, `src/setup/registrations.mjs`.

**Quan hệ với plan khác:** 4.3 code song song được ngay sau 4.2 (file Node, rời 4.4a); **landing** của 4.3 (đặt tombstone `main-checkout.lock`) chỉ sau khi P05 ở đây đã activate `fgctl` mới ở cả ba workspace. 4.3 P08 xoá nốt nhánh v1 trong `lock.rs`, tạo nhánh từ main đã có 4.4a. 6.5 không đụng file nào ở đây.

## Data flow

```text
fgctl init|upgrade|repair
  ├─ stage_release ─ InstallLockGuard::acquire ─> holder_lock::acquire(install, EX, Try)  <lockRoot>/install.lock
  ├─ check_main_checkout_lock ─> holder_lock::probe(main-checkout) trên <fgosDir>/locks/main-checkout.lock
  │                              + v1: .fgos/main-checkout.lock là thư mục → bỏ qua; là file → luật đọc cũ (tới 4.3)
  └─ ActivationLockGuard::acquire ─> holder_lock::acquire(activation, EX, Try)  <fgosDir>/locks/activation.lock
        └─ publish_activation_file / run_tail (Node con không kế thừa description: O_CLOEXEC)
fgos observe … (case/eval/friction/snapshot)
  └─ acquire_store_lock ─> holder_lock::acquire(observe, EX, Wait 5000 ms) <fgosDir>/locks/observe.lock
```

## Tiêu chí xong

1. `cargo test -p fgos-distribution -p fgctl -p fgos-observe -p fgos-holder-lock` xanh; `cargo check -p fgos-distribution -p fgos-observe -p fgctl --target x86_64-pc-windows-msvc --target aarch64-apple-darwin` xanh.
2. Test đa process thật trên ba lock: holder SIGKILL → người sau giữ được ngay (không TTL, không đợi 180 s/30 s); hai process tranh → đúng một thắng; Node facade (4.2) và Rust cùng một file lock loại trừ nhau (một writer Node + một writer Rust, r6 §11/4.4).
3. `rg` trong `packages/distribution/rust/src packages/observe/rust/src` không còn: `is_stale_content`, `try_create` (activation), `create_new` cho lock, `is_lock_expired`, `is_process_dead`, `LOCK_TTL_SECS`, `DEFAULT_TTL_MS` dùng cho activation.
4. `fgctl` mới chạy `init` thành công trên workspace có tombstone ở `.fgos/main-checkout.lock`; `fgctl` cũ (binary trước landing) gặp tombstone activation/install thất bại to tiếng (đo ở P05).
5. Doctor `lock-holders` và `lock-fences` liệt kê `activation`, `install`, `observe`; sau landing `lock-fences` pass ở cả ba workspace.
6. Full `npm test` xanh trên nhánh tích hợp với `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<binary build từ nhánh tích hợp>`.

## Rủi ro chính

| Rủi ro | Khả năng × tác động | Giảm thiểu |
|---|---|---|
| `fgctl` cũ còn trên PATH sau landing, activate song song với v3 | Thấp × TB | Tombstone làm `fgctl` cũ thất bại to tiếng (EISDIR/`AlreadyInProgress`); P05 cài đè và kiểm `which -a fgctl` |
| Description activation rò sang `run_tail` (Node con) | Thấp × Cao | Crate mở `O_CLOEXEC`; test rò P01 quét `/proc/<tail>/fd` |
| Khe 4.4a→4.3: `fgctl` không thấy holder v1 main | Thấp × Thấp | D2 giữ đường đọc v1 cho tới 4.3 |
| Windows mất `fgctl` activate tới 4.4b | Chắc × Thấp (chỉ anh dùng, Linux) | D5; CHANGELOG nói thẳng; 4.4b đã hết bị chặn |

## Rollback

Trước P05 bước đặt hàng rào: revert merge trên main, cài lại `fgctl` trước, activate lại release trước ở ba workspace. Sau khi đặt hàng rào: thêm `rm -r` ba thư mục tombstone (danh sách in bởi `fenceStatus`) theo runbook P05. Không có dữ liệu cần chuyển ngược.

## Câu hỏi mở cho anh

1. (Xác nhận, mặc định đã chọn) D5: giữa 4.4a và 4.4b, `fgctl` trên Windows từ chối activate có tên thay vì lùi về lock v1. Đây là hệ quả trực tiếp của A2; nếu anh cần Windows chạy được trong khoảng đó thì 4.4b phải land cùng đợt.
