# RESEARCH — herdr web dashboard

Tích luỹ theo vòng, không đè. Mỗi vòng một mục có ngày + item gọi.

## 2026-08-15 — vòng 1 (tsk-6d2, stage `discovery`)

**Được hỏi gì.** Sáu điểm mơ hồ rút ra từ mô tả tsk-6d2 ("nắn lại kế hoạch
cụm herdr web dashboard cho khớp thực tế sau khi tsk-7l9 merge"):

- A — trạng thái sống thật của cụm (plan.md + status/stage của tsk-ldb và
  5 item con P1..P5)
- B — gateway thật có đúng 17 route `/v1` không, có route edit không, có
  SSE/WebSocket không, auth ra sao
- C — `docs/ui-spec/` có màn M03 (Edit) và mô hình sự kiện push không
- D — fgOS đóng một item "bị thay thế" bằng cơ chế nào
- E — đã có project frontend nào chưa, và gate tsk-3x6 khoá stack gì
- F — thêm route edit vào gateway hay bỏ Edit khỏi v1 (quyết định sản phẩm,
  không research được)

**Đã kiểm gì, thấy gì.**

### A — trạng thái cụm (nguồn: `fgos list --all --json`, đọc 2026-08-15)

| id | status | stage | parent | deps |
|---|---|---|---|---|
| tsk-ldb | todo | executing | — | — |
| tsk-48w (P1 config+doctor) | todo | planning | tsk-ldb | — |
| tsk-k4v (P2 webserver core + auth L1) | todo | planning | tsk-ldb | tsk-48w |
| tsk-5jr (P3 taskboard) | todo | planning | tsk-ldb | tsk-k4v, tsk-3x6 |
| tsk-4id (P4 task detail) | todo | planning | tsk-ldb | tsk-5jr, tsk-3x6 |
| tsk-18to (P5 cf-access) | todo | planning | tsk-ldb | tsk-k4v |
| tsk-3x6 (P0b UI spec) | delivered | executing | tsk-ldb | tsk-54j |
| tsk-54j (P0a area spec) | delivered | executing | tsk-ldb | tsk-7l9 |
| tsk-7l9 (interface daemon) | retrospective | executing | — | — |
| tsk-4r1 (gateway config reg) | retrospective | executing | tsk-1zg | — |

Cả 5 item P1..P5 còn `todo` — chưa ai pick, nên việc đóng/nắn còn kịp.
`docs/history/herdr-web-dashboard/` đã có `CONTEXT.md` (10K),
`DISCUSSION.md` (51K), `plan.md` (56K); chưa có `RESEARCH.md` trước vòng này.

### B — gateway thật (nguồn: `herdr-plugin/src/gateway.rs`, `docs/contracts/fgos-gateway-api-v1.yaml`)

17 route đăng ký dưới `/v1`, `gateway.rs:891-920` — khớp 1-1 với 18 path
key trong contract yaml (17 + `/contract`):

`/work` (get, post) · `/work/{id}` (get) · `/work/{id}/move` ·
`/work/{id}/ask` · `/work/{id}/answer` · `/work/{id}/take` ·
`/work/{id}/return` · `/work/{id}/approve` · `/work/{id}/reject` ·
`/ready` · `/rollup/{id}` · `/graph` · `/state/digest` · `/sessions` ·
`/sessions/{sessionId}` · `/sessions/{sessionId}/slots` · `/runner/tick` ·
`/contract`.

- **Không có route edit.** `/work/{id}` chỉ có `get`
  (`gateway.rs:892`, yaml `183:  /work/{id}:` → `186: get:` và không có
  `put`/`patch`). `POST /work` là add, không phải edit.
- **Không có SSE/WebSocket.** `rg 'sse|WebSocket|text/event-stream'` trên
  `gateway.rs` → 0 hit. Cheap-poll duy nhất là
  `GET /state/digest` (`gateway.rs:903`, yaml `403`).
- **Có thêm một surface ngoài REST:** `.nest_service("/mcp", mcp_service)`
  (`gateway.rs:888,908`) — MCP service, không nằm trong contract yaml.
- **Auth:** `Authorization: Bearer <token>`, so sánh constant-time
  (`gateway.rs:421-449`), token một-máy-một đọc từ `~/.fgos/config.json`
  field `gateway.token` (`gateway.rs:12-16,95-124`); thiếu file hoặc thiếu
  token là **từ chối khởi động**, không phải auto-generate.
  `/contract` cố ý nằm NGOÀI lớp `require_token`
  (`gateway.rs:849,909,917`) để client đọc được hợp đồng trước khi biết
  mình cần token.
- **Không phục vụ file tĩnh ở đâu cả.** `rg 'fallback|ServeDir|RustEmbed'`
  trên `gateway.rs` → 0 hit; quét cả `herdr-plugin/src/` + `Cargo.toml` →
  0 hit. Gateway chỉ trả JSON + `/mcp`.

### C — UI spec (nguồn: `docs/ui-spec/`)

Có thật: `screens/S01..S04`, `modals/M01..M03`, `flows/F01..F02`,
`00-overview.md`, `15-system-events.md`, `20-domain-rules.md`,
`30-states-and-errors.md`, `spec.config.yaml`.

- `modals/M03-add-edit-item.md:13-52` — "Add or edit a work item", chế độ
  edit hiện "title, kind, risk, verify, deps, priority — the fields
  `fgos edit` accepts", effect `run_fgos_add_or_edit_verb` (dòng 79).
  **Không có route gateway nào phục vụ nhánh edit này** (xem B).
- `15-system-events.md:19-25` — bảng 5 sự kiện `work.changed`,
  `question.opened`, `question.answered`, `merge.settled`,
  `gateway.unreachable`, mô tả là "Backend signals surfaces listen to…
  arrives from the gateway this client is connected to" với contract block
  `system: gateway`. **Cơ chế đẩy này không tồn tại** — gateway chỉ có
  `/state/digest` poll. Dòng 14-17 đã tự giới hạn "None of them is a push
  *notification*… only keep an already-open screen current", nhưng vẫn giả
  định kênh sự kiện từ server, chứ không phải client tự poll digest.

### D — cơ chế đóng item bị thay thế (nguồn: `src/state/work.mjs`, `src/state/status-fsm.mjs`, `bin/fgos.mjs`)

Có sẵn, không cần chế:

- `supersededBy` là field thật, validate được: singular + directed, không
  tự trỏ chính mình, target phải là id đã biết (`work.mjs:337-356,751-760,
  790-803`). Set qua `fgos edit <id> --superseded-by <id>`
  (`bin/fgos.mjs:1786-1798,1939`), clear bằng `--superseded-by ""`.
  Không tham gia unified dependency-wait — knowledge-only.
- `wontfix` là terminal status thứ hai, có ba cửa vào `blocked→wontfix`,
  `todo→wontfix`, `doing→wontfix`, cộng `awaiting-human→wontfix`
  (`status-fsm.mjs:21-30,156-169`). Cả 5 item P1..P5 đang `todo` nên cửa
  `todo→wontfix` dùng được ngay.
- `mergeReadiness` cố ý loại item superseded
  (`docs/explanation/why-mergereadiness-excludes-superseded-items.md`).

### E — khung frontend (nguồn: filesystem + `plan.md`)

- **Chưa tồn tại gì.** Không có `vite.config*`, `tailwind.config*`,
  `index.html` ở độ sâu ≤3; `herdr-plugin/` chỉ có
  `Cargo.lock/Cargo.toml/herdr-plugin.toml/src/tests` — không có `web/`.
- Stack đã khoá sẵn trong `plan.md`, không phải chưa quyết:
  - `plan.md:158-161` (D14) — "Frontend dựng bằng vite + TypeScript dưới
    `herdr-plugin/web/` — `package.json`/`vite.config.ts` **dựng ở mảnh
    này** (P3) vì đây là màn web đầu tiên; P4 dùng lại, không dựng lại."
  - `plan.md:776` (G3) — "Tailwind, và dùng stitch để sinh layout… Tailwind
    là lớp style thật của client."
- `plan.md:140-152` — kế hoạch cũ nhúng bundle vào chính Rust binary:
  `#[derive(RustEmbed)] #[folder = "static/"]` + feature `debug-embed`,
  `.gitignore` thêm `herdr-plugin/static/`, port từ
  `herdr-gateway/src/web/mod.rs:25-29,95-98`; đo thật 76K bundle.

**Còn mở gì.**

1. **(F, chính item đã nêu)** Thêm route edit vào gateway `/v1`, hay bỏ
   M03 edit-mode khỏi v1? Bằng chứng đã đủ để hỏi: M03 tồn tại và gọi
   `fgos edit`; `/work/{id}` chỉ có `get`. Đây là quyết định sản phẩm,
   research không chốt được.
2. **(mới, research phát hiện)** Đóng P1+P2 vì "gateway đã có" để lại một
   khoảng trống chưa ai sở hữu: **không thành phần nào phục vụ file tĩnh**
   của web client. Kế hoạch cũ giao việc đó cho P2 (nhúng RustEmbed vào
   binary, `plan.md:140-152`); gateway không có `ServeDir`/`fallback`/
   `RustEmbed` (mục B). Nếu client là app độc lập gọi `/v1` qua HTTP thì
   phải chốt ai host nó (thêm static route vào gateway / một dev server
   riêng / deploy tách hẳn) — chưa có bằng chứng nào trong repo trả lời.
3. **(mới, research phát hiện)** Điểm (4) của tsk-6d2 nói "cần một item mới
   dựng bộ khung client", nhưng `plan.md:158-161` (D14) đã giao
   `package.json`/`vite.config.ts` cho **P3 (tsk-5jr)**. Hai cách đọc mâu
   thuẫn — tách item mới thì phải ne D14 và sửa deps của P3/P4; giữ D14 thì
   không cần item mới. Chưa có bằng chứng nào chọn hộ.
4. **(mới, research phát hiện)** Cửa đóng P1/P2 có nhánh: `supersededBy`
   trỏ về **item nào**? tsk-7l9 (interface daemon, đã làm gateway) là ứng
   viên rõ cho P2; P1 (config+doctor registration) thực tế bị tsk-4r1 làm
   mất (`gateway.token`/`gateway.port` đã đăng ký ở
   `src/setup/registrations.mjs`). Hai item khác nhau — cần xác nhận trước
   khi ghi, vì `supersededBy` là singular.
5. **(3 trong mô tả item)** tsk-18to (cf-access "auth layer 2") dựa trên D8
   hai-lớp mà lớp 1 lẽ ra do P2 xây. Lớp 1 giờ đã tồn tại thật (Bearer
   token, mục B) nhưng do gateway sở hữu, không do herdr-plugin web server.
   Còn đúng scope hay không phụ thuộc câu 2 ở trên (ai host client) — chưa
   độc lập trả lời được.
