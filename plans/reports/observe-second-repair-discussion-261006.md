# Sửa vòng hai: đo lường thảo luận (unit summary, `metrics discussions`, stance)

Ngày 2026-10-06. Đầu vào: [nghiệm thu đo lường thảo luận](opus-reacceptance-discussion-measurement-261006.md), [nghiệm thu eval và độ trung thực](opus-reacceptance-evals-and-honesty-261006.md). Em không commit. Rename contract đã được `git mv` nên đang nằm trong index.

## Mức impact đã báo (GitNexus)

Chỉ mục GitNexus cũ: index ở `b334695`, HEAD là `e63a17b`. Vì vậy em đã đối chiếu kết quả bằng `rg`.

| Symbol | Risk GitNexus | Ghi chú |
|---|---|---|
| `roleUnit` | HIGH (5 impacted, 2 direct) | Em **không sửa**, chỉ thêm test |
| `runUnit` | LOW theo index (1 direct) | Lead xếp HIGH. Em chỉ sửa khối `catch` cuối và helper `writeJsonAtomic`. Test runner/workflow vẫn xanh |
| `writeUnitSummary` | LOW (6 impacted, 3 direct) | Owner publish trong `run.mjs` vẫn ghi đè như cũ |
| `buildUnitSummary` | LOW (index báo 0 direct, sai) | `rg` cho thấy nó được gọi từ `writeUnitSummary`, backfill và test |
| `backfillUnitSummaries` | LOW | |
| `agreement` (Rust) | LOW | |
| `valid_summary` (Rust) | LOW | |
| `runReviewed` / `isRoundSettledInHistory` | HIGH theo lead | Em chỉ thêm comment, logic không đổi |

## Từng việc

### 1. Khôi phục coverage bị xoá

- `test/runner/execution/patterns/role-tasks.test.mjs`: test mới chứng minh ghế kind `panelist` (kể cả nhãn `researcher-1`) nhận `Declared choices: ["incremental","full"]`, lệnh `"stance": {"choice"`, `agent-result.json` và câu "never changes whether your work passes". Synthesizer, reviewer, red-team và producer không nhận. Một role có tên giống panelist nhưng không có kind panelist cũng không nhận. Em không khôi phục assertion về roleTasks cũ.
- `test/runner/execution/patterns/panel.test.mjs`: test mới mức `runPanel` bắt các unit thực sự được dispatch. Panelist (mặc định và nhãn tuỳ ý) có lựa chọn và lệnh stance, override `roleTasks.panelist` bị bỏ qua. Synthesizer không có lựa chọn. Test này bắt đúng kịch bản refactor làm rơi `kind` ở `runPanel`.
- `test/workflow/workflow-runner.test.mjs`: test CLI thật, đổi tên thành "workflow and unit CLI options reach the actually dispatched prompts…".
  - Worker giả **parse `Declared choices` từ prompt thật** và chọn `options[1]`. Nếu không được hỏi thì nó không gửi stance.
  - Đã khôi phục các assertion: `state.stanceOptions`, `unitRecord.workflow` = `summary.workflow` = `{runId, stepId, unitId}`, `summary.stanceOptions`, và launch envelope của panelist-1/2 chứa request và lựa chọn.
  - Prompt synthesizer không có khối stance, và stance của synthesizer là `missing` (không được hỏi thì không bầu).
  - Unit trực tiếp: `unit.json.workflow` và `summary.workflow` là `null`, prompt panelist-1 có lựa chọn.
- Mutation check: em tạm đặt `hasStance = false && …` trong `role-tasks.mjs`.
  - panel + role-tasks: `pass 15, fail 2`.
  - workflow: `pass 0, fail 1`.
  - Sau đó em đã khôi phục file; `git diff --stat role-tasks.mjs` rỗng.

### 2. Summary legacy không có pattern

- `src/runner/execution/unit-summary.mjs`:
  - Contract lên `{id:'unit-summary', version: 2}`.
  - Khi `record.pattern` và `record.unit.pattern` đều không có, pattern là `null`, mọi ghế có `kind: "unknown"`, và outcome dẫn xuất là `UNDETERMINED_OUTCOME = 'undetermined'`. Em không đoán `solo`.
  - Settlement của owner (`record.settlement`) hoặc legacy `unit.complete` vẫn thắng.
  - `settledAt` lấy từ seat settle muộn nhất. Unit không có seat nào thì không publish (`unsettled`).
  - Export thêm `serializeUnitSummary`, `readStoredUnitSummary`, `unitSummarySkipReason`.
