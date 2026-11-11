---
type: research
date: 2026-11-10
source: getpaseo/paseo@f68480482197d1b415a41d6197072d275d926bfa (clone nông, đọc source)
related: docs/platform/agent-mailbox/spec.md, docs/distillery/deep-dives/agent-mailbox-delivery.md
---

# Paseo gửi tin tới agent như thế nào, và fgOS học được gì

## Kết luận

Paseo không có mẹo nào để nhét tin vào một phiên TUI đang chạy. Nó gửi tin tốt vì **chính nó khởi động mọi agent**: mỗi agent là một tiến trình con không có TUI, nói chuyện qua giao thức máy của từng CLI (Claude Agent SDK, `codex app-server`, `pi --mode rpc`, `omp --mode rpc`, `agy --input-format stream-json`, ACP). Daemon giữ stdin/stdout và biết chính xác turn nào đang chạy. Vì vậy:

- Agent đang rảnh thì việc đánh thức chỉ là mở một turn mới (`startTurn`). Không cần hook, không cần gõ phím vào màn hình, không cần poll.
- Agent đang bận thì tin được "steer" vào turn đang chạy bằng lệnh riêng của giao thức. CLI nào không có steer thì daemon ngắt turn rồi thay bằng turn mới, hoặc từ chối.

Mailbox của fgOS khó vì nó nhắm vào loại người nhận ngược lại: các head tương tác do người dùng tự mở (spec mailbox, mục 1 và 15.6–15.7). Với loại này CLI chỉ cho hook ở điểm dừng, không có cách đánh thức khi rảnh. Paseo né hẳn bài toán đó bằng cách thay TUI của CLI bằng UI của chính nó (app desktop, mobile, web).

Hệ quả cho fgOS: mượn được cách của paseo **cho những agent fgOS tự khởi động**, không mượn được cho TUI người dùng tự mở. Có thêm năm mảnh nhỏ đáng mượn bất kể đường truyền (mục "Mảnh mượn được").

## Đường đi của một tin trong paseo

### 1. Cửa gửi: tool `send_agent_prompt`

`packages/server/src/server/agent/tools/paseo-tools.ts` (khoảng dòng 1283 và 1967–2075). Agent gọi tool này (qua MCP hoặc tool gốc của provider). Khi bên gọi là agent:

- `activeTurnBehavior` mặc định là `steer` (khi người gửi thì mặc định `interrupt`).
- `notifyOnFinish` mặc định `true`: daemon đăng ký theo dõi bên nhận và báo lại cho bên gửi khi bên nhận xong, lỗi hoặc cần quyền. Lời dặn trả về cho bên gửi: "Do not poll for status; continue with other work until the notification arrives."
- Trả ngay biên lai `{deliveryStatus: "queued", messageId}`; lúc này chưa giao.

### 2. Hàng đợi theo người nhận: `agent-messages/delivery.ts`

- Mỗi người nhận có một hàng đợi. Mỗi tin mới đặt lại bộ hẹn giờ 2 giây; hết 2 giây yên lặng thì xả cả nhóm thành **một** prompt (các phong bì nối nhau). Đây là chống bão tin bằng gom, không bằng chặn.
- Tin có `activeTurnBehavior` hay `sessionMode` khác nhau thì tách thành các lần giao riêng, giữ thứ tự.
- Các lần giao cho cùng người nhận chạy nối tiếp (chuỗi promise), không chồng nhau.
- Biên lai có promise `dispatched` trả về một trong ba kết quả: `steered` (đã chèn vào turn đang chạy), `turn_started` (đã mở turn mới), `out_of_band` (lệnh điều khiển như `/goal pause` chạy mà không ngắt turn).
- Đóng daemon thì xả hết hàng đợi và đợi provider xác nhận.

### 3. Steer hay thay turn: `agent-manager.ts` `steerOrReplaceActiveTurn`

- Đợi turn đang khởi động có id rồi mới steer, để không làm mất prompt của turn đó.
- Gọi `session.steerActiveTurn(prompt, {expectedTurnId})`. Mọi provider đều so `expectedTurnId` với turn hiện tại trước và sau mỗi bước `await`; lệch là trả `unavailable`, không bao giờ steer nhầm turn kế tiếp.
- `accepted` thì ghi tin vào timeline. `unavailable` thì ngắt turn hiện tại và mở turn mới với prompt đó (`replaceAdmittedForegroundTurn`).

### 4. Từng CLI làm steer thế nào

