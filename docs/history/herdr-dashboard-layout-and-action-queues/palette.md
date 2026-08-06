# herdr-plugin dashboard: ANSI-16 color palette

Locked for `tsk-jo1` (`CONTEXT.md`'s "tsk-jo1 — palette research" section,
`tsk-jo1 D1`: ANSI-16 named `ratatui::style::Color` only, no `Color::Rgb`).
Consumed by `tsk-64z` (Status column, Work Items panel) and `tsk-417`
(right-side box tags).

## Reference evidence

Real semantic ANSI-color convention pulled from `gitui`
(`src/ui/style.rs`, fetched directly, not from memory):

| gitui's real usage | Color | Semantic role |
|---|---|---|
| Diff deletions, danger/alert text | `Color::Red` | negative/blocking |
| Diff additions, commit author | `Color::Green` | positive/complete |
| Modified files, attention alerts | `Color::Yellow` | active/in-progress |
| Commit hashes, moved/tagged files | `Color::Magenta` | distinct secondary category |
| Commit timestamps | `Color::LightCyan` | informational/reflective |
| Disabled/inactive text | `Color::DarkGray` | low-priority/dimmed |

`bottom`'s `sample_configs/default_config.toml` confirms the same
direction structurally (`high_battery_colour` vs `low_battery_colour` as
distinct fields expecting a good/bad color split) but ships no default
hex/ANSI values in that file to cite directly — gitui is the concrete
source of the actual color identifiers used below.

`herdr-plugin/src/ui.rs`'s own existing usage (already ANSI-16, kept
as-is, not reassigned): `Color::Cyan` bold = focused-panel border
(`ui.rs:104`), `Color::Yellow` = in-process row (`ui.rs:155`),
`Color::Red` = poll error (`ui.rs:185`), `Color::Green` = pick-status
success (`ui.rs:187`).

## Right-side box tags (tsk-417, D3/D6)

| Tag | `ratatui::style::Color` | Bucket | Rationale |
|---|---|---|---|
| `[ERR]` | `Color::Red` | NEED ANSWER — `status: blocked` (`parkReason: system-error`) | Matches gitui's danger/alert mapping — a system fault blocking progress |
| `[ASK]` | `Color::Magenta` | NEED ANSWER — `status: awaiting-human` (`parkReason: human-question`) | Matches gitui's "distinct secondary category" mapping — a person-decision, not a bug, needs a visually different tag from `[ERR]` sharing the same box |
| `[MRG]` | `Color::Green` | MERGE LIST — `awaiting-approval`, ready to merge | Matches gitui's positive/complete mapping |
| `[RTR]` | `Color::Cyan` | AFTER DELIVER — `status: retrospective` | Matches gitui's informational/reflective mapping (`LightCyan` for timestamps) |
| `[POL]` | `Color::DarkGray` | AFTER DELIVER — `status: cleanup` | Matches gitui's disabled/dimmed mapping — lowest priority (AGENTS.md "Polish Sau DoD" tier 3) |

Section headers (`NEED ANSWER (2)`, `MERGE LIST (2)`, `AFTER DELIVER (1)`)
stay `Style::default().add_modifier(Modifier::BOLD)` with no color tint —
bold-only, so the tag color inside each row is what carries meaning, not
the group header (mirrors `ui.rs:111`'s existing `header_style`).

## Work Items Status column color-code (tsk-64z, D1, optional scan aid)

| `status` literal | Color | Reuses |
|---|---|---|
| `todo` | default (no color) | — |
| `doing` | `Color::Yellow` | existing `ui.rs:155` convention |
| `blocked` | `Color::Red` | same as `[ERR]` |
| `awaiting-human` | `Color::Magenta` | same as `[ASK]` |
| `awaiting-approval` | `Color::Green` | same as `[MRG]` |
| `delivered` / `retrospective` / `cleanup` / `done` | `Color::DarkGray` | same as `[POL]` — the whole tail chain reads as "past the point this panel needs to act on it"; `AFTER DELIVER`'s own box is where `retrospective`/`cleanup` get actionable `[RTR]`/`[POL]` distinction, not here |
| `wontfix` | `Color::DarkGray` | canceled, same low-emphasis treatment as the done-family |

Focused-panel border and row-selection highlight are unrelated to this
tag/status palette — both already exist (`ui.rs:104` `Color::Cyan` bold
border, `ui.rs:144`/`179` `Modifier::REVERSED` selection) and are not
reassigned by this doc.
