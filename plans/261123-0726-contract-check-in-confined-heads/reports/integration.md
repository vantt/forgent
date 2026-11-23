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

## Unconfined run

lead:SUPERVISOR (claude-b7gj@fg-server2, host, main checkout), 2026-11-23.

- **Gate on `637334ca6`** (does not contain the runner recheck fix 2b903592c). Logs in
  `/home/vantt/projects/forgent-worktrees/`.
  - `node scripts/git-addon.mjs`: exit 0 (`host-gate-addon-637334ca6.log`).
  - `cargo test --workspace --no-fail-fast`: exit 101; 4289 passed, 2 failed (`main-cargo-test-637334ca6.log`).
    - `fgos-run-supervisor --test head_request`
      `the_contract_names_exactly_the_refusal_codes_and_verbs_the_server_speaks`: red since 4951cf3da (the contract
      lists `config patch`, the server does not).
    - `fgos-execution-engine --test assignment_runner`
      `every_git_half_refusal_of_a_mutating_unit_run_reads_as_node_stated_it` (`assignment_runner.rs:222`): expected
      `ok`, got "recomputed binding refused: agent-cli-missing (no agent CLI is installed on this machine ...)". The
      case depends on which agent CLIs the host has installed.
  - `npm test`: exit 137, no summary. The kernel OOM killer killed the run at 11:10:00 (`session.slice`), together
    with `fgos-mailbox-sync` and pipewire, so this run gives no npm verdict. The last tests in the log are
    `test/workflow/workflow-store-ledger.test.mjs` ("Promise resolution is still pending"), which is a side effect of
    the kill. No test worktree registration leaked (`git worktree prune --dry-run` was empty).
- **Restage at HEAD `a219a04ba`** (contains 2b903592c): `node scripts/git-addon.mjs`, exit 0 (`host-addon-a219a04ba.log`).
- **`node scripts/plan-contract-check.mjs --plan plans/261123-0726-contract-check-in-confined-heads`** on the fresh addon:
  exit 1 (`host-pcc-a219a04ba.log`). The addon is reused and the check reads the plan. It fails on this plan's own
  phase rows: the statuses of phases 2 and 3 carry free text, but must be one of draft, ready, running, done or
  withdrawn. Move the prose to the phase notes.
- **Not run:** no second full npm run. The host has 30 GB RAM and four leads plus builds, and has had OOM kills at
  09:17, 09:25 to 09:31 and 11:10. A full npm run needs the lead count lowered first, which is an owner decision.

## Confined run 3 (11:16, trunk 9d9997f7a, addon restaged at a219a04ba)

Lead `head:lead-forgent-261123-0726-contra-e554b`, `FGOS_CONFINED=1`, no FGOS_* env set by hand.

- The plan's phase status cells now hold only the allowed words (1 done, 3 done, 2 running); the prose moved to the
  plan's Progress section.
- `node scripts/plan-contract-check.mjs --plan plans/261123-0726-contract-check-in-confined-heads`: **exit 0**,
  `ok 261123-0726-contract-check-in-confined-heads`. The staged addon was reused with no cargo run. Acceptance
  criterion 3 is met.
- `node scripts/check-backlog-reconciliation.mjs`: exit 1, `FAIL: 279 problem(s) reconciling 311 proposed PBI rows`.
  278 are "proposed under plans/backlog but has no section in RECONCILIATION.md" (the unreconciled items the owner kept
  red on q-tvhmli3fns; 277 when measured, one proposed row added since). The other is `tsk-p7-shadow-binders:
  reconciled in RECONCILIATION.md but item p-kqoljdbtbf has status "done"`: the id now resolves through its Original
  id and is named as no longer proposed, not unknown. This matches phase 3's Verify and acceptance criterion 4's
  second sentence.
- `test/scripts/doc-health.test.mjs` passed inside the phase 1 land gate (ticket c-12066-1795405917947).

## Classification of the reds (acceptance criterion 5)

- `head_request` `the_contract_names_exactly_the_refusal_codes_and_verbs_the_server_speaks`: outside this plan's
  footprint (Rust run-supervisor contract); red since 4951cf3da, before this plan's lands. Pre-existing.
- `assignment_runner` `every_git_half_refusal_of_a_mutating_unit_run_reads_as_node_stated_it`: outside the footprint;
  fails on `agent-cli-missing`, which depends on the host's installed agent CLIs. Host-dependent, not caused by
  this plan (this plan changed no Rust).
- `npm test`: no verdict (OOM kill at 11:10). Not classifiable until a run completes.

## Still open for phase 2

1. One complete `npm test` run on the trunk. Needs host memory headroom (fewer leads), an owner decision per the
   supervisor.
2. The gate restore: `node scripts/plan-contract-check.mjs {plans}` is still absent from `land.gates`; it belongs to
   heads-stable phase 3.

## Gate hand-off and remaining wait (12:55)

- Gate restore: on main as 0dd71aa83. `land.gates` runs `node scripts/plan-contract-check.mjs {plans}` when a landed
  path matches `plans/*/plan.md` or `plans/*/phase-*.md`. Step 3 is done.
- Full trunk `npm test` (acceptance criterion 5): still no verdict. No run was in progress at 12:55 and the newest log
  is `main-npm-test-637334ca6.log` (11:10, OOM-killed). The run is with lead:SUPERVISOR and needs host memory headroom.
  Phase 2 closes when that run is green or every red in it is classified.

## Restored gate refused every plan land; fix branch ready (13:10)

