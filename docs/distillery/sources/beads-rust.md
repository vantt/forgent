---
name: beads-rust
type: git-repo
url: https://github.com/Dicklesworthstone/beads_rust
local: upstreams/beads-rust
last_analyzed_commit: ab0288cb
last_analyzed_date: 2026-07-15
domains_covered: [harness, skills, hooks, workflow, orchestration, routing, integration-contract, context-memory, planning, quality-gates, docs-style, tooling, config-packaging, repo-layout, safety, self-improvement, ux, testing-evals]
---

# beads-rust (br) — Feature Index

Rust reimplementation của beads (`br`, tác giả Dicklesworthstone — KHÁC người với Go `bd` của Steve Yegge). **Đây là source SIÊU đối chiếu**: br fork Go bd tại kiến trúc "classic" (SQLite + JSONL, PRE-Gastown) rồi **cố ý bỏ đúng những hướng bd đã đi** — Dolt-as-truth, Gastown multi-agent (agent/molecule/gate/rig/convoy), daemon/RPC, federation, Linear/Jira — và thay vào đó tôi-luyện chính cái lõi classic đó bằng độ nghiêm Rust + một tầng safety/reliability/agent-ergonomics dày. LoC ~33k so với ~276k của Go bd (`docs/ARCHITECTURE.md`), `#![forbid(unsafe_code)]`, clippy pedantic+nursery deny. Là bằng chứng "con đường KHÔNG đi" của beads:dolt-as-versioned-truth — sibling giữ nguyên SQLite+JSONL-classic và chứng minh lõi đó vẫn đủ khi single-writer + cần git-diffable. Scope scan: conceptual model + agent-facing surface + storage/sync/reliability mechanics + testing/self-improvement disciplines; KHÔNG quét 273 file Rust cấp dòng (sqlite.rs 24k dòng chỉ đọc cấu trúc). Inventory gốc: `plans/reports/distill-beads-rust-core-model-260715.md`, `plans/reports/distill-beads-rust-agent-surface-260715.md`, `plans/reports/distill-beads-rust-storage-sync-260715.md`, `plans/reports/distill-beads-rust-quality-ecosystem-260715.md`.

## harness

### agent-first-cli-contract-hardened
- **What:** Cùng gene "CLI cho agent làm công dân hạng nhất" với beads:agent-first-cli-contract nhưng siết chặt hơn: `--json` global mọi lệnh, stdout=data / stderr=diagnostics+error-envelope là LUẬT CỨNG (agent "parse the stream that matches the exit code"), exit-code taxonomy đóng 9 mã (0 success…8 I/O) để branch được TRƯỚC khi parse JSON, và một **stack tự-mô-tả 3 tầng**: `br capabilities` (contract metadata máy-đọc: flags/exit_codes/env_vars/safety, có drill-down per-command — "first discovery call" khuyến nghị) → `br schema` (JSON Schema per output shape: issue/ready-issue/error/…) → `br robot-docs guide` (sổ tay prose cap "under 80 lines"). Output schema versioned (`br.coordination.v1`, `br.scheduler.v1`) kèm tie-break tất định ghi thẳng trong contract.
- **Where:** `docs/AGENT_INTEGRATION.md`, `docs/CLI_REFERENCE.md`, `docs/agent/ROBOT_MODE.md`, `docs/ARCHITECTURE.md`
- **Notable:** vượt beads ở chỗ hợp đồng agent KHÔNG chỉ là "có đường máy-đọc" mà là **tự-mô-tả có tầng + versioned**: capabilities/schema/robot-docs tách metadata-hành-vi khỏi schema-dữ-liệu khỏi sổ-tay-người, mỗi thứ độc lập ở text|json|toon. Đối chiếu beehive:unified-dispatcher-command-registry (schema+examples test chạy thật) — br thêm chiều "contract_version" để consumer dò tương thích. Bài học: interface agent-facing nên tự khai version + exit-code-trước-JSON để consumer fail sạch.
- **Keywords:** capabilities, robot-docs, schema, exit-code taxonomy, contract_version, stdout/stderr split, br.coordination.v1
- **Seen:** ab0288cb

## integration-contract

### agent-baseline-golden-snapshots
- **What:** `agent_baseline/` là **bộ regression golden-snapshot cho CHÍNH bề mặt agent-facing** (không phải dữ liệu app): help text, JSON Schema, ví dụ JSON/TOON, transcript `br --help`, và một "zero-shot fresh-agent journey log" — tất cả check-in và diff với binary live bằng test `agent_baseline_snapshots_match_current_binary`; đổi có chủ đích thì regenerate bằng `UPDATE_AGENT_BASELINE=1`. `AGENT_JOURNEY_NOTES.md` là log UX thật: mục tiêu "validate that a fresh agent can use br using only docs + --help (no source reading)", ghi 3 task thử + chỗ mắc + doc-fix theo sau — vừa là phát hiện UX vừa là seed test ghim lại. Là một mảnh của bộ lớn hơn "Agent Contract Drift Verifier" (deterministic, no network/git/Mail).
- **Where:** `agent_baseline/AGENT_JOURNEY_NOTES.md`, `docs/AGENT_INTEGRATION.md`
- **Notable:** hội tụ với beehive:hook-contract-parity-tests (byte-drift) và fgOS conformance — nhưng br đẩy tới bề mặt AGENT-FACING OUTPUT: help/schema/ví dụ trôi so với binary thì FAIL CI y như API test gãy. Thứ beehive/harness đều CHƯA có ở dạng này (họ test contract nội bộ, br test cả contract mà agent ngoài dựa vào). Cực hợp forgent vì fgOS định vị platform mà agent app tiêu thụ — "fresh-agent journey" là acceptance test cho agent-UX. Đi cặp `agent-friendliness-self-audit`.
- **Keywords:** golden snapshot, agent_baseline, contract drift, fresh-agent journey, UPDATE_AGENT_BASELINE, verify-agent-contracts
- **Seen:** ab0288cb

