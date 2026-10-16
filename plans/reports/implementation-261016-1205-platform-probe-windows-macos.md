# Platform probe: đo cơ chế lock và containment trên Windows / macOS

Công cụ: `tools/platform-probe/` (package Rust riêng, có `[workspace]` rỗng nên không dính workspace chính; dep: `serde_json`, `libc` trên unix, `windows-sys` trên Windows). Phục vụ spike X1 (Windows) và X2 (macOS) của [design r4](design-261016-1107-lock-and-run-supervisor-foundation-v3-r4.md) (§6.0, §5.3, §11) và [phase 14](../261016-1104-holder-lock-kernel-lock-foundation/phase-14-cross-platform-drivers-handoff.md).

## 1. Cách dùng

Binary tự gọi lại chính nó với `--role ...` (không cần Node hay tool nào khác). `git` tuỳ chọn: không có thì hai test git ghi `skip`. Mỗi test có timeout cứng, luôn ghi report, tự dọn process và thư mục tạm.

```
fgos-platform-probe [--out DIR] [--only a,b] [--list]
```

Ra `probe-report-<os>.json` (OS, phiên bản, git, filesystem của thư mục tạm, từng test: status pass/fail/skip, thời gian, `expect`, `note`, `data` số đo) và in bảng tóm tắt ra màn hình. Luôn thoát 0 nếu ghi được report; "fail" nghĩa là kết quả đo phản bác giả định của design, không phải lỗi công cụ.

### Hướng dẫn cho anh (Windows)

1. Copy `fgos-platform-probe.exe` sang máy Windows (vd `C:\Users\<anh>\Desktop`). Bản build: `/home/vantt/projects/forgentX/.fgos/runtime/tmp/platform-probe/fgos-platform-probe.exe`, sha256 `9efea458334ed0d6e317079fa4c0cf0341ba3a59e420e7374a60bb71ca5b10c7` (kiểm bằng `Get-FileHash .\fgos-platform-probe.exe`).
2. Mở PowerShell hoặc cmd **thường** (không cần admin), `cd` tới thư mục chứa file.
3. Chạy `.\fgos-platform-probe.exe` (cmd: `fgos-platform-probe.exe`). Mất khoảng 1-2 phút, đừng đóng cửa sổ. Nếu SmartScreen/Defender hỏi thì chọn "Run anyway" (exe không ký). Nếu cài Git for Windows (git có trên PATH) thì hai test git sẽ chạy; nếu không có thì bị skip, vẫn gửi.
4. Gửi lại file `probe-report-windows.json` nằm cùng thư mục (và ảnh chụp bảng tóm tắt nếu tiện). Để chạy trong thư mục khác: `--out C:\temp`.
5. macOS: cách nhanh nhất là chạy workflow (mục 4). Hoặc trên máy Mac có Rust: `cd tools/platform-probe && cargo run --release`.

## 2. Mỗi test đo gì, kết quả nào xác nhận / phản bác r4

### Windows (X1)

