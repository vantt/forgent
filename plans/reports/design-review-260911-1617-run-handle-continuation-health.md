# Design review: RunHandle / Continuation Planner / Executor Health

Date: 2026-09-11. Scope: three PROPOSED docs under
`docs/architect/agent-coordination/architecture/`. Tiêu chí anh đặt: contract
đầy đủ + sẵn sàng tương lai, default impl tối giản, simple / clean / hexagon /
SRP.

## Kết luận

**Chưa ổn.** Hướng kiến trúc (ranh giới 5 thành phần, principle "quan sát không
sinh quyền thực thi") là đúng. Nhưng ba doc ở trạng thái *patch-log chồng lên
draft*: mỗi file có hai contract mâu thuẫn nhau, và cả ba đều bỏ qua bốn cơ chế
đã tồn tại trong repo mà chúng đang định nghĩa lại. Một agent lạ implement theo
doc hiện tại sẽ build cơ chế song song — đúng dạng RUL11 tùm lum.

## 1. Simple / clean — FAIL: hai contract trong một file

Mỗi doc = khối "Review 2026-09-11" (~120 dòng, preamble 4 đoạn copy nguyên văn
×3) tuyên bố "ưu tiên hơn schema bên dưới" + §6 schema gốc mà chính khối review
nói là chưa đủ. Mâu thuẫn trực tiếp trong cùng file:

| Doc | Khối review nói | §6/§8 vẫn ghi |
|---|---|---|
| run-handle | tách execution / attachment / freshness, enum status chưa đủ | một `status` enum 6 giá trị |
| run-handle | adapter identity namespaced, không sửa common contract khi thêm plugin | `RuntimeKind` closed enum |
| run-handle | diagnostic refs đặt tên rõ để không nhầm evidence | `evidenceRefs` |
| run-handle | RunHandle không có recovery policy thứ hai | `RunHandlePort.recover() -> RecoveryPlan` |
| run-handle | `show` read-only không ghi heartbeat | §8.2 inspect "có thể cập nhật heartbeat" |
| continuation | action = discriminated union, payload bắt buộc theo kind | `decision` + `nextAction?` + `continuation?` rời nhau |
| continuation | plan gắn snapshot revision, policy version, idempotency key | không có cả ba |
| continuation | pure planner nhận snapshot | §7.2 bước 8 planner tự "hỏi Dispatch Control Plane" |
| health | success không bắt buộc failureClass | `failureClass` required |
| health | health scope = resource (provider/account/model) | chỉ `executorId` |
| health | fallback policy chỉ sở hữu candidates/triggers/backoff/limits | `minTier`, `allowCrossProvider`, `requireConfinementAtLeast` |

Fix: gộp khối review vào thân, viết lại §6 thành contract duy nhất, xoá bản cũ.
Preamble chung đặt một chỗ (README của thư mục hoặc một section ngắn), không
copy ba lần.

## 2. Hexagon — PARTIAL

Đúng: planner/classifier thuần, adapter herdr ngoài core, ports được gọi tên.

Sai:
- `NextActionV1.command: string`, `requestFile: string` — domain planner phát
  ra chuỗi shell. CLI adapter đang rò vào core. Planner trả typed action; CLI
  adapter render command.
- `RunHandlePort` §8 là một port béo: repository (`create/list`) + runtime
  adapter (`inspect/snapshot/terminate/rename`) + policy (`recover`). Khối
  review đã gọi tên ba port; schema chưa tách.
- Storage layout với 3 index (`by-run/by-assignment/by-locator`) là chi tiết
  adapter được trình bày như contract. Default: một file per handle + scan.
- `confidence: 'blocked'` là decision, không phải confidence.

## 3. SRP — lỗ hổng cấu trúc lớn nhất: "execution authority hiện có" không tồn tại

Cả ba doc đẩy invariant khó nhất — *một admission cho một logical attempt, có
launch identity, reconcile được qua cửa sổ crash admission → spawn → binding →
delivery, fencing stale controller* — sang "authority hiện có revalidate và
admit". Grep repo: không có thành phần nào mang trách nhiệm đó. Cái có:

- `invocationKey` + `tasks/<hash>.json` idempotent-claim, scope session
  (`contracts/coordination-session.md` §invocationKey, Recovery Rule);
- per-cwd dispatch lock → `dispatch-in-flight` (`src/runner/dispatch/cli.mjs`);
- `src/runner/recovery.mjs` `resolveAction(errorClass, attempt)`.

Không cái nào phủ toàn cửa sổ launch. Vậy design có thành phần thứ tư chưa có
chủ, mà principle trung tâm của cả ba doc lại phụ thuộc vào nó. Đây là lý do
chính "chưa sẵn sàng tương lai".

SRP khác:
- `dispatch-in-flight` nằm trong health failure taxonomy: đó là admission/
  concurrency refusal, không phải executor health; đã có trong `recovery.mjs`.
- `semantic-failure` trong health taxonomy: doc tự nói nó không ảnh hưởng
  health. Mô hình đúng: outcome `infra-ok`, semantic thuộc RunResult.
- Continuation planner làm hai việc khác input, khác call site: (a) validate
  request-shape trước open (§7.1, C-a/C-b, gọi từ `run.mjs`), (b) plan resume
  (§7.2, gọi từ `show/chain`). Tách OpenRequestValidator khỏi ContinuationPlanner.
- `FallbackDecisionV1.governance` boolean nằm trong decision → consumer sẽ dùng
  như permission dù review nói chỉ để hiển thị. Thay bằng ref tới DispatchPlan
  đã compile cho candidate.

## 4. DRY — ba doc không cite bốn cơ chế đã có

| Đã có | Doc mới định nghĩa lại |
|---|---|
| `dispatch/liveness.mjs` `evaluateLadder`: settled/blocked/died/timed-out-ceiling/paused-limit/timed-out-idle, rule "unknown ≠ absent", "blind interval không tính stale" | health §7 taxonomy `zero-output-timeout/timeout-unknown/handshake-timeout/provider-quota`; run-handle §4.2 fail-closed rule |
| `recovery.mjs` matrix pure, đếm attempt, có `worker-timeout`, `worker-spawn-fail`, `dispatch-in-flight` | health retry/park/refuse matrix + attempt counters |
| `DispatchRequest.fallbackExecutors` reserved-not-executed (Phase 00 R10) + `minTier` + `provenance` | `FallbackPolicyV1.candidates/minTier` |
| `invocationKey` / `taskKey` idempotent-claim | "launch identity" / "admission" trong continuation và run-handle |

Không doc nào nhắc `liveness.mjs`, `recovery.mjs`, `taskKey`. Health doc còn
nhận nhầm: nó không phải classifier đầu tiên — ladder đã là classifier; health
là consumer của ladder outcome + facts.

## 5. Contract completeness gaps (sẵn sàng tương lai)

- run-handle: thiếu `revision` (CAS), `incarnation` trong locator, `admissionRef`
  / launch identity, `delivery` state (not-sent / sent / unknown), observation
  freshness tách khỏi status.
- continuation: `ExistingResultRefV1`, `MissingOperationV1` chưa định nghĩa;
  plan thiếu revision/idempotency; `ContinuationSessionProposalV1` thiếu budget
  authority + lineage.
- health: thiếu `observationId`, attempt correlation, resource scope, policy
  provenance trong decision, tổng attempt budget/deadline (chỉ có
  `maxAttemptsPerExecutor`).

## 6. Góc nhìn thứ hai (tự phản biện, cùng ngày)

Sau khi soi lại, ba kết luận ở trên cần sửa và một điểm bị sót.

**6.1 Không cần thành phần thứ tư — Run đã là attempt admission.** Kiểm tra
thêm: `runId = run_<assignmentId>_<attempt>` (deterministic, sinh trước spawn,
`assignment-runner.mjs:852`), và `run-retried` là event khai supersession
*trước khi* Run mới dispatch (`coordination-session.md` §Retry supersession).
Vậy launch identity = `runId`, admission event = `run-retried`/Run creation.
Cái thiếu chỉ là hai câu trong contract canonical `assignment-run-runresult.md`:
(a) Run record phải durable trước spawn, có phase `admitted → launched → bound →
delivered`; (b) một Assignment chỉ có một Run chưa-settled tại một thời điểm,
Run mới chỉ hợp lệ sau supersession khai báo. Fencing = Run cũ bị supersede thì
mất quyền publish result (đã có: `result-linked` sau `run-retried`). Đề xuất
"attempt-admission.md" ở §Khuyến nghị cũ là over-shape; thay bằng amend
contract Run. Ba doc trỏ vào Run contract thay cho "authority hiện có".

**6.2 Rust là đích → DRY phải nói về semantics, không phải module.** Ba doc
cố ý không cite `.mjs` vì "Rust là đích triển khai". Đúng về hình thức, sai về
nội dung: `liveness.mjs` ladder và `recovery.mjs` matrix là *rule học từ
production* ("agent_status wrong about that twice in production", "unknown
resets death count", "blind interval không tính stale"). Một Rust port chỉ đọc
ba doc mới sẽ đánh rơi các rule này. Yêu cầu đúng: doc phải cite chúng như
*semantic contract phải được port*, không phải như module để import. Việc này
quan trọng hơn em đánh giá lần đầu, vì migration là lúc dễ mất tri thức nhất.

**6.3 Lớp principle over-general so với 20 bug gốc.** Ba doc sinh từ ~20 lỗi
dogfood cụ thể (F-a..g, C-a..g, E-a..f). Soi từng lỗi: không lỗi nào cần
distributed lease, incarnation counter, hay effect ledger. F-b (CLI chết, pane
sống) cần: handle durable trước prompt + đọc trước redispatch. F-f (duplicate
process) cần: một Run chưa-settled per Assignment (6.1). PID reuse: `pid +
startedAt` là đủ cho default. Đề xuất: contract *giữ đủ hình* (field tồn tại,
optional), nhưng phần semantics bắt buộc chỉ phủ 20 bug đó, và **mỗi bug gắn
đúng một proof** thay cho ba danh sách "Proof cần bổ sung" rời rạc (~40 mục).

*Sửa sau khi anh hỏi lease/incarnation handle gì:* "defer" là chữ sai. Hai
guarantee này bảo vệ scenario có thật; cái defer được chỉ là bản tổng quát.

| Guarantee | Bảo vệ scenario | Có thật ở repo? | Bản rẻ nhất (dùng ngay) | Thứ thật sự defer |
|---|---|---|---|---|
| Lease (control) | Hai controller trên một Run đang sống: coordinator bị RAM-pause *trông như* chết, session mới resume → hai bên cùng gửi prompt / cùng terminate / ghi handle last-write-wins | Có: F-b + F-c là cùng cơ chế (pause ≠ dead); fanout 3-way race đã xảy ra live | Lock file per Run theo pattern `wx`/O_EXCL đã có ở 8 module (`claim-port`, `lock-wait`, `main-checkout.lock`): holder pid + expiry, stale-by-pid | Lease phân tán nhiều máy, renew bởi supervisor, fencing token do effect-side enforce |
| Incarnation (resource identity) | Locator bị tái dùng: pane id sau tmux server restart, PID wrap → close guard / terminate trên handle stale đánh vào pane/process của người khác | Có nhưng hiếm: chỉ sau tmux restart hoặc pid wrap trên máy bận | Không cần field mới: herdr đã trả `agent_session` (unique, không tái dùng); process = `pid + /proc start time`. Rule: adapter locator phải unique trong đời máy/server, adapter kiểm trước control | Field `incarnation` generic trong common contract, cho container/remote-job |

Cả hai đều KHÔNG bảo vệ external effect (commit, file đã ghi) — đó là effect
protection, doc tách đúng, và đó mới là thứ defer thật (effect ledger).

**6.4 Sót: Node/Rust writer ownership có đáp án đơn giản.** Doc nêu "mỗi scope
một writer" nhưng không chốt. Với AGENTS.md mới (Rust host exec `bin/fgos.mjs`
làm legacy-node payload), hai runtime là một cây process, Rust là cha. Rule đủ:
*ai spawn thì sở hữu handle*, ghi trong `owner`; runtime kia chỉ đọc. Không cần
handover protocol trong default.

**6.5 Đã cân nhắc và bác:** gộp ba doc thành một "attempt lifecycle". Bác vì ba
doc map đúng ba boundary đã accepted (Dispatch, CoordinationSession, Runtime).
Nhưng cần một *xương sống* chung là state machine của Run (6.1) để ba doc cùng
trỏ vào — hiện xương sống đó chưa có.

## 7. Đánh giá hội tụ (vòng cuối, nhìn xuyên ba vòng)

**Cái ổn định qua cả ba vòng, không đổi:** hướng 5 thành phần đúng; hai
contract trong một file; hexagon rò (command string, port béo); health taxonomy
chứa thứ không phải health; thứ tự recovery result → handle → redispatch đúng.

**Cái đã đổi, và đổi theo một hướng duy nhất:** vòng 1 đề xuất thêm thành phần
thứ tư → vòng 2 rút về amend Run contract; vòng 2 "defer lease/incarnation" →
vòng 3 "dùng primitive sẵn có". Cả hai lần đổi đều đi về cùng một mệnh đề:

> Ba doc thiếu xương sống, và xương sống đã có sẵn trong repo: Run +
> `run-retried` (admission/fencing), ladder (classification), `recovery.mjs`
> (matrix), `fallbackExecutors` (candidates), lock `wx` (lease), `agent_session`
> (incarnation). Việc còn lại là *gọi tên* chúng trong contract, không phải
> *thiết kế lại* chúng.

Áp mệnh đề đó thêm một lần nữa cho hai góc chưa soi, ra hai hệ quả mới —
cùng hướng, không đảo ngược gì:

**7.1 Continuation planner đang bù cho footgun của engine.** Kiểm engine:
không có khái niệm "poisoned authorization" — engine nhận authorize thứ hai
cùng tuple im lặng rồi FIFO-match cái đầu. `partialPolicy` là invariant khai
trước (R1) có chủ đích. Vậy C-a/C-b thuộc validate trong `openSession`, C-c/C-d
thuộc engine (refuse duplicate authorize rõ ràng hoặc cho supersede). Sửa tại
gốc thì planner chỉ còn ba case thật: wall-time hết (C-e/C-g), CLI chết mà
outbox đã có result (C-f), active-but-undispatchable. Doc đặt "không đổi
semantics authorization" là non-goal của *planner* — không cấm sửa engine.
Đây là option, không phải reversal; anh quyết.

**7.2 Health store là deferrable toàn bộ, không chỉ scoring.** Sáu bug E-a..f
cần: (a) activate `fallbackExecutors` khi ladder trả `died`/`timed-out-idle`/
spawn-fail, đi qua cùng compiler; (b) `paused-limit` → park với retryAfter;
(c) một attempt per executor per Assignment (chặn re-pick). Không cần
observation store, health state, cooldown window. Doc nên đổi trọng tâm thành
"Fallback activation"; health observation là phần tương lai của cùng contract.

**7.3 RunHandle persistence:** giữ type riêng, nhưng default ghi một file
`run-handle.json` trong `runDir` — by-run index = runDir, by-assignment =
assignment dir, by-locator = scan. Bỏ lớp index. Multiplicity giữ ở contract
(`handles[]`), default một handle.

**Gap thật còn lại chưa có primitive sẵn:** continuation session lineage +
budget authority (C-e/C-g). Bản rẻ: `parentCoordinationId` một field; budget
authority = tác giả request `openSession` (engine đã nhận `aggregateBounds` từ
request); `proposedCoordinationId` deterministic từ parent + reason + remaining
ops để hai caller apply hội tụ. Nhỏ, nhưng là phần duy nhất phải *thiết kế*.

**Điều gì sẽ làm em đổi ý:** (1) remote-job/multi-machine runtime là mục tiêu
gần → distributed lease quay lại mandatory; (2) footgun authorization là
invariant cố ý không được sửa → planner giữ nguyên kích thước; (3) Rust port
đủ gần để amend phía Node là phí → chỉ viết contract, không implement Node.
Không có ba điều đó, em cho là đã hội tụ: vòng tiếp theo chỉ sinh refinement
cùng hướng, không sinh đảo chiều.

**Bias tự khai:** ba vòng liền em đều đẩy về "nhỏ hơn", trong khi yêu cầu của
anh là "contract đầy đủ, sẵn sàng tương lai". Kiểm lại: mọi thứ em cắt là
implementation và semantics *bắt buộc*, không cắt hình contract — field cho
multiplicity, lease, incarnation, resource scope, lineage đều còn. Chỗ duy nhất
có nguy cơ under-design là lineage/budget ở trên, và em đã đưa primitive.

## 8. Tư vấn ba câu hỏi chốt (có bằng chứng repo)

**Q1 — Sửa footgun ở engine hay giữ planner?** → *Không đổi semantics engine;
thêm typed reason code cho refusal đã có; validate `partialPolicy` tại open.*
Bằng chứng: engine KHÔNG im lặng như §7.1 em nói — `session-engine.mjs:2530`
đã throw `validation` khi có "fresher unconsumed authorization" cùng tuple, kèm
remedy "pass an explicit, distinct taskKey". Vậy C-c là *caller không biết
remedy* (skill prose), không phải engine bug. Planner vì thế co lại đúng như §7
nhưng vì lý do khác: nó chỉ cần *dịch* refusal của engine thành typed next
action, không cần tự phát hiện poison. Hai việc nhỏ ở engine: (a) refusal này
mang `code` ổn định thay vì chỉ message; (b) `openSession` validate shape
`partialPolicy` vs FlowDefinition (C-a/C-b) — đây là validate, không đổi
semantics R1 "khai trước".

**Q2 — Health doc đổi trọng tâm thành fallback activation?** → *Có.*
Bằng chứng: `fallbackExecutors` là "recorded and validated, never automatically
dispatched" theo chính dispatch-control-plane.md (Phase 00 R10) — reserved chờ
đúng việc này. `recovery.mjs` đã có `retry` + `maxRetries` → `park`. Activation
= khi `resolveAction` trả `retry` và ladder trả `died`/`timed-out-idle`/
spawn-fail, chọn phần tử tiếp theo trong `executorList` thay vì cùng executor,
qua cùng `compileDispatchPlan`. `paused-limit` → park với retryAfter (ladder đã
tách sẵn). Observation store, cooldown window, health state: giữ trong contract
như phần tương lai, không ship.

**Q3 — Rust port bao xa; amend Run contract có implement Node không?** →
*Implement Node, mỏng, sau port.* Bằng chứng: R1 = Rust host + fgctl + install,
Node là legacy provider (Option B); coordination/dispatch nằm nhóm "Not-Thin",
"remain whole legacy operations until transaction and authority boundaries can
move together"; §11 chỉ migrate writer khi "lock, atomicity, idempotency, crash
recovery, Node/Rust mutual exclusion" đã explicit và tested. Nghĩa là: chính
những thứ ba doc này chốt là *điều kiện tiên quyết* để coordination được port —
làm ở Node trước là đường ngắn nhất tới Rust, không phải phí. Và Node còn là
runtime thật của mọi project dùng fgOS (mission #1/#2) trong R1–R2.

## Khuyến nghị (đã sửa theo §6, bổ sung §7–§8)

1. **Amend `contracts/assignment-run-runresult.md`**: Run phase (`admitted →
   launched → bound → delivered → settled`), Run durable trước spawn, một Run
   chưa-settled per Assignment, supersession = fencing. Ba doc trỏ vào đây.
2. **Viết lại mỗi doc thành một contract**: gộp khối review, xoá §6 cũ, preamble
   chung một chỗ. Mỗi dogfood bug một proof.
3. **Cite semantics đã có như contract phải port**: `evaluateLadder` outcomes và
   rule, `recovery.mjs` matrix, `fallbackExecutors` reserved. Health classifier
   là consumer của ladder, không phải taxonomy thứ hai.
7. **Sửa footgun tại engine** (option, §7.1): validate `partialPolicy` shape
   trong `openSession`; refuse duplicate authorize cùng tuple. Planner co lại
   còn ba case thật.
8. **Đổi trọng tâm health doc thành fallback activation** (§7.2); observation
   store là tương lai của cùng contract.
4. **RunHandle**: ba port (`Repository`, `RuntimeControl`, `Guard`), bỏ
   `recover`; ba field trạng thái trực giao; `RuntimeKind` thành namespaced
   string do adapter validate; đổi `evidenceRefs` → `diagnosticRefs`.
5. **Continuation**: action discriminated union, bỏ `command/requestFile`,
   tách validator khỏi planner, bỏ `'blocked'` khỏi confidence.
6. **Health**: bỏ `dispatch-in-flight` và `semantic-failure` khỏi taxonomy; bỏ
   governance fields khỏi FallbackPolicy; decision mang `compiledPlanRef` +
   provenance.

Default impl như ba doc đề xuất (một adapter herdr, local repository lock/CAS,
pure planner, candidate list tĩnh, bounded retry) là đúng mức — giữ nguyên.

## Câu hỏi chưa chốt

- Câu hỏi cũ (admission ở session hay ở Run) đã tự trả lời ở §6.1: ở Run.
- Còn lại: anh có chấp nhận thu hẹp phần semantics bắt buộc về đúng 20 bug
  dogfood (§6.3), giữ lease/incarnation/effect-ledger ở dạng field optional +
  deferred? Đây là trade-off giữa "sẵn sàng tương lai" và "simple".
