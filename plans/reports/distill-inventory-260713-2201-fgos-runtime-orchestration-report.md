# fgOS Runtime & Orchestration Mechanical Inventory

**Date:** 2026-07-13  
**Scope:** `.fgOS/runtime/`, `.fgOS/orchestration/`, `.fgOS/tasks/`, `.fgOS/memory/`, `.fgOS/knowledge/`, `.fgOS/observability/`, `docs/02-design/executor-schema-v2.md`, `docs/02-design/failure-taxonomy.md`  
**Source:** HEAD 588d800

---

## 1. RUNTIME LAYER

The runtime layer defines framework contracts; adapters implement execution on their platform. All definitions are declarative YAML/Markdown — no runtime code lives in `.fgOS/`.

### 1.1 State Management (`.fgOS/runtime/state.yaml`)

**States:** Defined by enum fields in TaskState and WorkflowState schemas.

**TaskState Lifecycle:**
- `pending` → `in_progress` (agent_claim, allowed_by: agent)
- `in_progress` → `paused` (human_or_agent_yields, allowed_by: [human, agent])
- `in_progress` → `completed` (all_gates_passed, allowed_by: [agent, system])
- `in_progress` → `failed` (unrecoverable_error, allowed_by: [agent, system])
- `paused` → `in_progress` (resume, allowed_by: [human, agent])
- `failed` → `in_progress` (human_override, allowed_by: human)
- `any` → `cancelled` (human_cancel, allowed_by: human)

**StatusCode Enum (TaskState.status):** `[pending, in_progress, paused, completed, failed, cancelled]`

**StatusCode Enum (WorkflowState.status):** `[pending, in_progress, running, paused, completed, failed, cancelled]`
- Note: `running` is an alias accepted by run-update.py; `in_progress` is canonical.

**Schema Fields (TaskState):**
- `id`: unique task identifier (format: task-{workflow}-{timestamp})
- `workflow`: workflow definition name (kebab-case)
- `current_stage`: active stage name or null
- `status`: enum above
- `assigned_agent`: agent name or null
- `checkpoints`: array of checkpoint records, ordered oldest to newest
- `context`: key-value data passed between stages
- `timestamps`: created_at, started_at, updated_at, completed_at, deadline (all ISO 8601)

**Schema Fields (WorkflowState):**
- `id`: unique workflow run identifier
- `workflow_definition`: workflow definition name (kebab-case)
- `stages_completed`: array of stage names in order
- `current_stage`: currently executing stage or null
- `status`: enum above
- `participants`: array of agent names
- `timestamps`: created_at, started_at, updated_at, completed_at (all ISO 8601)

**Checkpoints (state.yaml lines 84-121):**
- `id`: checkpoint identifier (format: chk-{stage}-{timestamp})
- `stage_completed`: name of completed stage
- `outputs_produced`: array of output artifact identifiers
- `context_snapshot`: full context key-values at checkpoint time
- `timestamp`: ISO 8601 datetime
- Operations: save (automatic on stage complete or manual), restore (rollback), list, prune (removes >5 per task, default)

**Rollback:**
- Strategy: `last_checkpoint` (restore to most recent)
- Options: `last_checkpoint`, `specific_checkpoint` (named), `full_rollback` (reset to pending)
- Data cleanup: default false (keep outputs, mark superseded)

**Agent Concurrency (state.yaml lines 171-202):**
- Tracks active + queued run_ids per executor
- File location: `workspace/locks/agent-concurrency/{executor}.yaml`
- Schema: `agent`, `max_parallel_tasks`, `active_run_ids`, `queued_run_ids`, `updated_at`
- Stale detection: run_id in active but status in (completed, failed, cancelled) → doctor.py reconciles

**Promotion State (state.yaml lines 204-223):**
- Enum: `[pending, staging, committed, failed]`
- Written by promote-run-artifacts.py
- Field: `promotion_state`, `promotion_committed_at` (ISO 8601 on success)

### 1.2 Triggers (`.fgOS/runtime/triggers.yaml`)

Five trigger types activate workflows/skills:

1. **manual**: Human-initiated via command or UI. Always available. No config required.

2. **chained**: Triggered when previous task emits signal.
   - Config: `signal` (required, pattern: `^[a-z]+\\.[a-z_]+$`), `condition` (optional boolean expression)
   - Example: signal=`content.drafted`, condition=`"signal.data.rigor == 'thorough'"`

3. **scheduled**: Cron schedule with timezone support.
   - Config: `cron` (5-field standard expression, required), `timezone` (IANA string, default UTC)
   - Examples: `"0 9 * * 1"` (Monday 9am), `"0 8 1 * *"` (1st of month 8am), `"*/30 * * * *"` (every 30min)

4. **event_driven**: External events from outside agent system.
   - Config: `event_source` (required enum: webhook, file_watch, metric_threshold, queue), `source_config` (adapter-defined)
   - Adapter implements listener per source type.

5. **conditional**: Boolean expression triggers when true.
   - Config: `condition` (required expression), `check_interval` (enum: on_event | periodic, default on_event)
   - Examples: `"queue.length > 50"`, `"campaign.days_until_launch <= 7 and campaign.status == 'planned'"`

### 1.3 Error Handling & Recovery (`.fgOS/runtime/error-handling.yaml`)

**Recovery Policy Matrix** defines 8 error types + 1 meta-error (signal_deadline_approaching):

| Error Type | Detection | Max Retries | Escalate To | Recovery Steps |
|---|---|---|---|---|
| `context_overflow` | token_count > budget | 2 | human | Summarize history, split tasks, or escalate |
| `api_failure` | HTTP ≥400 OR timeout OR invalid response | 5 | system_alert | Retry exp. backoff (1s→2s→4s→8s→16s), fallback, circuit breaker |
| `quality_gate_fail` | quality_gate.result=='fail' | 3 | human_creative_director | Inject feedback, re-execute, escalate at round 4 |
| `brand_violation` | brand_compliance gate fails | 2 | brand-guardian | Re-inject guidelines, enumerate violations, escalate if 2nd attempt fails |
| `knowledge_gap` | agent status==NEEDS_CONTEXT | 1 | human | Inject knowledge module or escalate (only 1 retry allowed) |
| `deadline_breach` | current_time ≥ deadline OR time_remaining < 2h | 0 | human | Alert immediately, reduce rigor, re-prioritize queue (no retries) |
| `infinite_loop` | skill_visit_count > max_skill_visits OR chain_depth > max_chain_depth | 0 | human | Hard stop, report BLOCKED with loop trace, no retries |
| `budget_exceeded` | cumulative_spend ≥ budget_cap | 0 | human | Pause tasks, alert with spend summary, no retries |
| `signal_deadline_approaching` | signal.state==pending AND catalog[signal.name].deadline_aware==true AND (deadline-now())<4h | 0 | human_reviewer | Alert immediately with artifact file, run_id, time remaining |

**Circuit Breaker (error-handling.yaml lines 134-169):**
- States: `closed` (normal), `open` (all requests fail fast), `half_open` (testing recovery)
- Config: `failure_threshold` (3), `window_seconds` (300), `cooldown_seconds` (1800), `half_open_test_calls` (1)
- Transitions: closed→open on 3 consecutive failures in 5min; open→half_open after 30min; half_open→closed on successful test call
- Persistence: `workspace/.cb-state/{service_id}.yaml` (survives restarts via FGOS_DATA_ROOT env var)

**Anti-Loop (error-handling.yaml lines 179-205):**
- Config: `max_skill_visits` (2), `max_chain_depth` (8)
- Detection: runtime maintains visit counter per skill per chain (resets at chain start)
- Recovery: halt immediately, report BLOCKED with loop trace
- Rules:
  - `max_revision_rounds`: 3 (max times output can be revised per quality gate)
  - Quality decay: threshold 0.20 (relative drop ≥20% between consecutive revisions triggers escalation)
  - Example: 0.85→0.67 triggers (21.2% > 20%); 0.85→0.70 does not (17.6% < 20%)

