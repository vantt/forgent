# Step 07 Design Discussion Handoff Prompt

Document type: Playbook
Design status: N/A
Implementation: Active
Last reviewed: 2026-08-31
Canonical for: new-chat context handoff for the Step 07 design discussion only

## Runtime Boundary

This prompt continues an architecture discussion in a fresh chat. It is not a
runtime Skill, TaskSpec, protocol, implementation plan, or accepted design.
Canonical authority remains in vocabulary, architecture, contracts, and ADRs.

## New-Chat Prompt

```text
Chúng ta cần tiếp tục thảo luận thiết kế Step 07 của agent coordination trong
repository hiện tại. Đây là architecture discussion, chưa phải yêu cầu
implementation.

Repository:
/home/vantt/projects/forgentX

Mục tiêu của phiên mới:
- phục hồi đầy đủ context Step 07 từ tài liệu và code hiện tại;
- kiểm tra lại các giả định thay vì đồng ý theo phản xạ;
- làm rõ CoordinationSession, AdhocTask, planning materialization, Work
  boundary, isolation và Git integration;
- tìm thiết kế nhỏ nhất nhưng đủ đúng trước khi chốt implementation plan;
- giữ Step 08 standalone protocols là consumer tương lai, không để Step 08 kéo
  Step 07 thành một framework quá lớn.

KHÔNG làm trong phản hồi đầu:
- không sửa code;
- không tạo Work item;
- không viết implementation prompt;
- không tuyên bố Step 07 đã chốt;
- không mặc định mọi đề xuất trong Step 07 là accepted architecture;
- không hỏi lại "có nên bắt đầu implement không".

ĐỌC TRƯỚC

Đọc theo thứ tự và dùng đúng document authority:

1. docs/architect/agent-coordination/README.md
2. docs/architect/agent-coordination/documentation-governance.md
3. docs/architect/agent-coordination/vocabulary/README.md
4. docs/architect/agent-coordination/vocabulary/canonical-concepts.md
5. docs/architect/agent-coordination/vocabulary/concept-relationships.md
6. docs/architect/agent-coordination/architecture/system-context.md
7. docs/architect/agent-coordination/architecture/protocol-model.md
8. docs/architect/agent-coordination/architecture/runtime-model.md
9. docs/architect/agent-coordination/architecture/work-integration.md
10. docs/architect/agent-coordination/contracts/workflow-stage-operation.md
11. docs/architect/agent-coordination/contracts/assignment-run-runresult.md
12. docs/architect/agent-coordination/decisions/README.md
13. docs/architect/agent-coordination/proposals/step-07-coordination-session-adhoc-task.md
14. docs/architect/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
15. docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md

Chỉ đọc roadmap/history khi cần kiểm chứng một claim cụ thể. Không lấy roadmap,
verification trace hoặc playbook làm canonical runtime design.

KIỂM CHỨNG CODE TẬP TRUNG

Không cần scan toàn repository một cách mù quáng. Kiểm tra các đường chính:

- domains/coding/workflows/feature.yaml
- domains/coding/task-specs/
- domains/coding/skills/fgos-coding-planning/
- domains/coding/skills/fgos-coding-driving/
- domains/coding/skills/fgos-coding-implement/
- src/state/workflow-stage-graphs.mjs
- src/intake/plan.mjs
- src/runner/dispatch/operation-choice.mjs
- src/runner/dispatch/assignment.mjs
- src/runner/dispatch/assignment-runner.mjs
- src/runner/dispatch/mission-lite.mjs
- src/runner/loop.mjs
- src/verbs/merge/approve.mjs
- src/verbs/merge/sync-root.mjs
- focused tests tương ứng trong test/runner/, test/state/, test/intake/ và
  test/verbs/merge/.

Nếu line/path đã drift, dùng rg để tìm symbol tương ứng. Phân biệt rõ hành vi
quan sát được với suy luận từ docs.

KIẾN TRÚC ĐÃ ACCEPTED

Không mở lại các điểm này nếu không tìm thấy bằng chứng mâu thuẫn nghiêm trọng:

1. Work là authority duy nhất cho delivery lifecycle: status, stage,
   claim/return, acceptance, approval, durable branch và merge.
2. Mission chỉ là optional lightweight objective envelope; không thay Work.
3. Workflow/Stage/Stage Protocol/Stage Operation/TaskSpec/Skill/Role/policy
   hints là mô hình hard-and-soft coordination có giá trị và cần được giữ.
4. stage.skill và stage.taskSpec là primary-operation compatibility path.
5. Stage Operation là semantic action; Assignment là semantic request; Run là
   một runtime attempt; RunResult là normalized outcome + evidence.
6. Job không dùng trong V1; chỉ reserve cho future queue/scheduler.
7. Discovery là machine-alone: không hỏi người trực tiếp; có thể consult
   researcher/helper; nếu vẫn không rõ thì route sang exploring.
8. Herdr là visibility, không phải truth hoặc evidence.
9. Dispatch phải đi qua governance; runtime prose không được gọi executor trực
   tiếp để bypass control plane.

GÓC NHÌN SẢN PHẨM CẦN GIỮ

1. Agent coordination phải là cơ chế độc lập, không đồng nhất với Work.
2. Work item là phương tiện để con người quản lý delivery lifecycle,
   requirements, decisions, artifacts và history trên dashboard.
3. Work có thể reference coordination activity nhưng không nên chứa chi tiết
   runtime orchestration của agents.
4. Standalone research, brainstorm, debate và consult phải chạy được không cần
   Work; đây là consumer chính của Step 08.
5. Một Work lớn có thể có internal AdhocTasks; không nên tạo n Work items chỉ vì
   agent chia nhỏ reasoning/execution.
6. Một số task con thật sự cần child Work vì có lifecycle, acceptance, durable
   branch hoặc merge riêng.
7. Một Work có thể vừa có child Work độc lập vừa có nhiều AdhocTasks nội bộ.
8. Research/discovery cần được phép tạo bounded AdhocTask graph chạy tuần tự hoặc
   song song để tăng tốc, nhưng phải có dependency, budget và evidence.
9. Coding-domain agents cần chủ động consult/review/challenge các thành viên
   khác theo communication topology, không bị buộc làm việc một mình.

HIỆN TRẠNG ĐÃ QUAN SÁT TRƯỚC ĐÂY, PHẢI KIỂM CHỨNG LẠI

Đừng coi danh sách này là sự thật nếu code hiện tại đã đổi:

1. Planning resolvePlan() materialize mọi decompose child qua addWork(), nên dễ
   over-create child Work cho internal decomposition.
2. Workflow stage operations, normalization, operationsForStage(), setup/doctor
   validation, Assignment/Run/RunResult và driver operation choice đã có baseline.
3. scoped-subtask có expectedFiles/evidence checks nhưng chưa được cấp một live
   task graph và isolation decision đầy đủ từ normal driver path.
4. mission-lite prototype đã tồn tại, dùng workId:null và read-only Assignments,
   nhưng còn vay coding Work stages/operations và chưa có CoordinationSession /
   AdhocTask graph tổng quát.
5. Nested Work branch integration từng không nhất quán: một số path resolve
   topmost root, sync-root dùng immediate parent.
6. Non-overlapping declared files không đủ chứng minh parallel mutation an toàn
   vì Git index, generated files, lockfiles, formatters và build outputs có thể
   va chạm.

HƯỚNG ĐỀ XUẤT HIỆN TẠI, CHƯA ACCEPTED

Đánh giá chứ không mặc định chấp nhận:

```text
Work-attached
  Work
    -> optional CoordinationSession
      -> AdhocTask graph
        -> Assignment -> Run -> RunResult/Evidence

