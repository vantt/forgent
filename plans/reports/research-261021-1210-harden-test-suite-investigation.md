# HARDEN: vì sao bộ test chậm dần và ngày càng nhiều

Phase 00 của [plan HARDEN](../261021-1118-harden-low-layers-bottom-up/plan.md), điều tra toàn bộ suite một lần theo [đề xuất §4.7b](proposal-261021-0851-harden-review-criteria-and-method.md). Phiên `forgent-a8`, 2026-10-21 12:10–13:00 (Asia/Saigon), máy thứ hai. Câu owner hỏi: "tại sao chúng ta đi qua rất nhiều lần để improve nhưng test vẫn ngày càng chậm và số unit ngày càng nhiều".

## 0. Trả lời ngắn

Các lần cải thiện trước nhắm vào **cách chạy** (tách file cho chạy song song, queue toàn máy, nới timeout), trong khi chi phí nằm ở **chi phí mỗi test** và **cách test được tạo ra**. Cụ thể có bốn nguyên nhân, xếp theo mức ảnh hưởng đo được:

1. **Mỗi lần test gọi CLI thật thì đắt hơn tháng 8 khoảng 3–4 lần, và tháng 10 test gọi CLI nhiều hơn.** Hồi 08-27, `node bin/fgos.mjs --help` mất 47 ms và `fgos init` mất 57 ms. Hôm nay hai lệnh đó mất 150 ms và 247 ms (load 8), còn trong suite trung bình 460–690 ms. Lý do nằm ở sản phẩm, không ở test:
   - mỗi tiến trình nạp 291 module;
   - mỗi tiến trình đọc lại và băm SHA-256 toàn bộ addon trước khi nạp. Trong test, addon là bản debug 86 MB, nên riêng việc này tốn khoảng 75 ms;
   - mỗi lệnh có 5–6 lần gọi git, lần nào cũng chạy trong bwrap, cộng một lần probe bwrap.
   
   136 file gọi CLI chiếm **49% tổng thời gian file** của suite.
2. **Test được tạo theo kiểu chỉ thêm.** Từ 10-01, 181 commit thêm file test, chỉ 4 commit vừa thêm vừa gỡ. 79 trong 100 file bị xoá nằm trong một commit duy nhất (gỡ engine coordination, 10-02). Từ tuần 41 tới nay thêm 236 file, chỉ xoá 11. Cùng giai đoạn 10-15 → 10-21, số test Rust tăng từ 565 lên 1 451 và số test Node cũng tăng thêm khoảng 700. Chuyển sang Rust nhưng không gỡ bản Node.
3. **Một nhóm nhỏ test dựng cả môi trường thật cho từng ca.** 1 223 test (15%) chạy từ 1 s trở lên và chiếm **88%** tổng thời gian test. 5 651 test dưới 0,1 s chỉ tốn 41 s. Riêng 8 file `test/rust-host/fgctl-*` và `release-tree` tốn 1 223 s: mỗi ca chạy `fgctl init` thật (6–23 s, vì nó chạy cả `fgos doctor` 145 row) và build lại release (`build-rust-distribution.mjs`, khoảng 10 s một lần).
4. **Cơ chế chạy làm mất khoảng một phần ba wall time.** Suite xếp file theo thứ tự tìm thấy. File dài nhất (`fgctl-upgrade`, 323 s) tới giây 164 mới bắt đầu, nên 40% thời gian cuối chỉ còn 1–4 file chạy. Xếp file chậm chạy trước thì wall có thể từ 488 s xuống khoảng 330 s, không phải sửa test nào. Thêm vào đó, cạnh tranh CPU trong suite làm file chậm hơn khoảng 40% so với chạy riêng.

Vì sao "cải thiện nhiều lần" không giữ được: tài liệu của chính repo ([knowledge 08-27](../../docs/knowledge/why-splitting-test-files-hits-a-floor-and-why-narrowing-veri/why-splitting-test-files-hits-a-floor-and-narrowing-verify-never-helped.md)) đã đo ra rằng tách file chạm sàn, và đòn bẩy duy nhất là **giảm tổng CPU**: spawn ít tiến trình thật hơn, chặn những gì đắt mà test không cần. Nhưng các vòng sau vẫn đi tiếp đường tách file: 10-14 tách `fgctl init` thành 5 file song song, 10-17 thêm queue toàn máy. Trong khi đó chi phí mỗi tiến trình của sản phẩm tăng (addon 10-18, containment port 10-18, Git 07 đưa mọi lệnh git qua addon và bwrap). Không có cổng nào đo chi phí mỗi lần gọi CLI hay chi phí của test mới thêm, nên mỗi tính năng làm chậm một chút mà không ai thấy.

## 1. Đo ở đâu, đo thế nào

| Mục | Giá trị |
|---|---|
| Máy | máy thứ hai (`fg-server2`), 24 CPU, Linux 7.0, Node v24.22.0, ext4 trên NVMe |
| Code | `main` ở `d65407bc7`, worktree sạch `~/projects/forgent-worktrees/harden-p00`, `CARGO_TARGET_DIR` riêng, `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`, `FGOS_SESSION_ID` đã unset |
| Lần chạy 1 | `node scripts/test-timing.mjs profile` (công cụ của TEST; reporter junit), bắt đầu 12:11:39, load 1 phút 4,5 lúc đầu, tới khoảng 30 ở đỉnh (do chính suite). Kết quả: **xanh, 581 file, 8 775 testcase junit, 0 lỗi, 98 skip, wall 488,6 s**, CPU user 2 623 s và **system 2 267 s**, RSS đỉnh 1,0 GB |
| Probe | một module `--import` tạm (trong scratchpad, không commit) đặt vào mỗi tiến trình file test. Nó ghi wall của file và thời gian từng lần spawn của tiến trình test (lệnh nào, sync hay async). Spawn lồng bên trong một lệnh CLI được tính vào thời gian của lệnh đó |
| Chạy riêng | 10 file chậm nhất, mỗi file chạy riêng bằng `node --test <file>` với cùng env (addon và host stage qua `ensureGitAddon`). Dừng ở file thứ 10 để nhường máy cho phép đo E3 của Git (owner bật governor `performance`) |
| Dữ liệu thô | `/tmp/fgos-work/harden-p00/` (`run1/` gồm `junit.xml`, `spy/*.json`, `stderr.log`; `a1/files.json`; `solo.jsonl`; `classify.json`; `growth.txt`; `cli-cost.json`; `strace-*.txt`) |

