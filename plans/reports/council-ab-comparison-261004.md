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
