---
name: beegog
type: git-repo
url: https://github.com/vantt/beegog
local: references/beegog
last_analyzed_commit: e70602a
last_analyzed_date: 2026-07-13
domains_covered: [harness, skills, hooks, workflow, orchestration, context-memory, planning, quality-gates, docs-style, tooling, config-packaging, repo-layout, safety, self-improvement, ux, testing-evals]
---

# Beegog (bee) — Feature Index

Plugin suite "validate-first agentic development" cho Claude Code + Codex. Chưng cất từ 7 upstream (khuym, gsd-core, superpowers, claudekit, repository-harness, gstack, compound-engineering — xem `docs/01-distillation.md` của repo). Inventory gốc: `plans/reports/ref-scan-inventory-260713-1224-beegog-*.md`.

## harness

### four-gates-code-enforced
- **What:** 4 human gates tại 4 thời điểm khó đảo ngược (what/how/write/merge); Gates 1–3 enforced bằng code — write-guard hook từ chối sửa source khi Gate 3 chưa approve, `claim` throw khi gate chưa mở.
- **Where:** `AGENTS.md`, `hooks/bee-write-guard.mjs`, `skills/bee-hive/templates/lib/guards.mjs`
- **Notable:** gate là cơ chế code, prompt chỉ là lớp phụ. Gate 4 (review) tách riêng, user-invoked, không bao giờ tự động.
- **Seen:** e70602a

### cell-task-unit
- **What:** Cell = JSON task unit (`.bee/cells/`) với id, lane, deps, must_haves (truths/artifacts/key_links/prohibitions), verify command, trace. `cap` từ chối đóng cell nếu thiếu verify output + files_changed; `behavior_change` còn đòi bằng chứng before-state (`red_failure_evidence`).
- **Where:** `docs/02-architecture.md`, `skills/bee-hive/templates/lib/cells.mjs`
- **Notable:** "plans are prompts" — cell tự chứa đủ để dispatch; chống "it works now" bằng cơ chế, không bằng niềm tin.
- **Seen:** e70602a

### risk-lanes-mechanical
- **What:** Lane (docs/tiny/small/standard/high-risk/spike) chọn bằng đếm risk flags cơ học (auth, data model, public contracts... 10 flags; 4+ hoặc hard-gate flag → high-risk), không bằng phán đoán.
- **Where:** `docs/03-workflow.md`, `skills/bee-hive/SKILL.md`
- **Notable:** "Lanes scale ceremony, never memory" — lane tiny vẫn bắt buộc sync spec khi đổi behavior.
- **Seen:** e70602a

### dual-runtime-contract
- **What:** Một bộ skills + shared `lib/` chạy trên cả Claude Code lẫn Codex; enforcement nằm ở shared helpers trước, hooks là "second belt". Degradation ladder: skills → PLAYBOOK.md → helpers.
- **Where:** `docs/06-runtime-integration.md`, `hooks/catalog.mjs`
- **Notable:** "one brain, two belts" — port runtime là contract, không phải fork.
- **Seen:** e70602a

### gate-bypass-safety-floor
- **What:** Autopilot opt-in tự approve Gates 1–3 cho lane thường; safety floor tuyệt đối: high-risk, hard-gate, Gate 4 UAT, privacy reads luôn dừng chờ người.
- **Where:** `skills/bee-bypass-gate/SKILL.md`
- **Notable:** bypass có ranh giới đặt bằng cơ chế, agent bị cấm gợi ý nới floor.
- **Seen:** e70602a

## skills

### tdd-for-skills-iron-law
- **What:** "No skill without failing pressure test first" — RED (chạy scenario KHÔNG có skill, ghi rationalization verbatim) → GREEN (SKILL.md tối thiểu chỉ trị các rationalization đã ghi) → REFACTOR. Áp cho cả skill edit.
- **Where:** `skills/bee-writing-skills/SKILL.md`
- **Notable:** skill được đối xử như code có test; rationalization table là tài sản.
- **Seen:** e70602a

### trigger-only-descriptions
- **What:** Description = 1 câu purpose + "Use when..." trigger conditions, KHÔNG BAO GIỜ tóm tắt workflow steps.
- **Where:** `docs/04-skills-spec.md`
- **Notable:** lý do sắc: step-summary khiến agent làm theo description và bỏ qua body.
- **Seen:** e70602a

