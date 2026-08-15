# Prompt: chạy hết tasks của tsk-49i, chỉ merge về nhánh cha

Dán nguyên khối dưới đây vào một phiên Claude Code mới, mở tại
`/home/vantt/projects/forgentX`.

---

Bạn đang chạy 2 hạng mục con đã được lên kế hoạch đầy đủ của item
`tsk-49i` trong repo fgOS tại `/home/vantt/projects/forgentX`, rồi review
lại toàn bộ nhánh cha và sửa bug tìm được. Tất cả phải dừng ở **nhánh
cha**, không bao giờ chạm `main`.

## Đọc trước khi làm bất cứ gì

- `docs/history/state-runner-merge-boundary/CONTEXT.md` — 5 quyết định đã
  khoá (D1-D5). Không mở lại, không diễn giải khác; chỉ trích D-ID.
- `docs/history/state-runner-merge-boundary/plan.md` — thiết kế, risk map,
  assumption, và spec của 2 con.
- `docs/history/state-runner-merge-boundary/RESEARCH.md` — bằng chứng
  `file:line` cho từng danh sách import-site. §A1 là danh sách file phải
  sửa; đừng tự grep lại từ đầu, nhưng **có quyền kiểm chứng lại** trước
  khi sửa. **Đọc luôn "Vòng 2" và "Vòng 3"** ở cuối file: nhánh đã sync
  `main` hai lần (`ba25a590`, rồi `305fefac` sau đợt `tsk-5tm`) và toàn bộ
  anchor của §A1 đã được kiểm lại — F1 là cạnh import thứ 5 mới phát sinh,
  F3/G3 là bảng toạ độ đã lệch, F4 là 2 claim của §A1 nay đã sai, F5 là 2
  tham chiếu §A1 bỏ sót. Chỗ nào §A1 mâu thuẫn với vòng sau thì **vòng sau
  thắng**.
- `plans/reports/from-verify-to-execution-260815-1309-tsk-49i-repo-wide-hazard-check-report.md`
  — 5 hazard bán kính toàn repo và cách né từng cái. Mục Luật cứng và vòng
  làm việc dưới đây là bản rút gọn của nó; đọc bản đầy đủ nếu gặp tình
  huống lạ.
- `docs/history/state-runner-merge-boundary/DISCUSSION.md` §6 — bản tổng
  hợp thiết kế đầy đủ.

## Hai item cần làm, đúng thứ tự

1. `tsk-49i-1` (risk heavy) — cắt **5** cạnh import `state/`↔`runner/`, gộp
   3 bản copy-paste Iron Law vào `src/runner/iron-law-gate.mjs`, dời
   `isMainWorktree`+`detectTrunk` sang `runner/worktree.mjs`, dời
   `session-identity.mjs` sang `src/util/` **không để re-export shim**,
   dời `normalizePath` sang `src/util/normalize-path.mjs`, migrate 6 file
   ngoài `src/`+`bin/`, và bump version trong
   `plugins/fgOS/.claude-plugin/plugin.json`.

   Cạnh thứ 5 (`state/graph-metrics.mjs:18` → `runner/frozen-judge.mjs`,
   `normalizePath`) **không có trong bản plan đầu** — `main` thêm vào ở
   commit `ac1e30f1` sau khi plan viết xong. Nó không phải tuỳ chọn: clause
   `! grep -rqF ../runner/ src/state/` trong verify sẽ đỏ nếu bỏ sót.
2. `tsk-49i-2` (risk standard, `deps: ["tsk-49i-1"]`) — tách tầng use-case
   7 verb vào `src/verbs/merge/`, tạo `src/report/item-trace.mjs`, dời
   `performCatchUp` về `runner/merge.mjs` và `ensureBranchPushed` về
   `runner/worktree.mjs`.

Engine đã chặn thứ tự bằng `deps`; đừng cố làm con 2 trước.

**Một cảnh báo về bản ghi của `tsk-49i-1` trong engine.** `title`,
`verify`, `footprint`, `description` đã được cập nhật cho khớp 5 cạnh.
Nhưng trường **`action` thì KHÔNG** — `fgos edit` không patch được trường
đó (`bin/fgos.mjs:1730-1735` liệt kê đúng các field nhận patch), nên
`action` vẫn là bản cũ nói "4 cạnh" và không nhắc `normalizePath`. Khi hai
trường đá nhau, **`description` và `plan.md` thắng `action`**.

