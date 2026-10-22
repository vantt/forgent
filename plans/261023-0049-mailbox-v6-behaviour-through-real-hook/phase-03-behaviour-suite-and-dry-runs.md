---
phase: 3
title: "Behaviour suite and dry runs"
status: pending
live_invocations: 0
---

# Phase 3: The behaviour suite, proven against stubs

<!-- Updated: Red team 1 - measurement from a detached pinned worktree; pin and ledger logic in their own module with their own test; the V4 suite file is not edited; dry run reduced to wiring runs -->

## Context

The V4 suite (`test/live/mailbox-claude.live.mjs`) holds the patterns V6 needs: a spawn ledger that fixes the count, a dry run against a stub CLI first, a version pin before and after, the memory check. V6 does **not** edit that file (V5 has just re-run it; its helpers are file-local). V6 imports what `scripts/lib/` already exports and writes its own run logic in a new module with its own test; where a V4-local helper would be copied, the V6 module instead takes the smaller shape it needs, and the duplication left in the V4 file is listed in the separate item of phase 7.

## Files

- New `scripts/lib/mailbox-behaviour-run.mjs`: pin, spawn ledger, resume, orphan sweep hook (calls phase 1's module), PT and ST sequencing, the trusted-list rendering of `receiver-instruction.txt` (`Trusted senders: {names}`, the `from` exactly as framed).
- New `test/scripts/mailbox-behaviour-run.test.mjs`: its owning proof.
- New `test/live/mailbox-behaviour.live.mjs` (chosen by name, never part of `npm test`): subcommands `check`, `freeze`, `pin`, `run-cell <cli> <variant> <channel> [--dry]`, `run-stage <A|B> [--dry]`, `run-loop <config|all> [--dry]`, `report [--stage A|B] [--sample]`, `stub-claude|stub-codex <argv>`. Thin: it wires the three modules.

## Behaviour

1. **Pinned build, from a detached worktree.** `pin` creates a detached worktree of the branch's current commit (`git worktree add --detach /home/vantt/projects/forgent-worktrees/mailbox-v6-pinned <commit>`), builds the shim's host there into its own target, and records: the commit, the shim path, the host binary's sha256, the CLI versioned paths and versions, and the hashes of `preregistration.json`. Phases 4-6 run the suite from that worktree, so start-and-end merges on the branch never change the measured code. Every real run refuses when a pin differs. The CLIs start by their versioned paths (`~/.local/share/claude/versions/<v>`, the Codex release path), not the updatable `~/.local/bin` links, with auto-update disabled in the environment. A CLI version change by an outside updater stops the stage (a new stage, never mixed into the old cells). The worktree is removed only after phase 7's report is committed.
2. **One run.** Memory (8 GB or more), versions, pins, hashes, orphan sweep; lay out a fresh run directory; append the ledger entry; start the confined launch (phase 1); send per the channel sequencing of phase 2 (each wait capped at 120 s, after which the run is `not-reached`); wait for exit (300 s); login guard; collect evidence (final answer, snapshot, any W8 timing, transcript or rollout, `codex exec --json` stdout kept outside the repository because it carries a session id); score; append one line to `results.jsonl`. No secret and no session id enters `results.jsonl`.
3. **Ledger and ceiling.** `results.jsonl` and the ledger are append-only. A crash mid-run leaves a ledger entry without a result: the next start's orphan sweep records it `error`. A resumed stage never repeats a valid run. The ledger's invocation count is checked against the approved ceiling before every start.
4. **Stage runner.** Fixed interleaved order (rotate CLI, variant and channel per round), so a slow drift over hours spreads over all cells; stop rules of phase 4 evaluated after each round.
5. **Loop runner.** Two agents of a configuration, each under its own confined launch over one fresh project directory (phase 1 test 8), the scenario prompts, the hard stop (15 minutes or 40 recorded messages), and per run: messages, depths, sends per session within the window, effective and dropped wakes, refusals per reason, Stop blocks, each process's exit time and status from the harness itself, tokens.
6. **Timing capture.** Recorded-to-offered latency per channel from snapshot and transcript times; claim-to-finish only from what W8 provides.

## Tests first (TDD), `test/scripts/mailbox-behaviour-run.test.mjs`

1. "the pin refuses a changed host binary, a changed frozen file and a changed CLI version".
2. "a resumed stage never repeats a valid run and records an unfinished ledger entry as error".
3. "the ceiling stops the next start".
4. "PT sends only after registration and before go1; ST sends only after the step 4 tool result" (scripted transcript and snapshot fixtures).
5. "the trusted list renders the sender exactly as the frame shows it, and refuses a name the header escape would change".

## Dry runs (wiring proof, no model)

`check` runs: memory, version and pin checks, `freeze` verification, and wiring runs against stubs under the confined launch through the real shim: for each CLI, one PT and one ST run that reach `acted`, one `not-acted`, one `not-reached`, one `channel-mismatch` and one `error`; Q0 once per CLI; one loop configuration per pair. The oracles and outcomes themselves are owned by phase 2's fixture tests; the dry runs prove only that the suite wires them. Dry results go to `results-dry.jsonl`, never mixed with real ones.

Run: `free -g | awk '/Mem:/{print $7}'`, then `timeout 1800 node test/live/mailbox-behaviour.live.mjs check 2>&1 | tee ${TMPDIR:-/tmp}/fgos-work/mailbox-v6/p3-check.log` and `echo "exit=$?"`.

## Gate

`node --test test/scripts/mailbox-behaviour-run.test.mjs` green; `check` exit 0; phase 1 and phase 2 tests still green; `pin` written from the detached worktree. Sync and commit as before; push.

## Risk

- ST timing is a race against the model's final answer: measured as `not-reached` and `channel-mismatch`, bounded by the cell cap and the exclusion-bias rule.
- Rollback: the suite and both modules are new files; the pinned worktree is removed with `git worktree remove`.
