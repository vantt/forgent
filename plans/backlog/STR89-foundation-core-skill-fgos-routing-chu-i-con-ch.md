---
id: STR89
title: Foundation-core skill (`fgos-routing` + chuỗi con) chưa domain-pluggable; ô `executing` hoàn toàn chưa có skill
status: done
priority: P2
area: general
created: 2026-07-23
---

# Why

(thảo luận 2026-07-23, tiếp nối STR50/STR18/STR52) — `fgos-routing` (`.claude/skills/fgos-routing/SKILL.md:79-83`) tự thú nhận "never decides which domain an item belongs to... the only domain this induction targets [is coding]"; bảng route-by-stage của nó (`:62-68`) bỏ trống đúng ô `executing`: "no skill to load here — mechanical build/verify/return path". Trong khi đó `src/state/workflow-stage-graphs.mjs` (STR18, done) đã chứng minh hạ tầng FSM đa-domain chạy được (`coding` 4-stage + `synthetic` minh hoạ song song) — chỉ thiếu tầng SKILL tương ứng theo domain, đúng cái STR52 (marketing domain thật) sẽ cần. Việc: (1) domain-pluggable hoá `fgos-routing` — đọc `item.domain`, tra `DOMAINS` registry, chọn đúng bộ skill theo domain thay vì hardcode coding; (2) xây skill mới lấp ô `executing` cho domain `coding`/software-dev trước (nội dung distill TAY — không tự động — từ kỷ luật implement→verify→cap của `bee-executing`, qua skill `distill` đã có); (3) domain `marketing` làm SAU, cùng khuôn, khi STR52's câu hỏi scope (chung store hay cài riêng) đã trả lời — không chặn slice software-dev. Người dùng xác nhận thứ tự: software-dev trước, marketing sau; và xác nhận cách distill: chủ động làm tay qua skill `distill`, chưa cần tự động hoá. **Ghi nhận thêm (audit 2026-07-23, finding #2):** `fgos-validating/SKILL.md` diễn đạt cạnh `decompose`→`executing` như một quy luật phổ quát, không check `transitions` registry của domain đang xử lý — an toàn hôm nay vì CAS (`stage.mjs`) chặn move bất hợp lệ ở tầng engine và domain `synthetic` (transitions rỗng) không có stage `decompose` nên chưa reachable, nhưng khi domain `marketing` (việc (3) trên) có `decompose` với transitions khác, `fgos-validating` cần cập nhật để không còn giả định cạnh này là phổ quát — đưa vào scope khi shape việc (3).

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
