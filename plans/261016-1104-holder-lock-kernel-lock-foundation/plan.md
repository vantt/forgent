---
title: "4.2 Holder-lock: cổng lock trung lập OS, kernel lock cho các lock lạnh"
description: "Crate fgos-process + fgos-holder-lock, route nội bộ, facade Node LockScope, cutover hai pha cho lock lạnh, sàn lockProtocolFloor, doctor báo mức bảo đảm"
status: pending
priority: P1
effort: 62h
branch: worktree-agent-ab1a2b989b430bd4e
tags: [holder-lock, kernel-lock, rust, cross-platform, cutover]
created: 2026-10-16
---

# Plan 4.2: Holder-lock — kernel lock cho các lock lạnh

- Ngày: 2026-10-16. Người viết: planner (Claude Opus 5.5) theo brief của Lead.
- **Thực hiện thiết kế r4**: [design-261016-1107-...-v3-r4.md](../reports/design-261016-1107-lock-and-run-supervisor-foundation-v3-r4.md) (main `b7c9a56cc`), mục §11 entry 4.2, §6.0 cổng lock, §6.1.1 luật description, §6.1.2 ma trận mức bảo đảm, §6.5 trace → cảnh báo → ném, §6.8 cutover hai pha, §6.9 state root. r4 đã hấp thụ phản biện [kongming vòng 3](../reports/red-team-kongming-261016-1018-lock-and-run-supervisor-foundation-v3-r3-review.md): M4 (check `lock-borrow-vectors`, đỏ = FAIL, không có chế độ tắt mượn), M5 (gác chạy theo lịch trace → cảnh báo → ném), N6 (`probe` dùng `LOCK_SH`), KISS #4 (cwd giữ phạm vi `fgosDir`).
- Đầu vào khác: [kiểm kê lock](../reports/research-261015-1731-lock-inventory-and-standardization.md), [hội đồng](../reports/architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md), plan mẫu [5.1 identity](../261015-2102-identity-resolver-rust-crate/plan.md).
- Không có work item (anh cấm cho track này). Không alias tương thích ngược; đường v1 chỉ sống trong cửa sổ R-dual do r4 §6.8 bắt buộc, rồi bị xoá ở [phase 13](phase-13-remove-v1-paths-and-trace-throw.md).
- Impact-analysis: `fgos tool query --capability impact-analysis` trả 0 provider → **inactive**; thay bằng grep/`git log -S` có trích dòng trong từng phase.
- Component boundary: **có đổi** (thêm process-facts/process-control, holder-lock). Cập nhật ở [phase 11](phase-11-doctor-setup-spec-changelog.md).

## Phạm vi

Trong 4.2: crate `fgos-process` (facts + control phần 4.2 dùng), crate `fgos-holder-lock` (cổng 6.0 + driver `flock`), route `fgos internal lock-fd` / `state-root` / `quiesce-scan` / `lock-borrow-vectors`, facade Node `LockScope`, registry lock kèm hình dạng giao thức cũ, engine cutover hai pha, sàn `lockProtocolFloor` ở `fgctl`, cutover các lock lạnh (gateway, sessions, runner, advance, reconcile, recovery, full-suite, account provider, `state-lock`, dispatch cwd), doctor/setup/spec/CHANGELOG, landing.

Ngoài 4.2 (4.3): `main-checkout.lock`, `merge-slot--*`, `events.lock`, `claims.lock`, `porting/events.lock`, hook pre-commit, gác `exec-under-hot-lock`. Registry vẫn liệt kê chúng (trạng thái `v1`, chủ `4.3`). Ngoài 4.2 (4.4): driver Windows/macOS sau spike X1/X2 ([phase 14](phase-14-cross-platform-drivers-handoff.md)), `fgctl` `lock.rs`, `install.lock`, observe.

## Lead tự quyết (có lý do, anh đảo được)