Standalone
  optional Mission
    -> CoordinationSession
      -> AdhocTask graph
        -> Assignment -> Run -> RunResult/Evidence
      -> Synthesis
```

Candidate planning model:

```text
Không split -> pass-through
Có split    -> TaskCandidate dependency graph

Mỗi candidate quyết định độc lập:
lifecycle: inherited | independent
isolation: shared | isolated

inherited   -> AdhocTask
independent -> child Work qua normal intake
mixed graph -> hybrid tự nhiên, không cần top-level hybrid mode
```

AdhocTask không phải Assignment. Một AdhocTask có thể cần nhiều Assignments;
một Assignment có thể có nhiều Runs.

VẤN ĐỀ STEP 07 PHẢI GIẢI QUYẾT

1. CoordinationSession có thực sự cần là một persisted first-class entity hay
   chỉ là invocation/event envelope?
2. AdhocTask tối thiểu cần fields/state nào để không trở thành một Work lifecycle
   thứ hai?
3. TaskCandidate có cần persisted không, hay chỉ là validated planning output?
4. Ai đề xuất và ai deterministic-validate lifecycle/isolation?
5. Tiêu chí nào bắt buộc child Work, tiêu chí nào ưu tiên AdhocTask?
6. Có cần promotion AdhocTask -> child Work không; nếu có, provenance/commits /
   evidence được chuyển thế nào mà không tạo hai owner?
7. Lifecycle và isolation nên tách như thế nào cho read-only, shared mutation,
   ephemeral worktree và durable child Work branch?
8. Immediate-parent integration có phải invariant đúng cho mọi nested Work, hay
   chỉ cho một số topology?
9. Coordination Protocol nên reuse Workflow Stage trực tiếp, extract common
   graph primitive, hay có neutral Phase?
10. AgentMessage cần first-class persisted record ngay Step 07 hay Assignment /
    result refs đã đủ cho first slice?
11. Dynamic fan-out bị giới hạn bởi depth/task/token/time/concurrency và duplicate
    intent ra sao?
12. Task satisfaction roll up RunResults thế nào để không false-success?
13. Session outcome quay lại Work driver thế nào mà không tự move Work lifecycle?
14. Storage canonical nằm đâu và tránh duplicate Assignment/Run stores thế nào?
15. Slice nhỏ nhất nào chứng minh mô hình trước khi thay đổi planning materializer?

YÊU CẦU VỀ TƯ DUY

- Không trả lời "đúng", "ok", hoặc thêm concept mới chỉ vì người dùng vừa đưa
  thêm một góc nhìn.
- Với mỗi đề xuất, chỉ ra evidence, benefit, cost, failure mode và alternative
  đơn giản hơn.
- Ưu tiên giảm số entity/state machine. Một concept mới phải có authority hoặc
  invariant riêng mà concept hiện có không gánh đúng được.
- Không nhầm isolation với lifecycle.
- Không dùng branch làm bằng chứng rằng một lifecycle mới tồn tại.
- Không dùng task size làm tiêu chí duy nhất để tạo Work.
- Không tối ưu Step 07 chỉ cho brainstorm/debate; cũng không generalize trước khi
  có hai consumer thật.
- Bảo vệ backward compatibility của stage.skill/taskSpec và Work lifecycle.
- Nêu rõ chỗ nào docs và implementation đang drift.

PHẢN HỒI ĐẦU TIÊN CỦA CHAT MỚI

Sau khi đọc và kiểm chứng, trả lời bằng tiếng Việt theo cấu trúc:

1. Mô hình hiện tại thực sự đang hoạt động như thế nào.
2. Những điểm trong context trên được code xác nhận, bị bác bỏ hoặc đã drift.
3. Phát biểu lại vấn đề Step 07 bằng một đoạn ngắn, không dùng solution language.
4. Các invariant Step 07 bắt buộc phải bảo vệ.
5. Đánh giá mô hình CoordinationSession/AdhocTask/TaskCandidate hiện tại:
   - phần nên giữ;
   - phần cần đơn giản hóa;
   - phần chưa đủ bằng chứng.
6. Hai hoặc ba phương án thiết kế thực sự khác nhau, kèm tradeoff.
7. Khuyến nghị có chính kiến và lý do.
8. Danh sách quyết định cần thảo luận/chốt theo thứ tự dependency.

Trong phản hồi đầu, không viết implementation plan chi tiết và không sửa file.
Chờ thảo luận làm rõ. Khi một quyết định thực sự được người dùng chốt, mới cập
nhật proposal/canonical docs theo documentation-governance.md.
```

## Lifecycle

This handoff prompt may be updated while Step 07 remains under discussion. Once
Step 07 is accepted, replace it with a shorter implementation handoff that
references the accepted ADRs/contracts, then archive this discussion prompt.