### skill-budgets-conventions
- **What:** SKILL.md <200 dòng, overflow vào đúng 1 tầng `references/`; mọi skill có Headless section (không bao giờ block, defer ambiguous vào Outstanding Questions, output structured), Red Flags list, handoff sentence cuối, CREATION-LOG.md ghi quá trình TDD + debt.
- **Where:** `docs/04-skills-spec.md`, `docs/07-contracts.md`
- **Notable:** khuôn thống nhất 15/15 skill; headless contract giúp orchestrator compose skill máy móc.
- **Seen:** e70602a

## hooks

### hook-catalog-projection
- **What:** Một catalog logic duy nhất (`catalog.mjs`) render ra projection theo runtime (claude/codex) × target (plugin/repo); khác biệt phải khai báo trong `ALLOWED_DIFFERENCES`; test so byte-drift giữa các projection.
- **Where:** `hooks/catalog.mjs`, `hooks/test_hook_contracts.mjs`
- **Notable:** "two projections, one truth" — chống hand-divergence giữa 2 runtime.
- **Seen:** e70602a

### fail-open-crash-wrappers
- **What:** Mọi hook bọc toàn thân trong try/catch, log crash vào `.bee/logs/hooks.jsonl`, exit 0. Crash không bao giờ lật allow/deny; hook exit 0 im lặng nếu repo chưa onboard.
- **Where:** `hooks/adapter.mjs`, mọi `hooks/bee-*.mjs`
- **Notable:** "a broken hook never breaks a session" + coverage gap được log thấy được.
- **Seen:** e70602a

### write-guard-four-checks
- **What:** PreToolUse guard 4 lớp tuần tự: gate guard → reservation guard → privacy/scout guard → CLI-shape validation (validate flags bee_*.mjs theo JSON-Schema). Xử lý cả `apply_patch` envelope; target không chứng minh được → deny cả batch.
- **Where:** `hooks/bee-write-guard.mjs`
- **Notable:** batch write guard per-target; "one denied target denies the request".
- **Seen:** e70602a

### injection-dedup
- **What:** Prompt-context hook chỉ inject reminder khi state đổi hoặc >30 phút, qua `.bee/.inject-cache.json`.
- **Where:** `hooks/bee-prompt-context.mjs`, `templates/lib/inject.mjs`
- **Notable:** trị đúng bệnh context bloat do hook lặp.
- **Seen:** e70602a

### model-guard-tier-transport
- **What:** PreToolUse trên Agent/Task deny dispatch không khai model tier tường minh (model param hoặc marker `[bee-tier: x]` anchored đầu prompt — giữa chừng bị coi là giả mạo); audit từng dispatch vào `.bee/logs/dispatch.jsonl`.
- **Where:** `hooks/bee-model-guard.mjs`
- **Notable:** ép kỷ luật chi phí model bằng hook + audit log, không bằng lời dặn.
- **Seen:** e70602a

### chain-nudge-subagent-stop
- **What:** SubagentStop hook nhắc orchestrator bước kế tiếp của chain (collect status token, cap cell, release reservation); advisory-only (systemMessage, không block).
- **Where:** `hooks/bee-chain-nudge.mjs`
- **Notable:** "workflow chain advanced by the harness, not by memory".
- **Seen:** e70602a

## workflow

### staged-chain-with-gates
- **What:** Chain cố định: hive → exploring [G1] → planning/briefing [G2] → validating [G3] → swarming → executing → scribing → compounding → done (unreviewed); reviewing [G4] chỉ khi user gọi. Gate wording verbatim cố định.
- **Where:** `docs/03-workflow.md`, `AGENTS.md`
- **Notable:** mọi lane đều đóng "unreviewed" mặc định — verification ≠ review, tách bạch chi phí.
- **Seen:** e70602a

