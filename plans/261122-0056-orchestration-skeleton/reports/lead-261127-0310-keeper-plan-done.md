# Keeper plan done

Plan `261122-0056-orchestration-skeleton` is done. Every phase in the table (1, 3, 4, 5, 9, 10, 16, 18, 19, 20) has landed.

## Phase 18 closing

- The first integration branch `orchestration-skeleton/p18` landed at `1657a5b31c`. It updated the five specs: supervision, questions, workflow, resource-referee and session-host.
- The fix branch `orchestration-skeleton/p18b` (`5be73f9289`) landed at `9c81731f8e` with `--test test/skills/fgos-supervisor-idle-lead.test.mjs`. The land gates passed, and the land removed the worktree. The branch makes two changes:
  - It adds the `Default:` part to the `watcher.schedulingSources` doc line, which `fgos-config --test registry_defaults` requires.
  - It moves the two skill-text tests onto the "Admission judgement only" section that phase 1 wrote. The publish-then-start rule is now proven in code by `ready_plans_are_published_then_started_in_order_under_the_cap_without_a_supervisor` in `packages/supervision/rust/tests/wake.rs`.
- The supervisor ran the focused tests on p18b at `5be73f9289` (event `e2ecee934af1fcbf`) and all passed: `registry_defaults` 3, `model_checks` 23, idle-lead skill test 4.
- The lead reviewed the p18b diff inline. It is 2 files and 12 lines, and it matches the supervisor's description of the regression.

## Left for the supervisor

1. **Changelog fragment.** Neither phase 18 land wrote the `[Unreleased]` lines. `changelog.d/` is outside this plan's footprint, so this text is handed over for a post-done land as `changelog.d/261127-0310-keeper-in-code.md`:

```markdown
- Added: admission and lead caps run in code in the wake door (`supervisor.maxLeads`, the lane ceiling), and every admit, hold and refusal carries a reason code; the supervisor skill keeps judgement only.
- Added: a keeper in Supervision reads scheduling records (`{ item, step, waitingOn?, needs?, outcome? }`) from the sources listed in `watcher.schedulingSources` (running plans, and open workflow-case activities through `fgos workflow records --json`). It starts the player a record needs after asking the resource referee, raises one event when an `until` passes, and raises "needs judgement" when its rules run out.
- Added: a question can be addressed to the owner, a `role` or a `party`, through an outbound notifier port. A verified external answer is accepted; a wrong signature or a wrong answerer is refused.
- Added: the resource referee has a `resource` claim space for heavy machine resources, made of named slots.
- Added: `fgos session stop --reason sleep` writes the sleep fields into the head record together with a `sleep` handoff, and `fgos session list` shows live and sleeping agents.
- Added: a read-only periodic review Unit runs every `watcher.reviewIntervalSec` (`review-due`), and its findings become events.
```

2. **Command manifest.** By owner order, phase 5 did not regenerate `packages/host-runtime/contracts/command-manifest.json` for `fgos workflow records`. The next plan that holds the manifest still owes that regeneration.
3. **Leftover worktrees and branches.** These worktrees of this plan remain: p01b, p01c, p03b, p05, p05b, p12, p16, p16b and p16c. p12 belongs to the players plan. The leftover `orchestration-skeleton/*` branches also remain. The lead never removes them by hand.
4. **Stale question.** `q-ua5dz63wny`, asked by the supervisor about the shaper's dirty `DISCUSSION.md`, references phase 4 of this plan. Phase 4 is done, so the supervisor can close it.
