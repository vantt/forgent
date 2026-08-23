# plan.md — tsk-516: check bất biến ở return + merge, và cắt lần verify thừa

Mode: high-risk

Quyết định nguồn: `docs/history/tsk-516-approve-reverify-scope/CONTEXT.md`
(D1–D6). Bằng chứng nền: cùng thư mục, `RESEARCH.md`.

## Lane và vì sao không nhỏ hơn

Đếm flag theo Mode gate của `fgos-routing` (`.claude/skills/fgos-routing/
SKILL.md:47-58`) — 3 flag áp dụng:

1. **public contracts** — thêm một config key vào `.fgos/config.json` cộng
   một check vào `fgos doctor` (D6): đây là bề mặt người dùng fgOS nhìn
   thấy, phải vào `CHANGELOG.md`.
2. **existing covered behavior** — sửa `src/runner/merge.mjs` và
   `bin/fgos.mjs` ở đúng đường verify/merge, vùng đang được phủ dày
   (`test/runner/merge.test.mjs` 55K, `test/cli/fgos.test.mjs`,
   `test/runner/goal-check.test.mjs`).
3. **removing a validation** — D5 bỏ một lần chạy `runGoalCheck`. Đây là
   **hard-gate flag** theo bảng trên.

Hard-gate flag ⇒ **high-risk** bất kể số đếm. Khớp với `risk: heavy` item
đang mang sẵn. Lane nhỏ hơn không trung thực được: `small` không có chỗ cho
proof point của một thay đổi *gỡ bớt* kiểm tra, mà đó chính là chỗ item này
có thể sai âm thầm.

`fgos graph --json` cho item này trả `topUnblock` nằm trong `frame.skipped`
(không tính được ở frame hiện tại), nên thứ tự phase dưới đây dựa trên phụ
thuộc kỹ thuật và rủi ro, không dựa vào `topUnblock`. `criticalPath` có
tính nhưng tsk-516 không nằm trên nó; dep duy nhất `tsk-1kh` đã xong
(commit `2e15dc30`).

## Cách làm đã chọn

Một mạch thay đổi cho **một cơ chế duy nhất**: *khi nào chạy cái gì để
chứng minh cây sắp land là xanh*. Bốn phase, mỗi phase một commit riêng để
review được từng mảnh — đặc biệt phase 4, mảnh gỡ bớt kiểm tra.

**Không tách thành item con.** Tiêu chí tách của `fgos-coding-planning` là "các
mảnh *độc lập làm được*". Ở đây phase 2–4 đều sửa cùng vùng
`src/runner/merge.mjs` + `bin/fgos.mjs`, footprint chồng nhau nên sibling
sẽ phải chạy tuần tự chứ không song song được — tách chỉ nhân đôi chi phí
vòng đời (2 lần return + 2 lần merge + 2 lần verify) mà không mua được
song song. Nhân đôi vòng đời chính là thứ D1 vừa cấm. Reviewability lấy
bằng commit-per-phase thay vì item-per-phase.

### Phương án đã loại

- **Tách 2 item (A: thêm check, B: bỏ lần thừa).** Loại vì lý do footprint
  chồng ngay trên. Nếu `fgos-coding-validating` chứng minh được footprint không
  thực sự chồng, đây là phương án dự phòng đầu tiên nên xét lại.
- **Module mới `src/runner/invariant-check.mjs`.** Loại: logic spawn cần
  dùng đã nằm nguyên trong `src/runner/goal-check.mjs:33-106` (kèm hợp
  đồng timeout/`timedOut` của tsk-53o). Tách module mới là nhân bản logic
  đó, vi phạm DRY — và trớ trêu là còn tự sinh thêm một row manifest, đúng
  loại việc mà chính item này đang dựng lưới để bắt. Thay vào đó **tổng
  quát hoá tại chỗ**: `goal-check.mjs` export thêm `runCommand(cmd, cwd,
  timeoutMs)`, còn `runGoalCheck(item, cwd, timeoutMs)` thu lại thành
  `runCommand(item.verify, cwd, timeoutMs)`. Không file mới, không hành vi
  mới cho caller cũ.
- **Chạy full `npm test`** — đã bị D2 loại dứt (163.1s vs 0.14s).

## Bản đồ rủi ro

