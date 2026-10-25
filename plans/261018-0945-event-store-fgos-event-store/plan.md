---
title: "Event Store fgos-event-store: implement the signed D-ADR0055 spec"
description: "Build the Rust fgos-event-store crate and its Node facade in the combined addon, publish sealed events through Git's Publication port on per-machine refs, then cut Work and porting over in one stop-everything change on every machine and workspace."
status: completed
priority: P1
effort: 272h
branch: main
tags: [event-store, rust, napi, git, holder-lock, work-state, migration, critical]
blockedBy: [261018-0914-git-component-fgos-git]   # phases 03-08, 11 wait for Git 01 and 05
blocks: []   # Git 07 and 08 wait for ES-11 and ES-05 by phase edge, see Cross-plan dependencies
created: 2026-10-18
---

> **Status 2026-10-25: completed.** Phases 09–11 are done. Work and porting cut over on all three machines on 2026-10-24: fg-server2 at 20:58 (grant `51bee6b53`), fg-server at 21:58 (IDENT) and design-lap forgentX at 21:45 (SEAT); revision `af617cb5…` on each. The owner confirmed on 2026-10-24 23:3x that the other projects are done too. Fixes after the cutover landed: `55018b032` (merge hook, legacy-layout check, F17), `7349fe1e0` (`fgos events import-legacy`), `0a5143717` (a moved clone keeps its store id) and `work/close-out` (admission mirror proof, quiesce test). What remains is in "Hand-offs received for after the cutover": the stray-shard import runs on fg-server and design-lap, and H33 with D4–D7, D13 and D14 at the fence release. Further Event Store changes (HARDEN 04b) are reviewed by `lead:ES`.
>
> **Status 2026-10-22.** Phases 01–08 are done on main:
> - crate, open log, reader, seal through Git's Publication port, sync, Node facade, verbs, migration export;
> - power loss 20/20; forge probe PASS; V-EVENT held.
>
> Phases 09–11 (Work and porting cutover, proof gate, landing and rollout) were handed by the owner on 2026-10-22 to the WORK lane agent (board row WORK). The GIT/ES coordinator reviews its Git-side edits.

# Plan ES: the fgos-event-store component

**Approved by the owner 2026-10-18 11:44 (Asia/Saigon).** Writer machines: two, the owner machine (workspaces forgentX, mdview, mcp-skill-hub) and the second machine (`~/projects/forgent`). The third machine runs no fgOS today; if it starts, it activates the then-current release and is added to the landing list before any cutover.

## Sources (binding)

- [Event Store spec](../../docs/platform/event-store/spec.md), signed D-ADR0055, amended 2026-10-18 with the Git G0 signature. This plan implements it and never redesigns it.
- [Git spec](../../docs/platform/git/spec.md) §4 Publication port, §7 cutover grant, §12 ordering (D-ADR0057); [Git plan](../261018-0914-git-component-fgos-git/plan.md) phases 01, 05, 07, 08.
- [Holder-lock spec](../../docs/platform/holder-lock/spec.md) §6, §7, §9, §12; [component boundary](../../docs/platform/component-boundary.md); [work-state spec](../../docs/specs/work-state.md); [platform foundations](../../docs/platform-foundations.md) L3, L7, L10; [design principles](../../core/instructions/design-principles.md).
- Evidence: [V-SPAWN-01](../reports/experiment-261017-1431-event-store-v-spawn-01.md), [model check](../reports/experiment-261017-1527-event-store-model-check-reader-seal.md), [corrected model check](../reports/experiment-261017-1545-event-store-model-recheck-corrected.md), [V-REF-01](../reports/experiment-261017-1527-event-store-git-ref-mechanics.md), [proof fold](../reports/review-261017-1538-event-store-proof-fold-verdicts.md); [scout](../reports/scout-261018-0951-event-store-plan-census.md); [red team](../reports/red-team-261018-0951-event-store-plan.md).

## Scope challenge

- **Existing code reused:** holder-lock in-process `acquire` and `guarantee`; the `state` and `porting-events` hot mutexes (`withStateTx`); Git's Publication port, `resolve_repo`, `ensure_fetch_mapping`, cutover ScopedCommit and combined addon (Git 01, 05); setup/doctor registries; the legacy order of `replay.mjs:870-891` (ported, not rewritten).
- **Requested scope:** everything the signed spec requires (no `--yagni`). Mode HOLD SCOPE.
- **Complexity:** one crate, one addon module, one Node facade, contracts; about 30 Node and 2 Rust files switch at the cutover. Every addition is named by the spec, except those reported in D8-D13 and D16-D20 and the extra model re-check of phase 03, which fill gaps without changing the protocol.

## Plan decisions

