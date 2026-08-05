---
type: discussion
title: Nên tự động rollup cha lên delivered khi con/target resolved, hay giữ close-out thủ công?
tags: []
timestamp: 2026-08-05T10:38:00.000Z
---

# Nên tự động rollup cha lên delivered khi con/target resolved, hay giữ close-out thủ công?

## 1. Trạng thái hiện tại

Round 2. Anh chọn hướng (b): giữ cha tự claim/return/approve, chỉ giảm ma
sát viết tay `verify`. Anh cũng nêu 1 tiền đề: "con chưa cleanup thì cha
không thể claim" — đã verify code thật, tiền đề này **sai**: cha claim
được ngay khi con đạt `delivered` (không cần chờ `cleanup`/`done`). Xem §3
dòng 8 và §5 round 2 cho chi tiết + trích dẫn. Câu hỏi mở tiếp theo: helper
giảm ma sát nên có hình dạng gì cụ thể — xem cuối §5.

## 2. Mục tiêu & đề bài

Anh quan sát 2 case: tsk-2jc (milestone, targets=[tsk-1qm]) và tsk-4y2 đều
delivered rồi tự chạy retrospective→cleanup→done bình thường (đây là pipeline
chuẩn cho item tự đứng, không liên quan gì cha/con). Ngược lại tsk-4bc (MVP,
goalTier, targets 4 milestone) vẫn `todo` dù cả 4 milestone nội dung đã xong
— và để đóng tsk-2jc trước đó, anh (qua audit 2026-08-03) đã phải chọn "nới
verify" (chấp nhận target ở bất kỳ status resolved thay vì đòi đúng `done`)
thay vì chờ TTL cleanup 7 ngày trôi qua. Câu hỏi anh đặt ra: có nên biến việc
"nới điều kiện" lặp đi lặp lại này thành một cơ chế rollup tự động (cha tự
delivered khi con/target resolved), thay vì cứ mỗi milestone lại tay sửa
`verify` một lần?

## 3. Vấn đề rõ / chưa rõ

| # | Điểm | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 1 | `fgos rollup` hiện là read-only, chỉ đọc `parent`, không đọc `targets`, không transition status | Rõ | bin/fgos.mjs:665; xác nhận bởi frontier.mjs:212-214 và distribution-vision.md:145-149 (tsk-4bc rollup ra 0/0) |
| 2 | Gate vào `delivered` (status-fsm.mjs ~L106-123) không có check con nào cả — chỉ `assertAcceptanceEvidence` (store.mjs:412) check evidence của chính item | Rõ | grep xác nhận zero child reference trong status-fsm.mjs |
| 3 | Cả 2 nhánh (decomposed root/`parent`, goalTier/`targets`) đều đã có how-to doc mô tả **quyết định chủ đích, không phải bug**: cha/milestone phải tự đi qua claim→verify→return→compound→approve, để có chỗ thật viết CONTEXT.md tổng hợp bằng chứng — không tự đóng khi con xong | Rõ | close-out-a-decomposed-root-item-....md §"Why this doesn't happen automatically"; close-out-a-goaltier-milestone-....md §"Why this doesn't happen automatically" |
| 4 | Case tsk-2jc thật: "nới điều kiện" không phải sửa status-fsm.mjs, mà là sửa **field `verify` của riêng item đó** (một câu jq check target ở resolved-set thay vì strict `done`) — quyết định này đã có `gates.ask`/`gates.answer` ghi lại đàng hoàng (audit 2026-08-03), không phải hack ngầm | Rõ | fgos show tsk-2jc → gates.ask/answer |
| 5 | Ma sát thật đang lặp lại là gì: (a) mỗi goalTier item tự tay viết 1 câu jq verify riêng (rủi ro: prose không chạy được, thiếu `--dir`, trap `--no-new-commits-ok` không cứu được lần retry) — hay (b) muốn cha THẬT SỰ tự chuyển status không cần claim/return/approve gì cả? | **Chưa rõ — câu hỏi đang chờ anh** | Hai hướng dẫn tới thiết kế khác hẳn nhau, xem §6 draft |
| 6 | Nếu chọn tự động chuyển status: có nên bypass `assertAcceptanceEvidence`/claim-verify-return-approve cycle của chính cha không? Vision doc rationale (giữ chỗ cho CONTEXT.md tổng hợp thật) có còn cần thiết nếu tự động hoá? | Chưa rõ | Phụ thuộc câu trả lời #5 |
| 7 | Phạm vi: sửa chung cho cả `parent` (decompose) lẫn `targets` (goalTier), hay chỉ 1 trong 2 trước? | Chưa rõ | Cả 2 how-to doc hiện có cấu trúc song song, có thể dùng chung 1 helper |
| 8 | "Con chưa cleanup thì cha không thể claim" | **Sai — đã verify code** | `TAIL_RESOLVED_STATUSES = {delivered, retrospective, cleanup, done}` (frontier.mjs:221); `isResolvedStatus` true ngay khi con = `delivered` (frontier.mjs:224-229); `hasOpenDescendant` (frontier.mjs:237-249) chỉ block khi con CHƯA vào tập này. `pick --id <id>` (bin/fgos.mjs:1962-1975) thậm chí không re-check lineage gì cả — đi thẳng `claimWork` (claim-port.mjs:88-278), chỉ CAS `expectedStatus`. `take --id` (bin/fgos.mjs:1888) có check `isDepsAndLineageReady` nhưng chỉ áp dụng khi `status==='todo'`. TTL 7 ngày (`DEFAULT_CLEANUP_TTL_DAYS`, cleanup-harness.mjs:131-146) chỉ gate con tự đi `cleanup→done`, không liên quan gì việc cha claim được hay không — đây là nguồn gây lẫn lộn thật |

