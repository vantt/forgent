---
title: Kênh báo-cáo-không-ghi worker→runner cho discovered-from
date: 2026-07-18
status: accepted
source_decisions: [f176c18a]
supersedes: []
relates_specs: [work-state, runner]
---

# 0013 — Kênh báo-cáo-không-ghi (worker→runner) cho `discovered-from`

## Bối cảnh

work-graph-intelligence S2b thêm `discoveredFrom` — một trường lineage phi-chặn
ghi lại "việc này lộ ra trong lúc làm việc kia". Trường đã có hai nhà sản xuất:
(A) cờ tường minh `fgos add/submit --discovered-from <id>` (người/agent gọi tay,
cell wgi-7); (B) **tự động từ runner** — khi một worker đang chạy một việc phát
hiện ra một đơn vị công việc mới đáng tồn tại riêng.

Nhà sản xuất (B) va thẳng vào một bất biến đã khoá: **runner là nhà ghi duy nhất**
trong suốt một lượt dispatch (C2/D3). Prompt của worker cấm nó gọi `fgos` hay ghi
`.fgos/` (`dispatch.mjs`), và lượt spawn không truyền cho worker id của việc đang
chạy dưới dạng ngữ cảnh ghi được. Nếu để worker tự tạo item, ta phá vỡ
runner-một-cửa-ghi và mất luôn tính tái lập của goal-check (chỉ `verify` mới phán
việc worker làm, không phải report của nó).

## Quyết định

Phát minh một **kênh báo-cáo-không-ghi** (report-not-write) giữa worker và runner,
mở rộng hợp đồng C3 (orchestrator ↔ worker) — không supersede gì:

1. **Worker chỉ báo cáo, dữ liệu thuần.** Prompt dispatch mô tả một kênh: worker
   CÓ THỂ phát một hay nhiều khối rào `fgos-discovered` trong output của nó
   (JSON: `title` bắt buộc; `kind`/`risk`/`description` tuỳ chọn) để nêu một việc
   mới phát hiện. Đây là dữ liệu, KHÔNG phải lệnh ghi — worker vẫn KHÔNG BAO GIỜ
   gọi `fgos` hay chạm `.fgos/`. Ràng buộc D3 giữ nguyên từng chữ.

2. **Runner đọc và tự ghi.** `loop.mjs` `dispatchClaimedItem` parse các khối
   `fgos-discovered` từ output đã bắt của worker **đúng một lần mỗi lượt dispatch,
   tại kết cục cuối** (không parse trong mỗi lần retry — nếu không một khối lặp
   lại sẽ đúc ra item trùng qua `generateId`). Parse phủ **cả hai** nguồn output:
   `worker.stdout` (đường thành-đề-xuất/chấm-trượt) VÀ `err.stdout` (đường
   quá-giờ/hỏng-spawn — một worker quá giờ vẫn có thể đã nêu việc).

3. **Parse là an-toàn-hỏng (fail-safe).** Khối méo/thiếu `title`/không phải object
   → log rồi bỏ qua; parser KHÔNG BAO GIỜ throw, KHÔNG BAO GIỜ đổi kết cục của
   worker hay luồng điều khiển của dispatch. Một report méo không bao giờ làm
   trật một lượt dispatch.

4. **Item tạo ra có hình dạng như một `submit` tươi.** `generateId(title)` +
   `classify(title)` cho tier/kind/risk (giá trị trong khối ghi đè), một `verify`
   placeholder DÙNG CHUNG (`FALLBACK_VERIFY` từ `discovery.mjs` — không nhân bản
   literal), `status: 'todo'`, `stage: 'clarify'` (để context-discovery sau đó gắn
   `verify` thật, y như một item submit), `deps: []`, `refs: []`,
   `discoveredFrom = item.id` của việc đang chạy. Mọi lần ghi đi qua
   `queue.enqueue` (cửa ghi tuần-tự-hoá), không bao giờ `addWork` thô — an toàn
   fan-out.

## Hệ quả

- **Runner vẫn một-cửa-ghi (D3).** Worker phát dữ liệu; RUNNER ghi. Không có
  đường ghi song song mới nào mở ra.
- **`discoveredFrom` là lineage phi-chặn** — loại khỏi cycle-check theo thiết kế
  (nó không phải cạnh phụ-thuộc), cưỡi `SCHEMA_VERSION` 2 (trường lazy additive).
- **C3 mở rộng, có tên, không sửa ngầm.** architecture-map v0.3 → v0.4: hàng C3
  thêm mệnh đề kênh khám-phá; §11 changelog ghi delta. Không module mới, không
  row §6/manifest mới — `loop.mjs`/`dispatch.mjs` mở rộng tại chỗ.

## Phương án đã cân nhắc và bỏ

- **Worker tự gọi `fgos add`.** Bỏ — phá vỡ runner-một-cửa-ghi (D3) và làm report
  của worker thành đường ghi không qua goal-check.
- **Truyền id việc đang chạy vào worker để nó tự stamp `discoveredFrom`.** Bỏ —
  vẫn là worker ghi; cùng vi phạm D3.
- **Parse trong mỗi lần retry.** Bỏ — một khối phát lại qua các lần thử sẽ đúc ra
  item trùng; parse một lần tại kết cục cuối là điểm đúng.
