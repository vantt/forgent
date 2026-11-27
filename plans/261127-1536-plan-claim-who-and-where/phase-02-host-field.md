# Phase 2: Host on the plan record

Decisions D2 and D8 of
[ds-izibwo45vm](../discussions/ds-izibwo45vm-plan-claim-who-and-where/DISCUSSION.md).

## Inputs

- `packages/supervision/rust/src/portfolio.rs`: `Plan` (fields read by `read_plan`), `admitted_text` (writes
  `status`, `lead`, `base` through the YAML document door), `admission_hold`.
- `packages/identity/rust/src/machine.rs`: `valid_machine_id`, `read` (the machine id under the state root).
- `scripts/plan-contract-check.mjs` (frontmatter checks around the `lead`/`base` rules, `invokeHost` for host
  calls) and `test/scripts/plan-contract-check.test.mjs`.
- `core/skills/_shared/plan-contract.md` §2 (frontmatter table).
- `fgos identity machine --json` (local id) and `fgos identity list --project` (sessions other machines published,
  which carry their machine ids) for the "known to Identity" warning; `docs/platform/identity/spec.md` section 5
  (shared directory).

## Files it may write

`packages/supervision/rust/src/portfolio.rs`, `packages/supervision/rust/tests/portfolio.rs`,
`apps/fgos/src/wiring/supervision.rs` (the one caller of `admitted_text`), `scripts/plan-contract-check.mjs`, `test/scripts/plan-contract-check.test.mjs`,
`core/skills/_shared/plan-contract.md`.

## Steps

1. Add `host: Option<String>` to `Plan`. `read_plan` reads the `host` key; a value that fails
   `fgos_identity::machine::valid_machine_id` is a plan refusal with its own code, like a malformed `lead`.
2. Change `admitted_text(text, role, base)` to also take the machine id and write `host` in the same document edit
   as `status`, `lead` and `base`. Move its one caller, `HostAdmission::admit` in
   `apps/fgos/src/wiring/supervision.rs`, in the same commit: it reads this machine's id with
   `fgos_identity::machine::read` from the state root and refuses `machine-id-missing` when none was minted. Never
   read a hostname (D2).
3. Add a pure helper next to `admission_hold`, without wiring it into the wake: a pure
   `placement(plan, machine) -> Option<String>` that answers `held-other-machine:<host>` for a ready plan pinned
   elsewhere. Phase 3 wires it.
4. Contract check: accept `host` on any status. It is an error when the value is not a machine-id shape. It is a
   warning, never an error, when the id is neither the local machine id nor in the shared directory, or when the
   host cannot be asked. Mirror the rule in `plan-contract.md` §2 with one row.
5. Tests: `tests/portfolio.rs` covers read, refusal of a bad id, `admitted_text` writing all four keys in one edit
   with every other byte kept, and `placement`. `plan-contract-check.test.mjs` covers accept, shape error and the
   unknown-id warning.

## Verify

`cargo test -p fgos-supervision --test portfolio`, `cargo build -p fgos`, `node --test test/scripts/plan-contract-check.test.mjs` and
`node scripts/plan-contract-check.mjs --all` (no new errors).

## Rollback

Revert the phase commit; a `host` key in a plan file is then ignored again.
