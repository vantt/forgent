# Beegog Skills Inventory — 8-Skill Audit

Reference repository: `/home/vantt/projects/forgent/references/beegog`

Scope: Complete file inventory, frontmatter, section summaries, and reference catalog for 8 core bee workflow skills.

---

## bee-briefing

**Files in skill directory:**
```
agents/openai.yaml
CREATION-LOG.md
references/implement-plan-template.md
references/mini-brief-template.md
references/walkthrough-template.md
SKILL.md
```

**SKILL.md Frontmatter (lines 1–14, 148 total lines):**
```yaml
name: bee-briefing
description: >-
  Render one human-readable implementation plan per feature so the human and the agent review and agree on the same document before code is touched. Use when planning has shaped work that needs Gate 2/3 approval, when a feature's implement plan must be (re)generated, or when the terse per-feature artifacts need consolidating into one reviewable doc. Do NOT use to originate decisions, scope, or approach — those come from exploring/planning.
metadata:
  version: '0.1'
  ecosystem: bee
  dependencies:
    nodejs-runtime:
      kind: command
      command: node
      missing_effect: degraded
      reason: Reads cell traces and gate/status state via the vendored .bee/bin helpers.
```

**Section Summaries:**

- **Lane forms (ceremony scales with risk)** — Briefing is conditional; tiny/spike get no brief; small gets optional mini-brief (~15 lines); standard/high-risk get full template. Never create a brief for trivial fixes; form follows lane risk.

- **Modes** — Four workflows: render (planning → Gate 2), refresh (post-Gate-2 cells created / post-validating), walkthrough (post-Gate-4 execution record), on-demand (any phase). Each updates or writes the implement plan, never creates multiple versions.

- **Section → Source Map** — Every section projects from a named source (CONTEXT.md, approach.md, plan.md, cells, validating report, authored judgment). Silent source → Open Question (never guessed content). Technical Design and Rollback Plan are the only two authored sections; rest are projections.

- **The Two Authored Sections** — Technical Design: readable narrative of the flow from the approach. Rollback Plan: how to undo this specific change; must be real, not plausible invention; for high-risk lanes, must be decided pre-Gate-3.

- **Projection & Status Lifecycle** — Brief is projection of truth artifacts; truth never follows the brief. Feedback flows back to CONTEXT.md/plan.md, then the brief re-renders. Status mirrors gates (Draft → Ready for Review → Approved → Needs Revision → Shipped).

- **Gate Presentation** — Briefing does not present gates; bee-planning and bee-validating do. The brief is linked (not pasted) in Gate 2/3 chat messages; mechanical reports stay in `docs/history/<feature>/reports/`.

- **Walkthrough Mode (post-Gate-4)** — Reconstruct from execution records (capped cells, review findings, UAT), never from the plan. Sections: What shipped · How it was verified (with evidence) · How to test it · Deviations from plan · Known limitations. Quiz offer on walkthrough (optional, 3–5 questions).

- **Hard Gates & Red Flags** — Never invent content; source silent = Open Question. Walkthrough must reflect what shipped, not what was planned. Never claim verification beyond evidence. Never hand-edit the brief as the sole change (feedback flows to truth artifacts first, then brief re-renders).

**References:**
- `implement-plan-template.md` — Full 12-section template and writing guide; projects each section from its named source with D-ID citations; drop empty sections, never use "N/A" placeholders.
- `mini-brief-template.md` — ~15-line form for small lane when user requests consolidation (Goal · Scope in/out · Affected files · Validation · one-line Risk · one-line Rollback).
- `walkthrough-template.md` — Post-Gate-4 walkthrough sections: what shipped, how verified (with real evidence, not plausible claims), how to test, deviations, known limitations. Quiz offer protocol.

**Line count:** 148 lines

---

## bee-bypass-gate

**Files in skill directory:**
```
agents/openai.yaml
CREATION-LOG.md
SKILL.md
```

**SKILL.md Frontmatter (lines 1–14, 64 total lines):**
```yaml
name: bee-bypass-gate
description: >-
  Toggle opt-in gate-bypass autopilot. When on, the agent auto-approves Gates 1-3 for tiny/small/standard work (taking the recommended choice) instead of stopping for the human; high-risk/hard-gate work, secret reads, and Gate 4 UAT always still stop. Use when the user wants to run the pipeline without approving every gate, or to check or turn off bypass. Invocable as the command bee-bypass-gate with on / off / status.
metadata:
  version: '0.1'
  ecosystem: bee
  dependencies:
    nodejs-runtime:
      kind: command
      command: node
      missing_effect: degraded
      reason: Reads and reports state/config via the vendored .bee/bin helpers.
```

**Section Summaries:**

