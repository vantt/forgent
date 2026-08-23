# DISCUSSION — herdr-web-dashboard

Item: tsk-ldb — "nâng cấp herdr-plugin thành 1 orchestrator thật thụ có các
core component: 1) herdr orchestrator (đã làm), 2) tui dashboard chạy trên
herdr (đã làm), 3) web dashboard, webserver tự quản tự host frontend..."

## 1. Trạng thái hiện tại

**Vòng 5 — HỘI TỤ, người dùng đã chốt chuyển sang `exploring`.**

Phần chức năng ổn định từ vòng 3 (D1-D5, không vòng nào lật). Vòng 4-5 chỉ
làm chặt phần bảo mật:

- **D7** — bind mặc định `0.0.0.0` (lật vế bind của D6 ở vòng 4, giữ
  nguyên qua vòng 5 nên đủ điều kiện mint).
- **D8** — kiến trúc xác thực hai lớp **cộng dồn**, port idiom đã kiểm
  chứng từ `/home/vantt/projects/herdr-gateway`: cookie-session trước
  (token 24-byte hex → `/api/login` → cookie HttpOnly/SameSite=Strict,
  constant-time compare, 404 câm), cf-access là credential thay thế **có
  xác minh chữ ký JWT thật** (RS256/JWKS, require exp/iss/aud).
- **Một kết luận của chính tôi ở vòng 4 đã bị bác** bằng prior art: "hai
  chế độ phải loại trừ nhau" là sai, vì chữ ký JWT được verify nên
  assertion không forge được. Ghi ở bảng "đã bị sửa" §4.
- Nền tảng vẫn đứng: fgOS không có tầng phân quyền nào (có chủ ý,
  `io-contract.md`, STR38/STR48 chưa xây) → bề mặt ghi qua mạng là
  allowlist hẹp `answer`/`approve`/`reject`, vì `verify` chạy như shell
  thật.

§6 đã viết lại toàn bộ phần Bảo mật theo prior art. §7: 3 task bắt buộc +
1 tuỳ chọn (cf-access) + 1 companion item (`tsk-539`).

**Bước tiếp theo:** bàn giao `fgos-coding-exploring` → `fgos-coding-planning`
(native-first, cùng phiên), sau đó đẩy `tsk-539` theo D5.

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
| 14 | Nguồn dữ liệu narrative "lịch sử agent đã làm": `CONTEXT.md` (vùng người, git-versioned) hay `state.decisions` (vùng máy) | Rõ | Áp dụng thẳng D7 của `tsk-65i`/`tsk-539` (đã chốt nơi khác, không re-derive): `CONTEXT.md`/`plan.md` là nguồn chính; `decisions[]` chỉ hiện như chi tiết mở rộng, không phải mặc định. Không có phản đối từ người dùng ở vòng 2 — giữ nguyên đề xuất. |
| 15 | Mở cổng HTTP đổi threat model của fgOS (hiện chỉ nghe từ terminal người dùng) | Rõ, ĐÃ SỬA ở vòng 4 | Vòng 3 người dùng chốt "thêm lớp auth tối thiểu" → D6. Vòng 4 người dùng sửa vế bind: **`0.0.0.0`**, không phải `127.0.0.1`. Vế auth token giữ nguyên và nay **chịu lực hoàn toàn** (xem hàng 17). |
| 16 | fgOS hôm nay có tầng phân quyền nào không? | Rõ — **KHÔNG, có chủ ý** | `docs/io-contract.md` D1/D9: *"CLI local không xác thực được ai đang gọi nó — ai chạy được `fgos` thì đã ghi thẳng vào `.fgos/` được. Cổng này mua về dấu vết audit + chống nhầm giữa các phiên, **không mua về an ninh**"*; và *"caller chưa xác danh KHÔNG bị chặn"* gọi verb ghi. §"Ranh giới" của cùng file: tầng phân quyền thuộc **STR38**, cửa mạng của daemon thuộc **STR48** — cả hai **NGOÀI hợp đồng, chưa xây**. Nên mô hình tin cậy của fgOS hôm nay = ranh giới user của OS, không hơn. |
| 17 | Hệ quả cụ thể của bind `0.0.0.0` lên bề mặt ghi | Rõ | Cơ chế chính xác (không phải lo xa chung chung): `verify` của mỗi item chạy như **lệnh shell thật** (`dispatch.mjs`). Ai ghi được trường `verify` của một item thì lệnh đó sẽ được thực thi khi verify chạy. Nên một endpoint ghi TỔNG QUÁT (kiểu proxy mọi verb, hoặc `edit` tuỳ trường) mở ra mạng = bề mặt thực thi shell từ xa. Đây là lý do §6 chốt bề mặt ghi phải là **allowlist hẹp** (`answer`/`approve`/`reject`), không phải cửa verb tổng quát. Prior art xác nhận idiom: herdr-gateway cũng allowlist hẹp, mọi handler nhận `AuthSession` làm extractor đầu tiên (`src/web/api.rs:72,161`). |
| 18 | Có prior art thật cho cặp token + cf-access không? | Rõ — CÓ, đọc trực tiếp | `/home/vantt/projects/herdr-gateway` (crate `herdr-go` v0.1.14, Rust/axum) đã hiện thực đúng cặp này. Chi tiết đã kiểm ở §5 vòng 5 và §6. Điểm quyết định: nó **xác minh chữ ký JWT thật** (RS256 qua JWKS Cloudflare, bắt buộc `iss`/`aud`/`exp`/`nbf` — `src/web/cf_access.rs:195-217`), nên header `Cf-Access-Jwt-Assertion` **không giả mạo được**. |
| 19 | Hai chế độ bảo mật (LAN-token vs cf-access) có buộc phải loại trừ nhau không? | Rõ — **KHÔNG. Vòng 4 tôi phát biểu SAI** | Vòng 4 tôi kết luận "phải chọn một, không trộn", dựa trên giả định cf-access chỉ check header có mặt (nếu vậy thì kẻ trong LAN forge header là vòng qua được). Prior art bác bỏ giả định đó: chữ ký JWT được xác minh mật mã, nên kẻ đi thẳng vào cổng **không forge được** assertion — họ rơi xuống đường token, đúng như thiết kế. Hai lớp **cộng dồn an toàn**, bật đồng thời được. Caveat còn lại (chính herdr-gateway tự ghi ở `docs/backlog.md:68`): bật cf-access KHÔNG làm mất đường token — nó thêm một cửa cho người ở xa, không đóng cửa LAN. |
| 16 | Ranh giới tsk-ldb ↔ tsk-539 | Rõ | Người dùng chốt vòng 3: **tách rời** (phương án (a) — tsk-ldb không nuốt phạm vi, không chờ tsk-539), nhưng muốn "gom/kéo theo" tsk-539 để nó cũng được deliver — xem D5 ở §4 cho cách cụ thể (không phải `deps` chặn). |

