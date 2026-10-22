---
title: "WORK lane plan refresh: Event Store phases 09-11 and the deferred Work parts of phase 10, against main 6d4c48a47"
date: 2026-10-21 12:15 (Asia/Saigon)
author: planner (subagent), facts-and-plan only, no code edited, not committed
base: origin/main 6d4c48a47 (worktree .claude/worktrees/git-p07 equals it)
parent plan: plans/261018-0945-event-store-fgos-event-store/plan.md (phases 09, 10, 11)
board rows: WORK (held -> to open), ES, GIT, HARDEN, TEST, SEAT, DOC
---

# WORK lane plan refresh (ES 09-11 + Work part of ES 10)

Impact analysis: `fgos tool query --capability impact-analysis --status present` returns 0 providers (12:16), so posture is inactive or degraded. Every caller list below was cross-checked with `rg` on main, and blast radius is marked unconfirmed. Each unit reruns the query.

## 1. Facts

### 1.1 What changed on main since es/p09-cutover forked

- **Parked branch.** `origin/es/p09-cutover` tip is `03c5186c7`. It has 9 commits not on main, forked at `83ad16aca` (2026-10-20 09:03), and main has 372 commits it lacks.
- **Trial merge.** `git merge-tree --write-tree origin/main origin/es/p09-cutover` (no worktree touched) reports **38 conflicted files**. The conflicts are all in files that main rewrote after the fork:
  - `src/runner/merge.mjs`: main +1576 lines (Git 07 Land port) against p09's 70.
  - `packages/git/rust/src/driver.rs`: main 270 against p09's 11.
  - `bin/fgos.mjs`, `session.mjs`, `registrations.mjs`, `main-fgos-checkpoint.mjs`.
  - Both truncation-guard and compaction modules: main rewired them to the adapter, while p09 deletes them.
  - Store-layer files that main re-implemented: `open_read.rs`, `read.rs`, `node-addon/src/event_store.rs`, `src/event-store/native.mjs`, bench scripts.
- **Work core is clean.** Main never touched these files, so they merge cleanly: `src/state/{hot-lock,events,event-log,porting-store,runtime-coordination}.mjs` (main delta 0), `replay.mjs` (3 lines), the new `consumer-event-gate.mjs` and `work-event-store.mjs`, `packages/work-state/**` and the Work contracts.

**Already on main (superseded on the branch, do not replay):**

| p09 branch content | Main equivalent | Evidence |
|---|---|---|
| Narrow trigger facts (review B H1 fix) | `store.maintenance(heldRanks)`: open streams, `oldestUnsealedAgeSec`, `lastPush`; no ref walk, no legacy read | `src/event-store/native.mjs:115`; spec "Store-layer completion" |
| Cursor reuse (review A M1, store half) | `read({cursor, folded})` forwards coverage; consumers compare only `cover`, `streams`, `deferred` | spec same section |
| Branch-key mismatch (review B M3, naming half) | facade `branchKey()` | `src/event-store/native.mjs:181` |
| Hook rename bypass, prefix (review B M1, L5) | `--no-renames --diff-filter=ACRT`, only `.fgos/events.jsonl*` and `.fgos/events/`, active only when the fence exists | `.githooks/pre-commit:346-351` |
| V-DOOR-01 scanner holes (review B H3) | shell, `sh -c`, absolute git, `env`, rest-args, Rust absolute-path sinks; shrink-only dormant reader census | `test/event-store/door.test.mjs:155-264` |
| Store latency, writer/channel admission (`40d3cd73f` store half: `fence.rs`, `identity.rs`, `open_read.rs`, `append_recovery.rs`) | landed through `es/p09s-store-fixes` and `es/store-latency`; part (a) store-only PASS: p95 43.5 ms at 20 sessions, 0 spawns | `verification-261020-2012-event-store-store-proof-gate.md` item 8 |
| Topologies, WAL bound, V-EVENT, power loss, forge probe | items 12, 6a, 10, 5 green | spec dated notes 2026-10-20/21; `verification-261021-1202-git-e1-and-event-store-power-loss.md` |
| `project:<name>` clarification, §10/§21 citations | spec §5 row, "Store proof gate clarifications" | spec lines 157, 1133-1141 |
| npm `fgos init` addon guidance (part of `40d3cd73f`) | distribution decision 2026-10-21: the npm channel ships no addon, `fgos init` refuses with `git-addon-unavailable` and points to `fgctl init` | `docs/specs/distribution.md:351` |

**Still valid on the branch (Work-owned, absent from main):**

