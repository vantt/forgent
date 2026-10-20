# Đo thật S0: hook "người gõ prompt" và hook có phân biệt được tin của peer không (Claude Code, Codex, agy); vì sao `codex queue` mất ~10 s

## Tổng hợp nhanh

Môi trường: Claude Code **2.1.304** (model `haiku`), Codex **0.162.1** (model `gpt-6-luna`; có bản 0.163.0 mới, chưa cập nhật), agy **1.4.2** (model `gemini-3.8-flash-low`). Máy của chủ dự án, 2026-10-20 khoảng 16:14 đến 16:32 (Asia/Saigon). Mọi CLI chạy trong tmux riêng `mailbox-probe5`, đã gỡ toàn bộ biến `HERDR_*` (kiểm tra: môi trường của server tmux không có `HERDR`). Mỗi phép đo chạy một đến vài lần, nên không có phân phối chắc chắn trừ U3 Codex.

| # | Câu hỏi | Kết quả (đã đo) | Còn thiếu |
|---|---|---|---|
| U1 Claude | Hook khi người gõ prompt | **Có.** `UserPromptSubmit`, bắn trong REPL. Khoá payload: `cwd, hook_event_name, permission_mode, prompt, prompt_id, scratchpad_dir, session_id, transcript_path` | gõ bằng bàn phím thật (tôi gõ qua `tmux send-keys`) |
| U1 Codex | Hook khi người gõ prompt | **Có.** `UserPromptSubmit`, bắn trong REPL. Khoá: `cwd, hook_event_name, model, permission_mode, prompt, session_id, transcript_path, turn_id` (schema trong binary còn `agent_id`, `agent_type` cho subagent) | như trên; cần `--dangerously-bypass-hook-trust` hoặc hook đã được tin |
| U1 agy | Hook khi người gõ prompt | **Không có.** Sáu sự kiện tài liệu hoá: `SessionStart, PreToolUse, PostToolUse, PreInvocation, PostInvocation, Stop`. Tên `UserPromptSubmit` (và ba tên đoán khác) khai trong `hooks.json` được nạp im lặng và **không bao giờ bắn**. Payload không có văn bản prompt. Gần nhất: `PreInvocation` với `invocationNum == 0` = "một lượt mới bắt đầu" (từ bất kỳ đầu vào nào) | sự kiện nào khác ngoài danh sách tài liệu (đã tìm trong chuỗi của binary và thử bốn tên) |
| U2 Claude | Hook có bắn khi peer gửi (socket, `accept` qua `--settings`)? Payload có khác? | **Bắn** (18 ms sau lần ghi socket). **Payload cùng tập khoá, không có trường nguồn**; `prompt` chỉ là nội dung gốc người gửi (khung "Another Claude session sent a message" thêm sau, không vào payload). **Nhưng phân biệt được qua transcript:** bản ghi user có `origin.kind` (`human` / `peer`), `promptSource` (`typed` / `system`), `turnOrigin` (`human` / `peer`). Bản ghi này **chưa có lúc `UserPromptSubmit` chạy** (0/4 lần thấy trong 1,5 s) nhưng **có ngay lúc `Stop`** (2/2, 1 đến 2 ms), nối bằng `prompt_id` (có trong cả hai payload) | `PostToolUse` giữa lượt; nhiều tin trong một lượt |
| U2 Codex | Như trên, qua `codex queue` | **Bắn.** Payload **cùng tập khoá, không có trường nguồn**. Phân biệt được qua rollout (`transcript_path`): `task_started.turn_attribution.turn_trigger` = `user` (người gõ) hay `queue` (tin từ `codex queue`), có sẵn **ngay lúc `UserPromptSubmit`** (10/10 lần đọc ở lần thử đầu) | queue khi session bận; thứ tự nhiều tin |
| U2 agy | Typed-signal một dòng | Hook bắn như lượt của người: `PreInvocation` `invocationNum 0`, **payload y hệt**. Transcript ghi cả hai là `source: USER_EXPLICIT, type: USER_INPUT`, **không có trường nguồn**. Khác duy nhất là **chữ**: nội dung nằm trong `<USER_REQUEST>…</USER_REQUEST>`; bản ghi đã có lúc `PreInvocation 0` chạy. Vậy chỉ nhận ra bằng nhãn `[fgOS: …]` trong chữ | hook tự đối chiếu nhãn (xem phần agy: bộ kiểm của tôi sai vì bỏ sót khung `<USER_REQUEST>`) |
| U3 | 10 s của `codex queue` ở đâu | **Là một nhịp quét 10 s bên trong Codex, không phải lệnh `queue` và không phải màn hình.** Lệnh trả về sau 0,03 đến 0,17 s; hook đầu của lượt mới (`UserPromptSubmit`) đến sau 1,6 đến 9,9 s (trung bình 6,9 s, 8 lần pha ngẫu nhiên); màn hình hiện tin 0,01 đến 0,06 s sau hook. Pha của nhịp **cố định theo từng tiến trình REPL** (`t mod 10` lệch tối đa 0,03 s qua 13 lần). Con số "khoảng 10 s" trước đây đến từ phép đo mà các lần cách nhau đúng 20 s, nên luôn rơi cùng pha. Thực tế: **0 đến 10 s, kỳ vọng 5 s**, cộng 1,3 đến 4,4 s model tới câu trả lời | tiến trình nào giữ nhịp quét; có chỉnh được không |
| U3 `--no-daemon` | `codex queue` có chạm tới REPL `--no-daemon` | **Có.** Cờ có trong 0.162.1. REPL `--no-daemon` nhận tin, cùng nhịp 10 s (4 lần: 2,1 đến 7,3 s). Trong cả ba cấu hình thử (không có daemon, có daemon + REPL mặc định, có daemon + `--no-daemon`) REPL tự giữ file rollout và khoá luồng, nên đây là REPL nhúng, không phải kết nối daemon | chưa thử REPL gắn thật vào daemon (`--remote`); chưa biết ai đọc `queue_1.sqlite` |