## 4. Quyết định đã chốt

| D-ID | Quyết định | Vòng chốt | `fgos decision` |
|---|---|---|---|
| **D1** | Web dashboard là một **subsystem mới trong binary herdr-plugin hiện có** (Rust), không phải tiến trình/binary riêng, không chờ "launcher tổng" (đang discovery, chưa hiện thực). Chấp nhận dependency thật (HTTP server crate + embed-asset crate), miễn kết quả build vẫn là MỘT binary kèm asset frontend nhúng sẵn. Tái dùng `ports.rs`'s `trait WorkItemSource`/`PaneRegistry` làm lớp đọc dữ liệu — không viết lại. | 2-3 | ✅ seq 14637 |
| **D2** | **Không đổi lược đồ event** để ghép nhiều câu hỏi↔câu trả lời. Ghép `gates[id].askHistory[i]` với bản ghi thứ i có `kind:'answer'` trong `settlements[id]`, theo đúng thứ tự `seq`, tại tầng đọc của web dashboard. Grounded từ `tsk-65i`/`tsk-539` Q8 (đóng HOÃN) + S4(b) (FSM đã chặn hỏi-đè, không có race). | 2 | ✅ seq 14638 |
| **D3** | Nguồn chính cho "lịch sử agent đã làm" là `CONTEXT.md`/`plan.md` của item (vùng-người, narrative, git-versioned) — theo D7 (`tsk-65i`/`tsk-539`, đã chốt nơi khác). `fgos show --json`'s `decisions/discovery/gates/outcome/friction/settlement/learning` chỉ hiện như chi tiết mở rộng (expandable), không phải nội dung mặc định — vì 35% `decisions` hiện là ghi-sổ máy móc, chưa qua "phép kiểm sạch" D7 yêu cầu trước khi làm nguồn chính cho một consumer mới. | 3 | ✅ seq 14639 |
| **D4** | Phạm vi "câu hỏi cần trả lời" trong task-detail bao gồm **cả hai kênh**: `ask` (gates, đã park ở `awaiting-human`) VÀ `work.gate-approve` (contextApprove/planApprove/validateApprove). Kênh `gate-approve` là kênh nặng nhất thực tế (8x khối lượng gần đây theo D4 của `tsk-539`) và đúng là nguồn "mental pressure ở khâu duyệt" người dùng nêu ở vòng 2 — chỉ làm `ask` sẽ bỏ sót phần lớn vấn đề thật. | 3 | ✅ seq 14640 |
| **D5** | **Ranh giới tsk-ldb ↔ tsk-539: tách rời, không phải `deps` chặn.** tsk-ldb render best-effort trên nội dung `ask`/`gate-approve` hiện có, kể cả khi còn brief/trích D-ID khó hiểu — khi `tsk-539` cải thiện chất lượng authoring sau này, dashboard tự động hưởng lợi mà không cần sửa lại (hai việc tách bạch theo thiết kế: authoring vs rendering). "Kéo theo deliver" thực hiện bằng cách: `tsk-539` được ghi nhận là companion item trong §7, và phiên này sẽ tiếp tục đẩy `tsk-539` (đang `todo/discovery`, không ai giữ) sang `exploring`/`planning` ngay sau khi tsk-ldb hội tụ — không phải một `deps` edge trong state. | 3 | ✅ seq 14641 |
| **D6** | ⚠️ **VẾ BIND ĐÃ BỊ SỬA Ở VÒNG 4 — xem ghi chú dưới bảng.** ~~Bind `127.0.0.1` mặc định~~ + một lớp auth tối thiểu (token) bắt buộc ngay từ v1 — không hoãn sang sau, theo cảnh báo *"không vá sau được"* (STR38). **Vế token vẫn nguyên hiệu lực và nay chịu lực hoàn toàn.** | 3 | ✅ seq 14642, sửa bởi seq 14644 |

