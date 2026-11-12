# Bài học từ engine Coordination đã thu hồi, cho hợp đồng Execution <-> Workflow

Ngày 2026-11-09. Chỉ đọc, không sửa file tracked. Ký hiệu: **[V]** = đã đọc, có path/commit; **[I]** = suy luận của tôi; **[?]** = không tìm thấy / chưa kiểm.
Phân loại bảo đảm: **(a)** còn và có kiểm tra máy; **(b)** còn nhưng chỉ bằng quy ước; **(c)** bỏ.

## 0. Tóm tắt 8 dòng

1. Engine bị thu hồi ở `2180b4e72701bb090288af8fe8021008d9d42079` (2026-10-02): 186 file, +489/-79 186 dòng [V `git show --stat`]. Nó không vô nghĩa, nhưng nó gộp hai tầng (làm một Unit / tuần tự nhiều bước) vào một cơ chế.
2. Phần "nền" sống sót và được tái dùng: `executeAssignment`, admission Run, RunResult, `distinctProviderFrom`, governance [V synthesis §7c].
3. Biên Workflow -> Execution hôm nay đã có một port (`case-admission-port.mjs`, Execution sở hữu, Workflow cài) và một guard import một chiều (A4). Nhưng **không có phiên bản, không có kiểu cho payload, và Workflow vẫn tự phân loại outcome của Execution** (mục B2).
4. Có 5 kiểu đánh phiên bản khác nhau trong cùng biên (mục B2.3). Bài học số 1 của engine cũ: hợp đồng mở rộng bằng "thêm event kind" mà không có phiên bản (16 kind trong một contract).
5. Còn **mã chết của engine** trong dispatch: `caller.coordination.fanOutPayload/actionInvocation` và đọc `.fgos/coordination/sessions` (mục B2.8). Tiêu chí P4 không bắt được chúng.
6. Các bảo đảm engine có mà giờ **bỏ hẳn**: close theo quorum/`partialPolicy`, ngân sách wall-time/concurrency toàn phiên, specialist slot, human-turn ledger, tính bất biến kiểm lúc replay (mục B3).
7. Bảo đảm **mạnh hơn engine**: pin workflow theo nội dung (không chỉ id@version), ghế blind bị confinement ép thật (bwrap `hostRead: blind`).
8. Khuyến nghị cho `unit-run-result`: một chủ cho từ vựng outcome, refund là trường riêng (không ghi đè outcome), `retryable` do Execution quyết, version nằm trong payload, unknown = no-verdict (mục B5).

---

## A. Bảng ánh xạ thực thể cũ -> chủ hiện tại

Nguồn thực thể cũ: `docs/platform/agent-coordination/history/retired-engine/spec.md` (snapshot spec 2026-09-18), `contracts/coordination-session.md`, `contracts/flow-definition.md`, `contracts/assignment-run-runresult.md`; danh sách file xoá từ `git show --stat 2180b4e72`.

