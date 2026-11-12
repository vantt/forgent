# fgctl fixes found by the first-contact docs phase

Branch `harden/pkg-fgctl-fixes`. Source: Findings 1, 2 and 4 of `lead-261112-1802-harden-pkg-p07-first-contact-docs.md`. Each was reproduced with a red test before the fix.

## Results

| # | Defect | Reproduced | Cause | Fix | Owning proof |
|---|--------|-----------|-------|-----|--------------|
| 1 | `fgctl repair` writes the pin with `releaseVersion: null` | yes (pin `v1.2.0` before, `null` after) | `repair_workspace` passed `release_tag: None` to the publish step, which writes the pin from that tag | `recorded_release_tag` in `init.rs`: the tag the committed pin names for the repaired digest (read through `read_tracked_pin`, no second reader), else the one the active activation's `pinSnapshot` names for it, else none | `init::tests::a_repaired_release_keeps_the_tag_the_pin_or_the_activation_already_names` (the rule), `closing-block.test.mjs` "repair keeps the release tag" (wiring) |
| 2 | `fgctl upgrade` to the active release prints a digest that is not the active one | yes (`sha256:31b2...` printed, active is `c16103815...`) | the line printed the digest of the release's `fgctl` file, not of the release | `FgctlRefresh::UpToDate { release }` carries `short_digest(artifact_digest)`, the same helper the closing block and `status` use | `fgctl_refresh::tests::matching_digests_write_nothing` (value), `closing-block.test.mjs` "an upgrade to the release that is already active" (wiring) |
| 3 | `fgctl --help` lists exit codes 0, 1, 2 only; `init` also exits 4 | yes (help had no 4, and no meaning for 2 on init and upgrade) | the help is static text, hand-written | rows added to the overview, `init` and `upgrade`; the numbers are tied to `packages/host-runtime/contracts/exit-codes.v1.json` by a test that reads the table file | `apps/fgctl/tests/cli_surface.rs` `help_names_the_exit_codes_the_table_gives_to_not_ready_and_an_unreadable_pin` |

Behaviour kept: a repair that rolls back to a release neither the pin nor the activation names writes a digest-only pin (no tag that can be fetched again), as before.

Docs: spec lines in `docs/platform/packaging-distribution/spec.md` (pin records the tag: repair clause; RUL110 up-to-date line; the `fgctl init` closing-block fact: exit 4 and the help tie). Three `[Unreleased]` CHANGELOG lines.

## Gates

fmt, clippy `-D warnings`, `cargo test -p fgctl -p fgos-distribution` green; `cargo check --all-targets` for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin` green (the Windows warnings listed are older ones in `shim.rs` and unused test helpers); focused node tests (`closing-block`, `fgctl-upgrade`, `fgctl-init*`, `install-sh`), architecture, doc-health green; citation-drift red only on the known document-identity lines; one-door scan 0 undeclared, census regenerated with `--write-census`. Full `npm test` result: see the landing line on the board.

## Concerns

- fgctl's usage-error exit is the constant 2 (`apps/fgctl/src/help.rs` `EXIT_USAGE`), while the exit-code table gives usage errors `validation` (4) and 2 to `precondition` ("not ready"). Exit 2 therefore means two things in fgctl; the help now says so. Moving usage errors to 4 would change a code that `cli_surface.rs` and scripts pin; left to the owner.
- The `fgctl` digest, not shown any more on the up-to-date line, still appears on the `replaced` line, where it is the digest of the installed file and is labelled as the release's `fgctl`.

## Authority

Exit-code numbers: one table (`exit-codes.v1.json`); the help text only repeats them and a test ties the repeats to the table. The pin tag has one reader (`read_tracked_pin`) and one writer (`publish_and_tail`); repair now only chooses the tag it passes.

## Lessons

- A focused `run-tests.mjs` does not build the release artifacts the rust-host node tests stage from; build them (`cargo build --release -p fgos -p fgctl -p fgos-node-addon`) before a red run, or the red is "binary missing", not the defect.
- Every edit to a Rust file under the one-door census needs `--write-census` before the commit hook accepts it; regenerate at each commit.
