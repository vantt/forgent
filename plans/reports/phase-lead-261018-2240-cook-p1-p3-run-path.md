# Cook path cleanup and run path fixes: lead report

Plan: `plans/261018-2240-cook-path-cleanup-and-run-fixes`. Branch `worktree-agent-a0c1ec15798588c09`, forked from main at `339ecbee0`. Nothing merged, pushed or activated.

## Commits

| sha | subject |
|---|---|
| `ad6c3d6b2` | refactor(skills): rename the fgOS cook command to deliver and drop stale coordination teaching |
| `48d457a53` | feat(run): keep verify and skills on the Unit, bound the verify step, and require a family per seat at high rigor |

## Phase 1: what changed per requirement

1. **coordination-driver.md.** Every `fgos coordination ...` command is gone. Observe points to `fgos workflow status` or the Unit's `.fgos/assignments/<unitRunId>/` record, choose-an-action to `fgos workflow operations`, dispatch to the two doors (`fgos run`, `fgos workflow start|resume|answer`) plus `fgos dispatch decide`, dispositions and close to the continuity artifact. The `actionKey`/`writerId` wording went with them. The cycle, hook slots and invariants are kept; the doctrine was not rewritten. Renders rebuilt with `npm run build:skills`.
2. **Two-doors plan** frontmatter is `status: completed`.
3. **`docs/specs/runner.md`.** The sentence "Workflow dùng DAG steps + tích hợp vòng đời Work" now says Workflow is a DAG of Units that does not know Work; Work is a consumer (an item carries `workflowRunId`). Found by text (line ~1486). No history line: it is a factual correction, not a decision.
4. **Rename.** `plugins/fgOS/skills/cook/` to `deliver/` (`name: deliver`, `git mv`). Live references updated: the two `fgos-coding-driving` caller mentions and `caller-contract.md` (source under `domains/coding/skills`, renders rebuilt), comments in `src/setup/skill-wrappers.mjs`, `src/setup/registrations.mjs`, `scripts/check-decision-citation-drift.mjs`, the two tests that name the path. The skill's "stage" wording now uses the driver's own words (position: workflow step while live, status once frozen; Work carries no `stage`).
   - Self-contradiction in `fgos-coding-driving`: the roadmap's quoted sentence is "Work items do not have `stage`" next to a loop built on `stage`. It now says a Work item records `workflowStep` (older name `stage`, which the document still uses for that value). A second contradiction, found while reading, is also fixed: the Hard rules and the discovery skill say the discovery skill calls `fgos discover` itself, while Step 5 and `loop-mechanics.md` Step 8 said the loop applies the verdict on its behalf. Both now say the skill calls it.
5. **Baseline.** `scripts/check-decision-citation-drift.baseline.json` regenerated with the script's own `--write-baseline` (skills dirs `.agents/skills` and `plugins/fgOS/skills`, the dirs the existing keys come from). Diff checked before staging: the `cook` key became `deliver`; keys of skills that no longer exist (`fgos-unlock`, `unlock`, `check`, `fgos-coding-compounding`) and a few stale entries dropped out. Net 3 insertions, 59 deletions, `no new findings (205 baselined)`.
6. **CHANGELOG** `[Unreleased]`: one Changed line for the rename (and the coordination fragment).

Validation: `/fgOS:cook` appears nowhere live outside history. What is left, on purpose: `docs/knowledge/**`, `docs/explanation/**`, `docs/journals/**`, `docs/architect/**` and `docs/platform/agent-coordination/**` (dated records that describe the old skill as it was), the `docs/specs/runner.md` decision record that cites `cook/SKILL.md:36-39`, `docs/enduser-docs-index.json` (generated from knowledge docs), `.fgos` event history, and `CHANGELOG.md` history lines. Tell me if you want the knowledge docs rewritten; I treated them as history.

## Phase 2: what changed per requirement

