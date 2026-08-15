# CONTEXT — nắn lại kế hoạch cụm herdr web dashboard (tsk-6d2)

Item: `tsk-6d2`, deps `tsk-ldb`. Thư mục riêng, KHÔNG dùng chung
`docs/history/herdr-web-dashboard/CONTEXT.md` — đó là decision doc của
`tsk-ldb` và đã dùng hết D1..D14; trộn vào sẽ đụng D-ID. Bằng chứng
research của vòng này nằm ở
`docs/history/herdr-web-dashboard/RESEARCH.md` (vòng 2026-08-15), đặt bên
cụm gốc vì nó nói về chính cụm đó.

`impact-analysis: full` — `fgos tool query --capability impact-analysis
--status present` trả về gitnexus `status: present` (2026-08-15). Ghi lại
để người đọc sau không phải suy ra; vòng exploring không sửa code nên
posture này không nắn gì ở đây.

## Ranh giới tính năng

Trong phạm vi: nắn `docs/history/herdr-web-dashboard/plan.md`, đóng/nắn
các item con của `tsk-ldb` (tsk-48w, tsk-k4v, tsk-5jr, tsk-4id, tsk-18to),
sinh các item mới mà việc nắn làm lộ ra, sửa `docs/ui-spec/` và
`docs/specs/herdr-web-dashboard.md` ở đúng những chỗ đã lệch thực tế.

Ngoài phạm vi: xây bất kỳ phần nào của web dashboard; đụng vào chính
gateway đã merge (tsk-7l9); mở lại quyết định đã khoá của `tsk-ldb` trừ
đúng những chỗ ghi rõ dưới đây.

## Locked decisions

