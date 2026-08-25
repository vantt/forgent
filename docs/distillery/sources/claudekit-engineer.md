---
name: claudekit-engineer
type: git-repo
url: https://github.com/claudekit/claudekit-engineer
local: upstreams/claudekit-engineer
last_analyzed_commit: ed8a1fa7
last_analyzed_date: 2026-08-25
domains_covered: [harness, skills, hooks, workflow, orchestration, routing, integration-contract, context-memory, planning, quality-gates, docs-style, tooling, config-packaging, repo-layout, safety, self-improvement, ux, testing-evals]
---

# claudekit-engineer — Feature Index

Note on scope: this is the exact upstream this machine's global `~/.claude/`
config is built from (rules/agents match near-verbatim). Curated by
architectural relevance to fgOS, not exhaustive per-skill — most
content-capability skills (mobile-development, shopify, payment-integration,
threejs, shader, remotion, media-processing, etc: ~50 of the 87 shipped
skills) carry no platform-architecture lesson and are intentionally omitted.
Full mechanical facts for every skill live in
`plans/reports/distill-inventory-claudekit-engineer-*-260825-1721-report.md`
if a future pass wants to revisit an omitted one.

## harness

### session-init-env-cascade
- **What:** SessionStart hook detects project type/package-manager/framework, resolves active/suggested plan path, and writes ~25 `CK_*` env vars (session id, plan/reports/docs paths, git branch/root, coding-level, validation config) to `CLAUDE_ENV_FILE` — one authoritative injection point every other hook/skill reads from instead of each re-deriving context.
- **Where:** `claude/hooks/session-init.cjs`
- **Notable:** single source of truth for session context, computed once per SessionStart rather than re-derived per hook/skill invocation.
- **Keywords:** CK_* env cascade, resolvePlanPath

