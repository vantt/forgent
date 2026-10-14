# Bản đồ các cửa dispatch executor (scout 2026-10-14)

Chỉ đọc, chạy trên main checkout `88315d5de` (2026-10-14). Mọi khẳng định đều kèm `file:line` hoặc commit. Chỗ nào chưa có bằng chứng thì ghi **UNPROVEN**. Số dòng là của main lúc quét; nhánh `fix/dispatch-followups` (chưa merge) được ghi riêng ở nơi nó làm đổi bức tranh.

## 1. Tóm tắt

- Một "cửa" trả lời ba câu hỏi: ai bắt đầu lượt chạy, ai chọn executor, và kết quả đi ra theo hợp đồng nào. Đếm theo nghĩa đó thì hôm nay có **9 cửa** người gọi đi vào được (mục 2). Bên dưới, chúng dồn về **3 tầng cài đặt**:
  1. `runUnit` (`src/runner/execution/run.mjs:151`): Unit cộng với `bind()`, có pattern, có failover khi provider hết hạn mức.
  2. `executeAssignment` (`src/runner/dispatch/assignment-runner.mjs:1301`): lease account, fallback, cổng mutating, posture, RunResult v2 cùng agent-result claim v2, settlement.
  3. `executeExecutorCli` (`src/runner/dispatch/cli.mjs:362`): tầng transport, kết quả thô. Riêng `spawnWorker` (`src/runner/work-dispatch.mjs:96`) không đi qua tầng này, nó gọi thẳng `executeThroughConfinement` (`work-dispatch.mjs:257`).
- Chỉ một chỗ được spec tuyên bố "một cửa" thật sự, và đó là cửa **giam giữ runtime**: `executeThroughConfinement` (`docs/specs/runner.md:2983-2987`, `docs/specs/confinement-authority.md:10,26`). Lời "một cửa chạy" cho việc mới, tức `fgos run`, nằm ở D-0047 (`docs/specs/runner.md:3070-3077`), ở `AGENTS.md:149` và ở plan P1 (`plans/261001-0327-request-to-run-p1-execution-core/plan.md:24`). Nhưng RUL68 lại cố ý giữ hai tầng (`docs/specs/runner.md:1048-1060`).
- **Prior art quan trọng nhất:** P3 phase 5 đã ghi rõ phải *xoá* `fgos dispatch execute <executor>` thường, đồng thời chuyển `spawnWorker` và fan-out sang `fgos run` (`plans/261001-0327-request-to-run-p3-workflow-separate-from-work/phase-05-cut-dispatch-work-imports.md:21`). Phase đó được đóng `done`, nhưng success criteria chỉ kiểm phần cắt import và xoá `dispatch-runs`. Thực tế commit `07bd0c594` và `ad9a23a9f` (2026-10-02) chỉ *dời* `spawnWorker` sang `src/runner/work-dispatch.mjs` và đổi `openDispatchRun` thành `openRunnerRun`, còn cửa thô vẫn sống. Ngày 2026-10-13, RUL76 rồi RUL77 còn *mở rộng* cửa thô thêm `--for <capability>`. Không tìm thấy ghi chép nào giải thích vì sao bỏ ý định xoá (**UNPROVEN**: bỏ có chủ đích hay bị sót).
- Trong 8 đề xuất, có 5 đề xuất (1, 2, 3, 7 và một phần của 8) là triệu chứng của cùng một chuyện: cửa thô `execute <agent> --for` thiếu năng lực mà tầng Assignment đã có. Đề xuất 4 (effort) là lỗ chung của **mọi** cửa. Đề xuất 5 và 6 là lỗ của tầng Assignment, hợp nhất cửa không tự giải được.

## 2. Danh mục cửa

