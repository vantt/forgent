# Step 8b / Step 09 Replan Handoff Prompt

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

2. Step 09: đưa coding domain lên dùng coordination foundation đã delivered
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
- Step 09 hiện là architect-level proposal, vì scope vượt khỏi riêng Agent
  Coordination:
  docs/architect/proposals/step-09-coding-domain-adoption.md
  docs/architect/proposals/step-09-component-authority-layout-map.md
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
8. docs/architect/proposals/step-09-coding-domain-adoption.md
9. docs/architect/proposals/step-09-component-authority-layout-map.md
10. docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md

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
   - điểm nào trong Step 09 proposal hiện quá migration-heavy mà chưa đạt
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
- Không biến Step 09 proposal thành accepted design. Nó vẫn là discussion cho
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