### toon-token-output
- **What:** TOON ("token-optimized object notation") là format output thứ tư (cạnh json/text/csv) với **"safe key folding"** — key lồng nhau bị flatten thành key chấm (`schemas.IssueDetails`) để tiết kiệm token; giải mã ngược về JSON bằng binary riêng `tru` (crate `toon_rust`). Nhiều lệnh (`coordination status`, `capabilities`, `schema`, `scheduler`, `stats`) có cờ `--stats` để **BÁO token savings đo được** thay vì chỉ khẳng định. Env `BR_OUTPUT_FORMAT` > `TOON_DEFAULT_FORMAT` cho default không cần lặp `--format` mỗi lệnh.
- **Where:** `docs/agent/ROBOT_MODE.md`, `docs/CLI_REFERENCE.md`, `docs/ARCHITECTURE.md`
- **Notable:** format output tự-đo-hiệu-quả (giải-mã-lại-được nên không mất mát) là góc UX token-efficiency mà chưa nguồn nào trong distillery chạm — forgent tiêu thụ nhiều JSON agent-to-agent, "output tối ưu token có số đo" đáng cân nhắc cho biên agent↔agent. Cảnh báo: thêm một binary phụ (`tru`) vào đường consume là chi phí phụ thuộc.
- **Keywords:** TOON, safe key folding, tru, token savings, --stats, BR_OUTPUT_FORMAT
- **Seen:** ab0288cb

## context-memory

### sqlite-jsonl-classic-truth
- **What:** Mô hình truth 2 tầng của lõi classic: SQLite (`.beads/beads.db`, gitignored) là primary/working store; JSONL (`.beads/issues.jsonl`, git-tracked) là "authoritative interchange copy"; thêm base-snapshot `.beads/beads.base.jsonl` để phân biệt sửa-SQLite với sửa-JSONL trong 3-way merge. Derived state (dirty flags, blocked cache, export hash, child counters) rebuild được, KHÔNG bao giờ được phép cao hơn primary. Schema `CURRENT_SCHEMA_VERSION = 14` cố ý khớp Go bd classic để interop. Events (audit log) chỉ ở DB, không export JSONL.
- **Where:** `docs/ARCHITECTURE.md`, `src/storage/schema.rs`, `src/sync/path.rs`, `docs/SYNC_SAFETY.md`
- **Notable:** **con đường KHÔNG đi của beads:dolt-as-versioned-truth.** bd @303e263 rẽ sang Dolt-as-truth (version control TRONG store) khi multi-agent write thành tải chính; br cố ý đứng lại ở SQLite+JSONL-classic và tôi-luyện nó (health contract, sync safety, write-combining) thay vì đổi engine. Là bằng chứng ĐỐI TRỌNG mạnh cho luật changeset của forgent (changeset-event-sourcing): một sibling độc lập giữ "DB là view, JSONL committed là git-diffable truth" và chứng minh lõi đó vẫn đủ ở single-writer + cần git-diff. Điểm phải-xem-lại vẫn y nguyên: khi multi-writer thành tải chính (chỗ bd rẽ).
- **Keywords:** SQLite primary, JSONL interchange, beads.base.jsonl, 3-way merge, schema v14, derived-state rebuildable, road-not-taken
- **Seen:** ab0288cb

## safety

### sync-safety-blast-radius
- **What:** Toàn bộ mô hình an toàn của `br sync` là **câu trả lời cho một sự cố thật**: Go `bd sync` từng "deleted all repository source files" vì sync có quá nhiều quyền (chạy git, sửa file bất kỳ). br "phải CHỨNG MINH nó không thể làm vậy" bằng: (1) KHÔNG có `Command::new("git")` trong `src/sync/` — enforce bằng **CI grep contract** (`grep -rn 'Command::new.*git' src/sync/` phải ra 0), không chỉ test; (2) path allowlist cứng (`ALLOWED_EXTENSIONS`/`ALLOWED_EXACT_NAMES`, chỉ ghi trong `.beads/`, `.git/` bị từ chối); (3) atomic temp+rename; (4) guard chống mất dữ liệu: empty-DB/stale-DB cần `--force`, còn tombstone-protection & conflict-marker scan **KHÔNG override được** by design; (5) `sync_safety_witness.sh` trace syscall thật (`strace`) khi chạy sync live, assert MỌI path bị mutate nằm trong allowlist, emit JSONL `{ts,op,path,allowed,reason_if_blocked}`. `br sync` trần bị từ chối — phải chọn `--flush-only`/`--import-only`/`--merge`/`--status` tường minh.
- **Where:** `docs/SYNC_SAFETY.md`, `src/sync/path.rs`, `docs/SYNC_MAINTENANCE_CHECKLIST.md`, `tests/e2e_scripts/sync_safety_witness.sh`
- **Notable:** hội tụ ĐỘC LẬP với beehive:allowlist-not-redaction (cross-repo-data-boundary) — cả hai là bài học falsified-by-data hiếm: chặn-bằng-allowlist-cho-phép, không chặn-bằng-danh-sách-cấm; và cả hai sinh từ sự cố mất dữ liệu thật. br thêm hai vũ khí đắt giá: invariant "không gọi git" biến thành **grep CI test-được** (design promise → cơ học kiểm được), và **strace witness** chứng minh blast-radius bằng syscall thật chứ không bằng assert output. Bài học thẳng cho mọi thao tác điểm-không-quay-đầu của forgent (đã có tiền lệ repo-divorce).
- **Keywords:** path allowlist, no-git CI grep, strace witness, tombstone protection, atomic temp+rename, explicit sync mode, incident-driven
- **Seen:** ab0288cb

