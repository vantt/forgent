# RESEARCH — tsk-60h (merge-conflict catchup playbook)

Accumulating record. Newest round appended at the end; never overwrite an
earlier round.

## Round 1 — 2026-08-12 (stage `discovery`)

### Câu hỏi đã đặt

1. Chỗ nào trong skill prose hôm nay ép dừng-hỏi-người khi gặp
   `merge-conflict`?
2. Contract thật của verb `fgos catchup` cho reason `merge-conflict` là gì?
3. Đã có khuôn playbook nào để nhân bản chưa, và verify cho một thay đổi
   skill-prose phải trông thế nào?
4. Ranh giới phạm vi với item anh em tsk-4xq (cùng file) nằm ở đâu?

### Đã kiểm

Repo-first cho cả bốn điểm (`rg` trên `plugins/fgOS/skills`,
`bin/fgos.mjs`, `docs/how-to`, `docs/history`), đọc trực tiếp từng file
trích dẫn dưới đây. Một nhánh gather out-of-process (`agy`, Gemini 3.5
Flash) được dispatch cho điểm 2 nhưng trả về đúng một dòng mở đầu, không
có report — rơi về đọc code trực tiếp theo đúng đường fallback của
`fgos-researching`. Không có điểm nào phải tra ngoài repo.

### Tìm được

**(1) Hai chỗ ép dừng-hỏi-người, cả hai đều là prose, không phải code.**

- `plugins/fgOS/skills/merge-loop/SKILL.md:114-137` — bullet "blocked
  pick". `merge-conflict` bị liệt kê thẳng vào nhóm *"any other
  `approve`-reported block this skill never investigates"*, đi thẳng
  xuống đếm-block; cùng id block hai lượt liên tiếp thì "stop the loop.
  Report the id and the block reason(s) in a plain chat message". Không
  có một chữ `catchup` nào trong cả file (`rg -n "catchup"
  plugins/fgOS/skills` trả về rỗng).
- `plugins/fgOS/skills/merge-next/SKILL.md:95-104` — nhánh `syncRoot`:
  với `merge-conflict`/`fgos-write-rejected`/`verify-fail`, "relay the
  `syncRoot` detail and that **a person needs to look** at the root
  branch's drift before retrying". Và `:76-80` — chỉ "relay whether it
  reached `done` or was parked `blocked` (verify failure or merge
  conflict)", không có bước tự xử nào.

`rg -n "merge-conflict|merge conflict"` trên toàn bộ
`plugins/fgOS/skills` + `.claude/skills` chỉ khớp đúng 5 dòng, tất cả
nằm trong hai file trên — footprint thật của item này đúng bằng hai file
đó, không rải nơi khác.

**(2) Contract thật của `catchup`** — `bin/fgos.mjs:3783-3966`:

| Điểm | Hành vi | Trích |
|---|---|---|
| Precondition status | `status` phải là `blocked`, không thì `StoreError('precondition')` | `:3792-3794` |
| Precondition reason | reason phải thuộc `CATCHUP_REASONS` (6 giá trị, gồm `merge-conflict`) | `:3814-3820` |
| Precondition branch | `fgw/<id>` phải tồn tại thật, không thì từ chối thay vì tạo branch ma | `:3840-3845` |
| Target | leaf → `fgw/<rootId>`; root/standalone → `main` (cùng `resolveRoot` mà `approve` dùng) | `:3851-3852` |
| Cô lập | chạy trong `withMergeEphemeralWorktree`, `repoRoot` lấy từ `path.dirname(dir)` chứ không phải `process.cwd()` — gọi được từ trong chính worktree của item | `:3822-3834`, `:3859` |
| Đã caught-up sẵn | bỏ qua merge/commit, vẫn chạy verify thật; xanh → `blocked → awaiting-approval`, `outcome: 'already-caught-up'`; đỏ → giữ `blocked`, `outcome: 'verify-fail'` | `:3869-3905` |
| Merge sạch | verify TRƯỚC commit; xanh → commit + `blocked → awaiting-approval`, `outcome: 'merged'`; đỏ → `git merge --abort`, giữ `blocked`, `outcome: 'verify-fail'` (kèm `timedOut`) | `:3947-3965` |
| **Xung đột thật** | `git merge --abort`, item **giữ nguyên `blocked`**, trả `outcome: 'conflict'` + `conflictedFiles[]` | `:3914-3942` |

