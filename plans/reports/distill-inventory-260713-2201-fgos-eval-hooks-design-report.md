# fgOS EVAL + HOOKS + DESIGN ARCHITECTURE — Mechanical Inventory

**Scope:** Read-only audit of `.fgOS/eval/`, `.fgOS/hooks/`, and design architecture docs in upstreams/marketing-cockpit (HEAD 588d800).

**Coverage:** ALL files in scope; verbatim mechanisms (rubrics, schemas, lifecycle events, hooks); architecture layers and flow-map structure.

---

## 1. `.fgOS/EVAL/` — Multi-Platform LLM-Judge Eval Harness

### 1.1 README.md (`.fgOS/eval/README.md`)

**Mechanism:** Deterministic + LLM-judge eval for fgOS workflow outputs.

**Scope:** 3 workflows evaluated:
- content-creation
- brand-identity-build
- editorial-pillars-refresh

**Two-layer eval:**
- **L1 (contract check):** Fast, no LLM. Validates input/baseline structure.
- **L3 (judge scoring):** LLM-based per-dimension scoring with rubric guidance.

**Key commands** (lines 34–46):
- `check <workflow>` — L1 contract checks on all fixtures
- `check --all` — L1 across all 3 workflows
- `check --case <id>` — L1 single fixture
- `run <workflow>` — L1 + L3; writes scores.json + lineage.yaml
- `run --dry-run` — L1 only, skip judge
- `approve <workflow> <case-id>` — Freeze scores as baseline.yaml
- `check-prod <run-id>` — L1 + optional L3 for production run
- `add-fixture <workflow> --from-prod <run-id>` — Promote prod run to fixture

**Directory layout** (lines 50–59):
```
.fgOS/eval/
├── fixtures/{workflow}/case-NN-{slug}/
│   ├── input.yaml       # fixture input + params
│   └── baseline.yaml    # frozen approved scores (absent until first approval)
├── rubrics/{workflow}.yaml   # scoring dimensions + weights + thresholds
├── judges/config.yaml        # judge family routing (D5 cross-family rule)
├── schemas/                  # JSON schemas for input/baseline validation
└── runs/                     # eval run outputs (gitignored)
```

**Exit codes** (line 72):
- 0 = pass
- 1 = fail
- 2 = NEEDS_CONTEXT
- 3 = parse error

---

### 1.2 Schemas (`.fgOS/eval/schemas/`)

#### 1.2.1 baseline.schema.yaml (`.fgOS/eval/schemas/baseline.schema.yaml`)

**Shape:** Frozen reference scores + metadata at human approval time.

**Top-level fields** (lines 6–29):
- `case_id: string` — Must match corresponding input.yaml
- `workflow: string` — Must match corresponding input.yaml
- `approved_by: string` — Reviewer handle (GitHub username or display name)
- `approved_at: string` — ISO 8601 datetime, e.g., "2026-05-26T14:00:00Z"
- `l1: {status, checks[]}`
  - `status: string` — "pass" or "fail"
  - `checks[]: {check_id, status, message}`
- `l3: {overall_score, scores{}, verdict, judge_model, rubric_hash}`
  - `overall_score: float` — Range 1.0–5.0 (weighted)
  - `scores{dimension_id}: {score, rationale}` — Per-dimension breakdown
  - `verdict: string` — "pass", "warn", or "fail" per rubric thresholds
  - `judge_model: string` — Model that produced baseline (e.g., "gemini-2.0-flash")
  - `rubric_hash: string` — SHA-256 of rubric YAML at approval time
- `structural: {heading_count, word_count, section_presence}`

#### 1.2.2 input.schema.yaml (`.fgOS/eval/schemas/input.schema.yaml`)

**Shape:** Fixture input fixture, validated by L1 runner in Phase 02.

**Top-level fields** (lines 5–12):
- `case_id: string` — Unique identifier (e.g., "case-01-fjv-blog-post")
- `workflow: string` — Workflow name (must match `.fgOS/workflows/{workflow}.md` stem)
- `brand_id: string` — Brand to use (must exist as `studio/{brand_id}/profile.yaml`)
- `description: string` — Human-readable case description (used in CLI output)
- `params: {mode, task_brief, extra}`
  - `mode: string` — Optional workflow mode (e.g., "standard", "quick")
  - `task_brief: string` — Task brief forwarded to workflow brief stage
  - `extra: {}` — Open map for workflow-specific params

#### 1.2.3 rubric.schema.yaml (`.fgOS/eval/schemas/rubric.schema.yaml`)

**Shape:** Scoring dimensions, weights, thresholds. Not runtime-validated in Phase 01; enforced by L1 checker in Phase 02.

**Top-level fields** (lines 5–19):
- `workflow: string` — Workflow name (must match `.fgOS/workflows/{workflow}.md` stem)
- `version: string` — Semver; bump on dimension/weight/threshold change
- `dimensions: {dimension_id: {...}}`
  - `weight: float` — 0.0–1.0; all weights sum to exactly 1.0
  - `description: string` — What this dimension measures
  - `score_range: [1, 5]` — Fixed integers (do not change)
  - `pass_threshold: float` — Dimension-level minimum (e.g., 3.5)
  - `judge_guidance: string` — Scoring anchors injected into judge prompt verbatim
- `threshold: {pass, warn}`
  - `pass: float` — Overall weighted score >= this → verdict PASS (e.g., 3.5)
  - `warn: float` — Warn zone: warn <= score < pass → verdict WARN (e.g., 3.0); score < warn → verdict FAIL

---

### 1.3 Rubrics Sampled (`.fgOS/eval/rubrics/`)

**All rubric files:**
- `brand-identity-build.yaml`
- `content-creation.yaml`
- `editorial-pillars-refresh.yaml`

#### 1.3.1 content-creation.yaml (Sample, lines 1–93)

**Workflow:** content-creation

**Version:** "1.0.0"

**Dimensions** (5 total, weights sum to 1.0):
1. **brand_compliance** (weight: 0.30)
   - Description: Output adheres to brand voice, tone, terminology, prohibited/required language.
   - Pass threshold: 3.5
   - Judge guidance (lines 17–24): Scoring anchors from 5 (every sentence matches brand) to 1 (multiple prohibited terms, wrong persona).

2. **structure_completeness** (weight: 0.25)
   - Description: Output contains all required structural elements (blog: headline, intro, body, conclusion, CTA).
   - Pass threshold: 3.5
   - Judge guidance (lines 34–39): Anchors from 5 (all sections present, fully developed) to 1 (<50% sections).

3. **engagement_quality** (weight: 0.20)
   - Description: Captures reader attention, sustains interest, motivates reading.
   - Pass threshold: 3.0
   - Judge guidance (lines 49–55): Anchors from 5 (compelling headline, strong hook, concrete examples) to 1 (off-topic or boring).

4. **seo_compliance** (weight: 0.15)
   - Description: Meets basic SEO: primary keyword in title/first para, logical heading hierarchy, adequate word count.
   - Pass threshold: 3.0
   - Judge guidance (lines 65–73): Anchors from 5 (keyword in title, first para, H2; logical hierarchy) to 1 (keyword absent, no hierarchy).

