# Phase 09: Fuzz targets (parse, edit-then-reparse, merge), seeded from the golden fixtures

Depends on 03, 05, 06. Parallel with 07 and 08 (disjoint files). Suggested executor: sonnet.

## Context

Spec section 9: fuzz targets for parse, edit-then-re-parse and merge run as part of every parser upgrade, starting from the golden fixtures as seeds. Adoption was signed before this run (phase 04); a finding in the parser reopens that gate.

## Machine prerequisites (not shipped, not registered with setup/doctor)

`cargo-fuzz` needs a nightly toolchain and `cargo install cargo-fuzz --locked`. They are developer tools of this crate's upgrade procedure, like `cargo-deny` in CI, not an fgOS runtime dependency (setup/doctor gate answer: no new default, env var or infra dependency of the product). Install on the machine that runs the upgrade: `rustup toolchain install nightly --profile minimal`, then `cargo install cargo-fuzz --locked`. Confirm with the owner before installing if the machine is shared (network and disk). `free -g` first; fuzz jobs 1, `-rss_limit_mb=2048`.

## Files it may touch

`packages/yaml-doc/rust/fuzz/Cargo.toml` (own `[workspace]` table so the root workspace ignores it), `fuzz/fuzz_targets/parse.rs`, `edit_reparse.rs`, `merge.rs`, `fuzz/src/bin/seed.rs` (writes corpus files from the fixture JSON), `fuzz/README.md` (commands), `.gitignore` entries for `fuzz/corpus`, `fuzz/artifacts`, `fuzz/target`. No change to crate source except fixing a finding (separate commit).

## Targets

- `parse`: bytes then `parse` under each profile (first input byte selects the profile); asserts no panic, and that a successful parse round-trips `to_bytes() == input` with no edit.
- `edit_reparse`: bytes split into document and an op script (path from existing spans, operation, small value); apply; assert no panic, and either the refusal is named or the result re-parses to the intended value and every byte outside the splice is unchanged (the invariant the edit code already checks, here against arbitrary input).
- `merge`: structured input (`arbitrary` over small `Value` trees and rules); asserts no panic and that every leaf has an origin and the origin is a layer that holds the path.

Seeds: `seed.rs` writes each parse and edit fixture input (generators expanded up to 64 KiB) and each merge case as a corpus file.

## Steps

1. Create fuzz crate; `cargo +nightly fuzz build --jobs 4` (set `CARGO_BUILD_JOBS=4`).
2. Seed, then run each target `-max_total_time=600` (budget: 10 minutes each, 30 total) with `-timeout=10`.
3. A crash, hang or out-of-memory: minimize, add the minimized input as a new fixture in the owning fixture file (a separate commit that says which fixture group owns it), fix, re-run. The finding and the fix go in the upgrade record.
4. Record in `upgrade-record.md`: nightly version, cargo-fuzz version, execs, coverage points, any finding, and the owner's earlier sign-off line unchanged. If the finding is in the parser crate, stop and ask in the decision-question template (reopen the gate).

## Owning proofs

Fuzz is the permanent form of the generic "no panic, no hang on any input" property for parse, edit and merge. Fixed findings become fixtures in their owning groups (so they are proven in CI on stable); the stable-toolchain corpus test of phase 07 stays the fast regression.

## Validation

Targets build; each runs its budget with exit code 0 (read `$?` next statement); upgrade record updated.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Memory blowup on fuzz of alias expansion | M x M | `-rss_limit_mb=2048`; findings are real bugs (bound too high) |
| Nightly or cargo-fuzz unavailable offline | M x L | list as prerequisite; phase can wait without blocking 08 or 10's docs |
| Fuzz crate rots | M x L | idea I3 (CI build step), owner's choice |

## Rollback

Delete `fuzz/`; the crate and the stable corpus test remain.
