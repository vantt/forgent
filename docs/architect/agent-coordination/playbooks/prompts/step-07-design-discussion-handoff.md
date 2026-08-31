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
- bắt đầu từ Agent Coordination Foundation Vision đã accepted;
- phục hồi đầy đủ context Step 07 từ tài liệu và code hiện tại;
- kiểm tra lại các giả định thay vì đồng ý theo phản xạ;
- chốt *problem boundary và thứ tự quyết định* của Step 07 trước khi bàn schema
  hay implementation;
- làm rõ CoordinationSession, AdhocTask, planning materialization, validated
  inline execution contract, Work boundary, isolation và Git integration;
- tìm runtime shape nhỏ nhất đủ phục vụ cả agent-led coordination và
  domain-assisted coding, trước khi chốt implementation plan;
- giữ Step 08 standalone protocols là consumer tương lai, không để Step 08 kéo
  Step 07 thành một framework quá lớn.
- không mặc định session phải có Workflow/Stage/TaskSpec/Protocol định nghĩa
  trước; đồng thời không cho prose tự do bypass execution contract/governance.

KHÔNG làm trong phản hồi đầu:
- không sửa code;
- không tạo Work item;
- không viết implementation prompt;
- không tuyên bố Step 07 đã chốt;
- không mặc định mọi đề xuất trong Step 07 là accepted architecture;
- không hỏi lại "có nên bắt đầu implement không".

ĐỌC TRƯỚC

Đọc theo thứ tự và dùng đúng document authority:

1. docs/architect/agent-coordination/vision.md
2. docs/architect/agent-coordination/README.md
3. docs/architect/agent-coordination/documentation-governance.md
4. docs/architect/agent-coordination/vocabulary/README.md
5. docs/architect/agent-coordination/vocabulary/canonical-concepts.md
6. docs/architect/agent-coordination/vocabulary/concept-relationships.md
7. docs/architect/agent-coordination/architecture/system-context.md
8. docs/architect/agent-coordination/architecture/protocol-model.md
9. docs/architect/agent-coordination/architecture/runtime-model.md
10. docs/architect/agent-coordination/architecture/work-integration.md
11. docs/architect/agent-coordination/contracts/workflow-stage-operation.md
12. docs/architect/agent-coordination/contracts/assignment-run-runresult.md
13. docs/architect/agent-coordination/decisions/README.md
14. docs/architect/agent-coordination/proposals/step-07-coordination-session-adhoc-task.md
15. docs/architect/agent-coordination/proposals/step-08-standalone-coordination-protocols.md
16. docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md

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
10. Agent Coordination là foundation domain-neutral; Work là optional
    integration profile, không phải identity của coordination.
11. Predeclared Workflow/Stage/TaskSpec/Coordination Protocol là optional.
    Declared graph/TaskSpec là hard constraints khi được chọn.
12. Không có predeclared graph không có nghĩa không có contract: mọi executable
    request phải hạ thành validated semantic execution contract với objective,
    constraints, outputs, mutation, evidence, capability, budget và provenance.
13. Agent/Skill sở hữu adaptive reasoning và đề xuất action; foundation sở hữu
    authority, budgets, dispatch, evidence và execution boundaries.
14. Planning có thể agent-led, declared, domain-assisted hoặc kết hợp. Domain /
    organization augmentation tạo khác biệt nhưng không fork runtime core.
15. Foundation phải được chứng minh bởi ít nhất hai consumer khác nhau:
    agent-led research/brainstorm không predeclared workflow và coding có domain
    harness/resource/isolation constraints.

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
10. Research/brainstorm/consult phải có thể được agent tự plan từ objective;
    reusable protocol là accelerator tùy chọn, không phải gateway bắt buộc.
11. Coding/company/domain-specific knowledge, doctrine, Skills, validators và
    planning harness phải augment foundation qua seam nhỏ đã được consumer thật
    chứng minh.

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
   Claim cũ về 4 mission-lite test failures đã drift: Step 06 hardening
   verification hiện ghi nhận các test này đã được sửa và pass.
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
      -> agent-led / optional protocol / optional domain harness planning
      -> optional AdhocTask graph
        -> Assignment -> Run -> RunResult/Evidence

Standalone
  optional Mission
    -> CoordinationSession
      -> agent-led / optional protocol planning
      -> optional AdhocTask graph
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

Vision đã accepted thêm các planning source composable:

```text
agent-led runtime planning
optional declared Workflow / Coordination Protocol
optional domain / organization harness enrichment and validation
  -> validated semantic execution contract
  -> Assignment -> governed dispatch -> Run -> RunResult/Evidence
```

TaskCandidate graph là optional intermediate representation. Một one-shot
consult có thể hạ thẳng thành một Assignment; graph có thể trivial, upfront,
dynamic hoặc declared.