| # | Decision | Why |
|---|---|---|
| D1 | No in-memory double of the Publication port. Pure logic (bytes, Kahn sort, deferral, walk over an abstract commit graph) is unit-tested alone; every test that touches a ref runs the real port on a real temporary repository. ES-01 and ES-02 need no Git code; ES-03 to ES-05 may start coding on Git 01's pushed API stubs but pass validation only after Git 01 merges. | Spec §8 "tests use real temporary repositories"; §3 no git driver in the crate; AGENTS L5 green from real behavior. |
| D2 | Crate `fgos-event-store` at `packages/event-store/rust`, contracts at `packages/event-store/contracts/`, addon module `event_store.rs` in Git's `packages/git/node-addon/` (Git D2 slot), Node facade `src/event-store/`. | Spec header, §17; Git D2. |
| D3 | Locks are taken in process through `fgos_holder_lock::port::acquire` with one path function, as observe and distribution do (`packages/observe/rust/src/store_lock.rs:46-64`); a contract test pins names, ranks and paths to the registry rows. `seal`, `sync` and `sealAll` take the caller's held ranks as a **required** argument (plus `hotLockDepth()`), refuse `event-store-seal-under-state` under `state`, and `lock-order-violation` when any held rank is ≥ 58. Callers that hold a rank-80 leaf (for example `endSession` under `sessions`) seal after releasing it. <!-- Red Team: lock order --> | Spec §4; Git spec §5 "a fresh Rust scope must not hide the Node caller's held locks". |
| D4 | The open root is resolved once per process through Git `resolve_repo`, before any gate (prefetched like `mainFgosDir`); in-gate `append`/`read` take the resolved root and make no git call. | Spec §8, §13, §17; `resolve_repo` spawns git. |
| D5 | Canonical JSON: JCS rules (UTF-16 key order, ECMAScript number form, UTF-8, one trailing newline). Default: extract a leaf crate `fgos-canonical-json` (Q1). The two existing serializers are not equivalent (distribution sorts by UTF-8 bytes and prints `serde_json` numbers), so ES-01 first proves distribution's digest is unchanged on every staged release manifest; otherwise distribution stays put and an item records it. | Spec §6; design principle 1; RUL11; red team. |
| D6 | Seal and merge commits are deterministic: commit date = `ts` of the segment's last event in whole Unix seconds, clamped to 0 when that second is negative (Git rejects negative dates; decided by the big lead 2026-10-18 16:45, event bytes and hashes unchanged); merge: the later parent date. Every CAS attempt uses a fresh Git operation id. A crashed PublicationCas never stalls later seals: Git amendment A1 was accepted and signed as D-ADR0058 (2026-10-18) and is implemented in the Publication port (rule 4a supersession, rule 4b abandoned-before-attempt). |
| D7 | Branch, local and promote mechanics ship complete although no consumer registers a `branch` type. "Seal before land" and `store.promote` are Work's consumer policy: the Work Land caller (`src/runner/merge.mjs`, phase 09) seals `project` before Git Land and promotes after it; Git exposes no hook and never calls the Event Store. | Spec §4 (Git imports no consumer), §7, §20; Git spec §9 consumer evidence. |
| D8 | Verb, doctor, setup and config rows are registered only by the cutover change (ES-09). Bodies and tests merge earlier, dormant. `migrate` runs the three setup-fix bodies itself first, so it works before any `fgos setup` of the new release. | Mission #1 projects; one switch; red team (runbook order). |
| D9 | Porting's project-scope stream is `project:porting`; Work keeps `project`. ES-08 censuses porting directories in every workspace; one directory per repository keeps one stream, more than one stops for the owner. The public export `forgent/state/porting-store` keeps its API; `dir` names only the view location; CHANGELOG states it. ES-10 adds a clarifying row to spec §5 (no protocol change). | Owner confirmation in spec; `package.json:50`; red team (porting truth at `docs/distillery/state/porting/`). |
| D10 | Migration door is `fgos events migrate [--check]`, run per repository. Before migration, a new release serves Work and porting **reads** from the tracked legacy files through the Rust legacy order (read-only) and refuses **writes** with `event-store-migration-required` (Q6). A fresh clone refuses Work writes with `event-store-refspec-missing` until the refspec exists and the pinned legacy ref (D18) is present. | Spec §3, §18; mission #1; red team. |
| D11 | Shape of the cutover commit is Q5. Default (spec-faithful): one commit, the code change materialized by a Git ScopedCommit `sourceCommit` mode (M9) and judged by the hook from HEAD's tree, never by the hook the commit brings. That default needs Git amendment A2; answering Q5 with (a), two commits, removes the need for A2. `migrate` has no `--include-from`; the include runs only through the cutover runbook route. | Spec §18 step 5; Git spec §7; red team (second landing door, hook self-authorization). |
| D12 | Work stages its gate's events and every other transaction effect (claim write and unlink, view write); after the gate's one `append` is acked, the staged effects apply in order. A refused append applies nothing. The returned event objects get `origin`, `seq`, `h`. In-gate code reads only `tx.view` (cached view plus the in-gate tail fold), never `readRawEvents`/`currentView`. `seq` changes meaning; CHANGELOG says so. | Spec §9, §13 step 2 order; `store.mjs:1361-1380`, `runtime-coordination.mjs:281`. |
| D13 | Opportunistic `sealIfDue` runs at command start (before any gate, `try`) and end; opportunistic `sync` runs at command end only, after the result is written, only in sessions of the main checkout's own user (never dispatched workers), with Git's non-interactive Remote context. Explicit verbs wait. | Spec §14, §16; Git spec §4 (Remote authorization). |
| D14 | Proof order: items 1-4, 6-8 (parts a and b), 11-13 of §23.2 gate the cutover landing; item 5's real-forge step gates it too (Q3); item 9 needs linux-x64 for landing and Git D11's windows-x64 build for acceptance; item 10 gates acceptance, not landing (Q4). | Spec §23.2. |
| D15 | Platform: the facade refuses on non-Linux (`event-store-unsupported-platform`). After the cutover Work verbs on Windows refuse; CHANGELOG says so. | Spec §22. |
| D16 | The hook's tsk-1i3 line-count guard is removed at the cutover (Git spec §7: the retired event-monotonicity guard); the four tracked observe `.jsonl` files go to the separate `.fgos` inventory item spec §19 names, recorded on the board. The hook gains a refusal of **added** event paths (`A` filter). The `.fgos` strip rule stays (spec §19, §25), although the brief listed it. | Git spec §7; Git plan line 79; red team. |
| D17 | Verification of fetched content, inside spec §11 "verified": a seal's `machineId` must equal its ref's machine-id segment; every event's `origin`/`stream`/`scope` must equal its seal header; only `project` scope on `events` refs; a mirror commit that claims this store's own origin above its receipt is `event-store-ref-tampered`; a mirror tip that is not a descendant of the previous one is `event-store-mirror-rewound` (doctor fails, cache kept). Threat model: guarantees hold against fgOS's own writers and remote accidents; a pusher with write rights to the remote can still add a new origin, as they can push to `main` today. | Spec §11, §14; red team (foreign refs). |
| D18 | The cutover commit adds a tracked file `.fgos/events` (not a directory) holding `{legacyRefOid, sealDigest, fromCommit}`. An old release fails creating `.fgos/events/<shard>` (`ENOTDIR`) on every clone that pulls; readers and doctor accept `refs/fgos/legacy` (own or mirror) only at that OID. Main is pushed before the legacy ref. | Holder-lock §12 (old binaries fail loudly); red team (legacy authenticity, fence). |
| D19 | `store.json` records the canonical common dir and its `dev:ino`; a mismatch with the resolved repository refuses `event-store-store-moved` until `fgos events status --confirm-move` or a re-mint for a copy. | Spec §5 (one store id per clone); red team (copied clone). |
| D20 | `eventStore.remote` keeps its spec default and merge rule; the pinned remote URL is the one Git's RepositoryConfig `ensureFetchMapping` records in its provenance when it writes the mirror refspecs (Git phase 01 req 20, read through `fetchMappingProvenance`, req 13a); the Event Store never writes git config itself (one door: RepositoryConfig is the only config writer). `sync` refuses and doctor fails when the effective remote URL differs from the recorded one until setup re-runs `ensureFetchMapping`; `status` prints the URL. | Spec §21; Git spec §3 RepositoryConfig; red team (tracked config chooses the push target). |

