# Bee Skill Set Inventory Report

Mechanical inventory pass over the bee skill set (AGENTS.md operating block + 15
skills under `.claude/skills/bee-*`, byte-identical mirror at
`.agents/skills/bee-*`) for the distillery source `docs/distillery/sources/bee.md`.
Extraction only — no notability judgment, no taxonomy classification.

All 16 files read successfully. `.agents/skills/bee-*` confirmed as byte-identical mirror — not re-read.

### AGENTS.md (root operating block, lines 30-129, `<!-- BEE:START -->`...`<!-- BEE:END -->`)
- Purpose: Root always-loaded contract wiring every session into the bee chain, gates, guardrails, and session-finish checklist.
- Key mechanisms:
  - Startup sequence (5-7): read AGENTS.md → check `.bee/onboarding.json` → run `node .bee/bin/bee.mjs status --json` → check `.bee/HANDOFF.json` kind → read `critical-patterns.md` → baseline verify gate (AGENTS.md:37-43)
  - HANDOFF kinds: `pause` (wait, never auto-resume) vs `planned-next` (auto-adopted only at fresh-session boundary via `bee state handoff adopt`) — AGENTS.md:40
  - Chain: `bee-hive → bee-exploring [GATE1] → bee-planning → bee-briefing → [GATE2] → bee-validating [GATE3] → bee-swarming → bee-executing → bee-scribing → bee-compounding → (on request) bee-reviewing [GATE4]` — AGENTS.md:47-60
  - Gate-bypass **levels**: `normal`/`full`/`total`, each auto-approving progressively more (AGENTS.md:62)
  - Critical rules 1-15 (AGENTS.md:66-80): capping requires verified proof; cells assigned not self-selected; file reservations (`reservations reserve/release`); `BEE_AGENT_NAME=<name>` prefix; ~65% context → write `HANDOFF.json`; `CONTEXT.md` is source of truth; one commit per cell; scribing obliged every lane ("lanes scale ceremony, never memory"); agent runs machinery not user; "silent bookkeeping" (never narrate bee mechanics into chat); "hook is a safety net, not the authority" (decision c2c46488); "fan out the gathering, keep the deciding" — Delegation contract with `[bee-tier: generation|extraction|review|ceiling]` marker rule; multi-session coordination via lanes/claims/holds; native Codex `wait_agent` empty-wait progress-interval rule
  - Working files map: `.bee/{onboarding,state,config,HANDOFF,reservations}.json`, `decisions.jsonl`, `backlog.jsonl`, `cells/<id>.json`, `logs/hooks.jsonl`, `bin/` (AGENTS.md:84-104)
  - Guardrails = hook-equivalent rules for non-hook runtimes: privacy marker `@@BEE_PRIVACY@@…@@END@@`; scout exclusions (`node_modules/`, `dist/`, etc.); "intake gate" blocking writes when phase is `idle`/`compounding-complete`
  - Red flags list (AGENTS.md:119) and Session finish checklist (AGENTS.md:121-128)
- Notable design: The "hook is a safety net, not the authority" framing (rule 12) explicitly refuses the trap of "try the edit, let the hook block it" — makes the *law* the document, not the enforcement mechanism, closing a documented past failure (decision c2c46488) where a terminal phase left a guard gap unexploited-looking but still wrong. The Delegation contract's mandatory tier marker anchored as "first token" (not "anywhere in text") is a concrete anti-bypass design against models skimming prompts.

### .claude/skills/bee-hive/SKILL.md
- Purpose: Bootstrap/router meta-skill — verifies onboarding, reads state, routes to next skill, protects the four gates.
- Key mechanisms:
  - Onboarding via `node scripts/onboard_bee.mjs --repo-root <repo-root> --json`, statuses: `up_to_date` / `changes_needed` / `blocked_downgrade` / `blocked_no_source` (SKILL.md:27-39)
  - Syncs skills into two host roots per apply: `<repo>/.claude/skills/bee-*` and `<repo>/.agents/skills/bee-*`, optional `--global-skills` for legacy `~/.claude/skills/bee-*` (SKILL.md:31)
  - "Forced-apply transparency" (D2) and "Recheck honesty" (D5) — blocked-first precedence across all sync targets (SKILL.md:34,37)
  - Greenfield init lane (P1, docs/09 item 6): first slice = one init cell with fixed `must_haves` (SKILL.md:43)
  - Session Scout: `node .bee/bin/bee.mjs status --json`, orienting on onboarding health/phase/mode/feature/gates/cells/reservations/staleness/`recommended_next` (SKILL.md:49-53)
  - Capture queue offer (decision 0017) and Review candidates block (decision 565e68d0) surfaced via `bee_status --json` (SKILL.md:59,61)
  - Routing table (request → skill) (SKILL.md:71-86)
  - Mode gate: mechanical risk-flag counting → `docs`/`tiny`/`spike`/`small`/`standard`/`high-risk` (SKILL.md:94-107)
  - Lane table: ceremony scales by lane — plan/validate/execute/review/human-stops columns (SKILL.md:113-119)
  - "Tiny fast path": Gates 2+3 merged into one question (SKILL.md:125)
  - The Four Gates, verbatim wording each (SKILL.md:131-134); Gate 4 "lives only inside a user-invoked review session" (SKILL.md:136)
  - Gate Presentation Contract: chat message = plain-language layer only, full mechanical report goes to `docs/history/<feature>/reports/`, linked not pasted (SKILL.md:140)
  - Priority Rules (hive law) 1-13 (SKILL.md:146-158) — near-duplicate of AGENTS.md critical rules but titled "hive law"
