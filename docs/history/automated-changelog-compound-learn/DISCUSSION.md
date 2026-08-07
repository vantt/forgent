# Automated CHANGELOG capture wired into compound-learn — Discussion

## 1. Trạng thái hiện tại

Vòng 3. A/B/C giữ nguyên qua vòng 2→3 không đổi — đã mint D-ID
(D-tsk12m-A/B/C, §4), ghi qua `fgos decision --id tsk-12m` thật. D: chủ
sản phẩm chốt D2 (session tự phán đoán, cùng kỷ luật chọn quadrant) ngay
vòng 3 — mới chạm lần đầu, CHƯA mint (chờ giữ nguyên qua vòng 4). Điểm E
(tầm nhìn đa-audience) tách ra thành discussion RIÊNG theo yêu cầu chủ sản
phẩm — xem `docs/history/compound-learn-artifact-registry/DISCUSSION.md`
(mở 2026-08-07). `tsk-12m` tạm dừng ở đây chờ discussion registry hội tụ,
vì D-tsk12m-B đã ghi rõ phụ thuộc vào hình dạng registry đó.

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
| A | Vị trí file `CHANGELOG.md` | **D-tsk12m-A** | Chốt: repo root. `fgos-compounding` SKILL.md cần sửa câu chữ hard rule (exemption cho changelog) khi vào giai đoạn planning |
| B | Điểm quyết "có đáng ghi changelog không" nằm ở đâu | **D-tsk12m-B** | Mở rộng `fgos-compounding`, hình dạng registry mở-rộng-được (tiền lệ `registerCheck`/`registerFix`). Phạm vi/thiết kế registry cụ thể → tách sang `docs/history/compound-learn-artifact-registry/DISCUSSION.md` |
| C | Version heading cho entry mới | **D-tsk12m-C** | `## Unreleased`, cắt-release là bước thủ công riêng, ngoài phạm vi `tsk-12m` |
| D | "User-visible" định nghĩa bằng gì | TRẢ LỜI V3 (chưa D-ID, chờ vòng 4) | Chốt D2: session tự phán đoán có bằng chứng ngay lúc retrospective, cùng kỷ luật chọn quadrant (không mặc định, không coin-flip) — hệ quả tự nhiên của D-tsk12m-B |
| E | Tầm nhìn compound-learn đa-audience | TÁCH RA | Chuyển sang discussion riêng `docs/history/compound-learn-artifact-registry/DISCUSSION.md` (yêu cầu chủ sản phẩm, 2026-08-07 vòng 3) — không còn theo dõi ở đây |

## 4. Quyết định đã chốt

| D-ID | Tóm tắt | Ghi chú |
|---|---|---|
| D-tsk12m-A | `CHANGELOG.md` ở repo root, chuẩn ngành Keep a Changelog | Cần sửa hard rule `fgos-compounding` SKILL.md lúc planning |
| D-tsk12m-B | Changelog-worthy quyết ngay trong `fgos-compounding`, hình dạng registry mở-rộng-được | Tiền lệ `registerCheck`/`registerFix`/`registerConfigDefault`, `src/setup/registrations.mjs:64/85/110`. Phạm vi registry → discussion riêng |
| D-tsk12m-C | Entry mới vào `## Unreleased`, cắt-release thủ công riêng | Ngoài phạm vi `tsk-12m` |

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
- **2026-08-07 (vòng 3)** — A/B/C giữ nguyên, mint D-tsk12m-A/B/C thật qua
  `fgos decision --id tsk-12m` (seq 9005-9007). Chốt D=D2. Chủ sản phẩm
  yêu cầu tách điểm E ra thảo luận riêng ("chuyển sang coding-shape để
  bàn") — mở `docs/history/compound-learn-artifact-registry/
  DISCUSSION.md` làm feature riêng, không viết chung file này (D3 rule:
  một feature một file). `tsk-12m` tạm dừng chờ discussion đó hội tụ vì
  D-tsk12m-B phụ thuộc hình dạng registry.

## 6. Thiết kế đã chốt {#design}

(chưa viết — chờ §3's câu hỏi mở được trả lời trước khi tổng hợp)

## 7. Danh mục hạng mục / task {#tasks}

(chưa chia — chờ §6)
