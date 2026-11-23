# Phase 2 integration (partial): confined check now fails by name; fresh-addon proof and full gate wait on an unconfined session

Date: 2026-11-23 10:56 (Asia/Saigon). Trunk: 6d65d3e41 (phase 1 = 577e48efe, phase 3 = 5eeb2d60a). Lead
`head:lead-forgent-261123-0726-contra-e554b`, a confined head (`FGOS_CONFINED=1`, no FGOS_* env set by hand).

## Step 1: full gate (not run)

`npm test` and `cargo test --workspace` cannot run from this confined head (`target/` read-only) and unit workers
are refused node commands ("This command requires approval", three units on 2026-11-23). Needs an unconfined run.
Partial evidence: the phase 1 land (ticket c-12066-1795405917947) ran the configured gates green, including
`node scripts/run-tests.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs test/scripts/doc-health.test.mjs
test/scripts/check-decision-citation-drift.test.mjs test/scripts/mailbox-behaviour-v7n.test.mjs test/rust-host/command-routes.test.mjs
test/cli/fgos-manifest.test.mjs test/distribution/native-addon.test.mjs`, the one-door scan and the selector check.

## Step 2: confined check

Precondition not met: the main checkout's staged addon `.fgos/runtime/git-addon/e9756c489113b5d0` is stale (staged
02:34, `source-digest` 4b1507af… vs current `gitAddonSourceDigest()` 5ae11e2f…), so reuse correctly declines.

`node scripts/plan-contract-check.mjs --plan plans/261123-0726-contract-check-in-confined-heads`: exit 1, the new named
cause instead of a cargo stack trace:

```
ENOENT: no such file or directory, mkdir '/home/vantt/projects/forgent/target/ort-static/1.31.1'
file:///home/vantt/projects/forgent/scripts/lib/git-addon-stage.mjs:175
      throw new Error(
            ^

Error: The staged addon for this checkout is missing or stale: /home/vantt/projects/forgent/.fgos/runtime/git-addon/e9756c489113b5d0. Restage it from an unconfined session with node scripts/git-addon.mjs.
```

`node scripts/check-backlog-reconciliation.mjs`: exit 1 with the same named cause (it loads the addon first).

To finish: from an unconfined session run `node scripts/git-addon.mjs` in /home/vantt/projects/forgent, then rerun
both commands from a confined head and expect exit 0 for the plan check (acceptance criterion 3).

## Step 3: gate hand-off

`node scripts/plan-contract-check.mjs {plans}` is NOT back in `land.gates` (HEAD `.fgos/config.yaml`, last config
commit 132b52f92). Phase 1 has landed (577e48efe), so the supervisor's hand-off of the gate restore to the
heads-stable lead (`plans/261122-0118-heads-stable-and-able` phase 3) is now due. Raised to the supervisor with this
report's path.

## Step 4: backlog checks

`test/scripts/doc-health.test.mjs` passed inside the phase 1 land gate above. `check-backlog-reconciliation.mjs`
output against phase 3's Verify waits on the same restage (step 2).

## Confined run 2 (11:08, trunk e11e047c8)

The supervisor restaged the addon at 10:59:56 on 637334ca6. Before this run, the runner-recheck plan landed Rust
changes (2b903592c, with 4f5030dad, 7d3b31a03, 9447e2cd7 and others), so the staged `source-digest` (5ae11e2f…) no
longer equals `gitAddonSourceDigest()` (c499fd3b…). Both scripts, run from this confined head with no FGOS_* env set,
again declined reuse and stopped with the named cause, this time after cargo's `Read-only file system (os error 30)`:

- `node scripts/plan-contract-check.mjs --plan plans/261123-0726-contract-check-in-confined-heads`: exit 1, "The staged
  addon for this checkout is missing or stale: …/.fgos/runtime/git-addon/e9756c489113b5d0. Restage it from an
  unconfined session with node scripts/git-addon.mjs."
- `node scripts/check-backlog-reconciliation.mjs`: exit 1, same cause.

So the stale path behaves as specified for both triggers (cargo's os error 30, and the ort-static step). The exit-0 proof
for acceptance criterion 3 needs a staged addon matching the tip at the moment of the run. The supervisor's `npm test` run
restages through `scripts/run-tests.mjs`; the lead reruns both scripts right after it, before another Rust land.

Gate hand-off: still not in `land.gates` at e11e047c8 (`plan-contract-check` absent from `.fgos/config.yaml`).
