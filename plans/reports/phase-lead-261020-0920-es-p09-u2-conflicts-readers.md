# Event Store phase 09 / unit 2

A and the reducer conflict rule are implemented; requirement 6 is partial. No commits or lifecycle verbs. Reused the native facade, Work gate, consumer rebuild port and pure reducer. History searches found attestation's original fail-open file reader in `1e2799f96` and Rust readers in `120af6b3d`; no prior reducer precondition mechanism was found. Impact-analysis: inactive (zero providers). Convention lookup returned the current 09:22 name; this report uses the exact 09:20 path required by the assignment.

Package files now include the two exact Work/porting stream contract paths. CLI rebuild never deletes a consumer cache; an acknowledged-log corruption test proves a failed real Work rebuild preserves the previous bytes. The future porting contract remains absent until unit 4.

The gate records durable existence/status preconditions, advancing a private fold across a staged batch. Replay checks existence, expected status and explicitly recorded durable capacity, skips invalid concurrent foreign events and records `{h, origin, reason, against}`. Causally observed failures throw. Per-item existence/status provenance makes seeded replay deterministic; schema 5 invalidates old caches. Work items are copied when seeding a fold so replay cannot mutate its input. Runtime claim capacity remains local coordination, rather than pretending it is replicated durable occupancy. Real independent stores exchange sealed refs and converge on identical views/conflicts for crossing moves, duplicate adds and the last durable slot. Pure legacy fold vectors remain unchanged.

Reader census (literal single/double quoted events.jsonl, events directory joins, all readEvents/readEventsFromByte/readAllEventsFromDir importers, Rust joins):

| Family | Disposition |
| --- | --- |
| Work readRawEvents/currentView/rebuild; CLI consumers; claim-port; verify-fanout-overlap | Already use the Work facade on the unit-1 tree. |
| runner loop executor.dispatch | Moved the eighteenth legacy append through withMainState/tx.append, including its cursor and staged commit. |
| attestation-guard | Facade read; corrupt and deferred/missing history fail closed. Missing attestation on a complete history still skips. Reclassified this existing Git/I/O adapter as infra, matching its dependencies. |
| measure-verify-cost; probe-storytelling-material | Moved to readRawEvents; removed obsolete file-line-count invariant. Probe CLI uses --dir; its real-store CLI test replaces the legacy-file fixture. |
| registrations doc registry plus eight doc-health sentinels | Open/read the facade, propagate failures; the real-host test proves doc-alias-broken runs without events.jsonl. |
| registrations friction migration | Reads facade legacy records with original provenance, excluding current events. |
| src/report/enduser-index-generate.mjs | **Scope-blocked:** line 124 still uses the old file sentinel. |
| work-state Rust WorkSource/LegacyFrictionSource | **Scope-blocked prerequisite:** adding fgos-event-store/fgos-git/holder-lock dependencies requires Cargo.lock, outside scope. Left the dependency graph buildable rather than editing manifests without their lock. |
| replay legacy reader, migrate parity and tests | **Pending:** readAllEventsFromDir is not yet deleted; migrate still consumes it, as do legacy replay/compaction tests. Must migrate the parity proof and retarget frozen-vector/export tests together before deleting it. |
| regenerate-observe-fixtures | **Pending:** still writes legacy Work fixtures; session events are a separate store. |
| legacy append/compaction/truncation/repair/checkpoint/Land restore readers | Retained for the explicitly assigned removal unit; their live callers remain. |
| explicit actor/status/category migration scripts | Historical file-rewrite tools, still pending retirement/admission decision in the removal sweep. |
| workflow/session/assignment/observe journals, worker logs, tool metadata; Rust test fixtures | Separate stores or fixtures, not Work event readers. Event Store crate readers are the owning implementation. |

Validation:

- `node --test test/event-store/work-consumer.test.mjs test/event-store/work-conflicts.test.mjs test/event-store/work-gate.test.mjs test/event-store/verbs.test.mjs test/architecture.test.mjs` — 53 passed, zero failures.
- `node --test --test-name-pattern='^foldEvents|^viewRevision|^serializeView' test/state/replay.test.mjs` — 74 passed, zero failures.
- `node --test test/scripts/probe-storytelling-material.test.mjs` — 7 passed, zero failures.
- `node --check` for the modified scripts/registrations and `git diff --check` pass.
- An earlier broader run adding all `test/state/replay.test.mjs` failed on legacy fixtures whose initStore now needs a shipped native addon descriptor (`git-addon-not-shipped`); not reported as green or bypassed. No full npm test.
- npm pack dry-run could not open its global cache (EROFS); packaged-file admission was not independently proven. MDView preview also failed because its database is read-only.

Required scope additions: `Cargo.lock`, `src/report/enduser-index-generate.mjs`; the program-board lane row also remains outside scope. Requirement 6 needs another round, including the pending in-scope parity/fixture work listed above. No Rust dependency or partial Rust reader changes were made.

Status: BLOCKED
Summary: Cache preservation, contract inclusion, deterministic precondition conflicts and the scoped Node reader moves are implemented and focused tests pass. The complete reader cutover remains blocked by two excluded files and has explicit pending parity/fixture work.
Concerns/Blockers: Add Cargo.lock and src/report/enduser-index-generate.mjs to writes; update the program-board lane separately. Do not call requirement 6 done.
Context refs:
- (none)
