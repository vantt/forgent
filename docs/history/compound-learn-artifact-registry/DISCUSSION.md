# Extensible multi-audience artifact-producer registry for compound-learn — Discussion

## 1. Trạng thái hiện tại

Vòng 1. Tách ra từ `tsk-12m`'s discussion (điểm E, theo yêu cầu chủ sản
phẩm 2026-08-07). Item `tsk-28x` vừa submit, `deps: [tsk-12m]` — tsk-28x
chờ tsk-12m xong trước (giả định của em, CHƯA xác nhận với chủ sản phẩm,
xem §3 điểm 3). Chưa D-ID nào chốt. 3 câu hỏi mở nêu ở §3.

## 2. Mục tiêu & đề bài

Chủ sản phẩm coi compound-learn (bước `fgos-compounding` chạy khi item ở
`status: retrospective`, phân loại capture thật thành tài liệu Diataxis)
là một hướng chiến lược quan trọng, không chỉ công cụ nội bộ. Tầm nhìn: về
sau muốn hệ thống viết được NHIỀU LOẠI tài liệu hơn, phục vụ NHIỀU
audience hơn — không dừng ở 4 quadrant kỹ thuật (tutorial/how-to/
reference/explanation) hiện có. Ví dụ audience mới được nêu cụ thể:
marketing-storytelling — chất liệu kể chuyện cho người dùng fgOS để phát
triển sản phẩm của họ, hệ thống tự ghi nhận chi tiết/chất liệu và phát
hiện ý tưởng đáng kể chuyện, không bịa. `tsk-12m` (changelog tự động) là
use case CỤ THỂ đầu tiên của hướng này. Việc ở đây là thiết kế một cơ chế
đăng ký (registry) để mỗi audience/loại-tài-liệu mới cắm vào compound-learn
mà không phải sửa lại logic lõi mỗi lần — nhưng PHẢI giữ nguyên 4 quadrant
Diataxis hiện có (không đụng, không pha trộn — hard rule của
`fgos-compounding` cấm thẳng việc bịa quadrant thứ 5).

## 3. Vấn đề rõ / chưa rõ

| # | Điểm | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Không đụng 4 quadrant Diataxis hiện có | RÕ | Hard rule `fgos-compounding` SKILL.md, xác nhận lại từ discussion `tsk-12m` |
| 2 | Tiền lệ registry mở-rộng-được đã chạy thật trong repo | RÕ | `registerCheck`/`registerConfigDefault`/`registerFix` (`src/setup/registrations.mjs:64/85/110`) — dùng cho doctor/setup, không phải ý tưởng suông |
| 1 | **Registry là code hay config/data?** | CHƯA RÕ | Tiền lệ `registerCheck` là JS thật vì doctor's ENGINE tự động chạy check đó. Nhưng `fgos-compounding` là skill do LLM chạy (đọc capture, tự phán đoán quadrant bằng bằng chứng) — không có bước "máy tự thực thi function phân loại". Vậy registry nên là: (a) code thật — 1 tập hợp ID hợp lệ được validate ở `store.mjs` (như `DIATAXIS_DOC_TYPES` nhưng mở-rộng-được thay vì đóng cứng), skill đọc tập đó để biết audience nào tồn tại; (b) file config/data (vd YAML/JSON liệt kê audience + path-rule + growth-rule) mà skill đọc trực tiếp, không cần đổi code khi thêm audience; hay (c) cả hai — có 1 tập ID được code validate (an toàn, chống lỗi chính tả) + 1 file mô tả hành vi mỗi loại (skill đọc). Ảnh hưởng trực tiếp: (b)/(c) cho phép chủ sản phẩm tự thêm audience mới bằng cách sửa 1 file mô tả, không cần đổi code JS mỗi lần |
| 2 | Thêm audience mới — ai làm, sửa cái gì? | CHƯA RÕ | Gắn với câu hỏi 1: nếu (a) code-only, thêm audience = 1 PR code thật (an toàn, có review/test, nhưng chậm hơn). Nếu (b)/(c), thêm audience có thể chỉ cần sửa 1 file mô tả (nhanh hơn, nhưng ít ràng buộc/kiểm tra hơn — rủi ro skill tự diễn giải sai 1 audience mới mô tả sơ sài). Chủ sản phẩm muốn tốc độ thêm audience mới nhanh cỡ nào so với độ chắc chắn? |
| 3 | Thứ tự làm: `tsk-28x` (registry tổng quát) có chờ `tsk-12m` (changelog) xong trước không? | GIẢ ĐỊNH, CHƯA XÁC NHẬN | Em đặt `deps: [tsk-12m]` lúc submit theo đúng khuyến nghị trước đó (làm changelog gọn trước — 1 use case thật — rồi mới tổng quát hoá khi có use case thứ 2 thật, đúng Rule of Three/YAGNI). Nhưng chưa hỏi thẳng chủ sản phẩm có đồng ý thứ tự này không — có thể chủ sản phẩm muốn xây registry TRƯỚC rồi cho changelog cắm vào ngay từ đầu (rủi ro: thiết kế registry khi mới có 0 use case thật, dễ đoán sai hình dạng) |

## 4. Quyết định đã chốt

(chưa có mục nào — chưa điểm nào giữ ổn định qua >1 vòng)

## 5. Q&A log

- **2026-08-07** — Khởi tạo từ điểm E của `tsk-12m`'s discussion, theo
  yêu cầu chủ sản phẩm "chuyển sang coding-shape để bàn". Submit `tsk-28x`
  (`deps: [tsk-12m]`, dependency candidate `tsk-12m` được xác nhận bởi
  chủ sản phẩm trước khi submit). Scout tái sử dụng từ discussion
  `tsk-12m`: `src/setup/registrations.mjs:64/85/110` (tiền lệ registry),
  `.claude/skills/fgos-compounding/SKILL.md` (hard rule không bịa
  quadrant thứ 5, không ghi ngoài `docs/<quadrant>/`). 3 câu hỏi mở đặt ra
  cho vòng tiếp theo (§3).

## 6. Thiết kế đã chốt {#design}

(chưa viết — chờ §3's câu hỏi mở được trả lời trước khi tổng hợp)

## 7. Danh mục hạng mục / task {#tasks}

(chưa chia — chờ §6)
