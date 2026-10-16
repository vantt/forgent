---
title: "4.2 Holder-lock: cổng lock trung lập OS, kernel lock cho các lock lạnh"
description: "Crate fgos-process + fgos-holder-lock, route nội bộ, facade Node LockScope, cutover dừng-toàn-bộ cho lock lạnh, doctor báo mức bảo đảm"
status: pending
priority: P1
effort: 50h
branch: worktree-agent-ab1a2b989b430bd4e
tags: [holder-lock, kernel-lock, rust, cross-platform, cutover]
created: 2026-10-16
---

# Plan 4.2: Holder-lock — kernel lock cho các lock lạnh

- **Thực hiện thiết kế r4**: [design-261016-1107-...-v3-r4.md](../reports/design-261016-1107-lock-and-run-supervisor-foundation-v3-r4.md) §11 entry 4.2, §6.0 cổng lock, §6.1.1 luật description, §6.1.2 mức bảo đảm, §6.9 state root. Đã gồm phản biện [kongming vòng 3](../reports/red-team-kongming-261016-1018-lock-and-run-supervisor-foundation-v3-r3-review.md): M4 (`lock-borrow-vectors`, đỏ = FAIL), N6 (`probe` dùng `LOCK_SH`), cwd giữ phạm vi `fgosDir`.
- **Quyết định của anh 2026-10-16 (thay một phần r4, ghi lại ở đây):**
  - **A1. Cutover dừng-toàn-bộ thay R-dual + quiescence hai pha (r4 §6.8).** fgOS chỉ có anh dùng, state xoá làm lại được. Quiesce mọi writer và cả ba workspace (forgentX, mdview, mcp-skill-hub), chuyển mỗi lock sang v3 và **xoá đường v1 trong cùng phase**. Không marker họ, không sàn `lockProtocolFloor`, không phase xoá v1 riêng.
  - **A2. Windows:** chưa có driver 4.4 thì các lock này báo `unsupported`, không lùi về v1. macOS: bật driver `flock` ngay, chặn ở activate bằng `lock-borrow-vectors` + probe ngữ nghĩa; số đo máy thật lấy từ probe binary chạy trên runner macOS của GitHub Actions (P14, X2). Windows: anh có máy thật (X1).
  - **A3. Sai thứ tự lock ném lỗi ngay** (không lịch trace → cảnh báo → ném của r4 §6.5). Full `npm test` + dogfood lộ vi phạm; sửa ngay trong phase gây ra. Gác `exec-under-hot-lock` (kongming M5) thuộc 4.3; plan 4.3 tự áp quyết định này nếu cùng lý do.
- Không work item. Impact-analysis: 0 provider → inactive; trích dẫn trong phase là grep có số dòng.
- Component boundary: có đổi (process-facts/control, holder-lock), cập nhật ở P11.

## Phạm vi

Trong 4.2: crate `fgos-process`, crate `fgos-holder-lock` (cổng 6.0, driver `flock` Linux + macOS, Windows `unsupported`), route `fgos internal lock-fd|state-root|quiesce-scan|lock-borrow-vectors`, facade Node `LockScope`, registry lock, hàng rào cho binary cũ, cổng activate trong `fgctl`, cutover và xoá v1 của gateway, sessions, runner, advance, reconcile, recovery, full-suite, account provider, `state-lock`, dispatch cwd; doctor/setup/spec/CHANGELOG; landing.

Ngoài: `main-checkout.lock`, `merge-slot--*`, `events.lock`, `claims.lock`, `porting/events.lock`, hook (4.3); driver Windows, `lock.rs`, `install.lock`, observe (4.4).

## Hàng rào giữ lại (A1: chỉ giữ cái rẻ nhất làm binary cũ fail to tiếng)

