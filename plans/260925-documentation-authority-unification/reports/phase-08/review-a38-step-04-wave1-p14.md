# A38 review, Step 4 wave 1, part 14 (set step04-011)

Pin ef62747dd; payload step-04-wave1-p14.json; source blob a1f46110... (2345 lines) read via pinned `git show`; every slot line and every docs/plans/core path occurrence in the file inspected.

## src/command-registry (src/cli/command-registry.mjs)

- Set step04-011, stratum: mandatory (single file), 15 slots reviewed, diff is empty (no patches).
- Verdict: **rework** (one outcome defect).
- Behavior check: diff is '' for every slot, so no code or help text changes at all; nothing can alter behavior.

### Outcome defect

1. **class6-l-000205** (source line 7, `// this module sits at the \`kernel\` layer in docs/architecture-manifest.json:`; also bound to cli-007 matched `docs/architect`).
   - Record says: disposition `parked`, reason "Phase 9 carry: map the exact registered-session merge-into-main exemption/return progress distinction in this comment to a live post-merge holder ...".
   - Wrong: that reason describes a different comment and has nothing to do with line 7, a kernel-layer pointer to docs/architecture-manifest.json (the file exists at docs/architecture-manifest.json in the pin; AGENTS.md also cites it as live contract).
   - step-04-population.json for the same edge says `advisoryClass: preserve`, rule "Retained exact contract path; docs/architect prefix is not a match inside docs/architecture-manifest.json (L12-21)". The authored record contradicts its own population entry, and it invents a Phase 9 carry obligation that does not exist.
   - Correction: disposition `preserve`, reason along the lines of "A51, L12-21/26/38: surviving native contract path; the `docs/architect` census prefix (cli-007) is a false prefix match inside docs/architecture-manifest.json; no authority-path rewrite". No target, anchor or timing. Timing stays `none`, blockedReason null.

### Slots confirmed ok

- cli-009 (L1035, `--plan docs/history/tsk-19j/plan.md` in an example string): preserve, external-project convention (L12-10), correct. Exact passage in reason matches source.
- cli-011 + class6-l-000225 (L2075, `RUL9/RUL11 (docs/specs/distribution.md)`): parked as Phase 9 carry, consistent with population (`phase9`); live-holder carry for the stated doctor-fix reversal claim, no target/anchor invented. ok. The two inventory refs (2056 and 2067) are the same passage in older commits and rebind to L2075 col 383-409.
- class6-l-000224 (same line, `docs/history/doctor-fix-gate-bypass/CONTEXT.md`): preserve, directory exists in the pin, L12-10 historical reference. ok.
- class6-l-000206 (L445), 000207 (L491), 000209 (L676): `docs/history/<feature>/` in docs-ref parameter descriptions (the portable convention): preserve, ok.
- class6-l-000210 + cli-008 (L846, `docs/specs/<area>.md`): parked, description rewrite owed to Step 5 registry-reader trace; matches population `phase9`. ok.
- class6-l-000211 (L846 `docs/decisions/index.md`) and 000212 (L861): preserve, surviving native generated path, reader behavior is Step 5. ok.
- class6-l-000213 (L886 `docs/history/<feature>/CONTEXT.md`): preserve, ok.
- class6-l-000214 (L987 `docs/history/gate-bypass/CONTEXT.md`): preserve; target dir exists. ok.
- class6-l-000215 (L1019 `docs/history/tsk-65q-gate-bypass-global-install-resolution/`): preserve; dir exists, named historical evidence. ok.
- class6-l-000219 (L1760 `docs/how-to`): preserve, literal example in description, ok.
- class6-l-000222 (L1864 `docs/doc-registry.json`): preserve, file exists, ok.

Counts: 15 slots reviewed; 14 ok; 1 rework (class6-l-000205). Per set step04-011: 1 file reviewed, 1 rework. Stratum mandatory: 1 reviewed, 1 rework.

### Record-text notes (not rework)

- cli-010 / class6-l-000223 (L1864 `docs/doc-registry.md`) is routed to bucket step5 in step-04-population.json, not this record; correct and not a missed slot.
- Census edges class6-l-000208 (L638 `docs/how-to/example.md`), 000216 and 000217 (L1034/L1035 tsk-19j CONTEXT.md/plan.md), 000218 (L1746), 000220/000221 (L1767/L1768 `docs/how-to`) are in the class6 census but appear in neither this record nor step-04-population.json for this file. They are all example-string or fixture literals (preserve-equivalent), so no outcome consequence, but the exclusion basis is not stated in the record.
- Unslotted live-path mentions with no census edge (informational only): L999 `docs/platform/session-identity/spec.md` (exists in the pin), L377 `plans/261014-1400-two-doors-one-rununit/reports/review-261014-2115-lane-x.md`, L861 `docs/enduser-docs-index.json`, L1921 `AGENTS.md`, L1416 `docs/ast.md` (example input). Not frozen slots; nothing to do in this part.

### Lead-judgment questions

- None blocking. Lead may want to confirm the class6-l-000205 fix is applied in the record text (reason and disposition) rather than just flagged, since it also changes the parked/preserve counts for this file.

Status: DONE_WITH_CONCERNS
