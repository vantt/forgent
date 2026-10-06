# Prompt: sửa các phát hiện nghiệm thu của kế hoạch Observe (run lồng + đo lường thảo luận)

Dán nguyên văn cho một agent mới. Repo `/home/vantt/projects/forgentX`, nhánh `main`.

## Bối cảnh

Kế hoạch `plans/261005-1143-observe-run-visibility-and-discussion-measurement/` đã được triển khai và commit (`0b06824a7`, kèm sửa watchdog `ea1c8fee0`). Ba reviewer Opus nghiệm thu độc lập, kết luận **ACCEPT WITH FIXES**. Suite đầy đủ xanh (6823 test, 6750 pass, 0 fail) nhưng còn lỗi thật và vài khẳng định sai trong bằng chứng. Việc của em là sửa chúng, không mở thêm scope.

Đọc trước, theo thứ tự:
1. `plans/reports/opus-acceptance-review-foundation-261006.md` (nền tảng: run lồng, coverage, doctor)
2. `plans/reports/opus-acceptance-review-discussion-measurement-261006.md` (unit summary, stance)
3. `plans/reports/opus-acceptance-review-phase6-and-honesty-261006.md` (kho evals, độ trung thực của bằng chứng)
4. `plan.md` và các phase của kế hoạch trên (định nghĩa "một run" nằm ở `plan.md`)
5. `AGENTS.md`, `docs/specs/reading-map.md`, `docs/specs/observe.md`

## Quy ước làm việc (bắt buộc)

- Xưng "em", gọi "anh". Không dùng mày/tao. Báo cáo ngắn, nói thật kể cả khi em báo sai.
- Không tạo work item; không dùng `fgos submit/pick/move/approve`.
- Chỉ push khi anh nói. Trước mọi git: `pwd` và `git branch --show-current`; stage đúng đường dẫn; commit theo conventional, không nhắc AI trong subject, cuối body có dòng `Claude-Session: <url session hiện tại>` nếu hệ thống cho dòng đó.
- Không đọc/in `.fgos/secrets.local.env` hay credential.
- Dùng `node bin/fgos.mjs` (không dùng hàm shell `fgos`). Test: `env -u CLAUDE_CODE_SESSION_ID node --test <file>`; cả suite `env -u CLAUDE_CODE_SESSION_ID npm test` (7-9 phút), chỉ chạy **một lần cuối**, không chạy khi agent khác đang chạy test, không commit khi suite đang chạy.
- Phần Rust: host `fgos metrics ...` chạy từ binary đã stage (`~/.local/state/fgos/releases/<sha>/bin/fgos`, **cũ**). Build `cargo build -p fgos` và trỏ `FGOS_HOST_BIN=target/debug/fgos` cho lệnh kiểm tra của em.
- Trước khi sửa một symbol: chạy GitNexus `impact` (upstream) và báo mức rủi ro. Trước khi commit: `detect_changes`.
- Không đưa mã kế hoạch, số phase, nhãn audit, mã phát hiện (kiểu "H1", "M3", "phase 4") vào comment, tên test, tên migration hay commit message. Nêu thẳng bất biến/hành vi.
- Quy tắc repo: mọi file `.mjs` mới dưới `src/` cần một hàng trong `docs/architecture-manifest.json`; hàng "doctor check" trong `docs/specs/distribution.md` chỉ chứa id check trong dấu backtick; thay đổi người dùng thấy được thì thêm một dòng vào `## [Unreleased]` của `CHANGELOG.md`.
- Golden fixtures `test/fixtures/observe/`: regenerate bằng đúng cách suite gọi, rồi `git diff --stat` trước khi stage.
- Không commit `AGENTS.md`/`CLAUDE.md` (GitNexus tự sinh lại số liệu) và các file `.fgos/events`, `.fgos/backups`.
- Dọn tiến trình/pane/`sleep` thừa. Không chạy dispatch/pane trừ khi một mục dưới đây yêu cầu.

## Việc phải làm (không cần quyết định thêm)

Làm theo thứ tự; mỗi nhóm một commit, test hẹp sau mỗi nhóm.

### 1. Khôi phục assertion bị xoá và viết guard test còn thiếu
- `test/runner/dispatch-reconciliation-import-graph.test.mjs`: assertion "tập đóng import chính xác" đã bị xoá 20 dòng. Khôi phục từ `git show 2639e0c85:test/runner/dispatch-reconciliation-import-graph.test.mjs` và thêm đúng các module mới có chủ đích vào danh sách (ví dụ `src/runner/dispatch/assignment-layout.mjs`). Tính tập đóng thật, không đoán.
- Guard test cho enumerator của cây `.fgos/assignments`: một allow-list có lý do cho từng nơi đọc trực tiếp (ví dụ `unit-run-history.mjs`: chủ sở hữu ngữ nghĩa unit), thất bại khi xuất hiện enumerator mới, kể cả vòng lặp trên mảng `roots`. Không có luật nào cấm viết nó. Khôi phục câu chữ gốc của checkbox trong phase 1.