Sau lần chạy 1, worktree bị bẩn: suite tự sinh lại `packages/git/contracts/mutation-census.v1.json`, vì bản commit trên main đã cũ. Lane GIT đã sửa ở `534f0fd7a`. Lỗi này làm mọi lần `test-timing` bị đánh `valid: false`, nên lần profile này phải đọc junit trực tiếp.

## 2. Bức tranh tổng

- **Tổng wall của các file: 6 583 s**, suite wall 488 s, tức trung bình 13,5 file chạy song song (tối đa 23).
- **Khoảng 92% thời gian của file nằm trong tiến trình con** (6 071 s spawn so với 6 583 s wall; spawn async có thể chồng nhau nên đây là cận trên). CPU riêng của tiến trình test rất nhỏ: file chậm nhất (`fgctl-upgrade`, 323 s) chỉ dùng 0,4 s CPU của chính nó.
- **CPU system gần bằng CPU user** (2 267 s so với 2 623 s), 345 triệu minor page fault. Đây là dấu hiệu của chi phí tạo tiến trình (fork, exec, nạp module), không phải tính toán.
- Theo thời gian từng test (junit, 8 314 testcase có thời gian, tổng 5 743 s):

| Thời gian một test | Số test | Tổng thời gian |
|---|---:|---:|
| < 0,1 s | 5 651 | 41 s |
| 0,1–1 s | 1 440 | 644 s |
| 1–5 s | 997 | 2 266 s |
| 5–30 s | 207 | 1 961 s |
| ≥ 30 s | 19 | 831 s |

- Theo thư mục (tổng wall của file):

| Thư mục | File | Wall | `test()` |
|---|---:|---:|---:|
| `cli` | 73 | 1 634 s | 893 |
| `rust-host` | 16 | 1 338 s | 142 |
| `runner` | 158 | 1 326 s | 2 863 |
| `run-supervisor` | 20 | 520 s | 143 |
| `workflow` | 24 | 470 s | 236 |
| `e2e` | 15 | 307 s | 104 |
| `event-store` | 16 | 225 s | 74 |
| `git` | 23 | 183 s | 107 |
| `setup` | 57 | 119 s | 919 |
| `state` | 59 | 78 s | 1 299 |

`cli` và `rust-host` gộp lại có 89 file và 1 035 test, nhưng chiếm 45% thời gian. Ngược lại, 182 file chạy hoàn toàn trong tiến trình (không spawn gì) chứa 2 347 test (29%) mà chỉ tốn 473 s (7%).

## 3. Cơ chế chạy hay bản thân test

**Chạy riêng so với trong suite** (10 file chậm nhất; load lúc chạy riêng 1,4–8,7 vì máy dùng chung):

| File | Riêng | Trong suite | Tỷ lệ |
|---|---:|---:|---:|
| `rust-host/fgctl-upgrade` | 288 s | 323 s | 0,89 |
| `runner/loop` | 185 s | 246 s | 0,75 |
| `rust-host/fgctl-init` | 145 s | 195 s | 0,75 |
| `rust-host/fgctl-init-download` | 111 s | 158 s | 0,70 |
| `run-supervisor/crash-matrix-adopt-resume` | 123 s | 158 s | 0,78 |
| `rust-host/fgctl-init-download-sources` | 129 s | 157 s | 0,82 |
| `cli/fgos-merge` | 60 s | 148 s | 0,41 |
| `e2e/runner-loop` | 78 s | 143 s | 0,54 |
| `runner/execution/run` | 81 s | 135 s | 0,60 |
| `rust-host/fgctl-init-activation` | 73 s | 123 s | 0,59 |
| **Tổng** | **1 271 s** | **1 786 s** | **0,71** |

Phần lớn là chi phí của chính test: chạy riêng vẫn còn 71%. Cạnh tranh trong suite cộng thêm khoảng 40%. File gọi CLI dày (`fgos-merge`, `runner-loop`) chịu cạnh tranh nặng nhất, vì CLI tốn CPU system.

**Thứ tự chạy.** Dựng lại dòng thời gian từ thời điểm kết thúc của từng file:

| Phần của wall | 0–50% | 50–60% | 60–70% | 70–80% | 80–100% |
|---|---|---|---|---|---|
| Số file chạy song song (trung bình) | 20–23 | 18,3 | 7,9 | 3,8 | 0,9–1,2 |

180 s cuối của suite chỉ có 4 file trở xuống. `fgctl-upgrade` (323 s) bắt đầu ở giây 164 và chạy một mình tới hết. Cận dưới lý thuyết khi file dài nhất chạy trước là max(323 s, 6 583 s / 23 ≈ 286 s), tức khoảng 330 s. Đây là ước tính chưa đo: kiểm bằng một lần chạy có sắp thứ tự.

**Trần 600 s mỗi file.** Lần chạy 1 không có file nào chạm trần (lớn nhất 323 s). Trên máy owner có 3 file chạm trần (đề xuất §4.7b), cùng một nhóm file: các file ≥ 120 s ở đây chính là các file chạm trần khi máy chậm hơn hoặc tải nặng hơn.

