---
title: Runner & cô lập worker — executor headless, người-ghi-duy-nhất, đề xuất trên nhánh
date: 2026-07-14
status: accepted
source_decisions: [feed7428, 14396a5c]
relates_specs: [runner, work-state]
---

# 0005 — Runner & cô lập worker

## Bối cảnh

Lớp state cần một "máy" thật để vòng recovery và anti-loop được **kiểm bằng chạy
thật**, không phải bảng chính sách treo. Đây cũng là bước đầu của hướng nhiều-agent
chạy song song. Đồ bảo hộ phải có máy để bảo vệ.

## Quyết định

- **Runner tối thiểu, vòng lặp thật:** đọc frontier → lấy một việc → dispatch →
  thu kết quả → ghi qua `fgos`. Recovery matrix + anti-loop **sống trong runner** và
  được test bằng vòng chạy thật.
- **Executor = agent headless.** Prompt dựng từ chính work item (tiêu đề/loại/tham
  chiếu/verify). **`verify` của item do RUNNER tự chạy** làm goal-check độc lập —
  không tin lời worker tự khai.
- **Trong vòng dispatch, runner là NGƯỜI GHI DUY NHẤT** qua `fgos`; worker **không
  bao giờ tự gọi `fgos`**. (Giữ tiền đề single-writer của 0001 — phá là chạm ngưỡng
  mở lại luật.) Quyền ghi của người vận hành *ngoài* vòng dispatch giữ nguyên.
- **Worker chạy trên nhánh/worktree cô lập; kết quả là ĐỀ XUẤT** — commit trên nhánh
  + báo cáo. Con người (hoặc một vòng review được gọi riêng) duyệt rồi mới merge.
  **Worker không bao giờ sửa thẳng working tree chính.**
- **tier→model:** schema `work` thêm trường `tier`; runner đọc bảng map tier→model
  từ config khi dispatch worker (giao việc rẻ cho model rẻ).
- **Anti-loop đọc raw events:** đếm số lần thăm một việc cần đọc event thô, nên store
  có thêm một accessor **chỉ-đọc** trả về event thô; **cửa ghi duy nhất không đổi**.

## Hệ quả

- **Sai thì vứt nhánh:** runner tự hành được mà không cần phòng tuyến hoàn hảo ngày
  đầu — kết quả xấu nằm trên nhánh cô lập, không đụng cây chính.
- **Recovery/anti-loop là hành vi được test,** không phải lời hứa trên giấy.
- **Cost-tiered delegation** ngay từ vòng dispatch.
- **Single-writer bảo toàn:** một cửa ghi trong lúc chạy tự động → không tranh ghi.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
