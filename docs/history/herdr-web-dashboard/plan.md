# plan.md — herdr-web-dashboard (tsk-ldb)

Quyết định nguồn: `CONTEXT.md` (D1-D11) cùng thư mục. Thảo luận đầy đủ:
`DISCUSSION.md`. Kế hoạch này **không mở lại** bất kỳ D-ID nào — chỉ trích.

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

Thêm section config riêng cho web dashboard vào `.fgos/config.json` (cạnh
`herdrOrchestrator`), đọc fail-closed từ Rust theo đúng khuôn
`settings.rs` hiện có, **nhưng mặc định BẬT** (D10 — cố ý khác 4 toggle
kia). Đăng ký vào `fgos setup` config-merge + `fgos doctor` check registry
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

axum + `rust-embed`/`axum-embed`, phục vụ static asset + health-check.
Bind theo config, mặc định `0.0.0.0`, cảnh báo khi không phải loopback
(D7). Auth lớp 1 đầy đủ theo D8/D9: resolve token (env → file 0600 tự
sinh), `POST /api/login` với `constant_time_eq`, cookie `HttpOnly;
SameSite=Strict`, mọi thất bại **404 câm**. Bề mặt ghi khai báo dạng
allowlist ngay từ đây (`answer`/`approve`/`reject`), chưa cần có handler
thật.

### P3 — taskboard

Danh sách work item đọc qua `WorkItemSource` đã có
(`herdr-plugin/src/ports.rs:11-20`), không thêm nguồn dữ liệu mới.

### P4 — task detail (mục tiêu chính)

Ba khối: lịch sử agent đã làm (nguồn `CONTEXT.md`/`plan.md`, D3 + guard
R6); lịch sử câu hỏi (ghép theo `seq`, D2); câu hỏi cần trả lời phủ **cả
`ask` lẫn `gate-approve`** (D4), layout tách rõ câu-hỏi / vì-sao /
bối-cảnh.

### P5 — cf-access (tuỳ chọn)

Lớp 2 của D8. Port thẳng `herdr-gateway/src/web/cf_access.rs`.

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

## Outstanding questions

None
