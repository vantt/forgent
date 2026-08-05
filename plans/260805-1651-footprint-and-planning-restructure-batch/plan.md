# Batch checklist — footprint/parallel-decomposition + fgos-planning restructure

Không phải `deps` thật (5 item độc lập, không block nhau — gắn deps giả
sẽ đảo quyết định đã chốt trong `DISCUSSION.md`). Không dùng `parent`
(anti-pattern đã bị hệ thống tự flag, `tsk-4jj`). Đây chỉ là checklist +
`priority` bump để `fgos ready`/`fgos triage` nổi 5 item này lên trước,
theo dõi tay không để miss.

## Trạng thái (cập nhật 2026-08-05)

- [ ] **tsk-66o** (priority 10000, doing/decompose) — computed-parallel-wave-schedule + worktree-dispatch-attestation. `fgos-exploring` xong (D1-D6), verify khoá. Kế tiếp: `fgos-planning`.
- [ ] **tsk-1gr** (priority 5000, todo/clarify) — decompose có thể bỏ sót 1 quyết định khỏi mọi footprint con.
- [ ] **tsk-3uz** (priority 5000, todo/clarify) — `fgos-planning`'s split step không set `--footprint` cho con qua `--parent` (STR92).
- [ ] **tsk-5ay** (priority 3000, todo/decompose) — so sánh quy trình fgOS vs /ck:plan+/ck:cook + re-distill bee thật; nhà cho 2 quyết định đã bàn (mode-gate → `fgos-routing`; kỷ luật truy-nguồn vào Gate của `fgos-planning`) — chưa claim, chưa log decision.

Liên hệ (không phải việc mới, chỉ nhận ghi chú): `tsk-49o` — mức 3 attestation, dep `tsk-62v`, đã có cross-reference từ `tsk-66o`.

## Thứ tự dự định

1. `tsk-66o` trước (gần xong nhất) → `fgos-planning`
2. `tsk-1gr` + `tsk-3uz` (độc lập, làm song song được với nhau)
3. `tsk-5ay` (chủ đề khác — kiến trúc `fgos-planning` — không phụ thuộc 3 cái trên)

## Nguồn

- `docs/history/parallel-decomposition-footprint-avoidance/DISCUSSION.md` (tsk-66o + D1-D6)
- `docs/distillery/deep-dives/parallel-decomposition-and-merge.md` (deep-dive gốc)
- Cuộc hội thoại phiên này (tsk-5ay's 2 quyết định — mode-gate + gate traceability — chưa có doc riêng, sẽ tạo khi claim tsk-5ay)