## Luật cứng (vi phạm là hỏng state thật)

- **KHÔNG BAO GIỜ chạy `fgos approve tsk-49i`.** Approve trên item gốc
  merge vào `main`. Chỉ approve 2 con (và các item bug sau này) — approve
  một leaf sẽ merge vào `fgw/tsk-49i`, đúng cái ta muốn.

  Biết rõ: **không có guard máy nào** phân biệt hai việc này. Cả 8 chỗ gọi
  `isMainWorktree` trong repo chỉ chặn *chạy verb từ worktree*, không chặn
  *merge cái gì vào main*; Iron Law gate gắn vào `source === 'runner'` chứ
  không gắn vào đích merge, nên `--acknowledge-iron-law` mở cả hai đường y
  như nhau. Ranh giới này chỉ tồn tại trong đầu bạn.

- **Ghi lại SHA của `main` TRƯỚC khi bắt đầu**, rồi kiểm lại sau **mỗi**
  lần approve:

  ```
  git rev-parse main
  ```

  `main` nhích lên dù chỉ một commit do việc bạn làm = **dừng khẩn, báo
  người ngay**, không tự sửa tiếp. Repo này đang có ~267 worktree dùng
  chung `bin/fgos.mjs`, `store.mjs`, `session-identity.mjs` — đúng những
  file item này viết lại. Sai ở đây không hỏng một nhánh, nó hỏng khả năng
  chạy `fgos` của tất cả. (Nếu `main` nhích do phiên khác merge việc khác
  thì bình thường — phân biệt bằng nội dung commit, không bằng việc SHA có
  đổi hay không.)
- Mọi lệnh `fgos` phải có `--dir /home/vantt/projects/forgentX`. Worktree
  không mang `.fgos/` theo thiết kế; thiếu `--dir` là verb từ chối (exit 4).
- **Không bao giờ `git add -A` / `git add .` trong worktree** — worktree
  không có bản làm việc của `.fgos/`, nên `-A` stage nhầm việc xoá cả kho
  sự kiện. Luôn `git add <đường dẫn cụ thể>`.
- `fgos approve` **chỉ chạy được từ main checkout** (guard
  `isMainWorktree`). Rời worktree trước khi approve — và trước khi
  `return` nữa, xem vòng làm việc bên dưới.
- **Không cần dừng phiên nào khác đang chạy trên repo.** 2 con merge vào
  `fgw/tsk-49i`, không vào `main`, nên không phiên nào thấy code đã sửa
  cho tới khi `tsk-49i` land lên main — việc đó nằm ngoài prompt này.
  Một chỗ phải sắp lịch, không phải dừng: `tsk-48w` (đang `todo`/
  `planning`, đã claim) cũng sửa `src/setup/registrations.mjs` như con 1.
  Ai merge vào main sau sẽ ăn conflict ở file đó — gỡ được, nhưng ghi vào
  báo cáo cuối để người biết mà xếp thứ tự.
- `.githooks/pre-commit` **an toàn suốt lúc thi công**: `core.hooksPath`
  trỏ tuyệt đối về main checkout và hook import theo `import.meta.url`,
  nên nó luôn nạp module của main, kể cả khi worktree đã xoá
  `src/runner/session-identity.mjs`. Đừng hoảng nếu thấy file biến mất mà
  commit vẫn chạy — đúng như thiết kế. Rủi ro thật của hook chỉ xuất hiện
  lúc land lên main, và phải nguyên tử cùng một commit với việc dời
  module.
- Không sửa `docs/history/state-runner-merge-boundary/*.md` để làm verify
  dễ hơn. Verify của mỗi item đã được kiểm chứng là fail trên trạng thái
  hiện tại; nếu nó fail sau khi bạn code xong thì là code chưa đúng.

## Vòng làm việc cho MỖI item (lặp y hệt)

```
node bin/fgos.mjs pick <id> --dir /home/vantt/projects/forgentX
```
→ EnterWorktree vào `data.worktree.path` mà lệnh trả về.