### validate-before-execute
- **What:** Stage validating chứng minh plan khả thi bằng bằng chứng trước khi viết code: reality gate (5 tiêu chí PASS/FAIL), feasibility matrix, spikes cho assumption chưa chứng minh, decision vocabulary (READY / NOT READY - RUN SPIKE...).
- **Where:** `skills/bee-validating/SKILL.md`
- **Notable:** "'This should work' is not evidence" — plausibility language tự động = NOT READY.
- **Seen:** e70602a

### socratic-exploring
- **What:** Biến request mù mờ thành locked decisions trong CONTEXT.md: phân loại domain type (SEE/CALL/RUN/READ/ORGANIZE), probes theo domain, mỗi message 1 câu hỏi material (đổi scope/architecture/UX mới được hỏi), lock bằng D-ID, fresh-eyes review trước Gate 1.
- **Where:** `skills/bee-exploring/SKILL.md` + `references/gray-area-probes.md`
- **Notable:** materiality test cho câu hỏi + "blindspot pass" dạy user trước khi hỏi khi user không rành.
- **Seen:** e70602a

### briefing-projection-artifact
- **What:** implement-plan.md render *từ* truth artifacts (CONTEXT/approach/plan/cells), chỉ tự viết 2 mục Tech Design + Rollback; feedback chảy ngược về truth artifacts rồi re-render; Review Status lifecycle mirror gates; lane-scaled (tiny không brief, small ~15 dòng); walkthrough mode hậu Gate-4 dựng từ execution records, không từ plan.
- **Where:** `skills/bee-briefing/SKILL.md`, `docs/11-implement-plan-adoption.md`
- **Notable:** "consolidator, not second planner" — human và agent duyệt trên cùng một tài liệu mà không sinh nguồn sự thật thứ hai.
- **Seen:** e70602a

## orchestration

### orchestrator-assigns-workers
- **What:** Worker không bao giờ tự chọn cell; orchestrator assign 1 cell/worker; dispatch mang isolation contract (cell id + paths + constraints + status tokens, KHÔNG session history); worker loop 9 bước (claim → reserve → implement → verify → cap → release → report).
- **Where:** `skills/bee-swarming/SKILL.md`, `skills/bee-executing/SKILL.md`
- **Notable:** goal-check mỗi [DONE]: orchestrator tự re-run verify (frozen judge), không tin lời worker.
- **Seen:** e70602a

### file-reservations
- **What:** Reserve file trước khi ghi (`bee_reservations.mjs`); conflict → worker trả `[BLOCKED]`, orchestrator xử; hook enforce; sweep stale reservations.
- **Where:** `templates/lib/reservations.mjs`, `hooks/bee-write-guard.mjs`
- **Notable:** giải xung đột ghi song song bằng lock cơ học thay vì "be careful".
- **Seen:** e70602a

### model-tiers-cost-discipline
- **What:** 3 tier: ceiling (session model, giữ khan hiếm) / generation (mid, đa số cells) / extraction (rẻ nhất, việc cơ học) + 2 role: review, advisor. Tier phán tại lúc dispatch; config theo runtime; external executor dạng `{kind: "cli", command}` (vd Codex CLI); 5 presets sẵn.
- **Where:** `docs/config-reference.md`, `docs/model-presets.md`, decisions 0012/0015/0016/0019
- **Notable:** đúng triết lý "model rẻ làm việc cơ học"; enforce bằng model-guard hook + audit, cảnh báo khi lạm ceiling.
- **Seen:** e70602a

### advisor-consult-protocol
- **What:** Worker kẹt được hỏi model mạnh hơn: chỉ khi dispatch có Advisor line VÀ verify fail lần đầu; ≤2 consult/claim; evidence bundle inline; advice-only (không thẩm quyền gate); luôn re-run verify thật sau advice.
- **Where:** `skills/bee-executing/SKILL.md`, decision 0013
- **Notable:** rescue ladder có budget: more context → stronger tier → escalate user.
- **Seen:** e70602a

## context-memory

### handoff-at-65-percent
- **What:** ~65% context → ghi `.bee/HANDOFF.json` (phase/feature/cells in flight/next action) và pause sạch; session sau KHÔNG BAO GIỜ auto-resume — surface cho user chờ xác nhận.
- **Where:** `AGENTS.md` rule 6, `docs/03-workflow.md`
- **Notable:** pause/resume là nghi thức có chủ đích, chống resume mù sau compaction.
- **Seen:** e70602a

