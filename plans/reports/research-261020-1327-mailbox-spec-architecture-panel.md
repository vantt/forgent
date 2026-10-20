# Hội đồng kiến trúc (fgOS) đánh giá spec mailbox: kết quả chưa chốt

Ngày 2026-10-20, phiên `d50dc90b`. Đối tượng: `docs/platform/agent-mailbox/spec.md` ở commit `65538aa0d`. Workflow `architecture-advisory`, run `wf-run-1792425125291-0682b2c1`. Hai báo cáo vòng 1 và vòng 2 cùng ngày là của agent cùng phiên, không phải hội đồng này.

## Tổng hợp nhanh

- **Trạng thái:** workflow dừng ở `failed`. Khung, định hình (ba ghế openai, claude, gemini), phản biện (xai, deepseek) và tổng hợp (claude, reviewer gemini) đều xong. Ghế red-team (deepseek) vòng 2 của bước tổng hợp ghi kết quả sai hợp đồng nên bị `invalid-agent-result-claim`. Vì vậy báo cáo kết luận cuối **chưa được workflow chốt**, và cổng cuối hỏi chủ repo về chuyên môn cần mời chưa tới.
- **Kết luận:** chưa ký bản nháp. Năm khẳng định không đứng vững (bên dưới). Rust cho phần chạy.
- **Lỗi hội đồng không do tài khoản:** lần chạy đầu hỏng vì tài khoản OpenRouter thiếu thông tin đăng nhập (đã sửa). Lần chạy này đã xác thực xong, lỗi là định dạng kết quả của một ghế.
- **Nguồn:** báo cáo kết luận ở `.fgos/assignments/unit-run-1792426095503-d32798e3/producer/2/runs/01/outbox/report-1.md` (chỉ có trên máy chạy, không trong git). Tóm tắt dưới đây là đọc lại từ đó, kiểm tra từng trích dẫn trước khi dựa vào.

## Năm khẳng định của spec không đứng vững (mọi ghế độc lập thấy)

1. Một thư mục `rename` không khoá bị gọi là giao dịch.
2. `delivered` bị gọi là "đã vào ngữ cảnh model", trong khi chỉ là đã phát ra kênh của harness.
3. Chứng minh chuỗi ba agent kết thúc dựa trên đếm theo cặp.
4. Lớp chặn shell `test -e pending/` bị coi là mô hình chi phí hook.
5. Danh tính không xác thực mà vẫn cấp miễn trừ và đặt lại ngân sách cho "người".

## Rust

Có cho đường chạy: lõi chính sách, bản ghi, hai cổng (Nudge, Presence), ba adapter và mọi verb chạy ở điểm kiểm (`drain|send|inbox|status`) làm selector gốc trong host. Node giữ bộ cài hook, setup config-merge, doctor. JSON cho hợp đồng. Markdown cho chỉ dẫn peer-input. TypeScript chỉ cho pi và omp về sau. Rust không tự chứng minh việc giao tin, quan hệ nhân quả hay gõ an toàn.

## Sửa spec trước S1

