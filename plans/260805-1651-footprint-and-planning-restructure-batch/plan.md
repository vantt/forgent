# Batch checklist — footprint/parallel-decomposition + fgos-planning restructure

Không phải `deps` thật (5 item độc lập, không block nhau — gắn deps giả
sẽ đảo quyết định đã chốt trong `DISCUSSION.md`). Không dùng `parent`
(anti-pattern đã bị hệ thống tự flag, `tsk-4jj`). Đây chỉ là checklist +
`priority` bump để `fgos ready`/`fgos triage` nổi 5 item này lên trước,
theo dõi tay không để miss.

## Trạng thái (cập nhật 2026-08-05)

- [x] **tsk-66o** (todo/executing, neo bởi 2 con mở) — `fgos-planning`+`fgos-validating` xong, READY, decompose thành `tsk-3c7` (computed-parallel-wave-schedule) + `tsk-2ig` (worktree-dispatch-attestation). Xong bước của root — 2 con sẽ tự đi qua clarify/decompose/executing riêng khi tới lượt.
- [x] **tsk-1gr** (todo/executing) — `fgos-exploring`+`fgos-planning`+`fgos-validating` xong (D1 advisory-only, D2 luật thuần cơ học). Pass-through, không chia con. Sẵn sàng `fgos-code-implement` khi tới lượt.
- [x] **tsk-3uz** (todo/executing) — `fgos-exploring`+`fgos-planning`+`fgos-validating` xong (D1 thuần skill-prose, D2 optional hệ thống/bắt buộc-trong-thực-hành). Pass-through. Sẵn sàng `fgos-code-implement`.
- [ ] **tsk-5ay** (priority 3000, todo/decompose) — so sánh quy trình fgOS vs /ck:plan+/ck:cook + re-distill bee thật; nhà cho 2 quyết định đã bàn (mode-gate → `fgos-routing`; kỷ luật truy-nguồn vào Gate của `fgos-planning`) — chưa claim, chưa log decision.

Con mới sinh ra từ `tsk-66o` (parent: tsk-66o, chưa nằm trong 4 task gốc nhưng giờ là việc thật cần theo dõi):
- [ ] **tsk-3c7** — computed-parallel-wave-schedule (clarify/decompose, tuỳ pool). Verify: `node --test test/state/graph-metrics.test.mjs`.
- [ ] **tsk-2ig** — worktree-dispatch-attestation mức 1 (clarify/decompose, tuỳ pool). Verify: `node --test test/runner/dispatch.test.mjs test/runner/frozen-judge.test.mjs`.

Liên hệ (không phải việc mới, chỉ nhận ghi chú): `tsk-49o` — mức 3 attestation, dep `tsk-62v`, đã có cross-reference từ `tsk-66o`.

## Bài học vận hành (2026-08-05)

Main checkout dùng chung có RẤT nhiều phiên hoạt động song song (`git worktree list` lúc đó: 20+ worktree khác đang sống). `plan.md` + 2 con + 1 gate-approve bị MẤT THẬT một lần (chưa commit kịp thì bị merge của phiên khác cuốn mất) — không phải giả thuyết, đã xảy ra và phải làm lại. Từ lúc đó chuyển sang `fgos session start --item <id>` + `EnterWorktree path:<worktreePath>` (mục A, `docs/how-to-parallel-lanes.md` ở xưởng `forgent`) — cô lập cây code, `.fgos/` vẫn dùng chung qua symlink (bảo vệ bởi lock riêng, không phụ thuộc git). Từ đó không mất gì thêm. Bài học cho các round sau: **luôn `session start` trước khi viết file trong `docs/history/`, đừng đợi tới khi bị mất mới chuyển.**

## Thứ tự dự định

1. `tsk-66o` trước (gần xong nhất) → `fgos-planning`
2. `tsk-1gr` + `tsk-3uz` (độc lập, làm song song được với nhau)
3. `tsk-5ay` (chủ đề khác — kiến trúc `fgos-planning` — không phụ thuộc 3 cái trên)

## Nguồn

- `docs/history/parallel-decomposition-footprint-avoidance/DISCUSSION.md` (tsk-66o + D1-D6)
- `docs/distillery/deep-dives/parallel-decomposition-and-merge.md` (deep-dive gốc)
- Cuộc hội thoại phiên này (tsk-5ay's 2 quyết định — mode-gate + gate traceability — chưa có doc riêng, sẽ tạo khi claim tsk-5ay)
