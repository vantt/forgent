# HARDEN re-check of T3: Agent protocol, Observe, Event Store

Pinned tree: `/home/vantt/projects/forgent-worktrees/harden-recheck` at `b4817283f`. Read-only. `git-one-door-scan` run without `--write-census`: 0 undeclared sites. No test or cargo run.

**Verdict: DRIFT (2 small, 3 large).** Nothing High. The approved shapes of 04a and 04b still hold. The three focus points came out as follows:
- **Mailbox registration goes through the Event Store consumer door.** It adds a manifest entry and no second path.
- **No production reader of `.fgos/events.jsonl` remains.** One import verb and some residue do.
- **No Observe writer bypasses the friction door.**

## Focus points, verified

**1. Mailbox consumer registration (lead:MAIL, lead:ES).**
- `packages/event-store/contracts/consumers.v1.json` has a fourth entry `mailbox` that names only `contractFile`.
- `src/event-store/consumers.mjs:24-37` validates "cachePath and rebuildModule present together or absent together", and `loadRebuildModule` refuses a registry-only entry at `:48-49`. `src/verbs/events/rebuild.mjs:31` skips it.
- The contract `packages/mailbox/contracts/event-streams.v1.json` has two `mailbox.*` types, each with `domain: mailbox`, and reaches the crate through the same `registryFiles()` to `Registry::load_files` (`src/event-store/native.mjs:63`, `packages/git/node-addon/src/event_store.rs:222`).
- Commits: `89743bb9e` (MAIL, contract) and `3d67f6fee` (registry-only entry), both 2026-10-28.
- `test/event-store/consumers.test.mjs` proves the registry-only entry and its three malformed shapes.
- No other `mailbox` file under `packages`, `apps` or `src` references `mailbox.message-sent`, `mailbox.message-settled` or `event-streams.v1.json`. The types are registered ahead of any producer, which is a sequencing note and not drift.

**2. `.fgos/events.jsonl` and legacy import/export.**
- Reads of the retired files: none outside the reader of the pinned fence history (`packages/event-store/rust/src/read.rs:348-370`, deliberately kept by H33).
- Remaining references to the retired path:
  - `bin/fgos.mjs:287-300`, a noise-path regex with a comment saying it stays "as long as a checkout still carries" the files. It is acceptable.
  - `.githooks/pre-commit:327-351`, which refuses re-adding the retired paths. It is acceptable.
  - Stale wording, see T3-5.
- Still alive and not covered by the H33 package: the `events import-legacy` verb (T3-1).
- `events export` stays as a plain JSONL export. `packages/event-store/rust/src/export.rs:103-130` still emits pinned legacy records ahead of the sequence when the fence is held. That is consistent with the fence reader.

**3. Observe writers.**
- Every append goes through `packages/observe/rust/src/shard.rs:180` (`append_lines`), called from `friction.rs:202`, `case_journal.rs:195`, `eval_journal.rs:175` and `metrics_cli/snapshot.rs`. No other `OpenOptions` append exists in `src`.
- Node writes friction only through `src/observe/friction-client.mjs`, 79 lines and 2 exports, with no value lists.
- `FGOS_NOW` and `FGOS_CALLER_PID` are gone from `src`, `bin`, `scripts`, `apps`, `packages` and `test`.
- Not a store writer: `src/setup/registrations.mjs:4918-4926` writes a transient probe file into `.fgos/observe` for the `observe-dir-writable` row.

## Findings