| Lock | Hàng rào | Lý do |
|---|---|---|
| gateway, sessions, runner, reconcile (đường cố định) | tombstone (thư mục có `TOMBSTONE`), đặt một lần | Một `mkdir`; binary cũ gặp `EISDIR` thay vì lặng lẽ giữ lock v1 song song với v3 |
| advance, recovery (theo run) | tombstone cho run có sẵn lúc cutover, không lười | Binary cũ nhắm một run tạo sau cutover là hiếm; lười thì thêm code ở mọi acquire |
| dispatch cwd | tombstone cả dạng `path.resolve` và `realpath` cho mọi worktree + claim lúc cutover, không lười | Hai writer cùng worktree là hại thật; liệt kê một lần là rẻ |
| account provider, `state-lock` | thế hệ chặn (holder PID 1, không startTime/bootId) | Tombstone không chặn được ledger (r4 §6.8); một `link` mỗi thư mục |
| full-suite | **không** | Nhánh cũ chạy `npm test` sẽ lặp vô hạn trên tombstone ([`full-suite-queue.mjs:66-86`](../../scripts/lib/full-suite-queue.mjs)); không rào thì nhánh cũ chỉ chạy suite không xếp hàng, vô hại |

## Lead tự quyết

| # | Quyết định | Lý do |
|---|---|---|
| D1 | Spec ở `docs/platform/holder-lock/spec.md`, `docs/platform/process/spec.md` | Tiền lệ `docs/platform/session-identity/spec.md` |
| D2 | Registry lock là file dữ liệu `packages/holder-lock/contracts/lock-registry.v1.json`, chốt ở P00, Rust và Node cùng đọc | Một nguồn; tránh xung đột giữa phase song song |
| D3 | Gate primitive 5.2 (subreaper, PDEATHSIG, PID namespace, tty) để 6.2 | 4.2 không có consumer |
| D4 | `fgctl` chạy borrow vectors + probe ngữ nghĩa bằng crate nó tự link, trước publish | Preflight không chạy gì dưới `candidate_dir` ([`init.rs:441-447`](../../packages/distribution/rust/src/init.rs)) |
| D5 | Route nội bộ kiểm `--protocol 1`, lệch → `host-version-mismatch` | Đủ cho "cùng release" |
| D6 | Account lock giữ bất biến "con probe còn sống thì không giành" bằng `runBorrowed` thay `recordChild` | Cơ chế kernel tương đương ([`provider-credential-renewal.mjs:1078`](../../src/runner/dispatch/provider-credential-renewal.mjs)) |
| D7 | Bỏ `lockProtocolFloor` và trường `lockProtocol` của manifest | A1: hàng rào đã làm binary cũ fail to tiếng; sàn chỉ thêm thông báo đẹp hơn |

## Phase và phụ thuộc

| Phase | Nội dung | Phụ thuộc (nghiệm thu) | Wave | Giờ |
|---|---|---|---|---|
| [00](phase-00-contracts-and-registry.md) | Contract cổng, route, registry, vector | — | 0 | 3 |
| [01](phase-01-process-crate.md) | Crate `fgos-process` + leaf Node | 00 | 1 | 6 |
| [02](phase-02-holder-lock-crate-and-internal-routes.md) | Crate `fgos-holder-lock`, routes, state root, borrow vectors | 00; 01 | 1 | 8 |
| [03](phase-03-node-facade-lockscope.md) | Facade Node, `LockScope` (ném ngay), `runBorrowed`, env | 00; 02 | 1 | 5 |
| [04](phase-04-fences-and-cutover-check.md) | Đặt hàng rào + kiểm dừng-toàn-bộ (thân check `lock-fences`) | 00; 02 | 1 | 4 |
| [05](phase-05-fgctl-activate-gate.md) | `fgctl` activate: borrow vectors + probe ngữ nghĩa | 00; 02 | 1 | 3 |
| [06](phase-06-cutover-gateway-sessions-runner.md) | gateway, sessions, runner | 03 | 2 | 3 |
| [07](phase-07-cutover-advance-recovery.md) | advance, recovery | 03 | 2 | 2 |
| [08](phase-08-cutover-full-suite.md) | full-suite | 03 | 2 | 2 |
| [09](phase-09-cutover-provider-ledgers.md) | account provider, `state-lock` | 03 | 2 | 4 |
| [10](phase-10-cutover-dispatch-cwd-and-reconcile.md) | dispatch cwd, reconcile, guard resume | 03 | 2 | 4 |
| [11](phase-11-doctor-setup-spec-changelog.md) | Doctor, setup, spec, boundary, CHANGELOG | 02–04 (check); docs từ wave 1 | 1–2 | 5 |
| [12](phase-12-integration-landing-activation.md) | Tích hợp, full test, dừng-toàn-bộ, activate 3 workspace, hàng rào | 00–11 | 3 | 3 (Lead) |
| [14](phase-14-cross-platform-drivers-handoff.md) | X1 Windows (máy anh), X2 macOS (GitHub Actions), driver Windows | 12 | track riêng | — |

