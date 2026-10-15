# Spike T8: controller chết giữa lần chạy, herdr-spawn và cli-spawn mất gì

- Ngày: 2026-10-15, 18:43–19:02 (Asia/Saigon). Máy Linux, repo `/home/vantt/projects/forgentX`, nhánh `main`, CLI working-tree `node bin/fgos.mjs`.
- Câu hỏi: khi process điều khiển (controller, `node bin/fgos.mjs run`) chết giữa lần chạy, cái gì mất? Kết quả dùng cho trigger T8 trong [kết luận hội đồng](architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md) (mục 3, dòng "Một supervisor riêng cho mỗi lần chạy").
- Không sửa code, không chạy `npm test`. Chỉ chạy worker read-only.

## 1. Tóm tắt

| Câu hỏi | herdr-spawn | cli-spawn |
|---|---|---|
| Worker sống tiếp sau khi controller chết? | **Có.** Worker sống trong pane do herdr server giữ, làm xong việc | **Không.** Supervisor "detached" chết ở lần đầu worker in ra output (sau 28–36 s), worker chết theo |
| Deadline (`--timeout`) còn được thi hành? | **Không.** Worker chạy quá deadline 2 phút, tự xong sau ~234 s | **Không.** Worker chết trước deadline, nhưng vì crash chứ không phải vì deadline |
| Kết quả có được ghi nhận (settle)? | **Không.** Worker ghi `outbox/result-1.json` + marker, nhưng không ai đọc. Không có `result.json`, `exit.json`, `unit-summary.json`, adapter receipt | **Không.** Không có adapter receipt, `result.json`, `exit.json` |
| `inspect` thấy gì? | Mãi mãi `running/bound`, `result: missing` | Mãi mãi `running/bound`, `result: missing` |
| `dispatch recover` | **park**: "unrecognized evidence type(s): result-1.json:unknown" | **recommendation `resume-driver`** |
| `run --resume` | Chạy **lại từ đầu** ở attempt mới (`runs/02`), bỏ kết quả attempt 01 đã xong | Chạy **lại từ đầu** ở attempt mới (`runs/02`) |
| Home riêng (bwrap) | Bị reaper xoá **khi pane + worker vẫn sống** (lỗi p-c3a41d07, tái hiện 2 lần) | Bị reaper xoá ở lần `fgos run` tiếp theo (worker đã chết nên không gây hại thêm) |
| Rác để lại | Pane có claude REPL ngồi mãi; home còn đến khi có `fgos run` khác | Home còn đến khi có `fgos run` khác |
| SIGTERM khác SIGKILL? | Không khác. Controller không bắt SIGTERM, chết ngay, không dọn gì | Không khác |

**Kết luận T8: có.** herdr-spawn mất deadline, mất ghi nhận kết quả, mất dọn pane và home khi controller chết. herdr server chỉ giữ cho worker sống, không có khái niệm deadline hay receipt. Điều kiện mở lại "supervisor riêng cho mỗi lần chạy" cho herdr đã thoả.

**Phát hiện lớn hơn câu hỏi:** cli-spawn, đường được coi là "sống sót qua crash nhờ supervisor tách rời", thực tế **cũng mất hết**. Supervisor chết vì lỗi `ERR_IPC_CHANNEL_CLOSED` không ai bắt (mục 4.2). Nên hôm nay **không đường nào** sống sót qua crash controller một cách có ích.

## 2. Cách làm

- Worker task (read-only): "dùng shell chạy `sleep 50` N lần, mỗi lần một lệnh riêng, xong thì kết báo cáo bằng dòng `T8-DONE-<tag>`". N=3 (~150 s) cho ca A/B/C, N=4 (~200 s) cho ca D. Tách `sleep` nhỏ vì Bash tool của claude có timeout 2 phút mỗi lệnh.
- Route herdr: `--override '{"scope":{},"executor":"claude-herdr","invocation":"claude-herdr-bwrap"}' --rigor low`. Thực tế resolve ra `model=sonnet tier=standard` (không phải nano), ghi ở câu hỏi mở.
- Route cli: `--override '{"scope":{},"executor":"deepseek","invocation":"pi-cli-bwrap-openrouter"}' --rigor low` (model `deepseek/deepseek-v4-flash`).
- Launch bằng `setsid nohup node bin/fgos.mjs run ... --timeout <t> --json` để em biết đúng pid controller. Trước khi kill, em đọc `/proc/<pid>/cmdline` (đều là `node bin/fgos.mjs run Spike T8 liveness probe...`). Chỉ kill pid em tạo.
- Kill ~25 s sau khi launch (worker đã vào `sleep 50` đầu tiên).
- Quan sát mỗi 15 s bằng script: home còn không, pane còn không và chạy gì (`herdr pane process-info`), supervisor/bwrap còn không (`pgrep`), file nào xuất hiện trong run dir.
- Script và log ở `.fgos/runtime/tmp/t8/` (`launch.sh`, `watch.sh`, `*.meta`, `*.watch`, `*.err`, `*.out`).

