# CONTEXT — herdr-web-dashboard (tsk-ldb)

Quyết định đã khoá cho web dashboard của herdr-plugin. Nguồn thảo luận đầy
đủ (5 vòng, kèm mọi bằng chứng đã trích): `DISCUSSION.md` cùng thư mục.
File này là bản hợp đồng ngắn để `fgos-coding-planning` làm việc — đọc
`DISCUSSION.md` khi cần lý do sâu hơn đằng sau một D-ID.

## Ranh giới tính năng

**Trong phạm vi:** một subsystem web dashboard mới nằm trong binary
herdr-plugin (`herdr-fgos`) đang có — tự chạy HTTP server, tự host frontend
đã nhúng sẵn. Ba màn: taskboard danh sách task; task-detail gồm lịch sử
agent đã làm + lịch sử câu hỏi; và "câu hỏi cần trả lời" phủ cả kênh `ask`
lẫn `gate-approve`. Chạy **song song** TUI, không thay thế.

**Ngoài phạm vi:** cải thiện chất lượng câu hỏi tại nguồn (authoring) —
thuộc `tsk-539`, tách rời có chủ ý (D5). Cơ chế đa-project/định danh
cockpit — thuộc `tsk-3b0` (D11). Không đổi lược đồ event (D2). Không
"launcher tổng" (D1).

## Locked decisions

