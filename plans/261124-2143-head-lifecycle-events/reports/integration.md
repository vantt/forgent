# Integration report: head-lifecycle-events, phase 6

## Tree

- Gates ran on main `4780cdb2e`, which contains the four phase lands: `2b18815f1`, `0463c0385`, `8eeb37fef`, `8afaaba50`.
- They were run on 2026-11-26 by the unconfined supervisor session; evidence: [lead-supervisor-gates-261126-1340.md](lead-supervisor-gates-261126-1340.md).
- An earlier confined unit run (ticket `c-20573`) could not run the gates: its sandbox was read-only outside the worktree.

## Gates

| Gate | Exit | Result |
|---|---|---|
| `npm test` | 1 | 6621 tests, 6575 pass, 19 fail, 27 skipped |
| `cargo test --workspace --no-fail-fast` | 101 | 4502 pass, 3 fail |

## Failing files and attribution

Attribution is the supervisor report's; see [lead-supervisor-gates-261126-1340.md](lead-supervisor-gates-261126-1340.md) for detail.

cargo (3):
- `component-authority` `model_checks`: `head-permissions.v1.json` has no row (failed the day before too).
- `apps/fgos/tests/cli_tests.rs` host-interrupt test: fails only in the full run, passes alone (load-sensitive).
- `packages/mailbox/rust/core/tests/frame.rs` frame-contract placeholders: belongs to plan 261125-2313 phase 5.

npm (19):
- `test/run-supervisor/terminal-cutover.test.mjs` (8), `test/runner/provider-per-cli-credential-sources.test.mjs` (3), `test/workflow/guide-schema.test.mjs` (2), `test/install-packaging.test.mjs` (1), `test/scripts/convention-conformance.test.mjs` (1), `test/git/one-door.test.mjs`.
- `test/scripts/check-decision-citation-drift.test.mjs` (3 findings): two backlog rows cited D-local ids; fixed in `b79b357e2`.

## Conclusion

No failing file is in this plan's footprint, so acceptance 7 is met in the sense that this plan adds no failure. Main itself is not green: both full gates exit non-zero, for the reasons above, owned elsewhere.

## Open

- Step 2 (live lead-ended check with a throwaway lead) is still open; the supervisor runs it once the watcher tick is free (the last attempt got `skipped-busy`).
- Step 3 (CHANGELOG line) is parked while plan 261125-1631-agent-context-engine holds `CHANGELOG.md`.
- Step 4 is done: `p-iatzcg2gee`, `p-6hqvgokerb`, `p-tyowvhthul` and `p-pv7ha3l5ss` are `done` in `plans/backlog/` and `plans/backlog.md`, each with a closing note naming its owning proof.

## Step 2 live check (run by lead:SUPERVISOR, 2026-11-26 12:53-13:55)

Result as run: the throwaway lead `head:lead-forgent-261125-2315-head-mail`, agent SIGTERM'd at 12:53, raised
`session-gone` (`de22318f1204ac5c`) and `head-gone` (`e1291fc9a0de19b9`) and no `lead-ended` in about 60 minutes
(`reports/lead-supervisor-gates-261126-1340.md`, section "Step 2 live check").

Reading: the check ran the old code, so it neither proves nor disproves acceptance 2 and 3.

- The killed agent's attempt was closed by its run supervisor: `.fgos/assignments/head-lead-forgent-261125-2315-head-mail-1/runs/01/closed.json`
  (`at` 2026-11-26T05:54:19Z, `closedBy: supervisor`), and the placement has no `retiredAt`. That is exactly the case
  phase 2 projects as `ended`; the criterion names it, and a SIGTERM of the agent does reach it.
- The watcher timer runs the activated release (`.fgos/installation/activation.json`: artifact
  `sha256:33f462be…`, activated 2026-11-25T11:42Z), which predates phase 2 (`0463c0385`, 2026-11-26). Its
  `core/watcher/definitions/lead-ended.query.json` still reads `fgos.head.state eq retired`, and its
  `session-gone.query.json` has no `ended` case. The observed pair (gone events, no `lead-ended`) is the pre-plan
  behaviour, and with phase 2 the same lead would project `ended`, raise `lead-ended`, and not raise `session-gone`.

Rerun on the new release (lead:SUPERVISOR, 2026-11-26 14:19-14:23): release built from main `6c574f762`
(artifact `sha256:daaf4d836c96…`, `fgctl verify` ok) activated at 14:19; throwaway lead generation 2 started 14:20:41,
its agent SIGTERM'd 14:21:18; the attempt held `closed.json` with no `retiredAt`, and the timer's watcher tick raised
**`lead-ended` (event `3545235acd502d84`) at 14:21**. Step 2 holds live: acceptance 2 and 3 are shown on the running
system. Details in `reports/lead-supervisor-gates-261126-1340.md`, last section.
