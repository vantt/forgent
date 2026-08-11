# autoClose option + /fgOS:terminal-close helper skill

**Item:** tsk-3v2 (parent tsk-19y). Prerequisite for herdr-orchestrator
(tsk-2xt) and for `fg:agents-N` staying usable once capped at
`MAX_AGENT_TABS = 2` (tsk-5lr) — an unattended orchestrator that never
closes its own panes fills both tabs permanently.

## Feature boundary

1. **`autoClose` option** on the fgOS skills that already launch into a
   fresh herdr pane. Opt-in per invocation (`autoClose=true`), never a new
   default — a live interactive session (like this one) must never have
   its own pane closed out from under it just because it happened to call
   one of these skills.
2. **New helper skill `/fgOS:terminal-close`.** When `autoClose=true` and
   the main verb's own outcome is an advance or an `awaiting-human` park,
   the calling skill invokes `/fgOS:terminal-close` to close its own
   current pane. Same herdr-only chrome contract `/fgOS:terminal` already
   has: never touches `.fgos/` state, never blocks the caller when herdr
   isn't present or the pane id can't be resolved.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `autoClose` ships only for the 2 pane-launch points that actually exist today: `/fgOS:pick` and `/fgOS:discover`, via `PaneOrchestrator::open_pick_pane`/`open_discover_pane` (`herdr-plugin/src/pick.rs`, `herdr-plugin/src/ports.rs`). `/fgOS:plan`, `/fgOS:retro-next`, `/fgOS:cleanup-next` have no launch-into-pane mechanism at all yet — building one for them is out of scope here; their own `autoClose` wiring waits for whichever item first adds that mechanism. |
| D2 | `/fgOS:terminal-close` only fires when the driven item's outcome is an advance (stage/status moved forward) or a park at `awaiting-human`. On a genuine error stop — `blocked`, `lock-timeout`, `no-progress` (the categories `fgos-coding-driving` already distinguishes) — the pane stays open. Auto-closing on an error outcome would destroy the only evidence available to a person debugging an unattended orchestrator run. |

## Pinned terms

- **`autoClose`** — opt-in boolean parameter on a pane-launching fgOS
  skill invocation; default is unset/false (never auto-closes).
- **`/fgOS:terminal-close`** — new helper skill, sibling to the existing
  `/fgOS:terminal` (rename), closes the session's own current herdr pane.

## Scout evidence

- `herdr-plugin/src/pick.rs:112-115` (`herdr_bin()`) — reads
  `HERDR_BIN_PATH`, falls back to `"herdr"`. This is the herdr-plugin
  TUI binary's own resolution, a different process/context than a Claude
  Code session invoking `/fgOS:terminal-close` — not the pattern this
  item's pane-close mechanism should copy.
- `plugins/fgOS/skills/terminal/SKILL.md` +
  `plugins/fgOS/skills/terminal/rename.sh` — the real precedent to copy.
  Guards on `HERDR_ENV=1`, `command -v herdr`, `HERDR_PANE_ID` non-empty;
  silent no-op exit 0 on any missing precondition; calls `herdr pane
  rename "$HERDR_PANE_ID" ...`. `/fgOS:terminal-close` is the same shape,
  calling `herdr pane close "$HERDR_PANE_ID"` instead (verb confirmed via
  `herdr pane --help`).
- `herdr-plugin/src/pick.rs:133-151`, `herdr-plugin/src/ports.rs:31-39`,
  `herdr-plugin/src/main.rs:154,194` — confirmed only `open_pick_pane`
  (launches `/fgOS:pick <id>`) and `open_discover_pane` (launches
  `/fgOS:discover <id>`) exist as real pane-launch mechanisms. No
  `open_decompose_pane`/`open_retro_pane`/`open_cleanup_pane` anywhere in
  `pick.rs`/`ports.rs`/`main.rs`. Basis for D1.
- `fgos tool query --capability impact-analysis --status present` →
  GitNexus `present`. `impact-analysis: full` — planning/implementation
  should run `impact` before editing `open_pick_pane`/`open_discover_pane`/
  `PaneOrchestrator` per CLAUDE.md's gate.
- No prior `judgeDiscovery` verdicts recorded for this item
  (`view.discovery["tsk-3v2"]` was empty).

## Deferred to planning / out of scope

- Exact call-site shape for threading `autoClose` through `/fgOS:pick`/
  `/fgOS:discover` (a parameter, an env var, a flag file) — implementation
  choice.
- Whether `/fgOS:terminal-close`'s own no-op guard reuses `rename.sh`'s
  shell script directly or is a new script — implementation choice, should
  follow the existing precedent's shape closely regardless.
- Adding launch-into-pane mechanisms for `/fgOS:plan`/
  `/fgOS:retro-next`/`/fgOS:cleanup-next` — explicitly out of scope (D1),
  a separate future item.
