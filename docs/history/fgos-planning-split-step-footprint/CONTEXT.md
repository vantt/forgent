---
item: tsk-3uz
stage: clarify
docsRef: docs/history/fgos-coding-planning-split-step-footprint/
---

# CONTEXT — tsk-3uz: fgos-coding-planning's split step không set --footprint cho con

## Feature boundary

`fgos-coding-planning/SKILL.md`'s bước 5 ("Decide the split") tạo item con qua
`fgos add --parent <id>` khi shape cần chia nhỏ, nhưng văn bản skill
chưa bao giờ hướng dẫn dùng `--footprint` — xác nhận bằng grep: chữ
"footprint" không xuất hiện ở đâu trong `fgos-coding-planning/SKILL.md` (STR92
audit 2026-07-23, ý (2); tái xác nhận 2026-08-05 lúc `tsk-66o`'s
fgos-coding-planning). Sửa văn bản bước 5 để LUÔN điền `--footprint` từ danh
sách file đã có sẵn trong `plan.md`'s Approach/Shape khi tạo con.

**Ngoài scope:** cơ chế `--footprint` bản thân nó (schema, `fgos add`
flag, `footprintOverlapAmong`/`footprintConflicts` advisory) đã tồn tại
và hoạt động — xác nhận thật bằng cách dùng nó tạo `tsk-3c7`/`tsk-2ig`
(con của `tsk-66o`, cùng phiên trước đó). Item này KHÔNG đụng code, chỉ
sửa văn bản hướng dẫn.

## Locked decisions

| D-ID | Summary | Rationale |
|---|---|---|
| D1 | Fix thuần skill-prose — sửa `fgos-coding-planning/SKILL.md`'s bước 5, không đụng code | Cơ chế `--footprint` đã hoạt động thật; gap chỉ là SKILL.md chưa hướng dẫn dùng nó |
| D2 | Footprint giữ OPTIONAL ở tầng hệ thống (không đổi convention chung), nhưng bước 5 đổi thành LUÔN điền `--footprint` từ file list đã có sẵn trong `plan.md`'s Approach/Shape khi tạo con | Cùng khuôn bước 5 đã bắt buộc verify thật không placeholder — planning luôn biết file con sẽ chạm vì đã viết ra rồi, không lý do bỏ trống |

## Pinned terms

Không có thuật ngữ mới — dùng nguyên `footprint` đã định nghĩa trong
`docs/specs/work-state.md`.

## Scout evidence

- `grep -n "footprint" .claude/skills/fgos-coding-planning/SKILL.md` → 0 kết quả (fresh, 2026-08-05).
- `docs/backlog.md` STR92 (2026-07-23): audit gốc nêu chính xác gap này (ý (2)), đánh dấu "done" ở tầng AUDIT, chưa có fix.
- Bằng chứng cơ chế hoạt động: `fgos add --parent tsk-66o --footprint "..."` đã chạy thật, tạo `tsk-3c7`/`tsk-2ig` thành công (cùng phiên, task trước).
- Impact-analysis capability: `present` (GitNexus), Full mode.

## Canonical references

- `docs/history/parallel-decomposition-footprint-avoidance/DISCUSSION.md` — nơi gap này được đặt tên (D6 của `tsk-66o`, tách thành `tsk-3uz` sibling).

## Outstanding questions deferred to planning

- Cách trình bày cụ thể trong SKILL.md (thêm ví dụ lệnh, hay thêm 1 câu bullet, hay cả hai) — implementer/planning chọn, không material.
