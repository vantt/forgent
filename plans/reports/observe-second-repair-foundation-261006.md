# Sửa vòng hai: nền tảng (run lồng, coverage, doctor) và kho evals

Ngày 2026-10-06. Nguồn: [opus-reacceptance-foundation-261006.md](opus-reacceptance-foundation-261006.md), [opus-reacceptance-evals-and-honesty-261006.md](opus-reacceptance-evals-and-honesty-261006.md), [plan.md](../261005-1143-observe-run-visibility-and-discussion-measurement/plan.md). Chưa commit, chưa push; lead sẽ commit.

## Tệp đã sửa

| Tệp | Thay đổi |
|---|---|
| [test/runner/dispatch-reconciliation-import-graph.test.mjs](../../test/runner/dispatch-reconciliation-import-graph.test.mjs) | Khôi phục assertion closure chính xác. Bỏ cả hai đường tắt "lá". Đi theo cả side-effect `import '…'`. Chỉ quét dòng code. Cho phép đúng một dạng `process.kill(x, 0)` |
| [test/runner/assignment-enumerator-guard.test.mjs](../../test/runner/assignment-enumerator-guard.test.mjs) (mới) | Guard enumerator cho `.fgos/assignments`, có allow-list kèm lý do, test chống allow-list cũ và test tự kiểm của bộ dò |
| [src/runner/dispatch/assignment-layout.mjs](../../src/runner/dispatch/assignment-layout.mjs) | Hàm private `isRfc3339Instant` (đúng ngữ pháp của Rust `parse_timestamp_millis`) và lý do skip mới `invalid-timestamp` |
| [test/runner/assignment-layout.test.mjs](../../test/runner/assignment-layout.test.mjs) | Viết lại test precedence (xem mục "Test bị thay"); test run lồng thêm `findRunningRuns` và bằng chứng result của inspection |
| [test/fixtures/run-layout/expected.json](../../test/fixtures/run-layout/expected.json) | Thêm 4 entry: `garbage`, `2026-02-30T…`, `2026-10-05` (đều invalid) và offset `-01:00` (hợp lệ). runDirsSeen 15→19, `invalid-timestamp: 3` |
| [src/setup/registrations.mjs](../../src/setup/registrations.mjs) | Chỉ check `observe-run-coverage`: `isRecentRunMtime` chặn mtime tương lai quá 60 s |
| [test/setup/observe-doctor-checks.test.mjs](../../test/setup/observe-doctor-checks.test.mjs) | Biên +61 s và +1 năm không còn recent. Test mới ghim nhãn "sample candidates (not confirmed missing)" và đường dẫn mẫu |
| [packages/run-result/rust/src/lib.rs](../../packages/run-result/rust/src/lib.rs) | `invalid-timestamp` dùng `fgos_observe::time::parse_timestamp_millis`; `is_recent` có chặn skew tương lai 60 s |
| [packages/run-result/rust/tests/layout_fixture.rs](../../packages/run-result/rust/tests/layout_fixture.rs) | Số liệu fixture đọc từ expected.json. Test skew có biên. Thêm window `since=2099-01-01` (phải rỗng) |
| [packages/observe/rust/src/eval_journal.rs](../../packages/observe/rust/src/eval_journal.rs) | Lỗi từ chối nêu `file:dòng (lỗi)` (tối đa 5, sau đó "and N more") và chỉ cách sửa; vẫn từ chối, không tự sửa dữ liệu |
| [packages/observe/rust/tests/eval_journal_test.rs](../../packages/observe/rust/tests/eval_journal_test.rs) | Test mới cho dòng cuối bị cắt dở |

Không thêm module mới dưới `src/`, nên không cần hàng mới trong `docs/architecture-manifest.json`.

## 1. Closure import chính xác