| id | sev | size | file:line | what drifted | introduced by | fix shape (RUL104) | owner |
|---|---|---|---|---|---|---|---|
| T3-1 | Medium | small (about -150 lines, one verb) | `src/verbs/events/import-legacy.mjs:1-69`; `bin/fgos.mjs:2925-2929`; `src/cli/command-registry.mjs:1611,1618`; `test/event-store/import-legacy.test.mjs`; `test/event-store/triggers.test.mjs:193` | The stray-shard import verb is still shipped. Arbitration section 5 and WORK's ordering kept it only until the import ran on every machine that held shards, and `b6927cce9` says it ran on both. The module also holds a second Node reader of the Work contract (`:9`). | `db00088c0` 2026-10-25, ES (kept on purpose by the H33 package `b6927cce9`) | Delete the verb, its route, its registry entry, its test and its census row. Fix the `triggers.test.mjs` usage-string assert. Moves nothing and adds nothing. | lead:ES |
| T3-2 | Medium | large (crosses crates, needs an owner call) | `apps/fgos/src/wiring/identity_log.rs:23,63-66` and `:54-58` | The host registers Identity's stream through its own `Registry::default()` built from an `include_str!` copy of the contract, next to the manifest entry that Node uses. That is two registration lists for one consumer. The same function also probes the `.fgos/events` fence itself (`:57`), a fact owned by `packages/event-store/rust/src/fence.rs`. | `49ca4a016` 2026-10-24 and `9ee860fdb` 2026-10-25, IDENT | One list: let the crate load the manifest, so that the host, the addon and the mailbox use it. A fence question gets asked of the crate, not re-tested in wiring. The arbitration did not decide this, so it is not a bug fix. | lead:ES for the crate, IDENT for `identity_log.rs`. Owner decides first (see Unresolved). |
| T3-3 | Medium | large (WAL record schema) | `packages/git/rust/src/scoped_commit.rs:18,1420-1450`; `packages/git/contracts/wal-record.v1.schema.json` (cutover grant) | The Git cutover grant path has no producer. Every Node caller passes `cutoverGrant: null` (`src/runner/execution/commit-unit-work.mjs:125`, `scripts/knowledge-migration.mjs:303`, and the three Git scripts). The Event Store migration it served was deleted by `b6927cce9`. H33 left it as "left out". | `0074f94ae` 2026-10-19, Git | Delete the grant and its fence branch after confirming that existing WAL records carrying it still replay. | OPC (Git) |
| T3-4 | Low | large (machine-read contract) | `packages/observe/rust/src/friction.rs:28,109`; `packages/observe/contracts/observe.friction.v1.json:144` | `resolve --reason migrated` is accepted, and its only writer, the friction importer, was deleted. H33 kept it as reader data. | `661e2925d` (H33) removed the writer, and the reason stayed | Keep while stored records carry `migrated`. If none do, drop it from the input list but keep the read side. | HARDEN (Observe has no standing lead) |
| T3-5 | Low | small | `.gitignore:4`; `.githooks/pre-commit:327-329`; `src/event-store/native.mjs:82`; `packages/event-store/rust/src/legacy_import.rs:1` (225 lines, no import left); `scripts/regenerate-observe-fixtures.mjs:150-153`; `packages/holder-lock/rust/src/route.rs:30` and its contract note | Names and comments describe a migration that no longer exists ("events.jsonl is truth", "A migration installed it", "the legacy-migration check", a module called `legacy_import`, "cutover fence" callers). | `b6927cce9`, `661e2925d` 2026-10-28 | Reword the comments. Rename `legacy_import.rs` to `legacy_fence.rs` in the same change as its callers (`event_store.rs:261,610`, `identity_log.rs:14`, `src/setup/event-store-checks.mjs`). | lead:ES; holder-lock lines to the T0 owner |

## Items checked and found clean

- **Agent protocol shape (04a):**
  - `AgentIo` has `send`, `screen`, `inspect`, `now_ms` and `pause`.
  - `StdinPolicy` is gone.
  - The only `thread::sleep` is the default `pause` (`packages/agent-protocol/rust/src/port.rs:53`).
  - The crate is 1 258 lines, down from 1 883, and nothing outside `run-supervisor` uses it.
- **Event Store test targets:**
  - Every `std::os::unix` test file is gated `#![cfg(target_os = "linux")]`.
  - `legacy_import.rs` was cut from 917 to 225 lines.
  - `src/state/events.mjs` and `src/state/legacy-event-git-adapter.mjs` are gone.
- **Event Store doctor rows:** 8, not the 7 the arbitration aimed for. `event-store-native-addon` stayed with a stated reason (part 2, item 4), and `event-store-legacy-layout` stays while the fence is read.
- **One door to the refs:**
  - The only `refs/fgos` users are the Git crate, the Event Store crate, `work-state/event_reader.rs` (a test fixture) and Git scripts.
  - Layering: the Event Store crate imports no upper layer.
