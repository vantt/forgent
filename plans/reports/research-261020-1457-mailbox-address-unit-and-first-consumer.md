# Mailbox: đơn vị giữ địa chỉ, bên dùng đầu tiên, và có nên nhắn thẳng subagent/teammate

Ngày 2026-10-20 14:57 (Asia/Saigon), máy `fg-server2` (`~/projects/forgent`). Chỉ đọc; không gọi model; không in hay chép khóa. Spec đang xét: `docs/platform/agent-mailbox/spec.md` (nháp, chưa ký).

## Tóm tắt

**Q1 (địa chỉ).** Hôm nay fgOS và các tool đã có khoảng 25 loại định danh (bảng mục 1). Không cái nào một mình đúng nghĩa "terminal + đầu CLI trong nó". Phát hiện đo được trên máy này, tác động thẳng tới thiết kế:
- `HERDR_PANE_ID` trong env **không** nói đầu nào đang đứng trong pane: hai process Claude (một interactive, một bản `--fork-session` chạy nền) cùng mang `HERDR_PANE_ID=w6:p2`; `agent_session.value` của herdr cho pane đó là id của bản nền, không phải của process thật đang giữ pane (mục 1.3).
- Id của herdr cho pane `w6:p4S` (pane của chính phiên này) hiện là `92b3b91e…`, là một phiên thăm dò nằm ở `mailbox-probe2/m3`, không phải đầu thật (`d50dc90b`). Cách ghép đúng phải đi qua process foreground của pane, không đi qua env hay `agent_session`.
- Id của người gửi (`fgos identity`) từ trong subagent trả về id của **đầu** (đo thật), nên "subagent không có địa chỉ riêng" khớp với cách danh tính hiện chạy.
- **Khuyến nghị khoá:** `(gốc project .fgos, writer id)` với writer id lấy từ cửa session-identity có sẵn; đầu CLI (pid, procStart, id hội thoại gốc) và pane (herdr session + pane id, hoặc tmux, hoặc tty) là **giá trị** của bản ghi, kèm một số thế hệ. Lý do và cái gì hỏng ở mục 1.4.

**Q2 (bên dùng đầu tiên).** 24 trao đổi thật có dẫn nguồn (mục 2.1). 14 là lane↔lane/máy↔máy: toàn bộ qua máy khác, người nhận không đang ở một lượt chờ, chịu được phút đến 10 giờ 47, và bảng chương trình + guide đã giao đủ (177 commit vào bảng trong 4 ngày). Lát đầu của mailbox (một máy, người nhận sống, vài giây) chỉ chạm được nhóm điều phối↔worker trong pane (4 loại), mà nhóm đó đã có cơ chế (file brief + ack, file cancel, `wait.sh` canh pid và đọc màn hình mỗi 90 s). **Bằng chứng không cho thấy một bên dùng mà bảng + file + Event Store (khi nối) chưa phục vụ.** Ứng viên yếu nhất-còn-đứng được: điều phối herdr ↔ worker Codex trong pane (mục 2.3). Không có trao đổi nào có agy làm bên nhận hay bên gửi.

**Q3 (nhắn thẳng subagent/teammate).** Khuyến nghị: **chỉ nhắn đầu** (phương án A). Cái gì cần được nhắn thì phải là đầu, và fgOS đã làm đúng như vậy: mọi worker do `fgos run` là một process CLI riêng (mục 3.2). Subagent chỉ có hook-vào-lúc-khởi-động (`SubagentStart`) đã thấy chạy trong chính phiên này; PostToolUse trong subagent theo tài liệu chính thức có chạy kèm `agent_id`, nhưng **chưa ai đo**. Cần từ agent đo Claude: 4 phép đo ở mục 3.5.

Việc cần chủ dự án quyết nằm ở cuối (mục 6).

---

## 1. Q1 — Các địa chỉ đang có

### 1.1 Bảng định danh

Cột "Con (hook, `fgos mailbox send`) học bằng cách nào": **env** = biến môi trường kế thừa; **verb** = `fgos identity`; **stdin** = payload hook. "Chưa đo" ghi rõ chỗ không có bằng chứng.

