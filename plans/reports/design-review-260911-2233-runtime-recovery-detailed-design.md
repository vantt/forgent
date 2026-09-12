# Design Review: Runtime Recovery Detailed Design

**Verdict: Chưa ổn** — hướng kiến trúc ổn và cả chín hướng đã chốt đều đứng vững; không có gì trong review này đòi làm lại Agent Coordination. Sau ba vòng phản biện còn **hai** blocking, mỗi cái chặn một slice: **B01** (CP §6 vs X08 vs replay post-terminal) chặn S5; **B04** (herdr không mang launch identity) chặn S2 **bất kể profile read-only hay writable**, vì F-b/F-f (duplicate spawn, đã xảy ra live) không phụ thuộc writability — reviewer rút lại nhượng bộ "chỉ còn B01" ở vòng ba (§8, điểm 11). B02/B03 là gate của profile writable takeover; S2 thu hẹp xuống read-only/isolated takeover + park. Kiến trúc tổng thể đã hội tụ; S0–S1 và S4 lập kế hoạch được ngay, S2 sau B04.

Ngày: 2026-09-11. Review độc lập theo `plans/reports/review-prompt-260911-1805-runtime-recovery-detailed-design.md`. Branch `main`, HEAD `7e65101fe1dc527206a18f04c49dfc7e615c2afc`. **Lưu ý:** các file thiết kế runtime-recovery (bốn doc architecture, ba contract, README, visibility, reading-map) là thay đổi **chưa commit** trong working tree tại HEAD này; review đọc bản working tree.

Phương pháp: đọc đủ 21 file bắt buộc; đối chiếu trực tiếp `liveness.mjs`, `recovery.mjs`, `assignment-policy.mjs`, `assignment-runner.mjs`, `store.mjs`, `replay.mjs`, `session-engine.mjs`, `run.mjs`, `show.mjs`, `chain.mjs`, `headless-adapter.mjs`, `visibility-session.mjs`, `main-checkout-lock.mjs`, `herdr-round.mjs`, `herdr-agent.mjs`, `confinement/authority.mjs`, `plan.mjs`; đọc test coverage hiện có (`coordination-recovery-and-quorum`, `coordination-chain`, `main-checkout-lock`); dogfood P08/P12/P02.1. Chạy probe thuần không ghi file (`evaluateLadder`, `resolveAction`), `fgos show` cho sáu backlog item được cite. Không sửa code/test/doc. GitNexus `present` nhưng không cần impact analysis vì không có edit symbol.

Tên ngắn: RRD = `runtime-recovery-design.md`; RH = `run-handle.md`; CP = `coordination-continuation-recovery.md`; EF = `executor-health-and-fallback.md`; Run = `contracts/assignment-run-runresult.md`; Session = `contracts/coordination-session.md`; Flow = `contracts/flow-definition.md`. Số sau `:` là dòng tại working tree.

`blocking` = phải chốt trước khi slice tương ứng có thể được coi là chứng minh được; không có nghĩa bỏ hướng kiến trúc.

## 1. Finding Table

