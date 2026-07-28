---
name: symphony
type: git-repo
url: https://github.com/hoangnb24/symphony
local: upstreams/symphony
last_analyzed_commit: 2f0b257
last_analyzed_date: 2026-07-13
domains_covered: [harness, skills, hooks, workflow, orchestration, routing, context-memory, planning, quality-gates, docs-style, tooling, config-packaging, repo-layout, safety, self-improvement, ux, testing-evals, integration-contract]
---

# Symphony — Feature Index

Local orchestrator chạy Harness stories: discover runnable work qua public Harness CLI protocol → chuẩn bị workspace cô lập → giao agent một run contract → validate kết quả → giữ product changes + durable changeset reviewable. **Standalone product** — KHÔNG cần checkout Harness, KHÔNG link source, KHÔNG đọc DB tables, KHÔNG copy SQLite; chỉ nói chuyện qua typed protocol. Tách khỏi repository-harness (E11, decision 0009 phía harness); các entry `moved-to-symphony` trong `sources/repository-harness.md` là ảnh chụp phía harness lúc tách — index này là symphony HIỆN TẠI (2f0b257), đã tiến hóa. ~11K LOC Rust (crate `harness-symphony`) + React/Electron web-ui. Inventory gốc: `plans/reports/distill-inventory-260713-2122-symphony-*.md`.

## integration-contract

### typed-runtime-boundary
- **What:** Standalone product giao tiếp với engine (Harness) CHỈ qua versioned protocol, không bao giờ qua source/DB/tables. Contract khai báo compatibility tuple pinned (harness-cli-v0.1.14, protocol 1, schema range 1..=13, current DB 12..=13, 10 required capabilities), executable discovery order 4 nấc (config → HARNESS_CLI_PATH → scripts/bin → PATH), invocation boundary (env vars tường minh, read 30s/mutation 300s timeout, output 16 MiB). "Only `.symphony/state.db` remains directly owned through SQLite by Symphony; harness.db remains opaque behind protocol."
- **Where:** `docs/contracts/harness-runtime-v1.md`, `docs/SYMPHONY_SCOPE.md`, `crates/harness-symphony/src/harness_protocol.rs`
- **Notable:** đây là cách đúng để tách một product khỏi platform mà không fork — capabilities là "behavioral promises, not product names"; là mặt consumer thực chứng của repository-harness:orchestration-protocol-v1 (giờ có bên gọi thật, không còn giả định). Xác nhận platform-boundary là contract, không phải shared code.
- **Keywords:** compatibility tuple, capabilities, runtime boundary
- **Seen:** 2f0b257

### product-boundary-non-goals
- **What:** SYMPHONY_SCOPE.md khai báo tường minh ranh giới sản phẩm dạng bảng "Harness owns X / Symphony owns Y" + 11 non-goals rõ ràng (không reimplement intake/risk/schema, không đọc-ghi tables, không vendor Harness source, không coi local DB là collaboration state, không đòi PR provider/design tool/personal skill tree, không hứa cross-machine scheduling...). Cause-effect flow 9 bước từ work-graph → select → snapshot → worktree → agent → changeset → validate → human accept → sync.
- **Where:** `docs/SYMPHONY_SCOPE.md`
- **Notable:** kỷ luật "một product biết mình KHÔNG sở hữu gì" — hiếm thấy được viết thành contract; đối lập với xu hướng harness ôm hết. Cặp với typed-runtime-boundary.
- **Seen:** 2f0b257

## orchestration

### isolated-run-contract
- **What:** Story → run cô lập: git worktree `symphony/{run_id}` + snapshot harness.db (qua protocol `db snapshot`, WAL-safe) + RUN_CONTRACT.json v1 + AGENTS.md shim → agent chạy → validate RESULT.json (version=1, run_id/story_id khớp, outcome hợp lệ, validation evidence bắt buộc) + SUMMARY.md → promote artifacts. Contract v1 mang required_outputs, result_json_schema, forbidden_paths, agent_instructions tường minh. Tiny lane được `--here` (in-place, vẫn snapshot DB riêng), normal/high-risk bắt buộc worktree.
- **Where:** `crates/harness-symphony/src/run.rs`, `docs/SYMPHONY_SCOPE.md`
- **Notable:** run contract là "prompt đủ để dispatch" cấp orchestrator — cùng gene cell/story self-contained (beegog:cell-task-unit, repository-harness:story-packets) nhưng ở tầng run isolation; tiến hóa từ repository-harness:symphony-isolated-runner với result validation + forbidden-paths chặt hơn.
- **Keywords:** RUN_CONTRACT.json, worktree, --here
- **Seen:** 2f0b257

