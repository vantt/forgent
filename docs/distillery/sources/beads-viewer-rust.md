---
name: beads-viewer-rust
type: git-repo
url: https://github.com/Dicklesworthstone/beads_viewer_rust
local: upstreams/beads-viewer-rust
last_analyzed_commit: 7f96da4
last_analyzed_date: 2026-07-15
domains_covered: [harness, hooks, workflow, orchestration, routing, integration-contract, context-memory, planning, quality-gates, docs-style, tooling, config-packaging, repo-layout, safety, ux, testing-evals, self-improvement, skills]
---

# beads-viewer-rust (bvr) — Feature Index

**Tầng phân-tích + trực-quan-hóa + xuất-máy-đọc ĐẶT TRÊN `beads`** (Rust rewrite của beads-viewer gốc, Dicklesworthstone, ~77k dòng Rust + JS/wasm frontend). Nó KHÔNG phải tracker — nó ĐỌC đồ thị issue của `beads` (`sources/beads.md`) rồi sinh ba mặt: **robot** (JSON/TOON máy-đọc cho agent), **TUI** (12 view mode cho người), **static pages** (viewer offline sql.js/wasm). Vì vậy đây là **anh em ruột của `beads`** — chỗ để học "sau khi có đồ thị-việc, làm gì với nó": triage giải-thích-được, forecast, drift, what-if, gợi ý tự-chỉnh. Đồng thời bản thân bvr là một **cuộc port spec-first** (giống repository-harness→beehive) nên có bài học riêng về kỷ luật port + conformance.

Scope scan: intelligence subsystem (`src/analysis/` 23 module) + core app (robot/tui/loader/model/export) + agent-facing docs (README/AGENTS/FEATURE_PARITY/TUI_GAP_ANALYSIS) + test discipline + frontend fallback. Inventory gốc: `plans/reports/distill-beadsviewerrust-analysis-260715-report.md`, `plans/reports/distill-beadsviewerrust-coreapp-260715-report.md`, `plans/reports/distill-beadsviewerrust-docs-260715-report.md`, `plans/reports/distill-beadsviewerrust-frontend-tests-config-260715-report.md`.

## planning

### transparent-triage-scoring
- **What:** Xếp hạng "việc nào đáng làm nhất" bằng **điểm impact 8-thành-phần MINH BẠCH**: PageRank 0.22 + Betweenness 0.20 + BlockerRatio 0.13 + PriorityBoost 0.10 + TimeToImpact 0.10 + Urgency 0.10 + Risk 0.10 (đảo — thấp=tốt) + Staleness 0.05. Trọng số CHUẨN HÓA tổng = 1.0; năm preset điều chỉnh trọng số rồi renormalize (Default, GraphHeavy, PriorityFirst, QuickWins, RiskAverse). Mỗi khuyến nghị trả về từng-thành-phần, không phải blackbox.
- **Where:** `src/analysis/triage.rs`, `benches/triage.rs`
- **Notable:** Đây là bước `beads` KHÔNG có: beads `ready` là *derived query* nhị phân (đủ điều kiện hay không); bvr biến "ready-set" thành **thứ hạng giải-thích-được** trộn cấu trúc-đồ-thị (42%) với tín hiệu vận-hành (58%). Cực sát nhu cầu fgOS "work-item nào tiếp theo" khi lifecycle bán-tự-động cần LÝ DO chọn việc, không chỉ chọn. Risk đảo dấu + staleness cap 90 ngày là hai mẹo tránh điểm phân kỳ.
- **Keywords:** impact score, weight presets, explainable ranking, PageRank, betweenness, renormalize
- **Seen:** 7f96da4

