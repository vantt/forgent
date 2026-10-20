# Đo thật: hook và tin chèn vào agent đang chạy trên Claude Code, Codex, omp, pi, agy

## Tổng hợp nhanh

Mỗi CLI cần một đường riêng để đưa tin vào session. Bảng dưới là kết quả đo trên máy này (mỗi cấu hình một lần, chế độ không tương tác và REPL); chi tiết, điều kiện và hạn chế nằm ở các phép đo bên dưới.

| CLI | Tin giữa các bước và ở điểm dừng | Đánh thức khi rảnh | Độ trễ khi tool đang chạy | Điều kiện dễ làm hỏng |
|---|---|---|---|---|
| Claude Code | hook `Stop` (chặn dừng) và `PostToolUse` | `SendMessage` giữa session cùng lớp quyền (giao ngay); socket cần `crossSessionInbound: accept`, 2,0 s | 1,9 s (tự tách tool dài); tin đến sau checkpoint cuối khi chỉ chờ tool nền thì **mất** | tiến trình ngoài ghi socket hoặc session lớp quyền thấp hơn bị **giữ và hỏi người** |
| Codex | hook `Stop`, `PostToolUse` | `codex queue --thread <id>`, khoảng 10 s | 39,6 s (bằng thời gian còn lại của tool) | hook chưa được tin bị **bỏ qua im lặng** (`--dangerously-bypass-hook-trust` để chạy tự động) |
| pi | extension: chèn ở `agent_end` bằng `sendUserMessage(..., {deliverAs:"followUp"})` | bộ đếm 5 s trong extension, câu trả lời sau 7,1 s | 37,7 s | thiếu `deliverAs` thì tin bị từ chối và **mất**; hỏi tin thư mục ở lần đầu |
| omp | extension như pi | bộ đếm 5 s, câu trả lời sau 6,3 s | 38,3 s | như pi |
| agy | hook `Stop` (viết phẳng) và `PostToolUse` (viết lồng theo `matcher`, trả `additionalContext`) | gõ một dòng tín hiệu có nhãn (`pane send-text` + Enter, không đổi focus), 19,1 s; bắt buộc có bộ chặn theo trạng thái | 45,3 s | file hook sai dạng bị bỏ qua im lặng; gõ vào hộp thoại làm Enter xác nhận mặc định "trust this folder"; người đang soạn dở bị nối chữ |

Hai kết luận chung: độ trễ khi tool đang chạy bằng thời gian còn lại của tool (không giảm được nếu không ngắt hoặc chạy nền), và phần *đáng tin cậy* (ack, hạn trả lời, chống bão, liên máy, đo lường) mới ở mức thiết kế, chưa có phép đo (xem bảng 14 vấn đề). Khuyến nghị K1 (không `accept` toàn cục, dùng `SendMessage` giữa worker cùng lớp quyền) đã được chủ dự án chốt; K2 (agy đánh thức bằng gõ tín hiệu có bộ chặn) đã được đồng ý hướng. Chưa đưa vào `fgos doctor` khi chưa có tính năng mailbox dùng nó.

## Phạm vi và cách đọc

- Thời điểm đo: 2026-10-19 16:40 đến 18:00 (Asia/Saigon), máy của chủ dự án.
- Mục đích: trả lời hai câu hỏi mở của `research-261015-1502-agent-messaging-mailbox-design.md` (mục 8.8 và 13): (1) hook "sắp dừng" của từng CLI có chặn việc dừng và đưa tin vào được không, khi chạy không tương tác; (2) tin đến lúc agent đang chạy một tool dài thì bao lâu sau agent thấy.
- Phiên bản: Claude Code 2.1.303, Codex 0.162.1, omp 18.11.2, pi 1.3.0, agy 1.4.2. (`agy` được cài giữa lúc đo, sau lần thử đầu không thấy binary.)

## Kết luận

1. **Cả năm CLI đều tiếp tục turn khi tin được đưa vào đúng điểm "sắp dừng", ở chế độ không tương tác.** Agent nhận câu chèn và làm đúng theo (trả `PINEAPPLE-7`). Vậy giả thuyết của reason-network (chặn dừng và nạp tin) đúng với năm CLI này, nhưng cần đúng cách cho từng CLI (xem bảng).
2. **Độ trễ nhận tin bằng thời gian còn lại của tool đang chạy.** Tin gửi ở giây thứ 10 trong lúc `sleep 45` thì Codex, pi, omp và agy thấy nó sau khoảng 38 đến 45 giây, đúng lúc tool xong. Đúng dự đoán của mục 3.1 của báo cáo gốc, nay đã có số đo.
3. **Claude Code là ngoại lệ có lợi:** nó tự đưa lệnh `sleep` dài sang chạy nền rồi hỏi thăm lại, nên các điểm xả đến dày hơn (trễ 1,9 giây trong lần đo hợp lệ). Đây là hành vi của Claude Code, không phải bảo đảm của hook; với tool thật sự chặn thì độ trễ vẫn bằng độ dài tool.
4. **Có bốn điều kiện dễ làm hỏng việc giao tin** mà tài liệu của reason-network không nêu rõ (bảng dưới): Codex bỏ qua hook chưa được tin, pi và omp từ chối tin chèn nếu không chọn `deliverAs`, agy bỏ qua cả file hook nếu sai dạng (hook `Stop` phải viết phẳng, hook `PostToolUse` phải viết lồng theo `matcher`), và với tool chạy nền thì checkpoint đến sớm hơn tin.

## Phép đo 1: chặn dừng và nạp tin

