# Dispatch execute mechanism — audit + tư vấn tối ưu

Phạm vi: nhánh "execute" của `src/runner/dispatch/` — đẩy 1 unit công việc ra
ngoài process hiện tại (out-of-process: spawn CLI khác, hoặc HTTP adapter).
Quy trình: 2 fork audit song song (use-case thật trong forgentX + research
trực tiếp beegog/repository-harness/pi) → 1 agent Opus tư vấn tối ưu, verify
code thật bằng Read/Grep trước khi kết luận → 2/3 câu hỏi mở được verify
thêm bởi coordinator.

## Kiến trúc hiện tại

`src/runner/dispatch.mjs` là barrel re-export (đã split từ 1 file 2204 dòng,
tsk-2uf-1) → 6 file thật trong `src/runner/dispatch/`:
`config.mjs`(834L) config/validate · `resolve.mjs`(319L) tier→model/executor
· `mechanism.mjs`(96L) quyết in-process/out-of-process/unavailable ·
`transport.mjs`(354L) `cliSpawnAdapter`(child_process.spawn, shell:false) +
`httpAdapter` (0 producer thật) · `prepare.mjs`(154L) buildPrompt ·
`cli.mjs`(649L) `spawnWorker`/`executeExecutorCli`, CLI entry
`node dispatch.mjs execute|decide|log`.

Use case thật: `spawnWorker` (runner tự dispatch batch, `loop.mjs`,
`Promise.allSettled`, 4×4 slot mặc định) và `executeExecutorCli` (CLI
`dispatch.mjs execute`, dùng bởi mọi skill qua
`.claude/skills/_shared/executor-dispatch-fallback.md` — đặc biệt
`fgos-fanout` cho parallel dispatch).

`decideExecutorDispatchMechanism` (mechanism.mjs) — **đính chính so với
audit ban đầu**: chỉ 14 dòng logic quyết định dưới ~70 dòng comment lịch sử.
KHÔNG "tùm lum" theo RUL11 — chi phí là chi phí đọc comment, không phải chi
phí nhánh quyết định.

## 2 phát hiện mới (verified bằng code, đổi thứ tự ưu tiên)

**(A) `dispatch-in-flight` không có trong recovery matrix — hợp đồng tự
khai bị phá.** `cli.mjs:359/366/373` ném `DispatchError('dispatch-in-flight')`
nhưng `recovery.mjs`'s `ERROR_CLASSES`/`RECOVERY` không khai lớp này →
`resolveAction` fail-safe = **halt cả runner** cho một tình huống lẽ ra là
"đang có người chạy, chờ rồi thử lại". `DispatchError`'s docblock
(`transport.mjs:33-35`) tự khai `errorClass` phải khớp vocab của
`recovery.mjs` — tsk-64hk port lock nhưng quên đăng ký lớp lỗi mới.

**(B) `execute` phát toàn bộ transcript subprocess vào context caller HAI
LẦN.** `cli.mjs:598` tee từng chunk ra stderr, rồi `:600-602` còn
`JSON.stringify` nguyên `result.stdout` ra stdout. Một agent gọi qua Bash
tool nuốt cả hai lần. Đây là lever token lớn nhất của toàn bộ cơ chế —
verify thêm: **luồng orchestration chính (`fgos-fanout`) không hề parse
JSON đó**, chỉ quan tâm exit code (`wave-dispatch-mechanics.md:92`) → rủi ro
đổi shape thấp.

## MUST-DO (Top 3, theo ROI)

1. **Digest-hoá output `execute`, gate bằng `process.stderr.isTTY`**
   (`cli.mjs:583-606` + return shape của `executeExecutorCli`). TTY (người
   xem) → giữ nguyên tee (không đảo quyết định verified của tsk-129);
   không-TTY (agent capture) → chunk chỉ vào `.fgos/logs/`, stdout JSON trả
   `{status, digest: tail-N, logPath, provider, model, tier}`. Đây là lát
   mỏng rẻ nhất của candidate `orchestration-protocol-v1` trong distillery —
   port lát này, không port cả RUN_CONTRACT.json schema.
2. **Đăng ký `dispatch-in-flight` vào `recovery.mjs`** (`ERROR_CLASSES`+
   `RECOVERY`, action `retry`) + `cli.mjs` trả `errorClass` dạng JSON ra
   stdout khi lỗi thay vì chỉ `err.message`. Vá hợp đồng đã tự khai, không
   phải thêm feature mới.
3. **Idle-timeout reset-theo-chunk + process-group kill** trong
   `cliSpawnAdapter` (`transport.mjs:195-239`, một hàm duy nhất). Dịch KISS
   của "idle-reconciliation-before-kill" (harness-symphony): không có kênh
   RPC hỏi liveness, nhưng có sẵn tín hiệu sống là mỗi stdout/stderr chunk —
   reset idle timer trên mỗi chunk, giữ `timeoutMs` làm trần cứng riêng;
   `detached:true` + kill cả process group để không leak grandchild.

