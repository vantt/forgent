# main-checkout-lock-worktree-commit-scope — DISCUSSION

## 1. Trạng thái hiện tại

Distilled từ 1 report đã viết sẵn
(`plans/reports/internal-design-260805-1327-tsk-sir-worktree-commit-lock-scope-report.md`,
2026-08-05), không phải hội thoại sống. Report đã trả lời cả 3 câu hỏi gốc
của `tsk-sir` bằng đọc code + verify lệnh thật, và tự nhận diện 2 câu hỏi
còn mở (§3 dưới). Thiết kế (§6) đã đủ cụ thể để build — 1 mảnh việc duy
nhất, không tách con.

**Cập nhật (fgos-coding-exploring re-scout, cùng ngày):** D1's giải thích cơ chế
gốc (relative path resolve về main working tree) SAI — kiểm tra lại bằng
1 thực nghiệm cô lập cho thấy hooksPath relative thật ra resolve theo
worktree's own top-level, không phải main's. Cơ chế đúng: hooksPath trên
checkout thật này đang là 1 đường TUYỆT ĐỐI (không phải relative
`.githooks` mà code ghi), verify bằng `git config --get --show-origin`.
Đã ghi D7 (supersede D1) + D8 (phát hiện phụ: `fgos doctor` báo sai
"not wired" trên chính checkout này dù hook rõ ràng đang chặn — bug khác,
không thuộc scope tsk-sir). Fix đề xuất D4 KHÔNG đổi — nó nhắm vào hành vi
của hook một khi đã chạy, không phụ thuộc cơ chế nào đưa nó tới đó. Bước
kế: `fgos-coding-exploring` tiếp tục cho `tsk-sir`.

## 2. Mục tiêu & đề bài

`tsk-sir` bắt nguồn từ 1 lần commit thật trong worktree `fgw/tsk-1p9` bị
`.githooks/pre-commit` từ chối vì lock của main checkout đang bị 1 session
khác giữ — dù commit đó không đụng gì tới main. Mục tiêu của item này
không phải "sửa cho hết bị block" một cách mù quáng, mà trước hết là xác
định: cơ chế nào khiến 1 lock của main checkout áp lên commit trong
worktree, việc đó có phải chủ ý thiết kế hay là gap, và nếu là gap thì fix
tối thiểu, đúng chỗ là gì — mà không đụng tới các call site khác đang dùng
chung primitive `acquireMainCheckoutLock` (claim-port.mjs, merge.mjs) và
không mở rộng scope sang việc khác (vd: cô lập `.fgos` per-worktree, đã có
`tsk-45y` bàn và đóng riêng).

## 3. Vấn đề rõ / chưa rõ

| # | Vấn đề | Trạng thái | Ghi chú |
|---|--------|-----------|---------|
| 1 | Vì sao worktree commit resolve về lock của main checkout | Rõ (đã sửa, xem D7) | `core.hooksPath` trên checkout thật này là 1 đường TUYỆT ĐỐI trỏ về main checkout's `.githooks` (verify: `git config --get --show-origin`), KHÔNG phải relative `.githooks` như code `installGitHooks` ghi. Giả thuyết ban đầu ("relative resolve theo main working tree") đã bị phủ nhận bằng thực nghiệm cô lập — relative hooksPath thật ra resolve theo worktree's own top-level, hook không chạy từ worktree trong case đó. Vì giá trị thật là tuyệt đối, mọi worktree đều trỏ về đúng 1 file vật lý ở main — kết quả quan sát được (hook luôn check lock main) không đổi, chỉ cơ chế giải thích đổi |
| 2 | Đây có phải thiết kế sai | Rõ (kết luận: nhiều khả năng là gap) | 3 bằng chứng: decision 0021 không hề bàn worktree; mỗi worktree có `.git/index` riêng nên hazard thật không áp dụng cơ học; guard 2 cùng file đã biết phân biệt worktree/main mà guard 1 (lock acquire) thì không |
| 3 | tsk-45y có giải bài này chưa | Rõ — KHÔNG | tsk-45y bàn lớp khác (fgOS state-write qua events.lock), đã đóng wontfix vì premise sai (worktree không có `.fgos` ghi được). Scout evidence của tsk-45y không hề grep `.githooks/` — blind spot thật, không phải đã xét rồi bác bỏ |
| 4 | Có bug thật nào từng bị ảnh hưởng bởi việc này trước tsk-sir chưa | Chưa rõ | Report chưa grep `.fgos/events.jsonl` cho case cụ thể; để `fgos-coding-exploring` quyết có cần scout thêm hay không |
| 5 | Fix đúng có phải chỉ thêm `gitDir !== gitCommonDir` check vào hook, hay có race scenario ẩn nào đó vẫn cần lock áp cho worktree commit | Chưa rõ | Chưa tìm thấy bằng chứng nào cho race ẩn, nhưng chưa loại trừ hết — cần `fgos-coding-planning` cân nhắc khi viết test plan |