| Test | Đo | Xác nhận r4 | Phản bác r4 |
|---|---|---|---|
| `lockfileex-released-on-terminate` | Holder giữ `LockFileEx` exclusive; `TerminateProcess` holder; thời gian tới khi lock trống | Lock thấy được khi giữ; trống ngay sau khi holder chết | Lock không nhả → process giữ lock không dùng được làm điểm tựa kernel |
| `holder-exits-when-parent-dies` | Holder chờ handle cha; kill cha; ms tới khi holder thoát, ms tới khi lock trống | Holder thoát (và lock trống) trong vài trăm ms | Holder không thoát → cần cơ chế khác (stdin close, job) |
| `lockfileex-inherited-handle-after-parent-death` | Process cha khoá bằng handle kế thừa được, con giữ handle; kill cha; lock còn hay trống | Lock trống khi process khoá chết dù con giữ handle ⇒ không thể "mượn" bằng kế thừa như POSIX, phải có holder job-scoped (§6.0 dòng Windows). Chỉ ghi nhận ngữ nghĩa (kết quả `semantics`) | Lock còn giữ qua handle kế thừa ⇒ Windows mượn được như POSIX, có thể đơn giản hoá driver |
| `job-kill-on-close-whole-tree` | Owner tạo Job `KILL_ON_JOB_CLOSE` (không BREAKAWAY_OK), đưa cây vào: con, cháu (`fanout`), con `DETACHED_PROCESS`, con thử `CREATE_BREAKAWAY_FROM_JOB`; kill owner; ms tới khi mọi process chết | Cả 5 process chết, breakaway bị từ chối (`denied os_error=5`) | Có process sống sót, hoặc breakaway được phép ⇒ đường thoát của driver `job-object` lớn hơn design nói |
| `job-active-process-count` | `ActiveProcesses` của `QueryInformationJobObject` = 5 khi cây chạy; `TerminateJobObject` rồi ms tới khi = 0 | Đếm đúng, về 0 | Đếm sai hoặc không về 0 ⇒ `is_empty` bằng `ActiveProcesses` không tin được |
| `git-borrow-blocking-hook` | Holder (trong job KILL_ON_JOB_CLOSE của chính nó, tự gán mình) khoá file rồi chạy `git commit` có hook `post-commit` chạy nền một sleeper và chạy nổi một sleeper chặn vô hạn; kill holder giữa chừng; lấy mẫu mỗi 3 ms: lock trống mà git/hook-con còn sống = vi phạm | 0 vi phạm, mọi process (git, sh, hook-con) chết cùng job, lock trống sau đó | Có vi phạm hoặc sống sót ⇒ mượn bằng job không đủ (B3 vẫn hở) |
| `git-borrow-auto-gc` | Như trên với `gc.auto=1` + loose object (>=2 trong `objects/17`), kill holder ngay khi git xong; theo dõi `gc.pid` của gc tách nền | Như trên; ghi thêm gc có chạy nền trên Git for Windows hay không (`autoGcObservedRunning`) | Như trên |
| `toolhelp-ancestry` | Snapshot Toolhelp: chuỗi cha từ cháu lên probe; thời gian snapshot | Chuỗi đủ, snapshot vài chục ms ⇒ kiểm tổ tiên của hook khả thi | Chuỗi thiếu hoặc chậm ⇒ kiểm hook phải dựa token |
| `herdr-on-path` | `herdr` có trên PATH, `herdr --version` chạy | Chỉ báo cáo (quyết định cách `terminal` trên Windows) | không |

### macOS (X2) và Linux (đối chứng), cùng một bộ unix

| Test | Đo | Xác nhận r4 | Phản bác r4 |
|---|---|---|---|
| `flock-released-on-sigkill` | Holder `flock` LOCK_EX; SIGKILL; ms nhả | Nhả ngay | Không nhả ⇒ `flock` macOS không dùng làm lock kernel |
| `flock-fd-inherited-keeps-lock` | Con kế thừa fd; SIGKILL cha; lock còn; nhả khi con chết | Còn giữ sau khi cha chết, nhả khi con chết (ngữ nghĩa description) ⇒ đổi mức macOS từ `kernel-unmeasured` sang `kernel` | Lock nhả khi cha chết ⇒ mượn fd cho git không bảo vệ được |
| `flock-fd-passed-by-scm-rights` | Gửi fd qua socket (`SCM_RIGHTS`), người gửi bị SIGKILL | Lock còn ở người nhận, nhả khi nhận đóng fd (cổng `terminal`) | Ngược lại |
| `process-group-kill` | Cây 7 process trong một pgroup; `killpg(SIGKILL)` | Tất cả chết | Có process còn sống |
| `setsid-double-fork-escaper` | Process `setsid` + fork đôi có sống qua killpg không; cha mới là ai (`launchd`?), sid/pgid khác | macOS: **sống sót** và cha là `launchd` (xác nhận mức `best-effort`, đường thoát đã nêu ở §5.3) | Chết theo group ⇒ macOS tốt hơn design nói (nâng mức được) |
| `tree-scan-and-kill-all` | Cây 40 process (3 tầng x 3); quét con cháu bằng `proc_listchildpids` (macOS) hoặc quét `/proc` (Linux), đối chiếu `ps -axo` (dùng sysctl KERN_PROC); kill_all = SIGSTOP + quét lại tới ổn định + SIGKILL; thời gian | Tìm đủ 39 con cháu bằng cả hai cách, kill hết, thời gian đủ nhỏ để chạy trước deadline | Thiếu con cháu / còn sống ⇒ `pgroup-tree` không đủ tin |
| `git-borrow-blocking-hook`, `git-borrow-auto-gc` | git mượn fd (fd kế thừa), hook nền + gc tự động, kill holder mid-run; lấy mẫu lock | 0 vi phạm: lock không bao giờ trống khi git hoặc con còn sống (giữ nhờ fd kế thừa) | Có vi phạm |
| (meta) `tempDirFilesystem` | Loại filesystem của thư mục tạm (macOS: `apfs`) | | Nếu khác, ghi vào đo `flock` |

