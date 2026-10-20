# Báo cáo S0: chi phí hook và chi phí cập nhật record của mailbox

Ngày đo: 2026-10-20, khoảng 16:13 đến 16:18 (giờ máy). Máy: Linux 7.0, 24 lõi, ext4 trên NVMe (`/dev/nvme0n1p2`), Node 24.22.0. Phạm vi: `docs/platform/agent-mailbox/spec.md` mục 4.1, 6.4, 14 (bản đọc lúc đo, sau khi spec đã đổi: không còn shell guard, record là một snapshot dưới mutex).

## 0. Bảng tóm tắt

| Mã | Đo cái gì | p50 | p95 | max | Kết luận một dòng |
|---|---|---|---|---|---|
| H1a | `fgos version` qua `fgos` cài sẵn (launcher sh, shim sh, host Rust) | 9,7 ms | 11,3 ms | 11,5 ms | Route Rust host; 7,6 ms là sàn; phần lớn là shim shell |
| H1a' | cùng verb, gọi thẳng entry của release (không shim) | 2,2 ms | 6,5 ms | 6,8 ms | Chi phí thật của host Rust: khoảng 2 ms |
| H1b | `fgos hook dispatch-decide` qua shim dự án | 222,6 ms | 290,8 ms | 303,0 ms | Legacy-node, 2 lần khởi động Node, không phải Rust host |
| H1b | `fgos hook decision-question` qua shim dự án | 171,0 ms | 227,3 ms | 238,7 ms | Legacy-node, 2 lần khởi động Node |
| H1c | như H1b dưới 4 vòng lặp bận | 273,4 / 176,4 ms | 336,0 / 243,7 ms | 346,8 / 251,7 ms | Khác biệt nằm trong nhiễu của máy; chưa chứng minh gì về máy bão hòa |
| H2 | `sh -c '[ -e PATH ] \|\| exit 0'` (thiếu / có) | 0,51 / 0,51 ms | 0,56 / 0,55 ms | 0,61 / 0,63 ms | Khoảng 0,5 ms gồm cả spawn từ Python; sàn `/bin/true` là 0,41 ms |
| H3 | 1 chu kỳ đọc-sửa-ghi snapshot, N=0 / 10 / 50 | 10,29 / 10,27 / 10,31 ms | 11,02 / 10,85 / 10,84 ms | 31,8 / 30,2 / 29,4 ms | Chi phí là fsync (khoảng 10,2 ms), không phụ thuộc N |
| H3 | 100 địa chỉ x 50 trong một file (808.801 byte) | 13,43 ms | 28,31 ms | 39,52 ms | Thêm 2,2 ms đọc+parse và 0,6 ms dựng+serialize |
| H3 | hai tiến trình tranh một lock | xem 3.4 | xem 3.4 | 1,26 s (tải bão hòa) | Lock không công bằng: bên thăm dò có thể bị bỏ đói |
| H4 | So với ngân sách của repo | | | | Không có ngân sách hook p95 nào được ghi; trần là 8000 ms; xem mục 4 |

Điểm quyết định: (1) `fgos hook ...` hiện là legacy-node và tốn 170 đến 330 ms mỗi lần gọi, gấp 17 đến 100 lần chi phí của một verb native; (2) verb native qua host Rust tốn khoảng 10 ms qua shim, 2 ms nếu bỏ shim; (3) mỗi lần ghi snapshot tốn khoảng 10 ms vì fsync, một lượt drain có thư (claim rồi finish, hai lần giữ mutex) vào khoảng 21 ms cộng chi phí gọi.

## 1. H1: một lần gọi hook tốn bao nhiêu

### Phương pháp

