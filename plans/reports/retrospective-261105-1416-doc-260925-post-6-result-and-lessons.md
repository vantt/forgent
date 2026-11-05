# Bài 6: Kết quả, những gì còn mở, và bài học

*Chuỗi hồi cứu plan 260925, bài 6/6. Bài trước: [Cái giá](retrospective-261105-1416-doc-260925-post-5-the-cost.md). Quay về đầu chuỗi: [Bài 1](retrospective-261105-1416-doc-260925-post-1-genesis-and-compound.md).*

Sáng 3/11, owner chọn "Land gọn": từ đó chỉ những kiểm tra trên chính sản phẩm (tài liệu, link, test) mới được chặn việc đưa lên main, còn sổ sách chứng minh nội bộ của plan được làm sau. Khoảng 13 tiếng sau (23:41), commit cutover lên main; commit được tạo lúc 22:07. Trước đó, mốc land đã lùi từ 29/10 sang 1/11 rồi 3/11.

## 3/11: Land gọn

Câu hỏi ở đầu bài 1 tới lúc 10:57 ngày 2/11. Lead trả lời ngay: "Phần tài liệu thật ra không khó; cái làm chậm là bộ máy chứng minh mà em dựng quanh nó". Hôm đó sửa 119 link chết mất trọn một ngày, gần hết cho sổ sách.

Trong ba lựa chọn Lead đưa ra, owner chọn Land gọn lúc 10:22 ngày 3/11, gần một ngày sau câu hỏi.

Cổng gọn cũng bị audit. Một auditor độc lập trả REWORK: cổng mới đã hạ một loại lỗi xuống "ghi lại sau Land", trong khi cùng loại lỗi đó còn báo hai bản sửa đè lên cùng một dòng, tức xung đột ngay trong sản phẩm, và phải tiếp tục chặn Land.

Lúc 14:14, owner viết: "tưởng sáng cho quyền rồi. anh thấy cả 2 tiến trình đều ngồi đợi". Theo Lead, phán quyết buổi sáng chỉ chọn hình dạng cổng và vẫn để "Land do owner duyệt riêng". Lead nhận: "Lẽ ra em nên hỏi gộp ngay lúc đó: gate qua thì Land luôn", và ghi quyền Land thành một phán quyết riêng.

## Cutover: một commit

Commit cutover thay đổi 1.677 file, +182.794 / -239.220 dòng, trong đó 943 file bị xoá. Nó gộp hai bản đồ đọc, viết lại `AGENTS.md`, và cài ba guard thay cho ratchet: chặn file mới ở các gốc cũ, kiểm vị trí file, và kiểm link/anchor. Guard có mặt trong cutover vì owner hỏi ngày 21/10: "bộ quy định, ràng buộc để docs không sinh bậy cũng được land trong phase 9?". Phán quyết sau đó ghi lý do: để tới Phase 10 thì khoảng hở sau khi bỏ ratchet sẽ tái tạo thẩm quyền chia đôi.

## Những gì đã đạt được, có bằng chứng

1. **Một cây thẩm quyền.** `docs/specs` và `docs/architect` không còn. `docs/platform/` có 628 file Markdown trong 34 khu. Chỉ còn một bản đồ đọc và một bản luật nền, và `AGENTS.md` dẫn tới chúng.
2. **Một check tái lập được.** Chạy ngày 5/11: "628 platform documents, 2607 local links, 302 metadata-exempt, 0 finding(s)". `scripts/doc-health.mjs` hôm nay dài 214 dòng cho ba luật (link, metadata, đường dẫn chết), dùng chung khoảng 200 dòng helper; bản nháp 7/10 dự đoán khoảng 400–500 dòng cho sáu kiểm, trong đó ba kiểm (đường dẫn đã retire, claim hai chủ, tài liệu sinh lỗi thời) chưa được làm.
3. **Tra được đường dẫn cũ.** Bảng tra trên main có 9.235 mục. Sổ claim 68.441 dòng chỉ có bản tóm tắt digest trên main; các dòng nằm trong tag local. Theo cách đọc của người viết, đây là phần trả lời cho nhu cầu tra cứu mà review đầu tiên nêu (bài 3).

## Những gì chưa đạt hoặc còn mở

- **Hệ điều hành tài liệu chưa có plan.** Proposal 20/9 hướng tới một hệ có một cửa ghi duy nhất cho tài liệu; nó đang ở trạng thái "not-planned". Plan này giải quyết thẩm quyền, chưa giải quyết việc viết.
- **Check tài liệu chỉ chạy trong bộ test**, không ở pre-commit, và đó là chủ ý: link gãy chỉ bị bắt khi suite chạy.
- **Evidence chỉ có ở máy owner.** Tag lưu evidence không được push lên origin; trên main chỉ còn digest của sổ claim và 28 file trong thư mục plan. Sáng 4/11, Lead hỏi chỗ lưu bằng chứng ngoài máy; owner duyệt các việc 1-4 (gồm các bản ghi sau Land) và viết thêm: "Nếu ổn thì anh không cần giữ dữ liệu đâu". Lead hiểu câu đó là không cần bản sao ngoài máy, và cũng dựa vào nó để dừng phần sổ sách sau Land (L13-159).
- **Guard lúc landing chưa có hiệu lực qua bản fgOS đã cài**; bản sau đó chưa được kiểm lại.

