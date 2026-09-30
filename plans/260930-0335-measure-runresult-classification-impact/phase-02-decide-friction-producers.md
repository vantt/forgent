---
phase: 2
title: "Quyết định producer friction"
status: pending
priority: P1
effort: "0.25d"
dependencies: [1]
---

# Phase 2: Cổng quyết định P1 / P3'

## Overview
Chỉ đọc `reports/impact.md` do [phase 1](phase-01-measure-impact-with-observe.md) viết. Không đo lại, không sửa code, không ghi friction. Trả lời hai câu hỏi còn mở của plan friction (xem [plan.md](plan.md)): P1 và P3' có dẫn tới hành động thật không, hay chỉ là nhiễu; P1 có cần ngưỡng không (ghi mọi lần `infra` hay chỉ từ lần thứ 2 trên cùng assignment). P3' dùng luôn `maxRounds` có sẵn nên không cần ngưỡng mới.

Quy tắc quyết định viết **trước khi có số**. Tham số X, Y, Z, W, N do owner chốt lúc validation — phase này **không tự đặt số**.

## Requirements
- Đọc đúng một artefact: `plans/260930-0335-measure-runresult-classification-impact/reports/impact.md`.
- Áp dụng quy tắc dưới đây lên số liệu (hoặc khoảng trống) trong báo cáo. Không đổi quy tắc cho khớp số.
- Ghi quyết định vào Validation Log của [plan.md](plan.md).
- Nếu giữ P1: viết chi tiết [phase 3](phase-03-dispatch-infra-failure-producer.md) (file/test/steps). Nếu giữ P3': viết chi tiết [phase 4](phase-04-coordination-max-rounds-producer.md).
- Nếu loại cả hai: đặt `status: completed` trên plan, ghi lý do, không viết thêm implementation.
- Số liệu nằm vùng mơ hồ, hoặc thiếu vì khoảng trống Observe: **hỏi owner**. Gom mọi câu hỏi thành **một lượt**.

## Quy tắc quyết định (tham số do owner chốt)

Viết dưới dạng so với số liệu. Giá trị X, Y, Z, W, N chưa chốt.

**P1 — có dẫn tới hành động / có làm producer không**
- Giữ P1 nếu tỷ lệ run `category === 'infra'` ≥ X% tổng run của **ít nhất một** executor (cửa sổ "sau" trong `impact.md`).
- Loại P1 nếu không executor nào đạt X%, **và** n (tổng run sau) ≥ N.
- n < N: chưa đủ dữ liệu — hỏi owner, không giữ cũng không loại im lặng.

**P1 — có cần ngưỡng không** (chỉ khi đã giữ P1)
- Ghi mọi lần `infra` nếu bucket lặp ≥2 (cùng assignment fail `infra` 2 lần hoặc ≥3 lần) chiếm ≥ Z% các assignment có ít nhất một fail `infra`.
- Chỉ ghi từ lần thứ 2 trên cùng assignment nếu bucket 1 ≥ Z% các assignment đó (phần lớn là fail một lần).
- Phân bố không lấy được (khoảng trống cắt số liệu): hỏi owner, mặc định **không** bịa ngưỡng.

**P3' — có dẫn tới hành động / có làm producer không**
- Giữ P3' nếu (số session chạm `aggregateBounds.maxRounds` / tổng session) ≥ W%.
- Loại P3' nếu tỷ lệ < W% **và** tổng session ≥ N.
- `impact.md` ghi khoảng trống Observe cho chỉ số này: **không** tự loại/giữ; hỏi owner.

**Vùng mơ hồ** (hỏi owner, một lượt)
- Đúng bằng ngưỡng, hoặc chỉ một executor lẻ đạt X% với n nhỏ.
- #4 cho thấy `infra` cao nhưng không gắn được với hành động (không có lần `ok` sau trên cùng assignment).
- Hai chỉ số phụ mâu thuẫn nhau (ví dụ `infra` cao nhưng gần như chỉ bucket 1).

## Success Criteria
- [ ] Validation Log có quyết định P1 (loại / giữ + ghi mọi lần / giữ + ngưỡng) và P3' (loại / giữ), kèm số liệu dẫn chiếu từ `impact.md`.
- [ ] Phase 3 và/hoặc 4 được viết chi tiết nếu producer tương ứng được giữ; nếu loại cả hai thì plan `status: completed` kèm lý do.
- [ ] Mọi câu hỏi cho owner (nếu có) được gom một lượt.

## Risk Assessment
- **Đổi quy tắc sau khi đã thấy số.** Cấm. Tham số chỉ do owner chốt, không do người chạy phase tự đặt.
- **Co khoảng trống Observe thành số 0.** Cấm. Khoảng trống → hỏi owner.
