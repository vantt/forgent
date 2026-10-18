# Event Store phase 02: review fixes

| Finding | Fix | Evidence |
|---|---|---|
| H1: acknowledged corruption could be truncated before refusal | Both decode modes refuse complete batch-commit lines after a decoding failure; recovery validates sequence sources and the hint before truncation | `p02_review.rs`: damaged middle batch followed by valid batch; damaged last complete batch; both readers, append and rotation refuse, active bytes unchanged. Unbacked hint plus torn tail also remains byte-identical. Wrong-checksum marker now refuses rather than being discarded. |
| M1: repeated directory syncs, hint replacement and closed verification | Sync closed/open-root only during creation; retain stream-dir sync on every invocation to cover a predecessor killed before its dir sync. Repair hints from closed/receipt maximum, not active; rotation skips an equal hint. Recover from validated closed filenames with strict newest-segment verification; readers and seal retain full verification | Three steady-state appends each perform two real fsyncs (active file and stream directory), with no hint replacement; C1, receipt, rotation ordering and crash tests pass |
| L2: duplicated atomic replace | Shared `replace_durably` and boundary-observed variant reuse install_once's filename validation, exclusive O_NOFOLLOW temporary creation and effect-aware errors; hwm uses that leaf. Removed misleading temporary-mode comment | Durable-file replacement, destination-symlink isolation, invalid-name and before/after-rename effect tests; real hint-boundary SIGKILL tests |
| L3: garbage hint and unnamed stray entries | Unparseable/invalid hint treated as absent and rewritten; invalid closed names include their path | `garbage_hint_is_rewritten_and_stray_closed_path_is_named` |
| L4: already-folded vanished segment bounced the gate | Preserve vanished ranges; require catch-up only when last > cursor | Real deletion after closed listing, with cursor below and at range end |
| L6: sparse kill sampling | Raised real-write SIGKILL prefixes from 5 to 59 (1..1000, stride 17), retaining exhaustive in-process byte-prefix coverage | Seven kill/concurrency tests pass, with real child SIGKILL and no sleeps or environment switches |
| L1 / L5: later phase contracts | Phase 04 explicitly requires seal acquisition/rank checks, facade refusal, typed rotation guard, shared durable receipt replacement and no temporaries in closed/. Phases 03 and 04 require own-ref cross-check after simultaneous receipt/hint loss | Requirements recorded only; deliberately not implemented in phase 02 |

Validation: `CARGO_TARGET_DIR=.fgos/runtime/phase-target cargo test --locked -p fgos-event-store -p fgos-durable-file -- --test-threads=1`: **56 + 8 passed**. `cargo clippy --locked -p fgos-event-store -p fgos-durable-file --all-targets -- -D warnings` with the same private target: passed. `node --test test/holder-lock/registry-contract.test.mjs test/event-store/*.test.mjs`: **30 passed**. Package formatting and `git diff --check`: passed.

Prior art: extended shared durable-file installation rather than adding another atomic-write mechanism; history identifies f1181a1d1 for shared-leaf adoption and 20a75261b for open-log recovery. Impact-analysis: inactive (zero registered providers). Report path follows the explicit brief; convention lookup returned the current-minute variant. MDView preview failed because its database is read-only. No git add/commit or lifecycle writes.

Status: DONE_WITH_CONCERNS
Summary: H1, M1, L2, L3, L4 and L6 are fixed and all required scoped checks pass; L1 and L5 are explicit later-phase requirements.
Concerns/Blockers: Mutation/crash evidence is on the current tmpfs test filesystem; ext4 mutation/crash testing, physical power-loss proof and full npm test were not run. Active-log verification still scales with active size; phase 09 measures latency.
Context refs:
- (none)
