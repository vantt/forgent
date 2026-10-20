# Đo thật: Claude Code khi bận nhận tin qua socket, hook trong subagent, `session_id` qua `--resume`, teammate

## Tổng hợp nhanh

Môi trường: Claude Code **2.1.304** (lần đo trước là 2.1.303; binary vừa được cập nhật lúc 08:58 cùng ngày), model `haiku` (hiển thị "Haiku 5.5"), máy của chủ dự án, 2026-10-20 khoảng 14:55 đến 15:10 (Asia/Saigon). Mỗi phép đo chạy **một lần** (M1 phần "đang sinh chữ" chạy hai lần), nên không có phân phối. Mốc thời gian dưới đây là epoch giây, bỏ tiền tố `1792483` (ví dụ `158.0` là `1792483158.0`).

| # | Câu hỏi | Kết quả (đã đo) | Còn thiếu |
|---|---|---|---|
| M1 | Ghi socket vào REPL đang chạy tool dài | Tool **không bị cắt** (chạy đủ 40 s). Tin hiện trên màn hình trong khoảng 0,1 đến 0,8 s sau khi ghi, dạng dòng `❯ <nội dung>` xếp hàng. Hai tin liên tiếp: cả hai hiện, đúng thứ tự. Model chỉ thấy tin **sau khi tool xong**, trong cùng lượt, và nhắc cả ba tin ở câu trả lời cuối. Tin đến lúc model đang sinh chữ: **xếp hàng, không chèn vào chữ đang sinh**, được xử lý thành một lượt mới khoảng 1,7 đến 2,5 s sau khi lượt cũ xong | tool bị chặn `sleep 40` nên dùng vòng lặp python; lượt có nhiều tool; tin đến giữa hai tool |
| M2 | Hook trong ngữ cảnh subagent | `PreToolUse` và `PostToolUse` **có chạy** cho từng lệnh Bash của subagent. Phân biệt bằng hai trường `agent_id` và `agent_type`, chỉ có ở sự kiện của subagent; `session_id` và `transcript_path` **giống hệt** của cha. `SubagentStop` chạy cho subagent, `Stop` chỉ chạy cho cha. `additionalContext` trả từ `PostToolUse` của subagent **rơi vào ngữ cảnh của subagent**, cha không thấy | subagent lồng nhau, subagent chạy nền, subagent có tên |
| M3 | `session_id` qua `--resume` | **Không đổi** qua `--resume <id>` và `--continue` (cùng một transcript). Pid khác, `messagingSocketPath` khác ở mỗi tiến trình | REPL (chỉ đo `-p`), `--fork-session`, resume sau compact |
| M4 | Teammate | Bật được an toàn bằng biến môi trường `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` cho một tiến trình. Tin gửi tới teammate **ghi vào `~/.claude/teams/<team>/inboxes/<tên>.json`**. Teammate bận: tin nằm chưa đọc 13,2 s, teammate chỉ xử lý sau khi hết lượt hiện tại. Teammate rảnh: lấy tin sau 0,6 s, trả lời sau 1,5 s kể từ lúc tin hạ cánh | gửi từ ngoài team, hook trong teammate, teammate đã dừng |

Điều không chạy đúng như yêu cầu: lệnh `sleep 40` bị chặn ở REPL (xem M1), và tôi không gõ trực tiếp vào khung của teammate; tin tới teammate do lead (model) gọi `SendMessage` theo yêu cầu của tôi.

## Cách đo chung

- Binary: `/home/vantt/.local/bin/claude` (symlink tới `versions/2.1.304`), gọi trực tiếp, không qua alias. Cờ tự truyền: `--dangerously-skip-permissions --model haiku --settings <file>`. Không in hay ghi khoá, token hay file credential.
- tmux riêng: `tmux -L mailbox-probe2`, helper `tm.sh` (sao từ bản cũ, đổi tên socket). Chụp màn hình bằng `capture.sh`, chu kỳ khoảng 0,8 s (đó là độ phân giải của mọi mốc "hiện trên màn hình").
- Dòng ghi socket (`sockwrite.py`): `{"type":"user","message":{"role":"user","content":"<chữ>"}}` + xuống dòng, như báo cáo 261019 (báo cáo đó chỉ ghi `{"type":"user","message":{…}}`; phần `role`/`content` là tôi điền và nó hoạt động). Socket đọc từ `~/.claude/sessions/<pid>.json` → `messagingSocketPath` (`/run/user/1000/cc-socks/31362.sock`). Người nhận chạy với `crossSessionInbound: accept` qua `--settings` của riêng tiến trình (file `m1/settings-accept.json`); cấu hình toàn cục không đụng tới.
- Script nằm ở `.fgos/runtime/tmp/mailbox-probe2/` (gitignore).

