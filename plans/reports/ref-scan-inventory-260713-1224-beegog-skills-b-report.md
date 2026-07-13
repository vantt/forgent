# Mechanical Inventory: Beegog Skills (bee-planning, bee-reviewing, bee-scribing, bee-swarming, bee-validating, bee-writing-skills, bee-xia)

**Scope:** `/home/vantt/projects/forgent/references/beegog` — 7 skill directories.  
**Date:** 2026-07-13  
**Format:** Markdown inventory, one section per skill. All files listed recursively; SKILL.md verbatim frontmatter; body sections summarized in 1-3 bullets; references/scripts noted with 1-2 bullets each.

---

## bee-planning

**Files inside skill directory:**
- `CREATION-LOG.md`
- `agents/openai.yaml`
- `references/edge-dimensions.md`
- `references/planning-reference.md`
- `SKILL.md` (123 lines)

**SKILL.md frontmatter (verbatim):**
```yaml
name: bee-planning
description: >-
  Research the work, pick the smallest honest mode, and shape an executable plan. Use when exploring has locked CONTEXT.md, or a clear-scope task needs a mode decision and work shape before validation.
metadata:
  version: '0.1'
  ecosystem: bee
  dependencies: []
```

**Body sections summary:**
- **Bootstrap & discovery (§1-2):** Reads CONTEXT.md, critical-patterns.md, active decisions, learnings grep, session scout; discovery levels L0–L3 with cost-scaled research depth; xia delegation for L2+.
- **Mode gate (§3) & synthesis (§4):** Mechanical risk-flag count determines lane (tiny/small/standard/high-risk/spike); produces one unified `plan.md` with approach (inline or standalone per fan-out table decision 0009).
- **Shape & prep (§5-6):** Writes single `plan.md` with frontmatter `artifact_readiness: requirements-only`; stops at Gate 2 for approval; only after approval, enriches in place to `implementation-ready` and creates cells batch-style via stdin.
- **Outputs/artifacts:** `docs/history/<feature>/plan.md` (required); optionally `discovery.md`, `approach.md` (earned by L2+ or high-risk); invoke bee-briefing for `implement-plan.md` (high-risk always; standard on-demand).
- **Hard gates:** CONTEXT.md is source of truth; no cells before Gate 2 approval; current-slice only; handoff to bee-validating (standard+) or bee-swarming (tiny/small merged gate).

**References inside:**
- `planning-reference.md` (40+ lines): Artifact fan-out decision table, approach.md template, plan.md template frontmatter, cell schema rules, test matrix guidance.
- `edge-dimensions.md` (30+ lines): 12 edge-case dimensions (user types, input extremes, timing, scale, errors, state, concurrency, compliance, external systems, platform variance, data corruption, upgrade paths) for test matrix depth.

---

## bee-reviewing

**Files inside skill directory:**
- `CREATION-LOG.md`
- `agents/openai.yaml`
- `references/reviewing-reference.md`
- `SKILL.md` (209 lines)

**SKILL.md frontmatter (verbatim):**
```yaml
name: bee-reviewing
description: >-
  Run the multi-agent review gate — severity findings, artifact verification, and user acceptance — over an immutable scope the user explicitly asked to review. Use only when the user requests an independent review: "review this", "review today's work", "review feature A and B", "review the diff from X to Y", "review everything unreviewed before release". A finished cell, slice, or feature is never a trigger by itself, and neither is "merge"/"ship"/"release" alone.
metadata:
  version: '0.1'
  ecosystem: bee
  dependencies:
    nodejs-runtime:
      kind: command
      command: node
      missing_effect: degraded
      reason: Reads bee records (cells, state, backlog, reviews) via the vendored .bee/bin helpers.
```

