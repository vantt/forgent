# Event Store unit 1: dormant store-layer fixes

Branch `es/p09s-store-fixes`, base `a30008276`. Store foundation only; no staging,
commit, activation, migration or Work lifecycle operation. Impact-analysis:
inactive (zero registered providers). Report path confirmed through Convention.

| Item | Delivered / deferred |
|---|---|
| Unit 8 append/read | **Brought over:** sync identity cleanup only after actual removals; exact-byte/origin/stream/strictness verified-frame reuse, bounded to 4 MiB; current-read authority/HEAD reuse. Active-file and stream-directory barriers remain. The altered-byte/authority/strictness recovery regression is retained. |
| Unit 8 Git cost | **Brought over:** Inspect uses the existing stamp-validated config door. Added a real config-change refusal/repair test. No HEAD/ref cache spans commands. |
| Review B H1 | **Fixed:** crate-local `maintenance(layout)` and `store.maintenance(heldRanks)` return local stream ages and actual last-push receipt. The crate function has no Git handle; corrupt event refs do not affect it. Future trigger callers remain **WORK**, since this branch wires no triggers. |
| Review B H3 | **Brought over and hardened:** the lexer/model/forwarding door, Git basenames, shell/launcher sinks (including Rust), UNKNOWN Git argv, computed/rest forwarding, and wildcard source bounds. Every supplied bypass is synthetic coverage; deep forwarding also fails closed. E3 census owns fresh bare fixtures; four fixture-proven raw sites remain its sole exemption class. |
| Dormant door scope | Main still has legacy Work readers and opaque generic Git-context callers. The repository test asserts their exact findings and fingerprints the unchanged source owners; the scanner does not exempt or suppress them. This is a dormant regression census, **not a passing whole-repository cutover V-DOOR-01**. Removal/proof belongs to **WORK/Git 07**; adding exceptions to the generic detector would be false proof. |
| Review B M1 | **Fixed:** added the retired-layout hook rule to main's existing hook, using `--no-renames --diff-filter=ACRT -z`, allowing only the exact fence path. Real-index tests cover added/renamed/copied/type-changed paths and the fence. Existing Work hook guards remain. The new refusal itself is the explicitly requested hook behavior. |
| Review B M3 | **Fixed:** facade `branchKey` delegates to the crate's single rule. Promotion, own-origin and opportunistic sealing facade operations were brought over; a real native promotion regression passes. |
| Review A M1 | **Verified:** the native read already forwards cursor and retained envelopes into the certified coverage walk. Added a seal/append test showing empty delta after sealing, stable cover/streams/deferred despite new certification, and the correct next delta. Consumer cache comparisons/read-call changes remain **WORK**: no such consumer cache exists in this write scope. Spec requires comparing only cover/streams/deferred while refreshing metadata and respecting rebuild decisions. |
| Realistic benchmark | **Fixed:** store-increment workers use the facade directly, the existing kernel state gate and a benchmark-owned view, with no Work consumer import. Default seed is 1,000 roughly 8 MB payloads, sealed before timing; `--seed-history <jsonl>` preserves explicit input records as benchmark payloads. Results include count/bytes/source. Cache persistence is reported separately from the store increment. |

Prior art reused: the phase-01 benchmark, unit-6/7 source lexer and forwarding
model, existing append framing/cleanup, branch-key rule, local age/sync-receipt
readers, state gate and Git config cache. History searches found their introducing
changes (`25074b911`, `7974d29be`, `457f01012`, `408e0d694`) and no removed
replacement mechanism that needed restoration. Both reviews and units 6–8 were
read from `03c5186c7`; no Work/porting consumer hunks or registry entries landed.
`git diff --name-only a30008276 -- src/state src/runner src/setup bin domains
packages/event-store/contracts/consumers.v1.json` is empty.

Validation (exact commands):

```sh
cargo test --locked -p fgos-event-store -p fgos-git
cargo clippy --locked -p fgos-event-store -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
node --test test/event-store/*.test.mjs test/githooks/event-layout.test.mjs
node --test test/event-store/store-hardening.test.mjs
node --test test/githooks/event-layout.test.mjs test/architecture.test.mjs
node --test test/git/e3-census.test.mjs
git diff --check
```

Rust: 367 passed, 0 failed, 10 existing ignored qualifications; clippy clean.
Event Store plus hook suite: 67 passed, 0 failed, 5 existing migration/PID-namespace
skips (before the final config-stamp regression, which passed separately).
Final hardening run: 8 passed, 0 failed/skipped, including config stamps, native
promotion and the real strace worker. Final `git diff --check` is clean.
Architecture plus hook: 34 passed; E3 census: 2 passed. No full `npm test` ran.
Logs: `/tmp/es-{rust,clippy,verified-node,final-hardening,architecture,e3-test}.log`.

The direct-worker strace observed append fsync counts **3, 2, 2** and zero gate
spawns: the first append after a seal performs real cleanup, then steady appends
use two barriers. The checked-in worker test asserts steady counts and zero
spawns. Trace: `/tmp/fgos-work/es-store-steady.trace`. This is sandbox/debug
behavior, not ext4 performance acceptance.

Host evidence read from `es09-host/latency/{cutover.json,trace-summary.jsonl}`:
old ext4 p95 upper bounds 69.0/68.0/71.5/71.6 ms at 1/10/15/20 sessions, zero
in-gate spawns, and 18 steady Git execs per mutation; the old 20-session verdict
is FAIL. No new host budget pass is claimed. Coordinator's exact next command,
on a fresh ext4 destination:

```sh
node scripts/event-store/v-spawn-bench.mjs --root .fgos/runtime/tmp/es-store-u1-host --sessions 1,10,15,20 --store-increment --seed-items 1000 --strace --out .fgos/runtime/tmp/es-store-u1-host/cutover.json
```

Alternatively replace `--seed-items 1000` with `--seed-history /absolute/history.jsonl`.
This measures the store foundation; real Work end-to-end latency remains WORK.
Program-board edits are outside this grant and remain coordinator-owned. MDView
preview was attempted but its database is read-only in this sandbox.

Status: DONE_WITH_CONCERNS
Summary: Completed dormant store/facade hardening and a realistic store-only benchmark without wiring Work. Native and targeted proofs pass; whole-repository cutover and host latency acceptance remain separate gates.
Concerns/Blockers: Host ext4 acceptance and five host-only migration proofs remain pending; the dormant door census is not the final zero-legacy cutover gate.
Context refs:
- (none)
