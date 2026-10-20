# Review a38 - Step 4 wave 2, part 36 (set step04-026)

Reviewer: fresh-context A38. Pin dc24ce645. Payload step-04-wave2-p36.json (3 files, 21 slots). No checker, probe or script run; no writes to the worktree. All three files read through EOF (events-jsonl-truncation-guard 520 lines, gate-bypass 262, knowledge-registry 812), plus targets via `git show dc24ce645:<path>`.

## Per file

| File | Set / stratum | Verdict | Slots reviewed |
| --- | --- | --- | --- |
| src/state/events-jsonl-truncation-guard.mjs | step04-026 / unpatched sample | ok | 2 (both preserve, one wrapped edge class6-l-000414) |
| src/state/gate-bypass.mjs | step04-026 / patched | ok | 9 (8 preserve, 1 patch) |
| src/state/knowledge-registry.mjs | step04-026 / unpatched sample | ok | 10 (8 parked, 2 preserve) |

### events-jsonl-truncation-guard.mjs
- l-000414 lines 1-2 (`docs/history/` + `events-jsonl-git-tracked-truncation/CONTEXT.md`): wrapped named-history citation, both line slots preserve. Target exists at the pin (docs/history/events-jsonl-git-tracked-truncation/CONTEXT.md); L12-10 convention literal. ok.
- Step 5 exclusion line 140 (`docs/how-to/resolve-an-events-jsonl-truncation.md`) is inside a template-literal `message:` (runtime string), and that target is MISSING at the pin: correct to exclude to Step 5 (L12-60 ruling 1). The census id l-000415 plus the supplemental twin are both listed. ok.
- Bare `plan.md` (line 21) and `.fgos/...` paths are not edges. Diff empty, no behavior change possible.

### gate-bypass.mjs
- l-000419 (lines 3-4 wrapped), l-000420 (16), l-000421 (45), l-000423 (179), l-000425 (229), l-000426 (232): named `docs/history/<feature>/CONTEXT.md` evidence; all six targets exist at the pin; preserve correct. l-000424 (196) is the glob token `docs/history/*&#47;plan.md` (statistic about this repo's plans): preserve correct.
- l-000422 line 168 patch: source `design principle (docs/explanation/gate-bypass-design.md) exists to prevent.` The source path does NOT exist at the pin (moved by registry migration; doc-registry.json docId `why-gate-bypass-is-shaped-the-way-it-is:gate-bypass-design`, currentPath docs/knowledge/why-gate-bypass-is-shaped-the-way-it-is/gate-bypass-design.md). Target exists at the pin and is live (docs/knowledge is not a retiring tree). Anchor `why-the-skip-criterion-is-mechanical-not-a-confidence-read` matches heading line 35 "## Why the skip criterion is mechanical, not a confidence read" (GitHub slug, comma dropped); that section is the "mechanical, not interpretive" principle the comment invokes. Hunk header `@@ -165,7 +165,7 @@` correct (line 168 is the 4th line, 3 context lines each side match the source). Replacement is a single comment line, plain `path#anchor` citation form, path repo-root form like the original. Comment-only; no code behavior change. ok.

### knowledge-registry.mjs
- Parked l-000438 (20), 439 (88), 440 (210-211), 441 (537), 442 (646), 443 (733), 444 (737), 445 (748): all cite `docs/architect/knowledge-registry-redesign.md` with a section locator for the rule the code enforces. Live-holder check (required before accepting any park): searched docs/platform/** (excluding history, proposals, verification) and docs/knowledge for diataxis / doc.promote / doc.attest / doc.demote / docLifecycle / docId / sourceCaptureIds / topic.split / provisional->active / attestation-rejects-retired. The only hits for the same vocabulary are: docs/platform/proposals/knowledge-registry-redesign.md (non-canonical carriage, header "Canonical: No"), docs/platform/intent-preservation-ledger.md PF-I006/PF-I011/PF-I012 (deferred-preserved ledger rows, not a statement of the rules; PF-I012 even says "No document lifecycle is modeled"), work-state/spec.md RUL52/O10/F6 (the capture `docType` label, a different field), documentation-system-design.md section 12 and governance.md 441 (Diataxis used for docs/user, no registered-framework/closed-mode rule), component-boundary.md 273 (component description only), git/spec.md G-206 (dispatch attestation, unrelated). No LIVE non-carriage holder carries the same passage for any of the eight slots, so park is correct and none should become a Phase 9 patch.
- Preserve l-None lines 61 and 62 (`docs/../evil/guide.md`, `docs/ok/../escape.md`): literal adversarial path examples in a comment, not navigation; matches L12-60 ruling 1 / Step 5 matcher behavior. ok.
- Other path-like text not slotted and correctly so: line 45 template `docs/${purposeSlug}/${role}.md` (describes script behavior, not a citation), lines 77-78 are code/runtime.

## Outcome defects
None.

## Record-text notes (not rework)
- The eight parked reasons begin with a doubled prefix "A51, L12-30/31/32/58/60: A51, L12-30/31/32/58/60:" and the blockedReason/dependency text is the same generic sentence ("Carry this exact framework/role/doc identity, lifecycle or attestation rule...") for every slot; it is not specific for l-000442 (migration leaves docs provisional) or l-000445/443 (attestation). The L12-60 copied-park-reason concern applies in spirit; the parks themselves are right.
- l-000440 blockedReason quotes only line 210, while the reference continues to line 211 (`knowledge-registry-redesign.md §7.3`); harmless.

## Lead-judgment questions
- l-000438 (only 'diataxis' registered, four modes closed set): the four-mode closed set is partly stated live for the capture `docType` field (work-state/spec.md RUL52, O10), but that is a different surface than the registry framework/mode vocabulary. I judged not the same passage; Lead may confirm.

## Counts
- step04-026 patched stratum: 1 reviewed, 0 rework.
- step04-026 unpatched stratum: 2 reviewed, 0 rework.
- Part total: 3 files reviewed, 0 rework; 21 slots = 12 preserve, 8 parked, 1 patch.

Status: DONE
