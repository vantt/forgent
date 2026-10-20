# Đo thật: pi và omp có xuất session id cho tiến trình con không, và cái gì ghi liên kết terminal với session

Ngày đo: 2026-10-20, 15:48 đến 15:53 (giờ máy, UTC+7). Mỗi phép đo chạy **một lần**, nên không có phân phối, chỉ có một mẫu. Phiên bản: **pi 1.3.0**, **omp 18.11.2** (`pi --version`, `omp --version`). Model dùng: `openai-codex/gpt-5.6-luna` (model rẻ nhất mà tài khoản cho phép; `gpt-5.3-codex-spark` bị từ chối với tài khoản ChatGPT).

## Tóm tắt

| # | Câu hỏi | pi 1.3.0 | omp 18.11.2 | Trạng thái |
|---|---|---|---|---|
| P1 | Biến môi trường chứa session id trong tool Bash (chế độ `-p`) | **Có**: `PI_SESSION_ID` (uuid, bằng id trong tên file session mới nhất) và `PI_SESSION_FILE` (đường dẫn file session) | **Không**: không có biến nào mang id hoặc đường dẫn session | đo (1 lần mỗi CLI) |
| P1 | Cha của lệnh Bash | chính tiến trình `pi` (ppid = pi), không phải tty | chính tiến trình `omp`, không phải tty | đo |
| P2 | Bản ghi terminal sang session | **không có** file nào (chỉ có file session) | **Có**: `<profile>/agent/terminal-sessions/pts-N`, 3 dòng (cwd, đường dẫn session, `cwdstat`), thêm dòng `fresh` lúc mới mở | đo |
| P2 | Bản ghi omp có đúng session đang chạy không | | **Chỉ đúng ở thời điểm khởi động hoặc `/new`**; là "session khởi động gần nhất trong tty", **không** theo dõi session đang hoạt động; không bị xoá khi omp thoát | đo |
| P3 | Hook/extension lấy session id trong tiến trình CLI | `ctx.sessionManager.getSessionId()` (tham số thứ 2 của handler) | giống hệt | đo |

Hệ quả cho bộ đọc writer id (đọc từ `docs/platform/session-identity/spec.md` và `packages/session-identity/rust/src/resolve.rs`): pi có thể đọc `PI_SESSION_ID` giống `CODEX_THREAD_ID`; omp **chưa có** biến nào, nên hoặc phải qua extension, hoặc dùng bản ghi `terminal-sessions` với độ tin cậy yếu (xem phép đo 2).

## Cách đo chung

- Môi trường tài khoản: lấy từ `~/.zshrc` đúng như hàm `pi`/`omp` làm: pi dùng `PI_CODING_AGENT_DIR=$HOME/.pi/accounts/openai-tetnu`, omp dùng `--profile=openai-tetnu`. Không sửa tài khoản, không đọc `auth.json` hay `models-store.json`.
- Mọi lần chạy đi qua `run-clean.sh`, bỏ biến kế thừa từ Claude Code, herdr, Codex (`CLAUDE*`, `CK_*`, `HERDR*`, `CODEX*`, `AGENT*`). Nhờ đó mọi biến `SESSION`/`HERDR`/`PANE`... còn thấy trong tiến trình con là do CLI tự đặt. Không có biến `PI_*`/`OMP_*` nào có sẵn từ trước (đã kiểm `env`).
- Thư mục làm việc: `.fgos/runtime/tmp/mailbox-probe3/cwd-pi` và `cwd-omp`. Lọc "session mới nhất" theo đường dẫn chứa `mailbox-probe3` để không lẫn session thật của chủ.
- Script đo: `probe-env.py` (chỉ in tên biến + từ phân loại, không in giá trị), `poll-ts.py` (ghi cấu trúc file khi đổi), `probe-ext-ctx.ts` (ghi tên trường, từ phân loại). Cả ba thoát với mã 0 và nuốt lỗi.

## P1: biến môi trường trong tool Bash (chế độ `-p`)