### workspace-health-contract
- **What:** Một **từ vựng health chung** cho mọi bề mặt: 4 mức Healthy / Degraded (mọi op cho phép + advisory) / Recoverable (primary còn, DB hỏng → read-only tới khi phục hồi) / Unsafe (interchange hỏng không cứu được → dừng tới khi sửa tay), cài 1:1 trong `WorkspaceHealth` với `is_operable()/needs_recovery()/is_fatal()`. Startup, `doctor`, write-recovery, `sync --status` đều phân loại workspace bằng CÙNG taxonomy + cùng recovery envelope thay vì mỗi chỗ tự bịa error story. Composite health = **max(individual severities)** (nhiều Degraded KHÔNG leo thành Recoverable). Honesty tường minh: `sync --status` chạy probe RẺ hơn `doctor` và ghi rõ "vắng mã anomaly = 'chưa đánh giá', KHÔNG phải 'đã pass'".
- **Where:** `docs/reliability/HEALTH_CONTRACT.md`, `src/health.rs`, `docs/ARCHITECTURE.md`
- **Notable:** giải bài "mỗi surface kể một câu chuyện lỗi khác nhau" bằng một enum + recovery envelope dùng chung — cùng tinh thần glossary-driven-vocab của harness nhưng cho HEALTH runtime. Chi tiết vàng: probe-rẻ ghi rõ "absence = not evaluated" chống đọc-nhầm partial-check thành clean bill. Hợp forgent reliability layer + beehive baseline-gate (never build on red có thể diễn đạt bằng health state chung).
- **Keywords:** 4-state health, composite=max severity, shared vocabulary, absence≠passed, recovery envelope, is_operable
- **Seen:** ab0288cb

### non-invasive-by-construction
- **What:** Quyết định kiến trúc bao trùm: "**br sẽ ÍT xâm lấn hơn bd**" — không auto git commit/push/pull, không auto-install git hook, không daemon/RPC background, không Dolt. Git là việc của AGENT, không phải của br. `br serve` (MCP) có nhưng stdio-only, feature-gated, không phải daemon/network listener. Kèm là cắt scope thẳng tay: toàn bộ Gastown (agent/molecule/gate/rig/convoy types, HOP fields, session mgmt — "~40% codebase complexity") loại vĩnh viễn khỏi br, để dành cho "br2 nếu cần".
- **Where:** `docs/porting/PLAN_TO_PORT_BEADS_WITH_SQLITE_AND_ISSUES_JSONL_TO_RUST.md`, `README.md`, `docs/ARCHITECTURE.md`
- **Notable:** kỷ luật "công cụ KHÔNG tự tiện chạm cây của bạn" đẩy thành invariant kiểm được (xem `sync-safety-blast-radius`). Đối chiếu AGENTS.md forgent A2/D4 (workshop ≠ ./repo, hook/git không cross boundary ngầm) — cùng gene "tách quyền, không xâm lấn ngầm". LoC 8x nhỏ hơn nhờ cắt scope là minh chứng "less is more" khi mục tiêu là lõi bền vững thay vì bề rộng tính năng.
- **Keywords:** non-invasive, no auto-git, no daemon, Gastown excluded, scope cut, br2, less-invasive-than-bd
- **Seen:** ab0288cb

## orchestration

