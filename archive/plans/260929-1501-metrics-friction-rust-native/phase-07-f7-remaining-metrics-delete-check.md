---
phase: F7
title: "metrics runs/outcomes/entropy/snapshot; xoá check và entropy Node"
status: completed
priority: P1
effort: "1.5d"
dependencies: [F6]
---

# Phase F7: Hoàn tất namespace `metrics`; xoá phần đo lường Node cuối cùng

## Overview
Thêm các lệnh `metrics` còn lại để thay hẳn `check`. Theo single path, `check`, `src/report/entropy.mjs` và việc ghi lén history bị xoá **ngay trong phase này**. Xong F7, trong Node không còn phần đo lường nào của Observe.

## Requirements
- Lệnh (lane A):
  ```text
  fgos metrics runs      [--by executor|adapter|role] [--since]   chi tiết của mục runs trong harness
  fgos metrics outcomes  [<id>]                                   predicted vs actual, settlement, learning, nag thiếu outcome (từ Work source)
  fgos metrics entropy                                            điểm + delta so với snapshot gần nhất
  fgos metrics snapshot                                           ghi 1 dòng vào .fgos/observe/snapshots/<writerId>.jsonl (lệnh ghi duy nhất của metrics)
  ```
- <!-- Red Team 2026-09-29 --> **Map từng mục output của `check`** (`bin/fgos.mjs:852-868`) trước khi xoá: outcomes, settlement, learning, missing-outcome nag → `metrics outcomes` (anh chốt); entropy → `metrics entropy`; friction → `fgos friction`; changelog nag → xem dưới. Không mục nào bị mất mà không có quyết định.
- Work source (F6) được mở rộng để đọc từ `state.json` (không re-fold) `outcomes`, `settlements`, learning và các phần entropy cần: `missing-actual`, `stale-doing`, `stage-entry`, `awaiting-human`. `stage-entry` cần stage graph theo domain (`src/state/workflow-stage-graphs.mjs:538`): Node export entry stage theo domain ra file contract để Rust đọc, không port registry. <!-- Red Team 2026-09-29 --> Riêng `friction-unsettled` lấy từ source `friction` (F5). Trọng số port nguyên văn từ `src/report/entropy.mjs:59-64`.
- **Xoá trong cùng phase:**
  - verb `check` (registry, `bin/fgos.mjs`, `command-routes.json`);
  - `src/report/entropy.mjs`;
  - hàm ghi `entropy-history.jsonl` và `changelog-nag-history.jsonl` trong `bin/fgos.mjs` (khoảng dòng 750–835), cùng hai file đó và các key của chúng trong `src/state/fgos-file-registry.mjs`.
  - Changelog nag chuyển sang `doctor` **chỉ khi** còn consumer. Nếu không còn consumer thì xoá luôn.
- Plugin skill `/fgOS:check` (`plugins/fgOS/skills/check/SKILL.md`, viết tay): đổi thành `/fgOS:metrics`, trỏ tới `fgos metrics harness`.
- Sửa tham chiếu còn sống: `core/skills/_shared/catchup-self-recovery.md`, `domains/coding/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md` (path cũ `core/skills/...` sai; rồi `npm run build:skills`), `docs/how-to/check-rollup-progress.md`, `docs/architecture-map.md`, `docs/doc-registry.*`, `docs/specs/{work-state,runner,system-overview,reading-map}.md`, `docs/explanation/{branch-content-mismatch-fgos-exclusion,sync-root-error-propagation}.md`, `src/state/retrospective-doors.mjs:15`. Không sửa proof hay log lịch sử. <!-- Red Team 2026-09-29 -->
- <!-- Red Team 2026-09-29 --> Consumer code của `entropy.mjs`: `FINAL_STATUSES` (`bin/fgos.mjs:68`, dùng ở `:726`) chuyển về module Work; `src/evolve/iron-law.mjs:22` cộng test; `bin/fgos.mjs:293` (regex noise `entropy-history`); `test/state/fgos-logs-bucket.test.mjs:23`; `test/runner/merge.test.mjs:1851`; `test/test-ownership.mjs:49,52`.
- <!-- Red Team 2026-09-29 --> `metrics runs --by role` chỉ có khi F2 đọc được `role` từ `assignment.json`; không có thì bỏ tuỳ chọn này.

## Related Code Files
- Create: `packages/observe/rust/src/metrics_cli/{runs,outcomes,entropy,snapshot}.rs`
- Modify: `packages/work-state/rust/src/work_source.rs` (outcomes và các phần entropy), `src/cli/command-registry.mjs`, `bin/fgos.mjs`, `packages/host-runtime/contracts/command-routes.json`, `src/state/fgos-file-registry.mjs`, `plugins/fgOS/skills/check/` → `metrics/`, các tham chiếu kể trên
- Delete: `src/report/entropy.mjs`, cùng test của `check` và entropy history

## Implementation Steps
1. Chụp mốc: output đầy đủ của `node bin/fgos.mjs check` trên store hiện tại.
2. Viết các lệnh. So parity `metrics outcomes` và `metrics entropy` với mốc. Entropy chỉ được lệch ở phần friction (do luật `wontfix` mới), và phần lệch phải được ghi ra.
3. Xoá `check`, `entropy.mjs` và phần ghi history; sửa tham chiếu; build skills.
4. Chạy gitnexus `impact` cho các symbol bị xoá; chạy `npm test` và `cargo test --workspace`.

## Success Criteria
- [x] Parity outcomes khớp; entropy chỉ lệch đúng phần đã giải thích.
- [x] `fgos check` báo unknown verb; `grep -rn "fgos check\b" core plugins docs/how-to docs/explanation` không còn tham chiếu sống.
- [x] `metrics snapshot` ghi đúng một dòng; `metrics entropy` tính delta so với snapshot đó.

## Risk Assessment
- **Skill hay hook bên ngoài repo vẫn gọi `fgos check`.** Dấu hiệu: `invocation-faults` có `unknown-verb check` sau khi release. Cách xử lý: `metrics faults --class unknown-verb` được theo dõi trong tuần đầu, gặp thì sửa chỗ gọi (không thêm alias).
