# herdr fgOS TUI plugin — decision record

Item: `tsk-19y` — "phát triển một herdr plugin để integrate fgos vào dùng với herdr".

## Feature boundary

A real, installable [herdr](https://herdr.dev) plugin (`herdr-plugin.toml` +
one executable/binary — per `upstreams/herdr/website/src/content/docs/plugins.mdx`,
vendored locally at `upstreams/herdr/`) that gives an fgOS operator a TUI
cockpit inside a herdr pane:

- a work-item list, sorted by impact toward milestone/mvp goals;
- a separate in-process (currently-claimed/`doing`) task list with status;
- one orchestration action, **pick**: selecting an item in the TUI opens a
  new herdr pane, launches `claude`, and auto-runs `/fgOS:pick <id>` in that
  new session — the same claim-and-route flow this very session ran
  manually (`fgos pick` → `EnterWorktree` → `fgos-routing`).

Explicitly out of scope for this item: merge/dispatch orchestration
(triggering `approve`/`merge` from the TUI) — deferred to a later item once
the dashboard + pick flow prove out.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Scope = dashboard TUI (impact-sorted work-item list + in-process/`doing` list) **plus** the `pick` orchestration action (open pane → launch `claude` → `/fgOS:pick <id>`). Merge/dispatch orchestration is deferred to a separate future item, not built here. |
| D2 | Ships independent/parallel to the existing STR40 bash cockpit (`scripts/herdr-cockpit.sh` + `scripts/herdr-cockpit-notify.mjs`, `docs/operator-runbook-herdr-cockpit.md`) — neither existing file changes. The operator ends up with both; this plugin is a new, separate pane/tool, not a replacement. |
| D3 | Distribution is internal-only: a `herdr plugin link` target living in this repo, for this project's own operator use. No marketplace publish, no external README/semver discipline. |
| D4 | "In-process task" list = fgOS items with `status: doing`, read via the fgOS CLI (`fgos list --json` / `fgos triage --json`) — **never** herdr's own `agent_status`. This is not a new call: it is the same hard rule STR40 already locked (decision `d3dbe7f5`) after a real production bug where herdr's own agent-detection became a second, competing source of truth ("idle killed an agent"). This plugin inherits that rule, does not re-decide it. |
| D5 | "Impact" sort = the fgOS backlog's existing `rankImpact` order (`src/state/impact.mjs`, exposed today by `fgos triage`): declared `goalTier` first (`mvp` then `milestone` then ungrouped), then blocking fan-out (`blocks`) descending, ties broken by ascending id. No new ranking scheme — this is pure consumption of a verb that already exists. |
| D6 | First deliverable is a **mock/static UI** — a rendered dashboard with fake/placeholder rows, proving only that the herdr-plugin plumbing works end to end (manifest, `herdr plugin link`, pane launch, rendering). Wiring real fgOS data (D4/D5's impact sort + in-process list) is explicitly a separate, later piece — not bundled into the first slice. (User steer, given mid-planning after the split was already shaped around real data from the start.) |

## Pinned terms

- **"Impact"** — `rankImpact`'s definition (D5 above), not a new metric.
- **"In-process task"** — an fgOS work item currently claimed (`status: doing`), sourced from the fgOS CLI (D4), not a herdr-level process/pane concept.
- **"Plugin"** — herdr's own meaning: a directory with `herdr-plugin.toml` + an executable command herdr launches (a `[[panes]]` entry for the dashboard, a `[[actions]]` entry for `pick`) — not an SDK integration, not a linked library.

## Scout evidence

- `src/state/impact.mjs` — `rankImpact(view, opts)`: goalTier tier-rank (mvp=0, milestone=1, none=2) then `blocks` descending then component size then id; already wired into `fgos triage` (`src/state/graph-harness.mjs:19,62`).
- `docs/operator-runbook-herdr-cockpit.md` + `scripts/herdr-cockpit.sh` + `scripts/herdr-cockpit-notify.mjs` — the existing STR40 cockpit: 4 bash-orchestrated herdr panes (runner-loop, tail-log, human-door, dashboard). The dashboard pane today is `formatStatusLine()` — one compact status-count line, not a full item list or TUI. Hard rule documented there: never read herdr's `agent_status` as a decision signal (decision `d3dbe7f5`, real production incident cited).
- `upstreams/herdr/website/src/content/docs/plugins.mdx` (vendored herdr source at `upstreams/herdr/`) — plugin anatomy: `herdr-plugin.toml` manifest declares `[[actions]]`, `[[events]]`, `[[panes]]`, `[[link_handlers]]`; a pane's `command` is any argv-launchable program; a plugin calls back into herdr via `HERDR_BIN_PATH` or the socket API. No native plugin UI SDK — "Runtime action registration and native non-terminal plugin UI are not part of plugin v1."
- Decision `0014-kien-truc-giao-tiep-nguoi-fgos.md` (STR46's locked interface decision) — only same-process Node code may link the fgOS core lib directly; every other consumer (including a separate-process TUI, regardless of implementation language) talks to fgOS only through the CLI. A herdr-plugin TUI binary is exactly such a consumer — it inherits this constraint, it does not renegotiate it.
- This very session's own `/fgOS:pick` flow (`plugins/fgOS/skills/pick/SKILL.md`) — claim → `EnterWorktree` → `fgos-routing` hand-off — is the flow the TUI's `pick` action (D1) re-triggers from a herdr pane instead of a person typing the slash command.

## Deferred (out of scope, noted not absorbed)

- Merge/dispatch orchestration from the TUI (D1) — a later item once dashboard + pick land.
- Plugin implementation language/TUI library choice (Rust + a candidate like `frankentui` vs. `ratatui` vs. any other) — an implementation decision, `fgos-coding-planning`'s call, not explored here.
- Exact herdr manifest shape (`[[panes]]`/`[[actions]]` field values, poll interval, pane placement) — implementation detail for planning.
