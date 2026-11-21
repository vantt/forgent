---
id: STR76
title: "[MVP-BLOCKER · P1, DONE] Sau khi cài bản shipped, KHÔNG có đường discoverable-qua-PATH để khởi động vòng tự hành — người mới submit 1 request KHÔNG BAO GIỜ nhận lại code merge được (autonomous loop never starts)"
status: done
priority: P2
area: general
created: 2026-07-21
---

# Why

(tìm ra 2026-07-21 qua đo gap MVP 0016; cả desk-audit lẫn live dry-run npm-install-thật đâm CÙNG bức tường). Cụ thể: `package.json` `bin` chỉ map `fgos` (KHÔNG có entry `fgos-runner`); `fgos init` KHÔNG sinh `.fgos-runner.json`; bước doc chỉ dẫn `fgos discover <id>` chết `ENOENT .fgos-runner.json`, không có hướng khắc phục nào được doc (`bin/fgos.mjs:530-542,633-634`; `docs/history/mvp-gap-measure/reports/dry-run-findings.md:129-156`). KHÔNG phải "loop kẹt cần người gỡ" — tệ hơn: loop KHÔNG TỚI ĐƯỢC chỗ con người có thể can thiệp.

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
