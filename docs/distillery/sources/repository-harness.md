---
name: repository-harness
type: git-repo
url: https://github.com/hoangnb24/repository-harness
local: upstreams/repository-harness
last_analyzed_commit: 9cc306d
last_analyzed_date: 2026-07-13
domains_covered: [harness, skills, hooks, workflow, orchestration, context-memory, planning, quality-gates, docs-style, tooling, config-packaging, repo-layout, safety, self-improvement, ux, testing-evals]
---

# Repository Harness — Feature Index

"Repo-level operating system" cho AI-assisted development: policy docs (markdown) + durable layer (SQLite qua Rust CLI). Triết lý: "Coding agents do not only need better prompts. They need better repositories." Maturity: H3–H4 partial, Phase 5 (self-improvement) đang chạy. Inventory gốc: `plans/reports/ref-scan-inventory-260713-1224-harness-*.md`; delta 94 commits (`14e6f10..9cc306d`, 2026-07-13): `plans/reports/ref-scan-delta-260713-1311-harness-*.md`.

> **Biến cố lớn @9cc306d (E11, decision 0009):** Symphony (isolated runner, auto mode, PR automation, web board) tách sang repo riêng **github.com/hoangnb24/symphony**; impeccable + intake-griller skills bị gỡ khỏi template (commit b4c3c89). Repo này trở lại thuần "reusable harness template + CLI". Các entry bị ảnh hưởng đánh dấu `Status: moved-to-symphony` / `removed` — giữ lại vì giá trị học vẫn nguyên, và symphony đã vào intake queue làm nguồn mới.

## harness

### repo-as-os-six-questions
- **What:** Repo "có harness" khi giúp agent trả lời 6 câu không cần chat history: đọc gì trước / loại việc gì / chạm contract nào / rủi ro bao nhiêu / proof gì là xong / bài học nào để lại.
- **Where:** `README.md`
- **Notable:** định nghĩa harness bằng câu hỏi kiểm chứng được — dùng làm acceptance test cho mọi harness.
- **Seen:** 14e6f10

### durable-sqlite-layer
- **What:** Tách đôi: policy docs (markdown, cách làm việc) vs durable layer (SQLite `harness.db` qua Rust CLI: bảng intake/story/decision/backlog/tool/intervention/trace). "Policy documents describe how to work. The durable layer stores what happened."
- **Where:** `docs/HARNESS.md`, `crates/harness-cli/`, decision 0004
- **Notable:** operational record query được bằng SQL; db gitignored, rebuild từ changesets.
- **Seen:** 14e6f10

### task-loop-nine-steps
- **What:** Vòng bắt buộc mọi task: classify intake → record → locate docs/story → query proof matrix → làm trong lane → harness-delta checklist (product truth/validation/architecture/patterns/instructions có đổi?) → trace theo tier → score → ghi friction.
- **Where:** `docs/HARNESS.md` §Task Loop
- **Notable:** bước 6 (harness delta checklist) biến mọi task thành cơ hội cải tiến harness.
- **Seen:** 14e6f10

### request-authority-model
- **What:** Mọi request phân 2 lớp quyền: **read-only** (answer/explain/review/diagnose/plan/status — không bootstrap, không intake, không trace, không đổi durable state) vs **change** (bootstrap → intake → execute → trace). CONTEXT_RULES có bảng authority gate; FEATURE_INTAKE thêm read-only exemption tường minh.
- **Where:** `AGENTS.md`, `docs/HARNESS.md` §Request-Class Loops, `docs/CONTEXT_RULES.md` (E12, US-101)
- **Notable:** trị đúng bệnh "câu hỏi cũng sinh nghi thức" — intake gate chỉ áp cho mutation. Đi kèm "bounded retrieval": không preload mọi doc, dừng khi câu trả lời đã có bằng chứng.
- **Seen:** 9cc306d

