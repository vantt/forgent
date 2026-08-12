# DISCUSSION — herdr-web-dashboard

Item: tsk-ldb — "nâng cấp herdr-plugin thành 1 orchestrator thật thụ có các
core component: 1) herdr orchestrator (đã làm), 2) tui dashboard chạy trên
herdr (đã làm), 3) web dashboard, webserver tự quản tự host frontend..."

## 1. Trạng thái hiện tại

Vòng 2. Người dùng đã trả lời cả 5 câu hỏi mở của vòng 1 (xem §5). Trong
lúc xử lý câu trả lời #5 ("tôi nhớ trước đã đặt vấn đề map câu hỏi->câu trả
lời rồi"), phát hiện một cuộc bàn trước đó rất sâu (12+ vòng,
`docs/history/gate-question-quality-and-routing/DISCUSSION.md`, item
`tsk-65i`+`tsk-539`, cả hai vẫn `todo/discovery`) đã đề xuất gần như đúng
kiến trúc item này đang hình thành, và đã CHỐT một số quyết định liên quan
trực tiếp (D7 hai vùng lưu trữ, Q13 đóng — ngôn ngữ tự do, Q8 đóng — hoãn
đổi lược đồ event). Đang chờ người dùng quyết 2 điểm ranh giới còn mở ở
cuối §5 trước khi viết §6: (a) tsk-ldb vs tsk-539 chia việc thế nào, (b)
lập trường bảo mật khi mở cổng HTTP.

## 2. Mục tiêu & đề bài

