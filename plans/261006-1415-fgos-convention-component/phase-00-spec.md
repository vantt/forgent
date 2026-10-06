# Phase 00 — Spec vùng `convention` (không code)

Trạng thái: pending · Ưu tiên: P1 trong plan · Công: 0.5-1d · Cổng: anh duyệt spec trước khi mở phase 01

## Bối cảnh

- [plan.md](plan.md) §Prior art; [synthesis](../reports/harness-investigation-261006-synthesis.md) §0, §0b, §5 (V5, V6, V16, V18), §7 H2, §8 mục 5.
- `AGENTS.md`: "a new product area gets a spec before it gets code"; "Prior art before design"; Install/setup/doctor gate.
- Kiến trúc: [component-boundary.md](../../docs/platform/component-boundary.md), [external-provider-protocol.md](../../docs/architect/host-invocation-routing/external-provider-protocol.md), [node-to-rust-component-migration.md](../../docs/architect/host-invocation-routing/node-to-rust-component-migration.md), [intent-preservation-ledger.md](../../docs/platform/host-invocation-routing/intent-preservation-ledger.md) (HI-I007, HI-I018, HI-I021, HI-I022), [distribution.md](../../docs/specs/distribution.md), [distribution-vision.md](../../docs/distribution-vision.md), [io-contract.md](../../docs/io-contract.md).
- Spec láng giềng làm mẫu văn phong: [observe.md](../../docs/specs/observe.md) (header `Document type / Ownership`, §Owns / §Must Not Own, §Commands & Routing, §Lịch sử quyết định).

## Vị trí spec

`docs/platform/convention/spec.md` (quyết định đã nhận 2026-10-06: theo hướng đích của plan `260925-documentation-authority-unification`, `docs/platform/**` là nơi duy trì quyền chuẩn; các vùng đã promote như `packaging-distribution` và `host-invocation-routing` đều có `spec.md` trong thư mục vùng). Lý do không đặt ở `docs/specs/convention.md`: plan đó có chốt chặn "không thêm tài liệu cũ mới" (bản kiểm có ở branch, `check-legacy-docs-ratchet`), nên thêm spec vào `docs/specs/` là sinh thêm nợ di trú.

Căng thẳng cần ghi rõ, UNPROVEN cho tới khi đọc xong: (1) lập luận trước đó của planner chọn `docs/specs/` vì `reading-map.md:9` gọi nó là "state layer: area spec", và `observe` (component Rust gần nhất) có spec ở `docs/specs/observe.md`; (2) `AGENTS.md` vẫn dẫn người đọc tới `docs/specs/reading-map.md` trước, nên một spec chỉ nằm ở `docs/platform/` sẽ không được tìm thấy nếu không có con trỏ. Cách xử lý: thêm đúng một dòng con trỏ trong `docs/specs/reading-map.md` (và `docs/specs/system-overview.md` §Area Map) trỏ sang spec mới; hai chỗ sửa tài liệu cũ này là **ngoại lệ phải ghi nhận** khi nối lại plan 260925 (branch của nó đã có cơ chế ghi nhận sửa đổi trên main vào tài liệu cũ). Phase 00 phải kiểm tra lại cách đặt này với trạng thái hiện tại của plan 260925 trước khi viết spec.

## Yêu cầu: nội dung spec phải có

