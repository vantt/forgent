# HARDEN T0 council: arbitration

Big lead `forgent-a8`, 2026-10-21 15:10 (Asia/Saigon), main `1477ff770`. Inputs: [brief](council-261021-1324-harden-t0-council-brief.md), seats [correctness](council-261021-1324-harden-t0-seat-correctness.md) (codex `gpt-5.6-terra`, tier standard), [speed](council-261021-1324-harden-t0-seat-speed.md) (Claude Fable), [simplicity](council-261021-1324-harden-t0-seat-simplicity.md) (Claude Fable), [red-team](council-261021-1324-harden-t0-seat-redteam.md) (gemini `gemini-4-argon-high`, tier flagship). Every accept or reject below names its source. The owner question set (ask 1) is at the end.

## 1. Outcome in one paragraph

T0 has one clear target: Rust decides every process, durable-write and canonical-JSON question, and Node reaches it through one in-process door, with no route spawn on any path. The council found **seven High defects**:
- three where fgOS can signal or kill the wrong process: gateway stop, `stop-processes-inside`, and lock fence;
- two where the Linux process-group containment misjudges or mutates its caller (subreaper set on the caller, `Unknown` folded into `Empty`);
- one where the gateway stalls 10–15 s and loses its registry;
- one migration trap that would silently drop run deadlines on Windows.

None is Critical. One High is already reproduced (gateway stop kills an unrelated process). The other six get a red test before their fix. The expected net size of T0 is Node −300, Rust ≤ 0 and tests −150 lines.

## 2. Part A: target shape per component (for owner approval, then into each spec)

| Component | Authority | Contract and ports | Rust/Node boundary, Node budget | Delete list | Doctor rows kept | Size target |
|---|---|---|---|---|---|---|
| `fgos-process` + Containment port | Whether a recorded process tuple `{host, bootId, pidNs, pid, startTime}` is alive, dead or unknown; signalling only when identity still matches; spawn with an fd map; the process domain of an attempt and whether it is empty. Nothing else reads `/proc/<pid>/stat`, calls `kill(pid, 0)` or `kill(pid, sig)` by bare pid. | Rust unchanged in shape (simplicity A.1 §2). Node door, synchronous, never throwing on a judgement: `judge`, `observe`, `selfRecord`, `signalByIdentity`, `scan`, `resolveHolderLiveness` (the one "reclaim only on dead" adapter). Loader errors named and fail closed: `process-door-unavailable`, `process-door-not-shipped`. No N-API wrapper for containment `create/spawnIn/guarantee` or domain calls: they have no Node caller (red-team hidden addition 2). | Rust decides everything. `src/runner/dispatch/process-identity.mjs` becomes the thin client, **≤ 60 lines, 6 exports**, no `/proc`, no `process.kill`. One loader leaf owned by T0 (§4, decision D1). | Node leaf judge and readers (`process-identity.mjs:27-147`); the nine `kill(pid,0)` copies (simplicity S-E1, red-team adds `provider-capacity.mjs:579`); `lock-fence.mjs:48-87` (second, weaker signal-by-identity); bare-pid kills in `stop-processes-inside.mjs` and `gateway-control.mjs`; `registrations.mjs:5990-6145` (dead `coordination-abandoned-claims` row, fix and mtime fingerprint); `hot-lock.mjs:57-94` observer, route call and 250 ms cache; the `fgos internal process-observe` route, its contract and Node client (L10, once the door ships on every channel; its only caller is `hot-lock.mjs:60`); Rust `facts::start_time` and `kcmp_same_file` (no outside callers; update `tests/holders_multiprocess.rs:23` in the same commit). | `process-containment` only, named after the component. | Node −300 ± 40, Rust ≤ 0, tests −150 ± 30 |
| `host-runtime` | In T0, only `civil_time` (a stateless shared leaf). The rest of the crate is the Host & Surface (T9) invocation kernel (all four seats agree). | Unchanged in T0. | Node budget 0. | Nothing in T0. Handed to phase 07 for T9, with numbers: `providers/external_process/**` (≈ 4 600 lines incl. tests, no production caller), the test `EchoProvider` and `test.fixture.echo` registered in the production host (`apps/fgos/src/main.rs:105,225`, `catalog.rs:62-72`), the tautological admission gate (`authority_gate.rs:131-146`), the empty `RouterPolicy`, and `command-routes-drift`'s 150–250 ms spawn. | None of its own. `command-routes-drift` stays (T9/Packaging). | 0 / 0 / 0 |
| `canonical-json` | The one definition of canonical JSON bytes (RFC 8785 order by UTF-16, ECMAScript number text); non-JSON input is refused by name. | `canonical_json`, `canonical_line`; Node door export `canonicalJson(value)` that refuses `undefined` members, holes and non-finite numbers with `canonical-json-not-json`. | Rust owns the bytes; Node budget 1 re-export line. | The Node twins `effective-execution-contract.mjs:39-48`, `proof-helpers.mjs:11-23`, `recovery-planner.mjs:69-74`, `reconciliation-planner.mjs:24`, and the test reference implementation in `test/event-store/canonical-vectors.test.mjs`, **each only after a byte-equality run over its persisted corpus** (phase 01 §C). `trust-store.mjs:379-385` `sortedJson` stays: it must match codex's own byte order, not RFC 8785. The release-manifest producer/verifier pair moves together or goes to phase 07. | None. | Node −45, Rust 0, tests −8 |
| `durable-file` | The one way an fgOS record reaches disk when its loss must not go unnoticed: temp, fsync file, install (replace or create-only), fsync directory, and every error says which effect already happened. | Unchanged entries. Node door `replaceDurably` / `installOnce` returning `created`/`already-exists` or a named error carrying `installed`. Two fixes inside the crate (RT-M7): skip the directory fsync when `install_once` found the name already there, and make the error text name the step and effect (simplicity S-F3). | Rust owns durability. Node keeps the existing per-module no-fsync helpers (no new shared helper; red-team hidden addition 1), but every Node temp name comes from `uniqueTmpTag` (fixes the pid-less names in `attestation-store.mjs:184,212,312`). | The 5 durable-replace and 4 create-only Node helpers that already fsync (no cost change; 3 of them gain the directory fsync they skip or swallow today, which also fixes F-A4). The no-fsync class, the mode-preserving trust store, copy-then-rename and WORK-owned writes stay. | None. | Node −110, Rust ≈ 0, tests 0 to +20 |