### forecast-eta-pipeline
- **What:** Ước lượng ETA cho một issue bằng pipeline: baseline = median lịch sử × hệ số phức tạp (loại issue × độ sâu × độ dài mô tả) × velocity-per-label (30 ngày trượt, dùng label CHẬM NHẤT — bi quan) + số ngày chờ blocker, kèm biên tin cậy ±delta. Mặc định 60m; fallback 1/5 median khi velocity=0. Hệ số loại: chore 0.8, feature 1.3, epic 2.0.
- **Where:** `src/analysis/forecast.rs`, `src/analysis/economics.rs`
- **Notable:** Forecast + economics (chi phí-hoàn-thành: estimate coverage %, throughput window, burn rate) cùng dựng "khi nào / tốn bao nhiêu" từ CHÍNH đồ thị-việc, không cần tool PM ngoài. Bài học: velocity đo per-label thay vì global, và bi-quan-hóa (label chậm nhất) để không hứa hẹn quá.
- **Keywords:** ETA, velocity per label, complexity multiplier, confidence bounds, burn rate
- **Seen:** 7f96da4

### greedy-topk-unblock-and-whatif
- **What:** Chọn tập việc tác-động-cao bằng **greedy submodular**: mỗi bước chọn issue mở khóa NHIỀU NHẤT các issue downstream *chưa* được mở bởi các lựa chọn trước (TopKSet, k mặc định 10; marginal vs cumulative unlocks). Kèm **what-if**: mô phỏng hoàn thành một issue → đếm direct unblocks (blocker mở duy nhất), transitive unblocks (delta actionable), ngày tiết kiệm (2.0d/transitive), PageRank delta, số cycle bị phá. `plan.rs` phân rã open issue thành connected component = track song song.
- **Where:** `src/analysis/advanced.rs`, `src/analysis/whatif.rs`, `src/analysis/plan.rs`, `src/analysis/causal.rs`
- **Notable:** Bộ ba "chọn-k-để-mở-khóa-nhiều-nhất + mô-phỏng-nếu-làm-X + tách-track-song-song" là ĐÚNG hình bài toán fgOS multi-agent + reactive fan-out: quyết định fan ra việc gì để tối đa hóa việc-sẵn-sàng kế tiếp. Greedy submodular là khung chuẩn cho "impact-first work selection".
- **Keywords:** submodular greedy, top-k unblock, what-if simulation, connected components, parallel tracks
- **Seen:** 7f96da4

## quality-gates

### graph-drift-detection
- **What:** So đồ thị-việc HIỆN TẠI với **baseline snapshot** (version, created_at, graph stats, top-10 metric/loại, toàn bộ cycle) trên 6 chiều với ngưỡng tùy chỉnh (`DriftThresholds`): cycle mới = CRITICAL; density tăng 50%→WARNING / 20%→INFO; blocked +≥5→WARNING; actionable giảm ≥30%→WARNING; node/edge đổi ≥25%; ranking shift ≥3 mục. Alert kèm baseline_value/current_value/delta. CLI `--robot-drift` không baseline → exit khác 0 + "baseline" ở stderr; `--save-baseline` để chốt mốc.
- **Where:** `src/analysis/drift.rs`, `src/analysis/alerts.rs`, `tests/cli_model_validation.rs`
- **Notable:** "Sức khỏe đồ thị-việc trôi khỏi mốc lành" thành gate đo-được: cycle mới là báo động đỏ cứng. Mô hình baseline-vs-current + exit-code-có-nghĩa dùng lại được cho bất kỳ hệ theo dõi work-graph nào của fgOS.
- **Keywords:** drift, baseline snapshot, thresholds, new cycle critical, exit code semantics
- **Seen:** 7f96da4

### size-adaptive-metric-config
- **What:** `AnalysisConfig::for_size(n)` tự TẮT metric đắt theo số node: PageRank luôn bật; Betweenness/Eigenvector bỏ nếu >10k; HITS nếu >50k; max_cycles_to_store=100; timeout 2s/metric. Preset `triage_only()` bỏ eigenvector+HITS+k-core+articulation+slack cho đường nóng. MetricStatus ghi state ("computed"|"skipped"|error) + reason + ms cho từng metric.
- **Where:** `src/analysis/graph.rs`, `src/analysis/mod.rs`
- **Notable:** Kỷ luật scaling thực dụng: thay vì "tính hết rồi chết ở đồ thị lớn", giảm cấp có chủ đích và GHI RÕ đã bỏ gì vì sao (state+reason trong output). Cùng gene với "degradation ladder" ở TUI (xem `tui-degradation-ladder`).
- **Keywords:** adaptive config, skip expensive metrics, betweenness O(V*E), skip reason, triage_only
- **Seen:** 7f96da4