- Công cụ đo: Python 3 `time.perf_counter_ns()` (nguồn `clock_gettime(CLOCK_MONOTONIC)`, độ phân giải 1 ns). Mỗi lần đo là một `subprocess.run` từ fork đến khi tiến trình con thoát, có stdin. Con số bao gồm spawn của Python (khoảng 0,3 ms, xem sàn `/bin/true` ở mục 2).
- 3 lần khởi động rồi 50 lần đo. Thư mục chạy: `/home/vantt/projects/forgent`. Percentile theo thứ hạng gần nhất (p95 của 50 mẫu là mẫu thứ 48, nên gần bằng max).
- Lệnh `fgos` plain: `/home/vantt/.local/bin/fgos` (launcher sh tìm `.fgos/installation/bin/fgos` của dự án). Lệnh hook thật: theo `shimCommand` trong `src/setup/agent-hooks.mjs`, tức `<repo>/.fgos/installation/bin/fgos hook <kind>`. Settings của Claude Code trong repo dùng dạng `"${CLAUDE_PROJECT_DIR}/.fgos/installation/bin/fgos" hook dispatch-decide`, cùng shim.
- JSON vào hook: `{"tool_name":"Bash","cwd":"/home/vantt/projects/forgent","tool_input":{"command":"true"}}`. Đọc `scripts/dispatch-decide-hook.mjs` và `scripts/decision-question-hook.mjs`: với tool khác `Agent`/`Task` (hoặc khác `AskUserQuestion`) hook thoát ngay, không gọi `decide`, không gửi gì đi.
- Xác định route: `strace -f -e trace=execve` trên một lần gọi (file `ex-hook.txt`, `ex-ver.txt` trong thư mục scratch) và đọc `bin/fgos.mjs` `handleHook` (dòng 4909 trở đi).

### Kết quả sạch (lần chạy R2; tải trung bình máy khoảng 15 đến 17)

| Tuyến | min | p50 | p95 | max |
|---|---:|---:|---:|---:|
| `fgos version` (plain) | 7,56 | 9,67 | 11,32 | 11,53 |
| `hook dispatch-decide` | 204,56 | 222,61 | 290,84 | 303,02 |
| `hook decision-question` | 159,07 | 171,03 | 227,27 | 238,71 |

### Các lần chạy khác (cùng 50 mẫu, đơn vị ms)

| Lần | Tuyến | min | p50 | p95 | max |
|---|---|---:|---:|---:|---:|
| R1 (tải máy 22) | `fgos version` plain | 8,99 | 15,70 | 23,78 | 27,35 |
| R1 | shim dự án `version` | 6,03 | 12,39 | 21,15 | 27,83 |
| R1 | entry release gọi thẳng `version` | 1,71 | 2,22 | 6,54 | 6,78 |
| R1 | `hook dispatch-decide` | 200,83 | 218,01 | 302,32 | 317,36 |
| R1 | `hook decision-question` | 154,57 | 333,94 | 379,24 | 466,40 |
| R1 | `hook dispatch-decide --format=agy` (đầu vào `toolCall` Bash) | 277,65 | 329,03 | 365,56 | 378,32 |
| R1 | `hook decision-question --format=agy` | 242,49 | 289,18 | 331,69 | 390,58 |
| Có 4 vòng lặp bận (tải máy khoảng 22) | `fgos version` plain | 7,88 | 9,76 | 12,00 | 13,55 |
| Có 4 vòng lặp bận | `hook dispatch-decide` | 223,09 | 273,41 | 336,02 | 346,77 |
| Có 4 vòng lặp bận | `hook decision-question` | 161,62 | 176,38 | 243,66 | 251,67 |

Ghi chú về nhiễu: tải trung bình của máy là 22 lúc bắt đầu, vì các phiên khác của chủ máy (tiến trình `MainThread`, không phải của tôi) đang chạy. Giá trị R1 `decision-question` p50 334 ms so với 171 ms ở R2 cho thấy phân bố hai đỉnh do nhiễu bên ngoài. Dùng R2 làm số tham chiếu, và coi khoảng R1 đến R2 là độ bất định thật.

### Route nào