- **Mục đích**: xem CLI có xuất session id cho tiến trình con hay không.
- **Phương pháp**: `pi -p` và `omp -p`, một lượt, prompt buộc agent chạy một lệnh Bash `python3 -I probe-env.py <thư mục sessions>`. Lệnh in tên biến khớp `SESSION|THREAD|PI_|OMP_|HERDR|PANE|TERM` (loại tên chứa KEY/TOKEN/SECRET/PASSWORD/AUTH), từ phân loại (`uuid-like`/`path`/`number`/`other`), so với phần id trong tên file `.jsonl` mới nhất (`equals-id-of-newest-session-file`, `path-or-text-contains-id`, `differs`), pid, ppid, tên tiến trình tổ tiên, `tty`. Chạy pi lúc 15:48:47 đến 15:48:56; omp lúc 15:49:00 đến 15:49:11.
- **Kết quả đo, pi**:
  - `PI_SESSION_ID` loại `uuid-like`, **equals-id-of-newest-session-file**.
  - `PI_SESSION_FILE` loại `path`, `path-or-text-contains-id` (đường dẫn tới file session).
  - Biến `PI_*` khác (không phải id): `PI_CODING_AGENT` (other), `PI_CODING_AGENT_DIR` (path, do tôi đặt), `PI_MANAGED_INSTALL_ROOT` (path, do script `~/.pi/agent/bin/pi` export), `PI_MODEL`, `PI_PROVIDER`, `PI_REASONING_LEVEL` (other).
  - Không có `HERDR*`, `PANE*`, `THREAD*`. Chỉ còn `TERM`, `TERM_PROGRAM*`, `COLORTERM`, `XDG_SESSION_*`, `DBUS_SESSION_BUS_ADDRESS` (hệ điều hành, `differs`).
  - Tổ tiên: `pi` > zsh (shell của tôi) > ...; pid lệnh con 2012070, ppid 2009947 là `pi`. `not a tty`.
- **Kết quả đo, omp**:
  - **Không có biến session nào** (không `PI_SESSION_ID`, không `PI_SESSION_FILE`, không `OMP_SESSION*`). Cả danh sách đều `differs`.
  - Biến do omp đặt: `OMP_PROFILE`, `PI_PROFILE`, `PI_CODING_AGENT_DIR` (path, tôi không đặt nên là omp đặt), `__PI_NATIVE_VARIANT_CACHE`, `CARGO_TERM_PROGRESS_WHEN`, `GIT_TERMINAL_PROMPT`.
  - Tổ tiên: `omp` > zsh > ...; ppid là `omp`. `not a tty`.
- **Quan sát tĩnh (không phải đo thời gian chạy)**: chuỗi `PI_SESSION_FILE` có 4 lần trong binary `omp`, nằm cạnh `PI_ARTIFACTS_DIR`, `PI_TOOL_BRIDGE_*`, `PI_EVAL_LOCAL_ROOTS` trong một danh sách biến môi trường của **kernel công cụ `eval`**, chứ không thấy trong đường tool Bash. Khớp với kết quả đo (Bash không có). Tôi chưa chạy công cụ `eval` để xác nhận.
- **Chưa đo**: tool Bash trong REPL (chỉ đo chế độ `-p`; chủ yếu giả định môi trường giống nhau); biến khi chạy subagent, `--mode rpc`, hay `--session-id`/`--resume`; công cụ `eval` của omp; giá trị biến khi chạy trong herdr (đã cố ý bỏ biến herdr kế thừa, nên chưa biết CLI có giữ chúng không: các biến `HERDR_*` không xuất hiện, nhưng đó là do tôi gỡ chúng khỏi môi trường cha, không phải bằng chứng pi/omp tự xoá). Một lần chạy mỗi CLI.

## P2: bản ghi terminal sang session

### omp (REPL trong tmux riêng `-L mailbox-probe3`)

- **Mục đích**: biết `terminal-sessions/<tty>` chứa gì, có tên đúng session đang chạy không.
- **Phương pháp**: tmux server riêng; `omp --profile=openai-tetnu` trong pane có tty `/dev/pts/12`; `poll-ts.py` mỗi 0,3 s ghi cấu trúc file `~/.omp/profiles/openai-tetnu/agent/terminal-sessions/pts-12` mỗi khi đổi (chỉ số dòng, loại dòng, 8 ký tự đầu id, từ trạng thái, 8 ký tự đầu id có thể trùng giữa hai session gần nhau nên ghi thêm phần giờ trong tên file). Không có gì in ra ngoài cấu trúc. Lưu ý: với omp có `--profile`, thư mục là `~/.omp/profiles/<profile>/agent/terminal-sessions/`, không phải `~/.omp/agent/terminal-sessions/` (thư mục này chỉ còn `pts-1` cũ, không phải của lần đo này).
- **Cấu trúc đo được** (mỗi dòng một mục):
  - dòng 1: cwd (bằng cwd của pane);
  - dòng 2: đường dẫn tuyệt đối file session `.jsonl` dạng `<thời gian>_<id>.jsonl`;
  - dòng 3 (khi mới mở): từ trạng thái `fresh`; dòng này **xuất hiện lúc mở và biến mất ở tin nhắn đầu tiên**;
  - dòng cuối: `cwdstat <số 5 chữ số> <số 7 chữ số>`, khớp một thông tin gắn với thư mục (ý nghĩa **chưa xác minh**, không phải từ trạng thái).
