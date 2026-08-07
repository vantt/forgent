---
name: marketing-cockpit
type: git-repo
url: https://github.com/vantt/marketing-cockpit
local: upstreams/marketing-cockpit
last_analyzed_commit: 588d800
last_analyzed_date: 2026-07-13
domains_covered: [integration-contract, config-packaging, skills, orchestration, routing, workflow, quality-gates, testing-evals, hooks, context-memory, harness, planning, docs-style, tooling, repo-layout, safety, self-improvement, ux]
---

# Marketing Cockpit (fgOS) — Feature Index

Framework marketing-ops **agent-agnostic**: một core `.fgOS/` (39 skill, 20 agent, 32 workflow — thuần Markdown/YAML, không code runtime) projected sang nhiều nền tảng AI (Claude deployed, Gemini/Codex/OpenAI planned) qua **adapter mỏng**. Triết lý: "You bring the brand. The framework brings the expertise." Điểm học cho forgent là **META-kiến trúc framework** (cách giữ agent-agnostic, structure skill/agent/workflow/eval/hook/memory), KHÔNG phải nội dung marketing. Bỏ qua (ngoài phạm vi): 130+ file flow catalog, kho ADR `docs/07-decisions` (61 file), `docs/08-research` (31 file), nội dung marketing domain. Inventory gốc: `plans/reports/distill-inventory-260713-2201-fgos-*.md`.

## integration-contract

### agent-agnostic-adapter-spec
- **What:** Một framework core (`.fgOS/`) chạy trên N nền tảng agent qua adapter contract: mỗi adapter BẮT BUỘC implement 4 capability (skill loading với override-merge, agent definition→platform config, knowledge injection có token budget, status protocol DONE/DONE_WITH_CONCERNS/BLOCKED/NEEDS_CONTEXT) + 6 optional có fallback tường minh (memory/scheduled/event triggers/state/observability/skill-composition — mỗi cái "không có thì mất gì" khai báo rõ). Adapter sống ở `.{platform}/` (agents/skills-overrides/hooks/config/scripts), base LUÔN từ `.fgOS/`, override chỉ khi cần.
- **Where:** `.fgOS/adapters/ADAPTER-SPEC.md`, `.fgOS/adapters/README.md`, `.fgOS/FRAMEWORK.md`
- **Notable:** kiểu thứ BA của integration-contract — không phải producer (harness) hay consumer (symphony) mà **một-framework-nhiều-runtime**: contract là "capability + fallback" thay vì "wire protocol"; adapter THỦ CÔNG (không generator), giữ core neutral bằng kỷ luật không bằng máy sinh. Cùng gene dual-runtime của bee (beegog:dual-runtime-contract) nhưng scale lên 4 nền tảng + optional-capability-với-degradation.
- **Keywords:** adapter, agent-agnostic, capability, fallback
- **Seen:** 588d800

## config-packaging

### projection-governance-coverage
- **What:** Framework nhiều-projection tự quản bằng 3 luật: **generate-don't-mirror** (catalog sinh ra, không chép tay), **validate-don't-trust** (invariant kiểm chứng), **block-don't-log** (`.fgOS/**` gated bởi pre-commit `fgos doctor` chặn cứng; `docs/**` chỉ advisory). `conventions-coverage.yaml` là manifest máy-đọc phân loại 28 rule theo mức enforce: enforced / enforceable / guidance / disputed — mỗi rule kèm cơ chế enforce cụ thể.
- **Where:** `.fgOS/conventions-coverage.yaml`, `.fgOS/CONVENTIONS.md`
- **Notable:** "convention có phân hạng enforce-ability" — không giả vờ mọi rule enforce được; disputed/guidance thừa nhận vùng xám. Cùng họ với beegog:skill-budgets-conventions nhưng thêm machine-readable coverage manifest + tri-level enforce.
- **Keywords:** conventions-coverage, generate-don't-mirror, fgos doctor
- **Seen:** 588d800

## skills