- **Bypass mechanism** — Flips `.bee/config.json` `gate_bypass` switch on/off. When ON: agent auto-approves Gates 1-3 for normal-lane work (tiny/small/standard), records with `bee_state.mjs gate --approved true`, posts `⚡ auto-approved Gate N`. Never touches high-risk, hard-gate work, Gate 4 UAT, or privacy reads (absolute safety floor).

- **Operation** — Parse arg: `on` / `off` / `status` (no arg → status, then ask). Read state, apply: status reports bypass state; on sets switch + states safety floor + logs decision; off confirms gates back to human control. Config-layer write only (no permission needed, no gate).

- **Safety Floor (never touched by bypass)** — High-risk lane, any hard-gate flag (auth, authorization, data loss, audit/security, external provider, validation removal, database migration/schema), Gate 4 UAT, privacy reads. These stop for human always, even with bypass on.

- **Hard Gates & Red Flags** — Only write `.bee/config.json` `gate_bypass`; never approve an actual pipeline gate. Must state safety floor to user when turning ON. Never suggest widening bypass past the safety floor.

**References:** None—this skill is self-contained (no reference files).

**Line count:** 64 lines

---

## bee-compounding

**Files in skill directory:**
```
agents/openai.yaml
CREATION-LOG.md
references/compounding-reference.md
SKILL.md
```

**SKILL.md Frontmatter (lines 1–14, 140 total lines):**
```yaml
name: bee-compounding
description: >-
  Capture durable learnings and decisions so future work starts smarter. Use when scribing completes, or when work is intentionally abandoned with lessons worth keeping.
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

**Section Summaries:**

- **Gather Evidence** — Collect CONTEXT.md, plan.md, worker reports, cell traces, review findings, feature commit history. Fall back to session summary if history is thin. Never fabricate learnings—thin honest entry beats invented rich one. Evidence gather delegates as I/O-tier workers.

- **Analyze — Three Parallel Analysts** — Launch pattern extractor (code/process/integration patterns), decision analyst (important choices, tradeoffs, surprises), failure analyst (blockers, wrong assumptions, regressions, verification gaps). Each returns findings only; subagents never write durable files. Orchestrator synthesizes.

- **Synthesize — One Learnings File** — Write `docs/history/learnings/YYYYMMDD-<slug>.md` with frontmatter (date, feature, categories, severity, tags) and sections What Happened / Root Cause / Recommendation. Before writing, redact secrets and PII; if unsafe, drop finding and note skip in summary. Never let secrets into learnings.

- **Promote Criticals** — First-choice promotion is an executable check (grep, lint, hook guard); prose in `critical-patterns.md` is fallback. Apply only when all three criteria met: multi-feature relevance, meaningful waste prevented, generalizable rule. Sparse promotion keeps critical-patterns.md high-signal.

- **Log Durable Decisions** — Via `bee_decisions.mjs log` with decision, rationale, alternatives, confidence. Supersede outdated decisions (never edit history). Log choices future planning must honor.

- **State Layer Guard** — Verify `bee-scribing` ran (check `.bee/state.json` "scribing: N specs synced"). If `behavior_change` cells capped but no scribing record, invoke bee-scribing now. Confirm backlog.md row flipped to done with feature link (scribing owns flip; compounding is last close point if scribing legitimately NOOPed).

- **File Unresolved Friction** — Via `bee_backlog.mjs add --type friction` with severity, layer, title, detail. So `bee-grooming` can hunt later.

- **Refresh the Feedback Digest** — Run `node .bee/bin/bee_feedback.mjs digest` unprompted at every close (dogfood telemetry). Warn never block on failures; a thrown digest cannot corrupt the feature (it runs after work is done). Never skip silently; disclose in summary if skipped.

- **Update State** — Record completion via `bee_state.mjs set --phase compounding-complete`.

- **Hard Gates & Red Flags** — Never skip compounding for meaningful work. Never promote everything as critical. Never write generic lessons ("test more carefully" banned). Never let subagents write durable files. Never close with `behavior_change` cells capped but scribing never ran. Secrets and PII never appear in learnings/decisions/backlog.

**References:**
- `compounding-reference.md` — Analyst prompts (pattern extractor, decision analyst, failure analyst), learnings template with frontmatter and sections, promotion format, backlog entry format. Teaches analysts to return findings only; synthesizing is the orchestrator's job.

**Line count:** 140 lines

---

## bee-evolving

**Files in skill directory:**
```
agents/openai.yaml
CREATION-LOG.md
SKILL.md
```

**SKILL.md Frontmatter (lines 1–14, 162 total lines):**
```yaml
name: bee-evolving
description: >-
  Run bee's gated self-improvement loop over its collected feedback digest. Use when the human asks bee to improve itself from ranked friction/feedback — in the bee repository only, on the human's explicit invocation. Never auto-runs, never runs in a host repo, never pushes on its own.