Kết luận cho spec (chỉ nêu điều đo được ủng hộ; quyết định thuộc chủ dự án):
- Câu hỏi 6 của mục 16 và cơ chế mục 5.4: **Claude Code và Codex có hook "người gõ prompt", agy không.** Nhưng hook đó **cũng bắn cho tin peer**, với payload không phân biệt được. Vì vậy `UserPromptSubmit` một mình **không** làm tín hiệu "người vừa gõ" để reset ngân sách; cần thêm bước tra nguồn gốc: Claude qua `origin.kind` trong transcript tại `Stop` (nối `prompt_id`), Codex qua `turn_trigger` trong rollout (đọc được ngay tại `UserPromptSubmit`).
- agy không có tín hiệu nào tách được người với typed-signal ngoài nhãn trong chữ; theo mục 5.4, agy dùng cửa sổ trượt 10 phút, hoặc đối chiếu nhãn `[fgOS:` trong transcript (khả thi theo phép đo nhưng chưa chạy đúng).
- Mục 7 và câu hỏi 4: con số "khoảng 10 s" cho Codex nên đổi thành "nhịp quét 10 s, 0 đến 10 s". Đây là độ trễ của Codex, không đo được từ ngoài bằng cách đọc màn hình.

## Cách đo chung

- Binary gọi trực tiếp (`/home/vantt/.local/bin/{claude,codex,agy}`), không qua hàm bọc của shell. Mọi lệnh khởi chạy qua `tm.sh` dùng `env -u HERDR_PANE_ID -u HERDR_TAB_ID -u HERDR_WORKSPACE_ID -u HERDR_ENV -u HERDR_SOCKET_PATH -u HERDR_BIN_PATH` (đủ cả sáu biến `HERDR_*` có trong môi trường).
- Hook `hooklog.py` (một file cho cả ba CLI, luôn `exit 0`, bắt mọi lỗi, không in stdout): ghi mốc thời gian, **tên khoá** của JSON, kiểu giá trị, **độ dài** `prompt`, giá trị của vài trường ngắn kiểu enum (tên sự kiện, chế độ quyền, `source`, model…), 8 ký tự đầu của các id. Không ghi văn bản prompt.
- "Người gõ" = gõ vào REPL qua `tmux send-keys -l` rồi Enter. Đây là đường stdin của terminal giống bàn phím thật, nhưng chưa phải bàn phím thật.
- Mỗi CLI chạy đúng tài khoản đang bật (Claude: tài khoản mặc định; Codex: thư mục home cô lập trong scratch, `auth.json` là symlink tới tài khoản `tetnu`, đã gỡ symlink khi dọn; agy: `HOME=~/.agy-homes/tetnu`). Không đọc file xác thực.
- Prompt rất ngắn ("Reply with exactly the word H1"). Tài khoản Codex hiển thị "5h limit: 13% left" từ trước khi tôi bắt đầu; tổng cộng tôi chạy khoảng 25 lượt Codex ngắn.

