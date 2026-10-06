# Design-Panel Prompt - Runtime Recovery

Hãy điều phối một architecture design-panel độc lập cho thiết kế Runtime
Recovery của fgOS.

## Mục tiêu

Đánh giá và hoàn thiện thiết kế theo các tiêu chuẩn:

- simple theo nghĩa experienced complexity, không phải sơ sài;
- clean architecture, hexagonal architecture và SRP;
- không thêm abstraction nếu không đại diện cho essential complexity;
- có thể triển khai theo phase bằng code-panel;
- agent mới không có chat history vẫn hiểu và thực hiện đúng contract;
- không làm lại toàn bộ Agent Coordination.

Panel chỉ review, challenge, chỉnh shape và đưa ra điều kiện đạt chuẩn triển
khai. Không viết code và không tự chuyển sang implementation khi contract còn
mơ hồ.

## Tài liệu bắt buộc

Đọc theo thứ tự:

1. `docs/specs/reading-map.md`
2. `docs/architect/agent-coordination/architecture/runtime-recovery-design.md`
3. `docs/architect/agent-coordination/architecture/run-handle.md`
4. `docs/architect/agent-coordination/architecture/coordination-continuation-recovery.md`
5. `docs/architect/agent-coordination/architecture/executor-health-and-fallback.md`
6. `docs/architect/agent-coordination/contracts/coordination-session.md`
7. `docs/architect/agent-coordination/contracts/assignment-run-runresult.md`
8. `docs/architect/agent-coordination/contracts/flow-definition.md`
9. `plans/260911-2305-runtime-recovery/architecture-decision-lock.md`
10. `plans/260911-2305-runtime-recovery/detailed-design.md`
11. `plans/260911-2305-runtime-recovery/phase-designs/README.md`
12. Toan bo file trong `plans/260911-2305-runtime-recovery/phase-designs/`
13. `plans/260911-2305-runtime-recovery/simplicity-and-complexity-budget.md`
14. `plans/260911-2305-runtime-recovery/design-audit-final.md`
15. Cac review report lien quan trong `plans/reports/`

Nếu claim trong design mâu thuẫn với source hoặc contract hiện hành, phải chỉ
rõ file, symbol/section, behavior thực tế, claim tương ứng, mức ảnh hưởng và
đề xuất sửa tối thiểu. Prose không phải bằng chứng nếu chưa đối chiếu repo.

## Baseline decisions

Các quyết định sau là baseline; chỉ bác khi có bằng chứng mâu thuẫn trực tiếp:

1. `CoordinationSession` và event/replay store tiếp tục là session authority.
2. `Assignment` là durable work identity; mỗi attempt là một `Run` riêng.
3. `runId` là identity của attempt; timestamp, pane name và Herdr name không
   phải authority.
4. `generation` dùng để fencing control ownership; `incarnation` phân biệt
   worker resource sau gateway restart.
5. Herdr chỉ là transport/failure evidence, không phải source of truth.
6. S0-S4 là Node-first.
7. B04 chặn S2 cho mọi profile, kể cả read-only: coordinator death sau bind
   phải reattach được và crash trước locator không được spawn duplicate.
8. First profile refuse transfer từ terminal parent với
   `transfer-unavailable`, remedy `open fresh session`, ghi premature-close
   hazard vào X11. B01 chỉ block S5.
9. Writable takeover là optional profile, disabled by default.
10. `repeatMode` phải explicit; không suy ra từ `Assignment.mutation`.
11. Provider allowlist derive từ `DispatchPlan.providerModel`.
12. Network allow hoặc undeclared sink phải park; filtered provider-only chỉ
    eligible khi attestation đầy đủ.
13. Driver replacement cần trusted operator authorization, human-turn
    provenance, single-use `invocationKey`; replay không đọc mutable config.
14. Lock recovery không dựa vào TTL/heartbeat một mình. Release marker là
    evidence, không phải proof holder đã chết. Live PID vẫn HELD trong Node/R1-R2.
15. Không tạo `RecoveryManager`, generic checkpoint framework, health store,
    effect ledger hoặc implicit workspace authority.

## Phạm vi review theo phase

### S0/P00

Kiểm tra baseline có phân biệt current behavior và desired policy; BL1,
blocked/paused-limit, Herdr resend-until-ack, close-after-steps, lock reclaim
và result fencing phải có fixture; không được đổi production behavior ngầm.

### S1/P01

Review identity tuple, retry idempotency, predecessor/destination/payload
digest, Assignment version, concrete serialization primitive, event/projection
ordering, crash trước/sau append, stale result fencing, generation lock,
release-on-finally, SIGKILL/SIGSTOP và successor generation.