- **One loader in Node:** `consumers.mjs` is the only reader of `consumers.v1.json`. The two other Node readers of the Work contract (`src/state/work-event-store.mjs:12`, `import-legacy.mjs:9`) are the consumer reading its own contract, and the second goes with T3-1.
- **Observe doctor:** the four rows are down to three, because `observe-friction-migrated` retired with the fence. `observe-run-coverage` kept the directory-count comparison as the plan said (phase 05 requirement 3). `projectRunEligibility` is gone (`rg` over `src` and `test`: 0).

## Status of the layer's open items

| Item | Source | Status |
|---|---|---|
| Wire `Direct::classify` into the supervisor, delete the Node regexes | 04a arbitration section 5, T4 | **Open, carried.** `classify` is at `packages/agent-protocol/rust/src/direct/mod.rs:48` with no production caller (`supervise.rs` uses `activity_from` and `newest_result` only). Node wording lists remain: `src/run-supervisor/steps/settle-attempt.mjs:99-134`, `src/runner/dispatch/provider-auth-failure.mjs:45-52`, `provider-account-probe.mjs:26`, `provider-credential-probe.mjs:24`. T4 and T5 re-checks own this. |
| T5 list: stderr rules in `settlement.mjs`, `provider-capacity.mjs` text rules | 04a section 5 | Open. `settlement.mjs:630` still carries the usage-limit wording. |
| D17 friction fence, `.fgos/observe/.lock/TOMBSTONE` | 04a section 5 | **Done** (`661e2925d`). No TOMBSTONE logic left for Observe. The remaining `TOMBSTONE` hits are the activation lock in tests and scripts. |
| D4 to D7, D14 | 04b section 4 item 4 | **Done** (`b6927cce9`, `da33d3bcc`), except the import verb (T3-1) and the cutover grant (T3-3). |
| D13 settle-fault proof | H33 report | Open by decision: the scripts remain the only owner. |
| `fgos-event-store` in the msvc/darwin land gate | 04b inputs | Test targets are gated (verified). The gate list itself is not verified, see Unverified. |
| `mirror differs from pin` test | 04b inputs | Kept by H33 in `tests/legacy_import.rs`. |
| RT-21 `pid-<N>` shard names | 04a section 5, Identity | Still possible: `shard.rs:79` falls back to `pid-<id>` for `pid` and `unresolved` sources. Shard readers treat `pid-` as non-session (`:86`), so it is bounded. Open for IDENT. |
| S-1 fsync cut, hot-lock proposal | 04b section 4 item 3 | Owner question once evidence exists. No code moved. Not re-verified. |
| Backlog `p-duxnm52lzh` (seal child that cannot start leaves no record) | part 2 report | Not re-checked. |
| Plan hygiene | `261024-2035-harden-t3a-agent-protocol-observe/phase-0[1-6]-*.md` | All six still say `status: pending` although 04a landed. Documentation drift only. |

## Unverified

- **T3-3:** whether older WAL records carrying a non-null grant must still replay. Confirm with `rg cutover` in `packages/git/rust/tests/recovery_matrix.rs` and by reading the WAL schema.
- **Duplicate proof of the manifest loader:** `test/event-store/consumers.test.mjs:23` and `test/event-store/verbs.test.mjs:98` both build a temporary payload with a custom manifest. They may prove the same lazy-resolution behaviour. Confirm by reading the second test to the end.
- **Land-gate list:** whether `fgos-event-store` is in it. The list lives in scripts or board text that I did not locate.
- **`src/state/work-event-store.mjs:12`:** the `lifecycle` set decided in Node from `sealOnWrite`. If `Registry` already decides seal-on-write (`registry.rs:17`), this is a Node copy of a store fact. Confirm in `consumer-event-gate.mjs`. Owner lead:WORK.

## Ideas to add (owner decides)

None.

## Unresolved questions

1. T3-2: is the host-side embedded Identity registry accepted as the Identity lane's own door, or should it join the manifest door? This is a design call, and the 04b arbitration did not cover it.
2. T3-1: confirm that no machine still holds an un-imported stray shard before the verb is deleted. The H33 commit message says both machines are done.

Status: DONE
Summary: T3 has not drifted from the approved shape. The mailbox registration goes through the existing consumer manifest, and no Observe writer bypasses the shard door. Five findings: the leftover `events import-legacy` verb, a second host-side registry for Identity, a dead Git cutover grant, a dead friction reason and stale names.
Concerns/Blockers: none. The open-item list carries the unwired direct `classify` to the T4 and T5 re-checks.