| # | Cửa | Entry point | Ai gọi (bằng chứng) | Tầng bên dưới |
|---|---|---|---|---|
| D1 | `fgos dispatch execute <agent> --for <cap>` (cửa thô) | `cli.mjs:1523` → `executeExecutorCli` `cli.mjs:362` | `AGENTS.md:167` (luôn nạp: out-of-process → `fgos dispatch execute`); `core/skills/_shared/executor-dispatch-fallback.md:118-123` (Step B); Lead và người điều phối gọi tay | transport → `executeThroughConfinement` `cli.mjs:875` |
| D2 | `fgos dispatch execute --contract <file> [--executor <id>]` | `cli.mjs:1302-1480`, gọi `executeAssignment` ở `cli.mjs:1463` với `isReadOnlyMode: true` | fragment `executor-dispatch-fallback.md:123` (đường đọc giữ provider); cũng là đường lead dùng cho đọc có tên provider | Assignment → (herdr: `executeExecutorCli` `assignment-runner.mjs:2670`; cli-spawn: supervisor, `assignment-runner.mjs:2157`) |
| D2' | D2 cộng `--for <confined cap>` (RUL81) | chỉ có trên nhánh `fix/dispatch-followups`, commit `af132275b` (`contractPostureBinding`) | chưa có caller trên main | Assignment có binding read-only, có sandbox |
| D3 | `fgos dispatch execute --assignment <id>` | `cli.mjs:1217-1300`, `executeAssignment` ở `cli.mjs:1284` | engine cũ ("giữ cho engine tới P4", phase-05 P3:21); hôm nay không thấy caller sống trong `core/skills` (**UNPROVEN**: chưa quét hết `domains/`) | Assignment |
| D4 | `fgos run --unit <file>` / `--resume` | `bin/fgos.mjs:2650-2715` → `runUnit` `run.mjs:151` | `AGENTS.md:149` ("primary door"); skill `fgos-run` | `runUnit` → `executeAssignment` `run.mjs:373` |
| D5 | Workflow unit: `fgos workflow start --units/--plan` | `src/workflow/runner.mjs:482` → `runUnit` | `core/skills/fgos-run/SKILL.md:31,42`; panel kiến trúc (RUL77 trích `wf-run-1791875339761-10315b91`) | như D4 |
| D6 | `fgos run record` (producer inline) | `bin/fgos.mjs:2652-2680` → `recordInlineRun` `run.mjs:629` | `bind()` trả `mechanism: 'inline'` (`run.mjs:~430`, ghi `pending-inline.json`) | không spawn; phiên tự làm rồi ghi có nonce |
| D7 | Runner loop: `spawnWorker` | `work-dispatch.mjs:96`, gọi từ `loop.mjs:1077,1505` | `fgos-runner --once/--watch` | gọi thẳng `executeThroughConfinement` `work-dispatch.mjs:257`, **không** qua `executeExecutorCli` |
| D8 | Runner loop / `fgos step`: driver operation | `operation-choice.mjs:2161` → `executeAssignment` `operation-choice.mjs:2217` | `loop.mjs:978,1614`; `src/verbs/state/step.mjs:73` | Assignment |
| D9 | `dispatch fanout-batch` | `fanout-batch.mjs:37`, `executeExecutorCli` ở `fanout-batch.mjs:106` | `core/skills/fgos-fanout/references/wave-dispatch-mechanics.md:47-56` | transport (như D1, nhưng không có `requireCapability`) |
| D10 | `dispatch probe-account` (chẩn đoán) | `cli.mjs:1600-1650` → `executeAssignment` | người vận hành (RUL79, `runner.md:1097`) | Assignment, binding read-only |
| D11 | In-process: Agent/Task tool sau `decide` | `decideExecutorCli` `cli.mjs:983`; hook `scripts/dispatch-decide-hook.mjs` | `AGENTS.md:166`; fragment `executor-dispatch-fallback.md:74-77` | không có cái nào của fgOS: harness tự chạy |

herdr round (`herdr-round.mjs:1377`, `runHerdrRound`) **không phải cửa**. Nó là adapter `herdr-spawn`, được `executeThroughConfinement` chọn (`transport.mjs:843`). Các cửa D1, D2, D4, D5, D7 và D9 đều có thể rơi vào herdr khi invocation là `herdr-spawn`. Cửa coordination (`fgos coordination run`) đã thu hồi ở P4 (`docs/specs/runner.md:1331`), `src/verbs/coordination` không còn. Gateway không có cửa thực thi: grep `apps/fgos-gateway/src` không ra `dispatch` hay `runUnit`.

## 3. Hợp đồng từng cửa