### skill-tier-schema
- **What:** 39 skill phân 3 tầng theo vai trò gọi: L1 orchestrator (2, gọi L2/L3), L2 specialist (26, domain), L3 utility (11, leaf). SKILL.md có schema (`skill.schema.yaml`): frontmatter + 9 section bắt buộc (Purpose → References) gồm anti-patterns / red-flags / **rationalization table** + verification checklist. L1/L2/L3 có luật gọi (tầng trên gọi tầng dưới, không ngược).
- **Where:** `.fgOS/schemas/skill.schema.yaml`, `.fgOS/skills/README.md`
- **Notable:** skill là artifact schema-validated với tầng gọi tường minh (skill-map) — rationalization table kế thừa superpowers/bee (beegog:tdd-for-skills-iron-law), nhưng thêm phân tầng L1/L2/L3 làm routing skill-to-skill tất định.
- **Keywords:** L1/L2/L3, skill hierarchy, rationalization
- **Seen:** 588d800

## orchestration

### funnel-agent-roster
- **What:** 20 agent định nghĩa theo `agent.schema.yaml` (frontmatter + 4 section: Role → Decision Boundary; persona + decision-boundary table + collaboration patterns), nhóm theo funnel stage (TOFU 4 / MOFU 4 / BOFU 2 / Core 6 / Support 4). Concurrency per-agent tường minh (`priority.yaml`): default 3, override theo bản chất việc (campaign-manager 5 vì orchestration nhẹ tải nhận thức, content-creator 2 vì sáng tạo cần focus, content-reviewer 4...).
- **Where:** `.fgOS/agents/README.md`, `.fgOS/schemas/agent.schema.yaml`, `.fgOS/orchestration/priority.yaml`
- **Notable:** agent có "decision boundary" khai báo (từ chối việc ngoài phạm vi, report BLOCKED khi vượt autonomy) + concurrency chỉnh theo tải nhận thức từng vai — mô hình đội agent chuyên biệt, khác swarm worker đồng nhất của bee.
- **Keywords:** decision boundary, funnel stage, concurrency
- **Seen:** 588d800

## routing

### three-level-intent-routing
- **What:** `routing.yaml` route intent 3 tầng: L1 intent — pattern-match cụm từ user, score = số token khớp (`specificity_first`), tie-break priority-then-order; L2 skill — map skill→candidate agents, tie-break `fewer_active_tasks`; L3 dynamic (reserved v2); fallback campaign-manager (orchestrator mặc định). Có test case ("plan social calendar for Q3" → social-batch-production score 2 vs editorial 0).
- **Where:** `.fgOS/orchestration/routing.yaml`
- **Notable:** routing tầng 2 (chọn agent) bằng token-scoring cơ học + load-balancing (fewer-active-tasks) — tất định, có test; khác skill-chain của bee (chain cố định) và request-class của harness (nhị phân) — đây là dispatch nhiều-agent theo intent scoring.
- **Keywords:** intent routing, specificity-first, fewer-active-tasks
- **Seen:** 588d800

### task-signal-state-machines
- **What:** Tầng 1 (state-routing): TaskState/WorkflowState 7 trạng thái (`pending → in_progress → paused|completed|failed → resume|cancelled`), transition gated bởi initiator (agent/human/system) + condition. Checkpoint atomic (save on stage-complete, restore/rollback, prune >5). Signal FSM riêng (`pending → consumed → consumed_dispatched → resolved` | `expired`/`abandoned`) với **claim protocol** ADR 0032: atomic filesystem rename làm CAS-lock, `state:` field là nguồn chân lý (reader tin state không tin filename).
- **Where:** `.fgOS/runtime/state.yaml`, `.fgOS/runtime/artifacts.yaml`
- **Notable:** ba state machine (task/workflow/signal) declarative, adapter implement; rename-CAS claim cho signal hội tụ độc lập với symphony:changeset-content-sha-immutability (atomic rename lock) và story-status CAS của harness.
- **Keywords:** state machine, checkpoint, signal FSM, rename-CAS
- **Seen:** 588d800

