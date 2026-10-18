---
title: "6.2 Run supervisor: lõi Rust, cách khởi động direct, cổng chứa process, cửa adopt"
description: "Mỗi attempt một process supervisor Rust và một gate là gốc process của agent trong miền chứa chứng minh được rỗng; lock attempt và lease cwd giữ trước prepare; receipt từng bước; cửa adopt thay reaper; driver chứa process Linux, Windows Job Object, macOS best-effort; agent-protocol direct cho 5 CLI; xoá supervisor Node và kênh IPC"
status: completed
priority: P1
effort: 83h
branch: plan/run-supervisor-6-2-6-3-6-4
tags: [run-supervisor, gate, containment, adopt, agent-protocol, rust, cross-platform, cutover]
created: 2026-10-16
---

# Plan 6.2: run supervisor Rust + cách `direct`

- **Thực hiện thiết kế r6**: [design-261016-1238-...-v3-r6.md](../reports/design-261016-1238-lock-and-run-supervisor-foundation-v3-r6.md) §5.2–5.3 (control, cổng chứa process), §6.0 + §6.0.1 (luật miền của holder trước, người giữ job thứ hai trên Windows), §6.1.1 (luật description), §8 (agent-protocol), §9.1–9.10 (supervisor, gate, giao attempt, deadline, receipt, adopt, dọn home), §10 (bảng lỗi), §11 entry 6.2, §12.2, §12.3, §12.7, §12.10–12.12 (đo trên Windows/macOS/Linux thật). Phản biện [kongming vòng 3](../reports/red-team-kongming-261016-1018-lock-and-run-supervisor-foundation-v3-r3-review.md) M1–M3 và N1–N3, N5, N6, N8 đã nằm trong r6 và được cài ở đây (bảng "Phản biện áp vào" bên dưới).
- **Vai trò (hội đồng, anh quyết 2026-10-15)**: [kết luận hội đồng](../reports/architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md) dòng 164: supervisor chỉ quản process của agent, không biết pane; mọi lời gọi terminal-control theo attempt id; bên điều phối cấp slot; đúng hai cách khởi động `direct` và `terminal`; agent-protocol là adapter theo CLI × cách khởi động, nằm cạnh supervisor. Plan này làm `direct`; `terminal` là [plan 6.3](../261016-1351-terminal-mode-and-launcher-identity/plan.md).
- **Xây trên** (không định nghĩa lại contract của họ): [4.2 holder-lock](../261016-1104-holder-lock-kernel-lock-foundation/plan.md) (crate `fgos-process` với `judge`, `spawn_with_fds`, `signal_by_identity`, `domain_is_empty/kill_all` cho `linux-gate`; crate `fgos-holder-lock` với `acquire/probe/declare_domain` + luật 6.0.1; facade Node `LockScope`; registry đã có dòng `attempt` hạng 15 chủ 6.2 và `dispatch-cwd` hạng 30; nhánh `internal` trong `apps/fgos/src/main.rs`), [4.3](../261016-1306-main-checkout-single-door-hot-lock/plan.md) (record nóng có `pidNs`, luật N4), [4.4a](../261016-1306-fgctl-rust-callers-on-holder-lock/plan.md). 6.5 terminal-control không cần cho `direct`.
- **Quyết định của anh áp vào đây:** một người dùng, không tương thích ngược; cutover dừng-toàn-bộ, xoá đường cũ trong cùng phase; sai thứ tự lock ném ngay; đa nền tảng qua cổng trung lập OS (Linux trước, driver Windows hết bị chặn, macOS best-effort); chỉ `--resume` tường minh (r6 §16); không work item; song song hoá tối đa.
- Impact-analysis: GitNexus có mặt nhưng index đang cũ (hook báo `b334695`) và không index được trọn file lớn (tsk-38h). Plan dùng trích dẫn grep có số dòng ở HEAD `b9cdb2d64`; executor chạy `node .gitnexus/run.cjs analyze` rồi `impact` trên `executeAssignment`, `cliSpawnAdapter`, `reapOrphanedConfinementResources`, `finalizeConfinementResources`, `runDetachedRunSupervisor` trước khi sửa, và báo blast radius (dự kiến HIGH cho `assignment-runner.mjs`).
- Component boundary: **có đổi** (thêm run supervisor L4, launch gate, agent-protocol L3, cổng chứa process ở L0). P11 cập nhật [`component-boundary.md`](../../docs/platform/component-boundary.md).

