# Phase 02 native release handoff verification

## Scope and isolation

Verification of current Phase01/02 source and generated skill projections through the supported Rust release build/stage/init and installed-shim doors. Reused the approved Phase02 requirements, `local://render-header-evidence.md`, `local://dev-host-layout-decision.md`, measure-a-real-case section 5, and existing Rust-host init/dependency fixtures. No historical baseline/research was overwritten.

All command environments unset `CLAUDE_CODE_SESSION_ID`. Activation operations are restricted to owned standalone Git repository `/tmp/fgos-phase02-native-handoff-wldroe6x/workspace` with isolated `FGOS_STATE_HOME=/tmp/fgos-phase02-native-handoff-wldroe6x/state-home`, `HOME=/tmp/fgos-phase02-native-handoff-wldroe6x/home`, and empty `NODE_PATH`. No linked-worktree/main init or upgrade, global setup, source edits, tests, lint, formatters, or commits. The authorized Cargo release build writes the shared target; binaries were built once before Node-only header correction, so no Rust rebuild is required.

## Initial refusal and root cause

The first distribution build refused dependency containment before writing a manifest: `Production dependency "yaml" resolves outside the checkout: /home/vantt/projects/forgentX/node_modules/yaml` (exit 1). `scripts/build-rust-distribution.mjs:137-170` resolves each dependency to realpath and lines 155-156 correctly refuse roots outside the source checkout. The execution checkout's coordinator-created `node_modules` was a symlink to main's node_modules; the package declares yaml as its production dependency. This is an isolated-checkout dependency setup prerequisite, not a builder regression or Phase02 source failure.

Parent explicitly authorized unlinking only that expected symlink and `npm ci` in the execution checkout. Link target was validated exactly before unlink. `npm ci` exited 0, installing one package; execution yaml now resolves under the execution checkout. Main's node_modules was not removed or modified. The strict builder/verifier was not weakened. The first candidate remained partial (no manifest) and was never staged or activated. Its full failure logs and partial header observations were preserved. Final packing waits for the parent's corrected-generator/regeneration baton.

## Final observed outcome

The parent authorized fresh packing after the atomic-header fix and coherent `npm run build:skills` regeneration. Reused the already built Rust binaries. A new virgin candidate packed successfully with **864 manifest files**; supported `fgctl stage`, `init`, `status --json`, and `verify` all exited 0 in the owned standalone repository. No upgrade was needed: init activated this first release. The init transaction is `complete` and activation is `ready`.

- Artifact digest: `sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb`.
- Selected release: `/tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb`.
- Activation ID: `act_000001a111cc8d09`.
- Workspace/work-state ID: `095f98721b061ccc`.
- Selected native binary digest: `sha256:4bb662ee1ccea8fb09db7dca1b135869f71a5ce50c81baf87384842d4167fdb0`.
- Resolved Node: `/home/vantt/.local/bin/node`.
- Standalone Rust source marker: `/tmp/fgos-phase02-native-handoff-wldroe6x/workspace/apps/fgos/Cargo.toml`, byte-identical to the source `apps/fgos/Cargo.toml`, SHA256 `618d32211d55d4ef19d198015620ad7adbe2ef420e2d22de6f24d98b714d0ca6`.

Actual `/tmp/fgos-phase02-native-handoff-wldroe6x/workspace/.fgos/installation/bin/fgos doctor` exited **0**, reporting **98 checks: 81 pass, 17 fail**. Exit 0 is not all-readiness-green. The Rust host executable, supported target, and legacy payload checks pass and explicitly name this isolated selected release. Doctor stderr contains `fatal: not a git repository (or any of the parent directories): .git`; full output is below. No extra fix or setup was used.

Actual installed-shim `workflow status phase02-native-proof-read-only --dir /tmp/fgos-phase02-native-handoff-wldroe6x/workspace --json` exited **4** with `fgos: Workflow run "phase02-native-proof-read-only" not found`. This is the genuine absent-run domain refusal, not a dependency-loading failure. The status branch imports `src/workflow/index.mjs` before looking up the run; current packaged yaml is contained and manifested. No workflow run or worker was created. Parent accepted this as the read-only dependency-loading proof, not product workflow completion.

`version --runtime-json` timed out after 300 seconds and was **not retried**. The command inherited Eval's nonterminal, open, unreadable stdin socket. `apps/fgos/src/main.rs:227-234` drains nonterminal stdin before invoking non-observe native providers. **[INFERENCE]** the inherited open input blocked this native command before its provider ran; no live stack was captured before Python's timeout cleanup. This is not evidence of a pin, main lock, activation, or release-verify failure. The subprocess timeout killed/reaped its own direct child. A process snapshot showed no remaining command containing the owned proof root or `version --runtime-json`; no manual signals were sent. Future Phase04 native commands should use explicit closed stdin/DEVNULL, not inherited harness stdin, as instructed by parent. No source fix is proposed or applied here.

**Boundary:** this is the required Phase02 release/header/development/doctor handoff. It cannot prove a future Phase04 doctor check exists or advisory product acceptance. The coordinator's separate render inventory reports **124 headers / 19 wrappers**; this worker does not relabel that checkout inventory as independently exercised external-release readiness. Only the concrete selected-release header observations below are this lane's evidence.

## Actual route and header evidence

The installed shell shim reads its sibling activation record and executes `<releasePath>/bin/fgos "$@"`. Current embedded routes select native `distribution.build.show` for version; doctor and workflow select `legacy-cli`/`legacy-node`. Doctor's runtime check messages identify the isolated store paths. The manifest/component entries select `libexec/legacy-node/bin/fgos.mjs`, not checkout Node files.

Two selected-release skill samples, core routing and coding planning, each carry exactly one canonical source-path assembly header on **line 12**, immediately after unchanged frontmatter bytes. Selected-release bytes equal fresh-candidate and proof-workspace bytes. This is sampled native-release handoff evidence, not a replacement for the coordinator's complete 124-header/19-wrapper inventory.

```json
{
  "routes": {
    "doctor": {
      "selector": "doctor",
      "route_kind": "legacy-cli",
      "legacy_payload": "legacy-node",
      "owner_path": "src/cli/command-registry.mjs",
      "compatibility_tests": [
        "test/rust-host/command-routes.test.mjs"
      ]
    },
    "workflow": {
      "selector": "workflow",
      "route_kind": "legacy-cli",
      "legacy_payload": "legacy-node",
      "owner_path": "src/cli/command-registry.mjs",
      "compatibility_tests": [
        "test/rust-host/command-routes.test.mjs"
      ]
    },
    "version": {
      "selector": "version",
      "route_kind": "native",
      "operation_id": "distribution.build.show",
      "owner_path": "packages/distribution/rust",
      "compatibility_tests": [
        "test/rust-host/command-routes.test.mjs"
      ]
    }
  },
  "headerEvidence": [
    {
      "selectedReleaseFile": "/tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/libexec/legacy-node/.agents/skills/fgos-routing/SKILL.md",
      "sourcePath": "core/skills/fgos-routing/SKILL.md",
      "headerRows": [
        [
          12,
          "<!-- Generated by fgOS skill assembly from core/skills/fgos-routing/SKILL.md (npm run build:skills in the fgOS source repo). Do not edit this copy; it is overwritten. -->"
        ]
      ],
      "headerCount": 1,
      "selectedSha256": "8a215975394d282772c768e69a0767aabbf1a2ca30e0fe7959252f7fcdba3a8e",
      "candidateBytesMatchSelected": true,
      "workspaceBytesMatchSelected": true,
      "frontmatterBytesPreserved": true,
      "headerImmediatelyAfterFrontmatter": true
    },
    {
      "selectedReleaseFile": "/tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/libexec/legacy-node/.agents/skills/fgos-coding-planning/SKILL.md",
      "sourcePath": "domains/coding/skills/fgos-coding-planning/SKILL.md",
      "headerRows": [
        [
          12,
          "<!-- Generated by fgOS skill assembly from domains/coding/skills/fgos-coding-planning/SKILL.md (npm run build:skills in the fgOS source repo). Do not edit this copy; it is overwritten. -->"
        ]
      ],
      "headerCount": 1,
      "selectedSha256": "9e32ee92eb6ddd89efc84bfc3c463a2458248cdbf33582d8a7817663ee1f6b57",
      "candidateBytesMatchSelected": true,
      "workspaceBytesMatchSelected": true,
      "frontmatterBytesPreserved": true,
      "headerImmediatelyAfterFrontmatter": true
    }
  ],
  "runtimeChecks": [
    {
      "id": "task-specs-resolve",
      "description": "every domain's taskSpecMap entry resolves to a real domains/<domain>/task-specs/ file (tsk-2t9c D6/D9)",
      "passed": true,
      "message": "every domain's taskSpecMap entry and operation resolves to a real domains/<domain>/task-specs/ file and core/task-specs/ contains all domain-agnostic task-specs"
    },
    {
      "id": "plugin-dev-skills-packaged",
      "description": "every coding-domain dev-skill under .claude/skills/fgos-* is also packaged in plugins/fgOS/skills/, so a plugin-only consumer can dispatch into it",
      "passed": true,
      "message": "not a forgent checkout (no .claude/skills or plugins/fgOS/skills at this project) -- nothing to check"
    },
    {
      "id": "rust-host-binary-present",
      "description": "the active release's entries.fgos binary exists and is executable",
      "passed": true,
      "message": "rust host binary present and executable: /tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/bin/fgos"
    },
    {
      "id": "rust-host-target-supported",
      "description": "current OS and architecture is an approved target for the fgos rust host (x86_64-unknown-linux-gnu)",
      "passed": true,
      "message": "current platform (x86_64-unknown-linux-gnu) is an approved rust host target"
    },
    {
      "id": "legacy-node-payload-present",
      "description": "the legacy node payload components.legacyNode.root/entry resolves to a real file",
      "passed": true,
      "message": "legacy node payload present: /tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/libexec/legacy-node/bin/fgos.mjs"
    }
  ]
}
```

