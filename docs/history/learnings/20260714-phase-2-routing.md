---
date: 2026-07-14
feature: phase-2-routing
categories: [reliability, crash-recovery, validation, patterns]
severity: P2
tags: [runner, worktree, sigkill, panel, e2e, event-sourcing]
---

# Learnings: phase-2-routing

## What Happened

Phase 2 trọn vẹn qua 3 slice (substrate → cửa đọc → runner), 10 cells, 82→234 test, panel kịch trần 5 lăng kính ở S3. Một chuỗi đáng giá: panel reliability bắt **3 blocker thiết kế trước khi có dòng code nào** (reap sau crash, retry-tái-dùng-nhánh, breaker in-memory) — cả ba đúng ngay lần thực thi đầu, không rework. Nhưng bug orphaned-checkout **vẫn ship** trong cell 8 và chỉ bị e2e giết-thật (SIGKILL) của cell 9 bắt → [BLOCKED] → cell fix-first 10 → cell 9 cap lại với e2e nguyên trạng làm regression test.

## Root Cause

1. **Crash được mô hình hóa như dữ kiện, không như hiện trường vật lý.** Thiết kế reap + unit test của cell 8 dựng "crash" bằng cách ghi commit/status trực tiếp — không bao giờ để lại một registration `git worktree` dở dang thật. Bug chỉ tồn tại khi process bị giết thật và sổ sách worktree của git sống sót. Chỉ e2e SIGKILL thật tái hiện được.
2. **Panel đặc tả end-state, bỏ ngỏ cơ chế kiểm.** Finding (a) nói reap "resolve theo nhánh" nhưng không nói *bằng cách nào* — kiểm verify đòi checkout nhánh vào worktree, và chính bước đó va với checkout mồ côi. Bug crash-recovery tụ ở "how", không ở "what".
3. **Một test xanh đã mã hóa triệu chứng bug làm hợp đồng:** test cũ "createWorktree throws khi nhánh đang checked out" chính là hành vi lỗi được đóng dấu là đúng.
4. Friction thiếu verb reopen-blocked-cell tái diễn lần 2 nguyên văn (P1SL-2 rồi P2R-9), vẫn P3, không escalate — hand-edit `.bee/` thành nhiễu thường trực.

## Recommendation

- **Mọi đường crash-recovery phải có ít nhất một test GIẾT THẬT process giữa thao tác** (SIGKILL, không phải fixture dữ liệu) — fixture chứng minh logic phân lớp, không chứng minh sự tái hiện hiện trường. Đã promote critical-patterns.
- **Panel reliability cho recovery/reap trên state ngoài (git/fs/process): đòi probe CƠ CHẾ KIỂM cụ thể, không chỉ end-state.**
- **Test "X throws" trên đường lỗi thuộc họ crash/recovery là ứng viên xét lại** mỗi khi đường đó bắt đầu được exercise thật — xanh không đồng nghĩa đúng hợp đồng.
- **Friction tái diễn nguyên văn lần 2 → escalate severity + cross-ref lần trước** (đã áp: reopen-verb lên P2, gửi bee).
- Pattern tái dùng đã chứng minh (chi tiết trong spec runner + contract doc): recovery-matrix thuần testable; schema-evolution version+defaults-tại-fold với fixture từ binary cũ; tier→model qua config committed; derive thuần từ event log; reap idempotent theo dữ kiện quan sát được; hợp đồng handoff bằng văn cho skill tương lai.

## Đối chiếu vòng học

Chi phí panel S3 (5 reviewer) hoàn vốn tại chỗ: 3 blocker vá ở tầng thiết kế + 2 lỗi bị chặn trước Gate 3; phần lọt lưới duy nhất nằm đúng ở lớp mà chỉ e2e vật lý chạm được — và test đó cũng do panel yêu cầu (crash-idempotency case, reliability finding f). Vòng "panel đòi test → test bắt bug → fix-first cell → e2e thành regression" là compound loop chạy thật đầu tiên của forgent.
