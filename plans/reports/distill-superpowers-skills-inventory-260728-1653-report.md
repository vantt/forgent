# Superpowers Skills Inventory — Raw Draft

Source: `/home/vantt/projects/forgentX/upstreams/superpowers/skills/` (clone of
https://github.com/obra/superpowers). This is a mechanical, no-judgment inventory:
each entry compresses the actual SKILL.md/supporting-file text, with file lists
verified against `find skills -type f`. Confirmed directory list (14 skills,
matches the task's expected list exactly):

brainstorming, dispatching-parallel-agents, executing-plans,
finishing-a-development-branch, receiving-code-review, requesting-code-review,
subagent-driven-development, systematic-debugging, test-driven-development,
using-git-worktrees, using-superpowers, verification-before-completion,
writing-plans, writing-skills.

All files under every skill directory were read in full (no partial reads, no
skimming). No unreadable files were encountered. No skill directory has a
non-standard structure (every one has a valid SKILL.md); several have
scripts/references/examples subfolders as noted below.

Repo-root note: `/home/vantt/projects/forgentX/upstreams/superpowers/CLAUDE.md`
(the plugin repo's own contributor guidelines) is distinct from this task and
not part of the skills/ tree, but is included here for context since it governs
how the skills below get changed/contributed — see final section.

---

### brainstorming
- **What:** "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation." Runs a conversational design process (context → questions → 2-3 approaches → design sections → written spec) before any implementation skill may be invoked.
- **Where:** `skills/brainstorming/SKILL.md`, `skills/brainstorming/spec-document-reviewer-prompt.md`, `skills/brainstorming/visual-companion.md`, `skills/brainstorming/scripts/frame-template.html`, `skills/brainstorming/scripts/helper.js`, `skills/brainstorming/scripts/server.cjs`, `skills/brainstorming/scripts/start-server.sh`, `skills/brainstorming/scripts/stop-server.sh`.
- **Notable:** A literal `<HARD-GATE>` tag: "Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it. This applies to EVERY project regardless of perceived simplicity." Has a named anti-pattern section ("This Is Too Simple To Need A Design"). Ships a full browser-based "Visual Companion" — a local HTTP+WebSocket server (`scripts/server.cjs`) that pushes HTML mockup/option screens to the user's browser and reads back click events from a JSONL event file (`$STATE_DIR/events`) on the next turn; offered "just-in-time," never upfront, and gated by a per-question test ("would the user understand this better by seeing it than reading it?"). Explicit Process Flow as a graphviz `dot` diagram embedded in markdown. Terminal state is hard-coded: "The ONLY skill you invoke after brainstorming is writing-plans." Includes a spec self-review checklist (placeholder scan, internal consistency, scope check, ambiguity check) run inline, not via subagent.
- **Keywords:** HARD-GATE, Visual Companion, spec self-review, `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`, screen_dir/state_dir, semantic filenames.

### dispatching-parallel-agents
- **What:** "Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies." Teaches when/how to fan out multiple subagents in a single response so they execute concurrently, versus sequential or single-agent investigation.
- **Where:** `skills/dispatching-parallel-agents/SKILL.md` (only file in this directory).
- **Notable:** Explicit mechanical rule for parallelism: "Multiple dispatch calls in one response = parallel execution. One per response = sequential." Provides a decision `dot` flowchart ("Multiple failures? → Are they independent? → Can they work in parallel?"). Has a "Common Mistakes" table with ❌/✅ pairs (too broad, no context, no constraints, vague output) and a worked "Real Example from Session" (6 failures across 3 files, 3 parallel agents, results reconciled).
- **Keywords:** "problem domain," "focused agent tasks," parallel vs sequential dispatch.

### executing-plans
- **What:** "Use when you have a written implementation plan to execute in a separate session with review checkpoints." Loads a plan, reviews it critically, executes every task per its bite-sized steps, then hands off to finishing-a-development-branch.
- **Where:** `skills/executing-plans/SKILL.md` (only file).
- **Notable:** Explicitly tells the agent to recommend subagent-driven-development instead if subagents are available ("Superpowers works much better with access to subagents... If subagents are available, use superpowers:subagent-driven-development instead of this skill"). Has a "When to Stop and Ask for Help" list (blocker, critical plan gaps, unclear instruction, repeated verification failure) and a "When to Revisit Earlier Steps" section. Final line: "Never start implementation on main/master branch without explicit user consent."
- **Keywords:** REQUIRED SUB-SKILL, "Follow plan steps exactly," announce-at-start pattern ("I'm using the executing-plans skill...").

### finishing-a-development-branch
- **What:** "Use when implementation is complete, all tests pass, and you need to decide how to integrate the work." A strict state-machine for wrapping up a branch: verify tests → detect git/worktree environment → determine base branch → present a fixed menu of integration options → execute the chosen option → clean up the workspace.
- **Where:** `skills/finishing-a-development-branch/SKILL.md` (only file).
- **Notable:** Full step-numbered protocol (Steps 1-6) with literal bash snippets for detecting `GIT_DIR` vs `GIT_COMMON` (worktree detection) and for each of 3 presented options (merge locally / push+PR / keep as-is), plus a 4th "discard" path gated behind a literal typed-confirmation requirement: "Wait for that exact confirmation... Only the typed word `discard` authorizes deletion." A "Common Rationalizations" table specifically targeting finishing-a-branch excuses (e.g. "Tests passed earlier this session" → "Run the suite on the tree you are about to integrate"). A "Quick Reference" table cross-tabulating the 4 outcomes against merge/push/keep-worktree/cleanup-branch actions.
- **Keywords:** GIT_DIR/GIT_COMMON detection, detached HEAD, "provenance-based" cleanup, `.worktrees/`/`worktrees/` ownership rule.

### receiving-code-review
- **What:** "Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation." Governs the *emotional/technical register* of responding to review feedback — restate, verify, evaluate, respond, implement — rather than reflexive agreement.
- **Where:** `skills/receiving-code-review/SKILL.md` (only file).
- **Notable:** An explicit "Forbidden Responses" list banning phrases like "You're absolutely right!" and "Great point!" as "performative" / "explicit instruction-file violation." A "YAGNI Check for 'Professional' Features" gate: "IF reviewer suggests 'implementing properly': grep codebase for actual usage... IF unused: 'This endpoint isn't called. Remove it (YAGNI)?'" Distinguishes handling by source ("From your human partner" = trusted, vs "From External Reviewers" = must verify against 5 checks before implementing). Ends with a GitHub-specific instruction to reply in the inline comment thread via `gh api .../pulls/{pr}/comments/{id}/replies`, not as a top-level comment.
- **Keywords:** "performative agreement," "your human partner" (the project's deliberate term for the user, per repo CLAUDE.md), "technical acknowledgment," pushback protocol.

### requesting-code-review
- **What:** "Use when completing tasks, implementing major features, or before merging to verify work meets requirements." Defines when/how to dispatch a code-reviewer subagent (never review the diff yourself inline) using a shared prompt template.
- **Where:** `skills/requesting-code-review/SKILL.md`, `skills/requesting-code-review/code-reviewer.md` (the dispatch template, also reused by other skills).
- **Notable:** Mandatory-vs-optional review trigger list. The template (`code-reviewer.md`) is the canonical review-dispatch contract reused by both `subagent-driven-development` and `verification`-adjacent workflows: it specifies a read-only review contract ("Do not mutate the working tree, the index, HEAD, or branch state in any way"), a severity taxonomy (Critical/Important/Minor), and an explicit "Critical Rules" DO/DON'T list (e.g. "Say 'looks good' without checking" is forbidden). Has a full worked example output showing the Strengths/Issues/Recommendations/Assessment format.
- **Keywords:** BASE_SHA/HEAD_SHA, "Ready to merge? Yes | No | With fixes," read-only review contract.

### subagent-driven-development
- **What:** "Use when executing implementation plans with independent tasks in the current session." (Note: description deliberately omits workflow detail per the project's own SDO rule — see writing-skills below.) Executes a plan by dispatching one fresh implementer subagent per task, running a two-part task review (spec compliance + code quality) after each, running a scoped fix loop on findings, and a final whole-branch review at the end.
- **Where:** `skills/subagent-driven-development/SKILL.md`, `implementer-prompt.md`, `task-reviewer-prompt.md`, `re-review-prompt.md`, `scripts/sdd-workspace` (bash), `scripts/task-brief` (bash), `scripts/review-package` (bash).
- **Notable:** This is the most heavily mechanized skill in the set — it pairs prose process with 3 executable bash scripts:
  - `scripts/sdd-workspace PLAN_FILE` resolves/creates a per-plan git-ignored workspace at `<repo-root>/.superpowers/sdd/<plan-basename>/` and writes a self-ignoring `.gitignore` (`printf '*\n'`), specifically because "Claude Code treats .git/ as a protected path and denies agent writes there."
  - `scripts/task-brief PLAN_FILE N` uses an `awk` state machine that tracks code-fence state (`infence`) so it doesn't false-match a "# Task N" heading appearing inside a code block, and extracts exactly one task's text to its own file.
  - `scripts/review-package PLAN_FILE BASE HEAD` builds a single diff-package file (`git log --oneline`, `git diff --stat`, `git diff -U10`) so reviewer subagents read one file instead of running git commands themselves.
  A persistent **ledger file** (`progress.md`) is the recovery mechanism across context compaction: "Conversation memory does not survive compaction... Track progress in a ledger file, not only in todos." A capped **fix loop** (5 rounds max per task): rounds 1-3 resume the original implementer, rounds 4-5 dispatch a fresh implementer "on a more capable model." At round 5 a "breaker" trips and every open finding must be adjudicated by the controller with one of three explicit rulings (wrong/contestable → park; real-but-not-load-bearing → park; real-and-load-bearing → STOP, report BLOCKED). Explicit rule against pre-judging reviewers: "If the prompt you are writing contains 'do not flag'... you are pre-judging." A "Model Selection" section tells the controller to pick model tier per task/review complexity and warns "An omitted model inherits your session's model... which silently defeats this section." Large embedded `dot` process diagram for the whole per-task loop.
- **Keywords:** ledger, breaker, fix round R/5, task brief, review package, workspace, "load-bearing finding," "parked with ruling," DONE/DONE_WITH_CONCERNS/BLOCKED/NEEDS_CONTEXT status contract.

### systematic-debugging
- **What:** "Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes." A 4-phase mandatory debugging process (Root Cause Investigation → Pattern Analysis → Hypothesis and Testing → Implementation) that forbids proposing a fix before root cause is understood.
- **Where:** `skills/systematic-debugging/SKILL.md`, `root-cause-tracing.md`, `defense-in-depth.md`, `condition-based-waiting.md`, `condition-based-waiting-example.ts`, `find-polluter.sh`, `CREATION-LOG.md`, `test-academic.md`, `test-pressure-1.md`, `test-pressure-2.md`, `test-pressure-3.md`.
- **Notable:** The "Iron Law": `NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST`, plus "Violating the letter of this process is violating the spirit of debugging." A hard escalation rule at 3+ failed fix attempts: "If ≥ 3: STOP and question the architecture... DON'T attempt Fix #4 without architectural discussion." A "your human partner's Signals You're Doing It Wrong" section listing exact phrases a human might say ("Is that not happening?", "Stop guessing", "Ultra-think this") mapped to "STOP. Return to Phase 1." Ships 3 full pressure-test scenario files used to validate the skill itself under duress (production-outage $15k/min pressure; 4-hour sunk-cost/exhaustion pressure; senior-engineer authority pressure in a live call) plus one academic comprehension test — these are literally the RED-phase test fixtures described in writing-skills' TDD-for-skills methodology, preserved in the repo as a worked example (`CREATION-LOG.md` documents the extraction/bulletproofing history and cites specific pressure-test results). `find-polluter.sh` is a real bisection script that runs test files one-by-one to find which test creates a stray file/dir.
- **Keywords:** Iron Law, Phase 1-4, root-cause-tracing, defense-in-depth (4 validation layers: entry/business-logic/environment-guard/debug-instrumentation), condition-based-waiting (`waitFor`), "question the architecture."

### test-driven-development
- **What:** "Use when implementing any feature or bugfix, before writing implementation code." Enforces literal Red-Green-Refactor TDD: write a failing test, watch it fail for the right reason, write minimal code to pass, refactor, repeat.
- **Where:** `skills/test-driven-development/SKILL.md`, `writing-good-tests.md`.
- **Notable:** Iron Law: `NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST`, with an explicit no-exceptions list against keeping pre-written code "as reference" or "adapting" it while writing tests — "Delete means delete." A large "Common Rationalizations" table (10 entries) and a matching "Red Flags - STOP and Start Over" list mirroring the exact excuses. `writing-good-tests.md` (loaded conditionally) formalizes two independent principles as gate functions: "Name the Break" (a test must name the production change that would make it fail; bans "mirror assertions" where the expected value is computed by the same code under test) and "Exercise the Real Thing" (bans asserting on the mock itself; requires "Mirror real data completely" in mock responses) plus a closing "Mutation Check" — mentally mutate the production code and confirm at least one test fails per mutation.
- **Keywords:** RED/GREEN/REFACTOR, Iron Law, "mirror assertion," "change detector," mutation check, `writing-good-tests.md` gate functions.

### using-git-worktrees
- **What:** "Use when starting feature work that needs isolation from current workspace or before executing implementation plans - ensures an isolated workspace exists via native tools or git worktree fallback."
- **Where:** `skills/using-git-worktrees/SKILL.md` (only file).
- **Notable:** A strict tool-priority order: detect existing isolation first (with an explicit "submodule guard" — `GIT_DIR != GIT_COMMON` is also true inside a git submodule, so it checks `git rev-parse --show-superproject-working-tree` before concluding "already in a worktree") → prefer the harness's native worktree tool if one exists → fall back to manual `git worktree add` only if no native tool exists, with an explicit warning: "Using `git worktree add` when you have a native tool creates phantom state your harness can't see or manage." Requires explicit user consent before creating a worktree unless a preference was already declared. Mandates verifying `.worktrees/`/`worktrees/` is git-ignored before use (`git check-ignore`) and auto-detects project setup commands (npm/cargo/pip/poetry/go) plus runs a baseline test suite before reporting ready.
- **Keywords:** GIT_DIR/GIT_COMMON, submodule guard, native tool vs git fallback, sandbox fallback (permission-denied handling).

### verification-before-completion
- **What:** "Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always."
- **Where:** `skills/verification-before-completion/SKILL.md` (only file).
- **Notable:** Iron Law: `NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE`. A 5-step numbered "Gate Function" (IDENTIFY → RUN → READ → VERIFY → ONLY THEN claim) with "Skip any step = lying, not verifying." A "Common Failures" table mapping claims to what's required vs "Not Sufficient" (e.g. "Tests pass" requires fresh test-command output with 0 failures; "Previous run" or "should pass" is explicitly insufficient). Red Flags list explicitly targets satisfaction language ("Great!", "Perfect!", "Done!") as violations, and states the rule applies to "paraphrases and synonyms... implications of success," not just literal phrases — i.e. it's framed to resist wording workarounds.
- **Keywords:** Iron Law, Gate Function, "evidence before claims," red-green regression-test verification pattern.

### writing-plans
- **What:** "Use when you have a spec or requirements for a multi-step task, before touching code." Produces implementation plans written for "an engineer [with] zero context for our codebase and questionable taste" — bite-sized, TDD-structured, fully-specified tasks with no placeholders.
- **Where:** `skills/writing-plans/SKILL.md`, `plan-document-reviewer-prompt.md`.
- **Notable:** A required literal plan-document header template (Goal/Architecture/Tech Stack/Global Constraints) that every plan MUST start with, including a REQUIRED SUB-SKILL pointer baked into the header itself. A "No Placeholders" section listing exact banned phrases as "plan failures" — "TBD", "Add appropriate error handling", "Similar to Task N" (repeat the code instead), "References to types... not defined in any task." A self-review checklist run by the plan author (not a subagent) checking spec coverage, placeholder scan, and cross-task type/signature consistency (e.g. catches `clearLayers()` vs `clearFullLayers()` drift). Ends with an explicit execution-choice handoff prompting the user to choose Subagent-Driven (recommended) vs Inline Execution, each with a REQUIRED SUB-SKILL pointer.
- **Keywords:** "Global Constraints," "Bite-Sized Task Granularity" (2-5 minute steps), "No Placeholders," Task Right-Sizing, `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`.

### writing-skills
- **What:** "Use when creating new skills, editing existing skills, or verifying skills work before deployment." Frames skill-authoring itself as TDD applied to documentation: write pressure-scenario tests, watch an agent fail without the skill (RED), write the skill (GREEN), close loopholes found by re-testing (REFACTOR).
- **Where:** `skills/writing-skills/SKILL.md`, `anthropic-best-practices.md`, `persuasion-principles.md`, `testing-skills-with-subagents.md`, `graphviz-conventions.dot`, `render-graphs.js`, `examples/CLAUDE_MD_TESTING.md`.
- **Notable:** This is the project's own meta-methodology and the single most elaborate skill in the set.
  - A literal TDD-mapping table equating "pressure scenario with subagent" to "test case" and "SKILL.md" to "production code."
  - A hard rule that a skill's YAML `description` must describe **only triggering conditions, never workflow** — with a cited concrete failure: a description that said "code review between tasks" caused an agent to run only ONE review, even though the skill's flowchart specified two; changing the description to omit the workflow summary fixed it. This directly explains why `subagent-driven-development`'s description above is terse.
  - "Match the Form to the Failure" table: prohibition+rationalization-table+red-flags is for rule-skipping-under-pressure failures; a positive recipe/contract is for wrong-shaped-output failures; prohibitions are explicitly said to *backfire* on shaping problems, backed by a described micro-test result ("the prohibition arm produced clearly more of the unwanted content than the recipe arm... trended worse than even the no-guidance control").
  - "Bulletproofing Skills Against Rationalization" section: close every loophole explicitly, add a foundational "violating the letter is violating the spirit" line, build a rationalization table, add a red-flags list — and cites `persuasion-principles.md` (Cialdini 2021; Meincke et al. 2025, N=28,000 AI conversations, compliance 33%→72%) for *why* imperative/authority language works on LLMs, while explicitly flagging Reciprocity and Liking principles as things to avoid for discipline-enforcement ("Liking... DON'T USE for compliance... Conflicts with honest feedback culture").
  - `testing-skills-with-subagents.md` operationalizes the RED/GREEN/REFACTOR cycle for skills with a "Meta-Testing" step: after an agent picks the wrong option, ask it directly "How could that skill have been written differently..." and use its three possible response types (skill was clear/should-have-said-X/didn't-see-it) to route the fix.
  - `examples/CLAUDE_MD_TESTING.md` is a full worked test campaign (4 pressure scenarios × 5 CLAUDE.md documentation variants from NULL/soft-suggestion up to an XML-tagged "EXTREMELY IMPORTANT" emphatic style) used to empirically choose skill-invocation wording — directly connects to `using-superpowers`'s own emphatic tag style below.
  - `anthropic-best-practices.md` is Anthropic's own official skill-authoring guidance, included verbatim as a secondary reference the project deliberately does NOT fully follow (see repo CLAUDE.md: "Our internal skill philosophy differs from Anthropic's published guidance... PRs that restructure, reword, or reformat skills to 'comply' with Anthropic's skills documentation will not be accepted without extensive eval evidence").
  - `graphviz-conventions.dot` is a style guide written in graphviz itself (diamonds=questions, boxes=actions, plaintext=literal commands, octagon=warnings, doublecircle=entry/exit).
  - `render-graphs.js` is a real Node script (168 lines) that extracts ` ```dot ` blocks from a SKILL.md and renders them to SVG via the system `dot` binary, for human visualization.
- **Keywords:** RED-GREEN-REFACTOR for skills, Skill Discovery Optimization (SDO), "Match the Form to the Failure," bulletproofing, micro-test vs pressure-scenario, persuasion principles (Authority/Commitment/Scarcity/Social Proof/Unity — Reciprocity/Liking avoided).

---

## Deep dive: using-superpowers (the dispatch/meta skill)

- **Where:** `skills/using-superpowers/SKILL.md`, `skills/using-superpowers/references/antigravity-tools.md`, `references/codex-tools.md`, `references/gemini-tools.md`, `references/pi-tools.md`.

This is the bootstrap skill the repo's own contributor guidelines (top-level
`CLAUDE.md`) identify as load-bearing for every other skill: "A real
integration loads the `using-superpowers` bootstrap at session start. The
bootstrap is what causes skills to auto-trigger at the right moments. Without
it, the skills are dead weight — present on disk but never invoked." The repo's
own acceptance test for a new harness integration is to send the message "Let's
make a react todo list" into a clean session and confirm `brainstorming`
auto-triggers before any code is written — proof this skill is the trigger
mechanism for the whole library.

**Frontmatter description (verbatim):** "Use when starting any conversation -
establishes how to find and use skills, requiring skill invocation before ANY
response including clarifying questions."

**Structural/enforcement mechanism, quoted verbatim:**

1. A subagent bypass tag at the very top of the body, before any other content:
   ```
   <SUBAGENT-STOP>
   If you were dispatched as a subagent to execute a specific task, ignore this skill.
   </SUBAGENT-STOP>
   ```
   This prevents the meta-skill from firing inside subagents that were dispatched for a narrow, already-scoped task — it's specifically a top-level-session-only gate.

2. Immediately after, an emphatic custom-tagged block:
   ```
   <EXTREMELY-IMPORTANT>
   If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

   IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

   This is not negotiable. You cannot rationalize your way out of this.
   </EXTREMELY-IMPORTANT>
   ```
   The "1% chance" framing sets a deliberately low activation bar — biased toward over-triggering rather than under-triggering. This XML-tag-with-authority-language style is directly the pattern the skill's own testing methodology (`writing-skills/examples/CLAUDE_MD_TESTING.md`, "Variant C: Claude.AI Emphatic Style") found to produce the strongest compliance among the documentation variants it tested.

3. **The Rule** (core dispatch order): "Invoke relevant or requested skills BEFORE any response or action — including clarifying questions, exploring the codebase, or checking files. If it turns out wrong for the situation, you don't have to use it." — note the escape valve at the end: invocation is mandatory, but abandoning a wrongly-triggered skill is explicitly permitted. Also: "Before entering plan mode: if you haven't already brainstormed, invoke the brainstorming skill first." Then: "announce 'Using [skill] to [purpose]' and follow the skill exactly. If it has a checklist, create a todo per item." — this is the origin of the "Announce at start" pattern seen verbatim at the top of executing-plans, finishing-a-development-branch, subagent-driven-development, using-git-worktrees, and writing-plans.

4. **Skill Priority ordering rule:** "When multiple skills apply, process skills come first — they set the approach, then implementation skills (frontend-design, etc.) carry it out." with two canonical routing examples given verbatim: `"Let's build X" → superpowers:brainstorming first, then implementation skills.` and `"Fix this bug" → superpowers:systematic-debugging first, then domain skills.` This is the explicit ordering contract between brainstorming/systematic-debugging (named "Superpowers' most common process skills") and everything else.

5. **Red Flags table** (12 rows) — each row is a literal rationalization thought mapped to a rebuttal, engineered to close every "skip the skill check" argument a model might generate. Full table, verbatim:

   | Thought | Reality |
   |---------|---------|
   | "This is just a simple question" | Questions are tasks. Check for skills. |
   | "I need more context first" | Skill check comes BEFORE clarifying questions. |
   | "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
   | "I can check git/files quickly" | Files lack conversation context. Check for skills. |
   | "Let me gather information first" | Skills tell you HOW to gather information. |
   | "This doesn't need a formal skill" | If a skill exists, use it. |
   | "I remember this skill" | Skills evolve. Read current version. |
   | "This doesn't count as a task" | Action = task. Check for skills. |
   | "The skill is overkill" | Simple things become complex. Use it. |
   | "I'll just do this one thing first" | Check BEFORE doing anything. |
   | "This feels productive" | Undisciplined action wastes time. Skills prevent this. |
   | "I know what that means" | Knowing the concept ≠ using the skill. Invoke it. |

6. **Platform Adaptation section** — routes to harness-specific reference files "If your harness appears here": Codex → `references/codex-tools.md`; Pi → `references/pi-tools.md`; Antigravity → `references/antigravity-tools.md`. (Gemini's reference file exists too, at `references/gemini-tools.md`, though it is not explicitly named in this routing list in the body text — it is referenced elsewhere, e.g. from `writing-skills/SKILL.md`'s personal-skills-directory note, and is a fully worked-out tool-mapping doc in its own right.)

7. **User Instructions precedence rule** (closing line): "User instructions (CLAUDE.md, AGENTS.md, GEMINI.md, etc, direct requests) take precedence over skills, which in turn override default behavior. Only skip skill workflows or instructions when your human partner has explicitly told you to." — establishes a strict 3-tier precedence: user instructions > skills > default behavior.

### The four `references/*.md` files — harness action-translation tables

Each reference file exists to translate the skills' harness-agnostic verbs
("dispatch a subagent," "create a todo," "read a file") into the concrete tool
names of one non-Claude-Code runtime. Together they are what makes the skill
library portable across agent CLIs, per the repo's own "New Harness Support"
policy (top-level CLAUDE.md: a real integration must auto-trigger `brainstorming`
without any per-session opt-in).

- **`codex-tools.md`:** Requires enabling `multi_agent = true` in
  `~/.codex/config.toml` to unlock `spawn_agent`/`wait_agent`/`close_agent` for
  parallel/subagent-driven skills. Gives explicit lifecycle guidance: "close
  reviewer subagents when their review returns. Keep each implementer subagent
  open until its task's review passes — the fix loop resumes the implementer —
  then close it." Documents environment-detection bash snippets
  (`GIT_DIR`/`GIT_COMMON`/`BRANCH`) reused by `using-git-worktrees` and
  `finishing-a-development-branch`. Has a "Codex App Finishing" section for the
  detached-HEAD/externally-managed-worktree case, where the agent hands off to
  the App's native "Create branch" / "Hand off to local" controls rather than
  running git itself.

- **`gemini-tools.md`:** A full action→tool mapping table (`read_file`,
  `write_file`, `replace`, `run_shell_command`, `grep_search`, `glob`,
  `list_directory`, `web_fetch`, `google_web_search`, `activate_skill`,
  `invoke_agent` for subagent dispatch, `write_todos` for task tracking).
  Documents that `GEMINI.md` is the Gemini-CLI equivalent of "your instructions
  file," loaded hierarchically (global → project → subdirectory). Documents
  personal skills at `~/.gemini/skills/` with `~/.agents/skills/` as a
  cross-runtime alias shared with Codex/Copilot CLI (and that `.agents/skills/`
  wins if both exist at the same scope). Explains the `@generalist` chat-syntax
  shortcut as equivalent to `invoke_agent(agent_name: "generalist")`, and gives
  a specific prompt-template-filling table for how Gemini CLI should fill in
  the superpowers `*-prompt.md` templates (implementer-prompt.md,
  task-reviewer-prompt.md, code-reviewer.md) before dispatch. Lists Gemini-only
  tools with no Claude-Code equivalent (`save_memory`, `get_internal_docs`,
  `ask_user`, `enter_plan_mode`/`exit_plan_mode`, `update_topic`,
  `complete_task`, a `tracker_*` family for dependency-aware task tracking,
  `read_mcp_resource`/`list_mcp_resources`).

- **`pi-tools.md`:** Much shorter — Pi core ships no standard subagent or
  todo/task tool at all. Explicit fallback instruction: "If no subagent tool is
  available, do not fabricate `Task` calls; execute sequentially in the
  current session or explain that the optional subagent capability is not
  installed." Task tracking falls back to plan files, markdown checklists, or a
  repo-local `TODO.md`; notes that older docs referencing `TodoWrite` should be
  treated as this fallback.

- **`antigravity-tools.md`:** Maps subagent dispatch to `invoke_subagent` with
  built-in `TypeName` values `self` (full-capability) or `research`
  (read-only). Notably, Antigravity has **no todo tool** — `manage_task`
  manages background *processes* (list/kill/status/send_input), not a
  checklist — so task tracking must instead use a markdown "task artifact"
  written via `write_to_file` with `IsArtifact: true` and
  `ArtifactMetadata.ArtifactType: "task"`, edited incrementally with
  `replace_file_content` as steps complete. This is flagged explicitly as a
  trap: "**Not** `manage_task`, which manages background processes."

---

## Cross-cutting observations (mechanical, not evaluative)

- **Announce-at-start pattern:** Appears verbatim in `executing-plans`,
  `finishing-a-development-branch`, `subagent-driven-development`,
  `using-git-worktrees`, and `writing-plans` ("I'm using the X skill to
  Y"). Originates from `using-superpowers`'s "The Rule."
- **"Iron Law" pattern:** `test-driven-development`, `systematic-debugging`,
  and `verification-before-completion` each open with a one-line all-caps
  imperative framed as an "Iron Law," followed by a rationalization table and
  a red-flags list — the same 3-part discipline-enforcement template
  `writing-skills` names explicitly under "Match the Form to the Failure."
- **REQUIRED SUB-SKILL / REQUIRED BACKGROUND markers:** A specific
  cross-reference convention (`writing-skills/SKILL.md` "Cross-Referencing
  Other Skills" section) used throughout — e.g. `writing-plans` →
  `subagent-driven-development`/`executing-plans`; `writing-skills` →
  `test-driven-development`. Explicitly NOT `@`-links, because those "force-load
  files immediately, consuming 200k+ context before you need them."
  Cross-references use `superpowers:<skill-name>` naming.
  Skill file references like `code-reviewer.md` are used by both
  `requesting-code-review` (direct) and `subagent-driven-development` (final
  whole-branch review), showing the template is shared/reused rather than
  duplicated.
  Note that `code-reviewer.md`, `implementer-prompt.md`, `re-review-prompt.md`,
  `task-reviewer-prompt.md`, `spec-document-reviewer-prompt.md`, and
  `plan-document-reviewer-prompt.md` are all the same genre of artifact
  (a dispatch-prompt template with a placeholder list and defined output
  format) — distributed one per skill directory rather than centralized.
- **"your human partner" terminology:** Used deliberately instead of "the
  user" throughout `receiving-code-review`, `systematic-debugging`, and
  elsewhere — the repo's own top-level CLAUDE.md flags this as an intentional,
  tested choice, not incidental phrasing: "'your human partner' is deliberate,
  not interchangeable with 'the user.'"
- **`docs/superpowers/` as the canonical artifact location:** specs go to
  `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` (brainstorming), plans
  to `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md` (writing-plans), and
  ephemeral SDD workspace state to `.superpowers/sdd/<plan-basename>/`
  (subagent-driven-development, git-ignored).
- No skill directory contained anything unreadable or structurally unexpected;
  every directory's only required file (`SKILL.md`) was present and valid
  YAML-frontmatter + markdown.

Status: DONE
