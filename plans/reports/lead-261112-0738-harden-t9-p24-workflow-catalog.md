# HARDEN T9 P24: one workflow catalog

Branch `harden/t9-p24-workflow-catalog`, based on `f200685c6`.

## What changed

- `src/workflow/loader.mjs`: `workflowCatalog({ projectRoot, payloadRoot, unreadable })` is the one walk and the one precedence. Project definitions first, the running payload's second, a project definition winning a shipped id. Each entry: `{ workflow, raw, overridesShipped, source: { root: 'project'|'payload', sourcePath, workflowDir, owningDomain } }`. A root that is both project and payload is read once and is the project. Without `unreadable` a file that cannot be read, parsed or validated stops the walk (`RunnerConfigError`, as before); with it (the doctor reader) the file is skipped and named. `loadWorkflowWithSource` and `discoverWorkflows` are lookups in it.
- `src/setup/workflow-definition-files.mjs` is gone (`workflowRoots`, `loadWorkflowDefinitions`, `readWorkflowDefinitionFiles` deleted). Its non-loader helpers (`withUnreadableDefinitions`, `workflowUnitContract`) live in `src/setup/workflow-catalog-reader.mjs` with `readWorkflowCatalog(cwd)` (project root = main checkout root, as the runner resolves it), `sourceOf` and `declaredActivities`.
- Callers moved in the same change: `registrations.mjs` (loop-bounds warning, `workflow-capabilities-configured`, the two row registrations no longer pass a payload root), `seat-binding-checks.mjs`, `blind-steps-proven-pools.mjs`. The check option `packageRoot` is now `payloadRoot` (default: the running payload).
- Doctor messages name the source: dry-bind and blind problems end with `[project definition <path>]`; the dry-bind row lists an override as info; the capability row writes `<id> from project|payload`.
- Doctor row ids and count unchanged. CHANGELOG line, workflow spec decision entry and file-name pointer, architecture manifest row, one-door census regenerated.

## Decisions inside the frame

- `source` keeps the existing `sourcePath` key (persona scope reads it) and adds `root`; the phase's `path` is `sourcePath`.
- Doctor reads steps from the validated workflow (what a run starts) and explicit activities and capability strings from `raw`. So a definition that fails validation now fails the rows by name (it never ran); before, doctor evaluated its raw text. Two seat-binding fixtures that were not valid workflows (no `steps`, activity without `effects`) were made valid; their assertions are unchanged.
- The loader option `packageRoot` (which means the project root) is unchanged: renaming it touches `case-start.mjs`, `runner.mjs` and `propose.mjs` (Work/P08 files). Open item for whoever owns those next.

## Tests (one proof each)

- Owner: `test/workflow/workflow-loader-catalog.test.mjs` (override and add, source per id, payload-only and same-root cases, lookup order, runtime stop vs doctor naming). Replaces the retired reader test in `yaml-parse-failures.test.mjs` ("the workflow reader tells a file that cannot be read...": the read/parse split and the root prefix are now owned by the catalog test's last case; the payload-first order behaviour was removed).
- Wiring: one case each in `yaml-parse-failures.test.mjs` (dry-bind row judges the project's override and names it) and `blind-steps-proven-pools-check.test.mjs`.
- `workflow-loader-persona-scope.test.mjs`: source now carries `root`; `discoverWorkflows` includes the payload's ids.

## Gate

Focused set, architecture, doc-health, decision-citation drift and the one-door scan (0 undeclared) green. Full `npm test`: 8712 pass, 2 fail, no run-tests ERROR lines; the fails were the known V7n addendum and `workflow-capabilities-configured names a capability a project Workflow uses` (its message now reads `<id> from project`; assertion updated, rerun green). No Rust or shipped default touched, so no cargo run. Work code touched: none.

## Authority

- "Which definition does an id name" moved from two holders (loader: project first; setup reader: payload first) to the Workflow loader alone.
- Still two holders elsewhere: the `packageRoot` name for the project root in the loader's callers (above), and domain doctrine, which stays payload-only for P25 (the catalog still reads a project's `domains/*/workflows`, as before).
- `workflowUnitContract` duplicates the inline unit projection in `src/workflow/seats.mjs` and `runner.mjs`; the right owner is `src/workflow/steps.mjs` (not mine).

## Lessons

- `git commit --amend` after a refused commit rewrote the previous (already landed) commit; use a plain new commit when the first attempt was refused by the pre-commit hook, and check `git log -2` before pushing.
- The census hook refuses a commit when a file moves; run `--write-census` before the first commit of a rename.
- Doctor fixtures that were never valid workflows hid behind raw reading; validating through the loader exposes them.
