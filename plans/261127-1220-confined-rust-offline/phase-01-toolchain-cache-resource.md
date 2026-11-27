# Phase 1: toolchain cache resource in the Rust resolver

Capability: `code:implement`.

## Inputs

- `plan.md`: "Where the change lives", "Decisions settled inside the frame" 1 to 6, and acceptance criteria 1 and 2.
- `packages/execution/engine/src/confinement/policy/resolver.rs`: `ResolveInput` (`:83`),
  `resolve_confinement_resources` (`:437`), the machine-private and `launch-program` block (`:680-720`), and the
  `mount` helper (`:123`).
- `packages/execution/engine/src/confinement/driver/bwrap.rs`: `resolve_input` (`:486`), which builds the
  resolver input from `self.env`; the env merge of `res.env` (`:1046-1080`); and `BOUND_BACK` (`:53`).
- `packages/execution/engine/tests/confinement_policy.rs`: the machine-private test (`:527`) for style.
- `packages/run-supervisor/contracts/worker-env-allowlist.v1.json`: the `FGOS_CONFINED` row for wording.
- `docs/platform/agent-confinement/spec.md` §9.3, for the masks the cache must stay outside of.

## Files this phase may write

- `packages/execution/engine/src/confinement/policy/resolver.rs`
- `packages/execution/engine/src/confinement/policy/mod.rs` (only if a re-export is needed)
- `packages/execution/engine/src/confinement/driver/bwrap.rs`
- `packages/execution/engine/tests/confinement_policy.rs`
- `packages/run-supervisor/contracts/worker-env-allowlist.v1.json`

## Steps

1. Add `cargo_home: Option<String>` and `rustup_home: Option<String>` to `ResolveInput`. They hold the host
   process values of `CARGO_HOME` and `RUSTUP_HOME`. In `bwrap.rs` `resolve_input`, fill them from `self.env`,
   the same port that already supplies `HOME` and `PATH`. Never read `std::env` in the resolver.
2. In `resolve_confinement_resources`, after the machine-private roots and `launch-program` bind-backs,
   resolve the two directories by decision 2 of the plan. That is the absolute env value, else `<home_dir>/.cargo`
   or `<home_dir>/.rustup`. Canonicalize with the existing real-path helper. Skip a directory that is missing,
   is not a directory, or lies inside any machine-private root or confinement root. Use the existing
   containment helper.
3. Push each surviving directory as `mount("toolchain-cache", "toolchain-cache:cargo" | "toolchain-cache:rustup",
   path, "none", "read")`, with `env`. On cargo set `CARGO_HOME=<path>`, `CARGO_NET_OFFLINE=true` and
   `GIT_TERMINAL_PROMPT=0`. On rustup set `RUSTUP_HOME=<path>`. Confirm that the driver materializes a `read`
   mount as `--ro-bind` *after* every writable mount, so a writable grant over a parent cannot make it writable.
   If the current order does not guarantee that, add `toolchain-cache` to the set that is materialized last,
   alongside the bound-back mounts. Do not add a branch keyed on the provider.
4. Make sure that no refusal written for granted resources (for example a check that every resource has a
   grant, or the machine-private refusals) refuses `toolchain-cache`. It is resolver-derived like
   `launch-program`.
5. Add the owning test
   `a_confined_launch_reads_the_owners_cargo_and_rustup_caches_read_only_and_runs_cargo_offline` to
   `confinement_policy.rs`, using a temp home. Cover: both directories present gives two read-only mounts on
   their real paths with the four variables. An absolute `cargo_home` wins over `<home>/.cargo`. A missing
   directory gives no resource. A cache directory inside a machine-private root (for example under
   `<home>/.fgos/private`) or a confinement root is not bound. Say in its doc comment why no existing test
   proves it: the resource is new.
6. Add rows `GIT_TERMINAL_PROMPT` and `CARGO_NET_OFFLINE` to `worker-env-allowlist.v1.json`. Give each the
   reason "set by the confinement driver with the owner's read-only toolchain cache: a confined cargo or git
   fails fast instead of waiting on the network or a credential prompt". Run any test that pins the allowlist
   (`rg -l worker-env-allowlist packages apps test`), and update it only if it lists the names.
7. Do not touch `src/runner/dispatch/confinement/**` or any golden vector.

## Verify

lead:SUPERVISOR job, because confined units cannot run cargo yet:

```bash
cargo test -p fgos-execution-engine --test confinement_policy --test confinement_driver
git diff --exit-code packages/execution/contracts
```

Pass: every test is green, the new test included, and the contracts diff is empty.

## Rollback

Revert the phase commit. No state or data is written by this change.
