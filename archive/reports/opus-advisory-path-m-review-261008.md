# Independent review: advisory path M (2026-10-08)

Target: worktree `advisory-path-m`, uncommitted diff vs `a0226f022`. Read-only. Narrow tests run with `CLAUDE_CODE_SESSION_ID` unset.

## 1. Scope and budget (recomputed)

- Source + bin: 88 changed lines (+65 −23). Claim matches. Docs: runner.md 6, CHANGELOG 1, plus a 36-line plan report = 43. Matches.
- Reopen YAML: 48 lines. Skill: 149 lines. Renders under `.agents` and `plugins`: identical to core except the generated header. `.claude` wrapper: description changed only. OK.
- Dispatch: only `cli.mjs` and `settlement.mjs`. No new file. `--context-ref`: one field. Both YAMLs are linear, with no third definition and no branching.
- Scope creep: `template.contextRefs` is a **new** template field, used by no YAML. It did not exist at base, so the handoff's "same validation as template.contextRefs" was satisfied by creating it. It is small, but it is an unrequested surface. `{{report:<step>/<unit>:missing expertise}}` is a new generic gate-template feature in `src/workflow/runner.mjs:117`, yet runner.md:1426 calls it "the **existing** human gate.question reference". That claim is false.

## 2. Settlement blast radius (HIGH)

`settlement.mjs:313` maps `done` + `assessment.verdict:'findings'` to settled `findings` on **both** the read-only and the mutating branch (`:336`). The second branch goes beyond the handoff ("keeps a reviewer's findings").

Consumers:
- **Reviewed pattern** (`reviewed.mjs:218-231`): a done reviewer's findings now trigger producer round 2 (default `maxRounds` 2). If findings survive, the outcome is `findings`. Before, the unit ended `pass` after round 1. This applies to every reviewed unit:
  - `domains/coding/workflows/feature.yaml:101,142` and `domains/marketing/workflows/content-publish.yaml:21` have **no acceptOutcomes**, so they now get an extra round, then the step fails. The direction is arguably correct, but it is untested and not acknowledged in the spec or changelog.
- **Coding stage pipeline**: `run-result.mjs:1194` makes verdict `findings` into category `verdict`, so `satisfied=false` (`:1363`). In `operation-choice.mjs:1745`, a non-verdict operation (implementer, mutating) whose done claim volunteers `assessment.findings` now stops with `insufficient-confidence`. Before, it advanced. There is no test.
- **Panel** (`panel.mjs:58`): resume only reuses seats with `outcome==='pass'`. A seat that volunteered findings is re-dispatched on resume, which costs extra and re-runs a blind seat. Low risk.
- **History** (`unit-run-history.mjs:26`): already mapped findings, so it is now consistent.
- **Still laundered**: done + `assessment.verdict` of `inconclusive`, `blocked` or `not-applicable` still maps to `pass` (`:313`). A red-team saying "inconclusive" is approval.
- **Default without acceptOutcomes**: still safe. Findings stop the step (`runner.mjs:448`) and execution failures stop.
- **Test coverage**: only `assignment-runresult.test.mjs:1599` covers done+findings. The workflow contract fixture has reviewers claim `status:'failed'` (`advisory-m-contracts.test.mjs:52`), which is the **pre-existing** failed-claim branch (`settlement.mjs:270`). Those three workflow tests would pass on base settlement.

## 3. withRunDirReadAccess

- Layout is correct. `run.mjs:634` gives attemptDir `unitDir/role/round/runs/01`, so `dirname²` is assignmentDir. `copyHandoffsInto` writes `assignmentDir/inputs` inside `dispatchBound` (`run.mjs:302-321`), before args are built, so `existsSync` is true when it matters. For non-unit dispatch (`cli.mjs:198`), inputs is absent and skipped. No traversal: the path comes from runDir, not input.
- Merge: the dirs are inserted after the user's first `--add-dir`, which is valid for claude's variadic `--add-dir`. Both the REPL (herdr) and the prompt use stdin/pane, so no positional prompt gets swallowed. The `--add-dir=x` form falls back to append, which is still valid. The test is real and file-based. OK.

## 4. --context-ref

- Validation is the same function for the template and the CLI. It persists in `workflow.start`, and the projection re-reads it on resume (tested at `workflow-runner.test.mjs:1379-1391`).
- Plain refs are relative and passed unresolved (`handoff-refs.mjs:229-243`), so they resolve against **worker cwd = `--worktree`**. With `--dir forgentX --worktree mcp-skill-hub`, a parent report path such as `.fgos/assignments/...` points into mcp-skill-hub and does not exist. Absolute paths are rejected. Only `unit-run:<id>/<role>` works across repos, and the skill never mentions it (SKILL.md:85-89 says "report paths"). **The reopen is broken cross-repo as documented.**
- Escape: `unit-run:` is confined to `.fgos/assignments` (`handoff-refs.mjs:119`). Paths allow any in-repo file, from the same principal. Acceptable.
- Incomplete parent: the resolver throws `no-such-role`/`no-report` at unit prep and the run fails loudly. OK.
- `--context-ref` with no value pushes `true`, which is rejected. On other verbs it is silently ignored. Minor.