## routing

### preset-weighted-hybrid-search
- **What:** Tìm kiếm hai chế độ (Text | Hybrid). Hybrid trộn 6 thành phần (text, pagerank, status, impact, priority, recency) theo **preset gắn ngữ cảnh việc**: bug-hunting (nặng priority+text), sprint-planning (nặng status), impact-first (nặng pagerank), text-only. `normalize()` đảm bảo tổng trọng số = 1.0. Song song có `recipe`: 7 preset filter+sort đặt-tên (default/actionable/blocked/review/in_progress/closed) compose bằng AND.
- **Where:** `src/analysis/search.rs`, `src/analysis/recipe.rs`, `viewer_assets/hybrid_scorer.js`
- **Notable:** Mẫu "route theo ngữ cảnh việc → nạp preset → normalize" — chọn TRỌNG SỐ chứ không chọn nhánh code. Đáng chú ý: preset scorer được MIRROR ở cả Rust (server) và JS (`hybrid_scorer.js`, client) với cùng công thức — một hợp đồng thuật toán hai-runtime.
- **Keywords:** hybrid search, preset weights, normalize, recipe filter, context-driven routing
- **Seen:** 7f96da4

## integration-contract

### robot-mode-envelope
- **What:** Mọi output máy-đọc bọc trong `RobotEnvelope { generated_at (RFC3339), data_hash (SHA256 của trạng thái issue ỔN ĐỊNH — id,status,priority,updated_at sort theo id, cắt 16 hex), output_format (json|toon), version }`. Agent CHỈ dùng `--robot-*`; `bvr` trần mở TUI và CHẶN session — nên tách tuyệt đối: workflow agent không bao giờ chạm UI người. Format resolve 3 tầng: CLI flag > env (BV_OUTPUT_FORMAT/TOON_*) > mặc định JSON.
- **Where:** `src/robot.rs`, `src/cli.rs`, `src/agents.rs`
- **Notable:** **Hội tụ độc lập với `beads:agent-first-cli-contract`** (--json bắt buộc, cấm interactive cho agent) — nhưng bvr thêm hai thứ beads chưa có: `data_hash` (agent biết dữ liệu có đổi không mà không diff) và envelope schema-validated (xem `schema-validated-output-contract`). Đúng hướng "hợp đồng CLI↔agent" fgOS cần cho lifecycle bán-tự-động.
- **Keywords:** robot envelope, data_hash, generated_at, robot-first, format precedence, no-TUI-for-agents
- **Seen:** 7f96da4

### schema-validated-output-contract
- **What:** Hợp đồng envelope + payload được TEST kiểm máy-được trên 12+ lệnh robot: `schema_validation.rs` dùng `validate_type_at` kiểm kiểu đệ quy; `e2e_robot_matrix.rs` chạy MỌI biến thể `--robot-*` qua fixture, xác nhận envelope + field payload từng-lệnh, sinh bundle chẩn đoán (stdout, stderr, replay.sh, meta fingerprint). `conformance.rs` so **JSON theo cấu trúc bất-biến-thứ-tự** (không diff dòng-dòng).
- **Where:** `tests/schema_validation.rs`, `tests/e2e_robot_matrix.rs`, `tests/conformance.rs`, `tests/testdata`
- **Notable:** Output-của-agent được đóng băng bằng test như một API. Ordering-invariant JSON comparator + typed schema là cách tránh test giòn — bài học trực tiếp cho bất kỳ hợp đồng máy-đọc nào fgOS phát ra.
- **Keywords:** schema validation, robot matrix, ordering-invariant JSON, replay bundle, envelope contract
- **Seen:** 7f96da4

## hooks