### 2. Bằng chứng judge phải trung thực (quan trọng nhất về độ tin cậy)
Reviewer xác nhận ba khẳng định sai trong bằng chứng phase 6:
- "Judge cô lập, tắt tool/MCP/settings" là **sai**: transcript Claude Code còn lưu ở `~/.claude/projects/-tmp-observe-blind-*/` cho thấy đủ tool (93 tool phụ gồm Gmail/Claude Docs), hook chạy, `CLAUDE.md` và skills được nạp. Thực tế vẫn mù (không có tool call, prompt chỉ có câu hỏi + rubric + A/B trung tính) nhưng không "cô lập".
- Hai setup **không độc lập**: bản solo chạy sau và trích kết quả của panel.
- Câu hỏi **không phải** câu 2026-10-04 như yêu cầu (how-to chính nó cũng yêu cầu dùng lại nguyên văn).

Làm:
- Sửa `judge` trong `.fgos/observe/evals/observe-measurement-261005.jsonl` (untracked, chưa từng commit nên sửa được), tiêu chí 2 của phase 6, `plans/reports/observe-discussion-measurement-261005.md` và `plans/journals/2026-10-05-observe-discussion-measurement-completed.md`: nói đúng điều đã xảy ra, nêu hai confound trên.
- Executor `claude` hiện chạy `-p {prompt} --model {model} --permission-mode acceptEdits`; `dispatch execute` không thêm được cờ cô lập. Hoặc khai báo một invocation cô lập thật trong config (kiểm cờ bằng `claude --help`, không đoán), hoặc ghi rõ trong how-to rằng cô lập chưa làm được và judge mù chỉ ở mức dữ liệu. Nếu em khẳng định cô lập, chứng minh bằng transcript sau lần chạy.
- Sửa `docs/how-to/compare-discussion-setups-with-metrics-eval.md` cho khớp.
- Nếu có quota: chạy lại so sánh đúng cách (hai setup độc lập, câu hỏi 2026-10-04, judge cô lập thật), ghi hai bản ghi eval mới. Nếu không, để các bản ghi hiện có kèm lời ghi đúng. Chạy trong thư mục dự án đích bằng mã forgentX (`cd <dự án> && node /home/vantt/projects/forgentX/bin/fgos.mjs ...`).

### 3. Lỗi đo lường tái hiện được (kèm test)
- Chọn "voter" theo tên vai (`packages/observe/rust/src/metrics_cli/discussions.rs:123-126`: `panelist`/`panelist-N`): các preset `research-fan-out*` đặt tên ghế `researcher-N` nên bị báo `unmeasured`. Dùng loại ghế/pattern ghi trong summary, không dùng tên; test với `researcher-N`.
- `recordInlineRun` (`src/runner/execution/run.mjs` ~:600) chốt cả unit chỉ từ ghế producer: unit `reviewed` có producer inline bị coi là pass trước khi checker chạy. Sửa để unit chỉ chốt khi pattern chốt.
- `genuineSplit = true` khi không có phiếu hợp lệ nào: phải là không đo được (null/`unmeasured`), không phải bất đồng thật.
- `src/runner/execution/patterns/reviewed.mjs` ~:321 vẫn `Promise.all`: checker ném lỗi thì summary được ghi khi ghế anh em còn chạy và không ai cập nhật. Chờ tất cả như `panel` đã làm.
- Unit bị giết giữa chừng không có summary và không ai phát hiện: `metrics discussions` đếm và báo `summariesMissing` thay vì im lặng.
- Mục nhỏ: summary không có thời điểm settle bị bỏ không đếm (3 ở mdview, 6 ở forgentX) → đếm; chỉ thêm chỉ dẫn stance cho ghế được đo (không cho mọi worker/synthesizer); `scripts/backfill-unit-summaries.mjs` phải bỏ qua unit đang chạy; lỗi ghi summary không được làm unit đã pass bị throw; `--stance-options` bị lờ khi `--resume` → từ chối hoặc lưu bền.