### agent-adapter-codex-jsonrpc
- **What:** Agent dispatch qua adapter cắm được: `custom` (spawn command, chờ exit success) hoặc `codex` (full JSON-RPC app-server: handshake initialize→thread/start→turn/start, event loop 250ms, idle reconciliation sau 30s không event thì query turn-state, terminal khi turn/completed status="completed"). Env truyền vào: HARNESS_REPO_ROOT/DB_PATH/RUN_ID/RUN_MODE. Executable resolve qua absolute/relative/PATH.
- **Where:** `crates/harness-symphony/src/agent.rs`
- **Notable:** adapter abstraction cho phép nhiều agent runtime; codex adapter là một protocol client JSON-RPC hoàn chỉnh với idle-timeout reconciliation — cơ chế "agent im lặng ≠ agent chết" ở tầng transport, tinh vi hơn status-token của bee.
- **Keywords:** codex, app-server, adapter, idle reconcile
- **Seen:** 2f0b257

### bounded-auto-polling
- **What:** Unattended mode opt-in (enabled=false mặc định): validate → poll work-graph → enqueue candidate → chạy tuần tự với caps (once / max_runs / max_attempts=3 / poll_interval=30s / max_idle_cycles), single-active-run enforce. Chỉ source `harness-db` được chạy; external sources (github-issues/linear/jira/remote-harness) trả AdapterBoundary — ranh giới tường minh chưa build.
- **Where:** `crates/harness-symphony/src/auto.rs`, `crates/harness-symphony/src/config.rs`
- **Notable:** autonomy có ngân sách + mutex; tiến hóa từ repository-harness:auto-polling-bounded, thêm external-source boundary tường minh (declare "chưa support" thay vì im lặng). Cùng triết lý bound-autonomy với beegog:gate-bypass-safety-floor nhưng bằng caps thay vì floor.
- **Keywords:** auto mode, poll, caps, single-active-run
- **Seen:** 2f0b257

## routing

### run-and-queue-state-machine
- **What:** Tầng 1 (state-routing): run lifecycle `prepared/running → completed|blocked|needs_intake|partial|failed|cancelled` (terminal); single-active-run lock — `add_run()` từ chối nếu còn run active (ActiveRunExists), giải phóng khi vào terminal. Auto-queue riêng: `queued → running (attempts++) → completed | (retry) queued | failed (attempts≥max)`. Migration fence RAII guard (BEGIN IMMEDIATE, rollback nếu drop chưa commit) chặn ghi trong lúc migration. Tất cả trong `.symphony/state.db` do symphony sở hữu.
- **Where:** `crates/harness-symphony/src/state.rs`
- **Notable:** hai state machine song song (run + queue) + fence — mọi transition có precondition enforce trong SQLite transaction; hội tụ với repository-harness:story-status-single-door (CAS) và beegog:phase-machine-cli-owned về "transition là API có precondition".
- **Keywords:** single-active-run, migration fence, auto-queue
- **Seen:** 2f0b257

### board-state-precedence-derivation
- **What:** Tầng 2 (task-routing): board state của mỗi story suy ra bằng precedence order cố định: implemented→Done → changed→NeedsAttention → cycle→Blocked → có run active→InProgress → run terminal (failed/blocked→NeedsAttention, completed+synced→Done, completed+PR→Review, completed thiếu PR artifact→NeedsAttention) → incomplete blockers→Blocked → planned/in_progress→Ready → retired→Done. Work classification riêng: runnable yes/warn/no + reason ("proof command missing", "changed story needs human review"...).
- **Where:** `crates/harness-symphony/src/work.rs`
- **Notable:** "trạng thái hiển thị + việc kế tiếp" là hàm precedence thuần từ story status + run state + deps — không phán đoán; cùng họ derived-dispatch với repository-harness:runnable-derived-dispatch nhưng phong phú hơn (6 board state, có recovery routing).
- **Keywords:** board state, precedence, runnable classification
- **Seen:** 2f0b257

### discovery-before-mutation-client
- **What:** Tầng 3 (cross-system routing): MỌI thao tác chạm harness (run prep, sync, selector, web mutation) mở đầu bằng `preflight()` — discover contract (read-only, chấp nhận DB missing) rồi validate protocol version, schema range, database_state, capabilities, HARNESS_DB_PATH env declaration; fail TRƯỚC mọi mutation. Exit code 0/2/3/4/5 map sang error code, "branch on code not message"; mutation timeout = unknown outcome → rediscover + query status trước retry; unknown code 2..=5 tolerated (additive).
- **Where:** `crates/harness-symphony/src/harness_protocol.rs`, `docs/contracts/harness-runtime-v1.md`
- **Notable:** bên GỌI thật của repository-harness:protocol-next-action-table — decision table giờ có consumer thực thi đúng từng rule; discovery-before-mutation là invariant enforce bằng code, không chỉ khuyến nghị trong contract.
- **Keywords:** preflight, discovery-before-mutation, exit code
- **Seen:** 2f0b257