AdhocTask không phải Assignment. Một AdhocTask có thể cần nhiều Assignments;
một Assignment có thể có nhiều Runs.

Ranh giới cần giữ khi đánh giá mọi phương án:

```text
objective / Mission / Work reference
  -> planning source (agent-led | declared | domain-assisted | composition)
  -> foundation validation of a semantic execution contract
  -> Assignment -> governed dispatch -> Run -> RunResult / Evidence

Không có graph/task/session được predeclare
  vẫn được phép hạ thẳng một bounded request thành Assignment.
```

Đây là direction đã accepted của Vision, **không phải claim rằng inline
execution contract hay CoordinationSession đã tồn tại trong code**. Step 07 phải
xác định phần tối thiểu cần bổ sung vào đường hiện tại vốn đang yêu cầu
stage/operation, mà không nhân đôi Assignment, Run, RunResult hoặc Work.

THỨ TỰ THẢO LUẬN BẮT BUỘC

Không nhảy ngay sang data model. Đi theo dependency sau:

1. **Đường agent-led tối thiểu.** Xác nhận đường một-shot không có declared
   Workflow: ai tạo proposal, đâu là semantic contract, ai validate, và chỗ nào
   `buildAssignment()`/operation selection hiện buộc phải có stage/operation.
2. **Execution-contract boundary.** Quyết định Assignment có nên là đích chung
   của hai provenance classes (declared operation và validated inline contract)
   hay cần thêm entity trước Assignment. Không thiết kế schema đầy đủ trước khi
   chứng minh authority/invariant riêng.
3. **Session necessity.** Tách one-shot invocation khỏi multi-step/recovery/
   synthesis flow. Chỉ persist CoordinationSession nếu nó có authority,
   provenance hoặc recovery invariant mà caller/Assignment không mang được.
4. **Task graph necessity.** Tách one-shot khỏi dynamic/dependency-bearing
   work. Chỉ tạo/persist AdhocTask hoặc TaskCandidate khi có ownership,
   aggregation, dependency, budget, recovery hoặc promotion need rõ ràng.
5. **Work and isolation boundary.** Sau khi biết session/task có tồn tại, quyết
   định independent lifecycle -> child Work; session-local activity -> AdhocTask
   (nếu cần). Xét isolation độc lập với lifecycle.
6. **Extension seams.** Chỉ sau các boundary trên mới xác định hook tối thiểu
   cho coding harness (file overlap/isolation) và research (generic evidence/
   duplicate intent), dựa trên hai consumer thật; không dựng plugin SDK.

Step 08 chỉ được giả định là consumer của nền này. Đừng quyết định API/protocol
registry của Step 08 trong khi Step 07 chưa xác định runtime boundary.

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
   graph primitive, hay có neutral Phase khi declared protocol được chọn?
10. AgentMessage cần first-class persisted record ngay Step 07 hay Assignment /
    result refs đã đủ cho first slice?
11. Dynamic fan-out bị giới hạn bởi depth/task/token/time/concurrency và duplicate
    intent ra sao?
12. Task satisfaction roll up RunResults thế nào để không false-success?
13. Session outcome quay lại Work driver thế nào mà không tự move Work lifecycle?
14. Storage canonical nằm đâu và tránh duplicate Assignment/Run stores thế nào?
15. Slice nhỏ nhất nào chứng minh mô hình trước khi thay đổi planning materializer?
16. Inline execution contract tối thiểu cho agent-led planning là gì và làm sao
    nó không trở thành dispatch/governance bypass?
17. Extension seams nào thật sự common giữa agent-led research và
    domain-assisted coding, thay vì dựng plugin framework giả định?
18. Với one-shot agent-led request, Session/Task graph có cần được tạo ra không,
    hay caller provenance + inline contract + Assignment đã đủ?
19. Nếu cần Session, nó là execution owner, recovery envelope, synthesis
    container hay chỉ observation record? Mỗi nghĩa kéo theo storage/state khác
    nhau và không được gộp mơ hồ.

YÊU CẦU VỀ TƯ DUY

- Không trả lời "đúng", "ok", hoặc thêm concept mới chỉ vì người dùng vừa đưa
  thêm một góc nhìn.
- Với mỗi đề xuất, chỉ ra evidence, benefit, cost, failure mode và alternative
  đơn giản hơn.
- Ưu tiên giảm số entity/state machine. Một concept mới phải có authority hoặc
  invariant riêng mà concept hiện có không gánh đúng được.
- Không biến optional workflow thành unstructured prose: runtime contract,
  authority, budgets, privacy, mutation, dispatch và evidence luôn là hard.
