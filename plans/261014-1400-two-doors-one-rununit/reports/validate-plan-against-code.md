# Validate plan 261014-1400 đối chiếu code và git (2026-10-14)

## Phạm vi và cách kiểm

- Đọc: `plan.md`, `protocol.md`, `phase-00..11`. Không mở lại quyết định owner/Lead.
- Đối chiếu với `main` = `f59ba9701` (main checkout, không checkout nhánh, không sửa code/plan).
- P00 được mô phỏng thật: clone `--shared` vào scratchpad, cherry-pick đúng danh sách hash của phase 00 theo thứ tự C → D → B, rồi chạy `node --test test/runner/operation-choice.test.mjs` trên cây kết quả. (Git máy là 2.34, không có `merge-tree --write-tree`.) Clone đã xoá sau khi kiểm.
- Mức: **High** = làm hỏng cổng/lệnh validate hoặc mâu thuẫn trực tiếp với test đang khoá hành vi; **Medium** = thiếu file/bước, guard có lỗ, hoặc lệch quy tắc repo; **Low** = trích dẫn sai, ghi chú.

## Kết quả đã xác nhận đúng

- Mọi hash trong plan đều tồn tại và nằm đúng nhánh: C `287ecf483 945f48006 3ca3b9cb7`; D `04e7b4c47 2bcc4006f 292be0f48 5bbfa5123 e9c946b39 54afd4665`; B `9f34239e2 b294c06ce 905aafc57 ef6fcb797 93c20ddfd`; lane A `cec1452a8 9fc8af4b2`; `af132275b` chỉ có trên `fix/dispatch-followups`; `53d92958a`/`dca2e62da` đã có trên main; `0b90ba11f` nằm trên `probe/doer-fgos-run`. Cả 4 nhánh lane đều tách từ `f69a446f0`; main chỉ hơn `5d18c357e`, `f59ba9701` (2 file watchdog).
- Mô phỏng P00: cả 3 nhánh vào được, **không có xung đột code**. Chỉ `CHANGELOG.md` xung đột (ở `e9c946b39` và `54afd4665`). Các xung đột plan dự đoán ở `settlement.mjs`, `assignment-runner.mjs`, `cli.mjs`, `run-result.mjs` đều tự merge được (vẫn cần `npm test` vì có thể có xung đột ngữ nghĩa).
- Sau C+D+B, `operation-choice.test.mjs` có 152 test, 148 pass, **đúng 4 fail** ở dòng 1208/1329/2776/5302, khớp phase 00 bước 2. `rg rollbackReadOnlyMutations src` → 0; `mode === 'confined'` trong `settlement.mjs` → 0.
- Thay đổi chưa commit trong worktree lane đúng như plan nói: D có lane-d report + `plans/261014-1045-dispatch-write-boundary/plan.md`; B có lane-b report; C, A và doer-probe sạch.
- Không có số RUL hay decision nào bị trùng: main có tới RUL80. `**RUL81` chỉ có trên `fix/dispatch-followups`, RUL84/85 chỉ có trên `feat/dispatch-write-boundary`. Decision cuối trên main là 0059 (`docs/specs/runner.md:3223`); không nhánh nào có 0060/0061.
- Các file:line sau đều đúng trên main:
  - `unit.mjs`: 7-16, 50-59, 111-119, 151-165.
  - `evidence-attribution.mjs:123-127`.
  - `definition.mjs`: 14-22, 282-295.
  - `commit-unit-work.mjs`: 48, 49, 61, 30-34.
  - `run.mjs`: 2, 164, 253, 361, 500, 534.
  - `bind.mjs`: 24, 139, 149-162, 390-409, 468; trong file không có chữ `quarant`.
  - `bin/fgos.mjs`: 2171-2185, 2497-2530, 2682-2685, ~4634.
  - `dispatch.mjs`: 37, 68, 70-71, 89-94.
  - `cli.mjs`: 314, 995/1021, 1119, 1173, 1676.
  - `assignment.mjs`: 396-402, 517, 897.
  - `settlement.mjs:656`, `effective-execution-contract.mjs:218`.
  - `assignment-runner.mjs`: 257, 1461, 1530-1541, 1798, 2670/2680.
  - `operation-choice.mjs`: 360, 792-802, 2161, 2205, 2217, 2232.
  - `loop.mjs`: 373-387, 978, 1077, 1107, 1505, 1614.
  - `work-dispatch.mjs`: 96, 257, 304, 315.
  - `step.mjs:73`, `command-registry.mjs:891-897`, `dispatch-decide-hook.mjs:28,70`.
  - `runner.md` 1020/1048/1077/1089/3070/3136/3149, `AGENTS.md:167`.
  - `executor-dispatch-fallback.md`: 85, 157.
  - `capability-matching.md:48`, `coding-worker-contract.md:8`, `fgos-fanout/SKILL.md:104,186`, `return-mechanics.md:21`, `fgos-run/SKILL.md:31`.
  - `test/architecture.test.mjs`: 193, 674-750.
