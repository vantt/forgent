# Lane B — `--effort` và cảnh báo model

- Worktree: `/home/vantt/projects/forgentX-worktrees/dispatch-effort-model`
- Nhánh: `feat/dispatch-effort-model`, rebase lên main `f69a446f0` (kết luận hội đồng một-cửa; 2026-10-14, không xung đột)
- Commit code: `9f34239e2` (effort ở tầng transport chung + kiểm model), `ef6fcb797` (theo hội đồng: `--effort` là override của `bind()`, model drift thành provenance của RunResult) feat(dispatch): set reasoning effort per dispatch and warn when the model that ran differs
- Chưa merge, chưa push.
- Ràng buộc Lead (10:45): logic đặt ở tầng chung (`provider-adapter.mjs`, `resolveExecutorCommand`/`resolve.mjs`), cửa chỉ parse cờ — đã làm theo (xem "Thiết kế").

## Prior art

- `provider-adapter.mjs`: có `supportsEffort()`, `KNOWN_POLICY_SHAPED_FLAGS` (`--effort` là cờ policy) nhưng chỉ chạy shadow; binder production `resolveVerifiedProviderArgs` chỉ so argv cho claude, không bao giờ truyền runtimeOptions → effort chưa từng tới argv.
- `assignment-policy.mjs` (~349): đã có `cliOverride.reasoningEffort` + validate theo `REASONING_EFFORT_VALUES`, tính `reasoningEffort` (explicit hoặc suy từ rigor) vào policy — nhưng không consumer nào render nó. `rg reasoningEffort src/` xác nhận.
- `config.mjs`: `supports.reasoningEffort` được kiểm shape lúc load (claude khai `[low, medium, high]`), không ai dùng lúc dispatch.
- Pane "Lead handoff 261013" chỉnh effort bằng cách sửa `~/.codex-fgovn/config.toml` (`model_reasoning_effort`, mtime 2026-10-13 18:09) — không có commit repo. `git log -G'effort' --since=2026-10-10` chỉ ra các commit không liên quan (council postures, credential).
- Dùng lại: từ vựng `REASONING_EFFORT_VALUES`, `supports.reasoningEffort`, đường `cliOverride.reasoningEffort` của assignment-policy. Thiếu: render vào argv, cờ CLI, kiểm theo `supports`, mọi thứ về model thật.

## Cập nhật sau hội đồng một-cửa

Theo `reports/council-261014-1231-dispatch-one-door-conclusion.md` và mục cập nhật của brief lane B:

- **`--effort` là override của `bind()`** (cửa chuẩn `fgos run`): `bin/fgos.mjs` parse `--effort` một lần thành `{reasoningEffort, origin:'human-cli'}` gộp vào `overrides` (hoặc khoá `reasoningEffort` trong `--override`). `bind()` kiểm bằng `assertReasoningEffort` với `supports.reasoningEffort` của executor được bind → mức không hợp lệ thành binding bị từ chối `reasoning-effort` (`policy-refusal`, chưa spawn); hợp lệ thì ghi `binding.reasoningEffort` + `provenance.reasoningEffort {value, source: override:<origin>}`. `dispatchBound` chuyển vào `cliOverride.reasoningEffort` → policy (`explicitReasoningEffort`) → `resolveExecutorCommand` render. Kiểm lại binding của `assignment-runner` dựng lại từ `unitRecord.overrides` nên khớp.
- **Model drift là provenance trong RunResult v3**: `settlement.mjs withLaunchProvenance` ghi `policy.provenance.modelDrift = {value: [...], source: 'launch-and-provider-output'}` và `policy.provenance.reasoningEffort.rendered`. Gỡ hai field top-level khỏi `run-result.mjs`.
- Cửa compat `dispatch execute --effort` giữ nguyên, đi qua cùng hàm kiểm và cùng render ở transport; kết quả thô vẫn có `reasoningEffort`/`modelWarnings` vì kết quả thô không có `policy`. Hội đồng hạ cửa thô xuống compat, không xoá; nếu Lead muốn bỏ `--effort` khỏi cửa thô thì chỉ cần xoá phần parse.
- Test thêm: `bind()` nhận/ghi provenance/từ chối; `runUnit` đầu-cuối với CLI giả tên `codex` trong bwrap → argv thật có `-c model_reasoning_effort=low`; cửa CLI thật `fgos run --effort max` trên executor khai `[low, medium, high]` → `policy-refusal` lý do `reasoning-effort`.
- Impact (GitNexus, chạy trước commit `ef6fcb797`): `bind` HIGH (6 caller trực tiếp, gồm check doctor trong `registrations.mjs`, `executeAssignment`, `runRole`); `settleRunOutcome` CRITICAL (9 luồng). Thay đổi chỉ thêm khoá: binding có `reasoningEffort` (null khi không có override), provenance thêm khoá chỉ khi có dữ liệu.
- Phần "chờ owner" của hội đồng (bước 4–6, af132275b) không đụng.

