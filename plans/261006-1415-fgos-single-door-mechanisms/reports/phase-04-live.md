# Phase 04 — Actual development-door and installed-doctor proof

## Summary

Final revised development door passed actual Cargo/native/Node list consumers for default/shared, relative custom, absolute custom targets and exact nested caller cwd. Live observers captured each invocation-specific confined binary/manifest **while running**, compared selected native bytes and artifactDigest, and observed complete own-run cleanup after exit. Two actual consumers coexisted in distinct run directories; their Cargo builds were serialized by waiting for the first real consumer's readiness. A real owned native child received SIGTERM, propagated it through the Node consumer/native host to the wrapper, and its run directory was absent at wrapper close.

Final source-drift check correctly reports the real main activated release stale; main activation was read-only. A current-checkout release upgraded in a new isolated standalone installation, then truthfully reported one generated-index difference caused by the supported upgrade tail. A real second build/stage/upgrade of that post-tail working tree reached **check PASS**, with **629 source files equal**, **47.285 ms** check time. Whole doctor remains **99 checks / 83 pass / 16 fail**, default exit **0**, strict exit **1**: check PASS is not complete readiness.

Full exact argv, cwd, environment overrides, stdout/stderr, command times, manifests, hashes, index delta and removed helper source are durable in [phase-04-live-evidence.json](phase-04-live-evidence.json). Cleanup evidence: [phase-04-live-cleanup.json](phase-04-live-cleanup.json). No Node test suites, formatter, linter, source edit or main activation operation ran in this worker.

## Scope and isolation

- `$R=/home/vantt/projects/worktrees/forgentX-single-door-execution`; `$T=/tmp/fgos-phase04-live-CNlZHi`; `$P2=/tmp/fgos-phase02-native-handoff-wldroe6x`.
- Standalone repository `$T/workspace`, Git common dir `.git` and top level validated before any init/upgrade. Never init/upgrade execution linked checkout, whose common Git dir resolves main.
- `HOME=$T/home`, `FGOS_STATE_HOME=$T/state-home`, `NODE_PATH=''`; inherited active-release/manifest, INIT_CWD and CARGO_TARGET_DIR removed unless explicitly required. Every probe unsets `CLAUDE_CODE_SESSION_ID` and uses stdin **ignore**.
- Cargo uses explicit `CARGO_HOME=/home/vantt/.cargo`, `RUSTUP_HOME=/home/vantt/.rustup` after preserved initial isolated-HOME toolchain refusal. No toolchain defaults installed or global configuration changed.
- Fixture copied the current shared builder's **629 selected source files**, real production dependencies without symlinks, and actual source marker `apps/fgos/Cargo.toml`. Stores exist at parent workspace and **exact nested caller** `$T/workspace/nested/deeper/.fgos`; existing CLI does not walk up to a workspace store. Item: `phase04-live-consumer` / “Phase04 actual nested workspace consumer”.
- Prior Phase02 proof/logs/store/workspace untouched. Existing execution target symlink points at `/home/vantt/projects/forgentX/target`; link preserved. Authorized builds update shared debug build output only, not main activation/user work.

## Actual final development-door evidence

All three actual npm commands invoked `npm --prefix $R run fgos:dev -- list --id phase04-live-consumer --json` from the nested caller. Npm executes its package script at source root, so the successful exact-cwd store result proves INIT_CWD handoff. Subsequent direct wrapper concurrency/signal invocations from nested cwd had no INIT_CWD and exercised cwd fallback.

| Final layout | CARGO_TARGET_DIR | Inner elapsed | Consumer exit | Selected digest |
|---|---|---:|---:|---|
| Default, existing shared target symlink | unset | 1.065 s | 0 | `sha256:f0cd8cb4f020cc0aad5f84da06d32f07379898df3f270f30510ff123f6a2069b` |
| Relative custom | `../../../../../tmp/fgos-phase04-live-CNlZHi/relative-target` | 0.430 s | 0 | `sha256:de68829b7f4b695f0ee39e617ffcfe91e0627883b3ae5f151f9d9d2a93d3c622` |
| Absolute custom | `$T/absolute-target` | 0.473 s | 0 | `sha256:de68829b7f4b695f0ee39e617ffcfe91e0627883b3ae5f151f9d9d2a93d3c622` |

Custom targets use real Cargo `CARGO_PROFILE_DEV_DEBUG=0` to distinguish their genuine binaries from the stale-to-selection default debug binary. Both custom selected digests differ from default; default digest stayed unchanged. Cargo actually compiled each layout in the first pass (6.120 / 10.069 / 10.522 s whole commands); final revised wrappers still invoked real Cargo and reused valid warm outputs, not a substituted builder.