## M1. Ghi socket vào REPL Claude Code đang bận

**Mục đích.** Điền chỗ trống của mục 15.6: socket chỉ được đo khi session rảnh.

**Phương pháp.** REPL trong tmux, `accept` qua `--settings`. Prompt buộc một tool Bash foreground 40 s rồi trả lời một dòng. Trong lúc tool chạy, ghi 1 dòng, 5 s sau ghi 2 dòng liên tiếp, đồng thời chụp màn hình.

**Chuyện `sleep 40`.** Ba lần đầu (`sleep 40`, vòng `for … sleep 1`, `timeout 40 tail -f /dev/null`) model từ chối chạy: lần đầu nó báo "the harness blocked sleep 40 … in the foreground", hai lần sau nó từ chối vì cho rằng cùng kiểu chờ đã bị chặn. Văn bản lỗi gốc của harness tôi **không chụp được**, chỉ có lời tường thuật của model, nên không nói được quy tắc chặn chính xác là gì. Lần chạy hợp lệ dùng `python3 -c "…while time.time()-t<40: time.sleep(0.5)…"` trong một session mới; tool chạy foreground đủ 40 s. Đây là lệch so với yêu cầu (`sleep 40`), và nó cũng là một phát hiện: ở 2.1.304 REPL, tool chờ kiểu `sleep` có thể bị chặn, nên đo "tool dài" phải dùng lệnh khác.

**Kết quả đo (lượt hợp lệ).**

| Sự kiện | Mốc (epoch − 1792483000) | Ghi chú |
|---|---|---|
| Tool bắt đầu | khoảng 142 | suy từ bộ đếm "(12s)" ở lần chụp 154,0; sai số khoảng 1 s |
| Ghi tin 1 (`MSG-ONE … ALPHA-1`) | 158,014 (socket đóng 158,039) | không nhận phản hồi từ socket (đọc được 0 byte) |
| Lần chụp đầu thấy tin 1 | 158,110 | dòng `❯ MSG-ONE: when you finish, include the word ALPHA-1 in your final line.` nằm trên dòng spinner; chưa có nhãn người gửi |
| Ghi tin 2, tin 3 | 163,045 và 163,071 | cách nhau 0,03 s |
| Lần chụp đầu thấy tin 2 và 3 | 163,829 | cả hai hiện, xếp dưới tin 1 theo đúng thứ tự gửi |
| Bộ đếm tool | "(39s)" ở 181,0 và "(40s)" ở 181,8 | tool chạy đủ 40 s, không bị ngắt |
| Tool xong | `Ran 1 shell command` ở 182,635 | |
| Câu trả lời cuối | 184,305 | `● FINISHED. Messages from another session: MSG-ONE asked for ALPHA-1, MSG-TWO asked for BETA-2, MSG-THREE asked for GAMMA-3, all in this line.` Cuối dòng ghi `Cooked for 44s`: tức **một lượt duy nhất** |

Kết luận cho từng câu hỏi:
- **Tool có chạy tiếp hay bị cắt?** Chạy tiếp, đủ 40 s (đo).
- **Khi nào tin hiện trên màn hình, dạng gì?** Trong chưa tới 1 s (giới hạn bởi chu kỳ chụp), dạng dòng `❯ <nội dung>` xếp hàng, không kèm nhãn nguồn trong lúc đang xếp hàng (đo).
- **Model hành động khi nào?** Sau khi tool xong, cùng lượt. Lượt chỉ có một tool nên **không tách được** "ở bước kế tiếp" với "sau cả lượt": chưa đo.
- **Hai tin liên tiếp.** Cả hai hiện, đúng thứ tự, model nhắc cả ba tin theo thứ tự ONE, TWO, THREE. Câu trả lời chứa chữ `ALPHA-1`, `BETA-2`, `GAMMA-3` nhưng ở dạng trích dẫn ("asked for ALPHA-1"), nên **chưa chứng minh model làm theo** chỉ dẫn; chỉ chứng minh model đã đọc (đo, mơ hồ).

