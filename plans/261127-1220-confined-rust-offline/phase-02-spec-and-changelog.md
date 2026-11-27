# Phase 2: spec and changelog

Capability: `code:implement`.

## Inputs

- `plan.md`: Outcome, "What was measured", "Decisions settled inside the frame".
- `docs/platform/agent-confinement/spec.md`: §9.3 (style and masks), the "Lịch sử quyết định" or
  current-settled-facts section (`## Current settled facts and deferred items`, §13.x), and §14 Pointers.
- `changelog.d/README.md` (fragment rules).

## Files this phase may write

- `docs/platform/agent-confinement/spec.md`
- `changelog.d/261127-1220-confined-rust-offline.md` (new)

## Steps

1. Add `### 9.4 Toolchain cache — cargo và rustup của chủ máy, chỉ đọc` after §9.3, in the spec's language.
   State the following:
   - The resolver adds resource `toolchain-cache` with no grant. It covers the cargo home (`$CARGO_HOME`
     absolute, else `<home>/.cargo`) and the rustup home (`$RUSTUP_HOME` absolute, else `<home>/.rustup`), each
     only when it exists and lies outside every machine-private and confinement root. Each is mounted with
     `--ro-bind` on its own path.
   - The variables are `CARGO_HOME`, `RUSTUP_HOME`, `CARGO_NET_OFFLINE=true` and `GIT_TERMINAL_PROMPT=0`.
   - Why: a private `HOME` left both empty. Rustup downloaded the toolchain, and cargo waited forever on the
     credential prompt of the private `pkm` git dependency. Two units hung 22-25 minutes on 2026-11-26/27.
   - The measured proof: an offline compile of `pkm-core` from the read-only cache in 8.9 s, and a 0.04 s
     refusal with an empty cache.
   - What a unit sees when a revision is missing: cargo's offline error naming the dependency, URL, revision
     and offline mode. The remedy is that someone unconfined runs `cargo fetch --locked` in the checkout. A
     unit cannot add a new crate on its own.
   - The Node twins do not carry this resource. Plan `261124-1853` deletes them.
2. Add one decision-history line where the spec keeps them: "2026-11-27, owner order (P0, product
   mechanism): confined units compile the workspace offline from the owner's read-only cargo/rustup cache; no
   credentials, no vendoring (ds-wfukp6t6mi, p-ymhj4xcf6x)".
3. Add a §14 pointer: `packages/execution/engine/src/confinement/policy/resolver.rs`: the `toolchain-cache`
   resource.
4. Write the changelog fragment with one bullet: `- Fixed: a confined unit runs cargo on the workspace
   offline from the owner's read-only cargo and rustup caches; it no longer hangs on the private pkm git
   dependency, and a revision missing from the cache fails at once with cargo's offline error.`

## Verify

```bash
node scripts/plan-contract-check.mjs --plan plans/261127-1220-confined-rust-offline
grep -n "### 9.4" docs/platform/agent-confinement/spec.md
```

Pass: the check exits 0, and §9.4 exists between §9.3 and §11.

## Rollback

Revert the phase commit.