| Thực thể cũ | Chủ cũ + bảo đảm | Chủ hiện tại (path) | Lớp | Ghi chú / bằng chứng |
|---|---|---|---|---|
| CoordinationSession | `src/runner/coordination/{schema,store,session-engine}.mjs`. Manifest + `events.jsonl`; `assignmentRefs` là chỉ mục thành viên một chiều; `aggregateBounds` (wallTime, maxAssignments, maxConcurrency, maxRounds, maxTaskDepth); `schemaVersion` lệch thì recovery thất bại có tên (contract dòng 171, 1041) | Không còn thực thể tương đương. Hai mảnh: **Unit run** = thư mục `.fgos/assignments/unit-run-*/` với `unit.json` (`seatSchema: 2`, `unit-run-start.mjs:410`); **case** = `.fgos/workflow-runs/<id>/events.jsonl` (`src/workflow/store.mjs`) | (a) một phần, (c) phần còn lại | Schema lệch: `unit-run-start.mjs:69-75` từ chối resume `seatSchema` mới hơn [V]. Ngân sách: thay bằng khung case (`dispatches`, `mutatingDispatches`, `seatLaunchesPerDispatch`, `guide-schema.mjs:54-55`) và `timeoutMs` mỗi run; **wall-time/concurrency/maxTaskDepth toàn phiên: bỏ** [V]/[I] |
| FlowDefinition | `src/runner/definitions/schema.mjs` (1517 dòng). IR chung + profile `Workflow`/`CoordinationProtocol`; ghim `{id, version}`, *không ghim nội dung* (residual 2, contract dòng 462-470) | `src/workflow/guide-schema.mjs`, `definition.mjs`, `loader.mjs`; Pattern: `src/runner/execution/patterns/catalog.mjs` | (a) | Event `workflow.start` nhúng nguyên snapshot `workflow` vào ledger (`store.mjs:85-90`): **ghim theo nội dung**, tốt hơn engine [V]. Digest ref context: `ref-digests.mjs` |
| CoordinationProtocol / Protocol Pack | 13 YAML `core/coordination-protocols/**` + `core/protocol-packs/group-thinking.json` | `core/workflows/{architecture-advisory,architecture-advisory-reopen,business-discussion,council-lite,delphi,nominal-group,group-cognition}.yaml` + preset trong `patterns/catalog*.mjs` | (a) loader; bảo đảm riêng từng dạng: [?] | Conformance của từng workflow tôi chưa kiểm (plan P4 nói có, `phase-06...md` mục Success Criteria). Hai dạng cũ gộp (RFC, review-lite) đã thành preset |
| DispatchPlan | `dispatch/plan.mjs` dưới Dispatch authority | `src/runner/dispatch/plan.mjs` (không đổi chủ) | (a) | `docs/platform/agent-coordination/spec.md` "Core Entities" [V] |
| Assignment | `dispatch/assignment.mjs`; bất biến, provenance `declared|inline`, snapshot hợp đồng (ADR-006) | `src/runner/dispatch/assignment.mjs`, `execution-contract.mjs` | (a) | Giữ. Hợp đồng sống: `docs/platform/agent-coordination/contracts/assignment-run-runresult.md` |
| Run | admission một Run/attempt; `attempt` không reset; không 2 Run chưa settle; `runId` tất định | `src/runner/dispatch/run-admission.mjs` (`admitRunAttempt`), `assignment-runner.mjs` | (a) | Giữ phần đã code. **Chưa bao giờ code:** pha `bound`/`delivered`, "strict fencing" theo đúng Run bị thay (contract dòng 100-105) [V] |
| RunResult | `dispatch/run-result.mjs`, v2 | cùng file, **v3** (`RUN_RESULT_CONTRACT`, dòng 16); đọc v2+v3; v2 hỏng hoặc mâu thuẫn -> `contract-corrupt` fail closed | (a) | `run-result.mjs:285-286`, `:742-793`. Rust: `packages/run-result/rust/src/lib.rs` `derive_outcome` |
| replay | `coordination/replay.mjs` (858 dòng): dựng lại state, **từ chối** event sai thứ tự (vd `result-linked` thứ hai không có `run-retried` xen giữa -> `duplicate-ref`) | Case: `case-projection.mjs`/`store.mjs` (`FOLD`, một bộ đọc `readCaseProjection`); Unit run: `unit-run-history.mjs`, `unit-summary.mjs` | (a) fold; **(c) phần từ chối** | `FOLD` im lặng bỏ event của step/unit lạ (`if (!unit) return`, `store.mjs` ~dòng 290-330) [V]. Engine cũ thì từ chối. |
| recovery planner | `coordination/recovery-planner.mjs` (session) + `dispatch/recovery-planner.mjs` (standalone) | `src/runner/dispatch/recovery-planner.mjs`, `reconciliation-planner.mjs`, `src/verbs/dispatch/{recover,reconcile}.mjs`; Workflow: `case-runtime.mjs` (`releaseDeadReservations`), `store.mjs` (`recoverWorkflowLedgerTail`) | (a) [I về mức phủ test] | Bản standalone sống; bản session xoá |
| legality facts / action preconditions ("hành động nào hợp lệ lúc này") | `legality-facts.mjs` 1187 + `action-precondition.mjs` 1055 dòng, per-session | `src/workflow/case-admission.mjs` `admitProposal` (dòng 253-265): 6 guard thuần (entry, MUST rows, write scope, binding, frame, route) | (a) cho **case**; (c) cho Unit run | Mỗi Unit run không có evaluator "được làm gì tiếp"; chỉ có admission ở mức case + port |
| actions projector | `actions-projector.mjs` 544 dòng: liệt kê hành động hợp lệ cho Lead | Gần nhất: `fgos workflow status` (projection, `case-projection.mjs`) và `propose*.mjs` | (c) cho Unit run; (b) cho case | Không ai chủ "danh sách hành động kế tiếp" ngoài case |
| cohort planner | `cohort-planner.mjs` 662 dòng: cấp ghế/actor cho cohort | `src/runner/execution/seat-resolver.mjs` + `bind()` (`bind.mjs`) + `loops/{panel,debate}.mjs` | (a) [I] | Thay bằng "ghế khai trong Unit/workflow, `bind()` chọn người". Test của cohort-planner bị xoá (`2180b4e72`) |
| dag-declaration | `dag-declaration.mjs` 354 + `dag-scheduler.mjs` | `dependsOn` trong Unit (`unit.mjs` validate) và step guide (`definition.mjs`); vòng frontier `src/workflow/runner.mjs`; `ancestorsOf` trong `case-admission.mjs` | (a) [?] kiểm chu trình chưa đọc | Một sequencer (quyết định Q-C) |
| fan-out payload | `fan-out-payload.mjs` 77 dòng | **Mã chết**: validator `caller.coordination.fanOutPayload` trong `dispatch/execution-contract.mjs:386-399`; fan-out thật = unit song song / `panel` | (c) | Xem B2.8 |
| headless adapter | `headless-adapter.mjs`: cùng engine entry với CLI | `fgos run` (`bin/fgos.mjs` -> `src/runner/execution/run.mjs`) là cửa duy nhất | (a) | Hai cửa thi hành: `fgos run`, `fgos workflow start` (`workflow/spec.md` mục 8) |
| session events contract | `packages/coordination-state/rust/.../contracts/session-events.read.v1.json` (xoá) | Đọc cho Observe: `packages/run-result/contracts/run-result.read.v1.json`, `unit-summary.read.v2.json`. **Ledger Workflow không có file contract nào** [?] | (a) cho 2 file đọc; (c) cho ledger case | Event ledger case: `{seq, ts, type, payload}`, không có trường version (`store.mjs:76-95`) [V] |
| coordination-state (Rust store) | `packages/coordination-state/rust` 357 dòng, đọc cho Observe | Xoá; scorecard đọc Unit run + Workflow run (`packages/observe`, `packages/run-result`) | (a) | Plan P4 phase 6 [V] |
| "objector" | vai phản biện trong `FlowDefinition` | `red-team` = ghế checker của `reviewed` | (a) tên; (b) hành vi | `legacy-seat-read.mjs` vẫn nhận diện verdict bằng regex tên `^(reviewer|red-team|checker)` cho record cũ |
| visibility windows | `permits.sourceOperationRefs` **được validate, không được ép** (flow-definition dòng 416); mức ép = prompt/context | Unit `blind`, `anonymizeInputs`, `inputs` (`unit.mjs:101-102`); confinement `hostRead: blind` ở `dispatch/confinement/drivers/bwrap.mjs:156-204` | **(a) mạnh hơn engine** cho blind; (b) cho "ai thấy gì theo pha" | Lúc P4, bwrap chưa hỗ trợ `hostRead: deny` (plan P4 "Làm tươi"); nay có `blind` [V]. "Lộ theo pha" của delphi vẫn là dữ liệu `inputs` khai trong YAML |
| agent-led (standalone master) coordination | `standalone-master-coordination-loop.yaml`; primary + consult | `fgos run` + pattern `reviewed` (red-team luôn bật cho code); conductor case + `fgos workflow propose/start` | (a)/(b) | Đã là `reviewed` từ P1 (plan P4 bảng phân loại) |