### coordination-evidence-classifier
- **What:** `br coordination status` là **bộ phân loại bằng-chứng thuần đọc** cho claim stale/abandoned trong swarm — KHÔNG auto-reclaim, KHÔNG gọi Agent Mail live, KHÔNG git, KHÔNG mutate. Nguyên tắc lõi: "Missing Agent Mail data is explicit evidence, not proof of abandonment". Ngưỡng theo loại chủ (swarm-agent stale 120'/abandoned 480'; human stale 1440'/abandoned 4320') là `pub const` khớp doc. Emit envelope `br.coordination.v1` per claim (`reclaim_allowed_by_policy`, `required_human_confirmation`, `evidence_summary`, `suggested_commands`) và **giữ lại suggested_commands** cho claim tươi/reservation-đang-sống/snapshot-xấu/chủ-người. Reclaim luôn là audit-comment-TRƯỚC-rồi-claim (lệnh đầu luôn là comment kiểm toán). `br audit coordination` chuẩn hóa snapshot thành `coordination_incident` append vào `.beads/interactions.jsonl` với `snapshot_hash` (JSON sorted-keys) — flight recorder content-addressed, không phải store thứ hai.
- **Where:** `docs/COORDINATION_EVIDENCE.md`, `src/coordination.rs`, `docs/CLI_REFERENCE.md`
- **Notable:** **hội tụ độc lập với beehive:cross-session-atomic-claims** ở đúng nguyên tắc "reclaim đòi bằng chứng, không cướp-nhầm" (beehive: reclaim cần CẢ TTL-hết LẪN heartbeat-cũ; br: audit-comment-first + missing-data-không-phải-proof). Khác tầng: beehive enforce cơ học bằng O_EXCL lock; br là tầng ADVISORY thuần-đọc phía trên, tách phân-loại (pure, no I/O) khỏi hành-động (human-gated). Đúng thứ forgent multi-agent fan-out cần: một lớp "khuyên có bằng chứng" không bao giờ tự tay cướp việc. Đi cặp same-checkout-multi-session-coordination (mechanical) — br cho mảnh advisory-evidence còn thiếu.
- **Keywords:** coordination status, evidence not proof, never auto-reclaim, audit-comment-first, snapshot_hash, flight recorder, br.coordination.v1
- **Seen:** ab0288cb

### two-tier-locking-app-backoff
- **What:** Hai primitive concurrency KHÁC nhau cho mục đích khác nhau: `.write.lock` blocking exclusive (serialize MỌI process mutate, timeout mặc định 30s, fast-path `try_lock()` rồi poll) vs `.sync.lock` advisory non-blocking (`try_sync_lock` trả `Ok(None)` khi bận, không chờ). Trên nữa, `with_write_transaction` retry `BEGIN IMMEDIATE` 8 lần với **exponential backoff + ±25% jitter** (~12.7s tổng) — và cố ý đặt `busy_timeout=0` vì busy-wait native của fsqlite hot-spin 100% CPU; app-level backoff thay để desync dưới contention. WAL checkpoint PASSIVE mỗi 50 mutation (không chặn reader/writer). Mid-mutation DB hỏng → `retry_mutation_with_jsonl_recovery` rebuild DB từ JSONL rồi chạy lại closure (staged event-attribution phải sống qua retry).
- **Where:** `src/coordination.rs`, `src/health.rs`, `docs/SWARM_SCALE_TUNING.md`, `docs/reliability/HEALTH_CONTRACT.md`
- **Notable:** bài học concurrency thực chiến: (a) tách lock chờ-được vs lock thử-rồi-bỏ theo ngữ nghĩa; (b) khi backend busy-wait đốt CPU, tắt nó và tự backoff+jitter ở app-level để chống thundering-herd — cực hợp forgent nếu swarm nhiều agent tranh cùng store. Đối chiếu cạn: beehive dùng O_EXCL file claim + TTL/heartbeat; br thêm chiều backoff-jitter chống contention storm mà beehive chưa cần (chưa nhiều writer đồng thời).
- **Keywords:** .write.lock vs .sync.lock, BEGIN IMMEDIATE, jittered backoff, busy_timeout=0, thundering herd, WAL passive checkpoint, jsonl-recovery retry
- **Seen:** ab0288cb

### scheduler-swarm-planning
- **What:** `br scheduler` xếp hạng việc-cho-swarm tất định, output mang `schema: "br.scheduler.v1"` + "fallback policy so agents can parse the result safely and preserve conservative ordering when evidence ties" — tie-break tất định ghi thẳng trong contract. Kèm runbook `SWARM_SCALE_TUNING.md`: profile `--lock-timeout` (1000ms probe / default / 60000ms bulk), `BR_DISABLE_READ_ONLY_FAST_OPEN`, per-agent `CARGO_TARGET_DIR` isolation, và một "swarm capacity-planning report" (`br.swarm-capacity-report.v1`) phát green/yellow/red "agent bands" + laptop/small-VM fallback guidance từ số đo count/sync-status/doctor.
- **Where:** `docs/CLI_REFERENCE.md`, `docs/SWARM_SCALE_TUNING.md`
- **Notable:** ranking swarm-work có schema versioned + tie-break tất định là mảnh planning mà forgent multi-agent sẽ cần (đối chiếu beehive:orchestrator-assigns-workers wave analysis). "Capacity band" report biến năng lực host thành khuyến nghị số-agent — thực dụng cho fleet không-người-trông.
- **Keywords:** br scheduler, br.scheduler.v1, deterministic tie-break, lock-timeout profile, agent bands, capacity planning
- **Seen:** ab0288cb

## routing