### fail-open-hook-wrapper
- **What:** Every hook wraps its body in a double try/catch, logs crashes to `.logs/hook-log.jsonl`, and always exits 0 on internal failure — except the small set of hooks whose entire purpose is to exit 2/block (scout-block, privacy-block, simplify-gate's hard path, workflow-artifact-gate).
- **Where:** `claude/hooks/*.cjs`, shared via `claude/hooks/lib/hook-logger.cjs`
- **Notable:** a hook crashing never blocks the user's turn; blocking is an explicit, named minority of hooks, not the default failure mode.
- **Keywords:** fail-open, hook-logger

### compaction-approval-mitigation
- **What:** On `SessionStart` with `source==='compact'`, prints an explicit warning telling the agent to re-confirm any pending `AskUserQuestion` approval via the tool again rather than assume auto-compact preserved consent.
- **Where:** `claude/hooks/session-init.cjs`
- **Notable:** named fix for a real bug class ("Issue #277 — Auto-compact can bypass AskUserQuestion approval gates") — compaction silently dropping an unresolved approval gate.
- **Keywords:** approval-state mitigation, auto-compact

## skills

### skill-eval-driven-authoring
- **What:** skill-creator's 3-tier eval harness (tier1 static frontmatter/syntax validation $0 CI-mandatory, tier2 e2e "activate and describe, don't execute" probe ~$3.85/run, tier3 LLM-judge clarity/specificity/completeness score ~$0.15/run flagging <6) drives iterative description tuning against under-triggering vs over-triggering, with composite scoring `accuracy×0.80 + security×0.20`.
- **Where:** `claude/skills/skill-creator/SKILL.md`, `scripts/run_loop.py`, `scripts/eval/` (tier-1/2/3, `run.ts`)
- **Notable:** description quality is measured, not guessed — a skill's trigger reliability is treated as an optimizable metric with a real cost/tier tradeoff, and the harness self-diffs (`--diff` mode only re-evals changed skills).
- **Keywords:** eval, description-optimization, benchmarking, tier-1/2/3

### dual-catalog-skills-manifest
- **What:** `guide/SKILLS.md` (human-readable, category-grouped, 📦/📚 has-scripts/has-references emoji legend) is generated 1:1 from `guide/SKILLS.yaml` (machine-readable, same 88-skill/11-category schema plus `argument_hint`/`keywords[]`/`related[]`/`maturity` fields) — one generation step keeps both in sync instead of hand-maintaining two catalogs.
- **Where:** `guide/SKILLS.md`, `guide/SKILLS.yaml`, regenerated via `claude/scripts/scan_skills.py`
- **Notable:** the YAML carries a `related: ["ck:x", "ck:y"]` cross-reference field per skill — a lightweight machine-readable relationship graph alongside the catalog.
- **Keywords:** SKILLS.yaml, machine-readable catalog, has_scripts/has_references

### skill-description-budget-gate
- **What:** `check-skill-descriptions.js` computes the projected total character budget of every skill's always-loaded frontmatter description and requires the configured `skillListingBudgetFraction` be large enough for a 200k-token context floor (4-chars/token heuristic), on top of per-skill length rules (50–512 chars).
- **Where:** `scripts/check-skill-descriptions.js`, `claude/settings.json` (`skillListingBudgetFraction`, `skillListingMaxDescChars`)
- **Notable:** a measured ceiling on total always-loaded skill-listing bloat as the skill count grows, not just a per-skill rule — the actual failure mode (skill count × avg description length crowding out context) is checked directly.
- **Keywords:** skill-listing budget, context floor

### skill-cross-ref-integrity-ci
- **What:** Builds a skill-name registry from every `SKILL.md` frontmatter `name:` field, regex-scans all `claude/**/*.md` for `/ck:<name>` references and fails on any that don't resolve; for changed `SKILL.md` files only, also verifies local relative-path references (`scripts/…`, `references/…`) exist on disk.
- **Where:** `scripts/check-skill-cross-refs.js`
- **Notable:** directory name ≠ registered frontmatter name is the classic failure this catches (e.g. dir `ck-plan` registers as `plan`) — a naming-drift class of bug that's otherwise invisible until a user hits a dead `/ck:` reference.
- **Keywords:** cross-ref registry, name/directory drift

### skill-routing-coverage-ci
- **What:** Every shipped skill must be reachable from a routing reference file, or explicitly justified (min 20-char reason, validated) in an allowlist. Named principle for a routing gap: **audit unique capability → fix routing → reframe description**, before ever deleting a skill for being "unused."
- **Where:** `scripts/check-skill-routing.js`, `.claude/rules/quality-gates.md`
- **Notable:** dormant-by-telemetry is explicitly treated as a routing problem to fix, not evidence the capability has zero value — deletion is the last resort, not the first response to low usage.
- **Keywords:** routing coverage, audit-route-reframe

### skill-owned-routing-files
- **What:** Routing was migrated OFF two always-loaded routing docs onto skill-owned reference files (e.g. `find-skills/references/domain-routing.md`, `cook/references/workflow-routing.md`) that load only when that skill is actually invoked.
- **Where:** `.claude/rules/quality-gates.md` (§ skill routing coverage), `claude/skills/find-skills/`, `claude/skills/cook/references/workflow-routing.md`
- **Notable:** keeps the always-loaded context small while routing logic still lives adjacent to the skill it routes into, rather than centralized in one growing always-on file.
- **Keywords:** routing migration, skill-owned references

### skill-metadata-deletion-tracking
- **What:** Renaming or deleting anything under `claude/` requires a matching entry in `claude/metadata.json`'s `deletions[]` (exact path / dir-prefix / glob) so the installer removes stale files from a user's machine on upgrade. CI enforces both directions: a real deletion missing its entry, and a `deletions[]` entry that still matches a live file.
- **Where:** `scripts/check-metadata-deletions.js`, `claude/metadata.json`
- **Notable:** upgrade cleanliness (no orphaned files left behind on a user's install after a rename) is CI-enforced, not left to a changelog note or manual uninstall step.
- **Keywords:** metadata.json deletions[], clean upgrade

## hooks

### pretooluse-directory-gate
- **What:** Blocks Bash/Glob/Grep/Read/Edit/Write into heavy directories (`node_modules`, `.git`, `dist`, `build`, `__pycache__`) via gitignore-spec matching against `.ckignore`, with an explicit build-command allowlist (`npm build`, `cargo build`, `docker`, `kubectl`, `terraform`) so legitimate build invocations referencing those dirs aren't false-positived, plus separate detection of overly-broad glob patterns (`**` at root) that would flood context even outside blocked dirs.
- **Where:** `claude/hooks/scout-block.cjs`, `claude/hooks/scout-block/pattern-matcher.cjs`, `claude/hooks/scout-block/path-extractor.cjs`, `claude/hooks/scout-block/broad-pattern-detector.cjs`, `claude/hooks/scout-block/error-formatter.cjs`
- **Notable:** two distinct failure modes handled by one hook — reading garbage directories, and reading too broadly even in valid ones — with a maintained allowlist so the gate doesn't fight normal build tooling.
- **Keywords:** .ckignore, broad-glob detection, build-command allowlist

### privacy-approval-handoff
- **What:** Blocks Read access to privacy-sensitive paths (`.env`, credentials, keys) unless the LLM re-requests with an `APPROVED:` path prefix after emitting a structured `@@PRIVACY_PROMPT_START/END@@` JSON marker instructing it to call `AskUserQuestion`. The same sensitive path referenced via Bash is warned, not blocked — deliberately allowing a "user says yes → `bash cat`" flow to complete without a second round-trip through the block.
- **Where:** `claude/hooks/privacy-block.cjs`, `claude/hooks/lib/privacy-checker.cjs`
- **Notable:** the hook designs its own recovery protocol (structured marker → tool call → retry prefix) rather than just refusing; the Bash exemption is a deliberate asymmetry to keep the approved-path 2 turns instead of 4.
- **Keywords:** APPROVED: prefix, @@PRIVACY_PROMPT@@ marker, AskUserQuestion handoff

### ship-verb-gate-with-diff-signal
- **What:** Detects ship/commit intent in the user's prompt via a hard-verb list (`ship|merge|pr|deploy|publish`) vs soft-verb list (`commit|finalize|release`), with negation detection (`don't ship`) and an idiom exception (`ship on`). Only on a hard match does it compute a live `git diff --numstat` + untracked-line-count signal against configurable thresholds (LOC delta, file count, single-file LOC) before deciding to actually block.
- **Where:** `claude/hooks/simplify-gate.cjs`
- **Notable:** the expensive check (live diff computation) only runs after a cheap regex gate passes — and the gate ships wired but disabled by default (see `gate-shipped-disabled-by-default` below), so "installed" and "enforcing" are separately controlled.
- **Keywords:** ship-verb regex, LOC/file-count thresholds, negation detection

### injection-scope-dedup
- **What:** Before injecting development-rules/plan context on `UserPromptSubmit`, reserves an injection scope keyed by CWD (supports subdirectory/monorepo sessions) so the same content isn't re-injected on every prompt within one session/directory scope. Rolls back the reservation on error so a later prompt can retry.
- **Where:** `claude/hooks/dev-rules-reminder.cjs`, shared logic in `claude/hooks/lib/context-builder.cjs`
- **Notable:** the dedup key is CWD-scoped, not session-global — a monorepo session working across multiple subdirectories gets the reminder once per directory, not once total or once per prompt.
- **Keywords:** injection scope reservation, per-CWD dedup

### workflow-artifact-gate-bundle
- **What:** A 5-file structured artifact schema (`context-snippets.json`, `risk-gate.json`, `verification.json`, `review-decision.json`, `adversarial-validation.json`) that `ck:fix`/`ck:cook` must produce and that a hook validates before a ship-like action proceeds. Hard/soft stage detection from prompt or Bash-command text; the artifact directory is located via a 24h-recency pointer file rather than re-scanning the filesystem each time.
- **Where:** `claude/hooks/workflow-artifact-gate.cjs`, `claude/hooks/workflow-artifact-gate/artifact-schema.cjs`, `claude/hooks/workflow-artifact-gate/stage-detector.cjs`, `claude/hooks/workflow-artifact-gate/artifact-locator.cjs`
- **Notable:** functions as a typed inter-skill handoff contract — `DECISIONS` enum (`PASS|PASS_WITH_RISK|BLOCKED`) and `CONTRACT_STATUSES` enum (`OK|CHANGED|BROKEN|UNKNOWN`) are shared vocabulary both the producing skill and the gating hook validate against. Ships fully built but is opt-in (not in `managed-hooks.json`).
- **Keywords:** 5-file artifact bundle, hard/soft stage detection, pointer-file location

### opt-in-vs-managed-hooks
- **What:** Clear separation between "managed" hooks (registered in `claude/settings.json`, listed in `managed-hooks.json`, self-healed by the CLI on drift) and fully-built-but-dormant hooks (`team-context-inject`, `usage-context-awareness`, `workflow-artifact-gate`, the whole `notifications/` subsystem) that ship in the tree but require the consuming project to wire them into its own `settings.json`.
- **Where:** `claude/hooks/managed-hooks.json`, `claude/settings.json`, `claude/hooks/docs/README.md`
- **Notable:** capability can exist in a distributed package without forcing a behavior change on every installer — opt-in hooks are shipped, tested, and documented, but genuinely inert until a project chooses them.
- **Keywords:** managed-hooks.json, opt-in wiring

### gate-shipped-disabled-by-default
- **What:** `simplify-gate.cjs` is unconditionally wired to `UserPromptSubmit` in the managed set (so it always runs its cheap regex check), but its own `DEFAULTS.gate.enabled` is `false` — the actual block behavior only activates once a project's config turns `simplify.gate.enabled:true` on.
- **Where:** `claude/hooks/simplify-gate.cjs`
- **Notable:** decouples "hook is installed and running" from "hook is allowed to block the user" — a project adopts the framework without inheriting an opinionated gate turned on by surprise.
- **Keywords:** disabled-by-default gate, DEFAULTS.gate.enabled

## workflow

### atomic-iteration-loop
- **What:** ck-loop's 8-phase autonomous optimization loop: one atomic change per iteration (must be describable in one sentence without "and" — an explicit atomicity test), commit BEFORE running the verify command, a verify-command safety screen (refuses `rm -rf /`, fetch-and-execute patterns), and named stuck detection (5 consecutive discards → analyze pattern + shift strategy, 10 consecutive → hard stop).
- **Where:** `claude/skills/ck-loop/SKILL.md`, `references/autonomous-loop-protocol.md`, `references/git-memory-pattern.md`
- **Notable:** the loop names its own failure-to-improve condition (10 consecutive discards) rather than iterating indefinitely or requiring a human to notice it's stuck.
- **Keywords:** atomicity test, verify-before-commit inverted (commit before verify), stuck detection

### phase-gated-port-workflow
- **What:** xia's 6-phase Recon→Map→Analyze→Challenge→Plan→Deliver workflow has a hard gate: Challenge (phase 4) must complete before Plan (phase 5) can start — a port can't be planned before the design has been actively second-guessed. Fetched source content is treated as data only: extracted for structure/metadata/behavior evidence, never executed/installed/followed as instruction.
- **Where:** `claude/skills/xia/SKILL.md`, `references/challenge-framework.md`
- **Notable:** this is functionally the same job the `distill`/`xia` pairing in this host repo does (learn-then-port) — the challenge-before-plan gate and the untrusted-content boundary are directly comparable design points, not just an analogy.
- **Keywords:** challenge gate, untrusted-content boundary, recon-map-analyze-challenge-plan-deliver

### worktree-isolated-parallel-cook
- **What:** The `team` skill's `--delegate` mode (lead coordinates, never touches code) plus `isolation:"worktree"` for cook-mode teammates prevents concurrent file conflicts. Explicit fail-loud rule: if `TeamCreate` errors, tell the user Agent Teams is unavailable — no silent fallback to plain subagents that would drop the isolation guarantee.
- **Where:** `claude/skills/team/SKILL.md`, `references/team-coordination-rules.md`
- **Notable:** the failure mode (silently downgrading from worktree-isolated parallelism to unisolated subagents) is explicitly disallowed rather than left as an implicit fallback — matches a lesson this host has already hit independently (`[[project_fanout_worktree_pin_race_forces_sequential]]`-shaped concern).
- **Keywords:** worktree isolation, --delegate mode, fail-loud on TeamCreate error

### dual-hard-gate-scout-and-requirements
- **What:** Both `cook` and `fix` open with two named blocking gates before any implementation: HARD-GATE-SCOUT-FIRST (scan codebase — project type, related files/callers, tests, recent commits, existing patterns — before asking questions) then a requirements gate (`fix`: six concrete-sentence root-cause requirements — exact symptom copied verbatim, repro steps, expected vs actual, root cause not symptom, why-now, blast radius; `cook`: exact output artifacts, acceptance criteria, scope boundary, constraints, touchpoints, all grounded in scout findings). Both also carry an explicit anti-rationalization table naming common shortcuts-to-skip-the-gate ("this is too simple to plan", "I can see the problem, let me fix it") with a rebuttal for each.
- **Where:** `claude/skills/cook/SKILL.md`, `claude/skills/fix/SKILL.md`, `references/diagnosis-protocol.md`, `references/prevention-gate.md`
- **Notable:** directly comparable to this host's own `fgos-coding-exploring`/`fgos-coding-planning` gates — worth a side-by-side check on whether the named-rationalization-table technique (naming the exact excuse an agent would use to skip a gate, not just stating the gate) is already covered here or would sharpen the existing gates.
- **Keywords:** HARD-GATE-SCOUT-FIRST, six-sentence root cause, anti-rationalization table

### complexity-tiered-routing
- **What:** `fix` classifies a bug as simple (single file, clear error) → quick workflow, moderate (multi-file) → standard, complex (system-wide) → deep (research + brainstorm + plan), or parallel (2+ independent issues) → parallel agents — each tier maps to a different reference workflow file, not just a verbosity knob.
- **Where:** `claude/skills/fix/SKILL.md`, `claude/skills/fix/references/complexity-assessment.md`, `claude/skills/fix/references/workflow-quick.md`, `claude/skills/fix/references/workflow-standard.md`, `claude/skills/fix/references/workflow-deep.md`
- **Notable:** the classification happens once, after scout+diagnose, and picks a genuinely different workflow shape per tier (e.g. deep adds brainstorm+plan phases quick doesn't have) rather than the same steps with more/less detail.
- **Keywords:** simple/moderate/complex/parallel tiers, per-tier workflow file

### diff-aware-test-selection
- **What:** tester agent's default mode maps changed files to relevant tests via 5 prioritized strategies (co-located → mirror-dir → import-graph grep → config-change-triggers-full-suite → high-fan-out-module-triggers-full-suite), with named auto-escalation rules to full-suite (config/infra changed, >70% of tests already mapped, explicit `--full` flag) rather than either always running everything or guessing which tests matter.
- **Where:** `claude/agents/tester.md`
- **Notable:** flags changed code with **no** tests found rather than silently skipping it — the absence of coverage is itself a reported finding, not a null result.
- **Keywords:** diff-aware testing, auto-escalation to full suite

### commit-split-heuristic
- **What:** `git` skill's rule for whether a staged change becomes one commit or several: split if types differ (feat+fix mixed), multiple scopes touched (auth+payments), config/deps mixed with code, or >10 unrelated files; keep as one commit if same type/scope, ≤3 files, ≤50 lines. Runs a secret-scan regex (`api[_-]?key|token|password|secret|credential`) over the staged diff before any commit, hard-stopping if matched.
- **Where:** `claude/skills/git/SKILL.md`, `references/commit-standards.md`, `references/safety-protocols.md`
- **Notable:** a concrete, numeric split/merge heuristic for commit granularity rather than leaving "should this be one commit or several" to per-session judgment each time.
- **Keywords:** commit split heuristic, staged-diff secret scan

## orchestration

### twelve-agent-role-catalog
- **What:** 12 narrowly-scoped subagents (brainstormer, code-reviewer, code-simplifier, debugger, docs-manager, fullstack-developer, git-manager, journal-writer, planner, project-manager, researcher, tester, ui-ux-designer), each with an explicit tool allowlist that encodes its authority boundary — e.g. code-reviewer has Write/Edit but is told those are for review reports only, never source edits; project-manager has no Bash at all (only `BashOutput`/`KillBash` — can inspect/kill, not launch); git-manager has no Edit/Write.
- **Where:** `claude/agents/*.md`
- **Notable:** the tool grant itself is part of the role definition, not just a prose instruction — e.g. `researcher.md`'s frontmatter genuinely omits Edit/Write, so "research doesn't implement" is structurally enforced, not just stated.
- **Keywords:** per-role tool allowlist, model-per-role assignment

### shared-team-mode-trailer
- **What:** Every agent file ends with an identical "Team Mode (when spawned as teammate)" section: claim a task via `TaskList`/`TaskUpdate`, respect any stated file-ownership boundary, `SendMessage` a summary to the lead on completion, approve `shutdown_request` unless mid-critical-operation.
- **Where:** `claude/agents/*.md` (trailer section, all 12 files)
- **Notable:** one convention duplicated verbatim into every role file rather than factored into a separate orchestration doc agents must cross-reference — trades DRY for each agent file being fully self-contained.
- **Keywords:** team-mode trailer, shutdown_response protocol

### file-ownership-conflict-stop
- **What:** `fullstack-developer.md`'s CRITICAL rule: never modify a file outside the phase's declared ownership list; STOP and report immediately on a conflict rather than attempting to merge or work around it.
- **Where:** `claude/agents/fullstack-developer.md`
- **Notable:** designed specifically for `/ck:plan --parallel` output — concurrent multi-agent phase execution with conflict prevention baked into the agent's own instructions, not just the orchestrator's.
- **Keywords:** file ownership, parallel-phase conflict stop

### convergent-orchestration-protocol
- **What:** `claude/rules/orchestration-protocol.md` (every subagent prompt must include task/files-to-read/files-it-may-modify/acceptance-criteria/constraints/work-context-path/reports-path; fixed sign-off `Status: DONE|DONE_WITH_CONCERNS|BLOCKED|NEEDS_CONTEXT`) is near-verbatim identical to this host machine's own global `orchestration-protocol.md`.
- **Where:** `claude/rules/orchestration-protocol.md`
- **Notable:** **not a porting candidate** — already adopted (this host's `~/.claude/rules/orchestration-protocol.md` is derived from this exact file). Recorded for completeness/traceability, not as a proposal.
- **Keywords:** orchestration-protocol, already-adopted

## routing

### two-layer-skill-discovery
- **What:** `find-skills` splits skill discovery into two distinct layers: "which already-installed local skill handles this" (loads `references/domain-routing.md`, this host's own local skill registry) vs. "is there an external skill in the open ecosystem worth installing" (shells out to the `npx skills` CLI / skills.sh, with an explicit find → user-review → install-if-approved flow).
- **Where:** `claude/skills/find-skills/SKILL.md`, `references/domain-routing.md`
- **Notable:** keeps "route within what I already have" and "go find something new" as two separate decisions with different trust levels (internal routing is unconditional; external install always needs user review before `npx skills add`) rather than one blended search.
- **Keywords:** local vs external routing, npx skills CLI, install-review gate

### model-per-role-assignment
- **What:** Agents pin a specific model per role by cost/latency fit rather than one model for every subagent: `opus` for judgment-heavy work (planner, code-simplifier), `haiku` for mechanical work (git-manager, journal-writer, docs-manager, tester, researcher, project-manager), `sonnet` for debugger/fullstack-developer, `inherit` for ui-ux-designer.
- **Where:** `claude/agents/*.md` frontmatter (`model:` field)
- **Notable:** the model choice is treated as part of the role's design, not a global default applied uniformly.
- **Keywords:** per-role model pinning

## integration-contract

### github-as-ssot-task-contract
- **What:** `ghpm` uses GitHub Issues as the single source of truth for shared work: every task issue carries a fixed body contract (Outcome, Context, Acceptance Criteria as checkboxes, chronological Handoff Log, suggested Skill Chain), labels encode routing (type/priority/area/risk/agent-or-human lane), and the operating rule is "update GitHub first, then local artifacts, then report from evidence."
- **Where:** `claude/skills/ghpm/SKILL.md`, `references/schema-and-taxonomy.md`
- **Notable:** directly comparable to this host's own fgOS work-item schema (status/stage, ask/answer, evidence) — a different persistence substrate (GitHub Issues vs a local event log) solving the same problem: one durable, externally-inspectable record of task state + decision history that survives any one agent's session.
- **Keywords:** SSOT via GitHub Issues, handoff log format, skill-chain field

### structured-review-artifact-schema
- **What:** (see `workflow-artifact-gate-bundle` under hooks) — the 5-file JSON bundle functions as a typed handoff contract between an implementing skill and a gating hook, with shared enums (`DECISIONS`, `CONTRACT_STATUSES`) both sides validate against instead of free-text pass/fail.
- **Where:** `claude/hooks/workflow-artifact-gate/artifact-schema.cjs`
- **Notable:** cross-referenced under `hooks` — listed here because the schema itself, independent of the hook that enforces it, is the reusable idea (a typed contract for "did the implementation actually get reviewed/verified" between two independently-invoked pieces of automation).
- **Keywords:** typed handoff contract, DECISIONS/CONTRACT_STATUSES enums

### env-var-resolution-hierarchy
- **What:** A 7-level env-var priority chain (`process.env` → project/skill/.env → project/.env → user/skill/.env → user/.env) implemented once as `resolve_env.py` + CLI (`--show-hierarchy`, `--find-all`, `--verbose` to debug which scope "won") that skills call instead of each hand-rolling `.env` lookup order. Documented migration path for adopting it in an existing skill: try/except import with fallback to the skill's legacy resolution logic (non-breaking).
- **Where:** `guide/ENVIRONMENT_RESOLVER.md`, `claude/scripts/resolve_env.py`
- **Notable:** the debugging tooling (`--show-hierarchy` prints ✓/✗ per path per priority level) is treated as equally important as the resolution logic itself — config resolution bugs are a known-hard-to-debug class, so the tool ships its own introspection.
- **Keywords:** env resolution hierarchy, --show-hierarchy debugging, non-breaking migration path

## context-memory

### four-bucket-context-strategy
- **What:** context-engineering skill's Write/Select/Compress/Isolate framework with measured thresholds: warn at 70% context utilization, optimize at 80%; compaction target 50–70% token reduction at <5% quality loss; cache-hit target 70%+; multi-agent cost ≈15× single-agent.
- **Where:** `claude/skills/context-engineering/SKILL.md`, `references/context-fundamentals.md`, `references/context-compression.md`
- **Notable:** gives context-budget decisions named numeric thresholds instead of leaving "when to compress/isolate" to intuition — makes the tradeoff auditable.
- **Keywords:** Write/Select/Compress/Isolate, 70%/80% thresholds, cache-hit target

### subagent-context-injection-budget
- **What:** `subagent-init.cjs` targets ~200 tokens injected per spawned subagent (id/cwd/plan paths/dev-rules reminder/naming templates), with a per-agent-type `contextPrefix` config override and a plan-aware-agent allowlist (only `planner`/`project-manager`/`code-simplifier`/`fullstack-developer` get the `## Plan CLI` section).
- **Where:** `claude/hooks/subagent-init.cjs`
- **Notable:** a concrete, named token budget for subagent boilerplate injection, not just "inject what seems relevant" — and the injected content itself is role-conditional, not identical for every subagent type.
- **Keywords:** SubagentStart injection budget, contextPrefix override

## planning

### plan-verification-discipline
- **What:** `planner.md`'s 5-item discipline: re-grep, don't copy stale scout output; cite `file:line` or explicitly tag `[UNVERIFIED]`; trace, don't assume, control flow; enumerate every caller if >10 exist (list first 10 + total count, never just "many callers"); check struct/object lifetime before adding shared state.
- **Where:** `claude/agents/planner.md`
- **Notable:** each rule targets a specific, named plan-quality failure mode (stale-scout drift, unverifiable claims, assumed-not-traced flow, undercounted fan-out, shared-state lifetime bugs) rather than a generic "be thorough" instruction.
- **Keywords:** re-grep discipline, [UNVERIFIED] tag, caller enumeration

### hydration-sync-back-pattern
- **What:** project-management's session bridge: read a plan's unchecked `[ ]` items → `TaskCreate` one per item → `TaskUpdate` during work → a mandatory sync-back sweep of ALL phase files reconciling every completed task back to phase metadata (backfilling earlier phases too) → resume from remaining `[ ]` items next session.
- **Where:** `claude/skills/project-management/SKILL.md`, `references/hydration-workflow.md`
- **Notable:** Claude's native Tasks are session-scoped (verified by the repo's own research doc: only empty `.lock` files persist in `~/.claude/tasks/`) — this pattern is specifically the bridge that makes that session-scoped mechanism durable across sessions via git-tracked plan files as the actual source of truth.
- **Keywords:** hydration pattern, sync-back sweep, session-scoped Tasks bridge

### docs-size-split-convention
- **What:** docs-manager's `docs.maxLoc` (default 800 lines) proactive-split strategy into `docs/{topic}/index.md` + subtopic files as a doc nears the limit.
- **Where:** `claude/agents/docs-manager.md`
- **Notable:** **not a porting candidate** — this host already uses the identical `docs.maxLoc` convention and default (see this project's own `## Paths` context: `docs.maxLoc: 800`). Recorded for traceability.
- **Keywords:** docs.maxLoc, already-adopted

## quality-gates

### diff-based-lint-severity
- **What:** `lint-content.cjs` partitions frontmatter-rule violations by whether the file changed vs. the PR's base ref: violations on changed files become blocking errors (exit 1); violations on hundreds of pre-existing legacy files become non-blocking warnings. Falls back to warn-only if the base ref is unavailable (e.g. shallow CI checkout).
- **Where:** `scripts/lint-content.cjs`, reusing `check-skill-descriptions.js`'s exported `RULES`
- **Notable:** an explicit, named policy for retrofitting a lint rule onto a large legacy corpus ("hundreds of legacy .md files with pre-existing frontmatter issues" per its own header comment) without a full-repo failure wall blocking unrelated PRs.
- **Keywords:** diff-based severity, legacy-corpus retrofit

### manifest-staleness-check
- **What:** `generate-managed-hooks.cjs` regenerates `claude/hooks/managed-hooks.json` from `claude/settings.json`'s `hooks` block, and supports `--check` mode that fails CI if the generated content differs from what's committed on disk.
- **Where:** `scripts/generate-managed-hooks.cjs`
- **Notable:** turns "is this generated file in sync with its source" into a CI-checkable invariant instead of trusting that whoever edited `settings.json` remembered to regenerate the manifest by hand.
- **Keywords:** generated-file staleness gate, --check mode

### two-stage-code-review
- **What:** ck-code-review runs Stage 1 (spec-compliance: does the diff actually satisfy what was asked, via `references/spec-compliance-review.md`) before Stage 2 (code-quality, delegated to the `code-reviewer` subagent).
- **Where:** `claude/skills/ck-code-review/SKILL.md`, `references/spec-compliance-review.md`
- **Notable:** catches "well-built but wrong thing" before spending review budget on code-quality nitpicks of a deliverable that doesn't even match the ask — ordering the two checks matters, not just having both.
- **Keywords:** spec-compliance gate, two-stage review

## docs-style

### progressive-disclosure-skill-format
- **What:** A 3-level loading model for skill content: YAML frontmatter always loaded → SKILL.md body loaded when the skill is relevant → linked reference/script files loaded only on demand.
- **Where:** `docs/research/complete-guide-to-building-skills-for-claude.md` (Ch.1, adapted from Anthropic's official skill-authoring guide)
- **Notable:** the structural reason SKILL.md files stay short while `references/` directories can be arbitrarily deep — this is the same shape this host's own skill system already follows, worth confirming as intentional rather than incidental.
- **Keywords:** progressive disclosure, 3-level loading

## tooling

### three-tier-eval-harness
- **What:** (see `skill-eval-driven-authoring` under skills) — `scripts/eval/run.ts` dispatches tier1 (static, $0, CI-mandatory), tier2 (e2e activate-and-describe probe, ~$3.85/run, `--diff` mode), tier3 (LLM-judge scoring, ~$0.15/run) — cost matched to what each tier actually needs to catch.
- **Where:** `scripts/eval/run.ts`, `scripts/eval/tier-1-static.ts`, `scripts/eval/tier-1-validators.ts`, `scripts/eval/tier-2-e2e.ts`, `scripts/eval/tier-3-judge.ts`, `scripts/eval/eval-utils.ts`
- **Notable:** cross-referenced under `skills`; listed here because the harness architecture (dispatcher + tiered cost/signal tradeoff + a shared `eval-utils.ts`) is reusable independent of skills specifically.
- **Keywords:** cost-tiered eval, tier dispatcher

### node-builtin-test-no-framework
- **What:** No Jest/Vitest/Mocha dependency — uses Node's built-in `node --test`, with an explicit literal file list in `package.json`'s `test` script (not a glob). Every check script is `require.main === module`-gated and exports its internals for a paired `.test.cjs` file.
- **Where:** root `package.json` (`test` field of the `scripts` block), `scripts/check-metadata-deletions.test.cjs`
- **Notable:** zero test-framework dependency footprint for a package whose whole point is being installed into other people's projects — avoids adding a devDependency surface that could collide with a consuming project's own toolchain.
- **Keywords:** node --test, zero test-framework dependency

## config-packaging

### resumable-phased-installer
- **What:** `install.sh`/`install.ps1` (1:1 ported phase models across bash and PowerShell) persist a JSON state file tracking 5 phases (system_deps, node_deps, python_env, env_migration, verify) so `--resume`/`-Resume` skips already-done phases. Per-skill Python dependencies are installed line-by-line (not `pip install -r`) via a wheel-first → build-tools-check → source-build fallback chain, with per-skill install logs.
- **Where:** `claude/skills/install.sh`, `claude/skills/install.ps1` (both write a runtime install-state JSON file at install time; that file isn't itself shipped in the repo, so it isn't cited as a path here)
- **Notable:** installing 87 skills' worth of heterogeneous dependencies (Python, Node, system packages) is treated as a genuinely resumable multi-phase job with per-item failure isolation, not an all-or-nothing script.
- **Keywords:** resumable install, phased state file, wheel-first fallback chain

### cross-cli-path-migration-manifest
- **What:** `portable-manifest.json` tracks `providerPathMigrations` — a versioned list of `{provider, type, from, to, since}` entries recording where each supported coding-agent CLI (codex, gemini-cli, windsurf, cursor) has moved its own skill/agent file locations across CLI versions (e.g. gemini-cli's skills moved `.gemini/skills` → `.agents/skills`, then windsurf/cursor later moved back OUT of that shared convention into their own provider-specific dirs).
- **Where:** `portable-manifest.json`
- **Notable:** a distribution targeting multiple coding-agent CLIs needs its own migration log for where each target's conventions have moved — directly relevant to any host distributing skills/agents across more than one CLI surface (this host ships both `.agents/` and `.claude/` thin-wrapper pairs already).
- **Keywords:** providerPathMigrations, multi-CLI distribution

### source-vs-runtime-dir-split
- **What:** `package.json`'s `claudekit` config block (`{sourceDir:"claude", runtimeDir:".claude"}`) plus `prepare-release-assets.cjs`'s `fs.cpSync` staging step keeps the tracked source tree (`claude/`) separate from the installed runtime tree (`.claude/`) that hooks/skills actually execute from.
- **Where:** root `package.json` (`"claudekit"` block), `scripts/prepare-release-assets.cjs`
- **Notable:** lets the packaging step transform/filter/rename before install without ever touching the tracked source — the repo you read on GitHub is not byte-identical to what gets installed.
- **Keywords:** source/runtime split, packaging-time transform

## repo-layout

### dev-main-release-branch-flow
- **What:** `branch-protection.yml` enforces PRs into `main` come only from `dev` or `*hotfix*` branches. `release-beta.yml` (push→dev) cuts prereleases; `release.yml` (push→main) runs semantic-release for stable. Two separate post-release-to-main jobs then reconcile `dev` differently: `sync-dev-after-release.yml` force-resets `dev` to `main` (`git reset --hard` + force-push), while `sync-main-to-dev.yml` does a plain merge — both guarded by the identical trigger/commit-message condition.
- **Where:** `.github/workflows/branch-protection.yml`, `.github/workflows/release-beta.yml`, `.github/workflows/release.yml`, `.github/workflows/sync-dev-after-release.yml`, `.github/workflows/sync-main-to-dev.yml`
- **Notable:** flagged by the inventory pass as worth a second look, not asserted as a bug — two workflows reconciling the same branch via two different strategies (destructive reset vs. merge) under the same guard condition could be redundant, conflicting, or an intentional belt-and-suspenders; not verified here.
- **Keywords:** dev/main branch flow, force-reset vs merge reconciliation

## safety

### agents-rule-of-two
- **What:** A skill should satisfy at most 2 of {[A] processes untrustworthy input, [B] accesses sensitive data, [C] changes state}; violating all 3 (fetch + user-file access + exec) is flagged "⛔ highest risk." Attributed to Meta's "Agents Rule of Two."
- **Where:** `docs/research/preventing-prompt-injection-in-skills.md`
- **Notable:** a 3-clause litmus test any skill author can apply in seconds, positioned as the actionable companion to the heavier architectural patterns below.
- **Keywords:** Agents Rule of Two, [A][B][C] risk clauses

### six-architectural-injection-defenses
- **What:** Catalogs 6 patterns (from Beurer-Kellner et al. 2025) for when a skill must process untrusted fetched content: **Action Selector** (LLM only picks from a fixed action list, never sees raw tool output), **Plan-Then-Execute** (lock a full plan before touching external data), **LLM Map-Reduce** (isolated per-file calls, non-LLM reducer), **Dual LLM** (privileged LLM never sees untrusted data; quarantined LLM has no tools; a non-LLM orchestrator coordinates via symbolic `$VAR` references), **Code-Then-Execute** (generate a script before seeing external data, then run it sandboxed), **Input-Output Filter** (a retriever extracts only named fields; a summarizer never sees the raw original input).
- **Where:** `docs/research/architectural-defense-prompt-injection.md`
- **Notable:** grounded in a cited Oct-2025 multi-org paper (14 researchers incl. OpenAI/Anthropic/DeepMind) showing all 12 common prompting-level defenses were bypassed >90% of the time under adaptive attack — the doc's core claim is that prompt-injection defense must be architectural, not instructional, and these 6 patterns are the menu of architectural options.
- **Keywords:** Dual LLM, Plan-Then-Execute, Action Selector, >90% bypass rate citation

### untrusted-content-execution-boundary
- **What:** Fetched/external repo content is extracted for structure/metadata/behavior evidence only — never executed, installed, or followed as an instruction. Stated as a rule in `xia` (a live, shipped skill) and echoed as the closing principle of both prompt-injection research docs.
- **Where:** `claude/skills/xia/SKILL.md`, `docs/research/architectural-defense-prompt-injection.md`, `docs/research/preventing-prompt-injection-in-skills.md`
- **Notable:** the same boundary is enforced in a shipped, user-invoked skill — not just documented as research — giving it a concrete implementation to point at rather than only a principle.
- **Keywords:** untrusted-content boundary, xia security rule

### credential-hygiene-across-autoresearch-family
- **What:** ck-loop, ck-security, and ck-scenario all mandate masking JWTs, 32+ hex strings, AWS key prefixes, and connection strings in any output or log — inherited as one shared safety posture from the ck-autoresearch umbrella rather than each skill inventing its own redaction rule.
- **Where:** `claude/skills/ck-autoresearch/SKILL.md` ("absorption map" / shared safety posture section), `claude/skills/ck-loop/SKILL.md`, `claude/skills/ck-security/SKILL.md`
- **Notable:** a family of related skills sharing one safety contract by inheritance from a documented umbrella, rather than each independently re-deciding what to redact.
- **Keywords:** credential masking, shared safety posture, ck-autoresearch umbrella

## self-improvement

### loop-stuck-detection
- **What:** (see `atomic-iteration-loop` under workflow) — ck-loop names its own failure-to-improve condition: 5 consecutive discarded iterations triggers pattern analysis + a strategy shift; 10 consecutive triggers a hard stop.
- **Where:** `claude/skills/ck-loop/SKILL.md`, `references/autonomous-loop-protocol.md`
- **Notable:** cross-referenced under `workflow`; listed here because the specific idea (a self-improvement loop must define its own "this isn't working" exit condition, with an intermediate escalation before the hard stop) generalizes beyond this one skill.
- **Keywords:** stuck detection, escalation before hard stop

## ux

### visual-self-review-pattern
- **What:** The `preview` skill's self-contained HTML output (mandatory theme-toggle button, anti-slop CSS/font rules) is adapted from `tech-graph`'s own SVG visual-self-review loop: generate → render → look at own output → fix. Applied to two different artifact types (diagrams, general HTML explanations) via the same named pattern.
- **Where:** `claude/skills/preview/SKILL.md`, `claude/skills/tech-graph/` (origin)
- **Notable:** the pattern is explicitly named and reused across skills rather than reinvented per artifact type — a skill that generates visual output is expected to look at its own result before calling the task done.
- **Keywords:** visual self-review, theme-toggle mandatory

### calm-reader-mode
- **What:** `markdown-novel-viewer`'s book-like reading UI (auto-hide header, progress bar, keyboard shortcuts, warm light/dark color palettes, mobile FAB) is a distinct "focused reading" mode separate from a general docs site — purpose-built for long-form review (RFCs, plans, specs) rather than reference lookup.
- **Where:** `claude/skills/markdown-novel-viewer/SKILL.md`
- **Notable:** this host already has an equivalent (`mdview` / the markdown-novel-viewer skill listed in this session's own skill roster) — worth confirming whether it's the same lineage or a convergent build, not treating as a fresh idea.
- **Keywords:** calm reader mode, focused long-form review

## testing-evals

### structured-qa-report-format
- **What:** The `test` skill's `references/report-format.md` gives a fixed QA report template so testing output is consistently structured across unit/integration/e2e/UI runs and multiple language toolchains (Jest/Vitest/Mocha, pytest, Go, Rust, Flutter).
- **Where:** `claude/skills/test/SKILL.md`, `references/report-format.md`
- **Notable:** cross-references `three-tier-eval-harness` under tooling — this is the analogous fixed-format idea applied to ordinary test runs rather than skill-quality evals.
- **Keywords:** structured QA report, cross-toolchain format
