# Hazard check — tsk-49i, bán kính toàn repo

Kiểm ngày 2026-08-15, trên cây `fgw/tsk-49i` sau lần sync thứ hai
(`305fefac`). Câu hỏi: có hazard nào của item này ảnh hưởng **toàn bộ**
repo/mọi phiên đang chạy, chứ không chỉ nhánh của nó.

Bối cảnh đo được: **267 worktree** đang tồn tại trên repo này
(`git worktree list | wc -l`), tất cả chia chung một `.git` và một
`.fgos/` sống ở main checkout.

---

## H1 — Merge `tsk-49i` vào `main` chỉ được chặn bằng chữ, không bằng máy

**Bán kính: toàn bộ 267 worktree. Đây là hazard lớn nhất.**

Item này viết lại đúng những module mà **mọi** phiên đang thực thi:
`bin/fgos.mjs`, `src/state/store.mjs`, `src/runner/session-identity.mjs`,
`src/runner/worktree.mjs`, `src/runner/merge.mjs`. Một lỗi ở đây không
hỏng một nhánh — nó hỏng khả năng chạy `fgos` của tất cả.

Cái chặn hiện có, đã tra tận nơi:

- `bin/fgos.mjs` có 7 chỗ gọi `isMainWorktree(repoRoot)` (`:3072`, `:3386`,
  `:4079`, `:4294`, `:5066`, `:5340`, `:5356`) + `promote-engine.mjs:54`.
  Chúng chặn **chạy verb từ worktree**, không chặn **merge cái gì vào
  main**.
- Iron Law gate (`bin/fgos.mjs:3494-3503`) gắn vào `source === 'runner'`,
  không gắn vào đích merge — nên nó chặn cả approve con lẫn approve cha,
  và `--acknowledge-iron-law` mở cả hai như nhau.

Tức là **không có guard máy nào phân biệt "approve con vào nhánh cha" với
"approve cha vào main"**. Ranh giới đó hiện chỉ nằm ở: (a) câu trong
prompt, (b) decision log của `tsk-49i`. Một agent hiểu sai một câu là
merge thẳng vào main với cờ acknowledge đã được cho phép sẵn.

**Khuyến nghị:** giữ nguyên luật, nhưng thêm một bước kiểm cơ học vào cuối
mỗi vòng — `git log --oneline fgw/tsk-49i..main` phải rỗng và `main` phải
đứng nguyên SHA — và coi việc `main` nhích lên là điều kiện dừng khẩn, chứ
không phải chuyện để báo cáo lúc cuối.

---

## H2 — `.githooks/pre-commit` phân giải tuyệt đối về MAIN checkout

**Bán kính: mọi commit của mọi phiên.**

`git config core.hooksPath` = `/home/vantt/projects/forgentX/.githooks`
— **đường dẫn tuyệt đối**, không phải tương đối. Hook import theo
`import.meta.url` (`.githooks/pre-commit:28-29`):

```
import { acquireMainCheckoutLock, … } from '../src/runner/main-checkout-lock.mjs';
import { resolveWriterIdentity } from '../src/runner/session-identity.mjs';
```

nên nó **luôn** nạp module của main checkout, bất kể commit phát ra từ
worktree nào.

**Tin tốt — gỡ bớt một lo ngại của plan.** Trong lúc con 1 xoá
`src/runner/session-identity.mjs` khỏi worktree, commit trong worktree
**vẫn chạy được**, vì hook đọc bản của main. Risk map hiện coi hook là rủi
ro *trong lúc* thi công; thực tế nó không phải.

**Tin xấu — rủi ro dồn vào đúng một khoảnh khắc.** Lúc `tsk-49i` land lên
main, việc dời module và việc sửa hook phải **nguyên tử trong cùng một
commit**. Nếu bị tách ra bởi một merge từng phần, một revert, hay một
cherry-pick, thì mọi phiên trong cả 267 worktree **mất khả năng commit**
cùng lúc, và chỉ gỡ được bằng `--no-verify`.

---

## H3 — Worktree chạy code cũ/dở ghi vào state sống. ĐÃ XẢY RA THẬT, HÔM NAY

**Bán kính: `.fgos/` sống — mọi phiên đọc chung.**

Commit mới nhất trên `main` lúc kiểm này:

```
e2e1653f chore: strip legacy models map re-added by a stale-code worktree run
```

10 phút trước thời điểm kiểm, một worktree chạy **code cũ** đã ghi lại
một `models` map hợp lệ-theo-schema-cũ vào `.fgos/config.json` của main;
phải dọn tay 5 dòng. Không phải giả thuyết — đây là lớp hazard này đang
hoạt động.

`tsk-49i` khuếch đại nó, vì:

