# Phase 02 — Adapter chuyển sang `agent start` và brief-as-file

Lease: `herdr-adapter` (chia sẻ với Phase 03, phải tuần tự) | Vào được sau: Phase 01

## Context

- Hình dạng đích: [§8b.3 sequence](../../docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md), §8.2 readiness, §8b.6 brief-as-file.
- Bằng chứng: §12b (`agent start` hấp thụ boot race, trả typed failure), §12c (P6 end-to-end).
- Code hiện tại: `src/runner/dispatch/transport.mjs:549-971` (`herdrSpawnInteractiveAdapter`).
- Lịch sử vì sao đường cũ sai: `docs/history/agy-herdr-interactive-mode-multiline-prompt-corruption/RESEARCH.md`, `docs/history/agy-herdr-false-idle-polling-race/RESEARCH.md`.

## Requirements

R1. Khởi động agent bằng `herdr agent start <runId> --kind <k> --pane <p> --timeout <ms> [-- <args>]`.
**Xoá hoàn toàn** đường `pane run` để khởi động. Kèm retry có giới hạn khi gặp pane-busy.

R2. Prompt không bao giờ nằm trong command line. Mặc định `promptDelivery: file-pointer`:
ghi `outbox/brief-<round>.md` rồi gửi một dòng trỏ tới nó qua
`herdr agent prompt <runId> "<pointer>" --wait --timeout <ms>`.
`inline` là lựa chọn khai báo được, đã có bằng chứng cho claude, không phải mặc định.

R3. Ready gate nhận **`idle` hoặc `done`**. `done` là trạng thái nghỉ bình thường của pane
`--no-focus` vì CLI read không mark seen. Đo được ở P6, không phải suy đoán.

R4. Receipt là file worker ghi: `outbox/ack-<round>.json` xuất hiện, hoặc `outbox/result-<round>.json`
cho vòng quá nhanh. `agent_status` **không bao giờ** là receipt.

R5. Ba lỗi của transport phải là ba outcome khác nhau, không gộp thành timeout chung:
`agent_not_ready`, `agent_prompt_stalled`, `agent_blocked` kèm dòng màn hình đã khớp.

R6. Resend chỉ khi agent quay lại ready mà vẫn chưa có ack. Không bao giờ resend theo đồng hồ
khi agent đang `working`. Có trần đếm và trần thời gian riêng.

R7. Deadline phía fgOS phải dài hơn hẳn stall detector 5 giây của herdr, nếu không hai cái đua
nhau và caller nhận timeout transport trước khi detector kịp bắn. Upstream đo 5 s hỏng, 20 s được.

R8. Brief dạy worker đúng một cử chỉ: ghi file `.tmp` rồi rename. Thứ tự là hợp đồng:
report trước, result sau cùng, vì sự xuất hiện của result là thứ kết thúc vòng.
Brief không được nhắc bất kỳ lệnh fgOS nào.

## Files

Sửa:
- `src/runner/dispatch/transport.mjs` — thay thân `herdrSpawnInteractiveAdapter`.
- `src/runner/dispatch/config.mjs` — validate `promptDelivery`.

Tạo:
- `src/runner/dispatch/herdr-agent.mjs` — bọc mỏng các lệnh herdr (`agent start/prompt/wait/get/read`, `pane split/close/process-info`), một chỗ duy nhất parse JSON và dịch mã lỗi của herdr thành `DispatchError` có tên.
- `src/runner/dispatch/brief.mjs` — render brief và pointer.
- `test/runner/herdr-agent.test.mjs`, mở rộng `test/runner/herdr-spawn-adapter.test.mjs`.

Không đụng: `cliSpawnAdapter`, `httpAdapter`, `result-ladder.mjs` (Phase 03).

## Steps

1. Impact analysis trên `herdrSpawnInteractiveAdapter` và `EXECUTOR_ADAPTERS`; báo blast radius trước khi sửa.
2. Viết test đỏ trước cho R3 (`done` phải được nhận), R5 (ba lỗi ba tên), R6 (không resend khi `working`).
3. Dựng `herdr-agent.mjs` với fake backend, không test nào cần herdr thật.
4. Thay thân adapter. Giữ nguyên contract trả về `{status, stdout, paneId}` để Phase 03 và ladder chưa phải đổi cùng lúc.
5. Xoá đường `pane run` khởi động và mọi nhánh chỉ tồn tại để phục vụ nó.
6. Cập nhật test cũ: những test khẳng định `pane run` là đường khởi động phải chết theo đúng nghĩa, không được sửa để vẫn xanh.

## Validation

- `node --test test/runner/herdr-*.test.mjs test/runner/dispatch.test.mjs` xanh.
- `npm test` xanh.
- Một live proof với claude: prompt thật nhiều dòng của `fgos-coding-implement` tới nơi nguyên vẹn, ack xuất hiện, result xuất hiện. Ghi log vào `reports/`.
- Một live proof âm: dựng cố tình một pane có dialog và xác nhận nhận `agent_blocked` kèm dòng màn hình, không phải timeout.

## Risks and rollback

- **Đổi thân adapter làm mất đường đang chạy được.** Thực tế `agy-herdr` đang không dùng được cho prompt thật, nên rủi ro hồi quy thấp; nhưng `cli-spawn` tuyệt đối không đụng.
- **`agent start` không hỗ trợ kind cần dùng.** Danh sách kind của herdr 0.8.2 có `claude`, `codex`, `agy`, `gemini` và nhiều loại khác. Kind lạ thì refuse có type, không tự quay về `pane run`.
- **Rollback**: adapter cũ nằm trong git; hoàn nguyên một file `transport.mjs` là đủ, vì các module mới chỉ được gọi từ đó.
