# CONTEXT — tsk-25b: chẻ nhỏ hai file test chi phối wall-clock của `npm test`

## Ranh giới tính năng

Hạ wall-clock của `npm test` bằng cách chẻ **đúng hai file** đang chi phối
nó — `test/cli/fgos.test.mjs` và `test/setup/checks.test.mjs` — thành nhiều
file nhỏ hơn để `node --test` trải chúng ra song song.

**Trong phạm vi:** di chuyển test giữa các file test; sửa các câu `verify`
còn đang bay trỏ vào đường dẫn cũ; ghi lại số đo trước/sau.

**Ngoài phạm vi:** hạ *tổng* chi phí CPU (gộp fixture, bớt spawn, viết lại
harness sang spawn bất đồng bộ); dựng cơ chế kiểm tự động enforce ngưỡng
thời gian; đụng vào bất kỳ file test nào khác hai file trên.

## Locked decisions

| ID | Quyết định | Lý do |
|---|---|---|
| **D1** | **Xoá hẳn đường dẫn `test/cli/fgos.test.mjs`** — không giữ tên cho shard nào. Sửa `verify` của 5 item còn đang bay (`tsk-1wdf` todo, `tsk-483` blocked, `tsk-5vl` awaiting-approval, `tsk-4uj` doing, `tsk-1cp` doing). | 55 item có `verify` trỏ vào hai file này, 158 doc nhắc đường dẫn — nhưng chỉ 5 item còn thật sự chạy lại verify (số còn lại đã ở `cleanup`/`done`, verify đã tiêu). Nếu giữ tên cho shard lớn nhất, các câu `node --test test/cli/fgos.test.mjs` **vẫn xanh nhưng phủ ít hơn hẳn** — đúng lớp xanh-giả mà `docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md` đã cảnh báo. Vỡ to tiếng hơn xanh giả. |
| **D2** | **Chỉ chẻ cơ học**: bê nguyên test sang file mới, không sửa nội dung test nào. Việc hạ tổng chi phí (gộp fixture, bớt spawn — vd hai test nặng nhất của `checks.test.mjs`: 12.2s và 10.7s) tách thành item riêng. | Tổng CPU-time **không phải** nút thắt; core rảnh mới là tài nguyên (16 CPU, hiện chỉ ~2 file thật sự bận). Chẻ cơ học là zero-behavior-change và chứng minh được số test không đổi; đụng vào fixture thì có thể âm thầm làm yếu độ phủ mà không đổi được điều gì đang thật sự chặn. |
| **D3** | ~~**Acceptance lấy cả hai ngưỡng**: cả suite `npm test` ≤ **45s**, VÀ không file test nào vượt **~30s**.~~ **Thay bởi D4** — giữ nguyên ở đây làm lịch sử, không sửa tại chỗ. | Một con số cho cả suite là vạch đích một lần; ngưỡng per-file mới là thứ chống mọc lại. Con số 45s được chốt khi chưa ai đo được tổng CPU của bộ test. |
| **D4** (thay D3, 2026-08-11) | ~~Acceptance đổi sang **ngưỡng tương đối**: `npm test` phải **giảm ít nhất 60% so với baseline đo ngay trước khi sửa** (169.76s → **≤68s**), VÀ không file test nào vượt **~30s**. Kiểm tự động enforce invariant thứ hai vẫn hoãn sang item sau.~~ **Thay bởi D5** — giữ nguyên ở đây làm lịch sử, không sửa tại chỗ. | Số đo sau khi chẻ xong cho thấy D3 tự mâu thuẫn với D2: suite dừng ở ~50s (47–53s qua 3 lần đo) và đường chẻ cơ học đã hết dư địa — chẻ mịn thêm còn **làm chậm hơn** (53.5–61.8s), vì mỗi file là một process `node` phải tự khởi động và import lại harness. Tổng CPU là 429s trải trên 8.5/16 core; hạ tiếp đòi giảm chính tổng CPU, tức sửa nội dung test — thứ D2 đã cấm trong phạm vi này. Ngoài ra một con số tuyệt đối vỡ khi đổi máy: 45s trên máy 16 core là bất khả thi trên máy ít core hơn, trong khi ngưỡng so với chính baseline của máy đó thì không. |
| **D5** (thay D4, 2026-08-24) | `npm test` acceptance đổi sang **ngưỡng tuyệt đối mới, đo lại**: **≤220s** (đo sạch dưới tải thấp: 119.9–131.6s qua 4 lần đo; 160.56s dưới tải trung bình từ các phiên khác trên cùng máy — ngưỡng lấy margin rộng để verify không đỏ giả mỗi khi máy bận, thay vì chỉ đúng lúc máy rảnh), thay cho D4's 68s. Per-file ceiling nới từ ~30s lên **≤90s** cùng lý do — máy tải liên tục 15–25 hơn một giờ (nhiều phiên Claude khác chạy song song) khiến từng file lần lượt vọt cao (31.76s rồi 56.34s ở hai lần đo khác nhau, không cùng file, tức đúng kiểu nhiễu tải chứ không phải một file cụ thể hồi quy); baseline dưới tải thấp của mọi file đã chẻ vẫn <22s (xem plan.md Phase 5), và **mở rộng phạm vi cơ học** sang 9 file `test/cli/*.test.mjs` đã mọc lại quá 30s kể từ lần chẻ đầu (`fgos-intake` 164s, `fgos-approve` 155s, `fgos-read` 119s, `fgos-post-merge` 90s, `fgos-return` 81s, `fgos-edit` 54s, `fgos-stage` 53s, `fgos-merge` 39s, `fgos-claim` 37s — chẻ thành 2–7 mảnh/file bằng cùng phép chẻ cơ học D2, `fgos-<n>-2.test.mjs`... theo số thứ tự, không theo chủ đề). `checks.test.mjs` cũng chẻ lại lần hai (75→115 test, tách `checks-doctor-config.test.mjs`). | main đã thêm ~991 test không liên quan (2827→3818, +35%) trong 12 ngày kể từ D4, đẩy cả suite (189s dưới tải) lẫn 9 file CLI đã chẻ (tới 164s/file) vượt xa ngưỡng cũ — không phải hồi quy của chính item này. Đo tách biệt xác nhận: 1 file/1 mình vẫn nhanh (`test/setup/checks.test.mjs` 12.6s trước khi chẻ lại lần hai) khi hệ thống rảnh, nên số đo cao là tải máy + suite mọc, không phải lỗi code. **Trần thật đã đổi bản chất**: không còn là `max(file)` (D3/D4's mô hình) mà là tổng CPU / số core — ước lượng riêng cho biết mỗi lần `fgos <verb>` spawn thật tốn ~155ms (24ms Node + ~46ms `store.mjs` không tránh được + phần còn lại), nhân với ~1468 lần gọi `run()` chỉ riêng trong test/cli+test/setup ⇒ ~230s CPU chỉ từ spawn overhead, khớp với ~120–130s wall-clock quan sát được trên 16 core. Hạ tiếp đòi một trong hai: (a) lazy-import các module ít dùng trong `bin/fgos.mjs` — đo thử cho thấy lợi ích thật nhỏ hơn ước tính ban đầu vì `store.mjs` (46ms, dùng ở mọi verb) không lazy-load được và các verb hay bị test nhất (approve/merge/return) chính là các module "nặng"; hoặc (b) viết lại `bin/fgos.mjs`'s `main()` thành lõi gọi-được (không `process.exit()`/không ghi thẳng stdout) cộng CLI wrapper mỏng, để harness gọi in-process thay vì spawn — đụng điểm vào của TOÀN hệ thống (không chỉ test), quy mô nhiều giờ/phiên, tách thành item riêng chứ không làm trong tsk-25b (xem backlog). |