**Queue toàn máy.** Lần chạy 1 không phải chờ queue (bắt đầu ngay). Queue chỉ nối các suite khác nhau trên cùng máy lại với nhau, không làm suite chậm hơn. Nó làm máy bận lâu hơn khi nhiều lane cùng chạy test.

**Host debug trong test.** `ensureGitAddon` stage host và addon bản `dev` (debug): host 90,7 MB, addon 85,9 MB, so với bản release 8,2 MB và 11,4 MB. Host debug chậm hơn khoảng 3 lần mỗi lần gọi (`version` 2,7 ms so với 0,9 ms), nhưng chi phí tuyệt đối nhỏ. Chi phí lớn là việc băm addon 86 MB ở mỗi tiến trình CLI (mục 4).

## 4. Chi phí theo loại spawn

Tổng theo loại (cộng mọi file):

| Loại | Số lần | Tổng | Trung bình |
|---|---:|---:|---:|
| CLI `node bin/fgos.mjs <verb>` (không tính `init`) | 3 000 | 2 059 s | 686 ms |
| `node -e …` (tiến trình con giữ lock, đua nhau, phần lớn chạy đồng thời) | 413 | 980 s | 2 373 ms |
| `fgctl init` | 85 | 934 s | 10 987 ms |
| host `fgos internal supervise` (run supervisor thật) | 892 | 622 s | 698 ms |
| CLI `fgos init` | 446 | 205 s | 460 ms |
| `node build-rust-distribution.mjs` | 17 | 165 s | 9 708 ms |
| `git` (gọi thẳng từ test) | 17 017 | 154 s | 9 ms |
| `node run-rust-dev-host.mjs` | 48 | 137 s | 2 858 ms |
| `bwrap` | 1 292 | 26 s | 20 ms |

**Một lần gọi CLI hôm nay** (`fgos list` trong repo đã init, env giống suite, load 8):
- Thời gian: `node` trống 22 ms; `fgos --help` 150 ms; `fgos list` 232 ms; `fgos init` 247 ms. Một verb sai cũng tốn 127 ms.
- Tiến trình con (strace): 1 host `internal state-root`, 1 probe `bwrap … /bin/true` (dò namespace, `packages/process/rust/src/containment/linux.rs:51`, một lần mỗi tiến trình), 5–6 lệnh git, mỗi lệnh trong một `bwrap --unshare-pid`. Một git trần mất 0,7 ms, git trong bwrap mất 2,4 ms. Tổng phần spawn khoảng 20 ms.
- CPU profile của `fgos list` (khoảng 320 ms được lấy mẫu):
  - 57 ms trong facade git (`src/git/inspect.mjs`, gồm các lần gọi git qua addon);
  - 55 ms biên dịch module ESM (291 module, kể cả cho một verb sai);
  - **75 ms đọc rồi băm SHA-256 file addon** (`src/git/native.mjs:52`). Cache băm chỉ sống trong một tiến trình, mà mỗi lần gọi CLI là một tiến trình mới. Addon debug 86 MB; ở bản release 11,4 MB thì khoảng 10 ms mỗi lần gọi, người dùng thật cũng trả.

Với khoảng 3 450 lần gọi CLI trong suite, riêng việc băm addon tốn khoảng 260 s CPU.

**`fgctl init` 6–23 s mỗi lần.** Trong test, mỗi ca của các file `rust-host/fgctl-*` chạy `fgctl init` thật. Bước này gọi `fgos doctor`, và doctor trên workspace thật mất 40,7 s cho 145 row ([baseline T0 §4](research-261021-1210-harden-t0-baseline.md)). Ngoài ra mỗi file build lại release một lần (`build-rust-distribution.mjs`, khoảng 10 s). `help-routes` (119 s) gọi dev door 28 lần, mỗi lần stage lại host và payload (khoảng 4,2 s).

## 5. Lịch sử tăng

`git log --no-merges --since=2026-10-01 --diff-filter=AD -- test/**/*.test.mjs`:

| Tuần | File thêm | File xoá |
|---|---:|---:|
| 40 (09-29 → 10-05) | 30 | 89 |
| 41 | 31 | 1 |
| 42 | 132 | 10 |
| 43 (tới 10-21) | 73 | 0 |
| **Tổng** | **266** | **100** |

- 181 commit thêm file test, **4** trong số đó gỡ file test nào đó.
- 79 trong 100 file xoá thuộc một commit (`2180b4e72`, gỡ engine coordination). Không tính commit đó thì từ 10-01 thêm 266 file, xoá 21.
- Theo scope commit: runner +34, git +32, workflow +27, event-store +19, dispatch +18, run-supervisor +17/−8, holder-lock +14.
- 11 commit có chữ "dormant" thêm 23 file test cho code chưa bật (Git, Event Store), nên đường mới và đường cũ cùng có test cho tới khi cutover.

Ảnh chụp theo ngày (`git ls-tree` và `git grep` trên `main`):

| Ngày | File test | `test()` Node | Dòng test Node | Dòng Node `src`+`bin` | Dòng Rust | `#[test]` Rust |
|---|---:|---:|---:|---:|---:|---:|
| 10-01 | 420 | 7 520 | 189 001 | 106 480 | 36 066 | 450 |
| 10-08 | 377 | 6 626 | 149 972 | 87 778 | 38 812 | 506 |
| 10-15 | 434 | 7 382 | 165 901 | 95 979 | 44 065 | 565 |
| 10-18 | 505 | 7 570 | 168 279 | 99 864 | 101 127 | 1 193 |
| 10-21 | 581 | 8 094 | 179 809 | 103 932 | 133 616 | 1 451 |