| D-ID | Quyết định | seq |
|---|---|---|
| **D1** | Web dashboard là subsystem mới **trong binary `herdr-fgos` hiện có**, không phải tiến trình/binary riêng, không chờ launcher tổng. Chấp nhận dependency thật miễn build ra một binary kèm asset nhúng. Tái dùng `ports.rs`'s `WorkItemSource`/`PaneRegistry`. | 14637 |
| ↳ | **Đã bị tsk-7l9 D8 đóng**, và `docs/history/herdr-web-dashboard-plan-realignment/CONTEXT.md` **D2/D10** ghi hình dạng thay thế: web client là **static bundle độc lập** gọi API gateway `/v1` qua HTTP, host trên chính gateway của một máy được chọn — không phải subsystem trong binary. | — |
| **D2** | **Không đổi lược đồ event.** Ghép `gates[id].askHistory[i]` với bản ghi thứ i có `kind:'answer'` trong `settlements[id]`, theo thứ tự `seq`, tại tầng đọc. | 14638 |
| **D3** | Nguồn chính của "lịch sử agent đã làm" là `CONTEXT.md`/`plan.md` (vùng-người); `state.decisions` chỉ hiện dạng chi tiết mở rộng, không mặc định. | 14639 |
| **D4** | "Câu hỏi cần trả lời" phủ **cả hai kênh**: `ask` (gates) và `work.gate-approve` (contextApprove/planApprove/validateApprove). | 14640 |
| **D5** | tsk-ldb (rendering) ↔ `tsk-539` (authoring) **tách rời, không `deps` chặn**; `tsk-539` là companion item được đẩy tiếp sau. | 14641 |
| **D6** | Auth token bắt buộc ngay từ v1 (vế bind của nó bị D7 thay). | 14642 |
| **D7** | Bind mặc định `0.0.0.0`, cấu hình được, cảnh báo khi không phải loopback. | 14703 |
| ↳ | **Chưa được cài đặt, và gateway đã merge đi ngược nó**: `herdr-plugin/src/gateway.rs:933` hardcode `([127,0,0,1], config.port)` — chỉ port cấu hình được. D7 vẫn đúng và chưa bị thay; việc kéo thực tế về khớp nó nay thuộc **tsk-54y** (`docs/history/herdr-web-dashboard-plan-realignment/CONTEXT.md` D5). | — |
| **D8** | **Xác thực hai lớp cộng dồn**, port idiom đã kiểm chứng từ `herdr-gateway`: (1) cookie-session trước — token hex 24-byte POST một lần `/api/login`, `constant_time_eq`, đổi lấy cookie `HttpOnly; SameSite=Strict`, mọi thất bại trả **404 câm**; (2) cf-access là credential thay thế, **bắt buộc xác minh chữ ký JWT** (RS256 qua JWKS, require `exp`/`iss`/`aud`, validate `nbf`). Hai lớp không loại trừ nhau. | 14704 |
| ↳ | **Lớp 1 bị thay** bởi `docs/history/herdr-web-dashboard-plan-realignment/CONTEXT.md` **D13**: web client dùng `Authorization: Bearer` có sẵn của gateway (`gateway.rs:421-449`), KHÔNG thêm cookie-session/`/api/login`. Khung hai lớp cộng dồn giữ nguyên; lớp 2 (cf-access, tsk-18to) không bị đụng. Đánh đổi và ngưỡng xem lại ghi ở chính D13. | — |
| **D9** | Token: env `FGOS_HERDR_WEB_SECRET` ưu tiên, vắng thì **tự sinh file gitignored dưới `.fgos/`, chmod 0600**. **Không bao giờ nằm trong `.fgos/config.json`** — file đó đang được git track. | 14732 |
| ↳ | **D9 chết** theo `docs/history/herdr-web-dashboard-plan-realignment/CONTEXT.md` **D13**: không còn web server riêng thì không còn secret riêng — web client dùng token của chính gateway. Bỏ hẳn `FGOS_HERDR_WEB_SECRET` và file secret dưới `.fgos/`. | — |
| **D10** | Web dashboard có toggle riêng trong `.fgos/config.json`, **mặc định BẬT** — cố ý khác 4 toggle `herdrOrchestrator` hiện có (đều mặc định `false`). | 14741 |
| ↳ | **D10 không chết, chuyển hoá**: nhu cầu bật/tắt việc phục vụ web còn nguyên, nay là **cờ static-serving trên chính gateway** (realignment D2). Việc cài đặt nó cộng đăng ký `fgos setup`/`fgos doctor` vẫn thuộc **tsk-48w**, item được NẮN LẠI chứ không đóng (realignment D14, supersede realignment D4). | — |
| **D11** | Đa-project (port/định danh) **defer sang `tsk-3b0`**; v1 giả định một tiến trình cockpit. Hướng đã ghi cho `tsk-3b0`: nên chỉ **một** tiến trình dashboard, herdr/client gửi thông tin định danh project để TUI/web nhận ra đang xem project nào. | 14742 |
| **D12** | Webserver chạy như **tiến trình con sống lâu hơn cockpit pane**, không nằm trong tiến trình TUI. Cockpit chỉ bật/tắt; đóng cockpit **không** giết web dashboard. Vẫn một binary theo D1 — binary tự re-exec chính nó ở chế độ server, không sinh artifact thứ hai. | 14998 |
| **D13** | Section config mang thêm field `port`, mặc định **8788** (né 8787 của `herdr-gateway` để chạy được cả hai trên một máy). | 14999 |
| **D14** | Frontend có **toolchain thật**: vite + TypeScript + vitest dưới `herdr-plugin/web/`, bundle ra `static/` (gitignored), `rust-embed` nhúng vào binary. Thêm `herdr-plugin/build.rs` bảo đảm `static/` tồn tại để `cargo build/test/clippy` **không bao giờ phụ thuộc** việc frontend đã bundle hay chưa. Thứ tự release: `npm run bundle` → `cargo build --release`. | 15000 |
| ↳ | **Toolchain giữ nguyên** (vite + TypeScript dưới `herdr-plugin/web/`, bundle nhúng qua `rust-embed`) — nhưng **chỗ nhúng đổi**: nay là **gateway**, không phải web server riêng của P2 (realignment D2), và bật/tắt bằng cờ config (tsk-48w). **Ai dựng khung thì bị realignment D6 thay**: `plan.md:158-161` giao `package.json`/`vite.config.ts` cho P3 (tsk-5jr); việc đó nay là item riêng **tsk-yo0**, và `deps` của tsk-5jr/tsk-4id đã trỏ vào nó. Lý do tách: khung giờ gồm cả lớp API client đọc `fgos-gateway-api-v1.yaml` và xử lý auth Bearer. | — |
| **D15** | **Kênh gate-approve (D4) trên S03/S04 chỉ hiện LỊCH SỬ đã hoàn tất (`contextApprove`/`planApprove`/`validateApprove`, mỗi cái `{actor, at, verify}`), không hiện câu hỏi đang treo.** Xác nhận thật (tsk-4id, 2026-08-15): sống qua chính việc tự chạy cả cụm 7-item trong một phiên, mọi câu hỏi gate được hỏi/trả lời ĐỒNG BỘ ngay trong phiên đang sống (qua công cụ hỏi người trực tiếp), không bao giờ được ghi thành trạng thái bền vững nào — `fgos show`'s `gates` object chỉ có record ĐÃ hoàn tất, không field nào cho câu hỏi đang treo. Kênh `ask` (status `awaiting-human`) vẫn đầy đủ theo D4 gốc — có dữ liệu thật, bền vững, remote-quan-sát-được. Làm cho câu hỏi gate hiện được TỪ XA trong lúc còn treo là một quyết định kiến trúc rộng (cần ghi câu hỏi gate thành state bền vững), ngoài phạm vi một item màn hình web — ghi lại làm gap, không tự ý mở rộng phạm vi `tsk-4id` để lấp nó. | — |
| **D16** | **S02 Taskboard có HAI board view của cùng một dữ liệu nhóm-theo-status: group view (mặc định, nhóm xếp dọc, đã spec từ đầu) và kanban view (cột song song, một cột/nhóm).** Toggle nằm trong CONTROLS cạnh Group-by, trạng thái được nhớ; desktop-only, mobile luôn group view (cột song song không vừa màn hình). Lý do thêm: người dùng chốt trực tiếp (2026-08-15) — bản mockup `stitch` đầu tiên (trước khi bị generate lại) tự vẽ ra layout kanban cột song song, và khi bị thay bằng bản chỉ có group view, người dùng phát hiện ngay và yêu cầu giữ cả hai chứ không chọn một. `docs/ui-spec/screens/S02-taskboard.md` cập nhật cả hai ASCII layout + 2 interaction mới (`A-S02-012` toggle view, `A-S02-013` kéo-thả card đổi group trong kanban view, dùng chung `run_one_door_write_verb`). | — |
| **D17** | **S03 CONTEXT hiện đủ field thật của `WorkItem`** (`description`, `domain`, `tier`, `deps`, `parent` khi không null, `verify`, `footprint`, `docsRef`), không chỉ id/title/status pill như bản spec gốc. Lý do: người dùng phát hiện trực tiếp (2026-08-15), so với chính `WorkItem` schema đã có sẵn trong `docs/contracts/fgos-gateway-api-v1.yaml` — CONTEXT trước D17 bỏ sót gần hết field thật, mâu thuẫn với chính acceptance criterion của màn hình này ("người không có ngữ cảnh phải trả lời được nhanh") vì thiếu `description`/`verify` thì không đủ để tin câu trả lời. `kind` cố ý KHÔNG thêm (trùng lặp thông tin với `domain` với một người đọc). Field null/absent thì không render dòng, cùng convention `docsRef` đã dùng trước đó. | — |