### signal-driven-chaining
- **What:** Tầng 3 (cross-workflow routing): workflow nối nhau qua signal (catalog 14+: content/review/brand/visual/strategy/persona/editorial; mỗi cái emitter/consumers/ttl/payload). Auto-dispatch (ADR 0032): signal có `auto_dispatch_to[]` + debounce 60s + max_retries 3; **dispatch loop detection** `dispatch_chain[]` max depth 5 (từ chối nếu workflow đã có trong chain). Rule cứng: consumer phải pending→consumed trước khi đọc payload, consumed→resolved trước khi run completed.
- **Where:** `.fgOS/runtime/artifacts.yaml`, `.fgOS/runtime/triggers.yaml`
- **Notable:** event-driven workflow chaining với loop-guard + ttl/starvation — routing qua pub-sub signal thay vì gọi trực tiếp; mô hình khác hẳn chain tuyến tính của bee, cho phép fan-out/reactive.
- **Keywords:** signal chaining, auto-dispatch, loop detection
- **Seen:** 588d800

## workflow

### declarative-workflow-schema
- **What:** `workflow.schema.yaml` (v1.12.0): workflow = stages array (stage_id pattern, **cognitive_tier** per stage, context_rules must/should/skip per stage×rigor), 4 loại (sequential/parallel/conditional/loop), checkpoint resume-on-failure, **async approval gate** (ADR 0019: pause tại gate → listen external approval signal → resume), quality gate 5 loại chuẩn (brand_compliance / content_quality / seo_compliance / legal_compliance / factual_accuracy). Rigor (quick/standard/thorough/critical) điều biến depth.
- **Where:** `.fgOS/schemas/workflow.schema.yaml`, `.fgOS/workflows/README.md`
- **Notable:** workflow thuần declarative (không code) với context-budget per-stage (must/should/skip giống repository-harness:context-rules-matrix nhưng ở tầng stage) + async gate qua signal — pause/resume không block runtime; cognitive_tier per-stage là model-tier routing nhúng trong định nghĩa.
- **Keywords:** workflow schema, cognitive tier, async gate, context_rules
- **Seen:** 588d800

## quality-gates

### rigor-scaled-evaluation
- **What:** Eval 3 tầng theo cost/reliability: Tier 1 automated (schema/keyword/length/link — free, instant), Tier 2 LLM-judge (content_quality threshold 0.70, seo 0.65 — rubric có tiêu chí + trọng số), Tier 3 human (critical mandatory). Rigor→tier mapping bảng cứng (quick chỉ T1; critical đủ T1+T2+T3). **Default-FAIL protocol** (mượn Rune): reviewer giả định 3–5 lỗi tồn tại, chủ động truy factual/brand/missing/structural/legal trước khi pass; critical bật adversarial + default_fail=true.
- **Where:** `.fgOS/observability/evaluation.yaml`, `.fgOS/eval/schemas/rubric.schema.yaml`
- **Notable:** "reviewer mặc định FAIL đến khi chứng minh ngược" — cùng tinh thần evidence-before-claims của bee nhưng ở phía review; tier scale theo cost là mô hình eval kinh tế (free check trước, đắt sau).
- **Keywords:** default-FAIL, 3-tier eval, rigor mapping
- **Seen:** 588d800

### async-review-queue
- **What:** Review là signal bất đồng bộ (ADR 0019): `review.pending` ttl 30d (starvation alert 21d) mang ai_precheck + brand_precheck; `review.approved/rejected/auto_approved/escalated/skipped`. `pause_reason` phân biệt loại pause (review_pending/revision_pending/brand_violation_critical/visual_production_pending/awaiting_external_data/manual). Auto-approve CHỈ khi rigor==quick AND precheck clean; revision cap 3 vòng, escalate vòng 4; brand cap 2.
- **Where:** `.fgOS/runtime/artifacts.yaml`, `.fgOS/runtime/error-handling.yaml`
- **Notable:** review không block workflow — pause + listen signal + resume, cho phép human duyệt lệch pha; auto-approve có floor an toàn (chỉ lane quick + precheck sạch) giống beegog:gate-bypass-safety-floor.
- **Keywords:** async review, pause_reason, auto-approve floor
- **Seen:** 588d800