**Thực thể cũ không có chủ nào (nobody owns)** [V từ contract + diff stat], liệt kê để owner biết nó đã mất có chủ ý hay chưa:
- `partialPolicy` + close theo quorum (`closeSessionByQuorum`, `classifySessionQuorum`): bỏ.
- `driver-authorized` operation, `operation-authorized`, `driver-disposition-recorded`, recheck-vs-retry có định danh: bỏ. Thay một phần bằng cổng người của Workflow (`gate.park/answer`, digest subject).
- `aggregation-validated`, `deliberation-contribution-linked` (sổ đóng góp), `specialist-authorized` (slot chuyên gia), `human-turn-recorded` (nguồn gốc lượt người, `turnOrdinal` liên tục): bỏ. `execution-contract.mjs:196-197` vẫn nhắc `record-human-turn`, `link-contribution` (mã chết).
- Khoá điều khiển Run `acquireRunControl` với holder `{id,pid,bootId,processStartTime,host}`: **vẫn còn** ở tầng thấp (`src/run-supervisor/`, `cwd-lock.mjs`), nhưng không còn là một bảo đảm có tên trong hợp đồng nào trên Execution [I].

---

## B. Bài học và vết xe đổ

### B1. Vì sao thu hồi (nguyên văn tài liệu)

