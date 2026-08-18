# CONTEXT — tsk-516: check bất biến ở đúng chỗ, và cắt lần verify thừa

Quyết định đã khoá cho tsk-516. Decision ID (`D1`..`D6`) là ổn định và được
trích dẫn ở các bước sau; không diễn giải lại ngầm.

## Biên của feature

**Trong phạm vi**

- Thêm một *check bất biến repo* (định nghĩa ở phần Thuật ngữ) chạy bên
  cạnh `item.verify` ở hai điểm của vòng đời: `return` và post-merge của
  `approve`.
- Cắt lần chạy `runGoalCheck` post-merge khi chứng minh được nó là bản sao
  y hệt lần đã chạy ở `return`.
- Khai báo lệnh check bất biến qua `.fgos/config.json`, kèm đăng ký vào
  `fgos setup` config-merge và `fgos doctor` check registry.

**Ngoài phạm vi**

- Chạy full `npm test` ở bất kỳ điểm nào của vòng đời (D2 loại thẳng).
- Sửa các flake full-suite đã biết (tsk-3ld) — không đụng tới.
- Đổi ngữ nghĩa của `item.verify` hoặc cách item đặt ra verify của mình.
- Giảm số lần một session tự chạy test bằng tay lúc implement — nằm ngoài
  tầm với của máy.

## Vấn đề đang giải (bằng chứng thật, không giả định)

Ngày 10/8/2026, `70a88ffd feat(tsk-1m0)` thêm file mới
`src/report/enduser-index-generate.mjs` mà không có row trong
`docs/architecture-manifest.json`. `test/architecture.test.mjs` đỏ **trên
main** sau `2564c8fb Merge branch 'fgw/tsk-1m0'`. Verify hẹp của tsk-1m0
không đụng file test đó, nên cả `return` lẫn post-merge re-verify đều xanh
và item land bình thường. Main nằm đỏ qua nhiều commit khác (tsk-psb,
tsk-5lr, tsk-49u...) tới khi có người vấp phải, phải mở commit riêng
`2e15dc30` (1 insertion) để sửa.

Điểm mấu chốt: **không thiếu test** — test đã có và bắt đúng lỗi. Thiếu là
*không ai chạy nó ở đúng thời điểm*, nên lỗi do người phát hiện muộn và tốn
một item riêng. Đây đúng thứ ưu tiên #2 (Release con người) cấm.

## Locked decisions

| ID | Quyết định | Vì sao |
|----|-----------|--------|
| D1 | Định lại hướng item: mục tiêu là **test đúng và đủ, không test thừa** — bịt lỗ hổng main-đỏ ĐỒNG THỜI cắt lần chạy verify thừa, không phải thêm một tầng test nữa. | Tiêu đề gốc ("mở rộng phạm vi re-verify") đọc theo nghĩa đen sẽ làm nặng thêm đúng thứ đang đau: việc càng nhiều thì test càng chậm. Người dùng chốt hướng này trực tiếp. |
| D2 | Check rộng **không phải** full `npm test` (đo được **163.1s**, 2827 test) mà là **tập con bất biến rẻ** (`test/architecture.test.mjs`, đo được **0.14s**). | Chênh ~1165 lần. Máy đã chạy verify 2 lần/item, nên full suite = +326s mỗi item, mỗi lần merge trả lại từ đầu. Full suite tốn gấp nghìn lần để bắt đúng class lỗi mà 0.14s đã bắt, lại kéo theo mặt flake tsk-3ld. Là test thừa theo D1. |
| D3 | Check bất biến chạy ở **cả hai chỗ**: `return` và post-merge. | `return` bắt sớm cho đúng session gây lỗi (sửa tại chỗ, không ai phải chờ); post-merge canh đúng cây sẽ land — đúng trạng thái đã đỏ trong ca tsk-1m0. Với 0.14s thì lặp này gần như miễn phí, và chính nó làm hard gate ở merge (D4) trở nên an toàn. |
| D4 | Check bất biến **chặn cứng** (hard gate) ở cả hai chỗ, không phải advisory. | Nó tất định, không heuristic: file có row hoặc không, import trỏ xuống hoặc trỏ lên — không có false positive để sợ, khác hẳn `footprintDiffHits` (advisory vì là heuristic). Ca tsk-1m0 chứng minh advisory thất bại: main vẫn đỏ qua nhiều commit. Bất đối xứng chi phí: chặn oan tốn 1 dòng manifest (`2e15dc30` đúng nghĩa đen 1 insertion); không chặn tốn nhiều ngày main đỏ + 1 item dọn. `merge.mjs:938-947` đã có sẵn đường thoát sạch. |
| D5 | **Bỏ qua** `runGoalCheck` post-merge khi chứng minh được cây sau merge y hệt cây đã verify ở `return`: HEAD của main là ancestor của branch **và** branch tip == `branchHeadAtReturn`. Ca main đã tiến lên vẫn chạy như cũ. | Hai lần chạy không phải lúc nào cũng thừa — `return` verify cây branch tip, merge verify cây main+branch; nếu main đã tiến lên thì lần sau bắt được thứ lần trước không thể bắt (branch xanh riêng, main đổi bên dưới). Nhưng khi cây y hệt thì là bản sao thuần 100%. Dữ liệu để chứng minh đã có sẵn, không cần cơ chế mới. |
| D6 | Lệnh check bất biến **khai báo qua `.fgos/config.json`** ngay từ item này (không hardcode), kèm đăng ký vào `fgos setup` config-merge và `fgos doctor` check registry. | Hardcode gắn chặt fgOS vào layout test của chính repo fgOS; project khác dùng fgOS không có `test/architecture.test.mjs`. fgOS là platform nên đây là sai tầng. Người dùng chốt làm ngay vì "không làm là quên luôn". Chi phí đăng ký setup/doctor được chấp nhận có ý thức. |

