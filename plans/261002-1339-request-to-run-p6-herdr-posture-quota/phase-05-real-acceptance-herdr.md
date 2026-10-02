---
phase: 5
title: "Nghiệm thu thật qua herdr"
status: complete
priority: P1
effort: "1d"
dependencies: [3, 4]
---

# Phase 5: Nghiệm thu thật qua herdr

## Overview

Chạy thật trên store checkout chính, **trong một session herdr**, executor thật, để chứng minh G7 + posture + fallback. Bằng chứng là file trong `.fgos/`.

## Requirements

- Functional — mỗi ca ghi `unitRunId`/`workflowRunId`, đường dẫn `unit.json` / `events.jsonl` / outbox, **transport đọc từ run record**, executor/provider thật, thời gian, Lead-active:
  1. **Ca 1** (Unit docs, `reviewed`): producer + reviewer qua pane herdr; reviewer khác provider producer.
  2. **Posture live**: reviewer thử ghi file repo → bị chặn (bằng chứng: lỗi trong log pane/outbox); ghi outbox được.
  3. **Ca 2** architecture-advisory qua pane herdr; panelist/synthesizer khác provider; có ít nhất một vai trên openai (codex, tài khoản `fgovn` — owner đã đăng nhập lại 2026-10-02).
  4. **Fallback quota**: executor giả lập màn hình limit đứng đầu `prefer[]` → candidate kế chạy trong pane mới, pane cũ còn.
  5. **So engine cũ** (ca 2): worktree tại tag `pre-engine-retirement`, cùng câu hỏi qua engine; so số vai, độc lập, tới trạng thái cuối, thời gian, Lead-active. Không chạy được → NOT RUN + lý do.
  6. Headless (không herdr): ca 1 chạy cli với cùng posture.
- Non-functional: báo cáo `reports/acceptance-herdr.md`; ca nào không chạy → NOT RUN + lý do.

## Related Code Files

- Create: `reports/acceptance-herdr.md`

## Implementation Steps

1. Kiểm herdr có mặt (`HERDR_ENV`, `herdr` bin); không có → dừng, báo owner (cần session herdr).
2. Chạy 6 ca; thu bằng chứng từ file.
3. Viết báo cáo; commit.

## Success Criteria

- [x] 6 ca có bằng chứng file (hoặc NOT RUN + lý do); transport = herdr ở ca 1–4. Kết quả: ca 1, 2, 3, 4, 6 Accepted; **ca 5 NOT RUN** (lý do trong báo cáo); ca 4 dùng màn hình limit giả.

Báo cáo: [acceptance-herdr.md](./reports/acceptance-herdr.md) (trạng thái PARTIAL).

## Risk Assessment

- Agent thực thi plan không chạy trong session herdr → không thể nghiệm thu G7; báo owner mở session herdr, không thay bằng cli.