- **Dòng thời gian đo được** (tất cả giờ 15:49 đến 15:52, ngày 2026-10-20):
  - 15:49:28 omp mở trong pts-12; file đã có: 4 dòng, `fresh`, trỏ vào session vừa tạo (file session tên theo giờ 08-49-28 UTC, tức đúng lúc mở).
  - 15:49:35 tin nhắn đầu tiên: `fresh` biến mất, còn 3 dòng, session path không đổi.
  - 15:50:11 một tool `sleep 8` (trong lúc chạy và sau khi xong): **file không đổi**, không có từ "running/busy".
  - 15:50:32 gõ `/new` (cùng tiến trình): **đổi ngay** dòng 2 sang file session mới (08-50-32 UTC), 3 dòng, không thêm `fresh`.
  - 15:50:51 `/exit`: **file không bị xoá và không đổi**; pts-12 vẫn trỏ vào session đã chết.
  - 15:51:04 pane mới (bash) tái sử dụng cùng tty pts-12, mở omp: trước khi mở, file cũ vẫn nguyên (bản ghi **cũ không bị dọn khi tty được tái dùng**); lúc mở, thêm `fresh` và (đo ở lần lặp sau) trỏ sang session mới; tin nhắn đầu xoá `fresh`.
  - 15:51:41 `Ctrl-Z` đưa omp #1 xuống nền: file không đổi.
  - 15:51:46 mở omp #2 trong **cùng terminal**: file **ghi đè ngay** sang session #2 (giờ 08-51-46), thêm `fresh`; tin nhắn đầu xoá `fresh`.
  - 15:52:04 thoát omp #2: file không đổi (vẫn #2, đã chết).
  - 15:52:10 `fg` về omp #1, 15:52:16 #1 trả lời tin nhắn mới (file session #1 được ghi lúc 15:52:16): **bản ghi vẫn trỏ session #2**, tức bản ghi **sai** so với session đang hoạt động.
- **Kết luận đo**: bản ghi là "session do omp khởi động hoặc `/new` gần nhất trong tty này, ghi đè, không xoá". Đúng khi chỉ có một omp trong tty và chưa `/new`-thoát-lặp. Sai khi: (a) omp thoát (bản ghi còn lại, cũ), (b) có hai omp trong cùng tty, omp thứ nhất hoạt động tiếp sau khi omp thứ hai khởi động, (c) tty được tái dùng. Từ trạng thái `fresh` chỉ nói "chưa có tin nhắn", không phải chỉ báo bận/rảnh.
- **Chưa đo**: ghi trạng thái khác `fresh` (chưa thấy từ nào khác); lúc đang có hộp thoại; `--resume`/`--continue` có ghi file không; có hai omp **đang cùng lúc** nhận tin mà không Ctrl-Z; omp chạy không qua tty (`-p`, trong khi đó tôi thấy `-p` không tạo bản ghi vì không có tty, nhưng **chưa kiểm** thư mục sau lần `-p`); `PI_SESSION_FILE` kiểu bản ghi cho `pts` của herdr; một tty không phải `pts`. Một lần chạy.

### pi