Từ 10-08 tới 10-21: Node code +16 nghìn dòng, Node test +30 nghìn dòng, Rust +95 nghìn dòng, `#[test]` Rust nhân ba. Chuyển sang Rust đem theo test Rust mới, mà test Node của cùng hành vi vẫn ở lại.

**Lịch sử "cải thiện" test** (`git log` có chữ split, queue, timeout, concurrency):
- 08-11, 08-23, 08-24: tách `test/cli` và `checks.test.mjs` thành nhiều file.
- 08-27: bài học "tách file chạm sàn". Đòn bẩy thật là chi phí thật: 10 test gọi `claude` thật, mỗi lần 11 s.
- 09-16: "fast fixture" cho CLI (thử nghiệm, mở rộng opt-in).
- 09-23 và 10-17: queue suite toàn máy.
- 10-14: tách test `fgctl init` thành 5 file song song. Tổng CPU không đổi, và các file đó giờ là đường găng của suite.
- 10-04, 10-05, 10-18: nới trần thời gian, thay sleep bằng rendezvous ở vài chỗ.

Chưa có lần nào đo hay chặn **chi phí của một lần gọi CLI** hoặc **chi phí của test mới thêm**.

## 6. Kết luận theo giả thuyết

| # | Giả thuyết | Kết luận | Số liệu |
|---|---|---|---|
| H1 | Test ở tầng quá cao (spawn CLI/host, `fgos init` thật khi tầng thấp hơn chứng minh được) | **Xác nhận**, nguyên nhân lớn nhất | 136 file gọi CLI chiếm 49% thời gian file; 108 file có hơn một nửa wall là CLI. 31 trong 54 file gọi `fgos init` dựng lại fixture cho gần như mỗi test (số lần init ≥ 0,8 × số test). Ngược lại, 182 file trong tiến trình làm 29% số test với 7% thời gian |
| H2 | Lặp giữa Rust và Node | **Một phần**: lặp số lượng lớn nhưng rẻ về thời gian | Port đã đếm (plan TEST phase 2): event-store 70 test Node so với 150 Rust, run-supervisor 143 so với 136, terminal-control 19 so với 88, git 92 so với 221, holder-lock 110 so với 76. `#[test]` Rust nhân ba trong một tuần mà test Node không giảm. Nhưng test lặp kiểu này phần lớn chạy trong tiến trình, nên chủ yếu làm suite **nhiều** (khó đọc, khó bảo trì), không làm suite **chậm**. Nhãn mirrors-Rust do TEST gắn, còn đang làm |
| H3 | Quy trình tạo test chỉ thêm | **Xác nhận** | 181 commit thêm, 4 commit vừa thêm vừa gỡ; tuần 41–43 thêm 236 file, xoá 11; 23 file cho code dormant. Bản soát luật ([R6](review-261021-1008-rules-that-grow-the-system.md)) đã chỉ ra lý do: mẫu phase của `ak-plan` không có mục "Tests to retire", và brief lead nói "viết test mà phase liệt kê" |
| H4 | Cơ chế chạy (concurrency, queue, fixture dựng lại, chờ theo giờ, trần 600 s) | **Một phần** | Thứ tự file làm mất khoảng 30% wall (488 s so với khoảng 330 s ước tính). Cạnh tranh làm file chậm thêm khoảng 40%. Queue không làm một suite chậm thêm. Trần 600 s không bị chạm ở máy này. Chờ theo giờ: 142 chỗ trong 73 file, nhưng tổng `sleep` đo được chỉ 16 s; phần lớn các chỗ chờ nằm trong tiến trình con chạy song song. Fixture dựng lại thuộc H1 |
| H5 | Mang máy thật vào (herdr, bwrap, tiến trình thật) chỗ chỉ cần logic | **Một phần** | 64 file dùng herdr thật (13% wall), 77 file có bwrap (28,5% wall, nhưng bản thân `bwrap` chỉ 26 s; chi phí thật là các run supervisor thật, 622 s). Bwrap còn nằm ngay trong mỗi lần gọi CLI (5–6 git trong bwrap cộng probe), nên H5 gộp vào nguyên nhân 1 |

## 7. Nguyên nhân xếp hạng, có số

| # | Nguyên nhân | Thuộc | Ước lượng phần wall có thể lấy lại |
|---|---|---|---|
| 1 | Chi phí mỗi tiến trình CLI tăng: băm lại addon mỗi tiến trình (`src/git/native.mjs:52`), 291 module nạp cho mọi verb, git qua bwrap, probe bwrap mỗi tiến trình | sản phẩm: T2 (loader addon, Git qua containment), T0 (probe containment), T9 (graph module của CLI) | khoảng 30% thời gian các file gọi CLI (băm addon chiếm khoảng 75 trong khoảng 250 ms của một lần gọi) |
| 2 | Test chứng minh qua CLI hoặc qua môi trường thật trong khi tầng thấp hơn đủ: `fgctl init` thật cho mỗi ca, build release mỗi file, dev door mỗi ca | test (H1) | file `rust-host` 1 338 s và `cli` 1 634 s là nhóm chính |
| 3 | Thứ tự file không theo thời gian: file dài bắt đầu muộn | cơ chế chạy | khoảng 150 s wall (ước tính, cần kiểm) |
| 4 | Quy trình tạo test chỉ thêm, kể cả khi chuyển sang Rust | quy trình (H3, H2) | không đổi ra giây; là lý do số test tăng đều |
| 5 | `fgos doctor` 40,7 s, và `fgctl init` chạy doctor | sản phẩm (T9, mỗi tầng phần gate 8) | phần lớn trong 934 s `fgctl init` |

## 8. Đề xuất cho quy trình tạo test (giao TEST và luồng quản lý luật; HARDEN không xây cơ chế)