- Đã xác nhận `--units` chưa có: `rg "flags.units|unitsPath" src bin` → 0.
- Install gate cho key mới là đúng hướng: `DEFAULT_RUNNER_CONFIG` đã đi vào setup qua `registerConfigDefault({key:'runner'})` (`src/setup/registrations.mjs:2396`). Doctor check có tiền lệ `checkRunnerPatternsConfig` (`registrations.mjs:502`).
- Capability `code:implement`, `architecture:critique`, `execute`, `code:review`, executor `openai`/`xai`, preset `core/workflows/council-lite.yaml` và script `npm run fgos:dev` đều có. Với posture read-only, `bind()` chọn invocation bwrap qua `resolvePostureInvocation` (`bind.mjs:242`, `confinement/policies.mjs:717`), nên kỳ vọng "one-liner read-only có sandbox" khả thi.

## Phát hiện mức High

### H1. Thư mục plan chưa được commit, nên lane và worktree probe không đọc được phase file

- Bằng chứng: `git status --short plans/261014-1400-two-doors-one-rununit` → `??` (untracked). Protocol tạo mọi worktree từ `main` (`git worktree add ... main`), nên worktree mới chỉ có trạng thái đã commit.
- Cổng G0/G1 bảo agent ghi `plans/261014-1400-two-doors-one-rununit/reports/g*-probe-*.md` trong `$WTP`. Lane phải đọc `protocol.md` và phase file của mình. Cả hai đều không có trong worktree.
- Sửa: Lead commit thư mục plan lên main trước W0 (`git commit -- plans/261014-1400-two-doors-one-rununit`). Mỗi đợt cũng commit báo cáo lane và cổng trước khi tạo worktree đợt sau.

### H2. P06 thêm verb mới `fgos fanout-batch` nhưng bỏ sót bảng route của Rust host

- Bằng chứng:
  - Rust host nhúng `packages/host-runtime/contracts/command-routes.json` lúc build (`apps/fgos/src/main.rs:23-25` `include_str!`).
  - Verb không có trong bảng bị từ chối với lỗi "unknown verb" (`main.rs:117-123`).
  - Bảng này sinh từ `COMMAND_REGISTRY` bằng `scripts/export-command-selectors.mjs`, kèm `command-route-annotations.json`.
  - `test/rust-host/command-routes.test.mjs:33` bắt số selector phải bằng `COMMAND_REGISTRY.length`.
  - Hiện chưa có key `fanout-batch`.
- Ảnh hưởng: phase-06 "Files" và bảng file dùng chung không có 2 file contract này. Cổng G2 bước 5 (`npm run fgos:dev -- fanout-batch ...`) sẽ báo unknown verb nếu chưa sinh lại bảng. `npm test` cũng đỏ ở `command-routes.test.mjs`.
- Sửa: thêm `packages/host-runtime/contracts/command-routes.json` và `command-route-annotations.json` vào sở hữu của L6. Thêm bước chạy `scripts/export-command-selectors.mjs` và ghi rõ host phải được build lại (`fgos:dev` tự build; release thì cần restage).

