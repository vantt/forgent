# HARDEN T2 arbitration: Git and terminal-control

Big lead `forgent-a8`, 2026-10-23 04:20 (Asia/Saigon), main `8ec0212d3`.

**Inputs:**
- the [brief](council-261022-2148-harden-t2-council-brief.md);
- four seat reports:
  - [correctness](council-261022-2148-harden-t2-seat-correctness.md) (codex);
  - [speed](council-261022-2148-harden-t2-seat-speed.md) (Claude), which also measures R2;
  - [simplicity](council-261022-2148-harden-t2-seat-simplicity.md) (Claude);
  - [red-team](council-261022-2148-harden-t2-seat-redteam.md). It ran on xai, because the gemini run ended after one minute with exit 1 and no report (`unit-run-1792702862935-720d6453`).

**Evidence the big lead re-checked directly on main:**
- **CF01.** `worker-session-boot.mjs:33-40` returns `false` from a `catch` around `capabilities()`, and `:81-84` unlinks the socket on that `false`.
- **F-C1.** `worktree.rs:509-535` (`finish_worktree`) appends the outcome and releases the pin, but never calls `compact`.
- **F-7.**
  - `driver.rs:2512-2515` returns `redact(...)` from `remote_url`, and `remote.rs:54-55` both checks and uses that redacted URL.
  - The spec allows `ssh://git@host/path` (`docs/platform/git/spec.md:144`). The Remote port turns that URL into `ssh://[redacted]@host/path` and then transfers to it, so every `ssh://` remote with a user name breaks on the Remote port.
  - Publication reads the URL raw (`publication.rs:1418`) and is not affected.