## Phases

| Phase | Name | Depends on | Git edge | Model | Effort |
|---|---|---|---|---|---|
| 01 | [Crate foundation, envelope, registry, baseline bench](./phase-01-crate-envelope-registry.md) | — | none (runs before Git 01) | sonnet, opus review | 24h |
| 02 | [Open log, batch framing, recovery, lock rows](./phase-02-open-log-and-locks.md) | 01 | none; registry file rebases on Git 01 | opus | 26h |
| 03 | [Reader, coverage walk, order, cursor](./phase-03-reader-order-cursor.md) | 02 | Git 01 merged; M1 | opus (+ fable model re-check) | 30h |
| 04 | [Seal through the Publication port, reader-versus-seal stress](./phase-04-seal-publication.md) | 03 | Git 01; M7; owner decision on Git amendment A1 (M3) before merge | opus | 34h |
| 05 | [Sharing across machines, sync core](./phase-05-sharing-sync.md) | 03, 04 | Git 01; M4 | opus | 20h |
| 06 | [Node facade in the combined addon](./phase-06-node-facade-addon.md) | 02-05 | Git 01 lane B (addon) merged; Git E3 verdict | sonnet, opus review | 22h |
| 07 | [Verbs, setup, doctor, config](./phase-07-verbs-setup-doctor.md) | 06 | M5 | sonnet | 24h |
| 08 | [Migration and rollback export](./phase-08-migration-rollback.md) | 03, 06, 07 | commit step: Git 05 merged | opus | 22h |
| 09 | [Work and porting cutover change](./phase-09-work-porting-cutover-change.md) | 06, 07, 08; 4.3-S landed | — | sonnet, opus review | 40h |
| 10 | [Proof gate and docs](./phase-10-proof-gate-docs.md) | 09 | Git D11 build for item 9 | opus | 20h |
| 11 | [Cutover landing and rollout](./phase-11-cutover-landing-rollout.md) | 10; Q2 list | runbook step 0 (Git 05 release activated by us), Git 01 fences on every listed machine, M2, M8, M9 or Q5 (a) | opus (big lead) | 10h |

```text
01 ──> 02 ──> 03 ──> 04 ──> 05 ──> 06 ──> 07 ──> 08 ──> 09 ──> 10 ──> 11
            ▲ Git 01 (M1)  (M3,M7)                   ▲ Git 05          │
            └────────────────────────────────────────┘                 └──> Git 07 (waits for 11)
                                         05 V-EVENT green ─────────────> Git 08
```

Parallel lanes: 01 lane B (bench) runs beside everything; 06's addon skeleton may start after 02; 07 and 08's import/parity parts may run beside each other after 06. File ownership is disjoint per phase file.

## Cross-plan dependencies and collisions