### maturity-ladder-h0-h5
- **What:** Thang trưởng thành H0 (bare) → H5 (self-improving) với tiêu chí kiểm chứng được, file bắt buộc, và chỉ số benchmark từng mức; mỗi Phase roadmap nhắm một bậc.
- **Where:** `docs/HARNESS_MATURITY.md`, `PHASE2.md`–`PHASE5.md`
- **Notable:** tiến hóa harness được đo bằng benchmark ngoài (compliance %, trace quality, lane accuracy), không tự phán.
- **Seen:** 14e6f10

### instruction-level-enforcement
- **What:** Trước E12, toàn bộ workflow (intake → story → trace) KHÔNG được enforce cơ học ở bất kỳ tầng nào — schema gần như không có FK bắt buộc, CLI không lệnh nào từ chối vì thiếu bước trước, không git hook, không CI gate. Mọi thứ chạy nhờ agent tự tuân thủ instruction; `audit`/`score-*` là observability chứ không phải gate. Repo tự nhận trong HARNESS_COMPONENTS.md: "Permissions are instruction-level only".
- **Where:** deep-dive 11/07 (`plans/reports/deep-dive-qa-260711-*` §2, code-verified tại 14e6f10); E12 (@9cc306d) bắt đầu siết: SQL read-only, request authority, story-complete atomic
- **Notable:** đối cực triết lý với bee (enforce bằng code); và quỹ đạo của harness đang tiến dần về phía enforce — xác nhận hướng bee chọn từ đầu là đúng.
- **Seen:** 9cc306d

## skills

### intake-griller-interview
- **What:** Skill phỏng vấn intake: 1 câu hỏi/lượt, restate hiểu biết, luôn kèm recommendation + why; 2 gate tuần tự (shared-understanding gate → intake gate) trước khi sinh artifact (product docs, story packets, validation expectations).
- **Where:** `.codex/skills/harness-intake-griller/SKILL.md`
- **Notable:** ranh giới cứng: không nhảy vào implementation, không tự khởi động Symphony run.
- **Status:** removed @9cc306d (b4c3c89 — Symphony-owned tooling tách khỏi template)
- **Seen:** 14e6f10

### impeccable-design-skill
- **What:** Skill frontend design 110+ scripts: detector đa engine (browser injection, CLI, screenshot contrast), live-edit loop, 30 command references, danh sách "absolute bans" + defect đặc trưng từng model (Codex-specific defects to refuse).
- **Where:** `.agents/skills/impeccable/`
- **Notable:** skill = cả một hệ công cụ executable, không chỉ văn bản hướng dẫn; ban-list theo model là ý tưởng độc đáo.
- **Status:** removed @9cc306d (b4c3c89 — "optional tools must be externally installable and cleanly absent")
- **Seen:** 14e6f10

## hooks

### post-tool-design-hook
- **What:** PostToolUse hook (Edit|Write|apply_patch) chạy design check của impeccable, timeout 5s, có statusMessage.
- **Where:** `.codex/hooks.json`
- **Notable:** hook làm quality feedback tức thời sau mỗi edit UI; mảng hooks mỏng hơn bee nhiều.
- **Status:** removed @9cc306d (đi cùng impeccable; repo hiện không còn hook nào)
- **Seen:** 14e6f10

## workflow

### feature-intake-mandatory
- **What:** Mọi prompt qua intake trước khi đổi code: 6 input types, 10 risk flags, hard gates (auth/data loss/audit/external provider/validation removal); output format cố định (Lane/Reason/Docs/Story/Validation); intake row ghi durable TRƯỚC khi implement, kể cả việc tiny.
- **Where:** `docs/FEATURE_INTAKE.md`
- **Notable:** "The human does not need to classify risk. The harness does." — bee thừa kế trực tiếp cơ chế này.
- **Seen:** 14e6f10