### 4. Nền tảng: các điểm Medium
- Doctor `observe-run-coverage` có thể fail nhầm: dir run tạo trong lúc host quét (~0,7 s) chưa có `result.json` nên dung sai 60 s không che. Dung sai theo mtime của dir, không theo `result.json`.
- Ví dụ đường dẫn trong thông báo fail của doctor hiện là 3 run đầu theo bảng chữ cái; phải là run thật sự thiếu hoặc đổi câu chữ cho đúng.
- `unparseable` đang gộp "chưa có `result.json`" (cả 51 ca thật) với "hỏng": tách `missing-result` ra khỏi `unparseable` (cả Rust, spec, contract).
- Run giả mạo ở chỗ khác (ví dụ `assignments/aaa/runs/01` cùng run id): `findRunDir` trả cái đầu tiên theo bảng chữ cái nên `show-run`/`watch`/`recover` thao tác lên bản giả. Phát hiện trùng run id và báo `ambiguous` (inspection đã có trạng thái này), dùng cho cả ba. Sửa dòng CHANGELOG nói run không thể bị cài vào cho đúng phạm vi (chỉ đúng với outbox).
- Phần Node không phân loại lý do bỏ qua như Rust và test Node xấp xỉ bằng ngữ nghĩa khác: đưa phân loại vào lister Node dùng chung hoặc ghi rõ phần fixture chỉ chia sẻ nửa quy tắc thư mục.

### 5. Kho evals (code, không blocker)
- Bản ghi có `rubric: discussion-quality.v1` nhưng ít hơn 5 điểm vẫn được nhận → từ chối khi ghi và báo khi đọc.
- `evalId` trùng đang được phép → từ chối.
- Cờ no-follow cứng `0x20000` ở `packages/observe/rust/src/eval_journal.rs:152` sai trên Linux arm64: dùng hằng của `libc`/`OpenOptionsExt`.
- Test đồng thời mới phủ các writer ghi shard riêng: thêm ca cùng shard.

## Dừng lại và hỏi anh (đừng tự quyết)

1. **Chính sách thời gian cho run không có `settledAt/timestamp` trong `result.json`.** Hiện 925 run thật bị bỏ (`packages/run-result/rust/src/lib.rs` quanh :550, lý do `no-timestamp`): `metrics runs --since=2026-09-01` rơi từ 887 xuống 223, trong khi `run.json` do chủ dispatch ghi có `settledAt` thật ở 706 run và `startedAt` ở 219 run. Anh từng chốt quy tắc chặt khi chỉ được đưa hai phương án; phương án thứ ba chưa từng được trình bày. Trình bày cho anh, kèm khuyến nghị:
   - (a) lấy thời gian từ `result.json`, rồi `run.json.settledAt`, rồi `run.json.startedAt`, rồi `createdAt` của assignment; run vẫn có lý do bỏ qua có đếm nếu không có gì (khuyến nghị);
   - (b) giữ quy tắc chặt, ghi rõ trong CHANGELOG/spec rằng tổng giảm;
   - (c) đếm run nhưng đánh dấu `undated`, không đưa vào cửa sổ thời gian.
   Dù chọn gì: thêm dòng CHANGELOG về thay đổi tổng, và để doctor so "run quan sát được" với "run đủ điều kiện", không chỉ số thư mục.
2. Phase 6 có ghi chú "owner explicitly requested all remaining phases on 2026-10-05, superseding the foundation-only gate". Kế hoạch đã chốt (validation) là làm phase 1-3 trước. Reviewer không tìm thấy bằng chứng nào trong repo cho yêu cầu đó. Hỏi anh có đúng không; nếu không có, bỏ ghi chú hoặc dẫn nguồn.

## Không làm
- Không đổi phạm vi kế hoạch, không thêm tính năng đo lường mới.
- Không push, không commit `AGENTS.md`/`CLAUDE.md`, không đụng `.fgos/events`/`.fgos/backups`.
- Không sửa lại các báo cáo `opus-acceptance-review-*` (chúng là hồ sơ nghiệm thu); phản hồi ghi vào báo cáo mới.

## Nghiệm thu việc của em
- Lặp lại các lệnh chứng minh (host đã build): `show-run` một run lồng; `metrics coverage` ở forgentX và `/home/vantt/projects/mdview` (so với `find` độc lập, `observed + skipped = runDirsSeen`); `metrics discussions --since=2026-10-05` từ mdview (4 run Delphi, một policy refusal 0 ghế); `metrics eval list`; `fgos doctor` với host mới và host cũ.
- `cargo test -p fgos-run-result -p fgos-observe`, test hẹp từng nhóm, rồi một lần `npm test` cuối.
- Viết `plans/reports/observe-acceptance-fixes-261006.md`: mỗi phát hiện của ba báo cáo nghiệm thu → đã sửa (commit nào, bằng chứng) / chờ quyết định của anh / không sửa (lý do). Nói thẳng điều gì còn UNPROVEN.
- Báo anh khi xong để chạy lại nghiệm thu Opus.