### export-hooks-lifecycle
- **What:** Export markdown chạy **pre/post-export hook** khai báo YAML: `{name, command, timeout (chuỗi "30s" hoặc int), env, on_error: fail|continue}`. Timeout mặc định 30s; `on_error: continue` cho phép chạy tiếp khi hook lỗi. Export KHÔNG có side-effect git.
- **Where:** `src/export_md.rs`
- **Notable:** Hook lifecycle nhẹ, khai-báo, có chiến lược lỗi tường minh (fail vs continue) — mẫu để mở rộng điểm-nối agent quanh một artifact mà không nhét logic vào core.
- **Keywords:** export hooks, pre/post, on_error, declarative timeout
- **Seen:** 7f96da4

## orchestration

### mcp-agent-mail-coordination
- **What:** Điều phối ĐA-AGENT qua **MCP Agent Mail** + `.agent-mail.yaml`: agent làm việc cùng-repo phối hợp qua kênh mail chuyên dụng (mục "Same Repository Workflow" trong AGENTS.md), phân biệt macro vs granular tool.
- **Where:** `AGENTS.md`, `.agent-mail.yaml`, `.agent-mail-project-id`
- **Notable:** Đây là cơ chế multi-agent-coordination KHÁC với các nguồn khác trong corpus: beehive/repository-harness dùng reservation/claim + file hold; symphony dùng typed runtime boundary; bvr dùng **message-passing (mail) giữa agent**. Trực tiếp liên quan hướng fgOS "multi-agent parallel + reactive fan-out" — một điểm thiết kế thứ ba để cân nhắc cho anti-loop coordination.
- **Keywords:** agent mail, MCP, multi-agent coordination, same-repo workflow, message passing
- **Seen:** 7f96da4

## context-memory

### commit-bead-correlation-with-feedback
- **What:** Tương quan commit↔bead: mỗi commit gắn method (exact/heuristic) + confidence + field_changes; `HistoryBeadCompat` giữ events, milestones (created/claimed/closed/reopened), cycle_time (claim→close, create→close, create→claim). **Feedback store** (`correlation.rs`): người xác nhận/bác bỏ link (Confirm/Reject/Ignore + reason), lưu JSONL, tính accuracy_rate + avg confidence — vòng tự-chỉnh độ tin. `file_intel.rs` dò orphan commit (không map bead nào) bằng file-overlap + author-proximity, đề xuất bead khả dĩ.
- **Where:** `src/analysis/git_history.rs`, `src/analysis/correlation.rs`, `src/analysis/file_intel.rs`, `src/analysis/diff.rs`, `src/analysis/history.rs`
- **Notable:** Ký ức "việc này đã làm gì trong lịch sử" dựng từ git + feedback người → tính accuracy để cải thiện. Cùng gene predicted→actual với distill outcome-loop và fgOS compound-learning: dự đoán (correlation confidence) đối chiếu thực tế (confirm/reject) để hiệu chỉnh.
- **Keywords:** commit correlation, confidence, feedback store, accuracy rate, cycle time, orphan commit
- **Seen:** 7f96da4

## tooling

### sha256-structural-metrics-cache
- **What:** `MetricsCache` in-memory: key = SHA256(node IDs sort + edges + issue statuses + config), value = GraphMetrics, TTL mặc định 5 phút, đếm hit/miss, Mutex-guarded. Hết hạn khi `inserted_at.elapsed() > ttl`; reset khi cấu trúc đồ thị đổi.
- **Where:** `src/analysis/cache.rs`
- **Notable:** Cache-key là HASH CẤU TRÚC (không phải thời gian/version) → tự invalidate khi và chỉ khi đồ thị đổi. Mẫu sạch cho mọi kết-quả-phân-tích-đắt tính lại nhiều lần trong một session tương tác/agent loop.
- **Keywords:** structural hash cache, SHA256 key, TTL, hit/miss, auto-invalidate
- **Seen:** 7f96da4

