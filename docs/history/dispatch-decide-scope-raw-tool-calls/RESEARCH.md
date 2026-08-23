# RESEARCH — tsk-3k4: does `dispatch.mjs decide` need to cover raw tool calls (e.g. WebSearch) a skill makes directly mid-turn?

## Round 1 — 2026-08-17 (discovery)

**Asked:** Is fgOS's dispatch-coordination requirement (AGENTS.md's
"Dispatch — routing work to a capacity/executor" section, enforced today
by a `PreToolUse` hook running `node src/runner/dispatch.mjs decide`)
deliberately scoped to Agent/Task-tool spawns only, or is it silent/
undecided on whether a skill's own direct tool calls mid-turn (observed:
`fgos-coding-shaping` ran `WebSearch` 5x back-to-back during
`/fgOS:coding-shape`, no `decide` call anywhere in that sequence) should
also be coordinated?

**Checked (repo, all real hits, no guessing):**

1. **The hook's actual matcher.** `test/setup/claude-code-hooks.test.mjs:23-24`
   asserts `settings.hooks.PreToolUse[0].matcher === 'Agent|Task'` and that
   the wired command is `dispatch-decide-hook.mjs`. `src/setup/
   claude-code-hooks.mjs:37-74` (`installClaudeCodeHook`) wires exactly this
   entry. `src/setup/registrations.mjs:514-516,603` — the doctor check's own
   description: "`.claude/settings.json` PreToolUse hook enforces
   `dispatch.mjs decide` on every Agent/Task call." The matcher is a literal
   regex alternation over two tool names — mechanically, it cannot fire on
   `WebSearch` or any other tool.

2. **The hook's own design record** (`docs/history/tsk-60f/plan.md:86-113`,
   piece 6, D1/D5): built to read `tool_input.subagent_type` and call
   `dispatch.mjs decide --for "<subagent_type>" --needs-soul
   --has-live-task-access` — i.e. it is built around the Agent/Task tool's
   own `subagent_type` field. There is no code path here that could apply
   to a tool call with no `subagent_type` (WebSearch has none). This is a
   from-scratch design for gating subagent spawns specifically, not a
   general tool-call gate that happens to only match two tools today.

3. **`dispatch.mjs`'s own scope, from its header** (`src/runner/
   dispatch.mjs:1-4`): "the runner's executor dispatch... spawns the
   headless executor." The whole module answers one question — should a
   SPAWN (of a capacity/executor process) run in-process or
   out-of-process — never "should this tool call happen." A `WebSearch`
   call made directly by the current session's own skill is not a spawn at
   all (no new process, no capacity) — architecturally the same category as
   a `Read`/`Grep`/`Bash` call, which nothing in this codebase gates through
   `decide` either.

4. **The shared dispatch-reasoning fragment every skill is supposed to
   consult before choosing to dispatch anything**
   (`.agents/skills/_shared/capacity-dispatch-fallback.md:23-31`): "Valid
   reasons to dispatch instead of doing it inline. Four, no more
   (`docs/history/two-layer-dispatch/DISCUSSION.md` D2)... Anything else
   stays inline — the live session already has full context for it, and
   dispatching it anyway is the same 'soul re-deriving what a live soul
   already knows' waste `tsk-1ni` found." A single `WebSearch` call inside
   a skill's own reasoning is exactly "doing it inline" — there is no
   separate "step" being handed to a subagent that `decide` would ever be
   asked about.

5. **The closest real precedent — organized, multi-branch research fan-out
   — was explicitly decided to bypass `decide` on purpose**
   (`.agents/skills/fgos-researching/SKILL.md:58-64`, hard rule): "Every
   fan-out branch dispatches via native Task-tool, always (tsk-5tm-2 D6:
   the `gather`-purpose capacity this section used to consult is retired —
   no architectural reason on record for needing cross-provider dispatch
   here, and native Task-tool already met the one documented reason,
   parallelizing wall-clock). No purpose check, no decide/resolve round
   trip." Read-only/no-file-write research work ("gather packets") is a
   named, designed category (`docs/explanation/why-fgos-dispatch-splits-
   into-gather-packets-and-a-gated-exec-packet.md:17-20`): "read/synthesize
   only. No file writes, no id, no state. Returns a digest. Fits
   `discover`'s scout work..." — this is precisely the shape of what
   `fgos-coding-shaping`'s `WebSearch` burst was doing.

6. **Searched for any doc that discusses this exact boundary explicitly**
   (`rg -n "WebSearch|raw tool call|deferred tool" docs/decisions
   docs/history/tsk-60f src/runner/dispatch.mjs AGENTS.md`) — zero hits.
   No decision record uses the words "WebSearch" or discusses raw in-
   process tool calls as a named case at all. The boundary is never stated
   as a single explicit sentence — it is, however, unambiguously implied by
   findings 1-5 above (the hook's matcher, the hook's own design record,
   `dispatch.mjs`'s own docblock scope, the 4-reasons list, and the D6
   precedent), which is why this round returns `clear` rather than a
   `question`: the answer is derivable from real, converging evidence, even
   though no single doc states it in one sentence.

**What remains open (for planning, not discovery):** whether it is worth a
small doc clarification (e.g. one sentence in AGENTS.md's `## Dispatch`
section, or a line in `capacity-dispatch-fallback.md`) making this
boundary explicit so a future reader doesn't re-raise the same "why didn't
dispatch coordinate this WebSearch burst" question from scratch — this is
a scope/cost-benefit call for planning, not a discovery-stage finding.