- **Consumer gate:** `src/state/consumer-event-gate.mjs` and `work-event-store.mjs`. Review A confirmed the §13 gate shape, D12 staging, claim settle and lock order were correct.
- **Staged effects:** the `tx` staging in `hot-lock.mjs`, the in-gate `tx.view` reads and the `claim-port` tx reads.
- **Reducer:** the conflict rule in `replay.mjs`. It needs the review A H1 fix.
- **Contracts:** `packages/work-state/contracts/{event-streams.v1.json,porting-event-streams.v1.json}` and the `work-events.read.v1.json` edit.
- **Rust readers:** `packages/work-state/rust/src/{event_reader.rs,work_source.rs,legacy_friction.rs}`.
- **Porting:** the `project:porting` port of `porting-store.mjs`. It needs the review A M4 fixes.
- **Proofs:** `settle-fault.py`, `settle-host-proof.mjs` and the V-AUTH-01 / V-SEQ-01 Work tests.
- **Verbs:** the `events` registrations and `repair` removal (command-registry, routes, envelope vector), plus `rebuild`/`export`/`migrate` consumer wiring.
- **Test retirements:** -6.7k / +4.7k lines, including the truncation-guard (680), compaction (302), events (471) and replay (540) suites.
- **Unfinished review fixes:** the parked WIP `03c5186c7` holds partial review-A fixes in `hot-lock`, `replay`, `work-event-store`, `consumer-event-gate` and `shared-config-file`.

**Rules added on main that the branch predates:**

- **One proof** (design principle 8, decision 0073, `fb8c6e4ae`). The `suite:` line and the duplicate-test block in `npm test` (`e7a6adff8`, `test/suite-baseline.json`). Every p09 test must name its behaviour and say why no existing proof covers it. Every retired test names its successor or says the behaviour was removed.
- **RUL104** (better, not bigger) and design principle 1 (one door).
- **Git 07 V-GATE:** `packages/git/contracts/mutation-census.v1.json` hashes `legacy-event-git-adapter.mjs` (:862), `main-fgos-checkpoint.mjs` (:792), `events-compaction.mjs` (:850), `events-jsonl-truncation-guard.mjs` (:851) and the truncation-guard script (:555). Deleting them changes the census and the doctor row `git-mutation-one-door`.

### 1.2 The temporary Work adapter that Git 07 left for WORK

Owner decision 2026-10-20 11:34; Git 07 phase file §"Temporary Work adapter"; Git spec `docs/platform/git/spec.md:670`.

**Node side (Work):**
- `src/state/legacy-event-git-adapter.mjs` (16 lines) exports `checkpointLegacyEventFiles` and `commitLegacyEventFiles`, which call ScopedCommit with `legacyEvents: {exactPaths}`.
- Importers:
  - `src/runner/main-fgos-checkpoint.mjs:11`. This module exists only to declare event paths (`prepareMainFgosCheckpoint`, `checkpointMainFgos`). Its callers are `src/runner/claim-port.mjs:19,107,113` and `src/runner/merge.mjs:52,1152,1156`.
  - `src/state/events-compaction.mjs:30`.
- Coupled legacy duties:
  - `src/state/events-jsonl-truncation-guard.mjs` (`runOpportunisticMainCheckoutChecks`; imported by `main-fgos-checkpoint.mjs:12` and `registrations.mjs:130`).
  - `scripts/events-jsonl-truncation-guard.mjs`.
  - `events-compaction.mjs` (imported by `registrations.mjs:131`).
  - The doctor rows `events-jsonl-not-truncated` and `events-compaction-verified` (`registrations.mjs:2042-2197`).
  - The hook's tsk-1i3 guard (`.githooks/pre-commit:279-339`).
  - `.gitattributes:15` `merge=union`. `migrate` already strips it (`src/verbs/events/migrate.mjs:25,84-87`; `legacy_import.rs:162,693-701`).
- Tests: `test/git/legacy-event-adapter.test.mjs`, `test/state/events-compaction.test.mjs`, `test/state/events-jsonl-truncation-guard.test.mjs`.

**Git side (WORK deletes, per Git spec :670):**
- `packages/git/rust/src/scoped_commit.rs:70,78,856,1042,1435-1474` (`legacy_events`).
- `packages/git/rust/src/grant.rs:74` (hook grant branch).
- `packages/git/node-addon/src/git/scoped_commit.rs:84`.
- `packages/git/contracts/ports.v1.json:133`.
- `packages/git/contracts/internal-route.git-grant-check.v1.json:23`.
- Tests: `packages/git/rust/tests/scoped_commit_sync.rs` (12 refs) and `recovery_matrix.rs` (1).
- The cutover seal grant (`cutoverGrant`) stays.

### 1.3 Item 9 (addon distribution) and M10