### Vì sao D12 (bối cảnh không được để mất)

Nhu cầu gốc là xem/duyệt **từ điện thoại** — đúng lúc đó thường không có
cockpit nào mở. Nếu webserver sống trong tiến trình TUI thì tính năng vắng
mặt đúng lúc cần nhất. Đây là lý do D12 tách vòng đời, không phải sở thích
kiến trúc.

### Vì sao D14 (và vì sao khuyến nghị ban đầu của phiên này SAI)

Phiên này lúc đầu khuyến nghị "không toolchain, HTML/JS thuần" với lý do
`cargo build` sẽ phụ thuộc `npm run build` nên dễ vỡ. Người dùng phản biện,
và đọc prior art thì **lý do đó bị bác bằng code đang chạy**:
`herdr-gateway/build.rs` mở đầu bằng `create_dir_all("static")` kèm comment
nguyên văn — *"Guarantees `static/` exists before `RustEmbed`'s derive macro
scans it, so `cargo build`/`test`/`clippy` never fail on a fresh checkout
where `npm run bundle` hasn't produced the web UI yet"*. Hai pipeline tách
rời hẳn; `cargo` chạy được kể cả khi chưa từng bundle frontend. Ràng buộc
một-binary của D1 cũng không bị đụng vì bundle được nhúng lúc biên dịch.
Đổi lại còn được `vite dev` + HMR trỏ vào API Rust, `vitest`, và type
safety — thứ mà HTML nhúng viết tay không có.

### Hệ quả của D10 phải ghi rõ, không giấu

Mặc định BẬT + bind `0.0.0.0` (D7) nghĩa là **lần chạy cockpit đầu tiên đã
mở một cổng với tới được từ LAN**, không ai chủ động chọn. Người chủ sản
phẩm quyết định như vậy sau khi đã được trình bày đúng hệ quả này. Nên
token bắt buộc + tự sinh (D6/D8/D9) là **thứ chịu lực giữ an toàn**, không
phải lớp gia cố tuỳ chọn — bỏ nó đi là mở toang, không phải giảm bớt một
tầng phòng thủ.

## Thuật ngữ đã ghim