| **D7** | Bind mặc định `0.0.0.0` (cấu hình được qua cờ), cảnh báo khi bind không phải loopback. Thay vế bind của D6. Đủ điều kiện mint: nêu vòng 4, giữ nguyên qua vòng 5 không bị sửa. | 4-5 | ✅ seq 14703 |
| **D8** | **Xác thực hai lớp cộng dồn, sao chép idiom đã kiểm chứng của `herdr-gateway`** (`/home/vantt/projects/herdr-gateway`, crate `herdr-go`): (1) **cookie-session kiểm trước** — token dài (24 byte ngẫu nhiên hex) chỉ POST một lần vào `/api/login`, đổi lấy cookie `HttpOnly; SameSite=Strict`; so sánh token bằng **constant-time compare**; mọi thất bại trả **404 câm**, không bao giờ 401. (2) **cf-access là credential thay thế** khi không có cookie hợp lệ VÀ đã cấu hình đủ `team_domain`+`aud` — **bắt buộc xác minh chữ ký JWT** (RS256 qua JWKS `{team_domain}/cdn-cgi/access/certs`, cache TTL, require `exp`/`iss`/`aud`, validate `nbf`). Hai lớp **không loại trừ nhau**. | 5 | ✅ seq 14704 |

**Đã bị sửa (bằng chứng luật D-ID hoạt động đúng — giữ lại làm hồ sơ):**

| Phát biểu | Vòng nêu | Vòng sửa | Sửa thành |
|---|---|---|---|
| D6 vế bind: `127.0.0.1` mặc định | 3 | **4** | **`0.0.0.0`** — người dùng chốt trực tiếp. Hệ quả: token không còn là lớp phòng thủ thứ hai mà là **hàng rào duy nhất**; và vì fgOS không có tầng phân quyền nào (§3 hàng 16), bề mặt ghi qua mạng phải là allowlist hẹp (§3 hàng 17). Ghi bản đính chính vào event log để một phiên lạnh đọc `decisions` không hiện thực nhầm `127.0.0.1`. Giữ nguyên qua vòng 5 → **đã mint D7**. |
| "Chế độ LAN-token và chế độ cf-access phải loại trừ nhau, không trộn" | **4 (tôi nêu)** | **5** | **SAI — tự bác bằng prior art.** Giả định ngầm của tôi: cf-access chỉ kiểm header có mặt, nên kẻ trong LAN forge header là vòng qua Access. `herdr-gateway` xác minh chữ ký JWT thật (RS256/JWKS, `src/web/cf_access.rs:195-217`) → không forge được → hai lớp cộng dồn an toàn, bật đồng thời được. Bài học lặp lại đúng mô-típ cụm `tsk-65i`/`tsk-539` đã ghi: **phát biểu trước, kiểm sau**. Sửa thành D8. |
| "cf-access thì bypass token" (cách người dùng mô tả) | 5 | **5** | **Thứ tự ngược, kết quả giống.** Code thật: cookie-session kiểm TRƯỚC; cf-access chỉ được thử khi KHÔNG có cookie hợp lệ, và chỉ khi đã cấu hình đủ team_domain+aud (`src/web/auth.rs:80-105`). Nên cf-access là **credential thay thế** cho bước login, không phải một nhánh bypass đặt trước token. |

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

### 2026-08-12 — Vòng 3

**Người dùng trả lời cả 2 câu hỏi:**
1. "tách rời. nhưng có thể gom task kia vào để lôi kéo nói deliver luôn?"
   → chọn phương án (a) (tách rời), cộng thêm một ý mới: muốn tận dụng đà
   của cụm này để đẩy `tsk-539` (đang không ai giữ) ra khỏi trạng thái
   đứng im. → D5: companion item, không phải `deps` chặn (xem lý do ở D5
   — một `deps` edge sẽ mâu thuẫn với chính "tách rời", vì D7/D2 đã chứng
   minh tsk-ldb không cần chờ kỹ thuật gì từ tsk-539).
2. "thêm lớp auth tối thiểu." → D6.

Cả hai đủ rõ ràng, không mơ hồ, không cần vòng thứ hai để xác nhận lại —
mint D-ID ngay (D1-D6 ở §4), khác với các điểm còn đang tranh luận/suy
diễn (không có điểm nào như vậy còn sót trong cụm này).

### 2026-08-12 — Vòng 4: sửa vế bind, và cf-access

**Người dùng sửa D6:** *"bind 0.0.0.0"* — lật vế bind của quyết định vừa
chốt vòng trước. Không tranh luận lại: đây là quyết định của người chủ sản
phẩm, và nhu cầu đằng sau nó rõ (muốn với tới dashboard từ máy/điện thoại
khác, đúng tinh thần "môi trường tương tác thoải mái hơn" của vòng 2).