### story-packets
- **What:** Story = đơn vị việc có contract: status, lane, product contract, acceptance criteria, design notes, validation matrix cells, harness delta, evidence; high-risk story = folder 4 file (overview/design/execplan/validation).
- **Where:** `docs/templates/story.md`, `docs/templates/high-risk-story/`
- **Notable:** ceremony scale theo lane bằng cấu trúc file (1 file vs 4 file).
- **Seen:** 14e6f10

### spec-decomposition-lifecycle
- **What:** Spec là input material, không phải truth vĩnh viễn: decompose thành product docs nhỏ + stories + decisions + validation expectations; không bao giờ extend monolithic spec.
- **Where:** `docs/HARNESS.md` §Spec Lifecycle, decision 0002, `docs/demo/README.md`
- **Notable:** demo walkthrough 8 bước minh họa trọn lifecycle — tài liệu dạy bằng ví dụ.
- **Seen:** 14e6f10

## orchestration

### symphony-isolated-runner
- **What:** Story → run cô lập: git worktree riêng + copy harness.db + RUN_CONTRACT.json + AGENTS shim → agent chạy → SUMMARY.md + RESULT.json + semantic changeset. Root db không bao giờ là source of truth của run; tiny lane được phép `--here` (in-place, db copy).
- **Where:** `crates/harness-symphony/src/run.rs`, `docs/SYMPHONY_QUICKSTART.md`
- **Notable:** isolation mặc định theo lane; durable changes về qua changeset, không ghi thẳng.
- **Status:** moved-to-symphony @9cc306d (decision 0009; nay giao tiếp với harness qua orchestration protocol v1)
- **Seen:** 14e6f10

### auto-polling-bounded
- **What:** Chế độ unattended: poll work queue, chạy run tuần tự với caps (--max-runs, --max-attempts, --poll-interval-seconds, --max-idle-cycles); single-active-run lock trong `.symphony/state.db`.
- **Where:** `crates/harness-symphony/src/auto.rs`, `state.rs`
- **Notable:** autonomy có ngân sách và mutex — chống runaway loop bằng thiết kế.
- **Status:** moved-to-symphony @9cc306d
- **Seen:** 14e6f10

### pr-automation
- **What:** `pr create/retry` tạo PR cho run hoàn tất (dry-run được); doctor check PR capability (gh) trước.
- **Where:** `crates/harness-symphony/src/pr.rs`
- **Notable:** khép vòng story → run → PR không rời CLI.
- **Status:** moved-to-symphony @9cc306d
- **Seen:** 14e6f10

## context-memory

### context-rules-matrix
- **What:** Ma trận phase (intake/planning/implementation/validation/trace) × lane → must read / should read / skip; retrieval triggers ("nếu chạm schema, đọc docs/decisions/"); token budget theo lane (tiny ~2K, normal ~5K, high-risk ~10K). Từ 9cc306d: thêm authority gate table (request class → được mutate gì → context mặc định) + "Bounded Retrieval Behavior" (không preload, mở rộng chỉ khi lane/phase/trigger đòi).
- **Where:** `docs/CONTEXT_RULES.md`
- **Notable:** context là tài nguyên được lập ngân sách tường minh; `score-context` đo compliance thực tế so với rule.
- **Seen:** 9cc306d

### changeset-event-sourcing
- **What:** Mọi run ghi semantic changeset JSONL (header + operations story.add/update, trace.add, decision.add...); idempotent replay; `db rebuild` dựng lại toàn bộ db từ changesets; db gitignored nhưng changesets committed. Từ 9cc306d: changeset mang `content_sha256` (conflict khi ID trùng mà content khác), thêm `db changeset status` (inspect không ghi) + `db snapshot` (SQLite online backup atomic, báo logical hash + file hash).
- **Where:** `crates/harness-cli` (changeset apply/status, snapshot), `.harness/changesets/`, migration 013
- **Notable:** giải bài toán "SQLite không diff được trong git" bằng event log commit được; content-addressed identity chống double-apply lệch nội dung. Chi tiết cơ chế (deep-dive 11/07 §6): changeset chỉ ghi khi env `HARNESS_RUN_ID` set, append JSONL **trong cùng SQLite transaction** (rollback chung), payload là full-record chứ không phải column diff. Cùng pattern với Beads (steveyegge) — hai bên hội tụ độc lập.
- **Seen:** 9cc306d