- **M10 on linux-x64 is done.** `require_git_addon` (`packages/distribution/rust/src/verify.rs:184-201`) refuses activation without `components.nativeAddon` carrying `git-wal-v1`, and `fgctl` tests it (`apps/fgctl/tests/git_wal_activation_gate.rs:359,378`). The combined addon carries the Event Store exports, and a test locks that (store proof gate, item 9 store row). A separate Event Store capability string is not needed: one build produces both.
- **windows-x64 addon is not required yet** [UNVERIFIED whether Git 07 req 5 closed elsewhere]. `validate_native_addon_invariant` (`manifest.rs:80-83`) returns `Ok` when the addon is absent. That is Git D11 / Git 07 work. The facade refuses Work on Windows anyway (D15).
- **npm channel: three statements disagree.**
  - Spec §23.2 item 9 requires the addon "in both the npm package and the legacy-node payload".
  - The distribution decision of 2026-10-21 says the npm channel ships no addon and refuses (`docs/specs/distribution.md:351`).
  - HARDEN owner decision 2 (12:05) accepts shipping the addon "for every supported target and for the npm channel" as T0's packaging cost (`plans/261021-1118-harden-low-layers-bottom-up/plan.md:178`).
  - This is decision Q-W1 below.

### 1.4 `fgos rebuild`

- `src/verbs/events/rebuild.mjs:7-20` (dormant on main) returns `{rebuilt:[{consumer, result}]}`. With the p09 consumers wired, `result` is the whole view, so Work and porting views print to stdout (review B M4).
- The fix is a per-consumer summary (counts, revision, cover) plus a CHANGELOG line.
- The legacy `rebuild(dir)` callers in `bin/fgos.mjs:1605,1689,1715,1771` and the `rebuildViewFromDir` import (`:47`) go with the readers family.

### 1.5 Recommendation: restart phase 09 from main and port by family; do not rebase

Rebasing 9 commits over 372 means resolving 38 conflicts. Half of them are store-layer hunks that main already re-implemented differently, so a rebase would risk silently reverting main's stronger versions. Examples:
- main's `maintenance` against p09's `maintenance.mjs`, which calls full `status()`;
- main's ACRT hook;
- main's door scanner.

Instead:

1. Cut `work/es-cutover` from origin/main.
2. Take the Work-core files from `origin/es/p09-cutover` with `git checkout <ref> -- <paths>`. They merge cleanly.
3. Re-derive the touch points in files that Git 07 rewrote: merge, session, bin, checkpoint, registrations.
4. Drop every store-layer hunk.

This was decided within the approved frame and is reported here. Reverse it only if the per-family port shows that p09's Work core depends on a store API main removed; in that case stop and re-plan that family.

## 2. Remaining work: units in order

Lane setup:
- Branch `work/es-cutover`, worktree `.claude/worktrees/work-es` (name it through `fgos convention`).
- Leads go through `fgos dispatch decide`, then `fgos run` / `fgos workflow start`.
- Lead model: sonnet. Review: opus.
- Every unit's test changes follow "one proof": extend the owning test first, and each retirement names its successor or the removed behaviour plus its D-ADR0055 family. The unit report states Δ lines for src/test.

Global gate per unit:
- the unit's focused tests;
- `cargo test --locked -p <touched crates>`;
- the `suite:` line holds no new duplicates.

U6, U7 and U8 additionally run the full gate:
```
cargo test --locked --workspace && cargo clippy --workspace --all-targets -- -D warnings && cargo fmt --all -- --check
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<branch build> npm test
```