## Bài học

1. **Cổng release chỉ gồm kiểm tra trên sản phẩm, và khi người chọn hình dạng cổng thì hỏi luôn: qua cổng thì được làm luôn không.** Sổ sách nội bộ ghi lại, không chặn. Land gọn lên main khoảng 13 tiếng sau khi được chọn. Thiếu câu đó, chiều 3/11 owner thấy cả hai tiến trình như đang chờ và phải hỏi lại; quyền Land được ghi thêm thành L13-155.
2. **Lời nhắc của người là chi phí của hệ thống, và một khúc cắt không thành quy trình thì lời nhắc quay lại.** Owner phải nhắc ít nhất chín lần (bài 4) và hỏi tiến độ ít nhất 33 lần (bài 5). Đo số lần người phải đi hỏi như một chỉ số chi phí.
3. **Giữ đủ câu không có nghĩa là giữ câu đúng.** Mẫu 30 câu cho 13,3% và 26,7% câu sai so với hiện trạng (bài 4). Lấy mẫu đúng-sai trước khi dựng kế toán.
4. **Đặt luật thẩm quyền trước cơ chế sinh tài liệu, và khi di trú thì dời chứ không chép, chuyển cả bên đọc cùng lúc.** Bước compound-learn (20/7) ra đời khi luật nền đã có hai bản; theo cách đọc của người viết, nó là một nguyên nhân chính của 365 lên 4.301 file (bài 1, 2).
5. **Quyết định chấp nhận rủi ro phải được hỏi và ghi rõ, không suy ra từ một câu chat.** Ngày 4/11, câu "Nếu ổn thì anh không cần giữ dữ liệu đâu" được Lead hiểu thành chấp nhận để evidence ở một máy, nhưng `plan.md` trên main chỉ ghi nơi evidence nằm (dòng 280).

Các bài học khác (pilot phải được phép thất bại, đổi đơn vị review khi không hội tụ, không ai được dời thước đo, không merge phần việc đang đỏ, ghi ngày gỡ giàn giáo) nằm ở evidence pack §7.

Câu hỏi ở đầu bài 1 là "6 tuần rồi". Câu trả lời: phần tài liệu không khó, cái chậm là bộ máy chứng minh, và nó dừng khi cổng chỉ còn hỏi sản phẩm có đúng không. Theo cách đọc của người viết, hai nửa của chuỗi là một chuyện: bài 1–2 cho thấy tài liệu phình ra vì được sinh trước khi có luật nói bản nào đúng, và bài 4–6 cho thấy việc dọn chậm vì phải chứng minh lại từng câu của chính đống tài liệu đó.

## Nguồn

- Transcript Lead `~/.claude/projects/-home-vantt-projects-forgentX/a4954387-fafa-46d2-911f-4ea15b20d08d.jsonl`: dòng 82549 (ba mốc land), 84830, 84838 (2/11), 84842 (ba lựa chọn), 84844 (chọn Land gọn, 2026-11-03T03:22:06Z), 85139 (auditor REWORK, `sameLinesTwice`), 85763, 85790 (14:14), 37706 (câu hỏi guard, 2026-10-21T09:07:37Z), 87026, 87031, 87304 (4/11). Giờ UTC: evidence pack §6.
- Land gọn: L13-152 (`ee695a632`, 3/11 10:22). Quyền Land: L13-155 (`c8b02bd67`, 14:14). Guard: phán quyết L12-89, `TAG:plans/260925-documentation-authority-unification/reports/phase-08/owner-answers.md:1285-1291`.
- Cutover: `97dd62aa7` (tạo 22:07:32; lên main 23:41:14 theo `git reflog show --date=iso main`; board log 23:50); R-built §2.
- Đã đạt: R-built §3; `node scripts/doc-health.mjs` (5/11); helper `scripts/lib/doc-links.mjs` (126 dòng), `scripts/list-doc-anchors.mjs` (82 dòng); dự đoán: transcript `4df9e88c…jsonl` dòng 2674. Alias table; sealed ledger digest `2a028cdc9`; fact-check #89.
- Còn mở: DOCOS (`plans/261017-1313-fgos-platform-program-board/plan.md:80`); `docs/platform/convention/spec.md:382`; tag `archive/doc-260925-lineage` (Lead check 2026-11-05); fact-check #96; gap G1, release `47e1016d` (R-built §4).
- Writer check 2026-11-05: `plans/260925-documentation-authority-unification/plan.md:280`; `git ls-files 'docs/**/platform-foundations.md'`.
- Bài học 4: `3ee30977a`, `ad65f59fd`; fact-check #100.
- [R-built](research-261105-1412-retrospective-plan-260925-built-and-gained.md); [fact-check](review-261105-1423-doc-260925-retrospective-claims.md); [round 3](review-261105-1800-doc-260925-retrospective-claims-round3.md) W2, W3, O2, O4, m1; [evidence pack](retrospective-261105-1416-doc-260925-evidence-pack.md) §4, §6, §7.