| D-ID | Quyết định |
|---|---|
| **D1** | **Giữ Edit mode.** Thêm route edit vào gateway `/v1` và vào `docs/contracts/fgos-gateway-api-v1.yaml`; `docs/ui-spec/modals/M03-add-edit-item.md` giữ nguyên, không cắt khỏi v1. |
| **D2** | **Web client là static bundle độc lập, host trên chính gateway của MỘT máy được chọn** — không desktop app, không static host riêng, không hosting ngoài. Cơ chế: port nguyên phương án `plan.md:140-152` (RustEmbed nhúng bundle vào binary + đường override đọc từ đĩa lúc dev) sang gateway, thêm cờ config bật/tắt serve. Mọi máy dùng chung một binary nên đều mang bundle (76K, `.rodata` demand-paged); chỉ máy được chọn mới bật serve, các máy còn lại chạy gateway API thuần. |
| **D3** | **tsk-k4v (P2 webserver core + auth layer 1) đóng hoàn toàn.** `fgos edit tsk-k4v --superseded-by tsk-7l9` rồi `fgos move tsk-k4v wontfix`. Gateway đã thay thế cả webserver core lẫn auth. |
| **D4** | **tsk-48w (P1 config + doctor/setup registration) đóng**, nhưng `supersededBy` trỏ **tsk-4r1**, KHÔNG phải tsk-7l9 — `gateway.token`/`gateway.port` được đăng ký thật ở `src/setup/registrations.mjs` bởi tsk-4r1. `supersededBy` là singular nên phải trỏ đúng item đã thực sự làm mất việc. |
| **D5** | **Item mới trên gateway, gồm ba việc**, đều là thứ không ai đang sở hữu sau khi D3/D4 đóng P1+P2: (a) CORS layer (`rg CorsLayer` trên `gateway.rs` = 0 hit); (b) bind address cấu hình được — `gateway.rs:933` hardcode `([127,0,0,1], port)`, chỉ port cấu hình được, trong khi `herdr-web-dashboard/CONTEXT.md` D7 đã khoá "bind mặc định `0.0.0.0`, cấu hình được, cảnh báo khi không phải loopback"; (c) static-serving có cờ bật (D2). Không có việc auth nào ở đây — D13 giữ nguyên Bearer đã có. |
| **D6** | **Item mới dựng khung client**: vite + TypeScript + Tailwind dưới `herdr-plugin/web/`, kèm lớp API client đọc theo `docs/contracts/fgos-gateway-api-v1.yaml` với base URL cấu hình được. Việc này **supersede `plan.md:158-161` (D14 của cụm)**, vốn giao `package.json`/`vite.config.ts` cho P3; phải sửa `deps` của tsk-5jr và tsk-4id trỏ vào item khung mới. Lý do tách: khung giờ gồm cả API client + auth nên đủ nặng để đứng riêng, và tách ra thì P3/P4 chạy song song được. |
| **D7** | **Môi trường là LAN/Tailscale, HTTP thuần, không TLS trong v1.** Trang static và gateway cùng HTTP nên không dính mixed-content; không cần chứng chỉ, không cần reverse proxy. |
| **D8** | **tsk-18to (P5 cf-access) giữ lại và VẪN optional**, không đóng — nhưng nắn mô tả: cf-access vẫn đúng vai "lớp 2" của `herdr-web-dashboard/CONTEXT.md` D8, còn lớp 1 giờ là Bearer token đã có sẵn trong gateway (`gateway.rs:421-449`, xem D13), không phải cookie-session do P2 xây như D8 giả định. `deps` của tsk-18to đang trỏ tsk-k4v — item đó bị D3 đóng, nên phải gỡ hoặc trỏ lại. |
| **D9** | **`docs/ui-spec/15-system-events.md` sửa từ mô hình server-push sang poll thật.** Bảng 5 sự kiện (`work.changed`, `question.opened`, `question.answered`, `merge.settled`, `gateway.unreachable`) và contract block `system: gateway` hiện giả định gateway đẩy; gateway không có SSE/WebSocket, chỉ có `GET /state/digest` trả `data_hash`. Sửa contract block cho khớp cơ chế poll. |
| **D10** | **tsk-5jr (P3) và tsk-4id (P4) nắn mô tả**: từ "viết trong binary `herdr-fgos`" (D1 cũ của cụm, đã bị tsk-7l9 D8 đóng) sang "web client độc lập gọi API gateway `/v1` qua HTTP", và trích `docs/contracts/fgos-gateway-api-v1.yaml` làm nguồn hợp đồng thay vì tự mô tả endpoint. |
| **D11** | **v1 nói chuyện với đúng MỘT gateway.** Client vẫn được thiết kế để giữ nhiều địa chỉ (area spec entity 10, R1), nhưng phần "chọn giữa các gateway/project và hiển thị đang xem cái nào" giữ nguyên trạng thái deferred sang `tsk-3b0` (area spec dòng 283-286, D11 của spec). **Không** kéo tsk-3b0 vào làm dependency của cụm này. Quản nhiều máy là vision, không phải scope v1. |
| **D12** | **Sửa `docs/specs/herdr-web-dashboard.md` nằm trong scope tsk-6d2.** Dòng 277-282 còn ghi "The gateway's own API contract does not exist yet" trong khi `docs/contracts/fgos-gateway-api-v1.yaml` đã tồn tại; chính spec đó viết sẵn "once that contract lands, this spec should cite it instead of describing the boundary in prose". Để lại đúng là loại drift item này tồn tại để dọn. |
| **D14** | **tsk-48w KHÔNG đóng — nắn lại. Supersede D4** (D4 không sửa tại chỗ; nó bị thay bằng D-ID này). Lý do là bằng chứng D4 chưa có lúc được khoá: đọc `verify` + mô tả thật của tsk-48w cho thấy nó cài đặt HAI quyết định của cụm, và chỉ một nửa bị làm mất — cụm D9 (secret riêng `FGOS_HERDR_WEB_SECRET`) chết theo D13, nhưng cụm D10 (toggle bật/tắt + đăng ký `fgos setup`/`fgos doctor` của nó) vẫn sống, chỉ chuyển hoá thành cờ static-serving. tsk-4r1 chỉ phủ `gateway.token`/`gateway.port`, không phủ cờ này, nên `supersededBy: tsk-4r1` sẽ nói dối. Thay vào đó: giữ nguyên id/deps/lịch sử của tsk-48w, đổi scope thành "cờ static-serving + đăng ký nó vào config-merge của `fgos setup` và check registry của `fgos doctor`". Hệ quả: D5 mất mục (c) — item gateway mới chỉ còn CORS + bind cấu hình được; cụm giữ 4 item con chứ không phải 3; và không thao tác `wontfix` nào lên tsk-48w, thứ FSM không cho quay lại. tsk-k4v vẫn đóng nguyên như D3. |
| **D13** | **Web client dùng `Authorization: Bearer` trực tiếp; KHÔNG thêm cookie-session vào gateway.** Quyết định này **supersede lớp 1 của `herdr-web-dashboard/CONTEXT.md` D8** (cookie-session qua `/api/login`, cookie `HttpOnly; SameSite=Strict`, 404 câm) — D8 không sửa tại chỗ, nó bị thay bằng D-ID này. Đánh đổi phải ghi rõ, không giấu: Bearer buộc web client giữ token ở chỗ JavaScript đọc được (localStorage/memory), nên một lỗ XSS trên trang đọc được token — đúng thứ cookie `HttpOnly` phòng. Chấp nhận vì bối cảnh thật: **một người dùng duy nhất (solo developer)**, mạng riêng LAN/Tailscale (D7), không có người dùng khác để nhắm tới và không có bề mặt web công khai. Đổi lại gateway không phải đụng gì về auth, và cả client trình duyệt lẫn không-trình-duyệt (MCP, CLI) đi chung một cơ chế. Lớp 2 của D8 (cf-access) không bị đụng — vẫn optional theo D8 ở đây. Ngưỡng xem lại: khi có người dùng thứ hai, hoặc khi gateway được phơi ra ngoài mạng riêng. |
| **D15** | **UI component framework cho `herdr-plugin/web/` là React.** D14 (của cụm gốc) chỉ khoá vite+TypeScript; G3 (`herdr-web-dashboard/plan.md:847`) chỉ khoá Tailwind+stitch cho layout — không D-ID nào khoá framework component. Phát hiện khi lập `plan.md` của tsk-yo0 (2026-08-15): stitch tự nó chỉ export HTML/Tailwind thuần (`~/.claude/skills/stitch/SKILL.md`: "No React export -- HTML/Tailwind only; Claude converts to React/Vue components"), nên việc chọn framework để chuyển đổi là một quyết định riêng, chưa từng được chốt. Người dùng chốt React khi được hỏi trực tiếp (2026-08-15), theo đề xuất: (1) repo chưa có tiền lệ JS frontend nào trái ngược; (2) bộ skill sẵn có trong môi trường nghiêng hẳn về React (`react-best-practices`, `tanstack` đều React-only, không có skill Vue/Svelte); (3) `ck:frontend-design` (đường chuyển đổi stitch->code) liệt kê React trước tiên; (4) bối cảnh solo developer + ưu tiên #1 "Ship Faster" (AGENTS.md) hưởng lợi từ hệ sinh thái/tutorial dày đặc nhất. |