**Tin đến lúc model đang sinh chữ (tốt nhất có thể).** Model sinh danh sách 120 dòng, không dùng tool.
- Lần 1 (ghi ở 244,919): lần chụp cho thấy danh sách chỉ bắt đầu hiện ở 264,3, tức tin rơi vào giai đoạn model "nghĩ" trước khi in chữ, **không phải giữa lúc đang in**. Tin hiện xếp hàng ở 245,2; danh sách in hết ở 273,4 (`END-LIST`, `Brewed for 31s`); sau đó một lượt mới có nhãn `Another Claude session sent a message:` và trả `● DELTA-4` ở 275,8 (2,4 s sau `END-LIST`).
- Lần 2 (ghi ở 316,837, lúc màn hình đang hiện dòng số 17 đến 29): tin hiện xếp hàng ở 317,2; danh sách vẫn chạy liền mạch tới dòng 120 (324,7) mà không chứa tin; `● EPSILON-5` ở 326,4 (1,7 s sau khi hết danh sách), cũng là một lượt mới có nhãn `Another Claude session sent a message:`.

Vậy: tin tới giữa lúc sinh chữ **không bị chèn vào luồng chữ và không làm gián đoạn lượt**; nó chờ hết lượt rồi thành một lượt riêng, có nhãn "Another Claude session sent a message" (đo, hai lần).

**KHÔNG đo.**
- Model thấy tin ở bước nào khi lượt có nhiều lần dùng tool (chỉ đo lượt một tool).
- Tin đến khi tool đã bắt đầu nhưng model dùng tool khác chạy nền.
- Hộp thoại giữ tin (không bật vì `accept`); giới hạn 50 tin xếp hàng, chống trùng, giới hạn tốc độ (mô tả ở báo cáo 261015, không thử).
- Lệnh `sleep 40` đúng nguyên văn, và nguyên nhân chặn.
- Phân phối độ trễ: mỗi tình huống một lần; độ phân giải 0,8 s.

## M2. Hook trong ngữ cảnh của subagent

**Mục đích.** Điền chỗ trống mục 15.6: `PostToolUse` có chạy trong ngữ cảnh subagent không và phân biệt thế nào.

**Phương pháp.** `claude -p` với hook qua `--settings` (file `m2/settings-plain.json`): `PreToolUse` và `PostToolUse` (matcher `*`), `Stop`, `SubagentStop`. Hook (`m2/hooklog.py`) chỉ ghi các khoá của JSON stdin, các trường nhận dạng (`session_id`, `agent_id`, `agent_type`, `tool_name`, tên file `transcript_path`, tên file `agent_transcript_path`, lệnh Bash vào `tool_input.command`); không ghi `tool_response`. Luôn `exit 0`, bắt mọi lỗi. Prompt: cha khởi động một subagent bằng công cụ Agent, subagent chạy `echo SUB-1` hai lần, rồi cha báo xong.

**Kết quả lượt A (chỉ ghi log), rút gọn (`session_id` bắt đầu `32dcf55e`).**

| Mốc | Sự kiện | `agent_id` | `agent_type` |
|---|---|---|---|
| 380,632 | `PreToolUse` Agent | không có | không có |
| 381,810 và 382,011 | `PreToolUse` Bash x2 | `ae23832661a160921` | `general-purpose` |
| 382,805 và 382,807 | `PostToolUse` Bash x2 | cùng id | cùng loại |
| 383,561 | `SubagentStop` | cùng id | cùng loại |
| 383,610 | `PostToolUse` Agent | không có | không có |
| 384,633 | `Stop` | không có | không có |