Lưu ý diễn giải ở unix: không có job nên sau khi kill holder các orphan **còn sống** và lock còn giữ qua fd (`orphansSurvivedHolderDeath=true`); probe sau đó tự kill orphan và đo thời gian nhả. Đó là hành vi mong đợi của driver `flock` (khác Windows, nơi mọi thứ chết theo job).

## 3. Kết quả đối chứng Linux (máy build, kernel 6.8, git 2.34.1, ext4, 9/9 pass)

| Test | Số đo |
|---|---|
| flock-released-on-sigkill | nhả 0.0 ms sau SIGKILL |
| flock-fd-inherited-keeps-lock | còn giữ sau khi cha chết; nhả 2.2 ms sau khi kill con |
| flock-fd-passed-by-scm-rights | còn giữ sau khi người gửi chết; nhả khi người nhận đóng |
| process-group-kill | 7/7 chết, 0.2 ms |
| setsid-double-fork-escaper | escaper sống sót killpg, cha mới = `1` (`systemd`), pgid và session khác group |
| tree-scan-and-kill-all | 39/39 con cháu (native `/proc` 6.1 ms, `ps` 15.8 ms), 2 vòng stop-rescan, kill_all xong 14.6 ms |
| git-borrow-blocking-hook | 0 vi phạm / 638 mẫu; orphan (git, hook fg, hook bg) sống sót nhưng lock còn giữ; nhả 2.2 ms sau khi kill orphan |
| git-borrow-auto-gc | 0 vi phạm / 638 mẫu; gc tách nền quan sát được (`autoGcObservedRunning=true`); hook nền là orphan còn giữ lock |
| herdr-on-path | `herdr 0.9.1-vantt.1` |

Báo cáo đầy đủ chạy local nằm ở `/home/vantt/projects/forgentX/.fgos/runtime/tmp/platform-probe/` khi chạy lại (không commit).

## 4. Build và giao

- Windows: `rustup target add x86_64-pc-windows-gnu`, `cargo install cargo-zigbuild`, rồi `cargo zigbuild --release --target x86_64-pc-windows-gnu` trong `tools/platform-probe/` (zig 0.16). Build thành công, 565 KB. `cargo clippy` sạch cho cả host và target Windows. Exe: `/home/vantt/projects/forgentX/.fgos/runtime/tmp/platform-probe/fgos-platform-probe.exe`, sha256 `9efea458334ed0d6e317079fa4c0cf0341ba3a59e420e7374a60bb71ca5b10c7`.
- CI: `.github/workflows/platform-probe.yml` (chỉ `workflow_dispatch`, ma trận macos-latest / windows-latest / ubuntu-latest, build + chạy + upload `probe-report-<os>.json`). Không sửa workflow nào khác. Lead tự push và kích hoạt: `gh workflow run platform-probe.yml` rồi `gh run download`.

## 5. Giới hạn và câu hỏi mở

- Code Windows và macOS **chỉ được kiểm kiểu bằng cross-compile Windows và build/chạy Linux**; chưa chạy thật trên Windows/macOS (đó chính là mục đích). Nên chạy workflow trước để bắt lỗi chạy trên macOS/Windows rồi mới đưa exe cho anh, vì một lỗi logic trong test sẽ hiện thành `fail` giả.
- Test `job-*` dựa vào việc process probe được phép tạo job lồng nhau (Windows 8+ cho phép). Nếu máy chạy probe trong một job cấm breakaway/lồng, `AssignProcessToJobObject` lỗi và test báo lỗi rõ ràng (ghi `assign-error`).
- `proc_listchildpids` trả về đơn vị khác nhau giữa các bản macOS (đếm hay byte), nên probe đếm số pid thật trong buffer thay vì tin giá trị trả về; số liệu đối chiếu bằng `ps`.
- Git for Windows chạy hook bằng `sh` bundled, đường dẫn exe trong hook đổi sang dấu `/`; nếu hook không chạy được thì `hookForegroundPid` thiếu và test báo lỗi "git did not reach the expected state".
- Chưa đo: chi phí "một process mỗi lock" ở quy mô lớn (X1 có nhắc), `acquireSync` từ Node, token một lần của hook. Đề xuất xử lý ở spike sau khi có số đo cơ bản; trừ khi anh muốn thêm vào probe này.
- Hai test git cần `git` trên PATH; máy Windows không có Git for Windows sẽ không đo được phần quan trọng nhất của X1 (git trong job). Cần xác nhận máy của anh có Git for Windows.