**Scout trước khi ghi lại, vì đây là thay đổi threat model chứ không phải
đổi một chuỗi config.** Đọc `docs/io-contract.md`:

> *"Đây là quy thuộc, không phải xác thực (D1): CLI local không xác thực
> được ai đang gọi nó — ai chạy được `fgos` thì đã ghi thẳng vào `.fgos/`
> được. Cổng này mua về dấu vết audit + chống nhầm giữa các phiên, **không
> mua về an ninh**. Do đó caller chưa xác danh **KHÔNG bị chặn** gọi verb
> ghi… chặn thật thuộc tầng phân quyền (STR38) và cửa mạng của daemon
> tương lai (STR48), cả hai nằm NGOÀI hợp đồng này."*

Và §"Ranh giới" của cùng file xác nhận cả STR38 lẫn STR48 đều **chưa
xây**. Kết luận: mô hình tin cậy của fgOS hôm nay chính là ranh giới user
của OS — không có tầng phân quyền nào bên dưới để đỡ. Bind `0.0.0.0` dời
ranh giới đó ra mạng, nên token của D6 không còn là lớp thứ hai mà là
**hàng rào duy nhất**. Đó là lý do vòng này bổ sung một ràng buộc kỹ thuật
cụ thể chứ không phải một lời cảnh báo chung: bề mặt ghi qua mạng phải là
**allowlist hẹp**, vì trường `verify` của item chạy như lệnh shell thật
(`dispatch.mjs`) — một endpoint ghi tổng quát mở ra mạng là bề mặt thực
thi shell từ xa (§3 hàng 17).

**Người dùng bổ sung:** *"nếu cần thì hỗ trợ tích hợp cf-access"* —
Cloudflare Access. Đây là câu trả lời tốt cho đúng lỗ hổng vừa nêu: nó cấp
từ bên ngoài chính tầng identity/authz mà fgOS không có (STR38 chưa xây).
Ghi nhận là hướng đúng, đưa vào §7 như một task **tuỳ chọn** (đúng chữ
"nếu cần thì" — không phải yêu cầu bắt buộc của v1), kèm một ràng buộc
mạch lạc bắt buộc phải nói rõ: cf-access chỉ có tác dụng khi lưu lượng
**buộc** phải đi qua Cloudflare. Nếu cổng vẫn bind `0.0.0.0` trên LAN thì
bất kỳ ai trong LAN đi thẳng vào cổng là vòng qua Access hoàn toàn — cửa
trước có gác, cửa sau mở. Nên hai chế độ phải chọn một cách có ý thức, xem
§6.

**Chưa mint D-ID cho vế bind lẫn cf-access ở vòng này** — đúng luật §4:
vế bind vừa bị lật một lần, cf-access thì mới nêu và còn là "nếu cần".
Cả hai được ghi vào §3/§5 và một bản đính chính đã vào event log để một
phiên lạnh không hiện thực nhầm `127.0.0.1`; mint D-ID ở vòng sau nếu giữ
nguyên.

### 2026-08-12 — Vòng 5: prior art bác bỏ kết luận vòng 4 của chính tôi

**Người dùng chỉ đường:** *"chổ số 3) có thể học cách
~/project/herdr-gateway sử dụng cả token và cf-access. có cf-access thì
by-pass token. giờ có thể đi qua exploring"*.

**Scout `/home/vantt/projects/herdr-gateway`** (crate `herdr-go` v0.1.14,
Rust/axum — đúng stack tsk-ldb sẽ dùng). Kết quả đọc code:

| Câu hỏi | Kết quả |
|---|---|
| Chữ ký JWT có được xác minh không? | **CÓ, thật.** RS256 qua JWKS `{team_domain}/cdn-cgi/access/certs`, `set_issuer`+`set_audience`, `set_required_spec_claims(["exp","iss","aud"])`, `validate_nbf` — `src/web/cf_access.rs:195-217`. Cache TTL 3600s; `kid` lạ trả `UnknownKid` không refetch (chống DoS). |
| Thứ tự hai lớp | cookie `hg_session` **trước**; cf-access chỉ thử khi không có cookie hợp lệ VÀ đã cấu hình đủ — `src/web/auth.rs:80-105` |
| Token dùng thế nào | 24 byte hex, POST một lần `/api/login`, `constant_time_eq`, đổi lấy cookie `HttpOnly; SameSite=Strict; Max-Age=604800` |
| Thất bại xác thực | **404 câm**, không bao giờ 401 — `src/web/auth.rs:40-42` |
| Bind mặc định | `0.0.0.0:8787` (`config.example.json:2`), cảnh báo khi non-loopback (`src/main.rs:244-250`) — **trùng đúng quyết định vòng 4 của người dùng** |
| Bề mặt ghi | allowlist hẹp, mọi handler nhận `AuthSession` extractor đầu tiên |

**Hai điều tôi phải tự sửa** (ghi vào bảng "đã bị sửa" §4):

