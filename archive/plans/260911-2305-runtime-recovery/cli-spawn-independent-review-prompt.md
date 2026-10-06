# Independent Review Prompt - CLI Spawn Runtime Recovery Delta

Bạn là reviewer kiến trúc độc lập cho fgOS. Làm việc trong repo
`/home/vantt/projects/forgentX`. Không dựa vào lịch sử chat hoặc verdict của
reviewer trước. Mọi claim phải kiểm chứng bằng contract, source hoặc test hiện
có trong repo.

## Nhiệm vụ

Review delta thiết kế recovery cho adapter production mặc định `cli-spawn`.
Delta này được thêm sau khi phát hiện bản thiết kế Runtime Recovery trước đó
tập trung vào Herdr và bỏ sót đường production mặc định.

Tiêu chuẩn bắt buộc:

- simple theo nghĩa experienced complexity, không phải sơ sài;
- clean architecture, hexagonal architecture và SRP;
- authority và mutation ownership tường minh;
- crash semantics không dựa vào suy đoán;
- không duplicate spawn, hidden retry hoặc hidden settlement;
- triển khai được bởi một code-panel không có chat history;
- legacy ad-hoc `cli-spawn` không bị đổi hành vi ngoài ý muốn.

Chỉ review. Không sửa design, source hoặc test. Không mở code-panel và không
chạy service/gateway.

## Đọc bắt buộc

Đọc theo thứ tự:

1. `AGENTS.md`
2. `docs/specs/reading-map.md`
3. `docs/specs/runner.md`, đặc biệt CTR009/RUL41, RUL66, RUL67 và Confinement Authority
4. `docs/architect/agent-coordination/architecture/runtime-recovery-design.md`
5. `docs/architect/agent-coordination/architecture/run-handle.md`
6. `docs/architect/agent-coordination/contracts/assignment-run-runresult.md`
7. `plans/260911-2305-runtime-recovery/cli-spawn-impact-correction.md`
8. `plans/260911-2305-runtime-recovery/phase-designs/cli-spawn-reconciliation.md`
9. `plans/260911-2305-runtime-recovery/architecture-decision-lock.md`
10. `plans/260911-2305-runtime-recovery/implementation-contract-catalog.md`
11. `plans/260911-2305-runtime-recovery/detailed-design.md`
12. `plans/260911-2305-runtime-recovery/requirements-traceability.md`
13. `plans/260911-2305-runtime-recovery/plan.md`
14. `plans/260911-2305-runtime-recovery/code-panel-cells.json`
15. `plans/260911-2305-runtime-recovery/code-panel-requests.md`
16. `plans/260911-2305-runtime-recovery/design-audit-final.md`

Đối chiếu trực tiếp ít nhất các source/test sau:

- `src/runner/dispatch/transport.mjs`: `cliSpawnAdapter`, `killChildTree`,
  `DEFAULT_ADAPTER`, timeout, idle timeout, maxBuffer, `onChunk`, `close`;
- `src/runner/dispatch/cli.mjs`: `spawnWorker`, `executeExecutorCli`, các điểm
  gọi `executeThroughConfinement`;
- `src/runner/dispatch/assignment-runner.mjs`: Run creation, launch và result;
- `src/runner/dispatch/confinement/authority.mjs`:
  `executeThroughConfinement`, prepared invocation và attestation ordering;
- `src/runner/dispatch/visibility-session.mjs`;
- tests hiện có cho dispatch, confinement, production call sites, timeout,
  maxBuffer, live output và process group.

Nếu GitNexus khả dụng, dùng nó để tìm execution flow và blast radius, nhưng
không coi graph result là bằng chứng duy nhất khi symbol collision làm kết quả
nhiễu.

## Baseline đã chốt

Không mở lại các quyết định sau nếu không có bằng chứng mới, cụ thể:

1. `cli-spawn` là adapter production mặc định và phải có recovery profile riêng
   trước khi core Runtime Recovery được gọi là hoàn tất.
2. P02 được tách thành `P02L` cho local `cli-spawn` và `P02H` cho Herdr.
3. Chỉ Assignment-owned Runs đi qua recovery supervisor; legacy/ad-hoc
   `cli-spawn` giữ đường hiện tại.
4. Fresh `not-requested -> pending` được submit đúng một lần. Resumed pending
   thiếu bằng chứng phải `park`, không spawn lại.
5. Supervisor là adapter mechanics/evidence producer, không phải daemon,
   registry, policy engine, command owner hoặc Run settlement authority.