### toon-token-efficient-format
- **What:** `--format toon`: encoding compact thay JSON cho agent quan tâm chi phí token trong loop; hi sinh cú pháp JSON chặt lấy gọn/đọc-được. Env `TOON_KEY_FOLDING (off|safe)`, `TOON_INDENT` (clamp 0-16). Robot fallback JSON→TOON qua thư viện in-process.
- **Where:** `src/robot.rs`, `README.md`
- **Notable:** "Agent ergonomics là một phần bề mặt sản phẩm" — output có biến thể tiết-kiệm-token có chủ đích. Đáng cân nhắc khi fgOS phát output cho agent chạy vòng lặp dài.
- **Keywords:** TOON, token efficiency, key folding, agent ergonomics, format fallback
- **Seen:** 7f96da4

### rch-remote-compilation
- **What:** Mọi build/test chạy qua **rch** (remote compilation helper) với TMPDIR override cho ổn định CI; AGENTS.md quy định ast-grep cho biến-đổi-code an-toàn (AST) vs ripgrep cho tìm-text-thô-nhanh, và "Morph Warp Grep" cho tìm-code AI.
- **Where:** `AGENTS.md`, `build.rs`
- **Notable:** Phân vai công cụ rõ: sửa cấu trúc → ast-grep (không regex-sửa-code), tìm nhanh → ripgrep. Convention nhỏ nhưng là red-flag-guard chống "sửa code bằng sed".
- **Keywords:** rch, remote compilation, ast-grep, ripgrep, TMPDIR override
- **Seen:** 7f96da4

## safety

### agent-guardrail-doctrine
- **What:** AGENTS.md đặt luật cứng cho agent: **RULE 0 "Fundamental Override Prerogative"**, **RULE 1 "NO FILE DELETION"**, **"Irreversible Git & Filesystem Actions — DO NOT EVER BREAK GLASS"** (cấm thao tác không-hoàn-tác), chỉ dùng branch `main`, cấm sửa-code-bằng-script. Ở tầng code: lint `unsafe_code = forbid`; test đi bộ `src/` bắt version literal hard-code (bắt phải `env!("CARGO_PKG_VERSION")`), allowlist agents.rs + viewer_assets.rs.
- **Where:** `AGENTS.md`, `src/lib.rs`, `Cargo.toml`
- **Notable:** **Hội tụ với guardrail của beehive/fgOS** (privacy, no-break-glass, verify-before-destroy trong rules ta) nhưng phát biểu như "prerogative + no-delete + never-break-glass" ở tầng agent-instructions. Test-bắt-version-literal là mẹo hay: guardrail thành TEST chạy được, không chỉ lời dặn.
- **Keywords:** RULE 0, no file deletion, never break glass, forbid unsafe, version-literal guard test
- **Seen:** 7f96da4

### tui-degradation-ladder
- **What:** TUI giảm cấp DUYÊN DÁNG khi dữ liệu lớn / terminal hẹp: commit HEAD (`7f96da4`) chặn "ftui degradation ladder" khỏi làm TRẮNG viewer tương tác trên dataset lớn. Ba breakpoint bề rộng (Narrow <80, Medium 80-120, Wide ≥120) đổi % pane + cột; state machine 2/3/4-pane, splitter clamp 25%-75% chống pane sập. Background mode poll file 2s, phát hiện đổi qua data_hash → reload.
- **Where:** `src/tui.rs`, `CHANGELOG.md`
- **Notable:** "Đừng để tối-ưu-hiệu-năng/giảm-cấp làm MẤT chức năng chính" — chính là lỗi HEAD sửa. Cùng nguyên lý size-adaptive-metric-config nhưng ở tầng render: giảm cấp phải giữ thứ cốt lõi hiển thị.
- **Keywords:** graceful degradation, responsive breakpoints, pane state machine, clamp, background poll
- **Seen:** 7f96da4

## testing-evals

