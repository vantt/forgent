# herdr-cockpit-dashboard-own-tab — locked decisions

Item: `tsk-3i3`. Source request (raw, untrusted per RUL45): "thêm 1 task con
của herdr plugin: kiểm tra: có vẻ màn hình cockpit bị mở và ghi đè lên một
tab hiện tại làm mất tab hiện tại. tôi muốn make sure là khi cockpit của 1
project bật lên thì nó sẽ mở một tab mới trong project đó. nếu cokcpit tab
đã có rồi thì thôi."

## Feature boundary

The fgOS dashboard herdr plugin (`herdr-plugin/`, id `fgos.dashboard`) is
declared `placement = "overlay"` in `herdr-plugin/herdr-plugin.toml`. An
overlay pane runs on top of whichever tab the operator currently has open —
it is not given a new tab of its own. On startup, `main.rs:59-65` reads
`HERDR_TAB_ID` (the tab the overlay is running inside — i.e. the operator's
*current* tab) and calls `layout::ensure_cockpit_label(herdr_bin, tab_id)`.
That function (`layout.rs:317-325`) unconditionally renames the tab to
`"fg:cockpit"` if it isn't already labeled that — regardless of what the
operator was using that tab for. This is the exact bug reported: opening
the cockpit overlay steals and relabels the operator's current tab, so the
tab they were on is functionally lost.

`scripts/herdr-cockpit.sh` (the separate bash/STR40 cockpit) has a related
but distinct bug — it always runs `herdr tab create --label
"fgos-cockpit"` with no existence check, so repeat runs produce duplicate
tabs rather than overwriting one. Confirmed **out of scope** for this item
(D1) — the reported symptom (tab overwritten/lost) only matches the
dashboard plugin's overlay+rename path, not the bash script's
duplicate-create path.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Scope is the dashboard herdr-plugin (Rust, `placement = "overlay"`) only — `main.rs:59-65` + `layout.rs:317-325` (`ensure_cockpit_label`). `scripts/herdr-cockpit.sh`'s own duplicate-tab-create bug is a separate, out-of-scope issue. |
| D2 | When a cockpit tab already exists for the project's herdr workspace, opening the cockpit focuses that existing tab. It never creates a second cockpit tab, and it never touches whatever tab the operator is currently viewing. |
| D3 | Cockpit-tab identity = an existing tab labeled `fg:cockpit` within the project's own herdr workspace (one herdr workspace = one project, a term already pinned elsewhere — `docs/history/herdr-cockpit-project-root/CONTEXT.md` D4). Identity is never "whatever tab the caller happens to be on" (today's bug), and never cross-workspace. |

## Pinned terms

- **cockpit tab** — the herdr tab, within a project's own herdr workspace,
  labeled `fg:cockpit`, that hosts the fgOS dashboard plugin.
- **operator's current tab** — whatever tab the operator was viewing
  immediately before invoking the cockpit; must never be relabeled or
  repurposed by cockpit startup (this is the tab D1's bug wrongly renames
  today).

## Scout evidence cited

- `herdr-plugin/herdr-plugin.toml` — `placement = "overlay"` for the
  `dashboard` pane.
- `herdr-plugin/src/main.rs:59-65` — reads `HERDR_TAB_ID`, calls
  `layout::ensure_cockpit_label` unconditionally when present.
- `herdr-plugin/src/layout.rs:317-325` (`ensure_cockpit_label`) —
  `tab get` then unconditional `tab rename <tab_id> fg:cockpit` whenever
  the current label isn't already `fg:cockpit`.
- `scripts/herdr-cockpit.sh:24-27` — always `herdr tab create --label
  "fgos-cockpit"`, no pre-check for an existing tab with that label
  (the separate, out-of-scope duplicate-tab bug, D1).
- `docs/history/herdr-cockpit-project-root/CONTEXT.md` D4 — "một herdr
  workspace = một project", reused here rather than re-locked (D3).

## Outstanding questions deferred to planning

- Mechanism for "open in own tab, or focus if it already exists" —
  whether the plugin itself calls `herdr tab create`/`herdr tab focus`
  before/instead of relying on `placement = "overlay"`, or whether
  `herdr-plugin.toml`'s `placement` value needs to change away from
  `"overlay"` entirely — is an implementation choice for `fgos-coding-planning`,
  not decided here.
- Exact `herdr` CLI calls/tests needed to implement D2/D3 (e.g. `tab list`
  --workspace filtering, focus vs. no-focus semantics) — planning's call.
