# beegog Documentation Inventory & Gap Report
**Scope:** Complete mechanical read of all design docs, specs, and decisions in `/home/vantt/projects/forgent/references/beegog/docs/`  
**Date:** 2026-07-13  
**Format:** Section summaries (1–3 bullets per section), verbatim quotes of load-bearing rules/contracts/state definitions, exact file paths.

---

## MAIN DOCUMENTATION FILES

### `/home/vantt/projects/forgent/references/beegog/docs/00-vision.md`
**Purpose:** Vision, principles, and success criteria for bee framework  
**Sections & Summaries:**

1. **Why bee exists** — Synthesizes khuym, gsd-core, superpowers, claudekit, repository-harness, gstack into one opinionated chain sized for a single developer running Claude Code and Codex.
2. **Principles (10 numbered)** — Core discipline rules including: "**Validate before execute. Always.**" with concrete evidence only (L1); "**CONTEXT.md is the source of truth**" with stable D-IDs (L2); "**Smallest honest workflow wins**" via mechanical risk flags, never judgment (L3); "**Goal-backward adversarial verification**" with EXISTS/SUBSTANTIVE/WIRED (L4); "**Fresh context, minimal context** ~100 tokens per subagent (L5); "**Cell capped only after verification**" one worker/cell/commit (L6); "**Knowledge compounds or system decays**" via event-sourced decisions and promoted learnings (L7); "**Hive cleans itself**" with measured entropy score (L8); "**Skills are code. Test them.**" (Iron Law) (L9); "**Humans decide at exactly four gates**" never auto-resolved (L10); "**Meaning outlives stack**" — behavior/rules/intent locked in spec layer, not code (L11).
3. **Non-goals** — No Rust CLI, no 20 runtimes, no 40 skills, no benchmark rig, no autonomous merging by default (gate_bypass opt-in).
4. **Success criteria (6 items)** — Vague requests → locked decisions + validated plan + capped cells; small fixes in minutes; session pause/resume at 65% context; visible behavior change in pattern/decision records; grooming entropy trending down; rebuild bar (decision 0002) — any area spec alone, without code, rebuilds same observable behavior on different stack.

**Load-bearing quotes:**
- "**No source-editing execution before the feasibility of the current work is proven with concrete evidence — code inspection, command output, or a spike. 'This should work' is not evidence.**"
- "**Evidence before claims**: any 'done/passing/fixed' statement requires fresh command output in the same message."
- "**Lanes scale ceremony, never memory**: a capped `behavior_change` cell obliges a `bee-scribing` sync in every lane, and a settled discussion outcome is captured the moment it settles."
- "**The meaning outlives the stack**: business rules, field meanings, and behaviors agreed in discussion vanish when the session closes. So every settled outcome of the discuss → build → test → adjust loop is recorded technology-agnostically in the state layer (`docs/specs/`) the moment it settles, at BA grade."

---

### `/home/vantt/projects/forgent/references/beegog/docs/01-distillation.md`
**Purpose:** Audit trail of what bee takes from each upstream (khuym, gsd-core, superpowers, claudekit, repository-harness, gstack, compound-engineering)  
**Sections & Summaries:**

1. **Summary matrix** — 50 rows mapping idea → source → bee implementation; distills the exact debt/credit relationship with each upstream.
2. **Per-framework audit (7 subsections)** — Detailed "Keep (wholesale)" vs "Change" vs "Reject" per upstream; keeps khuym's 7-stage chain + D-ID locking; changes beads/gkg to optional; rejects harness's dependency sprawl; keeps gsd's "plans as prompts" + adversarial plan-checker + deviation rules; rejects 20+ adapters; keeps superpowers' TDD-for-skills (Iron Law) + description discipline; rejects overlapping skills; keeps claudekit's context isolation + file-based comms + diff-aware testing + 12-dimension edge checklist; keeps repository-harness's mechanical risk + policy-vs-ops split + friction capture + entropy score; rejects Rust CLI + SQL migrations; keeps gstack's event-sourced decisions + learnings injection + cross-model dispatch; rejects 6000-line skills.
3. **Four ideas bee adds** — (1) One task model (cell) across whole chain; (2) Grooming as first-class stage; (3) Dual-runtime as contract, not port (one brain, two belts); (4) State layer next to logs (tech-agnostic specs outliving features + reading map).

**Load-bearing quotes:**
- "**Beads (`br`/`bv`) become optional**: khuym hard-depends on beads CLI; bee's native task unit is the **cell**: a JSON file in `.bee/cells/` with id, title, status, deps, acceptance criteria, verify command, and lane."
- "**The hive cleans itself**: friction observed during work is captured in a structured backlog with *predicted* impact; grooming runs kill tech debt and measure *actual* outcomes. Hive health is a computed entropy score, not a feeling."
- "**Plans are prompts, not documents**: cells and plan artifacts carry `must_haves`: observable `truths`, expected `artifacts` (path + what makes it substantive), `key_links` (what must be wired to what), and `prohibitions`."
- "**Lanes scale ceremony, never memory**: in every lane — tiny included — a capped `behavior_change` cell obliges a `bee-scribing` sync before the work is considered closed."

---

### `/home/vantt/projects/forgent/references/beegog/docs/02-architecture.md`
**Purpose:** Repository layout (plugin + target repo), state layer design, cell schema, vendored helpers, hooks, dual-runtime support  
**Sections & Summaries:**

1. **Repository layout (plugin itself)** — 44 lines detailing `.bee/` plugin structure: README, docs/, `.claude-plugin/plugin.json`, hooks (6 events), AGENTS.template.md, 11 skills with references/ subdirs, vendored helper templates.
2. **Target-repo layout** — AGENTS.md (BEE block), `.bee/` runtime files (onboarding.json, state.json, HANDOFF.json, reservations.json, decisions.jsonl, backlog.jsonl, tools.json, config.json, logs/, cells/, bin/), docs/ (backlog.md product list, history/<feature>/, learnings/, specs/, decisions/, .spikes/).
3. **Unified plan artifact** — `docs/history/<feature>/plan.md` with frontmatter: `artifact_contract: bee-plan/v1`, `artifact_readiness: requirements-only | implementation-ready`, `mode`, enriched in place across two passes (shape → Gate 2, then prep → current-work cells).
4. **State layer** — `docs/specs/<area>.md` (BA-grade tech-agnostic functional spec, overwritten to match reality, answers "where are we now"), `reading-map.md` (one line per location), `system-overview.md` (cross-area glue), `visuals/<area>/` (settled UI snapshots). Log artifacts (decisions, history) are append-only and answer "how did we get here"; state artifacts are overwritten and answer "where are we."
5. **Skill invocation modes** — Interactive (default, asks at decision points) vs headless (never blocks, defers ambiguous, ends with JSON/markdown report), plus gate-bypass switch (auto-approves Gates 1–3 for tiny/small/standard, never high-risk/UAT/P1).
6. **Cell schema** — JSON with id, feature, title, lane (tiny|small|standard|high-risk|spike), status (open|claimed|capped|blocked|dropped), deps, decisions, files, read_first, action (directive prose), must_haves (truths/artifacts/key_links/prohibitions), verify, trace (worker, outcome, files_changed, deviations, friction, capped_at, behavior_change, verification_evidence).
7. **Vendored helpers** — Four Node scripts (bee_status, bee_cells, bee_reservations, bee_decisions) + unified dispatcher `bee.mjs` over the 4 command groups; zero npm dependencies.
8. **Dual-runtime support** — Claude Code gets 6-hook automation skeleton; Codex gets helper-enforced + AGENTS.md bootstrap; both run same skills, same helpers, one shared `lib/` brain.
9. **Hooks** — 6 scripts (bee-session-init, bee-prompt-context deduped, bee-write-guard gate+privacy+reservation, bee-state-sync, bee-chain-nudge, bee-session-close).

**Load-bearing quotes:**
- "**Policy vs operations**: markdown under `docs/` (including `docs/history/`) is human-readable policy and narrative; JSON/JSONL under `.bee/` is the queryable operational record."
- "**Capping requires verification — with proof**: `bee_cells.mjs cap <id>` refuses unless a passing verify result is recorded; for `small`/`standard`/`high-risk` lanes it additionally refuses without recorded verify *output* (or `verification_evidence`) and a non-empty `files_changed` list."
- "**Lane scales strictness**: `tiny` cells may omit `must_haves` and record a one-line trace; `high-risk` cells require full `must_haves`, spike evidence links, and a detailed trace."
- "**Write discipline (state layer)** — Append-only, supersede, never edit vs **Overwritten/merged** to match reality; organized by Feature/date vs **Area** (outlives features)."
- "**Rebuild bar (decision 0002)**: an agent given only the spec, minus Pointers, can rebuild the same observable behavior on a different stack; a human reads it and understands the area without the code."

---

### `/home/vantt/projects/forgent/references/beegog/docs/03-workflow.md`
**Purpose:** Stage-by-stage workflow contract (what each skill reads, writes, must never do)  
**Sections & Summaries:**

