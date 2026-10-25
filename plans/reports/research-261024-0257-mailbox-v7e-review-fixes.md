---
title: "Mailbox V7e review fixes"
description: "Fixes for the independent V7e review (plans/261023-1411-mailbox-v7-codex-postooluse-pi-omp-and-aliases/reports/code-review-v7e.md): omp heads reach Identity, a controller-mark oracle gate, pi's head check by command name, the conclusions restated, the owner's login store never opened in place, and the low findings. No model run."
date: 2026-10-24
---

# Mailbox V7e review fixes

Branch `mailbox/v1-v3`. Each decision is the plan owner's (agent), recorded in spec §17. No model run was needed. Scratch is on ext4 under `~/projects/forgent-worktrees/mailbox-evidence/v7e/`.

## Per item

**H1: omp heads never reached Identity.**
- **Cause.** `identity_key` (`apps/fgos/src/wiring/mailbox_identity.rs`) looked for an identity variable that Identity names `omp`. pi and omp share `PI_SESSION_ID`, which Identity names with the neutral `pi`, so every omp head ended `ident:no-session-variable`.
- **Fix.** An omp head's key now comes from `PI_SESSION_ID`, the pi family's variable. Identity labels the head `omp` from its ancestry, through the `HeadRef` the hook already passes.
- **Proof** (`apps/fgos/tests/mailbox_routes.rs`, `a_pi_or_omp_head_registers_with_identity_under_its_own_cli_and_is_reached_by_handle_and_by_role`):
  - The heads are live: a real `node` process titled `pi`, and a binary named `omp`.
  - Each head's extension call registers it with Identity under a `pi-…` or `omp-…` handle.
  - A send by that handle reaches the head, and so does a send by a role the head takes through Identity's door.
  - The test failed on omp before the fix, with outcome `ident:no-session-variable`. The mutant that removes the mapping is killed.
- **Unit test.** The omp test in the wiring module now binds the head under the CLI `omp`, as the adapter does.
- **Report.** The V7e report now says the 105 measured omp runs were not addressable by handle or role. The 105 pi runs were not registered either: the sandbox home holds no machine id. Delivery by mailbox name was unaffected.

**H2: the oracle gate was marked by script.**
- **Record.** The V7e report and spec §14 record the breach:
  - I marked the sample by script (the two files are 3 ms apart);
  - stage B started 7 s later;
  - the old gate only counted marks.
- **Controller mark.** The reviewer's delegate re-mark is attached as the controller mark: `sample-v7e-A.controller.json` in the V7e run home, 66 of 66 agree, with the 210-of-210 note and its source. The new gate holds on it.
- **New gate** (`scripts/lib/mailbox-behaviour-v7.mjs` `oracleProblem`, shared by V7c and V7e):
  - The harness draws the sample, writing `Drawn-by: <operator session>` and `Drawn-at`, and never marks it.
  - The controller writes `<sample>.controller.json`: `{markedBy, markedAt, marks: {<runId>: agree|disagree}}`.
  - Stage B refuses unless that file exists, names a marker other than the harness and the sample's drawer, marks every sampled run, and has at most one disagree.
  - Marks typed into the sample itself no longer count.