## CẮT LẠI 2026-10-18

Ghi đè các dòng cũ ở trên khi mâu thuẫn. Kiểm trên nhánh tích hợp sau khi main được merge vào (`a5ecb2fff`); P00 đã xong (`d3720fcef`, `447da6adc`): `cargo test -p fgos-process -p fgos-holder-lock -p fgos-run-supervisor -p fgos-agent-protocol` xanh (21 binary test, 0 fail), `node --test test/run-supervisor/contracts.test.mjs` 6/6.

**Tiền đề đã đủ (không còn chờ):** 4.2 holder-lock; 4.4a caller Rust; 4.3-R khoá repo (`src/runner/repo-locks.mjs`: `withMainCheckout` hạng 50, `withMergeTargetSlot` 20, `withWorktreeAdmin` 40); 4.3-S hot lock (`src/state/hot-lock.mjs`, `withStateTx`, record nóng có `pidNs`) nên tiền đề `pidNs` của P09 đã thoả; 4.4b driver Windows (`LockFileEx`, route `fgos internal lock-hold`, `packages/process/rust/src/platform/windows_job.rs`, danh sách handle kế thừa `PROC_THREAD_ATTRIBUTE_HANDLE_LIST` trong `windows_spawn.rs`). Event store D-ADR0055 đã ký nhưng chưa xây: không phụ thuộc.

**Thay đổi chung:**
- D7 hết hiệu lực: Windows đã có driver lock, `fgos run` không còn `lock-driver-unavailable`. Windows end-to-end chạy được ngay khi route supervisor có; CHANGELOG và doctor không còn nói "chờ driver lock".
- D6 (anh duyệt 2026-10-17 13:53): miền `windows-job` thuộc 4.4b (`windows_job.rs`). 6.2 P02 chỉ **gọi** `create_kill_job/open_job/job_name/assign_and_resume` và `Domain::WindowsJob`; không viết lại `domain_is_empty/kill_all` cho Windows. Gate luôn là thành viên job (spawn tạm dừng, gán job, rồi chạy), nên nhánh "root còn sống" của contender view không bao giờ đổi kết quả của attempt: `holder` = gate, `keeper` = supervisor.
- `Domain` trong `packages/process/rust/src/lib.rs` hiện chỉ có `LinuxGate`, `WindowsJob`, `MacosTree`; **thiếu `LinuxPgroup`** (contract đã có từ P00, D5). P01 thêm biến thể này cùng `domain_is_empty/kill_all`, và cập nhật `facts`/mã đọc record predecessor nếu chúng khớp enum.
- Contract `containment.port.v1.json` dòng `windows-job` đã sửa theo record 4.4b (job view/contender view, không còn "ActiveProcesses == 0 là rỗng").
- Ràng buộc mới cho P09: không spawn supervisor, `fgos` hay bất kỳ child_process nào trong `withStateTx`; guard `exec-under-hot-lock` ném ngay (bọc `spawn/spawnSync/exec/execSync/execFile/execFileSync/fork`). Resolve `FGOS_HOST_BIN`/`payloadRoot` và dựng envelope **trước** mọi tx; hàm đọc `hotLockDepth()` có sẵn để assert. Thứ tự lock không đổi: `attempt` (15) → `dispatch-cwd` (30); khoá repo (20/40/50) do 4.3-R giữ qua `repo-locks.mjs`, không lồng vào attempt trước khi gate thoát.
- Workflow CI mới theo mẫu `holder-lock-cross-platform.yml` (đã có), không phải `platform-probe.yml`.