metadata:
  version: '0.1'
  ecosystem: bee
  dependencies:
    nodejs-runtime:
      kind: command
      command: node
      missing_effect: blocked
      reason: Ranks the feedback digest via the vendored .bee/bin helpers.
```

**Section Summaries:**

- **Hard-Gate 0 — Prove you are in the bee repo** — Run guard: `test -f skills/bee-hive/templates/lib/feedback.mjs && test -f skills/bee-writing-skills/SKILL.md`. Only the bee *development* repo has this. A host repo's vendored `.bee/bin/` copy does NOT make it the bee repo. Refuse and stop if guard fails. No exceptions for deadlines, trust, or branches.

- **Step 1 — Rank the Feedback** — Run `bee_feedback.mjs rank --json` with merged view (local digest + configured `dogfood_repos`, revalidated and datamarked). This is the ONLY feedback surface to consume. Never open foreign `.bee/` files directly—trust boundary lives in `mergeDigests`.

- **Gate A — Human Chooses What to Fix** — Render top clusters with representative stored title (byte-for-byte, foreign titles wrapped in datamarks « » as stored), rank terms (pain × frequency × corroboration), and source ids. STOP and wait. Human picks one item to fix or stops. No pre-auth ("you have my trust" delegated effort, not decision). Rank is agenda, not decision. No retroactive sign-off after starting the fix.

- **Step 3 — The Fix (Iron Law Handoff)** — Hand chosen item to `bee-writing-skills` skill with its full discipline (failing pressure test RED first, then minimal change, then re-test GREEN). bee-evolving itself NEVER implements inline—it is the loop conductor, not editor.

- **Step 4 — Suites Green** — Run repo's recorded verify: `node skills/bee-hive/templates/tests/test_lib.mjs && node skills/bee-hive/scripts/test_onboard_bee.mjs`. Require green before Gate B. Red suite returns to step 3. Never weaken an assertion to get green.

- **Gate B — Human Reviews the Diff** — Show complete diff (every changed file, full) and STOP and WAIT for explicit approval of *this* diff. Gate B is per-diff, cannot be pre-granted. Standing rule/size threshold/green suite/plan approval ≠ Gate B. Green suite proves the change matches tests, not that human approved bee self-rewrite. No push-then-review (unreviewed change already left the machine).

- **Step 6 — Push (Manual Named Step)** — Only after explicit Gate B approval, push—and announce it ("Pushing now, per your Gate B approval"). Push is NEVER automatic. No scheduler/runbook/cron ever authorizes push of unreviewed self-modification. No gate B approval this session → diff stays local, staged, reported awaiting review (successful outcome, not failure).

- **Hard Gates & Red Flags** — Never run this loop outside bee repo. Never read foreign `.bee/` files directly. Never render cluster key (datamark-stripped form) to human. Never implement before Gate A human pick. Never fix inline; always hand off to bee-writing-skills. Never push without explicit Gate B diff approval. Never treat green suite / standing rule / plan approval as Gate B. This skill runs by human invocation only, never by trigger/schedule.

**References:** None beyond SKILL.md (the gate discipline and skill routing are self-contained).

**Line count:** 162 lines

---

## bee-executing

**Files in skill directory:**
```
agents/openai.yaml
CREATION-LOG.md
references/worker-details.md
SKILL.md
```

**SKILL.md Frontmatter (lines 1–14, 154 total lines):**
```yaml
name: bee-executing
description: >-
  Implement, verify, and cap exactly one parent-assigned cell as a worker. Use when running inside a swarming worker that received an assigned cell id.
metadata:
  version: '0.1'
  ecosystem: bee
  dependencies:
    nodejs-runtime:
      kind: command
      command: node
      missing_effect: unavailable
      reason: Workers read, verify, and cap cells through the vendored .bee/bin helpers.
