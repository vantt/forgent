# Scout: census for the Event Store implementation plan

Date 2026-10-18 09:51 (Asia/Saigon). HEAD `e59fc5d5d` on main. Read-only scout for [plan](../261018-0945-event-store-fgos-event-store/plan.md).

## 1. What exists and what does not

- No crate, contract dir, Node facade or addon for the Event Store exists. `packages/` has no `event-store` or `git` dir; `Cargo.toml:2-18` lists 15 members, none of them.
- Prior art: `git log -S'refs/fgos'` finds no code commit; only spec commit `232d61eb8`. The Event Store is new code. Reused below: holder-lock in-process `acquire` (`packages/holder-lock/rust/src/port.rs:457`), `Resource::new` (`:90`), `guarantee(dir)` (`:784`); the `state` hot mutex `withStateTx` (`src/state/hot-lock.mjs:414`) and `hotLockDepth` (`:58`); config door `registerConfigDefault` (`src/setup/registrations.mjs:193`), `registerCheck` (`:172`); legacy order and dedupe (`src/state/replay.mjs:870-891`).
- Precedent for Rust lock paths: Rust callers hardcode one path function and call `port::acquire` (`packages/observe/rust/src/store_lock.rs:46-64`, `packages/distribution/rust/src/store.rs:47`). Rust reads no registry until Git phase 02 (`scope.rs`).
- Two canonical-JSON serializers already exist: `packages/distribution/rust/src/verify.rs:45` (JCS) and `packages/run-supervisor/rust/src/envelope.rs:19` (sorted keys, integers only). A third copy would be scatter (RUL11).

## 2. Today's event path (what the cutover replaces)

| Mechanism | Current location | Spec cite (stale where noted) |
|---|---|---|
| Per-writer shard naming | `src/state/store.mjs:157` `resolveWriterLogPath` | spec `:146-180` (shifted by wave S) |
| Append core, no `fsync`, 16-hex `h` of `JSON.stringify` | `src/state/event-log.mjs:186-223` | spec cites `events.mjs:480-498` (moved) |
| Work gate | `withMainState` (`src/state/runtime-coordination.mjs:44`) over `withStateTx`; `tx.append` (`hot-lock.mjs:353`); `withStateAndRefresh` (`store.mjs:249`) | spec `:222-255` names `withEventsLockAndRefresh` (renamed) |
| `events.lock` | gone; tombstone of `state` row (`lock-registry.v1.json`, `state.v1Path`) | spec §13 row `events.mjs:26-52` is history |
| Legacy order `(ts, file, seq)` and dedupe | `src/state/replay.mjs:870-891` | spec `:870-889` (holds) |
| Discovery, T4 fast path | `replay.mjs:838` `discoverEventFilePaths`, `:913` `tryIncrementalRebuildFromDir`, `:999` `buildSnapshotFromDir` | spec `:838-889` |
| Append sites in the gate | 18 in `store.mjs` (`:372`, `:454`, `:487`, `:544`, `:989`, `:1330`, `:1361`, `:1374`, `:1556`, `:1657`, `:1693`, `:1708`, `:1743`, `:1800`, `:1906`, `:1933`, `:2154`), 2 in `porting-store.mjs`, 1 outside a tx in `src/runner/loop.mjs:1018` | — |
| Return value of an append read after the gate (`.seq`) | `store.mjs:1361-1374` and `bin/fgos.mjs` `return` output | — |
| Porting store, own gate `porting-events` | `src/state/porting-store.mjs:29` (`<dir>/porting/events.jsonl`), `:96-100` | spec `:28`, `:89` |
| Truncation guard and its commit | `src/state/events-jsonl-truncation-guard.mjs` (520 lines), wrapper `scripts/events-jsonl-truncation-guard.mjs`, caller `src/runner/main-fgos-checkpoint.mjs:7` | spec says 536 lines |
| Compaction | `src/state/events-compaction.mjs` (263 lines) | holds |
| Doctor `events-jsonl-not-truncated` | `src/setup/registrations.mjs:2014-2081` | spec `:1965-2031` |
| Doctor `events-compaction-verified` | `registrations.mjs:2084-2176` | spec `:2035-2126` |
| Other direct readers in registrations | `:2044`, `:2101`, `:3879`, `:3902`, `:6257` | spec `:1993`, `:2050`, `:6180` |
| `fgos repair` (torn last line) | `src/cli/command-registry.mjs:1417`, `events.mjs:52` `repairTruncatedLastLine` | not in spec §19; same family as §9 step 3 automatic recovery |
| `fgos rebuild` | `command-registry.mjs:1405`; route `packages/host-runtime/contracts/command-routes.json:641` | spec `:1393` |
| Land event sweep into the merge commit | `src/runner/merge.mjs:1362-1389` | Git F-E2 |
| `fgos-write-rejected` restore of event parts | `merge.mjs:683-1306` (event parts only) | spec `:686-1164` |
| Hook line-count guard (tsk-1i3) on `.fgos/**/*.jsonl` | `.githooks/pre-commit:278-339`, refusal `:495` | Git spec §7 "retired event monotonicity guard" |
| Hook `.fgos` deletion refusal | `.githooks/pre-commit:457` | Git 05 adds the grant there |
| `merge=union` | `.gitattributes:15` | holds |
| Rust readers | `packages/work-state/rust/src/work_source.rs:472`, `legacy_friction.rs:57` | spec lists only `work_source.rs` |
| Script readers | `scripts/regenerate-observe-fixtures.mjs:100-105`, `scripts/verify-fanout-overlap.mjs:49`, `scripts/measure-verify-cost.mjs:358`, `scripts/probe-storytelling-material.mjs:176`, `src/report/enduser-index-generate.mjs:124` | partly in spec |
| CLI readers | `bin/fgos.mjs:46`, `:1410`, `:2908`, `:4177`; `src/runner/claim-port.mjs:120`, `:240` | — |
| Contract describing the file read | `packages/work-state/contracts/work-events.read.v1.json:5` | — |

