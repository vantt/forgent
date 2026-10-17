# Phase 02: lõi — allocation record, map key↔pane, luật 7.4, ca lỗi 7.7

Wave 1. Nhánh `terminal-control/p02-core`, worktree `.claude/worktrees/tc-p02`. Phụ thuộc: P00. Code song song với P03/P04 qua trait `TerminalDriver` và `PlacementPolicy` định nghĩa ở đầu phase (P03/P04 cài đặt).

## Đọc trước

r6 §7.2, §7.3, §7.4, §7.6, §7.7, §7.9 bước 1–3, 5; [hội đồng §2.3, §2.4](../reports/architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md).

## Yêu cầu

Mô-đun trong crate:
- `port.rs`: kiểu request/result theo contract; trait `TerminalDriver` (một hàm mỗi khả năng + `capabilities()`), trait `PlacementPolicy`.
- `store.rs`: allocation store dưới `state_root()` của 4.2. Ghi record một lần (temp + `link`; `EEXIST` = key đã cấp → trả slot cũ nếu cùng incarnation, không cấp lại). Marker một lần cùng cách. Hint `groups/<groupKey>.json` ghi đè (chỉ là gợi ý; luôn kiểm sống trước khi dùng).
- `core.rs`:
  - `allocate`: nếu hint có pane sống của nhóm (driver `process.info`/`pane list`) → hỏi geometry + policy (P04) → `pane.split` neo trên pane sống; không có → `tab.create` và **dùng chính pane gốc của tab** làm slot (không root pane rỗng, 7.4.2). Sau tách, **đo lại**; dưới min → đóng chính pane rỗng vừa tạo (chưa launch) và mở tab mới cùng nhãn (7.9.3). Neo chết (`pane_not_found`) → tab mới cùng nhãn (7.4.3). Không có `layout.geometry` → luật hôm nay (tách neo, `down`, 0.3) + `maxPanesPerTab` theo số pane (7.9.5).
  - `launch`: marker `launch-requested` **trước** driver; driver `pane.run` (+ `activity` nếu có); xác định gốc process trong pane (logic `verifyForegroundProcessArgv` hôm nay, [`herdr-round.mjs:128`](../../src/runner/dispatch/herdr-round.mjs), dời vào Rust); identity `{pid, startTime, bootId, pgid}` qua `fgos-process`; marker `launched`.
  - `release(close)`: chỉ pane có record `origin: allocated` của đúng key; kiểm incarnation trước/sau (D1); không bao giờ đóng tab (7.4.5). `attach` → `release` chỉ gỡ gắn kết/nhãn. `retain(until)` → marker, không đóng.
  - `reconcile-scan`: duyệt record chưa `released`; chỉ báo (`launch-requested` không `launched` → giữ; slot chưa `launch-requested` quá `allocationGraceMs` + pane chỉ có shell trần → báo cho doctor; `retain` quá `until` + cùng incarnation + foreground không lạ → **được** đóng; mọi `unknown` → giữ). Record của incarnation khác incarnation hiện tại → đánh dấu vô hiệu.
- Nhãn chỉ là dữ liệu hiển thị: không đường code nào đọc nhãn để quyết định (test grep: core không gọi `tab list`/`pane list` để so nhãn).

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `packages/terminal-control/rust/src/{port.rs,store.rs,core.rs,identity.rs}`, `tests/{core_rules.rs,core_failures.rs,store_publish.rs}` |
| sửa | `packages/terminal-control/rust/{Cargo.toml,src/lib.rs}` (dep `fgos-process`, `fgos-holder-lock` cho `state_root`) |

## Test

Driver dùng trong test: **fake herdr binary thật** [`test/helpers/fake-herdr-pane.mjs`](../../test/helpers/fake-herdr-pane.mjs) qua driver herdr của P03 khi P03 đã vào (rebase), cộng một driver tối thiểu trong `tests/` cài trait trên thư mục tạm (cho phần store/marker không cần herdr). Ca:
1. Hai `allocate` cùng `groupKey` → cùng tab; khác `groupKey` → khác tab.
2. Tab mới: slot là pane gốc; không pane rỗng nào còn lại.
3. Neo đã đóng → tab mới cùng nhãn.
4. `release(close)` của key A không đóng pane của key B; không lời gọi `tab close` nào trong log fake herdr.
5. `allocate` lặp cùng key → cùng slot (idempotent), không tách thêm.
6. Ca lỗi 7.7: record `launch-requested` không `launched` → scan giữ; incarnation đổi → record cũ vô hiệu, `inspect` `unknown`/`gone`, không `close`.
7. Pane mới dưới min (fixture geometry nhỏ) → pane rỗng bị đóng, tab mới mở.

Lệnh: `cargo test -p fgos-terminal-control`.

## Tiêu chí nghiệm thu / rollback

Bảy ca xanh; core không có `cfg(target_os)` (khác biệt OS chỉ ở driver/`fgos-process`). Rollback: revert.