Cách đo: mỗi CLI chạy lệnh "trả lời đúng từ hello", một hook chỉ ở lần dừng đầu tiên trả về câu "MAILBOX PROBE … trả lời đúng từ PINEAPPLE-7". Đạt nếu đầu ra cuối là `PINEAPPLE-7` và hook được gọi hai lần (lần hai là lần dừng thật).

| CLI | Cơ chế cho điểm "sắp dừng" | Kết quả | Điều kiện cần |
|---|---|---|---|
| Claude Code `-p` | hook `Stop` trả `{"decision":"block","reason":…}` | **Đạt.** Hook gọi hai lần, cách nhau 1,6 giây, đầu ra `PINEAPPLE-7` | cấu hình hook qua `--settings` |
| Codex `exec` | hook `Stop` trả cùng JSON | **Đạt.** Đầu ra ghi `hook: Stop Blocked`, rồi lượt mới in `PINEAPPLE-7`; hook gọi hai lần cách nhau 2,5 giây | hook phải được tin: không có cờ `--dangerously-bypass-hook-trust` thì **hook bị bỏ qua hoàn toàn**, không báo lỗi (đã thấy ở lần chạy đầu); `hooks = true` trong `config.toml` |
| pi `-p` | extension (không có hook kiểu lệnh): ở `agent_end` gọi `sendUserMessage(text, {deliverAs:"followUp"})` | **Đạt** với `followUp`: agent chạy thêm một lượt, đầu ra `PINEAPPLE-7`. **Hỏng** khi không chọn `deliverAs`: lỗi "Agent is already processing. Specify streamingBehavior ('steer' or 'followUp')" và tin bị mất | phải truyền `deliverAs` |
| omp `-p` | cùng extension như pi (cùng tên sự kiện) | **Đạt** với `followUp`, đầu ra `PINEAPPLE-7` | như pi |
| agy `-p` | hook `Stop` trong `.agents/hooks.json` của project, trả `{"decision":"block","reason":…}` | **Đạt.** Hook gọi hai lần cách nhau 3,5 giây (`executionNum` 0 rồi 1), đầu ra `hello` rồi `PINEAPPLE-7` | file hook phải đúng dạng. Dạng lồng như các hook công cụ (`[{"matcher":…,"hooks":[{"command":…}]}]`) bị từ chối với lỗi "command hook must specify 'command'" trong log của agy và hook không chạy, **không báo ra màn hình**. Hook `Stop` phải viết phẳng: `"Stop":[{"type":"command","command":…}]`. Hook chạy theo `HOME` của tài khoản agy (hàm bọc `agy` đặt `HOME=~/.agy-homes/<tên>`); thư mục thử nằm trong workspace đã được tin |

Lưu ý riêng cho pi và omp: trong thứ tự sự kiện đo được, `agent_end` đến trước `agent_settled` (pi), còn omp không phát `agent_settled` trong log. Tin chèn ở `agent_end` vẫn chạy. Đây là chi tiết cho adapter của fgOS.

## Phép đo 2: độ trễ khi tool đang chạy

Cách đo: prompt "chạy `sleep 45` ở foreground rồi trả lời `done`". Ở giây thứ 10 một tiến trình ngoài ghi một file hộp thư. Một hook (Claude Code, Codex) hoặc extension (pi, omp) kiểm file sau mỗi lần dùng tool, nếu có thì chèn câu "trả lời `PINEAPPLE-7` thay cho `done`". Trễ = thời điểm chèn trừ thời điểm ghi.

| CLI | Gửi lúc | Chèn lúc | Trễ | Agent làm theo? |
|---|---|---|---|---|
| Codex | +10,0 s | +49,6 s | **39,6 s** (hết `sleep 45`) | Có, trả `PINEAPPLE-7` |
| pi | +10,0 s | +47,7 s | **37,7 s** | Có |
| omp | +10,0 s | +48,3 s | **38,3 s** | Có |
| Claude Code | +10,0 s | +11,9 s | **1,9 s** | Có, trả `PINEAPPLE-7` |
| agy | +10,0 s | +55,3 s | **45,3 s** (hook chỉ chạy một lần, sau khi tool xong; agy tự chuyển lệnh sang nền sau 10 s, `WaitMsBeforeAsync`) | Có, trả `PINEAPPLE-7`. Lần chạy lại với hook chỉ trả `{"additionalContext":…}` cũng đạt, nên khoá này là đủ. Hook `PostToolUse` phải viết lồng theo `matcher` |

Chú thích về Claude Code, để không hiểu sai số 1,9 giây:
- Lần đo đầu (prompt không ép foreground): Claude Code tự chạy `sleep 45` nền và hook `PostToolUse` chỉ chạy một lần, ngay lúc đó (trước giây 10), nên hook không có tin để chèn. Kết quả là `done`, tức tin không bao giờ được giao. Đó là một **kiểu mất tin thật**: checkpoint đã xảy ra trước khi tin đến và không còn checkpoint nào nữa vì agent chỉ chờ.
- Lần đo thứ hai (prompt ép foreground): hook chạy ở khoảng +9,6 s (trước khi tin đến) và lần nữa ở +11,9 s, 1,9 s sau tin, nên Claude Code vẫn tự biến tool dài thành các bước ngắn. Số 1,9 giây phản ánh nhịp đó, không phải độ trễ của một tool chặn thật.

## Phép đo 3: chế độ REPL (tương tác), tab đang rảnh

Cách đo: mỗi CLI chạy trong một tmux riêng (`tmux -L mailbox-probe`, tắt sau khi đo), gõ một lệnh để chạy một lượt, rồi (a) lặp lại phép chặn dừng của phép đo 1; (b) khi CLI đã rảnh, đưa một tin bằng kênh **không phải gõ phím**, đo thời gian từ lúc đưa đến lúc câu trả lời `PINEAPPLE-9` hiện trên màn hình. Thời gian có độ phân giải khoảng 0,5 đến 1 giây (tôi đọc màn hình theo chu kỳ).

