# Làn chạy tuần tự cho các test đua nhiều tiến trình thật

Ngày 2026-10-06. Repo `/home/vantt/projects/forgentX`, nhánh `main` tại `36dc5f083`. Chưa commit (lead commit).

## 1. Kết luận ngắn

- Đã làm: `npm test` chạy hai làn — làn song song như cũ, rồi làn tuần tự (`--test-concurrency=1`) cho 12 file đua tiến trình. Danh sách có một chủ cơ học: `SERIAL_LANE` / `SERIAL_LANE_EXEMPT` trong `test/test-ownership.mjs`, và luật lint mới trong `scripts/test-ownership-lint.mjs` (chạy cả trong `npm test` lẫn CI).
- Giá: làn tuần tự mất **37,5 s** trong lần `npm test` sau thay đổi. Đường găng của làn song song là `fgctl-init` (229 s), nên bỏ 12 file khỏi làn song song không rút ngắn được làn đó. Vì vậy giá ước tính khoảng +38 s, **≤ 60 s**.
- Tiêu chí flake **không đạt theo nghĩa đen**. Tải CPU (16 và 48 burner) không tái hiện được lỗi trước thay đổi (0/15). Tải fsync tái hiện được (9/15), nhưng chạy lại y hệt sau thay đổi thì còn tệ hơn (5/5, em dừng sớm có chủ ý). Tải fsync là tải *bên ngoài* suite; làn tuần tự chỉ loại bỏ tải từ các file test khác, không che được tải từ ngoài. Dưới đồng tải thật bằng 185 file test, cả trước lẫn sau đều 0/15. Theo đúng điều kiện chạy của làn (không có file nào khác chạy cùng), kết quả là 0/15.
- Vì vậy, việc làn tuần tự làm giảm tỉ lệ flake 1/4 mà lead quan sát được trong full suite là **UNPROVEN**. Xem mục 9 và 10.

## 2. Prior art

| Nguồn | Đã có | Đã gỡ / bị bác | Em tái sử dụng / mở rộng |
|---|---|---|---|
| `plans/261004-1121-flaky-tests-under-load/` (cùng chủ đề) | Watchdog theo file (`scripts/lib/test-file-watchdog.mjs`, 10 phút); `scripts/stress-test-files.mjs`; sửa provider-capacity bằng một pool contender, fanout bằng rendezvous, writer identity bằng `/proc` | `reports/repro.md`: tải nhẹ (2 burner) **không tái hiện được** lỗi; nguyên nhân rút ra từ đọc code | Giữ watchdog (một supervisor phủ cả hai làn). Mở rộng `stress-test-files.mjs` thêm `--burner=fsync`, và mỗi vòng dùng một TMPDIR riêng rồi xoá |
| Commit `6cf82bc8a` | Pool 10 contender dùng lại cho mọi trial, `t.after` kill pool | ~150 tiến trình ngắn → 10 | Không đổi test |
| Commit `1b39dcb54` | S3 round 2 truyền `waitMs: 300_000` cho `withFileLock` | — | Ghi nhận: S3 round 1 vẫn dùng ngân sách mặc định 5000 ms (mục 10) |
| `docs/history/tsk-4fx-concurrency-test-lock-timeout-flake/` | `raceAcrossProcesses` có `batchSize` (store/porting-store) | Đã bác: nới timeout khoá events, giảm số lần đua, retry | Không đổi; làn tuần tự là hướng "serialise the cases" mà mục đó từng nêu |
| `archive/plans/260920-immediate-test-feedback-reduction/` | Manifest sở hữu `test/test-ownership.mjs`, canary, `test:related`, `scripts/test-ownership-lint.mjs` | Tách file chi tiết: kết quả âm | Danh sách làn đặt vào manifest này; luật mới thêm vào lint có sẵn |
| `scripts/test-proof-inventory.mjs:170` | Từ vựng phân loại `concurrency-timing` (`concurrent|racing|race|lock contention`) | — | Dùng lại từ vựng này cho phần tên test trong mẫu lint |
| `git log -S"test-concurrency"` / `-G"serial…"` | Chỉ có `stress-test-files --concurrency`, ví dụ argv trong test | **Chưa từng** có khái niệm "làn" hay danh sách file nặng | Tạo mới (không có gì để mở rộng) |

## 3. Kiểm kê file đua tiến trình (đo trước)

