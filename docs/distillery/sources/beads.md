---
name: beads
type: git-repo
url: https://github.com/steveyegge/beads
local: upstreams/beads
last_analyzed_commit: 777d24b87
last_analyzed_date: 2026-07-14
domains_covered: [harness, skills, hooks, workflow, orchestration, routing, integration-contract, context-memory, planning, quality-gates, docs-style, tooling, config-packaging, repo-layout, safety, self-improvement, ux, testing-evals]
---

# Beads (bd) — Feature Index

Memory/task-graph **cho coding agents** (Steve Yegge, Go, ~1.6k file — production-grade, dogfood chính nó qua `issues.jsonl` + `.beads/`). Issue là node đồ thị với 10 loại dependency; "ready work" là truy vấn dẫn xuất; agent có memory loop (`bd remember`/`bd prime`) và vòng đời workflow hóa-học (formula→molecule). **Phát hiện quan trọng nhất @303e263: beads đã PIVOT khỏi JSONL-as-truth** — Dolt SQL (`.beads/dolt/`, versioned-DB, gitignored) giờ là canonical source, JSONL chỉ còn là interchange/export. Scope scan: conceptual model + agent-facing docs + storage-truth mechanics + engdocs ADR/design; KHÔNG quét 1.6k file Go hay 18 integration. Inventory gốc: `plans/reports/distill-inventory-260714-0030-beads-*.md`.

## harness

### agent-first-cli-contract
- **What:** CLI thiết kế cho agent làm công dân hạng nhất: `--json` bắt buộc cho mọi consume tự động; cấm `bd edit` (interactive) trong agent session — chỉ flags; non-interactive shell patterns; session-completion protocol cố định (quality gates → push → handoff); context profiles cho từng loại agent. AGENT_INSTRUCTIONS 520 dòng là "hợp đồng hành vi" chi tiết nhất trong 5 nguồn (code standards, visual design Unicode-not-emoji, testing isolation). Từ 777d24b: ba tinh chỉnh agent/script-facing — persistent `--no-color` (gọi `ui.DisableColors()` sớm trong PersistentPreRun, song song `NO_COLOR`/`CLICOLOR=0`, cho phép pipe không cần set env); `bd list --external-ref <v>` exact-match + `--external-contains` (agent-hook tìm bead theo GitHub branch/Jira ticket không cần full-scan client-side); `bd lint` chấp nhận `## Acceptance Criteria` thay `## Success Criteria` CHỈ cho epic (LLM codegen hay sinh "Acceptance Criteria" — accommodation additive, phủ cả 3 đường lint/create --validate/doctor --check=conventions).
- **Where:** `AGENTS.md`, `AGENT_INSTRUCTIONS.md`, `README.md`, `cmd/bd/main.go`, `cmd/bd/list_filter.go`, `internal/validation/template.go`
- **Notable:** cùng gene agent-facing-docs với fgOS nhưng ở mức CLI-contract: mọi lệnh có đường máy-đọc, mọi tương tác agent bị cấm đường interactive — "agent không được dùng UI của người". Đợt 777d24b cho thấy hợp đồng này TIẾN HÓA theo lỗi thực của agent: filter thêm để tránh full-scan, lint nới để khớp thói quen sinh của LLM — contract chạy theo hành vi agent quan sát được, không phải suy diễn trước.
- **Keywords:** --json, non-interactive, session completion, --no-color, --external-ref, epic acceptance-criteria
- **Seen:** 777d24b

## workflow

