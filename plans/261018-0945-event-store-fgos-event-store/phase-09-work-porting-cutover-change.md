# Phase 09: Work and porting cutover change

- **Depends on:** phases 06, 07, 08 merged; 4.3-S landed (`withStateTx` on `state` and `porting-events`, done 2026-10-17). Stays on its branch; lands only through phase 11 as one reviewed commit.
- **Branch / worktree:** first attempt `es/p09-cutover` (deleted 2026-10-25; its two review reports are in `plans/reports/review-261020-1110-es-p09-*.md`); the phase shipped from `work/es-cutover`.
- **Model / effort:** sonnet (advanced) for the mechanical switch and deletions, opus for the gate, the reducer conflict rule and review; 40h.
- **Blocks:** phase 10.

## Context

- Spec §12 (provisional success, reducer conflict rule required before a second store's `project` events fold), §13 (gate steps 1-4, bounded rebuild install, porting gate), §15 (cache and cursor), §16 (triggers), §17 (budget part (a)), §19 (removals), §20 (porting, observe readers), §21 (registrations, CHANGELOG), §23.2 items 3, 4 (Work part), 8, 11.
- Current code: scout §2 table; append sites `src/state/store.mjs` (18), `porting-store.mjs` (2), `src/runner/loop.mjs:1018`; gate `withMainState` (`runtime-coordination.mjs:44`) and `withStateAndRefresh` (`store.mjs:249`); returned `.seq` read after the gate (`store.mjs:1361-1374`, `bin/fgos.mjs` `return`).
- D8 (registration here), D9 (`project:porting`), D12 (one append per gate), D13 (end-of-command triggers), D15.

## Requirements

**Work consumer**
1. Stream contract `packages/work-state/contracts/event-streams.v1.json`: every type Work appends today (census by `rg -n "type: '" src/state/store.mjs` plus knowledge, topic, doc and call events), each `project`; `sealOnWrite` true for status moves, answers, `decision`, gate approvals and land results: `work.move`, `work.gate-approve`, `decision` and `work.outcome` (one flag per type, spec §7; every outcome seals). Registered through the facade's consumer registry with cache `.fgos/cache/state.json`.
2. Gate (§13): before `withMainState`, `prepareStore` and a full catch-up read; inside, `readInGate` and fold, precondition, staged events, one `append` with the cursor, fold, cache write with the new cursor; `catch-up-required` and `event-store-seq-recovery-conflict` leave the gate, catch up (seal for the latter) and retry; `stale-cursor` is a thrown bug. After the gate, `sealIfDue`/`seal` with `try` when a `sealOnWrite` type was appended.
3. Staging (D12): `tx.append` stages events and every other `tx` effect (`writeText`, `writeJson`, `rename`, `unlink`) is staged too; after the one `append` is acked, the effects apply in call order, then the view and cursor are written. A refused append (`seq-recovery-conflict`, `ENOSPC`, `stale-cursor`) applies nothing, so `settleClaim` never unlinks a claim (`runtime-coordination.mjs:281`) without its events. Returned objects get `origin`, `seq`, `h`; no caller reads them inside the callback (test over all 18 sites).
3a. In-gate reads: a census of every read inside `withMainState`/`withStateAndRefresh` callbacks (at least `claim-port.mjs:239-241`, `store.mjs:1115-1143` drift check called at `:1231-1270`, and the `currentView` calls in callbacks at `store.mjs:287`, `:451`, `:464`, `:532`, `:1533`, `:1627`, `:1678`, `:1795`, `:2151`). Each moves to `tx.view` (cached view plus in-gate tail fold) or before the gate; the drift check uses data kept in the view or moves before the gate. A test fails when `readRawEvents` or `currentView` runs while `hotLockDepth() > 0`.
4. Cache: `state.json` keeps view, `revision`, `viewSchemaVersion`; `snapshot` is replaced by the store cursor. Rebuild install outside the gate is accepted only when own-stream positions are current, at most `eventStore.rebuild.maxAttempts` times, then `event-store-rebuild-busy` with the old cache kept.
5. Reducer conflict rule (§12): replay checks each event's recorded precondition (expected status, capacity, existence) against the view it folds into; a false precondition from a concurrent foreign event records `view.conflicts[] {h, origin, reason, against}` and does not apply the event. Deterministic on every machine.
6. Readers move to the facade. Step 1's census searches patterns, not line numbers: `'events.jsonl'`, `"events.jsonl"`, `join(..., 'events')`, every importer of `readEvents`/`readEventsFromByte`/`readAllEventsFromDir`, and Rust `join("events.jsonl")`. Known so far: `readRawEvents`, `rebuild`, `currentView` (`store.mjs`), `claim-port.mjs:120`, `:240`, `bin/fgos.mjs:46`, `:1410`, `:2908`, `:4177`, `registrations.mjs:3879`, `:3902`, `:6257`, `src/report/enduser-index-generate.mjs:124`, `scripts/{verify-fanout-overlap,measure-verify-cost,probe-storytelling-material,regenerate-observe-fixtures}.mjs`, `src/runner/attestation-guard.mjs:29-30` (fails open on an empty read today; moves to the facade with a fail-closed test), the eight doc doctor checks whose sentinel is "`events.jsonl` exists" (`registrations.mjs:3940`, `:3966`, `:4013`, `:4030`, `:4046`, `:4065`, `:4095`, `:4133`; sentinel becomes a facade "store open" fact), and the friction-migration check (`registrations.mjs:6250-6317`, keyed by legacy provenance). The appender `src/runner/loop.mjs:1018` (`executor.dispatch`) goes through the Work gate with a cursor like every Work append. `readAllEventsFromDir` is deleted and `test/event-store/legacy-order-parity.test.mjs` is retargeted to the frozen vectors. Rust: `packages/work-state/rust/src/work_source.rs:472` and `legacy_friction.rs:57` link `fgos-event-store` (resolution through `fgos-git` outside any gate); `packages/work-state/contracts/work-events.read.v1.json` describes the store read.

**Porting consumer**
7. `src/state/porting-store.mjs` writes stream `project:porting` under its own `porting-events` gate, same gate shape; contract `packages/work-state/contracts/porting-event-streams.v1.json`; its legacy log (forgent: `docs/distillery/state/porting/events.jsonl`) is imported and deleted by phase 08. The public export `forgent/state/porting-store` (`package.json:50`) keeps its functions; `dir` now names only where the porting view is cached; CHANGELOG line for external importers (`docs/specs/distillery.md:136-138` updated in phase 10).

**Triggers (§16, D13)**
8. Command start and end in `bin/fgos.mjs` for verbs that open the store (D13): `sealIfDue` with `try` at start (before any gate) and at end; at end only, when the last push is older than `eventStore.sync.intervalSec` (not 0) and the session is not a dispatched worker, `sync` with `try`. Runner loop (`src/runner/loop.mjs`) checks each iteration; `endSession` (`src/runner/session.mjs:385`) calls `sealAll` after releasing `sessions` (80), and gateway stop (`src/runner/gateway-control.mjs`) after releasing its lease (D3).
8a. Land policy (D7): the Work Land caller in `src/runner/merge.mjs` seals `project` before Git's Land and appends `store.promote` for any promoted branch stream after it (no branch type exists yet, so this is tested with a test-registered branch type).

**Removals (§19, L10), each with every consumer moved**
9. `resolveWriterLogPath` (`store.mjs:157`); discovery, legacy ordering for new events, T4 fast path and snapshot (`replay.mjs:838-1037`, up to `serializeView` at `:1039`), keeping `foldEvents`/`applyEvent`; append core `appendEventCore` (`event-log.mjs:186`) and `appendEvent`/`lockOfLog` (`events.mjs`); `repairTruncatedLastLine` and the `fgos repair` verb (`command-registry.mjs:1417`, its route); `src/state/events-jsonl-truncation-guard.mjs`, `scripts/events-jsonl-truncation-guard.mjs`, doctor `events-jsonl-not-truncated` (`registrations.mjs:2014-2081`); `src/state/events-compaction.mjs`, doctor `events-compaction-verified` (`:2084-2176`); the event duty of `src/runner/main-fgos-checkpoint.mjs` and its call on the claim path; the Land event sweep (`merge.mjs:1362-1389`) and the event parts of the `fgos-write-rejected` restore (`merge.mjs:683-1306`); every `.fgos/events` reader of requirement 6.
10. Hook (D16): delete the tsk-1i3 line-count guard (`.githooks/pre-commit:278-339`, `:488-496`); add a refusal of staged **added** paths under `.fgos/events` (`--diff-filter=A`) that exempts exactly the tracked fence file `.fgos/events` the cutover commit adds (D18) and nothing else; the exemption is proven by Git phase 05's P-CUTOVER (implementation part) vector with the Event Store's real commit shape (event-file deletions plus the added fence file, porting-log deletions outside `.fgos`), and a test here shows any other added path under `.fgos/events` refused; the four tracked observe `.jsonl` files go to the separate `.fgos` inventory item (board row). The `.fgos` strip rule and the general `fgos-write-rejected` guard stay (spec §19, §25). If Git 07's mutation allowlist exists by then, its event-file rows are deleted here.
11. Registrations (D8): verb rows and routes for `fgos events sync|status|export|migrate` (`command-registry.mjs`, `command-routes.json`, `test/rust-host/vectors/envelope/version.json`), rebuild store part, the one `eventStore` config default (phase 07), three fixes, ten checks; removal of the two retired doctor rows and of the `repair` route.
12. CHANGELOG `[Unreleased]`: verbs, config keys, refspec setup, removal of tracked event files and `fgos repair`, new meaning of `seq` in outputs, `fgos events migrate` for every project using fgOS, Windows refusal of Work verbs (D15).

**Proofs on this branch**
13. **V-AUTH-01 (§23.2 item 3):** two processes in two worktrees race `moveWork` with the same `expectedStatus`; two items race the last worker slot; exactly one success each; `settleClaim` as today; a refused or killed append on the settle path (`seq-recovery-conflict`, `ENOSPC`, SIGKILL before ack) leaves the claim file and the view unchanged.
14. **V-SEQ-01 Work part (item 4):** a cross-machine concurrent CAS yields the same recorded conflict on three clones; a rebuild racing gated appends installs only when current and stops with `event-store-rebuild-busy` after the bound (N1).
15. **Latency (item 8, part a):** V-SPAWN-01 harness (phase 01) on ext4 at 1, 10, 15, 20 sessions, 200 mutations in 60 s: store increment p95 ≤ 50 ms at 20 sessions, `strace` 0 spawns in the gate window, no exhaustion; lock-convoy profile at 15 and 20.
16. **V-DOOR-01 (item 11):** an architecture test (`test/event-store/door.test.mjs`) refuses any `child_process`, `runBorrowed` or Rust `Command::new` site outside Git's driver whose argv can name `update-ref`, `push`, `fetch` or `refs/fgos`, and any reader of event files outside the facade and crate (the step 1 patterns); `rg` lines below are a quick check only.

## Files

| Family | Files |
|---|---|
| Work gate and cache | `src/state/store.mjs`, `src/state/runtime-coordination.mjs`, `src/state/hot-lock.mjs` (staging in `tx.append`), `src/state/replay.mjs`, `src/state/events.mjs`, `src/state/event-log.mjs`, `packages/work-state/contracts/{event-streams.v1.json,porting-event-streams.v1.json,work-events.read.v1.json}` |
| Porting | `src/state/porting-store.mjs`, `package.json` (`files`: consumer contracts) |
| Readers | `src/runner/claim-port.mjs`, `src/report/enduser-index-generate.mjs`, `scripts/{verify-fanout-overlap,measure-verify-cost,probe-storytelling-material,regenerate-observe-fixtures}.mjs`, `packages/work-state/rust/src/{work_source,legacy_friction}.rs`, `packages/work-state/rust/Cargo.toml` |
| Triggers and Land policy | `bin/fgos.mjs`, `src/runner/loop.mjs`, `src/runner/session.mjs`, `src/runner/gateway-control.mjs`, `src/runner/merge.mjs` (seal before Land, promote) |
| Fail-open readers | `src/runner/attestation-guard.mjs`, doc checks in `src/setup/registrations.mjs` |
| Removals | delete `src/state/events-jsonl-truncation-guard.mjs`, `scripts/events-jsonl-truncation-guard.mjs`, `src/state/events-compaction.mjs` and their tests; edit `src/runner/main-fgos-checkpoint.mjs`, `src/runner/merge.mjs`, `.githooks/pre-commit` (guard removed, added-path refusal, D16) |
| Registrations | `src/setup/registrations.mjs`, `src/cli/command-registry.mjs`, `packages/host-runtime/contracts/command-routes.json`, `test/rust-host/vectors/envelope/version.json`, `CHANGELOG.md`, `test/test-ownership.mjs` |
| Tests | `test/event-store/{v-auth-01,v-seq-01-work,work-gate,staging-returns,staged-effects,in-gate-reads,door}.test.mjs`, `test/runner/attestation-guard-fail-closed.test.mjs`, `test/state/**` retargeted (never weakened) |

## Steps

1. Census of types, append sites and readers on the current tree; publish it in the phase report as the checklist.
2. Work gate, staging, cache cursor, bounded rebuild.
3. Reducer conflict rule with V-SEQ-01 Work vectors.
4. Porting stream.
5. Readers, Rust readers, scripts.
6. Triggers.
7. Removals and registrations; retarget tests that asserted the file layout (label each kept, retargeted or retired with the D-ADR0055 family it belongs to).
8. V-AUTH-01, latency, V-DOOR-01; opus review per family; squash to one reviewed commit whose parent is main's HEAD at landing (phase 11 rebases it).

## Validation

```bash
cargo test --locked --workspace && cargo clippy --workspace --all-targets -- -D warnings && cargo fmt --all -- --check
node --test test/event-store/*.test.mjs test/state/*.test.mjs
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<p09 build> npm test
node scripts/event-store/v-spawn-bench.mjs --root .fgos/runtime/tmp/v-spawn-ext4 --sessions 1,10,15,20 --store-increment --strace --out .fgos/runtime/tmp/v-spawn-ext4/cutover.json
rg -n "refs/fgos/" src bin scripts packages apps -g '!packages/git/rust/src/driver.rs' -g '!**/tests/**' -g '!test/**' -g '!*.md'   # expect only non-invocation constants
rg -n "\.fgos/events" src bin scripts packages apps -g '!test/**'   # expect none outside migrate inventory and docs
```

## Risk

| Risk | L × I | Mitigation / signal and response |
|---|---|---|
| Part (a) budget missed on ext4 | Medium × High | Measured here, before landing; a miss stops phase 11 and goes to the owner with numbers (the 50 ms is a proposed default). |
| A retargeted test silently weakens a guarantee | Medium × High | Label list in the phase report; opus review checks each retired assertion belongs to a D-ADR0055 event-file family. |
| Conflict rule changes a view on the single-machine history | Low × High | Legacy parity (phase 08) runs again on this branch; any diff stops. |
| Collisions with Git 07 files (`merge.mjs`, `session.mjs`, `loop.mjs`, `bin/fgos.mjs`) | High × Low | This change lands first; Git 07 rebases (Git spec §12). |

## Rollback

Not merged until phase 11. After landing, rollback is phase 11's.
