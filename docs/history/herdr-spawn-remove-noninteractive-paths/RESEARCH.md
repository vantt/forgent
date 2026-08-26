# RESEARCH.md — tsk-by0: remove herdr-spawn's non-interactive dispatch paths

## Round 1 — 2026-08-26 (discovery stage)

**Asked:** the four scope questions tsk-by0's own description flags as open
(require-vs-default interactiveMode, executors.claude-herdr/pi-herdr/codex-herdr
fate, live-renderers/*.mjs fate, test triage), plus the coordination status of
tsk-2rr.

**Checked:**

1. `fgos list --id tsk-2rr --json --dir /home/vantt/projects/forgentX`
2. `src/runner/dispatch/transport.mjs` (read in full around the relevant
   functions)
3. `grep -rln "live-renderers" / "claude-stream-json" / "pi-agent-session"`
   across `src`, `test`, `docs`
4. `grep -rln "claude-herdr" / "pi-herdr" / "codex-herdr"` across `src`,
   `test`, `docs`, top-level config
5. `grep -n "test(\|describe("` on `test/runner/herdr-spawn-adapter.test.mjs`
   (full enumeration), plus reading the body of the Requirement-5 LIVE test
6. `docs/history/herdr-spawn-agy-interactive-mode/plan.md` (prior art: how
   `agy-herdr`'s own interactiveMode config/adapter branch was added)

**Found:**

1. **tsk-2rr status**: `status: awaiting-approval`, `stage: executing` — NOT
   merged into main yet. tsk-by0's own "do not touch tsk-2rr's
   branch/worktree, coordinate carefully if done before" note is still live
   and must be respected during planning.

2. **Code shape** (`src/runner/dispatch/transport.mjs`):
   - `herdrSpawnAdapter` (line 903) is one function that both dispatches:
     `if (invocation.interactiveMode) return herdrSpawnInteractiveAdapter(...)`
     (line 904-906) — a 3-line redirect to the kept adapter — and, for
     everything else, runs the entire non-interactive body (lines 907-~1344):
     the disposable script-file + `[DONE]`/`[BLOCKED]`-ladder-free sentinel
     path, AND the `liveOutput` branch (script-content `if (liveOutput) {...}
     else {...}` at lines 1068-1102) in the SAME function body — they are not
     separable into two functions; both live inside `herdrSpawnAdapter`'s
     non-interactive branch.
   - `herdrSpawnInteractiveAdapter` (line 538) is a fully separate function
     with its own pane-split/sentinel/env-passing logic (per
     `docs/history/herdr-spawn-agy-interactive-mode/plan.md`'s own design:
     `agent_status`-polling completion detection, not sentinel-on-exit).
   - `EXECUTOR_ADAPTERS['herdr-spawn'] = herdrSpawnAdapter` (line 1348) is
     the only registration site.
   - **Implication**: removing the non-interactive body means either (a)
     `EXECUTOR_ADAPTERS['herdr-spawn']` points straight at
     `herdrSpawnInteractiveAdapter`, or (b) `herdrSpawnAdapter` keeps
     existing only as a thin wrapper that requires `interactiveMode` and
     throws a `DispatchError` (known category, e.g. `invalid-config`) when
     it's missing, rather than silently defaulting it in.

3. **live-renderers fate**: `src/runner/dispatch/live-renderers/{claude-stream-json,pi-agent-session}.mjs`
   are referenced ONLY from `transport.mjs`'s own `liveOutput` branch (being
   removed), `test/runner/herdr-spawn-adapter.test.mjs` (the Requirement-2/3
   tests, also being removed), and historical docs
   (`docs/history/herdr-spawn-generalize-live-visibility/*`,
   `docs/architecture-manifest.json`). No other `src` consumer exists —
   confirms the item's own claim: they become genuinely dead code once
   `liveOutput` is removed. `docs/architecture-manifest.json` is a generated
   projection and will need its own regen pass once the files are deleted
   (not a manual edit).

4. **executors.claude-herdr/pi-herdr/codex-herdr fate**: zero references
   anywhere in `src`, `test`, or a real config file — the only places these
   three ids appear at all are historical planning docs
   (`docs/history/herdr-spawn-agy-interactive-mode/plan.md`,
   `docs/history/herdr-spawn-generalize-live-visibility/{plan,RESEARCH,
   iron-law-evidence}.md`). They were never actually wired into
   `.fgos/config.json` or any shared-config default in this checkout —
   confirms "dormant, never activated." No CLI-level research into a real
   `-i`-equivalent flag for `claude`/`pi`/`codex` was found or attempted
   anywhere in the repo; `agy`'s own `-i` flag only became usable after a
   dedicated redesign item (tsk-10j, the agy-interactive-mode plan above)
   that required real live-binary proof, not just a flag lookup. Reproducing
   that investigation for three more CLIs with zero current callers is
   exactly what YAGNI (`docs/AGENTS.md` baseline, `~/.claude/rules/
   development-rules.md`) argues against.

5. **Test triage** (`test/runner/herdr-spawn-adapter.test.mjs`, 1229 lines,
   file:line per group):
   - **Plain/non-interactive path, mocked** (lines 280-875): "registered in
     EXECUTOR_ADAPTERS", "ALWAYS creates a fresh pane", "MAX_DISPATCH_DEPTH
     cap", "timeout via DispatchError", "D2 hard constraint (Herdr signals
     never mutate state)", "shell metacharacters never execute", "sentinel
     detects a worker that never prints [DONE]/[BLOCKED]", "[DONE] token
     stays visible downstream", "env passed via --env KEY=VALUE", "never
     leaks a secret on split failure", "rejects worker-spawn-fail (no
     result.read.text)", "rejects worker-spawn-fail (no sentinel)", "both
     echo occurrences stripped", "executeExecutorCli acceptance test", "pane
     closes on success" — all exercise `herdrSpawnAdapter`'s non-interactive
     body directly. **Delete.**
   - **Plain/non-interactive path, LIVE (real binaries)** (lines 736-861,
     954-1015): worker-without-sentinel-token, real timeout, false-positive
     `[DONE]` in prompt text, `--direction` flag confirmation, worker keeps
     running past `[DONE]`, observer failure, and Requirement-5's
     `agy`-shaped dispatch via `-p`/plain mode (confirmed by reading its
     body: `args: ['-p', '{prompt}', ...]`, no `interactiveMode`). **Delete.**
   - **liveOutput-specific** (lines 882-953): "supports liveOutput config
     shape & PIPESTATUS pipeline (Requirement 2)", the two live-renderer
     format tests (Requirement 3, lines 927 and 940). **Delete** (dead code
     per finding 3 above).
   - **interactiveMode-specific** (lines 1077-1229): "validates
     interactiveMode config shape", "polls agent_status until idle, sends
     exitCommand, parses sentinel, strips double echo", "handles timeout
     when agent_status stays working", "(LIVE): dispatch a real agy-herdr
     interactiveMode executor". **Keep** — these are tsk-2rr/tsk-10j's own
     tests for the adapter being kept.
   - Lines 1-274 are shared mock-binary fixture helpers
     (`writeRunnerConfigFixture`, mock `herdr pane` scripts) — some of this
     mock-binary scaffolding is reused by the surviving interactiveMode
     tests; needs a per-helper check at planning time for which specific
     mock branches (e.g. `pane get`/`agent_status` handling vs the plain
     sentinel-echo handling) are still exercised, not a blanket keep/delete.

**Still open (for planning, not discovery):** exact refactor shape of
`herdrSpawnAdapter` itself (thin-wrapper-that-throws vs direct
`EXECUTOR_ADAPTERS` repoint) is an implementation-shape call, not a fact
gap — evidence above is sufficient to proceed to `planning` without a human
gate at `exploring`.

## Round 2 — 2026-08-26 (validating stage, reality gate)

**Asked:** does the real, live `.fgos/config.json` (main checkout —
`/home/vantt/projects/forgentX/.fgos/config.json`, not searchable from a
worktree or from tracked `src`/`test`/`docs`, since `.fgos/` is gitignored
and ADR0020-stripped from every worker worktree) actually confirm Round 1's
"unreferenced, dormant, safe to delete" findings for `live-renderers/*.mjs`
and `claude-herdr`/`pi-herdr`/`codex-herdr`?

**Checked:** read `.fgos/config.json`'s `runner.executors` block directly
(`python3 -c "import json; ..."` against the real file) and
`runner.capabilities.fgos-coding-implement`'s own description field.

**Found — this corrects Round 1 findings 3 and 4, which were WRONG:**

1. **`claude-herdr` and `pi-herdr` are real, fully-specified executor
   configs that actively declare `adapter: "herdr-spawn"` with a real
   `liveOutput.renderer` pointing at exactly the two files Round 1 called
   dead code**: `claude-herdr` → `src/runner/dispatch/live-renderers/claude-stream-json.mjs`,
   `pi-herdr` → `src/runner/dispatch/live-renderers/pi-agent-session.mjs`.
   Both carry a real `command`/`args` invocation, not a stub. "DORMANT" in
   their own description means "not yet wired to any capability's
   `prefer`" — i.e., nothing dispatches through them BY DEFAULT today —
   never "unreferenced" or "safe to delete". A person or a future
   capability can still dispatch to either by name right now.
2. **`codex-herdr` is a real config too**, using `herdr-spawn` with NO
   `liveOutput` and NO `interactiveMode` — it depends entirely on the
   PLAIN/non-interactive body (script-file + sentinel, no TUI) that this
   item's plan proposes to delete outright.
3. **`live-renderers/*.mjs` are therefore NOT dead code** — Round 1's grep
   (`src`/`test`/`docs` only) missed the one real consumer because it lives
   in gitignored `.fgos/config.json`, invisible to any tracked-file search.
4. **`claude-herdr`/`pi-herdr`/`codex-herdr` are NOT "never wired into any
   config"** — Round 1's "zero references anywhere" claim was based on the
   same blind spot (searched `src`/`test`/`docs`/top-level config files,
   never the real gitignored `.fgos/config.json`).
5. **New, load-bearing finding Round 1 never looked for**:
   `runner.capabilities.fgos-coding-implement`'s own description records a
   real, twice-confirmed production bug in `executors.agy-herdr`'s
   `interactiveMode` path — the exact mechanism this item's plan proposes
   to keep as herdr-spawn's ONE supported mechanism: *"executors.agy-herdr's
   -i interactiveMode invocation never actually delivers the prompt to
   agy's chat the way -p does -- agy just opens its idle interactive REPL
   banner and sits there, headBefore==headAfter, no real work done, while
   agent_status genuinely (and honestly) reports 'idle' the whole time.
   Confirmed twice independently... Do not flip prefer back to agy-herdr
   until this is fixed and re-verified live."* The capability's own
   `prefer` field currently reads `"agy-cli"` (the plain `cli-spawn`
   executor), not `"agy-herdr"` — live routing already avoids
   `interactiveMode` for real work today, for exactly this reason.

**This invalidates the plan's core premise.** `plan.md`'s Approach section
(and the item's own original description) assumed
`herdrSpawnInteractiveAdapter`/`interactiveMode` is the clean, working
mechanism worth keeping as herdr-spawn's sole path, and that the
plain/liveOutput paths plus `live-renderers/*.mjs` are unused weight safe to
cut. Real, current evidence says the opposite on both counts: the
mechanism being kept is confirmed broken for real prompt delivery in
production, and the mechanisms being deleted are the ONLY ones with any
real, working config today (`agy-cli`, the plain `cli-spawn` adapter, is
what actually runs — not through `herdr-spawn` at all — but `claude-herdr`/
`pi-herdr`/`codex-herdr` remain real, dispatchable-by-name `herdr-spawn`
configs that this plan would break).

**Verdict for `fgos-coding-validating`'s reality gate: FAIL** (Repo
fit / Assumptions dimensions) — returning to `fgos-coding-planning`, which
should treat this as a material gap per its own Step 6 (the plan's
foundational premise is now contradicted by evidence, not just an
implementation detail) and hand off to `fgos-coding-exploring` for a human
decision on how to reconcile: fix `agy-herdr`'s interactiveMode bug first,
keep the plain/liveOutput paths alive for the three dormant executors,
narrow this item's scope, or something else this session should not guess
at alone.