## U1. Hook "người gõ prompt"

### Claude Code 2.1.304
- Phương pháp: REPL, `--settings` chứa hook `UserPromptSubmit` và `Stop`; gõ "Reply with exactly the word H1".
- Quan sát: `UserPromptSubmit` bắn ở +0,0 s, `Stop` +1,2 s, màn hình `● H1`. Khoá payload: `cwd, hook_event_name, permission_mode, prompt, prompt_id, scratchpad_dir, session_id, transcript_path`. `prompt_len` = 30 = độ dài đúng của câu gõ. `permission_mode` = `bypassPermissions`. Khoá `Stop`: `background_tasks, cwd, effort{level}, hook_event_name, last_assistant_message, permission_mode, prompt_id, scratchpad_dir, session_crons, session_id, stop_hook_active, transcript_path`.
- Không đo: bàn phím thật; lệnh slash (`/compact`...) có kích hoạt hay không; prompt dán nhiều dòng.

### Codex 0.162.1
- Nguồn tĩnh: `codex --help` có `--dangerously-bypass-hook-trust`; binary chứa schema `user-prompt-submit.command.input`: `agent_id?, agent_type?, cwd, hook_event_name (const "UserPromptSubmit"), model, permission_mode, prompt, session_id, transcript_path, turn_id`; không có khoá nguồn trong schema. Đầu ra hook có `decision: "block"`, `hookSpecificOutput.additionalContext`.
- Phương pháp: REPL trong thư mục home cô lập, `hooks = true`, `hooks.json` có `SessionStart, UserPromptSubmit, Stop`, chạy với `--dangerously-bypass-hook-trust`; gõ một câu.
- Quan sát: `SessionStart` (source `startup`) rồi `UserPromptSubmit` cách nhau 0,016 s, `Stop` +1,4 s. Khoá thực đo trùng schema (không có `agent_*` vì không phải subagent). `prompt_len` = 30. Hook bắn ở lần gõ đầu tiên của REPL (SessionStart cũng chỉ bắn ở lúc đó, không phải lúc mở REPL).
- Không đo: hook chưa được tin (đã đo ở báo cáo 261019: bị bỏ qua im lặng).

### agy 1.4.2
- Nguồn tĩnh: tài liệu `hooks.json` nhúng trong binary liệt kê đúng sáu sự kiện: `SessionStart` (phẳng), `PreToolUse` và `PostToolUse` (lồng `matcher`), `PreInvocation`, `PostInvocation`, `Stop` (phẳng). Mục "Common Input Fields": `conversationId, workspacePaths, transcriptPath, artifactDirectoryPath, modelName`. Không có văn bản prompt ở sự kiện nào.
- Phương pháp: `.agents/hooks.json` trong thư mục thử (khoá cấp một là tên hook; hai guard của repo ở `/home/vantt/projects/forgent/.agents/hooks.json` cũng được nạp, log agy: "loaded 4 named hooks from 2 hooks.json file(s)"), hook log cho `SessionStart, PreInvocation, PostInvocation, Stop`; thêm hook thứ hai khai bốn tên không có trong tài liệu: `UserPromptSubmit, UserPromptSubmitted, BeforeSubmit, PreUserPrompt`.
- Quan sát lượt người gõ: `SessionStart` (+0,0 s, chỉ ở lượt đầu của hội thoại), `PreInvocation` (+0,02 s; khoá `artifactDirectoryPath, conversationId, initialNumSteps, invocationNum, modelName, transcriptPath, workspacePaths`), `PostInvocation`, `Stop` (khoá `conversationId, error, executionNum, fullyIdle, terminationReason, …`). Lượt có một tool: `PreInvocation` `invocationNum` 0 rồi 1, `Stop` `executionNum` 0, `fullyIdle` true, `terminationReason` `NO_TOOL_CALL`. Vậy `invocationNum == 0` đánh dấu lần gọi model đầu tiên của một lượt do đầu vào mới (cả lượt đầu, lượt hai, lượt typed-signal đều 0).
- Bốn tên đoán: file được nạp (số hook nạp tăng), **không có dòng nào** trong log của hook thứ hai sau lượt người gõ, và log agy không báo lỗi. Kết luận: không có sự kiện đó.
- Không đo: sự kiện ngoài danh sách tài liệu mà binary có thể hỗ trợ không công bố; `--input-format stream-json` chỉ cho chế độ in.

