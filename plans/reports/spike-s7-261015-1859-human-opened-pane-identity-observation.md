# Spike S7 — Danh tính writer cho pane do người tự mở trong herdr

- Ngày: 2026-10-15, máy Linux của anh, herdr `0.9.1-vantt.1`, herdr server pid `3614`.
- Câu hỏi: pane người tự mở rồi chạy CLI agent (claude, codex, agy, pi, omp) thì `resolveWriterIdentity` trả gì, có đụng nhau không, và P1/P2/P3 cái nào đúng với bằng chứng.
- Bối cảnh: [hội đồng kiến trúc, mục 2.2 và hàng "Danh tính cho pane do người tự mở"](architecture-council-261015-1508-terminal-control-session-identity-process-supervisor.md), [S1 kiểm kê writer id](spike-s1-261015-1818-writer-id-consumer-inventory.md), [research gốc](research-261015-1116-herdr-tab-pane-layout-and-naming.md), [`docs/io-contract.md`](../../docs/io-contract.md), [`src/util/session-identity.mjs`](../../src/util/session-identity.mjs).

## Kết luận ngắn

| # | Phát hiện |
|---|-----------|
| 1 | **Codex đụng nhau thật.** Lệnh của codex không chạy dưới pane. Nó chạy dưới một daemon `codex app-server` dùng chung (ppid 1, sống từ hôm qua). Resolver hôm nay trả `1105212` (pid daemon) cho **cả ba** pane codex. Gọi `node bin/fgos.mjs` thẳng thì trả `1` (init). |
| 2 | **Shell trần đụng nhau thật.** Người gõ `fgos` trong pane không có agent: resolver trả `3614` (herdr server) qua đường Rust host, trả `1` khi gọi node thẳng. Mọi pane trần trên máy chung một id. Đây đúng là con số `3614` research báo. |
| 3 | claude, agy, pi, omp **không đụng nhau**. Claude có `CLAUDE_CODE_SESSION_ID`. agy/pi/omp không có env id, nhưng 3 bước leo dừng ở pid của chính CLI (qua Rust host) hoặc shell gốc của pane (gọi node thẳng). Cả hai đều riêng từng pane. |
| 4 | `CODEX_THREAD_ID` có trong env con của codex và **khác nhau giữa các pane** (3 pane, 3 thread). Đây là cách duy nhất phân biệt pane codex. |
| 5 | `HERDR_PANE_ID` **sai với codex**: env của daemon mang `wS:p4YF`, một pane đã đóng từ lâu. Mọi pane codex cùng account đều thấy id chết đó. Với 4 CLI còn lại thì đúng. |
| 6 | Gốc pane (shell zsh herdr bật) riêng từng pane và giữ nguyên khi CLI thoát. Nó là session leader có controlling tty. Tổ tiên cao nhất còn tty chính là gốc pane, không cần danh sách tên multiplexer. |
| 7 | herdr không tái dùng pane id trong cùng đời server (đóng/mở 6 lần: `p586`…`p58B`, pane kế tiếp `p58C`). |

**Đề xuất:** (a) land thứ tự `FGOS_SESSION_ID → CODEX_THREAD_ID → CLAUDE_CODE_SESSION_ID` như anh đã quyết; (b) thay 3 bước leo bằng "leo tới tổ tiên cao nhất còn controlling tty, lấy pid của nó" (P3 dạng tổng quát). Không dùng P2 làm writer id. Không dùng P1.

## Cách làm

- Mở tab nháp `probe-s7` trong workspace `wS`, cwd là thư mục scratchpad (ngoài repo). Chia pane, gõ lệnh như người: `claude --model haiku`, `codex`, `agy`, `pi`, `omp`. Các lệnh này là zsh function/alias của anh (account switch). `omp` chạy `--profile=openai-tetnu`. Claude và agy hỏi trust thư mục, em chọn Yes.
- Mỗi pane: `herdr pane process-info` (shell_pid = gốc pane), cây tiến trình lên tới init đọc từ `/proc/<pid>/stat` (pid, ppid, comm, starttime, sid, tty) và `/proc/<pid>/cmdline`, tên khoá env liên quan danh tính (chỉ in dạng giá trị, cắt ngắn).
- **Gọi hàm thật**: một script nhỏ `import { resolveWriterIdentity } from src/util/session-identity.mjs`, gọi `resolveWriterIdentity(undefined)` (không đọc registry, không ảnh hưởng nhánh pid). Script chạy **trong tiến trình con của CLI** qua lối shell của chính CLI (`!lệnh`, gõ tay, không qua model, không ghi gì ngoài file kết quả trong scratchpad). Mỗi pane chạy 3 biến thể:
  - `direct`: `node probe.mjs`, giống đường fallback `node bin/fgos.mjs` của shell function `fgos`.
  - `host`: `sh -c 'node probe.mjs; :'`, thêm đúng một tầng cha như Rust host thật. Shim `.fgos/installation/bin/fgos` `exec` vào host, host `spawn` node làm con ([`apps/fgos/src/legacy_exec.rs:242-253`](../../apps/fgos/src/legacy_exec.rs)). Đây là đường `fgos` thật hôm nay.
  - `noenv`: như `host` nhưng xoá `FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID`/`CODEX_THREAD_ID`, để xem nhánh pid.