6. Confinement Authority atomically persist immutable launch envelope trước
   adapter submission. Supervisor chỉ chạy đúng prepared invocation trong
   envelope, không tự resolve command/config/model/policy.
7. Supervisor không nhận clear control token. Nó chỉ ghi binding, append-only
   logs và immutable adapter receipt.
8. Chỉ controller giữ control epoch/token hiện tại được collect receipt thành
   authoritative command outcome và settle Run.
9. Worker là process-group leader của một group khác supervisor. Timeout,
   idle-timeout và maxBuffer signal worker PGID để supervisor còn sống ghi
   receipt.
10. PID không đủ làm incarnation; cần host/boot id và process start time.
11. Supervisor chết khi worker state không chứng minh được dẫn tới `unknown`
    và `park`, không suy ra absent/dead.
12. `http` chưa có production recovery profile; interrupted HTTP outcome parks.

Reviewer có thể bác bất kỳ baseline nào, nhưng phải nêu source/test/contract
cụ thể và một replacement contract ít phức tạp hơn nhưng vẫn giữ đủ safety và
recovery guarantees. Nhận xét chung kiểu “supervisor phức tạp” không đủ.

## Câu hỏi bắt buộc

### A. Có thật sự cần supervisor?

1. Detached worker hiện tại có thể sống sau coordinator death không?
2. Coordinator hiện giữ những state nào chỉ trong memory?
3. Có primitive hiện hữu nào thay supervisor mà vẫn giữ durable binding,
   output, timeout và final receipt sau coordinator death?
4. Nếu đề xuất bỏ supervisor, hãy chứng minh từng crash window và parity test.

### B. Hexagon và SRP

1. Policy có nằm ngoài adapter supervisor không?
2. Confinement Authority có còn là cửa duy nhất chuẩn bị invocation không?
3. Run controller có còn là owner duy nhất của command outcome/settlement?
4. Supervisor có trách nhiệm nào nên bị xóa hoặc chuyển boundary?
5. Có port/component mới nào chỉ bọc một pure function hoặc không nằm ở
   external authority boundary?

### C. State và write ownership

Lập bảng cho từng artifact:

| Artifact | Writer duy nhất | Reader | Atomicity | Authority hay evidence | Recovery khi thiếu/hỏng |
|---|---|---|---|---|---|

Bắt buộc gồm:

- Run admission/control generation;
- controller-owned command pending/outcome;
- immutable confinement launch envelope;
- local resource binding/incarnation;
- append-only stdout/stderr logs;
- immutable supervisor adapter receipt;
- Run settlement.

Kiểm tra supervisor có đường nào vô tình settle hoặc ghi đè command state,
controller stale có collect được receipt, và receipt/envelope digest có chống
nhầm Run/command/incarnation hay không.

### D. Process topology và termination

Vẽ cây/process groups cho coordinator, supervisor, worker và descendants.
Trả lời:

1. Ai là session/process-group leader?
2. Timeout, idle-timeout, maxBuffer, operator cancel gửi signal cho PID/PGID nào?
3. Signal có thể giết evidence writer trước khi flush không?
4. Escaped descendant được phát hiện/diễn giải thế nào?
5. Supervisor exit bình thường, crash, SIGKILL và host reboot để lại outcome gì?
6. PID reuse, boot mismatch và start-time mismatch bị refuse ở cửa nào?
7. Có cần escalation SIGTERM -> SIGKILL không, và nếu có ai sở hữu timer đó?

### E. Confinement ordering

Kiểm tra source hiện tại vì attestation đang được dựng quanh adapter call.
Đánh giá contract mới có đủ để:

1. persist envelope hoàn chỉnh trước spawn;
2. không leak clear control token hoặc secret không cần thiết vào file;
3. supervisor verify envelope chưa bị partial/tampered;
4. chứng minh worker thực chạy đúng invocation đã prepare;
5. từ chối trước spawn khi envelope không hợp lệ;
6. không tạo authority thứ hai bên trong supervisor.

Nêu rõ cần digest, MAC/signature, exclusive directory ownership hay primitive
nào khác. Không thêm cryptography nếu filesystem ownership/atomic publication
đã đủ; nếu cho rằng đủ, phải giải thích threat boundary.

### F. Crash matrix

Audit tối thiểu các điểm:

1. trước pending commit;
2. sau pending, trước envelope publication;
3. sau envelope, trước supervisor spawn;
4. sau supervisor spawn, trước self-binding;
5. sau supervisor binding, trước worker spawn;
6. sau worker spawn, trước worker binding;
7. coordinator chết khi worker đang chạy;
8. timeout/maxBuffer trong lúc coordinator đã chết;
9. worker exit khi receipt chưa rename;
10. receipt durable nhưng command outcome chưa collect;
11. controller cũ sống lại sau controller mới;
12. supervisor chết nhưng worker còn sống;
13. host reboot;
14. two concurrent recovery callers;
15. same Run/command với PID incarnation khác.

Với mỗi điểm ghi: durable facts, actor được phép hành động, outcome typed,
`launch/reconcile/park/settle`, và bằng chứng ngăn duplicate spawn.

### G. Behavioral parity

Đối chiếu exact behavior hiện tại và chỉ rõ acceptance còn thiếu cho:

- `shell:false`, argv/env/cwd;
- dispatch depth environment;
- stdin ignored;
- stdout/stderr UTF-8 capture;
- `onChunk` ordering trước maxBuffer accounting;
- combined stdout+stderr maxBuffer semantics;
- hard timeout và idle timeout reset;
- normal completion đợi `close`, không chỉ `exit`;
- timeout/maxBuffer settle tức thời dù escaped descendant giữ pipe;
- error taxonomy và result shape;
- process-tree termination;
- cleanup và no committed-tree logs.

Phân biệt byte-for-byte parity, semantic parity và intentional behavior change.
Mọi intentional change phải được gọi tên trong plan, test và changelog scope.

### H. Plan/cell feasibility

1. `P02L` lease có đủ mọi production call site và Confinement Authority không?
2. Có same-wave lease collision hoặc hidden dependency không?
3. P03/P05/P06/P08 dependency sau khi thêm P02L có đúng không?
4. P02H có thật sự chỉ reuse adapter-neutral lifecycle, hay đang bị ép phụ
   thuộc local supervisor implementation?
5. Một code-panel agent đọc prompt hiện tại có đủ field/path/ordering để làm
   mà không tự phát minh contract không?
6. Setup/doctor/changelog có phát sinh vì file, config, env hoặc infra dependency
   mới không?

## Simplicity deletion tests

Thử xóa từng mảnh và ghi guarantee nào mất:

1. xóa supervisor;
2. xóa pre-launch envelope;
3. nhập worker và supervisor vào cùng PGID;
4. cho supervisor ghi command outcome trực tiếp;
5. bỏ process start time hoặc boot id;
6. tự resubmit khi pending thiếu binding;
7. gom P02L và P02H lại;
8. tạo generic recovery daemon/registry.

Một mảnh chỉ được giữ khi việc xóa nó làm mất một guarantee đã nêu. Đề xuất
đơn giản hóa phải nói rõ contract nào vẫn giữ và proof nào thay thế.

## Output bắt buộc

Viết report mới tại:

`plans/260911-2305-runtime-recovery/cli-spawn-independent-review-report.md`

Report theo thứ tự:

1. Verdict một dòng: `APPROVED`, `APPROVED WITH NON-BLOCKING CONCERNS`, hoặc
   `NOT READY`.
2. Findings trước, xếp severity `BLOCKING`, `HIGH`, `MEDIUM`, `LOW`, gồm:

   | ID | Severity | Claim/contract | Source evidence | Failure mode | Minimal correction |
   |---|---|---|---|---|---|

3. Trả lời A-H.
4. Artifact ownership table.
5. Process/PGID diagram.
6. Crash matrix đủ 15 điểm.
7. Behavioral parity matrix.
8. Simplicity deletion-test results.
9. Phase readiness và dependency corrections.
10. Danh sách file design cần sửa, nếu có, chỉ rõ section và nội dung cần sửa.
11. Kết thúc bằng:

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED
Implementation gate: OPEN | CLOSED
Decision requests for owner: <zero hoặc danh sách ngắn>
```

## Quy tắc verdict

- `APPROVED` chỉ khi không còn blocking/high finding và một agent mới có thể
  triển khai mà không đoán authority, ordering hoặc crash outcome.
- `APPROVED WITH NON-BLOCKING CONCERNS` chỉ dành cho test/documentation polish
  không làm đổi contract.
- Bất kỳ ambiguity nào có thể gây duplicate spawn, unconfined execution,
  stale settlement, mất output/outcome hoặc giết nhầm process đều là `NOT READY`.
- Review cũ không phải bằng chứng. Không giữ verdict cũ chỉ vì kiến trúc tổng
  thể đã từng được approve.
- Không sửa file nào ngoài report.