- `fgos version`: Rust host chạy trực tiếp, không Node (strace: launcher sh, shim sh, rồi release `bin/fgos` Rust, không có `node`). Chi phí thật của host là 2,2 ms; shim shell thêm khoảng 7 ms (nó chạy khoảng 10 tiến trình con `dirname`, `sed`, `head`, `tr` để đọc `activation.json`, strace xác nhận).
- `fgos hook ...`: legacy-node payload. Host Rust exec `node bin/fgos.mjs`, `handleHook` đọc stdin rồi, với dạng không phải agy, `spawnSync(process.execPath, [scripts/<kind>-hook.mjs])`. Tức hai lần khởi động Node trong một lần hook, cộng shim shell và host Rust. Đúng với mục "Legacy-Node CLI Ownership Boundary" của AGENTS.md. Dạng `--format=agy` chỉ một Node nhưng chạy `decideExecutorCli` thật (nên chậm hơn, 290 đến 330 ms): đó không phải sàn.
- Câu hỏi 9 của spec (`fgos hook` nằm ở Rust host hay `src/`): trả lời được: nằm ở legacy-node (`bin/fgos.mjs` `handleHook`, `ALLOWED_HOOK_KINDS` chỉ có `dispatch-decide` và `decision-question`). Một verb mới `fgos mailbox drain` chỉ rẻ nếu nó được đăng ký là verb native của host Rust (như `version`); nếu đi qua `bin/fgos.mjs` thì trả giá của dòng `hook` ở trên.

### Dưới tải nhẹ

Bốn vòng `sh -c 'while :; do :; done'` (pid 3258119 đến 3258122, đã kill, đã xác nhận không còn) chạy trong lúc đo một lần. Trên máy 24 lõi, bốn vòng không tạo tranh chấp CPU nhìn thấy được: verb native không đổi (p50 9,76 ms), hook `dispatch-decide` p50 273 ms so với 218 đến 223 ms của R1/R2 (chênh +23 phần trăm, nhưng nằm trong khoảng nhiễu giữa các lần chạy), `decision-question` không đổi.

### Không đo

- Không đo trong môi trường hook thật của từng CLI (Claude Code, Codex, agy): spec S0 yêu cầu điều này; tôi chỉ gọi từ Python. Lý do: không có model call, không dựng phiên CLI thật.
- Không đo `fgos mailbox drain` vì verb chưa tồn tại. Số `version` chỉ là chặn dưới cho một verb native; một verb thật còn đọc state root, mở lock, đọc snapshot (xem H3).
- Không đo máy bão hòa (tải lớn hơn số lõi), không đo lần chạy lạnh (cache đĩa trống, Node chưa nóng), không đo CPU khác.
- Không đo Windows (shim `.cmd`).

## 2. H2: chi phí một shell guard

Phương pháp: cùng bộ đo `subprocess.run(["sh","-c","[ -e PATH ] || exit 0"])`, đường dẫn thiếu (`g/absent`) và có (`g/present`) trong thư mục scratch, 100 lần sau 3 lần khởi động. Có thêm sàn `/bin/true` để biết chi phí spawn của chính bộ đo.

| Trường hợp | min | p50 | p95 | max |
|---|---:|---:|---:|---:|
| path thiếu | 0,42 | 0,51 | 0,56 | 0,61 |
| path có | 0,42 | 0,51 | 0,55 | 0,63 |
| sàn `/bin/true` | 0,29 | 0,41 | 0,47 | 0,49 |

Khoảng 0,5 ms mỗi lần, trong đó 0,41 ms là spawn của bộ đo; chi phí riêng của `sh` và `[ -e ]` khoảng 0,1 ms. Không có khác biệt giữa thiếu và có. So với hook hiện tại (171 đến 223 ms) guard rẻ hơn khoảng 350 đến 440 lần; so với verb native qua shim (9,7 ms) rẻ hơn khoảng 19 lần.

Không đo: guard cần biết đường dẫn marker mà không gọi `fgos`; state root được phân giải trong Rust (`packages/holder-lock/rust/src/state_root.rs`), nên một guard shell phải tự dựng đường dẫn hoặc nhận nó từ installer. Spec hiện tại đã bỏ guard, nên số này chỉ để quyết định có đưa lại không. Không đo `test -e` trên thư mục nhiều file.

