---
id: STR64
title: "[fgOS work — per decision `df90b761`, KHÔNG phải bee-tooling; mọi tham chiếu `bee-*`/`scribing`/`compounding`/`docs-manager` dưới đây là NGUỒN DISTILL, không phải đích sửa — xem compound-learn-enduser-docs's own decision on this]"
status: done
priority: P2
area: general
created: 2026-07-21
---

# Why

**Reconcile map:** "scribing+compounding" → khâu compound-learn của fgOS; "skill export/docs-manager/documentation-management.md" → skill export/tích luỹ đọc-theo-tag của fgOS (CHƯA xây). **Đã giao (feature compound-learn-enduser-docs, ~slice 1-2, reviewed):** bước (1) taxonomy Diataxis + bước (2) tag `docType` capture-time + 1 doc how-to thật. **CÒN LẠI (lý do reopen từ `done`, per STR73 premature-done + decision `f5f7f6d3`):** bước (3) skill export/tích luỹ đọc-theo-tag (soát `docs-manager`/`documentation-management.md` trước khi viết mới, YAGNI) + bước (4) backfill; mới 1/4 quadrant (how-to). **[bước-3 shape locked 2026-07-21, decision `1d336d8a` / CONTEXT's locked decisions]:** bước-3 giao **INDEX đọc-theo-tag** (machine-readable, key theo quadrant + purpose/audience + source-capture linkage), KHÔNG gộp/viết lại doc; docs-manager/ck:docs/documentation-management.md đã soát — không tái dùng được, build skill fgOS mới. CoS bậc-3 diễn giải lại + **user-accepted**: index đóng bước-3, phần gộp tài liệu ("gộp sống") là slice sau. **Row KHÔNG flip `done` chỉ vì xong bước-3** (per STR73). — nguyên văn ticket gốc (design reference): **Compound-learn embodiment (p50-workflow-induct slice 2) + tài liệu hướng end-user** — p50-workflow-induct's own decision đã defer "compound-learn" sang slice 2 từ đầu. Đào sâu `bee-compounding`/`bee-scribing`/`feedback.mjs` (2026-07-20) cho thấy bee có input cơ học ổn (CONTEXT/plan/report/cell-trace) và output "spec hiện trạng" ổn (`docs/specs/`, việc của scribing), nhưng **thiếu hẳn trục tài liệu HƯỚNG END-USER** (installation guide/runbook/usage/domain-knowledge/workflow-guide/Q&A) — bee chỉ phân loại theo trục kỹ sư (`pattern/decision/failure`). Đề xuất, người dùng đã đồng ý toàn bộ 2026-07-20, xếp theo impact: (1) chốt taxonomy trước — map vào khung **Diataxis** (Tutorial/How-to/Reference/Explanation) thay vì bịa danh sách riêng; (2) gắn tag phân loại NGAY tại khâu `scribing`+`compounding` lúc ghi nhận (field nhỏ thêm vào, không xây cơ chế mới) — tránh dồn nợ raw-chưa-phân-loại; (3) SAU ĐÓ mới xây skill export/tích luỹ đọc theo tag — soát lại `docs-manager` agent + skill `docs`/`documentation-management.md` đã có trước khi viết mới (YAGNI); (4) backfill nội dung cũ (critical-patterns.md, docs/decisions/) ưu tiên thấp nhất

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