- Thêm một pane codex thứ hai và thứ ba, một pane shell trần. Mở/đóng 6 pane để thử tái dùng id. Gửi một prompt vô hại ("Reply with only the word ok. Do not use any tools.") cho agy và pi để xem có env session xuất hiện sau lượt đầu không.
- Dọn: `/exit`//`/quit` từng CLI, đóng 3 tab nháp, `herdr tab list` không còn tab `probe*`, mọi pid đã bật đều đã chết. Không đụng pane của phiên khác. Daemon codex `1105212` có sẵn từ trước, em không đụng.

Không chạy `fgos` verb, không build, không sửa source/config.

## Kết quả theo CLI

Độ sâu tính từ tiến trình node `fgos` (đường `host`) tới herdr server.

| CLI (pane) | Env id trong tiến trình con | Chuỗi tiến trình (host) | Hop tới herdr | Resolver hôm nay: host / direct | Đụng? |
|---|---|---|---|---|---|
| claude (`p57Z`) | `CLAUDE_CODE_SESSION_ID=9493ac81-…` (cũng `CK_SESSION_ID`) | node → sh(host) → zsh(tool) → claude → zsh(pane) → herdr | 5 | `9493ac81-…` env / `9493ac81-…` env; bỏ env: `2210918` (pid claude) | Không |
| codex (`p570`, `p584`, `p58D`) | `CODEX_THREAD_ID` = `CODEX_SESSION_ID`, 3 giá trị khác nhau: `01a13f6f-…`, `01a13f72-…`, `01a13f75-…` | node → sh(host) → zsh(tool) → **codex app-server daemon `1105212` (ppid 1)** → init | Không bao giờ qua herdr | `1105212` / `1` — **cả 3 pane giống hệt** | **Có** |
| agy (`p581`, `p58E`) | Không có | node → sh → zsh(tool) → agy → zsh(pane) → herdr | 5 | pid agy / pid zsh pane | Không |
| pi (`p582`, `p58F`) | Không có | node → sh → bash(tool) → pi → zsh(pane) → herdr | 5 | pid pi / pid zsh pane | Không |
| omp (`p583`, `p58G`) | Không có | node → sh → zsh(tool, **pty riêng**) → omp → zsh(pane) → herdr | 5 | pid omp / pid zsh pane | Không |
| shell trần (`p585`) | Không có | node → sh(host) → zsh(pane) → herdr | 3 | **`3614`** (herdr server) / **`1`** (init) | **Có** (với mọi pane trần; `1` còn trùng với codex direct) |

Ghi chú:

- Nhánh pid ổn định giữa các lần gọi trong cùng pane: agy 2 lần đều `2242928`, pi 2 lần đều `2242936`.
- Cùng một pane nhưng đường `host` và `direct` ra **hai id khác nhau** (pid CLI và pid zsh pane). Người dùng xen kẽ hai đường thì claim lấy bằng đường này không settle được bằng đường kia.
- Sau một lượt hội thoại, agy và pi vẫn không export env session nào. agy có conversation id (`agy --conversation=ee21af29-…` khi thoát) nhưng không truyền cho con. pi lỗi model của account (`gpt-5.5 not supported with ChatGPT account`); lỗi này không liên quan danh tính. omp chạy được ở trạng thái `no-model`.
- herdr chỉ báo `agent_session` cho claude (`source: herdr:claude`, `value` trùng `CLAUDE_CODE_SESSION_ID`). codex/agy/pi/omp: `null`, kể cả sau một lượt.
- Codex khi `/quit` in "Disconnected from this task. Any running work continues." Thread sống trong daemon, **lâu hơn pane**.
- Research báo omp leo trúng `3614`. Em **không tái hiện được** với omp: chỉ shell trần qua Rust host mới ra `3614`.

## Gốc pane: riêng biệt và ổn định

| Pane | shell_pid (gốc) | starttime | sid / tty | Sau khi CLI thoát |
|---|---|---|---|---|
| p57Z | 2209920 | 29260700 | sid = chính nó, tty ≠ 0 | vẫn 2209920 |
| p570 | 2210326 | 29261229 | như trên | vẫn 2210326 |
| p581 | 2210335 | 29261230 | như trên | vẫn 2210335 |
| p582 | 2210344 | 29261231 | như trên | vẫn 2210344 |
| p583 | 2210356 | 29261237 | như trên | vẫn 2210356 |
| p584 | 2228731 | — | như trên | vẫn 2228731 |