### cross-project-routing
- **What:** ID với prefix lạ (`api-123`) tự dispatch sang workspace `.beads/` khác qua bảng `.beads/routes.jsonl` (prefix→path), acquiring lock của workspace ĐÍCH. Ranh giới an toàn tường minh: "Routing never runs git, copies repositories, or performs network sync… Routes are a local dispatch table for explicit cross-workspace operations" — KHÔNG phải multi-repo sync.
- **Where:** `docs/CLI_REFERENCE.md`, `README.md`, `docs/ARCHITECTURE.md`
- **Notable:** thêm địa-chỉ-hóa xuyên-repo mà KHÔNG vi phạm ràng buộc non-invasive/no-network — đối lập federation-topologies của beads (SyncOrchestrator, Dolt remotes, sync thật). Là "địa chỉ, không đồng bộ": cùng nhu cầu multi-repo nhưng cắt xuống local dispatch table. Hợp forgent nếu quản việc xuyên nhiều project mà muốn giữ mỗi repo tự chủ.
- **Keywords:** routes.jsonl, prefix routing, local dispatch table, no network sync, cross-workspace
- **Seen:** ab0288cb

## workflow

### workflow-gates-policy
- **What:** `br gate` — gate requirement khai trong `.beads/policy.yaml` dưới `workflow.gates`, keyed theo transition `"from -> to"`, enforce "tại chokepoint close/transition: chuyển vào state gated bị từ chối tới khi mọi gate required pass". Có sẵn gate `min_reviewers` (thỏa bởi N provider `reviewer`/`reviewer:<who>` báo `pass`). Ready-status cũng cấu hình được: `workflow.status_groups.ready` (default `[open]`) — luật ready thành policy thay vì hardcode.
- **Where:** `docs/CLI_REFERENCE.md`, `README.md`
- **Notable:** gate như precondition-chuyển-trạng-thái KHAI BÁO (policy.yaml) enforce tại chokepoint — đối chiếu beehive:four-gates-code-enforced (gate cứng trong code) và beads:gate-beads-event-driven (gate là node đồ thị). br chọn tầng giữa: gate là DỮ LIỆU config, enforce tại một cửa. Rẻ để chỉnh policy không đổi code; hợp forgent nếu muốn gate/ready-rule tunable per-project.
- **Keywords:** br gate, policy.yaml, from->to transition, min_reviewers, status_groups.ready, declarative gate
- **Seen:** ab0288cb

## hooks

### precommit-doctor-gate
- **What:** `.githooks/pre-commit` opt-in (bật per-clone bằng `git config core.hooksPath .githooks`, KHÔNG auto-install — khớp invariant non-invasive). Fail-open: `.beads/` không có → exit 0; `br` không trên PATH → exit 0 + note. Ngược lại chạy `br doctor --quick --json` (fast path <1s, chỉ detector rẻ); exit non-zero → **chặn commit** với summary 1 dòng (rút `workspace_health` qua jq) + bước kế đề xuất. Hook TỰ NÓ không bao giờ gọi `--repair` — repair để cho lệnh operator tường minh, audit riêng. Bypass: `BR_DOCTOR_SKIP_PRECOMMIT=1`.
- **Where:** `.githooks/pre-commit`, `docs/reliability/HEALTH_CONTRACT.md`
- **Notable:** hook chỉ CHẨN ĐOÁN, không tự sửa — tách "phát hiện" (rẻ, tại commit) khỏi "sửa" (đắt, audit riêng, operator chủ động). Cùng triết lý fail-open của beehive:fail-open-crash-wrappers (hook hỏng/thiếu binary không chặn commit). Bài học: gate pre-commit nên fast + diagnose-only + bypass tường minh, không giấu hành động destructive vào hook.
- **Keywords:** pre-commit, br doctor --quick, opt-in hooksPath, fail-open, diagnose-not-repair, BR_DOCTOR_SKIP_PRECOMMIT
- **Seen:** ab0288cb

## quality-gates

### reliability-gate-suite
- **What:** Hợp đồng gate reliability phải-pass-trước-ship: 4 test suite có tên (`workspace_failure_replay`, `e2e_sync_failure_injection`, long-lived-stress với `BR_LONG_STRESS_ITERATIONS=8`, `e2e_interleaved_command_families_preserve_workspace_integrity`). "Release builds depend on the gate job by default; manual release workflow có emergency override đòi WRITTEN REASON trước khi build artifact bỏ gate". Kèm CI gates thường: `cargo test --release --no-fail-fast`, clippy `-D warnings`, fmt --check, insta --check, + 2 shell harness (forced_cycle_close_audit, sync_safety_witness).
- **Where:** `docs/reliability/HEALTH_CONTRACT.md`, `docs/TESTING_GUIDELINES.md`, `tests/e2e_scripts/sync_safety_witness.sh`
- **Notable:** release phụ thuộc gate job + **override cần lý-do-viết** là cùng gene proof-before-tag của harness và baseline-gate của beehive (never build on red) — nhưng br gắn gate vào chính release build và làm bypass thành hành-động-ghi-vết. Hợp forgent release engineering: gate không phải khuyến nghị mà là dependency của artifact, phá gate để lại dấu.
- **Keywords:** reliability gate, release depends on gate, written-reason override, failure replay, concurrency interleave, stress iterations
- **Seen:** ab0288cb

