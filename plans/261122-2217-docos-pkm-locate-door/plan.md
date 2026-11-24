---
contract: plan-v1
title: "Documentation build step 1: locate through pkm (pkm-core v0.7.0 linked, static ONNX Runtime, index worker process, fgos doc locate, doctor rows, licences, recall measurement)"
description: "Link pkm-core v0.7.0 into the fgos host behind a locate port, run its index worker as a detached process, ship fgos doc locate with doctor rows and licences, and measure recall on the gold set."
status: draft
priority: P1
effort: 34h
branch: main
tags: [documentation, document-identity, pkm, locate, rust-host, doctor, packaging]
created: 2026-11-22
blockedBy: []
source:
  - p-hia45sd2zc
footprint:
  - plans/261122-2217-docos-pkm-locate-door/**
  - .cargo/config.toml
  - scripts/ort-static.mjs
  - .github/workflows/ort-static.yml
  - .github/workflows/ci.yml
  - .github/workflows/release-assets.yml
  - .github/workflows/release-assets-check.yml
  - Cargo.toml
  - Cargo.lock
  - packages/documentation/**
  - packages/execution/engine/Cargo.toml
  - apps/fgos/Cargo.toml
  - apps/fgos/src/routing.rs
  - apps/fgos/src/main.rs
  - apps/fgos/src/cli_projector.rs
  - apps/fgos/src/wiring/mod.rs
  - apps/fgos/src/wiring/doc_locate.rs
  - apps/fgos/src/wiring/observe_declarations.rs
  - apps/fgos/src/wiring/doctor/mod.rs
  - apps/fgos/src/wiring/doctor/documentation.rs
  - apps/fgos/src/wiring/uninstall.rs
  - apps/fgos/tests/doc_locate.rs
  - packages/distribution/rust/src/store.rs
  - packages/distribution/contracts/doctor-registry.v1.json
  - packages/host-runtime/contracts/command-manifest.json
  - packages/host-runtime/contracts/command-routes.json
  - packages/host-runtime/contracts/command-route-annotations.json
  - src/cli/command-registry.mjs
  - core/config-standard/docLocate.yaml
  - core/config-schema/docLocate.schema.yaml
  - package.json
  - test/architecture.test.mjs
  - test/cli/subcommand-flag-drift.test.mjs
  - test/setup/registrations.test.mjs
  - packages/config/rust/src/bundle.rs
  - packages/config/contracts/fixtures/repo-differences.v1.json
  - test/rust-host/release-tree.test.mjs
  - docs/platform/documentation/spec.md
  - docs/platform/documentation/subcomponents/document-identity/spec.md
  - docs/platform/documentation/subcomponents/document-identity/verification/recall/**
  - docs/platform/packaging-distribution/spec.md
  - docs/platform/packaging-distribution/contracts/repository-runtime-layout.md
  - docs/platform/packaging-distribution/contracts/setup-doctor-registry.md
  - docs/platform/component-boundary.md
  - CHANGELOG.md
---

# Documentation build step 1: locate through pkm

## Outcome

A writer (agent or person) runs `fgos doc locate` with a draft in the corpus language and gets the ten documents
most likely to already hold that claim: path, title, best section with its heading path, axis values, an
`outside-region` flag, and `partial: true` when the index or model is not ready. Every call leaves one log record.
pkm does the search inside the `fgos` binary; fgOS owns the verb, the port, the process and the readiness rows.
Recall is measured by one repeatable command on the committed gold set.

Authority: [documentation spec section 4 step 1](../../docs/platform/documentation/spec.md#4-build-order),
[document-identity spec](../../docs/platform/documentation/subcomponents/document-identity/spec.md) sections 8.1,
8.2, 14 and 15.

## Pin

pkm **v0.7.0** (tag commit `d488fe0`, 2026-11-22), not v0.5.0: changed by the coordinator during planning. No fgOS
code links pkm yet, so the move costs no migration. The breaking changes since v0.5.0 (reverse relation wording
`replaced_by`/`amended_by` and phrase lists in `mention_rels`; block targets below a unit `unit^block`,
`ended_parts`, unit blocks, rule R18; `implicit-replacement` at unit level; the schema vocabulary listing) touch
the schema, graph and audit surfaces. This plan uses none of them: it uses `SessionConfig`, `SearchOptions`,
`Session::locate`, `Session::locate_eval`, the `search` functions and `install::model`, whose signatures are the
same at v0.7.0 as at v0.5.0 (Facts F1 to F10 cite v0.7.0). The docs phase moves the pin in both specs, with a history line.

## Non-goals

- The writer's decision (`grow`, `ask`, `create`, `no-place`) in the locate log: step 2 (the retrospective writer)
  and the write door record it. Step 1 logs the call.
- The identifier boost (8.1 step 4): pkm defers it behind its own `locate eval` gate.
- The observer, admission, the write-door refusal.
- A `pkm` passthrough verb, `mcp install`, or any pkm CLI re-export.
- Dynamic ONNX Runtime, or a doctor row for `libonnxruntime` (owner decision 2026-11-22).
- Windows and macOS proof (see Platforms).

## Facts (verified 2026-11-22; pkm paths are in the v0.7.0 tree)

pkm source read at `scratchpad/pkm-v070` (`git clone --depth 1 --branch v0.7.0`, `d488fe0`).

| # | Fact | Evidence |
|---|---|---|
| F1 | Crates: `pkm-core` (feature `search` pulls `pkm-search`, `pkm-embed/ort`, `pkm-lang`), `pkm-lifecycle`, `pkm-cli`, `pkm-embed`. `search` is off by default | `crates/pkm-core/Cargo.toml:28` |
| F2 | `SessionConfig { vault, db, profile, search: SearchOptions, log, .. }`; `db: None` means `VAULT/.kg/graph.db` | `crates/pkm-core/src/service.rs:176` |
| F3 | `SearchOptions { enabled, db, model_dir, language, threads, worker, worker_idle, search_wait, max_note_bytes, embedder }`; `WorkerChoice::{Process, Thread, External}`, default `External` | `crates/pkm-core/src/search/options.rs:40,76` |
| F4 | `search::run_worker(vault, &opts, detach) -> u8` (0 idle/stopped, 75 another worker, 78 cannot run). It builds its guard from `Profile::find(vault, None)`, i.e. the vault's default profile, not one passed by the embedder | `crates/pkm-core/src/search/mod.rs:427-433` |
| F5 | `search::probe`, `stop_worker`, `reset_worker`, `Search::wait_ready` exist | `search/mod.rs:374,472,448,271` |
| F6 | `Session::locate(&Request)`, `Session::locate_eval(&cases)`; `Request { parts (max 8), region, top, explain }` | `service.rs:491,496`; `structure/locate.rs:30` |
| F7 | **pkm's locate drops `partial`**: the tool calls `run_search(..).map(\|r\| r.items)`, so the locate result never carries `partial` or `index_state`. fgOS derives `partial` from `Search::state()`. When no text index exists yet (`starting`) locate returns a `pkm_not_ready` error object. **Differs from spec 8.2** ("pkm answers from full text with `partial: true`") | `crates/pkm-core/src/tools.rs:1310`; `search/state.rs` |
| F8 | Locate returns **one** best section per candidate (`section`, a heading path) plus `excerpt`; facet values only when `explain: true`; `region` is `match`, `outside-region` or `unplaced` | `structure/locate.rs:362`, lines 450-480 |
| F9 | `pkm_lifecycle::install::model::{ensure, probe}` with `pkm_embed::model::E5_SMALL`; `ensure` downloads through `curl` on PATH (`install::fetch::curl`) and refuses a wrong sha256 | `crates/pkm-lifecycle/src/install/model.rs:140,167`; `install/fetch.rs:14`; `crates/pkm-embed/src/model.rs:42` |
| F10 | Licence export is `pkm_cli::third_party_json()` in **pkm-cli**, not pkm-core. The "Grant to fgOS" text is pkm's root `LICENSE`, not part of that JSON | `crates/pkm-cli/src/lib.rs:37`, `licenses_cmd.rs:20`; `LICENSE` |
| F11 | **WriteGuard blocks `.fgos/runtime` when the vault is the project root.** With `vault.writes: none`, any path inside the vault is refused; `Search::open_guarded` turns `broken` and `run_worker` exits 78 | `crates/pkm-core/src/writes.rs:64`; `search/mod.rs:206` |
| F12 | **ORT linking on Linux:** `ort =2.0.0-rc.15` with `download-binaries` links pyke's static ONNX Runtime 1.31, which needs glibc ≥ 2.38 at link and run time. The owner machine is Ubuntu 22.04 (glibc 2.35), and fgOS releases are built on `ubuntu-22.04` with a glibc ceiling of 2.35 | `crates/pkm-embed/Cargo.toml:14`; pkm `docs/embedding.md:100`; `ldd --version` = 2.35; `.github/workflows/release-assets.yml:48-51`; `scripts/check-glibc-ceiling.sh` |
| F13 | **SQLite link conflict:** `packages/execution/engine/Cargo.toml:35` pins `rusqlite = "0.43.0"` (libsqlite3-sys 0.40, `Cargo.lock:925`); pkm v0.7.0 needs `rusqlite 0.41.1`. Both link `sqlite3`, so Cargo refuses the graph until one version is used | `crates/pkm-core/Cargo.toml:22` |
| F14 | **pkm is a private repo; fgOS is public.** A git dependency needs `git-fetch-with-cli` plus read access (CI secret, `gh auth setup-git` on dev machines) | `gh repo view` visibility; pkm `docs/embedding.md:44-55` |
| F15 | Toolchain: pkm needs `rust-version 1.99`, edition 2024; fgOS pins 1.99.0 | pkm `Cargo.toml:8`; `rust-toolchain.toml` |
| F16 | Windows: fgOS builds with the dynamic CRT (no `crt-static` anywhere), so pkm's static-CRT ORT build is a pkm need, not necessarily fgOS's. **Differs from spec 8.2**'s Windows sentence. fgOS release targets are linux-x64 and windows-x64 only; macOS has a CI build check (`macos-latest`) | `src/util/release-targets.mjs`; `release-assets-check.yml` `macos-host-build` |
| F17 | `fgos doc` exists as a legacy Node verb (`store: require`, `mutatesStore: true`). A legacy verb can serve chosen sub-verbs natively through registry `native: [..]` plus `PARTIAL_VERB_OPERATIONS`, as `fgos session read/type` does | `command-routes.json` `doc`, `session`; `apps/fgos/src/routing.rs:116,301-338`; `scripts/export-command-selectors.mjs:209` |
| F18 | Detached child door: `fgos_process::mapped::spawn_detached` (own session, closes inherited fds via `closefrom` on linux-gnu, Unix only). Used by `gateway start`, `events sync --opportunistic`, `hook mailbox-sync` | `packages/process/rust/src/mapped.rs:194,541`; `apps/fgos/src/invocation_doors.rs:111` |
| F19 | Onboarding: `fgctl init` runs `fgos init`, `fgos doctor --fix`, `fgos doctor`; a readiness download is a registered doctor fix, so no fgctl code changes | `docs/platform/packaging-distribution/spec.md` section 6 |
| F20 | Locate log home: Observe record contract v2, a kind declared beside its owner and written through `RecordDoor` (fail-open, `detail` ≤ 2048 bytes) | `docs/platform/observe/spec.md` "Record contract v2"; `apps/fgos/src/wiring/observe_declarations.rs` |
| F21 | Release payload = `package.json` `files`; `packages/` is not shipped unless listed | `package.json` |
| F22 | Gold data in pkm format already exists: `locate-gold-vi-en.yaml`, `locate-gold-short.yaml`, `locate-profile.yaml`. Baseline (pkm main `00c1473`, 2026-11-21): vi-en recall@3/@10 91.7%/95.8% (24 owned), short leave-one-out 67.0%/92.0% (88), right section first 14/23 | `docs/.../verification/recall/`; `plans/reports/measurement-261121-2142-docos-pkm-v0-4-main-locate-eval-fgos-corpus.md` |
| F23 | The Node addon must not grow: existing tests walk its crate closure | `test/architecture.test.mjs:1831-1870` |
| F24 | `fgos knowledge handoff --locate-file` already consumes `{query, candidates: [{path, section?, why_not}], places?}`; locate output keeps `path`, `section`, `places` names | `src/cli/command-registry.mjs:2494` |
| F25 | Spec text to correct: document-identity line 436 ("build step 3 ... starts on `v0.4.0`"), line 634 (pin `v0.4.0`), 8.2 pins `v0.5.0`, F7 and F16 above, and documentation spec section 4 step 1 pins `v0.5.0` | spec files |

Prior art: `git log -S'pkm-core'`, `-S'onnxruntime'`, `-S'ohs'` over code find nothing. OHS was only measured
(reports `7349f3f49`, `baa878a3c`); its earlier spec registration as an external tool was withdrawn on paper, never
coded. Reused: the legacy-verb native sub-verb route (`session`), `spawn_detached`, the Observe record door,
the doctor registry and adapters, the config standard/schema, the machine release store resolver, the gold files
and pkm's own `locate_eval`. Missing and added: one crate, one verb family, two doctor rows, one fix, one config key.

## Decisions taken in this plan (each forced or clear)

1. **Vault = `<project>/docs`, not the project root.** Forced by F11: spec requires both `vault.writes: none` and
   every index under `.fgos/runtime/`; with the project root as vault those two conflict. With `docs/` as vault,
   `.fgos/runtime` is outside it. The adapter adds and strips the `docs/` prefix on output paths and gold cases. The
   spec 6.1 corpus is entirely under `docs/`.
2. **Model under a machine folder** `<machineReleaseStore>/models/` (one copy per machine), index and graph under
   the project's `.fgos/runtime/doc-locate/`. Spec 8.2 says both "all under `.fgos/runtime/`" and "fgOS's data
   folder". Per-project would fetch 130 MB per project and per linked worktree. The resolver lives beside
   `resolve_machine_release_store_root` in `packages/distribution/rust/src/store.rs`.
3. **Align the execution engine to `rusqlite 0.41.x`** (F13). Its only use is reading the omp login store
   (`credentials/sqlite.rs`, added `bd1979504`). The alternative, a new pkm tag on 0.43, adds a cross-repo wait.
4. **`partial` is derived by fgOS** from `Search::state()` (F7): `partial = state != ready`; on `pkm_not_ready` the
   answer has no candidates, `partial: true`, the state and pkm's action sentence.
5. **The worker is started by fgOS's process door** (F18), not pkm's `WorkerChoice::Process`: the session runs
   `External`; before opening, the use case asks `search::probe` and, when no worker runs and the state is not
   `broken`, starts `fgos doc index run --dir <root>` through `spawn_detached`. pkm's `writer.lock` keeps one
   worker per vault (exit 75 for a second).
6. **Profile rendered by fgOS** into `.fgos/runtime/doc-locate/profile.yaml`, outside the vault, passed explicitly.
   `area` values are derived (directories under `docs/platform/` that carry `spec.md`, plus `platform` by default for
   root files), never hand-listed: the spec 7.1 rule. `question` comes from path and file-name maps of table 7.2
   (pkm's `{value}` captures one path segment, `crates/pkm-core/src/structure/profile.rs` `Glob`). A project
   without that layout gets no facets; locate still works (`unplaced`).
7. **The repair verb** `fgos doc index status|stop|reset` exists because AGENTS.md requires a new runtime state to be
   reportable and repairable through its own verb, not only doctor. `run` is the detached child's entry, like
   `events sync --opportunistic`.
8. **Licences**: committed copies under `packages/documentation/third-party/pkm/` (listed in `package.json`
   `files`), proven equal to `pkm_cli::third_party_json()` through a dev-dependency (binary unaffected) and to pkm's
   `LICENSE` by a recorded sha256 per pinned tag.
9. **Measurement**: `fgos doc locate --eval <gold.yaml>` over pkm's `locate_eval`; refuses unless the state is `ready`.

## Data flow

```txt
draft (--draft / --draft-file, ≤8 parts) + optional --area --question
  → cli projection → wiring/doc_locate.rs (paths: docs root, .fgos/runtime/doc-locate/{graph.db,search/,profile.yaml},
    machine models dir, config docLocate.modelSource)
  → fgos-documentation use case
      render profile (if changed) → probe worker → spawn `fgos doc index run` if absent (spawn_detached)
      → port Locator::locate(parts, region) → pkm adapter: Session::open(External) → Session::locate(explain:true)
      → map: strip/add docs/ prefix, keep top 10, region→outside_region bool (unplaced → false), facets→axes,
        drop scores, partial from Search::state()
  → envelope fgos.v1 {partial, state, action?, parts:[{candidates:[{rank,path,title,section,excerpt,axes,outsideRegion}], places}], group?}
  → RecordDoor: kind fgos.doc.locate (fail-open; draft sha256, parts, region, candidate count, top paths in detail, partial, state, ms)
worker process: `fgos doc index run` → search::run_worker(docs root, opts{db, model_dir}) → search.db; exits after worker_idle
doctor: model row (install::model::probe) + fix (install::model::ensure); index pointer row (search::probe / state)
```

## Phases

| # | Phase | Depends on | Effort | Ships |
|---|---|---|---|---|
| 1 | [Build plumbing: static ORT at glibc 2.35, private pkm access, CI](phase-01-build-plumbing-static-ort-and-access.md) | owner Q1, Q2 | 6h + CI time | a pinned static ORT, every Linux build entry finds it, CI can fetch pkm |
| 2 | [Crate, pkm link, locate port and adapter](phase-02-crate-pkm-link-and-locate-port.md) | 1 | 5h | `fgos-documentation` links pkm v0.7.0 + ORT; use case proven in its own tests |
| 3 | [`fgos doc locate` verb, worker process, locate log](phase-03-doc-locate-verb-worker-and-log.md) | 2 | 8h | the verb on the real binary, partial path proven end to end |
| 4 | [Index repair verb, doctor rows, model fetch, config key](phase-04-index-verb-doctor-rows-and-model.md) | 3 | 6h | `fgos doc index status\|stop\|reset`, two rows, one fix, `docLocate.modelSource` |
| 5 | [Third-party licences in the release](phase-05-release-licences.md) | 2 | 2h | licence files in the payload, proven current |
| 6 | [Recall regression measurement](phase-06-recall-regression-measurement.md) | 4 | 4h + index time | `--eval`, a measured report at v0.7.0 |
| 7 | [Docs, spec corrections, changelog](phase-07-docs-spec-corrections-and-changelog.md) | 5, 6 | 3h | specs match code and pin; changelog line |

Phase 5 may run beside phases 3 and 4: its footprint (`package.json`, `packages/documentation/third-party/**`,
`packages/documentation/rust/tests/third_party.rs`, `test/rust-host/release-tree.test.mjs`) is disjoint from theirs,
because phase 2 already adds the `pkm-cli` dev-dependency and the lock entry. Every other phase is serial: phases 3,
4 and 6 share `src/cli/command-registry.mjs`, the generated host contracts and `apps/fgos/src/wiring/doc_locate.rs`.

## Build cost and test time

- The heavy compile (ort-sys, tokenizers, pkm, bundled SQLite) happens once per Cargo target dir, in phase 2.
  Only `fgos-documentation` and `apps/fgos` depend on it; `fgctl`, the Node addon and every other crate never
  rebuild it (architecture test in phase 2). `apps/fgos` is a bin crate, so ORT links into the `fgos` binary, its unit-test
  binary and the crate's test binaries only.
- Heavy commands run under `flock -o /home/vantt/projects/.doc-work/doc-heavy.lock` (`-o`: the lock fd is not
  inherited by a detached worker), one target dir per checkout, never `npm test` inside a linked worktree, tests
  with `env -u CLAUDE_CODE_SESSION_ID`.
- No feature switch hides pkm from the suite (L5 rule 5). The crate's adapter test uses pkm's own deterministic
  embedder (`pkm-core/test-embedder`, a dev-dependency feature) so the suite needs no 130 MB model; production wiring
  always selects `EmbedderChoice::Model`. The model path is proven by the measurement in phase 6.

## Test matrix (one owning proof per behaviour)

| Behaviour | Owning proof | Layer |
|---|---|---|
| Profile: area values derived from dirs with `spec.md`, question maps, `writes: none`, include/exclude | crate unit test `profile.rs` | crate |
| Locate mapping: top 10, docs/ prefix, `outside-region` (unplaced is not outside), axes, no scores, `partial` from state, `pkm_not_ready` → empty + partial | crate integration test over a fixture vault with real pkm (`tests/locate.rs`) | use case (spec 15) |
| Spawn decision: start only when no worker and not `broken` | crate unit test with an in-memory process port | use case |
| One worker per vault | pkm's own e2e (writer.lock); not duplicated | pkm |
| CLI wiring: envelope, worker started, record written, `index stop` leaves no process | `apps/fgos/tests/doc_locate.rs` (one test file) | CLI wiring |
| Doctor rows and fix: model ok/missing/corrupt, index pointer warns | `apps/fgos/src/wiring/doctor/documentation.rs` tests | doctor adapter |
| Config key default and type | existing config standard/schema tests | config |
| Engine SQLite read after rusqlite change | existing `credentials/sqlite.rs` tests | engine |
| Addon and fgctl never link the documentation crate | `test/architecture.test.mjs` (closure walk) | repo rule |
| Licence copies equal pkm's | `packages/documentation/rust/tests/third_party.rs` | crate |
| Licences in the payload | `test/rust-host/release-tree.test.mjs` | release |
| Release binary under glibc 2.35 | `scripts/check-glibc-ceiling.sh` in release-assets | release |
| Recall | `fgos doc locate --eval` measurement (phase 6), not in the suite | measurement |

## Acceptance criteria

1. `cargo test --workspace` and `npm test` green on the main checkout (Linux), run with `env -u CLAUDE_CODE_SESSION_ID`.
2. `cargo tree -p fgctl -e normal | grep -c pkm` prints 0; the architecture test shows the addon closure without `packages/documentation/rust`.
3. Release-assets on `ubuntu-22.04`: `scripts/check-glibc-ceiling.sh target/release/fgos` passes; `ldd target/release/fgos` lists no `libonnxruntime`.
4. On the pinned 2026-11-12 corpus (maintained documents of `977e3f9e`; owner, 2026-11-24, after the live corpus moved the answers without an engine change) with the model fetched and the index ready: `fgos doc locate --eval docs/.../locate-gold-vi-en.yaml --json` reports recall@3 ≥ 91.7% and recall@10 ≥ 95.8% (24 owned cases); `locate-gold-short.yaml` recall@3 ≥ 65.9% and @10 ≥ 90.9%; any case that was a hit in F22's baseline and is now a miss is named in the report.
5. With no model: `fgos doc locate --draft "..." --json` exits 0 with `partial: true`, and `fgos metrics query --kind fgos.doc.locate` counts one more record.
6. `fgos doctor --json` shows `doc-locate-model` (warn when missing, `fix: fgos doctor --fix`) and `doc-locate-index` (pointer, never fails); `fgos doctor --fix` fetches the model once; a second run downloads nothing.
7. `fgos doc index stop` leaves no worker (`kill -0` on the recorded pid fails); a worker exits by itself after the idle time.
8. The release payload contains `packages/documentation/third-party/pkm/third-party.json` and `LICENSE`.
9. The specs name v0.7.0, step 1, the corrected facts F7, F11 and F16, and the measured numbers; `node scripts/doc-health.mjs` on the changed docs is clean; `CHANGELOG.md` `## [Unreleased]` has the user line.

## Risks (likelihood × impact)

| Risk | L × I | Mitigation |
|---|---|---|
| Static ORT from source fails to build or link on 22.04 | M × H | phase 1 proves it on a throwaway pkm-binary link before any fgOS code; fallback is owner Q1 option (c), which needs a new owner decision |
| A transitive pkm dep needs newer `serde_json`/`libc`/`thiserror` than fgOS's exact pins (`=1.0.151`, `=0.2.189`, `=2.0.20`) | M × M | phase 2 step 1 resolves the lock first; raise the workspace pin if needed, in the same commit |
| `arbitrary_precision` (enabled by fgOS) changes pkm JSON numbers | L × M | pkm CI tests that mode (`crates/pkm-core/Cargo.toml:31-34`); the crate's locate test asserts scores/ranks parse |
| CI cannot fetch private pkm | H × H until secret exists | owner Q2; phase 1 lands the CI wiring before phase 2 |
| First index (~6-7.5 min, ~600 MB RSS) during heavy IO on the QLC SSD | M × M | worker idles out; measurement under `flock -o`; locate stays partial meanwhile |
| macOS CI build check breaks (pyke static needs `MACOSX_DEPLOYMENT_TARGET=13.4` and `libclang_rt.osx.a`) | M × L | phase 1 sets them in `macos-host-build`; unverified until that job runs |
| Older activated releases refuse a new `docLocate` key in tracked project config | M × M | the default needs no config; set the key only after the release that knows it is active everywhere |
| Shared-file collisions with draft plans (`test/architecture.test.mjs`, `component-boundary.md` in component-authority; engine Cargo.toml in execution lanes) | M × L | serial landing; announce on the program board's shared-file list when phase 2 starts |

## Rollback

Each phase is one commit series that reverts alone. Index, graph and model folders are rebuildable caches (L3):
deleting `.fgos/runtime/doc-locate/` and `<machineReleaseStore>/models/` loses nothing. Reverting phase 2 also
reverts the engine's rusqlite change. Before reverting phase 4, drop `docLocate` from any project config.

## Backwards compatibility

No existing verb changes behaviour. `fgos doc <legacy sub-verbs>` keep their Node route; only `locate` and `index`
are new native sub-verbs. `doc`'s `mutatesStore` becomes the list of its mutating sub-verbs, which is what it already
meant. Release binary grows by about 20 MB (ORT) plus pkm. No data migration.

## Platforms

Linux x64 is planned and proven. Unverified, stated plainly: macOS build (deployment target and clang runtime flags,
detached spawn through the `Command` path without `closefrom`); Windows build with pyke's static ORT against fgOS's
dynamic CRT; Windows has no detached spawn (`spawn_detached` is Unix only), so on Windows `fgos doc locate` stays
`partial` with an action that names the missing worker. fgOS ships no macOS release today.

## Component boundary

Rows for the docs phase: Documentation › document identity owns the locate port, the pkm adapter
(`packages/documentation/rust`), the `fgos doc locate` and `fgos doc index` sub-verbs, the index worker process,
`.fgos/runtime/doc-locate/` (rebuildable cache) and the machine model folder; it writes the Observe kind
`fgos.doc.locate`. pkm is a linked library, not a component.

## Open owner questions

**Q1. Where the static ONNX Runtime for Linux comes from.**
- What: the owner chose static ORT today. pyke's static build, which `ort` downloads, needs glibc 2.38; fgOS releases
  and the owner machine are on glibc 2.35 (F12), so the default build does not link.
- Cause: pyke builds on a newer distro; fgOS keeps Ubuntu 22.04 as its oldest supported Linux.
- Options: (a) fgOS's own workflow builds ORT 1.31.1 from source on `ubuntu-22.04`, merges the static libs, publishes
  them as an asset of a dedicated tag in `vantt/forgent` with a pinned sha256 (about 60-90 min CI per rebuild, rare; fgOS
  keeps one recipe). (b) Ask pkm to publish the same artifact in `vantt/pkm-release` next to its Windows ORT build (one
  recipe for both projects; a cross-project wait). (c) Link Microsoft's `manylinux_2_28` shared library (reverses today's
  decision; the release ships a library and needs a doctor row). (d) Raise the glibc ceiling to 2.38 (drops Ubuntu 22.04,
  including the owner machine).
- Recommendation: (a). It keeps the static decision, has no cross-repo wait, and the recipe can be offered to pkm later.
- Scope: Linux x64 builds of fgOS only; Windows and macOS keep pyke's download.

**Q2. Private pkm inside the public fgOS repo.**
- What: after phase 2 nobody can build fgOS from source without read access to `vantt/pkm` (F14).
- Cause: pkm is private; Cargo fetches git dependencies at build time.
- Options: (a) keep pkm private; CI gets a read-only token secret `PKM_READ_TOKEN` (the owner creates it: an owner-hands
  step), dev machines use `gh auth setup-git`; outside contributors cannot build. (b) Make pkm's repository visible (its
  licence still governs use); no token plumbing. (c) Vendor pkm's source into fgOS (publishes it anyway, adds upgrade work).
- Recommendation: (a) now, since fgOS has one developer; revisit when an outside contributor appears.
- Scope: CI, release builds, every machine that builds fgOS.
