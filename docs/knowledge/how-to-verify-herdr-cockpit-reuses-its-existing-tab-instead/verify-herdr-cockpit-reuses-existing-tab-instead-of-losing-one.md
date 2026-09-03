---
type: how-to
title: How to verify herdr cockpit reuses its existing tab instead of overwriting yours
tags: []
timestamp: 2026-07-31T01:23:28.338Z
source_capture_ids: [tsk-3i3]
framework: diataxis
mode: how-to
---
# How to verify herdr cockpit reuses its existing tab instead of overwriting yours

Use this after touching `herdr-plugin/src/main.rs`, `herdr-plugin/src/
layout.rs`, or `herdr-plugin/herdr-plugin.toml`'s `placement` value, to
confirm the cockpit dashboard still opens in its own tab and never steals
or relabels whatever tab the operator was already on.

## Why this needs checking

The bug this guards against, from the item's own locked scope
(`docs/history/herdr-cockpit-dashboard-own-tab/CONTEXT.md`):

> An overlay pane runs on top of whichever tab the operator currently has
> open — it is not given a new tab of its own. On startup, `main.rs:59-65`
> reads `HERDR_TAB_ID` (the tab the overlay is running inside — i.e. the
> operator's *current* tab) and calls
> `layout::ensure_cockpit_label(herdr_bin, tab_id)`. That function
> (`layout.rs:317-325`) unconditionally renames the tab to `"fg:cockpit"`
> if it isn't already labeled that — regardless of what the operator was
> using that tab for. This is the exact bug reported: opening the cockpit
> overlay steals and relabels the operator's current tab, so the tab they
> were on is functionally lost.

The fix changes `placement = "overlay"` to `placement = "tab"` in
`herdr-plugin.toml` so the plugin always gets a fresh dedicated tab, then
adds find-or-reuse logic so a second cockpit open focuses the existing
`fg:cockpit` tab and closes its own redundant new one, instead of leaving
two.

## Steps

1. **Static check** — confirm the rename/reuse logic didn't regress:

   ```
   grep -rn "cockpit" --include="*.ts" --include="*.tsx" packages/herdr* apps/herdr* 2>/dev/null | grep -i tab
   ```

2. **First open — new tab, operator's tab untouched.** Open a project,
   turn on cockpit for the first time. A new tab must appear; whatever tab
   was open before must stay exactly as it was (no rename, no content
   loss).

3. **Second open — reuse, not duplicate.** Turn cockpit on again for the
   same project. It must focus the existing `fg:cockpit` tab — no second
   cockpit tab opens, and the tab the operator was actively viewing at the
   moment of the second toggle is not lost.

4. **Full suite stays green:**

   ```
   cd herdr-plugin && cargo test
   ```

   None of the existing 9 `layout.rs` tests reference the changed
   function directly, so a regression there is a signal something else
   broke.

## What "reuse" means precisely

Per the item's locked identity rule (D3): a cockpit tab is identified by
an existing tab labeled `fg:cockpit` **within the project's own herdr
workspace** — never "whatever tab the caller happens to be on," and never
across workspaces. Opening cockpit when a `fg:cockpit` tab already exists
must focus that tab and close the redundant freshly-created one; it must
never create a second `fg:cockpit`-labeled tab and must never touch a
tab that isn't already `fg:cockpit`.

## Related

- `docs/history/herdr-cockpit-dashboard-own-tab/CONTEXT.md` and `plan.md`
  (`tsk-3i3`) — full locked-decision record, rejected alternatives (why
  overlay placement can't be patched from inside the plugin process
  instead), and the risk map for the reuse/dedupe logic.
