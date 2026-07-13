---
name: beads
type: git-repo
url: https://github.com/steveyegge/beads
local: upstreams/beads
last_analyzed_commit: 303e263fe
last_analyzed_date: 2026-07-13
domains_covered: [harness, skills, hooks, workflow, orchestration, routing, integration-contract, context-memory, planning, quality-gates, docs-style, tooling, config-packaging, repo-layout, safety, self-improvement, ux, testing-evals]
---

# Beads (bd) — Feature Index

Memory/task-graph **cho coding agents** (Steve Yegge, Go, ~1.6k file — production-grade, dogfood chính nó qua `issues.jsonl` + `.beads/`). Issue là node đồ thị với 10 loại dependency; "ready work" là truy vấn dẫn xuất; agent có memory loop (`bd remember`/`bd prime`) và vòng đời workflow hóa-học (formula→molecule). **Phát hiện quan trọng nhất @303e263: beads đã PIVOT khỏi JSONL-as-truth** — Dolt SQL (`.beads/dolt/`, versioned-DB, gitignored) giờ là canonical source, JSONL chỉ còn là interchange/export. Scope scan: conceptual model + agent-facing docs + storage-truth mechanics + engdocs ADR/design; KHÔNG quét 1.6k file Go hay 18 integration. Inventory gốc: `plans/reports/distill-inventory-260714-0030-beads-*.md`.

## harness

### agent-first-cli-contract
- **What:** CLI thiết kế cho agent làm công dân hạng nhất: `--json` bắt buộc cho mọi consume tự động; cấm `bd edit` (interactive) trong agent session — chỉ flags; non-interactive shell patterns; session-completion protocol cố định (quality gates → push → handoff); context profiles cho từng loại agent. AGENT_INSTRUCTIONS 520 dòng là "hợp đồng hành vi" chi tiết nhất trong 5 nguồn (code standards, visual design Unicode-not-emoji, testing isolation).
- **Where:** `AGENTS.md`, `AGENT_INSTRUCTIONS.md`, `README.md`
- **Notable:** cùng gene agent-facing-docs với fgOS nhưng ở mức CLI-contract: mọi lệnh có đường máy-đọc, mọi tương tác agent bị cấm đường interactive — "agent không được dùng UI của người".
- **Keywords:** --json, non-interactive, session completion
- **Seen:** 303e263

## workflow

### formula-molecule-lifecycle
- **What:** Workflow như hóa học: **formula** (định nghĩa TOML/JSON: steps, variables, deps) → instantiate thành **molecule** (proto → molecule → closed/squashed/burned) → **wisp** (vapor, ephemeral). Bonding = ghép động các formula. Molecule là tập bead thật trong đồ thị — workflow đang chạy KHÔNG phải state riêng mà là issues có cấu trúc.
- **Where:** `docs/workflows/`, `docs/core-concepts/`
- **Notable:** workflow-as-issues — mọi bước chạy đều là node đồ thị query được bằng cùng công cụ với task thường; đối lập fgOS (workflow schema riêng + state file riêng). Squash/burn là compaction có chủ đích của workflow đã xong.
- **Keywords:** formula, molecule, wisp, bonding, squash
- **Seen:** 303e263

## routing

