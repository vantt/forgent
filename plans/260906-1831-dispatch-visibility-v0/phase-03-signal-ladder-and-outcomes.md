# Phase 03 — Signal ladder, outcome có type, pane làm forensics

Lease: `herdr-adapter` (chia sẻ với Phase 02, tuần tự sau nó) | Vào được sau: Phase 02

## Context

- Thiết kế: [§8.1 state machine, §8.5 output channels](../../docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md), §8.7 process ownership.
- Bằng chứng ngược: `docs/history/agy-herdr-false-idle-polling-race/RESEARCH.md` — false idle 3.5 s lúc khởi động, dip giữa turn ~25%, và 3-poll debounce chỉ là vá heuristic mà chính tác giả ghi là "không phải chứng minh không bao giờ".
- Bằng chứng thuận: upstream ladder (result › liveness › progress › classify), fail-open trên liveness, died phải liên tiếp.

## Requirements

R1. Ladder theo đúng thứ tự, không rút gọn:
1. **Truth** — `outbox/result-<round>.json` tồn tại. Thắng mọi tín hiệu khác.
2. **Liveness** — `pane process-info`: agent có mặt khi tồn tại foreground pid khác `shell_pid`. Pane còn sống không phải agent còn sống.
3. **Progress** — mtime của log worker, hoặc `agent_status === 'working'`.
4. **Classification** — chỉ chạy khi progress đã cũ. Đọc màn hình ở đây, không đọc mỗi tick.

R2. Liveness read **fail open**: đọc không được thì trả `unknown`, không bao giờ `absent`.
Một cổng từ chối được phép từ chối trên thông tin xấu; một quyết định giết thì không.

R3. `died` phải qua nhiều lần đọc `absent` **liên tiếp**; một lần `unknown` **reset** bộ đếm.
Chuỗi absent/unknown/absent không bao giờ kết thúc một Run khoẻ mạnh.

R4. Outcome có type, mỗi cái quyết định số phận pane:

| Outcome | Kết luận từ | Pane |
|---|---|---|
| `settled` | result file hợp lệ | đóng |
| `blocked` | herdr báo `blocked` | giữ, người trả lời |
| `died` | N lần absent liên tiếp, không result | giữ làm forensics |
| `timed-out-idle` | heartbeat cũ quá `idleTimeout`, không khớp mẫu usage-limit | giữ |
| `timed-out-ceiling` | quá trần tuyệt đối bất kể hoạt động | giữ |
| `paused-limit` | heartbeat cũ + màn hình khớp mẫu usage limit | **luôn giữ**, kể cả `--close-always` |

R5. `agent_status` chỉ được dùng để quyết định **khi nào nhìn**, không bao giờ quyết định
**có tin hay không**. Xoá `sawWorking` và 3-poll debounce — chúng là vá cho một thiết kế
đã bị thay, giữ lại là giữ nợ.

R6. Wait nào bỏ cuộc cũng phải đọc màn hình trên đường ra và nêu dòng khớp được, thay vì
chữ timeout chung chung. Pass chẩn đoán này chỉ chạy sau khi đã thất bại nên dương tính giả không tốn gì.

R7. Event stream `pane.agent_status_changed` chỉ được dùng làm gợi ý rút ngắn độ trễ, **không**
thay poll. Upstream đã thử và từ chối: edge-triggered thì bỏ lỡ một edge là sai mãi, im lặng
không phân biệt được với `working`, và nó không nói gì về result file.

R8. `pane close` không phải cancel. Đã đo: foreground chết, `setsid` sống sót. Outcome nào
để lại con cháu phải nói thật là `unknown`, không được báo `cancelled`.

## Files

Sửa:
- `src/runner/dispatch/transport.mjs` — thay vòng poll.
- `src/runner/dispatch/result-ladder.mjs` — nhận thêm outcome mới, giữ nguyên ba bậc cũ cho `cli-spawn`.

Tạo:
- `src/runner/dispatch/liveness.mjs` — ladder thuần, không I/O, nhận observation vào trả quyết định ra. Test được không cần herdr.
- `test/runner/dispatch-liveness.test.mjs`.

## Steps

1. Impact analysis trên `buildDispatchResult` trước khi mở rộng.
2. Viết `liveness.mjs` như hàm thuần trước, test bảng đầy đủ: absent/unknown/absent, absent×3, result-thắng-mọi-thứ, usage-limit.
3. Nối vào adapter, xoá `sawWorking` và debounce cùng lúc — không để hai cơ chế song song.
4. Sửa `closePaneBestEffort` thành có điều kiện theo outcome.
5. Thêm chẩn đoán màn hình lúc bỏ cuộc.

## Validation

- Bảng test của `liveness.mjs` phủ đủ 6 outcome cộng ca reset bộ đếm.
- Live: giết agent giữa chừng, xác nhận `died` trong vài giây và pane còn mở.
- Live: một Run thất bại để lại pane, đọc được màn hình cuối.
- `npm test` xanh.

## Risks and rollback

- **Xoá debounce làm quay lại false idle.** Không, vì hoàn thành không còn kết luận từ `agent_status` nữa; đó chính là lý do được phép xoá. Nếu test live cho thấy ngược lại thì dừng và xem lại Phase 02, đừng thêm debounce trở lại.
- **Giữ pane lại làm rác tích tụ.** Chấp nhận, kèm `--close-always` cho chạy tự động và một sweep báo cáo pane còn sống mà Run đã reconcile.
- **Rollback**: `liveness.mjs` chỉ được gọi từ adapter; hoàn nguyên hai file là đủ.