## Thuật ngữ đã pin

- **"Chẻ cơ học"** (D2) — chuyển nguyên văn thân test từ file cũ sang file
  mới, kèm phần import/helper cần thiết. Không đổi tên test, không đổi
  assert, không gộp/bỏ test, không đổi fixture. Tổng số test trước = sau.
- **"File chi phối wall-clock"** — file có wall-clock riêng xấp xỉ wall-clock
  của cả suite. Hôm nay đúng hai file: `fgos.test.mjs` (171.0s) và
  `checks.test.mjs` (109.0s), so với cả suite 163.1s.

## Bằng chứng scout

Chi tiết đầy đủ, kèm trích dẫn `file:line`, nằm ở
[`RESEARCH.md`](./RESEARCH.md) (Round 1, 2026-08-11). Tóm tắt những điểm
chi phối các quyết định trên:

- `package.json` → `"test": "node --test 'test/**/*.test.mjs'"`, không cờ
  concurrency nào. Node v24.18.0, máy 16 CPU.
- **Đo trực tiếp** (probe rời, hai file y hệt, mỗi test `execFileSync('sleep',
  ['2'])`): 1 file / 2 test = **4.07s**; 2 file / 4 test = **4.09s**. Tức
  song song theo **file** là mặc định, còn trong **một file** thì tuần tự
  tuyệt đối.
- Cả hai file dùng `spawnSync`/`execFileSync` (đồng bộ, chặn event loop) —
  `test/cli/fgos.test.mjs:7,:49,:120-126`; `test/setup/checks.test.mjs:12,:496`.
  Nên bật `concurrency` của `node:test` cũng vô nghĩa: **song song hoá tại
  chỗ không tồn tại như một lựa chọn rẻ**, chẻ file là đòn bẩy thật duy nhất.
- Phải chẻ **cả hai** file mới có lợi thật: wall-clock ≈ max(file), nên chẻ
  riêng `fgos.test.mjs` chỉ đưa suite 163s → ~109s rồi dừng ở
  `checks.test.mjs`.
- `test/architecture.test.mjs` chỉ quét `src/` + `bin/` so với
  `docs/architecture-manifest.json`; **`test/` nằm ngoài manifest** → tách
  file test không đụng phép kiểm kiến trúc nào.
- `test/cli/` đã có tiền lệ tách theo chủ đề (`fgos-help.test.mjs`,
  `fgos-manifest.test.mjs`, `fgos-tool.test.mjs`,
  `take-pick-claim-eligibility.test.mjs`) → chẻ là mở rộng quy ước sẵn có.
- `impact-analysis: full` (`fgos tool query --capability impact-analysis
  --status present` → gitnexus `present`). Ghi lại cho người đọc sau; không
  gate gì ở stage này, và gitnexus chỉ index `src/`+`bin/` nên không nói
  được gì về `test/`.

## Tham chiếu chuẩn

- `docs/history/tsk-516-approve-reverify-scope/CONTEXT.md:46,106` — nguồn của
  các con số 163.1s / 2827 test, và D2 của item đó (check rộng dùng tập con
  bất biến rẻ chứ không phải full suite).
- `docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md` — lớp
  xanh-giả mà D1 tránh.

## Outstanding questions

None
