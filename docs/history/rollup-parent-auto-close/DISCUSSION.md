---
type: discussion
title: Nên tự động rollup cha lên delivered khi con/target resolved, hay giữ close-out thủ công?
tags: []
timestamp: 2026-08-05T10:38:00.000Z
---

# Nên tự động rollup cha lên delivered khi con/target resolved, hay giữ close-out thủ công?

## 1. Trạng thái hiện tại

Round 1, vừa mở discussion. Đã scout xong 4 nguồn thật (bin/fgos.mjs,
status-fsm.mjs, frontier.mjs, 2 how-to doc + audit decision trong
tsk-4bc/tsk-2jc). Chưa có D-ID nào chốt. Câu hỏi mở đang chờ trả lời: mục
tiêu thật của anh là (a) tự động chuyển status cha, hay (b) giảm ma sát
thao tác tay lặp lại ở bước viết `verify` command cho từng goalTier item?
Hai mục tiêu này dẫn tới thiết kế rất khác nhau — xem §3.

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

## 6. Thiết kế đã chốt

(chưa có — chờ câu trả lời cho câu hỏi ở §5 mục 5 trước khi phác thiết kế)

## 7. Danh mục hạng mục / task

(chưa có — chờ §6 ổn định)