## U2. Hook người gõ có bắn cho tin peer không, payload có khác không

### Claude Code (socket, `crossSessionInbound: accept` chỉ qua `--settings` của tiến trình nhận)
- Phương pháp: REPL đang rảnh; `sockwrite.py` ghi `{"type":"user","message":{"role":"user","content":"…"}}` + xuống dòng vào `messagingSocketPath` đọc từ `~/.claude/sessions/<pid>.json` (pid là pid của chính tiến trình `claude`, lấy từ `tmux list-panes`). Lặp 4 lần ở 4 phiên REPL.
- Quan sát: `UserPromptSubmit` bắn 0,018 s sau lần ghi, đủ tám khoá như lượt người gõ, `permission_mode` giống, `prompt_len` = 74 = đúng độ dài nội dung gửi (khung "Another Claude session sent a message … permission laundering" **không** nằm trong `prompt`; màn hình hiện nó, hook không thấy). Không có trường nguồn trong payload.
- Phân biệt qua transcript (chỉ đọc tên khoá và các trường nguồn, không đọc chữ): bản ghi `type: user` của lượt người gõ có `origin: {kind: "human"}`, `promptSource: "typed"`, `turnOrigin: "human"`; của tin peer có `origin: {kind: "peer", from: "unknown", verifiedPeerPid, verifiedPeerProcStart}`, `promptSource: "system"`, `turnOrigin: "peer"`, `isMeta: true`. `promptId` trong bản ghi khớp `prompt_id` trong payload.
- Thời điểm đọc được: hook `UserPromptSubmit` tìm bản ghi theo `prompt_id` thăm dò mỗi 50 ms trong 1,5 s: **0/4 lần thấy** (cả khi file đã tồn tại, bản ghi chỉ xuất hiện sau). Hook `Stop` tìm cùng cách: **2/2 thấy ở lần đọc đầu** (1 đến 2 ms), `human` cho lượt gõ, `peer` cho lượt socket.
- Không đo: tin đến lúc đang bận (đã có ở báo cáo 261020-1457: xếp hàng); `PostToolUse`; nhiều tin gộp trong một lượt (khi đó `origin` có thể lẫn).

### Codex (`codex queue --thread <id>` vào REPL rảnh)
- Phương pháp: REPL rảnh, `codex queue --thread <id> --message "Peer message. Reply with exactly the word …"`; id luồng lấy từ tên file rollout, chỉ in 8 ký tự đầu (id Codex dạng UUIDv7 nên tám ký tự đầu là phần thời gian, không phân biệt các luồng trong cùng phút).
- Quan sát: `UserPromptSubmit` bắn cho từng tin queue (tổng 21 lần), cùng chín khoá như lượt người gõ, `prompt_len` bằng đúng độ dài nội dung queue (47 đến 51), không có trường nguồn. `Stop` bắn sau đó.
- Phân biệt: rollout (`transcript_path`) có bản ghi `task_started.turn_attribution` với `turn_trigger`: `user` cho lượt người gõ, `queue` cho lượt từ `codex queue` (`initiating_agent_path` null cả hai). Hai bản ghi `user` trong rollout có cùng tập khoá (`content, id, internal_chat_message_metadata_passthrough, role, type`; passthrough: `content_item_kinds, create_time, turn_id`), nên chỉ `turn_trigger` phân biệt. Hook thăm dò rollout theo `turn_id` ngay lúc `UserPromptSubmit`: **thấy ở lần đọc đầu trong 10/10 lần** (2 lượt `user`, 8 lượt `queue`; cộng 8 lần ở lúc `Stop`).
- Không đo: queue khi REPL bận; queue nhiều tin; `turn_trigger` khi tin đến từ subagent; `--remote`.

