# Phase 3: `fgos doc locate` verb, worker process, locate log

## Context

Facts F17, F18, F20, F24; decisions 2, 4, 5. Wired the way `fgos session read|type` is: a legacy verb with native
sub-verbs, served by a provider in the composition root.

## Files it writes

`src/cli/command-registry.mjs` (entry `doc`), `packages/host-runtime/contracts/command-manifest.json`,
`command-routes.json`, `command-route-annotations.json` (regenerated), `apps/fgos/Cargo.toml`,
`apps/fgos/src/routing.rs` (`PARTIAL_VERB_OPERATIONS`), `apps/fgos/src/main.rs` (descriptor + provider),
`apps/fgos/src/cli_projector.rs` (only if the provider needs a projection), `apps/fgos/src/wiring/mod.rs`,
`apps/fgos/src/wiring/doc_locate.rs` (new), `apps/fgos/src/wiring/observe_declarations.rs`,
`packages/documentation/rust/observe-kinds.json` (new), `packages/distribution/rust/src/store.rs`
(machine model root), `apps/fgos/tests/doc_locate.rs` (new).

## Steps

1. Registry `doc`: `native: ['index', 'locate']`; `subcommands.locate` flags `--draft` (repeatable),
   `--draft-file` (repeatable), `--area`, `--question`, `--json`, `--dir`; `subcommands.index` with sub-verb `run`
   (flags `--dir`) for now; keep the legacy parameters for the Node sub-verbs; turn `mutatesStore: true` into the shapes
   of the mutating legacy sub-verbs (reserve, register, mark-rendered, move-path, promote, demote, supersede, retire).
   Help text says the draft must be in the corpus language (English for fgOS) and that the writer reads the candidates;
   there is no verdict. Regenerate the contracts with the existing exporter.
2. `store.rs`: `machine_model_root()` beside `resolve_machine_release_store_root()`.
3. `wiring/doc_locate.rs`: build `LocatePaths` (docs root `<project>/docs`, `.fgos/runtime/doc-locate/graph.db`,
   `.../search/search.db`, `.../profile.yaml`, model root), the real `WorkerLauncher` over
   `fgos_process::mapped::spawn_detached` (argv: own exe, `doc index run --dir <root>`; log
   `.fgos/runtime/doc-locate/worker.log`; Unix only, elsewhere `start` returns an unsupported error that becomes the
   answer's action), and `index run`, which calls `pkm_core::search::run_worker` in the foreground and exits with its code.
4. Answer as the `fgos.v1` envelope; exit 0 for any answer including partial; validation exit 4 for bad input
   (no part, more than 8, unreadable file, unknown area or question value).
5. Log: declare kind `fgos.doc.locate` (subject `session`; attrs partial, state, area, question; measures duration ms,
   parts, candidates; detail: draft sha256 and top paths, cut to 2048 bytes) and write one record per call through
   `RecordDoor` (fail-open: a failed write never changes the answer). No draft text is stored.

## Tests

`apps/fgos/tests/doc_locate.rs`, one file, the CLI wiring proof: a temp project with `.fgos` and a small `docs/`
tree, no model. Call `fgos doc locate --draft "..." --json`; assert exit 0, `partial: true`, envelope keys; poll the
call until text candidates appear (worker started and indexed text without the model); assert
`fgos metrics query --kind fgos.doc.locate` counts the calls; stop the worker (pkm `stop_worker` through `index stop`
is phase 4, so here stop it with SIGTERM on the pid read from `writer.lock` holder facts, and replace that with `index
stop` in phase 4) and assert no process remains.

## Validation

```sh
node scripts/export-command-selectors.mjs     # through its npm script; contracts regenerate clean
flock -o /home/vantt/projects/.doc-work/doc-heavy.lock env -u CLAUDE_CODE_SESSION_ID cargo test -p fgos --test doc_locate
env -u CLAUDE_CODE_SESSION_ID node --test test/rust-host/command-routes.test.mjs
npm run fgos:dev -- doc locate --draft "A worktree with live uncommitted work must not be reclaimed." --json
```

## Risk

The `doc` route declares `store: require` for the whole verb: confirm a locate call opens no lifecycle trigger it
should not (read `invocation_doors.rs:297-360`). A worker left running by a failing test: the test stops it in a drop guard.

## Rollback

Revert the commit and regenerate contracts; `.fgos/runtime/doc-locate/` can be deleted.
