# Composition fixes after the D6 holders (Doer brief, records slice)

Status: Lead brief under L12-137. It follows `reviews/w8-composition-review.{md,json}` (164 APPROVE / 19 REWORK); read it first. Lead rulings under A42 are in owner-answers L13-11. Recompose everything against the **current bytes at HEAD**, and replay each action with `patch --fuzz=0`, checking forward and rollback byte equality.

1. **`docs/specs/workflow.md` park.** Recompose it against the new holder `docs/platform/workflow/spec.md` (lines ~654, ~691). Use one target, the decision record. Drop or mirror the hunk in the retiring legacy file.
2. **`docs/enduser-docs-index.json`.** The cutover command is `fgos docs-index`, run on the cutover checkout. Its proof is that `fgos doctor` passes `enduser-docs-index-stale`. Before that, record each of the 2 dropped docs as carried or retired.
3. **`docs/ui-spec/generated/wireframe-v2.html`.**
   - The command is `(cd .claude/skills/ui-spec/tools && npm ci) && node .claude/skills/ui-spec/tools/interpret-wireframe.mjs --root docs/ui-spec`.
   - Record the stale committed render (`f06815ee` vs `77894fdd`) as its own step.
   - Proof: `validate.mjs --root docs/ui-spec`.
4. **Family 17.** Update the area-holder table:
   - seat-binding → `docs/platform/seat-binding/spec.md`;
   - workflow → `docs/platform/workflow/spec.md`;
   - the two end-user scopes → the two sections of `docs/platform/work-state/contracts/knowledge-registry.md`, with their decisions under `docs/platform/work-state/decisions/`.

   Then recompose `convention:area-holder-table` and `status-units:docs/platform/governance.md`. In `reference-003643` and `reference-003666`, replace `recomposed-predecessor:src/cli/command-registry.mjs` with the current `w2:predecessor:` spec.
5. **Both switchboards (f08382–f08384, f06749–f06751).** Point the end-user owner row at those two knowledge-registry sections and recompose the whole action. Replay it, then run `check-doc-candidate-status` and `doc-link-pass`.
6. **system-overview f07928/f07929.** Recompose the base spec and the partial spec at current bytes, and add the two rows (HEAD lines 44–45 already link the holders).
7. **architecture-intent, 8 rows (ruling L13-11).**
   - Point 5 of them at the candidate copies: `docs/platform/proposals/{step-09,step-10,component-authority-boundary-map}`, the system-vision file under `system-architecture/architecture/`, and `agent-coordination/proposals/team-communication-protocol-v1.md`.
   - Label the links to the intent ledger, the coordination-session and the flow-definition as history (retired engine).
8. **GAP-05 `dynamic-023895`.** Rebase it on HEAD bytes. Write the 88 binding overlays for the 22 moved headings (s6-readme 12, s6-layout 10, s14-resync-b 66). Show that `test/runner/dead-vocabulary-guard.test.mjs` passes with the move applied in scratch. Lead approval is recorded in L13-11; G0 review follows.
9. **Citation drift.**
   - Exclude `*/history/*` from the widened scan, with a negative control.
   - Prepare glosses for the 10 branch-only sites, reusing the legacy glossed text for work-state.
   - For the 130 main-owned sites, write a prepared gloss patch set that applies at final pin F under the docs lease (ruling L13-11). Do not change the baseline.
10. **Re-pinning.** For the 11 park actions whose files changed after the record pin, re-pin the 9 that still apply at HEAD, and recompose the component-boundary predecessor and the step-07 system-overview base spec.
11. Update `composition/receipt.md` and its JSON records with counts and every command's exit code.

Writable (exact): plans/260925-documentation-authority-unification/reports/phase-09/composition/**, plans/260925-documentation-authority-unification/ledger/decisions/**, plans/260925-documentation-authority-unification/reports/phase-07/** (patch and spec records only, if that is where the specs live; otherwise stop and report). Do not edit docs/ in this turn: every doc change is a prepared, replayed patch. No pair accounting. Never a git write (the runner commits), never the fgos CLI, never .fgos/ or secrets, never code or tests, never scripts/run-tests.mjs or npm test (single test files are allowed with `env -u CLAUDE_CODE_SESSION_ID FGOS_HOST_BIN=<releasePath>/bin/fgos node --test <file>`). Always `python3 -B`. Scratch /tmp/fgos-work/w8-comp-fix/ only.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
