# Phase 2: Host on the plan record

Decisions: D2, D7, D8. Capability: `code:implement`.

## Inputs

- The discussion, section 6 (placement, admission, two machines one plan).
- `packages/supervision/rust/src/portfolio.rs`: `Plan`, `read_plan`, `admitted_text`.
- `apps/fgos/src/wiring/supervision.rs`: `HostAdmission::admit`.
- `packages/identity/rust/src/machine.rs` (`read`, `valid_machine_id`); `docs/platform/identity/spec.md` section 5
  (shared directory) and the verbs `fgos identity machine --json` and `fgos identity list --machine <id>`.
- `scripts/plan-contract-check.mjs` (frontmatter checks next to the `lead` rule) and its test.
- Owning tests: `packages/supervision/rust/tests/portfolio.rs`, `apps/fgos/tests/supervision_verbs.rs`,
  `test/scripts/plan-contract-check.test.mjs`.

## Files it may write

`packages/supervision/rust/src/portfolio.rs`, `packages/supervision/rust/tests/portfolio.rs`,
`scripts/plan-contract-check.mjs`, `test/scripts/plan-contract-check.test.mjs`,
`apps/fgos/src/wiring/supervision.rs`, `apps/fgos/tests/supervision_verbs.rs`.

## Steps

1. `Plan` gains `host: Option<String>`, read from the `host` frontmatter key; a value that fails
   `valid_machine_id` is a read error with its own code, as a malformed `lead` is.
2. `admitted_text` takes the machine id and writes `status: running`, `lead`, `base` and `host` in the same edit.
   Every caller moves in the same change (L10); no second signature stays.
3. `HostAdmission::admit` reads M through `fgos_identity::machine::read` on the state root, never a hostname. A
   missing machine id refuses admission `machine-id-missing` and starts nothing.
4. `plan-contract-check.mjs`: `host` is optional; when present it must be a well-formed machine id (error
   otherwise); when it is well formed but is neither the local machine id nor a machine of the shared directory, the
   check warns that Identity does not know that machine. Read Identity through the `fgos identity` verbs, never by
   parsing state files; when Identity cannot be read the check warns once and goes on.
5. Two-clone race (D7) in `supervision_verbs.rs`: two clones of one bare remote with distinct machine ids both admit
   one `ready` plan with no `host`. Assert exactly one claim on origin, the loser's `plan.md` restored and its local
   main equal to origin, and the loser reading the plan as `running` with the winner's `host`. No lock is added; if
   the test fails, the fix goes in the existing rejection-undo or dirty-overlap path, and the phase report says which.

## Verify

`cargo test -p fgos-supervision --test portfolio`, `cargo test -p fgos --test supervision_verbs` and
`node --test test/scripts/plan-contract-check.test.mjs` pass; `node scripts/plan-contract-check.mjs --all` reports no
new error.

## Rollback

Revert the merge commit; plan files that already carry `host` are ignored by the old reader.
