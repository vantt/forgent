---
id: ds-2d55ty37zz
title: "One door and one context-injection seam for starting an agent"
status: open
source:
  - p-25q7tz6jtt
created: 2026-11-22
---

discussion: open

## 1. Trạng thái hiện tại

2026-11-22 16:15 — The scan is done (§3 table, inventory in [#scan](#scan)). The three main findings:

1. Agents start through two families plus Claude's own subagent tool, and all fgOS-made starts already reach one spawn point (the Rust execution engine). What is split is the *text*: two prompt composers and three persona renderers.
2. Always-loaded context for Claude in this repo is about 17k tokens (about 29k with the skill listing). fgOS writes less than half of it; about 4.2k tokens is AgentKit rules loaded twice.
3. Prior art already holds a dormant per-domain instruction composition that nothing uses.

A proposed shape for the door and the seam is in §3 (P4–P7) as provisional; nothing is minted yet.

Open owner question: **Q1** (`q-excujq527g`) — does the seam's job include the parts of AGENTS.md that other tools write (AgentKit, GitNexus, MDView), or only fgOS's own text? It blocks only P6 (what leaves AGENTS.md). Shaping P4, P5 and P7 continues meanwhile.

## 2. Mục tiêu & đề bài

Every agent that fgOS starts should start through one door, and that door should have one fixed seam where context is injected: role, domain and task go in, the context that fits them comes out. Today every agent loads CLAUDE.md and AGENTS.md in full at start and uses little of it, which costs many tokens on every start; yet at the moment of start the system already knows the role, domain and task, so it could inject only what fits. The `head start` activation prompt is the owner's reference for a good start prompt. Later components, such as an agent-context-injection component, plug into the seam instead of growing their own path. The work is shaped in this order: first a scan that counts and lists every way an agent is started and every place that writes or owns its start prompt or context (file, what it injects, who calls it); then the single door, the seam's contract, what leaves CLAUDE.md and AGENTS.md, and what a first increment toward it looks like. Constraints: hexagonal and pluggable (design principle 3); one door, with old paths moved and deleted in the same change (principle 1, L10); prior art first (`git log -S`, area specs' decision history); owner decisions come as five-part questions with a recommendation and a default. Non-goals: writing the injection component itself; changing what persona or domain doctrine says. Source: `p-25q7tz6jtt`; related `ds-cfsfcbknl6` (how agents talk to the owner).

## 3. Vấn đề rõ / chưa rõ

| # | Point | State | Evidence / blocker |
|---|-------|-------|--------------------|
| P1 | How many ways an agent is started today, and who owns each start prompt | clear | [#scan](#scan): 5 head paths into one `placeHead`; 7 live worker paths into one Rust engine; Claude's Agent/Task subagents outside both |
| P2 | Which context is always loaded, its size, who writes it | clear | [#ambient](#ambient): ~17.1k tokens for Claude here, ~29k with skills; fgOS writes ~7.7k of it |
| P3 | Prior art for start-time injection | clear | [#prior-art](#prior-art): dormant domain composition targets; the only role-keyed start injection today is the rotation hook (728942829) |
| P4 | Where the single door lives | proposed, one round | The Rust engine's attempt launch (`launch_session_attempt`, `packages/execution/engine/src/transport_round/session_attempt.rs:222`): heads reach it through `launch-session` with a verbatim opening, workers through `run-unit`. Spawning is already one door; composition is not. Proposal: composition moves to that door too, and Node `openingText` (`src/session-host/head-start.mjs:114`) and `renderPersonaSection` (`src/runner/agent-definitions.mjs:310`) are deleted |
| P5 | Seam contract | proposed, one round | One port in Rust. In: role (head persona or worker seat), persona id, domain, task reference (plan, discussion or Unit objective), target CLI, delivery mode. Out: ordered context blocks — persona, domain doctrine, task, start ritual / on-wake, handoff. Sources plug in as adapters: persona definitions, the dormant domain-target instruction composition (`src/setup/instruction-composition.mjs:94-125`), the rotation handoff. Delivery adapters: typed opening (all five CLIs today), `-p` prompt (headless), Claude `SessionStart` additionalContext |
| P6 | What leaves CLAUDE.md / AGENTS.md | **blocked by Q1** (`q-excujq527g`) | fgOS-owned part: L8 placement test decides — a rule that need not hold with no workflow running moves behind the seam. Open: whether third-party blocks are in scope. Hand-opened sessions (the owner typing `claude` in a repo) bypass any door, so a standing sheet stays in every case |
| P7 | First increment | proposed, one round | (a) one persona renderer and one composer behind the seam, used by heads and workers, Node copies deleted; (b) domain doctrine through the seam by switching on the domain targets; (c) AGENTS.md cut per P6. Each slice lands alone |
| P8 | Claude Agent/Task subagents | open | They start from `.claude/agents/<type>.md` (third persona renderer, `scripts/project-agents.mjs:110`) and the AgentKit `SubagentStart` hook; fgOS's hook only allows or blocks. Whether the seam should render that file too is not yet discussed |
| P9 | Mess seen outside this scope | for the secretary as separate items | Codex cuts AGENTS.md at 32 KiB (file is 50.8 KB; Id Minting and the AgentKit block are lost); a stray `<!-- mdview:START -->` at AGENTS.md:232; `statusLine` points into `forgentX`; 6 of 14 `core/agents` never projected to `.claude/agents`; workflow personas `advisor`, `panelist`, `synthesizer`, `critic`, `brand-guardian` have no definition; Node dispatch/prompt mirror looks unreachable; `core/prompt-templates/*` used by no live flow; Unit `skills` never reach the prompt; a Claude rotation successor gets the handoff twice, other CLIs get only the path |

### Scan inventory {#scan}

**Head sessions** — all end in `placeHead` (`src/session-host/head-start.mjs:232`), opening text built by `openingText` (`:114-130`):

| # | Path | Entry | Caller |
|---|------|-------|--------|
| H1 | `fgos session start <persona>` by hand | `bin/fgos.mjs:3267` → `head-request.mjs:44` → `startHeadSession` `head-start.mjs:276` | owner |
| H2 | same verb over a head's request socket | `head-request-client.mjs:171` → `packages/run-supervisor/rust/src/head_request.rs:38` → `head-request.mjs:712` | secretary (shaper), supervisor (lead, planner) |
| H3 | supervisor wake | `packages/supervision/rust/src/wake.rs:272` → `apps/fgos/src/wiring/supervision.rs:672` runs H1 | `fgos watcher tick`, `fgos supervisor wake` |
| H4 | rotation successor | `src/session-rotation/rotate.mjs:333` → `placeHead` `:442` | `fgos session rotate`, socket verb, Claude Stop hook |
| H4b | rotation `SessionStart` hook | `apps/fgos/src/wiring/session_rotation_hook.rs:265` → `packages/session-host/rust/src/rotation/handoff.rs:190` | Claude only |

Opening blocks: Persona (`renderPersonaSection`, from `core/agents/<p>.yaml` or workspace `fgos/agents/`; skills by *name* only), identity line, `# Task` (`taskOfHead`, `head-plan.mjs:213`; first-step text hardcoded in `FIRST_STEPS`), `# Start ritual` (hardcoded), optional question line, `# On wake` (`renderOnWake`). Spawn: Node `launchSessionInHost` (`src/native/execution-door.mjs:376`) → Rust `launch-session`; the opening is written verbatim to `brief.md` and typed into the herdr pane (`packages/agent-protocol/rust/src/terminal/mod.rs:554`). No `--append-system-prompt` or `--system-prompt` anywhere.

**Execution workers** — all end in the Rust unit-run engine; prompt by `render_assignment_prompt` (`packages/execution/engine/src/assignment/builder.rs:757`), persona by `persona.rs:310` (4 layers: workspace, workflow, domain, core), persona chosen by `bind` (`packages/execution/rust/src/bind.rs:358`):

| # | Path | Entry | What feeds the prompt |
|---|------|-------|-----------------------|
| W1 | `fgos run "<prompt>"` | `apps/fgos/src/wiring/run.rs:436` | prompt → objective; `--persona`, `--writes`, `--capability`, `--input` |
| W2 | `fgos run` from a head | `apps/fgos/src/routing.rs:546` → `head_request.rs:1403` | same |
| W3 | `fgos run --unit` / `--resume` | same builder | Unit fields |
| W4 | `fgos workflow start` | `src/workflow/runner.mjs:146` | step template + inline `objective`/`roleTasks` in `domains/*/workflows/*.yaml` |
| W5 | legacy `fgos-runner` | `src/runner/work-dispatch.mjs:114` | Node `buildPrompt` (`src/runner/work-compat.mjs:116`) + `src/runner/prompt-templates/*.txt`, then wrapped again by Rust |
| W6 | declared-operation step (`fgos discover`, `fgos plan`) | `src/runner/operation-choice.mjs:2321` | domain task-spec path, optional `contractTemplate` |
| W7 | fanout batch | `src/runner/fanout-batch.mjs:97` | as W5 |
| — | named `agentType` executor | `packages/execution/rust/src/executor_config.rs:67` | `--agent <type>` → `.claude/agents/<type>.md` |
| — | Claude Agent/Task subagent | Claude Code itself; fgOS `dispatch-decide` hook only gates | `.claude/agents/<type>.md` + AgentKit `SubagentStart` |
| — | credential probe | `packages/execution/engine/src/accounts/credential_probe.rs:104` | fixed probe prompt; not real work |

Persona renderers: three (Node `renderPersonaSection` for heads, Rust `persona.rs` for workers, `scripts/project-agents.mjs` for `.claude/agents`), one source (`core/agents/*.yaml`).

### Ambient context {#ambient}

Claude Code in this repo, measured 2026-11-22 (tokens ≈ bytes/4):

| Part | ~Tokens | Writer |
|------|---------|--------|
| AGENTS.md hand-written doctrine (L1–231) | 5,192 | people/agents |
| impact-analysis gate + MDView block | 935 | hand / external mdview |
| GitNexus block | 726 | external `gitnexus analyze` |
| fgOS Effective Instructions projection | 1,623 | `npm run build:skills` → `src/setup/instruction-projections.mjs:330` |
| AgentKit block in AGENTS.md | 4,238 | AgentKit installer |
| `.claude/rules/*.md` (same AgentKit rules again) | 4,217 | AgentKit installer |
| CLAUDE.md | 126 | hand |
| **Total certain** | **~17.1k** | |
| Skill listing (name + description) | ~7.9k | skill build + AgentKit |

Plus hooks: AgentKit `session-init` (≤4 KB), `dev-rules-reminder` on every prompt, AgentKit `SubagentStart`; fgOS rotation handoff (heads only, ≤10k chars), questions line, mailbox on PostToolUse. Other projects get fgOS hooks but no fgOS doctrine: `fgos setup` was retired (12f8a187a), and the projection is written only in this checkout.

### Prior art {#prior-art}

- 07c4a5205 (2026-08-20): doctrine split into core/domain; `domains/<d>/AGENTS.md` read on demand by skills — today's domain mechanism.
- 9def51380 (2026-09-14): instruction projection into AGENTS.md. The composition supports `domain:<name>` targets and the contract names `.fgos/instructions/effective/domain-<d>.json`, but only `target=repo` is ever materialized (`instruction-projections.mjs:241`). Dormant, reusable.
- 08244d2ba (2026-10-17): measured loading across four CLIs; recommended AGENTS.md under 32 KiB and dropping `.claude/rules`. Not carried out; 334d66ed8 (AgentKit v3, 2026-11-09) reinstalled the rules.
- 00cd5f9fc (2026-10-21): 14 places rules live; "rules don't reach where agents work".
- b7eeb4bb6 … e749259d2: "one persona door for head sessions and worker briefs" — intended one renderer, yet three remain.
- 728942829 (2026-11-18): rotation hook — the only fgOS start-time injection keyed by role today.
- L8 (`docs/platform/platform-foundations.md:284-306`): placement test "must this rule hold when no workflow is running?"; transport rides with the order; anchor suite (only RUL11 and RUL104 have anchors). This is the law the seam implements; it needs no superseding.

## 4. Quyết định đã chốt

| D-ID | Decision | Date | Source |
|------|----------|------|--------|

## 5. Q&A log

- 2026-11-22 15:57 — Seed from the secretary on the owner's order: goal, first task (scan), shaping order, constraints, non-goals as in §2. The owner names `head start`'s activation prompt as the reference.
- 2026-11-22 16:15 — Scan done by three read-only sweeps (head/session, run/workflow/executor, ambient context + prior art); results in §3. Proposals P4, P5, P7 written for a first round. Q1 asked through the question store (scope of P6); Asked as `q-excujq527g`; recommended "fgOS text only; third-party mess is a separate item".

## 6. Thiết kế đã chốt {#design}

Not yet: P4, P5 and P7 are proposals after one round; P6 waits on Q1.

## 7. Danh mục hạng mục / task {#tasks}

Not yet.
