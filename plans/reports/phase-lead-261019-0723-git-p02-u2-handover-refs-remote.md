# Git phase 02, unit 2

Base `8f61caf4a`, branch `git/p02-scope-refs`. No staging or commit. `impact-analysis: inactive` (zero providers). The requested report path overrides the convention generator's current-minute path.

Implemented opaque one-shot Node → addon handover using the existing private WeakMap/borrow counter, a first-caller capability and typed, consumed Externals. Acquisition alone can construct a handle; no fd accessor or alternate description map exists. Cleanup closes every native copy before releasing the borrow guard, including invalid inputs. Changes in `src/holder-lock/index.mjs` are confined to constructor authority, its minting caller, and the appended registration seam; phase 04's `clearDomain` area is untouched.

Refs now holds Rust worktree-admin 40 across fresh registered-checkout validation, exact-old no-dereference CAS and read-back. `RefUpdate`/`RefDelete` WAL records bind expected/next, writer, resources and checkout where applicable; candidate pins precede prepared and the sole TargetAttempt. Unknown attempts never replay, including ABA. Fast-forward checks the exact worktree lease, clean content and ancestry, then refreshes index stat data and updates the checkout under custody. The deterministic stale-stat test exposed the need for that refresh; no reset/force fallback was added.

Non-event Remote uses explicit mappings, pinned URL/protocol, no force or push-config changes, and `RemoteTransfer` payloads with per-target old/new values before TargetAttempt. Fetch downloads objects then installs only remote-tracking refs with exact-old no-dereference CAS. Push acknowledgements and unknown outcomes remain distinct; attempted ids never resend. Node `refs.mjs`/`remote.mjs` are transport only. Existing Publication/config modules and the Event Store addon file were not edited. Prior art reused: holder-lock validation/borrow/drain and registry, hardened driver, WAL begin/immutable transitions/pins, existing containment and durable-file directory sync; history searches found no removed non-event Refs/handover implementation to revive.

Inspect resolves a linked cwd (also a subdirectory) through a locator plus reciprocal admin/backlink/main-directory validation. Supplying trusted main still ignores poisoned worker gitfiles. **Separate-git-dir is out of scope** and remains refused. Windows native handover remains a named unsupported result; macOS/Windows execution was not measured here. No new config/env defaults, external dependencies, production bypasses or production callers were introduced. Specs, architecture map/guard and changelog reflect the dormant ports.

## Validation

```sh
cargo build --release -p fgos -p fgctl -p fgos-node-addon
cargo test -p fgos-holder-lock -p fgos-git -p fgos-node-addon
cargo clippy -p fgos-holder-lock -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
cargo test -p fgos-git --test refs_remote
p02_host="$(cargo metadata --no-deps --format-version=1 | python3 -c 'import json,sys; print(json.load(sys.stdin)["target_directory"] + "/release/fgos")')"
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN="$p02_host" node --test test/git/*.test.mjs test/architecture.test.mjs
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN="$p02_host" node --test test/git/inspect.test.mjs test/git/refs.test.mjs test/git/remote.test.mjs test/git/lock-handover.test.mjs test/holder-lock/*.test.mjs test/architecture.test.mjs
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN="$p02_host" npm test
git diff --check
```

Release build, Rust suite and clippy passed. The standalone addon Rust harness prints expected unavailable Node-API symbols outside Node and exits successfully; actual addon tests run inside Node. Git + architecture: **43 passed, 1 Windows skip**. Additional Refs/Remote Rust vectors: **6 passed**, including an add queued on real 40 failing after delete, registered-late/raw-switch and unborn membership, exact lease/dirty refusal, stale-stat clean fast-forward, ABA and lost push acknowledgement. Local bare-remote tests also prove non-fast-forward rejection, symbolic fetch-destination refusal and unchanged config. The staged-release/npm fixture now stages the actual source payload so the bridge's transitive modules are present.

