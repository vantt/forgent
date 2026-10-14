# Lane B — cờ gọi provider: `--effort` và cảnh báo model

Nhánh: feat/dispatch-effort-model. Đọc lanes/common.md trước.
Không cần council, nhưng prior art bắt buộc: effort đã có trong provider-adapter.mjs (`--effort` là cờ policy) và assignment-policy.mjs:65; pane "Lead handoff 261013" vừa chỉnh Reasoning effort bằng cấu hình — tìm commit đó (`git log -G'effort' --since=2026-10-10`).

4. Cờ `--effort <level>` cho `dispatch execute` để chỉnh mức effort (Codex trước, rồi các provider có khái niệm tương đương) ngay trong lệnh, không phải sửa config. Phải tôn trọng ranh giới policy: nếu effort đang bị khoá như runtime policy có chủ đích thì cờ phải đi qua cùng đường hợp lệ hoá, không mở cửa sau. Giá trị không hợp lệ cho provider → lỗi rõ ràng.
5. Cảnh báo model: khi `--model` truyền vào không khớp model executor thật sự dùng (bị config ghi đè, hay CLI bỏ qua), hoặc model không được provider hỗ trợ, execute báo cảnh báo có cấu trúc trong kết quả (không chỉ stderr). Chứng minh trước bằng một trường hợp thật model bị lệch.
Vùng file: src/runner/dispatch/provider-adapter.mjs, config.mjs, phần parse cờ execute trong cli.mjs.

## Cập nhật sau hội đồng một-cửa (2026-10-14 12:40)

Đọc reports/council-261014-1231-dispatch-one-door-conclusion.md. Hướng của lane khớp kết luận. Bằng chứng hội đồng: transport không đưa effort vào argv (`transport.mjs:169-174`), không CLI nào đặt `cliOverride.reasoningEffort`. Làm: `--effort` parse một lần thành override của `bind()` rồi đẩy vào argv ở tầng transport chung; cảnh báo model-drift ghi thành provenance trong RunResult (receipt `assignment-run-result` v3). Không thêm hành vi riêng cho một cửa.
