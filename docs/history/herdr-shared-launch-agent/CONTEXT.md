# herdr shared launch-agent function — decision record

Item: `tsk-1q3` — "Herdr plugin: chuc nang dung chung bat agent theo
task-id (nhan task-id, tu lo phan con lai: new pane, chay claude
--dangerously-skip-permissions, go prompt /fgOS:pick <task-id>, rename
pane theo convention, dang ky vao bang theo doi pane cua tsk-4zo)".

## Feature boundary

One shared "launch agent for task-id" function, callable both from a
manual dashboard action (click/keypress) and, later, an unbuilt
auto-dispatcher — given a task-id, it:

1. finds or creates the right `fg:agents-N` tab (the layout manager below)
   with a free slot;
2. opens a new pane there;
3. launches `claude` in it, `--dangerously-skip-permissions` by default
   (D1);
4. types `/fgOS:pick <task-id>` as the initial prompt.

Layout manager, bundled with this item: the dashboard's own tab is named
`fg:cockpit` (D2 — this item renames it, not an operator convention);
agent tabs are named `fg:agents-N` (1, 2, 3, …), each holding up to 4
panes in a 2×2 corner grid. Placing a new agent pane prefers the
lowest-numbered `fg:agents-N` tab with a free slot; when none has room, a
new `fg:agents-(N+1)` tab is created.

Explicitly **not** in this item's scope (D3): renaming the *new agent's
own pane* to the `taskid | fg.ssid:<v> | a.ssid:<v>` convention — that
already happens inside the spawned session itself, once it runs
`/fgOS:pick <task-id>` (the `/fgOS:pick` skill's own step 3 calls
`fgOS:terminal`'s rename). This function only has to place the pane in
the right tab/group; tsk-4zo's pane scan (already shipped) will pick it
up automatically once the rename lands, with no separate "registration"
call needed.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `--dangerously-skip-permissions` is the default for every agent this function launches (matches the item's own description), but an env/config escape hatch must exist so an operator can turn it off for a more cautious launch mode. Exact env var/config key name is `fgos-coding-planning`'s call. |
| D2 | This function (or the dashboard's own startup path) renames its own containing tab to `fg:cockpit` if it isn't already — an active responsibility of this item, not an assumed operator convention. No existing code sets any tab label today (`herdr-plugin.toml` only declares `placement = "overlay"`, no tab-naming logic anywhere). |
| D3 | Renaming the *new agent pane itself* to the locked pane-label convention is **not** this function's job — it is already delivered by `/fgOS:pick`'s own flow (`plugins/fgOS/skills/pick/SKILL.md` step 3, via `fgOS:terminal`'s rename) once the newly-launched session runs the typed `/fgOS:pick <task-id>` prompt. This function's own responsibility ends at correct tab/group placement; it never calls `herdr pane rename` itself, and never needs a separate "register with tsk-4zo" step — tsk-4zo's periodic scan (`herdr pane list`) already finds any correctly-labeled pane on its own. |

## Pinned terms

- **"fg:agents-N tab"** — a herdr tab, discovered/created by label match
  (`herdr tab list --workspace <id>`, filtering `label` for the
  `fg:agents-` prefix, parsing the trailing `N`), holding up to 4 agent
  panes in a 2×2 grid. Never confused with `fg:cockpit` (the dashboard's
  own tab, D2) or a task's own pane label convention (`taskid | fg.ssid |
  a.ssid`, D3 — an unrelated naming scheme for a different object).
- **"Shared function"** — one call path used identically by a manual
  dashboard action and a not-yet-built auto-dispatcher; the existing
  `pick.rs::open_pick_pane` (today's manual-only implementation, no
  skip-permissions flag, no tab-layout awareness) is the function this
  item extends into that shared shape — not a second, parallel function
  left alongside the old one. Exact code-level shape (extend in place vs.
  new module) is `fgos-coding-planning`'s call.

## Scout evidence

- `herdr tab --help` (real, run this session): `herdr tab list
  [--workspace <id>]`, `tab create [--workspace <id>] [--label TEXT]
  [--focus|--no-focus]`, `tab get <tab_id>`, `tab focus <tab_id>`, `tab
  rename <tab_id> <label>`, `tab close <tab_id>` — the real primitives
  this item's tab-discovery/creation/renaming needs.
- `herdr tab list --workspace wS` (real, captured live this session):
  ```
  {"id":"cli:tab:list","result":{"tabs":[
    {"label":"workers-3","pane_count":3,"tab_id":"wS:t8", ...},
    {"label":"2","pane_count":2,"tab_id":"wS:tD","focused":true, ...},
    {"label":"3","pane_count":2,"tab_id":"wS:tE", ...}
  ],"type":"tab_list"}}
  ```
  Confirms `label` and `pane_count` are both present per tab — exactly
  what "lowest-index `fg:agents-N` with a free slot" needs, no extra
  per-tab call required. None of this repo's own tabs are currently named
  `fg:cockpit`/`fg:agents-N` (confirms D2's gap is real, not hypothetical).
- `herdr-plugin/herdr-plugin.toml` — the dashboard's `[[panes]]` entry
  declares `placement = "overlay"` only; no tab id/label is set or
  tracked anywhere in the manifest or `herdr-plugin/src/`.
- `docs/distillery/deep-dives/how-to-use-herdr.md:459` — manifest
  `placement` values are `overlay (default) | popup | split | tab |
  zoomed`; `overlay` is a real tiled pane with a pane id (unlike `popup`,
  the session-modal placement with no pane id) — confirms the existing
  `HERDR_PANE_ID`-based `--current` resolution `pick.rs` already relies on
  keeps working for this item too.
- `herdr-plugin/src/pick.rs` (`open_pick_pane`, `split_argv`, `run_argv`) —
  today's manual-only pane-open path: `pane split --current --direction
  right --focus`, no `--dangerously-skip-permissions`, no tab targeting.
  The concrete baseline this item extends (D "Shared function" pinned
  term above).
- `plugins/fgOS/skills/pick/SKILL.md` step 3 — the existing rename
  mechanism (`fgOS:terminal`'s `rename.sh`) that already fires inside a
  newly-`/fgOS:pick`-launched session; cited directly by D3.
- `docs/history/herdr-dashboard-pane-tracking/CONTEXT.md` D1 — tsk-4zo's
  pane scan is read-only and pull-based (`herdr pane list --workspace
  <id>` on its own poll tick); there is no push/registration API to call
  into, confirming D3's "no separate registration step" half.

## Deferred (out of scope, noted not absorbed)

- Exact env var/config key name for D1's skip-permissions escape hatch —
  implementation detail, `fgos-coding-planning`'s call.
- Exact split-call sequence to produce a 2×2 corner grid from herdr's
  2-way `pane split --direction right|down` primitive — implementation
  detail for planning.
- Whether `pick.rs::open_pick_pane` is edited in place or a new function
  supersedes it and the old one is removed — implementation detail
  (pinned term above already settles that it must become one shared
  function either way).
- Auto-dispatcher itself (the second caller of this shared function) —
  a separate, not-yet-built item; this item only has to make the
  function callable from both places, not build the dispatcher.