The wider Node command: **129 passed, 9 failed, 20 skipped**. Eight failures require host PID visibility (two activation/fence cases and six stop-check cases); the ninth is the existing historical v1 fixture's missing `yaml` dependency. Windows/network-filesystem and unavailable nested-bwrap vectors remain skipped. `npm test` cannot enter the suite: EROFS opening `/home/vantt/.local/state/fgos/locks/full-suite.lock`. No gate was bypassed. MDView cannot open its read-only database. Full host-side npm, host fencing, Windows/macOS and stable-media validation remain unproven.

## Phase-07 census handoff

Reran the unit-1 report's spawn/data-flow and shipped-skill searches over `src`, `bin`, `scripts`, `packages`, `apps`, `.githooks`, canonical and generated skills. The detailed 66-file family/owner table and delegated-edge inventory remain at [unit 1, Phase-07 census intake](phase-lead-261019-0707-git-p02-scope-inspect-refs-remote.md#phase-07-census-intake); carry that table with these corrections/supplements rather than reusing historical counts as proof. New Refs/Remote/addon modules invoke only Git's existing private driver; new raw spawns are real-repository test fixtures under `test/git` and `packages/git/rust/tests` (phase 07 sandbox class).

| Additional candidate / correction | Classification / owner |
|---|---|
| `packages/distribution/rust/src/init.rs:1082,2080` | Production delegates to the already-listed holder borrow-vector sandbox; inline test creates a shell Git wrapper/lookup. Phase 07 sandbox/probe. |
| `src/runner/dispatch/provider-credential-probe.mjs:109` | Generic `plan.command`/injected spawn, not a literal Git call. Phase 07 follows resolved CLI/account callers; do not exempt by lexical count. |
| `src/runner/dispatch/provider-adapter.mjs` | Pure argv construction; follow its consumers in transport/assignment runner (phase 07 generic executors). |
| `scripts/{run-tests,test-select-coverage-map}.mjs`, `src/holder-lock/{index,hold-transport}.mjs`, Rust `port.rs` | Generic executable/argv doors already named in unit 1's secondary inventory; phase 07 follows their callers. |
| `packages/distribution/rust/src/git_gate.rs:45`, `init.rs:368,571`; `scripts/run-rust-dev-host.mjs:51,116` | Self/Node/shim/Cargo/host executables, not direct product Git spawns; host command routing remains phase 07's transitive boundary. |
| `src/{runner/gateway-control,setup/holder-lock-checks,util/session-identity}.mjs` | Gateway Cargo/binary, host probes/sleep and identity host, respectively. Borrow-vector host probe delegates to the already-classified sandbox. |
| `src/util/normalize-path.mjs` | Text-only Git mention, no spawn. |
| `core/skills/fgos-run/SKILL.md` | Correction to unit 1: current file has isolation/runner guidance, no positive raw worktree-add command. |
| Coding implement/knowledge skills and `_shared/coding-cell-policy.md` | Positive add/commit/merge/worktree-remove guidance remains, with generated mirrors; phase 07 migrates canonical instructions then regenerates mirrors. Preserve prohibitions and historical descriptions. |

This is phase 07's source intake, not a claim that its future static/runtime one-door guard or production migration has passed. No out-of-scope one-line edits were needed or made. The program board lane update is required but excluded from this Unit's write scope: coordinator must update `plans/261017-1313-fgos-platform-program-board/plan.md`.

Status: DONE_WITH_CONCERNS
Summary: Phase-02 handover, Refs and non-event Remote are implemented with real-repository proofs and dormant Node facades; linked-cwd Inspect discovery is fixed.
Concerns/Blockers: Host-only validation remains; coordinator owns the out-of-scope board update and later review/merge.
Context refs:
- plans/reports/phase-lead-261019-0707-git-p02-scope-inspect-refs-remote.md
- plans/261018-0914-git-component-fgos-git/phase-02-lockscope-inspect-refs-remote.md
- docs/platform/git/spec.md §2/3/5/7/10/12
- docs/platform/holder-lock/spec.md §5/9/19
