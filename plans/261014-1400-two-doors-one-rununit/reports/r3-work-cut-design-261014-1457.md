# R3 — Thiết kế cắt Work trên runUnit (spike phase 08)

Lane L8 · nhánh `feat/rununit-spike` từ `87ec14c09` · chỉ đọc code, không sửa code · 2026-10-14

**Lead duyệt:** duyệt, 2026-10-14. Chấp nhận cả mười câu, kể cả hai chỗ đổi mặc định (câu 4, câu 8). Hai mục để ngỏ:
1. L10 thêm `declaredOperationFields` vào `dispatch/assignment.mjs`. Hàm này chỉ cộng thêm, không đổi chữ ký `buildAssignment`, để P11 khỏi phải gom lại.
2. Lỗi khoá resume `run.mjs:185-207`: Lead đã sửa riêng trước đợt B (nhánh `fix/rununit-resume-lock`). L9/L10 không phải nhận nữa.

## Tóm tắt quyết định

| Câu | Kết luận | So với mặc định của phase |
|---|---|---|
| 1 `declared` | runUnit nhận `declared: {workId, domain, workflow, stage, operation, operations}`. `operations` là **object đầy đủ của step**, không phải chỉ id. `dispatchBound` dựng phần operation (role, taskSpec, skills, contractTemplate, stamp normalizer) ngay trên assignment của seat | Giữ, thêm 4 điều kiện (mục 1) |
| 2 `pinInputs` | Đường tuyệt đối do Work phân giải. Dispatch băm lúc launch, ghi cả `rel`. Work so **theo `rel` + digest**, không theo khoá đường tuyệt đối | Giữ, đổi cách so |
| 3 rigor | Work gộp `opPolicy.rigor`, `work.rigor`, `risk: heavy` → `unit.rigor`. Sàn capability, override tier và `maxTier` ở lại tầng thấp (bind). `dispatchBound` ghi thêm `policy.rigor = unit.rigor` | Giữ, thêm một dòng `policy.rigor` |
| 4 inputs | `unit.inputs` vẫn là **đường tương đối repo** (`validateUnit` cấm đường tuyệt đối). Việc phân giải nằm ở chỗ chọn `worktree` của Unit | Sửa mặc định |
| 5 `decide --work` | Hint `{workExecutorId, agentType, rigor, domain, capabilityHints, stage}` | Giữ, thêm `domain` |
| 6 `workUnitFor` | Trả `{unitData, declared?, pinInputs?, worktree}`, chữ ký ở mục 6 | Mở rộng giá trị trả |
| 7 Phương án B của 00 | Vẫn đúng nếu driver đọc `runResult` của seat producer, không đọc `outcome` của Unit | Giữ, có điều kiện |
| 8 Tìm lại verdict | **Walker hiểu layout lồng** (`listAssignmentRuns`), lọc như cũ trên `assignment.json` mà `dispatchBound` đã stamp. **Không** ghi `unitRunId` vào state item | **Đổi** mặc định (lý do ở mục 8) |
| 9 herdr | Loop truyền `herdrPresent: false` (giữ hành vi hôm nay). Nếu vẫn ra herdr thì `lastWorkerOutput` lấy từ report đã gắn hash lúc settle | Câu trả lời mới |
| 10 đồng thời | Reap an toàn trong ngưỡng 1h. Khoá cwd được giành lại ngay khi pid chết. **Lỗi thật:** kiểm khoá lúc resume ở `run.mjs:185-207` là code chết | Câu trả lời mới + 1 lỗi |

Câu 8 có hai phương án nhưng một bên thắng rõ ("một đường đọc", không đổi schema), nên em không hỏi kongming.

## Bằng chứng nền