- Authority chồng chéo: "A2 **'Tuần tự các bước' có 3 sequencer**: L3 (stage FSM + `loop.mjs`), L4 (pha/DAG của session engine), L2 (skill dẫn vòng lặp bằng prose)" và "A1 **'Ai làm, model nào' rải trên 3 layer + config**" (`plans/reports/layer-authority-map-261001-1020-request-to-run-track.md`, bảng mục 2).
- Hai tầng gộp một: "Nguyên nhân engine nặng: gộp hai tầng (làm một unit; tuần tự nhiều bước) vào một cơ chế" (`plans/reports/synthesis-260930-1229-request-to-run-brainstorm.md`, D3 bổ sung, dòng 293).
- Xây cộng dồn không xoá: "xây trước cho ca khó nhất ... rồi để ca đơn giản đi chung; ... xây cộng dồn không xoá (mỗi vòng review thêm một lớp bảo vệ — đúng điều RUL11 cảnh báo)" (§7c, dòng 602).
- Trọng lượng/nghi lễ: ~21k dòng coordination; request có 8 loại step; Lead gọi 5-8 lệnh cho **một** thay đổi; ~10 run, ~150 phút cho một phase tài liệu; 512/606 session kẹt `active` (§Q0, dòng 349-355).
- Luật rút ra: "mỗi lần thêm phải xoá được cái gì đó; ca khó là bài nghiệm thu, không phải lý do để mọi ca gánh chi phí của nó" (§7c).
- Owner Q8: các dạng thảo luận là năng lực phải giữ, engine chỉ là phương tiện (plan P4 `plan.md` Overview).

### B2. Biên Execution <-> Workflow hôm nay còn lặp lại vết xe cũ ở đâu

Mọi mục dưới là [V] trừ khi ghi [I].