## NÊN LÀM (sau khi 1-3 xanh)

4. **Token accounting tách own-spend vs dispatched-spend** trong
   `logExecutorDispatch` — học schema `bee-perf/v1` (`models` top-level tách
   khỏi `subagent_models` rollup). `pi` executor đã `adapted`, có
   `--mode json` → đọc usage có cấu trúc sẵn, không cần regex-scrape.
5. **`worktree-dispatch-attestation` nửa (b)** — nửa (a) đã có
   (`captureDispatchAttestation`, `transport.mjs:89`); nửa (b) so diff thật
   vs footprint khai báo, mở rộng `frozen-judge.mjs`, advisory-only. Xếp
   sau vì #1-3 phòng lỗi thường gặp hơn.

## CÂN NHẮC SAU — chưa đủ điều kiện

- `same-checkout-multi-session-coordination` (bản đầy đủ: claim/lane/
  heartbeat) — chỉ đáng khi fan-out song song thật được mở lại (hiện đã
  buộc về tuần tự sau race đã ghi nhận). Sửa #2 trước.
- `computed-parallel-wave-schedule` — giá trị thật chỉ hiện khi ≥2 executor
  chạy thật song song, chưa tới ngưỡng.
- `dispatch-tier-judged-at-dispatch` — porting-log đã đính chính field
  `work.tier` đang mang 2 nghĩa (model-mapping + gate-bypass ritual); tách
  nghĩa trước, judge động sau.
- `capability-enforced-readonly-fanout` — `pi` đã có
  `--no-tools/--tools/--exclude-tools` sẵn, chỉ cần cấu hình khi cần, không
  cần máy mới.

## TỪ CHỐI VÌ YAGNI

- Adapter `rpc`/`app-server` mới — `http` adapter đã chứng minh port
  pluggable với 0 producer, thêm adapter thứ ba là thêm tùm lum.
- `dispatch-payload-as-authority`, `agent-mail-coordination` — máy mới cho
  vấn đề chưa xảy ra ở tầng execute.
- Refactor `decideExecutorDispatchMechanism` — logic đã verified 14 dòng;
  nếu muốn giảm chi phí đọc, cắt comment lịch sử sang
  `docs/history/.../CONTEXT.md`, không động nhánh quyết định.
- Port `RUN_CONTRACT.json` schema đầy đủ — #1 đã lấy phần giá trị ngay,
  phần còn lại chờ ≥2 executor ngoài thật sự nhận việc mutation.

## Đã tự verify thêm (đóng 2/3 câu hỏi mở của advisor)

- **`modelForTier` không có silent default** (`resolve.mjs:41-42,47-48`) —
  tier thiếu/không map luôn `throw RunnerConfigError`. Candidate
  `model-tier-omission-silent-default` coi như đã giải quyết, bỏ khỏi
  backlog.
- **Consumer thật của stdout JSON**: `fgos-fanout` không parse nó, chỉ dùng
  exit code — củng cố #1 là an toàn để đổi shape.

## Câu hỏi còn mở (cần người quyết hoặc cần bằng chứng vận hành)

1. Có bằng chứng vận hành thật nào cho thấy grandchild-process leak đã từng
   xảy ra chưa (vd. agy tự shell-out tiếp)? Nếu chưa từng, phần
   process-group-kill của #3 có thể tụt xuống "nên làm"; phần idle-timeout
   vẫn giữ must-do vì độc lập với câu hỏi này.

   **Trả lời (user, 2026-08-19):** chưa có bằng chứng vận hành, nhưng theo
   dự trù thiết kế có thể xảy ra — quyết định cap nested dispatch ở 3 tầng
   thay vì chờ bằng chứng. Đã triển khai (xem phần "Đã triển khai" bên dưới).

## ⚠️ Phát hiện mới khi triển khai #1 — KHÔNG triển khai, cần quyết định

Khi bắt tay code #1 (digest-hoá output `execute` theo TTY), phát hiện xung
đột với hợp đồng ĐÃ VERIFIED (test + doc), khác với giả định ban đầu của
advisor:

- 4 test trong `test/runner/dispatch.test.mjs` chạy `node dispatch.mjs
  execute` qua `spawnSync` (không TTY) và assert `JSON.parse(result.stdout)`
  chứa nguyên `stdout`/`stderr` — comment gốc nói thẳng: "so a scripted
  caller's JSON.parse still works". Gate theo `process.stderr.isTTY` sẽ để
  MỌI caller không-TTY (bao gồm `spawnSync`, và một agent gọi qua Bash tool)
  rơi vào nhánh digest — phá 4 test này.