| Edge | Rule |
|---|---|
| ES-01, ES-02 before Git 01 | Allowed: no git access. ES-02's registry edit lands second and rebases on Git 01 lane B. |
| ES-03/04/05 after Git 01 | Real port only (D1). Mismatch rows below go to the Git leads before ES-03 starts. |
| ES-06 after Git E3 | Git measures E3 only after the owner commits `e3-budgets.md` (Git Q4); ES-06 waits for that verdict. |
| ES-06 after Git 01 lane B | Adds `event_store.rs` and one dependency line to `packages/git/node-addon`; never a second addon. |
| ES-08 commit step after Git 05 | Needs `cutoverGrant` and the hook grant on main, and Git 05's release active on the workspace (`internal git-grant-check`). |
| ES-11 step 0 | The big lead builds and activates a release containing Git 05 (hook grant route) on every workspace before the cutover; Git merges 05 dormant, so no Git landing does this. |
| ES-11 before Git 07 | Git 07 waits for this cutover on every workspace (Git spec §12); target date with Git D10: cutover by 2026-11-10, Git 07 release 2026-11-13. |
| ES V-EVENT green before Git 08 | ES-05's `v_event` test run id is published for Git 08. |
| Shared files | `lock-registry.v1.json` and schema (Git 01), `src/setup/registrations.mjs`, `CHANGELOG.md`, `bin/fgos.mjs`, `src/runner/merge.mjs`, `session.mjs`, `loop.mjs`, `main-fgos-checkpoint.mjs`, `.githooks/pre-commit` (Git 05, Git 07), `packages/git/node-addon/**` (Git). Land second means rebase; Git 07 rebases on ES-11. |

Interface mismatches to settle with the Git leads (not owner questions). ES phases that need a row do not merge until it is settled:

