# Phase Implementation Report: Slice C landing B (config door)

Plan: `plans/261023-1649-yaml-config-slice-c-node-door-cutover/`. Branch `cfg/slice-c-b` (worktree `/home/vantt/projects/forgent-worktrees/cfg-slice-c-b`), from `origin/main` `cac2f6ce7`. Not pushed, not merged. Phases: 00, 05, D-11 (moved from Slice D), 06, 07, 08.

**Status: DONE_WITH_CONCERNS.** Landing B is built and green; the cost gate (phase 08) fails three of its five bounds, so G-C2 is posted below and phase 09 onward stops until the owner answers. Per-module Rust caps were passed (numbers below); the slice ceiling was not.

## Commits

| Commit | Phase | What |
|---|---|---|
| `c1703e433` | 00 | Slice D as landed replaces every assumed fact in phases 00, 05, 06, 07 (table "As landed" in phase 00) |
| `7aee3c04e` | 05 | crate: `write::init`, `machine::snapshot` and `machine::context`, `detect::PathDetectors` + `contracts/detected.v1.json`; 14 tests |
| `7b84fa8d2` | D-11 | addon `config` namespace: `check`, `fix`, `accounts`; `marshal::Failure` detail; `fromDoorJson` `nullPrototype`; `combinedAbiMatches`; `"config": 1` |
| `e9c72d2f3` | 06 | addon `snapshot`, `init`; 8-slot cache keyed by request and `PATH`; `"config": 2` |
| `4195a13d5` | 07 | `src/config/facade.mjs`, manifest row (kernel), `facade.test.mjs` |
| (this commit) | 08 | cost measurement, phase notes, this report |

## Differences from the plan text (decide-and-report)

1. **No `explain` / `applyPatch` door entry and no facade function for them** (coordinator answer 1: no in-repo Node caller). The door has five entries. `docs/platform/config/spec.md` section 12 still names `snapshot, explain, check, applyPatch`; landing C's docs phase must amend that line. Not edited here (spec status lines belong to the docs phase).
2. **Entries return one JSON text** (the whole answer), not `{ json, ... }` with a nested text: one parse in the facade.
3. **The machine view is not cached** in the addon (the crate cache is keyed over a project read); see the gate numbers (4 ms warm). Slots are keyed by request **and `PATH`**, because a snapshot with no detected executor would otherwise outlive `claude` appearing on `PATH`.
4. `snapshot.rs` (outside the phase 05 file list) was touched: the machine half of `read_sources` is extracted (`machine_sources`), +17 lines, so the machine view reads only global and accounts instead of pointing a project root at a missing directory.
5. `marshal::Failure` gained a boxed `More { path, keyword, refusals }` (flattened JSON, same shape for the yaml door) because clippy's `result_large_err` bounds the `Err` of every entry. Three door-level ids (`config-request-invalid`, `config-trusted-root-unresolved`, `config-internal-error`) plus `config-io` are not crate ids; they are in the `config.rs` header and the facade's `DOOR_IDS`.
6. `projectConfigPresent` answers from the snapshot's project revision, so a migration tombstone is absent (it is no source).
7. The simulated "older addon" descriptor case is a pure-function test (`combinedAbiMatches` with `config: 1` and no `config`) instead.
8. Board line not written: the lane is not landed or merged; phase 08's "board line, tell lead:HARDEN and lead:TEST" waits for G-C2 and the landing.

## Caps and ceilings (rustfmt-formatted lines, comments and blanks included)

| Module | Cap | Actual | |
|---|---|---|---|
| crate `write.rs` delta | 80 | +72 net | ok |
| crate `detect.rs` delta | 80 | +49 | ok |
| crate `machine.rs` delta | 50 | +44 net | ok |
| crate `snapshot.rs` (not capped) | | +17 net | |
| addon `config.rs` D-11 (`check`, `fix`, `accounts`) | 110 | **315** after the first commit | **over (2.9x)** |
| addon `config.rs` total (D-11 cap 110 + phase 06 cap 190 = 300) | 300 | **421** | **over (1.4x)** |
| addon `marshal.rs` (landing A cap 80) | 80 | 119 (+53) | over |
| facade | 260 | 72 | ok |
| Rust slice ceiling | 870 added (baseline 19,432) | **+658 net** (20,090) before phase 16 and D-14 | ok, 212 left |
| Node source net (added minus removed, `src bin scripts`) | at most -400 at the end | +77 now (facade 72, `door.mjs` +9, -4) | by design: landing C deletes |