- Notable design: The gate-bypass "levels" model (not boolean) lets the user *choose how far* automation reaches while the hook floor for hard-gate work stays intact unless explicitly lifted — a graduated trust dial rather than an all-or-nothing autopilot switch. The "Gate Presentation Contract" separating plain-language chat layer from a linked mechanical report is a reusable UX pattern for any approval gate.

### .claude/skills/bee-exploring/SKILL.md
- Purpose: Converts fuzzy feature requests into locked decisions in `docs/history/<feature>/CONTEXT.md` before any planning/code.
- Key mechanisms:
  - Hard gate: "Batch independent questions into one message; serialize only dependent ones" — `AskUserQuestion` takes up to 4 (SKILL.md:19)
  - SEE mock exception: throwaway HTML mock under `.bee/spikes/<feature>/mocks/` is the **one** exception to "exploring never writes code" (SKILL.md:21, 59)
  - Flow: Scope → Domain (SEE/CALL/RUN/READ/ORGANIZE classification) → Gray Areas (2-4 unstated product decisions) → Socratic Locking → Context Assembly (SKILL.md:27-70)
  - "Backlog flip (D11a)": matching feature flips `docs/backlog.md` row to `in-flight` (SKILL.md:31)
  - "Materiality test (P20)": every candidate question must be material + grounded + answerable before being asked (SKILL.md:56)
  - "Gate-bypass refinement — information vs approval" (decisions 0010/dcf01d7b/a93994d3): splits questions into approval-type (skip, agent has confident answer) vs information-type (still ask) (SKILL.md:57)
  - "Blindspot pass — teach before asking" (P9, decision 0020): explain concepts before asking when user shows unfamiliarity (SKILL.md:58)
  - Decision IDs: `D1, D2, D3…`; pinned terms feed CONTEXT.md `Terms` section and scribing's Data Dictionary (P21) (SKILL.md:60-61)
  - "Fresh-eyes review": one reviewer with no conversation history, `review` slot, default opus, runs in background, max two fix loops (SKILL.md:70)
  - Gate-bypass check FIRST at state/handoff step — auto-approves Gate 1 if level covers it, else presents question (SKILL.md:77)
- Notable design: Splitting questions into "approval" vs "information" under bypass (SKILL.md:57) is a clever refinement — it lets autopilot skip rubber-stamp questions while still asking anything the agent genuinely cannot infer, rather than a blunt "skip all questions."

### .claude/skills/bee-planning/SKILL.md
- Purpose: Turns locked CONTEXT.md decisions into a mode-classified, executable `plan.md` and current-slice cells.
- Key mechanisms:
  - Discovery research levels L0 (skip) / L1 (quick verify) / L2 (standard, compare 2-3 approaches) / L3 (deep dive) (SKILL.md:40-43)
  - `bee-xia` invoked in-chain at L2+; "three layers of knowledge": tried-and-true / new-and-popular / first-principles (SKILL.md:45)
  - "Artifact fan-out (decision 0009)": only L2/L3 discovery earns a separate `discovery.md` file; else folded into `plan.md` (SKILL.md:47)
  - Mode Gate: same mechanical flag-counting as bee-hive, plus `spike` mode: "one yes/no proof decides whether the plan is real" (SKILL.md:51-64)
  - `plan.md` frontmatter: `artifact_contract: bee-plan/v1`, `artifact_readiness: requirements-only`, `mode: tiny|small|standard|high-risk|spike` (SKILL.md:76-79)
  - Test matrix against "12 edge dimensions" (SKILL.md:81, detail in `references/edge-dimensions.md`)
  - `bee-briefing` render triggers per lane fan-out table (SKILL.md:83)
  - "Tiny/small merged gate (fast path)": inline reality check (MODE FIT/REPO FIT/ASSUMPTIONS/SMALLER PATH/PROOF SURFACE) replaces Gates 2+3 with one merged question (SKILL.md:85)
  - Cell batch creation: single stdin JSON array call, all-or-nothing validation (SKILL.md:90-96)
  - Cell schema: `files`, `read_first`, `action` (cites D-IDs), `must_haves`, runnable `verify`, `behavior_change: true` flag; `tier` optional hint, orchestrator judges at dispatch (decision 0016) (SKILL.md:97)
  - Phase enum strictly checked: `idle, exploring, planning, validating, swarming, reviewing, scribing, compounding, grooming, compounding-complete` — invented names refused (chain-integrity D6) (SKILL.md:99)
  - "Scope-Reduction Prohibition": never quietly shrink locked decisions; answer `SPLIT RECOMMENDED` instead (SKILL.md:103)