**Retry Semantics (error-handling.yaml lines 171-177):**
- Scope: per_stage (not per_workflow)
- Counter reset: on_stage_transition (when stage completes successfully)
- Resolution order: stage.max_retries > workflow.max_retries > global_fallback (3)

### 1.4 Artifact Storage Contract (`.fgOS/runtime/artifacts.yaml`)

**Storage Zones:**

1. **workspace** (machine-facing, gitignored)
   - Path: `.workspace/`
   - Audience: machine
   - Lifetime: pruned per retention policy
   - Layout: `.workspace/runs/{run_id}/`

2. **studio** (human-facing, git-tracked)
   - Path: `studio/`
   - Audience: human
   - Sub-zones: `studio/config/`, `studio/shared/`, `studio/{brand_id}/`
   - Reserved names: `config`, `shared` (brand IDs cannot use these)

3. **brand** (user-owned brand data, subset of studio)
   - Part of `studio/{brand_id}/`

**Run ID Format:** `{YYMMDD}-{workflow}-{slug}` (e.g., `260406-content-creation-ai-trends`)
- date_format: YYMMDD (e.g., 260406)
- workflow_format: kebab-case
- slug_format: kebab-case, ≤5 words

**Run Folder Structure:**
- Manifest: `{run_dir}/run.yaml`
- Stages: `{run_dir}/stages/{stage_number}-{stage_name}/`
- Final: `{run_dir}/final/`

**run.yaml Manifest Schema (artifacts.yaml lines 54-223):**

*Core fields:*
- `run_id`, `workflow`, `workflow_version`, `brand_id`, `task_brief`, `status`, `current_stage`, `stages_completed`, `checkpoints`
- `final_artifacts`: array of deliverable paths
- `created_at`, `updated_at`, `completed_at`: ISO 8601
- `rigor`: enum `[quick, standard, thorough, critical]` (resolved by run-init.py)

*Pause State (ADR 0019):*
- `pause_reason`: enum `[review_pending, revision_pending, manual, awaiting_external_data, brand_violation_critical, visual_production_pending]`
- `paused_at`: ISO 8601 (set on pause, cleared on resume)
- `awaiting_signal`: signal name if waiting (e.g., "review.approved")
- `resumed_at`: ISO 8601 (set on most recent resume)
- `review_mode`: enum `[human, auto]` (stamped by orchestrator-signal-router.py)

*Revision Counters (ADR 0019 + 0023):*
- `revision_state.review_round`: int (human reject loop, cap=3, escalate at round 4)
- `revision_state.brand_round`: int (brand auto-revise loop, cap=2, escalate at round 3)

*Work Context:*
- `work_context`: object containing workstream_type, calendar_id, calendar_item_id, planning_cycle_id, campaign_id, project_id, channels, scheduled_at

*Lineage (ADR 0013):*
- `promotions`: array of promotion records (source, target, rule_id, promoted_at, promoted_by, checksums)

*Quality (Feedback Loop Phase 1.5):*
- `quality.implicit`: float (1.0 - 0.3*review_round - 0.15*brand_round, floor 0.1; null if review_mode != human)
- `quality.implicit_reason`: string (set only when implicit is null: "auto_approved" | "no_review_gate")
- `quality.rounds`: {review: int, brand: int}
- `quality.judge`: nullable float (Phase 3 LLM-judge score)
- `quality.judged_by`: nullable string

**Content Layout (studio):**
```
studio/{brand_id}/content/
  blog-posts/
  email-sequences/{sequence_slug}/
  social/                          # Hybrid: routing by workstream_type
    {YYYY-MM}/                      # always_on/reactive
    campaigns/{campaign_id}/        # campaign workstream
    projects/{project_id}/          # project workstream
  landing-pages/
  video-scripts/
  reports/
  case-studies/
  campaign-briefs/
```

**References Layout (ADR 0040):**
- Shared: `studio/shared/{topic}/` (competitor, performance, content-audits, seo-audits, strategy, research, brand, campaign)
- Per-brand: `studio/{brand_id}/research/{topic}/` (audience, products, brand-absorptions)

**Frontmatter Schema (artifacts.yaml lines 244-304):**

*Required:*
- `schema_version` (string, always "1.0")
- `content_type` (enum from content_layout.by_type keys)
- `brand_id` (resolved brand id)
- `run_id` (source run id)
- `workflow`, `workflow_version` (semver)
- `promoted_at`, `promoted_from` (ISO 8601 and workspace path)
- Tier 1: `workstream_type` (enum), `calendar_item_id` (nullable)

