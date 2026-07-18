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

## Ranh giới tin cậy (bổ chú 2026-07-18, review-fix S11)

`title`/`description` trong một khối `fgos-discovered` là VĂN BẢN KHÔNG ĐÁNG TIN — do
chính worker (một trợ lý đang chạy, có thể bị chèn lệnh từ nội dung không đáng tin nó
đọc phải) tự soạn. Item runner tạo ra từ đó vào thẳng giai đoạn `clarify`, nơi
`title`/`description` nạp vào prompt của MODEL làm-rõ — đây là mặt tiếp xúc thứ hai
(sau chính worker) nơi văn bản không đáng tin chạm tới một model sẽ sinh ra lệnh chạy
được. Chấp nhận CÓ CHỦ Ý, không phải bỏ sót: giảm nhẹ đã có từ thiết kế gốc giữ nguyên
— `verify` KHÔNG BAO GIỜ do worker đặt (luôn `FALLBACK_VERIFY` rồi model/người ở bước
làm-rõ gán lại), nên văn bản worker không đáng tin không thể trực tiếp trở thành một
lệnh shell chạy được; item không mang niềm tin đặc biệt nào, đi qua đúng vòng xét-lại
như một item người tự khai. **Phương án đã cân nhắc, CHƯA XÂY:** một cửa xét-duyệt-người
bắt buộc trước khi một item runner-tự-tạo được dispatch tự động (thay vì vào thẳng
`clarify` như hôm nay) — đổi thiết kế lớn hơn phạm vi một P3 review-fix, ghi lại đây để
cân nhắc lại nếu bằng chứng chèn-lệnh thật xuất hiện.

## Bảo đảm giao-nhận (bổ chú 2026-07-18, review-fix S11)

Kênh này là **cố-gắng-tối-đa, tối-đa-một-lần** (best-effort, at-most-once) — KHÔNG PHẢI
ít-nhất-một-lần. Một report hợp lệ được `runner` phân tích thành công đúng MỘT LẦN, tại
kết cục cuối của lượt dispatch; nếu tiến trình runner chết giữa lúc phân tích và lúc
`addWork` ghi xong, report đó mất — không có cơ chế đối-soát-lại nào đọc lại output đã
lưu để phục hồi report đã mất. Xem spec Runner "Báo việc-phát-hiện từ trợ lý" / RUL45 (runner).

## Phương án đã cân nhắc và bỏ

- **Worker tự gọi `fgos add`.** Bỏ — phá vỡ runner-một-cửa-ghi (D3) và làm report
  của worker thành đường ghi không qua goal-check.
- **Truyền id việc đang chạy vào worker để nó tự stamp `discoveredFrom`.** Bỏ —
  vẫn là worker ghi; cùng vi phạm D3.
- **Parse trong mỗi lần retry.** Bỏ — một khối phát lại qua các lần thử sẽ đúc ra
  item trùng; parse một lần tại kết cục cuối là điểm đúng.
