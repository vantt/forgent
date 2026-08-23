---
item: tsk-5ay
mode: standard
---

# plan.md — tsk-5ay: dời mode-gate sang fgos-routing + kỷ luật truy-nguồn vào Gate

## Mode gate

| Cờ | Áp dụng? | Vì sao |
|---|---|---|
| auth/authorization/data-model/audit-security/external-systems/public-contracts/cross-platform/multi-domain | Không | — |
| existing covered behavior | **Có** | Dời mode-gate đổi LUỒNG HIỆN CÓ mọi phiên `fgos-coding-planning` từng chạy qua — mọi session tương lai đi qua đường mới (routing quyết trước, không phải planning quyết sau khi đã nạp) |
| weak proof around the area | **Có** | Skill prose không có automated test suite (khác code) — chứng minh "đúng" chỉ bằng grep cấu trúc văn bản + đọc lại logic, không chạy được test hành vi thật |

**2 cờ → standard.**

## Approach

**Đã chọn:** 2 phase trong CÙNG 1 item (không chia con) — cả hai nhỏ,
liên quan chặt (cùng chủ đề tái cấu trúc `fgos-coding-planning`), touch chung 2
file skill (mỗi file × 2 dual-root = 4 file text thật).

**Đã loại:** chia thành 2 item con riêng (D1/D2) — từ chối vì cả hai đủ
nhỏ để làm cùng lúc, tách ra chỉ thêm overhead tracking không cần thiết
cho quy mô này (khác `tsk-66o` — nơi 2 mảnh có thuật toán MỚI thật sự
độc lập, đáng tách).

`fgos graph --json`: `tsk-5ay` không nằm trong `criticalPath`/`topUnblock`
top-5 — không việc nào chờ nó. Không chạy `--what-if` vì không chia con.

Impact-analysis: `present`/Full — không proof point nào dựa blast-radius
(sửa văn bản skill, không sửa code product).

### Risk map

| Thành phần | Rủi ro | Bằng chứng cần |
|---|---|---|
| D1: dời mode-gate sang `fgos-routing` | Trung bình — đổi luồng hiện có, phải giữ NGUYÊN nội dung logic (mechanical flag-count), chỉ đổi VỊ TRÍ | Đọc lại `fgos-coding-planning/SKILL.md`'s bước 2 gốc trước khi xoá, xác nhận nội dung mới trong `fgos-routing` giữ đúng 100% logic đếm cờ (không diễn giải lại) |
| D2: thêm rule truy-nguồn vào Gate | Thấp — chỉ thêm 1 rule mới, không sửa logic Gate hiện có (auto-approve/ask vẫn y hệt) | Đọc lại Gate step sau sửa, xác nhận nhánh `true`/`false` không đổi, chỉ thêm rule độc lập |

## Shape (standard — phased)

**Phase D1 — dời mode-gate:**
1. Xoá bước 2 ("Mode gate (mechanical, not vibes)") khỏi `fgos-coding-planning/
   SKILL.md` (cả 2 dual-root: `.claude/skills/` + `.agents/skills/`) —
   đánh số lại các bước còn lại (2-6 → 1-5... hoặc giữ số cũ tuỳ
   implementer, không material).
2. Thêm logic ĐÚNG NGUYÊN VĂN (đếm cờ, ngưỡng tiny/small/standard/
   high-risk/spike) vào `fgos-routing/SKILL.md`'s bước Orient — TRƯỚC
   khi router quyết định skill nào để load.
3. `fgos-coding-planning`'s Bootstrap (bước 1 cũ) đọc mode đã quyết từ
   `fgos-routing` truyền qua (cơ chế truyền — arg, prose context, hay
   field — implementer chọn, D1 không khoá).

**Phase D2 — kỷ luật truy-nguồn:**
1. Thêm 1 rule vào Gate step của `fgos-coding-planning/SKILL.md` (cả 2
   dual-root): "mỗi câu trong phần trình bày plain-language phải trỏ
   được về đoạn cụ thể của `plan.md`/`CONTEXT.md`; không trỏ được thì
   thành Open Question, không tự khẳng định."
2. Không đổi logic auto-approve/ask hiện có — rule mới là ĐIỀU KIỆN
   THÊM cho nội dung câu trình bày, không phải nhánh mới.

## Quyết định split

Không chia — 1 mảnh honest, 2 phase nội bộ. Verify (đã khoá qua
`gate-approve contextApprove`, xem CONTEXT.md):
`! grep -q 'Mode gate (mechanical' .claude/skills/fgos-coding-planning/SKILL.md && grep -qE 'lane|mode.gate' .claude/skills/fgos-routing/SKILL.md && grep -qE 'truy.nguồn|trace back to|Open Question' .claude/skills/fgos-coding-planning/SKILL.md`

## Assumptions

- Cơ chế truyền mode đã quyết từ `fgos-routing` sang `fgos-coding-planning`
  (arg CLI, prose trong hand-off message, hay field mới) — implementer
  chọn, không material (D1 chỉ khoá VỊ TRÍ tính mode, không khoá cách
  truyền).
- Đánh số lại các bước còn lại trong `fgos-coding-planning/SKILL.md` sau khi
  xoá bước 2 — implementer chọn thứ tự trình bày, không đổi nội dung.