**Một đề xuất:** mỗi brief của lead và mỗi phase file phải có thêm một dòng **"chi phí test của thay đổi"**. Dòng này nêu ba số đo được trên chính nhánh đó:
1. số test và file test thêm, gỡ (đã có ở dòng `suite:`);
2. **số lần spawn CLI hoặc host mới** mà test của thay đổi đưa vào (probe ở mục 1 đếm được, rút ra từ `--import` của `run-tests`);
3. **thay đổi chi phí một lần gọi CLI** (`fgos --help` và `fgos list` trong repo đã init, đo trước và sau).

Lead phải nêu test chủ của mỗi hành vi mới. Test mới mà spawn CLI thì phải ghi vì sao tầng thấp hơn không chứng minh được (luật nguyên tắc 8 đã có, nay có số để kiểm). Lý do chọn đề xuất này: luật đã có, nhưng không có số để thấy vi phạm (bản soát luật §0.3). Cơ chế đo nên dùng lại `scripts/test-proof-inventory.mjs` và dòng `suite:`, không dựng công cụ mới.

**Các sửa thuộc tầng của HARDEN** (không làm ở phase 00, mỗi tầng tự đưa vào hội đồng):
- T0: probe `bwrap` một lần mỗi tiến trình (`containment/linux.rs:44-61`). Cân nhắc cache theo máy cùng với quyết định Q1.
- T2: băm addon ở mỗi tiến trình (`src/git/native.mjs:47-53`). Danh tính file đã có (dev, ino, size, mtime), nên chỉ cần băm khi danh tính đổi, với cache ngoài tiến trình hoặc tin digest trong manifest đã ký. Ngoài ra là chi phí git qua bwrap, gắn với lane OPC.
- T5/T9: graph module của CLI nạp 291 module cho mọi verb (kể cả verb sai). Giao phase 07 (T9 Host & Surface).
- Cơ chế chạy (của TEST): xếp file theo thời gian lần chạy trước, dài trước (dữ liệu đã có trong junit). Test chạy addon và host bản release thay vì debug, hoặc ít nhất không băm addon debug ở mỗi tiến trình.
- Từng tầng: các file trong danh sách mục 9 có `cli` và nằm trong top 40 là ứng viên dời xuống tầng thấp hơn.

## 9. Danh sách file test theo tầng (đầu vào bảng test của mỗi tầng)

Gán theo tầng **thấp nhất** mà file import (theo đường `src/` hoặc `packages/` của tầng đó), cộng thư mục test của component. Mỗi tầng kiểm lại trên baseline của chính nó.

| Tầng | File | `test()` | Wall trong suite | File có chờ theo giờ | File gọi CLI/host | herdr thật | bwrap |
|---|---:|---:|---:|---:|---:|---:|---:|
| T0 | 13 | 148 | 188 s | 7 chỗ | 6 | 2 | 3 |
| T1 | 74 | 988 | 1 336 s | 62 chỗ | 29 | 3 | 10 |
| T2 | 31 | 590 | 418 s | 7 chỗ | 8 | 7 | 3 |
| T3 | 14 | 57 | 187 s | 1 chỗ | 1 | 0 | 0 |
| T4 | 14 | 97 | 248 s | 8 chỗ | 5 | 3 | 5 |
| T5 | 118 | 2 186 | 474 s | 23 chỗ | 10 | 34 | 41 |
| trên T5 | 317 | 4 093 | 3 732 s | 34 chỗ | 90 | 15 | 15 |

`#[test]` Rust theo crate (cho cột Node↔Rust): process 105, host-runtime 90, canonical-json 1, durable-file 10, holder-lock 76, session-identity 13, convention 8, git 221, terminal-control 88, event-store 150, observe 61, agent-protocol 16, run-supervisor 136, run-result 28.

Danh sách đầy đủ từng file theo tầng, kèm wall và các dấu (`w` số chỗ chờ theo giờ, `cli`, `h` herdr, `b` bwrap), nằm ở `/tmp/fgos-work/harden-p00/layer-lists.md` và `layers.json`. Phụ lục cuối báo cáo chép lại bản đó.

## 10. Kiểm baseline 202 s ở `f38dfd1d0`

- `test/suite-baseline.json` ghi `wallSeconds: 202` từ commit `4c4ecded3` (10-20 18:22). Commit không ghi máy, tải, hay cách đo. `wallSeconds` chỉ tính thời gian spawn `node --test`, không tính queue và build.
- Lane TEST làm trên máy này, nên 202 s gần như chắc là đo ở máy này. Sau đó, cùng máy: khoảng 380 s trên main (báo cáo landing 10-21 06:06), 483 s cho nhánh Git 07 (cùng báo cáo), 488 s hôm nay. Máy owner 1 046–1 316 s là máy khác, nên không so trực tiếp với 202 s được.
- Kiểm lại bằng một lần chạy `f38dfd1d0` trên chính máy này: **chưa chạy**. Lane GIT đang cần máy yên cho phép đo E3. Em sẽ chạy ngay sau E3 và ghi kết quả vào đây.

## Câu hỏi còn mở

1. Lần chạy `f38dfd1d0` và lần chạy suite thứ hai ở mức tải khác còn chờ E3 xong. Hai số này có thể đổi ước lượng ở mục 3 và mục 10, nhưng không đổi thứ hạng nguyên nhân.
2. Đề xuất ở mục 8 cần luồng TEST và luồng quản lý luật nhận. HARDEN chỉ gửi.

## Phụ lục: file test theo tầng

(chép từ `/tmp/fgos-work/harden-p00/layer-lists.md`)

**T0** (13 files). Marks: `w` time-based waits (count), `cli` spawns the CLI or host, `h` real herdr, `b` bwrap.