### formula-molecule-lifecycle
- **What:** Workflow như hóa học: **formula** (định nghĩa TOML/JSON: steps, variables, deps) → instantiate thành **molecule** (proto → molecule → closed/squashed/burned) → **wisp** (vapor, ephemeral). Bonding = ghép động các formula. Molecule là tập bead thật trong đồ thị — workflow đang chạy KHÔNG phải state riêng mà là issues có cấu trúc.
- **Where:** `docs/workflows/`, `docs/core-concepts/`
- **Notable:** workflow-as-issues — mọi bước chạy đều là node đồ thị query được bằng cùng công cụ với task thường; đối lập fgOS (workflow schema riêng + state file riêng). Squash/burn là compaction có chủ đích của workflow đã xong.
- **Keywords:** formula, molecule, wisp, bonding, squash
- **Seen:** 303e263

## routing

### ready-work-ten-dep-types
- **What:** Tầng 1-2: `bd ready` = derived query (issue `open` + không blocker nào còn open) trên đồ thị 10 loại dependency — 4 blocking (`blocks`, `parent-child`, `conditional-blocks`, `waits-for`) + 6 non-blocking (`related`, `discovered-from`, `caused-by`, `validates`, `supersedes`, `duplicates`); claim atomic; lease TTL + heartbeat cho worker giữ việc (changelog unreleased); blocked/stale detection. Status: open/in_progress/blocked/closed/deferred; priority 0–4. Từ 777d24b: (a) **ready-ordering giờ là hợp đồng tường minh** — `(priority ASC, created_at ASC, id ASC)` = FIFO trong cùng priority-tier, pin trong protocol test `r2Less`, cùng thứ tự cho cả query-path lẫn claim-path (trước đây arbitrary); (b) **cycle detection mở rộng ra đồ thị hợp nhất** blocks + parent-child + conditional — chu trình xuyên phân cấp (con chặn cha qua ông) trước đây vô hình nay bắt được, giữ nguyên message chỉ báo blocks-only, parity 3 backend (Dolt/embedded/SQLite), `BulkAddDepsOpts` giữ semantics chu trình khi apply hàng loạt. **Chỉnh @777d24b (verbatim types.go, deep-dive schema 2026-07-15):** enum `DependencyType` trong code thực tế có **19 hằng** — 4 workflow-blocking như docs, cộng 15 loại association/graph-link/entity/reference/delegation (`replies-to`, `relates-to`, `authored-by`, `assigned-to`, `approved-by`, `attests`, `tracks`, `until`, `delegated-from`…, Decision 004 "Edge Schema Consolidation" dồn cả quan-hệ-thực-thể vào bảng edge); "10 loại" là hình trong docs, không phải hình trong code (`internal/types/types.go:781-818`).
- **Where:** `docs/core-concepts/`, `README.md`, `CHANGELOG.md`, `cmd/bd/dep.go`, `cmd/bd/protocol/ready_front_test.go`, `internal/storage/issueops/cycles.go`
- **Notable:** hội tụ thứ **5** của "next-work = derived query" (readyCells ↔ runnable ↔ board-precedence ↔ signal-consume ↔ bd ready) — và taxonomy dependency giàu nhất: phân biệt blocking/non-blocking cho phép đồ thị mang cả tri thức (caused-by, validates) lẫn điều phối mà không nghẹt ready-set. Đợt 777d24b siết đúng hai chỗ đồ thị-việc dễ hỏng ngầm: thứ-tự-lấy-việc thành hợp đồng test-được (FIFO công bằng, không đói việc cũ) và phát-hiện-chu-trình phủ toàn đồ thị hợp nhất chứ không riêng blocks — bài học cho bất kỳ hệ ready-queue nào của forgent.
- **Keywords:** bd ready, blocking deps, lease, heartbeat, atomic claim, FIFO within priority, combined-graph cycles, hierarchy shadow
- **Seen:** 777d24b

