---
date: 2026-07-14
feature: phase-1-state-layer
categories: [verification, tooling, planning, patterns]
severity: P2
tags: [node-test, shell-glob, verify-command, event-sourcing, fsm, single-door]
---

# Learnings: phase-1-state-layer

## What Happened

Feature đầu tiên có runtime code của forgent (state layer: event log + FSM + CAS + CLI `fgos`) đi hết chuỗi exploring→compounding, 5 cells, 71/71 test, mỗi cell một commit. Hai sự cố thật giữa đường và hai near-miss bị chặn trước Gate 3.

1. **Verify command hỏng lọt qua validation.** Cell 2 mang verify `node --test test/state/` (dạng thư mục). Node 24 coi argument thư mục là module CJS → `MODULE_NOT_FOUND`; worker bị chặn, tái hiện độc lập ngoài repo, orchestrator sửa verify của 3 cells sang dạng glob rồi rescue. Điểm đau: Reality Gate của validation ghi PROOF SURFACE: PASS với đúng chuỗi lệnh hỏng đó — spike đã chạy chứng minh *năng lực* (node:test hoạt động) chứ không chạy *đúng chuỗi lệnh* của cell.
2. **Glob không quote nuốt test im lặng.** `scripts.test = node --test test/**/*.test.mjs` không quote: khi test/state/ ra đời, sh expand `**` như `*` → smoke test top-level rơi khỏi `npm test` mà vẫn exit 0. Chỉ bị bắt vì worker cell 2 nhìn số test thấy lạ và flag thủ công; cell 4 sửa bằng cách quote glob (node tự expand, globstar thật).
3. **Near-miss bị chặn đúng chỗ:** plan-checker bắt D1 không nằm trên cell nào (BLOCKER) + cell review bắt cell 4 trích "D5" chưa tồn tại trong bảng Locked Decisions (decision log có, bảng chưa promote) — cả hai sửa trước Gate 3.
4. **Harness thiếu verb:** không có verb ghi `.bee/config.json` `commands.*` và không có verb reopen cell blocked — hai lần hand-edit đúng thủ tục (friction đã log từng lần vào `.bee/backlog.jsonl`).

## Root Cause

1. Proof surface bằng văn ≠ proof surface bằng chạy: spike chứng minh capability, chuỗi verify literal chưa bao giờ được thực thi trước Gate 3.
2. Giao discovery file cho sh (glob không quote) thay vì cho test runner; không cell nào assert số test kỳ vọng nên suite co lại vẫn xanh.
3. Decision log và bảng Locked Decisions trong CONTEXT.md là hai chỗ ghi, drift được giữa chừng feature; chỉ vòng adversarial bắt được, chưa có check cơ học.
4. Gap thật của bee CLI, không phải dùng sai.

## Recommendation

- **Khi verify của cell là một chuỗi lệnh literal, validating phải chạy đúng chuỗi đó** (trên fixture tối thiểu) trước Gate 3 — spike chứng minh năng lực không thay được việc chạy đúng lệnh; prose kiểu "node --test X|Y" không phải bằng chứng.
- **Luôn quote glob truyền cho test runner** để runner tự discovery (sh `**` degenerate thành `*`); khi thêm thư mục test mới, so số test trước/sau — suite co lại mà vẫn xanh là lỗi, cân nhắc assert số test trong must_haves.
- **Khi một invariant tách qua hai cell kề nhau** (fsm quyết định / store ghi), ghi rõ NGAY TRONG PLAN module nào ghi, module nào chỉ quyết — đừng trông cậy vòng adversarial lần nào cũng bắt được.
- **Check cơ học đáng dựng (đã file friction cho bee):** grep mọi D-ID trong `decisions` của cells đối chiếu bảng Locked Decisions của CONTEXT.md trước Gate 3 — diệt hẳn lớp drift "trích quyết định chưa tồn tại".
- **Pattern tái dùng đã chứng minh** (trỏ `docs/specs/work-state.md` + `src/state/`): lỗi mang `category` ổn định → CLI map exit-code một chỗ; module quyết định thuần + một chủ ghi duy nhất; append-event-trước-view-sau với rebuild là đường phục hồi; path injection cho lib (chỉ CLI resolve cwd); test rebuild-determinism bằng binary thật trong tmp dir. Phase 2/3 và distillery consumer nên bám đúng bộ này.
