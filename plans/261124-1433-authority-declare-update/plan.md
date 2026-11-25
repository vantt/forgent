---
contract: plan-v1
title: "Authority declare updates an existing component row, and render writes the caller's own checkout"
description: "Add an --update mode to fgos authority declare that changes an existing component row under the new-row checks, re-render the ownership views on every declare, and make declare and render act on the checkout the caller stands in."
status: done
lead: head:lead-forgent-261124-1433-author-636d2
priority: P1
blockedBy: []
base: 9680efe1afe0c6a81a860fa6cb45362b72eb7ce0
source:
  - plans/discussions/ds-p4ne2byuez-authority-declare-update/DISCUSSION.md
  - p-2lpsdtxnrd
created: 2026-11-24
footprint:
  - plans/261124-1433-authority-declare-update/**
  - packages/component-authority/rust/src/declare.rs
  - packages/component-authority/rust/src/lib.rs
  - apps/fgos/src/wiring/authority.rs
  - apps/fgos/tests/authority.rs
  - src/cli/command-registry.mjs
  - packages/host-runtime/contracts/command-manifest.json
  - packages/host-runtime/contracts/command-routes.json
  - packages/host-runtime/contracts/command-route-annotations.json
  - test/cli/subcommand-flag-drift.test.mjs
  - docs/platform/component-authority/spec.md
  - CHANGELOG.md
---

# Authority declare updates an existing component row, and render writes the caller's own checkout

## Outcome

`fgos authority declare --kind component --update --row <json|file>` changes an existing component row: it can add
`paths`, add `owns` and change `status`, along with every other field except `id` and `parent`. The changed row must
pass the same checks a new row passes. No owner question is needed, because the id and the parent stay the same.
Every successful declare re-renders the ownership views in the same call, so a model write can no longer leave
`docs/platform/component-boundary.md` out of line. Declare and render act on the checkout the caller stands in, so
running the installed host from a linked worktree writes that worktree. Their answers name the tree they wrote, so
`written` can no longer look empty while another tree changed.

This unblocks plan `261124-0837-docos-documentation-in-component-authority`, which resumes at phase 2 to update the
row `document-identity`.

## Acceptance criteria

1. `cargo test -p fgos-component-authority` passes. It includes new tests proving that an update changes `paths`,
   `owns` and `status` of an existing row, keeps the YAML notes on other rows, and is refused by name in four cases:
   an unknown id (`reference-missing`), a changed `parent` (`update-changes-parent`), a kind other than component
   (`update-unsupported`), and a merged row that fails a new-row check (`row-invalid`, `path-missing`,
   `name-taken`). The id is the lookup key, so an update can never rename a row. An update needs no `--approved-by`.
2. `cargo test -p fgos --test authority` passes. It includes a wiring test proving that `fgos authority declare
   --kind component --update` run against a seeded repository writes the row and re-renders the views. After it,
   `fgos authority render --check` on that tree reports `"drift": []`.
3. On the combined tree, `fgos authority render --check --json` (installed host, run from the main checkout)
   answers `"drift": []`. This is acceptance criterion 2 of the discussion; main already passes it at 2bcd2a820
   since commit 42d42bc0c, and this plan keeps it passing.
4. `fgos authority render --json` lists exactly the files it wrote, and its answer carries the `root` it wrote
   into. The wiring test from phase 2 owns this proof.
5. In a linked worktree, the installed host's `fgos authority render` writes that worktree, not the main
   checkout. This holds when the shell helper `scripts/fgos-shell-integration.sh` appends `--dir <main checkout>`.
   The phase 2 test owns this proof; phase 4 confirms it by hand once and records the commands in its report.
6. `npm test` and `cargo test --workspace` pass on the combined tree, and so does
   `node scripts/export-command-selectors.mjs --check`.

## Non-goals

- Changing a row's `id` or `parent`. That stays an owner question; update refuses it by name.
- Updating a decision kind, door or contract row. The request names component rows only. `--update` with another
  kind is refused the way `--move` is refused outside decision kinds.
- Any edit to plan `261124-0837` or to the model itself. The DOCOS plan makes the real `document-identity` update.
- Changing how the shell helper picks `--dir`, or the root rule of any verb other than `authority`.
- A new guard against hand edits of the model. `apps/fgos/tests/authority.rs`
  (`authority_render_check_finds_every_view_of_this_repository_in_sync_with_the_model`) already catches those in
  `cargo test`.

## Facts found while planning

- **Update refusal today.** `plan_component` in `packages/component-authority/rust/src/declare.rs` refuses an
  existing id with `id-taken: component "<id>" already exists`. The only existing-row change is `--move`
  (`plan_move`), which sets one field of a decision kind through the YAML door (`document.set` with
  `CommentLoss::Refuse`).
- **Defect 1 is already fixed on main.** Commit 42d42bc0c ("regenerate the component door counts") fixed the 9 cells
  the request named. `fgos authority render --check --json` answered `"drift": []` on main during planning. The drift
  had reached main because door rows were added and nobody re-rendered. The only existing proof is a `cargo test`,
  which the land path does not run.
- **Defect 3 cause, proven by reading the code.** The host itself resolves `authority` with the `READER` root policy
  (`CallerTree`, `apps/fgos/src/invocation_doors.rs`), which finds the worktree. The `fgos()` function in
  `scripts/fgos-shell-integration.sh` takes `root=$(dirname "$common_dir")` (the main checkout, even from a linked
  worktree) and appends `--dir "$root"` whenever the caller passes no `--dir`. So the installed host receives
  `--dir <main checkout>` and writes there. `npm run fgos:dev` passes no `--dir` and preserves the cwd, which is why
  it writes the worktree.
- **Defect 2 did not reproduce.** The installed host (release `sha256:9a8743e9…`), run with an explicit `--dir` on a
  scratch copy whose `component-boundary` block was hand-edited, answered
  `written: [{view: component-boundary, file: docs/platform/component-boundary.md}]`. The likely reading is that it
  is a shadow of defect 3: the render wrote the main checkout while the lead read the worktree, or a second run saw
  nothing left to write. Phase 2 reproduces it on the exact path (installed host from a linked worktree through the
  shell helper) before changing anything.

## Approach and alternatives

**Update shape: a `--update` flag on `declare`.** This is the door's existing pattern: `--move` already turns
declare into an existing-row change. A sibling verb would add a second write path into the model and break the
spec's "declare is the one write path" (component-authority spec, Decision 6). The row carries `id` and the fields
to change. Each given field replaces the row's field, which is one rule and covers add, change and remove. The
answer returns the full row after the change. The merged row goes through the same checks as a new row. To get
that, the phase extracts `plan_component`'s checks into one function that runs against the model minus the row
being updated, so the id and name checks compare only against other rows. A sibling verb was rejected (L10, the one
write path). A field-level `--add-path` style was rejected because it needs one flag per field and still needs the
same checks.

**Views re-rendered on declare.** In the fgOS repository (the root carries `OWN_CONTRACT`, the same rule `model_dir`
uses), the wiring calls the existing `write_views` after a successful declare and adds `views` to the answer. This
removes the cause of defect 1 on the declare path: generated text is regenerated from its source (design principle
7). The alternative was to leave re-rendering to the caller and add a land check. That was rejected because it adds
a mechanism, and the drift had already slipped past a check that exists.

**Tree for declare and render: the caller's own checkout.** In the wiring, the tree that `model_dir`, `declare` and
`render` read and write is the work tree of the process cwd when that cwd is a linked worktree whose main checkout
is the resolved project root. Otherwise it is the resolved root, so an explicit `--dir` to another project keeps
working. The question store keeps the project root. Two alternatives were rejected:
- Changing the shell helper to stop appending `--dir` would move the root of every verb for worktree callers,
  including state stores.
- Adding `authority` to `VERB_ROOTS` with `ignores_dir` would drop `--dir` for other projects, which hurts mission #1.

**Reused:** `plan_move`'s YAML-door edit pattern, `plan_component`'s checks, `write_views`, `model_dir`'s
fgOS-repository rule, the git driver's `resolve_repo` (work tree versus trusted main root, as
`apps/fgos/src/wiring/unit_run_host/machine.rs` uses it), and `scripts/export-command-selectors.mjs` for the
generated command manifest. **Missing:** an existing-row path for components, and any tie between declare and the
views.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| `--update` mode of `declare` for component rows (crate `declare.rs`) | component-authority | Extends the one write path (`fgos authority locate "update an existing component row in the component authority model through declare"` → `component-authority`). No new row. |
| Re-render of the ownership views after a successful declare | component-authority | Composes the existing `declare` and `write_views` of the same crate in its CLI wiring. |
| Choosing the caller's checkout as the tree that `authority` reads and writes | component-authority | Lives in `apps/fgos/src/wiring/authority.rs`, the component's CLI adapter. No model row covers `apps/fgos/`, and the existing invocation-root door is reused, not changed. |
| `root` and `views` fields in the declare and render answers | component-authority | Additive JSON fields on the existing verb. |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Update mode in the declare crate](phase-01-update-mode-in-the-declare-crate.md) | - | packages/component-authority/rust/src/declare.rs, packages/component-authority/rust/src/lib.rs | 1 | done |
| 2 | [Authority acts on the caller's checkout](phase-02-authority-acts-on-the-callers-checkout.md) | - | apps/fgos/src/wiring/authority.rs, apps/fgos/tests/authority.rs | 1 | done |
| 3 | [Wire update and re-render on declare](phase-03-wire-update-and-rerender-on-declare.md) | 1, 2 | apps/fgos/src/wiring/authority.rs, apps/fgos/tests/authority.rs, src/cli/command-registry.mjs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-route-annotations.json, test/cli/subcommand-flag-drift.test.mjs | 2 | done |
| 4 | [Integrate, document and report back](phase-04-integrate-document-and-report-back.md) | 3 | docs/platform/component-authority/spec.md, CHANGELOG.md, plans/261124-1433-authority-declare-update/reports/ | 3 | done |

Phases 1 and 2 have disjoint footprints and run at once. Phase 1 landed at 1d129c0b9 and phase 2 at c0299bcff. Phase 3 landed at 49f0f47dc. Its first unit (gemini, unit-run-1795509087287-0effc08f) went silent and was replaced on the supervisor's word. A claude rerun was denied Bash, an openai unit finished the work, and a final unit applied the reviewed diff in a clean worktree, because the runner counts only the run's own diff as evidence. `test/rust-host/help-routes.test.mjs` cannot run under unit confinement (read-only git floor probe) and ran in the land gate. `cargo clippy -p fgos -- -D warnings` fails on main at apps/fgos/src/wiring/session_rotation_hook.rs:555, outside this plan's footprint. Phase 4 landed its spec, changelog and integration report at 03d5fd4a9 and stays `running`, parked on owner question q-vdefxq4upy: the full `npm test` and `cargo test --workspace` gate (criterion 6) and the activated-release check (criterion 5) cannot run inside a confined session. The report [integration-261124-1612-authority-declare-update.md](reports/integration-261124-1612-authority-declare-update.md) holds the focused results and the exact commands. The owner answered q-vdefxq4upy "You run both checks" on 2026-11-24: the owner runs `npm test` and `cargo test --workspace` from the main checkout, then, after activating a release from 03d5fd4a9 or later, the commands in the report's "Pending owner action" section. Phase 4 stays parked on those owner results; no session runs them, and no code changes or gate waivers are allowed. The lead records the results and closes the plan when the owner hands them back. Closed 2026-11-24 20:50 on the owner's word. The DOCOS lead ran both checks outside the sandbox on design-lap (report section "Run outside the sandbox"): criterion 5 passes on release 71dd6eb7; criterion 6 is not green on main, and no red traces to this plan (the reds are named there, including the door `severity` fixtures of deb11953c). The owner chose to close with main not green. Phase 3 owns the generated command contracts (hot files),
and phase 4 alone owns `CHANGELOG.md` and the spec. Owner question q-2dncwfeoy4 (stale phase 3 worktrees -p03 and -p03-rerun) was answered "Owner runs the removal" on 2026-11-24: the owner removes both worktrees and their branches; no session touches them. The footprint check is `node scripts/plan-contract-check.mjs` and
`fgos resource-check --plan`, run before landing.

## Owner questions

None. The discussion settled the outcome, and the shape choice was left to the planner.

- **q-trgzaa34ua, how phase 4 closes: answered "Close on focused tests"** (owner, 2026-11-24 22:32). Phase 4
  closes on its focused test results; the plan was already closed done on the owner's word at 20:50, so nothing
  else changes.

## Outstanding questions

None

## Risks and rollback

- **The YAML door may refuse to add a field the row lacks** (for example `reason` on a row that has none). Proof
  point for validating: phase 1's test sets a field absent from the row. If `document.set` cannot insert a key,
  the phase replaces the whole row item through the door's editor and proves notes on other rows survive. It
  stops and reports if neither works.
- **Re-render on declare fails on a tree whose views drifted for other reasons.** Then declare reports the render
  error after the row was written. Phase 3 orders the work so the row write and the view write are reported
  separately, and the answer says which step failed.
- **The tree rule picks the wrong tree.** The rule applies only when the resolved root is the main checkout of the
  cwd's own linked worktree. Phase 2 tests both that case and an explicit `--dir` to another project.
- **Rollback:** revert the plan's commits on main. The model and the views carry no migration, so nothing else
  needs undoing.
