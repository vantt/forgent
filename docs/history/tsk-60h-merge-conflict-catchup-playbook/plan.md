# plan.md — tsk-60h: playbook `catchup` cho block reason `merge-conflict`

Mode: **small** — 1 cờ trong bảng đếm của `fgos-routing` (*weak proof
around the area*: skill prose không có lệnh shell nào assert được hành vi
runtime, đúng giới hạn `docs/how-to/write-verify-for-a-skill-prose-change.md`
tự khai). Không cờ hard-gate nào: item **không** bỏ đi một validation —
`catchup` tự chạy verify thật và fail-closed (xung đột hay verify đỏ đều
giữ item nguyên `blocked`, `bin/fgos.mjs:3914-3942`, `:3947-3958`), nên
chỗ dừng-cần-người vẫn còn nguyên, chỉ lùi lại sau một lần thử máy tự
làm được. `tiny` sẽ không thật thà vì cờ weak-proof buộc verify phải có
đủ hai vế POSITIVE/NEGATIVE chứ không phải một ghi chú thẳng.

Item này **không có `CONTEXT.md` riêng** — discovery phán `clear` nên bỏ
qua `exploring`, không có vòng Socratic nào để khoá quyết định mới. Quyết
định nền đã khoá sẵn ở thiết kế cha, nhánh `fgw/tsk-51m`:
`docs/history/merge-conductor-throughput-and-human-release/DISCUSSION.md`
(§6 luồng, dòng 206 và 217-218) và `CONTEXT.md` (D1). Bằng chứng scout của
chính item này: `docs/history/tsk-60h-merge-conflict-catchup-playbook/RESEARCH.md`
vòng 1.

`impact-analysis: degraded` — `fgos tool query --capability
impact-analysis --status present` trả `gitnexus`/`present`, nhưng hook
của chính GitNexus báo index còn ở `79fead3` (stale so với HEAD). Không
load-bearing ở đây: item chỉ sửa prose Markdown, không đụng symbol nào để
có call graph mà tính blast radius.

## Tín hiệu đồ thị

`fgos graph --json` (2026-08-12): `componentCount` 343, `topUnblock` bị
**skip** hẳn (không tính), `criticalPath` không đi qua `tsk-60h`. Kết
luận thật thà: đồ thị **không cho tín hiệu thứ tự** cho item này. Thứ tự
hai file dưới đây rút từ chính nội dung, không phải từ metric.

## Approach

**Đường chọn**: thêm đúng một playbook cho reason `merge-conflict` vào
`merge-loop`, đặt **trước** bullet đếm-block, nhân bản đúng khuôn bullet
tự chẩn đoán `verify-fail-post-merge` đã có sẵn ngay trên nó
(`merge-loop/SKILL.md:73-113`) — cùng bốn phần: dấu hiệu nhận biết, bước
máy tự thử, ghi nhận "đã thử một lần", điều kiện dừng khi thử không tiến.
Nội dung bước-máy-tự-thử không tự chế: trỏ thẳng vào
`docs/how-to/recover-a-blocked-item-with-fgos-catchup-from-inside-its-own-worktree.md`,
how-to đã tồn tại mà chưa skill nào trỏ tới.

**Vì sao `catchup` là cửa đúng**: `bin/fgos.mjs:3814` đã nhận
`merge-conflict` trong `CATCHUP_REASONS` từ trước; `:3859` chạy trong
ephemeral worktree riêng nên không đụng cây chung; `:3881-3905` và
`:3960-3965` tự đi cạnh `blocked -> awaiting-approval` khi verify xanh.
Toàn bộ cơ chế đã sẵn — thiếu đúng một câu prose bảo skill dùng nó
(`rg -n "catchup" plugins/fgOS/skills` hôm nay trả về rỗng).