## 3. Kết quả từng ca

| Ca | Route | Kill | Worker sống tiếp? | Deadline thi hành? | Kết quả ghi nhận? | Reconcile/resume cứu được? | Home | Rác |
|---|---|---|---|---|---|---|---|---|
| hA | herdr | không | – | – | **Có**: pass, đủ `result.json`, `exit.json`, receipt, `unit-summary.json` (184 s) | – | dọn sạch | pane tự đóng |
| cA | cli | không | – | – | **Có**: pass, đủ file (175 s) | – | dọn sạch | không |
| hB | herdr | SIGKILL 18:47:18 | **Có**, xong 18:49:47, có `outbox/result-1.json` + `T8-DONE-hB` | – | **Không** | recover: park. `--resume`: chạy lại attempt 02 trong pane mới, pass sau 3 phút. Attempt 01 vẫn `running/bound` | **Xoá 18:50:33 khi claude vẫn sống trong pane** (reaper do `--resume` gọi) | pane `wS:p57P` (em đóng tay) |
| cB | cli | SIGKILL 18:47:18 | **Không**: supervisor chết ~18:47:50, bwrap+pi chết theo | – | **Không** (không có receipt) | recover: `resume-driver`. `--resume`: chạy lại attempt 02, pass. Attempt 01 vẫn `running/bound` | xoá 18:50:33 | không |
| hC | herdr | SIGTERM 18:54:30 | **Có**, xong 18:57:07 | – | **Không** | recover: park (như hB) | **Xoá ~18:57:30 khi pane còn mở** (reaper do ca D gọi) | pane `wS:p57X` (em đóng tay) |
| cC | cli | SIGTERM 18:54:30 | **Không**: supervisor chết ~18:55:00 | – | **Không** | recover: `resume-driver` | xoá ~18:57:25 | không |
| hD | herdr | SIGKILL 18:57:50, `--timeout 2m` | **Có**, chạy qua deadline 18:59:25, xong 19:01:20 | **Không** | **Không** | (cùng dạng hB, không resume lại) | còn tới cuối (chưa có `fgos run` mới) | pane `wS:p57Y` (em đóng tay), home còn |
| cD | cli | SIGKILL 18:57:50, `--timeout 2m` | **Không**: supervisor chết ~18:58:20, bwrap chết ~18:58:30 | **Không** (worker chết trước, vì crash) | **Không** | (cùng dạng cB) | còn tới cuối | home còn |

SIGTERM cho kết quả giống hệt SIGKILL. Code controller không có handler SIGTERM/SIGINT trên đường `run` (chỉ `src/runner/main-checkout-lock.mjs:470-471` có, không thuộc đường này).

## 4. Bằng chứng

### 4.1 Id và đường dẫn

| Ca | unitRunId | Home (`/tmp/fgos-confinement/`) | Pane | Controller pid |
|---|---|---|---|---|
| hA | `unit-run-1792064613657-6547e15f` | `disp_1792064614202_f5955dce` | `wS:p57N` | 2103504 |
| cA | `unit-run-1792064618818-872cbe2b` | `disp_1792064619081_1192bdad` | – | 2105807 |
| hB | `unit-run-1792064811065-4323be96` | `disp_1792064811232_fb8fa253` | `wS:p57P` (resume: `wS:p57V`) | 2139284 |
| cB | `unit-run-1792064811073-3fa62945` | `disp_1792064811236_1fc2e7e1` | – | 2139288 (supervisor 2139437) |
| hC | `unit-run-1792065244863-89bd3b84` | `disp_1792065245011_c1176aa0` | `wS:p57X` | 2177262 |
| cC | `unit-run-1792065244860-4fa079bc` | `disp_1792065244998_9ba5aa67` | – | 2177266 (supervisor 2177370) |
| hD | `unit-run-1792065445932-3f3903d1` | `disp_1792065446062_4e1fbe6e` | `wS:p57Y` | 2195517 |
| cD | `unit-run-1792065445932-164234b4` | `disp_1792065446065_ca6a8e32` | – | 2195521 (supervisor 2195634) |

