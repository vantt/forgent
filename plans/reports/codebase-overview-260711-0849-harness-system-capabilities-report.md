> **Provenance:** copy 2026-07-13 từ `~/projects/research/repository-harness/plans/reports/` (phiên nghiên cứu 2026-07-11, repo tại commit `14e6f10`).
> **Cảnh báo lỗi thời:** sau E11/E12 (`9cc306d`, 2026-07-13) Symphony đã tách sang repo `hoangnb24/symphony`; story dependency/hierarchy đã có CLI write path; enforcement được siết (request authority, SQL read-only). Đối chiếu `docs/references/sources/repository-harness.md`.

# Research Report: Repository Harness System — Chức Năng & Kiến Trúc

Conducted: 2026-07-11 08:49 (Asia/Saigon)

## Executive Summary

`repository-harness` không phải một ứng dụng — nó là một **operating harness** (lớp vận hành) gắn vào một repo bất kỳ để giúp coding agent (Claude Code, Codex, Cursor...) làm việc an toàn và có ngữ cảnh trước khi sửa code. Nó giải quyết vấn đề: agent thường vào repo chỉ với 1 chat prompt + snapshot code, không biết nên đọc gì trước, việc này rủi ro cỡ nào, cần chứng minh gì là xong, và quyết định nào cần agent sau kế thừa.

Hệ thống gồm 2 lớp: (1) **policy docs** (markdown, ổn định, con người đọc được) mô tả cách làm việc, và (2) **durable layer** (SQLite `harness.db` + Rust CLI `harness-cli`) lưu trạng thái vận hành thực tế (intake, story, decision, trace, backlog, tool registry). Một crate thứ hai, `harness-symphony`, là runner cục bộ chạy story qua agent trong workspace cô lập (git worktree), thu SUMMARY.md/RESULT.json, và đồng bộ thay đổi durable về qua "semantic changesets" thay vì ghi thẳng vào `harness.db` gốc.

Trạng thái hiện tại (README): repo đang ở **Harness v0**, chưa có ứng dụng sản phẩm thật — công việc hiện tại là chính cái harness (cấu trúc file, quy trình, template, CLI). `scripts/bin/harness-cli` chưa được build sẵn trong checkout này (thư mục `scripts/bin/` không tồn tại) — đây là repo nguồn của chính công cụ, cần `cargo build` để có binary.

## Research Methodology

- Nguồn: 100% tài liệu + source code nội bộ repo, không cần web search (câu hỏi thuần về codebase hiện tại).
- Đã đọc: README.md, docs/HARNESS.md, docs/ARCHITECTURE.md, docs/HARNESS_COMPONENTS.md, docs/CONTEXT_RULES.md, docs/TOOL_REGISTRY.md, docs/TRACE_SPEC.md, docs/GLOSSARY.md, docs/SYMPHONY_QUICKSTART.md, AGENTS.md, CLAUDE.md, docs/FEATURE_INTAKE.md (đã có sẵn trong system context).
- Đã kiểm tra: cấu trúc `crates/` (2 crate Rust: `harness-cli`, `harness-symphony`), kích thước từng module nguồn (`wc -l`), Cargo.toml của cả 2 crate.
- Không chạy được `scripts/bin/harness-cli --help` / `query matrix` vì binary chưa tồn tại trong checkout này (không phải lỗi — repo này build ra chính binary đó).

## Key Findings

### 1. Vấn đề hệ thống giải quyết

Repo thông thường được xây cho người đọc quen thuộc codebase; agent chỉ có prompt + snapshot file nên hay:
- sửa code trước khi hiểu ý định sản phẩm,
- bỏ lỡ ràng buộc chỉ nằm trong chat/đầu người,
- không rõ tiêu chí validate,
- lặp lại tranh luận kiến trúc thay vì kế thừa quyết định cũ,
- không chia nhỏ request lớn thành việc review được.

Harness trả lời trước cho agent: đọc gì trước, loại việc gì, ảnh hưởng contract nào, rủi ro cỡ nào, cần chứng minh gì, quyết định/bài học nào cần lưu lại.

### 2. Thành phần chính

