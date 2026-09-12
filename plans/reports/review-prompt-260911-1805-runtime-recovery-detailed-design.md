# Prompt: Independent Review Of Detailed Runtime Recovery Design

Copy everything below the divider as the prompt for an independent reviewer.

---

Bạn là reviewer kiến trúc độc lập cho repo `forgentX` (fgOS). Bạn không có lịch
sử chat; mọi thông tin cần thiết nằm trong các file được liệt kê dưới đây.
Làm việc trong `/home/vantt/projects/forgentX`, branch `main`, tại HEAD
`7e65101fe1dc527206a18f04c49dfc7e615c2afc` hoặc commit descendant chứa các
thay đổi tài liệu runtime recovery. Đọc `AGENTS.md` và
`docs/specs/reading-map.md` trước, rồi đọc đúng area spec và các contract liên
quan.

## Mục tiêu review

Review bản thiết kế chi tiết cho runtime recovery và work continuity. Thiết kế
phải giữ được long-horizon nhưng không biến thành một lần rewrite toàn bộ Agent
Coordination. Các tình huống trong cùng một bức tranh gồm:

- reconnect một Run đang sống;
- worker bị gián đoạn và worker khác takeover cùng Assignment trong cùng cell;
- thay actor/role khi cần;
- session không thể tiếp tục và cần continuation sang session mới;
- một session dài có nhiều cell và chuyển sang cell tiếp theo.

Yêu cầu thiết kế:

- đơn giản, clean, hexagonal, SRP;
- agent-facing surface nhỏ, runtime giữ invariant và tự suy ra identity;
- worker không bắt buộc tạo checkpoint trong task nhỏ;
- recovery chịu được gián đoạn ở bất kỳ thời điểm nào, kể cả partial/invalid
  artifact;
- explicit checkpoint chỉ là capability tùy chọn cho operation tự nhiên có mốc
  resume;
- Node là writer hiện tại, Rust là đích port; semantics production phải giữ;
- mọi default phải là tập con hợp lệ của contract dài hạn.

## Các điểm đã được chốt — không mở lại

1. Run là đơn vị admission; không thêm thành phần attempt-admission thứ tư.
   `runId` là launch identity. `run-retried`/tương đương standalone là
   supersession intent. RunHandle, planner và fallback không tự admit Run.
2. Lease/control fencing và incarnation là guarantee bắt buộc. Distributed
   lease và generic incarnation field có thể defer; default không được hứa
   TTL-only takeover nếu holder process còn sống.
3. Signal ladder hiện tại là classifier duy nhất; recovery matrix hiện tại là
   nền retry/park/halt; `fallbackExecutors` là candidate list reserved được kích
   hoạt qua compiler. Không tạo taxonomy thứ hai.
4. Không đổi semantics authorization/partialPolicy/quorum của engine ngoài các
   backlog fix đã nêu; planner không sửa lỗi kernel bằng cách tự diễn giải khác.
5. Health observation store, cooldown/scoring và generic effect ledger defer.
6. Runtime spawn nào sở hữu state runtime đó ghi; reader không hiểu contract
   version phải refuse rõ; không dual-writer khi port Node/Rust.
7. Run amend phải được implement/prove ở Node trước Rust writer migration.
8. Cell không mặc nhiên là core entity và không mặc nhiên đồng nhất với
   CoordinationSession. Track/domain consumer sở hữu cell acceptance và có thể
   liên kết một cell với một hoặc nhiều session; không được suy từ tên nếu đã có
   correlation tường minh.
9. Deliberate handoff qua session/protocol chỉ dùng điểm chuyển giao hợp lệ.
   Crash recovery trong cell không cần checkpoint do worker tạo. Partial work là
   recovery input, không phải completion evidence.

Nếu muốn phản biện một điểm đã chốt, chỉ nêu khi có bằng chứng mới từ file,
dòng code, test hoặc live behavior; không lặp lại lo ngại trừu tượng.

## Câu hỏi review bắt buộc

### A. Đúng phạm vi và ownership

1. Thiết kế có thực sự giải quyết worker takeover trong cùng cell, hay vô tình
   chỉ thiết kế continuation giữa session?
2. Quan hệ cell/track/session/actor/Assignment/Run có owner rõ chưa? Có chỗ nào
   đang ngầm biến cell thành entity core hoặc ngầm buộc một cell chỉ có một
   session không?
3. Có component mới nào thực chất không cần thiết, hoặc trách nhiệm nào chưa có
   owner? Kiểm tra đặc biệt admission, workspace ownership, effect
   reconciliation, acceptance và session continuation.

### B. Run admission, takeover và RunHandle

