# Event Store read latency

Base: `a184db4cc`, branch `es/store-latency`. Store only; Work remains unwired. Impact-analysis: inactive (zero providers). Report path resolved with `fgos convention path --kind report --type phase-lead --slug es-store-read-latency --at 2026-10-20T14:20:00+07:00 --json`.

Prior art: `1ab6c566d` introduced stamped Inspect config and verified frames; `6390b4d70` introduced bounded consumer-root discovery; Git 06b `fdb4fdf59` reused operation-local facts. Extended these doors. The trace found repeated certified-tip traversal/header loading; temporary profiling attributed about 263 ms of a steady read to envelope validation/order, versus about 21 ms to legacy authority/HEAD observation. Profiling instrumentation was removed.

Changes: advance the benchmark cursor with the in-gate tail; record exact outside-read timers; reuse certified tips only after observing the same ref-name/OID binding; reuse authority/HEAD/legacy refs within the current command. Consumer sequences carry opaque native validation proofs through a WeakMap: full envelope equality is checked before reuse, edits revalidate, and copied/lost views use normal verification. Git facts are always observed afresh. Native JSON transfer returns only a proven equal-prefix suffix; public snapshots remain independent. The existing bounded frame cache verifies actual prefix bytes, the new tail and cross-boundary continuity. All append durability barriers remain.

Host baseline from `/home/vantt/.claude/jobs/e1505f04/tmp/es-store-gate/latency-0d35aa5a4-ingate-cursor.json`:

| Sessions | Outside remainder† p50/p95 ms | Git execs/steady mutation | Store increment p50/p95 ms | Append fsyncs | After host run |
|---:|---:|---:|---:|---:|---|
| 1 | 548.3 / 610.5 | 8.96 | 39.37 / 47.64 | 3–4 | pending |
| 10 | 491.9 / 716.2 | 9.78 | 43.16 / 58.48 | 3–4 | pending |
| 15 | 484.1 / 1354.3 | 9.88 | 42.48 / 58.86 | 3–4 | pending |
| 20 | 485.2 / 1933.1 | 9.68 | 42.35 / 55.40 | 3–4 | pending |

† Old worker lacked a separate read timer: `totalMs − incrementUpperBoundMs − waitMs` includes outside view construction/overhead and bounds read time; it is not an isolated read measurement. The brief's isolated 1-session read was approximately 530 ms.

Sandbox diagnostic, same sealed 1,000-item seed, worker timers under strace: steady outside read **425.82–428.95 → 104.54–105.83 ms**, successful Git execs **11 → 6**. Steady in-gate p50/p95 **8.96/19.01 → 18.65/25.33 ms**; these are only two/three observations under differing load, not evidence of an in-gate improvement or acceptance. Both traces show **three steady append fsyncs**; the baseline's first post-seal append used four for recovery cleanup. Cold full reads remain approximately 1.2 seconds. Evidence: `/tmp/fgos-es-p07-hExaSs/baseline.trace`, `/tmp/fgos-work/es-store-latency-final.trace`, `/tmp/fgos-work/es-store-latency-final-diagnostic.json`.

Validation:

- `cargo test --locked -p fgos-event-store -p fgos-git -p fgos-node-addon`: **371 pass, 0 fail, 10 ignored entries**, including child harnesses and opt-in namespace/stress gates.
- `cargo clippy --locked -p fgos-event-store -p fgos-git -p fgos-node-addon --all-targets -- -D warnings`: clean.
- `node --test test/event-store/*.test.mjs`: **67 pass, 0 fail, 5 existing migration namespace skips**. Final snapshot/marshaling checks: `node --test test/event-store/store-hardening.test.mjs test/event-store/facade.test.mjs`: **21 pass**.
- Final Rust refactor checks: `cargo test --locked -p fgos-event-store --test reader_review_regressions --test framing_prefixes --test legacy_import`: **22 pass**. Tests cover edited retained views, concurrent real workers, growing/torn frames, boundary gaps, namespace identity, lost views and fsync barriers. `git diff --check`: clean.

Logs: `/tmp/fgos-work/es-store-latency-{rust,node-final,clippy,node-snapshots,rust-final}.log`. No full npm suite, acceptance latency run, staging or repository commit. MDView preview attempts failed because its database is read-only. The coordinator must update the program-board ES row, outside this assignment's write scope.

Coordinator host command (fresh root required), from this worktree:

```sh
node scripts/event-store/v-spawn-bench.mjs --store-increment --strace --sessions 1,10,15,20 --seed-items 1000 --root /home/vantt/.claude/jobs/e1505f04/tmp/es-store-gate/store-read-after-fixture --out /home/vantt/.claude/jobs/e1505f04/tmp/es-store-gate/store-read-after.json
```

This builds the working-tree addon. Keep the 60-second timer; read `rows[].outsideRead`, `gitExecsPerSteadyMutation`, `storeIncrementP50Ms`, `storeIncrementP95Ms` and `appendFsyncs`. Host migration tests must also remove the five sandbox skips.

Conditional owner decision, only if the host still exceeds 50 ms and profiling establishes a durability floor: **Situation:** 20-session acceptance remains unmet. **Cause:** measured serialized append/barrier cost after CPU work is reduced. **Options/cost:** retain 50 ms and fund further storage/backend work (delay); approve a measured higher budget with durability retained (spec decision); weaken durability (changes guarantees, not recommended). **Recommendation:** retain durability, keep acceptance gated, choose the measured budget or fund further work. **Scope:** store latency budget only; no Work cutover or durability change is authorized here.

Status: DONE_WITH_CONCERNS
Summary: Fixed benchmark cursor races and reduced measured steady outside reads roughly fourfold while retaining durability. Host 1/10/15/20-session acceptance remains pending.
Concerns/Blockers: Host latency/namespace gates and the out-of-scope program-board update remain with the coordinator; no 50 ms acceptance claim.
Context refs:
- (none)