### failure-recovery-matrix
- **What:** 8 error type (ADR 0004) mỗi cái có detection + max_retries + escalate-to + recovery steps thứ tự (context_overflow retry 2→summarize; api_failure retry 5 exp-backoff+circuit-breaker; quality_gate_fail retry 3; brand_violation retry 2; deadline/infinite_loop/budget retry 0 hard-stop). **Circuit breaker** per service (3 fail/5min → open, 30min cooldown, 1 half-open test). **Anti-loop**: max_skill_visits 2, max_chain_depth 8, quality-decay 20% relative drop → escalate. Default-fail: block + surface, never silently skip (ADR 0003).
- **Where:** `.fgOS/runtime/error-handling.yaml`, `docs/02-design/failure-taxonomy.md`
- **Notable:** runtime reliability tường minh hóa thành ma trận — circuit breaker + anti-loop + quality-decay là mức phòng thủ runtime hiếm thấy trong agent framework; mỗi error có escalation path riêng thay vì retry mù.
- **Keywords:** recovery matrix, circuit breaker, anti-loop, quality decay
- **Seen:** 588d800

## testing-evals

### crossfamily-llm-judge
- **What:** Eval harness LLM-judge đa nền tảng với **cross-family routing**: Claude chấm output của Gemini và ngược lại (`config.yaml` route Claude→Gemini, Gemini→Claude) để tránh self-bias. Rubric schema: dimensions + weights (sum 1.0) + per-dimension pass threshold + judge guidance anchor; judge template inject vars, chấm per-dimension, output JSON `{score, rationale}`. Baseline schema cho so sánh regression; fixtures 3 workflow × 3 case.
- **Where:** `.fgOS/eval/judges/claude-judge.md`, `.fgOS/eval/judges/gemini-judge.md`, `.fgOS/eval/schemas/rubric.schema.yaml`, `.fgOS/eval/README.md`
- **Notable:** cross-family judge để một model không tự chấm mình — bài học eval sắc; rubric weighted + baseline-regression là mức eval cao (đối chiếu repository-harness:external-benchmark-repo nhưng dùng LLM-judge thay benchmark số).
- **Keywords:** cross-family judge, rubric weights, baseline
- **Seen:** 588d800

## hooks

### multiplatform-lifecycle-hooks
- **What:** 7 lifecycle event + `hooks-manifest.yaml` (14 canonical hook wired vào event, per-executor matcher, mode_skip, guard clause); `hook-patterns.yaml` liệt kê event + use case + available data + implementation status. Hook capture telemetry (`post-tool-capture-event.py`: stdin/env contract, emit spawn/usage event; `post-tool-error-capture.py`: error detection regex + error.jsonl + circuit-breaker integration). Fail-soft exit 0. Hook là optional capability của adapter — nền thiếu thì degrade.
- **Where:** `.fgOS/hooks/hooks-manifest.yaml`, `.fgOS/hooks/hook-patterns.yaml`, `.fgOS/hooks/post-tool-capture-event.py`
- **Notable:** hook manifest declarative + per-executor matcher = cùng hook logic projected sang nhiều nền (giống beegog:hook-catalog-projection nhưng cross-platform); fail-soft + error-capture→circuit-breaker nối observability với reliability.
- **Keywords:** hooks manifest, telemetry capture, per-executor matcher
- **Seen:** 588d800

## context-memory

