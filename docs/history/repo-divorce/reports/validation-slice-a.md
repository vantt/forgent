# Validation Report — repo-divorce, slice A (công cụ + doctrine staged)

Date: 2026-07-14 · Lane: high-risk (hard-gate: data-loss-shaped) · Panel: coherence + feasibility + scope-guardian + cold-pickup (đều opus, ngữ cảnh cô lập).

## Reality Gate

```text
REALITY GATE REPORT
Mode: high-risk
Current work: slice A = 2 cells CHỈ TẠO FILE MỚI (script di trú + doctrine staged) — 0 mutation lên workspace thật.
MODE FIT: PASS       — hard-gate data-loss flag; panel + rehearsal-bắt-buộc là đúng giá.
REPO FIT: PASS       — feasibility persona đối chiếu cây thật: không repo/ collision, không worktree lạ, .git bình thường, distill hiện diện.
ASSUMPTIONS: PASS    — matrix dưới; giả định nặng nhất (move-nguyên-khối cho status sạch) được CHỨNG MINH bằng 2 probe mkdtemp.
SMALLER PATH: PASS   — script + staged là tối thiểu để diễn tập được; lệnh tay bị loại có lý do (không lặp lại được).
PROOF SURFACE: PASS  — verify cell 1 gồm dry-run chạy nguyên văn; cell 2 verify grep khẳng định deliverable.
Decision: proceed (slice A only — slice C bị chặn bởi rehearsal + Gate 3 riêng)
```

## Feasibility Matrix

| Assumption | Risk | Proof | Evidence | Result |
|---|---|---|---|---|
| Move + status sạch | HIGH | probe | TEST A move-một-phần → dòng D (FAIL như dự đoán ngược); TEST B move-nguyên-khối + untrack + TÁCH → sạch toàn tuyến, nested git không nuốt nhau | READY (trình tự 6 bước chốt theo TEST B) |
| Phân loại phủ kín cây thật | HIGH | inspection cây thật | mọi top-level tracked được liệt kê vào deny-list/product-list; entry lạ → DỪNG-HỎI chỉ cho tương lai | READY |
| scripts/ + test không lẫn sản phẩm | MEDIUM | bảng D2 addendum | scripts/ = xưởng; test tại scripts/repo-divorce.test.mjs, chạy tường minh trong verify | READY |
| Vá config không phá file | MEDIUM | inspection | .bee/config.json KHÔNG strict-JSON (trailing comma) — bắt buộc text-edit nhắm đích; friction P3 đã file cho bee | READY WITH CONSTRAINT |
| Hook paths sau tách | MEDIUM | inspection | .claude/settings.json trỏ $CLAUDE_PROJECT_DIR/.bee/bin/hooks/* — postcheck bước tách phải resolve | READY (postcheck trong script) |

## Panel — findings và trạng thái vá

- **Feasibility: 3 BLOCKER (probe chứng minh) + 2 WARNING → CẢ 5 XỬ.** B1 trình tự move sai + thiếu bước tách → viết lại thành 6 bước theo đúng TEST B, phân loại filesystem-level gồm đồ ignored, postcheck hook; B2 bảng D2 không phủ product roots → thuật toán deny-list/product-list/DỪNG-HỎI ghim vào cell; B3 scripts/ vô gia cư → addendum D2 + test dời khỏi cây sản phẩm; W4 config không strict-JSON → ràng buộc text-edit + friction; W5 verify string mới → đúng chỗ, chốt tại rehearsal. Iteration-2 confirm: 4/4 resolved; 3 vết trôi chữ → action cell 1 viết lại thành MỘT khối sạch (hết hai-trình-tự, artifact 6 bước, product = danh sách liệt kê + entry lạ mới DỪNG-HỎI).
- **Coherence: 0 BLOCKER, 2 WARNING → vá** (verify cell 2 giờ tự khẳng định deliverable bằng grep; brief bổ sung file test).
- **Scope-guardian: 0 BLOCKER, 1 WARNING → vá** (chính là mầm của B3 — bắt trước một nhịp). Không smuggle slice C, không gold-plating, D1–D4 không rơi, backlog P10–P12 khớp.
- **Cold-pickup: 0 CRITICAL, 5 MINOR → 4 vá** (thuật toán phân loại ghim; read_first cell 2 + platform-foundations; verify cell 2; test relocation), 1 ghi nhận (worker tự liệt kê từ ls-files — được phép tường minh).

## Approval Block

```text
VALIDATION COMPLETE - APPROVAL REQUIRED BEFORE EXECUTION
Mode: high-risk
Work: slice A = 2 cells (repo-divorce-1 script, repo-divorce-2 doctrine staged) — chỉ tạo file mới
Reality gate: PASS
Feasibility: READY WITH CONSTRAINTS (6 bước theo probe; text-edit config; test ngoài cây sản phẩm)
Structure: PASS after 2 iterations (3 BLOCKER thiết kế vá TRƯỚC khi có dòng code nào; 0 open)
Spikes/Probes: passed (mkdtemp TEST A/B — move semantics chứng minh thực nghiệm)
Cell review: PASS (2 cells, 0 CRITICAL open)
Unresolved concerns: none — slice C vẫn bị chặn bởi rehearsal bản sao + Gate 3 riêng
```
