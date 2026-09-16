# Handoff - Fast Fixture Expansion

Recommended next track: `test-suite-feedback-cost-fast-fixture-expansion`

Capability: `code:refactor`

Source packet: P07 candidate `p06-fast-fixture-expansion`

## Objective

Expand the P06 fast fixture strategy to the next bounded CLI fixture-construction
cluster without changing production behavior or the global `tmpCwd()` default.

## First Hotspot

Edit only these files unless the new track's own audit rejects one before
mutation:

- `test/cli/fgos-claim.test.mjs`
- `test/cli/fgos-claim-2.test.mjs`
- `test/cli/fgos-read-5.test.mjs`
- `test/cli/fgos-return-2.test.mjs`
- `test/cli/fgos-iron-law-gate.test.mjs`
- `test/cli/fgos-move.test.mjs`
- `test/cli/fgos-approve-5.test.mjs`
- `test/cli/fgos-return-3.test.mjs`
- `test/cli/fgos-return-4.test.mjs`

P07 counted 128 residual static `fgos init` fixture-construction sites in these
files. Treat that as scope orientation, not a measured saving.

## Preserved Doors

Keep subprocess-backed coverage for:

- raw `fgos init` process-boundary tests;
- setup/init idempotence, coexistence output, and startup messages;
- pre-init refusal tests;
- subdir cwd-resolution tests;
- Git transport and merge doors: `take`, `pick`, `return`, `approve`, `merge
  next`, `sync-root`, GitHub, rollback, conflict, lock, and durable-write cases.

## Allowed Implementation Shape

Use the committed P06 helpers (`tmpCwdFast`, `initGitCwdFast`,
`initGitCwdMainFast`, `initHeadlessGitCwdFast`) by explicit opt-in at call sites
that only need initialized fixture state. Add a fast subdir helper only when the
test does not prove subdir init or cwd-resolution behavior.

Do not change `tmpCwd()` globally. Do not replace process-contract or
git/process-integration assertions with direct state setup.

## Required Baseline And Proof

Before mutation:

```sh
cargo build --release --workspace
npm ci
/usr/bin/time -f 'TIME real=%e user=%U sys=%S' node --test \
  test/cli/fgos-claim.test.mjs \
  test/cli/fgos-claim-2.test.mjs \
  test/cli/fgos-read-5.test.mjs \
  test/cli/fgos-return-2.test.mjs \
  test/cli/fgos-iron-law-gate.test.mjs \
  test/cli/fgos-move.test.mjs \
  test/cli/fgos-approve-5.test.mjs \
  test/cli/fgos-return-3.test.mjs \
  test/cli/fgos-return-4.test.mjs
```

After mutation, run the same focused command, then:

```sh
npm test
git diff --check
```

Run GitNexus `detect_changes` when `.gitnexus/run.cjs` is available. If it is
missing, record the exact failure and perform a manual scoped diff audit.

## Acceptance

The report must show before/after focused timing, which `fgos init` sites were
removed, which were intentionally retained, and one final green full-suite run.
Any file whose setup proves a retained door should stay subprocess-backed.

## Rollback

Revert only the opt-in helper substitutions in this batch. Keep the already
landed P06 helpers unless the new evidence disproves their existing three-file
use.
