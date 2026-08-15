# CONTEXT — state/runner merge boundary (tsk-49i)

## Feature boundary

Làm cho cụm module quanh merge có ranh giới một chiều, acyclic, và tách
đúng tầng — bằng một refactor JS thuần, không đổi hành vi và không đổi
contract CLI `fgos.v1`. Hai mảng việc:

1. Cắt cycle import `src/state/` ↔ `src/runner/` (4 cạnh), gộp 3 bản
   copy-paste của Iron Law check, dời 2 hàm về đúng module.
2. Tách tầng use-case cho cụm 7 verb liên quan merge ra khỏi
   `bin/fgos.mjs`, để file đó thành CLI adapter mỏng.

Ngoài phạm vi: 48 verb còn lại của fgOS; các module `runner/` không bị
`state/` import (`session.mjs`, `goal-check.mjs`, `main-checkout-lock.mjs`,
`github-adapter.mjs`); và bản thân việc port sang Rust (thiết kế này chỉ
làm cho việc đó khả thi, không thực hiện nó).

Các quyết định dưới đây được chốt qua 6 vòng thảo luận thiết kế trong
`DISCUSSION.md` (§4 giữ bảng gốc, §5 giữ toàn bộ Q&A và bằng chứng), và
đã ghi vào decision log của item. File này chép lại chúng vào đúng khuôn
mà engine đọc — không mở lại, không diễn giải khác.

## Locked decisions

| D-ID | Quyết định |
|---|---|
| D1 | Land đúng 4 cạnh cắt (`drift-status.mjs` nhận `trunk` qua tham số bắt buộc; dời `session-identity.mjs`; dời `resolveRoot` về `state/frontier.mjs`) + helper mới `src/runner/iron-law-gate.mjs` gộp 3 bản copy-paste Iron Law + dời `isMainWorktree`/`detectTrunk` sang `worktree.mjs`. Làm ngay như refactor JS thuần, không phụ thuộc thời điểm port Rust. Không mở rộng sang module `runner/` khác. |
| D2 | `session-identity.mjs` dời vào `src/util/`, không tách folder `src/platform/` mới. |
| D3 | Mở rộng phạm vi trên trục SRP của tầng CLI: tách logic nghiệp vụ đang nằm inline trong `bin/fgos.mjs`'s case `merge`/`approve`/`review`/`sync-root`/`catchup`/`reject`/`promote-to-component` ra một tầng use-case riêng, để `bin/fgos.mjs` chỉ còn parse args → gọi 1 hàm use-case → format JSON `fgos.v1`. |
| D4 | Tầng use-case sống ở `src/verbs/<domain>/<verb>.mjs`, nest theo domain ngay từ đầu; cụm này land ở `src/verbs/merge/`. Không ngụ ý migrate lại 7 file use-case-rank hiện có (`runner/loop.mjs`, `intake/{discovery,plan,classify}.mjs`, `setup/{checks,registrations}.mjs`, `state/cursor.mjs`). |
| D5 | Việc dời `collectOutcomeEntry`/`collectFrictionData` sang `src/report/item-trace.mjs` được hiểu là dọn logic nằm sai tầng `entry` về đúng tầng `domain` — không phải "chạm ra ngoài cụm vào verb `check`". |

## Thuật ngữ đã pin

- **Cạnh (edge)** — một câu lệnh `import` từ file trong `src/state/` trỏ
  sang file trong `src/runner/`. Có đúng 4 cạnh như vậy hôm nay.
- **Tầng (layer)** — giá trị trong `docs/architecture-manifest.json`'s
  `layers`, không phải tên thư mục: `entry`(0) → `use-case`(1) →
  `infra`(2) → `domain`(3) → `kernel`(4). Import chỉ được đi ngang hoặc
  xuống sâu hơn.
- **Cycle** — ở đây luôn là cycle **cấp thư mục** (`state/` ↔ `runner/`),
  không phải vi phạm tầng: đồ thị tầng hiện tại đã hợp lệ và
  `test/architecture.test.mjs` đang xanh.

## Bằng chứng scout đã trích dẫn

- 4 cạnh `state → runner`: `cleanup-harness.mjs:41`, `graph-harness.mjs:23`
  (`resolveRoot`), `drift-status.mjs:18` (`detectTrunk`), `store.mjs:41`
  (`resolveWriterIdentity`) — xác nhận lại ở vòng discovery, không có
  occurrence nào khác kể cả comment.
- 3 bản copy-paste Iron Law: `bin/fgos.mjs:2478`, `:3436`, `:4037`.
- Danh sách file phải sửa NGOÀI `src/`+`bin/` (chỉ tìm ra ở vòng
  discovery, 6 vòng shaping trước đó chỉ quét `src/`+`bin/`): xem
  `RESEARCH.md` §A1 — đáng chú ý `.githooks/pre-commit:29` và
  `plugins/fgOS/skills/terminal/rename.sh:64` (hỏng im lặng), cùng 24
  call site trong `test/state/drift-status.test.mjs`.
- Ràng buộc của `test/architecture.test.mjs` và schema row của manifest:
  xem `RESEARCH.md` §A2.
- Khuôn `verify` và tiền lệ trong repo: xem `RESEARCH.md` §A3.

## Canonical references

- `docs/history/state-runner-merge-boundary/DISCUSSION.md` — thảo luận
  thiết kế đầy đủ 6 vòng; §6 là bản tổng hợp thiết kế, §7 là 2 hạng mục.
- `docs/history/state-runner-merge-boundary/RESEARCH.md` — bằng chứng
  vòng discovery (A1/A2/A3), có citation `file:line`.
- `docs/architecture-manifest.json` + `test/architecture.test.mjs` — luật
  tầng, và cũng là invariant check mặc định repo chạy ở `return`/`merge`.

## Outstanding questions

None
