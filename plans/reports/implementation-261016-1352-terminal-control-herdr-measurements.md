# Đo herdr thật cho terminal-control (6.5 P01)

Ngày 2026-10-16, máy của anh (Linux 6.8, herdr `0.9.1-vantt.1`, protocol 22). Plan: [6.5](../261016-1306-terminal-control-rust-core-herdr-driver/plan.md), phase [01](../261016-1306-terminal-control-rust-core-herdr-driver/phase-01-herdr-measurements.md). Mọi tab đo tự tạo (nhãn `tc-p01-*`) rồi đóng bằng `pane close` từng pane; cuối phiên `herdr tab list` không còn tab `tc-p01-*`. Script đo ở `.fgos/runtime/tmp/tc-p01/` (không commit). JSON nguyên văn: [`packages/terminal-control/rust/tests/fixtures/herdr/`](../../packages/terminal-control/rust/tests/fixtures/herdr/).

## Kết luận nhanh

| # | Câu hỏi | Trả lời |
|---|---|---|
| 1 | Socket + pid server | Endpoint = `HERDR_SOCKET_PATH` (herdr tự đặt vào mọi pane; round confined đặt qua `isolatedSessionEnv`), không có thì `herdr [--session X] status server --json` → `socket`. `SO_PEERCRED` trên socket đó trả pid server (đo: pid 3614, `herdr server`, cùng uid). Đủ dựng `serverIncarnation` = `{host, bootId, pidNs, pid, startTime, endpoint}`. **Không** có cách gắn incarnation vào `pane close`: API schema (protocol 22) không có trường server id/instance nào → D1 giữ nguyên (kiểm trước và sau) |
| 2 | JSON các lệnh | Lưu đủ: `tab create/get/list`, `pane list/get/layout/split/process-info/close`, `status server`, `session list`. Shape `pane layout` khớp herdr-dashboard: `result.layout.{area, panes[].rect, splits[], tab_id}` |
| 3 | Luật 7.4 trên bản đang cài | Đúng: đóng pane neo → `pane split <neo>` trả `{"error":{"code":"pane_not_found"}}` (exit 1); đóng pane cuối → `tab get` trả `tab_not_found` (tab tự xoá); `pane close` lần hai trả `pane_not_found` |
| 4 | Kích thước nhỏ nhất | Không CLI nào có sàn trong vùng đã đo: claude, agy, pi, omp sẵn sàng và hiện composer + paste chip/draft ở 40 cột và ở 8 dòng (pty đã thu nhỏ thật, xem 4.2). codex chỉ đo được ở 120×30: các lần sau bị hộp thoại "Update available" chặn lúc khởi động (môi trường, không phải kích thước). Gửi prompt thật một lượt chạy xong ở cả 5 CLI. **Sàn CLI đo được: ≤ 40×8.** Mặc định layout là quyết định khả đọc, xem mục 4.4 |
| 5 | Bảng thao tác | Mục 5 |
| 6 | Chi phí một lệnh | `herdr pane list` 200 lần: p50 1.9 ms, p95 2.4 ms, max 3.1 ms |

Ba phát hiện mới ảnh hưởng thiết kế (mục 6): diện tích tab đi theo client đang gắn và đổi trong ngày; **rect herdr báo có lúc không khớp kích thước pty thật**; `ratio` của `pane split` là phần của pane cũ.

## 1. Incarnation server

```text
connect(/home/vantt/.config/herdr/herdr.sock) ; getsockopt(SOL_SOCKET, SO_PEERCRED)
→ pid 3614, uid 1000 ; /proc/3614/stat field 22 = 279874 ; boot_id 8ee555c5-… ; ns pid:[4026531836] ; cmdline "herdr server"
```

