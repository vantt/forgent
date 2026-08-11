# herdr-plugin: literal-status vs statusCategory in-process pane filter

## Feature boundary

`herdr-plugin/src/fgos.rs` (`parse_doing`, lines 100-124) filters `fgos
list --all --json`'s `data.work` map on literal `item.status == "doing" ||
item.status == "awaiting-approval"` to build its "in-process" pane
(tsk-4vo D1/D2). This item (tsk-4ot) exists to decide whether that literal
match is a real risk worth fixing now, and if so, how — scoped strictly to
`herdr-plugin/src/fgos.rs` itself (D1 below).

## Locked decisions

| D-ID | Decision |
|---|---|
| D1 | Fix scope is Rust-only: `herdr-plugin/src/fgos.rs`. No change to `fgos list --json`'s public JSON contract (`bin/fgos.mjs`) as part of this item. |
| D2 | No dependency added to tsk-3w3. tsk-3w3's `parkReasonForStatus` proposal (logged under its own decision trail, not yet built — see Scout evidence) is explicitly deferred and scoped to an internal Node-side loop mechanism (`fgos-coding-driving`'s stop-condition check), not a public JSON field consumed by an external crate. tsk-4ot proceeds independently. |
| D3 | Given D1+D2 and the scout evidence below, no Rust-only code change can remove the literal-status dependency without regressing pane membership (blocked/awaiting-human would wrongly show as in-process). Resolution: keep the literal `status == "doing" \|\| status == "awaiting-approval"` match — it is provably correct today, since `coding` is the only domain and decision record 0027 D1 gives domains the *right*, never the *obligation*, to relabel their six front-segment statuses. Add a regression test in `fgos.rs` that pins this exact literal-match behavior, so the crate's own test suite fails loudly if a future change swaps to a bare `statusCategory` filter (the naive, incorrect "fix"). This is a real code change (test-only) within the Rust-only scope, not a silent no-op. |

## Pinned terms

- **"in-process pane"** — the herdr-plugin UI concept `parse_doing` builds:
  items whose `status` is `doing` or `awaiting-approval`, sorted by
  `doing_tier` (tsk-4vo D2).
- **statusCategory collapse** — `DOMAINS.coding.statusLabels`
  (`src/state/workflow-stage-graphs.mjs:159-166`) maps `doing`, `blocked`,
  and `awaiting-human` all to the same `statusCategory` value
  (`"in-progress"`). `awaiting-approval` maps to `"review"`, a distinct
  category. This means `statusCategory` alone cannot separate `doing` from
  `blocked`/`awaiting-human` — a filter written against category instead of
  literal status would regress by including blocked/awaiting-human items in
  the in-process pane.

## Scout evidence

- `herdr-plugin/src/fgos.rs:100-124` (`parse_doing`) — the exact filter in
  question, confirmed via direct read.
- `bin/fgos.mjs:1365-1379` — existing tracking comment in the `list` case,
  written at tsk-38t-4, documenting this exact external-consumer risk and
  explicitly scoping the Rust crate as out of that item's own reach ("Rust
  code outside this repo's own Node test/build surface is out of that
  item's scope").
- `src/state/work.mjs:96-134` (`STATUS_CATEGORIES` doc comment) and
  `src/state/workflow-stage-graphs.mjs:159-166`
  (`DOMAINS.coding.statusLabels`) — confirms the six front-segment statuses'
  category mapping; `doing`/`blocked`/`awaiting-human` all land in
  `"in-progress"`.
- Live `fgos list --all --json` sample confirmed the collapse in practice:
  `tsk-64s` (`status: doing`) → `statusCategory: in-progress`; `tsk-42i`
  (`status: blocked`) → `statusCategory: in-progress`; `tsk-5ui`
  (`status: awaiting-human`) → `statusCategory: in-progress`.
- `fgos list --id tsk-3w3 --json`'s decision log (append-only, `source:
  session`, timestamped shortly before this item was claimed) records a
  proposal for a domain-owned `parkReasonForStatus` map
  (`blocked→system-error`, `awaiting-human→human-question`,
  `awaiting-approval→natural-finish`) to solve the identical collapse
  problem for `fgos-coding-driving`'s own internal stop-condition check —
  explicitly marked "should not build yet" until a real second domain
  exists that actually relabels. Grepping `src/`, `bin/`, and
  `plugins/fgOS/skills/` for `parkReasonForStatus`/`parkReason` confirms it
  is not yet implemented anywhere in this checkout — proposal only, not
  available for tsk-4ot to depend on even if D2 had gone the other way.
- Impact-analysis posture (`fgos tool query --capability impact-analysis
  --status present`): GitNexus registered and `present`. Informational
  only per `fgos-coding-exploring`'s own rule — this crate (separate `Cargo.toml`,
  outside the indexed Node project's `npm test` surface per its own header
  comment in `bin/fgos.mjs`) is unlikely to be covered by the existing
  GitNexus index; not re-verified here since this skill performs no code
  changes.

## Outstanding questions deferred to planning

- None material. D3 already pins the concrete resolution (add a pinning
  regression test to `fgos.rs`'s existing `#[cfg(test)] mod tests` block,
  no production-code behavior change). Planning may still decide the exact
  test shape/name.