| # | Định danh | Ai cấp | Gọi tên gì | Sống bao lâu | Qua đóng pane / khởi động lại CLI / resume | Phạm vi duy nhất | Con học bằng cách nào |
|---|---|---|---|---|---|---|---|
| 1 | **Writer identity** `{id, source}` (`docs/platform/session-identity/spec.md:41-46`, `packages/session-identity/rust/src/resolve.rs:9-12`) | luật: env `FGOS_SESSION_ID` → `CODEX_THREAD_ID` → `CLAUDE_CODE_SESSION_ID`; không có thì **tổ tiên cao nhất có tty điều khiển** (`source: pid`); rồi session id; rồi pid | một process ghi; không phải xác thực (`spec:25`) | tuỳ nguồn (dòng 2, 13, 19, 12) | tuỳ nguồn | tuỳ nguồn | **verb** `fgos identity`; đo ở phiên này: trong subagent trả `{id: d50dc90b…, source: env}`; bỏ `CLAUDE_CODE_SESSION_ID` thì trả `{id: 2946410, source: pid}` = shell gốc của pane |
| 2 | `att-<attemptId>`; `attemptId` = `cmd_<ms>_<8 hex>` | bộ điều khiển (`src/runner/dispatch/assignment-runner.mjs:2069`), id ghi = hàm thuần `att-`+id (`packages/session-identity/rust/src/attempt.rs:9`, `contracts/attempt-writer-id.v1.json`) | **một attempt** = một lần khởi động một worker | tới settle; tên vẫn dùng được trong `.fgos/assignments/…/runs/NN` | pane đóng: attempt kết thúc `carrier-lost` (`docs/platform/terminal-control/spec.md:157`); CLI khởi động lại: không có (là attempt mới); `fgos run --resume`: **attempt mới, id mới** (`docs/platform/run-supervisor/spec.md:249`) | dự án (`.fgos`) trên thực tế toàn cục | **env** `FGOS_SESSION_ID` (claude, agy, pi, omp kế thừa; Codex chỉ qua `-c shell_environment_policy.set={FGOS_SESSION_ID=…}`, `assignment-runner.mjs:603-616`); `scrub_and_set` xoá 3 biến id khác (`launcher.rs:11,26-44`). **Người gửi biết trước khi worker khởi động** |
| 3 | `FGOS_PARENT_WRITER_ID` | gate/launcher (`packages/run-supervisor/rust/src/gate/unix.rs:546-549`) | writer id của bộ điều khiển đã ghi envelope | như #2 | như #2 | như #2 | env |
| 4 | Unit run id `unit-run-<ms>-<8 hex>` + `runs/NN` | `src/runner/execution/run.mjs:617` | một Unit; `runs/NN` là attempt thứ N của nó | tới khi Unit đóng | **qua `--resume`** (id Unit giữ, attempt đổi) | dự án | không có env; đọc từ thư mục `.fgos/assignments/<unitRunId>/` hoặc từ bộ điều khiển |
| 5 | Workflow run `wf-run-…`; `FGOS_CASE_ID`, `FGOS_CASE_RESERVATION` | Workflow (`src/runner/dispatch/adapters.mjs:91-92`) | một case/đặt chỗ | tới `case.closed` | n/a | dự án | env (chỉ tiêm lúc admission) |
| 6 | Khoá slot của terminal-control = attemptId (+ `groupKey`) → bản ghi `{pane_id, tab_id, driver, server_incarnation}` (`packages/terminal-control/rust/src/record.rs:14-25`, `docs/platform/terminal-control/spec.md:45,163`) | controller `allocate` | cặp attempt ↔ pane | tới `release`/adopt | pane đóng: bản ghi còn, pane `gone`; server herdr khởi động lại: incarnation đổi, bản ghi cũ vô hiệu (`spec:157`) | state root của máy | không (là bảng tra). Chỉ có cho pane do fgOS mở hoặc `attach` |
| 7 | **herdr pane id** `w6:p4S`, tab `w6:t1`, workspace `w6`; env `HERDR_PANE_ID/TAB_ID/WORKSPACE_ID`, `HERDR_SESSION`, `HERDR_SOCKET_PATH` | herdr, tự inject vào mọi pane (`docs/distillery/deep-dives/how-to-use-herdr.md:382,590`) | một pane trong **một server/session herdr** | tới khi pane đóng; "id đã đóng chết mãi mãi; pane chuyển workspace nhận id mới" (`how-to-use-herdr.md:56`) | pane đóng: mất. CLI khởi động lại trong pane: **giữ**. Server khởi động lại: pane chết theo pty (`terminal-control spec:157`); tái dùng id sau khởi động lại: **chưa đo** | trong một server herdr; worker chạy ở **session herdr riêng** (`src/runner/dispatch/worker-session.mjs:106-121` bỏ `HERDR_PANE_ID` của người gọi), nên phải kèm `HERDR_SESSION`/socket | env `HERDR_PANE_ID`. **Không tin được tuyệt đối:** (a) Codex chạy lệnh shell dưới daemon dùng chung thấy `HERDR_PANE_ID` cũ của pane đã đóng (`session-identity spec:73`); (b) process con bất kỳ (bản `--bg`, probe) thừa kế cùng giá trị (mục 1.3) |
| 8 | herdr `terminal_id` `term_…` | herdr | một terminal (pty) | tới khi pty đóng | **chưa đo** nếu đổi qua pane move; herdr có `terminal attach <terminal_id>` (`how-to-use-herdr.md:192`) → ứng viên khoá terminal ổn định hơn pane id | server herdr | `herdr pane get`, không có env |
| 9 | herdr `agent_session {agent, kind, source, value}` | hook tích hợp của herdr (`herdr:claude`) báo; `value` = session id của CLI (`packages/terminal-control/rust/src/driver/herdr.rs:141`; `src/runner/dispatch/visibility-session.mjs:167` đã dùng để ghép) | "agent đang đứng trong pane" | **ghi đè bởi người báo cuối** | đo ở mục 1.3: sai ở 2 pane trên 7 | pane | `herdr agent list` |
| 10 | Trường khác của `herdr agent list` (đo): `agent`, `agent_status`, `completion_seq`, `state_change_seq`, `revision`, `focused`, `cwd`, `foreground_cwd`, `terminal_title(_stripped)` | herdr | trạng thái | live | — | pane | `herdr agent list --json`; `*_seq` cho receipt "đã chuyển sang working sau khi nhắn" (**chưa đo** có dùng được) |
| 11 | **Tích hợp hook của herdr** (độ phủ đo ở máy này, `herdr integration status`) | — | — | — | — | — | omp: current; claude: outdated v10<v11; codex: outdated v8<v10; pi: chưa cài; antigravity (agy): chưa cài → `agent_session` của agy/pi luôn trống ở máy này |
| 12 | tty / **pid gốc của pane** (`source: pid`) | kernel; đi qua `ProcessTree` (`resolve.rs:tree_identity`) | **terminal**, không phải đầu | tới khi shell gốc thoát | pane đóng: mất, pid có thể tái dùng (`session-identity spec:82`); CLI khởi động lại trong pane: **giữ nguyên** (đây là điểm lệch với "đầu"); terminal/IDE không tạo session mới chia chung id (`spec:75`) | máy + pid namespace | verb/env-free. Trong sandbox bwrap (`--as-pid-1`) cây chỉ nhìn thấy trong namespace, nên fgOS worker phải dựa env, không dựa cây |
| 13 | **Claude `session_id`** (UUID), env `CLAUDE_CODE_SESSION_ID`, stdin hook | Claude Code | một hội thoại | file transcript `~/.claude/projects/<proj>/<id>.jsonl` còn lâu | pane đóng: id còn, process mất; `--resume` **dùng lại id**, `--fork-session` **cấp id mới** (`claude --help`: "When resuming, create a new session ID instead of reusing the original"); `--bg --resume`: cùng id hoặc bản sao nếu đang chạy. `--session-id <uuid>` cho **người khởi động chọn id trước** (fgOS hiện không dùng, `rg` rỗng). Id qua `/clear`, nén: **chưa đo** (agent khác đo) | UUID, toàn cục | env (đo: có trong Bash của subagent, **là id của đầu**), stdin hook (tài liệu chính thức: `session_id` là trường chung); env trong hook: **chưa đo** |
| 14 | Claude **pid + procStart + file đăng ký** `~/.claude/sessions/<pid>.json` {pid, sessionId, cwd, procStart, kind, status, name, tmux, messagingSocketPath, version, pidDomain, updatedAt} (đọc ở máy này) | Claude Code | một process | tới khi process thoát; file bị xoá lúc thoát (đo: `116391.json` có lúc đầu phiên, mất sau ~10 phút khi probe tắt) | pane đóng: mất; resume: process mới, pid mới | pid + procStart (chống tái dùng) | env `CLAUDE_PID`; tên socket là `<pid>.sock`. `status` (`idle/busy/shell`) cho **presence miễn phí** |
| 15 | Claude socket + token: `CLAUDE_CODE_MESSAGING_SOCKET`, `CLAUDE_CODE_MESSAGING_TOKEN` | Claude Code | hộp thư của **session** | như #14 | như #14 | máy, user OS | env (tài liệu: xuất cho hook và Bash trước cả `SessionStart`); `-p` cũng bind socket, trừ `--bare` (`cross-session-messaging`) |
| 16 | Tên phiên Claude `name` (`forgent-e3`, `nameSource: derived`), `-n`, `/rename` | Claude hoặc người | **hiển thị** | tuỳ | resume giữ tên | **không duy nhất** (tài liệu: nhiều phiên cùng tên thì thêm mã ngắn) | file #14 |
| 17 | Phiên nền Claude (`claude --bg`, `claude agents`, `jobId`, id ngắn) | Claude | một phiên đầy đủ chạy nền, có thể `attach` | tới `stop`/`rm`; `stop` giữ hội thoại | resume dùng lại id | máy | `claude agents --json` (`--all` gồm đã xong) |
| 18 | Subagent `agent_id`, tên khi spawn, teammate `name@team` | Claude | **bên trong một phiên** | tới hết lượt/`stop`; transcript ở `…/<sessionId>/subagents/agent-<id>.jsonl` | **không sống qua resume** (teammate in-process: tài liệu chính thức; subagent: chỉ transcript) | trong phiên (teammate: trong team) | payload hook có `agent_id`, `agent_type` (tài liệu chính thức, **chưa đo ở đây**) |
| 19 | **Codex thread id** `CODEX_THREAD_ID`, payload hook `session_id`; `codex queue --thread <UUID hoặc tên>` | Codex | một thread | còn qua process | process chết: thread còn (`codex resume`); fgOS chạy `--no-daemon` cho `codex-herdr` (`.fgos/config.json:965`) nên **không** nằm trong daemon dùng chung | UUID | env: lệnh shell thấy `CODEX_THREAD_ID` kể cả dưới daemon (`session-identity spec:73`); spec mailbox §5.1 nói "chỉ từ payload hook" — **lệch** với dòng này |
| 20 | pi `--session-id`/`--session <path\|id>`; omp `-r <id prefix>`, chuỗi `PI_SESSION_FILE` có trong binary; agy `--conversation <id>` | từng CLI | một phiên/hội thoại | còn file phiên | resume theo id | project | **chưa đo** biến nào thật sự xuất cho lệnh con. pi, omp: chưa tìm thấy env id trong help; agy: chỉ thấy `ANTIGRAVITY_LS_ADDRESS` (địa chỉ language server), không có id hội thoại trong env (chỉ chuỗi trong binary) |
| 21 | **Nhãn trên bảng**: `forgentx-95`, `ac420727`, `d50dc90b` | người/agent tự ghi | tên phiên hoặc **8 ký tự đầu** của session id Claude | do người giữ | **lệch sau fork**: `ac420727` (interactive, pid 2378307, pane `w6:p2`) và `e1505f04` (bản `--bg --fork-session` từ transcript đó, pid 2483467) cùng một dòng dõi; shard Observe (`.fgos/observe/friction/e1505f04-….jsonl`) và dấu heartbeat của ak mang `e1505f04`, bảng mang `ac420727` | không duy nhất | không (không có cửa tra) |
| 22 | Dấu heartbeat của ak: `~/.agentkit/state/session-heartbeats/<sha256(realpath cwd)[:16]>/<session>.json` `{cwd, session_id, runtime, updated_at}` (`.claude/hooks/session-heartbeat.cjs`) | hook của bộ ak (SessionStart/UserPromptSubmit/Stop; xoá ở SessionEnd; hết hạn 6 giờ) | phiên sống theo project | xem file | — | project×phiên | **không thuộc fgOS** (bộ ak): chỉ là prior art, không dùng làm nguồn thẩm quyền |
| 23 | `fgos session` id trong `.fgos/sessions.json` | `src/runner/session.mjs:43` | **worktree** của một work item, không phải phiên CLI | tới `endSession` | — | clone | **trùng chữ "session"**; `resolve.rs:registry_confirms` chỉ dùng để gắn `source: registry`. Máy này chưa có file |
| 24 | `fgos.machineId` / `<stateRoot>/machine-id` | Event Store (`docs/platform/event-store/spec.md:154`), setup mint | **máy** (tên ref `refs/fgos/events/<machine-id>`) | vĩnh viễn trên máy | — | máy (hai clone cùng máy dùng chung mặc định, `spec:446`) | `packages/event-store/rust/src/identity.rs:28`. **Chưa tồn tại ở máy này** (đã kiểm: không có `~/.local/state/fgos/machine-id`, `git config fgos.machineId` rỗng) |
| 25 | Event Store `storeId` (`<eventOpenRoot>/store.json`) | Event Store, lần append đầu | **một clone** (`spec:155,159`) | theo clone, chuyển clone là chuyển file | — | clone | không phải khoá phiên; chỉ có thể làm thành phần "project" của khoá. Kho đang ngủ ở máy này |