### conformance-against-reference
- **What:** Chiến lược port an-toàn: **Go reference CLI** (tool legacy) được commit vào repo, chụp output làm fixture; Rust conformance chạy fixture qua cả hai, so **payload theo cấu trúc + schema** (không string). Fixture đăng ký trong `tests/testdata` (fixture_metadata) với version, categories, intent, expected_failure_signatures, provenance. Kèm stress fixtures đối-nghịch (500-issue, deep chain/cycle/self-dep, malformed metadata) — chỉ yêu cầu load/parse KHÔNG panic. Nhiều mặt-test song song (conformance/schema/e2e/snapshot/stress/bench) vì tool có nhiều HỢP ĐỒNG cùng lúc.
- **Where:** `tests/conformance.rs`, `tests/stress_fixtures.rs`, `PROPOSED_ARCHITECTURE.md`, `FEATURE_PARITY.md`
- **Notable:** Reference-oracle + ordering-invariant comparator là khuôn mẫu vàng cho "viết lại/port mà chứng minh tương đương". "Nhiều hợp đồng → nhiều mặt test song song, không tin một lớp nào phủ hết" — trực tiếp cho fgOS khi domain-extension kế thừa base-workflow cần chứng minh parity.
- **Keywords:** Go reference oracle, conformance, ordering-invariant JSON, fixture manifest, stress fixtures, multi-contract testing
- **Seen:** 7f96da4

## docs-style

### evidence-gated-parity-ledger
- **What:** `FEATURE_PARITY.md` là **sổ cái** 126+ flag: mỗi flag đánh trạng thái (complete/partial/missing/excluded/bvr-only) và CHỈ được `complete` khi có conformance test chống lưng; kèm bảng tóm tắt máy-đọc để coverage audit-được. `TUI_GAP_ANALYSIS.md` là tài-liệu-lỗ-hổng: audit phát hiện parity-claim TUI không có chứng cứ → đánh dấu partial để chuyển hướng effort về việc thật. Luật: "parity claims require evidence not aspiration".
- **Where:** `FEATURE_PARITY.md`, `TUI_GAP_ANALYSIS.md`, `PLAN_TO_PORT_BEADS_VIEWER_TO_RUST.md`
- **Notable:** Doc-as-ledger + audit-as-gap-doc: tuyên bố "xong" phải trỏ chứng cứ, không phải "hầu hết đã chạy". Cùng tinh thần verify-enforced-close của beehive/harness nhưng áp cho DOC coverage. Mẫu tốt cho roadmap fgOS tránh over-claim.
- **Keywords:** parity ledger, evidence-gated, gap analysis doc, complete-only-when-tested, coverage audit
- **Seen:** 7f96da4

## workflow

### spec-first-port-then-conform
- **What:** Port được làm SPEC-TRƯỚC: trích behavior/spec từ Go legacy (`EXISTING_BEADS_VIEWER_STRUCTURE.md` = nguồn-sự-thật hành vi) → cài Rust từ spec → verify bằng conformance fixture + benchmark, KHÔNG dịch dòng-dòng. Chia phase (CHANGELOG phase 1-7), mỗi phase có tiêu chí verify; phase xong → việc sau là "post-parity enhancement" chứ không phải "parity recovery".
- **Where:** `PLAN_TO_PORT_BEADS_VIEWER_TO_RUST.md`, `CHANGELOG.md`, `EXISTING_BEADS_VIEWER_STRUCTURE.md`
- **Notable:** Kỷ luật port qua spec + phase-locked completion tránh cargo-cult và cho một mốc "done" rõ. So được với repository-harness→beehive (chưng cất qua numbered-docs). Bổ trợ cho conformance-against-reference: spec định nghĩa, conformance chứng minh.
- **Keywords:** spec-first port, phase-locked, post-parity, behavior source of truth
- **Seen:** 7f96da4

## config-packaging

### compile-time-asset-embedding
- **What:** Toàn bộ viewer asset (JS/CSS/WASM/HTML) nhúng lúc-biên-dịch qua `include_bytes!()` vào `ASSET_INVENTORY` sort theo output path → export hai lần cùng nguồn cho cây file GIỐNG HỆT (deterministic). Single-binary, không cần asset ngoài. `build.rs` dùng vergen-gix phát build timestamp + target triple + rustc semver (build reproducible/CI trace). Release profile hung hãn: opt-level "z", lto, codegen-units 1, panic abort, strip.
- **Where:** `src/viewer_assets.rs`, `build.rs`, `Cargo.toml`
- **Notable:** Nhúng asset + sort-theo-path cho export tất-định là mẹo gọn cho "phát artifact tự-chứa, so-sánh-được". Deterministic ordering = trust requirement (hai run cùng input → cùng output).
- **Keywords:** include_bytes, deterministic export, single binary, vergen, release profile, reproducible build
- **Seen:** 7f96da4

