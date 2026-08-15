# plan.md — herdr-web-dashboard (tsk-ldb)

Quyết định nguồn: `CONTEXT.md` (D1-D11) cùng thư mục. Thảo luận đầy đủ:
`DISCUSSION.md`. Kế hoạch này **không mở lại** bất kỳ D-ID nào — chỉ trích.

> ## ⚠ Kế hoạch này đã được NẮN LẠI (tsk-6d2, 2026-08-15) — đọc mục này trước
>
> Nhánh `fgw/tsk-ldb` fork từ điểm cách `main` hơn 550 commit. Trong lúc đó
> **tsk-7l9 đã merge một API gateway REST thật** (`herdr-plugin/src/gateway.rs`:
> 17 route dưới `/v1` + `/contract`, hợp đồng thật tại
> `docs/contracts/fgos-gateway-api-v1.yaml`, auth `Authorization: Bearer`
> một-token-mỗi-máy). Phần server của kế hoạch dưới đây vì thế **đã lệch thực
> tế**. Quyết định nắn lại nằm ở
> `docs/history/herdr-web-dashboard-plan-realignment/CONTEXT.md` (D1-D14);
> bằng chứng ở `RESEARCH.md` cùng thư mục này.
>
> Trạng thái từng mảnh sau khi nắn:
>
> | Mảnh | Trạng thái |
> |---|---|
> | **P1** `tsk-48w` | **NẮN LẠI, không đóng** (realignment D14, supersede D4). Scope mới: cờ static-serving của gateway + đăng ký `fgos setup`/`doctor`. Phần secret riêng (cụm D9) bỏ hẳn. |
> | **P2** `tsk-k4v` | **ĐÓNG** — `wontfix`, `supersededBy: tsk-7l9`. Gateway đã thay cả webserver core lẫn auth lớp 1. |
> | **P3** `tsk-5jr` | Nắn: web client độc lập gọi `/v1` qua HTTP, trích contract yaml. Không còn dựng khung frontend. |
> | **P4** `tsk-4id` | Nắn: như P3. Cảnh báo: **gateway chưa có route edit**, M03 edit-mode phụ thuộc route phải thêm trước. |
> | **P5** `tsk-18to` | Giữ, vẫn optional. Lớp 1 nay là Bearer của gateway, không phải cookie-session do P2 xây. `deps` trỏ tsk-k4v đã gỡ. |
> | *(mới)* `tsk-yo0` | Khung web client: vite + TypeScript + Tailwind dưới `herdr-plugin/web/` + lớp API client. Supersede D14 vốn giao việc này cho P3. |
> | *(mới)* `tsk-54y` | Gateway: CORS layer + bind address cấu hình được (`gateway.rs:933` đang hardcode `127.0.0.1`, đi ngược chính D7 của cụm). |
>
> Hai điều toàn cục phải nhớ khi đọc phần dưới:
>
> - **Không có SSE/WebSocket.** Gateway chỉ có `GET /v1/state/digest` cheap-poll.
>   Mọi chỗ trong kế hoạch này giả định server đẩy đều sai
>   (realignment D9; `docs/ui-spec/15-system-events.md` đã sửa).
> - **v1 nói chuyện với đúng MỘT gateway** (realignment D11). Việc chọn giữa
>   nhiều gateway/project giữ nguyên trạng thái deferred sang `tsk-3b0`.
>   Riêng phía server, việc một gateway quản mọi project là `tsk-2ok`.

## Mode: high-risk

**8/10 flag áp dụng, trong đó 3 là hard-gate** (auth, audit/security,
external provider):

| Flag | Bằng chứng |
|---|---|
| auth *(hard-gate)* | D6/D8/D9 — token, cookie session, xác minh JWT |
| audit/security *(hard-gate)* | D7 bind `0.0.0.0`; token web là **secret đầu tiên** fgOS phải lưu (`CONTEXT.md` §Bằng chứng scout) |
| external systems *(hard-gate)* | cf-access fetch JWKS qua mạng; loạt crate mới (axum/tokio/jsonwebtoken/rust-embed) |
| public contracts | bề mặt HTTP endpoint mới, chưa từng tồn tại trong repo |
| existing covered behavior | **128 `#[test]`** đang có trong `herdr-plugin/src/*.rs`; thêm async runtime vào một binary thuần đồng bộ |
| weak proof | `impact-analysis: degraded`; repo **chưa có hạ tầng test HTTP nào** |
| multi-domain | Rust (`herdr-plugin/`) + Node (`src/setup/registrations.mjs`) + frontend asset |
| cross-platform | `chmod 0600` của D9 là POSIX-only |

**Vì sao không phải lane nhỏ hơn:** `standard` chỉ dành cho 2-3 flag và
không có hard-gate nào. Riêng auth + secret-storage + bind-mọi-interface đã
vượt ngưỡng; cộng thêm việc phải đưa async runtime vào một crate có 128
test đang xanh thì `standard` là đánh giá thấp có hệ thống, không phải tiết
kiệm ceremony.

## Approach

### Đường đã chọn

Xây theo **5 mảnh tuần tự**, nền trước — mặt sau, và tách theo **ranh giới
ngôn ngữ/test-suite** chứ không theo màn hình. Lý do tách như vậy: mảnh
config phải đăng ký vào `fgos setup`/`doctor` (cổng bắt buộc của
`AGENTS.md`) nên nó là việc **Node** (`npm test`), trong khi bốn mảnh còn
lại là **Rust** (`cargo test`) — gộp lại thì một `verify` phải chạy cả hai
suite và footprint trải hai ngôn ngữ.