## 4. Quyết định đã chốt

| D-ID | Quyết định |
|------|-----------|
| D1 | Root cause: `.githooks/pre-commit` là 1 file vật lý duy nhất do `core.hooksPath` (relative) dùng chung `.git/config` mọi worktree và resolve theo main working tree; `repoRoot`/lock check trong hook luôn là của main checkout, bất kể worktree nào gọi `git commit` |
| D2 | Đây là gap thiết kế, không phải quyết định cân nhắc — decision 0021 (lý do hook tồn tại) chỉ bàn race trên main's `.git/index`, không hề xét worktree; mỗi worktree có index riêng nên hazard đó không áp dụng cơ học cho worktree commit; guard 2 cùng file (`currentFgwBranchIfMainCheckout`) đã phân biệt worktree/main còn guard 1 (`acquireMainCheckoutLock`) thì không — bất đối xứng trong cùng 1 file |
| D3 | tsk-45y không giải bài này — khác lớp (fgOS state-write qua `events.lock` vs git-commit hook qua `main-checkout.lock`), và bằng chứng đóng của tsk-45y có blind spot thật (chưa grep `.githooks/`) |
| D4 | Hướng fix đề xuất: thêm check `gitDir !== gitCommonDir` (mirror guard 2's logic) NGAY TRƯỚC bước gọi `acquireMainCheckoutLock` trong hook's `main()` — skip lock check khi đang chạy từ linked worktree. Không sửa `acquireMainCheckoutLock` primitive chính nó, vì nó dùng chung cho claim-port.mjs/merge.mjs — chỉ call site trong hook mới cần phân biệt worktree |
| D5 | (fgos-coding-exploring re-scout) `acquireMainCheckoutLock` chỉ có 3 call site thật trong `src`/`bin` — `claimWork`, `mergeRunnerItem`, `fgos unlock` verb — không cái nào khác bị ảnh hưởng bởi D4's fix |
| D6 | (fgos-coding-exploring re-scout) GitNexus's own call-graph cũng miss `.githooks/pre-commit` làm caller — corroborate D3, không phủ nhận D1/D7 (đã verify bằng đọc code + lệnh git thật) |
| D7 | **Sửa D1**: cơ chế thật là `core.hooksPath` trên checkout này bị set thành 1 đường TUYỆT ĐỐI (`git config --get --show-origin` xác nhận), không phải relative `.githooks` mà `installGitHooks`/toàn bộ test suite kỳ vọng. Thực nghiệm cô lập (`scratchpad/hookspath-experiment.sh`, `hookspath-experiment2.sh`) chứng minh: khi hooksPath THẬT SỰ là relative, hook KHÔNG chạy từ worktree (resolve theo worktree's own top-level, không tồn tại ở đó) — phủ nhận D1's giả thuyết gốc. Vì `installGitHooks` là fill-only (không bao giờ ghi đè), và decision 0021 tự ghi nhận checkout này CÒN là relative `.githooks` lúc 2026-07-28 (doctor xanh), một thứ gì đó đã ghi đè thành tuyệt đối SAU thời điểm đó — nguyên nhân chưa xác định, ngoài phạm vi item này. D4's hướng fix KHÔNG đổi. |
| D8 | Phát hiện phụ, ngoài scope tsk-sir: `mainCheckoutHookWired`/`installGitHooks` (`src/setup/git-hooks.mjs`) so khớp CHUỖI CHÍNH XÁC với `.githooks` — nên giá trị tuyệt đối-nhưng-tương-đương đọc thành "chưa wired". Xác nhận sống: `fgos doctor` trên chính checkout này BÁO SAI "not wired" dù hook rõ ràng đang chặn commit (2 lần thật trong session này). Nên tách thành work item riêng, không sửa trong tsk-sir. |

Mỗi D-ID trên đã ghi qua `fgos decision --id tsk-sir` (xem log CLI, seq đính
kèm dưới mỗi lần chạy trong session này).

## 5. Q&A log

- **2026-08-05T06:4x — Distill extraction.** Nguồn:
  `plans/reports/internal-design-260805-1327-tsk-sir-worktree-commit-lock-scope-report.md`.
  Trích: §2 (mục tiêu, tổng hợp lại từ report's "Câu hỏi" + ngữ cảnh
  tsk-1p9 commit bị chặn), §3 (5 dòng — 3 đã rõ theo report §1-§3, 2 chưa
  rõ theo report's "Việc chưa rõ"), §4 (D1-D4, ánh xạ trực tiếp từ report's
  §1/§2/§3/"Việc chưa rõ" dòng đề xuất fix), §6 (viết mới, không copy
  nguyên văn report), §7 (1 task, vì thiết kế là 1 mảnh không tách). Không
  có hội thoại sống — report đã tự trả lời đủ 3 câu hỏi gốc, 2 điểm còn mở
  giữ nguyên trong §3, không đoán.

## 6. Thiết kế đã chốt {#design}

`.githooks/pre-commit` chặn `git commit` dựa trên `.fgos/main-checkout.lock`
để bảo vệ đúng 1 hazard cụ thể: 2 tiến trình cùng `git commit` vào **cùng
một `.git/index`** của main checkout (bug gốc `tsk-3w8`, decision 0021).

Cơ chế khiến MỌI worktree resolve về đúng lock đó (D7, đã sửa từ giả
thuyết ban đầu): `core.hooksPath` trên checkout thật này đang được set
thành 1 đường **TUYỆT ĐỐI**, trỏ thẳng vào main checkout's `.githooks`
— không phải relative `.githooks` như code `installGitHooks` ghi và toàn
bộ test suite kỳ vọng. Vì hooksPath dùng chung 1 file config
(`extensions.worktreeConfig` không bật) và giá trị này tuyệt đối, mọi
worktree tra `core.hooksPath` đều ra CÙNG 1 đường vật lý — không phụ
thuộc quy tắc resolve-relative nào cả. (Giả thuyết ban đầu — relative
path resolve theo main working tree — đã bị phủ nhận bằng thực nghiệm cô
lập: khi hooksPath THẬT SỰ relative, hook không hề chạy từ worktree.)
Vì sao giá trị lại là tuyệt đối thay vì relative trên chính checkout này
— chưa xác định, ngoài phạm vi item.

```mermaid
flowchart TD
    subgraph Main["Main checkout"]
        H[".githooks/pre-commit\n(1 file vật lý)"]
        L[".fgos/main-checkout.lock"]
        MI["main .git/index"]
    end
    subgraph WT["Linked worktree (fgw/tsk-1p9)"]
        WC["git commit"]
        WI["worktree's own .git/index\n(.git/worktrees/tsk-1p9/index)"]
    end
    subgraph WT2["Main checkout commit (approve/merge)"]
        MC["approve's git commit --no-edit"]
    end

    WC -- "core.hooksPath = đường tuyệt đối\n(dùng chung 1 config file)" --> H
    MC -- "cùng hook" --> H
    H -- "acquireMainCheckoutLock" --> L
    H -. "HELD -> refuse" .-> WC
    MC --> MI
    WC -.->|"KHÔNG đụng"| MI
    WC --> WI

    style WC fill:#fee,stroke:#c00
    style MI fill:#eef
    style WI fill:#efe
```

Hazard thật (2 writer cùng đụng `MI`) chỉ xảy ra giữa 2 commit trên chính
main checkout (`MC` vs 1 `git commit` tay khác cũng lên main). Một
`git commit` trong worktree (`WC`) ghi vào `WI`, tách biệt hoàn toàn — bị
chặn bởi `H` là collateral, không phải bảo vệ đúng hazard mà decision 0021
nêu ra.

Fix đề xuất (D4, không đổi bởi D7): thêm check `gitDir !== gitCommonDir`
— cùng logic `currentFgwBranchIfMainCheckout` đã dùng — ngay trước dòng
gọi `acquireMainCheckoutLock` trong `main()`; nếu đang ở linked worktree,
bỏ qua bước acquire/check lock đó (guard 2 phía dưới vẫn giữ nguyên, nó
vốn đã skip worktree rồi). `acquireMainCheckoutLock` chính nó (primitive
dùng chung `claim-port.mjs`/`merge.mjs`) không đổi — chỉ đổi call site
trong hook. Fix này đúng bất kể hooksPath là relative hay tuyệt đối, vì nó
nhắm vào hành vi CỦA HOOK một khi đã chạy, không phụ thuộc cơ chế nào đưa
nó tới đó.

**Phát hiện phụ, không thuộc thiết kế item này (D8):** trong lúc verify D7,
phát hiện `fgos doctor` trên chính checkout này báo sai
`main-checkout-hook-wired: not wired` — vì check đó so khớp chuỗi chính
xác với `.githooks` (relative), không nhận ra giá trị tuyệt đối-nhưng-
tương-đương. Đây là 1 false negative thật trên chính safety check của
`fgos doctor`, xứng đáng 1 work item riêng — không sửa trong tsk-sir.

## 7. Danh mục hạng mục / task {#tasks}

### {#task-worktree-commit-lock-skip}

- **Mục tiêu:** Sửa `.githooks/pre-commit`'s `main()` để bỏ qua
  `acquireMainCheckoutLock` khi commit đang chạy từ 1 linked worktree,
  không phải main checkout — đóng gap D2, theo hướng fix D4.
- **Trích §6:** toàn bộ — thiết kế là 1 mảnh, không tách.
- **D-ID áp dụng:** D7 (root cause, sửa D1), D2 (gap, không phải chủ ý),
  D4/D5 (hướng fix cụ thể + phạm vi call site).
- **Quan hệ sibling:** không — item độc lập, không phụ thuộc/chặn task
  nào khác đã biết. Không đụng `tsk-45y` (đã đóng, lớp khác) hay `tsk-1p9`
  (item khác, tình cờ cùng lúc phát hiện bug này). D8 (doctor false
  negative) là phát hiện phụ, tách thành work item riêng, không phải
  con/sibling của tsk-sir.
- **Việc còn mở cho `fgos-coding-planning` cân nhắc:** §3 dòng 4 (có bug thật nào
  từng bị ảnh hưởng chưa) và dòng 5 (có race ẩn nào cần giữ lock cho
  worktree không) — nếu không tìm thêm bằng chứng, `fgos-coding-planning` nên tự
  quyết dựa trên D1-D4 đã đủ vững, không cần chặn lại vì 2 điểm này.
- **Draft verify:** mirror shape của `test/e2e/main-checkout-lock-hook.test.mjs`
  (dùng `git commit` subprocess thật) — thêm case: main checkout giữ lock
  (giả lập bằng tạo `.fgos/main-checkout.lock` trực tiếp hoặc claim thật),
  sau đó `git commit` từ 1 linked worktree phải **thành công** (không bị
  refuse), trong khi `git commit` trực tiếp trên main checkout vẫn bị
  refuse như cũ.
