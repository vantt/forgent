---
type: explanation
title: 0018 — Mốc MVP2 của fgOS
tags: []
timestamp: 2026-07-27T00:00:00.000Z
source_capture_ids: []
date: 2026-07-27
status: accepted
source_decisions: [c8edac41]
relates_specs: [system-overview]
extends: [0016]
---

# 0018 — Mốc MVP2 của fgOS

## Bối cảnh

Quyết định `0016` chốt phát biểu MVP của fgOS: một người mới nộp MỘT yêu cầu
thật bằng văn xuôi tự do và nhận lại một thay đổi code thật, chạy được, có
test, sẵn sàng merge — với tối thiểu sự canh chừng của con người. MVP1 đã
chứng minh vế đó khi con người là người BẤM NÚT khởi động vòng lặp: nộp yêu
cầu rồi tự tay `pick` để hệ chạy tiếp không cần canh (`0016` điểm 2).

Việc còn lại là kiểm tra vế thứ hai: liệu VÒNG LÕI ấy (discover → decompose →
implement → return → review tới `done`) có ra kết cục TƯƠNG ĐƯƠNG hay không
khi không có bất kỳ cú bấm-tay nào khởi động nó — một dispatcher chạy độc lập
(`fgos-runner --once`) tự claim và tự đóng vòng, không cần con người chọn
việc. Đây chính là nội dung CoS đã amend của PBI `p-52601a01`
(`.bee/backlog.jsonl`, 2026-07-27T11:09:16Z): dựng và đối chiếu hai ca dry-run
sống trên testbed `repo/dogfood-fixture/` đã có sẵn — một do
`/fgOS:submit` + `/fgOS:pick` trong cùng phiên tương tác kích hoạt, một do
`/fgOS:submit` + `fgos-runner --once` độc lập kích hoạt — và ghi nhận kết
quả đối chiếu, không phải chỉ lập kế hoạch.

## Quyết định

1. **Phát biểu MVP2 (chốt, mở rộng `0016`):**

   > MVP1 (`0016`) đã chứng minh một yêu cầu do con người BẤM NÚT khởi động
   > đi trọn vòng lõi tới `done`. MVP2 chứng minh CHÍNH vòng lõi đó
   > (discover → decompose → implement → return → review tới `done`) đạt
   > kết cục TƯƠNG ĐƯƠNG khi khởi động **không có bất kỳ cú bấm-tay nào** —
   > một dispatcher chạy độc lập (headless) tự đóng trọn vòng, không cần
   > con người chọn việc.

2. **"Tương đương" có răng đo được (kế thừa khung đo của `0016` điểm 2):**
   cả hai ca — ca tương tác (`/fgOS:pick`) và ca headless
   (`fgos-runner --once`) — phải cùng đạt: verify xanh, một commit thật trên
   nhánh riêng của item, và dọn worktree sạch sau khi xong. Một khác biệt
   giữa hai kết cục là một GAP THẬT, được ghi nhận thành một dòng `proposed`
   mới trong `repo/docs/backlog.md`, không âm thầm bỏ qua.

3. **Trục MVP2 bổ sung cho trục MVP1, không thay thế:** `0016` chứng minh
   vòng lõi CHẠY ĐƯỢC khi con người khởi động; `0018` chứng minh CHÍNH vòng
   lõi ấy chạy được khi con người KHÔNG khởi động. Đây là cùng một vòng lõi
   được kiểm chứng dưới hai đường kích hoạt khác nhau, không phải một tính
   năng mới.

4. **Phạm vi MVP2 vẫn là "một yêu cầu → một code change"** — kế thừa nguyên
   trạng giới hạn phạm vi của `0016` điểm 4 (không đòi goal-directed
   planning). MVP2 chỉ đổi CÁCH vòng lõi được khởi động, không mở rộng
   những gì vòng lõi phải làm.

## Hệ quả

- Testbed và hạ tầng dùng để chứng minh MVP2 (`repo/dogfood-fixture/`,
  `repo/.fgos-runner.json`, `src/runner/worktree.mjs`) đã có sẵn từ trước —
  quyết định này không kéo theo việc dựng hạ tầng mới, chỉ ghi nhận phát
  biểu mốc và kết quả đối chiếu hai ca chạy thật.
- Bất kỳ khoảng cách nào giữa ca tương tác và ca headless được đối chiếu ra
  (kể cả trường hợp một trong hai đường không thể chạy an toàn với hạ tầng
  hiện có) là một phát hiện gap thật của chính mốc MVP2 này, được nạp vào
  `repo/docs/backlog.md` như một dòng `proposed`, không phải điều kiện thất
  bại của quyết định — quyết định vẫn đứng, gap trở thành việc kế tiếp.
- **Không supersede `0016`** — `0018` mở rộng trục MVP đã chốt bằng vế
  headless, không đổi phát biểu MVP1 hay luật L1–L10.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
