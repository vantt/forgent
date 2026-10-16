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

## 6. Chạy Windows thật (run 38855793498) và chẩn đoán

Windows 11 build 26100, Git for Windows 2.56. Kết quả: `git-borrow-blocking-hook-predecessor-check` 27/50 vi phạm (`domainStillOpenWhenChecked` 4, extraWait p95 3.0 ms, max 3.8 ms), `predecessor-drain-timeout` đi tiếp với pid 3240 còn chạy ngay sau `TerminateJobObject`, `git-borrow-auto-gc` thô thấy lock trống 0.2 ms trong khi process cuối chết sau 3.4 ms.

**Kết luận: (b) ngữ nghĩa thật của Windows, không phải lỗi đo. Luật r5 §6.0.1 như đã viết chưa đủ.**

Loại trừ (a):
- Cách probe phán "còn sống": `OpenProcess(SYNCHRONIZE)` rồi `WaitForSingleObject(h, 0) == WAIT_TIMEOUT`; mở không được thì coi là chết. Đây đúng là phép thử "process object đã signaled chưa" (không phải "mở được là sống"). Bản mới ghi thêm `GetExitCodeProcess` cho từng pid.
- Tái dùng pid: không thể giải thích 27/50 lần (và pid watch được đọc vài ms trước khi kill, vòng đời pid Windows không xoay nhanh đến mức đó).
- Số liệu tự nó chỉ ra cơ chế: 27 vi phạm nhưng chỉ 4 lần mở được job. Vậy ít nhất 23 lần `OpenJobObject` thất bại (job "đã huỷ" = rỗng theo luật) trong khi git/hook-con còn chạy. Nguyên nhân: job có tên chỉ có một handle (của holder). Holder chết là handle cuối đóng, tên biến mất ngay, còn `KILL_ON_JOB_CLOSE` kết thúc các member **bất đồng bộ** sau đó (3.4-4.1 ms). "Không mở được job" vì thế **không** chứng minh member đã chết; luật "open fail = rỗng" sai khi job chỉ do holder giữ.
- Trường hợp mở được job (<=4 lần, và test drain-timeout): `ActiveProcesses == 0` (sau `TerminateJobObject`) vẫn có pid chưa signaled. Bộ đếm job giảm khi process bắt đầu bị kết thúc, còn process object chỉ signaled khi mọi thread đã thoát. Tức là `ActiveProcesses == 0` cũng chưa phải "đã chết hẳn".

Process đã bắt đầu bị terminate có còn ghi được không: không có code user-mode mới chạy sau khi thread nhận lệnh kết thúc, nhưng một thao tác ghi đã gửi xuống I/O (đồng bộ, đang chạy trong kernel) có thể hoàn tất sau khi job báo rỗng, vì thread chỉ thoát (và process object chỉ signaled) khi I/O treo đã xong hoặc bị huỷ. Probe không chứng minh được "ghi muộn" cụ thể, nhưng tín hiệu an toàn duy nhất là process object đã signaled, nên luật phải chờ tín hiệu đó.

### Sửa luật (đã cài trong probe)

1. **Phải có người giữ handle job ngoài holder** (supervisor/gate, đúng như §5.3 đã nói "gate cũng giữ handle"). Job sống qua cái chết của holder, người acquire tiếp mở được nó. Không có điều này, tên job biến mất cùng holder và không còn cách nào biết ai chưa chết. Với job chỉ do holder giữ (test `...-holder-owned`, chỉ ghi nhận, luôn pass) thì mở-không-được không được tin là rỗng; chưa có cách nào đo đúng từ ngoài, nên kết luận là **cấm** cấu hình đó cho `run_borrowed`/attempt trên Windows.
2. **Rỗng = (`ActiveProcesses == 0`) VÀ (mọi member đã signaled)**: contender mở job, lấy danh sách pid member bằng `JobObjectBasicProcessIdList` (lặp lại mỗi lần hỏi để bắt member mới), mở `SYNCHRONIZE` handle cho từng pid rồi chờ chúng signaled. Giữ handle process nên pid không bị nhầm do tái dùng.
3. Sau `TerminateJobObject` cũng chờ cùng điều kiện (không tin giá trị trả về hay bộ đếm).

### Test sau sửa

- `git-borrow-blocking-hook-predecessor-check`: job do probe (supervisor) giữ; phải 0 vi phạm. Khi lỗi, `violationEvents` có từng lần: pid, vai trò (git/hook-foreground/hook-background), `inSupervisorJobBeforeKill` (đo bằng `IsProcessInJob`), trạng thái tại lúc quyết định (`running`/`exited code=`), `deadMsAfterDecision`, `domainOpenedWhenChecked`, mốc thời gian.
- `git-borrow-blocking-hook-predecessor-check-holder-owned` (mới): giữ lại cấu hình cũ để ghi hazard; luôn pass, ghi số lần tên job đã biến mất.
- `predecessor-drain-timeout`: sau terminate chờ member signaled mới đi tiếp.
- `git-borrow-blocking-hook` / `git-borrow-auto-gc` thô trên Windows: thấy lock trống khi còn process thì pass kèm ghi chú "raw race reproduced" (đây là chủ đích: ghi lại khe), không còn fail.

Chưa chạy lại trên Windows thật. Nếu lần chạy tới `...-predecessor-check` vẫn có vi phạm thì sự kiện `violationEvents` sẽ cho biết còn pid nào, ở trạng thái nào, ngoài job hay trong job.

Exe mới: sha256 `c9c136f6e63f6eb5885a7fb6d08b5144a75fd7d5182bcff5fd5db4e957875141`.