## Thuật ngữ đã ghim

- **"máy được chọn"** — đúng một máy trong mạng riêng bật cờ serve static của
  gateway; nó phục vụ trang web cho cả nhóm. Các máy khác vẫn chạy gateway
  nhưng chỉ trả API.
- **"lớp 1" / "lớp 2"** — khung hai lớp cộng dồn của
  `herdr-web-dashboard/CONTEXT.md` D8 giữ nguyên, nhưng nội dung lớp 1 bị
  D13 ở đây thay: lớp 1 là **Bearer token** đã có trong gateway (không còn
  là cookie-session), lớp 2 vẫn là cf-access. Không loại trừ nhau.
- **"khung client"** — project frontend + lớp gọi API, KHÔNG gồm màn hình
  nào. Màn hình là việc của P3/P4.

## Bằng chứng scout

Chi tiết đầy đủ ở `docs/history/herdr-web-dashboard/RESEARCH.md`. Các neo
chính được trích trong bảng trên:

- `herdr-plugin/src/gateway.rs:891-920` — 17 route `/v1` + `/contract`,
  khớp 1-1 với 18 path key của `docs/contracts/fgos-gateway-api-v1.yaml`.
  `/work/{id}` chỉ có `get` → không có route edit (D1).
- `herdr-plugin/src/gateway.rs:933` — bind hardcode `127.0.0.1` (D5b).
- `herdr-plugin/src/gateway.rs:421-449` — `Authorization: Bearer`,
  `constant_time_eq` (D13).
