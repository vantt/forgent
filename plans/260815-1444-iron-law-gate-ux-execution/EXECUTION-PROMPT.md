# Prompt thực thi — Iron Law gate UX (`tsk-1y6` × 4) + `tsk-3xog`

Dán nguyên khối dưới đây vào một phiên Claude Code mới mở tại
`/home/vantt/projects/forgentX`.

---

Làm trọn bộ bốn item con của `tsk-1y6`, cộng `tsk-3xog`, rồi đưa lên main
nếu được.

`tsk-3xog` **độc lập hoàn toàn** với bốn con kia — khác file, khác nhánh,
không phụ thuộc ai. Chạy song song ngay từ đầu, đừng xếp sau. Phần mô tả
riêng của nó ở cuối tài liệu này.

## Bối cảnh đã có (đừng làm lại)

Thiết kế đã chốt xong qua 8 vòng thảo luận. Tài liệu nằm ở
`docs/history/iron-law-gate-human-ux/` **trên nhánh `fgw/tsk-1y6`**, không
có trên main:

- `DISCUSSION.md` — toàn bộ lý lẽ, §4 là bảng D1–D9
- `CONTEXT.md` — bảng quyết định khoá dưới heading `## Locked decisions`
- `plan.md` — `Mode: high-risk`, bản đồ rủi ro, A1/A1b/A2, spec bốn con

Con fork từ `fgw/tsk-1y6` (`src/runner/claim-port.mjs:148`) nên tài liệu
đọc được ngay trong worktree của con. Cả bốn con đã mang `docsRef`.

**Đọc `CONTEXT.md` và `plan.md` trước khi động vào bất cứ thứ gì.** Chín
quyết định D1–D9 đã khoá — cite chúng, **không mở lại, không diễn giải
lại**. Nếu thấy một quyết định sai, dừng và báo người, đừng tự sửa.

## Thứ tự

`tsk-1y6-1` và `tsk-1y6-2` độc lập, chạy song song được.
`tsk-1y6-3` phụ thuộc `-2`. `tsk-1y6-4` phụ thuộc cả ba. `deps` đã gắn
trong state nên `fgos ready` tự lọc đúng — cứ theo frontier, đừng tự xếp.

Với mỗi con: `/fgOS:pick <id>` rồi để `fgos-coding-implement` chạy, kết
thúc bằng `/fgOS:return <id>`.

## Bốn cái bẫy đã biết — đọc trước khi code

**1. Hai biểu thức riêng, tuyệt đối không gộp helper (con 1, plan.md
A1b).** Cổng bắn ở ba chỗ nhưng discriminator KHÁC NHAU:

- `approve` (`bin/fgos.mjs:3596`) và `merge next`'s `wouldTripIronLaw`
  (`:2480`) → `resolveRoot(view, id) === id`
- `sync-root` (`:4090`) → **`!item.parent`**, KHÔNG phải `resolveRoot`

`sync-root` chỉ land vào **cha trực tiếp**
(`targetBranch = item.parent ? branchNameFor(item.parent) :
detectTrunk(repoRoot)`). Dùng `resolveRoot` ở đó sẽ sai cho một gốc có cha
mà cha lại có ông — `resolveRoot` leo tới đỉnh, target thật chỉ lên một
bậc. Gộp ba chỗ thành một helper chung là rơi đúng bẫy này.

Cũng đừng nhân tiện refactor ba bản copy-paste của gate thành helper —
đã có item backlog riêng, và gộp nó vào đây biến một thay đổi hành vi
thành refactor + thay đổi hành vi, làm review không phân biệt được cái
nào gây regression.

**2. D8 phải gọi `addDecision` trực tiếp, không shell ra `fgos decision`.**
Verb `fgos decision` **không có** flag `--kind`, `addDecision` mặc định
`kind: 'design'`. Bản ghi mức `warn` là bản ghi của máy, phải mang
`kind: 'engine'` — ghi qua CLI sẽ tái tạo đúng lỗi backlog đang mở (bản
ghi máy bị cổng retrospective đọc nhầm thành người suy ngẫm).

**3. Bẫy thứ tự của bằng chứng Iron Law (con 1 chắc chắn dính).** Con 1
sửa `bin/fgos.mjs` → chắc chắn trip Iron Law lúc merge, nên **phải** có
`docs/history/tsk-1y6-1/iron-law-evidence.md` với chứng minh
failing-test-first thật.

Có một bug đã biết: `classifyIronLaw` chỉ thấy file **đã commit**, nên
chạy nó trước khi commit sẽ trả `required: false` giả và session tưởng
không cần viết bằng chứng. **Đừng tin phép thử trước commit.** Con 1 đụng
`bin/fgos.mjs` — cứ coi như required, viết bằng chứng, và viết cho thật:

- test đỏ TRƯỚC, nhìn nó đỏ đúng vì tính năng chưa có
- rồi mới implement
- chép transcript đỏ thật vào file bằng chứng

Nếu lỡ implement trước rồi mới phủ test, **ghi thẳng khoảng trống đó ra**
đúng như `docs/history/tsk-3dt/iron-law-evidence.md` và
`docs/history/tsk-xyr/iron-law-evidence.md` đã làm. Bằng chứng trung thực
mà không đạt chuẩn còn dùng được; bằng chứng khai man thì không.

**4. Kỷ luật worktree.** Không bao giờ `git add -A` trong worktree —
worktree không giữ bản `.fgos/` trên đĩa nên `-A` stage toàn bộ `.fgos/`
thành deleted. Stage đúng file mình sửa. Mọi `fgos <verb>` phải có
`--dir /home/vantt/projects/forgentX`.

