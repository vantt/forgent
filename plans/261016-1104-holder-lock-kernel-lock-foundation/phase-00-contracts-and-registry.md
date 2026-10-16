# Phase 00: chốt contract, registry lock, vector

Wave 0, nối tiếp. Nhánh `holder-lock/p00-contracts`, worktree `.claude/worktrees/hl-p00`. Mục đích: chốt mọi thứ các phase song song cùng dựa vào, để không ai phải sửa file của người khác.

## Đọc trước

- r4 §6.0, §6.1.1, §6.2, §6.5 (bảng hạng), §6.8 (bảng hình dạng), §6.9; §5.1 (bảng phán).
- Prior art đã kiểm (`git log -S`): không có holder-lock chung nào từng tồn tại rồi bị gỡ ([kiểm kê §4](../reports/research-261015-1731-lock-inventory-and-standardization.md)); generation ledger (`3c8d518cb`, `58613b1c4`) là thiết kế duy nhất không unlink, giữ cho run control; `f1c315d3f` gỡ "actor lease" vì đọc-rồi-ghi không có gì ở giữa. Executor trước phase chạy lại `git log -S'flock' -S'FGOS_STATE_ROOT' --oneline` và ghi kết quả vào báo cáo phase.

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `packages/holder-lock/contracts/holder-lock.port.v1.json` — thao tác `acquire/release/run_borrowed/probe/holders/guarantee`, kết quả (`acquired\|held\|timeout\|unavailable`), hình dạng `guarantee = {driver, exclusion, borrow, holders, platform, notes}` với giá trị `kernel\|kernel-unmeasured\|job-scoped\|unsupported\|none` |
| tạo | `packages/holder-lock/contracts/internal-route.lock-fd.v1.json` — argv (`--protocol 1`, `--try`, `--wait-ms N`, `--shared-try`, `--borrowed-check <path>`, `--guarantee <path>`), fd 3 vào, stdout JSON một dòng, mã thoát |
| tạo | `packages/holder-lock/contracts/internal-route.state-root.v1.json`, `internal-route.quiesce-scan.v1.json`, `internal-route.lock-borrow-vectors.v1.json` |
| tạo | `packages/holder-lock/contracts/lock-registry.v1.json` (bảng dưới) |
| tạo | `packages/process/contracts/process-facts.judge.v1.json` — vector của 5.1 (mọi dòng hai bảng, gồm N4) |
| tạo | `packages/holder-lock/contracts/state-root.vectors.v1.json` — `FGOS_STATE_HOME`, `XDG_STATE_HOME`, `HOME`, `USERPROFILE`, sandbox `HOME` + `FGOS_STATE_ROOT`, giá trị rỗng/khoảng trắng |
| tạo | `packages/process/rust/{Cargo.toml,src/lib.rs}`, `packages/holder-lock/rust/{Cargo.toml,src/lib.rs}` — crate tối thiểu (chỉ `pub mod` rỗng + doc), để P01/P02 không cùng sửa `Cargo.toml` gốc |
| sửa | `Cargo.toml` gốc (thêm 2 member), `Cargo.lock` |

## Registry (một dòng mỗi lock)

Trường: `name`, `kind` (`mutex\|lease\|hot-mutex\|beacon`), `scope` (`repo\|machine\|run`), `rank` (bảng r4 §6.5), `v3Path` (mẫu, dưới `<fgosDir>/locks/` hoặc `<lockRoot>/`, `run` dưới thư mục run), `v1Shape` (`file-link\|file-wx\|ledger-dir\|file-by-cwd`), `v1Path` (mẫu), `fence` (`tombstone\|blocking-generation\|none`), `owner` (`4.2\|4.3\|4.4`).