- **RT01.**
  - `sequence.rs:68-74` puts any repository with a readable origin in `Remote`.
  - Both scheme ladders (`remote.rs:59-66`, `publication.rs:1426-1434`) accept only `/`, `file://`, `https://` and `ssh://`.
  - So a repository whose origin is in scp form (`git@github.com:org/repo.git`, GitHub's default SSH clone URL) cannot mint a `d-adr` or a `decision-file` id at all, and cannot use either remote port.
- **G-4** (the identity block in the terminal skill) is already fixed on main in `80159fd23` and is not in the plan.

## 1. Outcome in one paragraph

T2 keeps the shape: one Rust crate per component, Node as a thin facade, and every Git call already in process. There is no structural move. The work falls into four groups.

1. **Two High defects.**
   - CF01 (reproduced): an unanswered terminal route lets the worker boot delete a herdr socket that may still be live.
   - RT01 (confirmed by reading, reproduced first in the plan): a repository whose origin is in scp form cannot mint ids or use the remote ports.
2. **Medium correctness defects.**
   - Doctor can close panes.
   - Pane ownership is judged by PID equality.
   - Lost durability is reported as success, in the terminal store, config recovery and the local sequence counter.
   - A sequence home is chosen from any read error.
   - Every rejected push is read as a lost lease.
   - WAL temporaries count against the record bound.
   - The herdr fd seal stops at 1023.
   - The Remote port uses a redacted URL.
3. **Measurable cost, all Medium.**
   - Worktree and Refs WAL chains are never compacted, and every admission reads all of them twice: 322 here.
   - Every single-ref read lists the whole namespace.
   - Each process pays two `git var` children before any work.
   - Doctor calls `inspectGit` once per row.
4. **Scattered duplication (RUL11 "tùm lum") and pane access outside the port.**
   - In the Git crate:
     - a layout-cause ladder copied six times, with copies that disagree;
     - four transaction skeletons that have drifted apart;
     - two remote doors;
     - one sink that flattens errors.
   - In terminal-control:
     - three raw herdr spawns in Node and one shipped shell script;
     - herdr's socket layout written in Node.

**R2 is answered.** A worktree add costs ≈ 184 ms, of which fsync is ≈ 131 ms and containment 30–65 ms. That is below OPC's ≥ 100 ms trigger, so OPC Phase B stays deferred. The 0.5 s TEST saw is WAL history plus load (F-C1).

## 2. Part A: target shape (for owner approval, then into each spec)

### 2.1 Git

- **Authority (unchanged).** One Rust implementation owns repository facts, typed Git effects and their recovery. Consumers own approval, verification and settlement. There is no raw-argv API and no second recovery engine.
- **Ports.**
  - The ports stay: Inspect, Refs, Worktree, ScopedCommit, Sync, Land, SafeRestore, RepositoryConfig, Remote, Recovery, Publication and the sequence counter.
  - Leaving the addon and the facade: `GitNativeLockRepair` (E-1; the Rust inspection stays) and the Node-reachable arms that nothing calls (E-25, §4 D8).
  - Checkpoint goes when WORK's `work/es-cutover` lands. That is WORK's deletion, and T2 deletes the Rust `checkpoint_tracked_files` in the same landing (the branch keeps the function).
  - `ports.v1.json` is made true and pinned by the existing `tests/contracts.rs` (F-1).
- **One remote door, Publication's (E-24, F-7, RT01).** It reads the URL raw, refuses credentials and controls on the raw string, and redacts only for display. Its one scheme ladder also accepts git's scp form `user@host:path` as `ssh`, through the same credential check. The sequence home separates "no origin" from "cannot read origin" (CF07), and an origin of an unsupported scheme refuses with a named cause before a claim.
- **Errors.**
  - One `WalError → (ResultCode, kebab cause)` mapping used by every port (F-5). This changes a public answer: Publication callers that get `recovery-required` today may get `refused` with a named cause. Every caller moves in the same change (L10).
  - One constructor per code (E-6).
  - One name per failure class across the borrowed and contained paths (F-2).
  - A cause catalogue file is a proposed addition (§6 Q3).
- **One transaction skeleton per question.** One `authority_gate`, one `replay_known_id`, one `commit_result`, one native-state probe list, one skip-worktree parser, one `store_path` (E-21), and one `layout_cause` (E-5). These are folds, made one port file at a time behind red tests.
- **The WAL uses the T0 leaves.**
  - The durable-file checkpoint trait and `sync_directories` (E-8, E-22).
  - Canonical JSON for the record digest, but only after a byte-equality run over every record on disk passes (§4 D7). A digest change is a WAL-version event and does not happen silently.
- **Compaction (F-C1).** Worktree and Refs chains are compacted where their pin is released, with Publication's recent-tail rule. **ConfigChange chains stay retained**, because `hooks_provenance` reads them (`repository_config.rs:688-714`, RT02).
- **Fewer children.**
  - `list_refs` passes the name pattern to `for-each-ref` (F-C4). `WalReader::read_ref` already does so and stays.
  - The floor key reads the config identities from the `--show-origin` listing it already runs, so the two `git var` children go. `PATH` stays in the key (F-C3).
  - `gitPortOptions` reuses an inspect port it is given instead of building one (F-C5).
- **Land waits in Rust (correctness, red-team).** The Land port gets one asynchronous attempt loop that does not block the event loop. The Node `within()` loop and its error re-parse are deleted in the same change. The approved frame of 10-21 12:05 says T0–T4 end with no deciding logic in Node, and which error is retryable, plus for how long, is a decision.
- **Node budget.** `src/git/*` ≤ 225 lines in 12 files (250 in 13 today). `src/setup/git-checks.mjs` ≤ 150 (172 today). Every Node site that re-parses the addon error calls `nativeError()` (E-3). `src/git/recovery.mjs` imports `hotLockDepth` from the holder-lock leaf (E-2).

### 2.2 Terminal-control

- **Authority.** The core owns:
  - which pane a key runs in, and whether that pane is alive;
  - the allocation record and its markers;
  - the placement policy;
  - the only process that runs the herdr binary.
- **Correctness inside the core.**
  - Doctor's `reconcile-scan` observes and never closes (CF02).
  - Closing needs the recorded process tuple, not PID equality. An empty foreground list proves nothing (CF03).
  - An installed marker whose durability is unproven is not reported as plain success (CF04).
  - The herdr runner spawns through Process's explicit-fd door and waits with a deadline instead of polling every 1 ms (CF10, F-C7).
- **Pane access behind the port** (E-10 anchor pane, E-11 agent kinds and integration status, E-12 socket path, E-17 caller ownership on `attach`). These move existing Node and shell behaviour into existing ops, but each needs new answer fields. The owner chooses (§6 Q2). Until then the spawns stay and the spec names them.
- **Delete:**
  - unreachable surface: the activity-launch branch, `label_tab`, the group hint (writer, reader, schema and test together), `KeptUnknown`, three capabilities, `roleHint`, `reportState` and the dead fixtures (E-26);
  - the dead Node exports and one of the two spawn paths (E-13);
  - `herdr-agent.mjs` and the other dead herdr readers (E-16);
  - the `terminal-dir` fix (E-15), but not in the same change as the doctor rewrite.
- **Kept on purpose (red-team).**
  - `herdrSpawnAdapter`: its refusal is the contract of a direct call. It goes to T5.
  - `herdr_driver_live.rs`: the only live-server witness.
  - `pane-owned.sh`, until `attach` checks ownership.
- **Rules move to Rust.** The core validates the config envelope (the 40×8 floor and the grace margin) and names a refusal. Node reads the defaults and the policy registry from `capabilities` (E-14). Writing defaults into config files is CFG's work (hand-off).
- **Contracts are made true by the code they describe (F-8).**
  - `release` and `reconcile-scan` list `unknown` and `unsupported`.
  - The three dead capabilities go.
  - `reason` uses Display, not Debug.
  - One timeout budget is passed down.
- **Node budget.** `client.mjs` ≤ 200 lines (240 today); `config.mjs` ≤ 100 (143 today); `terminal-control-checks.mjs` ≤ 140 (156 today; ≤ 120 if Q2 is yes).

### 2.3 herdr outside the port

- **The worker session-server start** (`worker-session-boot.mjs:90`) is process lifecycle, not a pane operation. It stays raw and is named in the spec, and T4 decides whether the supervisor owns it.
- **The liveness judgment in front of it (CF01)** is fixed in T2 with alive, dead or unknown evidence. Unknown keeps the socket and fails by name.
- **The class-B caller logic** (E-18) goes to T5.

### 2.4 Doctor

| Today | After T2 |
|---|---|
| Git: 10 rows, 4 fixes | **6 rows, 4 fixes:** `git-component-compatible` (absorbs `git-trust-topology` and `git-durability-capability`, which never fail on their own), `git-repository-config` (merges `git-transport-config` and `git-publication-refspecs`, and keeps the refspec fix), `git-operation-journal` (absorbs `git-land-recovery` as a warning), `git-native-locks`, `git-worktree-recovery`, `git-mutation-one-door` |
| Terminal: 3 rows, 1 fix | **2 rows, 0 fixes, after CF02 and E-14 land:** `terminal-control` (absorbs `terminal-config`, with the rules named by the core) and `terminal-allocations` (observation only; each finding carries its pane id) |

- No condition is lost. The surviving owner of every condition is the simplicity seat's doctor table, adjusted to these six Git rows.
- `checkGit` calls `inspectGit` once per doctor run and the rows read its fields (F-C6).
- Each failing row prints one sentence that names its next step, with the facts under `detail` (G-1, G-7, G-8).

### 2.5 Size (ceilings, HARDEN commits only, WORK's `legacyEvents` removal not counted)

| Part | Ceiling |
|---|---|
| Node `src` | ≤ −120 |
| Rust src | ≤ 0 (folds pay for the fixes, the Land async loop and the red tests' production changes) |
| Tests | ≤ 0 net (moves from Node to Rust count as neutral; retired duplicates pay for new red tests) |
| **Layer total** | **≤ −120** |

The seats' estimates run from Rust ≤ +100 (correctness) to −1 100 (simplicity). The red-team showed that part of simplicity's delete list is unsafe, and that its −1 100 counts folds that have not been proved byte-identical. A ceiling is set, not a target. Folds that do not pay are dropped, not forced.

## 3. Disagreements and verdicts

1. **Number of Git doctor rows: 10 → 4 (simplicity), 6 (correctness), or keep 10 and share the call (speed).** **6, plus speed's shared call.** Native locks and worktree registrations have different remedies: a manual runbook for one, `--fix` for the other. A row should name one next step. The red-team agrees. The shared `inspectGit` call is what saves time.
2. **Land wait: an async native binding (correctness) or a Node spacer (simplicity).** **The async binding inside the existing Land port**, with the Node loop deleted in the same change (red-team). Simplicity's reason, that a sync native wait would block the holder, is met by making the wait asynchronous. It does not justify keeping the decision in Node, against the 10-21 frame.
3. **Terminal rows: 3 (correctness, speed) or 3 → 2 (simplicity).** **2, sequenced after CF02 and E-14.** The red-team asked for that order.
4. **The herdr fd seal: Process's explicit-fd door (correctness) or CLOEXEC plus a pidfd wait (speed).** **Process's door,** which already owns the whole fd table and its proofs.
5. **The worker session-server start.** **Stays raw in T2 and is named in the spec. T4 decides ownership.** CF01 is fixed in T2.
6. **E-10, E-11, E-12, E-17: moves (simplicity) or additions (speed, red-team).** **Owner question Q2.** They remove existing Node and shell decisions, but each one adds answer fields to a port contract. That counts as an addition under RUL104 as the red-team reads it.
7. **`ports.v1.json`: regenerate or delete.** **Make it true and pin it in `tests/contracts.rs`.** Nothing is deleted while it is the spec's machine twin.
8. **Severity of F-C1 and F-C2: High (speed) or Medium (red-team).** **Medium.** By the criteria §2.2, measurable slowness is Medium. The fix order does not change: F-C1 is cheap and early.
9. **Speed's delete list.** **The red-team's falsifications stand:**
   - `Policy::LocalMutation` has live callers (`remote.rs:493`, `sequence.rs:200`);
   - `WalReader::read_ref` is compaction's recovery reader;
   - `herdrSpawnAdapter` is a contract refusal.

   None of the three is deleted.
10. **Simplicity's test retirements marked INFERRED.** **Not retired in T2** (design principle 8). Only those marked PROVEN, and the tests of mechanisms T2 deletes, retire.
11. **Size.** See §2.5.

## 4. Decisions made by the big lead inside the approved frame

- **D1 — Order.**
  1. Red tests: one committed red test for each finding the plan fixes that is not yet reproduced:
     - RT01 (an scp-form origin, local bare remote);
     - F-7 (`ssh://user@host`);
     - CF02–CF10;
     - E-5's disagreeing copies;
     - F-5's double spelling.

     A finding whose red test turns out green is closed as "not reproduced", not fixed.
  2. CF01, RT01 and F-7 (the remote door), then F-C1.
  3. The other correctness fixes.
  4. The Git cost changes (F-C3, F-C4, F-C5, F-C6) and the Land async loop.
  5. Git consolidation, one port file per slice: E-5, E-6, E-21, E-22, E-24, F-5.
  6. Terminal-control fixes and deletes.
  7. Doctor.
  8. Contracts and spec.
- **D2 — The sequence counter is in T2** (CF07, CF08, CF09, RT01). The CAS-only/no-WAL decision stands, and the fixes reuse existing primitives. IDENT is told, because the mint door calls this code.
- **D3 — RT01's fix is a fix, not a feature.** The spec already supports SSH remotes (`spec.md:144`). The scp form is git's own spelling of an SSH URL, and the owner's other projects use GitHub's default clone URL. Teaching the one remote door that spelling makes the documented SSH support true. It adds no transport.
- **D4 — F-C2** (the fsync count of a worktree add) changes spec §10 and is an owner question (§6 Q1).
- **D5 — Test move-down** (simplicity's table D) is TEST's work, under the owner's 10-21 rule.
- **D6 — `client-route.test.mjs`'s p95 < 1 000 ms bar.** It is replaced by a count of herdr invocations per op in `herdr_driver_fake.rs`, in the same change. A timing bar on a shared machine proves no behaviour, and the count proves what speed wanted to catch (a probe added per call).
- **D7 — The WAL digest moves to canonical JSON (E-22)** only after a byte-equality run over every WAL record in this machine's repositories passes. If any record differs, the twin stays, and the finding closes as "kept by evidence".
- **D8 — Simplicity's Q1–Q4 are decided here, not asked.**
  - **Q1** (the six legacy `worktree:{root}` acceptances in ScopedCommit and Sync) and **Q2** (the v1 compact-receipt branch). Both are drains. They have outlived a release (written 10-19, three releases since), so owner decision 1 allows them to go once nothing needs them. T2 deletes them only after a census of every repository on both machines reads zero such chains and zero `"v":1` ledger entries. The owner-machine census is a step in the T2 owner-machine guide. If either census is not clean, the drain stays.

    The live Worktree resource form written at `wal.rs:346-355` is a different thing and is not touched (red-team).
  - **Q3** (`abandonedBeforeAttempt`, `configApproved`). The spec states they are outcome kinds, with stable machine names: the cause `abandoned-before-attempt`, and a successful config receipt. No `ResultCode` variants are added, and the `Outcome` variants stay. Simplicity and the red-team agree.
  - **Q4** (typed surface with no caller). Delete the Node-reachable arms that have no caller: `fetchRefs`, `inspectRemote`, the facade name `recover` if Recovery does not use that facade, and `sessionId` on the Node create request if no caller sets it. Each one is proved with `rg` in the commit. The Rust functions that Recovery or Land call stay.
- **D9 — Parked additions** (red-team "hidden additions"). These are listed under §6 Q3, not built:
  - a per-process repository handle cache (F-C5);
  - taking `PATH` out of the floor key (F-C3);
  - a capability cache in the terminal store (F-C7).

## 5. Hand-offs (recorded in the receiving plan in the same turn)

| Item | To |
|---|---|
| Session-server start in `worker-session-boot.mjs:79-116` | T4 (parent plan phase 05) |
| E-18 class B inventory, `settlement.mjs:774`, `usage-parsers.mjs:138-167`, `herdrSpawnAdapter`, E-3 consumer sites outside T2 | T5 (phase 06) |
| Config defaults written into config files (`terminal`, E-14) | CFG |
| Checkpoint/`legacyEvents` deletion; F-3 (`git-grant-check` after the cutover); `cutoverGrant: null` at six callers. T2 deletes the Rust `checkpoint_tracked_files` when WORK's branch lands. | WORK |
| Test move-down (simplicity table D, 53 rows) and the ≈ 5 s of real waits in `core_failures.rs` | TEST |
| G-6, the one-door rule stated four times | rule-management lane |
| 558 `seat-binding bind` host children per doctor run | T5 |
| Per-row doctor timing | already H10 (T9, owner 2b); not re-proposed |
| RT01 and CF07–CF09, sequence-counter fixes | IDENT, for information |
| R2 answer: Phase B stays deferred | OPC (sent 10-23 04:00, board log) |
| Git-area diffs of T2 | OPC reviews them (owner decision 14) |

## 6. Owner ask 2 (batched; template `core/skills/_shared/decision-question.md`)

**Q0. Approve the T2 shapes (§2) and the size ceilings (§2.5)?**
- **What is happening.** The four seats agree that the shape stays: one Rust crate per component, Node thin, every Git call already in process. T2 fixes and folds; it does not move anything.
- **Cause.** The layer was built fast (Git +32 k Rust lines since 10-10), and its weight is scattered duplication, not dead modules.
- **Options.**
  - (a) Approve as written. Cost: about 7 phases.
  - (b) Approve with the ceilings changed.
- **Recommendation.** (a).
- **Scope of the answer.** §2 and §2.5. Q1–Q3 are separate.

**Q1. Fewer fsyncs on a worktree add (F-C2)?**
- **What is happening.** A worktree add costs ≈ 184 ms, and 131 ms of that is 25 fsyncs. About 8–10 of them protect a pin on a commit that the new worktree registration already keeps reachable.
- **Cause.** Spec §10 applies "pin before target CAS" to every kind, Worktree included. The pin's ref write runs with `core.fsync=all` twice, and the ref-directory chain is synced per ref write.
- **Options.**
  - (a) Keep the pin, write it without `core.fsync=all`, and sync the ref-directory chain once per operation before the effect. Saves ≈ 45–55 ms per add (25–30 %). The "pin durable before effect" rule still holds.
  - (b) No pin for a WorktreeCreate whose target equals the registration's HEAD. Saves a little more, but changes spec §10's rule.
  - (c) Leave it as is.
- **Recommendation.** (a). It keeps the protection and makes every worktree add of every project faster (priority 1).
- **Scope of the answer.** A spec §10 sentence plus the change in `refs.rs`. Nothing else.

**Q2. Put the last pane access behind the terminal-control port (E-10, E-11, E-12, E-17)?**
- **What is happening.** Three Node sites and one shipped skill script still run herdr themselves, to check the anchor pane, scrape agent kinds and integration status, and check pane ownership. Herdr's socket layout is written in two Node files.
- **Cause.** These checks were written before the port existed and were never moved.
- **Options.**
  - (a) Move all four. `capabilities` gains `anchorPane`, `agentKinds` and `integrations`; `attach` checks caller ownership through the Process identity door; the driver derives the socket from the session name. Then `pane-owned.sh`, about 100 Node lines and the help-text scraping in Node go. The cost is new fields on two ops, and each move ships its delete in the same change.
  - (b) Keep them raw and name each one in the spec as an exception.
- **Recommendation.** (a). The spec's invariant is that the driver is the only process that runs herdr. These are moves of existing checks, not new capabilities.
- **Scope of the answer.** These four only.

**Q3. Which proposed additions to take?** Each one is parked (RUL104) until chosen.
- **A1 — Chain count and oldest age in the `git-operation-journal` message** (speed 4).
  - Problem: 322 chains grew over four days and nobody noticed.
  - Benefit: the next unbounded kind shows as a doctor warning.
  - Cost: a few lines.
- **A2 — One repository handle per process with formats and the config stamp** (F-C5).
  - Problem: the same `config --list` and formats are read 2–3 times per add.
  - Benefit: ≈ 15–20 ms per add.
  - Cost: a cache whose freshness rests on the existing stamp check (`driver.rs:686-729`).
- **A3 — A cause catalogue `causes.v1.json`** generated from one `Cause` enum (F-6).
  - Problem: about 500 cause names, none contracted.
  - Benefit: agents can switch on a name they can look up.
  - Cost: a contract file and a generator, and a large rename pass.
- **A4 — Take `PATH` out of the floor key** (F-C3).
  - Benefit: small.
  - Cost: risk that a different git earlier on `PATH` reuses a stale floor.
- **A5 — Cache herdr capabilities per server incarnation** (F-C7).
  - Benefit: about 2 children per op.
  - Cost: a cache, while per-op cost is already ≈ 8.7 ms.
- **Recommendation.** A1 and A2. A3 later, as its own item. Not A4 or A5.
- **Scope of the answer.** The picked items go into the T2 sub-plan with their own red test and delete line.

## 7. Red-team summary

- **Missed findings.**
  - RT01 (High; confirmed by reading here; reproduced first in the plan).
  - RT02 (ConfigChange chains must stay retained), which is taken into F-C1's shape.
- **Verdicts.**
  - CF01 High stands.
  - F-C1 and F-C2 are reclassified Medium.
  - F-7 is real and fail-closed for credentials; the big lead adds that it breaks `ssh://user@host`.
  - G-4 is already fixed.
- **Unsafe deletions it found**, all accepted:
  - `Policy::LocalMutation`;
  - `WalReader::read_ref`;
  - `herdrSpawnAdapter`;
  - `herdr_driver_live.rs`;
  - deleting `pane-owned.sh` before `attach` checks ownership;
  - simplicity's INFERRED test retirements;
  - the v1 branch and the legacy acceptances without a census.
- **Hidden additions it found**, all parked into Q3: a repository handle cache, the floor key without `PATH`, and a capability cache.
- **Where the big lead did not follow the red-team.**
  - Q1 and Q2 of the simplicity seat: the red-team said "keep for one release". The big lead decides "delete after a clean two-machine census" (D8), because these drains have already outlived a release.
  - `herdr_driver_live.rs` is kept, as the red-team asked, even though it is not in the gate.

## Unresolved questions

Q0–Q3 in §6.