**Hệ quả giao nhau của D3 và D5 (đã xác nhận, không phải mâu thuẫn):** khi
cây sau merge chứng minh được là y hệt, lần chạy post-merge bị bỏ qua *cả
phần check bất biến*. Ở ca thường (main không tiến lên), check thực tế chỉ
chạy **một lần**, ở `return`. Hai chỗ ở D3 là để phòng ca main đã tiến lên.

## Thuật ngữ đã ghim

- **check bất biến repo** — một lệnh kiểm **tất định**, thuần đọc file,
  không spawn/timing/network, đúng-sai không phụ thuộc item nào đang chạy.
  Hôm nay repo này có đúng một ứng viên: `test/architecture.test.mjs`
  (đủ sổ manifest + import một chiều xuống). Đây **không** phải "test" theo
  nghĩa chậm — về bản chất là lint/invariant.
- **verify hẹp** — `item.verify`, lệnh do chính item khai báo. Không đổi
  nghĩa trong item này.
- **cây đã verify** — cây tại `branchHeadAtReturn`, đúng SHA mà
  `runGoalCheck` ở `return` đã cho xanh.
- **test thừa** — một lần chạy mà kết quả của nó đã được biết chắc chắn từ
  một lần chạy trước trên **cùng một cây**. Không bao gồm lần chạy trên cây
  khác (xem D5).

## Bằng chứng scout (đường dẫn thật, đã đọc trực tiếp)

- `src/runner/goal-check.mjs:33-36` — `runGoalCheck` spawn đúng literal
  `item.verify`, phán bằng exit status. Không nhánh nào tham chiếu lệnh
  suite cấp project.
- Điểm gọi `runGoalCheck`: `src/runner/merge.mjs:877` (ca đã là ancestor),
  `src/runner/merge.mjs:938` (post-merge, chỗ D4/D5 tác động),
  `bin/fgos.mjs:2447` (`return` nhánh branch, worktree detached tạm),
  `bin/fgos.mjs:2517` (`return` nhánh main-source),
  `src/runner/loop.mjs:394,784`. Tất cả truyền cùng `item` nên cùng
  `item.verify`.
- `src/runner/merge.mjs:938-947` — post-merge fail thì abort merge và trả
  `verify-fail`: đường thoát của hard gate đã tồn tại.
- `src/state/store.mjs:556` + `src/state/replay.mjs:169-170` —
  `branchHeadAtReturn` được ghi và replay vào state, tức dữ liệu cho D5 đã
  có sẵn.
- `src/runner/merge.mjs:736` — `isAlreadyMerged` đã dùng
  `git merge-base --is-ancestor`: primitive cho D5 đã có sẵn.
- `bin/fgos.mjs:2459,2519` — `frozenJudgeHits`/`footprintDiffHits` là
  advisory thuần ("a hit never blocks this return"): tiền lệ mà D4 cố ý
  **không** theo, kèm lý do.
- `rg -n "verifyScope|repoVerify" src bin docs` → không kết quả;
  `.fgos/config.json` chỉ có key `herdrOrchestrator`, `runner`. Đất trống,
  không có cơ chế nào đã làm sẵn việc này.
- `src/setup/checks.mjs:14-16` — re-export `registerCheck`,
  `registerConfigDefault`, `registerFix` từ `registrations.mjs`: cửa đăng ký
  cho D6 đã có sẵn.
- `docs/journals/260728-2245-lifecycle-sync-gates-three-latent-bugs.md:72`
  — tsk-3ld: test pass khi chạy riêng, flake khi chạy full suite. Lý do
  D2 loại full suite.
- `docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md:13,60`
  — đã dặn người "rule out an unrelated failure elsewhere in the full suite
  first": phân kỳ hẹp/rộng vốn đã được biết và đang được xử lý bằng tay.

**Đo thực tế trong worktree này (2026-08-11):** `npm test` → 163.1s, 2827
test, 0 fail. `node --test test/architecture.test.mjs` → 0.14s, 3 test.

**impact-analysis: degraded** — GitNexus có đăng ký và `status: present`,
nhưng index đang cũ (`4ce7a96`), nên blast radius chưa được xác nhận. Mọi
điều trên đã cross-check trực tiếp bằng `rg`/`git`/`Read`, không dựa vào
code graph.

## Tham chiếu chuẩn

- `docs/history/tsk-516-approve-reverify-scope/RESEARCH.md` — vòng nghiên
  cứu ở stage `discovery`, xác nhận từng tiền đề của item.
- `AGENTS.md` — DoD câu hỏi 5 (chuẩn `npm test`), install/setup/doctor gate
  (ràng buộc của D6), thứ tự ưu tiên sản phẩm (#2 Release con người).
- `docs/distribution-vision.md`, `docs/specs/distribution.md` — nền cho D6.

## Outstanding questions

None
