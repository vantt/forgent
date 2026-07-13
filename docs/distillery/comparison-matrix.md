# Feature Comparison Matrix

So sánh tính năng giữa các learning sources. Ô có ✓ link về entry chi tiết trong `sources/<name>.md`. Ký hiệu: ✓ có | ~ có một phần/dạng khác | ✗ không | ? chưa khảo sát.

Bối cảnh quan trọng: **bee chưng cất từ repository-harness** (cùng 6 upstream khác — xem `sources/beegog.md#numbered-docs-progression`), nên nhiều tính năng harness xuất hiện trong bee ở dạng tinh gọn hơn. Cột Best đánh dấu bản triển khai đáng học nhất hiện tại.

> **Delta @9cc306d (2026-07-13):** Symphony (worktree runner, auto mode, PR, web board) và các skill impeccable/intake-griller đã **tách khỏi repository-harness** sang repo `hoangnb24/symphony`. Harness thêm loạt tính năng mới: request-authority, orchestration protocol v1, proposal lifecycle, proof-before-tag.
>
> **Symphony đã scan @2f0b257 (2026-07-13):** giờ là source thứ ba (`sources/symphony.md`, 18 entry). Là CONSUMER thực chứng của orchestration protocol v1 — standalone product nói chuyện với harness chỉ qua typed boundary. Ô `→sym` cũ nay trỏ về entry symphony thật. Matrix giữ 2 cột nguồn chính (beegog | repository-harness); nơi symphony là bản triển khai đáng học nhất, cột Best trỏ thẳng `sources/symphony.md`.

## harness

