# Event Store phase 09 / unit 6

13: Added two-process races in distinct linked worktrees through public `moveWork` and `claimWork`: one CAS winner and one last-slot winner, with both workers alive until inspection and real settlement afterward. A native sequence-recovery refusal retains the claim/cache; explicit metadata restoration permits exactly one subsequent settle. The Linux x86_64 ptrace harness intercepts the actual settle `write`, injects ENOSPC or SIGKILL before acknowledgement, verifies unchanged claim/cache and no attempt, then verifies recovery and exactly one attempt. Both fault modes passed here; no store replacement or production fault branch exists.

14: The conflict vector now uses three actual clones, separate state roots and distinct machine ids, crossing offline CAS events with identical timestamps/coverage, and identical complete views/conflict records after exchange. Bounded rebuild proof now races actual gated appends, preserves the latest writer-installed cache after exactly `maxAttempts`, then installs once current.

15: Extended the existing V-SPAWN-01 harness with `--store-increment --strace`: 1/10/15/20 concurrent worker processes, 200 actual consumer mutations per level, 60-second bound, zero-spawn trace windows and JSON verdict. Timing adapters delegate every call to the real native facade. The measured increment upper bound includes in-gate read, append/fsync, folds, cache persistence and unlock; waits are reported separately, including all convoy observations at 15/20. Capability absence fails loudly. The concurrent worker smoke and explicit tmpfs rejection pass; **no ext4 latency numbers or part (b) result are claimed**.

16: Added `test/event-store/door.test.mjs`, using the existing source lexer, scoped assignments, aliases, arrows, imported forwarding wrappers and Rust command builders. Synthetic counterexamples pass, including readers through wrappers and production following a Rust test module. Ownership exceptions are only the existing named facade/crate, parsing, immutable inventory, metadata and independent-journal classes. The real repository gate **fails**, without a new bypass: raw invocations remain at `src/runner/worktree.mjs:332,1369`, `src/runner/merge.mjs:1713`, and `scripts/git/e3-bench.mjs:149,492,577,591`. These include branch push/Land CAS and the historical raw Git baseline; their migration belongs to the Git caller cutover, not a weakening of this proof. No retired-file reader remains after distinguishing metadata guards from reads.

Reused the phase-01 benchmark (history: `25074b911`), existing consumer/native gate, real release fixtures and source lexer. History has no prior PTRACE_SYSCALL harness in the searched script/test/Event Store paths. Impact-analysis: inactive (zero registered providers). `npm run build:skills` regenerated `.claude/skills/instruction-audit/SKILL.md`; it is a generated, ignored surface under existing policy. Its 127 wrapper tests pass. Convention returned the current-time report path; this report follows the assignment's required path. No production mechanism, contract, lock or Git caller was changed.

Validation (exact commands):

- `node --test test/event-store/v-auth-01.test.mjs test/event-store/work-gate.test.mjs test/event-store/work-conflicts.test.mjs test/event-store/v-spawn-bench.test.mjs test/setup/skill-wrappers.test.mjs test/architecture.test.mjs` — 181 pass, 0 fail.
- `node --test test/event-store/*.test.mjs` — 83 pass, 1 fail (door), 5 existing migration/PID-namespace skips. Final scanner-only refinement still reports the seven invocation sites above, zero retired readers.
- `node --test test/event-store/door.test.mjs` — synthetic scanner proof passes; repository gate fails on those seven sites.
- `node scripts/event-store/settle-host-proof.mjs --host` — ENOSPC and SIGKILL each print PASS; repeated after tracer cleanup correction, both pass.
- `node scripts/event-store/v-spawn-bench.mjs --root /dev/shm/fgos-u6-explicit-host-refusal --sessions 1,10,15,20 --store-increment --strace --out /dev/shm/fgos-u6-explicit-host-refusal/result.json` — expected exit 1, JSON FAIL (`ext4 required; got tmpfs`), no fixture created.
- `git diff --check` and Node syntax checks for the three harness scripts pass; Python AST parsing passes. No full npm suite, Git staging/commit, activation or project migration ran.

Exact host-only acceptance commands (from this worktree; fresh latency root, Linux x86_64 for ptrace):

```sh
node scripts/event-store/settle-host-proof.mjs --host
mkdir -p .fgos/runtime/tmp
node scripts/event-store/v-spawn-bench.mjs --root .fgos/runtime/tmp/v-spawn-ext4 --sessions 1,10,15,20 --store-increment --strace --out .fgos/runtime/tmp/v-spawn-ext4/cutover.json
```

The latency command requires that parent to reside on ext4 and requires usable strace/ptrace; missing capability is a JSON FAIL/nonzero exit, never a skip. Keep `cutover.json` and per-worker traces for host acceptance. The coordinator still owns the out-of-scope program-board lane update and existing host-only migration/full-suite acceptance. MDView preview failed with a read-only database; no preview URL is available.

Status: BLOCKED
Summary: Work authority, reconciliation, bounded rebuild and real settle-fault proofs pass; the ext4/strace/convoy harness is ready for the host. Acceptance remains blocked by seven existing raw Git invocation sites and the outstanding host latency verdict.
Concerns/Blockers: V-DOOR-01 is deliberately red; no allowlist was added to hide the remaining Git caller cutover. Host measurements are not available from the sandbox.
Context refs:
- (none)
