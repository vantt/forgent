# Git phase 06 unit 1 — Land prepare and publish

Implemented dormant Rust `prepare_land`/`publish_land`, addon `GitLand`, and Node `createGitLand`. Requirements 1–3 and 5 only; no production callers switched. No git add/commit, full npm suite, E3, lifecycle verbs or sub-agents were used.

Prepare owns the destination's existing merge-slot 20, checks rank order before effects, validates topology/commit types/checkout state and the initial clean gate, and creates its detached candidate through the existing Worktree WAL door under 40. Candidate construction retains only 20. Merge has exact target/source parents; squash has one target parent. Conflicts abort only the candidate. Declared literal bytes are applied before freezing; tracked target `.fgos` bytes stripped by worker allocation are restored in the candidate. Candidate and base pins retain immutable inputs.

Publish binds nonempty opaque consumer evidence to source, target, candidate and the canonical SHA-256 digest of its tree OID; it checks pins/types, candidate HEAD/index/status and the clean gate under 40 then 50. `land-verified → TargetAttempt → CAS → checkout observation → Outcome` uses the existing WAL. Exact-old CAS is never replayed after an unknown attempt. Successful same-id replay returns its established receipt even after an external ABA. The receipt leaves business settlement `notOwnedByGit`; the M4 fixture documents consumer identity uniqueness and query-before-retry, without claiming Work/Event Store adoption.

Reused the existing backend preflight/config-stamp/topology/borrowed-child door, Refs pin/ref-sync/receipt/admission helpers, Refs ignored/incoming collision check, Worktree detached allocation and custody-keyed resources, LockScope and the write-scope leaf's existing prefix overlap predicate. Shared backend checks were extracted rather than copied; ScopedCommit/Sync and Refs regression checks passed. Updated the WAL schema, architecture manifest, Git spec status and changelog. Out-of-scope code edits: none.

Interpretations and handoff boundaries:

- Following §9 steps 2–3/§10, consumer verification holds only the destination slot 20, outside 40/50/60. The native session owns 20; an externally held slot is refused instead of retaining a synchronous FFI loan across verification. All ranks above 20 refuse as `lock-order-violation`.
- Non-overlapping dirt reports `checkout: pending` (lagging), preserving bytes. Ignored non-store incoming collisions refuse before CAS. An ignored `.fgos` collision never enters the clean gate; reconciliation is deferred rather than overwriting those bytes.
- Candidate directories, all three pins and terminal Land WAL remain evidence for later recovery/consumer-acknowledged cleanup. This unit exposes neither Land recovery nor compaction. Production caller migration remains phase 07. No new infrastructure prerequisite was introduced.
- `impact-analysis: inactive`: the capability query returned zero providers. Call sites were checked with rg. The program-board row is outside this assignment's allowed writes and must be updated by the owning lead. MDView preview was attempted; its database is read-only in this environment.

Validation (all passed):

```sh
cargo test --locked -p fgos-git -p fgos-node-addon
cargo test --locked -p fgos-git --test land --test refs_remote --test scoped_commit_sync
cargo test --locked -p fgos-git --test land
cargo clippy --locked -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
node --test test/git/land.test.mjs test/git/scoped-commit.test.mjs test/git/sync.test.mjs test/git/refs.test.mjs test/architecture.test.mjs
node --test test/git/land.test.mjs
rustfmt --edition 2021 --check packages/git/rust/src/land.rs packages/git/rust/tests/land.rs packages/git/node-addon/src/git/land.rs
git diff --check
```

Final focused Land coverage: 8 Rust tests, 16 Node tests. The combined Node regression/architecture run passed 75 tests before five additional Land cases were added; all 16 Land cases passed afterward. Real emitted records from `cargo test --locked -p fgos-git --test land real_merge_evidence_and_same_id_replay -- --nocapture` also passed Python `jsonschema.Draft202012Validator` against `packages/git/contracts/wal-record.v1.schema.json` (five records: Intent, Prepared, verification, TargetAttempt, Outcome). The standalone addon Rust test executable emits Node-API symbol diagnostics without a Node host and exits successfully; the Node tests exercise the real addon.

Status: DONE_WITH_CONCERNS
Summary: Dormant Land prepare, evidence binding, one-shot publication and M4 replay are implemented and verified. Recovery/cleanup remain explicitly assigned to later units.
Concerns/Blockers: The owning lead must update the shared program-board row outside this unit's write scope; MDView preview is unavailable because its database is read-only.
Context refs:
- (none)
Expected outputs:
- (none)
