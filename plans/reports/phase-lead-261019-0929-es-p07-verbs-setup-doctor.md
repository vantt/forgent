# Event Store phase 07: verbs, setup, doctor

Implemented steps 1–4, dormant: sync/status/export use cases, the registered-consumer rebuild function, validated config defaults, three setup fixes and nine doctor bodies (legacy-layout stays phase 08). Both export functions are real Rust implementations with combined-addon bindings. No verb, route, config, fix or check registrations changed; phase 09 extends the existing `event-store` config row with the single exported `EVENT_STORE_DEFAULTS` shape. No git staging, commits, lifecycle operations or external pushes.

Reused the verified reader, frozen Rust legacy ordering, D18 fence, holder-lock guarantee/hot guard, consumer manifest, Work reducer, and durable-file installer. M5 reads Git's existing floor, machine-id, fetch/push mapping, remote URL and mapping provenance; refspec repair calls the crate's existing `ensure_refspecs` and Git's journaled RepositoryConfig door. Source/history searches found no earlier export/rebuild implementation to restore. The reader's mirror parser gained crate visibility (one line, no behavior change) so status cannot reinterpret a reserved legacy suffix. No out-of-scope edits.

Rollback validates every pinned tree entry before creating its exclusive output, preserves historical bytes, converts v4 records without markers/incompatible hashes, orders via Rust and writes an entity parity report via the existing reducer. Tests demonstrate a clock rollback causing a reported Work entity difference and reject `..`, symlink, gitlink and existing-output vectors. Status includes real commit counts, missing `{origin,stream,seq}`, receipts, orphan streams and integrity records. Actual fetch/push attempts are recorded separately; no-push preserves the last push. Concurrent setup publishes one complete machine identity. Fixture payloads prove two consumer caches are deleted and rebuilt from actual store events; consumers own bounded gated installation through `rebuildFromStore(ctx)`.

Validation (from this worktree; impact-analysis: inactive, no present providers):

```sh
cargo test --locked -p fgos-event-store -p fgos-node-addon
cargo clippy --locked -p fgos-event-store -p fgos-node-addon --all-targets -- -D warnings
node --test test/event-store/verbs.test.mjs test/event-store/export-legacy-parity.test.mjs test/setup/event-store-checks.test.mjs test/setup/event-store-fixes.test.mjs test/event-store/facade.test.mjs test/event-store/no-spawn-in-gate.test.mjs test/event-store/consumers.test.mjs test/architecture.test.mjs
node --test test/architecture.test.mjs test/setup/event-store-checks.test.mjs
git diff --check
```

Rust: 138 passed, 1 existing ignored qualification test. Clippy: clean. Node: 62 passed, zero skips, including both real strace zero-spawn windows, Git/Event Store mapping verdict agreement, age thresholds 599/601/3601, shared-machine warning, and config project-over-global/default merging. Warning vectors apply to checks whose contract defines warnings; binary-only checks do not invent warning states. The final native-boundary/doctor rerun passed 36 tests after extending the architecture guard to the new native exports. Logs: `/tmp/es-p07-{rust,clippy,node-all,final-check}.log`.

Built the p07 host with the existing helper, then attempted the exact full-suite gate:

```sh
node --input-type=module -e "import {ensureHostBin} from './scripts/run-tests.mjs'; console.log(ensureHostBin({...process.env,FGOS_HOST_BIN:''}));"
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=/home/vantt/projects/forgent/.claude/worktrees/es-p07/target/debug/fgos npm test
```

The full suite could not start: `EROFS` opening `/home/vantt/.local/state/fgos/locks/full-suite.lock`. No bypass or alternate lock root was introduced. Logs: `/tmp/es-p07-{host,npm}.log`. MDView CLI preview was attempted but its database is read-only (`/tmp/es-p07-mdview.log`).

Draft Unreleased entry for phase 09: “Add Linux Event Store sync/status/export, cursor-based JSONL and legacy rollback parity reporting; rebuild registered consumer caches through the store. Configure seal/sync intervals, rebuild attempts and remote in one eventStore section. Setup installs machine identity, private locks and fetch-only mappings; doctor reports integrity, publication, orphan streams and filesystem guarantees. Tracked event files are retired at migration/cutover.”

Coordinator handoff: review/merge (step 5), rerun full npm on the writable host, then phase 08 migration/legacy-layout doctor and phase 09 registrations/consumer adapters. The program-board ES row cannot be updated inside this write contract; its path is listed in needsWrites. The requested 09:29 report path is retained; convention lookup generated the current-clock 09:39 alternative, which was not created.

Status: DONE_WITH_CONCERNS
Summary: Implemented the dormant phase 07 bodies and real Rust exports with passing focused and regression evidence.
Concerns/Blockers: Full npm requires the writable host lock directory; MDView database is read-only; coordinator must update the out-of-scope program-board row.
Context refs:
- (none)