### ready-work-ten-dep-types
- **What:** Tầng 1-2: `bd ready` = derived query (issue `open` + không blocker nào còn open) trên đồ thị 10 loại dependency — 4 blocking (`blocks`, `parent-child`, `conditional-blocks`, `waits-for`) + 6 non-blocking (`related`, `discovered-from`, `caused-by`, `validates`, `supersedes`, `duplicates`); claim atomic; lease TTL + heartbeat cho worker giữ việc (changelog unreleased); blocked/stale detection. Status: open/in_progress/blocked/closed/deferred; priority 0–4.
- **Where:** `docs/core-concepts/`, `README.md`, `CHANGELOG.md`
- **Notable:** hội tụ thứ **5** của "next-work = derived query" (readyCells ↔ runnable ↔ board-precedence ↔ signal-consume ↔ bd ready) — và taxonomy dependency giàu nhất: phân biệt blocking/non-blocking cho phép đồ thị mang cả tri thức (caused-by, validates) lẫn điều phối mà không nghẹt ready-set.
- **Keywords:** bd ready, blocking deps, lease, heartbeat, atomic claim
- **Seen:** 303e263

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
- **Notable:** danh tính agent lấy từ MÔI TRƯỜNG (git config/SSH) thay vì khai báo trong prompt — chống giả mạo rẻ hơn model-guard của bee; execution-trail signing cho audit "ai làm gì".
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
- **Notable:** hướng thứ BA của bài toán truth-store: bee = file-in-git, harness = JSONL-in-git + db-view, beads = **versioned-DB-as-truth** (version control nằm TRONG store, không nhờ git). Đánh đổi: mất git-diffable trong repo, được multi-writer + history/branch/merge cấp DB. Evidence quan trọng cho luật changeset của forgent: quỹ đạo beads RẼ KHỎI JSONL-truth khi multi-agent write trở thành tải chính.
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
- **Notable:** mảnh compound-learning thuần: friction/phát-hiện không rơi vào ghi chú tự do mà thành edge có ngữ nghĩa — đối chiếu capture-queue của bee (text stub) và friction-backlog của harness (row); beads cho nó topology.
- **Keywords:** discovered-from, lineage
- **Seen:** 303e263

## tooling

### hash-id-adaptive-length
- **What:** ID = SHA256 → base36, cắt 3–8 ký tự **thích ứng**: vượt ngưỡng 25% xác suất va chạm → tự tăng độ dài; hierarchical nesting 3 cấp (`bd-a1b2.c3.d4`); collision math có tài liệu riêng; namespace prefix per-contributor.
- **Where:** `engdocs/COLLISION_MATH.md`, `internal/idgen/`
- **Notable:** giải đúng bài multi-agent tạo ID song song không cần điều phối trung tâm (bee dùng tên tay, harness dùng ID người đặt); adaptive-length là chi tiết trưởng thành hiếm thấy.
- **Keywords:** hash ID, base36, adaptive length, collision
- **Seen:** 303e263

### capability-gated-storage-interface
- **What:** Storage interface ~107 method lõi + 5 sub-interface TÙY CHỌN (VersionControl / HistoryViewer / RemoteStore / SyncStore / FederationStore) — backend khai capability, feature degrade sạch khi thiếu; proposal pluggable backends (Dolt/SQLite/...) chuẩn hóa ranh giới.
- **Where:** `PROPOSAL-pluggable-storage-backends.md`, `engdocs/design/`
- **Notable:** "capability = behavioral promise" áp vào STORAGE — cùng triết lý adapter-spec của fgOS và tool-registry của harness, tại một tầng khác nữa. Hội tụ chéo 3 nguồn về optional-capability-with-degradation.
- **Keywords:** storage interface, capability, pluggable backend
- **Seen:** 303e263

## safety

### init-safety-invariants
- **What:** 5–7 invariant init-safety viết thành ADR SAU sự cố mất dữ liệu thật: single-source identity, scope-bound flags, central chokepoint cho init, error-text-no-echo, race-safety; exit codes chuẩn. Kèm recovery runbook 5 bước (stop → backup → preview → fix → verify) cho corruption; atomicfile (tmp+fsync+chmod+rename) cho mọi ghi.
- **Where:** `engdocs/adr/`, `docs/recovery/`, `internal/atomicfile/`
- **Notable:** failure-driven invariants + runbook — cùng thể loại "học từ sự cố thật" với harness proof-before-tag (run 29222332569) và bee critical-patterns; ba nguồn độc lập cùng nghi thức hóa bài học sau tai nạn.
- **Keywords:** init safety, recovery runbook, atomic write
- **Seen:** 303e263

## testing-evals

### hotpath-benchmark-discipline
- **What:** BENCHMARKS.md ghi số đo cụ thể theo đợt tối ưu (05/2026: 81.9% invalid-partial-ID, 96% deferred-parent-exclusion, kết quả điển hình trên M2 Pro); OpenTelemetry coverage tự nhận ~40% với roadmap Tier 1–3 và gap có tên (Dolt server lifecycle, lock-wait).
- **Where:** `BENCHMARKS.md`, `engdocs/`
- **Notable:** benchmark là tài liệu sống có số + tự khai coverage gap — cùng họ external-benchmark của harness nhưng nội bộ, per-hot-path.
- **Seen:** 303e263