### snapshot-review-log-gate
- **What:** Snapshot test (dùng `insta`): CẤM blanket-accept `cargo insta review`. Mỗi delta snapshot chấp nhận phải log trong `docs/snapshot_review_<DATE>.md` với nhãn cause-class (A feature add / B output-format change / C new subcommand / D fixture change / E insta metadata / **R regression — "Do not accept until fixed"**). CI gate `cargo insta test --check` FAIL build nếu có `*.snap.new` nào không có review-log khớp. Sinh từ sự cố thật: "PR #283 (`--slug`) shipped without snapshot refresh and accumulated 21 stale `.snap` files".
- **Where:** `docs/SNAPSHOT_TESTING.md`
- **Notable:** biến "accept snapshot" từ thao-tác-vô-thức thành QUYẾT-ĐỊNH-phân-loại-ghi-vết — chống chính xác cái bug "drift ẩn regression sau feature flag / đổi wording error mà support đã train agent theo". Cực hợp fgOS vì đổi output agent-facing (mà agent khác dựa vào) không được trôi ngầm — đi cặp agent-baseline-golden-snapshots (cùng nỗi lo: output-drift là API-break).
- **Keywords:** insta snapshot, review-log-as-gate, cause-class label, R=regression-block, snap.new check, PR#283 incident
- **Seen:** ab0288cb

### no-id-pinning-lint
- **What:** Meta-test `tests/no_id_pinning.rs` grep chính test-suite tìm assert trên generated content-hash ID (`assert_eq!(issues[0].id, "test-c75c9ac8")` ← FRAGILE) vì hash đổi theo hash-fn/rephrase-fixture/ORDER-BY-tiebreak. Escape hatch: annotation `// invariant: <reason>` inline + allowlist cứng `KNOWN_LEGITIMATE_HITS`. Thay vào đó cung cấp helper assert-thứ-tự (`assert_priority_ordered`, `assert_oldest_first`, `assert_no_duplicate_ids`, `assert_contains_exactly_one`) trong `tests/common/ordering.rs`.
- **Where:** `tests/no_id_pinning.rs`, `docs/TESTING_GUIDELINES.md`
- **Notable:** biến một kỷ luật code-review ("đừng pin ID sinh ra") thành GATE CI grep-được, với escape-hatch có lý do — cùng gene "invariant kiểm được bằng grep" của sync-safety-blast-radius. Đi cặp beads:hash-id-adaptive-length: nếu forgent dùng hash-ID cho work-unit đa-agent thì đây là kỷ luật test đi kèm (test đúng invariant thứ-tự, không pin giá trị không tất định).
- **Keywords:** no_id_pinning, meta-lint, generated-id fragility, // invariant escape, ordering assertions, KNOWN_LEGITIMATE_HITS
- **Seen:** ab0288cb

## self-improvement

### isomorphism-refactor-ledger
- **What:** `refactor/artifacts/2026-04-24-shrink-pass-1/` là vết bằng chứng một lần chạy skill refactor agent-driven **gated bằng proof-đẳng-cấu**: agent quét candidate duplication/simplification, chấm điểm `(LOC_saved × Confidence) / Risk >= 2.0`, và CHỈ được apply nếu chứng minh behavior-preservation — nếu không thì viết card rejected, không chạm source. Ba cơ chế đắt: (a) **red-baseline-repair-first** — pass thấy suite đỏ 6 target thì SỬA baseline trước (ghi `Order 0` trong `LEDGER.md`) rồi mới refactor; (b) mỗi card (`cards/D1.md`) có **"Equivalence contract" 10 trục** (input coverage, ordering, tie-break, error semantics, laziness, short-circuit, float, RNG/hash order, side effects, public API) — mỗi trục bị buộc-cân-nhắc chứ không bỏ qua; (c) candidate đụng file đang bị agent khác reserve (Agent Mail) → REJECT ghi lý do (`REJECTIONS.md`), không im lặng bỏ. Rejection broad-scope G1 vì "active peer edits + broken baseline → broad refactor làm attribution tệ đi".
- **Where:** `refactor/artifacts/2026-04-24-shrink-pass-1/LEDGER.md`, `refactor/artifacts/2026-04-24-shrink-pass-1/cards/D1.md`
- **Notable:** hội tụ với beehive:evolving-loop-two-gates + grooming-project-first nhưng đẩy tới **proof-per-candidate + refuse-on-red + honor-cross-agent-reservation**: refactor không phải "làm cho gọn" mà là "chứng minh đẳng-cấu hoặc từ chối, ghi vết cả hai đường". 10-trục equivalence contract là checklist chống "refactor đổi hành vi ngầm" đáng bê thẳng. Red-baseline-repair-first = cùng luật never-build-on-red của beehive nhưng áp cho self-modification. Đi cặp reliability-gate-suite.
- **Keywords:** shrink-pass, isomorphism proof, equivalence contract 10-axis, red-baseline-repair-first, reservation-conflict reject, LEDGER, scored candidates
- **Seen:** ab0288cb

