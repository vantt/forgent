# Phase 04: persona pool key in seat binding

Wave 2. Depends on 1. Capability `code:implement` (Rust, crate seat-binding). Effort 2d. Discussion task
`task-miu-start` (code part); decisions OD4, SD1; plan A1, A2, A3, A7.

## Context

Pools are chosen only by tier cells `model@pool` (RUL102); a persona has `tier` and `prefer`, no pool (F8,
`docs/platform/seat-binding/spec.md` section 6.2, `packages/seat-binding/rust/src/model.rs:222,276`,
`policy.rs:93`). An account pin cannot move a seat to another pool (`rank.rs:489-496`). Miu must lease from a pool no
pane can reach, so the persona gets one optional key.

## Requirements

- `core/config-schema/runner.schema.yaml` `$defs/taste`: optional `pool` (string, non-blank): "Account pool every seat
  of this persona leases from, for every family it walks; a pool no tier cell names is reachable only through it."
  Personas stay `x-fgos-scope: project-only`. No default in `core/config-standard` (absent = cell pool, today's
  behavior).
- Seat binding (`model.rs` scope type, `policy.rs` taste resolution, `rank.rs` candidate pool): when the resolved
  persona taste names a pool, every candidate's pool is that pool; account ordering, quarantine and refusal reasons
  are the existing ones (`pool-unusable` when the pool has no enabled account with a login store for the CLI,
  `rank.rs:874-925`). A role taste never sets `pool` (only `personas`); the schema allows it only under `personas` if
  the shared `$defs/taste` cannot be split cleanly, otherwise the role table rejects it by name.
- `explain` names the source of the pool (`personas.<name>.pool`) the way it names the tier source.
- Node needs no edit if phase 1 step 4 confirms `runner.personas` is sent whole; otherwise stop and raise.
- `docs/platform/seat-binding/spec.md`: section 6.2 gains the key; section 15 gains the decision entry with a D-ADR
  number minted by `fgos identity mint d-adr` at write time (never hand-numbered), citing p-mnymjukvqd and OD4.

## Proof (one owning proof: the seat-binding golden contract)

Extend `packages/seat-binding/contracts/seat-binding.golden.v1.json` (driven by `tests/golden.rs`), next to the persona
cases ("a persona key beats a role key ...") and the account cases ("a pool where every account is quarantined gives
no candidate for that entry"):

1. A persona with `pool: claude-miu` binds claude on pool `claude-miu` and leases its account; the same capability
   with no persona binds pool `claude` (AC2, AC3 at the lowest layer).
2. A pane seat (no persona pool) whose `claude` accounts are all quarantined walks to the next family of
   `tierFallback` and then refuses by name; no candidate or account of `claude-miu` appears in the walk (AC2, AC4).
3. A persona pool with every account quarantined refuses by name and never falls into pool `claude` (OD3).
4. A persona pool that does not exist refuses `pool-unusable`, never the cell pool.
5. A role table entry with `pool` is refused by the config door (or the schema), named.

Schema vocabulary: extend `test/runner/runner-schema-vocabulary.test.mjs` only if it enumerates `$defs/taste`
properties.

## Validation

`cargo test -p fgos-seat-binding` (crate name per `packages/seat-binding/rust/Cargo.toml`), clippy `-D warnings`,
`cargo check --target x86_64-pc-windows-msvc` and `aarch64-apple-darwin` (owner land gate), then
`cargo test --workspace` and `npm test` before landing. One cargo target per worktree, not on tmpfs.

## Risk

Medium: the bind is the one door for every seat. Cases 1-2 prove that a seat with no persona pool binds exactly as
before; the full golden file must stay green unchanged.
