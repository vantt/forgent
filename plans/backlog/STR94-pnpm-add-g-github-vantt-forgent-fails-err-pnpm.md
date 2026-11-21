---
id: STR94
title: "`pnpm add -g github:vantt/forgent` fails: `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`"
status: done
priority: P2
area: general
created: 2026-07-23
---

# Why

(renumbered from STR88 -- ID collision found at merge time: main's own STR88, from a separate unpushed session, is an unrelated fgOS-plugin verb-wrapper feature. Feature slug `str88-fgos-pnpm-lifecycle` in `docs/history/` and bee decisions is unchanged, internal-only.) (ghi nhận 2026-07-23 từ friction `.bee/backlog.jsonl`, layer `install`, người dùng báo lỗi thật + đồng chốt root cause với một phiên agent khác) — `package.json`'s `scripts.prepare` chạy `node scripts/install-git-hooks.mjs`; script này đã no-op an toàn khi không có thư mục git metadata (`repo/scripts/install-git-hooks.mjs:8-20`, đã xác nhận đúng) — **lỗi không nằm ở logic script**. pnpm 10+ (qua `allowBuilds`) chặn CHẠY bất kỳ lifecycle script nào của một git-hosted dependency trước khi chạy nó, bất kể script đó làm gì — nên mọi user dùng `pnpm add -g github:vantt/forgent` đều dính `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED`, phải tự sửa `allowBuilds` trong `pnpm-workspace.yaml` mới cài được. Tái diễn với MỌI lần cài qua pnpm, không phải lỗi môi trường một lần; nhiều khả năng cũng ảnh hưởng các package manager strict khác (vd yarn PnP sau này) theo cùng cơ chế. **Fix đề xuất (đã thống nhất, per `str88-fgos-pnpm-lifecycle`):** bỏ `prepare` khỏi lifecycle tự động trong `package.json`; thêm `scripts.setup:hooks` (cùng lệnh) làm việc dev thủ công chạy 1 lần sau khi clone; thêm test chống-hồi-quy khẳng định `package.json` không còn `prepare` — loại bỏ hẳn trigger cho MỌI package manager, không riêng pnpm. Trade-off: contributor phải tự nhớ chạy lệnh setup 1 lần sau clone, đổi lại loại bỏ hoàn toàn friction cài đặt cho mọi người dùng cài qua git. Liên quan trực tiếp STR87 (cùng vùng install/setup) nhưng tách riêng vì đây là bug thật đang chặn cài đặt, cần fix độc lập, không chờ câu hỏi Rust-vs-Go của STR87.

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