- runUnit lưu mỗi lần chạy seat ở `.fgos/assignments/<unitRunId>/<role>/<round>[-fbN]/`: `assignmentId = ${unitRunId}/${role}/${round}` (`run.mjs:471`), còn `executeAssignment` ghép `assignmentsDir/<assignmentId>` (`assignment-runner.mjs:1321`). Tức layout **lồng**, có `assignment.json`, `dispatched/`, `runs/<NN>/result.json` như layout phẳng.
- `findLatestAssignmentRunResult` (`operation-choice.mjs:104-140`) chỉ `readdirSync(assignmentsDir)` rồi tìm `<dir>/assignment.json`. Với `unit-run-…/` thì file đó không tồn tại, nên bỏ qua. **R-C1 có thật.**
- Assignment của seat hôm nay **không** có `workId/stage/operation/resultKind/role-op/taskSpec/contractTemplate` (`run.mjs:340-375`). Nó chỉ có `role: 'producer'`, `provenance.kind: 'unit-run'`, cùng policy tier/executor.
- Cổng legality chạy cho mọi assignment khác `inline` mà có `stage && operation` (`assignment-runner.mjs:598`), và lấy danh sách hợp lệ từ `provenance.declared.legalOperations` khi caller không truyền `opts.operations` (`:604`).
- Prompt theo operation lấy từ `contractTemplate` và `evidence.required` (`operation-prompt-templates.mjs:400,433,558`), với `domain` của assignment (`assignment-runner.mjs:1356`). Claim được validate theo `role` + `operation` (`settlement.mjs:523`).
- Impact (GitNexus, repo `/home/vantt/projects/forgentX`):
  - `findLatestAssignmentRunResult` **HIGH** (1 caller trực tiếp; luồng `dispatchClaimedItem`, `planUseCase`, `runOnce`);
  - `executeDriverOperationChoice` **HIGH** (3 caller trực tiếp, cùng 3 luồng);
  - `runUnit` LOW theo index, nhưng index **sót** `bin/fgos.mjs:2706` (cross-check bằng `rg`: caller là `workflow/runner.mjs:482` và `bin/fgos.mjs:2706`). Lỗ hổng này đã biết (tsk-38h), nên coi blast radius của `runUnit` ít nhất là 2 cửa N1/N2.

## 1. D8 qua runUnit mang ngữ nghĩa operation

**API cuối**

```js
runUnit({ unitData, worktree, repoRoot, session: { headless: true, herdrPresent: false },
          declared: { workId, domain, workflow, stage, operation, operations /* object[] của step */ },
          pinInputs: [/* abs */] })
```

