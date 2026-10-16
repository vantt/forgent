# Platform probe: ba test cho luật "miền của holder trước phải rỗng" (6.0.1 của design r5)

Bổ sung cho [report trước](implementation-261016-1205-platform-probe-windows-macos.md). Luật nguồn: [design r5 §6.0.1](design-261016-1220-lock-and-run-supervisor-foundation-v3-r5.md). Test cũ `git-borrow-blocking-hook` giữ nguyên (ghi lại khe race thô).

## 1. Thay đổi

- `tools/platform-probe/src/predecessor.rs` (mới): hàm `enter` cài đúng luật: lấy lock kernel, đọc `predecessor.json` cạnh file lock (`{domainKind, domainId}`), mở miền; không mở được = rỗng; mở được thì chờ `ActiveProcesses == 0` (hỏi lặp mỗi 2 ms, giữ handle đã mở trong lúc chờ) tới `drain`, hết hạn thì `kill_all` rồi chờ thêm một hạn, vẫn không rỗng thì nhả lock và trả `held (predecessor-domain-not-empty)`. Ngay lúc quyết định đi tiếp, `enter` kiểm các pid đang theo dõi còn sống không (còn sống = vi phạm).
- Holder (`githolder`) ghi `predecessor.json` **sau khi giữ lock, trước khi tạo miền**. Windows: job **có tên** `Local\fgos-probe-<pid>-<nanos>`, KILL_ON_JOB_CLOSE, không breakaway. Unix (đối chứng): miền = process holder (gate), rỗng = holder chết.
- Windows: `OpenJobObjectW` + `QueryInformationJobObject` + `TerminateJobObject` thật. Unix: hàm tương ứng trên pid.

## 2. Ba test mới

| Test | Làm gì | Qua khi |
|---|---|---|
| `git-borrow-blocking-hook-predecessor-check` | 50 lần: holder khoá + `git commit` bị chặn trong hook; contender đã chờ lock từ trước; kill holder; contender chạy luật; ghi `extraWaitMs` (p50/p95/max), số lần contender phải `TerminateJobObject`, số lần miền còn mở lúc kiểm | 0 lần đi tiếp khi git/hook-con còn sống, 0 lần `held` |
| `predecessor-record-stale` | 20 lần: record trỏ job đã huỷ (tạo rồi đóng handle) | luôn đi tiếp ngay, không mở được miền, không terminate; ghi độ trễ |
| `predecessor-drain-timeout` | Job có một member sống, handle job được giữ mở nên member không tự chết (kill-on-close không kích hoạt); drain 300 ms | đi tiếp chỉ sau khi hết drain, đã terminate, không còn member nào sống lúc đi tiếp; hoặc trả `held` có tên |

Ghi chú diễn giải trên Windows: nếu contender mở được job **trước khi** holder đóng handle cuối, kill-on-close không kích hoạt (contender giữ một handle) và job chỉ rỗng nhờ drain+terminate. Đó là đường mà `contenderTerminatedDomain` và `extraWaitMs` p95/max sẽ lộ ra: nếu p95 gần 2000 ms thì mặc định `predecessorDrainMs` đang làm chậm đường thường, và nên cân nhắc cho contender gọi terminate sớm hơn (holder trước đã chết nên được phép).

Đường `held` thật (member không chết dù đã terminate) không dựng được một cách trung thực trên cả hai OS (mọi process đều chết khi `TerminateJobObject`/SIGKILL), nên test 3 chỉ chứng minh nhánh drain+terminate và bất biến "không đi tiếp khi còn sống"; nhánh `held` chỉ được kiểm bằng điều kiện trả về của `enter`.

## 3. Đối chứng Linux (12/12 pass)

| Test | Số đo |
|---|---|
| predecessor-check | 50/50, 0 vi phạm, 0 held, extraWaitMs p50 0.0 / p95 0.0 / max 0.1 (miền = holder đã chết; lock chỉ trống sau khi orphan hết nhờ fd kế thừa) |
| predecessor-record-stale | 20/20 đi tiếp ngay, extraWaitMs max 0.0 |
| predecessor-drain-timeout | đi tiếp sau 304 ms, đã terminate, 0 sống lúc đi tiếp, member chết |

Số Windows thật chỉ có sau khi chạy exe/CI. macOS chạy cùng bộ unix như đối chứng (miền = process holder, chưa quét cây).

## 4. Build

`cargo clippy` sạch cho host và `x86_64-pc-windows-gnu`; `cargo zigbuild --release --target x86_64-pc-windows-gnu` thành công. Exe: `/home/vantt/projects/forgentX/.fgos/runtime/tmp/platform-probe/fgos-platform-probe.exe`, sha256 `f5f8c3f335df86d254ae3a3ce8f6d9e123a8122a32161b818b7301751734310c`. Lần chạy Windows đầy đủ giờ có thêm 3 test, test 1 mất khoảng vài chục giây (đã cho timeout 420 s).

## 5. Câu hỏi mở

- Đi tiếp trên macOS dùng "process holder chết" chứ chưa quét cây con cháu; nếu muốn đo mức `best-effort` đúng nghĩa của r5 thì cần thêm vòng quét `proc_listchildpids` vào `domain_open`.
- Cách `enter` hỏi lặp 2 ms thay vì completion port `JOB_OBJECT_MSG_ACTIVE_PROCESS_ZERO`: đủ để đo bất biến, chưa đo độ trễ của port.
