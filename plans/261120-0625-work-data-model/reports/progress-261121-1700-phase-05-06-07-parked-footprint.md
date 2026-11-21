# Progress: phases 5, 6 and 7 parked on footprint questions

All three remaining phases are parked. Each one needs changes outside the plan footprint, so the lead asked the owner one question per phase. No unit ran and nothing landed in this wake.

## What the lead checked (main at 99711b3c9)

- **Phase 5 (migration), `q-ekkgwaavrb`.** `git grep -l docs/discussions` finds 79 active files outside the footprint and outside `plans/` and `docs/discussions/`. Examples are `bin/fgos.mjs`, `src/state/work.mjs`, `src/state/frontier.mjs`, `src/session-host/head-plan.mjs`, `src/report/context-render.mjs`, `src/setup/skill-wrappers.mjs`, `core/skills`, `core/agents`, `domains/coding`, `docs/platform`, `docs/knowledge` and `packages/convention/contracts`. 165 files outside `plans/` name `docs/backlog.md`. Step 4 (the `fgos migrate portfolio` verb) needs CLI wiring outside the footprint. A partial land would move the data while that code still reads the old paths, so the phase cannot land in parts.
- **Phase 6 (landing writes item done), `q-76qpywi7if`.** The phase file and footprint name `apps/fgos/src/wiring/land.rs`, which does not exist. The land door is `packages/supervision/rust/src/land.rs` (the paths land already reads `plan.md` frontmatter for the footprint check). Its wiring is in `apps/fgos/src/wiring/supervision.rs` and its owning proof is in `packages/supervision/rust/tests/land.rs`. A new wiring file next to that door would break L10 and design principle 8.
- **Phase 7 (plan statuses), `q-wb6bdz3c72`.** Legacy statuses on `plans/*/plan.md` total about 78 plans: completed 39, pending 15, in-progress 7, approved 3, complete 3, proposed 3, landed 1, and 7 with no status. Only the two plans approved in `q-x3ata7iuej` are in the footprint, so `plan-contract-check --all` cannot exit 0 inside the footprint. `node scripts/plan-contract-check.mjs` cannot run in the lead sandbox (git addon staging fails, status 101), so the lead counted the statuses by reading the frontmatter.

## State left behind

- Worktrees `forgent-worktrees/261120-0625-work-data-model-p05` (branch `work-data-model/p05`) and `-p06` (branch `work-data-model/p06`) were created at 99711b3c9 and have no commits. Sync them to main before use.
- `fgos request result` with no id returns `verb-failed` ("the route ended with exit 0") for this role, so the lead could not list its tickets. No ticket of this plan was known to be running.

## Next

Once the owner answers, the supervisor or planner edits the plan footprint (the lead cannot change the footprint). The lead then runs phases 5 to 7 in order.
