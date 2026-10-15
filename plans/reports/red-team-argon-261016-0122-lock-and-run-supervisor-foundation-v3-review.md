<!-- Nguồn: .fgos/assignments/unit-run-1792076240199-f5290412/producer/1/runs/01/outbox/report-1.md — gemini/tetcu72, gemini-4-argon-high (frontier), herdr pane, fgos run read-only, 2026-10-15/16, review vòng 1 của bản nháp v3 (fb3b6113e). Bản sao nguyên văn; bằng chứng: red-team-argon-261016-0122-lock-and-run-supervisor-foundation-v3-review-probes.json (bản sao evidence-probes.json). -->

# Báo cáo Phản biện Kiến trúc Độc lập (Red-Team Vòng 3) — Thiết kế Nền Lock & Run Supervisor Bản 3

- **Đối tượng kiểm toán**: `plans/reports/design-261015-2103-lock-and-run-supervisor-foundation-v3.md` (commit `fb3b6113e`) và `plans/reports/design-261015-2103-lock-and-run-supervisor-foundation-v3-probes.json`.
- **Đối chiếu lịch sử**: Bản 2 (`design-261015-1814-lock-and-identity-foundation-lead-design-v2.md`), phản biện vòng 2 (`red-team-astra-round2-261015-1859-lock-and-identity-foundation-design-v2-review.md`, B1–B9), Spike T8 (`spike-t8-261015-1841-controller-crash-during-herdr-and-cli-runs.md`), và Báo cáo Hội đồng (`architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md`).
- **Bằng chứng thực nghiệm**: Toàn bộ mã nguồn và kết quả JSON nguyên văn của 6 bộ probe đa tiến trình nằm tại `outbox/evidence-probes.json` (cùng bản tóm tắt trực tiếp trong mục 9 dưới đây).
- **Phán quyết tổng thể**: **CHƯA DUYỆT (Chặn triển khai cho tới khi sửa 3 lỗi CRITICAL và 6 lỗi HIGH)**. Chuyển nền từ `era-ledger` sang kernel lock (`flock` trên open file description) là quyết định kiến trúc đúng đắn, triệt tiêu tận gốc lớp lỗi double-reclaim TOCTOU của Bản 2 (B1, B4, B5). Tuy nhiên, Bản 3 mở ra **11 lỗ hổng mới (`R3-1` đến `R3-11`)** ở ranh giới truyền fd, vùng găng nóng `events.lock`, trạng thái zombie trong `process-facts`, cơ chế tombstone/quiescence lúc cutover, luồng `settle`/`adopt`/`reaper` của Run Supervisor, và `terminal-control` không khóa.

---

## 1. Tóm tắt Danh sách Phát hiện Mới (`R3-1` – `R3-11`)

| Mã | Mức độ | Mục thiết kế / Câu hỏi | Tóm tắt phát hiện (1 câu) | Bằng chứng probe / Mã nguồn |
|---|---|---|---|---|
| **R3-1** | **HIGH** | Câu 1, Câu 2 (B3), §6.1, §6.3, §6.4 | Truyền `main.lock` qua `stdio[3]` cho `git commit` phải tắt `FD_CLOEXEC` trên fd 3, làm rò rỉ open file description sang mọi daemon con do `git` hoặc hook sinh ra (`git gc --auto --detach`, `fsmonitor--daemon`, `gpg-agent`), gây kẹt khóa `main.lock` vô thời hạn sau khi `git commit` và Node đã thoát; đồng thời mô hình helper `lock-fd` không thể hoạt động trên Windows (`LockFileEx`) và mở file `'r'` (`O_RDONLY`) thất bại với `EBADF` trên macOS/BSD/NFSv4. | `probe-r3-1-git-fd3-daemon-leak.mjs` (`strangerCanLockAfterOwnerClosedFdAndGitExited: false`) |
| **R3-2** | **CRITICAL** | Câu 2 (B6), Câu 3, §6.6 | Bản 3 chỉ sửa `currentHead(repoRoot)` ở `claim-port.mjs:318` nhưng bỏ sót **2 đường thực thi `git` subprocess khác** nằm ngay trong `withEventsLock`: `getMainFgosDir` (`runtime-coordination.mjs:17` → `paths.mjs:77`, chạy 5 lần mỗi chu kỳ claim/settle) và `assertPlanEvidence` (`store.mjs:612, 622`, chạy khi `moveWork` sang `delivered` cho việc `risk: heavy`); đặc biệt cả hai đều bọc `execFileSync` trong `try/catch`, nên khi bật guard `exec-under-hot-lock` của §6.6, ngoại lệ của guard bị nuốt âm thầm làm sai lệch đường dẫn `claims.json` và làm hỏng giả tạo cổng `delivered`. | `probe-r3-2-hot-lock-exec-violation.mjs` (`totalExecSubprocessCountUnderEventsLock: 8`, `moveHeavyFalsePreconditionFailureWhenGuardSwallowedByTryCatch`) |
| **R3-3** | **HIGH** | Câu 2 (B7), Câu 3, §5.1, §6.6 | Tiến trình giữ `events.lock` chết nhưng chưa được cha `waitpid` (trạng thái zombie `Z` trong `/proc/<pid>/stat`) vẫn trả `kill(pid, 0) === true` và khớp `startTime`, khiến bảng `process-facts` (§5.1), `judgeOwner` và `resolveHolderLiveness` (`process-identity.mjs:67`) phán nhầm là `alive`/`held` và chặn đứng `state.reclaim`; ngược lại `process-identity.mjs:60` trả `'dead'` cho bản ghi hỏng thiếu `pid`, vi phạm luật fail-closed. | `probe-r3-3-zombie-holder-hot-lock.mjs` (`procStatState: "Z"`, `hotTryAcquireWhileHolderIsZombie: "held"`) |
| **R3-4** | **HIGH** | Câu 2 (B2), Câu 4, §6.8 | Cơ chế cutover tombstone & quiescence (§6.8) có 4 lỗ hổng: (a) `run.mjs:345-351` bắt mọi ngoại lệ `readFileSync` (kể cả `EISDIR` trên thư mục tombstone) rồi gán `holder = undefined` (**fail-open** khi resume); (b) quét `/proc/*/cmdline` và `/proc/*/cwd` theo main checkout bỏ sót hoàn toàn worker đang chạy trong linked worktree ngoài cây chính; (c) tombstone `.fgos/dispatch--<cwd>.lock` tạo lười (lazy) + lệch khóa giữa symlink (`path.resolve` ở v1) và `realpath`/`dev:ino` (ở v3); (d) bỏ sót `.fgos/porting/events.lock` (`porting-store.mjs:27`). | `probe-r3-4-cutover-tombstone-and-quiescence.mjs` (`hole4a_runMjsResumeFailsOpenOnTombstoneDir: true`, `hole4b_detectedByMainCheckoutQuiescenceScan: false`, `hole4c_symlinkVsRealpathTombstoneDiverges: true`) |
| **R3-5** | **CRITICAL** | Câu 5, §9.6, §9.7, §9.8 | Khi supervisor chết sau khi `settle-attempt` đã ghi `result.json` nhưng trước khi chạy xong `finalize-home` và `terminal-control.release`, bước `adopt` (§9.7 bước 2, `p4-adopt.mjs:21`) kiểm tra `if (existsSync('result.json')) return 'already-settled'` và thoát ngay, bỏ qua `finalize-home` — làm rò rỉ vĩnh viễn thư mục `home` cô lập, mất token OAuth vừa gia hạn (`credentialWriteBack`), và bỏ rơi pane terminal. | `probe-r3-5-supervisor-adopt-reaper-bugs.mjs` (`subprobe5A`: `adoptVerdict.reason: "already-settled"`, `privateHomeStillLeakedOnDisk: true`) |
| **R3-6** | **HIGH** | Câu 5, Câu 7, §9.7, §9.8 | Đụng độ hai thẩm quyền trên `attempt.lock`: §9.8 yêu cầu `reaper` giữ `attempt.lock` trong lúc xóa `home` của attempt đã chết, nhưng §9.7 bước 1 quy định `adopt`/`resume` hễ thấy `attempt.lock` đang bị giữ thì kết luận attempt còn sống (`attempt-lock-held` / `running`), khiến `fgos run --resume` báo sai trạng thái. | `probe-r3-5-supervisor-adopt-reaper-bugs.mjs` (`subprobe5B`: `adoptVerdictWhileReaperCleaningDeadAttempt.reason: "attempt-lock-held"`) |
| **R3-7** | **CRITICAL** | Câu 5, §9.2, §9.3, §10 | Chính sách *"supervisor chết thì agent chạy tiếp tới `hardCeilingMs`"* làm hỏng hoàn toàn chế độ `terminal` (`herdr-spawn`): các CLI agent tương tác (`claude`, `codex`, `agy`, `pi`, `omp`) là REPL không tự thoát sau khi ghi `outbox/result-1.json` mà chờ `agent-protocol` của supervisor gửi lệnh thoát; khi supervisor chết, agent đã làm xong việc bị treo trong pane suốt nhiều giờ tới `hardCeilingMs`, bị gate giết với `stoppedBy: "hard-ceiling"`, và bị `adopt` ghi đè kết quả thành `timeout` (`failed`). | `probe-r3-5-supervisor-adopt-reaper-bugs.mjs` (`subprobe5C`: `agentWroteOutboxDoneClaim: true`, `completedWorkOverwrittenAsTimeout: true`) |
| **R3-8** | **HIGH** | Câu 5, §9.3, `p4_gate.py` | Launch gate (`p4_gate.py`) có 3 lỗi cơ học: (1) vòng lặp chính khi chạm `hardCeilingMs` chỉ gửi `SIGTERM` mà không nâng cấp lên `SIGKILL`, nên bị treo vô hạn nếu worker chặn `SIGTERM`; (2) vòng dọn subreaper sau khi worker thoát chỉ duyệt `/proc/<gate>/task/<gate>/children` đúng 1 lượt `(SIGTERM, SIGKILL)`, làm lọt tiến trình cháu cấp 2 (`gate -> C1 -> C2`) sang PID 1 nếu `C1` chặn `SIGTERM`; (3) khi supervisor gửi `SIGTERM` ở hạn mềm rồi chết trước khi ghi `receipt.json`, gate ghi `stoppedBy: "stopped"` thay vì `"timeout"`, làm `adopt` phân loại sai. | `probe-r3-5-supervisor-adopt-reaper-bugs.mjs` (`subprobe5D`: `grandchildSurvivedGateSubreaperCleanup: true`, `sigtermIgnoringWorkerHungGatePastHardCeiling: true`) |
| **R3-9** | **MEDIUM** | Câu 5, Câu 7, §6.5, §9.1, §9.4 | Mâu thuẫn thứ tự khóa (lock rank) và thiếu bàn giao `cwd.lock`: §6.5 xếp `attempt` (rank 15) trước `dispatch cwd` (rank 30), nhưng code thật (`assignment-runner.mjs:2221`, `cli.mjs:728`) luôn lấy `dispatch cwd` ở đầu phiên trước khi tạo và khóa `attempt`; đồng thời §9.4 (`p4-controller.mjs`) chỉ truyền `attempt.lock` qua fd 3 mà quên truyền `cwd.lock` sang supervisor/gate, khiến `cwd.lock` mất ngay khi controller thoát/crash. | Đối chiếu `src/runner/dispatch/assignment-runner.mjs:2221` và `p4-controller.mjs` |
| **R3-10** | **HIGH** | Câu 6, §7.2, §7.5, §7.6, §7.7, §7.9 | Hai lỗi đua (race) trong `terminal-control` khi chọn Phương án (a) không khóa: (a) các seat song song cùng `unitRunId` (`groupKey`) trong một multi-agent unit gọi CLI `terminal-control allocate` đồng thời sẽ cùng đọc `groups/<groupKey>.json` khi chưa có `tabId` và mở N tab rời thay vì 1 tab chung; (b) vì `terminal-control` không biết `attempt.lock` (§4.2), hàm `sweep` (§7.7 dòng 2) xóa mọi pane chưa có dấu `launched` sau `allocationGrace`, đóng nhầm pane đang khởi chạy chậm (ví dụ đang probe bwrap hoặc chờ 5s `verifyForegroundProcessArgv`). | `probe-r3-6-terminal-control-races.mjs` (`expectedTabsCreatedForGroup: 1`, `actualTabsCreatedWithoutLock: 4`, `sweepClosesPaneWhileSlowLaunchHoldsAttemptLock: true`) |
| **R3-11** | **MEDIUM** | Câu 4, Câu 7, §11 | Lộ trình mục 11 xếp bước `4.4` (cập nhật `packages/distribution/rust/src/lock.rs` của `fgctl`) chạy *"song song sau 4.2"* cùng bước `4.3` (đặt tombstone thư mục `.fgos/main-checkout.lock`); nhưng `lock.rs:154-175` hiện đọc `.fgos/main-checkout.lock` bằng `fs::read_to_string`, nên nếu `4.3` vào trước `4.4` thì `fgctl` / `fgos setup` lập tức gãy với lỗi `MainCheckoutLockAmbiguous: Is a directory (os error 21)`. | Đối chiếu `packages/distribution/rust/src/lock.rs:154-175` và `init.rs:940-965` |