Why `config.rs` is over: the plan's estimate of 60 lines for the three D-11 entries has no room for the shared request parsing, the failure conversion, the main-checkout resolution with its memo, and the Windows stub that any entry needs; those were 315 lines in the first commit. Phase 06's own two entries then added 106 (cap 190, and the plan had four entries, two of which were dropped). The ceiling (870) is what the plan makes the hard stop; it is 212 lines from being reached, and phases 16 and D-14 (caps 60 and 60) still draw on it. If the owner wants `config.rs` back under its per-module cap, the candidates are the `rows` filter, the memo (re-resolve each call, which the gate below already shows is cheap when the root is not a repository), and the non-Unix stub; I did not trim requested behaviour.

Tests added: Rust 14 (`golden_init.rs` 4, `detect_path.rs` 5, `machine_view.rs` 5) + 1 (`marshal.rs`); Node `config-door.test.mjs` 10 cases (160 lines, one per entry plus marker, trusted root, refusal shape), `facade.test.mjs` 9 cases (120 lines). Owning proofs stay in the crate. Deleted tests: none (nothing deleted: additive landing). `native-load.test.mjs` pin updated to `config: 2`.

## Gates run (sequential, jobs 4, no `npm test`, no `cargo test --workspace`)

- `cargo test -p fgos-config -p fgos-node-addon`: all pass. `cargo clippy -p fgos-config -p fgos-node-addon --all-targets -D warnings`: clean. `cargo fmt -p fgos-config --check`: clean (the addon crate has 14 files that were not rustfmt-clean before; the two I changed were formatted). `cargo check -p fgos` (host consumer of the crate): clean.
- Through the suite launcher's staging and env (`scripts/run-tests.mjs` `runSelectedTests`, one scratch runner): `config-door`, `facade`, `native-load`, `yaml`, `native-addon`, `release-tree`, `canonical-vectors`, `architecture`: 53 + 50 pass, 0 fail, 1 skipped (pre-existing).
- Impact analysis: **inactive** (`fgos tool query --capability impact-analysis --status present` returns no provider). Callers checked with `rg`: `fromDoorJson` (added an option, default unchanged; callers: `yaml.mjs`), `loadNativeAddon` marker (every addon consumer loads through `door.mjs`; `src/git/native.mjs`, `holder-lock/driver.mjs` and the others re-export or call it, none builds its own `versions()` check), `versions()` consumers (`native-load.test.mjs` pin, `build-rust-distribution.mjs` does not inspect keys), `marshal::Failure` (only `yaml.rs`, `config.rs`), `snapshot.rs` `read_sources` (private to the crate: `snapshot`, `write::snapshot_with`, `cache`, `doctor`), the facade (no importer: `rg "config/facade" src bin scripts` is empty).
- The git one-door census (`packages/git/contracts/mutation-census.v1.json`) is regenerated in each commit that touches a source file: the pre-commit hook refuses otherwise.

## Phase 08: cost gate (release profile, this machine, 20 child processes per row, median / worst, ms)

Method: release `fgos-node-addon` and `fgos` staged under `.fgos/runtime/tmp/` with a dev-host manifest (`scripts/lib/dev-host-manifest.mjs`), each row a fresh Node process timing inside the child with `process.hrtime`; data outside the repository: a copy of this repository's own `.fgos/config.json` (43 KB; see the refusal census below) as legacy JSON and migrated by `fgos config migrate` to a 9 KB YAML, an empty project, a main checkout, a linked worktree, a plain directory. Scripts: `/tmp/claude-1000/-home-vantt-projects-forgent/9548be33-0b94-4fe0-b02c-5d5eb0240a61/scratchpad/{measure,measure2,extra}.mjs` (scratch, not committed). `free -g` before: 12 GB available.