1. **`verify` on the Unit.** `validateUnit` keeps `verify` (non-empty string) and also `skills`. Carried through the units-file loader (`units-source.mjs`), the workflow template (`definition.mjs`) and the Unit the workflow runner builds (`runner.mjs`), so every door has the same fields.
2. **Verify runner with timeout.** `run.mjs` no longer uses `execSync(..., timeout: 60000)`. It calls the existing `runCommand` (`src/runner/goal-check.mjs`, the runner `return`/`approve` use) with `runner.timeoutMs`. Prior art: that key is already the verify timeout of `return` and `approve` (`resolveVerifyTimeoutMs`), loaded with a default (900000 ms) and validated, so no new key and nothing new to register in setup or doctor. Non-zero exit, could-not-run and timeout are each a finding naming the status and the last 20 lines of output. The command lookup is now one function, `verifyCommandOf` (Unit, then capability), used by both the pattern and the runner.
3. **No pinned `npm test`.** Removed from the `code-change` preset. Prior art (`git log -S`): the preset value came from the first pattern commit; the runner never read `params.verify`, so the old preset recorded a verify pass that ran nothing. `params.verify` no longer counts as a verify source. A reviewed run with no verify command returns `verify: { ran: false, reason }`.
4. **One-liner flags.** `fgos run "<prompt>" --input <a>,<b> --verify "<cmd>"` set `inputs` and `verify`. Both refused beside `--unit`/`--resume`; empty values refused before a unit run exists. Help, `invoke`, parameters and an example updated in `command-registry.mjs`; `fgos-run` skill (source under `core/skills`) updated.
5. **`docs:write`** is a curated slot in `DEFAULT_CAPABILITY_SLOTS` (description-only, `serves: change/docs/mutates`), with a row in the shared capability catalog and a mention in `capability-matching.md`. `fgos setup` adds it through the existing config merge.
6. **Skills at flow level.** `bind()` skips an executor whose `supports.skills` (new optional key, shape-checked in `config.mjs`) lacks any skill the Unit names, and refuses with `skills-unavailable` naming them when none is left. See decisions.
7. **Rigor high/critical.** `requiresDistinctFamilies` (effective rigor = stronger of unit and capability floor, as `bind()` computes it). When true, each checker is `independentOf` the producer and every other checker. The provider-limit fallback walk now re-reads `independentOf` so a replacement keeps the property. Pool too small: the seat that cannot be placed is refused with the existing reason `independence`. `doctor`'s `workflow-pools-satisfy-independence` drives the same pattern code through dry-bind, so it reflects the rule without a change.

Spec: `docs/specs/runner.md` has a settled-facts bullet for all of this (including the supersession note). `CHANGELOG.md`: two Added lines, two Changed lines. No component-boundary change.

## Tests run

Counts are `node --test` totals; every run used `FGOS_HOST_BIN` (debug host from a private cargo dir) with `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`, `FGOS_SESSION_ID` unset.