### rollout-ladder-design-before-code
- **What:** Kỷ luật "thiết-kế-trước-code có proof gate", thể hiện ở 2 chỗ: (1) `WRITE_COMBINING_QUEUE_DESIGN.md` là "**design artifact only**" — `src/write_combining.rs` ship CHỈ pure classifier/envelope types, ZERO runtime wiring — nhưng doc cực nghiêm: idempotency key là điều-kiện-tiên-quyết trước mọi crash-recovery story, direct-path parity bắt buộc ("queued mutation phải behave như chạy trực tiếp"), honesty "committed-but-flush-failed" phải sống qua combining, "Candidate After Proof" chỉ mở SAU khi có parity + failure-injection test; (2) rollout ladder chung trong `SWARM_SCALE_TUNING.md`: mọi feature adaptive đi 5 nấc — direct-only baseline → shadow → advisory → opt-in serve → default-on CHỈ sau perf-bundle proof + parity test, và "mọi đường adaptive phải có direct serial fallback". Evidence discipline: mọi claim perf cần golden-behavior + resource (timing/RSS/syscall/lock-wait) + reproduction metadata.
- **Where:** `docs/WRITE_COMBINING_QUEUE_DESIGN.md`, `src/write_combining.rs`, `docs/SWARM_SCALE_TUNING.md`
- **Notable:** "ghi hợp đồng chặt TRƯỚC khi có một dòng runtime, ship type thuần cho tới khi proof gate qua" là bản trưởng thành của beehive:validate-before-execute áp cho tối-ưu-hiệu-năng: tối ưu chỉ được bật khi có golden+resource+repro evidence, luôn có fallback tắt-về-đường-thẳng. Cực hợp forgent khi thêm bất kỳ tầng adaptive/cache/fan-out nào — nấc thang shadow→advisory→opt-in→default-on + fallback bắt buộc là khung chống "bật tối ưu chưa chứng minh". Đối chiếu anti-loop-recovery-matrix (fan-out cần tiền-điều-kiện) — cùng tinh thần "không mở trước khi an toàn".
- **Keywords:** design artifact only, idempotency key prerequisite, direct-path parity, rollout ladder shadow→default-on, direct serial fallback, perf evidence triad
- **Seen:** ab0288cb

## docs-style

### agent-friendliness-self-audit
- **What:** `docs/agent/AGENT_FRIENDLINESS_REPORT.md` — dự án tự audit độ thân-thiện-agent thành artifact hạng-nhất có ngày + tác giả ("Auditor: WildAnchor (Codex / GPT-5)") + scorecard 1-5 across Documentation/CLI ergonomics/Robot mode/Schemas/Errors/Consistency + mục "Gaps / Next Improvements" tự nhận điểm yếu (chưa có dynamic `--help-json`, envelope shape chưa nhất quán, `generated_at` không tất định). Có changelog riêng (`AGENT_FRIENDLY_CHANGELOG.md`) cho đúng bề mặt này. Kèm quyết-định-modality tường minh: "CLI-only (no MCP surface)… MCP would add distribution + auth + permission surface area not required" (dù sau đó `br serve` MCP feature-gated có landing — hai doc hơi lệch thời điểm).
- **Where:** `docs/agent/AGENT_FRIENDLINESS_REPORT.md`, `docs/AGENT_INTEGRATION.md`
- **Notable:** đo chất-lượng-agent-UX như một chiều chất lượng ĐO ĐƯỢC + versioned (scorecard + gap tự khai + changelog riêng) — thứ chưa nguồn nào trong distillery làm tường minh. Hợp fgOS vì định vị platform-cho-agent: "agent dùng thứ này dễ tới đâu" nên là metric có điểm + gap, không phải cảm tính. Đi cặp agent-baseline-golden-snapshots (audit = định tính, baseline = regression tự động).
- **Keywords:** agent-friendliness audit, scorecard, gap self-disclosure, agent-facing changelog, CLI-only decision, modality tradeoff
- **Seen:** ab0288cb

## tooling

### br-only-cli-additions
- **What:** Loạt tính năng KHÔNG có trong legacy beads, br thêm mới: (1) **`.br_history/`** — snapshot JSONL timestamped tự động mỗi export, rotate theo count/age, `br history list/diff/restore/prune` (local backup, gitignored); (2) **bulk update field bất kỳ** — `br update id1 id2 id3 --status …` (legacy bd chỉ batch-close được); (3) **saved queries** — `br query save/run/list/delete` (named filter bền); (4) **CSV export**; (5) **changelog generation** — `br changelog --since/--since-tag/--since-commit` gom theo issue type. Cùng auto-detect output mode (Rich/Plain/JSON/Toon/Quiet) first-class.
- **Where:** `docs/porting/PLAN_TO_PORT_BEADS_WITH_SQLITE_AND_ISSUES_JSONL_TO_RUST.md`, `README.md`, `docs/ARCHITECTURE.md`
- **Notable:** `.br_history/` (snapshot local phục-hồi-được, độc lập git) đáng chú ý nhất cho forgent — undo-an-toàn cấp workspace không nhờ git, đối chiếu beehive HANDOFF/state (br cho lớp time-travel dữ liệu). Bulk-update + saved-query là ergonomics agent-tạo-việc-hàng-loạt. Là ví dụ "port tối thiểu rồi thêm đúng cái người dùng thiếu" thay vì bê nguyên feature set.
- **Keywords:** .br_history, bulk update, saved queries, csv export, changelog gen, output mode auto-detect
- **Seen:** ab0288cb

## config-packaging