**Body sections summary:**
- **Trigger & scope (§1-2):** Explicit user intents only ("review this", "review A and B", etc.); never auto-triggered by finished work; resolves to one of five scope types; in-progress work excluded.
- **Scope freeze & preview (§2):** Builds scope JSON, creates session via `bee_reviews.mjs create --file`; preflight fails closed if behavior-change cells lack evidence (A10); preview shown before dispatch; session immutable.
- **Lane scaling (§2):** Single-change scope = 1 correctness reviewer; standard = 4 core; high-risk/any-hard-flag = full wave + conditionals, capped at 6; no auto-reduction by bypass or lane.
- **Specialist review (§1):** Dispatch 4 core reviewers (code-quality, architecture, security, test-coverage) in parallel with isolated diff+CONTEXT.md+plan.md; conditional reviewers (performance, api-contract, data-migration, reliability) spawn on diff-matched triggers.
- **Severity & synthesis (§2):** P1/P2/P3 scale; orchestrator synthesizes after all reviewers return; corroboration promotes severity; autofix_class routed; findings recorded to session.
- **Verification gates (§3-4):** Verification-evidence backstop (P1 if missing); frozen-judge flags on undeclared file changes; artifact EXISTS/SUBSTANTIVE/WIRED check.
- **Human UAT (§5) & delta re-review (§6):** Walk every SEE/CALL/RUN decision in CONTEXT.md; P1 fixes re-reviewed with defect-class sweep; Gate 4 presented only inside session, never auto-approved by bypass.
- **Handoff:** Record decision, close session (review closed, not feature); invoke bee-briefing for walkthrough.md per feature; if P1 fix settled new behavior, triggers bee-scribing.

**References inside:**
- `reviewing-reference.md` (50+ lines): Specialist isolation contract and focus lines, conditional-reviewer trigger table, finding schema, session-record checklist, UAT wording, Gate 4 approval block.

---

## bee-scribing

**Files inside skill directory:**
- `CREATION-LOG.md`
- `agents/openai.yaml`
- `references/scribing-reference.md`
- `SKILL.md` (156 lines)

**SKILL.md frontmatter (verbatim):**
```yaml
name: bee-scribing
description: >-
  Keep technology-agnostic BA specs of every area current, so a human understands the system without the code and an agent can rebuild it on another stack. SELF-TRIGGERING: invoke this yourself, unprompted, the moment any discussion-test-adjust loop settles a rule, behavior, or value — the user should never have to ask for knowledge to be recorded. Also use when execution completes (chain), when the user asks to document a screen/API/job/area, or when a legacy area has code but no spec.
metadata:
  version: '0.1'
  ecosystem: bee
  dependencies:
    nodejs-runtime:
      kind: command
      command: node
      missing_effect: degraded
      reason: Reads cell traces and logs decisions via the vendored .bee/bin helpers.
```

**Body sections summary:**
- **Modes (§1):** sync (chain default, merge deltas into specs after execution); capture (settle outcomes from discuss-build-test loop, high-risk merges immediately, others queue); flush (drain capture queue at wrap-up/warning/session-start); harvest (backfill spec for legacy area); bootstrap (skeleton system-overview.md/reading-map.md from mechanical facts).
- **Gather sources (§1):** Behavior-change cells + evidence, CONTEXT.md + decisions, worker reports/UAT records, code reading (harvest), user answers; never invent — unknown claims become Open Gaps.
- **Map deltas & merge (§2-3):** One area = one file forever; in-place update only (no -v2 variants); sections: Purpose → Entry Points & Triggers → Data Dictionary → Behaviors & Operations → Actors & Access → Business Rules → Edge Cases Settled → Open Gaps → Pointers (implementation); tech-agnostic outside Pointers; every Business Rule cited by D-ID.
- **Capture mode (§4):** Self-triggering — watch for settled outcomes (rules agreed, behaviors confirmed, values chosen), capture same turn; high-risk merges inline, others queue stubs; flush points: wrap-up, PreCompact warning, session-start offer.
- **Harvest & rebuild self-check (§5-6):** Backfill from code + running behavior, answer Socratic questions, unanswered → Open Gaps; rebuild test: could stranger rebuild this on another stack with Pointers hidden?
- **Reading map & state (§7-8):** Refresh `docs/specs/reading-map.md` for created/repurposed/removed locations; record run via `bee_state.mjs scribing-run --feature <feature> --areas "<a,b>" --next-action "..."` (clears scribing debt).
- **Handoff:** Invoke bee-compounding skill.

**References inside:**
- `scribing-reference.md` (50+ lines): Area shapes (UI, backend, job, API, process), area spec template frontmatter, per-section rules (entry points, data dict, behaviors, actors, rules, edge cases, open gaps), field-dictionary and visibility-matrix formats, harvest interview protocol, bootstrap rules/skeleton shapes, rebuild checklist, product backlog schema.

---

## bee-swarming

**Files inside skill directory:**
- `CREATION-LOG.md`
- `agents/openai.yaml`
- `references/swarming-reference.md`
- `SKILL.md` (118 lines)

