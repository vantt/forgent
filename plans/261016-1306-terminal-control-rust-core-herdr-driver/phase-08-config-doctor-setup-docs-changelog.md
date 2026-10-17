# Phase 08: cấu hình `terminal.*`, doctor, setup, spec, boundary, CHANGELOG

Wave 1–3. Nhánh `terminal-control/p08-config-docs`, worktree `.claude/worktrees/tc-p08`. Docs sau P00; mặc định sau báo cáo P01; check sau P05. Chủ duy nhất của file dùng chung bên dưới.

## Cổng cài đặt (AGENTS.md)

- **Config default mới**: khoá `terminal` qua `registerConfigDefault({id:'terminal', key:'terminal', shape:{allocationGraceMs: 60000, retainFailedPaneMs: null, layout:{policy:'measured-split', minCols, minRows, maxPanesPerTab}}})` ([`registrations.mjs:171`](../../src/setup/registrations.mjs)); merge chỉ thêm khi thiếu. Giá trị `minCols/minRows/maxPanesPerTab` lấy từ báo cáo P01 (D6), ghi nguồn trong spec.
- **Bài học 2026-10-13** (khoá mới trong `~/.fgos/config.json` làm vỡ release khác): kiểm validator config của release đang activate ở mdview/mcp-skill-hub có từ chối khoá lạ không. Có → setup chỉ ghi khoá vào config **project**, không global, cho tới khi cả ba workspace chạy release mới; ghi trong spec.
- **Thư mục mới**: `stateRoot/terminal/` — setup tạo (0700).
- **Env**: không thêm; `FGOS_HERDR_ANCHOR_PANE` giữ (đầu vào `attach`).
- Người dùng thấy: có → CHANGELOG.

## Doctor

| Check | Làm gì | Kết quả |
|---|---|---|
| `terminal-control` (thay thân [`checkHerdrAvailable`](../../src/setup/registrations.mjs) `:4274-4300`, giữ phần neo `FGOS_HERDR_ANCHOR_PANE`) | Gọi route `capabilities` + `server.incarnation`; in driver, danh sách khả năng, incarnation | herdr vắng → warn "terminal mode unsupported; direct mode unaffected" (Windows nói rõ phụ thuộc herdr); có herdr mà thiếu `layout.geometry` → info (dùng luật tách cũ) |
| `terminal-config` | Đọc `terminal.*` sau config-merge, in giá trị + nguồn | `allocationGraceMs` < `READY_TIMEOUT_MS` + 30000 → fail có tên (D4); `retainFailedPaneMs` không phải `null`/số dương → fail; policy lạ → fail; `minCols/minRows/maxPanesPerTab` không phải số nguyên dương → fail |
| `terminal-allocations` | `reconcile-scan`: slot quá grace chưa `launch-requested` với pane shell trần; `retain` quá hạn | warn, không đóng (r6 §7.7) |

## Docs

- `docs/platform/terminal-control/spec.md` (mới, tiền lệ `docs/platform/session-identity/spec.md`): vai trò L2, cổng trên, record, luật 7.4, ca lỗi 7.7, driver + khả năng + khe incarnation (D1), layout + policy, cấu hình, Windows phụ thuộc herdr, "Lịch sử quyết định" (hội đồng 2.3/2.4, r6 §7, D1–D7, prior art).
- [`docs/platform/component-boundary.md`](../../docs/platform/component-boundary.md) §4: thêm "Terminal-control (L2)".
- `docs/specs/reading-map.md`: spec, `packages/terminal-control/`, `src/terminal-control/`.
- `docs/specs/runner.md`: đoạn herdr-spawn (grep `batch tab\|createBatchTab\|anchor pane`) nói theo terminal-control.
- `docs/specs/distribution.md`: thêm 3 check, khoá `terminal`, thư mục `stateRoot/terminal`.
- `CHANGELOG.md` `## [Unreleased]`: Added terminal-control (gom tab theo nhóm, tab mới không còn pane gốc rỗng, layout đo thật + policy `measured-split`), khoá cấu hình `terminal.*`, ba check doctor; Changed: các bước nối tiếp mở tab mới cùng nhãn khi tab cũ đã tự đóng (hội đồng §2.4); nhãn tab không còn dạng `fgos-lead-…`; Windows: cách terminal báo `unsupported` cho tới khi herdr có trên Windows.

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `src/setup/terminal-control-checks.mjs`, `test/setup/terminal-control-checks.test.mjs` |
| sửa | `src/setup/registrations.mjs`, `test/setup/checks.test.mjs`, `test/setup/visibility-checks.test.mjs` (nếu dựa vào `checkHerdrAvailable`) |
| tạo/sửa | `docs/platform/terminal-control/spec.md`, `docs/platform/component-boundary.md`, `docs/specs/reading-map.md`, `docs/specs/runner.md`, `docs/specs/distribution.md`, `CHANGELOG.md` |

## Test

Check chạy thật trên thư mục tạm: config hợp lệ/grace quá nhỏ/policy lạ/vắng; fake herdr có/không `pane layout`; herdr vắng → warn đúng chữ. `fgos convention check` trên doc mới.

Lệnh: `env -u ... FGOS_HOST_BIN=<build> node --test test/setup/terminal-control-checks.test.mjs test/setup/checks.test.mjs`.

## Tiêu chí nghiệm thu / rollback

Ba check trong `fgos doctor --json`; spec trả lời sáu câu L5. Rollback: revert (check chỉ đọc).