### gate-beads-event-driven
- **What:** Tầng 3: `gate` là một ISSUE TYPE — workflow pause được vật hóa thành bead trong đồ thị, với gate types: `gh:pr` (PR merged?), `gh:run` (CI xong?), `timer`, `bead` (issue khác đóng?), `human`. Molecule dừng ở gate; sự kiện ngoài thỏa → gate mở → downstream ready. Issue types mở rộng cả `message`, `event`, `role` — giao tiếp agent cũng là bead.
- **Where:** `docs/core-concepts/`, `docs/workflows/`
- **Notable:** async-gate của fgOS (signal + pause_reason) làm bằng pub-sub file; beads làm cùng bài toán bằng **node đồ thị** — gate/message/event đều query được, cùng lifecycle với task. "Mọi thứ là bead" đẩy đến cùng.
- **Keywords:** gate, gh:pr, timer, human gate, message bead
- **Seen:** 303e263

## orchestration

### multiagent-routing-and-slots
- **What:** Routing quyết định theo thứ tự tường minh: explicit flag > auto role-detection (git config `beads.role`, SSH heuristic fallback) > default. Coordination primitives: assign, atomic claim, **merge slots**. Contributor namespace isolation (ID prefix riêng); agent signing (execution trail trong commit/comment).
- **Where:** `docs/multi-agent/`, `engdocs/CONTRIBUTOR_NAMESPACE_ISOLATION.md`, `engdocs/AGENT_SIGNING.md`
- **Notable:** danh tính agent lấy từ MÔI TRƯỜNG (git config/SSH) thay vì khai báo trong prompt — chống giả mạo rẻ hơn model-guard của beehive; execution-trail signing cho audit "ai làm gì".
- **Keywords:** role detection, merge slot, namespace, signing
- **Seen:** 303e263

### federation-topologies
- **What:** Multi-repo federation: hub-spoke / mesh / hierarchical; Phase 1 = manual Dolt remotes (tracer bullet), Phase 2 = config-driven SyncOrchestrator (ADR multi-remote); multi-repo hydration + discovered-work inheritance xuyên repo; sovereignty tiers T1–T4.
- **Where:** `docs/multi-agent/`, `engdocs/adr/`, `FEDERATION-SETUP.md`
- **Notable:** bài toán "nhiều repo cùng một đồ thị việc" — chưa nguồn nào khác chạm; đáng theo dõi cho forgent nếu platform quản việc xuyên nhiều project. Phase-1-tracer-bullet trước orchestrator là kỷ luật ship đáng học.
- **Keywords:** federation, hub-spoke, SyncOrchestrator, sovereignty
- **Seen:** 303e263

## context-memory

### dolt-as-versioned-truth
- **What:** **Pivot lớn**: Dolt SQL (`.beads/dolt/`, gitignored) là single canonical source; JSONL chỉ còn interchange/export (`issues.jsonl`). Concurrency chuyển từ branch-per-worker sang **all-on-main + transaction discipline** (engdocs/design); 3-phase commit (mutation → PostWriteCommit → PostWritePush); sync qua `bd dolt push/pull` (Dolt native chứ không git).
- **Where:** `engdocs/design/`, `PROPOSAL-pluggable-storage-backends.md`, `docs/core-concepts/`
- **Notable:** hướng thứ BA của bài toán truth-store: beehive = file-in-git, harness = JSONL-in-git + db-view, beads = **versioned-DB-as-truth** (version control nằm TRONG store, không nhờ git). Đánh đổi: mất git-diffable trong repo, được multi-writer + history/branch/merge cấp DB. Evidence quan trọng cho luật changeset của forgent: quỹ đạo beads RẼ KHỎI JSONL-truth khi multi-agent write trở thành tải chính.
- **Keywords:** Dolt, all-on-main, 3-phase commit, JSONL export-only
- **Seen:** 303e263

### remember-prime-memory-loop
- **What:** Agent memory sống TRONG hệ task: `bd remember` ghi tri thức phiên, `bd prime` nạp lại đầu phiên sau — memory là bead, cùng store, cùng sync, cùng federation với việc. Kết hợp context profiles per-agent.
- **Where:** `README.md`, `AGENTS.md`, `docs/core-concepts/`
- **Notable:** trả lời câu "memory sống ở đâu" bằng "trong chính đồ thị việc" — không cần store memory riêng như fgOS; đổi lại không có typed-lifecycle (TTL/consolidation math).
- **Keywords:** bd remember, bd prime, context profile
- **Seen:** 303e263

