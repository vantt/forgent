# Bounded proposals and redesigns review pack

Content commit: 0f063d18fdab01cb6f2c915bb60ff528c5e0f238
Original shard: plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-17-step-09-step-10-replan-handoff-prompt.json
Original shard SHA256: 52979458bf5b450f7a5557dc810667d7bc0f011d6aed3066124211ae410a229e
Source file: docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md
Part 1/1; entries: **4**. Source-file group 17/20.
Author session: codex-session:unit-run-1792034226117-40d90d09@2026-10-15
Row-level authoredBy is authoritative for mixed correction authors. Independent ordinary review only; all rows remain pending.

A36 differing-digest rows (1): `claim_748eaed66e0864f6b66db8f230941593`.

Absent-target rows (0): none.

Rows changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238 (4): `claim_748eaed66e0864f6b66db8f230941593`, `claim_2ba1e1cf145db1520a75d592e08e6cc3`, `claim_7b86afff62ae3c9360f7d7e884bbfaf8`, `claim_eadf79b0b7a6fd73cf80175beeff02f2`.

Weak-exact/Judgment population: 1; reviewer chooses and records seed and IDs for at least 1 deep reads (15%, minimum 10, all if fewer), plus every differing/absent pair. Mechanically verify all rows, full digests, anchors, ancestry, source eligibility, one owner and exact-proof thresholds. A36 supersedes the older 100% Weak-exact/Judgment deep-read rule in review-brief; retain its other ordinary-review obligations. If >3% deep rework, deep-read the whole pack. Mark each own note deep or mechanical. No author-selected draw or seed/key is supplied. Complete batch: 1,815 rows, 1,289 Unit-exact / 438 Weak-exact / 88 Judgment; 88 mandatory differing pairs; 114 correction rows.

Return an independent committed report with Reviewer, Author session(s), Review mode: ordinary, content/request/shard pins and this five-column table. Consolidate all parts for each original shard before unchanged ordinary application; these slices do not change shard bytes. Use ok/rework/hold with an own note and the full shown-unit digest (literal none for an absent target). Reverse eligibility and triage findings have separate requests and cannot approve these source rows.

| Claim | Verdict | Note | Source digest | Target digest |
|---|---|---|---|---|

## Native gate blocker at the content pin

D reports eight decision-loss-without-partial-carry findings in the proposals README rationales (the phrase `it omits later siblings` describes the source index). The checker and decision content are unchanged. These are reported blockers, not waived findings. This pack contains 0 affected rows.

```json
[]
```

## claim_748eaed66e0864f6b66db8f230941593

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **yes**. Mechanical class: Judgment.
Source: docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md#step-09-step-10-replan-handoff-prompt, lines 1–1.
Target: docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md#step-09-step-10-replan-handoff-prompt.
Source digest: d4c07b1b279fe005d92de5d9a48b608bb67a27a4f47f56b6d8ac6994f6cf3bb7
Target digest: 99660662643fdbf89df15656d4aeb079b182e1b65e9740b105ec016b41c578c7
Shown source SHA256: cc7a67a4faac1a7a014111271f0360addf9891404bd98ca33940b3c0d05084ac
Shown target SHA256: 0cd9249a0f004a94be11657e133454bd9afe755a5a7dd1989f715c0ebed48b90

### Proposed decision

```json
{
  "claimId": "claim_748eaed66e0864f6b66db8f230941593",
  "sourceUnitDigest": "d4c07b1b279fe005d92de5d9a48b608bb67a27a4f47f56b6d8ac6994f6cf3bb7",
  "targetOwner": "docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md",
  "targetAnchor": "step-09-step-10-replan-handoff-prompt",
  "targetUnitDigest": "99660662643fdbf89df15656d4aeb079b182e1b65e9740b105ec016b41c578c7",
  "targetAncestry": [],
  "claimKind": "architecture",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
  "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. archive-with-reason: Archive the consumed prompt, with provenance value for the surviving adoption proposals. No delete-as-obsolete recommendation. Agent Coordination owns this coordination/group-thinking engine history, alongside its existing retired-engine and brainstorm history; Whole-system architecture does not own this mechanism. Evidence: Source lines 3–10 says Handoff prompt, Canonical for nothing, use only to start a fresh design chat. Source code block preserves inputs for subsequent Step 09/10 discussions; no specific live required-root consumer. Complete source heading docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md#step-09-step-10-replan-handoff-prompt (lines 1–1) is carried at docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md#step-09-step-10-replan-handoff-prompt (lines 1–1); Q3 per-file map override: docs/platform/proposals/step-09-step-10-replan-handoff-prompt.md → docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
# Step 09 / Step 10 Replan Handoff Prompt

Document type: Handoff prompt
Design status: Discussion
Implementation: Not started
Last reviewed: 2026-09-02
Canonical for: nothing; use only to start a fresh design chat

Use this prompt to start a new chat about the next architecture step after the
Agent Coordination redesign delivered through Step 08.

```txt
Chúng ta cần tiếp tục thiết kế fgOS ở giao điểm giữa:

1. Step 8b: mở rộng group-cognitive coordination vượt khỏi các fixture
   isolation-heavy/static hiện tại, để fgOS có thể biểu đạt các cơ chế
   problem-solving/coding-review/adversarial/recheck thông dụng mà không làm
   yếu các invariant đã được Step 08 chứng minh.

2. Step 10: đưa coding domain lên dùng coordination foundation đã delivered
   qua Step 08, giảm duplicate mechanism, xác định seam giữa foundation và
   coding domain, và chuẩn bị một implementation plan tốt hơn thay vì tiếp tục
   vá theo từng deferred decision.

Ngữ cảnh quan trọng:

- Agent Coordination redesign đã deliver tới Step 08 trên code.
- Step 00-08 đã được promote thành canonical baseline:
  docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md
- Step 00-06 roadmap giờ là rollout history, không phải nơi đọc design chính:
  docs/architect/agent-coordination/roadmap/team-dispatch-v1/README.md
- Step 07/08 proposal giờ là promoted history, không còn active design frontier:
  docs/architect/agent-coordination/proposals/README.md
- Step 09 hiện là group-thinking substrate proposal cấp architect.
- Step 10 hiện là coding-domain adoption proposal cấp architect, vì scope vượt
  khỏi riêng Agent Coordination.
- Component authority boundary map là architect-level guardrail song song:
  docs/architect/proposals/step-09-group-thinking-substrate.md
  docs/architect/proposals/step-10-coding-domain-adoption.md
  docs/architect/proposals/component-authority-boundary-map.md
- Architecture-wide intent đang được giữ ở:
  docs/architect/architecture-intent.md

Đọc trước, theo thứ tự:

1. docs/specs/reading-map.md
2. docs/architect/README.md
3. docs/architect/architecture-intent.md
4. docs/architect/agent-coordination/README.md
5. docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md
6. docs/architect/agent-coordination/contracts/coordination-session.md
7. docs/architect/agent-coordination/contracts/flow-definition.md
8. docs/architect/proposals/step-09-group-thinking-substrate.md
9. docs/architect/proposals/step-10-coding-domain-adoption.md
10. docs/architect/proposals/component-authority-boundary-map.md
11. docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md

Sau khi đọc, đừng re-derive lịch sử cũ. Hãy trả lời như một architecture
advisor chính, có phản biện, với mục tiêu tạo một plan sắc và thực thi được.

Việc cần làm trong chat mới:

1. Tóm tắt trạng thái hiện tại bằng "current implemented shape", không bằng
   lịch sử step.
2. Chỉ ra chính xác chỗ Step 8b và Step 09 đang gặp nhau:
   - coding-domain implementation cell cần review/fix/red-team/recheck loop;
   - current coordination foundation đã có session/FlowDefinition/actors/
     bounded dispatch/evidence, nhưng chưa đủ rich group-cognitive capability;
   - Work mutation/gitintegration vẫn phải đi qua coding-domain authority,
     không được coordination tự chiếm.
3. Phân biệt ba loại việc:
   - normalize/migrate duplicate coding mechanisms onto existing foundation;
   - extend foundation capability vì coding là consumer thứ hai chứng minh
     nhu cầu thật;
   - defer-preserve những capability rộng hơn chưa cần cho MVP.
4. Đề xuất một MVP theo từng bước, không hỏi người dùng chọn option trước:
   - mỗi bước nói real shape trên tài liệu/schema/runtime;
   - bước nào docs-only, bước nào cần implementation;
   - bước nào cần proof/test/live run;
   - invariant nào được giữ;
   - điều gì cố tình không làm.
5. Cố gắng draft "real shape" của first useful coding-domain implementation
   cell:
   - Doer;
   - Reviewer;
   - Fixer hoặc Doer-followup;
   - Red-Team hoặc adversarial reviewer;
   - recheck/disposition;
   - persistent external coordinator/driver authority outside the declared
     worker graph.
6. Kiểm tra xem current FlowDefinition/CoordinationSession shape có đủ để viết
   fixture đó không. Nếu không đủ, nêu gap bằng field/operation/event cụ thể,
   không nói chung chung.
7. Reconcile lại các open questions hiện có:
   - primitive nên là `requestRound`, `authorizeDeclaredOperation`,
     `addSessionEdge`, hay một hình khác?
   - `intent` vocabulary nên closed enum, fixture-local enum, hay registry?
   - operation-level `maxRounds` liên hệ thế nào với
     `aggregateBounds.maxRounds`?
   - Red-Team recheck là operation riêng hay Reviewer redispatch với intent
     khác?
   - ai được gọi primitive runtime deviation/round authorization?
8. Đưa ra phản biện:
   - điểm nào trong Step 8b proposal hiện quá rộng hoặc sai thứ tự;
   - điểm nào trong Step 10 proposal hiện quá migration-heavy mà chưa đạt
     design intent;
   - điểm nào nếu làm sớm sẽ phá R3/isolation proof hoặc làm Work authority
     bị lẫn vào coordination.
9. Kết quả cần xuất ra:
   - proposed replan, theo phase/MVP;
   - first fixture shape;
   - schema/runtime deltas, nếu có;
   - tests/proofs required;
   - docs cần promote/update;
   - explicit not-proposed/deferred list.

Ràng buộc:

- Không implement trong chat này trừ khi người dùng yêu cầu rõ.
- Không sửa `schema.mjs`, `session-engine.mjs`, hay source runtime trước khi
  hướng được chốt.
- Không reopen các Tier 1 invariant: evidence immutability, governance-final,
  budget caps, mutation exclusivity.
- Không nới `group-cognition-framework.yaml` để lấy communication. Fixture đó
  giữ isolation-heavy R3 proof.
- Không đề xuất autonomous in-graph leader. Persistent coordinator/driver ở
  ngoài worker graph mới là authority stop/recheck.
- Không biến Step 09/Step 10 proposal thành accepted design. Chúng vẫn là discussion cho
  tới khi được promote.
- Không đặt câu hỏi theo kiểu bắt người dùng chọn option. Hãy đưa plan có
  chính kiến, rồi nêu điểm cần chốt.
- Nếu cần dùng sol-agent/subagent để phản biện, trước hết chạy:
  node src/runner/dispatch.mjs decide --for sol-agent --needs-soul --has-live-task-access
  rồi tuân theo kết quả dispatch. Nếu không cần, tự phản biện trực tiếp.

Tone mong muốn:

- Nghĩ như advisor kiến trúc chính.
- Có chính kiến và phản biện.
- Ưu tiên plan/MVP/real shape.
- Giữ design intent ban đầu thay vì để deferred decisions làm biến dạng hệ
  thống.
- Tránh viết proposal trừu tượng khó hiểu; mỗi ý lớn phải nối được với file,
  schema, runtime primitive, proof, hoặc explicit deferred item.
```
````

### Full target shown text

````text
# Step 09 / Step 10 Replan Handoff Prompt

```txt
Document type: History
Audience: Human reviewer, architect, maintainer, agent
Purpose: Preserve historical source text for independent conservation review
Design status: Candidate
Implementation: Source snapshot retained; current implementation truth not certified
Provenance: docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md at fb046210539cbcbe8ca1dab254763f5e78c573d2; blob fd6e47f8aa7a75c77a37fb3ef1b5ae0593a90a70
Writer type: Agent draft writer
Canonical: No
Canonical for: Nothing; non-canonical candidate conservation carrier
Use this when: Reviewing source carriage, placement, intent and provenance
Do not use this for: Current authority, implementation proof or cutover approval
Last reviewed: Pending independent review
Related:
- docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md
Supersedes: None; legacy source remains intact
Superseded by: None
```

Added in candidate: Historical snapshot; Archive the consumed prompt, with provenance value for the surviving adoption proposals. No delete-as-obsolete recommendation. Original source metadata and text follow. Physical relative-link destinations alone are rebased to the same repository paths. Units with inherited missing links are preserved as literal fenced source text, without substituting another design or changing any assertion. Source metadata is provenance, not candidate authority.

Source relationship: [original source](../../../../architect/proposals/step-09-step-10-replan-handoff-prompt.md).


Document type: Handoff prompt
Design status: Discussion
Implementation: Not started
Last reviewed: 2026-09-02
Canonical for: nothing; use only to start a fresh design chat

Use this prompt to start a new chat about the next architecture step after the
Agent Coordination redesign delivered through Step 08.

```txt
Chúng ta cần tiếp tục thiết kế fgOS ở giao điểm giữa:

1. Step 8b: mở rộng group-cognitive coordination vượt khỏi các fixture
   isolation-heavy/static hiện tại, để fgOS có thể biểu đạt các cơ chế
   problem-solving/coding-review/adversarial/recheck thông dụng mà không làm
   yếu các invariant đã được Step 08 chứng minh.

2. Step 10: đưa coding domain lên dùng coordination foundation đã delivered
   qua Step 08, giảm duplicate mechanism, xác định seam giữa foundation và
   coding domain, và chuẩn bị một implementation plan tốt hơn thay vì tiếp tục
   vá theo từng deferred decision.

Ngữ cảnh quan trọng:

- Agent Coordination redesign đã deliver tới Step 08 trên code.
- Step 00-08 đã được promote thành canonical baseline:
  docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md
- Step 00-06 roadmap giờ là rollout history, không phải nơi đọc design chính:
  docs/architect/agent-coordination/roadmap/team-dispatch-v1/README.md
- Step 07/08 proposal giờ là promoted history, không còn active design frontier:
  docs/architect/agent-coordination/proposals/README.md
- Step 09 hiện là group-thinking substrate proposal cấp architect.
- Step 10 hiện là coding-domain adoption proposal cấp architect, vì scope vượt
  khỏi riêng Agent Coordination.
- Component authority boundary map là architect-level guardrail song song:
  docs/architect/proposals/step-09-group-thinking-substrate.md
  docs/architect/proposals/step-10-coding-domain-adoption.md
  docs/architect/proposals/component-authority-boundary-map.md
- Architecture-wide intent đang được giữ ở:
  docs/architect/architecture-intent.md

Đọc trước, theo thứ tự:

1. docs/specs/reading-map.md
2. docs/architect/README.md
3. docs/architect/architecture-intent.md
4. docs/architect/agent-coordination/README.md
5. docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md
6. docs/architect/agent-coordination/contracts/coordination-session.md
7. docs/architect/agent-coordination/contracts/flow-definition.md
8. docs/architect/proposals/step-09-group-thinking-substrate.md
9. docs/architect/proposals/step-10-coding-domain-adoption.md
10. docs/architect/proposals/component-authority-boundary-map.md
11. docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md

Sau khi đọc, đừng re-derive lịch sử cũ. Hãy trả lời như một architecture
advisor chính, có phản biện, với mục tiêu tạo một plan sắc và thực thi được.

Việc cần làm trong chat mới:

1. Tóm tắt trạng thái hiện tại bằng "current implemented shape", không bằng
   lịch sử step.
2. Chỉ ra chính xác chỗ Step 8b và Step 09 đang gặp nhau:
   - coding-domain implementation cell cần review/fix/red-team/recheck loop;
   - current coordination foundation đã có session/FlowDefinition/actors/
     bounded dispatch/evidence, nhưng chưa đủ rich group-cognitive capability;
   - Work mutation/gitintegration vẫn phải đi qua coding-domain authority,
     không được coordination tự chiếm.
3. Phân biệt ba loại việc:
   - normalize/migrate duplicate coding mechanisms onto existing foundation;
   - extend foundation capability vì coding là consumer thứ hai chứng minh
     nhu cầu thật;
   - defer-preserve những capability rộng hơn chưa cần cho MVP.
4. Đề xuất một MVP theo từng bước, không hỏi người dùng chọn option trước:
   - mỗi bước nói real shape trên tài liệu/schema/runtime;
   - bước nào docs-only, bước nào cần implementation;
   - bước nào cần proof/test/live run;
   - invariant nào được giữ;
   - điều gì cố tình không làm.
5. Cố gắng draft "real shape" của first useful coding-domain implementation
   cell:
   - Doer;
   - Reviewer;
   - Fixer hoặc Doer-followup;
   - Red-Team hoặc adversarial reviewer;
   - recheck/disposition;
   - persistent external coordinator/driver authority outside the declared
     worker graph.
6. Kiểm tra xem current FlowDefinition/CoordinationSession shape có đủ để viết
   fixture đó không. Nếu không đủ, nêu gap bằng field/operation/event cụ thể,
   không nói chung chung.
7. Reconcile lại các open questions hiện có:
   - primitive nên là `requestRound`, `authorizeDeclaredOperation`,
     `addSessionEdge`, hay một hình khác?
   - `intent` vocabulary nên closed enum, fixture-local enum, hay registry?
   - operation-level `maxRounds` liên hệ thế nào với
     `aggregateBounds.maxRounds`?
   - Red-Team recheck là operation riêng hay Reviewer redispatch với intent
     khác?
   - ai được gọi primitive runtime deviation/round authorization?
8. Đưa ra phản biện:
   - điểm nào trong Step 8b proposal hiện quá rộng hoặc sai thứ tự;
   - điểm nào trong Step 10 proposal hiện quá migration-heavy mà chưa đạt
     design intent;
   - điểm nào nếu làm sớm sẽ phá R3/isolation proof hoặc làm Work authority
     bị lẫn vào coordination.
9. Kết quả cần xuất ra:
   - proposed replan, theo phase/MVP;
   - first fixture shape;
   - schema/runtime deltas, nếu có;
   - tests/proofs required;
   - docs cần promote/update;
   - explicit not-proposed/deferred list.

Ràng buộc:

- Không implement trong chat này trừ khi người dùng yêu cầu rõ.
- Không sửa `schema.mjs`, `session-engine.mjs`, hay source runtime trước khi
  hướng được chốt.
- Không reopen các Tier 1 invariant: evidence immutability, governance-final,
  budget caps, mutation exclusivity.
- Không nới `group-cognition-framework.yaml` để lấy communication. Fixture đó
  giữ isolation-heavy R3 proof.
- Không đề xuất autonomous in-graph leader. Persistent coordinator/driver ở
  ngoài worker graph mới là authority stop/recheck.
- Không biến Step 09/Step 10 proposal thành accepted design. Chúng vẫn là discussion cho
  tới khi được promote.
- Không đặt câu hỏi theo kiểu bắt người dùng chọn option. Hãy đưa plan có
  chính kiến, rồi nêu điểm cần chốt.
- Nếu cần dùng sol-agent/subagent để phản biện, trước hết chạy:
  node src/runner/dispatch.mjs decide --for sol-agent --needs-soul --has-live-task-access
  rồi tuân theo kết quả dispatch. Nếu không cần, tự phản biện trực tiếp.

Tone mong muốn:

- Nghĩ như advisor kiến trúc chính.
- Có chính kiến và phản biện.
- Ưu tiên plan/MVP/real shape.
- Giữ design intent ban đầu thay vì để deferred decisions làm biến dạng hệ
  thống.
- Tránh viết proposal trừu tượng khó hiểu; mỗi ý lớn phải nối được với file,
  schema, runtime primitive, proof, hoặc explicit deferred item.
