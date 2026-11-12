# HARDEN lead report: ci npm-clean-runner

Goal: `suite / test (ubuntu-latest)` green on a clean runner except the two known reds. Main CI run 43217491748 had 11 failures. PR CI run 43241559567 (draft PR 10) shows only the two known reds.

## Method

Every failure was checked on origin/main (the worktree started at its tip). Each was reproduced in a clean-runner-like environment: empty HOME, XDG_*, TMPDIR and CARGO target outside the repo, and a PATH without rg, herdr, agy, codex, omp and claude. Findings were grouped by cause. No production code changed.

## Table

| Test | Cause | Fix | File |
|---|---|---|---|
| the plugin skills no longer call herdr pane rename or close | `rg` is not on the runner; the test shelled out to it | walk the skills directory in Node, assert no hits | test/plugins/terminal-skill-attach.test.mjs |
| dispatch policy agrees with resolveExecutorConfig (codex-cli shape) | fixture stubbed claude, pi, glm but not codex; seat binding refused it as not installed | add `codex` to the stub CLIs the file seeds | test/runner/dispatch-plan-policy.test.mjs |
| agy sub-HOME that does not list the project | no `agy` on PATH, so the check reports skipped and passes | add `agy` to the stub CLIs | test/setup/agent-cli-trust-check.test.mjs |
| agy sub-HOME with no settings.json | same | same | test/setup/agent-cli-trust-check.test.mjs |
| Work dispatch: rigor high recorded as the demand | no `claude` on PATH, seat binding failed with agent-cli-missing | seed a `claude` stub (Work-layer test, fixture only) | test/state/work-size-rigor.test.mjs |
| Work dispatch: no rigor, size heavy | same | same | test/state/work-size-rigor.test.mjs |
| real mutant m-edit-1 in a detached worktree | its baseline related run is `work-size-rigor.test.mjs` from HEAD, which failed on the missing `claude`, so only 1 of 2 runs happened | fixed by the row above | test/state/work-size-rigor.test.mjs |
| a Unit run that cannot be removed leaves the ledger | outcome of a failed `rmSync` depends on the filesystem's directory order; on the CI filesystem nothing was lost and the retry removed the whole case | make the run directory read-only (deterministic failure), delete `unit.json` to stage the partial loss, assert exactly `unit-record-missing` | test/workflow/case-close.test.mjs |
| R5 Node-against-Node (coverage-isolated-write-init-then-add) | both `init` runs (fresh HOME, so the git floor probe runs afresh: dozens of sandboxed git runs) hit the 15 s per-case bound under the suite's concurrency 8 on the runner; exit null, TIMEOUT. Not reproducible locally at 24 cores or pinned to 4 | the two steps get a 90 s bound; a failed step reports exit, signal, duration and stderr | test/rust-host/harness.mjs |
| mailbox-live-confined: ending a confined run leaves no process (flake) | fixed `sleep(300)` before asserting the sandbox processes exist | `waitFor` with the file's 15 s loaded bound; assertion unchanged. 9 of 9 alone runs passed before the change, so it was not reproduced | test/scripts/mailbox-live-confined.test.mjs |

## Known reds, not changed

### V7n addendum (`test/scripts/mailbox-behaviour-v7n.test.mjs`)

- What: a mailbox experiment frozen 2026-10-30 (5fea0938d) to measure whether a receiver given instruction version 3 acts on Claude Code's socket-frame wake. `test/live/mailbox-behaviour.v7n-addendum.json` pins hashes of the measurement modules and, in `overrides`, of the product contracts `packages/mailbox/contracts/frame.v1.txt` and `limits.v1.json`.
- Why red: the test fails on `overrides` only. Those two product contracts moved after the last refresh (2026-11-07, 0a6816281): `limits.v1.json` in 340c86f9a, 54f883f07 and ded0fdd1a (body in ref, 11-08), and both files in 4afb59c and 806fb36c6 (acknowledgement, 11-09).
- Broken, not deliberately red. Precedent: 3bbbd315f ("follow the product contracts in the V7n freeze") and 0a6816281 refreshed hashes when product contracts moved, while the measurement modules stay frozen.
- Owner: the mailbox lane.
- Smallest honest resolution: refresh the two `overrides` hashes. That re-attests the freeze against the new frame, so the owner decides.

### Citation drift (`test/scripts/check-decision-citation-drift.test.mjs`)

- What: the checker requires every cited ID to carry a one-line gloss, `<ID> (<gloss>)`.
- Why red: `docs/platform/documentation/subcomponents/document-identity/spec.md` (documentation lane, 3a04159b6 and 489216762, 2026-11-12) cites ADR0035 (line 52), ADR0055 (206) and RUL84 (207, and twice on 550) with no gloss. The checked-in baseline does not cover these 5 findings.
- Resolution: add the glosses. Owner: the documentation lane.

## Authority

None found.

## Lessons

- A clean-runner environment needs more than empty directories: a PATH built without the dev CLIs found the stub-CLI and `rg` causes at once.
- Local green hides filesystem-order dependence; running a test on a second filesystem (ext4 versus tmpfs) shows it.
- Failure messages that omit exit code, signal and stderr cost a whole CI cycle (about 25 min each); the harness now reports them.
- A test that waits on a sandbox with a fixed sleep will flake on a loaded runner; use the file's bounded wait.
