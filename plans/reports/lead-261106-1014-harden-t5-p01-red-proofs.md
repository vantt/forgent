# Red proofs for the execution core hardening (branch `harden/t5-p01-red-proofs`, base `5085c58f2`)

Every test below fails on the base commit for the stated reason. No product code, doc or config was touched. The branch never lands alone; each fix phase takes its rows by cherry-pick. Commands run from the worktree with every `HERDR_*` and `CLAUDE*` variable unset, `PATH=$HOME/.cargo/bin:$PATH`, `CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/cargo-harden-t5-p01`: `node scripts/run-tests.mjs <file> [--test-name-pattern=...]` (it runs only the named files) and `cargo test -p <crate> --test <name>`.

## Tests and observed failures

| # | File | Title | Defect proved | Failing assertion observed | Green in |
|---|---|---|---|---|---|
| 1 | `test/runner/herdr-private-home-trust.test.mjs` | an unconfined claude pane never writes the operator's claude store | `seedWorkspaceTrust` read-modify-writes the real `~/.claude.json` when the pane has no private home (HOME is a scratch dir in the test) | `the operator's claude store was edited by an unconfined pane` (store gained the worktree entry) | P05 |
| 2 | `packages/config/rust/tests/golden_snapshot.rs` | a_project_file_cannot_lower_a_capability_confinement | project `advise.confinement.mode: unconfined` over the standard's `required` is accepted | `a project file lowered runner.capabilities.advise.confinement from required to Ok(Some(Object {"mode": String("unconfined")})) and was accepted` | P04 |
| 3 | `test/runner/dispatch-confinement-machine-private.test.mjs` | a confined worker cannot read a login store the account inventory names | real bwrap worker reads a stand-in store named by `runner.llmAccounts` (control: the gh config stays readable, asserted passing) | `the worker read a login store the account inventory names` (actual `READ`, expected `ENOENT`) | P03 |
| 4 | `test/runner/provider-credential-renewal.test.mjs` | a renewed login whose account differs from the leased account is never applied | write-back applies a newer codex copy whose `tokens.account_id` is another account | `the leased account's login was replaced by the login of another account` | P03 |
| 5 | same file | a held home settles by itself once its login is safe | a home held after the retry budget (driven through `finalizeAttemptHome` with a real `prepareBwrapSync` home) is never settled by the doctor fix | `the held home is still there although its login can now be written back` | P03 |
| 6 | `test/runner/execution/run-provider-failover.test.mjs` | an attempt whose outcome is recorded leaves no assignment record in the provider state | `state.assignments` keeps `provider:unitRun/seat/N` and `...-fb1` after the outcomes are recorded | `the provider state still holds entries for attempts whose outcome is recorded` (two keys listed) | P07 |
| 7 | `test/runner/dispatch-worker-session-boot.test.mjs` | two seats starting at once share one worker session server | two concurrent `ensureWorkerSession` both spawn `herdr server` (injected `spawnFn`, socket appears 30 ms after spawn) | `a second server was started for a session that was already starting` (actual 2, expected 1) | P07 |
| 8 | `test/verbs/dispatch-recovery.test.mjs` | recover offers no action that only reports success, whatever the intent | `plan()` still recommends `resume-driver` and `reassign-driver` | `plan offered resume-driver, reassign-driver, which only records that it was applied` | P07 |
| 9 | `test/run-supervisor/terminal-cutover.test.mjs` | a launch refused before the handover leaves no attempt home and no pane | pane allocation refused (fake herdr fails `tab create`) after the bwrap attempt home exists; no envelope; home stays under the confinement temp root | `the refused launch left its private home behind` (one `.../fgos-confinement/disp_*/home` listed) | P06 |
| 10 | `packages/run-supervisor/rust/tests/adopt_matrix.rs` | adopt_an_intent_whose_controller_opened_a_pane_decides_what_becomes_of_that_pane | the intent has no slot, so closing from it leaves no `steps/release-slot.json` for the allocated pane (adopt itself runs and reports `adopted`, so an extra intent field is tolerated today) | `adopt closed the attempt and never decided what becomes of its pane (calls: [pane layout --help, pane rename ...])` | P06 |

Other tests of each touched file still pass (renewal 93 pass / 2 fail, boot 15 / 1, recovery 31 / 1, herdr trust 16 / 1, machine-private 22 / 1, terminal-cutover 9 / 1, adopt_matrix 16 / 1, golden_snapshot 3 / 1). `cargo fmt --check` clean for `fgos-config` and `fgos-run-supervisor`. The mutation census was regenerated and is committed with the Rust commit.

## Deviations from the phase table (for the fix-phase leads)

- **Row 6** sits in `run-provider-failover.test.mjs`, not `provider-capacity.test.mjs`: the closed signal is the controller recording an outcome in `run.mjs`, which only a `runUnit` run observes; the capacity test file has no run harness. P12 also edits this file later, so P07 should take the case with its commit.
- **Row 2** sits in `golden_snapshot.rs`, not `golden_scope.rs`: `judge` sees only the project value, while "lower than the layer below" is a merge property (needs the bundled schema and standard). **The neighbouring passing test `an_unconfined_capability_does_not_inherit_the_standard_policy` asserts the same hole (project `unconfined` survives the snapshot). It must be rewritten with the fix (P04 owns that).** The expected refusal code `config-confinement-lowered` and path are the phase's own wording.
- **Row 9** sits in the terminal harness test, not `assignment-dispatch.test.mjs`: in direct mode no seam fails the launch between the home and the handover (admission skips a pre-made run directory), while the fake herdr gives an honest refusal after the home exists. The "no pane" half holds today: `abandon()` releases a pane that was opened (the refusal here happens before any pane exists; the assertion `pane run` count is 0). The pane that a **killed** controller leaves is row 10. A refusal after the pane is allocated but before the envelope is written has no natural seam; P06 proves it by reading plus the abandon path.
- **Row 5** drives the repair through `fixCredentialCopiesRetained` (the doctor fix) with HOME and the state root pointed at scratch directories, because the old settle door is gone. If P03 settles only through `refreshAhead`, retarget the trigger line; the setup (real `prepareBwrapSync` home, descriptor, `finalizeAttemptHome` x5 with advancing `Date.now`) stays. It relies on `prepareBwrapSync` writing the host-only record in the fixed code; today it passes through to the missing settle.
- **Row 4** uses the codex layout, identity read from `tokens.account_id` (the field real codex stores beside its JWT). P03 documents the per-layout field; adjust the fixture field if it chooses another.
- **Row 10** asserts only that a `release-slot` receipt exists. `disposition_for` keeps the pane of an `abandoned-not-started` attempt (`retain`), so the pane may stay open for forensics. Whether an attempt that never ran should be closed instead is P06's decision; the test does not pin it.
- Rust adopt test needs the example binary: run `cargo build -p fgos-run-supervisor --examples` once before `cargo test --test adopt_matrix` (the suite's own wrapper builds it).

## Defects not reproduced as red tests

None skipped. B-8 is proven only at the in-process level (injected `spawnFn`); the cross-process case needs the holder-lock door the fix adds, so P07 adds that case with its fix.

## Safety notes

All trust tests set `HOME` to a scratch directory (never the real `~/.claude.json`); the credential tests set `HOME` and the state root to scratch directories and restore them; stand-in logins carry fake values; the machine-private test plants its host under `/var/tmp` and removes it.

Status: DONE