### H3. Luật subject conventional của P02 làm đỏ 4 test đang khoá subject cũ, trong khi phase ghi "không đổi kết quả"

- Bằng chứng: luật mới biến summary không conventional thành `chore(<unitId>): ...`. Các test hiện khoá subject cũ:
  - `test/runner/loop.test.mjs:1083-1087` mong `'item-nocommit: Produce the output file'`; loop truyền summary `${item.id}: ${item.title}` ở `loop.mjs:377`.
  - `test/runner/fanout-batch-runner-commit.test.mjs` mong `'cand1: Produce the file'`; xem `fanout-batch.mjs:122`.
  - `test/runner/execution/run.test.mjs:922` mong `'Added the feature file'`.
  - `test/runner/dispatch-confinement-backend-p03.test.mjs:1302` mong `'Added f\n'`.
- Mâu thuẫn: phase-02 bước 4 nói "chạy `loop.test.mjs` `fanout-batch-runner-commit.test.mjs` không đổi kết quả". Protocol thì cấm nới test mà không ghi lý do.
- Sửa: hoặc (a) chỉ áp fallback `chore(<id>)` trên đường `runUnit` (caller tầng Work truyền `subjectPolicy: 'verbatim'` cho tới 06/09), hoặc (b) ghi rõ 4 test này là thay đổi kỳ vọng có chủ đích, kèm lý do, trong Requirements của P02. Nên chọn (b) vì 06/09 sẽ đưa loop/fanout qua `runUnit` dù sao. Nhưng phải sửa câu "không đổi kết quả".

## Phát hiện mức Medium

### M1. P03 chỉ nối coverage ở một lời gọi, trong khi sau P00 settlement có hai lời gọi và một bộ so khớp thứ ba

- Bằng chứng (cây mô phỏng sau P00):
  - `settlement.mjs:713` là `attributeWorkspaceChanges(...)` cho evidence.
  - `settlement.mjs:734-738` là `evaluateAttributionPolicy({ attributions: attributeWorkspaceChanges({ postRunDirt: changedFiles }), ... })`. Lời gọi này quyết định các cảnh báo, và không truyền `writeScope`.
  - `evaluateAttributionPolicy` có bộ so khớp tiền tố riêng (`const inScope = (p) => writeScope.some(...)`, `evidence-attribution.mjs` sau P00), không qua `checkCoverage`.
- P03 req 3 chỉ nêu dòng ~656. P01 req 1 nói "một hàm duy nhất" cho stage/coverage/outOfScope nhưng bỏ sót `inScope` này. Đây là lỗ RUL11, và ca RT-R4-2 (`./docs` khác `docs/a.md`) vẫn có thể lệch ở cảnh báo.
- Sửa: P03 truyền `declaredCoverage` và `writeScope: assignment.writes` cho cả hai lời gọi, và thay `inScope` bằng `matchesWriteScope`. Cập nhật lại số dòng theo cây sau P00.

### M2. Đường provenance kiểm ở cổng G1 không tồn tại

- Bằng chứng: `bind()` ghi `provenance.executor = { value, source: candidateSource }` (`bind.mjs:413-414`). `candidateSource` chỉ là biến cục bộ, một giá trị cho cả pool (`bind.mjs:151-162`). `unit.json` thật (`.fgos/assignments/unit-run-1791960204216-f66d640b/unit.json`) có `bindings['producer/1'].binding.provenance.executor = {"value":"openai","source":"override"}`. Không có field `binding.provenance.candidateSource`.
- Ảnh hưởng: G1.1 và G1.4 kiểm `binding.provenance.candidateSource == 'unit-prefer'` sẽ luôn fail. Ngoài ra P04 req 2 ("mỗi ứng viên từ Unit mang dấu") cần đổi `candidateSource` thành dấu theo từng ứng viên; phase chưa nói rõ điều này.
- Sửa: kiểm `binding.provenance.executor.source == 'unit-prefer'`. P04 ghi rõ source lấy từ ứng viên được chọn (ví dụ thuộc tính `source` trên mỗi phần tử của `candidatePool`).

### M3. Đã có test liệt kê call-site của `executeAssignment`; P06 tạo test song song, còn P10 không sở hữu test đó

