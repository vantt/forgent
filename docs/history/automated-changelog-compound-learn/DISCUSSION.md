# Automated CHANGELOG capture wired into compound-learn — Discussion

## 1. Trạng thái hiện tại

Vòng 2. Vòng 1 nêu 4 câu hỏi (A-D). Vòng 2: A/B/C đã có câu trả lời đầu
tiên (root / (a) mở rộng fgos-compounding / đồng ý Unreleased) — CHƯA
mint D-ID (mới 1 vòng, theo luật "không chốt từ 1 câu trả lời"), chờ xác
nhận lại vòng sau. D chưa trả lời được (câu hỏi chưa đủ cụ thể) — đã viết
lại kèm ví dụ cụ thể ở §3. Phát sinh thêm 1 điểm lớn chưa có trong phạm vi
ban đầu: tầm nhìn chiến lược của chủ sản phẩm cho compound-learn (điểm E,
§3) — cần quyết định RIÊNG xem có nằm trong scope `tsk-12m` hay chỉ là bối
cảnh định hướng cho các item sau này.

## 2. Mục tiêu & đề bài

`tsk-12m` đề xuất: khi một work item mang thay đổi user-visible (CLI flag
mới, lệnh mới, breaking change, đổi hành vi) đi qua bước retrospective
(cùng lúc `fgos-compounding` đang chạy phân loại Diataxis), fgOS tự động
ghi lại một dòng changelog thay vì để một file `CHANGELOG.md` bị bỏ quên
(hiện repo hoàn toàn không có file này dù `package.json` đứng yên `0.1.0`
qua hàng chục feature đã merge — phát hiện từ audit install/setup/doctor
2026-08-07). Bản tự động PHẢI tái dùng đúng kỷ luật ghi-tài-liệu hiện có
của compound-learn (viết+commit trước, tag sau — D1/D3 của
retrospective-doc-write-path) thay vì phát minh luồng ghi riêng, và
KHÔNG được nhét changelog vào enum `DIATAXIS_DOC_TYPES` bốn-quadrant hiện
có (category error — changelog không phải tutorial/how-to/reference/
explanation). Đây là việc theo sau, không khẩn — interim thật (bootstrap
tay `CHANGELOG.md` theo format Keep a Changelog) đã quyết làm riêng, không
thuộc phạm vi thảo luận này.

## 3. Vấn đề rõ / chưa rõ