**Delta từng phase:**
- P01: thêm `Domain::LinuxPgroup`; dùng `spawn_with_fds` + `judge` + `domain_is_empty/kill_all(LinuxGate)` đã có (không viết lại); `containment/linux.rs` đã là file rỗng có sẵn.
- P02 (phạm vi rút gọn, đã duyệt): giữ Windows `create/spawn_in/guarantee` (gọi hàm 4.4b), toàn bộ macOS `pgroup-tree` + `domain_is_empty/kill_all` cho `macos-tree` (hiện `Unknown/Refused`), workflow CI; test (1)–(3), (7)–(8). Bỏ phần Windows của `domain_is_empty/kill_all`, test (4)–(6), sửa `platform/windows.rs`; không chạm `windows_job.rs`.
- P03, P05: không đổi. P03 bước 10 Windows: gate mở handle job theo tên bằng `open_job`.
- P04: không đổi; `main.rs` đã có nhánh `internal` với `lock-hold`: thêm bốn route cạnh nó, không đổi route đó. Spawn bước dùng danh sách handle kế thừa trên Windows (map rỗng = danh sách chỉ stdio).
- P06: client Node dùng `src/holder-lock/index.mjs` (`acquire`, `lockHolders`) khi cần; adopt Windows judge miền bằng `domain_watch` (contender view), không tự viết.
- P07, P08: không đổi.
- P10: `cleanup.mjs`, `run.mjs`, `loop.mjs`, `dispatch/cli.mjs` còn là file chung với 6.5; giữ cả hai phía khi xung đột.
- P09: ràng buộc `withStateTx` ở trên; tiền đề "4.3 landed" đã thoả; bỏ chờ P01+P02 của 4.3.
- P11: bỏ câu "Windows báo `lock-driver-unavailable`" khỏi CHANGELOG/spec; `lock-holders` đã có phần Windows `windows-job` (N1 chỉ thêm quan hệ cha supervisor/gate); `CHANGELOG.md`, `registrations.mjs`, `runner.md`, `component-boundary.md`, `reading-map.md` là file chung với 6.5.
- P12 phần A: bước 3 `cargo check` Windows/macOS chạy local khi target cài sẵn; CI chạy do lead lớn đẩy, phase lead không push.

**Thứ tự chạy (hàng đợi của lead lớn, từng phase một):** P01 → P02 → P05 → P03 → P04 → P06 → P07 → P08 → P10 → P11 → P09 → P12 phần A. Giữ nguyên thứ tự merge cũ; không đổi.

## Prior art (đã kiểm `git log --follow`, `-G`)

| Thứ bị thay | Vào ở | Ghi chú |
|---|---|---|
| [`detached-run-supervisor.mjs`](../../src/runner/dispatch/detached-run-supervisor.mjs) (1234 dòng), trước tên `cli-spawn-supervisor.mjs` | `8e3da27c2` (2026-09-13), đổi tên `649682f4e`, vá IPC `7f1f4c2d2` | Supervisor Node cầm pipe của agent ([`:419-427`](../../src/runner/dispatch/detached-run-supervisor.mjs) `process.send`) và kênh `ipc` ([`:866`](../../src/runner/dispatch/detached-run-supervisor.mjs)). T8 §4.2: chết vì `ERR_IPC_CHANNEL_CLOSED`, agent chết theo. **Tái dùng:** định dạng receipt/binding và hàm đọc (`readDetachedRun*` `:252-282`) làm khuôn cho hợp đồng mới; **bỏ:** pipe, IPC, Node làm chủ |
| Reaper `reapOrphanedConfinementResources` ([`cleanup.mjs:465`](../../src/runner/dispatch/confinement/cleanup.mjs)) | `1ee3cc43f` (2026-09-10), sửa `041bb190c`, `29e0931fb`, `d4fe5f248`, vá gọn `6ce17f136` | 4 call site: [`run.mjs:315`](../../src/runner/execution/run.mjs), [`dispatch/cli.mjs:1231`](../../src/runner/dispatch/cli.mjs), [`loop.mjs:1443`](../../src/runner/loop.mjs), [`registrations.mjs:5450`](../../src/setup/registrations.mjs). Gộp vào cửa adopt (r6 §9.8) |
| `BoundInvocationSupervisor` ([`bound_invocation_supervisor.rs`](../../packages/host-runtime/rust/src/providers/external_process/bound_invocation_supervisor.rs)) | `cf5509383`, đổi tên `e589577c1` | **Giữ riêng** (r6 §9.9); chỉ dùng chung primitive L0 |
| Code Job Object, process group, Toolhelp, predecessor | [`tools/platform-probe/src/windows.rs`](../../tools/platform-probe/src/windows.rs), [`predecessor.rs`](../../tools/platform-probe/src/predecessor.rs), [`unix.rs`](../../tools/platform-probe/src/unix.rs) (`6449c06a3` và sau) | **Tái dùng** cách gọi API đã đo xanh ở run `38855067175`, `38856358204`, `38857403785` cho driver P02 |
| `--unshare-pid` ở mode blind ([`bwrap.mjs:511`](../../src/runner/dispatch/confinement/drivers/bwrap.mjs)), `--proc /proc` ([`:464`](../../src/runner/dispatch/confinement/drivers/bwrap.mjs)) | — | Mở rộng cho mọi attempt kèm `--as-pid-1` (P08) |
| Không có supervisor Rust nào từng tồn tại rồi bị gỡ | — | `git log -G'run_supervisor\|RunSupervisor\|supervise' -- packages apps` chỉ ra BoundInvocation |