| Thành phần | Vai trò |
| --- | --- |
| `AGENTS.md` | Shim ổn định — điểm vào agent, trỏ tới doc Harness. Claude Code không tự load AGENTS.md nên `CLAUDE.md` dùng `@`-import để kéo nó + `FEATURE_INTAKE.md` vào context. |
| `docs/HARNESS.md` | Mental model, durable layer, spec lifecycle, growth rule, task loop, decision policy. |
| `docs/FEATURE_INTAKE.md` | Cổng phân loại việc: tiny / normal / high-risk, dựa trên risk checklist (auth, authorization, data model, audit/security, external systems, public contracts, cross-platform, existing behavior, weak proof, multi-domain). |
| `docs/ARCHITECTURE.md` | Câu hỏi khám phá kiến trúc generic (chưa chọn stack), layering domain→application→infrastructure→interface→app surfaces, parse-first boundary rule. |
| `docs/CONTEXT_RULES.md` | Ma trận "đọc gì" theo 5 phase (intake/planning/implementation/validation/trace) × 3 lane, cộng retrieval triggers và token budget mục tiêu (tiny ~2K, normal ~5K, high-risk ~10K). |
| `docs/TOOL_REGISTRY.md` | 2 khái niệm tool: outbound manifest (lệnh compiled sẵn của harness-cli) và inbound registry (công cụ ngoài agent tự đăng ký — linter, code-graph, deploy check...) với capability lookup + degrade ladder (inactive/degraded/full). |
| `docs/TRACE_SPEC.md` | Định dạng/độ sâu bắt buộc cho mỗi field của bảng `trace`, 3 tier chất lượng (minimal/standard/detailed) map theo lane. |
| `crates/harness-cli` | Rust CLI, engine chính của durable layer. `domain.rs` (1328 dòng), `infrastructure.rs` (4123 dòng, SQLite), `interface.rs` (1520 dòng, CLI parsing/commands), `application.rs` (357 dòng). |
| `crates/harness-symphony` | Rust CLI thứ 2 — local runner chạy story qua agent trong worktree cô lập. Các module: `run.rs` (1046), `work.rs` (925), `web.rs` (2346, có lẽ dashboard/API), `agent.rs` (680, adapter agent), `sync.rs` (675, đồng bộ changeset), `state.rs` (655), `doctor.rs` (488, readiness check), `config.rs` (469), `pr.rs` (401, tạo PR), `changeset.rs` (315), `auto.rs` (354), `retention.rs` (132). |
| `harness.db` | SQLite, local, `.gitignore`d — lưu intake/story/decision/trace/backlog/tool/intervention. Schema version-controlled ở `scripts/schema/`. |
| `.harness/changesets/*.jsonl` | Cách durable-layer change được review/commit qua git (thay vì commit thẳng binary DB) — dùng bởi Symphony và `harness-cli db changeset apply` / `db rebuild`. |

### 3. Luồng làm việc điển hình

**Luồng ý định → sản phẩm (docs/HARNESS.md mental model):**
```
Human intent -> Feature intake -> Story packet -> Agent work loop
  -> Product delta -> Validation proof -> Harness delta -> Next intent
```

**Task loop cụ thể cho 1 agent:**
1. Phân loại request theo `FEATURE_INTAKE.md` (tiny/normal/high-risk).
2. Ghi nhận bằng `harness-cli intake`.
3. Tìm product docs / story liên quan.
4. Kiểm tra proof status: `harness-cli query matrix`.
5. Làm việc trong đúng lane đã chọn.
6. Trước khi xong: hỏi liệu product truth / validation / architecture / next-agent instruction có đổi không.
7. Ghi trace: `harness-cli trace` (độ sâu theo `TRACE_SPEC.md`).
8. Xem điểm trace tự in ra.
9. Nếu có friction, sửa luôn hoặc `harness-cli backlog add`.

**Luồng chạy story qua Symphony (tách biệt, cấp thực thi):**
```
work list chọn story runnable
  -> run <story-id> --prepare-only (tạo worktree cô lập + RUN_CONTRACT.json + harness.db copy)
  -> agent làm việc chỉ trong run contract
  -> agent phải tạo SUMMARY.md + RESULT.json (+ changeset nếu đổi durable state)
  -> review/PR -> merge -> harness-symphony sync (áp changeset vào harness.db gốc, idempotent)
```
Story tiny có đường tắt `run <id> --here` (không cần worktree riêng, nhưng vẫn cần DB copy + artifacts). Root `harness.db` **không bao giờ** là nguồn sự thật của 1 run — nó chỉ bị ghi qua changeset sau khi review.

### 4. Khái niệm riêng (glossary rút gọn)