---

## 2. Trả lời Chi tiết 7 Câu hỏi Bắt buộc

### Câu hỏi 1: Kernel lock (`flock` trên open file description, mục 6.1 – 6.5)

1. **Ngữ nghĩa `flock(2)` trên Linux (mục 6.1)**:
   - Trên Linux local filesystem (`ext4`, `xfs`, `btrfs`, `tmpfs`), `flock(fd, LOCK_EX | LOCK_NB)` gắn khóa vào **open file description** (cấu trúc `struct file` trong kernel) và gắn với **inode** (không phụ thuộc đường dẫn tên file).
   - Khi mở khóa ở `O_RDWR | O_CREAT` và giữ nguyên file không `unlink`, hai lần `open()` độc lập tạo hai `struct file` khác nhau và loại trừ lẫn nhau tuyệt đối. Khi mọi fd trỏ tới `struct file` đó đều đóng (do `close()` hoặc do toàn bộ tiến trình giữ fd thoát/bị `SIGKILL`), kernel giải phóng khóa tức thì.
   - Hai scope khác nhau trong cùng một tiến trình mở hai fd riêng (mỗi `open()` tạo một `struct file` riêng) hoạt động độc lập, không tự mở khóa của nhau (không bị lỗi POSIX `fcntl(F_SETLK)` đóng một fd bất kỳ làm rơi toàn bộ khóa trên inode của process đó).

2. **Lỗ hổng rò rỉ fd sang tiến trình con ngoài ý muốn — Phát hiện `R3-1` (HIGH)**:
   - Mục 6.4 thiết kế cho `git commit` mượn `main.lock` bằng cách truyền `fd` ở vị trí `stdio[3]` (`spawn('git', ['commit', ...], { stdio: ['inherit', 'pipe', 'pipe', lockFd] })`).
   - Để fd 3 sống qua `execve("git")`, Node/libuv bắt buộc phải **xóa cờ `FD_CLOEXEC`** trên fd 3.
   - Bản thân chương trình `git` không hề biết sự tồn tại của fd 3 và **không đặt lại `FD_CLOEXEC`** trên fd 3 trước khi `fork/exec` các tiến trình con của nó (`gpg-agent`, `fsmonitor--daemon`, `git maintenance run --auto` / `git gc --auto --detach`, hoặc tiến trình nền trong `pre-commit` / `post-commit` hook).
   - Hệ quả: mọi daemon tách nền do `git commit` hoặc hook sinh ra đều kế thừa fd 3 đang mở (`FD_CLOEXEC=0`) trỏ thẳng vào open file description của `main.lock`. Sau khi `git commit` thoát và tiến trình Node cha gọi `closeSync(lockFd)`, `struct file` trong kernel vẫn còn tham chiếu từ daemon nên **khóa `main.lock` không bao giờ được nhả**.
   - **Bằng chứng thực nghiệm (`probe-r3-1-git-fd3-daemon-leak.mjs`)**:
     - Tiến trình chủ lấy `main.lock`, gọi `git commit` với `stdio[3] = lockFd`.
     - Hook `pre-commit` kiểm tra `flock -n 3` thành công (`hookVerdict: "borrower"`) và có một tiến trình nền tách ra (mô phỏng `git gc --auto` / `gpg-agent`).
     - Sau khi `git commit` thoát (`gitExitCode: 0`) và chủ đã `closeSync(lockFd)` (`ownerClosedFd: true`), tiến trình ngoài thử lấy `main.lock` vẫn bị từ chối (`strangerCanLockAfterOwnerClosedFdAndGitExited: false`), và `/proc/<daemonPid>/fdinfo/3` vẫn hiện dòng `lock:` của kernel (`daemonFdInfoHasKernelLock: true`). Chỉ sau khi giết daemon thì khóa mới nhả (`strangerCanLockAfterDaemonKilled: true`).
   - **Khắc phục**: Không bao giờ truyền trực tiếp `lockFd` qua `stdio[3]` cho `git` binary. Thay vào đó, truyền một **borrow token dùng một lần gắn với PID của `git`** (ví dụ biến môi trường `FGOS_MAIN_LOCK_BORROW_PROOF=< main.lock inode >:< parent pid >:< parent startTime >` để hook kiểm chứng cha trực tiếp/tổ tiên của `git` đang giữ `main.lock` qua `/proc/<ownerPid>/fdinfo/*` hoặc gọi helper kiểm tra), hoặc bọc trong wrapper đóng fd 3 trước khi gọi lệnh con.