- **Kiểm lại hai đường tắt lá:**
  - `run-result.mjs` chỉ import `agent-result-claim-contract.mjs` (không import gì). Sạch.
  - `provider-capacity.mjs` import `provider-adapter.mjs` (node:fs/path; ghi duy nhất là telemetry append), `provider-auth-failure.mjs` (lá, không import) và `process-identity.mjs` (node:fs). Không module nào trong số đó với tới module bị cấm. Từ e63a17b8e, `liveness.mjs` không còn nằm trong graph.
  - Chú thích cũ "không import tương đối nào" là sai. Em đã bỏ cả hai đường tắt và cho walk đi xuyên qua.
- **Hai chỗ khớp mẫu khi đi xuyên:**
  - `provider-capacity.mjs:576 process.kill(pid, 0)`: probe signal 0 không gửi tín hiệu. Em miễn đúng dạng này bằng regex `process.kill(<ident>, 0)`. Mọi dạng kill khác vẫn fail.
  - `process-identity.mjs:15`: chỉ là chú thích. Phép quét giờ bỏ qua dòng comment.
- **Closure thật = 16 module:** 11 module gốc của `2639e0c85` cộng 5 module có chú thích lý do (`assignment-layout`, `agent-result-claim-contract`, `provider-adapter`, `provider-auth-failure`, `process-identity`). Tập này khớp phép đi độc lập trong scratchpad (`closure.mjs`, không cắt).
- **Lỗ hổng tìm thêm:** `IMPORT_RE` cũ chỉ bắt `from '…'`, nên side-effect `import './x.mjs'` lọt qua. Mutation đầu tiên dùng dạng này và test vẫn xanh. Em đã mở rộng regex. `import()` động vẫn không được tính, như trước.
- **Mutation (đều đã hoàn lại, `git status` sạch trên các file đó):**
  - `import '../../util/format-bytes.mjs'` vào reconcile.mjs: FAIL (deepEqual, thừa format-bytes).
  - `import { formatBytes as __m } from …` vào reconcile.mjs: FAIL.
  - Trỏ import của provider-capacity sang `./liveness.mjs`: FAIL, "must never reach src/runner/dispatch/liveness.mjs".
  - Thêm `process.kill(pid, 'SIGTERM')` vào process-identity: FAIL, "matched a banned process-control call pattern".
  - Sau khi hoàn lại: 22/22 pass.

## 2. Guard enumerator

- **Cách dò theo hành vi:**
  - Tìm lời gọi đọc thư mục: `readdir`/`readdirSync`/`opendir`/`opendirSync`, cùng wrapper một dòng trong cùng file như `dirs(`.
  - Lần ngược đối số qua binding trong cùng phạm vi top-level và hằng module: `const`/`let`, gán lại, biến vòng `for…of`. Nhờ đó vòng lặp `roots` bị bắt. Lần qua cả tham số của hàm cùng file.
  - Lời gọi bị đánh dấu khi chạm (a) literal `assignments` hoặc helper thư mục assignment, hoặc (b) chính thư mục đó hay thứ dẫn xuất từ nó đi xuống marker của layout (`'runs'`, `'assignment.json'`, `'result.json'`, `'run.json'`).
  - Bỏ qua comment.
- **Allow-list hiện có, mỗi mục kèm lý do:**
  - `unit-run-history.mjs` (unitDir/roleDir/runsDir): chủ ngữ nghĩa unit.
  - `unit-summary.mjs` (3 mục): chủ unit.
  - `scripts/backfill-unit-summaries.mjs readdirSync(root)`: unit luôn nằm top-level.
  - `assignment.mjs readdirSync(assignmentsDir)`: cấp id phẳng.
  - `operation-choice.mjs` (3 mục): bằng chứng gate của work, chỉ assignment phẳng.
  - `assignment-runner.mjs` commandsDir/runsDir, `runtime-inspection.mjs` genDir/commandsDir, `herdr-reconcile.mjs` od: đọc bên trong một run đã xác định.
  - `scripts/measure-coordination-baseline.mjs`: sao chép corpus.