- Không biến Workflow/Stage/TaskSpec thành điều kiện để coordination được chạy.
- Không nhét coding-specific planning/file/Git rules vào foundation core.
- Không nhầm isolation với lifecycle.
- Không dùng branch làm bằng chứng rằng một lifecycle mới tồn tại.
- Không dùng task size làm tiêu chí duy nhất để tạo Work.
- Không tối ưu Step 07 chỉ cho brainstorm/debate; cũng không generalize trước khi
  có hai consumer thật.
- Bảo vệ backward compatibility của stage.skill/taskSpec và Work lifecycle.
- Nêu rõ chỗ nào docs và implementation đang drift.

PHẢN HỒI ĐẦU TIÊN CỦA CHAT MỚI

Sau khi đọc và kiểm chứng, trả lời bằng tiếng Việt theo cấu trúc:

1. Mô hình hiện tại thực sự hoạt động thế nào, đặc biệt đường từ planning hoặc
   mission-lite đến `buildAssignment`, operation selection, dispatch và result.
2. Những điểm trong context trên được code xác nhận, bị bác bỏ hoặc đã drift;
   tách rõ observation khỏi inference.
3. Phát biểu lại vấn đề Step 07 trong một đoạn, không dùng solution language.
4. Các invariant Step 07 bắt buộc phải bảo vệ, phân loại thành foundation,
   Work-only và domain-specific.
5. Vẽ bằng prose hoặc sơ đồ ngắn đường agent-led tối thiểu:
   `Objective -> proposal -> validated contract -> Assignment -> DispatchPlan
   -> Run -> RunResult/Evidence`; nêu chính xác contract/provenance hiện chưa
   có ở đâu và stage/operation đang bị hard-code ở đâu.
6. Đánh giá riêng từng candidate entity:
   - Assignment provenance extension;
   - CoordinationSession;
   - TaskCandidate;
   - AdhocTask.
   Với mỗi entity, nêu authority/invariant riêng, trường hợp không cần tạo và
   nguy cơ nó trùng Work/Assignment/Run.
7. Đưa hai hoặc ba phương án kiến trúc thực sự khác nhau. Ít nhất một phương án
   phải cho phép one-shot không Session/Task, và một phương án phải giải thích
   recovery/synthesis cho multi-step. Nêu benefit, cost, failure mode và cách
   kiểm chứng bằng hai consumer.
8. Khuyến nghị có chính kiến: smallest viable Step 07 slice, điều gì phải chốt
   trước, điều gì phải hoãn, và lý do.
9. Danh sách quyết định cần thảo luận/chốt theo đúng thứ tự dependency ở trên.

Trong phản hồi đầu, không viết implementation plan chi tiết và không sửa file.
Chờ thảo luận làm rõ. Khi một quyết định thực sự được người dùng chốt, mới cập
nhật proposal/canonical docs theo documentation-governance.md.

GHI NHẬN KHI CÓ NHIỀU AGENT THẢO LUẬN

Mỗi agent trước hết chỉ trả một review note có cấu trúc:

```text
claim / recommendation
evidence (docs và code, tách observation khỏi inference)
benefit
cost và failure mode
alternative đơn giản hơn
open question hoặc decision bị ảnh hưởng
```

Chỉ một designated synthesizer được ghi tài liệu sau khi đối chiếu các review
notes. Không để nhiều agent đồng thời sửa cùng proposal; không để một review
note tự biến thành accepted architecture.

Chọn nơi ghi theo chủ đề, không theo agent:

- Step 07 runtime boundary, inline execution contract, Assignment provenance,
  CoordinationSession, AdhocTask, TaskCandidate, planning materialization,
  lifecycle/isolation, Work/Git integration: append checkpoint vào
  `docs/architect/agent-coordination/proposals/step-07-coordination-session-adhoc-task.md`,
  section `Discussion Checkpoint`.
- Standalone research, consult, brainstorm, debate, declared optional protocol,
  standalone synthesis, Mission grouping: append checkpoint vào
  `docs/architect/agent-coordination/proposals/step-08-standalone-coordination-protocols.md`,
  section `Discussion Checkpoints`.
- Communication topology, semantic AgentMessage, role-to-role exchange: append
  checkpoint vào
  `docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md`.

Mỗi checkpoint phải nêu discussion status, scope, evidence, dissent còn lại,
và những gì vẫn open. Không sửa Vision, vocabulary, accepted architecture,
contract hoặc ADR cho đến khi người dùng chốt một decision; khi đó promotion
phải tuân theo documentation-governance.md.
```

## Lifecycle

This handoff prompt may be updated while Step 07 remains under discussion. Once
Step 07 is accepted, replace it with a shorter implementation handoff that
references the accepted ADRs/contracts, then archive this discussion prompt.

## Locked So Far

Do not re-litigate in a fresh chat: the MVP boundary was locked on 2026-08-31
and extracted to ADR-006 and ADR-007; see proposal §19 for the checkpoint,
deferred list, and dissent. A fresh discussion chat starts from the still-open
items in §19, not from the full question list above.
