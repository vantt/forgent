# Event Store phase 07 review fixes

C1/H1: rollback accepts real mode-040000 directory entries only on allowed paths, preserves pinned historical bytes, and appends v4 porting records to `porting/events.jsonl`. Work uses basename shard tags and its production reducer; porting uses its own production reader/reducer. Real nested-tree fixtures compare Rust's exported Work order exactly with `readAllEventsFromDir`, verify porting visibility, and exercise a porting-only parity difference.

M1/M2/M4, L1/L2/L4/L5/L6/L8: rollback defaults to project streams and rejects explicit private streams; doctor allows unrelated pushes and negative fetch exclusions; identity setup canonicalizes the state root while preserving leaf protections. Explicit-stream exports skip status; discovery uses the configured remote. Live linked-worktree branch keys are tested before/after removal. Empty publication state no longer warns, but real pending project events do. Converted events retain origin/stream/sequence identity in the legacy-compatible `eventStoreId` extension.

M3: one `eventStoreDoctor` checker shares lazy facts/status per invocation; phase 09 must use that checker when registering rows. Ahead/behind now share two paginated reachability walks instead of four. Disagreement with the proposed excluded-tip optimization: `Inspect::walk_commits` includes stop commits and stops only at those OIDs, rather than excluding reachable ancestry. A real sealed-chain regression caught the incorrect counts; retain exact set differences through the existing port.

L3: chose the review's documented-partial-output option. The spec now requires a successfully returned result and completed parity report before using rollback output; remove failed output and retry. L7 remains the accepted dormant default duplication: phase 09 must replace the existing registration shape with `EVENT_STORE_DEFAULTS`, not add a row. No cutover registrations or changelog entry are activated here.

Reused the verified reader, frozen legacy order, durable installer, production reducers and Git Inspect port. History searches found these bodies introduced by `408e0d694`; no removed implementation to restore. The broader gate also corrected the platform-refusal fixture to enumerate native entry points, rather than platform-independent config values/helpers. No out-of-scope edits remain, no dependencies/config defaults added, and no staging/commits. Convention lookup returned the current-clock 10:56 path; this report uses the assignment's explicit 10:52 path. Impact-analysis: inactive (zero providers).

Validation: all requested gates pass:

```sh
cargo test --locked -p fgos-event-store -p fgos-node-addon
cargo clippy --locked -p fgos-event-store -p fgos-node-addon --all-targets -- -D warnings
node --test test/event-store/*.test.mjs test/setup/event-store-*.test.mjs test/architecture.test.mjs
git diff --check
```

Rust: 139 passed, one existing ignored qualification test. Clippy: clean. Node: 80 passed, zero skips, including both real strace windows and architecture checks. An initial overlapping addon build invalidated rustdoc artifacts; the final serial run passed. Evidence logs: `/tmp/es-p07-u2-{rust-final,clippy-final,node-all}.log`. MDView preview is unavailable because its database is read-only.

Status: DONE_WITH_CONCERNS
Summary: Corrected rollback isolation/parity and doctor/setup findings; all requested verification gates pass.
Concerns/Blockers: Partial output on export failure is documented; shared doctor checker registration remains phase 09's cutover responsibility. The coordinator must update the program-board ES row, outside this write scope (listed in needsWrites).
Context refs:
- (none)