Run dir: `.fgos/assignments/<unitRunId>/producer/1/runs/01/`.

### 4.2 Vì sao supervisor của cli chết

Ngay sau SIGKILL, supervisor còn sống và được init nhận nuôi:

```
PID     PPID PGID    CMD
2139437 1    2139437 node .../detached-run-supervisor.mjs .../launch-envelope/cmd_1792064811221_3e2d6aad.json
```

Nó chết đúng lúc worker in output lần đầu sau khi controller chết. `stdout.log` trong capture ghi lần cuối lúc 18:47:48.64 (`tool_execution_end` của `sleep 50` đầu), supervisor mất lúc 18:47:54. Ca cC: ghi cuối 18:54:58.6, mất trước 18:55:07. Ca cD: ghi cuối 18:58:20.16, mất trước 18:58:20 + 15 s.

Nguyên nhân: `deliverLiveChunk` gọi `process.send(...)` cho mỗi chunk (`src/runner/dispatch/detached-run-supervisor.mjs:419-423`). Supervisor được spawn với kênh `ipc` (`:856`). Khi parent chết, `process.send` không throw ngay (nên `try/catch` không bắt được) mà phát lỗi `ERR_IPC_CHANNEL_CLOSED` bất đồng bộ trên `process`. Không ai nghe sự kiện `error` đó, nên process crash. `process.on('disconnect', () => {})` ở `:309` không chặn được lỗi này. Em tái hiện bằng hai file nhỏ (`.fgos/runtime/tmp/t8/ipc-parent.mjs`, `ipc-child.mjs`), có cùng ba handler như supervisor:

```
11:48:28.889Z before send
11:48:28.890Z send returned
11:48:28.890Z uncaught ERR_IPC_CHANNEL_CLOSED Channel closed
11:48:28.890Z exit code=9
```

Worker (`bwrap` → `pi`) chết sau supervisor 0–15 s. Em **suy luận**, chưa chứng minh: stdout/stderr của worker là pipe vào supervisor; supervisor chết thì lần ghi tiếp theo của `pi` gặp EPIPE và `pi` thoát. Supervisor chết trước khi kịp publish receipt, nên không có `protected/adapter-receipts/*.json`.

### 4.3 herdr worker sống qua crash, nhưng không ai settle

hB, `watch` log (trích):

```
18:47:32 home=kept pane=idle fg=claude,...
18:49:47 home=kept pane=working fg=claude,... +outbox/result-1.json MARKER
18:50:33 home=GONE pane=done fg=claude,... +outbox/result-1.json MARKER   <- resume vừa start, reaper chạy
```

`outbox/report-1.md` chứa `T8-DONE-hB`. Run dir chỉ có `brief-1.md, dispatch-plan.json, effective-execution-contract.json, run.json, visibility.json, outbox/{ack-1,report-1,result-1}`; không có `result.json`, `exit.json`, `evidence.json`, receipt, `unit-summary.json`. Theo code, deadline của herdr nằm trong vòng `pollForOutcome` của controller (`src/runner/dispatch/herdr-round.mjs:1185` trở đi, `deadlines.round.ceilingMs`), việc đóng pane cũng do controller (`killPaneForegroundAndClose`, `:318-329`). Controller chết thì không còn ai làm.

hD (deadline 2 phút, start 18:57:25): pane vẫn có claude ở 18:59:35, 19:00:20 (`working`), `result-1.json` xuất hiện lúc 19:01:20. Không có gì dừng worker ở deadline.

### 4.4 inspect, recover, resume

`node bin/fgos.mjs dispatch inspect --run <runId>` (rút gọn: run-record, phase, resourceState, delivery, evidence.result):

```
hB/01 (killed)    [{"status":"running","phase":"bound"},"bound","ambiguous","not-started","missing"]
hB/02 (resume)    [{"status":"settled","phase":"settled"},"settled","ambiguous","not-started","complete"]
hA/01 (baseline)  [{"status":"settled","phase":"settled"},"settled","ambiguous","not-started","complete"]
hD/01 (killed)    [{"status":"running","phase":"bound"},"bound","ambiguous","not-started","missing"]
```