1. **Workflow tự định nghĩa nghĩa của outcome Execution.** `src/workflow/store.mjs:262-264`: `INFRASTRUCTURE_OUTCOMES = {'execution-failure','not-started'}`, `reachedVerdict`, `isRerunnable`. Workflow tự quyết "chạy lại được" từ chuỗi outcome và từ `isVerdictResult` (đọc `posture.verdict` hoặc, với record cũ, regex tên ghế, `legacy-seat-read.mjs:19-22`). Cũng `case-projection.mjs:299` lặp lại `['pass','findings']`. Đây là đúng kiểu "hai chủ một quyết định" (A1/A2 cũ): thêm một outcome ở Execution thì Workflow lặng lẽ xếp sai. Mặc định `acceptOutcomes ?? ['pass']` (`runner.mjs:292`) là fail-closed tốt; nhưng `rerunnable` thì không.
2. **Từ vựng outcome có 5 bản khai.** `VALID_OUTCOMES` lặp ở `loops/index.mjs:55`, `panel.mjs:11`, `debate.mjs:20`, `reviewed.mjs:11`, `solo.mjs:9`; `unit-summary.mjs:8` import từ `panel.mjs`. Thêm `ERROR_OUTCOMES` ở `reviewed.mjs`. Ánh xạ RunResult -> outcome ở `unit-run-history.mjs:18` (`outcomeOfRunResult`). Ba nơi, chưa có một "bảng outcome" duy nhất.
3. **Năm kiểu phiên bản trong cùng biên.** (i) `{id, version:int}`: RunResult (`run-result.mjs:16`, v3), unit-summary (`unit-summary.mjs:16`, v2). (ii) chuỗi `'v1alpha1'`: `bind.mjs:19`. (iii) số nguyên trần `seatSchema: 2` trong `unit.json`. (iv) Rust-side file tên có đuôi `.read.v1/.v2` (`packages/run-result/contracts/`). (v) **không có**: input Unit (`unit.mjs`, chỉ có `id` là tên unit trong plan, không có `contract`), payload port `settle`/`admit`, event ledger case. Engine cũ có `schemaVersion` chuỗi trên manifest; nhưng event kind thì "thêm không cần đổi phiên bản" (contract dòng 253). Hôm nay ledger case lặp lại đúng chỗ yếu đó.
4. **Workflow lấy khoá thuộc Execution trực tiếp.** `case-gate.mjs:17,87`: `admitSuccessor(createLockScope('unit-custody'), ...)` qua `run-supervisor/cwd-lock.mjs`; Execution lấy cùng khoá ở `unit-run-start.mjs:303,368`. Hai bên cùng lấy một lease, port không có phép nào cho việc đó. [I] Gate là "Unit không có agent" nhưng đi cửa sau thay vì một phép port `runCommandUnit`.
5. **Bề mặt import rộng, không có allowlist.** `src/workflow/*.mjs` import ~26 module khác nhau của `src/runner/` (đếm bằng grep): kể cả nội bộ như `legacy-seat-read`, `case-run-paths` (8 lần), `unit-state`, `unit-control`, `dry-bind`, `account-pin`, `patterns/catalog`. Test A4 (`test/architecture.test.mjs:841-927`) chỉ cấm hướng ngược (execution/dispatch import workflow/state). Chưa thấy test nào giới hạn Workflow chỉ được import một "mặt công khai" của Execution [I: tôi chỉ grep manifest và các khối A4].
6. **Port không có kiểu và nuốt lỗi.** `case-admission-port.mjs` (bản Execution) có 4 phép (`resolveBinding, admit, settle, recheckEffect`) trong khi spec Workflow nói "ba phép hoặc tương đương" (`workflow/spec.md` mục 5.2); payload `settle` là object trần (`outcome, unitRunId, results, seatLaunchesUsed, frameExhausted, gate`); `settleAdmission` bắt lỗi settle chỉ bằng `console.warn` (`run.mjs:216-218`). Workflow bù bằng file `settle-pending` (`case-admission-port.mjs` bản Workflow dòng ~328). Một lỗi settle thành "mồ côi tự lành" chứ không phải lỗi hợp đồng.
7. **Refund đè outcome, hai cách nói.** `run.mjs:205-206`: nếu không brief nào tới agent thì `outcome = 'not-started'` (ghi đè outcome thật). `case-frame.mjs:85,106` dùng `outcome: 'refunded'` cho khung cha. Một khái niệm hai biểu diễn, và outcome thật bị mất. Đúng kiểu "trạng thái nhồi vào một enum".
8. **Mã chết của engine trong dispatch** (vi phạm tinh thần "không giữ code đọc", P4 `plan.md` mục Câu hỏi mở): `execution-contract.mjs:225-226` (`FORBIDDEN_SESSION_FIELDS`), `:386-419` (`caller.coordination.fanOutPayload`, `actionInvocation`, `ACTION_INVOCATION_KINDS` dòng 195-198, `NORMALIZED_STEP_FIELDS`), `runtime-inspection.mjs:116-148` (`findCoordinationSessionOwningAssignment`, `.fgos/coordination/sessions`, in ra lệnh `fgos coordination recover` đã không tồn tại), `reconciliation-planner.mjs:98-115` (hint `coordination-session`), `recovery-planner.mjs:4-10` (comment). Regex thành công của P4 (`session-engine|CoordinationProtocol|FlowDefinition|protocolRef|objector`) không chứa `coordination`/`fanOutPayload` nên không bắt được. [V grep] Chưa xác nhận hết caller của `fanOutPayload` ngoài `assignment.mjs` và `execution-contract.mjs`.
9. **Ledger Workflow: fold khoan dung.** `FOLD` bỏ qua event của step/unit không biết (`store.mjs`, vd `unit.scheduled`, `unit.complete`). Engine cũ từ chối và kiểm thứ tự lúc replay (`replay.mjs`, contract dòng 235-247). Hôm nay một event sai chỗ biến mất lặng lẽ thay vì thành lỗi có tên.

