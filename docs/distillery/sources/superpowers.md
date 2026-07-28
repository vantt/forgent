---
name: superpowers
type: git-repo
url: https://github.com/obra/superpowers
local: upstreams/superpowers
last_analyzed_commit: 3dcbd5c
last_analyzed_date: 2026-07-28
domains_covered: [harness, skills, hooks, workflow, orchestration, routing, integration-contract, context-memory, planning, quality-gates, docs-style, tooling, config-packaging, repo-layout, safety, self-improvement, ux, testing-evals]
---

# superpowers (obra) — Feature Index

> Extracted from HEAD `3dcbd5c` on 2026-07-28. Clone: `upstreams/superpowers`. Full inventory reports: `plans/reports/distill-superpowers-{skills,hooks,packaging,docs,tooling-tests}-inventory-260728-1653-report.md`.

A skill library for coding agents (obra), 14 process/discipline skills + a
meta-dispatch skill, shipped as ONE plugin across 8 harnesses (Claude Code,
Codex, Cursor, Copilot CLI, Gemini CLI, Kimi Code, OpenCode, Pi) via 6
independently hand-maintained manifest formats. Core thesis: skills are
harness-agnostic prose naming *actions*, never tool names; a per-harness
"bootstrap" (hook, plugin lifecycle, or context-file) injects the meta-skill
at session start so skills auto-trigger without per-session opt-in. Ships its
own eval methodology (pressure-tested skill authoring, a tmux-driven LLM
actor/verifier harness called Drill, and a cheap micro-test harness for
instruction-wording decisions) and treats its own skill text as versioned,
eval-gated product — 6 major SDD redesigns and 4 visual-companion hardening
passes are documented with dated specs, real gate outcomes, and reversals.

## harness

### cross-harness-bootstrap-injection
- **What:** The single integration mechanism the whole plugin depends on: at session start, every harness injects the full `using-superpowers/SKILL.md` body (frontmatter stripped), wrapped in an `<EXTREMELY_IMPORTANT>` tag, so skills auto-trigger without the user opting in each session. Three implementation "Shapes" per `docs/porting-to-a-new-harness.md`: **Shape A** shell-hook (Claude Code, Cursor — stdout-as-JSON via a polyglot dispatcher), **Shape B** in-process plugin/extension lifecycle callback injecting a **user-role** message, never system (OpenCode, Pi — avoids token bloat from repeated system messages and multi-system-message model breakage), **Shape C** instructions-file with native `@`-include (Gemini — no hook/plugin system exists).
- **Where:** `hooks/session-start`, `hooks/hooks.json`, `hooks/hooks-cursor.json`, `.opencode/plugins/superpowers.js`, `.pi/extensions/superpowers.ts`, `GEMINI.md`, `docs/porting-to-a-new-harness.md`.
- **Notable:** Hard requirement stated directly: "If the only way to get Superpowers in front of the model is for your human partner to opt in each session... the harness cannot be properly supported." The contributor guidelines make this falsifiable: a new-harness PR must include a session transcript proving the acceptance test — sending "Let's make a react todo list" into a clean session and confirming `brainstorming` auto-triggers before any code is written.
- **Keywords:** Shape A/B/C, bootstrap injection, acceptance test, `EXTREMELY_IMPORTANT`, zero-opt-in requirement.
- **Seen:** 3dcbd5c