- Notable design: The strict phase-enum refusal (SKILL.md:99) is a state-machine integrity guard — preventing an agent from "inventing" a plausible-looking phase name that silently breaks downstream routing, discovered from a documented real failure.

### .claude/skills/bee-briefing/SKILL.md
- Purpose: Renders the one human-readable `implement-plan.md` per feature by projecting from truth artifacts — never originates content.
- Key mechanisms:
  - "Briefing is a consolidator, not a second planner" — authors only two sections: Technical Design and Rollback Plan (SKILL.md:24)
  - Lane forms table: `tiny`/`spike`=none, `small`=mini-brief on request, `standard`=on-demand, `high-risk`=mandatory full template with mandatory Rollback + Security sections (SKILL.md:32-38)
  - Modes: render / refresh / walkthrough / on-demand (SKILL.md:41-46)
  - "Section → Source Map": every section traced to a named source; silent source → Open Question, never a guess (SKILL.md:48-66)
  - "Projection Rule" (extends D12): brief is human-layer projection; truth stays in CONTEXT.md/plan.md/cells (SKILL.md:80-84)
  - "Drift rule": source artifact changes after brief approved → `status: Needs Revision`, re-render before next gate (SKILL.md:84)
  - Walkthrough mode (post-Gate-4): "reconstructs from execution reality, never from the plan" — sourced from capped cells' traces, review findings, UAT record (SKILL.md:94-104)
  - "Quiz offer (P10, decision 0020)": 3-5 question quiz on the change when presenting walkthrough (SKILL.md:104)
- Notable design: The strict rule that a brief can only *project* from other artifacts, never originate content (with Open Question as the mandatory fallback for gaps) prevents documentation drift/fabrication — a discipline pattern applicable to any "human-readable summary of machine state" generator.

### .claude/skills/bee-validating/SKILL.md
- Purpose: Hard gate between planning and execution — proves feasibility with repo evidence before code is written.
- Key mechanisms:
  - Lane scaling: for `tiny`/`small` this skill is **not separately invoked** — reality check runs inline in bee-planning (SKILL.md:20)
  - Operating Contract 7 steps: Orient → Reality gate → Feasibility matrix → Spikes → Plan-checker → Cell review → Decide (SKILL.md:35-42)
  - Reality gate dimensions: MODE FIT / REPO FIT / ASSUMPTIONS / SMALLER PATH / PROOF SURFACE, each PASS|FAIL with evidence (SKILL.md:36)
  - Accepted Evidence list: existing implementation, file/API inspection, command output, build/test result, official docs, runtime probe, spike result — vs. rejected "should work"/"likely" language → automatic **NOT READY** (SKILL.md:45-47)
  - Plan Checker (adversarial): `review` slot, default opus, max 3 structural-verification iterations then escalate (SKILL.md:59)
  - High-risk lane scales to persona panel: coherence + feasibility always, plus conditional lenses (security/product/scope-guardian) (SKILL.md:61)
  - Cell Review (cold pickup): CRITICAL flags block, MINOR may ship with a note (SKILL.md:63-65)
  - Decision Vocabulary: `READY` / `READY WITH CONSTRAINTS` / `NOT READY - RUN SPIKE` / `NOT READY - RETURN TO PLANNING` (SKILL.md:69-73)
  - Gate 3 wording verbatim: "Feasibility validated. Approve execution?" (SKILL.md:80)
  - Gate-bypass level-aware table for Gate 3 (`off`/`normal`/`full`/`total`) (SKILL.md:85-89)
- Notable design: "READY is a feasibility verdict, not execution approval — Gate 3 still requires the user" (SKILL.md:76) cleanly separates the mechanical proof step from the human authorization step, so automation can do all the proving without silently crossing into approving.

### .claude/skills/bee-swarming/SKILL.md
- Purpose: Orchestrates bounded workers over validated cells; orchestrator never implements directly (standard/high-risk lanes).
- Key mechanisms:
  - Solo execution for `tiny`/`small`: no workers spawned, orchestrator implements directly in-session with full cell discipline (claim/reserve/verify/cap) (SKILL.md:20-22)
  - Opt-in Native Worktree Dispatch: eligible only for enabled Claude Code wave with ≥2 workers (SKILL.md:30-38)
  - "Protected pre-dispatch attestation": captures canonical `commonDir`, `worktreePath`, `worktreeId`, `headRef`, `baseCommit`, `declaredPaths`, `reservedPaths` *before* any worker exists — never populated from worker-claimed data (SKILL.md:40-58)
  - Typed identity halts post-dispatch: `WORKTREE_ATTESTATION_UNAVAILABLE`, `WORKTREE_IDENTITY_MISMATCH`, `WORKTREE_BASE_ANCESTRY_MISMATCH`, `WORKTREE_RESERVED_DIFF_MISMATCH` (SKILL.md:57-84)
  - Threat model: "A same-UID worker is cooperative and fallible, not a security principal" — Git metadata is consistency evidence, not authorization (SKILL.md:62-65)
  - Wave analysis via `node .bee/bin/bee.mjs cells schedule --json`; refuses dispatch on cycles (SKILL.md:88)
  - Model tier judged at dispatch by orchestrator, not fixed by planning (decision 0016): `extraction`/`generation`/`ceiling` rubric (SKILL.md:91-96)
  - `resolveTier` behaviors: `inherit`/`model`/`budget`/`cli` (external executor dispatch) (SKILL.md:96)
  - Advisor slot resolution + "degenerate check" — skip advisor line if same model name as worker, or worker is at ceiling tier (SKILL.md:98-102)
  - "Goal-check every [DONE] yourself (P12, decision 0018)" — re-run verify command fresh, frozen judge check (`cells judge`) for undeclared test/CI/lockfile changes (SKILL.md:107-110)
  - `[BLOCKED]` Rescue Ladder: More context → Stronger tier → Escalate to user (SKILL.md:117-123)
  - Fresh-Session Handoff: finish → claim-next → planned-next handoff → offer `/clear`, never auto-issued (SKILL.md:140-142)
