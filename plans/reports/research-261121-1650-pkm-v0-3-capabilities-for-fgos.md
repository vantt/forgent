# pkm v0.3.0 và main: năng lực mới và ý nghĩa cho fgOS

- **Ngày:** 2026-11-21 (Asia/Saigon)
- **Nguồn:** bản clone `vantt/pkm` tại `00c1473` (main, 2026-11-18); các tag `v0.1.0` … `v0.3.0`; issue
  [vantt/pkm#1](https://github.com/vantt/pkm/issues/1) đọc ngày 2026-11-21.
- **Phạm vi:** chỉ đọc. Không build, không chạy test. Mọi điều không có trong repo hay issue được ghi rõ là **suy ra**.
- **Bối cảnh fgOS:** [document-identity spec](../../docs/platform/documentation/subcomponents/document-identity/spec.md)
  mục 5, 6, 8.1, 8.2; [yêu cầu R1–R9](requirements-261112-1533-fgos-to-pkm-structure-mechanism.md);
  [đo v0.2.1 trên kho fgOS](measurement-261113-1033-docos-pkm-locate-eval-fgos-corpus.md).

## Kết luận

- **OHS Node đã biến mất.** Từ v0.3.0 (tag 2026-11-15, `3eb5842`), tìm kiếm lai (BM25 với gói `vi`/`de`, vector
  `multilingual-e5-small` qua ONNX Runtime) chạy trong chính binary, qua bốn crate Rust mới `pkm-vault`, `pkm-lang`,
  `pkm-embed`, `pkm-search`. Không còn tiến trình Node, gói OHS 280–330 MB hay `OhsOptions`. Thiết kế 8.2 của fgOS
  ("OHS là tool ngoài, pkm khởi động OHS làm tiến trình con") đã lỗi thời và cần viết lại.
- **API nhúng đã đổi phá vỡ.** `SessionConfig.search: SearchOptions { db, model_dir, worker: External|Thread|Process, … }`
  thay `SessionConfig.ohs`. Mặc định `External` nghĩa là phiên không bao giờ tự sinh worker, nên fgOS host phải chọn ai
  chạy worker index (một worker cho mỗi vault, chọn bằng `flock`). Model (khoảng 130 MB) phải được tải bằng
  `pkm_lifecycle::install::model::ensure`, và hàm này gọi `curl`.
- **Có 167 commit sau v0.2.1: 107 commit vào v0.3.0, 60 commit trên main chưa tag.** Bản 0.4.0 (plan
  `261115-2015-…`, phase 5 còn `todo`) gom nhiều đổi phá vỡ fgOS cần, nhất là `writes: none` kiểm ngay trong
  `pkm-core` (`7ae999e`). fgOS nên ghim `v0.4.0` khi có tag, không nên ghim `v0.3.0`.
- **Ba việc fgOS báo ngày 2026-11-13:** định dạng heading đã sửa (`09549a7`, có trong v0.3.0); thiếu cờ chọn DB của OHS
  không còn là vấn đề, vì mỗi vault có `search.db` riêng và CLI có cờ `--search-db`; việc `explain` nêu chunk **chưa
  làm**, và top-k section mỗi note vẫn hoãn. Trên issue, pkm chưa trả lời gì sau comment đo của fgOS (2026-11-13 03:35Z).
- **Lớp nghiệp vụ mới nằm ở lớp vai trò, không ở preset.** Đã có trên main và có test: vai trò trường theo type, lớp vòng
  đời, `amends`, mã định danh (`id`, R16), đơn vị dưới note có mã (điều khoản, hàng bảng), mã viết trần thành cạnh
  (`mentions`, R17), tập hiệu lực (`in_force`, cả ở mức đơn vị), `stale-citation`, `implicit-replacement`. Kho mẫu là
  kho chính sách nội bộ hư cấu `roles-probe`. Preset và `schema-gap` mới là **bản thảo** (`docs/presets.md`).
- **Có công cụ cho agent:** tám view SQL có phiên bản (`v_note` … `v_issue`), `pkm schema --json`,
  `pkm doctor --draft DIR` để thử thiết lập ngoài vault, tám playbook tiếng Anh, skill `pkm`, và `mcp install` theo từng
  vault cho Claude Code, Codex và Antigravity. fgOS dùng lại được view, `setup`, `audit` và playbook; không nên dùng
  `mcp install` hay sink `notes` trên cây tài liệu của mình.
- **Giấy phép không đổi:** đóng, cấp riêng cho fgOS (`LICENSE`, mục "Grant to fgOS"). Phần mới là danh sách giấy phép
  bên thứ ba sinh lúc phát hành (`pkm licenses`, `pkm_cli::third_party_json()`). fgOS phải mang thông báo đó trong bản
  phát hành của mình.

## 1. pkm hiện là gì (v0.3.0 và main `00c1473`)

| Thành phần | Vai trò | Ghi chú |
|---|---|---|
| `pkm-vault` | đọc vault: chỉ file thường, frontmatter như PyYAML, cây span Markdown, giải link, vault-watcher (`notify`), một cửa đọc an toàn `read(vault, rel)` | không SQLite, không mạng (`AGENTS.md`) |
| `pkm-lang` | gói ngôn ngữ `vi`, `de`, lexicon của vault (`## Bỏ`) | chuyển từ fork OHS; giấy phép theo pkm (DECISIONS "Giấy phép của gói ngôn ngữ…") |
| `pkm-embed` | trait `Embedder`, ONNX Runtime (`ort =2.0.0-rc.15`), embedder giả cho test | ORT liên kết tĩnh theo nền tảng; Windows dùng ORT tự dựng với CRT tĩnh |
| `pkm-search` | `search.db` (FTS5 + sqlite-vec), chunker trên cây span, worker index, các nhánh tìm, RRF, rescore, đoạn trích, neo | không phụ thuộc `pkm-core` |
| `pkm-core` | schema, index graph (`graph.db`), truy vấn, tool, `service::Session`, `structure` (profile, locate, eval, overview, audit), `search` (feature, tắt mặc định), `writes`, `setup`, `spec`, `playbooks`, `words`/`ui_words` | API ổn định theo semver liệt kê ở `docs/embedding.md` mục "Mặt API ổn định" |
| `pkm-mcp` | MCP stdio (JSON-RPC tự viết), `Builder` | 16 tool: `find`, `search`, `locate`, `note`, `read`, `neighbors`, `reach`, `paths`, `loops`, `provenance`, `select`, `valid`, `in_force`, `unit`, `related`, `more` (snapshot `tools/parity/golden/kg-solo/mcp/tools_list.json`); v0.2.1 chưa có `in_force` và `unit` |
| `pkm-cli` | CLI chức năng `pkm_cli::main` | lệnh trên vault, `index …`, `search`, `schema`, `licenses`, `help --json`, `paths` |
| `pkm-lifecycle` | `mcp install`, `doctor` (`--fix`, `--draft`), `version`, `Product`, tải model | chỉ crate này tải model |
| `apps/pkm` | bin `pkm` | bật `search` |
| `examples/embed-core`, `embed-mcp`, `embed-cli` | ba cách nhúng trực tiếp (a), (b), (c) | build và test trong cổng kiểm |
| `tools/parity`, `tools/search-eval`, `tools/licenses` | snapshot đầu ra, cổng chất lượng G4 so với mốc OHS, sinh `third-party.json` | |

- **Các cửa dùng:** thư viện Rust (sáu cách tích hợp ở README mục "Tích hợp"); CLI `pkm` in JSON; MCP stdio; skill `pkm`
  cộng tám playbook nhúng trong binary (`pkm_core::playbooks`); view SQL chỉ đọc trên `graph.db`.
- **Cách cài:** `cargo install --git … --tag v0.3.0 --locked pkm`. Repo private nên cần quyền đọc (`gh auth setup-git`,
  hay `PKM_READ_TOKEN` trong CI). `pkm mcp install VAULT` ghi cấu hình agent host **vào trong vault** (`.mcp.json`,
  `.codex/config.toml`, `.agents/mcp_config.json`), cài skill vào `VAULT/.claude/skills/pkm/` và
  `VAULT/.agents/skills/pkm/`, tải model và làm ấm index (`be5ca2a`). Claude Desktop vẫn là một mục cho một vault.
- **Dữ liệu ngoài vault:** `<pkm_dir>` (đổi được bằng `PKM_HOME`, `88b7dfe`) giữ `search/<sha1>/search.db`, `models/`,
  index của `doctor`. Index graph mặc định của CLI vẫn là `VAULT/.kg/graph.db`; đây là câu hỏi plan
  `261115-2230-…` còn chờ chủ dự án quyết.
- **Quy trình repo:** mỗi thay đổi hành vi cần unit test, e2e trên vault bịa và tài liệu tiếng Việt (`AGENTS.md`).
  Trước khi tag phải chạy `pkm-test` và `pkm-eval` trên Windows x64 và macOS arm64 ở repo công khai `vantt/pkm-release`.
  Bản thân repo pkm cũng dùng plan board của fgOS (`plans/board.md`, `32effb3`).

## 2. Thay đổi từ v0.2.1, theo chủ đề

Commit `v0.2.1..v0.3.0` vào tag 0.3.0. Commit sau `3eb5842` ở trên main và sẽ vào 0.4.0.

### 2.1. Cấu trúc, profile, locate, auditor

| Thay đổi | Commit / mục DECISIONS | Bản |
|---|---|---|
| `section` của locate không còn dấu `#` (trước đây trộn hai dạng) | `09549a7`; MCP-CHANGELOG "0.3.0: section của locate không còn dấu `#`" | 0.3.0 |
| Bộ quan sát đổi tên thành auditor: lệnh `audit`, khoá profile `audit`, `Session::audit()`, không giữ bí danh | `360a7f6`; "Bộ quan sát đổi tên thành auditor" | 0.3.0 |
| Locate đọc section từ neo có kiểu `HitAnchor::heading_path` của pkm-search | `fcc26c1`; "Kết quả tìm của `pkm_core::search` có kiểu" | 0.3.0 |
| Khối `search` của profile (`language`, `lexicon`), không tính vào digest | `bd74df0`; "Khối `search` trong profile" | 0.3.0 |
| `audit` thêm `stale-citation` (`--as-of`) | `afa8033`, `b393288` | 0.3.0 |
| `audit` thêm `implicit-replacement` (vector note, ngưỡng `audit.implicit`, mặc định 0,93 và 50 cặp) | `79bf41b` | main |
| Thư mục có vai trò riêng khai qua profile: `vault.system`, `vault.proposals` (bắt buộc khai thì mới ghi đề xuất), `propose.ideas/people/drafts`; sink mặc định là `jsonl`; `pairs --out`, `zones --out --page` | `9c67fa3`; "Thư mục có vai trò riêng khai qua profile" | main |
| `vault.writes: none` kiểm trong `pkm-core` (`WriteGuard`), chặn cả index mặc định trong vault | `7ae999e`; "`vault.writes: none` kiểm trong `pkm-core`" | main |
| `vault.gate: [R…]` làm luật dữ liệu thành `fail` trong `doctor` | `7f90045` | main |
| Chữ pkm ghi vào vault theo `vault.lang` (`vi`, `en`) | `decc98b`; "Bảng lời; chữ pkm ghi vào vault…" | main |

### 2.2. Tìm kiếm: OHS chuyển sang Rust

- **Quyết định:** DECISIONS "Chuyển OHS sang Rust: tìm kiếm chạy trong binary `pkm`, bỏ Node" (2026-11-13). Thiết kế và
  bảng kê ở `docs/ohs-rust-port.md`; plan `261113-0800-ohs-rust-port` đã `completed`. Các commit chính: `4924d64`
  (`pkm-vault`), `9ac5812`, `fd091e1`, `6b42a3e` (`pkm-lang`), `0b86ac4` (embedder ORT), `9cd7f2f`…`6fc3a40` (DB, keeper,
  worker), `600302f`, `7cac879`, `e62683e` (truy vấn), `c49aac2`, `be557d8`, `d7daa56` (nối vào `pkm-core`, CLI, MCP,
  lifecycle), `4031d49` (gỡ client OHS).
- **Còn cần Node không:** không. Feature `search` của `pkm-core` tắt mặc định; bật thì kéo `pkm-search`, `pkm-embed`,
  `ort`. Có cổng kiểm: `cargo tree -p pkm-cli --no-default-features -e normal` không được chứa `ort`.
- **Worker index:** mỗi vault một worker ghi duy nhất, chọn bằng `writer.lock`; phiên dùng index giữ `clients.lock`
  chia sẻ. Worker chạy khi cần và tự thoát sau `worker_idle` (mặc định 10 phút); không có daemon (DECISIONS "Vòng đời
  worker index…", "Tìm kiếm Rust: DB riêng mỗi vault…"). Có thể chạy worker dạng tiến trình bằng
  `search::run_worker(vault, &opts, detach)` hay lệnh ẩn `pkm VAULT search-worker`.
- **Phục vụ khi chưa xong index:** trạng thái `indexing` vẫn trả lời kèm `index_state`. Thiếu model thì chỉ trả nhánh
  chữ kèm `partial: true`. Lỗi đổi tên thành `pkm_not_ready` và `pkm_search_error` (MCP-CHANGELOG "0.3.0: tìm kiếm chạy
  trong `pkm`").
- **Chất lượng (cổng G4):** linux-x64 có nDCG@5 bằng mốc OHS 0.17.2-vantt.8 trên bốn corpus và không mất câu nào ở top
  5 hay top 10. Bộ section dài bịa đạt 32/33, bằng OHS. Windows và macOS đạt mọi cổng ở run 43664495140 (DECISIONS
  "Cổng G4 trên win32-x64 và darwin-arm64: đạt").
- **Phần không chuyển:** CLI `ohs`, HTTP, daemon, rerank, GPU, nhúng qua API (để sau, G7). Cờ cũ (`--ohs*`,
  `PKM_OHS_DIR`, `PKM_NO_OHS`) thoát 2 kèm gợi ý cài lại; cờ mới là `--search-db`, `--model-dir`, `--search-wait`,
  `--no-search`, `PKM_NO_SEARCH`, `PKM_HOME`.
- **Sau 0.3.0:** note CRLF vào index như note LF (`search.db` v3, `1f61d47`); lexicon của profile tới được worker (sửa
  lỗi, `586ffe0`); ghi đúng lúc worker chết (`724b24a`); lệnh `pkm VAULT index [build|sync|stop|reset]`, còn
  `pkm VAULT search "câu"` là lệnh tìm (`ec54555`, đổi phá vỡ).

### 2.3. API nhúng (đổi phá vỡ)

| Trước (v0.2.1) | Sau (v0.3.0) | Nguồn |
|---|---|---|
| `SessionConfig.ohs: OhsOptions { mode, db, language_pack, model, fallback_dir }` | `SessionConfig.search: SearchOptions { enabled, db, model_dir, language, threads, worker, worker_idle, search_wait, max_note_bytes, embedder }` | DECISIONS "API tìm kiếm của `pkm-core` thay `OhsOptions`" |
| `launch_ohs`, `probe_ohs`, `Session::{ohs_state, ohs_pid}` | `Search::{open, state, wait_ready, query, note_vectors, sync, close}`, `search::{probe, run_worker, stop_worker, reset_worker, db_path, model_root, cache_report}`, `Session::{search, search_state, search_sync}` | `docs/embedding.md` mục 2 |
| JSON kiểu OHS | `Hits { items: Vec<Hit>, partial, index_state }`, `Hit { path, title, score, scores, snippet, matched_terms, anchors: Vec<HitAnchor>, primary }` | "Kết quả tìm … có kiểu" |
| `pkm-lifecycle` `InstallOptions {ohs_package, no_ohs, ohs}`, `host` | `{no_search, no_warm, model_source, remove_ohs_data, hosts: Vec<Host>}`; `DoctorOptions {deep, search_wait, vault, draft}` | "Cờ, biến và API vòng đời…", `be5ca2a`, `7f90045` |

Trên main (0.4.0) còn các đổi phá vỡ sau:

- `Profile` thêm `pack_files`, `paths`, `lang`, `gate`, `implicit`; `Roles` và `RoleSpec` thêm `id`, `id_scope`,
  `group`, `amends`, `version`.
- `IndexError::Denied`; các hàm ghi nhận `&WriteGuard`.
- Đã bỏ hằng `propose::QUEUE`; chữ ký nhận thêm `&Paths` và `Lang`.
- `chrono` thay bằng `jiff` (`ea04715`).
- Văn xuôi trong kết quả tool chuyển sang tiếng Anh, trừ khi tiến trình chọn `vi` (`d5babb0`).

Mặt API ổn định có thêm `writes::{WriteGuard, WriteDenied}`.

### 2.4. Ngôn ngữ và i18n

- **Bảng lời ghi vào vault** `pkm_core::words` (`Lang::{Vi, En}`): note đề xuất và trang gợi ý theo `vault.lang`, rồi
  `search.language`, rồi tiếng Anh. Mã máy đọc giữ nguyên, kể cả `status: chờ` (`decc98b`).
- **Ngôn ngữ giao diện:** mặc định tiếng Anh; chọn bằng `--lang`, rồi `PKM_LANG`, rồi locale (`1b056ed`, `0758619`,
  `ebaa6e3`). Lõi tra chữ theo khoá ngay ở chỗ sinh (`ui_words`); chi tiết luật trong view theo ngôn ngữ lúc dựng
  index (meta `lang`). Test `ui_text_coverage.rs` chặn câu tiếng Việt lọt ra ngoài bảng (`d5babb0`).
- **Còn mở:** lời lỗi của `pkm-vault` ngoài R0 vẫn bằng tiếng Việt (plan `261115-2230-…` phase 7).

### 2.5. Span và view

- **Span:** cây span Markdown (`be250cc`, `374c830`). Bảng `spans`, `files`; link mang `src_span` và `dst_span`, giải
  đoạn `#H1#H2` và `#^id` theo chữ heading như Obsidian. View hợp đồng cho pkm-search là `note_view`, `span_view`,
  `graph_views` (DECISIONS "Đồ thị là index-keeper; span và view công bố"; `docs/spans.md`).
- **Tám view cho agent, phiên bản 1:** `v_note` (có `class`), `v_field`, `v_span`, `v_link`, `v_edge`, `v_unit`,
  `v_mention`, `v_issue`, liệt kê ở `agent_views` (`9296ca6`; `docs/agent-views.md`). Thêm cột ở cuối không tăng phiên
  bản; đổi nghĩa thì tăng. Giới hạn: `v_issue` cần hàm `regexp()` của pkm; index không giữ thân note.

### 2.6. Vai trò schema và vòng đời

Plan `261114-1800-roles-units` và `261115-0010-…` đều đã xong. Thiết kế ở `docs/schema-roles.md`. Phần đầu file vẫn ghi
"đề xuất, chưa làm", nhưng mục 12 ghi các bước đã xong; trong báo cáo này coi là đã làm.

| Bước | Nội dung | Commit |
|---|---|---|
| 1 | tool và lệnh `in_force` (tập hiệu lực tại một ngày, lọc một thuộc tính, `ended`, `excluded`) | `c090510` |
| 2 | `roles:` theo type (`lifecycle`, `valid_from`, `valid_to`, `replaced_by`, `asserted_at`, `source`, `edge`); `vault.pack_files` cho schema riêng của vault | `080a9aa` |
| 3 | lớp vòng đời (`draft`, `rejected`, `live`, `deprecated`, `replaced`, `retracted`), `lifecycle_classes`, cạnh `amends`, schema v5 | `927896d` |
| 4 | đơn vị dưới note (`units`), mã trần (`mentions`, `mention_rels`), vai trò `id` và `id_scope`, R16, R17, `stale-citation` mức note và đơn vị, tool `unit` | `3324460`, `d0c9511`, `6edb5e0`, `afa8033`, `d5da6c6`, `e718228`, `b393288` |
| sau 0.3.0 | `in_force units: true`; vai trò `group`; `implicit-replacement` | `449b689`, `79bf41b` |

### 2.7. Preset, gói, playbook, skill

- **Preset:** `docs/presets.md` là **bản thảo**, chưa có plan. Đã chốt bốn điều (preset nằm trong repo dạng dữ liệu; tên
  máy đọc tiếng Anh; chỉ chuẩn hoá cái đo được; schema mọc qua đề xuất `schema-gap`). Chưa có
  `profile init --preset`, chưa có thư mục `presets/`. Ứng viên đầu: `ca-nhan`, `van-ban-noi-bo`.
- **Gói nhúng:** vẫn là `business` và `capture`. Các gói này có từ trước v0.2.1; sau đó chỉ sửa mô tả bị cắt và mở
  `amends` (`fef7a78`, `927896d`).
- **`pkm schema [profile|pack] [--json]`:** in đặc tả sinh từ chính bộ đọc, dạng JSON Schema 2020-12. Khoá lạ trong gói
  thành R14 (`fef7a78`).
- **Tám playbook tiếng Anh nhúng trong binary** (`ea6d18b`). Mỗi playbook có phần When, Probe (SQL trên view), Setup,
  Try (`doctor --draft`), Confirm, Pitfalls. 15 câu dò chạy trong test (`crates/pkm-core/tests/playbooks.rs`); phép thử
  agent đúng 4/4 (`e2716a6`).
- **Skill `skills/pkm/SKILL.md`:** vòng làm việc mỏng. Hỏi use case, chọn playbook, dò, viết nháp ngoài vault,
  `doctor --draft`, trình người dùng, rồi mới ghi vào `.pkm/`.

### 2.8. `doctor --draft`, cài theo vault, đóng gói

- **`doctor` khi biết vault:** dựng index riêng trong thư mục dữ liệu, đếm lỗi theo luật (`rules.Rxx` mức `warn`; luật
  trong `gate` thì `fail`). `--draft DIR` dựng index cho thiết lập hiện tại và cho bản nháp, trả `data.diff`
  (`issues_new`, `issues_gone`, `units`, `codes`, `in_force`, `facets`) và `data.index`; không chạm vault. Phần tính
  nằm ở `pkm_core::setup` (`7f90045`).
- **`doctor --fix`** (`e85ab2b`); `pkm paths` (`953dfd5`); lỗi có ba dòng error/why/fix (`2c935ad`);
  `pkm help --json` (`01c4419`).
- **`mcp install` theo vault cho bốn host, kèm skill** (`be5ca2a`). Việc thử tay trên Codex và Antigravity thật còn chờ.
- **Giấy phép bên thứ ba:** `tools/licenses` sinh `crates/pkm-cli/data/third-party.json` (khoảng 1,6 MB) lúc phát
  hành; có `pkm licenses [--json] [--full]` và `pkm_cli::third_party_json()` (`70cbf26`). Trước khi tag phải kiểm tay 5
  crate không kèm file giấy phép và thông báo của ONNX Runtime.

## 3. Ứng dụng nghiệp vụ mức cao (trọng tâm)

Cơ chế chung: lõi chỉ hiểu **vai trò**, không hiểu miền (N-R1 trong `docs/schema-roles.md`). Bên dùng khai type, trường
và vai trò trong file gói (`vault.pack_files`), rồi hỏi qua tool, CLI hay view.

| Năng lực | Giải bài toán gì | Người hay agent dùng thế nào | Ví dụ trong repo | Độ chín |
|---|---|---|---|---|
| **Kho chính sách** (playbook `setup-policy-vault`) | quy định có mã, ngày hiệu lực, bị thay hay sửa một phần; hỏi "ngày X áp dụng gì" | agent theo playbook: dò `v_field`, `v_note`, `v_mention`; viết gói có `roles`, `lifecycle_classes`, `units`, `mentions`; thử bằng `doctor --draft`; xác nhận bằng `in_force`, `unit` | `playbooks/setup-policy-vault.md` (gói `policy_vault` hư cấu); kho đo `crates/pkm-core/tests/roles-probe/` gồm Chính sách, Quy chế, Bản tin, Hướng dẫn | đã ship trên main, có test, có tài liệu; chưa có trong tag |
| **Kho tài liệu theo vùng** (`setup-docs-by-area`) | người viết tạo bản sao thay vì viết thêm | facet `locating` đọc từ đường dẫn, `home`, `writes: none`; `locate`, `profile check` | `playbooks/setup-docs-by-area.md` | đã ship (cơ chế từ 0.2.x) |
| **Tập hiệu lực theo thời gian** (`in_force`, `valid --as-of`) | bảng giá, hợp đồng, quy trình nào đang áp dụng tại một ngày | tool hay lệnh `in_force <type> --as-of D [--where k=v] [units: true]`; `valid` có từ trước, chỉ xét ngày | `roles_probe.rs` (`in_force_filters_one_property_and_names_the_replacement`), `units_probe.rs` | `in_force` có trong 0.3.0; mức đơn vị chỉ có trên main |
| **Chuỗi thay thế và sửa một phần** (`replaced_by`, `amends`, `version`) | biết cái gì thay cái gì, từ khi nào; sửa một điều mà cả hai vẫn còn hiệu lực | khai vai trò; `in_force` trả `amended_by`, `ended`, `replaced_by`; R12 bắt chuỗi hỏng | `roles_probe.rs` `partial_amendment_keeps_both_in_force` | 0.3.0 |
| **Mã định danh và trùng mã** (`id`, `id_scope`, R16) | hai văn bản cùng mang một mã | `roles: {id: code, id_scope: type|vault|holder}`; `validate --rule R16` | `roles_ids.rs`, `cli_ids_and_citations.rs` | 0.3.0 |
| **Đơn vị dưới note** (`units`, tool `unit`) | nhiều quyết định trong một note (bullet hay hàng bảng có mã) | mẫu regex theo `list_item` hay `table_row` và `column`; `pkm VAULT unit R-03` | `units_probe.rs` (`QĐ-01` trong Quy chế) | 0.3.0 |
| **Mã viết trần thành cạnh** (`mentions`, R17) | văn bản trích "POL-002" bằng chữ, không có link | `mentions` regex, `mention_rels` (`thay QĐ-01` thành `replaces`); R17 cho mã thiếu hay mơ hồ; playbook `fix-bare-codes` | `units_probe.rs` `bare_codes_resolve_to_units_or_are_marked` | 0.3.0 |
| **Trích dẫn trôi** (`stale-citation`) | note còn hiệu lực vẫn trích bản đã bị thay | `pkm VAULT audit --as-of D`; playbook `fix-stale-citations`; sink `jsonl` hay `notes` | `roles_probe.rs` `citing_a_replaced_policy_is_caught_by_audit` | 0.3.0, chỉ cảnh báo, không là luật |
| **Thay ngầm** (`implicit-replacement`, vai trò `group`) | bản mới gần nghĩa bản cũ cùng nhóm mà không khai quan hệ | `audit` khi tìm kiếm `ready`; ngưỡng `audit.implicit.min`; playbook `review-implicit-replacements`, `tune-implicit-threshold`; máy không kết luận | `cli_implicit.rs`; cặp đo Công tác phí 2025/2026 có cosine 0,957 | chỉ trên main |
| **Provenance** | nguồn của một claim | tool `provenance` (có từ trước v0.2.1); vai trò `source` (R13) | snapshot kg-solo | ổn định, không đổi nhiều |
| **Claim, quyết định, người, tổ chức** (gói `business`) | ai làm ở đâu, ai là đầu mối tại ngày Y; quyết định trong cuộc họp nào | type `organization`, `document`, `contract`, `meeting`, `decision`; cạnh `client`, `party`, `decided_in`, `affects`; dữ kiện có thời hạn `works_at`, `contact_for` ghi dạng claim có cửa sổ | `crates/pkm-core/src/schema/schema.yaml` (`packs.business`), fixture kg-solo | có từ trước v0.2.1; sau đó chỉ mở `amends` |
| **Câu hỏi có cấu trúc bằng SQL** | agent hỏi sự thật mà không cần lệnh `query` | `sqlite3 -readonly` trên `v_*`; ví dụ "bác sĩ của tôi làm ở đâu" qua `v_edge` | `docs/agent-views.md` mục 3 | chỉ trên main |
| **Thử thiết lập an toàn** (`doctor --draft`, `vault.gate`) | thay đổi cấu trúc mà không phá vault | viết nháp ngoài vault, rồi đọc `data.diff` | `apps/pkm/tests/doctor_data.rs` | chỉ trên main |
| **Preset, `schema-gap`, gói nền chung** | khách hàng không tự nghĩ ra schema; agent đặt tên cạnh tràn lan (365 role, 362 dùng một lần, đo trên fgOS) | mới phác `profile init --preset`; tín hiệu `schema-gap` | `docs/presets.md` | **chỉ có bản thảo** |

Nhận xét (**suy ra**): mọi bước của luồng "quản trị văn bản có hiệu lực" đều đã có trên main: khai, đo, tập hiệu lực,
trích dẫn trôi, thay ngầm, đề xuất vào hàng chờ. Đây là năng lực nghiệp vụ dùng được ngay cho chính sách, SOP, bảng giá,
hợp đồng và macro hỗ trợ. Phần "tự cấu trúc cho khách" (preset, `schema-gap`) chưa có mã.

## 4. Trạng thái các yêu cầu của fgOS

| Yêu cầu | Trạng thái | Bằng chứng |
|---|---|---|
| R1 khai cấu trúc | **một phần** | facet `locating` với danh sách đóng, `home`, `target`, bốn nguồn (0.2.x); `pkm schema` cho đặc tả máy đọc được (`fef7a78`). Facet `narrowing`, register dáng SKOS, cấp con `broader`/`narrower` và phiên bản profile để note ghi vẫn hoãn (`docs/structure.md` mục 10, `docs/architecture/10-no-va-viec-mo.md` mục 10.4) |
| R2 xếp chỗ mọi note | **một phần** | S1, S2 trong `validate` và `profile check`; `doctor` thêm `rules.*` và `vault.gate` (`7f90045`). Phần "giá trị narrowing không giải được" chưa có vì phụ thuộc R1 |
| R3 note không có YAML | **xong** | nguồn `header`, type mặc định theo đường dẫn (0.2.0); YAML hỏng là R0 và các note khác vẫn được index |
| R4 link Markdown thành cạnh | **xong, còn khoảng trống** | `body_edges` (0.2.1); span giải `#H1#H2` theo chữ heading (`374c830`). **Suy ra:** anchor dạng slug của GitHub như `#61-the-check-command` không khớp chữ heading (`pkm-vault/src/md.rs`, `Frag::find` so chữ hay so không phân biệt hoa thường), nên cạnh vẫn tới note nhưng `dst_span` để NULL |
| R5 locate | **xong** | `Session::locate`, CLI, MCP; `exclude`, `expect: []`, `--jsonl`, `index`, `region` có tên (0.2.1); section lấy từ neo của pkm-search (`fcc26c1`) |
| R6 tổng quan | **một phần** | `overview`: số note, cỡ, tỉ lệ, note mồ côi, note chưa xếp, cặp gần nghĩa qua vùng. Chưa có "tên chưa giải lặp lại" (ứng viên register) |
| R7 đề xuất vào sink | **một phần, mở rộng sang hướng khác** | `audit`: `split-value`, `near-pairs`, thêm `stale-citation`, `implicit-replacement`; sink `jsonl`/`notes`, khoá ổn định. `new-sub-value`, `move-note`, `retire-value`, `register entry` vẫn hoãn |
| R8 thư viện trước | **xong** | bốn thư viện (nay là tám crate); API ổn định theo semver; tìm kiếm chạy trong tiến trình, không cần client OHS |
| R9 chỉ đọc | **xong trên main, chưa có trong tag** | `WriteGuard` trong lõi (`7ae999e`): chặn index mặc định, note đề xuất, `--out` trỏ vào vault. Còn hở: `SearchOptions::db` trỏ vào vault chưa bị chặn (mục 10.1 của file nợ). Lớp cài đặt (`mcp install`, `doctor --fix`) cố ý không bị ràng buộc |
| R10 nhúng: cấu hình có kiểu, không đọc env | **xong nhưng đổi hình** | `SearchOptions` có kiểu; lõi chỉ đọc env qua `pkm_core::env` khi vỏ gọi. Ngoại lệ: `PKM_HOME` và quy ước hệ điều hành khi `db`/`model_dir` để `None`, nên fgOS cần truyền đường dẫn tường minh |
| R10 không in ra stdout | **gần xong** | `log_sink`; còn `eprintln!` trong `search::engine` (`run_worker`, `vault_configs`) theo mục 10.1 của file nợ; đây là stderr, không phải stdout |
| R10 vòng đời OHS | **thay bằng worker** | không còn tiến trình Node; worker luồng hay tiến trình với giao thức khoá; `Session::close` xin worker luồng dừng. `PR_SET_PDEATHSIG` của OHS không còn liên quan |
| R10 API semver nhỏ | **xong, nhưng vẫn phá vỡ theo bản phụ** | danh sách ở `docs/embedding.md`; 0.3.0 và 0.4.0 đều phá vỡ có chủ ý, ghi trong DECISIONS |
| Issue: định dạng heading | **xong** | `09549a7` (2026-11-13, có trong v0.3.0); section luôn chỉ là chữ heading; Rust search cũng trả chữ trần (`heading_text`, `locate.rs`) |
| Issue: section trong tài liệu dài, `explain` nêu chunk | **chưa làm** | `explain` chỉ thêm `found_by`, `section_by` (`search`/`words`), `scores`, `facets` (`locate.rs` khoảng dòng 440); không có heading hay dải ký tự của chunk. `HitAnchor` có `char_start` nhưng không xuất ra. Top-k section mỗi note vẫn hoãn với cùng tiêu chí (mục 10.4). pkm chưa đo lại trên kho fgOS sau khi chuyển sang Rust |
| Issue: CLI không chọn được DB của OHS | **xong, do kiến trúc đổi** | không còn DB chung với server `ohs`; mặc định `<pkm_dir>/search/<sha1>/search.db` riêng cho mỗi vault; có cờ `--search-db` (DECISIONS "Tìm kiếm Rust: DB riêng mỗi vault…", `d7daa56`) |
| Trả lời trên issue #1 | **không có** | comment cuối là của fgOS (2026-11-13T03:35Z); issue vẫn `OPEN` |

## 5. Ý nghĩa cho fgOS

### 5.1. Tích hợp

- **Ghim tag nào.** Hiện fgOS chưa khai `pkm-core` ở đâu (`git grep` không thấy trong `*.toml`, `*.rs`), nên chưa có gì
  phải chuyển. Đề nghị (**suy ra**): ghim `v0.4.0` khi pkm tag, vì 0.4.0 mang `WriteGuard` trong lõi (R9), API
  `Profile` và `Paths` mới, lệnh `index` mới. Ghim `v0.3.0` thì phải chuyển API thêm một lần nữa ngay sau đó. Trong
  lúc chờ có thể thử nguyên mẫu bằng `rev = "00c1473"`, nhưng quyết định 8.2 của fgOS nói ghim theo tag.
- **Cách gọi.** `Session::open(SessionConfig { db: Some(<.fgos/runtime/…/graph.db>), profile: Some(<profile ngoài cây
  tài liệu>), search: SearchOptions { db: Some(…), model_dir: Some(…), worker: Thread | Process(..), .. }, log_sink, ..
  })`, rồi `locate(&Request)`, `locate_eval`, `overview`, `audit_on`/`audit_with_notes`, `check_profile`, `search_state`,
  `close`. Dựng index không qua phiên thì dùng `pkm_core::setup` và `structure::*`.
- **Ai chạy worker.** Mặc định `External` hợp với agent trong sandbox chỉ đọc. Phía host fgOS phải có đúng một worker
  cho mỗi vault. Có hai cách: `Thread` trong tiến trình `fgos` (model khoảng 130 MB nằm trong tiến trình, RSS đo được
  400–650 MB) hoặc `Process` với một lệnh worker của fgOS gọi `search::run_worker`. Đây là quyết định thiết kế của fgOS,
  có quan hệ với supervisor và quy tắc về tiến trình mồ côi.
- **Model và đóng gói.** Model e5 ghim commit và sha256, tải bằng `pkm_lifecycle::install::model::ensure` (nguồn
  HuggingFace qua `curl`, nguồn URL, hay thư mục offline). Theo cổng install/setup/doctor của `AGENTS.md`, đây là phụ
  thuộc runtime mới và cần dòng readiness trong doctor (**suy ra**). ONNX Runtime liên kết tĩnh và thêm khoảng 18–24 MB
  vào binary. Bản Windows cần ORT tự dựng với CRT tĩnh (`ORT_LIB_LOCATION`, workflow `ort-build-win` của
  `vantt/pkm-release`), và darwin-x64 nạp động. Bản phát hành của fgOS phải theo cùng cách (DECISIONS "ONNX Runtime cho
  tìm kiếm Rust: liên kết theo nền tảng"). Không bật feature `search` thì không kéo ORT, nhưng locate cũng không chạy.
- **Ràng buộc khi link.** `rusqlite` 0.41 bundled (một SQLite trong một binary); toolchain Rust 1.99, edition 2024;
  `serde_json/arbitrary_precision` đã được test.
- **Giấy phép.** Giữ thông báo "Grant to fgOS" và không bán pkm tách khỏi fgOS. Mang danh sách bên thứ ba
  (`pkm_cli::third_party_json()`) vào bản phát hành fgOS. Repo private nên CI của fgOS cần `PKM_READ_TOKEN`.
- **Việc fgOS phải sửa ở spec của mình** (**suy ra**): mục 8.2 của document-identity (OHS là Node ngoài, "pkm khởi động
  OHS làm tiến trình con", dòng readiness cho OHS), cách đánh chỉ số OHS, cách fallback khi "OHS vắng". Bây giờ trạng
  thái cần báo là năm trạng thái của `SearchState` cộng với tình trạng model.

### 5.2. Thiết kế tài liệu của chính fgOS: dùng lại gì, chỗ nào xung đột

| Năng lực pkm | fgOS dùng lại thay vì tự xây | Ghi chú |
|---|---|---|
| `audit` sink `jsonl` (khoá ổn định) | đúng vai bộ quan sát của fgOS: dòng JSON thành work item | sink `notes` ghi vào vault nên fgOS không dùng; với 0.4.0, không khai `vault.proposals` thì sink mặc định là `jsonl` |
| `in_force`, `valid --as-of`, lớp vòng đời, `amends`, `id`+R16, `units`, `mentions`+R17, `stale-citation`, `implicit-replacement` | ca đặt bài của pkm chính là luật và quyết định của fgOS (`docs/schema-roles.md` mục 1, 8: `D-ADR\d{4}`, `RUL\d+`, khoá (holder, id)); fgOS có 150 rule trong 73 tài liệu, khoá (holder, id) (spec 6.1) | pkm không chọn nguồn thay fgOS: (a) note Markdown là nguồn, hay (b) note chiếu từ `.fgos/events.jsonl` (`schema-roles.md` mục 8) |
| Tám view `v_*` có phiên bản | doc-health hay doc-checks hỏi bằng SQL thay vì tự quét | cần `regexp()` của pkm cho `v_issue`; mở bằng kết nối của pkm |
| `doctor --draft` / `pkm_core::setup` | thử đổi profile hay gói trước khi đưa vào | index nháp nằm trong thư mục dữ liệu của pkm; fgOS nên truyền đường dẫn vào `.fgos/runtime/` |
| `pkm schema --json` | kiểm profile và gói của fgOS trong `npm test` hay CI | |
| Playbook, skill | agent của fgOS đọc theo; playbook `setup-docs-by-area` khớp kho `docs/<area>/` | chép skill vào kho fgOS phải qua cửa ghi của fgOS, không qua `mcp install` |
| `vault.gate` | biến luật dữ liệu thành chặn | trùng vai với doc-health; cần chọn một chủ cho mỗi luật (design principle 7) |

Chỗ xung đột với thiết kế fgOS đã ký:

- **pkm ghi vào vault.** `mcp install` ghi `.mcp.json`, `.codex/`, `.agents/`, `.claude/skills/pkm/` vào trong vault,
  và `writes: none` cố ý không chặn lớp cài đặt (DECISIONS "`vault.writes: none` kiểm trong `pkm-core`"). fgOS không
  được gọi `pkm_lifecycle::install::run` trên cây của mình; dùng `install::model` riêng thì được.
- **Index mặc định nằm trong vault** (`VAULT/.kg/graph.db`). Với `writes: none`, lõi 0.4.0 từ chối thay vì ghi, nên
  fgOS phải truyền `db`, và đã định làm vậy. `search.db` trỏ vào vault vẫn chưa bị chặn.
- **Profile mặc định ở `VAULT/.pkm/profile.yaml`.** fgOS có thể truyền `SessionConfig::profile` trỏ ra ngoài cây.
  `vault.pack_files` tính từ thư mục của profile, nên gói đi cùng chỗ profile.
- **Lớp profile core → domain → project** (spec 6 của fgOS) chưa có. `extends` của profile hoãn tới khi "fgOS có
  instance project thứ hai" (mục 10.4). Gói ghép trùng tên còn ghi đè im lặng (mục 10.2).
- **Tăng điểm theo identifier** (8.1 bước 4 của fgOS) chưa có ở pkm. Nhưng `mentions` và `units` cho phép khai các kind
  của fgOS (`cli-verb`, `rule`, `decision`) thành cạnh, nên một phần có thể đi qua cạnh thay vì qua điểm (**suy ra**).

### 5.3. Workflow nghiệp vụ fgOS chạy cho project khác (marketing, sales, support)

| Domain (spec 6.2–6.4) | Năng lực pkm khớp | Khoảng trống |
|---|---|---|
| Marketing (`campaign`, `channel`, `persona`, `asset`, `keyword`) | locate trước khi viết brief hay bài; `near-pairs` và `implicit-replacement` bắt bản sao của brief, landing page; vòng đời `deprecated`/`replaced` cho thông điệp cũ; `in_force` cho thông điệp đang dùng | kind không có mã dạng regex (persona, keyword) cần register, tức facet narrowing, mà phần này hoãn; chưa có preset marketing |
| Sales (`product`, `plan`, `competitor`, `deal-stage`, `objection`) | gói `business` (`organization`, `contract`, `document` có vòng đời, `works_at`/`contact_for` theo thời gian); bảng giá có hiệu lực theo ngày (`in_force`); SKU hay mã gói là `id` + `mentions`; `stale-citation` khi tài liệu bán hàng trích bảng giá đã bị thay | không có kết nối CRM (ngoài phạm vi pkm); `deal-stage` là trạng thái hoạt động, không phải vòng đời văn bản |
| Support (`ticket-category`, `macro`, `known-issue`, `sla`) | macro và SLA có phiên bản: `replaced_by`, `amends`, `in_force`; macro trích chính sách đã bị thay thì vào `stale-citation`; `units` cho bảng SLA mỗi hàng một mã; locate trước khi viết bài KB | không có kết nối helpdesk; `known-issue` trỏ `error-code` của coding cần cạnh liên domain do gói khai |

Khoảng trống chung (**suy ra** từ repo):

- Preset và `schema-gap` mới là bản thảo; gói nền chung (`person`, `organization`, …) chưa có.
- Ghép nhiều gói domain thì gặp lỗi ghi đè im lặng (mục 10.2); `group` chỉ một giá trị.
- Gói ngôn ngữ cho nhánh chữ chỉ có `vi` và `de`; kho tiếng Anh dùng nhánh vector cộng FTS chung, và kho fgOS bằng
  tiếng Anh đã đo tốt với thiết lập này.
- Độ chính xác của section trong tài liệu dài chưa đổi về bản chất: chunker chép đúng luật của OHS.
- Ba domain này vẫn là "bản nháp khởi đầu" trong spec của fgOS; pkm chưa có vault mẫu hay bộ gold cho chúng (PR1 của
  presets đòi phải có).

## 6. Việc còn mở và rủi ro

| Mục | Nguồn | Ảnh hưởng tới fgOS |
|---|---|---|
| 0.4.0 chưa tag; phase 5 chờ plan `261115-2230-…` (thử tay Codex, Antigravity; index mặc định của CLI; cách ghi nhận lỗi luật đã biết) và `261115-2140-packaging-followups` (hạn token CI) | `plans/board.md` | chưa có tag để ghim; plan có bước "báo momentell và fgOS trước khi tag" |
| Tên thư mục cứng còn lại `_ohs/**`, `templates/**`, `_ohs/lexicon.md` trong chọn file của tìm kiếm; đổi sẽ làm mọi vault dựng lại index tìm kiếm | file nợ mục 10.1 | có thể dựng lại index thêm một lần khi lên 0.4.0 |
| `eprintln!` trong `search::engine`; `SearchOptions::db` trong vault chưa bị chặn | file nợ mục 10.1 | R10, R9 chưa trọn |
| Gói ghi đè trùng tên im lặng; DDL `graph.db` không có phiên bản; `unit_state` chưa có phiên bản | file nợ mục 10.2 | rủi ro khi ghép gói domain |
| Test chập chờn trên Windows: bão sự kiện (`pkm-vault` watch, `worker_loop`), ngưỡng thời gian `worker_lifecycle`; giới hạn chặn treo ngoài Linux đã nâng lên 300 s | file nợ mục 10.2, 10.3; `4eb8e8b`, `1fcb779`, `23679f5`, `fbcec43` | fgOS phát hành Windows nên tự theo dõi |
| G4 trên Windows: các câu sát biên dao động theo CPU runner (model int8) | DECISIONS "Cổng G4 trên win32-x64 và darwin-arm64: đạt" | lặp lại locate eval của fgOS giữa các máy không trùng từng hạng |
| FTS5 `snippet()` tối đa 64 token (OHS là 75); thứ tự `fulltext` lệch ở 11/428 câu | DECISIONS "Đoạn trích, neo và explain…", "Mốc `fulltext`…" | nhỏ |
| Top-k section mỗi note, toạ độ theo section, facet narrowing, `profile extends`, đề xuất `new-sub-value` và các kiểu khác | file nợ mục 10.4 | đúng các phần fgOS đã ghi là hoãn |
| Đổi phá vỡ ở mỗi bản phụ 0.x (0.3.0, rồi 0.4.0) | `AGENTS.md`, DECISIONS | mỗi lần nâng tag cần chạy lại bộ regression ở mục 15 của fgOS |

## Câu hỏi còn mở

1. fgOS ghim `v0.4.0` (phải chờ tag), hay tạm dùng một `rev` của main để bắt đầu build step 3 ngay? Quyết định 8.2 của
   fgOS nói ghim theo tag.
2. Worker tìm kiếm của fgOS nên chạy `Thread` trong `fgos` hay `Process` dưới supervisor? Nhánh nào khớp với luật về
   tiến trình và vòng đời của host?
3. Nguồn luật và quyết định cho lớp vai trò của pkm là note Markdown (a) hay note chiếu từ `events.jsonl` (b)
   (`docs/schema-roles.md` mục 8)? Câu trả lời quyết định fgOS có dùng `in_force` và `stale-citation` thay cho phần
   "tính tập hiệu lực" còn thiếu của `tsk-1lv` hay không.
4. Có nên gửi pkm (trên issue #1) ba việc: `explain` nêu chunk (heading, dải ký tự) cạnh section pkm chọn; khớp anchor
   dạng slug GitHub thành span; đo lại section trên kho fgOS bằng v0.3.0 trở lên?
5. Trước khi `vault.gate` và `rules.*` của `doctor` trong pkm trùng với doc-health của fgOS: luật nào thuộc chủ nào?
6. Model tải qua `curl` lúc chạy hay đóng gói sẵn trong bản phát hành fgOS (dùng `ModelSource::Dir`)? Câu này đi kèm
   dòng readiness của doctor.