### ci-supply-chain-pinning
- **What:** Bảo vệ supply-chain hẹp + trung thực (KHÔNG signing/SBOM/reproducible-build — checksum-only): mọi `uses:` action trong `.github/workflows/` pin full 40-char SHA; `.github/action-pins.jsonl` là inventory check-in per (workflow, action) `{sha,tag,source}`; `.github/action-pin-upstreams.jsonl` là policy "allowed upstream" chỉ để audit report-only, KHÔNG auto-apply; verifier `cargo test --test workflow_action_pins` fail khi ref không-SHA/thiếu inventory. Binary integrity ở `install.sh`: SHA-256 checksum bắt buộc (từ chối cài binary chưa verify trừ khi `--insecure-skip-checksum` tường minh) + archive member validation (chống zip-slip) + curl|bash self-reexec (tự tải về disk rồi exec chống stream-truncation). Toolchain pin cứng `nightly-2026-02-19` (`rust-toolchain.toml`).
- **Where:** `docs/CI_SUPPLY_CHAIN.md`, `install.sh`, `.github/action-pins.jsonl`, `rust-toolchain.toml`
- **Notable:** SHA-pin action + inventory check-in + update-audit report-only (không auto-bump) là mô hình supply-chain nhẹ mà kiểm được, hợp forgent CI. Trung thực đáng học: doc KHAI THẲNG "không signing, không SBOM" thay vì giả vờ — phạm vi bảo vệ khớp mối đe dọa thật (CI workflow integrity + binary checksum), không over-claim. curl|bash self-reexec là chi tiết installer hiếm ai làm.
- **Keywords:** SHA-pinned actions, action-pins.jsonl, report-only audit, checksum-only, curl-bash self-reexec, archive member validation, toolchain pin
- **Seen:** ab0288cb

## skills

### default-off-migration-skill
- **What:** Skill `bd-to-br-migration` (rewrite doc tham chiếu `bd`→`br`, "one behavioral change, mechanical transforms" — chỉ khác git handling, còn lại find-replace) được **cố ý LOẠI khỏi bundle install mặc định**, chỉ opt-in `--with-migration-skill`. Lý do ghi thẳng trong installer: "once a user has migrated, the skill just pollutes context; it's a one-time tool, not a steady-state surface". Skill có `SELF-TEST.md` (trigger-phrase table + functional test cho 2 shell script + integration prompt với agent-as-test-runner) và `subagents/batch-migrator.md` (spec subagent cho bulk ≥10 file, "one file at a time, complete+verify before next").
- **Where:** `skills/bd-to-br-migration/SKILL.md`, `install.sh`
- **Notable:** phán-đoán lifecycle sắc: skill dùng-một-lần KHÔNG nên nằm trong context steady-state — loại khỏi default bundle là quyết-định-context-pollution nướng thẳng vào installer, không để tùy user mỗi lần cài. Bài học thẳng cho beehive/forgent bundling: phân biệt skill-thường-trực vs skill-một-lần, đừng để công cụ đã-xong-việc ăn context mãi. Cùng gene skill-conventions (headless, budget) của beehive nhưng ở tầng install-policy.
- **Keywords:** default-off skill, one-time tool, context pollution, opt-in --with-migration-skill, SELF-TEST agent-as-runner, batch-migrator subagent
- **Seen:** ab0288cb

## testing-evals

### synthetic-scale-and-witness-harness
- **What:** Hạ tầng test/eval theo naming convention chặt (`e2e_*`, `repro_*` cho bug ID, `proptest_*`, `conformance_*` br-vs-Go-bd parity, `storage_*`, shell harness emit JSONL). Notable: **synthetic scale** sinh JSONL tất định 10k–250k issue (CI) tới **1,000,000 issue / 10,000 simulated agent** (`BR_SYNTHETIC_MILLION=1`), validate qua `br sync --import-only`/`doctor`/`sync --status` thật; **contention replay lab** ghi worker-id/command/timing/estimated-lock-wait + "replay seed", replay dựng lại workspace từ trace và báo worker/event phân-kỳ đầu tiên; **NUMA/high-core profile** (lscpu/numactl/hyperfine + strace -c, golden stdout/stderr per command) → `br.numa-read-command-profile.v1`; **E2E coverage matrix** (61 lệnh, 93%, gap có tên) tự-ghi provenance "Original agent: SilentFalcon (opus-4.5)". Sync-safety witness (`sync_safety_witness.sh`) trace syscall thật.
- **Where:** `docs/TESTING_GUIDELINES.md`, `docs/SWARM_SCALE_TUNING.md`, `tests/e2e_scripts/sync_safety_witness.sh`
- **Notable:** eval-bằng-corpus-tổng-hợp-tất-định + replay-lab-từ-trace là tầng testing swarm-scale mà forgent multi-agent sẽ cần để chứng minh không vỡ ở tải cao; đối chiếu external-benchmark của harness (delta khai trước) — br thêm "replay từ seed để tái hiện contention bug" và coverage-matrix tự-ghi-model-tác-giả. Bài học: test scale phải tất định + tái hiện được, không phải chạy-một-lần-may-rủi (cùng gene "diễn tập giết-thật" trong critical-patterns forgent).
- **Keywords:** synthetic million, contention replay seed, NUMA profile, e2e coverage matrix, conformance br-vs-bd, deterministic scale corpus, provenance
- **Seen:** ab0288cb