- Bằng chứng: `test/architecture.test.mjs:337-365` liệt kê mọi call-site `executeAssignment(` với `expectedFiles = {dispatch/cli.mjs, operation-choice.mjs, execution/run.mjs}` và `cliSites.length === 3`. Nhánh posture cho từng file nằm ở `:300-332`.
- Ảnh hưởng: P06 xoá 2 site của `cli.mjs` (`:1284`, `:1463`), test này đỏ. P10 bỏ site `operation-choice.mjs:2217`, test này cũng đỏ. P06 req 6 lại tạo một test "call-site" mới (trái RUL11). P10 chỉ được sửa "allowlist".
- Sửa: P06 mở rộng test `:337` (thêm `executeExecutorCli`, `commitUnitWork`, `executeThroughConfinement`) thay vì viết test mới. P10 ghi rõ việc sửa `expectedFiles` và nhánh `operation-choice` của `checkExecuteAssignmentCallSitePostures`.

### M4. Ba lane tự dựng `unitData` từ Work item

- Bằng chứng: P06 req 5 (fanout), P09 req 1 (`spawnWorker`) và P10 req 2 (driver) mỗi phase tự viết `{id, objective: buildPrompt(...), capability: <hint>, writes: ['**'], rigor, prefer: [executorIdForWork(...)]}`. Trong khi đó P06 chỉ được đọc `work-dispatch.mjs`, nơi helper chung nên nằm.
- Ảnh hưởng: ba bản dựng gần giống nhau, đúng mẫu "parallel reimplementation" (RUL11). Capability hint, rigor và prefer dễ lệch nhau giữa loop, fanout và driver.
- Sửa: một helper `workUnitFor(item, {feedback, operation?})` trong `src/runner/work-dispatch.mjs`. Giao cho L6 (merge trước 09/10 theo thứ tự 07 → 06 → 09 → 10) với quyền sửa đúng hàm đó; L9/L10 dùng lại. Cập nhật bảng lane × file.

### M5. P05 phụ thuộc vào `unit.mjs` của P04 sớm hơn chỗ plan ghi ("đuôi CLI")

- Bằng chứng: `units-source` chạy `validateUnit` cho mỗi Unit (P05 req 1). `validateUnit` hiện ném lỗi khi gặp `prefer` (`unit.mjs:7-16`, `:111-119`). Object trả về cũng không có `persona` (`unit.mjs:232-245` chỉ giữ một số field đã biết).
- Ảnh hưởng: các test bước 1-2 của P05 ("`prefer` giữ lại", "`unitData.prefer`/`persona`") không thể xanh trước khi 04 merge. Vậy 05 không song song thật với 04, và đường găng thiếu đoạn 05 → G1 (10 phụ thuộc G1).
- Sửa: ghi rõ P05 rebase lên 04 trước bước 1 (hoặc tách phần `unit.mjs` của 04 thành commit merge sớm). Đường găng: `00 → 01 → 02 → G0 → 04 → 05 (phần sau 04) → G1 → 10 → 11 → G3`.

### M6. Spec "supersede" ở W2/W3 chưa có decision ID; 0060 chỉ ra đời ở W4

- Bằng chứng: Spec delta của P02 ghi "supersede mục 1-2 của 0052", của P04 ghi "supersede một phần 0047 §1". Lead áp các delta này khi đóng W2/W3 (protocol, phase-03 "Merge W2", phase-05 G1). Nhưng decision 0060 chứa đúng các mục đó (phase-07 req 6c) lại do L7 viết ở W4. AGENTS.md: "Changing one supersedes its decision ID — never edit it in place".
- Ảnh hưởng: từ W2 tới W4, Lead hoặc phải sửa thân 0052/0047 tại chỗ, hoặc để spec nói ngược code (0052 vẫn ghi subject = summary, commit mọi thứ). Cả hai đều phạm luật hoặc L5 câu 6.
- Sửa: cấp decision ngay ở đợt đổi hành vi, ví dụ 0060 (commit theo `writes`, W2), 0061 (Unit `prefer`/one-liner/`--units`, W3), 0062 (xoá cửa, W4), 0063 (input generic, W5). Hoặc Lead viết một decision "đang thực hiện" ở W2 rồi 0060 ở W4 bổ sung. Đổi số cho phase-07 và phase-11 tương ứng.

