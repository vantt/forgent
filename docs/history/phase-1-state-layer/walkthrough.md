# Walkthrough — Phase 1 State Layer

Feature: `phase-1-state-layer` · Review: `review-phase-1-state-layer-260714` (approved 2026-07-14, P1=0 · P2=4 · P3=7, UAT pass) · Dựng lại từ cell traces + review findings + UAT record, không phải từ plan.

## What shipped

- CLI **`fgos`** — cửa ghi duy nhất của work-state forgent: `init` · `add` · `move --expect` · `decision --text` · `list` · `rebuild` (`bin/fgos.mjs`, commit `2777ee9`).
- Nhật ký sự kiện append-only `.fgos/events.jsonl` là truth (committed); `.fgos/state.json` là view gitignored, dựng lại được từ replay (`d076765`, `7828cd5`).
- FSM: `todo → doing → done` + `blocked` hai chiều; `done` terminal một cửa vào; transition có precondition + CAS expected-status; fsm/replay thuần không ghi file — store.mjs là chủ ghi duy nhất, event trước view sau.
- Mã thoát theo phạm trù: 0 ok · 2 precondition · 3 conflict · 4 validation · 5 corrupt-log · 1 unexpected.
- Hạ tầng: package zero-dep + node:test (`e034e3b`), suite 71 test gồm e2e chạy binary thật (`31c1300`), spec `docs/specs/work-state.md`.

## How it was verified (bằng chứng thật đã ghi)

- Mỗi cell cap với verify output thật trong trace: cell 2 "25 pass/0 fail", cell 3 "50 pass/0 fail", cell 4 "17 pass + full suite 68", cell 5 "71 pass/0 fail"; cả 4 cell behavior-change có red-before; 0 frozen-judge hit. Orchestrator tự chạy lại verify của từng cell (không tin lời worker).
- Review độc lập 5 reviewer (opus, ngữ cảnh cô lập) + cổng bằng chứng: 5 bất biến khóa xác minh trên source; 17/17 artifact EXISTS+SUBSTANTIVE+WIRED; không spec-drift.
- UAT (user xác nhận pass, transcript trong session): add unicode → move CAS pass → CAS đụng exit 3 → decision → xóa view → rebuild giống hệt (`True`) → corrupt tail exit 5.
- Chưa kiểm chứng (nêu thẳng, không làm mượt): recovery với view *lệch còn tồn tại* chỉ được probe tay bởi reviewer, chưa có test trong suite (P2 #3); exit 1 (unexpected) không có test; multi-writer nằm ngoài phạm vi theo tiền đề L3.

## How to test it yourself

```bash
cd $(mktemp -d)
node /path/to/forgent/bin/fgos.mjs init
node /path/to/forgent/bin/fgos.mjs add viec-dau --title "Việc đầu" --kind feature --risk low --verify "npm test"
node /path/to/forgent/bin/fgos.mjs move viec-dau --to doing --expect todo   # exit 0
node /path/to/forgent/bin/fgos.mjs move viec-dau --to done --expect todo    # exit 3 — CAS đụng
rm .fgos/state.json && node /path/to/forgent/bin/fgos.mjs rebuild           # view dựng lại nguyên vẹn
printf '{"hong' >> .fgos/events.jsonl && node /path/to/forgent/bin/fgos.mjs list; echo $?  # exit 5
```

## Deviations from plan

- Verify của cells 2/3/4 đổi từ `node --test <thư mục>` sang dạng glob giữa swarm — Node 24 không nhận directory arg (worker chẩn đoán + tái hiện độc lập; cell 2 bị block rồi rescue).
- `scripts.test` được quote lại ở cell 4 sau khi cell 2 phát hiện sh-glob nuốt mất smoke test (npm test 51→68 tests trong cùng commit).
- Cell 1 scope glob test để tránh quét `upstreams/` (test vitest của repo tham chiếu fail dưới node:test).
- Verb `init` được thêm ngoài danh sách 5 verb của plan — bootstrap primitive trong phạm vi, architecture reviewer xác nhận không phải scope creep.
- Hai lần hand-edit `.bee/` đúng thủ tục (thiếu verb config-commands và reopen-blocked-cell) — friction đã log từng lần.

## Known limitations / follow-ups (backlog, không chặn)

- **P2 ×4:** `move` để lọt cờ trống sang exit 2/3 thay vì 4 (corroborated ×2 reviewer) · taxonomy exit-code rải 5 file, category mới âm thầm về 1 · thiếu test view-lệch-còn-tồn-tại · `validateWork` chưa ràng status vào STATUSES (lib-level). → lô fix trước Phase 2 (user đã chốt).
- **P3 ×7 + 1 mỹ phẩm:** proto-key hardening, error facade qua store, header store overclaim, O(n)×3/mutation (trade có chủ đích — không sửa trước ngưỡng), test corrupt-middle/done-via-CLI/exit5-mutation/dep-cycle, `--help`, JSON stdout cho mutation, "event #undefined" trong message move.
- Chi tiết: `reports/review-session-findings.md` + `.bee/reviews/review-phase-1-state-layer-260714.json`.