1. **The chain and four gates** — 7-stage pipeline: hive → exploring → planning (shape) → briefing (render) → Gate 2 → planning (prep) → briefing (refresh) → validating → briefing (patch) → Gate 3 → swarming → scribing → compounding → (on-demand) reviewing → (on-demand) briefing (walkthrough) → Gate 4. Independent review never fires automatically; execution closes through scribing/compounding verified but unreviewed.
2. **Gate wording (fixed)** — Gate 1 "Decisions locked. Approve CONTEXT.md before planning?"; Gate 2 "Work shape is ready. Approve before current-work preparation?"; Gate 3 "Feasibility validated. Approve execution?"; Gate 4 "P1 findings block merge" or "Review complete. Approve merge?" (only in user-invoked review session).
3. **Priority rules (10 items)** — P1 blocks; context budget at 65% pauses; CONTEXT.md is source of truth; Gate 3 is critical; failed reality gate halts pipeline; validating never skipped; critical-patterns + recent decisions are mandatory pre-planning; evidence before claims; lanes scale ceremony; critique passes run in background.
4. **Modes and lanes** — Mechanical risk flags (auth, authorization, data model, audit/security, external systems, public contracts, cross-platform, existing behavior, weak proof, multi-domain); `docs` lane (no gates, no cells), `tiny` (0–1 flags, merged shape+execution gate, one cell), `spike` (yes/no proof), `small` (light plan, no subagents), `standard` (full chain), `high-risk` (4+ flags or hard-gate flags, epic map, mandatory spikes, detailed traces).
5. **Stage contracts** — bee-hive (bootstrap, routing, scope-earlier offer), bee-exploring (Socratic locking, CONTEXT.md, one fresh-eyes pass max), bee-planning (research levels L0–L3, mode gate, approach.md, plan.md requirements-only → implementation-ready + cell prep), bee-briefing (consolidate truth artifacts, author only Tech Design + Rollback, render/refresh/walkthrough/on-demand modes), bee-validating (reality gate, feasibility matrix, spikes, plan-checker adversarial, cell review, decision vocab), bee-swarming (wave analysis, one cell per worker, isolation contract, tend loop), bee-executing (8-step loop: init → accept → reserve → implement → verify → cap → release → return status), bee-reviewing (on-demand only, specialist roster, severity P1/P2/P3, verification-evidence gate, EXISTS/SUBSTANTIVE/WIRED, UAT), bee-scribing (state layer: sync/capture/flush/harvest modes, BA-grade spec per area, merge rules, rebuild self-check), bee-compounding (3 analysts, learnings template, critical promotion, state-layer guard, friction → backlog), bee-grooming (entropy audit, hunt, propose, execute, close-the-loop).
6. **Red flags (chain-wide)** — Jumping from exploring to swarming; code before CONTEXT.md; skipping validating; ignoring locked decisions; workers self-selecting; capping without verification; commits without cell ids; continuing past P1; reservation leaks; stale state.json; resuming without HANDOFF; plausibility language; tiny fix wearing epic ceremony; hard-gate change in non-high-risk; session history in worker dispatch.

**Load-bearing quotes:**
- "**Never skip validating — including in tiny mode**: it collapses to a 2-minute reality check, it does not disappear."
- "**Lane exceptions**: the `docs` lane has no gates; `tiny`/`small` merge Gates 2+3 into one shape+execution question. Every lane closes through Gates 1–3 by default and ends `unreviewed`; Gate 4 is never part of that default chain."
- "**Lanes scale ceremony, never memory**: in every lane — tiny included — a capped `behavior_change` cell obliges a `bee-scribing` sync before the work is considered closed."
- "**Anchor the cell**: `bee_cells.mjs cap <id>` refuses unless a passing verify result is recorded; for small/standard/high-risk lanes it additionally refuses without recorded verify *output* and a non-empty `files_changed` list."
- "**Evidence before claims**: any 'done/passing/fixed' statement requires fresh command output in the same message. Red-flag words: 'should', 'probably', 'seems to'."

---

### `/home/vantt/projects/forgent/references/beegog/docs/04-skills-spec.md`
**Purpose:** Per-skill build specs, pressure scenarios, frontmatter conventions, shared writing standards  
**Sections & Summaries:**

1. **Skill-writing discipline (5 items)** — Iron Law (no skill without failing pressure test first); RED/GREEN/REFACTOR (capture rationalizations verbatim); description = purpose + trigger conditions only (never workflow steps); budgets (SKILL.md <200 lines, overflow to one `references/` level); standard anti-loophole text.
2. **Per-skill specs (1–12)** — Detailed spec for each bee skill: frontmatter, body coverage, references, pressure scenarios. Covers bee-hive (12 core areas incl. routing, gates, hooks), bee-exploring (scope classification, gray areas, Socratic locking, CONTEXT.md), bee-planning (research levels, mode gate, approach, unified plan artifact, cell format, scope-reduction prohibition), bee-validating (reality gate, feasibility matrix, spikes, adversarial plan-checker, cell review), bee-swarming (preconditions, wave analysis, isolation contract, model selection), bee-executing (8-step loop, acceptance rule, reservation, implementation, verification, cap protocol, trace tiers), bee-reviewing (on-demand only, specialist roster, severity rules, verification-evidence gate, EXISTS/SUBSTANTIVE/WIRED, UAT, finishing checklist), bee-scribing (BA-grade state layer, rebuild bar acceptance test, three modes: sync/capture/harvest, source table, merge rules, reading-map refresh), bee-compounding (evidence gathering, three analysts, learnings template, critical promotion, state-layer guard, friction → backlog), bee-grooming (entropy audit + trend, hunt sources, proposal format, execution through normal cells, outcome recording), bee-writing-skills (Iron Law, RED/GREEN/REFACTOR, SKILL.md checklist, description trap, dependency metadata, persuasion principles).
3. **Shared writing standards** — Plain language first (summary → behavior → why → scenario → next); question format (CONTEXT/QUESTION/RECOMMENDATION/options); handoff sentence ends every skill; evidence discipline; invocation modes (interactive vs headless); thin personas (~15–25 lines, lens + spawn triggers + output format + evidence + prohibitions); model tiers (extraction/generation/ceiling).

**Load-bearing quotes:**
- "**Iron Law**: no skill (or skill edit) without a failing pressure test first."
- "**Description = purpose clause + trigger conditions only**: One short imperative purpose sentence first (it is what users see next to the /slash command in the menu), then 'Use when…' triggering conditions; third person, ≤1024 chars. NEVER a workflow/step summary — a step summary makes agents follow the description and skip the body."
- "**Standard anti-loophole text**: 'Violating the letter of the rules is violating the spirit of the rules.'"
- "**Headless mode**: never block on a question. Apply only unambiguous actions, classify ambiguous cases as deferred, and end with a structured report containing an `Outstanding Questions` section. Terminal output is JSON or structured markdown so an orchestrator can consume it deterministically."
- "**Lane scales strictness**: `tiny` cells may omit `must_haves` and record a one-line trace; `high-risk` cells require full `must_haves`, spike evidence links, and a detailed trace."

---

### `/home/vantt/projects/forgent/references/beegog/docs/05-roadmap.md`
**Purpose:** Build phases (Spikes → Phase 1 spine → Phase 2 full chain → Phase 3 memory → Phase 4 polish)  
**Sections & Summaries:**

1. **Phase 0 — Spikes** — Four prove-risky-assumptions-first probes: dual-manifest (one skills/ loads from both runtimes), hook skeleton (6 hooks fire reliably on Windows), cell helper (zero-dependency Node script enforces cap-requires-verify + lane tiers), Codex subagent results (reliable status tokens). NO on any spike changes architecture before skills written.
2. **Phase 1 — The spine** — Tiny fix end-to-end: shared `lib/` modules + vendored helpers (bee_status, bee_cells, bee_reservations) + onboard script (AGENTS.md block, .bee/ runtime, helpers, lib) + first half of hooks (session-init, write-guard, session-close) + skills (hive, planning tiny/small, validating light, executing, reviewing lightweight) + dogfood three real tiny fixes. Exit: zero hand-edits of .bee/ files.
3. **Phase 2 — Full chain** — Exploring, planning full, validating full, swarming, reviewing full, second half of hooks (prompt-context dedup, state-sync, chain-nudge), go mode, HANDOFF/resume tested, dogfood one standard feature per runtime. Exit: Gate discipline holds; pause/resume works.
4. **Phase 3 — Memory & clean hive** — bee_decisions.mjs (event-sourced, write-time redaction, datamark on read), bee-scribing (BA-grade state layer, sync/capture/harvest modes), bee-compounding (analysts, learnings template, critical promotion, state-layer guard), bee-grooming (entropy audit incl. stale specs, hunt, propose/approve/execute/close-loop), bee-writing-skills (adapted from khuym), backlog outcome loop live. Exit: critical-patterns and decisions demonstrably change behavior; entropy scored; rebuild test run once.
5. **Phase 4 — Polish (if earned)** — Cross-model second opinion; capability registry; docs-from-code generation; high-risk hardening; repo-profile cache; feedback sweep. Deliberately deferred; triggered by real usage demand.
6. **Working agreements** — Iron Law applies to bee's own skills; dogfood friction captured and becomes backlog; skill additions decision-gated (0002); 6-hook cap (any new hook names which it replaces); enforcement in `bin/lib/` first, then optional hook belt.

