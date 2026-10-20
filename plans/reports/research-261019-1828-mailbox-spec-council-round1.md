# Hội đồng vòng 1: đánh giá độ hữu dụng và tính khả thi của spec mailbox

Ngày: 2026-10-19. Đối tượng: `docs/platform/agent-mailbox/spec.md` bản đầy đủ (commit 6b5e5119e).

## Tổng hợp nhanh

- **Kết luận chung:** tầng giao tin đã đo và đáng làm. Tầng chính sách, độ tin cậy và liên máy chưa đo và chưa có bên dùng cụ thể. V-011 chưa thoả cho mailbox tổng quát.
- **Quyết định của chủ repo:** phương án A, thu hẹp thành lát cắt giao tin (Claude Code, Codex, agy; một máy; không ack, không liên máy), ghi phần sau vào mục 15 của spec.
- **Rust:** có, theo từng lớp. Lõi, bản ghi cục bộ, verb và cổng gõ tín hiệu bằng Rust. Hook của CLI là shell hoặc Node mỏng. Extension của pi và omp là TypeScript. Chi phí khởi động Node của hook là ước lượng, bước S0 phải đo trước khi viết crate.
- **Việc tiếp theo:** hội đồng vòng 2 đánh giá thiết kế đã thu hẹp.

## Ba nhóm

Ba nhóm chỉ đọc, mỗi nhóm một góc nhìn. Mọi con số về công sức là ước lượng của nhóm, không phải quan sát.

### Nhóm giả định

- Số đo giao tin là thật. Mailbox tổng quát chưa thoả V-011: spec chứng minh cần một lớp adapter giao tin trung thực, chưa chứng minh cần một thực thể mailbox lưu bền. Chưa nêu được bên dùng cụ thể.
- Ba nhu cầu thật trong báo cáo nghiên cứu: steer cho Unit đang chạy, câu hỏi để treo, lease cho file. Spec để lease ngoài phạm vi và đẩy câu hỏi người sang đường decision-question, nên phần còn lại là nhắn tin giữa session.
- Bị đo bác bỏ: `success:true` nghĩa là đã giao; cùng permission class thì được phép; idle là đủ để gõ; Enter đã gõ luôn vô hại; hook đã cài thì sẽ chạy.
- Chưa biết: tin đến sau checkpoint cuối, compact, liên máy, hai người gửi cùng lúc, hook làm trigger fetch.
- Đề xuất: thu hẹp V-011 thành steer và park theo `unitRunId`, giữ số đo giao tin làm tham chiếu adapter, hoãn mailbox đầy đủ.

### Nhóm vòng phản hồi

- Vòng còn hở: khung tin có sẵn lệnh trả lời nên ping-pong là mặc định; chu trình ba agent không bị đếm theo cặp; hai bên cùng `wake:true` đánh thức nhau; tin `refused` có thể sinh lượt trả lời; đẩy lại sau 90 giây ngắn hơn độ trễ thật; hàng đợi đầy thì loại tin cũ; khoảng hở giữa kiểm tra `input_empty` và lúc gõ; tin `unknown` chờ vô hạn; hết hạn theo đồng hồ người gửi sinh dead letter giả và leo thành câu hỏi cho người.
- Tăng trưởng: mỗi trao đổi 3 đến 5 sự kiện bền, thân tin 16 KiB không gỡ được vì ref chỉ tiến; cỡ thân tin đáng lo hơn số sự kiện; ngưỡng 2 giây của nén kho đến muộn.
- Thang đo của spec (ba chỉ số) không phát hiện bão hay vòng lặp. Đề xuất tám tín hiệu.
- Hook phải chỉ đọc cache cục bộ; điều kiện này quan trọng hơn ngôn ngữ.

### Nhóm giao hàng và bảo trì

- Phần đáng làm là giao tin; tầng chính sách và độ tin cậy là suy đoán. Không thấy sự cố hay việc bị chặn nào ghi nhận.
- Thứ tự P0 đến P3 xếp theo lớp nên giá trị đến muộn; chỉ `SessionDelivery` có hơn một bản thật, hai cổng kia mới có một bản.
- Test hợp đồng cần CLI thật và xác thực nên không nằm trong `npm test` được; phải là test live chạy tay.
- Bảo trì: năm adapter theo năm CLI đổi nhanh; ước lượng một adapter hỏng mỗi quý, 0,5 đến 2 ngày mỗi lần; chưa có chủ.
- Lát cắt nhỏ nhất: hợp đồng `SessionDelivery`, ba adapter (Claude Code, Codex, agy), `fgos mailbox inbox`, khung tin và quy tắc peer input ở một nguồn, một test live mỗi adapter.
- Rust: lõi và verb Rust (crate mới cạnh `event-store`), hook là shell hoặc Node mỏng, extension pi và omp TypeScript, cổng gõ và Presence gọi `terminal-control` có sẵn.

## Cái đã đổi trong spec

| Thay đổi | Nguồn |
|---|---|
| Phạm vi thu hẹp thành giao tin; `acked`, `handled`, `reply_by`, hết hạn, liên máy, pi và omp, tốc độ theo máy, gộp trùng chuyển sang mục 15 | quyết định A |
| V-011: bỏ lời khẳng định "nhu cầu phục hồi", giữ quyền giao tin và bất biến peer input | nhóm giả định |
| Độ sâu chuỗi theo `reply_to`, tin `notice` không trả lời không đánh thức, quy tắc `wake` chống đánh thức lẫn nhau, hàng đợi từ chối tin mới, giới hạn đẩy lại, thời gian đang bay 120 giây | nhóm vòng phản hồi |
| Phương án dự phòng cho trạng thái `unknown`, lùi nhịp sau khi từ chối, gõ tín hiệu chỉ bật mặc định cho agy | nhóm vòng phản hồi |
| `MailStore` và `Replication` thôi là cổng (mục 4 quy tắc 5), bản ghi cục bộ là module | nhóm giao hàng |
| Kế hoạch S0 đến S3 thay cho P0 đến P3; test live chạy tay; tám tín hiệu quan sát | cả ba nhóm |
| Bảng ngôn ngữ theo lớp (mục 4.1) | cả ba nhóm |

## Chưa đổi và lý do

- Không thêm kiểm tra `fgos doctor`: chủ repo đã quyết ngày 2026-10-19, hai nhóm đề nghị xem lại; ghi thành câu hỏi 5 của spec.
- Không đưa steer và park theo `unitRunId` vào lát cắt: nhóm giả định coi đây là phần hẹp nhất có bên dùng rõ, nhưng thuộc runner và Assignment; ghi ở mục 15.4.

## Câu hỏi còn mở

1. Bên dùng đầu tiên là ai (coordinator herdr đánh thức worker, runner steer session, hay chủ repo)? Nêu được một bên là điều kiện để bắt đầu bất kỳ phần nào của mục 15.
2. Dạng địa chỉ session theo spec session-identity.
3. Chi phí khởi động hook bằng Node so với Rust: chưa đo.
4. Codex `queue` mất khoảng 10 giây do hàng đợi hay do cách đo?
5. Có xem lại kiểm tra `fgos doctor` cho hook bị bỏ qua không?