3. **Cơ chế helper `spawnSync('fgos', ['internal', 'lock-fd', '3'])` trên Node (mục 6.3)**:
   - Trên Linux/macOS (POSIX `flock`), vì `flock` gắn với open file description (`struct file`) được chia sẻ giữa tiến trình Node cha và helper con qua `stdio[3]`, khi helper gọi `flock(3, LOCK_EX)` rồi thoát, khóa vẫn giữ nguyên trên `lockFd` của Node cha. Ngay cả khi `spawnSync` hết thời gian chờ (timeout) và gửi `SIGKILL` + `waitpid` cho helper, sau khi `spawnSync` trả về thì helper đã chết hẳn; Node cha chỉ cần `closeSync(lockFd)` trong khối `finally` khi `res.status !== 0` là nhả sạch dù helper kịp lấy khóa ngay trước khi nhận `SIGKILL`.
   - **Tuy nhiên trên Windows (§6.1, §6.3) — Lỗi thiết kế**: Win32 `LockFileEx` gắn khóa với **Process + File Handle**, KHÔNG gắn với open file description chia sẻ qua tiến trình con đã thoát. Khi tiến trình con `fgos internal lock-fd` thoát, Windows kernel tự động giải phóng mọi khóa `LockFileEx` mà tiến trình con đó đã lấy! Do đó, kiến trúc *"Node mở fd rồi gọi helper CLI `lock-fd` để lấy khóa hộ"* **không thể hoạt động trên Windows**. Trên Windows, chính tiến trình giữ khóa phải gọi `LockFileEx` trực tiếp (qua N-API addon/FFI) hoặc phải giữ tiến trình helper sống suốt thời gian giữ khóa.
   - **Chế độ mở file (`O_RDONLY` vs `O_RDWR`) trên macOS / BSD / NFSv4**: Trong bundle probe của Bản 3 (`p4-adopt.mjs:14`, `p5:26`, `p3_gate_probe.py:34`), file lock được mở với chế độ `'r'` (`O_RDONLY`). Trên Linux local fs, `flock(fd, LOCK_EX)` cho phép `O_RDONLY`; nhưng trên NFSv4 (nơi kernel ánh xạ `flock` sang POSIX byte-range lock `F_WRLCK`) và một số hệ BSD, `LOCK_EX` trên fd `O_RDONLY` trả về lỗi `EBADF`. Quy tắc bắt buộc phải là mở `O_RDWR | O_CREAT` ở mọi nơi.

---

### Câu hỏi 2: Kiểm chứng từng lỗi B1–B9 từ Vòng 2

| Mã B | Vấn đề ở Bản 2 | Trạng thái ở Bản 3 | Bằng chứng & Lý do |
|---|---|---|---|
| **B1** | Hai contender cùng reclaim một lock hết hạn và cùng thắng (double-reclaim TOCTOU). | **ĐÓNG THẬT** (cho các khóa chuyển sang `flock` và cho `events.lock` khi dùng `state.reclaim`) | Với `main.lock`, `attempt.lock`, `cwd.lock`: không còn bước `unlink` hay `rename` đè file khóa; kernel `flock(LOCK_EX)` tuần tự hóa tuyệt đối. Với `events.lock`: việc xóa khóa của holder chết bắt buộc phải cầm kernel lock `state.reclaim` và kiểm tra lại nội dung file trước khi `unlink` (mục 6.6, probe `P2`). |
| **B2** | Dual-path split-brain giữa code cũ (v1) và code mới trong quá trình chuyển giao. | **CHƯA ĐÓNG HOÀN TOÀN (`R3-4`)** | Ý tưởng đặt thư mục tombstone ở đường dẫn v1 rất tốt, nhưng thực thi trong Bản 3 còn 4 lỗ: (1) `run.mjs:345-351` bắt lỗi `EISDIR` rồi bỏ qua (`holder = undefined`), tức **fail-open**; (2) quét quiescence `/proc` theo đường dẫn main checkout bỏ sót tiến trình chạy ở linked worktree ngoài cây chính; (3) tombstone `.fgos/dispatch--<cwd>.lock` tạo lười + lệch đường dẫn khi `cwd` đi qua symlink; (4) quên `.fgos/porting/events.lock`. Xem `probe-r3-4`. |
| **B3** | `git commit` dưới `acquireMainCheckoutLock` và pre-commit hook tự chặn mình hoặc mở cửa giả mạo biến môi trường. | **CHƯA ĐÓNG AN TOÀN (`R3-1`)** | Thay biến môi trường bằng fd 3 chặn được tiến trình ngoài giả mạo, nhưng truyền trực tiếp `lockFd` vào `stdio[3]` của `git commit` làm rò rỉ `flock` sang mọi daemon con của `git` (`git gc --auto`, `gpg-agent`, `fsmonitor--daemon`), gây treo khóa `main.lock` sau khi `git commit` kết thúc. Xem `probe-r3-1`. |
| **B4** | Tác vụ chạy hợp lệ lâu hơn TTL bị cướp khóa rồi bước `release()` xóa nhầm khóa của người mới. | **ĐÓNG THẬT** | Kernel lock gắn với open file description suốt đời tiến trình giữ khóa; không còn TTL hết hạn giữa chừng khi tiến trình còn sống, và `release()` chỉ gọi `close(fd)` trên description của chính mình, không bao giờ xóa/đụng tới khóa của tiến trình khác (probe `P1`). |
| **B5** | Đua gia hạn khóa (heartbeat/renew) với contender đang reclaim. | **ĐÓNG THẬT** | Kernel `flock` không cần heartbeat để giữ quyền sở hữu khóa; file `heartbeat` của supervisor chỉ dùng để hiển thị (`inspect`), không bao giờ dùng làm điều kiện cướp khóa. |
| **B6** | `withClaimsLock` lồng trong `withEventsLock` và lệnh `execFileSync('git')` chạy bên trong vùng găng nóng. | **CHƯA ĐÓNG (`R3-2`)** | Gộp `claims.lock` vào `events.lock` là đúng, nhưng Bản 3 chỉ phát hiện `currentHead(repoRoot)` ở `claim-port.mjs:318` mà bỏ sót `getMainFgosDir` (`runtime-coordination.mjs:17` → `paths.mjs:77`, gọi `git rev-parse --git-common-dir` 5 lần trong `claimWork`/`settleClaim`) và `assertPlanEvidence` (`store.mjs:612, 622`, gọi `git rev-parse` và `git cat-file` trong `moveWork`). Xem `probe-r3-2`. |
| **B7** | Nhận diện tiến trình (`process-facts`) khi `/proc` không đọc được hoặc có trạng thái đặc biệt. | **CHƯA ĐÓNG HOÀN TOÀN (`R3-3`)** | Bản 3 xử lý đúng `ESRCH` vs `EPERM` và lệnh dừng/tiếp tục, nhưng bỏ sót **tiến trình zombie (`state === 'Z'`)**: khi holder chết mà cha chưa `waitpid`, `kill(pid, 0)` vẫn trả `true` và `startTime` vẫn khớp, làm `process-facts` và `resolveHolderLiveness` phán nhầm là `alive`/`held`. Ngoài ra `process-identity.mjs:60` hiện trả `'dead'` khi bản ghi hỏng thiếu `pid`. Xem `probe-r3-3`. |
| **B8** | Quét dọn thư mục `home` cô lập (`reapOrphanedConfinementResources`) đua với tiến trình đang chạy hoặc `finalize-home`. | **CHƯA ĐÓNG HOÀN TOÀN (`R3-5`, `R3-6`)** | Dùng `attempt.lock` chặn được reaper xóa `home` khi gate/worker còn sống (probe `P5`). Nhưng: (1) khi supervisor chết giữa `settle-attempt` (đã ghi `result.json`) và `finalize-home`, `adopt` thấy `result.json` nên bỏ qua `finalize-home` (`R3-5`); (2) khi `reaper` giữ `attempt.lock` để xóa `home` của attempt chết (§9.8), `adopt`/`resume` chạy song song thấy `attempt.lock` bận liền báo sai rằng attempt đang `running` (`R3-6`). Xem `probe-r3-5`. |
| **B9** | Dọn tab/pane của `terminal-control` đóng nhầm pane của người dùng hoặc của lần chạy khác. | **ĐÓNG PHẦN ROOT PANE, NHƯNG MỞ RA 2 RACE MỚI (`R3-10`)** | Cổng theo `attemptId` và luật không bao giờ đóng `rootPaneId` chặn được lỗi đóng nhầm shell gốc của người dùng. Nhưng việc chọn Phương án (a) không khóa trong §7.6 kết hợp với `sweep` không kiểm tra `attempt.lock` gây ra đua mở trùng N tab cho cùng `groupKey` và đóng nhầm pane khi khởi chạy chậm quá `allocationGrace`. Xem `probe-r3-6`. |

---

### Câu hỏi 3: Mutex nóng tạm thời (`events.lock`, mục 6.6)

1. **Tính đúng đắn của giao thức `link`/`unlink` + `state.reclaim`**:
   - Fast path tạo file tạm rồi `link(tmp, events.lock)` là nguyên tử trên POSIX local fs.
   - Khi `events.lock` đã tồn tại, contender chỉ được phép gỡ `events.lock` của holder chết sau khi đã lấy kernel lock `state.reclaim`, đọc lại `events.lock` lần hai bên trong `state.reclaim`, xác minh `holderId` không đổi và holder đã `dead`, rồi mới `unlinkSync(events.lock)`.
   - Giao thức này đảm bảo tại mọi thời điểm chỉ có tối đa một contender thực hiện `unlink`, loại bỏ hoàn toàn kịch bản hai contender nối đuôi nhau xóa khóa của holder mới (đã kiểm chứng qua `P2`).

