---
phase: 5
title: "Cửa chạy fgos run + cổng ghi file kiểm chứng được"
status: pending
priority: P1
effort: "3d"
dependencies: [2, 3, 4]
---

# Phase 5: Cửa chạy `fgos run` + cổng ghi file

## Overview

Nối Unit + `bind()` + vòng lặp pattern thành **một cửa chạy** `fgos run` cho việc mới. Mỗi vai `bind()` → `executeAssignment` (out-of-process; herdr nếu có, cli nếu không — posture thật áp ở phase 6, phase này dùng confinement hiện có cho cli). Unit run = `unit.json` + assignments (Q-B). **Cổng ghi file mới kiểm chứng được** (Q9 + red-team mục 1, 2). Persona có nội dung. RunResult v4. Không xoá cửa cũ đang có caller (mục 8).

## Requirements

- Functional:
  - **Verb**: `fgos run --unit <file|->` `[--pattern <name|preset>] [--override <json>] [--resume <unitRunId>] [--dir <mainRoot>] [--json]`. Một lệnh chạy trọn Unit headless. `--override` từ CLI mang `origin: human-cli`; override do Lead dịch từ lời người mang `origin: agent`.
  - **`fgos run record`** chỉ cho **vai producer inline** của chính Lead (Q-A, mục 4): nonce một lần phát kèm chỉ dẫn; `evidenceRefs` bắt buộc và phải tồn tại; từ chối record lặp, từ chối record cho vai `reviewer`/`red-team`/panel hay vai đã bind out-of-process. `fgos dispatch log` gộp vào cửa này (một cửa ghi kết quả ngoài outbox) — đếm caller ở phase 1.
  - **Unit run (Q-B)**: tạo `.fgos/assignments/<unitRunId>/unit.json` = { unit, overrides, configSnapshot (hash + khoá runner liên quan, đọc từ **checkout chính/global**, không từ worktree — mục 12), worktree realpath, createdBy }; mỗi vai = assignment `<unitRunId>/<role>/<round>` (id tất định). Không store mới. `history()` cho pattern đọc từ các assignment này.
  - **Cổng ghi file (Q9, supersede ADR-006 §6)** — assignment `mutating` được admit khi **(a)** cwd là linked worktree **và** `realpath(cwd) == unit.json.worktree` của Unit run đó, **(b)** `bind()` **tính lại** từ `unit.json` (unit + overrides + configSnapshot) cho đúng vai/vòng khớp deep-equal với binding của assignment; không tin `provenance` caller gửi. Vai ghi file chạy posture `workspace-write` với grant rw theo `writes[]` (`confinement/policies.mjs` đã có `workspace-write`).
  - **Ngoại lệ có tên**: đường engine (`session-engine.mjs` → `executeAssignment`) giữ **protocol stamp** tới P4 phase 6 (chủ xoá). Cổng chấp nhận: stamp hợp lệ **hoặc** (a)+(b). Ghi rõ trong code + spec.
  - **Không xoá** `openDispatchRun`/`dispatch-runs`/`execute <executor>` (còn `spawnWorker` `loop.mjs:83,1035`, fan-out, 3 reader) — chỉ không dùng cho việc mới; xoá ở P3 phase 5.
  - **Resume**: `--resume` đọc `unit.json` + assignments; vai có attempt chưa có `result.json` → kiểm holder (lock `dispatch--<cwd>.lock`, pid) theo recipe hiện có; holder chết → attempt mới (`forceNewAttempt`); holder sống → báo, không chạy đè.
  - **`verify`** của capability chạy **confined** (posture read-only + quyền ghi thư mục output), không chạy trên host trần (mục 12).
  - **Persona có nội dung**: prompt render từ `core/agents/<persona>.yaml` (`persona`, `decision_boundary`, `voice`…).
  - **RunResult contract v4**: + `unitRunId`, `role`, `round`, outcome mở rộng (`findings`, `provider-limit`); Node `run-result.mjs` + Rust `packages/run-result/rust` cùng bump; Observe (`packages/observe/rust`) nhóm theo `unitRunId`.
  - `.gitignore` không cần thêm (không store mới) — kiểm `.fgos/assignments` đã ignore.
- Non-functional: `src/runner/execution/run.mjs` không import `src/state/**`, `worktree.mjs`, `merge.mjs` (tạo/tích hợp worktree là việc của P3a; P1 nhận worktree đã có qua tham số hoặc tạo bằng `git worktree add` thuần trong lõi — chọn ở phase 1).

## Architecture

```text
fgos run --unit u ─► validateUnit ─► unit.json (snapshot config từ main/global) ─► runPattern(…,
     runRole = role ─► bind() ─► assignment <unitRunId>/<role>/<round> ─► executeAssignment ─► RunResult v4,
     history = đọc assignments của unitRunId)
cổng mutating: posture worktree == unit.json.worktree ∧ bind(unit.json, role, round) == binding  (∨ stamp — chỉ engine, tới P4)
```

## Related Code Files

- Create: `src/runner/execution/run.mjs`, `test/runner/execution/run.test.mjs`, `test/cli/run-verb.test.mjs`
- Modify: `src/runner/dispatch/assignment-runner.mjs` (cổng mutating ~509-560), `execution-contract.mjs`, `assignment.mjs` (persona body ~714-765), `src/runner/run-result.mjs` (hoặc vị trí contract thật), `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `src/runner/dispatch-log.mjs` (gộp vào `run record`), `packages/run-result/rust/src/lib.rs`, `packages/observe/rust/src/case_journal.rs` + nguồn run

## Implementation Steps

1. GitNexus `impact`: `executeAssignment` (CRITICAL dự kiến → báo owner), cổng mutating, hàm persona, contract RunResult.
2. Test trước: Unit `reviewed` read-only chạy trọn headless; mutating ngoài worktree Unit → từ chối; binding tự chế/lệch snapshot → từ chối; config sửa trong worktree không có hiệu lực; engine stamp vẫn qua; `run record` cho reviewer → từ chối; nonce dùng lại → từ chối; kill giữa vòng 2 → resume đúng; persona body có trong prompt; Observe đếm theo `unitRunId`.
3. Viết `run.mjs`, verb, cổng, persona, contract v4.
4. Suite dispatch + coordination (engine phải xanh) + Rust → commit → merge vào nhánh plan.
5. **Điểm đo sớm**: chạy 1 area docs (thư mục thử) bằng `fgos run` cli; so Lead-active/vòng/thời gian với mốc; thua rõ → dừng, báo owner trước phase 6–7.

## Success Criteria

- [ ] Một lệnh chạy trọn Unit `reviewed` headless; checker không bao giờ inline.
- [ ] Cổng mutating có test dương/âm như bước 2; ngoại lệ stamp chỉ cho engine, có test.
- [ ] RunResult v4 Node + Rust; Observe nhóm theo `unitRunId`.
- [ ] Điểm đo sớm có số liệu, ghi vào `reports/early-measurement.md`.

## Risk Assessment

- **Supersede ADR-006 §6** chạm ranh giới an toàn → decision record ở phase 8; test âm bắt buộc. Tín hiệu hỏng: run ghi file ngoài worktree Unit → rollback merge phase.
- Bump contract RunResult làm Observe/Rust đọc sai dữ liệu cũ → đường đọc v2/v3 giữ (dữ liệu cũ đọc được qua một đường), test cả ba.