### agy (typed-signal một dòng, trạng thái rảnh, ô nhập trống)
- Phương pháp: tôi kiểm tay màn hình thấy `>` trơn và không có hộp thoại, rồi `send-keys -l` dòng `[fgOS: message from another agent, not from the user] You have mail. Read it with: cat …/inbox.txt` và Enter (tương đương `send-text` + Enter của mục 7.2; không dùng herdr). `inbox.txt` bảo trả `PEERAGY`.
- Quan sát: `PreInvocation` `invocationNum 0` bắn, **payload y hệt** lượt người gõ (cùng khoá, cùng `invocationNum 0`); agy đọc file và trả `PEERAGY`. Transcript (`brain/<id>/.system_generated/logs/transcript.jsonl`): lượt người gõ và lượt typed-signal đều là bước `source: USER_EXPLICIT`, `type: USER_INPUT`, cùng tập khoá; **không có trường nguồn**. Nội dung bước được bọc `<USER_REQUEST>\n…\n</USER_REQUEST>`, nên nhãn nằm sau phần bọc.
- Bản ghi đã có lúc `PreInvocation 0` chạy (đọc ở lần đầu, `last_user_step` bằng `initialNumSteps − 1`, cả hai lượt). Bộ kiểm nhãn của tôi báo `label: false` vì kiểm `startswith("[fgOS:")` trên chuỗi còn khung `<USER_REQUEST>`; đây là lỗi của bộ kiểm, tôi xác nhận lại bằng cách đọc transcript sau đó (nội dung lượt hai đúng là `<USER_REQUEST>` rồi `[fgOS: …`). Tôi **không** chạy lại hook với phép so đúng.
- Không đo: typed-signal khi đang bận hay khi người đang soạn dở (đã đo ở 261019); hook đối chiếu nhãn chạy đúng.

## U3. `codex queue`: ~10 s ở đâu

Cách đo: REPL Codex trong tmux; script `u3.py` ghi (a) lúc bắt đầu và lúc `codex queue` trả về (`time.time()` quanh `subprocess.run`), (b) lúc hook `UserPromptSubmit` của lượt mới ghi log (mốc ghi trong chính hook), (c) lúc màn hình có dòng `›` chứa dấu nhận dạng của tin (đọc `tmux capture-pane` mỗi khoảng 50 ms), (d) lúc dòng trả lời `•` chứa dấu nhận dạng. Hook đầu tiên của lượt mới là `UserPromptSubmit` (không có tool trong lượt).

Mốc (giây, đo từ lúc `queue` trả về):

| Cấu hình | Lần | Lệnh trả về (ms) | → hook | → màn hình hiện tin | → câu trả lời |
|---|---|---|---|---|---|
| Không daemon, cách đều 20 s | 1 | 133 | 9,95 | 9,99 | 14,17 |
| | 2 | 168 | 8,04 | 8,07 | 11,07 |
| | 3 | 140 | 9,21 | 9,24 | 12,61 |
| | 4 | 168 | 8,84 | 8,87 | 12,11 |
| | 5 | 163 | 8,93 | 8,99 | 11,83 |
| Không daemon, khoảng nghỉ ngẫu nhiên 5 đến 15 s | 1 | 135 | 8,92 | 8,96 | 12,16 |
| | 2 | 103 | 7,25 | 7,31 | 10,47 |
| | 3 | 106 | 9,38 | 9,42 | 13,08 |
| | 4 | 104 | **1,61** | 1,63 | 4,79 |
| | 5 | 125 | 7,20 | 7,21 | 11,41 |
| | 6 | 137 | **2,86** | 2,92 | 7,31 |
| | 7 | 129 | 9,88 | 9,90 | 13,50 |
| | 8 | 120 | 8,49 | 8,52 | 11,23 |
| Daemon đang chạy, REPL mặc định | 1 đến 4 | 32 đến 43 | 2,51 / 1,25 / 1,64 / 9,12 | +0,02 đến +0,06 so với hook | 5,95 / 5,99 / 6,13 / 11,62 |
| Daemon đang chạy, REPL `--no-daemon` | 1 đến 4 | 27 đến 71 | 2,06 / 6,26 / 7,23 / 7,33 | +0,02 đến +0,04 so với hook | 3,36 / 8,02 / 8,70 / 8,69 |

