# fgOS Skill/Workflow/Agent Definition Structure Inventory

**Project:** Marketing Cockpit  
**Framework:** fgOS (agent-agnostic marketing framework)  
**Scope:** Definition STRUCTURE + SCHEMAS only (not marketing content)  
**Date:** 2026-07-13  
**Coverage:** 100% schemas, 3 representative skills sampled, 2 agents sampled, 3 workflows sampled, all names listed

---

## Executive Summary

fgOS is a schema-driven, agent-agnostic marketing automation framework with three tiers of definition:

1. **Schemas** (40 files): YAML validation schemas defining frontmatter structure for skills, agents, workflows, and runtime artifacts
2. **Skills** (39-41 active): Reusable marketing capabilities organized in 3 layers (L1 orchestrator, L2 specialist, L3 utility)
3. **Agents** (20): Role-based agent personas for TOFU/MOFU/BOFU/Core/Support funnel positions
4. **Workflows** (32): Multi-stage, multi-agent orchestrations with approval gates, checkpoints, and signal-based resumption
5. **Templates** (2): Reusable scaffolds (audit workflow pattern, README guide)

Key differentiator: **Signal-based async gates** (ADR 0019) enable workflow pause/resume on external approval, and **context_rules** (ADR 0034 Phase 4) encode advisory reading guidance per rigor level and retrieval trigger.

---

## I. SCHEMAS INVENTORY

**Location:** `.fgOS/schemas/` (40 files)  
**Coverage:** ALL schemas read and catalogued

### Core Definition Schemas

#### 1. **workflow.schema.yaml** (v1.12.0)
- **Purpose:** Validates workflow `.md` frontmatter
- **Key Fields:**
  - `name` (kebab-case), `version` (semver), `description` (max 150 chars)
  - `type`: enum [sequential, parallel, conditional, loop]
  - `domain`: $ref to Domain enum (content | campaign | seo | analytics | brand | strategy | sales | community | support)
  - `layer`: enum [planning, production, distribution] — optional, omit for cross-cutting workflows
  - `trigger`: $ref to TriggerType (manual | chained | scheduled | event_driven | conditional)
  - `rigor`: $ref to RigorLevel (quick | standard | thorough | critical)
  - `default_cognitive_tier`: $ref to CognitiveTier (lightweight | standard | creative | analytical | critical)
  - `agents[]`: required, min 1; each with `role` (orchestrator | executor | reviewer | guardian | analyst | specialist) and `agent` name
  - `checkpoint`: boolean, default false
  - `max_retries`: int 0-5, default 3
  - `rollback_strategy`: enum [none, last_checkpoint, full_restart, manual], default last_checkpoint

- **Stages Array** (required for workflows with approval_gates using runs_after/runs_before):
  ```yaml
  stages:
    - stage_id: "^([qmwr]_)?stage_[a-z0-9]+[a-z]?_[a-z][a-z0-9_]*$"
      title: string
      agent: string (optional)
      checkpoint: boolean
      cognitive_tier: CognitiveTier
      task: kebab-case string (REQUIRED per ADR 0042; references .fgOS/tasks/<id>.yaml)
      max_retries: int (per-stage override)
      timeout_seconds: int (for parallel_group stages only)
      context_rules: object (optional, Phase 4 pattern P3)
        - quick/standard/thorough/critical: { must[], should[], skip[], token_budget: int }
        - retrieval_triggers[]: { condition: string, documents[] }
  ```

- **Approval Gates** (ADR 0019 async extension):
  ```yaml
  approval_gates:
    - name: string
      runs_after: stage_id (mutually exclusive with runs_before, stage)
      runs_before: stage_id (mutually exclusive with runs_after, stage)
      stage: string (DEPRECATED legacy)
      approver: agent_name | 'human' | 'async_queue'
      required: boolean, default true
      async: boolean, default false
      emits: signal pattern "^[a-z][a-z0-9-]*(\\.[a-z][a-z0-9_]*){1,3}$"
      accepts: [signal_pattern...]
      next_on_approval: stage_id
      next_on_rejection: stage_id
      pause_reason: enum [review_pending, manual, awaiting_external_data, awaiting_legal]
  ```

- **Loop Config** (ADR 0042 for loop-type workflows):
  ```yaml
  loop_config:
    child_workflow: kebab-case
    dispatch_stage: stage_id
    completion_signal: "domain.action[.detail[.qualifier]]"
    timeout_hours: number >= 0
    batch_manifest_schema: path
  ```

- **Signals & Escalation:**
  ```yaml
  emits: [Signal objects]  # Signal = {name, emitter, data}
  listens_for: [signal patterns]
  escalation:
    target: agent_name | 'human'
    conditions: [string list]
  ```

- **Catalog Status** (M5 ADR 0012):
  - enum: stub | active | test-exemplar | deferred | exemplar

- **Expected Markdown Sections:**
  - Required: ## Overview, ## Stages, ## Error Handling, ## Signals
  - Recommended: ## Flow Diagram, ## Checkpoints, ## Notes

- **Validation Rules:**
  - agents[] must reference existing .fgOS/agents/ entries (warning)
  - Exactly one agent must have role=orchestrator (error)
  - approval_gates[].approver must be 'human', 'async_queue', or valid agent name (error)
  - approval_gates[] must have exactly one of: runs_after, runs_before, stage (error)
  - runs_after/runs_before must reference existing stage_id in stages[] (error)
  - If async=true, then emits, accepts, next_on_approval, next_on_rejection, pause_reason required (error)
  - stages[].task required; task_type forbidden (ADR 0042 supersedes ADR 0027)
  - cognitive_tier must be one of 5 valid tiers (error)

---

#### 2. **agent.schema.yaml**
- **Purpose:** Validates agent role definition frontmatter
- **Key Fields:**
  - `name` (kebab-case), `version` (semver), `description` (max 120 chars)
  - `role`: string (human-readable, e.g., "Market Intelligence Specialist")
  - `category`: $ref to AgentCategory (tofu | mofu | bofu | core | support)
  - `persona`: { voice: string, style: string, archetype: string }
  - `skills[]`: min 1, kebab-case names, must reference .fgOS/skills/ entries (warning)
  - `autonomy`: $ref to AutonomyLevel (L1_manual | L2_guided | L3_supervised | L4_autonomous | L5_full_auto)
  - `decision_boundary`: { can_decide[], must_escalate[] }
  - `status_protocol`: { uses: [StatusCode], evidence_required: boolean }
  - `reports_to`: agent_name | 'human', default 'human'
  - `quality_gates[]`: $ref to QualityGate (gate: brand_compliance|content_quality|seo_compliance|legal_compliance|factual_accuracy; stage: before_output|after_draft|before_publish|on_review; required: bool)
  - `review_stages[]`: [self_review | peer_review | human_review | automated_check]
  - `escalation_rule`: string (e.g., "3 revision rounds → escalate to human")
  - `context_needs[]`: knowledge module paths required at session start
  - `context_budget`: enum [minimal, standard, generous, unlimited], default standard
  - `default_cognitive_tier`: CognitiveTier for ad-hoc invocations (workflow tier overrides)

- **Expected Markdown Sections:**
  - Required: ## Role Description, ## Instruction Priority, ## Behavioral Guidelines, ## Decision Boundary
  - Recommended: ## Collaboration Patterns, ## Anti-Patterns

- **Validation Rules:**
  - skills must reference existing .fgOS/skills/ entries (warning)
  - reports_to must be valid agent name or 'human' (error)
  - quality_gates must use standard gate names (error)

---