| Row | median | worst | Bound | |
|---|---|---|---|---|
| `node -e "process.exit()"` wall | 19.1 | 28.4 | | baseline |
| old vendored parser: import 2.7, first parse 5.3, second 0.28 | 8.0 | | | for comparison |
| addon YAML door: import 3.3, first parse 17.1, second 0.11 | 20.4 | | | landing A |
| today `readSharedConfig` legacy JSON: import 1.9, **first 0.30**, warm 0.075 | | | | comparison |
| addon load (`nativeDoor()`, Git-free process) | **16.8** | 24.9 | 12 | **fails** |
| first `readConfig`, migrated, all sections | **34.5** | 184.6 | today's 0.3 + 25 = 25.3 | **fails** |
| first, `gateBypass` only / `runner` only / legacy JSON `runner` / empty project | 35.2 / 36.7 / 41.1 / 31.8 | 49 / 43 / 52 / 39 | same | **fails** |
| warm one-section read, migrated, cached | 0.049 | 0.10 | 0.3 | holds |
| warm all sections / `runner` only, migrated | 0.68 / 0.64 | | | native call 0.29 + marshal 0.38 |
| `runner` marshal (JSON text parse with a null-prototype reviver, 23 KB) | 0.36 | 0.36 | 3 | holds |
| warm read, project with **no `runner.executor`** and `claude` on `PATH` | **4.09** | 4.14 | 0.3 | **fails** |
| same, no executor on `PATH` | 0.046 | 0.063 | 0.3 | holds |
| machine view, first / warm / project+machine pair | 9.1 / **4.05** / 4.13 | | 0.3 | **fails** (uncached) |
| trusted root, cold (first read, includes the first build): main checkout / linked worktree / plain directory | 37.2 / 43.2 / 30.4 | 58 / 66 / 40 | | about +6 and +12 over a plain directory |
| trusted root, warm: main / linked | 0.028 / 0.041 | | | memo works |
| first call `accounts` (bundle only), second | 2.8 / 0.016 | | | |
| first snapshot after the bundle (empty, one section), second uncached build | 30.2 / 5.1 | | | one-time part about 25 |
| addon file: read 6.0, sha256 9.2, `require` 1.0, `versions()` 0.15 (21.6 MB addon) | 16.3 | | | |
| `fgos dispatch decide --for judge` in a git repository (release host, legacy-node route), today | 252 | 490 | +15 vs today | **not measurable**: no reader moves in landing B |

