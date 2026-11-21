---
id: STR59
title: Sample project nhỏ để test khả năng vận hành thật của fgOS
status: done
priority: P2
area: general
created: 2026-07-18
---

# Why

(nêu ra 2026-07-18, trước khi tiếp tục STR50) — STR25 đã dogfood một lần bằng chính backlog/repo forgent làm test subject (2 item thật đi trọn vòng, `docs/history/dogfood-p25-run1/`); STR50 Phase 3 cũng cần một case-study thật nhưng đang deferred tới khi Phase 1+2 của STR50 xong (`docs/history/p50-workflow-induct/plan.md` Gate 2 #3). Việc: chốt qua bee-exploring xem sample project này target cái gì (fgOS hiện tại đã ship, hay layer skill-induction STR50 tương lai, hay cả hai), sống ở đâu (fixture trong `repo/`, repo riêng disposable, hay tái dùng chính repo forgent kiểu STR25), và có phải regression fixture bền hay chỉ chứng minh một lần. **Chốt 2026-07-18 (bee-exploring, `docs/history/fgos-sample-testbed/CONTEXT.md`):** cả hai target tuần tự (fgOS hôm nay trước, layer skill STR50 sau khi ship); fixture riêng trong `repo/`, không tái dùng backlog thật; regression fixture bền, giữ lại; Pass 2 của fixture này CHÍNH LÀ case-study STR50 Phase 3 đang deferred (một fixture, hai CoS)

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