### 1.2 Kiểm trên source (không chỉ docs)

- Thứ tự env và regex id: `resolve.rs:9-12,63-72`; luật cây "tổ tiên cao nhất có tty": `resolve.rs:tree_identity`. Đo thật bằng `fgos identity` (mục 1.1 dòng 1).
- Launcher: `launcher.rs:11` (`SCRUBBED`), `direct-launch.mjs:153-157` (`identityEnv`), `gate/unix.rs:546-549`. `workerBaseEnv` (`adapters.mjs:112-137`) không cho worker kế thừa id của cha.
- Mọi worker `fgos run` là CLI riêng: `assignment-runner.mjs:2259-2265` và `:2323` (`launchMode: terminalMode ? 'terminal' : 'direct'`); `docs/platform/run-supervisor/spec.md:1,138-146`.
- Phát hiện từ `.fgos/config.json`: hai kiểu worker. `cli-spawn` (headless `claude -p`, `codex exec`, `pi -p`, `omp -p`; **không có pane/tty**) và `herdr-spawn` (pane thật). Spec mailbox gắn địa chỉ với "terminal + đầu"; worker headless không có terminal. Với chúng, khoá `att-…` vẫn dùng được (env), còn `Nudge` kiểu gõ thì không. Spec cần nói rõ lát đầu có phủ worker headless hay không.

### 1.3 Đo ở máy này: pane và env không nói đúng "đầu"