Ký hiệu: ✓ có, ✗ không, ~ có một phần hoặc làm khác.

| Năng lực | D1 thô | D2 `--contract` | D4/D5 `fgos run`/workflow | D7 `spawnWorker` | D9 fanout | D11 in-process |
|---|---|---|---|---|---|---|
| **Input** | `--prompt`/`--prompt-file` thô (`cli.mjs:1482-1494`) | file execution-contract (ADR-006 §4) dựng thành Assignment inline (`cli.mjs:1404-1420`) | Unit (`run.mjs` + `execution/unit.mjs`) | Work item → `buildPrompt` (`work-dispatch.mjs:113`) | Work item (`fanout-batch.mjs:107`) | prompt của harness |
| **Prompt có dặn ghi claim** | ✗: prompt thô, không render brief | ✓ `renderAssignmentPrompt` (`assignment-runner.mjs:58`) | ✓ (Assignment) | ✗ | ✗ | ✗ |
| **Output** | `{mechanism, status, signal, stdout, stderr, tier, model, provider, command, outcome?, verifiedSha?}`, `buildDispatchResult` `result-ladder.mjs:41-74`, phán bằng token `[DONE]/[BLOCKED]` | RunResult v2 (`settlement.mjs:810`, `normalizeRunResultV2`) | `{outcome, runResult, binding}` (`run.mjs:394-400`) | kết quả thô + attestation (`work-dispatch.mjs:262-276`) | `{fired:[{status,signal,errorClass}]}` (`fanout-batch.mjs:132-140`) | câu trả lời của tool |
| **Agent-result claim v2** (`agent-result-claim-contract.mjs:5-11`) | ✗ | ✓ `validateAgentResultClaim` (`settlement.mjs:523`) | ✓ | ✗ | ✗ | ✗ |
| **Evidence trên đĩa** | ~ chỉ `runs/01/run.json` status (`openRunnerRun` `cli.mjs:200-221`); không có `result.json`/`evidence.json` | ✓ stdout.log, stderr.log, exit.json, evidence.json, result.json (`assignment-runner.mjs:8`, `settlement.mjs:510,658`) | ✓ như D2, cộng `unit.json` | ~ `run.json` + `.fgos/logs/<id>.log` (`loop.mjs:1089,1147`) | ~ như D1 | ✗ |
| **Sự kiện `executor.dispatch`** (Work log) | ✗: phải gọi tay `dispatch log` (`dispatch.mjs:111`, fragment Step B.5 `executor-dispatch-fallback.md:157-190`) | ✗ (không ghi; lõi dispatch bị cấm import `src/state`, D-0049 §3) | ✗ (cùng lý do) | ✓ tự ghi (`loop.mjs:1102-1115`) | ✗ | ✗ (fragment chỉ bắt log cho out-of-process) |
| **Confinement (RUL76/77)** | ~ qua `executeThroughConfinement`; capability `required` bị từ chối trước spawn (`posture-needs-assignment`, `cli.mjs:293-300`) → chỉ chạy được ghi không sandbox | ✗ không posture: posture chỉ áp khi Assignment có `binding` (`assignment-runner.mjs:1477-1479`), mà Assignment inline không có. "Read-only bằng lời dặn" (RUL77 `runner.md:1089`). Nhánh followups thêm D2' có sandbox (`af132275b`) | ✓ `bind()` → posture → `resolvePosture` (D-0047 §5, D-0050) | ~ qua Authority theo capability của stage | ~ như D1 | ✗ |
| **Lease account / fallback provider** | ✗ (RUL68 `runner.md:1048`; `cli.mjs:294-296`) | ✓ lease `assignment-runner.mjs:1711`; fallback `attemptProviderCapacityFallback` `:1093` | ✓ cộng failover pane mới `bind().nextCandidate` khi `provider-limit` (`run.mjs:465-516`) | ✗ (`loop.mjs:1077` không truyền `providerCapacity`) | ✗ | ✗ |
| **Ghim provider** | ✓ executor theo vị trí | ✓ `--executor` → `cliOverride.preferExecutor` (`cli.mjs:1459`) | ~ qua `--override` / `bind()` | ✗ (theo stage) | ✗ | ~ agentType |
| **Phân loại outcome auth/quota/sandbox** | ✗: không gọi `classifyProviderCapacityFault`, không gọi `matchAuthFailureLine`; chỉ có `outcome` do adapter herdr báo (`result-ladder.mjs:53`) | ~ classifier chỉ chạy **khi lease đã chọn** (`settlement.mjs:600-601`); dead-credential theo đuôi stderr (`settlement.mjs:590-597`); classifier openai chỉ đọc **stderr** (`provider-capacity.mjs:1193,1210`) | ✓ như D2 cộng `outcomeOfRunResult` → `provider-limit` → walk (`unit-run-history.mjs:18-33`) | ✗ | ✗ | ✗ |
| **Kiểm "ghi ra ngoài workspace"** | ✓ cứng: `watchWritesOutsideWorkspace` `cli.mjs:785` → `strayWriteError` `cli.mjs:883-886` | ~ chỉ khi adapter là herdr (đi qua `executeExecutorCli`); cli-spawn đi supervisor (`assignment-runner.mjs:2157`), **không** kiểm. Settlement có `attributeWorkspaceChanges` nhưng chỉ cho `effectiveCwd` (`settlement.mjs:656`) | ~ như D2 | ✓ cứng (`work-dispatch.mjs:169,265-268`) | ✓ (như D1) | ✗ |
| **Khoá per-cwd** | ✓ `cli.mjs:717-726` | ✓ cli-spawn `assignment-runner.mjs:2251`; herdr qua `executeExecutorCli` | ✓ | ✗ (**UNPROVEN**: không thấy khoá trong `spawnWorker`; loop có thể khoá theo worktree riêng) | ✓ | ✗ |
| **Cờ model / tier** | `--model`, `--tier` (`cli.mjs:1533-1534`) | `--model`, `--tier`, `--executor` (`cli.mjs:1456-1459`) | `--override` JSON (`bin/fgos.mjs:2689-2700`) | config | ✗ | harness |
| **Cờ timeout** | `--timeout-ms`, `--idle-timeout-ms` (`cli.mjs:1508-1517`) | ✗ (không parse ở nhánh contract) | ✗ (**UNPROVEN**: chưa thấy trong `fgos run`) | config | ✗ | harness |
| **Effort** | ✗ | ✗: `cliOverride.reasoningEffort` được tính ở `assignment-policy.mjs:349-360` nhưng **không CLI nào set**, và argv chỉ thay `{prompt}`/`{model}` (`transport.mjs:169-174`). `provider-adapter.mjs:307` có xử lý effort nhưng chỉ chạy ở binder bóng của họ claude (`transport.mjs:184-200`) và không nhận runtimeOptions | ✗ (như D2) | ✗ | ✗ | harness |
| **Cảnh báo model lệch** | ✗ | ~ `effectivePolicy` có ghi nguồn model (dispatch-plan.json); không cảnh báo khi CLI bỏ qua (**UNPROVEN**) | ~ như D2, cộng `binding.provenance` | ✗ | ✗ | ✗ |