### intervention-log
- **What:** Bảng intervention ghi durable mọi lần chỉnh hướng: correction/override/escalation/approval, từ người/reviewer/CI/agent.
- **Where:** `scripts/schema/004-intervention.sql`, CLI `intervention add`
- **Notable:** can thiệp của con người là dữ liệu học — nguồn cho `propose`.
- **Seen:** 14e6f10

## planning

### phase-documents-benchmark-deltas
- **What:** Roadmap dạng PHASE-N.md: mỗi phase khai báo target maturity delta, stories theo dependency order, VÀ expected benchmark deltas (vd "compliance 74% → 85-90%"); friction findings từ benchmark quay lại thành decision record.
- **Where:** `PHASE2.md`–`PHASE5.md`, decision 0006
- **Notable:** plan có tiêu chí đo lường trước khi làm — falsifiable roadmap.
- **Seen:** 14e6f10

### epic-story-hierarchy
- **What:** `docs/stories/epics/E*/US-*/`; story dependencies + hierarchy trong schema (007/008 migrations). Từ 9cc306d: CLI verbs cycle-safe (`story dependency add/remove`, `story hierarchy add/remove`, DFS cycle detection), `query work-graph --json` trả stories + edges trong 1 transaction kèm revision hash, `story update` dạng compare-and-set với runnable precondition.
- **Where:** `docs/stories/`, `scripts/schema/007-008-*.sql`, `crates/harness-cli/src/application.rs`
- **Notable:** dependency là dữ liệu query được; work-graph snapshot nhất quán là nền cho external orchestrator. Lịch sử thú vị: tại 14e6f10 hai bảng này là **schema mồ côi** — không CLI write path, không doc (deep-dive 11/07 §9); 2 ngày sau upstream tự vá đúng lỗ hổng đó — case study "schema built ahead of tooling" và giá trị của việc theo dõi delta.
- **Seen:** 9cc306d

## quality-gates

### trace-quality-tiers
- **What:** Trace 3 tier (minimal/standard/detailed) với field requirements cơ học từng tier; lane→tier mapping bắt buộc (tiny→minimal, normal→standard, high-risk→detailed); `score-trace` chấm tự động khi ghi trace.
- **Where:** `docs/TRACE_SPEC.md`, CLI `score-trace`
- **Notable:** chất lượng observability cũng lane-scaled và chấm điểm được.
- **Seen:** 14e6f10

### story-verify-command
- **What:** Story mang `verify_command`; `story verify <id>` / `verify-all` chạy và ghi pass/fail; pre-close gate: `trace --story <id>` cảnh báo nếu story chưa verify pass.
- **Where:** PHASE4, `scripts/schema/002-story-verify.sql`
- **Notable:** mechanical proof gắn vào đơn vị việc + batch re-verification sweep (phát hiện "capped nhưng nay fail").
- **Seen:** 14e6f10

### proof-matrix
- **What:** Ma trận story × proof columns (unit/integration/e2e/platform, numeric 0/1) + evidence; status vocabulary (planned/in_progress/implemented/changed/retired); "thiếu cột proof phải có giải thích trong story packet".
- **Where:** `docs/TEST_MATRIX.md`, CLI `query matrix`
- **Notable:** coverage là bảng tra được, không phải cảm nhận.
- **Seen:** 14e6f10

