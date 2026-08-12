# herdr dashboard pane tracking — decision record

Item: `tsk-4zo` — "Herdr plugin: cấu trúc dữ liệu quản lý pane đang chạy và
pane liên quan task nào".

## Feature boundary

A data structure + live-detection loop for the herdr dashboard (built by
`tsk-19y`, refactored onto ports/adapters by `tsk-3t9-1`) that maps a
claimed fgOS task-id to its running herdr pane, so a later feature
(`tsk-1eu`) can "focus that pane" instead of opening a new one. Concretely:

- on dashboard startup and on every periodic poll, scan herdr panes in the
  dashboard's own workspace, parse each pane's label against the already-
  locked convention (`docs/history/fgos-terminal-pane-rename/CONTEXT.md`
  D4: `<taskid> | fg.ssid:<v> | a.ssid:<v>`, unresolved segments dropped),
  and extract the leading `<taskid>` segment;
- maintain a task-id → pane identity map from that scan;
- cross-reference against fgOS's own `status: doing` list (the existing
  `WorkItemSource` port from `tsk-3t9-1`): a `doing` task with no matching
  pane in the current scan is marked orphaned in this feature's own state
  — never by writing back to fgOS's `status` field.

Out of scope for this item (explicitly, per the decisions below and prior
session discussion): claude sessions running outside herdr entirely, and
any direct process management of `claude` bypassing herdr's own pane
lifecycle.

## Locked decisions

| ID | Decision |
|----|----------|
| D0a | A claude session running outside herdr (not launched via `/fgOS:pick`'s pane flow, no herdr pane at all) is out of scope for pane-tracking. fgOS's `status: doing` stays the sole authority for "task is in progress" — a session with no discoverable pane only loses the "jump to pane" convenience; the task list still shows the correct status from fgOS data, never a false state. |
| D0b | This item never manages, spawns, or kills `claude` processes directly, bypassing herdr. It only reads/tracks herdr's own pane state (read-only detection) — herdr stays the one pane/process orchestrator, never a second competing one. |
| D1 | Scan scope = the dashboard's own herdr workspace only (`herdr pane list --workspace <dashboard's own workspace id>`). The per-task-id record stores `{pane_id, tab_id}` — no `workspace_id` field, since every pane this scan can find already shares the dashboard's own workspace by construction. A task picked by hand into a different workspace has no "jump to pane" affordance (same graceful-degradation spirit as D0a); there is no known real case today that needs cross-workspace lookup. |
| D2 | A `doing` task whose pane is missing (orphaned) shows an explicit badge on its row in the dashboard's "In process" list (`ui.rs`'s `in_process` rendering) — e.g. `[pane missing] <id> — <title>` — and that row's jump-to-pane action is disabled rather than silently failing. |

## Pinned terms

- **"Pane identity"** — the `{pane_id, tab_id}` pair this item's scan
  resolves for a task-id (D1); never a `workspace_id` (out of scope by D1),
  never herdr's `agent_status` (D0a/D0b, inherited from STR40's D4 —
  `docs/history/herdr-fgos-tui-plugin/CONTEXT.md` D4).
- **"Orphaned"** — a `doing` fgOS task whose pane no longer appears in the
  most recent scan of the dashboard's own workspace (D1/D2). This is a
  display-only classification local to this plugin's own state; it never
  writes back to fgOS's `status` field.
- **Pane label convention** — already locked, not re-decided here:
  `<taskid> | fg.ssid:<value> | a.ssid:<value>`, joined by `" | "`, any
  segment whose value can't be resolved is dropped entirely (never
  rendered as `"unknown"`) — `docs/history/fgos-terminal-pane-rename/CONTEXT.md`
  D1/D4.

## Scout evidence

- `docs/distillery/deep-dives/how-to-use-herdr.md:94-104` — the real
  `herdr pane ...` CLI surface (`split`, `resize`, `swap`, `move`, `zoom`,
  `neighbor`, `edges`, `layout`, `report-agent`, `report-agent-session`,
  `release-agent`, `report-metadata`).
- `docs/.../reports/distill-bee-inventory-2026-07-28-group-c.md:81-82` —
  `herdr pane list --workspace <id>` (existing-pane check) and
  `herdr tab list --workspace <id>` (tab resolution), the real scan
  primitives this item's detection loop is built on.
- `herdr-plugin/src/pick.rs:53-58` (`split_argv`) — the dashboard's own
  pick action already opens new panes via `pane split --current`, which
  places the new pane in the caller's own workspace — the concrete,
  already-shipped behavior D1's "own workspace only" scope matches.
- `docs/history/fgos-terminal-pane-rename/CONTEXT.md` D1/D4 — the pane
  label's three-segment convention (`taskid | fg.ssid:<v> | a.ssid:<v>`,
  unresolved segments dropped), the format this item's scan must parse
  against.
- `docs/history/herdr-fgos-tui-plugin/CONTEXT.md` D4 (citing STR40 decision
  `d3dbe7f5`, a real production incident: "idle killed an agent") — the
  rule that herdr's own `agent_status`/process detection must never become
  a competing source of truth against fgOS's own `status` field. D0a/D0b
  above are this item's application of that same already-burned lesson.
- `herdr-plugin/src/ui.rs` (post-`tsk-3t9-1`) — the `in_process` list
  rendering this item's D2 badge extends; today it renders
  `"{id} — {title}"` in yellow with no orphan state at all.
- This session's own discussion (recorded verbatim in D0a/D0b's
  `--rationale`) — the user directly asked whether out-of-herdr claude
  sessions and direct claude process management should be in scope; both
  were explicitly declined before this item was even claimed.

## Deferred (out of scope, noted not absorbed)

- Poll cadence for the pane scan (reuse `tsk-3t9-1`'s existing 5s
  `POLL_INTERVAL` in one unified tick, vs. a separate interval) —
  performance-tuning, `fgos-coding-planning`'s/the implementer's call.
- Debounce/consecutive-miss threshold before flagging orphaned (vs.
  flagging on the very first miss) — implementation detail; the
  description's own "quét lại để cập nhật danh sách pane sống" framing
  already implies a simple fresh-recompute-each-poll design with no stated
  debounce requirement.
- Exact `TerminalUi`/`WorkItemSource`-style port shape for the pane-scan
  adapter (new port vs. extending an existing one) — `tsk-3t9`'s hexagonal
  seams are the pattern to follow, but the concrete trait shape is
  `fgos-coding-planning`'s call.