| # | Quyết định | Lý do |
|---|---|---|
| D1 | Spec ở `docs/platform/holder-lock/spec.md` và `docs/platform/process/spec.md`, không phải `docs/specs/holder-lock.md` như r4 ghi | Tiền lệ component nền: `docs/platform/session-identity/spec.md`, `docs/platform/convention/spec.md` |
| D2 | Registry lock là một file dữ liệu `packages/holder-lock/contracts/lock-registry.v1.json`, chốt ở P00; Rust (`include_str!`) và Node cùng đọc; phase sau không sửa | Một nguồn (DRY); tránh xung đột file giữa các phase song song |
| D3 | Gate primitive của 5.2 (subreaper, PDEATHSIG, PID namespace, tty) **không** làm ở 4.2; `control` ở 4.2 chỉ có `spawn_with_fds` và `signal_by_identity` | Không có consumer trong 4.2; "bằng chứng trước writer" yêu cầu consumer thật. Làm ở 6.2 cùng cổng chứa 5.3 |
| D4 | `lock-borrow-vectors` cài trong crate Rust; `fgctl` gọi bằng crate nó tự link (trước publish activation), doctor gọi qua route | Preflight của `fgctl` cam kết không chạy gì dưới `candidate_dir` ([`init.rs:441-447`](../../packages/distribution/rust/src/init.rs)); vector đo môi trường git, không đo payload |
| D5 | macOS dùng driver `flock` unix ngay từ 4.2, mức khai `kernel (chưa đo, spike X2)`; `lock-borrow-vectors` + `lock-kernel-semantics` chạy trên mount thật là phép đo, đỏ thì activate từ chối | Không làm macOS hỏng các lock đang chạy được bằng v1; vector là đúng phép đo X2 cần cho phần mượn |
| D6 | Windows (target release thật: [`release-targets.mjs:29`](../../src/util/release-targets.mjs)) chưa có driver ở 4.2: cutover từ chối với `lock-driver-unavailable`, lock tiếp tục chạy đường v1; doctor báo mức `legacy-v1`, không `fail`. Phase 13 (xoá v1) vì vậy chờ driver Windows của 4.4 | Không hồi quy một nền đang phát hành; không có câu "fail trên Windows" |
| D7 | Giao thức route nội bộ kiểm bằng số phiên bản contract (`--protocol 1`), lệch → `host-version-mismatch` | Đủ cho "cùng release"; không cần digest |
| D8 | Account lock giữ bất biến hôm nay "holder chết mà con còn sống thì không giành" bằng `runBorrowed` cho con probe credential | Thay `recordChild` ([`provider-capacity.mjs:607`](../../src/runner/dispatch/provider-capacity.mjs), dùng ở [`provider-credential-renewal.mjs:1078`](../../src/runner/dispatch/provider-credential-renewal.mjs)) bằng cơ chế kernel tương đương |
| D9 | Điều kiện (b) của họ cwd (r4 §6.8 bước 1) = `fgctl` từ chối activate/rollback dưới sàn của workspace + cutover kiểm activation hiện tại và `previousArtifactDigest` đều ≥ sàn. Chạy thẳng một release trong store bằng đường dẫn tay nằm ngoài mô hình (giống raw git) | Không có cách đánh dấu "không chạy được" cho release dùng chung store giữa nhiều workspace mà không phá workspace khác |

## Phase và đồ thị phụ thuộc