## context-memory

### changeset-content-sha-immutability
- **What:** Durable changes chảy về harness qua semantic changeset (JSONL, header `changeset.header` mang run_id). Symphony state ghi changeset_sync với content_sha256 BẤT BIẾN: update chỉ khi first-write (sha='') hoặc sha khớp, lệch → ChangesetContentConflict. Sync workflow: preflight → acquire migration fence → validate checkout dirtiness (chỉ cho phép `.harness/symphony.yml`, `.harness/runs/`, `.tsbuildinfo`) → apply qua protocol → re-query verify SHA + applied flag khớp trước/sau. Idempotent: đã apply cùng SHA → skip.
- **Where:** `crates/harness-symphony/src/sync.rs`, `crates/harness-symphony/src/changeset.rs`, `crates/harness-symphony/src/state.rs`
- **Notable:** content-addressed identity chống double-apply lệch nội dung ở tầng consumer — cùng cơ chế với repository-harness:changeset-event-sourcing, xác nhận qua ranh giới hai product; SHA verify hai đầu (trước+sau apply) là kỷ luật hiếm.
- **Keywords:** content_sha256, idempotent, changeset sync
- **Seen:** 2f0b257

### run-artifact-durability-split
- **What:** Bảng tường minh phân loại độ bền từng artifact: product/code/docs → branch/PR; `.harness/changesets/*.jsonl` → commit + retain; SUMMARY.md/RESULT.json/logs → local, compactable; harness.db → local, rebuildable; `.symphony/state.db` → local only. Hệ quả phát biểu thẳng: "successful run ≠ merged change" — result valid trong khi branch còn chờ review; PR merge KHÔNG mutate DB clone khác, `sync` mới detect changeset committed và apply một lần.
- **Where:** `docs/SYMPHONY_SCOPE.md`, `crates/harness-symphony/src/retention.rs`
- **Notable:** tách "chạy xong" khỏi "đã merge" khỏi "đã durable" thành 5 mức bền rõ ràng — sắc hơn state-vs-log của bee ở chỗ phân biệt cả branch-pending vs committed; retention chỉ nén run artifacts, không đụng changeset (keep_last≥1).
- **Keywords:** durability split, successful run vs merged
- **Seen:** 2f0b257

## safety

### forbidden-paths-commit-guard
- **What:** Runtime chặn stage các path cấm khi commit chuẩn bị PR/run: `harness.db`, `.symphony/state.db`, `.symphony/runs/**`, `.symphony/worktrees/**` — git diff --cached kiểm tra, một path khớp → reject cả commit ("forbidden path staged for commit"). Cùng guard ở cả run.rs (result validation) lẫn pr.rs (branch prep). `--here` bị từ chối cho lane non-tiny (kiểm tra hai lần).
- **Where:** `crates/harness-symphony/src/run.rs`, `crates/harness-symphony/src/pr.rs`
- **Notable:** "local index không bao giờ lọt vào git" enforce bằng cơ chế tại commit-time, không bằng .gitignore đơn thuần (doctor còn check .gitignore riêng); ranh giới lane-isolation cứng (tiny mới được in-place).
- **Seen:** 2f0b257

## tooling

### doctor-preflight-10-checks
- **What:** `doctor` chạy 10 readiness check tuần tự, mỗi cái Pass/Warn/Fail + next-action cụ thể: git available, git worktree support, repo root, harness database-or-changesets (warn nếu chỉ có changesets → gợi `db rebuild`), harness protocol contract (preflight), .gitignore entries, agent adapter, PR adapter (gh), unapplied changesets (→ gợi `sync`), optional providers (clean skip nếu không đăng ký). Conditional: gitignore/changeset/provider check chỉ chạy nếu protocol check pass.
- **Where:** `crates/harness-symphony/src/doctor.rs`
- **Notable:** chẩn đoán môi trường TRƯỚC khi chạy, mỗi fail kèm hành động sửa — tiến hóa từ repository-harness:doctor-preflight (thêm changeset-sync + optional-provider check); Warn≠Fail cho phép degrade thay vì chặn cứng.
- **Keywords:** doctor, readiness, preflight
- **Seen:** 2f0b257

