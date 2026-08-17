---
name: bee
type: living-doc
url: local (cloned snapshot at upstreams/bee/skills/ + upstreams/bee/AGENTS.md — see distillery.md Pointers); real upstream now https://github.com/thanhsmind/beegog (project renamed bee -> beegog, Rust core added)
local: upstreams/bee (stale, unrefreshed since 2026-07-28 — real current checkout is /home/vantt/projects/beegog, pulled fresh 2026-08-17)
last_analyzed_version: v2.7.0 (git tag, 2026-08-17 scoped pass) — prior cursor v1.18.3 was 1213 commits / ~3 weeks behind at re-check time
last_analyzed_date: 2026-08-17
domains_covered: [harness, skills, hooks, workflow, orchestration, routing, integration-contract, context-memory, planning, quality-gates, docs-style, tooling, config-packaging, repo-layout, safety, self-improvement, ux, testing-evals]
---

# bee — Feature Index

> Re-extracted at bee v1.18.3 on 2026-07-28 (prior cursor: v1.3.9,
> 2026-07-18 — a 15-version gap with no changelog available, so this pass
> treats the current snapshot as accumulated truth per distill's delta
> discipline rather than replaying history). Source: a cloned snapshot of
> the 18 `bee-*` skill dirs + the `AGENTS.md` bee operating block, taken
> from the forgent-workshop project (`upstreams/bee/`, gitignored, re-clone
> to refresh). bee grew substantially in this window: 3 entirely new skills
> (`bee-herding`, `bee-qualifying`, `bee-context-locking`), a new
> `docs/knowledge/` bundle state-layer superseding `docs/specs/` as primary
> truth, a model-tier system with pinned agent types, and a proof-tier/
> test-economy system replacing the old blanket red-first rule. Full
> mechanical inventory (much deeper than this curated index): 3 group
> reports at `docs/distillery/reports/distill-bee-inventory-2026-07-28-group-{a,b,c}.md`,
> plus the original `docs/distillery/reports/distill-bee-inventory-2026-07-18.md`.
> **Domain-taxonomy proposal — resolved 2026-07-28 (user):** `bee-herding`
> (autonomous multi-pane/worktree dispatch+merge loop) genuinely spans
> several facets at once — orchestration, TUI/pane automation, fleet
> automation, unattended-ops — user confirmed all of these read as correct
> simultaneously, none wins as *the* single domain. Left filed under
> `orchestration` below (no `taxonomy.txt` edit); a one-kebab-case-domain-
> per-line taxonomy doesn't fit a concern this multi-faceted anyway. It's a
> different shape of concern (cross-session/cross-process automation) than in-session
> fan-out tiering.

> **SCOPED delta pass at v2.7.0 on 2026-08-17 (tsk-37i, triggered by a
> citation-discipline discussion, not a scheduled full re-scan) — NOT a
> full re-inventory.** Version-check correction: the request that triggered
> this pass assumed bee had "released to 0.2.x" — real state per
> `git tag`/`git log` on the live upstream (`/home/vantt/projects/beegog`,
> remote `https://github.com/thanhsmind/beegog`) is tag `v2.7.0`, and the
> local `upstreams/bee/` snapshot this file describes was **1213 commits**
> behind origin/main at check time (last synced 2026-07-28; this session
> pulled the `beegog` checkout fresh to close that gap for research
> purposes, `upstreams/bee/` itself is untouched). No `v0.2.x` tag exists
> anywhere in the project's history. Between v1.18.3 and v2.7.0 the project
> changed shape, not just version: renamed bee → beegog, gained a Rust core
> (`packages/bee-rs/`, `crates/`) alongside the original Node package, and
> `docs/knowledge/` (announced as new at v1.18.3) is now the primary,
> heavily-populated state layer with dozens of `areas/*.md` concept files —
> a 1213-commit gap is not safely treated as "accumulated truth" the way
> distill's delta discipline handled the 15-version gap above; this pass
> deliberately reads only the two `docs/knowledge/areas/` concepts directly
> relevant to the triggering question (decision citation/reversal
> discipline, instruction-text citation discipline) rather than claiming
> the same accumulated-truth coverage the 1.18.3 pass claimed. **A full
> re-distill of beegog v2.7.0 is a separate, larger task this pass does not
> attempt** — flagged as an open gap below, not silently skipped.

## harness

### skill-chain-onboarding
- **What:** A meta-skill (`bee-hive`) verifies onboarding state (`up_to_date` / `changes_needed` / `blocked_downgrade` / `blocked_no_source`) and syncs the versioned skill bundle into two host roots per apply — `<repo>/.claude/skills/bee-*` and `<repo>/.agents/skills/bee-*` — with an optional legacy global-skills target.
- **Where:** `.claude/skills/bee-hive/SKILL.md`, `AGENTS.md`
- **Notable:** "Forced-apply transparency" and "recheck honesty" give blocked-first precedence across every sync target, so a partially-applied update never reports success.
- **Keywords:** onboarding, skill sync, dual-root apply, blocked-first
- **Seen:** 1.3.9

### session-scout-status
- **What:** `node .bee/bin/bee.mjs status --json` is the mandatory first read of every session: onboarding health, phase, mode, feature, gate state, cells, reservations, staleness, and a `recommended_next` action, surfaced in the session preamble.
- **Where:** `AGENTS.md`, `.claude/skills/bee-hive/SKILL.md`
- **Notable:** Baseline-gate rule: if `commands.verify` is recorded, it runs once per session before any cell is claimed — a red baseline becomes its own fix-first cell rather than something built on top of.
- **Keywords:** status --json, recommended_next, baseline gate
- **Seen:** 1.3.9

### hook-as-safety-net-not-authority
- **What:** Critical rule 12: the workflow's law lives in the document (AGENTS.md), not in whichever hook happens to enforce it this runtime. "I'll try the edit; if the hook blocks me, I'll route through bee" is explicitly named as an inverted contract — an unblocked write is never treated as an approved write.
- **Where:** `AGENTS.md`
- **Notable:** Grounded in a documented real failure (decision c2c46488): a closed feature left its phase terminal with gates still approved, no hook branch fired, and post-feature source edits walked through untouched. The rule closes that exact hole rather than a hypothetical one.
- **Keywords:** hook safety net, guard hole, decision c2c46488
- **Seen:** 1.3.9

### knowledge-bundle-state-layer
- **What:** A new `docs/knowledge/areas/<area>/` concept bundle supersedes `docs/history/`+`docs/specs/` as the primary state layer, gated by a single predicate `bundleMode(root)` (true only when the dir exists AND ≥1 concept actually parses — "a directory alone is not a bundle"). Reading order with a bundle: `bundle → decisions → history`; `docs/specs/` becomes a read-only compat surface resolving legacy `docs/specs/<area>.md#R7` citations through a pointer stub, never a write target (a fence script fails the chain on new prose there). No-bundle repos keep the old `spec → decisions → history` order unchanged.
- **Where:** `AGENTS.md` (Working files), `bee-hive/SKILL.md` §Session Scout, `bee-scribing/SKILL.md` §Modes.
- **Notable:** A dual-topology design that lets old repos keep working exactly as before (the compat fence never fires there) while new repos get a queryable concept graph instead of hand-maintained specs — migration is opt-in, never forced.
- **Keywords:** bundleMode, docs/knowledge, compat surface, G1-G4
- **Seen:** 1.18.3

