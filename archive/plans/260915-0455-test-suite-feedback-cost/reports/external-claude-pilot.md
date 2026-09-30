# P04 External-Claude Isolation Pilot

Date: 2026-09-16

Branch: `test-suite-feedback-cost--p04`

Base: `97357ffc2d29157e8cf7be2a211a58bfb85b0a8a`

Verdict: `expand`

## Scope

P04 isolated setup/doctor CLI tests that accidentally inherited the real local
Claude provider. The production `claude-plugin-marketplace` check/fix shells out
through `claudeCommand()`, which reads `FGOS_CLAUDE_COMMAND` and otherwise falls
back to the real `claude` binary. Test coverage that is not about the real
Claude boundary should therefore use the existing nonexistent-command seam.

Confirmed sites:

| File | Sites | Reason |
|---|---:|---|
| `test/setup/checks.test.mjs` | 3 | `fgos doctor` / `doctor --pretty` run the full doctor registry, including `claude-plugin-marketplace`. |
| `test/setup/checks-doctor-config.test.mjs` | 3 | Same doctor registry path after the setup/doctor split. |
| `test/setup/uninstall-wiring-2.test.mjs` | 1 | `fgos setup` runs before proving refused uninstall behavior. |
| `test/setup/uninstall-wiring-3.test.mjs` | 1 | `fgos setup` runs before proving `uninstall --yes` behavior. |

Rejected false positives:

| File | Reason |
|---|---|
| `test/cli/fgos-manifest.test.mjs` | Runs `setup --help`; help does not reach setup execution or the doctor registry. |
| `test/setup/self-uninstall-spike.test.mjs` | Runs self-uninstall only; it does not run `setup` or `doctor`. |

## Change

- Replaced the 6 doctor CLI envs with `{ ...NO_CLAUDE_ENV, HOME: homeDir }`.
- Added `FGOS_CLAUDE_COMMAND: '/nonexistent/fgos-test-claude-binary'` to the 2
  uninstall setup calls while preserving their temp `HOME`.
- Added a regression guard in `checks-doctor-config.test.mjs` that fails if
  these setup/doctor e2e files reintroduce the unsafe env shapes.

## Timing

Command shape:

```sh
/usr/bin/time -f 'TIME real=%e user=%U sys=%S' node --test <file>
```

Environment: Node `v24.18.0`, Linux `6.8.0-138-generic`, 16 CPUs.

| File | Before real | After real | Direct delta |
|---|---:|---:|---:|
| `test/setup/checks.test.mjs` | 5.92s | 5.96s | +0.04s |
| `test/setup/checks-doctor-config.test.mjs` | 3.66s | 3.08s | -0.58s |
| `test/setup/uninstall-wiring-2.test.mjs` | 20.34s | 0.39s | -19.95s |
| `test/setup/uninstall-wiring-3.test.mjs` | 20.76s | 0.41s | -20.35s |
| Sequential focused total | 50.68s | 9.84s | -40.84s |

Combined focused selector after the change:

```sh
/usr/bin/time -f 'TIME real=%e user=%U sys=%S' node --test \
  test/setup/checks.test.mjs \
  test/setup/checks-doctor-config.test.mjs \
  test/setup/uninstall-wiring-2.test.mjs \
  test/setup/uninstall-wiring-3.test.mjs
```

Result: 175 pass, 0 fail, `TIME real=5.96 user=6.50 sys=4.86`.

The uninstall wiring files are the material win in this environment. Doctor
file deltas are small enough to treat as noise, but the guard still prevents
future accidental real-provider calls in those e2e paths.

## Proof

Passed:

```sh
node --test test/setup/checks.test.mjs
node --test test/setup/checks-doctor-config.test.mjs
node --test test/setup/uninstall-wiring-2.test.mjs
node --test test/setup/uninstall-wiring-3.test.mjs
node --test test/setup/checks.test.mjs test/setup/checks-doctor-config.test.mjs test/setup/uninstall-wiring-2.test.mjs test/setup/uninstall-wiring-3.test.mjs
rg -n "env: \{ \.\.\.process\.env, HOME: homeDir \}|run\(cwd, \['setup'\], \{ HOME: home \}\)" test/setup/checks.test.mjs test/setup/checks-doctor-config.test.mjs test/setup/uninstall-wiring-2.test.mjs test/setup/uninstall-wiring-3.test.mjs
cargo build --release --workspace
npm ci
node --test test/runner/flow-definition-standalone-master-coordination-loop.test.mjs test/runner/flow-definition-protocol-loader.test.mjs
node --test test/verbs/coordination-run-live-proof.test.mjs
node --test test/runner/loop.test.mjs
npm test
git diff --check
```

Full suite result after `npm ci` on the original P04 base: 6,763 tests, 6,754
pass, 9 skipped, 0 fail, duration 378,891.792316ms.

Final full suite result after rebasing P04 onto main
`92bdb781ce323caca0d29d45712299893ceffa11`: 6,809 tests, 6,800 pass, 9
skipped, 0 fail, duration 369,865.06657ms.

The first full-suite attempt in this fresh worktree failed before the dependency
install because `node_modules/yaml` was missing:

```text
Cannot find module 'yaml'
```

After `npm ci`, the focused protocol recovery tests and the final `npm test`
passed. This was a worktree dependency setup issue, not a product-code
regression from P04.

GitNexus detect-changes degraded:

```text
MISSING .gitnexus/run.cjs
```

Manual fallback audit: scoped diff touches only setup test files and this report;
no production symbols or setup/doctor runtime implementation changed.