## Doctor failures, preserved without repair

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
- **`enduser-docs-index-stale`**: 1/153 tài liệu end-user chưa có trong index -- chạy fgos docs-index
- **`instruction-projections-stale`**: file:///tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/libexec/legacy-node/src/setup/instruction-registry.mjs:684
        throw new InstructionRegistryError(
              ^

InstructionRegistryError: Unknown domain owner "coding" in domains directory. Known owners are: core, platform (in domains/coding)
    at discoverInstructionSources (file:///tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/libexec/legacy-node/src/setup/instruction-registry.mjs:684:15)
    at computeInstructionProjection (file:///tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/libexec/legacy-node/src/setup/instruction-projections.mjs:248:17)
    at inspectInstructionProjection (file:///tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/libexec/legacy-node/src/setup/instruction-projections.mjs:279:20)
    at file:///tmp/fgos-phase02-native-handoff-wldroe6x/workspace/[eval1]:4:20
    at ModuleJob.run (node:internal/modules/esm/module_job:439:25)
    at async node:internal/modules/esm/loader:224:26
    at async ModuleLoader.executeModuleJob (node:internal/modules/esm/loader:221:20)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5) {
  filePath: 'domains/coding',
  code: 'UNKNOWN_OWNER'
}

Node.js v24.18.0
- **`doc-registry-enforce`**: docRegistry section missing -- run fgos setup
- **`trust-store-readable`**: trust store at /tmp/fgos-phase02-native-handoff-wldroe6x/home/.claude.json has no usable "projects" object -- its shape has changed
- **`command-routes-drift`**: command routes drift detected: Unexpected token '/', "/tmp/fgos-"... is not valid JSON

Most red checks explicitly name missing fresh-workspace config/setup/trust prerequisites. The standalone snapshot has no release tag/history, so `readme-install-tag-exists` is not a tag-release verification here. `instruction-projections-stale` explicitly reports unknown domain owner coding (known core/platform); `command-routes-drift` explicitly reports invalid JSON beginning `/tmp/fgos-`. These actual failures remain for parent classification; no suppressions or fixes were applied. `fgctl init` runs its supported init/doctor-fix/doctor tail itself inside the isolated proof environment; this worker did not run global setup or a later fix retry. Main activation/config/instructions were not touched by this lane.

## Commands and exits

All commands ran with `CLAUDE_CODE_SESSION_ID` unset. Build/distribution/npm commands used the execution checkout; git identity, stage/init/status/verify, and shim consumers used the owned standalone workspace. Proof environment: isolated HOME and state store, `NODE_PATH=''`, no inherited FGOS runtime overrides. Native timeout was the only command without an exit code.

| Evidence record | Command | Exit/outcome |
|---|---|---|
| `01-cargo-release` | `cargo build --release -p fgos -p fgctl` | 0 |
| `02-build-distribution` | `node scripts/build-rust-distribution.mjs --out /tmp/fgos-phase02-native-handoff-wldroe6x/candidate` | 1 |
| `05-npm-ci` | `npm ci` | 0 |
| `07-git-init` | `git init` | 0 |
| `08-git-local-identity-name` | `git config --local user.name Phase02 Native Handoff Proof` | 0 |
| `09-git-local-identity-email` | `git config --local user.email phase02-native-proof@example.invalid` | 0 |
| `10-build-corrected-distribution` | `node scripts/build-rust-distribution.mjs --out /tmp/fgos-phase02-native-handoff-wldroe6x/candidate-corrected` | 0 |
| `12-fgctl-stage` | `/home/vantt/projects/worktrees/forgentX-single-door-execution/target/release/fgctl stage --from /tmp/fgos-phase02-native-handoff-wldroe6x/candidate-corrected` | 0 |
| `13-fgctl-init` | `/home/vantt/projects/worktrees/forgentX-single-door-execution/target/release/fgctl init --from /tmp/fgos-phase02-native-handoff-wldroe6x/candidate-corrected` | 0 |
| `14-fgctl-status` | `/home/vantt/projects/worktrees/forgentX-single-door-execution/target/release/fgctl status --json` | 0 |
| `15-fgctl-verify` | `/home/vantt/projects/worktrees/forgentX-single-door-execution/target/release/fgctl verify` | 0 |
| `16-shim-runtime-version` | `/tmp/fgos-phase02-native-handoff-wldroe6x/workspace/.fgos/installation/bin/fgos version --runtime-json` | timeout after 300s |
| `17-shim-doctor` | `/tmp/fgos-phase02-native-handoff-wldroe6x/workspace/.fgos/installation/bin/fgos doctor` | 0 |
| `18-shim-workflow-status` | `/tmp/fgos-phase02-native-handoff-wldroe6x/workspace/.fgos/installation/bin/fgos workflow status phase02-native-proof-read-only --dir /tmp/fgos-phase02-native-handoff-wldroe6x/workspace --json` | 4 |

## Retained fixture, ownership, and cleanup

Cleanup owner is **Main/coordinator after Phase04 fixture reuse**. Retain:

- Root: `/tmp/fgos-phase02-native-handoff-wldroe6x`.
- Fresh complete candidate: `/tmp/fgos-phase02-native-handoff-wldroe6x/candidate-corrected`.
- Standalone proof workspace/repo and installed shim: `/tmp/fgos-phase02-native-handoff-wldroe6x/workspace`.
- Isolated store/active release/install transaction: `/tmp/fgos-phase02-native-handoff-wldroe6x/state-home`.
- Isolated HOME: `/tmp/fgos-phase02-native-handoff-wldroe6x/home`.
- Full command and observation logs: `/tmp/fgos-phase02-native-handoff-wldroe6x/logs`.

Only the first owned partial candidate `/tmp/fgos-phase02-native-handoff-wldroe6x/candidate` was removed after successful final proof. Its refusal logs, native-binary digests, and sampled partial-header evidence remain. No source/repo/config edits besides the parent-approved dependency setup (expected symlink unlink, local npm ci); no commits, tests, lint, formatting, setup, or main activation changes. Execution-local `node_modules` remains installed for subsequent parent work; parent owns any eventual checkout cleanup. No live proof processes remain in the snapshot, and no manual process signals were sent.

## Full retained evidence

The following are complete retained command/observation records, not trimmed excerpts. Timeout record explicitly states its output was not recoverable from the exception; no output has been invented.

### `01-cargo-release.json`

```json
{
  "name": "01-cargo-release",
  "args": [
    "cargo",
    "build",
    "--release",
    "-p",
    "fgos",
    "-p",
    "fgctl"
  ],
  "cwd": "/home/vantt/projects/worktrees/forgentX-single-door-execution",
  "exit": 0,
  "seconds": 28.377,
  "stdout": "",
  "stderr": "   Compiling fgos-host-runtime v0.1.0 (/home/vantt/projects/worktrees/forgentX-single-door-execution/packages/host-runtime/rust)\n   Compiling fgos-observe v0.1.0 (/home/vantt/projects/worktrees/forgentX-single-door-execution/packages/observe/rust)\n   Compiling fgos-distribution v0.1.0 (/home/vantt/projects/worktrees/forgentX-single-door-execution/packages/distribution/rust)\n   Compiling fgos-run-result v0.1.0 (/home/vantt/projects/worktrees/forgentX-single-door-execution/packages/run-result/rust)\n   Compiling fgos-work-state v0.1.0 (/home/vantt/projects/worktrees/forgentX-single-door-execution/packages/work-state/rust)\n   Compiling fgctl v0.1.0 (/home/vantt/projects/worktrees/forgentX-single-door-execution/apps/fgctl)\n   Compiling fgos v0.1.0 (/home/vantt/projects/worktrees/forgentX-single-door-execution/apps/fgos)\n    Finished `release` profile [optimized] target(s) in 27.20s\n"
}
```

### `02-build-distribution.json`

```json
{
  "name": "02-build-distribution",
  "args": [
    "node",
    "scripts/build-rust-distribution.mjs",
    "--out",
    "/tmp/fgos-phase02-native-handoff-wldroe6x/candidate"
  ],
  "cwd": "/home/vantt/projects/worktrees/forgentX-single-door-execution",
  "exit": 1,
  "seconds": 0.171,
  "stdout": "",
  "stderr": "Build failed: Production dependency \"yaml\" resolves outside the checkout: /home/vantt/projects/forgentX/node_modules/yaml\n"
}
```

### `03-layout-and-partial-evidence.json`

```json
{
  "layout": {
    "checkoutRealpath": "/home/vantt/projects/worktrees/forgentX-single-door-execution",
    "nodeModulesPath": "/home/vantt/projects/worktrees/forgentX-single-door-execution/node_modules",
    "nodeModulesIsSymlink": true,
    "nodeModulesLink": "/home/vantt/projects/forgentX/node_modules",
    "nodeModulesRealpath": "/home/vantt/projects/forgentX/node_modules",
    "targetRealpath": "/home/vantt/projects/forgentX/target",
    "candidateHasManifest": false,
    "workspaceEntries": [],
    "stateHomeEntries": []
  },
  "binaries": {
    "fgos": {
      "path": "/home/vantt/projects/worktrees/forgentX-single-door-execution/target/release/fgos",
      "realpath": "/home/vantt/projects/forgentX/target/release/fgos",
      "digest": "sha256:4bb662ee1ccea8fb09db7dca1b135869f71a5ce50c81baf87384842d4167fdb0"
    },
    "fgctl": {
      "path": "/home/vantt/projects/worktrees/forgentX-single-door-execution/target/release/fgctl",
      "realpath": "/home/vantt/projects/forgentX/target/release/fgctl",
      "digest": "sha256:5961421bd9989b577b1c99d76a6272e467d4110ee4c7ee83273da019124e77ec"
    }
  },
  "headerObservations": [
    {
      "path": "/tmp/fgos-phase02-native-handoff-wldroe6x/candidate/libexec/legacy-node/.agents/skills/fgos-routing/SKILL.md",
      "sha256": "8a215975394d282772c768e69a0767aabbf1a2ca30e0fe7959252f7fcdba3a8e",
      "firstLines": [
        "---",
        "name: fgos-routing",
        "user-invocable: false",
        "description: >-",
        "  Use at the start of every fgOS work session in this repo: orient on open",
        "  work, claim an item through the pull door, then route to",
        "  fgos-coding-discovering, fgos-coding-exploring, fgos-coding-planning, or",
        "  fgos-coding-validating based on the claimed item's current",
        "  stage. Examples: \"what should I work on next\", \"I just claimed an item,",
        "  what do I do now\", \"this item is stuck waiting on a person\"."
      ]
    }
  ]
}
```

### `04-owned-node-modules-unlink.json`

```json
{
  "path": "/home/vantt/projects/worktrees/forgentX-single-door-execution/node_modules",
  "confirmedTarget": "/home/vantt/projects/forgentX/node_modules",
  "action": "unlink coordinator-owned execution-checkout symlink only",
  "mainNodeModulesPreserved": true
}
```

### `05-npm-ci.json`

```json
{
  "name": "05-npm-ci",
  "args": [
    "npm",
    "ci"
  ],
  "cwd": "/home/vantt/projects/worktrees/forgentX-single-door-execution",
  "exit": 0,
  "seconds": 0.78,
  "stdout": "\nadded 1 package, and audited 2 packages in 696ms\n\n1 package is looking for funding\n  run `npm fund` for details\n\nfound 0 vulnerabilities\n",
  "stderr": ""
}
```

### `06-proof-environment.json`

```json
{
  "removedInheritedRuntimeEnvironmentNames": [],
  "FGOS_STATE_HOME": "/tmp/fgos-phase02-native-handoff-wldroe6x/state-home",
  "HOME": "/tmp/fgos-phase02-native-handoff-wldroe6x/home",
  "NODE_PATH": "",
  "CLAUDE_CODE_SESSION_ID": "unset",
  "localNodeModulesRealpath": "/home/vantt/projects/worktrees/forgentX-single-door-execution/node_modules",
  "localYamlRealpath": "/home/vantt/projects/worktrees/forgentX-single-door-execution/node_modules/yaml"
}
```

### `07-git-init.json`

```json
{
  "name": "07-git-init",
  "args": [
    "git",
    "init"
  ],
  "cwd": "/tmp/fgos-phase02-native-handoff-wldroe6x/workspace",
  "exit": 0,
  "seconds": 0.021,
  "stdout": "Initialized empty Git repository in /tmp/fgos-phase02-native-handoff-wldroe6x/workspace/.git/\n",
  "stderr": "hint: Using 'master' as the name for the initial branch. This default branch name\nhint: is subject to change. To configure the initial branch name to use in all\nhint: of your new repositories, which will suppress this warning, call:\nhint: \nhint: \tgit config --global init.defaultBranch <name>\nhint: \nhint: Names commonly chosen instead of 'master' are 'main', 'trunk' and\nhint: 'development'. The just-created branch can be renamed via this command:\nhint: \nhint: \tgit branch -m <name>\n"
}
```

### `08-git-local-identity-name.json`

```json
{
  "name": "08-git-local-identity-name",
  "args": [
    "git",
    "config",
    "--local",
    "user.name",
    "Phase02 Native Handoff Proof"
  ],
  "cwd": "/tmp/fgos-phase02-native-handoff-wldroe6x/workspace",
  "exit": 0,
  "seconds": 0.006,
  "stdout": "",
  "stderr": ""
}
```

### `09-git-local-identity-email.json`

```json
{
  "name": "09-git-local-identity-email",
  "args": [
    "git",
    "config",
    "--local",
    "user.email",
    "phase02-native-proof@example.invalid"
  ],
  "cwd": "/tmp/fgos-phase02-native-handoff-wldroe6x/workspace",
  "exit": 0,
  "seconds": 0.03,
  "stdout": "",
  "stderr": ""
}
```

### `10-build-corrected-distribution.json`

```json
{
  "name": "10-build-corrected-distribution",
  "args": [
    "node",
    "scripts/build-rust-distribution.mjs",
    "--out",
    "/tmp/fgos-phase02-native-handoff-wldroe6x/candidate-corrected"
  ],
  "cwd": "/home/vantt/projects/worktrees/forgentX-single-door-execution",
  "exit": 0,
  "seconds": 8.408,
  "stdout": "Release tree staged successfully to /tmp/fgos-phase02-native-handoff-wldroe6x/candidate-corrected\nartifactDigest: sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb\nStaged files: 864\n",
  "stderr": ""
}
```

### `11-standalone-snapshot.json`

```json
{
  "legacyPayloadSource": "/tmp/fgos-phase02-native-handoff-wldroe6x/candidate-corrected/libexec/legacy-node",
  "standaloneWorkspace": "/tmp/fgos-phase02-native-handoff-wldroe6x/workspace",
  "gitDirectoryIsLocalDirectory": true,
  "gitDirectoryIsFile": false,
  "markerSource": "/home/vantt/projects/worktrees/forgentX-single-door-execution/apps/fgos/Cargo.toml",
  "markerTarget": "/tmp/fgos-phase02-native-handoff-wldroe6x/workspace/apps/fgos/Cargo.toml",
  "markerSha256": "618d32211d55d4ef19d198015620ad7adbe2ef420e2d22de6f24d98b714d0ca6",
  "sourceMarkerSha256": "618d32211d55d4ef19d198015620ad7adbe2ef420e2d22de6f24d98b714d0ca6"
}
```

### `12-fgctl-stage.json`

```json
{
  "name": "12-fgctl-stage",
  "args": [
    "/home/vantt/projects/worktrees/forgentX-single-door-execution/target/release/fgctl",
    "stage",
    "--from",
    "/tmp/fgos-phase02-native-handoff-wldroe6x/candidate-corrected"
  ],
  "cwd": "/tmp/fgos-phase02-native-handoff-wldroe6x/workspace",
  "exit": 0,
  "seconds": 0.036,
  "stdout": "staged release sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb\n",
  "stderr": ""
}
```

### `13-fgctl-init.json`

```json
{
  "name": "13-fgctl-init",
  "args": [
    "/home/vantt/projects/worktrees/forgentX-single-door-execution/target/release/fgctl",
    "init",
    "--from",
    "/tmp/fgos-phase02-native-handoff-wldroe6x/candidate-corrected"
  ],
  "cwd": "/tmp/fgos-phase02-native-handoff-wldroe6x/workspace",
  "exit": 0,
  "seconds": 33.57,
  "stdout": "",
  "stderr": ""
}
```

### `14-fgctl-status.json`

```json
{
  "name": "14-fgctl-status",
  "args": [
    "/home/vantt/projects/worktrees/forgentX-single-door-execution/target/release/fgctl",
    "status",
    "--json"
  ],
  "cwd": "/tmp/fgos-phase02-native-handoff-wldroe6x/workspace",
  "exit": 0,
  "seconds": 0.003,
  "stdout": "{\n  \"activeArtifactDigest\": \"sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb\",\n  \"previousArtifactDigest\": null,\n  \"releases\": [\n    {\n      \"artifactDigest\": \"sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb\",\n      \"releaseVersion\": null,\n      \"createdAt\": null\n    }\n  ]\n}\n",
  "stderr": ""
}
```

### `15-fgctl-verify.json`

```json
{
  "name": "15-fgctl-verify",
  "args": [
    "/home/vantt/projects/worktrees/forgentX-single-door-execution/target/release/fgctl",
    "verify"
  ],
  "cwd": "/tmp/fgos-phase02-native-handoff-wldroe6x/workspace",
  "exit": 0,
  "seconds": 0.027,
  "stdout": "verified active release sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb\n",
  "stderr": ""
}
```

### `16-shim-runtime-version.json`

```json
{
  "name": "16-shim-runtime-version",
  "args": [
    "/tmp/fgos-phase02-native-handoff-wldroe6x/workspace/.fgos/installation/bin/fgos",
    "version",
    "--runtime-json"
  ],
  "cwd": "/tmp/fgos-phase02-native-handoff-wldroe6x/workspace",
  "exit": null,
  "timedOutAfterSeconds": 300,
  "stdout": "not recovered from exception",
  "stderr": "not recovered from exception"
}
```

### `17-shim-doctor.json`

```json
{
  "name": "17-shim-doctor",
  "args": [
    "/tmp/fgos-phase02-native-handoff-wldroe6x/workspace/.fgos/installation/bin/fgos",
    "doctor"
  ],
  "cwd": "/tmp/fgos-phase02-native-handoff-wldroe6x/workspace",
  "exit": 0,
  "seconds": 1.771,
  "stdout": "{\n  \"contract\": \"fgos.v1\",\n  \"generated_at\": \"2026-10-06T15:25:55.251Z\",\n  \"data_hash\": \"9666ce7840d470264338c50732c6675a8b2c125617dff82503cb4dd3fdf8cbfd\",\n  \"data\": {\n    \"checks\": [\n      {\n        \"id\": \"node-version-and-git\",\n        \"description\": \"Node >=18 and git available\",\n        \"passed\": true,\n        \"message\": \"node v24.18.0, git available\"\n      },\n      {\n        \"id\": \"cli-version-visible\",\n        \"description\": \"this build's own package version/commit/verb-set resolve cleanly via `fgos version` (tsk-2ej)\",\n        \"passed\": true,\n        \"message\": \"fgos 0.1.0 (no git commit -- not a git checkout) \u2014 72 verbs\"\n      },\n      {\n        \"id\": \"shell-integration-sourced\",\n        \"description\": \"shell-integration source line present in detected rc file(s)\",\n        \"passed\": true,\n        \"message\": \"not inside a git checkout \u2014 no rc sourcing needed; fgos resolved via tier 0 at /tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/bin/fgos\"\n      },\n      {\n        \"id\": \"config-not-stale\",\n        \"description\": \".fgos/config.json exists and has every current registered default key\",\n        \"passed\": false,\n        \"message\": \"stale config \u2014 missing keys: runner, cleanup, workerSlots, invariantChecks, checkpoint, worktreeSetup, gateway, herdrOrchestrator, herdrWebDashboard, docRegistry \u2014 run fgos setup\"\n      },\n      {\n        \"id\": \"runner-rigor-config\",\n        \"description\": \"project and global runner rigorToTier maps are complete and capabilities declare only rigor floors\",\n        \"passed\": true,\n        \"message\": \"runner rigor maps and capability floors are valid at every configured level\"\n      },\n      {\n        \"id\": \"runner-patterns-config\",\n        \"description\": \"project and global runner patterns configuration is present, well-formed, and cumulative\",\n        \"passed\": true,\n        \"message\": \"warning: runner.patterns missing -- falling back to setup defaults; run fgos setup\"\n      },\n      {\n        \"id\": \"mutating-assignment-binding-snapshot\",\n        \"description\": \"every mutating assignment RunResult binding matches its unit.json snapshot\",\n        \"passed\": true,\n        \"message\": \"no assignments directory present\"\n      },\n      {\n        \"id\": \"tier-vocabulary-dead-keys\",\n        \"description\": \"project and global configs have no retired tier vocabulary keys (runner.models, minTier, rigorOverrides, etc.)\",\n        \"passed\": true,\n        \"message\": \"no retired tier vocabulary keys in project or global config\"\n      },\n      {\n        \"id\": \"model-policy-tier-coverage\",\n        \"description\": \"runner.modelPolicies covers every tier generated by rigorToTier for all registered executors\",\n        \"passed\": true,\n        \"message\": \"modelPolicies covers all tiers required by rigorToTier\"\n      },\n      {\n        \"id\": \"coordination-protocol-dead-vocabulary\",\n        \"description\": \"coordination protocols and workflows in project do not contain retired minTier or minRigor\",\n        \"passed\": true,\n        \"message\": \"no retired coordination protocol vocabulary in project\"\n      },\n      {\n        \"id\": \"task-specs-resolve\",\n        \"description\": \"every domain's taskSpecMap entry resolves to a real domains/<domain>/task-specs/ file (tsk-2t9c D6/D9)\",\n        \"passed\": true,\n        \"message\": \"every domain's taskSpecMap entry and operation resolves to a real domains/<domain>/task-specs/ file and core/task-specs/ contains all domain-agnostic task-specs\"\n      },\n      {\n        \"id\": \"agent-claims-resolve\",\n        \"description\": \"every agent-type's claims list (agents/*.yaml) names real task-specs (tsk-2t9c D12)\",\n        \"passed\": true,\n        \"message\": \"every task-spec's requires-skill/agent eligibility declaration resolves to real agent skills\"\n      },\n      {\n        \"id\": \"domain-registry-compiled\",\n        \"description\": \"every domain's compiled.json (the YAML-free form the Work lifecycle reads) exists and parses\",\n        \"passed\": true,\n        \"message\": \"1 domain registry compiled and readable\"\n      },\n      {\n        \"id\": \"agent-type-names-unique\",\n        \"description\": \"every agent-type name across core/agents/ and domains/*/agents/ is globally unique (D33)\",\n        \"passed\": true,\n        \"message\": \"every agent-type name across core/agents/ and domains/*/agents/ is globally unique (D33)\"\n      },\n      {\n        \"id\": \"main-checkout-hook-wired\",\n        \"description\": \"core.hooksPath wired to .githooks (str65 main-checkout lock guards every commit)\",\n        \"passed\": false,\n        \"message\": \"core.hooksPath not wired to .githooks \u2014 commits here are NOT guarded against concurrent-writer clobbering (str65) \u2014 run fgos setup\"\n      },\n      {\n        \"id\": \"dispatch-decide-hook-wired\",\n        \"description\": \".claude/settings.json PreToolUse hook enforces dispatch.mjs decide on every Agent/Task call\",\n        \"passed\": false,\n        \"message\": \".claude/settings.json has no PreToolUse dispatch-decide hook wired \u2014 Agent/Task calls can bypass the decide-first enforcement \u2014 run fgos setup\"\n      },\n      {\n        \"id\": \"tool-registry-configured\",\n        \"description\": \"tool registry posture \u2014 inactive/degraded/full (tsk-1dj)\",\n        \"passed\": true,\n        \"message\": \"inactive \u2014 no tool-capable executors declared (add one to runner.executors in .fgos/config.json)\"\n      },\n      {\n        \"id\": \"agy-permissions-configured\",\n        \"description\": \"agy settings.json has a working command denylist instead of relying only on --dangerously-skip-permissions (tsk-1xm)\",\n        \"passed\": true,\n        \"message\": \"agy settings.json: toolPermission=always-proceed, 7 deny rule(s) configured\"\n      },\n      {\n        \"id\": \"agy-sub-homes-configured\",\n        \"description\": \"agy sub-HOMEs referenced in executor configs have settings.json configured with toolPermission: always-proceed\",\n        \"passed\": true,\n        \"message\": \"no agy sub-HOMEs referenced in executor configs \u2014 nothing to check\"\n      },\n      {\n        \"id\": \"bwrap-available\",\n        \"description\": \"bwrap binary resolves on PATH and minimal smoke test (bwrap --ro-bind / / -- true) exits 0\",\n        \"passed\": true,\n        \"message\": \"bwrap is available on PATH and smoke test (bwrap --ro-bind / / -- true) passed\"\n      },\n      {\n        \"id\": \"work-classification-vocabulary\",\n        \"description\": \"every open item's risk/kind matches its domain's declared classification vocabulary (tsk-6ax)\",\n        \"passed\": true,\n        \"message\": \"every open item's risk/kind matches its domain's classification vocabulary\"\n      },\n      {\n        \"id\": \"work-step-vocabulary\",\n        \"description\": \"every open item sits at a step its own domain's Workflow still registers \u2014 no item stranded on a retired step (tsk-64h)\",\n        \"passed\": true,\n        \"message\": \"every open item sits at a step still registered by its domain\"\n      },\n      {\n        \"id\": \"domain-workflow-operations-coverage\",\n        \"description\": \"every stage operation across domain workflows resolves to valid task-specs, roles, skills, and legal roleGraph edges (tsk-team-dispatch-slice-1)\",\n        \"passed\": true,\n        \"message\": \"every step operation across domain workflows resolves to valid task-specs, roles, skills, and legal roleGraph edges\"\n      },\n      {\n        \"id\": \"root-drift\",\n        \"description\": \"every fgw/<root> branch is in sync with its real target \u2014 no unsynced drift left over from a leaf merge (tsk-3bn)\",\n        \"passed\": true,\n        \"message\": \"no root branch is drifted ahead of its target\"\n      },\n      {\n        \"id\": \"leaf-notify-drift\",\n        \"description\": \"every live session branch has no post-land drift against its target (tsk-1el)\",\n        \"passed\": true,\n        \"message\": \"no live session branch has post-land drift against its target\"\n      },\n      {\n        \"id\": \"delivered-not-on-trunk\",\n        \"description\": \"every item whose status says its work was handed over has its fgw/<id> branch reachable from the trunk (tsk-1l9)\",\n        \"passed\": true,\n        \"message\": \"every handed-over item's content is on the trunk\"\n      },\n      {\n        \"id\": \"events-jsonl-not-truncated\",\n        \"description\": \"shared .fgos/events.jsonl has not been silently reverted by a git stash/checkout/reset/clean (tsk-cgg)\",\n        \"passed\": true,\n        \"message\": \"truncation guard holds across events.jsonl\"\n      },\n      {\n        \"id\": \"events-compaction-verified\",\n        \"description\": \"every past .fgos/events/ compaction (archive/*.manifest.json) still deep-equal/count/hash-set matches its archived originals (T\u1ea7ng A/T6)\",\n        \"passed\": true,\n        \"message\": \"no compactions recorded yet \u2014 nothing to verify\"\n      },\n      {\n        \"id\": \"main-checkout-guard-warnings\",\n        \"description\": \"main checkout eventlog guard warnings log has no recorded regression or truncation warnings (D6)\",\n        \"passed\": true,\n        \"message\": \"no main checkout guard warnings recorded\"\n      },\n      {\n        \"id\": \"config-awareness\",\n        \"description\": \"which config level (global/project) is active, and whether the other is also present (tsk-2ta-2)\",\n        \"passed\": true,\n        \"message\": \"active: project (/tmp/fgos-phase02-native-handoff-wldroe6x/workspace/.fgos/config.json) \u2014 global config also present\"\n      },\n      {\n        \"id\": \"provider-capacity-state\",\n        \"description\": \"provider-capacity account leases/quarantine state is reportable; doctor never auto-clears quarantine\",\n        \"passed\": true,\n        \"message\": \"inactive \u2014 no global runner.providers.*.accounts inventory configured\"\n      },\n      {\n        \"id\": \"provider-capacity-lock-stale\",\n        \"description\": \"provider-capacity lock file (if any) is not held by a dead process\",\n        \"passed\": true,\n        \"message\": \"no provider-capacity lock file present\"\n      },\n      {\n        \"id\": \"advise-execute-capabilities-configured\",\n        \"description\": \"runner.capabilities declares the \\\"advise\\\" and \\\"execute\\\" purpose slots decide --for resolves against (tsk-2uf-3)\",\n        \"passed\": false,\n        \"message\": \"runner.capabilities section missing -- run fgos setup (decide --for advise/execute/code:implement cannot resolve until it exists)\"\n      },\n      {\n        \"id\": \"workflow-capabilities-configured\",\n        \"description\": \"every capability a core/domain Workflow unit names is declared in runner.capabilities\",\n        \"passed\": false,\n        \"message\": \"runner.capabilities has no entry for Workflow capabilities: architecture:frame (architecture-advisory); architecture:shape (architecture-advisory); architecture:critique (architecture-advisory); architecture:synthesize (architecture-advisory); architecture:explain (architecture-advisory); business:frame (business-discussion); business:perspectives (business-discussion); business:critique (business-discussion); business:synthesize (business-discussion); business:plan (business-discussion); delphi:propose (delphi); delphi:synthesize (delphi); group-cognition:explore (group-cognition); group-cognition:critique (group-cognition); group-cognition:synthesize (group-cognition); nominal-group:generate (nominal-group); nominal-group:share (nominal-group); nominal-group:vote (nominal-group); nominal-group:rank (nominal-group); coding:discover (coding/feature); coding:explore (coding/feature); coding:plan (coding/feature); coding:validate (coding/feature); coding:implement (coding/feature); marketing:research (marketing/content-publish); marketing:write (marketing/content-publish); marketing:publish (marketing/content-publish) -- declare each under runner.capabilities (fgos setup adds every shipped Workflow's)\"\n      },\n      {\n        \"id\": \"capability-serves-valid\",\n        \"description\": \"runner.capabilities' \\\"serves\\\" attribute sets are well-formed, mutually distinct, and include the \\\"review\\\" slot (I19)\",\n        \"passed\": false,\n        \"message\": \"runner.capabilities section missing -- run fgos setup (\\\"serves\\\" cannot be validated until it exists)\"\n      },\n      {\n        \"id\": \"operation-capability-resolves\",\n        \"description\": \"every discoverable CoordinationProtocol operation's declared policy.capability resolves against the live runner config, and reports reachable provider-family diversity (Unit I21)\",\n        \"passed\": false,\n        \"message\": \"runner config section missing -- run fgos setup\"\n      },\n      {\n        \"id\": \"dependencies-installed\",\n        \"description\": \"package.json dependencies are present in node_modules (tsk-slq D6)\",\n        \"passed\": true,\n        \"message\": \"1 dependency installed\"\n      },\n      {\n        \"id\": \"worker-slots-ceiling-usable\",\n        \"description\": \"workerSlots.ceiling is either a positive integer or explicitly null (a malformed value silently enforces nothing)\",\n        \"passed\": false,\n        \"message\": \"workerSlots section missing -- run fgos setup (no worker-slot ceiling is enforced until it exists)\"\n      },\n      {\n        \"id\": \"invariant-checks-configured\",\n        \"description\": \"invariantChecks.commands in the shared config file yields at least one runnable command\",\n        \"passed\": false,\n        \"message\": \"invariantChecks section missing -- run fgos setup (no invariant check runs at return/merge until it exists)\"\n      },\n      {\n        \"id\": \"worktree-setup-configured\",\n        \"description\": \"worktreeSetup.commands in the shared config file is a list of non-empty shell commands (malformed silently skips worktree setup)\",\n        \"passed\": true,\n        \"message\": \"worktreeSetup section absent -- worktrees get only their dependency install\"\n      },\n      {\n        \"id\": \"gate-bypass-configured\",\n        \"description\": \"gateBypass.level in the shared config file is present and a recognized level\",\n        \"passed\": true,\n        \"message\": \"gateBypass.level = \\\"off\\\"\"\n      },\n      {\n        \"id\": \"iron-law-configured\",\n        \"description\": \"ironLaw.level in the shared config file is present and a recognized level\",\n        \"passed\": true,\n        \"message\": \"ironLaw.level = \\\"ask\\\"\"\n      },\n      {\n        \"id\": \"gateway-token-configured\",\n        \"description\": \"gateway.token in ~/.fgos/config.json (home, not project) is present and non-empty\",\n        \"passed\": true,\n        \"message\": \"gateway.token present\"\n      },\n      {\n        \"id\": \"claude-plugin-marketplace\",\n        \"description\": \"fgOS Claude Code plugin marketplace is registered and the fgOS plugin is installed/enabled\",\n        \"passed\": true,\n        \"message\": \"Claude Code marketplace \\\"fgos-plugins\\\" configured, fgOS plugin enabled\"\n      },\n      {\n        \"id\": \"plugin-skill-cli-reachable\",\n        \"description\": \"a fgos CLI is reachable from this project (local bin/fgos.mjs, project-local install, or a global PATH install)\",\n        \"passed\": true,\n        \"message\": \"workspace installation found at /tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/bin/fgos\"\n      },\n      {\n        \"id\": \"plugin-dev-skills-packaged\",\n        \"description\": \"every coding-domain dev-skill under .claude/skills/fgos-* is also packaged in plugins/fgOS/skills/, so a plugin-only consumer can dispatch into it\",\n        \"passed\": true,\n        \"message\": \"not a forgent checkout (no .claude/skills or plugins/fgOS/skills at this project) -- nothing to check\"\n      },\n      {\n        \"id\": \"changelog-unreleased-stale\",\n        \"description\": \"CHANGELOG.md ## [Unreleased] section has at least one pending entry (observe/remind only, never blocks merge -- tsk-3ip)\",\n        \"passed\": true,\n        \"message\": \"CHANGELOG.md not found -- nothing to check (project has not adopted a changelog yet)\"\n      },\n      {\n        \"id\": \"readme-install-tag-exists\",\n        \"description\": \"README.md's recommended install command pins a git tag that actually exists (tsk-2t8)\",\n        \"passed\": false,\n        \"message\": \"README.md recommends installing tag \\\"v0.1.0\\\", which does not exist -- cut it per docs/how-to/cut-a-fgos-release-tag.md, or update README.md to a tag that does exist\"\n      },\n      {\n        \"id\": \"herdr-launcher-configured\",\n        \"description\": \"herdrOrchestrator toggles in the shared config file are present and boolean (tsk-2m5)\",\n        \"passed\": false,\n        \"message\": \"herdrOrchestrator section missing -- run fgos setup\"\n      },\n      {\n        \"id\": \"herdr-web-dashboard-configured\",\n        \"description\": \"herdrWebDashboard.staticServing in the shared config file is present and boolean (tsk-48w)\",\n        \"passed\": false,\n        \"message\": \"herdrWebDashboard section missing -- run fgos setup\"\n      },\n      {\n        \"id\": \"enduser-docs-index-stale\",\n        \"description\": \"docs/enduser-docs-index.json covers every on-disk end-user doc (tsk-1m0)\",\n        \"passed\": false,\n        \"message\": \"1/153 t\u00e0i li\u1ec7u end-user ch\u01b0a c\u00f3 trong index -- ch\u1ea1y fgos docs-index\"\n      },\n      {\n        \"id\": \"decision-index-stale\",\n        \"description\": \"docs/decisions/index.md matches every scope-carrying decision in state.decisions (tsk-1lv-2/tsk-1lv)\",\n        \"passed\": true,\n        \"message\": \"/tmp/fgos-phase02-native-handoff-wldroe6x/workspace/docs/decisions/index.md up to date\"\n      },\n      {\n        \"id\": \"instruction-projections-stale\",\n        \"description\": \"effective instruction-set projections and ledger are current (packaging-distribution P5)\",\n        \"passed\": false,\n        \"message\": \"file:///tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/libexec/legacy-node/src/setup/instruction-registry.mjs:684\\n        throw new InstructionRegistryError(\\n              ^\\n\\nInstructionRegistryError: Unknown domain owner \\\"coding\\\" in domains directory. Known owners are: core, platform (in domains/coding)\\n    at discoverInstructionSources (file:///tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/libexec/legacy-node/src/setup/instruction-registry.mjs:684:15)\\n    at computeInstructionProjection (file:///tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/libexec/legacy-node/src/setup/instruction-projections.mjs:248:17)\\n    at inspectInstructionProjection (file:///tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/libexec/legacy-node/src/setup/instruction-projections.mjs:279:20)\\n    at file:///tmp/fgos-phase02-native-handoff-wldroe6x/workspace/[eval1]:4:20\\n    at ModuleJob.run (node:internal/modules/esm/module_job:439:25)\\n    at async node:internal/modules/esm/loader:224:26\\n    at async ModuleLoader.executeModuleJob (node:internal/modules/esm/loader:221:20)\\n    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5) {\\n  filePath: 'domains/coding',\\n  code: 'UNKNOWN_OWNER'\\n}\\n\\nNode.js v24.18.0\"\n      },\n      {\n        \"id\": \"doc-registry-enforce\",\n        \"description\": \"docRegistry.enforce in the shared config file is present and boolean\",\n        \"passed\": false,\n        \"message\": \"docRegistry section missing -- run fgos setup\"\n      },\n      {\n        \"id\": \"doc-registry-stale\",\n        \"description\": \"docs/doc-registry.md and doc-registry.json up to date\",\n        \"passed\": true,\n        \"message\": \"doc-registry projections up to date\"\n      },\n      {\n        \"id\": \"doc-alias-broken\",\n        \"description\": \"doc aliases point to valid paths\",\n        \"passed\": true,\n        \"message\": \"no broken doc aliases\"\n      },\n      {\n        \"id\": \"doc-active-duplicate\",\n        \"description\": \"no duplicate active docs for same topic and role\",\n        \"passed\": true,\n        \"message\": \"no duplicate active docs\"\n      },\n      {\n        \"id\": \"doc-current-path-missing\",\n        \"description\": \"doc currentPath absent at HEAD\",\n        \"passed\": true,\n        \"message\": \"every live doc currentPath exists at HEAD\"\n      },\n      {\n        \"id\": \"doc-source-unreachable\",\n        \"description\": \"source capture linkage reachable through current or alias paths\",\n        \"passed\": true,\n        \"message\": \"every path-shaped source capture is reachable\"\n      },\n      {\n        \"id\": \"doc-near-duplicate\",\n        \"description\": \"near-duplicate authoritative claims check\",\n        \"passed\": true,\n        \"message\": \"no near-duplicate authoritative claims\"\n      },\n      {\n        \"id\": \"doc-provisional-aged\",\n        \"description\": \"provisional docs age check\",\n        \"passed\": true,\n        \"message\": \"no aged provisional docs\"\n      },\n      {\n        \"id\": \"doc-topic-oversized\",\n        \"description\": \"topic size check against ceiling\",\n        \"passed\": true,\n        \"message\": \"no oversized topics\"\n      },\n      {\n        \"id\": \"doc-role-underused\",\n        \"description\": \"role usage frequency check\",\n        \"passed\": true,\n        \"message\": \"no underused roles\"\n      },\n      {\n        \"id\": \"doc-source-conservation\",\n        \"description\": \"source captures conservation check\",\n        \"passed\": true,\n        \"message\": \"source conservation holds\"\n      },\n      {\n        \"id\": \"no-stuck-merge-abort\",\n        \"description\": \"main checkout has no lingering MERGE_HEAD from an in-progress or stuck merge abort (tsk-40a)\",\n        \"passed\": true,\n        \"message\": \"no merge in progress or stuck MERGE_HEAD\"\n      },\n      {\n        \"id\": \"coordination-protocol-fixtures-valid\",\n        \"description\": \"every discoverable CoordinationProtocol definition (project/domain/core tiers) normalizes through validateFlowDefinition (Phase 02 R6/R7)\",\n        \"passed\": true,\n        \"message\": \"coordination protocol fixtures retired\"\n      },\n      {\n        \"id\": \"operation-prompt-templates-valid\",\n        \"description\": \"every discoverable operation prompt template (project/domain/core tiers) validates against bounded variables and schema (Phase 03 I04)\",\n        \"passed\": true,\n        \"message\": \"17 operation prompt template(s) discovered and validated cleanly (project/domain/core tiers)\"\n      },\n      {\n        \"id\": \"coordination-example-requests-valid\",\n        \"description\": \"published `fgos coordination run` example request files validate against the same schema boundary the CLI itself enforces, and resolve every referenced protocolRef (Step 08 Phase 07 R3)\",\n        \"passed\": true,\n        \"message\": \"coordination example requests retired\"\n      },\n      {\n        \"id\": \"herdr-available\",\n        \"description\": \"herdr resolves on PATH and reports a version -- the transport every interactive dispatch mechanism needs\",\n        \"passed\": true,\n        \"message\": \"herdr is available on PATH (herdr 0.9.1-vantt.1)\"\n      },\n      {\n        \"id\": \"herdr-executor-kinds\",\n        \"description\": \"every executor dispatched through a herdr pane names an agent kind herdr can start, and none depends on an outdated herdr integration hook\",\n        \"passed\": true,\n        \"message\": \"runner config not loadable here, herdr executor kinds not evaluated: runner config (/tmp/fgos-phase02-native-handoff-wldroe6x/workspace/.fgos/config.json#runner executor) must declare \\\"command\\\" (non-empty string) and \\\"args\\\" (array of strings).\"\n      },\n      {\n        \"id\": \"executor-profile-warnings\",\n        \"description\": \"Phase 06 (executor-policy-dispatch-seams): legacy executor entries hardcoding policy-shaped flags or account-pool-like env, each named with its documented migration target\",\n        \"passed\": true,\n        \"message\": \"runner config not loadable here, executor-profile warnings not evaluated: runner config (/tmp/fgos-phase02-native-handoff-wldroe6x/workspace/.fgos/config.json#runner executor) must declare \\\"command\\\" (non-empty string) and \\\"args\\\" (array of strings).\"\n      },\n      {\n        \"id\": \"trust-store-readable\",\n        \"description\": \"the agent folder-trust store is readable and carries a usable \\\"projects\\\" object, so a dispatch into a fresh worktree can be pre-trusted instead of stopping at a dialog\",\n        \"passed\": false,\n        \"message\": \"trust store at /tmp/fgos-phase02-native-handoff-wldroe6x/home/.claude.json has no usable \\\"projects\\\" object -- its shape has changed\"\n      },\n      {\n        \"id\": \"confined-pane-accounts\",\n        \"description\": \"every confined herdr invocation that binds a private home has an account in the global provider inventory whose credential files exist, so its pane starts logged in\",\n        \"passed\": true,\n        \"message\": \"runner config not loadable here, confined pane accounts not evaluated: runner config (/tmp/fgos-phase02-native-handoff-wldroe6x/workspace/.fgos/config.json#runner executor) must declare \\\"command\\\" (non-empty string) and \\\"args\\\" (array of strings).\"\n      },\n      {\n        \"id\": \"non-claude-trust-stores-readable\",\n        \"description\": \"every executor or invocation declaring a codex-toml or agy/agy-json trustStore reads from a store that is actually readable, the same read a live dispatch will do\",\n        \"passed\": true,\n        \"message\": \"runner config not loadable here, non-claude trust stores not evaluated: runner config (/tmp/fgos-phase02-native-handoff-wldroe6x/workspace/.fgos/config.json#runner executor) must declare \\\"command\\\" (non-empty string) and \\\"args\\\" (array of strings).\"\n      },\n      {\n        \"id\": \"agent-cli-project-trusted\",\n        \"description\": \"the project root is trusted in every codex home and agy sub-HOME the configured executors run under, so a headless dispatch does not stop at a \\\"Trust this folder?\\\" prompt\",\n        \"passed\": true,\n        \"message\": \"not applicable: runner config not loadable here, agent CLI trust not evaluated (runner config (/tmp/fgos-phase02-native-handoff-wldroe6x/workspace/.fgos/config.json#runner executor) must declare \\\"command\\\" (non-empty string) and \\\"args\\\" (array of strings).)\"\n      },\n      {\n        \"id\": \"workflow-pools-satisfy-independence\",\n        \"description\": \"for every panel or reviewed Workflow unit, the capability prefer pool supplies enough distinct provider families for bind() to place every role independently\",\n        \"passed\": true,\n        \"message\": \"runner config not loadable here, Workflow pools not evaluated: runner config (/tmp/fgos-phase02-native-handoff-wldroe6x/workspace/.fgos/config.json#runner executor) must declare \\\"command\\\" (non-empty string) and \\\"args\\\" (array of strings).\"\n      },\n      {\n        \"id\": \"blind-steps-use-proven-pools\",\n        \"description\": \"every blind Workflow unit can only bind executors whose provider family and transport were proven to keep a worker blind (read-only, no model call)\",\n        \"passed\": true,\n        \"message\": \"runner config not loadable here, blind pools not evaluated: runner config (/tmp/fgos-phase02-native-handoff-wldroe6x/workspace/.fgos/config.json#runner executor) must declare \\\"command\\\" (non-empty string) and \\\"args\\\" (array of strings).\"\n      },\n      {\n        \"id\": \"executor-confinement\",\n        \"description\": \"no executor declares \\\"permissionMode\\\": \\\"bypass\\\" without privateHome, isolatedSession and ownWorktree all true\",\n        \"passed\": true,\n        \"message\": \"runner config not loadable here, confinement not evaluated: runner config (/tmp/fgos-phase02-native-handoff-wldroe6x/workspace/.fgos/config.json#runner executor) must declare \\\"command\\\" (non-empty string) and \\\"args\\\" (array of strings).\"\n      },\n      {\n        \"id\": \"invocation-git-write-grants\",\n        \"description\": \"warns when an executor or invocation still grants git add/git commit to a worker through --allowedTools (the runner commits; workers hold no git write grant)\",\n        \"passed\": true,\n        \"message\": \"runner config not loadable here, git write grants not evaluated: runner config (/tmp/fgos-phase02-native-handoff-wldroe6x/workspace/.fgos/config.json#runner executor) must declare \\\"command\\\" (non-empty string) and \\\"args\\\" (array of strings).\"\n      },\n      {\n        \"id\": \"rust-host-binary-present\",\n        \"description\": \"the active release's entries.fgos binary exists and is executable\",\n        \"passed\": true,\n        \"message\": \"rust host binary present and executable: /tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/bin/fgos\"\n      },\n      {\n        \"id\": \"rust-host-target-supported\",\n        \"description\": \"current OS and architecture is an approved target for the fgos rust host (x86_64-unknown-linux-gnu)\",\n        \"passed\": true,\n        \"message\": \"current platform (x86_64-unknown-linux-gnu) is an approved rust host target\"\n      },\n      {\n        \"id\": \"legacy-node-payload-present\",\n        \"description\": \"the legacy node payload components.legacyNode.root/entry resolves to a real file\",\n        \"passed\": true,\n        \"message\": \"legacy node payload present: /tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/libexec/legacy-node/bin/fgos.mjs\"\n      },\n      {\n        \"id\": \"command-routes-drift\",\n        \"description\": \"command routes descriptor matches current command registry and route annotations with no drift\",\n        \"passed\": false,\n        \"message\": \"command routes drift detected: Unexpected token '/', \\\"/tmp/fgos-\\\"... is not valid JSON\"\n      },\n      {\n        \"id\": \"confinement-policies-declared\",\n        \"description\": \"confinement policies referenced by capabilities exist in built-ins or runner.confinementPolicies\",\n        \"passed\": true,\n        \"message\": \"no runner capabilities declared -- nothing to check\"\n      },\n      {\n        \"id\": \"confinement-backend-registry-readable\",\n        \"description\": \"machine backend registry file exists and conforms to confinement-backend-registry.v1 schema\",\n        \"passed\": true,\n        \"message\": \"machine backend registry valid at /tmp/fgos-phase02-native-handoff-wldroe6x/home/.fgos/confinement-backends.json (1 backend(s) configured)\"\n      },\n      {\n        \"id\": \"confinement-orphaned-resources-reaped\",\n        \"description\": \"no confinement temp resources are left behind by a dead owning process\",\n        \"passed\": true,\n        \"message\": \"no orphaned confinement resources found under /tmp/fgos-confinement\"\n      },\n      {\n        \"id\": \"confinement-bwrap-platform\",\n        \"description\": \"bwrap backend instance configured in machine registry is enabled and its executable is verified on Linux\",\n        \"passed\": true,\n        \"message\": \"bwrap backend status: ready (Linux, binary \\\"/usr/bin/bwrap\\\" working, enabled)\"\n      },\n      {\n        \"id\": \"confinement-probe-freshness\",\n        \"description\": \"confinement probe freshness status (runs the 8-probe falsification harness against the registered bwrap backend)\",\n        \"passed\": true,\n        \"message\": \"confinement probe freshness: all 8 local-bwrap-v1 probes passed (fresh)\"\n      },\n      {\n        \"id\": \"confinement-blind-read\",\n        \"description\": \"a blind unit can be enforced: the registered bwrap backend hides peer run state, homes and processes from a worker\",\n        \"passed\": true,\n        \"message\": \"blind-read: pass (a blind worker cannot read a peer run, home or process)\"\n      },\n      {\n        \"id\": \"confinement-strict-readiness\",\n        \"description\": \"strict confinement readiness (all capabilities declared with known policies, bwrap ready)\",\n        \"passed\": true,\n        \"message\": \"warning: strict confinement disabled (no capabilities declared)\"\n      },\n      {\n        \"id\": \"confinement-herdr-maturity\",\n        \"description\": \"herdr confinement convergence maturity status (partial: pre-adapter checks under Authority, session/home lifecycle adapter-managed)\",\n        \"passed\": true,\n        \"message\": \"herdr confinement maturity: not applicable (no herdr-spawn executors configured)\"\n      },\n      {\n        \"id\": \"coordination-abandoned-claims\",\n        \"description\": \"coordination session directories do not contain abandoned claims (.claim or .staging-*)\",\n        \"passed\": true\n      },\n      {\n        \"id\": \"runner-coordination-orgPolicy-shape\",\n        \"description\": \"runner.coordination.orgPolicy.dischargeOn is a valid array of strings if present\",\n        \"passed\": true\n      },\n      {\n        \"id\": \"shadow-binder-divergence\",\n        \"description\": \"real PlacementPolicy/ProviderAdapter shadow-binder divergence is durably recorded, not only ephemeral stderr (dispatch-engine-liveness-hardening Phase 7, C1)\",\n        \"passed\": true,\n        \"message\": \"no shadow-binder divergence recorded\"\n      },\n      {\n        \"id\": \"observe-dir-writable\",\n        \"description\": \".fgos/observe directory is writable\",\n        \"passed\": true,\n        \"message\": \".fgos/observe is writable\"\n      },\n      {\n        \"id\": \"observe-friction-migrated\",\n        \"description\": \"legacy work.friction records are fully migrated to .fgos/observe/friction with no unmigrated records past cursor\",\n        \"passed\": true,\n        \"message\": \"no legacy work.friction records to migrate\"\n      },\n      {\n        \"id\": \"observe-host-resolvable\",\n        \"description\": \"Rust host binary resolves and supports observe commands (friction ping)\",\n        \"passed\": true,\n        \"message\": \"host binary at /tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/bin/fgos resolved and verified (friction supported)\"\n      },\n      {\n        \"id\": \"observe-run-coverage\",\n        \"description\": \"Observe directory totals and admitted runs match the independent Node layout and eligibility projections\",\n        \"passed\": true,\n        \"message\": \"run coverage matches: directories Node 0, host 0; eligible Node 0, observed host 0; recent tolerance 0; /tmp/fgos-phase02-native-handoff-wldroe6x/workspace\"\n      }\n    ]\n  }\n}\n",
  "stderr": "fatal: not a git repository (or any of the parent directories): .git\n"
}
```

### `18-shim-workflow-status.json`

```json
{
  "name": "18-shim-workflow-status",
  "args": [
    "/tmp/fgos-phase02-native-handoff-wldroe6x/workspace/.fgos/installation/bin/fgos",
    "workflow",
    "status",
    "phase02-native-proof-read-only",
    "--dir",
    "/tmp/fgos-phase02-native-handoff-wldroe6x/workspace",
    "--json"
  ],
  "cwd": "/tmp/fgos-phase02-native-handoff-wldroe6x/workspace",
  "exit": 4,
  "seconds": 0.141,
  "stdout": "",
  "stderr": "fgos: Workflow run \"phase02-native-proof-read-only\" not found\n"
}
```

### `19-native-timeout-stdin-diagnosis.json`

```json
{
  "fd0IsTTY": false,
  "fd0Link": "socket:[2810164901]",
  "fd0ImmediatelyReadable": false,
  "subprocessOriginalInput": "inherited fd0: run_proof did not specify stdin or input",
  "nativeCode": "apps/fgos/src/main.rs:227-234 drains non-terminal stdin via std::io::copy before invoking non-observe native provider",
  "diagnosis": "[INFERENCE] inherited open nonterminal stdin blocked native version before provider execution; no live stack was captured before subprocess.run killed timed-out process"
}
```

### `20-doctor-check-summary.json`

```json
{
  "count": 98,
  "passed": 81,
  "failed": 17,
  "failedChecks": [
    {
      "id": "config-not-stale",
      "description": ".fgos/config.json exists and has every current registered default key",
      "passed": false,
      "message": "stale config \u2014 missing keys: runner, cleanup, workerSlots, invariantChecks, checkpoint, worktreeSetup, gateway, herdrOrchestrator, herdrWebDashboard, docRegistry \u2014 run fgos setup"
    },
    {
      "id": "main-checkout-hook-wired",
      "description": "core.hooksPath wired to .githooks (str65 main-checkout lock guards every commit)",
      "passed": false,
      "message": "core.hooksPath not wired to .githooks \u2014 commits here are NOT guarded against concurrent-writer clobbering (str65) \u2014 run fgos setup"
    },
    {
      "id": "dispatch-decide-hook-wired",
      "description": ".claude/settings.json PreToolUse hook enforces dispatch.mjs decide on every Agent/Task call",
      "passed": false,
      "message": ".claude/settings.json has no PreToolUse dispatch-decide hook wired \u2014 Agent/Task calls can bypass the decide-first enforcement \u2014 run fgos setup"
    },
    {
      "id": "advise-execute-capabilities-configured",
      "description": "runner.capabilities declares the \"advise\" and \"execute\" purpose slots decide --for resolves against (tsk-2uf-3)",
      "passed": false,
      "message": "runner.capabilities section missing -- run fgos setup (decide --for advise/execute/code:implement cannot resolve until it exists)"
    },
    {
      "id": "workflow-capabilities-configured",
      "description": "every capability a core/domain Workflow unit names is declared in runner.capabilities",
      "passed": false,
      "message": "runner.capabilities has no entry for Workflow capabilities: architecture:frame (architecture-advisory); architecture:shape (architecture-advisory); architecture:critique (architecture-advisory); architecture:synthesize (architecture-advisory); architecture:explain (architecture-advisory); business:frame (business-discussion); business:perspectives (business-discussion); business:critique (business-discussion); business:synthesize (business-discussion); business:plan (business-discussion); delphi:propose (delphi); delphi:synthesize (delphi); group-cognition:explore (group-cognition); group-cognition:critique (group-cognition); group-cognition:synthesize (group-cognition); nominal-group:generate (nominal-group); nominal-group:share (nominal-group); nominal-group:vote (nominal-group); nominal-group:rank (nominal-group); coding:discover (coding/feature); coding:explore (coding/feature); coding:plan (coding/feature); coding:validate (coding/feature); coding:implement (coding/feature); marketing:research (marketing/content-publish); marketing:write (marketing/content-publish); marketing:publish (marketing/content-publish) -- declare each under runner.capabilities (fgos setup adds every shipped Workflow's)"
    },
    {
      "id": "capability-serves-valid",
      "description": "runner.capabilities' \"serves\" attribute sets are well-formed, mutually distinct, and include the \"review\" slot (I19)",
      "passed": false,
      "message": "runner.capabilities section missing -- run fgos setup (\"serves\" cannot be validated until it exists)"
    },
    {
      "id": "operation-capability-resolves",
      "description": "every discoverable CoordinationProtocol operation's declared policy.capability resolves against the live runner config, and reports reachable provider-family diversity (Unit I21)",
      "passed": false,
      "message": "runner config section missing -- run fgos setup"
    },
    {
      "id": "worker-slots-ceiling-usable",
      "description": "workerSlots.ceiling is either a positive integer or explicitly null (a malformed value silently enforces nothing)",
      "passed": false,
      "message": "workerSlots section missing -- run fgos setup (no worker-slot ceiling is enforced until it exists)"
    },
    {
      "id": "invariant-checks-configured",
      "description": "invariantChecks.commands in the shared config file yields at least one runnable command",
      "passed": false,
      "message": "invariantChecks section missing -- run fgos setup (no invariant check runs at return/merge until it exists)"
    },
    {
      "id": "readme-install-tag-exists",
      "description": "README.md's recommended install command pins a git tag that actually exists (tsk-2t8)",
      "passed": false,
      "message": "README.md recommends installing tag \"v0.1.0\", which does not exist -- cut it per docs/how-to/cut-a-fgos-release-tag.md, or update README.md to a tag that does exist"
    },
    {
      "id": "herdr-launcher-configured",
      "description": "herdrOrchestrator toggles in the shared config file are present and boolean (tsk-2m5)",
      "passed": false,
      "message": "herdrOrchestrator section missing -- run fgos setup"
    },
    {
      "id": "herdr-web-dashboard-configured",
      "description": "herdrWebDashboard.staticServing in the shared config file is present and boolean (tsk-48w)",
      "passed": false,
      "message": "herdrWebDashboard section missing -- run fgos setup"
    },
    {
      "id": "enduser-docs-index-stale",
      "description": "docs/enduser-docs-index.json covers every on-disk end-user doc (tsk-1m0)",
      "passed": false,
      "message": "1/153 t\u00e0i li\u1ec7u end-user ch\u01b0a c\u00f3 trong index -- ch\u1ea1y fgos docs-index"
    },
    {
      "id": "instruction-projections-stale",
      "description": "effective instruction-set projections and ledger are current (packaging-distribution P5)",
      "passed": false,
      "message": "file:///tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/libexec/legacy-node/src/setup/instruction-registry.mjs:684\n        throw new InstructionRegistryError(\n              ^\n\nInstructionRegistryError: Unknown domain owner \"coding\" in domains directory. Known owners are: core, platform (in domains/coding)\n    at discoverInstructionSources (file:///tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/libexec/legacy-node/src/setup/instruction-registry.mjs:684:15)\n    at computeInstructionProjection (file:///tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/libexec/legacy-node/src/setup/instruction-projections.mjs:248:17)\n    at inspectInstructionProjection (file:///tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/libexec/legacy-node/src/setup/instruction-projections.mjs:279:20)\n    at file:///tmp/fgos-phase02-native-handoff-wldroe6x/workspace/[eval1]:4:20\n    at ModuleJob.run (node:internal/modules/esm/module_job:439:25)\n    at async node:internal/modules/esm/loader:224:26\n    at async ModuleLoader.executeModuleJob (node:internal/modules/esm/loader:221:20)\n    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5) {\n  filePath: 'domains/coding',\n  code: 'UNKNOWN_OWNER'\n}\n\nNode.js v24.18.0"
    },
    {
      "id": "doc-registry-enforce",
      "description": "docRegistry.enforce in the shared config file is present and boolean",
      "passed": false,
      "message": "docRegistry section missing -- run fgos setup"
    },
    {
      "id": "trust-store-readable",
      "description": "the agent folder-trust store is readable and carries a usable \"projects\" object, so a dispatch into a fresh worktree can be pre-trusted instead of stopping at a dialog",
      "passed": false,
      "message": "trust store at /tmp/fgos-phase02-native-handoff-wldroe6x/home/.claude.json has no usable \"projects\" object -- its shape has changed"
    },
    {
      "id": "command-routes-drift",
      "description": "command routes descriptor matches current command registry and route annotations with no drift",
      "passed": false,
      "message": "command routes drift detected: Unexpected token '/', \"/tmp/fgos-\"... is not valid JSON"
    }
  ]
}
```

### `21-selected-release-header-route-evidence.json`

```json
{
  "artifactDigest": "sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb",
  "manifestArtifactDigest": "sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb",
  "activation": {
    "schemaVersion": 1,
    "repositoryId": "repo_095f98721b061ccc",
    "workspaceId": "095f98721b061ccc",
    "workStateId": "095f98721b061ccc",
    "activationId": "act_000001a111cc8d09",
    "status": "ready",
    "artifactDigest": "sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb",
    "releasePath": "/tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb",
    "previousArtifactDigest": null,
    "shimVersion": "1",
    "resolvedDependencies": {
      "node": "/home/vantt/.local/bin/node"
    },
    "pinSnapshot": {
      "schemaVersion": 1,
      "projectRuntime": {
        "policy": "exact-digest",
        "artifactDigest": "sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb",
        "releaseVersion": null,
        "channel": null,
        "allowPrerelease": false
      }
    },
    "activatedAt": "2026-10-06T15:19:40.553Z",
    "activatedBy": {
      "tool": "fgctl",
      "version": "0.1.0"
    }
  },
  "root": {
    "schemaVersion": 1,
    "repositoryRoot": "/tmp/fgos-phase02-native-handoff-wldroe6x/workspace",
    "workspaceId": "095f98721b061ccc",
    "workStateId": "095f98721b061ccc",
    "machineReleaseStore": "/tmp/fgos-phase02-native-handoff-wldroe6x/state-home"
  },
  "transaction": {
    "schemaVersion": 1,
    "activationId": "act_000001a111cc8d09",
    "workspaceId": "095f98721b061ccc",
    "artifactDigest": "sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb",
    "status": "complete",
    "history": [
      {
        "status": "staging",
        "timestamp": "2026-10-06T15:19:40.553Z"
      },
      {
        "status": "verified",
        "timestamp": "2026-10-06T15:19:40.553Z"
      },
      {
        "status": "preparing",
        "timestamp": "2026-10-06T15:19:40.553Z"
      },
      {
        "status": "ready-published",
        "timestamp": "2026-10-06T15:19:40.553Z"
      },
      {
        "status": "complete",
        "timestamp": "2026-10-06T15:20:13.659Z"
      }
    ],
    "updatedAt": "2026-10-06T15:20:13.659Z"
  },
  "routes": {
    "doctor": {
      "selector": "doctor",
      "route_kind": "legacy-cli",
      "legacy_payload": "legacy-node",
      "owner_path": "src/cli/command-registry.mjs",
      "compatibility_tests": [
        "test/rust-host/command-routes.test.mjs"
      ]
    },
    "workflow": {
      "selector": "workflow",
      "route_kind": "legacy-cli",
      "legacy_payload": "legacy-node",
      "owner_path": "src/cli/command-registry.mjs",
      "compatibility_tests": [
        "test/rust-host/command-routes.test.mjs"
      ]
    },
    "version": {
      "selector": "version",
      "route_kind": "native",
      "operation_id": "distribution.build.show",
      "owner_path": "packages/distribution/rust",
      "compatibility_tests": [
        "test/rust-host/command-routes.test.mjs"
      ]
    }
  },
  "headerEvidence": [
    {
      "selectedReleaseFile": "/tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/libexec/legacy-node/.agents/skills/fgos-routing/SKILL.md",
      "sourcePath": "core/skills/fgos-routing/SKILL.md",
      "headerRows": [
        [
          12,
          "<!-- Generated by fgOS skill assembly from core/skills/fgos-routing/SKILL.md (npm run build:skills in the fgOS source repo). Do not edit this copy; it is overwritten. -->"
        ]
      ],
      "headerCount": 1,
      "selectedSha256": "8a215975394d282772c768e69a0767aabbf1a2ca30e0fe7959252f7fcdba3a8e",
      "candidateBytesMatchSelected": true,
      "workspaceBytesMatchSelected": true,
      "frontmatterBytesPreserved": true,
      "headerImmediatelyAfterFrontmatter": true
    },
    {
      "selectedReleaseFile": "/tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/libexec/legacy-node/.agents/skills/fgos-coding-planning/SKILL.md",
      "sourcePath": "domains/coding/skills/fgos-coding-planning/SKILL.md",
      "headerRows": [
        [
          12,
          "<!-- Generated by fgOS skill assembly from domains/coding/skills/fgos-coding-planning/SKILL.md (npm run build:skills in the fgOS source repo). Do not edit this copy; it is overwritten. -->"
        ]
      ],
      "headerCount": 1,
      "selectedSha256": "9e32ee92eb6ddd89efc84bfc3c463a2458248cdbf33582d8a7817663ee1f6b57",
      "candidateBytesMatchSelected": true,
      "workspaceBytesMatchSelected": true,
      "frontmatterBytesPreserved": true,
      "headerImmediatelyAfterFrontmatter": true
    }
  ],
  "runtimeChecks": [
    {
      "id": "task-specs-resolve",
      "description": "every domain's taskSpecMap entry resolves to a real domains/<domain>/task-specs/ file (tsk-2t9c D6/D9)",
      "passed": true,
      "message": "every domain's taskSpecMap entry and operation resolves to a real domains/<domain>/task-specs/ file and core/task-specs/ contains all domain-agnostic task-specs"
    },
    {
      "id": "plugin-dev-skills-packaged",
      "description": "every coding-domain dev-skill under .claude/skills/fgos-* is also packaged in plugins/fgOS/skills/, so a plugin-only consumer can dispatch into it",
      "passed": true,
      "message": "not a forgent checkout (no .claude/skills or plugins/fgOS/skills at this project) -- nothing to check"
    },
    {
      "id": "rust-host-binary-present",
      "description": "the active release's entries.fgos binary exists and is executable",
      "passed": true,
      "message": "rust host binary present and executable: /tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/bin/fgos"
    },
    {
      "id": "rust-host-target-supported",
      "description": "current OS and architecture is an approved target for the fgos rust host (x86_64-unknown-linux-gnu)",
      "passed": true,
      "message": "current platform (x86_64-unknown-linux-gnu) is an approved rust host target"
    },
    {
      "id": "legacy-node-payload-present",
      "description": "the legacy node payload components.legacyNode.root/entry resolves to a real file",
      "passed": true,
      "message": "legacy node payload present: /tmp/fgos-phase02-native-handoff-wldroe6x/state-home/releases/sha256:9144a90944421011cc990daf55160b0fff0e35aa31fbc3290622213a42feedbb/libexec/legacy-node/bin/fgos.mjs"
    }
  ],
  "nativeBinaryDigest": "sha256:4bb662ee1ccea8fb09db7dca1b135869f71a5ce50c81baf87384842d4167fdb0",
  "noOwnedProcessesInSnapshot": true
}
```

### `22-owned-partial-candidate-cleanup.json`

```json
{
  "ownedPath": "/tmp/fgos-phase02-native-handoff-wldroe6x/candidate",
  "hadManifest": false,
  "failureLogsRetained": "/tmp/fgos-phase02-native-handoff-wldroe6x/logs/02-build-distribution.json",
  "partialHeaderEvidenceRetained": "/tmp/fgos-phase02-native-handoff-wldroe6x/logs/03-layout-and-partial-evidence.json",
  "action": "removed only original owned partial candidate after successful final stage/init/verify/doctor and workflow consumer proof"
}
```