Phải xác nhận tái sử dụng `withEventsLock`/`appendEventLocked`, không tạo lock
thứ hai.

### S2/P02

Review launch intent, `runId` lookup, `agentSession`, worker incarnation,
locator persistence, retry collision, gateway restart, same Run khác
incarnation, crash create-to-locator, closed resource/no resurrection, F-b và
F-f.

Phải tách rõ reattach/observe/park với replacement launch. Nếu hiện tại chỉ có
`agentGet(name)` và chưa có `absent-proven`, không được local workaround; phải
đánh dấu replacement launch là gateway dependency và xác nhận safe park behavior.

### S3/P03

Review fallback provenance, compiler compatibility, explicit `repeatMode`,
provider derivation, endpoint filtering, telemetry, duplicable sink,
outcome-affecting sink, dedup identity và unknown-effect parking. Không đề xuất
effect ledger tổng quát nếu declaration + attestation đủ cho first profile.

### S4/P04-P05

Review pure evaluator boundary, legal-next, authorization, visibility,
completion, schema-1 parity, planner schema, snapshot hash, expected
generation, expiry, atomic plan consume, stale-plan refusal, concurrent consume,
single selected action, close-after-steps và typed `needs-input`.

### P06 writable

Review workspace identity, grant issuer, writers, quiescence, generation, merge
base, inherited lineage, cumulative delta, collision, unknown writer, grant
single-use và X05. Không để profile này ảnh hưởng read-only path. Không giả lập
owner bằng filesystem lock hoặc Herdr pane.

### S5/P07

Review CP section 6, terminal refusal, post-terminal event classes, replay Rule
#5, prepared/gated-child/committed ordering, fresh authority, grant,
invocationKey, human-turn provenance, re-authorization và backlog
`tsk-5qj`, `tsk-40j`, `tsk-296`, `tsk-1zu`.

### P08

Review capability matrix, enabled/disabled/blocked distinction, setup/doctor,
migration, schema-1 replay, docs rendering, full test suite và residual risk.

## Simplicity audit bắt buộc

Trả lời từng câu:

1. Có bao nhiêu application use case mới?
2. Component nào chỉ wrapper cho pure function?
3. Port nào không nằm ở external authority boundary?
4. Có authority mới ngoài CoordinationSession/Run write door không?
5. Có event nào ghi observation thay vì state transition không?
6. Abstraction nào xóa được mà correctness không giảm?
7. Phase nào hiểu quá nhiều rule của phase khác?
8. Có dùng name/timestamp/process identity làm authority không?
9. Có hidden retry hoặc hidden close không?
10. Agent mới có trace được read snapshot tới write door không cần chat history?

Mỗi câu phải dẫn tới giữ nguyên, đơn giản hóa, chuyển boundary hoặc bổ sung
contract.

## Output bắt buộc

Panel phải tạo:

1. Context/evidence report đối chiếu docs với source và tests.
2. Ít nhất ba alternatives, gồm baseline conservative, gateway-change và
   long-horizon writable/continuation; phải có designated loser.
3. Contract table cho từng contract:

   | Contract | Owner | Inputs | Outputs | Unknown | Mutation | Replay |
   |---|---|---|---|---|---|---|

4. Phase readiness matrix dùng đúng các nhãn `READY FOR IMPLEMENTATION`,
   `READY WITH EXTERNAL DEPENDENCY`, `DESIGN BLOCKED`, `DISABLED PROFILE`,
   `NOT APPLICABLE`.
5. Simplicity audit gồm component/port/event/identity count và deletion tests.
6. Red-team report cho coordinator crash, locator race, gateway restart,
   incarnation mismatch, retry collision, duplicate spawn, stale result,
   SIGKILL/SIGSTOP, undeclared sink, replay double-use, terminal transfer,
   writable inherited edits, stale plan và accidental close.
7. Final recommendation trả lời phase nào mở code-panel được, phase nào chờ
   dependency, product decision nào cần người dùng và điều kiện chuyển phase.

## Quy tắc kết luận

- Không nói chung chung “kiến trúc hợp lý”.
- Không gọi ready nếu owner, port, crash path hoặc proof còn mơ hồ.
- Không biến external dependency thành local abstraction.
- Không mở code-panel cho phase chưa đạt readiness riêng.
- Nếu không cần product decision, ghi rõ `zero decision request`.
- Nếu cần, gom decision thành một batch ngắn có context, recommendation và
  consequence của từng option.

Kết quả cuối cùng phải là design package mà một agent mới có thể đọc và triển
khai đúng mà không cần lịch sử hội thoại.

