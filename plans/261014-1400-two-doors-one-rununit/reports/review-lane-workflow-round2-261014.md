# Review round 2: workflow lane (phase 05, items 1-7)

Reviewer: code-reviewer (independent, not the author). Read-only review.

- Branch: `feat/rununit-workflow`, rebased onto main `a593d713e`, which includes P02 (scoped `commitUnitWork`).
- Commits reviewed, by new SHA:
  - `ee6840dc1`: the fix commit (was `a679358d1`)
  - `6430fd232`: the persona refactor (was `097ddb1c1`)
  - `ced5dc4cc`: the CLI commit (was `63b2ce839`)
- Round 1: [review-lane-workflow-core-261014.md](review-lane-workflow-core-261014.md)

## Checks run

- On HEAD `ced5dc4cc`, `node --test test/workflow/*.test.mjs test/cli/fgos-workflow.test.mjs` passed 119/119.
- Before the rebase, the same set plus `test/runner/execution/bind.test.mjs` passed 159/159.
- `node scripts/export-command-selectors.mjs --check` exited 0.
- I ran three probe tests from a session scratchpad, not the repo: P02 chain, integrate skip, and writer → integrate → writer. Their results are cited below as **reproduced**.
- I did not run `npm test`, per the brief.

## Round-1 findings: verification

| Round 1 | Status | Evidence |
|---|---|---|
| H1: non-ASCII false positive | **Fixed** | `runner.mjs:275` reads the changed paths with `git diff -z --no-renames --name-only baseSha branch`. After P02, `commit.outOfScope` comes from `status --porcelain -z` and is unquoted too. The test `docs/résumé.md` is green. The fallback to `commit.files` (when `baseSha` is null) applies only to a resumed run that has no recorded `baseSha`. Since P02, `commit.files` is also unquoted. |
| H2: leak through a write chain | **Fixed, but now too strict after P02** | See R2-M1 below. The integrate skip at `runner.mjs:465` now runs in a test. It still happens silently (R2-M2). |
| M1: writer after integrate forks from `HEAD` | **Not fixed** (listed as a residual) | Reproduced: with an integrate step that declares `target: integration`, the next writer's `baseRef` is `HEAD` and it reports "Seen: none". |
| M2: plan door refusal | **Fixed** | Only a units file is refused (`resolveStart`). A preset with two bases keeps `HEAD` (tested). Single-writer chaining still applies to presets and plans; the lane report lists this in its CHANGELOG delta. |
| M3: silent fallback to the shared checkout | **Fixed** | `prepError` at `runner.mjs:534-557` fails the unit with the real cause. Tested by deleting the base branch. |
| M4: unit id not safe as a branch name | **Fixed** (one gap, R2-L1) | `units-source.mjs` `BRANCH_SAFE_ID`. |
| M5: commits outside `result.commit` missed | **Fixed** for committed paths | The diff covers the whole branch. |
| L1: `--seats` with units | **Fixed** | Refused in both `resolveStart` and the CLI. |

## Critical

None.

## High

None.

## Medium

### R2-M1. After P02, out-of-scope inheritance blocks a clean downstream writer (reproduced)

`runner.mjs:617` merges the base unit's whole `outOfScope` list into B's.

Since P02, `commitUnitWork` commits only in-scope paths. An out-of-scope file the producer wrote stays **uncommitted** in A's worktree. The probe confirmed this: A's branch tree was `.gitignore, README.md, a.txt`, A's worktree status was `?? stray.txt`, and A's commit had `outOfScope: ["stray.txt"]` with `files: ["a.txt"]`.

B is forked from A's branch, so it never sees `stray.txt`. The probe confirmed this too: B's tree had no `stray.txt`, and B reported "Seen: none". B still inherits `outOfScope: ["stray.txt"]`, which demotes it to `findings`.

- **Scenario:** a preset with `A(reviewed, accepts findings) → B(reviewed, accepts findings) → integrate`.
- **Impact:**
  - B's clean branch is skipped at integrate.
  - `b.txt` never lands.
  - The workflow ends `completed`, with integrate `pass` (see R2-M2).
- **Phantom test:** the test at `test/workflow/units-runner.test.mjs:272` still passes, but for a different reason than it claims. Its comment at `:286` ("w-b ... carries the stray file too") is now false: no branch ever holds `stray.txt`.
- **Why inheritance is still needed:** a producer that commits by itself (the M5 case) puts the stray path on A's branch. B's diff `A.tip..B` then cannot see it. No test covers this case.
- **Fix:**
  - Inherit only the base's out-of-scope paths that are actually on its branch: the `git diff -z base.baseSha base.branch` subset that falls outside the base's scope.
  - Or record that committed subset as its own field on `unit.complete`, and inherit only that field.
  - Add two tests:
    - a producer that commits a stray file itself, where B must inherit it;
    - an uncommitted stray file, where B must pass and be integrated.

### R2-M2. Skipping a branch at integrate is still silent, so a run can report "completed" with nothing merged (reproduced)

`runner.mjs:465` `continue`s past a unit with `outOfScope`, and `:474` swallows every merge error, including conflicts. The step is then recorded with `outcome: 'pass'` (`:486`).

- **Probe:** writer A accepts findings and writes a stray file, followed by an integrate step. Result: `status: completed`, `land.outcome: pass`, and `a.txt` is not on the trunk.
- The only trace is the kept worktree, whose reason reads "unit ended findings".
- **Impact:** an operator reading `workflow status` believes the work has landed.
- **Fix:**
  - Record the skipped and failed merges in the `step.complete` payload, e.g. `skipped: [{unitId, reason}]`.
  - When nothing was merged, make the integrate outcome `findings`.
  - Never swallow a merge conflict.

### R2-M3. The units-file refusal gives advice a units file cannot follow

