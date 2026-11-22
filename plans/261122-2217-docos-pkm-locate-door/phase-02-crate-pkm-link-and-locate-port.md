# Phase 2: Crate, pkm link, locate port and adapter

## Context

The heavy link happens here, once. Decisions 1, 3, 4, 6 of [plan.md](plan.md); facts F1-F8, F11, F13, F23.
The crate knows nothing of fgOS layout: the composition root hands it every path (design principle 2).

## Files it writes

`packages/documentation/rust/` (new crate `fgos-documentation`: `Cargo.toml`, `src/lib.rs`, `src/port.rs`,
`src/locate.rs`, `src/profile.rs`, `src/pkm.rs`, `tests/locate.rs`, `tests/fixtures/vault/**`), `Cargo.toml`
(workspace member), `Cargo.lock`, `packages/execution/engine/Cargo.toml`, `test/architecture.test.mjs`.

## Steps

1. Lock first: add the member with `pkm-core = { git = "https://github.com/vantt/pkm", tag = "v0.7.0", features =
   ["search"] }`, `pkm-lifecycle` (same tag, `features = ["search"]`), dev-dependencies `pkm-cli` (same tag,
   `default-features = false`) and `pkm-core` with `test-embedder`. Change the engine to `rusqlite = { version =
   "0.41.1", default-features = false, features = ["bundled"] }`. Run `cargo update -p fgos-documentation` and resolve
   any exact-pin conflict (serde_json, libc, thiserror) by raising the workspace pin in this commit.
2. `port.rs`: `trait Locator { fn locate(&self, q: &Query) -> Result<Answer, LocateError>; fn state(&self) -> IndexState; }`
   and `trait WorkerLauncher { fn running(&self) -> bool; fn start(&self) -> io::Result<()>; }`. Types are fgOS's own
   (`Query { parts, area, question }`, `Answer { partial, state, action, parts: [Part { candidates, places }], group }`,
   `Candidate { rank, path, title, section, excerpt, axes, outside_region }`).
3. `locate.rs` (use case): validate 1-8 non-empty parts; ensure the worker (start only when `!running()` and the
   state is not `broken`); call the port; keep at most 10 candidates.
4. `pkm.rs` (adapter): `LocatePaths { docs_root, graph_db, search_db, model_dir, profile }`; `Session::open` with
   `SearchOptions { db, model_dir, worker: External, embedder }` and every path set; `Session::locate` with `explain:
   true`; map pkm JSON to `Answer` (prefix `docs/`, facets → `axes`, `region` → `outside_region` (`unplaced` is
   false), drop scores); derive `partial` from `Search::state()` and turn `pkm_not_ready` into an empty `Answer` with
   the state and action. Also `eval(cases)` over `Session::locate_eval`, stripping `docs/` from gold paths and adding it
   back in results. `probe()` over `search::probe`.
5. `profile.rs`: render the profile YAML from the docs root (decision 6); write it only when bytes differ, so pkm's
   profile digest does not churn.
6. Architecture test: next to the Execution-engine closure test, assert `pathDependencyClosure` of
   `packages/git/node-addon` and of `apps/fgctl` does not contain `packages/documentation/rust`.

## Tests

- `profile.rs` unit: a fixture docs tree with two area dirs (one without `spec.md`) renders exactly one area plus
  `platform`; spec/contract/decision/history paths get `current-truth`, `obligation`, `choice`, `past-state`
  (`target: false`); `writes: none` present.
- `tests/locate.rs` (real pkm, `EmbedderChoice::Fake` from pkm's test feature, fixture vault of ~8 notes): runs the
  worker in-thread through `search::run_worker` on a temp db, waits ready, then asserts the mapping above; a second case
  with no worker and no index asserts `partial: true`, zero candidates, state `starting`.
- Spawn decision unit test with an in-memory `WorkerLauncher`.

## Validation

```sh
flock -o /home/vantt/projects/.doc-work/doc-heavy.lock env -u CLAUDE_CODE_SESSION_ID cargo test -p fgos-documentation
env -u CLAUDE_CODE_SESSION_ID cargo test -p fgos-execution-engine credentials
cargo tree -p fgctl -e normal | grep -c pkm            # 0
node --test test/architecture.test.mjs
```

## Risk

Lock resolution conflict (plan risk table). The fake embedder must never reach production: only test code
constructs `EmbedderChoice::Fake`; production builds it from wiring (phase 3) with `Model`.

## Rollback

Revert the commit (crate, member, lock, engine rusqlite, test row together).
