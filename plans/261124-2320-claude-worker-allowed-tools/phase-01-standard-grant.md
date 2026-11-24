# Phase 1: Grant in the standard invocation, its proof and the changelog line

Capability: `code:implement`.

Adds the owner's chosen grant to the standard `claude-cli-bwrap` invocation. Extends the one test that owns the
worker-allowlist rule so it also covers the standard invocation. Adds the changelog line.

## Inputs

- `plans/discussions/ds-ayxhxswso6-claude-worker-allowed-tools/DISCUSSION.md`: the decision and constraints.
- `core/config-standard/runner.yaml` lines 33-46: the `claude-cli-bwrap` invocation.
- `core/config-schema/runner.schema.yaml` lines 640-670 (invocation `args`: a list of strings) and line 839
  (`toolGating`). Read them only; no schema change is needed.
- `test/runner/dispatch.test.mjs` around line 475: the test "the committed .fgos/config.json runner section grants
  the worker acceptEdits plus test commands only — no git write grant (the runner commits)".
- `test/session-host/head-start.test.mjs` lines 221-240: the pattern for reading the standard file directly through
  `resolveInvocationRoot` and `parseYaml`. Reuse its imports and do not edit that file; plan 0004 owns it.

## Footprint

- `core/config-standard/runner.yaml`
- `test/runner/dispatch.test.mjs`
- `CHANGELOG.md`

## Steps

1. In `core/config-standard/runner.yaml`, change only the `claude-cli-bwrap` `args` to
   `["-p", "{prompt}", "--model", "{model}", "--permission-mode", acceptEdits, "--allowedTools", "Bash(cargo:*),Bash(node:*),Bash(npm test:*)"]`.
   Keep `--allowedTools` last, with one comma-joined value.
2. In `test/runner/dispatch.test.mjs`, extend the existing allowlist test; do not add a second test:
   - Widen its allowed-tool pattern so `Bash(npm test:*)` is accepted.
   - Also read `core/config-standard/runner.yaml` directly, the same way head-start.test.mjs does. Find the
     `claude-cli-bwrap` invocation of executor `claude`. Assert that its `--allowedTools` value split on commas
     deep-equals `['Bash(cargo:*)', 'Bash(node:*)', 'Bash(npm test:*)']`, that `--permission-mode` is
     `acceptEdits`, that no argument grants `git add` or `git commit`, and that `--dangerously-skip-permissions` is
     absent.
   - Retitle the test so it names the behaviour in plain words: the worker grant, from the machine default and from
     the standard confined invocation, is test commands only with no git write grant. Keep the old assertions.
3. Add one line under `## [Unreleased]` in `CHANGELOG.md`: a claude worker started through the standard
   `claude-cli-bwrap` invocation may now run `cargo`, `node` and `npm test` without an approval prompt. Re-read
   main's `CHANGELOG.md` right before landing, because plan 0004 also appends there.
4. Commit with a conventional message that describes the behaviour (no plan or phase ids).

## Verify

- `node --test test/runner/dispatch.test.mjs` passes.
- `npm run fgos:dev -- config check` reports no finding.
- `npm test` and `cargo test --workspace` pass.
- `git diff 65e52dee889ff14734e9aadaede457714e574cec -- core/config-standard/runner.yaml` shows only the
  `claude-cli-bwrap` args change.

Pass: all four hold.

## Rollback

Revert the phase commit. No other file depends on it.