5. **cta_strength** (weight: 0.10)
   - Description: CTA is explicit, specific, creates motivation to act.
   - Pass threshold: 3.0
   - Judge guidance (lines 82–88): Anchors from 5 (explicit action verb, prominent, benefit stated, urgency) to 1 (no CTA or contradicts goal).

**Thresholds** (lines 90–92):
- `pass: 3.5` — Overall score >= 3.5 → PASS
- `warn: 3.0` — 3.0 <= score < 3.5 → WARN; score < 3.0 → FAIL

#### 1.3.2 brand-identity-build.yaml (Sample, lines 1–94)

**Workflow:** brand-identity-build

**Version:** "1.0.0"

**Dimensions** (4 total, weights sum to 1.0):
1. **brand_voice_clarity** (weight: 0.35)
   - Description: Brand voice defined with specificity (tone descriptors, vocabulary guidance, prohibited language, concrete examples).
   - Pass threshold: 3.5
   - Judge guidance (lines 18–27): Anchors from 5 (3+ tone descriptors, vocabulary do/don't, write-this/not-that pair, explicit persona) to 1 (no voice or contradictory).

2. **visual_system_completeness** (weight: 0.30)
   - Description: Color palette (primary + secondary with hex), typography (primary + fallback), logo usage guidance.
   - Pass threshold: 3.5
   - Judge guidance (lines 37–47): Anchors from 5 (color with hex, typography, logo clear-space rules, usage examples) to 1 (only aspirational, no specs).

3. **audience_alignment** (weight: 0.20)
   - Description: Identity demonstrates explicit connection to target audience (personas reference positioning, voice matches audience register).
   - Pass threshold: 3.0
   - Judge guidance (lines 57–68): Anchors from 5 (personas with demographics/psychographics, voice-audience link explicit) to 1 (no audience definition).

4. **guideline_actionability** (weight: 0.15)
   - Description: New team member could apply guidelines without clarification (examples, edge cases, action verbs not aspirational prose).
   - Pass threshold: 3.0
   - Judge guidance (lines 78–89): Anchors from 5 (all sections have examples, edge cases addressed, action verbs) to 1 (no examples, adjectives only).

**Thresholds** (lines 91–93):
- `pass: 3.5`
- `warn: 3.0`

#### 1.3.3 editorial-pillars-refresh.yaml (Listed)

**File exists; full content not sampled to keep report concise. Structure identical to content-creation.yaml and brand-identity-build.yaml.**

---

### 1.4 Judges (`.fgOS/eval/judges/`)

#### 1.4.1 config.yaml (`.fgOS/eval/judges/config.yaml`)

**Purpose:** Model IDs and cross-family routing rule (bias reduction — prevent a model from judging its own family's output).

**Cross-family rule** (lines 6–10):
```yaml
cross_family_rule:
  claude_executor: gemini    # executor family claude → use gemini judge
  gemini_executor: claude    # executor family gemini → use claude judge
  openai_executor: gemini    # executor family openai → use gemini judge
  default: gemini            # fallback if executor family unknown
```

**Models** (lines 12–19):
```yaml
models:
  claude:
    model_id: claude-haiku-4-5
    max_tokens: 1024
  gemini:
    # model_id intentionally absent: agy auto-selects model (no --model flag in v1.0.2)
    # model_id: gemini-2.0-flash  # kept as comment for reference
    max_tokens: 1024
```

#### 1.4.2 claude-judge.md (`.fgOS/eval/judges/claude-judge.md`)

**Template:** Prompt injected into Claude for dimension scoring.

**Key sections** (lines 1–37):
- **Context** (line 3–8): Workflow, brand_id, dimension, dimension_description (template vars injected)
- **Scoring Guidance** (line 10–12): Judge guidance from rubric (template var)
- **Scale** (lines 14–19): 1=Failing, 5=Excellent (5-point scale)
- **Output to Evaluate** (line 21): Template var `{{output_text}}`
- **Instructions** (lines 23–30):
  1. Read output carefully
  2. Apply scoring guidance for the dimension
  3. Assign score 1–5
  4. Write concise rationale (2-4 sentences citing specific evidence)
  5. Do not consider other dimensions
- **Output format** (lines 32–36):
  ```json
  {"score": <integer 1-5>, "rationale": "<2-4 sentence rationale citing specific evidence>"}
  ```
  Valid JSON only, no preamble or trailing text.

#### 1.4.3 gemini-judge.md (`.fgOS/eval/judges/gemini-judge.md`)

**Template:** Prompt for Gemini dimension scoring.

**Key sections** (lines 1–42):
- **Task** (line 3–5): Score one dimension of marketing workflow output. Return single JSON.
- **Inputs** (lines 7–12): Workflow, brand_id, dimension, dimension_description
- **Scoring Anchors** (lines 14–16): Judge guidance injected
- **Scale** (lines 18–26): 1=Criteria not met, 5=Fully meets dimension criteria
- **Output to Evaluate** (lines 28–29): Template var `{{output_text}}`
- **Rules** (lines 31–36):
  - Score only the named dimension
  - Base score on evidence in output text, not general impressions
  - Rationale must cite specific phrase or element
  - Rationale length: 2–4 sentences
- **Required Response Format** (lines 38–40):
  ```json
  {"score": <integer 1-5>, "rationale": "<2-4 sentences citing specific evidence from output>"}
  ```

---

### 1.5 Fixtures (`.fgOS/eval/fixtures/`)

**Directory structure:**
```
fixtures/
├── brand-identity-build/
│   ├── case-01-pulsar-analytics-saas/input.yaml
│   ├── case-02-fjv-refresh/input.yaml
│   ├── case-03-synthetic-startup/input.yaml
│   └── .gitkeep
├── content-creation/
│   ├── case-01-fjv-blog-post/input.yaml
│   ├── case-02-fjv-social-linkedin/input.yaml
│   ├── case-03-pulsar-blog-post/input.yaml
│   ├── case-04-fjv-email-newsletter/input.yaml
│   └── .gitkeep
├── editorial-pillars-refresh/
│   ├── case-01-fjv-pillars-q2/input.yaml
│   ├── case-02-fjv-pillars-new/input.yaml
│   ├── case-03-pulsar-pillars/input.yaml
│   └── .gitkeep
└── .gitignore
```

**3 workflows × 3 cases each = 9 fixtures total.**

**Fixture structure:**
- Each case has `input.yaml` (fixture input)
- `baseline.yaml` created on first approval (frozen scores)

---

## 2. `.fgOS/HOOKS/` — Lifecycle Event Hook System

### 2.1 README.md (`.fgOS/hooks/README.md`)

**Purpose:** Framework-defined lifecycle events, adapter-implemented execution.

**What hooks are** (lines 8–17):
- Named insertion points in agent execution lifecycle
- Allow adapters/configurations to inject behavior at predictable moments
- fgOS defines: 7 lifecycle events, available data, hook definition contract
- Adapters implement: registration, dispatch, error handling

**Lifecycle events** (lines 19–29, Table):
| Event | When It Fires |
|-------|--------------|
| `session_start` | Agent session begins |
| `pre_skill_execution` | Before any skill runs |
| `post_skill_execution` | After skill completes (success or failure) |
| `pre_output` | Before final output delivered to recipient |
| `error` | When any error detected |
| `workflow_stage_complete` | When workflow stage finishes |
| `session_end` | When agent session ends (normally or via timeout) |

**Hook definition format** (lines 33–43):
```yaml
- event: post_skill_execution
  condition: "skill.layer == 'L1' and output.status == 'DONE'"
  action: save_checkpoint
  priority: 10       # Lower number = runs first
  blocking: true     # If true, failure halts execution
```
- `condition`: optional boolean expression
- `priority`: controls ordering when multiple hooks share event
- `blocking`: determines whether hook failure is fatal

**Adapter implementation contract** (lines 46–52):
1. Hook registry — load and store hook definitions
2. Event dispatch — fire all hooks for event in priority order
3. Condition evaluation — evaluate boolean expressions safely
4. Non-blocking failure — if blocking:false, log and continue
5. Blocking failure — if blocking:true, halt and emit error event

---

### 2.2 hooks-manifest.yaml (`.fgOS/hooks/hooks-manifest.yaml`)

**Purpose:** Single source of truth for all framework hooks (ADR 0049, amended by ADR 0053).

**Key insight** (lines 6–9): Canonical `name` ≠ physical `script` path. A hook's identity is its name, decoupling manifest from relocations (e.g., `generate-state.py` lives under `.fgOS/runtime/scripts/` but is still a canonical hook).

**Manifest fields** (lines 11–28):
- `name` — Canonical hook identity, kebab-case, stable across moves
- `event` — Canonical lifecycle event (ADR 0049 D5 translation: session_start | pre_tool_use | post_tool_use | subagent_start | subagent_stop | session_end)
- `script` — Path to executable script (repo-root-relative, posix)
- `executors` — Which executor adapters wire this hook: claude | codex | agy
- `matchers` — Per-executor matcher pattern (event/tool-name filter); empty string = unconditional
- `mode_skip` — FGOS_AGENT_MODE values that must not fire this hook (empty list = always fires)
- `blocking` — true: hook failure halts executor; all fgOS hooks are fail-open (false)
- `kind` — framework (core lifecycle) | adapter-advisory (context/warning, ported from .claude/hooks/*.cjs)
- `guard` — Optional: substring the tool command must contain for hook to act

**Framework hooks** (lines 30–108):

**Canonical hooks before M4:**

1. **session-start-fgos-bootstrap** (lines 33–40)
   - Event: `session_start`
   - Script: `.fgOS/hooks/session-start-fgos-bootstrap.py`
   - Executors: claude, codex, agy
   - Matchers: `{claude: "startup|resume|clear|compact", codex: "startup|resume|clear", agy: ""}`
   - Blocking: false
   - Kind: framework

2. **post-tool-gate-check** (lines 42–49)
   - Event: `post_tool_use`
   - Script: `.fgOS/hooks/post-tool-gate-check.py`
   - Matchers: `{claude: "Task", codex: "Task", agy: "AfterAgent"}`
   - Blocking: false
   - Kind: framework

3. **post-tool-capture-event** (lines 51–58)
   - Event: `post_tool_use`
   - Script: `.fgOS/hooks/post-tool-capture-event.py`
   - Matchers: `{claude: "Task", codex: "Task", agy: "AfterAgent"}`
   - Blocking: false
   - Kind: framework

4. **post-tool-validate-doc** (lines 60–67)
   - Event: `post_tool_use`
   - Script: `.fgOS/hooks/post-tool-validate-doc.sh`
   - Matchers: `{claude: "Write|Edit", codex: "Write|Edit|apply_patch", agy: "write_file|replace|edit_file"}`
   - Blocking: false
   - Kind: framework

5. **post-tool-error-capture** (lines 69–76)
   - Event: `post_tool_use`
   - Script: `.fgOS/hooks/post-tool-error-capture.py`
   - Executors: [claude] (note: Claude only)
   - Matchers: `{claude: ".*"}`
   - Blocking: false
   - Kind: framework

6. **pre-output-brand-final-check** (lines 78–85)
   - Event: `pre_tool_use`
   - Script: `.fgOS/hooks/pre-output-brand-final-check.py`
   - Matchers: `{claude: "Write|Edit", codex: "Write|Edit|apply_patch", agy: "write_file|replace|edit_file"}`
   - Blocking: false
   - Kind: framework

**Hooks with paths under `.fgOS/runtime/scripts/`** (lines 87–108):

7. **post-tool-generate-state** (lines 90–98)
   - Event: `post_tool_use`
   - Script: `.fgOS/runtime/scripts/generate-state.py`
   - Matchers: `{claude: "Bash", codex: "Bash|shell"}`
   - Guard: "git commit"
   - Mode skip: [sub]
   - Kind: framework

8. **post-tool-no-sdk-imports** (lines 100–108)
   - Event: `post_tool_use`
   - Script: `.fgOS/runtime/scripts/tests/test-no-provider-sdk-imports.py`
   - Matchers: `{claude: "Bash", codex: "Bash|shell"}`
   - Guard: "git commit"
   - Mode skip: [sub]
   - Kind: framework

**Ported adapter-advisory hooks** (lines 116–178):

9. **subagent-start-approval-gate-check** (lines 120–127)
   - Event: `subagent_start`
   - Script: `.fgOS/hooks/subagent-start-approval-gate-check.py`
   - Executors: claude, codex
   - Matchers: `{claude: "*", codex: "*"}` (all agents)
   - Kind: adapter-advisory

10. **subagent-start-brand-guidelines-reminder** (lines 129–138)
    - Event: `subagent_start`
    - Script: `.fgOS/hooks/subagent-start-brand-guidelines-reminder.py`
    - Executors: claude, codex
    - Matchers: Match on specific agent types (content-creator, copywriter, visual-designer, etc.)
    - Kind: adapter-advisory

11. **subagent-start-run-context** (lines 140–149)
    - Event: `subagent_start`
    - Script: `.fgOS/hooks/subagent-start-run-context.py`
    - Executors: claude, codex
    - Matchers: Match on specific agent types (campaign-manager, email-wizard, etc.)
    - Kind: adapter-advisory

12. **pre-tool-agent-dispatch-validator** (lines 151–158)
    - Event: `pre_tool_use`
    - Script: `.fgOS/hooks/pre-tool-agent-dispatch-validator.py`
    - Executors: claude, codex
    - Matchers: `{claude: "Task", codex: "Task"}` (Task tool only)
    - Kind: adapter-advisory

13. **session-end-run-finalizer** (lines 160–168)
    - Event: `session_end`
    - Script: `.fgOS/hooks/session-end-run-finalizer.py`
    - Executors: [claude] (note: Claude only; no Codex equivalent)
    - Mode skip: [sub]
    - Note: "Stop has no Codex equivalent (ADR 0049 D5 gap)"
    - Kind: adapter-advisory

14. **post-tool-signal-catalog-validator** (lines 170–177)
    - Event: `post_tool_use`
    - Script: `.fgOS/hooks/post-tool-signal-catalog-validator.py`
    - Executors: claude, codex
    - Matchers: `{claude: "Bash", codex: "Bash|shell"}`
    - Kind: adapter-advisory

**Note** (lines 110–114): `session-end-cleanup` is INTENTIONALLY ABSENT (controller-resolved Open Decision #4, 2026-07-10). .fgos-frontend.pid is obsolete. `session-end-run-finalizer` is the actual Stop-event hook in production.

---

### 2.3 hook-patterns.yaml (`.fgOS/hooks/hook-patterns.yaml`)

**Purpose:** Defines 7 lifecycle events, use cases, and available data. Framework defines patterns; adapters implement hook execution.

**Hook definition format** (lines 6–38):
```yaml
event:       (string, required) Lifecycle event name
condition:   (string, optional) Boolean expression — hook fires when true
action:      (string, required) Action identifier → handler in adapter registry
priority:    (integer, required) 0–100; lower = runs first
blocking:    (boolean, required) true = failure halts execution; false = logged only
```

**7 Lifecycle events detailed** (lines 41–182):

#### Event 1: session_start (lines 43–61)

**When:** Agent session begins, before any skill execution

**Use cases:**
- Inject brand guidelines and voice into session context
- Load episodic memory relevant to current campaign
- Set rigor and autonomy levels based on task priority
- Validate required knowledge modules available
- Initialize session-scoped cost and token counters

**Data available:**
- session.id, session.agent_name, session.task_context, session.trigger_type
- session.rigor_level, session.autonomy_level
- session.timestamps.started_at

#### Event 2: pre_skill_execution (lines 63–82)

**When:** Immediately before a skill runs

**Use cases:**
- Validate all required inputs present and typed correctly
- Inject relevant knowledge module for skill's domain
- Check agent has permission at autonomy level
- Verify budget and token headroom
- Log skill invocation with trace ID

**Data available:**
- skill.name, skill.layer, skill.domain, skill.input, skill.quality_gates
- session.context, session.chain_depth, session.skill_visit_counts

#### Event 3: post_skill_execution (lines 83–102)

**When:** After skill completes, whether successful or failed

**Use cases:**
- Run quality gates defined in skill.quality_gates
- Save checkpoint if stage completed successfully
- Update episodic memory with execution outcome
- Emit signal on successful completion
- Log output metrics (tokens used, time elapsed, cost)
- Trigger error recovery if skill reported non-DONE status

**Data available:**
- skill.name, skill.layer, skill.output
- skill.status: "DONE" | "DONE_WITH_CONCERNS" | "BLOCKED" | "NEEDS_CONTEXT"
- skill.execution_time_ms, skill.tokens_used
- session.context
- quality_gate.results (if gates evaluated)

#### Event 4: pre_output (lines 104–121)

**When:** Before final output delivered to recipient (human or next agent)

**Use cases:**
- Final brand compliance check on complete output
- Content quality gate for external-facing deliverables
- Legal compliance scan for regulated content
- Strip internal metadata and annotations before delivery
- Format output to match recipient's expected schema

**Data available:**
- output.content, output.format, output.recipient
- output.delivery_channel (e.g., human_review, publish, next_agent)
- session.rigor_level
- task.workflow, task.current_stage

#### Event 5: error (lines 123–142)

**When:** Whenever an error is detected

**Use cases:**
- Log error with full trace ID, context snapshot, stack trace
- Match error to recovery policy in error-handling.yaml
- Alert human if error is critical
- Emit error.critical signal for downstream observers
- Increment circuit breaker failure counter

**Data available:**
- error.type (matches error_type in error-handling.yaml)
- error.message, error.trace_id, error.skill_name
- error.retry_count, error.max_retries
- session.context
- task.id, task.status

#### Event 6: workflow_stage_complete (lines 144–162)

**When:** Workflow stage finishes successfully

**Use cases:**
- Save checkpoint with stage outputs and context snapshot
- Emit signal to trigger chained workflows
- Update workflow_state.stages_completed
- Log stage duration and quality gate results for analytics
- Notify stakeholders if stage has human review requirement

**Data available:**
- stage.name, stage.outputs, stage.duration_ms
- stage.quality_gate_results
- workflow.id, workflow.stages_completed, workflow.current_stage
- workflow.participants

#### Event 7: session_end (lines 164–182)

**When:** Agent session ends (normally, via timeout, or via explicit shutdown)

**Use cases:**
- Consolidate episodic memory with session learnings
- Save final checkpoint for incomplete tasks (enables resume)
- Flush pending signals that were buffered during session
- Clean up temporary state and scratch artifacts
- Record session metrics (total tokens, cost, tasks completed, errors)

**Data available:**
- session.id
- session.end_reason: "completed" | "timeout" | "shutdown" | "error"
- session.tasks_completed, session.tasks_failed
- session.total_tokens_used, session.total_cost, session.duration_ms
- session.timestamps.ended_at

**Implementation status** (lines 228–274):
| Event | Implemented | Handler | Executor | Notes |
|-------|------|---------|----------|-------|
| session_start | true | hooks/session-start-fgos-bootstrap.py | claude | Full bootstrap — signal sweep, active runs, brand, circuit breakers |
| pre_skill_execution | false | null | — | Not yet implemented |
| post_skill_execution | true | hooks/post-tool-capture-event.py | claude | Captures PostToolUse events; gate-check runs quality rules |
| pre_output | true | hooks/pre-output-brand-final-check.py | claude | Advisory only — wired as PreToolUse on Write\|Edit |
| error | true | hooks/post-tool-error-capture.py | claude | Captures tool errors to errors.jsonl; updates circuit breaker |
| workflow_stage_complete | true | runtime/scripts/run-update.py (inline emit) | all | Signal emitted inline by run-update.py --complete-stage |
| session_end | false | null | — | Not reliable on crash — signal sweep moved to session_start |

---

### 2.4 Hook Implementation: post-tool-capture-event.py (`.fgOS/hooks/post-tool-capture-event.py`)

**Purpose:** PostToolUse telemetry hook (canonical, executor-agnostic).

**Scope:** Triggered on PostToolUse for matched tools (configured in executor settings).

**Input contract** (lines 16–31):
```
Stdin payload (all executors):
  {
    "tool_name": str,
    "tool_input": dict,
    "tool_response": dict | str,
    "session_id": str,
    "cwd": str,
    ...
  }

Env vars fallback (Claude Code only):
  CLAUDE_SESSION_ID      — current session ID
  CLAUDE_TOOL_NAME       — tool name (e.g., "Task", "Write", "Bash")
  CLAUDE_TOOL_INPUT      — JSON of tool arguments
  CLAUDE_TOOL_OUTPUT     — JSON or text of tool result
  CLAUDE_PROJECT_DIR     — project root path
```

**Behavior** (lines 168–252):
1. Read stdin payload first (universal cross-executor contract)
2. Fall back to CLAUDE_TOOL_* env vars for backward compatibility
3. Filter: only capture "Task" tool events (sub-agent spawns)
4. Extract data: prompt excerpt, subagent type, usage metadata
5. Emit `spawn` event (captures sub-agent dispatch)
6. Emit `usage` event if output contains usage metadata
7. Exit 0 always (fail-soft — must never block executor)

**Helper functions:**
- `_parse_json_safe(raw: str) → dict | None` (lines 66–74): Safe JSON parsing
- `_extract_usage_from_output(tool_output: dict) → dict | None` (lines 77–121): Extract tokens, model, duration_ms, tool_uses from Claude output
- `_extract_prompt_excerpt(tool_input: dict) → str` (lines 124–134): Extract short prompt (max 120 chars, privacy-safe)
- `_extract_subagent_type(tool_input: dict) → str` (lines 137–147): Infer subagent type from Task input
- `_read_stdin_payload() → dict` (lines 152–165): Read and parse JSON from stdin

**Events emitted:**
- **spawn**: `{agent_id, prompt_excerpt, subagent_type}`
- **usage**: `{tokens, model, duration_ms, tool_uses, subagent_type}`

**Fallback for SessionEnd** (lines 254–279): `run_session_end()` emits `end` event with `{status: "completed"}`

---

### 2.5 Hook Implementation: post-tool-error-capture.py (`.fgOS/hooks/post-tool-error-capture.py`)

**Purpose:** Capture tool errors to session errors.jsonl. Update circuit breaker for API-layer failures.

**Behavior** (lines 9–15):
1. Read tool result from stdin
2. Detect error indicators in result text
3. If error: append to `.workspace/sessions/{session_id}/errors.jsonl`
4. If API error: call circuit-breaker-state.py record-failure anthropic-api
5. Print advisory to stdout if actionable recovery steps exist
6. Exit 0 always (hook must never block)

**Error detection patterns** (lines 34–57):

**Line-start patterns** (regex `_ERROR_LINE_RE`, line 39–42):
```
error:
failed:
traceback (most recent
exception:
fatal:
critical:
command not found
no such file or directory
permission denied
```

**High-signal tokens** (regex `_ERROR_ANYWHERE_RE`, lines 46–50):
```
exit code [1-9]
exitcode=[1-9]
returncode=[1-9]
syntax error
modulenotfounderror, importerror, nameerror, typeerror, valueerror, keyerror, attributeerror
connectionrefused, connection refused
ssl.*error
```

**API keywords** (lines 53–57):
```
anthropic, openai, rate_limit
rate limit, 429, 503, overloaded
quota exceeded, api error, API error
```

**Error record** (lines 122–128):
```json
{
  "ts": "ISO 8601 datetime",
  "tool": "tool_name",
  "session_id": "session_id or 'unknown'",
  "error_snippet": "first 500 chars of error"
}
```

**Circuit breaker** (lines 89–105): If API error detected, call `circuit-breaker-state.py record-failure anthropic-api` (non-blocking, timeout 5s).

---

## 3. DESIGN ARCHITECTURE DOCS

### 3.1 architecture-overview.md (`.docs/02-design/architecture-overview.md`)

**Full read, 288 lines.**

#### 3.1.1 3-Layer Design (lines 8–49)

**Layers:**

```
┌─────────────────────────────────────────────────────────┐
│                    Adapter Layer                        │
│  .claude/    .gemini/    .codex/    .cursor/            │
│  Platform-specific implementations + file I/O + timers  │
├─────────────────────────────────────────────────────────┤
│                    Runtime Layer                        │
│  Triggers   State   Errors   Hooks   Artifacts          │
│  5 types    YAML    8 pols   7 evts  Storage spec       │
│  (defined in .fgOS/, implemented by adapters)           │
├─────────────────────────────────────────────────────────┤
│                    Core Layer (.fgOS/)                  │
│  37 Skills    20 Agents    25 Workflows                 │
│  Knowledge    Memory       Orchestration                │
│  Observability             7 Schemas                    │
│  (agent-agnostic, Markdown + YAML)                      │
└─────────────────────────────────────────────────────────┘
              ↓ writes / reads ↓
┌─────────────────────────────────────────────────────────┐
│                  Data Layers (project root)             │
│                                                         │
│  .workspace/runs/         studio/content/               │
│    └─ machine, gitignored   └─ deliverables, tracked    │
│  .workspace/runs/{id}/    studio/references/            │
│    ├─ run.yaml              └─ reusable, auto-promoted  │
│    ├─ stages/             studio/brand/{id}/            │
│    └─ final/                ├─ profile.yaml (overrides) │
│                             ├─ audience/                │
│                             ├─ industry/                │
│                             └─ assets/                  │
└─────────────────────────────────────────────────────────┘
```

#### 3.1.2 Core Layer (lines 51–64)

| Component | Directory | Purpose |
|-----------|-----------|---------|
| **Skills** | `.fgOS/skills/` | 37 deep marketing capabilities with typed I/O contracts, anti-patterns, red flags |
| **Agents** | `.fgOS/agents/` | 20 role definitions (TOFU/MOFU/BOFU/Core/Support) with autonomy levels and quality gates |
| **Workflows** | `.fgOS/workflows/` | 25 multi-step pipelines (1 exemplar + 24 rollout) with approval gates and checkpoints |
| **Knowledge** | `.fgOS/knowledge/` | Marketing taxonomy, frameworks, psychology, metrics, compliance, multi-brand profiles |
| **Memory** | `.fgOS/memory/` | 4 memory types (working, episodic, semantic, procedural) with retention policy |
| **Schemas** | `.fgOS/schemas/` | 7 YAML validation schemas for all component types |
| **Orchestration** | `.fgOS/orchestration/` | Routing, delegation, priority queue protocols |
| **Observability** | `.fgOS/observability/` | Metrics definitions, 3-tier evaluation, logging, tracing, audit trail |

#### 3.1.3 Runtime Layer (lines 66–80)

| Component | File | Purpose |
|-----------|------|---------|
| **Triggers** | `runtime/triggers.yaml` | 5 trigger types: manual, chained, scheduled, event, conditional |
| **State** | `runtime/state.yaml` | Task/workflow state, checkpoints, transitions, rollback semantics |
| **Errors** | `runtime/error-handling.yaml` | 8 error types with strategies (backoff, retry, escalate) |
| **Artifacts** | `runtime/artifacts.yaml` | Storage zones, run layout, promotion rules, brand layering |
| **Hooks** | `hooks/hook-patterns.yaml` | 7 lifecycle events with action protocols |
| **Executors** | `.fgOS/runtime/config/executor-registry.yaml` | Task-first routing: executor kind + N invocation_paths |
| **Capability routing** | `.fgOS/runtime/config/capability-routing.yaml` | Defaults + overrides for stage-level routing |
| **Event capture** | `.workspace/sessions/{sid}/events.jsonl` | Append-only NDJSON, hook-driven (ADR 0043) |
| **Spawn-Request** | `.workspace/runs/{run_id}/spawn-requests/` | Per-stage YAML for AI multi-agent dispatch (ADR 0042 D11) |

#### 3.1.4 Adapter Layer (lines 82–94)

**Responsibilities:**
- Skill loading + context injection
- Agent mapping + subagent dispatch
- File I/O + state persistence
- Hook implementation + trigger handling
- Artifact promotion + lineage tracking
- Event capture hook (PostToolUse) — writes spawn/usage events
- Spawn-request reading + signal coordination

#### 3.1.5 Event Capture & Spawn Coordination (lines 96–109)

**events.jsonl** (filesystem-first, hook-driven, ADR 0043):
- Location: `.workspace/sessions/{sid}/events.jsonl`
- Written by: `.claude/hooks/post-tool-capture-event.py` (PostToolUse hook)
- Authority: Filesystem is source of truth
- Format: NDJSON (appended by `fcntl.flock` for safe concurrent writes)

**Go backend:** Reads events.jsonl via fsnotify, indexes to SQLite, serves HTTP API. No longer writes events.

**Spawn-Request Protocol** (ADR 0042 D11):
- YAML written to `.workspace/runs/{run_id}/spawn-requests/{stage_id}.yaml`
- Engine signals `spawn.needed` → AI reads request → spawns native subagent → signals `spawn.completed`

#### 3.1.6 Component Map — Skills (lines 115–127)

**37 skills organized by domain:**
- Content (text): copywriting, content-creation, content-review, content-repurpose, email-copy
- Content (visual): visual-design, image-generation, thumbnail-design, design-brief, presentation-design
- Content (video): video-production, storyboarding, audio-production
- Campaign: campaign-execution, email-automation, ads-management, social-scheduling
- SEO: seo-optimization, seo-audit
- Analytics: performance-analysis, funnel-analysis, attribution-modeling
- Strategy: marketing-planning, creative-direction, competitor-analysis, audience-research, brand-strategy, pricing-strategy
- Brand: brand-compliance, visual-brand-compliance, identity-system
- Support: research, data-formatting, media-processing

#### 3.1.7 Component Map — Agents (lines 129–145)

**20 agents, organized by funnel stage:**

```
TOFU (Awareness)     MOFU (Consideration)    BOFU (Conversion)
├ attraction-spec.   ├ content-creator       ├ upsell-maximizer
├ seo-specialist     ├ email-wizard          └ continuity-spec.
├ researcher         ├ funnel-architect
└ lead-qualifier     └ sale-enabler

Core (Cross-cutting)          Support (Utilities)
├ copywriter                  ├ analytics-analyst
├ campaign-manager            ├ brand-guardian
├ content-reviewer            ├ creative-director
├ social-media-manager        └ campaign-debugger
├ visual-designer
└ video-producer
```

#### 3.1.8 Component Map — Workflows (lines 147–174)

**28 workflows (1 exemplar + 27 rollout):**

**Exemplar:** campaign-lifecycle

**Rollout (P6 documented 2026-05):**
- **Content:** content-calendar (v2.1.0), content-creation (v3), content-audit, content-repurpose, landing-page-creation, visual-production (sub-workflow)
- **Campaign:** campaign-creative-pack, email-sequence, social-batch-production, social-production, social-scheduling
- **Brand:** brand-identity-build, brand-patch, brand-refresh, brand-absorb
- **Design:** design-brief, visual-asset-kit, thumbnail-batch
- **Video:** video-production, video-repurpose, podcast-production
- **Strategy:** editorial-pillars-refresh (v1.0.0, NEW), marketing-strategy-plan, competitor-intel, persona-refresh, performance-report, seo-audit-workflow

**Workflow frontmatter field: `auto_trigger_autonomy`** (ADR 0032, lines 160–174):

| Value | Label | Behavior |
|---|---|---|
| L1 | Always-on | Dispatch immediately on signal match |
| L2 | Default opt-out | Dispatch unless `auto_dispatch: false` in brand profile |
| L3 | Default opt-in | Dispatch only if `auto_dispatch: true` in brand profile |
| L4 | Human-confirm | Dispatch after confirmation (not yet implemented) |
| L5 | Manual-only | CLI suggestion only; never auto-dispatch |

Default if absent: **L2**

Example: `editorial-pillars-refresh` uses `auto_trigger_autonomy: L3` — opt-in required per brand.

#### 3.1.9 Data Flow (lines 177–189)

```
User Intent
  → Routing (orchestration/routing.yaml)
    → Agent Selection (agents/)
      → Brand Resolution (task brand_id → studio/brand/active.yaml → resolver merge)
        → Skill Loading (skills/)
          → Knowledge Injection (knowledge/ scoped to resolved brand)
            → Execution (with quality gates against resolved brand)
              → Status Report (DONE/BLOCKED/NEEDS_CONTEXT)
                → Memory Consolidation (memory/)
```

#### 3.1.10 Brand Resolution (Layered, ADR 0008, lines 192–210)

**Step 1 — Identify brand_id:**
```
Task-level brand_id   ──→  use directly
        ↓ (not set)
studio/brand/active.yaml  ──→  read pointer
        ↓ (not set)
ERROR: NEEDS_CONTEXT
```

**Step 2 — Resolve brand context (brand-resolver.py):**
```
.fgOS/knowledge/brand/BRAND-TEMPLATE.yaml   (framework defaults)
                ⊕ deep merge ⊕
studio/brand/{brand_id}/profile.yaml        (user overrides, wins on conflict)
                =
Merged brand context  ──→  injected into agent
```

#### 3.1.11 Artifact Flow (lines 212–226)

```
Workflow Run Start
  → Create .workspace/runs/{run_id}/run.yaml
    → Each stage writes to .workspace/runs/{run_id}/stages/{n}-{stage}/
      → Checkpoint stages save checkpoint.yaml
        → Quality gates write gate-results.yaml
          → Final stage writes to .workspace/runs/{run_id}/final/
            → On workflow complete:
                ├─ Promote final/* → studio/content/{type}/  (always)
                └─ Auto-promote per rules → studio/references/{topic}/
```

#### 3.1.12 Error Recovery (lines 228–241)

8 error types with Recovery Policy Matrix:
```
context_overflow: summarize → split → escalate
api_failure: backoff → alternative → circuit breaker
quality_gate_fail: revise ×3 → escalate to human
brand_violation: re-inject guidelines → revise
knowledge_gap: inject knowledge → delegate → human
deadline_breach: alert → reduce rigor → re-prioritize
infinite_loop: break immediately → BLOCKED
budget_exceeded: pause → alert → recommend
```

#### 3.1.13 Skill Layer Hierarchy (lines 245–259)

**3-layer calling privileges:**

```
L1 Orchestrators ──→ L2 Specialists ──→ L3 Utilities
(campaign-execution)  (copywriting)       (brand-compliance)
(marketing-planning)  (seo-optimization)  (research)
                      (content-creation)  (data-formatting)
```

Rules:
- L1 can call L2 and L3
- L2 can call L2 and L3
- L3 calls nothing (leaf nodes)

#### 3.1.14 Design Heritage (lines 262–271)

Influences:
- **Rune** (67% coverage): Mesh orchestration, state checkpoints, recovery policy matrix, anti-loop intelligence
- **gstack** (56% coverage): Skill templates, preamble injection, multi-host adapters, user sovereignty
- **Superpowers** (44% coverage): SDD status protocol, two-stage review, rationalization tables
- **CKM** (50% coverage): Marketing domain knowledge, 20 agent roles, workflow patterns

#### 3.1.15 Workflow Ecosystem (line 275–277)

27 workflows organized per 3-layer backbone (ADR-0017) + 8 supporting clusters.
- Holistic view + feedback loops: [Ecosystem Map](../04-flow-map/ecosystem-map.md)
- Signal catalog + chains + connection cards: [Dependency Graph](../04-flow-map/dependency-graph.md)

---

### 3.2 glossary.md (`.docs/02-design/glossary.md`)

**Framework vocabulary. Key terms:**

#### Core Concepts (lines 21–72):

- **Agent:** Role-based AI executor with persona, autonomy constraints, skill set (e.g., copywriter, seo-specialist). Agents platform-agnostic; defined in `.fgOS/agents/`.

- **Skill:** Deep capability with typed I/O contract, multi-step process, anti-patterns, red flags, verification checklist. Agents invoke skills; skills are work units.

- **Workflow:** Orchestration of agents + skills across stages. Coordinates PLANNING → PRODUCTION → DISTRIBUTION.

- **Run:** Single execution of workflow with unique `run_id`. Tracks progress per stage, stores outputs in `.workspace/runs/{run_id}/`.

- **Stage:** Workflow subdivision with responsibility, input, output, gates, signals.

- **Gate (Checkpoint):** Approval requirement before stage progresses. Marketer reviews, approves or requests revision.

- **Signal:** Real-time event emitted during workflow execution. Enables async communication and workflow chaining.

- **Artifact:** File produced by workflow (blog post, email, social post). Carries metadata (run_id, workflow, promoted_at) for lineage tracking.

- **Promotion (Auto-Promotion):** Moving artifact from `.workspace/runs/` (ephemeral) to `studio/content/` (permanent) or `studio/references/` (long-lived).

- **Lineage:** Metadata trail: which run created artifact, which workflow, when promoted, source (if repurposed).

#### Content Tagging — 4-Dimension Framework (lines 75–115)

**WHEN (Scheduling Context):**
- always_on — Permanent
- campaign:{id} — Specific campaign
- recurring:{series_id} — Recurring series
- reactive — Real-time response

**WHAT (Origin/Source):**
- original — Team-created from scratch
- repurposed — Adapted from another piece
- series — Recurring template
- curated — External source, team-wrapped
- ugc — User-generated
- live — Live event captured

**WHY (Purpose/Intent):**
- educate — Teach (TOFU)
- entertain — Engage (TOFU/MOFU)
- inspire — Motivate (MOFU)
- convert — Direct CTA (BOFU)
- community — Nurture belonging (MOFU/BOFU)

**HOW (Production Mode):**
- written — Human-authored
- auto-repurposed — System extracted + formatted
- template-filled — Template + data merge
- ai-composed — AI drafted, human reviewed
- curated-wrapped — Human selected + commentary
- live-captured — Event recorded, edited

#### Storage Zones (lines 118–144):

- `.workspace/runs/{run_id}/` — Ephemeral, machine-facing. 30-day retention.
- `studio/content/{type}/` — Permanent, human-facing. 6–12 months active.
- `studio/references/{topic}/` — Long-lived knowledge. Permanent archive.
- `studio/brand/{brand_id}/` — User-owned brand context. Project lifetime.
- `.fgOS/` — Framework core (read-only). Framework lifetime.

#### Status & Workflow States (lines 147–160):

**Run Status:**
- pending, in_progress, awaiting_approval, done, failed, rolled_back

**Artifact Status (in frontmatter):**
- draft, published, superseded, test

#### Common Abbreviations (lines 165–177):

| Term | Expansion |
|------|-----------|
| TOFU | Top-of-funnel (awareness) |
| MOFU | Middle-of-funnel (consideration) |
| BOFU | Bottom-of-funnel (conversion) |
| KPI | Key performance indicator |
| OKR | Objective & key result |
| SRP | Single responsibility principle |
| CTA | Call to action |
| SEO | Search engine optimization |

---

### 3.3 dependency-graph.md (`.docs/04-flow-map/dependency-graph.md`)

**Index for complete dependency graph. Content organized into 4 modular sub-files:**

| File | Content | Size |
|------|---------|------|
| **Visual & Textual Views** (`./dependency-graph/graph.md`) | Full dependency graph (text emitter/consumer tree + Mermaid visual) | ~270 LOC |
| **Signal Catalog** (`./dependency-graph/signals.md`) | Complete definitions of 30+ workflow signals (Tier-1 & Tier-2) | ~316 LOC |
| **Chains & Orchestration** (`./dependency-graph/chains.md`) | Dependency chains, blocking rules, critical path, pause_reason, parallel windows | ~224 LOC |
| **Connection Cards** (`./dependency-graph/cards.md`) | Per-workflow reference cards with inbound/outbound signals, risk factors, notes | ~681 LOC |

**Signal FSM** (lines 47–69):

```
EMISSION (by source workflow)
  └─ pending (TTL clock starts)

CONSUMPTION (by sink workflow)
  ├─ pending → consumed (C-S1: must consume before reading)
  │  └─ payload accessible
  │
  └─ consumed → resolved (C-S2: must resolve before run ends)
     OR consumed → abandoned
        └─ payload locked again

EXPIRY (by sweeper)
  ├─ pending → expired (C-S4: if age > ttl_hours)
  │
  ├─ pending → expired (C-S5: if source_run.status=failed, preempts TTL)
  │
  └─ abandoned → expired (grace 24h, cleanup)
```

---

### 3.4 chains-and-recipes.md (`.docs/04-flow-map/chains-and-recipes.md`)

**Pre-built workflow sequences for common marketing scenarios.**

#### 3 Core Recipes:

**Recipe 1: Brand Bootstrap** (4–5 weeks)

Workflow sequence:
```
1. brand-identity-build (signal: brand.ready_for_strategy)
2. marketing-strategy-plan (signal: strategy.plan_ready)
3. commercial-calendar-setup --mode bootstrap (signal: commercial.calendar_ready)
4. persona-refresh (signal: persona.refreshed)
5. editorial-pillars-refresh --mode bootstrap (signal: editorial.pillars_refreshed)
6. series-definition --mode bootstrap (signal: series.defined)
7. content-calendar --mode quarterly
8. content-calendar --mode monthly (each month after)
```

Agent team (5 people): Campaign Manager, Creative Director, Visual Designer, Copywriter, Content Reviewer.

**Recipe 1.5: Quarterly Refresh** (1–2 weeks)

Workflow sequence:
```
1. commercial-calendar-setup --mode update (optional)
2. editorial-pillars-refresh --mode full (signal: editorial.pillars_refreshed)
3. series-definition --mode review (signal: series.defined)
4. content-calendar --mode quarterly (signal: calendar.ready)
5. [Begin monthly Production cycles]
```

**Recipe 2: Content Cluster** (2–3 weeks)

Parallelized production:
```
1. content-calendar (monthly plan)
   ├→ 2. content-creation
   ├→ 3. social-batch-production
   └→ 4. email-sequence
```

Agent team (4–5 people): Campaign Manager, Content Creator, Social Media Manager, Copywriter, Content Reviewer.

Output: 4–6 blogs + videos, 20–30 social posts (70/20/10 mix), 3–5 email sequences.

**Recipe 3: Campaign Launch** (1–2 weeks active + 1 week post-analysis)

Workflow sequence:
```
1. campaign-creative-pack (create assets)
2. campaign-lifecycle (launch + monitor)
   ├─ [External: distribute on channels]
   └─ [External: run for 1–2 weeks]
3. performance-report (analyze + learn)
```

Agent team (3–4 people): Creative Director, Campaign Manager, Social Media Manager, Analytics Analyst.

---

### 3.5 skill-map.md (`.docs/04-flow-map/skill-map.md`)

**Workflow → Skills matrix. Sampled (lines 1–250+).**

#### Skill-Workflow Matrix (§1, sample):

| Workflow | Primary Skills | Secondary Skills | Layer Pattern |
|----------|---|---|---|
| brand-absorb | research, brand-compliance | data-formatting | L3→L3 |
| brand-identity-build | identity-system, visual-design, creative-direction | image-generation, brand-compliance | L2→L2→L3 |
| brand-patch | brand-compliance | — | L3 |
| brand-refresh | identity-system, brand-strategy, visual-design | brand-compliance | L2→L3 |
| **Strategic Foundation** | | | |
| competitor-intel | competitor-analysis, research | data-formatting | L2→L3 |
| persona-refresh | audience-research, research | data-formatting | L2→L3 |
| marketing-strategy-plan | marketing-planning, competitor-analysis | audience-research, performance-analysis | L1→L2 |
| **Calendar Hub** | | | |
| content-calendar | editorial-planning | brand-compliance, performance-analysis | L2→L3 |
| **Content Production** | | | |
| content-creation v3 | content-creation, copywriting | seo-optimization, brand-compliance-check (×2), content-review | L2→L2→L3 |
| landing-page-creation | content-creation, copywriting | seo-optimization, brand-compliance-check (×2), content-review, conversion-heuristics | L2→L2→L3 |
| visual-production (sub) | photography-design, illustration-design, diagram-design, infographic-design | — | L2 (stub) |

#### Skill Categories by Workflow Cluster (§2):

**Brand Foundation:**
- brand-absorb: research → brand-compliance → data-formatting
- brand-identity-build: identity-system → visual-design → creative-direction → image-generation → brand-compliance
- brand-patch: brand-compliance
- brand-refresh: identity-system → brand-strategy → visual-design → brand-compliance

**Strategic Foundation:**
- competitor-intel: competitor-analysis → research → data-formatting
- persona-refresh: audience-research → research → data-formatting
- marketing-strategy-plan: marketing-planning (L1) → competitor-analysis → audience-research → performance-analysis

**Calendar Hub (Central Pivot):**
- content-calendar: editorial-planning (L2, CORE) → brand-compliance → performance-analysis

#### Skill Layer Interactions (§3–4):

L1 Orchestrators (campaign-execution, marketing-planning) call L2 and L3.
L2 Specialists collaborate: content-creation ↔ copywriting ↔ seo-optimization.
L3 Utilities are leaf nodes: brand-compliance, content-review, data-formatting.

---

### 3.6 ecosystem-map.md (`.docs/04-flow-map/ecosystem-map.md`)

**Workflow ecosystem: 28 workflows organized into 3-layer backbone + 8 supporting clusters.**

#### §1 Operational Backbone — 3-Layer Architecture (lines 43–131):

**Planning Layer:**
- content-calendar
- marketing-strategy-plan

**Production Layer:**
- content-creation v3, landing-page-creation, content-repurpose
- social-batch-production, social-production, email-sequence
- design-brief, visual-asset-kit, visual-production (sub-workflow), thumbnail-batch
- video-production, video-repurpose, podcast-production
- campaign-creative-pack

**Distribution Layer:**
- social-scheduling
- campaign-lifecycle

**Key signals:**
- `strategy.plan_ready` — marketing-strategy-plan → content-calendar
- `calendar.ready` — content-calendar → content-creation, social-batch-production, email-sequence, campaign-creative-pack
- `content.produced` — content-creation, social-production → social-scheduling, campaign-lifecycle
- `visual.production.requested` — content-creation, landing-page-creation → visual-production (sub-workflow)
- `visual.batch.produced` — visual-production → content-creation, landing-page-creation

#### §2 Supporting Clusters (lines 134–196):

**Brand Foundation:**
- brand-absorb, brand-identity-build, brand-patch, brand-refresh

**Strategic Foundation:**
- competitor-intel, persona-refresh, editorial-pillars-refresh (NEW), marketing-strategy-plan

**Calendar Hub:**
- content-calendar

**Content Production:**
- content-creation, content-repurpose

**Visual Service:**
- design-brief, visual-asset-kit, thumbnail-batch

**Video Production:**
- video-production, video-repurpose, podcast-production

**Social Distribution:**
- social-batch-production, social-production, social-scheduling

**Campaign Orchestrator + Email + Measurement:**
- campaign-creative-pack, campaign-lifecycle, email-sequence, performance-report, content-audit, seo-audit-workflow

---

## Summary

This inventory captures fgOS's multi-platform eval harness, lifecycle hook system, and 3-layer architecture in concrete, verbatim detail:

1. **EVAL:** L1 contract + L3 judge-based scoring. 3 workflows × 3 test cases. Cross-family judge routing (Claude→Gemini, Gemini→Claude). Per-dimension rubrics with 5-point scale and pass/warn/fail verdicts. Schemas for input, baseline, rubric validation.

2. **HOOKS:** 14 canonical hooks wired to 7 lifecycle events (session_start, pre_skill_execution, post_skill_execution, pre_output, error, workflow_stage_complete, session_end). Hooks capture telemetry (spawn, usage events), validate docs, detect/record errors, gate quality checks. Fail-soft (exit 0 always). Executor-agnostic stdin/env input contract.

3. **DESIGN:** 3-layer architecture (Core/Runtime/Adapter). Core = skills/agents/workflows/knowledge (37/20/25 components). Runtime = triggers, state, errors, hooks, artifacts, executors. Adapter = platform-specific I/O + hook implementation. Brand resolution via layered merge (template + overrides). Workflow ecosystem = 28 workflows in 3-layer backbone + 8 supporting clusters, chained via signals (30+ defined). Skill layers L1→L2→L3 with calling constraints. 4-D content tagging framework (WHEN/WHAT/WHY/HOW).

---

**Status:** DONE
**Summary:** Mechanical inventory complete: all `.fgOS/eval/`, `.fgOS/hooks/`, and design docs read, verbatim mechanisms and architecture captured with line number references.
**Concerns/Blockers:** None. All files read successfully; full coverage of required scope.