## 3. H3: chi phí cập nhật snapshot record

### 3.1 Dùng được crate không

Được. Scratch crate `mbbench` (ngoài repo, trong `.fgos/runtime/tmp/mailbox-probe4/mbbench`) dùng path dependency tới `packages/durable-file/rust` và `packages/holder-lock/rust`, có `[workspace]` rỗng để cô lập khỏi workspace của repo; build với `CARGO_TARGET_DIR=.../mailbox-probe4/cb`, profile release. Không cần xấp xỉ.

API dùng (đọc từ mã): `fgos_holder_lock::acquire(&Resource, Mode::Ex, Wait::Ms(20000), 2000)` rồi `release(handle)`; `fgos_durable_file::replace_durably(dir, name, bytes)`.

### 3.2 Có fsync không

Có. `replace_durably` (`packages/durable-file/rust/src/lib.rs`, `write_durably`): tạo file tạm trong cùng thư mục, `write_all`, trên Linux gọi `sync_file_range` rồi `file.sync_all()` (fsync file), `rename` đè tên đích, rồi `sync_directories` (fsync thư mục cha). Tức hai fsync mỗi lần ghi. Doc của crate nói rõ đây là xác nhận của OS, không bảo đảm mất điện. Thư mục scratch nằm trên ext4 thật, không phải tmpfs, nên fsync có giá thật.

### 3.3 Mô hình chu kỳ

Mỗi chu kỳ: `acquire` Ex, đọc file snapshot, parse JSON (`serde_json::Value`), bỏ header cũ nhất của một địa chỉ và thêm một header mới (giữ N cố định), serialize, `replace_durably`, `release`. Header giả lập khoảng 160 byte (id, from, to_generation, wake, kind, created_at, bytes); đây là ước lượng của tôi, header thật của spec có thể lớn hơn. 200 chu kỳ mỗi kịch bản, một tiến trình, tải máy khoảng 8.

| Kịch bản | byte ghi | tổng p50 | tổng p95 | tổng max | lock p50 | đọc+parse p50 | dựng+ser p50 | publish p50 / p95 / max | release p50 / p95 / max |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| N=0 | 169 | 10,29 | 11,02 | 31,80 | 0,018 | 0,011 | 0,004 | 10,17 / 10,58 / 18,26 | 0,082 / 0,253 / 13,49 |
| N=10 | 1.622 | 10,27 | 10,85 | 30,19 | 0,015 | 0,018 | 0,005 | 10,17 / 10,53 / 13,77 | 0,070 / 0,129 / 19,90 |
| N=50 (trần hàng đợi) | 8.082 | 10,31 | 10,84 | 29,43 | 0,012 | 0,038 | 0,009 | 10,16 / 10,47 / 15,01 | 0,064 / 0,121 / 19,26 |
| 100 địa chỉ x 50, một file | 808.801 | 13,43 | 28,31 | 39,52 | 0,019 | 2,159 | 0,556 | 10,55 / 10,81 / 12,36 | 0,074 / 14,08 / 23,97 |

Đơn vị ms. Nhận xét:

- Chi phí chu kỳ là fsync: `publish` khoảng 10,2 ms, gần như phẳng theo N đến 8 KB. Phần đọc, parse, serialize, lock dưới 0,1 ms cho một địa chỉ.
- Với snapshot một namespace 100 địa chỉ x 50 (khoảng 0,8 MB), thêm 2,2 ms đọc+parse và 0,6 ms dựng+serialize; p50 13,4 ms. Dù vậy trần kích thước snapshot đặc tả chưa nêu (spec S0 nhắc "snapshot at its configured size ceiling" nhưng tôi không thấy giá trị cấu hình), nên 0,8 MB là kịch bản đề bài, không phải trần của spec.
- `release` thỉnh thoảng lên 12 đến 24 ms (p95 14 ms ở kịch bản 100 địa chỉ, khoảng 5 phần trăm mẫu); `settle_release` trên Linux quét holder còn sót. Chưa xác định nguyên nhân chính xác; đây là đuôi cần theo dõi. Đuôi max 29 đến 40 ms của tổng chủ yếu đến từ đây và từ fsync.
- Một lần drain có thư theo spec 6.4 là "claim và finish giữ mutex hai lần" nên khoảng 2 lần ghi, tức khoảng 21 ms; đây là suy ra từ số đo một chu kỳ, chưa đo trực tiếp.

