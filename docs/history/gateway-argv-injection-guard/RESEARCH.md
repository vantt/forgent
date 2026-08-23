# Research — gateway argv flag injection (tsk-1ah)

## Round 1 — 2026-08-14

**Asked:** exactly which fields carry the injection risk, whether a single
general fix (a `--` end-of-flags sentinel in `parseArgs`) is safe to add
without a wider redesign, and what the smallest honest scope is.

**Checked:**
- `bin/fgos.mjs:355-375` (`parseArgs`) — confirmed: ANY argv element
  starting with `--`, at ANY position, becomes a flag key; no `--`
  sentinel exists. Also confirmed a SECOND, distinct injection surface the
  original finding's text didn't fully spell out: for `--flag value` pairs
  (e.g. `--text <value>`, `--reason <value>`), if `value` itself starts
  with `--`, the lookahead (`!next.startsWith('--')`) refuses to consume
  it as the flag's value — `flags[key] = true` (boolean) instead, and the
  would-be value is left to be re-parsed as ITS OWN element next loop
  iteration. So `--text --force` sets `text: true` and separately parses
  `--force` as another flag — the intended text value is silently lost,
  not just reinterpreted.
- Whether a `--` sentinel can safely fix both surfaces in one shot: NO,
  not cleanly. Standard POSIX `--` semantics are "everything after this
  point is positional, forever" — but this CLI's own real argv shapes put
  trusted trailing flags AFTER the untrusted value in several calls
  (`submit <text> --json`, `move <id> --to <status> --json`) — a
  rest-of-array sentinel would also swallow those trailing flags as
  positional, breaking them. A single-shot "next token only" sentinel
  would work but is a non-standard `parseArgs` behavior change touching
  the ONE shared parser every verb/skill/session in this repo calls —
  correctly redesigning and testing that against all existing callers is a
  materially larger, CLI-wide change than this gateway-only finding calls
  for.
- Field-by-field shape check, matching the original finding's own
  enumeration: `id` (fgOS ids match a fixed `tsk-<hash>`-shaped pattern,
  `--`-prefixed is never legitimate), `role`/`to`/`expect`/`status`/
  `stage` (closed enums, `--`-prefixed is never a legitimate value),
  `cursor` (an opaque pagination token this CLI itself mints — never
  `--`-prefixed in practice). `text` (submit/ask/answer) and `reason`
  (reject/move) are genuinely free text — a real submit description or
  rejection reason CAN legitimately start with `-` (e.g. "-1 is an invalid
  deadline"), so rejecting a leading `-` there would refuse legitimate
  input, and fixing them properly needs the larger `parseArgs` redesign
  above.
- Severity context already in the finding itself: "today's callers hold
  the per-machine token (≈ CLI-trust per D9)" — current risk for the
  free-text fields is already low; `tsk-54j`'s browser-mediated dashboard
  (the surface that raises this) is still in planning, not live.

**Found:** the smallest honest, complete fix for THIS item is rejecting a
leading `-` at the gateway for the enum/id-shaped fields the finding
itself names (`id`, `role`, `to`, `expect`, `status`, `stage`, `cursor`) —
correct with zero false positives (no legitimate value in any of these
fields ever starts with `-`), and closes the injection for every route and
every MCP bound function that carries one of these fields. Free-text
fields (`text`, `reason`) are out of scope — protecting them needs
`parseArgs` to learn `--flag=value` syntax or single-shot sentinel
semantics, a CLI-wide change outside a single-crate gateway fix's
proportionate scope, tracked as this item's own named scope boundary
rather than silently dropped.

**Still open:** none for the scoped fix.
