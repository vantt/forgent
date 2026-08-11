# plan.md — tsk-25b: chẻ hai file test chi phối wall-clock

Mode: **standard**

**Flag count: 2** — `public contracts` (đường dẫn `test/cli/fgos.test.mjs`
được 55 item tham chiếu trong `verify` và 158 doc nhắc tới; D1 xoá hẳn nó),
`existing covered behavior` (di chuyển 632 test đang phủ thật). Không cờ nào
thuộc nhóm hard-gate — đặc biệt **không phải** `removing a validation`, vì
D2 cấm xoá/sửa test, chỉ cho di chuyển.

Vì sao không nhỏ hơn `small`: item chạm hai file ở hai thư mục khác nhau,
đụng vào chính hạ tầng chứng minh của cả repo, và kết quả phải đạt hai
ngưỡng số (D3) chưa ai đo được trước khi làm. Không phải "vài file, không có
vùng xám".

## Approach

### Đường đã chọn

Chẻ cơ học từng file thành N file nhỏ, mỗi file dưới ngưỡng ~30s (D3), để
`node --test` trải chúng ra 16 core sẵn có. Không đụng nội dung test (D2).

Số học dẫn tới N, từ số đo trong [`RESEARCH.md`](./RESEARCH.md):

| File | Hiện tại | Chi phí/test | Để ≤30s cần | Chọn |
|---|---|---|---|---|
| `test/cli/fgos.test.mjs` | 171.0s / 547 test | ~0.31s | ≤ ~96 test/file → ≥6 file | **7–8 file** (biên an toàn) |
| `test/setup/checks.test.mjs` | 109.0s / 85 test | ~1.28s | ≤ ~23 test/file → ≥4 file | **5 file**, kèm ràng buộc dưới |

Ràng buộc riêng cho `checks.test.mjs`: hai test nặng nhất (12.2s và 10.7s,
đều dựng môi trường thật) **phải nằm ở hai nhóm khác nhau** — cùng nhóm là
23s chưa kể phần còn lại, sát ngưỡng ngay từ đầu.