2. **Ba lỗ hổng thực tế trong mục 6.6**:
   - **Phát hiện `R3-2` (CRITICAL) — Vẫn còn 2 đường gọi `git` subprocess bên trong `withEventsLock`, và cả hai đều nuốt lỗi trong `try/catch`**:
     - Đường 1: Mọi hàm trong `src/state/runtime-coordination.mjs` (`withClaimsLock` dòng 59, `readClaim` dòng 128, `readClaims` dòng 153, `acquireClaim` dòng 198, `releaseClaim` dòng 276) đều gọi `getMainFgosDir(dir)` (dòng 14–22), hàm này gọi `resolveMainCheckoutRoot(repoRoot)` (`src/runner/paths.mjs:74-87`), bên trong chạy thẳng `execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'])` mà không hề cache kết quả! Khi `claimWork` (`claim-port.mjs:301`) và `settleClaim` (`store.mjs:1147`) chạy bên trong `withEventsLock`, chúng sinh ra **5 lệnh `git rev-parse --git-common-dir`** ngay trong vùng găng nóng. Nguy hiểm hơn: `getMainFgosDir` bọc lệnh đó trong `try { ... } catch { return dir; }`. Khi bật guard `exec-under-hot-lock` (ném lỗi khi gọi `execFileSync` dưới `events.lock`), `getMainFgosDir` **bắt và nuốt luôn lỗi của guard**, rồi âm thầm trả về `dir` (thư mục của worktree con thay vì main checkout), gây split-brain trạng thái `claims.json`!
     - Đường 2: Trong `src/state/store.mjs:876`, khi `moveWork` chuyển một việc có `risk === 'heavy'` sang `delivered` (bên trong `withEventsLockAndRefresh`), nó gọi `assertPlanEvidence(id, work, path.dirname(dir))` (`store.mjs:601-639`). Hàm này chạy `execFileSync('git', ['rev-parse', '--verify', '--quiet', 'refs/heads/fgw/' + id])` (dòng 612) và `execFileSync('git', ['cat-file', '-e', ...])` (dòng 622). Cả hai lệnh đều nằm trong `try { ... } catch { return false; }`. Khi bật guard `exec-under-hot-lock`, lỗi guard bị `catch` nuốt và biến thành `hasBranch = false` / `hasPlan = false`, làm `moveWork` ném lỗi giả tạo `StoreError: work "<id>" cannot move to "delivered" — risk:heavy but no plan.md found` dù `plan.md` có thật trên nhánh!
     - **Bằng chứng thực nghiệm (`probe-r3-2-hot-lock-exec-violation.mjs`)**: Chạy `claimWork`, `settleClaim` và `moveWork(delivered)` trên code thật ghi nhận **8 lần gọi `git` subprocess bên trong `events.lock`**; khi bật guard `exec-under-hot-lock`, `claimWork` sập ngay lập tức (`"exec-under-hot-lock: git rev-parse HEAD"`) và `moveWork(delivered)` thất bại giả tạo do `try/catch` nuốt lỗi guard.
   - **Phát hiện `R3-3` (HIGH) — Tiến trình zombie (`state === 'Z'`) làm kẹt `state.reclaim`, và bản ghi hỏng thiếu `pid` bị coi là `dead`**:
     - Khi một worker con (hoặc subagent) bị `SIGKILL` / crash ngay lúc đang giữ `events.lock` nhưng tiến trình cha của nó chưa gọi `waitpid`, tiến trình con chuyển sang trạng thái zombie (`Z` ở trường thứ 3 của `/proc/<pid>/stat`). Lúc này nhân Linux đã đóng toàn bộ file descriptor của tiến trình đó, nhưng PID vẫn tồn tại trong bảng tiến trình, `process.kill(pid, 0)` vẫn trả về `true`, và `startTime` ở trường 22 của `/proc/<pid>/stat` vẫn giữ nguyên.
     - Bảng quyết định ở §5.1 (dòng 97–105), hàm `judgeOwner` trong `era-ledger.mjs`, và hàm `resolveHolderLiveness` trong `src/runner/process-identity.mjs:59-83` chỉ kiểm tra `kill(pid, 0)` và `startTime`, **không kiểm tra `state === 'Z'`**. Hệ quả: mọi tiến trình khác gọi `withEventsLock` đều phán zombie holder là `alive`/`held` và không bao giờ vào `state.reclaim` cho tới khi cha của zombie thu dọn nó.
     - Ngược lại, tại `src/runner/process-identity.mjs:60`, code thật hiện viết `if (!holder || !Number.isInteger(holder.pid)) return 'dead';` — nếu bản ghi JSON đọc được nhưng thiếu/hỏng trường `pid`, code thật trả về `'dead'` và cho phép xóa khóa ngay, trái với quy tắc fail-closed của §5.1 và §6.6 (`unknown` phải coi như `held`).
     - **Bằng chứng thực nghiệm (`probe-r3-3-zombie-holder-hot-lock.mjs`)**: Tạo một tiến trình con giữ khóa rồi tự `SIGKILL` trong khi cha chưa `waitpid`: `procStatState === "Z"`, `kill0Alive === true`, `v3JudgeOwnerVerdict === "alive"`, `prodResolveHolderLivenessVerdict === "held"`, và `hotTryAcquireWhileHolderIsZombie === "held"`.
   - **Rủi ro cạn ngân sách spin 500ms khi gộp `claims.lock` vào `events.lock`**:
     - Trước khi gộp, đọc/ghi `claims.json` chỉ giữ `claims.lock`. Sau khi gộp vào `events.lock`, mọi thao tác ghi `events.jsonl` (kèm `foldEvents` và `refreshStateView` đồng bộ trên toàn bộ lịch sử sự kiện) và mọi thao tác `claims.json` dùng chung một cổng spin 500ms (`DEFAULT_LOCK_TIMEOUT_MS = 500` trong `events.mjs:140`). Khi 5 worker fanout cùng settle hoặc checkpoint dưới tải đĩa cao, thời gian giữ `events.lock` cho `foldEvents + writeFileSync(state.json)` nhân với 5 dễ vượt 500ms. Cần tăng ngân sách chờ của `events.lock` (ví dụ 2000–5000ms) sau khi đã loại bỏ hoàn toàn subprocess trong vùng găng.

---

### Câu hỏi 4: Đổi phiên bản, Tombstone thư mục & Quiescence (mục 6.8)

**Phát hiện `R3-4` (HIGH) và `R3-11` (MEDIUM)** chứng minh cơ chế cutover ở mục 6.8 chưa đóng kín và có đường **fail-open**:

1. **Lỗ hổng 4a — Đường code `fgos run --resume` (`src/runner/execution/run.mjs:345-351`) KHÔNG fail-closed khi gặp `EISDIR` trên tombstone**:
   - Tại `src/runner/execution/run.mjs:345-351`:
     ```js
     let holder;
     try {
       holder = JSON.parse(fs.readFileSync(lockPath, 'utf8'))?.pid;
     } catch {
       holder = undefined;
     }
     ```
   - Khi `.fgos/dispatch--<cwd>.lock` đã được chuyển thành **thư mục tombstone** theo §6.8, lệnh `fs.readFileSync(lockPath, 'utf8')` ném lỗi `EISDIR`. Khối `catch` nuốt sạch `EISDIR` và gán `holder = undefined`!
   - Ngay sau đó, vì `holder` là `undefined`, `runUnit` kết luận worktree không bị ai giữ, đi thẳng tới dòng 479–490 xóa `unit-summary.json`, ghi đè `unit.json` và chạy tiếp các seat read-only / pending-commit mà không hề chạm vào `acquireMainCheckoutLock`.
   - **Bằng chứng (`probe-r3-4`)**: `hole4a_runMjsResumeReadFileCode: "EISDIR"`, `hole4a_runMjsResumeFailsOpenOnTombstoneDir: true`.

2. **Lỗ hổng 4b — Quét quiescence `/proc/*/cmdline` và `/proc/*/cwd` (§6.8 bước 2) bỏ sót tiến trình chạy trong linked worktree ngoài cây chính**:
   - Mục 6.8 bước 2 xác định tiến trình đang dùng workspace bằng cách quét `/proc/*/cmdline` và `/proc/*/cwd` tìm đường dẫn của workspace (main checkout).
   - Trong thực tế, các worker của `fgos pick` / `fgos fanout` / `fgos run --worktree` chạy với `cwd` là thư mục linked worktree nằm ngoài main checkout (ví dụ `/tmp/...` hoặc thư mục anh em `../...`), và thực thi binary từ bản cài đặt (`~/.local/state/fgos/releases/<digest>/...`). Cả `/proc/<pid>/cmdline` lẫn `/proc/<pid>/cwd` của các worker này **không hề chứa chuỗi đường dẫn của main checkout**, nhưng chúng lại giải quyết về cùng `.fgos` của main checkout qua `git rev-parse --git-common-dir` hoặc symlink `.fgos`!
   - Do đó, bước quét quiescence báo `0` tiến trình và cho phép cutover chạy ngay trong khi worker v1 ở linked worktree đang giữ và ghi khóa của main checkout.
   - **Bằng chứng (`probe-r3-4`)**: `hole4b_detectedByMainCheckoutQuiescenceScan: false`.

