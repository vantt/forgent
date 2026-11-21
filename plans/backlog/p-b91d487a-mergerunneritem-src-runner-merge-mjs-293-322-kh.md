---
id: p-b91d487a
title: "`mergeRunnerItem` (`src/runner/merge.mjs:293-322`) không có kiểm \"đã merge sẵn rồi\" trước khi thử `g"
status: proposed
priority: P2
area: general
created: 2026-07-28
---

# Why

`mergeRunnerItem` (`src/runner/merge.mjs:293-322`) không có kiểm "đã merge sẵn rồi" trước khi thử `git commit --no-edit` sau `git merge --no-commit --no-ff`: nếu nhánh con ĐÃ được merge vào nhánh cha từ một lượt `approve` trước (thành công tới bước merge nhưng lỗi ở bước SAU đó — vd `p-73d99989`'s tình huống, hoặc bất kỳ lỗi nào khác xảy ra sau merge-commit nhưng trước status-move `done`), `git merge --no-commit --no-ff` lần sau là no-op (không gì để merge), verify vẫn chạy qua vì code đã có sẵn, nhưng `git commit --no-edit` chết vì "nothing to commit" — approve ném lỗi `MergeError` mập mờ ("verify passed but git commit failed") thay vì nhận ra merge đã xong và tiến thẳng qua bước status-move. Phát hiện dogfood thật (decision 0018, item `tsk-1wd-1`, 2026-07-28): lượt `approve` đầu tiên merge THÀNH CÔNG (`c90c5bb` lên `fgw/tsk-1wd`, xác nhận qua `git log`) nhưng chết ở bước status-move `done` vì thiếu stage `compound-learn` (lỗi độc lập, xem chú thích); chạy `fgos compound tsk-1wd-1` xong rồi approve LẦN 2 thì dính đúng lỗi này — không có đường retry sạch, phải tự tay `fgos move` qua trạng thái `done` để gỡ. Hệ quả chung: BẤT KỲ lỗi nào xảy ra sau khi merge-commit đã landed nhưng trước status-move hoàn tất đều khiến item kẹt vĩnh viễn ở retry — không riêng tình huống compound-learn cụ thể này.

# Done when

`mergeRunnerItem` kiểm nhánh con đã w-merged-vào-cha chưa (vd `git merge-base --is-ancestor <branch> HEAD`) trước khi thử merge; nếu đã merge sẵn, coi như `outcome: 'merged'` luôn (idempotent), không thử commit lại; dogfood xác nhận `approve` retry sau một lỗi hậu-merge (bất kỳ nguyên nhân nào) tự phục hồi sạch, không cần `fgos move` tay

# Notes

Migrated from the legacy backlog table. Original status: proposed.
