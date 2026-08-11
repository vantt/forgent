# Wire herdr-plugin's discover pane launch to pass --autoClose

**Item:** tsk-358 (deps: tsk-3v2 done, tsk-2ja cleanup). Bug against
already-shipped work: `/fgOS:discover` has carried an opt-in `--autoClose`
flag since tsk-3v2, but herdr-plugin's own Rust launch code never passes
it, so `/fgOS:terminal-close` never actually fires from a herdr-triggered
discover session.

## Feature boundary

`herdr-plugin/src/pick.rs`'s `discover_run_argv` (and, through it, both
call sites that use it — `open_discover_pane` and `open_auto_discover_pane`)
gains ` --autoClose` on the `/fgOS:discover <id>` command it types into the
launched `claude` session, without changing `run_argv`/pick's own command
shape or the already-correct skill-level D2 close-gate
(`plugins/fgOS/skills/discover/SKILL.md:148-161`, unchanged).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `--autoClose` applies to BOTH herdr-plugin discover launch call sites: `open_discover_pane` (manual "Discover" button in the dashboard) and `open_auto_discover_pane` (tsk-2ja's unattended auto-launcher). Confirmed with the user directly (2026-08-11): manual-button sessions should also self-close on a real finish, same as the auto-launcher — no split behavior between the two. |

## Pinned terms

- **discover pane launch** — either of `open_discover_pane` (manual) or
  `open_auto_discover_pane` (tsk-2ja, auto), both routed through the same
  shared `discover_run_argv` builder in `herdr-plugin/src/pick.rs`.
- **`--autoClose`** — same opt-in token `/fgOS:discover`'s own `$ARGUMENTS`
  parser already recognizes (`plugins/fgOS/skills/discover/SKILL.md:37-52`,
  tsk-3v2 D1); this item only changes what herdr-plugin types into the
  pane, never the skill's own parsing/gate logic.

## Scout evidence

- `plugins/fgOS/skills/discover/SKILL.md:37-52` — `/fgOS:discover` already
  strips a trailing `--autoClose` token from `$ARGUMENTS`; absent, behavior
  is byte-identical to today. Confirms the fix is purely "type the extra
  token", nothing on the skill side needs touching.
- `plugins/fgOS/skills/discover/SKILL.md:148-161` — the D2 close-gate
  (only fires on an advance to `decompose` or a legitimate `awaiting-human`
  park, never on `blocked`/no-progress) is already exactly what the item
  asks to reuse as-is. No change needed here.
- `herdr-plugin/src/pick.rs:88-103` (`run_argv_for_command`) — shared
  builder behind `run_argv` (pick, pick.rs:111-113) and `discover_run_argv`
  (discover, pick.rs:117-119). Formats `claude '<slash_command> <id>'`
  inside a single-quoted argument — the flag must land inside that quote,
  so a plain post-hoc string append on the returned argv would not work;
  implementation needs an extra-args knob on the shared builder (or a
  small discover-only wrapper) so `run_argv`/pick stays byte-identical.
  Implementation-shape detail, left to planning/implementation.
- `herdr-plugin/src/pick.rs:177-190` (`open_discover_pane`, manual button)
  and `herdr-plugin/src/pick.rs:230-284`
  (`auto_discover_launch_argv_sequence`/`open_auto_discover_pane`, tsk-2ja)
  — confirmed via `rg 'discover_run_argv' herdr-plugin/src/pick.rs`: these
  are the ONLY two call sites. No third launch point exists.
- `herdr-plugin/src/pick.rs:441-503` — existing test module.
  `discover_run_argv_includes_skip_permissions_by_default` asserts the
  exact command string produced today; it will need its expected string
  updated to include ` --autoClose`, plus a new test asserting the flag's
  presence explicitly. Same `assert_eq!`-on-argv shape every test in this
  module already uses.
- `docs/history/fgos-terminal-close-autoclose/CONTEXT.md` (tsk-3v2, done)
  — D1 named these same two Rust functions as the launch points autoClose
  conceptually targets, but tsk-3v2's own verify explicitly forbade
  touching `herdr-plugin/src/` (`! git diff ... herdr-plugin/src/`) — this
  item is the deferred wiring, not a re-opening of tsk-3v2's own scope.
- `fgos tool query --capability impact-analysis --status present` →
  GitNexus `present`, freshly checked. `impact-analysis: full` —
  implementation must run `impact` on `discover_run_argv`/
  `open_discover_pane`/`open_auto_discover_pane` before editing, per
  CLAUDE.md's gate.
- No prior `judgeDiscovery` verdicts existed before this session's own
  round-trip (`view.discovery["tsk-358"]` was empty at clarify/discovery
  entry).

## Deferred to planning / out of scope

- Exact Rust shape for threading the extra argv token (a parameter on
  `run_argv_for_command`, a discover-only wrapper, a post-format string
  edit inside the quote) — implementation choice for `fgos-coding-planning`.
- `run_argv`/pick's own command shape — explicitly untouched; verify must
  prove it (`cargo test launch_agent_run_argv` unchanged pass).
- Extending autoClose to any OTHER launch mechanism (`/fgOS:pick` itself,
  `/fgOS:plan`, `/fgOS:retro-next`, `/fgOS:cleanup-next`) — out of
  scope, unrelated to this bug.

## Outstanding questions

None
