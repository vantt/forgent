---
type: explanation
title: 0017 — Đóng audit hệ id/tên gọi (STR47)
tags: []
timestamp: 2026-07-27T00:00:00.000Z
source_capture_ids: []
date: 2026-07-27
status: accepted
source_decisions: []
relates_specs: [architecture-map]
extends: [0004, 0015]
---

# 0017 — Đóng audit hệ id/tên gọi (STR47)

## Bối cảnh

`docs/id-systems-audit.md` (STR47, thảo luận đầu 2026-07-18) rà soát 13 hệ
id/tên gọi song song đang sống trong workshop + sản phẩm fgOS, tách thành hai
nhóm: 6 hệ **fgOS — sản phẩm vĩnh viễn** (#1-#6) và 7 hệ **bee — giàn giáo
tạm** (#7-#13), theo khung quyết định `0004-pham-vi-va-non-goal.md` (fgOS
chạy song song, không thay thế bee cho tới ngưỡng-có-tên). Sáu hướng đổi
định dạng mà audit chốt cho nhóm fgOS (#1, #3, #4, #5, #6 — #2 giữ nguyên)
đã lần lượt được submit thành các PBI riêng và thi công xong:

- STR53 — `work.id` bỏ slug, đổi sang `tsk-<hash>`
- STR54 — `C1`-`C9` → `CTR<n>` (decision `0015`)
- STR55 — chuẩn hoá trích dẫn rút gọn ADR → `ADR<n>`
- STR56 — `R#` → `RUL<n>`
- STR57 — Story (đổi tên khỏi "PBI") `P<n>` → `STR<n>`
- STR58 — script `next-doc-id` cho họ "next free integer thủ công"

Cả sáu đều mang trạng thái `done` trong `docs/backlog.md`. Nhóm bee (#7-#10)
— D-hex/D-local shape collision, cell-id, feature slug — chưa từng được bàn
tới điểm chốt trong bản DRAFT 2026-07-18. Record này đóng audit: khoá hướng
cho #7-#10, sửa `id-systems-audit.md` khỏi các chỗ đã trôi khỏi thực tế
shipped (draft viết trước khi STR53-STR58 thi công), và trả lời câu hỏi CoS
gốc của STR47 — giữ đa hệ có chủ đích hay hợp nhất.

## Quyết định

1. **Giữ đa hệ có chủ đích — không hợp nhất.** Sáu hệ fgOS (#1-#6) và bảy hệ
   bee (#7-#13) tiếp tục sống song song, mỗi hệ phục vụ đúng một tầng: fgOS
   là sản phẩm vĩnh viễn (tự sinh/tự đọc không phụ thuộc bee), bee là giàn
   giáo tạm cho giai đoạn xây fgOS (khung: `0004-pham-vi-va-non-goal.md`).
   Ranh giới dùng-khi-nào của cả 13 hệ được tài liệu hoá tại
   `docs/id-systems-audit.md` (nguồn) và `docs/architecture-map.md` Phụ lục B
   (bản tóm tắt, §12 trỏ vào).
2. **#7/#8 (D-hex global vs `D<n>` local) — không rename, khoá luật citation.**
   Thay vì đổi D-local thành `L<n>` hay bỏ hẳn bảng cục bộ, luật được khoá:
   **D-local không bao giờ được trích dẫn ngoài file `CONTEXT.md` gốc của
   nó.** D-local vốn đã single-file trong thực tế — rủi ro thật chỉ là kỷ
   luật trích dẫn, không phải hình dạng chữ `D` dùng chung; luật này đóng
   đúng rủi ro đó với chi phí migrate bằng 0.
3. **#9 (cell-id) và #10 (feature slug) — giữ nguyên, không format mới.**
   Cả hai convention-scoped (không phải enforced bằng regex chặt): cell-id
   (`.bee/bin/lib/cells.mjs` `ID_PATTERN`) chỉ có nguy cơ trùng trong PHẠM VI
   một feature và chưa từng va chạm thật; feature slug có tính duy nhất nhờ
   hiệu ứng phụ của cửa tạo worktree (`bee worktree new` từ chối branch/dir
   đã tồn tại), không phải nhờ định dạng id. Theo khung "giàn giáo tạm", cả
   hai không đáng đầu tư thêm.
4. **Phụ lục boundary cuối cùng đặt tại `docs/architecture-map.md`** (Phụ lục
   B mới, §12 thêm một dòng trỏ vào), không phải `docs/specs/reading-map.md`.
   `architecture-map.md` đã là nhà của sổ đăng ký anh em (contract registry
   §7, đổi tên bởi decision `0015`) — cùng một họ tài liệu. `reading-map.md`
   là bản đồ locator thuần cho toàn bộ tài liệu khác trong repo (không có
   mục `##` nào, mỗi dòng một bullet trỏ ra ngoài) — giữ nguyên vai trò đó,
   chỉ sửa một dòng mô tả đã trôi (§ dưới).
5. **`id-systems-audit.md` được cập nhật khỏi trạng thái DRAFT sang FINAL**,
   sửa mọi chỗ đã trôi khỏi thực tế shipped: §1 dòng #1 (định dạng đúng là
   `tsk-<hash>`, chữ thường + gạch nối — không phải `TSK<hash>` như draft đề
   xuất ban đầu), §4 (6 dòng migrate đổi từ "chốt hướng/chưa migrate" sang
   "đã migrate" kèm PBI đóng), câu "Chưa áp dụng gì vào code/docs thật" (sai
   sau khi STR53-STR58 chạy xong), và frontmatter (`status: DRAFT` →
   `FINAL`). `docs/specs/reading-map.md`'s mô tả `classify.mjs` (`generateId
   (slug+hash chống trùng)`) cũng sửa theo cùng lý do — cùng gốc trôi thời
   gian (draft viết 2026-07-18, trước khi migration chạy).

## Hệ quả

- **STR47 đóng** (`docs/backlog.md`: `in-flight` → `done`) — không có
  migration mới nào mở ra từ record này; mọi migration mà audit từng đề
  xuất (#1, #3, #4, #5, #6) đã thi công xong trước record này qua
  STR53-STR58.
- **Không đổi schema, không đổi code.** Đây là record đóng-audit + sửa tài
  liệu trôi thời gian; không hệ id nào đổi hành vi runtime bởi chính record
  này (các hệ #1/#3/#4/#5/#6 đã đổi hành vi từ trước, qua các PBI riêng của
  chúng — record này chỉ cập nhật tài liệu cho khớp).
- **0004 và 0015 không bị supersede** — 0017 chỉ đóng vòng lặp mà 0004 mở ra
  (khung giữ-đa-hệ) và xác nhận 0015 (CTR rename) là một trong sáu migration
  đã hoàn tất, không đổi nội dung của cả hai.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
