# Lead report: launch confinement `controls` becomes global-only

Source: `plans/reports/review-261109-0928-harden-cfg-confinement-project-settable.md` (HARDEN review, decision 76(f)).

## Change
- `core/config-schema/runner.schema.yaml`: `launchConfinement.controls` gets `x-fgos-scope: global-only` (existing mechanism, no Rust logic).
- Red-first proof: new `confinement-controls` case in `packages/config/rust/tests/golden_snapshot.rs` (project file refused with `config-key-out-of-scope` at the key's line; global file accepts). It failed before the schema line, passes after.
- `docs/platform/config/spec.md`: section 4 rule 4 lists `confinement.controls`; decision-history line (replaces the 2026-11-06 claim that `controls` stays `both`); last-reviewed date.
- `CHANGELOG.md`: one Unreleased line. `mutation-census.v1.json` regenerated (test file digest only).
- No shipped or local config uses the form (`core/`, repo `.fgos/config.*`, `~/.fgos/config.*`).
- `ownWorktree` unchanged: owner question stays open.

## Gate
- fgos-config cargo tests, clippy -D warnings, fmt: green except `registry_defaults` (mailbox doc line), which fails identically without this change.
- Node focused set (config-door, facade, registrations, checks, confinement-policies, architecture, doc-health, citation-drift): 207 pass. One-door scan: 0 undeclared, count unchanged.
- msvc/darwin checks skipped: only a Rust test file changed.
- Full suite at load average 60-100: 11 failures. Known red V7n addendum. Timeouts (fgos-return, loop, fgctl-upgrade) and several process-timing tests passed on rerun alone. Two still fail on rerun, and fail identically on the pre-change parent: `run-verify-pin` timeout test and `worktree-admin-multiprocess` 8-process test. Not caused by this change.
- Killed-by-timeout files left `fgos-loop-test-*` and `fgos-tp-*` temp dirs under the temp root (run-tests ERROR); not cleaned by hand.