`rust-host/help-routes.test.mjs` 119s (cli); `cli/unknown-flag-rejection.test.mjs` 40s (cli); `cli/fgos-lock-fence.test.mjs` 19s (w1); `runner/provider-capacity.test.mjs` 7s (w1,b); `setup/holder-lock-checks.test.mjs` 2s (w3,cli,b); `setup/run-supervisor-checks.test.mjs` 0s (w1,cli,h,b); `rust-host/internal-routes.test.mjs` 0s (cli); `run-supervisor/legacy-sweep.test.mjs` 0s (cli,h); `runner/run-lock-identity.test.mjs` 0s; `process/process-facts-vectors.test.mjs` 0s (w1); `util/unique-tmp-tag.test.mjs` 0s; `runner/process-identity.test.mjs` 0s; `setup/lock-record-checks.test.mjs` 0s.

**T1** (74 files). Marks: `w` time-based waits (count), `cli` spawns the CLI or host, `h` real herdr, `b` bwrap.

`run-supervisor/crash-matrix-adopt-resume.test.mjs` 158s (w2,cli,h,b); `runner/execution/run.test.mjs` 135s (w3,h,b); `workflow/workflow-runner.test.mjs` 123s (w3,cli,h,b); `run-supervisor/direct-crash-matrix.test.mjs` 96s (w5,b); `holder-lock/fences-rust-locks.test.mjs` 86s (w1,cli); `runner/worktree-admin-multiprocess.test.mjs` 67s; `workflow/units-runner.test.mjs` 65s (cli,b); `runner/worktree.test.mjs` 58s; `runner/merge.test.mjs` 52s (w3); `direct/merge-gate.test.mjs` 49s (w1); `runner/execution/run-sync.test.mjs` 45s (b); `cli/fgos-post-merge.test.mjs` 39s; `git/land.test.mjs` 30s; `runner/execution/commit-unit-work.test.mjs` 25s; `runner/land-vs-manual-commit.test.mjs` 24s (w4); `git/scoped-commit.test.mjs` 22s (b); `event-store/migrate-cutover-grant.test.mjs` 22s (cli); `git/worktree.test.mjs` 19s (w1); `rust-host/fgctl-stage.test.mjs` 18s (w1); `runner/claim-port.test.mjs` 17s (cli); `runner/claim-capacity-race.test.mjs` 16s (w3); `git/land-recovery.test.mjs` 14s; `runner/execution/git-core-adapters.test.mjs` 12s; `runner/custody-successor-admission.test.mjs` 9s (w1); `git/sync.test.mjs` 9s; `runner/worktree-ports.test.mjs` 8s; `runner/lock.test.mjs` 8s (w6); `git/commit-parent-death.test.mjs` 8s (w1); `state/state-cutover.test.mjs` 7s (w1); `git/safe-restore.test.mjs` 7s; `state/hot-lock-multiprocess.test.mjs` 6s (w5,cli); `e2e/main-checkout-borrow-hook.test.mjs` 6s (w3,cli); `git/legacy-event-adapter.test.mjs` 6s; `git/lock-handover.test.mjs` 6s; `runner/dispatch-confinement-backend-p03.test.mjs` 5s (w1,b); `event-store/facade.test.mjs` 5s (cli); `git/native-load.test.mjs` 5s (cli); `holder-lock/run-borrowed-git.test.mjs` 4s (cli); `scripts/full-suite-queue.test.mjs` 4s (w2,cli); `state/store.test.mjs` 4s (w2); `git/refs.test.mjs` 3s; `runner/assignment-cwd-mutex-concurrency.test.mjs` 3s (w1); `run-supervisor/direct-cutover.test.mjs` 3s (cli,b); `runner/custody-lease-commit.test.mjs` 3s (w1); `holder-lock/fences-stop-check.test.mjs` 3s (w2,cli); `util/session-identity.test.mjs` 3s (cli); `runner/repo-locks-multiprocess.test.mjs` 2s (w1); `git/inspect.test.mjs` 2s (cli); `holder-lock/fences-main-door.test.mjs` 2s; `state/identity-before-lock.test.mjs` 2s (w2,cli); `holder-lock/fences-v1-tombstone.test.mjs` 2s; `holder-lock/hold-transport-borrow.test.mjs` 2s; `e2e/main-checkout-activity-beacon.test.mjs` 1s; `runner/execution/run-resume-order.test.mjs` 1s; `holder-lock/fences-v1-ledger.test.mjs` 1s (b); `holder-lock/facade-multiprocess.test.mjs` 1s (cli); `holder-lock/state-root.test.mjs` 1s (cli); `convention/convention-client.test.mjs` 1s (cli); `verbs/dispatch-recovery.test.mjs` 1s (w1); `runner/dispatch-reconciliation.test.mjs` 0s; `holder-lock/driver-unavailable.test.mjs` 0s (cli); `state/hot-lock-host-judge.test.mjs` 0s (cli); `state/hot-lock-guard.test.mjs` 0s; `holder-lock/windows-facade.test.mjs` 0s (cli); `holder-lock/registry-contract.test.mjs` 0s; `run-supervisor/windows-custody.test.mjs` 0s (cli); `session-identity/attempt-writer-id.test.mjs` 0s (cli); `holder-lock/lock-scope-order.test.mjs` 0s (cli); `holder-lock/windows-doctor.test.mjs` 0s (cli); `state/hot-lock-tx.test.mjs` 0s (w1); `holder-lock/hot-lock-contract.test.mjs` 0s; `holder-lock/windows-borrow.test.mjs` 0s (w1,cli); `holder-lock/main-checkout-borrow-contract.test.mjs` 0s; `holder-lock/windows-hot-lock.test.mjs` 0s (w3,cli).

**T2** (31 files). Marks: `w` time-based waits (count), `cli` spawns the CLI or host, `h` real herdr, `b` bwrap.