Dominating terms:
- **First snapshot (+34 ms over today's read, bound +25):** the bundle is 2.8 ms; the first build is 30.2 ms, of which about 25 ms is one-time (a second build of the same request is 5.1 ms, a cached read 0.05 ms), consistent with the lazy JSON Schema validator compilation; I did not isolate it further. Not parse of the user's file, not marshalling (0.38 ms).
- **Warm read when uncached (4.1 ms, bound 0.3):** the crate refuses to cache a snapshot that contains a detected value (`PATH` is not a hashed source), so every read of a project that sets no `runner.executor`, on a machine where `claude` is installed, rebuilds and revalidates everything: 4.1 ms per read. That is the normal state of a new project, and the machine view is uncached for the reason in difference 3. A doctor with about 40 reads would cost about 160 ms, not the spec's 1.4 ms. The addon's slots are already keyed by `PATH`, so caching a detected snapshot inside the addon's key would be correct; the crate's `snapshot_cached` does not allow it.
- **Addon load (16.8 ms, bound 12):** read plus sha256 of the 21.6 MB addon (15.2 ms) is the digest check the door has always done once per process; the addon is bigger since landing A and B pulled in the schema validator. Spec G1 measured 8.4 ms for the hash alone on a smaller file.
- Projection for the hook path once a reader moves: first read about 30 to 35 ms plus 6 to 12 ms for a linked worktree plus the addon load if the process did not load it for Git, against the +15 ms bound. Phase 09 and landing C must re-measure end to end.

### G-C2 (decision question; the owner is asked, nothing is built until answered)

**What is happening.** Three bounds of phase 08 do not hold: first snapshot (34 ms over today's read, bound 25), warm read of any project without a configured executor on a machine with `claude` on `PATH` (4.1 ms, bound 0.3) and the machine view (4 ms), and addon load (16.8 ms, bound 12). Every `fgos` verb, doctor check and PreToolUse hook would pay them once the readers move.
**Cause.** (1) The first build compiles the section validators lazily, about 25 ms once per process. (2) A snapshot holding a detected executor is never cached by the crate. (3) The door hashes a 21.6 MB addon on every cold process.
**Options with cost.**
A. Accept the bounds as measured (no code; hooks and short verbs pay 35 to 50 ms more per process, doctor 160 ms more).
B. Fix in Rust inside `fgos-config` and the addon, its own commit group, guarded by the existing goldens: let the cache hold a snapshot with a detected value when the caller declares its detectors fixed for the cache's life (the addon already keys slots by `PATH`), cache the machine view the same way, and validate only the sections a request names (or compile validators eagerly in a background thread at load). About 60 to 100 Rust lines, probably under the 212 left in the ceiling, plus tests; it does not reach the 12 ms addon load.
C. B plus changing the door's digest check (hash once per release at install, not per process): a door and release-manifest change outside this slice (distribution spec), cross-lane.
**Recommendation.** B now (it is the "Rust-side fix" the plan names for exactly this stop) and a separate item for C; re-measure, then raise the addon-load and cold-first bounds to what B reaches if the owner agrees. A is acceptable only if the hook path is measured end to end first.
**Scope of the answer.** Parks phase 09 onward only (the landing C reader moves); landing B's five commits stand and add no runtime behaviour.

## Refusal census seen while preparing the measurement data (input for phase 09)

This repository's own project file, read as a project by the new snapshot, is refused for: `terminal.layout.policy: "even-split"` (the schema's enum is `[measured-split]`), a `gateway` section (global-only), and the dead `lock` key. The last two were expected by the plan; the first is new. With those three edited in a scratch copy `fgos config migrate --accept-machine-overrides` converted it (43 KB to 9 KB YAML).

## Next steps / unblocks

- Owner answers G-C2; then B's Rust-side fix (own commits) or phase 09.
- Landing C's docs phase: spec section 12 line (entries), failure ids of the door, `docs/platform/config/spec.md` status.
- Nothing is activated, no config reader moved, nothing deleted.

## Unresolved questions

1. G-C2 (above).
2. Per-module cap for `config.rs` (421 against 300): accept, or name what to cut.
3. The `terminal.layout.policy: "even-split"` value in this repository's committed file: a stale value to fix in the file before landing C (phase 21), or is `even-split` meant to become legal?

Status: DONE_WITH_CONCERNS
Summary: Landing B is committed on `cfg/slice-c-b` (crate additions, addon `config` namespace with check, fix, accounts, snapshot, init, Node facade, all tests green); the cost gate fails three bounds, so G-C2 is posted and phase 09 onward waits.
Concerns/Blockers: G-C2 (first snapshot 34 ms, uncached detected snapshots 4.1 ms per read, addon load 16.8 ms); `config.rs` 421 lines against a combined cap of 300 (Rust ceiling 870 not reached: +658).

## G-C2 follow-up: coordinator decisions implemented and the gate rerun (2026-10-24)

Commits (one per item, after `af4eaad10`): `2d158c1ba` (decision 5), `d7d8f0d85` (decision 1), `60d686eeb` (decision 2), `85486a196` (decision 3a). Decision 4 (accept `config.rs` at 421 lines) needs no change. Same harness, same data, same 20 runs; release profile, now stripped.

| Decision | Done |
|---|---|
| 5 terminal policy | schema enum `[even-split, measured-split]` (the contract's names), standard and its doc line `even-split`; pinned authoring source gets a recorded difference for `terminal.layout.policy`, the migrate golden counts (16 kept, 256 dropped) and the seeded-defaults fixture follow. This repository's own file now passes that key. |
| 1 lazy validators | `Schemas` keeps one `OnceLock` validator per section; the snapshot validates only the sections some file wrote (the standard is fixed data the crate tests validate); the composite validator is gone (`validate` = all sections through the same path). Unit test proves only the asked section compiles. |
| 2 detected values | `Detectors::fingerprint()` (default empty; `PathDetectors`: the `PATH` and the candidate found on it) joins the cache key; `snapshot_cached` caches a detected snapshot and does not run detection on a hit; the addon's slots key on the request alone. Tests: cache (detection ran once, a changed fingerprint misses), detect_path (fingerprint changes exactly when the answer can). |
| 3a strip | the release addon was **not stripped**. `[profile.release] strip = "symbols"`: addon **21,619,728 to 16,469,832 bytes (-23.8%)**, host `fgos` 19,415,824 to 14,704,224. |
| 3b marginal | a Node process that already loads the addon for Git: read + sha256 + `require` of the landing A addon (9.2 MB, stripped, built from `cac2f6ce7`) 7.6 ms, of this addon (16.5 MB) 12.9 ms, so the config door adds **5.3 ms** (bound 12): holds. Whole facade-process load is now 13.3 ms (was 16.8). The hash check is untouched. |

Rerun (median ms; worst in the scratch log):

| Row | Before | Now | Bound | |
|---|---|---|---|---|
| marginal addon load of the config door | n/a | 5.3 | 12 | **holds** |
| warm cached one-section read, migrated | 0.049 | 0.051 | 0.3 | holds |
| warm read, project with no `runner.executor`, `claude` on `PATH` | 4.09 | **0.044** | 0.3 | **holds** (decision 2) |
| `runner` marshal | 0.36 | 0.36 | 3 | holds |
| first read, migrated all / `gateBypass` / `runner` / legacy JSON | 34.5 / 35.2 / 36.7 / 41.1 | **34.2 / 35.5 / 38.2 / 41.4** | today 0.3 + 25 | **still fails** |
| first read, empty project | 31.8 | **26.0** | 25.3 | **still fails** (by 0.7) |
| machine view warm (not cached) | 4.05 | **3.9** | 0.3 | **still fails** |
| `fgos dispatch decide` today | 252 | 180 to 222 | +15 | not comparable until a reader moves |

**Where the first read goes (measured one process, steps in order after the bundle load of 2.7 ms):** first project root 24 ms; a second new project root 11 ms (a 43 KB legacy JSON with every section written, so all section validators compile); a third root 4.2 ms; the machine view 3.9 ms. So the lazy validators are worth about 7 ms in total, not the 25 ms I guessed in the first report; **about 20 ms of the first read is the cold start of the Git driver that resolves the trusted main checkout** (`GitDriver::new` and the version floor, once per process, before any file is read). The build itself is 4 ms and is what a cached-out read pays (the machine view, which has no cache, pays only that).

**Stop, per the coordinator's rule: two bounds still fail** (first read, machine view warm). The remaining cost is not validators or marshalling.

### G-C2 round 2 (decision question)

**What is happening.** The first config read in a process costs 26 to 41 ms against a bound of 25.3; the machine view costs 3.9 ms per read against 0.3.
**Cause.** (1) 20 ms is the Git driver's cold start, paid to learn the main checkout even when the project root is the main checkout. (2) The machine view has no cache (the crate cache is keyed over a project read), so each read rebuilds (3.9 ms).
**Options.** A. Resolve the trusted root without the driver when the answer is already on disk: the nearest ancestor holding `.git` as a real directory (not a symlink) is the main checkout, and no ancestor holding one means the project itself; only a `.git` file (a linked worktree) or a bare repository goes to the driver. About 25 lines in `config.rs`; the first read in the main checkout and in a plain directory drops to about 14 ms (holds), a linked worktree stays near 34 ms once per process. It touches the trust rule (spec section 5 rule 6), so it needs your word, and a test that a `.git` symlink or a forged directory still goes to the driver. B. For the machine view, give the crate cache a machine-view entry (about 30 lines in `cache.rs`): warm 0.05 ms. C. A and B. D. Neither (accept 20 to 40 ms on the first read of a process and 3.9 ms per machine read).
**Recommendation.** C. The gateway and every doctor row without a project use the machine view, and the main checkout is the common case.
**Scope of the answer.** Parks phase 09 onward only; the five landing B commits plus these four stand.

Gates after the four commits: `cargo test -p fgos-config -p fgos-node-addon`, clippy `-D warnings`, `cargo fmt -p fgos-config --check` clean; suite-staged `config-door`, `facade`, `native-load`, `yaml`, `architecture`, `release-tree`, `native-addon`, `terminal-control-checks`: 102 pass, 0 fail, 1 skipped (pre-existing). Rust added vs baseline now +739 of the 870 ceiling (re-count before phase 16).

## G-C2 round 2: decisions implemented, full gate rerun, every bound holds (2026-10-24)

Commit `ee9b0ace9` (`machine_cached` in `cache.rs`, +28 lines; the addon keeps the machine view in its own slot; one crate test). The trusted root still goes through the Git driver (decision 1: no `.git` probing). Rust added vs baseline: **+766 of 870**.

**Marginal first read (decision 2):** a process whose Git work already ran (`inspectGit` first), then the first `readConfig` of one section, 20 runs, median (worst):

| Project root | Git work in that process (not config) | first config read, marginal | bound (today 0.3 + 25) |
|---|---|---|---|
| plain directory (migrated file) | 67.8 | **20.5** (28.8) | 25.3 holds |
| main checkout | 40.9 | **14.2** (34.0) | holds |
| linked worktree | 33.4 | **19.6** (20.6) | holds |

The marginal read is the bundle (2.7 ms), one `resolve_repo` for the trusted root (about 8 ms: every Git call in that process costs 8 to 11 ms, see the second-call column in the scratch log) and the first build with its section validators (4 to 7 ms). Absolute first read in a process that touches no Git, for the record: 30 (empty project), 32 to 47 ms (migrated, legacy), plus 13.4 ms addon load.

**Full table, rerun (median ms, release, stripped):**

| Row | Now | Bound | |
|---|---|---|---|
| marginal addon load of the config door | 5.3 | 12 | holds |
| marginal first read after Git ran (plain / main / linked) | 20.5 / 14.2 / 19.6 | 25.3 | holds |
| warm cached one-section read, migrated | 0.052 | 0.3 | holds |
| warm read, no `runner.executor`, `claude` on `PATH` / not | 0.048 / 0.052 | 0.3 | holds |
| machine view warm / project+machine pair | 0.017 / 0.068 | 0.3 | holds (was 3.9) |
| trusted root warm, main / linked / plain | 0.030 / 0.041 / 0.046 | | memo works |
| `runner` marshal | 0.385 | 3 | holds |
| `fgos dispatch decide` today | 188 to 229 | +15 | not comparable until a reader moves (landing C re-measures end to end) |
| absolute first read, no Git in the process (record) | 30 to 47 | | |

Gates after `ee9b0ace9`: `cargo test -p fgos-config -p fgos-node-addon`, clippy `-D warnings` and fmt clean; suite-staged `config-door`, `facade`, `native-load`, `architecture`: 67 pass, 0 fail, 1 skipped (pre-existing).

**Item for the GIT lane (decision 4; `packages/git` untouched here).** `GitDriver::resolve_repo` runs `read_repository_facts` (config and format reads through Git) on every call, about 8 ms per call in a process that has already done its floor probes, although the config door needs only the main checkout, which `resolve_topology` (private to the crate) derives from the filesystem alone. A public topology-only entry in the Git component (same trust checks, no facts) would remove that 8 ms from the first read of every project root and from any other caller that only needs the trusted root. The driver's cold start itself (`gitStart` 33 to 68 ms for the first call in a process, floor probes included) is paid by every Git user whether or not config is read; whether it can be done lazily is the GIT lane's call, and it is not part of the config marginal.

Landing B is ready: nothing is activated, no reader moved, nothing deleted. Phase 09 is not started.

Status: DONE
Summary: Landing B (crate additions, addon `config` namespace, facade, cost gate) is committed on `cfg/slice-c-b` and every phase 08 bound holds on the marginal measures; phase 09 is not started.
Concerns/Blockers: none open for B. `dispatch decide` cannot be compared until a reader moves; GIT-lane item noted above.