### 3.4 Hai tiến trình tranh một lock

Chế độ: tiến trình nền `hold` lặp chu kỳ N=50 trong 10 đến 14 giây trên cùng lock, tiến trình đo `contend` chạy 200 chu kỳ. Cơ chế của lock (`packages/holder-lock/rust/src/port.rs`, `lock_until`): thăm dò không chặn, ngủ 1, 2, 4, 8 rồi 10 ms giữa các lần, không có hàng đợi, không công bằng.

| Tình huống | Bên đo: lock p50 / p95 / max | Bên nền: lock max | Nhận xét |
|---|---|---|---|
| Hai vòng lặp liên tục, không nghỉ | 0,013 / 0,028 / 136 ms | 1.867 ms | Bên đo chiếm lock suốt 200 chu kỳ liên tiếp (khoảng 2,1 s) và bỏ đói bên nền gần 1,9 s |
| Nghỉ ngẫu nhiên tối đa 20 ms (lock gần bão hòa) | 0,016 đến 0,026 / 0,05 đến 0,08 / 15,4 ms | 479 ms; hai lần chạy lặp thêm cho thấy các lần chờ 55 đến 1.262 ms | Bên thăm dò có thể chờ hàng trăm ms đến hơn 1 s |
| Nghỉ ngẫu nhiên tối đa 100 ms (tải khoảng 30 phần trăm) | 0,032 / 0,080 / 15,6 ms | 479 ms | Lần chờ dài vẫn xuất hiện ở bên nền |

Kết luận: khi lock rảnh, `acquire` mất dưới 0,05 ms. Khi có tranh chấp, thời gian chờ không bị chặn trên: kết quả điển hình là phần còn lại của thời gian giữ lock (đến khoảng 10,5 ms, vì bên giữ đang fsync) cộng lượng tử thăm dò 1 đến 10 ms, nhưng bên đang thăm dò có thể bị bỏ đói hàng trăm ms đến 1,26 s khi hai bên ghi dồn dập (mỗi bên giữ lock khoảng 10 ms của mỗi chu kỳ 10 đến 30 ms). Tải thật của mailbox (vài ghi mỗi giây) thấp hơn nhiều so với kịch bản này; nhưng `Wait::Ms` của hook cần trần phù hợp và breaker của spec là cần thiết, không phải trang trí.

### Không đo

- Không đo nhiều hơn hai tiến trình, không đo 20 phiên, không đo trên tmpfs hay ổ chậm (fsync phụ thuộc thiết bị; các ngân sách của repo cũng nói "remeasure on ext4").
- Không đo sự kiện mất điện hay đứt tiến trình giữa chừng (S1 phải chứng minh lock tự nhả khi holder chết).
- Không đo `register`, `generation bump`, `sweep`, ghi body bất biến (file riêng, mỗi file thêm một chuỗi fsync), hay việc đăng ký một dòng mới vào `lock-registry.v1.json`. Chi phí body thư nằm ngoài snapshot và chưa tính.
- Kích thước header chỉ là ước lượng (khoảng 160 byte).
- Không đo `fgos-holder-lock` qua `lock_root`/state root thật; dùng file lock trong thư mục scratch.

## 4. H4: ngân sách

Ngân sách repo đã nêu:

