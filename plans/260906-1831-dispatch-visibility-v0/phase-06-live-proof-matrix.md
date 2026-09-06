# Phase 06 — Live proof matrix

Lease: `v0-proof` | Vào được sau: Phase 05 | Đóng track khi phase này xanh

## Context

- Ma trận gốc: [§8.9 test/proof matrix](../../docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md), probe chưa chạy ở §12b (P3) và §12 (P1).
- Nguyên tắc: proof phải chứng minh **dùng được**, không chỉ **hợp lệ** (system-vision §4.6).

## Requirements

R1. Mọi ca dưới đây chạy hai lần: một lần với fake backend trong test suite, một lần thật.
Ca nào chỉ chạy được một trong hai thì ghi rõ là chỉ chạy được một.

| Ca | Fake | Live | Đóng câu hỏi nào |
|---|---|---|---|
| Startup race: idle giả trước khi ready | chuỗi `unknown,idle,working,…` cộng ack muộn | claude | Ready gate không bị lừa |
| `agent_not_ready` và `blocked` | mock trả lỗi | dựng dialog trust cố ý | Lỗi có tên, không timeout chung |
| Redraw màn hình | — | alt-screen, đọc report file | Evidence không phụ thuộc scrollback |
| **P3 gateway restart** | — | `herdr --session fgos-probe` riêng rồi `server stop`/start | `resume` là reattach hay relaunch |
| Reattach observer, không tạo contact | mock | hai process cùng watch | Observer khác actor |
| Ack mất, gửi lại có trần | mock | — | Không resend khi `working` |
| Pane id tái sử dụng | mock id mới sau close | — | Handle cũ không trỏ nhầm |
| Descendant sống sót | — | `setsid` con | `pane close` không phải cancel |
| Crash trước và sau RunResult | fixture crash | giết process dispatch | Reconcile ra `unknown` trung thực |
| **P1 agy tuân thủ** | — | 10 lần dispatch thật, prompt nhiều dòng thật | agy có giữ nhãn interactive không |
| Worker thử vượt rào | — | worker gọi `herdr pane list` và thử lái pane khác | HOME riêng có đóng được lỗ P7 |

R2. **P1 có tiêu chí số**: ≥9/10 lần có ack, 10/10 lần có result hoặc một failure có tên.
Dưới ngưỡng thì agy **mất nhãn interactive** trong capability profile và quay về `cli-spawn`.
Đây là kết luận về agy, không phải về thiết kế — không được sửa thiết kế để agy đạt.

R3. **P3 quyết một trường duy nhất**: pane sống qua restart thì `resume: reattach-or-relaunch`;
không sống thì `resume: relaunch-only` và `agentSession` là thứ duy nhất mang được qua.
Phải chạy trong session herdr riêng, không bao giờ trong `default` nơi có pane thật của người.

R4. Ca "worker thử vượt rào" phải chạy sau khi Phase 01 xong HOME riêng. Nếu Phase 01 kết luận
không tách được HOME thì ca này chuyển thành ghi nhận rủi ro đã biết, và capability profile
mang nhãn `unsafe: worker-can-drive-cockpit` — không được lặng lẽ bỏ ca.

R5. Mọi log thật lưu dưới `docs/architect/agent-coordination/verification/visibility-herdr/proofs/`,
kèm script tái lập được, đúng khuôn `2026-09-06-p6/` đã có.

## Steps

1. Chuyển ma trận R1 thành test file cho phần fake, chạy trong `npm test`.
2. Xin người mở một session herdr tên riêng cho P3; không tự restart session `default`.
3. Chạy P1 với agy, 10 lần, ghi bảng kết quả từng lần.
4. Chạy ca vượt rào.
5. Viết một trang tổng kết trong `verification/visibility-herdr/`, nêu rõ ca nào chỉ chạy fake.

## Validation

- Toàn bộ ca fake xanh trong `npm test`.
- Mỗi ca live có log lưu lại và một dòng kết luận.
- Định nghĩa hoàn thành của V0 trong `plan.md` được đối chiếu từng mục, không mục nào bỏ trống.

## Risks and rollback

- **Restart herdr giết pane thật của người.** Chặn tuyệt đối: chỉ session riêng, do người mở, xác nhận trước khi stop.
- **agy tốn token khi chạy 10 lần.** Dùng model rẻ nhất còn giữ được hành vi thật; prompt ngắn nhưng phải nhiều dòng.
- **Kết quả live không ổn định làm mất niềm tin vào cả track.** Ghi số thật kèm số lần chạy, đừng gộp thành "ổn định". Một ca chập chờn là một phát hiện, không phải một thất bại của plan.