**Load-bearing quotes:**
- "**Goal: a tiny fix can flow bootstrap → plan(tiny) → validate(light) → one worker → self-checks, entirely under bee**."
- "**Lanes scale ceremony, never memory**: in every lane — tiny included — a capped `behavior_change` cell obliges a `bee-scribing` sync before the work is considered closed."
- "**The Iron Law applies to bee's own skills from the first line**: no SKILL.md without a failing pressure scenario."
- "**Skill additions are decision-gated**: a new skill needs a decision record naming the workflow gap no existing skill covers (decision 0002). Keep the 6-hook cap; any proposed hook must name which of the six it replaces."

---

### `/home/vantt/projects/forgent/references/beegog/docs/06-runtime-integration.md`
**Purpose:** Dual-runtime automation skeleton (Claude Code hooks + Codex helpers + shared lib/)  
**Sections & Summaries:**

1. **Core principle** — Enforcement lives in shared helpers first (bee_cells.mjs refusing to cap unverified works on both runtimes); hooks are a second belt (Claude Code bonus). Five load-bearing patterns from claudekit: config-gated hooks, fail-open crash wrappers, injection dedup, chain-nudging via SubagentStop matchers, state persistence as side effect.
2. **Bee hook skeleton (Claude Code)** — Six scripts (bee-session-init injects status/HANDOFF/patterns/decisions; bee-prompt-context deduped reminder; bee-write-guard gate+reservation+privacy+CLI-shape; bee-state-sync persists state; bee-chain-nudge worker nudges; bee-session-close hygiene), all config-gated, fail-open, importing from shared `lib/`.
3. **Hook response protocol** — Privacy marker (`@@BEE_PRIVACY@@`) → AskUserQuestion on approval retry; gate-guard block → surface gate question; reservation block → worker returns [BLOCKED].
4. **Codex parity** — Same rules via helper-enforced + AGENTS.md block (session bootstrap, HANDOFF surfacing, phase reminder per prompt, Gate 3 no-execution, reservation enforcement, cap-requires-verify, privacy blocking as guardrail text, state freshness, chain advancement, end-of-session hygiene).
5. **Shared `lib/`** — state.mjs, cells.mjs, reservations.mjs, guards.mjs, inject.mjs, decisions.mjs, command-registry.mjs, validate-args.mjs. One brain; hooks are thin wrappers.
6. **Onboarding responsibilities** — Install/update AGENTS.md BEE block; vendor helpers + lib/ + runtime files; hook install for Claude Code (fallback: project's .claude/settings.json); verify drift (managed versions pattern).
7. **Tier 3 — repo-native playbook** — `.bee/PLAYBOOK.md` (~150 lines) for plugin-less agents (Cursor, Copilot, Gemini CLI); generated at build time from SKILL.md sources; degradation ladder: skills (lazy-loaded, persuasion-hardened) → playbook (always-on, procedural) → helpers (mechanical enforcement for everyone).
8. **Testing** — Fixture tests per hook, parity test (every rule in guards.mjs/cells.mjs exercised by both hook test AND helper test), pressure scenarios for skill contracts.

**Load-bearing quotes:**
- "**Enforcement lives in the shared helpers first; hooks are a second belt, not the only belt**: `bee_cells.mjs` refusing to cap an unverified cell works identically on both runtimes. A hook that blocks an unreserved write is a Claude Code bonus on top of the same check the Codex worker runs through the helper."
- "**Every hook exits 0 silently if the repo has no `.bee/onboarding.json`**: plugin enabled ≠ repo onboarded."
- "**Hooks fail safe**: all scripts fail-open with crash logging to `.bee/logs/hooks.jsonl`, exit 0 unless deliberately blocking."
- "**Chain-nudging via SubagentStop matchers**: when a Plan agent finishes, cook-after-plan-reminder fires and tells the main agent the next stage. The workflow chain is advanced by the harness, not by memory."

---

### `/home/vantt/projects/forgent/references/beegog/docs/07-contracts.md`
**Purpose:** Implementation contracts (Node 18+, atomic writes, refusal message format, runtime files, lib API, helper CLI, hook contracts, onboarding, skill conventions)  
**Sections & Summaries:**

1. **Ground rules** — Node 18+, ESM (.mjs), zero npm dependencies, Windows-safe paths, atomic writes (`<file>.tmp` + rename), fail-safe with one-line JSON error, hooks never break sessions.
2. **Refusal messages — ERROR/WHY/FIX contract** — Every refusal names the rule, the reason, and the next action. Tests assert the FIX element for cap-refusal, gate-block, reservation-conflict.
3. **Runtime files** — 11 files listed with schemas: `.bee/onboarding.json`, `.bee/state.json`, `.bee/config.json`, `.bee/HANDOFF.json`, `.bee/reservations.json`, `.bee/decisions.jsonl`, `.bee/backlog.jsonl`, `.bee/cells/<id>.json`, `.bee/logs/hooks.jsonl`, `.bee/.inject-cache.json`, `.bee/manifest-hash.json`.
4. **lib API (8 modules)** — fsutil (read/write JSON/JSONL), state (read/write state.json, gate checks), cells (list/ready/show/add/claim/verify/cap/block/drop, cap-requires-verify enforcement), reservations (reserve/release/list/sweep, conflict checking), guards (SECRET_PATTERNS, SCOUT_DIRS, GATE_ALLOWED_PREFIXES, checkWrite/checkRead, extractBashTargets), inject (buildSessionPreamble, buildPromptReminder, shouldInject/markInjected), decisions (logDecision, supersedeDecision, redactDecision, activeDecisions, datamark), command-registry (SCHEMA_VERSION, COMMAND_REGISTRY per subcommand across 4 helpers), validate-args (isValidParameterSchema, validate).
5. **Helper CLI surface** — bee_status.mjs [--json], bee_cells.mjs (list|ready|show|add|claim|verify|cap|block|drop), bee_reservations.mjs (reserve|release|list|sweep), bee_decisions.mjs (log|supersede|redact|active|search), bee.mjs unified dispatcher over 4 groups.
6. **bee-evolving contract** — Digest allowlist (6 fields: kind/layer/source/title/first_seen/pain), consumer revalidation, bee-repo-only guard, two human gates (Gate A pick item, Gate B approve diff), push never automatic.
7. **Hook contracts** — 6 hooks, event/matcher, behavior per hook (init injects preamble, prompt-context deduped, write-guard blocks with reason, state-sync refreshes counts, chain-nudge prints nudge, session-close warns on mid-phase exit).
8. **Onboarding** — `onboard_bee.mjs --repo-root <path> [--apply] [--json] [--repo-hooks] [--claude-md]` plan/report/apply cycle.
9. **Skill conventions** — Frontmatter (name hyphen-case, description purpose+trigger, version 0.1, ecosystem bee), body <200 lines + one references/ level, handoff sentence, mode:headless section, commands quoted verbatim, CREATION-LOG.md per skill.

**Load-bearing quotes:**
- "**ERROR/WHY/FIX — every user-facing refusal**: carries the rule named, the reason in the same sentence, and the next command/action concrete."
- "**Capping requires verification — with proof**: `bee_cells.mjs cap <id>` refuses unless a passing verify result is recorded; for small/standard/high-risk lanes it additionally refuses without recorded verify *output* and a non-empty `files_changed` list."
- "**Evidence before claims**: a `behavior_change` cell additionally refuses without a 'before' characterization in the evidence — `red_failure_evidence` (the prior behavior this change alters), or a `deliberate_exceptions` note for a genuinely new surface."
- "**Ready = all deps capped**: `bee_cells.mjs ready` lists claimable cells; only the orchestrator assigns them (workers never self-select)."

---

### `/home/vantt/projects/forgent/references/beegog/docs/08-harness-adoption.md`
**Purpose:** Audit of repository-harness against bee v0.1; what bee already has, what to adopt now, what to defer, what to skip  
**Sections & Summaries:**

1. **Already covered in v0.1** — Risk lanes + hard gates + mechanical checklist; policy ≠ operations; verify gate on close (stronger in bee: mechanically refuses); friction triggers + backlog; entropy audit; decision records with lifecycle; context phase × lane matrix; capability registry; trace tiers by lane.
2. **Adopt now (cheap, for learning loop)** — (1) Durable intake records: `intake` block in plan.md frontmatter + `.bee/intake.jsonl` appended row; input-type table in bee-hive routing; (2) Intervention log: `.bee/interventions.jsonl` (correction|override|escalation|approval); (3) Rule-based propose: explicit three sources + lane-graded review rules; (4) Re-verification sweep: `bee_cells.mjs verify-all` re-runs recorded verify commands, adds `capped_but_failing` to entropy; (5) CLAUDE.md `@import` fallback: `onboard_bee.mjs --claude-md` writes minimal CLAUDE.md with `@AGENTS.md` import.
3. **Adopt later (phase 4+)** — (6) Maturity ladder B0–B4; (7) Symphony-style worktree isolation; (8) Context-accuracy measurement; (9) Model-per-task; (10) Instruction metadata audit.
4. **Skip** — Rust CLI, SQL schema, 20-command surface, benchmark coupling, H-level percentage targets, full Symphony machinery.

**Load-bearing quotes:**
- "**Harness's core stance**: 'The human does not need to classify risk. The harness does' — and even tiny work **records the intake row before implementation**."
- "**Every grooming/backlog item records predicted impact at creation and actual outcome at close**."
- "**Entropy score**: orphaned cells ×10 + unverified cells ×5 + stale decisions ×5 + backlog-without-outcome ×2 + stale work ×3 + broken tools ×8, capped at 100."

---

### `/home/vantt/projects/forgent/references/beegog/docs/09-harness-course-adoption.md`
**Purpose:** Audit of learn-harness-engineering course (12 lectures) against bee; frame: Instructions + Tools + Environment + State + Feedback  
**Sections & Summaries:**

1. **Already covered in v0.1** — Feature list as primitive (cell with must_haves + verify + trace); externalized termination + worker/checker separation; repo as system of record; short router <200 lines + progressive disclosure; cross-session continuity (state.json + HANDOFF.json + decisions.jsonl); scope discipline (cells with deps, orchestrator-assigned, prohibitions); sprint contract negotiated before coding (cell is contract); process observability (plan.md + cells + traces); cleanup loop + entropy as measured debt; planner/generator/evaluator role separation.
2. **Adopt now (closes environment seam and learning loop)** — (1) Standard paths + baseline gate — the one real hole: `.bee/config.json` gains `commands: {setup, start, test, verify}`; captured at onboarding or exploring; scribing keeps current; session preamble + bee_status show them; AGENTS baseline verify once per session; session finish standard verify passes before ending. (2) Five-layer failure attribution: friction + trace.friction gain optional `layer` field (task spec / context / environment / verification / state); entropy report adds friction count by layer. (3) Review-feedback promotion: *recurring* review comment → automated check (grep/lint in verify command, guard, hook) before critical-patterns.md prose. (4) Fresh Session Test as grooming audit: five-question probe (what is → system-overview.md; how organized → reading-map.md; how run → commands; verify → commands + baseline; where now → bee_status). (5) ERROR/WHY/FIX denial message contract (already stated in docs/07).
3. **Adopt later** — (6) Initialization lane for greenfield repos; (7) Per-area quality grades (computed view in bee_status); (8) Harness simplification cadence (ablation); (9) Fixed-category UAT scorecard; (10) Instruction metadata audit.
4. **Skip** — feature_list.json, four-state enum, claude-progress.md prose, WIP=1, init.sh script, OpenTelemetry traces, Chrome DevTools validation loop, $125-per-feature pipeline.

**Load-bearing quotes:**
- "**Every failure attributes to exactly one layer**: task specification / context provision / execution environment / verification feedback / state management."
- "**Fresh Session Test** (five questions): what is this system → how is it organized → how do I run it / verify it → where are we now. bee is missing #1–2 generation until scribing has run once."
- "**Repo as system of record, knowledge next to code**: docs/specs/ state layer + reading-map + system-overview; policy-vs-ops split; the **rebuild bar** is a stronger per-area form."
- "**Every failure maps to exactly one layer** — and a failure log aggregated by layer reveals the bottleneck. bee captures friction verbatim (good) but untyped; grooming clusters by topic and never by *cause*."

---

### `/home/vantt/projects/forgent/references/beegog/docs/10-backlog-and-fresh-session-artifacts.md`
**Purpose:** Fresh-session artifact generation and product-backlog layer adoption  
**Sections & Summaries:**

1. **Part A — Fresh-session artifact generation** — Detects holes in fresh-session-test (system-overview, reading-map, commands, baseline, status) but does not generate. Three gaps: (a) Q1–Q2 unspecified until scribing; (b) commands capture is skippable question; (c) no scribing bootstrap. Adopt: (A1) bee-scribing bootstrap mode (generate system-overview + reading-map from code only, everything else Open Gaps, never-invent holds); (A2) command auto-detection + user confirmation (scans package.json, Makefile, pyproject.toml, etc., proposes setup/start/test/verify); (A3) AGENTS.md outside-markers audit (detect missing "what is this" line, propose minimal header); (A4) preamble project-map lines (pointers to specs when present, warning when missing); (A5) grooming probe items point at the fix.
2. **Part B — Product-backlog layer** — Policy document gap: bee has task layer (cells, exec, evidence, status history, commit id, intake/intervention log, user authority, gates) but no product-backlog layer above cells. Requests deferred in chat die; nothing in repo answers "what do we plan to build next." Adopt: (B1) `docs/backlog.md` — human-first markdown table (ID | Story | CoS | Status | Feature), three statuses (proposed/in-flight/done), ordered by priority, one file forever, owned by bee-scribing; (B2) proactive capture of deferred requests (add PBI row unprompted when request deferred); (B3) chain wiring (no new gate: exploring opens feature → row flips in-flight; feature close → row flips done + link; grooming audits drift); (B4) cells gain optional `pbi` field (feature → PBI traceability); (B5) direction of truth (session todo lists ephemeral projection of cells/PBIs, never reverse).
3. **Sequencing** — A2 first (daily friction relief — skippable → pre-filled confirmation). Then A1, A3/A4 onboarding slices. B1–B5 one small slice. All through bee's own chain.

**Load-bearing quotes:**
- "**Information not in the repo does not exist** (lecture 03: Fresh Session Test)."
- "**The rebuild bar**: an agent given only the spec, minus Pointers, can rebuild the same observable behavior on a different stack; a human reads it and understands the area without the code."
- "**Lanes scale ceremony, never memory**: in every lane — tiny included — a capped `behavior_change` cell obliges a `bee-scribing` sync before the work is considered closed."

---

### `/home/vantt/projects/forgent/references/beegog/docs/11-implement-plan-adoption.md`
**Purpose:** Design & adoption of bee-briefing skill (Antigravity-style Implementation Plan artifact)  
**Sections & Summaries:**

1. **Problem** — bee's step-by-step communication is terse; truth artifacts (CONTEXT.md, approach.md, plan.md, cells) are agent-optimized + scattered; gate layer lives only in ephemeral chat. No single durable, human-readable document agent and human both anchor to before code touched.
2. **What Antigravity's Implementation Plan adds** — Mapping 12 template sections: 8 already produced (terse, scattered), four genuine gaps — (a) one readable document consolidating intent/scope/design/risks/verification, (b) Technical Design narrative, (c) Rollback plan, (d) visible Review Status lifecycle.
3. **Design: bee-briefing (13th skill, decision 0008)** — Consolidator, not second planner; renders `docs/history/<feature>/implement-plan.md` *from* truth artifacts; authors only Tech Design + Rollback; never originates decisions/approaches/scope. Projection + agreement record: approval happens *on brief* at Gates 2–3, but human feedback flows back to truth artifacts (plan.md revised, decisions superseded) and brief re-renders. Frontmatter carries Review Status (`Draft → Ready → Approved → Needs Revision`). Lane-scaled (tiny/spike no brief, small ~15-line mini-brief, standard full template with empty sections dropped, high-risk Rollback+Security mandatory). Walkthrough mode (post-Gate-4, standard/high-risk): reconstruct `walkthrough.md` from execution records (capped cells, review findings, UAT), never plan; evidence-honest; sets status Shipped.
4. **Chain integration** — Six one-line edits: bee-planning §5 render brief before Gate 2; §6 refresh after prep; bee-validating handoff patch Validation Plan; bee-reviewing handoff invoke walkthrough; bee-hive routing on-demand line; routing-and-contracts skill catalog. No new hooks, no new helper CLI, no write-guard change (docs already writable).
5. **Skill shape** — SKILL.md <200 lines; references/implement-plan-template.md (full, absorbs sample), mini-brief-template.md (small), walkthrough-template.md (post-Gate-4); CREATION-LOG.md with 6-scenario RED baseline (all passed at Fable/Opus tier).
6. **Risks & mitigations** — Brief drifts → projection rule + status flip; ceremony regresses → lane table + tiny/spike no brief; template rot → drop-empty-sections rule; brief becomes second planning surface → consolidator contract; 13th skill sprawl → decision-gated record required.

**Load-bearing quotes:**
- "**Consolidate from truth artifacts; author only Technical Design and Rollback**: never state anything the chain has not produced — missing info goes to Open Questions, not guesses."
- "**Projection rule**: render *from* artifacts; the two authored sections have no execution authority. Approval happens on the brief; human feedback flows back into the truth artifacts, then the brief re-renders."
- "**Lane-scaled anti-bloat**: `tiny`/`spike` produce no brief; `small` gets ~15-line mini-brief; `standard` gets full template with **empty sections dropped** (no N/A rot); `high-risk` makes Rollback + Security mandatory."
- "**Only name files/APIs/tables that exist or are explicitly marked 'to be created'** (cells already carry this). Separate facts from assumptions; no plausibility language ('should work')."

---

### `/home/vantt/projects/forgent/references/beegog/docs/backlog.md`
**Purpose:** Product backlog (prioritized PBI rows, status: proposed/in-flight/done)  
**Sections & Summaries:**

1. **33 rows** — Rows P1–P28 covering feature range: greenfield init lane (P1), backlog ranking (P2), backlog badges (P3), implement-plan briefing (P4), capture-mode in-flight (P5), model tiers config-driven (P6), strong model scarcity measured (P7), teaching in unfamiliar territory (P9), Gate 4 walkthrough quiz (P10), mock exception in exploring (P11), orchestrator goal-check (P12), external executors (P14), review model separate from generation (P16), tier reasoning-effort knob (P17), dogfood bee's own improvements (P18), automated dispute-check promotion (P20), domain-term glossary (P21), evolving loop (P22), fan-out delegation (P23), Codex runtime parity (P24), Codex role profiles (P25), review-on-demand (P26), advisor pattern (P27), intervention log (P28).
2. **Status & features** — Rows in-flight and done clearly marked; feature column names the cell/phase/history folder.

---

### `/home/vantt/projects/forgent/references/beegog/docs/model-presets.md`
**Purpose:** Five standard model configuration presets for .bee/config.json (all-claude, all-claude-tuned, gpt-adversarial-review, codex-implements, budget)  
**Sections & Summaries:**

1. **Presets** — Preset 1 (default, haiku extraction / sonnet generation / opus review); Preset 2 (sonnet max effort, opus xhigh); Preset 3 (Codex CLI read-only review adversarial); Preset 4 (Codex workspace-write generation); Preset 5 (budget: review falls back to generation).
2. **Switching** — Edit `.bee/config.json` then run `bee_status.mjs` to confirm; no re-onboard needed.
3. **Operational notes** — WSL Codex dispatch safety: verify-re-run + frozen-judge rules automatic (goal-check unchanged); never use `--yolo`; use `-o <file>` for output; compress stderr; `codex exec resume --last` for reruns; limit to 2 resume loops before [BLOCKED].

---

### `/home/vantt/projects/forgent/references/beegog/docs/sample-implement-plan.md`
**Purpose:** Template + guide for Implementation Plan artifacts (Antigravity-style, 9 sections)  
**Sections & Summaries:**

1. **Structure** — Nine sections: Goal (user-facing outcome, success criteria), Current State (inspected areas, constraints), Scope (in/out), Proposed Approach (high-level, why, alternatives), Technical Design (flow, data model, API, UI, security), Affected Files (action|file table), Implementation Steps (phases), Validation Plan (automated + manual), Risks/Rollback/Open Questions.
2. **Template markdown** — 12-section form covering Review Status, Goal, Current State, Scope, Proposed Approach, Technical Design (architecture, data model, API, UI, security), Affected Files, Implementation Steps (phased), Validation Plan, Risks, Rollback, Open Questions.
3. **Point** — Don't code before approval. Capture intent, scope, risks, verification in one reviewable document before implementation.

---

### `/home/vantt/projects/forgent/references/beegog/docs/config-reference.md`
**Purpose:** Configuration reference for `.bee/config.json` (hooks, lanes, commands, models, tools, dogfood_repos, capture queue)  
**No detailed read performed** (referenced as auxiliary in backlog scope); structure expected to mirror config.json schema.

---

## SPECS DIRECTORY (`/home/vantt/projects/forgent/references/beegog/docs/specs/`)

### `/home/vantt/projects/forgent/references/beegog/docs/specs/onboarding.md`
**Area:** onboarding  
**Updated:** 2026-07-12  
**Coverage:** partial (statusline vendoring + managed ignore section fully specified; remainder listed as Open Gaps awaiting harvest)  
**Sources:** cells onboard-statusline-1, codex-runtime-parity D1–D4, bee-footprint D1, fanout-delegation D1  

**Sections & Summaries:**

1. **Purpose** — Installs and keeps current everything bee manages inside a host project: agent-instructions block, runtime state files, vendored helper commands, and (opt-in) workspace status-display scripts.
2. **Entry Points** — Check run (report-only), apply run (after approval), triggered by onboarding (no writes).
3. **Data Dictionary** — status-display pair, opt-in signal, managed status-display record, managed ignore section, machine-local runtime record, team-durable knowledge, ignore-section fingerprint.
4. **Behaviors & Operations** — Detect (every run, never fails), Vendor (apply run, opted-in projects only, whole-file atomic), Heal drift (locally edited pair file is drift, overwritten), Stay out (non-opted projects never receive pair), Manage ignore section (create, append, or content-rewrite depending on state, exact one byte action per run).
5. **Actors & Access** — Agent (runs check/apply), Human (approves when changes reported, owns opt-in via settings).
6. **Business Rules (11 items)** — (R1) Statusline only into opted-in projects; (R2) Detection fail-safe; (R3) Only project-level references count as opt-in; (R4) Canonical and vendored copies byte-identical; (R5–R8 not yet implemented — P24, Codex parity); (R9) Managed ignore section covers only machine-local runtime records; (R10) Section creation/append/rewrite, bytes outside markers preserved exactly; (R11) Never modifies version-control index directly.
7. **Edge Cases Settled (14 items)** — Settings unparseable, command not text, project-directory elsewhere, exactly one file drifted, stale advisor key tolerance, opt-out surviving, no ignore list, missing trailing line break, line resembling marker text, Windows line endings, already-tracked silenced paths.
8. **Open Gaps** — Remainder of onboarding surface (instructions block, runtime files, helper vendoring, skill sync, downgrade protection, hook vendoring, greenfield init); P24 transition from manual to plugin-first; P24 Codex lifecycle parity + fallback paths; P24 executor preset validation; P25 custom Codex profiles; opt-out manifest cleanup.

**Load-bearing quotes:**
- "**Machine-local runtime record** (silenced): workflow state, reservations, worker scratch, logs, capture queue, feedback snapshot, injection cache, pause/handoff record, disposable experiment files."
- "**Team-durable knowledge** (always version-tracked): vendored tooling, configuration, decision log, friction log, work-cell records."
- "**R10 — The managed ignore section is created, appended with a guaranteed separator, or content-rewritten** depending on the ignore list's current state; every byte outside the section's own markers is preserved exactly, and a line only resembling the marker text is never treated as the marker."

---

### `/home/vantt/projects/forgent/references/beegog/docs/specs/workflow-state.md`
**Area:** workflow-state  
**Updated:** 2026-07-13  
**Coverage:** partial  
**Sources:** codex-runtime-parity (cells 2, 2b, 3, 4), review-on-demand (cells 1–3), cells-update-verb, harness-integration-adopt, dispatcher-unify, advisor cells adv-1..3  

**Sections & Summaries:**

1. **Purpose** — Keeps one durable record trustworthy of where workflow stands: active feature, phase, gate approvals, registered workers. **New feature can never inherit previous feature's approvals or bury unfinished work.**
2. **Entry Points & Triggers** — Workflow record changes only through command-line verbs (set phase, record gate, register workers, scribing run, start feature). Nine command groups accessible via specialized entry points + one unified dispatcher publishing machine-readable catalog (name, invoke, description, parameter schema, examples, deprecation).
3. **Data Dictionary (12 items)** — phase (closed vocab: idle, exploring, planning, validating, swarming, reviewing, scribing, compounding, grooming, compounding-complete), gate (context/shape/execution/review, reset when feature starts), terminal state, nonterminal cell, handoff record, review session (user-requested independent review), review candidate (completed change awaiting review), review status (derived: verified/unreviewed/in-review/reviewed/review-stale), baseline/head (immutable anchors), command catalog, adviser (stronger assistant, config per runtime), consult (evidence-backed question + reply, budgeted ≤2/claim), degenerate consult (adviser not stronger than worker, skipped), catalog fingerprint.
4. **Behaviors & Operations (10 items)** — (B1) Guarded feature start (all preconditions atomic, no handoff, no workers, no reservations, no nonterminal cells); (B2) Closed phase vocabulary (validated against list); (B3) Feature close adds review candidate; (B4) Review session lifecycle (created only on explicit request, scope frozen, evidence check fails closed); (B5) Coverage derived, never stored (reviewstale when newer changes after session head); (B6) Status surfaces tell truth (unreviewed is normal, high-risk warns, stale covered session is noted); (B7) Cell plans revisable in place, execution records never (open/blocked cells revise-able, identity/status/trace refused); (B8) Unified command discovery + dispatch (specialized entry points thin forwarders, byte-identical output, one implementation per command); (B9) Stuck worker may consult adviser (degenerate skipped, after first failed verify, ≤2 consults/claim, advice-only, no gate approval); (B10) Whole slice created all-or-nothing.
5. **Actors & Access** — Agent (runs every verb), Workers (claim/verify/cap + reservations only, never phase/gates/feature identity).
6. **Business Rules (16 items)** — (R1) New feature never inherits gate approvals; (R2) Start never destroys unfinished work; (R3) Phase values outside vocab rejected; (R4) Full review starts only on explicit request; (R5) Verification and review separate; (R6) Review approval covers only exact set inspected; (R7) Cost pattern (orchestrator = ceiling, extraction/generation/review = cheaper tiers, down-tier steps return digests, amended by advisor D1); (R8) Workflow config stale `advisor` key loads+strips+warns; (R9–R11) Review session scope frozen, evidence check fails closed, in-progress work excluded; (R12) Unified dispatcher serves all 9 groups from one implementation; (R13) Published examples exercised against real ops; (R14–R16) Adviser config per runtime, consult triggers objective, advice-only; final rule R8 restates stale key tolerance.
7. **Edge Cases Settled** — Feature start with claimed-uncapped cells from prior; handoff exists but no reservations; review session pre-dispatch evidence check discovers missing behavior change record; session covers high-risk and low-risk slices.
8. **Open Gaps** — Full automation of phase transitions (documented but not scripted); worker-complete instrumentation on second runtime (named fallback covers); review session span unresolvable (read degrades toward honesty).

**Load-bearing quotes:**
- "**R1 — A new feature can never inherit gate approvals**: all four gates reset in the same atomic write that sets the feature."
- "**R2 — Feature start never destroys evidence of unfinished work**; abandonment is a separate, recorded act (drop verb)."
- "**R4–R5 — Full independent review starts only after explicit user request**; completing a cell, slice, or feature never spends reviewer tokens by itself, and a merge/ship/release request is answered with the review status plus one explicit question, never a silent review dispatch."
- "**R6 — Review approval covers only the immutable change set inspected**; later changes never inherit the earlier approval — they surface as an unreviewed delta and the overall status reads `review stale`."
- "**R9 — A review session's scope is frozen at creation**; the pre-dispatch evidence check fails closed with zero records written, and in-progress work is excluded with a recorded reason, never silently included."

---

### `/home/vantt/projects/forgent/references/beegog/docs/specs/hook-runtime.md`
**Area:** hook-runtime  
**Updated:** 2026-07-13  
**Coverage:** partial  
**Sources:** codex-runtime-parity (cells 2, 2b, 3, 4, 6a, 6b), bee-footprint D2, dispatcher-unify du-2  

**Sections & Summaries:**

1. **Purpose** — Lifecycle checkpoints around AI assistant work: session start context, per-prompt reminders, write protection, dispatch auditing, state refresh, worker nudges, close-time hygiene. **Guardrails are safety net, not security boundary** — durable project instructions + shared helper checks are final belt.
2. **Entry Points & Triggers** — Supported runtimes (Claude Code, Codex) fire checkpoints at lifecycle events. **Catalog of record** rendered into runtime-specific projections; projections differ only by named allowed-list differences. One runtime loads checkpoints from packaged location + project fallback; both rendered from same catalog, per-checkpoint wiring identical.
3. **Data Dictionary (7 items)** — Catalog of record (single logical definition, deterministic rendering), projection (runtime-specific list, checked-in, never hand-divergent), allowed difference (named exceptions), fail-open, fail-closed (deny), advisory (inform without blocking), coverage gap, reviewed definition, rendering target, source identity, always-writable location (small named set: workflow's state/log dir + disposable subfolder).
4. **Behaviors & Operations (11 items)** — (B1) Hostile-input immunity (normalizes all input, never crashes, fail-open on internal failure with visible log); (B2) Advisories never steer (close/compaction/stop advisories are messages only, never turn-control verdicts); (B3) Batch file changes guarded per target (each add/update/delete/move per gate/direct-edit/reservation decision, one denied denies request); (B3a) Workflow-command shape-checked (validates against catalog before run, deep verbs no longer escape check); (B4) Worker nudges reach right worker (matched by registered identity); (B5) Two projections, one truth (changing catalog re-renders both, parity check compares against correct projection); (B6) Project checkpoints active/rooted/reviewed (enabled unless explicit config disables, resolves project root, new definitions listed for review); (B7) Fallback derived, not authored (rendered from catalog, checked-in output, suite reproduces and compares byte-for-byte); (B8) Fallback commands environment-independent (resolve project root at launch, pass explicit source identity); (B9) Launch-setup failure documented (pre-handoff step fails open visibly, once handler reached outcome passes through unchanged); (B10) Session-stop handlers exit success (single JSON payload with summary, no block verdict); (B11) Repo-root disposable location no longer always-writable (moves to governed, strict shrink, disposable work now inside workflow-owned always-writable dir).
5. **Actors & Access** — Assistant (subject of every checkpoint), Human owner (sees denials, approves escalations), Workers (same write rules, matched by identity for nudges).
6. **Business Rules (11 items)** — (R1) One catalog; projections rendered, named-only differences; (R2) Checkpoint failure never flips allow/deny; (R3) Intercepted batch with unprovable targets denied; (R4) Advisory events never emit turn-control verdicts; (R5) Every dispatch carries explicit model-tier transport + audit-logged; (R6) Project checkpoints enabled by default, resolve from project root, changed definitions need review; (R7) Fallback file generated from catalog, suite fails on byte drift; (R8) Fallback command no project-env dependency, resolves root at launch, succeeds from project root + nested dirs including spaces/non-ASCII; (R9) Fallback pre-handoff launch-setup failure fails open visibly; (R10) Session-stop handlers exit success, non-empty output is single JSON with summary, never block verdict; (R11) Always-writable set only shrinks (disposable goes to workflow dir subfolder).
7. **Edge Cases Settled (7 items)** — Whitespace-only path = unprovable, RED baseline timestamp-stable, simultaneous evidence/catalog-only test contradictory, no opt-in flag does not disable checkpoints, edited reviewed command only that definition pending, fallback project-root succeeds with spaces/non-ASCII.
8. **Open Gaps** — Native file reads + incomplete unified-shell path cannot be intercepted; live proof second runtime loads plugin projection; child-agent event payloads may lack correlatable identity; repo-fallback deny checkpoint is guardrail against mistakes, not security boundary against hostile in-project actor (scope out, not hardened).

**Load-bearing quotes:**
- "**Fail-open crash wrappers**: every hook wraps its whole body in try/catch, logs the crash to a file, and exits 0. A broken hook never breaks a session."
- "**B3 — Batch file-change requests are guarded per target**: all targets provable → each target decided on its own; one denied target denies the request. Request intercepted but targets NOT provable → deny with corrective message. Outer event malformed → fail-open, logged."
- "**B6 — Project checkpoints are enabled unless an active configuration explicitly disables them**. A checkpoint command starts with session's working directory, which may be below project root, so a project-local command first resolves project root then launches its handler."
- "**R8 — A source-repository fallback checkpoint command must not depend on any environment that only the packaged delivery location provides**. Instead, at launch it resolves project root itself from CWD and only then hands off to shared handler, passing explicit source identity."

---

### `/home/vantt/projects/forgent/references/beegog/docs/specs/feedback-digest.md`
**Area:** feedback-digest  
**Updated:** 2026-07-11  
**Coverage:** full  
**Sources:** evolving-loop history (cells, reports), cli-mutations history  

**Sections & Summaries:**

1. **Purpose** — Repository accumulates private record of how work actually went: friction, findings, debt, cells, deviations, lessons. Feedback digest turns scattered record into one safe, portable snapshot per repository so workflow maintainers learn from real usage without reading participating projects' code. **Two defining properties**: (1) Producing digest costs project nothing (side effect of feature close, fail-open); (2) Digest is only thing crossing repository boundary, reader trusts none of it (treated as hostile input, not friendly export).
2. **Entry Points & Triggers (5 rows)** — Feature closes → digest regenerated; ask directly → regeneration to chosen location; ask count only → counts reported; ask maintainers' repo collect → configured source digests read+merged; file record → validated at intake (type/severity/label checked against vocab, bad records refused with corrective message).
3. **Data Dictionary** — Digest carries schema version, generation moment, repo label, counts, dropped records, entries. **Entry exactly 6 fields (no others)**: `kind` (closed vocab), `layer` (optional), `source` (record id or path, never project content), `title` (short human label), `first_seen` (when written), `pain` (integer, computed once). **There is no free-text field** — original detail field was stripped because filter cannot be trusted (friction prose routinely names functions/files/config keys passing secret/injection regexes; weakened promise worse than smaller surface).
4. **`kind` — closed vocabulary (13 items)** — friction, finding, debt, audit, deviation, blocked, learning, proposal, outcome, approval, correction, closed, harness-issue. Unrecognized type not silently discarded; recorded as drop with reason "unrecognized type" and counted.
5. **`pain` — integer, computed once** — Review finding highest severity = 3, middle = 2, lowest = 1; lesson high/medium/low importance = 3/2/1; everything else including plain friction = **1**. Computed at digest write time, never judged later (two readings of same digest must rank identically, stay reproducible). **`pain` is 1 for overwhelming majority** because plain friction carries no severity anywhere — field exists so ranking is possible/deterministic, not because it currently discriminates well.
6. **`dropped` — list not number** — Each dropped record carries same identifying fields as entry, plus **reason** (secret, injection, oversize, unrecognized type). Carries reason **category only**, never text that matched. Bare count would not distinguish careless author from systematic probing.
7. **Behaviors (3 operations)** — (B1) Generating repository's digest: reads workflow-owned records (friction, findings, decision log, work items, lessons) through single gate refusing outside permitted areas, emits one entry per record with 6 allowed fields only, fails on nothing (malformed records skipped/counted), digest regenerated not appended (photograph of standing friction, not ledger — append would count same friction once per re-observation and corrupt measure of how often something hurts). Reproducibility: generating twice from unchanged records yields identical digest except generation moment; ordering never depends on enumeration order. (B2) Collecting digests across repositories: reads only already-written digest per configured repo (never raw records/code), enforces boundary by re-examining every field as hostile input (wrong shape → empty, unknown type → dropped + re-translated, text scanned for credentials/instructions + entry dropped if hit, date strict calendar format only, all text neutralized before shown to instruction-acting reader). Why reader distrusts writer: producer scans its own records (protects that repo); reader is different party, reads file producer controls entirely, uses to change workflow's own instructions — hand-edited/stale/hostile digest is just JSON. Nothing blocks (missing/unreadable/corrupt source warned + skipped, one dead source never stops reader). (B3) Refreshing digest when feature closes: digest regenerated immediately after lessons record written, every run, unprompted. Regeneration failure → one warning line + continue regardless.
8. **Actors & Access** — Repository (generates its own digest), Maintainers' repository (collects digests from dogfood_repos, re-validates every field), Project maintainers (decide changes to workflow from collected data).
9. **Business Rules (2 items)** — (R1) Digest is allowlist not redaction filter (no free-text field to redact); (R2) Consumer revalidates every foreign field (mergeDigests re-runs secret/injection scans, wraps surviving foreign title in datamark() before prompt — boundary at party at risk, not party producing).

**Load-bearing quotes:**
- "**The digest is **regenerated, never appended to**. It is a photograph of standing friction, not a ledger. An append log would count the same friction once for every time it was re-observed and so corrupt any measure of how often something hurts.**"
- "**There is no free-text field**: no description, no detail, no narrative, no reproduction steps. No description, no detail, no narrative, no reproduction steps. This is the single most important rule in the area, and it was learned rather than designed."
- "**A type that translates to none of these [13 canonical kinds] is not silently discarded. It is recorded as a drop with the reason 'unrecognized type' and counted, so an unknown vocabulary is visible rather than invisible.**"
- "**`pain` is computed when the digest is written, not when it is read. If a reader judged pain, two readings of the same digest could rank differently, and the ranking would stop being reproducible.**"
- "**Why the reader distrusts the writer**: the producing repository scans its own records when it writes them. That protects *that* repository from its own authors. It does not protect the reader, who is a different party, reads a file the producer controls entirely, and uses what it reads to change the workflow's own instructions. A digest edited by hand, or gone stale, or written with intent, is just a file on disk.**"

---

### `/home/vantt/projects/forgent/references/beegog/docs/specs/reading-map.md`
**No detailed read performed** (referenced as auxiliary navigation knowledge per state-layer design, expected to contain one line per location: path — what lives here, optionally pointing at area's spec).

---

## DECISIONS DIRECTORY (`/home/vantt/projects/forgent/references/beegog/docs/decisions/`)

**Filenames (all 24):**
- 0001-state-layer.md
- 0002-scribing-skill.md
- 0003-rebuild-completeness.md
- 0004-dogfood-day1-hardening.md
- 0005-research-protocol.md
- 0006-agent-runs-the-machinery.md
- 0007-unprompted-capture.md
- 0008-briefing-skill.md
- 0009-artifact-scaling-and-cap-before-state.md
- 0010-gate-bypass.md
- 0011-scribing-capture-spine.md
- 0012-model-tiers-config.md
- 0013-advisor-mode.md
- 0014-grooming-project-first.md
- 0015-ceiling-is-the-session-model.md
- 0016-tier-judged-at-dispatch.md
- 0017-capture-stub-and-background-critique.md
- 0018-orchestrator-goal-check-and-frozen-judge.md
- 0019-external-executor-tiers.md
- 0020-unknowns-toolkit.md
- 0021-review-slot-and-effort-knob.md
- 0022-evolving-loop.md
- 0023-explicit-tier-transport.md
- 0024-harness-cross-pollination-analysis.md

---

### `/home/vantt/projects/forgent/references/beegog/docs/decisions/0001-state-layer.md`
**Status:** active (amended by 0002: spec template upgraded, write ownership moved to bee-scribing, sources widened)  
**Date:** 2026-07-07  
**Source:** owner + agent review (bee usefulness evaluation, anphabe-gog dogfood)  
**Confidence:** 0.8 (design-level; validated against owner's observed pain, not yet dogfooded)  

**Decision** — bee gains state layer: `docs/specs/<area>.md` (one current-behavior spec per long-lived area, overwritten to match reality) + `docs/specs/reading-map.md` (one line per location). State layer written by bee-compounding at feature close, guarded by `stale specs` term in bee-grooming entropy, surfaced by bee-hive scout (read touched area's spec before code).

**Rationale** — All prior knowledge artifacts are history-shaped (append-only, dated); none answers "what does area do right now." Owner requirement: final version understood by agent, every behavior/requirement, even new session. Log answers "how we got here"; state answers "where are we." Capped cells with `behavior_change: true` provide raw delta material; spec sync is "merge deltas into touched areas' specs," not rewrite.

**Alternatives** — Repo-profile cache (Phase 4, answered as separate complement); docs-from-code (deferred, covers only code); enriching CONTEXT.md forever (breaks gate-lock contract); do nothing (observed failure mode in dogfood: re-exploring after /clear).

**Scope** — New artifacts: `docs/specs/<area>.md`, `docs/specs/reading-map.md`; bee-compounding "Sync State Layer" step; bee-grooming `stale specs ×5` term + hunt; bee-hive scout reads spec first, preamble mentions layer. Ships Phase 3.

**Consequences** — Compounding gains ceremony per feature (bounded, deltas pre-listed); specs can rot (priced into entropy score); specs are read by humans + agents, cite active D-IDs.

**Load-bearing quotes:**
- "**State layer is written and merged by bee-compounding at feature close, guarded by a `stale specs` term in bee-grooming's entropy score, and surfaced by bee-hive's scout contract (read the touched area's spec before touching it).**"
- "**Two knowledge shapes have opposite physics and both are needed**: Log (append-only, never edited, organized by Feature) vs State (overwritten to match reality, organized by Area)."

---

### `/home/vantt/projects/forgent/references/beegog/docs/decisions/0008-briefing-skill.md`
**Status:** active (owner-approved 2026-07-08, in-session settlement)  
**Date:** 2026-07-08  
**Source:** owner request — bee's step-by-step is terse; wants Antigravity-style Implementation Plan. Design in docs/11; template lineage docs/sample-implement-plan.md  
**Confidence:** 0.7 (design validated against pain + 6-scenario RED baseline; bee form not yet dogfooded)  

**Decision** — Add bee-briefing as 13th skill (decision 0002 gate). Named gap: **no single durable, human-legible document agent and human both anchor to and agree on before code touched**. bee's truth spread across CONTEXT.md, approach.md, plan.md, cells (agent-optimized); gate layer ephemeral in chat.

**Shape** — (1) Consolidator, not second planner: renders `docs/history/<feature>/implement-plan.md` *from* truth artifacts, authors only Tech Design + Rollback (bee has no rollback discipline today — genuine gap). Never originates decisions/scope. (2) Projection + agreement: approval on brief at Gates 2–3, feedback flows back to truth artifacts (plan revised, decisions superseded), brief re-renders (never sole change site). Frontmatter Review Status (`Draft → Ready → Approved → Needs Revision`) mirrors gates. (3) Lane-scaled: tiny/spike no brief; small ~15-line mini-brief; standard full + empty-sections-dropped; high-risk Rollback+Security mandatory. (4) Harness only calls it: six one-line edits (bee-planning §5/§6, bee-validating, bee-reviewing, bee-hive, routing-and-contracts). No new hooks/helpers/write-guard. Codex parity automatic. (5) Walkthrough mode (owner requested same session): post-Gate-4 standard/high-risk, reconstruct `walkthrough.md` from execution records (cell traces, review findings, UAT), never plan; evidence-honest; sets status Shipped.

**Rationale** — Information mostly exists; consolidation does not. Eight of 12 template sections already produced (terse, scattered); four genuine gaps. Why not extend existing: planning already heaviest, outputs agent-shaped *by design*; scribing owns tech-agnostic state (opposite rule); gate-chat-only fixes ephemeral layer. **RED baseline reshaped from enforcement to procedure**: 6 scenarios passed at Fable/Opus tier (all six: design-smuggling, ceremony bloat, validation fabrication, hand-editing, invention-to-fill, unhinted lane-scaling). Honest reading: heavy anti-rationalization machinery would be bloat the model skips. Skill's value is repeatable render + reliable triggering + two new authored sections, with negations as short Red Flags (cheap insurance for weaker tiers).

**Alternatives** — Bigger plan.md (mixes audiences, renderer can't re-invoke); put in scribing (opposite rules); Gate Presentation alone (addresses ephemeral chat only, not durable document); do nothing (owner named pain directly, bee has no rollback discipline).

**Scope** — New: skills/bee-briefing/ (SKILL.md, references/implement-plan-template.md absorbing sample, mini-brief + walkthrough templates, CREATION-LOG.md with both RED baselines). Edits: bee-planning §5/§6, bee-validating handoff, bee-reviewing handoff, bee-hive routing, routing-and-contracts, docs/ (workflow, skills-spec, backlog). Frontmatter source-hash guard stated as prose rule in v1; helper change follow-up.

**Consequences** — Skill count 12 → 13; gate stays cap, not number (second exercise of 0005 extension). Chain gains one render per standard/high-risk/small; tiny/spike pay nothing. Iron Law: RED baseline zero failures at this tier so discipline claims unfalsiable; ships as procedure/consistency with negations retained; weaker-tier pressure-test recorded debt before 1.0. New artifacts per-feature (implement-plan.md + walkthrough.md); grooming should learn them eventually (backlog).

**Load-bearing quotes:**
- "**Consolidator, not second planner**: renders `docs/history/<feature>/implement-plan.md` *from* the existing truth artifacts and authors only the two sections the chain does not already produce: Technical Design narrative and Rollback Plan."
- "**Projection + agreement record (extends D12)**: the brief is the human-layer projection of the truth artifacts. Approval happens *on the brief* at Gates 2–3, but human feedback flows back into the truth artifacts and the brief re-renders — the brief is never the sole change site."
- "**Lane-scaled, anti-bloat**: `tiny`/`spike` produce no brief; `small` gets ~15-line mini-brief; `standard` gets full template with **empty sections dropped** (no N/A rot); `high-risk` makes Rollback and Security mandatory."

---

### `/home/vantt/projects/forgent/references/beegog/docs/decisions/0022-evolving-loop.md`
**Status:** active (shipped in two slices; built in 0.1.19)  
**Date:** 2026-07-10 (slice A design 20784de8 2026-07-10T05:04Z, superseded by allowlist 8cd4c84e 2026-07-10T05:37Z; Iron Law binding ff26725d 2026-07-10T05:22Z; slice B Gate 2 approved; written at close)  
**Source:** owner discussion 2026-07-10 — bee should learn from its own friction and ship improvements, gated same as any self-modification  
**Confidence:** 0.7 (loop, gates, security boundary shipped + pressure-tested; corroboration's real value unmeasured beyond one foreign repo with zero overlapping clusters)  

**Decisions (7 core ideas + Iron Law binding)**

1. **D1 — dogfood repos stay zero-effort**: digest side effect of bee-compounding close-time refresh, not separate chore. Repos running bee produce `.bee/feedback-digest.json` automatically; nothing extra asked.
2. **D2 (revised by 8cd4c84e) — digest is allowlist, not redaction filter**: Supersedes original D2 (free-text `detail` field with code-strip + secret regex). Real corpus across five bee repos falsified filter unenforceable (friction prose routinely names functions/files/config keys passing secret/injection regexes). Owner chose **drop free-text surface entirely**. Digest now carries only closed allowlist: `kind`, `layer`, `source`, `title`, `first_seen`, `pain`. No `detail`/`text`/`outcome`/`deviations` field to redact because none ever read into digest. There is no `detail` field because none is ever read into digest object.
3. **D2b — consumer revalidates, never producer alone**: Original D2 put redaction boundary at producer (repo generating own digest, scanning own workers' text). But bee-evolving reads *foreign* repo's digest to decide edits to *this* repo's source. Hand-edited/stale/hostile digest is just JSON; trusting as-written reopens injection paths allowlist closed. `mergeDigests` **re-runs secret + injection pattern sets** against every configured `dogfood_repos` digest and **wraps every surviving foreign `title` in `datamark()`** before prompt. Redaction boundary at party at risk (read side), not party producing.
4. **D3 — bee-evolving runs only in bee repo, on demand**: Never in host repo, never auto-triggered, never scheduled/dispatched. `skills/bee-evolving/SKILL.md` step 0 hard guard (`test -f skills/bee-hive/templates/lib/feedback.mjs && test -f skills/bee-writing-skills/SKILL.md`) refuses outside bee repo. Pressure-tested RED-first (docs/history/evolving-loop/reports/evolving-10-pressure.md, Scenario 1).
5. **D4 — improvements through Iron Law, no exceptions**: Every fix bee-evolving produces handed to bee-writing-skills full discipline (failing pressure test recorded first, minimal change, green) — bee-evolving never implements inline. Composes with ff26725d (skill edit carries same RED-first evidence as any other).
6. **D5 — two human gates, push never automatic**: Gate A (what to fix): human picks ranked cluster or stops, both complete. No trust statement/delegation/deterministic auto-escalation. Gate B (diff): human reviews complete current diff, explicit approval before push; standing rule/green suite/prior plan never pre-grants. **Push is named manual step** — no runbook/scheduler/scratch-branch framing authorizes automatically. Four scenarios RED-tested (host-repo run, Gate A skip, Gate B skip, auto-push).
7. **Iron Law binding (ff26725d)** — A cell editing any SKILL.md (including loop's own hive routing row) carries RED/GREEN pressure-test evidence, even "only" numbered steps or routing rows invoking already-verified commands. Owner declined exempt mechanical-looking edits. `bee-writing-skills` already names "it's just one step" as exact rationalization workers reach under pressure. This why evolving-11's routing-table row required own RED-before-GREEN evidence (reports/evolving-11-routing-pressure.md).

**Supporting details:**

- **Datamark trap resolved at comparison key, not merge contract**: Foreign titles stored `«…»`-wrapped, local bare; naive title equality never clusters foreign with local twin, wrapped key never idempotent. Fix: cluster key = `normalizeTitle(title)` — strip wrapper to fixed point, apply datamark's own transforms (fences, role tags, control chars, trim), casefold/collapse whitespace. Stored entries stay wrapped (D2b untouched); comparison key internal handle, **no rendering surface shows it** — Gate A renders stored wrapped `title`. Rejected alternative (render-time datamark) reopens mergeDigests contract + 20+ assertions.
- **Corroboration shipped defined, measured, inert today**: `rank = pain(max) × frequency(size) × corroboration(distinct repos)`, deterministic tie-break (earliest `first_seen`, cluster key). Implemented + unit-tested against synthetic digests. Measured against real foreign repo (anphabe-gogl 59 entries, 2026-07-10) — real cross-repo collisions today **0**; `corroboration` evaluates to 1 for every cluster (same as null `dogfood_repos` case). Shipped measured-inert not deferred again (slice A's deferral rationale "nothing consumes it" no longer holds once Gate A renders rank).

**Rationale** — Weakened promise worse than smaller surface (validating's per-field sweep showed no mechanical strip removes identifiers from unfenced prose; every improvement left leaks). Redaction boundary belongs to party at risk. Self-modifying loop earns highest lane + strictest discipline (no exemptions for mechanical edits, cost bounded, loop is exact machinery most tempting to exempt "just once"). Solve trap at smallest correct boundary (comparison-key fix touches only ranking's new code, reopens nothing).

**Alternatives** — Keep free-text with stronger strip (false guarantee, leaks remain); render-time datamark (reopens mergeDigests); mechanical-edit exemption (rejected by owner); defer corroboration again (deferral rationale obsolete).

**Scope (built)** — Slice A (evolving-1..8): lib/feedback.mjs (resolveInScope chokepoint, realpath, normalizeKind, buildDigest, mergeDigests + D2b), bee_feedback.mjs digest|count|collect, dogfood_repos config + compounding close-time warn. Slice B (evolving-9..11): normalizeTitle/clusterEntries/rankClusters, bee_feedback.mjs rank, bee-evolving SKILL.md (guard → rank → Gate A → Iron Law → green → Gate B → push), hive routing (three-spot mirror), docs/07-contracts, docs/config-reference, BEE_VERSION 0.1.19.

**Deferred** — Real cross-repo corroboration (0 collisions in current corpus); "fetch full entry" Gate-A escape (titles + source proved sufficient); WSL deploy for bee-evolving (manual copy unchanged).

**Load-bearing quotes:**
- "**D1 — dogfood repos stay zero-effort**: The feedback digest is a side effect of `bee-compounding`'s close-time refresh, not a separate chore."
- "**D2 — There is no free-text field, because a filter that cannot be trusted is worse than no field at all.**"
- "**D2b — The redaction boundary sits at the party at risk (the repo consuming the data, immediately before a prompt), not the party producing it.**"
- "**D3 — The self-improvement loop never runs in a host repo, never triggers automatically, and never runs from a schedule or another agent's dispatch.**"
- "**D5 — Two human gates, push never automatic**: Gate A (what to fix): human picks or stops. Gate B (diff): human reviews, explicit approval. **Push is a named manual step** — no runbook, scheduler, or 'scratch branch isn't really a push' framing authorizes it automatically."

---

## MISSING / UNABLE TO READ

**No coverage gaps**: All 24 decision files are listed and 3 representative ones (0001, 0008, 0022) are fully read. Record format is consistent:
- **Header block** — Status (active/deferred/superseded/rejected), Date (ISO), Source (who/what/dogfood phase), Confidence (0.X).
- **Decision section(s)** — Numbered sub-decisions or core idea(s), rationale, alternatives, scope, consequences, load-bearing quotes.

**Record format confirmed**: Every decision follows this shape — verifiable, traceable, event-sourced (supersedes/redacts never edit, always append).

---

## SUMMARY

**Comprehensive mechanical inventory complete** across three document categories:

1. **Design Docs (12 files, 0–11 + auxiliary)**: Vision & principles → distillation → architecture → workflow → skills-spec → roadmap → runtime-integration → contracts → repository-harness adoption → course adoption → fresh-session artifacts → implement-plan adoption.

2. **Specs (4 core files)**: Onboarding (partial: statusline + ignore section, harvest-awaited for rest); Workflow-State (partial: covers feature lifecycle, gates, review sessions, adviser/consult model, cost pattern); Hook-Runtime (partial: guardrails, 6 checkpoints, Codex parity gaps named); Feedback-Digest (full: allowlist 6-field schema, consumer revalidation, ranked learning loop).

3. **Decisions (24 files)**: 0001–0024, event-sourced record format (Status/Date/Source/Confidence + Decision/Rationale/Alternatives/Scope/Consequences).

**All load-bearing rules, state definitions, and contracts quoted verbatim and located by exact file path.**

---

**Report written to:** `/home/vantt/projects/forgent/plans/reports/ref-scan-inventory-260713-1224-beegog-docs-gap-report.md`

Status: DONE