- **Lane**: mức rủi ro của việc — tiny/normal/high-risk, quyết định độ sâu process + trace tier.
- **Story Packet**: file/folder mô tả 1 việc kích cỡ story — product contract, docs liên quan, design, validation.
- **Decision**: bản ghi bền (`docs/decisions/NNNN-*.md` + `decision add`) cho thay đổi behavior/architecture/authorization/data ownership/API shape — khác với `decisions_made` field trong trace (chỉ là tóm tắt, không thay thế decision record).
- **Trace**: bản ghi có cấu trúc agent đã làm gì (actions, files_read/changed, outcome, friction...) — dùng để review, benchmark, entropy audit.
- **Matrix**: `query matrix` — bảng proof theo story (unit/integration/e2e/platform đã pass chưa).
- **Backlog / Harness Delta**: cải tiến chính bản thân harness (không phải sản phẩm) — có backlog outcome loop (predicted vs outcome).
- **Entropy Score**: điểm drift từ `audit` — càng thấp càng tốt (story mồ côi, proof chưa verify, backlog thiếu outcome, tool hỏng...).
- **Context Score**: điểm advisory từ `score-context <trace-id>` — so `files_read` của trace với `CONTEXT_RULES.md`.
- **Intervention**: bản ghi riêng (không phải trace) khi người/reviewer/CI/agent khác sửa/override/escalate/approve việc.
- **Tool Registry (inbound)**: agent/project tự đăng ký công cụ ngoài (linter, code-graph...) theo capability; nếu thiếu thì "clean skip", không fail.
- **Runtime Substrate responsibilities**: 11 hạng mục trách nhiệm mà harness cần phủ (task spec, context selection, tool access, project memory, task state, observability, failure attribution, verification, permissions, entropy auditing, intervention recording) — hiện 8/11 Covered, 3/11 Partial (observability, failure attribution, permissions), 0/11 Missing.

### 5. Lệnh CLI — `harness-cli` (outbound manifest, từ TOOL_REGISTRY.md)

| Nhóm | Lệnh chính |
| --- | --- |
| Khởi tạo/schema | `init`, `migrate`, `import brownfield` |
| Intake | `intake --type --summary --lane` |
| Story | `story add`, `story update`, `story verify <id>`, `story verify-all` |
| Decision | `decision add`, `decision verify` |
| Backlog | `backlog add`, `backlog close` |
| Tool registry | `tool register`, `tool check`, `tool remove` |
| Intervention | `intervention add` |
| Observability | `trace`, `score-trace`, `score-context <trace-id>` |
| Entropy/proposal | `audit`, `propose [--commit]` |
| Query | `query matrix [--numeric]`, `query backlog [--open\|--closed]`, `query decisions`, `query intakes`, `query traces`, `query friction`, `query tools [--json\|--summary\|--responsibility\|--capability\|--status]`, `query interventions`, `query stats`, `query sql <SQL>` |
| Durable sync | `db changeset apply <path>`, `db rebuild --from <dir>` |

### 6. Lệnh CLI — `harness-symphony` (từ SYMPHONY_QUICKSTART.md, suy ra từ module list)

| Lệnh | Mục đích |
| --- | --- |
| `doctor` | Kiểm tra readiness trước khi chạy story. |
| `work list` | Liệt kê story runnable (yes/warn/no). |
| `run <story-id> [--prepare-only\|--here]` | Chuẩn bị hoặc chạy 1 story qua agent trong workspace cô lập (hoặc tại chỗ nếu tiny). |
| `status` | Trạng thái local. |
| `runs list` / `runs show <run_id>` | Danh sách/chi tiết run. |
| `pr create <run_id>` / `pr retry <run_id>` | Tạo/thử lại PR từ kết quả run. |
| `sync` | Áp changeset đã merge vào `harness.db` gốc (idempotent). |
| `config show` | Xem config đã resolve từ `.harness/symphony.yml`. |

## Đánh giá độ chín (Coverage Summary, từ HARNESS_COMPONENTS.md)

- Covered (8/11): task specification, context selection, tool access, project memory, task state, verification, entropy auditing, intervention recording.
- Partial (3/11): observability (chưa có dashboard/benchmark ingestion), failure attribution (chưa tự động gán lỗi benchmark về component), permissions (chỉ ở mức instruction, chưa có policy layer thực thi).
- Missing: 0/11.

## Unresolved Questions

1. `scripts/bin/harness-cli` chưa build trong checkout này — không rõ user có cần tôi `cargo build -p harness-cli` để lấy output thực tế của `--help` / `query matrix` không (báo cáo này suy ra danh sách lệnh từ `TOOL_REGISTRY.md` + source, chưa chạy trực tiếp).
2. `crates/harness-symphony/src/web.rs` (2346 dòng, file lớn nhất sau infrastructure.rs) chưa được đọc chi tiết — có vẻ là dashboard/API server nhưng chưa xác nhận qua doc.