3. **Lỗ hổng 4c — Tombstone lười (lazy) cho `dispatch--<cwd>.lock` và lệch khóa giữa symlink với `realpath` (§6.8 bước 4)**:
   - Bước 4 mục 6.8 chỉ tạo sẵn `runtime/locks/dispatch-cwd.cutover/`, còn từng tombstone `.fgos/dispatch--<cwd>.lock` chỉ được tạo *"khi v3 acquire `cwd` đó lần đầu"*.
   - Nếu một tiến trình v1 (ví dụ đang chạy dở hoặc được gọi qua `node bin/fgos.mjs` không đi qua Rust `fgctl`) chạm vào worktree `W` trước khi v3 kịp chạm vào `W`, chưa hề có thư mục tombstone `.fgos/dispatch--<W>.lock` nên v1 vẫn tạo file khóa v1 bình thường!
   - Hơn nữa, ngay cả khi v3 đã tạo tombstone cho `W`, hàm `dispatchLockFile(cwd)` của v1 (`main-checkout-lock.mjs:465`) tính tên file từ `path.resolve(cwd)` (giữ nguyên tên symlink), trong khi v3 (§6.5) chuẩn hóa `cwd` qua `realpath` (`dev:ino`). Nếu người dùng hoặc script đi vào worktree qua symlink, đường dẫn khóa của v1 và đường dẫn tombstone của v3 khác nhau hoàn toàn.
   - **Bằng chứng (`probe-r3-4`)**: `hole4c_symlinkVsRealpathTombstoneDiverges: true`.

4. **Lỗ hổng 4d — Bỏ sót khóa `.fgos/porting/events.lock` (`src/state/porting-store.mjs:27, 91`) và xung đột thứ tự với Rust `fgctl` (`R3-11`)**:
   - `src/state/porting-store.mjs` gọi `withEventsLock(logPath, ...)` trên `.fgos/porting/events.jsonl`, tạo ra khóa nóng thứ hai tại `.fgos/porting/events.lock`. Mục 6.5, 6.6 và 6.8 của Bản 3 không hề liệt kê khóa này trong danh mục khóa hay danh sách tombstone.
   - Trong `packages/distribution/rust/src/lock.rs:154-175` (`inspect_main_checkout_lock`), Rust `fgctl` đọc `.fgos/main-checkout.lock` bằng `fs::read_to_string`. Khi gặp thư mục tombstone (`EISDIR`), nó trả về `MainCheckoutLockState::Ambiguous`, khiến `fgos setup` / `fgctl` thất bại nếu bước 4.3 (đặt tombstone) chạy trước bước 4.4 (cập nhật `lock.rs`).

---

### Câu hỏi 5: Run Supervisor, Launch Gate, Adopt & Reaper (mục 9 & mục 10)

1. **Đánh giá phân tầng một chiều khi supervisor gọi `settle-attempt` và `finalize-home` (mục 4.2, 9.6)**:
   - Việc supervisor đọc danh sách lệnh hậu xử lý đã được chuẩn bị sẵn trong `envelope.json` và chạy tuần tự dưới dạng tiến trình con mờ (opaque child commands) giữ được tính một chiều ở mức mã nguồn: crate/module `run-supervisor` không phải import `settlement.mjs` hay `confinement/authority.mjs`.
   - Tuy nhiên, vì các bước hậu xử lý này được tách thành **hai lệnh rời nhau** (`settle-attempt` rồi mới tới `finalize-home` / `release`), nó tạo ra lỗ hổng trạng thái dở dang nghiêm trọng khi supervisor chết giữa hai lệnh (`R3-5`).

2. **Phát hiện `R3-5` (CRITICAL) — Supervisor chết giữa `settle-attempt` và `finalize-home` làm rò rỉ vĩnh viễn `home`, mất credential vừa gia hạn, và bỏ rơi pane**:
   - Trong §9.6 và `p4_supervisor.py:54-56`, sau khi ghi `receipt.json`, supervisor chạy bước 1 (`settle-attempt`, ghi ra `result.json` và chuyển CAS `run-control` sang `settled`), rồi mới chạy bước 2 (`finalize-home` / `release`, thực hiện `credentialWriteBack` và xóa thư mục `home` cô lập).
   - Nếu supervisor bị `SIGKILL` / crash ngay sau khi `result.json` đã được ghi xong nhưng trước khi `finalize-home` hoàn tất:
     - Khi `adopt` (§9.7 bước 2, `p4-adopt.mjs:21-24`) chạy, nó kiểm tra:
       ```js
       if (fs.existsSync(path.join(d, 'result.json'))) {
         console.log(JSON.stringify({ adopt: 'nothing-to-do', reason: 'already-settled' }));
         process.exit(0);
       }
       ```
     - Vì `result.json` đã có trên đĩa, `adopt` trả về `already-settled` và **thoát ngay mà không bao giờ gọi `finalize-home` hay `terminal-control.release`**!
     - Thậm chí trong code thật hiện tại (`src/runner/dispatch/confinement/authority.mjs:1818-1825`), `finalizeConfinementResources` chỉ đặt `willClean = true` khi `completionKind` là `'exited'` hoặc `'spawn-failed'`; với mọi trường hợp `'timeout'`, `'abandoned'`, `'gate-lost'`, nó giữ lại thư mục `home` (`cleanupState: 'retained'`) và không gọi `writeBackRenewedCredential`.
   - **Bằng chứng thực nghiệm (`probe-r3-5`, `subprobe5A`)**: Sau khi `p4-settle.mjs` ghi `result.json` rồi dừng trước bước dọn `home`, gọi `p4-adopt.mjs` trả về `{"adopt":"nothing-to-do","reason":"already-settled"}` và file nhạy cảm `home/oauth-token.json` vẫn nằm nguyên trên đĩa (`privateHomeStillLeakedOnDisk: true`).
   - **Về nguy cơ trả credential hai lần (double credential write-back)**: Hàm `writeBackRenewedCredential` trong `src/runner/dispatch/provider-credential-renewal.mjs:247-340` đọc `mtimeMs` và so sánh sha256 + ghi nguyên tử qua file `.tmp` rồi `renameSync`, nên bản thân phép chép lại cùng một token là idempotent; nhưng nếu `finalize-home` đã xóa `home` ở lần chạy đầu hoặc đang xóa dở mà chạy chồng lần hai thì sẽ đọc phải thư mục rỗng/dở dang. Do đó `finalize-home` bắt buộc phải ghi marker nguyên tử `home-finalized.json` và `adopt` phải kiểm tra **cả hai** điều kiện (`result.json` VÀ `home-finalized.json`).

3. **Phát hiện `R3-6` (HIGH) — Đụng độ hai thẩm quyền trên `attempt.lock` giữa `reaper` (§9.8) và `adopt`/`resume` (§9.7)**:
   - Mục 9.8 quy định `reaper` khi dọn một attempt đã chết (không còn ai giữ `attempt.lock`) phải **giữ `attempt.lock` trong suốt lúc dọn `home`**.
   - Nhưng mục 9.7 bước 1 quy định `adopt` (`fgos run --resume` / `recover`) chỉ thử `flock(LOCK_EX | LOCK_NB)` trên `attempt.lock`; nếu thấy khóa đang bị giữ thì kết luận ngay *"có thành viên sống (supervisor/gate/controller) → giữ nguyên, báo `running`"*.
   - Hệ quả: Trong lúc `reaper` đang giữ `attempt.lock` để xóa thư mục `home` của một attempt đã chết từ lâu, bất kỳ lệnh `fgos run --resume` hoặc `adopt` nào chạy tới đều tưởng nhầm attempt đó đang sống và báo `running` (`attempt-lock-held`) thay vì settle hoặc báo đã dọn!
   - **Bằng chứng thực nghiệm (`probe-r3-5`, `subprobe5B`)**: Khi reaper giữ `attempt.lock` trên attempt đã kết thúc, `p4-adopt.mjs` trả về `{"adopt":"kept","reason":"attempt-lock-held"}`.

