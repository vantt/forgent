# Design acyclic module boundary for the state/runner merge cluster

## 1. Trạng thái hiện tại

Vừa mở discussion (tsk-49i). Một phiên trước (chat, không phải claim) đã quét
code thật và tìm ra 4 phát hiện cụ thể (xem §5 Q&A log) — chưa có D-ID nào
chốt, vì chưa qua round thứ 2. Việc kế tiếp: một agent (model `fable`) tiếp
tục round này — đọc §5, đề xuất thiết kế boundary cụ thể (cạnh nào cắt, hàm
nào dời đi đâu, thứ tự refactor), scout thêm nếu cần, rồi chốt D-ID + viết §6.

## 2. Mục tiêu & đề bài

`src/state/` và `src/runner/` hiện phụ thuộc qua lại lẫn nhau (state → runner
ở 4 file, runner → state ở 7 file) thay vì là một layer một chiều sạch — nên
không thể tách thành 2 crate độc lập nếu port sang ngôn ngữ khác (Rust) sau
này. Mục tiêu discussion này: thiết kế lại boundary cho cụm module quanh
merge (`src/runner/merge.mjs`, `src/runner/worktree.mjs`,
`src/state/drift-status.mjs`, `src/state/graph-harness.mjs`,
`src/evolve/iron-law.mjs`, và phần orchestration trong `bin/fgos.mjs`'s case
`merge`/`approve`/`sync-root`) sao cho: (a) dependency graph giữa các module
trở thành acyclic thật sự, (b) ranh giới thật để port từng cụm sau này là
"pure logic, không shell git" vs "git I/O shim, có shell git thật" — không
phải theo tên thư mục hiện tại. Kết quả mong đợi: một thiết kế module/lớp cụ
thể (không phải chỉ nguyên tắc chung) đủ để `fgos-coding-planning` viết plan
refactor thật.

## 3. Vấn đề rõ / chưa rõ

| # | Vấn đề | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | `state/` ↔ `runner/` có cycle thật, không phải layer 1 chiều | Rõ | Bằng chứng: `grep -rl "from '../runner/" src/state/` → 4 file; `grep -rl "from '../state/" src/runner/` → 7 file |
| 2 | Iron Law check (`changedFiles`+`classifyIronLaw`) bị copy-paste 3 lần trong `bin/fgos.mjs` | Rõ | L2473-2478 (merge next), L3429-3436 (approve), L4036-4037 (sync-root) — chưa có helper chung |
| 3 | `isMainWorktree` nằm trong `merge.mjs` thay vì `worktree.mjs` | Rõ | Pure worktree-identity check, 0 semantics về nội dung merge — có vẻ là oversight từ STR44 |
| 4 | Ranh giới port-được thật sự là gì (pure vs I/O), map chi tiết | Rõ ở mức khảo sát, chưa rõ ở mức thiết kế | Đã liệt kê 2 nhóm (xem §5) nhưng chưa quyết cụ thể module/crate boundary cuối cùng |
| 5 | Thứ tự refactor để cắt cycle mà không phá vỡ hành vi runtime | Chưa rõ | Cần thiết kế cụ thể: đảo hướng 3 cạnh `state→runner` thế nào (truyền tham số thay vì tự import) mà không đổi contract CLI hiện có |
| 6 | Có nên gộp thêm các module liên quan khác (`session.mjs`, `session-identity.mjs`, `main-checkout-lock.mjs`, `goal-check.mjs`, `github-adapter.mjs`) vào cùng thiết kế boundary này, hay để lại phạm vi khác | Chưa rõ | Cần quyết định scope: chỉ merge cluster, hay cả `runner/` nói chung |

## 4. Quyết định đã chốt

*(chưa có D-ID nào — chưa qua round 2)*

## 5. Q&A log

**[Round 1 — phiên chat trước khi item này được submit, tsk-49i]**

Q: Vì sao logic merge cảm giác bị rải rác qua nhiều file?
A (scout thật, có bằng chứng):

- `bin/fgos.mjs` không chỉ dispatch — nó tự làm drift-check, Iron-Law
  pre-check, và đệ quy verb (`merge next` → `sync-root`/`approve`). Chỉ có
  phần merge git cấp thấp (merge/verify/commit/cleanup) mới nằm trong
  `src/runner/merge.mjs`.
- `driftStatus` (`src/state/drift-status.mjs`) dùng chung bởi CẢ `merge`
  (blockedOnSync ranking) LẪN `approve` (milestone target drift guard,
  L3348) — không phải merge-exclusive.
- `sync-root` là verb độc lập, tự invoke được (`fgos sync-root <root-id>`),
  postcondition khác `approve` (không đổi status/stage, không xoá
  `fgw/<id>`) — `merge next` chỉ mượn nó qua `runVerb('sync-root', ...)`.
- Iron Law check (`changedFiles` → `classifyIronLaw`) là thứ bị lặp nhiều
  nhất, không phải "dùng chung" sạch: 3 lần copy-paste inline trong
  `bin/fgos.mjs`, mỗi lần khác nhau ở `opts` truyền vào `changedFiles`
  (rootBranch/trunk/targetBranch).
- `merge.mjs` đã import trực tiếp từ `worktree.mjs`
  (`branchNameFor`/`branchExists`/`reclaimOrphanedCheckout`) — chiều phụ
  thuộc `merge → worktree` là MỘT CHIỀU, sạch.
- Nhưng ở mức folder rộng hơn, `state/` và `runner/` cross-import cả 2
  chiều — **đây là cycle thật**:
  - `state → runner`: `drift-status.mjs` → `runner/merge.mjs`
    (`detectTrunk`); `store.mjs` → `runner/session-identity.mjs`
    (`resolveWriterIdentity`); `graph-harness.mjs` →
    `runner/root-affinity.mjs` (`resolveRoot`); `cleanup-harness.mjs` cũng
    cross.
  - `runner → state`: `merge.mjs`, `dispatch.mjs`, `loop.mjs`,
    `claim-port.mjs`, `claim-liveness.mjs`, `anti-loop.mjs`,
    `prompt-templates.mjs`.
- Ranh giới port-được thật sự (kiểm bằng `grep -c "execFileSync\|spawn"`
  từng file):
  - **Pure, 0 shell-git**: `graph-harness.mjs`, `store.mjs`,
    `iron-law.mjs`, `frozen-judge.mjs` — ứng viên port Rust đầu tiên, an
    toàn, không cần crate git nào.
  - **Git I/O shim, có shell git thật**: `worktree.mjs`, `merge.mjs`,
    `goal-check.mjs`, `session.mjs`, `session-identity.mjs`,
    `main-checkout-lock.mjs`, `github-adapter.mjs`, `drift-status.mjs` —
    port sau, cần `git2` crate hoặc tiếp tục shell ra `git` CLI.

Kết luận phiên trước: cần cắt 3 cạnh `state → runner` trước (đảo hướng:
truyền `trunk`/`writerIdentity`/`root` vào như tham số) rồi mới port được
`state/` như một cụm acyclic độc lập.

## 6. Thiết kế đã chốt {#design}

*(chưa có — chờ round tiếp theo chốt cách cắt 3 cạnh cycle và cách gộp Iron
Law check thành 1 helper, trước khi viết synthesis + diagram ở đây)*

## 7. Danh mục hạng mục / task {#tasks}

*(chưa tách — chờ §6)*