| Nguồn | Ngân sách | Tính chất |
|---|---|---|
| `docs/platform/agent-mailbox/spec.md`, mục 4.1, mục hook mục 8 và bảng cấu hình: `mailbox.hook.budgetMs` | 8000 ms (đọc stdin tối đa 3 s, confirm 3 s trong mẫu tham chiếu) | Trần lỗi, không phải mục tiêu; spec nói "the target is the hook p95 of section 9 as measured in S0", tức mục tiêu p95 chưa được đặt |
| `docs/platform/event-store/spec.md` mục 17 (M1), phần (a) | p95 tối đa 50 ms cho phần của store trong Work gate, 20 phiên đồng thời, trên ext4, 0 spawn trong gate | Đề xuất mặc định, "not measurements"; chỉ áp cho gate của Work, không phải hook |
| Cùng mục 17, phần (b) | Không tệ hơn đường cơ sở V-SPAWN-01 (move 125 ms p95 ở 1 phiên) | Đó là end to end CLI, ghi nhận "Node startup and host resolution" |
| `src/setup/agent-hooks.mjs` (agy): `timeout: 10` giây; extension pi/omp: `spawnSync` timeout 5000 ms; probe doctor `isShimRunnable`: 3000 ms | 10 s, 5 s, 3 s | Giới hạn kỹ thuật của từng CLI/probe do installer ghi; Claude Code trong `.claude/settings.json` không đặt timeout riêng |
| `docs/platform/git/spec.md` G-226 | "có trần thời gian, timeout thì fail-closed" cho guard của git hook | Không có con số |

So sánh số đo:

| Số đo | So với 8000 ms | So với 50 ms (Event Store gate) | So với 125 ms (move end to end) |
|---|---|---|---|
| Hook hiện tại `fgos hook dispatch-decide` p95 291 ms (R1: 302; có tải: 336) | 3,6 đến 4,2 phần trăm của trần | gấp 6 đến 7 lần | gấp 2,3 đến 2,7 lần |
| Hook hiện tại `decision-question` p95 227 ms | 2,8 phần trăm | gấp 4,5 lần | gấp 1,8 lần |
| Verb native qua shim p95 11,3 ms | 0,14 phần trăm | 0,23 lần (đạt) | 0,09 lần |
| Verb native gọi thẳng host p95 6,5 ms | 0,08 phần trăm | 0,13 lần | 0,05 lần |
| Shell guard p95 0,56 ms | 0,007 phần trăm | 0,011 lần | 0,004 lần |
| Một chu kỳ ghi snapshot p95 10,8 đến 11,0 ms (một địa chỉ); 28,3 ms (100 địa chỉ) | 0,14 và 0,35 phần trăm | 0,22 và 0,57 lần (đạt) | 0,09 và 0,23 lần |
| Một drain có thư ước lượng 2 chu kỳ cộng gọi native: khoảng 22 ms + 10 ms = khoảng 32 ms p50 | 0,4 phần trăm | khoảng 0,6 lần | khoảng 0,3 lần |
| Drain nếu đi qua legacy-node như `hook`: khoảng 220 + 22 = khoảng 240 ms p50 | 3 phần trăm | khoảng 4,8 lần | khoảng 1,9 lần |

Đọc kết quả: mọi tuyến đều nằm xa dưới trần 8000 ms, nên trần đó không ràng buộc gì. Ngân sách có nghĩa duy nhất liên quan, 50 ms p95 của Event Store gate, không phải ngân sách hook, nhưng là tham chiếu gần nhất; chỉ tuyến native (verb Rust, một chu kỳ ghi) nằm trong 50 ms, tuyến legacy-node `hook` thì gấp 4 đến 7 lần. Do mục tiêu p95 của hook chưa có con số, quyết định "có cần route anh em nhẹ hơn" (spec 4.1) không thể suy ra từ ngân sách mà phải do chủ quyết một con số.

## 5. Kết luận và đề xuất xếp hạng

