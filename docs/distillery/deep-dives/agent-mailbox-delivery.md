---
topic: agent-mailbox-delivery
date: 2026-10-19
based_on: [reason-network@19b1fbf, pi@e5dde9a, beehive@05a131f, beads-viewer-rust@7f96da4, herdr@a0678a3]
entries: [reason-network:delivery-tier-declaration, reason-network:sender-receipt-with-reason, reason-network:stop-hook-continues-turn, reason-network:mid-turn-wake-filter, reason-network:confirm-after-print-delivery, reason-network:idle-wake-by-plugin-poll, reason-network:claude-session-socket-push, reason-network:pull-notice-and-long-poll-inbox, reason-network:signed-approval-ask-user, reason-network:inbound-policy-and-loop-guards, reason-network:mailbox-lifecycle-and-retention, reason-network:p2p-store-and-forward-mesh, pi:message-queue-steer-vs-followup, beehive:workflow-mailbox-handoff, beads-viewer-rust:mcp-agent-mail-coordination]
---

# Deep-dive: giao tin giữa các agent (mailbox delivery)

**Bottom Line:** reason-network là nguồn đầu tiên trong distillery giải *toàn bộ* đường đi của một tin nhắn, từ lúc gửi tới lúc nằm trong context của agent, trên 10 CLI khác nhau. Điều đáng học nhất không phải đường truyền P2P mà là **ba mảnh nhỏ**: mức giao tin khai báo theo từng CLI (`push`/`turn`/`pull`) kèm câu giải thích gửi ngược cho người gửi, cờ `wake` phân biệt "ngắt giữa chừng" với "đợi chỗ nghỉ", và việc chỉ ghi "đã giao" sau khi hook in được nội dung ra. Họ **không** giải: ack của agent, ghim tin qua compact, hạn trả lời và leo thang, đo độ trễ, lease liên máy. Với fgOS, khuyến nghị là mượn ba mảnh trên làm hợp đồng giao tin **không cần daemon mới** (V-011 vẫn hiệu lực), đặt hàng đợi vào event store đã có, và tự xây phần họ thiếu. Lời hứa "hook `Stop` chặn dừng và nạp tin trên mọi CLI" **chưa được kiểm chứng** bởi chính repo của họ: test chỉ khẳng định hình dạng JSON hook in ra.

## Câu hỏi

Trích từ `plans/reports/research-261015-1502-agent-messaging-mailbox-design.md`: (1) khi nào agent *thật sự* nhận được tin, và có bảo đảm không; (2) tin đến thì giữ ngữ nghĩa gì (ack, trùng, thứ tự); (3) chống bão tin và tin cậy; (4) agent chờ người mà không giữ tiến trình; (5) liên máy; (6) việc nào của fgOS cần hộp thư thật sự.

## Cách từng nguồn giải quyết

### reason-network (nguồn chính, đã đọc source và test)

**Mức giao tin khai báo.** Mỗi session có `Tier` = `push | turn | pull`. `hook_tier` (`src/daemon/sessions.rs`) cho push với Codex (nếu tìm thấy binary `codex`), opencode, pi, Reason; mọi CLI chỉ có hook là `turn`; không hook là `pull`. Tier chỉ bị hạ khi một lần đẩy thất bại. *Vì sao họ chọn vậy:* mỗi CLI có cơ hội xả khác nhau, nên sự thật phải nằm ở từng session và hiện ra trong danh bạ để người gửi chọn người nhận. Cái họ chấp nhận: bảng tier là tri thức viết tay theo từng CLI, phải theo kịp mỗi bản CLI mới.

**Kênh vật lý theo CLI** (`src/daemon/mail.rs`, enum `Channel`): Claude Code ghi một dòng `{"type":"user",…}` vào socket nhắn tin của chính session (đường dẫn lấy từ `CLAUDE_CODE_MESSAGING_SOCKET` hoặc trường `messagingSocketPath` trong `~/.claude/sessions/<pid>.json`); Codex dùng lệnh `codex queue --thread <id> --message`; opencode và pi dùng API plugin (`promptAsync`, `sendUserMessage` với `deliverAs:"steer"`); các CLI còn lại dùng hook `PostToolUse`/`Stop`; cuối cùng là `check_inbox`. Bằng chứng: `src/agent.rs` (`post_to_claude`), `src/claude.rs`, `src/opencode-plugin.ts`, `src/pi-extension.ts`.

**Hai nhịp: ngắt giữa chừng và đợi chỗ nghỉ.** Tin có cờ `wake`. Giữa turn (`tool`), hook chỉ trả tin `wake`; ở chỗ nghỉ (`stop`, `prompt`, `poll`) trả tất cả. `--fyi` bỏ cờ `wake`. Test `hooks.py` khẳng định FYI không chèn ở `post-tool-use` mà đến ở `stop`. Không có mức `interrupt` và không có luật "đừng chèn vào câu trả lời cuối".