**SKILL.md frontmatter (verbatim):**
```yaml
name: bee-swarming
description: >-
  Orchestrate bounded workers over validated cells without implementing anything directly. Use when validating approves execution (Gate 3) and current-slice cells are open and validated.
metadata:
  version: '0.1'
  ecosystem: bee
  dependencies:
    nodejs-runtime:
      kind: command
      command: node
      missing_effect: unavailable
      reason: Orchestration reads cells and sweeps reservations through the vendored .bee/bin helpers.
```

**Body sections summary:**
- **Solo execution (tiny/small):** No workers spawned; orchestrator implements cells in-session keeping discipline intact (claim, read_first, implement within files, verify, record evidence, cap); frozen-judge check runs before capping; then done-report (diff + fresh verify + capture line) and invoke bee-scribing.
- **Preconditions:** Gate 3 approved (check state.json); sweep stale reservations; read critical-patterns.md when present.
- **Operating contract (§1-8):** Wave analysis (ready cells + deps walk, parallel if no shared files); assign one cell per worker (never self-select or multi-cell); spawn with isolation contract (cell id, CONTEXT.md/plan.md paths, global constraints, reservation identity, status tokens — no session history); judge model tier at dispatch (extraction/generation/ceiling); record workers in state before dispatch; tend results (collect status, update cells, verify reservations released); goal-check every [DONE] (re-run verify, frozen-judge, inspect Advisor consults as advice-not-evidence); wave clean when all capped/goal-checked/judge-intact.
- **Rescue ladder:** More context → stronger tier → escalate to user; 2-consult cap per claim; ceiling is session model.
- **Completion:** Current slice executed + more work remains → return to bee-planning; final slice → tell user completion and invoke bee-scribing.
- **Hard rules:** Never implement cells in standard/high-risk; never spawn before Gate 3; never let workers self-select; fix reservations (never "be careful"); no session history in dispatch; silence ≠ failure.
- **Handoff:** Swarm execution complete for final slice. Invoke bee-scribing skill.

**References inside:**
- `swarming-reference.md` (50+ lines): Runtime spawn mechanics (Agent tool vs Codex), model tiers (extraction/generation/review/ceiling, config-driven), per-agent reasoning effort, external executors (cli-shaped), resolveAdvisor/Advisor line contract, worker prompt template, result formats, red flags.

---

## bee-validating

**Files inside skill directory:**
- `CREATION-LOG.md`
- `agents/openai.yaml`
- `references/validation-reference.md`
- `SKILL.md` (111 lines)

**SKILL.md frontmatter (verbatim):**
```yaml
name: bee-validating
description: >-
  Prove the plan against repo reality with concrete evidence before any code is written. Use when planning has an approved work shape that needs feasibility validation before swarming, or when a plan smells like plausibility instead of proof.
metadata:
  version: '0.1'
  ecosystem: bee
  dependencies:
    nodejs-runtime:
      kind: command
      command: node
      missing_effect: unavailable
      reason: Validation reads state and cells through the vendored .bee/bin helpers.
```

**Body sections summary:**
- **Lane scaling:** tiny/small: inline reality check inside bee-planning (not separately invoked); standard+: full protocol below (plan-checker + cell reviewer); spike: one proof question only.
- **Required inputs:** CONTEXT.md, approved plan.md (enriched to `implementation-ready`), discovery/approach (files or plan.md sections), current-work cells; missing → return to bee-planning.
- **Operating contract (§1-6):** Orient on state/mode/cells (delegates as extraction); reality gate (MODE FIT/REPO FIT/ASSUMPTIONS/SMALLER PATH/PROOF SURFACE, each scored PASS|FAIL with evidence); feasibility matrix for blocking assumptions; spikes for unproven assumptions; plan-checker subagent (adversarial, max 3 iterations); cold-pickup cell review (fix CRITICAL flags); decide using vocabulary (READY / READY WITH CONSTRAINTS / NOT READY - RUN SPIKE / NOT READY - RETURN TO PLANNING).
- **Accepted evidence:** Existing implementation, file/API/type inspection, command output, build/typecheck/test result, official version/doc proof, runtime probe, `.bee/spikes/<feature>/` result; plausibility language → NOT READY.
- **Plan-checker:** Dispatched on review slot (background where possible), assumes plan flawed, verifies 5 dimensions (coverage, completeness, dependencies, links, scope); max 3 iterations; high-risk scales to persona panel.
- **Cell review:** Dispatch cell reviewer on review slot; CRITICAL flags must be fixed; MINOR may ship with recorded note.
- **Gate 3:** Write full machine report to `docs/history/<feature>/reports/validation-<slice>.md`; invoke bee-briefing to refresh implement plan; present human layer per contract (jargon-free, implement plan + report linked); ask verbatim approval; update state and hand off to bee-swarming. Gate bypass applies to tiny/small/standard without hard-gate flags only; high-risk and hard-gate work always presented to human.
- **Handoff:** Validation complete and Gate 3 approved. Invoke bee-swarming skill.

