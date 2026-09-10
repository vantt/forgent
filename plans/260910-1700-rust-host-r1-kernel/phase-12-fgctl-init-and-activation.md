# Phase 12 — fgctl Init And Workspace Activation

Depends on: Phase 11 closed and merged.

## Objective

Implement `fgctl init [--from <source>]`: the acquire → stage → verify →
preflight → publish → tail pipeline for one workspace, writing the stable
`sh` shims, `root.json`, and `activation.json`, then running
`fgos init → doctor --fix → doctor` through the newly activated release.
Extend `distribution.build.show` (`version --runtime-json`) to report the
walking-skeleton identity fields by reading that same `activation.json`.

## Requirements

- R1: Resolve the workspace root via `git rev-parse --path-format=absolute
  --git-common-dir`'s parent directory (this repo's established
  main-checkout pattern, `docs/specs/distribution.md:297`); refuse with a
  clear error outside a git repository, writing nothing.
- R2: `workspaceId` = first 16 hex chars of `sha256(realpath(workspace
  root))`; `workStateId = workspaceId` in V1 (Decisions table).
- R3: Read tracked `.fgos/distribution.json` if present (§8 shape) to
  select the release; when absent, select from `--from <source>` and, after
  a successful publish, write it: `{schemaVersion:1,
  projectRuntime:{policy:"exact-digest", artifactDigest, releaseVersion,
  channel:null, allowPrerelease:false}}` (git-tracked, not gitignored).
- R4: Acquire/stage via Phase 11's stage logic as a library call, never a
  subprocess self-exec, reusing its `install.lock`/quarantine unchanged.
- R5: Read-only `.fgos/main-checkout.lock` liveness check before publish,
  reusing `src/runner/main-checkout-lock.mjs`'s rule rather than
  reinventing it: parse `{pid, ts}`; a numeric `pid` is live via an OS
  process-existence probe (mirrors that module's `isPidAlive`, EPERM =
  alive); a string identity is judged only by `ts` freshness against that
  module's exported `DEFAULT_TTL_MS` (`3 * 60 * 1000` ms — cite the value,
  flag drift); missing file = free; unparseable record = ambiguous. Held or
  ambiguous both refuse (`lock-held`/`lock-ambiguous`, naming the holder
  when known), writing nothing. Never creates, refreshes, or clears the
  lock itself.
- R6: Preflight before publish, no host-visible writes: recompute
  `artifactDigest`; verify every `files[]` digest; confirm `requires.node`
  is satisfied by `node --version` on `PATH`; confirm `bin/fgos` is present
  and executable; run `<candidate>/bin/fgos version --runtime-json` with
  `FGOS_BOOTSTRAP_CANDIDATE=1`, `FGOS_CANDIDATE_ARTIFACT_DIGEST=<digest>`,
  `FGOS_CANDIDATE_RELEASE_PATH=<path>` (§6) and require exit 0. A failure
  leaves the previous activation untouched.
- R7: Write the capsule at `<workspace root>/.fgos/installation/`:
  `bin/fgos` and `bin/fgos-runner` — identical shims, differing only in the
  `entry=` line's last path segment:

  ```sh
  #!/bin/sh
  # fgOS workspace stable shim -- written by fgctl. Do not hand-edit; run
  # `fgctl repair` to regenerate it.
  set -eu
  self_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
  activation="$self_dir/../activation.json"
  [ -f "$activation" ] || { echo "fgos: no active runtime -- run fgctl init" >&2; exit 3; }
  release_path=$(sed -n 's/^[[:space:]]*"releasePath"[[:space:]]*:[[:space:]]*"\(.*\)"[,]*$/\1/p' "$activation" | head -n1)
  [ -n "$release_path" ] || { echo "fgos: activation.json missing releasePath -- run fgctl repair" >&2; exit 3; }
  entry="$release_path/bin/fgos"
  [ -x "$entry" ] || { echo "fgos: active release entry not found: $entry -- run fgctl repair" >&2; exit 3; }
  exec "$entry" "$@"
  ```

  Hardcodes its release-relative entry rather than reading `manifest.json`'s
  `entries` map, since §3 limits the shim to three `activation.json` fields;
  Phase 09 fixes `entries.fgos`/`entries.fgosRunner` at exactly `bin/fgos`/
  `bin/fgos-runner` for every release this track stages, so the hardcode
  holds for V1. Then write `root.json` (`{schemaVersion:1, repositoryRoot,
  workspaceId, workStateId, machineReleaseStore}`), publish
  `activation.json` per §6 via `.tmp.<activationId>` write + same-directory
  rename, then write `<store>/installs/<activationId>.json` recording
  `staging → verified → preparing → ready-published`.