- `declared` và `pinInputs` lưu vào `unit.json` (`unitRecord.declared`, `unitRecord.pinInputs`). Resume đọc lại từ đó, không nhận lại từ caller (red-team 10 #3).
- Ngay sau `validateUnit`, **trước khi tạo thư mục**:
  - `matchedOp = declared.operations.find(o => o.id === declared.operation)`. Không có thì `RunnerConfigError`, không spawn (yêu cầu 10 "operation ngoài operations bị từ chối trước spawn").
  - `matchedOp.dispatch === 'human-only'` thì từ chối.
  - `stamp = stampDeclaredAssignment({role: matchedOp.role ?? 'implementer', operation})` (`assignment-normalizer.mjs:116`).
  - **Khớp mutation:** `stamp.mutation === 'read-only'` ⇔ `unit.writes.length === 0`, lệch thì từ chối. Nhờ vậy `readOnly` của pattern (`solo.mjs:32`) và stamp không mâu thuẫn được.
  - Chỉ chấp nhận `pattern` là `solo` (hoặc không khai). Lý do: `reviewed`/`panel` sẽ thêm seat không mang stamp, và D8 hôm nay là một assignment cho một operation. Template `units:` trong `feature.yaml:91-100` (validate-plan: `reviewed`) là của Workflow runner, `workUnitFor` **không** đọc nó.
- `dispatchBound` (seat producer) trộn thêm vào assignment khi có `declared`:
  - `workId`, `domain`, `workflow`, `stage`, `operation`;
  - `role: matchedOp.role ?? 'implementer'`. Tên seat vẫn ở `provenance.role` và đường dẫn `producer/1`;
  - `dispatch`, `taskSpec`, `skills`, `contractTemplate` (= `matchedOp.contractTemplate ?? matchedOp.task?.contractTemplate`);
  - `mutation`, `evidence`, `resultKind`, `onAdvance` từ `stamp`;
  - `expectedFiles` (nếu Work truyền, xem mục 6);
  - `provenance: {kind: 'unit-run', …, declared: {domain, workflow, stage, operation, taskSpec, legalOperations: operations.map(o=>o.id)}}`;
  - `policy.rigor = unit.rigor` (mục 3).
- Cổng mutating RUL73.4 (`assignment-runner.mjs:452-575`) vẫn chạy vì `provenance.kind` vẫn là `'unit-run'`. Không đổi gì.
- **Không** gọi `buildAssignment` trong runUnit: hàm đó tự cấp `assignmentId` riêng (`assignment.mjs:380`) và nhận `work` (P11 xoá). Phần dựng operation nên tách thành hàm thuần `declaredOperationFields({operation, operations, domain, workflow, stage})` trong `dispatch/assignment.mjs`, dùng chung cho `buildAssignment` và `dispatchBound` (DRY). Ai sở hữu: xem bảng file × lane.

**Phải có:** `session.headless: true`. Seat `producer` không headless mà hết ứng viên sẽ rơi về inline (`bind.mjs:272-279`) và ra `pending-inline`, thứ driver không giải được. Headless thì bị từ chối sạch (`:281-287`).

## 2. `pinInputs` và gốc

**Hiện trạng:**
- `resolveContentRoot` thử `process.cwd()` trước, rồi tới worktree `fgw/<id>`, rồi `stateRoot` (`paths.mjs:223-243`).
- Hash lúc dispatch lấy theo `process.cwd()` **của tiến trình dispatch** (`assignment-runner.mjs:1530-1540`). Hash lúc đọc lại lấy theo `process.cwd()` **của tiến trình đọc** (`operation-choice.mjs:357-359`, `:782-784`). Hai cwd khác nhau thì ra hai file khác nhau. R-H1 có thật, và nó phụ thuộc cả cwd chứ không chỉ gốc.

**API cuối**
- Work: `contentRoot = resolveContentRoot(stateRoot, id, docsRef)`, rồi `pinInputs = [path.join(contentRoot, docsRef, 'plan.md')]` (bỏ qua nếu file không có).
- Dispatch (thay khối `assignment-runner.mjs:1530-1540`), **trước spawn**, với mỗi `p`:
  - `real = realpathSync(p)`. Nằm ngoài `realpath(mainRoot)` và ngoài mọi `realpath` worktree của `git worktree list --porcelain` thì ghi `{path: p, sha256: null}` kèm warning `pin-outside-allowed-roots`, **không đọc file** (red-team 10 #2: symlink trỏ ra ngoài cũng bị `realpath` bắt).
  - Trong gốc thì ghi `{path: p, root: <gốc chứa nó>, rel: relative(root, real), sha256}`.
  - Ghi `inputDigests: [...]` vào `run.json` meta và `result.json`. `planContentHash` thôi tính mới, chỉ còn để đọc kết quả cũ.
- Work so khi đọc: `cur = sha256(<contentRoot hiện tại>/<docsRef>/plan.md)`.
  - Tìm entry có `rel === <docsRef>/plan.md`, so `cur === entry.sha256`.
  - Không có entry thì dùng `runResult.planContentHash` (kết quả cũ).
  - Cả hai đều không có thì không tiêu thụ (giữ `:4710`).
- **Vì sao so theo `rel`:** plan validate trong worktree item rồi merge về main có cùng byte nhưng khác đường tuyệt đối. So theo khoá tuyệt đối sẽ bắt validate lại vô ích (fail-closed, chỉ tốn tiền). So theo `rel` + digest thì vẫn chặn đúng plan cũ (byte khác thì không khớp), và không phụ thuộc cwd của bên đọc.
- **cwd cho `fgos plan --validate` khi qua runUnit:** `worktree: contentRoot`, `repoRoot: stateRoot`. Unit read-only nên worker chạy trong `contentRoot`, đúng như `cwd: contentRoot` hôm nay (`step.mjs:73-79`, `loop.mjs:1613-1619`). `unit.json.worktree = realpath(contentRoot)`. Khi `contentRoot` là main checkout thì Unit read-only chạy ở đó, như hôm nay. Operation mutating (`loop.mjs:978`) thì `worktree: wt.path`.

## 3. Rigor

**Mọi nguồn hôm nay**

| # | Nguồn | Ở đâu | Ai dùng |
|---|---|---|---|
| 1 | `opPolicy.rigor` (YAML operation; duy nhất `validate-plan: standard`, `feature.yaml:80-81`) | `assignment-policy.mjs:225-229` | driver |
| 2 | `work.rigor` (trường item editable, `store.mjs:353`) | `assignment-policy.mjs:235-244`; `work-dispatch.mjs:103`; `loop.mjs:1689` | driver, loop |
| 3 | `work.risk === 'heavy'` → high (D18) | `assignment-policy.mjs:245-251`; `work-dispatch.mjs:103`; `loop.mjs:1689` | driver, loop |
| 4 | Sàn capability `capabilities[cap].rigor` (D19) | `assignment-policy.mjs:257-270`; `work-dispatch.mjs:113`; `bind.mjs:347-348`; `plan.mjs:404` | cả hai đường |
| 5 | `cliOverride.rigor` | `assignment-policy.mjs:273-282` | CLI |
| 6 | Tier tường minh `opPolicy.tier`, `cliOverride.tier` (chỉ nâng) | `assignment-policy.mjs:313-325` | đường unit-run dùng cái này |
| 7 | Override tier của Unit | `bind.mjs:361-364` | unit |
| 8 | Kẹp `maxTier` | `bind.mjs:366-373` (chỉ bind) | unit |
| 9 | `runner.patterns.defaultRule.mutatingMinRigor` | chỉ được validate (`config.mjs:225,1299-1308`; `registrations.mjs:530`) | **không ai tiêu thụ.** `rg` ngoài setup/config ra 0. Key chết, ghi ở đây để 11 không tưởng nó là sàn |

**API cuối**
- **Chuyển sang Work**, tính trong `workUnitFor`: nguồn 1, 2, 3 theo đúng luật thứ tự của policy (nguồn tường minh đầu tiên thắng, nguồn sau chỉ nâng; risk heavy chỉ áp khi không khai `work.rigor`), ra `unit.rigor`. Hàm thuần đặt cạnh `workUnitFor`, không import dispatch.
- **Ở lại tầng thấp** vì là ngữ nghĩa capability/runner: nguồn 4 (bind + policy), 5, 7, 8. Nguồn 6 là cách đường unit-run chuyển tier: `dispatchBound` đặt `policy.tier = bound.tier` và `cliOverride.tier = bound.tier` (`run.mjs:363,384`), policy chỉ nâng (`:313-325`), nên **tier không thể bị hạ dưới bind**.
- **Thêm:** `dispatchBound` ghi `policy.rigor = unit.rigor`. Hôm nay đường unit-run không mang rigor vào policy, nên `effectiveRigor` của policy là default/capability. Hệ quả: `reasoningEffort` suy từ rigor sai (`assignment-policy.mjs:347-350`), và provenance rigor sai. Tier thì vẫn đúng. Em không tìm thấy adapter nào đọc `reasoningEffort` của policy (`rg` trong `transport.mjs`/`assignment-runner.mjs` ra 0), nên tác động thực tế **UNPROVEN**, nhưng provenance phải đúng.
- **Delta hành vi cần ghi spec:** bind lấy `standard` làm sàn (`bind.mjs:348`: `resolveStrongerRigor(unitRigor ?? 'standard', …)`), còn policy cho phép `low` đầu tiên thắng (test `assignment-policy.test.mjs:731`). Item `rigor: low` đi qua runUnit sẽ chạy `standard`. Đây là nâng, không phải hạ, nên hợp luật "không hạ", nhưng tốn hơn. Em quyết: chấp nhận, ghi Spec delta. Không sửa bind trong R3.

## 4. `work.refs` / `docsRef` → inputs

- `unit.inputs = [docsRef, docsRef/plan.md, docsRef/CONTEXT.md (khi refs trống), ...work.refs]`, giữ nguyên thứ tự của `assignment.mjs:396-406`. Tất cả là **đường tương đối repo**.
- `validateUnit` chỉ nhận đường tương đối an toàn (`unit.mjs:55-74`). `resolveUnitInputs` giữ nguyên đường tương đối (`handoff-refs.mjs:223-240`), worker đọc chúng tương đối với cwd của nó, tức `unit.json.worktree = contentRoot`. Đường tuyệt đối chỉ dùng cho `pinInputs` (để băm), không dùng cho `inputs`.
- Ref trong `work.refs` mà không hợp lệ (tuyệt đối, `..`) thì bỏ qua kèm warning thay vì làm hỏng cả Unit. Hôm nay `buildAssignment` nhận mọi chuỗi.

## 5. `decide --work`

`resolveWorkForDispatch` (Work layer) trả:

```js
{ workExecutorId, agentType, rigor /* luật mục 3 */, domain, capabilityHints, stage }
```

`plan.mjs` cần `domain`: `deriveOperationCapability` (`assignment-policy.mjs:257-261`) đọc `work?.domain`, và `rigorSource.id` hiện là `work.id` (đổi sang `{scope:'work-hint'}`). `plan.mjs:150,164,417` đọc `workItem.agentType` và truyền cả `work` vào policy: đổi sang hint. Test khoá: 11 giữ "decide --work trả cùng executor".

## 6. Helper `workUnitFor`

Đặt trong `src/runner/work-dispatch.mjs` (09a):

```js
/**
 * @param {object} item  Work item
 * @param {{ cfg, stateRoot, stage?, operation?, operations?, feedback?, expectedFiles?, worktree? }} opts
 * @returns {{ unitData, declared?, pinInputs?, worktree }}
 */
export function workUnitFor(item, opts)
```

- `unitData.id`: `work-<id>-<operation ?? stage>`, chỉ giữ `[a-z0-9-]` (ổn định, ascii).
- `unitData.objective`:
  - D7: `buildPrompt(item, feedback, stage)`;
  - D8: `Execute <stage>.<operation> operation`, như `assignment.mjs:388`, cộng feedback nếu có. Prompt thật do `contractTemplate` render ở dispatch.
- `unitData.capability`:
  - D8: `deriveOperationCapability(matchedOp, {domain}, cfg).name` (`operation-capability.mjs:12`, Work-side, cùng hàm policy đang dùng);
  - D7: `resolveCapabilityIdentityDetails(...).capability ?? fallbackLabel`. Unit bắt buộc có capability (`unit.mjs:134-137`).
- `unitData.writes`: read-only thì `[]`; mutating có `expectedFiles` thì dùng `expectedFiles` (khớp cổng footprint của `scoped-subtask`, `operation-choice.mjs:2104`); mutating còn lại thì `['**']`.
- `unitData.rigor`: theo mục 3.
- `unitData.prefer`: `[resolveExecutorAndOverrides(cfg, executorIdForWork(item, stage)).executorId]`, **chỉ khi `configured`**. `executorIdForWork` trả tên job/skill (D12), không phải lúc nào cũng là executor id. Field `prefer` cần P01 merge (`unit.mjs:113-120` hôm nay cấm `prefer`).
- `unitData.inputs`: theo mục 4.
- `unitData.pattern`: `'solo'`.
- `declared` / `pinInputs`: chỉ có khi có `operation`. `operations = operationsForStep(getDomain(domain), stage, item.kind)`.
- `worktree`: caller truyền; mặc định D8 read-only là `contentRoot`.
- Export `workDispatchContext` giữ nguyên cho tới 11.

## 7. Phương án B của 00

- `runUnit` trả `results[0].runResult` là đúng object `executeAssignment` trả (`run.mjs:394-400`), nên `warnings` còn nguyên. Walker đọc lại `result.json`: lane D ghi warning vào RunResult đã lưu (phase 00 dòng 18).
- **Điều kiện:**
  - Driver đưa `results[producer].runResult` (seat cuối, kể cả `-fbN`) vào `interpretAssignmentRunResult`, **không** dùng `runUnit().outcome`. `outcomeOfRunResult` (`unit-run-history.mjs:18-33`) gộp mọi `ok` thành `pass` và mất tín hiệu correlated.
  - `pending-inline` hoặc `policy-refusal` của Unit thì driver trả `stop: true, canAdvanceEdge: false`.
- Test 4 của 00 (`:5302`) phải chạy lại sau 10 (red-team 11 #5 đã ghi).

## 8. Work tìm lại verdict validate-plan

**Kiểm kê mọi chỗ đọc `.fgos/assignments`**

| Chỗ | Kiểu | Layout | Đọc verdict Work? |
|---|---|---|---|
| `operation-choice.mjs:104` `findLatestAssignmentRunResult` | quét, lọc `workId/stage/resultKind` | **chỉ phẳng** | **có, chỗ duy nhất** |
| `operation-choice.mjs:704` | đọc theo `lastRunResult.assignmentId` | cả hai (id có `/`) | lọc inline |
| `operation-choice.mjs:1480-1489` `consumingRunDirFor` | suy từ `runId` | cả hai | đường evidence |
| `dispatch/assignment.mjs:150` `createAssignmentId` | quét prefix để cấp id | phẳng | không |
| `dispatch/assignment-layout.mjs:59` `scanAssignmentLayout`/`listAssignmentRuns` | quét có giới hạn độ sâu, chặn symlink | **cả hai** | không (doctor, `visibility-session.mjs:236`, `runtime-inspection.mjs:68`) |
| `dispatch/cli.mjs:1039` | `decide --assignment` | điểm | không |
| `dispatch/runtime-inspection.mjs:109,145` + `verbs/dispatch/recover.mjs:238` | điểm qua `assignmentDir()` | cả hai | không |
| `execution/run.mjs:170,637`, `handoff-refs.mjs:117`, `workflow/runner.mjs:912`, `assignment-runner.mjs:479` | điểm `unit.json` | lồng | không |
| `setup/registrations.mjs:584,6405` | doctor | cả hai | không |
| Rust host observe scanner (`checkObserveRunCoverage`) | quét | cả hai | không |

Ký ức "từ 7 walker trở lên" đúng nếu đếm mọi chỗ đọc, nhưng **chỉ một** chỗ đi tìm verdict cho Work. Walker hiểu layout lồng đã có sẵn (`listAssignmentRuns`).

**Hai phương án**
- (A, mặc định phase) Ghi `unitRunId` vào state/event của item, rồi đọc thẳng. Phải thêm trường editable mới (`store.mjs:353`, `work.mjs:470` validate, và `packages/work-state/rust/src/work_source.rs`, đã sửa ở `ad9a23a9f`). Phải ghi state từ driver. Và **vẫn cần walker cho kết quả phẳng cũ**, tức thành hai đường đọc, trái yêu cầu 10.4 "một đường đọc".
- (B, chọn) `findLatestAssignmentRunResult` thay `readdirSync(assignmentsDir)` bằng `listAssignmentRuns(fgosDir)`, gom theo `assignmentId`, rồi áp nguyên chuỗi lọc và hardening đang có lên `<assignmentDir>/assignment.json`. Assignment lồng mang `workId/stage/resultKind` nhờ mục 1, nên **cùng một bộ lọc** khớp cả hai layout.

**Chọn B.** Một đường đọc, không đổi schema item, tái dùng walker đã chặn symlink/độ sâu. Chi phí quét bằng hôm nay (cũng là O(số assignment)).

**Sửa bắt buộc trong walker khi chuyển sang B**
- `asgnId` phải là **id tương đối đầy đủ** (`unit-run-…/producer/1`), không phải `path.basename(asgnDir)` (`operation-choice.mjs:150`). Nếu không, kiểm `runId === run_${asgnId}_${runSub}` (`:197`) sẽ loại mọi kết quả lồng.
- Thêm lọc `asgn.operation === 'validate-plan'` khi có, ngoài `resultKind`, để red-team 10 #4 (hai operation song song) không lấy nhầm.
- Kiểm plan theo mục 2 (`rel` + digest).
- Ghi `unitRunId` vào event `executor.dispatch` của loop (09 req 4) **chỉ để truy vết**, không phải đường đọc. `onUnitRunCreated` (`run.mjs:271`) báo id ngay khi Unit được tạo, nên loop crash giữa lượt vẫn có id để `resumeUnitRunId` (red-team 09 #1).

**Test chu trình đầy đủ (P10):** fixture repo, driver `executeDriverOperationChoice(work, {dispatch:'assignment', operation:'validate-plan'})` qua runUnit với executor giả ghi claim READY. Sau đó, **lượt riêng**, `chooseStageOperation({work, stage:'planning', repoRoot})` **không** truyền `lastRunResult`, kỳ vọng `reason: 'validation-passed-ready-for-planning-edge'`, `canAdvanceEdge: true`. Sửa `plan.md` rồi lượt kế tiếp thì kỳ vọng không tiêu thụ (lại `plan-written-needs-reality-check`). Biến thể: plan chỉ có trong worktree item, bên đọc chạy từ `stateRoot` (mục 2).

## 9. herdr trong loop

- `bind` chọn herdr khi `session.herdrPresent === true` và executor có invocation herdr (`bind.mjs:314-321`). Mặc định `detectHerdrPresent()` đọc env (`run.mjs:60`, `:410`), nên loop chạy trong pane herdr **sẽ** tự đổi transport. Hôm nay `spawnWorker` luôn spawn trực tiếp.
- **Quyết:** `workUnitFor` không quyết transport. Caller loop/driver truyền `session: {headless: true, herdrPresent: false}` để giữ hành vi hôm nay. Đây là lựa chọn thật của caller nền, không phải switch cho test. Mở herdr cho loop là việc riêng sau R3.
- Khi transport vẫn là herdr (override pin invocation herdr, `bind.mjs:310-313`), `lastWorkerOutput` ghép, theo thứ tự:
  1. nội dung các report trong `runResult.settleReports` (đã gắn hash lúc settle, nằm trong run dir);
  2. `runtime.stdoutLog` nếu file có;
  3. `agentClaim.summary`.

  `parseVerdictBlock` / `captureDiscoveredWork` quét fence trong văn bản, không quan tâm nguồn. Không bao giờ đọc nội dung pane.
- **UNPROVEN:** herdr-spawn có ghi `stdout.log` không. `stdoutLog` chỉ thấy ở `settlement.mjs:722,819` và `assignment-runner.mjs:1889`. L9 kiểm bằng `run-herdr.test.mjs`.
- **Hệ quả cho prompt (L9):** worker phải ghi fence verdict/discovered-work vào report chứ không chỉ in ra stdout, nếu không thì fence mất khi transport là herdr.

## 10. Đồng thời trong loop

- **Reap** (`cleanup.mjs:370-460`): home có marker `pid` = tiến trình ghi (`cleanup.mjs:88`, `bwrap.mjs:484`) thì bị bỏ qua khi pid sống và chưa quá `maxAgeMs = 1h`. Home có `paneId` thì bỏ qua khi pane còn mở.
  - Hai worker song song trong cùng hoặc khác tiến trình: không bị dọn nhầm.
  - **Residual:** một lượt không có pane mà chạy quá 1h sẽ bị dọn home giữa chừng. `timeoutMs` repo là 2100000 (35′, `.fgos/config.json:1363`), default 900000. Hôm nay an toàn; ghi cho ai nâng timeout quá 1h.
- **Khoá cwd** (`assignment-runner.mjs:2250-2275`):
  - chỉ áp cho `cli-spawn` + mutating (`:2157`), identity dạng `"pid:ts:rand"`;
  - `main-checkout-lock.mjs:304-320` giành lại **ngay** khi pid trong identity đã chết (S2), nên SIGKILL runner **không** treo tới TTL, trừ khi pid bị tái dùng (khi đó treo tới `ttlMs = timeoutMs`);
  - gỡ thủ công: `fgos unlock` / xoá `.fgos/dispatch--<encodeURIComponent(cwd)>.lock` sau khi xác nhận pid chết.
  - Hai item khác worktree thì không tranh khoá. Hai operation mutating cùng worktree: lượt sau nhận `dispatch-in-flight`.
- **Lỗi thật (chưa sửa, ngoài phạm vi spike):** khối kiểm khoá lúc resume ở `run.mjs:185-207` là code chết vì hai lẽ:
  1. tên file `dispatch--${path.replace(/[^a-zA-Z0-9_-]/g,'_')}.lock` khác tên thật `dispatch--${encodeURIComponent(cwd)}.lock` (`main-checkout-lock.mjs:78-80`);
  2. `pid` trong file là chuỗi composite, mà code kiểm `typeof pid === 'number'`.

  Tức resume **không bao giờ** bị từ chối khi worker cũ còn chạy. Lớp chặn còn lại là admission in-flight của `executeAssignment`. Giao cho **L9** (sở hữu đòn red-team 09 #1/#5): test đỏ "resume khi holder còn sống bị từ chối", rồi dùng `dispatchLockFile()` + `parseCompositePidIdentity`. Lead có thể muốn tách thành item riêng; `run.mjs` ở bước G do L10 giữ, nên L9 cần L10 đồng ý hoặc Lead xếp thứ tự.

## Bảng file × lane (R3)

| File | 09a | 09 | 10 | 11 |
|---|---|---|---|---|
| `src/runner/work-dispatch.mjs` (`workUnitFor`, luật rigor, hint `decide`) | **sở hữu** | sở hữu (`spawnWorker`) | đọc | sở hữu (`workDispatchContext` bỏ `work`, `resolveWorkForDispatch` trả hint) |
| `src/runner/loop.mjs` | — | **sở hữu** (`herdrPresent:false`, `lastWorkerOutput`, `unitRunId` trong event) | đọc | đọc |
| `src/runner/fanout-batch.mjs` | — | **sở hữu** | — | — |
| `src/runner/execution/run.mjs` (`declared`, `pinInputs`, stamp trong `dispatchBound`, `policy.rigor`, kiểm khớp mutation/pattern) | — | đọc (+ sửa khoá resume nếu Lead xếp) | **sở hữu** | đọc |
| `src/runner/dispatch/assignment.mjs` (tách `declaredOperationFields`) | — | — | **sở hữu** (cộng thêm, không đổi chữ ký `buildAssignment`) | sở hữu (bỏ tham số `work`) |
| `src/runner/dispatch/assignment-runner.mjs` (`inputDigests` thay `planContentHash`) | — | — | **sở hữu** | sở hữu (bỏ `opts.work`) |
| `src/runner/dispatch/settlement.mjs`, `run-result.mjs` (lưu `inputDigests` vào `result.json`) | — | — | **sở hữu** | đọc |
| `src/runner/operation-choice.mjs` (walker B, so `rel`+digest, driver qua runUnit) | — | — | **sở hữu** | đọc |
| `src/verbs/state/step.mjs` (`worktree: contentRoot`) | — | — | **sở hữu** | — |
| `src/runner/dispatch/{assignment-policy,plan,cli}.mjs` | — | — | — | **sở hữu** |
| `src/runner/dispatch/assignment-layout.mjs` (`listAssignmentRuns`) | — | — | đọc (dùng) | — |
| `src/runner/operation-capability.mjs` | đọc | đọc | đọc | — |
| `test/architecture.test.mjs` | — | allowlist | `:337` | guard |

Ghi chú: `declaredOperationFields` nằm ở `assignment.mjs`. Bảng của plan để L10 "chỉ đọc" file này, nên nếu Lead muốn giữ đúng bảng thì L10 dựng phần operation ngay trong `run.mjs` bằng `stampDeclaredAssignment` + `matchedOp` (vài dòng), còn 11 gom lại. Em đề nghị cho L10 thêm hàm (chỉ cộng thêm) để khỏi phải gom sau.

## Test đang khoá hành vi (không được nới)

- **Stale-plan / walker** (`test/runner/operation-choice.test.mjs`):
  - plan đổi sau validate: `3140`, `3193`;
  - hash plan: `4622`, `4686`, `4710`, `4807`;
  - claim/settle/runId: `4643`, `4665`, `4731`, `4759`, `4779`, `4848`, `4898`, `4921`, `4946`, `5016`, `5055`, `5097`, `5140`, `5162`;
  - không tái suy luận lên trên: `5194`, `5223`, `5273`, `5302`;
  - lọc `resultKind` / inline: `5536`, `5560`, `5606`;
  - claim trần, constraints: `553`, `1169`.
- **Rigor** (`test/runner/assignment-policy.test.mjs`): `68` (risk cao không hạ), `653`, `678` (sàn capability), `701` (tier chỉ nâng), `731` (low tường minh → nano; đường unit-run sẽ nâng lên standard, xem Spec delta), `825` (`work.rigor` quyết tier). Thêm `test/runner/dispatch-policy-baseline-snapshot.test.mjs`.
- **runUnit**: `test/runner/execution/{run,run-herdr,run-posture,run-provider-failover,bind}.test.mjs`.
- **Call-site**: `test/architecture.test.mjs:300-337`.

## Spec delta (L7/Lead áp khi merge 10/11)

- `runner.md` RUL73: runUnit nhận `declared` (operations là object của step) và `pinInputs`; `dispatchBound` stamp operation qua normalizer; Unit có `declared` chỉ chạy `solo`, mutation khớp `writes`.
- Bằng chứng plan: `inputDigests[{path, root, rel, sha256}]`; bên tiêu thụ so theo `rel` + digest; `planContentHash` chỉ còn để đọc kết quả cũ.
- Rigor: Work gộp nguồn 1-3; tầng thấp giữ sàn capability / override / `maxTier`; Unit có `rigor: low` được nâng lên `standard` bởi sàn của bind; `mutatingMinRigor` là key chưa có bên tiêu thụ.
- Walker verdict đọc cả layout phẳng lẫn lồng qua `listAssignmentRuns`.

## CHANGELOG delta

- (10) "Bước driver của Work (vd `fgos plan <id> --validate`) giờ chạy qua cùng ranh giới Unit với `fgos run`; kết quả cũ vẫn đọc được."
- (10) "Item `rigor: low` chạy qua Unit dùng tier `standard`."

## Còn để ngỏ

1. Lead chọn: `declaredOperationFields` do L10 thêm vào `assignment.mjs`, hay dựng tại chỗ trong `run.mjs` rồi để 11 gom.
2. Lead xếp chỗ sửa lỗi khoá resume `run.mjs:185-207`: L9, L10, hay item riêng.
3. UNPROVEN: herdr-spawn có tạo `stdout.log` không; `reasoningEffort` của policy có tới adapter không.

Status: DONE_WITH_CONCERNS
Summary: Đã có API cuối cho cả 10 câu, có bảng file × lane và danh sách test khoá hành vi; câu 8 đổi mặc định sang walker hiểu layout lồng (một đường đọc), câu 4 sửa mặc định (inputs vẫn tương đối).
Concerns: chờ Lead ghi "duyệt"; một lỗi thật ở khối khoá resume `run.mjs:185-207` cần người nhận; hai điểm UNPROVEN ở trên.