### story-complete-atomic
- **What:** `story complete <id>` là **đường duy nhất** tới trạng thái `implemented`: đòi status in_progress/changed, chạy fresh proof, chỉ pass mới đánh dấu, atomic ghi proof + đóng các backlog occurrence đủ điều kiện; `story update --status implemented` bị reject (INVALID_ARGUMENT); `story verify` thường chỉ ghi proof, không đóng lifecycle.
- **Where:** `docs/HARNESS.md`, `crates/harness-cli` (complete_story), contract v1
- **Notable:** tách "có bằng chứng" khỏi "được đóng" — mạnh hơn cả cap của bee ở chỗ closure và proof là một transaction.
- **Seen:** 9cc306d

## docs-style

### glossary-driven-vocab
- **What:** GLOSSARY.md định nghĩa mọi thuật ngữ harness (agent, lane, trace tier, entropy score, harness delta...); các doc khác cite về đây.
- **Where:** `docs/GLOSSARY.md`
- **Notable:** một nguồn vocabulary duy nhất — chống drift ngữ nghĩa giữa docs.
- **Seen:** 14e6f10

### claude-md-import-shim
- **What:** CLAUDE.md chỉ là shim import; từ 9cc306d tối giản hơn nữa: đúng 1 dòng `@AGENTS.md` (bỏ import FEATURE_INTAKE — chuyển vào nhánh change-request của AGENTS.md); cảnh báo "never wrap @ lines in backticks"; lane-dependent context cố ý KHÔNG auto-import.
- **Where:** `CLAUDE.md`, `AGENTS.md`
- **Notable:** entry point tối giản + progressive disclosure theo request class và phase.
- **Seen:** 9cc306d

### component-taxonomy-coverage
- **What:** HARNESS_COMPONENTS.md map mọi file/capability vào 11 responsibilities (task spec, context selection, tool access, memory, state, observability, failure attribution, verification, permissions, entropy, intervention) + cross-reference NexAU 7 components kèm trạng thái Covered/Partial/Missing.
- **Where:** `docs/HARNESS_COMPONENTS.md`
- **Notable:** taxonomy 11-responsibility là khung phân loại harness tổng quát tốt — đối chiếu được với taxonomy của forgent.
- **Seen:** 14e6f10

### templates-first
- **What:** `docs/templates/`: story, decision (Context/Decision/Reasoning/Alternatives/Implications), spec-intake, validation-report, high-risk-story 4 file.
- **Where:** `docs/templates/`
- **Notable:** mọi artifact loại đều có khuôn — agent điền form thay vì sáng tác cấu trúc.
- **Seen:** 14e6f10

## tooling

### rust-cli-ddd-layering
- **What:** harness-cli ~25 lệnh, kiến trúc DDD 4 tầng (interface/application/domain/infrastructure — domain 1.3k LOC không phụ thuộc ngoài); rusqlite bundled; migrations SQL versioned (001–008).
- **Where:** `crates/harness-cli/src/`
- **Notable:** "parse-first boundary rule" — dữ liệu lạ parse tại boundary trước khi vào inner code.
- **Seen:** 14e6f10

### tool-registry-capability
- **What:** Registry 2 chiều: capability manifest (harness cung cấp) + inbound tools project đăng ký (kind: cli/binary/mcp/skill/http; capability kebab-case; responsibility); `tool check` probe presence; agent query trước bước cần tool.
- **Where:** `docs/TOOL_REGISTRY.md`, `scripts/schema/003/005-*.sql`
- **Notable:** "Absent tool capability is a clean skip, never a failure" — degradation contract tường minh.
- **Seen:** 14e6f10