**Có tiền lệ trực tiếp ngay trong chính vùng tính năng này:** `tsk-2m5`
("herdr-orchestrator: settings source for auto-launch toggles +
doctor/setup registration") đã là một item RIÊNG, tách khỏi `tsk-2ja`/
`tsk-57q` là các consumer của nó. Kế hoạch này lặp lại đúng hình dạng đó.

### Phương án đã cân nhắc và loại

| Phương án | Vì sao loại |
|---|---|
| Một item duy nhất, không tách | 8 flag/high-risk với footprint trải 3 ngôn ngữ; một `verify` duy nhất không chứng minh nổi, và không có điểm dừng an toàn nào ở giữa |
| Tách theo màn hình (taskboard/detail/auth trộn lẫn) | Mỗi mảnh sẽ tự mang một phần auth → auth bị hiện thực rải rác, đúng thứ D8 muốn tránh; và mỗi mảnh phải sửa `Cargo.toml` |
| Gộp config vào mảnh webserver | Trộn `npm test` với `cargo test` trong một verify; đi ngược tiền lệ `tsk-2m5` |
| Làm cf-access ngay trong v1 bắt buộc | D8/`DISCUSSION.md` §7 chốt nó **tuỳ chọn**; lớp 1 đã đủ cho LAN |
| Tự thiết kế scheme auth mới | D8 chốt port idiom đã kiểm chứng từ `herdr-gateway` — tự thiết kế auth là đúng loại việc không nên tự làm |

### Bản đồ rủi ro

`impact-analysis: degraded` (gitnexus `present` nhưng index cũ:
`79fead3` vs HEAD `13eef94d`) — **mọi phát biểu blast-radius dưới đây là
chưa xác nhận**, phải cross-check bằng `rg` tại `fgos-coding-validating`.

| # | Thành phần | Mức | Điều gì chứng minh được |
|---|---|---|---|
| R1 | Đưa tokio/axum vào crate thuần đồng bộ (ratatui/crossterm) | **Cao** | `cargo test` toàn crate xanh **và** 128 test cũ không giảm số; chạy thật TUI xác nhận event loop không bị async runtime tranh chấp |
| R2 | Xác minh chữ ký JWT cf-access | **Cao** | Test **âm tính** bắt buộc: một assertion tự ký/giả bị từ chối. Chỉ test đường xanh là vô nghĩa ở đây |
| R3 | Secret file: quyền 0600 + không lọt git | **Trung bình** | Test quyền file sau khi sinh; `git check-ignore` xác nhận đường dẫn bị ignore; grep xác nhận không nằm trong `.fgos/config.json` |
| R4 | Mặc định BẬT + bind `0.0.0.0` (D10+D7) | **Trung bình** | `doctor` surface được trạng thái phơi nhiễm; log cảnh báo khi bind không phải loopback |
| R5 | Ghép cặp vị trí `askHistory[i]` ↔ answer thứ i (D2) | **Trung bình** | Chạy trên **dữ liệu thật**: `tsk-48i` có 23 ask + 23 answer — xác nhận ghép đúng cặp, không lệch một nhịp |
| R6 | Đọc/serve `CONTEXT.md`/`plan.md` theo `docsRef` của item (D3) | **Trung bình** | `docsRef` là đường dẫn từ event log; phải canonicalize và bắt buộc nằm trong `docs/` trước khi đọc — test một `docsRef` dạng `../../` bị từ chối |

R6 không nằm trong `CONTEXT.md` và không đổi scope/behavior/data shape —
nó là chi tiết hiện thực của D3, nên được ghim làm **giả định** bên dưới
thay vì trả ngược về `fgos-coding-exploring`.

### Thứ tự và lý do

`fgos graph --json`: tsk-ldb là component **cô lập** (`size 1`),
`topUnblock` rỗng, `criticalPath` (depth 10, `tsk-4vo…tsk-19y-1`) không đi
qua nó. Nên thứ tự **không** lấy được từ graph — nó đến từ phụ thuộc nội
bộ giữa 5 mảnh:

```
P1 config+doctor  →  P2 webserver core + auth L1  →  P3 taskboard  →  P4 task detail
                              └──────────────────────────────────────→  P5 cf-access (tuỳ chọn)
```

P1 trước vì P2 phải đọc toggle/bind/port từ đúng nguồn config đó. P4 là
mục tiêu thật của cả item (lời người dùng gốc: "tập trung vào phần view
task detail") nhưng phải đứng sau P3 vì P3 là điểm vào của nó.

**Footprint chồng lấn có chủ ý:** P2/P3/P4/P5 đều chạm
`herdr-plugin/src/web/mod.rs` (đăng ký route). Chúng **phải chạy tuần tự,
không song song** — đây đúng loại va chạm `footprintOverlapAmong` sinh ra
để bắt.

## Shape

### P1 — config + doctor/setup registration

> **NẮN LẠI (tsk-6d2)** — `tsk-48w` giữ nguyên, đổi scope thành **cờ
> static-serving của gateway + đăng ký `fgos setup`/`doctor` cho cờ đó**.
> Phần token/secret riêng bên dưới (cụm D9) **bỏ hẳn**: web client dùng
> Bearer của gateway (realignment D13). Phần `bindAddress` chuyển sang
> `tsk-54y`. Đoạn dưới giữ lại làm bối cảnh, không phải việc phải làm
> nguyên văn.

Thêm section config riêng cho web dashboard vào `.fgos/config.json` (cạnh
`herdrOrchestrator`), đọc fail-closed từ Rust theo đúng khuôn
`settings.rs` hiện có, **nhưng mặc định BẬT** (D10 — cố ý khác 4 toggle
kia). Section gồm tối thiểu: cờ bật/tắt (mặc định `true`), `bindAddress`
(mặc định `0.0.0.0`, D7) và **`port` mặc định `8788`** (D13 — né 8787 của
`herdr-gateway` để chạy được cả hai trên một máy). Đăng ký vào `fgos setup` config-merge + `fgos doctor` check registry
theo khuôn `herdr-launcher-configured`
(`src/setup/registrations.mjs:1074-1114`: `DEFAULT_*_SETTINGS` +
`registerConfigDefault({id,key,shape})` + `registerCheck({id,description,
check})`). Thêm dòng `.gitignore` cho đường dẫn secret của D9.

**Đường dẫn secret ghim tại đây: `.fgos/herdr-web-secret`.** D9 chỉ nói
"một file gitignored dưới `.fgos/`" mà không đặt tên; không có tên cụ thể
thì không verify nào assert được nó bị ignore. Ghim tên là hoàn tất D9,
không phải mở lại nó.

**Lane riêng của P1: `high-risk`** (không thừa hưởng mù từ cha). Đếm lại
cho đúng phạm vi con này: data model (thêm hình dạng config bền), **audit/
security — hard-gate** (dòng `.gitignore` là biện pháp ngăn commit
credential; D9 tồn tại đúng vì `.fgos/config.json` bị git track), public
contracts (`fgos doctor` thêm check id; `config.json` thêm section),
existing covered behavior (`registrations.mjs` dùng chung mọi doctor check;
`test/setup` 162 test), multi-domain (Node + Rust) = **5 flag, 1 hard-gate**.

### P2 — webserver core + auth lớp 1

> **ĐÃ ĐÓNG (tsk-6d2)** — `tsk-k4v` ở `wontfix`, `supersededBy: tsk-7l9`.
> Gateway đã có webserver thật và auth thật (`Bearer`, constant-time,
> `gateway.rs:421-449`). **Đừng xây HTTP server thứ hai.** Phần
> static-serving còn thiếu đã về `tsk-48w`; CORS + bind về `tsk-54y`. Cookie-session
> `/api/login` mô tả bên dưới bị realignment D13 thay bằng Bearer. Đoạn
> dưới chỉ còn giá trị lịch sử.

axum + `rust-embed`/`axum-embed`, phục vụ static asset + health-check.
Bind theo config, mặc định `0.0.0.0:8788` (D7 + D13), cảnh báo khi không
phải loopback. Auth lớp 1 đầy đủ theo D8/D9: resolve token (env → file
0600 tự sinh), `POST /api/login` với `constant_time_eq`, cookie
`HttpOnly; SameSite=Strict`, mọi thất bại **404 câm**. Bề mặt ghi khai báo
dạng allowlist ngay từ đây (`answer`/`approve`/`reject`), chưa cần có
handler thật.

**Thêm ở vòng quyết định 2026-08-12 (D12/D14):**

- **Tiến trình con, không nằm trong TUI (D12).** Binary tự re-exec chính
  nó ở chế độ server; cockpit chỉ bật/tắt. Đóng cockpit **không** giết web
  dashboard — đây là điều kiện để dùng được từ điện thoại, lúc mà không
  cockpit nào đang mở.
- **`herdr-plugin/build.rs` (chưa tồn tại hôm nay — đã kiểm) với
  `create_dir_all("static")` (D14).** Đây là mảnh làm hai pipeline tách
  rời: `cargo build/test/clippy` chạy được trên checkout sạch chưa từng
  `npm run bundle`. Port thẳng từ `herdr-gateway/build.rs`.
- **`.gitignore` thêm `herdr-plugin/static/`** (output bundle, không commit).
- Nhúng: `#[derive(RustEmbed)] #[folder = "static/"]` + feature
  `debug-embed`, **không** bật `compression` — trả thẳng `&'static [u8]`,
  không copy heap mỗi request. Kèm đường override đọc từ đĩa khi
  `<static_dir>/index.html` có mặt, để dev sửa frontend không phải rebuild
  binary (cả hai đều theo đúng `herdr-gateway/src/web/mod.rs:25-29,95-98`).

Chi phí bộ nhớ đã đo, không phỏng đoán: bundle thật của `herdr-gateway` là
**76K** (mà phần lớn là `@xterm/xterm`, thứ dashboard này không cần). Asset
nằm ở `.rodata`, demand-paged, file-backed sạch — RSS chỉ tăng theo phần
thật sự được phục vụ và kernel evict được. Không phải heap.

### P3 — taskboard

Danh sách work item đọc qua `WorkItemSource` đã có
(`herdr-plugin/src/ports.rs:11-20`), không thêm nguồn dữ liệu mới.
Frontend dựng bằng vite + TypeScript dưới `herdr-plugin/web/` (D14) —
`package.json`/`vite.config.ts` dựng ở mảnh này vì đây là màn web đầu tiên;
P4 dùng lại, không dựng lại.

> **NẮN LẠI (tsk-6d2)** — hai chỗ:
>
> 1. **Khung frontend KHÔNG dựng ở đây nữa.** realignment D6 supersede D14:
>    `package.json`/`vite.config.ts` + lớp API client là item riêng
>    **`tsk-yo0`**; `deps` của tsk-5jr/tsk-4id đã trỏ vào nó.
> 2. **Nguồn dữ liệu đổi.** Không đọc qua `WorkItemSource` trong binary
>    nữa (cụm D1 đã bị tsk-7l9 D8 đóng) — đây là web client độc lập gọi
>    `GET /v1/work` và `GET /v1/ready` qua HTTP, trích
>    `docs/contracts/fgos-gateway-api-v1.yaml`. Làm tươi bằng cheap-poll
>    `GET /v1/state/digest`, không phải server đẩy.

### P4 — task detail (mục tiêu chính)

> **NẮN LẠI (tsk-6d2)** — web client độc lập gọi `GET /v1/work/{id}` và
> `GET /v1/rollup/{id}`, trích contract yaml (realignment D10). Ba khối nội
> dung (cụm D2/D3/D4) giữ nguyên. **Cảnh báo hợp đồng:** gateway hiện
> **không có route edit** — `/work/{id}` chỉ có `get`. M03 edit-mode được
> giữ theo realignment D1, nhưng route phải được thêm trước; đừng code
> nhánh edit dựa trên endpoint chưa tồn tại.

Ba khối: lịch sử agent đã làm (nguồn `CONTEXT.md`/`plan.md`, D3 + guard
R6); lịch sử câu hỏi (ghép theo `seq`, D2); câu hỏi cần trả lời phủ **cả
`ask` lẫn `gate-approve`** (D4), layout tách rõ câu-hỏi / vì-sao /
bối-cảnh.

### P5 — cf-access (tuỳ chọn)

Lớp 2 của D8. Port thẳng `herdr-gateway/src/web/cf_access.rs`.

> **NẮN LẠI (tsk-6d2)** — `tsk-18to` giữ, **vẫn optional**. Khung hai lớp
> cộng dồn của D8 không đổi, nhưng **lớp 1 nay là Bearer của chính
> gateway**, không phải cookie-session do P2 xây (realignment D13 —
> P2 đã đóng). `deps` trỏ tsk-k4v đã gỡ. Môi trường đã chốt là LAN/Tailscale
> HTTP thuần (realignment D7) nên cf-access chưa cần ngay; nó thành cần khi
> gateway phải phơi ra ngoài mạng riêng — đúng ngưỡng xem lại D13 ghi.

### Ca cần chứng minh (theo mức high-risk)

- **Rỗng/biên:** item chưa từng park (`askHistory` vắng) → khối lịch sử
  câu hỏi rỗng, không panic. Item có `docsRef` trỏ tới thư mục không tồn
  tại → khối lịch sử agent báo thiếu, không 500.
- **Không được regress:** 128 test Rust hiện có vẫn xanh; TUI vẫn chạy
  bình thường khi webserver bật.
- **Truy cập đồng thời:** hai tab web cùng `answer` một item → cửa ghi
  một-cửa của fgOS phải giữ, không sinh đường ghi thứ hai (D8's allowlist
  đi qua `fgos <verb>`, không ghi thẳng `.fgos/`).
- **Hỏng một phần:** JWKS endpoint không với tới được → cf-access từ chối
  sạch, **không** rơi ngược về "cho qua" (fail-closed).
- **Lệch nhịp:** item có số ask ≠ số answer (đang park, chưa trả lời) →
  ghép cặp D2 không được lệch các cặp phía trước.

## Assumptions

| # | Giả định | Nếu sai thì sao |
|---|---|---|
| A1 | Thêm tokio vào crate ratatui không phá event loop TUI hiện tại (chạy server trên runtime riêng/thread riêng) | R1 — nếu sai, phải tách webserver thành tiến trình con, đổi hẳn hình dạng P2 |
| A2 | `docsRef` chỉ được ghi bởi phiên local qua `fgos edit`, không bao giờ từ mạng (allowlist ghi của D8 không gồm `edit`) | R6 — nếu sai, guard canonicalize thành bắt buộc chặn, không phải phòng xa |
| A3 | Ghép cặp theo vị trí của D2 đúng trên dữ liệu thật, vì FSM chặn hỏi-đè (S4(b) của cụm `tsk-65i`/`tsk-539`) | R5 — nếu sai, cần một khoá liên kết thật, mà D2 đã cố ý loại |
| A4 | `.fgos/` là nơi hợp lệ cho file secret (đã có 5 tiền lệ gitignored cùng loại) | R3 |

## Split

Tách thành 5 item con, mỗi item mang `parent: tsk-ldb`, và `deps` nối
tuần tự đúng thứ tự ở phần Approach (không chỉ nói trong prose — nếu để
`deps` rỗng thì cả 5 cùng nổi lên frontier và một lượt dispatch song song
có thể chạy P3 trước khi P2 tồn tại, đúng thứ footprint chồng lấn đã cảnh
báo).

Bảng verify dưới đây là **bản đã sửa sau reality gate vòng 1** (xem mục
"Reality gate" cuối file — ba lệnh cũ đã bị bác). Mỗi lệnh dưới đây đã được
**chạy thật và xác nhận ĐỎ hôm nay**, đúng kỷ luật *"một verify chưa từng
chạy đỏ thì chưa phải một verify"*.

| Mảnh | id | deps | verify (đã sửa, đã đo đỏ) |
|---|---|---|---|
| P1 config + doctor/setup | `tsk-48w` | — | `node --test 'test/setup/**/*.test.mjs' && node bin/fgos.mjs doctor --json --dir . \| grep -q 'herdr-web-dashboard-configured' && git check-ignore -q .fgos/herdr-web-secret` *(mệnh đề thứ 3 thêm sau reality gate riêng của P1 — xem cuối file)* |
| P2 webserver core + auth L1 | `tsk-k4v` | `tsk-48w` | `grep -q 'fn login_rejects_wrong_token_with_opaque_404' …/web/auth.rs && grep -q 'fn warns_when_bind_address_is_not_loopback' …/web/mod.rs && cargo test <manifest> \| grep -qE '[1-9][0-9]* passed' && cargo build --release` |
| P3 taskboard | `tsk-5jr` | `tsk-k4v` | `grep -q 'fn taskboard_lists_work_items_through_work_item_source' …/web/taskboard.rs && cargo test <manifest> web_taskboard \| grep -qE '[1-9][0-9]* passed'` |
| P4 task detail *(mục tiêu chính)* | `tsk-4id` | `tsk-5jr` | 3 × `grep -q 'fn …'` (`pairs_ask_history_with_answers_by_seq`, `rejects_docs_ref_path_traversal`, `lists_gate_approve_alongside_ask`) `&& cargo test <manifest> web_task_detail \| grep -qE '[1-9][0-9]* passed'` |
| P5 cf-access *(tuỳ chọn)* | `tsk-18to` | `tsk-k4v` | 2 × `grep -q 'fn …'` (`rejects_forged_assertion`, `fails_closed_when_jwks_unreachable`) `&& cargo test <manifest> cf_access \| grep -qE '[1-9][0-9]* passed'` |

Item cha `tsk-ldb` cũng đã sửa cùng lý do (verify cũ chạy **xanh** hôm nay
vì nó chỉ là toàn bộ suite đang xanh sẵn): nay là
`test -f herdr-plugin/src/web/mod.rs && cargo test <manifest> | grep -qE '[1-9][0-9]* passed' && cargo build --release && npm test`
— đo đỏ hôm nay (`exit 1`).

**Ba cơ chế trong bảng, mỗi cái đã đo cả hai chiều:**

| Cơ chế | Chiều đỏ | Chiều xanh |
|---|---|---|
| `node --test 'test/setup/**/*.test.mjs'` | — | chạy thật: **162 pass, 0 fail, 35s** (so với 186s cả suite) |
| `grep -q 'fn <tên test>'` | file/hàm chưa tồn tại → `exit 2` | xanh khi hàm test được viết. Idiom sẵn có của repo (`tsk-4ot`, `tsk-64z`, `tsk-417`) — tái dùng, không tự chế |
| `cargo test <filter> \| grep -qE '[1-9][0-9]* passed'` | filter không khớp gì → guard chặn (đo thật: "GUARD SAYS FAIL — vacuous caught") | filter khớp thật → guard cho qua (đo thật trên `settings_missing`) |
| `doctor --json \| grep -q 'herdr-web-dashboard-configured'` | id chưa tồn tại hôm nay (đo thật) | id anh em `herdr-launcher-configured` đã có sẵn trong output → hình dạng có thật |

P5 nhánh song song từ P2 (không chặn P3/P4) — đúng tính chất "tuỳ chọn"
của nó: ba mảnh kia deliver được mà không cần nó.

### Companion, ngoài cây con này (D5)

`tsk-539` (STR71, "ask self-sufficiency") **không** là con của tsk-ldb và
**không** có cạnh `deps` nào tới nó — đó chính là nội dung D5. Nó được đẩy
tiếp riêng sau khi cụm này xong.

## Reality gate — vòng 1 (2026-08-12): **NOT READY**

| Chiều | Kết quả | Bằng chứng |
|---|---|---|
| Mode fit | PASS | 8 flag đếm được, 3 hard-gate; `grep -c '#\[test\]' herdr-plugin/src/*.rs` → **128** test đang có, xác nhận flag "existing covered behavior" |
| Repo fit | PASS | `ports.rs:11-20` (`WorkItemSource`, 5 method) đọc trực tiếp; `settings.rs:1-53` đọc trực tiếp; `registrations.mjs:1064-1112` grep thấy check `herdr-launcher-configured`; `herdr-gateway/src/web/cf_access.rs:195-217` **tự đọc lại** — đúng như trích, có `set_required_spec_claims(["exp","iss","aud"])` kèm comment giải thích |
| Assumptions | PASS (A1 khai unproven) | A3 chứng minh trên dữ liệu thật (dưới); A4 chứng minh bằng 5 tiền lệ gitignore; A1 **khai là chưa chứng minh được ở stage này** |
| Smaller path | PASS | Tiền lệ `tsk-2m5` tách settings+doctor thành item riêng khỏi consumer — kế hoạch đang theo đúng hình dạng đã có, không tự chế nhỏ hơn/lớn hơn |
| **Proof surface** | **FAIL** | 3 lỗi cụ thể, xem dưới |
| Impact-analysis posture | PASS | `fgos tool query` → gitnexus `present`; `.gitnexus/` vắng trong worktree; posture `degraded` mà `plan.md` ghi là khớp thực tế |

### FAIL — Proof surface: 3 lỗi, đều xác minh bằng lệnh chạy thật

| # | Item | Lệnh verify | Chuyện gì thật sự xảy ra |
|---|---|---|---|
| F1 | P1 `tsk-48w` | `npm test -- test/setup && …` | `npm test` là `node --test 'test/**/*.test.mjs'`, nên `-- test/setup` **thêm** một thư mục trần vào argv chứ không lọc. Chạy thật: `✖ test at test/setup:1:1 — 'test failed'`. Verify này **không bao giờ pass được**, kể cả khi code đúng hoàn toàn |
| F2 | P4 `tsk-4id` | `cargo test … web_task_detail web_qa_history web_gate_approve` | `cargo test` chỉ nhận **một** `[TESTNAME]`. Chạy thật với 2 filter → `Usage: cargo test [OPTIONS] [TESTNAME]`, thoát lỗi. Cũng **không bao giờ pass được** |
| F3 | P3 `tsk-5jr`, P5 `tsk-18to`, và P4 sau khi sửa F2 | `cargo test <manifest> <filter>` | Filter không khớp gì thì cargo vẫn **exit 0**. Đo thật: `cargo test … web_taskboard; echo $?` → **0**. Nghĩa là ba verify này **XANH NGAY HÔM NAY**, trước khi viết một dòng code nào |

**F1/F2 hỏng theo kiểu fail-closed** — khó chịu nhưng an toàn, chạy phát
biết ngay. **F3 hỏng theo kiểu fail-open** — nguy hiểm hơn hẳn: nó cho
phép một item chưa hiện thực gì được tuyên bố là done. Đây đúng lớp lỗi
repo này đã tự ghi lại bài học:

> *"một `verify` chưa từng chạy đỏ thì chưa phải một `verify`"* — sự cố
> vòng 8, `docs/history/gate-question-quality-and-routing/DISCUSSION.md`

P2 `tsk-k4v` (`cargo test` toàn crate + `cargo build --release`) **không**
dính F3 — nó chạy cả 128 test thật. Nhưng nó chỉ chứng minh *không
regress*, chưa chứng minh hành vi MỚI nào; cần thêm một mệnh đề đỏ-trước.

### Ma trận khả thi

| Giả định | Rủi ro | Cần chứng minh gì | Bằng chứng tìm được | Kết quả |
|---|---|---|---|---|
| A3 / R5 — ghép cặp theo vị trí `askHistory[i]` ↔ answer thứ i | TB | Đúng trên dữ liệu thật | Chạy trên `.fgos/state.json`: `tsk-48i` có **23 ask / 23 answer**; cặp 1 và cặp 23 khớp nội dung (câu trả lời nói đúng về pattern grep của chính câu hỏi đó) | **PASS** |
| A4 / R3 — `.fgos/` là nhà hợp lệ cho secret | TB | Có tiền lệ gitignored | `.gitignore` có 5 mục `.fgos/*` kèm lý do; `git ls-files .fgos/config.json` xác nhận config.json **bị track** → D9 đúng khi cấm để token ở đó | **PASS** |
| R2 — xác minh chữ ký JWT cf-access | Cao | Prior art có verify chữ ký thật, không phải check header | `herdr-gateway/src/web/cf_access.rs:195-217` đọc trực tiếp: `Validation::new(RS256)` + `set_issuer` + `set_audience` + `validate_nbf` + `set_required_spec_claims(["exp","iss","aud"])` + `decode(...)` | **PASS** |
| A1 / R1 — tokio không phá event loop ratatui | Cao | 128 test cũ xanh + TUI vẫn chạy | **Chưa chứng minh được ở stage này** — chỉ chứng minh được khi P2 chạy thật. Giảm thiểu: chạy server trên runtime/thread riêng, không đụng vòng lặp TUI. `crossterm 0.29` xác nhận trong `Cargo.lock` | **UNPROVEN — khai báo, không giấu** |
| R6 — path traversal qua `docsRef` | TB | Guard canonicalize | Chưa hiện thực (đúng, chưa tới lúc); ghim làm A2 + proof point của P4 | Hoãn sang P4 |

### Verdict

```text
NOT READY - RETURN TO PLANNING
```

Lý do: chiều **Proof surface** FAIL. Ba trong năm item con mang lệnh verify
mà hoặc không bao giờ pass được (F1, F2), hoặc pass sẵn khi chưa làm gì
(F3). Không hạ chuẩn cho qua: F3 là đúng cơ chế cho phép tuyên bố done giả.

Việc cần làm ở `fgos-coding-planning`: sửa `verify` của `tsk-48w`,
`tsk-4id`, `tsk-5jr`, `tsk-18to` (và siết thêm cho `tsk-k4v`) sao cho mỗi
lệnh **chạy đỏ được hôm nay** và chỉ xanh khi hành vi mới tồn tại. Không
đụng D1-D11, không đổi hình dạng 5 mảnh — chỉ lớp chứng minh.

### Đã sửa (quay lại planning, cùng phiên)

Toàn bộ 5 verify con + verify của item cha đã viết lại (bảng ở mục Split).
Không đụng D1-D11, không đổi hình dạng 5 mảnh, không đổi `deps` — đúng
phạm vi mà reality gate yêu cầu.

**Sáu lệnh, mỗi lệnh đã chạy thật và xác nhận đỏ hôm nay:**

| Item | exit hôm nay |
|---|---|
| `tsk-48w` | `1` — doctor chưa có check id |
| `tsk-k4v` | `2` — `web/auth.rs` chưa tồn tại |
| `tsk-5jr` | `2` — `web/taskboard.rs` chưa tồn tại |
| `tsk-4id` | `2` — `web/qa_pairing.rs` chưa tồn tại |
| `tsk-18to` | `2` — `web/cf_access.rs` chưa tồn tại |
| `tsk-ldb` (cha) | `1` — `web/mod.rs` chưa tồn tại |

Cũng đã đo chiều xanh của từng cơ chế (bảng ở mục Split) để không đổi một
lỗi fail-open lấy một lỗi fail-closed: `node --test` scoped chạy 162 test
xanh thật; guard `[1-9][0-9]* passed` cho qua khi filter khớp thật; id
`herdr-launcher-configured` có thật trong output `doctor` nên hình dạng
grep của P1 là có thật.

**Nguyên nhân gốc, ghi lại để không tái phạm:** vòng 1 tôi chép draft
verify từ §7 của `DISCUSSION.md` mà **không chạy thử lệnh nào**. §7 là bản
phác trong lúc thảo luận thiết kế, chưa bao giờ là lệnh đã kiểm chứng —
coi nó như đã kiểm chứng chính là lỗi.

## Reality gate — vòng 2 (2026-08-12): **READY WITH CONSTRAINTS**

Chỉ chạy lại chiều đã FAIL; năm chiều kia giữ nguyên kết quả vòng 1 (bằng
chứng không đổi).

| Chiều | Kết quả | Bằng chứng |
|---|---|---|
| **Proof surface** | **PASS** (trước FAIL) | Cả 6 lệnh đo đỏ hôm nay (bảng exit code ở mục "Đã sửa"); cả 3 cơ chế đo được chiều xanh; guard vacuous đo cả hai chiều |
| 5 chiều còn lại | PASS | không đổi từ vòng 1 |

### Ràng buộc mang sang executing (không phải lỗi, là điều chưa chứng minh được ở đây)

| # | Ràng buộc | Vì sao không chứng minh được ở stage này |
|---|---|---|
| C1 | **A1/R1 chưa chứng minh:** tokio có thể phá event loop ratatui | Chỉ lộ ra khi P2 chạy thật. Giảm thiểu đã chốt: server chạy trên runtime/thread riêng, không đụng vòng lặp TUI. Cổng thật: 128 test cũ phải còn xanh — nằm ngay trong verify của `tsk-k4v` |
| C2 | **impact-analysis: degraded** | gitnexus `present` nhưng index cũ (`79fead3` vs HEAD) và `.gitnexus/` vắng trong worktree. Mọi phát biểu blast-radius chưa xác nhận — phải cross-check bằng `rg`, không tin kết quả rỗng |
| C3 | **R6 chưa hiện thực** (guard canonicalize `docsRef`) | Đúng lịch: nó là proof point của P4, không phải của stage này. Đã ghim thành một `grep -q 'fn rejects_docs_ref_path_traversal'` trong verify của `tsk-4id` nên không thể quên |

```text
READY WITH CONSTRAINTS
```

## Reality gate riêng của P1 `tsk-48w` (2026-08-12)

Con này được tạo với `--stage planning` để tự đi qua reality check của
chính nó, thừa hưởng `CONTEXT.md` của cha chứ không lặp lại exploring.

### Vòng 1: **NOT READY** — Proof surface FAIL

Lane của P1 tự đếm lại ra `high-risk` (5 flag, hard-gate = audit/security
— xem mục P1 ở Shape). Mà chiều high-risk đòi mọi rủi ro medium+ có proof
point, thì đúng mệnh đề an toàn duy nhất lại **không có** proof:

| | Nội dung |
|---|---|
| Verify cũ chứng minh | (a) `test/setup` xanh, (b) doctor check đã đăng ký |
| Verify cũ **không** chứng minh | (c) đường dẫn secret thật sự bị git ignore |
| Vì sao (c) không tự có | Precedent `checkHerdrOrchestratorConfigured` (`registrations.mjs:1081-1102`) chỉ kiểm *section có mặt + giá trị boolean*. Check mới theo khuôn đó cũng sẽ không đụng gitignore — nên không thể trông chờ nó phủ hộ |
| Lỗ kèm theo | Tên file secret chưa ghim ở đâu (D9 chỉ nói "một file dưới `.fgos/`") → không có đường dẫn thì không assert được |

### Đã sửa

Ghim `.fgos/herdr-web-secret` (mục P1 ở Shape) và thêm mệnh đề thứ ba vào
verify. Đo thật:

| Mệnh đề | Hôm nay |
|---|---|
| `git check-ignore -q .fgos/herdr-web-secret` | **exit 1** — chưa ignore, đỏ đúng |
| `git check-ignore -q .fgos/state.json` *(đối chứng)* | **exit 0** — cơ chế chạy đúng, không phải luôn-đỏ |
| Cả verify mới | **exit 1** — đỏ |

Đối chứng `state.json` là phần quan trọng: nó chứng minh `git check-ignore`
thật sự phân biệt được ignored/không, chứ không phải một lệnh luôn fail —
tức mệnh đề mới sẽ chuyển xanh thật khi dòng `.gitignore` được thêm.

### Vòng 2: **READY WITH CONSTRAINTS**

Năm chiều kia PASS: **Repo fit** — đọc trực tiếp `registrations.mjs:
1074-1114`, đúng ba mảnh `DEFAULT_*_SETTINGS`/`registerConfigDefault`/
`registerCheck` như plan mô tả; **Mode fit** — `high-risk` khớp phần đếm
lại ở trên; **Smaller path** — không có, đây đã là mảnh nhỏ nhất tách theo
ranh giới ngôn ngữ (tiền lệ `tsk-2m5`); **Assumptions** — A4 (`.fgos/` là
nhà hợp lệ cho secret) chứng minh bằng 5 tiền lệ gitignore + đối chứng
`state.json`; **Impact-analysis posture** — kiểm lại tươi, gitnexus vẫn
`present`, `.gitnexus/` vẫn vắng trong worktree → `degraded` như cha ghi.

Ràng buộc mang sang executing: **C2** (impact-analysis `degraded` — blast
radius chưa xác nhận, cross-check bằng `rg`).

```text
READY WITH CONSTRAINTS
```

## NẮN LẠI P1 `tsk-48w` (2026-08-15, sau realignment D14) — supersede mục ngay trên

**Đọc trước:** mục "Reality gate riêng của P1" ngay trên (2026-08-12) chốt
`READY WITH CONSTRAINTS` cho một scope đã CHẾT một phần — nó còn giữ cụm
D9 gốc (`.fgos/herdr-web-secret`, verify mệnh đề `git check-ignore -q
.fgos/herdr-web-secret`). `docs/history/herdr-web-dashboard-plan-
realignment/CONTEXT.md` D14 (2026-08-15) đã nắn: **bỏ hẳn** phần secret
(D13 của cùng tài liệu: web client dùng Bearer có sẵn của gateway, không
còn secret riêng nào); **giữ nguyên** phần cờ static-serving + đăng ký
`fgos setup`/`doctor`. Mục này không mở lại D1-D11 của `CONTEXT.md` gốc —
chỉ áp D14 vào phần shape/verify cụ thể của con `tsk-48w`.

Item cũng phát hiện đang `stage: planning` với `verify` cũ còn nguyên
mệnh đề chết (`git check-ignore -q .fgos/herdr-web-secret` — không file
nào như vậy còn được tạo ra nữa) — verify này giờ **không bao giờ pass
được**, đúng loại lỗi fail-closed F1/F2 mục "Reality gate — vòng 1" ở
trên đã cảnh báo, chỉ khác nguyên nhân (drift theo thời gian, không phải
lỗi viết ban đầu).

### Mode: giữ nguyên `high-risk` (không đếm lại)

Lane cũ (5 flag, 1 hard-gate audit/security — dòng `.gitignore` ngăn
commit bundle output) vẫn đúng nguyên xi cho scope mới: vẫn thêm hình
dạng config bền (data model), vẫn có `.gitignore` (audit/security
hard-gate — giờ ngăn commit **bundle output**, không phải secret, nhưng
cùng loại rủi ro "quên .gitignore thì commit thứ không nên commit"), vẫn
đăng ký `fgos doctor` check (public contracts), vẫn dùng chung
`registrations.mjs`/162 test `test/setup` (existing covered behavior),
vẫn Node+Rust (multi-domain). Bớt một chi tiết (không còn "secret path"
cụ thể) không đổi flag nào trong 5 flag đã đếm.

### Approach

**Cổng chịu lực (D14 chưa nói cách làm, chỉ nói "cờ + đăng ký"):** làm
việc phục vụ static bundle THẬT, gated bởi cờ — không chỉ một field cấu
hình chết không có tác dụng gì. Port nguyên idiom đã kiểm chứng của
`herdr-gateway` (repo tham khảo cụm này đã dùng nhiều lần —
`herdr-plugin/src/gateway.rs`'s CORS/bind của `tsk-54y` cũng port từ
đây):

1. **`herdr-plugin/web/package.json`** — thêm script `bundle`
   (`"tsc -b && vite build --outDir ../static --emptyOutDir"`). Đã chạy
   thật tại validating pass này: `npm run bundle` (sau `npm ci`) sinh
   `herdr-plugin/static/{index.html,assets/,favicon.svg}` thật — 408ms,
   không lỗi.
2. **`herdr-plugin/build.rs`** (chưa tồn tại — xác nhận `find herdr-plugin
   -maxdepth 1 -name build.rs` = rỗng, khớp D14) — port tối giản từ
   `herdr-gateway/build.rs:1-13` (chỉ phần `create_dir_all("static")`,
   KHÔNG port phần fingerprint/git-sha — D14 chỉ khoá phần guarantee, thứ
   kia là tiện ích riêng của `herdr-go` chưa từng được khoá ở đây).
3. **`herdr-plugin/Cargo.toml`** — `rust-embed = { version = "8", features
   = ["debug-embed"] }` + `axum-embed = "0.1"` (bằng chứng thật, `cargo add
   --dry-run` tại pass này: resolve `rust-embed v8.12.0`, `axum-embed
   v0.1.0`, không xung đột với đồ thị dep hiện có — cùng version `rust-
   embed` reference `herdr-gateway/Cargo.toml:37` dùng). Thêm feature `fs`
   vào `tower-http` đã có (từ `tsk-54y`) — cần cho `ServeDir`/`ServeFile`
   (đã probe: `cargo add tower-http --features fs --dry-run` resolve sạch
   ở `v0.7`, khớp version hiện tại).
4. **`.gitignore`** (root — không có `.gitignore` riêng trong
   `herdr-plugin/`, xác nhận `find herdr-plugin -name .gitignore` = rỗng)
   — thêm dòng `herdr-plugin/static/`.
5. **`herdr-plugin/src/settings.rs`** — thêm `WebDashboardSettings {
   static_serving: bool }`, đọc từ section `herdrWebDashboard`. **Khác
   philosophy với `OrchestratorSettings` láng giềng trong CÙNG FILE**:
   `OrchestratorSettings::default()` fail-closed (mọi toggle off) vì
   không toggle nào trong 4 cái đó an toàn khi bật nhầm; `static_serving`
   fail-**open** (mặc định `true`) là quyết định CÓ CHỦ Ý của D10 (cụm
   gốc) — máy được chọn phục vụ trang mà không cần bước setup thêm. Phải
   ghi comment rõ divergence này ngay tại chỗ để người đọc sau không tưởng
   nhầm là bug.
6. **`herdr-plugin/src/gateway.rs`** — struct `WebAssets` (`#[derive(
   rust_embed::RustEmbed, Clone)] #[folder = "static/"]`) + hàm
   `with_static_serving(router: Router, enabled: bool, static_dir: &Path)
   -> Router`, port đúng logic dev-override/embedded-fallback của
   `herdr-gateway/src/web/mod.rs:97-113` (nếu `<static_dir>/index.html`
   tồn tại trên đĩa → `ServeDir` + SPA fallback cho dev; không thì
   `axum_embed::ServeEmbed<WebAssets>` cho binary release). **Không đổi
   chữ ký `build_router`** — hàm mới bọc NGOÀI router đã build (gọi ở
   `run()`, sau `build_router`), để 9 test hiện có của `build_router`
   (CORS/auth/error-envelope — đo CRITICAL risk ở `impact` scan của
   `tsk-54y`) không bị đụng tới. Đây chính là "smaller path" của reality
   gate: đổi chữ ký sẽ buộc sửa cả 9 test đó chỉ để thêm MỘT nhánh mới,
   trong khi bọc ngoài không đụng gì cũ.
7. **`src/setup/registrations.mjs`** — port nguyên khuôn
   `checkHerdrOrchestratorConfigured`/`DEFAULT_HERDR_ORCHESTRATOR_SETTINGS`
   (`registrations.mjs:1502-1542`, đọc trực tiếp): `DEFAULT_HERDR_WEB_
   DASHBOARD_SETTINGS = { staticServing: true }`, `registerConfigDefault
   ({id:'herdrWebDashboard', key:'herdrWebDashboard', shape:...})`,
   `registerCheck({id:'herdr-web-dashboard-configured', description,
   check})` — check chỉ xác nhận section có mặt + `staticServing` là
   boolean (khớp đúng khuôn láng giềng, không tự chế thêm điều kiện).

**Phương án đã cân nhắc và loại:**
- Đổi chữ ký `build_router` để nhận `web_settings` — loại vì đụng cả 9
  test hiện có (CRITICAL theo `impact` scan) chỉ để thêm một fallback,
  trong khi bọc ngoài đạt cùng kết quả với blast radius bằng 0 lên code
  cũ.
- Fingerprint/git-sha đầy đủ như `herdr-gateway/build.rs` — loại vì D14
  chỉ khoá phần `create_dir_all`, phần kia là tiện ích không ai yêu cầu ở
  đây (YAGNI).

### Bản đồ rủi ro

| Thành phần | Mức | Chứng minh gì |
|---|---|---|
| `npm run bundle` sinh `static/` đúng hình dạng RustEmbed cần | Thấp — đã chạy thật ở pass này | Output thật: `herdr-plugin/static/{index.html,assets/,favicon.svg}` |
| `rust-embed`/`axum-embed` build được với đồ thị dep hiện tại | Thấp — đã `cargo add --dry-run` thật | `rust-embed v8.12.0`, `axum-embed v0.1.0`, không xung đột |
| `with_static_serving` không đụng 9 test cũ của `build_router` | Trung bình — hàm mới, chưa viết | Bọc ngoài router đã build (không sửa `build_router` signature); proof point ở Execute: `cargo test --lib gateway` (verify sẵn có của `tsk-54y`, chạy lại) vẫn 19/19 xanh sau khi thêm hàm mới |
| `static_serving` mặc định ON không vô tình bật lộ dữ liệu | Trung bình — đây là hard-gate audit/security của lane | `ServeEmbed`/`ServeDir` chỉ phục vụ đúng `herdr-plugin/static/` (bundle công khai, không chứa secret — token vẫn nằm ở `~/.fgos/config.json`, ngoài phạm vi thư mục này); route `/v1/*` vẫn giữ `require_token` layer nguyên vẹn (fallback chỉ bắt route KHÔNG khớp `/v1/*`) |
| `.gitignore` thật sự chặn `static/` | Thấp | `git check-ignore -q herdr-plugin/static/<file>` — mệnh đề đối chứng giống hệt khuôn F-check đã dùng ở "Đã sửa" phía trên (đo đỏ trước khi thêm dòng, xanh sau) |

### Verify mới (thay verify chết)

```
cargo test --manifest-path herdr-plugin/Cargo.toml web_dashboard_settings | grep -qE '[1-9][0-9]* passed' && cargo test --manifest-path herdr-plugin/Cargo.toml static_serving | grep -qE '[1-9][0-9]* passed' && node --test 'test/setup/**/*.test.mjs' && node bin/fgos.mjs doctor --json --dir . | grep -q 'herdr-web-dashboard-configured' && git check-ignore -q herdr-plugin/static/probe-file
```

Giữ đúng khuôn `<filter> | grep -qE '[1-9][0-9]* passed'` đã học từ F3 ở
trên (không dùng filter trần, tránh vacuous pass khi filter không khớp
gì). Hai filter (`web_dashboard_settings`, `static_serving`) là tên hàm
test sẽ viết ở Execute — đặt tên trước ở đây để verify không phải sửa lại
sau.

### Decide the split

Một mảnh — không tách. D14 không mở lại quyết định "1 item" của cụm gốc;
7 việc trên (bundle script, build.rs, 2 dep Cargo, gitignore, settings.rs,
gateway.rs, registrations.mjs) đều phục vụ đúng MỘT hành vi quan sát được
("bật cờ thì gateway phục vụ trang thật; tắt thì không, và fgos doctor
biết cờ đó có cấu hình đúng hay không") — tách nhỏ hơn sẽ tạo trạng thái
trung gian không tự đứng được (vd: có `build.rs` mà chưa có
`with_static_serving` thì không chứng minh được gì).

### Outstanding questions

None — D14 đã trả lời câu hỏi phạm vi duy nhất còn treo (secret sống hay
chết); phần còn lại là cách làm, có tiền lệ thật để port.

## NẮN LẠI P3 `tsk-5jr` (2026-08-15) — taskboard, web client thật

**Đọc trước:** mục "P3 — taskboard" ở trên (2026-08-12/13) đã tự ghi chú
"NẮN LẠI" hai điểm (khung frontend chuyển sang `tsk-yo0`; nguồn dữ liệu
đổi sang HTTP) nhưng **chưa bao giờ áp vào chính field `footprint`/
`verify` của item** — cả hai vẫn giữ nguyên hình dạng cũ (`herdr-plugin/
src/web/taskboard.rs`, một MODULE RUST bên trong binary TUI, verify
`cargo test`). Mục này áp đúng ghi chú đã có, không mở lại quyết định
nào: màn hình là component React thật dưới `herdr-plugin/web/src/`, gọi
gateway qua HTTP, không có dòng Rust nào.

### Mode: giữ `standard` (đếm lại xác nhận)

Flag: **existing covered behavior** (mở rộng `herdr-plugin/web/` đã có 10
test của `tsk-yo0`, phải không đụng vỡ), **weak proof** (đây là màn hình
web ĐẦU TIÊN có state/interaction thật của cụm — chưa có tiền lệ trong
repo để so). Không có hard-gate (không auth mới, không data model mới —
chỉ đọc qua API đã có). 2 flag → **standard**, khớp tier hiện tại của
item, không cần nâng lên `high-risk`.

### Bootstrap — đọc trực tiếp `docs/ui-spec/screens/S02-taskboard.md` (172
dòng) + `docs/ui-spec/30-states-and-errors.md`

Trích nguyên văn các điểm chịu lực, không diễn giải lại:

- **Layout** (S02 §Layout): board nhóm theo status, có thể collapse, nhớ
  trạng thái collapse; rail "NEEDS ANSWER" ghim bên phải (desktop) /
  thành nhóm đầu tiên (mobile) — độc lập với group-by đang chọn.
- **3 quyết định layout chịu lực** (S02, ngay dưới ASCII mock): nhóm nhớ
  trạng thái collapse; chỉ báo phơi nhiễm mạng đứng CỐ ĐỊNH ở topbar
  (R5 — không phải toast biến mất); gateway picker cũng ở topbar (R1 —
  không giả định một origin cố định).
- **States** (S02 §States + `30-states-and-errors.md`): `ST-LOADING`
  (skeleton TRONG group header thật, đếm hiện trước nội dung),
  `ST-EMPTY-BOARD` (không có item nào — khác `ST-EMPTY-FILTER`, có item
  nhưng filter không khớp gì, luôn hiện filter đang áp + nút xoá),
  `ST-DISCONNECTED` (gateway unreachable — đánh dấu dữ liệu cũ là STALE
  tại chỗ, không xoá, có nút retry).
- **R11** (`herdr-web-dashboard.md`): không badge/chuông ngụ ý push — số
  đếm trong group header chỉ đúng tại thời điểm người đang nhìn.
- **11 interaction** (S02 §Interactions, `A-S02-001..011`): click card →
  navigate S03 (item detail — `tsk-4id`, CHƯA xây); `+Add` → mở overlay
  M03; click group header → toggle collapse + persist; filter/group-by →
  mutate; rail entry click → navigate S04; gateway picker change →
  switch+reload (**deferred D11** — xem Assumptions); `work.changed` /
  `question.opened` / `gateway.unreachable` — client-derived events, D9
  (poll `/state/digest`, không server-push).

### Approach

**Chọn:** một component React `Taskboard` dưới `herdr-plugin/web/src/
screens/Taskboard.tsx`, dùng `createApiClient` (`tsk-yo0`) gọi
`listWork({ all: true })` (mock hiện cả nhóm DONE — mặc định `listWork`
chỉ trả open-only, đọc đúng contract `fgos-gateway-api-v1.yaml:123-126`:
tham số `all` mới kéo cả done/wontfix/retrospective/cleanup) và
`pollStateDigest` (`tsk-yo0/src/api/poll.ts`) trên một `setInterval` —
digest đổi thì refetch `listWork`, giữ nguyên D9.

**Grouping mặc định:** theo `status` THẬT (không tự chế rollup 4 nhóm
như mock ASCII ngụ ý — mock là ví dụ minh hoạ, không phải taxonomy khoá;
grouping theo status thật đơn giản hơn, không cần bịa một tầng rollup
không có D-ID nào chống lưng). "NEEDS ANSWER" rail là tập CẮT NGANG độc
lập — `status ∈ {awaiting-human, awaiting-approval}` — luôn hiện, không
phụ thuộc group-by đang chọn, đúng cấu trúc hai region tách biệt của
Layout.

**Filter/search:** client-side trên tập đã fetch — contract không có
free-text search REST endpoint nào (1 hit thật của chữ "search" trong
toàn file là dòng mô tả D9's tương lai "MCP search tool", không phải một
`/work/search` hay tham số query text nào trên `/work`/`/ready`; xác
nhận bằng đọc trực tiếp `paths:` — không path nào tên search). Filter
theo `stage`/`risk` (đã có trong `WorkItem`, `tsk-yo0/src/api/types.ts`).

**Collapse state nhớ được:** `localStorage`, key theo tên group — nhẹ,
không cần backend, đúng "remember their state" của spec, không yêu cầu
persist phía server (spec không nói vậy).

**Chỉ báo phơi nhiễm mạng (R5):** suy ra CLIENT-SIDE từ chính `baseUrl`
đã cấu hình — hostname không phải `localhost`/`127.0.0.1`/`[::1]` thì hiện
cảnh báo. Không có endpoint nào trong contract trả về bind address của
gateway (0 hit thật khi quét toàn file cho chữ đó) nên đây là tín hiệu
duy nhất client có thể tự quan sát —
nếu trình duyệt gọi được `baseUrl` từ một host không phải loopback thì
đúng nghĩa "reachable on network" mà R5 mô tả.

**Gateway picker:** hiện TĨNH (hostname của `baseUrl` hiện tại), không
tương tác — D11 khoá "v1 nói chuyện với đúng MỘT gateway", phần chọn
giữa nhiều gateway deferred sang `tsk-3b0`. Dropdown thật sẽ là việc của
`tsk-3b0`, không phải ở đây.

**`+Add` (M03):** KHÔNG có item nào trong bảy item đang chạy của cụm này
sở hữu M03's modal thật (`docs/ui-spec/modals/M03-add-edit-item.md`, 92
dòng, chưa gán cho item nào trong `tsk-54y/tsk-yo0/tsk-48w/tsk-5jr/
tsk-41h/tsk-4id/tsk-18to`). Nút `+Add` hiện thật, wire tới một overlay
placeholder tối giản ("Add item — coming soon") thay vì hiện thực M03
đầy đủ — giữ interaction A-S02-002 có thật (không phải nút chết) mà
không tự ý mở rộng phạm vi sang một spec 92 dòng chưa ai nhận. Ghi lại
làm phát hiện cho cụm, không phải quyết định âm thầm.

**Navigate tới S03:** `tsk-4id` (P4, bước kế trong trình tự) CHƯA xây
S03. `Taskboard` nhận prop `onSelectItem(id: string)`; component cha
(`App.tsx`) giữ `selectedItemId` state cục bộ, hiện một placeholder
("Task detail — tsk-4id sẽ xây") khi có id được chọn — không tự dựng một
router library (`react-router` etc.) khi chưa có quyết định nào khoá nó;
props/state cục bộ là "smaller path" đủ cho một điều hướng 1-cấp, đảo
ngược dễ khi `tsk-4id` cần thật.

**Phương án đã cân nhắc và loại:**
- Rollup 4 nhóm cố định theo đúng mock ASCII — loại vì không D-ID/tài
  liệu nào khoá đúng 4 nhóm đó là taxonomy chính thức; group theo status
  thật vừa đơn giản hơn vừa không bịa quy tắc.
- Xây router library cho navigate — loại, chưa cần thiết cho một điều
  hướng 1-cấp, có thể đổi khi `tsk-4id` thật sự cần nhiều route.
- Hiện thực M03 đầy đủ trong item này — loại, ngoài footprint đã khai
  của item (`taskboard.rs`/`taskboard.ts` cũ, giờ nắn lại thành màn
  taskboard, không phải modal add/edit), và 92 dòng spec riêng của M03
  xứng đáng item riêng.

**Files chạm (nắn lại, thay `footprint` cũ):**
`herdr-plugin/web/src/screens/Taskboard.tsx`, `herdr-plugin/web/src/
screens/Taskboard.test.tsx`, có thể thêm `herdr-plugin/web/src/App.tsx`
(wire `selectedItemId`). KHÔNG `herdr-plugin/src/web/taskboard.rs` (Rust
— chết theo nắn lại), KHÔNG `herdr-plugin/web/package.json`/
`vite.config.ts` (đã dựng ở `tsk-yo0`, D6).

### Bản đồ rủi ro

| Thành phần | Mức | Chứng minh gì |
|---|---|---|
| Grouping theo status thật + rail "needs answer" cắt ngang đúng | Trung bình — logic mới, dễ lẫn awaiting-human/awaiting-approval vào nhóm chính thay vì CHỈ ở rail | Test thật: item `status: awaiting-human` xuất hiện ở rail, KHÔNG xuất hiện lặp ở group chính (rail là view riêng, không phải filter loại khỏi group — kiểm cả hai vị trí) |
| Poll digest → refetch đúng, không refetch thừa khi digest không đổi | Trung bình | Test thật: `pollStateDigest` trả `changed:false` → không gọi lại `listWork`; `changed:true` → gọi lại đúng 1 lần |
| `ST-DISCONNECTED` giữ dữ liệu cũ, không xoá | Trung bình — đúng yêu cầu khoá của area spec Edge Cases, đã kiểm chứng ở `tsk-yo0` cho tầng API, giờ kiểm ở tầng UI | Test thật: fetch đầu thành công có data; fetch thứ hai ném `GatewayUnreachableError` (đã có ở `tsk-yo0/src/api/errors.ts`) → board vẫn hiện data cũ, có đánh dấu stale + nút retry, không blank |
| Chỉ báo phơi nhiễm mạng suy từ `baseUrl` | Thấp | Test thật: `baseUrl: 'http://localhost:4170/v1'` → không cảnh báo; `baseUrl: 'http://192.168.1.5:4170/v1'` → có cảnh báo |

### Verify mới (thay verify chết)

```
cd herdr-plugin/web && npm run test -- Taskboard
```

Không còn nhánh Rust nào — item này không chạm `herdr-plugin/src/*.rs`.
`npm run test -- Taskboard` filter đúng theo tên file (vitest, không
dính lỗi F1/F2/F3 của cargo — vitest exit non-zero khi 0 test file khớp
pattern, khác cargo test's "0 matched vẫn exit 0"; đo thật tại Execute
trước khi khoá verify cuối).

### Decide the split

Một mảnh — không tách. Board/rail/filter/poll/disconnected đều phục vụ
đúng MỘT màn hình quan sát được (S02); tách nhỏ hơn (vd rail riêng khỏi
board) sẽ tạo trạng thái không tự đứng được (rail không có board thì
không chứng minh được gì có ý nghĩa).

### Outstanding questions

None — mọi khoảng mở (rollup taxonomy, router, M03) đã được quyết bằng
smaller-path/reversible (D5), ghi rõ lý do, không phải câu hỏi cần
người.

## NẮN LẠI P4 `tsk-4id` (2026-08-15) — task detail, mục tiêu chính của cụm

**Đọc trước:** cùng loại lệch với P3 ở trên — `footprint`/`verify` cũ vẫn
là mảnh Rust bên trong TUI (`herdr-plugin/src/web/detail.rs`,
`herdr-plugin/web/src/detail.ts`), trong khi mô tả item đã tự ghi rõ nắn
lại từ D10 (web client độc lập gọi HTTP). Mục này áp đúng ghi chú đã có.

### Mode: giữ `heavy` (tier hiện tại) — không đếm lại thành lane riêng

Item đã ở tier `heavy`/risk `heavy` sẵn ("mục tiêu chính của cụm"); không
cần đếm lại flag vì đây là con lớn nhất trong 7 item, đúng bản chất công
việc (3 khối nội dung + ghép seq + guard traversal + 2 hành động ghi thật
lên trunk-adjacent state).

### Approach — 3 phát hiện thật làm lệch phạm vi gốc, mỗi cái xử lý riêng

**Phát hiện 1 — `GET /work/{id}`'s schema tài liệu SAI so với thật.**
Contract cũ khai `data: {$ref: WorkItem}`; hành vi thật (`get_work_by_id`
gọi `show`, không phải chỉ đọc field) trả về `{work, discovery, decisions,
gates, outcome, friction, settlement, learning}` — chính mô tả operation
đã nói đúng ("plus every log scoped to just this id") nhưng schema tham
chiếu sai. Sửa: thêm schema `WorkDetail` khớp thật, đổi tham chiếu của
`/work/{id}` GET. Bằng chứng: `fgos show tsk-48i` chạy thật, xác nhận
đúng 8 key top-level, `gates` có `{contextApprove, ask, askHistory,
statusAtAsk, answer, planApprove, validateApprove}` (không phải chỉ gate
records), `settlement.recent` cap **5** bản ghi mới nhất
(`SETTLEMENT_DISPLAY_CAP`) dù `count` phản ánh tổng thật (24 cho
tsk-48i).

**Phát hiện 2 — D3 (đọc CONTEXT.md/plan.md) không có đường nào cho web
client.** Không route gateway nào đọc nội dung file docs — `docsRef` chỉ
là path string. Thêm `GET /work/{id}/docs` (mới, ngoài 4 file footprint
gốc của item) — guard traversal bằng canonicalize sau khi join (không
string-match giá trị thô), test thật với file `secret.txt` ngoài
`docs/history/` để chứng minh guard chặn được, không chỉ chặn theo tên.
Đây chính là proof point R6 mà verify CŨ của item đã dự trù
(`rejects_docs_ref_path_traversal`) nhưng route đó chưa từng tồn tại
trước item này.

**Phát hiện 3 — D4 (gate-approve channel) không có state bền vững.** Sống
qua chính việc tự chạy cả cụm 7-item trong phiên này: câu hỏi gate luôn
hỏi/trả lời đồng bộ trong phiên sống, chưa từng thấy ghi thành trạng thái
"đang treo" nào remote xem được. Hỏi người, chốt D15
(`docs/history/herdr-web-dashboard/CONTEXT.md`): S03/S04 chỉ hiện lịch sử
gate ĐÃ hoàn tất (`{actor, at, verify}`), không giả lập câu hỏi đang treo.
Kênh `ask` (status `awaiting-human`) vẫn đầy đủ.

### Thiết kế 3 khối nội dung (giữ nguyên quyết định gốc D2/D3/D4 của cụm)

- **"What the agent did"** (D3): đọc từ `GET /work/{id}/docs`'s
  `contextMd`/`planMd`, KHÔNG từ `decisions[]` — `decisions[]` chỉ hiện
  sau disclosure kèm count, đúng D3 gốc.
- **Lịch sử câu hỏi ghép theo seq** (D2, R9): `pairTimeline()` — ghép vị
  trí, KHÔNG BAO GIỜ vẽ link dữ liệu không có. Tham số thứ ba
  `isCurrentlyParked` phân biệt hai lý do khác nhau một câu hỏi cuối
  không có trả lời: (a) vòng đang mở thật (chỉ có thể là câu hỏi CUỐI,
  FSM chỉ cho một ask mở tại một thời điểm) — loại khỏi ghép, gán
  `answer: null` trực tiếp; (b) trả lời có tồn tại nhưng ngoài cửa sổ cap-5
  — ghép từ cuối lùi lại, phần thiếu do cap cũng `answer: null` nhưng vì
  lý do khác. **Bug thật bắt được bởi chính test lúc viết**: bản đầu
  không phân biệt hai lý do này, ghép sai câu hỏi đang mở với câu trả lời
  của vòng TRƯỚC — sửa trước khi commit (xem Iron Law evidence).
- **Câu hỏi cần trả lời phủ ask + gate-approve** (D4, nắn theo D15 mới):
  ask đầy đủ (S03 hiện input trả lời thật gọi `answerWork`; S04 liệt kê
  toàn bộ, gọi `listWork({status:'awaiting-human'})`); gate-approve chỉ
  lịch sử đã xong.

### Hành động ghi thật, không phải stub

- **Answer this** (S03 + S04) — gọi thật `client.answerWork(id, text)`
  (đã có từ `tsk-yo0`).
- **Retire** — gọi thật `client.moveWork(id, 'wontfix')`.
- **Approve merge** (R7) — gọi thật `client.approveWork(id)`. Không có
  endpoint nào báo trước "gateway có đang ở main working tree không", nên
  nút vẫn được hiện (disabled trừ khi `status === 'awaiting-approval'`) và
  khi bấm, lỗi thật từ engine (`GatewayApiError.message`) hiện nguyên văn
  — không dự đoán trước, không nuốt lỗi (R7: "report unavailable with the
  reason", không phải "offered then failed" câm).
- **Edit** (M03) — placeholder, cùng lý do M03 chưa ai nhận như `tsk-5jr`
  đã ghi; `tsk-41h`'s `PATCH /work/{id}` tồn tại SẴN SÀNG cho M03 dùng khi
  nó được xây, không phải việc của item này.

### Điều hướng — sửa một chỗ ở `tsk-5jr`'s Taskboard

A-S02-006 (S02 spec): click rail "needs answer" → navigate **S04**, không
phải S03 trực tiếp. `Taskboard.tsx` (tsk-5jr) trước đây nối thẳng rail
click vào `onSelectItem` (S03) vì S04 chưa tồn tại lúc đó — sửa: thêm prop
optional `onOpenNeedsAnswer`, fallback về hành vi cũ khi không truyền (zero
blast radius lên 12 test hiện có của `Taskboard.test.tsx`, không cái nào
truyền prop mới nên tất cả giữ hành vi cũ nguyên xi).

### Bản đồ rủi ro

| Thành phần | Mức | Chứng minh gì |
|---|---|---|
| `pairTimeline` ghép đúng vị trí, không vẽ link giả | Trung bình — bug thật đã bắt được ở chính pass này | 5 test thật, gồm case "vòng đang mở" và case "cap-5 cắt vòng cũ", cả hai phân biệt đúng bằng `isCurrentlyParked` |
| Guard traversal của `GET /work/{id}/docs` chặn được thật, không chỉ theo tên | Trung bình — hard-gate audit/security | Test thật: file `secret.txt` có tồn tại thật ngoài `docs/history/`, route từ chối phục vụ (400), không chỉ so chuỗi `docsRef` |
| `WorkDetail` schema mới khớp đúng response thật | Thấp — đã chạy `fgos show` thật, không suy đoán | Trích dẫn trực tiếp output thật trong RESEARCH.md-tương-đương (mục Approach ở trên) |
| Approve merge không nuốt lỗi thật của engine | Thấp | Test thật: lỗi 412 giả lập trả `message` nguyên văn, hiện đúng trong `approve-error` |

### Verify mới (thay verify chết)

```
cd herdr-plugin && cargo test --lib gateway && cd web && npm ci && npm run test
```

Phủ cả hai phía: Rust (`get_work_docs`, guard traversal, `patch_work` từ
`tsk-41h`) và React (`pairTimeline`, 3 screens, poll, hành động ghi).

### Decide the split

Một mảnh — không tách. 3 khối nội dung + 2 route gateway mới + 3 màn hình
+ điều hướng đều phục vụ đúng MỘT mục tiêu quan sát được ("mở task detail
của một item và biết chính xác chuyện gì đang diễn ra, cần làm gì").

### Outstanding questions

None — D15 đã trả lời câu hỏi phạm vi gate-approve; phần còn lại là cách
làm, có bằng chứng thật (live `fgos show`, live traversal test) cho từng
quyết định.

## Kế hoạch riêng của P0a `tsk-54j` (2026-08-14) — area spec

Con này (`docs`, `parent: tsk-ldb`, `deps: [tsk-7l9]`) được tạo sau 5 mảnh
P1-P5 và vào thẳng stage `planning`, thừa hưởng `CONTEXT.md` của cha chứ
không lặp lại exploring. Việc của nó: viết `docs/specs/herdr-web-dashboard.md`
— area spec tech-agnostic, tương đương PRD của repo này — cộng một dòng trỏ
trong `docs/specs/reading-map.md`.

### Mode: high-risk

**4 flag, trong đó 1 hard-gate.** Đếm lại cho đúng phạm vi con này, không
thừa hưởng mù con số 8 flag của cha:

| Flag | Bằng chứng |
|---|---|
| audit/security *(hard-gate)* | Bản mô tả item (bổ sung 2026-08-13) thêm 6 hành động GHI lên trên phạm vi đã khoá vốn **chỉ-đọc** 3 màn (`CONTEXT.md` §Ranh giới tính năng). D6/D8/D9 thiết kế auth cho một bề mặt chỉ-đọc; approve-merge đổi trạng thái trunk. Mô hình đe doạ được mô tả trong spec này chính là thứ P2-P5 sẽ hiện thực theo |
| authorization | `docs/io-contract.md` (đã trích trong `CONTEXT.md` §Bằng chứng scout): fgOS **không có tầng phân quyền nào**, có chủ ý. tsk-7l9 D4: một token cho cả máy, không có định danh per-project/per-user. Không có nguyên liệu nào để trả lời "ai được approve-merge" |
| public contracts | `docs/specs/` là state layer BA-grade; spec này là đầu vào bắt buộc của `tsk-3x6` (bản mô tả tsk-3x6, bổ sung 2026-08-14) và là mô tả sản phẩm mà P2-P5 xây theo |
| weak proof | Hợp đồng API của gateway (tsk-7l9 D10 — OpenAPI mang số CTR + token `<name>/v<N>`) **chưa tồn tại**: `ls docs/specs/` hôm nay không có file nào như vậy. Spec này phải trỏ tới một hợp đồng chưa được viết. Kèm `impact-analysis: degraded` |

**Vì sao không phải lane nhỏ hơn:** nếu chỉ là chép lại 14 D-ID đã khoá thì
`small` là đủ. Nhưng 6 hành động ghi mới **chưa từng qua exploring, không
mang D-ID nào**, và bản mô tả item nói thẳng chúng là *"OPEN requirements to
spec out, not settled ones"*. Nghĩa là stage này phải tự phán một phần —
đúng loại việc `small` giả định là không có.

### Approach

#### Đường đã chọn

Một tài liệu, viết theo **đúng khuôn `docs/specs/distillery.md`** — spec duy
nhất trong thư mục đang dùng trọn bộ heading mà `verify` của item đòi
(`## Purpose` / `## Entry Points & Triggers` / `## Data Dictionary` /
`## Behaviors & Operations` / `## Actors & Access` / `## Business Rules` /
`## Edge Cases Settled` / `## Open Gaps` / `## Pointers`), kèm frontmatter
`area/updated/sources/decisions/coverage`. `fgos-plugin.md` để purpose ở
văn xuôi ngay dưới tiêu đề, **không** có heading `## Purpose` — theo khuôn
đó thì verify đỏ vĩnh viễn. Đây là lý do chọn `distillery.md` làm khuôn.

Nguyên tắc nội dung, chia làm hai lớp tách bạch, không trộn:

1. **Lớp đã khoá** — trích D-ID, không diễn giải lại: 14 D của
   `CONTEXT.md` (tsk-ldb) + D2/D4/D7/D8/D10 của
   `docs/history/fgos-interface-daemon/CONTEXT.md` (tsk-7l9).
2. **Lớp mới, chưa khoá** — 6 hành động ghi. Mỗi phát biểu hoặc (a) tựa
   được vào một cơ chế CÓ THẬT trong repo hôm nay, và được ghi kèm bằng
   chứng; hoặc (b) rơi xuống `## Open Gaps`, gọi đúng tên là chưa settled.
   **Không có ô thứ ba.**

#### Phương án đã cân nhắc và loại

| Phương án | Vì sao loại |
|---|---|
| Chỉ spec 3 màn chỉ-đọc đã khoá, bỏ 6 hành động ghi sang item khác | Bản mô tả item liệt kê chúng là yêu cầu bắt buộc phải spec, kèm chỉ dẫn xử lý khi không settle được ("flag this as an Open Gap"). Bỏ ra ngoài là thu hẹp scope thay người |
| Tự khoá luôn authz cho approve-merge trong spec này | Không có nguyên liệu: fgOS không có tầng phân quyền (`io-contract.md`), tsk-7l9 D4 chỉ có một token cho cả máy. Tự chế một mô hình authz ở đây là mở một quyết định sản phẩm mới dưới vỏ tài liệu |
| Mô tả endpoint REST cụ thể của gateway trong spec này | tsk-7l9 D10 nói hợp đồng đó là artifact riêng, có số CTR. Bịa hình dạng endpoint ở đây tạo nguồn sự thật thứ hai, đúng thứ D10 dựng ra để tránh |
| Ghi spec theo hướng embedded-server (D1 cũ của tsk-ldb) | Bản mô tả item ghi rõ nhánh đó **đã đóng** bởi tsk-7l9 D8: web là client độc lập, không nằm trong `herdr-fgos` |
| Viết cả layout/màu/typography luôn cho gọn | Là phạm vi của `tsk-3x6` (`docs/reference/herdr-web-dashboard-layout.md`). Bản mô tả tsk-54j nói thẳng: *"the concrete visual layout itself belongs to tsk-3x6's UI spec, not here"* |

#### Bản đồ rủi ro

`impact-analysis: degraded` — `fgos tool query --capability impact-analysis
--status present` hôm nay trả gitnexus `status: present`, nhưng hook trong
chính phiên này báo index cũ (last indexed `c0cedaa`, sau HEAD đã merge
main). Item này **không đụng một dòng code nào**, nên posture không chặn
gì; ghi lại để người đọc sau khỏi dò lại.

| # | Thành phần | Mức | Điều gì chứng minh được |
|---|---|---|---|
| RA1 | 6 hành động ghi được tuyên bố "settled" mà không có D-ID nào chống lưng | **Trung bình** | Đọc lại spec: mọi phát biểu trong `## Behaviors & Operations` về hành động ghi phải kèm hoặc một D-ID có thật, hoặc một đường dẫn/verb có thật trong repo; phần còn lại phải nằm dưới `## Open Gaps` |
| RA2 | authz cho approve-merge bị tự chế | **Trung bình** | `docs/io-contract.md` xác nhận không có tầng phân quyền; tsk-7l9 D4 xác nhận một token/máy. Bằng chứng cơ học kèm theo: `bin/fgos.mjs:3328` — `approve` **từ chối chạy** khi cwd không phải main checkout. Ràng buộc này có thật, phải ghi; còn "ai được phép" thì phải là Open Gap |
| RA3 | Bịa hình dạng API gateway trong khi hợp đồng của nó chưa tồn tại | **Trung bình** | `ls docs/specs/` hôm nay: không có file OpenAPI/contract nào của gateway. Spec chỉ được trỏ tới nó như một dependency gap đã biết |
| RA4 | "Delete a work item" được spec như xoá thật | **Trung bình** | Sổ verb (`src/cli/command-registry.mjs`) **không có verb `delete`**; event log là truth append-only. Cửa duy nhất có thật là `move <id> wontfix` (`src/state/status-fsm.mjs:156-169`, ba cửa vào `wontfix` từ `todo`/`doing`/`blocked`, cộng `awaiting-human`). Spec phải nói retire, không nói delete |
| RA5 | Lệch khuôn heading → verify đỏ vĩnh viễn | **Thấp** | Chính `verify` của item là bằng chứng: đã đo **exit 1** hôm nay (chưa có file); chuyển xanh khi 5 heading + dòng reading-map có mặt |
| RA6 | Hướng Monday.com/ClickUp lấn sang phạm vi tsk-3x6 | **Thấp** | Đọc lại: nó chỉ được xuất hiện như kỳ vọng phía actor trong `## Behaviors & Operations` (nhóm theo status, thao tác nhanh tại chỗ, lọc/nhóm), tuyệt đối không có kích thước/màu/khoảng cách |

RA1-RA4 đều là medium nên đều mang proof point sang `fgos-coding-validating`
đúng chuẩn high-risk; không cái nào được để trống.

#### Thứ tự

`fgos graph --json`: tsk-ldb là component **cô lập** (`size 1`), như vòng
lập kế hoạch của cha đã ghi — thứ tự không lấy được từ graph. Nó đến từ
`deps` có thật: `tsk-7l9` (`status: retrospective`, tức đã merge) → `tsk-54j`
→ `tsk-3x6`. P0a phải xong trước vì `tsk-3x6` khai nó là nguồn thông tin sản
phẩm, và verify của `tsk-3x6` grep đúng đường dẫn `docs/specs/herdr-web-dashboard.md`.

Không chồng lấn footprint với bất kỳ mảnh nào khác: P0a chạm 2 file
markdown dưới `docs/specs/`, P1-P5 chạm Rust/Node.

### Shape

Một tài liệu, các mục theo đúng thứ tự khuôn `distillery.md`:

- **Frontmatter** — `area: herdr-web-dashboard`, `updated: 2026-08-14`,
  `sources: [tsk-ldb, tsk-54j, tsk-7l9]`, `decisions:` liệt kê D-ID nguồn,
  `coverage: partial` (trung thực: 6 hành động ghi chưa khoá hết).
- **`## Purpose`** — bề mặt này là gì, cho ai, vì sao tồn tại. Ghi rõ nhu
  cầu gốc: xem/duyệt **từ điện thoại**, đúng lúc không có cockpit nào mở
  (`CONTEXT.md` §"Vì sao D12"). Ghi rõ **không thay thế TUI**.
- **`## Entry Points & Triggers`** — điểm vào theo góc người dùng, không
  phải endpoint: mở dashboard từ trình duyệt (đăng nhập bằng token), mở
  taskboard, mở một task, mở danh sách câu hỏi cần trả lời. Kèm điều kiện
  bật/tắt (D10 mặc định BẬT, D13 port 8788, D7 bind).
- **`## Data Dictionary`** — bảng đánh số các phần tử người dùng thấy:
  work item, câu hỏi cần trả lời (gộp `ask` + `gate-approve`, D4), lịch sử
  agent đã làm (D3), phiên đăng nhập, endpoint gateway đang kết nối tới
  (số nhiều — tsk-7l9 D2, client tương lai nối N gateway).
- **`## Behaviors & Operations`** — một mục con mỗi việc, đúng khuôn
  `distillery.md` (**Blocked when / What changes / Side effects /
  Afterwards**): xem taskboard (kèm kỳ vọng Monday.com/ClickUp), xem task
  detail, trả lời một câu hỏi đang đỗ, approve-merge, thêm item, sửa item,
  retire item. Mỗi việc ghi rõ nó đi qua verb một-cửa-ghi nào.
- **`## Actors & Access`** — bảng năng lực. Trung thực: hôm nay chỉ có
  **một** actor kỹ thuật ("ai giữ token của máy"), không phân vai, vì
  fgOS không có tầng phân quyền. Vai người dùng (chủ sản phẩm xem từ điện
  thoại) là vai **sản phẩm**, không phải vai được hệ thống cưỡng chế —
  nói thẳng khoảng cách đó.
- **`## Business Rules`** — R1..Rn, mỗi rule trích nguồn. Trong đó rule
  chịu lực: mọi hành động ghi đi qua verb một-cửa-ghi của fgOS
  (`add`/`edit`/`answer`/`approve`/`move`), web **không bao giờ** tự ghi
  `.fgos/`; gateway là chokepoint duy nhất spawn verb (tsk-7l9 D7).
- **`## Edge Cases Settled`** — item chưa từng đỗ hỏi lần nào; `docsRef`
  trỏ thư mục không tồn tại; đóng cockpit không giết dashboard (D12);
  gateway không với tới được từ client.
- **`## Open Gaps`** — nơi hạ cánh của RA2/RA3 và mọi phần chưa khoá của 6
  hành động ghi. Mỗi gap ghi: gap là gì, vì sao chưa trả lời được ở đây,
  ai/item nào trả lời được.
- **`## Pointers`** — trỏ về `CONTEXT.md`/`DISCUSSION.md`/`plan.md` của
  tsk-ldb, `CONTEXT.md` của tsk-7l9, `docs/decisions/0014`, `io-contract.md`,
  và `tsk-3x6` cho lớp UI.

Cộng **một dòng** vào `docs/specs/reading-map.md` theo đúng nếp đang có
(`- \`<đường dẫn>\` — <mô tả>; spec: <đường dẫn spec>`).

### Assumptions

| # | Giả định | Nếu sai thì sao |
|---|---|---|
| A5 | Khuôn `distillery.md` là khuôn đúng cho spec mới (nó là spec duy nhất dùng trọn bộ heading verify đòi) | Nếu sai thì chỉ là lệch phong cách trong `docs/specs/`, không ảnh hưởng hành vi; verify vẫn xanh |
| A6 | `coverage: partial` được chấp nhận trong frontmatter (`fgos-plugin.md` dùng `full`) | Nếu vocabulary chỉ cho phép `full`, đổi nhãn — không đổi nội dung, và không được đổi thành `full` khi Open Gaps còn thật |
| A7 | tsk-7l9 ở `status: retrospective` nghĩa là D1-D10 của nó đã khoá và trích được | Nếu nó bị mở lại, phần trích tsk-7l9 trong spec phải sửa theo — nhưng `retrospective` là sau merge, nên rủi ro thấp |

### Split

**Không tách.** Một tài liệu + một dòng index là một mảnh việc trung thực
duy nhất; tách ra thì mảnh "dòng reading-map" không tự đứng được (verify
của nó sẽ phải grep file mà mảnh kia mới tạo). Đây là nhánh
*pass-through* — `tsk-54j` đi tiếp như chính nó.

### Proof surface

`verify` của item **đã là lệnh thật, không phải placeholder** — không sync
đè (kỷ luật "không ghi đè giá trị đã đặt có chủ ý"). Đo hôm nay:

| Mệnh đề | Hôm nay |
|---|---|
| Cả verify (`test -f` + 5 × `grep -q '^## …'` + `grep -q` reading-map) | **exit 1** — đỏ đúng, file chưa tồn tại |

Chiều xanh có thật vì cả 7 mệnh đề đều là kiểm tra sự tồn tại của văn bản
mà chính item này viết ra — không có mệnh đề nào phụ thuộc trạng thái ngoài
tầm với. Không dính lỗi lớp F3 (fail-open) của vòng 1: `test -f` trên một
file chưa tồn tại thoát khác 0, không phải một filter rỗng thoát 0.

Điều verify này **không** chứng minh (mang sang reality gate của
`fgos-coding-validating`, không giấu): nó chỉ chứng minh 5 heading có mặt,
không chứng minh nội dung dưới heading là đúng và có nguồn. Đó chính là lý
do RA1-RA4 mang proof point đọc-lại-nội-dung, chứ không dựa vào verify.

### Chốt tại cổng validateApprove (2026-08-14, chủ sản phẩm)

Cổng không tự duyệt được: `gate-check` trả `canAutoApprove: false`. Chẩn
đoán trực tiếp cho thấy tier đã được phủ (`standard` ≤ level `standard`),
`plan.md` không còn mục mở, cost verdict `REVERSIBLE` — thứ duy nhất chặn
là **sàn từ-khoá hard-gate** bắn trên chính bản mô tả item: `auth`,
`authentication`, `migration`, `secret`, `delete`. Sàn này đơn điệu về
phía hỏi người, không được lập luận hạ xuống.

Hai điểm được hỏi gộp một lượt, cả hai chốt theo đề xuất:

| # | Điểm | Chốt |
|---|---|---|
| G1 | **approve-merge từ dashboard** | **Trong scope, ghi rõ phơi nhiễm.** Spec mô tả đủ luồng approve-merge đi qua verb `fgos approve`, kèm một Open Gap nói thẳng: ai giữ token của máy thì approve được, không có phân quyền mịn hơn cho tới STR38. Bằng chứng nền: `docs/io-contract.md:170-171` (tầng phân quyền thuộc STR38, chưa xây), tsk-7l9 D4 (một token/máy), `bin/fgos.mjs:3328` (approve từ chối chạy ngoài main checkout — ràng buộc cơ học có thật, phải ghi) |
| G2 | **"Delete a work item"** | **Retire qua `wontfix`.** Không có verb `delete` trong sổ verb; event log là truth append-only. Cửa có thật: `move <id> wontfix` (`src/state/status-fsm.mjs:156-169`). Spec viết là *retire*, không viết là *delete*; item biến khỏi danh sách đang mở, lịch sử còn nguyên |

Cả hai đều đảo ngược được (sửa một tài liệu, trước khi P2-P5 viết dòng code
nào), nên chúng là **nội dung được chốt**, không phải ràng buộc treo.

### Outstanding questions của P0a

None — RA2/RA3 không phải câu hỏi treo của kế hoạch này; chúng là nội dung
mà `## Open Gaps` của chính spec phải ghi ra, và bản mô tả item đã chỉ dẫn
đúng cách xử lý ("flag this as an Open Gap in the spec if it cannot be
resolved within this item's own scope"). G1/G2 ở trên đã chốt phần mà chủ
sản phẩm cần quyết; phần còn lại (authz mịn, hợp đồng API gateway) hạ cánh
đúng vào `## Open Gaps` của spec.

## Kế hoạch riêng của P0b `tsk-3x6` (2026-08-14) — UI spec + wireframe

Con này (`docs`, `parent: tsk-ldb`, `deps: [tsk-54j]`) chạy ngay sau P0a và
lấy chính output của P0a — `docs/specs/herdr-web-dashboard.md` — làm nguồn
thông tin sản phẩm. Nhánh `fgw/tsk-3x6` fork thẳng từ commit merge P0a vào
`fgw/tsk-ldb`, nên spec đó **có mặt sẵn trong cây làm việc** (đã kiểm:
`docs/specs/herdr-web-dashboard.md` tồn tại tại base của nhánh này).

### Mode: standard

**3 flag, không flag nào hard-gate:**

| Flag | Bằng chứng |
|---|---|
| public contracts | Tài liệu này là tiêu chí nghiệm thu của P3 (`tsk-5jr`) và P4 (`tsk-4id`). Bản mô tả item nói rõ vì sao: verify của P4 chỉ chứng minh tính đúng (ghép cặp theo seq, chặn path traversal, gộp hai kênh) — **không mệnh đề nào chạm tới tính dễ đọc**, nên P4 có thể xanh hoàn toàn mà vẫn trượt mục tiêu thật |
| weak proof | Tiêu chí nghiệm thu thật là **chủ quan** ("câu hỏi trình bày sao cho người không có ngữ cảnh trong đầu trả lời nhanh"). Verify của item chỉ grep 3 heading + 1 trích dẫn — không đo được điều đó |
| cross-platform | Nhu cầu gốc là **dùng từ điện thoại** (`CONTEXT.md` §"Vì sao D12"), nên bố cục phải trả lời cả desktop lẫn mobile, không phải một |

**Vì sao không phải lane lớn hơn:** không có flag hard-gate nào. Item này
không quyết định bảo mật, không đụng schema, không đụng code — mọi quyết
định về auth/phơi nhiễm đã khoá ở P0a và chỉ được **vẽ lại**, không mở
lại. Và không phải lane nhỏ hơn vì 3 flag vượt ngưỡng `small`.

### Approach

#### Đường đã chọn

Hai artifact, một nguồn:

1. **Spec có cấu trúc + wireframe sinh bằng kỹ năng `ui-spec`** dưới
   `docs/ui-spec/` — đúng chỉ dẫn bổ sung 2026-08-14 của bản mô tả item
   ("write this item's UI spec using the `ui-spec` skill … and generate the
   wireframe with that same skill's tooling rather than hand-authoring
   either artifact").
2. **`docs/reference/herdr-web-dashboard-layout.md`** — tài liệu người đọc,
   đúng đường dẫn + 3 heading mà `verify` của item đòi, trích
   `docs/specs/herdr-web-dashboard.md` và trỏ sang artifact ở (1).

Hai thứ này không trùng việc: (1) là hợp đồng tương tác máy-đọc-được +
wireframe bấm được; (2) là bản đọc-một-lượt mà `tsk-5jr`/`tsk-4id` mở ra
khi build, đúng vai trò tiền lệ `docs/reference/herdr-dashboard-layout-and-
action-queues.md` đang giữ cho TUI (bản mô tả item chỉ đúng tiền lệ này).

**Căng thẳng phải nói thẳng, không giấu:** `ui-spec/SKILL.md` §"When NOT to
use" ghi rõ nó dành cho app **≥ 20 surface**, và "app đơn giản < 15 màn thì
PRD + Figma là đủ". Bề mặt này có ~7 surface. Nghĩa là kỹ năng đang được
dùng dưới ngưỡng nó tự khai. Vẫn làm, vì hai lý do có thật: chủ sản phẩm
yêu cầu tường minh, và thứ thật sự cần ở đây — **một wireframe bấm được để
soi tính dễ đọc trước khi có pixel** — chính là thứ `interpret:wf` sinh ra,
không phụ thuộc số lượng surface. Ghi lại để phiên sau không tưởng là đã bỏ
sót cổng của chính kỹ năng đó.

#### Kiểm kê surface (từ `docs/specs/herdr-web-dashboard.md`)

Lấy thẳng từ `## Behaviors & Operations` của area spec, không tự chế:

| ID | Loại | Surface | Nguồn trong area spec |
|---|---|---|---|
| S01 | screen | Sign in | §Sign in |
| S02 | screen | Taskboard | §View the taskboard (kỳ vọng Monday.com/ClickUp) |
| S03 | screen | Task detail | §View a task's detail — **deliverable lõi** |
| S04 | screen | Questions needing answer | §Entry Points, D4 (gộp `ask` + `gate-approve`) |
| M01 | modal | Answer a parked question | §Answer a parked question |
| M02 | modal | Approve a merge (xác nhận) | §Approve a merge — hành động duy nhất đổi trunk |
| M03 | modal | Add / Edit work item | §Add + §Edit a work item |
| C01 | component | Status pill + quick actions | kỳ vọng "quick actions reachable in place" |
| F01 | flow | Trả lời một câu hỏi đang đỗ, đầu-cuối | bản mô tả item: userflow bắt buộc |
| F02 | flow | Duyệt merge, đầu-cuối | bản mô tả item: userflow bắt buộc |

"Retire a work item" không có surface riêng — nó là quick action trên C01
cộng một xác nhận, đúng như area spec mô tả (retire, không phải delete).

#### Phương án đã cân nhắc và loại

| Phương án | Vì sao loại |
|---|---|
| Chỉ viết tay `docs/reference/...md`, bỏ `ui-spec` | Trái chỉ dẫn tường minh 2026-08-14 của bản mô tả item, và mất wireframe bấm được — thứ duy nhất soi được tiêu chí dễ đọc trước khi có pixel |
| Chỉ sinh cây `docs/ui-spec/`, bỏ file reference | `verify` của item grep đúng `docs/reference/herdr-web-dashboard-layout.md` + 3 heading; bỏ nó thì item không bao giờ xanh, và `tsk-5jr`/`tsk-4id` mất bản đọc-một-lượt |
| Chạy `ui-spec generate` tự động từ PRD | Pipeline `generate` giả định một PRD đơn lẻ; ở đây nguồn là area spec + 14 D-ID + 10 D-ID của tsk-7l9. Kiểm kê surface bằng tay từ `## Behaviors & Operations` là chính xác hơn và kiểm chứng được từng dòng |
| Vẽ luôn màu/typography chi tiết mức design system | Bản mô tả item chỉ đòi "colour/typography choices", không đòi design system. Mở rộng là tự bơm scope |

#### Bản đồ rủi ro

`impact-analysis: degraded` — `fgos tool query` báo gitnexus `present`,
hook trong phiên báo index cũ. Item không đụng code nên posture không chặn.

| # | Thành phần | Mức | Điều gì chứng minh được |
|---|---|---|---|
| RB1 | Tooling `ui-spec` không chạy được trên máy này | **Đã đóng** | `tools/node_modules` vắng lúc đầu (`ERR_MODULE_NOT_FOUND` khi import `ajv`); `npm ci` trong `.claude/skills/ui-spec/tools/` chạy thật: **added 63 packages in 531ms**. Đây là dựng tooling của chính kỹ năng, không phải thêm dependency vào repo forgent |
| RB2 | Spec cấu trúc lệch khỏi area spec (tự chế màn/hành động không có trong P0a) | **Trung bình** | Bảng kiểm kê surface ở trên trích từng mục `## Behaviors & Operations`; tại validating đọc ngược lại area spec, mỗi surface phải chỉ được về một mục có thật |
| RB3 | Wireframe sinh ra rỗng/hỏng (contract block sai, target treo) | **Trung bình** | `npm run check` (= `validate` + `build`) phải exit 0; `npm run interpret:wf` phải sinh file HTML có thật. Cả hai đo được, không phải phán |
| RB4 | Tài liệu reference lệch heading → verify đỏ vĩnh viễn | **Thấp** | Chính `verify` là bằng chứng: đo **exit 1** hôm nay; xanh khi 3 heading + trích dẫn có mặt |
| RB5 | Quyết định CSS framework bị tự chốt thay người | **Trung bình** | Bản mô tả item khai đây là quyết định **còn mở** và D14 im lặng về CSS framework. Không tự chốt — đưa lên cổng validateApprove kèm so sánh thật (xem "Câu hỏi mang lên cổng") |
| RB6 | Footprint khai thiếu → va chạm dispatch song song | **Thấp** | Footprint hiện chỉ khai 1 file; kế hoạch này chạm thêm `docs/ui-spec/**`. Sửa `footprint` của item trước khi executing |

#### Thứ tự

`deps` có thật: `tsk-54j` (đã `delivered`, merge vào `fgw/tsk-ldb`) →
`tsk-3x6`. Trong item: kiểm kê surface → file cross-cutting → surface file
(prose) → contract block → flow → `npm run check` → `interpret:wf` →
cuối cùng mới viết `docs/reference/herdr-web-dashboard-layout.md`, vì tài
liệu đó phải trích được kết quả wireframe chứ không phải hứa trước.

### Shape

**`docs/ui-spec/`** theo đúng khuôn kỹ năng: `spec.config.yaml`,
`00-overview.md`, `20-domain-rules.md`, `30-states-and-errors.md`,
`15-system-events.md`, rồi `screens/`, `modals/`, `components/`, `flows/`
theo bảng kiểm kê. Domain rule lấy thẳng từ `## Business Rules` R1-R11 của
area spec, không phát minh rule mới.

**`docs/reference/herdr-web-dashboard-layout.md`** — heading bắt buộc theo
`verify`, cộng phần bổ sung mà bản mô tả item liệt kê:

- `## Userflow` — đầu-cuối: đăng nhập → taskboard → mở task → trả lời câu
  hỏi đang đỗ → duyệt merge.
- `## Taskboard` — bố cục kiểu Monday.com/ClickUp: nhóm theo status, pill
  màu theo status, quick action tại chỗ, control lọc/nhóm.
- `## Task detail` — **mục lõi**: ba vùng (câu hỏi / vì sao đang hỏi / ngữ
  cảnh item) sắp xếp ra sao, và timeline hỏi-đáp trình bày thế nào qua
  nhiều vòng đỗ.
- `## Empty and error states` — item chưa từng đỗ; `docsRef` trỏ thư mục
  không tồn tại; gateway không với tới được.
- `## Colour and typography` — bảng màu + thang chữ, kèm lý do.
- Trích `docs/specs/herdr-web-dashboard.md` làm nguồn sản phẩm (mệnh đề
  thứ 5 của verify), và trỏ sang wireframe sinh được.

### Câu hỏi mang lên cổng validateApprove

**Quyết định CSS framework** — bản mô tả item khai là còn mở, D14 chỉ khoá
vite + TypeScript và **im lặng về CSS**. Đã so sánh thật:

| | Tailwind (kèm/không kèm stitch) | CSS viết tay |
|---|---|---|
| Chi phí | +1 dependency frontend, tích hợp vite là đường mòn sẵn | Không thêm dependency |
| Hợp với mục tiêu | Board mật độ cao kiểu Monday/ClickUp đúng chỗ utility-class tiết kiệm nhiều nhất | Kiểm soát hoàn toàn, nhưng tốn công cho đúng loại UI này |
| Đảo ngược | Utility class rải khắp markup → gỡ ra là viết lại style | Về sau muốn theo Tailwind cũng là viết lại style |
| Tiền lệ repo | Không có tiền lệ CSS framework nào (herdr là TUI) | Cũng không có tiền lệ |

Không bên nào rẻ để đảo ngược, nên **không áp dụng lối thoát "chọn cái đảo
ngược được rồi đi tiếp"** — đây là T1 thật (hai phương án còn đứng sau khi
so sánh), và nó ràng buộc P2-P5 chứ không chỉ tài liệu này.

### Assumptions

| # | Giả định | Nếu sai thì sao |
|---|---|---|
| A8 | Cây `docs/ui-spec/` là nơi hợp lệ cho artifact máy-đọc-được của UI (kỹ năng mặc định vào đó) | Nếu repo muốn nơi khác, di chuyển thư mục — không ảnh hưởng nội dung hay verify |
| A9 | ~7 surface đủ phủ hết `## Behaviors & Operations` của area spec | RB2 — validating đọc ngược để bắt thiếu |
| A10 | `npm ci` trong thư mục tools của kỹ năng là dựng tooling, không phải quyết định scope của repo forgent | Nếu sai, artifact vẫn viết được bằng tay, chỉ mất wireframe bấm được |

### Split

**Không tách.** Hai artifact nhưng một mạch việc: file reference phải trích
kết quả wireframe, nên tách ra thì mảnh sau chờ mảnh trước mà không tự
đứng được. Nhánh *pass-through*.

### Proof surface

`verify` của item đã là lệnh thật, không phải placeholder — không sync đè.
Đo hôm nay:

| Mệnh đề | Hôm nay |
|---|---|
| Cả verify (`test -f` + 3 × `grep -q '^## …'` + `grep -q` trích area spec) | **exit 1** — đỏ đúng, file chưa tồn tại |

Không dính lỗi lớp fail-open: `test -f` trên file chưa tồn tại thoát khác 0.

Điều verify **không** chứng minh, mang sang reality gate: nó không đo được
tính dễ đọc — đúng điều flag "weak proof" ở trên đã khai. Bù bằng hai proof
point cơ học mà validating chạy thật: `npm run check` exit 0 (RB3) và
`interpret:wf` sinh HTML có thật, cộng phần đọc-ngược area spec (RB2).

### Chốt tại cổng validateApprove (2026-08-15, chủ sản phẩm)

Cổng không tự duyệt được (`canAutoApprove: false`) — đúng như dự kiến: T1
bắn thật, và `plan.md` lúc đó còn mục mở. Câu hỏi được trình bày kèm bảng
so sánh ở mục ngay trên; chủ sản phẩm chốt:

| # | Điểm | Chốt |
|---|---|---|
| G3 | **CSS framework cho web client** | **Tailwind, và dùng stitch để sinh layout.** Stitch tooling sinh bố cục ban đầu rồi export Tailwind/HTML làm điểm xuất phát; Tailwind là lớp style thật của client. Đổi lại, chấp nhận một dependency frontend mới (Tailwind) cộng một tooling sinh-layout trong quy trình, và chấp nhận output của stitch phải được dọn lại chứ không dùng thô |

Hệ quả phải ghi, không giấu: D14 khoá vite + TypeScript và **im lặng về
CSS**; G3 không mở lại D14, nó lấp đúng khoảng im lặng đó. P2-P5 thừa
hưởng quyết định này — mọi mảnh frontend sau đây viết style bằng Tailwind,
không tự chọn lại.

### Outstanding questions của P0b

None — G3 đã chốt câu hỏi T1 duy nhất của kế hoạch này.

## Outstanding questions

None
