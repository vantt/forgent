---
title: Đổi tên định danh contract C1-C9 thành CTR001-CTR009
date: 2026-07-18
status: accepted
source_decisions: [9286e6f5]
relates_specs: [architecture-map]
extends: [0010]
---

# 0015 — Đổi tên định danh contract C1-C9 thành CTR001-CTR009

## Bối cảnh

`docs/id-systems-audit.md` (STR47) rà soát toàn bộ hệ đặt tên/đánh mã đang chạy
song song trong repo và phát hiện contract registry (`architecture-map.md`
§7) là hệ duy nhất còn dùng định danh một-chữ-cái-trần (`C1`-`C9`) — khác mọi
hệ đã có tiền tố 3-chữ tự khai type (`TSK`, `ADR`, `RUL`, `STR`). Một định
danh trần như `C2` không tự nói nó là contract khi xuất hiện lẻ trong chat,
git diff, hay log — người đọc phải tra ngược ngữ cảnh. Audit #6 chốt hướng
đổi sang tiền tố `CTR` (contract), cùng quy ước 3-digit zero-pad với `RUL<n>`
(ví dụ `RUL042`) để số lượng contract có thể vượt quá 9 mà không đổi độ rộng
định danh giữa chừng — ví dụ khoá trong audit: `CTR009`.

Backlog `STR54` submit hướng này thành việc thi công cụ thể: đổi mọi citation
`C1`-`C9` genuine trong 7 file + `architecture-map.md` chính nó, không đổi ý
nghĩa/ranh giới/maturity của bất kỳ contract nào.

## Quyết định

1. **Định danh contract đổi từ `C<n>` (một chữ số, không pad) sang `CTR<n>`
   3-digit zero-padded** — `C1` → `CTR001`, …, `C9` → `CTR009`. Tiền tố `CTR`
   bake-in type vào chính chuỗi id, tự khai "đây là contract" ở mọi nơi id
   xuất hiện, không phụ thuộc tầng hiển thị nào ghép nhãn hộ.
2. **Đây là đổi tên thuần (rename), không đổi nghĩa.** `CTR001` là cùng một
   contract với `C1` trước đây — cùng ranh giới, cùng hợp đồng, cùng
   maturity. Không có contract nào được thêm/bớt/định nghĩa lại bởi record
   này.
3. **`architecture-map.md` là bản chuẩn (record 0010) của registry này** —
   đổi tên áp dụng trước tiên ở đó (§6, §7, hai sơ đồ mermaid, changelog,
   câu hỏi mở), theo đúng nghi thức đổi bản đồ của chính nó (§9 luật 5: qua
   decision record + nâng version, không sửa ngầm) — nâng v0.4 → v0.5.
4. **Mọi nơi khác cite `C1`-`C9`** (specs, `platform-foundations.md`,
   `docs/decisions/0000-index.md`, `docs/backlog.md`) đổi theo cùng quy ước,
   trừ các chỗ đã xác nhận không phải citation của registry này (ví dụ một
   bảng verdict nội bộ không liên quan dùng trùng ký hiệu `C1`/`C2`/`C3`) —
   những chỗ đó giữ nguyên, không đổi.

## Hệ quả

- **0010 không bị supersede** — 0015 chỉ đổi cách viết định danh của registry
  đã khoá ở 0010, không đổi cấu trúc hay nội dung registry.
- **Không đổi schema, không đổi code** — đây là rename thuần văn bản trong
  tài liệu; không có contract nào đổi hành vi.
- **Nhất quán với các hệ đã đổi trước đó** (`TSK<hash>` cho work id, `ADR<n>`
  cho decision record, `RUL<n>` cho business rule) — hoàn tất mảnh #6 trong
  bảng audit `id-systems-audit.md`.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
