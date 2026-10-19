# Phase lead report: workflow case ledger, phases 03 and 04

## Commits (branch `worktree-agent-aa8a48a7699aea6a9`, on top of main `99e920dd3`)

- `cb9bf5f58` refactor(workflow): retire the plan source and the dead runner fields of the coding workflow
- `25390b221` test(setup): the coding workflow names no runner capability in the doctor warning
- phase 04 commit `feat(workflow): load every workflow definition into one guide model` (hash in `git log`)
- this report, committed last

## Phase 03: what changed

- `fgos workflow start --plan` is gone: flag removed from the registry (so the unknown-flag refusal fires: `unknown flag "--plan"`), `bin/fgos.mjs` source check now "exactly one of <workflowId> or --units <file>", `src/workflow/plan-source.mjs` deleted with its export, import, `resolveStart` branch, JSDoc and manifest row.
- `fgos-run` skill Mode B rewritten (read the plan as an artifact, run units through `fgos run` or `--units`, note that a later conductor skill owns whole-plan execution); renders rebuilt with `npm run build:skills`, diffed (only `fgos-run` in `.agents` and `plugins`).
- `feature.yaml`: dropped `units`, `dependsOn`, `gate`, the `integrate` and `approval` steps and the header comment; lifecycle keys untouched. `compiled.json` rebuilt with `npm run build:domains`; diff is only those removals.
- Readers moved: advisory contract test takes the two unit templates from `test/fixtures/workflow/coding-advisory-unit-templates.json`; the doctor warning test no longer expects `coding:plan` (the check reads runner units from workflow files, the coding file has none now; it asserts no `coding:` name appears).
- Tests that started runs with `--plan` (three in `workflow-runner.test.mjs`, three in `dir-differs-from-cwd.test.mjs`) now start a one-step project-local workflow through `test/helpers/trivial-workflow.mjs`. The `translatePlanToWorkflow` unit test is deleted. A new case in `fgos-workflow.test.mjs` asserts the `--plan` refusal. The two `--dir` start tests now expect exit 0 (a completed run); before, the translated plan ended in exit 4.
- CHANGELOG line added.

## Phase 04: what changed

- `src/workflow/guide-schema.mjs` (kernel, imports nothing, registered `kernel` in the manifest and added to the kernel isolation copy list in `domain-registry-compiled.test.mjs`): the model, closed catalog of six guards, platform guard references as `platform:<name>`, the normaliser and validation. `definition.mjs` calls it and adds `guide` to the built workflow; the run start event therefore records it.
- Playbook sugar: each step is one activity (`unit` references the step's unit ids; the templates stay only in `steps`), `dependsOn` becomes entry milestones `<step>.settled`, produces `<step>.settled`, a gate becomes a decision point with `gate: consent|input`, every decision point of a playbook is `listedRoutesOnly`.
- Load errors: guard outside the catalog (message points at `unenforced`), MUST with no guard or no reason or no subject for a milestone check, expression keys (`when`, `if`, `unless`, `expr`, `expression`, `condition`, `predicate`), `listedRoutesOnly` outside a decision point, `rigorCeiling`, unknown milestone in entry/produces/decision/closure/subject, bad `kind`, bad frame default.
- Heads added to the seven `core/workflows/*.yaml` (`kind`, `purpose`, `must`, `frameDefaults`, `closure`) and `content-publish.yaml` (milestones, SHOULD brief to draft with MAY instead, consent bound to the copy, write-scope isolation, unenforced external channel). No step, unit, template or posture file changed.
- `feature.yaml` guide part appended (milestones, 11 activities naming their operations, decisions, MUST rows, unenforced, frame defaults set at approval, closure). `domainSteps` still returns discovery, exploring, planning, executing; `compiled.json` carries the new keys by design.
- `test/workflow/guide-schema.test.mjs`: 15 tests (all nine files load, per-playbook activity order and entries, fan-in shape, content-publish head, idempotent rebuild, units file and no-head workflows, explicit form, feature both parts, each load error, start snapshot carries the guide).

## Tests

- Phase 03 focused: architecture, `test/workflow`, `test/cli`, domain-registry tests, setup registrations/checks, docs: 1498 tests, 1431 pass; the 2 failures (exit code in the `--dir` tests) were mine and fixed, rerun green; setup suite after the doctor test fix: 943 tests, 942 pass, 1 skipped.
- Phase 03 full `npm test` (at `cb9bf5f58`): 8312 tests, 8212 pass, 4 fail. `workflow-capabilities-configured` was mine (fixed in `25390b221`). `fences-v1-tombstone` and `custody reused inode` are the known failures. `dev-host` (2), coverage-collection-timeout, `unsealed thresholds` and the crash-matrix timeout failed under load; `dev-host`, `test-select-coverage-map`, `event-store-checks` rerun alone: 23 of 23 pass. One run also reported a leaked scratch file check because I had put scratch files under `.fgos/runtime/tmp` of the worktree; moved out, no repeat.
- Phase 04 focused (architecture, workflow, cli, state, setup, docs, runner/execution): 3915 tests, 3846 pass; failures were mine (guide capability names in the doctor check: removed the repeated `capability` from the feature guide units, one source of truth; a log-line filter in a test matched my milestone subject text: reworded) and one load-sensitive perf test. After fixes `test/workflow` + `test/cli`: 1227 tests, 1162 pass, 0 fail; setup + workflow + cli + registry compiled: 2177 tests, 1 mine fixed.
- Phase 04 full `npm test` (at the phase 04 commit): 8319 tests, 8220 pass, 3 fail, 31 skipped. Failures: `fences-v1-tombstone` (known), crash-matrix direct no-binding (known, per-file 600s timeout), `idleTimeoutMs` in `spawn-worker` (known load-sensitive; rerun alone 18 of 18 pass). None import the touched modules apart from load. I did not build a pristine export of main for these: they match the brief's known and load-sensitive list and the lone reruns pass.
- Phase 01 order guard (`playbook-observable-order.test.mjs`) green in every run above.

## Decisions

- Trivial CLI tests use a project-local one-step workflow instead of a units file, because a units file needs a worker and a plan with one empty phase was the old no-worker completion path.
- Activity `unit` for playbook sugar is a reference (`{ step, units }`), not a copy of the template: the templates keep one source (steps). Plan said "unit template unchanged"; this keeps it unchanged and unduplicated.
- Frame defaults of the playbook heads: `dispatches` = number of units, `fallbackPerSeat: 2` (value from the spec sketch, not measured), `deviationsBeforeAsk: 0` (playbook decision points are listed-routes-only), `rigorFloor: standard`. The ceiling arrives with the admission phase, which may adjust these numbers.
- Feature guide activities carry no `capability` (the operation names the task spec); the doctor capability check reads any `capability` key it finds in workflow files.
- A step's `<step>.settled` milestone for a gated step is reached once the gate is answered; the consent decision point sits at that milestone. `settledBy` on an explicit milestone (step-form files only) lets `content-publish` keep its spec milestone names while the steps stay unchanged.
- `validateWorkflow` on an already built workflow re-checks its `guide` as the model (idempotent), so loader output can be fed back to `startWorkflow`.

## Open points / ideas (not done)

- Stored runs written before this change carry no `guide` in their start event; phase 05/06 readers must treat it as absent.
- `fgos workflow operations --step` still reads the Work lifecycle part; untouched as planned.
- Idea: a doctor check that every `must` row of a registered guide names a milestone with a producing activity (today only existence of the milestone is checked). Evidence: milestones can be declared that no activity produces.

Status: DONE