### orchestration-protocol-v1
- **What:** Contract công khai versioned cho consumer ngoài (Symphony là consumer đầu tiên): discovery trước mutation (`query contract --json` — không auto-init), mỗi lệnh `--json` in đúng 1 JSON envelope ra stdout, exit codes cố định (0/2/3/4/5), timeout semantics ("mutation timeout = unknown outcome → rediscover trước khi retry"), forward-compat (unknown fields tolerated, unknown protocol version = hard fail), "branch on error `code`, never on message", output limit 16 MiB.
- **Where:** `docs/contracts/harness-orchestration-v1.md`, `crates/harness-cli/src/interface.rs` (machine_mode)
- **Notable:** đây là cách đúng để 2 agent system nói chuyện qua CLI — sinh ra từ chính nhu cầu tách Symphony; cấm path-dependency/submodule/fork, chỉ protocol + released artifacts.
- **Seen:** 9cc306d

### epoch-fence-migration-guard
- **What:** Guard chống ghi trong lúc migration lớn: file lock (fs2) + journal checksummed SHA-256 với state machine `fenced → switched_pending_validation → complete/compensated`; mọi lệnh mutate phải acquire guard trước khi chạy; journal incomplete → fail-closed.
- **Where:** `crates/harness-cli/src/epoch_fence.rs`
- **Notable:** cơ chế "đóng băng có kiểm soát" cho cutover — read vẫn chạy, write bị chặn theo giai đoạn.
- **Seen:** 9cc306d

### symphony-web-board
- **What:** Web UI backend (2.3k LOC) serve kanban board dependency-aware: work list, run management, status.
- **Where:** `crates/harness-symphony/src/web.rs`
- **Notable:** mặt người quan sát cho fleet run — harness không chỉ CLI.
- **Status:** moved-to-symphony @9cc306d
- **Seen:** 14e6f10

### doctor-preflight
- **What:** `symphony doctor` kiểm tra readiness: git/worktree, repo harness-enabled, CLI binary, env vars, .gitignore đúng, agent command, PR capability.
- **Where:** `crates/harness-symphony/src/doctor.rs`
- **Notable:** chẩn đoán môi trường trước khi chạy — giảm cả lớp lỗi "environment seam".
- **Status:** moved-to-symphony @9cc306d
- **Seen:** 14e6f10

## config-packaging

### prebuilt-binary-release
- **What:** CI build đa nền tảng (5 targets) + sha256; installer tải binary theo release tag và verify checksum; CLI release tách khỏi repo content.
- **Where:** `.github/workflows/harness-cli-release.yml`, `scripts/build-harness-cli-release.sh`, decision 0005
- **Notable:** user không cần Rust toolchain — hạ rào cản cài đặt.
- **Seen:** 14e6f10

### post-merge-maintenance-automation
- **What:** GitHub Action sau merge: detect PR chạm CLI/schema → tự bump patch version, prepend CHANGELOG, chuẩn bị **candidate commit** rồi gọi release workflow. Từ 9cc306d: post-merge **không còn tạo tag** — tag annotated chỉ được promote sau khi matrix 5 platform pass (xem proof-before-tag-promotion).
- **Where:** `.github/workflows/post-merge-maintenance.yml`
- **Notable:** versioning + changelog tự động, nhưng quyền tạo tag đã chuyển cho proof gate.
- **Seen:** 9cc306d

### installer-merge-modes
- **What:** install-harness.sh/.ps1 với --merge (giữ cũ, thêm thiếu) / --override (backup + thay) / --refresh-agent-shim / --dry-run; payload khai báo trong harness-install-files.txt dùng chung 2 installer.
- **Where:** `scripts/install-harness.sh`, `scripts/install-harness.ps1`, `scripts/harness-install-files.txt`
- **Notable:** conflict handling là first-class option, không phải prompt ngẫu hứng.
- **Seen:** 14e6f10