- Mỗi pane một gốc riêng (pid và starttime khác nhau). Gốc giữ nguyên suốt đời pane, kể cả khi CLI thoát hoặc người chạy CLI khác trong cùng pane. Pane đóng thì gốc chết.
- Gốc pane là session leader có controlling tty. herdr server có `tty=0`. Mọi tiến trình con của CLI (trừ codex) đều có tổ tiên còn tty, và **tổ tiên cao nhất còn tty chính là gốc pane**:
  - claude: shell tool là session leader riêng, `tty=0`; claude `tty≠0`, `sid` = gốc pane. Số đo sid/tty của claude lấy trên chính pane của phiên này (`wS:p552`), không phải pane nháp; các CLI khác đo trên pane nháp.
  - omp: shell tool chạy trong **pty riêng** (tty khác, sid riêng); omp vẫn mang tty của pane, `sid` = gốc pane. Quy tắc "tổ tiên **đầu tiên** có tty" sẽ sai với omp, phải lấy tổ tiên **cao nhất**.
  - pi: bash tool `tty=0`; pi `tty≠0`.
  - codex: cả chuỗi `tty=0` (daemon không có terminal). Quy tắc này không tìm được pane, nên đúng là "không biết", không đoán bừa.

## HERDR_PANE_ID: có mặt và tái dùng

- Có mặt trong env tiến trình con của claude, agy, pi, omp, shell trần, và **đúng pane** (kể cả qua pty riêng của omp).
- Codex: env con mang `HERDR_PANE_ID=wS:p4YF`, `HERDR_TAB_ID=wS:tCH`. Đó là env của daemon, bật lúc 2026-10-14 12:04 từ một pane nay đã không còn (`herdr pane get wS:p4YF` → `pane_not_found`). Daemon dùng chung theo `CODEX_HOME` (`/home/vantt/.codex-tetcu72` ở cả pane lẫn daemon).
- Dạng id: `<workspace>:p<counter>` (vd `wS:p57Z`), không phải `herdr:<session>:<pane>`. Có dấu `:`, nên `SESSION_ID_RE = /^[A-Za-z0-9._-]+$/` loại bỏ.
- Không tái dùng trong cùng đời server: mở rồi đóng 6 pane ra `p586, p587, p588, p589, p58A, p58B`; tab mới ngay sau đó ra `p58C`. Qua lần restart server thì em chưa kiểm.

## Quan sát `comm`

| Tiến trình | `comm` | Ghi chú |
|---|---|---|
| node (mọi script Node 24, kể cả wrapper npm của codex, gitnexus MCP) | `MainThread` | **Không phải `node`.** So khớp theo comm `node` sẽ trượt. |
| herdr server | `herdr` | cmdline `herdr server` |
| claude | `claude` | |
| codex CLI native và codex daemon | `codex` cả hai | Phải đọc cmdline (`app-server`) mới phân biệt được |
| agy / pi / omp | `agy` / `pi` / `omp` | |
| shell | `zsh`, `bash`, `sh` | |

Không gặp tên nào bị cắt ở 15 ký tự. Quy tắc dựa trên tên tiến trình (danh sách multiplexer) vì vậy kém tin cậy hơn quy tắc dựa trên tty/sid.

## Đánh giá P1 / P2 / P3

| | claude | codex | agy / pi / omp | shell trần | Hỏng gì | Đổi hợp đồng `writer` |
|---|---|---|---|---|---|---|
| **P1** trả "unknown" khi không phân biệt được | Không chạm (env) | Hết đụng, nhưng mỗi lệnh một id | Không chạm (vốn không đụng) | Hết đụng, nhưng mỗi lệnh một id | Theo contract, `unresolved` lấy pid của chính tiến trình gọi, nên mỗi lệnh `fgos` một id. Claim lấy ở lệnh này, settle ở lệnh sau sẽ lỗi `writer identity mismatch` (đúng cơ chế S1 E4). Luồng người gõ tay trong pane trần gãy. Còn cần một bộ phát hiện "không phân biệt được" (pid 1? herdr?), và đó lại là P3. | Không thêm giá trị `source`, nhưng đổi ngữ nghĩa thực tế |
| **P2** dùng `HERDR_PANE_ID` | Không chạm (env đứng trước) | **Sai**: mọi pane codex ra id pane chết `wS:p4YF`, vẫn đụng, còn gán nhầm chỗ | Đúng, riêng từng pane | Đúng | Chỉ có trong herdr (tmux/ssh/terminal khác không có). Phải nới regex hoặc biến đổi `:`. Env ai cũng đặt được, daemon giữ giá trị cũ. Pane id có thể tái dùng qua restart (chưa rõ). | `writer.id` có dạng mới; `source` thành `env` cho pane trần (nói quá độ tin) |
| **P3** dừng ở ranh giới multiplexer, dùng gốc pane | Không chạm | Không giúp: chuỗi không đi qua pane. Phải có `CODEX_THREAD_ID` trước. | Đúng; thêm lợi là đường `host`/`direct` ra **cùng** id | Đúng, riêng từng pane, bền giữa các lệnh | Nếu cài bằng danh sách tên (`herdr`/`tmux`/`sshd`) thì dễ gãy (comm, terminal khác). Cài bằng tty/sid thì tổng quát. Pid gốc có thể bị tái dùng sau khi pane đóng (rủi ro thấp; starttime giải được nhưng đổi kiểu id). | `source` giữ `pid`, `id` vẫn số. Chỉ sửa câu mô tả trong `docs/io-contract.md` và một dòng CHANGELOG. |