For every revised invocation the observer captured exactly one live `run-*` manifest and confirmed: native manifest digest = confined binary digest = selected Cargo artifact digest; computed artifactDigest matches; all manifested paths are regular files; own binary/run directory gone after consumer exits. Manifest entries remain beneath `.fgos/runtime/dev-host/run-*/`, legacy Node root remains `.`, real source Node entry remains `bin/fgos.mjs`. Native verifier accepted the confined pair despite the build-source target symlink.

Concurrency instrumentation was only a Node preload outside source: it read the genuine production store, recorded actual consumer/native PIDs and argv, and paused before the unmodified real list CLI. First consumer readiness established Cargo 1 completion before starting Cargo 2. Two native hosts/Node consumers then overlapped; distinct directories, first manifest unchanged after second starts, selected-byte equality for both; releasing barriers produced actual matching list envelopes, both exit 0, both own directories removed. No echo/mock command result.

SIGTERM was sent to identity-checked owned **native child PID 2849937**, not npm/wrapper or unrelated process. Native forwarded to paused actual Node child, wrapper closed with exit null / signal **SIGTERM**, own run directory absent at close. This proves cleanup before forwarded wrapper termination, not argument-only signal plumbing.

Direct actual native host pointed at a candidate whose listed legacy entry was changed into a symlink to identical original bytes refused with exit **1**: `manifest file verification failed: symlink refused in release files on disk: libexec/legacy-node/bin/fgos.mjs`. Native release digest unchanged across candidates: `sha256:4bb662ee1ccea8fb09db7dca1b135869f71a5ce50c81baf87384842d4167fdb0`. Earlier `fgctl stage` of this already-staged same digest exited 0 (“already staged”), so it is **not** mislabeled as symlink refusal evidence; the direct native invocation is the exercised Rust verifier proof.

## Real stale main activation: read-only final check

Ownership validated against actual main top level/common dir `/home/vantt/projects/forgentX/.git`, local regular activation and resolved main root. ActivatedAt is evidence, not freshness inference.

- Activated artifact: `sha256:a1ba0d0682a7c00598a9873cd13dbe9bb9500b0a7f6b8260a776a5de0e407c4c`; recorded activation time `2026-10-04T08:31:40.901Z`.
- Actual final check **FAIL**: changed **70**, missing in release **17**, extra **0**. **629** selected working-tree source files; active manifest **614** files, **612** under legacy payload namespace (not equivalent to selected-source count).
- Check time **56.780 ms**; manifest artifactDigest recomputation valid; activation bytes unchanged.
- Deterministic examples: architecture-panel/group-thinking/panel/run skill entries and README. Exact message includes development B and restage/upgrade A guidance, and explicitly disclaims Rust freshness.
- Execution linked-worktree check **PASS / skipped** in **2.760 ms** because activation belongs to main, not execution worktree. It does not falsely borrow main binding.

## Final installed A path, generated-index side effect and genuine restage

1. New isolated store initialized from prior Phase02 candidate, then pre-review candidate `sha256:a9f724fe5a8cf089f2ae64c5ae84153e8df7260aa9631210008867107b7375c4` was upgraded before reviewer corrections arrived. Historical observations retained, not claimed as final verification.
2. After both source-owner handoffs, refreshed standalone selected payload and packed current execution checkout: **864 files**, artifact `sha256:5c0d2020f8bbbe4adc54c8c525c3465d901e6423106cad034f15d08c95a5fb90`. Stage, upgrade, status, native verify exited 0. Final wrapper source digest `sha256:cb79ca5dd660bf4769064dba917c26d4455ad53fb8c84aae3d2ed2358e409a93`; registrations digest `sha256:49194cf5d90137c37475f35b9fba230a259dba37f10c4aa7559321052c1bb4c8`.
3. Supported upgrade tail regenerated standalone `docs/enduser-docs-index.json`. Immediate actual installed-shim doctor correctly reported **changed=1**, no missing/extra, naming this index; **99 / 82 pass / 17 fail**, default 0, strict 1. Timed selected-release check **55.550 ms**, FAIL. This is a preserved real observation: **first packed checkout candidate does not automatically imply post-upgrade source-tree equality**.
4. Exact deterministic delta: **490 → 153 rows**, **338 removed**, **1 added**, **3 changed** (aliases/sourceCaptureId). Source index digest `sha256:35f8b1da185d047435e5b25ad3e00bb47cde472fb948d522b27438a424b9d3ee`; post-tail `sha256:0b673af8d9e49fa63ea433215a1f78fc4aeb0987b8b45fd8f95e0275beaccbe7`. Generator scans actual fixture docs plus isolated work state, not timestamps; fixture contains package-selected subset of full-checkout docs. This context explains the delta, not a Node freshness false positive. Full removed/changed rows retained.
5. **No forced byte restore, ignored index or comparator suppression.** Copied already compiled native release host into owned standalone `target/release`, packed the **actual post-tail working tree** with `--repo-root $T/workspace`, staged/upgraded it through existing A door. New artifact `sha256:5d1d91637052c578ba87bf4c631414132a264f1594b201a889f8ae67957ca2f1`, **864 files**. Exact manifest comparison shows only `libexec/legacy-node/docs/enduser-docs-index.json` differs from first final checkout candidate. Its upgrade tail left generated index byte-identical.
6. Actual installation shim `doctor --json` now includes **active-release-matches-checkout PASS**, changed/missing/extra **0**. `doctor --json --strict` contains the same PASS. Selected-release registry itself measures **47.285 ms**, **629** source files, every selected fixture file equals actual installed payload; artifactDigest valid; activation ready; final native verify exit 0.