- `scripts/backfill-unit-summaries.mjs`:
  - Mặc định chỉ điền summary còn thiếu. Summary đã lưu được giữ nguyên; nếu khác bản writer hiện tại sẽ dẫn xuất thì báo `stale` cùng `staleSummaries[]`.
  - `--regenerate` viết lại summary stale (version cũ, dẫn xuất sai). Với unit đã xong mà không còn xác lập được outcome, nó xoá summary đã lưu (`removed`, `removedSummaries[]`).
  - Có `--dry-run`. Hai mode đều không đụng unit active. Tham số sai thì in usage và exit 2.
- Reader Rust (`packages/run-result/rust/src/unit_summary.rs`):
  - Chỉ nhận version 2 (`UNIT_SUMMARY_VERSION`).
  - Summary `unit-summary` có version khác được xếp lý do riêng `unsupported-version`, không còn lẫn vào `invalid-contract`.
- `metrics discussions` (`discussions.rs`): thêm `unitsUndetermined`.
  - `unitsFailed` bằng số unit đã xác định trừ số pass.
  - `passRate` chỉ tính trên các unit đã xác định.
  - Ghế kind `unknown` không bầu.
- Contract đổi tên thành `packages/run-result/contracts/unit-summary.read.v2.json`, cập nhật mô tả outcome/kind/pattern/stance/lý do skip.
- Test:
  - `unit-summary.test.mjs` có 4 test mới: undetermined không bao giờ là solo pass; owner completion vẫn quyết định; default giữ stale, regenerate có dry-run và idempotent; regenerate xoá summary không xác lập được nhưng không đụng unit active.
  - Rust: `undetermined_units_are_counted_but_never_passed_or_failed`. Partition reader thêm `unsupported-version`.

Chạy thật (dùng mã forgentX; `target/debug/fgos` em build lúc chạy):

- **mdview**
  - `--dry-run` mặc định: `stale 51, skippedActive 1`.
  - So sánh stored với dẫn xuất (`compare.mjs` trong scratchpad): 46 summary chỉ khác version; 2 đổi sang `undetermined` (`7fd8d9f4`, `2f787902`); 3 unit `unknown` chưa settle; 1 unit active.
  - `--regenerate --dry-run` rồi chạy thật: `changed 48, removed 3, skippedActive 1, errors []`. Lần chạy thứ hai: `changed 0, unchanged 48`.
  - `unit-run-1791130137844-2f787902`: `version 2, pattern null, outcome undetermined`. Các ghế là `producer:unknown:pass red-team:unknown:pass reviewer:unknown:blocked`, **không còn `pass`**.
  - `metrics discussions --since=2026-10-05`: 4 nhóm Delphi còn nguyên.
    - `1f688991`: 1 unit, 0 seat.
    - `842d7c56`: 8 seat, 9 attempt, 1 fallback.
    - `6466fc15`: 10 seat, 11 attempt, 1 fallback.
    - `28f05967`: 10 seat, 10 attempt, 0 fallback.
    - Tổng attempt Delphi là 30.
  - `metrics runs --since=2026-10-05T10:25:29Z --until=2026-10-05T11:20:00Z --by role`: panelist-1 6, panelist-2 6, panelist-3 8, producer 5, synthesizer 5, tổng **30 = 30**.
- **forgentX**
  - Trước khi chạy: `unusable 81 {missing-timestamp 6, unsupported-version 75}`.
  - `--regenerate`: `changed 75, removed 2, skippedActive 4, errors []`. Lần hai: `changed 0`.
  - Sau đó: `unitRuns 75 (pass 23, failed 6, undetermined 46), missing 2, unusable 4 {missing-timestamp 4}`. **`invalid-contract` = 0**.
  - 4 summary unusable còn lại thuộc 4 unit legacy bị tính là active vì có `run.json` không kèm `result.json`: `2353b379`, `96579bab`, `107d7b10`, `6cb2ff04`. Em cố ý không đụng.
- Backup summary trước khi chạy nằm ở `/tmp/claude-1000/-home-vantt-projects-forgentX/913dab9b-d03a-430d-8c92-18d84258850f/scratchpad/summaries-before/{mdview,forgentX}/`.

UNPROVEN / đánh đổi:
- 46 unit legacy ở forgentX (đa số chỉ có ghế producer) nay là `undetermined` thay cho pass/failure kiểu solo.
  - Đó là cái giá của việc không đoán. `assignment.json` cũng không ghi pattern, nên không có nguồn nào khác.