Helper dùng chung (`run()`, `tmpCwd()`, `rawTmpCwd()`, các fixture git ở
`test/cli/fgos.test.mjs:44-190`) được trích ra một module cạnh các file mới
và import vào. Đây nằm trong định nghĩa "chẻ cơ học" đã pin ở
`CONTEXT.md` ("chuyển nguyên văn thân test… kèm phần import/helper cần
thiết"), không phải mở scope.

### Các hướng đã loại

- **Bật `concurrency` của `node:test` trong file hiện tại** — loại bằng bằng
  chứng, không phải bằng ý kiến: cả hai harness dùng `spawnSync`/
  `execFileSync` (`test/cli/fgos.test.mjs:7,:49`;
  `test/setup/checks.test.mjs:12,:496`), chặn event loop, nên cờ concurrency
  không đổi được gì. RESEARCH.md Round 1, mục "Found" #2.
- **Thu hẹp verify theo footprint** — tsk-516 đã đo và loại: tập con 4 file
  ra 172.6s / 732 test, chậm hơn full suite mà phủ ít hơn 2095 test.
- **Giữ tên `fgos.test.mjs` cho shard lớn nhất** — loại bởi D1 (xanh giả).
- **Gộp fixture / bớt spawn để hạ tổng CPU** — loại bởi D2, tách item riêng.

### Bản đồ rủi ro

| Thành phần | Mức | Cái gì chứng minh được |
|---|---|---|
| **Trần thật sau khi chẻ chưa biết** — wall-clock ≈ max(file). Nếu file chậm thứ ba của suite đã > 45s thì mục tiêu D3 không đạt được dù chẻ hoàn hảo. | **cao** | Proof point P1: đo wall-clock từng file của cả 118 file, lấy top 10. Số đo, không suy luận. Đây là proof point quan trọng nhất — nó quyết định plan này có thật hay không. |
| **Phân bổ nhóm cho `checks.test.mjs`** — 85 test nhưng phân bố chi phí lệch (12.2s/10.7s vs phần còn lại). Chia đều theo số lượng test có thể vẫn để lọt một nhóm quá ngưỡng. | trung bình | Proof point P2: đo chi phí từng test của `checks.test.mjs` trước khi quyết đường cắt, thay vì chia đều theo số test. |
| **5 item còn bay có `verify` trỏ vào đường dẫn cũ** (`tsk-1wdf` todo, `tsk-483` blocked, `tsk-5vl` awaiting-approval, `tsk-4uj`/`tsk-1cp` doing). Hai cái đang `doing` = phiên khác đang chạm vào. | trung bình | Proof point P3: đọc lại danh sách ngay trước khi sửa (danh sách này chụp lúc 2026-08-11) và sửa qua đúng một cửa ghi của engine, không sửa tay `.fgos/`. |
| **Số test tổng thay đổi** sau khi di chuyển (rơi mất test, hoặc double-count) | thấp | Verify của chính item đã bắt: tổng số test không giảm so với baseline. |
| Vỡ ràng buộc kiến trúc | không | `test/` nằm ngoài `docs/architecture-manifest.json`; `test/architecture.test.mjs` chỉ quét `src/`+`bin/`. |

`impact-analysis: full` (`fgos tool query --capability impact-analysis
--status present` → gitnexus `present`). Ghi chú trung thực: posture là
`full` nhưng gitnexus chỉ index `src/`+`bin/`, nên nó **không** nói được gì
về blast radius trong `test/` — không proof point nào ở trên dựa vào nó.

### Thứ tự

`fgos graph --json` cho thấy tsk-25b nằm ở một component không block item nào
khác (chỉ có `deps: [tsk-516]`, đã xong), nên `criticalPath`/`topUnblock` của
graph không chỉ định thứ tự nào cho item này. Thứ tự bên dưới đến từ chính
phép đo, không từ graph:

**P1 phải chạy trước mọi thứ** — nếu trần thứ ba đã > 45s thì ngưỡng của D3
cần chỉnh trước khi viết một dòng nào, và đó là việc của `fgos-validating`.

## Shape

### Phase 0 — Đo baseline trên chính máy/worktree này (chưa sửa gì; chạy ở child A, xem bảng Chia việc)

Số 163.1s / 171.0s / 109.0s đo ở worktree tsk-516. Phải đo lại ở đây để
before/after so được với nhau (verify của item yêu cầu đúng điều đó).

- `time npm test` → wall-clock + tổng số test + số fail.
- Đo từng file: với mỗi file trong 118 file, `time node --test <file>`,
  chạy tuần tự, xếp hạng. Lấy top 10 (**P1**).
- Đo từng test của `checks.test.mjs` (**P2**).

Kết quả Phase 0 là dữ liệu vào cho `fgos-validating`. Nếu top-3 file cho
thấy ngưỡng 45s bất khả thi, plan này quay lại chỉnh D3 chứ không đi tiếp.

### Phase 1 — Chẻ `test/cli/fgos.test.mjs` (child A)

- Trích helper dùng chung ra module cạnh đó.
- Chia 547 test thành 7–8 nhóm theo chủ đề verb, mỗi nhóm là một file
  `test/cli/fgos-<chủ-đề>.test.mjs`, tên theo đúng quy ước sẵn có của thư
  mục (`fgos-help.test.mjs`, `fgos-manifest.test.mjs`, `fgos-tool.test.mjs`).
- Xoá `test/cli/fgos.test.mjs` (D1).
- Sửa `verify` của 5 item còn bay qua verb của engine, không sửa tay `.fgos/`.

### Phase 2 — Chẻ `test/setup/checks.test.mjs` (child B)

- Chia 85 test thành 5 file theo chi phí đo được ở P2, không theo số lượng.
- Hai test nặng nhất nằm hai file khác nhau.

### Phase 3 — Đo sau khi hợp hai con, và chẻ mịn thêm nếu cần (2026-08-11)

Hai con đã merge vào `fgw/tsk-25b`. Số đo đầu tiên có cả hai thay đổi:

| Lần | Wall-clock |
|---|---|
| 1 | **46.91s** |
| 2 | **52.51s** |
| 3 (kèm đo CPU) | **50.37s** — `user=324.46s sys=104.50s cpu=851%` |

169.76s → ~47–53s, tức giảm khoảng 70%. Nhưng **chưa ổn định dưới ngưỡng
45s của D3**, và số CPU chỉ ra vì sao — đây là điều cả plan này lẫn plan hai
con đều chưa tính:

- Tổng CPU của cả bộ test là **429s**, nhưng chỉ dùng được **8.5 trên 16
  core** (`cpu=851%`).
- Sàn lý thuyết nếu lấp kín 16 core là ~27s. Khoảng cách 27s → 50s **không**
  đến từ file chậm nhất nữa (file nặng nhất chỉ ~22s), mà từ **độ lấp đầy
  core**: về cuối run chỉ còn dăm file nặng chạy, phần lớn core ngồi không.

Nói cách khác, đòn bẩy đã đổi. Vòng đầu, trần là `max(file)` nên chẻ tới
ngưỡng 30s là đủ. Bây giờ trần là makespan trên 16 core, nên **cùng một
phép chẻ cơ học (D2) vẫn còn dư địa**: chia nhỏ hơn nữa để có nhiều file
song song hơn, cụ thể 5 file `checks-setup-*` (mỗi file 2 test nặng, ~22s)
tách thành 10 file một test (~11–14s), và các file `test/cli` nặng ~20s
tách đôi.

Không hứa trước là đủ để xuống dưới 45s: mỗi test còn spawn một process CLI
thật, nên một file test ăn hơn một core, và chỉ đo mới biết. Nếu chẻ mịn vẫn
không đạt, việc còn lại là hạ **tổng** CPU (gộp fixture, bớt spawn) — đúng
thứ D2 đã hoãn sang item riêng — và lúc đó D3 cần người xem lại bằng số thật.

### Phase 4 — Nghiệm thu

`time npm test` → wall-clock ≤ 45s, 0 fail, tổng test không giảm; và không
file nào > ~30s. Ghi cả số trước lẫn số sau vào `docs/history/
tsk-25b-test-wallclock-split/`.

### Các trường hợp đáng chứng minh

- **Không mất test**: tổng số test sau = trước. Bắt bởi verify.
- **Không mất độ phủ ngầm**: một test nào đó dựa vào side effect của test
  chạy trước nó trong cùng file — tách file là tách process, side effect
  biến mất. Nếu có, nó đỏ ngay ở lần chạy đầu, không âm thầm.
- **Ngưỡng biên**: một nhóm rơi đúng ~30s. Chọn 7–8 nhóm thay vì 6 chính là
  biên an toàn cho việc này.
- **Chạy lại nhiều lần**: wall-clock dao động theo tải máy; số đo phải chạy
  một mình, tuần tự, đúng như verify đã ghi.

## Chia việc

Chẻ thành **2 child**, vì hai file độc lập hoàn toàn về footprint và về cách
cắt, nên chạy song song được:

| Child | Việc | Footprint | Proof point |
|---|---|---|---|
| **A** = `tsk-3um` | Chẻ `test/cli/fgos.test.mjs` thành 7–8 file + trích helper + xoá file cũ + sửa 5 verify còn bay | `test/cli/*` | **P1** (đo baseline + top-10 file toàn suite) |
| **B** = `tsk-67g` | Chẻ `test/setup/checks.test.mjs` thành 5 file theo chi phí đo được | `test/setup/*` | **P2** (đo chi phí từng test của `checks.test.mjs`) |

Cả hai child vào thẳng stage `decompose`, nên reality check của chúng
(`fgos-validating`) là chỗ P1/P2 thật sự chạy — Phase 0 bên dưới không phải
một phase riêng của item cha, nó là proof point gắn vào child. **P1 nằm ở
child A và phải chạy trước khi child A sửa dòng nào**: nếu top-3 file cho
thấy ngưỡng 45s bất khả thi, cả hai child dừng và D3 phải chỉnh trước.

Không chạy `fgos graph --what-if` để chọn cái nào đi trước: hai child không
phụ thuộc nhau, footprint không giao nhau, và chạy song song được — không có
"cái nào unblock nhiều hơn" để so.

Item cha giữ nghiệm thu tổng (Phase 3), vì không child nào một mình chứng
minh được ngưỡng ≤45s: wall-clock ≈ max(file), nên chỉ chẻ A thì suite đi từ
163s xuống ~109s rồi dừng ở `checks.test.mjs`.

## Assumptions

- **A1** — Chi phí mỗi test trong một file là tương đối đều (0.31s cho
  `fgos.test.mjs`), nên chia theo số lượng test là xấp xỉ đủ tốt cho file
  đó. Với `checks.test.mjs` giả định này **không** đúng (đã biết có test
  12.2s/10.7s) nên P2 đo thật thay vì giả định.
- **A2** — 16 core còn đủ chỗ sau khi tăng số file bận từ ~2 lên ~13. Nếu
  sai, wall-clock chạm trần CPU chứ không chạm trần file, và Phase 0 sẽ lộ
  ra khi so số.
- **A3** — 50 item đã ở `cleanup`/`done` mang `verify` trỏ đường dẫn cũ sẽ
  không chạy lại verify nữa, nên không cần sửa. Dựa trên việc verify chỉ
  chạy ở `return` và post-merge, cả hai đều đã qua với các item đó.

## Outstanding questions

None
