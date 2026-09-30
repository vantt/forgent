---
title: "Đo tác động RunResult classification bằng Observe"
status: pending
priority: P1
created: 2026-09-30
blockedBy: [260929-1703-runresult-classification-single-path]
blocks: []
---

# Plan: Đo tác động RunResult classification bằng Observe

Nguồn: Tách từ Phase 6 của plan [RunResult single path](../../archive/plans/260929-1703-runresult-classification-single-path/plan.md) sau khi Phase 1–5 đã hoàn tất và merge vào `main`.

## Outcome

Đánh giá định lượng tác động thực tế của việc chuyển RunResult sang `classification` single path và ghi nhận `usage` token:
- **#3 (Review pass vòng đầu):** Đo lường chính xác tỷ lệ review pass ngay vòng đầu mà không cần ước lượng.
- **#4 (Phân loại run fail):** Tách bạch rõ rệt run fail do lỗi hạ tầng (`infra`) vs run fail do chất lượng (`verdict`), theo từng executor và adapter.
- **Chi phí & usage:** Ghi nhận token thật từ các executor phi-Claude (`pi`, `codex-cli`).

## Điều kiện kích hoạt

Plan này ở trạng thái chờ tích luỹ dữ liệu (bake period):
- Cần tối thiểu **1 tuần** kể từ thời điểm merge (2026-09-29) hoặc tối thiểu **50 run mới** trên `main`.
- Khi đủ điều kiện, chạy:
  ```bash
  /ak:cook plans/260930-0335-measure-runresult-classification-impact/plan.md
  ```

## Phases

| # | Phase | Effort | Phụ thuộc | Trạng thái |
|---|---|---|---|---|
| 1 | [Đo tác động bằng Observe](phase-01-measure-impact-with-observe.md) | 0.5d | — | pending |

## Success Criteria

- [ ] Tính lại baseline "trước" và thu thập dữ liệu "sau" bằng cùng một luật phân nhóm (`deriveOutcome`).
- [ ] Báo cáo `reports/impact.md` hoàn thành với đầy đủ số liệu #3, #4 và usage.