| # | Mismatch | Needed | Git phase | Blocks ES | Git answer (2026-10-18) |
|---|---|---|---|---|---|
| M1 | `walk_commits` has no stop set | `stop: [Oid]` (not descended, not interpreted) and each commit with ordered parents and tree id | 01 | 03 | Accepted: Git [phase 01](../261018-0914-git-component-fgos-git/phase-01-publication-port.md) req 9 and interface (`stop`, ordered parents, tree id) |
| M2 | Git landing fences "both machines" | the machine list of Q2, shared by both plans; `fgctl` and fence on every listed machine | 01 landing | 11 | Accepted: Git phase 01 step 14, phases 04 and 08 landing and execution model use the Q2 list; Git 01 landing waits for Q2 |
| M3 | a crashed PublicationCas returns `recovery-required` forever (`docs/platform/git/spec.md:287`) | Git resolves an own-ref PublicationCas as superseded once a later receipted CAS of the same ref exists; the ES never waits on it | 01 | 04 | **Not accepted as a decision: needs a Git spec amendment**, A1 in the [Git plan](../261018-0914-git-component-fgos-git/plan.md#spec-amendments-needed-before-git-phase-01-freezes-its-interface). Inside the signed text only the equal-`next` case resolves (deterministic retry, `effectObservedOnly`); the owner decides A1 before Git 01's interface freezes and before ES-04 merges |
| M4 | non-fast-forward push not typed | `push_refs` result `rejected-non-fast-forward` | 01 | 05 | Accepted: Git phase 01 req 9 (typed push results, non-interactive transport) |
| M5 | refspec, floor and config facts not exported | read-only facts for configured fetch refspecs, the Git floor verdict, `fgos.machineId` and the remote URL | 01 | 06, 07 | Accepted: Git phase 01 req 13a; remote URL pinned through `ensure_fetch_mapping` provenance (req 20) instead of an Event Store git config write |
| M7 | interface `write_commit` lacks a date | explicit date argument (Git 01 requirement 9 names it) | 01 | 04 | Accepted: Git phase 01 req 9 and interface |
| M8 | no bound on WAL records and pins per seal | compaction of terminal PublicationCas records and pin cleanup within Git §10 rules; ES-04 measures growth over 10,000 seals | 01 or 06 | 11 | Accepted in Git phase 01 req 12a: terminal chains compacted to one ledger line each, pins released; bounded per seal, not constant (the spec keeps every id non-reusable); crashed records only through A1 |
| M9 | no Git door materializes a reviewed commit's bytes into the main checkout | ScopedCommit `sourceCommit` mode under main 50 with the hook run from HEAD's tree (only if Q5 stays at its default) | 05 | 08, 11 | **Not planned: needs a Git spec amendment**, A2 in the Git plan; Git recommends Q5 (a), which needs no Git change |
| M10 | `components.nativeAddon` optional until Git 07; spec §23.2 item 9 needs activation to refuse a payload without it | required from the release that carries ES-09, or an ES activation check | 01/07 | 10 | Accepted: Git phase 05 req 7a, `fgctl` refuses a linux-x64 candidate without the addon from Git 05's release; windows-x64 required at Git 07 |

## Hand-offs received for after the cutover

| Item | From | What | When | Source |
|---|---|---|---|---|
| H33 | HARDEN (`claude-p74h@fg-server2`), owner 2026-10-24 20:00 (T3-04a decisions 30–32) | Delete the legacy `work.friction` fence: `run_lazy_migration`, `LegacyFrictionSource`/`LegacyFrictionRecord` (`packages/work-state/rust/src/legacy_friction.rs`), `fgos friction migrate`, `wiring/friction_sources.rs`, doctor row `observe-friction-migrated` (`checkObserveFrictionMigrated`) and its tests, the `.fgos/observe/.lock/TOMBSTONE` fence; about −780 lines Also at the same fence release (HARDEN 04b arbitration `e67c5c02e`, `plans/reports/council-261025-0057-harden-t3b-arbitration.md`): D4 HEAD legacy path, import and migrate in `legacy_import.rs` (about −660); D5 rollback export (about −250, the owner's one-release rule decides the timing); D6 the `events migrate` verb (about −290); D7 `decodeLegacyFiles` and its twins; D14 the `door.test.mjs` reader census for retired files (one release after the fence). D13 (`settle-host-proof.mjs`, `settle-fault.py`) goes after the §23.2 candidate run. The stray-shard `import-legacy` lands and runs on fg-server and design-lap **before** D4 and D6 delete the import path. | One release after the Event Store cutover (fences live one release). Before it, HARDEN's T3-04a takes the lazy migration off the friction write path, after the cutover; HARDEN announces it | [council](../reports/council-261024-1947-harden-t3a-arbitration.md) §5 |
| H31-A test | WORK's own follow-up from reviewing HARDEN's H31-A (`c42f30dc1`), 2026-10-24 21:20 | Owning proof that a migrated write admission is refused with refspec-missing when a `refs/fgos/remotes/<remote>/legacy` mirror differs from the pin, next to `tracked_fence_without_fetched_legacy_is_refspec_missing` in `tests/reader_review_regressions.rs` | Next WORK code wave | HARDEN 04b inputs `bc5f37187` |
| Import stray shards | Owner 2026-10-24 22:1x chose (a) | `fgos events import-legacy --file <shard>`: replay an untracked legacy shard through the existing Work write door, keeping item ids and payloads, skipping events already in effect, with tests and review. Parked files: fg-server 1 shard (13 `work.add` of MAIL), design-lap 8 shards, under `.fgos/runtime/tmp/landing-es-cutover-261024/untracked-events/` | **Landed 2026-10-25 07:40 on main `7349fe1e0`** (TEST APPROVED). Runs on fg-server (IDENT) and design-lap (SEAT) per the other-machines guide, after the follow-up upgrade; each posts counts and receipt sha256. **Done on both:** fg-server 13/13 imported (board 2026-10-25 10:25), design-lap 8 shards (board 11:35) | board 22:00, 21:58 |
| Land pre-cutover worker branches | TEST F17 item 3; owner 2026-10-24 23:3x: "3 máy sync hết rồi, các project kia xong hết rồi, không cần chuyển" | **Dropped.** No machine or project still needs a pre-cutover worker branch to land; the two proofs are retired as behaviour removed (`2b1cb9d24`). The two local branches with legacy shard changes (`fgw/retro-loop-docs-260802`, `fgw/tsk-47e`) are not landed by the runner; their owner strips `.fgos` by hand if they are still wanted | closed | TEST plan F17 |
| Dead union settlement | TEST F17 close, 2026-10-24 23:50 | **Closed, kept (2026-10-25 02:45):** not dead. Three `test/runner/merge.test.mjs` proofs (tsk-2xg `:766`, tsk-4gi `:824`, `:888`) declare their own `merge=union` on a tracked `.fgos` log and own it. In production any project that declares `merge=union` on a tracked `.fgos` file reaches it. Only the event-shard union line was retired. Retiring the general mechanism would be a product question for the owner | closed | TEST plan F17 |
| RT2 store move | HARDEN 04b arbitration `e67c5c02e`; WORK decision 2026-10-25 01:10 | Keep the store id on a move (spec rule): accept when the store's recorded id and machine id still match, refuse by name only for a differing machine id; drop the shared-machine-id advice from the spec unless it gets a real verb. Tests for `mv` and a changed machine id | **Landed 2026-10-25 on main `0a5143717`** (HARDEN MERGE) | `plans/reports/council-261025-0057-harden-t3b-arbitration.md` |
| 04b proposals | same | Read-verb sync handed to the detached child: accepted, HARDEN implements, WORK reviews. S-1 fsync reduction: owner question (owner 10-23 kept fsync unchanged), with the power-loss driver as evidence. Hot lock: not accepted as stated; WORK reviews a proposal moving the view rewrite after the lock release behind a revision check **Owner 2026-10-25 09:1x:** Part A approved, HARDEN self-lands after WORK reviews each change; Work stays Linux-only (backlog item for macOS when a Mac exists); secrets: owner 10:02 superseded "a+c" with "2" (docs only: the manual remedy is to revoke or rotate the secret, ES spec Known limits, HARDEN `d14bee0f5`; masking design kept as backlog `p-nykfevjxqf` for when the `secrets` door gets a production consumer); S-1 dropped, fsync unchanged. | HARDEN / owner | same |
| Cutover findings on design-lap | SEAT, board 2026-10-25 12:58 | Filed as backlog items, not kept in the closed WORK lane (owner 13:30 lane-closing rule): `p-aot44rcjaf` migrate `--check` misses an ignored fence and an empty legacy file, `p-hxpt42sf2w` quiesce matches writers by command line (holder-lock `quiesce-scan` and `fgctl upgrade`, not Event Store; owner 16:37 gave it to HARDEN, `lead:ES` reviews the migrate side), `p-wheblpunzi` `fgos setup` overwrites a newer project skill (not Event Store); owner 16:4x gave it to HARDEN too, and told `lead:ES` to do `p-aot44rcjaf`; `p-aot44rcjaf` landed on main `4a1e35288` (TEST, OPC). Only `p-aot44rcjaf` is `lead:ES`'s | Proposed; owner picks | board 2026-10-25 13:4x |

## Execution model

- **Doors:** each phase lead runs through `fgos workflow start --units <phase units file>` or `fgos run "<brief>" --provider <id> --writes <owned paths> --worktree <linked worktree>`, after `fgos dispatch decide`. No raw CLI session acts as a lead.
- **Branches and worktrees:** `es/pNN-<slug>`, worktree `.claude/worktrees/es-pNN`, from main at phase start. ES-09 stays on its branch until ES-11.
- **Commits:** the runner commits only each unit's declared writes. Big lead `forgentx-95` merges to main, runs the gates, updates the board's ES row at phase start and end.
- **Models:** table above; reviewers `opus`; a model re-check of a changed protocol rule runs on `fable` through the architecture capability (ES-04).
- **Landing:** ES-01 to ES-08 merge dormant (no production caller). ES-11 is the one stop-everything landing (holder-lock §12) across every machine and workspace; the owner picks the hour.
- **Machines:** every machine of Q2 is reached before the cutover; before a machine is retired it runs `fgos events sync` until `fgos events status` shows nothing unpublished.
- **Impact analysis:** `fgos tool query --capability impact-analysis` reports `gitnexus` with status `unknown` (2026-10-18 09:50), posture **degraded**. Each phase reruns the query; with a fresh index it runs `impact` on edited symbols and `detect_changes` before commit; otherwise callers are cross-checked with `rg` and blast radius is marked unconfirmed.

## Acceptance

1. `cargo test --workspace`, `cargo clippy --workspace --all-targets -- -D warnings`, `cargo fmt --all -- --check` and `npm test` green on main after ES-11.
2. Every §23.2 item has a real test or recorded run with its verdict (ES-10 matrix); items 1-4, 6-8, 11-13 green before ES-11.
3. Legacy parity: the Work view rebuilt from `refs/fgos/legacy` equals the pre-cutover view byte for byte on every workspace.
4. `rg` finds no git invocation for `refs/fgos/*` outside Git's driver and no reader of `.fgos/events` outside the facade and crate (V-DOOR-01).
5. Doctor green on every workspace with the ten checks of §21 registered; CHANGELOG `[Unreleased]` lists verbs, keys, refspec setup, removed files, `seq` meaning, Windows refusal.
6. 0 process spawns inside the Work gate (`strace`); part (a) p95 ≤ 50 ms at 20 sessions on ext4 (phase 09); part (b) end-to-end claim, move, settle p95 not worse than the ES-01 ext4 baseline (phase 10).
8. Git WAL records and pins stay bounded over 10,000 seals (M8); an old release fails loudly on a migrated clone (D18).
7. Component-boundary row for Event Store present; spec implementation status updated.

## Traceability (spec section → phase)

| Spec | Phases |
|---|---|
| §1 purpose, §2 decisions | all; agent defaults as config (07) |
| §3 ownership, §4 layering and locks | 01 (crate), 02 (rows 58/70), 04 (port), 06 (facade refusal) |
| §5 identities | 01 (store id, machine id read), 07 (mint fix), 05 (shared id warning) |
| §6 envelope, canonical, v3 rule | 01 |
| §7 streams, scopes, refs, promote | 01 (registry), 04 (refs, promote commit), 03 (blocks), 09 (`project:porting`) |
| §8 open root | 01 (layout), 02 (guarantee), 06 (prefetch), 10 (topologies) |
| §9 append | 02 |
| §10 seal, commit kinds, crash table | 04 |
| §11 reader, walk, in-gate bound | 02 (steps 1-2, bound), 03 (walk) |
| §12 order | 03; conflict reducer rule 09 |
| §13 Work gate | 06 (no spawn), 09 (gate, bounded rebuild) |
| §14 sharing | 05; refspec fix 07 |
| §15 views, cursors, verbs | 03 (cursor), 07 (verbs), 09 (cache) |
| §16 cadence | 04 (seal API), 09 (triggers), 07 (doctor) |
| §17 route, budget | 06 (route), 01 (baseline), 09 (part a), 10 (part b, end to end) |
| §18 migration, rollback | 08, 11 |
| §19 removals | 09 |
| §20 relations | cross-plan table; 03-05 (port); 09 (porting, observe readers); 10 (retired families) |
| §21 setup, doctor, config | 07 (bodies), 09 (registration) |
| §22 limits | 06 (platform refusal), 07 (status listing) |
| §23 proofs | 02, 04 (item 1), 04 (2), 03, 09 (4), 05 (5 local), 08 (6, 7), 09 (3, 8, 11), 07 (13 part), 10 (all rerun, 5 real, 9, 10, 12, 13); model re-check 03 |
| §24-§26, dissent | 10 (status line, decision link); dissent "Git as precondition" closed by D1 |

## Open questions for the owner

**Owner answers, 2026-10-18 10:35 (Asia/Saigon): every recommendation accepted.** Q1 yes, one canonical-JSON leaf crate (the release-distribution serializer moves only if its digests stay unchanged). Q2 the writer list is the three owner machines with workspaces forgent (forgentX on the owner machine), mdview and mcp-skill-hub, as recorded in the earlier landing reports; phase 11 re-scans each machine for `.fgos/installation/activation.json` before the cutover and stops if it finds a workspace not on this list. Q3 probe `refs/fgos/*` on a scratch repository on the same forge first. Q4 the power-loss test runs in the same session as Git E1; the cutover does not wait for it. Q5 (a): two commits in one push; Git amendment A2 is therefore not needed. Q6 reads keep working from the old files, writes are refused with the migrate command. Git amendment A1: the owner chose option 1 (add the supersession rule), so ES-04 merges after the amended Git spec and its re-checks pass.

The questions below are kept as asked.

Each follows `core/skills/_shared/decision-question.md`. Until answered, the plan follows the default.

**Q1. Extract one canonical-JSON leaf crate?**
- *What is happening:* the Event Store needs canonical JSON for `h`; two serializers already exist (`distribution/verify.rs:45`, `run-supervisor/envelope.rs:19`).
- *Cause:* each component wrote its own; a third copy would be scatter (RUL11), and gathering means building a small new crate.
- *Options and cost:* (a) leaf crate `fgos-canonical-json`, move both callers in ES-01 (about 4h more; touches two landed crates). (b) Event Store writes its own and an item records the duplication (0h now, three copies). (c) Event Store depends on `fgos-distribution` (0h; wrong layer).
- *Recommendation:* (a), the default. Same pattern as Git D14.
- *Scope:* one leaf crate and two call sites. Distribution's serializer is not true JCS (UTF-8 key order, `serde_json` numbers); it moves only if its digest is unchanged on every staged manifest, else it stays and an item records it.

**Q2. Which machines and workspaces hold a writing clone today?**
- *What is happening:* the spec's cutover stops writers "on all three machines"; the board shows two machines landed (owner's, `~/projects/forgent`) and three workspaces (forgentX, mdview, mcp-skill-hub).
- *Cause:* a clone left out keeps writing tracked shards that the new reader never reads; D18's tracked fence stops it only once it pulls.
- *Options and cost:* (a) the owner lists every machine and repository with fgOS writers; ES-11 and Git 01's fence step use that list (minutes). (b) the board's list only, accepting loss on an unlisted clone.
- *Recommendation:* (a). This is a hard precondition of ES-11: no cutover without the owner's list. (b) is not offered as a default because it breaks D-ADR0055's own review threshold.
- *Scope:* ES-11 runbook and Git M2.

**Q3. Forge acceptance of `refs/fgos/*` before the cutover (§23.2 item 5).**
- *What is happening:* the first production `fgos events sync` pushes `refs/fgos/events/<machine-id>` and `refs/fgos/legacy` to the real remote; only a local bare remote has been tested.
- *Cause:* the spec requires the owner's authorization for that push.
- *Options and cost:* (a) a scratch repository on the same forge, push/fetch/fresh-clone probe (about 30 min, no change to the real repository). (b) probe on the real repository (exact evidence, leaves a probe ref there). (c) skip and learn at the first sync (a rejection leaves events unpublished but safe).
- *Recommendation:* (a) in ES-10; default without an answer: ES-11 waits.
- *Scope:* one authorization for a push; no design change.

**Q4. Power-loss test (§23.2 item 10) before or after the cutover?**
- *What is happening:* the test needs root and a real ext4 device (`dm-flakey`); agents here have neither. Git Q3 asks the same for E1.
- *Cause:* fault injection needs `sudo`.
- *Options and cost:* (a) run it in the same owner session as Git E1, cutover does not wait, implementation is not accepted until it passes. (b) cutover waits for it. (c) skip; acceptance stays open.
- *Recommendation:* (a), the default.
- *Scope:* timing of one proof; no design change.

**Q5. Shape of forgent's cutover commit.**
- *What is happening:* spec §18 step 5 puts the event-file deletions and the code change in the same commit on main. Git's `cutoverGrant` covers only the `.fgos` deletions, and ScopedCommit stages bytes already in the main work tree; no Git door writes a reviewed commit's bytes there, and the commit edits the hook that judges it.
- *Cause:* the spec was written before Git's door model fixed how main is written.
- *Options and cost:* (a) two commits in one push inside the stop window: the reviewed code commit lands first by the normal door (inert: the new release refuses Work writes until migrated, D10), then the `migrate` grant commit; rollback reverts both. No new Git operation; departs from the "same commit" wording. (b) one commit, as signed: Git adds a ScopedCommit `sourceCommit` mode and runs the hook from HEAD's tree (M9, about 8h in Git 05). (c) one commit made by a raw `git` session of the big lead (a second git writer; refused by the one-door rule).
- *Recommendation:* (a): no new Git door, no self-judging hook, same safety because writers are stopped and the code is inert until migrated.
- *Scope:* forgent's cutover only; other repositories have no code change and make one commit either way. Default without an answer: (b), the signed text. Choosing (a) also removes the need for Git amendment A2 (M9); (b) cannot proceed until the owner signs A2.

**Q6. fgOS projects outside the named workspaces after the upgrade.**
- *What is happening:* fgOS runs on projects beyond forgent, mdview and mcp-skill-hub (AGENTS mission #1). After upgrading, each must run `fgos events migrate` with its writers stopped.
- *Cause:* the new reader reads legacy truth only from `refs/fgos/legacy`.
- *Options and cost:* (a) reads keep working from tracked legacy files (D10), writes refuse with a message naming the command, and doctor explains the stop-everything steps. (b) `fgctl upgrade` refuses a repository with unmigrated legacy files until migrated (a distribution change, about 4h). (c) both.
- *Recommendation:* (a), the default: no blocked upgrade, nothing written until the owner of that project migrates.
- *Scope:* behaviour of the new release in unmigrated repositories.

## Red Team Review

### Session 2026-10-18
**Findings:** 15 after deduplication of 39 (14 accepted, 1 accepted in part; 0 rejected; two turned into owner questions Q5, Q6). **Severity:** 4 Critical, 10 High, 1 Medium. Full table: [red-team report](../reports/red-team-261018-0951-event-store-plan.md).

| # | Finding | Severity | Disposition | Applied to |
|---|---|---|---|---|
| 1 | Crashed PublicationCas stalls every later seal; WAL and pins grow without bound | Critical | Accept | D6, M3, M8, phases 04, 10, 11 |
| 2 | Fetched refs trusted as-is: forged origins, own-id mirror fast-forward, rewinds | Critical | Accept (threat model stated) | D17, phases 03, 05 |
| 3 | Porting truth lives at `docs/distillery/state/porting/`, outside the inventory; public export contract | Critical | Accept | D9, phases 08, 09, 10 |
| 4 | Two-machine default loses events; no fence against old releases | Critical | Accept | Q2 hard precondition, D18, phases 08, 09, 11 |
| 5 | Legacy ref replaceable from the remote and pushed before main | High | Accept | D18, phases 03, 05, 08, 11 |
| 6 | `--include-from` is a second landing door; the commit brings the hook that judges it; no door materializes the bytes | High | Accept, owner question | D11, M9, Q5, phases 08, 11 |
| 7 | Missed readers fail open (attestation guard, eight doc checks); loop appender; legacy provenance | High | Accept | phases 01, 03, 09 |
| 8 | In-gate full readers sent to a facade call that refuses in the gate | High | Accept | D12, phase 09 |
| 9 | Staging events after claim side effects strands claims | High | Accept | D12, phase 09 |
| 10 | Rollback export depends on Node order code deleted in phase 09 | High | Accept | phases 01, 07, 09 |
| 11 | Four `registerConfigDefault` calls on one key overwrite each other | High | Accept | phase 07, 09 |
| 12 | Lock order: seal under `sessions` 80; Rust scope blind to Node ranks; seal held into main 50 | High | Accept | D3, phases 04, 06, 08, 09 |
| 13 | Cross-plan prerequisites unowned: Git 05 activation, required addon, E3, Land hook direction, part (b) budget | High | Accept | D7, M10, phases 06, 10, 11 |
| 14 | Runbook order (migrate before setup), rebase in the stop window, `npm run` resolves the wrong package | High | Accept | D8, phases 08, 10, 11 |
| 15 | Spec departures and smaller defects: start-of-command trigger, `sealOnWrite` per type, D16 guard, copied clone, tracked remote choice, export path checks, worker credentials, double stream registration, lock-row schema, canonical-JSON differences, file ownership, citations, mission #1 projects | Medium | Accept (remote: in part, D20 keeps the spec default and pins the URL) | D5, D13, D16, D19, D20, Q1, Q6, phases 01, 02, 06, 07, 09, 10 |

### Whole-Plan Consistency Sweep
Searched every plan file for stale terms after applying the findings: `--include-from` (only in D11 as "no"), `M6` (removed), "three tracked observe" (now four, D16), "Phase 03 does not merge" (fixed), per-key config defaults (one registration), "both machines" (only in M2's problem text), "comment only" for the hook (now removal), `recovery-required stops` (replaced). Phase dependencies, the mismatch table, traceability and acceptance were re-read against the decisions; efforts still sum to 272h. No unresolved contradiction.

## Validation Log

### Verification Results
- **Tier:** Full (11 phases): the four red-team verification roles plus the planner's own pass.
- **Claims checked:** 71 (file paths, line citations, symbols, behavioural traces): 34 by the planner (`store.mjs:157`, `:249`, `:2132`, `:2141`; `event-log.mjs:186`; `replay.mjs:82`, `:838`; `hot-lock.mjs:58`, `:353`, `:414`; `session.mjs:385-387`; `command-registry.mjs:1405`, `:1417`; `registrations.mjs:193`, `:218`, `:250-256`, `:2079`, `:2174`, `:3879`, `:3902`, `:3940`-`:4133` (8), `:6257`; `merge.mjs:1362`; `claim-port.mjs:120`, `:240`; `bin/fgos.mjs:1410`, `:2908`, `:4177`; `loop.mjs:1018`; `legacy_friction.rs:57`; `enduser-index-generate.mjs:124`; `pre-commit:457`, `:495`; `porting-store.mjs:29`; `runtime-coordination.mjs:44`, `:281`; schema `:40`, `:52`), 37 by the reviewers.
- **Verified:** 67 | **Failed:** 4, all corrected | **Unverified:** 0.
- **Failures corrected:** `docs/how-to/fix-fgos-write-rejected-merge-block.md` does not exist (phase 10 now searches `docs` instead); tracked observe `.jsonl` files are four, not three; the M3 risk row named phase 03 instead of 04; the porting log is at `docs/distillery/state/porting/`, not under `.fgos`.
- **Behavioural traces confirmed:** `tx.append` writes immediately today (`hot-lock.mjs:353`), so staging must also defer `tx.unlink`; `assembleRegistryDefaults` keeps one shape per key; `endSession` holds `sessions` for its whole body; `checkDispatchAttestation` reads `events.jsonl` directly and treats an empty read as skipped.
- **Structure:** `ak plan validate` reports the directory valid. The plan files were written directly to the exact directory the brief named rather than through `ak plan create`, which picks its own timestamp.

### Questions recorded instead of asked
Per the brief, no question was put to the owner during planning. Q1-Q6 carry the decision-template answers and the default the plan follows until answered; Q2 has no default (hard precondition of phase 11).

### Whole-Plan Consistency Sweep
Re-read every phase after the red-team edits: the dependencies in the phase headers match the phase table; every M row names the ES phase it blocks; traceability rows point to the renumbered phases (03 reader, 04 seal); effort sum is 272h; no file is owned by two phases that may run in parallel (06 owns the addon module, 07 then 08 for `event-store-checks.mjs`). No unresolved contradiction.