- Hai lệnh Bash của subagent chạy gần như song song (hai `PreToolUse` cách nhau 0,2 s, hai `PostToolUse` cách nhau 0,002 s).
- Khoá JSON của sự kiện cha: `cwd, effort, hook_event_name, permission_mode, prompt_id, session_id, tool_input, tool_name, tool_use_id, transcript_path` (và `tool_response, duration_ms` ở `PostToolUse`). Sự kiện subagent có thêm đúng hai khoá `agent_id`, `agent_type`.
- `SubagentStop` có thêm `agent_transcript_path`, `last_assistant_message`, `background_tasks`, `session_crons`, `stop_hook_active` (và không có trường công cụ). Tên file `agent_transcript_path` (lượt B): `agent-ae40a76fa03e17f3b.jsonl`. `Stop` của cha có `last_assistant_message`, `background_tasks`, `session_crons`, `stop_hook_active`, không có `agent_id`.
- `session_id` của sự kiện subagent **bằng** `session_id` của cha. `transcript_path` của sự kiện subagent (Bash) cũng trỏ tới transcript của cha (đo ở lượt B: cùng tên file `9e911a64-….jsonl`).
- `Stop` chạy **một lần**, cho cha. `SubagentStop` chạy **một lần**, cho subagent. Không có `Stop` cho subagent.

**Lượt B (chèn `additionalContext`).** Hook `PostToolUse` trả `{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"HOOKCTX-7"}}` chỉ khi payload có `agent_id`. Subagent được yêu cầu nói có thấy token không, cha cũng vậy. `session_id` lượt B bắt đầu `9e911a64`, `agent_id` `ae40a76fa03e17f3b`.
- Hook chèn chạy ở 405,052 và 405,055 (hai `PostToolUse` Bash của subagent); sự kiện `PostToolUse` Agent của cha (407,018) không có `agent_id` nên không chèn.
- Subagent trả lời `SUBSAW: YES`, trích "PostToolUse:Bash hook additional context: HOOKCTX-7" (xuất hiện hai lần).
- Kiểm bằng transcript trên đĩa (chỉ đếm và đọc loại bản ghi, không đọc nội dung khác): transcript của subagent chứa hai bản ghi `attachment` loại `hook_additional_context` với nội dung `["HOOKCTX-7"]` (cộng hai bản ghi `hook_success`), và token có trong yêu cầu gửi lên API của subagent. Transcript của cha **không** có bản ghi `attachment` nào chứa token; token chỉ có trong đoạn văn của cha trích lại báo cáo của subagent.
- Cha trả `PARENTSAW: YES` nhưng tự giải thích là chỉ qua báo cáo của subagent, "not a hook output in my context". Đọc đúng: **ngữ cảnh chèn rơi vào subagent, không rơi vào cha**; cha chỉ biết gián tiếp qua lời kể.

**KHÔNG đo.**
- Subagent lồng nhau, subagent chạy nền (`run_in_background`), subagent có tên (`name`) và tin gửi tới nó bằng `SendMessage`.
- Subagent được khởi tạo bằng công cụ khác ngoài Agent; hook `PreToolUse` của lệnh Agent có chứa `agent_id` của subagent sắp tạo hay không (payload của nó không có `agent_id`, chỉ có `tool_use_id`).
- Cách một tiến trình bên ngoài biết `agent_id` của một subagent đang sống (lượt A cho thấy hook thấy nó; chưa kiểm xem kết quả công cụ Agent có trả nó về cho cha).
- Hook khác (`UserPromptSubmit`, `PreCompact`…) trong subagent. `PreToolUse` có thể chặn hoặc chèn ngữ cảnh cho subagent (chỉ đo `PostToolUse`).
- Mỗi cấu hình chạy một lần; lượt B chạy với model nhỏ, kết quả "subagent thấy token" được xác nhận bằng transcript chứ không chỉ bằng lời model.

## M3. `session_id` có sống qua `--resume` không

**Mục đích.** Điền chỗ trống mục 15.5.

**Phương pháp.** Hook `UserPromptSubmit` và `Stop` (file `m3/settings.json`, hook `m3/hook.py`) ghi: `session_id`, pid tổ tiên của hook, tên file transcript, và hai trường `pid`, `messagingSocketPath` đọc từ `~/.claude/sessions/<pid>.json` của tiến trình `claude` tìm thấy khi đi ngược cây tiến trình (không đọc trường nào khác). Ba lần chạy `claude -p`: (1) lượt mới "trả lời ONE-A"; (2) `--resume <session_id>` "trả lời TWO-B và ONE-A nếu nhớ yêu cầu trước"; (3) `--continue` "trả lời THREE-C".