## 4. Quyết định đã chốt

(chưa có — round 1)

## 5. Q&A log

- **2026-08-05T10:38 (round 1, mở discussion):** Scout 4 nguồn (bin/fgos.mjs,
  status-fsm.mjs, frontier.mjs, 2 how-to doc trong docs/how-to/) + đọc audit
  decision thật của tsk-4bc/tsk-2jc qua `fgos show --json`. Phát hiện quan
  trọng: cả 2 how-to doc đã có sẵn, viết rõ đây là **quyết định chủ đích**
  (không phải gap chờ fix) — cha cần tự đi qua cycle riêng để có chỗ viết
  CONTEXT.md tổng hợp bằng chứng thật, tránh "milestone lặng lẽ biến mất
  thành 'vài target tình cờ xong rồi'". Câu hỏi đặt lại cho anh: mục tiêu
  thật của anh là muốn **bỏ hẳn** bước claim/verify/return/approve riêng của
  cha (tức đảo ngược rationale trên), hay chỉ muốn **giảm ma sát viết
  `verify` command tay mỗi lần** (ví dụ: 1 lệnh `fgos rollup --gen-verify` or
  template sẵn, để không phải tự viết jq mỗi milestone, không đổi gì về việc
  cha vẫn phải tự claim/return/approve)? Câu trả lời quyết định toàn bộ
  hướng thiết kế ở §6.

- **2026-08-05T10:45 (round 2):** Anh chọn hướng (b) — giảm ma sát, giữ cha
  tự claim/return/approve. Anh nêu thêm: "con chưa cleanup thì cha không
  claim được" là nguồn gây "cứ lẫn lộn", muốn 1 cách hợp lệ để đóng cha khi
  hết việc thật. Verify code (Agent Explore, xem §3 dòng 8): tiền đề này SAI
  — cha claim được ngay khi con `delivered`, không cần chờ `cleanup`/TTL 7
  ngày. `pick --id` thậm chí không check lineage. Vậy KHÔNG có code-gate
  nào cần sửa để "cho phép claim" — cái thật sự thiếu là (1) tài liệu/nhận
  thức đúng (anh tưởng phải chờ cleanup, không cần), và (2) helper sinh sẵn
  `verify` command đúng cú pháp (tránh 3 bẫy đã biết: prose không chạy
  được, thiếu `--dir` tuyệt đối, `--no-new-commits-ok` không cứu được lần
  retry sau khi đã blocked 1 lần).

  Câu hỏi tiếp: helper này nên là gì cụ thể — 3 lựa chọn nháp, anh chọn hoặc
  đề xuất khác:
  - (A) verb mới `fgos rollup --gen-verify <id>` — đọc `parent`/`targets`
    của item, in ra câu jq-check chuẩn (kèm `--dir` tuyệt đối), anh tự
    `fgos edit --verify` dán vào — không tự ghi, không tự claim/return gì.
  - (B) gộp thẳng vào `fgos edit <id> --verify-from-children` /
    `--verify-from-targets` — 1 flag tự tính rồi ghi luôn field `verify`,
    đỡ 1 bước copy-paste so với (A).
  - (C) không thêm code mới — chỉ viết rõ hơn 2 how-to doc hiện có (đặc
    biệt sửa lại phần khiến anh hiểu nhầm "chờ cleanup"), coi ma sát này
    chấp nhận được vì tần suất thấp (milestone/MVP không nhiều).

## 6. Thiết kế đã chốt

(chưa có — chờ câu trả lời cho câu hỏi ở §5 mục 5 trước khi phác thiết kế)

## 7. Danh mục hạng mục / task

(chưa có — chờ §6 ổn định)