| CLI | (a) Chặn dừng trong REPL | (b) Kênh đánh thức khi rảnh | Từ lúc đưa tin đến câu trả lời | Điều kiện |
|---|---|---|---|---|
| Claude Code | Đạt. Hook `Stop` gọi hai lần, màn hình hiện "Ran 1 stop hook" rồi `PINEAPPLE-7` | ghi một dòng `{"type":"user","message":{…}}` vào socket của session (`~/.claude/sessions/<pid>.json` → `messagingSocketPath`, dạng `/run/user/<uid>/cc-socks/<pid>.sock`) | **2,0 giây** | **Chỉ khi `crossSessionInbound` là `accept`.** Mặc định, session đang bỏ qua prompt quyền (`--dangerously-skip-permissions`, cũng là cách fgOS chạy agent) **giữ tin lại** và hiện hộp thoại "Held message from another session … Deny / Deliver"; session đứng chờ người bấm, tin không tới. Sau khi bấm Deliver tin mới tới. Người gửi bị nhận diện là "unidentified session [verified pid …]" |
| Codex | Đạt. Màn hình hiện `hook: Stop Blocked` rồi `PINEAPPLE-7` | `codex queue --thread <id> --message …` (lệnh trả về sau 0,11 giây "Queued message …") | **khoảng 10 giây** (độ phân giải 1 giây) | cần id luồng (có trong payload hook, `session_id`); thời gian 10 giây là của phía Codex, tôi chưa tách được xem do hàng đợi hay do cách đọc màn hình |
| pi | không đo riêng; xem bên dưới | extension: bộ đếm 5 giây, khi session rảnh và có tin thì `sendUserMessage(text)` | tin được chèn sau **3,9 giây**, câu trả lời hiện sau **7,1 giây** | extension phải do ta cài; pi hỏi "Trust folder" ở lần đầu, đứng chờ người |
| omp | không đo riêng; xem bên dưới | extension y hệt pi | câu trả lời hiện sau **6,3 giây** (chèn trong vòng 5 giây của bộ đếm) | như pi; omp báo có bản mới và hiện hộp thoại cập nhật ở lần mở |
| agy | Đạt, nhưng chậm hơn: hai lần gọi hook cách nhau **16,6 giây** (3,5 giây ở chế độ `-p`) | **không tìm thấy kênh nào khác ngoài gõ phím** (`agy` có `--remote-control` và `--input-format stream-json` chỉ cho chế độ in; chưa thử, xem câu hỏi mở) | không đo | `agy` hỏi "Do you trust the contents of this project?" ở lần mở đầu tiên của mỗi thư mục lạ, đứng chờ người (chế độ `-p` thì không hỏi) |

Về pi và omp: cơ chế "chặn dừng" của hai CLI này không phải hook mà là extension chèn tin ở `agent_end`. Ở chế độ REPL, vai trò đó thực tế do bộ đếm đánh thức khi rảnh làm (sau `agent_end` session rảnh, bộ đếm chèn tin trong vòng 5 giây). Tôi đã đo chế độ không tương tác (phép đo 1) và chế độ REPL rảnh (bảng trên), chưa đo riêng "chèn ở `agent_end` của một lượt REPL".

Tác dụng phụ của phép đo REPL (đã dọn hoặc cần biết): tôi đã xoá thư mục thử khỏi `trustedWorkspaces` của tài khoản agy sau khi nó tự được thêm vào. Claude Code và pi có thể đã nhớ quyết định tin thư mục thử trong cấu hình của chúng (Claude Code: câu hỏi "external imports" tôi chọn "No"); các thư mục này nằm trong `.fgos/runtime/tmp/` và không dùng cho việc nào khác.

## Phép đo 4: tin giữa hai session Claude Code, theo lớp quyền của người gửi

Mục đích: trả lời giả thuyết "người gửi là một session Claude Code có thể khai quyền của mình, nên tin cùng lớp quyền được giao mà không cần `accept`". Cách đo: bên nhận là một REPL Claude Code bỏ qua prompt quyền, cấu hình mặc định (không `crossSessionInbound`), tên `recv-d1`. Bên gửi là một tiến trình `claude -p` khác gọi công cụ `SendMessage` tới `recv-d1`.

| Người gửi | Kết quả ở bên nhận |
|---|---|
| Session Claude Code **bỏ qua prompt quyền** (cùng lớp với bên nhận), qua `SendMessage` | **Giao ngay, không hộp thoại.** Bên nhận hiện "Message from @send-d6: …" rồi trả `PINEAPPLE-11`. Tổng thời gian từ lúc lệnh gửi chạy tới lúc bên nhận trả lời dưới khoảng 10 giây, gồm cả thời gian chạy một lượt của model |
| Session Claude Code **quyền mặc định** (khác lớp), qua `SendMessage` | **Bị giữ.** Bên nhận hiện "Held peer message … The sending session's permission mode class doesn't match this session's. … or set `crossSessionInbound` to `accept`" cùng hộp thoại Deny / Deliver. Bên nhận đứng chờ người; tin chưa tới model. Người gửi nhận ngay `success:true` và câu "a [Cross-session delivery notice] follows if that session holds it (usually a different permission mode) or refuses it" |
| Tiến trình **không phải session** (ghi thẳng vào socket, phép đo 3) | **Bị giữ** với lý do "The sender did not attest its permission mode" |