4. **Phát hiện `R3-7` (CRITICAL) — Chính sách *"supervisor chết thì agent chạy tiếp tới `hardCeilingMs`"* làm hỏng hoàn toàn chế độ `terminal` (`herdr-spawn`)**:
   - Mục 9.2 (dòng 4) và mục 10 quy định: trong chế độ `terminal` (chạy agent tương tác trong pane của `herdr`), `agent-protocol` thuộc về **supervisor** (bên ngoài pane), còn **gate** chạy bên trong pane chỉ giữ khóa + subreaper + áp trần cứng `hardCeilingMs` (gate bị cấm biết `agent-protocol`, mục 4.2).
   - Các CLI agent tương tác (`claude`, `codex`, `agy`, `pi`, `omp`) chạy ở chế độ TUI/REPL: sau khi hoàn thành nhiệm vụ và ghi xong `outbox/result-1.json`, tiến trình CLI **không tự `exit(0)`** mà đứng chờ ở dấu nhắc lệnh để `agent-protocol` (trong supervisor) phát hiện `outbox/result-1.json` và gửi lệnh thoát (hoặc đóng đầu vào).
   - Nếu supervisor chết trong lúc agent đang chạy ở chế độ `terminal`:
     1. Agent làm xong việc, ghi `outbox/result-1.json` hợp lệ với `status: "done"`.
     2. Không còn supervisor nào đọc `outbox/result-1.json` để bảo agent thoát.
     3. Agent ngồi chờ ở dấu nhắc REPL trong pane suốt nhiều giờ cho tới khi chạm `hardCeilingMs` (trong khi vẫn giữ chặt `attempt.lock` và `cwd.lock`, chặn mọi lệnh `resume`!).
     4. Khi chạm `hardCeilingMs`, gate giết agent và ghi `gate-exit.json` với `stoppedBy: "hard-ceiling"`.
     5. Khi `adopt` chạy (`p4-adopt.mjs:31` và `p4-settle.mjs:19`, cũng như `settlement.mjs:981`), vì `stoppedBy === 'hard-ceiling'` nên `receipt.kind` bị gán cứng là `'timeout'` và kết quả cuối cùng (`result.json`) bị chấm là `status: "timeout"` (thất bại), **vứt bỏ hoàn toàn kết quả `done` mà agent đã ghi vào `outbox/result-1.json`**!
   - **Bằng chứng thực nghiệm (`probe-r3-5`, `subprobe5C`)**: Worker tương tác ghi `outbox/result-1.json` (`status: "done"`) rồi chờ lệnh thoát khi supervisor đã chết; gate cắt ở `hard-ceiling`, và `p4-adopt.mjs` ghi `result.json` với `status: "timeout"` (`completedWorkOverwrittenAsTimeout: true`).
   - **So sánh với `BoundInvocationSupervisor` (`packages/distribution/rust/src/bound_invocation_supervisor.rs`)**: `BoundInvocationSupervisor` hiện tại là mẫu tự-bọc trong cùng cây tiến trình và tự thu dọn khi kết thúc, nhưng chưa tách rời vòng đời khỏi pane `herdr`. Kiến trúc tách supervisor và gate của Bản 3 đúng hướng cho chế độ headless (`subprocess`/`confined`), nhưng với chế độ `terminal` REPL thì hoặc gate phải được phép nhận tín hiệu hoàn tất từ `outbox/result-<round>.json`, hoặc `adopt`/`settle` phải ưu tiên `outbox/result-<round>.json` hợp lệ đã ghi xong trước thời điểm `hard-ceiling`.

5. **Phát hiện `R3-8` (HIGH) — Ba lỗi cơ học trong Launch Gate (`p4_gate.py` / §9.3)**:
   - **Lỗi 8a (Treo vô hạn khi worker chặn `SIGTERM`)**: Trong `p4_gate.py:37-49`, khi chạm `hardCeilingMs`, vòng lặp `while status is None:` chỉ gọi `os.killpg(pid, signal.SIGTERM)` lặp đi lặp lại mà không bao giờ nâng cấp lên `SIGKILL` (vòng `SIGKILL` ở dòng 52 nằm *sau* khi `waitpid(pid)` đã thoát!). Nếu tiến trình worker chính đặt `SIG_IGN` hoặc bẫy `SIGTERM`, gate bị treo vĩnh viễn qua cả `hardCeilingMs`.
   - **Lỗi 8b (Lọt tiến trình cháu cấp 2 qua vòng subreaper)**: Khi worker chính thoát nhưng để lại con `C1` (được reparent về gate) và `C1` lại có con `C2` (vẫn đang có cha là `C1`, chưa nằm trong `/proc/<gate>/task/<gate>/children`), vòng lặp `for sig in (SIGTERM, SIGKILL)` của `p4_gate.py:52-65` chỉ đọc danh sách con trực tiếp của gate. Nếu `C1` chặn `SIGTERM`, ở lượt `SIGKILL` gate chỉ giết `C1`; ngay khi `C1` chết thì `C2` mới được reparent về gate, nhưng lúc đó vòng `for sig` đã kết thúc! Gate thoát ngay sau đó và `C2` thoát sang PID 1.
   - **Lỗi 8c (Mất nguyên nhân `timeout` khi supervisor gửi `SIGTERM` rồi chết)**: Ở `p4_supervisor.py:46-47`, khi hết hạn mềm (`deadlineMs`), supervisor gửi `SIGTERM` cho gate. Trong `p4_gate.py:31-32`, handler `SIGTERM` đặt `stop["why"] = "stopped"` (không phải `"timeout"`). Nếu supervisor chết ngay sau khi gửi `SIGTERM` (trước khi ghi `receipt.json`), `p4-adopt.mjs:31` đọc `gate-exit.json` thấy `stoppedBy: "stopped"` nên phân loại thành `exited` (nếu worker bắt `SIGTERM` và `exit(0)`) hoặc `failed`, làm mất trạng thái `timeout`.
   - **Bằng chứng thực nghiệm (`probe-r3-5`, `subprobe5D`)**: `grandchildSurvivedGateSubreaperCleanup: true`, `sigtermIgnoringWorkerHungGatePastHardCeiling: true`.

6. **Phát hiện `R3-9` (MEDIUM) — Xung đột thứ tự khóa (lock rank) giữa `attempt` (15) và `dispatch cwd` (30) + thiếu bàn giao `cwd.lock`**:
   - Mục 6.5 quy định thứ tự khóa tăng dần nghiêm ngặt: `attempt` (rank 15) → `dispatch cwd` (rank 30).
   - Nhưng trong kiến trúc thực tế (`assignment-runner.mjs:2221`, `cli.mjs:728`, và mục 9.1), `dispatch cwd` bảo vệ worktree của cả một phiên/unit (có thể trải qua nhiều round/attempt khi retry hoặc xoay tài khoản), nên controller lấy `cwd.lock` trước khi tạo `attemptId` và lấy `attempt.lock` (tức thứ tự thực tế là `dispatch cwd` → `attempt`). Nếu giữ rank `attempt (15) < dispatch cwd (30)`, code sẽ vi phạm luật rank.
   - Ngoài ra, mục 9.4 (`p4-controller.mjs`) chỉ mở và truyền `attempt.lock` ở fd 3 sang supervisor/gate, quên truyền `cwd.lock` (ví dụ ở fd 4). Nếu controller chỉ giữ `cwd.lock` trong tiến trình của mình rồi thoát hoặc crash, `cwd.lock` sẽ nhả ngay trong khi gate và worker vẫn đang ghi vào worktree!

---

### Câu hỏi 6: `terminal-control` (mục 7)

**Phát hiện `R3-10` (HIGH)** chỉ ra 2 lỗi đua thực tế trong mục 7:

1. **Lỗi 10a — Phương án (a) không khóa (§7.6) làm các seat song song cùng `groupKey` mở N tab rời thay vì gom chung 1 tab**:
   - Hiện tại trong `src/runner/dispatch/herdr-round.mjs:81-118`, `batchTabFor` dùng một `Map` trong bộ nhớ của một tiến trình nên có thể gom nhóm nếu gọi tuần tự.
   - Nhưng mục 7.5, 7.6 và 7.9 chuyển `terminal-control` thành dịch vụ lưu file trạng thái trên đĩa (`.fgos/runtime/terminal-control/groups/<groupKey>.json`) được gọi qua CLI `fgos internal terminal-control allocate`, và mục 7.6 chọn **Phương án (a): không dùng khóa**.
   - Khi một multi-agent unit (`council-lite`, `delphi`, `nominal-group`, `research-fan-out`, `fgos-fanout`) khởi chạy đồng thời N seat cùng chia sẻ một `groupKey` (`unitRunId`), cả N tiến trình `allocate` cùng đọc `groups/<groupKey>.json` khi file chưa tồn tại, cùng gọi `herdr` mở tab mới, rồi ghi đè `groups/<groupKey>.json` của nhau — kết quả tạo ra N tab riêng rẽ thay vì 1 tab chung, và `groups/<groupKey>.json` chỉ giữ lại `tabId` của kẻ ghi cuối cùng (làm rò rỉ N-1 tab kia khi dọn nhóm!).
   - **Bằng chứng thực nghiệm (`probe-r3-6-terminal-control-races.mjs`)**: 4 seat song song cùng `groupKey: "unit-run-1"` chạy `allocate` không khóa tạo ra **4 tab riêng biệt** (`actualTabsCreatedWithoutLock: 4`).

2. **Lỗi 10b — `sweep` theo `allocationGrace` (§7.7 dòng 2) đóng nhầm pane đang khởi chạy chậm vì `terminal-control` không biết `attempt.lock`**:
   - Mục 4.2 cấm `terminal-control` biết `attempt.lock`. Mục 7.7 dòng 2 quy định: nếu `allocate` xong mà chưa tới `launch` (chưa ghi dấu `launched`), `sweep` sẽ đóng pane sau khoảng thời gian `allocationGrace`.
   - Giữa lúc `allocate` và lúc hoàn tất `launch`, supervisor/launcher phải chuẩn bị confinement (có thể chạy probe bwrap lần đầu mất vài giây) và trong `herdr-round.mjs:753-813` còn có bước `verifyForegroundProcessArgv` chờ tới 5 giây (`ARGV_VERIFY_WINDOW_MS = 5000`). Nếu máy đang tải nặng hoặc `allocationGrace` ngắn hơn thời gian chuẩn bị, một lệnh `sweep` từ lần chạy khác quét ngang qua sẽ **đóng luôn pane ngay khi gate/agent vừa được bơm lệnh vào pane**!
   - **Bằng chứng thực nghiệm (`probe-r3-6-terminal-control-races.mjs`)**: `sweepClosesPaneWhileSlowLaunchHoldsAttemptLock: true`.