1. **Mục đích và luật nhận vào.** Quy ước chạy được là thứ có thể **sinh** và **kiểm**. Chỉ nhận cái gì sinh/phân giải một tên hoặc path, hoặc kiểm sự tuân thủ. Không phải thùng "utils": không định dạng chung, không tiện ích chuỗi, không cấp phát có state. Mỗi kind mới phải có golden case cho cả sinh lẫn kiểm.
2. **Owns / Must Not Own.** Owns: dữ liệu quy tắc (`packages/convention/contracts/`), ba operation, golden case. Must not own: root lưu trữ `.fgos` (giữ ở `src/runner/paths.mjs` cho đến khi host Rust sở hữu caller của nó), tên artifact trong runDir (`agent-report.md`, thuộc Execution/run-result), cấp phát id, tên thư mục do `ak plan create` sinh (chỉ kiểm, không thay), khối `## Naming` của hook ak/ck (môi trường, không sửa).
3. **Kinds bước 1:** `report`, `plan` (thư mục), `journal`. Mỗi kind: mẫu tên, thư mục gốc, ví dụ.
   - `report`: `{type}-{YYMMDD-HHMM}-{slug}.md` (anh đã chọn; loại `{type}-{YYMMDD-HHMM}-{slug}-report.md` và `{slug}-{YYMMDD}.md`). Vị trí: `plans/reports/` hoặc `plans/<plan-dir>/reports/` (đã kiểm: 28 report nằm dưới thư mục plan).
   - `plan`: thư mục `{YYMMDD-HHMM}-{slug}` dưới `plans/`, chứa `plan.md` và `phase-NN-<name>.md` (khớp 18/19 thư mục hiện có và tên do `ak plan create` sinh).
   - `journal`: xem Q6.
4. **Operations** (input, output JSON trong `data` của `fgos.v1`, mã thoát):
   - `name --type <t> --slug <s> [--kind report|plan|journal] [--at <RFC3339>]` → `{kind, name, at, offset}`.
   - `path ... [--plan <plan-dir>]` → `{kind, path}` (repo-relative, dấu `/`).
   - `check <path>... | --all` → `{checked, violations:[{path, code, message}]}`. `<path>` là repo-relative; `check <path>` là phép kiểm chuỗi thuần, không đọc FS; `--all` duyệt các thư mục do dữ liệu quy tắc khai dưới `--dir`.
   - Mã thoát: lấy từ một nguồn theo `docs/io-contract.md` ("exit-code một nguồn"); spec ghi rõ `check` có vi phạm trả mã nào (đề xuất: validation `4`, giống verb lạ ở `main.rs:113`). UNPROVEN cho đến khi đọc io-contract.
5. **Họ lỗi** (tên ổn định, không chứa mã plan): `invalid-kind`, `invalid-type`, `invalid-slug`, `invalid-at`, `invalid-plan-dir`, và mã vi phạm của `check`: `pattern-mismatch`, `invalid-timestamp`, `wrong-location`, `unknown-kind`.
6. **Dữ liệu mẫu và golden case:** một file dữ liệu quy tắc (đề xuất `packages/convention/contracts/convention.rules.v1.json`) và một file golden (`convention.golden.v1.json`); Rust nhúng bằng `include_str!`. Đây là nguồn duy nhất của mẫu; Node, pre-commit, doctor, AGENTS.md không chép mẫu.
7. **Quy tắc múi giờ:** xem Q9; spec ghi một câu không mơ hồ và golden case có ít nhất một `--at` ở offset khác `+07:00`.
8. **Quy tắc slug và type:** xem Q7, Q8.
9. **`check` kiểm gì:** mẫu tên **và** vị trí. Phạm vi áp dụng: pre-commit chỉ kiểm file **mới thêm** (`git diff --cached --diff-filter=A`) dưới các thư mục quy tắc khai báo, để 78 report cũ không chặn commit (không cần file baseline); doctor chạy `--all` và báo số file không tuân thủ ở mức cảnh báo/`degraded`, không `failed`.
10. **Quan hệ với `paths.mjs` và công cụ ngoài:** như mục 2; `ak plan create` vẫn là công cụ ngoài, `check` chấp nhận tên của nó.
11. **Extension:** không có thư viện riêng. Extension (process ngoài bằng Node/Rust, WASM sau này) gọi `fgos convention ... --json` hoặc không gọi; pre-commit và doctor bắt file sai bất kể ngôn ngữ đã sinh ra nó. Phụ thuộc Q1-Q3.
12. **Đăng ký doctor:** id `convention-conformance`, hành vi khi host không có/cũ (degraded), cập nhật `docs/specs/distribution.md:70` cùng thay đổi. Không thêm config default, env var mới nào (nếu spec cần, phải đăng ký `registerConfigDefault`).
13. **Operation id và hiệu ứng:** đề xuất một operation `convention.query` (`effect: Read`, `idempotency: Safe`, `allowed_host_kinds: ["cli","remote"]` như láng giềng ở `catalog.rs`) với subcommand `name|path|check`, giống `observe.metrics`. `UNPROVEN`: `OperationId::parse` chấp nhận tên này (phase 02 kiểm bằng test có sẵn `every_catalog_operation_id_reparses_through_the_validating_parser`, `catalog.rs:111`).
14. **Kết quả kiểm component-boundary:** component mới → boundary map **có** thay đổi: thêm một hàng "Convention (quy ước tên & vị trí)" vào bảng §4 của `docs/platform/component-boundary.md`, lớp "platform core", owner `packages/convention/rust`, không ghi state, không phụ thuộc component khác ngoài `fgos-host-runtime`. Ghi trạng thái "proposed" ở phase này, "implemented" ở phase 07.
15. **Deferred: id.** Khoảng 19 chỗ sinh id/token trong `src/`, `scripts/` (kế thừa từ synthesis §8, chưa đọc từng file). Cấp phát duy nhất cần state và thuộc chủ state. Hoãn. Điều kiện xem lại: có bằng chứng lệch định dạng id giữa hai bộ cấp (ví dụ `nextFreeDecisionId` `src/runner/merge.mjs:541` và `scripts/next-doc-id.mjs`), hoặc host Rust bắt đầu sở hữu writer của work-state. Khi xem lại, chỉ phần tất định (định dạng, kiểm hợp lệ) có thể vào `convention`.