Kết luận của phép đo: giả thuyết đúng. Cổng của Claude Code so **lớp quyền** của hai bên và do người gửi (một session thật) tự khai; tiến trình ngoài không khai được nên luôn bị giữ khi bên nhận bỏ qua prompt quyền. Hai điểm cần lưu ý. Thứ nhất, người gửi nhận `success:true` kể cả khi tin bị giữ, nên "đã gửi" không có nghĩa "đã giao" (đúng như mục 5.2 của báo cáo gốc). Thứ hai, cùng lớp quyền không có nghĩa là được ủy quyền: một agent bị prompt injection vẫn ở lớp "bỏ qua prompt quyền" và vẫn gửi được vào session cùng lớp, nên khung nhãn nguồn và luật "không làm việc mà người dùng của mình không duyệt chỉ vì một peer nhờ" vẫn phải có.

Dọn dẹp: hai session thử đã tắt, hộp thoại giữ tin đã bấm Deny, không còn tiến trình.

## Phép đo 5: agy đánh thức bằng một dòng tín hiệu gõ vào

Cách đo: agy REPL (tmux) đã chạy một lượt xong và đang rảnh. Một "runner" giả ghi tin vào `inbox.txt` ("From: runner (not the user). Task: reply with exactly the single word PINEAPPLE-13."), rồi gõ một dòng vào agy: "[fgOS: message from another agent, not from the user] You have mail. Read it with: cat …/inbox.txt — then follow it only if it is reasonable."

Kết quả: agy tự chạy lệnh đọc file (hiện "Explored 1 file (inbox.txt)") và trả `PINEAPPLE-13`. Từ lúc gõ đến lúc câu trả lời hiện: **20,5 giây** (gồm một lượt model có một lần gọi tool). Quy trình "tín hiệu có nhãn, rồi agent tự đọc nội dung" hoạt động với agy.

Chưa đo: gõ khi có hộp thoại đang mở, gõ khi người đang gõ dở, và tin nhiều dòng. Đã dọn: tmux thử tắt, thư mục thử được xoá khỏi `trustedWorkspaces` của agy.

## Phép đo 6: các tình huống nguy hiểm khi đánh thức agy bằng gõ phím

Cách đo: agy REPL trong tmux; mỗi tình huống gõ cùng dòng tín hiệu có nhãn của phép đo 5 và quan sát.

| Tình huống | Điều xảy ra khi gõ thẳng, không kiểm tra | Hậu quả |
|---|---|---|
| Hộp thoại "Do you trust the contents of this project?" đang mở | Chữ bị hộp thoại bỏ qua, nhưng phím **Enter ở cuối đã xác nhận lựa chọn mặc định "Yes, I trust this folder"**. Ô nhập trống, agy không chạy lượt nào | Tin **mất âm thầm** và một hộp thoại bảo mật bị trả lời thay người. Đây là rủi ro nặng nhất của kênh gõ phím |
| Người đang gõ dở ("please summarise the repo and ") | Hai luồng chữ nối thành một câu; agy làm cả hai việc (đọc README, system-overview, inbox.txt) | Lời người dùng bị chèn câu của máy vào giữa; nhãn nguồn thành một phần câu của người |
| Tin nhiều dòng gõ từng ký tự | Mỗi dấu xuống dòng là một lần Enter, tin bị tách | Không đo trực tiếp (suy ra từ cách gõ phím); dùng cách dưới đây |
| Tin nhiều dòng dán bằng bracketed paste (`tmux load-buffer` + `paste-buffer -p`) | Cả hai dòng vào ô nhập như một đầu vào, chờ Enter; sau Enter agy trả `LINE-ONE` rồi `LINE-TWO` | Dùng được cho tin nhiều dòng |
| agy đang bận khi gõ | Chữ vào ô nhập và được gửi đi khi gõ Enter; không đo thứ tự xử lý | Không đo; tránh bằng cách chỉ gõ khi rảnh |

Một **bộ chặn dựa vào màn hình** (`gate.py` trong thư mục thử): đọc 12 dòng cuối của màn hình, phân loại, chỉ gõ khi rảnh và ô nhập trống. Các dấu hiệu quan sát được trên agy 1.4.2: hộp thoại có dòng "enter Confirm" hoặc "Navigate"; đang bận có "esc to cancel" hoặc "Working…"; đang rảnh thì dòng nhập là một dấu `>` trơn; đang soạn dở thì sau `>` có chữ. Kết quả, mỗi trạng thái một lần: hộp thoại → từ chối (`dialog`), soạn dở → từ chối (`draft`), rảnh và trống → gõ (`idle-empty`, agy trả `PINEAPPLE-13`), vừa gõ xong → `busy`. Bộ chặn phân loại đúng cả bốn trạng thái.

Chưa đo: `activity.state` của herdr. Máy này có herdr thật đang chạy các session khác, kể cả một Unit Codex đang làm việc; tôi không tạo workspace hay session herdr để thử trên đó, và chưa có cách thử cô lập mà tôi chắc chắn không động tới server đang chạy (`herdr server stop` nhắm vào server đang chạy). Dấu hiệu màn hình ở trên là bằng chứng độc lập; việc herdr có phân biệt được "hộp thoại" với "rảnh" cho agy hay không cần được kiểm riêng khi có điều kiện cô lập.

Dọn dẹp: tmux thử tắt, các thư mục thử được xoá khỏi `trustedWorkspaces` của agy.

## Phép đo 7: trạng thái do herdr báo cho agy, và gõ qua herdr

Cách đo (đã được chủ dự án cho phép dùng herdr đang chạy): tạo một workspace tạm `mailbox-probe` (`herdr workspace create --no-focus`, workspace `w7`), chạy `agy` trong pane của nó bằng `herdr pane run`, đọc trạng thái bằng `herdr agent list` và `herdr agent explain`, đọc màn hình bằng `herdr pane read`, gõ bằng `herdr pane send-text` và `herdr agent prompt`.

