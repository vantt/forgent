---
contract: plan-v1
title: "Confined units compile the Rust workspace offline from the owner's read-only cargo and rustup caches"
status: ready
priority: P0
blockedBy: []
footprint:
  - plans/261127-1220-confined-rust-offline/**
  - packages/execution/engine/src/confinement/policy/resolver.rs
  - packages/execution/engine/src/confinement/policy/mod.rs
  - packages/execution/engine/src/confinement/driver/bwrap.rs
  - packages/execution/engine/tests/confinement_policy.rs
  - packages/run-supervisor/contracts/worker-env-allowlist.v1.json
  - docs/platform/agent-confinement/spec.md
  - changelog.d/261127-1220-confined-rust-offline.md
base: 9077b11189eb9e0056db399809818d4e9c00cb04
source:
  - plans/discussions/ds-wfukp6t6mi-confined-rust-offline/DISCUSSION.md
  - p-ymhj4xcf6x
created: 2026-11-27
---

# Confined units compile the Rust workspace offline from the owner's read-only cargo and rustup caches

## Outcome

A confined unit runs cargo on the workspace (build, check and test) with no network credentials, and never
hangs. The confinement resolver hands every confined launch the owner's cargo home and rustup home as
read-only mounts and points `CARGO_HOME` and `RUSTUP_HOME` at them. The same launch gets
`CARGO_NET_OFFLINE=true` and `GIT_TERMINAL_PROMPT=0`. The private `pkm` git dependency pinned in `Cargo.lock`
resolves from the cache. If a revision is missing from the cache, cargo refuses at once and names the
dependency, its URL and revision, and offline mode. Nothing inside the sandbox can write into the owner's
cache.

### What was measured (2026-11-27, inside a confined session on fg-server2)

- A private `HOME` with no `RUSTUP_HOME` makes rustup itself start downloading the toolchain
  (`info: syncing channel updates for 1.99.0`), and the call hung past a 60 s timeout. So neither `.rustup` nor
  `.cargo` reaches a home-privatized unit today. The discussion assumed the toolchain already got there, and it
  does not: no code in the live driver (`rg -i rustup` over `src/` and `packages/execution/`) passes it on.
  A unit whose invocation keeps the real `HOME` (claude, which privatizes `CLAUDE_CONFIG_DIR` instead) sees
  the real `~/.cargo` read-only through `--ro-bind / /`. A unit with `homeEnv: HOME` (agy) sees an empty
  one. The two hung units are the second case, as backlog p-ymhj4xcf6x records.
- A private `HOME`, with `CARGO_HOME=/home/vantt/.cargo` and `RUSTUP_HOME=/home/vantt/.rustup` both read-only,
  `CARGO_NET_OFFLINE=true` and `GIT_TERMINAL_PROMPT=0`:
  `cargo fetch --locked` exits 0 in 0.1 s, and `cargo check -p fgos-agent-context-engine --locked` compiles
  `pkm-core v0.7.1 (…pkm?tag=v0.7.1#e4ff89bb)` and finishes in 8.9 s. A read-only cargo home is enough. Its
  `.package-cache` lock and `.global-cache` do not need writes.
- The same settings with an empty `CARGO_HOME` exit 101 in 0.04 s with
  `failed to get pkm-core … unable to update https://github.com/vantt/pkm?tag=v0.7.1#e4ff89bb … can't checkout
  from 'https://github.com/vantt/pkm': you are in the offline mode (--offline)`.

### Where the change lives (settled against the discussion's "Where")

The discussion names `src/runner/dispatch/confinement/drivers/bwrap.mjs` and `resources.mjs`. These are no
longer the live door. Nothing under `src/` or `bin/` imports them. Only tests and the golden recorders do. The
live driver and resolver are the Rust port: `packages/execution/engine/src/confinement/driver/bwrap.rs` and
`policy/resolver.rs`. The Rust transport round uses them. Draft plan `261124-1853-confinement-to-rust` already
ports the rest of the Node twins and deletes them. This plan therefore changes the Rust door only (L10: add
through the door, not beside it). It never adds the mechanism to a Node twin that is about to be deleted.

The discussion asks to "reuse the way the toolchain reaches the confined home". The closest existing way is the
`launch-program` resource. The resolver adds it with no policy grant, from host facts, as a read-only mount of
an existing path. A resource's `env` already reaches the launch env through the driver: `bwrap.rs` merges
`res.env`, the way the peer-sessions resource sets its socket base. The cache rides those two existing
mechanisms. It adds one resource name and no new kind of mechanism.

### Decisions settled inside the frame

1. **Read-only bind, not a copy.** The cache is mounted read-only on its own path. A per-dispatch copy would
   write the whole cache, which can be gigabytes, for every launch, to gain nothing over what the measurement
   above showed. The explicit `--ro-bind` (not just `--ro-bind / /`) keeps the cache read-only even under a
   writable grant whose path contains it.
2. **Which directories.** The cargo home is `$CARGO_HOME` of the host process when it is absolute, else
   `<home>/.cargo`. The rustup home is `$RUSTUP_HOME` when it is absolute, else `<home>/.rustup`. `<home>` is the
   host user's home (`home_dir` of the resolver input), never a private home. Each one is resolved only when it
   is an existing directory and lies neither inside a machine-private root nor inside a confinement root (§9.3).
   If it fails that test, there is no mount and no variable. A host without Rust gets nothing.
3. **Variables.** The resource that carries the cargo home sets `CARGO_HOME`, `CARGO_NET_OFFLINE=true` and
   `GIT_TERMINAL_PROMPT=0`. The rustup resource sets `RUSTUP_HOME`. They are tied to the resources, so a host or
   a golden vector without the directories keeps its argv and env byte for byte. The variables apply to every
   confined launch, whatever its `homeEnv`, because a real-`HOME` unit with an online cargo and a read-only cache
   would still try to fetch a missing revision.
4. **Missing revision.** The refusal is cargo's own offline error (measured above). It names the dependency, URL,
   revision and offline mode. fgOS adds no wrapper. The spec records the remedy: someone unconfined, usually the
   owner or lead:SUPERVISOR, runs `cargo fetch --locked` in the checkout to fill the cache. A unit that adds a new
   crate dependency therefore needs that fetch first. This follows from the discussion's non-goal of giving
   units no credentials and from "nothing writes into the owner's real cache".
5. **Allowlist contract.** `GIT_TERMINAL_PROMPT` and `CARGO_NET_OFFLINE` are added to
   `worker-env-allowlist.v1.json` with a reason saying that the confinement driver sets them with the toolchain
   cache. This follows the `FGOS_CONFINED` precedent: a variable every confined agent sees is a named part of
   the contract. `CARGO_HOME` and `RUSTUP_HOME` are already listed.
6. **One owning test** at the resolver, in `packages/execution/engine/tests/confinement_policy.rs` (next
   section). The driver's merge of `res.env` into the launch env is already proven by the peer-sessions case.
   The Node twins get no test and no change. Their golden vectors use fixed paths that do not exist, so they
   stay byte-identical.

## Acceptance criteria

1. `cargo test -p fgos-execution-engine --test confinement_policy --test confinement_driver` passes. It
   includes the new test `a_confined_launch_reads_the_owners_cargo_and_rustup_caches_read_only_and_runs_cargo_offline`.
   It also includes the vector tests unchanged, which shows that `packages/execution/contracts/confinement-*`
   did not move (`git diff --exit-code packages/execution/contracts`). This is a lead:SUPERVISOR job.
2. The new test proves four things. With both directories present under a temp home, the resolver returns two
   read-only `mount` resources on those exact paths, carrying the four variables above. With `$CARGO_HOME` set
   to an absolute path, that path wins over `<home>/.cargo`. A missing directory gives no resource and no
   variable. A directory inside a machine-private root or a confinement root is never bound.
3. `cargo test --workspace` and `npm test` pass on the integrated tree (lead:SUPERVISOR job).
4. Live check, after a release that contains the change is activated: a confined unit under an
   invocation with `homeEnv: HOME` runs
   `cargo test -p fgos-agent-context-engine --locked --no-run` in its worktree. It compiles `pkm-core`
   with no network prompt, and its launch argv carries `--ro-bind <real cargo home>` and
   `--ro-bind <real rustup home>`. Then a unit that runs the same command with an empty cache
   (`CARGO_HOME=$(mktemp -d)` inside the unit) exits non-zero within seconds with cargo's offline refusal
   naming `pkm-core`. Both outputs are recorded in `plans/261127-1220-confined-rust-offline/reports/`.
5. `docs/platform/agent-confinement/spec.md` has a new §9.4 stating the mechanism, the remedy for a missing
   revision, and the decision-history line. `node scripts/plan-contract-check.mjs --plan plans/261127-1220-confined-rust-offline` passes.

## Non-goals

- Giving units network credentials, or any fetch route for the private repository.
- Changing the `pkm` dependency, or vendoring it into the repository.
- Changing the Node twins `src/runner/dispatch/confinement/**`. They are test-only and plan `261124-1853`
  deletes them. That plan inherits this resource as part of the Rust door it already owns.
- A fgOS-side wrapper or doctor row for the missing-revision refusal. Cargo's own message names it.
- `CARGO_TARGET_DIR` or build-cache sharing between units.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Resolver resource `toolchain-cache`: the owner's cargo and rustup homes, read-only, with `CARGO_HOME`, `RUSTUP_HOME`, `CARGO_NET_OFFLINE`, `GIT_TERMINAL_PROMPT` | `agent-confinement` | A new resource name inside the existing resolver door, beside `launch-program`. No new component or decision kind. |
| Two names added to the worker env allowlist | `run-supervisor/worker-env-allowlist.v1` | An existing contract file gains two rows. Its shape does not change. |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Toolchain cache resource in the Rust resolver](phase-01-toolchain-cache-resource.md) | - | packages/execution/engine/src/confinement/policy/resolver.rs, packages/execution/engine/src/confinement/policy/mod.rs, packages/execution/engine/src/confinement/driver/bwrap.rs, packages/execution/engine/tests/confinement_policy.rs, packages/run-supervisor/contracts/worker-env-allowlist.v1.json | 1 | ready |
| 2 | [Spec and changelog](phase-02-spec-and-changelog.md) | - | docs/platform/agent-confinement/spec.md, changelog.d/261127-1220-confined-rust-offline.md | 1 | ready |
| 3 | [Integration and live proof](phase-03-integration-and-live-proof.md) | 1, 2 | plans/261127-1220-confined-rust-offline/reports/ | 2 | ready |

Footprint reading check: phases 1 and 2 share no path, and phase 3 writes only its reports directory. Every
cargo gate (phase 1's verify and phase 3's) runs as a lead:SUPERVISOR job, because confined units cannot run
cargo until this plan's release is active (backlog p-ymhj4xcf6x).

## Owner questions

None. Every open point of the discussion's frame is settled above from measurement.

## Risks and rollback

- **Cross-plan overlap with draft `261124-1853-confinement-to-rust`**, which owns
  `packages/execution/engine/src/confinement/**`. This plan is P0, small, and lands first. That plan rebases on
  it and keeps the resource when it moves the resolver. The lead tells its planner in one line when this plan
  lands.
- **Cache changed by the owner during a unit's build.** Cargo reads the cache under its own locks. A read-only
  reader sees either the old checkout or the new one. Proof point: the live check of criterion 4.
- **A unit needs a revision or crate the cache lacks.** It fails fast with cargo's named refusal (criterion 4),
  and the remedy is `cargo fetch --locked` run unconfined. This is the intended behaviour, not a regression.
- **Rollback:** revert the phase-1 commit. The resolver then emits no cache resource, and units go back to
  today's behaviour, where cargo gates run through lead:SUPERVISOR.