Comment tại `:3931-3934` nói thẳng: *"No automated conflict RESOLUTION
per this cell's prohibitions — only detection + clean reporting; the item
stays blocked (unchanged) for a human to resolve manually"*. Nghĩa là
`catchup` **không** tự gỡ hunk xung đột — nó chỉ thử merge lại, verify
lại, và land nếu được.

Verb **không** gọi được chủ động: item phải đang `blocked` (`:3792`).

**(3) Khuôn playbook + verify.**

- Khuôn để nhân bản có sẵn ngay trong cùng file:
  `merge-loop/SKILL.md:73-113` — bullet tự chẩn đoán cho
  `verify-fail-post-merge`, đủ 4 phần (dấu hiệu nhận biết, bước máy tự
  thử, ghi nhận "đã thử một lần", điều kiện dừng khi thử không tiến).
- Nội dung bước-máy-tự-thử cũng đã có sẵn dưới dạng how-to, chỉ chưa
  skill nào trỏ tới:
  `docs/how-to/recover-a-blocked-item-with-fgos-catchup-from-inside-its-own-worktree.md`
  (`catchup` là "the correct recovery verb", chạy được từ bất kỳ thư mục
  nào) và
  `docs/how-to/recover-a-blocked-merge-conflict-when-catchup-cannot-reconcile-it.md`
  (ca `catchup` không hoà giải được).
- Verify: `docs/how-to/write-verify-for-a-skill-prose-change.md` — bắt
  buộc `npm test && <POSITIVE> && <NEGATIVE>`, ghim cụm đặc trưng đủ dài
  (bẫy #5), thêm vế chặn phạm vi `! git diff --name-only main...HEAD |
  grep -q '^src/'`.

**(4) Ranh giới với tsk-4xq** —
`docs/history/merge-conductor-throughput-and-human-release/DISCUSSION.md`
(nhánh `fgw/tsk-51m`) dòng 64 và 464: tsk-4xq giữ ba reason
`verify-timeout-post-merge` / `integration-drift` /
`merge-failed-unclassified` cộng việc thu hẹp stop rule "kẹt hai lượt";
tsk-60h là "lát `merge-conflict` của cùng §H", "làm trước hoặc cùng lúc,
không trùng phạm vi". Reason rời nhau thật, nhưng cả hai cùng viết vào
đúng vùng bullet bước 4 của `merge-loop/SKILL.md` — **chồng lấn văn bản
có thật ở mức section**, dù không chồng lấn phạm vi logic.

**(5) Điểm suýt thành gray area, đã được bằng chứng đóng lại.**

Sau `tsk-18a`
(`docs/history/tsk-18a-merge-conflict-misclassification/CONTEXT.md` D1),
`merge-conflict` không còn là thùng rác của mọi lỗi merge: lỗi git không
tạo `MERGE_HEAD` đã tách ra thành `merge-failed-unclassified`. Nên
`merge-conflict` hôm nay nghĩa là **xung đột văn bản thật**, và D1 ghi
rõ *"a genuine conflict needs a human's real content resolution"*.

Câu hỏi kéo theo: playbook của item này có phải tự gỡ hunk không? Thiết
kế cha đã khoá sẵn, không cần hỏi ai — `DISCUSSION.md:206` vẽ thẳng
`C -->|xung đột| E2[escalate: conflict thật sau khi playbook đã thử]`, và
`:217-218` viết *"conflict thật sau khi playbook `catchup` đã thử và
thất bại"*. Playbook = chạy `catchup`. Gỡ hunk bằng tay vẫn là việc của
người, nằm ngoài phạm vi item này.

### Còn mở

Không còn. Cả bốn điểm đều có bằng chứng trực tiếp trong repo.
