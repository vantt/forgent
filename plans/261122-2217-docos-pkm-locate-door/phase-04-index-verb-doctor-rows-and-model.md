# Phase 4: Index repair verb, doctor rows, model fetch, config key

## Context

AGENTS.md "Install/setup/doctor gate": a new runtime dependency gets a doctor row judged by its owning crate, a fix only
for a safe readiness repair; a new runtime state is reported and repaired through its own verb, with at most one
read-only pointer row. Facts F5, F9, F19; decisions 2, 7.

## Files it writes

`src/cli/command-registry.mjs` (entry `doc`, `index` sub-verbs), the three regenerated host contracts,
`apps/fgos/src/wiring/doc_locate.rs`, `apps/fgos/src/wiring/doctor/mod.rs`, `apps/fgos/src/wiring/doctor/documentation.rs`
(new), `apps/fgos/src/wiring/uninstall.rs`, `packages/distribution/contracts/doctor-registry.v1.json`,
`core/config-standard/docLocate.yaml` (new), `core/config-schema/docLocate.schema.yaml` (new), `apps/fgos/tests/doc_locate.rs`.

## Steps

1. `fgos doc index status [--wait <seconds>]` (state, worker running, indexed/pending/total, eta, action; `--wait`
   uses `Search::wait_ready`), `fgos doc index stop` (`search::stop_worker`), `fgos doc index reset`
   (`search::reset_worker`; answers `busy` when a worker runs).
2. Config: namespace `docLocate`, key `modelSource` (string: `huggingface` (default), an `https://` mirror root, or a
   local folder for offline installs, parsed by `install::model::ModelSource::parse`). Nothing else registers a default.
3. Doctor rows, owner `rust:documentation`, listed in `rows` and `inRust`:
   - `doc-locate-model`: `install::model::probe(machine_model_root, &E5_SMALL)`; `warning:` when missing or corrupt
     (locate still answers, partial), names `fgos doctor --fix`; detail lists missing and corrupt files.
   - `doc-locate-index`: pointer row; reads `search::probe` and the state; warns when not `ready` and names
     `fgos doc index status`; never fails; ≤ 250 ms.
4. Fix `doc-locate-model-fetch`: `install::model::ensure(root, &E5_SMALL, &source, None, &curl, progress)`; a missing
   `curl` is reported in the fix result. This is how `fgctl init` fetches the model (its `doctor --fix` tail).
5. Uninstall: if `fgos uninstall` removes `.fgos/runtime`, stop the doc-index worker first through the same stop call.
6. Replace the SIGTERM stop in `apps/fgos/tests/doc_locate.rs` with `fgos doc index stop` and assert `status` after it.

## Tests

Doctor adapter tests in `documentation.rs`: a temp model root that is empty (warn, missing listed) and one holding a
manifest file with wrong bytes (warn, corrupt listed). The test cannot produce the real model bytes without a download,
so the `ok` case is proven by the phase 6 run on the fetched model, and the phase result says so. The registry consistency check in `doctor/mod.rs` covers listing. Config tests cover the key.

## Validation

```sh
env -u CLAUDE_CODE_SESSION_ID cargo test -p fgos doctor::documentation
env -u CLAUDE_CODE_SESSION_ID cargo test -p fgos --test doc_locate
npm run fgos:dev -- doctor --json | jq '.rows[] | select(.id|startswith("doc-locate"))'
flock -o /home/vantt/projects/.doc-work/doc-heavy.lock npm run fgos:dev -- doctor --fix   # downloads once
npm run fgos:dev -- doctor --fix   # second run: model row ok, nothing fetched
```

## Risk

The model row hashes about 117 MB on every doctor run (pkm probe hashes every file): measure `elapsedMs`; if above
about 1 s, report it in the phase result for an owner call rather than weakening the check. A new key in tracked project
config before every active release knows it: do not set it in `.fgos/config.json` in this plan.

## Rollback

Revert; remove `docLocate` from any config first; the model folder is a cache.
