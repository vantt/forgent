---
item: tsk-1gr
mode: tiny
---

# plan.md — tsk-1gr: decompose completeness advisory (locked decision → child footprint)

## Mode gate

0 cờ áp dụng (auth/authorization/data-model/audit-security/external-
systems/public-contracts/cross-platform/multi-domain — không cái nào).
"Existing covered behavior" cũng KHÔNG áp: thêm hàm MỚI cạnh
`footprintOverlapAmong`'s check đã có trong `decompose.mjs`, không sửa
hàm cũ, advisory-only (D1) nên không risk regression cho path hiện có.
"Weak proof around the area" cũng không — `test/intake/plan.test.mjs`
(84.5K) đã cover dày. **→ tiny.** Một file sản phẩm
(`src/intake/plan.mjs`) + test của nó, một tác vụ trực tiếp.

## Approach

Thêm hàm thuần `findUncoveredLockedDecisions(contextText, children)`
(tên cụ thể, có thể đổi khi implement — không phải quyết định khoá)
trong `src/intake/plan.mjs`, gọi ngay CẠNH
`footprintOverlapAmong`'s check đã có (cùng chỗ trong `verdict.children`
processing), theo đúng D1 (advisory, không chặn) + D2 (thuần cơ học):

1. Extract path-shaped token từ text mỗi D-ID trong `CONTEXT.md` của
   item cha (regex đơn giản: chuỗi con chứa `/` hoặc đuôi file quen
   thuộc).
2. Với mỗi token, `fs.existsSync` xác nhận là file thật — không thật
   thì bỏ qua token đó (D2: miễn khi không path).
3. Với token còn lại, kiểm xem có `child.footprint` nào (trong toàn bộ
   `verdict.children`) chứa đúng path đó không.
4. Không đứa nào chứa → advisory (gắn vào `reason`/log cùng cách
   `formatFootprintOverlapReason` đã làm cho collision, KHÔNG gọi
   `need-human`/park — D1).

Impact-analysis: `present` (GitNexus), Full — không có proof point nào ở
đây dựa vào blast-radius (thay đổi cô lập trong 1 file, advisory-only),
nên posture chỉ ghi nhận, không phải điều kiện chặn.

Không chạy `fgos graph --what-if` — item không chia, không có candidate
nào để so thứ tự.

### Risk map

| Thành phần | Rủi ro | Bằng chứng cần |
|---|---|---|
| `findUncoveredLockedDecisions` (mới) | Thấp — hàm thuần, advisory-only, không sửa code cũ | Test case cụ thể tsk-2ta-shape: CONTEXT.md text nêu path A→B, children footprint không đứa nào chứa A hoặc B → hàm trả về gap được gắn cờ. Test âm: children CÓ 1 đứa chứa path → không gắn cờ |

## Shape (tiny)

Một tác vụ trực tiếp: viết `findUncoveredLockedDecisions` +
gọi nó trong nhánh `verdict.children` của `decompose.mjs` (advisory
log, không đổi outcome `need-human`/`decompose` hiện có) + test 2 case
(có gap / không gap) trong `test/intake/plan.test.mjs`.

## Quyết định split

Không chia — 1 mảnh honest, không cần children thật. Verify:
`grep -q 'findUncoveredLockedDecisions\|footprintCoverageGap' src/intake/plan.mjs && node --test test/intake/plan.test.mjs`
(đã khoá qua `discover --force`, xem CONTEXT.md/friction log).

## Assumptions

- Tên hàm chính xác (`findUncoveredLockedDecisions` hay tên khác tương
  đương) — implementer chọn, không material.
- Regex path-shaped-token cụ thể — implementer chọn (D2 chỉ khoá
  nguyên tắc, không khoá regex).
