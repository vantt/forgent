---
title: "WORK cutover proof gate, Work part: parity rehearsal, retired families, docs, section 23.2 matrix"
date: 2026-10-23 (Asia/Saigon)
branch: work/es-cutover (tip before this report: 2474700b1)
host: fg-server2, Linux 7.0.0-38, git 2.53.0, Node 24.22.0
scope: parity (1), retired families (2), docs (3), matrix (4). Performance part (b) and every heavy bench are out of scope and were not run.
---

# Verdict

Green for what this run was asked to prove. Three things stay open and none is a WORK code defect:

1. Parity is exact on all three workspace repositories, but the copies could only be compared by the legacy fold against the new reader (`cacheCompared: false`). The stronger byte comparison against a recorded pre-cutover view needs the real workspaces and must run at the cutover (section 1.3).
2. mcp-skill-hub has no tracked event file in its remote, so its parity is vacuous (0 events). Whether the real workspace on the owner machine holds untracked history is not visible from here.
3. One retired mechanism is not fully gone: the attribute-driven `merge=union` resolution inside `declareStoreFiles` (`src/runner/merge.mjs:767-812`). It becomes inert when a repository's migrate commit removes the attribute. Decision for the owner in section 2.

# 1. Parity rehearsal

## 1.1 Copies

Fresh clones of the git remotes into `/home/vantt/projects/forgent-worktrees/parity/<name>`; the new release's `fgos setup` never ran on any of them.