## Đề xuất: thay đổi nhỏ nhất

1. **Land thứ tự env `FGOS_SESSION_ID → CODEX_THREAD_ID → CLAUDE_CODE_SESSION_ID`** (anh đã quyết ở mục 2.2). Bằng chứng S7: đây là cách **duy nhất** tách pane codex, vì tiến trình của codex không nằm dưới pane. Giá trị thread hợp lệ với regex hiện có.
2. **Thay `walkAncestors` 3 bước bằng "gốc terminal"** trong `src/util/session-identity.mjs`: đọc `/proc/<pid>/stat` (đã đọc sẵn để lấy ppid; thêm trường `tty_nr`), leo tới tổ tiên **cao nhất** còn `tty_nr ≠ 0` rồi trả pid của nó, `source: pid`.
   - Không tìm được tổ tiên nào có tty (codex không thread, cron, CI, service): giữ nguyên hành vi 3 bước hôm nay. Không mở thêm phạm vi.
   - Không phải Linux: giữ nguyên đường `ps` hiện có.
   - Kết quả trên dữ liệu S7: shell trần → zsh pane (hết `3614`/`1`); agy/pi/omp → zsh pane cho cả `host` lẫn `direct`; claude/codex không đổi (đi nhánh env).
   - Quy tắc không phụ thuộc herdr: tmux, ssh, terminal GUI cũng dừng ở shell gốc của tty.
3. **Không dùng `HERDR_PANE_ID` làm writer id.** Nếu cần, chỉ dùng làm metadata hiển thị/lineage, và không tin nó khi tiến trình nằm dưới daemon codex.
4. **Không dùng P1.**
5. Kèm theo: sửa câu "`pid` (dò ngược tiến trình cha, best-effort)" trong `docs/io-contract.md` thành mô tả gốc terminal; thêm dòng CHANGELOG; test hồi quy bằng chuỗi giả qua seam `execFile`/`readFile` (shell trần, omp pty riêng, codex daemon không tty). Claim đang mở dưới id cũ (`3614`, pid CLI) sẽ không settle được sau khi đổi, nên settle hết trước khi activate bản mới.

Phát hiện bên lề, không thuộc S7: mọi tính năng đọc `HERDR_PANE_ID` từ trong codex (vd `/fgOS:terminal` đổi tên "pane của mình") sẽ nhắm vào pane chết `wS:p4YF`. Nên ghi thành item riêng.

## Câu hỏi còn mở

1. Lệnh tool do **model** gọi có đi cùng đường tiến trình với lối shell `!` của từng CLI không? S7 không cho model dùng tool nên chỉ đo được đường `!`. Codex gần như chắc cũng qua app-server; pi/omp/agy cần xác nhận.
2. Research đo `3614` cho omp bằng cách nào? S7 chỉ ra `3614` với shell trần. Có thể omp tool thật dùng shell khác `!`.
3. Pane id herdr có lặp lại sau khi restart server không? Chưa đo; chỉ quan trọng nếu sau này chọn P2.
4. Có cần thêm starttime vào id gốc pane để chống tái dùng pid không? Làm vậy thì `writer.id` thành chuỗi, tức đổi hợp đồng. S7 đề nghị chưa làm.
5. Codex có trường hợp nào gọi `fgos` khi **chưa** có thread (`CODEX_THREAD_ID` vắng) không? S7 chưa gặp: lệnh `!` đầu tiên đã có thread.
6. Thread codex sống tiếp trong daemon sau khi pane đóng. Nếu thread đó còn giữ claim thì claim không gắn với pane nào. Lock v2 có cần tính trường hợp này không?