- **Thông báo lỗi** chỉ cách xử lý: dùng `scanAssignmentLayout`/`listAssignmentRuns`/`findRunDir`/`assignmentDir`, hoặc thêm vào ALLOWED kèm lý do. Allow-list cũ (lời gọi đã biến mất) cũng làm test fail.
- **Mutation trên `registrations.mjs`, đã hoàn lại:**
  - Thêm `const roots=[path.join(root,'.fgos','assignments')]; for (const r of roots) fs.readdirSync(r)`: FAIL, `src/setup/registrations.mjs: readdirSync(r)`.
  - Thêm `readdirSync(unitDir)` rồi `path.join(unitDir, seat, 'runs')`: FAIL, `readdirSync(unitDir)`.
- **Test tự kiểm của bộ dò** gồm các dạng trực tiếp, dẫn xuất, wrapper, vòng `roots`, đệ quy qua tham số, `fsp.readdir(assignmentDir(...))`, đi xuống `'runs'`, và mẫu âm (`workflow-runs`, comment).
- **Test hành vi:** run lồng `unit-run-example/panelist-1/1-fb1/runs/02` được thấy bởi `findRunDir`, `showRunUseCase`, `inspectDispatchRuntime` (cả theo run và theo cwd guard), `findRunningRuns` (đúng runDir/runId/assignmentId) và `watchRunUseCase`.

## 3. Các mục Low của nền tảng

- **(a) mtime tương lai:**
  - Node `isRecentRunMtime` và Rust `is_recent` cùng dùng `RECENT_RUN_WINDOW = 60 s` và `MAX_FUTURE_MTIME_SKEW = 60 s`.
  - Lý do chọn 60 s: các writer cục bộ dùng chung đồng hồ, nên mtime tương lai chỉ hợp lý trong một độ lệch nhỏ, ví dụ filesystem qua mạng. 60 s đối xứng với cửa sổ recent, đúng như reviewer đề xuất `|now - mtime| <= 60 s`.
  - Test: doctor +60 s pass; +61 s và +1 năm fail. Rust +30 s là recent; +120 s và +1 năm không.
  - Mutation: bỏ biên ở Node làm test doctor FAIL; bỏ biên ở Rust làm `recent_runs_use_result_mtime_and_bound_clock_skew` FAIL.
- **(b) timestamp không hợp lệ:**
  - Hai bên chỉ nhận RFC3339 instant: `YYYY-MM-DD[Tt]hh:mm:ss[.frac](Z|z|±hh:mm)`, có kiểm ngày theo tháng/năm nhuận và giới hạn giờ/phút/giây/offset. Phía Rust là đúng hàm `parse_timestamp_millis` mà discussions đã dùng.
  - Trường thời gian đầu tiên không rỗng là thời gian được khai báo. Nếu nó sai thì skip `invalid-timestamp`, không rơi xuống trường sau, và không chiếm runId khi so trùng.
  - Fixture chung được cập nhật; Node và Rust cùng đọc và ra cùng đáp án.
  - Mutation: bỏ check ở Node làm 2 test FAIL; bỏ check ở Rust làm fixture và `absent_and_malformed…` FAIL.
  - Live không bị ảnh hưởng: 929/929 (forgentX) và 110/110 (mdview) timestamp đều có dạng `YYYY-MM-DDThh:mm:ss.sssZ`, 0 invalid.
- **(c) Câu chữ thông báo:** test mới ghim chuỗi `sample candidates (not confirmed missing): <path>` và `difference 1`. Mutation đổi câu chữ: FAIL.

## 4. Kho evals

- Lỗi giờ có dạng: `cannot establish evalId uniqueness while the eval store contains invalid records: .fgos/observe/evals/<shard>.jsonl:2 (EOF while parsing…); repair or remove those lines by hand (\`metrics eval list\` reports every invalid line), then record again`. Liệt kê tối đa 5 mục, sau đó là "; and N more".
- Hành vi từ chối giữ nguyên; không có cơ chế tự sửa hay truncate.
- Test `torn_tail_refusal_names_the_shard_and_line_and_leaves_bytes_untouched`:
  - append một dòng dở vào shard của chính writer;
  - hai lần `record` liên tiếp đều fail, nêu `shard:2`, bytes giữ nguyên;
  - thêm 7 dòng hỏng thì lỗi có "and 3 more".