## 5. YAMLs

- Synthesis is `reviewed`, rigor high, `minCheckers [reviewer, red-team]`, and the checkers target producer round N (asserted). OK. Reopen is root synthesis, gets refs, and has no seats. OK.
- Close gate parsing (`runner.mjs:117-133`): `JSON.parse` of an `agent-report.md` written by a real LLM. A fence, a heading or a prose preamble throws `SyntaxError` with no field name. Absent or non-array values throw a clear error. All of these fail loudly **after the whole run**, without `gate.park`. Resume re-throws deterministically, so the run is wedged. The test asserts only "no gate.park" and does not assert the run status. **This is the biggest live-run risk.**

## 6. Skill (390 → 149 lines)

Rightly cut: driver-disposition file, continuity driver, executor recipes, historical dispatch lessons.

Lost and needed:
- The `fgos workflow status <id>` and `fgos workflow answer <id> --step close --answer` doors. The new skill forbids status and never says how the owner sees or answers the close gate. Reading through the CLI door is not reading run-state files; the handoff did not forbid it.
- The `dispatch decide --for` command for the safety prerequisite. Lines 48-51 now demand bind/posture evidence with no way to obtain it.

Wrong content: lines 123-140 hold plan state (M, packet `bab4742a`, stall rules, parked dispatch list). That is shipped into plugins for other projects and breaks the "no plan IDs in artifacts" rule. Same problem in runner.md:1427.

Over-claims: none on resume, specialist or bytes; these are explicitly denied.

## 7. `.fgos/config.json:1292`

- The flag is on `claude-herdr` (`claude-herdr-bwrap`), which serves 14 capabilities: architecture:\*, delphi:\*, group-cognition:\*, and nominal-group:\*. All of those workers lose every MCP server (GitNexus, mdview), because there is no `--mcp-config`.
- The file is tracked and project-local to forgentX only. It applies to mcp-skill-hub runs only when `--dir` is forgentX. mcp-skill-hub has no `.fgos`, and global `~/.fgos/config.json` has no `claude-herdr`. With `--dir mcp-skill-hub`, the flag and the executor are both absent.
- mcp-skill-hub has a `.mcp.json`, which is presumably the stall it targets. The invocation command needs to be pinned.

## 8. Tests

6 files, 109 pass, 0 fail (contracts, advisory workflow, panel, run-herdr, assignment-runresult, workflow-runner). The full suite was not run (UNPROVEN).

The two weakest assertions:
1. In `advisory-m-contracts.test.mjs`, `reviewed.outcome==='findings'` is driven by a `failed` claim. It does not exercise the new settlement branch.
2. In `workflow-runner.test.mjs:1422`, malformed packets are checked only for "no gate.park". It does not check run status or recoverability.

The deleted panel test removed one obsolete assertion along with its stance coverage. Stance is still covered in role-tasks.test.

## 9. Docs

- runner.md has a false "existing" claim. It holds plan IDs in an evergreen spec. It does not mention that the mutating-branch findings change and the 14-capability MCP effect.
- The changelog line is fine.
- No doctor row is needed: the flag is project config, not a shipped default.

## 10. Verdict: land after fixes

Ranked by risk:

1. **BLOCKING (live run)**: make the close gate robust. Strip a fenced or leading-prose JSON block before parsing. On failure, record a terminal `workflow.fail` with a clear message, or park with an "unreadable packet" question, never a wedged run. Add a test for the run status.
2. **BLOCKING (live run)**: decide and record `--dir` for the mcp-skill-hub run. If `--dir mcp-skill-hub`, the flag in forgentX config is inert and `claude-herdr` is unknown.
3. **HIGH**: restrict the settlement change to the read-only branch, as specified, or add a test plus spec/changelog lines for the mutating and coding-stage effect. Add one done-claim reviewer case to the contracts fixture. Consider mapping `inconclusive`/`blocked` to their own verdicts in the read-only branch.
4. **HIGH (reopen, not the first live run)**: have the skill document `--context-ref unit-run:<id>/producer` refs (or resolve plain refs against `mainRoot`). Restore the `fgos workflow status`/`answer` doors in the skill.
5. **MEDIUM**: remove the plan/M content from SKILL.md:123-140 and runner.md:1427, and fix "existing" at runner.md:1426.
6. **LOW**: drop unused `template.contextRefs`, or note it. Have panel resume reuse `findings` seats.

Not blocking: the `withRunDirReadAccess`, `--context-ref` persistence, panel params and acceptOutcomes default.

## Unresolved questions

- Does a throw in `advanceWorkflowRun` leave the status `running`? Code read suggests yes; not run.
- Should the skill's "no run state" rule allow `fgos workflow status`/`answer`? That is for the owner to decide.
- Are coding `feature.yaml` reviewers expected to now loop on done+findings? Intent unknown.
- Does the Rust host pass repeated `--context-ref` through unchanged? Not checked.