| # | Unit | Goal | Files (owned) | Owning tests | Gate |
|---|---|---|---|---|---|
| U0 | Census and lane open | Census on main: Work event types (`rg "type: '" src/state/store.mjs` + knowledge/topic/doc/call), append sites, in-gate reads, readers (phase 09 req 6 patterns), `door.test.mjs` declared debt list. This is the checklist. Board WORK row → running. | report only; board WORK row | — | census report lists every site with file:line; board pushed |
| U1 | Work gate core (port) | Port from p09: `consumer-event-gate.mjs`, `work-event-store.mjs`, `hot-lock.mjs` staging, `runtime-coordination.mjs`, `store.mjs` gate/cache/bounded rebuild, `events.mjs`/`event-log.mjs` append removal, contracts `event-streams.v1.json`/`work-events.read.v1.json`, consumer row in `packages/event-store/contracts/consumers.v1.json`. Retarget onto main's API: catch-up passes the cached cursor + `folded` and compares only `cover`/`streams`/`deferred` (review A M1). | `src/state/{consumer-event-gate,work-event-store,hot-lock,runtime-coordination,store,events,event-log}.mjs`, `packages/work-state/contracts/*`, `packages/event-store/contracts/consumers.v1.json` | `test/event-store/{work-gate,staged-effects,staging-returns,in-gate-reads}.test.mjs` (from p09), `test/state/{hot-lock-tx,runtime-coordination,store}.test.mjs` retargeted | focused green; one test asserts the cache is reused after an append **and** after a seal |
| U2 | Write-path review fixes | Review A fixes. **H1:** a reducer conflict is recorded, never thrown, when an unseen event lies between the seen frontier and the head; the throw is kept only for a same-origin single-clone history; add the 3-origin cascade vector. **M2:** per-id `{exists,status}` map in `prepareEvents`, fold staged events once. **M3 (decided, §4 note):** `expectedStatus` only on status transitions (`work.move`/answer/`work.step`), existence only on the rest, `precondition` stripped from folded payloads. **M5:** an effect or cache failure after ack throws a distinct code carrying the acked events (registered in `result-codes.v1.json`). **L1:** own retry-budget code. **L2:** delete `tx.eventStore`. **L3:** read guard and files-only `tx.list`. **L5:** config from trusted main, only parse errors swallowed. | same `src/state/*` as U1, `src/config/shared-config-file.mjs`, `packages/event-store/contracts/result-codes.v1.json` | `test/state/work-conflicts.test.mjs` (3-origin vector), `staged-effects` (injected post-ack failure) | focused green; 3-origin vector identical on 3 clones |
| U3 | Porting stream | Port `porting-store.mjs` to `project:porting` under `porting-events`; contract `porting-event-streams.v1.json`; config from main root; registry `cachePath` equals the API's view location; no machine-local cursor in any tracked file (depends on **Q-W2**); item for the porting cross-clone conflict gap; `package.json` `files`. | `src/state/porting-store.mjs`, `packages/work-state/contracts/porting-event-streams.v1.json`, `package.json`, consumers row | `test/state/porting-store.test.mjs` | focused green; `git status` clean after a porting mutation in a fixture repo |
| U4 | Readers | Facade readers: `claim-port.mjs` (`tx.view`), `attestation-guard.mjs` (fail-closed, `requireComplete`), `enduser-index-generate.mjs`, the four scripts, doc doctor checks sharing **one** view read (review B M2), friction migration, `loop.mjs` `executor.dispatch` append through the gate, `bin/fgos.mjs` legacy `rebuild(dir)` callers (:1605, :1689, :1715, :1771, :47). Rust: `event_reader.rs`, `work_source.rs`, `legacy_friction.rs`, `Cargo.toml`. Delete `readAllEventsFromDir`; retarget `legacy-order-parity.test.mjs` to frozen vectors. Shrink `door.test.mjs` reader census to zero. | listed src/scripts files, `packages/work-state/rust/**`, `test/event-store/door.test.mjs` (census list only) | `test/runner/attestation-guard.test.mjs` (fail-closed case), `door.test.mjs`, work-state Rust tests | reader census empty; `rg "\.fgos/events" src bin scripts packages apps -g '!test/**'` only migrate inventory |
| U5 | Triggers and Land policy | `bin/fgos.mjs` start/end triggers use `maintenance()` facts (not `status()`), main dir resolved only when the verb opens the store (review B L3); `loop.mjs` per-iteration `sealIfDue` only (review A L6); `session.mjs` `endSession` after releasing `sessions`; `gateway-control.mjs`; `merge.mjs`: seal `project` before Git Land, promote through facade `branchKey`, a post-Land promote failure is a recorded retryable result on `merged`, not a throw (review B M3). Applied to Git 07's Land-port shape of `merge.mjs`, not p09's hunks. D13 sync condition (decided, §4 note). | `bin/fgos.mjs`, `src/runner/{loop,session,gateway-control,merge}.mjs` | `test/event-store/triggers*.test.mjs` (from p09, retargeted), `test/runner/merge*.test.mjs` promote case | focused green; one CLI verb shows 0 `status()` calls (spy on facade) |
| U6 | Delete the temporary adapter and legacy event duties | Delete:<br>- `src/state/legacy-event-git-adapter.mjs`, `src/runner/main-fgos-checkpoint.mjs` (and its calls at `claim-port.mjs:107-113`, `merge.mjs:1152-1156`);<br>- `src/state/events-compaction.mjs`, `src/state/events-jsonl-truncation-guard.mjs`, `scripts/events-jsonl-truncation-guard.mjs`;<br>- doctor rows `events-jsonl-not-truncated`, `events-compaction-verified` and their imports (`registrations.mjs:130-131`);<br>- the hook tsk-1i3 guard (`.githooks/pre-commit:279-339` + call site);<br>- `FGOS_DISABLE_OPPORTUNISTIC_CHECKS` (`scripts/run-tests.mjs`, `scripts/stress-test-files.mjs`), `GUARD_MARK` (`src/state/fgos-file-registry.mjs`).<br>Git side, same change: remove `legacyEvents` from `scoped_commit.rs`, `grant.rs`, node-addon `scoped_commit.rs`, `ports.v1.json`, grant-check route contract; Git spec :670 paragraph → dated "removed at Work cutover" note. Regenerate `mutation-census.v1.json`. | listed files; `packages/git/rust/src/{scoped_commit,grant}.rs`, `packages/git/node-addon/src/git/scoped_commit.rs`, `packages/git/contracts/{ports.v1.json,internal-route.git-grant-check.v1.json,mutation-census.v1.json}`, `docs/platform/git/spec.md` (one paragraph) | retire: `test/git/legacy-event-adapter.test.mjs`, `test/state/events-compaction.test.mjs`, `test/state/events-jsonl-truncation-guard.test.mjs`, the `legacy_events` cases in `scoped_commit_sync.rs`/`recovery_matrix.rs` (behaviour removed); `.fgos` refusal of ScopedCommit keeps its owning Rust test | `rg "legacyEvents\|legacy_events\|legacy-event-git-adapter\|main-fgos-checkpoint\|events-compaction\|truncation-guard" src bin scripts packages apps .githooks` → none; doctor `git-mutation-one-door` green |
| U7 | Removals, registrations, CHANGELOG | §19 rest: `resolveWriterLogPath`, replay discovery/T4 fast path/snapshot (keep `foldEvents`/`applyEvent`), `appendEventCore`/`appendEvent`/`lockOfLog`, `repairTruncatedLastLine` + `fgos repair` (`command-registry.mjs:1439`, route). Register `events sync\|status\|export\|migrate` (registry, `command-routes.json`, `test/rust-host/vectors/envelope/version.json`), one `eventStore` default, ten checks + three fixes through one `eventStoreDoctor` per run (review B M2). `fgos rebuild` summary output (§1.4). `MUTATING_SUBCOMMAND_PREDICATES` for `events sync/migrate`, `rebuild`; `events` read verbs not `touchesState` (review B L7). Comments (review B L2). CHANGELOG `[Unreleased]` once each: verbs, keys, refspec, removed tracked event files, `fgos repair`, two doctor rows, `checkpoint` config key retired, `seq` meaning, `rebuild` output, Windows refusal, npm channel per Q-W1. Retire review B H2 tests (`test/runner/claim-port.test.mjs:707`, `test/cli/fgos-return.test.mjs:289`, `test/runner/land-vs-manual-commit.test.mjs:90`) with family labels. `test/suite-baseline.json`. | `src/state/{replay,events,event-log,store}.mjs` (removal hunks), `src/cli/command-registry.mjs`, `packages/host-runtime/contracts/command-routes.json`, vectors, `src/setup/registrations.mjs`, `src/verbs/events/rebuild.mjs`, `CHANGELOG.md`, `test/test-ownership.mjs`, `test/suite-baseline.json` | `test/event-store/verbs.test.mjs`, `test/setup/event-store-checks.test.mjs`, `test/setup/registrations.test.mjs` | full gate green on the branch |
| U8 | Branch proofs and review | V-AUTH-01, plus a variant without the `.fgos` symlink (review A L4); `settle-host-proof.mjs --host` (ENOSPC, SIGKILL). V-SEQ-01 Work: N1 rebuild-busy, cross-machine conflict incl. 3-origin cascade. Part (a) on ext4 at 1/10/15/20 sessions for the **Work** gate with a realistic seed (`--seed-items 1000` or `--seed-history` copy of live history); p95 ≤ 50 ms, `strace` 0 spawns, convoy profile at 15/20. V-DOOR-01 whole-repo zero legacy. Two opus reviewers (write path; readers/triggers/removals), fixes, squash to one code commit. | proofs/report only; fixes go back to U1-U7 owners | `test/event-store/{v-auth-01,v-seq-01-work,door}.test.mjs`, `scripts/event-store/v-spawn-bench.mjs` run | all green with run ids; part (a) miss → stop, owner gets numbers (plan risk row) |
| U9 | Phase 10, Work part | On a candidate release built from U8:<br>- **Part (b):** claim, move, settle at 1/10/20 sessions on ext4 against `experiment-261018-1207-event-store-ext4-baseline-v-spawn.md`, plus spawns outside the gate per mutation. A regression is a no-go.<br>- **Parity rehearsal:** `fgos:dev -- events migrate --check` on copies of forgent, mdview, mcp-skill-hub and any workspace found by the activation re-scan on both machines. Start from copies where the new `fgos setup` never ran. Exact parity, porting included.<br>- **Retired families:** spec §20 list against freeze 234.<br>- **Item 9 residue:** per Q-W1; windows-x64 recorded from Git.<br>- **Item 13:** registered rows with vectors.<br>- **Matrix:** rerun items 1-4, 6-8, 11-13 on the candidate.<br>- **Docs:** `docs/specs/work-state.md` (rebuild, layout, removed `repair`, `seq`, conflicts), `docs/specs/distillery.md:136-138`, `docs/specs/reading-map.md`, Event Store spec status line, component-boundary consumers row; how-tos from `rg -l "\.fgos/events" docs`. | `docs/specs/{work-state,distillery,reading-map}.md`, `docs/platform/event-store/spec.md` (status line, dated note), `docs/platform/component-boundary.md` (ES row only), report `fgos convention path --kind report --type verification --slug work-cutover-proof-gate` | the matrix | go/no-go note: every gating item has a run id; parity exact on every copy |
| U10 | Phase 11, cutover on both machines | Runbook as in phase 11, with these changes:<br>- **Step 0:** Git 05+ precondition already met (Git 07-08 release `653affd6…` on the owner machine, landed on the second machine 10-21 06:03). Re-verify `fgos internal git-grant-check --protocol 1 --operation probe` on every workspace. Re-scan `.fgos/installation/activation.json` on both machines; an unlisted workspace stops the runbook.<br>- **Q5 (a):** two commits in one push: the reviewed code commit, then the `migrate` grant commit (the fence file, event-file and `state.json` deletions, `.gitattributes` union line).<br>- **Machine A** is the second machine (`~/projects/forgent`, where the lane lead runs) for forgent steps 3-5. The owner machine follows a written guide (`fgos convention path --kind report --type guide ...`): forgentX pull + activate + rebuild + compare; mdview and mcp-skill-hub migrate. Board ES and WORK rows landed; GIT row: adapter gone. | runbook execution, board rows, guide report | `fgos events status --json`, `fgos doctor --json`, `git ls-files .fgos \| grep -E '^\.fgos/(events(/\|\.jsonl)\|state\.json)'` empty | doctor `event-store-*` and `git-*` green on every workspace; view+revision equal to the baseline on every clone |