| CLI | Cách paseo chạy | Rảnh: mở turn | Bận: steer |
|---|---|---|---|
| Claude Code | Claude Agent SDK, input là một async iterable sống | đẩy `SDKUserMessage` | đẩy `SDKUserMessage` với `priority: "next"` vào chính input stream đang mở (`providers/claude/agent.ts`, `steerActiveTurn`) |
| Codex | `codex app-server`, JSON-RPC qua stdio | `turn/start` | `turn/steer {threadId, expectedTurnId, input}`; Codex trả lại `turnId` và paseo kiểm nó khớp (`codex-app-server-agent.ts`) |
| pi | `pi --mode rpc`, JSONL | prompt | lệnh RPC `{type:"steer", message}`; bản pi cũ trả "Unknown command: steer" thì rơi về thay turn (`providers/pi/agent.ts`) |
| omp | `omp --mode rpc`, JSONL | prompt | `{type:"steer"}`, có thêm `streamingBehavior: "steer" \| "followUp"` (`providers/omp/`) |
| agy | plugin `plugins/antigravity-provider`, chạy `agy --input-format stream-json --output-format stream-json --dangerously-skip-permissions [--conversation <id>]` | ghi một dòng JSON vào stdin | **không có**: `prompt.ts` ném "Antigravity supports messages only" khi `delivery === "steer"`; session từ chối khi đã có turn đang chạy. Tin tới agy lúc bận vì vậy rơi vào nhánh ngắt rồi thay turn |
| Copilot, Cursor, Kimi… | ACP (`acp-agent.ts`) | `session/prompt` | theo khả năng của ACP |

### 5. Phong bì và chống giả danh: `agent-messages/envelope.ts`

- Tin của agent được bọc `<paseo-system version="1" kind="agent-message" source-agent-id=… message-id=…>`, nội dung được escape XML nên thẻ đóng trong thân tin không phá được phong bì.
- Nếu người dùng tự gõ một chuỗi trông như phong bì, paseo cũng bọc nó lại với `kind="user-message"`, nên agent nhận không thể bị lừa rằng tin của người là tin hệ thống, và ngược lại.
- Cùng một hàm chiếu (`projectAgentMessages`) xử lý tin vừa gửi, tin provider phát lại khi resume và tin import, nên tin của agent hiện trong timeline như một mục `agent_message`, không như lời người dùng.

### 6. Báo ngược khi xong: `finish-subscriptions/`

Đăng ký theo dõi được lưu bền (store JSON), sống qua daemon khởi động lại. Khi bên nhận `finished | errored | permission-required | closed`, daemon gửi một phong bì `kind="agent-notification"` về bên gửi **qua chính hàng đợi ở bước 2**. Một đăng ký mới cho cùng cặp gửi–nhận thay đăng ký cũ; giao thất bại thì giữ đăng ký cũ.

### 7. Phiên cũ, phiên import

Agent đã đóng hay đã lưu trữ được mở lại từ `describePersistence()` (id phiên của provider) rồi mới giao. "Import" là nhận quyền sở hữu một phiên cũ của CLI rồi resume nó dưới daemon, không phải gắn vào một TUI đang chạy.

## So với mailbox của fgOS

| Chiều | paseo | fgOS mailbox (spec hiện tại) |
|---|---|---|
| Người nhận | tiến trình con không TUI do daemon khởi động | head tương tác người dùng tự mở; Unit của runner không địa chỉ được |
| Kênh | giao thức máy của CLI (stdin/stdout) | hook `Stop`/`PostToolUse`; `codex queue` cho Codex rảnh |
| Đánh thức khi rảnh | luôn được: mở turn mới | Claude: không mặc định; Codex: 0–10 s qua `codex queue`; agy: không |
| Bận | steer gốc của CLI, kiểm `expectedTurnId` | xả ở điểm hook kế tiếp: Claude 1,9 s, Codex 39,6 s, agy 45,3 s (spec mục 7) |
| CLI thiếu steer | ngắt rồi thay turn | đợi điểm dừng |
| Daemon | có, bắt buộc | không (V-011, mục 2 của spec) |
| UI cho người | UI riêng của paseo, không còn TUI gốc | TUI gốc của CLI trong herdr pane |

Paseo cũng phản bác một giả định trong spec mailbox mục 15.7: "a headless worker cannot be woken by a typed signal and has no idle state to wake (it runs one Unit and exits)". Điều đó chỉ đúng với `claude -p`/`codex exec` chạy một lần. Một tiến trình giao thức sống lâu (`codex app-server`, `pi --mode rpc`) có trạng thái rảnh thật và đánh thức được tức thì.

## Mảnh mượn được