## Phản biện kongming áp vào

| # | Áp ở | Cách |
|---|---|---|
| M1 | P01, P08, P09 | `--die-with-parent` **không** có ở `direct`; test "supervisor SIGKILL → agent chạy tiếp" chạy qua bwrap thật |
| M2 | P01, P03 | `--as-pid-1`; gate cài handler SIGTERM/SIGINT; vòng `waitpid(-1)` liên tục (kongming câu mở 3) |
| M3 | P00, P03 | Kênh GO không so pid; `direct` dùng socketpair kế thừa nên không cần `SO_PEERCRED`; GO mang `attemptId` + digest envelope |
| N1 | P11 | `lock-holders` coi monitor bwrap có cha là supervisor/gate của attempt đang giữ lock là thành viên |
| N2 | P04 | Bước sau receipt không nhận fd lock |
| N3 | P01, P06 | Rỗng ⇔ `judge(gate host tuple) == dead`; quét inode `ns/pid` chỉ ở doctor |
| N5 | P08 | `--bind` thư mục socket runtime (dùng ở 6.3, cài ở đây cùng driver) |
| N6 | P06 | `lock-scan` dùng `LOCK_SH\|LOCK_NB` |
| N8 | P03 | Không PDEATHSIG ở gate cách `direct` |

## Lead tự quyết

| # | Quyết định | Lý do |
|---|---|---|
| D1 | Package `packages/run-supervisor` (crate `fgos-run-supervisor`: envelope, supervisor, gate, step runner, adopt) và `packages/agent-protocol` (crate `fgos-agent-protocol`). Cổng chứa process là mô-đun `containment` trong crate `fgos-process` của 4.2 | r6 §4.1: cổng chứa là L0; supervisor/gate là L4; agent-protocol L3 thuần, không phụ thuộc terminal-control |
| D2 | Cửa adopt cài **bằng Rust** (`fgos internal adopt`), dùng chung step runner với supervisor. Node chỉ có client mỏng `src/run-supervisor/client.mjs` gọi route | Một cài đặt ma trận 9.7; bước sau receipt chạy cùng một cách dù supervisor hay adopter chạy |
| D3 | Bước Node (`settle-attempt`, `finalize-home`) chạy qua route `fgos internal attempt-step <stepId> --protocol 1`: host Rust exec payload Node của **cùng release** ghi trong envelope (`payloadRoot`, resolve như [`legacy_exec.rs`](../../apps/fgos/src/legacy_exec.rs), không PATH) với entry `src/run-supervisor/attempt-step.mjs`. Không thêm verb vào `bin/fgos.mjs` | r6 §9.6, §9.10; luật Legacy-Node CLI (AGENTS.md); route nội bộ không có trong help |
| D4 | agent-protocol cách `direct` **không** dựng argv: argv vẫn do `resolveExecutorCommand` ([`transport.mjs:151`](../../src/runner/dispatch/transport.mjs)) dựng từ cấu hình executor và ghi vào envelope. Adapter `direct` của mỗi CLI quyết: stdin (file brief hay `/dev/null`, vd. codex phải `ignore`, [`transport.mjs:540-544`](../../src/runner/dispatch/transport.mjs)), nguồn hoạt động cho idle (capture lớn lên hay sự kiện JSON theo `liveOutput`), nhận xong (agent thoát + `outbox/result-N.json`), kết quả có tên (`blocked(login\|trust-dialog)`, `completed`, `needs-human`) | r6 §8 "không chọn model"; chuyển rendering argv sang Rust đụng bộ binder ProviderAdapter ([`transport.mjs:196-213`](../../src/runner/dispatch/transport.mjs)), không cần cho mục tiêu sống qua controller chết |
| D5 | Thêm `domainKind` `linux-pgroup` vào `packages/holder-lock/contracts/predecessor.v1.json` (bổ sung giá trị enum, không đổi trường) cho Linux không có user namespace (mức `best-effort`, r6 §5.3, §9.3 điểm 3) | Cổng chứa phải khai miền cho mọi driver; giá trị thêm không đổi hành vi của 4.2 |
| D6 | Driver chứa process Windows `job-object` và macOS `pgroup-tree` nằm ở **6.2 P02**, cùng `domain_is_empty/kill_all` cho `windows-job`, `macos-tree` mà 4.2 để `Unknown/Refused`. Dòng "Driver chứa process" trong [bàn giao 4.4a P06](../261016-1306-fgctl-rust-callers-on-holder-lock/phase-06-cross-platform-drivers-handoff.md) chuyển sang đây; 4.4b chỉ còn driver lock `lockfileex` và dùng lại các hàm này | Brief của anh: cổng chứa thuộc 6.2 với driver Windows đã đo xanh; tránh hai chủ cho một file |
| D7 | Windows end-to-end (`fgos run` direct trên Windows) cần driver lock `lockfileex` của 4.4b. Tới khi 4.4b land, `fgos run` trên Windows từ chối có tên `lock-driver-unavailable` (như 4.4a D5); driver chứa Windows được nghiệm thu bằng `cargo test -p fgos-process -p fgos-run-supervisor` trên runner `windows-latest` (workflow mới `process-containment.yml`, chạy tay) | Không lùi về v1 (quyết định A2 của anh trong 4.2); vẫn chứng minh driver trên máy thật |
| D8 | Marker home bản 2 `{contract: 2, attemptId, runDir, createdAt}` (không pid, không pane). Landing chạy reaper cũ lần cuối bằng release cũ để dọn hết home bản 1 của `direct` (không còn worker nào sau khi dừng toàn bộ), rồi mới activate. Nhánh luật cũ chỉ còn cho marker bản 1 có `paneId` (herdr) tới 6.3 | Anh: không tương thích ngược; r6 §9.8 "mỗi home đúng một giao thức quyết quyền dọn" |
| D9 | Thời gian chờ SIGTERM → SIGKILL ở gate dùng khoá cấu hình mới `dispatch.gateKillGraceMs` (mặc định 10000) nếu không tìm thấy khoá grace sẵn có; đăng ký setup config-merge + doctor ở P11 | r6 §9.3 điểm 5 "chờ ngắn"; luật install gate (AGENTS.md) |
| D10 | Run cũ (không có `attempt.lock`/envelope v3) adopt bỏ qua, báo `legacy-run`; dọn chúng là việc 6.4 | Một cửa cho run mới; 6.4 có đầu việc "attempt `running` kẹt" |