3. **Rủi ro trùng `paneId` khi `herdr` server khởi động lại (server incarnation)**:
   - `paneId` của `herdr` (ví dụ `%1`, `%2` hoặc số nguyên tăng dần) chỉ duy nhất trong phạm vi một vòng đời `herdr` server. Nếu `herdr` server khởi động lại, server mới cấp lại `paneId` trùng với `paneId` cũ còn lưu trong `allocations/<oldAttemptId>.json`. Khi `sweep` hoặc `release` của attempt cũ chạy muộn, nó sẽ gọi `herdr close-pane <paneId>` và **đóng nhầm pane mới của phiên `herdr` mới** nếu bản ghi `allocations/<attemptId>.json` không gắn kèm định danh phiên `herdr` server (`serverSocketInode` hoặc `serverPid + serverStartTime`).

---

### Câu hỏi 7: Phân tầng, Bảng thẩm quyền (mục 4) & Lộ trình triển khai (mục 11)

1. **Kiểm tra bảng thẩm quyền (mục 4.1) — Phát hiện chỗ còn hai thẩm quyền**:
   - Cặp **`reaper` (§9.8) vs `adopt` (§9.7)** cùng lấy `attempt.lock` nhưng với hai ý nghĩa đối lập nhau (`reaper` giữ khóa nghĩa là *"đã chết, đang xóa `home`"*; `adopt` thấy khóa bị giữ lại hiểu là *"đang sống, không được đụng"* — `R3-6`).
   - Cặp **`terminal-control.sweep` (§7.7) vs `run-supervisor` (§9.3)** cùng quyết định số phận của pane trong cửa sổ khởi chạy vì `terminal-control` dùng đồng hồ `allocationGrace` thay vì đọc trạng thái sống thực từ `attempt.lock` (`R3-10`).

2. **Kiểm tra lộ trình mục 11**:
   - **Thứ tự Wave 4.3 và Wave 4.4 bị ngược (`R3-11`)**: Mục 11 cho phép 4.3 (chuyển `main-checkout.lock` sang kernel lock + đặt thư mục tombstone `.fgos/main-checkout.lock`) chạy song song với 4.4 (cập nhật `packages/distribution/rust/src/lock.rs` của `fgctl`). Như đã chứng minh ở Câu 4, nếu 4.3 vào trước 4.4 thì `fgctl` đọc thư mục tombstone bằng `fs::read_to_string` sẽ gãy ngay với `MainCheckoutLockAmbiguous: Is a directory`. **Bắt buộc 4.4 phải hoàn tất TRƯỚC 4.3**.
   - **Thứ tự Wave 2.1 (gộp `claims.lock` vào `events.lock` + bật guard `exec-under-hot-lock`)**: Trước khi bật guard ở 2.1, bắt buộc phải đưa cả `getMainFgosDir`/`resolveMainCheckoutRoot` (`runtime-coordination.mjs:17`) và `assertPlanEvidence` (`store.mjs:876`) ra ngoài `withEventsLock` (hoặc truyền `mainFgosDir` / kết quả kiểm tra `plan.md` đã tính trước khi vào khóa), và thêm `.fgos/porting/events.lock` (`porting-store.mjs`) vào phạm vi chuyển đổi (`R3-2`, `R3-4d`).
   - **Cổng `doctor` / `setup` / `CHANGELOG`**: Bản 3 đã gắn `doctor`/`setup`/`CHANGELOG` vào từng bước (1.2, 1.3, 4.1, 4.3, 5.4, 7.2) và yêu cầu bằng chứng chạy trước writer đầu tiên ở mỗi sóng — cấu trúc cổng này đạt chuẩn L5 và `distribution-vision.md`, chỉ cần sửa lại phụ thuộc thứ tự `4.4 -> 4.3` và danh sách sửa trước `2.1`.

---

## 3. Các Điểm Đã Tấn Công Mà Thiết Kế Bản 3 Đứng Vững

1. **Loại bỏ hoàn toàn lỗi double-reclaim TOCTOU và hết hạn TTL giả trên `main.lock`, `attempt.lock`, `cwd.lock` (B1, B4, B5)**: Chuyển sang kernel `flock` trên open file description gắn vòng đời khóa trực tiếp vào tiến trình trong kernel; tiến trình chết (`SIGKILL`) là kernel nhả khóa tức thì, tiến trình sống chạy bao lâu cũng không bị cướp khóa.
2. **Giao thức `state.reclaim` bảo vệ bước dọn `events.lock` của holder chết (Probe `P2`)**: Yêu cầu giữ kernel lock `state.reclaim` và đọc-kiểm-lại `holderId` trước khi `unlink` chặn đứng kịch bản hai contender cùng xóa khóa nối tiếp nhau.
3. **Kế thừa `attempt.lock` qua fd sang Launch Gate để giữ khóa khi Controller/Supervisor chết (Probe `P3`, `P4`)**: Gate giữ open file description của `attempt.lock` (và đặt `FD_CLOEXEC` cho worker) đảm bảo chừng nào gate còn sống thì không một tiến trình `adopt` hay `reaper` nào lấy được `attempt.lock`.
4. **Cơ chế một người thắng duy nhất giữa Supervisor và Adopter qua `link(receipt.json)` + CAS `settleRunControl` (Probe `P4`)**: Việc xuất bản `receipt.json` bằng hardlink nguyên tử (`EEXIST` cho người đến sau) kết hợp với `controlEpoch`/`controlToken` CAS đảm bảo không bao giờ ghi đè kết quả đã settle.
5. **Bảo vệ `rootPaneId` trong `terminal-control` (§7.3, §7.7)**: Luật bất biến không bao giờ đóng `rootPaneId` (pane gốc nơi người dùng khởi chạy phiên) chặn đứng lỗi đóng mất cửa sổ làm việc chính của người dùng.

---

## 4. Khuyến Nghị Cho Từng Câu Hỏi Chủ Sở Hữu (Mục 12 Bản 3) & Điều Kiện Duyệt

### 4.1. Khuyến nghị cho 3 câu hỏi chủ sở hữu ở mục 12 Bản 3

1. **Câu 12.1 (Chọn Phương án (a) không khóa hay Phương án (b) thêm khóa hạng 40 `terminal.slot` cho `terminal-control`?)**:
   - **Khuyến nghị dứt khoát: Chọn Phương án (b) — bắt buộc có kernel lock `terminal.slot` (rank 40)**.
   - **Lý do**: `probe-r3-6` đã chứng minh Phương án (a) bị lỗi đua thực tế khi nhiều seat cùng `groupKey` (`unitRunId`) gọi `allocate` song song, tạo ra N tab rời thay vì 1 tab chung và làm mất dấu N-1 tab lúc dọn. Một kernel lock `terminal.slot` (giữ vài ms quanh bước đọc/ghi `groups/<groupKey>.json` + gọi `herdr` tạo tab) đóng triệt để lỗi này.

2. **Câu 12.2 (Khi supervisor chết giữa chừng, giữ chính sách *"agent chạy tiếp tới `hardCeilingMs`"* hay giết luôn agent?)**:
   - **Khuyến nghị: Tách theo chế độ chạy**:
     - Với chế độ **headless (`subprocess` / `confined`)**: Giữ chính sách cho chạy tiếp tới `hardCeilingMs` vì worker tự thoát ngay khi ghi xong `outbox/result-<round>.json`.
     - Với chế độ **`terminal` (`herdr-spawn` REPL tương tác)**: Không được để chờ mù tới `hardCeilingMs` (`R3-7`). Hoặc (i) cho phép gate theo dõi sự xuất hiện của file `outbox/result-<round>.json` (chỉ kiểm tra sự tồn tại của file ở đường dẫn truyền qua argv, không cần hiểu schema `agent-protocol`) để sau một khoảng đệm ngắn (ví dụ 2–5s sau khi file xuất hiện ổn định) gửi tín hiệu kết thúc cho REPL và ghi `stoppedBy: "outbox-present"`; VÀ (ii) trong `adopt`/`settle`, nếu `outbox/result-<round>.json` hợp lệ đã có trên đĩa thì phải chấm theo kết quả trong `outbox` thay vì ghi đè thành `timeout`.

3. **Câu 12.3 (Ngân sách thời gian cho `hardCeilingMs` và `allocationGrace`)**:
   - **Khuyến nghị**: Thay vì dùng `allocationGrace` mù cho `terminal-control.sweep`, truyền đường dẫn file `attempt.lock` (hoặc kiểm tra `flock(LOCK_EX | LOCK_NB)` không chặn trên `attempt.lock`) trước khi `sweep` đóng một pane chưa `launched`. Nếu `attempt.lock` đang được giữ thì tiến trình khởi chạy vẫn đang sống, tuyệt đối không đóng pane (`R3-10b`).