### state-vs-log-two-physics
- **What:** Hai loại tri thức vật lý ngược nhau: Log (append-only, theo feature: decisions.jsonl, docs/history/) trả lời "how did we get here"; State (overwrite theo reality, theo area: docs/specs/) trả lời "where are we". Cả hai đều cần.
- **Where:** `docs/02-architecture.md`, decision 0001
- **Notable:** insight nền tảng nhất của bee về memory; đa số hệ chỉ có log.
- **Seen:** e70602a

### ba-grade-specs-rebuild-bar
- **What:** docs/specs/<area>.md tech-agnostic ở mức BA: acceptance test = "rebuild bar" — agent chỉ đọc spec (giấu Pointers) dựng lại được behavior trên stack khác. Coverage label (partial/full) + Open Gaps thay vì giả vờ đủ.
- **Where:** `skills/bee-scribing/SKILL.md`, decision 0002
- **Notable:** "meaning outlives the stack" — code chỉ là một rendering của spec.
- **Seen:** e70602a

### settlement-capture-unprompted
- **What:** Phát hiện "settlement" (rule chốt, behavior xác nhận, value tune xong) là nhiệm vụ của agent MỖI TURN, không chờ user bảo ghi; high-risk merge spec ngay, lane khác queue capture stub vào `.bee/capture-queue.jsonl`, flush tại wrap-up/PreCompact/session-start.
- **Where:** `AGENTS.md` rule 9, `skills/bee-scribing/SKILL.md` (capture mode)
- **Notable:** SELF-TRIGGERING skill description + capture queue = không mất tri thức giữa chừng phiên.
- **Seen:** e70602a

### event-sourced-decisions
- **What:** decisions.jsonl append-only qua CLI verb (log/supersede/redact/active/search — không bao giờ hand-edit); D-ID cited trong spec/cell; write-time redaction, datamark on read.
- **Where:** `templates/lib/decisions.mjs`, `docs/decisions/` format
- **Notable:** decision record có Status/Confidence/Source/Alternatives — audit trail thiết kế đầy đủ.
- **Seen:** e70602a

## planning

### unified-plan-two-pass
- **What:** Một `plan.md` duy nhất, enriched in-place 2 lượt: `artifact_readiness: requirements-only` → Gate 2 → `implementation-ready` + tạo cells batch. Artifact phụ (discovery/approach) phải "earned" bởi research level L2+ hoặc high-risk.
- **Where:** `skills/bee-planning/SKILL.md` + `references/planning-reference.md`
- **Notable:** artifact fan-out table chống đẻ file nghi thức; frontmatter `artifact_contract` versioned.
- **Seen:** e70602a

### research-levels-evidence-labels
- **What:** Discovery L0–L3 scale chi phí; bee-xia scout với 4 evidence labels (Local/Upstream/Docs/Inference) + recommendation ladder (reuse local → built-in → adapt upstream → build, mỗi rung bỏ qua phải nêu lý do).
- **Where:** `skills/bee-xia/SKILL.md` + `references/xia-protocol.md`
- **Notable:** mọi claim nghiên cứu đều dán nhãn nguồn bằng chứng; brief mở đầu bằng Bottom Line.
- **Seen:** e70602a

### edge-dimensions-checklist
- **What:** 12 chiều edge-case (input extremes, timing, scale, concurrency, compliance...) cho test matrix depth.
- **Where:** `skills/bee-planning/references/edge-dimensions.md`
- **Notable:** kế thừa claudekit; checklist cơ học thay brainstorm tùy hứng.
- **Seen:** e70602a

## quality-gates

### multi-agent-review-severity
- **What:** Review session user-invoked: scope frozen tại creation (immutable), 4 core reviewers song song (code-quality/architecture/security/test-coverage) + conditional theo diff; P1/P2/P3, P1 block merge; verification-evidence backstop; artifact check EXISTS/SUBSTANTIVE/WIRED; UAT walk theo CONTEXT.md; review approval chỉ phủ đúng change set đã soi — thay đổi sau = `review-stale`.
- **Where:** `skills/bee-reviewing/SKILL.md`, spec `docs/specs/workflow-state.md`
- **Notable:** review coverage là derived-never-stored; "merge/ship" không bao giờ tự kích review.
- **Seen:** e70602a