- Phase 1 set (`test/skills/*`, `test/scripts/check-decision*`, `test/docs/*`, `skill-wrappers`, `architecture`): 271 pass, 0 fail.
- Phase 2 touched-module set (`test/runner/execution/*` incl. `patterns/*`, `test/workflow/*`, `run-verb`, `command-registry`, `fgos-workflow`, `execution-outcome-exit-codes`): 527 tests before my test edits, 2 failures (the two preset asserts on `npm test`, updated). After edits: `bind`+`unit`+`presets` 94 pass; `reviewed` 17 pass; `run.test.mjs` 76 pass (9 new); `units-runner`+`dispatch-executor-profile` 56 pass; `run-verb`+`units-source` 37 pass.
- New tests: Unit `verify`/`skills` validation; `verifyCommandOf`, params-verify no longer a verify, `requiresDistinctFamilies`, independence lists at high/critical vs standard/low; `bind` skills (filter, refusal reason, no-declaration, lead never takes over, checkers unaffected); `supports.skills` shape; real runs: three families at high, refusal with two families, standard shares, verify pass in worktree, failing verify carries status and output, timeout (`runner.timeoutMs` 4000 ms, kills at the limit), capability verify, no-verify note with the `code-change` preset, solo says nothing; units file and workflow template carry `verify`/`skills`; CLI `--input`/`--verify` (unit fields, empty and `--unit` refusals, help).
- Full `npm test`: 8143 tests, 7959 pass, 89 fail. Per file:
  - Not mine, release artifacts missing in the worktree (`target/release/fgctl`, `libfgos_node_addon.so`): `test/rust-host/fgctl-*`, `release-tree`, `release-targets`, `holder-lock/fences-rust-locks`. After `cargo build --locked --release --workspace` in the private dir, all of those pass.
  - Not mine, host env: `test/git/native-load.test.mjs` (3, `git-floor-unsupported`, host git is 2.34.1) and `test/holder-lock/fences-v1-tombstone.test.mjs` (1). I ran both files in a clean checkout of `339ecbee0` (no change of mine): the same 4 fail. Neither imports a module I touched.
  - Load timeouts and timing only under the full parallel run, each passes alone: `run.test.mjs` (killed at 600 s under load; 76 pass in 41 s alone), `loop.test.mjs`, `run-supervisor/crash-matrix-adopt-resume`, `run-supervisor/direct-crash-matrix`, `runner/assignment-runresult`, `runner/spawn-worker`, `state/state-cutover` (lock timeout), `rust-host/dev-host`, `rust-host/help-routes`, `rust-host/observe-store-lock`. Rerun together after the full run: 291 pass, 0 fail (the seven non-rust-host files); the rust-host ones passed in the rerun of that group (110 tests, only the 4 baseline failures above remained).

## Decisions taken

- **Verify timeout key.** Reused `runner.timeoutMs` instead of adding one (see Phase 2.2). If you want a separate verify limit, that is a new key and a setup/doctor registration; I did not add it.
- **0055 vs the new rigor rule.** Decision 0055 (owner, 2026-10-11) made family spread soft for panels and left `reviewed` hard only against the producer. The new rule is applied to `reviewed` only, at high/critical. `panel` is unchanged. Said in the spec bullet.
- **Which seats need skills.** Checker and panel roles are not asked for the Unit's skills, because requiring them would fight the independence rule for the same seats. An executor with no `supports.skills` provides none, so a Unit that names skills refuses until the config declares them; the session lead never takes over such a Unit.
- **Where the no-verify statement lives.** The return value of `runUnit` (and so `fgos run --json`), only for reviewed runs. It is not in `unit.json` or the summary.
- **Refusal reason for the rigor rule.** Kept `independence` (existing code, the detail names the roles) rather than a new code.
- **Citation baseline.** Regenerated whole by the script; stale keys dropped as a side effect (listed above).
- **Knowledge docs** that say `/fgOS:cook` were left alone as records.

## Feature ideas

None built. Candidates, each with a reason:
- A separate `runner.verifyTimeoutMs`: the seat timeout and the verify timeout are the same number today (15 min); a long test suite may want its own. Benefit: no coupling. Evidence: none yet.
- Show the `verify: { ran: false }` note in `unit-summary.json` and the human output of `fgos run`. Benefit: people who read the summary rather than `--json` see it.
- Apply the distinct-families rule to `panel` at high/critical too: needs a new owner decision against 0055.

## Open questions

- Should `docs/knowledge/**` and `docs/explanation/**` mentions of `/fgOS:cook` be rewritten, or stay as history?
- With the new rule, `architecture-advisory` (reviewed, rigor high) needs three provider families on a machine; the doctor check will report a pool with fewer. Is that the intended cost?
- Impact analysis: the GitNexus index is stale (`b334695`) and I did not run `impact`/`detect_changes`; blast radius came from grep of importers plus the full suite.

Status: DONE_WITH_CONCERNS
