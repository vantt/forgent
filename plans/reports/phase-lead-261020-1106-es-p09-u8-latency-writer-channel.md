# ES-09 unit 8: host follow-up

Base: `dbb5305a1`; branch `es/p09-cutover`. No git staging or commit performed.

Latency was measured before optimization with the consumer/benchmark timers.
The paired rerun restored the five changed Rust production files to HEAD for
its before half, then restored the edits in a `finally` block and rebuilt the
combined addon for its after half. Both halves used fresh real stores, one
session, 40 additions and identical timers. **These are sandbox tmpfs/debug-addon
observations, not ext4 acceptance.** Raw observations: `/tmp/fgos-work/es09-u8-paired.json`.

| Milliseconds, p50 / p95 | Before | After |
|---|---:|---:|
| Part (a), including precondition preview fold | 26.79 / 32.96 | 17.11 / 26.75 |
| Read in gate | 6.22 / 10.25 | 0.25 / 0.37 |
| Append, recovery and fsync | 19.96 / 27.01 | 16.49 / 26.12 |
| Fold new events | 0.12 / 0.20 | 0.12 / 0.21 |
| Precondition preview | 0.12 / 0.17 | 0.14 / 0.22 |
| Cache write | 0.41 / 0.45 | 0.39 / 0.53 |
| Read-through-unlock upper bound | 27.30 / 33.52 | 17.69 / 27.24 |

Steady append fsyncs: **3 → 2**, measured with strace over 10 additions.
Cleanup no longer fsyncs an untouched directory; actual removals still sync.
Active-file and stream-directory barriers remain. Changed bytes always run the
full verifier; a single bounded (4 MiB input) thread-local frame is reused only
for exact freshly read bytes, origin, stream and strictness. Receipt validation,
sequence recovery, locking and fsync acknowledgement are unchanged. Regression
proof rewrites same-size bytes, changes origin, switches strictness, and appends
after restoring the original bytes.

Git execs per steady mutation: **18 → 6** (54 between gates over nine intervals,
zero inside the gate). Inspect reuses Git's existing stamp-validated config door;
fence checks reuse the current read's authority/HEAD. No HEAD/ref observation is
cached across commands. The remaining six calls are two symbolic-ref, two
rev-parse and two for-each-ref observations. Thus repeated config/HEAD work was
removed, but the request to eliminate *all* outside-gate Git spawns is not fully
met. Raw after trace: `/tmp/fgos-work/es09-u8-after.trace`.

Spec §17, lines 525–531, excludes cache persistence from part (a). Cache writes
remain physically inside the gate; the benchmark now reports both the exact
part (a) sum and its original upper bound, stage timings, nested append fsync
counts and a steady Git census. The target remains **p95 ≤ 50 ms at 20 sessions
on ext4**, with zero gate spawns and 200 mutations within 60 seconds. The supplied
host `cutover.json` / `trace-summary.jsonl` still represent a failing old build;
old host p95 was 69.0/68.0/71.5/71.6 ms at 1/10/15/20 sessions. This report does not supersede that failure. No evidence establishes that meeting the
budget requires dropping durability, so no budget decision is proposed.

Same-writer settlement now compares v4 `src` with the claim writer, using the
same resolved identity passed into append. Legacy numeric PID stamps normalize
to strings; missing/invalid legacy attribution and foreign writers still refuse.
Tests cover session and plain CLI writers, plus same/foreign store attribution
when a payload omits its redundant writer stamp.

For npm, chose **actionable channel refusal before state writes**, as explicitly
allowed by this assignment. Plan M10 (`plans/261018-0945-event-store-fgos-event-store/plan.md:107`)
requires the addon in the ES-09 release or activation admission; spec §23.2 item 9
(`docs/platform/event-store/spec.md:714`) requires addon distribution and refusing
incomplete payloads. This does not claim npm distribution is complete. The packed
npm test proves init names the unsupported npm/legacy Node channel, directs the
user to a complete fgctl release with `components.nativeAddon`, and creates
neither `.fgos` nor `.git/fgos`.

Commands/checks:

```sh
cargo test --locked -p fgos-event-store -p fgos-git
cargo clippy --locked -p fgos-event-store -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
node --test test/state/runtime-coordination.test.mjs test/event-store/work-consumer.test.mjs test/event-store/v-spawn-bench.test.mjs test/event-store/work-gate.test.mjs test/event-store/work-conflicts.test.mjs test/event-store/no-spawn-in-gate.test.mjs test/event-store/facade.test.mjs
node --test test/architecture.test.mjs
npm_config_cache=/tmp/fgos-work/npm-cache node --test test/setup/doctor-fresh-run.test.mjs
git diff --check
```

Results: Rust 367 passed, 10 intentionally ignored qualifications; clippy green;
targeted Node 65 passed; architecture 29 passed; packed npm 1 passed. Logs:
`/tmp/fgos-work/es09-u8-{rust,node,clippy,npm}.log`. An initial npm invocation hit
the sandbox's read-only default cache; the real pack/install rerun used the
writable cache above. Workspace-wide formatting check found pre-existing drift;
only touched Rust files were formatted. Impact-analysis: inactive (zero providers).

Exact measured worker invocations (setup uses the existing real phase07 fixture,
configures machine id `spawn-benchmark`, and creates the ready/go barrier):

```sh
node scripts/event-store/store-increment-worker.mjs /tmp/fgos-es-p07-wQ415Y/repo /tmp/fgos-es-p07-wQ415Y/state .fgos/runtime/git-addon/native-addon.json "$PWD" 0 40 /tmp/fgos-es-p07-wQ415Y/barrier no
node scripts/event-store/store-increment-worker.mjs /tmp/fgos-es-p07-4AbIBc/repo /tmp/fgos-es-p07-4AbIBc/state .fgos/runtime/git-addon/native-addon.json "$PWD" 0 40 /tmp/fgos-es-p07-4AbIBc/barrier no
strace -qq -f -e trace=execve,fsync,fdatasync,write -s 256 -o /tmp/fgos-work/es09-u8-after.trace node scripts/event-store/store-increment-worker.mjs /tmp/fgos-es-p07-NbFfi0/repo /tmp/fgos-es-p07-NbFfi0/state .fgos/runtime/git-addon/native-addon.json "$PWD" 1 10 /tmp/fgos-es-p07-NbFfi0/barrier yes
```

Coordinator's pending host command (fresh ext4 root):

```sh
node scripts/event-store/v-spawn-bench.mjs --root .fgos/runtime/tmp/v-spawn-ext4-u8 --sessions 1,10,15,20 --store-increment --strace --out .fgos/runtime/tmp/v-spawn-ext4-u8/cutover.json
```

The program-board ES row is outside this assignment's write grant and remains
for the coordinator to update. MDView preview was attempted; its database is
read-only in this sandbox.

Status: DONE_WITH_CONCERNS
Summary: Reduced repeated verification, fsync and Git work; fixed plain-writer settlement and addon-less npm init guidance.
Concerns/Blockers: Ext4 20-session acceptance remains with the coordinator; six fresh Git calls per mutation remain; npm addon distribution remains incomplete.
Context refs:
- (none)