## Câu hỏi mở (mỗi câu UNPROVEN cho tới khi spec trả lời)

Mỗi câu là một bước nghiên cứu/quyết định trong phase này; ghi câu trả lời và bằng chứng `file:line` vào spec.

| # | Câu hỏi | Bằng chứng sơ bộ em đã thấy | Bước làm |
|---|---|---|---|
| Q1 | `fgos.component.v1` có cho extension gọi ngược host không? | §3 chỉ nói "capability context granted by the host"; §5 nói "host callbacks require explicit capability grants". Code: `"host.callback"` nằm trong `DEFAULT_KNOWN_CAPABILITIES` (`packages/host-runtime/rust/src/providers/external_process/registry.rs:44`) nhưng em chưa thấy kênh request ngược chiều. | Đọc `frame_codec.rs`, `adapter.rs`, `bound_invocation_supervisor.rs` tìm request do provider khởi tạo; đọc `docs/platform/host-invocation-routing/contracts/component-protocol.md`. Kết luận: có/không/chỉ thiết kế. |
| Q2 | `ExternalWasm` đã có trong code hay mới là thiết kế? | `rg -il wasm --glob '*.rs' --glob Cargo.toml packages apps` (loại `target/`) ra 0 file; ledger HI-I018: "marketplace/signature/WASM remain future". Gần như chắc chỉ là thiết kế. | Xác nhận lại bằng `rtk proxy rg`, ghi vào spec. |
| Q3 | Extension Node dùng được `FGOS_HOST_BIN` không? | Host chỉ đặt biến này cho payload Node legacy (`apps/fgos/src/legacy_exec.rs:245-247`). Provider process ngoài được spawn với `cmd.envs(&self.config.environment)` không `env_clear` (`bound_invocation_supervisor.rs:212`), tức thừa kế env của host nhưng host không tự thêm `FGOS_HOST_BIN`. Extension tự chạy ngoài host không có biến này; `resolveHostBin` là code nội bộ của fgOS, không phải thư viện công khai. | Quyết trong spec: extension gọi `fgos` theo cách nào (lệnh `fgos` của người dùng, hay host đặt `FGOS_HOST_BIN` cho provider khi có capability `host.callback`). Nếu cần sửa host, ghi thành việc riêng, không nằm trong plan này. |
| Q4 | `fgos-convention` được lắp ở đâu trong `apps/fgos`? | Đã trace: `Cargo.toml` workspace `members`; `apps/fgos/Cargo.toml` dependency; `CATALOG` (`catalog.rs:17`, test đếm `assert_eq!(CATALOG.len(), 5)` `:105`); `COMPOSITION_PROVIDERS` (`main.rs:54`); `register_provider` (`main.rs:123-140`); nhánh subcommand mã cứng (`main.rs:158-160`); nhánh stdin `is_observe` (`main.rs:203`); `project_cli_invocation` (`cli_projector.rs:19-75`). `apps/fgos/src/wiring/` chỉ nối nguồn dữ liệu ngoài cho observe (`metrics_sources.rs`, `friction_sources.rs`); convention không có nguồn ngoài nên dự kiến không cần file wiring. | Xác nhận convention không cần source trait (không đọc work-state, run-result); nếu đúng, ghi "không thêm file vào `wiring/`". |
| Q5 | Các bộ sinh tên/path khác có vào phạm vi sau này không? | `branchNameFor` → `fgw/<id>` (`src/runner/worktree.mjs:80`, có từ `91accdf3c`); `scripts/next-doc-id.mjs` (số nguyên kế tiếp cho STR/RUL/ADR); `nextFreeDecisionId` (`src/runner/merge.mjs:541`). | Áp luật nhận vào từng cái: `branchNameFor` là sinh tên tất định → ứng viên sau; hai bộ cấp số cần state → "never trong convention, thuộc chủ state" hoặc chỉ phần định dạng. Ghi bảng "later / never" với lý do. |
| Q6 | Thư mục journal chuẩn là gì, mẫu tên nào? | `plans/journals/` 10 file `YYYY-MM-DD-slug.md`, còn hoạt động; `docs/journals/` 5 file `YYMMDD-HHMM-slug.md`, ngừng từ 2026-08-11; `docs/doc-governance.md` không nhắc journal. Người viết journal hiện nay là agent `journal-writer` của kit ngoài (UNPROVEN: nó lấy path từ đâu). | Anh chọn một thư mục và một mẫu. Đề xuất: `plans/journals/` + mẫu thống nhất `{YYMMDD-HHMM}-{slug}.md` hoặc giữ `YYYY-MM-DD-slug`. Phase 05 dời thư mục còn lại (xoá một nguồn). **Mặc định nhận 2026-10-06 (lead; anh đổi được):** một thư mục `plans/journals/` (còn dùng), mẫu cùng họ với report `{type}-{YYMMDD-HHMM}-{slug}.md` với `type=journal`; `docs/journals/` gộp vào sau ở phase 05, không xoá file nào mà không có bước xác nhận. |
| Q7 | `type` là từ vựng đóng hay chỉ kiểm hình dạng? | 103 giá trị khác nhau trong 163 report khớp mẫu. | Đề xuất: chỉ kiểm hình dạng (chữ thường, số, gạch nối; không chứa `-\d{6}-\d{4}-`), từ vựng mở. Cũng quyết: `name` có từ chối đuôi `-report` thừa trong slug không (119 file hiện có). **Mặc định nhận 2026-10-06 (lead; anh đổi được):** từ vựng mở, chỉ kiểm hình dạng; `check` từ chối đuôi `-report` thừa trong slug. |
| Q8 | Slug có ký tự ngoài ASCII (tiếng Việt) thì sao? | Rust std không có chuẩn hoá Unicode; thêm crate `unicode-normalization` là phụ thuộc mới. | Đề xuất: `name` chuẩn hoá ASCII (chữ thường, ký tự khác `[a-z0-9]` → `-`, gộp, cắt, giới hạn độ dài) và trả `invalid-slug` nếu sau chuẩn hoá rỗng; không phiên âm. **Mặc định nhận 2026-10-06 (lead; anh đổi được):** chuẩn hoá ASCII không phiên âm, không thêm crate Unicode; slug rỗng sau chuẩn hoá thì lỗi `invalid-slug`. Gợi ý trước đó của em "bỏ dấu" cần phụ thuộc `unicode-normalization`, nên không nhận; agent thường tự đặt slug tiếng Anh. |
| Q9 | Múi giờ: local hay UTC? | Máy này `+07`; hook ak/ck và `ak plan create` dùng giờ local (`plans/261006-1415-...` khớp 14:15 local). Rust std không cho offset local; `libc` đã là phụ thuộc workspace và `unsafe` libc đã có (`store_lock.rs:121`). | Đề xuất: giờ đồng hồ local của tiến trình, offset ghi trong output (`offset`); `--at` mang offset riêng thì dùng offset đó; nền tảng không lấy được offset → UTC và `offset: "+00:00"`. Phương án thay: luôn UTC (tái lập giữa máy, nhưng lệch 7 giờ so với thư mục plan do `ak` sinh, thứ tự sắp xếp trộn lẫn). **Mặc định nhận 2026-10-06 (lead; anh đổi được):** giờ đồng hồ local, offset ghi trong output. |
| Q10 | Bố cục thư mục package. | **Đã quyết (anh chọn bố cục thực tế).** Mọi package hiện có chỉ có `contracts/` và `rust/` (test ở `rust/tests/`); code Node của một component nằm ở cây `src/<tên>/` cấp repo (ví dụ `src/observe/friction-client.mjs`). | `packages/convention/contracts/` + `packages/convention/rust/{Cargo.toml,src/,tests/}`; client Node ở `src/convention/`. Không còn là câu hỏi mở. |
| Q11 | Host cũ gặp verb `convention`. | `main.rs:108-113` in `unknown verb "convention"`, thoát 4; `invokeHost` chỉ nhận `unknown` + `subcommand` là mismatch (`host-bin.mjs:91`). | Quyết: mở rộng nhận diện trong `invokeHost` cho `unknown verb` (phase 04) để pre-commit/doctor suy giảm đúng. |
| Q12 | Pre-commit khi không có host. | Pre-commit là script Node (`.githooks/pre-commit:1`); chặn mọi commit vì thiếu host là sai. | Đề xuất: không có host hoặc host cũ → cảnh báo stderr, không chặn; có host và có vi phạm trên file mới → chặn. |