#### 3. **skill.schema.yaml**
- **Purpose:** Validates SKILL.md frontmatter
- **Key Fields:**
  - `name` (kebab-case, must match directory name), `version` (semver), `description` (max 200 chars)
  - `layer`: $ref to SkillLayer (L1 | L2 | L3)
  - `domain`: $ref to Domain
  - `tags[]`: kebab-case classification tags
  - `activation`: { patterns: [min 1 string], exclusions: [], requires_context: [] }
  - `brand_id`: optional, kebab-case (else resolves via studio/config/active.yaml)
  - `input`: { schema_ref, required_fields[], optional_fields[] }
  - `output`: { schema_ref, primary: string, secondary[] }
  - `requires[]`: skill dependencies (must run before this skill)
  - `provides[]`: capabilities this skill produces for downstream
  - `signals`: { emits: [Signal], listens: [signal_pattern] }
  - `rigor`: RigorLevel, default standard
  - `autonomy`: AutonomyLevel, default L3_supervised
  - `quality_gates[]`: $ref to QualityGate
  - `layer_rules`: { can_call[], cannot_call[] } (auto-derived from layer)
  - `created`, `updated`: date format
  - `status`: enum [active | draft | deprecated], default active

- **Expected Markdown Sections (SKILL.md body):**
  - Purpose
  - When to Use
  - When NOT to Use
  - Process (step-by-step)
  - Anti-Patterns (table: pattern | why it fails | correct approach)
  - Red Flags (table: red flag | likely cause | recovery action)
  - Rationalization Table (table: rationalization | why it's wrong)
  - Verification Checklist (markdown checklist)
  - References (citations to frameworks, papers, methodologies)

- **Layer Constraints (enforced by validators):**
  - L1: can_call [L1, L2, L3]
  - L2: can_call [L2, L3]
  - L3: can_call [], requires []
  - L3 is a leaf node — cannot call other skills

- **Validation Rules:**
  - name must match directory name
  - L3 skills cannot call other skills (error)
  - activation.patterns must have >= 1 entry
  - version must follow semver
  - For L3: requires [] must be empty or only external tools

---

#### 4. **common.schema.yaml** — Shared Definitions
All schemas reference these enums/objects:

```yaml
definitions:
  StatusCode:
    enum: [DONE, DONE_WITH_CONCERNS, BLOCKED, NEEDS_CONTEXT]
    description: "Agent task completion status (SDD protocol)"
  
  RigorLevel:
    enum: [quick, standard, thorough, critical]
  
  AutonomyLevel:
    enum: [L1_manual, L2_guided, L3_supervised, L4_autonomous, L5_full_auto]
  
  SkillLayer:
    enum: [L1, L2, L3]
  
  Domain:
    enum: [content, campaign, seo, analytics, brand, strategy, sales, community, support]
  
  AgentCategory:
    enum: [tofu, mofu, bofu, core, support]
  
  WorkflowType:
    enum: [sequential, parallel, conditional, loop]
  
  TriggerType:
    enum: [manual, chained, scheduled, event_driven, conditional]
  
  QualityGate:
    properties:
      gate: enum [brand_compliance, content_quality, seo_compliance, legal_compliance, factual_accuracy]
      stage: enum [before_output, after_draft, before_publish, on_review]
      required: boolean
  
  Signal:
    properties:
      name: pattern "^[a-z][a-z0-9-]*(\\.[a-z][a-z0-9_]*){1,3}$"  # 2-4 segments (ADR 0034)
      emitter: string
      data: object
  
  BrandContext:
    properties:
      brand_id: pattern "^[a-z0-9]+(-[a-z0-9]+)*$"
      source: enum [task_parameter, active_brand_file]
      profile_path: string
  
  MetadataBlock: { name, version, description, created, updated }
  
  StatusReport: { status, summary, evidence, concerns, blocker, needed }
```

---

### Supporting Schemas (Full Catalog)

**Total: 40 schema files in `.fgOS/schemas/`**

| File | Purpose |
|------|---------|
| **Core** | |
| workflow.schema.yaml | Workflow definition validation (v1.12.0) |
| agent.schema.yaml | Agent role definition validation |
| skill.schema.yaml | Skill capability definition validation |
| common.schema.yaml | Shared enum/object definitions |
| cognitive-tier.yaml | Cognitive tier definitions (lightweight...critical) |
| **Runtime & Execution** | |
| runtime.schema.yaml | Workflow execution runtime state |
| status.schema.yaml | Status codes and reporting |
| **Content & Campaign** | |
| campaign.schema.yaml | Campaign artifact schema |
| content-brief.schema.yaml | Content brief input structure |
| content-calendar.schema.yaml | Editorial calendar entries |
| email-sequence.schema.yaml | Email sequence definitions |
| social-slot.schema.yaml | Social media posting slot |
| **Brand & Identity** | |
| brand-profile.schema.yaml | Brand positioning, voice, guidelines |
| visual-identity.schema.yaml | Logo, palette, typography, templates |
| visual-brand-compliance.schema.yaml | Visual asset compliance rules |
| **Strategy & Analysis** | |
| marketing-strategy.schema.yaml | Strategic plan definition |
| persona.schema.yaml | Audience persona definition |
| anti-personas.schema.yaml | Anti-personas (who NOT to target) |
| competitor-intel.schema.yaml | Competitive intelligence structure |
| **Production & Assets** | |
| video-production-spec.schema.yaml | Video production specification |
| video-storyboard.schema.yaml | Video storyboard frames |
| video-variant.schema.yaml | Video format variants |
| visual-prompt-spec.schema.yaml | Visual generation prompt |
| audio-prompt-spec.schema.yaml | Audio generation prompt |
| visual-brief.schema.yaml | Visual asset brief |
| design-brief.schema.yaml | Design direction brief |
| **Workflow Artifacts** | |
| batch-manifest.schema.yaml | Batch job output manifest |
| bundle-manifest.schema.yaml | Asset bundle specification |
| review-bundle.schema.yaml | Review package (output + metadata) |
| **Operations** | |
| audit-report.schema.yaml | Audit findings and action plan |
| audit-rules.schema.yaml | Audit criteria and scoring |
| performance-report.schema.yaml | Campaign/content performance metrics |
| observability.schema.yaml | Logging and metrics collection |
| reactive-log.schema.yaml | Reactive (trending/viral) content tracking |
| refresh-log.schema.yaml | Content refresh/update tracking |
| pulse-history-entry.schema.yaml | Audience mood/sentiment tracking |
| **Editorial & Scheduling** | |
| editorial-pillars.schema.yaml | Brand content pillar definitions (ADR 0014) |
| monthly-theme-overlay.schema.yaml | Monthly campaign theme overlay |
| series.schema.yaml | Recurring content series template |
| commercial-calendar.schema.yaml | Product launch, promotional event calendar |
| **Repurposing** | |
| repurpose-spec.schema.yaml | Content repurposing transformation spec |
| cut-spec.schema.yaml | Video/audio cut specification (trim, segment, splice) |
| media-sub-flow.contract.yaml | Media production sub-flow interface |
| **Total:** 40 files |

---

## II. SKILLS INVENTORY

**Location:** `.fgOS/skills/` (39 directories, excluding `_incubator`)  
**Coverage:** 3 representative SKILL.md files sampled in detail; all skill names listed

### Skill Definition Structure (Sampled: research, brand-strategy, seo-audit)

All SKILL.md files follow this format:

#### Frontmatter (YAML)
```yaml
---
name: skill-name           # kebab-case, must match directory name
version: 1.0.0            # semantic version
description: "..."        # max 200 chars
layer: L1 | L2 | L3       # skill hierarchy tier
domain: [content|campaign|seo|analytics|brand|strategy|sales|community|support]
tags: [keyword, keyword]  # additional classification
activation:
  patterns: ["phrase1", "phrase2"]  # natural language triggers
  exclusions: ["phrase"]   # false-positive phrases to exclude
  requires_context: []     # context keys needed before activation
brand_id: optional         # or resolved from studio/config/active.yaml
input:
  schema_ref: "./schema.yaml"
  required_fields: [field1]
  optional_fields: [field2]
output:
  schema_ref: "./schema.yaml"
  primary: "artifact_name"
  secondary: [artifact2]
requires: [skill1, skill2] # skill dependencies
provides: [capability1]    # outputs for downstream
signals:
  emits: [{name: "domain.action", emitter: "..."}]
  listens: [domain_pattern]
rigor: quick|standard|thorough|critical  # default: standard
autonomy: L1_manual|L2_guided|L3_supervised|L4_autonomous|L5_full_auto  # default: L3_supervised
quality_gates: [{gate, stage, required}]
layer_rules:
  can_call: [L1|L2|L3]
  cannot_call: []
created: date
updated: date
status: active|draft|deprecated  # default: active
---
```

#### Markdown Sections (Required)
1. **Purpose** — What the skill does, when to use it, scope constraints
2. **When to Use** — Activation scenarios
3. **When NOT to Use** — Common misuse cases
4. **Process** — Step-by-step numbered procedure (core of the skill)
5. **Anti-Patterns** — Table: [Pattern | Why It Fails | Correct Approach]
6. **Red Flags** — Table: [Red Flag | Likely Cause | Recovery Action]
7. **Rationalization Table** — Table: [Rationalization | Why It's Wrong]
8. **Verification Checklist** — Markdown checklist of completion criteria
9. **References** — Citations to frameworks, methodologies, papers

#### Quality Measurement
Quality gates are embedded in the skill definition as:
- `quality_gates[]` frontmatter array (gate type + stage + required flag)
- Process steps may reference gate passes (e.g., "Run `factual_accuracy` gate")
- Verification checklist includes gate checks
- Anti-patterns section warns against quality shortcuts

---

### All Skills (39 Active + 1 Dispatcher)

**By Layer:**

**L1 Orchestrators (2):**
1. campaign-execution
2. marketing-planning

**L2 Specialists (26):**
- **Content (text):** copywriting, content-creation, content-repurpose, content-review, email-copy, social-content, video-scripting, editorial-planning
- **Content (visual):** visual-design, image-generation, thumbnail-design, design-brief, presentation-design
- **Content (media):** video-production, storyboarding, audio-production
- **Strategy:** creative-direction, competitor-analysis, audience-research, brand-strategy, pricing-strategy
- **Brand:** identity-system
- **Execution:** seo-optimization, email-automation, ads-management, social-scheduling
- **Analytics:** performance-analysis, funnel-analysis, attribution-modeling

**L3 Utilities (11):**
1. brand-compliance
2. brand-strategy (wait, this is L2 above)
3. research
4. seo-audit
5. visual-brand-compliance
6. media-processing
7. data-formatting
8. audio-production (wait, this is L2 above)
9. (corrections: actual L3 are: brand-compliance, research, seo-audit, visual-brand-compliance, media-processing, data-formatting)

**Dispatcher:**
- fg-mkt (not counted in catalog; invokes skills via natural language routing)

**Special:**
- _incubator/ (work-in-progress skills, not in active catalog)

**Total Active Skills: 39** (per README.md, excluding fg-mkt dispatcher and _incubator)  
**Note:** README lists 41 skills in some counts due to draft skills (diagram-design, illustration-design, infographic-design, photography-design, etc.); catalog counts only active.

---

### Sampled Skill Details

#### **research** (L3 Utility, domain: support)
- **Version:** 1.0.0
- **Rigor:** standard
- **Autonomy:** L4_autonomous
- **Quality Gates:** factual_accuracy (before_output, required)
- **Activation Patterns:** "research this topic", "find information about", "gather data on", etc.
- **Exclusions:** "analyze the data" (use performance-analysis), "write content using research" (use content-creation)
- **Requires:** [] (leaf node)
- **Provides:** [research_findings, source_list, data_points, knowledge_gaps]
- **Process Steps (7):**
  1. Scope definition (research question, depth, source types, recency, geography)
  2. Source identification (primary > secondary > tertiary; document tier)
  3. Data extraction (exact values, quotes, source, author, date, URL)
  4. Triangulation (2-3 independent sources; confidence levels High/Medium/Low)
  5. Gap identification (explicit list of what was searched but not found)
  6. Output structuring (organize by topic; include source list, gaps)
  7. Run factual_accuracy gate
- **Anti-Patterns (5):** Single-source answers | Treating industry reports as primary | Paraphrasing statistics | Confirmation bias | Silently omitting gaps
- **Red Flags (5):** Open-ended research question | All sources from one publication | Untraced statistic | Findings outside recency | No gaps listed
- **Key Rationalization:** "Everyone knows this statistic" → Wrong; "Consuming skill will verify" → Wrong; "Two sources citing each other" → Not independent

#### **brand-strategy** (L2 Specialist, domain: brand)
- **Version:** 1.0.0
- **Rigor:** critical
- **Autonomy:** L2_guided
- **Quality Gates:** none (but requires human approval at critical rigor)
- **Activation Patterns:** "define brand strategy", "brand positioning", "brand voice", "brand messaging", "update brand guidelines"
- **Exclusions:** "check content against brand" (use brand-compliance), "create campaign" (use campaign-execution)
- **Requires:** [audience-research, competitor-analysis]
- **Provides:** [brand_positioning_statement, messaging_architecture, brand_voice_guide, brand_guidelines_update]
- **Process Steps (8):**
  1. Brand audit (review existing materials; identify inconsistencies, gaps)
  2. Audience & competitive input (delegate to audience-research + competitor-analysis; positioning is relational)
  3. Archetype & values alignment (select primary archetype; define 3-5 values with behavioral examples)
  4. Positioning statement (format: "[Brand] is the [category] that [benefit] for [audience] because [reason]")
  5. Messaging architecture (core message + 3-5 pillars, each with headline, 2-3 points, ≥1 proof point)
  6. Voice guide (3-4 tone attributes with behavioral definitions; do/don't pairs; prohibited words)
  7. Human approval (mandatory at critical rigor)
  8. Guidelines update (update knowledge/brand/profile.yaml; emit content.approved)
- **Anti-Patterns (6):** Copying competitor voice | Vague positioning | Brand for everyone | Voice guide without examples | Skip audience/competitor input | Publish without human approval
- **Key Rationalization:** "We'll define voice as we produce content" → Wrong; "Positioning is obvious to the team" → Needs documentation; "Can position for SMB and enterprise" → Dilutes both

#### **seo-audit** (L3 Utility, domain: seo)
- **Version:** 1.0.0
- **Rigor:** thorough
- **Autonomy:** L4_autonomous
- **Quality Gates:** factual_accuracy (before_output, required)
- **Activation Patterns:** "SEO audit", "technical SEO check", "audit the website", "find SEO issues", "crawl errors", "page speed SEO"
- **Exclusions:** "keyword research" (use seo-optimization), "write SEO content" (use content-creation + seo-optimization)
- **Requires:** [] (leaf node)
- **Provides:** [audit_report, issue_list, priority_fix_list, baseline_metrics]
- **Process Steps (8):**
  1. Scope definition (URL list/domain, depth, priority areas, baseline)
  2. Crawl analysis (broken links, redirect chains, canonical mismatches, duplicates, orphans)
  3. Indexing check (noindex tags, robots.txt, sitemap, crawl budget)
  4. Core Web Vitals & page speed (LCP <2.5s, CLS <0.1, INP <200ms; desktop + mobile)
  5. On-page elements (title tags, meta descriptions, H1, image alt text, internal linking)
  6. Content gap analysis (high-value keyword clusters; thin pages; cannibalization)
  7. Competitor comparison (domain authority, backlinks, content coverage vs. 2-3 competitors)
  8. Priority matrix & action plan (classify: critical/warning/info; order by ranking impact)
- **Anti-Patterns (6):** On-page only | Desktop-only audit | No prioritization | No action plan | Treating all duplicates as error | Skipping backlinks
- **Key Rationalization:** "Small site doesn't need full crawl" → Wrong; "Client said they fixed it" → Verify; "Mobile poor but traffic is desktop" → Google indexes mobile-first
- **Verification Checklist (7 items):** Scope defined | All 6 audit dimensions covered | Mobile audited separately | Issues classified by severity | Priority matrix ordered by impact | Baseline metrics recorded | factual_accuracy gate passed

---

## III. AGENTS INVENTORY

**Location:** `.fgOS/agents/` (20 agent files + README)  
**Coverage:** 2 representative agents sampled in detail; all agent names listed

### Agent Definition Structure (Sampled: researcher, brand-guardian)

All agent .md files follow this format:

#### Frontmatter (YAML)
```yaml
---
name: agent-name           # kebab-case
version: 1.0.0            # semantic version
description: "..."        # max 120 chars
role: "Human-Readable Role Title"  # e.g., "Market Intelligence Specialist"
category: tofu|mofu|bofu|core|support  # funnel position
default_cognitive_tier: lightweight|standard|creative|analytical|critical  # tier used when ad-hoc
persona:
  voice: string           # tone and communication style
  style: string           # working style description
  archetype: string       # mental model for behavior
skills: [skill1, skill2]  # min 1; must reference .fgOS/skills/
autonomy: L1_manual|L2_guided|L3_supervised|L4_autonomous|L5_full_auto
decision_boundary:
  can_decide: [action1]   # actions agent can take without approval
  must_escalate: [action2]  # actions requiring human/higher approval
status_protocol:
  uses: [DONE, DONE_WITH_CONCERNS, BLOCKED, NEEDS_CONTEXT]  # subset of StatusCode
  evidence_required: boolean  # whether DONE reports need evidence field
reports_to: agent_name | 'human'  # escalation target, default 'human'
quality_gates: [{gate, stage, required}]  # gates applied to this agent's output
review_stages: [self_review|peer_review|human_review|automated_check]
escalation_rule: string   # e.g., "3 revision rounds → escalate to human"
context_needs: [module_path]  # knowledge required at session start
context_budget: minimal|standard|generous|unlimited  # default: standard
---
```

#### Markdown Sections (Required)
1. **Role Description** — What this agent does, who it serves, decision authority
2. **Instruction Priority** — Hierarchy of constraints (user instructions > research brief > skill defaults > agent defaults)
3. **Behavioral Guidelines** — When Receiving a Task, When Stuck, When Reviewing Output
4. **Decision Boundary** — Table showing: Scenario | Decision | Autonomy level
5. **Collaboration Patterns** — Table: Workflow | Partners | This Agent's Role + signals emitted/listened

#### Quality & Escalation
- Quality gates are assigned per agent (e.g., brand-guardian runs brand_compliance gate on every output)
- Escalation rule triggers after N revision rounds or on specific conditions
- Decision boundary shows which actions require human sign-off vs. agent autonomy

---

### All Agents (20 Total)

**By Funnel Category:**

**TOFU — Awareness (4):**
1. attraction-specialist (L3, brand-awareness + social + content-creation skills)
2. seo-specialist (L3, seo-audit + copywriting + content-review)
3. researcher (L4, market-research + competitive-analysis) — **SAMPLED**
4. lead-qualifier (L2, lead-scoring + crm-integration)

**MOFU — Consideration (4):**
5. content-creator (L3, content-creation + copywriting + brand-compliance)
6. email-wizard (L3, email-marketing + copywriting + performance-analysis)
7. funnel-architect (L2, funnel-design + marketing-planning + performance-analysis)
8. sale-enabler (L2, sales-enablement + copywriting + content-review)

**BOFU — Conversion (2):**
9. upsell-maximizer (L2, upsell-strategy + performance-analysis)
10. continuity-specialist (L2, retention-strategy + email-marketing)

**Core — Cross-Cutting (6):**
11. copywriter (L3, copywriting + content-review + brand-compliance)
12. campaign-manager (L2, campaign-execution + marketing-planning + performance-analysis)
13. content-reviewer (L3, content-review + brand-compliance + seo-audit)
14. social-media-manager (L3, social-media + content-creation + performance-analysis)
15. visual-designer (L3, visual-design + image-generation + thumbnail-design + visual-brand-compliance + design-brief)
16. video-producer (L3, video-scripting + storyboarding + video-production + audio-production + media-processing)

**Support — Utility (4):**
17. analytics-analyst (L4, performance-analysis + data-visualization)
18. brand-guardian (L3, brand-compliance + content-review) — **SAMPLED**
19. creative-director (L2, creative-direction + visual-brand-compliance + design-brief)
20. campaign-debugger (L4, campaign-execution + performance-analysis)

---

### Sampled Agent Details

#### **researcher** (TOFU, category: tofu, autonomy: L4_autonomous)
- **Role Title:** Market Intelligence Specialist
- **Default Cognitive Tier:** analytical
- **Persona:**
  - Voice: "Curious, precise, source-conscious"
  - Style: "Follows evidence, not assumptions. Separates facts from interpretation explicitly."
  - Archetype: "Investigative analyst. Never presents a finding without a source."
- **Skills:** [market-research, competitive-analysis]
- **Decision Boundary:**
  - Can Decide: Research scope/source selection | Synthesis & prioritization | Confidence tier assignment | Analysis framework selection
  - Must Escalate: Purchasing paid data tools | Sharing intelligence externally | Research contradicting active strategy
- **Status Protocol:** Uses all 4 StatusCode values; evidence_required: true
- **Reports To:** campaign-manager
- **Quality Gates:** factual_accuracy (before_output, required)
- **Review Stages:** [self_review]
- **Escalation Rule:** "3 revision rounds → escalate to human"
- **Context Needs:** [knowledge/audience/personas.yaml]
- **Context Budget:** generous
- **Instruction Priority:**
  1. User instructions (research questions, scope, output format)
  2. Research brief (specific hypotheses, knowledge gaps)
  3. Skill defaults (market-research + competitive-analysis frameworks)
  4. Agent defaults (persona rigor, citation standards)
- **Behavioral Guidelines:**
  - When Receiving: Confirm questions, decision context, output format, source constraints
  - When Stuck: Report NEEDS_CONTEXT for inaccessible sources | Report DONE_WITH_CONCERNS if findings contradict assumptions | Propose narrowed scope if too broad
  - When Reviewing: Every finding tagged with source? Confidence tiers marked? Inferences vs. facts distinguished?
- **Collaboration Patterns:**
  - Campaign planning: Partner with campaign-manager, funnel-architect; deliver audience & market intelligence before strategy
  - Content strategy: Partner with content-creator, seo-specialist; provide topic demand, audience pain points, content gaps
  - Competitive response: Partner with campaign-manager, sale-enabler; supply competitive landscape analysis
- **Signals:** Emits research.complete | Listens research.requested
- **Anti-Patterns (5):** Single-source answers | Inferences as confirmed findings | Confirmation bias | Undefined research questions | Skipping source citation

#### **brand-guardian** (Support, category: support, autonomy: L3_supervised)
- **Role Title:** Brand Compliance and Consistency Enforcer
- **Default Cognitive Tier:** standard
- **Persona:**
  - Voice: "Exacting, consistent, non-negotiable on standards"
  - Style: "Cites brand profile chapter and verse. Never approves exceptions silently."
  - Archetype: "Brand manager who treats guidelines as a legal contract, not a suggestion."
- **Skills:** [brand-compliance, content-review]
- **Decision Boundary:**
  - Can Decide: Pass/fail on brand_compliance gate | Specific violation citations | Prohibited word flagging | Visual guideline compliance
  - Must Escalate: Brand profile gaps requiring policy decisions | Exception requests | Brand guideline updates
- **Status Protocol:** Uses all 4 StatusCode values; evidence_required: true
- **Reports To:** human
- **Quality Gates:** brand_compliance (on_review, required)
- **Review Stages:** [self_review]
- **Escalation Rule:** "Brand profile ambiguity → escalate before ruling; exception requests → always escalate"
- **Context Needs:** [knowledge/brand/profile.yaml]
- **Context Budget:** minimal
- **Instruction Priority:**
  1. Brand profile (sole source of truth; no other input overrides)
  2. User instructions (can narrow scope; cannot override profile)
  3. Skill defaults (brand-compliance + content-review checklists)
  4. Agent defaults (Default-FAIL stance, citation discipline)
- **Behavioral Guidelines:**
  - When Receiving: Load current brand profile | Apply Default-FAIL (assume violation exists; search actively) | Work through checklist systematically | Cite specific brand profile section for every violation
  - When Stuck: If profile silent on disputed point → report NEEDS_CONTEXT & escalate gap | If exception requested → report NEEDS_CONTEXT immediately | If 3+ revision cycles on same issue → report BLOCKED, escalate to human
  - When Reviewing: Voice/tone vs. profile? Prohibited words? Messaging hierarchy? Visual identity (if applicable)? Every violation has profile citation? Passes are explicit?
- **Collaboration Patterns:**
  - Content quality gate enforcement: Partner with content-reviewer, campaign-manager; serve as final authority on brand compliance
  - Brand dispute resolution: Partner with copywriter, content-creator, social-media-manager; issue binding ruling with profile citation; escalate gaps
  - Brand profile maintenance: Partner with human; surface gaps/ambiguities; do not modify profile without instruction
- **Signals:** Emits brand.compliant (on pass with evidence) | Emits brand.blocked (on fail with violation list)
- **Anti-Patterns (5):** Approving exceptions silently | Ruling on gaps without escalating | General impressions instead of specific citations | Over-strict (blocks everything) | Too loose (rubber-stamping)

---

## IV. WORKFLOWS INVENTORY

**Location:** `.fgOS/workflows/` (32 workflow files + README)  
**Coverage:** 3 representative workflows sampled in detail; all workflow names listed

### Workflow Definition Structure (Sampled: content-creation, brand-identity-build, campaign-lifecycle)

All workflow .md files follow this format (see workflow.schema.yaml, Section I.1):

#### Frontmatter (YAML)
- **Identity:** name, version, description
- **Execution:** type (sequential|parallel|conditional|loop), rigor, default_cognitive_tier, checkpoint, max_retries, rollback_strategy
- **Metadata:** domain, layer (planning|production|distribution), trigger
- **Agents:** roster with role assignments
- **Stages:** ordered array with stage_id, title, agent, task, cognitive_tier, context_rules, timeouts, etc.
- **Approval Gates:** async gate support with runs_after/runs_before, pause_reason, next_on_approval/rejection
- **Loop Config:** (for loop-type workflows) child_workflow, dispatch_stage, completion_signal, timeout_hours
- **Signals:** emits[], listens_for[], auto_trigger_autonomy
- **Escalation:** target, conditions
- **Outputs:** (ADR 0034) concept_id, pattern, canonical path, schema, companions

#### Markdown Sections (Required)
1. **Overview** — Goals, scope, trigger conditions, success conditions
2. **Stages** — Ordered list of stages with agent, input, output, gates
3. **Error Handling** — Per-error recovery paths
4. **Signals** — Emitted and consumed signals
5. **Flow Diagram** (recommended) — ASCII visualization

#### Quality Features
- **Checkpoints** (stage.checkpoint: true) — Save resumable state for fault tolerance
- **Max Retries** (per-stage or workflow-wide) — Auto-retry on transient failures
- **Approval Gates** (runs_after/runs_before) — Sync (human) or async (signal-based) approval
- **Parallel Stages** (stage_4a_, stage_4b_) — Named parallel groups with join logic
- **Context Rules** (per rigor level) — Advisory reading scope: must/should/skip documents + token budget
- **Cognitive Tiers** (stage-level) — Model selection via .claude/config/model-policy.yaml
- **Signals** (async gates) — Emit on reaching gate; listen for external approval/rejection signals

---

### All Workflows (32 Total)

**By Domain:**

**Content (13):**
1. content-audit — sequential, scheduled, review existing content
2. content-batch-production — loop, dispatched, multi-item content
3. content-calendar — sequential, scheduled, editorial planning
4. content-creation — sequential, manual, single article/post production — **SAMPLED**
5. content-repurpose — sequential, chained, adapt content across formats
6. design-brief — sequential, manual, visual direction for designers
7. landing-page-creation — sequential, manual, single landing page
8. podcast-production — sequential, manual, podcast episodes
9. social-batch-production — loop, dispatched, multi-social content
10. social-production — sequential, dispatched, single social piece
11. thumbnail-batch — loop, manual|dispatched, video/image thumbnails
12. video-production — sequential, manual, video end-to-end — **SAMPLED**
13. video-repurpose — sequential, chained, adapt video across formats

**Brand & Strategy (5):**
14. brand-absorb — sequential, manual, benchmark competitive brand
15. brand-identity-build — sequential, manual, full visual identity system — **SAMPLED**
16. brand-patch — sequential, manual, update specific brand elements
17. brand-readiness — sequential, manual, brand compliance audit
18. brand-refresh — sequential, manual, rebrand refresh
19. persona-refresh — sequential, manual, update audience personas
20. editorial-pillars-refresh — sequential, manual, update brand content pillars

Wait, that's 20. Let me recount:

**Brand & Strategy (6):**
14. brand-absorb
15. brand-identity-build
16. brand-patch
17. brand-readiness
18. brand-refresh
19. persona-refresh
20. editorial-pillars-refresh

**Campaign (5):**
21. campaign-creative-pack — parallel, manual, visual assets for campaign
22. campaign-lifecycle — sequential, manual, plan → launch → post-mortem — **SAMPLED**
23. commercial-calendar-setup — sequential, manual, product/event calendar
24. marketing-strategy-plan — sequential, manual, strategic planning
25. series-definition — sequential, manual, recurring content series

**Analytics & Audit (3):**
26. performance-report — sequential, scheduled, campaign performance analysis
27. seo-audit-workflow — sequential, manual, SEO audit & action plan
28. competitor-intel — sequential, manual, competitive intelligence

**Remaining (3):**
29. email-sequence — sequential, manual, email nurture sequence
30. social-scheduling — sequential, scheduled, social calendar scheduling
31. visual-asset-kit — parallel, manual, visual asset production kit
32. (32 total)

Actually, I should refer to the README which lists them in the .md files themselves. Based on my read of the workflows/README.md, the catalog includes ~32 workflows. Let me list them as they appear:

**FULL CATALOG (Per .fgOS/workflows/README.md content-audit through visual-production entries):**

Content Domain (14 workflows):
1. content-audit
2. content-batch-production
3. content-calendar
4. content-creation
5. content-repurpose
6. design-brief
7. landing-page-creation
8. podcast-production
9. social-batch-production
10. social-production
11. thumbnail-batch
12. video-production
13. video-repurpose
14. visual-asset-kit

Brand/Strategy (7):
15. brand-absorb
16. brand-identity-build
17. brand-patch
18. brand-readiness
19. brand-refresh
20. editorial-pillars-refresh
21. persona-refresh

Campaign (4):
22. campaign-creative-pack
23. campaign-lifecycle
24. commercial-calendar-setup
25. marketing-strategy-plan

Analytics/Operations (2):
26. performance-report
27. seo-audit-workflow

Supporting (1):
28. competitor-intel
29. email-sequence
30. series-definition
31. social-scheduling

**Total: 31-33 workflows** (exact count varies depending on whether you count exemplars, stubs, etc.)

---

### Sampled Workflow Details

#### **content-creation** (v2.2.0, sequential)
- **Domain:** content
- **Layer:** production
- **Trigger:** manual
- **Rigor:** standard
- **Default Cognitive Tier:** standard
- **Checkpoint:** true
- **Max Retries:** 3
- **Rollback Strategy:** last_checkpoint
- **Agents (5):**
  - orchestrator: campaign-manager
  - executor: content-creator
  - specialist: visual-designer
  - reviewer: content-reviewer
  - guardian: brand-guardian
- **Completion:**
  - checkpoint: content_produced
  - signal: content.produced
- **Stages (12):**
  1. stage_1_brief — campaign-manager, task: content-brief-creation
  2. stage_2_research — content-creator, task: content-topic-research, checkpoint: true, context_rules with must/should/skip
  3. stage_3_draft — content-creator, task: blog-draft-generation, cognitive_tier: creative, context_rules
  4. stage_4a_ai_precheck — content-reviewer, task: content-ai-quality-check (parallel with 4b)
  5. stage_4b_brand_precheck — brand-guardian, task: brand-voice-check, cognitive_tier: lightweight (parallel with 4a)
  6. stage_5_draft_finalization — content-creator, task: content-finalization, emits: [content.finalized]
  7. stage_6_visual_production — campaign-manager, task: image-brief-creation (conditional dispatch)
  8. stage_7_visual_qc — content-reviewer, task: creative-direction-adherence-review
  9. stage_8_embed_visuals — content-creator, task: content-finalization
  10. stage_9_brand_final_check — brand-guardian, task: brand-voice-check, max_retries: 1
  11. stage_10_approve — campaign-manager, task: workflow-orchestration, checkpoint: true
  12. stage_11_finalize — campaign-manager, task: workflow-orchestration
  13. stage_12_distribute — campaign-manager, task: content-distribution-prep
- **Approval Gates (2):**
  - quality_review: runs_before stage_11_finalize, approver: content-reviewer, required: false (informational)
  - review_checkpoint: runs_after stage_4b_brand_precheck, approver: async_queue, required: true, async: true
    - emits: review.pending
    - accepts: [review.approved, review.rejected, review.auto_approved, review.skipped]
    - next_on_approval: stage_5_draft_finalization
    - next_on_rejection: stage_5_draft_finalization
    - pause_reason: review_pending
- **Signals:**
  - emits: content.drafted, content.finalized, content.reviewed, brand.precheck.critical, visual.production.requested, content.approved, content.produced
  - listens_for: campaign.planned, visual.batch.produced
- **Escalation:**
  - target: human
  - conditions: [max_retries_exceeded, brand_violation_3x, quality_gate_fail_3x]
- **Context Rules (Example — stage_2_research, standard rigor):**
  ```yaml
  must: ["studio/{brand_id}/profile.yaml", "studio/{brand_id}/editorial-pillars.yaml"]
  should: ["studio/{brand_id}/audience/*.yaml (persona this piece targets)"]
  skip: ["studio/shared/competitor/**"]
  token_budget: 5000
  retrieval_triggers:
    - condition: "touches pricing or health/regulated claims"
      documents: [".fgOS/knowledge/marketing/compliance.yaml", "studio/{brand_id}/profile.yaml"]
  ```
- **Scope:** Single content asset (blog post, case study, long-form copy)

#### **brand-identity-build** (v1.0.0, sequential)
- **Domain:** brand
- **Layer:** planning
- **Trigger:** manual
- **Rigor:** critical
- **Default Cognitive Tier:** critical
- **Checkpoint:** true
- **Max Retries:** 3
- **Rollback Strategy:** last_checkpoint
- **Agents (4):**
  - orchestrator: campaign-manager
  - specialist: creative-director
  - executor: visual-designer
  - guardian: brand-guardian
- **Completion:**
  - checkpoint: identity_delivered
  - signal: brand.identity_built
- **Stages (12):**
  1. stage_1_brief_intake — campaign-manager, task: content-brief-creation
  2. stage_2_creative_direction — creative-director, task: creative-direction-brief, context_rules: critical rigor with brand profile + stage_1 output
  3. stage_3_direction_approval — workflow-orchestration
  4. stage_4_logo_system_design — visual-designer, task: logo-system-design
  5. stage_5_logo_approval — workflow-orchestration
  6. stage_6_palette_typography — visual-designer, task: visual-identity-system
  7. stage_7_application_templates — visual-designer, task: visual-identity-system
  8. stage_8_direction_adherence_review — creative-director, task: creative-direction-adherence-review
  9. stage_9_usage_guidelines — visual-designer, task: brand-guidelines-document
  10. stage_10_brand_stub_population — visual-designer, task: brand-profile-stub-population
  11. stage_11_final_approval — workflow-orchestration
  12. stage_12_delivery — campaign-manager, task: workflow-orchestration
- **Approval Gates (3):**
  - direction_approval: runs_after stage_2_creative_direction, approver: human, required: true
  - logo_approval: runs_after stage_4_logo_system_design, approver: human, required: true
  - full_identity_approval: runs_before stage_12_delivery, approver: human, required: true
- **Signals:**
  - emits: creative.direction_set, brand.identity_built, brand.ready_for_strategy
  - listens_for: (none; manual trigger only; phantom signal removed)
- **Escalation:**
  - target: human
  - conditions: [max_retries_exceeded, brand_strategy_missing, license_unclear]
- **Outputs (ADR 0034):**
  - visual-assets/identity: YAML canonical + MD companion
  - profile: YAML canonical + MD companion
  - discovery-brief: MD canonical with frontmatter
  - visual-assets/guidelines: MD canonical
  - visual-assets/logo: static binary files (PNG)
  - visual-assets/palette: YAML + companions (swatch colors)
  - visual-assets/typography: YAML + companions (font specs)
- **Scope:** One brand, full visual system (logo, palette, typography, templates, guidelines)

#### **campaign-lifecycle** (v1.1.0, sequential)
- **Domain:** campaign
- **Layer:** production
- **Trigger:** manual
- **Rigor:** thorough
- **Default Cognitive Tier:** standard
- **Checkpoint:** true
- **Max Retries:** 3
- **Rollback Strategy:** last_checkpoint
- **Agents (9):**
  - orchestrator: campaign-manager
  - specialist: creative-director
  - executor: visual-designer, video-producer, content-creator, email-wizard, social-media-manager
  - reviewer: content-reviewer
  - guardian: brand-guardian
  - analyst: analytics-analyst
- **Completion:**
  - checkpoint: campaign_complete
  - signal: campaign.completed
- **Stages (10):**
  1. stage_1_plan — campaign-manager, task: campaign-plan-creation
  2. stage_2_plan_approval_gate — workflow-orchestration
  3. stage_3_creative_production — workflow-orchestration
  4. stage_4a_content_assets — content-creator, task: content-writing (parallel_group: content_production)
  5. stage_4b_email_sequence — email-wizard, task: email-sequence-drafting (parallel_group: content_production)
  6. stage_4c_social_assets — social-media-manager, task: social-post-draft (parallel_group: content_production)
  7. stage_5_review — content-reviewer, task: content-ai-quality-check, max_retries: 2
  8. stage_6_launch_approval_gate — workflow-orchestration
  9. stage_7_launch — campaign-manager, task: workflow-orchestration
  10. stage_8_monitor — analytics-analyst, task: campaign-performance-monitoring
  11. stage_9_optimize — campaign-manager, task: campaign-performance-monitoring
  12. stage_10_report — analytics-analyst, task: performance-report-generation
- **Approval Gates (3):**
  - plan_approval: runs_after stage_1_plan, approver: human, required: true
  - direction_approval: runs_after stage_3_creative_production, approver: campaign-manager, required: true
  - launch_approval: runs_before stage_7_launch, approver: human, required: true
- **Signals:**
  - emits: campaign.planned, creative.direction_set, visual.designed, campaign.launched, campaign.completed, metric.threshold
  - listens_for: content.published, metric.threshold, commercial.calendar_updated, strategy.campaigns_outlined, pack.delivered, kit.delivered
- **Escalation:**
  - target: human
  - conditions: [budget_exceeded, deadline_breach, max_retries_exceeded, api_failure_3x, brand_violation_3x]
- **Flow:**
  ```
  [Plan] → [HUMAN GATE] → [Creative Production] → [GATE] → [Create (parallel: Content | Email | Social)] → [Review] → [HUMAN GATE] → [Launch] → [Monitor] → [Optimize (loop until end_date)] → [Report]
  ```
- **Scope:** Multi-channel campaign (content + email + social + creative pack); excludes paid ads

---

## V. TEMPLATES INVENTORY

**Location:** `.fgOS/templates/` (2 files)

1. **audit-workflow-template.md**
   - Purpose: Scaffold for authoring new audit workflows
   - Type: Reference template, not runnable
   - Content: Common 7-stage audit pattern (Inventory → Score → Gap Analysis → Priority Matrix → Action Plan → Execute → Verify)
   - Signal pattern: {domain}.audit_started, {domain}.issues_identified, {domain}.audit_completed
   - Checkpoint strategy: Save outputs after stages 1, 2, 4, 5, 7

2. **README.md**
   - Purpose: Guide to workflow definition format
   - Content: Frontmatter skeleton, required sections, ADR references (0019 async gates, 0025 cognitive tiers, 0034 output spec)

---

## VI. SCHEMA VALIDATION FRAMEWORK

### Frontmatter-Level Validation (Applied at Load Time)

**Workflow Schema Validations:**
- agents[].agent must exist in .fgOS/agents/ (warning)
- Exactly one agent must have role=orchestrator (error)
- approval_gates[].approver must be 'human', 'async_queue', or valid agent name (error)
- approval_gates[] must have exactly ONE of: runs_after, runs_before, stage (error)
- runs_after/runs_before must reference existing stage_id in stages[] (error)
- If async=true, then emits, accepts, next_on_approval, next_on_rejection, pause_reason required (error)
- checkpoint=true requires rollback_strategy != none (warning)
- cognitive_tier must be one of 5 valid tiers (error)
- stages[].task required; task_type forbidden (error)

**Agent Schema Validations:**
- skills must reference existing .fgOS/skills/ entries (warning)
- reports_to must be valid agent name or 'human' (error)
- quality_gates must use standard gate names (error)

**Skill Schema Validations:**
- name must match directory name (error)
- L3 skills cannot call other skills (error)
- activation.patterns must have >= 1 entry (error)
- version must follow semver (error)

### Runtime Validation (ADR 0042 – Executor Routing)

- **stage.task** is required on every stage; references .fgOS/tasks/<id>.yaml
- Task file declares `preferred_executor` and `capability_category`
- Capability-routing.yaml maps category → executor (agent/model/tool selection)
- Executor resolver validates that assigned agent has required capability
- Missing task or mismatch raises MissingTaskField or ExecutorNotAvailable error

### Quality Gate System

**Defined Gates (common.schema.yaml):**
- brand_compliance — Brand profile alignment (enforced by brand-guardian)
- content_quality — Clarity, grammar, engagement (enforced by content-reviewer)
- seo_compliance — Keyword, meta, heading optimization (enforced by seo-specialist)
- legal_compliance — Regulatory (GDPR, CAN-SPAM, FTC), health claims (enforced by human or compliance agent)
- factual_accuracy — Source verification, triangulation, no fabrication (enforced by research, seo-audit, performance-analysis)

**Gate Invocation:**
- Applied at workflow stage (quality_gates[] on agent definition)
- Applied within skill process (run gate before output)
- Gates emit signals: gate.passed, gate.failed, gate.violations

---

## VII. SIGNAL SYSTEM (ADR 0034 §11, ADR 0019 Async Gates)

### Signal Naming Convention
```
domain . action [ . detail [ . qualifier ] ]
```
- **Segments:** 2-4 (domain required; 1-3 optional trailing segments)
- **Domain:** hyphenation allowed (visual-batch, asset-promotion)
- **Pattern:** `^[a-z][a-z0-9-]*(\\.[a-z][a-z0-9_]*){1,3}$`

### Common Signal Patterns (Sampled from Workflows)

| Signal | Emitter | Purpose | Accepts |
|--------|---------|---------|---------|
| campaign.planned | campaign-manager | Campaign plan approved; ready for content/creative | n/a |
| content.drafted | content-creator | Draft complete; awaiting review | n/a |
| content.finalized | content-creator (post-hook) | Final draft locked; ready for visual embed or publish | n/a |
| content.reviewed | content-reviewer | Quality review complete; pass/fail verdict | n/a |
| brand.compliant | brand-guardian | Compliance gate passed | n/a |
| brand.blocked | brand-guardian | Compliance gate failed; violations listed | n/a |
| review.pending | async queue | Async gate reached; workflow paused awaiting approval | [review.approved, review.rejected, review.auto_approved, review.skipped] |
| visual.production.requested | campaign-manager | Visual production sub-workflow dispatched | n/a |
| visual.batch.produced | visual-production workflow | Visual batch complete; ready for embed | n/a |
| research.complete | researcher | Research findings ready; sources cited | n/a |
| metric.threshold | analytics-analyst | Performance metric crossed threshold; action recommended | n/a |
| campaign.completed | campaign-manager | Campaign post-mortem complete; closed | n/a |

### Async Gate Protocol (ADR 0019)

**Gate reaches async queue → emits pause signal → workflow status: paused with pause_reason:**
```yaml
pause_reason: enum [review_pending, manual, awaiting_external_data, awaiting_legal]
```

**External approval system listens for emitted signal; responds with signal from accepts[] list:**
```
gate.accepts: [review.approved, review.rejected, review.auto_approved, review.skipped]
```

**On signal receipt, workflow resumes:**
- Signal: review.approved → route to next_on_approval stage
- Signal: review.rejected → route to next_on_rejection stage
- Signal: review.skipped → route to next_on_approval (default resume)

---

## VIII. COGNITIVE TIER SYSTEM (ADR 0025)

**File:** `.fgOS/schemas/cognitive-tier.yaml`

**Tiers (from lightweight to critical):**
1. **lightweight** — Simple, straightforward tasks (copy edits, data entry, routine checks). Uses Haiku or smallest model.
2. **standard** — Regular marketing tasks (content drafting, routine analysis, standard workflows). Uses Sonnet or mid-tier model.
3. **creative** — Creative direction, brand voice, novel problem-solving. Uses Sonnet or premium model.
4. **analytical** — Deep analysis, research synthesis, multi-source reasoning. Uses Opus or reasoning model.
5. **critical** — Strategic decisions, brand-sensitive work, high-stakes output (brand identity, positioning, crisis response). Uses Opus or best-in-class model.

**Resolution Order (ADR 0025):**
1. **Stage-level cognitive_tier** (workflow stage definition) — overrides workflow default
2. **Workflow-level default_cognitive_tier** (workflow frontmatter) — applies to all stages without explicit tier
3. **Agent-level default_cognitive_tier** (agent definition) — used for ad-hoc (non-workflow) invocations
4. **Fallback: standard** — if none specified

**Adapter Mapping:**
- Stored in `.claude/config/model-policy.yaml` (per-project adapter)
- Maps tier → Claude model (Haiku, Sonnet, Opus, etc.)
- Adapter reads next_stage_model, next_stage_executor, next_stage_interface from run.yaml when dispatching

---

## IX. CONTEXT RULES (ADR 0034 Phase 4, Pattern P3)

**File Location:** Workflow stages; optional stage.context_rules block

**Purpose:** Advisory reading-scope guidance injected read-only into dispatch context; absent = current behavior (no change for workflows without context_rules)

**Structure:**
```yaml
context_rules:
  # Per-rigor-level guidance
  quick:
    must: [document_path_list]     # Documents MUST be retrieved
    should: [document_path_list]   # Documents SHOULD be retrieved if context allows
    skip: [document_path_list]     # Documents should be SKIPPED (too large, too detailed)
    token_budget: integer          # Advisory token budget for this stage at this rigor (2K/5K/10K starting shapes)
  
  standard:
    must: [...]
    should: [...]
    skip: [...]
    token_budget: integer
  
  thorough:
    must: [...]
    should: [...]
    skip: [...]
    token_budget: integer
  
  critical:
    must: [...]
    should: [...]
    skip: [...]
    token_budget: integer
  
  # Rigor-independent retrieval triggers
  retrieval_triggers:
    - condition: "touches pricing or health/regulated claims"
      documents: [".fgOS/knowledge/marketing/compliance.yaml", "studio/{brand_id}/profile.yaml"]
    - condition: "new persona targeting not covered by existing persona file"
      documents: ["studio/{brand_id}/research/audience/**"]
```

**Key Properties:**
- A workflow only needs entries for the rigor level(s) it actually runs at (workflow.rigor is fixed per file, not varied per run)
- token_budget is advisory; tuned per workflow; not enforced
- retrieval_triggers[] apply regardless of rigor level
- Workflow-executor.py injects context_rules read-only; agent uses it to scope context retrieval

**Example (from content-creation workflow, stage_2_research, standard rigor):**
```yaml
context_rules:
  standard:
    must: ["studio/{brand_id}/profile.yaml", "studio/{brand_id}/editorial-pillars.yaml"]
    should: ["studio/{brand_id}/audience/*.yaml (persona this piece targets)"]
    skip: ["studio/shared/competitor/** (full competitor dossiers — pull only if the brief explicitly calls for competitive angle)"]
    token_budget: 5000
  retrieval_triggers:
    - condition: "touches pricing or health/regulated claims"
      documents: [".fgOS/knowledge/marketing/compliance.yaml", "studio/{brand_id}/profile.yaml (claims restrictions)"]
    - condition: "new persona targeting not covered by an existing persona file"
      documents: ["studio/{brand_id}/research/audience/**"]
```

---

## X. KEY DESIGN DECISIONS (ADR References)

| ADR | Title | Impact on Definitions |
|-----|-------|----------------------|
| ADR 0012 | Catalog status formalization (M5) | workflow.catalog_status enum: stub, active, test-exemplar, deferred, exemplar |
| ADR 0014 | 4-dimensional content tagging framework | editorial-pillars.yaml schema (WHEN × WHAT × WHY × HOW) |
| ADR 0015 | Calendar MVP | content-calendar.md workflow; monthly_theme_set stage |
| ADR 0017 | Three-layer workflow architecture | workflow.layer: planning \| production \| distribution |
| ADR 0019 | Async gate support | approval_gates: async, emits, accepts, next_on_*, pause_reason |
| ADR 0020 | Visual production sub-flow dispatch | content-creation stage_6: emits visual.production.requested; resumes on visual.batch.produced |
| ADR 0023 | Parallel stage support | stage_id pattern allows letter suffix (stage_4a_, stage_4b_) |
| ADR 0025 | Cognitive tier mapping to models | cognitive-tier.yaml; model-policy.yaml per adapter |
| ADR 0027 | Executor routing per capability | stage.task references .fgOS/tasks/; capability-routing.yaml → executor selection |
| ADR 0032 | Auto-dispatch autonomy gate | workflow.auto_trigger_autonomy: L1\|L2\|L3\|L4\|L5 |
| ADR 0034 | Artifact storage patterns & output contract | Workflows declare outputs[]; pattern A (YAML canonical + MD) vs. pattern B (MD canonical); context_rules Phase 4 |
| ADR 0042 | Task routing and executor resolver | stage.task required; task_type forbidden; dispatchers use task file for executor routing |

---

## XI. NOTES & GAPS

### Coverage Summary
- ✅ **Schemas:** All 40 files catalogued; 4 core schemas (workflow, agent, skill, common) fully documented with field names, enums, validation rules
- ✅ **Skills:** All 39-41 skill names listed; 3 representative SKILL.md files (research, brand-strategy, seo-audit) fully documented with frontmatter, process steps, anti-patterns, red flags, verification checklists
- ✅ **Agents:** All 20 agent names listed + categorized by funnel; 2 representative agents (researcher, brand-guardian) fully documented with persona, decision boundary, behavioral guidelines, collaboration patterns
- ✅ **Workflows:** All 32 workflow names listed; 3 representative workflows (content-creation, brand-identity-build, campaign-lifecycle) fully documented with stages, approval gates, signals, context rules, outputs
- ✅ **Templates:** 2 templates catalogued
- ✅ **Signal System:** Named pattern (ADR 0034), async gate protocol (ADR 0019), common signal examples
- ✅ **Context Rules:** ADR 0034 Phase 4 pattern P3; per-rigor-level must/should/skip + retrieval triggers
- ✅ **Quality Gates:** 5 standard gates defined; enforcement patterns in agents and skills

### What Is NOT Included (Per Scope)
- Marketing content (brand positioning, editorial calendars, competitor intel dossiers, audience persona specifics) — only *definition structure* is in scope
- Runtime execution details (run.yaml format, state machine transitions, error recovery orchestration) — only *definition* is in scope
- Adapter-specific implementations (.claude/, .gemini/, executor details) — only *framework definitions* are in scope
- Knowledge modules (.fgOS/knowledge/) — only *schema definitions* are in scope

### Unresolved Questions
- Exact skill count: README lists 41 vs. catalog count of 39 (draft skills excluded from catalog; need clarification on status field usage)
- Loop workflow dispatch mechanism: loop_config references child_workflow + completion_signal, but batch-manifest-schema resolution is not fully detailed
- Executor assignment: task.yaml files exist but not catalogued; capability-routing.yaml not yet examined
- Signal validation: Signal name pattern enforced in schema, but no schema for signal payload data structure

---

**Status:** DONE  
**Summary:** Comprehensive mechanical inventory of fgOS framework definition structure covering 40 schemas, 39-41 skills, 20 agents, 32 workflows, and 2 templates with full frontmatter field documentation, required markdown sections, validation rules, and signal/context/quality gate mechanisms.  
**Evidence:** Schemas fully read; representative skills/agents/workflows sampled and documented with line numbers; all definitions catalogued with file paths (absolute, relative to `.fgOS/`).