- Mutation trả lại câu cũ: test FAIL ở dòng 399.
- Store live: `metrics eval list` cho 4 bản ghi, `invalid: []`.

## Bằng chứng đã chạy

- `env -u CLAUDE_CODE_SESSION_ID node --test`:
  - import-graph 22/22;
  - enumerator-guard 3/3;
  - assignment-layout 15/15;
  - observe-doctor-checks 16/16;
  - dispatch-runtime-inspect 20/20;
  - dispatch-visibility-session 23/23;
  - dispatch-recovery 9/9.
  - Tất cả exit 0. Không có file `test/runner/dispatch-observe.test.mjs`.
- `cargo test -p fgos-run-result -p fgos-observe`: exit 0, 98 pass, 0 fail.
- `target/debug/fgos` (15:27:27, mới hơn lib.rs 15:27:16 và eval_journal.rs 15:27:23) `metrics coverage`:
  - forgentX: runDirsSeen 1199 = 929 + missing-result 51 + no-timestamp 219, recentRuns 0. `find` độc lập ra 1199.
  - mdview: 123 = 110 + 7 + 6. `find` ra 123.
- `checkObserveRunCoverage` với `FGOS_HOST_BIN` trỏ host mới:
  - forgentX passed, Node 1199/929 = host 1199/929, 817 ms;
  - mdview passed, 123/110, 335 ms.

## Impact (GitNexus)

- **Trạng thái:** `fgos tool query` báo gitnexus `present`, nhưng index đang ở `b334695`, còn HEAD là `e63a17b8e`. Index cũ nên chỉ là bằng chứng yếu. Lỗi nhiều repo được xử lý bằng `gitnexus list` rồi `--repo /home/vantt/projects/forgentX`.
- **`scan_assignment_runs` (Rust): HIGH.**
  - 4 symbol bị ảnh hưởng: `walk_assignments` → `scan_runs` → `RunResultSource::observations` và `scan_coverage`.
  - Thay đổi hành vi có chủ ý: run có timestamp sai không còn được admit, và recentRuns hẹp lại. Live đo được 0 ảnh hưởng ở cả hai root.
- **`checkObserveRunCoverage`, `scanAssignmentLayout`: LOW.**
  - Index trả 0, đáng ngờ vì index cũ, và `projectRunEligibility` thì "not found" vì cũng cũ.
  - Kiểm chéo bằng grep: caller duy nhất của `projectRunEligibility` là `registrations.mjs:5799` (doctor); `checkObserveRunCoverage` chỉ được gọi từ registerCheck.
- **`eval_journal::record`:** caller duy nhất là `metrics_cli/eval.rs:54` (grep). Chỉ đổi câu lỗi.
- `detect_changes` chưa chạy vì em không commit; lead chạy trước khi commit.

## Test bị thay (không làm yếu)

- Node: `eligibility uses actual settlement precedence without parsing nonblank timestamps` thành `…and admits only valid RFC3339 instants`.
  - Precedence giữ nguyên, nhưng dùng timestamp thật thay cho chuỗi giả.
  - Trường hợp `' non-date '` trước đây được admit, giờ phải skip.
  - Thêm 10 case biên.
- Rust:
  - `recent_runs_use_result_mtime_and_include_clock_skew` thành `…bound_clock_skew`; +120 s không còn recent.
  - `absent_and_malformed_results_have_distinct_accounting`: `" non-date "` chuyển từ admit sang `invalid-timestamp`; id có khoảng trắng vẫn được giữ nguyên văn với timestamp hợp lệ.
- Fixture: các số cứng 15/7 giờ đọc từ expected.json.

## UNPROVEN / giới hạn

- **Guard là heuristic tĩnh trong một file.**
  - Có một trường hợp nó không thấy: hàm ở file A liệt kê tham số mà không đi xuống marker layout, và được gọi từ file B với đường dẫn assignments. Tham số không lan qua file.
  - Đọc thư mục bằng cách khác ngoài 4 primitive (ví dụ `glob`, `child_process ls`) cũng không bị bắt.
  - Các trường hợp này đều cần được review bắt.