**Đánh thức khi rảnh.** Hook không thể đánh thức một CLI đang rảnh, nên plugin của opencode và pi có timer 5 giây hỏi `hook <agent> poll` rồi bơm tin qua API prompt của CLI. Giới hạn trên của độ trễ khi rảnh là 5 giây, viết thẳng trong code. Claude Code rảnh thì socket tự mở turn.

**"Đã giao" chỉ sau khi in được.** Daemon không tự đánh dấu đã đọc. Tin bị đánh dấu "đang bay" 90 giây (`IN_FLIGHT_TTL`), hook in ra stdout xong mới gọi `Delivered`; không xác nhận thì hiện lại. Đây là at-least-once cộng với khử trùng ULID ở bên nhận (`INSERT OR IGNORE`). Cái họ chấp nhận: "đã đọc" nghĩa là "đã đưa cho agent", không phải "agent đã xử lý"; không có gì đưa lại tin sau compact.

**Hook luôn câm khi hỏng.** Đọc stdin tối đa 3 giây, cả cuộc gọi tối đa 8 giây, lỗi nào cũng exit 0 và không in gì (test `hook exits 0 and prints nothing when Reason Network is broken`). Triết lý: hộp thư hỏng không được phá một lần gọi tool.

**Biên lai gửi ngược có lý do.** `send_message` trả từng người nhận một trạng thái cộng một câu nói *khi nào* họ sẽ thấy (xem `deliver` trong `mail.rs`). Câu chữ được chọn theo kênh thật.

**An toàn.** Bọc tin bằng `<reason-message from=… id=…>` và trường dữ liệu được lọc; chính sách `accept|hold|refuse` theo máy hoặc người; giới hạn 64 KB một tin, 60 tin/phút/máy (vượt thì `retry`, không bỏ), 12 tin agent-agent mỗi cặp có hướng trong 10 phút; agent không được gửi cho nhóm; máy chỉ nói thay người của chính nó. Phần mới nhất là `ask_user` với `Approval` có chữ ký (`src/daemon/ask.rs`): câu trả lời của người đi qua kênh khác kênh tin nhắn, và bên yêu cầu chỉ tin khi chữ ký, đội, người ký và session đích khớp.

**Vòng đời.** Session chỉ-hook hết hạn sau 6 giờ không có hook hoặc khi pid chết; session đã đi được quên sau 24 giờ cùng thư chưa đọc; outbox bỏ sau 7 ngày (`src/store.rs`). Không báo người gửi khi tin hết hạn.

**Liên máy.** QUIC iroh một kết nối cho mỗi cặp máy, khung JSON có độ dài; outbox gửi lại khi kết nối và mỗi 30 giây; ack trong 5 giây với `stored|delivered|held|refused|retry`; roster có chữ ký, chuỗi `admissions` giữ vĩnh viễn nên hội tụ không phụ thuộc thứ tự (`src/net.rs`, `src/team.rs`, có test hội tụ).

**Giới hạn đã kiểm chứng.** `tests/e2e/hooks.py` đưa payload giả vào binary hook và so chuỗi JSON in ra. Không test nào chạy Codex, Gemini, Copilot, Grok hay Cursor thật để xem lệnh chặn dừng có được CLI tôn trọng hay không. Câu "Stop: `decision:block`" trong `DESIGN.md` vì thế là hợp đồng hook của từng CLI được viết lại, chưa được repo này chứng minh. (`two_machines.py` dùng `codex` giả và chỉ dùng socket Claude thật khi chạy bên trong một session Claude Code.)

### pi (steer so với follow-up)

Hai kênh hàng đợi khi agent đang chạy: **steer** giao sau khi các tool call của turn hiện tại xong, trước lần gọi model kế; **followUp** đợi tới khi không còn tool call nào. Cả hai có chế độ `"one-at-a-time"` (mặc định) hoặc `"all"`. *Vì sao:* người dùng cần chỉnh hướng việc đang làm khác với nối thêm việc kế tiếp (`sources/pi.md#message-queue-steer-vs-followup`). Đây là cùng ý với `wake`/`--fyi` của reason-network và `Enter`/`Tab` của Codex trong báo cáo gốc, nhưng pi chỉ ra thêm một chiều: **gom một hay nhiều tin mỗi lần xả**.

### beehive (workflow mailbox) và bvr (MCP Agent Mail)

