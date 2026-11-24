# Phase 2: Release and live cargo probe

Capability: `code:test`.

Proves the grant on a real worker. This runs only after phase 1 is on main, a release made from that tree is staged
and activated, and that release is the one plain `fgos` runs.

## Who runs it

The release step (make, stage, activate) is done by the **owner** or by the **unconfined supervisor session**. A
confined head or worker cannot stage or activate a release. Until plan 0004's release rule lands, use the existing
path in AGENTS.md (the "Legacy-Node CLI Ownership Boundary" section: stage and activate the intended tree, then
verify doctor through the installed shim) and `docs/how-to/install-fgos-in-a-project-and-use-doctor.md`
(`fgctl stage`, activation). The probe itself can run from any session that can call `fgos run`.

## Inputs

- Phase 1's commit on main.
- `docs/how-to/install-fgos-in-a-project-and-use-doctor.md`: release staging and activation.
- `plans/261124-0004-heads-operate-without-owner/plan.md`: the consumer that needs this grant.

## Footprint

- `plans/261124-2320-claude-worker-allowed-tools/reports/live-cargo-probe.md`

## Steps

1. Stage and activate a release from main at or after phase 1's commit. Run `fgos doctor` through the installed shim
   and confirm the activation is the new release.
2. From a linked worktree of this repository (create one with `fgos worktree` if none is free), run
   `fgos run "Run the shell command 'cargo --version' with the Bash tool and reply with its exact output." --provider claude --capability execute --json`.
3. Read `data.results[-1].runResult`. Confirm that the invocation is `claude-cli-bwrap`, that `agentClaim.summary`
   holds a `cargo <version>` line, and that there is no permission refusal or approval wait.
4. Write the command, the result fields read and the verdict to the report file. Land it with
   `fgos land --paths plans/261124-2320-claude-worker-allowed-tools/reports/live-cargo-probe.md`.

## Verify

The report shows the `claude-cli-bwrap` invocation and the `cargo --version` output, with no refusal. Pass: those
three facts are in the report.

## Rollback

Nothing to undo; the phase writes only a report. If the probe fails, record the failure in the report and send it to
the supervisor. Do not change the standard here.