Đọc `herdr pane list`, `herdr pane process-info`, `~/.claude/sessions/<pid>.json`, `ps`, và **chỉ** hai khoá không bí mật trong `/proc/<pid>/environ`.

| Pane (herdr) | Process foreground thật (`pane process-info` + `ps`) | `sessionId` trong file đăng ký Claude | `agent_session.value` herdr báo |
|---|---|---|---|
| `w6:p2` | pid 2378307 `claude --resume ac420727-…` | `ac420727` | **`e1505f04`** |
| `w6:p4S` | pid 2946677 (`claude`, phiên này) | `d50dc90b` | **`92b3b91e`** |

- `e1505f04` là pid 2483467, `kind: bg`, cmdline `--session-id e1505f04-… --fork-session --resume …/ac420727-….jsonl`; `HERDR_PANE_ID=w6:p2` có trong environ của **cả hai** pid 2378307 và 2483467.
- `92b3b91e` có transcript ở thư mục project `…-mailbox-probe2-m3`: một phiên thăm dò của agent đo Claude, không phải đầu của pane `w6:p4S`.
- Cơ chế (suy luận, **chưa đo**): process con khởi động từ pane thừa kế `HERDR_PANE_ID` và `HERDR_SOCKET_PATH`, hook herdr của nó tự báo `agent_session` cho pane đó; người báo cuối thắng.
- Hệ quả: **không dùng env `HERDR_PANE_ID` hay `agent_session` để quyết "đầu nào trong pane"**. Cách đúng đã có đủ mảnh: `herdr pane process-info` → pid foreground → `~/.claude/sessions/<pid>.json` (Claude). Cho Codex, agy, pi, omp chưa có mảnh tương đương (chưa đo).
- Tác dụng phụ cho agent đo: các probe của nó đang làm bẩn `agent_session` của pane `w6:p4S` trong herdr. Ghi ở đây để họ không hiểu nhầm trạng thái pane.
- Cũng đo: hai bản Claude đang chạy ở hai phiên bản (2.1.301, 2.1.302) trong khi binary cài là 2.1.304 (`spec §7` đo trên 2.1.303). `tested_against` theo phiên bản cài sẽ sai ngay; phải kiểm phiên bản **của process đích** (`version` có trong file #14).

### 1.4 Chọn khoá của registry (spec mục 5.1) và cái gì hỏng

| Chọn làm khoá | Dùng được khi | Hỏng ở đâu |
|---|---|---|
| **A. Writer identity** (dòng 1) | cả người gửi lẫn người nhận suy ra cùng một giá trị bằng cùng một hàm; worker do fgOS khởi động có `att-…` **biết trước**; một cửa duy nhất (L10) | (1) nguồn `pid` đặt tên **terminal**, không phải đầu: khởi động lại CLI trong cùng pane giữ khoá, nên tin cũ lọt vào đầu mới, vi phạm luật "người kế vị chỉ nhận tin ghi sau khi nhận tên". (2) env rò: process khởi động từ shell Codex mang `CODEX_THREAD_ID` và thắng `CLAUDE_CODE_SESSION_ID` (`session-identity spec:80`), nên Claude con có thể bị gọi là Codex. (3) Claude `--fork-session` đổi khoá. (4) agy, pi, omp tay: chỉ còn pid gốc pane. (5) subagent dùng chung id đầu (đúng ý, vì không địa chỉ riêng) |
| **B. herdr pane id** (dòng 7) | pane trong herdr | không phủ tmux, tty trần, worker headless; id chỉ duy nhất trong một server/session herdr (cần kèm `HERDR_SESSION`); env sai theo mục 1.3 và theo Codex daemon; pane chuyển workspace đổi id; mailbox trở thành phụ thuộc herdr (spec bảo core không biết tên tool) |
| **C. Id hội thoại của CLI** (13, 19, 20) | resume, về sau là phiên bền (§15.5) | agy, pi, omp chưa có đường học id từ lệnh con; fork đổi id; hai process cùng một id (`--bg --resume` tạo bản sao) cùng nhận tin; không biết trước khi khởi động trừ khi tự truyền `--session-id` (Claude, pi) |
| **D. `att-` / unit run id** (2, 4) | worker của fgOS | không có cho phiên của chủ dự án; `--resume` đổi attempt id (id Unit giữ, có thể là khoá "công việc" thay vì "process") |
| **E. Claude pid + socket** (14, 15) | chỉ Claude | chỉ Claude; pid tái dùng (đã có `procStart`) |
| **F. Tên/nhãn bảng** (16, 21) | để người gõ `--to` | không duy nhất; lệch sau fork; không phải khoá (spec đã nói) |
| **G. machine id / store id** (24, 25) | thành phần "project" hoặc "máy" về sau | machine id chưa tồn tại ở máy này; không phải định danh phiên |

**Khuyến nghị (xếp hạng):**
1. Khoá = `(gốc .fgos của project, writer id)`; giá trị bản ghi = `{cli, pid, procStart, version, idHộiThoạiGốc, pane {driver, herdrSession, paneId | tmux | tty}, thếHệ, tier}`. Lý do: một cửa có sẵn, người gửi biết trước `att-…`, `from` và khoá nhận cùng nguồn. Bù ba điểm hỏng bằng giá trị chứ không bằng khoá: `thếHệ = (pid, procStart)` do hook đăng ký ở `SessionStart` hoặc lần drain đầu; đầu mới ở cùng pane = thế hệ mới (tin cũ không chảy sang).
2. Với CLI mà writer id rơi về pid gốc pane (agy, pi, omp chạy tay), chấp nhận khoá = terminal và ghi `tier: pull` trừ khi tìm ra id hội thoại thật.
3. Không dùng B, E, F làm khoá; B và E chỉ là phần của giá trị.
4. Quyết thêm: lát đầu có phủ worker headless `cli-spawn` hay chỉ pane (mục 1.2).

Dependency chưa đo: env trong tiến trình hook của Claude (trùng `CLAUDE_CODE_SESSION_ID` với Bash hay chỉ có payload); hook Codex dưới daemon thấy `CODEX_THREAD_ID` hay `FGOS_SESSION_ID`; `terminal_id` có bền qua pane move không.

---

## 2. Q2 — Bên dùng đầu tiên

### 2.1 Kiểm kê 24 trao đổi thật

Số dòng là của `plans/261017-1313-fgos-platform-program-board/plan.md` (gọi tắt "bảng"). "Máy" lấy theo nhãn của bảng (`forgentx-*` = máy owner, `ac420727` = máy thứ hai); tôi không xác nhận được máy vật lý (mục 5). Cỡ là ước lượng từ chữ trên dòng.

| # | Trao đổi (nguồn) | Gửi → nhận | Cỡ | Cần tới trong | Nhận đang sống? | Qua máy? | Khi lỡ |
|---|---|---|---|---|---|---|---|
| 1 | Git 07 u5 chuyển `worktree.mjs`; xin COOK P4 đừng sửa phần git (bảng:129) → được tuân thủ (bảng:125) | lane GIT → lane COOK | ~100 từ | giờ (trước khi lead COOK sửa file) | big lead sống, lead COOK đang chạy trong worktree riêng | có | xung đột merge trên file chung (luật bảng:99). Trả lời: 1 giờ 30 |
| 2 | "bọc verify bằng `runBorrowed`" (bảng:203) → đáp (bảng:199) | ac420727 → forgentx-95 | 3 dòng | giờ | có | có | controller chết mà verify còn ghi sau khi nhả lease. Trả lời: 6 giờ |
| 3 | test `reused inode` đỏ trên main, nhờ lane GIT xem (bảng:179) → đáp (bảng:175) | forgentx-95 → ac420727 | 5 dòng | giờ | có | có | test đỏ kéo dài. Trả lời: 2 giờ 15 |
| 4 | hai câu hỏi sau land Git 04 (bảng:166) → đáp (bảng:161) | forgentx-95 → ac420727 | ~10 dòng | giờ | có | có | `git-worktree-recovery` fail kéo dài. Trả lời: 4 giờ 04 |
| 5 | "land Git 01 nhớ kèm 6.4" (bảng:216) → làm (bảng:194,198) | forgentx-95 → lane GIT | 3 dòng | tới lần land kế | không (chờ lần land) | có | `adopt` không có đường lùi khi `hostBin` đã xoá. Làm: 9 giờ 14 |
| 6 | hướng dẫn bước 0 xoá cả worktree đang đăng ký (bảng:144) → sửa (bảng:140) | forgentx-95 → ac420727 | ~8 dòng | giờ | có | có | **đã xoá 3 worktree** `/tmp/fgos-wf-wt-*` (commit còn). Sửa: 58 phút |
| 7 | "máy khác gỡ hook nạp bí mật" (bảng:126) → ghi nhận (bảng:123) | d50dc90b → các máy | 5 bước + guide | phút–giờ | có | có | khoá còn xuất vào môi trường worker (phát hiện X1). Ack: 5 phút |
| 8 | "máy thứ hai thêm `llmAccounts.openrouter` trước khi kéo config" (bảng:130) | forgentx-95 → máy thứ hai | 2 dòng | trước khi kéo | không rõ | có | `pool-unusable` cho deepseek/glm (chính dòng nói). Không thấy ack |
| 9 | owner: "foundation trước, Work sau; dừng ES 09 unit 9; Git 07 bỏ chờ ES" (bảng:133) | owner → ac420727 (gõ trực tiếp) | ~100 từ | giây–phút | có | không | lead phải dừng; phần dở park `03c5186c7`. Hiệu lực: 2 phút |
| 10 | brief ngân sách Land → owner chọn phương án 1 (bảng:147) | ac420727 → owner → ac420727 | brief 1 file | phút–giờ (owner vắng) | owner: không | không | lane chờ. 2 giờ 02 |
| 11 | brief quyết định qua đêm → owner đồng ý cả hai (bảng:200) | ac420727 → owner | brief 1 file | tới sáng | owner: không | không | lane dừng chờ. 2 giờ 40 |
| 12 | năm câu AGENT-WF → "ok" (bảng:187, 186, 185) | forgentx-95 → owner | 5 câu | phút | có | không | hội đồng chờ. 15 phút |
| 13 | worker hội đồng gặp hộp thoại tin cậy thư mục, run chết (bảng:210, 207, 200) | worker → (qua run) → owner | một mã `terminal:blocked:trust-dialog` | phút | owner: không | không | **3 lượt hội đồng hỏng; owner xử lý sau ≥ 7 giờ** (23:55 → còn chờ lúc 06:50) |
| 14 | lead Codex hỏi trong pane, điều phối đọc màn hình rồi gõ `shift+left`, `send-text`, `enter` (`handoff-261019-1701…:33`; `wait.sh` canh pid và đọc màn hình mỗi 90 s) | lead Codex → big lead (hỏi); big lead → lead (đáp) | 1 câu | giây | có (đang chờ) | không | lead đứng chờ tới lần quét kế (≤ 90 s) hoặc tới khi có người thấy |
| 15 | lead xong → "nhắn big lead khi xong hoặc khi bị chặn" (bảng:119; `handoff-261018-2238…:17` "each notifies when done"); 189 file `phase-lead-*` + 23 `landing-*` (đếm theo tên file, trong ~4 ngày) | lead → big lead | báo cáo + 1 dòng | giây–phút | có (chờ tác vụ nền) | không | không ghi lần lỡ nào |
| 16 | brief cho worker: file `brief-N.md` + dòng gõ + `ack-N.json`, gửi lại có trần, lỗi thì `delivery-unknown`, không gửi mù (`docs/platform/run-supervisor/spec.md:145,154`) | runner → worker | brief | giây | có | không | pane giữ, kết cục có tên. **Đã chạy mọi attempt** |
| 17 | huỷ: `cancel-requested.json` đọc mỗi tick 50 ms (`run-supervisor spec:69,103,237`) | controller → supervisor | cờ | giây | có | không | `cancelWaitMs`. **Đã chạy** |
| 18 | trả lời cổng người của một Workflow run: file `gate-answers/` rồi `advance`/`resume` (`docs/specs/workflow.md:195,351`; `docs/routing-handoff-contract.md:80-81`) | owner → run | câu trả lời | giờ–ngày | **không** (run đang park) | không | run vẫn park, không mất. **Đã chạy** |
| 19 | "đổi cửa này thì báo `forgentx-5f`" (bảng:197) | lane DOC → lane GIT (qua big lead) | 3 dòng | tới khi đổi | không rõ | có | va chạm Phase 8 Step 6b. Không ghi kết quả |
| 20 | số D-ADR cấp cho lane (bảng:224, 219, 218): đính chính hai lần trong vài phút | big lead → lane GIT/ES | 1 dòng | giây | có | có | số quyết định lệch phải sửa (đã sửa 2 lần). **Là bài toán đặt chỗ, không phải bài toán giao tin** |
| 21 | lệnh dọn identity `Test` cho máy owner (bảng:170, 173): owner đã làm 11 phút trước khi dòng này được ghi | ac420727 → owner | 6 lệnh | phút | owner: có | có | dòng trên bảng đến **sau** kênh trực tiếp |
| 22 | ES 09 báo "lane nào sửa các file này xin ghi lên bảng" (bảng:145) | ES → mọi lane | 1 câu | phút | không rõ | có | không có ack; spec cấm agent nhắn nhóm |
| 23 | 12 `guide-*` + 23 `landing-*` (vd `guide-261020-0901-owner-machine-git-06-landing.md`) | máy này → máy kia | 10–60 dòng | giờ | không (đọc ở phiên sau; luật "pull và đọc bảng trước" nằm ở bộ nhớ của người) | có | máy kia land sai thứ tự; chưa ghi lần lỡ thật |
| 24 | "máy owner: chờ owner báo giờ" (bảng:176, 162, 146): Git 04 guide 15:39 → land 18:41 (3 giờ 02); Git 05 guide 22:25 → land 09:12 hôm sau (10 giờ 47) | máy thứ hai → owner | guide | giờ | owner: không | có | lane ngủ; không mất |

### 2.2 Gom theo loại

| Loại | Số dòng | Qua máy | Chịu được | Đã có gì phục vụ |
|---|---|---|---|---|
| Lane↔lane / máy↔máy (1–8, 19–24) | 14 | **14/14** | phút đến 10 giờ 47; đo thật 5 phút–10 giờ 47 | bảng trong git (177 commit trong 4 ngày: 36, 43, 60, 38 mỗi ngày), guide, landing |
| Owner ↔ phiên/lane (9–12, 24) | 5 | không (trừ 24) | giây đến 2 giờ 40, quyết bởi lúc owner có mặt | owner gõ thẳng vào phiên; brief/guide dạng file khi vắng; `decision-question` |
| Điều phối ↔ worker trong pane, một máy (14–17) | 4 | 0 | giây | file + ack + cancel (16, 17: đã chạy); canh pid + đọc màn hình 90 s (14, 15) |
| Chờ trả lời lúc người vắng (13, 18) | 2 | 0 | giờ–ngày | 18: file + resume (đã chạy); 13: **chưa có**, nhưng là báo "bị chặn" gửi người, không phải tin giữa hai phiên |
| Đặt chỗ nhất quán (20) | 1 | có | giây | không phải giao tin |

Đếm theo số loại, nhóm duy nhất nằm trong phạm vi lát đầu (một máy, người nhận sống, vài giây) là nhóm điều phối ↔ worker (4 dòng), và 2 trong 4 đã được cơ chế riêng phục vụ ở mức "đã chạy". 14 dòng lane↔lane đều nằm ngoài lát đầu (qua máy). Không dòng nào có agy; chỉ dòng 14 có bên nhận không phải Claude (Codex).

### 2.3 Xếp hạng ứng viên bên dùng đầu tiên

| Hạng | Ứng viên | Số trao đổi | Cần từ mailbox | Phủ bởi lát đầu? | Nhận xét thẳng |
|---|---|---|---|---|---|
| 1 | Điều phối herdr đánh thức/trả lời worker trong pane | 14, 15 (+16, 17 đã có) | đánh thức, receipt; không ack, không qua máy | **có** | Bằng chứng yếu: 1 công thức gõ phím ghi trong bàn giao và 1 script canh (≤ 90 s). Dòng 14 còn **đi qua hộp thoại câu hỏi** của Codex (trạng thái `blocked`), nơi spec cấm gõ (typed-signal quy tắc 2) và nơi hook không chạy: mailbox không phục vụ được đúng ca này. Dòng 15 đã có thông báo "tác vụ nền kết thúc" gốc của Claude Code. Giá trị thật chỉ là: thay công thức gõ phím bằng một tin có nhãn |
| 2 | Lane giao nhau | 1–8, 19–24 (14) | giao tin liên máy, nhận ở phiên sau, bền | **không** (lát đầu bỏ cả liên máy và phiên bền, §15.2, §15.5) | Đây là nhu cầu đông nhất và có thật, nhưng bảng + Event Store (đồng bộ 300 s, §15.2) hợp với nó hơn; chu kỳ 300 s đủ cho cả 14 dòng ở mức "giờ"; dòng 7 (ack sau 5 phút) sát biên |
| 3 | Owner chạm lane | 9–12, 24 | không gì | không cần | owner gõ trực tiếp; brief khi vắng. Không có khoảng trống |
| 4 | Runner lái phiên đang chạy (steer) | **0** | chèn ở ranh giới round | chưa | §15.4 nói "ứng viên hẹp nhất có bên dùng", nhưng bảng và các bàn giao không có ví dụ steer nào; chỉ có huỷ (đã có file) |
| 5 | Báo "bị chặn" gửi người (dòng 13) | 1 | thông báo cho người | không | thuộc luồng TRUST/`decision-question`; worker thậm chí chưa chạy lượt nào nên không có hook để gửi |

**Kết luận thẳng:** trên bằng chứng này, **không có bên dùng cho lát đầu mà bảng, file và runner chưa phục vụ**. Nếu vẫn xây, hạng 1 là ứng viên duy nhất nằm đúng phạm vi, với lợi ích nhỏ. Hạng 2 là nhu cầu lớn nhưng thuộc phần §15.2, nên "đặt tên một bên dùng" của spec §16 câu 3 nên được hiểu là: chọn **hạng 1 làm bài kiểm nhỏ** hoặc **bắt đầu từ §15.2** (và khi đó giao tin giữa lane qua Event Store, không qua hook). Một điểm cộng độc lập: ba phiên Claude của owner trên project này (`forgent-2b`, `forgent-0f`, `forgent-e3`) đều bỏ qua prompt quyền = cùng lớp, nên `SendMessage` gốc của Claude giao ngay (probe phép đo 4, K1). Giá trị riêng của mailbox so với kênh gốc chỉ nằm ở người nhận không phải Claude (Codex, agy) và người gửi không phải phiên (runner, `fgos` CLI): trong kiểm kê chỉ có dòng 14 (Codex) khớp.

---

## 3. Q3 — Có nên nhắn thẳng subagent và teammate?

### 3.1 Từng CLI (help của CLI, tài liệu chính thức, nghiên cứu cũ)

| CLI | Có subagent/teammate? | Gọi tên thế nào | Kênh từ bên ngoài tới | Sống bao lâu | Nguồn, độ chắc |
|---|---|---|---|---|---|
| Claude Code 2.1.304 | **Subagent** (công cụ Agent/Task, trong phiên); **teammate** (thử nghiệm, cần `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`: in-process hoặc từng pane tmux là phiên riêng); **phiên nền** `claude --bg` (đầu đầy đủ, không phải subagent) | subagent: `name` khi spawn hoặc `agent_id`, dùng làm `to` của `SendMessage`; teammate: tên trong team, hộp thư file `~/.claude/teams/{team}/inboxes/{name}.json` | **Không có kênh ngoài tới subagent** trong tài liệu: socket của phiên chỉ tới phiên; `notify_when_idle` "từ chối cả lời gọi" nếu đích là teammate, subagent. Tin ra của subagent mang địa chỉ phiên cha (nghiên cứu 261015 mục 4.1; ở đây đo: `fgos identity` trong subagent trả id của đầu) | subagent: trong phiên, transcript còn qua resume nhưng process không; teammate in-process: **không** khôi phục sau `/resume`; teammate tmux và phiên `--bg`: là phiên riêng | tài liệu chính thức `sub-agents`, `agent-teams`, `cross-session-messaging` (đọc hôm nay, chắc); `claude --help` (chắc); mô tả hành vi runtime: **chưa đo** |
| Codex 0.162.1 | Có subagent (thread sinh ra; `/subagents` để chuyển; điều khiển qua chat cha; `agents.max_concurrent_threads_per_session`) | trang chính thức: "không ghi id thread"; tên cho agent tuỳ biến | `codex queue --thread <UUID hoặc tên>` ("Queue a message for an existing session"); `codex agents` liệt kê phiên trên **daemon dùng chung**. Có thể queue thẳng vào thread con hay không: **chưa đo**. fgOS chạy `codex-herdr` với `--no-daemon` (`.fgos/config.json:965`), nên có thể `queue` không tới được worker của runner: **chưa đo**, suy từ help ("Run without the shared background server") | thread bền theo file; con: không tài liệu | help (chắc cho lệnh), docs `subagents` (trung bình), nghiên cứu 261015 mục 3.3/4.2 (đọc source Codex, trung bình) |
| pi 1.3.0 | **Không có** trong help; hệ sinh thái bên thứ ba có extension subagent | — | `--mode rpc`, `--session-id <id>` (người khởi động chọn id trước); không thấy kênh vào phiên đang chạy ngoài extension | file phiên | help (chắc về cái có trong help); không có tài liệu chính thức nào khác được đọc |
| omp 18.11.2 | **Có**: công cụ `task` "Launch sub-agents for parallel tasks", agent đi kèm (`omp agents unpack`); `--restore` "tiếp tục … và các subagent nó đang chạy"; `anonymize` nhắc "a session and its subagents" | **chưa rõ** (không có tài liệu chính thức tìm thấy) | `--mode rpc/rpc-ui`, `omp acp`; kênh vào phiên đang chạy: chỉ extension (probe) | subagent lưu cùng phiên (suy từ `anonymize`, `--restore`) | help (chắc), phần còn lại chưa tìm được nguồn chính thức |
| agy 1.4.2 | **Chưa biết**. help chỉ có `--agent`, `agent/agents` ("List available agents" = tên persona) | — | không kênh nào ngoài gõ phím (probe); `--remote-control` là daemon đăng ký với dịch vụ ngoài, không dùng (probe K2) | — | help (chắc), chưa đo |

### 3.2 fgOS tự tạo worker thế nào (source)

- `fgos run` và `fgos workflow` bind qua `bind()`, rồi mỗi attempt là **một process CLI riêng**: chế độ `terminal` (một pane herdr, gate là cha của CLI: `docs/platform/run-supervisor/spec.md:138-146`) hoặc `direct` (headless, một gate, một supervisor Rust mỗi attempt). `assignment-runner.mjs:2323`: `launchMode: terminalMode ? 'terminal' : 'direct'`. Cả hai là **đầu**, không phải subagent.
- Subagent chỉ xuất hiện khi chính big lead dùng công cụ Agent ("in-session agent", bảng:170; handoff). Hook `PreToolUse` trên Agent/Task chạy `fgos hook dispatch-decide` và chặn mọi kết quả khác `in-process` (`AGENTS.md:173`; `.claude/settings.json` có `PreToolUse Agent|Task`). Kết quả của subagent về lại phiên cha; không có trao đổi nào trong kiểm kê (24 dòng) nhắm vào một subagent.
- Đã quan sát ở phiên này: hook `SubagentStart` chạy và nhét ngữ cảnh vào chính subagent này (ở đầu prompt); đó là một kênh vào subagent, **một lần lúc khởi động**.

### 3.3 Phương án

| | A. Chỉ đầu (đã đồng ý tạm) | B. Đầu chuyển tiếp cho subagent | C. Nhắn thẳng subagent |
|---|---|---|---|
| Làm gì | tin tới đầu; đầu tự quyết | khung tin dặn "nếu thấy hợp, `SendMessage` cho subagent X"; đầu dùng công cụ gốc | địa chỉ có thành phần subagent; hook trong subagent xả hộp thư |
| Code mailbox | 0 | 0 (chỉ chữ trong khung và trong `peer-input.md`) | địa chỉ mới, đăng ký subagent sống từ `SubagentStart/Stop`, thế hệ, xả trong ngữ cảnh subagent, đánh thức subagent nghỉ (không có process) |
| Chi phí | thấp nhất | thấp; dựa vào model làm theo | cao; mỗi CLI một cơ chế, chỉ Claude có manh mối |
| Phụ thuộc **chưa đo** | khi đầu đang chờ một lệnh Agent ở foreground thì checkpoint kế tiếp của đầu là sau khi subagent trả (độ trễ = thời gian subagent) | `SendMessage` có mặt (bị chặn nếu có deny rule; chỉ Claude); subagent tên gọi còn sống đúng lúc; Codex: điều khiển qua chat cha | PostToolUse trong subagent: tài liệu nói có chạy kèm `agent_id`, **chưa đo ở đây**; `additionalContext` có được tiêm vào ngữ cảnh subagent không; id subagent có ổn định để làm khoá |
| Bên dùng trong bằng chứng | 24/24 trao đổi đều đi được | 0 | 0 |
| Rủi ro | subagent không nhận tin giữa chừng | chuyển tiếp là nhờ vả model; tin đi hai bước, mất nhãn "không phải người dùng" nếu đầu viết lại | tăng bề mặt injection; lớp quyền của subagent không tách |

### 3.4 Khuyến nghị (một lựa chọn)

**A, kèm một luật vận hành: việc nào cần được nhắn tới thì khởi động như một đầu bằng `fgos run`.** fgOS đã làm vậy cho mọi worker (mục 3.2): có terminal, có `att-…` biết trước, có thể đặt `--session-id` (Claude, pi) nếu cần. Không xây B (không có code, để model tự dùng `SendMessage` nếu muốn) và hoãn C tới khi có (i) bên dùng thật, (ii) bốn phép đo ở dưới. Phù hợp spec §15.6 ("revisit trigger: một CLI lộ hook hoặc kênh tới một subagent"); điều kiện kích hoạt cập nhật: tài liệu chính thức đã nói PostToolUse trong subagent có chạy kèm `agent_id` (§15.6 coi là câu hỏi mở), nhưng chưa có bên dùng.

### 3.5 Cần từ agent đang đo Claude (không làm trùng)

1. Payload và env của hook `PostToolUse` và `Stop` **bên trong một subagent**: có `agent_id`, `agent_type` không; `session_id` là của đầu hay của subagent; hook có in được `additionalContext` vào ngữ cảnh subagent không.
2. Đầu đang chờ một lệnh Agent foreground: hook của đầu có chạy trong lúc đó không, và tin ghi vào socket của đầu lúc ấy nằm ở đâu bao lâu (độ trễ = thời gian subagent?). Cùng câu cho subagent chạy nền.
3. `CLAUDE_CODE_SESSION_ID` và `CLAUDE_PID` trong env của hook, so với payload `session_id`; ý nghĩa của `CLAUDE_CODE_CHILD_SESSION=1` (có trong Bash của subagent này; chưa biết có trong Bash của đầu không). Nếu là cờ "đây là subagent" thì `fgos mailbox send` phân biệt được.
4. `session_id` qua `--resume`, `--fork-session`, `/clear` và nén; đặc biệt pane `w6:p2` ở mục 1.3 (hai id, một pane).

---

## 4. Điều chưa đo, gom một chỗ

- Env trong hook (Claude, Codex); `CODEX_THREAD_ID`/`HERDR_PANE_ID` trong tiến trình hook Codex dưới daemon.
- Id hội thoại cho agy, pi, omp có học được từ lệnh con không.
- `terminal_id` herdr có bền qua pane move; pane id có tái dùng sau khởi động lại server herdr.
- `codex queue` tới được worker chạy `--no-daemon` không; tới được thread subagent không.
- Cơ chế "người báo cuối thắng" của `agent_session` (suy luận từ môi trường và id, chưa dựng lại).
- PostToolUse trong subagent (xem 3.5).
- Cỡ và thời gian của các trao đổi ở mục 2: cỡ là ước lượng; "trả lời sau N giờ" lấy từ dấu giờ trên dòng bảng, nên là thời điểm **được ghi**, không phải lúc bên kia đọc.

## 5. Giới hạn của nghiên cứu

- Chỉ đọc repo, tài liệu chính thức của Claude Code và Codex (hôm nay), help của năm CLI, và trạng thái đọc-không-ghi của herdr/Claude trên máy này. Tôi chạy `herdr integration status`, `pane list`, `pane get`, `pane process-info`, `agent list` (chỉ đọc, không phải lệnh help), đọc `~/.claude/sessions/*.json` (không đọc file `.key`), đọc hai khoá trong `/proc/<pid>/environ`; không gọi model, không đọc `.fgos/secrets.local.env` hay file auth.
- Kiểm kê trao đổi lấy từ bảng và báo cáo: chỉ thấy cái được ghi lại; chat trực tiếp giữa owner và phiên không có trong repo, nên các dòng 9–12 chắc chắn thiếu. Số 24 là mẫu, không phải tổng.
- Máy: bảng gọi `~/projects/forgent` là máy thứ hai, nhưng dòng 126–127 của phiên `d50dc90b` (phiên này, chạy ở `~/projects/forgent`, host `fg-server2`) lại ghi "máy owner". Tôi không phân định; cột "Qua máy?" theo nhãn của từng phiên.
- Nhánh Codex, pi, omp, agy của Q3 dựa vào help và tài liệu; chưa có phép đo hành vi nào. OpenAI và omp không có nguồn chính thức nào tôi đọc được về địa chỉ subagent.
- Không đo lại số của spec và báo cáo probe (độ trễ 2–45 s); chỉ trích dẫn.
- Hai báo cáo council vòng 1 và 2 của mailbox (`research-261019-1828/1834`) không được đọc; chỉ dùng spec, báo cáo probe và báo cáo 261015.

## 6. Câu hỏi còn mở

1. Lát đầu có phủ worker headless `cli-spawn` (không pane, không tty) không? Nếu có, `Nudge` kiểu gõ không dùng được cho chúng và cần quyết tier.
2. Chấp nhận khoá `(gốc .fgos, writer id)` kèm `thếHệ` làm giá trị (mục 1.4) hay chọn khoá = terminal?
3. Chủ dự án nhận mức bằng chứng yếu của bên dùng hạng 1 để làm lát đầu như một bài kiểm, hay bắt đầu từ lane↔lane qua Event Store (§15.2)?
4. Spec §5.1 nói id Codex "chỉ từ payload hook"; `session-identity spec:73` nói lệnh shell thấy `CODEX_THREAD_ID`. Cần sửa spec theo bên đã đo.
5. `tested_against` theo phiên bản cài sẽ sai khi nhiều phiên bản Claude chạy cùng lúc (đo: 2.1.301, 2.1.302 đang chạy, 2.1.304 đã cài); kiểm theo `version` của process đích (file đăng ký Claude có sẵn). Có chấp nhận không?
6. Agent đo Claude đang tạo phiên probe kế thừa `HERDR_PANE_ID` của pane `w6:p4S` và đang làm bẩn `agent_session` ở herdr; có cần dọn (herdr có `pane release-agent`) hay để nguyên làm bằng chứng?

Status: DONE_WITH_CONCERNS
Summary: Báo cáo đủ ba câu hỏi ở file này; Q2 kết luận không thấy bên dùng cho lát đầu mà bảng, file và runner chưa phục vụ, Q3 khuyến nghị chỉ nhắn đầu.
Concerns: mẫu 24 trao đổi chỉ gồm cái được ghi trên repo; Codex, pi, omp, agy phần subagent dựa vào help và tài liệu chưa đo; xác định máy owner/máy thứ hai chưa rõ.
