# Hội đồng vòng 2: đánh giá thiết kế của spec mailbox đã thu hẹp

Ngày: 2026-10-19. Đối tượng: `docs/platform/agent-mailbox/spec.md` sau quyết định A (commit c951985bc). Ba nhóm chỉ đọc: giả định, vòng phản hồi, giao hàng và bảo trì. Các nhóm không chạy gì; số công sức là ước lượng.

## Tổng hợp nhanh

- **Kết quả:** thiết kế còn vài chỗ không sống sót qua cài đặt. Quan trọng nhất là hợp đồng `deliver()` không khớp với hook phía người nhận, và chuỗi sâu bị chính khung trả lời của spec vô hiệu hoá.
- **Đã áp vào spec:** gần như mọi đề xuất có bằng chứng. Hai chỗ các nhóm bất đồng đã được chọn, lý do ghi bên dưới.
- **Còn chờ chủ repo:** V-011 và dạng địa chỉ (cổng G0 trước S1), bên dùng đầu tiên, kiểm tra doctor, người chịu trách nhiệm adapter.

## Những thay đổi lớn đã áp

| Thay đổi | Lý do | Nhóm |
|---|---|---|
| Tách `deliver()` thành verb `drain` phía người nhận và cổng `Nudge` chỉ mang tín hiệu một dòng. Thân tin chỉ đi một đường: người nhận đọc từ bản ghi | hook chạy ở người nhận, không thể là lệnh `deliver()` của người gửi; một đường đóng khung duy nhất | giả định |
| Claude Code mặc định tầng `turn`; `push` chỉ khi session được khởi động với `accept` giới hạn. `SendMessage` là đường ngoài mailbox | `SendMessage` là công cụ của model, component không gọi được; tiến trình không phải session bị giữ sau hộp thoại | giả định |
| `reply_to` do component suy ra từ bản ghi, không do agent đặt; `depth` lưu lúc ghi; ngân sách gửi theo session; quy tắc `wake` dựa trên chuỗi đã suy | agent bỏ trống `reply_to` là né được chuỗi sâu, quy tắc `wake` và loại `notice` | vòng phản hồi, giả định |
| Hạn "đang bay" xét lười ở lần đọc kế tiếp; bảng trạng thái có `in-flight` và người chuyển trạng thái; bỏ `held` và khoá `inbound.<class>` khỏi lát này | không có daemon thì không tiến trình nào đánh thức lúc hết hạn; `held` không có người duyệt | giả định, vòng phản hồi |
| Từ chối ở `send` trả ngay trong kết quả, không ghi; `notice` ở làn riêng, gộp, không bao giờ trả lời | tránh `notice` về `notice` và tin từ chối tự sinh lượt trả lời | vòng phản hồi |
| Hàng đợi: từ chối tin mới, phần chia theo người gửi, chỗ dành cho người; TTL bản ghi 24 giờ, thân tin 7 ngày | tránh bỏ đói và tránh phát lại chỉ thị cũ cho session kế nhiệm | vòng phản hồi |
| `inbox` liệt kê cả tin đang bay và nhận luôn; một nudge chưa xử lý cho mỗi địa chỉ; chỉ dẫn "không hỏi `inbox` định kỳ" | tránh vòng hỏi liên tục | vòng phản hồi |
| Bản ghi là một file mỗi tin trong thư mục `pending/`, `inflight/`, `done/`, `notices/`, chuyển trạng thái bằng `rename` nguyên tử | hợp đồng đồng thời rõ; hook chỉ cần `test -e` | giả định |
| Hook là một dòng lệnh có lớp chặn (thoát ngay khi `pending/` rỗng), ngắt mạch sau nhiều lần lỗi liên tiếp | hook chạy sau mỗi tool; chi phí quan trọng hơn ngôn ngữ | giả định |
| Cài hook qua `src/setup/agent-hooks.mjs`: gom bốn hàm cài thành một bảng, thêm loại hook `mailbox` | một cửa; bộ cài và bộ dò doctor đã có | giao hàng |
| Crate `packages/mailbox/{contracts,rust}`, nối mỏng ở `apps/fgos/src/wiring/`, `adapters.v1.json` ghim `tested_against` | bố cục theo quy ước repo | giao hàng |
| `core/instructions/peer-input.md` qua bộ chiếu có sẵn | một nguồn chỉ dẫn | giao hàng |
| Địa chỉ là tên trong sổ đăng ký, ánh xạ tới tối đa một session; `recorded_at` thay `sent_at`; `id` mờ; cắt nhóm do người địa chỉ | định nghĩa địa chỉ nhất quán | giả định |
| Kế hoạch: cổng G0, S0 đo, S1 là adapter Claude Code chạy trọn vòng, S2 đo bão và vòng lặp, S3 Codex rồi agy | một adapter thật chạm mọi tầng, không cần đổi terminal-control | giao hàng |
| Quy tắc gõ tín hiệu: bỏ quy tắc cho phép gõ khi bận; bộ phân loại màn hình nằm trong dữ liệu adapter agy, phiên bản lạ thì `unknown` | tránh mâu thuẫn và phụ thuộc phiên bản | giả định |
| Tám tín hiệu thành chín, mỗi cái có ngưỡng; `status` thoát khác 0; `last_drain_at` cho hook bị bỏ qua | tín hiệu phải có người đọc | vòng phản hồi, giả định |

## Chỗ các nhóm bất đồng và lựa chọn

- **Nơi lưu bản ghi.** Nhóm giao hàng đề xuất luồng `local` của Event Store. Nhóm giả định đề xuất file mỗi tin. Chọn file mỗi tin cho lát này vì lớp chặn của hook chỉ tốn một `test -e`, luồng cần cache dẫn xuất cho view đổi được, và luồng thêm một phụ thuộc. Mục 15.2 chuyển sang Event Store khi bắt đầu lưu bền và liên máy; ba thao tác append, pending, mark không đổi. S0 đo để xác nhận.
- **Hình dạng hook.** Nhóm giao hàng muốn hook là verb `fgos hook` thuần; nhóm giả định muốn một dòng shell chặn trước. Chọn một dòng lệnh có lớp chặn do bộ cài viết, không có file script; S0 đo chi phí host để quyết định giữ lớp chặn hay không.
- **Kiểm tra doctor.** Cả hai nhóm lưu ý bộ dò có sẵn làm nó gần như miễn phí. Quyết định "chưa làm doctor" là của chủ repo nên không đổi; ghi thành câu hỏi 5, kèm `last_drain_at` làm bộ dò tạm.

## Chưa giải quyết

1. Hook báo "người vừa nhập" có trên Codex và agy không (S0); nếu thiếu, ngân sách và quy tắc `wake` dùng cửa sổ 10 phút.
2. `fgos hook` được cài ở host Rust hay `src/`: chưa xác nhận; ảnh hưởng chỗ đặt hook.
3. Manifest kiến trúc có biểu diễn được ranh giới crate Rust không.
4. Chi phí host cho mỗi lần gọi hook, chi phí bố cục file, độ trễ thật của Codex `queue`, và việc session do runner khởi động có mang được `accept` giới hạn: chưa đo.
5. Bên dùng đầu tiên và người chịu trách nhiệm adapter: chưa có.