| name | kind | scope | rank | v1 (nguồn) | fence | owner |
|---|---|---|---|---|---|---|
| gateway | lease | repo | 10 | `.fgos/gateway.lock` ([`gateway-control.mjs:36`](../../src/runner/gateway-control.mjs)) | tombstone | 4.2 |
| runner | lease | repo | 10 | `.fgos/runner.lock` ([`loop.mjs:136`](../../src/runner/loop.mjs)) | tombstone | 4.2 |
| sessions | mutex | repo | 80 | `.fgos/sessions.lock` ([`session.mjs:43`](../../src/runner/session.mjs)) | tombstone | 4.2 |
| advance | mutex | run | 80 | `.fgos/workflow-runs/<id>/advance.lock` ([`workflow/runner.mjs:783`](../../src/workflow/runner.mjs)) | tombstone (mọi run có sẵn lúc cutover) | 4.2 |
| reconcile | mutex | repo | 80 | `.fgos/dispatch/reconcile.lock` ([`reconciliation-planner.mjs:199`](../../src/runner/dispatch/reconciliation-planner.mjs)) | tombstone | 4.2 |
| recovery | mutex | run | 80 | `<runDir>/.recovery.lock` ([`recover.mjs:153`](../../src/verbs/dispatch/recover.mjs)) | tombstone (run có sẵn lúc cutover) | 4.2 |
| full-suite | lease | machine | 80 | `os.tmpdir()/fgos-full-suite.lock` ([`full-suite-queue.mjs:20`](../../scripts/lib/full-suite-queue.mjs)) | none (xem plan.md: tombstone làm nhánh cũ lặp vô hạn) | 4.2 |
| provider-account | mutex | machine | 80 | `~/.fgos/runtime/provider-capacity/account-locks/<p>/<a>/lock/` ([`provider-capacity.mjs:660,698`](../../src/runner/dispatch/provider-capacity.mjs)) | blocking-generation (account có sẵn lúc cutover) | 4.2 |
| provider-state | mutex | machine | 80 | `.../provider-capacity/state-lock/` ([`provider-capacity.mjs:48`](../../src/runner/dispatch/provider-capacity.mjs)) | blocking-generation | 4.2 |
| dispatch-cwd | lease | repo (`fgosDir`) | 30 | `.fgos/dispatch--<encodeURIComponent(cwd)>.lock` ([`main-checkout-lock.mjs:81`](../../src/runner/main-checkout-lock.mjs)) | tombstone (cả `path.resolve` và `realpath`; mọi worktree + claim lúc cutover) | 4.2 |
| main-checkout | mutex | repo | 50 | `.fgos/main-checkout.lock` | tombstone | 4.3 |
| merge-slot | mutex | repo | 20 | `.fgos/merge-slot--<ref>.lock` | tombstone | 4.3 |
| state (events+claims) | hot-mutex | repo | 60 | `.fgos/events.lock`, `.fgos/runtime/claims.lock` | tombstone | 4.3 |
| porting-events | hot-mutex | repo | 60 | `.fgos/porting/events.lock` ([`porting-store.mjs:27`](../../src/state/porting-store.mjs)) | tombstone | 4.3 |
| worktree-admin | mutex | repo | 40 | (mới) | — | 4.3 |
| activation, install, observe | mutex | repo/machine | 80 | Rust ([`init.rs`](../../packages/distribution/rust/src/init.rs), [`store.rs:24-57`](../../packages/distribution/rust/src/store.rs), observe `store_lock.rs`) | theo 4.4 | 4.4 |
| attempt | lease | run | 15 | (mới, `runs/NN/attempt.lock`) | — | 6.2 |

Không marker họ, không sàn (quyết định A1, Lead D7 trong plan.md). Hàng rào chỉ đặt một lần lúc cutover (P04).

## Bước

1. Viết contract + vector + registry. Một schema JSON nhỏ cho registry (`lock-registry.schema.v1.json`), test Node `test/holder-lock/registry-contract.test.mjs` kiểm: tên duy nhất, rank theo kind, mọi lock 4.2 có `fence`. `v1Path` được kiểm gián tiếp bởi test hàng rào của P04, chạy code v1 lấy từ commit gốc của track (`git show <base>:<path>`), vì code v1 bị xoá trong các phase cutover.
2. Tạo hai crate tối thiểu, thêm member; `cargo check` xanh.
3. Merge vào `holder-lock/integration` (Lead), rồi mở wave 1.

## Test

`node --test test/holder-lock/registry-contract.test.mjs`; `cargo check -p fgos-process -p fgos-holder-lock`.

## Tiêu chí nghiệm thu

- Contract đủ để P01–P05 code độc lập: không phase wave 1 nào cần sửa file ở bảng trên.
- Vector 5.1 có ít nhất một ca cho mỗi dòng hai bảng r4 §5.1, gồm N4 (người phán ngoài init namespace, record thiếu `pidNs` → `unknown`).

## Rủi ro / rollback

Thuần thêm mới, chưa ai gọi. Rollback: revert commit. Rủi ro: contract thiếu trường làm phase sau phải sửa contract — sửa đi qua Lead trên nhánh tích hợp, báo mọi phase đang chạy rebase.