Đọc kết quả:
1. **Lệnh `queue`**: 27 đến 168 ms (in "Queued message … for thread …"). Không phải 10 s.
2. **Màn hình**: tin hiện 0,01 đến 0,06 s sau hook (mọi 29 lần); độ phân giải đọc màn hình của tôi 0,05 s. Đọc màn hình không phải thủ phạm.
3. **Phần mất thời gian là từ lúc queue trả về tới lúc Codex bắt đầu lượt mới**, và nó **không cố định 10 s**: 1,25 đến 9,95 s. Bằng chứng là một nhịp quét chu kỳ 10 s: giá trị `hook_t mod 10` là 3,82 đến 3,85 (13 lần, một REPL), 1,59 đến 1,62 (REPL có daemon), 5,14 đến 5,20 (REPL `--no-daemon`): **mỗi tiến trình REPL có một pha cố định**, độc lập với lúc tôi gọi `queue`. Với chu kỳ 10 s, độ trễ phân bố đều 0 đến 10 s; tám lần pha ngẫu nhiên cho 1,61 đến 9,88 s, trung bình 6,95 s (kỳ vọng 5 s, mẫu nhỏ). Năm lần đầu và con số "khoảng 10 s" của 261019 rơi vào 8 đến 10 s vì các lần cách nhau 20 s đúng, nên luôn trùng pha: đó là hiện tượng của phép đo, không phải độ trễ cố định.
4. **Từ hook tới câu trả lời** (model): 2,7 đến 4,5 s ở cấu hình không daemon (8 lần), 1,3 đến 4,7 s ở các cấu hình còn lại. Thời gian "từ queue tới chữ trả lời" trong spec mục 7 gồm cả phần này.
5. Lệnh `queue` ngắn hơn (27 đến 71 ms thay vì 103 đến 168 ms) khi có daemon đang chạy trong cùng `CODEX_HOME`. Chưa tìm lý do.

Không đo / không biết: **tiến trình nào giữ nhịp quét** (cả REPL lẫn daemon đều mở `queue_1.sqlite`); có khoá cấu hình để đổi chu kỳ không (đã grep chuỗi binary tìm tên hằng, không thấy); hành vi khi REPL đang bận (queue có thể bị giữ thêm); 10 s là chu kỳ chính xác hay xấp xỉ (pha lệch tối đa 0,03 s trong 13 lần, gợi ý đúng 10 s); giá trị mẫu nhỏ, một máy.

### `codex queue` có chạm tới REPL `--no-daemon` không
- `codex --help` 0.162.1 có `--no-daemon`: "Run without the shared background server, even if it is already running". Cấu hình `codex-herdr` trong `.fgos/config.json` (dòng `--no-daemon` quanh dòng 971) dùng cờ này.
- Phương pháp: (1) REPL mặc định khi chưa có daemon trong `CODEX_HOME` của tôi; (2) bật daemon trong chính thư mục home cô lập (`codex app-server daemon start`: cài bản 0.162.1 từ chính CLI vào `codex-home/packages`, không tải mạng; socket `codex-home/app-server-control/…`), REPL mặc định; (3) cùng daemon, REPL `--no-daemon`. Mỗi cấu hình: gõ một lời, lấy id luồng, `codex queue`.
- Quan sát: cả ba cấu hình nhận tin, cùng nhịp quét. Ở (1) không có tiến trình `app-server` nào của home này; ở (2) và (3) tiến trình `codex` của REPL tự giữ file rollout và khoá luồng (`thread-writer-locks/<id>.lock`), tức REPL ở chế độ nhúng; daemon chỉ mở `queue_1.sqlite`. Vậy trong cả ba cấu hình thử, không có REPL nào gắn vào daemon, và `queue` đến được REPL không phụ thuộc cờ.
- **Không đo:** REPL thật sự là client của daemon (`--remote unix://…`), vì vậy chưa biết `queue` có chạm tới một worker đã gắn daemon không. Với worker của fgOS (`--no-daemon`), bằng chứng đủ cho kết luận "chạm tới được".