- After 0dd71aa83, the gate `node scripts/plan-contract-check.mjs {plans}` failed five plan lands across four plans
  with `git-addon-unavailable: addon not shipped on this channel` (logs `.fgos/runtime/land/land-*-1.log`, 12:5x).
- Cause, reproduced from this head: the land door runs gates with the activated release's environment. With the
  release's `FGOS_ACTIVE_MANIFEST_PATH` set, `ensureAddonForScript` returned early (a check that predates phase 1),
  and the native door refused that release because its `legacyNode.root` is not this checkout's payload. With only
  `FGOS_HOST_BIN` set, the check printed `ok`.
- Fix, branch `contract-check-in-confined-heads/p01c` (worktree
  `/home/vantt/projects/forgent-worktrees/261123-0726-contract-check-in-confined-heads-p01c`, brief
  `briefs/phase-01-fix-5-inherited-manifest.txt`): `ensureAddonForScript` skips only when the inherited manifest's
  `legacyNode.root`, resolved against `FGOS_ACTIVE_RELEASE_PATH`, is this checkout. Otherwise it goes through the
  reuse-or-build door, which re-points the env trio at the checkout's staged addon. The owning test gained a foreign-release
  case (reuse, no cargo) and a serving-manifest case (left untouched). Reviewed by the lead.
- lead:SUPERVISOR held the gate again (6d0f6b92c) meanwhile.
- Land attempts: c-19449-1795413408277 failed because rustc was OOM-killed in the regenerate step (12:57).
  c-20406-1795413885096 failed because the `native-addon` test file process was OOM-killed at 13:08:02 (no subtest
  failed; the other 163 gate tests passed). Host memory: about 8 GB available of 30 GB.

## Still open for phase 2

1. Land p01c when the host has memory headroom, then lift the gate hold (lead:SUPERVISOR's config, not this plan's
   footprint) and confirm the next plan land passes the gate.
2. One complete trunk `npm test` verdict (lead:SUPERVISOR; needs fewer concurrent leads).

## Gate fix landed (13:3x, deaedf06d)

- Land c-22106-1795415214366 (memory free) failed on one real red: "development host carries and loads the addon from
  its per-invocation manifest" hit ERR_MODULE_NOT_FOUND for `scripts/ort-static.mjs`. Main commit 7c1ae9c09 made
  `run-rust-dev-host.mjs` and `git-addon-stage.mjs` import it, but the test fixture's copy list never got it. Fix unit
  (brief `briefs/phase-01-fix-6-dev-host-fixture.txt`): the file is copied, and one local helper seeds a verified ort
  cache in both fixtures that need it, so no test downloads the archive.
- Land c-23512-1795415523790: done, main deaedf06d, gates and `test/distribution/native-addon.test.mjs` green; worktree
  removed.
- Check from this head with the activated release's environment (`FGOS_ACTIVE_MANIFEST_PATH`, `FGOS_HOST_BIN`,
  `FGOS_ACTIVE_RELEASE_PATH` of release df57ddfc…): the script no longer trusts the foreign manifest. It goes to the
  reuse-or-build door, finds the staged addon stale (digest c499fd3b… vs current 6a39480c…, Rust changed after the
  a219a04ba restage), and in confinement stops with the named error. In the unconfined land door the same path rebuilds.
- The gate hold (6d0f6b92c) is lead:SUPERVISOR's to lift. The next plan land after the lift proves the gate.

## Still open for phase 2

1. lead:SUPERVISOR lifts the gate hold, and a plan land passes the gate.
2. lead:SUPERVISOR's full `cargo test --workspace` and `npm test` on deaedf06d or later (acceptance criterion 5).

## Criterion 5 closed (14:0x)

lead:SUPERVISOR's full suites at deaedf06d (`reports/npm-test-full.md`): cargo 4301 passed, 1 red (`head_request`,
pre-existing since 4951cf3da); npm 7923 tests, 12 red, each classified there outside this plan, except one left to this
lead.

That one, "concurrent dev consumers with distinct Cargo targets keep independent verified artifacts"
(`test/rust-host/dev-host.test.mjs:169`), is not caused by this plan:

| run | contains 7c1ae9c09 | "dev door propagates Cargo failure ..." | "concurrent dev consumers ..." |
|---|---|---|---|
| `main-npm-test-4c5f55541-r2.log` | no | pass, 0.76 s | pass, 5.7 s |
| `main-npm-test-deaedf06d.log` | yes | pass, 11.8 s | fail at 24.7 s, "both real Node consumers must reach the live-artifact barrier" |

7c1ae9c09 added `ensureOrtStatic(checkoutRoot)` to `scripts/run-rust-dev-host.mjs:134`, before cargo. The dev-host
fixture is a fresh checkout with no ort cache, so each consumer downloads the 120 MB archive first. The single-consumer
test slows from 0.8 s to 11.8 s. The two concurrent consumers miss the test's 20 s barrier. 87bebb0b7 (p01c) changed only
`test/distribution/native-addon.test.mjs`, and p01c's leaf change sits in `ensureAddonForScript`, which
`run-rust-dev-host.mjs` does not call (it imports only `gitAddonDirectory`). Owner: the ort-static change (7c1ae9c09,
DOCOS lane). Likely fix there: seed a verified ort cache in the dev-host fixture, as 87bebb0b7 did for the native-addon
fixtures. Outside this plan's footprint.

Every red is classified, none is caused by this plan, so acceptance criterion 5 is closed. Phase 2 Verify: every red
classified (this section and `npm-test-full.md`), confined check exit 0 (Confined run 3), gate hand-off recorded
(restore 0dd71aa83, held 6d0f6b92c until a release carries p01c, then lead:SUPERVISOR restores it).