### adversarial-plan-checker
- **What:** Subagent giả định plan sai, verify 5 chiều (coverage/completeness/dependencies/links/scope), max 3 vòng; high-risk scale lên persona panel.
- **Where:** `skills/bee-validating/SKILL.md`
- **Notable:** red-team plan trước khi tốn tiền execute.
- **Seen:** e70602a

### baseline-gate
- **What:** Nếu config ghi `commands.verify`, chạy 1 lần đầu phiên trước khi nhận việc; baseline đỏ → surface + thành fix-first cell. "Never build on red." Session finish cũng phải end green hoặc end red có cell + report.
- **Where:** `AGENTS.md` startup 6 + session finish
- **Notable:** chống xây trên nền gãy — lỗ hổng phổ biến nhất của agent session.
- **Seen:** e70602a

### evidence-before-claims
- **What:** Mọi câu "done/passing/fixed" phải kèm output lệnh tươi trong cùng message; red-flag words: should/probably/seems to.
- **Where:** `docs/00-vision.md` P4, hive law
- **Notable:** quy tắc văn hóa được lặp ở mọi tầng tài liệu — ví dụ tốt về "narrative làm luật".
- **Seen:** e70602a

## docs-style

### numbered-docs-progression
- **What:** docs đánh số 00-vision → 07-contracts theo trục why → what → how → contract; adoption audits (08–11) ghi lại việc học từ project khác thành tài liệu chính thức (keep wholesale / change / reject + lý do từng mục).
- **Where:** `docs/00..11-*.md`, đặc biệt `01-distillation.md`, `08/09-*-adoption.md`
- **Notable:** 01/08/09 chính là thể loại "reference learning" forgent đang xây — có trước, đáng học format.
- **Seen:** e70602a

### gate-presentation-contract
- **What:** Chat chỉ chứa lớp plain-language (what/why trustworthy/cost if wrong/what you decide) + câu gate verbatim; mechanical reports link chứ không paste. Litmus: user restate được approval bằng lời mình.
- **Where:** `skills/bee-hive/references/routing-and-contracts.md`
- **Notable:** đi cùng Silent Bookkeeping (rule 11): bee vocab không lọt vào chat trừ khi user hỏi.
- **Seen:** e70602a

### error-why-fix-refusals
- **What:** Mọi refusal user-facing phải nêu: rule bị chạm, lý do, hành động kế tiếp cụ thể; test assert phần FIX.
- **Where:** `docs/07-contracts.md`
- **Notable:** đối xử error message như contract có test.
- **Seen:** e70602a

### spec-reading-map
- **What:** `docs/specs/reading-map.md` = index 1 dòng/vị trí "cái gì sống ở đâu", kèm mục "chưa specced" và "elsewhere" — bản đồ điều hướng cho agent lạ.
- **Where:** `docs/specs/reading-map.md`
- **Notable:** trả lời Fresh Session Test câu "how is it organized".
- **Seen:** e70602a

## tooling

### zero-dep-vendored-helpers
- **What:** Toàn bộ máy móc là Node 18 ESM zero npm deps, atomic write (tmp+rename), Windows-safe; vendored vào host repo (`.bee/bin/` + `lib/`) nên chạy mọi nơi không cần cài gì.
- **Where:** `docs/07-contracts.md`, `skills/bee-hive/templates/`
- **Notable:** enforcement sống trong helpers vendored → runtime nào cũng bị ràng buộc như nhau.
- **Seen:** e70602a

### unified-dispatcher-command-registry
- **What:** `bee.mjs` dispatch 9 nhóm lệnh từ một implementation; command catalog máy-đọc-được (name/invoke/description/param schema/examples/deprecation); entry point riêng chỉ là thin forwarder byte-identical; hook validate CLI shape theo catalog; examples được test chạy thật.
- **Where:** `templates/bee.mjs`, `templates/lib/command-registry.mjs`
- **Notable:** CLI surface tự mô tả cho agent discover (`--help --json`).
- **Seen:** e70602a

