# Live cargo probe for the claude worker grant (phase 2)

Date: 2026-11-25. Run by the manual supervisor, which also held `lead:SUPERVISOR`, under the owner's answer to
`q-nii67wdhv3` (option: an unconfined supervisor session stages the release and runs the suites and the probe).

## Verdict

Pass. A confined claude worker ran `cargo --version` through the standard `claude-cli-bwrap` invocation with no
permission refusal and no approval wait. Phase 1's grant works on a real worker.

## Release

Built from main at `e40252044` (contains phase 1, `29dd50475`), staged and activated with `fgctl stage` and
`fgctl upgrade --from /tmp/fgos-release-2320-e492a2125`. Activated artifact:
`sha256:efa4694e9bc4d29cef871213d65a0715e74a5314b39faaf9fb252c3e5a9fb149` (previous
`sha256:a34524b35042d6e4e586dedadca0f1809ee28f83d7cce3e286e95d403ce316ea`). `fgctl verify` printed
`verified efa4694e9bc4`. `fgctl upgrade` ended "not ready" on three doctor items that predate this release:
`tool-registry-configured` (1 of 2 tools present), `work-step-vocabulary` (item tsk-5db at step `clarify`),
`provider-capacity-state` (quota quarantine on three accounts).

## Suites

- `cargo test --workspace`: 4390 passed, 0 failed.
- `npm test`: 8 failures, all in files phase 1 did not touch. Two of them (`test/git/one-door.test.mjs`,
  `test/workflow/case-close.test.mjs`) passed on a rerun through `scripts/run-tests.mjs`; they failed because live
  heads wrote into `.fgos` during the run. Six remain: `test/install-packaging.test.mjs` (npm pack e2e, `EISDIR`),
  `test/run-supervisor/terminal-groups.test.mjs` (brief title separator), `test/scripts/convention-conformance.test.mjs`
  (240 old violations, 1 new), `test/state/domain-registry-compiled.test.mjs`, and two in
  `test/workflow/guide-schema.test.mjs`. None of those files reads `core/config-standard/runner.yaml`, `CHANGELOG.md`
  or `claude-cli-bwrap`, the three files phase 1 changed. They were not checked on the tree before phase 1, so
  "not caused by phase 1" rests on that reading, not on a baseline run.

## Probe

Command, from the linked worktree `forgent-worktrees/probe-2320`:
`fgos run "Run the shell command 'cargo --version' with the Bash tool and reply with its exact output." --provider claude --capability execute --json`

Fields read from `data.results[-1].runResult` and the unit record:
- outcome `pass`, 1 round, seat outcome `pass`, exit code 0, not timed out.
- invocation `claude-cli-bwrap` (in `unit.json`), `confinement: bwrap`, adapter `herdr-spawn`, executor `claude`.
- granted tools in the unit record include `Bash(cargo:*)`, `Bash(node:*)`, `Bash(npm test:*)`.
- `agentClaim.summary`: `cargo --version output: cargo 1.99.0 (5f94df478 2026-08-27)`.
- no refusal and no approval wait in the record.

## Note for the heads plan

The mail that said a fresh release from main unblocks `fgos can-i` for plan 0004 does not hold: the new release answers
`unknown verb "can-i"`. That verb is not on main; it comes with phase 2 of plan `261124-0004-heads-operate-without-owner`,
which is not landed.