beehive đọc bàn giao qua hộp thư riêng của từng workflow (`runtime/handoffs/<workflow-id>/`), rơi về `HANDOFF.json` cũ nếu không có, và mặc định `pause` khi loại không rõ (`sources/beehive.md#workflow-mailbox-handoff`): hộp thư là *trạng thái bàn giao*, không phải kênh trò chuyện. bvr dùng MCP Agent Mail cho điều phối cùng-repo (`sources/beads-viewer-rust.md#mcp-agent-mail-coordination`): agent phải tự kéo, không có điểm xả do harness tạo. Cả hai là hai đầu của một dải: hộp thư như bản ghi bền theo luồng việc, và hộp thư như kênh agent tự đọc.

### herdr (trạng thái làm thẩm quyền)

herdr không giao tin, nhưng cách nó quyết "pane này rảnh hay bận" (`sources/herdr.md#status-authority-arbitration`: mỗi pane có đúng một nguồn thẩm quyền, hook đủ vòng đời thì hook thắng, nếu không thì quét màn hình) là đáp án cho câu hỏi hiện diện mà reason-network chỉ giải một nửa: reason-network lấy busy/idle từ hook và sự kiện plugin, và `prune` bằng pid sống. Hai nguồn bổ sung nhau chứ không cạnh tranh.

## So sánh & trade-offs

| Chiều | reason-network | pi | beehive | bvr/MCP Agent Mail | Ghi chú |
|---|---|---|---|---|---|
| Điểm xả tin | hook tool, hook stop, plugin poll 5 s, socket Claude | sau tool call của turn (steer), hết tool call (follow-up) | đọc ở startup | agent tự kéo | pi và reason-network đều có hai nhịp; chỉ reason-network có đánh thức khi rảnh |
| Phân biệt cấp bách | cờ `wake`, `--fyi` | steer so với follow-up | không | không | hội tụ độc lập giữa pi, reason-network (và Codex trong báo cáo gốc) |
| Ngữ nghĩa giao | at-least-once, ULID, "đang bay" 90 s, xác nhận sau khi in | không nêu | fail-safe mặc định | không nêu | chỉ reason-network có xác nhận sau khi in |
| Biên lai cho người gửi | trạng thái + câu nói khi nào thấy | không | không | không | duy nhất ở reason-network |
| Chống bão tin | 64 KB, 60/phút/máy, 12/10 phút/cặp, cấm nhóm với agent | không | không | không rõ | reason-network thiếu dedupe trùng nội dung và trần hàng đợi |
| Tin cậy | khung nguồn, policy, chữ ký máy, `Approval` ký | không áp dụng | không áp dụng | không rõ | `Approval` ký là phần mới |
| Bền qua compact | không | không rõ | có (bàn giao ghi file) | tuỳ | không nguồn nào ghim tin chưa xử lý qua compact |
| Hạn trả lời, leo thang | không | không | không | không rõ ("ACK overdue" chỉ gắn nhãn) | khoảng trống chung |
| Hạ tầng | daemon + iroh | trong tiến trình | file | MCP server + Git/SQLite | khác hẳn nhau |

Trade-off cốt lõi: reason-network đổi **độ trễ giây** lấy **một daemon thường trực mỗi máy cộng bảng tier viết tay**; fgOS (theo báo cáo gốc, mục 9) đang nghiêng về kênh Git refs độ trễ phút nhưng không có daemon.

## Giải pháp tổng hợp cho host

Ràng buộc của fgOS lấy từ báo cáo gốc, chưa kiểm lại trong phiên này: V-011 loại hộp thư tổng quát; nguyên tắc "một cửa"; event store đã có kênh liên máy (`refs/fgos/events/<machine>`); đã có hook cho các CLI và `activity.state` trong terminal-control; supervisor giữ attempt.

**Lấy từ reason-network:**
1. **Tier giao tin là thuộc tính khai báo của adapter CLI** trong chỗ fgOS đã đăng ký executor/driver, không thêm bảng mới: `push | turn | pull` cộng "bound độ trễ khi rảnh" (ví dụ 5 giây cho adapter có poll). Mọi `fgos` verb gửi tin đều trả biên lai kèm câu "khi nào bên kia thấy" suy ra từ tier.
2. **Hai nhịp với một cờ**: tin có `wake`; giữa step chỉ xả tin `wake`, ở ranh giới round và cổng dừng xả tất cả. Thêm chiều "gom một hay nhiều tin" của pi (`one-at-a-time` mặc định) để chống bão.
3. **"Đã giao" chỉ sau khi hook in được nội dung ra**, cộng "đang bay" có TTL để hai hook đồng thời không giao đôi.
4. **Hook luôn câm khi hỏng, có timeout cứng** (3/8/3 giây là điểm khởi đầu), cùng test dùng thư mục home không tồn tại.
5. **Khung nguồn và hai chốt cấm**: bọc tin có nhãn nguồn; agent không được gửi nhóm; agent không gửi chung cho người.

**Lấy từ pi:** tách hai kênh steer và follow-up thành hai giá trị của cờ ưu tiên, không phải hai hàng đợi.