Theo RUL104, đây là danh sách ý, chưa làm gì. Mỗi ý ghi vấn đề thật, bằng chứng và lợi ích.

1. **Adapter giao thức cho agent fgOS tự khởi động.** Vấn đề: Codex rảnh mất tới 10 s qua `codex queue`, agy rảnh thì không đánh thức được, Codex bận phải đợi hết tool (39,6 s). Bằng chứng: spec mailbox mục 7; paseo dùng `turn/steer` và `turn/start` của `codex app-server`, `steer` của pi/omp. Lợi ích: tier `push` thật cho Codex, pi, omp; đánh thức tức thì. Cái giá: người nhận phải được fgOS khởi động ở chế độ giao thức và không còn TUI gốc, nên cần một chỗ khác để người xem; và cần một tiến trình sống giữ stdin, chạm vào V-011. Đây là câu hỏi quyết định, không phải việc tự làm.
2. **Biên lai có kết quả giao.** `queued` ngay, sau đó `steered | turn_started | out_of_band`. Bằng chứng: `delivery.ts`, `agent-prompt.ts`. Lợi ích: khớp với "biên lai có lý do" đã có trong deep-dive; nếu verb `fgos mailbox send` đã trả trạng thái thì chỉ cần đối chiếu tên.
3. **Gom theo 2 giây yên lặng cho mỗi người nhận.** Vấn đề: nhiều tin liền nhau tạo nhiều lần xả. Bằng chứng: `delivery.ts`, bộ hẹn giờ 2000 ms đặt lại mỗi tin. Lợi ích: một lần xả mang nhiều tin; rẻ, chỉ ở lõi.
4. **Báo ngược khi bên nhận xong (`notifyOnFinish`).** Vấn đề: agent gửi việc rồi poll trạng thái tốn token. Bằng chứng: `finish-subscriptions/`, lời dặn "Do not poll". Lợi ích: bên gửi tiếp tục việc khác. Cần bên nhận có tín hiệu "xong" (với head TUI thì là hook `Stop`), nên đây là phần sau, thuộc spec mục 15.1.
5. **Quote tin người gõ khi nó trông như phong bì.** Bằng chứng: `prepareAgentMessage` trong `envelope.ts`. Lợi ích: đóng một đường giả danh theo cả hai chiều; cần kiểm khung thư hiện tại của fgOS (spec mục 5.5) đã có chưa.

Ngoài ra, quy tắc `expectedTurnId` (so lại turn trước và sau mỗi `await`, lệch thì từ chối) là mẫu tốt cho bất kỳ adapter push nào sau này.

## Không mượn

- Mặc định ngắt rồi thay turn khi CLI không có steer. Với agent tự trị, việc này huỷ công việc dở; paseo chỉ dám làm vì UI của họ cho người thấy ngay.
- `--dangerously-skip-permissions` cho agy. Paseo chạy agy như vậy để có headless; fgOS không nên mặc định điều đó.

## Chạy thử daemon paseo (2026-11-11)

Cài `@getpaseo/cli@0.15.4` vào `.fgos/runtime/tmp/paseo-run/` (581 MB), chạy `paseo daemon run` với `PASEO_HOME` riêng, cổng 6797, tắt relay. Tài khoản đi qua `agents.providers.<id>.env|command` trong `config.json`: `CODEX_HOME`, `PI_CODING_AGENT_DIR`, `omp --profile=…`, `HOME` cho agy. Mỗi bài thử: giao một lệnh ngủ 45 giây, khoảng 12 giây sau gửi `paseo send --behavior steer`. Thời điểm lấy từ transcript của chính CLI (rollout Codex, session pi, transcript Claude).

| CLI | Tin tới model sau khi gửi | Diễn biến |
|---|---|---|
| Codex | 22,5 s | Tool exec của Codex tự trả về sau 30 s dù lệnh còn chạy; tin vào ở chỗ đó, model trả lời ngay ("đang đợi lệnh"), rồi quay lại đợi lệnh. Lệnh không bị giết |
| Claude (SDK, chế độ bypass) | 32,7 s | Tin vào hàng đợi ngay nhưng model chỉ thấy khi lệnh xong |
| pi | 14,3 s | Đúng lúc lệnh xong (phần thời gian còn lại của lệnh) |
| agy | ngắt ngay | Không có steer: paseo huỷ turn, **lệnh đang chạy bị giết**, turn mới trả lời tin |
| Codex lúc rảnh | 0,4 s (trả lời sau 1,4 s) | mở turn mới |
| Claude lúc rảnh | 0,4 s (trả lời sau 3,7 s) | mở turn mới |