1. `assignment-run.v2` và admission door có ngăn hai caller cùng admit hai Run
   trong cửa sổ crash/race không?
2. `run-retried`/supersession có gắn với đúng `previousRunId`, `nextRunId`,
   retry identity và payload digest không? Late result có thể giành lại current
   result không?
3. Lock generation/token, PID/start time, TTL và delayed release có đủ để ngăn
   controller cũ tiếp tục send/terminate sau takeover không?
4. Crash sau admitted, launch, bind, send-before-ack và normalize-before-link
   được reconcile như thế nào? Có chỗ nào cần worker-authored checkpoint mới
   tiến được không?
5. `RunHandle` có phân biệt execution, attachment, liveness/progress,
   delivery, pause và settlement mà không tạo state machine thừa không?
6. Workspace ownership/quiescence có thật sự chứng minh worker cũ không còn
   quyền ghi, kể cả descendants/setsid, trước khi worker mới takeover không?

### C. Recovery material và checkpoint

1. `RecoveryMaterialV1` có đủ để worker mới hiểu hiện trạng nhưng không nhầm
   partial edit thành evidence đạt yêu cầu không?
2. Base revision, diff, untracked/deleted files, verification snapshot,
   external effects, writer quiescence, omissions và provenance có được biểu
   diễn đúng không?
3. Khi capture không đầy đủ hoặc worker chết trước khi ghi note, hệ thống có
   fallback baseline/reconcile/park rõ không?
4. Declared checkpoint có nằm ở operation adapter và có version/precondition
   riêng, hay đang rò vào generic runtime?

### D. Fallback, effect và budget

1. Fallback có thực sự consumer của ladder và recovery matrix, không nhân bản
   chúng không?
2. `timed-out-ceiling`, `timed-out-idle`, `died`, `paused-limit`, unknown
   delivery, launch failure, semantic rejection và config/confinement refusal có
   mapping nhất quán không?
3. Attempt count per Assignment, per executor, Session `maxRetries` và
   claim-scoped `resolveAction` có được phân biệt và chuyển đổi chính xác không?
4. Retry sau delivery có cần effect identity, input digest, dedup window và
   destination compatibility gì? `effectsObserved: false` có bị diễn giải sai
   thành “không có effect” không?
5. Candidate fallback có giữ capability, tier, provider, egress, persona,
   mutation và confinement constraints qua `compileDispatchPlan` không?

### E. Continuation giữa session/protocol

1. Snapshot builder có dùng evaluator hiện có cho legal bindings, quorum,
   visibility, disposition, aggregation và budget, hay planner đang viết lại
   graph semantics?
2. Typed action có đủ identity/payload để agent không phải tự dựng taskKey,
   childId, grant hay context refs không?
3. Action idempotency có canonical serialization, payload conflict và pending
   recovery rõ không? Hai caller có tạo đúng một child và debit một grant không?
4. Protocol continuation point có prerequisite, destination graph entry,
   input mapping, visibility, trigger và version/digest rõ không? Có cho phép
   nhảy tùy ý vào node giữa graph không?
5. Parent/child transaction `prepared → gated child → committed/aborted` có
   bảo đảm parent không tiếp tục admit phần việc đã chuyển, nhưng vẫn giữ late
   result/history không?
6. Child có vô tình kế thừa authorization, quorum credit, cancellation hoặc
   budget của parent không? Nếu không, fresh authority được cấp ở cửa nào?
7. Session agent-led không có `definitionRef`, protocol không hỗ trợ transfer,
   parent terminal hoặc source/destination drift được xử lý typed thế nào?

### F. Hexagonal, SRP và agent ergonomics

1. Domain có biết CLI command, path, herdr, PID hoặc filesystem layout không?
2. Planner có pure thật không? Adapter có bị giao quyền quyết định không?
3. Có port béo hoặc một port đang sở hữu repository + runtime + policy không?
4. Public `run`, `show`, `chain` và headless có đi qua đúng một mutation/read
   boundary không?
5. Một agent mới với hướng dẫn ngắn có thể gọi recovery mà không tự lắp identity,
   grant, budget hoặc child request không? Gọi lại sau timeout có an toàn không?
6. Refusal có actionable reason code và next action không, hay agent phải đọc
   message prose để đoán?

### G. Migration và khả năng chứng minh

1. Node writer amendment có nằm trước Rust port và có compatibility profile rõ
   cho legacy schema không?
2. Có dual writer, silent version reinterpretation, migration on-read hoặc
   fallback qua payload Node trái với `AGENTS.md` không?
3. Các slice S0-S7 có dependency hợp lý không? Slice read-only có thể làm độc
   lập không, còn mutation slice nào đang bị tuyên bố quá sớm không?
