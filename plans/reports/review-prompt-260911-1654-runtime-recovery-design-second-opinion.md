# Prompt: Review độc lập thiết kế runtime recovery (RunHandle / Continuation Planner / Fallback Activation)

Copy toàn bộ phần dưới đường kẻ làm prompt cho agent review.

---

Bạn là reviewer kiến trúc độc lập cho repo `forgentX` (fgOS). Bạn chưa có
lịch sử chat nào; mọi thứ cần thiết nằm trong file được liệt kê. Làm việc
trong `/home/vantt/projects/forgentX`, branch `main`, HEAD phải chứa commit
`79766738` ("docs(coordination): rewrite runtime recovery designs as one
contract each, anchored on Run admission"). Đọc trước `AGENTS.md` và
`docs/specs/reading-map.md` theo quy tắc repo.

## Việc cần review

Ba doc thiết kế (PROPOSED) vừa được viết lại thành một contract mỗi file, cùng
một mục amend vào Run contract đã accepted. Yêu cầu của người chủ dự án:

- contract **đầy đủ và sẵn sàng cho tương lai**;
- default implementation **vừa đủ, đơn giản**, có thể mở rộng sau;
- thiết kế **simple, clean, hexagonal, SRP**;
- toàn bộ Agent Coordination sẽ chuyển sang Rust; thiết kế phải độc lập
  ngôn ngữ, và semantics đã học từ production ở Node phải được port, không
  được đánh rơi.

## Quyết định đã chốt — KHÔNG mở lại, chỉ kiểm xem doc có tuân thủ

Ghi trong `plans/reports/design-review-260911-1617-run-handle-continuation-health.md`
§6–§8. Tóm tắt:

1. Không có thành phần "attempt admission" thứ tư. Run là đơn vị admission;
   `runId` là launch identity; `run-retried` là supersession/result fencing.
   Ba doc trỏ vào Run contract §"Run Phases And Admission".
2. Lease và incarnation KHÔNG defer: contract chốt cả hai guarantee; default
   dùng primitive sẵn có (lock file exclusive-create per Run; incarnation =
   herdr `agent_session` / process `pid + start time`). Chỉ defer bản tổng
   quát (distributed lease, field incarnation generic, effect ledger).
3. Signal ladder (`src/runner/dispatch/liveness.mjs`) là classifier; doc health
   không định nghĩa taxonomy thứ hai. Retry matrix (`src/runner/recovery.mjs`)
   được mở rộng, không nhân bản. `fallbackExecutors` (reserved-not-executed,
   Phase 00 R10) được kích hoạt, không thay bằng policy object mới.
4. Không đổi semantics `partialPolicy`/authorization của engine. Việc ở engine
   là validate tại open + typed refusal code, đã nằm trong backlog
   (tsk-5qj, tsk-40j, tsk-296, tsk-1zu, tsk-oed).
5. Health observation store, cooldown window, scoring: tương lai của cùng
   contract, không ship ở default.
6. Node/Rust coexistence: runtime nào spawn thì sở hữu state nó ghi; reader
   không hiểu `contract` version phải từ chối rõ.
7. Amend phía Node có thực hiện (không chỉ viết contract), vì coordination/
   dispatch thuộc nhóm "Not-Thin" của migration plan và các guarantee này là
   điều kiện tiên quyết để port writer.

Nếu bạn cho rằng một quyết định trên sai, nêu **bằng chứng mới** (file, dòng,
test, hành vi live) — không nêu lại mối lo trừu tượng.

## Câu hỏi review (trả lời từng câu, có dẫn file:dòng)

A. **Contract đầy đủ?** Với mỗi doc, liệt kê field/port/transition còn thiếu
   để một implementer Rust viết được mà không phải đoán. Đặc biệt:
   - RunHandle: ba trạng thái execution/attachment/observation có phủ hết
     tổ hợp thực tế không; `RuntimeControlPort` có đủ typed error/cancel/
     idempotency; lock TTL và stale-by-pid có đủ khi holder là process Rust
     exec Node?
   - Continuation: `ContinuationSnapshotV1` có đủ để planner thuần tính mọi
     action không; `BindingStateV1`/`RunSummaryV1` chưa định nghĩa — có phải
     lỗ hổng?; `idempotencyKey` và `proposedCoordinationId` deterministic có
     thật sự làm hai caller hội tụ?
   - Fallback: `EffectGuaranteePort.declare/verify` có đủ cho "retry sau
     delivery" không; `attemptBudget.perAssignment` tương tác thế nào với
     `recovery.mjs` `maxRetries` — hai counter hay một?
B. **Run contract amend** có mâu thuẫn với phần accepted còn lại của
   `assignment-run-runresult.md`, `runtime-model.md`, hoặc với
   `coordination-session.md` (Recovery Rule, `invocationKey`, `taskKey`,
   `run-retried`) không? Rule "một Run chưa-settled per Assignment" có phá
   flow nào hiện đang chạy trong `assignment-runner.mjs` hay session-engine
   không (ví dụ retry đang tồn tại)?
C. **Hexagon/SRP:** còn chỗ nào adapter rò vào domain (chuỗi CLI, path, herdr
   term), port nào vẫn béo, trách nhiệm nào bị hai doc cùng nhận?
D. **Semantics phải port:** đối chiếu ladder rule trong `liveness.mjs`
   (header comment + `evaluateLadder`) và matrix trong `recovery.mjs` với
   §4 của doc fallback và §4.1/§6 của doc RunHandle. Có rule nào production
   đã học mà doc bỏ sót hoặc diễn giải sai?
E. **Bug → proof:** mỗi hàng F-a..g, C-a..g, E-a..f có đúng một proof
   verifiable không? Proof nào không thật sự chứng minh hàng của nó?
F. **Default vừa đủ?** Có mảnh default nào thực ra cần cho 20 bug mà bị đẩy
   sang deferred, hoặc ngược lại có mảnh default thừa?
G. **Simple/clean:** còn trùng lặp giữa ba doc và README principles không;
   có đoạn nào là principle không kèm hệ quả cụ thể trong contract?

## Output

Viết report `plans/reports/design-review-second-opinion-<yymmdd-hhmm>-runtime-recovery.md`:

- Verdict một dòng: ổn / chưa ổn, và lý do lớn nhất.
- Bảng finding: `id | doc | file:dòng | mức (blocking/warning/info) | bằng chứng | đề xuất sửa`.
- Với mỗi quyết định đã chốt (1–7): tuân thủ / vi phạm ở đâu.
- Câu hỏi chưa chốt ở cuối.
- Kết thúc bằng `Status: DONE | DONE_WITH_CONCERNS | BLOCKED` + một câu tóm tắt.

Không sửa file nào ngoài report. Không viết code.

## Files — đọc theo thứ tự

**Đối tượng review (đọc kỹ toàn bộ):**
- `docs/architect/agent-coordination/architecture/README.md` — index + mục "Runtime Recovery Principles" mà ba doc trỏ vào
- `docs/architect/agent-coordination/architecture/run-handle.md`
- `docs/architect/agent-coordination/architecture/coordination-continuation-recovery.md`
- `docs/architect/agent-coordination/architecture/executor-health-and-fallback.md`
- `docs/architect/agent-coordination/contracts/assignment-run-runresult.md` — §"Run Phases And Admission" là phần mới; phần còn lại là accepted, dùng làm chuẩn đối chiếu

**Lịch sử quyết định (đọc để không mở lại):**
- `plans/reports/design-review-260911-1617-run-handle-continuation-health.md` — bốn vòng review, §6 tự phản biện, §7 hội tụ, §8 tư vấn ba câu hỏi
- `git show 79766738 --stat` và `git show 79766738 -- docs/architect/agent-coordination/contracts/assignment-run-runresult.md` — diff amend Run contract
- `git show 79766738^:docs/architect/agent-coordination/architecture/run-handle.md` (và hai file kia) — bản cũ, nếu cần so sánh field bị bỏ

**Contract và architecture accepted mà ba doc phải khớp:**
- `docs/architect/agent-coordination/contracts/coordination-session.md` — §Storage Layout (`tasks/<hash>.json`), §`operation-authorized`, §`invocationKey` Idempotency, §Retry supersession (`run-retried`), §Recheck Is Not Retry, Recovery Rule
- `docs/architect/agent-coordination/contracts/flow-definition.md` — quorum/operation/activation
- `docs/architect/agent-coordination/architecture/runtime-model.md` — invariants Assignment → Run → RunResult
- `docs/architect/agent-coordination/architecture/dispatch-control-plane.md` — DispatchRequest (`fallbackExecutors`, `minTier`, `provenance`), PolicyPatch, `compileDispatchPlan`
- `docs/architect/agent-coordination/architecture/visibility-and-herdr.md` — herdr là observability, không phải truth
- `docs/architect/agent-coordination/architecture/evidence-and-results.md`
- `docs/specs/confinement-authority.md` — gate cuối trước spawn
- `docs/platform-foundations.md` — locked laws L1–L8
- `docs/routing-handoff-contract.md` — trust boundary agent-to-agent

**Code là semantic contract hiện hành (đọc header comment + hàm export):**
- `src/runner/dispatch/liveness.mjs` — signal ladder: `LADDER_OUTCOMES`, `LIVENESS_READINGS`, `evaluateLadder`, `matchUsageLimit`, `paneFateFor`
- `src/runner/recovery.mjs` — error-class domain + `resolveAction(errorClass, attempt)` + `resolveStaleDoing`
- `src/runner/dispatch/assignment-policy.mjs` ~dòng 150–175 — `fallbackExecutors` reserved-not-executed, `executorList`
- `src/runner/dispatch/assignment-runner.mjs` ~dòng 845–890 — `runId = run_<assignmentId>_<attempt>`, `runMeta`, thứ tự ghi trước spawn
- `src/runner/dispatch/cli.mjs` ~dòng 880–905 và 1700–1720 — `dispatch-in-flight` lock door
- `src/runner/coordination/session-engine.mjs` ~dòng 430–460 (`openSession`, `partialPolicy` R1), ~2500–2545 (`dispatchDeclaredOperation` fresher-unconsumed-authorization refusal), ~3410–3420 (`requiredActorIds`)
- `src/runner/coordination/store.mjs`, `replay.mjs` — `linkResult({allowSupersede})`, replay của `run-retried`
- `src/runner/dispatch/herdr-agent.mjs` ~dòng 290–300 — `agent_session` id
- `src/runner/claim-port.mjs`, `src/runner/lock-wait.mjs` — pattern lock exclusive-create đang dùng (mẫu cho controller lock)

**Migration Node → Rust (để trả lời câu 7 và D):**
- `docs/architect/host-invocation-routing/node-to-rust-component-migration.md` — §4 Not-Thin Candidates, §10 read models trước writers, §11 điều kiện migrate writer
- `docs/architect/host-invocation-routing/legacy-cli-transition.md`
- `AGENTS.md` §"Legacy-Node CLI Ownership Boundary"

**Backlog liên quan (đọc qua `fgos list --json` hoặc `fgos show <id>`):**
- `tsk-5qj` — partialPolicy auto-close sau pass required đầu (kernel bug, C-b)
- `tsk-40j` — review-only cell không close được vì thiếu allowedOmissions (C-a)
- `tsk-296` — validate partialPolicy tại `openSession` (phụ thuộc tsk-5qj)
- `tsk-1zu` — typed reason code cho refusal duplicate authorize (C-c)
- `tsk-oed` — wallTimeMs là bound thứ ba chưa được doc (C-e)

**Nguồn bug dogfood (nếu cần xác minh proof):**
- `docs/architect/agent-coordination/verification/rust-host-r1-kernel/p00.md` … `p16.md` — code-panel dogfood P01–P14 mà ba doc trích F/C/E từ đó
- `docs/architect/agent-coordination/verification/architecture-advisory-panel/P02.1.md` Table 4 BL1 — nguồn tsk-5qj