The refusal message (`runner.mjs:252`) and the `--units` help in `command-registry.mjs:1625` both tell the user to "add an integrate step". A units file cannot do that:
- `units-source.mjs` emits only unit steps.
- `validateUnit` has no `kind` field.

This is round-1 M2 again, moved from plans to units files.

- **Fix:** for a units file, say "merge these units into one, or run them as separate workflows". Keep the integrate-step advice for preset definitions only.

### R2-M4. Writer after an integrate step (round-1 M1): residual, still reproducible

- Accepting this as a residual is reasonable for M1.
- The help text and spec delta both say "an integrate step ends the walk". Neither says that the next writer starts from the main checkout's `HEAD` rather than the integration target. State that, so a preset author does not rely on the wrong base.

## Low

- **R2-L1.** `BRANCH_SAFE_ID` accepts an id that ends in `.`, e.g. `fix.`. Probe result: the unit fails at run time with "could not create the unit's worktree ... is not a valid branch name". The failure is now clean (no fallback), but it is late rather than at start. Fix: also refuse a trailing `.`, or use `git check-ref-format --branch`.
- **R2-L2.** `bin/fgos.mjs:2220` treats `--foreground false` as a swallowed workflow id. With the new exactly-one rule (`:2228`), `workflow start --plan p --foreground false` is now refused with "exactly one of". Before, it started the plan. This is unlikely in practice: skip `'false'` in `swallowedId`.
- **R2-L3.** `--effort` is checked only against the canonical levels at start. Support on each executor is checked at bind time. A multi-unit run can therefore spend its earlier units and then be refused on a later unit whose executor does not support the level. `fgos run --effort` fails before spending anything. Consider dry-binding effort at start for units files, or document this.
- **R2-L4.** `workflow resume <id> --effort x` is silently ignored, while `--seats` on resume is consistency-checked. Refuse it, or say in the help that resume ignores it.
- **R2-L5.** All CLI tests use `--foreground`. The detached `--units` path is correct by reading: `prepareWorkflowRun` stores the built workflow and `effort`, and `workflow resume` reads `state.workflow` and `state.effort`. No test proves it. A detached units start followed by a status poll would close this gap cheaply.
- **R2-L6.** The fallback in `outOfScopeWrites` fails open: if `git diff` errors, `gitOut` returns null and the result is an empty changed list. That case cannot leak a stray file, because the branch would be unreadable for integrate too. Still, an unreadable branch should fail the unit, not report "no out-of-scope".

## Persona refactor (`6430fd232`)

**Verdict: correct and intended. No other dependency found.**

- `bind.mjs:410-440` (from phase 04) ranks the matching override persona first, then `unit.persona` (source `unit`), then locked, then capability.
- `roleUnit` (`patterns/role-tasks.mjs:58`) spreads the unit, so producer, checker, panelist and synthesizer all keep `unit.persona`. The old unit-wide override applied to every role in the same way.
- **Seats:** the seat-scoped overrides come first and still pin persona text (`run.mjs` `pinnedPersonaFor` reads role-scoped overrides only). The test "a named persona lands on its own seat only" still asserts `preferPersona` for each seat and passes.
- **`preflightWorkflowSeats` / dry-bind:** `seatedPanelUnits` never carried persona or overrides, before or after this change. Persona does not influence which executor is chosen, and no caller passes `lockedPersona`. Dry-bind therefore cannot diverge from the run on this point.
- **Locked persona:** `lockedPersona` is never supplied outside `bind`'s own parameter list (checked with `rg`), so the refusal path behaves the same.
- **Presets with persona** (`content-publish.yaml`, `nominal-group`, `architecture-advisory`, `group-cognition`): the persona now travels on the Unit. Only the provenance changes, from `override:workflow` to `unit`. `rg` finds no consumer of `persona.source` or `origin: 'workflow'` other than the two updated tests.
- **Effort:** effort no longer rides on a unit-wide override. Its provenance is now `override:human-cli`, which resolves round-1 L2.

## CLI (`ced5dc4cc`)

- The exactly-one-source rule, the refusal of `--seats` with `--units`, and `requireField` on `--units`/`--effort` are correct.
- A swallowed id counts as a source, so `--foreground delphi --units f` is refused.
- The bare-flag cases behave correctly:
  - `--effort` followed by another flag fails `requireField`.
  - A bare `--plan` counts as a source.
- `units-source.mjs` resolves the units-file path against `process.cwd()` (`path.resolve`), not `--dir`. This is consistent with `--plan`.
- Test quality:
  - The six CLI refusal cases assert that no run directory exists.
  - The end-to-end CLI test checks effort in argv and the chained `writeBranches`.
  - The detached path is not tested (R2-L5).

## Recommended actions

1. **R2-M1:** inherit only the committed out-of-scope paths, and add the two tests (self-committed stray, uncommitted stray).
2. **R2-M2:** surface skipped and failed merges in the integrate step's outcome.
3. **R2-M3:** give the units-file refusal advice a units file can follow.
4. Lows as time allows. R2-L1 and R2-L2 are one-line fixes.

## Unresolved questions

- Should a writer whose own branch is clean be integrated when the writer it builds on had out-of-scope writes that stayed uncommitted? The spec says out-of-scope keeps *that* unit's branch out. R2-M1 assumes the downstream writer is judged by its own branch content.

Status: DONE_WITH_CONCERNS
Summary: The round-1 H1, M2, M3, M4, M5 and L1 findings are fixed. The persona refactor and the CLI are correct, and the focused suites are green (119/119 on the rebased HEAD). After the P02 rebase, out-of-scope inheritance wrongly blocks clean downstream writers (R2-M1, reproduced), and integrate still skips branches silently and reports pass (R2-M2).