### proof-before-tag-promotion
- **What:** 2 proof contract tách biệt cho release: (a) pinned upgrade-source artifact chạy **frozen baseline** chỉ chứa hành vi version đó từng hứa; (b) candidate build chạy full protocol + installer contract hiện tại. Tag annotated chỉ tạo SAU khi toàn bộ matrix jobs pass; **failed tag bất biến** — không move/delete, recovery tiến lên patch version mới (monotonic).
- **Where:** decision 0010, `.github/workflows/harness-cli-release.yml`, `scripts/verify-harness-cli-release-identity.sh`, `promote-harness-cli-release-tag.sh`
- **Notable:** học từ sự cố thật (run 29222332569 để lại tag v0.1.16 không asset): "historical baseline không được chấm bằng contract hiện tại" — bug so-sánh-lệch-version kinh điển.
- **Seen:** 9cc306d

## repo-layout

### policy-vs-durable-separation
- **What:** Gitignore có chủ đích: harness.db (+wal/shm) ignored, `.harness/*` ignored NHƯNG `.harness/changesets/` committed (negation pattern); `.symphony/` transient; binary tải về ignored.
- **Where:** `.gitignore`
- **Notable:** ranh giới "cái gì là truth trong git" được viết thành comment giải thích từng nhóm.
- **Seen:** 14e6f10

### repo-separation-playbook
- **What:** Playbook tách product khỏi template (E11, 12 stories): provenance-preserving filtered import (không snapshot mù); bootstrap + validate ở đích TRƯỚC khi xóa nguồn; cross-repo story handoff bằng non-runnable source proxies + checksummed target receipts ("never retire source row to make dependency appear satisfied"); parity suite + recoverable tag/bundle làm điều kiện xóa; boundary tests assert cây sạch hai phía; changesets sống không phải test fixture — thay bằng synthetic fixtures.
- **Where:** decision 0009, `docs/stories/epics/E11-*/` (migration-manifest.md), `tests/boundary/`, `tests/cutover/`
- **Notable:** trọn bộ kỷ luật "tách repo mà không mất truth" — hiếm thấy được document + test kỹ thế này.
- **Seen:** 9cc306d

### gitattributes-line-endings
- **What:** `.gitattributes`: *.sh eol=lf, *.ps1 eol=crlf, *.yml eol=lf.
- **Where:** `.gitattributes`
- **Notable:** chi tiết nhỏ nhưng cứu cross-platform installer khỏi lỗi CRLF kinh điển.
- **Seen:** 14e6f10

## safety

### hard-gates-intake
- **What:** Hard gates tại intake: auth, authorization, data loss, audit/security, external provider, validation removal → luôn high-risk (trừ khi scope thu hẹp tường minh); high-risk đòi confirmation + decision record.
- **Where:** `docs/FEATURE_INTAKE.md`
- **Notable:** rủi ro "không thể thương lượng" tách khỏi rủi ro đếm flag.
- **Seen:** 14e6f10

### sql-read-only-enforcement
- **What:** `query sql` và mọi lệnh không-mutate chạy với `PRAGMA query_only = 1` + rusqlite authorization hooks; write attempt → lỗi `QuerySqlReadDenied`. Quyền ghi gắn vào phân loại lệnh (`Cli::mutates_state()`), không vào lời hứa của caller.
- **Where:** `crates/harness-cli/src/infrastructure.rs` (DbConfig), US-081/US-101
- **Notable:** cùng triết lý request-authority nhưng ở tầng db — read-only là thuộc tính cưỡng chế được.
- **Seen:** 9cc306d

## self-improvement

### growth-rule-friction
- **What:** "The harness grows from friction" — gặp confusion/lặp tay/thiếu rule → sửa harness ngay HOẶC `backlog add` với predicted impact; đóng với actual outcome; `query backlog --closed` để đối chiếu.
- **Where:** `docs/HARNESS.md` §Growth Rule
- **Notable:** nguồn gốc của backlog-outcome-loop mà bee thừa kế.
- **Seen:** 14e6f10