4. Mỗi proof F-a..g, C-a..g, E-a..f và X01..X11 có đúng một scenario verifiable
   không? Proof có đo agent intervention/manual repair, không chỉ duplicate spawn
   không?
5. Có test nào chứng minh non-continuation flow giữ nguyên behavior không?

## Files phải đọc

Đọc theo thứ tự:

1. `docs/specs/reading-map.md`
2. `docs/specs/runner.md`
3. `docs/architect/agent-coordination/architecture/README.md`
4. `docs/architect/agent-coordination/architecture/runtime-recovery-design.md`
5. `docs/architect/agent-coordination/architecture/run-handle.md`
6. `docs/architect/agent-coordination/architecture/coordination-continuation-recovery.md`
7. `docs/architect/agent-coordination/architecture/executor-health-and-fallback.md`
8. `docs/architect/agent-coordination/contracts/assignment-run-runresult.md`
9. `docs/architect/agent-coordination/contracts/coordination-session.md`
10. `docs/architect/agent-coordination/contracts/flow-definition.md`
11. `docs/architect/agent-coordination/architecture/runtime-model.md`
12. `docs/architect/agent-coordination/architecture/visibility-and-herdr.md`
13. `docs/architect/agent-coordination/architecture/evidence-and-results.md`
14. `docs/architect/agent-coordination/architecture/dispatch-control-plane.md`
15. `docs/specs/confinement-authority.md`
16. `docs/routing-handoff-contract.md`
17. `docs/architect/host-invocation-routing/node-to-rust-component-migration.md`
18. `docs/architect/host-invocation-routing/legacy-cli-transition.md`
19. `plans/reports/runtime-recovery-design-discussion-260911-1754.md`
20. `plans/reports/design-review-second-opinion-260911-1709-runtime-recovery.md`
21. `plans/reports/design-review-260911-1617-run-handle-continuation-health.md` sections 6-8

### Code semantic sources

- `src/runner/dispatch/liveness.mjs`: header, `evaluateLadder`, `matchUsageLimit`, `paneFateFor`.
- `src/runner/recovery.mjs`: `ERROR_CLASSES`, `RECOVERY`, `resolveAction`, `resolveStaleDoing`.
- `src/runner/dispatch/assignment-policy.mjs`: `fallbackExecutors`/`executorList`.
- `src/runner/dispatch/assignment-runner.mjs`: attempt/runId/runMeta, run directory and evidence ordering.
- `src/runner/coordination/store.mjs` and `replay.mjs`: task claims, `recordRunRetry`, `linkResult`, replay fencing.
- `src/runner/coordination/session-engine.mjs`: open, authorization, dispatch, retry, actor replacement, quorum and close.
- `src/verbs/coordination/run.mjs`, `show.mjs`, `chain.mjs`, `src/runner/coordination/headless-adapter.mjs`.
- `src/runner/dispatch/visibility-session.mjs`, lock helpers, herdr adapter and confinement entry point.

Read relevant tests under `test/runner/`, `test/verbs/coordination-*` and
`test/cli/coordination.test.mjs`. Read dogfood evidence under
`docs/architect/agent-coordination/verification/rust-host-r1-kernel/p00.md` …
`p16.md`, `verification/architecture-advisory-panel/P02.1.md`, and the
continuation/plan-loop cell traces where useful.

## Required output

Write only this report:

`plans/reports/design-review-<yymmdd-hhmm>-runtime-recovery-detailed-design.md`

The report must contain:

1. Verdict in one line: `Ổn`, `Chưa ổn`, or `Blocked`, with the largest reason.
2. Finding table:
   `id | severity (blocking/warning/info) | doc/component | file:line | evidence | recommendation`.
3. Direct answers to A-G above.
4. Affected component table: changed, read-only dependency, or unchanged.
5. Decision audit: each of the nine locked directions above marked compliant,
   partially compliant or violating, with evidence.
6. Proof audit for every F-a..g, C-a..g, E-a..f and X01..X11 row. Flag a proof
   that exercises the wrong outcome or cannot falsify the bug.
7. Explicit feasibility assessment: what can ship as S0-S4, what blocks S5,
   and what must wait for Rust migration.
8. Agent-harness assessment: whether a fresh agent can operate it without
   hidden memory; list every place runtime must derive/validate instead.
9. Open questions at the end, limited to product decisions that repository
   evidence cannot resolve.
10. End exactly with:

`Status: DONE | DONE_WITH_CONCERNS | BLOCKED`

followed by one sentence explaining the status.

Do not modify source code, tests or design documents. Do not invent a new
component merely because a contract is incomplete. Cite concrete evidence and
separate “not implemented yet” from “architecturally impossible”.