### B3. Bảo đảm engine đã có, hôm nay có thể đã mất

| Bảo đảm cũ | Chứng cứ cũ | Hôm nay | Lớp |
|---|---|---|---|
| Schema lệch -> recovery fail có tên, không đoán hình | contract dòng 1041-1043 | Unit: `seatSchema` (a). RunResult: `contract-corrupt` (a). **Ledger case: không có version để lệch** | (c) cho ledger case |
| Replay từ chối event sai thứ tự, kiểm lại tại replay mọi cổng ghi | contract dòng 235-247, 979-982 (T1, T4 "Closed") | `FOLD` khoan dung (B2.9) | (c) |
| Một chủ thành viên (`assignmentRefs` một chiều); Assignment "session-blind" bằng `FORBIDDEN_SESSION_FIELDS` | ADR-008; contract dòng 192-199 | Case ghi `workflow` link trong `unit.json` là provenance, cửa không đọc (`workflow/spec.md` 5.1); `unitRunId` có trong settle | (b) |
| Retry = Run mới, Run cũ bất biến, kết quả muộn của Run bị thay vẫn lưu nhưng không thành kết quả chính | `assignment-run-runresult.md` dòng 86-105 | Một phần ở `run-admission.mjs`; "exact-run eligibility" chưa bao giờ code (contract tự ghi) | (a) một phần |
| Delivery tri-state `not-sent|sent|unknown`, `unknown` không phải "launch failed" | contract dòng 83-85 | Thay bằng `briefNeverReached`/`noBriefDelivered` (`case-admission-port.mjs` Execution) | (a) khác hình |
| Ngân sách toàn phiên (wall time, concurrency, depth) không bypass được bằng restart | coordination-session dòng 177 | Khung case (đếm dispatch) + `timeoutMs` mỗi run; không có trần wall-time hay concurrency toàn case [I] | (c) một phần |
| Close theo quorum / partial có tên người thiếu | `partialPolicy`, `session-partial` | Bỏ; step `acceptOutcomes` + `gate` | (c) |
| Phân biệt "recheck" với "retry", mỗi recheck có `invocationKey` chống trùng | dòng 306-358 | `dispatchRetryId` mỗi attempt (`run.mjs`); [I] không còn khái niệm recheck | (c) |
| "Lộ theo pha" bằng cửa sổ visibility có `roundKey` | flow-definition dòng 400-500 | `inputs` trong YAML (b); `blind` được ép (a) | (b)/(a) |

