# So sánh có đối chứng: council thật vs fgOS panel + persona

Ngày 2026-10-04. Cùng một câu hỏi: fgOS có nên thêm cổng dissent/agreement vào `panel`?
Bằng chứng: `plans/reports/council-lens-experiment-261004/outputs/ab-*`.

## Kết quả chấm mù (rubric 0-2 của council, giám khảo opus, không biết nguồn)

| Tiêu chí | Council | fgOS panel |
|---|---|---|
| Perspective spread | 2 | 0 |
| Decision clarity | 2 | 1 |
| Counterfactual depth | 2 | 0 |
| Evidence discipline | 2 | 1 |
| Execution quality | 1 | 0 |
| Tổng | 9 | 2 |

## Cách đọc con số: không công bằng cho pattern, nhưng lộ ra một lỗi thật

Bản fgOS được chấm chỉ là đầu ra synthesizer. Ba panelist fgOS (claude, openai, gemini) chạy tốt,
hai trong số đó khuyên **không** thêm cổng. Synthesizer (xai) lại kết luận **nên thêm cổng**
và không nhắc tới panelist nào.

Nguyên nhân đã kiểm trong code: `runRole` nhận tham số `inputs` nhưng không dùng nó
(`src/runner/execution/run.mjs:355`; chỉ dòng 319 dùng `unit.inputs`). `panel.mjs` truyền
`inputs: memberResults` cho synthesizer, nên brief của synthesizer ghi `Context refs: (none)`
và `assignment.json` có `contextRefs: []`. Synthesizer của `panel` không bao giờ thấy đầu ra
của panelist. Nó tự đọc repo rồi đưa ý kiến riêng.

Hệ quả:
- Pattern `panel` hiện chỉ là N ý kiến độc lập cộng một ý kiến thứ N+1. Không có tổng hợp thật.
- Câu "plumbing không phải rủi ro" của Meadows (phía council) sai ở tầng `runRole`.
- Điểm 2/10 phản ánh lỗi này, không phản ánh persona hay provider.

## Nội dung quyết định (council)

Đồng thuận: không thêm cổng; ép synthesizer nêu vị trí từng người và trả "genuine split";
thêm cảm biến thụ động (stance + tỉ lệ đồng thuận mỗi run). Cổng quét ép buộc của council
**đã đổi kết quả** (sinh ra cảm biến, vốn không có ở vòng 1-2), bằng chứng n=1.

## Chi phí

Council: 13 lần gọi agent, cùng một provider, đa vòng. fgOS: 4 assignment, 4 provider khác nhau,
227 giây, đúng ràng buộc độc lập provider. Council yếu ở độc lập provider, fgOS yếu ở tổng hợp.

## Khuyến nghị

1. Sửa trước: truyền đầu ra panelist vào synthesizer (contextRefs), kèm test 2-vs-1.
   Đây là việc nền, làm trước mọi cổng và trước persona-per-seat.
2. Sau đó mới đo lại A/B; kỳ vọng khoảng cách thu hẹp mạnh.
3. Persona-per-seat vẫn đáng làm (đã chứng minh chạy); cổng/cross-exam theo kill criteria K1-K5.

## Cập nhật 2026-10-04 22:47: chạy lại sau khi sửa

Cùng câu hỏi, cùng ba persona (Socrates, Torvalds, Meadows), mã đã sửa. Panelist: openai, gemini, xai; synthesizer: deepseek qua OpenRouter
(claude-herdr không dùng được lúc đó, xem `finding-trust-entry-removed-on-settle-261004.md`). Synthesizer nhận 3 ref và đọc cả 3 báo cáo.
Đầu ra: `council-lens-experiment-261004/outputs/ab2-fgos-synthesizer-after-fix.md` (lấy từ stdout vì deepseek không ghi được report, lỗi EROFS đã biết).

Chấm mù lại (giám khảo opus, cùng rubric, không biết nguồn):

| Tiêu chí | Council | fgOS panel đã sửa | fgOS trước khi sửa |
|---|---|---|---|
| Perspective spread | 2 | 1 | 0 |
| Decision clarity | 2 | 1 | 1 |
| Counterfactual depth | 2 | 1 | 0 |
| Evidence discipline | 1 | 2 | 1 |
| Execution quality | 1 | 0 | 0 |
| Tổng | 8 | 5 | 2 |

Cách đọc:
- Khoảng cách thu hẹp từ 7 điểm xuống 3 chỉ nhờ nối dây, chưa đổi gì khác. Phần lớn điểm còn thiếu là cấu trúc của đầu ra (một báo cáo đơn của synthesizer, không có chủ sở hữu, hạn, tiêu chí rollback, không bày từng lăng kính), không phải chất lượng lập luận.
- fgOS thắng ở bằng chứng: trích file:line cụ thể, gắn với test. Council thắng ở thế giằng co, phản biện, tiêu chí xem lại có ngưỡng.
- Giới hạn: một câu hỏi, một giám khảo, bản fgOS bị chấm kèm vỏ JSON và đường dẫn nhiễu, council chạy một provider, provider của synthesizer khác lần trước.
- Nghĩa là: bù khoảng cách còn lại là việc của lược đồ đầu ra của synthesizer (thứ tự "điều chưa biết trước", kill criteria, một bước tiếp theo), tức ứng viên `verdict-unresolved-first-schema`, không cần engine mới.
