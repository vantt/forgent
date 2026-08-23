# herdr-plugin dashboard: layout + action-queue redesign

Feature boundary for `tsk-1d5`. Started as a style/color chore on
`herdr-plugin/src/ui.rs`; locked scope during clarify grew it into a real
layout redesign — a left "browse all work" panel and a right "action
queues" panel, replacing today's 2-pane Work-items/In-process split.

## Locked decisions

| ID | Decision |
|---|---|
| D1 | Left panel = tabs `TODO` / `DOING` / `REVIEW` / `DONE`, filtered client-side over one `fgos triage --json --all` response (no new CLI call per tab). Columns, in order: `ID`, `Tier`, `Priority`, `Status`, `Blocked By`, `Blocks`, `Title`. |
| D2 | Left panel row order = `priority` field, **ascending** (smaller number = higher priority — `priority-formula.mjs`'s inverted scale). This replaces `rankImpact`'s own default order (tier → blocks desc → component size) for display purposes. |
| D3 | Right side = **3 separate bordered boxes**, never merged into one table: `NEED ANSWER` (status `blocked` ∪ `awaiting-human`), `MERGE LIST` (mirrors `fgos merge list --json`'s own `ready`/`waiting`/`conflicts` shape — no separately-invented filter), `AFTER DELIVER` (status `retrospective` ∪ `cleanup`). |
| D4 | Detail modal keeps exactly 2 fixed action buttons: **Pick**, **Discover**. `Discover` is disabled/dimmed (never hidden — no layout shift) when the selected item's `stage != clarify`. |
| D5 | Add real mouse support: `EnableMouseCapture`/`DisableMouseCapture` on terminal init/teardown, and `Event::Mouse` handling in `poll_event` (today it only matches `Event::Key`, `ui.rs:71` — mouse events are silently dropped). Button hit-testing needs each frame's rendered `Rect`s for Pick/Discover stored on `App`, since `draw()` is currently a pure render function with no persisted layout. |
| D6 | Stay on ratatui — do not migrate to frankentui. Visual/color reference comes from `beads_viewer`, `taskwarrior-tui`, `gitui`, `bottom` (all real ratatui-ecosystem apps, existence/maturity verified via `gh api`), not a framework swap. |
| D7 | `DONE` tab also includes `wontfix` (canceled) items, not just the `delivered`/`retrospective`/`cleanup`/`done` tail chain. |
| D8 | The `/` filter/search key applies to the **Work Items panel only** — it never filters the 3 right-side boxes. |
| D9 | Jump-to-pane (`Enter` → live herdr pane, today's `tsk-1eu` behavior) applies to `DOING`-tab rows. `NEED ANSWER` box rows open the detail view only — no direct pane jump, even though a `blocked`/`awaiting-human` item may still have a live pane. |

Each decision is also logged individually via `fgos decision --id tsk-1d5`
(seq 7517–7525; an earlier unscoped duplicate of D1 landed at seq 7516 —
harmless append-only noise, superseded by the scoped 7517 entry).

## Pinned terms

- **NEED ANSWER** = items whose `status` is `blocked` (`parkReason:
  system-error`) or `awaiting-human` (`parkReason: human-question`) —
  `src/state/workflow-stage-graphs.mjs`'s `parkReason` table for the
  `coding` domain.
- **MERGE LIST** = the exact result shape of `fgos merge list --json`
  (`ready`/`waiting`/`conflicts`/`mergeSets`/`blockedOnSync`/`mergeTier`/
  `supersededOut`) — not a separately-filtered view.
- **AFTER DELIVER** = items whose `status` is `retrospective` or
  `cleanup` — the two actionable steps of the tail chain
  (`delivered`→`retrospective`→`cleanup`→`done`) that has no
  `statusCategory` entry (workflow-stage-graphs.mjs's own comment: this
  4-status chain is "a shared, unrelabelable chain every domain uses
  verbatim").
- **priority** = `src/state/priority-formula.mjs`'s `computePriority`
  output (`impact × weight(urgency) / effort × risk-discount`, inverted so
  ascending sort = highest priority first), wired at `resolveDiscovery`/
  `resolveDecompose` — not a plain manually-set integer.

## Scout evidence

- `herdr-plugin/src/app.rs`, `herdr-plugin/src/ui.rs`,
  `herdr-plugin/src/fgos.rs` — current 2-pane implementation
  (`WorkItem`/`InProcessTask`, `parse_triage`/`parse_doing`,
  `RatatuiTerminalUi`). `parse_doing` (fgos.rs:116-132) currently keeps
  only `parkReason` absent/`natural-finish` AND `statusCategory`
  in-progress/review — i.e. only `doing` + `awaiting-approval`. It
  excludes `blocked`/`awaiting-human`/`retrospective`/`cleanup` entirely;
  those need new fetch/filter logic for `NEED ANSWER` and
  `AFTER DELIVER` (`fgos list --all --json`, filtered by literal
  `status`, since the tail chain has no `statusCategory`).
- `src/state/impact.mjs` (`rankImpact`) — confirms every left-panel column
  (`id`, `title`, `status`, `blocks`, `blockedBy`, `stage`, `goalTier`,
  `priority`) is already returned by `fgos triage --json --all`; no new
  server-side computation needed for D1.
- `docs/reference/triage-table-columns.md` — canonical column
  meaning/order reference for the same `rankImpact` output (predates the
  `priority` field, so it doesn't list it, but confirms `blocked-by`/
  `blocks` semantics: "what am I still waiting on" / "how many other
  things wait on me").
- `src/state/priority-formula.mjs`, callers in
  `src/intake/discovery.mjs:627` and `src/intake/plan.mjs:707` —
  confirms `priority` is a real computed, multi-signal score, not a flat
  field (this was directly checked against user's claim before locking
  D2, and confirmed correct).
- `src/state/workflow-stage-graphs.mjs` (`statusLabels`, `parkReason`
  tables, `coding` domain) — grounds the `NEED ANSWER`/`AFTER DELIVER`
  bucket definitions in real `status`/`parkReason`/`statusCategory`
  fields, not invented categories.
- Live check this session: `fgos merge list --json` (used earlier to
  verify tsk-48i/tsk-1hb were already merged) — confirms the exact JSON
  shape D3's `MERGE LIST` box maps onto.
- `herdr-plugin/src/ui.rs:71` (`poll_event`) — confirms mouse events are
  currently entirely unhandled (`let Event::Key(key) = event::read()?
  else { return Ok(None) };`), grounding D5 as new architecture, not a
  flag flip.
- External repos checked via `gh api` (existence/maturity, not code
  ported): `Dicklesworthstone/frankentui` (258 stars, single author, 6
  months old, pre-1.0, `license: NOASSERTION`) rejected for D6;
  `ratatui/awesome-ratatui`, `kdheepak/taskwarrior-tui`,
  `gitui-org/gitui`, `ClementTsang/bottom` confirmed real/active as visual
  references.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` → GitNexus
present (`kind: mcp`, `scanTarget: .gitnexus`). Posture: **full** — planning
and implementation should run real `impact()` calls before editing
`herdr-plugin` symbols, per this repo's own GitNexus gate in `AGENTS.md`.

## Deferred to planning (implementer's call, not product decisions)

- Exact key bindings for switching Work Items tabs and cycling focus
  between the left panel and the 3 right boxes (5 focusable regions total
  now, up from today's 2) — no product behavior hangs on which literal key,
  only on the D8/D9 behaviors already locked above.
- Column width/truncation strategy for the 7-column Work Items table on a
  narrow pane.
- The color table proposed during discussion (`[ERR]` red, `[ASK]`
  magenta, `[RUN]` yellow — matches existing `ui.rs:155` convention,
  `[MRG]` green, `[RTR]`/`[POL]` cyan/dim) is a reasonable default carried
  over from research, not a formally Socratic-locked decision — planning
  can adjust it without reopening clarify.
- Whether `NEED ANSWER`'s two sub-reasons (`system-error` vs
  `human-question`) need visually distinct tags/colors within the one box,
  or just distinct row text — D3 only locks that they share one box.

No outstanding questions blocked on a person — every material gray area
surfaced during clarify was answered in-session.

## tsk-jo1 — palette research (child of tsk-1d5, own clarify pass)

`tsk-jo1` locks the deferred color-table item above (root `CONTEXT.md`'s
own "Deferred to planning" section: "not a formally Socratic-locked
decision") into a real, cited palette before `tsk-64z`/`tsk-417` consume
it. Its own decision uses a separate `tsk-jo1 D1` label — do not confuse
with root `tsk-1d5`'s `D1`–`D9` above, a different item's own decision log.

| ID | Decision |
|---|---|
| tsk-jo1 D1 | Palette uses ANSI-16 named `ratatui::style::Color` variants only (`Cyan`/`Red`/`Green`/`Yellow`/`Magenta`/`DarkGray`/etc.) — no `Color::Rgb` truecolor. |

**Scout evidence:** `herdr-plugin/src/ui.rs:104,155,185,187` — every
existing color use in this codebase is a named ANSI variant
(`Color::Cyan`, `Color::Yellow`, `Color::Red`, `Color::Green`), never
`Color::Rgb`. No truecolor precedent to extend.

**Rationale:** portability — `Color::Rgb` truecolor is not guaranteed to
render correctly over every path this plugin runs on, including
`herdr --remote`'s SSH thin-client path (`docs/distillery/deep-dives/
how-to-use-herdr.md` §A3) where the terminal doing the actual rendering
may be further from the process than a direct local session. ANSI-16
degrades safely everywhere; truecolor does not.

**Impact-analysis posture:** degraded (same finding as root `tsk-1d5`'s
plan.md — GitNexus present but its `.gitnexus` index errors on `analyze`
with a corrupted FTS index). Not load-bearing here: this item edits no
code, only `palette.md`.

No outstanding questions for `tsk-jo1` — the only material gray area
(ANSI-16 vs RGB) was answered in-session.
