# internal-design report — tại sao worktree commit bị block bởi main-checkout.lock (tsk-sir)

Date: 2026-08-05. Scope: nội bộ repo forgentX, không cần web research — trả lời
bằng đọc code + docs trực tiếp.

## Câu hỏi

1. Tại sao `.githooks/pre-commit` chặn commit trong worktree bằng lock của main checkout?
2. Đây có phải thiết kế sai không?
3. Có task nào sẵn để cô lập event log per-worktree không (tsk-45y)?

## 1. Tại sao — cơ chế thật (verify bằng lệnh thật, không đoán)

```
$ git config --get core.hooksPath          # chạy từ main checkout
/home/vantt/projects/forgentX/.githooks

$ cd .claude/worktrees/tsk-1p9-rF2BQk && git config --get core.hooksPath
/home/vantt/projects/forgentX/.githooks    # y hệt, dù cwd là worktree
```

`installGitHooks` (`src/setup/git-hooks.mjs:48`) ghi `.githooks` (relative)
vào `core.hooksPath`. Key này nằm trong `.git/config` DÙNG CHUNG cho mọi
worktree (không phải per-worktree config). Khi git resolve relative
hooksPath, nó resolve theo top-level của **main working tree** — không phải
theo cwd của worktree gọi lệnh — nên mọi worktree, khi query, đều ra CÙNG
một đường dẫn tuyệt đối trỏ về main checkout's `.githooks/pre-commit`. Đây
là MỘT file vật lý duy nhất, không phải bản sao riêng mỗi worktree.

Trong file đó (`.githooks/pre-commit:47`):
```js
const repoRoot = path.resolve(__dirname, '..');   // __dirname luôn = main checkout
...
const result = acquireMainCheckoutLock(fgosDir, { identity: id, ttlMs });
if (result.status === HELD) refuse(...);           // chặn vô điều kiện
```
`__dirname` = vị trí thật của file trên đĩa = main checkout, luôn luôn,
bất kể worktree nào gọi `git commit`. Nên lock check luôn là lock của main,
kể cả khi commit đang landed vào branch `fgw/tsk-1p9` trong worktree riêng.

Lý do hook tồn tại (decision `0021-wire-main-checkout-hook-qua-doctor-
setup.md`): bug thật `tsk-3w8` — 1 session khác `git commit` tay lên
**main** trong lúc `approve`'s `mergeRunnerItem` cũng đang `git commit
--no-edit` lên **main** → `.git/index` main bị clobber. Fix chọn chặn ở
tầng git (mọi `git commit`, mọi actor) vì thủ phạm không đi qua verb nào
của fgOS để app-level lock trong `approve` chặn được.

## 2. Có phải thiết kế sai

**Có — nhiều khả năng là gap, không phải quyết định cân nhắc.** 3 bằng
chứng:

- Decision `0021` chỉ bàn về race trên **main checkout's `.git/index`**
  (`git commit` khác lên main cùng lúc với approve). Không hề nhắc tới
  worktree ở đâu cả — tác giả decision không xét case "worktree commit"
  khi viết rule "chặn mọi git commit".
- Mỗi linked worktree có `.git/index` **riêng** (nằm trong
  `.git/worktrees/<name>/index`), không đụng main's index. Nên hazard thật
  (main's index bị 2 writer race) **không áp dụng cơ học** cho 1 commit
  trong worktree — chặn nó là collateral, không phải bảo vệ đúng cái mà
  decision 0021 nêu ra.
- Ngay trong CÙNG file hook, guard thứ 2
  (`currentFgwBranchIfMainCheckout`) biết phân biệt worktree vs main
  (so `git-dir` với `git-common-dir`) và **chủ động bỏ qua worktree**. Guard
  thứ nhất (`acquireMainCheckoutLock`) — ngay phía trên nó, cùng file, cùng
  tác giả — không có check tương tự. Bất đối xứng này trong cùng 1 file là
  dấu hiệu mạnh của thiếu sót, không phải chủ ý mở rộng phạm vi.

## 3. tsk-45y có phải task giải đúng cái này không — KHÔNG

`tsk-45y` (đã đóng, `wontfix`, resolved-by-context,
`docs/history/tsk-45y-worktree-fgos-lock-decouple-stale-premise/CONTEXT.md`)
đề xuất cô lập `.fgos` per-worktree. Bị đóng vì premise sai: worktree
**không có `.fgos` ghi được** để mà cô lập — dispatch worktree bị xóa
`.fgos` ngay sau checkout (ADR0020), session worktree (`pick`) chỉ
**symlink** `.fgos` về store chung, không copy. Nên mọi state-write từ bất
kỳ worktree nào vốn đã đi thẳng vào 1 store chung — không có gì để cô lập
ở lớp đó.

Nhưng đó là lớp khác: **fgOS event-log writes** (`events.jsonl`), qua
`events.lock` — tsk-45y's D1 tự nói rõ: "`main-checkout.lock`... only
guards two short windows — claim + merge/verify/commit — both run from
the real main checkout... has never guarded ordinary state writes."
Đúng, cho state writes. Nhưng **git raw commit** (source code, không phải
fgos state) qua `.githooks/pre-commit` cũng acquire CHÍNH lock đó
(`acquireMainCheckoutLock`) — và tsk-45y's scout evidence
(`rg -- "main-checkout-lock" src bin test docs`) **không hề grep
`.githooks/`** — chính là nơi duy nhất mà lock này áp lên worktree commit.
Nên D1's kết luận "no hit expands the lock into a per-worktree write path"
đúng cho phạm vi nó tìm (src/bin/test/docs), nhưng **bỏ sót** đúng chỗ có
hit thật.

**Kết luận:** tsk-45y không giải đúng bài của tsk-sir — khác lớp
(git-commit hook vs fgos state write), và bằng chứng đóng của tsk-45y có
blind spot thật (thiếu `.githooks` trong scout). tsk-sir đứng độc lập,
chưa ai xử lý.

## Nguồn

- `.githooks/pre-commit` (đọc trực tiếp)
- `src/setup/git-hooks.mjs:48` (`installGitHooks`)
- `docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md`
- `docs/history/tsk-45y-worktree-fgos-lock-decouple-stale-premise/CONTEXT.md`
- `docs/explanation/session-isolation-and-concurrency.md`
- `docs/how-to/clear-a-stuck-main-checkout-lock.md`
- Lệnh thật: `git config --get core.hooksPath` chạy từ main checkout và từ
  `.claude/worktrees/tsk-1p9-rF2BQk` (2026-08-05, session này)

## Việc chưa rõ

- Có bug thật nào từng xảy ra do worktree commit bị block kiểu này chưa,
  hay tsk-sir là lần đầu quan sát? (chưa grep `.fgos/events.jsonl` cho case
  cụ thể này)
- Fix hợp lý nhất là gì: thêm cùng 1 check `gitDir !== gitCommonDir` vào
  guard `acquireMainCheckoutLock` (mirror guard 2), hay giữ nguyên vì có
  lý do chưa lộ ra (ví dụ: worktree commit vẫn có thể tình cờ trùng thời
  điểm với `approve`'s commit lên main theo cách khác)? Không phải việc
  của report này quyết — để `fgos-coding-exploring` cho tsk-sir tự khóa.
