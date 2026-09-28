# Runbook: chạy hết plan bằng Claude thuần, song song có kiểm soát

Copy trực tiếp từ
`plans/260919-coordination-skill-harness-simplification/runbook-claude-only-parallel-execution.md`
(track vừa đóng), áp dụng nguyên xi cho track này. Đọc file gốc nếu cần
chi tiết đầy đủ; file này chỉ ghi lại phần khác biệt.

Áp cho: `plan.md` của track này, Phase 1 tới hết Phase 7 (Phase 8 là
decision gate, không có unit code).

## Khác biệt so với track gốc

- **Đơn vị = Phase**, không phải `I<n>`. Mỗi Phase trong plan.md là một
  unit (`unit/P<n>`), worktree
  `.claude/worktrees/dispatch-engine-liveness-P<n>-<slug>`. Nếu một Phase
  cần tách nhỏ hơn (hiếm, chỉ khi Phase đó tự có nhiều phần độc lập rõ
  ràng), đặt tên `P<n>a`, `P<n>b`.
- **Report path:**
  `plans/260928-2327-dispatch-engine-liveness-hardening/reports/unit-P<n>-claude-only-execution-report.md`.
- **File-overlap giữa Phase đã xác nhận** (Lead tự tính từ `plan.md`'s
  `### Work` của từng Phase, không đoán):
  - Phase 2 và Phase 4 cùng đụng `provider-capacity.mjs` — không song song.
  - Phase 2 và Phase 6 cùng đụng `assignment-runner.mjs` — không song song.
  - Phase 3 và Phase 7 cùng đụng `cli.mjs` — không song song.
  - Phase 6 và Phase 7 cùng đụng `assignment-runner.mjs` — không song song.
  - Phase 2 và Phase 7 cùng đụng `assignment-runner.mjs` — không song song.
  - **An toàn song song:** Phase 2 ‖ Phase 3 (rời nhau); Phase 3 ‖ Phase 4
    (rời nhau); Phase 4 ‖ Phase 6 (rời nhau).
- **Phụ thuộc thật** (không chỉ file, còn logic): Phase 2/3/4 phụ thuộc
  Phase 1 (cần judge đã gộp). Phase 5 phụ thuộc Phase 2 (cần in-flight
  check đã sửa xong mới quyết được `dispatch.claim` có còn cần không).
  Phase 7 độc lập về logic nhưng đụng file với Phase 2/3/6.
- **Phase 8 không phải unit implementation** — là 2 câu hỏi quyết định
  (S4, C4) Lead phải hỏi người dùng thật, không tự đoán. Có thể trả lời
  sớm hơn nếu một Phase khác cần câu trả lời trước (Phase hiện tại không
  Phase nào cần S4/C4 để tự đóng, nên có thể để cuối).
- Mọi luật khác (bất biến mục 2, song song mục 3, vòng lặp mục 5, prompt
  mục 7) áp dụng y nguyên từ file gốc — chỉ đổi `I<n>` thành `P<n>`,
  `plan.md`/`runbook` path thành của track này.

## Sóng dự kiến

| Sóng | Unit | Vì sao |
|---|---|---|
| A | P1 | nền tảng, tuần tự trước tiên |
| B | P2 ‖ P3 | sau P1; rời nhau |
| C | P4 (‖ P3 nếu P3 chưa xong) | rời P3; đụng file với P2 nên chờ P2 xong |
| D | P5 | phụ thuộc P2 xong |
| E | P6 | đụng file với P2, chờ P2 xong; có thể song song P4 nếu rời |
| F | P7 | đụng file với P2/P3/P6, xếp cuối cùng trong nhóm code |
| G | P8 | decision gate, hỏi người dùng, không phải lúc nào cũng chờ cuối — hỏi ngay khi rảnh một nhịp nếu người dùng có mặt; nếu không, để cuối và ghi rõ trạng thái BLOCKED-ON-USER khi tới lượt |