1. **Kết luận "hai chế độ phải loại trừ nhau" của vòng 4 là SAI.** Nó dựa
   trên giả định ngầm rằng tích hợp cf-access nghĩa là kiểm header có
   mặt — nếu vậy kẻ trong LAN forge header là vòng qua Access. Nhưng chữ
   ký được xác minh mật mã, nên không forge được; kẻ đi thẳng vào cổng
   rơi xuống đường token như thường. Hai lớp **cộng dồn an toàn**. Đây
   đúng mô-típ "phát biểu trước, kiểm sau" mà cụm `tsk-65i`/`tsk-539` đã
   ghi lại nhiều lần — lần này rơi vào chính tôi.
2. **"cf-access thì bypass token" mô tả đúng trải nghiệm, sai thứ tự.**
   Code kiểm cookie trước; cf-access là credential thay thế cho bước
   login, không phải nhánh đặt trước token.

**Còn lại đúng từ vòng 4:** bind `0.0.0.0` + không có tầng phân quyền
trong fgOS + allowlist ghi hẹp vì `verify` chạy như shell. Prior art củng
cố cả ba (nó cũng bind `0.0.0.0`, cũng allowlist hẹp).

**Mint D7 (bind, đã giữ qua 2 vòng) và D8 (kiến trúc hai lớp, có prior art
làm bằng chứng).** Người dùng chốt "giờ có thể đi qua exploring" → cụm này
hội tụ, chuyển sang `fgos-coding-exploring`.

## 6. Thiết kế đã chốt {#design}

herdr-plugin hôm nay có 2/3 core component: **herdr-orchestrator** (tự
launch pane theo settings discover/merge/retro/cleanup, `done`) và **TUI
dashboard** (cockpit trong herdr, `done`). Mảnh còn thiếu là **web
dashboard**: một subsystem mới, cùng sống trong binary herdr-plugin hiện
có (D1), tự host một webserver + frontend đã compile sẵn, chạy **song
song** với TUI chứ không thay thế nó. Lý do tồn tại không phải "cùng dữ
liệu, giao diện đẹp hơn" — mà là một môi trường tương tác thoải mái hơn
hẳn, nhắm thẳng vào chỗ TUI đang gây "mental pressure" nhất: khâu
duyệt/approve và trả lời câu hỏi treo.

Đây không phải đất trống. Cụm `docs/history/gate-question-quality-and-
routing/` (`tsk-65i`+`tsk-539`, 12+ vòng, cả hai vẫn `todo/discovery`,
chưa ai chạm code) đã đo được chính xác cái gì đang tạo ra "mental
pressure" đó, và đã tự đề xuất kiến trúc gần giống hệt item này ở vòng 4
của chính nó. Thiết kế dưới đây xây trên nền quyết định đã chốt ở đó
(D7, Q8, Q13, S4(b), D4 của `tsk-539`) thay vì phát minh lại.

### Vì sao web dashboard, và nhắm vào đâu

Số đo thật (từ `tsk-539` D4, đo trên toàn lịch sử `.fgos/events.jsonl`):
kênh yes/no nặng nhất **không phải** `ask` (Q&A treo, 6 lượt gần đây) mà
là `work.gate-approve` — ba cổng duyệt skill (`contextApprove`/
`planApprove`/`validateApprove`), **48 lượt gần đây, gấp 8 lần**. Đây
chính xác là "cơ chế duyệt và approve" người dùng chỉ tên là nguồn mental
pressure. Nên (D4) task-detail's "câu hỏi cần trả lời" phải hiển thị và
cho thao tác trên **cả hai kênh**, không chỉ Q&A hẹp — chỉ làm `ask` sẽ bỏ
sót 8/9 khối lượng thật.

### Nguồn dữ liệu — không phát minh, tái dùng seam có sẵn

```mermaid
flowchart LR
    subgraph HP["herdr-plugin (Rust binary)"]
      TUI["TUI dashboard<br/>(đã có)"]
      WEB["Web dashboard<br/>(item này)"]
      PORT["ports.rs<br/>trait WorkItemSource / PaneRegistry<br/>(đã có, tái dùng — D1)"]
      TUI --> PORT
      WEB --> PORT
    end
    PORT -->|"spawn, --json<br/>(D5 của tsk-65i/539:<br/>đọc/ghi qua verb)"| CLI["fgos CLI<br/>list / show / triage"]
    CLI --> LOG[(".fgos/events.jsonl"<br/>nguồn sự thật)]

    WEB -->|"đọc trực tiếp,<br/>nguồn CHÍNH — D3"| CTX["docs/history/&lt;feature&gt;/<br/>CONTEXT.md · plan.md<br/>(vùng-người, D7 tsk-65i/539)"]
    WEB -.->|"chi tiết mở rộng,<br/>KHÔNG mặc định — D3"| DEC["state.decisions<br/>(vùng-máy, 35% nhiễu,<br/>chưa qua kiểm sạch)"]
    WEB -->|"ghép seq — D2"| QA["askHistory[i] ⨝ settlements[i]<br/>(kind:'answer')<br/>không đổi lược đồ"]
    WEB -->|"D4"| GA["work.gate-approve<br/>contextApprove/planApprove/<br/>validateApprove"]

    style CTX fill:#e0ede2,stroke:#3B7A4B
    style DEC fill:#f5e2df,stroke:#9E3A30
    style QA fill:#ddeded,stroke:#186E71
    style GA fill:#f2e9d8,stroke:#8E6318
```