## Phạm vi

Trong 6.2: contract (envelope v3, binding, GO, gate-exit, receipt, receipt bước, stop/cancel request, adopt, cổng chứa); cổng chứa + driver Linux `bwrap-pidns` và `linux-pgroup`, Windows `job-object`, macOS `pgroup-tree`; route `fgos internal gate|supervise|adopt|attempt-step`; agent-protocol crate + adapter `direct` cho claude, codex, agy, pi, omp; bước Node `settle-attempt`, `finalize-home` (hợp đồng finalize mới); driver `bwrap.mjs`; cutover `direct` trong `assignment-runner.mjs`/`transport.mjs` (lock attempt + lease cwd trước prepare, envelope v3, bỏ IPC, bỏ settle của controller); bốn call site reaper sang cửa adopt; doctor/setup/spec/CHANGELOG; landing.

Ngoài: cách `terminal`, gate trong pane, adapter interactive, mint writer id (6.3); `inspect` "unit chờ resume", `--resume` dùng adopt, `recover` qua adopt, Ctrl-C gửi `cancel`, dọn attempt `running` cũ (6.4); driver lock Windows `lockfileex` (4.4b).

## Phase và phụ thuộc

Tiền đề: **4.2 đã land** (bắt đầu P00). **4.3 P01 (hot-lock core) + P02 (claims gộp vào `state`) đã land** trước khi merge P09 (phần repo-lock P03–P08 của 4.3 đang tạm giữ chờ component Git, không chặn P09) (r6 §11 đường găng 4.3 → 6.2: từ 6.2 mọi agent chạy trong PID namespace, record nóng phải có `pidNs`, luật N4).