```

**Section Summaries:**

- **Worker Loop (9 steps)** — Initialize (read status, cell, AGENTS.md) → Accept assigned cell (claim it; return NOOP/BLOCKED if missing/ambiguous/deps uncapped/locked-decision conflict) → Reserve (every file before writing) → Implement (read first, match patterns, cited decisions; auto-fix bugs/critical functionality/blocking issues; checkpoint package installs; BLOCKED on architectural change) → Verify (run exact verify command, record output; fix root cause; two failures + Advisor Consult protocol per D1) → Advisor Consult (when dispatch has Advisor line AND first verify failure; max 2 consults per claim; evidence bundle inline; always rerun real verify after advice) → Cap (after verify pass recorded; one commit per cell with cell id) → Release (reservations) → Return (status token + report).

- **Deviations** — Found bug in touched code → auto-fix + record. Missing critical functionality → auto-add + record. Blocking issue (broken import, type error in path) → auto-fix + record. Architectural change needed → BLOCKED with proposal (never redesign inside a cell).

- **Advisor Consult (D1)** — Trigger: dispatch has Advisor line AND first serious verify failure. Max 2 consults per claim. Loop: fail 1 → consult 1 → retry → (fail) → consult 2 (follow-up) → final retry → (fail) → BLOCKED with Consults section. Transport: model-shaped (via Agent tool with exact `advisor-consult <cell-id>: <model>` description prefix for A2 attribution), cli-shaped (command with evidence on stdin), or transport error (burns one budget slot max, never retried). Evidence bundle: exact failing command, failing output, diagnosis, relevant file excerpts, CONTEXT.md path—inline in prompt or stdin, never `/tmp` paths, no secrets/env.

- **Verification Evidence (behavior_change cells)** — Mandatory; `cap` refuses without it. Pipe via `--evidence-stdin` (no file written to reports/). Includes tests inspected, tests added/changed, red-failure/before-state evidence, verification run. Lands in cell trace (decision 0009 — trace is single source).

- **Cap Trace Depth by Lane** — tiny = one-line outcome; small = outcome + files_changed; standard = outcome + files_changed + deviations + friction (when triggered); high-risk = all above + behavior_change evidence if applicable.

- **Friction Triggers** — Record friction only when a named trigger fires (verbatim triggers in worker-details.md reference).

- **Hard Gates & Red Flags** — Never edit outside reserved scope. Never self-select cells or handle more than one. Never wait silently (return status). Never cap without recorded verify pass or use substitute verify command. Never record `--passed true` with no output. Never leave files empty on cap. Never install packages without checkpoint. Never leave reservations unreported. Never reinterpret locked decision to fit cell. Never consult without Advisor line in dispatch (except it stays inside worker's own turn, never asking parent). Never dispatch advisor consult without exact `advisor-consult <cell-id>: <model>` prefix (breaks A2 attribution). Never treat advisor advice as substitute for fresh verify output.

**References:**
- `worker-details.md` — Expanded commands (bee_status, bee_cells show/claim/verify/cap, bee_reservations, bee_decisions active), trace tiers by lane, friction triggers (verbatim list), result field spec, evidence format example. Covers parent context, assigned cell check protocol, expanded commands syntax, trace requirements per lane, friction recording conditions.

**Line count:** 154 lines

---

## bee-exploring

**Files in skill directory:**
```
agents/openai.yaml
CREATION-LOG.md
references/context-template.md
references/gray-area-probes.md
SKILL.md
```

**SKILL.md Frontmatter (lines 1–9, 99 total lines):**
```yaml
name: bee-exploring
description: >-
  Turn a fuzzy feature request into locked decisions in docs/history/<feature>/CONTEXT.md. Use when a request has gray areas or unstated product decisions that would make planning guess. Not for implementation research, cell creation, or code.
metadata:
  version: '0.1'
  ecosystem: bee
  dependencies: []