- `herdr session list --json` → `sessions[].socket_path`; session có tên nằm ở `~/.config/herdr/sessions/<name>/herdr.sock` (`herdr --session nonexist status server` in đường này). `HERDR_SESSION` một mình **không** đổi socket của `herdr status server`; `HERDR_SOCKET_PATH` mới là thứ CLI theo (cùng điều `worker-session.mjs:74` đã làm). Driver lấy endpoint theo thứ tự: env `HERDR_SOCKET_PATH` của request → `herdr status server --json`.socket.
- `herdr status server --json` có `capabilities.live_handoff: true`. Chưa đo (đo sẽ phải update herdr của anh): nếu live handoff giữ pane sống nhưng đổi pid server thì incarnation đổi → `close` trả `unknown`, pane được giữ cho người đóng. Hướng sai an toàn; ghi vào spec như khe đã biết, cùng khe "restart giữa hai lần kiểm" của D1.

## 2. JSON nguyên văn

Fixture (tên file → lệnh): `tab-create.json` (`tab create --workspace --label`, có `root_pane`), `tab-get.json`, `tab-list.json`, `tab-get-not-found.json`, `pane-list.json` (`--workspace`), `pane-get.json`, `pane-layout-two-panes.json` (`pane layout --pane`), `pane-split.json`, `pane-split-dead-anchor.json`, `pane-process-info-shell.json`, `pane-process-info-running.json` (`foreground_processes[].{pid, argv, cmdline}`, `shell_pid`, `foreground_process_group_id`), `pane-close-ok.json`, `pane-close-not-found.json`, `status-server.json`, `session-list.json`.

Cú pháp CLI cần đúng (đã gặp lỗi khi dùng sai): `pane layout` và `pane process-info` nhận `--pane <id>` (không nhận id vị trí); `pane split <id> --direction right|down --ratio <f>`; `pane run <id> <command…>` không in gì ra stdout; `pane read <id> --source visible|recent|recent-unwrapped|detection` trả văn bản thô, không JSON. Lỗi luôn là `{"error":{"code","message"},"id"}` với exit 1.

## 3. Luật 7.4

Đo trên tab `tc-p01-probe` (2 pane): đóng neo `wS:p59X` → ok; tách trên neo đã chết → `pane_not_found`; đóng lại → `pane_not_found`; `tab get` vẫn có tab (1 pane); đóng pane cuối → tab biến mất (`tab_not_found`). Khớp hội đồng §2.4: không cần `closeIfEmpty`, không cần pane gốc rỗng.

## 4. Kích thước nhỏ nhất của 5 CLI

### 4.1 Cách đo

Mỗi CLI một tab riêng; tách pane gốc về đúng W×H (tách `right` với ratio W/area.width, rồi `down` với ratio H/area.height; `pane layout` xác nhận rect đúng W×H); `herdr agent start <name> --kind <cli> --pane <gốc>`; dán brief 30 dòng bằng `pane send-text` (không Enter); đọc `--source visible`; đạt khi `agent_status` = `idle` và 8 dòng cuối có paste chip (`PASTE_CHIP_RE` hôm nay) hoặc chính văn bản draft. Cột: 120, 100, 80, 70, 60, 50, 40 ở 30 dòng; dòng: 24, 20, 16, 14, 12, 10, 8 ở 120 cột.

### 4.2 Kết quả (lượt 1, client 352×69, pty thu nhỏ thật)

| CLI | Mọi cỡ từ 120×30 tới 40×30 và 120×8 | Ghi chú |
|---|---|---|
| claude | sẵn sàng, chip `[Pasted text #1 +29 lines]` | màn hình 40×30 rộng tối đa 38 ký tự, 120×8 có 6 dòng không trống: pty đã đổi cỡ thật |
| agy | sẵn sàng, draft hiện | |
| pi | sẵn sàng, draft hiện | |
| omp | sẵn sàng; chip ở ≥ 70 cột, draft trải ra ở cỡ nhỏ hơn | composer vẫn nhận; cảnh báo update ở dòng đầu |
| codex | sẵn sàng ở 120×30; mọi cỡ sau: `agent_not_ready … blocked during startup` | màn hình bị chặn: "Update available 0.162.1 → 0.163.0 … 1. Update now 2. Skip" |

### 4.3 Lượt 2: gửi prompt thật