## Files

Tạo: `docs/platform/convention/spec.md`.
Sửa (dòng trạng thái "proposed"): `docs/specs/reading-map.md` (một dòng, theo mẫu dòng 51), `docs/specs/system-overview.md` §Area Map (một dòng), `docs/platform/component-boundary.md` §4 (một hàng).
Xoá/gộp: không có file nào ở phase này. Spec ghi rõ những nguồn sẽ bị gộp ở phase sau: 4 bản thuật toán ngày → 1 (phase 01); nhánh subcommand mã cứng → bảng (phase 03); hai thư mục journal → 1 (phase 05); tên do brief tự dựng → lệnh (phase 06).

## Các bước

1. Đọc `docs/io-contract.md` (exit code, envelope) và `docs/platform/host-invocation-routing/contracts/component-protocol.md`.
2. Trả lời Q1-Q5 bằng nghiên cứu, ghi `file:line`.
3. Viết spec theo cấu trúc của `observe.md`, gồm mục 1-15 ở trên.
4. Trình Q6-Q12 cho anh kèm đề xuất; ghi quyết định vào §Lịch sử quyết định của spec (không tạo `docs/decisions/*.md`, corpus đó đã retire).
5. Thêm các dòng "proposed" vào reading-map, system-overview, component-boundary.
6. Mở `mdview` cho spec.