## 4. Spec nói gì về "cửa chuẩn"

1. **Việc mới đi `fgos run`.** D-0047 §3: "Một cửa chạy `fgos run` … Bọc `executeAssignment`" (`docs/specs/runner.md:3077`). Plan P1 đặt chủ duy nhất của "chạy qua cửa nào cho việc mới" là `fgos run` → `executeAssignment` (`plans/261001-0327-request-to-run-p1-execution-core/plan.md:24`). `AGENTS.md:149` nói "`fgos run` is the primary door". Chữ "cho việc mới" chừa chỗ cho các cửa cũ.
2. **Giam giữ chỉ có một cửa**, và cửa này có test kiến trúc giữ: `executeThroughConfinement` (`docs/specs/runner.md:2985-2987`, `test/architecture.test.mjs` theo spec). Mọi cửa D1–D9 đều qua nó, nên đây là điểm duy nhất thật sự "một cửa".
3. **RUL68 giữ hai tầng có chủ đích** (`runner.md:1048`): tầng Assignment có lease và fallback; purpose door (`executeExecutorCli`/`spawnWorker`) "không lease, không fallback, theo THIẾT KẾ", vì RUL11 không muốn dựng thêm một cơ chế song song. Lý do không gộp `spawnWorker` (`runner.md:1056`): purpose door là primitive không phụ thuộc Work item, và chỉ gộp khi việc gắn Work-lifecycle vào dispatch thật sự được xây.
4. **RUL77 tự đặt quy tắc "mỗi cửa một lane posture"** (`runner.md:1089`): cửa thô chỉ chở việc ghi; việc đọc có sandbox đi Workflow unit; `--contract` giữ provider nhưng không sandbox. RUL77 tự ghi lỗ: "A sandboxed read-only door that also keeps a named provider does not exist yet". RUL81 trên nhánh followups lấp lỗ đó bằng một biến thể cửa thứ tư.
5. **Mâu thuẫn trong lớp luôn nạp:** `AGENTS.md:149` nói `fgos run` là cửa chính, nhưng `AGENTS.md:167` lại bảo out-of-process thì chạy `fgos dispatch execute`. Fragment fallback cũng hướng mọi skill vào D1 rồi B.5 (`executor-dispatch-fallback.md:85-190`). Hệ quả: agent được dạy đi cửa thô, trong khi cửa thô là cửa có ít năng lực nhất.
6. `docs/routing-handoff-contract.md` và `docs/platform-foundations.md` không có câu "một cửa dispatch". "Một cửa" ở đó là cửa **ghi** state (RUL3, `platform-foundations.md:66,135`), không phải cửa chạy (grep không ra).

