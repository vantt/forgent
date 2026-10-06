# Observe Component Specification

Document type: BA-grade area specification
Ownership: `packages/observe/rust` (`fgos-observe`)
Substrate stores: `.fgos/observe/<store>/<writerId>.jsonl`

## 1. Overview & Boundaries

Observe là platform layer chuyên trách việc đo lường (`fgos metrics`) và theo dõi trở ngại (`fgos friction`) xuyên suốt mọi tầng của hệ thống fgOS.
Observe được chuyển trọn gói sang Rust trong kế hoạch `plans/260929-1501-metrics-friction-rust-native`.

### Owns
- Quản lý nhật ký và vòng đời case đo lường (`fgos metrics case`).
- Thu thập và tính toán scorecard tầng nền (`fgos metrics harness`, `fgos metrics runs`, `fgos metrics coverage`, `fgos metrics outcomes`, `fgos metrics entropy`, `fgos metrics snapshot`).
- Quản lý kho lưu trữ friction độc lập, phi tập trung (`fgos friction record`, `fgos friction resolve`, `fgos friction list`, `fgos friction show`, `fgos friction rank`).
- Quản lý store lock (`.fgos/observe/.lock`) và phân mảnh writer shard (`.fgos/observe/<store>/<writerId>.jsonl`).
- Khai báo traits `ObservationSource` và `LegacyFrictionSource` cho các crate khác triển khai.

### Must Not Own
- Không sở hữu trạng thái hoặc vòng đời của Work Items (do `packages/work-state` sở hữu).
- Không tự ý phân loại hoặc đánh giá lại kết quả RunResult (do `packages/run-result` sở hữu).
- Không can thiệp vào logic điều phối hoặc trạng thái của Agent Coordination (do `packages/coordination-state` sở hữu).
- Không ép buộc các component khác phụ thuộc ngược vào Observe: Observe độc lập, composition root (`apps/fgos`) nối các nguồn dữ liệu vào.

## 2. Shared Entities & Subjects

| Subject Kind | Định dạng ID | Ví dụ | Owner dữ liệu |
|---|---|---|---|
| `run` | `run:<runId>` | `run:run_1a2b3c` | `packages/run-result/rust` |
| `run` (unit observation) | `unit-run:<unitRunId>` | `unit-run:unit-run-example` | Node execution writer; Rust run-result read contract |
| `session` | `session:<id>` | `session:coord_4d5e6f` | `packages/coordination-state/rust` |
| `executor` | `executor:<id>` | `executor:judge-discovery` | `.fgos/config.json` |
| `case` | `case:<name>` | `case:observe-f2` | `packages/observe/rust` |
| `work` | `work:<id>` | `work:tsk-abc` | `packages/work-state/rust` |

## 3. Storage Model

- **Tracked Shard theo Writer**: mọi thao tác ghi đều ghi vào `.fgos/observe/<store>/<writerId>.jsonl`.
- **Store Lock**: `.fgos/observe/.lock` sử dụng cờ `O_CREAT | O_EXCL`, lưu `{ "pid": u32, "startTime": Option<String>, "ts": String }`. Tự động thu hồi khi holder đã chết hoặc quá TTL 30 giây.
- **Envelope chuẩn**: CLI native luôn trả về envelope `fgos.v1`.

## 4. Commands & Routing

- `fgos metrics <subcommand>` — lệnh đo lường native (Rust host). Subcommands: `ping`, `case`, `harness`, `faults`, `runs`, `coverage`, `discussions`, `eval`, `outcomes`, `entropy`, `snapshot`.
- `fgos friction <subcommand>` — lệnh friction native (Rust host). Subcommands: `ping`, `record`, `resolve`, `list`, `show`, `rank`.

Node legacy CLI cắm cờ `nativeOnly: true` cho `metrics` và `friction`, từ chối chạy trực tiếp với exit 4.
Mọi component Node hoặc ngôn ngữ ngoài gọi qua helper `src/util/host-bin.mjs` (`invokeHost`).

