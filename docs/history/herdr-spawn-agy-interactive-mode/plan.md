# plan.md — tsk-10j: agy-herdr interactive-mode redesign

Mode: high-risk

Lane derivation (mechanical, `fgos-routing`'s Mode gate): counted flags —
external systems (real `herdr`+`agy` binaries, external process control via
typed `/exit`), public contracts (`herdrSpawnAdapter`'s existing `{status,
stdout, paneId}` return shape must stay byte-identical for every executor
that does NOT opt into this new mode), existing covered behavior
(`herdr-spawn-adapter.test.mjs`'s existing 25 tests must not regress),
weak proof around the area (external CLI UI/timing behavior — genuinely
fragile if `agy`'s own UI ever changes) = 4 flags → high-risk.

## Approach

**Impact-analysis posture: degraded** (same finding as tsk-5jl — GitNexus
`present` but its indexed `forgent`/`forgentX` entry is thousands of
commits behind HEAD; `mcp__gitnexus__list_repos` re-checked this round,
unchanged). Manual grep cross-check instead: `herdrSpawnAdapter`/
`'herdr-spawn'` is referenced only by `transport.mjs`'s own
`EXECUTOR_ADAPTERS` map and the two test files
(`herdr-spawn-adapter.test.mjs`, one assertion in `dispatch.test.mjs`) —
same contained blast radius tsk-5jl already established, re-confirmed
this round.

**Chosen path** (four ordered pieces):

1. **New config shape**: add optional `invocation.interactiveMode: {
   exitCommand: string }` (parallel sibling to the existing `liveOutput`
   field, same per-field validation style in `config.mjs`). Presence
   selects this entirely new code path in `herdrSpawnAdapter`; absence
   keeps every existing behavior (including the `liveOutput` path)
   byte-identical. The two fields are mutually exclusive in practice
   (interactiveMode's own live TUI already IS the visibility story — no
   renderer/tee/PIPESTATUS involved at all) but nothing enforces that at
   the schema level yet; documented as an assumption below, not
   mechanically validated (YAGNI — no real caller has tried to declare
   both yet).

2. **Adapter behavior when `interactiveMode` is present** (`transport.mjs`,
   inside `herdrSpawnAdapter`, after the existing `pane split`):
   - Skip the disposable script file ENTIRELY for this path — no
     `sh`/`bash` wrapper, no sentinel-on-first-run. Type the resolved
     `command`+`args` DIRECTLY into the pane via `herdr pane run <paneId>
     <quotedCmd>` (same POSIX-quoting helper already in the file), giving
     `agy` its real initial interactive turn with the rich TUI.
   - **Completion detection**: poll `herdr pane get <paneId>` (a single,
     targeted per-pane query — confirmed real via this item's own
     RESEARCH.md, cheaper than `pane list`'s full scan) on an interval
     (proposed: 500ms, configurable later if ever needed — no real caller
     needs a different interval yet, YAGNI) until the response's
     `agent_status === 'idle'`, or `timeoutMs` elapses (existing timeout
     authority pattern, unchanged: a JS-owned timer is the sole source of
     truth, matching the existing "no herdr --timeout flag" design
     decision already locked for the other path).
   - **Exit sequence**, once idle is observed: `herdr pane run <paneId>
     "<exitCommand>"` (e.g. `/exit`, POSIX-quoted the same way), THEN a
     SECOND `herdr pane run <paneId> "echo \"<sentinel>:$?\""` (the same
     runner-owned sentinel pattern the existing path already uses, minted
     fresh per dispatch) to capture the real process exit code the shell
     observes once `agy` has genuinely terminated. `wait-output --regex`
     against that sentinel (same mechanism, same anchoring discipline
     `(?m)^` already proven necessary) confirms the echo has landed before
     parsing it — this is the ONE place this design still needs a
     regex/text match, but only for a short, fixed, runner-owned string it
     mints itself, never for detecting "is the agent done" (that stays
     `agent_status`-driven, never text-driven, per this item's own
     RESEARCH.md finding of a real echo-pollution false positive with
     text-based detection).
   - Parse the real exit code from the sentinel (same regex/extraction
     code already in the file, reused). Strip the pane's own echoed
     `command`/`exitCommand` occurrences from the returned `stdout` (same
     "last occurrence before the sentinel" discipline the existing path
     already uses — now potentially TWO distinct echoed lines to account
     for: the original typed command AND the typed `exitCommand`; strip
     both, not just the first).
   - Close the pane (`herdr pane close`), resolve `{status, stdout,
     paneId}` — same shape as every other path, so `executeExecutorCli`/
     `cli.mjs`'s ladder needs zero changes downstream.

3. **Config wiring**: switch `executors.agy-herdr`'s invocation from `-p`
   to `-i` (drop `--print-timeout 30m`, which is a `-p`-only flag; add
   `interactiveMode: { exitCommand: "/exit" }`). Per this item's own
   established convention (tsk-2ii precedent), this `.fgos/config.json`
   edit CANNOT ride this item's own worker branch (ADR0020) — it ships as
   its own direct, single-parent commit on main, same as tsk-2ii's own
   `b32ec6fa`. This item's own branch carries only the code
   (`transport.mjs`/`config.mjs`) and tests; the config flip is a separate
   operator-action step at the end, exactly like tsk-2ii's own shape.

4. **Tests + required real live proof**: extend
   `test/runner/herdr-spawn-adapter.test.mjs` with mocked coverage for the
   new `interactiveMode` branch (a mock `herdr` script needs a `pane get`
   handler returning `working` then `idle` after N calls, plus handling
   for the typed `exitCommand` and the follow-up sentinel echo) — then the
   REQUIRED real proof: dispatch one real prompt through the
   (temporarily, locally-flipped for the test) `agy-herdr` config against
   the actually-installed `herdr`+`agy` binaries, confirm the rich TUI is
   what actually got typed (real transcript captured), confirm the pane
   genuinely auto-closes, confirm the real exit code/stdout come back
   correct — same bar tsk-5jl's own Requirement 5 already set.

**Alternatives rejected:**
- *Text-based idle detection* (grep the pane's own scrollback for a UI
  status-bar string like "? for shortcuts"): rejected with real evidence,
  not speculation — this item's own RESEARCH.md Round 1 reproduced a
  genuine false-positive (an echoed `[DONE]` token matched instantly while
  `agy` was still visibly generating). `agent_status` is a structural
  signal from herdr's own process-table inspection, immune to this class
  of bug by construction.
- *Asking the agent to self-exit via prompt instruction*: rejected with
  real evidence — live-tested, `agy` explicitly refuses/explains it cannot
  invoke a slash command from its own text output. Ruled out entirely,
  not just deprioritized.
- *Generalizing this to claude-herdr/pi-herdr immediately*: rejected —
  explicitly out of scope per the item's own submitted text; neither
  CLI's own interactive-mode flag, idle signal, or externally-typed-exit
  behavior has been verified yet. A future item's job, not this one's.

**Risk map:**

| Component | Risk | Proof point (validating/live) |
|---|---|---|
| `interactiveMode` config shape + validation | light | mocked config-load test (accepts the field, rejects malformed) |
| Adapter's poll-for-idle + two-step exit sequence | standard (new timing-sensitive control flow) | mocked test simulating working->idle transition across N `pane get` polls, proving the adapter waits correctly and doesn't resolve early |
| Two-line echo-stripping (typed command AND typed exitCommand) | standard (extends existing single-echo-strip logic) | mocked test with a realistic double-echo mock (reusing this file's own `createDoubleEchoMockHerdrScript` pattern) proving both are stripped, not just one |
| Real live dispatch against real herdr+agy | standard (external binary/timing behavior, not fully controllable) | REQUIRED real proof, per Shape below |
| `.fgos/config.json` flip (`-p`->`-i`, `interactiveMode`) | standard, but OUT OF THIS BRANCH's own diff (ADR0020) | separate direct main-checkout commit, verified there (npm test + real live dispatch), same shape as tsk-2ii |

## Shape

Phased (high-risk lane), each phase independently testable:

- **Phase 1** — `interactiveMode` config shape (validator in `config.mjs`,
  threaded through `resolveExecutorConfig`/`resolveExecutorCommand` the
  same way `liveOutput` already is) + a config-load unit test.
- **Phase 2** — adapter's new code path: direct pane-run (no script file),
  poll-for-idle via `herdr pane get`, two-step exit+sentinel sequence,
  double-echo-strip. Mocked tests for: idle-transition timing, timeout
  (agent never goes idle), exit-sequence failure (exitCommand typed but
  process doesn't actually die — observer-failure-must-never-masquerade
  discipline, same as the existing path), and the happy path end to end
  against a mock.
- **Phase 3** — `.fgos/config.json` flip for `executors.agy-herdr`
  (direct main-checkout commit, own verify, own real live proof — NOT
  part of this item's own branch diff).
- **Phase 4** — the REQUIRED real live proof against the real installed
  binaries (can run against a self-contained `writeRunnerConfigFixture`
  executor, same pattern tsk-5jl's own Requirement 5 test already
  established, so this item's own branch verify does not depend on
  Phase 3 having landed yet).

Cases worth proving (high-risk depth): empty/boundary — `agy` never
transitions to `idle` at all within `timeoutMs` (must timeout cleanly,
not hang); existing behavior that must not regress — every current
`herdr-spawn-adapter.test.mjs` test, unmodified, still green; partial
failure — `exitCommand` gets typed but the process survives anyway (e.g.
agy prompts for confirmation instead of exiting) — must reject
honestly, never silently report a stale/wrong exit code; concurrent
access — not applicable (fresh pane per dispatch, same hard constraint
C1 already proven).

## Assumptions

- `interactiveMode` and `liveOutput` are never declared together on the
  same invocation (not mechanically validated — pin as an assumption,
  not a hard error, since no real caller has tried it and inventing a
  cross-field validation rule for a case nobody has hit yet is scope
  creep past what this item needs).
- Polling `herdr pane get` every 500ms for the lifetime of a dispatch is
  an acceptable load on the herdr process — no real caller has reported
  this being a problem at the scale this repo dispatches at (a handful of
  concurrent panes, not hundreds); revisit only if it ever becomes one.

## Split decision

**No split.** One coherent, sequential piece (config shape -> adapter
behavior -> tests -> the separate, already-precedented config-flip
operator action). Verify stays this item's own single command below.

## Outstanding questions

None