| Feature | beegog | repository-harness | Best | Ghi chú |
|---|---|---|---|---|
| risk-lane-classification | ✓ [→](sources/beegog.md#risk-lanes-mechanical) 6 lanes | ✓ 3 lanes (gốc, [→](sources/repository-harness.md#feature-intake-mandatory)) | beegog | bee thêm spike/docs lane + "ceremony scales, memory never" |
| human-gates | ✓ [→](sources/beegog.md#four-gates-code-enforced) 4 gates code-enforced | ~ confirmation cho high-risk | beegog | bee enforce bằng write-guard + claim refusal; harness chỉ quy ước |
| task-unit-with-proof | ✓ cell [→](sources/beegog.md#cell-task-unit) | ✓ story [→](sources/repository-harness.md#story-packets) | beegog (enforce) / harness (query) | cell = JSON zero-dep, cap từ chối cơ học; story = SQLite row, query SQL được |
| durable-state-store | ✓ JSON/JSONL zero-dep | ✓ SQLite + Rust CLI [→](sources/repository-harness.md#durable-sqlite-layer) | trade-off | zero-dep dễ vendor; SQLite mạnh query/aggregate. Harness giải bài toán git-diff bằng changesets |
| maturity-model | ✗ | ✓ H0–H5 [→](sources/repository-harness.md#maturity-ladder-h0-h5) | harness | thang đo kiểm chứng được + benchmark ngoài |
| dual-runtime | ✓ [→](sources/beegog.md#dual-runtime-contract) | ~ (có .codex + .agents nhưng không có projection machinery) | beegog | "one brain, two belts" + parity tests |
| autopilot-with-floor | ✓ gate-bypass [→](sources/beegog.md#gate-bypass-safety-floor) | ~ auto polling caps [→](sources/repository-harness.md#auto-polling-bounded) | beegog (floor) / harness (budget) | hai cách bound autonomy: safety floor vs run caps — bổ sung nhau |

## skills

| Feature | beegog | repository-harness | Best | Ghi chú |
|---|---|---|---|---|
| tdd-for-skills | ✓ Iron Law [→](sources/beegog.md#tdd-for-skills-iron-law) | ✗ | beegog | RED/GREEN/REFACTOR + rationalization table |
| trigger-only-description | ✓ doctrine [→](sources/beegog.md#trigger-only-descriptions) | ~ có "Use when" nhưng không thành luật | beegog | kèm lý do sắc bén (step-summary làm agent bỏ body) |
| skill-conventions | ✓ <200 dòng, headless, red flags, handoff [→](sources/beegog.md#skill-budgets-conventions) | ~ SKILL.md tự do | beegog | headless contract cho composition |
| executable-skill-tooling | ~ vendored helpers | →sym (removed @9cc306d, [→](sources/repository-harness.md#impeccable-design-skill)) | symphony | skill = hệ công cụ chạy được (detector, live-edit); nay thuộc repo symphony |

## hooks

| Feature | beegog | repository-harness | Best | Ghi chú |
|---|---|---|---|---|
| lifecycle-coverage | ✓ 7 hooks / 7 events | ~ 1 PostToolUse [→](sources/repository-harness.md#post-tool-design-hook) | beegog | bee phủ session-init → close |
| fail-open-discipline | ✓ [→](sources/beegog.md#fail-open-crash-wrappers) | ✗ | beegog | crash không bao giờ lật allow/deny + log gap |
| catalog-projection | ✓ [→](sources/beegog.md#hook-catalog-projection) | ✗ | beegog | one truth, N projections, byte-drift test |
| write-guard | ✓ 4 checks [→](sources/beegog.md#write-guard-four-checks) | ✗ | beegog | gate + reservation + privacy + CLI-shape |
| dispatch-guard | ✓ model-guard [→](sources/beegog.md#model-guard-tier-transport) | ✗ | beegog | enforce model-tier tại dispatch + audit log |

## workflow

| Feature | beegog | repository-harness | Best | Ghi chú |
|---|---|---|---|---|
| mandatory-intake | ✓ mode gate | ✓ gốc [→](sources/repository-harness.md#feature-intake-mandatory) | harness (durable record) / beegog (enforce) | harness ghi intake row durable trước mọi việc — bee đang adopt |
| staged-phase-chain | ✓ [→](sources/beegog.md#staged-chain-with-gates) | ~ task loop 9 bước [→](sources/repository-harness.md#task-loop-nine-steps) | beegog | bee có phase state machine; harness có harness-delta checklist đáng học |
| validate-before-execute | ✓ [→](sources/beegog.md#validate-before-execute) | ~ proof matrix ở planning | beegog | reality gate + spikes + adversarial checker |
| requirement-locking | ✓ socratic + D-ID [→](sources/beegog.md#socratic-exploring) | ✓ intake-griller [→](sources/repository-harness.md#intake-griller-interview) | beegog | cùng gene phỏng vấn; bee thêm materiality test + domain probes + D-ID |
| human-readable-brief | ✓ [→](sources/beegog.md#briefing-projection-artifact) | ~ high-risk execplan folder | beegog | projection-not-planner là giải pháp sạch cho dual-audience |
| spec-decomposition | ~ (CONTEXT.md per feature) | ✓ [→](sources/repository-harness.md#spec-decomposition-lifecycle) | harness | "spec là input, không phải truth" + demo walkthrough |
| read-only-exemption | ~ docs lane (không gate, không cell) | ✓ request-authority [→](sources/repository-harness.md#request-authority-model) | harness | câu hỏi/review/status không sinh nghi thức; bee mới chỉ miễn cho docs |

## orchestration

| Feature | beegog | repository-harness | Best | Ghi chú |
|---|---|---|---|---|
| worktree-isolation | ✗ (deferred, docs/08 §adopt-later) | ~ (gốc, [→](sources/repository-harness.md#symphony-isolated-runner)) | ✓ symphony [→](sources/symphony.md#isolated-run-contract) | symphony sở hữu: worktree + WAL-safe snapshot + RUN_CONTRACT.json v1 + result validation; harness chỉ còn ảnh chụp lúc tách |
| parallel-worker-swarm | ✓ [→](sources/beegog.md#orchestrator-assigns-workers) | ~ single-run lock | beegog | wave analysis + goal-check frozen judge |
| write-conflict-control | ✓ reservations [→](sources/beegog.md#file-reservations) | ~ (worktree thay thế) | tùy kiến trúc | lock cùng cây vs cô lập cây — hai trường phái |
| model-tier-economy | ✓ [→](sources/beegog.md#model-tiers-cost-discipline) | ✗ (deferred) | beegog | ceiling/generation/extraction + advisor + presets |
| stuck-worker-rescue | ✓ advisor consult [→](sources/beegog.md#advisor-consult-protocol) | ✗ | beegog | budget ≤2, advice-only |
| pr-integration | ✗ | ~ (gốc [→](sources/repository-harness.md#pr-automation)) | ✓ symphony | run → PR create/retry với forbidden-files guard; nay ở symphony (pr.rs, xem [→](sources/symphony.md#web-board-recovery-actions)) |

## routing

| Feature | beegog | repository-harness | Best | Ghi chú |
|---|---|---|---|---|
| next-work-derived-from-state | ✓ readyCells [→](sources/beegog.md#cell-status-lifecycle) | ✓ runnable predicate [→](sources/repository-harness.md#runnable-derived-dispatch) | hòa (hội tụ) | hai bên độc lập cùng đến "việc kế tiếp = truy vấn dẫn xuất từ deps+status", không phải danh sách tay; harness thêm cấm consumer tự suy lại |
| state-transition-enforcement | ✓ phase/cell CLI-owned [→](sources/beegog.md#phase-machine-cli-owned) | ✓ single-door + CAS [→](sources/repository-harness.md#story-status-single-door) | beegog (gates) / harness (concurrency) | bee chặn agent tự tiện (precondition + write-guard); harness chặn race đa-orchestrator (expected-status trong cùng transaction) |
| skill-chain-router | ✓ hive router + handoff + chain-nudge [→](sources/beegog.md#hive-first-skill-router) | ~ request-class chọn loop một lần ở cửa [→](sources/repository-harness.md#request-class-loop-dispatch) | beegog | bee route liên tục qua chain nhiều skill; harness là single-skill system nên chỉ cần route request class |

## integration-contract

| Feature | beegog | repository-harness | Best | Ghi chú |
|---|---|---|---|---|
| cross-system-protocol | ✗ (monolith, không producer/consumer split) | ✓ protocol v1 producer [→](sources/repository-harness.md#orchestration-protocol-v1) | hòa (producer+consumer) | harness ĐỊNH NGHĨA protocol v1; symphony là CONSUMER thực chứng [→](sources/symphony.md#typed-runtime-boundary) — hai nửa cùng contract, chứng minh boundary chạy qua ranh giới product. bee:dual-runtime-contract là portability một-codebase, KHÁC loại |
| product-boundary-ownership | ✗ | ~ (spec-decomposition ngầm) | ✓ symphony [→](sources/symphony.md#product-boundary-non-goals) | symphony khai báo tường minh "owns X / KHÔNG owns Y" + 11 non-goals; kỷ luật product biết ranh giới mình |
| multi-runtime-projection | ~ dual-runtime 2 belt [→](sources/beegog.md#dual-runtime-contract) | ✗ | ✓ fgOS [→](sources/marketing-cockpit.md#agent-agnostic-adapter-spec) | flavor thứ 3 của domain: MỘT framework core → N nền tảng (Claude/Gemini/Codex/OpenAI) qua adapter "4 required + 6 optional-with-fallback"; bee chỉ 2 runtime + không optional-capability degradation. Contract kiểu capability, không phải wire-protocol |
## context-memory

| Feature | beegog | repository-harness | Best | Ghi chú |
|---|---|---|---|---|
| context-rules-budget | ~ reading lists + depths | ✓ matrix + token budgets [→](sources/repository-harness.md#context-rules-matrix) | harness | phase × lane × must/should/skip + score-context đo compliance |
| area-state-specs | ✓ BA-grade + rebuild bar [→](sources/beegog.md#ba-grade-specs-rebuild-bar) | ~ product docs | beegog | rebuild bar là acceptance test cho memory |
| log-vs-state-model | ✓ [→](sources/beegog.md#state-vs-log-two-physics) | ~ (ngầm: changesets vs docs) | beegog | phát biểu tường minh thành nguyên lý |
| event-sourcing | ✓ decisions.jsonl [→](sources/beegog.md#event-sourced-decisions) | ✓ changesets [→](sources/repository-harness.md#changeset-event-sourcing) | cả hai | mục đích khác: quyết định thiết kế vs thao tác dữ liệu; changesets giải git-diff cho SQLite |
| pause-resume | ✓ HANDOFF 65% [→](sources/beegog.md#handoff-at-65-percent) | ✗ | beegog | never auto-resume |
| settlement-capture | ✓ [→](sources/beegog.md#settlement-capture-unprompted) | ✗ | beegog | agent tự phát hiện "chốt" mỗi turn |
| intervention-log | ~ (adopt-now, chưa build) | ✓ [→](sources/repository-harness.md#intervention-log) | harness | correction/override/escalation/approval là dữ liệu học |
| memory-typing | ~ log-vs-state 2 loại | ✗ | ✓ fgOS 4 loại [→](sources/marketing-cockpit.md#four-memory-types) | fgOS phân working/episodic/semantic/procedural theo khoa học nhận thức + consolidation loop + importance-weighted forgetting; bee mới 2 physics (log/state) |
## planning

| Feature | beegog | repository-harness | Best | Ghi chú |
|---|---|---|---|---|
| plan-artifact | ✓ unified 2-pass [→](sources/beegog.md#unified-plan-two-pass) | ✓ story packet + PHASE docs | beegog (đơn feature) / harness (roadmap) | PHASE docs có expected benchmark deltas — falsifiable |
| research-protocol | ✓ evidence labels + ladder [→](sources/beegog.md#research-levels-evidence-labels) | ✗ | beegog | Local/Upstream/Docs/Inference |
| edge-case-checklist | ✓ 12 dimensions [→](sources/beegog.md#edge-dimensions-checklist) | ~ validation ladder | beegog | |
| dependency-tracking | ✓ cell deps | ✓ story deps trong schema [→](sources/repository-harness.md#epic-story-hierarchy) | harness | deps query được bằng SQL, board tự tính runnable |

## quality-gates

| Feature | beegog | repository-harness | Best | Ghi chú |
|---|---|---|---|---|
| verify-enforced-close | ✓ cap refuses [→](sources/beegog.md#cell-task-unit) | ✓ story complete atomic [→](sources/repository-harness.md#story-complete-atomic) | hòa (đổi @9cc306d) | bee: refusal + before-state evidence; harness: fresh proof + closure trong 1 transaction, `implemented` chỉ có 1 đường vào |
| trace-quality-tiers | ~ trace depth theo lane (adopt từ harness) | ✓ + auto-score [→](sources/repository-harness.md#trace-quality-tiers) | harness | score-trace chấm điểm tự động |
| multi-agent-review | ✓ [→](sources/beegog.md#multi-agent-review-severity) | ✗ | beegog | frozen scope + review-stale + EXISTS/SUBSTANTIVE/WIRED |
| adversarial-plan-check | ✓ [→](sources/beegog.md#adversarial-plan-checker) | ✗ | beegog | |
| session-baseline-gate | ✓ [→](sources/beegog.md#baseline-gate) | ✗ | beegog | never build on red |
| proof-matrix | ~ must_haves per cell | ✓ [→](sources/repository-harness.md#proof-matrix) | harness | ma trận coverage tra được toàn dự án |

## docs-style

| Feature | beegog | repository-harness | Best | Ghi chú |
|---|---|---|---|---|
| glossary | ✗ | ✓ [→](sources/repository-harness.md#glossary-driven-vocab) | harness | chống drift ngữ nghĩa |
| entry-point-shim | ✓ AGENTS.md BEE block + CLAUDE.md 1 dòng | ✓ CLAUDE.md @import shim [→](sources/repository-harness.md#claude-md-import-shim) | harness | shim + progressive disclosure theo phase |
| always-loaded-doctrine | ✓ doctrine layer + anchor-suite [→](sources/beegog.md#doctrine-layer-always-loaded) | ~ AGENTS.md prose, không test | beegog | placement rule ("hold khi không stage nào chạy?") + anchors suite-tested + "transport rides with the order"; fgOS có họ hàng conventions-coverage (enforce-ability manifest) nhưng không anchor-test standing sheet |
| navigation-map | ✓ reading-map [→](sources/beegog.md#spec-reading-map) | ✓ component taxonomy [→](sources/repository-harness.md#component-taxonomy-coverage) | harness (taxonomy) / beegog (map) | 11-responsibility framework đáng đối chiếu với taxonomy forgent |
| decision-records | ✓ Status/Confidence/Alternatives | ✓ Context/Decision/Reasoning/Alternatives/Implications | beegog | bee thêm Confidence + event-sourced supersede |
| communication-doctrine | ✓ gate presentation + silent bookkeeping [→](sources/beegog.md#gate-presentation-contract) | ~ lane output format | beegog | litmus "user restate được" |
| refusal-format | ✓ ERROR/WHY/FIX [→](sources/beegog.md#error-why-fix-refusals) | ✗ | beegog | có test assert |
| learning-from-references | ✓ distillation + adoption audits [→](sources/beegog.md#numbered-docs-progression) | ~ research grounding trong PHASE5 | beegog | tiền lệ trực tiếp cho hệ thống này của forgent |

## tooling

| Feature | beegog | repository-harness | Best | Ghi chú |
|---|---|---|---|---|
| support-cli | ✓ zero-dep Node [→](sources/beegog.md#zero-dep-vendored-helpers) | ✓ Rust + SQLite [→](sources/repository-harness.md#rust-cli-ddd-layering) | trade-off | vendorability vs query power |
| machine-readable-cli-catalog | ✓ [→](sources/beegog.md#unified-dispatcher-command-registry) | ~ clap --help | beegog | schema + examples được test chạy thật |
| tool-registry | ✗ | ✓ [→](sources/repository-harness.md#tool-registry-capability) | harness | "absent capability = clean skip" |
| env-doctor | ~ onboard recheck | ~ (gốc [→](sources/repository-harness.md#doctor-preflight)) | ✓ symphony 10 checks [→](sources/symphony.md#doctor-preflight-10-checks) | symphony tiến hóa: 10 check Pass/Warn/Fail + next-action, thêm changeset-sync + optional-provider |
| observer-ui | ✗ | ~ (gốc [→](sources/repository-harness.md#symphony-web-board)) | ✓ symphony [→](sources/symphony.md#web-board-recovery-actions) | recovery-action tính từ run state, không phải nút tĩnh |
| cost-visibility | ✓ statusline [→](sources/beegog.md#statusline-subagent-cost) | ✗ | beegog | token subagent theo model |

## config-packaging

| Feature | beegog | repository-harness | Best | Ghi chú |
|---|---|---|---|---|
| installer | ✓ 2-layer [→](sources/beegog.md#one-line-installer-two-layers) | ✓ merge modes [→](sources/repository-harness.md#installer-merge-modes) | hòa | bee: dual-runtime; harness: conflict modes + shared payload manifest |
| drift-detection | ✓ SHA256 manifest [→](sources/beegog.md#onboarding-manifest-drift) | ~ checksum binary | beegog | heal drift + downgrade guard |
| host-file-coexistence | ✓ markers [→](sources/beegog.md#managed-block-markers) | ~ AGENTS shim refresh | beegog | byte-preservation có spec + edge cases |
| release-automation | ~ plugin version bump tay | ✓ post-merge tự động [→](sources/repository-harness.md#post-merge-maintenance-automation) | harness | bump + changelog tự động; tag chuyển sang proof gate @9cc306d |
| proof-before-release | ✗ | ✓ [→](sources/repository-harness.md#proof-before-tag-promotion) | harness | frozen baseline + full contract, tag sau matrix pass, failed tag bất biến |
| binary-distribution | ✗ (không cần, Node) | ✓ prebuilt + sha256 [→](sources/repository-harness.md#prebuilt-binary-release) | harness | |

## repo-layout

| Feature | beegog | repository-harness | Best | Ghi chú |
|---|---|---|---|---|
| policy-vs-ops-split | ✓ [→](sources/beegog.md#policy-vs-ops-split) | ✓ [→](sources/repository-harness.md#policy-vs-durable-separation) | hòa | cùng nguyên lý; harness có negation pattern (.harness/* ignore trừ changesets/) |
| feature-history-layout | ✓ docs/history/<feature>/ [→](sources/beegog.md#docs-history-per-feature) | ✓ stories/epics/US-*/ | tùy khẩu vị | bee theo dòng thời gian feature; harness theo cây backlog |
| cross-platform-hygiene | ~ Windows-safe code | ✓ .gitattributes eol [→](sources/repository-harness.md#gitattributes-line-endings) | harness | chi tiết nhỏ, giá trị lớn |

## safety

| Feature | beegog | repository-harness | Best | Ghi chú |
|---|---|---|---|---|
| secret-read-protocol | ✓ privacy marker [→](sources/beegog.md#privacy-marker-protocol) | ✗ | beegog | approve-per-read qua hook |
| hard-gate-risks | ✓ (thừa kế) | ✓ gốc [→](sources/repository-harness.md#hard-gates-intake) | hòa | cùng danh sách |
| cross-repo-data-boundary | ✓ allowlist + consumer-revalidate [→](sources/beegog.md#allowlist-not-redaction) | ✗ | beegog | bài học falsified-by-data hiếm có |

## self-improvement

| Feature | beegog | repository-harness | Best | Ghi chú |
|---|---|---|---|---|
| friction-outcome-loop | ✓ (thừa kế + layer attribution) [→](sources/beegog.md#friction-backlog-outcome-loop) | ✓ gốc [→](sources/repository-harness.md#growth-rule-friction) | beegog | thêm 5-layer failure attribution |
| entropy-score | ✓ + trend [→](sources/beegog.md#entropy-score-trend) | ✓ audit | beegog (trend) | cùng gene công thức |
| self-modification-loop | ✓ evolving 2 human gates [→](sources/beegog.md#evolving-loop-two-gates) | ✓ explicit lifecycle @9cc306d [→](sources/repository-harness.md#proposal-lifecycle-explicit) | hòa (hội tụ) | hai bên hội tụ độc lập về "explicit accept per item"; bee mạnh về gate discipline, harness mạnh về đo outcome (confirmed/ineffective/reverted, regression/reconsideration) |
| debt-grooming | ✓ project-first [→](sources/beegog.md#grooming-project-first) | ~ audit harness-only | beegog | tách nhà mình / nhà chủ |

## ux

| Feature | beegog | repository-harness | Best | Ghi chú |
|---|---|---|---|---|
| jargon-discipline | ✓ silent bookkeeping [→](sources/beegog.md#silent-bookkeeping) | ~ | beegog | |
| machine-protocol | ✓ status tokens [→](sources/beegog.md#status-token-protocol) | ✓ RESULT.json/SUMMARY.md | hòa | |
| fleet-visibility | ~ statusline | →sym [→](sources/repository-harness.md#symphony-web-board) | symphony | |

## testing-evals

| Feature | beegog | repository-harness | Best | Ghi chú |
|---|---|---|---|---|
| behavior-pressure-tests | ✓ [→](sources/beegog.md#pressure-test-scenarios) | ✗ | beegog | 7 loại áp lực |
| external-benchmark | ✗ | ✓ [→](sources/repository-harness.md#external-benchmark-repo) | harness | delta kỳ vọng khai báo trước |
| infra-contract-tests | ✓ parity + byte-drift [→](sources/beegog.md#hook-contract-parity-tests) | ✓ CI release [→](sources/repository-harness.md#release-ci-verification) | beegog (depth) / harness (breadth) | |
| llm-judge-eval | ✗ | ~ external benchmark (số) | ✓ fgOS cross-family [→](sources/marketing-cockpit.md#crossfamily-llm-judge) | fgOS: Claude chấm Gemini và ngược lại (chống self-bias) + rubric weighted + baseline regression; harness dùng benchmark số ngoài, khác cách |
| output-quality-gate | ~ review severity | ✗ | ✓ fgOS default-FAIL [→](sources/marketing-cockpit.md#rigor-scaled-evaluation) | fgOS 3-tier (free→LLM→human) theo rigor + reviewer giả định FAIL; cùng tinh thần adversarial của bee-validating nhưng ở review output |