`agent prompt <name> "Reply with exactly the word ok…" --wait --until working`, rồi `agent wait --until idle|done|blocked`. Cả 5 CLI: prompt được nhận và chạy xong một lượt (codex chạy với `-c check_for_update_on_startup=false` để qua hộp thoại update). omp và pi trả lỗi model ("No model selected", "gpt-5.5 not supported with a ChatGPT account") vì khởi động trần không có đối số model của executor; đó là cấu hình executor, không phải kích thước. **Lượt này không chứng minh được gì về kích thước**: client lúc đó đã đổi sang 51×36 và pty không được thu theo rect (mục 6.2), nên mọi pane thật ra chạy ở 51×18.

### 4.4 Mặc định layout: sàn CLI khác ngưỡng khả đọc

Sàn đo được của CLI (≤ 40×8) thấp hơn nhiều so với cỡ một người còn đọc được. Mô phỏng `measured-split` (cùng luật của `placement-policy.v1.json`) cho số pane một tab chứa được:

| min (cột×dòng) | tab 352×69 | tab 244×71 | tab 110×80 | cỡ pane khi đầy (352×69) |
|---|---|---|---|---|
| 40×8 | 64 | 32 | 16 | 44×8 |
| 60×15 | 16 | 16 | 4 | 88×17 |
| 80×20 | 8 | 4 | 4 | 88×34 |
| 80×24 | 8 | 4 | 2 | 88×34 |
| 100×24 | 4 | 4 | 2 | 176×34 |

Đề xuất của Lead (cần Lead/anh chốt ở P08, xem mục 7): **sàn cứng = 40×8** (doctor từ chối `minCols < 40` hoặc `minRows < 8`, có nguồn là phép đo này), **mặc định = 80×20** (cỡ terminal mà cả 5 CLI thiết kế cho; 352×69 chứa 8 pane 88×34), **`maxPanesPerTab` = 8** (đúng số mô phỏng ra ở 352×69 với 80×20, theo D6).

Hệ quả cần đưa vào P02/P04: khi diện tích cả tab nhỏ hơn min (client 51×18 đo hôm nay), pane đầu của tab mới vẫn phải được nhận, nếu không core sẽ mở tab mới mãi.

## 5. Bảng thao tác: `createHerdrClient` → cổng terminal-control (đầu vào P06)

| Method ([`herdr-agent.mjs`](../../src/runner/dispatch/herdr-agent.mjs)) | Lệnh herdr | Op cổng | Khả năng |
|---|---|---|---|
| `paneSplit` | `pane split <id> --direction --ratio [--cwd] [--env]` | `allocate` | `pane.split` |
| `tabCreate` | `tab create --label [--cwd] [--env] [--focus]` | `allocate` (nhóm chưa có pane sống) | `tab.create` |
| `tabGet`, `tabClose` | `tab get`, `tab close` | **xoá** (chỉ `closeIfEmpty` dùng; core không bao giờ đóng tab) | — |
| `paneClose` | `pane close <id>` | `release{close}` | `pane.close` + `server.incarnation` |
| `paneList` | `pane list` | `inspect` (pane còn sống), `reconcile-scan`; probe của `worker-session-boot` | `process.info` |
| `paneProcessInfo` | `pane process-info --pane` | `inspect.foreground`; định danh trong `launch` | `process.info` |
| `paneRun` | `pane run <id> <cmd…>` | `launch` (không `activity`) | `pane.run` |
| `agentStart` | `agent start <name> --kind --pane --timeout [-- args]` | `launch` với `activity{kind, args}` | `activity.state` |
| `agentPrompt` | `agent prompt <name> <text> [--wait --until --timeout]` | `send{text, submit:true}` | `send.text` |
| `agentSendKeys` | `agent send-keys <name> <keys…>` | `send{keys}` | `send.keys` |
| `agentRead` | `agent read <name> [--lines] [--source]` | `read` | `read.screen` |
| `agentGet`, `agentWait`, `agentExplain` | `agent get`, `agent wait`, `agent explain --json` | `inspect.activity` (poll; `explain` cho chẩn đoán, [`herdr-diagnosis.mjs:35`](../../src/runner/dispatch/herdr-diagnosis.mjs)) | `activity.state` |
| `reportAgent`, `reportAgentSession` | `pane report-agent[-session] <id> --source fgos --agent --state` | `label` (metadata hiển thị cho sidebar herdr) | `label` |
| `workspaceCreate` | `workspace create --label [--cwd] [--env]` | chỉ `worker-session-boot` dùng (pane gốc của server session riêng) | **chưa có op** |
| (ngoài client) `worker-session-boot` spawn `herdr --session X server` | `herdr --session X server` | **chưa có op** | — |
| (ngoài client) reaper [`cleanup.mjs:410`, `:428`](../../src/runner/dispatch/confinement/cleanup.mjs) | `pane list`, `pane close` | `inspect` + `release{close}` | — |
| (ngoài client) account probe [`dispatch/cli.mjs:1220`](../../src/runner/dispatch/cli.mjs) | `pane close` | `release{close}` | — |

