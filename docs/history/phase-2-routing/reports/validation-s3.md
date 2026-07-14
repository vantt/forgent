# Validation Report — phase-2-routing, slice S3 (runner)

Date: 2026-07-14 · Lane: high-risk · Panel ĐẦY ĐỦ: coherence + feasibility + reliability + security (trigger: spawn ngoài + retry/timeout) + cold-pickup — 5 reviewer opus + 2 probe chặn.

## Reality Gate

```text
REALITY GATE REPORT
Mode: high-risk
Current work: S3 = runner tuần tự (4 cells: recovery/anti-loop → dispatch/worktree → loop → e2e + handoff contract).
MODE FIT: PASS       — lát rủi ro nhất của feature: external spawn, vòng tự hành; panel kịch trần đúng contract.
REPO FIT: PASS       — S1+S2 capped, 138/138; store facade + frontier + FSM proposed sẵn; mọi file runner là mới trong scope.
ASSUMPTIONS: PASS    — matrix dưới, mọi dòng probe thật.
SMALLER PATH: PASS   — 4 cells là phân rã tối thiểu (bảo hộ thuần → dispatch → vòng → e2e); gộp là trộn testable layers.
PROOF SURFACE: PASS  — verify npm test nguyên văn 138/138; suite S3 dùng executor GIẢ, không đốt token agent thật.
Decision: proceed
```

## Feasibility Matrix (probe chặn + panel probes)

| Assumption | Risk | Proof | Evidence | Result |
|---|---|---|---|---|
| `claude -p` headless chạy được máy này | HIGH (chặn) | probe thật | orchestrator: claude 2.1.208, `-p` trả "OK" exit 0 | READY |
| Worktree + nhánh lifecycle | MEDIUM (chặn) | probe thật ×2 | commit worker sống trên nhánh sau remove; duplicate branch lỗi rõ (255); cleanup từ repo gốc | READY |
| visitCount derive từ events | MEDIUM | probe | work.move payload đủ (id, to); probe đếm 3 lần vào doing đúng | READY |
| Verify chạy trong worktree trần | LOW | inspection | repo zero-dep, npm test không cần install; e2e temp-repo dùng verify tự chứa | READY (constraint ghi vào cell 9) |
| {prompt} substitution an toàn | MEDIUM | probe | per-element argv + shell:false round-trip multi-line/ký-tự-shell nguyên vẹn | READY (argv-only ghim vào must_haves) |
| Timeout kill | LOW | probe | spawnSync timeout SIGTERM ~309ms, phân lớp worker-timeout được; caveat grandchild ghi nhận | READY |
| Anti-loop đọc raw events | MEDIUM | inspection | store thiếu cửa đọc raw → decision 14396a5c: thêm readRawEvents chỉ-đọc (giữ một-nơi-resolve-path) | READY |

## Panel — findings và trạng thái vá

- **Reliability (đinh nhất): 3 BLOCKER + 3 WARNING → CẢ 6 VÁ vào cells.** (a) lớp `stale-doing` + startup reap (runner chết giữa chừng không còn làm item vô hình — reap resolve theo nhánh: verify pass → proposed, không → blocked); (b) retry = fresh-worktree-REUSE-branch + reset về head nhánh + removeWorktree trong `finally` mọi đường kể cả halt; (d) breaker chuyển per-run in-memory (khớp A1/--once), visitCount vẫn event-derived với semantic khai rõ; (c) lớp `state-conflict` → halt sạch sau cleanup; (e) listLeftovers nối vào reap, policy nhánh mồ côi (rỗng → prune, có hàng → giữ); (f) e2e crash-idempotency case thêm vào cell 9.
- **Coherence: 0 BLOCKER, 2 WARNING → vá** (park pre-claim đổi về cạnh `todo→blocked` đúng D5 — sửa cả fact FSM sai trong cell text; breaker đã xử ở trên). Xác nhận: sole-writer, không auto-merge, goal-check nhất quán, tier→model reconcile đúng chỗ S1 đã hứa.
- **Security: 0 BLOCKER, 4 WARNING → vá** (brief nói thật: chống đỡ bằng chỉ dẫn + nhánh-vứt-được, KHÔNG sandbox — residual risk chấp nhận trong single-user; bất biến "item do chính user tạo, verify chạy như shell" thành văn; argv-không-shell ghim must_haves; output runtime không vào cây committed — `.fgos/runs/` gitignored).
- **Feasibility: 0 BLOCKER, 1 WARNING → decision 14396a5c** (readRawEvents) + 3 note ghi vào cells.
- **Cold-pickup: 0 CRITICAL**, minors vá (read_first hoàn chỉnh chuỗi lib; park semantics thống nhất).

## Approval Block

```text
VALIDATION COMPLETE - APPROVAL REQUIRED BEFORE EXECUTION
Mode: high-risk
Work: slice S3 = 4 cells runner (phase-2-routing-6..9)
Reality gate: PASS
Feasibility: READY WITH CONSTRAINTS (executor giả trong suite; readRawEvents chỉ-đọc theo decision 14396a5c; verify e2e tự chứa; argv-only spawn)
Structure: PASS after 1 iteration (3 BLOCKER reliability phát hiện ở tầng thiết kế — vá TRƯỚC khi có dòng code nào; 0 BLOCKER open)
Spikes/Probes: passed (claude -p, worktree ×2, visitCount, argv substitution, timeout)
Cell review: PASS (4 cells, 0 CRITICAL open)
Unresolved concerns: none
```
