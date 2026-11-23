# Full trunk suites on a quiet host

lead:SUPERVISOR (claude-b7gj@fg-server2, host, main checkout), 2026-11-23 13:35 to 14:10. Main `deaedf06d` contains
p01c (`deaedf06d`), the runner recheck fix (`2b903592c`) and `280c484ab`, so this run serves acceptance criterion 5 of
this plan and AC3 of `261123-0821-runner-recheck-replays-account-view`. Every lead was idle and 21 GB of RAM was free.
There was no OOM. Logs are in `/home/vantt/projects/forgent-worktrees/`.

## Verdict

- `node scripts/git-addon.mjs`: exit 0.
- `cargo test --workspace --no-fail-fast`: exit 101, 4301 passed and 1 failed (`main-cargo-test-deaedf06d.log`).
- `npm test -- --test-concurrency=8`: exit 1. It ran 7923 tests: 7883 passed, 12 failed, 0 cancelled, with 0 EDQUOT
  (`main-npm-test-deaedf06d.log`). This is the first complete npm run today.

## Reds, classified

| Red | Since | Owner |
|---|---|---|
| cargo `head_request` `the_contract_names_exactly_the_refusal_codes_and_verbs_the_server_speaks`: the contract lists `config patch` but the server does not speak it | red at 4951cf3da, before every plan of today | run-supervisor; not these plans |
| a playbook step form becomes one activity per step...; e2e npm pack -> npm install -g -> fgos init...; every registered workflow carries a guide model; the brief a reviewer reads says its claim needs assessment.verdict...; this repository has no blocking convention violation... | all five red at 4951cf3da | not these plans |
| release workflows: publishing lives only in release.yml under the tag trigger; a release publishes only after the whole suite...; a release publishes only assets named for its tag...: `ort-static.yml` now runs `gh release` | 4e2a7f032 (ci: static ONNX Runtime), docos/ort-publish | DOCOS lane (design-lap) |
| the real entrypoint, run directly as `node scripts/run-tests.mjs` against an empty test/ dir...; ...through a symlink...; ...absolute path contains a space: the fixture copy of `scripts/` lacks `scripts/ort-static.mjs`, which `run-tests.mjs` now imports (`ERR_MODULE_NOT_FOUND`) | 7c1ae9c09 (build: fetch a pinned static ONNX Runtime) | DOCOS lane |
| concurrent dev consumers with distinct Cargo targets keep independent verified artifacts: "both real Node consumers must reach the live-artifact barrier" | the dev-host test changed in 87bebb0b7 (this plan's p01c) | this plan: check whether p01c caused it |

## Suite hygiene errors

- `test suite left temporary directories behind`: `fgos-ca-render-*`, 8 of them, from
  `test/component-authority/render.test.mjs`. That file does not import `test/helpers/process-tmp-root.mjs` first.
  Owner: component-authority (plan done); route to the doors lead or a backlog row.
- `test suite leaked unexpected files ... into .fgos store` (40 added): these are the run files of
  `head-planner-ds-at6x3xj2ng-5`, which lead:SUPERVISOR stopped during the run. This is live-system noise, not a test
  defect.

## For the two plans

- **This plan, criterion 5:** none of the reds is in this plan's footprint, except possibly the dev-consumers case.
  Settle that one, then close criterion 5.
- **261123-0821, AC3:** no red touches the runner recheck. `assignment_runner` is green on this host at `deaedf06d`;
  it was red at 637334ca6 before the fix landed.