- **"orchestrator"** — dùng theo nghĩa `docs/decisions/0029` D17 đã gán:
  tầng hợp thành T0, điều phối N đơn vị chạy đồng thời và ở lại. Không
  phải nghĩa cũ đã bị `0028` đổi tên thành `launcher`.
- **"vùng-người" / "vùng-máy"** — theo D7 của cụm `tsk-65i`/`tsk-539`:
  `CONTEXT.md`/`plan.md` là vùng-người (narrative, git-versioned);
  `state.decisions` là vùng-máy (ngắn, cho agent).
- **"câu hỏi cần trả lời"** — sau D4, gồm cả `ask` lẫn `gate-approve`,
  không chỉ kênh `ask`.

## Bằng chứng scout

| Đường dẫn | Xác nhận điều gì |
|---|---|
| `herdr-plugin/src/ports.rs:11-20` | `trait WorkItemSource` có thật, 5 method `fetch_*` — tiền đề của D1 đứng vững |
| `herdr-plugin/Cargo.toml` | Crate tên `herdr-fgos`; deps hiện **thuần đồng bộ** (ratatui/crossterm/serde/serde_json) — chưa có async runtime nào |
| `herdr-plugin/src/settings.rs:1-53` | Precedent config: section `herdrOrchestrator` trong `.fgos/config.json`, đọc fail-closed từ Rust, 4 toggle **đều mặc định `false`** |
| `src/setup/registrations.mjs:1064-1112` | Precedent đăng ký `doctor`/`setup`: check id `herdr-launcher-configured` — đúng cổng AGENTS.md bắt buộc cho config default mới |
| `git ls-files .fgos/config.json` → trả về file; `.gitignore` không có mục nào cho nó | **`.fgos/config.json` ĐANG ĐƯỢC GIT TRACK** — gốc của D9 |
| `.gitignore` (5 mục `.fgos/*`, mỗi mục kèm lý do) | Có sẵn nếp gitignore cho file "local, không bao giờ commit" — nhà hợp lệ cho file secret của D9 |
| Không có `.env` nào trong repo; không có `dotenv`; `.gitignore` **không** có mục `.env` | Token web sẽ là **secret đầu tiên** fgOS phải lưu — không có cơ chế sẵn để tái dùng |
| `grep FGOS_*` trong `src`/`bin` và `env::var` trong `herdr-plugin/src` | Nếp env var sẵn có: `FGOS_CLAUDE_COMMAND`, `FGOS_GH_COMMAND`, `FGOS_HERDR_MODEL`, `FGOS_HERDR_SKIP_PERMISSIONS`, `HERDR_BIN_PATH`… — D9 đặt tên theo nếp `FGOS_HERDR_*` |
| `/home/vantt/projects/herdr-gateway` (crate `herdr-go` v0.1.14) | Prior art của D8: `src/web/cf_access.rs:195-217` xác minh chữ ký RS256 qua JWKS thật; `src/web/auth.rs:40-42,80-105,138-149` cookie-first + constant-time + 404 câm; `config.example.json:2` bind `0.0.0.0:8787`; crates `axum 0.7`, `jsonwebtoken 9`, `rust-embed 8` + `axum-embed 0.1` |
| `docs/io-contract.md` (mục quy-thuộc-không-phải-xác-thực + §Ranh giới) | fgOS **không có tầng phân quyền nào**, có chủ ý; STR38/STR48 đều ngoài hợp đồng và chưa xây — nền của toàn bộ lập luận bảo mật |

**`impact-analysis: degraded`** — `fgos tool query` báo gitnexus `present`,
nhưng index đang cũ (last indexed `79fead3`, HEAD `13eef94d`) và thư mục
`.gitnexus/` không có trong worktree này. Ghi lại để người đọc sau không
phải tự dò; stage này không sửa code nên posture không chặn gì.

## Tham chiếu chuẩn

- `docs/history/herdr-web-dashboard/DISCUSSION.md` — 5 vòng thảo luận gốc,
  §6 thiết kế + §7 tách task (4 anchor mà `refs` của item đang trỏ tới).
- `docs/history/gate-question-quality-and-routing/DISCUSSION.md` — cụm
  `tsk-65i`/`tsk-539`; nguồn của D7 (hai vùng lưu trữ), Q8/S4(b) (không
  đổi lược đồ), D4 (`gate-approve` gấp 8 lần `ask`).
- `/home/vantt/projects/herdr-gateway` — prior art cho D8/D9.
- `AGENTS.md` §"Install/setup/doctor gate" — bắt buộc với D9/D10.

## Outstanding questions

None