- R8: Run the tail through the just-written shim: `init`, `doctor --fix`,
  `doctor`. All three exit 0 → mark the transaction `complete`; any failure
  → mark `ready-degraded`, print that command's output, exit non-zero;
  `activation.json` stays published even when the tail fails.
- R9: Idempotent re-run: when the resolved digest equals the current
  `artifactDigest`, skip re-staging/rewriting `activation.json`/`root.json`
  (no new `activationId`), but still run the R8 tail. Add
  `.fgos/installation/` to the root `.gitignore`, one line, matching the
  file's existing `.fgos/*.lock`-style entries (no pattern covers it yet).
- R10: `distribution.build.show` gains an optional `include_runtime: bool`
  (default `false`, every Phase 08 caller/vector unaffected).
  `cli_projector.rs` sets it `true` only for `version --runtime-json`. When
  `true`, the provider resolves `.fgos/installation/activation.json` via
  R1's git-common-dir walk from cwd; when found, the outcome adds the §14
  fields — project root, `workspaceId`, `workHistoryRoot`
  (`<workspace root>/.fgos/local/work-state/<workStateId>`, per
  `workspace-topology.md` §4), `workStateId`, `machineReleaseStore`, active
  `artifactDigest`, `releaseVersion`, manifest `schemaVersion`,
  `stateSchemas.{read,write}`, `components.legacyNode.{root,entry,digest}`,
  `host: "rust"`; when not found, every field is `null` and `host` is
  `"dev-source"` — never an error. `cli_presenter.rs` adds these as extra
  `data` fields in the same envelope.
- R11: `test/rust-host/fgctl-init.test.mjs` (`FGOS_STATE_HOME` a fresh temp
  dir in every case): temp `$HOME` + fresh `git init` project, `fgctl init
  --from <Phase-09 tree>` → shims exist/executable, `activation.json.status`
  is `"ready"`, `version --runtime-json` reports the R10 fields with
  `host: "rust"` and the expected digest; `ready --json` through the shim
  matches `node bin/fgos.mjs ready --json` byte-for-byte; a hand-written
  live `.fgos/main-checkout.lock` refuses `init` writing nothing; a non-git
  directory refuses with no `.fgos/installation/` created; re-running
  `init` at the same digest is idempotent (`activationId` unchanged, tail
  still exits 0).

## Files

Likely touch:

- `apps/fgctl/src/**` (`init` subcommand and its modules)
- `packages/distribution/rust/src/**` (workspace/`workspaceId` resolution,
  pin read/write, capsule/shim writer, activation writer, lock reader)
- `apps/fgos/src/cli_projector.rs`, `apps/fgos/src/cli_presenter.rs`
  (`version --runtime-json` only)
- `.gitignore` (`.fgos/installation/` entry only); `test/rust-host/
  fgctl-init.test.mjs` (new)

Do not touch:

- `apps/fgos/src/legacy_exec.rs`, `apps/fgos/src/main.rs` (Phase 07/08
  leases), `packages/host-runtime/rust/**`
- `src/setup/bin-discovery.mjs`, `scripts/fgos-shell-integration.sh`,
  `herdr-plugin/**` (`resolver` lease); `bin/fgos.mjs` (executed only)
- any real content under this checkout's own `.fgos/installation/`,
  `.fgos/distribution.json`, `.fgos/main-checkout.lock` (fixtures only)

## Verification

```sh
cargo build --release --workspace
node --test test/rust-host/fgctl-init.test.mjs
```

- `activation.json.status` is `ready`; `version --runtime-json` reports
  `host: "rust"` and the staged digest; `ready --json` through the shim is
  byte-identical to the direct Node invocation.
- The live-lock and non-git-dir refusals exit non-zero, writing nothing;
  the idempotent-re-run case passes.
- Capability annotation for this cell: `code:implement`.
