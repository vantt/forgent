# Git phase 06 unit 2 — Land recovery

Added dormant recovery through the existing Rust Land, addon `GitLand`, and Node `createGitLand` port. No production caller migration, lifecycle verbs, sub-agents, git add/commit, full npm suite or E3.

Recovery holds destination 20 → admin 40 → main 50 → recovery 80, validates writer/repository/authority and quiescence, and never replays a target CAS or adopts reflog-only candidates. No-attempt chains become abandoned; observed candidate effects get an observed-only receipt. Exact-old checkout completion requires recorded per-path old/next fingerprints and the captured index fingerprint. Mixed/user-edited states, corrupt journals, missing objects and unknown native locks fail closed. Prepared pin rewind repairs only the candidate pin. Dangling native-lock symlinks are also foreign state.

Reused the existing WAL filesystem checkpoint seam, no-follow path fingerprints, admission scan, holder locks, Worktree removal/delivery proof, exact-old pin helpers and compact ledger. Prior art includes phase-05 recovery commits `159c165a8`, `869e789d7`, `d2192042a`; no parallel repair core was added. New Land identities may proceed under the same destination authority without discarding an older unresolved chain or its candidate lifecycle exclusion; the actual clean/native-state gate still applies.

Cleanup is allowed only after a nonempty consumer acknowledgement asserts durable settlement of its unique `(repoIdentity, operationId, settlementKind)` identity, the terminal checkout is reconciled/not-applicable, and Worktree's existing custody, not-live, clean and reachable-delivery checks pass. Git still reports `consumerSettlement: notOwnedByGit`. Removal precedes exact-old base/candidate pin deletion and compaction. Dirty/unproven candidates and unknown temporary artifacts retain evidence with warnings; cleanup failures do not negate Land. Compact replay preserves request identity, destination, tips and observed-only attribution after candidate deletion or external ref drift.

Proof: 57 deterministic SIGKILL points across Land WAL/pins/CAS/checkout/receipt; 34 across acknowledged cleanup/pins/compaction; four real Linux/x86_64 native `read-tree` syscall kills after index-lock creation, file writing, index writing and index installation. The internal kills reproduce files-next/index-old/index.lock and assert exact preservation, without sleeps or production test switches. Successful recovery permits fresh Land; every WAL and cleanup kill point also checks a fresh id. Node covers real verifier SIGKILL, recovery, acknowledgement, deferred cleanup and compacted replay. Shared existing Land fixtures were extracted for reuse.

Validation:

```sh
cargo test --locked -p fgos-git -p fgos-node-addon
cargo test --locked -p fgos-git --test land_crash_matrix -- --nocapture
cargo test --locked -p fgos-git --test land_crash_matrix native_read_tree_syscall_crashes -- --nocapture
cargo clippy --locked -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
node --test test/git/land-recovery.test.mjs test/git/land.test.mjs test/git/refs.test.mjs test/git/scoped-commit.test.mjs test/git/sync.test.mjs test/architecture.test.mjs
git diff --check
```

The final crash matrix passed nine tests (two explicitly invoked child/controller helpers are marked ignored in the top-level harness); the focused Node/architecture run passed 87 tests. Five real recovery WAL records, including `observedOnly: true`, passed Python `jsonschema.Draft202012Validator` against the WAL schema. Standalone addon Rust tests emit expected Node-API symbol diagnostics without a Node host; the real Node addon tests pass. `impact-analysis: inactive` (zero providers); call sites checked with rg.

Limits: an unowned native index lock remains recovery-required, even with matching files/ref; this unit does not invent owned-index provenance or quarantine it. Fresh Land remains refused until §11 inspected repair in that branch. WAL records themselves create no permanent destination block. Native syscall tracing is Linux/x86_64-specific. The program-board row is outside the write scope and remains for the owning lead. MDView preview failed because its database is read-only. The report uses the assignment's exact authorized path; convention lookup was performed.

Status: DONE_WITH_CONCERNS
Summary: Dormant Land recovery, acknowledgement-gated cleanup, compacted replay and crash coverage are implemented and verified. Unknown native locks remain safely preserved for inspected repair.
Concerns/Blockers: Automatic native-lock repair is not claimed; program-board update and MDView preview remain external limitations.
Context refs:
- (none)