Tracked `.fgos` in this repo (`git ls-files .fgos`, 104 files): `events.jsonl`, 90 shards under `events/`, `state.json`, two `events.jsonl.backup-*`; other tracked files stay (`config.json`, `coexistence.json`, `distribution.json`, `gate-bypass.json`, `docs/enduser-docs-index.json`, `instructions/effective/repo.json`, four `observe/**/*.jsonl`). The four tracked observe `.jsonl` files remain under the line-count guard's pattern, so retiring the guard needs a decision on them (phase 09).

Other workspace seen on this machine: `../mdview` tracks `.fgos/events.jsonl` only, no shards, no `merge=union` line. The migration therefore must run per repository and handle optional parts (mission #1).

## 3. Locks and ranks

Registry rows (`packages/holder-lock/contracts/lock-registry.v1.json`): owner enum `4.2|4.3|4.4|6.2`; ranks map keys `10,15,20,30,40,50,55,60,80`; `state` and `porting-events` are `hot-mutex` rank 60 with record `<fgosDir>/locks/state.hot`. No row for 58 or 70, no `<eventOpenRoot>` template. Git phase 01 also edits this file and its schema (owner `git`, `activation-v2`, `repo-config`).

## 4. Seal triggers: hook points

`endSession` (`src/runner/session.mjs:385`), runner loop (`src/runner/loop.mjs`), gateway stop (`src/runner/gateway-control.mjs`), command entry/exit (`bin/fgos.mjs`). `session.mjs` and `loop.mjs` are owned by Git phase 07 later.

## 5. Git plan interface versus the Event Store spec

Interface source: [Git phase 01](../261018-0914-git-component-fgos-git/phase-01-publication-port.md#interface-handed-to-the-event-store).

| # | Finding | Severity |
|---|---|---|
| M1 | `walk_commits(repo, tips, cursor, bounds)` has no stop set; ES §11 prunes at certified commits. Without a stop set every catch-up walks to the roots | High |
| M2 | Git landing waits for fences on "both machines"; ES spec §2/§14 says three machines | Medium |
| M3 | No consumer-callable recovery for a pending PublicationCas; ES §10 crash rows require re-publish while Git never re-effects a TargetAttempt | High |
| M4 | `push_refs` receipt must name a non-fast-forward rejection as a typed result (ES §14 step 4) | Medium |
| M5 | ES doctor `event-store-refspec` and `event-store-git-version` overlap Git's `git-publication-refspecs` and the Git floor; no read fact is exported for reuse | Medium |
| M6 | No Land consumer-policy hook for "seal before land" and `store.promote` (ES §7, §20) | Medium |
| M7 | Interface `write_commit` omits the date that requirement 9 names; ES needs it for deterministic seal commits | Low |
| M8 | `resolve_repo` spawns git; ES must resolve the open root outside the Work gate | Low (ES-side rule) |

Git 01's single-load marker, one ABI row (D3), `ensure_fetch_mapping` and namespace grants match the ES spec.

## 6. Environment

Impact analysis: `fgos tool query --capability impact-analysis` reports `gitnexus` registered with status `unknown`; posture **degraded**. Dispatch for red-team reviewers: `fgos dispatch decide --for red-team --needs-soul --has-live-task-access` returns `in-process`.

## Unresolved

- Number of machines that hold a writing clone today (board shows two landed; spec says three).
- Porting truth is tracked at `docs/distillery/state/porting/{events.jsonl,state.json}` (found by the red team), exported as `forgent/state/porting-store` (`package.json:50`).