Dependencies:
- U1 → U2 → (U3 ∥ U4) → U5 → U6 → U7 → U8 → U9 → U10.
- U3 and U4 own disjoint files. They share `consumers.v1.json`; U4 does not edit it.
- U6 must follow U5, because both edit `merge.mjs` and `claim-port.mjs`.
- U10 needs the owner's hour. It runs as a stop-everything slot, sequenced with HARDEN's landings (board rule: one at a time).

Rollback:
- U0-U9 sit on the branch or are docs only; revert them.
- U10 follows phase 11's rollback. Before the main push: revert both commits locally and reactivate the previous release. After the push: `fgos events export --format legacy-layout`, a person decides, and the previous release is activated through `fgctl` (Git C5 refuses while WAL records are pending).

Effort (re-estimate): U0 2h, U1 8h, U2 8h, U3 4h, U4 6h, U5 6h, U6 6h, U7 8h, U8 10h, U9 10h, U10 10h, about **78h** plus owner waits.

Risks:

| Risk | L × I | Mitigation |
|---|---|---|
| Part (a) on the real 8.2 MB / 1042-item view exceeds 50 ms (review A M2) | M × H | U2 M2 fix first; U8 measures with a realistic seed; a miss goes to the owner with numbers before U9 |
| Retired tests weaken a live guarantee | M × H | Every retirement names its successor or removed behaviour, plus its family; opus review checks the list |
| Semantic conflict with HARDEN T0/T1 edits to `hot-lock.mjs` | M × M | §3; announce on the board before U1 merges into the branch's next rebase; rebase at U8 squash |
| Census of Git `mutation-census.v1.json` drifts while HARDEN/Git edit | M × L | Regenerate it last in U7, and again at the U10 rebase |