Hai hàng "chưa có op" là việc dựng server herdr riêng cho round confined, không phải vòng đời pane. P06 cần quyết: thêm op `driver-session.ensure` vào cổng (đúng "một cửa"), hay để `worker-session-boot` là chỗ duy nhất còn gọi herdr và ghi rõ trong spec. Đề xuất: thêm op, vì D2 nói mọi lời gọi herdr của Node.

## 6. Phát hiện ảnh hưởng thiết kế

### 6.1 Diện tích tab đi theo client và đổi trong ngày

Log server: client 352×69 (01:28Z), 244×71 (02:31Z), 51×36 (11:36Z, đang gắn song song với client 244×71). Tab tạo lúc 11:4xZ có `area` 51×18. Hệ quả: policy chạy trên số đo lúc cấp; cùng một nhóm có thể nhận tab cỡ khác nhau trong một ngày; fixture 352×69 chỉ là một trạng thái.

### 6.2 Rect herdr báo có thể khác pty thật

Trong trạng thái 6.1 (hai client), sau `pane split` của một tab nền: `pane layout` báo 40×8 / 26×18 / 5×51, nhưng `stty size` trong pane in `18 51` và `pane get`.`scroll.viewport_rows` = 18 cho mọi pane: pty không được thu. Ở lượt 1 (một client 352×69) pty có thu đúng. Chưa rõ quy tắc của herdr (nhiều client, tab không hiển thị). Hệ quả cho bước "đo lại" của 7.9: không chỉ đọc `pane layout`; driver đọc thêm kích thước pty thật. Trên Linux làm được không cần herdr: `pane process-info`.`shell_pid` → `/proc/<pid>/fd/0` → `ioctl(TIOCGWINSZ)` (cùng uid; đã thử trên pane của Lead: trả 18×51, khớp `viewport_rows`). Đề xuất cho P03: `layout.geometry` trả cả `rect` và `pty{cols, rows}` khi đọc được; P02 đo lại theo `pty` nếu có.

### 6.3 Ngữ nghĩa `ratio`

`--ratio r` là phần của **pane cũ**: tách `down` 0.3 trên pane 18 dòng → pane cũ 5, pane mới 13; tách `right` 40/51 → pane cũ 40. Luật hôm nay "tách neo `down` 0.3" vì thế cho pane mới 70% (khớp số đo của r6 §12.8: pane cũ teo dần). `placement-policy` (tỉ lệ 0.5) không bị ảnh hưởng, nhưng P03 phải giữ đúng nghĩa này khi dịch `{direction, ratio}`.

### 6.4 Hộp thoại update chặn khởi động

codex (và omp, pi in dòng cảnh báo nhưng không chặn) có thể chặn `agent start` bằng hộp thoại update. Không thuộc 6.5 (thuộc cấu hình executor / agent-protocol 6.3); ghi để người làm round herdr biết vì sao `agent_not_ready … blocked during startup`.

## 7. Việc cần Lead/anh quyết

1. Mặc định `minCols/minRows/maxPanesPerTab`: Lead đề xuất sàn 40×8 (đo), mặc định 80×20, 8 pane/tab. Lead tự quyết nếu không ai phản đối trước P08 config.
2. Op cho dựng server session riêng (mục 5): Lead đề xuất thêm vào cổng ở P06.
3. Đo lại theo pty (6.2): Lead đề xuất đưa vào P03/P02 như trên.