**Kết quả đo.**

| Lần | pid `claude` | `pid` trong file phiên | `messagingSocketPath` | `session_id` | Transcript |
|---|---|---|---|---|---|
| 1. mới | 215056 | 215056 | `/run/user/1000/cc-socks/215056.sock` | `92b3b91e-4e91-4d71-8718-6964afe7c4eb` | `92b3b91e-….jsonl` |
| 2. `--resume` | 217983 | 217983 | `/run/user/1000/cc-socks/217983.sock` | cùng giá trị | cùng file |
| 3. `--continue` | 220725 | 220725 | `/run/user/1000/cc-socks/220725.sock` | cùng giá trị | cùng file |

- Cả sáu bản ghi hook (hai sự kiện mỗi lần) mang cùng `session_id`. Cả `--resume <id>` và `--continue` **không tạo id mới** và nối vào cùng transcript (đo bằng tên file).
- Lần 2 trả lời có `ONE-A`: hội thoại thật sự được nối tiếp (đo).
- Mỗi tiến trình có `pid` và `messagingSocketPath` riêng, và `pid` trong file phiên khớp với pid thực của `claude`. Vậy **danh tính hội thoại (`session_id`) ổn định, địa chỉ socket thì theo tiến trình và đổi mỗi lần resume**.
- Ba lần chạy cách nhau khoảng 3 s, tiến trình trước đã thoát trước khi tiến trình sau bắt đầu, nên chưa đo trường hợp hai tiến trình cùng resume một `session_id` cùng lúc.

**KHÔNG đo.**
- Resume trong REPL tương tác (chỉ đo `-p`); `--fork-session` (theo `--help`: tạo id mới; không chạy); resume sau `/compact`; resume khi session có teammate (tài liệu nói teammate in-process không được khôi phục).
- So sánh đầy đủ tập khoá của payload hook giữa lượt gốc và lượt resume: tôi chỉ so các trường nhận dạng.
- Thời điểm file `~/.claude/sessions/<pid>.json` và socket biến mất sau khi tiến trình thoát (chỉ đọc được lúc hook chạy).
- Lần chạy ở thư mục khác: `--continue` chọn "hội thoại gần nhất trong thư mục hiện tại"; các lần đều chạy cùng một thư mục.

## M4. Teammate

**Có bật được không, bằng gì.** Đo ba nguồn:
1. `claude --help` (2.1.304): không có cờ nào cho agent teams (lọc `team` không ra dòng nào).
2. Tài liệu chính thức, trang https://code.claude.com/docs/en/agent-teams (đọc hôm nay): bật bằng biến môi trường `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (hoặc `env` trong `settings.json`); "disabled by default"; chế độ không tương tác `-p` không sinh teammate, cần phiên tương tác; cờ `--teammate-mode` có nhưng không hiện trong `--help`. Tài liệu cũng nói khi bật, một subagent mà Claude đặt tên sẽ chạy thành teammate (đây là tác dụng phụ cần biết nhưng tôi không thử).
3. Binary: `strings` trên `versions/2.1.304` thấy `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` (5 lần), `CLAUDE_CODE_TEAMMATE_COMMAND`, `CLAUDE_CODE_TEAM_TEARDOWN_PARK_TIMEOUT_MS`.

Bật an toàn cho một tiến trình: đặt biến ngay trong lệnh khởi động (`env CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 /home/vantt/.local/bin/claude …`), không sửa cấu hình toàn cục.

**Phương pháp.** REPL trong tmux, `--model haiku`, thư mục `m4/`. Yêu cầu lead tạo "một lead và đúng một teammate in-process tên `tm1`", teammate chạy một tool foreground 30 s (`python3 time.sleep(30)`), báo `done-1`, rồi chờ tin. Bộ theo dõi `inbox-watch.py` đọc `~/.claude/teams/<team>/inboxes/*.json` mỗi 0,3 s (chỉ in `from`, `timestamp`, `read`, 70 ký tự đầu của `text`). Sau đó nhờ lead gọi `SendMessage` tới `tm1` hai lần: lần 1 lúc `tm1` bận, lần 2 lúc rảnh. **Tin do lead (model) gửi theo yêu cầu của tôi**; tôi không ghi file hộp thư, không gõ vào khung của teammate.