**References inside:**
- `validation-reference.md` (50+ lines): Protocol checklist, reality-gate report template, feasibility-matrix template, spike/probe rules, plan-checker iteration limit, cell-review cold-pickup criteria, decision vocabulary, Gate 3 approval block wording, bypass conditions.

---

## bee-writing-skills

**Files inside skill directory:**
- `CREATION-LOG.md`
- `agents/openai.yaml`
- `references/creation-log-template.md`
- `references/pressure-test-template.md`
- `scripts/render_openai_metadata.mjs`
- `scripts/test_openai_metadata.mjs`
- `SKILL.md` (159 lines)

**SKILL.md frontmatter (verbatim):**
```yaml
name: bee-writing-skills
description: >-
  Build and pressure-test bee skills with the TDD-for-skills discipline. Use when creating a new bee skill, editing an existing one, or verifying a skill holds up under pressure. Do NOT use for project-specific AGENTS.md conventions or one-off instructions.
metadata:
  version: '0.1'
  ecosystem: bee
  dependencies: []
```

**Body sections summary:**
- **The Iron Law:** No skill without failing test first; applies to edits; no exceptions.
- **RED phase (§1):** Define purpose; create 3–5 pressure scenarios (≥3 pressures each); run WITHOUT skill; document violations and rationalizations verbatim; identify patterns.
- **GREEN phase (§2):** Write minimal SKILL.md addressing only documented rationalizations; YAML checklist (frontmatter format, name, description as trigger-only, metadata, body <200 lines, commands matched verbatim, Headless section, Red Flags, handoff sentence); persuasion principles applied (Authority, Commitment, Scarcity, Social Proof, Unity).
- **REFACTOR phase (§3):** Capture new rationalizations, add explicit negation to rule, add rationalization table entry, add red flags list entry, re-run ALL scenarios.
- **VALIDATE & DOCUMENT (§4):** Manual checks (frontmatter parses line 1, name=directory, trigger-only description, version/ecosystem/dependencies match, body <200 lines, references resolve, quoted .bee/bin commands match verbatim); create CREATION-LOG.md.
- **Rationalization table:** Common excuses and reality (knowledge ≠ testing agents, simple ≠ no bugs, academic ≠ pressure, description ≠ workflow, edits ≠ exempt, production ≠ testing ground, obvious ≠ agent-failure patterns).
- **Handoff:** Skill pressure-tested, validated, logged. Invoke bee-hive skill.

**References inside:**
- `pressure-test-template.md` (40+ lines): Standard test setup framing, 7 pressure types (Time, Sunk Cost, Authority, Economic, Exhaustion, Social, Ambiguity) with triggers, why each works, pressure combinations by scenario type, meta-test technique.
- `creation-log-template.md`: Documents TDD process: source material, extraction decisions, scenarios run/results, rationalizations found/fixes, iterations required.

**Scripts:**
- `render_openai_metadata.mjs`: Builds OpenAI agent metadata from SKILL.md frontmatter + body (name, description, schema generation).
- `test_openai_metadata.mjs`: Validates metadata against schema (linting, compliance checks).

---

## bee-xia

**Files inside skill directory:**
- `CREATION-LOG.md`
- `agents/openai.yaml`
- `references/research-brief-template.md`
- `references/xia-protocol.md`
- `SKILL.md` (100 lines)

**SKILL.md frontmatter (verbatim):**
```yaml
name: bee-xia
description: >-
  Evidence-labeled research scout for unfamiliar, ambiguous, or version-sensitive territory. Use when the user asks to research a topic, library, or approach with no feature underway; when planning discovery lands on L2/L3; or before high-risk work where the repo has no precedent. Not for locking product decisions, proving feasibility, or writing code.
metadata:
  version: '0.1'
  ecosystem: bee
  dependencies:
    web-docs-search:
      kind: capability
      missing_effect: degraded
      reason: Checks current official documentation version-aware (Exa or WebSearch/WebFetch/browser); absent, docs claims degrade to Inference and become proof obligations for validating.
    upstream-pattern-research:
      kind: capability
      missing_effect: degraded
      reason: Inspects public repositories for proven patterns (DeepWiki or direct repo reading); absent, the upstream step degrades to direct public-repo reading, never silently skipped.
```