Attempt 01 bị kill vẫn `running` ngay cả sau khi attempt 02 đã pass. `run.json` của attempt 02 có `supersedesRunId: null`.

`node bin/fgos.mjs dispatch recover <runId>`:

```
hB, hC: park  "unrecognized evidence type(s): result-1.json:unknown -- never guessing an action over evidence this door cannot interpret"
cB, cC: recommendation resume-driver "run is not settled, no unrecognized evidence was found, and the driver has no fresh heartbeat"
```

`node bin/fgos.mjs dispatch reconcile plan --run-dir <hB runDir>`: `{"outcome":"blocked","reason":"no cwd lock exists"}`; không liên quan đến việc cứu run.

`node bin/fgos.mjs run --resume unit-run-1792064811065-4323be96` (18:50:28 → 18:53:26, exit 0): mở pane mới `wS:p57V`, chạy lại toàn bộ ở `runs/02`, outcome pass. Kết quả của `runs/01` (đã xong lúc 18:49:47) bị bỏ, tốn thêm 3 phút và một lượt model. `--resume` của cB (18:53:55 → 18:56:50) cũng vậy.

### 4.5 Reaper xoá home khi herdr worker còn sống (p-c3a41d07)

Marker của **cả hai route** ghi `pid` là pid controller, không có `paneId`:

```
disp_1792064614202_f5955dce (herdr): "pid": 2103504, "timeoutMs": 240000
disp_1792064619081_1192bdad (cli):   "pid": 2105807, "timeoutMs": 240000, "credentialWriteBack": {...}
```

`reapOrphanedConfinementResources` (`src/runner/dispatch/confinement/cleanup.mjs:376`) được gọi ở đầu mỗi `runUnit` (`src/runner/execution/run.mjs:315`). Thấy pid chết và không có `paneId` thì xoá home. Hai lần xoá trong lúc pane vẫn mở:

- hB: home mất 18:50:33, đúng lúc `--resume` start; pane `wS:p57P` vẫn chạy claude (pid 2139474, 2139477) tới khi em đóng lúc 18:53:48.
- hC: home mất giữa 18:57:23 và 18:57:38, đúng lúc ca D start; pane `wS:p57X` vẫn chạy claude tới khi em đóng lúc 18:57:57.

`stopProcessesInside` chỉ giết process có exe hoặc cwd nằm trong home, nên claude (exe ngoài home, cwd là repo) **không bị giết**, chỉ bị xoá home (token, config) dưới chân. Vì reaper chạy ở đầu **mọi** `fgos run` của **mọi** session, việc xoá này xảy ra rất sớm trên máy dùng nhiều.

Lưu ý: nếu supervisor cli sống sót được (sau khi sửa 4.2), nó cũng sẽ gặp đúng lỗi này, vì marker cli cũng trỏ vào controller chứ không trỏ vào supervisor.

## 5. Kết luận cho T8

Trigger T8: "nếu quan sát crash-controller cho thấy herdr-spawn mất bảo đảm deadline hoặc receipt mà herdr server không lo, mở lại supervisor riêng cho mỗi lần chạy của herdr".

| Bảo đảm | Ai giữ hôm nay (herdr) | Controller chết thì | herdr server lo thay? |
|---|---|---|---|
| Worker còn chạy | herdr server (pane) | còn | **có** |
| Deadline / idle timeout | vòng poll trong controller | **mất** (hD chạy quá 2 phút) | không, herdr không có khái niệm deadline |
| Đọc `result-N.json`, settle `result.json`/`exit.json`/receipt/`unit-summary` | controller | **mất** | không |
| Đóng pane, giết worker khi hết giờ | controller | **mất** (3 pane mồ côi, em đóng tay) | không |
| Giữ home đúng thời gian sống của worker | marker trỏ pid controller | **sai**: xoá khi worker còn sống | không |
| Cứu bằng recover/resume | – | recover park, resume chạy lại từ đầu | – |

**Verdict: T8 thoả.** herdr-spawn mất deadline và mất receipt khi controller chết, và herdr server không bù phần nào ngoài việc giữ worker sống. Câu hỏi "herdr có cần supervisor không" trả lời là **có**.

Điều quan trọng cho quyết định "một supervisor chung": supervisor cli hiện có **không phải mẫu đã chạy đúng** để nhân rộng. Nó cũng mất hết vì lỗi IPC. Nên việc cần làm không phải "thêm cho herdr cái cli đã có", mà là làm một supervisor thật sự sống sót được, dùng chung cho cả hai.