| # | Thành phần | Mức | Cái gì chứng minh được nó đúng |
|---|-----------|-----|------------------------------|
| R1 | Điều kiện bỏ qua re-verify (D5, phase 4) | **cao** | Test chứng minh cả hai chiều: (a) main **không** tiến lên ⇒ bỏ qua, và cây sau merge thật sự bằng cây tại `branchHeadAtReturn`; (b) main **đã** tiến lên ⇒ **không** bỏ qua, `runGoalCheck` vẫn chạy trên cây đã merge. Sai chiều (b) là ca hỏng chết người: cây chưa ai verify được land. |
| R2 | Cách chứng minh "cây y hệt" | **cao** | D5 khoá điều kiện là *HEAD là ancestor của branch **và** branch tip == `branchHeadAtReturn`*. Có một cách chứng minh trực tiếp hơn: sau `git merge --no-commit`, so tree đã stage với `<branchHeadAtReturn>^{tree}` — bằng nhau là bằng chứng thẳng thay vì suy ra từ ancestry. Phase 4 **triển khai đúng điều kiện D5 đã khoá**; cách so tree được nêu ở đây như proof point để `fgos-coding-validating` xác nhận nó có thoả đúng vị từ của D5 hay không trước khi ai đổi gì. Không tự đổi ở phase này. |
| R3 | Hard gate ở merge (D4) chặn item không liên quan | trung bình | Test: main đang đỏ bất biến ⇒ merge của một item sạch bị chặn với lý do đọc được, và abort merge sạch (không để lại trạng thái nửa vời) — đường `merge.mjs:938-947` đã có sẵn, phải chứng minh nó vẫn đúng khi lý do đỏ đến từ check bất biến chứ không từ `item.verify`. |
| R4 | Tương thích ngược khi config vắng | trung bình | Test: config không có key ⇒ không check bất biến nào chạy, hành vi giống hệt hôm nay. Đây là điều kiện để không phá 300+ item đang trong backlog và mọi repo khác dùng fgOS. |
| R5 | Ngữ nghĩa timeout (tsk-53o) | thấp | Check bất biến đi qua cùng `runCommand` nên thừa hưởng `timedOut`; test: check bất biến timeout ⇒ phân biệt được với đỏ thật, không park nhầm thành `verify-fail`. |
| R6 | Đăng ký setup/doctor (D6) | thấp | `node --test test/setup/checks.test.mjs` xanh với config default mới có mặt trong config-merge và check mới có trong doctor registry. |

**impact-analysis: degraded** — GitNexus `status: present` nhưng index cũ
(`4ce7a96`), nên blast radius **chưa được xác nhận**. Mọi điểm gọi liệt kê
trong `CONTEXT.md` là kết quả `rg`/`Read` trực tiếp, không lấy từ code
graph. `fgos-coding-validating` nên coi phần blast-radius là bằng chứng yếu và
cross-check bằng grep, không tin số của graph.

## Phase

### Phase 1 — Config + đăng ký setup/doctor (D6)

Thuần bổ sung, không đổi hành vi hiện có.

- `src/setup/registrations.mjs` — `registerConfigDefault({id, key, shape})`
  (chữ ký tại `:90`) cho key mới chứa danh sách lệnh bất biến; giá trị mặc
  định của repo này là `node --test test/architecture.test.mjs`.
  `registerCheck({id, description, check})` (`:69`) cho doctor: báo khi
  lệnh khai báo không chạy được.
- `.fgos/config.json` — nhận key mới qua config-merge.
- `CHANGELOG.md` — `## [Unreleased]`, đây là thay đổi người dùng fgOS thấy.

Xong khi: `node --test test/setup/checks.test.mjs` xanh, `fgos doctor` liệt
kê check mới.

### Phase 2 — `runCommand` + chạy check bất biến ở `return` (D2, D3, D4)

- `src/runner/goal-check.mjs` — export `runCommand(cmd, cwd, timeoutMs)`;
  `runGoalCheck` thu lại thành wrapper. Hợp đồng cũ
  (`passed`/`status`/`timedOut`/`output`) giữ nguyên từng chữ.
- `bin/fgos.mjs` — cả hai đường `return`: nhánh branch (`:2447`, trong
  worktree detached tạm, sau `provisionDependencies`) và nhánh main-source
  (`:2517`). Check bất biến chạy **sau** `item.verify` xanh; đỏ ⇒ park
  `blocked` như đường verify-fail đang làm, kèm lý do phân biệt được.

Xong khi: R4, R5 có test; `node --test test/cli/fgos.test.mjs` xanh.

### Phase 3 — Chạy check bất biến post-merge, hard gate (D3, D4)

- `src/runner/merge.mjs:938` — sau khi `runGoalCheck` xanh, chạy tiếp check
  bất biến trên cây đã merge; đỏ ⇒ đi đúng nhánh `verify-fail` sẵn có
  (abort merge, trả outcome đọc được). Ca ancestor ở `:877` xử lý cùng
  cách.

Xong khi: R3 có test; `node --test test/runner/merge.test.mjs` xanh.

### Phase 4 — Bỏ lần chạy thừa (D5)

- `src/runner/merge.mjs` — trước lời gọi `runGoalCheck` post-merge, kiểm
  điều kiện D5 (`git merge-base --is-ancestor`, primitive đã có tại `:736`;
  `branchHeadAtReturn` đọc từ item, ghi ở `store.mjs:556`, replay ở
  `replay.mjs:169-170`). Thoả ⇒ bỏ qua **cả** `item.verify` **và** check
  bất biến (cùng cây, cùng kết quả — đúng D1). Không thoả ⇒ chạy đủ.
- Chỉ áp dụng cho return nguồn branch. Return nguồn main-source dùng
  `headAtReturn`, không nằm trong phạm vi D5 — không đụng.