> **Ghi chú 2026-10-17 10:55:** phần state của 4.3 (P01, P02) đang tạm giữ chờ hội đồng event store (luật L3 chạm ngưỡng xem lại). Khi có kết luận, 4.3 cắt lại các phase đó một lần và sắp thứ tự để P01 + P02 merge được vào main sớm, không để nhánh tích hợp đỏ. Phần khoá repo của 4.3 làm theo plan cũ ngay khi 4.2 land. Tiền đề của P09 ở trên không đổi; nếu hội đồng đổi hình dạng `events.lock`/`claims.lock`, tiền đề `pidNs` trong bản ghi nóng vẫn phải được giữ.

| Phase | Nội dung | Phụ thuộc | Wave | Giờ |
|---|---|---|---|---|
| [00](phase-00-contracts-and-crate-skeletons.md) | Contract, crate rỗng, enum `linux-pgroup` | 4.2 landed | 0 | 4 |
| [01](phase-01-containment-port-linux.md) | Cổng chứa + driver Linux `bwrap-pidns`, `linux-pgroup` | 00 | 1 | 7 |
| [02](phase-02-containment-windows-macos.md) | Driver Windows `job-object`, macOS `pgroup-tree`, workflow CI | 00 | 1 | 9 |
| [03](phase-03-gate-route.md) | Route `gate` (pid 1, IO, trần cứng, `gate-exit`) | 00; 01 (nghiệm thu) | 1 | 8 |
| [04](phase-04-supervisor-route-and-step-runner.md) | Route `supervise`, step runner, receipt | 00; 01, 03 (nghiệm thu) | 1 | 9 |
| [05](phase-05-agent-protocol-direct.md) | Crate agent-protocol + adapter `direct` 5 CLI | 00 | 1 | 5 |
| [06](phase-06-adopt-door.md) | Route `adopt`, `lock-scan`, ma trận phục hồi | 00; 04 (step runner) | 1 | 7 |
| [07](phase-07-node-attempt-steps.md) | `attempt-step` + `settle-attempt`, `finalize-home` | 00 | 1 | 6 |
| [08](phase-08-bwrap-driver-pidns.md) | `bwrap.mjs`: pid namespace mọi attempt, socket dir, anchor | 00 | 1 | 3 |
| [10](phase-10-reaper-call-sites-to-adopt.md) | Ba call site reaper sang adopt, marker bản 2 | 00; 06 | 1 | 4 |
| [09](phase-09-cutover-direct-mode.md) | Cutover `direct`, xoá supervisor Node + IPC, bằng chứng crash | 01–08, 10; 4.3 landed | 2 | 12 |
| [11](phase-11-doctor-setup-spec-changelog.md) | Doctor, setup, spec, boundary, CHANGELOG | 00 (docs); 04, 06 (check) | 1–2 | 5 |
| [12](phase-12-integration-landing.md) | Tích hợp, T8 cli chạy lại, CI Windows/macOS, landing | 00–11 | 3 | 4 (Lead) |

```text
wave 0: P00
wave 1: P01 ∥ P02 ∥ P03 ∥ P04 ∥ P05 ∥ P06 ∥ P07 ∥ P08 ∥ P10 ∥ P11(docs)
        (code song song theo contract P00; nghiệm thu theo mũi tên: P03,P04 cần binary bwrap của P01; P06,P10 cần step runner P04)
wave 2: P09 ∥ P11(check)
wave 3: P12 (Lead)
```

Nhánh tích hợp `run-supervisor/integration` (worktree `.claude/worktrees/rs-integration`); mỗi phase nhánh `run-supervisor/pNN-<slug>`, worktree `.claude/worktrees/rs-pNN`, tạo từ đỉnh nhánh tích hợp đầu wave. Thứ tự merge: P00 → P01 → P02 → P05 → P03 → P04 → P06 → P07 → P08 → P10 → P11 (docs) → P09 → P11 (check). Chủ file dùng chung: `Cargo.toml`/`Cargo.lock` gốc, contract → P00; `packages/process/rust/src/lib.rs` → P01 (P02 chỉ thêm file platform mới, khai `mod` qua P01 đã dựng sẵn ở P00); `apps/fgos/src/main.rs` → P04 (đăng ký cả bốn route; P03, P06 giao hàm `run_*` cho P04 gọi); `src/runner/dispatch/assignment-runner.mjs`, `transport.mjs`, `detached-run-supervisor.mjs` → P09; `confinement/authority.mjs` → P07 (wave 1) rồi P09 (wave 2); `confinement/cleanup.mjs` → P10; `bwrap.mjs` → P08; `src/setup/registrations.mjs`, `test/setup/checks.test.mjs`, `CHANGELOG.md`, docs → P11. Không phase nào sửa `bin/fgos.mjs`, `test/test-ownership.mjs`.