### M7. Guard ngữ nghĩa của P11 có lỗ, và inventory của P08/P11 thiếu tham số `work` của `executeExecutorCli`

- Bằng chứng:
  - Regex `\bwork\.(rigor|domain|refs|docsRef|workflowStep|...)` không khớp optional chaining `work?.workflowStep` (`assignment.mjs:517`) hay `work?.id`.
  - `executeExecutorCli` (`dispatch/cli.mjs:362`) destructure `work` từ options (khoảng `cli.mjs:382`), đọc `!work` (`~:506`) và `work?.id` (`~:784`). `assignment-runner.mjs:2680` vẫn truyền `work: opts.work` vào hàm này.
  - Bảng inventory của phase-08 chỉ ghi `cli.mjs` 995-1058 và 1391.
- Sửa: regex `\bwork\??\.`, thêm phát hiện destructure `\{[^}]*\bwork\b[^}]*\}\s*=` trong `dispatch/**`. Đưa `executeExecutorCli`'s `work` vào P11 req 1 và inventory của spike 08.

### M8. Lệnh `rg` dọn doctrine của P07 bỏ sót dạng có ngoặc kép, và không tính render `.claude/skills/**`

- Bằng chứng: `core/skills/_shared/executor-dispatch-fallback.md:118` viết `node "$root/src/runner/dispatch.mjs" execute ...`, và `:165` viết `... dispatch.mjs" log ...`. Regex `dispatch\.mjs execute` không khớp `dispatch.mjs" execute`. Ngoài ra `.claude/skills/fgos-fanout/references/wave-dispatch-mechanics.md` và `.claude/skills/fgos-coding-implement/references/return-mechanics.md` là bản render được track (header "Generated by fgOS skill assembly") và cũng chứa cửa cũ.
- Ảnh hưởng: P07 bước 1 (test đỏ), bước 4 (`rg`) và cổng G2 bước 6 (`git status --short .agents plugins`) đều có thể báo sạch giả.
- Sửa: regex `dispatch\.mjs"?\s+(execute|log|fanout-batch)`; thêm `.claude/skills` vào danh sách render, vào `rg` và vào G2 bước 6.

### M9. Cổng G3 bước 3 và P10 req 6 gọi verb `fgos step`, nhưng verb này không tồn tại

- Bằng chứng: `bin/fgos.mjs` không có `case 'step'`, và `command-routes.json` không có key `step`. `src/verbs/state/step.mjs` export `discoverUseCase`/`planUseCase`, được gọi từ `case 'discover'` (`bin/fgos.mjs:1116`) và `case 'plan'` (`bin/fgos.mjs:1163`). Bước driver gọi `executeDriverOperationChoice` ở `step.mjs:73` là đường `planUseCase` với `validate`.
- Sửa: G3 bước 3 dùng `npm run fgos:dev -- plan <id> --validate` (kiểm lại cờ chính xác trong `command-registry.mjs`). P10 req 6 sửa "(`fgos step`)" thành "(`fgos plan --validate`)".

## Phát hiện mức Low

### L1. Đường dẫn test mới của P01

`test/runner/dispatch/` chưa tồn tại; repo dùng `test/runner/*.test.mjs` phẳng. Lệnh validate của P01 lại ghi cứng `test/runner/dispatch/write-scope.test.mjs`. Nên chốt `test/runner/write-scope.test.mjs` và sửa lệnh. (`scripts/run-tests.mjs` tìm test đệ quy, nên đặt ở đâu cũng chạy được.)

### L2. Bảng lane × file của plan.md (W1/L1) thiếu `src/workflow/definition.mjs`

Phase-01 "Files" có file này (khối writes). Cần thêm vào bảng tóm tắt.

### L3. P10 trích sai test hồi quy stale-plan