Xong khi: R1 có test cả hai chiều; R2 được `fgos-coding-validating` chốt.

## Trường hợp phải chứng minh

- Config vắng / danh sách rỗng ⇒ hành vi giống hệt hôm nay (R4).
- Check bất biến đỏ ở `return` ⇒ item `blocked`, lý do phân biệt được với
  `item.verify` đỏ.
- Check bất biến timeout ⇒ không bị nhầm thành đỏ thật (R5, hợp đồng
  tsk-53o).
- Main không tiến lên ⇒ post-merge bỏ qua; main tiến lên ⇒ post-merge chạy
  đủ (R1, hai chiều).
- Item không có `branchHeadAtReturn` (return main-source) ⇒ không bao giờ
  bỏ qua.
- Main đang đỏ bất biến ⇒ merge item sạch bị chặn, merge abort sạch (R3).

## Files dự kiến chạm

`src/config/shared-config-file.mjs`, `src/runner/goal-check.mjs`,
`src/runner/merge.mjs`, `bin/fgos.mjs`, `src/setup/registrations.mjs`,
`CHANGELOG.md`, `test/config/shared-config-file.test.mjs`,
`test/runner/goal-check.test.mjs`, `test/runner/merge.test.mjs`,
`test/setup/checks.test.mjs`.

Không thêm file `.mjs` mới trong `src/`+`bin/` ⇒ không phát sinh row
manifest mới.

**Hai sai lệch so với dự kiến ban đầu, phát hiện khi build:**

1. **`.fgos/config.json` bị loại khỏi diff.** `merge.mjs` từ chối mọi merge
   có stage file dưới `.fgos/` (`fgos-write-rejected`, nhánh `fgosPaths`),
   nên commit key mặc định lên branch này sẽ làm chính item không merge
   được. Key phải vào qua `fgos setup` config-merge trên main checkout —
   đúng cơ chế D6 đã chọn. Cho tới khi `fgos setup` chạy,
   `readInvariantCheckCommands` trả `[]` và không check bất biến nào chạy:
   tương thích ngược, đúng R4.
2. **Hằng số mặc định nằm ở `src/config/shared-config-file.mjs` (domain),
   không ở `src/setup/registrations.mjs` (use-case).** Runner
   (`infra`) phải import nó, mà `infra -> use-case` là import ngược lên,
   vi phạm đúng luật một-chiều-xuống mà `test/architecture.test.mjs` canh
   — tức chính bất biến item này đang dựng lưới để bảo vệ. Đặt ở `domain`
   thì cả use-case lẫn infra đều import xuống hợp lệ.
   `test/config/shared-config-file.test.mjs` vào danh sách file chạm theo.

## Verify

```
npm test
```

Chọn bằng số đo, không bằng khẩu hiệu. Vòng `fgos-coding-validating` đầu tiên đã
đánh trượt phương án "4 file phủ đúng code bị đổi" ở dòng *smaller path*,
với bằng chứng đo trong chính worktree này (2026-08-11, mỗi phép đo chạy
một mình):

| lệnh | wall-clock | số test |
|------|-----------|---------|
| `npm test` (118 file) | **163.1s** | 2827 |
| `node --test` 4 file phủ đúng code đổi | **172.6s** | 732 |
| `test/cli/fgos.test.mjs` một mình | **171.0s** | — |
| `test/setup/checks.test.mjs` một mình | **109.0s** | — |
| `test/runner/merge.test.mjs` một mình | 2.0s | — |
| `test/runner/goal-check.test.mjs` một mình | 2.0s | — |

`node --test` song song **theo file**, nên wall-clock của cả suite ≈ chi
phí của đúng file chậm nhất: `fgos.test.mjs` một mình đã 171.0s so với
163.1s của toàn bộ (chênh 5%, trong biến động của loại test dựng môi
trường thật) — 117 file còn lại nấp sau nó, chạy thêm gần như miễn phí.

Item này sửa `bin/fgos.mjs` (phase 2), mà code đó do `fgos.test.mjs` phủ,
nên **không tồn tại** tập con nào vừa chứng minh được phase 2 vừa rẻ hơn
`npm test`. Tập con 4 file bị `npm test` chi phối tuyệt đối: đắt hơn 9.5s
và phủ ít hơn 2095 test.

Đây **không** phải đảo ngược D2. D2 loại full suite khỏi vai trò *check bất
biến chạy mỗi lần return/merge cho mọi item* — vai trò đó vẫn là
`test/architecture.test.mjs` (0.14s), không đổi. Chỗ này là *verify của
riêng item tsk-516*, một câu hỏi khác, và D1 ("không test thừa") đo bằng
thời gian thật thì chính tập con mới là thứ thừa.

**Bài học rộng hơn, ghi lại cho item sau:** ở repo này chi phí verify bị
lượng tử hoá — chạm code do `fgos.test.mjs` phủ là trả ~171s, chạm code do
`checks.test.mjs` phủ là trả ~109s, bất kể thu hẹp thế nào. "Ít test hơn"
không đồng nghĩa "nhanh hơn".

## Outstanding questions

None