- Notable design: The worktree "protected attestation" model treats even cooperative same-machine subagents as untrusted for identity purposes — deriving ground truth from git metadata the orchestrator reads itself rather than trusting worker self-report. This is a strong pattern for any multi-agent parallel execution needing tamper-resistant provenance. Also "goal-check every DONE yourself" (never trust a worker's own claim of success) is directly reusable.

### .claude/skills/bee-executing/SKILL.md
- Purpose: Worker skill — implement, verify, cap exactly one assigned cell, return structured status.
- Key mechanisms:
  - Pipeline: `Initialize -> Accept assigned cell -> Reserve -> Implement -> Verify -> (Advisor Consult, if stuck) -> Cap -> Release -> Return` (SKILL.md:20-22)
  - Status tokens: `[DONE]`, `[BLOCKED]`, `[HANDOFF]`, `[NOOP]` (SKILL.md:18, 118)
  - Never self-select cell; missing/capped → `[NOOP]`; ambiguous/uncapped-deps/locked-decision-conflict → `[BLOCKED]` (SKILL.md:37-38)
  - Deviation rules: bug found → auto-fix; missing critical functionality → auto-add; blocking issue → auto-fix; architectural change needed → STOP `[BLOCKED]` (SKILL.md:56-59)
  - Package installs "always checkpoint" — never install on own authority (SKILL.md:61)
  - Verify recorded via `cells verify --id <id> --command "<cmd>" --output "<...>" --passed true|false` (decision 0004 — "proof, not assertion") (SKILL.md:65-66)
  - Advisor Consult (D1-D3): triggers only on first serious failed verify attempt with an `Advisor` line present; canonical loop max 2 consults per claim; fresh budget on re-dispatch (SKILL.md:72-101)
  - Evidence bundle for consult: exact failing command/output/diagnosis/file excerpts/CONTEXT.md path — "inline in the consult prompt or via stdin — never a `/tmp` path" (critical pattern 20260708) (SKILL.md:88)
  - Transport: model-shaped advisor via Agent tool with `description` starting exactly `advisor-consult <cell-id>: <advisor-model>` (A2 attribution record read from `.bee/logs/dispatch.jsonl`); cli-shaped advisor via stdin (SKILL.md:90-93)
  - "Authority-type blocks never consult" — instant `[BLOCKED]` regardless of Advisor line (SKILL.md:97)
  - Cap requires recorded verify pass; `behavior_change: true` cells require `--behavior-change --evidence-stdin` piping structured `verification_evidence` (SKILL.md:105-107)
  - One commit per cell (SKILL.md:110)
- Notable design: The Advisor Consult mechanism is a bounded "ask for help without escalating to human" pattern — capped at 2 consults per claim, fresh on re-dispatch, with a strict attribution string format so the orchestrator can audit advisor use from logs rather than trusting the worker's self-report.

### .claude/skills/bee-scribing/SKILL.md
- Purpose: bee's BA — maintains technology-agnostic functional specs (`docs/specs/<area>.md`) so a human/agent can understand or rebuild the system without reading code.
- Key mechanisms:
  - "The rebuild bar": a competent agent given ONLY the spec (minus Pointers) rebuilds the same behavior on different tech (SKILL.md:22)
  - "Tech-agnostic rule": no language/framework/library/class/table/component/file named outside final `Pointers` section; example contrast: "The React hook debounces and PATCHes /api/jobs" (violation) vs "edits are saved automatically shortly after typing stops" (correct) (SKILL.md:24)
  - Modes: sync (chain default) / capture / flush / harvest / bootstrap (SKILL.md:28-36)
  - Spec sections: Purpose → Entry Points & Triggers → Data Dictionary → Behaviors & Operations → Actors & Access → Business Rules → Edge Cases Settled → Open Gaps → Pointers (implementation) (SKILL.md:58)
  - "One area = one file, forever" — never `-v2`/`-new`/date-suffixed spec files (SKILL.md:54)
  - Capture mode: settlement triggers ("chốt", "final", "ok ship it") → mandatory same-turn capture (decision 0003); lane-scaled cost — high-risk merges immediately, others append a capture-queue stub via `bee.mjs capture add` (decision 0017) (SKILL.md:31, 71-82)
  - "Scribing debt" signal (decision 0011): every capped `behavior_change` cell since last scribing run counted and surfaced mechanically (SKILL.md:75)
  - Deferred requests → `docs/backlog.md` proposed rows (D8) (SKILL.md:90-92)
  - "Rebuild Self-Check": re-read spec with Pointers covered — "you'd have to look at the code" answer = a hole (SKILL.md:102-104)
- Notable design: The tech-agnostic acceptance test ("rebuild bar") converts an abstract documentation-quality goal into a concrete, testable litmus (cover the Pointers section, ask if it's rebuildable) — a directly reusable technique for any spec-writing discipline.

### .claude/skills/bee-compounding/SKILL.md
- Purpose: Captures durable cross-feature learnings/decisions after scribing completes, feeding future exploring/planning/reviewing.
- Key mechanisms:
  - Three parallel analysts, each a temp-finding-only subagent that never writes durable files: pattern extractor (extraction tier), decision analyst (generation), failure analyst (generation) (SKILL.md:32-39)
  - "Spawn read-only (D1)": analysts spawned as runtime read-only agent type (Claude Code: `Explore`), NEVER `general-purpose` — "write no files" as a prompt string is not a safeguard while the subagent holds Edit/Write/Bash (SKILL.md:43)
  - "Wait, don't hang (D2)": launch all three, end turn, notified on completion; synthesis doesn't require 3-of-3, retry once then synthesize from what returned (SKILL.md:45)
  - Learnings file: `docs/history/learnings/YYYYMMDD-<slug>.md`, sections What Happened/Root Cause/Recommendation (SKILL.md:49)
  - "Promote Criticals — Check First, Prose Second": first-choice promotion target is an executable check (grep/lint line, hook denial), not prose — "a bloated file gets skipped, and then nothing compounds" (SKILL.md:55-63)
  - Three promotion criteria: multi-feature relevance, meaningful waste prevented, generalizable (SKILL.md:59-61)
  - State-layer guard (decisions 0001/0002): `state set --phase compounding-complete` REFUSED while any capped `behavior_change` cell is unscribed (chain-integrity D2); `--waive-scribing-debt` is the sanctioned override, logging a decision (SKILL.md:79)
  - Review candidate registration at close: `reviews candidate add --feature <feature> --head <sha> --mode <lane>`; "Independent review not requested; the change set was added to review candidates" (SKILL.md:83)
  - Feedback digest refresh (D1 — warn, never block): `bee.mjs feedback digest`, never blocks/fails/delays a feature close even on an unfamiliar stack trace (SKILL.md:89-104)
- Notable design: "Promote Criticals — Check First, Prose Second" (SKILL.md:55) is a strong anti-entropy design: it explicitly de-prioritizes writing more prose rules (which "tax every session preamble") in favor of converting recurring lessons into mechanical, permanently-enforced checks. The read-only-agent-type enforcement for analysts (rather than trusting a prompt instruction) is a hard tool-capability boundary rather than a soft behavioral one.

### .claude/skills/bee-reviewing/SKILL.md
- Purpose: Independent, user-invoked multi-agent review gate over an immutable, frozen scope — never automatic.
- Key mechanisms:
  - Explicit trigger-only list (R1): "review this", "review all of today's work", named feature/list, diff range, "review everything unreviewed before release"; NOT triggers: cell/slice/feature finishing, or "merge"/"ship"/"release" alone (ask ONE question instead) (SKILL.md:24-37)
  - Scope Resolution: 5 scope types (current feature / named list / everything-unreviewed-since-baseline / explicit range / time window) (SKILL.md:41-46)
  - "In-progress work is excluded, never swept in" (A6) (SKILL.md:52)
  - Scope Freeze and Preview (R5): scope JSON → `reviews create` (runs verification preflight, fails closed on missing evidence, A10) → preview shown → reviewer manifest recorded — reviewer dispatch impossible before this (SKILL.md:56-64)
  - Lane Scaling: the SESSION's scope risk sets depth, not the originating feature's lane — small scope=1 reviewer, standard=4 core, high-risk-content=full wave+conditionals cap 6 (SKILL.md:69-77)
  - 4 core reviewers: `code-quality`, `architecture`, `security`, `test-coverage`, all `review` slot (default opus), parallel (SKILL.md:99-104)
  - Conditional reviewers triggered by diff pattern match: `performance`, `api-contract`, `data-migration`, `reliability` (SKILL.md:108)
  - "NEVER use an agent type registered by another plugin, even when its name matches the role" — spawn as default/general subagent type + inline persona (SKILL.md:95)
  - Severity: P1 (blocks approval)/P2/P3; `autofix_class`: `gated_auto`/`manual`/`advisory` (routing signal, never apply gate) (SKILL.md:114-120)
  - Verification-Evidence Gate: missing/vague evidence on a `behavior_change` cell is itself a P1 (SKILL.md:126)
  - Frozen-judge flags (P12, decision 0018): judge hits reviewed assuming "moved not passed" (SKILL.md:130)
  - Artifact Verification: EXISTS/SUBSTANTIVE/WIRED three-level check (SKILL.md:136-140)
  - Human UAT walkthrough of every SEE/CALL/RUN decision; failure → P1 fix cell + rerun (SKILL.md:143)
  - Delta Re-Review (R9/A12): re-review fix delta AND sweep whole scope diff for the finding's defect class, not just the changed line (critical pattern 20260711: "grill deltas") (SKILL.md:146-153)
  - Gate 4 wording fixed, lives only inside a session; bypass never creates/auto-approves sessions but may auto-approve merge if P1=0 and UAT all pass (SKILL.md:162-175)
  - "No re-dispatch for an unchanged, already-approved range (R6/A7)" — check `reviews status` first (SKILL.md:175)
- Notable design: Freezing the review scope *before* any reviewer is dispatched, with a fail-closed evidence preflight, prevents "reviewing a moving target" and ensures reviewers always see an immutable, provably-evidenced diff. The EXISTS/SUBSTANTIVE/WIRED three-tier artifact check is a reusable rubric for catching "looks done but isn't actually integrated" work.

### .claude/skills/bee-grooming/SKILL.md
- Purpose: On-demand hygiene pass hunting project tech debt (not bee's own harness), proposing kills, executing only on approval.
- Key mechanisms:
  - Hard boundary: `.bee/`, `.claude/`, `.codex/`, `AGENTS.md` bee block, vendored helpers are NEVER kill candidates — harness bugs get a one-line "report upstream to bee" note instead (SKILL.md:24-29)
  - Entropy score formula: `orphaned cells ×10 + unverified cells ×5 + stale decisions ×5 + stale specs ×5 + backlog-without-outcome ×2 + stale work ×3 + broken tools ×8, cap 100` — bands 0/1-25/26-50/51-100 (SKILL.md:38-43)
  - Hunt checklist: friction clusters, dead code/unused exports, stale docs, stale/missing/duplicate specs, TODO/stub debris, broken verify commands, superseded-cited decisions, slop patterns (empty catches, redundant `return await`, dead flags) (SKILL.md:51-58)
  - "Prove non-use before calling anything dead" — dynamic imports, reflection, config-driven loading, external callers all count as use (SKILL.md:60)
  - Proposal format: pain / predicted impact / risk lane, ranked, top few only (SKILL.md:64)
  - "MANDATORY user approval before any deletion. Grooming never deletes on its own initiative." (SKILL.md:66)
  - Execution via normal tiny/small cells through bee-executing worker loop; grooming never edits files directly; one approved kill per cell (SKILL.md:69-72)
  - Close the Loop: record actual outcome vs prediction via `backlog add --type kill-outcome` (SKILL.md:76)
- Notable design: Explicitly scoping "harness issues" out of project-debt findings (and routing them as a one-line upstream note) prevents a project-cleanup tool from accidentally proposing to delete its own operating infrastructure — a self-preservation boundary worth copying in any self-hosted tooling.

### .claude/skills/bee-bypass-gate/SKILL.md
- Purpose: Toggles the persistent `.bee/config.json` `gate_bypass` level (`off`/`normal`/`full`/`total`); does no pipeline work itself.
- Key mechanisms:
  - Level table: `off`=nothing auto-approved; `normal`=Gates1-3 for tiny/small/standard non-hard-gate; `full`=all Gates1-3 every lane incl. high-risk/hard-gate; `total`=everything incl. secret reads + Gate4 UAT/P1 (SKILL.md:26-31)
  - Hard-gate flags enumerated: auth/authorization/data loss/audit-security/external provider/validation removal/DB migration-schema (SKILL.md:33)
  - Secret-file reads (`.env*`, `*.pem`, keys, `credentials*`, `secrets.*`) stop under everything except `total` (SKILL.md:34)
  - Legacy `gate_bypass: true` reads as `normal` (backward compat) (SKILL.md:37)
  - Loud `GATE BYPASS` banner in session preamble and `bee_status` while active (`NORMAL`/`FULL AUTOPILOT`/`TOTAL AUTOPILOT — ZERO STOPS`) (SKILL.md:53)
  - Requires stating the chosen level's row to the user in the same turn — "never change the level silently" (SKILL.md:58)
- Notable design: Treating autopilot as a graduated, named, banner-announced level (rather than a silent boolean) makes the current automation posture always visible and legible — reduces the risk of the user forgetting bypass is on.

### .claude/skills/bee-writing-skills/SKILL.md
- Purpose: TDD-for-skills discipline for building/editing/pressure-testing bee skills themselves.
- Key mechanisms:
  - "THE IRON LAW: NO SKILL WITHOUT A FAILING TEST FIRST" — applies to edits too, no exceptions (SKILL.md:17)
  - RED → GREEN → REFACTOR cycle mapped to TDD concepts (test case=pressure scenario, production code=SKILL.md, etc.) (SKILL.md:20-28)
  - RED phase: 3-5 pressure scenarios combining ≥3 pressures, run WITHOUT skill, document exact rationalizations verbatim (SKILL.md:34-40)
  - GREEN phase: SKILL.md checklist — frontmatter on line 1, `name` = hyphen-case `bee-` prefix matching directory, description = "one short purpose clause... Use when..." NEVER workflow summary, `metadata.version/ecosystem/dependencies`, body <200 lines, ends with handoff sentence `[Outcome]. Invoke bee-<next-skill> skill.` (SKILL.md:46-56)
  - "Description trap" with explicit ❌/✅ example — workflow-summary descriptions make Claude skip the skill body (SKILL.md:58-66)
  - Persuasion principles table: Authority/Commitment/Scarcity/Social Proof/Unity, each mapped to a use case (SKILL.md:82-88)
  - REFACTOR phase: capture rationalization verbatim, add explicit negation, add to rationalization table + red flags, re-run ALL scenarios (SKILL.md:94-99)
  - "Meta-testing technique": ask the agent "how could the skill have been written differently to make Option A the only acceptable answer?" with three diagnosis branches (SKILL.md:102-106)
  - Rationalization Table of common violations with reality-check rebuttals (SKILL.md:122-133)
- Notable design: This is bee's own meta-methodology — treating prompt/skill authoring as literal TDD, with "pressure scenarios combining ≥3 pressures" as the test suite and verbatim-quoted rationalizations as the bug reports. The "N=28,000 scale testing" claim and the meta-testing question ("how could the skill have been written to make X the only acceptable answer") are directly transferable to any org writing agent instructions/guardrails.

### .claude/skills/bee-evolving/SKILL.md
- Purpose: Bee's gated self-improvement loop over its own collected feedback digest — bee-repo-only, human-invoked only, never auto-runs.
- Key mechanisms:
  - HARD-GATE repo guard: `test -f skills/bee-hive/templates/lib/feedback.mjs && test -f skills/bee-writing-skills/SKILL.md` — refuses if not literally the bee dev repo, a host repo's vendored copy does not count (SKILL.md:27-45)
  - `node .bee/bin/bee.mjs feedback rank --json` — merges local + `dogfood_repos` digests via `mergeDigests` which "revalidates and datamarks every foreign field (D2b)"; this merged output is "the only feedback surface you may consume" — never open a foreign repo's raw digest directly (SKILL.md:47-58)
  - Gate A: human picks one item from ranked clusters; renders stored `title` (datamark-wrapped `«…»` for foreign titles) never the internal `key` field (de-datamarked, never rendered) (SKILL.md:60-78)
  - Rank formula: `rank = pain × frequency × corroboration` (SKILL.md:69)
  - Fix handed to bee-writing-skills under full Iron Law (RED first) — bee-evolving never implements inline (SKILL.md:82-89)
  - Suites green requirement before Gate B: two specific test commands (SKILL.md:92-98)
  - Gate B: human reviews complete diff, per-diff and cannot be pre-granted — no size threshold or standing rule substitutes (SKILL.md:101-113)
  - Push (D5): named manual step, never automatic, any remote ref counts as a push including scratch branches (SKILL.md:115-126)
  - Rationalization Table specific to this skill, e.g. "Rank here read-only, patch on a branch, upstream later" → "The loop just ran in a host repo. D3 refusal, branch or not." (SKILL.md:139)
- Notable design: The "datamark" concept (`«…»` wrapping of foreign/untrusted titles, with the internal clustering `key` being the *stripped* form that must never be rendered) is a concrete prompt-injection defense for any system that aggregates untrusted external text into a ranking/rendering pipeline. The repo-identity guard (checking for a file path unique to the *source* repo, not just the vendored copy) is a reusable self-modification safety pattern.

### .claude/skills/bee-xia/SKILL.md
- Purpose: Anti-reinvention research scout — evidence-labeled answers on what exists/reusable/documented before planning or building.
- Key mechanisms:
  - Depth levels: `Quick`/`Standard`/`Deep` mirroring planning's L1/L2/L3 (SKILL.md:34)
  - Ordered flow (order is the protocol): Stack ledger (from real artifacts, never folder names/memory) → Local reuse → Upstream patterns → Current official docs; "Web research before local evidence is a red flag" (SKILL.md:37-44)
  - Evidence Labels: `Local` / `Upstream` / `Docs` / `Inference`, "never blurred" (SKILL.md:47-54)
  - Recommendation Ladder: Reuse → Built-in → Adapt upstream → Build from scratch, each skipped rung needs a stated reason (SKILL.md:57-63)
  - "Local behavior and docs disagree → local behavior is current truth; record the mismatch" (SKILL.md:43)
  - Capability-degradation dependencies: `web-docs-search` and `upstream-pattern-research` declared as optional capabilities with explicit `missing_effect: degraded` behavior, never silently skipped (frontmatter lines 9-16)
  - Output: in-chain merges into `approach.md`; standalone writes `docs/history/research/<topic-slug>.md` (SKILL.md:67-70)
- Notable design: The "Recommendation Ladder" (Reuse→Built-in→Adapt→Build, each skip requiring a stated reason) is a clean anti-reinvention discipline directly reusable in any research/planning skill. The evidence-label taxonomy (Local/Upstream/Docs/Inference) forces every claim to declare its epistemic status rather than blending assertion with inference.

## Deduplicated Concept Index (concept → files mentioning it)

- **Gates (1-4) / Gate Presentation Contract** — AGENTS.md, bee-hive, bee-exploring, bee-planning, bee-briefing, bee-validating, bee-swarming, bee-reviewing, bee-bypass-gate
- **Gate-bypass levels (off/normal/full/total)** — AGENTS.md, bee-hive, bee-exploring, bee-planning, bee-validating, bee-reviewing, bee-bypass-gate
- **Cells (schema, claim, verify, cap, judge, schedule)** — AGENTS.md, bee-hive, bee-planning, bee-validating, bee-swarming, bee-executing, bee-scribing, bee-compounding, bee-reviewing, bee-grooming
- **File reservations (reserve/release/BLOCKED on conflict)** — AGENTS.md, bee-hive, bee-swarming, bee-executing
- **Mode/lane mechanical flag-counting (docs/tiny/small/standard/high-risk/spike)** — AGENTS.md, bee-hive, bee-planning, bee-validating, bee-swarming (lane scaling), bee-briefing (lane forms), bee-reviewing (lane scaling by scope)
- **Delegation contract / fan-out rubric (tier markers, generation/extraction/review/ceiling)** — AGENTS.md, bee-hive, bee-exploring, bee-planning, bee-scribing, bee-compounding, bee-grooming, bee-swarming, bee-xia
- **Status tokens ([DONE]/[BLOCKED]/[HANDOFF]/[NOOP])** — bee-swarming, bee-executing
- **HANDOFF.json (pause vs planned-next)** — AGENTS.md, bee-hive, bee-swarming, bee-executing
- **Decision log (D-IDs, decisions.jsonl, supersede)** — AGENTS.md, bee-exploring, bee-planning, bee-scribing, bee-compounding, bee-bypass-gate
- **Scribing debt / capture queue / flush (decisions 0011, 0017)** — bee-hive, bee-scribing, bee-compounding
- **Backlog (product docs/backlog.md vs machine .bee/backlog.jsonl)** — AGENTS.md, bee-exploring, bee-scribing, bee-compounding, bee-grooming
- **Review candidates / unreviewed status tracking (decision 565e68d0)** — bee-hive, bee-compounding, bee-reviewing
- **Verification evidence discipline ("proof not assertion", decision 0004)** — AGENTS.md, bee-validating, bee-executing, bee-reviewing
- **Advisor Consult (worker-level, capped, attributed)** — bee-swarming, bee-executing
- **Model tier resolution (`resolveTier`, extraction/generation/ceiling, decision 0016)** — bee-hive (via AGENTS.md rule 13), bee-swarming, bee-scribing, bee-compounding, bee-grooming, bee-xia
- **Read-only agent type enforcement for analysts** — bee-compounding
- **Worktree isolation + protected attestation** — bee-swarming (unique)
- **Never spawn as another plugin's registered agent type** — bee-swarming, bee-reviewing
- **Rebuild bar / tech-agnostic spec rule** — bee-scribing (unique)
- **Entropy score formula** — bee-grooming (unique)
- **Evidence labels (Local/Upstream/Docs/Inference) + Recommendation Ladder** — bee-xia (unique)
- **Iron Law / RED-GREEN-REFACTOR for skills** — bee-writing-skills (unique)
- **Datamark wrapping (`«…»`) for foreign feedback text** — bee-evolving (unique)
- **Two-gate self-modification (Gate A choice / Gate B diff review) + manual push** — bee-evolving (unique)
- **Scope Freeze and Preview (immutable review scope, fail-closed preflight)** — bee-reviewing (unique)
- **EXISTS/SUBSTANTIVE/WIRED artifact verification** — bee-reviewing (unique)
- **Severity vocabulary P1/P2/P3, autofix_class** — bee-reviewing (unique, referenced by bee-compounding for backlog filing)
- **Headless mode (never self-approves gates, Outstanding Questions section)** — every skill file has one
- **Red Flags section pattern** — every skill file
- **Handoff sentence convention (`[Outcome]. Invoke bee-<next> skill.`)** — every skill file, codified explicitly in bee-writing-skills

## Notes
- All 16 files (AGENTS.md operating block + 15 SKILL.md files) were read successfully; nothing was unreadable.
- `.agents/skills/bee-*` was not read — confirmed byte-identical mirror of `.claude/skills/bee-*` via `diff -rq`.
- Several concepts (Gates, Delegation contract, model tiers, cells) are defined once (in AGENTS.md/bee-hive) and then *referenced/applied* rather than redefined in downstream skills — entries below note both the origin and application sites.