| Tình huống của agy | `agent_status` của herdr | Ô nhập (đọc bằng `pane read`) |
|---|---|---|
| Hộp thoại "Do you trust this folder?" | **`blocked`** | không có dòng nhập |
| Rảnh, ô nhập trống | `idle` (hoặc `done` ngay sau khi vừa làm xong một lượt, chưa được "xem") | `>` trơn |
| Rảnh, người đang soạn dở ("my own draft") | **vẫn `idle`/`done`** | `> my own draft` |
| Đang chạy một lượt | `working` (liên tục suốt lượt, kể cả lúc `sleep` chạy nền) | — |

`herdr agent explain` cho agy: manifest `remote:…/agent-detection/remote/agy.toml` phiên bản 2026.10.05.1; khi không rule nào khớp thì trả `default_known_agent_idle_fallback` (tức coi là rảnh).

Hệ quả cho bộ chặn: `activity.state` một mình **không đủ**. Nó phân biệt được hộp thoại (`blocked`) và đang bận (`working`) nhưng **không phân biệt được ô nhập trống với ô nhập đang có chữ**; cần thêm một lần đọc màn hình (`pane read`) để thấy dòng nhập đúng bằng `>`. Điều kiện gõ: trạng thái là `idle` hoặc `done` **và** dòng nhập là `>` trơn.

Đo quy trình có bộ chặn: bộ chặn thấy `state=done`, `input=[>]` nên cho gõ; `herdr agent prompt … --wait` gửi dòng tín hiệu có nhãn, agy đọc `inbox.txt` và trả `PINEAPPLE-13`; từ lúc gửi đến lúc câu trả lời hiện: **31,6 giây** (nhiều hơn 20,5 giây ở phép đo 5 vì lần này chạy trong herdr và model chạy một lượt dài hơn; chưa tách nguyên nhân). Với người đang soạn dở, bộ chặn thấy `input=[> my own draft]` nên từ chối. Phím xoá dòng của herdr là `ctrl+u` (`BSpace` không được hỗ trợ).

Tác dụng phụ trong herdr đang chạy, đã xử lý: `herdr agent prompt` **chuyển focus** sang pane thử (kết quả trả về `focused: true`), nên tôi đã trả focus về pane `w6:p4S` bằng `herdr agent focus`, rồi đóng workspace thử `w7`. Các workspace khác (`w5`, `w6`) và các agent đang chạy (kể cả Unit Codex) không bị đụng tới. Thư mục thử đã được xoá khỏi `trustedWorkspaces` của agy. Hệ quả cho thiết kế: gõ bằng `agent prompt` làm đổi focus của người dùng; kênh gõ của fgOS nên dùng `pane send-text` cộng Enter (không đổi focus, chưa đo) hoặc chấp nhận đổi focus có chủ ý.

## Phép đo 8: gõ qua `pane send-text` cộng Enter (không đổi focus) và gõ khi agy đang bận

Cách đo: workspace tạm mới (`w8`, tạo bằng `--no-focus`), chạy agy trong pane, ghi lại pane và workspace đang focus trước và sau mỗi bước.

| Bước | Pane và workspace đang focus | Kết quả |
|---|---|---|
| Trước khi bắt đầu | `w6:p4S`, workspace `w6` | — |
| Sau khi tạo workspace, chạy agy, xác nhận hộp thoại tin cậy bằng `send-keys Enter` | không đổi | — |
| Bộ chặn thấy `state=idle`, `input=[>]`, gõ dòng tín hiệu có nhãn bằng `pane send-text` rồi `pane send-keys Enter` | **không đổi** (cả ngay sau khi gửi và sau khi agy trả lời) | agy đọc `inbox.txt` và trả `PINEAPPLE-13` sau **19,1 giây** |
| Đang chạy một lượt (`sleep 20`, trạng thái `working`), gõ thêm dòng tín hiệu thứ hai bằng cùng cách | không đo thêm | agy **xếp hàng**: làm xong lượt đầu (`first`) rồi mới xử lý tin, trả `PINEAPPLE-14`; tổng 31,4 giây kể từ lúc gõ; chữ không nối vào câu đang chạy |

Kết luận: `pane send-text` cộng `send-keys Enter` **không đổi focus** của người dùng (khác `herdr agent prompt`, phép đo 7), nên là cách gõ phù hợp cho kênh của fgOS. Gõ khi agy đang bận thì agy xếp hàng và xử lý sau lượt hiện tại, khác với trường hợp ô nhập đang có chữ dở của người (phép đo 6). Vẫn nên chỉ gõ khi rảnh để tin đến đúng thời điểm, nhưng gõ nhầm lúc bận không làm hỏng lượt đang chạy trong một lần đo này.

Hạn chế: mỗi tình huống một lần đo; chưa đo gõ khi agy đang bận **và** người đang soạn dở; thứ tự khi có nhiều tin xếp hàng chưa đo.

Dọn dẹp: workspace `w8` đã đóng, focus vẫn là `w6:p4S`, thư mục thử được xoá khỏi `trustedWorkspaces` của agy.

## Khuyến nghị

K1 đã được chủ dự án chốt (2026-10-19). K2 đã được chủ dự án đồng ý hướng (gõ tín hiệu); phép đo 6 bổ sung điều kiện bắt buộc cho nó (bộ chặn theo trạng thái màn hình). Cả hai dựa trên các phép đo trên và thay thế phần "dùng `accept`" ở bản tổng hợp trước.