### audit-propose-pipeline
- **What:** Phase 5 pipeline 3 nhánh: validate (`score-context` + `audit` entropy/drift) → check (`verify-all`) → improve (`propose` sinh improvement proposals từ pattern friction + intervention). Từ 9cc306d: `propose` là read-only, bulk `--commit` bị cấm — xem proposal-lifecycle-explicit.
- **Where:** `PHASE5.md`, decisions 0007/0008, CLI `audit`/`propose`
- **Notable:** self-improvement là pipeline cơ học audit được, không phải "agent tự nghĩ cách tốt hơn".
- **Seen:** 9cc306d

### proposal-lifecycle-explicit
- **What:** Vòng đời cải tiến event-sourced (decision 0008): `propose` read-only; người accept/reject **từng proposal key** (`--accept KEY --outcome-after-traces N` / `--reject KEY --reason`); proposal_key = SHA-256 unicode-normalized versioned theo rule; evidence links (trace/intervention/audit/legacy) gắn cấu trúc vào occurrence; evidence mới sau implement = **regression**, sau reject = **reconsideration** — đều cần acceptance mới; outcome observation ghi confirmed/ineffective/reverted theo lịch; legacy backfill conservative, hàng mơ hồ báo người chọn chứ không tự rewrite.
- **Where:** decision 0008, migrations 009–012, CLI `propose`/`backlog outcome record`/`query improvement-health`
- **Notable:** đo được "cải tiến có thực sự giúp không"; cùng gene 2-human-gates với bee-evolving nhưng dạng dữ liệu hóa hoàn toàn — hai bên hội tụ độc lập về "explicit accept per item".
- **Seen:** 9cc306d

## ux

### lane-output-format
- **What:** Intake trả kết quả theo format cố định 5 dòng (Lane/Reason/Docs/Story/Validation) — người liếc là hiểu, máy parse được.
- **Where:** `docs/FEATURE_INTAKE.md`
- **Notable:** structured output cho bước giao tiếp người-máy quan trọng nhất.
- **Seen:** 14e6f10

## testing-evals

### external-benchmark-repo
- **What:** Repo `harness-benchmark` riêng đo từng phase: harness compliance %, trace quality score, lane accuracy (6/6), friction captured (N/6 tasks); phase chỉ được coi là đạt khi benchmark xác nhận.
- **Where:** `PHASE2.md`–`PHASE5.md` (expected deltas), CHANGELOG
- **Notable:** eval harness bằng benchmark ngoài, có baseline và delta kỳ vọng khai báo trước — mức trưởng thành eval cao nhất trong 2 reference.
- **Seen:** 14e6f10

### release-ci-verification
- **What:** Release workflow: fmt check + cargo test toàn workspace + bash -n installers + smoke test binary trên cả 5 platform trước khi publish. Từ 9cc306d: thêm release identity guard (tag format, source SHA ancestry, crate/lock version match, annotated-only, proof-run ownership) + upgrade proving từ pinned v0.1.14 trên từng platform + reverify checksums trước publish.
- **Where:** `.github/workflows/harness-cli-release.yml`, `tests/release/`
- **Notable:** smoke test đúng lệnh người dùng sẽ chạy, per-platform; identity guard có bộ negative cases đầy đủ.
- **Seen:** 9cc306d

### repo-contract-test-suite
- **What:** Thư mục `tests/` mới (53 file, 12 nhóm): release guards (identity/promotion/workflow/recovery), cutover readiness schema (JSON envelope + SHA-256 sidecars, negative: duplicate platforms, substituted releases), boundary asserts (harness-only tree, symphony ownership, history allowlist), core command contracts (positive + negative), schema replay idempotency, installer modes cả PowerShell, task-authority + doc-contracts tests. `premerge.yml` chạy contract + upgrade proving trên mọi PR.
- **Where:** `tests/`, `.github/workflows/premerge.yml`, `scripts/validate-premerge.sh`
- **Notable:** repo tự mang contract tests cho chính quy trình vận hành của nó (release, separation, authority) — "quy trình cũng có test suite".
- **Seen:** 9cc306d
