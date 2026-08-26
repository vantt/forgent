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