## repo-layout

### analysis-inverse-dependency-tree
- **What:** `src/analysis/` tổ chức 23 module theo **cây phụ-thuộc-ngược**: `graph.rs` (metric lõi) ở đáy, các module cao hơn (triage, forecast, drift, whatif, advanced) chỉ phụ thuộc xuống — mỗi module một trách-nhiệm rõ (mục "Analysis Modules" trong AGENTS.md liệt kê). Test đặt cạnh code qua `#[cfg(test)]`; fixture tổ chức theo scenario + scale.
- **Where:** `PROPOSED_ARCHITECTURE.md`, `src/analysis/mod.rs`, `AGENTS.md`
- **Notable:** Một "lõi metric + nhiều lớp phân-tích chỉ-đọc-xuống" là layout sạch cho một intelligence subsystem: thêm phân-tích mới = thêm module tầng trên, không đụng lõi. Mẫu tham chiếu nếu fgOS dựng tầng analytics riêng trên work-graph.
- **Keywords:** inverse dependency tree, core metrics, single responsibility, cfg-test colocated
- **Seen:** 7f96da4

## ux

### offline-wasm-viewer-with-fallback-ladder
- **What:** Static pages viewer chạy OFFLINE: sql.js WASM + OPFS cache + chunk reassembly cho DB lớn + FTS5 full-text + materialized view. Thang fallback tường minh: WASM→JS scorer (gate theo dataset ≥5000), OPFS→network→chunks; state machine (`attempted/ready/reason`) chống retry-storm. `DIAGNOSTICS` tập trung trace (wasm/opfs/dbSource/loadTimeMs/queryCount/queryErrors). Service worker chèn COEP/COOP (`credentialless`) để bật SharedArrayBuffer cho WASM; CSP thắt nhưng nới đúng chỗ WASM cần. Theme detect trước paint chống FOUC.
- **Where:** `viewer_assets/viewer.js`, `viewer_assets/wasm_loader.js`, `viewer_assets/coi-serviceworker.js`, `viewer_assets/index.html`
- **Notable:** Mẫu "mỗi tầng năng-lực có fallback + GHI RÕ vì sao tầng này không dùng được (reason field)" lặp lại khắp bvr (metric skip, robot format, wasm). DIAGNOSTICS state = debug-không-cần-log. Phần lớn UI này là product-của-viewer, ít khả năng port thẳng vào fgOS — giá trị học là *mẫu fallback-ladder + diagnostic-state*, không phải bản thân viewer.
- **Keywords:** wasm fallback, OPFS cache, diagnostics state, COEP/COOP, credentialless, no-FOUC
- **Seen:** 7f96da4

## self-improvement

### suggestion-feedback-loop
- **What:** Engine gợi ý 5-tín-hiệu (duplicate Jaccard ≥0.7, missing dep keyword-overlap ≥2, label mapping ≥0.5 conf, cycle warning, stale cleanup >90d + PageRank ≤ percentile 25) với ngưỡng confidence (>0.7 cao, <0.4 thấp) + cap 20-50/loại + stop-word filter + 36-80 builtin label mapping. Người CHẤP NHẬN/bỏ gợi ý → tín hiệu tự-chỉnh (đi kèm correlation feedback store).
- **Where:** `src/analysis/suggest.rs`, `src/analysis/correlation.rs`
- **Notable:** Gợi ý có ngưỡng minh-bạch + vòng người-duyệt để hiệu chỉnh — cùng khung predicted→actual với distill outcome loop và fgOS compound-learning. Đáng học: gợi ý luôn cap + kèm confidence, không xả danh sách vô hạn.
- **Keywords:** suggestion engine, confidence threshold, Jaccard, acceptance feedback, self-tuning, capped output
- **Seen:** 7f96da4