## 5. Mục theo làn (Sub-spec sections)

### § Metrics (Làn A)
Dành cho Phase F3 (`case`), F4 (`harness`, `faults`), F6 (`work` source), F7 (`runs`, `outcomes`, `entropy`, `snapshot`).
- **Claude Transcripts Source**: Thu thập token usage từ `~/.claude/projects/` (`CLAUDE_CONFIG_DIR`). Nhận tất cả thư mục có tên khớp với encoding của bất kỳ path nào trong `git worktree list` (project root cộng từng worktree ngoài) hoặc bắt đầu bằng `enc + "--claude-worktrees-"`. Giữ bộ lọc `cwd` cho từng record để ngăn match nhầm repo khác, và dedupe theo `message.id`.
- **Run Result Source — layout rule `v2`**: `packages/run-result/rust::scan_runs(root)` là scanner duy nhất của Rust. Walk `.fgos/assignments` theo thứ tự lexical; directory tên `runs` đánh dấu parent là assignment, id là relative path (có thể chứa `/`, gồm role/round/fallback; empty nếu `runs` nằm ngay ở assignments root). Không cần `assignment.json`; role/adapter thiếu là null. Đọc `runs/<attempt>/result.json` và chỉ đọc sibling `run.json` khi cần settlement timestamp fallback, không descend vào attempt/outbox và không follow symlink (kể cả result/run/assignment metadata). Assignment-relative depth tối đa 16; attempt không cộng depth. Child directory không đọc được hoặc biến mất bị bỏ qua, sibling vẫn được scan; root không đọc được trả lỗi, root thiếu trả nguồn rỗng.
- **Observed run**: result parseable, `runId` nonblank string, settlement timestamp là nonblank string theo precedence `result.settledAt` → `result.timestamp` → regular sibling `run.json.settledAt`. Không dùng `startedAt`, `assignment.createdAt` hay filesystem mtime để giả lập thời điểm settle. Settlement timestamp nonblank đầu tiên phải là RFC3339 instant hợp lệ (cùng ngữ pháp `parse_timestamp_millis`); nếu không thì skip `invalid-timestamp`, không rơi xuống trường sau và không chiếm `runId`; window consumer vẫn lọc observation theo thời gian. First otherwise-eligible record theo lexical path thắng khi trùng `runId`, trước khi lọc window. `ObservationSource` giữ nguyên contract; `RunResultSource::observations` lấy observations từ scanner rồi lọc window. Đây là lựa chọn implementation dưới tiêu chí chính xác/ổn định/đơn giản của owner, không phải owner đã chọn literal fallback sequence.
- **`fgos metrics coverage [--dir <root>]`**: chỉ scan run source, không scan transcripts; payload `{ layoutRule: "v2", runDirsSeen, observed, skipped: {reason: count}, recentRuns }` trong envelope `fgos.v1`. Reasons: `missing-result` (không có file), `unparseable` (file hiện hữu nhưng không đọc/parse được hoặc nonregular), `no-run-id`, `no-timestamp`, `invalid-timestamp` (thời điểm settle không phải RFC3339 instant hợp lệ), `symlink`, `duplicate-run-id`, `depth`, `inline-record` (unit result có `unitRunId` nhưng không `runId`). Chỉ reasons có count xuất hiện trong map. Symlink/depth traversal barrier tính một skipped candidate; any symlink entry có thể che directory nên là conservative barrier, không khẳng định `runDirsSeen` chỉ gồm physical directories. Result symlink là skip của candidate run, không tính thêm. Luôn `observed + sum(skipped) = runDirsSeen`. `recentRuns` vẫn đếm candidate có regular result file mtime trong 60 giây gần nhất, kể cả result hỏng/trùng/inline; future mtime chỉ là recent khi không vượt quá 60 giây (clock skew); xa hơn thì không, để dung sai của doctor không bị nới mãi. Composition root inject callback `scan_coverage` từ owner vào Observe; không reverse dependency và không đổi observation trait.
- **Hermetic consumer invariant**: Rust và Node materialize cùng fixture declarative `test/fixtures/run-layout/expected.json`; product Node eligibility projection (tách khỏi directory lister) và Rust scanner phải khớp admitted run ids/accounting, planted run trong outbox không được enumerate. Show/watch/recover dùng metadata-first identity lookup và từ chối `run-ambiguous` nếu nhiều materializations có cùng id; lexical winner chỉ là metrics dedup policy, không phải authority để xem/recover một run. Rust cargo tests không đọc live `.fgos/assignments` và không pin audit-time totals. Doctor so sánh độc lập cả eligible unique count và directory/barrier count; directory mtime trong 60 giây cho bounded race tolerance dù result chưa tồn tại. Failure examples chỉ là sample candidates, không khẳng định host đã bỏ những path đó.
- **Unit summaries — writer-owned contract**: Execution ghi `.fgos/assignments/<unitRunId>/unit-summary.json` theo `unit-summary.read.v2` khi toàn Unit settle, kể cả refusal không có seat và inline solo. Producer inline của pattern nhiều vai chỉ ghi kết quả seat, không chốt Unit trước checker/synthesizer. Chọn final seat, numeric attempt, fallback và outcome thuộc Node `unit-run-history.mjs`; mỗi seat có `kind` nonempty do owner pattern ghi, chỉ `kind: "panelist"` là voter, không suy từ tên `panelist-*`/`researcher-*`. Định nghĩa role của panel được owner dùng chung cho execution và materializer. Observe chỉ đọc summary đã settle, không join `unit.json`, Dispatch result hay workflow events để suy diễn; `UnitSummarySource` phát `unit.settled` với subject `unit-run:<id>`, không cộng vào tổng Dispatch runs. Backfill bỏ qua Unit đang chạy/pending hoặc chưa có bằng chứng hoàn tất, mặc định chỉ điền summary còn thiếu và báo summary cũ là stale; `--regenerate` mới viết lại hoặc xoá derived summary, byte-idempotently, không sửa unit/result/event gốc; linkage legacy chỉ dùng `unit.complete` có exact unitRunId. Lỗi ghi summary cảnh báo nhưng không đổi outcome authoritative hoặc che lỗi execution gốc. Record không có pattern thì `outcome: "undetermined"` và seat `kind: "unknown"`, không suy ra solo; reader chỉ nhận v2, version khác báo `unsupported-version`. `summariesMissing` không phân biệt Unit đang chạy với Unit bị bỏ dở (tuổi của `unit.json` và hạn `timeoutMs` đều không phản ánh chính xác).
- **Unit execution state**: `unit.json.execution.status` chuyển `running` → `pending-inline` (chờ producer) → `pending` (inline producer đã ghi, pattern chưa xong) → `running` khi resume → `settled`. Backfill báo `skippedActive`/`skippedUnsettled`; trạng thái không thay thế bằng chứng settlement. Resume invalidates regular summary cũ trước khi công bố `running`; nếu không thể xóa artifact cũ thì dừng trước khi reopen, không để Observe tiếp tục đọc outcome terminal đã mất authority. Artifact nonregular không được đo và vẫn là diagnostic khi summary I/O thất bại.
- **`metrics discussions [--since <date>] [--by workflow|executor|persona]`**: đo unit runs/pass rate, final seats/failed seats, attempts/fallback và median settled duration; attempts không đồng nghĩa seats. Optional stance chỉ được hỏi ở panelist có options, lấy từ final claim: choice thuộc stanceOptions hoặc `other`, confidence nếu có phải hữu hạn trong [0,1] (null/thiếu không cân trọng số). Missing/malformed stance không làm seat thất bại. Không có options, không có voting seats, hoặc dưới hai phiếu hợp lệ là `unmeasured`, agreement/genuineSplit null; vẫn giữ counts ghế/missing/invalid. Khi có ít nhất hai valid vote, agreement là largest valid-choice group / final voting seats, genuineSplit khi không nhóm nào đạt 2/3 số ghế. Missing và invalid vẫn ở mẫu số; split khi thiếu claim chỉ là incomplete-evidence signal, không chứng minh dissent. Unit `undetermined` được đếm ở `unitsUndetermined` và không vào `passRate` hay `unitsFailed`. Synthesizer không bỏ phiếu thay panelist, kể cả tên role trùng quy ước panelist. Group executor/persona giữ attempts theo executor/persona thực thi và seats theo final; một unit có thể xuất hiện nhiều group, không cộng group unit totals làm global total.
- **Summary scan diagnostics**: một scan canonical của owner reader cung cấp observations và counts; discussions không scan source hai lần. `summariesMissing` báo Unit directory không có artifact (có thể đang chạy, không tự khẳng định crash); `summariesUnusable` và `summariesSkippedByReason` báo JSON/contract/timestamp/size/read/symlink/nonregular không dùng được, kể cả summary không có settle time. `summariesOutsideWindow` tách summary hợp lệ ngoài window; `summaryDirsSeen` là số Unit directory được xét. Diagnostics có scope root-wide: summary thiếu hoặc không có thời gian không thể gán vào `--since`/`--until`. Callback được composition root inject tương tự coverage scanner; không mở rộng trait `ObservationSource` hay cho Rust tái dựng pattern.
- **Discussion time windows**: `--since`/`--until` so sánh inclusive theo UTC milliseconds, không lexical timestamp; offset spellings của cùng instant cho cùng kết quả. `YYYY-MM-DD` là UTC midnight, không end-of-day. Bound malformed hoặc since sau until trả named error trước scan; owner timestamp malformed không được đoán hay đổi payload gốc.
- **`metrics eval record|list`**: record append-only vào `.fgos/observe/evals/<writerId>.jsonl` qua Observe lock; `observe.eval.v1` giữ harness/question/setup/rubric/judge/runRefs và từng score integer 0–2. `discussion-quality.v1` bắt buộc đúng năm criterion keys của rubric, validate cả write/read; rubric khác vẫn free-form. Writer tạo timestamp/envelope; evalId unique trên toàn shard: check rồi append dưới cùng lock như case journal. Store có invalid tracked data không thể chứng minh uniqueness nên writer từ chối cho tới khi sửa dữ liệu, không bỏ lỗi hay tự sửa log; lỗi từ chối nêu đường dẫn shard, số dòng và lỗi của từng dòng invalid (tối đa 5, phần còn lại đếm gộp). Reader validate và phát hiện duplicate trước exact harness/question filters; first valid lexical record được giữ, later duplicate vào invalid, không coi store có invalid là comparison đáng tin. List sort lexical timestamp rồi evalId; writer UTC/Z chuẩn, không bảo đảm chronological ordering cho timestamp offset do hand-edit. Journal lưu đánh giá, không tự chạy judge hay tuyên bố chất lượng khách quan; A/B blind judge phải nhận neutral inputs ngoài `.fgos`, không kèm setup labels hay run metadata.
- **Eval journal safety**: writer id phải là một filename component, không path; symlinked/nonregular writer shard bị từ chối. Supported Linux/Android/Darwin/BSD dùng target-specific `libc::O_NOFOLLOW | O_NONBLOCK`, xác nhận regular descriptor; platform không có branch atomic no-follow chỉ create-new, existing shard fail closed. Reader giữ tối đa 1 MiB + một byte mỗi logical line, drain line quá lớn rồi tiếp tục, báo file/line/error kể cả partial EOF. Unsafe/nonregular `*.jsonl` entries báo invalid với line0 (shard-level), không follow để lấy scores. Parent directory và read-side entries được preflight, không tuyên bố chống mọi race thay directory/final read component. Không thêm config/env/tool prerequisite: libc là build dependency, runtime dùng Observe dir-writable doctor row, shard identity và lock hiện có; evals tạo lười như các store Observe khác.
### § Friction (Làn B)
Dành cho Phase F5: writer Rust duy nhất, migration lười từ `work.friction`, các lệnh `friction record/resolve/list/show/rank`.