### llm-tier-compaction
- **What:** Memory decay chủ động: compaction Tier-1 **summarize bằng Claude Haiku** (LLM rẻ); snapshot gốc được ARCHIVE trước destructive update; chỉ 4 field bị clear (design, notes, acceptance_criteria...), title/labels/events giữ nguyên.
- **Where:** `internal/compact/`
- **Notable:** "quên" = nén bằng LLM rẻ + giữ bản gốc phục hồi được — thực dụng hơn TTL thuần của fgOS (nội dung được chưng, không vứt); cost-tiering áp vào chính memory maintenance.
- **Keywords:** compaction, Haiku summarize, archive snapshot
- **Seen:** 303e263

### discovered-from-lineage
- **What:** Việc phát hiện GIỮA lúc làm việc khác được ghi bằng edge `discovered-from` (non-blocking) — dòng dõi "làm A lòi ra B" là dữ liệu đồ thị query được; inheritance xuyên repo qua federation.
- **Where:** `docs/core-concepts/`, `AGENT_INSTRUCTIONS.md`
- **Notable:** mảnh compound-learning thuần: friction/phát-hiện không rơi vào ghi chú tự do mà thành edge có ngữ nghĩa — đối chiếu capture-queue của beehive (text stub) và friction-backlog của harness (row); beads cho nó topology.
- **Keywords:** discovered-from, lineage
- **Seen:** 303e263

## tooling

### close-last-touched
- **What:** `bd close` KHÔNG có issue-id giờ đóng issue "vừa chạm" gần nhất — marker last-touched cập nhật sau mỗi create/update/show/close; không có marker → lỗi tường minh; sau khi đóng thì cập nhật lại marker (lần sau thao tác trên issue vừa-đóng, không phải marker mồ côi).
- **Where:** `cmd/bd/close.go` (lines 52-59: fallback `GetLastTouchedID`), `cmd/bd/last_touched.go`, `cmd/bd/close_last_touched_test.go`
- **Notable:** state phiên-cục-bộ không cần flag — "cái tôi vừa động vào" là ngữ cảnh ngầm đủ để bỏ id lặp lại. Test chốt marker cập nhật cả trên đường close thường (không riêng `--claim-next`), vá bug cũ chỉ update trên claim-next. Cùng họ ergonomics-cho-agent với `agent-first-cli-contract` nhưng ở tầng session-affordance.
- **Keywords:** last-touched marker, close no-arg, session-local, GH#3965
- **Seen:** 777d24b

### metadata-set-always-string
- **What:** `--set-metadata key=value` giờ LƯU MỌI value dạng JSON string, bỏ suy diễn kiểu — trước đây `toJSONValue()` suy `"1"` thành JSON integer, phá round-trip cho consumer chờ `map[string]string`; ai cần kiểu JSON tường minh dùng `--metadata-json` (đã có).
- **Where:** `cmd/bd/update.go`, `cmd/bd/metadata_edits_test.go`
- **Notable:** **thay đổi hợp đồng flag** (breaking) — chọn round-trip fidelity + dự đoán được thay cho tiện lợi suy-diễn-kiểu; phá script hiếm nào dựa vào numeric inference. Bài học hợp đồng: suy-diễn-kiểu ngầm ở biên CLI là bẫy round-trip, tách "string mặc định" khỏi "kiểu tường minh qua flag riêng".
- **Keywords:** --set-metadata, always-string, round-trip, type inference, GH#4146
- **Seen:** 777d24b

