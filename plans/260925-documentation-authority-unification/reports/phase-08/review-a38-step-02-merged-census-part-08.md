# Independent review: Step 2 merged census, part 08 (evidence-lexical-refresh)

- Reviewer: `reviewer:sonnet-session:a9ff68c3627714a31@2026-10-19`
- Reviewed worktree commit: `0689b862e` (accounting); author commit `ce84b84e7`; input HEAD `587c2a791`
- Part: `plans/260925-documentation-authority-unification/reports/phase-08/step-02-review-part-08.json`
  sha256 `ff882e42976ec572dde238b9ddfd7fe4c2cbc12f81f85eb3b8f40219dee11d96`, 24 entries (evidence-181 ... evidence-204)
- Read-only; no CLI, no inventory load, no `.fgos` read.

## Mechanical checks (all 24 entries)
- fileDigest equals sha256 of the file at 0689b862e: 24/24.
- Each occurrence line's text equals the cited callSite, and each matchedExpression is a substring of it: 24/24 (evidence-195: 868 lines, all verified, matches the 868 baseline keys incl. README).
- Each row is identical to the same-path row in `step-02-evidence-consumers.json`; source == sourcePath, no render copies: ok.
- legacyForm flag consistent with the spellings (`docs/architect/...` present => true; platform-only or `../agent-coordination/...` => false): ok.
- L12-7: no edit performed or authorized for a docs/specs or docs/architect consumer in these rows; all pre-cutover actions are no-edit/preserve: ok.

## Semantic checks vs evidence-payload-relocation-policy consumer table
- Fixtures 199-204: policy says recorded history, must not be rewritten. Rows say preserve bytes. `run-outcome.test.mjs` and `usage-parsers.test.mjs` only read the fixture file itself; embedded paths are data. Correct.
- Code comments 196-198 (`config.mjs`, `trust-store.mjs`, `worker-home.mjs`): verified to be comment lines; policy says comments only go stale and are repointed; no-edit now plus cutover repoint is consistent.
- Historical reports 189-194 (plans/reports): immutable record, preserve and lookup alias; correct.
- Platform docs 183-188: promoted-area/proposal links, repoint at cutover; consistent with policy ("19 outside the payload tree").

## Rows

