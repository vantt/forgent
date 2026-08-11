---
item: tsk-3uz
mode: tiny
---

# plan.md — tsk-3uz: fgos-coding-planning's split step gets --footprint guidance

## Mode gate

0 cờ áp dụng — thuần sửa văn bản 2 file skill (dual-root, cùng nội
dung), không đụng code, không schema, không hành vi runtime nào đổi.
**→ tiny.**

## Approach

Sửa bước 5 ("Decide the split") ở CẢ HAI dual-root:
`.claude/skills/fgos-coding-planning/SKILL.md` và
`.agents/skills/fgos-coding-planning/SKILL.md` (đồng bộ nội dung — dual-root
apply đã là quy ước sẵn có trong repo, không phải quyết định mới của
item này). Thêm 1 câu hướng dẫn ngay sau đoạn "carries this item's own
id as its parent" hiện có: LUÔN kèm `--footprint` khi gọi `fgos add
--parent`, lấy từ danh sách file đã liệt trong chính `plan.md`'s
Approach/Shape cho piece đó — cộng 1 ví dụ lệnh cụ thể minh hoạ.

Không chạy `fgos graph --what-if` — không có candidate nào để so, item
không chia.

Impact-analysis: `present`/Full — không có proof point dựa blast-radius
ở đây (sửa văn bản, không sửa code).

### Risk map

| Thành phần | Rủi ro | Bằng chứng cần |
|---|---|---|
| Đồng bộ 2 file dual-root | Thấp | Cả 2 file có cùng đoạn hướng dẫn mới sau khi sửa (diff giống hệt phần thêm) |

## Shape (tiny)

Một tác vụ trực tiếp: sửa 1 đoạn văn bản, đồng bộ 2 file.

## Quyết định split

Không chia — 1 mảnh honest. Verify: `awk '/Decide the split/,0' .claude/skills/fgos-coding-planning/SKILL.md | grep -q -- '--footprint' && awk '/Decide the split/,0' .agents/skills/fgos-coding-planning/SKILL.md | grep -q -- '--footprint'` (đã khoá qua `discover --force`, xem CONTEXT.md/friction log).

## Assumptions

- Câu chữ chính xác của đoạn hướng dẫn mới — implementer chọn, không
  material (CONTEXT.md D2 chỉ khoá nguyên tắc "luôn điền từ file list
  đã có", không khoá văn phong).