**Lấy từ beehive:** hộp thư là bản ghi bền theo luồng việc (`unitRunId`), đọc có giá trị mặc định an toàn khi loại tin không rõ. Đây là phần khớp với V-011 nhất: hàng đợi *steer theo Unit* chứ không phải chat tự do.

**Lấy từ herdr:** hiện diện có đúng một nguồn thẩm quyền mỗi session; không trộn hai nguồn.

**Tự xây (cả bốn nguồn đều thiếu, đây là giá trị riêng của fgOS):**
- **Ack của agent và ghim qua compact:** tin chỉ rời danh sách "chưa xử lý" khi agent ack; sau compact tin chưa ack được xả lại.
- **Hạn trả lời, nhắc một lần, đổi người nhận, hàng tin chết** (quy tắc 8 của báo cáo gốc).
- **Đo ba số:** độ trễ ghi đến giao, tỉ lệ giao-chưa-ack sau T, số tin chạm hạn leo thang. Reason-network cho thấy số đo nào cũng đo được từ SQLite của họ, nhưng họ không đo.
- **Câu trả lời của người có chữ ký** như một loại sự kiện trong event store thay cho pop-up (cân nhắc riêng, xem Portable ideas).

**Bỏ và vì sao:**
- **Daemon iroh riêng cho mailbox:** trái V-011 và nguyên tắc một cửa; hàng đợi nên là một stream sự kiện trong event store, độ trễ bằng chu kỳ sync trừ khi thêm tín hiệu đánh thức.
- **Mặc định `accept` giữa các thành viên:** họ viết cho "friends who trust each other"; fgOS giữ mặc định chặt theo chênh lệch quyền.
- **Coi "đã in" là "đã đọc":** giữ ba trạng thái tách nhau (đã giao, đã ack, đã xử lý).
- **Tin nhắn qua pop-up OS:** fgOS đã có mẫu câu hỏi quyết định; pop-up chỉ hợp khi người ngồi trước máy.

**Kiểm chứng phải làm trước khi tin bảng CLI:** viết một thử nghiệm đo trên máy này, mỗi CLI một lần: hook `Stop` trả "block" kèm một câu, xem CLI có thật sự tiếp tục turn với câu đó không; và đo độ trễ từ lúc ghi tin đến lúc agent đang chạy tool 60 giây thấy tin. Cho tới khi có số đo, bảng tier của fgOS chỉ là giả thuyết.

## Portable ideas

| Ý | Từ | R/E/F gợi ý | Ghi chú |
|---|---|---|---|
| `delivery-tier-with-receipt` | reason-network:delivery-tier-declaration + sender-receipt-with-reason | R2 E2 F1 | E2: reason-network cộng cặp steer/queue của pi và Codex hội tụ ở ý "người gửi cần biết khi nào thấy"; F1 là một trường khai báo và câu chữ |
| `wake-flag-two-beats` | reason-network:mid-turn-wake-filter + pi:message-queue-steer-vs-followup | R2 E3 F1 | E3: hai nguồn độc lập trong distillery cộng Codex trong báo cáo gốc tự đến cùng hai-nhịp |
| `confirm-after-print-delivery` | reason-network:confirm-after-print-delivery | R2 E1 F1 | E1: một nguồn, có test hành vi trên daemon nhưng không trên CLI thật |
| `fail-silent-hook-with-hard-timeouts` | reason-network:hook-never-breaks-the-agent | R2 E1 F1 | rẻ, có test; kiểm tra xem hook hiện tại của fgOS đã có chưa trước khi làm |
| `signed-human-approval-event` | reason-network:signed-approval-ask-user | R3 E1 F3 | cần câu hỏi quyết định riêng; không phải hộp thư |
| `agent-ack-pin-through-compact` | (khoảng trống, không nguồn nào có) | R3 E0 F2 | không ghi candidate cho tới khi có thiết kế; liệt kê ở đây để khỏi mất |

## Open questions

1. Hook `Stop` của từng CLI (Claude Code, Codex, omp, pi, agy) có thật sự chặn dừng và nạp tin khi chạy ở chế độ `-p` hay không? (cần thử nghiệm đo, xem trên)
2. Trong reason-network, tier `push` của Codex phụ thuộc `codex queue`. Lệnh này có tồn tại ở bản Codex nào của máy chủ dự án không? (chưa kiểm)
3. Các file chưa đọc: `src/daemon/teamops.rs`, `src/daemon/directory.rs` (phần resolve), `src/wizard.rs`. Có chi tiết nào về địa chỉ liên máy hay hợp nhất mà báo cáo cần không?
4. Có nên mở lại V-011 chỉ cho phạm vi "hàng đợi steer theo Unit", và nếu có thì ở mức nào tin được ghi vào event store? (quyết định của chủ dự án)
