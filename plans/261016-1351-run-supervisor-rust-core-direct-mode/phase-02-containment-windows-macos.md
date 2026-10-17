# Phase 02: driver chứa Windows `job-object` và macOS `pgroup-tree`

Wave 1. Nhánh `run-supervisor/p02-containment-win-mac`, worktree `.claude/worktrees/rs-p02`. Phụ thuộc: P00. Song song với P01 (file khác).

## Đọc trước

- r6 §5.3 (dòng Windows, macOS), §6.0.1 (bước 0–3: người giữ job thứ hai, định nghĩa rỗng, dự phòng Toolhelp, kết thúc ngay), §12.10–12.12 (số đo), §10 dòng "Gate" (Windows: job còn handle của supervisor).
- Code đã đo xanh: [`tools/platform-probe/src/windows.rs`](../../tools/platform-probe/src/windows.rs), [`predecessor.rs`](../../tools/platform-probe/src/predecessor.rs), [`unix.rs`](../../tools/platform-probe/src/unix.rs); JSON [Windows lần ba](../reports/evidence-261016-1247-platform-probe-all-owners-dead-report-windows.json).
- Bàn giao 4.4a P06 dòng "Driver chứa process" (plan.md D6: chuyển sang đây).

## Amendment from plan 4.4b (2026-10-17; pending owner confirmation, 4.4b open question 1; do not merge to main unconfirmed)

Plan [4.4b](../261017-1256-windows-lockfileex-driver-and-macos-handoff/plan.md) D3 moves ownership of the `windows-job` domain into 4.4b P02, in the new file `packages/process/rust/src/platform/windows_job.rs`:
- `domain_watch`, `domain_is_empty`, `domain_kill_all`, `job_view`;
- `create_kill_job`, `open_job`, `job_name`, `assign_and_resume`.

**What changes for this phase:**
- **Stays here:** the Windows `create`, `spawn_in` and `guarantee` (they **call** the 4.4b functions and never reimplement them), the whole of macOS `pgroup-tree`, and the CI workflow.
- **Leaves this phase:** the Windows half of `domain_is_empty`/`domain_kill_all` in `lib.rs`. `platform/windows.rs` is not touched for the domain.
- **The Windows empty rule below is superseded** by 4.4b D5, which follows probe runs 2–3 ([report](../reports/probe-261017-0710-windows-predecessor-all-owners-dead-race.md)):
  - a **job view** for the holder and keeper;
  - a **contender view**: if the recorded root is alive, judge by the job only; if it is dead, use the union of the job list, the `IsProcessInJob` scan and the root's tree (processes created at or after `declaredAt`, excluding the keeper), re-read on every poll and failing closed on an unopenable member;
  - a Toolhelp fallback with two quiet snapshots;
  - a cross-session record fails closed.
- **Record shape:** `windows-job.domainId` = `{job, sessionId, declaredAt, holder: {host, pid, startTime}, keeper: {host, pid, startTime} | null}`. For an attempt, `holder` is the gate; `keeper` is the supervisor's tuple, or `null` when the supervisor creates the job itself.
- **Tests:** tests (4)–(6) below move to 4.4b P02. This phase keeps (1)–(3) and (7)–(8).
- **Open question for 6.2's owner:** is the gate always a job member? If so, the root-alive split never changes an attempt's outcome.

**If the owner rejects the move:** delete this block. 4.4b P02's content becomes this phase's Windows domain work, and **this phase lands on main alone and early**, ahead of the rest of 6.2, so that 4.4b P04 is not blocked on all of 6.2.

## Yêu cầu

