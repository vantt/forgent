# Validation Report — phase-2-routing, slice S2 (cửa đọc)

Date: 2026-07-14 · Lane: high-risk (panel 2 lăng kính luôn-có; slice đọc-thuần không kích lăng kính điều kiện) + cold-pickup reviewer (đều opus).

## Reality Gate

```text
REALITY GATE REPORT
Mode: high-risk (feature); S2 nội dung đọc-thuần
Current work: S2 = frontier query thuần + verb đọc `fgos ready` request-class, 2 cells nối tiếp.
MODE FIT: PASS       — lane feature-level giữ; panel rút về 2 lăng kính luôn-có đúng contract (không trigger security/product/migration).
REPO FIT: PASS       — S1 capped 3/3; suite 116/116 (chạy tươi bởi cả 3 reviewer độc lập); mọi file đích tồn tại hoặc là file mới trong scope.
ASSUMPTIONS: PASS    — matrix dưới, bằng chứng thực nghiệm từ feasibility persona.
SMALLER PATH: PASS   — 2 cells là tối thiểu: query thuần + verb lộ ra; gộp một cell là trộn lib với CLI surface.
PROOF SURFACE: PASS  — verify npm test chạy nguyên văn 116/116.
Decision: proceed
```

## Feasibility Matrix

| Assumption | Risk | Proof | Evidence | Result |
|---|---|---|---|---|
| FIFO derive được không cần sửa fold | MEDIUM | runtime probe | insertion-order của view.work: id luôn mở đầu bằng chữ (ID_PATTERN) → không bao giờ là integer-key, ECMAScript giữ thứ tự chèn; move mutate tại chỗ không re-key; probe zeta/alpha/mid ra đúng add-order | READY WITH CONSTRAINT (test phải dùng add-order phi-lexical — đã vá vào cell) |
| `ready` thừa hưởng ngữ nghĩa đọc của list | LOW | runtime probe | list ở dir trống → view rỗng, exit 0, KHÔNG tạo .fgos/; corrupt → exit 5 (test sẵn pin) | READY |
| Store facade nhận thêm export không phá gì | LOW | inspection | chỉ backward-compat.test import named {listWork}; không test nào pin full export surface | READY (readyWork là export chốt tên) |
| e2e mở thêm bước ready giữ isolation | LOW | inspection | mkdtemp per-test + spawnSync cwd temp; ready không ghi nên không xáo trộn snapshot | READY |

Spike: không cần — mọi giả định có probe/inspection.

## Panel

- **Coherence:** 0 BLOCKER, 1 WARNING low (shorthand deps trong plan §Cells) → **fixed**. Ngữ nghĩa frontier khớp byte-for-intent CONTEXT/D5/A2/R5; tách read-half của request-class là ranh giới slice chủ đích; không rò S3, không rework S1.
- **Feasibility:** 0 BLOCKER, 3 WARNING → **cả 3 vá vào cells** (test FIFO phi-lexical + không sort theo id; facade readyWork chốt tên, bin không import frontier trực tiếp; golden test giữ nghiêm so-byte).

## Cell review (cold pickup)

2 cells, **0 CRITICAL**, 4 MINOR → **cả 4 vá** (nêu đích danh cơ chế insertion-order + cấm sửa replay.mjs; store/events vào read_first cell 5; đáp án pattern-list ghi thẳng vào action).

## Approval Block

```text
VALIDATION COMPLETE - APPROVAL REQUIRED BEFORE EXECUTION
Mode: high-risk (S2 read-only content)
Work: slice S2 = 2 cells (phase-2-routing-4, -5)
Reality gate: PASS
Feasibility: READY WITH CONSTRAINTS (FIFO test phi-lexical; readyWork facade; golden byte-compare)
Structure: PASS after 1 iteration (0 BLOCKER; mọi WARNING vá trong vòng)
Spikes: none needed
Cell review: PASS (2 cells, 0 CRITICAL open)
Unresolved concerns: none — S3 giữ điều kiện chặn probe dispatch + spike worktree
```