### statusline-subagent-cost
- **What:** Statusline cộng token/cost của cả subagents (parse `<session>/subagents/*.jsonl`, dedupe theo message.id, bảng giá theo model, cache theo size+mtime, fail-open).
- **Where:** `.claude/statusline-usage.mjs`, `plans/statusline-usage.md`
- **Notable:** làm chi phí model tier nhìn thấy được ngay trong UI.
- **Seen:** e70602a

## config-packaging

### onboarding-manifest-drift
- **What:** `.bee/onboarding.json` ghi SHA256 từng file managed (22 file); onboard re-run idempotent, detect drift + heal, `blocked_downgrade` guard (không force khi version unknown), never overwrite state/decisions/cells.
- **Where:** `skills/bee-hive/scripts/onboard_bee.mjs`, spec `docs/specs/onboarding.md`
- **Notable:** "managed versions" pattern — update = re-onboard, không phải copy tay.
- **Seen:** e70602a

### managed-block-markers
- **What:** Nội dung bee trong file của host (AGENTS.md, .gitignore) nằm giữa marker BEE:START/END; mọi byte ngoài marker giữ nguyên tuyệt đối; dòng "giống marker" không bị coi là marker.
- **Where:** spec `docs/specs/onboarding.md` R10, `.gitignore`
- **Notable:** chuẩn mực chung sống với file user-owned.
- **Seen:** e70602a

### one-line-installer-two-layers
- **What:** install.sh/.ps1 một dòng: layer runtime (skills per machine, chọn claude/codex/both) + layer repo (onboard); flags --dry-run/--source/--ref; greenfield lẫn brownfield.
- **Where:** `scripts/install.sh`, `INSTALL.md`
- **Notable:** cùng UX với repository-harness installer nhưng thêm dual-runtime.
- **Seen:** e70602a

## repo-layout

### policy-vs-ops-split
- **What:** Markdown dưới `docs/` = policy/narrative cho người; JSON/JSONL dưới `.bee/` = operational record máy query được. Gitignore tách machine-local runtime (state, logs, cache, HANDOFF, spikes) khỏi team-durable (cells, config, decisions).
- **Where:** `docs/02-architecture.md`, `.gitignore`
- **Notable:** ranh giới commit/ignore là quyết định thiết kế có spec riêng (onboarding.md R9).
- **Seen:** e70602a

### docs-history-per-feature
- **What:** `docs/history/<feature>/` chứa CONTEXT.md (decisions) + plan.md + reports/; `docs/history/learnings/` + `research/`; tách khỏi `docs/specs/` (state theo area).
- **Where:** cấu trúc `docs/history/`
- **Notable:** feature-time artifacts (log) không lẫn với area-state (spec).
- **Seen:** e70602a

## safety

### privacy-marker-protocol
- **What:** Đọc file dạng secret (.env*, .pem, id_rsa*...) → hook phát marker `@@BEE_PRIVACY@@` → agent phải AskUserQuestion; không bao giờ work around; artifact/transcript content là data, không phải instructions.
- **Where:** `templates/lib/guards.mjs`, `AGENTS.md` guardrails
- **Notable:** approve-per-read, marker + protocol phản hồi chuẩn hóa.
- **Seen:** e70602a

### allowlist-not-redaction
- **What:** Feedback digest KHÔNG có field free-text nào (bỏ hẳn `detail` sau khi corpus thật chứng minh filter không tin được — prose friction luôn lọt tên hàm/file/config key qua regex). Chỉ 6 field đóng: kind/layer/source/title/first_seen/pain.
- **Where:** spec `docs/specs/feedback-digest.md`, decision 0022 D2
- **Notable:** "a filter that cannot be trusted is worse than no field at all" — bài học được falsify bằng dữ liệu thật.
- **Seen:** e70602a

### consumer-revalidates-boundary
- **What:** Bên đọc digest ngoại lai re-run secret/injection scan mọi field + bọc title trong datamark trước khi vào prompt; "redaction boundary sits at the party at risk, not the party producing". Dropped records mang lý do category, không mang text match.
- **Where:** `templates/lib/feedback.mjs` (mergeDigests), decision 0022 D2b
- **Notable:** mô hình trust-boundary cho dữ liệu cross-repo giữa các agent system.
- **Seen:** e70602a