```

**Section Summaries:**

- **Step 1 — Scope** — Classify: Quick / Standard / Deep. Read critical-patterns.md and `.bee/state.json` if present. If multi-subsystem, pick one, defer rest. Flip `docs/backlog.md` row to in-flight (or create proposed row first, then flip). Run command detection if `.bee/config.json` lacks `commands`; present candidates as confirmation question, write only user-confirmed values.

- **Step 2 — Domain** — Classify domain types: SEE (user-visible surface), CALL (API/CLI/webhook/SDK), RUN (job/script/service/pipeline), READ (docs/emails/reports/notifications), ORGANIZE (data model/file layout/taxonomy/config). Load gray-area-probes.md; pick only relevant probes.

- **Step 3 — Gray Areas** — Generate 2–4 unstated *product* decisions future planning would guess. Quick scout only (one keyword pass, read 2–3 relevant files). Cite existing patterns found ("today, exports go through `src/report/csv.ts`—should this follow that?"). Exclude implementation choices, performance tuning, new scope.

- **Step 4 — Socratic Locking** — One concise per-message question, outcome-framed, standard CONTEXT/QUESTION/RECOMMENDATION/options format. Materality test (P20): every candidate question is material (answer changes scope/architecture/UX/data model/acceptance criteria), grounded (cites scout evidence or concrete uncertainty), answerable (user can pick option or approve default). Blindspot pass (P9): when user signals unfamiliarity, explain 2–3 concepts first, then ask. SEE mock exception (P11): may build throwaway HTML mock (2–4 variants, fake data, zero wiring) under `.bee/spikes/<feature>/mocks/`; cite chosen variant, never import by production, never promote beyond spike. Lock each decision with D-ID; when an answer settles a fuzzy term, confirm it like a decision (Context Assembly writes pinned terms into CONTEXT.md Terms section).

- **Step 5 — Context Assembly** — Write `docs/history/<feature-slug>/CONTEXT.md` from context-template.md. Include boundary, domain types, locked decisions table with D-IDs, pinned terms, scout paths, canonical references, open questions, deferred ideas. Concrete language only, no placeholders/TODOs/vague preferences. Spawn fresh-eyes reviewer (background, non-history) to check completeness, contradictions, vague decisions, missing D-IDs, blockers. Fix findings, max two loops, present remaining doubts to user. Deferred Ideas also feed product backlog: each real future work entry appends `proposed` row to `docs/backlog.md` (announce-then-do).

- **Step 6 — State and Handoff** — Update state via `bee_state.mjs set --phase exploring-complete`. Present Gate 1 per Gate Presentation Contract: plain-language layer in chat (what we decided / why trustworthy / cost if wrong / what you are deciding) + CONTEXT.md linked, then verbatim "Decisions locked. Approve CONTEXT.md before planning?"

- **Hard Gates & Red Flags** — Never bundle questions or answer your own question. Never ask a question failing materiality test. Never deep-dive implementation/architecture. Never create cells or write code (except throwaway `.bee/spikes/` SEE mocks per decision 0020). Never import SEE mock into production. Never skip teaching when user is guessing—a decision from a guess is fake. Never conflate implementation choice with a decision. Never absorb scope creep (defer instead). Never skip fresh-eyes review or CONTEXT.md assembly. Never lock decisions from implication alone.

**References:**
- `gray-area-probes.md` — Domain probe templates across five domain types (SEE, CALL, RUN, READ, ORGANIZE), each with 4–6 outcome-framed decision probes. Teaches outcome-framing, avoids generic preference, grounds decisions in observable user behavior.
- `context-template.md` — Structure for CONTEXT.md: boundary, domain types, locked decisions table (D-IDs), pinned terms, scout paths, canonical references, open questions, deferred ideas. No placeholders; concrete language only.

**Line count:** 99 lines

---

## bee-grooming

**Files in skill directory:**
```
agents/openai.yaml
CREATION-LOG.md
references/grooming-reference.md
SKILL.md
```

**SKILL.md Frontmatter (lines 1–14, 104 total lines):**
```yaml
name: bee-grooming
description: >-
  Hunt and kill tech debt IN THE CURRENT PROJECT — dead code, stale docs, TODO/stubs, duplication, drifted specs — reported in plain project language. bee's own housekeeping (the entropy score) is a short side-note, and `.bee/`, `.claude/`, `.codex/` are never treated as project debt. Use when the user asks to clean up, find debt, or audit the repo.
metadata:
  version: '0.1'
  ecosystem: bee
  dependencies:
    nodejs-runtime:
      kind: command
      command: node
      missing_effect: degraded
      reason: Computes the entropy score from bee records via the vendored .bee/bin helpers.