### multi-session-etiquette
- **What:** Cross-session coordination primitive (critical rule 13, entirely new): coordinate through lanes/claims/**holds**, never around them. A hold-deny names the holder and its expiry; `bee cells claim-next` skips held paths so another session just picks different open work instead of blocking. New feature work in an occupied checkout routes through `bee worktree new`/`bee worktree merge`; docs/tiny/release work stays in main ("release always runs in main").
- **Where:** `AGENTS.md` critical rule 13, `bee-hive/SKILL.md` §Routing (worktree routing, D9/D9a).
- **Notable:** Worktree merge-back is a semantic-conflict gate, not just a git operation — the merge is staged uncommitted (`git merge --no-ff --no-commit`) and the configured verify runs against the staged tree *before any commit exists*; a red verify aborts the stage leaving main byte-untouched (explicitly not a rollback, since nothing was ever committed).
- **Keywords:** multi-session, holds, worktree merge-back, semantic-conflict gate
- **Seen:** 1.18.3

### ci-owned-verify-gate
- **What:** Evolved from the old "local baseline-verify-once-per-session" rule. Now: check the latest full-verify CI run on the base branch (+ any open `verify-red` issue) before the session's *first* `cells claim` — never a local run. The dev loop only runs impacted tests (`commands.test` / `run_verify.mjs --impacted[-from-git]`); the full `commands.verify` chain is CI-owned on the project's own cadence and auto-files `verify-red` on red. A no-test repo declares itself via the sentinel `commands.verify: "none"`.
- **Where:** `AGENTS.md` critical rule 14, `bee-hive/SKILL.md` §Priority Rules (CI status gate).
- **Notable:** Direct rationale shift from "cheap to run locally" to "CI-owned, dev-loop-scoped" — the old 60-90s local run is explicitly retired as the trigger moves from session-arrival to first-claim.
- **Keywords:** CI status gate, impacted tests, verify-red issue, no-test sentinel
- **Seen:** 1.18.3

### native-codex-empty-wait-contract
- **What:** A new ordered-wait discipline for tending native Codex CLI subagents alongside Claude Code ones (full text lives in `bee-hive/references/routing-and-contracts.md`) — dual-runtime tending was not a concern at v1.3.9.
- **Where:** `AGENTS.md` (after critical rules).
- **Keywords:** dual runtime, Codex tending, ordered wait
- **Seen:** 1.18.3

## skills

### skill-authoring-iron-law
- **What:** "NO SKILL WITHOUT A FAILING TEST FIRST" — bee's own skills are written and edited under a literal RED → GREEN → REFACTOR discipline: 3-5 pressure scenarios (each combining ≥3 pressures) run WITHOUT the skill first, rationalizations are quoted verbatim, then the skill is written to close exactly those gaps, then all scenarios are re-run.
- **Where:** `.claude/skills/bee-writing-skills/SKILL.md`
- **Notable:** A "meta-testing technique" asks the agent "how could this skill have been written differently to make option A the only acceptable answer?" — using the model's own reasoning to find the weakest phrasing before it ships.
- **Keywords:** Iron Law, pressure scenario, RED GREEN REFACTOR, meta-testing
- **Seen:** 1.3.9

### skill-description-trap
- **What:** GREEN-phase checklist requires each skill's frontmatter `description` to be one short purpose clause plus "Use when...", explicitly never a workflow summary — a description that summarizes the whole workflow lets the calling model believe it already knows the content and skip reading the skill body.
- **Where:** `.claude/skills/bee-writing-skills/SKILL.md`
- **Notable:** Comes with an explicit ❌/✅ example pair, treating prompt-engineering failure modes (a model skipping context it thinks it already has) as a testable, documented anti-pattern rather than folklore.
- **Keywords:** description trap, frontmatter, skill body skip
- **Seen:** 1.3.9

### handoff-sentence-convention
- **What:** Every skill ends with a fixed-shape handoff sentence, `[Outcome]. Invoke bee-<next-skill> skill.` — a uniform, greppable chain-continuation contract enforced across all 15 skills.
- **Where:** `.claude/skills/bee-writing-skills/SKILL.md` (codifies it), present at the end of every `.claude/skills/bee-*/SKILL.md`
- **Notable:** Chain integrity by convention rather than by a shared runtime — each skill "hands off" in plain text the same way, so the next skill choice stays legible to a human reading the transcript.
- **Keywords:** handoff sentence, chain continuity
- **Seen:** 1.3.9

### persuasion-principles-in-skill-prose
- **What:** `bee-writing-skills` names 5 rhetorical techniques deliberately used in skill authorship, each mapped to what it's for: Authority ("YOU MUST", "Never") for discipline-enforcing rules; Commitment (ordered checklists) for multi-step processes; Scarcity ("Before proceeding") for verification requirements; Social Proof ("Teams report...") for common-failure warnings; Unity ("our skills") for collaborative technique framing. Cites "N=28,000 scale testing" claiming persuasion-optimized skills get 3-4× better agent compliance than plain instructions.
- **Where:** `bee-writing-skills/SKILL.md` (Persuasion principles table).
- **Notable:** Treats prompt rhetoric as a first-class, table-documented design tool rather than an incidental writing style — each rule type gets an assigned technique, not ad hoc phrasing.
- **Keywords:** persuasion, authority framing, N=28000
- **Seen:** 1.18.3

### dependency-metadata-mapping-shape
- **What:** Frontmatter `metadata.dependencies` must be a mapping keyed by dependency id (`{nodejs-runtime: {kind, command, missing_effect, reason}}`), never a YAML array of objects — "generic evaluators reject that shape." `missing_effect` values observed across all 18 skills: `unavailable` (hard-blocks), `degraded` (softens), `blocked` (bee-evolving only — stronger than degraded).
- **Where:** `bee-writing-skills/SKILL.md` (SKILL.md checklist).
- **Keywords:** dependency metadata, missing_effect, frontmatter shape
- **Seen:** 1.18.3

## hooks

### privacy-marker-gate
- **What:** Secret-shaped file reads (`.env*`, `*.pem`, `*.key`, `id_rsa*`, `*.p12`, `credentials*`, `secrets.*`) require explicit user approval; a `@@BEE_PRIVACY@@ … @@END@@` marker in tool output must be routed through a user question, never worked around.
- **Where:** `AGENTS.md`
- **Notable:** Stays a stop condition even under the most permissive `full` gate-bypass level — only the top `total` level lifts it, and that is treated as a deliberate, explicit choice by the human rather than a default.
- **Keywords:** privacy marker, secret-shaped files, bypass floor
- **Seen:** 1.3.9

### hook-equivalent-guardrails
- **What:** On runtimes without native hooks (e.g. Codex), the same guardrails are honored by the agent itself reading AGENTS.md: scout exclusions (`node_modules/`, `dist/`, `build/`, `vendor/`, `.git/objects`, …) and an "intake gate" that blocks source edits whenever the phase is `idle` or `compounding-complete`.
- **Where:** `AGENTS.md`
- **Notable:** The intake gate keys off *phase*, not gate-approval flags — a finished feature keeps its gates marked approved forever, so only the phase value tells you the door is actually shut; this is exactly the distinction the prior guard-hole incident (decision c2c46488) turned on.
- **Keywords:** hook-equivalent rules, intake gate, phase vs gates
- **Seen:** 1.3.9

### model-guard-hook
- **What:** A hook (`bee-model-guard`) denies dispatching a subagent that carries a `[bee-tier: generation|extraction|review]` marker with `subagent_type: "general-purpose"`, reason `generic-type-denied` — "precisely so this rule cannot be skipped by habit." A bare dispatch with neither a `model` param nor an anchored tier marker is also denied.
- **Where:** `bee-swarming/SKILL.md` (Tier-matched pinned agent types), `bee-validating/SKILL.md`.
- **Notable:** Structural enforcement replacing a prompt instruction — the whole point being that "never pair generic type with a tier marker" can't be forgotten mid-dispatch if the hook throws.
- **Keywords:** model-guard, generic-type-denied, tier marker
- **Seen:** 1.18.3

### docs-lane-write-guard-allowlist
- **What:** The `docs` lane's write-guard only allows `.bee/`, `docs/`, `plans/`, `AGENTS.md` as targets; a write outside it is blocked by the hook — the documented recovery is to fall back to the tiny fast path "instead of fighting the guard," not to force the write.
- **Where:** `bee-hive/SKILL.md` §Modes and Lanes (Docs lane full procedure).
- **Keywords:** write guard, docs lane, allowlist
- **Seen:** 1.18.3

## workflow

### phased-chain-with-four-gates
- **What:** A fixed skill chain — `bee-hive → bee-exploring [Gate1] → bee-planning → bee-briefing → [Gate2] → bee-validating [Gate3] → bee-swarming → bee-executing → bee-scribing → bee-compounding → (on request) bee-reviewing [Gate4]` — with a strict phase enum (`idle, exploring, planning, validating, swarming, reviewing, scribing, compounding, grooming, compounding-complete`) that refuses invented phase names.
- **Where:** `AGENTS.md`, `.claude/skills/bee-planning/SKILL.md`
- **Notable:** The phase-enum refusal is a state-machine integrity guard discovered from a real failure — an agent inventing a plausible-looking phase name would silently break downstream routing, so the enum is closed rather than open.
- **Keywords:** chain, phase enum, chain-integrity
- **Seen:** 1.3.9

### lane-scaling
- **What:** Six lanes (`docs`/`tiny`/`spike`/`small`/`standard`/`high-risk`) scale ceremony, not memory or rigor: `tiny`/`small` skip a separately-invoked bee-validating (reality check runs inline in planning) and skip spawning workers (solo execution in bee-swarming); `standard`/`high-risk` get the full validating→swarming pipeline and scale reviewer count.
- **Where:** `.claude/skills/bee-hive/SKILL.md`, `.claude/skills/bee-planning/SKILL.md`, `.claude/skills/bee-validating/SKILL.md`, `.claude/skills/bee-swarming/SKILL.md`
- **Notable:** Explicitly stated invariant: "lanes scale ceremony, never memory" — even a `tiny` cell that changes behavior still owes a spec sync in bee-scribing; only the process weight around it shrinks.
- **Keywords:** lane, mode gate, ceremony scaling
- **Seen:** 1.3.9

### gate-bypass-levels
- **What:** An opt-in, persistent autopilot dial in `.bee/config.json` (`gate_bypass`) with four levels — `off` (nothing auto-approved), `normal` (Gates 1-3 for non-hard-gate tiny/small/standard), `full` (also auto-approves high-risk/hard-gate Gates 1-3), `total` (auto-approves everything, including secret-file reads and Gate 4 review P1 findings).
- **Where:** `.claude/skills/bee-bypass-gate/SKILL.md`, `AGENTS.md`
- **Notable:** Modeled as a graduated, named, banner-announced dial rather than a silent boolean — `bee_status` and the session preamble print a loud level-specific `GATE BYPASS` banner whenever it's active, so the current automation posture is never invisible to the human even while nothing is stopping for them.
- **Keywords:** gate_bypass, autopilot levels, banner
- **Seen:** 1.3.9

### intake-classify-before-bootstrap
- **What:** Planning inverts its old ordering (D8): classify the lane FIRST from request text + at most 2 targeted file reads, only THEN do the lane-scaled bootstrap — "tiny work must not pay full context reads before it knows it is tiny." The mode gate also now **re-runs upward** the moment evidence demands escalation; de-escalation requires cited evidence (asymmetric).
- **Where:** `bee-planning/SKILL.md` §1.
- **Keywords:** intake ordering, D8, asymmetric escalation
- **Seen:** 1.18.3

### tiny-small-merged-gate-inverted-ordering
- **What:** For `tiny`/`small` lanes (D5): draft the cell(s) and run the 5-part inline reality check (MODE FIT/REPO FIT/ASSUMPTIONS/SMALLER PATH/PROOF SURFACE) **before** asking — never persist-then-preview. One merged question replaces Gates 2+3 ("Work shape + execution: I'm about to do X via Y, verified by Z. Approve?"); approval covers exactly the previewed packet and sets both `approved_gates.shape` and `approved_gates.execution` at once. Under bypass the question is skipped but the reality check still runs — "bypass changes only whether the question is asked, never whether the check runs."
- **Where:** `bee-planning/SKILL.md` §5.
- **Notable:** "Execution approval is never granted before the execution package exists" — closes a gap where a shape approval could be stretched to cover an unseen execution.
- **Keywords:** merged gate, D5, persist-then-preview
- **Seen:** 1.18.3

### unattended-triage-front-door
- **What:** New skill `bee-qualifying` — the pipeline's unattended entry point for a fresh/unclassified backlog item, standing in for exploring when no human is driving. 4 hard gates: never assess from raw backlog text (gather first), any hard-gate flag (auth/authorization/data-loss/audit-security/external-provider/validation-removal) always parks regardless of confidence, self-assessment is judgment over evidence never a keyword classifier, and auto-approval is coupled to the live `gate_bypass_level` config value — never to a verbal instruction to "act as if" the level were different ("only bee-bypass-gate changes the level").
- **Where:** `bee-qualifying/SKILL.md` (new skill, no v1.3.9 baseline).
- **Notable:** Runs only headless (no interactive mode exists for this skill at all) — a clear item auto-locks CONTEXT.md via bee-context-locking and advances; an ambiguous one gets parked into CONTEXT.md's Outstanding Questions with the backlog row flipped to `parked` in the same commit, then stops — a human later resumes it through ordinary bee-exploring, which loads the park brief instead of re-gathering.
- **Keywords:** bee-qualifying, unattended triage, hard-gate park
- **Seen:** 1.18.3

### single-writer-context-md-render
- **What:** New skill `bee-context-locking` — the single place `docs/history/<feature>/CONTEXT.md` gets written, serving both the human-interactive path (`bee-exploring`) and the automatic path (`bee-qualifying`). "It renders; it does not decide" — every locked-decision row comes from the caller's resolved input verbatim, never originated. Two modes: `lock` (write/refresh CONTEXT.md + fresh-eyes review, max 2 fix loops) and `park` (write evidence into Outstanding Questions + flip the backlog row to `parked`, same commit).
- **Where:** `bee-context-locking/SKILL.md` (new skill, no v1.3.9 baseline).
- **Notable:** Explicitly modeled on bee-briefing's "renders one artifact from truth artifacts, never originates" pattern — a cross-skill design-pattern citation baked into a SKILL.md, and evidence the render-not-decide shape is being reused as a house convention.
- **Keywords:** bee-context-locking, single writer, D8
- **Seen:** 1.18.3

### review-on-demand-only
- **What:** Independent review (Gate 4 / `bee-reviewing`) is user-invoked only (decision 565e68d0) — never an automatic chain stage. Execution always closes through scribing→compounding as `unreviewed`, and a finished cell/slice/feature, or the bare words "merge"/"ship"/"release", are explicit **non-triggers**. On a merge/ship/release request with unreviewed work: report the count + risk, ask exactly ONE question ("Create a review session for this scope?"), only an explicit yes dispatches.
- **Where:** `bee-hive/SKILL.md` §Chain and gates, `bee-reviewing/SKILL.md` §Trigger.
- **Notable:** Sharpened since v1.3.9 — the non-trigger list is now explicit and gate bypass is stated to never create or auto-approve a review session at any level, closing a gap where a high bypass level might have been read as covering Gate 4 too.
- **Keywords:** review on demand, decision 565e68d0, non-triggers
- **Seen:** 1.18.3

## orchestration

### fan-out-cost-tiering-rubric
- **What:** The "Delegation contract": a mechanical step delegates down-tier when it needs reading >3 files OR content only needed as a digest, not verbatim; decide-altitude work (gates, synthesis, accept/reject, state writes) always stays on the orchestrating session model. Every dispatch must carry an explicit tier — a `model` param or an anchored `[bee-tier: generation|extraction|review|ceiling]` marker as the first token of the prompt — because a bare dispatch silently inherits the ceiling model.
- **Where:** `AGENTS.md`
- **Notable:** The rule that the tier marker must be the *first* token (not merely present somewhere in the prompt) is a concrete anti-bypass design against a model skimming a long prompt and missing a buried tier hint.
- **Keywords:** fan-out rubric, bee-tier marker, ceiling-model fallback
- **Seen:** 1.3.9

### worktree-protected-attestation
- **What:** Before dispatching parallel workers into git worktrees, the orchestrator captures canonical identity facts itself — `commonDir`, `worktreePath`, `worktreeId`, `headRef`, `baseCommit`, `declaredPaths`, `reservedPaths` — *before* any worker exists, never populated from worker-claimed data. Post-dispatch, four typed halts (`WORKTREE_ATTESTATION_UNAVAILABLE`, `WORKTREE_IDENTITY_MISMATCH`, `WORKTREE_BASE_ANCESTRY_MISMATCH`, `WORKTREE_RESERVED_DIFF_MISMATCH`) stop on any divergence.
- **Where:** `.claude/skills/bee-swarming/SKILL.md`
- **Notable:** Explicit threat model: "a same-UID worker is cooperative and fallible, not a security principal" — git metadata is treated as consistency evidence the orchestrator itself reads, not as an authorization signal a worker could assert.
- **Keywords:** worktree attestation, identity mismatch, threat model
- **Seen:** 1.3.9

### goal-check-every-done-yourself
- **What:** The orchestrator never trusts a worker's self-reported `[DONE]`: it re-runs the recorded verify command fresh and runs a frozen-judge check (`cells judge`) that flags undeclared test/CI/lockfile changes made to look like the goal was reached.
- **Where:** `.claude/skills/bee-swarming/SKILL.md`, `.claude/skills/bee-reviewing/SKILL.md` (frozen-judge flags reused at review time)
- **Notable:** Framed against a specific failure mode — "moved not passed" — where a check is altered to make a stale assumption look re-verified instead of actually re-verifying.
- **Keywords:** goal-check, frozen judge, moved-not-passed
- **Seen:** 1.3.9

### advisor-consult
- **What:** A bounded "ask for help without escalating to a human" mechanism for a stuck worker: triggers only on the first serious failed verify attempt when an `Advisor` line is present, capped at 2 consults per claim (fresh budget on re-dispatch), and instant-blocked (no consult) for authority-type failures.
- **Where:** `.claude/skills/bee-executing/SKILL.md`, `.claude/skills/bee-swarming/SKILL.md`
- **Notable:** Attribution is auditable rather than self-reported: the consult dispatch description must start with the exact string `advisor-consult <cell-id>: <advisor-model>`, readable later from `.bee/logs/dispatch.jsonl` — the orchestrator can check advisor use from logs instead of trusting the worker's account of it.
- **Keywords:** advisor consult, consult cap, dispatch attribution
- **Seen:** 1.3.9

### rescue-ladder
- **What:** A `[BLOCKED]` worker escalates through a fixed ladder — more context first, then a stronger model tier, then escalate to the human — rather than being retried blindly or handed straight to the user.
- **Where:** `.claude/skills/bee-swarming/SKILL.md`
- **Notable:** Keeps escalation cost-ordered: cheapest fix (context) tried before the most expensive one (interrupting the human).
- **Keywords:** rescue ladder, BLOCKED escalation
- **Seen:** 1.3.9

### three-tier-model-rubric-with-pinned-agent-types
- **What:** Every dispatch is judged into one of 3 tiers at dispatch time by the orchestrator (never fixed at planning — a planning `tier` is at most an overridable hint): `extraction` (pure retrieval/mechanical edits) → `subagent_type: "bee-extract"`; `generation` (normal implementation, the default) → `"bee-gather"`; `ceiling` (integration/architecture/security-sensitive/high-risk, "where a wrong call is expensive") → no rendered agent, IS the session model. Marker must anchor to the first token of the dispatch prompt/description or the model-guard hook denies it.
- **Where:** `bee-swarming/SKILL.md` (Tier judgment, decision 0016).
- **Notable:** "Keep ceiling scarce — if `bee_status` flags ceiling scarcity, re-judge routine cells downward before spawning" — a resource-pressure signal feeding back into tier choice, not just a one-way assignment.
- **Keywords:** tier rubric, bee-gather/bee-extract/bee-review, pinned agent types
- **Seen:** 1.18.3

### single-execution-worker-for-tiny-small
- **What:** `tiny`/`small` never get a wave — implementation runs through exactly ONE dispatched execution worker under the same execution contract as a swarm worker (AO14). Multiple cells in a `small` lane's 1-3 cells run **serially**, one live worker at a time (hardening-7) — "two or more live small-lane workers for one feature is a standard/high-risk wave shape wearing a small lane." After `[DONE]` the orchestrator, never the worker, authors the done-report from the worker's verbatim diff plus its own fresh verify re-run.
- **Where:** `bee-swarming/SKILL.md` §Single execution worker.
- **Keywords:** AO14, single worker, hardening-7, serial doctrine
- **Seen:** 1.18.3

### fleet-dispatch-and-merge-loop
- **What:** New skill `bee-herding` (456 lines, largest skill) — an autonomous multi-pane, multi-worktree dispatch/merge loop built on a terminal-multiplexer CLI (`herdr`). Three roles in one skill: **bootstrap** (one-shot human setup), **dispatch** (a looped cold `claude -p` process every interval, picks ready PBIs and spawns worker agents into isolated git worktrees, cap 4 concurrent), **merge** (single-shot, human-invoked only — the ONE action that lands work in main, never looped). Each iteration is cold-start with zero memory of prior iterations — "everything durable lives in bee state, git, and the herdr workspace."
- **Where:** `bee-herding/SKILL.md` (new skill, no v1.3.9 baseline).
- **Notable:** Containment is layered, not single-mechanism (descending weight): an owner-controlled enable interlock file that must exist before ANY work is picked up · merge being a manual gesture, never looped · worktree isolation (a git boundary, explicitly "not a sandbox") · a hard 4-slot cap + a stop file · a keyword-based lane-safety classifier that is advisory and fail-closed only. The skill documents its own prior false claim ("will not pick up hard-gate work") as measured-false — an adversarial review got the classifier to pass 8/8 real backlog rows including one titled "delete the entire JS runtime" — and corrects the doc rather than hiding the finding. Worth a deep-dive: this is the most architecturally novel thing in the whole scan (candidate new taxonomy domain, see header note).
- **Keywords:** bee-herding, herdr, autonomous dispatch, cold-start loop, containment layers
- **Seen:** 1.18.3

### unattended-agent-accepted-risk-posture
- **What:** Every `bee-herding` working agent runs `claude --permission-mode bypassPermissions` with **no tool allowlist** — can run any command, edit any file, unattended, explicitly recorded as the owner's accepted risk (not a default). Blast radius reasoning stated plainly: confined to its own worktree/branch is "a filesystem-and-git boundary, not a security sandbox" — the agent still shares the machine, network, user credentials, and every ambient tool. Control panes (the loop itself) run under a narrow enumerated `--allowedTools` list instead — a deliberate split, since a read-only control pane literally cannot dispatch or merge.
- **Where:** `bee-herding/SKILL.md` §Permission posture (D7-FINAL/D22).
- **Notable:** Names its own limits honestly: narrowing the control pane "does not sandbox agent-authored code" — the merge pane still executes the verify suite against code the unattended worker wrote.
- **Keywords:** bypassPermissions, accepted risk, control-pane allowlist
- **Seen:** 1.18.3

### advisor-consult-mechanism
- **What:** A bounded "ask for help without escalating to a human" pattern (already partially covered in orchestration domain, expanded since v1.3.9): capped at 2 consults per **claim** (fresh budget on re-dispatch, not per cell lifetime), triggers only on the worker's first serious failed verify attempt when an `Advisor` line is present in the dispatch. The orchestrator resolves the advisor once per dispatch and skips the line entirely when the advisor would resolve to literally the same model as the worker (the one honest no-op) — "config is the authority," no strength ladder, no self-judged skip otherwise. For high-risk/hard-gate work the advisor consult is now a **mandatory precondition before Gate 3** (not just a worker-level rescue), enforced as a throw (not a warning) with a 4-condition staleness check on the recorded `advisor_ref` (feature/decision/plan-hash/gate-revocation) — "never a time-based TTL, that already burned this feature on one invented number once."
- **Where:** `bee-validating/SKILL.md` §Gate 3 (AO2b-AO13), `bee-executing/SKILL.md` §6, `bee-swarming/SKILL.md` (Advisor-line decision table).
- **Notable:** Advice is explicitly data, never authority — conflicting with a locked CONTEXT.md decision always surfaces to the human, never auto-followed; a transport failure burns at most one budget slot and is never retried in a storm.
- **Keywords:** advisor consult, AO13 staleness, same-model no-op
- **Seen:** 1.18.3

## routing

### mechanical-mode-gate
- **What:** A request is classified into a lane (`docs`/`tiny`/`spike`/`small`/`standard`/`high-risk`) by mechanically counting concrete risk flags (auth, data loss, external provider, DB migration, etc.) rather than by a subjective size guess — the same counting logic runs identically in bee-hive and bee-planning.
- **Where:** `.claude/skills/bee-hive/SKILL.md`, `.claude/skills/bee-planning/SKILL.md`
- **Notable:** Making the classifier mechanical (flag-count, not vibes) keeps lane assignment reproducible across sessions and prevents an agent from talking itself into a lighter lane for a hard-gate change.
- **Keywords:** mode gate, risk flags, lane classification
- **Seen:** 1.3.9

### request-to-skill-routing-table
- **What:** bee-hive holds an explicit routing table mapping recognizable request shapes to the next skill to invoke, so "which skill handles this" is a lookup rather than an inference each session.
- **Where:** `.claude/skills/bee-hive/SKILL.md`
- **Keywords:** routing table, next-skill lookup
- **Seen:** 1.3.9

### triage-first-early-exit
- **What:** bee-hive decides the lane from request text alone, before loading `bee-planning`, using two counts (risk flags tripped, product files touched) — explicitly stated to save nothing on bee-hive's own context ("skills load whole") but to skip loading the ~21KB planning skill for `docs`/`tiny`/`small` requests. Multilingual: the routing table's `bee-scribing` trigger includes the literal Vietnamese phrase "ghi lại rule này" alongside English triggers.
- **Where:** `bee-hive/SKILL.md` §Triage first.
- **Keywords:** triage-first, token accounting, multilingual routing
- **Seen:** 1.18.3

## integration-contract

### cell-schema
- **What:** The unit of executable work: `files`, `read_first`, `action` (citing decision IDs), `must_haves`, a runnable `verify` command (not a description), a `behavior_change` flag, and an optional `tier` hint the orchestrator may override at dispatch time.
- **Where:** `.claude/skills/bee-planning/SKILL.md`, `.claude/skills/bee-executing/SKILL.md`
- **Notable:** `verify` must be literally runnable, not prose — "an assertion is not evidence" is enforced structurally by requiring a command field rather than a free-text description.
- **Keywords:** cell schema, verify field, tier hint
- **Seen:** 1.3.9

### gate-presentation-contract
- **What:** Every gate question shown in chat is a plain-language layer only; the full mechanical reasoning goes into a linked report under `docs/history/<feature>/reports/`, never pasted inline.
- **Where:** `.claude/skills/bee-hive/SKILL.md`
- **Notable:** Separates "what the human needs to decide" from "how the agent got there" as two different artifacts with two different audiences — directly reusable for any approval-gate UX.
- **Keywords:** gate presentation, plain-language layer, linked report
- **Seen:** 1.3.9

### section-to-source-map
- **What:** bee-briefing's rendered plan document traces every section to a named source artifact (CONTEXT.md / plan.md / cells); a section with no traceable source becomes an Open Question instead of being filled by guess.
- **Where:** `.claude/skills/bee-briefing/SKILL.md`
- **Notable:** "Briefing is a consolidator, not a second planner" — it authors only two sections itself (Technical Design, Rollback Plan); everything else is projected, never originated, which prevents a human-readable summary from drifting away from the machine-truth artifacts it summarizes.
- **Keywords:** projection rule, section source map, open question fallback
- **Seen:** 1.3.9

### proof-tier-matrix
- **What:** Replaces the old blanket "red-first for any behavior_change cell" rule (test-economy D1/D2, amending not reversing the prior decisions). Proof required at cap is now derived from `change_class × lane`: `refactor`/`formatting` at every lane including high-risk → existing suite passing is proof enough, a NEW test file is refused outright; `bugfix`/`behavior`/`api` at `tiny`/`small`/`standard` → one targeted-green test, no red-first needed; the same at `high-risk` → full scoped red-first; `security`/`migration` at every lane → always red-first, "no lane ever softens this row." An unclassified cell falls back to old behavior (no discount without explicitly declaring `change_class`).
- **Where:** `bee-executing/SKILL.md` (Proof-tier matrix, `packages/bee/lib/cells.mjs` `requiredProofTier`).
- **Notable:** Paired with test-shape rules (≥3 similar cases must be table-driven not copy-pasted; a genuinely new test file needs a declared `new_suite_reason` ≥20 chars; a test-to-source line ratio ceiling that warns at tiny/small and refuses above 4× at standard/high-risk) — an explicit anti-test-bloat design, not just a proof-strength rule.
- **Keywords:** test-economy, proof tier, change_class, scoped red-first
- **Seen:** 1.18.3

### verify-scoping-cap-vs-close
- **What:** A cell's `verify` is always its narrowest honest scoped check — never the full configured chain — both at cap time (decision `20534ea9`) and at the orchestrator's post-[DONE] re-run. Wave-close runs the transitive impacted suite (`commands.test`) exactly once for the whole wave, replacing per-cell full-chain re-runs; the full `commands.verify` chain is CI-owned and never run locally.
- **Where:** `bee-executing/SKILL.md`, `bee-swarming/SKILL.md` §Step 8 wave close.
- **Keywords:** verify-scoping D2, wave close, impacted suite
- **Seen:** 1.18.3

### cell-review-cold-pickup-standard
- **What:** Both the plan-checker and cell reviewer (standard/high-risk validating) run as the pinned `bee-review` subagent type on the `review` model slot (default opus, generation fallback). Cell review's litmus: "could a worker with no session history pick each cell up cold?" CRITICAL flags (assumed context, vague acceptance, scope overload, unproven feasibility, broken verify) block approval; MINOR flags may ship with a recorded note. Plan-checker caps at 3 structural-verification iterations before escalating to the human — "never attempt iteration 4."
- **Where:** `bee-validating/SKILL.md` §Plan Checker, §Cell Review.
- **Keywords:** cold pickup, bee-review slot, iteration cap
- **Seen:** 1.18.3

## context-memory

### context-md-source-of-truth
- **What:** `docs/history/<feature>/CONTEXT.md` is the single source of truth for locked product decisions (`D1, D2, …`), logged only through `bee.mjs decisions`, never by hand-editing the underlying `decisions.jsonl`.
- **Where:** `AGENTS.md`, `.claude/skills/bee-exploring/SKILL.md`
- **Keywords:** CONTEXT.md, decision IDs, decisions.jsonl
- **Seen:** 1.3.9

### handoff-pause-vs-planned-next
- **What:** `.bee/HANDOFF.json` has two kinds: `pause` (surface saved state, wait for explicit human confirmation, never auto-resume) and `planned-next` (a capped-with-green-verify cell whose next unit is already claimed) — only the latter auto-adopts, and only at a genuinely fresh-session boundary (a `/clear` or new session), never on a resumed or memory-compacted session.
- **Where:** `AGENTS.md`
- **Notable:** A missing or unknown handoff kind reads as `pause` — a fail-safe default that always falls back to the safer, human-gated behavior rather than silently auto-resuming.
- **Keywords:** HANDOFF.json, pause, planned-next, fail-safe default
- **Seen:** 1.3.9

### critical-patterns-digest
- **What:** `docs/history/learnings/critical-patterns.md` is mandatory reading before any planning or execution — a short, curated, continuously-appended digest of hard-won patterns, distinct from the full dated learnings log.
- **Where:** `AGENTS.md`, `.claude/skills/bee-compounding/SKILL.md`
- **Keywords:** critical-patterns.md, mandatory pre-read
- **Seen:** 1.3.9

### structured-decision-recall-surface
- **What:** Recent-decisions recall now goes through structured filters (`decisions search --tag <tag>` / `--scope <area>`, multi-term `--text` OR-ranked, `--all` reaches the archive) plus the area's section of `docs/decisions/index.md` as "the complete-by-construction recall surface" — "bare substring grep is the fallback, never the recall path." Paired with tag-matched precedent search in `docs/history/learnings/`: "precedent beats research" — a matched prior learning is injected as "we've solved X before: <file>" ahead of any fresh discovery work.
- **Where:** `bee-planning/SKILL.md` §2 (standard/high-risk bootstrap, step 4-5).
- **Keywords:** decisions search, structured recall, precedent-beats-research
- **Seen:** 1.18.3

### workflow-mailbox-handoff
- **What:** `.bee/HANDOFF.json` reads are now resolved through a live workflow's own mailbox (`runtime/handoffs/<workflow-id>/`) first, falling back to the legacy `.bee/HANDOFF.json` projection when none exists — the two handoff kinds (`pause`/`planned-next`) and their adoption rules from v1.3.9 are otherwise unchanged. A missing/unknown kind still reads as `pause` (fail-safe).
- **Where:** `AGENTS.md` §Startup step 5.
- **Keywords:** workflow mailbox, HANDOFF.json, fail-safe default
- **Seen:** 1.18.3

### decision-citation-and-reversal-sweep
- **What:** New system since v1.18.3, `docs/knowledge/areas/decision-memory/overview.md` (9 business rules). Decisions carry a global content-hash `short8` id (never a small integer alone); **R8 — Citation discipline (D3):** any artifact encoding a decision cites that short8 id, which is what makes reversal reachable. **R2 — a supersede is not finished until every citing artifact is reconciled:** before its single log append, `decisions supersede` computes a citation sweep over `docs/**` (full id + word-boundary short8 match); every hit is fixed same-turn or explicitly waived with a recorded reason, and an unreconciled hit resurfaces at every flush. `decisions log --relation touches:<id>` runs the same sweep for a non-superseding reference. Free text that reads as an inline supersession claim ("supersedes", "replaces", "no longer applies"...) is refused unless a real `--relation supersedes:<id>` resolves it — a guard added after a store audit found 70 decide events hiding a supersession in prose against 29 proper supersede events. **R5 — the recall surface is a machine-regenerated index** (`docs/decisions/index.md`, never hand-edited, grouped scope→tag, superseded entries excluded, byte-stable, "complete by construction"), with structured search (`--tag`, `--scope`, `--since`, `--untagged`) — "bare substring grep is the fallback, never the recall path."
- **Where:** `docs/knowledge/areas/decision-memory/overview.md`, `packages/bee-rs/crates/bee/src/verbs/decisions/`.
- **Notable:** Directly answers "how does a bare decision-id citation stay meaningful over time" — bee's answer is not a prose convention alone (R8 still requires an author to remember to cite the short8) but a **mechanical backstop**: a decision cannot be superseded/reversed without the system itself finding and forcing reconciliation of every place that cited the old truth, closing the exact failure mode ("a reversed decision lived only in the log; every artifact that stated the old conclusion kept restating it") this project's own hand-maintained `docs/decisions/0000-index.md` has no mechanism against.
- **Keywords:** short8 citation, reversal-propagation sweep, machine-regenerated index, relation-required guard
- **Seen:** v2.7.0 (scoped delta pass, tsk-37i, 2026-08-17 — not present at v1.18.3)

## planning

### discovery-research-levels
- **What:** Planning research scales L0 (skip) → L1 (quick verify) → L2 (standard, compare 2-3 approaches, invokes `bee-xia`) → L3 (deep dive), with a "spike" mode reserved for when "one yes/no proof decides whether the plan is real."
- **Where:** `.claude/skills/bee-planning/SKILL.md`
- **Notable:** Only L2/L3 discovery earns a separate `discovery.md` artifact file (decision 0009) — L0/L1 fold straight into `plan.md`, avoiding empty-ceremony files for lightweight research.
- **Keywords:** discovery levels, spike mode, artifact fan-out
- **Seen:** 1.3.9

### scope-reduction-prohibition
- **What:** Planning is forbidden from quietly shrinking a locked CONTEXT.md decision to fit a smaller plan; the honest response to a decision that doesn't fit is `SPLIT RECOMMENDED`, not a silent scope cut.
- **Where:** `.claude/skills/bee-planning/SKILL.md`
- **Keywords:** scope reduction prohibition, split recommended
- **Seen:** 1.3.9

### plan-freeze-immutability
- **What:** Once `approved_gates.shape` is set, `plan.md` content sections are immutable (D1) — the only permitted post-approval write is the approval stamp. Explicitly removes a prior mechanism: "there is no 'enrich the same plan.md in place to implementation-ready' step." Invariant stated directly: "the artifact the human approved stays byte-equal to the artifact that ships." Prep creates cells; it never rewrites the plan.
- **Where:** `bee-planning/SKILL.md` §5 (plan.md frontmatter contract, D1).
- **Notable:** A new `bee-xia` in-chain discovery step at L2+ merges findings straight into `approach.md` ("never a standalone research file") using an evidence-label taxonomy (`Local`/`Upstream`/`Docs`/`Inference`) and a 4-rung anti-reinvention ladder (reuse → built-in → adapt upstream → build from scratch), each skipped rung needing a stated reason.
- **Keywords:** plan freeze, D1, bee-xia, anti-reinvention ladder
- **Seen:** 1.18.3

## quality-gates

### verification-evidence-discipline
- **What:** "Proof, not assertion" (decision 0004): cells can only cap with a recorded, runnable verify result; `behavior_change` cells additionally require piped structured `verification_evidence`. Accepted evidence for feasibility claims is enumerated (existing implementation, file/API inspection, command output, test result, official docs, runtime probe, spike result) and explicitly excludes "should work"/"likely" language, which is automatic `NOT READY`.
- **Where:** `.claude/skills/bee-validating/SKILL.md`, `.claude/skills/bee-executing/SKILL.md`, `.claude/skills/bee-reviewing/SKILL.md`
- **Notable:** The same evidence standard is enforced at three different points in the chain (feasibility claim, cell capping, and independent review), so a plausibility-only claim can't slip through by reaching a later stage.
- **Keywords:** proof not assertion, evidence enumeration, NOT READY
- **Seen:** 1.3.9

### feasibility-decision-vocabulary
- **What:** bee-validating's output is one of four fixed verdicts — `READY` / `READY WITH CONSTRAINTS` / `NOT READY - RUN SPIKE` / `NOT READY - RETURN TO PLANNING` — and `READY` is explicitly a feasibility verdict, not an execution approval; Gate 3 still requires the human separately.
- **Where:** `.claude/skills/bee-validating/SKILL.md`
- **Notable:** Cleanly separates "is this provably feasible" (mechanical) from "may this proceed" (human authorization) so automation can do all of the proving without silently crossing into approving.
- **Keywords:** decision vocabulary, READY, Gate 3 separation
- **Seen:** 1.3.9

### review-scope-freeze-and-preflight
- **What:** Independent review (bee-reviewing) freezes its scope before any reviewer is dispatched: a scope JSON is created via `reviews create`, which runs a verification preflight that fails closed on missing evidence, shows a preview, and records the reviewer manifest — reviewer dispatch is structurally impossible before this point.
- **Where:** `.claude/skills/bee-reviewing/SKILL.md`
- **Notable:** Guarantees reviewers never assess a moving target and never review a diff with unproven verification claims baked in.
- **Keywords:** scope freeze, fail-closed preflight, reviewer manifest
- **Seen:** 1.3.9

### exists-substantive-wired-check
- **What:** Review's artifact-verification rubric checks three levels for any claimed deliverable: does it EXIST, is it SUBSTANTIVE (not a stub), and is it WIRED (actually integrated/called), catching "looks done but isn't actually connected" work.
- **Where:** `.claude/skills/bee-reviewing/SKILL.md`
- **Keywords:** EXISTS SUBSTANTIVE WIRED, artifact verification
- **Seen:** 1.3.9

### severity-and-autofix-routing
- **What:** Review findings carry a severity (`P1` blocks approval / `P2` / `P3`) and an `autofix_class` (`gated_auto` / `manual` / `advisory`) that is a routing signal only — it never itself applies a gate decision.
- **Where:** `.claude/skills/bee-reviewing/SKILL.md`
- **Keywords:** severity P1 P2 P3, autofix_class
- **Seen:** 1.3.9

### review-scope-freeze-fails-closed
- **What:** Independent review now freezes scope before any reviewer dispatch (R5): building a scope JSON, then `reviews create` runs a verification preflight over every included behavior-change cell that **fails closed** (non-zero exit, zero files written) when evidence is missing — "never dispatch reviewers to compensate for missing verification." Reviewer dispatch is structurally impossible before the freeze succeeds and the preview is shown.
- **Where:** `bee-reviewing/SKILL.md` §Scope Freeze and Preview (R5).
- **Keywords:** scope freeze, fail-closed preflight, R5
- **Seen:** 1.18.3

### review-severity-corroboration-and-artifact-check
- **What:** Findings score independently per reviewer; corroboration across independent reviewers promotes a finding one severity level; disagreement takes the more conservative route. Artifact verification is a 3-level check (EXISTS/SUBSTANTIVE/WIRED) — missing or EXISTS-only is P1, EXISTS+SUBSTANTIVE-only is P2. A cell flagged by the frozen judge (undeclared test/CI/lockfile changes) is reviewed *assuming the judge was moved, not passed* — a weakened judge is always P1, never a cleanup note.
- **Where:** `bee-reviewing/SKILL.md` §2, §3, §4.
- **Notable:** No-backfill-document rule: a missing verification-evidence P1's only valid remedy is re-verifying, never writing a document to backfill the missing before-state — "that backfill loop is what cap-time and create-time enforcement exist to prevent."
- **Keywords:** corroboration promotion, EXISTS/SUBSTANTIVE/WIRED, frozen-judge review
- **Seen:** 1.18.3

### no-redispatch-for-covered-range
- **What:** Before creating a new review session, check `bee.mjs reviews status` — a candidate already reporting `reviewed (covered by <review-id>)` for an unchanged range is not re-reviewed; only genuinely new or `review stale` delta gets a new session unless the user explicitly asks for a re-review.
- **Where:** `bee-reviewing/SKILL.md` (R6/A7).
- **Keywords:** review status, no re-dispatch, R6
- **Seen:** 1.18.3

### doc-rot-close-gate-bundle
- **What:** New in v2.7.0 ("doc-rot doors — impact, routing, doc-deferral, freshness", released 2026-08-16; features `knowledge-distill-trigger` + `doc-impact-synthesis`, landed 2026-08-03→2026-08-16 — did not exist at the v1.18.3 cursor). Four HARD doors block a feature's close, run after tests/scribing-debt/judge-debt/pattern-check: **(1) knowledge-freshness** — blocks on any `dangling_source`/`dangling_required_context` warning inside the feature's own touched areas (`bee knowledge check`'s findings, scope-filtered — a sibling feature's stale pointers never tax this close). **(2) impact** — blocks when a doc still cites one of the closing feature's OWN decisions "without having been reconciled": collects the feature's decide events by structured `feature` field, sweeps `docs/**` for citations of each id, blocks on every surviving hit with file:line + remedy, re-runs fresh each close so a fixed doc self-clears. **(3) routing** — blocks when a locked D-ID in the feature's own CONTEXT.md decision table has **no area-spec citation AND no feature-local record** — i.e. a locked local decision that was never propagated into any durable doc is refused at close, not allowed to rot as an orphaned CONTEXT.md-only fact. **(4) doc-deferral** — blocks when deferral-shaped prose ("later", "TODO"-style postponement) in touched docs names no registered trigger in the two-tier trigger registry (`bee triggers add/list/resolve`; predicate-tier auto-flips `waiting→due` on a re-evaluated condition, manual-tier needs human confirm). Each door has a named, logged escape hatch (`knowledge-freshness-deferral` / `impact-deferral` / `routing-deferral` / `doc-deferral` decision) — never a silent skip.
- **Where:** `docs/knowledge/areas/workflow-state/gates.md` ("A knowledge-freshness door...", "An impact door...", "A routing door...", "A doc-deferral door..." — 4 consecutive paragraphs); cells `kds-2`/`kds-3` (doc-impact-synthesis), `kdt-1` (knowledge-distill-trigger).
- **Notable:** This is the single most direct answer in the whole scan to fgOS's own D-local-citation problem (tsk-37i) — but inverted from what round-2's `decision-citation-and-reversal-sweep` entry found. That entry covers "don't let a SUPERSEDED decision's old citations go stale." The **routing door** covers a different, earlier failure this project has NOT yet found a beegog analogue for: "don't let a decision get LOCKED locally and then never routed anywhere durable at all" — exactly fgOS's own `fgos-coding-shaping/SKILL.md` situation (D2/D4/D6 minted in `docs/history/fgos-coding-shaping/CONTEXT.md`, cited bare in the skill file, never formally routed/superseded into a spec or ADR). beegog's answer is not a citation-format rule but a **structural close gate**: a feature is refused as done while any of its locked decisions sits unrouted — turning "someone should route this eventually" into "the feature cannot close until it is."
- **Keywords:** doc-rot doors, knowledge-freshness, impact door, routing door, doc-deferral, trigger registry, close gate
- **Seen:** v2.7.0 (scoped delta pass, tsk-37i round 6, 2026-08-17 — not present at v1.18.3; landed via a targeted commit-log scan `git log v1.18.3..v2.7.0 --grep=...`, not a full 1213-commit replay)

## docs-style

### tech-agnostic-rebuild-bar
- **What:** bee-scribing's acceptance test for a functional spec: a competent agent given ONLY the spec (with the final `Pointers` section covered) must be able to rebuild the same behavior on a different tech stack. Specs may name no language/framework/library/class/table/component/file outside that final Pointers section.
- **Where:** `.claude/skills/bee-scribing/SKILL.md`
- **Notable:** Converts an abstract "is this doc good" question into a concrete, repeatable litmus test (cover the Pointers section, ask "could you rebuild this"), with a worked contrast example: "The React hook debounces and PATCHes /api/jobs" (fails) vs. "edits are saved automatically shortly after typing stops" (passes).
- **Keywords:** rebuild bar, tech-agnostic rule, Pointers section
- **Seen:** 1.3.9

### one-area-one-file-forever
- **What:** Each functional area gets exactly one spec file that is updated in place forever — never `-v2`, `-new`, or date-suffixed variants.
- **Where:** `.claude/skills/bee-scribing/SKILL.md`
- **Keywords:** one file forever, no versioned spec files
- **Seen:** 1.3.9

### settlement-triggers-mandatory-capture
- **What:** Certain phrases ("chốt", "final", "ok ship it") are treated as settlement triggers that mandate same-turn spec capture — the agent is expected to detect settlement itself, unprompted, rather than waiting to be told to document something.
- **Where:** `.claude/skills/bee-scribing/SKILL.md`, `AGENTS.md`
- **Keywords:** settlement trigger, same-turn capture, unprompted documentation
- **Seen:** 1.3.9

### anti-fork-gate-three-layer
- **What:** New in bundle-mode scribing: a subject already claimed by an existing concept (`bee.authoritative_for`) can NEVER be claimed by a second concept — ownership checked bundle-wide, not per-area. Hardened to 3 layers after an independent judge broke a single-layer version 4 ways: (1) subjects compared as a skeleton — NFKC + lowercase + accent-strip + confusable-fold + punctuation collapse, so a trailing period or a Cyrillic lookalike character can't buy a rival concept; (2) malformed authority (a list, boolean, blank string) fails closed rather than being silently ignored; (3) a bundle-wide `duplicate_authoritative_for` check in `bee knowledge check` catches genuine paraphrase collisions (e.g. "refunds and reversals" vs "reversals and refunds") that the skeleton match alone can't.
- **Where:** `bee-scribing/SKILL.md` §2 (Anti-fork gate).
- **Notable:** Framed explicitly as "the `-v2` failure in a new costume" — the same one-area-one-file-forever discipline the no-bundle mode already had, re-derived for a concept-graph topology where forking is a different, subtler failure mode (silent duplicate authority, not an obviously-named `-v2` file).
- **Keywords:** anti-fork gate, authoritative_for, duplicate detection
- **Seen:** 1.18.3

### area-is-domain-general
- **What:** An "area" (the unit bee-scribing owns) is explicitly domain-general — "a screen or form, an API, a background job, an integration, a data pipeline, a CLI command, a business process: any unit with observable behavior that outlives features." Restates the rebuild bar with two worked contrast examples: "The React hook debounces and PATCHes /api/jobs" (fails — names tech) vs "edits are saved automatically shortly after typing stops" (passes).
- **Where:** `bee-scribing/SKILL.md` (Role and area definition, §Tech-agnostic rule).
- **Keywords:** area definition, rebuild bar, worked examples
- **Seen:** 1.18.3

### bootstrap-vs-harvest-distinction
- **What:** Bootstrap (no-bundle repos only, offer-only never auto-run) writes ONLY what code/tree/README mechanically prove, marks every meaning as an Open Gap, asks no interview questions: "bootstrap is inventory, harvest is meaning." A bundle repo has no bootstrap-equivalent — its indexes are pure functions regenerated via `bee.mjs knowledge index`, never skeletoned.
- **Where:** `bee-scribing/SKILL.md` §Modes (bootstrap).
- **Keywords:** bootstrap, harvest, offer-only
- **Seen:** 1.18.3

### one-line-cite-plus-local-delta
- **What:** New since v1.18.3, `docs/knowledge/areas/doctrine-layer/prompt-writing-standard.md` — the standard every edit to bee's own instruction text is judged by. **R3 — "One rule, one home":** a boundary rule is stated in full exactly once (its canonical home document); everywhere else it appears **only as a one-line cite plus the local delta that document actually adds** — never a near-verbatim restatement, and never a bare id with no gloss. Paired with a mechanical **pointer-integrity check** (`docs/knowledge/areas/verify-pipeline/skill-reference-pointer-integrity.md`, Rust test `pointer_integrity.rs`): every citation from an instruction document to a reference document must resolve to a real file AND a real heading inside it, checked on every verify run with negative-control fixtures proving the check can still detect a broken pointer — three real broken pointers were found the first time the check ran, in documents that had "passed" every prior check for their whole existence. Separately, **R5 (deterministic-backstop preference):** an absolute rule that is structurally reachable belongs in a hook/permission, not prose — "markdown carries only what enforcement cannot reach."
- **Where:** `docs/knowledge/areas/doctrine-layer/prompt-writing-standard.md`, `docs/knowledge/areas/verify-pipeline/skill-reference-pointer-integrity.md`, `packages/bee-rs/crates/bee/tests/pointer_integrity.rs`.
- **Notable:** This is bee's most direct answer to "a citation should never be a bare id" — but it splits the fix into two different-strength mechanisms on purpose: the *structural* half (does the pointer even resolve to a real file/heading) is machine-enforced and fails the build; the *content* half (is the one-line gloss actually accurate/complete) stays prose discipline enforced by review, because — per this same standard's four-question line filter — whether a gloss is *faithful* is a judgment call no grep can make, only whether it *exists and resolves* can be checked mechanically.
- **Where else relevant:** `docs/knowledge/areas/doctrine-layer/placement-and-anchoring.md` (B4 — every rule that must never disappear carries a suite-enforced anchor; a rule without one may vanish with no signal) is the same "verify reachability mechanically, verify content by discipline" split applied to whole rules instead of individual citations.
- **Keywords:** one-rule-one-home, cite-plus-delta, pointer integrity, four-question line filter
- **Seen:** v2.7.0 (scoped delta pass, tsk-37i, 2026-08-17 — not present at v1.18.3)

## tooling

### single-cli-dispatcher
- **What:** `bee.mjs` is the sole CLI surface for all 9 command groups (status, cells, reservations, decisions, state, backlog, capture, reviews, feedback); `--help --json` returns the full command surface as a Claude-Code tool-schema-shaped manifest (`{name, invoke, description, parameters, examples, deprecated}`) for on-demand discovery.
- **Where:** `AGENTS.md`
- **Keywords:** bee.mjs, single dispatcher, tool-schema manifest
- **Seen:** 1.3.9

### file-reservation-system
- **What:** Before write-heavy work in a swarm, an agent reserves a path (`reservations reserve --agent <name> --cell <id> --path <path>`); a conflicting reservation returns `[BLOCKED]` with the conflict rather than allowing a write to proceed. Write-heavy shell commands are prefixed `BEE_AGENT_NAME=<name>` so ownership stays checkable.
- **Where:** `AGENTS.md`, `.claude/skills/bee-swarming/SKILL.md`, `.claude/skills/bee-executing/SKILL.md`
- **Keywords:** reservations, BLOCKED on conflict, BEE_AGENT_NAME
- **Seen:** 1.3.9

### scribing-target-query
- **What:** `scribingTarget()` is the single authority for "where does this write go" in scribing — a query returning 7 keys (`bundle_mode, action, area, subject, path, owner, regenerate_index`) that resolves to one of 3 outcomes: write the path returned, or one of 2 typed refusals (`fork_denied` naming the existing owner, `subject_required` when a new-concept intent has no subject). "A `path: null` answer is a refusal, and a refusal is never a licence to pick your own path."
- **Where:** `bee-scribing/SKILL.md` §2 (`.bee/bin/lib/knowledge.mjs`).
- **Keywords:** scribingTarget, typed refusal, fork_denied
- **Seen:** 1.18.3

### herding-runtime-adapter-seam
- **What:** `bee-herding` reads optional `.bee/config.json` keys (`herding.agent_command`, `herding.control_command`) as argv-token-array templates with placeholders (`{MODEL}`, `{PROMPT}`, `{MAX_TURNS}`, `{ALLOWED_TOOLS}`) — absent keys mean byte-equivalent default behavior. Substitution is strictly per-token, never join-then-re-split, never `eval`, so free-form content (the prompt) can't spill or be reinterpreted as shell syntax. A worked (unwired, illustrative-only) Codex adapter example is included.
- **Where:** `bee-herding/SKILL.md` §Herding runtime adapter (D4).
- **Keywords:** config-driven command template, per-token substitution, adapter seam
- **Seen:** 1.18.3

## config-packaging

### legacy-boolean-compat
- **What:** The old `gate_bypass: true` boolean config value is read as the new `normal` level for backward compatibility, rather than requiring every existing config to be migrated.
- **Where:** `.claude/skills/bee-bypass-gate/SKILL.md`
- **Keywords:** legacy compat, boolean-to-level migration
- **Seen:** 1.3.9

### repo-identity-guard-for-self-modification
- **What:** bee-evolving (bee's own self-improvement loop) refuses to run unless the repo is literally the bee source repo — checked via a hard-gate file-existence test (`test -f skills/bee-hive/templates/lib/feedback.mjs && test -f skills/bee-writing-skills/SKILL.md`), not a name or path convention. A host repo's vendored/synced copy of bee does not satisfy the guard.
- **Where:** `.claude/skills/bee-evolving/SKILL.md`
- **Notable:** Explicitly named as a repo-identity check on a file unique to the *source* repo, not the widely-vendored copy — a reusable pattern for any tool that must distinguish "I am running in my own home repo" from "I am running as an installed dependency."
- **Keywords:** repo-identity guard, self-modification safety, hard-gate check
- **Seen:** 1.3.9

## repo-layout

### working-files-map
- **What:** A fixed `.bee/` layout: `onboarding.json`, `state.json`, `config.json`, `HANDOFF.json` (exists only while paused), `reservations.json`, append-only `decisions.jsonl` and `backlog.jsonl`, one JSON file per cell under `cells/`, and `logs/hooks.jsonl` for a fail-open hook crash/audit log.
- **Where:** `AGENTS.md`
- **Keywords:** .bee/ layout, state.json, cells directory
- **Seen:** 1.3.9

### docs-vs-machine-backlog-split
- **What:** Two separate backlogs are never merged: `docs/backlog.md` (human-facing product PBI rows, owned by bee-scribing) versus `.bee/backlog.jsonl` (machine-facing friction/grooming items).
- **Where:** `AGENTS.md`, `.claude/skills/bee-scribing/SKILL.md`, `.claude/skills/bee-grooming/SKILL.md`
- **Keywords:** backlog split, product vs machine backlog
- **Seen:** 1.3.9

### timings-log-and-scratch-sweep
- **What:** New `.bee/logs/timings.jsonl` — per-invocation `{ts,cmd,ms,ok}` fail-open append log, not present at v1.3.9. Separately, feature close (`bee-compounding`) now runs `bee.mjs tmp sweep --feature <feature>` to clear that feature's scratch under `.bee/tmp/` and `.bee/spikes/` (both the `<feature>/` dir and loose `<feature>-*` files) — one of exactly two named sweep moments (the other is session finish).
- **Where:** `AGENTS.md` (Working files), `bee-compounding/SKILL.md` §9 (tree-hygiene D2).
- **Keywords:** timings.jsonl, scratch sweep, tree-hygiene
- **Seen:** 1.18.3

### canonical-scratch-home-rule
- **What:** `.bee/tmp/<feature-or-session>/` is now named as "the one canonical scratch home" for disposable code/evidence that can't go in a cell trace — reinforced across multiple skills (decision 0009): `verification_evidence` is piped into the cell trace directly, never written as a separate `reports/*-evidence.*` file; per-cell reports link to `.bee/cells/<id>.json` for the full trace rather than re-embedding it.
- **Where:** `bee-executing/SKILL.md` §7 (behavior_change cap flags), `bee-validating/SKILL.md` (Executable code never in docs/history/, GitHub #17).
- **Keywords:** scratch home, decision 0009, trace as single source
- **Seen:** 1.18.3

## safety

### worktree-threat-model
- **What:** Explicit statement that a same-UID cooperative subagent is "cooperative and fallible, not a security principal" — trust boundaries in worktree dispatch are about catching honest divergence (a worker on the wrong base commit, a stray reserved-path diff), not defending against an adversarial process.
- **Where:** `.claude/skills/bee-swarming/SKILL.md`
- **Keywords:** threat model, cooperative-not-adversarial trust boundary
- **Seen:** 1.3.9

### foreign-plugin-agent-type-ban
- **What:** Reviewers and analysts must never be spawned as another plugin's registered agent type even when its name matches the desired role — spawn as the default/general subagent type with an inline persona instead.
- **Where:** `.claude/skills/bee-reviewing/SKILL.md`, `.claude/skills/bee-swarming/SKILL.md`
- **Keywords:** foreign agent type, name collision, inline persona
- **Seen:** 1.3.9

### read-only-agent-type-for-analysts
- **What:** bee-compounding's three parallel analysts (pattern extractor, decision analyst, failure analyst) are spawned as a runtime read-only agent type (e.g. Claude Code's `Explore`), never `general-purpose` — "write no files" as a prompt instruction is explicitly rejected as an insufficient safeguard while the subagent still holds Edit/Write/Bash tool access.
- **Where:** `.claude/skills/bee-compounding/SKILL.md`
- **Notable:** A hard tool-capability boundary rather than a soft behavioral instruction — the safeguard is which tools the agent type has, not what it's told not to do with them.
- **Keywords:** read-only agent type, capability boundary over instruction
- **Seen:** 1.3.9

### grooming-harness-self-preservation-boundary
- **What:** bee-grooming (project tech-debt hunter) hard-excludes `.bee/`, `.claude/`, `.codex/`, the AGENTS.md bee block, and vendored bee helpers from its own kill candidates — harness bugs get routed as a one-line "report upstream to bee" note instead of a deletion proposal.
- **Where:** `.claude/skills/bee-grooming/SKILL.md`
- **Notable:** Prevents a project-cleanup tool from proposing to delete its own operating infrastructure — a self-preservation boundary worth copying in any self-hosted tooling that both maintains and audits the same repo.
- **Keywords:** grooming exclusion, self-preservation boundary
- **Seen:** 1.3.9

### datamark-wrapping-for-foreign-feedback
- **What:** bee-evolving's merged cross-repo feedback digest wraps every foreign (untrusted, externally-sourced) title in a `«…»` datamark; only the wrapped, marked form is ever rendered to the human — the internal clustering `key` field is the de-datamarked stripped form and must never be rendered directly.
- **Where:** `.claude/skills/bee-evolving/SKILL.md`
- **Notable:** A concrete prompt-injection defense for any pipeline that aggregates untrusted external text into a ranking/rendering surface: mark provenance at merge time, never let the unmarked form reach the render path.
- **Keywords:** datamark, foreign feedback, prompt-injection defense
- **Seen:** 1.3.9

### protected-worktree-attestation-typed-halts
- **What:** Expands the existing worktree threat model with concrete mechanics: before dispatching into a worktree the orchestrator captures 6 identity facts itself (`commonDir`, `worktreePath`, `worktreeId`, `headRef`, `baseCommit`, `declaredPaths`/`reservedPaths`) — never populated from worker-claimed data. Post-dispatch, 3 checks with typed refusals: identity mismatch (`WORKTREE_IDENTITY_MISMATCH`), base-ancestry mismatch (`WORKTREE_BASE_ANCESTRY_MISMATCH`), and a diff-vs-reserved-paths mismatch (`WORKTREE_RESERVED_DIFF_MISMATCH`). A runtime that can't capture/retain the attestation is refused with `WORKTREE_ATTESTATION_UNAVAILABLE` rather than silently degrading.
- **Where:** `bee-swarming/SKILL.md` §Protected pre-dispatch attestation.
- **Keywords:** typed halts, worktree attestation, identity mismatch
- **Seen:** 1.18.3

### red-stop-marker-anti-retry
- **What:** In `bee-herding`'s merge role, a failed merge (`MERGE_CONFLICT`/`MERGE_VERIFY_RED`) writes a durable file marker (`.bee/tmp/bee-herding.red.<slug>`) BEFORE reporting, then stops — no retry, ever, for that worktree. The role never removes its own markers; only a human clearing it re-enables that slug. Rationale: with a measured ~1-in-12 verify flake, blind retrying would turn a red result into "a real risk of a genuine semantic conflict landing in main within roughly twelve minutes" — "retrying is worse than the interruption it dodges... a red result costs one interruption and zero damage, because the merge that would have caused damage never happened."
- **Where:** `bee-herding/SKILL.md` §Merge role §5 (Red path, D3).
- **Notable:** Deliberately uses a file, not the chat pane, because `send-text` types into scrollback that a busy pane can scroll away or a human can close — nothing proves a `send-text → pane read` round trip survives; a durable marker is the only home for "this specific merge attempt already failed and is waiting on a human."
- **Keywords:** red-stop marker, anti-retry, verify flake
- **Seen:** 1.18.3

## self-improvement

### two-gate-self-modification-loop
- **What:** bee-evolving's self-improvement loop over its own feedback digest requires two separate human gates: Gate A (pick one ranked item to fix) and Gate B (review the complete diff — cannot be pre-granted by any size threshold or standing rule), with the fix itself handed to bee-writing-skills under the full Iron Law (RED test first). A push to any remote ref, including scratch branches, is a named manual step, never automatic.
- **Where:** `.claude/skills/bee-evolving/SKILL.md`
- **Notable:** Rank formula `pain × frequency × corroboration` turns a fuzzy "what should we fix" question into a reproducible ranking, while still routing the actual choice and diff review through two distinct human decision points rather than one.
- **Keywords:** Gate A, Gate B, rank formula, manual push
- **Seen:** 1.3.9. Từ 1.18.3: repo guard hardened — running the loop with the digest ranked in one repo but the fix branched/upstreamed to another "IS running the loop in a host repo," no exception for read-only ranking. Foreign feedback trust boundary lives entirely in `mergeDigests` (datamarks every foreign field) — "YOU MUST NEVER open a foreign repo path yourself, not even to check one title." New explicit anti-rationalization: "the ranking is deterministic, the top item is objectively first" does not make it chosen — "a rank is an agenda, not a decision, and starting the fix before the human's pick is a Gate A violation every time." Gate B hardened the same way: no size threshold, standing rule, or prior plan-approval ever pre-grants review of tonight's actual diff, and pushing to ANY remote ref (including a scratch branch) counts as the push Gate B gates — "main is untouched" is not a defense.

### fresh-eyes-reviewer-pattern
- **What:** A recurring pattern across 3+ skills (bee-exploring, bee-context-locking, bee-planning's plan-checker): spawn one reviewer with NO conversation history on the `review` model slot (default opus, generation fallback), run it in the background where supported so it never blocks the interactive flow, cap fix-and-re-review loops at 2, then hand any remaining doubt to the human/caller rather than looping further.
- **Where:** `bee-exploring/SKILL.md` (Step 5), `bee-context-locking/SKILL.md` (Lock flow step 3), `bee-validating/SKILL.md` (Plan Checker).
- **Keywords:** fresh-eyes review, review slot, background dispatch
- **Seen:** 1.18.3

### promote-criticals-check-first-prose-second
- **What:** When compounding a recurring lesson into `critical-patterns.md`, the first-choice promotion target is an executable check (a grep/lint line, a hook denial) rather than more prose — because "a bloated file gets skipped, and then nothing compounds."
- **Where:** `.claude/skills/bee-compounding/SKILL.md`
- **Notable:** An explicit anti-entropy design: it de-prioritizes writing more rules (which tax every session's reading budget) in favor of converting lessons into something mechanically enforced that never needs to be re-read to matter.
- **Keywords:** check first prose second, anti-entropy, critical-patterns.md
- **Seen:** 1.3.9

### scribing-debt-gate
- **What:** `state set --phase compounding-complete` is refused while any capped `behavior_change` cell remains unscribed; the only sanctioned override is `--waive-scribing-debt`, which itself logs a decision rather than silently bypassing the check.
- **Where:** `.claude/skills/bee-compounding/SKILL.md`
- **Keywords:** scribing debt, waive-scribing-debt, chain-integrity guard
- **Seen:** 1.3.9

## ux

### gate-bypass-banner
- **What:** Whenever gate-bypass is active, `bee_status` and the session preamble print a loud, level-specific banner (`GATE BYPASS: NORMAL` / `FULL AUTOPILOT` / `TOTAL AUTOPILOT — ZERO STOPS`) so the current automation posture stays visible even though nothing is stopping to ask.
- **Where:** `.claude/skills/bee-bypass-gate/SKILL.md`, `AGENTS.md`
- **Keywords:** bypass banner, automation posture visibility
- **Seen:** 1.3.9

### silent-bookkeeping-rule
- **What:** Bee mechanics (cells, claims, caps, status/state writes, reservations, phase names) are never narrated into chat — they run silently, and the user only hears the work itself in plain terms. Litmus test given: strip every bee term from a chat message; if nothing the user needed is lost, those terms shouldn't have been there.
- **Where:** `AGENTS.md`
- **Notable:** A concrete, testable rule for machinery-vs-communication separation in any agent that runs internal bookkeeping alongside user-facing work.
- **Keywords:** silent bookkeeping, litmus test, work language
- **Seen:** 1.3.9

### blindspot-teach-before-asking
- **What:** When a user shows unfamiliarity with a concept during exploring's Socratic-locking questions, the agent explains the concept before asking the question, rather than asking cold and letting the user guess at unstated context.
- **Where:** `.claude/skills/bee-exploring/SKILL.md`
- **Keywords:** blindspot pass, teach before asking
- **Seen:** 1.3.9

### approval-vs-information-question-split
- **What:** Under gate-bypass, candidate questions in exploring are split into approval-type (skip if the agent has a confident answer) versus information-type (still asked, because the agent genuinely cannot infer it) — rather than a blunt "skip every question" behavior under autopilot.
- **Where:** `.claude/skills/bee-exploring/SKILL.md`
- **Notable:** Lets autopilot skip rubber-stamp confirmations while still surfacing anything it cannot actually determine on its own — a refinement worth reusing anywhere bypass logic risks becoming all-or-nothing.
- **Keywords:** approval vs information questions, bypass refinement
- **Seen:** 1.3.9

## testing-evals

### pressure-scenario-test-suite
- **What:** bee-writing-skills treats its own skill prompts as the "production code" under test: a test case is a pressure scenario combining at least 3 distinct pressures run against the skill, and the REFACTOR step requires re-running every existing scenario after any change, not just the new one.
- **Where:** `.claude/skills/bee-writing-skills/SKILL.md`
- **Keywords:** pressure scenario, full-suite re-run, prompt TDD
- **Seen:** 1.3.9

### suites-green-before-gate-b
- **What:** bee-evolving requires two specific automated test suites to pass before Gate B (the human diff review) is even offered — a mechanical precondition ahead of the human judgment step, so the human never reviews a diff that hasn't already cleared automated checks.
- **Where:** `.claude/skills/bee-evolving/SKILL.md`
- **Keywords:** suites green precondition, Gate B ordering
- **Seen:** 1.3.9

### test-prune-negative-control
- **What:** `bee-grooming`'s test-prune dimension (test-economy D4/D8): a read-only review-tier scan surfaces duplicate-logic/low-validation-value tests with evidence per candidate. Allowed action: merge near-duplicates into one table-driven test, or delete a genuinely dead case — never a raw line-count cut. Hard gate: every touched suite must run green **after the prune, in the same batch** ("verify later" = not ready). Surviving case(s) must still demonstrably catch what the pruned duplicates caught — "a quieter suite is not proof of a safe prune, a still-triggering guard is."
- **Where:** `bee-grooming/SKILL.md` §2 (test-prune).
- **Keywords:** test-prune, negative control, table-driven merge
- **Seen:** 1.18.3

### skill-tdd-meta-testing-prompt
- **What:** `bee-writing-skills`' RED→GREEN→REFACTOR discipline, essentially unchanged in shape since v1.3.9, now documents its REFACTOR-phase meta-testing prompt: after an agent chooses wrong despite the skill, ask it "how could the skill have been written differently to make the right option the only acceptable answer?" — routed into one of 3 fixed diagnoses (skill was clear but ignored → add the letter/spirit line; skill should've said X → add it verbatim; missed section Y → make it more prominent, move it earlier).
- **Where:** `bee-writing-skills/SKILL.md` §PHASE 3.
- **Keywords:** meta-testing, RED GREEN REFACTOR
- **Seen:** 1.18.3