## Verify

Mỗi con đã mang sẵn `verify` thật trong state — đọc bằng
`fgos list --id <id> --json`, đừng tự chế lại. Hai con đụng skill prose
(`-2`, `-3`): đọc `docs/how-to/write-verify-for-a-skill-prose-change.md`
trước, và biết sẵn câu trả lời cho vòng judge thứ hai — verify **không**
có nghĩa vụ chứng minh prose chạy đúng lúc runtime.

Chạy `npm test` đầy đủ trước khi return từng con. Nền hiện tại: 3333
pass / 0 fail / 5 skip (đã merge main tới `b1f57afd`).

## Đưa lên main

Sau khi cả bốn con `awaiting-approval`:

1. `/fgOS:merge-loop` để gặt con vào `fgw/tsk-1y6`.
2. Rồi `fgos sync-root tsk-1y6` để đưa gốc lên main.

`tsk-3xog` là gốc riêng, không thuộc cây `tsk-1y6` — nó merge thẳng lên
main bằng đường của chính nó và **không cần chờ** bốn con kia. Nếu nó xong
trước thì cứ đưa lên main trước, đừng gom chung.

**Điểm dừng cứng, phải tôn trọng.** Cả hai bước trên sẽ trip Iron Law vì
diff chứa `bin/fgos.mjs`. Bạn **không được** chạy `--acknowledge-iron-law`
trên thẩm quyền của chính mình — RUL34/RUL37 (`docs/specs/runner.md`) đòi
một người thật tự quyết, và item này đang đi sửa đúng chuyện đó nhưng
D1/D2 chưa live lúc merge.

Khi bị chặn: gom bằng chứng (`git show
fgw/<id>:docs/history/<id>/iron-law-evidence.md`), trình ra đầy đủ, nói rõ
sắp land cái gì — bao nhiêu con, những module nào trip — rồi **dừng và
hỏi người**. Đừng lách, đừng chờ, đừng tự ký.

Nếu người trả lời duyệt trong chat thì chạy lệnh hộ họ (đó chính là D2 —
người quyết, agent thao tác), và báo lại exit code thật.

## `tsk-3xog` — hợp đồng heading `## Locked decisions`

Chạy song song với bốn con trên, `/fgOS:pick tsk-3xog`. **Đọc mô tả đầy đủ
của item** (`fgos show tsk-3xog`) — nó có một phần "CẬP NHẬT ... ĐÃ LỖI
THỜI" ở cuối. Phần đó là phần đúng; đoạn đầu trình bày ba hướng như thể
cần cân nhắc **đã bị chính số đo trong phần cập nhật bác bỏ**. Đừng cân
nhắc lại (a)/(b)/(c) — đã chốt.

**Vấn đề.** `src/intake/plan.mjs:159` và `:344` tìm bảng quyết định bằng
regex literal tiếng Anh `/##\s*Locked decisions/i`. Skill bên viết
(`fgos-coding-exploring`) không ghim heading đó. Session viết tiếng Việt
→ slice rỗng → `normalizeChild` nhảy qua cả khối kiểm citation
(`if (lockedDecisionIds.size > 0)`), nên child cite một D-ID **không tồn
tại** vẫn được nhận. Fail **open**, không log, không cảnh báo.

**Ba việc, đã chốt phạm vi:**

1. Ghim heading literal vào bước 3 của
   `.agents/skills/fgos-coding-exploring/SKILL.md` — đây là nguồn
   canonical. `.claude/skills/**` là bản **sinh ra**: chạy
   `npm run build:skills` và commit cả hai, xem
   `test/skills/fgos-mirror.test.mjs`.
2. Thêm test canh gác cùng họ với
   `test/scripts/check-decision-citation-drift.test.mjs` (đã có tiền lệ,
   **không** dựng cơ chế mới): fail khi một `CONTEXT.md` có D-ID trong
   prose mà slice `## Locked decisions` rỗng.
3. Đổi heading 30 file cũ sang `## Locked decisions`.

**Bẫy ở việc 3 — đừng sed mù.** Phép đếm ban đầu tính "D-ID xuất hiện bất
kỳ đâu trong file", nên trong 31 file có thể lẫn dương tính giả: file chỉ
**trích** D-ID của feature khác chứ không có bảng quyết định của riêng nó.
Mở từng file xác nhận có bảng thật rồi mới đổi. Biến thể đã gặp gồm
`## Quyết định đã chốt`, `## Quyết định đã khoá`, và
`## 2. Quyết định đã khoá (D1-D10, ...)` — có cả tiền tố số.

**Không làm:** nới regex bên đọc (đã bác — 0/31 file mù thuộc item còn mở,
nên lý lẽ "sửa file cũ" đã chết, và nới là mở danh sách đoán không điểm
dừng); thêm check vào `fgos doctor` (đây là lint tài liệu, test mới là nhà
đúng).

`tsk-3xog` **không** đụng module nào trong `MODULE_RULES`, nên nửa module
của Iron Law sẽ không trip — merge của nó nhiều khả năng sạch, khác hẳn
`tsk-1y6-1`.

## Không thuộc phạm vi

- `tsk-1js` (Iron Law không quản được project khác) — người dùng đã quyết
  làm sau. Không đụng `src/evolve/iron-law.mjs`.
- Field bypass trên workitem (D4 loại), cạnh FSM
  `awaiting-approval → awaiting-human` (D5 loại), mọi thay đổi lên nửa
  từ-khoá của `classifyIronLaw` (D6 loại).
- Backfill heading cho file thuộc item còn mở — không có cái nào (đã đo).
