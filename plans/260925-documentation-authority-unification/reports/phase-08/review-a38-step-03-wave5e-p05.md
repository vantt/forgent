# Review a38 step-03 wave5e, part p05

Reviewer: independent read-only semantic reviewer. Worktree detached at 171937a68, author pin ae141550c2e022310de7a0efea757580c0b2479f. No checker or probe was run. Nothing was written to the worktree.

## docs/platform/component-boundary.md

- Set: batch-093
- Stratum: patched (seeded) and mandatory-threshold, one file
- Verdict: **ok**
- Edges reviewed: 39 of 39
  - 18 parked: 06625-06627 (Related header), 06632-06642, 06644, 06646-06648
  - 2 patches: 06643, 06645
  - 3 row flips: 06629-06631
  - 16 preserves: 06628 (L17 Provenance) and 06649-06663 (carriage)
- Source: read whole, 1641 lines / 101 KB. Lines 1-116 and all section 4 rows were read in full. The three carriage regions (L117-1184, L1185-1419, L1420-end) were read at every edge span, at the carriage framing lines, and by a regex scan for legacy-path forms.
- Diff: read in full. It has one hunk, @@ -72,12 +72,12 @@, with two changed lines (L75 and L80) and nothing else.

### Per-edge result

| Edge | Source line | Disposition | Finding |
|---|---|---|---|
| 06625, 06626, 06627 | L12-14 (Related header) | parked, description-rewrite | Correct. The only surviving holders are carriage inside this consumer. The README and the advisory are carriage carried at L117 and L1185. `docs/platform/proposals/component-authority-boundary-map.md` is a "non-canonical candidate conservation carrier", so it is carriage-only. The Related Files row L107 already lists it. This matches L12-34(4): self or carriage-only holders park. |
| 06628 | L17 Provenance `docs/architect/component-boundary/**` | preserve | Correct. It is a provenance pattern (L12-47). |
| 06629, 06630, 06631 | L44-46 | phase9-row-flip | Correct. The section is "Current Source During Migration"; the migration state is the subject, so each row flips whole (L12-35(2)). Each reason quotes its source row. |
| 06632, 06633 | L68 | parked, workflow-carry | Correct. The row depends on the D-ADR0070 workflow guide, and no candidate workflow holder exists in docs/platform at the pin. The advisory link in the same row shares the row disposition (unitId row-L68). |
| 06634-06636 | L69 | parked, workflow-carry | Correct. Same reasoning. The row cites workflow.md twice and runner.md once; all three share the disposition. |
| 06637, 06638 | L70 | parked, workflow-carry | Correct. Same reasoning. |
| 06639 | L71 runner.md | parked, phase9-carry | Verified. The three loops are held at `runner/decisions/h-36d872fbb0e5.md` line 1525. `runner/architecture/h-69197b459754.md` line 78 says only "plus preset". `consult`, `research-fan-out` and `rfc` are absent from the whole runner candidate dir (grep gave 0 hits). A patch would leave the preset list ungrounded. |
| 06640, 06641 | L72, L73 herdr-web-dashboard | parked, description-rewrite | Verified. The candidate spec has 0 hits for `herdr-plugin.toml`, `WorkItemSource`, `herdr-fgos-common`, `remote_invocation` and pane supervisor. It is a browser/gateway spec, so the row description would not stay true. |
| 06642 | L74 confinement-authority | parked, step5-parity | The park is justified. `docs/platform/agent-confinement/spec.md` holds write-back at section 13.2 but has no `copyCredentialFiles` or `cleanup.mjs`. The category is debatable; see Lead question 1. |
| 06643 | L75 evidence-and-results | patch to `docs/platform/agent-coordination/architecture/evidence-and-results.md`, Phase 9, whole file | Correct. The target exists at the pin and is the restored live architecture file. Its Principle, Evidence Sources and Confidence Boundaries sections cover "evidence/confidence boundary for assignment run results". The original link had no fragment, so whole-file is a faithful anchor. The new relative form resolves from docs/platform/. The diff replaces the cell only. |
| 06644 | L76 `../architect/domainization/` | parked, description-rewrite | Correct. The only candidate holder is the whole-source carrier `domainization/architecture/domainization.md`. The sibling `../../domains/` link is left alone. |
| 06645 | L80 observe | patch to `docs/platform/observe/spec.md`, Phase 9 | Correct. The target is the area spec. The row's claims all hold in it: Rust `packages/observe/rust`, native routing, and the case/run/session/friction/snapshot subjects. The diff is correct. |
| 06646 | L85 workflow.md (Shape C text in the Holder-lock row) | parked, workflow-carry | Correct. The record's boilerplate wording ("complete component row ... explicitly depends") is slightly loose for this row; see record-text note 2. |
| 06647 | L106 Related row to the advisory | parked, description-rewrite | Correct. The holder is the carriage in this same consumer, so the delegation is consolidated rather than redirected. |
| 06648 | L114 Related row to workflow.md | parked, workflow-carry | Correct. |
| 06649, 06654-06655, 06650-06653 | L119, L271-273 | preserve | Correct. All are inside the declared advisory carriage region. Reasons state only the carriage declaration, with no existence claims (L12-35(4)). |
| 06656, 06657 | L469, L540 | preserve | Correct. Same carriage treatment. |
| 06658, 06659, 06660, 06661, 06662 | L1187, L1212, L1213, L1273, L1299 | preserve | Correct. The README carriage declaration is quoted. |
| 06663 | L1422 | preserve | Correct. The repo-layout-vision carriage declaration is quoted. |

