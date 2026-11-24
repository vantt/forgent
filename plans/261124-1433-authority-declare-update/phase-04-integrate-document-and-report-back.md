# Phase 4: Integrate, document and report back

Capability: `code:test`

## Inputs

- `plans/261124-1433-authority-declare-update/plan.md` (Acceptance criteria 3, 5 and 6).
- The merged commits of phases 1 to 3.
- `docs/platform/component-authority/spec.md` §3.2 and §7 (Lịch sử quyết định).
- `CHANGELOG.md` `## [Unreleased]`.
- `plans/261124-0837-docos-documentation-in-component-authority/phase-02-declare-the-rows.md` (what the DOCOS plan
  will run).

## Files it writes

`docs/platform/component-authority/spec.md`, `CHANGELOG.md`, `plans/261124-1433-authority-declare-update/reports/`.

## Steps

1. Merge the branches of phases 1 to 3 onto one tree, if they did not land in order. Run the full gate on that tree:
   `npm test` and `cargo test --workspace`.
2. Run `npm run fgos:dev -- authority render --check --json` on the combined tree and record the answer. A non-empty
   drift is a finding: stop and report it, and do not re-render docs here. This plan does not own the view files.
3. Confirm acceptance criterion 5 by hand once, after the release that carries this plan is activated (if this
   session cannot stage and activate, park it as one owner question in the decision-question form, with the exact
   commands). Run the installed host through the shell helper from a throwaway linked worktree (`fgos worktree`)
   and check that the worktree, not the main checkout, changed. Record the commands and the answer in the report,
   then remove the worktree with `fgos worktree remove --discard-ignored`.
4. Spec, §3.2: say that declare also updates an existing component row with `--update`. The row carries `id` and the
   fields to change. It passes the new-row checks, needs no owner question, and refuses a changed `id` or `parent`.
   Say that declare re-renders the ownership views in the fgOS repository, and that declare and render act on the
   caller's own checkout. Add `--update` to the CLI shapes block. Add one decision narrative to §7 for the shape
   choice (a flag on declare, not a sibling verb, because declare is the one write path), citing this plan.
5. `CHANGELOG.md`, `## [Unreleased]`: add one line for `--update`, the re-render on declare, and authority writing
   the caller's worktree.
6. Write the report `plans/261124-1433-authority-declare-update/reports/` (name from
   `fgos convention name --kind report`). It covers the gate results, the render check answer, the criterion 5
   evidence, and one line telling the DOCOS lead that plan `261124-0837` can resume at phase 2 with
   `fgos authority declare --kind component --update --row <file>` for `document-identity`.

## Verify

`npm test` and `cargo test --workspace` pass on the combined tree. `npm run fgos:dev -- authority render --check
--json` answers `"drift": []`. `node scripts/plan-contract-check.mjs --plan plans/261124-1433-authority-declare-update`
passes.

## Rollback

Revert this phase's doc and changelog commit. The code phases stand on their own.