## Kiểm chứng

- Mọi path trong spec tồn tại (`ls`) hoặc được đánh dấu "sẽ tạo ở phase NN" trong plan, không trong spec.
- Mỗi Q có câu trả lời hoặc quyết định của anh; không còn UNPROVEN trong spec trừ cái được ghi là hoãn.
- Golden case dạng bảng trong spec khớp tiêu chí 1-3 của [plan.md](plan.md).

## Rủi ro

| Rủi ro | Khả năng × tác động | Giảm thiểu |
|---|---|---|
| Spec thành thùng "utils" | Trung bình × Cao | Luật nhận vào ở mục 1; reviewer từ chối kind không có golden sinh+kiểm. |
| Hook ak/ck vẫn chèn `## Naming` khác mẫu, agent theo hook | Cao × Trung bình | Ngoài phạm vi sửa. Cơ chế thắng văn xuôi: lệnh sinh tên + pre-commit chặn file mới sai. Hiệu quả đo ở H4 (UNPROVEN, synthesis §7 điểm yếu 1). |
| Q10 đã quyết theo bố cục thực tế | — | Không còn rủi ro; đóng. |

## Rollback

Revert commit spec và các dòng "proposed". Không ảnh hưởng code.

## Hiệu chỉnh sau red-team (2026-10-06)

