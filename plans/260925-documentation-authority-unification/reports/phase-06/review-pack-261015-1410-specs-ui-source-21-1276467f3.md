# Bounded source review pack

Content commit: 1276467f37a99d19aff05808d42fafbf40341449
Author session: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15
Shard: plans/260925-documentation-authority-unification/ledger/decisions/s8-ui-spec-01.json
Shard SHA256: 92d9c405f3eb4795fc09b6b58504f33d1153a43505752799d0e7c463e83f9833
Source: docs/ui-spec/generated/action-registry.csv
Part 1/1; entries: **1**. All decisions remain pending.

Read review-brief.md, owner-answers.md (A19/A22/A28/A34/A36/A39), the frozen specs-ui map and minimum constitution. Verify all rows mechanically: full digest recomputation, anchor, ancestry, exact-proof thresholds and shard/pack equality. Independently choose and record the seed and IDs for at least 1/1 Weak-exact/Judgment rows (15%, minimum 10, all if fewer), plus all unequal pairs and generated no-target rows below. Read both directions with a diff; read generation provenance for no-target rows. More than 3% deep rework requires full-pack deep reading. No producer seed/draw/verdict. Retain separate script-exact stratified spot checks; ordinary source approval does not certify truth or eligibility.

A36 class lists and mandatory deep IDs:

```json
{
  "classes": {
    "Unit-exact": [],
    "Weak-exact": [],
    "Judgment": [
      "claim_7d55d8b906459068668dbd17eca9a793"
    ]
  },
  "unequalDigestPairs": [],
  "noTargetGeneratedRows": [
    "claim_7d55d8b906459068668dbd17eca9a793"
  ],
  "mandatoryDeep": [
    "claim_7d55d8b906459068668dbd17eca9a793"
  ]
}
```


Return Reviewer, Author session(s), Review mode: ordinary, immutable content/request/shard pins, and one row per claim. Use ok/rework/hold, an own note prefixed deep or mechanical, full 64-hex digests; literal none for absent target. Consolidate parts by original shard before applying.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|


## claim_7d55d8b906459068668dbd17eca9a793

Class: Judgment; mandatory deep: true.
Source: docs/ui-spec/generated/action-registry.csv#file-block; lines 1–44; ancestry [].
Target: none; ancestry [].
Source digest: 9061f86a22a4aa7506e627c8bf2decf3ccdb5b75cf88f2382481851b1d5a02bc
Target digest: none
Shown source SHA256: 8137b0c53a3f92b19f8dea30291fdcb4858ae81d028a41b60632f6f1277352be
Shown target SHA256: none

### Complete proposed decision

```json
{
  "claimId": "claim_7d55d8b906459068668dbd17eca9a793",
  "sourceUnitDigest": "9061f86a22a4aa7506e627c8bf2decf3ccdb5b75cf88f2382481851b1d5a02bc",
  "targetOwner": null,
  "targetAnchor": null,
  "claimKind": "specification",
  "disposition": "regenerate-from-source",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792045007741-a245b0a6@2026-10-15",
  "rationale": "docs/ui-spec/generated/action-registry.csv#file-block (1-44) is a declared generated projection unit. Declared ui-spec build output remains at its legacy path; regenerate using .claude/skills/ui-spec/tools/build.mjs and interpret-wireframe.mjs against docs/ui-spec. No candidate snapshot or candidate carrier is created. A9/N1 and constitution section 4 override this file's frozen history/place-verbatim map row. Preserve the existing output bytes; no candidate copy, owner, anchor or current freshness approval is asserted."
}
```

### Full source shown text

```text
id,from,trigger,action,target,guard,region
A-S01-001,S01,input,mutate,,,form
A-S01-002,S01,submit,navigate,S02,token.nonEmpty,form
A-S02-001,S02,click,navigate,S03,,board
A-S02-002,S02,click,open_overlay,M03,,controls
A-S02-003,S02,click,mutate,,,board
A-S02-004,S02,change,mutate,,,controls
A-S02-005,S02,change,mutate,,,controls
A-S02-006,S02,click,navigate,S04,,needs_answer_rail
A-S02-007,S02,change,mutate,,,topbar
A-S02-008,S02,work.changed,mutate,,,
A-S02-009,S02,question.opened,mutate,,,
A-S02-010,S02,gateway.unreachable,mutate,,,
A-S02-011,S02,item.quick_action,mutate,,,
A-S03-001,S03,click,open_overlay,M01,item.isParked,question
A-S03-002,S03,click,open_overlay,M02,item.awaitingApproval && gateway.atMainWorkingTree,actions
A-S03-003,S03,click,open_overlay,M03,,actions
A-S03-004,S03,click,mutate,,,context
A-S03-005,S03,click,navigate,S02,,topbar
A-S03-006,S03,click,mutate,,,timeline
A-S03-007,S03,work.changed,mutate,,,
A-S03-008,S03,question.answered,mutate,,,
A-S03-009,S03,merge.settled,mutate,,,
A-S03-010,S03,gateway.unreachable,mutate,,,
A-S03-011,S03,item.quick_action,mutate,,,
A-S04-001,S04,click,open_overlay,M01,,list
A-S04-002,S04,click,navigate,S03,,list
A-S04-003,S04,click,navigate,S02,,topbar
A-S04-004,S04,question.opened,mutate,,,
A-S04-005,S04,question.answered,mutate,,,
A-S04-006,S04,gateway.unreachable,mutate,,,
A-M01-001,M01,input,mutate,,,answer_form
A-M01-002,M01,submit,close_overlay,return_to_invoker,answer.nonEmpty,footer
A-M01-003,M01,click,close_overlay,return_to_invoker,,footer
A-M01-004,M01,click,close_overlay,return_to_invoker,,header
A-M02-001,M02,submit,close_overlay,return_to_invoker,gateway.atMainWorkingTree,footer
A-M02-002,M02,click,close_overlay,return_to_invoker,,footer
A-M02-003,M02,click,close_overlay,return_to_invoker,,header
A-M03-001,M03,input,mutate,,,form
A-M03-002,M03,submit,close_overlay,return_to_invoker,description.nonEmpty,footer
A-M03-003,M03,click,close_overlay,return_to_invoker,,footer
A-M03-004,M03,click,close_overlay,return_to_invoker,,header
A-C01-001,C01,click,emit_event,,,quick_actions
```

### Full target shown text

none — generated output retained at its legacy path; regeneration provenance is in the decision and triage.