Ghi thêm:
- Claude ở chế độ mặc định `auto` đang chờ duyệt quyền thì tin steer gửi từ CLI từ chối luôn quyền đó, tool bị huỷ trước khi chạy.
- Claude Code chặn một lệnh `sleep` chạy foreground nối với lệnh khác, nên bài thử Claude dùng `python3 -c "time.sleep(45)"`.
- Daemon mặc định tải model giọng nói cục bộ (71 MB) và bật sẵn mọi provider (omp thì tắt). npm chặn install script của `node-pty`, nên terminal của paseo có thể không chạy; agent thì vẫn chạy.
- Gửi từ CLI không có 2 giây gom; agent gửi qua tool thì có.

Kết luận đo: lúc bận, paseo không nhanh hơn hook của fgOS. Chỉ Codex có ranh giới 30 s nhờ tool exec tự trả về. Lúc rảnh thì đánh thức mất dưới 0,5 s cho mọi CLI có giao thức.

## Thử chen lệnh khởi động (2026-11-11)

Provider riêng `fgos-codex` (`extends: "codex"`, `command` trỏ tới một wrapper shell ghi log rồi `exec codex "$@"`), provider `codex` của người dùng không bị đụng.

- Paseo gọi wrapper cả khi dò, không có agent nào: 6 lần `--version` và 1 lần `app-server` (lấy danh sách model) lúc khởi động, thêm 2 lần `--version` trước mỗi agent. Các lần này không mang `FGOS_ATTEMPT`, nên gate thật phải cho chạy thẳng khi không có biến đó.
- `paseo run --env FGOS_ATTEMPT=att-test-1` tới được wrapper; argv là `app-server --enable goals`; `env` của provider (`CODEX_HOME`) cũng tới.
- Sau `exec`, tiến trình codex giữ đúng PID của wrapper, cha là daemon worker của paseo.
- Steer giữa lệnh `sleep 40` vẫn chạy như với provider gốc: tin vào ở mốc 30 s của tool exec, model trả lời "BANANA — I'm still waiting…", lệnh không bị giết.

## Tên dùng cho spike

| Thứ | Tên | Lý do |
|---|---|---|
| Provider trong paseo | `fgos-<cli>` (`fgos-codex`, `fgos-pi`, `fgos-omp`, `fgos-claude`, `fgos-agy`), label `<CLI> (fgOS)` | tách khỏi provider gốc của người dùng; `<cli>` theo id CLI của fgOS, không theo id của paseo (`antigravity`) |
| Lệnh paseo gọi (`command`) | `fgos exec <cli>` (paseo nối tham số giao thức sau, ví dụ `fgos exec codex app-server`) | verb công khai và chung cho mọi trình chủ ngoài khởi động CLI qua một tiền tố lệnh (paseo, client ACP, `pathToClaudeCodeExecutable` của Claude Agent SDK); bên trong đi qua gate. Không dùng `internal gate` vì route `internal` là giao thức riêng giữa supervisor và gate, không phải cửa cho công cụ ngoài. Chưa có verb `exec` nào trong host |
| Biến theo từng agent | `FGOS_ATTEMPT_DIR` (đường dẫn tuyệt đối tới thư mục attempt) | chưa có biến `FGOS_ATTEMPT*` nào trong repo; vắng biến thì `fgos exec` chạy thẳng CLI (lệnh dò của trình chủ) |
| Chế độ trong envelope | `external`, cạnh `direct` và `terminal` | tên chung, không gắn vào paseo, để driver khác cắm được (nguyên tắc 3) |
| Adapter của runner | `paseo-spawn`, cạnh `cli-spawn` và `herdr-spawn` | theo mẫu tên adapter đang có |
| Daemon paseo chết giữa attempt | dùng lại outcome `carrier-lost` | cùng nghĩa với pane mất ở terminal mode |

## Câu hỏi mở

1. Owner có muốn mở một loại người nhận thứ hai cho mailbox, là "agent do fgOS khởi động ở chế độ giao thức", hay giữ phạm vi head tương tác? Câu trả lời quyết định ý số 1 và việc có chạm V-011 hay không.
2. Codex TUI có thể gắn vào một `codex app-server` đang chạy để vừa giữ TUI cho người vừa có `turn/steer` cho mailbox không? Chưa kiểm trong phiên này; nếu có, đó là đường giữ được cả hai.
3. Claude Code TUI có kênh tương đương `priority: "next"` từ bên ngoài không (ngoài socket nhắn tin mà reason-network dùng, spec mục 7.2)? Chưa kiểm.
4. agy có chế độ nào nhận tin khi đang chạy không? Chính paseo nói là không.