```text
wave 0: P00
wave 1: P01 ─> P02 ─┬─> P03      (P02..P05, P11-docs viết code song song;
                    ├─> P04       nghiệm thu theo mũi tên vì test cần crate/binary thật)
                    └─> P05
wave 2: P06 ∥ P07 ∥ P08 ∥ P09 ∥ P10 ∥ P11 (check)
wave 3: P12 (Lead)
sau:    P14 → 4.4
```

Nhánh tích hợp `holder-lock/integration` (worktree `.claude/worktrees/hl-integration`); mỗi phase nhánh `holder-lock/pNN-<slug>`, worktree `.claude/worktrees/hl-pNN`, tạo từ đỉnh nhánh tích hợp đầu wave. Thứ tự merge: P00 → P01 → P02 → P03 → P04 → P05 → P11 (docs) → P06 → P07 → P08 → P09 → P10 → P11 (check). Chủ file dùng chung: registry, `Cargo.toml`/`Cargo.lock` gốc → P00; `registrations.mjs`, `checks.test.mjs`, `CHANGELOG.md`, docs → P11. Không phase nào sửa `bin/fgos.mjs` hay `test/test-ownership.mjs`.

## Tiêu chí xong

1. `cargo test -p fgos-process -p fgos-holder-lock -p fgos -p fgos-distribution -p fgctl` xanh; `cargo check -p fgos-process -p fgos-holder-lock` xanh cho `x86_64-pc-windows-msvc` và `aarch64-apple-darwin`.
2. Test đa process trên crate/route thật: giữ sau helper thoát, hai description cùng process, SIGKILL, timeout, stress 8 process có SIGKILL (0 vi phạm), mượn qua git thật với `gc.auto=1` + object rời (trống ngay khi git và owner đóng; anh em bị từ chối), rò description trên route Rust.
3. Hàng rào chạy với code v1 thật lấy từ commit gốc (`git show <base>:<path>`): mọi acquire v1 sau hàng rào thất bại to tiếng; `tryAcquireAccountLock` → `null`.
4. Kiểm dừng-toàn-bộ: còn process fgOS khác hoặc file v1 đang có → từ chối, không đặt hàng rào nửa vời.
5. `rg` trong `src/ scripts/` không còn đường v1 của 10 lock 4.2 (bảng xoá trong từng phase).
6. Sai thứ tự lock trong một scope ném lỗi; full `npm test` xanh (không vi phạm nào).
7. `fgctl` từ chối activate khi borrow vectors hoặc probe ngữ nghĩa đỏ; Windows báo `unsupported` cho các lock này.
8. Doctor có `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders`, `lock-fences`, `state-root`; setup tạo thư mục lock.
9. Full `npm test` xanh trên nhánh tích hợp với `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<binary build từ nhánh tích hợp>`; sau landing doctor xanh ở cả ba workspace.

## Rủi ro chính

| Rủi ro | Khả năng × tác động | Giảm thiểu |
|---|---|---|
| Rò description qua con nền (git gc, hook, CLI daemon) | TB × Cao | Mượn tắt `gc.auto`/`maintenance.auto`; vector bắt buộc ở activate; `lock-holders` |
| Process cũ sót lại lúc cutover | Thấp × Cao | Kiểm dừng-toàn-bộ quét process trước và sau khi đặt hàng rào |
| Ném lỗi thứ tự làm vỡ luồng thật chưa có test | TB × TB | Mỗi cutover phase chạy full suite trước khi nộp; sửa thứ tự ngay |
| Windows mất các lock này tới 4.4 | Chắc × Thấp (chỉ anh dùng) | A2; doctor nói thẳng `unsupported` |

Không còn câu hỏi mở.