```

**Section Summaries:**

- **Scope — the Project, Not the Harness** — Audit current project source, docs, tests in plain language ("three unused functions in export module," not "orphaned cells"). OUT of scope: `.bee/`, `.claude/`, `.codex/`, `AGENTS.md` bee block, vendored `.bee/bin/`, `node_modules/`, build output, lockfiles, generated directories. Genuine bee/harness bug → one-line "report upstream to bee" note (not a project kill). Hunt list delegates as I/O-tier workers for mechanical scans.

- **Step 1 — Hive Housekeeping (Entropy Score)** — Computes bee's own bookkeeping tidiness (loose cells, stale reservations, un-synced specs), not project code health. Formula: `orphaned_cells ×10 + unverified_cells ×5 + stale_decisions ×5 + stale_specs ×5 + backlog-without-outcome ×2 + stale_work ×3 + broken_tools ×8`, capped 100. Bands: 0=perfect, 1–25=healthy, 26–50=attention, 51–100=action. Report score AND trend versus last audit (previous `entropy-audit` entries in `.bee/backlog.jsonl`). Two or three lines max; main effort goes to project hunt.

- **Step 2 — Hunt the Project's Debt** — Check friction clusters, dead code/unused exports, stale docs vs code, stale/missing/duplicated area specs, TODO/stub debris, broken verify-commands, superseded-but-cited decisions, slop patterns (empty catches, redundant `return await`, dead flags, copy-paste drift). Prove non-use before calling anything dead (dynamic imports, reflection, config-driven loading, external callers all count as use). Never claim "obviously dead" without proof.

- **Step 3 — Propose** — Each kill candidate becomes backlog item: pain / predicted impact / risk lane (tiny or small). Rank by pain × impact; present top few (never dump 30 raw candidates). MANDATORY user approval before any deletion. No approval, no kill—regardless of obviousness.

- **Step 4 — Execute** — Approved kills run as tiny/small cells through bee-executing worker loop (reserve, verify, cap). Grooming never edits files directly. One approved kill per cell; approval of one kill ≠ approval of related neighbors—never batch unapproved kills into an approved cell.

- **Step 5 — Close the Loop** — Record actual outcome vs prediction: `bee_backlog.mjs add --type kill-outcome`. Prediction wrong? That is signal, not embarrassment. Feed durable lessons to bee-compounding (grooming that never learns just mows the same grass).

- **Hard Gates & Red Flags** — Never treat `.bee/`, `.claude/`, `.codex/`, or vendored helpers as project debt—harness is out of scope. Never present bee/harness bug as project kill (one-line report-upstream note only). Never use bee-jargon in findings (cells, traces, capCell)—use plain project language. Never let hive housekeeping dominate the report; project hunt is the main event. Never delete anything without recorded user approval. Never claim "obviously dead" without proof. Never batch multiple kills into one approved cell. Never edit files directly; dispatch cells. Never dump every candidate; rank by pain × impact. Never skip actual-outcome record after execution. Never report score without trend.

**References:**
- `grooming-reference.md` — Entropy computation rules and source-field mapping, hunt checklists by category (friction clusters, dead code proof, stale docs, stale specs, Fresh Session Test five questions), proposal/outcome template format. Counts entropy terms from `.bee/` records only; never guesses. Lists plain-language project findings format with examples.

**Line count:** 104 lines

---

## bee-hive

**Files in skill directory:**
```
agents/openai.yaml
CREATION-LOG.md
references/go-mode.md
references/routing-and-contracts.md
scripts/onboard_bee.mjs
scripts/test_onboard_bee.mjs
templates/AGENTS.block.md
templates/bee_backlog.mjs
templates/bee_capture.mjs
templates/bee_cells.mjs
templates/bee_decisions.mjs
templates/bee_feedback.mjs
templates/bee_reservations.mjs
templates/bee_reviews.mjs
templates/bee.mjs
templates/bee_state.mjs
templates/bee_status.mjs
templates/lib/backlog.mjs
templates/lib/capture.mjs
templates/lib/cells.mjs
templates/lib/command-registry.mjs
templates/lib/commands_detect.mjs
templates/lib/decisions.mjs
templates/lib/feedback.mjs
templates/lib/fsutil.mjs
templates/lib/guards.mjs
templates/lib/inject.mjs
templates/lib/reservations.mjs
templates/lib/reviews.mjs
templates/lib/state.mjs
templates/lib/validate-args.mjs
templates/statusline/statusline-command.sh
templates/statusline/statusline-usage.mjs
templates/tests/test_bee_cli.mjs
templates/tests/test_bee_write_guard_hook.mjs
templates/tests/test_lib.mjs
SKILL.md
```

**SKILL.md Frontmatter (lines 1–14, 194 total lines):**
```yaml
name: bee-hive
description: >-
  Bootstrap and route the bee workflow: gates, state, and the next skill. Use when starting or resuming any bee session, choosing the next bee skill, running go mode, checking onboarding state, or enforcing workflow gates.
metadata:
  version: '0.1'
  ecosystem: bee
  dependencies:
    nodejs-runtime:
      kind: command
      command: node
      missing_effect: unavailable
      reason: Onboarding and the vendored .bee/bin helpers run in Node.js 18+.
