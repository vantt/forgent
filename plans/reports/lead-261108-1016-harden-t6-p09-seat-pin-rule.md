# HARDEN T6 seat pin rule (owner decision 71, 3a) - lead report

Status: branch `harden/t6-p09-seat-pin-rule` pushed, NOT landed: waiting on owner Q-1 (effect on `fgos run --account`).

## What changed
- `packages/seat-binding/rust/src/rank.rs`: the account pin applies only when the seat's first survivor (its choice before the pin) is served by the pinned pool. One condition: `survivors.first().is_some_and(pool == pin pool)` replaces `survivors.iter().any(...)`. Otherwise survivors stay unchanged and `account-pin-other-pool` is recorded (text now says "the first choice of this seat is not served by pool"). Inventory, disabled and login checks unchanged.
- Golden vectors: two new cases ("an account pin never moves a seat whose first choice is in another pool", "a lone seat whose first choice is in another pool is not pinned"); two existing login-store cases now name `prefer: [gemini]` so gemini is the first choice (they relied on the move).
- `test/runner/execution/account-pin.test.mjs`: retired "a pin selects the entries its pool serves, so it can move the seat to the family that pool belongs to" (owner: golden "an account pin never moves a seat whose first choice is in another pool"). The router-pool tests now use a `delta` family whose first cell entry is the router pool (fixture only); the old "selects the entry of the chosen family that the pool serves" test is rewritten as "first choice served by that pool is pinned" (the other-entry-of-same-family move is gone too, owned by the same golden vector).
- Spec: one bullet in `docs/platform/seat-binding/spec.md` section 8. CHANGELOG line.
- `bind.mjs` unchanged (`rg account-pin-other-pool src test`: bind.mjs:397 reads the skip as before, one Node assertion in account-pin.test.mjs).

## Red to green
`cargo test -p fgos-seat-binding --test golden`: 9 failures with the new vectors before the condition (both vectors, moved to the pool), green after. Two Node tests needed fixture changes, no assertion weakened.

## fgos run --account, before and after (real bind(), same fixture)
Capability `docs:write` prefers [alpha, beta]; accounts alpha/a1, beta/b1.
- `fgos run "<p>" --account beta/b1` (single seat)
  - Before: seat moved to beta, pinned `{pool: beta, id: b1}`, runs.
  - After: first choice alpha is not in pool beta, seat binds unpinned (`account-pin-other-pool`). `unit-run-start.mjs:187-190` finds no pinned seat and refuses before the unit run exists: "the pinned account applies to no seat of this unit (seat "producer": account "beta/b1" cannot be pinned: the first choice of this seat is not served by pool "beta")".
- `fgos run "<p>" --account beta/b1 --provider beta`: before and after both bind beta, pinned (provider preference puts beta first). This is the route the CHANGELOG names.
- Multi-seat (workflow start --account): seats whose first choice is in the pool are pinned, the others run unpinned as before, except that a seat is no longer moved to the pool's family.
- Wider than the plan stated: a seat whose first choice is another entry of the SAME family served by another pool (alpha-model vs alpha-via-router@router) is also no longer moved; the pin pool must be the pool of the first entry.

## Gate
- cargo test -p fgos-seat-binding green; clippy -D warnings clean; fmt clean; cargo check -p fgos-seat-binding -p fgos on x86_64-pc-windows-msvc and aarch64-apple-darwin pass (one existing warning in the fgos bin, not in touched code).
- Focused Node: account-pin, units-runner, unit-handoff-raise-door, run-verb, dispatch-execute-for-capability, account-rotation, bind, seat-binding-dry-bind, architecture, doc-health, citation-drift: 218 pass 0 fail. One-door scan 0 undeclared; census regenerated.
- Full `npm test` (no COOK HOLD active): pass 8549, fail 1 (known V7n addendum), 0 run-tests ERROR lines.
- Net size: Rust +5/-4, Node tests about -12 net, golden JSON +93 lines.

## Left for after Q-1
- `src/cli/command-registry.mjs:1570` and `:2403` help sentences (hot file, after P01 lands): `--account`: "It pins only a seat whose first choice that pool serves (it never moves a seat to another pool); pair it with --provider to make the pool's executor the first choice." `workflow start --account`: "A seat whose first choice another pool serves runs unpinned."
- Runner spec RUL106 "Pin" sentence (`docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`, outside this phase's file list) still says "selects the candidate of the chosen family whose pool matches": needs the same rule (DOC phase).
- Smoke on fg-server2 and rebase/census/baseline regeneration at landing.
