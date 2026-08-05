# herdr-plugin: expose parkReason, drop literal-status pane filter

## Scope note (post-lock)

tsk-48i itself was rescoped to Node-only (D1) after repeated discussion
with the discover-stage verify judge surfaced that a combined Node+Rust
claim was hard to verify cleanly in one step. D2/D3 below (the
`herdr-plugin/src/fgos.rs` consumer switch) are the followup item's scope,
not tsk-48i's — tsk-48i's own title/description were edited to state this
explicitly. D2/D3 stay recorded here since they're the same design, just
split across two items instead of one.

## Feature boundary

`herdr-plugin/src/fgos.rs`'s `parse_doing` filters `fgos list --all
--json`'s `data.work` map on literal `item.status == "doing" ||
item.status == "awaiting-approval"` to build its "in-process" pane
(tsk-4vo D1/D2). tsk-4ot (delivered) scoped a prior attempt at this same
risk to Rust-only and concluded no safe fix was possible then, because no
field existed that could distinguish `doing` from `blocked`/
`awaiting-human` without the literal strings (`statusCategory` collapses
all three into `"in-progress"`). Since then, `parkReasonForStatus`
(`src/state/workflow-stage-graphs.mjs:409`, built by tsk-3w3) landed on
`main` — a domain-owned table that makes exactly this distinction. This
item exposes that table through the public JSON contract and switches
`fgos.rs` to consume it, finally removing the literal-status dependency
tsk-4ot could only document and pin.

## Locked decisions

| D-ID | Decision |
|---|---|
| D1 | Expose `parkReasonForStatus`'s result as a new field, `parkReason`, on `fgos list --json`'s per-item output — stamped at write time (`addWork`/`moveWork`, `src/state/store.mjs`), mirroring `statusCategory`'s own existing pattern exactly (decision record 0027 D2/D3; `store.mjs:190-192`/`452-469`). Reuses the existing domain-agnostic table byte for byte rather than inventing a herdr-specific derived field — the same DRY precedent `statusCategory` itself already set, and keeps the field usable by any future external consumer that needs the same person-question/system-error/natural-finish/active distinction, not just herdr-plugin. |
| D2 | `herdr-plugin/src/fgos.rs`'s `parse_doing` switches its filter to: include a row when `parkReason` is absent (no park state — actively worked, the `doing`-equivalent case) OR `parkReason == "natural-finish"` (the `awaiting-approval`-equivalent case, tier 0 in `doing_tier`); exclude when `parkReason` is `"system-error"` or `"human-question"`. This is a domain-agnostic re-expression of the exact same membership `doing`/`awaiting-approval` vs `blocked`/`awaiting-human`/`todo` tsk-4ot already proved correct for `coding` today — the values change, not the semantics. |
| D3 | The literal `status` string match this replaces is dropped, not kept as a parallel fallback. Keeping both would leave the crate still silently dependent on the literal strings this item exists to remove — the exact fragility tsk-4ot documented and this item is chartered to actually fix, not merely duplicate defenses around. `status` itself may still be read (e.g. for display/sort — `doing_tier` already reads `stage`, unaffected), just no longer used for pane membership. |

## Pinned terms

- **`parkReason`** — the exact string set `parkReasonForStatus` already
  returns: `"system-error"` (blocked), `"human-question"`
  (awaiting-human), `"natural-finish"` (awaiting-approval), or absent
  (every other status, including `doing` — not a park state).
- **"in-process pane"** — unchanged from tsk-4ot's own definition: the set
  `parse_doing` returns, sorted by the existing `doing_tier`.

## Scout evidence

- `src/state/workflow-stage-graphs.mjs:398-411` (`parkReasonForStatus`) and
  `:192-196` (`DOMAINS.coding.parkReason`) — the table now exists on
  `main`, confirmed via direct read (it did not exist when tsk-4ot's
  CONTEXT.md was written — grep at that time returned zero matches
  repo-wide).
- `src/state/store.mjs:170-192` (`addWork`) and `:452-469` (`moveWork`) —
  the exact write-time-stamping pattern `statusCategory` already uses,
  confirmed as the mirror point for `parkReason`.
- `test/state/status-category.test.mjs` — existing precedent test file
  structure for a stamped-field feature of this shape; the natural sibling
  location for `parkReason`'s own tests.
- `herdr-plugin/src/fgos.rs:100-124` (`parse_doing`), `:24-33`
  (`WorkItemRaw`/`DoingRow`) — the exact structs/filter this item changes,
  confirmed via direct read.
- `docs/history/herdr-plugin-doing-status-literal-match/CONTEXT.md`
  (tsk-4ot, delivered) — the prior analysis this item supersedes; D1/D3
  there are the ones this item's D1-D3 reverse, with the new evidence
  (`parkReasonForStatus` now built) named as the reason, per the "verified
  decisions get reversed only on new evidence" rule.
- Impact-analysis posture (`fgos tool query --capability impact-analysis
  --status present`): GitNexus registered and `present`. This item touches
  a real public contract (`fgos list --json`) read by at least one
  external consumer (`herdr-plugin`) — full posture applies; planning
  should confirm blast radius on `bin/fgos.mjs`'s `list` case and
  `store.mjs`'s stamping functions before implementing.

## Outstanding questions deferred to planning

- Exact shape/placement of the new tests on both sides (Node:
  `parkReason` stamping; Rust: updated `parse_doing` fixture/assertions,
  and whether tsk-4ot's own `parse_doing_pins_literal_status_membership`
  test gets replaced or adapted in place) — implementation detail, not
  material to scope/behavior/acceptance.