- Bản ghi: một ảnh chụp metadata an toàn khi crash cho mỗi namespace dưới `<stateRoot>/mailbox/<repoKey>/`, ghi bằng `durable-file`, đổi dưới khoá `holder-lock`, thân tin bất biến; thư mục chỉ là cache; thay chữ "durable" bằng "atomically visible and process-crash safe" trừ khi nêu thứ tự fsync.
- `delivered` đổi thành `offered`; claim và finish mang attempt token và thế hệ gắn kết; `inbox` mặc định chỉ đọc, `inbox --claim` mới tiêu thụ; xác nhận là emit rồi finish có điều kiện trong cùng tiến trình, nêu cửa sổ trùng.
- Địa chỉ gắn `(address, generation, native handle, incarnation của tiến trình hoặc pane)`; tin của thế hệ cũ không bao giờ phát lại; `from` chỉ để quy trách nhiệm, không cấp ô của người hay đặt lại ngân sách.
- Bỏ chứng minh chu trình ba agent; độ sâu chỉ chặn chuỗi trả lời liên kết rõ; ngân sách phiên, cửa sổ vòng và hạn hàng đợi là phanh; thêm trần cả đời cho mỗi phiên khi cửa sổ 10 phút là chỗ đặt lại duy nhất; thêm phản ví dụ A, B, C, A thành test lõi.
- Ngữ nghĩa Stop và biên lai tầng `turn` phải khớp nhau (nhánh D2); giữ trần 8 giây chỉ là trần.
- Bỏ lớp chặn shell; hook là selector gốc `fgos mailbox drain --for-hook <cli> --event <e>`.
- Không thêm `input_empty` vào terminal-control; bộ nhận diện ô nhập trống nằm trong profile agy của agent-protocol, kèm ảnh màn hình mẫu và khoá phiên bản; lệch phiên bản chỉ tắt đường nudge chưa kiểm (`push` về `turn`).
- Escape thân tin, không chỉ các trường đầu; thay "permission laundering is closed at the source" bằng "giảm nhẹ bằng khung, chỉ dẫn cho bên nhận và cô lập của hệ điều hành".
- Bộ đếm từ chối và kết quả cổng là bộ đếm có giới hạn trong ảnh chụp mỗi địa chỉ, không phải một file cho mỗi lần từ chối.
- Nói rõ lát đầu phục vụ phiên tương tác của chủ repo; worker bị bwrap chỉ khi có tài nguyên đăng ký hoặc adapter báo `refused: blind-confinement`.

## Đo trước khi tuyên bố "tốt nhất có thể"

Bất biến quan trọng nhất (tin của agent khác không bao giờ là input của người) chỉ được giữ bằng khung và chỉ dẫn; chưa đo xem các model thật có tuân theo. Báo cáo biến phép đo tiêm lệnh qua khung peer thành sản phẩm của S0 và đầu vào của G0. Các phép đo S0 khác: chi phí selector gốc qua host đã kích hoạt trong môi trường hook thật, ghi lại ảnh chụp ở mức trần, hook báo "người nhập" trên Codex và agy, và việc một prompt do peer giao có kích hoạt `UserPromptSubmit` hay không.

## Bất đồng chưa giải quyết (chủ repo quyết)

- D1 lát đầu là gì: báo cáo giữ lõi và bản ghi đã sửa; ghế thay thế đề xuất hộp thả cộng một hook và chỉ dẫn, không lõi, bị bác cho lát đầu. Phương án "steer theo attempt qua run-supervisor" hoãn sang mục 15.4.
- D2 tin `wake:false` ở Stop: xả hết, bị chặn bởi `mailbox.stopBlock.max`, biên lai nói thật (báo cáo khuyến nghị) hay chỉ xả `wake:true` để người còn là phanh. D3 đến D7: độ sâu nhân quả, đường hook, hình dạng bản ghi, ngưỡng "nguồn gốc là người", giao thức xác nhận. D8: luật Stop ở mục 6.1 có phải quyết định của chủ repo.

## Bốn chuyên môn báo cáo đề nghị mời thêm

Cơ chế hook của Claude Code và Codex (khi nào đầu ra hook vào ngữ cảnh model và `UserPromptSubmit` mang nguồn gốc gì); nhất quán dữ liệu khi crash trên hệ tệp của chủ repo; đo tiêm lệnh qua khung peer với model thật; đo khởi động host Rust đã kích hoạt trong môi trường hook.

## Giới hạn của báo cáo này

- Kết luận cuối chưa qua lần kiểm của red-team vòng 2 theo đúng hợp đồng. Nội dung phản biện vòng 2 của ghế đó có trong file `result-1.json` của nó (`.../red-team/2/runs/01/outbox/`) và chưa được đưa vào bản tóm tắt này; vòng 1 của nó cho kết quả `findings`.
- Nhiều lựa chọn ở vòng 2 của agent cùng phiên bị các ghế độc lập bác bỏ (ghi bằng `rename` không khoá, lớp chặn `test -e`, `delivered`, chứng minh chuỗi ba agent). Đó là lý do nên dùng hội đồng thật.
- Nguyên nhân lỗi định dạng ghế red-team được ghi ở phụ lục của [spec Seat Binding](spec-draft-261020-1017-seat-binding-component.md); đó là suy luận, chưa có thử nghiệm đối chứng.