| Phase | Nội dung | Phụ thuộc (nghiệm thu) | Wave | Ước lượng |
|---|---|---|---|---|
| [00](phase-00-contracts-and-registry.md) | Contract cổng, route, registry, vector facts/state-root | — | 0 | 3h |
| [01](phase-01-process-crate.md) | Crate `fgos-process` + căn leaf Node `process-identity.mjs` | 00 | 1 | 6h |
| [02](phase-02-holder-lock-crate-and-internal-routes.md) | Crate `fgos-holder-lock`, driver flock, routes, state root, borrow vectors | 00; 01 trước nghiệm thu | 1 | 8h |
| [03](phase-03-node-facade-lockscope.md) | Facade Node, `LockScope`, trace, `runBorrowed`, env | 00; 02 trước nghiệm thu | 1 | 6h |
| [05](phase-05-fgctl-floor-and-borrow-vectors.md) | `lockProtocol` trong manifest, sàn ở `fgctl`, vector trước publish | 00; 02 + 03 trước nghiệm thu | 1 | 4h |
| [04](phase-04-cutover-engine.md) | Engine cutover hai pha, hàng rào, marker, sàn, revert | 01, 03 | 2 | 6h |
| [11](phase-11-doctor-setup-spec-changelog.md) | Doctor, setup, spec, boundary, reading-map, CHANGELOG | 02, 03, 04 (code); bắt đầu wave 2 | 2–3 | 5h |
| [06](phase-06-cutover-gateway-sessions-runner.md) | gateway, sessions, runner | 03, 04 | 3 | 4h |
| [07](phase-07-cutover-advance-recovery.md) | advance, recovery | 03, 04 | 3 | 3h |
| [08](phase-08-cutover-full-suite.md) | full-suite (phạm vi máy) | 03, 04 | 3 | 2h |
| [09](phase-09-cutover-provider-ledgers.md) | account provider, `state-lock` (thế hệ chặn) | 03, 04 | 3 | 5h |
| [10](phase-10-cutover-dispatch-cwd-and-reconcile.md) | dispatch cwd (phạm vi `fgosDir`), `reconcile.lock`, guard resume | 03, 04 | 3 | 5h |
| [12](phase-12-integration-landing-activation.md) | Tích hợp, full `npm test`, quiesce, merge, activate 3 workspace, cutover | 01–11 | 4 | 3h (Lead) |
| [13](phase-13-remove-v1-paths-and-trace-throw.md) | Xoá đường v1, bật ném lỗi thứ tự | 12 + driver Windows (4.4) | 5 (gated) | 4h |
| [14](phase-14-cross-platform-drivers-handoff.md) | Spike X1/X2 + driver Windows/macOS: bàn giao sang 4.4 | 12 | sau | — (4.4) |

```text
wave 0:  P00
wave 1:  P01 ─┬─> P02 (code song song với P01; nghiệm thu sau khi merge P01)
              │      ├─> P03 (code song song; test thật cần binary P02)
              │      └─> P05 (code song song; cần crate P02 để link vector)
wave 2:  P04 (cần P01 scan + P03 facade)          P11 bắt đầu (spec/docs; check gắn code khi P04 xong)
wave 3:  P06 ∥ P07 ∥ P08 ∥ P09 ∥ P10   (+ P11 hoàn tất)
wave 4:  P12 (Lead)
wave 5:  P13 (chờ cutover bật ở cả 3 workspace + driver Windows 4.4)
```

Nhánh/worktree: nhánh tích hợp `holder-lock/integration` (worktree `.claude/worktrees/hl-integration`, tạo từ main). Mỗi phase một nhánh `holder-lock/pNN-<slug>` và worktree `.claude/worktrees/hl-pNN`, tạo từ đỉnh `holder-lock/integration` lúc wave bắt đầu. Lead merge vào `holder-lock/integration` theo thứ tự P00 → P01 → P02 → P03 → P05 → P04 → P11 (phần docs) → P06 → P07 → P08 → P09 → P10 → P11 (phần check). Chi tiết và lệnh kiểm ở [phase 12](phase-12-integration-landing-activation.md).

**Sở hữu file:** mỗi phase file có bảng "File sở hữu". Hai phase cùng wave không chung file. File dùng chung (`src/setup/registrations.mjs`, `test/setup/checks.test.mjs`, `CHANGELOG.md`, `docs/specs/distribution.md`, `docs/specs/reading-map.md`, `docs/platform/component-boundary.md`, registry JSON, `Cargo.toml` gốc, `Cargo.lock`) chỉ có một chủ: registry ở P00; `Cargo.toml`/`Cargo.lock` gốc ở P00 (thêm member, crate rỗng có `lib.rs` tối thiểu thật); còn lại ở P11. Không phase nào sửa `test/test-ownership.mjs` (file mới rơi vào nhánh full mặc định).

## Tiêu chí xong (đo được)