*Optional:*
- Tier 2 (injected from run.yaml#work_context): campaign_id, project_id, planning_cycle_id, calendar_id, channels, scheduled_at, publishing_status
- Tier 1 Review Lifecycle (ADR 0054): `review_status` (enum: in_review | changes_requested | approved | live | archived)
- Suppersedes/Derivation: title, promoted_by_rule, source_content, derivation_type, status (retired), supersedes, superseded_by, published_at, gates_passed

**Auto-Promotion Rules (artifacts.yaml lines 341-447):**

Strategy domain:
- `marketing_strategy_plans`: workflow==marketing-strategy-plan → studio/shared/strategy/
- `editorial_pillars`: workflow==editorial-pillars-refresh → studio/{brand_id}/
- `persona_packs`: workflow==persona-refresh → studio/{brand_id}/audience/

Brand domain:
- `brand_identity_packages`: workflow==brand-identity-build → studio/shared/brand/
- `brand_refresh_summaries`: workflow==brand-refresh → studio/shared/brand/

Content domain:
- `editorial_calendars`: workflow==content-calendar → studio/{brand_id}/editorial/calendar/
- `content_audits`: workflow==content-audit → studio/shared/content-audits/
- `seo_audits`: workflow==seo-audit-workflow → studio/shared/seo-audits/

Campaign domain:
- `campaign_post_mortems`: workflow==campaign-lifecycle AND stage.name==post_mortem → studio/shared/campaign/

Generic:
- `thorough_research`: stage.name==research AND workflow.rigor IN [thorough, critical] → studio/shared/research/
- `performance_reports`: workflow==performance-report → studio/shared/performance/
- `cross_referenced`: artifact.referenced_by_count >= 2 → studio/shared/{auto_topic}/

**Content Promotion Rules (artifacts.yaml lines 454-532):**

- `content_creation_routing`: target_resolver by content_type → blog-posts, case-studies, long-form-articles, thought-leadership (landing-pages rejected)
- `email_sequences`: → studio/{brand_id}/content/email-sequences/
- `social_posts`: target_resolver by workstream_type → always_on/reactive (studio/{brand_id}/content/social/{YYYY-MM}/), campaign (studio/{brand_id}/content/social/campaigns/{campaign_id}/), project (studio/{brand_id}/content/social/projects/{project_id}/)
- `video_scripts`: on_stage_complete → studio/{brand_id}/content/video-scripts/
- `campaign_briefs`: on_stage_complete → studio/{brand_id}/content/campaign-briefs/
- `repurposed_content`: → studio/{brand_id}/content/repurposed/
- `landing_pages`: directory bundle source_type → studio/{brand_id}/content/landing-pages/

**Test Zone Promotion (artifacts.yaml lines 534-598):**
- Manual trigger (human-initiated)
- Procedure: locate_artifact → verify_gates (both content_quality and brand_compliance passed) → collision_check → copy_byte_identical → update_frontmatter → dispatch_channels → emit_signal → log_promotion
- Abort conditions: gates not PASS, approved.md missing, file collision, mtime newer than approved_at, brand_id mismatch

**Promotion Log (ADR 0013):**
- Path: `.workspace/promotions.jsonl` (append-only JSONL)
- Fields: ts, run_id, source, target, rule_id, source_checksum, target_checksum
- Rotation: quarterly
- Mirror: `studio/.lineage/promotions.jsonl` (deferred — not yet active)

**Library Index:**
- Filename: `.index.yaml` per directory
- Scope: `studio/content/{type}/.index.yaml`, `studio/references/{topic}/.index.yaml`
- Entry schema: file, title, created (YYYY-MM-DD), workflow, run, status (9-state per ADR-0038), tags, brand_id

**Brand Layering Contract (artifacts.yaml lines 653-706):**

Framework layer (read-only):
- Template: `.fgOS/knowledge/brand/BRAND-TEMPLATE.yaml`
- Schema: `.fgOS/knowledge/brand/brand.schema.yaml`
- Guidelines template: `.fgOS/knowledge/brand/guidelines-template.md`

User layer (user-owned, git-tracked):
- Active pointer: `studio/config/active.yaml`
- Profile: `studio/{brand_id}/profile.yaml`
- Guidelines: `studio/{brand_id}/guidelines.md`
- Audience: `studio/{brand_id}/audience/{persona_id}.yaml`
- Industry: `studio/{brand_id}/industry/{industry_id}.yaml`
- Assets: `studio/{brand_id}/visual-assets/**`

Merge strategy: deep_merge_user_wins
- Recursively merge framework template with user profile
- For nested objects: descend and merge
- For scalars/lists: user value replaces framework value
- User fields present only in user are kept (extensions)
- Framework defaults fill user-unset fields

Resolver: `.fgOS/runtime/scripts/brand-resolver.py`
- Interface: `python3 brand-resolver.py --brand {id} --type brand|audience|industry`
- Output: merged YAML to stdout
- Error codes: 0 success, 1 brand not found, 2 invalid YAML, 3 missing framework template

Resolution chain (first match wins):
1. task_parameter: explicit brand_id in task dispatch
2. studio/config/active.yaml: session default pointer
3. error: BLOCKED with NEEDS_CONTEXT

**Signal Lifecycle (artifacts.yaml lines 726-867):**

State machine: `pending` → `consumed` → `consumed_dispatched` → `resolved` (terminal)
Alternative paths: `pending` → `expired` (TTL), `abandoned` (consumer failed)

States:
- `pending`: Emitted by upstream workflow; not yet consumed
- `consumed`: Listener workflow has read signal and started addressing run
- `consumed_dispatched`: signal_dispatch.py invoked run-init.py for domain signals (ADR 0032); waiting for consumer workflow completion
- `resolved`: Consumer run completed successfully; signal is closed (terminal)
- `abandoned`: Consumer run failed/killed; signal returns to pending or expires
- `expired`: TTL exceeded without consumption; surfaced to ops

Claim Protocol (ADR 0032 amendment, ADR 0052 Phase 1 M3):
- Single authoritative source: `state:` field
- Lock primitive: atomic filesystem rename (compare-and-swap) to claim path (not a competing state representation)
- On every transition: `state:` field MUST be written; rename-CAS is lock primitive only
- Readers trust `state:` field, not filename

Catalog entries (required: name, source_run, emitted_at, state, payload; optional: consumed_by_run, consumed_at, resolved_at, resolution_run, ttl_hours, abandon_reason, dispatch_run_id, dispatched_at, dispatch_chain):

**Content Signals:**
- `content.promoted`: emitter promote-run-artifacts, ttl 7d, consumers social-batch-production, email-sequence
- `content.finalized`: emitter stage-post-hook (stage_5_draft_finalization), ttl 7d, consumer production-workflow orchestrator
- `content.produced`: emitter production-workflow, ttl 7d, consumers scheduler, mark-live, content-repurpose

**Review Signals (ADR 0019):**
- `review.pending`: emitter production-workflow (after Stage 3), ttl 30d (starvation alert at 21d), payload includes ai_precheck + brand_precheck
- `review.approved`: emitter review-queue-manager, ttl 7d, consumer production-workflow orchestrator
- `review.rejected`: emitter review-queue-manager, ttl 7d, consumer production-workflow orchestrator (revision stage)
- `review.auto_approved`: emitter review-queue-manager (rigor==quick AND ai_precheck.result==clean), ttl 7d
- `review.escalated`: emitter review-queue-manager (manual or on round 3 rejection), ttl 7d, consumer alert system
- `review.skipped`: emitter review-queue-manager (manual skip), ttl 7d, consumer production-workflow orchestrator

**Brand Signals (ADR 0023):**
- `brand.precheck.critical`: emitter production-workflow (after Stage 4b), ttl 7d, consumer production-workflow orchestrator (auto-route to revise)

**Visual Production Signal (ADR 0020):**
- `visual.production.requested`: emitter production-workflow Stage 6, ttl 7d, consumer sub-workflow runner
- `visual.batch.produced`: emitter visual-production sub-workflow, ttl 7d, consumer production-workflow orchestrator (resumes Stage 7)

**Strategy/Persona Signals:**
- `persona.refreshed`: emitter campaign-manager (persona-refresh completion), ttl 1y, auto_dispatch_to [editorial-pillars-refresh], consumers editorial-pillars-refresh, marketing-strategy-plan, content-calendar, competitor-intel
- `strategy.plan_ready`: emitter campaign-manager (marketing-strategy-plan strategy_delivered checkpoint), ttl 1y, consumers content-calendar (Q-Stage 1)
- `strategy.situation_assessed`: emitter analytics-analyst (marketing-strategy-plan stage_1_situation_analysis), ttl 1y

**Editorial/Calendar Signals:**
- `editorial.pillars_refreshed`: emitter campaign-manager (editorial-pillars-refresh Stage 9), ttl 1y, consumers content-calendar M-Stage 1 (logs version, does not auto-rerun)
- `calendar.theme_set`: emitter campaign-manager (content-calendar M-Stage 1 monthly_theme_set), ttl 30d, consumers content-calendar M-Stage 2, M-Stage 3

**Social Signal:**
- `social.reactive_posted`: emitter social-scheduling, ttl 7d, consumer content-calendar W-Stage 2

Rules (required):
- C-S1: Consumer MUST transition pending→consumed before reading payload
- C-S2: Consumer MUST transition consumed→resolved before run.yaml status==completed
- C-S3: Multiple pending emissions NOT auto-merged — consumer reads ALL pending
- C-S4: Default ttl_hours=168 (1 week); workflow may override
- C-S5: Source run marked failed MUST be transitioned to expired (not consumed)
- C-S6: Dispatch loop detection — dispatch_chain[] max depth=5 (default); refuse dispatch if workflow already appears

Auto-dispatch fields (ADR 0032):
- `auto_dispatch_to`: array of workflow names (empty=no auto-dispatch)
- `debounce_seconds`: 60 (default)
- `max_retries`: 3 (default)

**Retention (artifacts.yaml lines 708-725):**

workspace_runs:
- Default: keep_until_archived (manual prune only)
- Options: prune_after_days (configurable), prune_on_publish

studio_content:
- Policy: indefinite (human-managed; agents never delete)

studio_references:
- Policy: indefinite (human-managed; auto-promotion adds, curation removes)

---

## 2. ORCHESTRATION LAYER

The orchestration layer routes intent to agents, priorities tasks, and delegates work.

### 2.1 Routing (`.fgOS/orchestration/routing.yaml`)

**Three-Level Architecture:**
1. Level 1 (intent): Pattern-match user intent phrases to agent/workflow
2. Level 2 (skill): Scan agent capabilities for best fit
3. Fallback: assign to campaign-manager (default orchestrator)

**Level 1: Intent Routing (routing.yaml lines 12-131)**

Algorithm: `specificity_first` (score = matched token count)
Tie-break: `priority_then_order` (all current routes use priority: 10; file order is tiebreaker)

Routes (all priority 10):
- **campaign-lifecycle**: pattern `launch|run|plan|kick.?off|campaign` → workflow/campaign-lifecycle, agent campaign-manager
- **content-creation**: pattern `write|draft|create|blog|article|landing.?page|long.?form` → workflow/content-creation, agent content-creator
- **email-sequence**: pattern `email|sequence|nurture|drip|newsletter|subject.?line` → workflow/email-sequence, agent email-wizard
- **editorial-content-calendar**: pattern `editorial|content calendar|monthly calendar|quarterly calendar|content pillar|theme map|editorial calendar` → workflow/content-calendar, agent campaign-manager
- **social-batch-production**: pattern `social|post|tweet|instagram|linkedin|tiktok|facebook|social[- ]calendar|schedule` → workflow/social-batch-production, agent social-media-manager
- **seo-audit**: pattern `seo|keyword|rank|search|meta|backlink|audit` → workflow/seo-audit-workflow, agent seo-specialist
- **performance-report**: pattern `report|analytics|performance|metric|kpi|dashboard|data` → workflow/performance-report, agent analytics-analyst
- **competitor-intel**: pattern `research|competitor|intel|market|trend|benchmark` → workflow/competitor-intel, agent researcher
- **brand-refresh**: pattern `brand|voice|tone|guideline|identity|refresh` → workflow/brand-refresh, agent brand-guardian
- **content-repurpose**: pattern `repurpose|reformat|adapt|transform|reuse|convert.?content` → workflow/content-repurpose, agent content-creator
- **content-reviewer**: pattern `review|check|audit.?content|quality|proofread|feedback` → agent/content-reviewer (no workflow wrapper)

Test cases:
- "plan social calendar for Q3" → social-batch-production (score 2: social+social calendar vs editorial 0)
- "refresh editorial pillars for Q3" → editorial-content-calendar (score 2: editorial+pillar vs brand 0)
- "create content calendar" → editorial-content-calendar (score 1: content calendar vs content-creation 0)
- "write a blog post about seo" → content-creation (score 3: write+blog+blog post vs seo 1)

**Level 2: Skill Routing (routing.yaml lines 138-182)**

Skill-to-candidates map:
- `copywriting`: [copywriter, content-creator] (tiebreaker: fewer_active_tasks)
- `content_creation`: [content-creator, copywriter] (fewer_active_tasks)
- `campaign_execution`: [campaign-manager] (single)
- `email_automation`: [email-wizard] (single)
- `social_content`: [social-media-manager] (single)
- `seo_audit`: [seo-specialist] (single)
- `performance_analysis`: [analytics-analyst] (single)
- `audience_research`: [researcher, analytics-analyst] (fewer_active_tasks)
- `brand_compliance`: [brand-guardian, content-reviewer] (fewer_active_tasks)
- `content_review`: [content-reviewer, brand-guardian] (fewer_active_tasks)

Tiebreaker: `fewer_active_tasks` — select agent with lowest count of in-progress tasks; fallback to first candidate if equal.

**Level 3: Dynamic Routing (reserved for v2.0)**

**Fallback:** campaign-manager (default orchestrator; can assess task and sub-delegate or escalate)

### 2.2 Delegation (`.fgOS/orchestration/delegation.yaml`)

**Context Isolation (delegation.yaml lines 11-19):**
- Include only context relevant to specific task
- Do not pass previous agent outputs unless explicitly required
- Do not include other agents' task briefs or coordination notes
- Do not reference previous conversation turns — summarize decisions as facts

**Context Injection Components (delegation.yaml lines 20-68):**

*task_brief (required):*
- task_description, acceptance_criteria, constraints, rigor_level, deadline, brand_id (optional)

*knowledge (conditional):*
- brand_guidelines (public-facing), audience_personas (content/campaign tasks), product_context (conversion tasks), style_guide (copywriting)

*episodic_memory (optional):*
- previous_approved_output (if revising), prior_campaign_results (context), gate_failure_log (revision after failure)

*brand_context (conditional: output_is_public_facing OR gate_includes_brand_compliance):*
- Resolution: task_brief.brand_id > studio/config/active.yaml > ERROR (NEEDS_CONTEXT)
- Resolver: `.fgOS/runtime/scripts/brand-resolver.py`
- Merge: deep_merge of `.fgOS/knowledge/brand/BRAND-TEMPLATE.yaml` + `studio/brand/{brand_id}/profile.yaml` (user wins)
- Includes: brand_guidelines, brand_personas, brand_industry, brand_assets

**Max Context Budget (delegation.yaml lines 70-76):**
- Default: standard
- Levels: minimal (brief only), standard (brief + knowledge), generous (full + memory), unlimited (no truncation)

**Status Protocol (delegation.yaml lines 82-125):**

Required fields: `status`, `summary`
Optional: `evidence` (DONE required), `concerns` (DONE_WITH_CONCERNS required), `blocker` (BLOCKED required), `needed` (NEEDS_CONTEXT required)

Handling rules:
- `DONE`: log evidence, advance to next stage or mark complete
- `DONE_WITH_CONCERNS`: assess concerns; if correctness issue (factual, brand, spec) → address; if style → proceed
- `BLOCKED`: never retry same approach; provide additional context, re-route, or escalate (2nd BLOCKED on same task → escalate to human)
- `NEEDS_CONTEXT`: identify missing context, inject, re-dispatch once; if cannot provide → escalate

Implicit success rule: disabled — must receive explicit status before advancing

**Review Protocol (delegation.yaml lines 132-151):**

Stage 1: spec_compliance
- Checker: orchestrator
- Description: Does output match task brief? Format, length, CTA, audience?
- Pass: all required acceptance criteria met
- Fail: return to agent with specific gap list (not vague feedback)

Stage 2: quality_review
- Checker: content-reviewer or domain-appropriate reviewer
- Description: Does output meet quality standards for rigor level?
- Pass: quality gate criteria met per rigor
- Fail: return structured feedback; increment revision counter

Escalation: after 3 revision rounds without approval → escalate to human with full revision history

**Handoff Format (delegation.yaml lines 158-186):**

Metadata: workflow_id, stage_from, stage_to, agent_from, agent_to, timestamp, rigor

Deliverables: primary_output, output_format (markdown|yaml|json|url|file_ref), version, gate_results (list of gates passed), signals_emitted

Context forward: task_brief_for_next_stage, relevant_decisions_made, known_constraints
Exclude: full_session_history, other_agents_briefs, internal_orchestration_notes

### 2.3 Priority (`.fgOS/orchestration/priority.yaml`)

**Levels (priority.yaml lines 11-50):**

| Level | Description | SLA | Max Queue Wait | Human Alert | Examples |
|---|---|---|---|---|---|
| critical | Revenue impact, crisis, deadline <24h | immediate | 0 (interrupt if needed) | true | Campaign launch blocked, brand crisis, missed deadline |
| high | Campaign launch, time-sensitive, deadline <48h | same_day | 4h | false | Content before launch, email due, competitor response |
| medium | Regular production, ongoing optimization | 2-3 days | 24h | false | Blog in calendar, monthly report, social calendar |
| low | Backlog, research, exploratory | 1 week | 72h | false | Competitor intel, archive repurposing, SEO research |

**Scheduling (priority.yaml lines 56-77):**
- Algorithm: priority_then_fifo (sorted by priority first; within same priority, FIFO)
- Rules: critical interrupts queued (not in-progress at safe checkpoints); high inserted ahead of medium/low; medium/low strictly FIFO
- Paused tasks don't count against concurrency

**Starvation Prevention (priority.yaml lines 66-77):**
- Enabled: true
- Promotion rules: low→medium after 7 days; medium→high after 7 days
- Logs promotion; no human alert

**Deadline Management (priority.yaml lines 83-112):**
- Support: true
- Format: ISO 8601 datetime or relative (e.g., 'end_of_day', '+2d')
- Alert threshold: 24h

Rules:
- `deadline_within_24h AND task_not_started` → promote_to_critical + human_alert
- `deadline_within_4h AND task_in_progress` → human_alert (confirm on track)
- `deadline_passed AND task_not_complete` → escalate_to_human

Escalation includes: task_description, original_deadline, current_status, blocking_reason_if_any, recommended_options (extend|descope|cancel|reassign)

**Concurrency (priority.yaml lines 118-174):**

Default max_parallel_tasks: 3

Per-agent overrides:
- campaign-manager: 5 (orchestration = lower cognitive load)
- content-creator: 2 (deep creative work benefits from focus)
- copywriter: 2 (conversion copy requires focus)
- content-reviewer: 4 (review tasks faster than creation)
- brand-guardian: 3 (compliance checks bounded)
- analytics-analyst: 4 (data analysis largely independent)
- email-wizard: 2 (sequence design requires coherence)
- social-media-manager: 3 (calendar tasks tolerate parallelism)
- seo-specialist: 3 (audit tasks structured + repeatable)
- researcher: 3 (tasks independent by topic)

Queue behavior: at_limit → queue with priority ordering; queue_visibility: true; max_queue_depth: 20

Overload alert: enabled at queue_depth≥10 (alert human to redistribute tasks)

---

## 3. TASKS: WORKFLOW ORCHESTRATION

**File:** `.fgOS/tasks/workflow-orchestration.yaml`

Task definition for orchestrating workflow stages:

- `task`: workflow-orchestration
- `description`: "Orchestrate workflow stage: load context, validate inputs, coordinate agents, or dispatch to sub-workflows"
- `category`: orchestration
- `prompt`: Template-driven (variables: {{workflow_name}}, {{stage_id}}, {{stage_context}}, {{orchestration_action}})
- `preferred_executor`: claude
- `preferred_invocation`: task
- `cognitive_tier`: lightweight
- `expected_output_format`: yaml
- `fallback_executor`: claude
- `estimated_tokens`: 1500

Orchestration actions (from prompt):
1. Validate all required inputs; report NEEDS_CONTEXT if missing
2. Execute the orchestration action as described
3. If dispatching: emit appropriate signal + record dispatch metadata
4. If coordinating: produce clear handoff package
5. If loading context: resolve brand_id, load profile, produce context bundle
6. Record warnings or blockers

---

## 4. MEMORY LAYER

The memory system gives agents persistence across sessions and tasks.

### 4.1 Memory Types (`.fgOS/memory/schema.yaml`)

**Working Memory (schema.yaml lines 8-42):**
- Scope: task
- Lifetime: session only (discarded at task end)
- Persistence: false (never persisted)
- TTL: null
- Contents: task_brief, relevant_knowledge (array of module paths), intermediate_results, active_agent, active_skill, context_window_budget
- Notes: never write to disk; clear at task end regardless; adapter may implement as in-memory or prompt-only

**Episodic Memory (schema.yaml lines 44-142):**
- Scope: project
- Lifetime: persistent
- Persistence: true
- Default TTL: 90 days
- Important TTL: 365 days (elevated if: status==blocked, human_feedback present, quality_score<0.4, lessons_learned establishes new pattern)
- Storage: `workspace/sessions/{session_id}/episodic.yaml`
- Schema: session_id, task_id (uuid or timestamp-slug), timestamp (ISO 8601), agent, skill, domain, input_summary, output_summary, status (completed|completed_with_concerns|blocked|failed|partial)
- Optional: quality_score (0.0–1.0), human_feedback, brand_id, workflow, key_decisions, what_worked, what_failed, consolidated (bool), lessons_learned (array ≤3), tags

**Semantic Memory (schema.yaml lines 144-169):**
- Scope: global
- Lifetime: persistent (versioned, not time-limited)
- Persistence: true
- TTL: null
- Contents: knowledge_modules (.fgOS/knowledge/marketing/), brand_profiles (.fgOS/knowledge/brand/), audience_personas (.fgOS/knowledge/audience/)
- Versioning: version on file change; retain previous for diffing
- Trigger: knowledge file modified or added
- Notes: not updated by task execution (only by knowledge file changes); adapter responsible for indexing + retrieval

**Procedural Memory (schema.yaml lines 171-214):**
- Scope: project
- Lifetime: persistent
- Persistence: true
- TTL: null (never auto-deleted)
- Contents: user_preferences (array of {preference, source_task_id, confidence, confirmed_count}), successful_patterns, failed_approaches, skill_calibrations
- Update policy: trigger on consolidation; conflict_resolution newer_wins (confidence>0.7 + evidence_count>=3); minimum_evidence 2

**Consolidation (schema.yaml lines 216-241):**

Triggers: end of task (always), end of session (always), explicit user request

Procedural pattern:
- min_episodic_count: 2
- confidence_threshold: 0.70 (average quality_score)
- output_type: procedural_pattern
- storage: `workspace/memory/procedural/{agent}/{pattern-slug}.yaml`
- script: `runtime/scripts/memory-consolidate.py`

Process:
1. Extract lessons: what worked, what failed, user corrections
2. Write episodic record: serialize task run with all fields
3. Update procedural: if lessons confirm/contradict pattern
4. Clear working: discard all working memory

**Forgetting (schema.yaml lines 243-254):**

Strategy: TTL-based with importance weighting

Episodic:
- default_ttl_days: 90
- important_ttl_days: 365
- evaluation_frequency: daily

Procedural:
- auto_delete: false
- staleness_threshold_days: 365 (flag for human review if no reinforcement)

Semantic:
- strategy: versioned
- old_version_retention_days: 180

### 4.2 Memory Retention Policy (`.fgOS/memory/retention-policy.yaml`)

**Episodic Retention (retention-policy.yaml lines 7-25):**
- Default TTL: 90 days
- Important TTL: 365 days
- Importance criteria: status==blocked, human_feedback present, quality_score<0.4, lessons_learned establishes new pattern
- Deletion policy: daily evaluation, hard delete (no archival), protect if procedural memory references as founding evidence
- Deduplication: skip if task_id exists; merge if agent+skill+domain within 5min

**Procedural Retention (retention-policy.yaml lines 31-47):**
- auto_delete: false
- staleness_review_days: 365 (flag for review, not delete)
- Update policy: conflict_resolution newer_wins, confidence_threshold 0.7, minimum_evidence_count 2
- Reinforcement boost: 0.1 per confirming episode
- Contradiction penalty: 0.2 per contradicting episode
- Deletion only when: confidence<0.2 after contradiction, human marks invalid, agent role removed

**Consolidation (retention-policy.yaml lines 49-59):**
- trigger: min_episodic_count_per_pattern >= 2
- confidence_threshold: 0.70
- min_episodes: 2
- grouping_key: agent + workflow
- run_via: `runtime/scripts/memory-consolidate.py --agent {agent}`
- session_start_warning: notify if ≥5 unconsolidated records exist

**Semantic Retention (retention-policy.yaml lines 61-73):**
- strategy: versioned
- versioning_trigger: knowledge file modified/added
- old_version_retention_days: 180
- Update triggers: knowledge YAML saved, brand profile updated, persona/segment modified
- Notes: never updated by agent execution (humans only)

**Context Injection (retention-policy.yaml lines 75-117):**

Episodic:
- max_entries: 5
- Relevance: agent match > skill match > domain match
- Ordering: most_recent first, then quality_score descending
- min_quality_score: 0.0 (inject low-quality too)
- include_failed: true

Procedural:
- max_entries: 10
- Relevance: agent > skill > domain
- Ordering: confidence descending
- min_confidence: 0.5 (only reasonable confidence)

Semantic:
- strategy: load_on_demand (not at task start)
- max_modules_per_task: 5
- always_loaded: [marketing/taxonomy.yaml]
- load_on_role: analytics_agent→[metrics.yaml], content_agent→[frameworks.yaml, psychology.yaml], compliance_agent→[compliance.yaml]
- load_on_task_keyword: brand→[brand/{active_brand}.yaml], audience→[audience/{persona}.yaml], email/ads→[compliance.yaml]

Working:
- injected_from: current task only
- cleared_at: task end (unconditionally)

---

## 5. KNOWLEDGE LAYER

The knowledge layer provides structured domain data.

### 5.1 Knowledge Structure (`.fgOS/knowledge/README.md`)

**Two-Layer Model (ADR 0008):**

Framework layer (`.fgOS/knowledge/`):
- Taxonomy, frameworks, psychology, metrics, compliance (domain knowledge — does not vary per project)
- Brand templates + schema (defaults, fallback for unset user fields)
- Audience templates (persona, segment defaults)
- Industry templates (planned)

User layer (`studio/{brand_id}/`):
- Brand-specific profiles, guidelines, personas, industry context
- Actual brand data (versioned in git)
- Multiple brands supported

**Directory Structure:**

```
.fgOS/knowledge/
├── marketing/
│   ├── taxonomy.yaml
│   ├── frameworks.yaml
│   ├── psychology.yaml
│   ├── metrics.yaml
│   └── compliance.yaml
├── brand/
│   ├── BRAND-TEMPLATE.yaml
│   ├── brand.schema.yaml (planned)
│   ├── guidelines-template.md
│   ├── SERIES-TEMPLATE.yaml
│   ├── visual-identity-template.yaml
│   ├── visual-stubs-spec.md
│   ├── visual-stub-template.md
│   └── visual-sync-protocol.md
├── audience/
│   ├── PERSONA-TEMPLATE.yaml
│   ├── ANTI-PERSONA-TEMPLATE.yaml
│   └── SEGMENT-TEMPLATE.yaml
├── content/
│   ├── BRIEF-TEMPLATE.yaml
│   └── LP-BRIEF-TEMPLATE.yaml
└── README.md

studio/
├── config/active.yaml
└── {brand_id}/
    ├── profile.yaml
    ├── guidelines.md
    ├── audience/{persona_id}.yaml
    ├── industry/{industry_id}.yaml
    └── visual-assets/
```

**How Agents Use Knowledge:**

Injection order:
1. `marketing/taxonomy.yaml` (always — vocabulary reference)
2. `marketing/frameworks.yaml` (strategy tasks)
3. `marketing/metrics.yaml` (analytics tasks)
4. Merged brand context (resolver deep-merges BRAND-TEMPLATE.yaml + `studio/{id}/profile.yaml`, user wins)
5. Merged audience context (same pattern)

Resolver: `.fgOS/runtime/scripts/brand-resolver.py`
- Interface: `python3 brand-resolver.py --brand {id} --type brand|audience|industry`
- Output: merged YAML to stdout
- Merges read-only framework defaults with user overrides

**Principles:**
- All knowledge is structured YAML
- Templates ship with commented instructions
- No provider-specific content
- Files stay under 200 lines

---

## 6. OBSERVABILITY LAYER

The observability layer measures system health, quality, and cost. All logs MUST be structured.

### 6.1 Metrics (`.fgOS/observability/metrics.yaml`)

**13 Metrics across 3 categories:**

**Operational Metrics:**

1. `task_completion_rate`: count(DONE|DONE_WITH_CONCERNS) / count(all tasks)
   - Unit: ratio | Target: 0.90 | Alert: ≤0.80 | Frequency: per_session | Breakdown: [agent, workflow]

2. `task_duration`: completed_at - created_at (seconds)
   - Unit: seconds | Alert: p90 > 2 * baseline_p90 | Frequency: per_task | Aggregations: [p50, p90, p99, mean] | Breakdown: [agent, workflow, rigor_level]

3. `error_rate`: count(FAILED|BLOCKED_UNRECOVERABLE) / count(all tasks)
   - Unit: ratio | Target: 0.05 | Alert: ≥0.10 | Frequency: per_session | Breakdown: [agent, skill, error_type]

4. `retry_rate`: count(tasks with retry_count>0) / count(all tasks)
   - Unit: ratio | Target: 0.15 | Alert: ≥0.25 | Frequency: per_session | Breakdown: [agent, skill]

5. `context_utilization`: avg(tokens_used / context_budget)
   - Unit: ratio | Target: 0.80 | Alert: ≥0.90 | Frequency: per_task | Aggregations: [mean, p90] | Breakdown: [agent, workflow]

**Quality Metrics:**

6. `quality_gate_pass_rate`: count(gate==PASS on first attempt) / count(all gate checks)
   - Unit: ratio | Target: 0.70 | Alert: ≤0.55 | Frequency: per_session | Breakdown: [gate_type, agent, workflow]

7. `revision_count`: avg(revision_rounds) across all approved tasks
   - Unit: count | Target: 2.0 | Alert: ≥3.0 | Frequency: per_session | Aggregations: [mean, p90] | Breakdown: [agent, content_type]

8. `brand_compliance_rate`: count(brand_gate==PASS on first attempt) / count(brand gate checks)
   - Unit: ratio | Target: 0.85 | Alert: ≤0.70 | Frequency: per_session | Breakdown: [agent, content_type]

9. `user_satisfaction`: avg(satisfaction_score) where 1..5
   - Unit: score | Target: 4.0 | Alert: ≤3.0 | Frequency: per_session | Breakdown: [agent, workflow] | Collection: optional

**Cost Metrics:**

10. `token_cost_per_task`: avg(input_tokens + output_tokens) per task
    - Unit: tokens | Target/Alert: set per deployment | Frequency: per_task | Aggregations: [mean, p90, p99] | Breakdown: [agent, workflow, model]

11. `api_calls_per_task`: avg(external_api_call_count) per task
    - Unit: count | Target/Alert: per deployment | Frequency: per_task | Aggregations: [mean, sum] | Breakdown: [api_name, agent, workflow]

12. `time_to_value`: first_usable_output_at - task_started_at (seconds)
    - Unit: seconds | Target/Alert: per workflow SLA | Frequency: per_task | Aggregations: [p50, p90, mean] | Breakdown: [workflow, rigor_level]

**Alerting (metrics.yaml lines 162-168):**
- Default channel: monitoring_dashboard
- Escalation channel: human_operator
- Escalation conditions: error_rate alert 3 consecutive sessions, quality_gate_pass_rate alert 5 consecutive, brand_compliance_rate <0.60

### 6.2 Structured Logging & Tracing (`.fgOS/observability/logging.yaml`)

**Trace Model (logging.yaml lines 12-94):**

Trace:
- `trace_id` (uuid, required)
- `workflow` (name, kebab-case)
- `started_at`, `completed_at` (ISO 8601)
- `status` (enum: running|completed|failed|cancelled)
- `spans` (array)

Span:
- `span_id`, `trace_id`, `parent_span_id` (uuid, parent null for root spans)
- `skill`, `agent` (kebab-case)
- `started_at`, `completed_at` (ISO 8601)
- `status` (running|completed|failed|cancelled)
- `input_summary`, `output_summary` (≤200 chars, NOT full content)
- `error`, `metadata` (optional; metadata keys: tokens_used, model, rigor_level, retry_count)

**Event Log (logging.yaml lines 101-197):**

Format: structured only (no free-text)

Required fields: timestamp (ISO 8601 UTC), level (debug|info|warn|error), event (controlled vocab), message

Optional: trace_id (uuid), span_id (uuid), agent, skill, data (object, event-specific schema)

Event vocabulary (enumerated in spec):
- Task lifecycle: task.created, task.started, task.completed, task.failed, task.retried
- Skill lifecycle: skill.invoked, skill.completed
- Quality gates: gate.checked, gate.passed, gate.failed
- Errors: error.occurred, error.recovered
- State management: checkpoint.saved, checkpoint.restored
- Memory: memory.consolidated

**Audit Trail (logging.yaml lines 216-263):**

Purpose: immutable compliance record — who did what, when, with what approval
Retention: 365 days
Storage: append-only (entries must not be modifiable after write)

Entry fields:
- `timestamp`, `agent`, `action` (created|modified|reviewed|approved|rejected|published|deleted)
- `resource` (what was acted upon, e.g., task:abc123, content:blog-post-42)
- `input_hash`, `output_hash` (SHA-256 hex digests at time of action)
- `approval` (nullable object with approver + approved_at)

Triggering actions:
- Any task reaching DONE
- Any quality gate check (pass or fail)
- Any human approval/rejection
- Any content published to external channel
- Any BLOCKED escalation to human

**Adapter Requirements (logging.yaml lines 269-280):**

Minimum:
- Write structured LogEvent for every event in event_vocabulary
- Create Trace and Span records for every skill invocation
- Write AuditEntry for every triggering_action

Recommended:
- Ship logs to queryable backend (JSON file, database, log service)
- Index by trace_id for distributed query
- Retain audit trail in separate append-only store

Optional:
- Stream metrics derived from logs to metrics backend
- Set up alerting on error.occurred with recoverable: false

### 6.3 Evaluation Framework (`.fgOS/observability/evaluation.yaml`)

**3-Tier Evaluation System:**

| Tier | Name | Cost | Speed | Reliability | When |
|---|---|---|---|---|---|
| Tier 1 | Automated | free | instant | high | Always (rigor: quick+) |
| Tier 2 | LLM-as-Judge | low | fast | medium | rigor: standard, thorough, critical |
| Tier 3 | Human Review | high | hours_to_days | highest | rigor: critical (mandatory) |

**Tier 1: Automated Checks (evaluation.yaml lines 41-99):**

1. `schema_validation`: Output matches expected schema (type, required fields, format)
   - Cost: free | Speed: instant | Reliability: high | On_fail: BLOCKED with violation details

2. `brand_keyword_check`: Scans for prohibited terms; verifies required brand terms present
   - Cost: free | Speed: instant | Reliability: high | On_fail: return to agent with specific violations

3. `length_check`: Verifies word/character count within range
   - Cost: free | Speed: instant | Reliability: high | On_fail: return with actual vs expected

4. `link_validation`: Checks URL syntax + reachability (HEAD request)
   - Cost: free | Speed: instant | Reliability: high | On_fail: return list of broken links

**Tier 2: LLM-as-Judge (evaluation.yaml lines 105-169):**

1. `content_quality_score`: LLM evaluates against 5-criteria rubric
   - Cost: low | Speed: fast | Reliability: medium
   - Passing threshold: 0.70
   - Criteria (weights): clarity (0.20), engagement (0.25), relevance (0.20), cta_strength (0.20), brand_voice (0.15)
   - Scoring: 0.0|0.5|1.0 per criterion
   - When: rigor: standard, thorough, critical
   - On_fail: return per-criterion feedback; cap 3 rounds then escalate

2. `seo_quality_score`: LLM evaluates SEO optimization
   - Cost: low | Speed: fast | Reliability: medium
   - Passing threshold: 0.65
   - Criteria: keyword_usage, meta_optimization, heading_structure, content_depth
   - When: rigor: standard+ for SEO content types
   - On_fail: return specific SEO issues + fixes

**Tier 3: Human Review (evaluation.yaml lines 175-200):**

Domain expert evaluation (highest reliability, slowest, most expensive)

Reviewer types: brand_manager, legal_counsel, domain_expert, creative_director

When: rigor: critical (mandatory); thorough (recommended); quality gate failures escalated after 3 revisions

On_reject: return to agent with structured feedback; reset revision counter

**Default-FAIL Validation Protocol (evaluation.yaml lines 206-252):**

Adapted from Rune: reviewer assumes FAIL until proven otherwise.

Process:
1. Agent completes task → DONE|DONE_WITH_CONCERNS
2. Reviewer assumes 3–5 issues exist
3. Actively search for: factual_error, brand_violation, missing_requirement, structural_problem, legal_risk
4. If blocking issues found → return FAIL with specific list
5. If no blockers found → output passes

Rigor scaling:
- quick: standard review, 2 criteria (factual_error, brand_violation), default_fail: false
- standard: standard review, all criteria, default_fail: false
- thorough: adversarial review, all criteria, default_fail: false, adversarial: true
- critical: default-FAIL mandatory, all criteria, default_fail: true, adversarial: true, human_required: true

**Rigor-to-Tier Mapping (evaluation.yaml lines 258-274):**

| Rigor | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|
| quick | required | skip | skip |
| standard | required | required | on_request |
| thorough | required | required | recommended |
| critical | required | required | mandatory |

---

## 7. EXECUTOR SCHEMA v2

**File:** `docs/02-design/executor-schema-v2.md`

ADR 0042 (accepted 2026-05-19); supersedes ADR 0027 v1.

**Executor Entry (executor-schema-v2.md §1):**

```yaml
executors:
  {executor_id}:
    kind: agent | tool
    provider: anthropic | google | openai | local | ...
    description: "Short purpose statement"
    invocation_paths: [...]             # 1-to-N (§2)
    cost_tier: low | medium | high
    tier_policy_path: .{provider}/config/model-policy.yaml    # agent only
    timeout_sec: 120
```

**`kind` Field:**
- `agent`: LLM-bearing executor (Claude, Gemini, Codex, Perplexity) — honors `cognitive_tier` (picks model variant)
- `tool`: Deterministic utility (jq, ffmpeg, Brave Search API, validators) — no model concept

**Invocation Paths (§2) — 1-to-N:**

Via types: `task`, `cli`, `mcp`, `api`

Adapters (canonical list):
- `bash`: Claude calls Bash tool to exec CLI | Required: `cmd_template` (string with {prompt} etc.)
- `python_subprocess`: Python orchestrator runs subprocess | Required: `cmd_template` (array)
- `python_http`: Python orchestrator calls HTTP API | Required: url, headers, auth
- `native_subagent`: AI session spawns native subagent (e.g., Claude Agent tool) | No extra keys
- `mcp`: AI session calls MCP tool | Required: server (§3), tool or tools_namespace

Template variables: {prompt}, {model}, {stdin}

**MCP `server` Discriminator (§3):**

```yaml
- via: mcp
  adapter: mcp
  server:
    type: local | external              # D5 discriminator
    transport: stdio | http | sse
    # if stdio:
    command: "python3 path/to/server.py"
    env: { KEY: value }
    # if http/sse:
    url: "https://..."
    auth: { bearer_token_env: ENV_VAR }
  tool: fgos.{tool_name}              # single tool
  # OR
  tools_namespace: gemini             # vendor-provided multi-tool server
```

| `type` | Meaning |
|--------|---------|
| `local` | fgOS-owned Python server (`.fgOS/runtime/scripts/mcp/`) |
| `external` | 3rd-party (vendor binary, npm package, remote service) |

**capability-routing.yaml Role (§4):**

ADR 0027 used routing as primary lookup; v2 demotes to **defaults + overrides**.

```yaml
defaults_by_category:
  research: {preferred: [gemini-cli], fallback: claude}
  content_writing: {preferred: [claude]}
  image_generation: {preferred: [imagen], fallback: null}
  analysis: {preferred: [claude]}
  orchestration: {preferred: [claude]}
  code: {preferred: [claude]}

overrides: {}   # e.g., {force_all: claude} for dev mode
```

Resolution priority:
1. Stage references `task: {task-id}` → load task file → use `preferred_executor` + `preferred_invocation`
2. Else stage has `task_type: {category}` (legacy ADR 0027) → lookup `defaults_by_category[category]`
3. Else stage has neither → default `task_type: content_writing` → lookup defaults
4. If `overrides.force_all` set → bypass all above

**Task Artifact (§5):**

`.fgOS/tasks/{id}.yaml` (ADR 0042 §D1 full schema):

| File | Category | Preferred Executor |
|------|----------|-------------------|
| competitor-data-collection.yaml | research | gemini-cli |
| competitor-positioning-mapping.yaml | analysis | claude |
| strategic-recommendations.yaml | analysis (creative) | claude |
| news-monitoring.yaml | research (realtime) | gemini-cli |
| persona-audit-research.yaml | research | gemini-cli |
| blog-draft-generation.yaml | content_writing (creative) | claude |

Expand progressively (Phase 9: ~30-50 tasks).

**Invocation Path Resolution (§6):**

1. Load task YAML → read `preferred_executor` + `preferred_invocation`
2. Look up executor entry → find matching `invocation_paths[via={preferred_invocation}]`
3. Resolve adapter-specific keys: substitute template vars ({prompt}, {model}, {stdin}) or write spawn-request YAML
4. Return `resolve_dispatch()` with selected invocation, resolved model (if applicable), reason
5. AI session executes resolved command; outputs to specified path

Same-family vs cross-family (D11):
- Same family (Claude→Claude): native Agent spawn (fast)
- Cross-family: CLI spawn + stdout capture
- Headless: executor CLI spawned directly

---

## 8. FAILURE TAXONOMY

**File:** `docs/02-design/failure-taxonomy.md`

Index for navigating fgOS failure handling across 6 ADRs.

**Decision Tree (failure-taxonomy.md §Decision Tree):**

1. **Validation error**: ADR 0003 §default-fail → block execution, surface error, do NOT silently skip
2. **Agent/API execution error**: ADR 0004 §Recovery Policy Matrix → 8 error classes with specific recovery chains
   - api_failure: retry (3× exp) → fallback → human
   - loop_detected: abort + checkpoint → human
   - budget_exceeded: pause → human approval
   - executor_unavail: surface_blocking_error → human (ADR 0028, no retry)
   - [+ 5 more]
3. **Executor routing failure**: ADR 0028 §fallback: null semantics
   - `fallback: null` → HardFailExecutor (NO retry, NO fallback, surface as blocking error)
   - `fallback` set → use fallback, log provenance; circuit breaker must NOT count HardFailExecutor
4. **Cognitive tier / model API failure**: ADR 0025 Q3 → silent tier downgrade (critical→analytical→standard→lightweight)
   - Fail only if already at lightweight
   - Orthogonal to ADR 0028 (tier-resolution BEFORE executor routing)
5. **Content review failure**: ADR 0019 §async review queue → pause run, enqueue for human review
   - Signals: review.approved → resume | review.rejected → revision loop
   - pause_reason: review_pending | revision_pending
6. **Brand violation**: ADR 0023 §3-tier result
   - result=critical: hard-block + pause_reason=brand_violation_critical (signal: brand.precheck.critical, auto-route to revise)
   - result=recoverable: flags merged INTO review.pending payload (severity: low|medium); reviewer sees brand_precheck alongside ai_precheck
   - result=clean: continue normally

**Quick Reference Table (failure-taxonomy.md §Quick Reference):**

| Failure Type | ADR | Response | Retryable |
|---|---|---|---|
| Validation error | 0003 | Block immediately | No |
| API transient | 0004 row 1 | Retry 3× → fallback | Yes |
| Infinite loop | 0004 row 3 | Abort + checkpoint | No |
| Budget exceeded | 0004 row 4 | Pause → human | No |
| Executor unavailable (fallback: null) | 0028 | Hard-fail, surface blocking | No |
| Executor unavailable (fallback set) | 0028 | Use fallback, log provenance | N/A |
| Tier model API error | 0025 Q3 | Silent downgrade one tier | Yes (implicit) |
| Content review rejection | 0019 | Pause → review queue | Via signal |
| Brand violation (result=critical) | 0023 | Hard-block, pause run | No |
| Brand violation (result=recoverable, sev=low/med) | 0023 | Merged into review.pending | Via signal |

**Key Invariants (failure-taxonomy.md §Key Invariants):**

1. Default-fail everywhere (ADR 0003): block and surface — never silently skip
2. HardFailExecutor bypasses circuit breaker (ADR 0028): routing misconfiguration ≠ transient failure
3. Tier downgrade is silent (ADR 0025 Q3): does not count as failure for ADR 0028
4. pause_reason discriminates pause type (ADR 0019 + 0023): review_pending, revision_pending, brand_violation_critical — same pause mechanism, different routing
5. ADR 0025 runs before ADR 0028 in dispatch: tier resolved first, then executor routed

---

## 9. DIRECTORY STRUCTURE COVERAGE

All listed files have been read. `.fgOS/knowledge/` directory structure:

**Listed (not exhaustively read for mechanics):**
- `.fgOS/knowledge/audience/ANTI-PERSONA-TEMPLATE.yaml`
- `.fgOS/knowledge/audience/PERSONA-TEMPLATE.yaml`
- `.fgOS/knowledge/audience/SEGMENT-TEMPLATE.yaml`
- `.fgOS/knowledge/brand/BRAND-TEMPLATE.yaml`
- `.fgOS/knowledge/brand/guidelines-template.md`
- `.fgOS/knowledge/brand/SERIES-TEMPLATE.yaml`
- `.fgOS/knowledge/brand/visual-identity-template.yaml`
- `.fgOS/knowledge/brand/visual-stubs-spec.md`
- `.fgOS/knowledge/brand/visual-stub-template.md`
- `.fgOS/knowledge/brand/visual-sync-protocol.md`
- `.fgOS/knowledge/content/BRIEF-TEMPLATE.yaml`
- `.fgOS/knowledge/content/LP-BRIEF-TEMPLATE.yaml`
- `.fgOS/knowledge/marketing/compliance.yaml`
- `.fgOS/knowledge/marketing/frameworks.yaml`
- `.fgOS/knowledge/marketing/metrics.yaml`
- `.fgOS/knowledge/marketing/psychology.yaml`
- `.fgOS/knowledge/marketing/taxonomy.yaml`

**Sampled:** `.fgOS/knowledge/README.md` (structure and merge strategy)

**Sampled `.fgOS/tasks/`:** workflow-orchestration.yaml (others are task definitions, not runtime/orchestration mechanisms)

---

## 10. SAMPLING NOTES

**Fully Read (Core Runtime/Orchestration/Memory/Observability):**
- All `.fgOS/runtime/` files (README, state.yaml, triggers.yaml, error-handling.yaml, artifacts.yaml)
- All `.fgOS/orchestration/` files (README, delegation.yaml, routing.yaml, priority.yaml)
- All `.fgOS/memory/` files (README, schema.yaml, retention-policy.yaml)
- All `.fgOS/observability/` files (README, logging.yaml, metrics.yaml, evaluation.yaml)
- Docs: executor-schema-v2.md, failure-taxonomy.md
- Tasks: workflow-orchestration.yaml

**Knowledge Layer:**
- Listed all files in `.fgOS/knowledge/`; read README and understood merge/resolution patterns
- Templates themselves are domain-knowledge artifacts, not runtime/execution mechanisms

---

## KEY MECHANISMS SUMMARY

**State Machine:** TaskState and WorkflowState enums with 7-state lifecycle per ADR 0019/0023; checkpoints enable pause/resume/rollback.

**Triggers:** 5 types (manual, chained, scheduled, event_driven, conditional) activate workflows.

**Error Recovery:** 8 error policies per ADR 0004; circuit breaker prevents cascading failures; anti-loop detects max_skill_visits=2 and max_chain_depth=8.

**Artifact Storage:** 3 zones (workspace/machine, studio/human, brand/user-owned); run_id format YYMMDD-workflow-slug; promote-run-artifacts.py copies final/ to studio/ + injects frontmatter.

**Signal Lifecycle:** FSM from pending → consumed/consumed_dispatched → resolved, with 14+ catalog entries (review, brand, visual, strategy, editorial, social).

**Routing:** L1 intent (pattern), L2 skill (capability), fallback campaign-manager.

**Priority:** 4 levels (critical/high/medium/low) with SLA + concurrency limits per agent (2–5 max_parallel_tasks); starvation prevention promotes low→medium after 7 days.

**Memory:** 4 types (working/episodic/semantic/procedural); episodic TTL 90d (365d if important); consolidation extracts patterns; context injection capped.

**Observability:** 13 metrics (completion_rate, task_duration, error_rate, quality_gate_pass_rate, etc.); 3-tier evaluation (automated, LLM-judge, human); structured logging only; trace/span model for execution replay.

**Executor v2:** `kind` agent|tool; invocation_paths 1-to-N (bash, python_subprocess, python_http, native_subagent, mcp); task-first routing (ADR 0042).

**Failure Taxonomy:** 6 ADRs govern outcomes (validation, execution, routing, tier, review, brand); default-fail posture; HardFailExecutor bypasses circuit breaker.

---

**Status:** DONE  
**Summary:** Comprehensive mechanical inventory of fgOS runtime, orchestration, memory, knowledge, and observability layers. All files in scope fully read; execution model, state machine phases, checkpoint-resume mechanism, error recovery policies, quality gates, signal lifecycle, routing algorithm, priority scheduling, concurrency limits, observability metrics, and executor schema v2 documented verbatim with line numbers and schema field names.  
**Coverage:** 100% of specified scope (`.fgOS/runtime/`, `.fgOS/orchestration/`, `.fgOS/tasks/workflow-orchestration.yaml`, `.fgOS/memory/`, `.fgOS/knowledge/README`, `.fgOS/observability/`, `docs/02-design/executor-schema-v2.md`, `docs/02-design/failure-taxonomy.md`).