- **Mục đích**: pi có file liên kết terminal sang session không.
- **Phương pháp**: chạy pi REPL trong tmux (pty `/dev/pts/4`, 15:52:49), một lượt `ok6`, rồi liệt kê tên file trong `~/.pi` có mtime mới hơn mốc `ref-pi` (chỉ tên, không đọc `auth.json`/`models-store.json`). Đồng thời liệt kê thư mục `~/.pi/accounts/openai-tetnu/` (có `auth.json`, `bin`, `models-store.json`, `sessions`, `settings.json`, `trust.json`; không có `terminal-sessions` hay file tương tự).
- **Kết quả đo**: file mới/đổi chỉ gồm: thư mục `sessions/--...mailbox-probe3-cwd-pi--/` và file `.jsonl` mới của session; `models-store.json` (pi tự chạm, không đọc); thư mục `~/.pi/agent/install` (mtime đổi, chỉ là thư mục cài đặt được quản lý). **Không có bản ghi terminal sang session nào.**
- **Chưa đo**: thư mục `~/.pi/agent/` (khác `PI_CODING_AGENT_DIR` của tài khoản) chỉ liệt kê tên; tên session thư mục được mã hoá theo cwd (`--home-...--`), nên liên kết duy nhất của pi là cwd, chứ không phải tty. Không mở thư mục `node_modules` (bị chặn). Một lần chạy.

## P3: hook hoặc extension biết session id ở đâu

- **Mục đích**: biết trong tiến trình CLI, extension lấy session id bằng cách nào.
- **Phương pháp**: file extension `probe-ext.ts` cũ **không** ghi đối số của handler, nên không trả lời được. Tôi viết `probe-ext-ctx.ts` (trong thư mục scratch mới) gắn handler cho `agent_start`, `turn_end`, `agent_end`, `session_shutdown`, và ghi **tên trường** của đối số 0 (payload) và đối số 1 (context), cùng từ phân loại (không giá trị) của mọi trường/hàm không tham số có tên chứa `session|id|file|path`, so với id session mới nhất. Chạy `pi -p -e` và `omp -p -e`, mỗi bên một lần. Nhật ký: `ctx-pi.log`, `ctx.log` (omp).
- **Kết quả đo, cả hai CLI**: handler nhận **hai đối số**. Đối số 1 là context có trường `sessionManager`, và `sessionManager` có `getSessionId()` (uuid, **bằng id trong tên file session** từ `turn_end` trở đi), `getSessionFile()` (đường dẫn, chứa id), `getSessionDir()`, `getCwd()`, `getSessionName()`. Đối số 0 (payload) không có id session: `agent_start` chỉ có `type`; `turn_end` có `turnIndex, message, toolResults...`; `agent_end` có `messages`; `session_shutdown` có `type, reason` (pi) hoặc `type` (omp).
  - pi: `api` (đối tượng đầu tiên của extension) có `getSessionName`, `setSessionName`, nhưng **không có `getSessionId`**; id phải qua `ctx.sessionManager`.
  - omp: `api` là đối tượng khác (`pi, extension, runtime, cwd, events, logger, ...`), cũng không có hàm id trên `api`; id cũng qua `ctx.sessionManager`.
  - Tại `agent_start`, so với file session mới nhất cho ra `differs`: file session chưa được ghi nên "mới nhất" là file cũ. Không biết id ở `agent_start` có bằng id cuối hay không (xem chưa đo).
- **Cách khác không dùng được hoặc chưa dùng**: help của pi và omp (đã đọc `omp --help`, `pi --help`) chỉ có cờ `--session-id`, `--session`, `-r`, không mô tả biến môi trường session. Script bao `~/.pi/agent/bin/pi` (đọc được) chỉ `export PI_MANAGED_INSTALL_ROOT` và thêm node vào `PATH`, **không** đặt `PI_SESSION_ID`, nên biến đó do chính tiến trình pi đặt (nguồn nằm trong `node_modules`, **bị chặn**, không mở). Tài liệu chính thức cục bộ: không tìm thấy bản nào ngoài help.
- **Chưa đo**: id ở `agent_start` so với id cuối; handler ở các sự kiện khác (ví dụ khi `/new`, `/resume`, compact: id có đổi tại chỗ không); `sessionManager` sau `/new` trong REPL; có cách nào để extension xuất id ra tiến trình con của omp (vd. `invokeTool`, hay `exec` của api pi) hay không. Một lần chạy mỗi CLI.
- **Ghi chú vận hành, chưa chẩn đoán**: lần chạy đầu của `probe-ext-ctx.ts` trên pi treo hơn 2 phút, không ghi sự kiện nào và không tạo file session mới (đã dừng bằng SIGTERM). Khác lần chạy sau ở hai điểm: danh sách sự kiện có `session_start` và `turn_start`, và stdin không nối `/dev/null`. Chưa tách ra yếu tố nào gây treo. Người viết adapter nên đặt hạn giờ và nối stdin khi chạy `-p` bằng script.