### Missed-reference scan

I ran a regex over the whole file for `specs/`, `architect/`, `docs/specs`, `docs/architect`, `../specs`, `../architect` and `reading-map`, and mapped every hit to an edge span. The only uncovered hits are `task-specs/` at L428 and L446. These are domain task-spec paths, not legacy-tree references.

I also resolved every Markdown link in the carriage from the wrapper base (docs/platform/). No link pointing to a retiring file is uncovered, and no dead link remains. The bare names in the carriage text fall under the carriage exemption of L12-38.

I found no missed reference and no false adjacent description. The two patches keep their row descriptions true.

### Counts for this file

- Edges reviewed: 39. That is 18 parked, 2 patch, 3 row-flip and 16 preserve.
- Per-edge defects: 0.

## Record-text notes (not rework)

1. Edge 06628 (L17 preserve): the reason does not say "exists at author pin; tree retires at Phase 9; preserved as lineage" in the digest's form. It only says "committed directory". It also names no live successor.
2. Edge 06646 (L85) and edge 06648 (L114): the reason text says "the complete component row explicitly depends on..." as boilerplate. For L85 the dependency is the Shape C `advance` sentence of the Holder-lock row, and L114 is a Related Files row. The disposition is right but the wording is generic.
3. Pathless migration prose is not an edge: L19, L22, L48, L60 and L98. It rides the Phase 9 semantic-remnant search (L12-36(4)). I raise it only as an awareness item; it is no defect.

## Lead-judgment questions

1. Edge 06642 (L74): `step5-parity` versus `description-rewrite`. The blocker is that the row names `copyCredentialFiles` and `cleanup.mjs`, and no candidate holder carries them. The candidate spec carries only write-back at section 13.2. By L12-32(3), a description mismatch parks as description-rewrite. The record's own text asks for tracing the real provisioning and cleanup call sites, which is parity work. I judge the category defensible and not an outcome defect.
2. Edges 06632-06638, 06646 and 06648 are parked workflow-carry. Several of them point at runner.md citations inside Workflow rows. I accept row-shared disposition (L12-35(1)). If Lead later rules that the runner citations in rows 69 and 70 can patch independently, those edges would change. That is not a current defect.

## Counts

- batch-093 patched stratum: reviewed 1 file, rework 0.
- batch-093 mandatory-threshold witness: reviewed 1 file, rework 0. This is the same file as the patched seed, so the two overlap.
- batch-093 unpatched stratum: 0 files (0/0).
- Whole-set: 1 distinct file reviewed, 0 rework (0%). No expansion is triggered.
- No open lead-ruling edges exist in this set.

Status: DONE
Summary: component-boundary.md (39 edges, 2 patches, 3 row flips, 18 parks, 16 preserves) is ok with no per-edge outcome defects. Three record-text notes and two Lead questions are listed in the report.