**Cách đo.**
- Tĩnh: regex trên 366 file `*.test.mjs`. Có 180 file gọi trực tiếp API khởi chạy tiến trình (brief ghi "172"; con số đo hôm nay là 180), 50 file khởi chạy bất đồng bộ.
- Động: chạy riêng từng file trong 366 file (`node --test <file>`, pool 6) và lấy mẫu `/proc` mỗi 15 ms. Chỉ số `maxSiblings` là số tiến trình con sống đồng thời lớn nhất dưới một tiến trình cha trong cây của file đó. Đây là cận dưới: mẫu 15 ms có thể lọt các cuộc đua rất nhanh.
- Phân bố maxSiblings: `{0:153, 1:174, 2:24, 3:5, 4:2, 6:2, 11:1, 16:3, 50:2}`. Không file nào fail khi chạy riêng, và lần quét này không chạm vào `.fgos`.

**Tiêu chí "đua tiến trình".** Một test khởi chạy **≥ 2 tiến trình OS cùng lúc**, các tiến trình **tranh một khoá hoặc store chung**, và kết luận của test **phụ thuộc thứ tự xen kẽ** (một người thắng duy nhất, không mất cập nhật, loại trừ lẫn nhau).

Không tính là đua:
- pool worker chạy các lệnh độc lập (rust-host `harness`/`release-tree`, `concurrency: 8`);
- fan-out executor vai trò của chính sản phẩm (`workflow/*`, 3 tiến trình);
- người giữ khoá đã sống sẵn rồi mới có người tranh, thứ tự cố định (`assignment-cwd-mutex-concurrency`, `dispatch.test` tại `:4260`);
- chạy đồng thời bằng async trong một tiến trình (`merge.test`, `loop`, `herdr-reconciliation`);
- CLI kèm tiến trình git con của nó (setup/*, cli/*).

Thời gian chạy riêng là trung vị của 3 lần chạy tuần tự trên máy rảnh. Cột "sau" là phép đo (b) lặp lại sau thay đổi (các file test không đổi).

| File | maxSiblings | Riêng trước (s) | Riêng sau (s) | Phân loại |
|---|---|---|---|---|
| runner/provider-capacity | 11 | 6,00 | 6,77 | **serial**: 10 contender fork |
| runner/lock | 50 | 6,86 | 6,94 | **serial**: 50 racer |
| runner/session | 50 | 2,41 | 2,21 | **serial**: 50 tiến trình, sessions.lock |
| runner/concurrent-claim-eventlog-loss | 6 | 0,91 | 0,94 | **serial** |
| state/store | 6 | 2,28 | 2,33 | **serial** |
| state/events | 4 | 1,29 | 1,30 | **serial** |
| state/porting-store | 4 | 2,75 | 2,78 | **serial** |
| runner/main-checkout-lock | 2 | 1,95 | 1,95 | **serial**: racer-a/racer-b |
| runner/dispatch-assignment-id-claim-concurrency | 2 | 0,14 | 0,12 | **serial**: barrier go-file |
| runner/dispatch-reconciliation-concurrency | 2 | 0,11 | 0,10 | **serial** |
| runner/assignment-dispatch | 2 | 15,18 | 13,12 | **serial**: hai tiến trình đua admission |
| rust-host/fgctl-stage | 1 (mẫu lọt) | 2,42 | 2,39 | **serial**: 8 tiến trình theo code |
| **Tổng 12 file** | | **42,3** | **41,0** | |
| rust-host/fgctl-init | 16 | 229,29 | (không đo lại, file không đổi, tốn 11 phút) | **exempt**: giá |
| runner/merge | 1 | 6,74 | 6,84 | **exempt**: dương tính giả, đua trong một tiến trình |
| runner/run-lock-identity (brief nêu) | 1 | 0,16 | 0,14 | **không đua**: chỉ `spawnSync` một tiến trình tự thoát để lấy pid chết |
| runner/assignment-cwd-mutex-concurrency (brief nêu) | 2 | 15,45 | 15,48 | **không đua**: người giữ có trước, người tranh đến sau |
| runner/dispatch (brief nêu) | 2 | 16,25 | 16,23 | **không đua**: người giữ/người tranh; overlap chứng minh bằng rendezvous |

## 4. Đo flake dưới tải (trước / sau)

Lệnh đo: `FGOS_HOST_BIN=target/debug/fgos node scripts/stress-test-files.mjs --rounds=15 --burners=N --burner=X [--concurrency=1] <12 file serial>`. "Trước" = mức song song mặc định, đúng như runner cũ chạy các file này. Em kiểm `uptime` trước mỗi phép đo; không thấy phiên nào khác chạy việc nặng. Tải nền ghi bên dưới chủ yếu là tải còn sót lại đang giảm dần từ chính phép đo trước đó của em.

| # | Tải | Cấu hình | K | Fail | Test fail | Tải nền lúc bắt đầu |
|---|---|---|---|---|---|---|
| 1 | 16 burner bash (CPU) | trước | 15 | **0** | — | 0,90 |
| 2 | 48 burner bash (CPU ×3) | trước | 15 | **0** | — | 17,6 (sót từ #1) |
| 3 | 16 burner fsync (ghi đè 4 MB + fsync, lặp) | trước | 15 | **9** | S3 ×8; createSession ×1; assignment-dispatch (assignmentId đồng thời) ×1, (S1 live probe 10 s) ×1 | 3,48 |
| 4 | 16 burner fsync | sau (`--concurrency=1`) | dừng ở 5 | **5/5** | S3 ×5; createSession; movePorting | 3,75 |
| 5 | Đồng tải thật: 12 ứng viên + 173 file nặng (`test/cli` nặng, `test/runner`, `test/state`, `test/rust-host`, trừ herdr/gateway/live/fgctl-init/fgctl-upgrade), chạy qua `runSelectedTests` thật, ABAB | trước (`serialFiles: []`) | 15 | **0** | — | 4,0–24,7 (phân bố đều do xen kẽ) |
| 6 | như #5 | sau (làn thật) | 15 | **0** | — | như trên |
| 7 | không có tải ngoài (đúng điều kiện chạy của làn trong `npm test`) | sau, chỉ làn tuần tự | 15 | **0** | — (39,8–44,7 s/vòng) | 1,66 |

- Cơ chế tái hiện ở #3 trùng chữ ký lỗi lead thấy (S3, ~8–20 s): `ProviderCapacityLockError: … still held by a live process … after waiting` (`withFileLock`, `src/runner/dispatch/provider-capacity.mjs:533`, `waitMs` = 5000, người giữ fsync trong vùng găng) và `SessionError: timed out acquiring sessions.lock … after 10000ms`. Nghẽn nằm ở độ trễ fsync, không ở CPU (#1, #2 đều 0).
- #4 tệ hơn #3: khi chạy một file một lúc, file đó chỉ còn chiếm một phần nhỏ băng thông I/O so với 16 burner, nên độ trễ fsync của nó dài hơn. Em dừng #4 sau 5 vòng (5/5 fail) để dành thời gian máy cho #5–#7; kết luận đã rõ.
- Pilot đồng tải chỉ với 30 file CLI: 0/4 cả trước lẫn sau, rồi em dừng. Lý do: thứ tự sắp xếp khiến các file CLI chạy xong trước khi ứng viên bắt đầu.
- #5/#6 cho cùng 4353 testcase JUnit ở cả hai cấu hình (pilot là 887/887). Điều này xác nhận việc gộp báo cáo JUnit theo làn đúng khi chạy thật. Không có rò `.fgos`, không file nào bị watchdog kill. Giá làn trên tập con này: trung vị **101,8 s → 141,6 s (+39,8 s)**.

## 5. Full suite (hai lần `env -u CLAUDE_CODE_SESSION_ID npm test`)

Cả hai lần đều đặt `FGOS_HOST_BIN=target/debug/fgos`, bản build cùng HEAD, để worktree không phải build lại cargo. Bộ lấy mẫu sidecar ghi PSI và danh sách file đang chạy mỗi giây.

| | Nơi chạy | Tải lúc đầu | Wall | Kết quả |
|---|---|---|---|---|
| Trước | worktree tách rời `/var/tmp/fgx-serial-lane-before` tại `36dc5f083` (cây chính đã có thay đổi) | 1,95; swap 2047/2047, còn ~9,4 GB | 155,1 s | **KHÔNG HỢP LỆ cho rust-host**: 52 fail ở `fgctl-init` (20), `fgctl-upgrade` (16), `fgctl-stage` (13), `release-tree` (3) — `build-rust-distribution.mjs:156` từ chối vì symlink `node_modules` của worktree: "Production dependency "yaml" resolves outside the checkout". Mọi ứng viên ngoài rust-host đều pass; mỗi file chạy cùng ~14 file khác; io.full avg10 tối đa 3,5 |
| Sau | checkout chính | 1,99; cùng điều kiện RAM | **360,6 s** | **Xanh**: làn song song 6568 test, 0 fail, 321,5 s; làn tuần tự 324 test, 0 fail, **37,5 s** |

Sidecar của lần chạy sau cho thấy:
- Cả 12 file làn tuần tự chạy với **0 file khác** cùng lúc, tối đa 1 file tuần tự một lúc, không có tiến trình sót từ làn song song.
- Làn song song kết thúc ở +321 s, đúng lúc `fgctl-init` (+96 s → +321 s) kết thúc. Từ +161 s trở đi `fgctl-init` gần như chạy một mình.

Như vậy giá của làn ≈ thời gian làn tuần tự ≈ 37,5 s (cộng khoảng 1 s khởi động). Thời gian ước tính trước thay đổi ≈ 323 s, khớp khoảng 320–349 s mà prior art ghi ngày 2026-10-04. Em **không** chạy lần thứ ba để có một mốc "trước" hợp lệ, vì đúng giới hạn hai lần.

## 6. Thiết kế

`scripts/run-tests.mjs`:
- `splitLanes(relFiles, serialFiles)` khớp theo đường dẫn posix tương đối với cwd. Vì vậy chỉ một lần chạy có cwd là gốc repo mới chọn được làn tuần tự; fixture trong thư mục tạm không bị ảnh hưởng.
- `runSelectedTests` chạy làn song song trước, rồi làn tuần tự với `SERIAL_LANE_ARGS = ['--test-concurrency=1']` đặt **sau** các tham số chuyển tiếp. Node lấy giá trị cuối cùng; em đã kiểm bằng thứ tự start/end.
- Làn rỗng thì bỏ qua. Hai làn luôn cùng chạy. Status là status khác 0 đầu tiên. Khi có hai làn, log ghi `run-tests: ERROR: the <lane> lane failed (exit N, M file(s))`, và kết quả trả về có thêm `lanes`.
- Giữ nguyên: env/TMPDIR riêng cho mỗi lần chạy (dùng chung cho cả hai làn), một watchdog phủ mọi file, hàng đợi full-suite, `forwardedArgs`, chốt kiểm rò `.fgos` (snapshot trước và sau cả hai làn).
- Mới, và bắt buộc: khi có hai làn, mỗi `--test-reporter-destination=<file>` (cả dạng `=` lẫn dạng tách) được chuyển thành một file riêng cho từng làn rồi gộp lại. JUnit được gộp thành một `<testsuites>`; reporter khác được nối chuỗi. Nếu không gộp, `node --test` lần thứ hai sẽ ghi đè `test-results/full.xml` của CI, JUnit của `test-timing`, và JUnit của `test-select-mutate runFullSuite`. Nếu không ghi được đích thì run fail và log nói rõ đích nào.
- `test:canary`, `test:related`, `test:related:shadow`, `test-select-run-plan` (job related của CI) và `test-timing` đều đi qua `runSelectedTests`/`runTests`, nên tự có làn.

Các script gọi `node --test` trực tiếp, không qua làn:
- `test-select-mutate.mjs runRelatedCaptured`: phân loại mutant, không phải bằng chứng hoàn thành; một flake có thể làm mutant bị tính là "killed".
- `test-select-coverage-map.mjs`: pool riêng để thu coverage.
- `test-select-compare.mjs`: chạy một test theo tên.
- `stress-test-files.mjs`: công cụ đo, tự nhận `--concurrency`.

Không script nào trong số này là cổng DoD, nên em không đổi; đây là rủi ro còn lại.

## 7. Chủ sở hữu danh sách và luật lint

- Chủ: `test/test-ownership.mjs`.
  - `SERIAL_LANE`: 12 mục `{file, reason}`, lý do ghi số racer đọc từ code.
  - `SERIAL_LANE_EXEMPT`: `merge.test` (dương tính giả) và `fgctl-init` (229 s; đưa vào làn tuần tự sẽ cộng thêm từng ấy vào mọi lần `npm test`).
- Luật `findSerialLaneProblems` trong `scripts/test-ownership-lint.mjs` báo lỗi khi:
  - (a) một file khớp mẫu đua nhưng không có trong cả hai danh sách; thông báo chỉ cách sửa (thêm vào `SERIAL_LANE` kèm lý do, hoặc vào `SERIAL_LANE_EXEMPT` nếu "đua" không phải giữa các tiến trình OS);
  - (b) mục trỏ tới file không tồn tại;
  - mục trùng lặp, hoặc mục thiếu `reason`;
  - mục miễn trừ không còn khớp mẫu (miễn trừ cũ).
  - Luật được gắn vào `lintManifest` (`npm run test:ownership:lint`, CI `ci.yml:131`). Ngoài ra có thêm test "the repository itself…" trong `test-ownership-lint.test.mjs`, nên `npm test` cũng tự thi hành luật này.
- Mẫu có ba điều kiện:
  1. tên một test chứa `concurrent|concurrently|racing|racer(s)|race|contender(s)|multiprocess`;
  2. có khởi chạy tiến trình bất đồng bộ `spawn(|fork(|execFile(|promisify(exec…)`;
  3. có `Promise.all|allSettled(` hoặc `Array.from({ length`.
- Kết quả trên 366 file (180 file khởi chạy tiến trình) so với kiểm kê động kèm đọc code:
  - khớp 14, dương tính đúng 13, **dương tính giả 1** (`merge.test`: async trong một tiến trình, git chạy kèm);
  - **âm tính giả 0** so với tiêu chí ở mục 3: 25 file có maxSiblings ≥ 2 nhưng không khớp mẫu đều được đọc code và phân loại là không đua.
  - Giới hạn đã biết: một test đua có tên không dùng từ vựng "race" sẽ lọt; kiểu cũ như `assignment-cwd-mutex` thì không phải đua.
  - Em không dùng hằng số đánh dấu trong file test, vì brief không cho sửa các file test đua và mẫu tự động đã đủ chính xác.

## 8. Test và mutation

- `test/scripts/run-tests.test.mjs`: 45/45 pass. Các test mới:
  - splitLanes;
  - danh sách thật đều là file test có thật;
  - thứ tự làn và argv có concurrency 1 sau tham số chuyển tiếp;
  - fail ở làn song song hoặc làn tuần tự: làn kia vẫn chạy, status khác 0, log nêu tên làn;
  - status null tính là fail;
  - chọn chỉ file tuần tự hoặc chỉ file song song (argv giữ nguyên như cũ);
  - danh sách rỗng;
  - retarget và gộp reporter;
  - đích JUnit nhận kết quả của cả hai làn;
  - đích không ghi được thì fail;
  - test **thật** (spawn thật): file tuần tự không bao giờ chồng nhau và chỉ bắt đầu sau khi làn song song kết thúc.
  - Fixture `mirroredRepoRoot` nay chép thêm `test/test-ownership.mjs`.
- `test/scripts/test-ownership-lint.test.mjs`: 9/9 pass. Phủ mẫu (một dương tính, bốn âm tính), file đua chưa liệt kê, đã liệt kê, miễn trừ, mục chết, mục trùng, mục thiếu lý do, miễn trừ cũ, `lintManifest` chặn, và repo thật sạch. Fixture được dựng từ các mảnh để chính file test không tự khớp mẫu.
- Mutation, làm trong bản sao `scripts/` + `test/` dưới `/var/tmp` (cây làm việc không bị đụng; bản sao đối chứng xanh): **9/9 mutant bị diệt**.
  - bỏ `--test-concurrency=1`;
  - đảo thứ tự làn;
  - dừng sau làn fail;
  - splitLanes bỏ qua danh sách;
  - bỏ gộp reporter;
  - lint cho qua file đua chưa liệt kê;
  - lint cho qua mục chết;
  - lint không gắn vào `lintManifest`;
  - lint cho qua miễn trừ cũ.
- `node scripts/test-ownership-lint.mjs`: pass. Cảnh báo `test/direct/merge-gate.test.mjs` là cảnh báo có từ trước.

## 9. Impact (GitNexus)

- Năng lực impact-analysis: `present`, nhưng index **cũ** (b334695 so với HEAD 36dc5f0), nên proof yếu.
- Đa repo: em định danh repo bằng đường dẫn `-r /home/vantt/projects/forgentX` lấy từ `list`.
- `impact` upstream:
  - `runSelectedTests`: **MEDIUM**, 5 caller trực tiếp (runCanary, runTests, runSelected, test-select-run-plan, …), 13 mục bị ảnh hưởng;
  - `runTests`: LOW, 14 mục;
  - `buildTestArgv` (không sửa): LOW;
  - `lintManifest`: LOW.
  - Em đã đối chiếu bằng grep (`run-test-canary`, `test-select`, `test-select-run-plan`, `test-timing`, `test-select-mutate`): khớp.
- `detect-changes`: 7 file, rủi ro **low**, 0 process bị ảnh hưởng. Một số symbol được báo chỉ vì dịch dòng trên index cũ.
- Không đổi component boundary.

## 10. UNPROVEN và khuyến nghị

**UNPROVEN**
- Làn tuần tự có giảm được tỉ lệ flake 1/4 trong full suite mà lead quan sát hay không. Bằng chứng hiện có:
  - đồng tải nội bộ (185 file, K=15) không tái hiện lỗi;
  - lần full suite trước thay đổi (1 mẫu) cho thấy ứng viên chạy cùng ~14 file nhưng áp lực I/O thấp và đều pass;
  - tải duy nhất tái hiện được là tải fsync bên ngoài, và làn không che được tải đó.
  - Điều kiện máy lúc lead thấy lỗi không được ghi lại. Swap đầy suốt buổi đo; có thể lúc đó có phiên khác đang chạy.
- Burner fsync có phải là đại diện công bằng cho tải của full suite hay không: chỉ có chữ ký lỗi trùng nhau làm căn cứ.
- Mốc thời gian full suite "trước" hợp lệ: không có (mục 5); +38 s là ước tính.
- `fgctl-init` (miễn trừ) vẫn có một test đua 24 tiến trình nằm trong làn song song; chưa đo dưới tải.
- Đường gộp JUnit chưa chạy trong CI thật; mới được kiểm qua unit test và hai phép đo đồng tải.

**Khuyến nghị** (có tham khảo kongming)
1. Vẫn giữ làn, cùng lint và gộp reporter, nhưng gọi đúng tên: một rào cấu trúc loại bỏ tải từ *các file test khác* (giá ~38 s, không sửa test), **không phải** bản sửa flake đã được chứng minh.
2. Sửa đúng nguyên nhân, nhưng cần lead quyết vì chạm ràng buộc "không nới timeout". S3 round 1 đi qua `acquireProviderAccountLease` với `waitMs` mặc định 5000 ms của sản phẩm, trong khi S3 round 2 đã truyền `waitMs: 300_000` (`1b39dcb54`). Nếu luồn `waitMs` xuống được và truyền nó trong round 1, test vẫn giữ 10 contender, 10 trial, không retry, và tính chất cần kiểm (không mất lease) không còn phụ thuộc hằng số chính sách sản phẩm. Nếu lead coi đây là "nới timeout" thì bỏ qua đề xuất này.
3. Ghi nhận cho sản phẩm (một dòng backlog, ngoài phạm vi việc này): ngân sách khoá 5 s là chật khi ≥ 10 contender fsync trong vùng găng trên một đĩa bận. Phép đo #4 cho thấy điều này xảy ra thật ngay cả khi chỉ chạy một file.
4. Tối ưu sau này (chưa làm): làn song song có khoảng 160 s gần như chỉ còn `fgctl-init` chạy một mình. Nếu cho làn tuần tự chạy trong khoảng đó thì giá gần bằng 0, nhưng sẽ phá nguyên tắc "không file nào chạy cạnh"; cần quyết định riêng.

## 11. Cần cập nhật tài liệu

- Đã sửa: `docs/how-to/use-fast-test-feedback-commands.md`, thêm một đoạn ngắn về hai làn, lint và việc canary/related cũng chạy theo làn.
- CHANGELOG: không sửa. Đây là hạ tầng test của repo; người dùng fgOS không thấy thay đổi nào, chỉ có thêm một dòng log `run-tests: serial lane: …` khi chạy `npm test` trong repo này.
- Nên cân nhắc (lead quyết): thêm vào `plans/261004-1121-flaky-tests-under-load/reports/` (hoặc một báo cáo tiếp theo) cách tái hiện bằng `--burner=fsync`, vì đây là lần đầu tái hiện được lỗi có số liệu; trước đó `repro.md` ghi rõ là không tái hiện được.

## 12. File thay đổi

`scripts/run-tests.mjs`, `scripts/stress-test-files.mjs`, `scripts/test-ownership-lint.mjs`, `test/test-ownership.mjs`, `test/scripts/run-tests.test.mjs`, `test/scripts/test-ownership-lint.test.mjs`, `docs/how-to/use-fast-test-feedback-commands.md`. Không đụng `src/`, `packages/`, `apps/`, hay nội dung các test đua.

Dọn dẹp:
- đã gỡ worktree `/var/tmp/fgx-serial-lane-before` và mọi bản sao mutation;
- đã kill mọi tiến trình đo;
- đã xoá ~20.000 thư mục fixture mà các vòng stress của em làm rò vào `/tmp`; `stress-test-files.mjs` nay cấp cho mỗi vòng một TMPDIR riêng và xoá nó;
- `.fgos` không đổi.