1. `cargo test -p fgos-process -p fgos-holder-lock -p fgos -p fgos-distribution -p fgctl` xanh; `cargo check -p fgos-process -p fgos-holder-lock --target x86_64-pc-windows-msvc` và `--target aarch64-apple-darwin` xanh (lõi không có kiểu chỉ-Linux trong API công khai).
2. Test đa process trên crate/route thật: giữ sau helper thoát, hai description cùng process, SIGKILL holder, timeout helper, stress 8 process có SIGKILL (0 vi phạm), mượn qua git thật với `gc.auto=1` + object rời (lock trống ngay khi git và owner đóng; anh em cùng env bị từ chối), test rò description trên route Rust (inode lock không có trong `/proc/<con>/fd` và cháu).
3. Tombstone và thế hệ chặn chạy với code v1 thật (`acquireGatewayLock`, `acquireSessionsLock`, `acquireRunnerLock`, `acquireAdvanceLock`, `withRunLock`, `acquireFullSuiteQueue`, `withLocalLock`, `acquireMainCheckoutLock` với `dispatchLockFile`, `tryAcquireAccountLock`, `withFileLock`): mọi lần acquire v1 sau hàng rào thất bại.
4. Test cutover hai pha: holder v1 xuất hiện sau lần quét đầu → bật v3 bị từ chối.
5. Mọi lock lạnh của 4.2 có đường v3 qua facade, chọn theo marker họ; test hành vi chạy ở cả hai chế độ (marker có/không).
6. `fgctl` từ chối activate release có `lockProtocol` dưới sàn workspace/máy; `lock-borrow-vectors` đỏ → activate từ chối.
7. Doctor có `lock-kernel-semantics`, `lock-holders`, `lock-cutover`, `state-root`, `lock-borrow-vectors`, báo mức bảo đảm (không fail chỉ vì nền); setup tạo `stateRoot/locks`.
8. Full `npm test` xanh trên nhánh tích hợp với `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<binary build từ nhánh tích hợp>`.
9. Sau landing: cả 4 họ đã bật (`<họ>.active`) ở forgentX, mdview, mcp-skill-hub; `fgos doctor` qua shim xanh ở cả ba.
10. Spec, component-boundary, reading-map, `distribution.md` (dòng check), CHANGELOG cập nhật cùng thay đổi.

## Rủi ro chính (chi tiết trong phase)

| Rủi ro | Khả năng × tác động | Giảm thiểu |
|---|---|---|
| Rò description qua con nền (git gc, hook, CLI daemon của probe credential) giữ lock mãi | TB × Cao | API mượn tắt `gc.auto`/`maintenance.auto`; vector bắt buộc; `lock-holders`; test rò trên route |
| Chuyển lệch: code cũ còn chạy khi bật v3 | TB × Cao | Hai pha + quét process + sàn; test holder-sau-quét |
| Hồi quy Windows/macOS | Cao nếu làm sai × Cao | D5, D6: driver tự khai mức; không có driver → v1 tiếp tục |
| Xung đột merge giữa phase song song | TB × TB | Bảng sở hữu file; registry chốt ở P00 |
| Nhánh worktree cũ (trước 4.2) chạy `npm test` gặp tombstone full-suite | Cao × Thấp | CHANGELOG + bước catch-up worktree trong runbook; lỗi có tên khi gặp thư mục |

## Câu hỏi còn mở cho anh

1. **Windows đang có người dùng thật không?** Nếu không, D6 có thể đổi: xoá v1 ngay ở phase 13 và Windows báo `unsupported` tới 4.4. Em giữ D6 (an toàn hơn, chỉ chậm việc xoá v1).
2. **macOS bật driver `flock` ngay (D5) hay chờ X2?** Em khuyên bật ngay vì vector + probe ngữ nghĩa trên mount thật là phép đo và chặn activate khi đỏ.
3. **Thời điểm bật ném lỗi thứ tự (phase 13):** em đề xuất sau ≥ 7 ngày dùng thật mà trace không có cảnh báo; anh muốn mốc khác thì ghi lại.