| # | Điểm | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Không nhét vào `DIATAXIS_DOC_TYPES`/`QUADRANT_META` | RÕ | Hard rule của `fgos-compounding` SKILL.md xác nhận trực tiếp: "Do not invent a fifth Diataxis quadrant or blend two" |
| 2 | Ghi nội dung trước, tag sau, chỉ tag khi đã commit ở HEAD | RÕ | `compound` verb's D3 check (`git cat-file -e HEAD:<path>`) — bất kỳ đường ghi mới nào cũng phải theo đúng thứ tự này |
| 3 | Model "grow vs create" (additive, không xoá/rút gọn) | RÕ, tái dùng được | Khớp tự nhiên bản chất changelog — mỗi entry cộng dồn |
| A | Vị trí file `CHANGELOG.md` | TRẢ LỜI V2 (chưa D-ID) | Chốt: repo root (`CHANGELOG.md`), đúng chuẩn ngành. Hệ quả kỹ thuật: `fgos-compounding` SKILL.md hard rule hiện ghi thẳng "Do not write the end-user document anywhere outside `docs/<quadrant>/`" — chọn root nghĩa là phải SỬA CÂU CHỮ hard rule đó (thêm exemption tường minh cho changelog), không phải chỉ viết code né luật — nếu không sửa, changelog tự động sẽ vi phạm chính luật do chính skill này đặt ra |
| B | Điểm quyết "có đáng ghi changelog không" nằm ở đâu | TRẢ LỜI V2 (chưa D-ID) | Chốt hướng (a): mở rộng `fgos-compounding`. Xem thêm điểm E — nếu tầm nhìn multi-audience là thật, (a) nên được thiết kế thành **registry mở-rộng-được** (tiền lệ `registerCheck`/`registerFix`/`registerConfigDefault` trong `src/setup/registrations.mjs`, đã chứng minh hoạt động cho doctor/setup) thay vì if/else cứng riêng cho changelog — để audience thứ 3 (marketing-storytelling) sau này cắm vào cùng chỗ, không phải sửa lại logic lõi lần nữa |
| C | Version heading cho entry mới | TRẢ LỜI V2 (chưa D-ID) | Đồng ý: ghi vào `## Unreleased`, cắt-release (bump version + đổi heading) là bước thủ công riêng, ngoài phạm vi `tsk-12m` |
| D | "User-visible" định nghĩa bằng gì (viết lại rõ hơn) | CHƯA RÕ | Ví dụ cụ thể: thêm 1 flag mới cho `fgos doctor` → user thấy, đáng 1 dòng changelog. Đổi tên biến nội bộ trong `src/state/store.mjs` không đổi hành vi ra ngoài → không đáng. Ai/cái gì vẽ ranh giới này cho TỪNG item cụ thể? 2 lựa chọn: **D1** máy tự đoán bằng heuristic file-touched (rẻ nhưng sai nhiều — sửa nội bộ trong `bin/fgos.mjs` vẫn đụng đúng "file CLI" dù không đổi hành vi ra ngoài); **D2** session tự phán đoán có bằng chứng ngay lúc retrospective, cùng kỷ luật với chọn quadrant hiện tại (không mặc định, không coin-flip) — nếu vậy D gần như là hệ quả tự nhiên của B(a), không phải câu hỏi tách rời. Anh nghiêng D1 hay D2? |
| E | Tầm nhìn compound-learn đa-audience (marketing-storytelling, chất liệu kể chuyện) | MỚI, CHƯA RÕ PHẠM VI | Chủ sản phẩm (2026-08-07): compound-learn là chiến lược quan trọng — về sau muốn nhiều LOẠI tài liệu hơn, phục vụ nhiều audience hơn, kể cả nội dung marketing-storytelling cho người dùng fgOS để phát triển sản phẩm; hệ thống nên ghi nhận chi tiết/chất liệu và tự phát hiện ý tưởng kể chuyện. Đây RÕ RÀNG lớn hơn phạm vi changelog của `tsk-12m`. Câu hỏi cần quyết: `tsk-12m` có tự xây luôn phần MÓNG tổng quát (registry đa-audience, xem gợi ý ở dòng B) hay chỉ xây changelog thật gọn, để móng tổng quát thành item riêng sau (đúng YAGNI — hiện mới có 1 use case thật là changelog, audience thứ 2 (marketing) chưa có yêu cầu cụ thể nào để thiết kế theo)? Khuyến nghị của em: làm changelog trước theo interface hẹp nhưng KHÔNG khoá cứng (đặt tên/state theo hướng registry ngay cả khi chỉ có 1 entry), không xây registry đầy đủ ngay — nhưng đây là khuyến nghị, chưa phải quyết định |

## 4. Quyết định đã chốt

(chưa có mục nào — chưa điểm nào giữ ổn định qua >1 vòng)

## 5. Q&A log

- **2026-08-07** — Khởi tạo discussion từ `tsk-12m` (submit ngay trước đó
  trong cùng phiên, không có dependency rõ ràng nào tìm thấy trong
  `fgos list --json` lúc submit). Scout: `bin/fgos.mjs` case 'compound'
  (dòng ~1236-1274), `.claude/skills/fgos-compounding/SKILL.md` toàn văn,
  `docs/explanation/fgos-retro-loop-and-the-restored-compound-verb.md`
  toàn văn. 4 câu hỏi mở (§3 A-D) đặt ra cho vòng tiếp theo.
- **2026-08-07 (vòng 2)** — Trả lời: A=root (repo root, chuẩn ngành —
  chấp nhận đánh đổi phải sửa hard rule của `fgos-compounding`); B=(a)
  mở rộng `fgos-compounding` trực tiếp; C=đồng ý `## Unreleased` +
  cắt-release thủ công riêng; D=chưa hiểu câu hỏi gốc (viết lại kèm ví dụ
  cụ thể trong §3). Đồng thời chủ sản phẩm nêu tầm nhìn chiến lược lớn
  hơn phạm vi ban đầu: compound-learn về sau phục vụ nhiều loại tài liệu
  + nhiều audience hơn, kể cả chất liệu marketing-storytelling cho người
  dùng fgOS xây sản phẩm; hệ thống nên tự ghi nhận chi tiết/chất liệu và
  phát hiện ý tưởng kể chuyện — ghi nhận thành điểm E (§3), chưa quyết
  phạm vi. Scout thêm: xác nhận tiền lệ registry mở-rộng-được đã tồn tại
  thật (`registerCheck`/`registerConfigDefault`/`registerFix`,
  `src/setup/registrations.mjs` dòng 64/85/110) — dùng làm căn cứ cho đề
  xuất ở dòng B/E, không phải ý tưởng suông.

## 6. Thiết kế đã chốt {#design}

(chưa viết — chờ §3's câu hỏi mở được trả lời trước khi tổng hợp)

## 7. Danh mục hạng mục / task {#tasks}

(chưa chia — chờ §6)
