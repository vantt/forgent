---
id: STR83
title: Slash-command surface (`/fgOS:submit`, `/fgOS:pick`) cho người ngồi trong AI terminal (Claude Code)
status: done
priority: P2
area: general
created: 2026-07-23
---

# Why

(nêu ra 2026-07-23, người dùng chỉ ra hôm nay phải tự gõ `fgos submit "..."` như một shell comment) — thay vì tay gõ CLI, `/fgOS:submit <text>` dịch xuống đúng verb `submit` sẵn có (`src/cli/command-registry.mjs:64`, tự phân loại tier/kind/risk + sinh id, per CTR001 một-cửa-ghi) KHÔNG mở đường ghi riêng; điểm MỚI so với `submit` hôm nay: trước khi gọi verb, đối chiếu text với các item đang có trong view (`fgos list`/`.fgos` state) để GỢI Ý `deps` khi mô tả rõ ràng phụ thuộc một item đã tồn tại — người xác nhận gợi ý trước khi ghi (rủi ro suy luận sai; không tự động áp, cùng nguyên tắc RUL42 (STANCE trí-tuệ-giao-việc) "gợi ý là input, không phải field cuối" mà STR7/STR8/STR38 đã chốt). `/fgOS:pick [id]` claim một item `ready` (frontier.mjs hoặc `fgos take`), rồi tự `createWorktree` (`src/runner/worktree.mjs`, hạ tầng ĐÃ CÓ cho runner) và chuyển phiên làm việc sang path đó, chạy tới khi item xong — cùng pattern dispatch-vào-worktree-mới mà `bee-herding` đã chứng minh cho backlog nội bộ của bee, áp lại cho backlog `.fgos` của người dùng cuối fgOS. **Liên quan trực tiếp STR38** (Human-UI listener: "increment đầu, không chờ contract xong — giao tiếp trực tiếp qua terminal/agent... chat modal item-scoped là client ĐẦU TIÊN của cổng") — feature này CHÍNH LÀ một hiện-thực cụ thể của increment đó, không phải ý mới; và **STR46** (hợp đồng in/out hạng nhất mọi transport cắm vào) là tầng trên nếu contract đó xong trước — cả hai vẫn `proposed`, chưa xây, nên feature này có thể đứng độc lập trước, không bắt buộc chờ. Cần bee-exploring riêng trước khi shape — gray-area thật: "chạy tới khi xong" của `/fgOS:pick` nghĩa là gì (một cell hay nhiều? review/approve gate ở đâu, ai là actor ghi field cuối khi agent trong worktree tự gọi verb — giữ đúng-một-actor theo RUL42 (STANCE trí-tuệ-giao-việc)?); và gợi-ý-dep tự động cần UX xác nhận cụ thể ra sao trước khi ghi `deps`

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
