# Phase 11: doctor, setup, spec, boundary, CHANGELOG

Wave 1 (docs) và wave 2 (check). Nhánh `run-supervisor/p11-doctor-docs`, worktree `.claude/worktrees/rs-p11`. Phụ thuộc: P00 (docs); P04, P06 (check); merge phần check sau P09. Chủ `src/setup/registrations.mjs`, `test/setup/checks.test.mjs`, `CHANGELOG.md`, mọi docs của plan này.

> **Amendment 2026-10-18:** driver lock Windows đã land (4.4b): CHANGELOG và spec không ghi "Windows `fgos run` báo `lock-driver-unavailable`"; ghi mức chứa `windows-job` thay vào. `registrations.mjs`, `CHANGELOG.md`, `runner.md`, `component-boundary.md`, `reading-map.md` là file chung với 6.5: giữ cả hai phía khi xung đột.

## Đọc trước

AGENTS.md "Install/setup/doctor gate"; [`docs/distribution-vision.md`](../../docs/distribution-vision.md), [`docs/specs/distribution.md`](../../docs/specs/distribution.md); 4.2 P11 (check `lock-holders` để sửa theo N1); [`registrations.mjs:5332-5460`](../../src/setup/registrations.mjs) (check dọn confinement hiện có, gọi reaper ở `:5450`).

## Yêu cầu

**Check doctor (đăng ký trong `registrations.mjs`):**
- `process-containment`: in driver đã chọn và mức (`kernel`/`best-effort`) + danh sách đường thoát; Linux không user namespace → `warn` có tên, không fail.
- `runtime-socket-dir`: tồn tại, 0700, chủ là uid; fix tạo.
- `run-attempts-stuck`: run có envelope v3 chưa `closed.json` mà lock trống (client P06 `adoptScan({probeOnly: true})` → route `adopt --scan --probe-only`, chỉ báo trạng thái, không ghi gì); fix = `sweepAttempts`.
- `run-supervisor-route`: binary host có route `supervise/gate/adopt/attempt-step` với protocol 1 (gọi `--protocol 1 --probe`, route trả `ok`).
- `gate-kill-grace`: in `dispatch.gateKillGraceMs` (D9), từ chối < 1000.
- Check dọn confinement ở `:5450` gọi `sweepAttempts` thay `reapOrphanedConfinementResources` trực tiếp.
- `lock-holders` (4.2): monitor bwrap có cha là supervisor/gate của attempt đang giữ lock = thành viên (N1).

**Setup:** tạo thư mục socket runtime; đăng ký `dispatch.gateKillGraceMs` vào config-merge (project ghi đè global; không ghi khoá mới vào `~/.fgos/config.json` global cho tới khi cả ba workspace đã activate release mới — bài học 2026-10-13).

**Docs:**
- `docs/platform/run-supervisor/spec.md` (mới): vai trò L4, supervisor/gate, envelope v3, GO, receipt, bước, adopt + ma trận, bảng lỗi r6 §10, chính sách "supervisor chết → agent chạy tiếp", ranh giới (daemon ngoài miền).
- `docs/platform/agent-protocol/spec.md` (mới): cổng IO, kết quả có tên, bảng CLI × mode (`direct` ở 6.2).
- `docs/platform/process/spec.md` (của 4.2): thêm mục cổng chứa + bốn driver + mức.
- [`component-boundary.md`](../../docs/platform/component-boundary.md): thêm run supervisor (L4), launch gate, agent-protocol (L3), cổng chứa (L0).
- [`docs/specs/runner.md`](../../docs/specs/runner.md): mục "Lịch sử quyết định" thêm quyết định thay `detached-run-supervisor` (thay vai trò của 0043 ở dòng 3039 phần detached-run-supervisor); mô tả lại dispatch cli.
- [`docs/specs/reading-map.md`](../../docs/specs/reading-map.md), [`docs/specs/distribution.md`](../../docs/specs/distribution.md) (hàng doctor mới).
- `CHANGELOG.md` `## [Unreleased]`: controller chết không còn mất kết quả cli; agent chạy trong PID namespace; Windows `fgos run` báo `lock-driver-unavailable` tới driver lock Windows; khoá cấu hình mới.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/setup/registrations.mjs`, `src/setup/checks.mjs` (nếu registry check ở đó), `test/setup/checks.test.mjs`, `CHANGELOG.md` |
| tạo/sửa | `docs/platform/run-supervisor/spec.md`, `docs/platform/agent-protocol/spec.md`, `docs/platform/process/spec.md`, `docs/platform/component-boundary.md`, `docs/specs/runner.md`, `docs/specs/reading-map.md`, `docs/specs/distribution.md` |

## Test

`node --test test/setup/checks.test.mjs` (mỗi check: pass, warn, fail, fix); `npm run test:docs` nếu có (kiểm link). Docs: một H1 mỗi file, link bấm được.

## Tiêu chí nghiệm thu / rollback

Năm check mới + check sửa xanh; docs khớp code đã merge (đọc lại sau P09). Rollback: revert.