P10 bước 2 ghi "hồi quy cho `R6/G3 cross-pass` hiện có, dòng ~5302". Nhưng `operation-choice.test.mjs:5302` là test `mutatedDirtyBeforeFiles`, một trong 4 test của P00. Các test stale-plan thật nằm ở `:3140`, `:3193`, `:4622`, `:4686`, `:4710`, `:4807`. Riêng `:4710` ("recorded without a plan content hash is not consumed") phải còn đúng với cách đọc lùi `inputDigests ?? planContentHash`.

### L4. Hình dạng record ở P02 req 9

P02 req 9 ghi `bindings[<role>/<round>][n].commit`. Thực tế `unit.json` có `bindings['producer/1']` là object, trong đó có `commit` (record thật ở trên). Cần sửa mô tả cho đúng.

### L5. P07 req 9 nhắm sai hai file docs

- `docs/specs/reading-map.md` ghi theo thư mục, không liệt kê `dispatch-log.mjs`, nên không có gì để bỏ.
- `docs/doc-registry.md` có `generated: true`, không sửa tay. Sinh lại bằng generator, hoặc để nguyên vì các tiêu đề ở đó là tên knowledge entry lịch sử.

### L6. Rủi ro 2 của P01 trả lời được từ code ngay

- Phần trả lời được ngay: `validateRunnerConfigShape` (`dispatch/config.mjs:1438+`) không từ chối key lạ ở cấp `runner`, nên release cũ nhiều khả năng nhận `runner.generatedPaths` (bước 6 vẫn nên đo).
- Phần plan cần ghi thêm: `ensureRunnerConfigForDir` (`config.mjs:357-366`) sẽ **tự ghi** `generatedPaths: []` vào `.fgos/config.json` (file được track) ở lần chạy `fgos:dev` đầu tiên trong bất kỳ checkout nào, kể cả main checkout. Lead nên biết trước và commit dòng này trên main, không để nó thành diff lạ.

### L7. Lớp lỗi khi `definition.mjs` gọi `canonicalizeWrites`

`definition.mjs` đang ném `WorkflowDefinitionError`, còn `canonicalizeWriteEntry` ném `RunnerConfigError`. Khi `definition.mjs` gọi hàm mới, cần bọc lại để giữ lớp lỗi và nhãn `${unitLabel}`.

### L8. Phần còn lại của `fix/dispatch-followups` và lane A chưa có quyết định

`fix/dispatch-followups` còn `7cd8aa177` (tách test fgctl-init), `b00360ebe`, `e210bb725` chưa có trên main. P00 chỉ ghi loại `af132275b`. Commit docs của lane A (`f9606262e`, `3ee2271ad`) cũng không được nói tới. Nên ghi một dòng xử lý cho từng commit (lấy hay bỏ, vì sao).

### L9. `executeThroughConfinement` cần liệt kê tập được phép rõ ràng

Trong guard call-site (P06 req 6, P11 req 4), tập được gọi `executeThroughConfinement` phải ghi đích danh `dispatch/cli.mjs`, vì `executeExecutorCli` gọi nó ở `cli.mjs:631` và `:875`. Cụm "module transport/confinement" mơ hồ, guard sẽ đỏ hoặc tự hiểu sai.

### L10. Dấu `origin: 'units-file'` là field dữ liệu, giả được

P05 req 1-2 dùng `origin: 'units-file'` làm field trên định nghĩa. `startWorkflow({ workflow })` nhận định nghĩa trong bộ nhớ (`runner.mjs:783-785`) và state lưu lại định nghĩa qua event. Nên truyền nguồn như một tuỳ chọn của validator (`validateWorkflow(def, { source: 'units-file' })`), không phải field trong dữ liệu.

### L11. Kiểm "không tạo unit run" ở G1 bước 3 dễ sai

`ls .fgos/assignments | wc -l` dễ lệch khi phiên khác cũng chạy. Nên kiểm rằng không có thư mục `adhoc-*` mới, tạo sau mốc thời gian bắt đầu.

## Kiểm cổng G0-G3 với CLI

