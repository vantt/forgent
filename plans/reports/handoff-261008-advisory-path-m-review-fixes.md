# Handoff to the advisory agent: fixes from the independent review of path M (2026-10-08)

To: the agent on `feat/advisory-path-m` (`/home/vantt/projects/forgentX-worktrees/advisory-path-m`).
Read with: `handoff-261008-advisory-path-m-replaces-earlier-note.md` (scope, budget, stop criteria stay as written) and `opus-advisory-path-m-review-261008.md` (the review, with file:line).

## Owner decisions in this round

1. **One door for `findings`.** The settlement change stays on BOTH branches (read-only and mutating). Do not narrow it. Consequence: every reviewed unit in the repo must have an explicit, tested answer to "does a `findings` outcome stop the step or continue".
2. **MCP flag: option A.** `--strict-mcp-config` does not live in the tracked `.fgos/config.json`. It applies to the single live run only.

## Do now, in this order

1. **Commit the working tree on the branch now** (no push). It is uncommitted again.
2. **Close gate must not wedge the run (blocking).** `src/workflow/runner.mjs` around line 117 calls `JSON.parse` on the producer report. A code fence, heading or prose makes it throw after the whole run, and resume throws the same error. Make a malformed, empty or missing "missing expertise" field fail loud and recoverable: the gate still parks with a clear message (or the run ends in a named failed state), never a thrown parse error with a run left `running`. Tests assert the run status and a resume, not only that no `gate.park` happened.
3. **Settlement on both branches, tested for real.**
   - Add tests where the reviewer claims `findings` (not `failed`) through: advisory, business-discussion, group-cognition, coding `feature.yaml` (`validate-plan`, `implement-item`), marketing `content-publish` (`draft-copy`), on the mutating branch as well.
   - Coding `feature.yaml`: leave the default (`findings` triggers a revision round, then the step fails if findings remain) and say so in a test. Do not add `acceptOutcomes` there.
   - Marketing `content-publish` `draft-copy`: add `acceptOutcomes: [pass, findings]` (a human approval step follows). The owner may overrule this; report it.
   - `inconclusive` and `blocked` are still mapped to `pass` at the two sites. Do not change that here; list it as an unresolved item with the exact lines.
   - Check `src/runner/operation-choice.mjs` (around 1740-1760): does a settled `findings` verdict reach `isSatisfied` and cause `insufficient-confidence` for mutating operations? Report what you find. Fix only within the source budget; otherwise put it in the dispatch item.
4. **MCP flag for the live run.** Remove `--strict-mcp-config` from the tracked `.fgos/config.json`. Provide it for the one live run only (environment or a temporary config), without changing the 14 capabilities served by `claude-herdr`. Before the run, verify and write down: with `--dir` pinned to forgentX, where does the worker run and where is run state stored, and is the run still effectively "against `mcp-skill-hub`"? Put the live-run protocol in the report, not in `SKILL.md` or `runner.md`.
5. **`--context-ref` across repos.** A plain path is resolved against the worker cwd, so a cross-repo reopen gets paths that do not exist. Either resolve plain paths against the state root or reject them with a clear message; the smallest change wins. The skill names the working form (`unit-run:<id>/<role>`) and uses it. Verify that the installed Rust `fgos` host passes repeated `--context-ref` flags through unchanged.
6. **Skill.** Restore how the owner sees and answers the close gate (`fgos workflow status`, `fgos workflow answer`). Keep it within 200 lines.
7. **Docs.** Remove plan-specific content from `SKILL.md` (about lines 123-140) and `docs/specs/runner.md` (about line 1427): no packet ids, no stall rules, no acceptance-run wording. Fix `runner.md` line ~1426: the `{{report:...}}` gate syntax is new, not "existing".

## Unchanged

Budget (source 200, docs 100, skill 200, reopen YAML 60), the two named dispatch-file exceptions, the stop criteria and the 2026-10-10 deadline. Source is at 88 lines; if these fixes push it over 200, stop and report instead of widening the budget. No push, merge, activation or live run.

## Report back

Status, a short summary, the exact tests added, what you verified about `--dir`, the `operation-choice` finding, and unresolved items. The owner will have a second independent review before anything lands.