**Body sections summary:**
- **Depth modes:** Quick (one API/version confirmed), Standard (default, full flow), Deep (cross-cutting, version-sensitive, architecture-heavy).
- **Flow — order is protocol (§1-4):** (1) Stack ledger — classify repo from manifests/lockfiles/config/tests, never guessed; (2) Local reuse — feature-adjacent code/tests/scripts/config/docs, answer what exists/reusable/extensible/missing; (3) Upstream patterns — framework/library/starters/integrations, reusable proof; (4) Current official docs — version-matched, local behavior beats docs on disagreement.
- **Evidence labels:** Local (proven from repo files/output), Upstream (public repo/starter), Docs (official version-matched), Inference (concluded, not observed).
- **Recommendation ladder (rung selection):** (1) Reuse local, (2) Built-in at installed version, (3) Adapt upstream pattern, (4) Build; each skipped rung needs stated reason; state why chosen beats next-best and what evidence changes it.
- **Output modes:** In-chain (no separate file, findings merge into feature's approach.md with ladder rationale/risk-map evidence labels); Standalone (write `docs/history/research/<topic-slug>.md` from template, lead with Bottom Line, suggest next step).
- **Hard gates:** Research only (no source edits/cells/architecture commitments); locked D-IDs win (findings noted with evidence, never silently supersede); finish brief before recommending; xia is already delegated researcher (may sub-delegate extraction-tier I/O); other dispatch defaults to generation slot + ceiling marker if needed.
- **Headless:** Run all four steps, defer ambiguities to Outstanding Questions, make recommendations (labeled with confidence), never self-defer.
- **Handoff:** In-chain: return to bee-planning. Standalone: suggest bee-exploring or bee-planning; user chooses.

**References inside:**
- `xia-protocol.md` (50+ lines): Detailed step rules (stack ledger artifacts, local reuse checklist, upstream repo priorities, docs version-matching), tool roles (code-graph/grep/capability degradation), ask-when-it-matters criteria, evidence-label application, ladder skip logic.
- `research-brief-template.md` (40+ lines): Standalone brief structure frontmatter (artifact_contract, topic, depth, date), Bottom Line section (recommendation rung, why chosen/rejected, confidence, next step), Repo Snapshot (type/languages/frameworks/services), Question & Assumptions, Findings (Local/Upstream/Docs/Inference sections with labels), risk/migration caveats.

---

## Cross-Skill Observations

**Common patterns:**
- All 7 skills reference `.bee/bin` helpers (Node runtime dependency, except bee-planning and bee-writing-skills which are dependency-free).
- Every SKILL.md has: YAML frontmatter (name, description as trigger-only, metadata.version '0.1', metadata.ecosystem 'bee', dependencies mapping), body <200 lines (except bee-reviewing 209 lines), Headless section, Red Flags list, hard gates marked, handoff sentence to next skill.
- Every skill owns exactly one level of `references/` files (templates, protocols, schemas, checklists).
- Artifacts written to `docs/history/<feature>/` or `docs/specs/` (state layer for scribing); reports to `docs/history/<feature>/reports/`.
- Gate contracts enforced per skill: Gate 2 (bee-planning), Gate 3 (bee-validating), Gate 4 (bee-reviewing, only inside session).
- Delegation contract (D2/D3) consistently routes extraction/generation tiers to subagents; ceiling (session model) kept scarce.

---

## Files Read (by scope)

All 7 SKILL.md files read in full. Reference files sampled (first 30–50 lines each; full depth available on request). CREATION-LOG.md and agents/openai.yaml files exist but not detailed (metadata/archive shape). Scripts validated for existence and briefly characterized.

---

## Unresolved Questions

None at mechanical-inventory scope. All 7 skills present, files listed, frontmatter verbatim, body sections summarized, references characterized. Complete coverage achieved.

---

**Status:** DONE  
**Report written to:** `/home/vantt/projects/forgent/plans/reports/ref-scan-inventory-260713-1224-beegog-skills-b-report.md`