## Đề xuất 4 — `--effort <level>`

### Động cơ (proven)

- Quét `.fgos/assignments` (header Codex `reasoning effort:` so với `result.json policy.reasoningEffort`): `medium->none 9, medium->medium 11, high->medium 11, high->none 1` → 21/32 run có policy ghi effort chạy ở mức khác. Effort thật hoàn toàn do `config.toml` của `CODEX_HOME` quyết.
- Codex nhận mọi giá trị không kiểm: chạy thật `codex exec -c model_reasoning_effort=bogus` (CODEX_HOME rỗng, 401 trước khi tốn token) → header in `reasoning effort: bogus`. Đồng thời chứng minh `-c` override đúng là kênh codex đọc.
- Cờ thật của từng CLI (đọc `--help` 2026-10-14): claude/agy `--effort low|medium|high|xhigh|max`; pi/omp `--thinking off|minimal|low|medium|high|xhigh|max`; codex không có cờ, chỉ `-c`.

### Thiết kế

- Cửa (`cli.mjs runDispatchCli`): chỉ parse `--effort`, đưa vào `reasoningEffort` (plain) hoặc `cliOverride.reasoningEffort` (`--assignment`, `--contract`); `--effort` thêm vào danh sách kiểm cờ trùng của hai cửa assignment/contract.
- Hợp lệ hoá một chỗ: `config.mjs assertReasoningEffort(value, {supported, executorId})` — từ vựng chuẩn rồi `supports.reasoningEffort` của executor. assignment-policy giờ gọi đúng hàm này (cùng thông điệp cũ). Danh sách `supports` hẹp hơn là khoá có chủ đích: `--effort max` trên claude bị từ chối.
- Render một chỗ: `transport.mjs resolveExecutorCommand` (mọi cửa đều qua: plain, assignment supervisor, assignment/herdr qua `executeExecutorCli`, `spawnWorker`) gọi `provider-adapter.mjs renderReasoningEffortArgs` trên **template** trước khi thay `{prompt}/{model}` → herdr dựng lại argv từ `argsTemplate` cũng mang effort. Key theo tên lệnh spawn (pi chạy cả openai lẫn deepseek): claude/agy `--effort`, pi/omp `--thinking` (thay giá trị template ghi cứng, ghi `replaced`), codex `-c model_reasoning_effort=` sau `exec` (`max`→`xhigh`). Lệnh không có điều khiển effort → `RunnerConfigError` trước spawn.
- `resolve.mjs`: kết quả `resolveExecutorConfig` mang `supports` của entry.
- Assignment: `explicitReasoningEffort(policy)` chỉ render khi nguồn là `cliOverride`/`opPolicy`; mức suy từ rigor **không** render (giữ hành vi cũ, xem "Còn để ngỏ").
- Kết quả: `reasoningEffort: {requested, command, flag, native, replaced?}` trên kết quả execute thô; receipt Assignment ghi ở `policy.provenance.reasoningEffort.rendered`.

### Test

`test/runner/dispatch-execute-effort.test.mjs`: render từng CLI, thay giá trị template, null cho lệnh lạ, validator; execute thật với CLI giả tên `codex` (argv đúng, không truyền thì argv y nguyên, giá trị sai/ngoài `supports`/CLI không hỗ trợ → từ chối và không spawn); cửa CLI parse `--effort`; `executeAssignment` với `cliOverride.reasoningEffort` → argv mang effort + result có `reasoningEffort`.

## Đề xuất 5 — cảnh báo model

### Bằng chứng ca lệch thật (proven)

1. **Model không được provider hỗ trợ — đang hỏng ngay bây giờ**: `runner.modelPolicies.gemini.flagship = gemini-3.1-pro-low`, `frontier = gemini-3.1-pro-high`, nhưng `agy models` (account mucdong) chỉ còn `gemini-3.8-flash-*`, `claude-*-4-6`, `gpt-oss-120b-medium`. Chạy thật `agy --model gemini-3.1-pro-low` → `invalid model selection ... model gemini-3.1-pro-low is not recognized as a known model` (0 token). Run cũ tháng 9 với model này chạy được → catalog agy đã đổi; mọi dispatch gemini ở tier flagship/frontier hiện thất bại.
2. **Model bị policy ghi đè**: `assignment-runner.mjs policyForActualExecutor` tính lại model theo tier khi redirect sang provider khác — `--model` của người gọi bị thay im lặng. Run thật `asgn_lead_cold_resumable_dag_op_036`: plan `claude/opus`, chạy `openai`, header codex `model: gpt-5.6-terra`; result chỉ có `executorRedirected: true`.
3. Codex với model lạ chỉ cảnh báo rồi vẫn gửi: `warning: Model metadata for \`not-a-model\` not found` (chạy thật). pi từ chối: `Model "not-a-model" not found` (chạy thật).

### Thiết kế