`runner/loop.test.mjs` 246s (w3,b); `git/e2e-consumer-noncoding.test.mjs` 19s (b); `setup/checks.test.mjs` 19s (h,b); `setup/checks-doctor-config.test.mjs` 16s (h); `distribution/native-addon.test.mjs` 16s (cli); `run-supervisor/terminal-groups.test.mjs` 15s (cli,h); `git/one-door.test.mjs` 15s; `runner/merge-land.test.mjs` 14s; `event-store/topologies.test.mjs` 11s; `git/cutover-grant.test.mjs` 7s (cli); `runner/promote-engine.test.mjs` 6s; `runner/merge-target-slot-multiprocess.test.mjs` 5s; `terminal-control/client-route.test.mjs` 4s (cli,h); `git/recovery.test.mjs` 4s; `runner/worktree-callsite-wrapper.test.mjs` 4s; `runner/merge-quoted-paths.test.mjs` 3s; `intake/plan.test.mjs` 2s (cli); `git/worktree-recovery.test.mjs` 2s; `intake/discovery.test.mjs` 2s (cli); `git/remote.test.mjs` 2s; `git/native-lock-repair.test.mjs` 2s; `terminal-control/group-queue.test.mjs` 1s (w1,cli,h); `git/repository-config.test.mjs` 1s; `state/runtime-coordination.test.mjs` 1s (w3); `util/git-paths.test.mjs` 1s; `state/working-tree-clean-unified.test.mjs` 1s; `git/github-adapter-contract.test.mjs` 1s; `setup/terminal-control-checks.test.mjs` 0s (cli,h); `git/write-scope-parity.test.mjs` 0s; `git/e3-census.test.mjs` 0s; `terminal-control/contracts.test.mjs` 0s (h).

**T3** (14 files). Marks: `w` time-based waits (count), `cli` spawns the CLI or host, `h` real herdr, `b` bwrap.

`event-store/migrate.test.mjs` 95s; `event-store/store-hardening.test.mjs` 30s (w1); `event-store/export-legacy-parity.test.mjs` 18s; `event-store/door.test.mjs` 17s (cli); `event-store/verbs.test.mjs` 15s; `event-store/rollback-export.test.mjs` 8s; `event-store/no-spawn-in-gate.test.mjs` 3s; `event-store/door-fixtures.test.mjs` 3s; `event-store/consumers.test.mjs` 0s; `event-store/platform-refusal.test.mjs` 0s; `event-store/v-spawn-bench.test.mjs` 0s; `event-store/legacy-order-parity.test.mjs` 0s; `observe/observe-contracts-fixtures.test.mjs` 0s; `event-store/canonical-vectors.test.mjs` 0s.

**T4** (14 files). Marks: `w` time-based waits (count), `cli` spawns the CLI or host, `h` real herdr, `b` bwrap.

`run-supervisor/terminal-cutover.test.mjs` 122s (h,b); `run-supervisor/resume-adopts.test.mjs` 58s (w1,b); `run-supervisor/terminal-crash-matrix.test.mjs` 29s (w1,h); `run-supervisor/terminal-fallback.test.mjs` 28s (h,b); `run-supervisor/cancel-registry.test.mjs` 8s (w3,cli,b); `run-supervisor/sweep.test.mjs` 1s (w2,cli); `run-supervisor/inspect-recover-adopt.test.mjs` 1s (w1,cli); `run-supervisor/attempt-steps.test.mjs` 1s (cli); `run-supervisor/adopt-client.test.mjs` 0s (cli); `run-supervisor/bwrap-driver.test.mjs` 0s (b); `run-supervisor/contracts-unit-state.test.mjs` 0s; `run-supervisor/contracts.test.mjs` 0s; `run-supervisor/contracts-terminal.test.mjs` 0s; `run-supervisor/runtime-dir.test.mjs` 0s.

**T5** (118 files). Marks: `w` time-based waits (count), `cli` spawns the CLI or host, `h` real herdr, `b` bwrap.