- Quan trọng hơn: `plugins/fgOS/skills/_shared/executor-dispatch-fallback.md`
  (dùng bởi 6 skill: fgos-coding-validating/fgos-coding-implement/
  fgos-fanout/fgos-coding-planning/fgos-coding-exploring/fgos-researching)
  DẠY session gọi `execute` qua Monitor + `grep` lọc tee, rồi đọc field
  `stdout` trong JSON kết quả NHƯ LÀ CÂU TRẢ LỜI THẬT của executor ("read
  `stdout` the same way a consumer used to read a hand-run command's own
  output"). Với pattern "ad-hoc task" (6 field), `stdout` chính là digest
  công việc cần lấy về — không phải noise.
- Kết luận: cắt/rút gọn `stdout` vô điều kiện cho non-TTY sẽ âm thầm làm
  hỏng payload thật mà các skill trên đang dựa vào. Vấn đề (B) gốc (agent
  gọi qua Bash tool nuốt cả tee lẫn JSON) đã có giải pháp DOCUMENTED sẵn
  (Monitor + grep filter) — lỗi thật là khi 1 caller không theo đúng
  pattern đó, không phải lỗi ở shape mặc định của `execute`.

**Chưa triển khai #1.** Cần anh quyết: (a) bỏ qua #1, dựa vào kỷ luật
Monitor+grep đã có sẵn; (b) làm #1 nhưng đổi thiết kế — ví dụ thêm cờ
`--digest` tường minh (opt-in, không đổi mặc định) thay vì suy luận từ TTY;
hay (c) chấp nhận phá 4 test + cập nhật lại executor-dispatch-fallback.md
cho 6 skill để chúng không còn đọc trực tiếp `stdout` nữa (phạm vi lớn hơn
nhiều so với ước tính ban đầu).

## Đã triển khai (2026-08-19)

#2 và #3 đã code xong, có test, `npm test` xanh toàn bộ (3680/3680,
0 fail). Chi tiết implementation:

- **#2 — `dispatch-in-flight` vào recovery matrix**: thêm vào
  `ERROR_CLASSES`/`RECOVERY` (`src/runner/recovery.mjs`), action `retry`.
  CLI `execute` giờ in thêm 1 dòng JSON `{error, errorClass}` ra stdout khi
  lỗi (bên cạnh message cũ trên stderr, không đổi) — `cli.mjs`'s
  `runDispatchCli`.
- **#3 — idle-timeout + process-group kill + depth cap** (gộp cùng
  `cliSpawnAdapter`, `transport.mjs`, đúng khuyến nghị "một hàm duy nhất"):
  - Process-group kill: spawn `detached: true`, mọi kill (`timeout`/
    `maxBuffer`) đổi từ `child.kill()` sang `killChildTree()` — gửi tín hiệu
    tới cả process GROUP (`-pid`), không chỉ tiến trình con trực tiếp. Xoá
    hẳn caveat GRANDCHILD-SIGTERM cũ. Có test thật: script spawn 1
    grandchild không quản lý, verify grandchild chết theo sau khi parent bị
    kill.
  - Idle-timeout: field config mới `runner.idleTimeoutMs` (optional,
    validate ở `config.mjs`), reset theo mỗi chunk stdout/stderr, độc lập
    với `timeoutMs` (trần cứng không đổi). **Opt-in, mặc định tắt** — quyết
    định có chủ đích để không đổi hành vi mặc định của mọi dispatch hiện có
    (tránh false-positive kill trên executor thật đang "nghĩ" lâu không in
    gì). Có test cho cả 2 chiều: kill sớm khi im lặng, KHÔNG kill khi vẫn có
    output định kỳ (chứng minh timer reset theo chunk, không phải timer cố
    định).
  - Nested dispatch depth cap: env var mới `FGOS_DISPATCH_DEPTH` thread qua
    mỗi lần spawn (depth hiện tại + 1); `cliSpawnAdapter` từ chối spawn khi
    depth ≥ `MAX_DISPATCH_DEPTH` (=3, hardcode theo quyết định của anh —
    không cần bằng chứng vận hành). Lỗi mới `dispatch-depth-exceeded` đăng
    ký vào recovery matrix với action `park` (không auto-retry — retry lại
    y hệt sẽ đụng cap y hệt, cần người can thiệp).
- File thay đổi: `src/runner/dispatch/transport.mjs`,
  `src/runner/dispatch/cli.mjs`, `src/runner/dispatch/config.mjs`,
  `src/runner/dispatch.mjs` (barrel export), `src/runner/recovery.mjs`,
  `CHANGELOG.md`. Test mới: `test/runner/dispatch.test.mjs` (+285 dòng, 13
  test mới), `test/runner/recovery.test.mjs` (+2 test).
- `gitnexus detect_changes` chạy nhưng index đang stale 802 commit (degraded
  theo capability gate của repo) — chỉ nhận diện 3/6 symbol thật sự đổi;
  bằng chứng chính là full test suite xanh (3680/3680), không phải
  detect_changes.
- Chưa commit — chờ anh review.