- **G0:** chạy được khi 02/03 xong. `fgos run --unit`, `--override`, `--worktree`, `workflow start <preset> --request --foreground` đều có (`bin/fgos.mjs:2682`, `:2171`). Vẫn cần H1 (thư mục plan có trong `$WTP`).
- **G1:** cú pháp `fgos run "<prompt>" --provider/--writes/--capability` và `workflow start --units` hiện chưa có; 04/05 xây (đúng như plan nói). Đường provenance sai (M2).
- **G2:** `fgos fanout-batch` cần bảng route (H2). `rg`/`git status` của doctrine bỏ sót (M8). Lệnh hook và `dispatch execute`/`log` chạy được (lỗi chỉ đường do 06 thêm).
- **G3:** `fgos step` không tồn tại (M9). `fgos-runner --once` có (`bin/fgos-runner.mjs:11`). Lệnh `rg` ở bước 1 chạy được.

## Kiểm phụ thuộc giữa các phase

- 05 phụ thuộc `unit.mjs` của 04 sớm hơn ghi (M5). 10 phụ thuộc G1, mà G1 cần 05, nên đường găng thiếu 05 → G1.
- P02 req 8 sao `needsWrites` từ claim, mà claim có giữ field này hay không lại do P03 lo (song song W2). Test `needsWrites` của P02 chỉ xanh sau khi 03 merge, hoặc phải có fixture tự đặt `agentClaim.needsWrites`.
- W4: thứ tự 07 → 06 → 09 → 10 hợp lý. Cần thêm quyền sửa test `:337` cho 10 (M3), và quyền giữ helper chung (M4).
- File dùng chung: không thấy hai lane song song sửa cùng một file trong cùng một đợt, theo bảng. Ngoại lệ là các file bị bỏ sót: `command-routes.json` (H2), `test/architecture.test.mjs:337` (M3), `.claude/skills/**` (M8), `definition.mjs` (L2).

## Install, setup, doctor, CHANGELOG, spec

- Key `runner.generatedPaths`: đi đúng qua `DEFAULT_RUNNER_CONFIG` → `registerConfigDefault`, doctor check mới ở `registrations.mjs` (đúng chỗ, vì `checks.mjs` chỉ re-export). Không đụng `~/.fgos/config.json`. Đạt (xem L6).
- Verb mới `fgos fanout-batch`: thiếu route contract (H2).
- CHANGELOG: người giữ theo đợt đã rõ (W0-W3 Lead, W4 L7, W5 L11), các thay đổi người dùng thấy đều có dòng.
- Supersede spec: dùng nhãn "[ĐÃ BỊ THAY ... bởi 0060]" và không viết lại thân rule là đúng khuôn RUL69/RUL76. Nhưng thời điểm cấp decision ID sai (M6).

## Sửa đề xuất theo thứ tự ưu tiên

1. Commit thư mục plan lên main trước W0 (H1).
2. P02: sửa câu "không đổi kết quả", liệt kê 4 test đổi kỳ vọng (H3).
3. P06: thêm `command-routes.json` + `command-route-annotations.json` và bước sinh lại (H2). Mở rộng test `:337` thay vì viết test mới (M3). Helper `workUnitFor` (M4).
4. P03: nối cả hai lời gọi attribution và thay `inScope` (M1).
5. P04/P05: sửa đường provenance (M2), ghi phụ thuộc 05 → 04 và đường găng (M5).
6. Cấp decision ID theo đợt (M6).
7. P11/P08: sửa regex và inventory (M7). P07: sửa regex, thêm `.claude/skills` (M8). G3/P10: dùng `fgos plan --validate` (M9).
8. Các mục Low khi sửa phase file.

Status: DONE_WITH_CONCERNS
Summary: Hash, nhánh và phần lớn file:line đều đúng; gom P00 theo C → D → B không xung đột code (chỉ CHANGELOG) và cho đúng 4 test đỏ như dự kiến. Có 3 High (plan chưa commit, thiếu route Rust cho `fgos fanout-batch`, subject conventional làm đỏ 4 test bị ghi là không đổi), 9 Medium, 11 Low.