Second candidate is current final code with the genuine fixture-context post-tail index, not a claim that execution checkout's original index remained unchanged during first upgrade. Main/execution source index never written by this worker. Parent docs edits after these probes would change packaged source bytes and require a later integrated candidate proof if exact final-tree artifact freshness is claimed.

## Whole-doctor readiness failures remain separate

Final matching check PASS coexists with **16 readiness failures**. Default whole command exit 0 (**1.951 s**); strict exit 1 (**1.818 s**). Both stderr preserve `fatal: not a git repository (or any of the parent directories): .git`. No extra setup/fix, trust changes or readiness suppression used.

- **`config-not-stale`**: stale config — missing keys: runner, cleanup, workerSlots, invariantChecks, checkpoint, worktreeSetup, gateway, herdrOrchestrator, herdrWebDashboard, docRegistry — run fgos setup
- **`main-checkout-hook-wired`**: core.hooksPath not wired to .githooks — commits here are NOT guarded against concurrent-writer clobbering (str65) — run fgos setup
- **`dispatch-decide-hook-wired`**: .claude/settings.json has no PreToolUse dispatch-decide hook wired — Agent/Task calls can bypass the decide-first enforcement — run fgos setup
- **`advise-execute-capabilities-configured`**: runner.capabilities section missing -- run fgos setup (decide --for advise/execute/code:implement cannot resolve until it exists)
- **`workflow-capabilities-configured`**: runner.capabilities has no entry for Workflow capabilities: architecture:frame (architecture-advisory); architecture:shape (architecture-advisory); architecture:critique (architecture-advisory); architecture:synthesize (architecture-advisory); architecture:explain (architecture-advisory); business:frame (business-discussion); business:perspectives (business-discussion); business:critique (business-discussion); business:synthesize (business-discussion); business:plan (business-discussion); delphi:propose (delphi); delphi:synthesize (delphi); group-cognition:explore (group-cognition); group-cognition:critique (group-cognition); group-cognition:synthesize (group-cognition); nominal-group:generate (nominal-group); nominal-group:share (nominal-group); nominal-group:vote (nominal-group); nominal-group:rank (nominal-group); coding:discover (coding/feature); coding:explore (coding/feature); coding:plan (coding/feature); coding:validate (coding/feature); coding:implement (coding/feature); marketing:research (marketing/content-publish); marketing:write (marketing/content-publish); marketing:publish (marketing/content-publish) -- declare each under runner.capabilities (fgos setup adds every shipped Workflow's)
- **`capability-serves-valid`**: runner.capabilities section missing -- run fgos setup ("serves" cannot be validated until it exists)
- **`operation-capability-resolves`**: runner config section missing -- run fgos setup
- **`worker-slots-ceiling-usable`**: workerSlots section missing -- run fgos setup (no worker-slot ceiling is enforced until it exists)
- **`invariant-checks-configured`**: invariantChecks section missing -- run fgos setup (no invariant check runs at return/merge until it exists)
- **`readme-install-tag-exists`**: README.md recommends installing tag "v0.1.0", which does not exist -- cut it per docs/how-to/cut-a-fgos-release-tag.md, or update README.md to a tag that does exist
- **`herdr-launcher-configured`**: herdrOrchestrator section missing -- run fgos setup
- **`herdr-web-dashboard-configured`**: herdrWebDashboard section missing -- run fgos setup
- **`instruction-projections-stale`**: file:///tmp/fgos-phase04-live-CNlZHi/state-home/releases/sha256:5d1d91637052c578ba87bf4c631414132a264f1594b201a889f8ae67957ca2f1/libexec/legacy-node/src/setup/instruction-registry.mjs:684
- **`doc-registry-enforce`**: docRegistry section missing -- run fgos setup
- **`trust-store-readable`**: trust store at /tmp/fgos-phase04-live-CNlZHi/home/.claude.json has no usable "projects" object -- its shape has changed
- **`command-routes-drift`**: command routes drift detected: Unexpected token '/', "/tmp/fgos-"... is not valid JSON

Full stack/diagnostics in evidence JSON: instruction projection reports unknown domain owner coding (known core/platform); command routes reports invalid JSON beginning owned temp path. These and missing fresh-fixture config/hooks/trust/tag are not relabeled as all-green release readiness.

## Component boundary and architecture identities

Read current `docs/platform/component-boundary.md` and detailed `docs/architect/component-boundary/component-boundary-advisory.md`: Packaging-Distribution / Setup, Doctor, Distribution Health owns runtime packaging/install/activation, config defaults and doctor checks. These changes retain that authority; dev wrapper is a local source-run surface, comparator read-only diagnosis, fgctl remains installed activation authority. **No component-boundary change.** Existing machine component ID `packaging-distribution`, contract `architecture-manifest.v1`, layer `src/setup/registrations.mjs: use-case` retained. Worker changed no architecture map/manifest/contract IDs. Source hashes captured in evidence `24-component-boundary.json`.

## Commands and observed outcomes

All exact full stdout/stderr and per-command environment overrides are retained in evidence. `$T/*.mjs` below are captured throwaway controllers, subsequently removed; their internal real subprocess commands/results are also captured. Earlier pre-review evidence is explicitly historical. No successful command was rerun merely to confirm; revised passes followed reviewer source changes or genuine restage inputs, strict invocation exercises separate exit behavior.

| Record | Actual argv | Cwd | Exit / signal | Seconds |
|---|---|---|---:|---:|
| `00-prepare` | `node $T/prepare.mjs` | `$R` | 0 | 0.077 |
| `02-standalone-git-init` | `git init $T/workspace` | `$R` | 0 | 0.003 |
| `03-standalone-git-ownership` | `git rev-parse --git-common-dir --show-toplevel` | `$T/workspace` | 0 | 0.001 |
| `04-nested-store` | `node $T/nested-store.mjs` | `$R` | 0 | 0.045 |
| `05-npm-dev-default-shared` | `npm --prefix $R run fgos:dev -- list --id phase04-live-consumer --json` | `$T/workspace/nested/deeper` | 1 | 0.166 |
| `07-npm-dev-default-toolchain-scoped` | `npm --prefix $R run fgos:dev -- list --id phase04-live-consumer --json` | `$T/workspace/nested/deeper` | 0 | 6.120 |
| `09-npm-dev-relative-target` | `npm --prefix $R run fgos:dev -- list --id phase04-live-consumer --json` | `$T/workspace/nested/deeper` | 0 | 10.069 |
| `11-npm-dev-absolute-target` | `npm --prefix $R run fgos:dev -- list --id phase04-live-consumer --json` | `$T/workspace/nested/deeper` | 0 | 10.522 |
| `13-real-main-stale-readonly` | `node $T/source-check.mjs` | `$R` | 0 | 0.188 |
| `14-pack-current-candidate` | `node $R/scripts/build-rust-distribution.mjs --out $T/candidate-phase04` | `$R` | 0 | 0.123 |
| `16-init-prior-release-new-store` | `$R/target/release/fgctl init --from $P2/candidate-corrected` | `$T/workspace` | 0 | 32.107 |
| `18-stage-phase04` | `$R/target/release/fgctl stage --from $T/candidate-phase04` | `$T/workspace` | 0 | 0.045 |
| `19-upgrade-phase04` | `$R/target/release/fgctl upgrade --from $T/candidate-phase04` | `$T/workspace` | 0 | 5.287 |
| `20-fgctl-status` | `$R/target/release/fgctl status --json` | `$T/workspace` | 0 | 0.004 |
| `21-fgctl-verify` | `$R/target/release/fgctl verify` | `$T/workspace` | 0 | 0.027 |
| `22-native-verifier-symlink-refusal` | `$R/target/release/fgctl stage --from $T/symlink-refusal-candidate` | `$T/workspace` | 0 | 0.027 |
| `25-native-runtime-symlink-refusal` | `$T/candidate-phase04/bin/fgos list --id phase04-live-consumer --json` | `$T/workspace/nested/deeper` | 1 | 0.012 |
| `28-revised-dev-default-live-observer` | `node $T/observe-dev.mjs default-shared` | `$R` | 0 | 1.105 |
| `29-revised-dev-relative-live-observer` | `node $T/observe-dev.mjs relative` | `$R` | 0 | 0.460 |
| `30-revised-dev-absolute-live-observer` | `node $T/observe-dev.mjs absolute` | `$R` | 0 | 0.503 |
| `31-final-main-stale-readonly` | `node $T/source-check.mjs` | `$R` | 0 | 0.161 |
| `32-final-standalone-source-sync` | `node $T/sync-workspace.mjs` | `$R` | 0 | 0.071 |
| `33-pack-final-candidate` | `node $R/scripts/build-rust-distribution.mjs --out $T/candidate-final` | `$R` | 0 | 0.090 |
| `35-stage-final-candidate` | `$R/target/release/fgctl stage --from $T/candidate-final` | `$T/workspace` | 0 | 0.036 |
| `36-upgrade-final-candidate` | `$R/target/release/fgctl upgrade --from $T/candidate-final` | `$T/workspace` | 0 | 5.069 |
| `37-final-fgctl-status` | `$R/target/release/fgctl status --json` | `$T/workspace` | 0 | 0.004 |
| `38-final-fgctl-verify` | `$R/target/release/fgctl verify` | `$T/workspace` | 0 | 0.024 |
| `39-final-install-shim-doctor-json` | `$T/workspace/.fgos/installation/bin/fgos doctor --json` | `$T/workspace` | 0 | 1.849 |
| `40-final-install-shim-doctor-strict` | `$T/workspace/.fgos/installation/bin/fgos doctor --json --strict` | `$T/workspace` | 1 | 1.904 |
| `41-final-selected-release-timed-check` | `node $T/selected-check.mjs` | `$T/workspace` | 0 | 0.160 |
| `45-pack-post-tail-workingtree` | `node $R/scripts/build-rust-distribution.mjs --repo-root $T/workspace --out $T/candidate-post-tail-aligned` | `$R` | 0 | 0.089 |
| `46-stage-post-tail-aligned` | `$R/target/release/fgctl stage --from $T/candidate-post-tail-aligned` | `$T/workspace` | 0 | 0.037 |
| `47-upgrade-post-tail-aligned` | `$R/target/release/fgctl upgrade --from $T/candidate-post-tail-aligned` | `$T/workspace` | 0 | 4.907 |
| `48-aligned-install-shim-doctor-json` | `$T/workspace/.fgos/installation/bin/fgos doctor --json` | `$T/workspace` | 0 | 1.951 |
| `49-aligned-install-shim-doctor-strict` | `$T/workspace/.fgos/installation/bin/fgos doctor --json --strict` | `$T/workspace` | 1 | 1.818 |
| `50-aligned-selected-release-timed-check` | `node $T/selected-check.mjs` | `$T/workspace` | 0 | 0.156 |
| `53-real-concurrency-signal-controller` | `node $T/concurrency-signal.mjs` | `$R` | 0 | 0.816 |
| `54-aligned-final-fgctl-verify` | `$R/target/release/fgctl verify` | `$T/workspace` | 0 | 0.021 |

## Owned inventory and cleanup

- All **8** owned throwaway helper scripts and **5** readiness/release marker files removed **after durable evidence capture**; complete source/digests preserved in evidence. Cleanup records actual removed paths.
- Previous fixed-path scratch binary/manifest produced by pre-review wrapper were digest-ownership checked and removed after their evidence capture. Final revised invocations clean themselves; `.fgos/runtime/dev-host` has **no remaining entries**.
- Retain **`$T`** until parent cleanup: `logs`, `home`, `state-home`, `workspace`, `relative-target`, `absolute-target`, `candidate-phase04`, `candidate-final`, `candidate-post-tail-aligned`, `symlink-refusal-candidate`. These are all this worker's owned temporary resources; parent may remove entire `$T` after reports captured. No installed main/global activation or prior proof is among cleanup targets.
- Existing shared target outputs and execution-local node_modules are parent-owned persistent prerequisites; never delete them as helper cleanup. Prior `$P2` retained unchanged.

## Recommendations and limits

- Use the actual generated/post-tail working tree for restaging if supported init/upgrade changed packaged index bytes; first upgrade's drift must remain visible until the release matches real tree.
- Keep final integrated full npm suite in parent's Phase06 lane; this worker owns real runtime/build probes only. No coverage claim or new verification request beyond parent plan.
- No unresolved live-probe blocker. Complete readiness is explicitly **not** proven; 16 real doctor failures above remain baseline/parent classification.