- **Allow-list phụ thuộc file agent khác đang sửa.** `scripts/backfill-unit-summaries.mjs` và `src/runner/execution/unit-summary.mjs` có thay đổi chưa commit của agent khác. Guard xanh với trạng thái working tree lúc 15:3x. Nếu họ đổi tên biến hay tách hàm, guard sẽ fail kèm hướng dẫn, và lead cần cập nhật ALLOWED.
- **`import()` động không được tính.** `visibility-session.mjs:299,303` nạp lười `herdr-round.mjs`/`assignment-runner.mjs` (đều là module bị cấm) trên đường spawn. Test này không chứng minh reconcile không bao giờ đi vào nhánh đó lúc runtime.
- **Window của `RunResultSource` vẫn so sánh chuỗi.** Sau thay đổi này, ts luôn là RFC3339 hợp lệ, nhưng một offset khác `Z` vẫn có thể được xếp lệch vài giờ quanh biên. Live hiện chỉ có dạng `Z`. Đây không thuộc phạm vi việc này.
- Chưa chạy `npm test` toàn bộ (lead chạy).

## Cần cập nhật tài liệu (agent khác ghi)

- **CHANGELOG.md `## [Unreleased]`**, đề xuất:
  - `### Changed`: "Run observations, `metrics coverage` and the doctor run-coverage check now skip runs whose settlement time is not a valid RFC3339 instant as `invalid-timestamp`, instead of counting them in every time window."
  - `### Changed`: "`metrics coverage` recentRuns and the doctor run-coverage tolerance no longer treat a run whose mtime is more than 60 seconds in the future as recent."
  - `### Fixed`: "`metrics eval record` refusal on an invalid eval store now names each offending shard file and line, and how to repair it."
- **[docs/specs/observe.md](../../docs/specs/observe.md):**
  - Dòng 56: bỏ câu "Admission không thêm ISO validation; window consumer vẫn lọc observation theo thời gian." Thay bằng: "Settlement timestamp đầu tiên không rỗng phải là RFC3339 instant hợp lệ (cùng ngữ pháp `parse_timestamp_millis`); nếu không thì skip `invalid-timestamp`, không rơi xuống trường sau và không chiếm runId."
  - Dòng 57: thêm `invalid-timestamp` vào danh sách Reasons. Thay "future mtime cũng là recent để chịu clock skew" bằng "future mtime chỉ là recent khi không vượt quá 60 giây (clock skew); xa hơn thì không, để không nới dung sai doctor mãi mãi."
  - Dòng 64 (`metrics eval record|list`): thêm "Lỗi từ chối nêu đường dẫn shard, số dòng và lỗi của từng dòng invalid (tối đa 5, phần còn lại đếm gộp), không tự sửa dữ liệu."
- **[docs/specs/runner.md](../../docs/specs/runner.md):**
  - Dòng 1433: thêm `invalid-timestamp` (thời điểm settle không phải RFC3339 instant hợp lệ) vào danh sách lý do.
  - Có thể thêm một câu: "Mọi việc liệt kê thư mục dưới `.fgos/assignments` ngoài `assignment-layout.mjs` bị `test/runner/assignment-enumerator-guard.test.mjs` chặn trừ khi có trong allow-list kèm lý do."
- **`packages/run-result/contracts/run-result.read.v1.json` `description`:** thêm `invalid-timestamp` vào câu "Coverage counts …". File này không thuộc quyền sửa của em; nếu không sửa, contract text sẽ lệch với hành vi.
- **Ranh giới component:** không thay đổi.

## Câu hỏi còn mở

- Có muốn giữ tên lý do `invalid-timestamp` riêng không, hay gộp vào `no-timestamp` để khỏi đổi text của contract/spec? Em chọn tên riêng để người vận hành thấy rõ nguyên nhân.