Kết luận cho mục 1: spec **có** tuyên bố một cửa chạy cho việc mới (D-0047/P1, `AGENTS.md:149`), nhưng cùng lúc hợp thức hoá cửa thô như "tầng dưới" (RUL68) rồi như "lane ghi" (RUL77). Không có điều luật nào nói cửa thô phải nhận cùng hợp đồng output, log và phân loại như tầng trên.

## 5. Prior art: các cửa ra đời khi nào, vì sao, và kế hoạch hợp nhất đã bị bỏ

| Ngày | Commit | Sự kiện |
|---|---|---|
| 2026-07-14 | `91accdf3c` | `spawnWorker`: runner tự dispatch work item (phase-2-routing-7) |
| 2026-08-09 | `7508a8484` | `log` (`logCapacityDispatch`): ghi audit cho lượt **in-session**, "since loop.mjs's own event only fires from the async claim/dispatch cycle". Log sinh ra cho D11, không phải cho out-of-process |
| 2026-08-14 | `04a07f610` | `execute` (`executeCapacityCli`): self-execution out-of-process (tsk-5tm-3 D5). Log không gộp vào đây |
| 2026-08-17 | `a989211aa` | đổi tên capacity → executor (`executeExecutorCli`, `logExecutorDispatch`) |
| 2026-08-20 | `439dc2199` | `fanout-batch` gom vòng fan-out vào dispatch |
| 2026-08-28 | `b72496302` | `executeAssignment` + RunResult (team-dispatch) |
| 2026-09-01 | `7abe80c47` | `--contract`: "its own dispatch door" (ADR-007 R3), Assignment inline, không Work, read-only |
| 2026-09-08 | `819a61e55` | `watchWritesOutsideWorkspace`: từ chối lượt báo xong mà ghi sai checkout |
| 2026-09-10 | `cae56bfce` | Confinement Authority, "một cửa runtime" |
| 2026-09-15/16 | `1904655fe`, `ec6a0745d` | RunResult v2; provider capacity rotator (classifier, quarantine), gắn vào settlement của Assignment |
| 2026-09-26 | `f4d6fb708` | tách `dispatch-log.mjs` khỏi lõi dispatch (ranh giới không import Work) |
| 2026-10-01 | `073c8b6fc` | `fgos run` / `runUnit` (P1 phase 5) |
| 2026-10-02 | `07bd0c594`, `ad9a23a9f` | P3b: dời `spawnWorker` sang `work-dispatch.mjs`, `openDispatchRun` → `openRunnerRun`. **Không** xoá cửa thô |
| 2026-10-13 | `fe3edf371`, `0990a010a` | RUL76 → RUL77: cửa thô có thêm `--for <capability>`, `capability-required`, `posture-needs-assignment` |
| 2026-10-14 | `af132275b` (nhánh) | RUL81: D2' contract có sandbox |