```
````

### Correction before/after and reasons

```json
{
  "claimId": "claim_748eaed66e0864f6b66db8f230941593",
  "source": "docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md",
  "shard": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-17-step-09-step-10-replan-handoff-prompt.json",
  "reasons": [
    "R7-1 mapped proposal restoration / R7-2 owning-area history relocation",
    "Corrected evidence, placement rationale or A36 class"
  ],
  "before": {
    "claimId": "claim_748eaed66e0864f6b66db8f230941593",
    "sourceUnitDigest": "d4c07b1b279fe005d92de5d9a48b608bb67a27a4f47f56b6d8ac6994f6cf3bb7",
    "targetOwner": "docs/platform/system-architecture/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md",
    "targetAnchor": "step-09-step-10-replan-handoff-prompt",
    "targetUnitDigest": "99660662643fdbf89df15656d4aeb079b182e1b65e9740b105ec016b41c578c7",
    "targetAncestry": [],
    "claimKind": "architecture",
    "disposition": "archive-with-reason",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. archive-with-reason: Archive the consumed prompt, with provenance value for the surviving adoption proposals. No delete-as-obsolete recommendation. Evidence: Source lines 3–10 says Handoff prompt, Canonical for nothing, use only to start a fresh design chat. Source code block preserves inputs for subsequent Step 09/10 discussions; no specific live required-root consumer. Complete source heading docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md#step-09-step-10-replan-handoff-prompt (lines 1–1) is carried at docs/platform/system-architecture/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md#step-09-step-10-replan-handoff-prompt (lines 1–1); Q3 per-file map override: docs/platform/proposals/step-09-step-10-replan-handoff-prompt.md → docs/platform/system-architecture/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  },
  "after": {
    "claimId": "claim_748eaed66e0864f6b66db8f230941593",
    "sourceUnitDigest": "d4c07b1b279fe005d92de5d9a48b608bb67a27a4f47f56b6d8ac6994f6cf3bb7",
    "targetOwner": "docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md",
    "targetAnchor": "step-09-step-10-replan-handoff-prompt",
    "targetUnitDigest": "99660662643fdbf89df15656d4aeb079b182e1b65e9740b105ec016b41c578c7",
    "targetAncestry": [],
    "claimKind": "architecture",
    "disposition": "archive-with-reason",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
    "rationale": "Judgment: target unit digest differs; mandatory A36 deep read. archive-with-reason: Archive the consumed prompt, with provenance value for the surviving adoption proposals. No delete-as-obsolete recommendation. Agent Coordination owns this coordination/group-thinking engine history, alongside its existing retired-engine and brainstorm history; Whole-system architecture does not own this mechanism. Evidence: Source lines 3–10 says Handoff prompt, Canonical for nothing, use only to start a fresh design chat. Source code block preserves inputs for subsequent Step 09/10 discussions; no specific live required-root consumer. Complete source heading docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md#step-09-step-10-replan-handoff-prompt (lines 1–1) is carried at docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md#step-09-step-10-replan-handoff-prompt (lines 1–1); Q3 per-file map override: docs/platform/proposals/step-09-step-10-replan-handoff-prompt.md → docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md. Difference is limited to inserted candidate metadata, literal-source fencing, original pre-H1 YAML relocation or physical Markdown link rebasing; the committed accounting records exact line mapping and reversible transformations. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  }
}
```

## claim_2ba1e1cf145db1520a75d592e08e6cc3

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **yes**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md#unheaded-block-1, lines 3–7.
Target: docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md#unheaded-block-4.
Source digest: 55c67de7e3f08e6b2bb094056e0a51a0ad796d3da1f44561e5be4067a3739b93
Target digest: 55c67de7e3f08e6b2bb094056e0a51a0ad796d3da1f44561e5be4067a3739b93
Shown source SHA256: 55c67de7e3f08e6b2bb094056e0a51a0ad796d3da1f44561e5be4067a3739b93
Shown target SHA256: 55c67de7e3f08e6b2bb094056e0a51a0ad796d3da1f44561e5be4067a3739b93

### Proposed decision

```json
{
  "claimId": "claim_2ba1e1cf145db1520a75d592e08e6cc3",
  "sourceUnitDigest": "55c67de7e3f08e6b2bb094056e0a51a0ad796d3da1f44561e5be4067a3739b93",
  "targetOwner": "docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md",
  "targetAnchor": "unheaded-block-4",
  "targetUnitDigest": "55c67de7e3f08e6b2bb094056e0a51a0ad796d3da1f44561e5be4067a3739b93",
  "targetAncestry": [
    "Step 09 / Step 10 Replan Handoff Prompt"
  ],
  "claimKind": "architecture",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the consumed prompt, with provenance value for the surviving adoption proposals. No delete-as-obsolete recommendation. Agent Coordination owns this coordination/group-thinking engine history, alongside its existing retired-engine and brainstorm history; Whole-system architecture does not own this mechanism. Evidence: Source lines 3–10 says Handoff prompt, Canonical for nothing, use only to start a fresh design chat. Source code block preserves inputs for subsequent Step 09/10 discussions; no specific live required-root consumer. Complete source unheaded-block docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md#unheaded-block-1 (lines 3–7) is carried at docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md#unheaded-block-4 (lines 27–31); Q3 per-file map override: docs/platform/proposals/step-09-step-10-replan-handoff-prompt.md → docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Document type: Handoff prompt
Design status: Discussion
Implementation: Not started
Last reviewed: 2026-09-02
Canonical for: nothing; use only to start a fresh design chat
```

### Full target shown text

```text
Document type: Handoff prompt
Design status: Discussion
Implementation: Not started
Last reviewed: 2026-09-02
Canonical for: nothing; use only to start a fresh design chat
```

### Correction before/after and reasons

```json
{
  "claimId": "claim_2ba1e1cf145db1520a75d592e08e6cc3",
  "source": "docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md",
  "shard": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-17-step-09-step-10-replan-handoff-prompt.json",
  "reasons": [
    "R7-1 mapped proposal restoration / R7-2 owning-area history relocation",
    "Corrected evidence, placement rationale or A36 class"
  ],
  "before": {
    "claimId": "claim_2ba1e1cf145db1520a75d592e08e6cc3",
    "sourceUnitDigest": "55c67de7e3f08e6b2bb094056e0a51a0ad796d3da1f44561e5be4067a3739b93",
    "targetOwner": "docs/platform/system-architecture/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md",
    "targetAnchor": "unheaded-block-4",
    "targetUnitDigest": "55c67de7e3f08e6b2bb094056e0a51a0ad796d3da1f44561e5be4067a3739b93",
    "targetAncestry": [
      "Step 09 / Step 10 Replan Handoff Prompt"
    ],
    "claimKind": "architecture",
    "disposition": "archive-with-reason",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the consumed prompt, with provenance value for the surviving adoption proposals. No delete-as-obsolete recommendation. Evidence: Source lines 3–10 says Handoff prompt, Canonical for nothing, use only to start a fresh design chat. Source code block preserves inputs for subsequent Step 09/10 discussions; no specific live required-root consumer. Complete source unheaded-block docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md#unheaded-block-1 (lines 3–7) is carried at docs/platform/system-architecture/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md#unheaded-block-4 (lines 27–31); Q3 per-file map override: docs/platform/proposals/step-09-step-10-replan-handoff-prompt.md → docs/platform/system-architecture/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  },
  "after": {
    "claimId": "claim_2ba1e1cf145db1520a75d592e08e6cc3",
    "sourceUnitDigest": "55c67de7e3f08e6b2bb094056e0a51a0ad796d3da1f44561e5be4067a3739b93",
    "targetOwner": "docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md",
    "targetAnchor": "unheaded-block-4",
    "targetUnitDigest": "55c67de7e3f08e6b2bb094056e0a51a0ad796d3da1f44561e5be4067a3739b93",
    "targetAncestry": [
      "Step 09 / Step 10 Replan Handoff Prompt"
    ],
    "claimKind": "architecture",
    "disposition": "archive-with-reason",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the consumed prompt, with provenance value for the surviving adoption proposals. No delete-as-obsolete recommendation. Agent Coordination owns this coordination/group-thinking engine history, alongside its existing retired-engine and brainstorm history; Whole-system architecture does not own this mechanism. Evidence: Source lines 3–10 says Handoff prompt, Canonical for nothing, use only to start a fresh design chat. Source code block preserves inputs for subsequent Step 09/10 discussions; no specific live required-root consumer. Complete source unheaded-block docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md#unheaded-block-1 (lines 3–7) is carried at docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md#unheaded-block-4 (lines 27–31); Q3 per-file map override: docs/platform/proposals/step-09-step-10-replan-handoff-prompt.md → docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  }
}
```

## claim_7b86afff62ae3c9360f7d7e884bbfaf8

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **yes**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md#unheaded-block-2, lines 9–10.
Target: docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md#unheaded-block-5.
Source digest: 705a9e6fd739bd254aa3a06a10bfe96bfe160c0e970988f15659548ee44660ff
Target digest: 705a9e6fd739bd254aa3a06a10bfe96bfe160c0e970988f15659548ee44660ff
Shown source SHA256: 705a9e6fd739bd254aa3a06a10bfe96bfe160c0e970988f15659548ee44660ff
Shown target SHA256: 705a9e6fd739bd254aa3a06a10bfe96bfe160c0e970988f15659548ee44660ff

### Proposed decision

```json
{
  "claimId": "claim_7b86afff62ae3c9360f7d7e884bbfaf8",
  "sourceUnitDigest": "705a9e6fd739bd254aa3a06a10bfe96bfe160c0e970988f15659548ee44660ff",
  "targetOwner": "docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md",
  "targetAnchor": "unheaded-block-5",
  "targetUnitDigest": "705a9e6fd739bd254aa3a06a10bfe96bfe160c0e970988f15659548ee44660ff",
  "targetAncestry": [
    "Step 09 / Step 10 Replan Handoff Prompt"
  ],
  "claimKind": "architecture",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the consumed prompt, with provenance value for the surviving adoption proposals. No delete-as-obsolete recommendation. Agent Coordination owns this coordination/group-thinking engine history, alongside its existing retired-engine and brainstorm history; Whole-system architecture does not own this mechanism. Evidence: Source lines 3–10 says Handoff prompt, Canonical for nothing, use only to start a fresh design chat. Source code block preserves inputs for subsequent Step 09/10 discussions; no specific live required-root consumer. Complete source unheaded-block docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md#unheaded-block-2 (lines 9–10) is carried at docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md#unheaded-block-5 (lines 33–34); Q3 per-file map override: docs/platform/proposals/step-09-step-10-replan-handoff-prompt.md → docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

```text
Use this prompt to start a new chat about the next architecture step after the
Agent Coordination redesign delivered through Step 08.
```

### Full target shown text

```text
Use this prompt to start a new chat about the next architecture step after the
Agent Coordination redesign delivered through Step 08.
```

### Correction before/after and reasons

```json
{
  "claimId": "claim_7b86afff62ae3c9360f7d7e884bbfaf8",
  "source": "docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md",
  "shard": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-17-step-09-step-10-replan-handoff-prompt.json",
  "reasons": [
    "R7-1 mapped proposal restoration / R7-2 owning-area history relocation",
    "Corrected evidence, placement rationale or A36 class"
  ],
  "before": {
    "claimId": "claim_7b86afff62ae3c9360f7d7e884bbfaf8",
    "sourceUnitDigest": "705a9e6fd739bd254aa3a06a10bfe96bfe160c0e970988f15659548ee44660ff",
    "targetOwner": "docs/platform/system-architecture/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md",
    "targetAnchor": "unheaded-block-5",
    "targetUnitDigest": "705a9e6fd739bd254aa3a06a10bfe96bfe160c0e970988f15659548ee44660ff",
    "targetAncestry": [
      "Step 09 / Step 10 Replan Handoff Prompt"
    ],
    "claimKind": "architecture",
    "disposition": "archive-with-reason",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the consumed prompt, with provenance value for the surviving adoption proposals. No delete-as-obsolete recommendation. Evidence: Source lines 3–10 says Handoff prompt, Canonical for nothing, use only to start a fresh design chat. Source code block preserves inputs for subsequent Step 09/10 discussions; no specific live required-root consumer. Complete source unheaded-block docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md#unheaded-block-2 (lines 9–10) is carried at docs/platform/system-architecture/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md#unheaded-block-5 (lines 33–34); Q3 per-file map override: docs/platform/proposals/step-09-step-10-replan-handoff-prompt.md → docs/platform/system-architecture/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  },
  "after": {
    "claimId": "claim_7b86afff62ae3c9360f7d7e884bbfaf8",
    "sourceUnitDigest": "705a9e6fd739bd254aa3a06a10bfe96bfe160c0e970988f15659548ee44660ff",
    "targetOwner": "docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md",
    "targetAnchor": "unheaded-block-5",
    "targetUnitDigest": "705a9e6fd739bd254aa3a06a10bfe96bfe160c0e970988f15659548ee44660ff",
    "targetAncestry": [
      "Step 09 / Step 10 Replan Handoff Prompt"
    ],
    "claimKind": "architecture",
    "disposition": "archive-with-reason",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the consumed prompt, with provenance value for the surviving adoption proposals. No delete-as-obsolete recommendation. Agent Coordination owns this coordination/group-thinking engine history, alongside its existing retired-engine and brainstorm history; Whole-system architecture does not own this mechanism. Evidence: Source lines 3–10 says Handoff prompt, Canonical for nothing, use only to start a fresh design chat. Source code block preserves inputs for subsequent Step 09/10 discussions; no specific live required-root consumer. Complete source unheaded-block docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md#unheaded-block-2 (lines 9–10) is carried at docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md#unheaded-block-5 (lines 33–34); Q3 per-file map override: docs/platform/proposals/step-09-step-10-replan-handoff-prompt.md → docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  }
}
```

## claim_eadf79b0b7a6fd73cf80175beeff02f2

Changed by 0f063d18fdab01cb6f2c915bb60ff528c5e0f238: **yes**. Mechanical class: Unit-exact.
Source: docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md#unheaded-block-3, lines 12–145.
Target: docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md#unheaded-block-6.
Source digest: 6348d46b8f28f477cd1e4adc0983ba6d98256daf4175b2facc6f6bd1d70d374e
Target digest: 6348d46b8f28f477cd1e4adc0983ba6d98256daf4175b2facc6f6bd1d70d374e
Shown source SHA256: 6348d46b8f28f477cd1e4adc0983ba6d98256daf4175b2facc6f6bd1d70d374e
Shown target SHA256: 6348d46b8f28f477cd1e4adc0983ba6d98256daf4175b2facc6f6bd1d70d374e

### Proposed decision

```json
{
  "claimId": "claim_eadf79b0b7a6fd73cf80175beeff02f2",
  "sourceUnitDigest": "6348d46b8f28f477cd1e4adc0983ba6d98256daf4175b2facc6f6bd1d70d374e",
  "targetOwner": "docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md",
  "targetAnchor": "unheaded-block-6",
  "targetUnitDigest": "6348d46b8f28f477cd1e4adc0983ba6d98256daf4175b2facc6f6bd1d70d374e",
  "targetAncestry": [
    "Step 09 / Step 10 Replan Handoff Prompt"
  ],
  "claimKind": "architecture",
  "disposition": "archive-with-reason",
  "reviewStatus": "pending",
  "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
  "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the consumed prompt, with provenance value for the surviving adoption proposals. No delete-as-obsolete recommendation. Agent Coordination owns this coordination/group-thinking engine history, alongside its existing retired-engine and brainstorm history; Whole-system architecture does not own this mechanism. Evidence: Source lines 3–10 says Handoff prompt, Canonical for nothing, use only to start a fresh design chat. Source code block preserves inputs for subsequent Step 09/10 discussions; no specific live required-root consumer. Complete source unheaded-block docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md#unheaded-block-3 (lines 12–145) is carried at docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md#unheaded-block-6 (lines 36–169); Q3 per-file map override: docs/platform/proposals/step-09-step-10-replan-handoff-prompt.md → docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
}
```

### Full source shown text

````text
```txt
Chúng ta cần tiếp tục thiết kế fgOS ở giao điểm giữa:

1. Step 8b: mở rộng group-cognitive coordination vượt khỏi các fixture
   isolation-heavy/static hiện tại, để fgOS có thể biểu đạt các cơ chế
   problem-solving/coding-review/adversarial/recheck thông dụng mà không làm
   yếu các invariant đã được Step 08 chứng minh.

2. Step 10: đưa coding domain lên dùng coordination foundation đã delivered
   qua Step 08, giảm duplicate mechanism, xác định seam giữa foundation và
   coding domain, và chuẩn bị một implementation plan tốt hơn thay vì tiếp tục
   vá theo từng deferred decision.

Ngữ cảnh quan trọng:

- Agent Coordination redesign đã deliver tới Step 08 trên code.
- Step 00-08 đã được promote thành canonical baseline:
  docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md
- Step 00-06 roadmap giờ là rollout history, không phải nơi đọc design chính:
  docs/architect/agent-coordination/roadmap/team-dispatch-v1/README.md
- Step 07/08 proposal giờ là promoted history, không còn active design frontier:
  docs/architect/agent-coordination/proposals/README.md
- Step 09 hiện là group-thinking substrate proposal cấp architect.
- Step 10 hiện là coding-domain adoption proposal cấp architect, vì scope vượt
  khỏi riêng Agent Coordination.
- Component authority boundary map là architect-level guardrail song song:
  docs/architect/proposals/step-09-group-thinking-substrate.md
  docs/architect/proposals/step-10-coding-domain-adoption.md
  docs/architect/proposals/component-authority-boundary-map.md
- Architecture-wide intent đang được giữ ở:
  docs/architect/architecture-intent.md

Đọc trước, theo thứ tự:

1. docs/specs/reading-map.md
2. docs/architect/README.md
3. docs/architect/architecture-intent.md
4. docs/architect/agent-coordination/README.md
5. docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md
6. docs/architect/agent-coordination/contracts/coordination-session.md
7. docs/architect/agent-coordination/contracts/flow-definition.md
8. docs/architect/proposals/step-09-group-thinking-substrate.md
9. docs/architect/proposals/step-10-coding-domain-adoption.md
10. docs/architect/proposals/component-authority-boundary-map.md
11. docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md

Sau khi đọc, đừng re-derive lịch sử cũ. Hãy trả lời như một architecture
advisor chính, có phản biện, với mục tiêu tạo một plan sắc và thực thi được.

Việc cần làm trong chat mới:

1. Tóm tắt trạng thái hiện tại bằng "current implemented shape", không bằng
   lịch sử step.
2. Chỉ ra chính xác chỗ Step 8b và Step 09 đang gặp nhau:
   - coding-domain implementation cell cần review/fix/red-team/recheck loop;
   - current coordination foundation đã có session/FlowDefinition/actors/
     bounded dispatch/evidence, nhưng chưa đủ rich group-cognitive capability;
   - Work mutation/gitintegration vẫn phải đi qua coding-domain authority,
     không được coordination tự chiếm.
3. Phân biệt ba loại việc:
   - normalize/migrate duplicate coding mechanisms onto existing foundation;
   - extend foundation capability vì coding là consumer thứ hai chứng minh
     nhu cầu thật;
   - defer-preserve những capability rộng hơn chưa cần cho MVP.
4. Đề xuất một MVP theo từng bước, không hỏi người dùng chọn option trước:
   - mỗi bước nói real shape trên tài liệu/schema/runtime;
   - bước nào docs-only, bước nào cần implementation;
   - bước nào cần proof/test/live run;
   - invariant nào được giữ;
   - điều gì cố tình không làm.
5. Cố gắng draft "real shape" của first useful coding-domain implementation
   cell:
   - Doer;
   - Reviewer;
   - Fixer hoặc Doer-followup;
   - Red-Team hoặc adversarial reviewer;
   - recheck/disposition;
   - persistent external coordinator/driver authority outside the declared
     worker graph.
6. Kiểm tra xem current FlowDefinition/CoordinationSession shape có đủ để viết
   fixture đó không. Nếu không đủ, nêu gap bằng field/operation/event cụ thể,
   không nói chung chung.
7. Reconcile lại các open questions hiện có:
   - primitive nên là `requestRound`, `authorizeDeclaredOperation`,
     `addSessionEdge`, hay một hình khác?
   - `intent` vocabulary nên closed enum, fixture-local enum, hay registry?
   - operation-level `maxRounds` liên hệ thế nào với
     `aggregateBounds.maxRounds`?
   - Red-Team recheck là operation riêng hay Reviewer redispatch với intent
     khác?
   - ai được gọi primitive runtime deviation/round authorization?
8. Đưa ra phản biện:
   - điểm nào trong Step 8b proposal hiện quá rộng hoặc sai thứ tự;
   - điểm nào trong Step 10 proposal hiện quá migration-heavy mà chưa đạt
     design intent;
   - điểm nào nếu làm sớm sẽ phá R3/isolation proof hoặc làm Work authority
     bị lẫn vào coordination.
9. Kết quả cần xuất ra:
   - proposed replan, theo phase/MVP;
   - first fixture shape;
   - schema/runtime deltas, nếu có;
   - tests/proofs required;
   - docs cần promote/update;
   - explicit not-proposed/deferred list.

Ràng buộc:

- Không implement trong chat này trừ khi người dùng yêu cầu rõ.
- Không sửa `schema.mjs`, `session-engine.mjs`, hay source runtime trước khi
  hướng được chốt.
- Không reopen các Tier 1 invariant: evidence immutability, governance-final,
  budget caps, mutation exclusivity.
- Không nới `group-cognition-framework.yaml` để lấy communication. Fixture đó
  giữ isolation-heavy R3 proof.
- Không đề xuất autonomous in-graph leader. Persistent coordinator/driver ở
  ngoài worker graph mới là authority stop/recheck.
- Không biến Step 09/Step 10 proposal thành accepted design. Chúng vẫn là discussion cho
  tới khi được promote.
- Không đặt câu hỏi theo kiểu bắt người dùng chọn option. Hãy đưa plan có
  chính kiến, rồi nêu điểm cần chốt.
- Nếu cần dùng sol-agent/subagent để phản biện, trước hết chạy:
  node src/runner/dispatch.mjs decide --for sol-agent --needs-soul --has-live-task-access
  rồi tuân theo kết quả dispatch. Nếu không cần, tự phản biện trực tiếp.

Tone mong muốn:

- Nghĩ như advisor kiến trúc chính.
- Có chính kiến và phản biện.
- Ưu tiên plan/MVP/real shape.
- Giữ design intent ban đầu thay vì để deferred decisions làm biến dạng hệ
  thống.
- Tránh viết proposal trừu tượng khó hiểu; mỗi ý lớn phải nối được với file,
  schema, runtime primitive, proof, hoặc explicit deferred item.
```
````

### Full target shown text

````text
```txt
Chúng ta cần tiếp tục thiết kế fgOS ở giao điểm giữa:

1. Step 8b: mở rộng group-cognitive coordination vượt khỏi các fixture
   isolation-heavy/static hiện tại, để fgOS có thể biểu đạt các cơ chế
   problem-solving/coding-review/adversarial/recheck thông dụng mà không làm
   yếu các invariant đã được Step 08 chứng minh.

2. Step 10: đưa coding domain lên dùng coordination foundation đã delivered
   qua Step 08, giảm duplicate mechanism, xác định seam giữa foundation và
   coding domain, và chuẩn bị một implementation plan tốt hơn thay vì tiếp tục
   vá theo từng deferred decision.

Ngữ cảnh quan trọng:

- Agent Coordination redesign đã deliver tới Step 08 trên code.
- Step 00-08 đã được promote thành canonical baseline:
  docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md
- Step 00-06 roadmap giờ là rollout history, không phải nơi đọc design chính:
  docs/architect/agent-coordination/roadmap/team-dispatch-v1/README.md
- Step 07/08 proposal giờ là promoted history, không còn active design frontier:
  docs/architect/agent-coordination/proposals/README.md
- Step 09 hiện là group-thinking substrate proposal cấp architect.
- Step 10 hiện là coding-domain adoption proposal cấp architect, vì scope vượt
  khỏi riêng Agent Coordination.
- Component authority boundary map là architect-level guardrail song song:
  docs/architect/proposals/step-09-group-thinking-substrate.md
  docs/architect/proposals/step-10-coding-domain-adoption.md
  docs/architect/proposals/component-authority-boundary-map.md
- Architecture-wide intent đang được giữ ở:
  docs/architect/architecture-intent.md

Đọc trước, theo thứ tự:

1. docs/specs/reading-map.md
2. docs/architect/README.md
3. docs/architect/architecture-intent.md
4. docs/architect/agent-coordination/README.md
5. docs/architect/agent-coordination/architecture/coordination-foundation-baseline.md
6. docs/architect/agent-coordination/contracts/coordination-session.md
7. docs/architect/agent-coordination/contracts/flow-definition.md
8. docs/architect/proposals/step-09-group-thinking-substrate.md
9. docs/architect/proposals/step-10-coding-domain-adoption.md
10. docs/architect/proposals/component-authority-boundary-map.md
11. docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md

Sau khi đọc, đừng re-derive lịch sử cũ. Hãy trả lời như một architecture
advisor chính, có phản biện, với mục tiêu tạo một plan sắc và thực thi được.

Việc cần làm trong chat mới:

1. Tóm tắt trạng thái hiện tại bằng "current implemented shape", không bằng
   lịch sử step.
2. Chỉ ra chính xác chỗ Step 8b và Step 09 đang gặp nhau:
   - coding-domain implementation cell cần review/fix/red-team/recheck loop;
   - current coordination foundation đã có session/FlowDefinition/actors/
     bounded dispatch/evidence, nhưng chưa đủ rich group-cognitive capability;
   - Work mutation/gitintegration vẫn phải đi qua coding-domain authority,
     không được coordination tự chiếm.
3. Phân biệt ba loại việc:
   - normalize/migrate duplicate coding mechanisms onto existing foundation;
   - extend foundation capability vì coding là consumer thứ hai chứng minh
     nhu cầu thật;
   - defer-preserve những capability rộng hơn chưa cần cho MVP.
4. Đề xuất một MVP theo từng bước, không hỏi người dùng chọn option trước:
   - mỗi bước nói real shape trên tài liệu/schema/runtime;
   - bước nào docs-only, bước nào cần implementation;
   - bước nào cần proof/test/live run;
   - invariant nào được giữ;
   - điều gì cố tình không làm.
5. Cố gắng draft "real shape" của first useful coding-domain implementation
   cell:
   - Doer;
   - Reviewer;
   - Fixer hoặc Doer-followup;
   - Red-Team hoặc adversarial reviewer;
   - recheck/disposition;
   - persistent external coordinator/driver authority outside the declared
     worker graph.
6. Kiểm tra xem current FlowDefinition/CoordinationSession shape có đủ để viết
   fixture đó không. Nếu không đủ, nêu gap bằng field/operation/event cụ thể,
   không nói chung chung.
7. Reconcile lại các open questions hiện có:
   - primitive nên là `requestRound`, `authorizeDeclaredOperation`,
     `addSessionEdge`, hay một hình khác?
   - `intent` vocabulary nên closed enum, fixture-local enum, hay registry?
   - operation-level `maxRounds` liên hệ thế nào với
     `aggregateBounds.maxRounds`?
   - Red-Team recheck là operation riêng hay Reviewer redispatch với intent
     khác?
   - ai được gọi primitive runtime deviation/round authorization?
8. Đưa ra phản biện:
   - điểm nào trong Step 8b proposal hiện quá rộng hoặc sai thứ tự;
   - điểm nào trong Step 10 proposal hiện quá migration-heavy mà chưa đạt
     design intent;
   - điểm nào nếu làm sớm sẽ phá R3/isolation proof hoặc làm Work authority
     bị lẫn vào coordination.
9. Kết quả cần xuất ra:
   - proposed replan, theo phase/MVP;
   - first fixture shape;
   - schema/runtime deltas, nếu có;
   - tests/proofs required;
   - docs cần promote/update;
   - explicit not-proposed/deferred list.

Ràng buộc:

- Không implement trong chat này trừ khi người dùng yêu cầu rõ.
- Không sửa `schema.mjs`, `session-engine.mjs`, hay source runtime trước khi
  hướng được chốt.
- Không reopen các Tier 1 invariant: evidence immutability, governance-final,
  budget caps, mutation exclusivity.
- Không nới `group-cognition-framework.yaml` để lấy communication. Fixture đó
  giữ isolation-heavy R3 proof.
- Không đề xuất autonomous in-graph leader. Persistent coordinator/driver ở
  ngoài worker graph mới là authority stop/recheck.
- Không biến Step 09/Step 10 proposal thành accepted design. Chúng vẫn là discussion cho
  tới khi được promote.
- Không đặt câu hỏi theo kiểu bắt người dùng chọn option. Hãy đưa plan có
  chính kiến, rồi nêu điểm cần chốt.
- Nếu cần dùng sol-agent/subagent để phản biện, trước hết chạy:
  node src/runner/dispatch.mjs decide --for sol-agent --needs-soul --has-live-task-access
  rồi tuân theo kết quả dispatch. Nếu không cần, tự phản biện trực tiếp.

Tone mong muốn:

- Nghĩ như advisor kiến trúc chính.
- Có chính kiến và phản biện.
- Ưu tiên plan/MVP/real shape.
- Giữ design intent ban đầu thay vì để deferred decisions làm biến dạng hệ
  thống.
- Tránh viết proposal trừu tượng khó hiểu; mỗi ý lớn phải nối được với file,
  schema, runtime primitive, proof, hoặc explicit deferred item.
```
````

### Correction before/after and reasons

```json
{
  "claimId": "claim_eadf79b0b7a6fd73cf80175beeff02f2",
  "source": "docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md",
  "shard": "plans/260925-documentation-authority-unification/ledger/decisions/s7-proposals-redesigns-17-step-09-step-10-replan-handoff-prompt.json",
  "reasons": [
    "R7-1 mapped proposal restoration / R7-2 owning-area history relocation",
    "Corrected evidence, placement rationale or A36 class"
  ],
  "before": {
    "claimId": "claim_eadf79b0b7a6fd73cf80175beeff02f2",
    "sourceUnitDigest": "6348d46b8f28f477cd1e4adc0983ba6d98256daf4175b2facc6f6bd1d70d374e",
    "targetOwner": "docs/platform/system-architecture/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md",
    "targetAnchor": "unheaded-block-6",
    "targetUnitDigest": "6348d46b8f28f477cd1e4adc0983ba6d98256daf4175b2facc6f6bd1d70d374e",
    "targetAncestry": [
      "Step 09 / Step 10 Replan Handoff Prompt"
    ],
    "claimKind": "architecture",
    "disposition": "archive-with-reason",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792034226117-40d90d09@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the consumed prompt, with provenance value for the surviving adoption proposals. No delete-as-obsolete recommendation. Evidence: Source lines 3–10 says Handoff prompt, Canonical for nothing, use only to start a fresh design chat. Source code block preserves inputs for subsequent Step 09/10 discussions; no specific live required-root consumer. Complete source unheaded-block docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md#unheaded-block-3 (lines 12–145) is carried at docs/platform/system-architecture/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md#unheaded-block-6 (lines 36–169); Q3 per-file map override: docs/platform/proposals/step-09-step-10-replan-handoff-prompt.md → docs/platform/system-architecture/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  },
  "after": {
    "claimId": "claim_eadf79b0b7a6fd73cf80175beeff02f2",
    "sourceUnitDigest": "6348d46b8f28f477cd1e4adc0983ba6d98256daf4175b2facc6f6bd1d70d374e",
    "targetOwner": "docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md",
    "targetAnchor": "unheaded-block-6",
    "targetUnitDigest": "6348d46b8f28f477cd1e4adc0983ba6d98256daf4175b2facc6f6bd1d70d374e",
    "targetAncestry": [
      "Step 09 / Step 10 Replan Handoff Prompt"
    ],
    "claimKind": "architecture",
    "disposition": "archive-with-reason",
    "reviewStatus": "pending",
    "authoredBy": "codex-session:unit-run-1792036612167-eb65d2cd@2026-10-15",
    "rationale": "Unit-exact: unique long digest match, equal ancestry, sufficient document exact share. archive-with-reason: Archive the consumed prompt, with provenance value for the surviving adoption proposals. No delete-as-obsolete recommendation. Agent Coordination owns this coordination/group-thinking engine history, alongside its existing retired-engine and brainstorm history; Whole-system architecture does not own this mechanism. Evidence: Source lines 3–10 says Handoff prompt, Canonical for nothing, use only to start a fresh design chat. Source code block preserves inputs for subsequent Step 09/10 discussions; no specific live required-root consumer. Complete source unheaded-block docs/architect/proposals/step-09-step-10-replan-handoff-prompt.md#unheaded-block-3 (lines 12–145) is carried at docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md#unheaded-block-6 (lines 36–169); Q3 per-file map override: docs/platform/proposals/step-09-step-10-replan-handoff-prompt.md → docs/platform/agent-coordination/history/proposals-redesigns/step-09-step-10-replan-handoff-prompt.md. Full unit text digest is equal; candidate header and original source metadata are separate. No source wording, caveat, deferred obligation or negative finding is discarded; stale implementation headers remain verbatim. No independent approval, current-truth claim, deletion, promotion or cutover. Review pending."
  }
}
```