### web-board-recovery-actions
- **What:** Web UI (HTTP 127.0.0.1:4317, 9 API route + SPA) serve kanban board dependency-aware; mỗi run có `failure_summary` (category/reason/latest_error/evidence_artifacts/next_action) + `recovery_action` typed (kind/label/endpoint/confirmation) — nút UI dẫn tới đúng endpoint recover (retry executor, recover task, retry PR, sync). Review endpoint gộp status/changeset preview/validation/changed files/artifact links/suggested next action.
- **Where:** `crates/harness-symphony/src/web.rs`
- **Notable:** mặt người quan sát cho fleet run, nhưng điểm học là recovery-action được TÍNH từ run state (không phải nút tĩnh) — routing lỗi thành hành động sửa cụ thể; tiến hóa từ repository-harness:symphony-web-board.
- **Keywords:** kanban, recovery action, failure summary
- **Seen:** 2f0b257

### optional-provider-degrade-ladder
- **What:** Design-review provider (Impeccable) là external optional, KHÔNG dependency/bundle. Degrade ladder 3 nấc: (1) không đăng ký → skip sạch, ghi `design-review: inactive`, không fail validation; (2) đăng ký nhưng thiếu/hỏng → tiếp tục required checks, warn degraded, mark proof weak nếu workflow đòi; (3) present → thêm audit tùy chọn, bổ sung không thay thế required evidence. Cấm thêm `.impeccable`/`.codex`/`.agents` vào repo; intake-griller cũ archived ngoài runtime discovery path.
- **Where:** `docs/OPTIONAL_TOOLING.md`
- **Notable:** "absent tool capability = clean skip, never a failure" (repository-harness:tool-registry-capability) làm cụ thể thành ladder 3 mức + quy tắc "optional tool phải externally-installable và cleanly-absent" — chính là lý do impeccable bị gỡ khỏi harness template.
- **Keywords:** degrade ladder, optional provider, clean skip
- **Seen:** 2f0b257

## config-packaging

### checksum-verified-standalone-release
- **What:** Release 5 platform (aarch64/x86_64 darwin, aarch64/x86_64 linux-gnu, x86_64 windows-msvc), mỗi archive kèm `.sha256` sidecar + `release-manifest.json` v1 (per-artifact: archive_sha256, web_asset_sha256, metadata/provenance/sbom sha256). Verifier recompute MỌI checksum, reject duplicate/opaque-DB/harness-source, so internal metadata với manifest (không tin producer). Native job = 1 triple; aggregate = đủ 5 triple + clean source. Build reproducible byte-identical (sorted entries, gzip timestamp suppressed). Install = verify sha → tar → chạy, không cần Cargo.
- **Where:** `docs/RELEASING.md`, `docs/contracts/release-manifest-v1.md`, `docs/decisions/0008-symphony-release-layout.md`
- **Notable:** tiến hóa từ repository-harness:prebuilt-binary-release + proof-before-tag-promotion, gộp thành standalone product release với manifest machine-readable + reproducible build; signing/notarization/auto-update deferred tường minh.
- **Keywords:** release manifest, 5-platform, reproducible, sha256
- **Seen:** 2f0b257

### resource-manifest-self-check
- **What:** Executable tự validate `share/harness-symphony/resource-manifest.json` (version/paths/shape/hash/required index) TRƯỚC khi serve packaged web assets; release verifier recompute Web tree hash để bind actual bytes vào archive checksum. Archive layout ổn định (`bin/harness-symphony[.exe]`, `share/harness-symphony/web-ui/**`, metadata/provenance/sbom); backend định vị web assets relative `../share`. Archive không chứa checksum của chính nó (circular hash).
- **Where:** `docs/decisions/0008-symphony-release-layout.md`, `docs/SYMPHONY_SCOPE.md`, `README.md`
- **Notable:** binary tự kiểm packaged resources của mình runtime — chống asset drift/tamper giữa build và chạy; path-safety trong manifest (no absolute, no `..`, no empty segment) là chi tiết bảo mật đáng học.
- **Keywords:** resource manifest, web assets, self-check
- **Seen:** 2f0b257

## skills

### impeccable-externalized-not-removed
- **What:** Skill design-review Impeccable (từng in-template ở harness) nay là external optional provider, không sống trong repo symphony; intake-griller skill archived dưới `archive/extensions/harness-intake-griller/` — deliberately ngoài hidden runtime discovery path, không executable, không required.
- **Where:** `docs/OPTIONAL_TOOLING.md`, `archive/`
- **Notable:** kết cục của repository-harness:impeccable-design-skill và :intake-griller-interview (đánh dấu removed @9cc306d bên harness) — không xóa tri thức mà externalize + archive; xác nhận nguyên tắc "optional tooling phải externally installable and cleanly absent". Xem optional-provider-degrade-ladder cho cơ chế runtime.
- **Seen:** 2f0b257