Mục này **thắng** nội dung cũ của phase khi mâu thuẫn. Bằng chứng đã được lead tự đo lại (script hoặc `rtk proxy`), chi tiết ở bảng Red Team Review trong `plan.md`.

- **Hợp đồng `check` (sửa mã thoát "4"):** bộ trình bày của host chỉ có hai kết cục: `Completed` in phong bì ra stdout rồi thoát `0`; mọi `ProviderError` in text ra stderr rồi thoát `1` (`apps/fgos/src/cli_presenter.rs:82-100,209-214`; `invokeHost` bỏ stdout khi thoát khác 0). Nên `check` luôn trả `Completed` với `data.violations[]` (`path`, `code`, `message`) và thoát 0; người gọi quyết định chặn hay không. Lỗi đầu vào (`invalid-kind`, `invalid-slug`) là `ProviderError` thoát 1; spec ghi rõ client phân biệt chúng bằng nội dung có cấu trúc, không bằng chuỗi con của stderr.
- **Phạm vi `check`:** chỉ các file `*.md` ngay trực tiếp dưới `plans/reports/` và `plans/journals/`. Thư mục `reports/` trong từng plan, mọi thư mục con (`evidence/`...), file không phải `.md` và tên cố định (`acceptance.md`) nằm ngoài phạm vi, chỉ là thông tin. Số đo hôm nay: 390 file được theo dõi trong `plans/*/reports/`, trong đó 28 là `.md` trực tiếp (0 khớp mẫu) và 360 nằm trong thư mục con; `plans/reports/` có 256 file `.md` cấp cao nhất, 172 khớp hình dạng (b), 127 kết thúc bằng `-report.md`.
- **Tư thế cưỡng chế: chỉ cảnh báo** cho tới khi anh quyết định chặn sau khi có số đo (H4). Có một mốc commit (cutoff) ghi trong dữ liệu quy tắc: chỉ file thêm sau mốc mới được tính là vi phạm mới.
- **Q6, Q7 sửa:** `check` chấp nhận (không báo vi phạm) hình dạng mà công cụ ngoài sinh ra và plan không được đổi: đuôi `-report.md`, tiền tố `GH-<n>` do hook ak/ck chèn, journal `YYYY-MM-DD-<slug>.md` của `ak journal create`. Q7 không còn từ chối `-report`. **Bỏ việc dời/đổi tên thư mục journal** (không ai yêu cầu; kit ngoài `~/.claude/agents/journal-writer.md:37` vẫn ghi vào `docs/journals/` và `.claude/agents/journal-writer.md:49` vào `plans/journals/`): chỉ báo `wrong-location` dạng thông tin.
- **argv:** thao tác `check` nhận đường dẫn sau dấu `--`; mọi thao tác nhận `--dir`; client truyền toplevel đang làm việc, không phải gốc main checkout.
- **Không tìm lại reading-map:** `docs/specs/reading-map.md` thuộc plan `260925-documentation-authority-unification` (anh đã giao); không sửa nó ở plan này. Spec tìm được qua `docs/platform/component-boundary.md` §4 và `docs/platform/README.md`. Hàng #7 của `docs/specs/distribution.md` vẫn phải sửa (luật doctor), ghi là ngoại lệ.
- **Trích dẫn số dòng đã trôi** (ví dụ `registrations.mjs:5753` thực ra `:5765`, `catalog.rs:105` thực ra `:81`, `main.rs:203` thực ra `:205`): Phase 00 trích dẫn theo ký hiệu và kiểm lại dòng khi bắt đầu. Đường dẫn Plan A nay đã tồn tại.
