---
id: rul104-better-not-bigger
kind: law
owner: core
scope: repo
mode: append
specificity: 10
title: RUL104 — tốt hơn, không to hơn
description: When auditing or hardening what exists, each change makes it better (stabler, faster, lighter, simpler, clearer contracts), never bigger (D-ADR0062)
lifecycle: live
valid_from: 2026-11-26
---

# RUL104 — tốt hơn, không to hơn

Source: D-ADR0062, supersedes D-ADR0061, docs/platform/platform-foundations.md#d-adr0062-rul104-tốt-hơn-không-to-hơn-thêm-clean-code-và-hexagonal-supersede-0061.

Khi audit, soát lại hay làm cứng phần đã có, mỗi thay đổi phải làm thứ đang
có tốt hơn: ổn định hơn, nhanh hơn, nhẹ hơn, code đơn giản hơn theo các
nguyên tắc clean code và kiến trúc hexagonal (ports và adapters) khi áp dụng
được; API, signature và contract rõ ràng, tường minh, dễ dùng và uyển chuyển
hơn — trong phạm vi code đang có. Không làm nó to ra: không thêm tính năng,
lớp hay cơ chế mới; đổi một contract thì chuyển mọi caller và xoá đường cũ
trong cùng đợt (L10). Một tính năng chỉ được thêm khi thật sự đáng: gom mọi
ý tưởng thêm vào một mục riêng của báo cáo, mỗi ý ghi lý do (vấn đề thật,
bằng chứng) và lợi ích, và chỉ làm sau khi owner chọn.

tốt hơn, không to hơn