Trong worktree: implement theo skill `fgos-coding-implement`. Một commit
cho mỗi item, message theo conventional commit, không nhắc AI.

Commit xong code trong worktree, **rồi ExitWorktree với `action: "keep"`
để về main checkout TRƯỚC khi return** — đừng return từ trong worktree:

```
node bin/fgos.mjs return <id> --dir /home/vantt/projects/forgentX
```

Lý do (khác với `approve`, chỗ này **không** có guard nào chặn bạn, phải
tự giữ): `--dir` chỉ đổi chỗ **dữ liệu**, không đổi chỗ **mã** — Node phân
giải import theo vị trí `bin/fgos.mjs` đang chạy. Return từ worktree =
lấy `store.mjs` và `resolveWriterIdentity` **đang sửa dở** để ghi vào nhật
ký sự kiện sống mà mọi phiên khác đọc chung. Lớp lỗi này vừa xảy ra thật
trên repo (`e2e1653f chore: strip legacy models map re-added by a
stale-code worktree run` — phải dọn tay), và `tsk-5tm` đã ghi lại luật
tương tự cho các con của nó
(`docs/history/task-dispatch-unification/plan.md:216-227`): mutation vào
MAIN thấy ngay với mọi phiên đang sống, và rollback item **không** tự
revert nó.

Verify chạy thật ở bước này. Đỏ thì sửa, đừng nới verify — **trừ đúng một
ngoại lệ đã biết**: nếu chỗ đỏ nằm trong `test/runner/dispatch.test.mjs`,
soi nó trước khi kết luận là regression. `committedRunnerConfig()`
(`:621-629`) đọc thẳng `.fgos/config.json` của **MAIN checkout**, không
phải config trong worktree — một phiên khác sửa config trong 50 giây
`npm test` chạy là đủ làm đỏ vì lý do không liên quan gì tới refactor.
Đây là nguồn flake có tài liệu, không phải cớ để bỏ qua verify đỏ ở chỗ
khác.

```
node bin/fgos.mjs approve <id> --acknowledge-iron-law --dir /home/vantt/projects/forgentX
```
Lệnh này merge nhánh của con vào `fgw/tsk-49i`. Cờ
`--acknowledge-iron-law` chỉ được dùng sau khi đã commit bằng chứng —
xem mục Iron Law bên dưới.

## Iron Law sẽ chặn approve — đã được người cho phép trước, CÓ ĐIỀU KIỆN

Cả 2 con và mọi item bug đều sửa `src/runner/**`, `bin/fgos.mjs`,
`src/state/store.mjs` — đều nằm trong `MODULE_RULES` của
`src/evolve/iron-law.mjs`, và `src/evolve/iron-law.mjs:93`
`required = matchedModules.length > 0 || matchedFlags.length > 0`. Gate
gắn vào `source === 'runner'` chứ không gắn vào đích merge
(`bin/fgos.mjs:3494-3503`, và gate thứ hai `:4100-4101`), nên `approve`
**sẽ từ chối kể cả khi merge vào nhánh cha**.

**Người dùng đã acknowledge trước cho trường hợp này** — đã ghi vào
decision log của `tsk-49i` (tra bằng `fgos show tsk-49i`). Phạm vi cho
phép, không được nới rộng:

- ✅ Được tự chạy `approve <con> --acknowledge-iron-law` khi con merge vào
  `fgw/tsk-49i`.
- ❌ **KHÔNG** được acknowledge để đưa `tsk-49i` vào `main`. Việc đó cần
  một quyết định mới của người, ngoài phạm vi prompt này.

**Điều kiện bắt buộc trước MỖI lần acknowledge** (thiếu là vi phạm uỷ
quyền, không phải thiếu sót nhỏ):

1. Ghi bằng chứng failing-before / passing-after vào
   `docs/history/state-runner-merge-boundary/iron-law-evidence.md` — tích
   luỹ theo item, không đè: lệnh đã chạy, output thật **trước** khi sửa,
   output thật **sau** khi sửa.
2. Commit file đó vào nhánh của item, **trước** khi chạy approve.
3. Trong báo cáo cuối, liệt kê từng lần đã acknowledge và trỏ tới đúng
   mục bằng chứng tương ứng.