- **Taskboard** (danh sách task): đọc qua `WorkItemSource` y hệt TUI —
  không có nguồn dữ liệu mới, chỉ có renderer mới.
- **Task detail — "lịch sử agent đã làm"**: nguồn chính là `CONTEXT.md`/
  `plan.md` của item (đã narrative, đã git-versioned, D3) — không phải
  `decisions[]` thô, vì 35% hiện là ghi-sổ máy móc chưa qua kiểm sạch
  (D7 cấm nối consumer mới vào vùng-máy trước khi sạch). `decisions[]`
  vẫn hiện được, nhưng dưới dạng "xem thêm", không phải mặc định.
- **Task detail — "lịch sử câu hỏi"**: ghép `gates[id].askHistory[i]`
  với bản `answer` thứ i trong `settlements[id]` theo `seq` (D2) — an
  toàn vì FSM đã chặn hỏi-đè (S4(b), không có race). Không đổi lược đồ
  event, không cần `answerHistory`/liên kết mới — đúng quyết định Q8 đã
  đóng ở cụm kia.
- **Task detail — "câu hỏi cần trả lời"**: cả `ask` hiện tại VÀ mọi
  `gate-approve` đang chờ (D4). Render best-effort trên nội dung hiện có
  — không tự viết lại/tổng hợp nội dung `ask` cũ (đó là việc của
  `tsk-539`, D5) — nhưng layout phải tách rõ 3 phần luôn có sẵn trong dữ
  liệu: **câu hỏi** (`ask`)/**vì sao đang hỏi** (`askRationale`/
  `askAlternatives`/`askSource`)/**bối cảnh item** (`awaitingContext`),
  để ngay cả nội dung brief hôm nay cũng đọc thoải mái hơn TUI's một dòng
  văn xuôi hiện tại.

### Bảo mật — phần chịu lực nhất của thiết kế này

*(Viết lại toàn bộ ở vòng 4 sau khi vế bind bị lật và cf-access được nêu.
Phần "Vì sao web dashboard" và "Nguồn dữ liệu" ở trên không đổi — không có
quyết định nào vòng 4 chạm tới chúng.)*

**Điểm xuất phát phải nói thẳng: fgOS hôm nay không có tầng phân quyền
nào, và đó là chủ ý.** `docs/io-contract.md` khai rõ cửa CLI chỉ làm *quy
thuộc* (attribution) chứ không *xác thực* (authentication) — *"ai chạy
được `fgos` thì đã ghi thẳng vào `.fgos/` được"*, và caller chưa xác danh
**không bị chặn** gọi verb ghi. Tầng chặn thật (STR38) và cửa mạng của
daemon (STR48) đều được khai là ngoài hợp đồng và **đều chưa xây**. Nghĩa
là toàn bộ mô hình tin cậy hiện tại chính là ranh giới user của OS.

Bind `0.0.0.0` (quyết định của người chủ sản phẩm, vòng 4) dời ranh giới
đó ra mạng. Hệ quả không phải "kém an toàn hơn một chút" mà là một sự đổi
vai: **token của D6 từ lớp phòng thủ thứ hai trở thành hàng rào duy nhất**,
đứng trước một hệ vốn được thiết kế để không cần hàng rào nào.

**Cơ chế rủi ro cụ thể, không phải lo xa chung chung.** Trường `verify`
của mỗi item được thực thi như một lệnh shell thật (`dispatch.mjs`). Ai
ghi được trường đó thì lệnh đó sẽ chạy. Nên ràng buộc bắt buộc của thiết
kế này là **bề mặt ghi qua mạng phải là allowlist hẹp** — đúng ba việc
người cần làm ở dashboard: `answer` (trả lời câu hỏi treo), `approve`,
`reject`. Tuyệt đối không có endpoint proxy verb tổng quát, không có
`edit` tuỳ trường qua mạng. Ràng buộc này giữ nguyên trong mọi chế độ bên
dưới, vì nó chặn đúng cơ chế thực thi shell chứ không phụ thuộc việc ai
lọt qua được cửa.

**Hai lớp xác thực cộng dồn — sao chép idiom đã kiểm chứng, không tự thiết
kế (D8).**

Người chủ sản phẩm chỉ tới `/home/vantt/projects/herdr-gateway` (crate
`herdr-go`) làm mẫu. Đọc code xác nhận đây là mẫu tốt và **nó bác bỏ chính
khẳng định của vòng 4 rằng hai chế độ phải loại trừ nhau**.

```mermaid
flowchart TB
    R["Request tới"] --> C{"có cookie hg_session<br/>hợp lệ?"}
    C -->|"có"| OK["cho qua"]
    C -->|"không"| CF{"cf_access đã cấu hình<br/>team_domain + aud?"}
    CF -->|"chưa"| L["yêu cầu login<br/>POST /api/login {token}<br/>constant-time compare<br/>→ cookie HttpOnly SameSite=Strict"]
    CF -->|"rồi"| V{"xác minh chữ ký JWT<br/>Cf-Access-Jwt-Assertion<br/>RS256 · JWKS · iss/aud/exp/nbf"}
    V -->|"hợp lệ"| OK
    V -->|"không"| F["404 câm<br/>(không bao giờ 401)"]
    L --> OK
    OK --> AL["allowlist ghi hẹp<br/>answer · approve · reject<br/>mọi handler nhận AuthSession"]

    style V fill:#e0ede2,stroke:#3B7A4B
    style AL fill:#ddeded,stroke:#186E71
    style F fill:#f2e9d8,stroke:#8E6318
```

**Vì sao hai lớp cộng dồn an toàn** — điểm mấu chốt nằm ở chỗ đa số
implementation làm sai: `herdr-gateway` **xác minh chữ ký JWT thật**
(`src/web/cf_access.rs:195-217` — RS256 với key lấy từ JWKS
`{team_domain}/cdn-cgi/access/certs`, bắt buộc có `exp`/`iss`/`aud`, kiểm
`nbf`), chứ không chỉ kiểm header có mặt. Nên kẻ đi thẳng vào cổng trong
LAN **không giả mạo được** assertion — họ rơi xuống đường token như mọi
người khác. Vòng 4 tôi kết luận hai chế độ phải loại trừ nhau vì đã ngầm
giả định cf-access chỉ là check-header; giả định đó sai, và kết luận theo
nó cũng sai (§4, bảng "đã bị sửa").

**Thứ tự thật, khác cách phát biểu thông thường:** cookie kiểm **trước**;
cf-access chỉ được thử khi không có cookie hợp lệ và đã cấu hình đủ
(`src/web/auth.rs:80-105`). Nên cf-access là **credential thay thế cho
bước login**, không phải một nhánh bypass đặt trước token. Kết quả với
người dùng thì giống nhau (có cf-access thì không phải nhập token), nhưng
thứ tự triển khai thì ngược.

**Bốn chi tiết của mẫu này đáng sao chép nguyên, vì mỗi cái vá một lỗi
kinh điển:**

| Chi tiết | Vá lỗi gì |
|---|---|
| Token chỉ POST một lần vào `/api/login`, sau đó dùng cookie `HttpOnly; SameSite=Strict` | Token không lặp lại trên mọi request, không lọt vào URL/log/referrer |
| `constant_time_eq` khi so token (`src/web/auth.rs:138-149`) | Timing attack |
| Mọi thất bại xác thực trả **404 câm**, không bao giờ 401 | Không quảng cáo rằng endpoint tồn tại |
| Bắt buộc `exp`/`iss`/`aud` (`set_required_spec_claims`) | `jsonwebtoken` mặc định chỉ kiểm claim NẾU có mặt — thiếu claim sẽ lọt |

**Rủi ro còn lại, phải khai báo chứ không giấu.** (a) HTTP cleartext trên
LAN: cookie phiên đi qua mạng ở dạng đọc được; trên LAN nhà riêng là chấp
nhận được nhưng phải là chấp nhận có ý thức. (b) Bật cf-access **không**
đóng đường token — chính `herdr-gateway` ghi điều này ở
`docs/backlog.md:68`: origin vẫn phải chỉ nên với tới được qua Cloudflare
Tunnel nếu muốn Access là cửa duy nhất, và code không tự cưỡng chế điều
đó. Nên cf-access là **thêm một cửa cho người ở xa**, không phải một cái
khoá cho cửa LAN.

**Crate tái dùng được, đã kiểm trong mẫu:** `axum 0.7` (+ws),
`tower-http 0.5`, `jsonwebtoken 9` (JWT/JWKS), `rust-embed 8` +
`axum-embed 0.1` (nhúng asset — đúng yêu cầu "một binary kèm asset" của
D1), `reqwest 0.12` (rustls-tls).

### Ranh giới tsk-ldb ↔ tsk-539 (D5)

```mermaid
flowchart LR
    A["tsk-539 (STR71)<br/>AUTHORING<br/>sửa cách agent VIẾT ask<br/>(chưa ai làm, todo/discovery)"]
    B["tsk-ldb<br/>RENDERING<br/>hiển thị những gì ĐÃ CÓ"]
    A -.->|"khi tsk-539 xong,<br/>nội dung ask tốt hơn<br/>TỰ ĐỘNG hiện đẹp hơn<br/>— không cần sửa lại renderer"| B
    B -.->|"companion, không deps chặn —<br/>phiên này đẩy tsk-539 sang<br/>exploring/planning kế tiếp"| A
```

Hai việc tách bạch theo thiết kế — không phải vì ngại làm chung, mà vì
ghép chúng sẽ làm renderer phải đợi một item khác chưa ai giữ. Tách ra
cho phép tsk-ldb chạy ngay trên dữ liệu hiện có, và tsk-539 cải thiện độc
lập, có lợi ích cộng dồn tự nhiên.

## 7. Danh mục hạng mục / task

### {#task-webserver-core} Nền webserver trong herdr-plugin

**Mục tiêu:** embed một HTTP server (axum) + frontend asset đã build
(`rust-embed`/`axum-embed`) vào binary herdr-plugin hiện có. Bind cấu hình
được, mặc định `0.0.0.0`, cảnh báo khi không phải loopback (D7). Lớp
xác thực 1 theo D8: token 24-byte hex sinh lúc khởi động, POST một lần vào
`/api/login`, constant-time compare, đổi lấy cookie `HttpOnly;
SameSite=Strict`; mọi thất bại trả 404 câm. Bề mặt ghi là allowlist hẹp
`answer`/`approve`/`reject`, mọi handler nhận `AuthSession` làm extractor
đầu tiên — không proxy verb tổng quát, không `edit` tuỳ trường. Chưa có UI
thật — chỉ bộ khung phục vụ static asset + health-check.

**Trích §6 áp dụng:** "Nguồn dữ liệu — không phát minh, tái dùng seam có
sẵn" (sơ đồ HP), "Bảo mật" (lớp 1 + allowlist + bảng 4 chi tiết đáng sao
chép).

**D-ID áp dụng:** D1, D6 (vế token), D7, D8 (lớp 1).

**Quan hệ với sibling:** nền tảng cho `#task-taskboard-view` và
`#task-detail-history` — cả hai dựng trên webserver này.

**Draft verify:** `cargo test --manifest-path herdr-plugin/Cargo.toml
webserver_ && cargo build --release --manifest-path
herdr-plugin/Cargo.toml`

### {#task-taskboard-view} Taskboard chính trên web dashboard

**Mục tiêu:** view danh sách task (tương đương Work Items panel của TUI:
tabs TODO/DOING/REVIEW/DONE, sort theo priority) render qua HTML/JS,
đọc data qua `WorkItemSource` có sẵn — không có API/data mới.

**Trích §6 áp dụng:** "Taskboard".

**D-ID áp dụng:** D1.

**Quan hệ với sibling:** phụ thuộc `#task-webserver-core`; điểm vào tới
`#task-detail-history` (click task → detail view).

**Draft verify:** `cargo test --manifest-path herdr-plugin/Cargo.toml
web_taskboard_`

### {#task-detail-history} Task detail: lịch sử agent + lịch sử câu hỏi + câu hỏi cần trả lời

**Mục tiêu:** view chi tiết 1 task — phần trọng tâm của toàn bộ item
theo lời người dùng gốc. Ba khối: (1) lịch sử agent đã làm, đọc
`CONTEXT.md`/`plan.md` làm nguồn chính (D3); (2) lịch sử câu hỏi, ghép
`askHistory`↔`settlements` theo `seq` (D2); (3) câu hỏi cần trả lời, phủ
cả `ask` và `gate-approve` (D4), layout tách 3 phần
câu-hỏi/vì-sao/bối-cảnh.

**Trích §6 áp dụng:** toàn bộ phần "Nguồn dữ liệu" + sơ đồ HP.

**D-ID áp dụng:** D2, D3, D4.

**Quan hệ với sibling:** phụ thuộc `#task-webserver-core` và
`#task-taskboard-view` (điểm vào).

**Draft verify:** `cargo test --manifest-path herdr-plugin/Cargo.toml
web_task_detail_ web_qa_history_ web_gate_approve_`

### {#task-cf-access} (TUỲ CHỌN) Lớp xác thực thứ hai: cf-access

**Mục tiêu:** lớp 2 của D8 — credential thay thế khi không có cookie hợp
lệ và đã cấu hình đủ `team_domain`+`aud`. **Bắt buộc xác minh chữ ký JWT**
`Cf-Access-Jwt-Assertion`: RS256 với key lấy từ JWKS
`{team_domain}/cdn-cgi/access/certs` (có cache TTL + xử lý `kid` lạ không
refetch, chống DoS), `set_required_spec_claims(["exp","iss","aud"])`,
validate `nbf`. Port thẳng idiom từ
`/home/vantt/projects/herdr-gateway/src/web/cf_access.rs` — **không tự
thiết kế lại**. Chỉ kiểm header có mặt mà không verify chữ ký là lỗi
nghiêm trọng (ai với tới cổng đều forge được), phải có test chứng minh
assertion giả bị từ chối.

**Trích §6 áp dụng:** "Bảo mật" — sơ đồ hai lớp, đoạn "Vì sao hai lớp cộng
dồn an toàn", và mục rủi ro còn lại (b).

**D-ID áp dụng:** D8 (lớp 2).

**Quan hệ với sibling:** phụ thuộc `#task-webserver-core`; hoàn toàn tuỳ
chọn — ba task kia deliver được mà không cần task này (lớp 1 đã đủ cho
LAN). Đây là lý do nó đứng riêng.

**Draft verify:** `cargo test --manifest-path herdr-plugin/Cargo.toml
cf_access_` (phải gồm một test assertion-giả-bị-từ-chối)

---

**Companion item (không phải con của tsk-ldb — D5):** `tsk-539` (STR71,
"ask self-sufficiency") nên được đẩy sang `exploring`/`planning` ngay sau
khi cụm này hội tụ, tận dụng đà của phiên này thay vì để tiếp tục nằm
`todo/discovery` không ai giữ.