1. Đăng ký `mailbox drain` là verb native của host Rust, không đi qua `bin/fgos.mjs` (như `hook` hiện nay). Hai lần khởi động Node (khoảng 170 đến 220 ms) là chênh lệch lớn nhất đo được; đây là câu trả lời cho câu hỏi 9 của spec.
2. Shim shell tốn khoảng 7 ms cho mỗi lần gọi (10 tiến trình con), so với 2,2 ms của host. Chỉ đáng quan tâm nếu mục tiêu hook p95 chặt (dưới 10 ms); chưa có mục tiêu như vậy. Một route nhẹ cho hook là quyết định của chủ, không phải việc của đo đạc.
3. Shell guard (0,5 ms) chỉ đáng giữ nếu hook thật sự phải rẻ hơn chi phí một verb native (khoảng 10 ms) hầu hết thời gian; với drain native, thêm guard tiết kiệm khoảng 9 ms mỗi lần gọi không có thư, và đổi lại phải biết đường dẫn marker bên ngoài Rust. Spec hiện tại đã bỏ guard; số đo cho thấy bỏ nó là chấp nhận được nếu drain native.
4. Snapshot dưới mutex: chi phí đo được khoảng 10 ms mỗi lần ghi và gần như không phụ thuộc N; hợp lý cho send, claim và finish. Thiết kế nên giữ số lần ghi mỗi drain ở mức tối thiểu (mỗi lần ghi thêm 10 ms) và tránh ghi snapshot khi drain không có thư (drain không có thư chỉ cần đọc, không tốn fsync; đây là đề xuất, chưa đo).
5. Lock không công bằng, có thể bỏ đói: cần `Wait::Ms` có trần nhỏ trong hook (không đợi tới 8 s), và breaker như spec đã nêu; đây là rủi ro đo được chứ không phải suy đoán.

## 6. Giới hạn của nghiên cứu

- Một máy duy nhất, đang bị các phiên khác của chủ dùng (tải máy 8 đến 22 trong lúc đo). Số của H1 có nhiễu rõ ràng (R1 so với R2); số của H3 được đo ở tải thấp hơn (khoảng 8).
- Không đo trong môi trường hook thật của từng CLI; không đo Codex, agy, pi, omp trong vai trò chạy hook.
- Không đo các câu hỏi khác của S0 (nghe lời frame khi bị chèn lệnh, hook "person typed", `UserPromptSubmit` với peer prompt). Các câu hỏi này nằm ngoài nhiệm vụ được giao ở lượt này.
- Phần xấp xỉ: tổng chi phí drain là suy ra từ số đo từng bước, không đo trực tiếp.

## 7. Đã để lại và đã dọn

- Đã kill: 4 vòng lặp bận (pid 3258119 đến 3258122), tiến trình `hold` nền của các lần đo tranh chấp. Đã xác nhận bằng `pgrep` không còn tiến trình `mbbench` hay vòng lặp nào.
- Để lại, trong `/home/vantt/projects/forgent/.fgos/runtime/tmp/mailbox-probe4/` (gitignored): `bench.py`, `guard.py`, `g/`, `data/` (các file snapshot thử), `mbbench/` (crate và Cargo.lock riêng), `cb/` (thư mục build cargo, vài chục MB), `ex-hook.txt`, `ex-ver.txt`, `hold.out`, `hold.pid`, `loops.pids`.
- Repo: không đổi file nào khác ngoài báo cáo này; `git status` giống lúc bắt đầu. Không commit.

## Câu hỏi chưa giải quyết

1. Mục tiêu p95 của hook là bao nhiêu? Spec chỉ có trần 8000 ms; không có số này thì không quyết được có cần route anh em nhẹ hay không.
2. Trần kích thước snapshot được cấu hình bao nhiêu? (spec nhắc "configured size ceiling" nhưng tôi không thấy con số); kịch bản 0,8 MB là theo đề bài.
3. Nguyên nhân đuôi 12 đến 24 ms của `release` (quét holder còn sót trong `settle_release`) và cách tránh nó trên đường nóng.
4. Cần sửa `Wait::Ms` hoặc chọn chiến lược thử lại có trần nào để chống bỏ đói? Chọn trần chờ lock của hook.
5. Một verb native mới do host Rust xử lý có thật sự tránh Node không? Phải xác nhận bằng cách đăng ký verb đó (hiện chưa có) và đo lại trong hook thật của từng CLI.
