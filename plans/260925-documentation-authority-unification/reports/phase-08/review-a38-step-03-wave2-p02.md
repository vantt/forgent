# Wave 2 review, Part 02 (batch-038), pin ae141550c

Reviewer method: read each source whole at the pin, each per-file diff, every edge field via the extractor, the full legacy-scan candidate list, and an independent grep of every path, link and basename token in the source (including the dated "Upstream Source" successor snapshots). No checker or probe was run.

## Per file

### 1. docs/platform/agent-coordination/history/retired-engine/files/playbooks/architecture-advisory-evaluation-rubric.md
Set batch-038, patched-seeded. Verdict: **ok**. 5 edges reviewed.
- maps-j-05988 (L17, Related): patch to docs/platform/runner/spec.md, Phase 9, whole-file. Correct under L12-34(4): live Related navigation to a retiring file, patched to the live area spec (exists at the pin). The diff changes only L17 and is outside carriage.
- maps-j-05989 (L19, "Superseded by: Current execution ownership in docs/specs/runner.md"): preserve. Correct as separate Superseded-by framing (L12-35(3)). The successor note h-36d872fbb0e5.md exists at the pin and contains decision 0062.
- maps-j-05990 (L23, dated "coordination engine was retired ... see docs/specs/runner.md CoordinationSession (Lich su ...)"): preserve. Correct as dated retirement framing.
- maps-j-05991 (L36, Provenance inside "## Literal Snapshot"): preserve. Correct; it only cites the carriage declaration.
- author-added L94 `[artifact templates](architecture-advisory-artifact-templates.md)`: preserve inside carriage. Correct. The original-source reading reaches docs/architect, which is why it is an edge.
- Scan: the independent grep found no unrecorded legacy path. The intake.md, interpretation.md, scout-report.md, decision-request.md and synthesis.md basenames are session-artifact names, so excluding them is correct.

### 2. .../playbooks/architecture-advisory-role-doctrine.md
Set batch-038, mandatory-threshold. Verdict: **ok**. 10 edges reviewed.
- maps-j-05992 (L17 Related): patch, same as above. Correct. The diff is identical in shape, L17 only.
- maps-j-05993 (L19) and maps-j-05994 (L23): preserve. Correct.
- maps-j-05995 (L36 Provenance, carriage): preserve. Correct.
- Author-added edges, all preserved inside carriage, all correct:
  - L90 `[the coordinator prompt](prompts/...)`
  - L91 templates link
  - L92 rubric link
  - L1273 `prompts/`
  - L1597 `[P00.1](../verification/architecture-advisory-panel/P00.1.md)`
  - L1650 `[rubric](...)`
- L1273 `prompts/` is really a session sub-directory in a quoted red-team transcript, not the playbooks prompts directory. Recording it as a carriage edge is harmless because it preserves (record-text note only).
- Scan: all 17 candidates were accounted for. The independent grep found nothing extra. `../../../../plans/260905-.../plan.md` at L84 is a plans path, not a legacy tree.

### 3. .../playbooks/prompts/architecture-advisory-coordinator.md
Set batch-038, mandatory-threshold. Verdict: **ok**. 19 edges reviewed. The file is 2,267 lines and I read all edge regions plus the grep over the whole file.
- maps-j-06023 (L17 Related): patch to docs/platform/runner/spec.md. Correct.
- maps-j-06024 (L19) and maps-j-06025 (L23): preserve. Correct.
- maps-j-06026 (L36), maps-j-06027 (L60 `docs/architect/.../playbooks/`), maps-j-06028 (L811), maps-j-06029 (L818 proofs dir), maps-j-06030 (L819 P00.1.md): preserve inside the literal snapshot. Correct.
- maps-j-06031 (L881) and maps-j-06032 (L1577), the `Source:` lines of the dated upstream-successor sections: preserve as Source/Provenance lineage. Correct outcome.
- Author-added edges, all preserved inside carriage and all correct:
  - L65 and L72 `master-coordinator.md`
  - L108, L112 and L114 Companion-Documents links
  - L830 P00.1 link
  - L848, L855 and L857 `master-coordinator.md` / rubric link
- Shipped external-project convention (L12-10): none present in this file.
- Scan: 88 candidates. The edges cover every legacy-reaching one. The remaining basenames (session.md, intake.md, and similar) are illustrative session-artifact names; excluding them is correct. The successor snapshots at L885-1574 and L1580-2267 hold no legacy path beyond the two Source lines.

## OUTCOME defects
None.

## Record-text notes (do not count as rework)
- maps-j-06031 versus maps-j-06032: both are the `Source:` line of a dated successor section, but one reason says "Source path exists ... Preserve Source/Provenance lineage" and the other says "inside literal carriage; declaration: This dated successor preserves...". The two reasons describe the same kind of line differently. The outcome is the same (preserve).
- L12-35(1) distinct-claim texts on maps-j-05989, 05993 and 06024 are the generic boilerplate ("retained history/decision/... citation has its own provenance"). L19 is physically a separate line from L17 and the checker passed, so there is no outcome effect.
- The L1273 `prompts/` edge (role-doctrine) names a normalizedReference of docs/architect/.../playbooks/prompts, but the source token is a session-directory name in a quote. Harmless because it preserves.

## Lead-judgment questions
1. L19 "Superseded by: Current execution ownership in docs/specs/runner.md" preserves per L12-35(3). The text says "Current ... ownership" and points at a tree that retires at Phase 9, while the nearby Related pointer is patched. The rule is explicit, so this is only flagged for awareness: after Phase 9 deletion, the three history wrappers keep one dangling non-patched pointer at L19, covered only by the successor note in the record. If a visible in-file successor note is wanted, that is a Phase 9 decision (patching would break the "literal historical framing" ruling).

## Counts
- batch-038 (this part): 3 files reviewed, 0 rework, 34 edges reviewed, 0 outcome defects.