| id | path | verdict | reason |
|---|---|---|---|
| evidence-181 | docs/platform/agent-coordination/playbooks/coordination-operating-harness.md | needs-Lead-judgment | Lines 421/474/475 are not plain links: they are a track write destination and executable `test -s .../index.md` / `current-cell.md` checks on the live platform verification tree. Row cutover "candidate mirror navigation" does not say whether new-track writes and these checks move or stay with the payload relocation (policy rule 6: what runtime/coordinator flows read or write stays put). Lead to settle writer destination. Digest/lines ok. |
| evidence-182 | .../playbooks/prompts/master-coordinator.md | needs-Lead-judgment | Same: line 159 is the persistent-state write destination `<REPO_ROOT>/docs/platform/agent-coordination/verification/<TRACK>/`. Writer convention, not navigation. |
| evidence-183 | docs/platform/host-invocation-routing/history/documentation-migration/documentation-standardization-plan.md | ok | Link to canonical README (not a payload); its relative target already resolves wrongly (no `history/agent-coordination/`), so trace-and-review is the right action. Note only. |
| evidence-184 | docs/platform/proposals/coordination-envelope-probe-contract.md | ok | Two relative links resolve to docs/platform/agent-coordination/verification/architecture-advisory-panel/{current-cell,index}.md; reader, prose. |
| evidence-185 | docs/platform/proposals/coordination-worker-provider-boundary.md | ok | Three relative links to coordination-envelope payload files; reader, prose. |
| evidence-186 | docs/platform/proposals/step-09-group-thinking-substrate.md | ok | Two relative plus one legacy `docs/architect/...` prose path; legacyForm true correct. |
| evidence-187 | docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md | ok | Historical prose statements (probe script location) plus one relative link; legacyForm true correct. |
| evidence-188 | docs/platform/system-architecture/architecture/architecture-intent.md | ok | Prose citation of legacy P05.2 path; repoint at cutover; correct. |
| evidence-189 | plans/reports/fork-260928-1017-panel-depth-experiment-design-research-report.md | ok | Historical record, preserve bytes. |
| evidence-190 | plans/reports/from-implementer-to-architecture-reviewer-260907-2212-...-brief.md | ok | Historical record, preserve bytes. |
| evidence-191 | plans/reports/from-implementer-to-red-team-260907-1050-...-review-prompt.md | ok | Historical record (past prompt), preserve bytes. |
| evidence-192 | plans/reports/review-prompt-260911-1654-runtime-recovery-design-second-opinion.md | ok | Historical record, two lines, preserve bytes. |
| evidence-193 | plans/reports/review-prompt-260911-1805-runtime-recovery-detailed-design.md | ok | Historical record, preserve bytes. |
| evidence-194 | plans/reports/reviewer-p03-1-260905-0251-skill-authoring-review-report.md | ok | Historical record, preserve bytes. |
| evidence-195 | scripts/check-legacy-docs-ratchet.baseline.json | rework | Row is a sha256-keyed ratchet baseline (868 path keys = 867 payload + README), not navigation. Its cutoverAction "candidate mirror navigation after digest/mode manifest and reviewed target mapping" is wrong: policy table says deleting any baselined file fails `unexpected-deletion` (loader refuses deletions), and the evidence file's own policyTreeWalkers entry says "preserve all frozen B inputs". Correct cutover action: preserve the frozen baseline unedited; payload removal/relocation needs a ratchet exception/retirement decision handled with the script and `.exceptions.json` (Step 5/6). Pre-cutover "no edits" is right. |
| evidence-196 | src/runner/dispatch/config.mjs | ok | Verified block-comment line 988; comment only, no runtime read. |
| evidence-197 | src/runner/dispatch/trust-store.mjs | ok | Verified `//` comment line 12; comment only. |
| evidence-198 | src/runner/dispatch/worker-home.mjs | ok | Verified `//` comment line 31; comment only. |
| evidence-199 | test/fixtures/run-outcome/legacy-derivation.json | ok | Recorded fixture, 20 recorded path strings; preserve bytes. |
| evidence-200 | test/fixtures/run-result/real-shapes/03-v1-done-inferred.json | ok | Recorded fixture, preserve bytes. |
| evidence-201 | test/fixtures/run-result/real-shapes/05-v1-done-reported.json | ok | Recorded fixture, preserve bytes. |
| evidence-202 | test/fixtures/run-result/real-shapes/14-v2-completed-blocked-reported.json | ok | Recorded fixture, preserve bytes. |
| evidence-203 | test/fixtures/run-result/real-shapes/15-v2-completed-not-applicable-failed.json | ok | Recorded fixture, preserve bytes. |
| evidence-204 | test/fixtures/usage/pi-multiturn-no-agent-end.jsonl | ok | Recorded fixture; paths are inside recorded prompt text (3 lines, 5 matches); preserve bytes. |

## Totals
- ok: 21 (183-194, 196-204)
- rework: 1 (evidence-195)
- needs-Lead-judgment: 2 (evidence-181, evidence-182)
- Rework rate 1/24 (4.2%), above the 3% threshold, so the affected set (ratchet/gate rows) should go to full review per the request after Lead resizing.

## Notes
- Deep reads: all 24 (exceeds the minimum of 10). Mechanical replay was done by custom per-row checks, not the full request script.
- Not verified here: the other parts, semantic readiness of any rewrite, dynamic populations.
- Smallest next action: Lead fixes evidence-195 cutoverAction wording/class, and decides write-destination handling for 181/182 (writer convention vs mirror navigation).