**Quan hệ với plan khác:** 6.5 P06 sửa `cleanup.mjs` (`:400-435`, `:150-180`) và `dispatch/cli.mjs` (`:1195-1235`); P10 ở đây sửa `cleanup.mjs` phần reaper và `run.mjs:315`, `loop.mjs:1443`. Plan land sau rebase; nếu 6.5 land trước, P10 giữ nguyên phần herdr đã chuyển sang `inspect(key)`. 6.3 xoá phần herdr còn lại của reaper.

## Data flow

```text
fgos run (controller, Node)
  LockScope: acquire attempt.lock (15) [+ dispatch-cwd (30) nếu mutating]   ← trước mọi side effect
  prepare: bind, confinement.prepare (marker v2 attemptId), envelope v3 (digest) + side file 0600 (secrets, token run control)
  spawn  $FGOS_HOST_BIN internal supervise --envelope <p> --protocol 1   fd3=attempt, fd4=cwd; setsid; stdio→file; không IPC
  chờ supervisor-binding.json  →  đóng fd 3/4 (finally mọi đường)  →  đọc receipt + receipt bước từ file
supervise (Rust)
  CLOEXEC fd3/4 → containment.create(attemptId) → declare_domain (predecessor.json) → spawn_in(gate, fds{3,4,GO socketpair})
  binding {supervisor, gate host tuple, domain, guarantee} → GO {attemptId, envelopeDigest}
  canh: deadline mềm, idle (agent-protocol activity), heartbeat, đuôi capture; hết giờ: stop-requested → SIGTERM gate
  gate-exit → đóng lease cwd → receipt (link một lần) → bước: settle-attempt → finalize-home (→ release-slot ở 6.3), mỗi bước receipt riêng
gate (Rust, pid 1 trong bwrap --unshare-pid --as-pid-1)
  CLOEXEC lock fds → mở capture (dup2 1,2), brief (stdin) → spawn agent → waitpid(-1) liên tục
  trần cứng CLOCK_BOOTTIME: SIGTERM → gateKillGraceMs → SIGKILL ; agent thoát → kill(-1,SIGKILL) → reap tới ECHILD → gate-exit.json → thoát
adopt (Rust, gọi từ run.mjs đầu runUnit, loop.mjs, cli.mjs, doctor fix)
  lock-scan LOCK_SH|NB (một lời gọi, nhiều run) + containment.is_empty(binding.domain)
  trống + rỗng → EX + adopting → ma trận 9.7 → step runner → closed
```

## Tiêu chí xong

1. `cargo test -p fgos-process -p fgos-run-supervisor -p fgos-agent-protocol -p fgos` xanh trên Linux; `cargo check` cùng các crate cho `x86_64-pc-windows-msvc`, `aarch64-apple-darwin`; workflow `process-containment` xanh trên `windows-latest` và `macos-latest` (run id ghi trong báo cáo).
2. Bằng chứng crash qua **bwrap thật** và CLI Node thật ghi stdout liên tục (P09): controller SIGKILL → agent chạy xong, receipt, settle đủ `result.json`/`exit.json`/`evidence.json`, home dọn, lock trống; supervisor SIGKILL → agent chạy tiếp, adopt settle từ `gate-exit` + outbox; deadline mềm sau khi controller chết → `timeout`, cháu `setsid` chết; controller + supervisor chết → trần cứng của gate thi hành; hai adopter → một `adopted`, một `running`/`being-adopted`, không settle bị từ chối; controller chết ở bốn cạnh 9.4.
3. Gate: `nspid == 1`; SIGTERM tới gate → agent dừng trong grace; gate SIGKILL khi agent có cháu `setsid` → cháu chết (12.7 thành test); agent bỏ qua SIGTERM → trần cứng vẫn kết thúc; không zombie tích luỹ trong attempt dài (đếm `Z` trong namespace).
4. Luật description trên route Rust: sau khi agent chạy, `/proc/<agent>/fd` và một cháu không có inode lock attempt/cwd; bước sau receipt không có inode lock.
5. `rg 'startDetachedRunSupervisorProcess|runDetachedRunSupervisor|bindConfinedHomesToSupervisor|legacySpawn|useSupervisorRecovery|process\.send' src` rỗng; `rg 'reapOrphanedConfinementResources' src` chỉ còn định nghĩa phần marker bản 1 có `paneId` (herdr, 6.3 xoá) và không call site nào ngoài cửa adopt.
6. Doctor có `process-containment`, `runtime-socket-dir`, `run-attempts-stuck`, `run-supervisor-route`, `gate-kill-grace`; setup tạo thư mục socket runtime 0700; `fgos run --json` và `dispatch inspect` ghi mức chứa và mức lock của attempt.
7. Full `npm test` xanh trên nhánh tích hợp với `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<binary build từ nhánh tích hợp>`; T8 cli (cA–cD) chạy lại cho kết quả ở P12; doctor xanh ở ba workspace sau landing.