### four-memory-types
- **What:** 4 loại memory scope/lifetime/TTL riêng: working (task, session-only, never-persist), episodic (project, 90d default / 365d nếu important: blocked/human-feedback/quality<0.4/new-pattern), semantic (global, versioned, chỉ đổi khi knowledge file đổi), procedural (project, never auto-delete, user preferences/patterns với confidence+evidence). **Consolidation** cuối task/session: extract lessons → ghi episodic → update procedural (newer-wins, confidence>0.7 + evidence≥2) → clear working. Context injection có cap (episodic 5, procedural 10, semantic on-demand 5).
- **Where:** `.fgOS/memory/schema.yaml`, `.fgOS/memory/retention-policy.yaml`
- **Notable:** phân loại memory theo khoa học nhận thức (working/episodic/semantic/procedural) với consolidation loop + importance-weighted forgetting — tinh vi hơn state-vs-log của bee; procedural memory (pattern học được, reinforcement +0.1/contradiction −0.2) là self-improvement ở tầng agent.
- **Keywords:** episodic, procedural, consolidation, forgetting
- **Seen:** 588d800

### two-layer-knowledge-brand-merge
- **What:** Knowledge 2 tầng (ADR 0008): framework layer `.fgOS/knowledge/` (read-only templates: taxonomy/frameworks/psychology/metrics/compliance + brand/audience/industry templates) + user layer `studio/{brand_id}/` (brand data thật, git-tracked). `brand-resolver.py` deep-merge template + user profile **user-wins** (nested descend, scalar/list user thay, field chỉ-user giữ, framework fill unset). Resolution chain: task brand_id → studio/config/active.yaml → BLOCKED NEEDS_CONTEXT. Multi-brand: pass explicit brand_id để chạy song song.
- **Where:** `.fgOS/knowledge/README.md`, `.fgOS/runtime/scripts/brand-resolver.py`, `.fgOS/knowledge/brand/BRAND-TEMPLATE.yaml`
- **Notable:** tách "kiến thức khung bất biến" khỏi "data người dùng biến thiên" bằng layered deep-merge — mô hình sạch cho multi-tenant agent; resolution-chain + user-wins là pattern config-override đáng học cho bất kỳ framework nhiều-instance.
- **Keywords:** two-layer knowledge, brand resolver, deep-merge user-wins
- **Seen:** 588d800

## harness

### executor-registry-cognitive-tier
- **What:** Dispatch tách khỏi model: mỗi task/stage khai `cognitive_tier` (lightweight/standard/analytical/critical), `model-policy.yaml` map tier→model cụ thể theo nền (ADR 0025), `executor-registry.yaml` định nghĩa executor + invocation (ADR 0027/0042: `kind` agent|tool, invocation via task|cli|mcp|api + adapter bash/python/native/mcp). Orchestrator đọc `next_stage_model/executor/interface` từ run.yaml khi dispatch. Cognitive tier có **silent downgrade** (critical→analytical→standard→lightweight) khi cần.
- **Where:** `.claude/config/model-policy.yaml`, `.fgOS/runtime/config/executor-registry.yaml`, `docs/02-design/executor-schema-v2.md`
- **Notable:** model-tier là thuộc tính của task (cognitive_tier) tách khỏi ánh xạ tier→model (chỉnh một chỗ đổi model cả hệ) — sạch hơn model-tiers của bee (beegog:model-tiers-cost-discipline) ở chỗ tách policy khỏi task; executor-registry cho phép cùng task chạy qua nhiều interface (task/cli/mcp/api).
- **Keywords:** cognitive tier, model-policy, executor-registry, silent downgrade
- **Seen:** 588d800

## tooling