- worktree không giữ bản `.fgos/` riêng (ADR0020), nên mọi verb đều phải
  `--dir /home/vantt/projects/forgentX`, tức **ghi vào store sống**;
- nhưng **code chạy là code trong worktree** — Node phân giải import theo
  vị trí `bin/fgos.mjs`, `--dir` chỉ đổi chỗ *dữ liệu*, không đổi chỗ
  *mã*;
- con 1 sửa đúng `store.mjs` (đường ghi) và `session-identity.mjs` (hàm
  đóng dấu writer lên **mọi** event).

Nghĩa là: chạy `fgos return`/`fgos move` từ worktree giữa chừng refactor =
lấy engine nửa vời ghi vào nhật ký sự kiện của cả hệ. `tsk-5tm` đã ghi
đúng cảnh báo này cho các con của nó
(`docs/history/task-dispatch-unification/plan.md:216-227`): mutation vào
MAIN **thấy ngay** với mọi phiên đang sống, và **rollback của item không
tự revert nó**.

**Khuyến nghị:** với con 1, chạy `return`/`approve` **từ main checkout**
(code ổn định) chứ không từ worktree, sau khi đã commit code. Prompt hiện
chỉ bắt buộc rời worktree trước `approve`; nên mở rộng sang `return`.

---

## H4 — Verify `npm test` đọc config sống của MAIN → có thể đỏ giả

**Bán kính: kết quả verify của item, và bất kỳ item nào khác chạy cùng lúc.**

`committedRunnerConfig()` trong `test/runner/dispatch.test.mjs:621-629`
đọc thẳng `.fgos/config.json` của **MAIN checkout**, không phải config
trong worktree đang chạy test — đã được `tsk-5tm` xác minh và ghi lại
(`docs/history/task-dispatch-unification/plan.md:216-227`).

Verify của `tsk-49i` và cả 2 con đều bắt đầu bằng `npm test` (142 file,
~50s). Trong 50 giây đó, một phiên khác sửa `.fgos/config.json` của main
là test có thể đỏ **vì lý do không liên quan gì tới refactor** — item bị
park `blocked` oan.

**Khuyến nghị:** verify đỏ ở đợt này phải soi `test/runner/dispatch.test.mjs`
trước khi kết luận là regression. Đây là nguồn flake đã biết, có tài liệu,
không phải suy đoán.

---

## H5 — Đụng footprint sống với `tsk-48w`

**Bán kính: hai item, không phải toàn repo.**

`fgos conflicts` báo 2 cặp; kiểm từng cái:

| Cặp | File chung | Thực tế |
|---|---|---|
| `tsk-38t-4` ↔ `tsk-49i-1` | `src/state/frontier.mjs` | **Báo động giả** — `tsk-38t-4` đã `status: done`, thay đổi của nó đã nằm trong main |
| `tsk-48w` ↔ `tsk-49i-1` | `src/setup/registrations.mjs` | **Thật** — `tsk-48w` `status: todo`, `stage: planning`, đã được claim (`branchHeadAtTake` có giá trị) |

`tsk-49i-1` phải sửa `registrations.mjs` vì `driftStatus` nhận thêm tham
số `trunk` bắt buộc và đây là 1 trong 2 caller thật. `tsk-48w` sẽ thêm một
check vào cùng file cho doctor registry. Ai merge sau ăn conflict — gỡ
được, nhưng nên biết trước.

---

## Xếp hạng

| | Hazard | Bán kính | Đã có trong plan? |
|---|---|---|---|
| 1 | H1 — không guard máy cho merge vào main | 267 worktree | Có luật, **không có kiểm cơ học** |
| 2 | H3 — worktree chạy code dở ghi state sống | `.fgos/` chung | **Chưa** |
| 3 | H2 — hook phân giải về main, phải nguyên tử | mọi commit | Có, nhưng **đặt sai thời điểm** |
| 4 | H4 — verify đỏ giả do config sống | verify | **Chưa** |
| 5 | H5 — đụng `registrations.mjs` với `tsk-48w` | 2 item | **Chưa** |

## Câu chưa trả lời được

- Phiên nào đang giữ `tsk-48w` và bao giờ nó chạm `registrations.mjs` —
  quyết định ai nên merge trước, nhưng phiên này không đọc được lịch của
  phiên khác.
- `fgos stale` liệt kê 4+ claim quá hạn (`tsk-64s` ~445h, `tsk-352` ~428h,
  `tsk-3w3` ~242h, `tsk-u8w` ~192h). Không cái nào đụng footprint của
  `tsk-49i`, nên không phải hazard của item này — nhưng là dấu hiệu vệ
  sinh của backlog, ngoài phạm vi lần kiểm này.
