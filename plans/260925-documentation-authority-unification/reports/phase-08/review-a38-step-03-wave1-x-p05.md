# Review a38 step-03 wave1 expansion p05

Reviewer: independent read-only semantic review. Pin ae141550c. All six files read whole at the pin; every edge in batch-015.jsonl:10-15 reviewed with its diff, search-witness group, scan candidates and target existence. No checker/probe scripts run. None of these files appears in the earlier p01-p03/u01-u04 defect lists, so there was nothing to re-confirm.

## Result: 6 files, 54 edges reviewed, 0 outcome defects. Set 015 contribution: 6 reviewed / 0 rework.

All six are retired-engine "Historical File" wrappers with the same shape: a header with `Related:` (L15-17), `Superseded by:` (L19), a framing sentence (L23) and a literal snapshot (L27 onward). The outcomes are correct and consistent across the set.

- Related L17 `docs/specs/runner.md` patches to `docs/platform/runner/spec.md`. The target exists at the pin and is the exact whole-file holder. The Related list has only two entries, so it is not a duplicate. The diff is a single-line hunk that applies. Whole-file justification is true (no locator in the source).
- L19 `Superseded by: ... docs/specs/runner.md` is preserved. This is a History-typed file, so L12-34(4) and the "Superseded by" rule hold.
- L23 framing sentence is preserved with successor `docs/platform/runner/decisions/h-aabefc85f0c9.md`. That file exists and carries the `CoordinationSession (Lịch sử ...)` heading as carriage. See Lead question 1.
- Every edge inside the literal snapshot (provenance, Related, "Retained from", prose paths, relative links) is preserved. None is retargeted, and carriage-only holders are never patch targets.
- Scan completeness: I found no missed legacy reference. Every `docs/architect/` and `docs/specs/` token in the six files is covered by an edge. The scan exclusions are local ADR and proposal sibling filenames that exist as candidate files under the same `files/` directory (decisions L69-78, proposals L72/75/84/88). That is correct.

### Per file

| File | Edges | Verdict |
|---|---:|---|
| files/decisions/README.md | 6 | ok |
| files/proposals/README.md | 12 | ok |
| files/roadmap/README.md | 8 | ok |
| files/roadmap/team-dispatch-v1/README.md | 6 | ok |
| files/subcomponents/README.md | 6 | ok |
| files/verification/README.md | 16 | ok |

## Outcome defects

None.

## Record-text notes (not rework)

1. **Self-path successor notes (L12-34(8): a successor note cannot name the edge's own path).**
   - maps-j-06150 (roadmap/README.md L36): the successor is `docs/platform/agent-coordination/history/retired-engine/files/roadmap/README.md`, which is the consumer itself. The live `docs/platform/agent-coordination/roadmap/` does not exist at the pin, so the honest note is "no live successor; the retired-engine snapshot is the carrier".
   - maps-j-06158 (team-dispatch-v1/README.md L36): same defect, with `.../files/roadmap/team-dispatch-v1/README.md` named as its own successor.
   - maps-j-06243 (verification/README.md L9): the successor is the consumer's own path. This edge is also a Provenance line whose target `docs/platform/agent-coordination/verification/README.md` survives Phase 9. The text "tree retires at Phase 9" and the successor note are both wrong for it. The preserve outcome stays right as provenance.
2. **False "absent / never existed" facts on relative links.** These are the snapshot's `../../../architect/...` links:
   - maps-j-06075, 06077, 06078, 06079 (proposals L96/101/105/109)
   - 06153, 06154 (roadmap L71/73)
   - 06242 (subcomponents L63)
   - 06251-06258 (verification L67-74)

   The reasons say "source path absent at author pin" and name only the consumer-natively resolved path `docs/platform/.../history/architect/...`, which is true only for that path. Resolved from the area coordinates, which the wrapper's Provenance header at L9 explicitly binds, each link lands on `docs/architect/...`. I confirmed these exist at the pin: architecture-intent.md, proposals/step-09/step-10/component-authority-boundary-map.md, agent-coordination/documentation-standardization-plan.md, and the verification proof roots. The preserve outcome is unchanged, but the facts should say "exists at author pin as retiring-tree source coordinate; tree retires at Phase 9" and name the live successor where one exists.
3. **Missing successor note.** maps-j-06152 (roadmap L59 `docs/architect/agent-coordination/roadmap/`) carries the standard text but no successor note. Compare maps-j-05954, whose directory-form edge names one. For 06152 there is no live roadmap directory, so the note should say that.
4. **Wrong carrier phrase.** The L19 and L23 preserves (for example 05951/05952) are described as "Historical source carrier, framed by ...", but those lines are wrapper header and framing text outside the literal snapshot. This is cosmetic.

## Lead-judgment questions

1. L23 `see docs/specs/runner.md **CoordinationSession (Lịch sử ...)**` appears in all six wrappers: 05952, 06070, 06149, 06157, 06239, 06246. It sits outside the literal snapshot, so it is wrapper prose rather than carriage, and it is preserved with a successor note to the carriage file h-aabefc85f0c9.md. I accept preserve because the sentence is a dated "retired in <sha>; see ..." statement and the only holder of that heading is carriage. If the Lead wants wrapper prose to stay navigable after cutover, the alternative is a phase9-carry or description-rewrite park for the six edges. The six should share one answer.
2. Whether record-text note 2 should be corrected before acceptance. It does not change any outcome.

Status: DONE
Summary: All six retired-engine files (54 edges) have correct outcomes: Related patched to docs/platform/runner/spec.md, everything else preserved as history. No outcome defects. Record-text notes only: three self-path successor notes, false "absent" facts on architect relative links, and one missing successor note.