### modular-doctor-plus-path-helpers
- **What:** `doctor.py` gồm nhiều module chuyên biệt (`doctor_eval/hooks/skills/types/context_rules/convention_coverage/facade_coverage/run_lock/index_freshness.py`) mỗi cái kiểm một invariant, chạy như pre-commit gate (`fgos doctor`, block-don't-log). Path helpers **đa ngôn ngữ** giữ đồng bộ: `.fgOS/runtime/lib/paths.py` (Python), `internal/storage/paths/paths.go` (Go), `src/lib/storage-paths.ts` (TS) — "never hardcode studio/... paths". `brand-resolver.py` là resolver có error-code (0/1/2/3).
- **Where:** `.fgOS/runtime/scripts/doctor.py`, `.fgOS/runtime/lib/paths.py`, `.fgOS/runtime/scripts/brand-resolver.py`
- **Notable:** doctor tách module theo invariant (dễ thêm check, mỗi check độc lập) — tiến hóa mô hình doctor-preflight của harness; path helper đa-ngôn-ngữ chống drift path giữa adapter viết bằng ngôn ngữ khác nhau.
- **Keywords:** modular doctor, path helpers, polyglot
- **Seen:** 588d800

## repo-layout

### four-zone-storage-separation
- **What:** 4 zone tách theo audience + tính bền: `.fgOS/` (framework core, read-only, agent-agnostic), `studio/` (user data, git-tracked, human-facing — với `config`/`shared` là reserved names, per-brand `{brand_id}/`), `.workspace/` (machine, gitignored, run state/checkpoint), `.{platform}/` (adapter per nền). Run layout `.workspace/runs/{YYMMDD-workflow-slug}/`; auto-promotion đẩy artifact từ workspace → studio theo rule. ADR 0040 chi phối intra-zone layout.
- **Where:** `CLAUDE.md`, `.fgOS/runtime/artifacts.yaml`, `.gitignore`
- **Notable:** mở rộng policy-vs-ops split (beegog/harness) thành 4 zone: thêm trục "framework vs user" (agent-agnostic core tách khỏi brand data) và "adapter per platform" — cần thiết cho multi-runtime + multi-tenant; reserved-names guard chống brand đè config/shared.
- **Keywords:** storage zones, framework-vs-user, workspace-vs-studio, reserved names
- **Seen:** 588d800

## docs-style

### agent-facing-docs-contract
- **What:** Docs có "hệ điều hành cho agent": `docs/_agents/` chứa QUICK-START (30s onboarding), AGENT-GUIDE ("where to start" theo task type), `change-protocols/` (protocol sửa theo loại), `doc-contract.md` (schema bắt buộc), `do-not-touch.md` (hard invariants). Kỷ luật ADR: never edit `status: ACCEPTED` (chỉ supersede bằng ADR mới), never rename per-flow file, never đổi stage-id production không có ADR. Backstop: post-commit `validate-doc.py` ghi vi phạm vào `docs/_violations.md` (no-friction), pre-commit opt-in.
- **Where:** `docs/_agents/doc-contract.md`, `docs/_agents/QUICK-START.md`, `docs/_agents/AGENT-GUIDE.md`
- **Notable:** docs được thiết kế NHƯ giao diện cho agent (không chỉ cho người) — có onboarding path, change-protocol theo task, contract schema, immutable-ADR; vượt spec-reading-map của bee ở chỗ có protocol sửa + backstop validate. Đối chiếu trực tiếp với hệ thống distill này của forgent.
- **Keywords:** docs-for-agents, change-protocols, immutable ADR, doc-contract
- **Seen:** 588d800

## self-improvement

### procedural-memory-reinforcement
- **What:** Procedural memory học pattern qua thời gian: user_preferences/successful_patterns/failed_approaches/skill_calibrations, cập nhật lúc consolidation với confidence có **reinforcement boost +0.1/episode xác nhận** và **contradiction penalty −0.2/episode mâu thuẫn**; xóa chỉ khi confidence<0.2 sau mâu thuẫn HOẶC human đánh dấu invalid HOẶC agent role bị gỡ. Newer-wins cần confidence>0.7 + evidence≥2. Staleness flag 365d (báo người, không tự xóa).
- **Where:** `.fgOS/memory/schema.yaml`, `.fgOS/memory/retention-policy.yaml`
- **Notable:** agent tự cải thiện bằng pattern học được có trọng số bằng chứng (reinforce/contradict) — self-improvement ở tầng runtime/agent, khác friction-backlog của bee (tầng harness/human). Cặp với four-memory-types (context-memory).
- **Keywords:** procedural memory, reinforcement, confidence, learned patterns
- **Seen:** 588d800