| id | severity | doc/component | file:line | evidence | recommendation |
|---|---|---|---|---|---|
| B01 | blocking (S5) | CP §6 vs RRD X08 | CP:253-256; RRD:260 | CP cho phép parent terminal non-cancelled schema-2 "append transfer bookkeeping when declared policy permits"; X08 lại đòi "parent terminal → transfer refuses". Replay hiện neutralize mọi event post-terminal (Session:968-974, Recovery Rule #5), nên cho phép bookkeeping post-terminal là đổi semantics replay. | Hai cách hợp lệ: (a) first profile refuse parent terminal, xóa CP:253-256; (b) tách hai lớp event — **transfer authority event** cấm sau terminal, **audit/bookkeeping projection** không đổi replay authority được phép — và sửa Recovery Rule #5 nêu rõ lớp nào. Contract hiện chưa phân biệt hai lớp nên dù chọn (b) vẫn phải sửa doc. |
| B02 | blocking (S2 writable takeover) | RH §5 / EF §5 | RH:200-201; EF:155-160; Session:1079-1085; `confinement/authority.mjs:481-538` | RH nói "Different Assignments sharing a workspace are still serialized by the **existing** workspace/confinement owner". Session contract ghi rõ đây là câu hỏi mở: hai mutating dispatch cùng worktree không có exclusivity. Confinement chỉ kiểm `ownWorktree ≠ repo root`, không cấp grant. `workspaceGrantRef` (RH:195) không có issuer. | Chỉ định issuer: thêm workspace-identity lock scope vào lock order §6 (do Run repository giữ), hoặc scope S2 writable takeover vào worktree Work-runner (`fgw/<id>`, claim đã sở hữu). Ghi vào bảng ownership §3. |
| B03 | blocking cho X05; dependency của profile writable takeover (không phải S2 chung) | RRD §5 / evaluator | RRD:122-125; EF:158-159; `assignment-runner.mjs:895-898`; `evidence-and-results.md:37` | Chỉ khi replacement ghi lên **cùng** workspace đã sửa dở (hoặc acceptance dựa trên inherited edits): evaluator trừ `dirtyBefore` khỏi `changedFiles`, edit kế thừa biến mất khỏi delta → mutating claim có thể "no post-run delta". Replacement read-only, hoặc writable trong workspace isolated mới giữ snapshot read-only của work cũ (EF:158-159), đo delta bằng evaluator hiện tại vẫn đúng. RRD đòi cumulative-lineage evaluation nhưng Run Result Evaluator không có owner trong §3 hay slice nào. | Gắn X05 vào profile writable-same-workspace; khi bật profile đó, thêm hàng "Run Result Evaluator: cumulative-lineage view + `inherited` attribution input" vào §3. S2 default (read-only/isolated) không cần sửa evaluator. |
| B04 | blocking (S2 launch reconciliation) | Run amend / herdr adapter | Run:181-183; `herdr-round.mjs:654`; `herdr-agent.mjs:292`; `visibility-session.mjs:150-169` | Amend: adapter "must find that identity after a crash, including before locator persistence". Herdr hiện: `agentName = fgos-<workId>-<Date.now().toString(36)>` không mang runId; client chỉ expose lookup theo tên (`agentGet(name)`); sau crash giữa `paneSplit` và `note({paneId})` orphan pane không có key nào derive từ runId/launchCommandId. Gap thật, độc lập với cách giải. | Primitive cần là **gateway-side lookup theo launch identity** (runId hoặc launchCommandId) kèm durable launch record đã có trong amend. Tên agent deterministic chỉ là một adapter strategy (hiện là strategy duy nhất vì client chỉ lookup theo tên) và mang lifecycle/collision semantics riêng — phải probe herdr có reuse tên sau close không. Ghi là adapter change trong S2, không phải "existing capability". |
| W01 | warning (behavior change, không phải lỗi) | EF §3 vs production | EF:76; `herdr-round.mjs:55-61`; `loop.mjs` không xử lý `blocked` riêng; probe `resolveAction('worker-timeout',1) → retry` | EF map `blocked`/`paused-limit` → park trước matrix. Production hiện map cả hai → `worker-timeout` → matrix retry ở attempt 1. Hướng mới đúng với comment của chính ladder ("answer it, do not retry it") — không phản đối, chỉ chưa được gọi tên là migration. | Gọi tên là thay đổi `ERROR_CLASS_FOR_OUTCOME` consumer behavior trong EF §3; S0 freeze fixture cho hành vi cũ và đánh dấu deficiency. |
| W02 | warning | RRD §6 / RH §3 | RRD:140-144; RH:88-90; `main-checkout-lock.test.mjs:458-483` | Holder identity là process; live process không bao giờ bị reclaim. Đúng cho Node CLI-per-invocation, nhưng với host dài hạn (gateway R3, Rust host) task điều khiển chết mà process còn sống → không bao giờ reclaim. Repo đã có mẫu heartbeat-renew (`renewMainCheckoutLockIfOwn`). | Thêm invariant: critical section control phải release-on-exit (finally); thêm operator door force-release có attestation; hoặc holder = process + per-acquisition token có heartbeat, hết heartbeat mới cho reclaim. Vẫn không phải TTL-only steal. |
| W03 | warning (định nghĩa proof, không phải runtime) | RRD X02 vs herdr resend | RRD:254; `herdr-round.mjs:534-548`; `deliverBrief:389-412` | Herdr resend brief khi chưa thấy ack và agent ở ready state — transport resend-until-ack là hành vi bình thường, không mâu thuẫn với "no duplicate **semantic** delivery". X02 chưa nói duplicate ở tầng nào. | X02 định nghĩa duplicate = semantic delivery thứ hai (resend khi ack đã có hoặc agent `working`); khai repeat mode herdr `sendInput` = idempotent-until-ack. Không cần đổi runtime. |
| W04 | warning | RRD §7 vs `run.mjs` | RRD:167-172; `run.mjs:743-755` | Recover intent mở rộng cửa `coordination run`, nhưng `run.mjs` luôn gọi `closeSessionByQuorum` sau steps. Không nói recover có bỏ qua close không → nguy cơ auto-close (đúng lớp bug BL1) khi recover chỉ muốn collect. | Recover intent thực thi đúng một action planner; chỉ gọi close khi action = `close-session`. |
| W05 | warning (policy chưa chốt, chưa phải lỗi harness) | RRD §7 / X11 | `run.mjs:135-148`; `show.mjs:336` | Resume bị refuse nếu `writerId ≠ provenanceRoot.writerId`; `show` expose `provenanceRoot`. X11 (fresh agent) chưa chạy được cho tới khi identity policy chốt: cấp raw writerId, manifest lookup, hay driver-replacement door có bookkeeping. Không mặc định phương án nào. | Chốt policy trước S5 (Open Question 1); X11 viết theo policy đã chọn. |
| W06 | warning (dependency) | EF §6 / compiler | EF:184-187; `plan.mjs:321`; `dispatch-control-plane.md:215` | Với Assignment thật, `compileDispatchPlan` hard-error khi executor quyết định ≠ `policy.executorPreference[0]`. Candidate fallback ≠ primary sẽ bị refuse trừ khi provenance scope `fallback` được policy resolver chấp nhận. | Chỉ định: candidate đi vào compiler qua `cliOverride.preferExecutor` + `policyProvenance.executor = {scope:'fallback', id}`; `resolveAssignmentDispatchPolicy` coi `fallbackExecutors[i]` là preference hợp lệ. |
| W07 | warning (dependency) | CP §2 / S4 | CP:60-63; `session-engine.mjs:2453-2560`, `1860-2009`, `3414` | `legalNext` per binding đòi "existing graph/authorization evaluator". Read evaluator thuần hiện chỉ có `classifySessionQuorum`; gate reachability/authorization/visibility nằm inline trong hai cửa ghi. S4 "develop beside S1-S3 using recorded facts" bỏ qua việc phải extract các gate này thành read evaluator. | S4 scope ghi rõ: extract read evaluator từ `dispatchDeclaredOperation`/`authorizeDeclaredOperation`, cửa ghi gọi lại evaluator đó (một nguồn), rồi planner mới thuần được. |
| W08 | warning | RRD §2 | RRD:52 | "The tracking adapter validates owner namespace and membership" — component mới không có hàng trong bảng ownership §3. | Thêm hàng, hoặc nói core chỉ validate shape, consumer harness validate namespace. |
| W09 | warning (dependency) | EF §5 / S3 | EF:137; `assignment-runner.mjs:743-747` | Coding operation không khai repeat mode → "missing mode cannot authorize retry after possible delivery" → S3 chỉ fallback được trước delivery. Không nói `Assignment.mutation === 'read-only'` + output per-Run isolated ⇒ guarantee `read-only`. | Khai derivation đó. Nó cho E-a (P08 red-team, read-only, zero-output ceiling) một nhánh fallback thật thay vì luôn park. |
| W10 | warning | Run amend / standalone | Run:171-175; `visibility-session.mjs:236` | Work-runner dispatch ghi `dispatch-runs/<workId>/<stamp>` không có Assignment → không có Assignment lock/attempt. Amend nói standalone giữ supersession trong admission record nhưng không nói layout này thuộc profile nào. | Nói rõ: `dispatch-runs` ở legacy profile cho tới khi Work-runner tạo Assignment thật, hoặc đưa vào S1. |
| I01 | info | RRD §7 | RRD:175 | `reasonCode?` optional trên `refused`/`needs-input`. | Bắt buộc. |
| I02 | info | EF §1 | EF:29-32 | `FailureObservationV1` có contract version nhưng chỉ in-process; §3 RRD cho phép native types. | Bỏ version hoặc nói nó được persist làm evidence ref. |
| I03 | info | RH §5 | RH:172, 182 | `materialId` = digest manifest; không nói `capture.capturedAt` có nằm trong input digest không (CP §4 loại timestamp). | Loại timestamp khỏi digest, nói rõ. |
| I04 | info | RRD §2 | RRD:37; `chain.mjs:25-53` | Cite `chain.mjs:24`; logic thực ở 25-27/41-53. | Sửa cite. |
| I05 | info | CP §5 | CP:158; Session:413-423 | Destination `digest` cần loader pin theo content; contract gọi đây là systemic gap chưa đóng. | Liệt kê là prerequisite S5. |
| I06 | info | CP §6 | CP:229-234 | `provenanceRoot.writerId` của child chưa nói. | Chốt (gắn W05). |
| I07 | info | EF §4 | EF:98-101; Run:167-169 | Declaration aborted có tính vào Session `maxRetries` không. | Chốt: không tính vào A, có tính vào declaration count hay không phải nói. |

## 2. Trả Lời A–G

### A. Phạm vi và ownership

**A1.** Có, thiết kế giải quyết takeover trong cùng cell, không chỉ continuation giữa session: RRD §4 hàng "Worker cannot continue" giữ Assignment; RH §5 envelope `{assignmentRef, sourceRunIds, materialRef, workspaceGrantRef}`; EF §5 điều kiện writable takeover; Run amend supersession standalone. Ranh giới đúng: takeover ≠ actor replacement ≠ transfer. Nhưng phần **writable** takeover hiện chưa chứng minh được vì `workspaceGrantRef` không có issuer (B02) và herdr chỉ chứng minh `resource-only` (RH:154-155, Visibility:64); RH:233 đã thành thật "S2 cannot ship automatic writable takeover solely on pane-close proof". Kết luận: within-cell takeover **read-only/isolated** thiết kế đủ; **writable** cần B02+B03.

**A2.** Owner rõ ở RRD §2 bảng identity. Không chỗ nào biến cell thành core entity: `workUnits[]` là correlation session-owned, core "never treats it as authorization or quorum" (RRD:52-53). Không ép một cell = một session: cho phép n cell ↔ 1 session và 1 cell ↔ n session (RRD:43-45), `chain` không chọn newest active làm authority duy nhất (RRD:56-57). `chain.mjs` hiện suy từ tên (25-53) — thiết kế gọi đúng là legacy-derived. Thiếu: "tracking adapter" chưa có owner (W08).

**A3.** Không có component thừa ở tầng lớn: hai port + guard, planner thuần, resolver thuần, dùng lại engine/store/compiler/confinement. Trách nhiệm chưa có owner: (i) workspace ownership (B02); (ii) cumulative-lineage evaluation (B03); (iii) tracking adapter (W08). Admission: Run repository, đủ. Effect reconciliation: một adapter operation với hai method (`capture`/`validateMaterial` ở RH, `assess` ở EF) — nhất quán với node O trong §3. Acceptance: consuming track, đúng. Session continuation: engine/store doors, đúng. `FailureObservationV1` là versioned contract cho dữ liệu in-process (I02).

### B. Run admission, takeover, RunHandle

**B1.** Ngăn được hai caller admit hai Run: `admitRun` dưới Assignment serialization, scan committed admissions, dedup theo `admissionKey`, CAS `expectedCurrentRunId`, publish atomic trước launch (Run:149-158). Session: retryId sinh dưới session lock; `recordRunRetry` hiện đã resume pending declaration (store:2051-2056) nên hai caller cùng retryId → cùng admissionKey → already-admitted. Standalone: initial key từ Assignment identity. Attempt allocation hiện là scan thư mục + `mkdirSync` (assignment-runner:810-827) — amend nói đúng "directory presence alone is not admission" và "staging directory is not guessed to be a dispatched Run". Thiết kế đủ; chưa implement. Lưu ý: `dispatch.claim`/`retry-N.claim` hiện fail-closed cần xóa tay (engine:394-397, 4440-4443) — X07 đòi "no manual claim-file deletion", đúng hướng thay thế.

**B2.** `run-retried` schema-2 có `retryId`, `previousRunId` bắt buộc, `nextRunId`, `nextAttempt`, `admissionPayloadDigest` (Run:160-163). Late result không giành lại được: publish đòi exact runId eligibility; pending retry fence previous Run tại declaration; replay validate exact destination (Run:197-212). Đóng đúng R01: code hiện chỉ kiểm "có run-retried sau link gần nhất" (store:1977-1982) và đếm (replay:609-621), không kiểm runId đích — amend nói thật điều này (Run:106-109).

**B3.** Đủ để ngăn controller cũ **nếu** holder process đã chết: generation records immutable, token-specific release, không unlink/overwrite generation cũ (RRD:145-153), no TTL-only reclaim của process sống (RRD:140-141), pending command reconcile trước mutation mới (RH:136-142). Cách chọn "không steal process sống" là đúng với quyết định 2 và loại bỏ kịch bản A pause → B steal → A resume send. Cái giá: process sống mà task chết không bao giờ reclaim (W02). Repo hiện ngược lại: `main-checkout-lock.mjs:276-280` reclaim pid sống hết TTL (test :458-467 chứng minh) — RRD:160 đã nói rõ đây không phải claim helper hiện có đã làm.

**B4.** Bảng crash window (Run:187-195) + RH §4 guard sequence + CP §2 normalized-but-unlinked phủ đủ: admitted/no-launch → resume; pending launch/locator absent → reconcile by runId; launched-before-bound → reconcileLaunch; bound/delivery unknown → reconcile command, no blind resend; result-no-link → publish if eligible; normalize-before-link → C-f. Không chỗ nào cần worker checkpoint. Hai điểm thực tế: herdr chưa có `commandId`/`reconcileCommand` (W03) và chưa mang runId trong resource (B04) — RH:144-148 đã nói adapter không có cả hai thì không được advertise takeover, nên contract đúng, chỉ S2 exit evidence đang hứa quá.

**B5.** RH §1 tách execution/attachment/observation/delivery/pause/controller, `ObservationV1` có liveness riêng khỏi agentState (đóng R11). Bảng transition §2 nhỏ, không state machine thừa; "terminated" là resource fact, không phải success. `delivery` trên handle mirror Run — thừa có chủ đích, đã khai. `role` và `controller` hơi trùng nhưng `controller` là projection diagnostic (RH:26).

**B6.** Chứng minh được **khi** adapter báo coverage `worker-tree`/`write-access-revoked`; `resource-only` bị loại (RH:150-156, EF:155-158). Herdr: `paneProcessInfo` chỉ thấy foreground, setsid descendant sống sót — chưa chứng minh được. bwrap v1 driver ghi rõ "does not claim process isolation... runs in host process namespace unless unshared" (`bwrap.mjs:207`) → confinement hiện cũng không cấp worker-tree coverage. Vậy writable takeover là **chưa implemented ở cả hai adapter**, không phải architecturally impossible; thiết kế đúng khi nói S2 không ship nó.

### C. Recovery material và checkpoint

**C1.** Đủ: `level`, `artifacts[].attribution observed|verified`, `verification[].testedSnapshotDigest` (stale giữ nhãn stale), `capture.coverage/omissions`, `notes` untrusted, "Material is evidence input, not acceptance" (RH:203-206). Chỗ hở là phía tiêu thụ: evaluator chưa biết đọc `inherited` (B03).

**C2.** Base revision (`base` refs+digest), diff (workspace manifest: tracked/staged/untracked/deletions/modes, RH:187-189), verification snapshot, external effects (`effects` refs operation-specific), quiescence (`writerQuiescence`), omissions, provenance (`sourceRunIds`, `originRunId`). Đúng. `materialId` có loại timestamp không chưa nói (I03).

**C3.** Rõ: capture partial/invalid khi có writer lạ; missing capture → baseline chỉ khi effect policy + workspace handling cho phép, không bao giờ discard user edits (RH:204-206); worker chết trước note → notes absence allowed.

**C4.** Đúng chỗ: `checkpoint {adapter, version, payloadRef, inputDigest}` chỉ ở level `declared-checkpoint`, `validateMaterial` do operation adapter; runtime generic không diễn giải (RH:183-186, RRD:118). Không rò.

### D. Fallback, effect, budget

**D1.** Là consumer: ladder giữ nguyên thứ tự (EF §2 khớp `liveness.mjs:162-206`, probe xác nhận ceiling thắng idle/quota); matrix mở rộng "runtime-facing pure entry", giữ `resolveAction(errorClass, claimAttempt)` cho Work runner (EF:66-69). Không taxonomy thứ hai. Nhưng mapping `blocked`/`paused-limit → park` là **thay đổi** production hiện hành, chưa được gọi tên (W01).

**D2.** Mapping nhất quán trong EF §3: creation-failure-before-delivery → spawn-fail + eligibility; ceiling/idle → worker-timeout, không phải died; died → spawn-fail coarse + giữ outcome gốc + gate quiescence; paused/blocked → park; unknown delivery → reconcile/park; config/confinement → refuse, không đổi candidate; semantic reject → không fallback; unmapped → halt; dispatch-in-flight → wait không tốn attempt. Đóng đúng R08 (P08 ceiling có ~800 dòng).

**D3.** Phân biệt đúng: A = committed admissions per Assignment; E(e) per executor; R = A−1; Session `maxRetries` = `1 + maxRetries` total; claim-scoped `resolveAction` giữ nguyên; "stricter wins" (EF:93-119). Với default engine `DEFAULT_MAX_RETRIES=2` → 3 total vs runtime 2 → 2. Chưa nói declaration aborted có đếm vào Session count không (I07).

**D4.** Đủ: repeat mode declared (before-delivery-only/read-only/idempotent/dedup-keyed/never), evidence từng mode, effect identity ổn định qua attempt, destination revalidate, `effectsObserved: false` không phải no-effect (EF:130-153). Thiếu derivation cho coding read-only op (W09).

**D5.** Giữ constraints "then calls the existing compiler" (EF:184-186) — nhưng compiler hiện refuse mismatch (W06). Confinement vẫn gate cuối (EF:188).

### E. Continuation giữa session/protocol

**E1.** Hướng đúng (evaluator trước, planner thuần, CP:26-29) nhưng "existing evaluator" cho `legalNext` chưa tồn tại dạng read (W07). `completion` dùng `classifySessionQuorum` — có thật (engine:3414).

**E2.** Đủ: `dispatch-authorized {bindingId, authorizationId, taskKey, inputRevision}`, `request-authorization` cần driver, `continue-session {transfer offer, grantRef, expected parent revision}` (CP:92-101). Agent không dựng taskKey — đóng đúng C-c vì remedy hiện là "pass an explicit, distinct taskKey" (engine:2540).

**E3.** Canonical JSON sorted keys, SHA-256, loại timestamp/enumeration order (CP:124-128); action keys theo semantic tuple; "lookup already-completed before stale-plan"; same key/different payload refuse; pending resume (CP:137-139). Hai caller → một child, một grant: prepared event dưới parent lock + generation + grantId single-use (CP:192-204, 216-236). Đủ cho C-g. Không applied-action DB generic — dùng dedup của từng cửa hiện có (task claim, authorization, transfer events). Đúng.

**E4.** Đủ: prerequisites refs (không expression), destination `{definitionId, version, digest, entry: graph-entry, requestTemplateRef}`, inputs slots, allowedTrigger, validator reject arbitrary node (CP:151-166). Không nhảy giữa graph. `digest` cần loader content-pin chưa có (I05). Flow:618-627 tuyên bố PROPOSED rõ; validator hiện reject unknown field (`schema.mjs:186`) nên field mới không thể lọt ngầm.

**E5.** `prepared → gated child → committed/aborted`: freeze parent admission cho scope tại prepared, launch reserved trước đó block prepare, child gate đọc parent commit, late result thu thập qua per-Run store, history giữ (CP:216-243). Đúng. Prepared "irrevocable by timeout alone" — chỉ abort tường minh. Mâu thuẫn với X08 ở parent terminal (B01).

**E6.** Không kế thừa: authorization/quorum/cancellation/budget đều fresh; grant do caller validated dưới driver trust boundary tại prepare (CP:197-204); cancellation descendant phải nêu scope (CP:245-249). Fresh authority cấp ở step 2 (prepare, grant) + step 3 (child manifest với `originTransfer`). Child `writerId` chưa nói (I06).

**E7.** Typed: agent-led `definition: null` không phải schema error, protocol continuation → `transfer-unavailable` (CP:81-83); protocol không profile → behaves as before (CP:177); drift → refuse trước commit, không resolver fallback (CP:271); parent terminal → mâu thuẫn (B01).

### F. Hexagonal, SRP, ergonomics

**F1.** Domain không biết CLI/path/herdr/PID: locator opaque adapter-validated (RH:27), holder identity là infra của lock repository, `runDir/run-handle.json` ở §6 persistence profile, CLI prefix ở boundary. Sạch.

**F2.** Planner thuần thật (CP:29). Adapter không quyết policy: request builder "presentation/serialization only"; guard verify authority nhưng không chọn policy. EF resolver "advice, not permission token" (EF:186).

**F3.** `RunHandleRepository` gộp CRUD + control lock + pending-command ledger — ba concern persistence của cùng envelope per-Run, không có policy; chấp nhận được (second opinion đã đồng ý). `RuntimeAdapterPort` 8 method nhưng một adapter, cohesive.

**F4.** Một boundary: recover là request variant của `coordination run`; `show` read-only không refresh (RH:229); headless gọi cùng use case (headless-adapter:25-27 đã đúng). Thiếu spec tương tác recover với close-after-steps (W04).

**F5.** Agent chỉ cần `{coordinationId, writerId, intent: recover}` — tốt. Nhưng `writerId` là hidden memory (W05). Gọi lại sau timeout an toàn: "recomputes facts and resumes a durable pending action" (RRD:177-178), không dùng child ID/task key/supersession boolean do worker cung cấp.

**F6.** Có: RH error `{code, retry: never|reconcile|later}`; EF remedy union; CP hazards typed; Run refusal reasons typed với subject refs. `reasonCode` nên bắt buộc (I01).

### G. Migration và chứng minh

**G1.** Có: RRD §8, Run:224-225, S1 "Node first". Legacy profile rõ: schema-1 giữ engine path, legacy Runs giữ profile cũ. `assertSchemaVersionCurrent` hiện refuse mọi mismatch (schema:857-864) → cần chấp nhận tập version hỗ trợ, single-write per session — khả thi, chưa nói tường minh.

**G2.** Không dual writer, không silent reinterpretation, không migration-on-read (RRD:184-199, Run:219-223). Rust route về owner hoặc `owner-runtime-unavailable` — khớp AGENTS.md (Rust host exec Node payload cho legacy selector là route về owner). Đúng.

**G3.** S1→S2→S3 hợp lý; S4 độc lập được ở phần planner nhưng cần W07; S5 cần tsk-5qj/tsk-40j/tsk-296/tsk-1zu — cả bốn hiện `todo/discovery` (kiểm `fgos show`), tsk-371 `awaiting-approval`; B01/I05/W05 thêm vào. S2 tuyên bố quá sớm ở "partial-edit takeover through public door" (B02, B03, B04). S3 tuyên bố "same Assignment, bounded attempts" đúng nhưng chỉ có case thật khi W09 được khai.

**G4.** Xem §5 dưới. Proof đo intervention: X11 đếm intervention và blocked-progress; F-b/F-f đếm spawn/resource. Đủ hai chiều.

**G5.** Có ba lớp: S0 freeze suites, CP:177 "protocol with no continuation profile behaves exactly as before", X10 nửa sau "unchanged schema-1 requests retain behavior". Chưa có proof riêng "non-continuation flow sau S1-S3" ngoài S0 exit; đủ nếu S0 là gate của mọi slice sau.

## 3. Affected Components

| Component | Loại | Ghi chú |
|---|---|---|
| `assignment-runner.mjs` (Run writer v2, admission, attempt) | changed | S1 |
| lock module mới theo §6 (generation dir) | changed/new | S1; thay `wx`+unlink pattern cho scope Run/Assignment |
| `store.mjs`/`replay.mjs`/`session-engine.mjs` (schema 2, retry fields, transfer events, workUnits) | changed | S1 (retry identity), S5 |
| `run.mjs` (recover intent), `show.mjs` (recommendation), `chain.mjs` (workUnits read model) | changed | S4/S5; W04 |
| `definitions/schema.mjs` + protocol loader (continuation profile, content digest) | changed | S5; I05 |
| `recovery.mjs` (runtime-facing entry), `assignment-policy.mjs`/`plan.mjs` (fallback provenance) | changed | S3; W06 |
| `herdr-round.mjs`/`herdr-agent.mjs` (launch identity, reconcileLaunch, commandId, capability advertise) | changed | S2; B04, W03 |
| `visibility-session.mjs` | changed → one-way projection | S2 |
| Run Result Evaluator (`classifyRunEvidence`) | changed | S2; B03 — **chưa có trong doc** |
| `confinement/authority.mjs` (workspace grant, coverage) | changed | S2; B02 |
| `setup/checks.mjs` doctor/setup registrations | changed | S1/S2 |
| `liveness.mjs` ladder | read-only dependency | ported unchanged |
| `compileDispatchPlan`, confinement policies, protocol-loader discovery | read-only dependency | |
| Work state/fsm/frontier, merge/approve, work-integration, group-thinking pack, deliberation ledger, specialist slots, human-turn | unchanged | |
| `dispatch-runs/` Work-runner layout | unchanged (legacy profile) | W10 phải nói rõ |

## 4. Decision Audit (chín hướng đã chốt)

| # | Hướng | Kết luận | Bằng chứng |
|---|---|---|---|
| 1 | Run là admission; không thành phần thứ tư | compliant | RRD:11-12, §3 bảng; `admitRun` là operation của Run repository (Run:149-152); RunHandle/planner/fallback không admit (RH:17, CP:12, EF:24) |
| 2 | Lease/fencing + incarnation bắt buộc; không TTL-only takeover | compliant, một gap runtime dài hạn | RRD:140-153; RH:158-163 incarnation per adapter; W02 |
| 3 | Ladder classifier duy nhất; matrix nền; fallbackExecutors qua compiler | partially compliant | EF §2 port đúng; EF §3 đổi mapping blocked/paused chưa gọi tên (W01); compiler hiện refuse candidate (W06) |
| 4 | Không đổi authorization/partialPolicy/quorum ngoài backlog fix | partially compliant | CP:177-180 đúng; C-a/C-b phụ thuộc tsk-296/tsk-5qj (todo); CP §6 post-terminal bookkeeping chạm replay/terminal semantics (B01) |
| 5 | Health store/cooldown/scoring/effect ledger defer | compliant | EF:110, 153, 209-211; RRD:277-280 |
| 6 | Runtime spawn sở hữu state; reader refuse; không dual writer | compliant | RRD:193-199; RH:25, 227-229; Run:219-225 |
| 7 | Node amend trước Rust writer | compliant | RRD:198-199, S1/S7; Run:224-225; CP:297 |
| 8 | Cell không mặc nhiên core, không 1:1 session | compliant | RRD:43-59 workUnits; chain legacy-derived; W08 nhỏ |
| 9 | Handoff tại điểm hợp lệ; crash takeover không cần checkpoint; partial = recovery input | compliant | RRD §5; RH:167-169; CP:20-24; EF:155 |

## 5. Proof Audit

| ID | Một scenario? | Falsify được bug? | Ghi chú |
|---|---|---|---|
| F-a | có | có | fake adapter với locator tái dùng; đủ |
| F-b | có | có | đo spawn count; cần B04 để "finds live worker" bằng runId khi locator chưa persist |
| F-c | có | có | freshness đổi, execution không |
| F-d | có | có | nên gồm cả nhánh retryAfter absent (E-c phủ) |
| F-e | **mơ hồ** | một phần | phải chốt worker sống hay chết: capture chỉ hợp lệ sau quiescence; worker sống → capture partial, không "preserve capture" |
| F-f | có | có | inject crash từng cửa sổ; đếm resource; cần B04 để đếm được duplicate pane |
| F-g | có | có | |
| C-a | có | có, **phụ thuộc tsk-296 (todo)** | là engine fix, không phải proof của design này |
| C-b | có | có, **phụ thuộc tsk-5qj (todo)** | đúng intent BL1, đã sửa R10 |
| C-c | có | có | khớp refusal engine:2537-2541; đã sửa R10 |
| C-d | có | có | "unreleased" = chưa qua visibility window/grant; nói rõ |
| C-e | có | có | khớp `retrySessionTask` self-heal trước wall check (engine:4397-4416) |
| C-f | có | có | normalized-unlinked + receipt-only |
| C-g | có | có | |
| E-a | có | **chỉ khi W09** | với coding mutating op không declared mode → luôn park, nhánh fallback không được exercise; chọn read-only op (đúng P08 red-team) |
| E-b | có | có | đã sửa R07 |
| E-c | có | có | probe: ladder trả screenLine, không retryAfter — khớp |
| E-d | có | có | |
| E-e | có | có | |
| E-f | có | có | table-driven ba domain |
| X01 | có | có | cần SIGSTOP child process thật |
| X02 | **sai định nghĩa** | chưa | "no duplicate input" mâu thuẫn resend-until-ack hiện có (W03) |
| X03 | có | có | |
| X04 | có | có | |
| X05 | có | **chưa** ở profile writable-same-workspace | evaluator không có owner (B03); pass được ở profile isolated-workspace vì inherited work là input, không phải delta |
| X06 | ba cửa sổ một hàng | có nếu table-driven | chấp nhận |
| X07 | có | có | falsify đúng posture fail-closed xóa tay hiện tại |
| X08 | có | **sai outcome so với CP §6** | B01; nếu chọn hai lớp event, X08 phải nói rõ nó falsify lớp authority |
| X09 | có | có | cần workUnits schema |
| X10 | hai scenario | có | tách "unknown version refuse" và "schema-1 unchanged" |
| X11 | có | có | cần W05 để fresh agent không phải tự biết writerId |

## 6. Feasibility

**Ship được ở S0–S1 (Node, ngay):** freeze fixtures; Run v2 record + `admitRun` + exact retry identity (`retryId/previousRunId/nextRunId/digest`) + lock-dir generation; strict result fencing ở `linkResult`/replay (thay đếm bằng runId đích). Tất cả trong `assignment-runner`/`store`/`replay` + module lock mới. Cần doctor probe hard-link/fsync.

**S2 ship được một phần:** reattach/observe/inspect (herdr có `agentGet`, `paneProcessInfo`), pending-launch reconcile **sau khi** B04 (gateway-side lookup theo launch identity), capture material cho worker đã chết với coverage `resource-only` gắn nhãn partial, replacement read-only hoặc writable trong workspace isolated mới (evaluator hiện tại đủ). **Không** ship writable takeover trên cùng workspace (B02, B03, bwrap:207, Visibility:64) — đúng như RH:233 đã nói; exit evidence S2 "partial-edit takeover through public door" hạ xuống "read-only/isolated takeover; same-workspace writable = park with `writer-not-quiescent`". B02–B04 là dependency của profile đó, không phải bằng chứng cần thiết kế lại.

**S3 ship được:** fallback pre-delivery (launch-failed proven) và read-only op (W09) qua compiler sau W06. Mutating op sau delivery → park, đúng thiết kế.

**S4:** planner + `show` deterministic sau khi extract read evaluator (W07); không claim repair.

**S5 bị chặn bởi:** tsk-5qj, tsk-40j, tsk-296, tsk-1zu (todo/discovery), B01, I05 (loader digest), W04, W05, schema-2 + continuation profile validator. Không blocker kiến trúc, đều là "chưa implement/chưa chốt".

**Phải chờ Rust:** S7 toàn bộ; W02 (holder semantics cho host dài hạn) nên chốt trước S7 vì Rust gateway là nơi gap này thành thật. Không có gì trong thiết kế bắt buộc Rust để chứng minh semantics — đúng hướng Node first.

## 7. Agent-Harness Assessment

Fresh agent vận hành được với `{coordinationId, writerId, intent: recover}` + đọc outcome typed — **trừ** `writerId` (W05). Runtime phải tự derive/validate: action eligibility từ facts; `admissionKey`/`retryId`/`nextRunId`; `taskKey` identity-derived cho dispatch-authorized/recheck (C-c); transfer ID/child ID/generation; grant single-use; import manifest; canonical hash/dedup; stale-plan lookup; pending command reconcile; incarnation check; quiescence coverage; version/owner-runtime refuse; `needs-input` chỉ khi thiếu quyết định semantic thật (RRD:179-180). Gọi lại sau timeout an toàn theo RRD:177. Refusal có code + remedy (F6). Chỗ còn bắt agent nhớ: writerId (W05), và nếu W04 không chốt thì agent phải biết "đừng gọi recover khi partialPolicy có thể auto-close".

## 8. Phản biện vòng hai và điều chỉnh

Phản biện nhận 2026-09-11 22:50. Xử lý theo quy tắc: giữ finding khi bằng chứng code đứng vững, đổi severity/recommendation khi phản biện thêm ngữ cảnh đúng.

| Điểm phản biện | Xử lý | Căn cứ |
|---|---|---|
| Giữ B01–B04 là gap thật | giữ | không tranh cãi |
| B02 là blocker của S2 writable scope, không phải toàn design | chấp nhận (report đã scope, verdict line viết lại) | RH:233 tự nói S2 không ship writable trên pane-close |
| B03 không cần sửa evaluator ngay; chỉ cần khi writable same-workspace hoặc acceptance trên inherited edits | chấp nhận, hạ thành dependency profile; giữ blocking cho X05 | EF:158-159 cho phép isolated workspace + snapshot read-only; delta của replacement đo được bằng evaluator hiện tại |
| B04: deterministic name prescriptive; primitive đúng là durable launch record + gateway lookup theo runId | chấp nhận, sửa recommendation; giữ blocking | `herdr-agent.mjs:292` chỉ có lookup theo tên → tên deterministic là strategy duy nhất hiện có, không phải primitive |
| X08 tách authority event vs audit projection | chấp nhận làm phương án (b) của B01 | contract chưa phân biệt hai lớp → vẫn cần sửa doc |
| W01 là behavior change, không phải lỗi | chấp nhận wording; giữ fact | `loop.mjs` không xử lý `blocked`, matrix hiện retry một lần |
| W03 chỉ cần đổi định nghĩa proof | chấp nhận | |
| W05 là policy chưa chốt, không mặc định cấp raw writerId | chấp nhận; X11 chờ policy | |
| W06/W07/W09 là implementation dependency | chấp nhận, gắn nhãn | |
| Verdict nên là "hướng ổn, design chưa đủ evidence cho writable takeover + full continuation" | chấp nhận nội dung; giữ token `Chưa ổn` vì thang ba giá trị và B01 là mâu thuẫn contract phải sửa doc trước implementation planning | |
| Vòng ba/bốn: "lý do blocking duy nhất còn lại là B01" | **rút lại nhượng bộ.** B04 vẫn chặn S2 với mọi profile: F-b (coordinator chết sau bind, phải tìm lại worker sống) và F-f (duplicate spawn qua crash trước locator) là bug lõi, không phụ thuộc writability; S2 read-only takeover mà không reconcile được orphan thì spawn thứ hai vẫn xảy ra. | `herdr-round.mjs:654` tên agent không mang runId; `herdr-agent.mjs:292` chỉ lookup theo tên; race 3-way fanout đã xảy ra live |
| Gate 3: operation contract phải khai provider là infrastructure; telemetry cần dedup identity | **bác một phần.** Provider là thuộc tính executor (`providerModel`), derive từ DispatchPlan, không bắt từng operation khai lại. Telemetry chỉ cần khai duplicable; dedup chỉ cho sink đổi outcome. | dispatch-control-plane §PolicyPatch merge rules; không hàng proof nào trong 20 bug đòi idempotency key cho log sink |
| Gate 4: snapshot operator config version/digest vào `driver-replaced` để replay cùng verdict | **bác.** Replay hiện không consult config ở bất kỳ door nào; invariant đúng là "replay không đọc config", digest là diagnostic tùy chọn. | mẫu `assertDriverIdentity` (write door) vs replay (shape/identity/ordering), Session T8 |

## 9. Decision Gates (vòng ba — hội tụ kiến trúc, còn lựa chọn profile/policy)

Hai bên thống nhất: hướng hexagonal/SRP đúng, không làm lại Agent Coordination; B01 sửa trước implementation planning; B02–B04 là gap của profile S2 writable/launch-reconcile; S2 ship read-only/isolated takeover trước; W01/W03/W05 là behavior/proof/policy dependency; W06/W07/W09 là implementation dependency. Năm điểm dưới là decision gate khóa profile và acceptance criteria, không còn là tranh luận hình dạng. Phía phản biện đề xuất conservative cho cả năm; ý kiến của reviewer từng gate:

Mỗi gate dưới là **policy choice hoặc adapter strategy, chưa phải điều đã chứng minh**; cột acceptance là điều kiện để chọn phương án đó mà không tự biến nó thành authority trá hình. (Sửa sau phản biện vòng ba, 23:03.)

| # | Gate | Phương án conservative | Reviewer khuyến nghị | Acceptance criteria bắt buộc | Căn cứ / chi phí |
|---|---|---|---|---|---|
| 1 | Parent terminal có cho audit-only bookkeeping hậu terminal không | Không; terminal parent refuse transfer (X08), xóa CP:253-256 | Chọn conservative, nhưng **ghi rõ là temporary safety profile**, không phải semantics cuối. | (a) Doc ghi refusal là profile tạm, gắn với tsk-5qj mở. (b) Proof sau khi tsk-5qj đóng là **bắt buộc**: chạy lại kịch bản BL1 (partial-close sớm) và xác nhận không còn session nào bị dead-end vì refusal; nếu còn, mở lại gate. (c) Cho tới đó, refusal trả `transfer-unavailable` kèm remedy "open fresh session" (đường P01.1 đã dùng), không phải refuse câm. (d) Remedy không được trở thành workaround mặc định che lỗi partial-close: mỗi lần trả remedy này phải ghi hazard `partial-policy-missing`/`premature-close` vào outcome và đếm được trong X11 (intervention count), để lỗi gốc vẫn hiện, không bị nuốt. | Refuse không chữa nguyên nhân BL1; khi tsk-5qj chưa đóng, một parent còn cứu được có thể thành dead-end. Giữ Recovery Rule #5 nguyên. |
| 2 | Launch identity: gateway registry/idempotency record hay deterministic Herdr name | Registry keyed by runId | Contract = gateway-side lookup theo launch identity + durable launch record. Tên deterministic từ runId là **workaround Node-first, chỉ là lookup aid**; ownership/incarnation vẫn do `agentSession` + incarnation check quyết (RH:160-162: `agent_session` là correlation, không phải proof). | Tên không bao giờ được dùng làm authority. Test bắt buộc: (a) name collision giữa retry của cùng Assignment (attempt khác nhau → tên khác; resume cùng attempt → cùng tên phải resolve đúng orphan hoặc refuse ambiguous); (b) resource cũ còn sống sau gateway restart, **kể cả khi gateway cấp `agentSession` mới cho cùng pane/agent**: inspect phải trả incarnation `mismatch`/`unknown` → outcome `unknown` (park, không destructive control, **không launch lại**), không bao giờ `absent-proven`; nếu không, resource cũ bị nhầm là orphan và bị duplicate; (c) cùng runId nhưng khác adapter incarnation → refuse destructive control; (d) crash giữa `paneSplit` và locator persistence → reconcile tìm được hoặc trả unknown, không bao giờ launch thứ hai; (e) herdr không resurrect tên đã close. | Client herdr chỉ có `agentGet(name)` (`herdr-agent.mjs:292`); registry keyed by runId là thay đổi gateway Rust, lệch "Node first". Chi phí: đổi `herdr-round.mjs:654` + năm test trên. |
| 3 | Có suy repeat mode `read-only` từ `Assignment.mutation` không | Không suy; khai tường minh | Không suy. Khai `repeatMode: read-only` trên operation review/red-team của protocol core **chỉ là claim**; `EffectGuaranteePort.assess` phải xác minh effect boundary trước khi trả `eligible`. | Định nghĩa read-only effect boundary tường minh, vì `networkEgress: deny` toàn bộ sẽ giết chính worker LLM (cần gọi model provider): **read-only = `filtered` với allowlist ⊆ {model-provider endpoints của executor} ∪ {sink được operation khai là `effect: none` (telemetry)}**; mọi sink ghi (GitHub, API nghiệp vụ) nằm ngoài allowlist. `repeatMode: read-only` được honor chỉ khi: (a) confinement attestation của Run nguồn ghi `networkEgress: deny`, hoặc `filtered` với `networkFilter` thỏa định nghĩa trên (đối chiếu allowlist với danh sách provider/telemetry khai trong operation contract); hoặc (b) operation-specific external-effect proof do adapter cung cấp. Thiếu cả hai → `reconcile`/`unknown`, không fallback. Hai ràng buộc thêm, đặt đúng tầng: (c) provider call là external effect về kỹ thuật, nhưng nó là thuộc tính của **executor**, không phải của operation: `runner.executors.<id>.providerModel` đã là nguồn provider family (dispatch-control-plane §PolicyPatch "provider family derives from the selected registered executor"), nên allowlist provider derive từ executor được chọn trong DispatchPlan; operation contract chỉ khai **thêm** sink ngoài provider. Không bắt mỗi operation khai lại "provider là infrastructure". (d) Telemetry sink: chỉ cần operation khai sink đó là **duplicable (at-least-once chấp nhận được, không đổi outcome)**; dedup identity (`dedup-keyed`) chỉ đòi với sink mà lặp lại làm đổi outcome. Bắt mọi log sink có idempotency key là over-engineering không có bug nào trong 20 hàng proof yêu cầu. Test: op khai read-only nhưng attestation `allow` → park; `filtered` có sink ghi ngoài khai báo → park; `filtered` với allowlist = provider của executor + sink duplicable đã khai → eligible; `filtered` có sink không duplicable và không dedup-keyed → park. | `mutation: read-only` chỉ chứng minh không có repo delta (`rollbackReadOnlyMutations`, assignment-runner:279); default `networkEgress: allow` (policies.mjs:30,47). Khớp EF:138-139 "adapter verifies facts appropriate to that mode". |
| 4 | Driver mất thì cấp replacement grant thế nào | Door driver-replacement có bookkeeping, không cấp raw writerId | Door `driver-replaced` theo mẫu `actor-replaced`, nhưng "có door" chưa phải an toàn — phải chốt ai/khi nào/phạm vi. | (a) Ai: chỉ operator/human, chứng minh bằng ref tới `human-turn-recorded` (door provenance người thật đã có, Session §Human Turn Provenance); human-turn chỉ chứng minh **provenance của quyết định**, chưa chứng minh **caller hiện tại được quyền** — nên thêm current-caller authorization: `authorizedBy` phải là identity operator được cấu hình (trusted CLI/project config, cùng trust boundary với `.fgos/config.json`), và turn phải thuộc đúng session, ghi trước replacement. (b) Chống replay: một `human-turn:` ref chỉ được tiêu thụ bởi đúng một `driver-replaced` (single-use, kiểm ở write door và replay, cùng mẫu `invocationKey`); turn cũ hơn replacement trước không được dùng lại. (c) Provenance: event `{oldWriterId, newWriterId, reason, authorizedBy, humanTurnRef}`; `provenanceRoot` gốc bất biến, replacement là chain. Invariant đúng là **replay không bao giờ consult operator config** — cùng mẫu mọi door hiện có: `assertDriverIdentity` kiểm ở write door, replay chỉ kiểm shape/identity/ordering/single-use (Session §Human Turn Provenance T8). Config đổi sau đó thì replay vẫn cùng verdict *vì* nó không đọc config, không cần snapshot digest vào event; digest chỉ là diagnostic tùy chọn, không phải điều kiện replay (YAGNI). (d) Phạm vi first profile: replacement chỉ được `recover/observe/collect/close`; `authorize`/`disposition`/`continue-session` cần re-authorization tường minh. (e) Test: không human ref → refuse; human ref đã tiêu thụ → refuse; caller không phải operator cấu hình → refuse; replacement gọi authorize → refuse; replay sau crash giữa hai bước không tạo hai replacement. | Cùng privilege level (T6): đây là audit trail, nhưng door không giới hạn phạm vi sẽ là đường nâng quyền. |
| 5 | Host dài hạn có operator force-release lock không | Không force-release; kill process | Conservative cho Node/R1–R2. Release marker trong `finally` là **evidence, không phải invariant**. | (a) Reclaim chỉ khi process identity `{hostId,bootId,pid,startTime}` được chứng minh chết; thiếu marker không bao giờ được đọc là holder đã chết. (b) "Heartbeat hết hạn" phải là **failure detector có fencing**, không phải TTL-only steal: hết hạn chỉ cho phép contender *thử* publish generation g+1, và việc đó chỉ hợp lệ khi (i) holder cũ chứng minh chết, **hoặc** (ii) cửa control của repository/adapter enforce token/generation để mọi lệnh của holder cũ với token stale bị refuse (`control-held`/`incarnation-mismatch`) — herdr hiện không enforce token phía effect, nên trong first profile heartbeat hết hạn + pid sống = vẫn `HELD`, không steal — và phải trả outcome typed **`controller-live-unreclaimable`** (holder identity, lock age, heartbeat age, remedy `await-driver-input`/kill-process) kèm tiến độ "blocked independent work" theo RRD §7 (target này bị chặn, target khác vẫn tiến), `nextCheckAt` rõ hoặc null, để harness không retry vô hạn. (c) Marker chỉ rút ngắn đường vui; SIGKILL/host crash/fs lỗi là kịch bản test bắt buộc (X01 mở rộng: holder SIGKILL không marker → reclaim theo pid-dead; holder SIGSTOP → không reclaim). (d) Force-release door có attestation là quyết định của R3, không chốt ở đây. | Gap chỉ thật khi controller là process dài hạn (gateway R3/Rust host). Khớp RRD:140-144 "Unknown liveness is not dead". |

Kết luận vòng ba: reviewer đúng về scope và severity; các gate trên được diễn đạt lại như policy choice có acceptance criteria, không phải điều đã chứng minh. Gate 2, 3, 4 và lock marker là chỗ dễ biến workaround thành authority trá hình nếu thiếu cột acceptance.

**Phạm vi chặn của B01:** B01 chặn **S5** (continuation/terminal bookkeeping), không chặn S0–S4. Profile đầu tiên có thể chốt "terminal transfer refuse" và design tổng thể tiếp tục plan S0–S4 song song với việc sửa CP §6.

Status: DONE_WITH_CONCERNS — hướng kiến trúc và chín hướng chốt đứng vững; S0–S1 và S4 lập kế hoạch được ngay; B04 chặn S2 với mọi profile, B01 chặn S5; S2 thu hẹp xuống read-only/isolated takeover; B02/B03 là dependency của profile writable; năm decision gate ở §9 phải được khóa cùng acceptance criteria trước khi profile tương ứng được advertise.
