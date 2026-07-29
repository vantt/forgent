---
type: explanation
title: 0023 — Đổi tên status `proposed` thành `awaiting-approval`
tags: []
timestamp: 2026-07-29T00:00:00.000Z
source_capture_ids: []
date: 2026-07-29
status: accepted
supersedes: [0006]
relates_specs: [work-state]
---

# 0023 — Đổi tên status `proposed` thành `awaiting-approval`

## Bối cảnh

`0006` đặt tên status `proposed` cho trạng thái "goal-check đạt, đề xuất nằm
trên nhánh chờ duyệt". Quan sát người dùng (2026-07-28, `tsk-66l`): `proposed`
là danh từ trừu tượng, không tự nói "chờ gì" — khác 5 trong 7 status còn lại
(`todo`/`doing`/`blocked`/`done`/`wontfix`), vốn tự-giải-nghĩa hoặc có tiền lệ
ngành (GitHub/Jira). `awaiting-human` đã có convention `awaiting-*` cho trạng
thái chờ; `proposed` là ngoại lệ duy nhất không theo convention đó.

Xác nhận qua đọc code (không suy đoán): FSM chứa `proposed` là domain-agnostic
— `test/e2e/synthetic-domain.test.mjs` chứng minh domain `synthetic` (không
dùng git/merge) cũng đi qua đúng status này. Vậy một tên gắn nghĩa "merge"
(`awaiting-merge`) sẽ SAI bản chất — hardcode ngữ nghĩa domain `coding` vào một
field lẽ ra domain-agnostic.

`proposed` còn là từ vựng DÙNG CHUNG giữa hai field: `work.status` VÀ
`outcome.actual.outcome`/disposition (`docs/specs/work-state.md` Data
Dictionary #4 và O4 cùng dùng chuỗi này cho cùng 1 khái niệm) — đổi một nơi mà
bỏ nơi kia sẽ tái tạo đúng khoảng ambiguity giữa 2 field lẽ ra đồng nghĩa.

## Quyết định

Đổi tên giá trị `proposed` → `awaiting-approval`, đồng nhất ở CẢ HAI nơi dùng
chung từ vựng: `work.status` (1 trong 7 giá trị enum, `src/state/work.mjs`
`STATUSES`) và `outcome.actual.outcome`/`outcome.predicted.outcome`. Không đổi
FSM edges (`blocked→X`, `doing→X`, `X→done`, `X→todo`, `X→blocked` giữ nguyên
cấu trúc — chỉ đổi TÊN của `X`) — `0006`'s thiết kế FSM vẫn nguyên vẹn, record
này chỉ supersede THUẬT NGỮ, không phải cạnh chuyển trạng thái.

Migration: dưới miễn trừ pre-release cho RUL11 đã có tiền lệ (`0019`,
`package.json` version `0.1.0`, miễn trừ còn hiệu lực tới v1.0.0), viết
`scripts/migrate-status-proposed-to-awaiting-approval.mjs` (theo đúng khuôn an
toàn của `scripts/migrate-actor-to-role.mjs`: single-path, backup bắt buộc,
dry-run, seq-contiguity check) để ghi đè tại chỗ 3 kho `.fgos` trong phạm vi
`0019` (kho sống dùng chung, `dogfood-fixture/.fgos`, `fgos-test-drive/.fgos`)
— KHÔNG đụng `test/fixtures/phase1-events.jsonl` (đã đo: 0 chỗ chứa
`"proposed"`, loại trừ vô hại).

## Hệ quả

- Mọi consumer đọc `.status === 'proposed'` hoặc `.outcome === 'proposed'`
  phải đổi sang `'awaiting-approval'` cùng lúc với migration — không có
  compat-shim vĩnh viễn trong `replay.mjs`.
- Dry-run migration script phát hiện kho sống mang một corruption seq-trùng
  lịch sử đã biết trước (`src/state/events.mjs:25`,
  "spike-confirmed duplicate-seq corruption") — không liên quan tới rename
  này, chặn Pha B trên riêng kho sống cho tới khi ai đó xử lý riêng; không
  chặn `dogfood-fixture`/`fgos-test-drive` (dry-run sạch trên cả hai).
- `0006` không sửa tại chỗ — vẫn đúng nguyên văn lịch sử của nó (chỉ nhận thêm
  `superseded_by: 0023` trong frontmatter, đúng khuôn STR72 trỏ-ngược-bắt-buộc);
  record này khai `supersedes: [0006]` — supersede MỘT PHẦN (thuật ngữ), không
  phải toàn bộ thiết kế FSM của `0006`.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