**Ranh giới tự xử / gọi người** — khoá bởi thiết kế cha, không mở lại ở
đây: `DISCUSSION.md:206` vẽ `C -->|xung đột| E2[escalate: conflict thật
sau khi playbook đã thử]`, `:217-218` viết "conflict thật sau khi playbook
`catchup` đã thử và thất bại". Playbook = **chạy `catchup`**. Agent tự gỡ
hunk xung đột bằng tay **ngoài phạm vi** item này, và trùng khớp với
`tsk-18a` D1 ("a genuine conflict needs a human's real content
resolution") cùng comment `bin/fgos.mjs:3931-3934`.

**Phương án đã loại**:
- *Cho `merge-next` cũng tự chạy `catchup`* — loại. `merge-loop` gọi
  `merge-next`; hai nơi cùng retry thì sổ "đã thử một lần" của
  `merge-loop` sai ngay. Giữ playbook ở đúng một chỗ (nơi có state của
  vòng lặp); `merge-next` chỉ đổi từ "a person needs to look" sang nêu
  đúng cửa `fgos catchup <id>` để một phiên single-shot tự đi tiếp được
  mà không phải hỏi ai.
- *Playbook hoá luôn nhánh `syncRoot`* (`merge-next/SKILL.md:95-104`,
  `merge-loop/SKILL.md:119-123`) — loại, ngoài phạm vi. Đó là drift của
  chính nhánh root, không phải block của item; và để nguyên vùng đó cũng
  giảm đúng chỗ chồng lấn văn bản với tsk-4xq.
- *Tự gỡ hunk rồi commit hộ* — loại bởi thiết kế cha (trên).
- *Sửa `catchup` cho nó tự hoà giải* — loại. Item này khai rõ khoảng
  trống là hành vi skill; `bin/fgos.mjs:3931-3934` cấm thẳng việc đó ở
  tầng code. Đụng vào `bin/fgos.mjs` còn bật Iron Law (`src/evolve/
  iron-law.mjs` `MODULE_RULES`) mà không đổi lấy gì.

## Risk map

| Thành phần | Mức | Cái gì chứng minh được |
|---|---|---|
| Playbook chạy hăng quá, giấu lỗi thật thành "đã tự xử" | trung bình | `catchup` fail-closed: `outcome: 'conflict'` và `outcome: 'verify-fail'` đều **không** gọi `moveWork`, item giữ nguyên `blocked` (`bin/fgos.mjs:3914-3942`, `:3947-3958`). Playbook chỉ chạy **một lần mỗi id mỗi lượt loop**, đúng luật tsk-3mv D3 mà bullet anh em đã dùng |
| Mất chỗ dừng cần người cho conflict thật | thấp | Sau một lần `catchup` trả `conflict`, bullet dừng vòng lặp và báo `conflictedFiles` — cùng hình dạng dừng mà bullet `verify-fail-post-merge` đã dùng |
| Iron Law vẫn là stop cần người | thấp | Không đụng bullet Iron Law (`merge-loop/SKILL.md:130-137`), không đụng `src/`/`bin/` |
| Chồng lấn văn bản với tsk-4xq | trung bình | Cùng vùng bullet bước 4 của `merge-loop/SKILL.md`. Reason rời nhau (tsk-4xq: `verify-timeout-post-merge`/`integration-drift`/`merge-failed-unclassified`), nhưng cùng file cùng section — bên merge sau phải merge target vào nhánh rồi verify lại, không vá tay |

## File đụng và thứ tự

1. `plugins/fgOS/skills/merge-loop/SKILL.md` — thêm bullet playbook
   `merge-conflict` vào bước 4, ngay **trước** bullet đếm-block hiện tại
   (`:114`); bỏ `merge-conflict` khỏi danh sách "never investigates" ở
   chính dòng đó; cập nhật bước 6 (Report on stop) để kể thêm lý do dừng
   mới. Đây là file mang cả vế POSITIVE lẫn vế NEGATIVE của verify.
2. `plugins/fgOS/skills/merge-next/SKILL.md` — bullet `:76-80`: thay
   "relay ... blocked (verify failure or merge conflict)" bằng câu nêu
   đúng cửa `fgos catchup <id>`. Không đụng `:95-104` (nhánh `syncRoot`).

## Ca cụ thể cần chứng minh

- **Đường thuận**: `catchup` trả `merged` hoặc `already-caught-up` ⇒ item
  về `awaiting-approval`, vòng lặp chạy tiếp, sổ "đã thử" được xoá đúng
  như bullet merge-thành-công đã làm.
- **Biên**: `catchup` trả `conflict` ⇒ dừng, báo `conflictedFiles`, không
  thử lần hai.
- **Biên**: `catchup` trả `verify-fail` ⇒ dừng, không được im lặng coi
  như đã xử.
- **Không được hồi quy**: bullet Iron Law giữ nguyên là stop cần người;
  bullet tự chẩn đoán `verify-fail-post-merge` giữ nguyên; ca D1 của
  thiết kế cha (root chưa gom đủ con) vẫn escalate.

## Giả định

- `merge-loop` là nơi duy nhất giữ state "đã thử một lần trong lượt chạy
  này" — đúng như bullet `verify-fail-post-merge` hiện có đang giả định.
  Chưa có test nào assert điều này (prose), nên nó là giả định, không
  phải chứng minh.
- Một item bị `approve` park `merge-conflict` luôn có nhánh `fgw/<id>`
  sống thật, nên `catchup` không rơi vào nhánh từ chối `:3840-3845`.
  Chưa chứng minh bằng test; `fgos-coding-validating` xác nhận.

## Verify

```
npm test && grep -q "fgos catchup <id>" plugins/fgOS/skills/merge-loop/SKILL.md && grep -q "catchup playbook already attempted" plugins/fgOS/skills/merge-loop/SKILL.md && grep -q "fgos catchup <id>" plugins/fgOS/skills/merge-next/SKILL.md && ! grep -qF "(`merge-conflict`," plugins/fgOS/skills/merge-loop/SKILL.md
```

Đúng khuôn `npm test && <POSITIVE> && <NEGATIVE>` của
`docs/how-to/write-verify-for-a-skill-prose-change.md`. Ba vế POSITIVE
ghim cụm đặc trưng đủ dài (bẫy #5), vế NEGATIVE chứng minh
`merge-conflict` đã rời khỏi danh sách "never investigates". Đã kiểm là
verify **đỏ thật hôm nay**: vế NEGATIVE hiện khớp 1 dòng, vế POSITIVE
hiện khớp 0 dòng — không phải verify tautology.

Vế chặn phạm vi `git diff` mà how-to gợi ý đã bị bỏ: hook cô lập worktree
của phiên này từ chối mọi lệnh có `git diff` nhúng trong chuỗi. Iron Law
(`src/evolve/iron-law.mjs` `MODULE_RULES` gác `src/runner/` và
`bin/fgos.mjs`) đã gánh đúng phần việc đó ở cửa merge.

## Outstanding questions

None

## Addendum (2026-08-13, tsk-5x4): this item's stored verify string is no longer literally reproducible

Post-hoc audit of the batch found that this item's own recorded `verify`
field (`fgos show tsk-60h`, the exact text quoted in the `## Verify`
section above) greps for the literal string `"catchup playbook already
attempted"` in `plugins/fgOS/skills/merge-loop/SKILL.md` — that exact
substring no longer exists in the file. `tsk-4xq`'s later rewrite of §4b's
shared rule generalized the wording to just `"playbook already attempted"`
(dropping the `catchup ` prefix, since the rule now applies to every
playbook in §4c, not only `catchup`'s own) — this file's own risk map
above (`## Risk map`) had already predicted this exact collision
("chồng lấn văn bản với tsk-4xq ... bên merge sau phải merge target vào
nhánh rồi verify lại"), but the re-verify it called for never happened.

The underlying behavior this item shipped is unaffected — `fgos catchup`
still exists, still handles `merge-conflict`, and the generalized wording
in §4b still covers the same rule this item's own POSITIVE clause meant
to pin. Only this item's own stored `verify` string, taken completely
literally, would now fail if re-run against the current file. Recorded
here so a later reader does not mistake that string for still being
exactly reproducible — this item's own delivered record is otherwise left
untouched (immutable historical record; not rewritten).