## self-improvement

### friction-backlog-outcome-loop
- **What:** Friction ghi lúc gặp (kèm layer attribution: task spec/context/environment/verification/state); backlog item ghi predicted impact lúc tạo, actual outcome lúc đóng; grooming so dự đoán với thực tế.
- **Where:** `templates/lib/backlog.mjs`, `docs/09-harness-course-adoption.md`
- **Notable:** "prediction wrong is signal, not embarrassment" — học từ chính sai số dự đoán.
- **Seen:** e70602a

### entropy-score-trend
- **What:** Điểm entropy = tổng có trọng số (orphaned cells ×10, unverified ×5, stale specs ×5, backlog-without-outcome ×2, broken tools ×8...), cap 100, band 4 mức; grooming bắt buộc báo score KÈM trend so lần audit trước.
- **Where:** `skills/bee-grooming/references/grooming-reference.md`
- **Notable:** debt là số đo được + xu hướng, không phải cảm giác.
- **Seen:** e70602a

### evolving-loop-two-gates
- **What:** Vòng tự cải tiến: digest tự sinh khi feature close (zero-effort dogfood) → rank pain×frequency×corroboration → Gate A (người chọn cluster) → fix qua Iron Law (bee-writing-skills, không inline) → suites green → Gate B (người duyệt diff) → push là bước tay có tên. Chỉ chạy trong repo bee, guard cơ học, không bao giờ auto/schedule.
- **Where:** `skills/bee-evolving/SKILL.md`, decision 0022
- **Notable:** self-modification = lane cao nhất + kỷ luật chặt nhất; "push never automatic" RED-tested 4 kịch bản.
- **Seen:** e70602a

### grooming-project-first
- **What:** Debt hunt báo cáo bằng ngôn ngữ project (không bee-jargon); `.bee/`, `.claude/` không bao giờ là project debt; chứng minh non-use trước khi gọi dead; approval từng kill, không batch; ghi outcome sau kill.
- **Where:** `skills/bee-grooming/SKILL.md`, decision 0014
- **Notable:** tách "dọn nhà mình" khỏi "dọn nhà chủ" — tránh harness tự soi rốn.
- **Seen:** e70602a

## ux

### silent-bookkeeping
- **What:** Bee mechanics (cells/claims/caps/phases) không bao giờ narrate vào chat; user nghe work language ("fixing X", "done — tests pass"); litmus: bỏ hết bee terms mà không mất gì = đừng dùng.
- **Where:** `AGENTS.md` rule 11, decision 1689af1b
- **Notable:** UX doctrine hiếm: máy móc càng nặng, giao tiếp càng phải nhẹ.
- **Seen:** e70602a

### status-token-protocol
- **What:** Worker kết thúc bằng status token chuẩn ([DONE]/[BLOCKED]/NOOP + report); orchestrator parse máy móc; "silence ≠ failure".
- **Where:** `skills/bee-executing/SKILL.md`, `references/swarming-reference.md`
- **Notable:** giao thức máy giữa orchestrator-worker thay vì đọc hiểu văn xuôi.
- **Seen:** e70602a

## testing-evals

### pressure-test-scenarios
- **What:** Test skill = 3–5 scenario, mỗi cái ≥3 áp lực từ 7 loại (Time, Sunk Cost, Authority, Economic, Exhaustion, Social, Ambiguity); chạy KHÔNG skill trước, ghi violation + rationalization verbatim.
- **Where:** `skills/bee-writing-skills/references/pressure-test-template.md`
- **Notable:** eval hành vi agent dưới áp lực, không phải happy path.
- **Seen:** e70602a

### hook-contract-parity-tests
- **What:** test_hook_contracts.mjs (1981 dòng): malformed payload, coverage gaps, byte-parity giữa 2 projection; parity rule: mọi rule trong guards/cells phải được exercise bởi CẢ hook test VÀ helper test.
- **Where:** `hooks/test_*.mjs`, `docs/06-runtime-integration.md`
- **Notable:** dual-runtime chỉ đứng vững nhờ parity test tự động.
- **Seen:** e70602a