```

**Section Summaries:**

- **Onboarding** — Run Node check, then `node scripts/onboard_bee.mjs --repo-root <repo-root> --json`. Inspect result: `up_to_date` → continue; `changes_needed` → summarize plan to user, ask approval, re-run with `--apply` (never silent); `blocked_downgrade` → surface versions, only pass `--force-downgrade` on explicit user instruction with all three versions resolved numeric (an `unknown` is never forceable); `blocked_no_source` → fail-closed, surface it, resolve source before retry. Every `--apply` also syncs global bee skills (`~/.claude/skills/bee-*`) same version as vendored. Skill-stage items carry `scope: installed | source`; legacy items (AGENTS.md, `.bee/` runtime, vendored helpers) are repo-relative. Recheck honesty (D5): after `--apply`, if skill-sync still blocked, `recheck` reports that (can never read `up_to_date` if skill stage blocked). Greenfield init lane (P1): first onboard, offer one init cell whose must-haves are setup from scratch, one passing test, standard commands in `.bee/config.json`, clean first commit.

- **Session Scout** — After onboarding succeeds, run read-only `bee_status.mjs --json` on session start and after compaction. Orient on onboarding health, phase, mode, feature, gate states, cell counts, active reservations, staleness warnings, `recommended_next`. Baseline gate: if `.bee/config.json` records `commands.verify`, run it once per session before claiming cells—red baseline is surfaced, becomes its own fix-first tiny cell. Never build on red. HANDOFF protocol: if `.bee/HANDOFF.json` exists, present phase/feature/cells in flight/next action and WAIT (never auto-resume). Capture queue: when `bee_status` reports pending capture stubs, offer flush before new work (N specs awaiting merge—flush now or after current task?). Review candidates: `bee_status --json` carries review block (counts by status, open sessions). When `high_risk_unreviewed > 0`, surface plainly (hard-gate change unreviewed—state merge/release consequence, offer review). Read `docs/history/learnings/critical-patterns.md` and surface recent active decisions (`bee_decisions.mjs active --recent 3`). State layer: when `docs/specs/` exists, note it. Before working in any area, reading order is spec → decisions → history. When missing `system-overview.md` or `reading-map.md`, offer `bee-scribing` bootstrap pass (user-approved, never silent/auto-run).

- **Routing Table** — Vague/new feature → bee-exploring. Research task / clear scope → bee-planning. Small clear fix → bee-planning (tiny/small mode). Docs/spec/README/sample-only → docs lane. Review request (explicit) → bee-reviewing. Merge/ship/release unreviewed/stale candidates → report count+risk, ask ONE question "Create review session for this scope?" (only explicit yes dispatches bee-reviewing). Document screen/API/job/area / ghi lại rule / keep settled outcome / spec legacy feature → bee-scribing. (Re)generate/read implement plan → bee-briefing. Clean up / debt / audit → bee-grooming. Capture learnings → bee-compounding. Author/edit bee skill → bee-writing-skills. Evolve bee from dogfood feedback → bee-evolving. `/go` or full pipeline → go mode. Resume → surface HANDOFF, wait. When in doubt, invoke bee-exploring first.

- **Modes and Lanes (Mode Gate — Mechanical)** — Count risk flags: auth, authorization, data model, audit/security, external systems, public contracts, cross-platform, existing covered behavior, weak proof, multi-domain. Classify: docs (all files are knowledge, not runtime), tiny (0–1 flags, ≤2 files, no API/data change, one direct task), spike (one yes/no proof decides plan reality), small (0–1 flags, ≤3 files, no gray areas), standard (2–3 flags or story-sized behavior), high-risk (4+ flags OR any hard-gate flag). Ceremony scales with lane, never memory.

- **Ceremony Scaling by Lane** — docs: no cells/gates/reviewers, format check only; tiny: short plan note, 2-minute reality check inline, direct in-session, merged shape+execution gate question, self-review+done-report closes; small: short plan, inline reality gate+matrix, direct in-session, self-checks close; standard: full plan, plan-checker+cell reviewer, swarm workers, on-request review only; high-risk: plan+brief, persona panel, swarm workers, on-request review only. Review is on-demand only (decision 565e68d0); no lane auto-dispatches reviewer wave after execution. Gate 4 is additive (when review session actually runs), never automatic.

- **The Four Gates** — Gate 1 "Decisions locked. Approve CONTEXT.md before planning?", Gate 2 "Work shape is ready. Approve before current-work preparation?", Gate 3 "Feasibility validated. Approve execution?", Gate 4 "P1 > 0 → P1 findings block merge, fix before proceeding? : P1 = 0 → Review complete. Approve merge?". Never skipped/batched/self-approved (exception: opt-in gate-bypass switch auto-approves Gates 1-3 for normal-lane work only; high-risk/hard-gate/Gate 4 UAT/privacy always stop). Gate 4 lives only inside user-invoked review session, never after any lane's execution automatically. Presentation: chat message is plain-language layer only (what I'm about to do / why trustworthy / if it goes wrong / what you are deciding) + fixed question + mechanical reports linked. Litmus: user can restate approval in their own words.

- **Priority Rules (Hive Law)** — P1 review findings always block. Context budget at ~65%, write HANDOFF.json and pause. CONTEXT.md is source of truth; locked decisions cited, never reinterpreted. Gate 3 is critical execution approval; no source-editing before it. Failed reality gate or NO spike halts pipeline, returns to planning. Never skip validating (tiny collapses to 2-min reality check, not disappears). critical-patterns.md and recent active decisions mandatory before planning/executing. Evidence before claims: "done/passing/fixed" requires fresh command output same message. Lanes scale ceremony, never memory; capped `behavior_change` cell obliges bee-scribing sync in every lane, and settled outcomes (rule/behavior/tuned value) captured moment they settle (settlement detection is agent's duty, unprompted). Same-turn capture lane-scaled: high-risk = full spec sync inline; other lanes = decision log + one-line capture stub + full merge at flush point. Agent runs machinery, not user (every bee command run by agent moment called for, never printed for user). Silent bookkeeping—work language only (decision 1689af1b); bee mechanics never narrated, only work in user's terms (fixing X, done—tests pass). Never hand-edit `.bee/*.json(l)` (every mutation through CLI verb).

- **Runtime Files** — `.bee/onboarding.json` (status/versions), `.bee/state.json` (phase/mode/feature/gates/workers), `.bee/config.json` (hook toggles/lanes/capabilities), `.bee/HANDOFF.json` (pause/resume), `.bee/reservations.json` (file reserves), `.bee/decisions.jsonl` / `.bee/backlog.jsonl` (decision log / friction), `.bee/capture-queue.jsonl` (settlement stubs), `.bee/cells/<id>.json` (cell traces), `.bee/bin/` (vendored helpers + lib), `docs/history/<feature>/CONTEXT.md` (source of truth), `docs/history/learnings/critical-patterns.md` (mandatory pre-work read), `docs/specs/<area>.md` + `reading-map.md` (state layer owned by bee-scribing).

- **Hook Response Protocol** — `@@BEE_PRIVACY@@…@@END@@` marker on read → route via AskUserQuestion. Intake block → do not retry, run bee-hive routing now. Gate-guard block on write → do not retry, surface Gate 3 question. Reservation block → worker returns BLOCKED with conflict. `bee decision review` nudge at session end → ask user whether durable decision/learning emerged.

- **Hard Gates & Red Flags** — Docs-only change routed through full pipeline. Jumping exploring to swarming. Code before CONTEXT.md. Skipping validating. Ignoring locked decisions. Workers self-selecting cells. Capping without verification. Commits without cell ids. Continuing past open P1s. Reservation leaks. Stale state.json after phase transition. Resuming without surfacing HANDOFF.json. Plausibility language accepted as evidence. Tiny fix wearing epic ceremony. Hard-gate change routed below high-risk. Session history pasted into worker dispatch. Gate presented as mechanical table with no plain-language layer. Gate question user cannot restate. Bee command handed to user to run instead of run by agent. Bee bookkeeping narrated into chat instead of work itself.

**References:**
- `go-mode.md` — Full pipeline flow: automatic routing from `bee-exploring` through planning → validating → swarming → reviewing (user-invoked) → scribing → compounding. State machine, gate sequence, when each skill is invoked, when pipeline halts for user decision.
- `routing-and-contracts.md` — Skill catalog (13 skills: bee-hive through bee-bypass-gate), first-skill routing table, state bootstrap protocol, session scout sequence, gate presentation contract, delegation contract (D2/D3 I/O-tier workers, extraction/generation/ceiling tiers). Gate Presentation Contract explains plain-language chat layer + linked reports + litmus test. Silent Bookkeeping rule (decision 1689af1b). Covers authority-type blocks (privacy, intake, gate-guard, reservations).

**Line count:** 194 lines

---

## Summary Table

| Skill | Files (count) | SKILL.md Lines | Key Surfaces | Delegation Tier |
|---|---|---|---|---|
| bee-briefing | 6 | 148 | implement-plan.md, walkthrough.md projection/refresh mode | generation (authored sections) + I/O (projection walks) |
| bee-bypass-gate | 3 | 64 | .bee/config.json gate_bypass toggle | none—self-contained config write |
| bee-compounding | 4 | 140 | learnings file, critical promotions, friction backlog, digest refresh | generation (orchestration) + I/O (gather/analyze/digest) |
| bee-evolving | 3 | 162 | feedback digest rank, Gate A/B, bee-writing-skills handoff, push gate | generation (orchestration) + none (no file writes outside skill handoff) |
| bee-executing | 4 | 154 | cell cap, trace, report, verify evidence, advisor consult protocol | none—worker is terminal execution node |
| bee-exploring | 5 | 99 | CONTEXT.md, gray-area probes, fresh-eyes review, Gate 1 | generation (fresh-eyes reviewer, synthesis) + I/O (scope/scout/assembly) |
| bee-grooming | 4 | 104 | entropy score, kill proposals, outcome records, backlog entries | generation (orchestration) + I/O (hunt/scan/entropy compute) |
| bee-hive | 39 | 194 | routing table, mode gate, four gates, onboarding, state bootstrap, runtime files | generation (orchestration/routing) + I/O (onboarding/detection/status reads) |

---

**End of Inventory**

All 8 skills fully cataloged with file manifests, verbatim frontmatter, section summaries, reference file descriptions, and line counts. Total documentation reviewed: 1,129 lines of SKILL.md across the 8 skills + 39 vendored helper/template/reference files under bee-hive.