Toàn bộ ở `provider-adapter.mjs`, dùng chung:
- `checkLaunchedModel({requested, launched, args})` — gọi trong `resolveExecutorCommand`, trả `modelCheck` (trước spawn): `model-overridden`, `model-not-passed` (chỉ khi người gọi hỏi model).
- `collectModelWarnings(modelCheck, {stdout, stderr})` — sau run: `model-unsupported` (câu từ chối thật của agy/pi/codex), `model-reported-different` (header `model:` của codex, chỉ đọc stderr để không bắt nhầm chữ của worker).
- Gắn vào kết quả: `executeExecutorCli` (plain + nhánh herdr/legacy của assignment) và `assignment-runner` trước `settleRunOutcome` (nhánh supervisor). Sau hội đồng: receipt Assignment ghi ở `policy.provenance.modelDrift`, không còn field top-level. `requestedModel` = `cliOverride.model` được truyền xuống cả hai nhánh.

### Test

Unit cho `checkLaunchedModel`/`collectModelWarnings` dùng chính chuỗi lỗi thật của agy/pi/codex; execute thật với CLI giả in `model: some-other-model` → `model-reported-different`; assignment run → `modelWarnings` trong result.

## Kiểm tra

- **Sau hội đồng, trên `ef6fcb797` (rebase lên `f69a446f0`)**: `npm test` toàn bộ tests 7383, pass 7308, fail 0, skipped 10, todo 65 (rc=0). Test lane 20/20.
- Sau rebase lên `b0d9fa192`: `npm test` toàn bộ tests 7379, pass 7304, fail 0, skipped 10, todo 65 (rc=0). Test lane + bộ dispatch lân cận + test Việc 1/3 mới vào main: 668/668.
- Test lane mới: 16/16 xanh. Bộ lân cận (`provider-adapter`, `dispatch-policy-baseline-snapshot`, `dispatch`, `assignment-dispatch`, `dispatch-execute-for-capability`): 586/586 xanh.
- `npm test` toàn bộ trước rebase (worktree, `env -u CLAUDE_CODE_SESSION_ID`, trên `09b1608e6`): tests 7371, pass 7296, fail 1, skipped 9, todo 65. Lỗi duy nhất: `test/rust-host/fgctl-init.test.mjs` bị watchdog 600s/file giết — vấn đề đã biết, có follow-up trên main (`44287a09c`: file chạy riêng mất ~635s vì mỗi test build Rust), không đụng dispatch. Lần chạy riêng file này trên nhánh: tests 33, pass 32, fail 0, skipped 1 (vượt 600s khi chạy chung, khớp follow-up).
- GitNexus impact: `resolveExecutorCommand`, `executeExecutorCli`, `normalizeRunResultV3` đều **CRITICAL** (hub: 3 caller trực tiếp, 8–10 luồng: executeAssignment, dispatchBound, spawnWorker, runDispatchCli). Thay đổi chỉ thêm: tham số tuỳ chọn, field kết quả có điều kiện, argv không đổi khi không có `--effort`. Lưu ý: impact chạy sau khi sửa, không phải trước như luật yêu cầu; `detect_changes` (compare main) chạy sau commit — phạm vi khớp dự kiến, index đang stale.
- Test viết trước code nhưng không chạy để thấy đỏ trước khi sửa (vi phạm nhẹ quy trình "đỏ trước").
- Hai đề xuất gộp một commit: chung một đường nối (`resolveExecutorCommand` trả cả effort lẫn `modelCheck`; cùng field kết quả trong settlement/run-result), tách ra sẽ thành commit trung gian giả.

## Còn để ngỏ

1. **Config gemini hỏng (cần Lead/anh)**: sửa `runner.modelPolicies.gemini.flagship/frontier` sang model agy còn có — `.fgos/config.json` không commit được từ nhánh worker (ADR0020). Ngoài vùng lane.
2. Effort suy từ rigor có nên render vào lệnh chạy không? Bật sẽ đổi chi phí/thời gian của mọi run Codex cùng lúc (21/32 lệch). Em giữ hành vi cũ; đây là quyết định riêng.
3. `max`→`xhigh` cho codex: UNPROVEN với API thật (chưa gọi có trả phí); codex CLI không kiểm giá trị.
4. `model-reported-different` mới đọc được header codex; pi/omp JSON có trường model nhưng định dạng sự kiện chưa kiểm — UNPROVEN, chưa làm.
5. `spawnWorker` (work loop) nhận `modelCheck` nhưng chưa ghi drift vào kết quả của nó; hội đồng coi Assignment là cửa chuẩn nên em không mở rộng cửa này.
6. Cửa plain `execute` không kiểm cờ trùng (`--model` cũng vậy từ trước); em không mở rộng.
7. Nhánh in-process (agentType) bỏ qua `--effort` (không spawn CLI).
8. Đã chỉnh theo kết luận hội đồng (mục "Cập nhật sau hội đồng một-cửa").