| Workspace | Remote | HEAD of the copy | Tracked event data |
|---|---|---|---|
| forgent | `https://github.com/vantt/forgent` (this repo's `origin`) | `1882df4ca` (origin/main) | `.fgos/events.jsonl` (24,780 lines), 90 shards `.fgos/events/*.jsonl`, 2 `events.jsonl.backup-*`, `.fgos/state.json`, `docs/distillery/state/porting/events.jsonl` (102 lines) and `state.json` |
| mdview | `https://github.com/vantt/mdview` | `f224b55` | `.fgos/events.jsonl` |
| mcp-skill-hub | `https://github.com/vantt/mcp-skill-hub` (GitHub redirects it to `vantt/skillstation`; the local checkout `~/projects/skillstation` shows `.../skillstation.git` as origin) | `05d75b1` | none (`git ls-files .fgos` is empty) |

Activation scan on this machine: `/home/vantt/projects/forgent/.fgos/installation/activation.json` is the only workspace activation (workspaceId `e9756c489113b5d0`, release `sha256:c91242ea...`, activated 2026-10-23 01:54 UTC). `~/projects/mdview/.fgos` holds only `events.jsonl` (no `installation`), and `~/projects/skillstation` has no `.fgos` at all. Every other `activation.json` found is a test fixture under `/tmp`. The second writer machine was not reachable.

## 1.2 How it was run

`npm --prefix <work-es worktree> run fgos:dev -- events migrate --check` with cwd in each copy, `CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/work-es-target`, `FGOS_STATE_ROOT` pointing at a scratch directory holding only a `machine-id` (so nothing under the real state root is touched). Script: `/tmp/claude-1000/-home-vantt-projects-forgent/2334f2ba-b501-4572-a523-2ed479073a55/scratchpad/parity.sh`.

Two preparation facts a reader of the output needs:

- A first attempt on mdview refused with `event-store-io: Git: git-fence-missing`: the Git WAL needs the controller's activation fence (`.fgos/locks/activation.lock/TOMBSTONE`) that `fgctl` places in an activated project, and a bare clone has none. I wrote that same tombstone file into each copy (the format `test/helpers/git-fixture.mjs` writes); `fgos setup` did not run.
- A second attempt refused with `event-store-writers-active` because my own `grep` pipe had its cwd in the copy; the output now goes to a file.

## 1.3 Output, per copy (the `parity` block verbatim)

mdview (exit 0):

```json
"parity": {
  "equal": true,
  "differences": [],
  "cacheCompared": false,
  "workEvents": 372,
  "portingEntities": 0,
  "revision": "018717756fa4dc7ae2ffafad22f4b49e455e7230bccfbab1f1da1eebcc6bb3a4"
}
```

Plan: `fromCommit f224b557e4ba07e50f7d71c06e6da7f0f55b943b`, deletions `[".fgos/events.jsonl"]`, fence `.fgos/events`, no writes, legacy ref `d1c224e1f8d07dd049fc7a3f91f04840049f9703` (action `create`), data tree `631fd111b6e628fdf57ec1bf8908ee31071d3eb0`.

mcp-skill-hub (exit 0):

```json
"parity": {
  "equal": true,
  "differences": [],
  "cacheCompared": false,
  "workEvents": 0,
  "portingEntities": 0,
  "revision": "a4682ff1face7449dddcd67f507b1527816478e954e5fafa23e3d36ef854d497"
}
```

Plan: `fromCommit 05d75b195bb132197b8e0742cf2356121d83fec2`, no deletions, no writes, legacy ref `83379b57b89ba9b356163c181852c6acc3a0bdf9`, data tree `4b825dc6...` (the empty tree).

forgent (exit 0):

```json
"parity": {
  "equal": true,
  "differences": [],
  "cacheCompared": false,
  "workEvents": 33717,
  "portingEntities": 82,
  "revision": "86de4e944e650693eec315823c9155b21b9013340d54f5ed66c97edf8c500733"
}
```

Plan: 96 deletions (`.fgos/events.jsonl`, the 2 backups, 90 shards, `.fgos/state.json`, and the two porting files), writes `docs/distillery/state/porting/events.jsonl`, `docs/distillery/state/porting/state.json` and `.gitattributes`, fence `.fgos/events`, legacy ref `5ce4089d8aee485877dea31041daa00daabe5022` (action `create`), data tree `1e4da1f8b1837c8b496a4f7bca8b2e59a101c8a3`. Porting is included: 82 entities compared with the porting reducer, no difference.

## 1.4 What the parity does and does not show

- Compared in every copy: the legacy fold (the pre-cutover reducer over the exact legacy files, in `(ts, file, seq)` order) against the new reader over the imported legacy ref, entity by entity and then the serialized view and its `revision`. Porting is folded separately with its own reducer. Result: equal, no differences, on all three.
- Not compared: the previously saved view. `cacheCompared` is false because a fresh clone has no `.fgos/cache/state.json` (and `--baseline <view.json>` was not given). The old release could not produce one: plain `fgos list` in a copy stops with `no .fgos/installation found` (it needs a fabricated activation record). So "byte for byte against the pre-cutover Work view" (spec section 18 step 2 and 4, item 6) still needs a run on each real workspace with its live cache, or a baseline exported from the old release first. This is the cutover step, not a WORK defect.
- Mismatches found: none, so no diagnosis or code change was needed.

The copies were not kept (no mismatch). They are removed at the end of this run (section 6).

# 2. Retired families (spec section 20) against freeze 234

The mechanisms come from the catalogue rows (`plans/reports/research-261017-1032-git-lessons-catalogue.md`, G-ids at freeze 234). "Gone" means no match in `src bin scripts packages apps test core .githooks .fgos`, excluding docs, plans and the changelog, unless stated.

| Family | Ids | Mechanism named by the catalogue | State on this tree | Evidence |
|---|---|---|---|---|
| Tracked event files dirtying checkouts | G-092 | a concurrent event write leaving a half-aborted merge; doctor `no-stuck-merge-abort` | event cause gone. The doctor row stays as the generic `MERGE_HEAD` detector (still registered at `src/setup/registrations.mjs`, tests in `test/setup/checks*.test.mjs`) | no event path in `src/runner/merge.mjs` |
| | G-093 | merge sweep `git add` of dirty event shards (`merge.mjs` `sweepPathspecs`) | gone | `rg sweepPathspecs`: no match |
| | G-120 | checkpoint or merge `git add` / restore of `.fgos/events*`; `checkpointMainFgos`; `events.lock` as a file lock | gone | no match for `checkpointMainFgos`, `getUncommittedEventCount`, `events.lock` in code (the one hit, `packages/host-runtime/.../invocation_service.rs:126`, is an unrelated `self.events.lock()` mutex) |
| | G-029 (part) | the event-file loss through `git add -A` in a worktree | event part gone; stripping `.fgos` from worktrees stays by spec section 19 | `door.test.mjs` census |
| Merges of append-only logs | G-089 | auto-resolve of `merge=union` `.fgos` logs | **residual**: `unionPathsAt` and its use in `declareStoreFiles` (`src/runner/merge.mjs:767-812`) still resolve any conflicted `merge=union` `.fgos` path to the target's bytes. It reads the attribute from the target tree, so it is inert once no path carries `merge=union` | `.gitattributes` in this repo still has `.fgos/events/*.jsonl merge=union`; it leaves with each repository's migrate commit (the forgent plan above lists `.gitattributes` among its writes) |
| | G-121 | three-way line merge of append-only logs; stale shard conflicts | gone: no event file is merged; the same residual code as G-089 covers the shard conflict shape | as above |
| | G-170 | stale worktree overwriting the log; the monotonic-shrink hook policy | gone: `tsk-1i3` guard absent from `.githooks/pre-commit`; the hook now refuses retired event data except the exact fence `.fgos/events`, and (until the fence exists) a commit that leaves a tracked event log shorter than HEAD's | `rg tsk-1i3`: no match; `test/githooks/event-layout.test.mjs` |
| Truncation detection | G-210 | truncation mark, `events-jsonl-truncation-guard.mjs`, doctor `events-jsonl-not-truncated` | gone | file absent; no match for `truncation-guard`, `events-jsonl-not-truncated` |
| | G-211 | per-file sidecar map | gone | no sidecar reader or writer |
| | G-184 (half) | `FGOS_DISABLE_OPPORTUNISTIC_CHECKS` switch that turned the guard off | gone (and `runOpportunisticMainCheckoutChecks`) | no match |
| Event checkpoints and cadence | G-118 | checkpoint commit colliding with the caller's own lock | gone | `checkpointMainFgos` absent |
| | G-212 | time-based fallback checkpoint | gone; config default `checkpoint.fallbackIntervalSec` retired | no match in code (the changelog records that a project keeping the key is untouched) |
| | G-213 | guard failures needing diagnosis; `getUncommittedEventCount` with a 1 MiB buffer | gone | no match |
| File compaction | G-090 | modify/delete conflict of a branch deleting a shard | same residual as G-089 (union path restore); the shard files themselves are gone from product code | as above |
| | G-214 | `events-compaction.mjs`, `moveIntoArchive`, doctor `events-compaction-verified` | gone | file absent; no match |

Reader census (spec section 19 "Direct readers"): `test/event-store/door.test.mjs` "no product file reads the retired event files or imports a reader of them" passes (5/5 in the file; run with the staged addon preloaded, see section 5). `test/state/events-legacy-absence.test.mjs` (the retired contiguity surface) also passes.

Findings from the table:

- **R-1 (owner decision, small):** the union-path branch in `declareStoreFiles` is event-file machinery that outlives its attribute. Options: (a) leave it until every workspace has migrated, then delete `unionPathsAt` and the `union` set in the same change (RUL104: one door, delete the old path); (b) delete it now. It is Land code in `merge.mjs`, outside this run's scope, and removing it before the repository's own migrate commit would change the behaviour of this repository's own merges while the attribute is still present. Recommendation: (a), as an item for the Land/Git lane, after U10.
- **R-2 (stale prose, not a mechanism):** `plugins/fgOS/skills/cleanup-next/SKILL.md:114` still says exit 7 means another process holds `.fgos/events.lock`; the lock is the `state` hot mutex. No source for that file exists under `core/`, so it was not edited.
- **R-3:** the retired-family rows are all gone from code except R-1. The tracked event files and the `merge=union` line in this repo are still here by design (U10 grant commit).

# 3. Docs (U9 list)

Every claim below was checked against code or the config before editing; the language of each file was kept (work-state, reading-map and distillery notes are Vietnamese or English as in the file).

| File | Change |
|---|---|
| `docs/specs/work-state.md` | Intro: truth is the Event Store log, view is `.fgos/cache/state.json`. `fgos init` entry (no log file is created). `fgos rebuild` entry (every consumer, no checkpoint, summary output). `fgos repair` entry replaced by a "removed" note. `VIEW_SCHEMA_VERSION` 6 to 7 (adds `conflicts`, `streamHeads`, `preconditionHeads`). Rebuild section (what changes, `event-store-rebuild-busy`, damaged history is `corrupt-log`). Tool registry bullets (see below). RUL10 note 4 (Event Store cutover). New section "Bố cục dữ liệu, thứ tự và xung đột": layout table, `seq` meaning, recorded conflicts, no resolve verb (you see them in `fgos show <id>` `conflicts` and doctor `work-recorded-conflicts`, then redo the change with existing Work verbs). The `repair` known-gap bullet removed. Pointers: `events.mjs` entry replaced by `work-event-store.mjs`, `consumer-event-gate.mjs`, `event-log.mjs`; the data-file pointer line updated |
| `docs/specs/distillery.md` | Pointers: durable record is the `project:porting` stream, view in `.fgos/cache/porting-state.json`, nothing under `docs/distillery/state/porting/` written, migrate imports and deletes the two tracked files, `porting-log.md` stays tracked. The log resync belongs to `distill.mjs move`, not to the store |
| `docs/specs/reading-map.md` | Event Store entry (status, registered doctor bodies, consumers), `src/state/` entry, work-state log/view entry |
| `docs/platform/event-store/spec.md` | Implementation status line, `Last reviewed`, one stale citation (`command-registry.mjs:1427` to `:1510`), and a dated section "Work cutover proof gate (2026-10-23)" with the item 9 note (npm channel retired, owner decision; the addon is required of the legacy-node payload, activation refuses a linux-x64 payload without it, Work verbs refuse on Windows) and the section 19 note |
| `docs/platform/component-boundary.md` | Event Store row only: consumers are Work and porting (observe and decisions planned), no longer "dormant" |
| `docs/routing-handoff-contract.md` | One cell: "Không tự ghi `.fgos/events.jsonl`" to "Không tự ghi nhật ký sự kiện (Event Store)" |
| `docs/knowledge/.../resolve-an-events-jsonl-truncation.md`, `.../reconstruct-fgos-tracking-state-...-discards-events-jsonl.md`, `.../fgos-participant-contract.md` | A dated "Superseded" banner at the top, in the convention the sibling merge-conflict how-to already uses; bodies kept as records |

Corrections to pre-existing staleness found while editing (not cutover text, but wrong where it was touched): the work-state tool registry bullets said `tool.register`/`tool.remove` events build `view.tools` and that tool status sits beside `events.jsonl`. Code says (`src/state/tool-registry.mjs` header, `replay.mjs:790`) the events are retired, providers are declared in `runner.executors.<id>`, and the status file is `.fgos/runtime/tool-status.local.json`. I corrected those bullets only; the rest of that section was not audited.

Left unedited on purpose:

- `docs/history/**`, `docs/**/verification/**`, `docs/architect/**`, `docs/explanation/*` and the other `docs/knowledge/*` pages that mention `.fgos/events` (about 80 files): dated investigation and decision records, not evergreen instructions.
- `docs/platform/git/spec.md` (Git lane): line 571 is the 2026-10-20 ordering note ("Work retains tracked `.fgos/events.jsonl`") and the catalogue rows are frozen text.
- `docs/backlog.md` (scribing-owned), `docs/specs/runner.md` lines 1780-1786 and 2048 (design reasoning about the old file), `docs/distillery/deep-dives/tool-registry.md:126` (a deep-dive from 2026-07-30).
- `docs/how-to/install-fgos-in-a-project-and-use-doctor.md:325`: already correct (the `event-store-legacy-layout` row).
- Remaining `events.jsonl` mentions in `work-state.md` are historical sections (RUL10 notes 1-3, the Phase 1 fixture name, the 0001 decision history, design history).

CHANGELOG: no line added. Each user-visible behaviour these docs describe is already under `## [Unreleased]` (repair removed, `seq` meaning, `rebuild` output, `fgos events migrate`, recorded conflicts and `work-recorded-conflicts`, npm channel refusal, Windows refusal, removed doctor rows).

The board asks that the DOC lead (`forgentx-5f`) gets the doc paths before merge (`docs/platform/event-store/spec.md`, `docs/platform/component-boundary.md`, `docs/specs/{work-state,distillery,reading-map}.md`). I did not message anyone; the paths are the first column above.

Checks run on the docs change: `node scripts/check-decision-citation-drift.mjs` no findings; `node --test test/runner/dead-vocabulary-guard.test.mjs` 10/10 (it reads `component-boundary.md`).

# 4. Section 23.2 matrix

Sources: "store gate" is `plans/reports/verification-261020-2012-event-store-store-proof-gate.md`; "U8" is `plans/reports/verification-261022-2203-work-cutover-branch-proofs.md`; "this run" is today's focused run (section 5). Unit-run ids are not recorded for the Work proofs; the unit-run id exists only for the store gate's own run (`unit-run-1792501956959-8a9c8098/producer/1`). "Candidate" means a release built from the final tip of this branch.

| # | Item | Proven so far (run / report) | Still needs a run on a candidate |
|---|---|---|---|
| 1 | Kill matrix | store gate, this-run id above: `kill_append.rs`, `seal_publication.rs`, `append_recovery.rs`, tmpfs. U8: `cargo test --locked --workspace` 1312 passed, 0 failed, 11 ignored (log `u8-cargo-test2.log`). The Work settle fault (ENOSPC and SIGKILL at the real `write`) 2/2 by `settle-host-proof.mjs --host` (U8) | The store crate changed after U8 (read batching, checkpoint, repeat-read memo, admission): `cargo test --locked -p fgos-event-store` and `--workspace` on the candidate; `settle-host-proof.mjs --host` again (needs ptrace and host PIDs) |
| 2 | 10,000 reader/seal interleavings | store gate: `reader_seal_stress.rs` 10,000 schedules, 8 shards, 1,358 s, release, tmpfs | Rerun, release mode, about 23 minutes (the test is `#[ignore]`d): `cargo test --release --locked -p fgos-event-store --test reader_seal_stress -- --ignored ten_thousand_seeded_interleavings_and_wal_growth` |
| 3 | V-AUTH-01 (`moveWork` race, last slot) | U8: `test/event-store/v-auth-01.test.mjs`, symlinked `.fgos` 2/2 and own `.fgos` 2/2 | Rerun on the candidate; the same file |
| 4 | V-SEQ-01 | Store part: store gate (`order_kahn.rs`, `cursor_incremental.rs`). Work part (N1 rebuild busy, conflict record incl. the 3-origin cascade): U8, owned by `test/event-store/work-gate.test.mjs` and `work-conflicts.test.mjs` (not duplicated) | Rerun both files and the two cargo suites on the candidate |
| 5 | Three machines | Local bare remote: store gate (`three_clones.rs`, `shared_machine_id.rs`, `offline_sync.rs`, `sync_review.rs`) | **Owner (Q3):** `scripts/event-store/forge-probe.sh <forge-url>` on a scratch repository of the owner's forge; needs the owner's authorization to push. Not run |
| 6 | Legacy parity | This run: exact on forgent (33,717 Work events, 82 porting entities), mdview (372) and mcp-skill-hub (0); fixtures: store gate (`legacy_import.rs`, `legacy_reader.rs`, parity tests) | The byte comparison against each real workspace's saved view (`cacheCompared` true or `--baseline <view.json>`), on every real workspace, with writers stopped, at the cutover |
| 6a | WAL bound (M8) | store gate: 10,000 seals, 0 operation directories, 0 pins, receipt at most 323 bytes | Not required again unless Git's compaction changed |
| 7 | Rollback export and legacy-fold parity | store gate: `rollback-export.test.mjs`, `export-legacy-parity.test.mjs`; the 5 migrate tests that need the host PID namespace last green in `gate-261019-2107-es-p08-host-gate` | Rerun on the candidate on the host (the 5 host-only tests) |
| 8 | Latency | (a) store increment: store gate host run, p95 43.5 ms at 20 sessions, 0 spawns. Work gate on ext4, `v-spawn-bench.mjs --work-gate` (U8): increment p95 40.3/50.2 ms at 1 session, 43.4/44.4/43.1 ms at 10/15/20; hold p95 65-77 ms; 0 spawns in 200 of 200 windows per level; convoy wait p95 0.87 s at 10, 1.6 s at 15, 2.4 s at 20 | (a) The mark is ambiguous: increment (passes) or whole hold with the cache write (65-77 ms, misses); the spec text of item 8 and section 17 needs to say which, then rerun on the candidate. (b) CLI end to end at 1/10/20 sessions: out of scope here, handled separately |
| 9 | Native addon distribution | Staged-release probe and `test/distribution/native-addon.test.mjs`, `test/setup/event-store-checks.test.mjs` (store gate); `event-store-checks.test.mjs` also passes this run. Activation refuses a linux-x64 release without `components.nativeAddon` with `git-wal-v1` (`packages/distribution/rust/src/verify.rs:185-200`). npm half: retired channel, dated note in the spec (section 3) | Probe from a staged candidate release (addon exports present). windows-x64: the verifier admits a `win32-x64` addon (`manifest.rs:84-90`) but requires one only for linux-x64 (`verify.rs`), and no windows-x64 build result exists in this tree, so the Git 07 requirement 5 remains **[UNVERIFIED]**; it belongs to the Git/HARDEN lanes. Work verbs refuse on Windows (`event-store-unsupported-platform`) |
| 10 | Power loss on ext4 | not run. Driver smoke test with SIGKILL only on ext4: 126 acked, 126 present (store gate) | **Owner (Q4):** `node scripts/git-addon.mjs` once, then `sudo env "PATH=$PATH" scripts/event-store/power-loss.sh --runs 20` on a real ext4 disk; results in `.fgos/runtime/tmp/es-power-loss/power-loss.jsonl` |
| 11 | V-DOOR-01 | U8: `door.test.mjs` 5/5 with `door-fixtures`, `v-spawn-bench`, `no-spawn-in-gate` 13/13. This run: `door.test.mjs` 5/5 (reader census empty). Census scan still prints 5 `unresolved-binary` sites (`bin/fgos.mjs:3480,3624`, `src/runner/merge.mjs:1215,1245`, `src/runner/worktree.mjs:146`): they predate this work and none is an Event Store ref site | Rerun on the candidate; the 5 sites are the Git V-GATE lane's |
| 12 | Topologies | This run: `test/event-store/topologies.test.mjs` 6/6 (plain, linked worktree on another filesystem, bare with worktree, own-store submodule, gitfile layouts refused, Git floor). Non-git refusal: `facade.test.mjs` and `event-store-checks.test.mjs` | Rerun on the candidate. Open owner decision from the store gate: `--separate-git-dir` and absorbed submodules are refused with `trusted-main-gitfile-unsupported` (option (a), accept the narrower matrix, is recommended there); I did not find a recorded answer |
| 13 | Setup and doctor vectors; full suites | This run: `test/setup/registrations.test.mjs`, `test/setup/event-store-checks.test.mjs`, `test/state/events-legacy-absence.test.mjs` pass (89 tests with the topologies file). U8 full `npm test`: red, classified (loop file 1150 s against the 600 s limit; flakes passing solo; the `init -q -b main` spy attribution unclassified) | Full `npm test` and `cargo test --workspace` on the candidate. The loop file is still above the review bar: after T2 the branch takes 542 s against 296 s on main-after-T2 (1.83x, under the 600 s limit by 58 s; `tester-261023-1545-loop-test-ab-after-t2.md`) |

Gate summary: gating items without a fresh Work-side run on a candidate are 1, 2, 3, 4, 7, 11, 12 (cheap, mechanical), 13 (needs the loop file under 600 s with margin), and 8 (needs the mark decided). Owner-run items: 5 (forge) and 10 (power loss). Items proven today without a candidate: 6 (parity, with the cache caveat), 12, 13 (registered rows), 11 (reader census).

# 5. Commands run

```sh
# parity, per copy (scratch script, outputs in the scratchpad as parity-<name>.raw)
npm --prefix .../worktrees/work-es run fgos:dev -- events migrate --check     # cwd in each copy
node --test test/event-store/topologies.test.mjs test/setup/registrations.test.mjs \
  test/setup/event-store-checks.test.mjs test/state/events-legacy-absence.test.mjs \
  test/event-store/door.test.mjs                                               # 89 pass, 1 environmental fail (door spawn census needs the staged addon)
node --test --import <preload that calls ensureGitAddon()> test/event-store/door.test.mjs   # 5/5
node --test test/runner/dead-vocabulary-guard.test.mjs                                          # 10/10
node scripts/check-decision-citation-drift.mjs                                                  # no findings
```

An honest slip, recorded: I tried `node scripts/run-tests.mjs test/event-store/door.test.mjs` to give the door test the host environment. The runner ignores a file argument and starts the whole suite. I stopped it within about 5 minutes, killed its orphaned test and `fgctl` processes (all started in my window, cwd in the work-es worktree), removed its `/tmp/fgos-test-run-b8949m` directory and restored `packages/git/contracts/mutation-census.v1.json`, which that run had rewritten. The aborted run proves nothing and no result from it is used here.

# 6. Cleanup

Removed: the parity clones (`/home/vantt/projects/forgent-worktrees/parity/{forgent,mdview,mcp-skill-hub}` and its scratch state root), the aborted suite's temporary directory. Nothing in any real workspace checkout or the real state root was written; the only reads outside this worktree were `/home/vantt/projects/forgent/.fgos/installation/activation.json`, the three remotes over HTTPS, and `~/projects/{mdview,skillstation}` listings.

# Unresolved questions

1. R-1: leave the union-path branch of `declareStoreFiles` until every workspace has migrated (recommended), or delete it now?
2. Item 8: is the part (a) mark the store increment or the whole mutex hold? The spec must say.
3. The real mcp-skill-hub workspace (owner machine): does it hold event history that is not in its remote? Its parity here is vacuous.
4. Items 5 and 10 need the owner (forge authorization; root and a real ext4 disk).
5. Who records the windows-x64 addon result (Git/HARDEN), and was an answer given to the store gate's topology decision?

Status: DONE_WITH_CONCERNS
Summary: `events migrate --check` is exact on fresh copies of forgent (33,717 events, 82 porting entities), mdview (372) and mcp-skill-hub (0), without a saved-view comparison; every retired family is gone from code except the attribute-driven `merge=union` branch in `declareStoreFiles`; the U9 docs are updated and the section 23.2 matrix lists what each item still needs.
Concerns/Blockers: parity could not compare against a saved pre-cutover view (needs real workspaces at cutover); mcp-skill-hub parity is vacuous; R-1 residual union code; items 5 and 10 wait for the owner; item 9 windows-x64 stays unverified; I accidentally started a full suite once and cleaned up after it (section 5).
