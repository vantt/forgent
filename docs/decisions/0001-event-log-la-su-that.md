---
type: explanation
title: 0001 — Nhật ký sự kiện là sự thật; store/DB là bản chiếu dựng lại được
tags: []
timestamp: 2026-07-22T00:00:00.000Z
source_capture_ids: []
date: 2026-07-13
status: accepted
source_decisions: [ae461c8b, 451ca088]
relates_specs: [platform-foundations, work-state]
---

# 0001 — Nhật ký sự kiện là sự thật; store/DB là bản chiếu dựng lại được

## Bối cảnh

forgent cần bộ nhớ bền cho nhiều loại dữ liệu (trước hết là work-state của chính
nó, sau này các vùng khác). Cám dỗ mặc định là đặt một cơ sở dữ liệu làm *nơi chứa
sự thật*. Nhưng nơi-chứa-sự-thật là DB thì: khó dựng lại từ số không, khó audit,
khó time-travel, và khoá dự án vào một engine cụ thể ngay từ đầu — trong khi tải
thật (multi-writer, quy mô) chưa được chứng minh.

## Quyết định

Mọi mẩu dữ liệu bền của forgent được **khai ngay lúc thiết kế** là một trong hai
vật lý:

1. **Sự thật (log).** Nhật ký sự kiện *append-only*, dạng JSONL, **committed vào
   git**. Chỉ được thêm, không sửa/xoá điểm quá khứ.
2. **Bản chiếu (view).** Trạng thái hiện hành dựng lại được từ replay toàn bộ log.
   View **không bao giờ ghi ngược** vào sự thật.

Hệ quả trực tiếp của luật này:

- DB chỉ được phép xuất hiện khi đóng vai **materialized view**; graph store (nếu
  có) là view cấp hai. **Rebuild-from-zero luôn phải khả thi** từ log.
- Engine nặng (ví dụ SQLite) được **defer tới ngưỡng friction có bằng chứng** —
  không thêm sớm theo phỏng đoán.
- Ngưỡng xem lại **có tên**: khi multi-writer trở thành tải chính (mẫu "DB-as-truth"
  cho ghi đồng thời). Chạm ngưỡng mới mở lại luật; trước đó luật bất biến.

## Hệ quả

- **Audit & time-travel miễn phí:** trạng thái bất kỳ dựng lại được bằng replay.
- **Đổi engine không mất sự thật:** view là thứ thay được, log thì không.
- **Đơn giản hoá ghi:** một cửa ghi, một hướng chảy (log → view).
- **Chi phí chấp nhận:** replay tốn dần khi log lớn — chịu được tới ngưỡng đã đặt
  tên ở trên; qua ngưỡng thì xét engine, không phá luật.

Đổi luật này = supersede record bằng record mới, không sửa tại chỗ.