Nếu chưa có bằng chứng thật (ví dụ không dựng được trạng thái "trước khi
sửa" để chạy), thì **dừng và hỏi người**, đừng acknowledge suông.

## Sau khi CẢ HAI con đã merge vào `fgw/tsk-49i`

Chạy một agent review, model `opus`, đọc toàn bộ diff của nhánh cha:

- Phạm vi: `git diff main...fgw/tsk-49i`
- Agent chỉ báo cáo, **không sửa code, không đụng `.fgos/`**.
- Yêu cầu agent soi đúng các rủi ro đã biết trong `plan.md`:
  - payload `fgos.v1` của 7 verb có bị đổi shape ở nhánh return nào không
    (test chỉ assert theo field, không deepEqual toàn payload — một field
    không ai assert có thể đổi mà suite vẫn xanh);
  - `merge next` còn forward đủ option xuống `approve`/`sync-root` không;
  - thứ tự acquire lock (`withMergeTargetSlot`, main-checkout lock) có bị
    đổi không;
  - 6 outcome dispatch của `approve` có rơi mất nhánh nào không;
  - `.githooks/pre-commit` và `plugins/fgOS/skills/terminal/rename.sh` đã
    trỏ đúng đường dẫn mới chưa;
  - 2 tham chiếu `session-identity` mà vòng nghiên cứu đầu bỏ sót
    (`RESEARCH.md` Vòng 2 §F5): `plugins/fgOS/skills/_shared/
    capacity-dispatch-fallback.md:176` và key đường dẫn file test trong
    `scripts/check-decision-codes.baseline.json:214`;
  - `grep -rn "runner/" src/state/` phải **không còn cạnh import nào** —
    cả 5, không phải 4;
  - row manifest của mọi file mới có đúng tầng không (use-case=1 import
    được infra=2/domain=3; `iron-law-gate.mjs` buộc phải ≤ rank 2;
    `src/util/normalize-path.mjs` `kernel`=4 hợp lệ vì mọi importer ≤ 3).
- Bắt agent trích `file:line` cho từng phát hiện, và nói rõ cái nào là bug
  thật, cái nào chỉ là ý kiến phong cách.

## Nếu review tìm ra bug thật

Với mỗi bug (một item một bug, đừng gộp):

```
node bin/fgos.mjs add --title "<mô tả ngắn>" --kind bug --risk <light|standard|heavy> \
  --verify "<lệnh thật, chạy được, fail trước khi sửa>" \
  --description "<mô tả đầy đủ, trích file:line từ review>" \
  --parent tsk-49i --dir /home/vantt/projects/forgentX
```

Item tạo kiểu này vào thẳng stage `executing` (thiếu `stage` đọc là
`executing`), nên chạy được ngay bằng đúng vòng pick → implement → return →
approve ở trên. Vì `--parent tsk-49i` nên approve nó cũng merge vào
`fgw/tsk-49i`, không phải `main`.

Trước khi gắn verify cho item bug: chạy thử verify trên trạng thái chưa
sửa, xác nhận exit khác 0. Verify pass sẵn là verify vô nghĩa.

Sửa xong hết thì chạy lại agent review một lượt nữa trên nhánh cha. Lặp
cho tới khi review sạch, hoặc chỉ còn ý kiến phong cách.

## Điều kiện dừng

Dừng khi: cả 2 con + mọi item bug đã merge vào `fgw/tsk-49i`, review cuối
sạch, và `main` **chưa bị chạm bởi việc bạn làm** (so với SHA đã ghi ở
mục Luật cứng). Kiểm chứng cuối:

```
git log --oneline main..fgw/tsk-49i
git log --oneline fgw/tsk-49i..main
node bin/fgos.mjs rollup tsk-49i --dir /home/vantt/projects/forgentX
```

Đừng approve `tsk-49i`, đừng merge gì vào `main`, đừng `git push`.

## Báo cáo cuối

- Mỗi item: id, đã merge vào cha chưa, verify chạy ra sao.
- Review: đã chạy mấy lượt, tìm ra mấy bug thật, mỗi bug thành item nào.
- Chỗ nào phải dừng hỏi người (Iron Law) và người đã trả lời gì.
- Việc gì còn dang dở, và vì sao.