### opencode-pi-independent-reimplementation
- **What:** OpenCode (`.opencode/plugins/superpowers.js`) and Pi (`.pi/extensions/superpowers.ts`) each independently reimplement the identical Shape-B pattern — read `using-superpowers/SKILL.md` at runtime, wrap in `<EXTREMELY_IMPORTANT>`, inject as a user message — against different event models: OpenCode uses a per-message idempotency check via `experimental.chat.messages.transform` with a module-level `_bootstrapCache`; Pi uses an explicit `session_start`/`session_compact` arm → `context` inject → `agent_end` disarm state machine.
- **Where:** `.opencode/plugins/superpowers.js`, `.pi/extensions/superpowers.ts`.
- **Notable:** Both independently cite the same design constraint in code comments (issue-numbered): system messages cause token bloat when repeated every turn (#750) and break Qwen and other models when multiple are present (#894) — convergent evidence for "bootstrap as user message, never system message" as a hard rule, not a style choice.
- **Keywords:** messages.transform, bootstrap cache, session_compact re-arm, convergent Shape-B design.
- **Seen:** 3dcbd5c

### tool-vocabulary-translation-references
- **What:** Four per-harness reference docs (`skills/using-superpowers/references/{codex,gemini,pi,antigravity}-tools.md`) translate the skills' harness-agnostic verbs ("dispatch a subagent," "create a todo") into each runtime's concrete tool names — the layer that makes skill prose portable without editing the skills themselves.
- **Where:** `skills/using-superpowers/references/codex-tools.md`, `skills/using-superpowers/references/gemini-tools.md`, `skills/using-superpowers/references/pi-tools.md`, `skills/using-superpowers/references/antigravity-tools.md`.
- **Notable:** Each documents real capability gaps, not just renames: Pi has no subagent or todo tool at all ("do not fabricate `Task` calls... explain that the optional subagent capability is not installed"); Antigravity has no todo tool either — `manage_task` manages background *processes*, not checklists, so task tracking uses a markdown "task artifact" instead (flagged explicitly: "**Not** `manage_task`"); Codex requires `multi_agent = true` in `~/.codex/config.toml` to unlock subagent dispatch at all.
- **Keywords:** action-to-tool mapping, capability gap documentation, `invoke_agent`, `spawn_agent`, no-todo-tool fallback.
- **Seen:** 3dcbd5c

## hooks

### session-start-context-injection
- **What:** `SessionStart`/`sessionStart` hook fires on `startup|clear|compact`, reads `using-superpowers/SKILL.md`, and emits a **different JSON shape per detected harness** because "Claude Code reads BOTH `additional_context` and `hookSpecificOutput` without deduplication" — Cursor gets flat `additional_context`, Claude Code gets nested `hookSpecificOutput.additionalContext`, Copilot CLI/unknown gets flat `additionalContext`.
- **Where:** `hooks/hooks.json`, `hooks/hooks-cursor.json`, `hooks/run-hook.cmd`, `hooks/session-start`.
- **Notable:** `run-hook.cmd` is a **polyglot file** — a `: << 'CMDBLOCK' ... CMDBLOCK` heredoc that Windows `cmd.exe` reads as batch (finds Git-Bash at 2 hardcoded paths or PATH, else exits 0 silently — degrade, never break) while Unix shells skip it as a no-op. Hook scripts are deliberately extensionless (`session-start`, not `.sh`) because Claude Code's Windows handling auto-prepends `bash` to any command containing `.sh`, double-invoking it. JSON is hand-escaped (`${s//old/new}` parameter expansion) rather than shelling to `jq`, for a dependency-free plugin. This is a pure context-injection hook family — no PreToolUse/PostToolUse gating exists anywhere in the repo's `hooks/`.
- **Keywords:** polyglot script, extensionless hook, `hookSpecificOutput`, `CLAUDE_PLUGIN_ROOT`/`CURSOR_PLUGIN_ROOT`/`COPILOT_CLI` detection, injection-only (no gating).
- **Seen:** 3dcbd5c

### pre-commit-evals-lint-gate
- **What:** `.pre-commit-config.yaml` defines 3 `repo: local` hooks (ruff check, ruff format --check, ty check) scoped to `^evals/.*\.py$`, run via `uv --project evals`/`uv --directory evals`, `language: system` (no isolated env).
- **Where:** `.pre-commit-config.yaml`.
- **Notable:** Ordinary commit-time lint gate for the separate Python `evals/` eval harness — unrelated to the runtime SessionStart mechanism above. The `evals/` directory itself isn't present in this clone (git submodule/subtree lifted per `docs/testing.md`, not vendored here).
- **Keywords:** pre-commit, ruff, ty check, evals-only scope.
- **Seen:** 3dcbd5c

## skills

### iron-law-discipline-template
- **What:** A 3-part enforcement template used verbatim across `test-driven-development`, `systematic-debugging`, and `verification-before-completion`: a one-line all-caps imperative ("NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST", "NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST", "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE"), followed by a "Common Rationalizations" table and a "Red Flags — STOP and Start Over" list mirroring the same excuses.
- **Where:** `skills/test-driven-development/SKILL.md`, `skills/systematic-debugging/SKILL.md`, `skills/verification-before-completion/SKILL.md`, `skills/writing-skills/SKILL.md` ("Match the Form to the Failure" section names this template explicitly).
- **Notable:** `writing-skills` is explicit about *when* this form applies vs backfires: prohibition+rationalization-table+red-flags is for rule-skipping-under-pressure failures; a positive recipe/contract is for wrong-shaped-output failures, and prohibitions are measured to *backfire* on shaping problems (a micro-test found the prohibition arm produced more unwanted content than even a no-guidance control).
- **Keywords:** Iron Law, rationalization table, red flags, Match the Form to the Failure.
- **Seen:** 3dcbd5c

### skill-discovery-optimization
- **What:** A hard rule that a skill's YAML `description` must describe **only triggering conditions, never workflow** — cited concrete failure: a description mentioning "code review between tasks" caused an agent to run only ONE review even though the skill's flowchart specified two; removing the workflow summary fixed it.
- **Where:** `skills/writing-skills/SKILL.md`.
- **Notable:** Named "Skill Discovery Optimization" (SDO) — an explicit rename from an earlier "Claude Search Optimization" (CSO) term, done as part of the platform-neutral-prose campaign (see `platform-neutral-prose-phased-campaign` under docs-style). Directly explains why `subagent-driven-development`'s own description is deliberately terse.
- **Keywords:** SDO, trigger-only description, workflow-in-description anti-pattern.
- **Seen:** 3dcbd5c

### tdd-for-skill-authoring
- **What:** Skill-authoring itself is framed as TDD applied to documentation: write pressure-scenario tests, watch an agent fail without the skill (RED), write the skill (GREEN), close loopholes found by re-testing (REFACTOR) — literal mapping table: "pressure scenario with subagent" = "test case", "SKILL.md" = "production code".
- **Where:** `skills/writing-skills/SKILL.md`, `skills/writing-skills/testing-skills-with-subagents.md`, `skills/systematic-debugging/CREATION-LOG.md`, `skills/systematic-debugging/test-academic.md`, `skills/systematic-debugging/test-pressure-1.md`, `skills/systematic-debugging/test-pressure-2.md`, `skills/systematic-debugging/test-pressure-3.md`.
- **Notable:** `systematic-debugging`'s own pressure-test fixtures are preserved in-repo as a worked example (production-outage $15k/min pressure; 4-hour sunk-cost pressure; senior-engineer authority pressure). `testing-skills-with-subagents.md` adds a "Meta-Testing" step: when an agent picks wrong, ask it directly "How could that skill have been written differently" and route the fix by whether the answer is skill-was-clear / should-have-said-X / didn't-see-it.
- **Keywords:** RED/GREEN/REFACTOR for skills, pressure scenario, Meta-Testing, CREATION-LOG.
- **Seen:** 3dcbd5c

### bulletproofing-against-rationalization
- **What:** A named authoring technique: close every loophole explicitly, add a foundational "violating the letter is violating the spirit" line, build a rationalization table, add a red-flags list — backed by cited persuasion research (Cialdini 2021; Meincke et al. 2025, N=28,000 AI conversations, compliance 33%→72%) for *why* imperative/authority language works on LLMs, while explicitly flagging Reciprocity and Liking as principles to avoid for discipline-enforcement content ("Conflicts with honest feedback culture").
- **Where:** `skills/writing-skills/SKILL.md`, `skills/writing-skills/persuasion-principles.md`.
- **Notable:** Deliberately picks Authority/Commitment/Scarcity/Social-Proof rhetoric while ruling out Reciprocity/Liking as counter-productive for compliance-style skills — a specific, sourced claim about which persuasion levers suit discipline vs rapport content.
- **Keywords:** bulletproofing, persuasion principles, Cialdini, compliance rate.
- **Seen:** 3dcbd5c

### positive-instruction-doctrine
- **What:** A 5-point doctrine on when negative/prohibition-phrased instructions work vs backfire, derived from a cheap micro-test harness (one API call per sample, ~$0.15-0.30/sample vs $12/full eval run): tripwires and recognition tables work reliably; discrete prohibitions hold only absent a competing model incentive; **composition prohibitions measurably backfire** ("don't restate the brief" scored worse than no guidance at all, 4.4 vs 3.6 re-typed values, while a positive recipe scored 3.0 with zero variance); ties go to the shorter phrasing (Codex re-reads SKILL.md ~500×/session).
- **Where:** `docs/superpowers/specs/2026-06-10-positive-instruction-redesign-design.md`.
- **Notable:** Audited ~30 skills' negative instructions (3 tripwires, 14 recognition tables, ~20 policy gates, 5 true composition-prohibitions) with a per-item keep/replace disposition. Records a **negative result as a first-class finding**: a follow-up micro-test on `writing-plans`' banned-placeholder list found current-gen models produce zero placeholders with or without the list (40/40 clean) — explicit conclusion: "do NOT open the follow-up PR."
- **Keywords:** prohibition vs recipe, tripwire, micro-test harness, negative-result documentation.
- **Seen:** 3dcbd5c

### brainstorming-hard-gate
- **What:** Mandatory design-before-code skill: context → questions → 2-3 approaches → design write-up, gated by a literal `<HARD-GATE>` tag: "Do NOT invoke any implementation skill, write any code, scaffold any project... until you have presented a design and the user has approved it. This applies to EVERY project regardless of perceived simplicity," with a named anti-pattern section ("This Is Too Simple To Need A Design").
- **Where:** `skills/brainstorming/SKILL.md`.
- **Notable:** Terminal state is hard-coded — "The ONLY skill you invoke after brainstorming is writing-plans." Runs its own inline spec self-review checklist (placeholder scan, internal consistency, scope, ambiguity) rather than dispatching a reviewer subagent.
- **Keywords:** HARD-GATE, design-before-code, spec self-review.
- **Seen:** 3dcbd5c

### subagent-driven-development-skill
- **What:** Executes a plan by dispatching one fresh implementer subagent per task, a two-part task review (spec compliance + code quality), a capped fix loop, and a final whole-branch review — see full mechanism under `orchestration`.
- **Where:** `skills/subagent-driven-development/SKILL.md`, `skills/subagent-driven-development/implementer-prompt.md`, `skills/subagent-driven-development/task-reviewer-prompt.md`, `skills/subagent-driven-development/re-review-prompt.md`, `skills/subagent-driven-development/scripts/sdd-workspace`, `skills/subagent-driven-development/scripts/task-brief`, `skills/subagent-driven-development/scripts/review-package`.
- **Notable:** Description text deliberately omits workflow detail (per `skill-discovery-optimization` above) — the SKILL.md body carries all mechanism.
- **Keywords:** ledger, breaker, fix round; full mechanism detailed in this file's `sdd-ledger-and-circuit-breaker` entry under the orchestration domain.
- **Seen:** 3dcbd5c

### systematic-debugging-skill
- **What:** 4-phase mandatory debugging process (Root Cause Investigation → Pattern Analysis → Hypothesis/Testing → Implementation) forbidding a fix before root cause is understood, with a hard escalation rule at 3+ failed fix attempts: "STOP and question the architecture."
- **Where:** `skills/systematic-debugging/SKILL.md`, `root-cause-tracing.md`, `defense-in-depth.md` (4 validation layers: entry/business-logic/environment-guard/debug-instrumentation), `condition-based-waiting.md`, `find-polluter.sh`.
- **Notable:** A "your human partner's Signals You're Doing It Wrong" section maps exact human phrases ("Stop guessing", "Ultra-think this") to "STOP. Return to Phase 1." `find-polluter.sh` is a real bisection script that runs test files one-by-one to find which creates a stray file/dir.
- **Keywords:** Iron Law, Phase 1-4, defense-in-depth, condition-based-waiting, architecture-escalation.
- **Seen:** 3dcbd5c

### test-driven-development-skill
- **What:** Literal Red-Green-Refactor with a no-exceptions rule against keeping pre-written code "as reference" while writing tests ("Delete means delete").
- **Where:** `skills/test-driven-development/SKILL.md`, `writing-good-tests.md`.
- **Notable:** `writing-good-tests.md` formalizes two gate functions: "Name the Break" (a test must name the production change that would make it fail; bans mirror-assertions computed by the same code under test) and "Exercise the Real Thing" (bans asserting on the mock itself; requires mocks mirror real data completely), plus a closing "Mutation Check" (mentally mutate the production code, confirm ≥1 test fails per mutation).
- **Keywords:** RED/GREEN/REFACTOR, mirror assertion, change detector, mutation check.
- **Seen:** 3dcbd5c

### verification-before-completion-skill
- **What:** A 5-step "Gate Function" (IDENTIFY → RUN → READ → VERIFY → ONLY THEN claim) required before any completion claim; "Skip any step = lying, not verifying."
- **Where:** `skills/verification-before-completion/SKILL.md`.
- **Notable:** Explicitly targets satisfaction language ("Great!", "Perfect!", "Done!") as violations and states the rule applies to "paraphrases and synonyms... implications of success," closing the wording-workaround loophole directly in the skill text.
- **Keywords:** Gate Function, evidence before claims, satisfaction-language ban.
- **Seen:** 3dcbd5c

### writing-plans-skill
- **What:** Produces implementation plans for "an engineer [with] zero context for our codebase and questionable taste" — bite-sized (2-5 min steps), TDD-structured tasks with a required literal header (Goal/Architecture/Tech Stack/Global Constraints) and a "No Placeholders" ban list (`TBD`, "Add appropriate error handling", "Similar to Task N" instead of repeating the code).
- **Where:** `skills/writing-plans/SKILL.md`, `plan-document-reviewer-prompt.md`.
- **Notable:** Author-run self-review checklist catches cross-task type/signature drift (e.g. `clearLayers()` vs `clearFullLayers()`). Ends with an explicit execution-choice handoff: Subagent-Driven (recommended) vs Inline Execution, each with a `REQUIRED SUB-SKILL` pointer.
- **Keywords:** No Placeholders, Bite-Sized Task Granularity, Global Constraints header.
- **Seen:** 3dcbd5c

### executing-plans-skill
- **What:** Loads a written plan, reviews it critically, executes tasks per its steps, hands off to `finishing-a-development-branch`.
- **Where:** `skills/executing-plans/SKILL.md`.
- **Notable:** Explicitly recommends `subagent-driven-development` instead whenever subagents are available — this skill is the sequential fallback. Final line: "Never start implementation on main/master branch without explicit user consent."
- **Keywords:** REQUIRED SUB-SKILL, When to Stop and Ask, main-branch consent gate.
- **Seen:** 3dcbd5c

### finishing-a-development-branch-skill
- **What:** A step-numbered state machine (verify tests → detect git/worktree environment → determine base branch → present a fixed 4-option menu → execute → clean up), with a 4th "discard" option gated behind a **literal typed-confirmation requirement**: only the exact typed word `discard` authorizes deletion.
- **Where:** `skills/finishing-a-development-branch/SKILL.md`.
- **Notable:** Uses the same `GIT_DIR != GIT_COMMON` worktree-detection primitive as `using-git-worktrees`. A "Common Rationalizations" table targets finishing-a-branch-specific excuses (e.g. "Tests passed earlier this session" → "Run the suite on the tree you are about to integrate").
- **Keywords:** typed-confirmation gate, GIT_DIR/GIT_COMMON, provenance-based cleanup.
- **Seen:** 3dcbd5c

### using-git-worktrees-skill
- **What:** Detects existing isolation first (`GIT_DIR != GIT_COMMON`, with a submodule guard via `git rev-parse --show-superproject-working-tree` since submodules trip the same check) → prefers the harness's native worktree tool → falls back to manual `git worktree add` only if no native tool exists, with an explicit warning that the fallback "creates phantom state your harness can't see or manage."
- **Where:** `skills/using-git-worktrees/SKILL.md`.
- **Notable:** Requires explicit user consent before creating a worktree unless a preference was already declared; verifies `.worktrees/`/`worktrees/` is git-ignored (`git check-ignore`) before use; auto-detects project setup commands (npm/cargo/pip/poetry/go) and runs a baseline test suite before reporting ready.
- **Keywords:** submodule guard, native-tool-first, sandbox fallback.
- **Seen:** 3dcbd5c

### receiving-code-review-skill
- **What:** Governs the register of responding to review feedback (restate → verify → evaluate → respond → implement) instead of reflexive agreement, with an explicit "Forbidden Responses" list banning phrases like "You're absolutely right!" / "Great point!" as "performative."
- **Where:** `skills/receiving-code-review/SKILL.md`.
- **Notable:** A "YAGNI Check for 'Professional' Features" gate: if a reviewer suggests "implementing properly," grep the codebase for actual usage first, and propose removal if unused. Distinguishes trust level by source — "your human partner" is trusted directly, "External Reviewers" must pass 5 verification checks before any suggestion is implemented.
- **Keywords:** performative agreement ban, YAGNI check, trusted-vs-external reviewer.
- **Seen:** 3dcbd5c

### requesting-code-review-skill
- **What:** Defines when to dispatch a code-reviewer subagent (never review the diff inline) via a shared `code-reviewer.md` template — a read-only review contract ("Do not mutate the working tree, the index, HEAD, or branch state in any way"), a Critical/Important/Minor severity taxonomy, and a "Ready to merge? Yes | No | With fixes" verdict field.
- **Where:** `skills/requesting-code-review/SKILL.md`, `skills/requesting-code-review/code-reviewer.md`.
- **Notable:** `code-reviewer.md` is reused verbatim by both this skill and `subagent-driven-development`'s final whole-branch review — a shared dispatch-prompt template rather than a duplicated one.
- **Keywords:** BASE_SHA/HEAD_SHA, read-only review contract, severity taxonomy.
- **Seen:** 3dcbd5c

### dispatching-parallel-agents-skill
- **What:** Teaches when to fan out multiple subagents concurrently vs sequentially, with a mechanical rule: "Multiple dispatch calls in one response = parallel execution. One per response = sequential."
- **Where:** `skills/dispatching-parallel-agents/SKILL.md`.
- **Notable:** A "Common Mistakes" ❌/✅ table (too-broad scope, no context, no constraints, vague output) plus a worked real-session example (6 failures across 3 files → 3 parallel agents → reconciled results).
- **Keywords:** parallel dispatch rule, common-mistakes table.
- **Seen:** 3dcbd5c

## workflow

### skill-dispatch-priority-and-red-flags
- **What:** `using-superpowers/SKILL.md`, the meta/dispatch skill that every other skill depends on: a `<SUBAGENT-STOP>` tag bypasses it entirely when running inside an already-scoped subagent; an `<EXTREMELY-IMPORTANT>` block sets a deliberately low activation bar ("If you think there is even a 1% chance a skill might apply... YOU MUST invoke it"); a 12-row "Red Flags" table maps rationalization thoughts ("This is just a simple question", "I need more context first") to rebuttals, engineered to close every skip-the-check argument.
- **Where:** `skills/using-superpowers/SKILL.md`.
- **Notable:** Skill-priority ordering rule: when multiple skills apply, process skills (`brainstorming`, `systematic-debugging`) go first and set the approach; implementation skills carry it out. Escape valve preserved: invocation is mandatory but "If it turns out wrong for the situation, you don't have to use it" — abandoning a wrongly-triggered skill is explicitly allowed.
- **Keywords:** 1% activation threshold, Red Flags table, process-skills-first, subagent bypass.
- **Seen:** 3dcbd5c

### user-instructions-precedence
- **What:** A strict 3-tier precedence stated as the closing rule of the dispatch skill: "User instructions (CLAUDE.md, AGENTS.md, GEMINI.md, etc, direct requests) take precedence over skills, which in turn override default behavior."
- **Where:** `skills/using-superpowers/SKILL.md`.
- **Notable:** Only the human explicitly waiving a skill workflow authorizes skipping it — this is the single sentence resolving any conflict between a loaded skill and a loaded instructions file.
- **Keywords:** precedence tier, instructions-over-skills.
- **Seen:** 3dcbd5c

### announce-at-start-pattern
- **What:** A verbatim convention originating from the dispatch skill's "The Rule" — announce "I'm using the X skill to Y" and follow it exactly, creating a todo per checklist item — repeated in `executing-plans`, `finishing-a-development-branch`, `subagent-driven-development`, `using-git-worktrees`, `writing-plans`.
- **Where:** `skills/using-superpowers/SKILL.md`, and the 5 skills above.
- **Notable:** Makes skill invocation observable in the transcript, which the `explicit-skill-request-detection-tests` (testing-evals domain) rely on to grep for compliance.
- **Keywords:** announce-at-start, transcript observability.
- **Seen:** 3dcbd5c

## orchestration

### sdd-ledger-and-circuit-breaker
- **What:** `subagent-driven-development`'s core mechanism: a persistent **ledger file** (`progress.md`) is the recovery mechanism across context compaction ("Conversation memory does not survive compaction"); a **capped fix loop** (5 rounds max per task) — rounds 1-3 resume the original implementer, rounds 4-5 dispatch a fresh implementer "on a more capable model"; at round 5 a **circuit breaker** trips and every open finding must be adjudicated by the controller with one of three rulings (wrong/contestable → park; real-but-not-load-bearing → park; real-and-load-bearing → STOP, BLOCKED) — "Adjudicating earlier to end a loop is pre-judging with a different name."
- **Where:** `skills/subagent-driven-development/SKILL.md`, `re-review-prompt.md`.
- **Notable:** Ledger line formats are a strict grep-able contract: `Task <N>: complete (commits <base7>..<head7>, review clean)`, `Task <N>: fix round <R>/5 (...)`, `Task <N>: parked — <finding> — ruling: <why>`, `Task <N>: BLOCKED — <reason>`. Explicit rule against pre-judging reviewers: "If the prompt you are writing contains 'do not flag'... you are pre-judging."
- **Keywords:** ledger, circuit breaker, fix round R/5, load-bearing finding, parked-with-ruling.
- **Seen:** 3dcbd5c

### sdd-workspace-and-review-scripts
- **What:** 3 bash scripts mechanize the SDD loop: `sdd-workspace PLAN_FILE` resolves/creates a per-plan git-ignored workspace at `.superpowers/sdd/<plan-basename>/` (self-`.gitignore`d because "Claude Code treats .git/ as a protected path and denies agent writes there"); `task-brief PLAN_FILE N` uses an `awk` state machine tracking code-fence state so it never false-matches a "# Task N" heading inside a code block; `review-package PLAN_FILE BASE HEAD` builds one diff-package file (`git log --oneline`, `git diff --stat`, `git diff -U10`) so reviewers read one file instead of running git themselves.
- **Where:** `skills/subagent-driven-development/scripts/sdd-workspace`, `skills/subagent-driven-development/scripts/task-brief`, `skills/subagent-driven-development/scripts/review-package`.
- **Notable:** Workspace is plan-scoped specifically to fix a real observed bug: an unscoped `.superpowers/sdd/progress.md` let a follow-up plan in the same tree read a *different* plan's ledger as its own progress (68 files accumulated across 3 plans in the wild before the fix).
- **Keywords:** plan-scoped workspace, fence-aware awk parser, diff-package file.
- **Seen:** 3dcbd5c

### model-selection-warning
- **What:** SDD's "Model Selection" section tells the controller to pick a model tier per task/review complexity and warns: "An omitted model inherits your session's model... which silently defeats this section."
- **Where:** `skills/subagent-driven-development/SKILL.md`.
- **Notable:** Directly connects to the `sdd-strict-cost-experiment-ladder` finding (self-improvement domain) that cheap-controller/cheap-reviewer configurations silently degrade review quality without any error signal — this warning is the mitigation.
- **Keywords:** model tier selection, silent-default-inheritance risk.
- **Seen:** 3dcbd5c

### task-reviewer-diff-scoped-merge
- **What:** SDD's per-task review was root-caused (2026-06-09) doing "branch-review-scale work on single-task diffs" (one reviewer ran 50+ Bash commands over ~200s) because the reviewer prompt inherited a merge-readiness template. Fix: merged spec-compliance + code-quality into one self-contained, diff-scoped `task-reviewer-prompt.md` with a third verdict channel (`⚠️ Cannot verify from diff`).
- **Where:** `skills/subagent-driven-development/task-reviewer-prompt.md`.
- **Notable:** Root cause was template inheritance, not reviewer instructions — a case of the wrong prompt shape silently expanding review scope.
- **Keywords:** diff-scoped review, merge-readiness-template leak, cannot-verify verdict.
- **Seen:** 3dcbd5c

## routing

### shared-dispatch-prompt-template-genre
- **What:** `code-reviewer.md`, `implementer-prompt.md`, `re-review-prompt.md`, `task-reviewer-prompt.md`, `spec-document-reviewer-prompt.md`, and `plan-document-reviewer-prompt.md` are all the same artifact genre (a dispatch-prompt template with a placeholder list and defined output format), distributed one-per-skill-directory rather than centralized.
- **Where:** one file per skill directory, e.g. `skills/requesting-code-review/code-reviewer.md`, `skills/subagent-driven-development/implementer-prompt.md`.
- **Notable:** `code-reviewer.md` specifically is reused across two different skills (`requesting-code-review` direct, `subagent-driven-development` final whole-branch review) rather than duplicated — the one case of intentional sharing in an otherwise per-directory convention.
- **Keywords:** dispatch-prompt template, per-skill-directory distribution, cross-skill reuse.
- **Seen:** 3dcbd5c

### required-sub-skill-cross-reference
- **What:** A specific cross-reference convention (`REQUIRED SUB-SKILL`) used throughout for routing between skills (e.g. `writing-plans` → `subagent-driven-development`/`executing-plans`), using `superpowers:<skill-name>` naming, explicitly NOT `@`-links — "those force-load files immediately, consuming 200k+ context before you need them."
- **Where:** `skills/writing-skills/SKILL.md` ("Cross-Referencing Other Skills" section), used throughout skill bodies.
- **Notable:** A deliberate lazy-load design: cross-references are named but not force-loaded, keeping context cost proportional to skills actually invoked.
- **Keywords:** REQUIRED SUB-SKILL, lazy cross-reference, `superpowers:` namespace.
- **Seen:** 3dcbd5c

### platform-adaptation-routing
- **What:** `using-superpowers/SKILL.md`'s Platform Adaptation section routes to harness-specific reference files "if your harness appears here" — Codex/Pi/Antigravity named explicitly; Gemini's reference exists but is reached via a different skill's note rather than this list.
- **Where:** `skills/using-superpowers/SKILL.md`.
- **Notable:** An inconsistency observed directly: the routing list omits Gemini even though `skills/using-superpowers/references/gemini-tools.md` is a fully worked-out reference — reachable in practice via `writing-skills/SKILL.md`'s personal-skills-directory note instead.
- **Keywords:** platform adaptation, harness reference routing, gemini routing gap.
- **Seen:** 3dcbd5c

## integration-contract

### porting-to-a-new-harness-guide
- **What:** An ~828-line prescriptive guide teaching invariants over mechanisms for adding a new harness, since "the integration mechanism differs across harnesses, and it will keep changing." Defines the 3-part architecture (Skills / Tool mapping / Bootstrap), the zero-opt-in hard requirement, the three integration Shapes, a 6-point definition of done, and the same acceptance test cited in the contributor guidelines.
- **Where:** `docs/porting-to-a-new-harness.md`.
- **Notable:** Appendix A is a living reference table of all 8 current harness integrations (entry point / bootstrap mechanism / tool mapping / tests / distribution channel columns). Appendix B lists 12 "Gotchas that have bitten porters" — e.g. "Opt-in isn't a port," "Wrong JSON field → silent failure or double injection," "Editing skills to fit the harness. Never."
- **Keywords:** Shape A/B/C, definition of done, gotchas appendix, harness integration table.
- **Seen:** 3dcbd5c

### tool-description-overrides-skill-instructions
- **What:** A documented failure mode: Claude Code's `EnterWorktree` tool description itself says "ONLY when user explicitly asks," which silently overrides skill instructions telling the agent to prefer native tools — cited against a specific Claude Code issue (#29950).
- **Where:** `docs/superpowers/specs/2026-04-06-worktree-rototill-design.md`.
- **Notable:** Root cause of a skill-authoring failure: vague guidance ("you know your own toolkit") lost to concrete competing guidance baked into the *tool's own* description, not the skill's. Fix required naming the exact tool (`EnterWorktree`, `WorktreeCreate`, `/worktree`, `--worktree`) so the decision becomes a factual lookup rather than a judgment call the tool description can override.
- **Keywords:** tool description precedence, vague-vs-concrete guidance, harness tool-doc override.
- **Seen:** 3dcbd5c

### codex-marketplace-per-harness-manifest-requirement
- **What:** `.agents/plugins/marketplace.json` had to be added specifically because Codex's marketplace resolution expects a manifest at that exact path — the repo only shipped Claude's `.claude-plugin/marketplace.json`, so Codex could name the marketplace but find no installable plugin entry.
- **Where:** `.agents/plugins/marketplace.json`; documented in `RELEASE-NOTES.md` v6.1.0.
- **Notable:** Concrete proof that "same plugin, one source tree" still needs a manifest file per harness — installability isn't implied by content compatibility.
- **Keywords:** per-harness manifest requirement, marketplace resolution, installability gap.
- **Seen:** 3dcbd5c

## context-memory

### progress-ledger-survives-compaction
- **What:** SDD's `progress.md` ledger is explicitly designed as the recovery mechanism across context compaction, since "conversation memory does not survive compaction" — task status, fix-round count, and parked-finding rulings are written to disk in a strict grep-able line format rather than relying on todos or conversation state alone.
- **Where:** `skills/subagent-driven-development/SKILL.md` (ledger format; full mechanism in this file's `sdd-ledger-and-circuit-breaker` entry under the orchestration domain).
- **Notable:** A RED-baseline eval (25 fresh-subagent reps, 3 fixture framings) found controllers **never actually adopted a stale foreign ledger blindly** — they always caught mismatches via forensic git-log cross-checking, at a measured cost of 6-13 tool calls per resume (mean 9.0). The plan-scoped-workspace fix (`sdd-workspace`) still shipped on structural grounds even though the RED test didn't reproduce the failure directly.
- **Keywords:** ledger-as-memory, compaction survival, forensic git-log cross-check.
- **Seen:** 3dcbd5c

### visual-companion-events-file-as-turn-boundary-memory
- **What:** The brainstorming visual companion cannot hold a bidirectional channel open within one agent turn ("Claude Code's execution model is turn-based. There is no way for Claude to listen on two channels simultaneously within a single turn"), so browser click events are written to a per-screen `.events` JSONL file that the agent reads only on its *next* turn.
- **Where:** `skills/brainstorming/scripts/server.cjs`, `docs/superpowers/specs/2026-02-19-visual-brainstorming-refactor-design.md`.
- **Notable:** This redesign fully replaced an earlier blocking `TaskOutput(block=true, timeout=600s)` pattern and deleted `wait-for-feedback.sh` entirely — the file-as-mailbox pattern is the direct consequence of accepting the turn-boundary constraint instead of fighting it.
- **Keywords:** turn-boundary memory, JSONL event mailbox, non-blocking redesign.
- **Seen:** 3dcbd5c

### pi-bootstrap-rearm-on-compact
- **What:** Pi's extension arms a re-injection flag on both `session_start` and `session_compact`, disarms on `agent_end` — so the bootstrap context is guaranteed to survive a compaction event without being duplicated on every ordinary turn.
- **Where:** `.pi/extensions/superpowers.ts`.
- **Notable:** Same underlying problem as the SDD ledger (compaction can erase context) solved at the harness-integration layer instead of the skill layer.
- **Keywords:** session_compact re-arm, bootstrap persistence across compaction.
- **Seen:** 3dcbd5c

## planning

### plan-document-required-header
- **What:** Every plan produced by `writing-plans` must open with a literal header (Goal/Architecture/Tech Stack/Global Constraints) including a baked-in `REQUIRED SUB-SKILL` pointer for how the plan should be executed.
- **Where:** `skills/writing-plans/SKILL.md`.
- **Notable:** Plans in `docs/superpowers/plans/` consistently open with: `> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.` — a machine-readable execution-routing header baked into the artifact itself, plus `- [ ] **Step N:**` checkbox syntax throughout for progress tracking.
- **Keywords:** plan header template, execution-routing directive, checkbox task syntax.
- **Seen:** 3dcbd5c

### spec-plan-directory-migration
- **What:** A breaking change (v5.0.0, 2026-03-09) moved brainstorming output from `docs/plans/` to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` and writing-plans output to `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`, with old files left in `docs/plans/` as historical artifacts rather than migrated.
- **Where:** `docs/plans/*.md` (4 legacy files), `docs/superpowers/specs/*.md` (15), `docs/superpowers/plans/*.md` (15); documented in `RELEASE-NOTES.md`.
- **Notable:** Filename convention: plans omit `-design`, specs append it; every plan has a matching same-date-topic spec, though the plan's date sometimes lags the spec's — see `repo-layout/docs-directory-organization` for the layout side of this.
- **Keywords:** breaking-change migration, spec-vs-plan naming, historical non-migration.
- **Seen:** 3dcbd5c

## quality-gates

### two-verdict-review-severity-contract
- **What:** The shared `code-reviewer.md` dispatch template specifies a read-only review contract, a Critical/Important/Minor severity taxonomy, and an explicit "Critical Rules" DO/DON'T list (e.g. "Say 'looks good' without checking" is forbidden), ending in a "Ready to merge? Yes | No | With fixes" verdict.
- **Where:** `skills/requesting-code-review/code-reviewer.md`.
- **Notable:** Reused verbatim by both `requesting-code-review` and SDD's final whole-branch review — one canonical review-dispatch contract, not duplicated per call site.
- **Keywords:** severity taxonomy, read-only review contract, merge-readiness verdict.
- **Seen:** 3dcbd5c

### deletion-gated-by-subagent-verification
- **What:** An old bash test in `tests/` is only deleted after a subagent, given both the bash test's assertions and the candidate Drill eval scenario's YAML, verifies every assertion has a matching Drill check — output is a per-assertion PASS/FAIL table, and the subagent's verdict is quoted in the deletion commit message as an audit trail.
- **Where:** `docs/testing.md`, `docs/superpowers/specs/2026-05-06-lift-drill-into-evals-design.md`.
- **Notable:** Makes test removal an evidenced, auditable decision rather than an assumption that new coverage subsumes old coverage.
- **Keywords:** deletion gate, subagent-verified coverage, audit-trail commit message.
- **Seen:** 3dcbd5c

### typed-word-confirmation-for-destructive-actions
- **What:** `finishing-a-development-branch`'s discard path requires the user to type the exact word `discard` — no paraphrase, no "yes" — before branch deletion proceeds.
- **Where:** `skills/finishing-a-development-branch/SKILL.md`.
- **Notable:** Same wording-workaround-closing instinct as `verification-before-completion`'s ban on "paraphrases and synonyms" of success claims — both close the loophole where a model satisfies the letter of a check via different words.
- **Keywords:** typed confirmation, destructive-action gate.
- **Seen:** 3dcbd5c

## docs-style

### routing-files-identical-except-gemini
- **What:** `AGENTS.md` and `CLAUDE.md` are byte-identical (both the full "Contributor Guidelines" doc); `GEMINI.md` is a 2-line `@`-include stub pulling in the bootstrap skill and its tools reference — because Gemini has no hook/plugin system, so its always-loaded context file *is* the bootstrap mechanism (Shape C), whereas Claude Code/Codex get their bootstrap through hooks/native discovery and use their instructions files for pure contributor prose instead.
- **Where:** `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`.
- **Notable:** Two unrelated things share the "instructions file" concept across harnesses — contributor-facing prose (Claude/Codex) vs bootstrap delivery (Gemini) — and the file's role changes depending on whether the harness has an independent hook system.
- **Keywords:** multi-agent routing file divergence, Shape C, `@`-include.
- **Seen:** 3dcbd5c

### contributor-guidelines-pr-rejection-bar
- **What:** Contributor guidelines open with "Stop. Read this section before doing anything," citing a "94% PR rejection rate" from agent-submitted slop PRs, with a 6-point pre-PR checklist (read the PR template in full; search open+closed PRs for duplicates; verify the problem is real; confirm core-vs-plugin scope; disclose model/harness/version/installed-plugins; show the human the full diff before submitting).
- **Where:** `AGENTS.md` / `CLAUDE.md`.
- **Notable:** Explicit "What We Will Not Accept" list: third-party dependencies (zero-dependency by design), Anthropic-guidance "compliance" rewrites of skill content (their internal philosophy deliberately differs and requires eval evidence to change), speculative fixes ("my review agent flagged this" explicitly rejected as a problem statement), bulk/spray-and-pray PRs. New-harness PRs require a session-transcript acceptance test; skill-content changes require adversarial pressure testing plus before/after eval results.
- **Keywords:** slop-PR rejection rate, pre-PR checklist, eval-evidence bar for skill changes.
- **Seen:** 3dcbd5c

### annotate-dont-rewrite-historical-docs
- **What:** A recurring, named documentation-maintenance rule: once a doc describes work later superseded, later work **annotates** it with a note pointing at the new state rather than rewriting/deleting the original content — with a prescribed exact annotation blockquote template.
- **Where:** `RELEASE-NOTES.md` (v6.0.0 entry), `docs/superpowers/plans/2026-05-06-lift-drill-into-evals.md` (Task 11 gives the template), `docs/superpowers/specs/2026-06-11-visual-companion-final-hardening-fixup-design.md`.
- **Notable:** Example template: "> Note: this section references `tests/skill-triggering/run-all.sh` ... lifted into drill scenarios on 2026-05-06 ... preserved as dated artifacts of the work this doc describes." Reused across ≥3 unrelated docs, not a one-off.
- **Keywords:** dated artifact, annotate-don't-rewrite, doc provenance.
- **Seen:** 3dcbd5c

### platform-neutral-prose-phased-campaign
- **What:** A phased campaign (Phases A-C, referenced through E) removing Claude-Code-centric language from skill prose (generic "Claude" → "your agent"/"agents"), executed as separate specs/PRs per phase, with explicit carve-outs that stay unchanged: model names, filenames/URLs (`CLAUDE.md`), the branded platform name "Claude Code," and **historical artifacts** ("these are dated, point-in-time documents; rewriting them rewrites history").
- **Where:** `docs/superpowers/specs/2026-05-05-platform-neutral-prose-design.md` (A), `docs/superpowers/specs/2026-05-05-platform-neutral-config-refs-design.md` (B), `docs/superpowers/specs/2026-05-05-platform-neutral-readme-design.md` (C).
- **Notable:** Motivation cited directly: "OpenAI's vendored fork attempted a wholesale rewrite that was actively wrong in places... we want to avoid that mistake" — the phased, carve-out-aware approach is a reaction to a real bad outcome elsewhere. Phase A's spec notes a deferred "Phase E" (tool-name references) later actually happened.
- **Keywords:** platform-neutral prose, carve-out list, phased PR campaign, CSO→SDO rename (see `skills/skill-discovery-optimization`).
- **Seen:** 3dcbd5c

### release-notes-single-source-of-truth
- **What:** `RELEASE-NOTES.md` (1361 lines, 41 version headers v4.0.0→v6.2.0) is the single semver-tagged changelog, having explicitly removed a vestigial `CHANGELOG.md`.
- **Where:** `RELEASE-NOTES.md`.
- **Notable:** Prose is dense/narrative rather than terse bullets — entries often explain root cause and fix mechanism in the same sentence, cite issue/PR numbers and contributor handles inline.
- **Keywords:** semver changelog, single source of truth, issue/PR citation.
- **Seen:** 3dcbd5c

## tooling

### version-bump-drift-detection
- **What:** `scripts/bump-version.sh` reads `.version-bump.json` (declared file+JSON-field-path list) and supports `--check` (drift report across all declared files), `--audit` (`--check` plus a repo-wide grep for the version string flagging any undeclared file that contains it), and bare `<version>` (bump every declared file via `jq`, then auto re-run `--audit`).
- **Where:** `scripts/bump-version.sh`, `.version-bump.json`.
- **Notable:** Version-string sync only — does not generate or copy the platform-adapter files themselves; notably omits `.agents/plugins/marketplace.json` and the OpenCode/Pi manifests from its declared list (those get the version only via `package.json`, or not at all).
- **Keywords:** drift detection, jq dotted-path, `--audit` undeclared-version grep.
- **Seen:** 3dcbd5c

### shell-lint-spy-binary-testing
- **What:** `scripts/lint-shell.sh` runs ShellCheck + syntax check over shell scripts, auto-detecting shell files by extension OR shebang (so extensionless `hooks/session-start` still gets linted); its own test builds a throwaway git fixture and **stubs `shellcheck`/`shfmt` as fake executables that log their invocation args**, asserting on the logged args rather than running the real tools.
- **Where:** `scripts/lint-shell.sh`, `tests/shell-lint/test-lint-shell.sh`.
- **Notable:** The "spy binary on PATH" pattern (also used for `gh` in the sync-script test) tests a wrapper script's argument-construction logic without depending on the real tool's actual behavior.
- **Keywords:** spy/stub binary, shebang sniffing, git-diff-scoped file selection.
- **Seen:** 3dcbd5c

### render-graphs-dot-extraction
- **What:** `skills/writing-skills/render-graphs.js` (168 lines) extracts ` ```dot ` blocks from a SKILL.md and renders them to SVG via the system `dot` binary, for human visualization of the graphviz process diagrams embedded throughout the skill corpus.
- **Where:** `skills/writing-skills/render-graphs.js`, `skills/writing-skills/graphviz-conventions.dot` (diamonds=questions, boxes=actions, plaintext=literal commands, octagon=warnings, doublecircle=entry/exit).
- **Notable:** A style guide for diagrams written *in* graphviz itself, paired with the extraction script — both are dev-tooling for authoring the skills, not runtime plugin code.
- **Keywords:** dot-block extraction, graphviz style convention, SVG rendering.
- **Seen:** 3dcbd5c

## config-packaging

### six-divergent-manifest-formats
- **What:** Six platform manifests for the same plugin, each hand-authored with a genuinely different JSON shape and no in-repo generator producing them from one canonical source: Claude (`plugin.json` + `marketplace.json`, `source` as bare string), Codex (adds app-store branding: `interface`, `composerIcon`, `brandColor`, `defaultPrompt`), Cursor (`hooks` as an external path reference, not inline), Kimi (embeds a large freeform tool-mapping prose string directly in the manifest plus a `sessionStart.skill` field), Gemini (`contextFileName` pointer to the `@`-include stub), and a separate Codex-marketplace variant (`.agents/plugins/marketplace.json`, `source` as a **nested object** `{"source":"url","url":"./"}` — diverging from Claude marketplace's bare-string `source`).
- **Where:** `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.codex-plugin/plugin.json`, `.cursor-plugin/plugin.json`, `.kimi-plugin/plugin.json`, `gemini-extension.json`, `.agents/plugins/marketplace.json`.
- **Notable:** Genuine schema divergence for what both marketplace formats call a "plugins" array (bare-string vs nested-object `source`); the `.agents/plugins/marketplace.json` variant also introduces `policy.installation`/`policy.authentication` enum fields absent from the Claude format. All manifests are kept in sync only on the version string (via `.version-bump.json`), never on shape.
- **Keywords:** per-harness manifest divergence, source-field schema mismatch, no shared generator.
- **Seen:** 3dcbd5c

### root-package-json-dual-purpose
- **What:** OpenCode and Pi both piggyback on the single root `package.json` instead of a dedicated manifest — OpenCode via the standard npm `"main"` field (`.opencode/plugins/superpowers.js`), Pi via a bespoke namespaced `"pi": {"extensions": [...], "skills": [...]}` object read directly out of `package.json`. No `"scripts"` field exists; none of the sync/packaging tooling is wired through npm scripts.
- **Where:** `package.json`.
- **Notable:** Two harnesses share one file for two unrelated resolution mechanisms (npm module entry point vs a custom namespaced config block) rather than each getting its own manifest.
- **Keywords:** main field reuse, pi namespace, no npm scripts.
- **Seen:** 3dcbd5c

### codex-fork-outward-sync
- **What:** `scripts/sync-to-codex-plugin.sh` is a one-way **outward** sync into a separate downstream fork (`prime-radiant-inc/openai-codex-plugins`), rsyncing tracked files into that fork's `plugins/superpowers/` dir, then committing/pushing a timestamped branch and opening a PR via `gh pr create`. Anchored excludes prevent unintended matches (comment: "Unanchored patterns like `scripts/` would match... `skills/brainstorming/scripts/`"). A `copy_preserved_destination_metadata` step re-copies existing `skills/*/agents/openai.yaml` files from the destination back into the source before syncing, so OpenAI-owned per-skill metadata survives each sync.
- **Where:** `scripts/sync-to-codex-plugin.sh`.
- **Notable:** Explicitly designed to be idempotent/deterministic — "running twice against the same upstream SHA produces PRs with identical diffs... use that to verify the tool itself." This is the closest thing to a cross-platform generator in the repo, but it distributes already-committed content outward; it does not generate the in-repo `.codex-plugin/` folder.
- **Keywords:** rsync --delete --delete-excluded, anchored excludes, third-party-owned metadata preservation, deterministic PR diff.
- **Seen:** 3dcbd5c

### codex-portal-deterministic-archive
- **What:** `scripts/package-codex-plugin.sh` builds a standalone rootless zip/tar.gz for direct Codex portal upload — an independent alternative to the fork-sync script above, for the same platform. Uses `git archive` at a pinned ref, seeds `skills/*/agents/openai.yaml` from a `--metadata-source`, normalizes timestamps (1980-01-01 zip DOS-epoch floor, 1970-01-01 tar) and uid/gid/uname/gname for byte-reproducibility, hard-fails on skill/metadata count mismatch, and greps the produced archive against a source-only-path denylist before emitting a SHA-256 checksum.
- **Where:** `scripts/package-codex-plugin.sh`.
- **Notable:** Both Codex scripts independently reimplement seeding OpenAI-owned `agents/openai.yaml` metadata that this repo does not itself own or generate — two parallel solutions to the same third-party-metadata problem.
- **Keywords:** git archive, deterministic zip/tar.gz, SHA-256 checksum, source-only-path denylist.
- **Seen:** 3dcbd5c

## repo-layout

### docs-directory-organization
- **What:** `docs/` splits into `docs/plans/` (legacy pre-restructure plans, kept as historical artifacts) vs the current `docs/superpowers/plans/` and `docs/superpowers/specs/` — a breaking-change migration (v5.0.0) that deliberately left old files in place rather than moving them.
- **Where:** `docs/plans/*.md`, `docs/superpowers/plans/*.md`, `docs/superpowers/specs/*.md`.
- **Notable:** Also present: `docs/porting-to-a-new-harness.md`, `docs/testing.md`, `docs/windows/polyglot-hooks.md`, `docs/README.kimi.md`, `docs/README.opencode.md` as standalone per-topic/per-harness guides rather than folded into the main README.
- **Keywords:** legacy-vs-current plan directory, per-harness standalone install docs.
- **Seen:** 3dcbd5c

### tests-vs-evals-two-tier-split
- **What:** `tests/` holds plugin-infrastructure (non-LLM) tests; `evals/` (not vendored in this clone) holds LLM skill-behavior compliance tests via the "Drill" harness. `evals/` was previously a git submodule pointing at `obra/drill`, then fully absorbed ("lifted") into the repo proper via rsync with explicit excludes.
- **Where:** `docs/testing.md`, `docs/superpowers/specs/2026-05-06-lift-drill-into-evals-design.md`.
- **Notable:** The Python package internally kept the name `drill` even though the directory is `evals/` — a naming residue from the submodule-to-monorepo lift.
- **Keywords:** tests-vs-evals split, submodule lift, drill package residual name.
- **Seen:** 3dcbd5c

### per-skill-directory-artifact-convention
- **What:** Dispatch-prompt templates, reference docs, and scripts live inside each skill's own directory (`skills/<name>/{SKILL.md,*-prompt.md,scripts/,references/,examples/}`) rather than in a centralized `templates/`/`lib/` location — the one deliberate exception being `code-reviewer.md`, reused across two skill directories.
- **Where:** all 14 `skills/*/` directories.
- **Notable:** Cross-reference is why co-location works despite the near-duplication: `REQUIRED SUB-SKILL` naming plus lazy (non-`@`) linking means a skill can point at another's artifact without needing it centralized or force-loaded.
- **Keywords:** per-skill co-location, no shared templates dir, one deliberate cross-skill exception.
- **Seen:** 3dcbd5c

## safety

### visual-companion-auth-hardening
- **What:** The brainstorming companion's per-session secret-key model: URL carries `?key=<token>`, sets an HttpOnly/SameSite=Strict/per-port cookie; WebSocket upgrades require both valid auth AND a same-origin `Origin` header (browser confused-deputy defense); `/files/*` uses realpath containment against symlink/hardlink escape; `stop-server.sh` verifies an "instance-id" ownership proof (`--brainstorm-server-id=<id>` passed as inert argv, checked via `/proc/<pid>/cmdline`) before signaling, so it never kills an unrelated `node` process.
- **Where:** `skills/brainstorming/scripts/server.cjs`, `scripts/stop-server.sh` (under the skill dir), `docs/superpowers/specs/2026-06-10-visual-companion-auth-hardening-design.md`.
- **Notable:** A rejected alternative is documented with reasoning: a Host-allowlist fix was rejected in favor of the secret-key model because "A direct remote client just sends the expected `Host`... the allowlist is theater for remote exposure" — threat-model reasoning recorded in-doc since the companion is used with remote binds, SSH tunnels, Tailscale. Explicit **out-of-scope boundary**: malicious agent-authored screen HTML is out of scope — full sandboxing would need a separate iframe+postMessage architecture, deliberately deferred.
- **Keywords:** per-session secret key, confused deputy, realpath containment, PID-ownership proof, documented threat-model reasoning.
- **Seen:** 3dcbd5c

### zero-dependency-security-posture
- **What:** The companion server was rewritten from ~1,200 lines of vendored `node_modules/` (Express/ws/chokidar, "714 tracked files") to a single ~250-300 line file using only Node built-ins, including a **hand-rolled RFC 6455 WebSocket implementation** (SHA-1+GUID handshake, 3-tier frame length encoding, TEXT/CLOSE/PING/PONG only) — motivation stated as supply-chain risk reduction, not a functional bug. Same zero-dependency stance rejected vendoring Alpine.js for interactive mockups (PR #1639): "we are not taking on a vendored third-party dependency in the companion runtime."
- **Where:** `docs/superpowers/specs/2026-03-11-zero-dep-brainstorm-server-design.md`, `skills/brainstorming/scripts/server.cjs`.
- **Notable:** The repo-wide contributor rule ("zero-dependency plugin by design, carve-out only for new-harness support") is enforced here at the code level, not just stated as policy.
- **Keywords:** supply-chain risk reduction, hand-rolled RFC 6455, vendored-dependency rejection.
- **Seen:** 3dcbd5c

### websocket-frame-dos-guard
- **What:** The hand-rolled WebSocket frame decoder rejects oversized 64-bit-length frames "from header alone" before any payload allocation, and asserts server frames are never masked while client frames MUST be masked (`assert.throws(..., /mask/i)`) — tested directly in `ws-protocol.test.js`.
- **Where:** `skills/brainstorming/scripts/server.cjs`, `tests/brainstorm-server/ws-protocol.test.js`.
- **Notable:** A DoS guard implemented as a header-only rejection (no payload buffer ever allocated for an oversized claimed length), verified with boundary tests at 0/125/126/65535/65536/>2^16 bytes.
- **Keywords:** oversized-frame rejection, header-only DoS guard, RFC 6455 masking rule.
- **Seen:** 3dcbd5c

### stop-server-pid-impersonation-defense
- **What:** `stop-server.sh` is tested against process-name impostors — unrelated `sleep 600` processes and argv-renamed fakes (`exec -a "node server.cjs ..."`) with missing/wrong/malformed `--brainstorm-server-id` — and must report `stale_pid` and leave every impostor alive, only killing the real server verified via a shared `server-instance-id` file.
- **Where:** `stop-server.sh` (brainstorming skill scripts), `tests/brainstorm-server/stop-server.test.sh`.
- **Notable:** Directly defends against a stale/recycled PID killing an unrelated live process after a reboot — a realistic failure mode for any script that signals by PID alone.
- **Keywords:** PID recycling defense, argv impersonation test, instance-id verification.
- **Seen:** 3dcbd5c

### command-injection-safe-browser-launch
- **What:** The Windows/WSL browser-open path uses `rundll32.exe url.dll,FileProtocolHandler <url>` specifically to avoid ever invoking `cmd.exe /c` with a URL, which could contain shell metacharacters.
- **Where:** `tests/brainstorm-server/browser-launcher.test.js` (test asserts this via an injected `&echo=INJECTED` test URL).
- **Notable:** A regression test built around a real command-injection vector in a common "open the user's browser" utility pattern.
- **Keywords:** command injection regression test, `rundll32` FileProtocolHandler, shell-metacharacter-safe URL launch.
- **Seen:** 3dcbd5c

## self-improvement

### sdd-strict-cost-experiment-ladder
- **What:** An explicit L1-L5 experiment ladder targeting dollars-per-run cost for subagent-driven-development, with a stated "Hard invariant: quality" and "Judgment guardrail: cheapen mechanics, never judgment." Two rungs **died at the gates** with measured evidence: L2 (cheap controller model) — a planted defect shipped in 4/5 runs because the per-task quality gate "collapsed into plan-compliance advocacy" under a cheaper controller; L3 (cheap reviewer model) — haiku reviewers "cleanly flagged 0 of 10 planted defects at correct severity."
- **Where:** `docs/superpowers/specs/2026-06-10-strict-cost-sdd-design.md`.
- **Notable:** Final adopted config cut cost from ~$16/run baseline to ~$12-14/run (~20-25% savings) via mechanical changes only (merged reviewers, required explicit `model:` line, task-brief/report files, progress ledger, one omnibus fix dispatch) — none of the savings came from cheapening judgment, matching the stated invariant. This is a rare case of a spec being updated **in place** with dated "Status" results (L2/L3 marked "DIED AT THE GATES") rather than superseded by a separate results file.
- **Keywords:** experiment ladder, hard invariant vs judgment guardrail, died-at-the-gates, in-place spec status updates.
- **Seen:** 3dcbd5c

### document-review-loop-reversed-by-eval
- **What:** An early (Jan 2026) subagent-dispatched spec/plan document-review loop (5-iteration escalation cap) was measured and reversed in v5.0.6: regression testing "across 5 versions with 5 trials each" showed identical quality scores whether or not the review loop ran, at ~25 minutes overhead versus an inline self-review checklist catching "3-5 real bugs per run in ~30s."
- **Where:** `docs/superpowers/specs/2026-01-22-document-review-system-design.md`; reversal in `RELEASE-NOTES.md` v5.0.6.
- **Notable:** A shipped feature reverted purely on eval evidence — the same evidentiary standard the contributor guidelines demand of external PRs, applied to the maintainers' own prior work.
- **Keywords:** eval-driven feature reversal, before/after regression test, cost-vs-quality measurement.
- **Seen:** 3dcbd5c

### worktree-skill-tdd-validation-failure
- **What:** The first draft of the worktree-rototill skill text (prefer native tools, phrased abstractly as "you know your own toolkit") scored only 2/6 pass rate in testing — agents anchored on the concrete git commands in the fallback path instead. After naming the exact tools explicitly, 3 REFACTOR iterations reached 50/50 pass across GREEN+PRESSURE tests.
- **Where:** `docs/superpowers/specs/2026-04-06-worktree-rototill-design.md`.
- **Notable:** A documented instance of the skill-authoring TDD methodology (`skills/tdd-for-skill-authoring`) catching a real regression before ship — concrete evidence for "vague guidance loses to concrete guidance" as a general authoring rule.
- **Keywords:** RED/GREEN/PRESSURE pass-rate measurement, concrete-vs-vague guidance, REFACTOR iteration count.
- **Seen:** 3dcbd5c

### visual-companion-four-iteration-hardening-arc
- **What:** The visual companion moved through 4 major redesigns: blocking Express/ws/chokidar prototype → non-blocking browser-display/terminal-channel split → zero-dependency rewrite → auth hardening + fixup, each triggered by a concrete measured or reported problem (turn-model mismatch, supply-chain exposure, real GitHub issues triaged file:line against actual code).
- **Where:** `docs/plans/2026-01-17-visual-brainstorming.md`, `docs/superpowers/specs/2026-02-19-visual-brainstorming-refactor-design.md`, `docs/superpowers/plans/2026-02-19-visual-brainstorming-refactor.md`, `docs/superpowers/specs/2026-03-11-zero-dep-brainstorm-server-design.md`, `docs/superpowers/plans/2026-03-11-zero-dep-brainstorm-server.md`, `docs/superpowers/plans/2026-06-09-visual-companion-issues.md` (issue-triage catalog), `docs/superpowers/specs/2026-06-10-visual-companion-auth-hardening-design.md`, `docs/superpowers/plans/2026-06-10-visual-companion-auth-hardening.md`, `docs/superpowers/specs/2026-06-11-visual-companion-final-hardening-fixup-design.md`, `docs/superpowers/plans/2026-06-11-visual-companion-final-hardening-fixup.md`.
- **Notable:** The Jun 9 issue-triage document is itself a reusable pattern: every open GitHub issue/PR distilled into "the underlying problem and the change we'd make," grounded against actual code with file:line references, including explicit **rejections** with stated reasoning (Host-allowlist fix, vendored Alpine.js).
- **Keywords:** iterative hardening arc, issue-triage-as-doc pattern, grounded rejection reasoning.
- **Seen:** 3dcbd5c

## ux

### visual-companion-nonblocking-turn-model
- **What:** The companion's browser shows an interactive display only; the terminal remains the conversation channel; user clicks are recorded to a JSONL events file the agent reads on its *next* turn — offered "just-in-time," gated by a per-question test ("would the user understand this better by seeing it than reading it?"), never shown upfront by default.
- **Where:** `skills/brainstorming/SKILL.md`, `skills/brainstorming/scripts/server.cjs`, `skills/brainstorming/scripts/helper.js`.
- **Notable:** A UX decision forced by a technical constraint (turn-based execution model) rather than a preference — see `context-memory/visual-companion-events-file-as-turn-boundary-memory` for the mechanism.
- **Keywords:** just-in-time visual aid, per-question display-worth test, turn-based UI constraint.
- **Seen:** 3dcbd5c

### human-partner-terminology
- **What:** "your human partner" is used deliberately instead of "the user" throughout `receiving-code-review`, `systematic-debugging`, and elsewhere — the repo's own contributor guidelines flag this as an intentional, tested choice: "'your human partner' is deliberate, not interchangeable with 'the user.'"
- **Where:** `skills/receiving-code-review/SKILL.md`, `skills/systematic-debugging/SKILL.md`, `AGENTS.md`/`CLAUDE.md`.
- **Notable:** Ties to `examples/CLAUDE_MD_TESTING.md` (writing-skills) — a 4-scenario × 5-variant empirical test campaign that helped choose this and similar wording, up to an XML-tagged "EXTREMELY IMPORTANT" emphatic style used for the dispatch skill itself.
- **Keywords:** deliberate terminology choice, wording-variant empirical testing.
- **Seen:** 3dcbd5c

### forbidden-performative-responses
- **What:** `receiving-code-review` bans specific phrases ("You're absolutely right!", "Great point!") as "performative agreement" — an explicit instruction-file violation, not just a style note — replacing them with a restate → verify → evaluate → respond → implement register.
- **Where:** `skills/receiving-code-review/SKILL.md`.
- **Notable:** Directly parallels `verification-before-completion`'s ban on satisfaction language ("Great!", "Perfect!", "Done!") — the corpus treats specific model-generated stock phrases as a recurring failure signature worth banning by name across multiple skills.
- **Keywords:** performative-agreement ban, stock-phrase failure signature.
- **Seen:** 3dcbd5c

## testing-evals

### drill-tmux-llm-actor-verifier-harness
- **What:** A separate Python eval harness ("Drill", package name `drill`, directory `evals/`) drives real tmux sessions of Claude Code/Codex/Gemini CLI/Copilot CLI, with an LLM actor simulating the user and an LLM verifier judging transcript compliance against YAML scenarios (`evals/scenarios/*.yaml`). Runs are explicitly "slow (3-30+ minutes each)" and real-money LLM calls, "not part of CI today."
- **Where:** `docs/testing.md` (not vendored in this clone — `evals/` absent).
- **Notable:** Was previously a separate `obra/drill` git submodule, later "lifted" into the monorepo via rsync with explicit excludes (`.git`, `.venv`, `results`, `.env`, `__pycache__`); positioned as the authoritative behavioral coverage, with the hand-rolled `tests/` bash/node suites kept as narrower supplementary regression checks.
- **Keywords:** Drill harness, LLM actor/verifier, tmux-driven real session, scenario YAML.
- **Seen:** 3dcbd5c

### micro-test-harness-for-instruction-wording
- **What:** A named, reusable methodology for cheaply testing skill-instruction phrasing before committing to a full eval: one API call per sample, system prompt = the guidance variant, user prompt = a realistic scenario, ~$0.15-0.30/sample vs $12/50-min full eval run — "iterate phrasings here; confirm winners in full runs only when the change is structural."
- **Where:** `docs/superpowers/specs/2026-06-10-positive-instruction-redesign-design.md`.
- **Notable:** Used to derive the `skills/positive-instruction-doctrine` findings; explicitly documents a case where the cheap methodology led to *not* shipping a planned change (see that entry).
- **Keywords:** micro-test harness, cheap-vs-full eval cost ratio, phrasing iteration.
- **Seen:** 3dcbd5c

### no-framework-hand-rolled-tests-everywhere
- **What:** No CI workflows exist in this snapshot (`.github/` has only issue/PR templates); no root `npm test`; every JS test is hand-rolled `assert` + local `pass()/fail()` counters run via plain `node`, every shell test is hand-rolled bash with local `pass()/fail()` helpers — the sole exception is `tests/pi/test-pi-extension.mjs`, which uses Node's built-in `node:test`/`node:assert/strict`.
- **Where:** all of `tests/*`, `tests/brainstorm-server/package.json` (the only file with a chained `test` script).
- **Notable:** A deliberate zero-framework-dependency choice consistent with the repo's stated zero-dependency plugin philosophy, extended even into its own test suites.
- **Keywords:** no jest/mocha/vitest/pytest, hand-rolled assert+counters, `node:test` sole exception.
- **Seen:** 3dcbd5c

### spy-stub-binary-on-path-testing
- **What:** A recurring test pattern across the suite: put a fake executable on `PATH` that only logs its invocation (or answers one narrow call and fails loudly on anything else) to test a wrapper script's argument construction or control flow without depending on the real tool's behavior — used for `shellcheck`/`shfmt` (shell-lint), `gh` (codex-plugin-sync, guaranteeing the dry-run path never actually calls GitHub), and `npm` (systematic-debugging's find-polluter test).
- **Where:** `tests/shell-lint/test-lint-shell.sh`, `tests/codex-plugin-sync/test-sync-to-codex-plugin.sh`, `tests/systematic-debugging/test-find-polluter.sh`.
- **Notable:** The codex-plugin-sync test additionally builds full git-repo fixtures on disk (tracked-ignored files, pure-ignored dirs, submodule/pre-commit metadata) to test `rsync --dry-run --itemize-changes` output against regexes, proving stale destination-owned files get flagged for deletion and a second no-op apply correctly reports "No changes."
- **Keywords:** spy/stub binary via PATH override, fake `gh`/`shellcheck`/`npm`, git-fixture-based rsync testing.
- **Seen:** 3dcbd5c

### in-process-browser-code-sandbox-testing
- **What:** `helper.test.js` evaluates the companion's browser-side `helper.js` inside Node via `new Function('module', src)(moduleShim)` to extract pure functions (e.g. exponential backoff `nextReconnectDelay`), then separately re-executes the *whole* browser script against a hand-built fake DOM/WebSocket/timer environment (`makeEnv()`, `FakeWS` class) to drive real reconnect/status-text state transitions without a real browser.
- **Where:** `tests/brainstorm-server/helper.test.js`.
- **Notable:** Same technique used elsewhere for the bootstrap's inline `<script>` tag (`auth.test.js` extracts and runs it via `new Function('sessionStorage','location', code)(...)` to confirm the key-stripping behavior even when `sessionStorage.setItem` throws).
- **Keywords:** `new Function` sandboxing, fake DOM/WebSocket/timer harness, pure-function extraction from browser code.
- **Seen:** 3dcbd5c

### session-transcript-mining-tests
- **What:** Integration-level tests invoke the real headless `claude -p` CLI and mine the resulting session JSONL transcript for compliance evidence — e.g. the SDD integration test greps for `"name":"Skill".*"skill":"superpowers:subagent-driven-development"`, ≥2 `Agent`/`Task` dispatches, task-tracking tool usage, produced files, `npm test` passing, and commit count; a companion `analyze-token-usage.py` sums input/output/cache tokens per main-session and per-subagent (keyed by `toolUseResult.agentId`) for cost telemetry (reported, not asserted).
- **Where:** `tests/claude-code/test-subagent-driven-development-integration.sh`, `tests/claude-code/analyze-token-usage.py`, `tests/explicit-skill-requests/*`.
- **Notable:** `explicit-skill-request-tests` add a "premature action" check: find the first Skill-invocation line number and grep everything before it for other `tool_use` events (excluding todo/task tools, considered acceptable pre-skill planning) — catching the failure mode of starting work before loading the requested skill. Detection regex is namespace-prefix-agnostic (`"skill":"([^"]*:)?SKILLNAME"`).
- **Keywords:** JSONL transcript mining, premature-tool-invocation detection, namespace-agnostic skill match, token/cost telemetry.
- **Seen:** 3dcbd5c

### doc-as-contract-grep-tests
- **What:** Several harness-adapter tests validate documentation/manifests directly rather than runtime behavior — pure grep or `python3`-heredoc assertions against `antigravity-tools.md`, `.kimi-plugin/plugin.json`, and `pi-tools.md`'s mapping table, checking specific required substrings/fields are present and specific unsupported fields are absent.
- **Where:** `tests/antigravity/test-antigravity-tools.sh`, `tests/kimi/test-plugin-manifest.sh`, `tests/pi/test-pi-extension.mjs` (table-row-only check).
- **Notable:** The Pi test's table-only assertion (`text.split('\n').filter(line => line.startsWith('|'))`) is explicitly commented as guarding against a specific regression: prose mentioning the same keywords would pass even if the actual mapping table were deleted — a deliberately narrower-than-obvious assertion shape.
- **Keywords:** doc-as-contract testing, CI-safe no-runtime-dependency, table-row-only regex, unsupported-field denylist.
- **Seen:** 3dcbd5c

### deterministic-archive-reproducibility-tests
- **What:** `test-package-codex-plugin.sh` invokes the real (unstubbed) packaging script and inspects the produced archive directly: verifies excluded source-only paths are absent, executable bits survive, all zip entries show the pinned `(1980,1,1,0,0,0)` timestamp and tar entries show `mtime 0` (via inline `python3`/`zipfile`/`tarfile` snippets), confirms zip and tar.gz produce identical path sets, and that re-running with different metadata-source formats produces byte-identical output (`cmp -s`).
- **Where:** `tests/codex/test-package-codex-plugin.sh`.
- **Notable:** One of the few tests here that runs the real tool end-to-end (no stubbing) specifically because determinism/reproducibility is the property under test, and stubbing would hide exactly the thing being verified.
- **Keywords:** real-tool integration test, byte-identical-output verification, pinned-timestamp assertion.
- **Seen:** 3dcbd5c