**Kết quả đo.**
- Team tự lập khi khởi động: thư mục `~/.claude/teams/session-ad2151d6/` (tên là `session-` + 8 ký tự đầu của `session_id` của lead, đúng như tài liệu) chỉ có `config.json` lúc mới tạo; `inboxes/` xuất hiện khi có tin đầu tiên. `config.json` có `members`: `team-lead` (agentType `team-lead`) và `tm1`, cả hai `backendType: in-process`. Lead gọi công cụ `Agent(Spawn teammate tm1)`.
- **Tin gửi lúc `tm1` bận** (lệnh gõ ở 486,5):
  - 489,122: `inboxes/tm1.json` có một entry `from: team-lead`, `read: false`, text `BUSYMSG: when you finish, reply to the lead with the word KIWI-3.` Tức tin **hạ cánh thành file** trong 2,6 s kể từ lúc gõ (gồm một lượt model của lead).
  - `tm1` đang chạy tool 30 s (bộ đếm hàng của `tm1` ở 502,0 là "34s", suy ra tool bắt đầu khoảng 468 và xong khoảng 499 đến 501; không quan sát trực tiếp mốc xong).
  - 501,437: `tm1` ghi `done-1` vào `team-lead.json`.
  - 502,339: `tm1.json` thành `[]`, tức `tm1` đã lấy tin (13,2 s sau khi tin hạ cánh, 0,9 s sau `done-1`).
  - 503,240: `tm1` ghi `KIWI-3` vào `team-lead.json`.
  - Kết luận: tin **không làm `tm1` dừng tool giữa chừng**; `tm1` chỉ lấy tin sau khi xong lượt đang chạy. Không tách được "ngay sau tool" với "sau khi kết thúc lượt".
- **Tin gửi lúc `tm1` rảnh** (lệnh gõ ở 561,698): hạ cánh 563,214 (1,5 s), `tm1.json` rỗng lại 563,814 (0,6 s sau, độ phân giải 0,3 s), `PLUM-4` trong `team-lead.json` ở 564,715 (1,5 s sau khi tin hạ cánh).
- **Lead thấy gì.** Dòng `› Message from @tm1 (ctrl+o to expand)`, rồi `● Teammate @tm1 finished`. Mỗi lần `tm1` rảnh, `team-lead.json` nhận thêm một entry JSON có `"type":"idle_notification"`; lead (model) mở **một lượt model mới cho mỗi thông báo rảnh** (ba lượt trong lần đo, ví dụ "This is an idle notification from tm1, not a new request…"), tức tốn token cho tin hệ thống. Lead một lúc đã nói sai ("KIWI-3 hasn't arrived") ở 503,6 rồi sửa ở 506,1 khi tin đến. Hộp thư của lead được lead lấy trong chưa tới 0,6 s sau khi hạ cánh (entry biến mất).
- Hình dạng entry: `from`, `timestamp` (ISO), `read`, `text` (khớp mô tả ở mục 4.1(a) của báo cáo 261015).

**KHÔNG đo.**
- Gửi tin tới teammate từ **ngoài** team (tiến trình khác, `SendMessage` từ session khác, ghi file hộp thư bằng tay), và ai được phép ghi.
- Hook (`PreToolUse`, `PostToolUse`, `TeammateIdle`…) trong teammate; `agent_id` của teammate trong payload; teammate chia pane tmux.
- Đánh thức một teammate đã dừng, khôi phục sau `/resume`, nhiều tin cùng lúc cho teammate bận, thứ tự.
- Độ trễ chính xác từ tool xong tới lúc lấy tin của teammate bận (mốc tool xong chỉ suy ra).
- Một lần đo mỗi tình huống; model nhỏ.

## Điều này đổi gì cho spec (mục 15.5, 15.6)

Chỉ nêu điều đo được ủng hộ; quyết định thuộc chủ dự án.