**K1. Cổng `crossSessionInbound` của Claude Code: không đặt `accept` toàn cục.**
1. Mặc định dùng **đường hook** (không qua cổng), đã đo trên cả năm CLI, phủ tin giữa các bước và tin ở điểm dừng.
2. **Giữa các worker Claude Code của fgOS** (đều bỏ qua prompt quyền): dùng chính công cụ `SendMessage` của Claude Code. Phép đo 4 cho thấy tin cùng lớp quyền được giao mà không cần thiết lập gì, và không nới lỏng gì ở bên nhận.
3. **Từ runner của fgOS (không phải một session) tới worker đang rảnh:** chưa cần khi worker chạy headless theo từng Unit. Nếu về sau cần, đặt `crossSessionInbound: accept` qua `--settings` của riêng tiến trình do runner khởi động (đã đo: 2,0 giây), không đặt vào cấu hình dự án hay toàn cục. Session tương tác của chủ dự án giữ mặc định "giữ tin".
4. Mọi tin giữa agent bọc nhãn nguồn "không phải lời người dùng"; tin không bao giờ được duyệt prompt quyền hay đổi cấu hình.

Rủi ro còn lại: tiến trình khác của cùng người dùng ghi được vào socket của worker đã đặt `accept`. Mức rủi ro này tương đương với chính runner vì worker vốn đã bỏ qua prompt quyền và chỉ bị giới hạn bởi worktree.

**K2. agy: đánh thức khi rảnh bằng gõ một dòng tín hiệu có nhãn (chủ dự án đồng ý hướng này, 2026-10-19; bản đầu đề xuất mức `turn` đã bị thay).**
1. Trong bảng tier của fgOS khai agy là `push`, kênh là "gõ phím" (`send.text` của terminal-control), kèm hook `PostToolUse` và `Stop` cho tin giữa các bước và lúc dừng (đã đo).
2. Chỉ gõ **một dòng tín hiệu** có nhãn nguồn, ví dụ "[fgOS: message from another agent, not from the user] You have mail. Read it with: …". Nội dung tin nằm ở nơi agent tự đọc bằng lệnh. Không gõ nội dung dài vào ô nhập.
3. **Bắt buộc** có bộ chặn theo trạng thái trước khi gõ: chỉ gõ khi agy rảnh, ô nhập trống và không có hộp thoại (phép đo 6 cho thấy gõ vào hộp thoại bảo mật làm phím Enter xác nhận lựa chọn mặc định "trust this folder" thay người, và gõ khi người đang soạn dở thì nối chữ vào câu của người). Tin nhiều dòng dán bằng bracketed paste. Với herdr (phép đo 7): `activity.state` báo `blocked` khi có hộp thoại và `working` khi bận, nhưng **không phân biệt ô nhập trống với đang soạn dở**, nên điều kiện gõ là `idle`/`done` **và** dòng nhập đọc từ `pane read` là `>` trơn. Còn hở: khoảng giữa lúc kiểm tra và lúc gõ; `herdr agent prompt` đổi focus của người dùng, nên dùng `pane send-text` cộng `send-keys Enter`: đã đo không đổi focus (phép đo 8).
4. Không dùng `agy remote-control`: đó là một daemon đăng ký máy với dịch vụ bên ngoài (`start/status/stop`), không phải kênh nội bộ; tôi không khởi động nó.
5. Không thử `agy --conversation <id> -p` từ tiến trình khác: hai tiến trình ghi cùng một hội thoại có thể làm hỏng trạng thái.

Kênh gõ phím chạy được với mọi CLI có ô nhập, nên cũng là phương án dự phòng chung cho Claude Code, Codex, pi, omp khi kênh riêng của chúng không dùng được (đánh đổi: tin giống lời người dùng, phải có nhãn).

## Điều này đổi gì với báo cáo gốc và deep-dive

- Mục 8.8 của báo cáo gốc: câu hỏi "hook sắp dừng có chặn và nạp tin không" nay có đáp án thực nghiệm cho cả năm CLI của fgOS (Claude Code, Codex, omp, pi, agy), ở chế độ không tương tác.
- Quy tắc 6 của mục 8.4 (tool dài chạy nền kèm handle) được xác nhận bằng số: độ trễ tối đa bằng độ dài tool chặn dài nhất. Thêm một rủi ro mới: **tool chạy nền làm checkpoint đến sớm hơn tin**, nên cần cổng dừng (quy tắc 4) hoặc đánh thức khi rảnh để bắt tin đến sau checkpoint cuối. Đây là kiểu mất tin "sau checkpoint cuối", không có trong bảng 8.5 của báo cáo gốc.
- Bảng tier của fgOS không thể chép từ reason-network: Codex `exec` cần hook được tin, pi/omp cần `deliverAs`, nên mỗi adapter phải có kiểm tra "đã hoạt động thật" trong `fgos doctor` (kiểm tra bằng đúng mẫu đo này), không chỉ kiểm tra "đã cài hook" (`*-hook-wired`).
- Ứng viên `delivery-tier-with-receipt` và `wake-flag-two-beats` trong `docs/distillery/porting-log.md` nay có bằng chứng đo trên máy này cho bốn CLI; điểm Evidence của các dòng đó có thể được chấm lại khi chủ dự án triage.

## Tổng hợp: các vấn đề chi phối việc gửi và nhận tin kịp thời đã được giải tới đâu

Thang: **Đã đo và giải được** (có số đo trên máy này, cho các CLI nêu tên), **Giải một phần** (đo được nhưng có điều kiện hoặc thiếu CLI), **Mới có thiết kế** (báo cáo gốc hoặc nguồn tham khảo đề xuất, chưa được đo), **Chưa đụng**.