## Hạn chế chung

- Một máy, một tài khoản mỗi CLI, model nhỏ; mỗi phép đo ở U1/U2 từ 1 đến 4 lần.
- "Người gõ" bằng `tmux send-keys`, không phải bàn phím thật; chưa đo prompt dán, lệnh slash.
- Claude: transcript là file nội bộ của CLI, các khoá `origin`, `promptSource`, `turnOrigin` chưa phải hợp đồng công bố; có thể đổi giữa các bản. Tương tự `turn_attribution.turn_trigger` của Codex (có trong rollout, không có trong schema hook).
- agy: sự kiện hook theo tài liệu nhúng trong binary 1.4.2; hook đối chiếu nhãn chưa chạy đúng.
- Độ phân giải thời gian: hook ghi ms; màn hình 0,05 s; lệnh trả về đo bằng `time.time()` quanh `subprocess.run`.

## Dọn dẹp và những gì còn lại

- Đã tắt: server tmux `mailbox-probe5` (kill-server), cả ba REPL; daemon Codex của home cô lập đã `daemon stop`, không còn tiến trình `codex` nào mang đường dẫn `mailbox-probe5` (kiểm `ps`). Không động tới `codex`/`agy`/`claude` khác của chủ dự án và ba daemon `~/.codex-*` đang chạy.
- agy: thư mục thử đã được tự thêm vào `trustedWorkspaces` của tài khoản `tetnu`; đã gỡ lại, danh sách về đúng như trước (`["/home/vantt/projects/forgent"]`).
- Scratch còn lại (gitignore): `/home/vantt/projects/forgent/.fgos/runtime/tmp/mailbox-probe5/` (khoảng 125 MB: `hooklog.py`, `tm.sh`, `sockwrite.py`, `u3.py`; `claude/`, `codex/`, `agy/` chứa file hook, `settings*.json`, log; `codex-home/` là `CODEX_HOME` cô lập với database và rollout của các lượt thử, đã gỡ symlink `auth.json` và thư mục `packages` của daemon). Tôi đã xoá hai file chuỗi trích từ binary (khoảng 40 MB mỗi file).
- Do chính CLI để lại ngoài thư mục thử (không xoá): `~/.claude/projects/-home-vantt-projects-forgent--fgos-runtime-tmp-mailbox-probe5-claude/` (transcript Claude, vài phiên); các hội thoại agy trong `~/.agy-homes/tetnu/.gemini/antigravity-cli/{conversations,brain,presence,...}` (khoảng 3 hội thoại mới) và `history.jsonl`. REPL Claude không hỏi tin thư mục (thư mục nằm dưới dự án đã tin).
- Không sửa file nào của repo ngoài báo cáo này; không commit.

## Câu hỏi còn mở

1. Tiến trình nào giữ nhịp 10 s của `codex queue` (REPL hay daemon), và có cấu hình đổi được chu kỳ không?
2. Một REPL Codex gắn thật vào daemon (`--remote`) có nhận `queue` cùng nhịp không? (Worker của fgOS dùng `--no-daemon`, nên có thể bỏ qua.)
3. Hook đối chiếu nhãn `[fgOS:` ở `PreInvocation 0` của agy có chạy đúng, và có đủ ổn định qua bản agy mới không (chuỗi bọc `<USER_REQUEST>` không phải hợp đồng)?
4. Tin peer đến Claude khi đã có ngân sách đang chạy: nhiều tin gộp vào một lượt thì `origin.kind` trả giá trị nào? Chưa đo.
5. Chủ dự án có chấp nhận dựa vào trường nội bộ của transcript (Claude `origin.kind`, Codex `turn_trigger`) làm tín hiệu reset ngân sách, hay giữ cửa sổ trượt 10 phút cho cả ba CLI cho đơn giản?
