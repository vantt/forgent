---
id: ds-wfukp6t6mi
title: "Confined units compile the Rust workspace offline from a read-only cargo cache"
status: settled
source:
  - p-ymhj4xcf6x
created: 2026-11-27
---

discussion: settled

# Confined units compile the Rust workspace offline from a read-only cargo cache

## Hand-off to the planner

- **Outcome:**
  - A confined unit runs cargo for the workspace (compile and test) with no network credentials, and never hangs.
  - The confinement exposes the owner's cargo git and registry caches read-only. That is enough for the private `pkm` git dependency pinned in `Cargo.lock`.
  - Any fetch the confinement cannot satisfy fails fast with a named reason, instead of waiting on a credential prompt.
- **Where:**
  - The agent-confinement component: `docs/platform/agent-confinement/spec.md`, the bwrap driver `src/runner/dispatch/confinement/drivers/bwrap.mjs`, and `src/runner/dispatch/confinement/resources.mjs`.
  - The worker environment contract: `packages/run-supervisor/contracts/worker-env-allowlist.v1.json`.
  - Reuse the way the toolchain (`.rustup`) already reaches the confined home. Add no second path beside it.
- **Decided (owner, 2026-11-27, chat to lead:SUPERVISOR):**
  - This is a product mechanism, not a local workaround.
  - Priority P0.
- **Evidence (backlog p-ymhj4xcf6x):**
  - Since c7b66be3cf, the workspace depends on `git = "https://github.com/vantt/pkm"`, a private repository.
  - A confined unit's `CARGO_HOME` starts empty under `/tmp/fgos-confinement/<disp>/home`. Cargo runs `git-remote-https` with no credentials and waits forever.
  - On 2026-11-26/27, two units hung for 22-25 minutes. Since then, every cargo gate has gone through lead:SUPERVISOR by hand.
- **For the planner to settle inside the frame:**
  - A read-only bind of the cache, or a copy into the confined home. Either way, nothing writes into the owner's real cache.
  - The fail-fast settings, for example `GIT_TERMINAL_PROMPT=0`, plus cargo's offline mode when the cache holds the pinned revisions.
  - What a unit sees when a needed revision is missing from the cache: a named refusal.
  - One owning test at the confinement layer.
- **Non-goals:**
  - Giving units network credentials.
  - Changing the pkm dependency itself.
  - Vendoring the dependency into the repository.
