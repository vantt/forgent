Unit 4 is blocked at the caller ownership boundary. No production Git caller was switched. Two real native-port regressions were added to `test/git/land.test.mjs`; every previous assertion remains unchanged.

The current caller contract cannot be translated into Land without coordinated changes to explicitly excluded files:

- `src/verbs/merge/approve.mjs:466,533,539` and `src/verbs/merge/sync-root.mjs:214,265,283` acquire the target slot, run inbound catchup under it, create a detached checkout, and call `mergeRunnerItem` with that scope/checkout. Native Land owns slot 20 itself, rejects a borrowed slot (`land-slot-already-held`), and requires the main repository handle (`land-main-handle-required`). Both refusals are now reproduced with real holder-lock handles and registered Git worktrees. The tests prove no candidate allocation and no target/ref movement. Merely omitting the borrowed scope would also leave two slot key conventions: the old wrapper encodes a short branch, whereas Land encodes the full `refs/heads/...` destination. It would not preserve mutual exclusion.
- `src/runner/worktree.mjs:1327` owns the existing ephemeral callback's subsequent CAS and forced cleanup. That wrapper must leave the landing path when Land becomes the sole publisher; a compatibility adapter must not keep a second publication owner. This file belongs to the parallel Worktree lead.
- `src/runner/claim-port.mjs:109` calls `checkpointMainFgos` inside main 50. Moving the truncation guard outside Git locks while migrating its callback requires this caller to change too. The guard cannot release a caller's live handle on its own. Claim-port belongs to the parallel Worktree lead.

Required coordinated shape: the verbs provide the main root, explicit destination and consumer policy inputs; Land owns candidate preparation/publication and its slot; Work retains catchup/verification/settlement policy. Catchup's source custody and destination-slot ordering must be carried explicitly. The Worktree lead removes the old CAS wrapper from these callers. Work prepares truncation/compaction policy before entering Git, then supplies declared exact event paths to the existing adapter. No slot release/reacquire workaround, raw restage, implicit event sweep, new mechanism or guard bypass was added.

Census disposition:

| Family / rows | Disposition |
| --- | --- |
| `github-adapter.mjs` candidates 40/49 | Closed by classification: this is the existing `gh pr` API transport, with no local Git operation; keep its timeout/query and actual merged-OID contract. No source change needed. |
| `merge.mjs` readers, merge writes, decision transforms, sweep and post-CAS restage | Open. The old Git-spawning bodies remain; no one-door completion claim. |
| `promote-engine.mjs` branch creation and ephemeral merge callers | Open. Its locally owned caller can migrate with Land, but the shared merge API still has the excluded callers above. |
| Work event adapter / truncation guard / main checkpoint / compaction | Open. No existing event assertion was retired. Compaction also needs a spec-first extension for its archive manifest: current `legacyEvents` permits only the listed JSONL classes, not `.manifest.json`. |

Prior art reused: native Land prepare/publish and immutable candidate/receipt handling (`78429d1dd`); extracted merge verbs (`9a600342d`); holder-lock checkpoint ownership (`cd7ed1207`); state-transaction compaction (`64de0de56`); Unit 2/3 exact legacy-event declarations and native borrower tests. No production mechanism was copied or replaced. `impact-analysis: inactive` (zero registered providers). No config default, environment variable or infrastructure dependency was added.

E6 mapping: all 20 previous `test/git/land.test.mjs` tests and both legacy-event adapter tests are **kept**, with their assertions unchanged. The two added Land tests cover caller-owned-slot and ephemeral-handle rejection before effects. No assertion was retargeted, weakened or retired; no E6 labels were added to test titles. The merge/promote/event/CLI families remain unmigrated and their E6 retargeting remains open.

Focused verification used the existing source-owned host/addon and isolated fixture directories:

```sh
mkdir -p /tmp/fgos-work/u4-state /tmp/fgos-work/u4-fixtures
chmod 700 /tmp/fgos-work/u4-state
export FGOS_STATE_ROOT=/tmp/fgos-work/u4-state
export FGOS_TEST_FIXTURE_ROOT=/tmp/fgos-work/u4-fixtures
export FGOS_HOST_BIN="$PWD/target/debug/fgos"
export FGOS_ACTIVE_MANIFEST_PATH="$PWD/.fgos/runtime/git-addon/native-addon.json"
node --test test/git/land.test.mjs
node --test test/git/legacy-event-adapter.test.mjs
cargo test --locked -p fgos-git --test land --test land_crash_matrix
cargo clippy --locked -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
git diff --check
```

Node: 22 Land tests and 2 legacy-event tests passed. Clippy and whitespace checks passed. Rust: 14 Land tests and 15 crash-matrix tests passed (2 child/controller entry tests ignored by design). No full npm test or E3 was run. MDView preview was attempted but its database is read-only.

After the coordinated migration, the outer session must run the consumer suites through its source-owned host/addon (these commands are required follow-up, not evidence from this unit):

```sh
export FGOS_HOST_BIN="$PWD/target/debug/fgos"
export FGOS_ACTIVE_MANIFEST_PATH="$PWD/.fgos/runtime/git-addon/native-addon.json"
node --test test/runner/merge*.test.mjs test/runner/promote-engine.test.mjs test/runner/land-vs-manual-commit.test.mjs
node --test test/git/land*.test.mjs test/state/events-*.test.mjs test/direct/merge-gate.test.mjs test/cli/fgos-post-merge.test.mjs
```

`needsWrites`: `src/verbs/merge/approve.mjs`, `src/verbs/merge/sync-root.mjs`, `src/runner/worktree.mjs`, `src/runner/claim-port.mjs` for the coordinated contracts above; `plans/261017-1313-fgos-platform-program-board/plan.md` for the coordinator's blocked-lane update. None was edited. Report path verified through `fgos convention path --kind report --type phase-lead --slug git-p07-u4-land-merge-promote --at 2026-10-20T12:34:00+07:00 --json`.

Status: BLOCKED
Summary: Added passing regressions proving the current excluded merge callers cannot enter native Land unchanged. The requested production migration remains open and requires a coordinated caller handover.
Concerns/Blockers: Explicit file ownership excludes the callers that must change together; no partial production switch or release acceptance is claimed.
Context refs:
- (none)