| # | Vấn đề chi phối | Mức giải quyết | Bằng chứng | Còn thiếu |
|---|---|---|---|---|
| 1 | **Có điểm chèn tin an toàn giữa các bước không** (checkpoint) | **Đã đo và giải được** | Cả năm CLI nhận và làm theo tin chèn sau một lần dùng tool (phép đo 2), bốn CLI cho tin ở điểm "sắp dừng" (phép đo 1 và 3) | các CLI cần cơ chế khác nhau: hook (Claude Code, Codex, agy), extension (pi, omp) |
| 2 | **Tin không bị mất vì đến sau câu trả lời cuối** (cổng dừng) | **Đã đo và giải được** (năm CLI ở chế độ in; ba CLI hook ở REPL) | Chặn dừng và nạp tin hoạt động ở Claude Code, Codex, agy, pi, omp (phép đo 1) và ở REPL của Claude Code, Codex, agy (phép đo 3) | agy ở REPL mất 16,6 giây để tiếp tục; luật hoãn "đừng sửa câu trả lời đã chốt" (`NextTurn` của Codex trong báo cáo gốc) chưa đo |
| 3 | **Độ trễ do tool dài** | **Giải một phần** | Độ trễ = thời gian còn lại của tool: 38 đến 45 giây với `sleep 45` ở Codex, pi, omp, agy; Claude Code 1,9 giây vì tự tách tool | Giảm độ trễ cần ngắt tool đang chạy (mức `interrupt`, chưa đo) hoặc cho tool dài chạy nền; tool chạy nền lại gây lỗi mới ở dòng 4 |
| 4 | **Tin đến sau checkpoint cuối của một agent chỉ đang chờ tool nền** | **Giải một phần** | Phát hiện mới: Claude Code chạy `sleep` nền, hook chạy một lần trước khi tin đến, tin không bao giờ được giao (phép đo 2, lần đo đầu) | cần cổng dừng hoặc đánh thức khi rảnh bắt tin này; chưa đo cách bắt trong tình huống đó |
| 5 | **Đánh thức một agent đang rảnh** | **Giải một phần** | Claude Code: 2,0 s qua socket (cần `accept`); Codex: khoảng 10 s qua `codex queue`; pi, omp: dưới 5 s cộng thời gian chạy một lượt (6 đến 7 s tới câu trả lời) qua bộ đếm trong extension | agy: chỉ có kênh gõ một dòng tín hiệu có nhãn, đã đo 20,5 giây tới câu trả lời (phép đo 5); còn thiếu phát hiện hộp thoại và ô nhập đang có chữ, và rủi ro xoá nguồn gốc (mục 8.6 của báo cáo gốc) vẫn cần nhãn |
| 6 | **Tin cậy: một agent không được coi tin của agent khác là lời người dùng** | **Giải một phần** (đo đầy đủ cho Claude Code) | Claude Code so lớp quyền hai bên: người gửi là session cùng lớp (bỏ qua prompt quyền) được giao ngay; session lớp thấp hơn hoặc tiến trình ngoài bị **giữ và hỏi người** (phép đo 3 và 4) | cùng lớp không bằng được ủy quyền (agent bị injection vẫn cùng lớp), nên cần khung nhãn nguồn; các CLI khác (Codex, pi, omp, agy) chưa đo xem có cổng tương tự không; quyết định K1 chờ chủ dự án |
| 7 | **Hộp thoại tin cậy làm đứng tự động hoá** | **Phát hiện mới, chưa giải** | Codex bỏ qua hook chưa được tin mà không báo; `agy` REPL hỏi tin thư mục; pi hỏi tin thư mục; Claude Code hỏi "external imports"; omp hỏi cập nhật | cần quy trình cài đặt đặt trước các tin cậy này (`fgos setup`) và một kiểm tra "hook thật sự chạy" |
| 8 | **Ack của agent, ghim tin qua compact** | **Mới có thiết kế** | Không CLI nào hay nguồn nào đã đọc (kể cả reason-network) làm; "đã giao" chỉ là "đã đưa cho agent" | thiết kế và đo (compact giữa chừng) |
| 9 | **Hạn trả lời, leo thang, hàng tin chết** | **Mới có thiết kế** | Quy tắc 8 mục 8.4 của báo cáo gốc; không nguồn nào làm | thiết kế; cần quyết định về V-011 |
| 10 | **Chống bão tin, giới hạn, loại trùng** | **Mới có thiết kế** (một phần có tiền lệ) | reason-network có giới hạn kích thước, tốc độ, cặp agent; thiếu loại trùng và trần hàng đợi (đọc source, chưa đo) | đo trên fgOS khi có cài đặt |
| 11 | **Agent chờ người mà không giữ tiến trình** | **Mới có thiết kế** | `ask_user` của reason-network giữ tiến trình; LangGraph có checkpoint bền (báo cáo gốc 4.5) | chưa đo ở CLI nào |
| 12 | **Giao tin liên máy** | **Mới có thiết kế** | Báo cáo gốc mục 9 và reason-network (iroh); không có phép đo nào ở lượt này | phép đo hai máy; độ trễ chu kỳ sync của event store |
| 13 | **Đo lường (độ trễ ghi đến giao, tỉ lệ giao chưa xử lý, số tin chạm hạn)** | **Chưa đụng** | Chỉ có số đo một lần ở trên, không có bộ đo chạy thường xuyên | thiết kế chỉ số khi có cài đặt |
| 14 | **Hiện diện thật** (ai đang sống, rảnh hay bận, nhận được tin không) | **Mới có thiết kế** (một phần đo gián tiếp) | Các CLI cho biết trạng thái qua hook/extension (agent_start/agent_end, `fullyIdle` ở agy, `status` ở file phiên Claude Code); chưa đo độ chính xác | thiết kế nguồn thẩm quyền duy nhất cho trạng thái (herdr: một nguồn mỗi session) |