- 15.6, socket khi bận: tin không cắt tool, xếp hàng, thành lượt riêng có nhãn sau khi lượt hiện tại xong. Hợp với mô hình "giao khi tới điểm dừng", nhưng tin không tới model sớm hơn kết thúc tool.
- 15.6, subagent: `PostToolUse` chạy trong ngữ cảnh subagent, có `agent_id`, và `additionalContext` chỉ vào subagent đó. Điều kiện "revisit trigger" (một kênh giao tới đúng một subagent) vì vậy có một ứng viên đã đo: hook đọc hộp thư theo `agent_id` rồi chèn. Mới chứng minh với một subagent không tên, một lượt; chưa chứng minh cách người gửi biết `agent_id`.
- 15.5: `session_id` ổn định qua `--resume`/`--continue` (`-p`), còn socket và pid đổi; một registry gắn tên vào `session_id` phải làm mới địa chỉ socket mỗi lần tiến trình mới. Chưa đo REPL.
- 15.6, teammate: có hộp thư file riêng theo tên, tin hạ cánh dạng file và được lấy sau khi lượt hiện tại xong; kênh này không đi qua socket và không đi qua cổng `crossSessionInbound`.

## Hạn chế chung

- Một lần chạy mỗi phép đo (M1 phần sinh chữ hai lần), model `haiku`, không có phân phối; số giây có độ phân giải khoảng 0,8 s (màn hình) hoặc 0,3 s (file).
- Hành vi của model (có làm theo tin, có chặn `sleep`) phụ thuộc model nhỏ; kết quả cơ học (tin có hạ cánh, hook có chạy, id có đổi) ít phụ thuộc hơn.
- Các lượt `-p` chạy với `</dev/null` trừ lượt B của M2 (in một cảnh báo "no stdin data received in 3s", vô hại).

## Dọn dẹp và những gì còn lại

- Đã tắt: tmux `mailbox-probe2` (server đã kill, không còn tiến trình `claude` hay script theo dõi nào của tôi). Không động tới tiến trình của người dùng (nhiều `claude` khác vẫn chạy).
- Còn trong thư mục thử `/home/vantt/projects/forgent/.fgos/runtime/tmp/mailbox-probe2/` (gitignore): `tm.sh`, `capture.sh`, `sockwrite.py`; `m1/` (`settings-accept.json`, `cap.log`, `cap2.log`, `cap3.log`); `m2/` (`hooklog.py`, `settings-plain.json`, `settings-inject.json`, `hook-runA.log`, `hook.log` của lượt B); `m3/` (`hook.py`, `settings.json`, `hook.log`); `m4/` (`inbox-watch.py`, `cap.log`, `inbox.log`, `inbox2.log`).
- Còn lại do chính CLI ghi (tôi không xoá vì ngoài thư mục thử): `~/.claude/projects/-home-vantt-projects-forgent--fgos-runtime-tmp-mailbox-probe2-m1` đến `-m4` (transcript, kèm transcript subagent của M2), `~/.claude/tasks/session-ad2151d6/` (tài liệu nói thư mục task còn lại sau khi session kết thúc). `~/.claude/teams/` đã rỗng sau khi thoát. Có thể câu hỏi "tin cậy thư mục" của Claude Code đã được ghi nhớ cho các thư mục `m1` đến `m4` (REPL không hỏi lần này).
- Không sửa file nào trong repo ngoài báo cáo này; không commit.

## Câu hỏi còn mở

1. Quy tắc chặn `sleep 40` foreground ở REPL 2.1.304 là gì (từ chối của model hay chặn của harness), và có ảnh hưởng tới worker của fgOS chạy tool chờ dài không? Cần chụp văn bản lỗi gốc.
2. Tin vào lúc tool đang chạy khi lượt có nhiều tool: model thấy nó sau tool nào?
3. Người gửi bên ngoài có cách nào biết `agent_id` của một subagent đang chạy (kết quả công cụ Agent, file phiên, hook `SubagentStart`)?
4. `session_id` có giữ nguyên khi resume trong REPL tương tác và sau `/compact`?
5. Một tiến trình ngoài có được ghi hợp lệ vào hộp thư file của teammate không (kiểm tra schema, khoá, quyền)? Và hook `PostToolUse` trong teammate có `agent_id` không?
