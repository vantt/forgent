# Phase 03 — Khung đã duyệt: điểm dừng chung cho các luật đẩy về phía "nhiều hơn"

## Vì sao

Năm luật/thói quen mỗi cái đúng khi đứng riêng, nhưng cộng lại thì không có điểm dừng:

| Luật | Đẩy về phía | Thiếu |
|---|---|---|
| RUL11 (`docs/specs/platform-foundations.md:74`, ADR0036) | gom thêm | gom tới đâu thì thôi |
| "Làm cho xong" (gate đủ-hết, cấm defer, chạy liền các phase) | đủ thêm | xong theo thước đo nào |
| Release human (AGENTS.md ưu tiên #2) | ít phanh hơn | phanh còn lại là gì |
| L5 (bài kiểm tài liệu) | thêm tài liệu | — (không sửa trong plan này) |
| Có bằng chứng là có tiến độ | thêm bằng chứng, kể cả dàn dựng | bằng chứng tốn bao nhiêu |

Phanh duy nhất từng hoạt động là owner; release human rút owner ra, và câu hỏi tệ làm owner duyệt mù. Owner chọn (2026-10-08): thêm một điểm dừng chung — **khung đã duyệt** — và neo từng luật vào nó, không viết lại từng luật.

## Nội dung (thêm vào `core/skills/_shared/decision-question.md`, ≤ 20 dòng; anchor phrase của khung thêm vào luật `core/instructions/decision-question.md`)

**Khung đã duyệt** = phạm vi (được đụng file/contract nào) + ngân sách (dòng src, test, docs và bằng chứng; số ngày), ghi một lần lúc owner duyệt việc. Item con dùng chung khung của item cha.

- Trong khung: agent tự quyết, không hỏi (release human).
- Sắp vượt khung: dừng và hỏi theo mẫu câu hỏi quyết định.
- RUL11: gom phần tùm lum **trong phạm vi việc đang làm**, tới khi hết. Tùm lum thấy ngoài phạm vi → ghi item riêng. Gom mà phải xây công cụ/máy móc mới → câu hỏi quyết định.
- Làm cho xong = xong **trong khung**. Gate không đạt được trong khung → câu hỏi quyết định, không sửa ngoài khung.
- Tiến độ = hành vi chạy đúng ở chỗ kiểm đã khai, không phải số lượng bằng chứng. Bằng chứng tính vào ngân sách. Bằng chứng phải từ lần chạy tự nhiên; cần dàn dựng (cố ý làm hỏng, viết sẵn kết luận vào đề) = gate không đạt được → hỏi.

## Việc cần làm

1. Thêm mục "Khung đã duyệt" như trên vào `core/skills/_shared/decision-question.md`; thêm 1 câu anchor vào luật và 1 assert vào `test/docs/rul11-anchor-phrase.test.mjs`; chiếu lại AGENTS.md bằng lệnh ở Phase 01 bước 2.
2. Supersede ADR0036 bằng decision mới `0054` trong `docs/specs/platform-foundations.md` "Lịch sử quyết định": giữ nguyên văn phát biểu gốc của owner (2026-08-18), thêm phát biểu 2026-10-08 ("dọn dẹp liên quan đến việc đang làm"; bộ luật kết hợp gây rò rỉ), quyết định = thêm vế phạm vi vào RUL11. Không sửa đoạn 0036 tại chỗ.
3. Sửa dòng RUL11 (`docs/specs/platform-foundations.md:74`): thêm "trong phạm vi việc đang làm; ngoài phạm vi thì ghi item riêng", trích ADR0054. Cập nhật hằng số `RUL11_LAW` trong `test/docs/rul11-anchor-phrase.test.mjs:20` cho khớp.
4. Mục `## RUL11` trong AGENTS.md (dòng 134+, phần viết tay): thêm cùng vế phạm vi, sửa tay.
5. AGENTS.md:19 ưu tiên #2 (sửa tay, cùng lần với Phase 02 mục 8): thêm vế "tự quyết trong khung đã duyệt; vượt khung thì hỏi theo mẫu".
6. `domains/coding/skills/fgos-coding-planning/references/approach-and-shape.md`: plan.md phải có dòng phạm vi (paths) và ngân sách (dòng, ngày). `npm run build:skills`.
7. Chạy `fgos decision-index` nếu nó là cách sinh `docs/decisions/index.md` (xác minh trước).

## Kiểm chứng

- `node --test test/docs/rul11-anchor-phrase.test.mjs` và test doctrine/skill render xanh; rồi `npm test`.
- Không có code mới ngoài 1 hằng số test. Tổng phase ≤ 50 dòng đổi.

## Không làm

- Không sửa L5 (luật khoá, chi phí supersede cao; ngân sách tính cả bằng chứng đã chặn phần lớn tác hại).
- Không viết script/doctor row kiểm ngân sách. Chỉ làm nếu dòng ngân sách bị lờ đi lặp lại.
- Không sửa ak-plan hay `.claude/rules` (AgentKit, dự án của người khác).

## Rủi ro

- Khai ngân sách thật cao: owner thấy con số lúc duyệt; vượt xa việc tương tự trước đây phải ghi lý do.
- Chia việc để né ngân sách: item con dùng chung khung cha.
- "Phạm vi việc đang làm" bị hiểu rộng: phạm vi = `paths` đã ghi, không phải chủ đề.
