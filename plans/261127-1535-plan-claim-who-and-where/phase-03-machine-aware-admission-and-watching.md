# Phase 3: Machine-aware admission and watching

Decisions: D4, D8, D9. Capability: `code:implement`. Runs after phases 1 and 2 are merged.

## Inputs

- The discussion, section 6 (admission, watching, the three groups) and its flowchart.
- `packages/supervision/rust/src/portfolio.rs` `admission_hold` and `admissible`; `wake.rs` (the hold reasons next
  to `held-max-leads`); `supervisor.rs` `lead_counts` and the `leadUnnamed` view; `keeper.rs` (start and restart
  decisions); `apps/fgos/src/wiring/supervision.rs` (where `leadLive` and the machine id are read).
- `land.rs` `require_footprint_unchanged` (the frontmatter guard family) for step 4.
- Owning tests: `packages/supervision/rust/tests/wake.rs`, `tests/keeper.rs`, `tests/land.rs`,
  `apps/fgos/tests/supervision_verbs.rs`.

## Files it may write

`packages/supervision/rust/src/wake.rs`, `supervisor.rs`, `keeper.rs`, `portfolio.rs` and `land.rs`;
`packages/supervision/rust/tests/wake.rs`, `tests/keeper.rs` and `tests/land.rs`;
`apps/fgos/src/wiring/supervision.rs`, `apps/fgos/tests/supervision_verbs.rs`.

## Steps

1. Admission hold: a `ready` plan whose `host` is set and differs from M is held `held-other-machine:<host>`. M is
   passed in from the wiring (Identity), never read inside the crate from the OS. No config key is read (D9).
2. Running plans split into three groups in `supervisor plans` and the keeper: `host` equal to M (watched, a dead
   lead restarted as today); `host` another machine (shown as running elsewhere with that host, not counted in
   `leadsLive`, never started or restarted); no `host` (this machine's only while its lead is live here; otherwise
   held `host-unnamed` and raised once for judgement as `leadUnnamed` is, never restarted).
3. The wake span records the new hold reasons through its existing fields; no new event kind.
4. `land.rs`: a paths land that changes `host` of a plan whose status at the tip is `running` is refused
   `host-change-refused` and its commit undone, as `footprint-change-refused` is. The admission commit (tip status
   `ready`) passes. This applies to every paths land that touches `plans/*/plan.md`, not only lead lands.
5. Extend the owning tests: the hold on another machine's `ready` plan; the three running groups; a dead lead of a
   no-`host` running plan held `host-unnamed` and not restarted; the keeper never deciding a start for a plan running
   elsewhere; `host-change-refused`.

## Verify

`cargo test -p fgos-supervision --test wake --test keeper --test land` and
`cargo test -p fgos --test supervision_verbs` pass.

## Rollback

Revert the merge commit; plans held `host-unnamed` meanwhile return to the old restart rule.