### § Contract & Quyết định (Làn C / F8)
Dành cho Phase F8: khoá ranh giới contracts, golden fixtures và decision records.
- Versioned contracts: `packages/observe/contracts/` (`observe.observation.v1.json`, `observe.friction.v1.json`, `observe.case.v1.json`, `observe.snapshot.v1.json`, `observe.eval.v1.json`). Eval rubric: [`discussion-quality.v1`](../reference/discussion-quality-rubric.md); [blind comparison how-to](../how-to/compare-discussion-setups-with-metrics-eval.md).
- Source owner read contracts: `packages/run-result/contracts/run-result.read.v1.json`, `packages/run-result/contracts/unit-summary.read.v2.json`, `packages/observe/contracts/coordination-session.read.v1.json` (historic sessions; the coordination engine is retired), `packages/work-state/contracts/work-events.read.v1.json`.
- Golden fixtures: `test/fixtures/observe/` sinh bằng CLI Rust và Node trong `scripts/regenerate-observe-fixtures.mjs`.
- Doctor checks: `observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`, `observe-run-coverage` (`src/setup/registrations.mjs`). Coverage check gọi host `metrics coverage` qua helper với main-checkout dir, kiểm tra `v2` + accounting rồi so `runDirsSeen` với Node directory-only `scanAssignmentLayout` (gồm symlink/depth barriers). Tolerance là max(Node recent result files, host `recentRuns`) trong cửa sổ 60 giây. Chỉ positive unknown subcommand hoặc payload thiếu `layoutRule` được degraded/pass vì old host; malformed coverage và các lỗi khác fail.

