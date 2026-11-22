# Supervisor wake 2026-11-23 02:52

## What moved

- Event 77456aa713a2eaa6 (coordination-help, plan 261122-2307-heads-rotate-on-their-own) is handled. The plan is
  done (fc3305c3d). Its backlog rows p-fwdxupc6fx and p-njgws5wsex were already done in the lead's land. The lead
  head:lead-forgent-261122-2307-heads-5c830 is stopped with reason "plan done". There is a board log line.
- Running plans: 261121-2109-component-authority has phases 4 and 5 running (wave 4, last plan update 02:45), so
  it was left alone. 261122-0118-heads-stable-and-able has phases 8, 9 and 10 parked on measure windows ending
  2026-11-23 14:20 and 21:06, as the owner ordered, and phase 11 waits on them. Its lead is idle on that verified wait.
- Admission: no plan is admissible. 261122-1950-owner-communication-standard is `ready` but not admissible. Lanes are
  2 of 4.

## Needs an owner (secretary routing)

The host full suite on main 4951cf3da is red. None of these reds is in the heads-rotate footprint, and none has an
owning plan yet. Source: plans/261122-2307-heads-rotate-on-their-own/reports/lead-261123-0250-heads-rotate-full-suite-judgment.md.

| Red | Cause |
|---|---|
| test/cli/subcommand-flag-drift.test.mjs (2) | The `migrate` verb is missing from the drift scan list (d5a414be6). |
| packages/run-supervisor/rust/tests/head_request.rs:883 | The `config patch` verb is missing from the head-request contract (31dcaab69). |
| test/workflow/guide-schema.test.mjs (2) | There are 10 workflows, not 9, and coding/bugfix uses the guide form. |
| test/run-supervisor/terminal-groups.test.mjs:310 | The title separator is `:`, not `·`. |
| test/scripts/convention-conformance.test.mjs | 1 naming violation. |
| test/setup/instruction-projections.test.mjs | Stale projections; `npm run build:skills` regenerates them. |
| test/git/one-door.test.mjs:58 | inspect-cursor-stale |
| test/install-packaging.test.mjs:71 | EISDIR |
| run-tests store-leak check | Live heads wrote into the main checkout's .fgos while the suite ran. |

## Open owner questions

- q-zcileomdpa: the lead says its gate is met by the host run, so it can close. Only its asker's successor or the
  owner can ack it; the supervisor never acks.
- q-rfxqncjrax (Miu account probe) is still open.

## Debt

- Heads-rotate phase 3: one real status-line recording from a live head is still owed.