### B4. Lỗi hợp đồng của chính engine (để không lặp)

1. **Hợp đồng lớn dần theo phase, không có phiên bản cho phần mở rộng.** `coordination-session.md` dài 1275 dòng, 16 loại event (bảng dòng 218-232), mỗi MVP thêm một loại; câu chốt: "Additional event kinds may be added by a future phase without breaking this contract". Kết quả: 4761 dòng `session-engine.mjs`, 3174 dòng `store.mjs`.
2. **Hợp đồng chạy trước code.** Run `bound`/`delivered`, "strict fencing" ghi "specified here ... not implemented" (`assignment-run-runresult.md` dòng 102-106); "Proposed Runtime Recovery Amendment" (`assignment-run-v2`) chưa bao giờ code. Người đọc không phân biệt được trường nào sống.
3. **Một khối vừa thi hành vừa điều phối.** `session-engine.mjs` giữ dispatch, legality, close, recovery, aggregation. Hôm nay Execution (`run.mjs` 859 dòng) và Workflow tách, nhưng `run.mjs` tự quyết refund/settle (B2.7), tức một phần quyết định "ngân sách của case" nằm trong Execution.
4. **Ghim theo id@version, không theo nội dung**: lặp lại ở 3 section như một "residual đã biết" mà không đóng. Workflow nay ghim snapshot trong ledger, bài học đã được áp.
5. **Residual "wired but not driven"**: hidden-dissent và `unresolvedContributionRefs` có schema/evaluator nhưng không có fixture đi qua dispatch thật (dòng 471-476). Hợp đồng có trường mà không ai tạo ra nó.
6. **Từ chối bằng văn xuôi trong tên trường**: `FORBIDDEN_SESSION_FIELDS` để Assignment "mù session". Cách đúng nhưng tạo ra mã chết khi chủ biến mất (B2.8).

### B5. Khuyến nghị cho hợp đồng `unit-run-result` (Execution -> Workflow)

Mỗi mục: **điều khoản** <- *bài học*.