**Kế hoạch hợp nhất từng có rồi bị bỏ:**

1. P1 phase 5 ban đầu định xoá `openDispatchRun` cùng `execute <executor>` thường. Red-team chỉ ra xoá ngay sẽ làm gãy `fgos-runner --watch` và fan-out (`plans/261001-0327-request-to-run-track/reports/red-team-assumption-destroyer.md:30-37`, `red-team-adjudication.md:22`: Accept). Vì vậy P1 chỉ "không dùng cho việc mới; xoá ở P3 phase 5" (`phase-05-run-door.md:24`).
2. P3 phase 5 ghi đúng yêu cầu: chuyển `spawnWorker` và fan-out sang `fgos run`, xoá `execute <executor>` thường (`phase-05-cut-dispatch-work-imports.md:20-21`). Ba success criteria của phase này (`:36-38`) **không** có tiêu chí nào cho phần xoá cửa hay phần chuyển sang `fgos run`, nên phase đóng `done` khi chỉ phần import và `dispatch-runs` xong. Commit `ad9a23a9f` không đụng `fanout-batch.mjs` hay phần spawn của `loop.mjs` (`git show --stat`). **UNPROVEN**: phần bỏ dở này là quyết định có chủ đích hay bị sót. Không thấy record nào trong "Lịch sử quyết định" hay acceptance (`plans/261001-0327-request-to-run-track/reports/acceptance.md` không nhắc `execute <`).
3. Sau P3, RUL68 (`runner.md:1056`) hợp thức hoá việc giữ purpose door, với lý do "không phụ thuộc Work item". Lý do đó đúng với `spawnWorker`, nhưng **không** áp cho D1: D1 không phụ thuộc Work, đúng như `fgos run` cũng không.
4. `plans/260930-1235-readonly-invocation-redesign` đã xong (`plan.md` Trạng thái: gộp vào P1/P6). `plans/260930-0335-measure-runresult-classification-impact` còn `pending`, đang chờ bake. Plan này đo `classification.outcome.category`, mà chỉ cửa Assignment sinh ra trường đó; các lượt qua D1/D7/D9 nằm ngoài mẫu đo (**UNPROVEN** về tỷ trọng).

## 6. Danh sách lệch cụ thể giữa các cửa