**Windows `job-object`:**
- `create(attemptId)`: job **có tên** `fgos-attempt-<attemptId>-<token 128 bit>`, `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`, không `BREAKAWAY_OK`/`SILENT_BREAKAWAY_OK`. Supervisor giữ handle (người giữ thứ hai, §6.0.1 bước 1).
- `spawn_in`: tạo gate `CREATE_SUSPENDED`, `AssignProcessToJobObject`, rồi resume (hoặc `PROC_THREAD_ATTRIBUTE_JOB_LIST`); gate mở thêm một handle job theo tên khi vào. Tuple host = `{pid, creationTime}`.
- `is_empty`: mở theo tên được → rỗng ⇔ `ActiveProcesses == 0` **và** mọi member trong `JobObjectBasicProcessIdList` (lấy lại mỗi lần hỏi) đã signaled (mở `SYNCHRONIZE`, `WaitForSingleObject(0)`). Mở **không** được → dự phòng Toolhelp: rỗng ⇔ không còn process nào có chuỗi cha (pid + creation time) dẫn tới gate/holder đã ghi, và các process đó signaled. Không bao giờ "mở không được = rỗng".
- `kill_all`: `TerminateJobObject` ngay (r6 chọn B), rồi chờ đúng định nghĩa rỗng tối đa `lock.predecessorKillWaitMs`.
- `guarantee = {level: kernel, escapes: ["process do service/COM ngoài job tạo"]}`.
- Cài `domain_is_empty/domain_kill_all` của `fgos-process` cho kind `windows-job` bằng cùng mã (4.2 để `Unknown/Refused`), để luật 6.0.1 của holder-lock và adopt dùng chung.

**macOS `pgroup-tree` (best-effort):**
- Gate trong session + process group riêng; `is_empty` = không process nào trong pgid **và** quét cây (`proc_listchildpids` đệ quy từ gate, ghi tập đã thấy vào `domain.id`) không còn process sống; `kill_all` = `killpg(SIGKILL)` + quét cây + SIGKILL từng pid đã kiểm identity; `guarantee = best-effort` với escape `setsid + fork đôi về launchd`, `dịch vụ launchd/XPC`.
- Cài `domain_is_empty/kill_all` cho `macos-tree`.
- Adopt trên macOS thêm một lần quét lại sau `containment.macosRescanMs` (mặc định 500 ms, hằng trong code; không cấu hình vì chỉ là best-effort).

**CI:** workflow `.github/workflows/process-containment.yml` (chỉ `workflow_dispatch`, như `platform-probe.yml`), matrix `windows-latest`, `macos-latest`, `ubuntu-latest`: `cargo test -p fgos-process -p fgos-run-supervisor`.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `packages/process/rust/src/containment/{windows.rs,macos.rs}`, `packages/process/rust/src/platform/{windows.rs,macos.rs}` (chỉ phần domain), `packages/process/rust/Cargo.toml` (feature `windows-sys` các module Job/Toolhelp/Threading) |
| tạo | `packages/process/rust/tests/{containment_windows.rs,containment_macos.rs}`, `.github/workflows/process-containment.yml` |

## Test

Windows (chỉ chạy `cfg(windows)`, trên runner): (1) job đóng → con, cháu, con `DETACHED_PROCESS` chết; (2) breakaway bị từ chối; (3) supervisor (process test) chết, gate còn handle → agent sống; cả hai chết → agent chết; (4) `is_empty` không trả `empty` khi `ActiveProcesses == 0` mà member chưa signaled (lặp 50, 0 vi phạm); (5) mọi người giữ handle chết → Toolhelp, 50 lần 0 vi phạm; (6) record job đã đóng từ trước → `empty` ngay.
macOS: (7) cây 40 process → `kill_all` đủ; (8) `setsid` + fork đôi sống sót → test khẳng định `guarantee` liệt kê escape đó.
Linux: `cargo check` hai target.

Lệnh: `cargo test -p fgos-process containment` trên từng runner; chạy workflow bằng `gh workflow run process-containment.yml --ref run-supervisor/p02-containment-win-mac` (Lead chạy, ghi run id).

## Tiêu chí nghiệm thu / rollback

Workflow xanh ba OS, run id ghi trong báo cáo phase; số đo chờ thêm (p50/p95) so với r6 §12.12 không lệch quá 2 lần. Rollback: revert (driver chưa ai gọi trên hai nền này).