## Khuyến nghị theo phép đo (xếp hạng)

1. **pi**: đọc `PI_SESSION_ID` (đo được) cho writer id; giữ extension `ctx.sessionManager.getSessionId()` làm dự phòng. Đây là đường duy nhất vừa đơn giản vừa đo được.
2. **omp**: dùng extension tải khi mở (`ctx.sessionManager.getSessionId()`) để đăng ký writer id, vì biến môi trường Bash không có. Bản ghi `terminal-sessions/pts-N` chỉ nên dùng làm gợi ý: nó sai khi omp thoát, khi có hai omp trong một tty, và khi tty được tái dùng.
3. Không dùng liên kết terminal sang session cho cả hai CLI ở mức "nguồn thẩm quyền": pi không có, omp có nhưng không theo dõi session hoạt động.

## Phạm vi không đo (tóm tắt)

- Chỉ một lần mỗi phép đo; chế độ in cho P1; REPL cho P2; omp `-p` và REPL cho P3 (REPL của pi cho P2).
- Không đo trong herdr (xem P1). Không đo subagent, `--resume`, `--continue`, `--session-id`, `/resume`.
- Không mở `node_modules` (bị chặn bởi hook), nên **không** có nguồn mã để giải thích vì sao pi đặt `PI_SESSION_ID` còn omp thì không.

## Dọn dẹp và thứ còn lại

- tmux server `mailbox-probe3` đã tắt (kiểm `no server running`); không còn tiến trình `poll-ts`/`probe-ext-ctx`. `git status` giống lúc bắt đầu (thư mục scratch bị gitignore); không commit, không sửa tệp nào khác trong repo.
- Còn lại do CLI tự ghi (không xoá, theo quy ước chỉ ghi những gì CLI tự làm): file session trong `~/.pi/accounts/openai-tetnu/sessions/--...mailbox-probe3-cwd-pi--/` (4 file) và `~/.omp/profiles/openai-tetnu/agent/sessions/-...mailbox-probe3-cwd-omp/` (6 file); `terminal-sessions/pts-12` (bản ghi cũ trỏ session đã chết, đúng như đã đo); lịch sử (`history.db`) và `models-store.json` có thể đổi mtime do CLI.
- Scratch trong `/home/vantt/projects/forgent/.fgos/runtime/tmp/mailbox-probe3/`: `probe-env.py`, `poll-ts.py`, `probe-ext-ctx.ts`, `run-clean.sh`, `tm.sh`, `cwd-pi/`, `cwd-omp/`, `x-pi/`, `x-omp/` (rỗng), các nhật ký `p1-pi.out`, `p1-omp.out`, `p2-omp.log`, `p2b-omp.log`, `p2c-omp.log`, `ctx-pi.log`, `ctx.log`, `ref-pi`, `poller-*.pid` (tiến trình đã kết thúc).

## Câu hỏi còn mở

1. Vì sao pi đặt `PI_SESSION_ID` còn omp không? Cần đọc nguồn trong `node_modules` hoặc hỏi chủ dự án (bị chặn, không vòng).
2. `PI_SESSION_ID` có đổi khi `/new` hay `/resume` trong REPL pi không (tiến trình con mới có thấy giá trị mới)? Chưa đo.
3. `cwdstat` trong bản ghi omp là gì (ý nghĩa hai số)? Chưa xác minh.
4. Treo của pi ở lần chạy đầu của probe extension: do `session_start`/`turn_start` hay do stdin?
5. Trong herdr, pi/omp có giữ các biến `HERDR_*` ở tool Bash không (do môi trường kế thừa bị gỡ nên chưa biết)?

Status: DONE_WITH_CONCERNS
Summary: pi 1.3.0 xuất `PI_SESSION_ID` và `PI_SESSION_FILE` cho tool Bash (đo); omp 18.11.2 không xuất biến session nào (đo). Cả hai lộ id qua `ctx.sessionManager.getSessionId()` trong extension (đo). omp ghi `terminal-sessions/pts-N` nhưng đó là session khởi động gần nhất, không phải session đang chạy; pi không có bản ghi terminal sang session.
Concerns/Blockers: mỗi phép đo một lần; không mở `node_modules` nên không có nguồn giải thích; một lần chạy probe extension trên pi bị treo chưa rõ nguyên nhân.