1. **Hợp đồng output có hai định dạng.** Một là RunResult v2 có `agentClaim.summary` (`settlement.mjs:523,810`; `run-result.mjs:249-250`), hai là JSON thô có token `[DONE]` (`result-ladder.mjs:41-74`). D1 và D9 trả định dạng thứ hai, D2/D4/D5/D8/D10 trả định dạng thứ nhất.
2. **Log có ba chế độ:** tự ghi (`loop.mjs:1102`), ghi tay (`dispatch.mjs:111`, fragment B.5), và không ghi Work event, chỉ có store `.fgos/assignments` (D2/D4/D5). Gốc rễ là lõi dispatch bị cấm import `src/state` (D-0049 §3, `f4d6fb708`), nên chỉ caller ở tầng Work tự ghi được.
3. **stdout bị lặp:** D1 tee mọi chunk của executor ra stderr (`cli.mjs:1535`) rồi in lại toàn bộ `stdout` trong JSON cuối (`cli.mjs:1539`). Fragment còn dặn `2>&1 | grep ... '^\{'` (`executor-dispatch-fallback.md:118`). Hai điều đó cộng lại là cơ chế đủ để câu cuối hiện hai lần. Đây là suy luận từ code, **UNPROVEN** trên một transcript thật; cũng **UNPROVEN** việc Codex tự in câu cuối hai lần.
4. **Phân loại hạn mức:** D1/D7/D9 không có. D2/D4 chỉ có khi lease đã chọn được account (`settlement.mjs:600`), nên máy không có inventory thì không ai phân loại. Classifier openai chỉ đọc stderr (`provider-capacity.mjs:1193,1210`). **UNPROVEN**: Codex in thông báo usage limit ra stdout hay stderr, và exit code của lượt đó.
5. **Lỗ trong kiểm "ghi ra ngoài":** có ở D1/D7/D9 và ở D2/D4 khi chạy herdr; **không** có ở D2/D4 khi chạy cli-spawn qua supervisor (`assignment-runner.mjs:2157` so với `:2670`). Cách kiểm là diff `git status` của main trước và sau (`cli.mjs:161-184`), không phân biệt được tiến trình nào ghi. Comment ở `cli.mjs:152-156` thừa nhận đây chỉ là "EVIDENCE, not proof". Trong khi đó `evidence-attribution.mjs:10-33` đã có thang `proven/correlated/excluded/unattributed` mà kiểm stray không dùng.
6. **Posture:** D2 (main) không có posture vì không có `binding` (`assignment-runner.mjs:1477`). D1 từ chối mọi capability `required` (`cli.mjs:293-300`). Chỉ D4/D5/D10 (và D2' trên nhánh) chạy read-only có sandbox kèm login.
7. **Effort:** không cửa nào đưa effort tới argv (`transport.mjs:169-174`). Giá trị `reasoningEffort` được tính ra (`assignment-policy.mjs:349-360`, có cả nguồn `cliOverride`) rồi bỏ đó. Effort hiện chỉ nằm cứng trong `args` của từng invocation (`assignment-policy.mjs:65`, comment).
8. **Cờ không đồng bộ:** timeout chỉ có ở D1; `--executor` chỉ có ở D2/D3; `--override` chỉ có ở D4. Bộ phát hiện cờ trùng chỉ kiểm `--executor/--model/--tier` (`cli.mjs:1155-1171`).
9. **Khoá per-cwd:** `spawnWorker` không lấy khoá dispatch per-cwd (**UNPROVEN**, xem bảng 3).
10. **Mâu thuẫn hướng dẫn:** xem mục 4.5 (`AGENTS.md:149` so với `:167`).

## 7. Tám đề xuất soi theo cửa

| # | Đề xuất (lane) | Triệu chứng của cửa nào thiếu gì | Cửa nào đã có | Biến mất nếu hợp nhất? |
|---|---|---|---|---|
| 1 | Tự ghi log / `log --plan` (A) | D1 (và D9, D11) không tự ghi audit; log là đắp vá cho in-session (`7508a8484`) bị dùng lại cho out-of-process | D7 tự ghi (`loop.mjs:1102`); D2/D4 có store `.fgos/assignments/…` với `result.json`/`evidence.json` | **Có, phần lớn.** Nếu D1 đi qua Assignment thì evidence bền tự có; cái còn thiếu chỉ là gắn plan/work id, tức một trường provenance của Assignment, không cần một verb log. Event `executor.dispatch` trong Work log là câu hỏi riêng (ranh giới A4) |
| 2 | Help nói rõ log (A) | hệ quả của #1 | — | **Có**, nếu #1 biến mất |
| 3 | `finalMessage` / câu cuối lặp (A) | D1 không có claim nên Lead phải lọc stdout; stdout bị lặp do tee cộng JSON (`cli.mjs:1535,1539`) | D2/D4: `agentClaim.summary` | **Có.** Đúng như anh đã chỉnh 2026-10-14: không cần trường mới |
| 4 | `--effort` (B) | **mọi cửa**: effort không tới argv (`transport.mjs:169-174`); `cliOverride.reasoningEffort` không có CLI | không cửa nào | **Không.** Phải làm ở tầng chung (`resolveExecutorCommand`/ProviderAdapter), đúng như brief B. Hợp nhất chỉ làm số chỗ parse cờ còn lại một |
| 5 | Cảnh báo model lệch (B) | mọi cửa; D1 thiếu cả provenance nguồn model | D2/D4 có `effectivePolicy`/`binding.provenance` nhưng không cảnh báo | **Không**, nhưng hợp nhất cho chỗ đặt sẵn (provenance trong RunResult) thay vì chế thêm field cho JSON thô |
| 6 | Docs-only confined (D) | D1 chỉ có lane "ghi không sandbox" (RUL77); D4/D5 có `writes: [...]` nhưng posture chỉ có `read-only`/`workspace-write` (`assignment-runner.mjs:1477-1479`, D-0050) | chưa cửa nào có posture "ghi hẹp theo glob" (**UNPROVEN**: chưa đọc hết `confinement/policies.mjs`) | **Không.** Nhưng câu hỏi đổi hẳn: không phải "thêm cờ cho D1" mà là "Unit `writes: [plans/**]` có nên thành một posture được thi hành không". Nếu hợp nhất về D4 thì đề xuất 6 trở thành một posture mới trong `bind()`/`resolvePosture` |
| 7 | Usage limit → trạng thái riêng, giờ thử lại, tự hẹn (C) | D1 không có classifier (exit 0 nghĩa là xong); D2/D4 chỉ phân loại khi đã lease (`settlement.mjs:600`) | D4/D5: `provider-limit` dẫn tới walk sang candidate khác (`run.mjs:465-516`); quarantine có `until` (`provider-capacity.mjs:1156,1206`) | **Phần lớn có.** Trạng thái riêng và giờ thử lại đã có ở tầng Assignment (quarantine `until`, outcome `provider-limit`). Phần còn thiếu thật ở cả tầng trên: (a) phân loại khi không có lease, (b) đọc stdout, (c) "tự hẹn chạy lại", câu hỏi của Workflow runner chứ không phải của dispatch |
| 8 | Báo nhầm "ghi ra ngoài workspace" (D) | kiểm stray bằng diff main (`cli.mjs:161-184`) ở D1/D7/D9/herdr-Assignment, không dùng thang attribution | `evidence-attribution.mjs` có thang `correlated`/`proven` nhưng chỉ cho cwd | **Không tự biến mất** (vì có cả trong `spawnWorker` và herdr-Assignment), nhưng hợp nhất làm số chỗ sửa còn **một** (settlement), thay vì ba (`cli.mjs:785`, `work-dispatch.mjs:169`, cộng lỗ ở supervisor cli-spawn) |

Gọn lại: hợp nhất D1 vào tầng Assignment, hoặc cho D1 trả RunResult, thì **1, 2, 3 biến mất**; **7** co lại còn "phân loại khi không lease và đọc stdout"; **8** co về một chỗ. **4, 5, 6** vẫn còn và phải làm ở tầng chung.

## 8. Câu hỏi cho hội đồng

1. **Cửa thô D1 nên xoá, bọc, hay giữ?** Xoá nghĩa là làm nốt P3 phase 5 (`phase-05…:21`). Bọc nghĩa là D1 dựng một Assignment inline mutating, có lease và RunResult, giữ cú pháp `execute <agent> --for`. Giữ thì phải nâng D1 lên cùng hợp đồng output, log và phân loại. Lý do RUL68 "không phụ thuộc Work" có còn áp cho D1 không, khi chính `fgos run` cũng không phụ thuộc Work?
2. **Một hợp đồng output duy nhất là gì?** RunResult v2 cộng claim v2 cho mọi cửa out-of-process (kể cả `spawnWorker`/fanout), hay chấp nhận hai lớp kèm một adapter chuyển? Ai sở hữu "câu báo cáo cuối" cho Lead?
3. **Lane posture:** RUL77 chia "mỗi cửa một lane", RUL81 thêm biến thể thứ tư. Có nên đảo lại thành "một cửa, posture lấy từ capability hay Unit `writes`" (đúng ý D-0047 §5), và coi "ghi hẹp docs/plans" (đề xuất 6) là một posture thay vì một cửa?
4. **Ai ghi audit `executor.dispatch` khi lõi dispatch bị cấm import Work?** Có nên thay sự kiện này bằng store `.fgos/assignments` (đã bền, đã có reader), rồi bỏ verb `log` cho out-of-process?
5. **Phân loại hạn mức không có lease:** classifier nên chạy ở settlement cho mọi lượt (kể cả khi không có inventory account, và đọc cả stdout), hay chỉ khi lease, như hiện tại? "Tự hẹn chạy lại" thuộc Workflow runner hay dispatch?
6. **Kiểm "ghi ra ngoài":** chuyển về settlement dùng thang `evidence-attribution` (`correlated` thì cảnh báo, `proven` thì từ chối, chỉ khi confinement có attestation) cho mọi adapter, kể cả cli-spawn supervisor đang không kiểm. Hay giữ từ chối cứng ở transport?