`runner/execution/run-provider-failover.test.mjs` 112s (b); `runner/spawn-worker.test.mjs` 63s (w1,b); `runner/operation-choice.test.mjs` 42s (b); `workflow/playbook-proposer.test.mjs` 42s (w3); `runner/assignment-dispatch.test.mjs` 30s (w5,h,b); `runner/driver-rununit.test.mjs` 26s (b); `runner/assignment-runresult.test.mjs` 22s (w1); `runner/execution/run-case-admission.test.mjs` 20s (b); `architecture.test.mjs` 12s (h); `runner/dispatch.test.mjs` 10s (w1,cli,h,b); `workflow/stale-approval-reapproval.test.mjs` 9s; `workflow/conductor-case.test.mjs` 9s; `runner/dispatch-stray-write-attribution.test.mjs` 9s (w3,h); `runner/execution/run-posture.test.mjs` 8s (b); `runner/dispatch-operability-production-door.test.mjs` 6s (cli); `workflow/case-verbs.test.mjs` 6s; `runner/dispatch-execute-effort.test.mjs` 6s (cli,h,b); `runner/dispatch/worker-env-case-context.test.mjs` 3s; `workflow/confined-nested-write.test.mjs` 3s (b); `runner/provider-credential-renewal.test.mjs` 3s (b); `runner/dispatch-production-call-sites.test.mjs` 3s (cli,h); `runner/dispatch-governance-operability.test.mjs` 2s (cli,b); `runner/operation-prompt-templates.test.mjs` 2s; `runner/dispatch-confinement-blind.test.mjs` 2s (h,b); `runner/dispatch-worker-home.test.mjs` 2s (w1,h); `workflow/case-admission-port.test.mjs` 2s; `runner/execution/partial-writes.test.mjs` 1s; `runner/effective-execution-contract.test.mjs` 1s (h); `workflow/case-bindings.test.mjs` 1s; `runner/dispatch-i08b-remediation.test.mjs` 1s (cli,h); `runner/dispatch-worker-session-boot.test.mjs` 1s (h); `setup/registrations.test.mjs` 1s (cli,b); `runner/dispatch-execute-for-capability.test.mjs` 1s (w1); `runner/dispatch-governance-provider-denylist.test.mjs` 1s; `runner/provider-adapter.test.mjs` 1s (h,b); `setup/confinement-doctor-checks.test.mjs` 1s (b); `runner/dispatch-policy-baseline-snapshot.test.mjs` 1s (h,b); `setup/observe-doctor-checks.test.mjs` 1s (cli,b); `workflow/case-runtime.test.mjs` 1s; `runner/dispatch-confinement-authority.test.mjs` 0s (h,b); `runner/work-unit-for.test.mjs` 0s; `runner/dead-vocabulary-guard.test.mjs` 0s (h); `runner/herdr-private-home-trust.test.mjs` 0s (h); `runner/provider-auth-failure.test.mjs` 0s; `runner/cli-spawn-reconciliation.test.mjs` 0s; `setup/credential-copies-retained-check.test.mjs` 0s; `runner/dispatch-trust-store.test.mjs` 0s; `runner/credential-store.test.mjs` 0s (b); `runner/dispatch-reconciliation-import-graph.test.mjs` 0s (h); `runner/run-result-confinement-label.test.mjs` 0s (b); `runner/dispatch-confinement-p04.test.mjs` 0s (h,b); `setup/workflow-pool-independence-check.test.mjs` 0s; `runner/provider-pool-lease.test.mjs` 0s (b); `runner/provider-per-cli-credential-sources.test.mjs` 0s (b); `runner/provider-quarantine-probe.test.mjs` 0s (w1); `runner/assignment-policy.test.mjs` 0s; `runner/dispatch-visibility-session.test.mjs` 0s (h); `runner/execution/explain.test.mjs` 0s (b); `cli/subcommand-flag-drift.test.mjs` 0s (cli); `runner/execution/bind.test.mjs` 0s (h,b); `runner/assignment-layout.test.mjs` 0s; `runner/dispatch-confinement-credential-hygiene.test.mjs` 0s (b); `runner/dispatch-confinement-p05.test.mjs` 0s (h,b); `runner/assignment-provenance.test.mjs` 0s; `runner/codex-cli-glm-cli-live-executors.test.mjs` 0s; `runner/dispatch-reconciliation-concurrency.test.mjs` 0s (w1); `runner/assignment.test.mjs` 0s; `runner/execution/bind-committed-config.test.mjs` 0s (h,b); `runner/execution/unit-summary.test.mjs` 0s; `verbs/dispatch-observe.test.mjs` 0s (h); `runner/execution/handoff-refs.test.mjs` 0s; `state/work-size-rigor.test.mjs` 0s; `runner/execution/account-rotation.test.mjs` 0s (b); `runner/dispatch-brief.test.mjs` 0s; `runner/dispatch-executor-profile.test.mjs` 0s (h,b); `runner/dispatch-runtime-inspect.test.mjs` 0s; `runner/execution/unit.test.mjs` 0s (h); `runner/dispatch-confinement-reaper-fence.test.mjs` 0s (h); `workflow/units-source.test.mjs` 0s; `runner/dispatch-confinement-policies.test.mjs` 0s (b); `runner/execution/account-pin.test.mjs` 0s (b); `runner/execution/run-herdr.test.mjs` 0s (h); `runner/enrich-and-validate-contract.test.mjs` 0s; `runner/execution-contract.test.mjs` 0s; `runner/dispatch-effect-guarantee.test.mjs` 0s (b); `runner/dispatch-reconcile-operation.test.mjs` 0s (cli); `runner/dispatch-config-patterns.test.mjs` 0s; `runner/egress-governance.test.mjs` 0s; `runner/provider-credential-probe.test.mjs` 0s (w1); `runner/tier-cell.test.mjs` 0s (b); `runner/dispatch-recovery.test.mjs` 0s; `runner/execution/tier-fallback.test.mjs` 0s (b); `runner/execution/patterns/reviewed.test.mjs` 0s (w1); `runner/herdr-spawn-adapter.test.mjs` 0s (h); `runner/dispatch-run-timeout.test.mjs` 0s; `runner/tier-fallback-config.test.mjs` 0s; `runner/default-executor-merge.test.mjs` 0s (h,b); `runner/execution/patterns/debate.test.mjs` 0s (w2); `runner/assignment-normalizer.test.mjs` 0s; `runner/herdr-claude-invocations.test.mjs` 0s (h,b); `runner/execution/patterns/panel.test.mjs` 0s (w1); `runner/provider-account-probe.test.mjs` 0s (h,b); `runner/evidence-attribution.test.mjs` 0s; `runner/write-scope.test.mjs` 0s; `runner/llm-accounts.test.mjs` 0s; `runner/dispatch-r9-performance-cache.test.mjs` 0s (b); `runner/execution/patterns/index.test.mjs` 0s; `runner/herdr-agent.test.mjs` 0s (h); `runner/usage-parsers.test.mjs` 0s (h,b); `runner/execution/patterns/role-tasks.test.mjs` 0s; `runner/run-result-v2.test.mjs` 0s; `runner/execution/patterns/presets.test.mjs` 0s; `runner/run-outcome.test.mjs` 0s; `runner/execution/unit-run-outcome.test.mjs` 0s; `runner/dispatch-worker-session.test.mjs` 0s (h); `runner/execution/patterns/solo.test.mjs` 0s; `runner/agent-result-claim-contract.test.mjs` 0s; `runner/run-result-v3-reader.test.mjs` 0s.