## 6. Supervisor chung cần nắm những gì (từ những thứ đã mất)

1. **Không phụ thuộc vào controller còn sống.** Không ghi vào IPC/pipe của parent mà không có handler `error`; hoặc bỏ hẳn kênh IPC, controller đọc output qua file. Đây là lỗi làm cli mất hết.
2. **Giữ deadline và idle timeout.** Với herdr: hết giờ thì giết foreground trong pane và đóng pane, giống `killPaneForegroundAndClose` hiện nằm trong controller.
3. **Đọc kết quả và settle.** Nhận `outbox/result-N.json` (herdr) hoặc exit của worker (cli), publish receipt bất biến, viết `result.json`/`exit.json`. Sau khi supervisor publish, controller (hoặc resume) chỉ cần đọc.
4. **Là chủ của home.** Marker ghi pid + start time của supervisor (không phải controller), cùng pane/socket herdr. Reaper chỉ xoá khi supervisor đã chết **và** pane đã đóng. Khớp với hướng vá 2.1 của hội đồng.
5. **Có heartbeat riêng**, để `inspect`/`recover` phân biệt "controller chết nhưng supervisor còn làm" với "bỏ hoang".
6. **Cho resume tiếp nhận kết quả thay vì chạy lại.** `recover` hiện park vì không hiểu `result-1.json` của herdr; `--resume` tạo attempt mới. Cần một đường "adopt": attempt đã có kết quả hợp lệ thì settle nó, đánh dấu attempt cũ đã được thay (`supersedesRunId`), không trả tiền model lần hai.
7. **Dọn rác.** Đóng pane khi xong hoặc hết giờ; xoá home sau khi worker và pane đều đã hết.

Phần dành riêng cho từng carrier nhỏ: cách bật worker (spawn pgid vs pane herdr), cách biết worker xong (exit code vs `result-N.json`), cách giết (kill pgid vs giết foreground + `pane close`).

## 7. Dọn dẹp sau thí nghiệm

- Pane em tạo: `wS:p57N`, `wS:p57V` (tự đóng), `wS:p57P`, `wS:p57X`, `wS:p57Y` (em đóng bằng `herdr pane close`). Kiểm lúc 19:01:49: không còn pane nào của em. Các pane mới khác lúc đó (`wS:p57Z`, `wS:p570`, `wS:p581-583` trong tab `wS:tF5`, và `wS:p57W`) thuộc session khác, em không đụng.
- Process: không còn supervisor, bwrap hay watcher nào của em.
- Home còn lại: `disp_1792065446062_4e1fbe6e` (hD) và `disp_1792065446065_ca6a8e32` (cD), có bản sao đăng nhập. Reaper sẽ xoá ở lần `fgos run` kế tiếp của bất kỳ session nào; em không xoá tay.
- Unit run em tạo: 8 thư mục trong `.fgos/assignments/` (bảng 4.1). Attempt 01 của 6 ca bị kill vẫn ở trạng thái `running`.

## 8. Câu hỏi mở

1. `--rigor low` không xuống tier nano cho `claude-herdr`: resolve ra `sonnet/standard`. Đây là chủ ý hay lỗi map tier của executor này?
2. Supervisor cli chết vì IPC: sửa riêng ngay (một handler `process.on('error')` hoặc bỏ IPC) hay gộp vào việc làm supervisor chung? Sửa riêng thì nhanh, nhưng marker home vẫn trỏ controller (4.5), nên cli vẫn chưa sống sót trọn vẹn.
3. Cơ chế worker cli chết theo supervisor (EPIPE) em mới suy luận. Có cần đo thêm (strace hoặc bọc worker ghi exit signal) trước khi thiết kế không?
4. `run --resume` nên adopt kết quả đã có của attempt cũ, hay chạy lại là hành vi mong muốn khi không có receipt? Hiện chạy lại tốn thêm một lượt model đầy đủ.
5. Attempt bị kill nằm mãi ở `running/bound`, kể cả khi attempt sau đã pass. Ai có quyền đóng nó: supervisor chung, `recover`, hay `resume`?
6. Reaper chạy ở đầu mọi `fgos run` của mọi session. Trên máy đông session, khoảng an toàn cho một home có controller chết gần như bằng 0. Việc này cần đi cùng vá 2.1, không chờ supervisor.