herdr-plugin hiện có 2 trong 3 core component người dùng hình dung cho một
"orchestrator thật thụ": (1) herdr-orchestrator — cơ chế tự launch pane
theo settings bật/tắt cho discover/merge/retro/cleanup (tsk-2xt và các con
tsk-2m5/tsk-2ja/tsk-57q, đều đã `done`), và (2) TUI dashboard chạy ngay
trong herdr — cockpit hiển thị work-items, in-progress list, action queues
(NEED ANSWER/MERGE LIST/AFTER DELIVER), detail modal, mouse/keyboard focus,
đã qua rất nhiều vòng nâng cấp (từ tsk-19y tới tsk-bvh, phần lớn `done`).
Component còn thiếu là (3): một **web dashboard** — tự chạy webserver,
tự host frontend của chính nó (không phụ thuộc herdr's TUI runtime) — với
trọng tâm là một taskboard đẹp, và đặc biệt là **view chi tiết một task**:
lịch sử những gì agent đã thực sự làm trên task đó, lịch sử các câu hỏi đã
hỏi/đã trả lời, và — quan trọng nhất theo lời người dùng — phần "câu hỏi
cần trả lời" (câu hỏi đang treo, item đang ở `awaiting-human`) phải được
framing lại thành một narrative ngắn gọn, dễ hiểu, đủ chi tiết để một
người không có context trong đầu vẫn trả lời được nhanh, thay vì hiện
nguyên văn dữ liệu thô.

## 3. Vấn đề rõ / chưa rõ

| # | Nội dung | Trạng thái | Ghi chú |
|---|----------|-----------|---------|
| 1 | Component 1 (herdr-orchestrator) và 2 (TUI dashboard) đã tồn tại và `done` | Rõ | tsk-2xt/2m5/2ja/57q (orchestrator); tsk-19y…tsk-bvh (TUI) — xác nhận qua `fgos list --all --json` |
| 2 | Chưa có item nào từng đề cập "web dashboard"/"webserver" trong toàn bộ backlog hiện tại | Rõ | grep title+description của 57 item herdr-* — 0 match |
| 3 | Repo hiện KHÔNG có dependency web/http nào (`package.json` chỉ có `yaml`) | Rõ | không Express/Fastify/http.createServer nào tồn tại trong `src/` |
| 4 | Dữ liệu "lịch sử task agent đã làm" đã có sẵn qua `fgos show <id> --json`: `discovery`, `decisions`, `gates`, `outcome`, `friction`, `settlement`, `learning` | Rõ | xác nhận bằng lệnh `show --json` thật trên tsk-2xt |
| 5 | Dữ liệu câu hỏi/trả lời: `ask` (câu hỏi) nằm trên event `work.move` khi chuyển sang `awaiting-human`; `gates[id]` còn giữ `askRationale/askAlternatives/askSource` (checkpoint lúc hỏi) và `rationale/alternatives/source` (lời cuối lúc trả lời) — theo `src/state/awaiting-context.mjs` | Rõ | đọc trực tiếp file nguồn |
| 6 | Một item bị park nhiều lần (nhiều vòng hỏi/đáp) có giữ lại TOÀN BỘ lịch sử Q&A hay chỉ giữ bản mới nhất | Rõ | Hỗn hợp: `gates[id].ask`/`.answer` GHI ĐÈ (chỉ giữ bản mới nhất); nhưng `gates[id].askHistory` là mảng CỘNG DỒN mọi câu hỏi (xác minh thật: tsk-48i park 23 lần → `askHistory.length===23`); câu trả lời đầy đủ nằm ở `settlements[id]` (mảng `{kind:'answer',...}`, cũng 23 bản ghi cho tsk-48i) chứ không phải ở `gates`. `show`/`check` hiện cap hiển thị 5 bản ghi settlement gần nhất (`SETTLEMENT_DISPLAY_CAP=5`, bin/fgos.mjs:564) dù `count` vẫn phản ánh tổng thật. Raw `.fgos/events.jsonl` luôn giữ đủ 100% — không mất gì. `docs/specs/work-state.md` §"Bản ghi cổng-người" mô tả G3/G4 là ghi đè nhưng KHÔNG document `askHistory`. |
| 7 | Stack: chấp nhận thêm dependency thật, miễn build ra MỘT binary kèm asset nhúng sẵn để chạy | Rõ | Người dùng chốt vòng 2. Khớp với `tsk-65i`/`tsk-539` DISCUSSION.md Q13 (đóng vòng 9): *"lựa chọn không phụ thuộc p-09351985… ngôn ngữ hoàn toàn tự do — tiêu chí thật chỉ là tái dùng `ports.rs`/`WorkItemSource` đã có"* — herdr-plugin đã Rust, đã có `trait WorkItemSource`/`PaneRegistry` làm seam sẵn, và Rust có `rust-embed`/`include_dir!` để nhúng frontend build vào 1 binary. Không xung đột gì với quyết định cũ. |
| 8 | Vòng đời webserver: gắn vào herdr-plugin (không phải lệnh `fgos web` riêng, không phải launcher tổng chưa tồn tại) | Rõ | Người dùng chốt vòng 2. `tsk-65i`/`tsk-539` round 4-5 có đề xuất một "launcher tổng" rộng hơn (điều phối cả herdr lẫn runner) nhưng đó **vẫn đang ở stage discovery, chưa hiện thực** — tsk-ldb đi trên hạ tầng CÓ SẴN (herdr-plugin binary đã chạy được) thay vì chờ launcher tổng. |
| 9 | Ranh giới với TUI dashboard: chạy song song, KHÔNG thay thế; mục đích riêng là môi trường tương tác thoải mái hơn — đặc biệt cho approve/duyệt, vì UI/UX của TUI hiện "quá bó hẹp, gây mental pressure" | Rõ | Người dùng chốt vòng 2. Mở rộng phạm vi thêm: không chỉ Q&A, còn cả **cơ chế duyệt/approve** (gate-approve — xem hàng 12 dưới, đây là kênh chiếm khối lượng hỏi-người LỚN NHẤT theo `tsk-539` D4: 48/54 lượt gần đây, gấp 8 lần kênh `ask`). |
| 10 | "Framing câu hỏi dễ hiểu": CẦN một bước tổng hợp nội dung mới, không chỉ render lại dữ liệu thô — vì hiện agent viết `ask` quá brief, hay trích luật D1/D2 mà người đọc lại (nhất là sau thời gian dài, nhiều việc) không còn nhớ nghĩa | Rõ | Người dùng xác nhận. Đây **chính là mục tiêu của `tsk-539`** (STR71, "ask self-sufficiency, ask tự đứng được" — cùng cluster). Xem Q-mới bên dưới về ranh giới tsk-ldb ↔ tsk-539. |
| 11 | Cấu trúc dữ liệu ask/answer hiện tại: có phải chỉ lưu Q+A thô, không có "brief"? | Rõ — KHÔNG đúng như giả định | Thực tế đã có sẵn đúng 2 tầng người dùng mô tả: **câu hỏi** → `gates[id].askHistory` (mảng, CỘNG DỒN mọi lần hỏi — không cần đổi); **brief/rationale lúc hỏi** → `gates[id].askRationale/askAlternatives/askSource` (GHI ĐÈ, chỉ giữ bản mới nhất — đúng như người dùng muốn, "brief không cần history"). Không cần đổi schema cho ý này. |
| 12 | Q&A không phải kênh yes/no lớn nhất — kênh `work.gate-approve` (3 cổng skill duyệt: contextApprove/planApprove/validateApprove) lớn gấp 8 lần (48 vs 6 lượt, sau khi gỡ 1 LLM judge dư) | Rõ, từ `tsk-539` D4 (đã chốt, seq 9771) | Trực tiếp giải thích lý do người dùng thấy TUI "gây mental pressure" ở khâu duyệt — không phải cảm giác, có số đo. Ảnh hưởng scope: nếu web dashboard muốn thật sự giảm mental pressure ở approve, cần hiển thị/thao tác được cả `gate-approve` events, không chỉ `ask`/`answer`. |
| 13 | Ghép cặp nhiều câu hỏi ↔ nhiều câu trả lời (điều người dùng nhớ đã từng đặt vấn đề) — có cần thêm liên kết tường minh (id/con trỏ) vào lược đồ event không? | Rõ — KHÔNG cần, đã kiểm chứng | `tsk-65i`/`tsk-539` S4(b) (vòng 12b): FSM chặn sẵn — item rời `frontier` ngay khi vào `awaiting-human`, không session nào hỏi-đè được trước khi có `answer`. Nên `askHistory[i]` ghép với bản ghi `answer` thứ i trong `settlements[id]` (lọc `kind:'answer'`) **theo đúng thứ tự `seq`** là đủ, không có race, không cần trường liên kết mới. Q8 (tsk-65i/539) đã đóng "HOÃN" chính vì lý do này — không đổi lược đồ event, nhu cầu thật nằm ở tầng đọc/trình bày. |
| 14 | Nguồn dữ liệu narrative "lịch sử agent đã làm": `CONTEXT.md` (vùng người, git-versioned) hay `state.decisions` (vùng máy, ~100 token/bản, hiện 35% là ghi-sổ máy móc + 12% thiếu rationale)? | **Chưa rõ, cần người dùng xác nhận** | `tsk-65i`/`tsk-539` D7 (đã chốt, seq 10187) thiết kế sẵn: `CONTEXT.md` là vùng-người, đích render web UI (chính sơ đồ D7 có mũi tên `CONTEXT.md → Web UI`); `state.decisions` là vùng-máy, KHÔNG được nối cho consumer mới cho tới khi qua "phép kiểm độ sạch" (hiện chưa qua). Gợi ý: tsk-ldb nên đọc `CONTEXT.md`/`plan.md` (đã narrative, tường minh) làm nguồn chính cho "lịch sử agent đã làm", không phải đọc thẳng `decisions[]` thô — tránh hiện lại đúng 35% nhiễu đã đo được. |
| 15 | Mở cổng HTTP đổi threat model của fgOS (hiện chỉ nghe từ terminal người dùng) | Rõ — cảnh báo đã có sẵn trong `tsk-65i`/`tsk-539` DISCUSSION.md §6 | *"`verify` chạy như một lệnh shell… Mở cổng HTTP đổi hẳn threat model: ai tới được cổng đó đều ghi được `verify`, và `verify` được thực thi. STR38 đã tự ghi yêu cầu identity gate trước khi dịch xuống CTR001 — không vá sau được."* Cần chốt lập trường bảo mật cho tsk-ldb TRƯỚC khi viết §6 (xem Q-mới bên dưới). |

## 4. Quyết định đã chốt

(chưa có mục nào — vòng đầu tiên, chưa gì đủ ổn định để mint D-ID)

## 5. Q&A log

**[2026-08-12, vòng 1 — scouting]** Scout trước khi hỏi (bắt buộc theo
fgos-coding-shaping D6):
- `fgos list --all --json` → 57 item có chữ "herdr" trong title/description;
  0 item nhắc "web dashboard"/"webserver"/"self-host" — xác nhận đây là
  scope mới, không trùng việc đã có.
- `docs/decisions/0028`, `0029` D17, `0031`: từ "orchestrator" từng bị cấm
  dùng (đổi thành "launcher") rồi được **gán nghĩa mới chính thức** —
  "tầng hợp thành T0: điều phối N đơn vị chạy đồng thời, ở lại" — khớp
  đúng với việc người dùng gọi herdr-orchestrator (tsk-2xt, tự launch
  nhiều pane theo settings) là "orchestrator". Không có xung đột thuật ngữ.
- `package.json`: chỉ 1 dependency (`yaml`) — toàn bộ fgOS hiện tại là
  Node thuần, không framework. Đây là tín hiệu triết lý mạnh, cần người
  dùng xác nhận có muốn giữ hay chấp nhận phá lệ cho web dashboard.
- `fgos show tsk-2xt --json` → xác nhận shape thật: `{work, discovery,
  decisions, gates, outcome, friction, settlement, learning}` — đây chính
  là nguồn "lịch sử task agent đã làm".
- `src/state/awaiting-context.mjs` → xác nhận shape Q&A: `ask` (câu hỏi
  tại lần park hiện tại), `askRationale/askAlternatives/askSource` (agent
  tự chú giải lúc hỏi), `rationale/alternatives/source` (người trả lời
  lúc đáp), cộng `changedSinceAsk` (parent đổi gì kể từ lúc hỏi).

**Câu hỏi mở gửi người dùng (chưa trả lời):**

1. Web dashboard này phục vụ mục đích khác TUI dashboard ở điểm nào — xem
   từ xa/điện thoại không cần mở terminal herdr? Hay đơn giản là "cùng dữ
   liệu, giao diện đẹp hơn cho phần task-detail/Q&A" và có thể chạy song
   song, không thay thế TUI?
2. Về "framing câu hỏi dễ hiểu, ngắn gọn": bạn hình dung đây là một UI/layout
   tốt render lại dữ liệu thô sẵn có (ask/askRationale/askAlternatives),
   hay cần một bước tổng hợp nội dung mới (ví dụ agent tự viết một đoạn
   narrative ngắn NGAY LÚC `ask`, lưu lại làm field riêng, để web dashboard
   chỉ việc hiển thị)?
3. Stack: fgOS hiện tại zero-dependency (chỉ `yaml`). Bạn có chấp nhận thêm
   dependency thật cho web dashboard (vd một framework nhẹ như Fastify/Hono
   phía server, hoặc thậm chí chỉ Node `http` thuần + static HTML/JS không
   build step), hay muốn giữ nguyên triết lý zero-dep càng nhiều càng tốt?
4. Vòng đời webserver: chạy thường trực (daemon riêng, tự khởi động), hay
   chỉ chạy khi người dùng gõ lệnh (vd `fgos web` mở server + browser), hay
   gắn vào herdr-orchestrator để tự bật/tắt như 4 domain kia (discover/
   merge/retro/cleanup)?
5. "Lịch sử câu hỏi" — bạn muốn thấy TOÀN BỘ các lần hỏi/đáp qua nhiều vòng
   park của một task (nếu có), hay chỉ cần câu hỏi/trả lời gần nhất là đủ?
   Đã xác minh: dữ liệu ĐỦ để hiển thị full history (mọi câu hỏi trong
   `gates[id].askHistory`, mọi câu trả lời trong `settlements[id]`), nhưng
   nằm ở 2 chỗ khác nhau và `show`/`check` hiện tại chỉ hiện 5 bản ghi gần
   nhất — nên đây vẫn là quyết định thiết kế (web dashboard có tự query đủ
   cả 2 nguồn + ghép cặp ask/answer theo thứ tự thời gian không, hay chỉ
   cần cap 5 như hành vi hiện có là đủ).

**[2026-08-12, vòng 1 — bổ sung]** Research agent xác nhận câu hỏi #6 ở §3
(xem cột Ghi chú). Cập nhật câu hỏi #5 ở trên theo phát hiện này.

### 2026-08-12 — Vòng 2

**Người dùng trả lời cả 5 câu hỏi vòng 1** (tóm tắt, chi tiết ở §3 hàng 7-12):
1. Chạy song song TUI, không thay thế; mục đích riêng: môi trường tương
   tác thoải mái hơn, đặc biệt ở khâu duyệt/approve — TUI hiện "quá bó hẹp,
   gây mental pressure".
2. Xác nhận CẦN bước tổng hợp nội dung mới cho câu hỏi (không chỉ render
   dữ liệu thô) — vì agent hiện viết `ask` quá brief, hay trích D1/D2 mà
   người đọc lại không còn nhớ nghĩa. Đồng thời xác nhận: câu hỏi cần giữ
   FULL HISTORY, "brief" (rationale) chỉ cần bản mới nhất — không cần
   history của brief.
3. Chấp nhận thêm dependency thật, miễn build ra một binary kèm asset để
   chạy.
4. Gắn vào herdr-plugin.
5. Cần lịch sử TẤT CẢ câu hỏi, trình bày rõ và thoải mái nhất có thể.
   Nhắc lại: "trước đã đặt vấn đề xử lý nhiều câu hỏi và map câu hỏi ->
   câu trả lời rồi."

**Scout theo gợi ý #5 — tìm cuộc bàn trước đó (luật Scout First + tránh
quyết định lại cái đã quyết).** `grep` toàn `docs/` ra
`docs/history/gate-question-quality-and-routing/DISCUSSION.md` (items
`tsk-65i` + `tsk-539`, cả hai `todo/discovery`, 12+ vòng bàn, bắt đầu
2026-08-08). Đọc toàn bộ 1614 dòng. Đây không phải một cuộc bàn tình cờ
liên quan — nó **đã đề xuất gần như đúng kiến trúc item này** (round 4:
*"mở rộng herdr-plugin, biến nó thành 1 webserver nhỏ, cung cấp ui để xem
task và trả lời câu hỏi… một rust đóng gói khi chạy mở webserver và điều
phối cả tui"*) và đã CHỐT nhiều điểm liên quan trực tiếp:

- **Q13 (đóng, vòng 9):** ngôn ngữ implementation hoàn toàn tự do — chỉ
  cần đọc/ghi qua `fgos <verb>` (spawn, không link lib), tái dùng
  `ports.rs`'s `trait WorkItemSource` đã có trong herdr-plugin. Khớp thẳng
  với câu trả lời #3/#4 của người dùng hôm nay — không xung đột.
- **Q8 (đóng "HOÃN", vòng 12) + S4(b) (vòng 12b):** KHÔNG cần đổi lược đồ
  event (không cần `answerHistory`, không cần trường liên kết ask↔answer
  mới). FSM status đã chặn sẵn hỏi-đè (item rời `frontier` ngay khi vào
  `awaiting-human`), nên ghép `askHistory[i]` với bản `answer` thứ i trong
  `settlements[id]` theo thứ tự `seq` là đủ — đúng câu trả lời cho #5.
- **D7 (chốt, vòng 12, seq 10187):** "hai vùng lưu trữ cho hai người đọc"
  — `state.decisions` là vùng-máy (authoritative cho agent, ngắn, nhưng
  hiện 35% là ghi-sổ máy móc + 12% thiếu rationale, CHƯA đủ sạch cho
  consumer mới); `CONTEXT.md`/`plan.md` là vùng-người (narrative, tự do
  dài, git-versioned) — và sơ đồ D7 trong chính file đó đã vẽ mũi tên
  `CONTEXT.md → Web UI`. Đây gần như là câu trả lời sẵn có cho #2 của
  người dùng hôm nay: "framing dễ hiểu" = web dashboard đọc `CONTEXT.md`
  (đã narrative, đã tường minh) làm nguồn chính, KHÔNG phải cố render đẹp
  dữ liệu máy-đọc thô.
- **`tsk-539` (STR71, "ask self-sufficiency")** — mục tiêu nguyên văn của
  item này trùng gần như 100% với câu trả lời #2 của người dùng hôm nay
  (agent viết `ask` quá brief/trích D-ID mà người đọc không hiểu). Đây là
  một CHỒNG LẤN THẬT cần người dùng phân xử (xem câu hỏi mới #1 dưới).
- **Cảnh báo bảo mật (đã ghi sẵn trong file đó, chưa có trong item nào):**
  mở cổng HTTP đổi threat model — `verify` chạy như shell command, ai tới
  được cổng đều có khả năng kích hoạt nó; cần identity/auth gate trước khi
  chạm CTR001, "không vá sau được".
- **Kênh yes/no lớn nhất KHÔNG phải `ask`** mà là `work.gate-approve` (3
  cổng skill duyệt) — gấp 8 lần khối lượng gần đây (D4, tsk-539). Điều này
  củng cố trực tiếp lời người dùng ở #1 ("đặc biệt trong cơ chế duyệt và
  approve") bằng số đo thật, không chỉ cảm nhận.

**Hai câu hỏi mới cần người dùng quyết trước khi viết §6:**

1. **Ranh giới tsk-ldb ↔ tsk-539.** `tsk-539` (todo/discovery, chưa ai
   làm) đã tồn tại đúng để giải quyết "agent viết `ask` brief, trích D-ID
   khó hiểu" — đây là việc AUTHORING (sửa cách agent viết lúc hỏi, có thể
   ở tầng skill/prompt). tsk-ldb là việc RENDERING (dashboard hiển thị
   những gì đã có). Ba lựa chọn: (a) tsk-ldb chỉ làm phần render, dựa vào
   `CONTEXT.md`/plan.md sẵn có (D7) + không đợi `tsk-539`, và `tsk-539`
   tiếp tục là item độc lập cải thiện chất lượng `ask` tại nguồn; (b)
   tsk-ldb phụ thuộc `tsk-539` — chờ authoring tốt hơn trước khi build UI
   hiển thị; (c) tsk-ldb NUỐT LUÔN phạm vi của `tsk-539` (dashboard tự làm
   bước tổng hợp/viết lại câu hỏi cũ tại thời điểm render, không chờ sửa
   authoring). Đề xuất mặc định: (a) — tách rời, vì `CONTEXT.md` theo D7
   vốn đã là narrative đủ tốt để render ngay, không cần chờ `tsk-539`.
2. **Lập trường bảo mật cho webserver.** Mở cổng HTTP đổi threat model
   (cảnh báo có sẵn ở trên). Bind mặc định `localhost`-only (không expose
   ra ngoài máy), không auth (chấp nhận rủi ro vì chỉ nghe loopback)? Hay
   cần thêm một lớp auth tối thiểu (token/cookie) ngay từ v1? Đây là quyết
   định phải nằm trong thiết kế từ đầu, không vá sau được (theo cảnh báo
   STR38 đã trích ở trên).

## 6. Thiết kế đã chốt

(chưa có gì để tổng hợp — chưa có quyết định nào chốt ở §4)

## 7. Danh mục hạng mục / task

(chưa tách — chờ §6 có hình dạng cụ thể trước)