- **Sample text.** It now renders `Claimed:` only for a run that records it (V7c's arm P), so V7e samples no longer show `Claimed: undefined`.
- **Proof.** `test/scripts/mailbox-behaviour-v7.test.mjs`, rewritten. Mutants killed: the drawer check dropped, the harness check dropped, the mark file not required, the disagree bound loosened.

**M1: pi's head check.**
- `adapters.v1.json` `hookFacts.pi` gains `headComm: "pi"`.
- The direct head check reads the parent's command name through `fgos_process::facts::command_name_of`, the same source Identity's `pi_family_cli` uses, and requires it where the contract names one. A pi head therefore needs both the `node` executable and the name `pi`.
- **Proof** (`store/tests/head_finder.rs`):
  - `node` named `node`, `npm` or nothing is refused;
  - `pi` on another executable is refused;
  - the real pi shape is accepted.
- `fixtures_contract.rs` pins the rule.
- The route test's pi head is a real Node process titled `pi`.
- The mutant that drops the name check is killed.
- The `argv[1]`-under-install alternative was not added: the name rule is Identity's, so one authority decides "is this pi".

**M2: conclusions.** The V7e report, spec §7.6 and §14, and the CHANGELOG now say only what the data shows:
- LR is 0 under every CLI and carrier: a floor, at which no carrier effect can be shown or excluded.
- With one model and one instruction, model and instruction cannot be told apart. The declines restate the instruction's condition.
- pi 2/10 against omp 5/10 is no detectable difference (Fisher exact two-sided p = 0.35).
- The trusted-folder path is unmeasured, and doctor checks the file, not the trust.
- The `tool` role was recorded through the openai-codex Responses converter only. `measuredOn.provider` names it in the contract, and the loader accepts the field.
- The phase 7 report's "provider-neutral" now says the same.

**M3: the owner's `agent.db-shm` was touched.**
- **Cause.** `readAccountCredential` opened the owner's omp `agent.db` read-only, in place, before every run, and that wrote its `-shm` index.
- **Measured incident.** A 5 ms touch on the last run. The database and the WAL were untouched. This is recorded in the V7e and phase 7 reports.
- **Fix.**
  - The store is never opened in place.
  - `agent.db`, and a `-wal` when one exists, are copied with a plain file copy into a fresh 0700 directory under the caller's scratch (the run home's `login-read/`, on ext4).
  - The copy is read, and the directory removed.
- **Proof** (`test/scripts/mailbox-live-confined.test.mjs`):
  - With the owner's store open in WAL mode, and again at rest, every file of the store directory keeps its name, inode, mtime and bytes.
  - The WAL's rows are read.
  - The copy is removed.
  - The falsifier: an in-place read-only open at rest creates the owner's `-wal` and `-shm`.
  - Mutants killed: an in-place open, and the WAL not copied.

**Lows.**
- **L1: surviving mutants.** All three are killed now (`test/setup/agent-hooks.test.mjs`):
  - shim owner check: a stubbed `process.getuid` makes the user's own shim foreign;
  - inert for any `FGOS_SESSION_ID`: a launcher's non-`att-` id is still served;
  - hook timeout removed: a hanging shim holds the handler for the hook timeout (10 s here) and the real output passes unchanged.
- **L2: `drain.rs` guard.** The unreachable `delivers && shape.is_none()` guard is removed. `store/tests/adapters.rs` now holds every delivering channel of a tested CLI to a recorded shape; the mutant that drops pi's PostToolUse shape is killed. The PI_SESSION_ID env-mismatch refusal is now proven for pi and omp too, in `head_finder.rs`.
- **L3: the synchronous call.** It is documented in the generator's doc comment, spec §7.6 and the CHANGELOG: the CLI waits at every tool result, at most the hook timeout. Making it asynchronous is not done: the guards' calls are synchronous too.
- **L5: the "silent" labels.** The 9 runs labelled "silent" are a known mislabel of V6's frozen scorer, noted in the V7e report's limits. The V7e data stays frozen. The scorer is not changed: it is in V6's frozen set.
- **L6: install paths.** `piOmpInstall()` in `scripts/lib/mailbox-live-confined.mjs` is now the one definition, used by the harness and the tests.
- **L7: fixture text.** The source text no longer prints the carrier's trailing colon. The second run's argv is genuinely the same as the dump run's.
- **L4 is not changed.** A launcher-minted `FGOS_SESSION_ID` that names another session makes the host refuse with `WriterMismatch`, as for Codex. The extension serves it and lets the host judge.

**Frozen addendum.** `adapters.v1.json` is in the V7e addendum's frozen set, so the V7e freeze no longer holds at HEAD. That is intended: V7e is closed, its pin `96928fe1e` reproduces its numbers, and a later measurement freezes its own set.

## Gates

- `cargo test -p fgos-mailbox-core -p fgos-mailbox -p fgos-identity -p fgos --lib --bins --tests`: 469 passed, 0 failed.
- Mailbox and setup Node suites (score, run, v7, v7e, confined, auth guard, recorder, agent-hooks): 83 passed, 0 failed.
- Full `npm test`: 8635 passed, 18 failed: the known Git-umask failures (`fgctl-upgrade`, `fgctl-init-download-sources`, one `dispatch.test.mjs` case), none in the mailbox.