- mdview `unit-run-1791170454429-72e118ad` vẫn giữ summary v1 `pass`, nay hiển thị `unsupported-version 1`. Lý do: một attempt bị bỏ dở làm unit bị coi là active mãi.

### 3. `genuineSplit` cần quorum

- `discussions.rs`: `measured` đòi `stanceOptions` không rỗng và **`valid >= 2`** (`MIN_VALID_VOTES`). Ngược lại thì `unmeasured`, `agreement`/`genuineSplit` là null, các bộ đếm vẫn giữ.
- Test Rust `fewer_than_two_valid_votes_is_unmeasured_and_keeps_its_counts` gồm các ca: a/missing/missing; a/missing/invalid; 1 phiếu duy nhất; và a/b/missing (đo được, 1/3, split true).
- Em đã bỏ ca "two-missing → split true" khỏi test cũ, vì ca đó nay là unmeasured và được test mới thay.
- Test host `apps/fgos/tests/cli_tests.rs` (`native_discussions_…`) có 1 phiếu nên sẽ vỡ. Em thêm ghế `researcher-2` và đổi version thành 2. **File này nằm ngoài danh sách file anh giao.** Em sửa vì nó là test Rust tương ứng của `metrics discussions`; anh xem lại giúp em.

### 4. Resume `reviewed`: một checker fail, một checker thiếu

Kết luận: hành vi hiện tại đúng, nên em không sửa logic.
- Ngữ nghĩa của pattern: một vòng chỉ chốt khi mọi ghế được dispatch đều có kết quả, hoặc producer lỗi.
  - Vòng đã chốt là cuối cùng: resume trả lỗi, không dispatch gì.
  - Vòng dở dang: resume dùng lại các ghế đã pass và thử lại mọi ghế khác. Đây đúng là quy tắc "chỉ reuse kết quả pass" mà live branch đã có từ trước.
- Nếu khôi phục dòng "checker lỗi thì vòng đã chốt", backfill sẽ settle một vòng thiếu sibling. Điều đó trái với test hiện có "backfill requires real completion, including every dispatched checker".
- Em thêm comment ở `isRoundSettledInHistory` và test `reviewed.test.mjs` "resume keeps a complete round final but retries every unpassed seat of an interrupted round". Test ghim cả hai nhánh:
  - vòng đủ ghế: không dispatch, kết quả `execution-failure`, `reviewedHistoryOutcome` = `execution-failure`;
  - vòng thiếu ghế: `reviewedHistoryOutcome` = null, dispatch `reviewer/1` và `red-team/1`, producer được reuse.

### 5. Lỗi ghi unit.json trong đường lỗi

- `run.mjs`: trong `catch`, `settle('execution-failure')` được bọc `try/catch`. Lỗi ghi được báo bằng `console.warn` ("could not record the failed settlement …") và **lỗi gốc vẫn được throw**.
- `writeJsonAtomic` dọn file `.tmp` khi ghi thất bại (best effort, không che lỗi ghi).
- Test `run.test.mjs` "a failed settlement write never replaces the execution error that caused it":
  - Mock `renameSync` chỉ cho bản ghi settled thất bại, rồi kiểm tra: lỗi `Unknown collaboration pattern`, đúng 1 warning, `execution.status` còn `running`, không còn `.tmp`.
  - Mutation (bỏ `try`): test fail. Em đã hoàn lại.
- Nhánh thành công giữ nguyên: nếu settle thất bại sau khi pattern đã xong, lỗi settle chính là lỗi gốc.

### 6. Phát hiện unit crash

Em để nguyên `summariesMissing`, không tách thêm, vì không có cách vừa rẻ vừa chính xác:
- Contract reader cấm Rust đọc vào trong thư mục unit (unit.json, run.json). `UnitSummaryScan` nằm ở `packages/observe/rust/src/contract.rs`, ngoài phạm vi của em.
- Tuổi của `unit.json` không phản ánh sự sống: trong lúc một dispatch kéo dài (`timeoutMs` 2.100.000 ms, khoảng 35 phút) `unit.json` không được ghi lại.
- Tín hiệu tốt nhất là `run.json.startedAt + timeoutMs`. Nhưng nó chỉ nói "quá hạn", không nói "bị bỏ":
  - `dispatch recover` hoặc supervisor detached vẫn có thể settle muộn;
  - unit chờ inline (`pending-inline.json`) không có deadline.