### hash-id-adaptive-length
- **What:** ID = SHA256 → base36, cắt 3–8 ký tự **thích ứng**: vượt ngưỡng 25% xác suất va chạm → tự tăng độ dài; hierarchical nesting 3 cấp (`bd-a1b2.c3.d4`); collision math có tài liệu riêng; namespace prefix per-contributor.
- **Where:** `engdocs/COLLISION_MATH.md`, `internal/idgen/`
- **Notable:** giải đúng bài multi-agent tạo ID song song không cần điều phối trung tâm (beehive dùng tên tay, harness dùng ID người đặt); adaptive-length là chi tiết trưởng thành hiếm thấy.
- **Keywords:** hash ID, base36, adaptive length, collision
- **Seen:** 303e263

### capability-gated-storage-interface
- **What:** Storage interface ~107 method lõi + 5 sub-interface TÙY CHỌN (VersionControl / HistoryViewer / RemoteStore / SyncStore / FederationStore) — backend khai capability, feature degrade sạch khi thiếu; proposal pluggable backends (Dolt/SQLite/...) chuẩn hóa ranh giới. Từ 777d24b: cùng ranh giới capability giờ điều phối **`bd doctor` chạy embedded được tới đâu** — mở embedded từng-subcommand-một (chỉ `--check=artifacts|conventions|pollution` bật, bare doctor + `--check=validate` + `--perf/--deep/--server/--migration` vẫn server-gated), quy tắc: check nào chạm DB thì gated tới khi storage-driver interface phủ được; unsupported variant in payload JSON có cấu trúc trên stderr (Go quan sát/báo, agent quyết/hành động).
- **Where:** `PROPOSAL-pluggable-storage-backends.md`, `engdocs/design/`, `cmd/bd/doctor.go`, `cmd/bd/doctor_embedded_test.go`, `cmd/bd/doctor_conventions.go`
- **Notable:** "capability = behavioral promise" áp vào STORAGE — cùng triết lý adapter-spec của fgOS và tool-registry của harness, tại một tầng khác nữa. Hội tụ chéo 3 nguồn về optional-capability-with-degradation. Đợt 777d24b là minh chứng đắt: cùng ranh giới capability đó giờ quyết định feature (doctor) khả dụng hay không theo backend — mở từng-cái-một, human-vetted, không nhấc gate cả cụm.
- **Keywords:** storage interface, capability, pluggable backend, doctor embedded, per-subcommand policy, storage boundary
- **Seen:** 777d24b

## safety

### init-safety-invariants
- **What:** 5–7 invariant init-safety viết thành ADR SAU sự cố mất dữ liệu thật: single-source identity, scope-bound flags, central chokepoint cho init, error-text-no-echo, race-safety; exit codes chuẩn. Kèm recovery runbook 5 bước (stop → backup → preview → fix → verify) cho corruption; atomicfile (tmp+fsync+chmod+rename) cho mọi ghi.
- **Where:** `engdocs/adr/`, `docs/recovery/`, `internal/atomicfile/`
- **Notable:** failure-driven invariants + runbook — cùng thể loại "học từ sự cố thật" với harness proof-before-tag (run 29222332569) và beehive critical-patterns; ba nguồn độc lập cùng nghi thức hóa bài học sau tai nạn.
- **Keywords:** init safety, recovery runbook, atomic write
- **Seen:** 303e263

## testing-evals

### hotpath-benchmark-discipline
- **What:** BENCHMARKS.md ghi số đo cụ thể theo đợt tối ưu (05/2026: 81.9% invalid-partial-ID, 96% deferred-parent-exclusion, kết quả điển hình trên M2 Pro); OpenTelemetry coverage tự nhận ~40% với roadmap Tier 1–3 và gap có tên (Dolt server lifecycle, lock-wait).
- **Where:** `BENCHMARKS.md`, `engdocs/`
- **Notable:** benchmark là tài liệu sống có số + tự khai coverage gap — cùng họ external-benchmark của harness nhưng nội bộ, per-hot-path.
- **Seen:** 303e263
