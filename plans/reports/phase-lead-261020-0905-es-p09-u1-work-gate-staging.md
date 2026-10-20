# Event Store phase 09 / unit 1

Implemented requirements 1–4 on `es/p09-cutover`; no commit, activation or lifecycle mutation. Reused the phase 06–08 native facade, 4.3-S hot mutex/transaction, pure Work reducer, cache path registry and consumer rebuild port. History searches traced `withStateTx` to `4a4e8446e` and `readInGate` to `56d42a27c`; neither mechanism was replaced. Impact-analysis: inactive (zero providers).

The Work gate prepares/catches up outside the mutex, folds only its own tail inside, checks preconditions, acknowledges one staged batch, hydrates returned events, applies staged file effects in call order, and writes the view/revision/schema/cursor last. Lifecycle sealing uses native try acquisition after release. Catch-up and sequence recovery release the gate before retrying; stale cursors throw. Explicit rebuild retries current-position installation only up to the configured bound, preserving the previous cache on refusal.

Census (patterns, not historical line numbers):

| Surface | Finding / disposition |
| --- | --- |
| Literal `type`, FSM returns, knowledge wrappers | 28 registered project types: decision; 9 doc types; executor.dispatch; goal.focus; 5 topic types; 11 work types. Exactly work.move, work.gate-approve, decision and every work.outcome seal on write. |
| `tx.append` | 17 executable sites in store.mjs, all inspected by the source guard; the runner's executor.dispatch is the eighteenth legacy site, scheduled for the later reader unit. |
| In-gate durable view reads | add/edit/resolve-park/focus/move/settle/step/call/call-return/decision/knowledge now use tx.view. Claim-port's fresh durable view also uses tx.view. Both public full readers refuse under the hot mutex. |
| Settle revision drift | Full history analysis moved before entry; reconciliation is bound to the exact item revision checked inside the gate. |
| Runtime claims, slot count, plan tip | Fresh local coordination reads remain inside their serialization gate; no history replay or process spawn. |
| Legacy compaction, direct external event-file readers, runner audit | Retained for the explicitly later removal/reader unit. Work's own reader pair now uses the facade so its new writes are immediately visible. |

Proof uses real temporary Git repositories and native stores, without a store mock or production test switch. Added batch framing/return hydration, staged effect order, refusal preserving claim/files/cache, callback/async refusal, tail-before-precondition, catch-up retry, successful lost-receipt recovery, persistent recovery corruption, bounded rebuild races, cache invalidation, lifecycle sealing and two-process append tests. A public API test runs through a disposable descriptor with a real host/addon: init, add, edit, claim, same-writer drift, batched settle, topic registration and rebuild. Existing tests retained; the formerly empty-registry rebuild assertion was retargeted to the registered Work cache.

Validation:

- `node --test test/event-store/*.test.mjs test/architecture.test.mjs test/state/hot-lock-tx.test.mjs test/state/hot-lock-guard.test.mjs test/state/state-tx-static.test.mjs` — 107 tests: 102 passed, 5 existing PID-namespace skips, 0 failed (74.7 s).
- `rustfmt --check packages/git/node-addon/src/event_store.rs` and `git diff --check` pass.
- No full npm suite or commits, as instructed. Real disk-full/SIGKILL-before-ack fault injection and the later concurrency/latency acceptance vectors were not run here. The suite's existing five migration/quiesce tests skip in this PID namespace.

Integration gaps outside this unit's permitted writes:

- `package.json` must ship `packages/work-state/contracts/event-streams.v1.json`; its current package files include only the Event Store contracts. Without this, the packaged Work consumer cannot import its contract.
- `src/verbs/events/rebuild.mjs` deletes a cache before calling its consumer. It must preserve the old cache and let the consumer replace it atomically, otherwise the CLI path defeats the bounded-install guarantee even though Work's direct rebuild preserves it.
- The program-board lane update is outside the permitted paths and was not written. Later units still own legacy read-before-migration behavior, foreign conflict replay, external readers, removals, packaging/registration and broader state-fixture retargeting.

MDView preview was attempted; its database refused writes (`attempt to write a readonly database`).

Status: BLOCKED
Summary: Scoped Work gate, staging and cursor-cache implementation is complete and tested. Packaged consumer admission and CLI rebuild preservation require the two out-of-scope edits listed above.
Concerns/Blockers: Expand the write scope for package.json and src/verbs/events/rebuild.mjs; update the program-board lane separately.
Context refs:
- (none)
Expected outputs:
- (none)