### 4.2. Danh sách 9 điểm bắt buộc sửa trong thiết kế trước khi duyệt triển khai

1. **(`R3-1`, HIGH)** Bỏ cơ chế truyền trực tiếp `main.lock` fd vào `stdio[3]` của `git commit`; thay bằng cơ chế xác thực cha/tổ tiên giữ khóa qua `/proc/<ownerPid>/fdinfo` hoặc đóng fd 3 trước khi `git` sinh daemon con; quy định mở mọi file khóa với `O_RDWR | O_CREAT` và bỏ mô hình helper CLI thoát ngay trên Windows (`LockFileEx`).
2. **(`R3-2`, CRITICAL)** Trước khi bật guard `exec-under-hot-lock` (§6.6), phải đưa `getMainFgosDir`/`resolveMainCheckoutRoot` (`runtime-coordination.mjs:17`) và `assertPlanEvidence` (`store.mjs:876`) ra ngoài `withEventsLock`, đồng thời không được bọc các hàm có thể kích hoạt guard trong `try/catch` nuốt lỗi.
3. **(`R3-3`, HIGH)** Trong `process-facts` (§5.1) và `process-identity.mjs`, đọc trường `state` của `/proc/<pid>/stat`: nếu `state === 'Z'` (zombie) thì phán là `dead`; đồng thời sửa `process-identity.mjs:60` để bản ghi hỏng thiếu `pid` trả về `unknown`/`held` (fail-closed), không trả về `dead`.
4. **(`R3-4`, HIGH)** Sửa `src/runner/execution/run.mjs:345-351` để khi đọc lock gặp `EISDIR` (hoặc bất kỳ lỗi nào khác ngoài `ENOENT`) phải fail-closed; mở rộng quét quiescence sang mọi tiến trình có mở file/cwd trỏ tới linked worktree hoặc `.fgos` chung; chuẩn hóa `realpath` đồng nhất và tạo tombstone cho cả `.fgos/porting/events.lock`.
5. **(`R3-5`, CRITICAL)** Ghi marker `home-finalized.json` ở cuối bước `finalize-home`; trong `adopt` (§9.7 bước 2), nếu `result.json` đã có nhưng chưa có `home-finalized.json` thì bắt buộc phải chạy nốt `finalize-home` và `terminal-control.release` trước khi trả về `already-settled`.
6. **(`R3-6`, HIGH)** Tách khóa hoặc ghi marker `reaping.json` trước khi `reaper` (§9.8) giữ `attempt.lock`, hoặc để `reaper` đổi tên thư mục `home` sang `home.deleting.<pid>` dưới khóa ngắn rồi nhả `attempt.lock` ngay trước khi `rm -rf`, để `adopt`/`resume` không bao giờ nhầm một attempt đang được reaper dọn là `running`.
7. **(`R3-7`, CRITICAL)** Sửa luồng chế độ `terminal` khi supervisor chết và sửa quy tắc chấm điểm của `adopt`/`settle`: khi `outbox/result-<round>.json` hợp lệ đã được worker ghi xong, không được để `stoppedBy === 'hard-ceiling'` xóa bỏ kết quả `done` thành `timeout`.
8. **(`R3-8`, HIGH)** Trong Launch Gate (`p4_gate.py` / Rust `fgos gate`): (a) khi chạm `hardCeilingMs`, sau khoảng ân huệ `SIGTERM` (ví dụ 2–5s) phải gửi `SIGKILL` cho process group của worker ngay trong vòng chờ chính; (b) vòng dọn subreaper phải lặp cho tới khi `/proc/<gate>/task/<gate>/children` hoàn toàn rỗng; (c) phân biệt rõ tín hiệu dừng do hạn mềm (`SIGUSR1` hoặc ghi marker trước khi gửi `SIGTERM`) để không mất trạng thái `timeout`.
9. **(`R3-9`, `R3-11`, MEDIUM)** Đổi rank trong §6.5 thành `dispatch cwd` (rank 15) → `attempt` (rank 20) khớp với thứ tự lấy khóa thực tế, truyền cả `cwd.lock` sang supervisor/gate, và bắt buộc bước `4.4` (`fgctl` `lock.rs`) hoàn tất trước bước `4.3` (đặt tombstone `main-checkout.lock`).

---

## 5. Kết Quả Thực Nghiệm Từ 6 Bộ Probe Đa Tiến Trình

Toàn bộ mã nguồn và kết quả chi tiết được lưu tại `outbox/evidence-probes.json`. Dưới đây là kết quả JSON thu được khi chạy thực tế ngoài repo:

### 5.1. `probe-r3-1-git-fd3-daemon-leak.mjs` (`R3-1`)
```json
{
  "probe": "R3-1: git commit fd 3 borrow leaks kernel flock to detached child daemon",
  "ownerAcquired": true,
  "gitExitCode": 0,
  "hookVerdict": "borrower",
  "ownerClosedFd": true,
  "daemonPid": 3789412,
  "daemonFdInfoHasKernelLock": true,
  "strangerCanLockAfterOwnerClosedFdAndGitExited": false,
  "strangerCanLockAfterDaemonKilled": true
}
```

### 5.2. `probe-r3-2-hot-lock-exec-violation.mjs` (`R3-2`)
```json
{
  "probe": "R3-2: production withEventsLock executes 8 git subprocesses inside critical section; §6.6 exec-under-hot-lock guard crashes claimWork and is swallowed by try/catch in getMainFgosDir and assertPlanEvidence",
  "execSubprocessCountDuringClaimAndSettle": 6,
  "totalExecSubprocessCountUnderEventsLock": 8,
  "claimCrashedWhenGuardEnabled": "exec-under-hot-lock: git rev-parse HEAD",
  "moveHeavyFalsePreconditionFailureWhenGuardSwallowedByTryCatch": "work \"tsk-r32c\" cannot move to \"delivered\" — risk:heavy but no plan.md found in current tree (no branch \"fgw/tsk-r32c\") (checked docs/history/tsk-r32c/plan.md); write one before landing."
}
```

### 5.3. `probe-r3-3-zombie-holder-hot-lock.mjs` (`R3-3`)
```json
{
  "probe": "R3-3: Zombie process (state Z) misjudged as alive/held by §5.1 process-facts and hotTryAcquire",
  "procStatState": "Z",
  "kill0Alive": true,
  "v3JudgeOwnerVerdict": "alive",
  "prodResolveHolderLivenessVerdict": "held",
  "hotTryAcquireWhileHolderIsZombie": "held",
  "hotTryAcquireAfterParentWaitpid": "retry",
  "prodResolveHolderLivenessOnCorruptRecordWithoutPid": "dead"
}
```

### 5.4. `probe-r3-4-cutover-tombstone-and-quiescence.mjs` (`R3-4`)
```json
{
  "probe": "R3-4: Cutover tombstone & quiescence holes (§6.8)",
  "hole4a_runMjsResumeReadFileCode": "EISDIR",
  "hole4a_runMjsResumeFailsOpenOnTombstoneDir": true,
  "hole4b_detectedByMainCheckoutQuiescenceScan": false,
  "hole4c_symlinkVsRealpathTombstoneDiverges": true,
  "hole4d_portingEventsLockCoveredByTombstones": false
}
```

### 5.5. `probe-r3-5-supervisor-adopt-reaper-bugs.mjs` (`R3-5`, `R3-6`, `R3-7`, `R3-8`)
```json
{
  "probe": "R3-5 / R3-6 / R3-7 / R3-8: Supervisor, Adopt, Reaper, and Gate counterexamples",
  "subprobe5A_partialCrashAfterSettleBeforeFinalizeHome": {
    "resultExistsBeforeAdopt": true,
    "adoptVerdict": {
      "adopt": "nothing-to-do",
      "reason": "already-settled"
    },
    "privateHomeStillLeakedOnDisk": true
  },
  "subprobe5B_reaperHoldsAttemptLockWhileAdoptRuns": {
    "adoptVerdictWhileReaperCleaningDeadAttempt": {
      "adopt": "kept",
      "reason": "attempt-lock-held"
    }
  },
  "subprobe5C_terminalModeReplOrphanAtSupervisorCrash": {
    "agentWroteOutboxDoneClaim": true,
    "gateReceiptStoppedBy": "hard-ceiling",
    "settledResultStatus": "timeout",
    "completedWorkOverwrittenAsTimeout": true
  },
  "subprobe5D_gateGrandchildEscapeAndSigtermHang": {
    "grandchildSurvivedGateSubreaperCleanup": true,
    "sigtermIgnoringWorkerHungGatePastHardCeiling": true
  }
}
```

### 5.6. `probe-r3-6-terminal-control-races.mjs` (`R3-10`)
```json
{
  "probe": "R3-10: terminal-control lockless Option (a) groupKey tab race and allocationGrace sweep vs slow launch",
  "concurrentSeatsForSameGroupKey": 4,
  "expectedTabsCreatedForGroup": 1,
  "actualTabsCreatedWithoutLock": 4,
  "distinctTabsAssignedToSeats": [
    "tab-for-att-1",
    "tab-for-att-2",
    "tab-for-att-3",
    "tab-for-att-4"
  ],
  "sweepClosesPaneWhileSlowLaunchHoldsAttemptLock": true
}
```
