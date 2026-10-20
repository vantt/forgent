# Review a38 step-03 wave4e part 01 (batch-075)

Worktree `ef10b8998`, author pin `ae141550c`. Every file read whole at the pin; every edge reviewed; no checker or probe run.

## Per-file verdicts

| File | Stratum | Edges | Verdict |
|---|---|---:|---|
| `docs/knowledge/tool-registry-capability-lookup-is-a-prose-contract-not-comp/tool-registry-capability-is-a-prose-contract-not-compiled-logic.md` | patched-seeded | 2 | ok |
| `docs/knowledge/why-a-pass-through-non-split-item-s-designed-proof-surface-c/why-fgos-coding-planning-writes-a-pass-through-items-real-verify-before-handoff.md` | patched-seeded | 1 | ok |
| `docs/knowledge/why-a-retired-stage-name-sometimes-keeps-a-drain-only-alias/why-a-retired-stage-name-sometimes-keeps-a-drain-only-alias.md` | unpatched-seeded | 3 | ok |
| `docs/knowledge/why-a-session-driven-root-s-fgw-rootid-branch-may-not-exist/why-createdetachedmergeworktree-crashed-for-session-driven-roots.md` | unpatched-seeded | 2 | ok |

### File 1 (tool-registry capability)
- 04581 (L11) preserve `docs/distillery/deep-dives/tool-registry.md`: the file exists at the pin and the distillery tree is retained. It is a source-evidence reference ("captured in full at"). Correct.
- 04582 (L109) patch, Phase 9, to `docs/knowledge/worker-slot-concept-.../worker-slot-is-the-engine-owned-occupancy-unit-across-every-launcher.md#the-label-mechanism-a-capability-gated-helper-skill-not-an-adapter-poll-loop`.
  - The old `docs/explanation/` path is absent at the pin; the doc-registry names this holder.
  - The anchor heading is at target L156. Its D5 quote at L158 covers the helper skill, the capability gate, no adapter polling and the silent `exit 0` outside herdr.
  - The adjacent text ("part of the worker-slot design ... D5 ... pane-labeling helper ... gates on `fgos tool query`") matches. The label-plus-anchor form is complete and the diff hunk is correct.
  - Other legacy references: none found; `legacyScan` has no candidates.

### File 2 (pass-through verify)
- 04624 (L25) patch, Phase 9, to `docs/knowledge/why-fgos-coding-planning-and-fgos-coding-validating-merged-t/why-planning-and-validating-collapsed-into-one-co-adjustment-gate.md#d1-exactly-one-gate-moved-to-validating-right-before-materialize`.
  - The old explanation path is absent at the pin. The target exists; D1 is at its L29.
  - D1 says planApprove and validateApprove merge into one gate in validating, and planning only writes plan.md and hands off. That supports the adjacent claim that no live skill writes `planApprove` since the redesign. The target's later `tsk-4vz` section on closing the door on new planApprove records is consistent. D1 is the right anchor.
  - The diff hunk is correct. Anchor and label form are complete.

### File 3 (drain-only alias)
- 04627 (L170) preserve `docs/history/spec-docs-lifecycle-realignment/`. The path exists at the pin; `docs/history` is a retained convention (plan.md L130 on retained history conventions). The sentence describes a completed sweep. Correct.
- 04628 (L171) and 04629 (L172) preserve `docs/specs/work-state.md` and `docs/specs/runner.md`.
  - The sentence describes completed spec edits by tsk-1uw and tsk-2t5, so this is historical spec-edit identity. It is not a read instruction.
  - Successor notes `docs/platform/work-state/spec.md` and `docs/platform/runner/spec.md` both exist at the pin.
  - They are non-executable notes. The reasons say "tree retires at Phase 9". Correct under L12-38 and the digest.
  - The records do not treat the live knowledge prose as L12-40 evidence. They treat it as a completed-action identity, which the request says to keep.
  - The empty diff is consistent.

### File 4 (createDetachedMergeWorktree)
- 04630 (L44) preserve. It sits in a blockquote attribution line ("real CONTEXT.md, docs/history/...") that quotes captured evidence (L12-40), and the framing is quoted in the reason. The path exists and `docs/history` is retained. Correct.
- 04631 (L103) preserve, in the Related list. The retained `docs/history` path exists, so the Related entry preserves under L12-34(4). Correct.
- The empty diff is consistent.

## Outcome defects
None.

## Record-text notes (not rework)
- 04581 and 04631 reasons say "current retained path stays literal". This is true.
- 04628/04629 quote the full paragraph as framing. This is verbose but accurate.

## Lead-judgment questions
- 04628/04629: a live knowledge file's completed-sweep sentence is preserved with a non-executable successor note. It is a spec-edit identity, not a current read instruction. If the Lead reads this passage as live navigation, the alternative is a description-rewrite park. I judge preserve correct under the request's "preserve actual completed spec-edit/audit identity".

## L12-41 verification (other batches, read from the committed records at `ef10b8998`)
- **maps-j-04444** (batch-073, `resolve-a-decision-id-collision-merge-conflict-on-approve.md`, L124 `docs/decisions/0032-iron-law-...md`): disposition preserve, no target.
  - The reason cites L12-41(4). It resolves the elided name against the deleted `0032-cong-iron-law-chi-hoi-o-ranh-gioi-trunk-them-muc-warn.md`, which exists at `4722361ae^`.
  - It says the sibling Team Harness decision supplies no title evidence.
  - The successor note is `docs/platform/runner/decisions/h-36d872fbb0e5.md#0032-cổng-iron-law-chỉ-hỏi-ở-ranh-giới-trunk-thêm-mức-warn-agent-gõ-lệnh-thay-người`. The heading `### 0032 — Cổng Iron Law chỉ hỏi ở ranh giới trunk, thêm mức warn, agent gõ lệnh thay người` exists at L1095 of that file at the pin. **Landed.**
- **Event-log 0001** (batch-071, `event-log-evolution-discipline.md`, edge `author-wave4b-event-log-evolution-discipline-L13-decision0001`):
  - Disposition parked, `blockedCategory` and `dependencyCategory` both GAP-02. The reason cites "P8-DOC-GAP-02 (L12-41(1))" and says the title-matched narrative is in retiring `specs/platform-foundations.md`.
  - The source file has `### 0001 — Nhật ký sự kiện là sự thật ...` at L103. No `docs/platform/**` file contains the title.
  - It does not use the dead-link category. **Landed.**
- Not touched here: the 0001 rows in `docs/decisions/index.md` (01355, a Step 5 parity park) and `knowledge/decisions-index/decision-record.md` (04157, a frozen-history preserve). Each is classified under its own rule, not L12-41(1).

## Counts
- Set batch-075: patched-seeded 2 files reviewed / 0 rework. Unpatched-seeded 2 files reviewed / 0 rework. This part covers 4 files (all 4 distinct A51 files) and 8 edges, with 0 rework (0%). There is no overlap between strata.
- Rework numerator for batch-075 across this part: 0. Part 01 is the only part for this set.

Status: DONE