## 3. Part B: accepted findings (go into the T0 sub-plan)

| ID (source) | Severity | Status | Where | Fix shape |
|---|---|---|---|---|
| F-A1 + RT-M4 (correctness, red-team) | High | **reproduced** (red-team: `stopGateway` killed an unrelated child; a zombie made stop take 10.16 s) | `src/runner/gateway-control.mjs:66-72,177,225-231,238-259,287-315` | Record the full tuple at start; judge and signal through the door; keep `gateway.json` and fail by name if the process survives `SIGKILL`; an old pid-only entry gives `IdentityUnknown` and is never signalled. |
| F-A3 (correctness) | High | inferred → red test first | `src/runner/dispatch/stop-processes-inside.mjs:33-72` | `scan` + `signalByIdentity` through the door; the self/parent exclusion stays `process.pid`/`process.ppid` (red-team: in-process, so nothing shifts). |
| RT-M3 (red-team) | High | inferred → red test first | `src/runner/lock-fence.mjs:48-87,175-192` | Use the record's own tuple; `null === null` can never mean "same identity"; delete the Node signal-by-identity. |
| RT-M1 (red-team; confirmed by the big lead at `containment/linux.rs:243,476-482`) | High | inferred → red test first | `packages/process/rust/src/containment/linux.rs` `LinuxPgroup::spawn_in` | Set the subreaper on the domain leader in `pre_exec`, never on the calling process (spec `process/spec.md:40` already says subreaper is the run supervisor's). |
| RT-M2 (red-team; confirmed at `linux.rs:417,440`) | High | inferred → red test first | `containment/linux.rs:408-442`, `containment/macos.rs:175-226`, `live_rows` `:328-338` | `Unknown` folds to `DomainState::Unknown` and `refused`, a failed `/proc` listing is `Unknown`, never `Empty` (contract `containment.port.v1.json:39`). |
| RT-M5 (red-team) | High | reproduced by reading (callers exist; Windows `bootId` absent) | `provider-capacity.mjs:11,578-580,642-645`, `run-supervisor/direct-launch.mjs:17,130-138`, `cancel-registry.mjs:16,75-83`, `run-lock.mjs:51-59` | Migrate these with the door in the same change; keep `'unknown-boot'` where Rust readers require a string; fix `pidNs` to the `pid:[…]` form Rust compares. |
| S-E1 (simplicity) | High (one door) | reproduced | nine `kill(pid,0)` judges | One door, two caller policies (reclaim only on `dead`; signal only on `Sent`). |
| S-A1 / F-A5 (simplicity, correctness) | Medium | reproduced | `effective-execution-contract.mjs:39-48`, `scripts/build-rust-distribution.mjs:37-47` | The door refuses non-JSON; corpus proof before deleting the twins. |
| F-A4 (correctness) | Medium | inferred | `run-lock.mjs:108-126`, `proof-helpers.mjs:73-125` | Fixed by moving those durable sites onto `durable-file` (its post-effect error is kept). |
| F-A2 (correctness) | Medium | inferred | `gateway-control.mjs:121-132` | Registry write through `durable-file`, with the F-A1 change. |
| RT-M6 (red-team) | Medium | reproduced | `process-identity.mjs:98-106` | Disappears with the move; retire the two tests that pin the Node-only behaviour. |
| RT-M7 (red-team) | Medium | reproduced by reading | `durable-file/rust/src/lib.rs:256-295`; `provider-credential-renewal.mjs:721-750` | Skip directory fsync on `AlreadyExists`; the Node wrapper removes a retained temp; `treeDigest` ignores `.durable-file-*.tmp`. |
| S1 (speed) | Medium | reproduced | `facts.rs:242-245`, `platform/mod.rs:62-74` | Read boot id and pid namespace once per process (they cannot change); judge 5.2 → about 2.8 µs, scans −25%. |
| S-E2 / S4 (simplicity, speed) | Medium | reproduced | six `/proc/<pid>/stat` parsers (three in Rust) | One parser in `facts` keeping `state` (red-team unsafe deletion 6: zombies must stay filtered in `members()`). |
| S-E6 (simplicity) | Medium | reproduced | `containment/linux.rs` vs `containment/macos.rs` (~150 copied lines) | One process-group module over a small listing port. |
| S-F1, S-F2, S-F3, S-G1, S-G2 (simplicity) | Low | reproduced | process spec §3/§8, boundary row, containment contract, error texts | Spec and contract follow the code; §8 superseded by name; each named error carries its next step. |
| S11 / §A #10 (all seats) | Low | reproduced | `registrations.mjs:5990-6145` | Delete row, fix and helpers; delete only lines 47–115 of `test/setup/doctor-coordination-checks.test.mjs` (lines 16–45 own the live `runner-coordination-orgPolicy-shape` row); update `checks.test.mjs:193` and the three docs that list the row; close backlog `p-3c7681b8`. |
| S-C1 (simplicity) | Low | reproduced | three 1 000-iteration fast-exit loops in `containment_*.rs` | Bound to 100; same behaviour proven. |
| RT-M8 (red-team) | Low | reproduced by reading | `packages/process/rust/src/mapped.rs:237-238` | Use an absolute `request.cwd` without `current_dir()`. |
| S-D1 / S10 | Low | reproduced | `facts::start_time`, `kcmp_same_file` | Delete (see Part A). |

**Tests:** verdict cases leave Node for `judge_vectors.rs` plus one Node wiring case; the "unknown is never reclaimed" policy moves into one owning proof of `resolveHolderLiveness` before its copies retire; the "injected `isAlive` short-circuits" cases are retired as behaviour removed; one Node wiring proof that a reused pid gets `IdentityMismatch`; one two-contender proof per create-only site that moves. `test/rust-host/help-routes.test.mjs` (119 s) is T9 behaviour: handed to the TEST lane and phase 07 with the measured fix (spawn the host directly, keep one dev-door case).

## 4. Decisions made by the big lead inside the approved frame

- **D1. One combined addon, a T0-owned loader leaf.** The process, durable-file and canonical-json exports go into the existing combined addon `packages/git/node-addon`, which already links `fgos-process` (`Cargo.toml:16-18`). A second `.node` file would mean two single-load markers, two digests and two artifacts per target. The loader moves down out of `src/git/native.mjs` into one T0 leaf, which `src/git/native.mjs` then calls. This fixes the layering inversion (phase 01 Q1) and avoids the reconcile import-graph trap (red-team hidden addition 3): `ALLOWED_BUILTINS` gains `module` and `EXPECTED_CLOSURE` gains the leaf in `test/runner/dispatch-reconciliation-import-graph.test.mjs`, deliberately. The loader verifies the addon once per file identity and never adds a second hash of the same file (speed S14). The GIT lane is fixing the per-process re-hash separately. Reverse if the GIT lane shows the combined addon cannot carry the T0 namespaces without breaking E3.
- **D2. The npm channel needs a `native-addon.json` descriptor that nothing produces today** (simplicity Q1). Shipping the addon on the npm channel was accepted by the owner on 12:05, so producing that descriptor is part of the T0 change (Packaging touch, counted in T0's size), not a new question. Direct `node bin/fgos.mjs` without a release refuses by name, as Git already does. macOS is not a release target.
- **D3. The bwrap probe and git-in-bwrap cost (about 10 ms of every CLI call) goes to the GIT/OPC lanes, not T0.** The lazy-probe idea is falsified: every caller spawns right after `select` (red-team disagreement 4). An unprobed driver breaks hosts without user namespaces. Whether read-only git needs a pid namespace at all is a Git/OPC policy question. T0 adds no cache.
- **D4. Rejected:**
  - deleting `command-routes-drift`: it breaks two tests and three documents, and the row is a T9 concern (red-team disagreement 2);
  - making `EchoProvider` test-only, or removing `test.fixture.echo` in T0: it breaks the crate's integration tests, and `main.rs` is on the SEAT carry list (red-team unsafe deletion 4);
  - deleting `sweepProcessGroup`: it is the live macOS leftover sweep and belongs to T1 (red-team unsafe deletion 5);
  - a new shared `src/util/write-atomic.mjs`: a new module, it touches SEAT/GIT files, and it confuses temp-name prefixes (red-team hidden addition 1);
  - N-API wrappers for containment calls without a Node caller (red-team hidden addition 2);
  - speed S6 as a defect: it is the Q2 boundary, not a bug (red-team verdict 4);
  - keeping `pidExists` for `gateway-control.mjs`: it keeps RT-M4 alive.
- **D5. Accepted duplication:** the four private no-fsync write helpers in Rust crates stay. Fsyncing a heartbeat on every tick would add I/O to every live run. This is recorded in the durable-file spec.
- **D6. Order inside T0** (the sub-plan details it):
  1. Red tests for the six unreproduced Highs.
  2. The door: loader leaf, addon namespaces, npm descriptor.
  3. Process sites, except the SEAT carry list.
  4. Containment fixes RT-M1 and RT-M2.
  5. Durable and canonical sites (canonical after the corpus proof).
  6. Deletions and spec updates.
  7. After SEAT lands: the carry list.

  Leads run in parallel only where their file sets do not overlap.

## 5. Handed to other lanes or phases

- **GIT lane:** the per-process addon re-hash (already taken); the bwrap-probe and git-in-bwrap numbers (D3); D1's loader move, coordinated before the T0 sub-plan locks it.
- **TEST lane:** `help-routes` (119 s → about 1 s); bound the fast-exit loops if TEST owns test cost; the per-layer list in the test investigation §9.
- **Phase 07 (T9):** the host-runtime list in Part A, and doctor per-row timing.
- **WORK lane:** nothing new. `hot-lock.mjs:57-99` (T0) and `:290-394` (WORK) stay separate.
- **DOC lane (`forgentx-5f`):** T0 will change `docs/platform/process/spec.md`, `docs/platform/component-boundary.md` (row "Process Facts & Control (L0)"), `docs/platform/holder-lock/spec.md:229,238,312`, `docs/specs/reading-map.md:57,59`, and the three docs listing `coordination-abandoned-claims`. A message goes out before merge.

## 6. Owner ask 1 (batched)

See the chat message of 2026-10-21 15:15; answers are recorded here when given.

1. Approve the Part A target shapes in §2. Each then gets written into its component's spec.
2. Proposed additions: pick none, some or all.
3. The T0 landing slot.

## Unresolved questions

- The correctness seat ran at tier `standard`, because `fgos run` defaults to rigor standard. The red-team (flagship) re-checked its two Highs and found both real. Later layers' seats should pass `--rigor high`.
