---
phase: 2
title: "Bộ đọc ô tier và luật chọn model"
status: done
effort: 5h
---

# Phase 02: bộ đọc ô tier

## Bối cảnh

- `resolveTierModel` (`src/runner/dispatch/resolve.mjs:136-153`) trả về một
  chuỗi và ném lỗi khi ô thiếu hoặc không phải chuỗi.
- `validateModelPoliciesShape` (`src/runner/dispatch/config.mjs:1418-1437`)
  chỉ nhận chuỗi; `supportsPolicyTier` (`:1479-1481`) trả `false` cho mọi thứ
  không phải chuỗi.
- `sanitizeGlobalModelPolicies` (`config.mjs:268-292`) chỉ lọc tier lạ trong
  global, không lọc giá trị.
- `bind()` (`src/runner/execution/bind.mjs:421-433`) nuốt lỗi của
  `resolveTierModel` và rơi về `executorEntry.model` hoặc `"default"`.
- Bản fgOS cũ gặp danh sách trong global `modelPolicies` sẽ ném lỗi ở mọi
  project trên máy; gặp chuỗi có `@pool` thì truyền nguyên chuỗi làm model id.

## Việc làm

1. **Module thuần mới** `src/runner/dispatch/tier-cell.mjs`:
   `parseTierCell(cell, family)` trả về danh sách `{ model, pool, explicitPool }`.
   - Chuỗi: một mục. Mảng chuỗi khác rỗng: nhiều mục, giữ thứ tự.
   - Tách ở `@` cuối cùng; không có `@` thì `pool = family`.
   - Từ chối: mảng rỗng, phần tử không phải chuỗi, model rỗng, pool rỗng.
2. **Validator:** `validateModelPoliciesShape` nhận chuỗi hoặc mảng chuỗi qua
   `parseTierCell`. Trong global config, `sanitizeGlobalModelPolicies` bỏ mọi
   ô là mảng hoặc chứa `@`, và ghi một cảnh báo có tên ô. Bản mới không bao giờ
   đọc chúng từ global ở đợt này.
3. **`supportsPolicyTier`:** dùng `parseTierCell`; đúng khi ô có ít nhất một
   mục.
4. **`resolveTierModel`:** giữ nguyên chữ ký và kết quả cho các chỗ gọi cũ
   (`bind.mjs:424`, `assignment-policy.mjs:448`, `run.mjs:152`). Nó trả về
   model của **mục đầu tiên có `pool === family`**; không có mục nào như vậy thì
   ném lỗi `no model for tier ... in pool <family>`. Thêm
   `resolveTierCandidates(cfg, tier, family)` trả về toàn bộ danh sách cho
   `explain`.
5. **Thiếu ô thì từ chối:** trong `bind()`, khi `resolveTierModel` ném lỗi và
   executor không khai `model`, trả về từ chối có `reasonCode`
   `model-tier-missing`, kèm họ và tier, thay vì `"default"`. Chỉ làm bước này
   nếu baseline phase 00 không có binding nào ra `default`. Nếu có, ghi danh
   sách đó vào báo cáo phase và để bước này cho anh quyết.

## Kiểm chứng

- Test mới `test/runner/tier-cell.test.mjs`: chuỗi, mảng, `@` cuối
  (`claude-opus-4@20250514@vertex`), id có `@` nhưng không có pool, mảng rỗng,
  pool rỗng.
- Test validator: mảng trong project được nhận; mảng và `@` trong global bị
  lọc có cảnh báo; chuỗi cũ không đổi.
- `bind-committed-config.test.mjs` khớp baseline phase 00 (sau thay đổi của
  phase 01).
- Test `bind()`: ô `["x@other", "y"]` cho họ `f` chọn `y`; ô chỉ có
  `x@other` thì bị từ chối `model-tier-missing`.
- `npm test` xanh.

## Kết quả (2026-10-17)

- `src/runner/dispatch/tier-cell.mjs`: `parseTierCell`, `isExtendedTierCell`.
  `resolve.mjs`: `resolveTierCandidates` (cả danh sách) và `resolveTierModel`
  (mục đầu tiên có `pool === family`). Validator, sanitizer global và
  `supportsPolicyTier` đọc qua `parseTierCell`.
- **Lệch plan, có chủ ý:** `supportsPolicyTier` đúng khi ô có một mục thuộc
  pool của chính họ (cùng mục `resolveTierModel` trả), không phải "ít nhất một
  mục bất kỳ"; hàm không có chỗ gọi production, docstring của nó là "trả lời
  trước điều `resolveTierModel` sẽ làm mà không ném lỗi".
- **Bước 5 (thiếu ô thì từ chối) chưa làm.** Baseline config repo không có dòng
  `default`, nhưng toàn suite cho thấy 89 test ở ~20 file dựa vào lối rơi về
  `executorEntry.model ?? "default"`: fixture tối giản không khai
  `modelPolicies`, và hai check doctor chạy `bind()` trên config người dùng
  (`workflow-pool-independence`, `executor-posture-coverage`). Ép từ chối sẽ
  làm hỏng project khác đang dùng fgOS mà không khai đủ ô. Giữ lối rơi; câu
  hỏi cho anh nằm trong báo cáo cuối đợt. Ô chỉ có mục pool khác được coi như
  thiếu ô (rơi về như cũ, không bao giờ chạy model của pool khác).
- `bind()` trên 608 dòng baseline: 0 dòng khác so với `main` sau phase 01.
- impact-analysis: inactive (0 provider); người gọi dò bằng `rg`: 7 chỗ gọi
  `resolveTierModel`, chữ ký và kết quả với ô chuỗi không đổi; không config
  nào (project, global của máy này) có id chứa `@`.

## Rủi ro

- **Trung bình:** `resolveTierModel` có ba chỗ gọi. Kết quả với chuỗi cũ
  không đổi; test baseline là bằng chứng.