- Em đã ghi giới hạn này vào mô tả contract v2. Ví dụ thật: 4 unit legacy ở forgentX và 1 ở mdview đang "active mãi".
- Nếu muốn làm, nơi đúng là owner Node (backfill báo `overdue` theo deadline run.json), không phải reader.

## Lệnh test đã chạy

- `env -u CLAUDE_CODE_SESSION_ID node --test test/runner/execution/*.test.mjs test/runner/execution/patterns/*.test.mjs` cho `tests 224, pass 224, fail 0`.
- `env -u CLAUDE_CODE_SESSION_ID node --test test/workflow/workflow-runner.test.mjs` cho `tests 35, pass 35`.
- `env -u CLAUDE_CODE_SESSION_ID node --test test/setup/observe-doctor-checks.test.mjs test/observe/*.test.mjs` cho `21/21`.
- `cargo test -p fgos-run-result -p fgos-observe`: mọi suite `ok`; `unit_summary` 14/14, observe lib 25/25.
- `cargo test -p fgos --test cli_tests` cho 20/20.
- `cargo build -p fgos` ok.

## Cần cập nhật tài liệu (agent khác ghi)

**CHANGELOG.md, `## [Unreleased]`:**
- "`metrics discussions` now needs at least two valid stance votes before it reports agreement or a genuine split. Fewer valid votes is `unmeasured`, and the stance counters are kept."
- "Unit summaries are now contract v2 (`unit-summary.read.v2`). A legacy unit with no recorded pattern is published as `outcome: \"undetermined\"`, with seats of `kind: \"unknown\"`, instead of being derived as solo. `metrics discussions` reports `unitsUndetermined` and leaves such units out of `passRate` and `unitsFailed`. Summaries of an older version are skipped as `unsupported-version`."
- "`scripts/backfill-unit-summaries.mjs` now only fills in missing summaries by default and reports stale ones. The new `--regenerate` rewrites stale summaries and removes the ones that can no longer be established. Active units are never touched."
- "A failure to record a unit's failed settlement no longer hides the execution error that caused it."

**docs/specs/observe.md:**
- Dòng 59 (Unit summaries): đổi `unit-summary.read.v1` thành `unit-summary.read.v2`. Thêm các ý:
  - record không có pattern thì `outcome: undetermined`, kind `unknown`, không suy ra solo;
  - reader chỉ nhận v2, version khác là `unsupported-version`;
  - backfill mặc định chỉ điền chỗ thiếu và báo stale; `--regenerate` viết lại hoặc xoá summary dẫn xuất; không đụng unit active.
- Dòng 72: đổi đường dẫn contract thành `packages/run-result/contracts/unit-summary.read.v2.json`.
- Nếu spec có định nghĩa agreement: thêm quorum ≥2 phiếu hợp lệ và `unitsUndetermined` (loại khỏi mẫu số `passRate`).
- Ghi rõ `summariesMissing` không phân biệt "đang chạy" với "bị bỏ dở" (lý do ở mục 6).

**docs/specs/reading-map.md:**
- Dòng 51: đổi `packages/run-result/contracts/unit-summary.read.v1.json` thành `…read.v2.json`.

**docs/specs/runner.md:**
- Dòng 1435:
  - đổi `unit-summary.read.v1` thành `v2`;
  - thay "Backfill tái sinh … có thể thay summary cũ nếu nguồn đã đổi" bằng: mặc định giữ summary đã lưu và báo stale, `--regenerate` mới thay hoặc xoá;
  - thay "zero valid votes là unmeasured" bằng "dưới hai phiếu hợp lệ là unmeasured";
  - thêm: record không có pattern thì undetermined; lỗi ghi settlement khi thất bại không che lỗi execution gốc;
  - thêm ngữ nghĩa resume của `reviewed`: vòng chỉ chốt khi đủ ghế; vòng dở dang thì thử lại mọi ghế chưa pass.

No component-boundary change.

## Câu hỏi còn mở

- Sửa `apps/fgos/tests/cli_tests.rs` nằm ngoài danh sách file được giao; anh chấp nhận hay muốn em hoàn lại?
- Anh có muốn owner báo `overdue` (quá `startedAt + timeoutMs`) trong backfill cho các unit "active mãi" không? Tín hiệu này không chính xác tuyệt đối nên em chưa làm.
- Rename contract đã nằm trong index (`git mv`); lead nhớ đưa vào cùng commit.