**Đọc tổng quát.** Phần *cơ học của việc đưa một tin vào một session* (dòng 1, 2, 3, 5) đã được giải và đo cho bốn đến năm CLI của fgOS, kèm điều kiện riêng của từng CLI. Phần *đáng tin cậy và vận hành* (dòng 6 đến 14: tin cậy, hộp thoại tin cậy, ack, hạn, chống bão, chờ người, liên máy, đo lường, hiện diện) mới ở mức thiết kế hoặc phát hiện, **chưa có phép đo nào chứng minh**. Độ trễ thực tế do bốn yếu tố cộng lại: độ dài tool (không giải được trừ khi ngắt), kênh đánh thức (2 đến 10 giây khi có kênh, vô hạn khi không có), cổng tin cậy (vô hạn nếu người không bấm), và hộp thoại một lần ở lần mở đầu.

**Khuyến nghị theo phép đo.** Nếu fgOS làm mailbox: (a) dùng đường hook cho tin giữa các bước và ở điểm dừng vì đã đo được trên cả năm CLI; (b) với tin đánh thức khi rảnh dùng kênh riêng theo CLI (Claude Code: `SendMessage` giữa các session cùng lớp, hoặc socket với `accept` đặt riêng cho tiến trình do runner khởi động; Codex `queue`; pi/omp bộ đếm của extension; agy khai `turn`), xem mục Khuyến nghị; (c) coi dòng 6 và 7 là điều kiện cài đặt trước (nằm ở `fgos setup`/`doctor`) chứ không phải chi tiết; (d) phần ack, hạn, chống bão là giá trị riêng của fgOS và cần thiết kế trước khi viết.

## Hạn chế của phép đo

- Mỗi cấu hình chỉ chạy một lần, nên không có phân phối độ trễ; con số của Codex, pi, omp (38 đến 40 giây) khớp lý thuyết (tool còn lại 35 giây cộng độ trễ khởi động), nhưng không cho biết độ lệch.
- Phép đo 1 và 2 chạy ở chế độ không tương tác (`-p`, `exec`); phép đo 3 chạy REPL trong tmux, độ phân giải khoảng 0,5 đến 1 giây vì đọc màn hình theo chu kỳ.
- REPL chưa đo: tin chèn giữa lúc tool dài chạy (chỉ đo ở chế độ in), chèn ở `agent_end` của pi/omp trong REPL, kênh đánh thức của agy, và luật hoãn khi agent vừa phát câu trả lời cuối.
- Các kênh socket của Claude Code và `codex queue` chỉ được đo ở chế độ REPL rảnh; chưa đo khi session đang bận.
- Dùng tài khoản đang bật trên máy (Codex `tetnu`, pi `openai-tetnu`, omp `openai-tetnu`, agy `tetnu`) và một lượt gọi model rất ngắn mỗi lần; Codex dùng thư mục home cô lập chỉ chứa symlink tới `auth.json`.
- Script đo nằm ở `.fgos/runtime/tmp/mailbox-probe/` (được gitignore): `stop-probe.py`, `post-probe.py`, `probe-ext.ts`, `probe-ext-post.ts`. Không có script nào ghi vào cấu hình thật của các CLI. Lần chạy `npm run fgos:dev` vô ý trong lúc tìm tên báo cáo đã biên dịch Rust ở `target/`, không đổi file nguồn.

## Câu hỏi còn mở

1. Hook `PostToolUse` của agy còn có thể ghi đè kết quả tool (`overwriteResult` theo định nghĩa protobuf trong binary; chưa thử riêng). Có cần cho adapter không, hay `additionalContext` là đủ?
2. K2 (đã đồng ý hướng): bộ chặn đã được đo bằng màn hình (phép đo 6) và bằng herdr thật (phép đo 7: herdr phân biệt hộp thoại và bận, không phân biệt ô nhập đang soạn dở, cần đọc thêm màn hình). Đã đo xong: `pane send-text` cộng Enter không đổi focus, và tin gõ khi agy đang `working` được xếp hàng (phép đo 8). Còn lại: khoảng hở giữa kiểm tra và gõ, gõ khi bận mà người đang soạn dở, và thứ tự nhiều tin xếp hàng. (`agy remote-control` là daemon đăng ký với dịch vụ ngoài, chưa khởi động và không khuyên dùng.)
3. K1: có chấp nhận "không `accept` toàn cục; `SendMessage` giữa worker cùng lớp; `accept` theo `--settings` chỉ khi runner cần đánh thức worker rảnh" không? (quyết định của chủ dự án; liên quan trực tiếp dòng 6 của bảng tổng hợp)
4. Các CLI khác (Codex, pi, omp, agy) có cổng tin cậy theo lớp quyền tương tự Claude Code không? Chưa đo.
5. Có nên dò thêm: Codex `queue` mất khoảng 10 giây là do hàng đợi của Codex hay do cách đo?

**Đã quyết (2026-10-19, chủ dự án):** chưa đưa mẫu đo này thành kiểm tra trong `fgos doctor`. Lý do: chưa có tính năng mailbox nào dùng nó, nên một kiểm tra chạy thật sự sẽ là chi phí không có người dùng; cổng "Install/setup/doctor" trong `AGENTS.md` chỉ yêu cầu đăng ký vào `doctor` khi thêm một thứ cần đến. Mẫu đo giữ ở dạng thử nghiệm thủ công; chuyển thành kiểm tra khi quyết định xây mailbox.
