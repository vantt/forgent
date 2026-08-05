# plan: herdr-plugin literal-status pinning test (tsk-4ot)

## Mode

Flags counted against the mode-gate list (auth, authorization, data model,
audit/security, external systems, public contracts, cross-platform,
existing covered behavior, weak proof around the area, multi-domain):

- **existing covered behavior** — `parse_doing` already has 3 tests
  (`parse_doing_excludes_done_items`,
  `sort_status_tier_ranks_awaiting_approval_first_then_stage_order`, plus
  `parse_triage_preserves_rank_impact_order` for the sibling function). This
  item adds a 4th, targeted at the specific literal-match risk.
- No other flag applies: no auth/authorization/data-model/audit-security
  surface, no external system touched (the test is pure in-process JSON
  parsing, no subprocess spawn), no public contract change (production code
  in `fgos.rs` is untouched per CONTEXT.md D1/D3 — only the test module
  grows), single platform (Rust crate, no cross-platform concern beyond
  what already exists), single domain.

1 flag → **mode: tiny**. One file (`herdr-plugin/src/fgos.rs`), one
test function added to the existing `#[cfg(test)] mod tests` block, no
production-code change.

## Approach

Per CONTEXT.md D3 (locked, not reopened here): no Rust-only code path can
safely swap `parse_doing`'s literal `status == "doing" || status ==
"awaiting-approval"` filter for a `statusCategory`-based one without
regressing (blocked/awaiting-human share the same `"in-progress"` category
as `doing` — `DOMAINS.coding.statusLabels`,
`src/state/workflow-stage-graphs.mjs:159-166`). The approach is therefore
purely additive: pin the current, provably-correct membership behavior with
a new test, so a future edit that naively switches to `statusCategory`
filtering fails this crate's own `cargo test` immediately instead of
silently breaking a Rust consumer no Node-side test can see.

**Alternative rejected**: changing `fgos.rs` to actually read
`statusCategory`. Rejected per CONTEXT.md D3 — proven to regress (blocked/
awaiting-human would wrongly appear as in-process), not merely
undesirable.

**Risk map**:

| Component | Risk | Proof point |
|---|---|---|
| `parse_doing` test coverage | low — additive test only, no behavior change | the new test itself: 5 fixture rows (`doing`, `awaiting-approval`, `blocked`, `awaiting-human`, `todo`), asserting the returned set is exactly `{doing, awaiting-approval}` |

Single file, single addition — no ordering dependency, so `fgos graph
--json`'s `criticalPath`/`topUnblock` fields carry no signal for a
one-piece tiny item (checked: item has 0 deps, blocks nothing else in the
graph today).

**Impact-analysis posture** (`fgos tool query --capability impact-analysis
--status present`): GitNexus registered and `present` for this Node
repo's own index. Not invoked as a proof point here — the change is
test-only, additive, confined to a separate Rust crate
(`herdr-plugin/`, own `Cargo.toml`, outside the indexed Node project's
`npm test` surface per `bin/fgos.mjs:1367-1369`'s own note) with a single
new function and zero call sites into it from anywhere else. Blast-radius
evidence would add no information a direct read of the file doesn't
already give.

## Shape (tiny — direct note)

Add one test function to `herdr-plugin/src/fgos.rs`'s existing
`#[cfg(test)] mod tests` block:

```rust
#[test]
fn parse_doing_pins_literal_status_membership() {
    // Fixture: one row per front-segment status, deliberately including
    // blocked/awaiting-human (same statusCategory as doing --
    // src/state/workflow-stage-graphs.mjs DOMAINS.coding.statusLabels)
    // to prove the boundary a statusCategory-only filter would blur.
}
```

Cases to assert (matching CONTEXT.md's pinned membership rule):

- `status: "doing"` → included
- `status: "awaiting-approval"` → included
- `status: "blocked"` → excluded
- `status: "awaiting-human"` → excluded
- `status: "todo"` → excluded

No split — one piece, already the smallest honest unit.

## Proof surface (item verify, unchanged from clarify)

```
grep -q 'fn parse_doing_pins_literal_status_membership' herdr-plugin/src/fgos.rs && cd herdr-plugin && cargo test fgos::tests::parse_doing_pins_literal_status_membership -- --exact | grep -q '1 passed'
```

## Assumptions

- None beyond what CONTEXT.md already locked. The test's exact fixture
  JSON shape is an implementation detail (not material — doesn't change
  scope/behavior/acceptance), left to execution.
