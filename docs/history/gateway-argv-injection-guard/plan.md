# Plan — gateway argv flag injection (tsk-1ah)

Mode: **small** (0-1 Mode-gate flags — arguably "public contracts" touches
since request validation behavior changes for several routes, but no
auth/authorization/data-model/audit-security/external-system/cross-
platform/multi-domain concern fires and no existing test covers
leading-dash input; scope spans ~20 small call sites across 2 files
though, more than a `tiny` one-liner).

## Approach

**Chosen path:** add a small validation helper (`reject_leading_dash`) in
`gateway.rs`, called at every REST route handler and MCP bound function
that accepts an id/enum-shaped field before that field is placed into the
argv vector `spawn_fgos_verb`/`call_verb` builds. A leading `-` returns a
clean `GatewayError::validation` (REST: 400) / Rhai tool error (MCP)
instead of silently being misread as a CLI flag downstream.

**Fields covered** (matching the finding's own enumeration, `RESEARCH.md`
round 1): `id` (every route/bound-fn taking one), `role` (`post_work_take`,
`take_work`), `to`/`expect` (`post_work_move`, `move_work`), `status`/
`stage`/`cursor` (`get_work`, `get_ready`, `list_work`, `ready_work`),
`item` (`post_sessions` — an item id).

**Scope boundary — free text NOT covered** (`RESEARCH.md` round 1): `text`
(submit/ask/answer) and `reason` (reject/move) are genuinely free text — a
real submit description or rejection reason can legitimately start with
`-`, so rejecting it would refuse legitimate input. Properly closing the
injection there needs `parseArgs` to learn `--flag=value` syntax or
single-shot `--` sentinel semantics — a CLI-wide change to `bin/fgos.mjs`
(the one parser every verb/skill/session calls), materially larger than a
single-crate gateway fix's proportionate scope for a medium-low finding.
Filing that as its own follow-up is a call for whoever finds it still
worth doing later, not manufactured here per YAGNI. Severity today stays
low for these fields regardless: current callers hold the per-machine
token (CLI-trust per D9), and the browser-mediated dashboard that would
raise it (`tsk-54j`) is still in planning.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `reject_leading_dash` helper | low — one pure string check, no I/O | unit test: rejects `-x`/`--x`, accepts `tsk-123`/`human`/empty string |
| ~20 call sites across `gateway.rs` (REST) and `mcp.rs` (MCP) | medium — breadth, easy to miss one field on one route | every field named above gets its own call-site edit, cross-checked against `RESEARCH.md`'s own enumeration before considering this item done; existing `gateway::tests`/`mcp::tests` (16 tests) all use ordinary non-dash ids/values, so the full suite passing is the regression check |
| Existing legitimate requests (ordinary ids, roles, statuses) | low — `reject_leading_dash` only ever rejects a leading `-`, which no legitimate value in these fields carries | full suite green with zero test changes needed for existing passing cases |

**Impact-analysis posture: degraded** (same GitNexus gap as prior gateway-
audit items; cross-checked via `RESEARCH.md`'s own direct read of every
route handler and MCP bound function).

## Files touched

- `herdr-plugin/src/gateway.rs`
- `herdr-plugin/src/mcp.rs`

No split — one honest piece touching two files (mechanically the same
one-line guard, repeated at each real call site), not two independently
workable pieces.

## Split decision

**No split.** `fgos graph --json`'s `criticalPath`/`topUnblock` do not
include `tsk-1ah` or any gateway-audit sibling; ordering follows the audit
report's severity ranking (Finding 5, medium-low, fifth in the queue).

## Outstanding questions

None
