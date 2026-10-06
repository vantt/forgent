# Multi-Role Harness Distill Record

```txt
Document type: History
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: Dated narrative record of how the multi-role team harness decision was distilled and what happened after the distill.
Design status: Candidate
Last reviewed: 2026-10-06
Related:
- docs/platform/work-state/README.md
- docs/platform/work-state/decisions/retired-decision-history.md
- docs/specs/work-state.md
```

## 1. Purpose And Scope

Dated narrative of one decision record: the journey, the state at distill time, and the review after distill. The decision text itself lives in [retired-decision-history.md](../decisions/retired-decision-history.md).

## 2. Distill Journey

Xuất phát từ yêu cầu so sánh cơ chế điều phối fgOS vs marketing-cockpit
(2 scout haiku + phản biện fable, vòng 1–2), thảo luận mở rộng thành
thiết kế **core harness tổng quát cho team agent đa role** — absorption
cockpit trở thành *khách hàng đầu tiên* của harness thay vì mục tiêu duy
nhất. Hội tụ lần 1 ở vòng 8 (exploring + planning đã chạy), người
dùng dừng trước implement rồi đào sâu thêm 16 vòng ra, và
planning chi tiết per-file (vòng 22).

## 3. State At Distill Time

- **Validating đã chạy xong**: reality gate 6/6 PASS, feasibility matrix
  có bằng chứng thật từng dòng, verdict **READY WITH CONSTRAINTS**; gate
  `validateApprove` hỏi người (`canAutoApprove: false` — hard-gate
  keyword `schema`/`migration`, true positive), người dùng chọn
  mechanism-first → **D7a** (seq 18248). `fgos plan --verdict decompose`
  materialize **3 item con** ở stage `executing`: `tsk-2t9c-1` (role
  axis, heavy), `tsk-2t9c-2` (workflow hierarchy, heavy, `deps:
  [tsk-2t9c-1]`), `tsk-2t9c-3` (task-spec + doctor check, standard).
- 13 D-ID khớp ở 3 nơi: event log, bảng §4 `DISCUSSION.md`,
  bảng Locked decisions `CONTEXT.md`.
- Hai bẫy ghi lại trong plan: `src/state/handoff.mjs` phải có row trong
  `docs/architecture-manifest.json` (không thì `test/architecture.
  test.mjs` đỏ), và file đó phải PURE (cap/depth do caller truyền —
  khuôn `hasWorkerSlotRoom({ceiling})`).

## 4. Implementation Review And Verification After Distill

Phần này KHÔNG có trong bản distill gốc — thêm khi copy sang
`docs/decisions/` để bản ghi không đứng yên khi thực tế đã đi xa hơn.
Toàn bộ chi tiết per-D-ID, per-commit sống ở
`docs/history/fgos-marketing-domain-foundation/CONTEXT.md` (bảng)
và `DISCUSSION.md` (Q&A theo round); đây chỉ là điểm mốc.

Ba mảnh ①②③ implement, test, tự review, commit tuần tự trên chính branch
`fgw/tsk-2t9c` theo lệnh người dùng ("mọi thứ tự quyết"). Sau đó, theo
yêu cầu review nghiêm túc của người dùng:

- **Nối dây handoff thật**: 5 skill coding-domain (`fgos-coding-implement`/
  `discovering`/`exploring`/`planning`/`validating`) nối dây thật vào
  `handoff`/`handoff-return` — không chỉ có cơ chế, mà skill THẬT gọi nó.
- **Review độc lập**: review độc lập (agent `code-reviewer` mới, không chia sẻ
  context) tìm ra 2 lỗi HIGH + 3 MED + 4 LOW trong chính cách nối dây
  handoff thật vừa làm ở trên — tất cả đã sửa (chi tiết: giữ role/holder axis nhất quán qua
  reclaim lặp tới khi về `implementer`, `roleGraph` phủ cả stage
  `decompose` legacy, v.v.).
- **Khoá `kind` sau khi rời `todo`**: một câu hỏi kiến trúc của người dùng ("`fgos-coding-driving`
  có nên là cross-workflow router?") dẫn tới tư vấn Opus độc lập, phát
  hiện `kind` (field chọn workflow của item) sửa tự do không kiểm soát —
  fix: khoá `kind` một khi `status` rời `todo`, không cần field
  `workflow` riêng.
- **Chuyển lệnh review vào ENGINE**: một lần chạy AGENT THẬT (không phải test đơn vị) theo đúng
  prose của `fgos-coding-implement`, trên một item thật, phát hiện
  handoff `review` KHÔNG bắn được trong thực tế dù prose ra lệnh rõ ràng
  — nguyên nhân: lệnh nằm cuối, lặp lại 2 lần (return/catchup), không gì
  kiểm tra khi bị bỏ sót. Fix: chuyển lệnh vào ENGINE (`moveWork` tự bắn
  khi `status` chạm `awaiting-approval`), không còn phụ thuộc agent đọc
  hết prose. Xác nhận lại bằng agent thật lần nữa (`tsk-3vk`,
  2026-08-16): `work.handoff` với `reason: "review"` bắn đúng, agent
  không hề tự gọi.

Bài học chung xuyên suốt ba mục trên: **test đơn vị/tích hợp chứng minh
engine đúng, không chứng minh agent theo prose sẽ hành xử đúng** — chỉ
một lần chạy thật, agent thật, theo đúng hướng dẫn, trên item thật, mới
lộ ra khoảng cách đó. Nơi khoảng cách này lặp lại (một hành vi bắt buộc
nhưng không gì kiểm tra khi bị bỏ sót), hướng sửa đúng là chuyển bảo
đảm vào engine, không phải viết prose mạnh hơn.

## 5. Related Files

- [Work state area portal](../README.md)
- [Retired decision history](../decisions/retired-decision-history.md)
- [Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)