- `herdr-plugin/src/gateway.rs:888,908` — `/mcp` nested service, ngoài
  contract yaml; đây là client không-trình-duyệt mà D13 phải giữ Bearer cho.
- `rg 'sse|WebSocket|text/event-stream'` trên `gateway.rs` → 0 hit (D9).
- `rg 'Cors|CorsLayer|tls|rustls'` trên `gateway.rs` + `Cargo.toml` → 0 hit
  (D5a, D7).
- `rg 'ServeDir|RustEmbed|fallback'` trên `herdr-plugin/` → 0 hit (D2, D5c).
- `src/state/work.mjs:337-356,751-760` — `supersededBy` singular, directed,
  target phải là id đã biết (D3, D4).
- `src/state/status-fsm.mjs:156-169` — cửa `todo -> wontfix` có thật; cả 5
  item P1..P5 đang `todo` nên dùng được ngay (D3, D4).
- `docs/history/herdr-web-dashboard/plan.md:140-152` — phương án RustEmbed
  + đường override đọc từ đĩa, đã đo bundle 76K (D2).
- `docs/history/herdr-web-dashboard/plan.md:158-161` — D14 giao
  `package.json`/`vite.config.ts` cho P3 (D6).
- `docs/history/herdr-web-dashboard/CONTEXT.md` D7 (bind `0.0.0.0`) và D8
  (hai lớp, lớp 1 cookie-session) — cả hai đã khoá và cả hai đang lệch với
  gateway đã merge (D5b, D13).
- `docs/specs/herdr-web-dashboard.md:77,200-202` — client giữ nhiều gateway
  endpoint; `:283-286` — multi-endpoint UX deferred sang tsk-3b0 (D11);
  `:277-282` — spec còn nói contract chưa tồn tại (D12).
- `fgos list --all` 2026-08-15 — tsk-48w/tsk-k4v/tsk-5jr/tsk-4id/tsk-18to
  đều `todo` stage `planning`; tsk-3x6/tsk-54j `delivered`;
  tsk-7l9/tsk-4r1 `retrospective`; tsk-3b0 `todo` stage `discovery`, không
  có parent.

## Tham chiếu chuẩn

- `docs/history/herdr-web-dashboard/plan.md` — kế hoạch cụm đang được nắn.
- `docs/history/herdr-web-dashboard/CONTEXT.md` — decision doc của tsk-ldb;
  D7/D8 của nó được D5/D13 ở đây trích chứ không ghi đè.
- `docs/history/herdr-web-dashboard/RESEARCH.md` — bằng chứng vòng
  2026-08-15.
- `docs/contracts/fgos-gateway-api-v1.yaml` — hợp đồng gateway, nguồn duy
  nhất cho mô tả endpoint sau khi D10 áp dụng.
- `docs/specs/herdr-web-dashboard.md` — area spec, sửa theo D12.
- `docs/history/fgos-interface-daemon/CONTEXT.md` — quyết định đã khoá của
  gateway (D2 nhiều endpoint, D4 một token mỗi máy, D8 đóng D1 cũ của cụm).

## Outstanding questions

None
