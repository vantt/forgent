# Head status line in the ak layout

## Outcome

The head status line now uses the ak layout and colors. The ctx and quota figures are unchanged, and the sidecar record is untouched.

## Before and after

| | Line | Columns |
|---|---|---|
| Before | `fgOS head · ctx 12% \| quota 7%` | 30 |
| After | `🤖 Opus - 12%  ⌛ 5h 20% (1h30m)  wk 7% (4d)  📁 ~/projects/forgentX` | 66 |

The model name is cyan. The percentage is green below 70, yellow from 70 and red from 85. The quota is green and turns red from 85. With `NO_COLOR` set, only the text remains. These are the ak colors and thresholds, with the same ANSI prefix and suffix. Per the owner's later requests the line is longer than before: it now also carries the 5h window, both reset countdowns and the folder. Without the 5h window, countdowns and folder it is `🤖 Opus - 12%  ⌛ wk 7%`, 25 columns. The folder comes last, so a narrow terminal cuts the path and keeps the figures.

## Simplifications

- The repeated words `ctx` and `quota` are gone. The `- ` after the model marks the context percentage and the hourglass marks the quota, as in ak.
- `quota` is shortened to `wk`, the weekly label ak uses. The source is the weekly window, so nothing is lost.
- The `·` and `|` separators became the two-space separator ak uses.
- There is no progress bar, as the owner asked, and no git segment.
- The model name replaces the fixed `fgOS head` label. The hook only runs in head sessions, so the label carried no information. It stays as the fallback when the payload has no model name.
- A missing figure is left out, as in ak.
- The 5h window and the reset countdowns (`1h30m`, `4d`, ak's own format) and the folder (home written as `~`) were added at the owner's request; the added columns are not a simplification.

## Unchanged

- The sidecar record, its fields and `measure.rs` are untouched. The text is built after the record is written.
- The hook still does nothing unless `FGOS_HEAD_ROLE` is set.
- The displayed numbers keep the `{:.0}` formatting.

## Proof

- The existing status-line test in `apps/fgos/src/wiring/session_rotation_hook.rs` now asserts the exact plain and colored output, the missing-figure case and the sidecar-failure suffix.
- `cargo test -p fgos` and `cargo test -p fgos-session-host` are green.
- Impact analysis found one production caller, `handle_status_line`. `detect_changes` reported low risk with no affected flows. GitNexus did not index the symbol, so the caller check was cross-checked with grep.

## Unresolved

- Landing on main is left to the release-landing route. The branch is pushed as `head-status-line-ak-layout`.
- `CHANGELOG.md` `[Unreleased]` has no line for this. The task limited edits to the hook and its test.