## 6. Lịch sử quyết định

### D-ADR0037 (Observe Component Architecture)

- **Một component Observe**: Gom toàn bộ đo lường (`fgos metrics`) và friction (`fgos friction`) vào một crate Rust duy nhất (`packages/observe/rust`).
- **Subject tầng nền**: Subject đo lường là các thực thể tầng nền (`run`, `session`, `executor`, `case`); Work Item là source quan sát tuỳ chọn, không phải trung tâm đo lường.
- **Friction rời Work**: Lưu trữ friction tách rời khỏi `work.friction` trong Work event store; chuyển thành append-only shards trong `.fgos/observe/friction/<writerId>.jsonl`.
- **Writer Rust duy nhất**: Mọi component ghi friction hoặc metrics đều gọi qua native CLI của Rust host. Recursion guard chỉ còn cho `legacy-cli`.
- **`nativeOnly`**: Các verb `metrics` và `friction` được đánh dấu `nativeOnly: true` trong command registry, Node legacy CLI từ chối trực tiếp với exit 4.
- **Không backward compat**: Supersede luật "Preserve current commands" của `node-to-rust-migration.md` đối với `check/faults/dispatch-report/evolve`; chuyển hẳn sang `metrics` và `friction`.
- **Single path**: Một con đường thực thi duy nhất qua host router native.
- **Store Observe tracked, shard theo writer**: Lưu trữ dưới `.fgos/observe/<store>/<writerId>.jsonl` được git theo dõi; migration theo cursor `(src, seq)`.
- **Kênh phụ best-effort cho friction**: Ghi friction là kênh phụ không chặn luồng chính (lỗi ghi được ghi nhận thành `friction-write-failed` trong `invocation-faults`). Resolve host theo thứ tự ưu tiên: env (`FGOS_HOST_BIN`) → release manifest (`.fgos/installation`) → fault.
- **Work ngừng đọc friction**: Work không đọc friction; CLI friction của Observe không join state của Work.
- **Bỏ `learning.frictions`**: Bỏ `learning.frictions` khỏi event đóng item và bỏ mục `frictions` khỏi output của `list` / `show`.
- **Map output `check` và `evolve`**: Outcomes, settlement, learning, nag → `metrics outcomes`; entropy → `metrics entropy`; `evolve --submit` → `friction rank` + `fgos submit`.