1. **Một chủ của từ vựng outcome.** Execution xuất một bảng duy nhất (`pass | findings | execution-failure | policy-refusal | provider-limit | blocked | not-started` hoặc tập chốt sau), một module; 5 bản `VALID_OUTCOMES` và `INFRASTRUCTURE_OUTCOMES` của Workflow bị thay bằng trường do Execution đặt. <- B2.1, B2.2.
2. **`verdict: yes|no` do Execution đặt, kèm `reason`.** Workflow không gọi `isVerdictResult`, không đọc regex tên ghế. Giá trị lạ hoặc thiếu = **no-verdict, không bao giờ pass** (khớp `outcomeOfRunResult`: "one that cannot be interpreted comes back corrupt, which is a failure and never a pass", `unit-run-history.mjs:19-21`, và mặc định `acceptOutcomes ['pass']`). <- engine cũ `contract-corrupt` fail closed.
3. **`retry: { used, left, retryable }`**: `retryable` do Execution quyết (hôm nay là `isRerunnable` ở `store.mjs:264`, di chuyển sang đây). `left` rút từ trần đã admit (`seatLaunchCeiling`), không từ đếm của Workflow. Nêu rõ `retryable` chỉ đúng khi **không ghế nào tới verdict và không có out-of-scope write** (điều kiện hiện hữu ở `store.mjs:264`). <- B2.1.
4. **`refunded: boolean` là trường riêng; `outcome` giữ giá trị thật.** Xoá cách ghi đè `'not-started'` (`run.mjs:205`) và cách `'refunded'` của `case-frame.mjs`. <- B2.7.
5. **`seats[]`: `{ seat, role, executor, model, account, outcome }`** (mỗi `outcome` cùng bảng ở mục 1; có `round`, `kind` nếu cần), lấy từ `unit-summary` v2 (đã mang `seat`, `role`, `kind`). Account ghi tên, không chứa credential (nhớ rule an toàn secrets). <- `unit-summary.mjs:12-16`.
6. **Phiên bản nằm trong payload**: `{ contract: { id: 'unit-run-result', version: N } }`, cùng dạng với RunResult/unit-summary. Reader từ chối version không biết bằng lỗi có tên (`version-unsupported`, đã có trong danh sách lỗi cũ dòng 168), không im lặng. Dùng một idiom duy nhất (B2.3): tránh `v1alpha1`/`seatSchema`/không-version. <- B4.1.
7. **Phần thêm = đổi version hoặc trường tuỳ chọn có tên**; cấm "thêm kind không cần đổi hợp đồng". Hợp đồng chỉ liệt kê trường **đã có writer và một test sở hữu** (design principle 8); trường dự kiến ghi ở mục "ý tưởng" riêng (RUL104). <- B4.2, B4.5.
8. **Hai phía cùng đọc một schema, không tự suy.** Kèm một fixture JSON golden (như `packages/seat-binding/contracts/*.golden.v1.json`, `packages/run-result/contracts/*.read.v*.json`) dùng chung cho test Node + Rust. <- bài học `packages/` hiện hữu.
9. **Phép port, không import nội bộ.** Nếu gate cần lease `unit-custody` hay Workflow cần đường dẫn run, thêm phép vào port hoặc một mặt công khai nhỏ của Execution; kèm test import-allowlist cho `src/workflow` -> `src/runner`. <- B2.4, B2.5.
10. **Lỗi settle là lỗi hợp đồng**: `settle` trả `{ settled: true } | { refused }` thay vì `console.warn`; `settle-pending` của Workflow vẫn là phao cứu hộ, không phải đường chính. <- B2.6.
11. **Ledger case mang version event** (`workflow.start` đã nhúng snapshot, thêm `schema` vào mọi event hoặc ít nhất `workflow.start`) và fold từ chối event lạ có tên (hoặc ghi cảnh báo đếm được). <- B2.9, B3.
12. **Dọn mã chết trong cùng đợt** (L10): xoá `caller.coordination.*`, `runtime-inspection` đường `coordination/sessions`, hint `coordination-session`; thêm các từ này vào guard từ vựng chết. <- B2.8.

### B6. Việc nên hỏi owner (không tự quyết)

- Có muốn giữ lại wall-time/concurrency toàn case (c) hay chấp nhận đã bỏ có chủ ý? Spec Workflow mục 9 không nhắc.
- `recheck` có định danh và close theo quorum (c): ca thật cần chưa? Plan P4 chỉ ghi "ngang engine ở mức prompt".
- `retryable`/`left`: Execution hay Workflow chủ ngân sách retry? Hôm nay trần seat launch do case cấp (`seatLaunchCeiling`) nhưng chi tiêu do Execution đếm (`run.mjs:416`).

### Chưa kiểm / hạn chế
- Không chạy test; mức phủ test của từng thực thể (a) là suy luận từ mô tả P4 và danh sách test bị xoá.
- Không đọc toàn bộ `contracts/flow-definition.md` (768 dòng) và `coordination-session.md` (1275 dòng); chỉ các đoạn trích dẫn.
- Chưa mở `docs/platform/runner/spec.md`, `docs/platform/runner/decisions/h-aabefc85f0c9.md` ngoài tiêu đề; các sibling plan p1, p3, p5 chỉ đọc qua plan track và synthesis.
- `docs/platform/agent-coordination/contracts/assignment-run-runresult.md` (bản hiện hành) không được so với snapshot cũ từng dòng.
