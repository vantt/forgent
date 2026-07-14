# S1 — cửa ghi cho proposed + reason + tier qua CLI (phase-2-routing-3)

## Before (characterized, red)

Manually probed the real CLI (`bin/fgos.mjs`) before touching code, in a scratch dir:

- `fgos add item1 ... --tier heavy` exits 0 but the flag is silently dropped —
  `bin/fgos.mjs`'s `add` verb never reads `flags.tier`, so the item's tier
  always comes from `replay.mjs`'s fold-time `DEFAULTS.tier` ("standard"),
  regardless of what `--tier` was given. An out-of-domain `--tier` value was
  not rejected either — it just had no effect at all.
- `fgos move item1 --to todo` (from `proposed`) fails with the FSM's own
  "reason is required" validation message — expected, since `fsm.mjs`
  already enforces D5's reason requirement from cells 1/2.
- `fgos move item1 --to todo --reason "test"` **also failed with the same
  error**, because `bin/fgos.mjs`'s `move` verb never parsed a `--reason`
  flag at all — there was no way to supply one through the CLI, so every
  `proposed -> todo` rejection was permanently unreachable through the door.

## Change

- `src/state/store.mjs`:
  - `addWork` now builds `item = { ...work, tier: work?.tier ?? DEFAULTS.tier }`
    before validating/appending, so every new `work.add` event carries
    `tier` explicitly in the log itself (not only injected later by
    `replay.mjs`'s fold) — matching the convention set by cells 1/2.
  - `moveWork` now accepts and forwards `reason` to `transitionWork`;
    `fsm.mjs` already had all the enforcement (require on
    `proposed -> todo`, ignore elsewhere) from cell 1 — this was purely a
    missing wire.
- `bin/fgos.mjs`:
  - `add` parses `--tier` via the existing `optionalField` helper (bare/empty
    → validation exit 4, same rule as other optional flags; omitted →
    `undefined`, defaulted by the store; out-of-domain value passed through
    untouched for `work.mjs`'s `validateWorkShape` to reject — no duplicate
    domain check added here).
  - `move` parses `--reason` the same way and forwards it to `moveWork`.
  - No new verbs added (frontier/ready stay out of scope, per S2).

## Verify

`npm test` (`node --test 'test/**/*.test.mjs'`): **116/116 pass** (102
baseline + 14 new in `test/cli/fgos.test.mjs`), 0 fail.

Full recorded verify (`npm test && node .claude/skills/distill/scripts/distill.mjs check`):
green — all 6 distill sources check out plus the full test suite.

New tests cover: `--tier` recorded in view and in the raw event payload,
default tier when omitted, out-of-domain and bare `--tier` rejected exit 4;
`doing -> proposed`, `proposed -> done`, `proposed -> todo` with/without/empty
`--reason` (exit 0 / 4 / 4), `proposed -> doing` forbidden (exit 2),
CAS conflict on `proposed -> done` (exit 3), `--reason` ignored (not in
payload) on a non-rejection edge, and `list` showing `tier` + `proposed`
through the real CLI. All tests use `mkdtemp` cwds; no `.fgos/` written in
the repo.

## Deviations

None from the cell's `must_haves`/`action`. Tier out-of-domain rejection
reuses `work.mjs`'s existing `validateWorkShape` check rather than
duplicating a second TIERS check in the CLI or store — same single-source
principle already established for `STATUSES`.

## Files changed

- `src/state/store.mjs`
- `bin/fgos.mjs`
- `test/cli/fgos.test.mjs`
