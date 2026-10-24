---
title: "WORK lane U2 lead report: review A fixes on the Work write path"
date: 2026-10-22 (Asia/Saigon)
branch: work/es-cutover (rebased onto origin/main b6a399731; U1 commits kept)
status: DONE_WITH_CONCERNS
---

# U2: write-path review fixes

Rebase: `git rebase origin/main` conflicted only on `mutation-census.v1.json` `payloadDigest`; I took main's digest and regenerated the
census with `--write-census` (never hand-edited), committed separately.

## Finding -> change -> owning proof

| Finding | Change | Owning proof |
|---|---|---|
| H1 reducer throws on a legitimate 3-machine history | `foldEvents` (`replay.mjs`): a failed precondition is a recorded conflict (`against` = head or `null`) once any other clone's event precedes it in the order, even when its writer had seen that event. The throw stays only while the history holds one clone's events. The fold tracks the origins it has folded in a lazy `view.origins` list (first-seen order, so identical on every clone). Spec §12 states the boundary. | `work-conflicts.test.mjs`: cascade vector (machines A, S, G, final order G1,E,G2,S,A; three clones, three arrival orders, identical folded view incl. 2 recorded conflicts, item ends `parked`); single-clone case still throws; multi-origin fully-seen failure is recorded. I confirmed the cascade test fails under the previous rule (throws `work-replay-precondition`). |
| M2 clone and double fold in `prepareEvents` | per-id `{exists,status}` map, no `structuredClone(view)`, no fold (the append fold in the gate is the only one) | `work-gate.test.mjs` batch-precondition test (a two-move chain in one batch gets `todo` then `doing`) |
| M3 (decided) precondition set | `expectedStatus` only on `work.move`/`work.step`/`work.stage` (answer is a `work.move`); existence-only on the rest; `work.discovery` (keyed by a discovery id) gets none; `precondition` stripped from folded outcome, discovery and park-resolution payloads. `VIEW_SCHEMA_VERSION` 5 -> 6 (shape changed: `origins`, no leaked field) | same `work-gate` test (per-type preconditions, ghost id, no `"precondition":` in the saved view); `work-conflicts` strip test (retired nothing) |
| M5 (decided) post-ack failure | gate marks `tx.acked` right after the append; `commit()` in `hot-lock.mjs` turns any later failure (effect, cache write, fold) into `event-store-acked-effects-incomplete` carrying `ackedEvents` and `cause`; the gate does not retry it. Code registered in `result-codes.v1.json`, spec §13 | `work-gate.test.mjs`: effect failure and cache-write failure after ack, callback runs once, batch durable |
| L1 retry budget | `MUTATION_ATTEMPTS = 5` and code `event-store-catch-up-busy` (registered, spec §13); `rebuild.maxAttempts` and `event-store-rebuild-busy` stay for rebuild installs only | `work-gate.test.mjs`: loses the race more than `rebuild.maxAttempts` times, ends with the new code |
| L2 `tx.eventStore` | deleted; dead `eventStore` args dropped from `facade.test.mjs` and `gate-probe.mjs`; the gate stopped passing it | `hot-lock-tx.test.mjs`: no event store door on a tx. `facade.test.mjs` line asserting `tx.eventStore === store` removed (behaviour removed) |
| L3 `tx.exists`/`tx.list` | read guard; `list` returns files only (`withFileTypes`), staged writes/unlinks still overlaid | `hot-lock-tx.test.mjs` read-roots + files-only test |
| L5 config source | `prepareWorkStore` and the gate default read config from `path.dirname(mainFgosDir)`; `readSharedConfigOrEmpty` swallows only `SyntaxError` (parse errors now throw `SyntaxError`, same message) | `work-gate.test.mjs` (linked-worktree config ignored, main's `maxAttempts` used); `shared-config-file.test.mjs` (half-typed file -> `{}`, directory in its place -> `EISDIR`) |
| H23 `withStateTx` finally | a release failure no longer replaces the callback's result or error; on an error it is attached as `releaseFailure` | `hot-lock-tx.test.mjs` (record replaced by a directory: result kept; error identity kept) |

## Tests

Focused, green: `work-conflicts`, `work-gate`, `hot-lock-tx`, `shared-config-file`; U1 owning set unchanged. Cargo: `cargo test --locked -p fgos-event-store` green
(the contract registry generates the Rust `ErrorCode` enum, so adding two codes rebuilt it).

Compared directories `test/state test/event-store test/cli test/intake test/config`: 2722 tests, 2631 pass, **25 fail**, 65 todo.
U1's run (same set without `test/config`): 2690 / 2597 / 26 fail / 65 todo (its table lists 25: 18 + 3 + 3 + 1). **No new failure.** The 25 are the same files:

| Failures | Owner |
|---|---|
| `test/state/replay.test.mjs` (18) snapshot / per-writer discovery of `rebuildView` | U7 |
| `test/state/events-compaction.test.mjs` (3) | U6 |
| `test/state/porting-store.test.mjs` (1, load), `test/state/identity-before-lock.test.mjs` (3) | U3 |

Tests added: work-conflicts +4 net (cascade, multi-origin recorded, strip; single-clone throw replaces the retired "causally observed false preconditions fail closed", whose
successors are the single-clone throw and the multi-origin recorded tests), work-gate +4, hot-lock-tx +3, shared-config +1.

## Delta lines (U2 commit, working tree vs U1 tip)

| | + | - |
|---|---|---|
| src | 76 | 29 |
| contracts + spec | 4 | 2 |
| test | 216 | 26 |

## Census and impact

Hashed files changed (`replay`, `work-event-store`, `consumer-event-gate`, `hot-lock`): census regenerated with `--write-census`. Its check still reports 5 undeclared
`unresolved-binary` sites (`bin/fgos.mjs:3481,3625`, `src/runner/merge.mjs:1216,1246`, `src/runner/worktree.mjs:146`). Those files are byte-identical to `origin/main`, so
the 5 come from main, not from this branch; not mine to declare (GIT lane census). Impact analysis: 0 providers (inactive); callers cross-checked with `rg`:
`tx.eventStore` had one reader (a facade test), `tx.list`/`tx.exists` are used by `runtime-coordination.mjs` and `unlink`, `readSharedConfigOrEmpty` callers
(`gate-kill-grace`, `iron-law-level`, `model-pool-checks`, `event-store/config`) now surface an unreadable config file instead of hiding it.

## Deferred / notes

- Rust `packages/work-state/rust/src/work_source.rs` pins `VIEW_SCHEMA_VERSION = 4` while Node was already 5 (now 6): a pre-existing gap between the Rust reader and Node, untouched (no Rust edit in U2). Whoever ports the Rust view reader must read 6 and the new `origins` key.
- `docs/specs/work-state.md:249` also states version 4; left for the docs pass (stale before U2).
- Multi-origin fully-seen failure is recorded as a conflict (the lead brief's rule). If the owner wants that stricter, it is a one-line change in `foldEvents`.
- H18 (T1 removes `fences.mjs`) not part of U2.

## Unresolved questions

None blocking.