## Rủi ro chính

| Rủi ro | Khả năng × tác động | Giảm thiểu |
|---|---|---|
| Viết lại đường launch `executeAssignment` (2797 dòng) làm vỡ dispatch cli | Cao × Cao | P09 một chủ; bằng chứng crash và full suite trước khi nộp; rollback revert P09 trả đường Node (route Rust còn nhưng không ai gọi là vô hại) |
| Máy không có user namespace (bwrap không chạy được) | TB × TB | Driver `linux-pgroup` best-effort, báo mức; test cả hai driver trên máy dev (`--unshare-user` bị chặn bằng sysctl trong test thì bỏ qua có tên, không giả xanh) |
| Rò description qua cây agent (Rust kế thừa fd ≥ 3, kongming F3) | TB × Cao | `spawn_with_fds` của 4.2 đóng mọi fd ngoài map; test rò bắt buộc (tiêu chí 4); `lock-holders` |
| Gate là pid 1 bỏ qua signal không có handler | Đã biết (M2) | Handler SIGTERM/SIGINT; test SIGTERM → dừng trong grace |
| Đồng thời chuyển writer và destructor của home lệch nhau (reaper cũ xoá home của attempt mới) | TB × Cao | Marker bản 2 chỉ đi qua adopt; test lịch `r3-reaper-migration` (Astra) ở P10; landing dọn hết home bản 1 bằng release cũ trước activate |
| Bước Node chạy với payload release đã deactivate | Thấp × TB | Envelope ghi `payloadRoot` của release đã chuẩn bị; release giữ nguyên trên đĩa sau deactivate (store bất biến); thiếu → bước trả lỗi có tên, adopt thử lại |
| Windows chưa chạy end-to-end tới 4.4b | Chắc × Thấp | D7; nói thẳng trong doctor và CHANGELOG |

## Rollback

Code + thư mục state mới (`runs/NN/attempt.lock`, `steps/`, socket runtime). Rollback: dừng toàn bộ, revert merge, activate release trước. Run tạo bởi 6.2 còn dở: release cũ không hiểu envelope v3 và sẽ coi chúng là `running/bound` (như T8 hôm nay); runbook rollback chạy `fgos internal adopt --scan` bằng release 6.2 **trước** khi deactivate để đưa mọi attempt về `closed`. Home bản 2 còn sót: release cũ bỏ qua marker `contract: 2` ([`cleanup.mjs:198`](../../src/runner/dispatch/confinement/cleanup.mjs) chỉ nhận v1) → giữ, không xoá nhầm; dọn tay theo danh sách doctor.

## Câu hỏi mở cho anh

1. **Đã chốt 2026-10-16:** giữ mặc định. (D6) Driver chứa Windows/macOS chuyển từ 4.4b sang 6.2 P02 theo brief. **Mặc định:** làm ở 6.2; 4.4b chỉ còn driver lock. Anh muốn giữ ở 4.4b thì P02 bỏ, 6.2 trên Windows/macOS báo `unsupported` cho cổng chứa.
2. **Đã chốt 2026-10-16:** giữ mặc định — cấu hình executor vẫn là nguồn duy nhất của argv. (D4) agent-protocol `direct` không dựng argv (argv vẫn từ cấu hình executor). **Mặc định:** như D4. Nếu anh muốn đúng chữ r6 §8 ("dựng argv/stdin"), cần chuyển cả binder ProviderAdapter sang Rust: thêm ~8 h và một phase riêng.
3. **Đã chốt 2026-10-16:** giữ mặc định 10 s. (D9) Khoá `dispatch.gateKillGraceMs` mặc định 10 s. **Mặc định:** 10 s (CLI agent thường cần vài giây để ghi phiên khi bị SIGTERM). Anh có số khác thì đổi một dòng.