## 3. Collisions with other lanes (board "File chung dễ va")

| File / area | Other lane | WORK touch | Rule |
|---|---|---|---|
| `src/state/hot-lock.mjs` | HARDEN T0: liveness judging `:57-99` (#13, in-process door); T1 reviews the mutex. Owner decision 3: the mutex stays in Node until WORK | U1/U2 staging (`tx.append`/`commit`, `:290-394`), guards | Disjoint regions. WORK posts its hunk ranges on the board before U1. The later lane rebases. HARDEN T1 reviews the post-WORK shape if WORK lands first. |
| `src/event-store/*`, `src/state/events.mjs`, `src/state/legacy-event-git-adapter.mjs` | HARDEN T3 (phase 04 owns them for review; consumer side Critical/High only) | U1 rewrites `events.mjs`; U6 deletes the adapter | Ask HARDEN to drop the adapter and `events.mjs` from the T3 inventory (deleted by WORK), or to review them after WORK lands. Message `forgent-a8`. |
| Git `legacyEvents` (`scoped_commit.rs`, `grant.rs`, node-addon, `ports.v1.json`, grant-check contract, `docs/platform/git/spec.md:670`) | HARDEN T2 (phase 03, Git council); GIT lane | U6 deletion | The Git spec already assigns the deletion to WORK. Announce before merge. If T2 has the Git spec open, the later lane rebases. |
| `packages/git/contracts/mutation-census.v1.json`, `packages/host-runtime/contracts/command-routes.json`, `src/setup/registrations.mjs`, `CHANGELOG.md` | HARDEN (every layer), SEAT, GIT, TEST | U6, U7 | Board rule: whoever lands later rebases and checks semantics. Regenerate the census, never hand-merge it. |
| `test/event-store/*`, `test/suite-baseline.json` | TEST phase 2 ("event-store port now", local `chore/test-governance-p2-p3`, no unique commits yet) | U1, U4, U8 add/retarget tests; door census shrinks | Message TEST before U1: TEST lands its event-store retirements first, or excludes `door.test.mjs` and the Work-consumer tests. WORK regenerates the baseline last. |
| `docs/platform/event-store/spec.md`, `docs/platform/component-boundary.md`, `docs/specs/{work-state,distillery,reading-map}.md` | DOC (patches in its Phase 9 from current bytes), HARDEN | U9 docs | Message the DOC lead (`forgentx-5f`) with the paths before merge. |
| `bin/fgos.mjs`, `src/runner/{merge,session,loop,claim-port}.mjs` | COOK (`bin`), GIT G4 (done), SEAT (no hit found in `src/runner/execution/*` overlap) | U4, U5, U6 | Low. Rebase. |
| `.gitattributes`, `merge=union`, `.fgos` strip rule | board row "không ai sửa cho tới khi D1" | `migrate` drops only the union line in the U10 grant commit; the strip rule stays | D1 resolved 10-17. At U10, update the board row to "union line gone at Work cutover; strip rule unchanged". |
| `.githooks/pre-commit` | GIT (V-GATE), HARDEN | U6 removes the tsk-1i3 guard | Announce. |
| Stop-everything landing slot | HARDEN per-layer landings (two machines) | U10 | Sequential; owner picks the hour. |

## 4. Owner decisions

The plan decided these within its frame and reports them; none needs an answer.

- **Restart from main** instead of rebase (§1.5).
- **Status preconditions only on status transitions** (review A M3). The spec (§12) names no event set. Dropping a land outcome or an edit because an unrelated status move crossed it loses data. Reverse this if the owner wants every `work.*` event to be provisional against concurrent status moves.
- **D13 sync rule narrowed** to "not a dispatched worker" (review B L8). On the two writer machines only the owner's user runs fgOS sessions, so a euid check adds code with no case. The narrowing is recorded as a spec clarification in U9. Reverse this if another user ever runs sessions on a writer machine.
- **Distinct post-ack failure code** (review A M5). A defect fix: callers must never retry acked events.
- **Machine A for forgent is the second machine**, and the owner machine follows a guide. The owner still picks the hour.

Two questions remain where the plan or spec leaves a real choice.

### Q-W1. Does the Work cutover wait for the addon on the npm channel?

- **What is happening:** spec §23.2 item 9 requires the Event Store addon to load "in both the npm package and the legacy-node payload". On 2026-10-21 distribution decided that the npm channel ships no addon and that `fgos init` refuses there. Hours later, HARDEN owner decision 2 accepted shipping the addon on the npm channel as part of T0. After the cutover, every Work verb needs the addon.
- **Cause:** three documents written at different times (spec 10-17, distribution 10-21 morning, HARDEN 10-21 12:05). Checked: `docs/specs/distribution.md:351`, `plans/261021-1118-harden-low-layers-bottom-up/plan.md:178`, spec §23.2 item 9, `verify.rs:184-201`.
- **Options:**
  - (a) Land the cutover without the npm addon. Work verbs on the npm channel refuse with the same `git-addon-unavailable` message that points to `fgctl init`. Item 9 gets a dated spec clarification: npm is covered when HARDEN T0 ships it. Cost: about 20 lines of docs, a CHANGELOG line, one refusal test. No wait. Harm: npm-only users lose Work until T0 lands, but they already cannot `fgos init`.
  - (b) The cutover waits for HARDEN T0 to package the addon for npm. Gain: item 9 is met as written. Cost: the WORK landing depends on T0 closing, about days to weeks, with the T0 council not yet open.
  - (c) WORK packages the npm addon itself. Cost: about 1-2 days in packaging files that HARDEN T0 and Git own. It collides with HARDEN's decision and doubles the work.
- **Recommendation:** (a). It matches the distribution decision already live, adds no new mechanism, and keeps WORK independent of T0's calendar. HARDEN's later npm addon then turns Work on for npm with no WORK change.
- **Scope of the answer:** a yes authorizes the spec clarification for item 9, the refusal test and the CHANGELOG line. It does not change HARDEN's T0 plan or the distribution decision.

### Q-W2. After the cutover, should the porting view stay tracked in `docs/distillery/state/porting/state.json`?

- **What is happening:** today forgent tracks both porting truth (`events.jsonl`) and its view (`state.json`) under `docs/distillery/state/porting/`. The truth moves to the Event Store, and `migrate` deletes the tracked log. The view, if still written there, changes on every porting mutation on each machine. The p09 code also wrote a machine-local cursor into it (review A M4).
- **Cause:** checked with `git ls-files docs/distillery/state/porting` (both files tracked), `src/state/porting-store.mjs:29`, `docs/specs/distillery.md:136-138`, and plan D9 ("`dir` names only where the porting view is cached"). Whether people or the external importer (forgent-workshop) read the committed file directly, rather than through the API, is not visible from the repo.
- **Options:**
  - (a) Keep the file tracked, but write only the deterministic view (no cursor). The cursor goes in `.fgos/porting/state.json`. Gain: the file stays readable in the repo. Harm: every porting mutation dirties a tracked file, and two machines can conflict on it. Cost: about 30 lines.
  - (b) Untrack it. The `migrate` grant commit deletes it, and the view plus cursor live only in the `.fgos` cache that the registry declares. The API is unchanged, and the human-readable `docs/distillery/porting-log.md` stays tracked. Gain: no derived file in git, matching Work's `state.json`. Harm: anyone reading the raw file must use the API or the log. Cost: about 20 lines plus a CHANGELOG line.
- **Recommendation:** (b). It is the same rule as Work's view (L3: truth in the log, the database is a view) and removes the cross-machine conflict. The human-readable log covers reading.
- **Scope of the answer:** forgent's porting view location and the U3/U10 grant-commit contents only. The `forgent/state/porting-store` API stays.
- **Answered 2026-10-22 10:47: (b).** The owner chose to untrack the view. U3 writes the view and cursor only to the registry-declared `.fgos` cache, and the U10 grant commit deletes `docs/distillery/state/porting/state.json`.
- **Q-W1 superseded 2026-10-22:** ES 11 retires the npm install channel (M10), so no npm addon is needed; U9 records item 9 with a dated note.

The board does not need these answers before U0-U2. Q-W2 blocks U3. Q-W1 blocks only the U9 item 9 row.

## Owner decisions after the refresh (2026-10-22)

- **M3 Land-candidate release, option (b), 16:46.** One release function next to `acknowledgeLand`, called from the end-of-command trigger only when `listRetainedLand` is non-empty. It releases a candidate only when a Work event records that Land operation id. The acknowledgement becomes the event hash instead of `work-decision:<id>:<seq>`, and all three Land paths (`approve`, `sync-root`, `promote-to-component`) record the operation id. Doctor `git-land-recovery` stays read-only. No `packages/git` change. Runs right after U5.
- **Porting duplicate add, option (b), 16:46.** `porting.add` of an existing id no longer replaces the record or resets its status. Runs with the M3 unit.
- **2026-10-22 22:42 (owner):** (1) OPC reviews other lanes' Git diffs, including WORK's. (2) The Land release sweep runs only at the end of the four Land verbs (listing retained Land scans the whole journal, ~0.2–0.3 s). (3) Recorded conflicts get no resolve verb: they show in `fgos show` and doctor `work-recorded-conflicts`, and a person redoes the intended change with existing Work verbs. U9 documents this in `docs/specs/work-state.md`.
- **Feature list for the owner (not scheduled):** H22 (hot mutex writes its own record once per process); full porting cross-clone conflicts (preconditions plus recorded conflicts, as Work has); a `resolve` verb for recorded Work conflicts (upper Work layer batch).


- [UNVERIFIED] Whether Git 07 requirement 5 (windows-x64 addon required) closed outside `manifest.rs`. That belongs to the Git/HARDEN lanes. WORK records the result at U9.
- U10 requires the owner's hour, and the stop-everything slot order relative to HARDEN's layer landings.

Status: DONE_WITH_CONCERNS
Summary: Restart phase 09 from main and port the clean Work core from es/p09-cutover by family. The store-layer half and three review findings are already superseded on main, and a rebase would hit 38 conflicts. The remaining work is 11 units (about 78h): the gate, review fixes, porting, readers, triggers, adapter deletion including Git's `legacyEvents`, registrations, proofs, the Work part of ES 10, and the two-machine cutover.
Concerns/Blockers: two owner questions (Q-W1 npm-channel addon, Q-W2 tracked porting view); `hot-lock.mjs`, the T3 Event Store files and the Git `legacyEvents` files collide with HARDEN and need board announcements; impact-analysis has no present provider, so blast radius is unconfirmed.
