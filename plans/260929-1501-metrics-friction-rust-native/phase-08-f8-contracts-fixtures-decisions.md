---
phase: F8
title: "Contract, golden fixture, decision record, doctor check"
status: done
priority: P1
effort: "1d"
dependencies: [F4, F5]
---

# Phase F8: Khoá ranh giới bằng contract và fixture

## Overview
Chuẩn hoá contract đã dùng thành file có version, sinh golden fixture từ writer thật, ghi decision record, và đăng ký doctor check. Phase này không đổi hành vi, nên chạy song song được với F6/F7.

## Requirements
- Contract dưới `packages/observe/contracts/`: `observe.observation` v1, `observe.friction` v1, `observe.case` v1, `observe.snapshot` v1. F7 thêm snapshot; nếu F8 xong trước F7 thì F7 bổ sung file này.
- Read contract của từng source ở crate owner: `packages/run-result/contracts/run-result.read.v1.json` (gồm các field đọc từ `assignment.json`) <!-- Red Team 2026-09-29 -->, `packages/coordination-state/contracts/session-events.read.v1.json`, `packages/work-state/contracts/work-events.read.v1.json`. Mỗi file ghi rõ tập field được đọc.
- Golden fixture:
  - các shard `friction/` và `cases/` sinh bằng chính CLI Rust;
  - store của owner sinh bằng CLI Node thật (`fgos init/add/move/...` trong thư mục tmp);
  - kèm `scripts/regenerate-observe-fixtures.mjs`.
  - Test Node (bên sản xuất) và test Rust (bên tiêu thụ) cùng assert trên fixture này.
- Decision record trong `docs/specs/observe.md` § Lịch sử quyết định:
  - một component Observe;
  - subject tầng nền; Work là source tuỳ chọn;
  - friction rời Work;
  - writer Rust duy nhất; CLI là cửa ghi cho mọi component; recursion guard chỉ còn cho `legacy-cli`;
  - `nativeOnly`;
  - không backward compat, supersede luật "Preserve current commands" của `node-to-rust-migration.md` cho `check/faults/dispatch-report/evolve`;
  - single path.
  - <!-- Red Team 2026-09-29 --> store Observe tracked, shard theo writer; migration theo cursor `(src, seq)`;
  - <!-- Red Team 2026-09-29 --> ghi friction là kênh phụ best-effort (lỗi thành `friction-write-failed` trong invocation-faults); resolve host theo env → release manifest → fault;
  - <!-- Updated: Validation Session 5 - Work ngừng đọc friction --> Work không đọc friction; friction CLI của Observe không join state của Work;
  - <!-- Red Team 2026-09-29 --> bỏ `learning.frictions` khỏi event đóng item và bỏ mục `frictions` khỏi output `list`/`show`;
  - <!-- Red Team 2026-09-29 --> map output của `check` và `evolve`: outcomes, settlement, learning, nag → `metrics outcomes`; `evolve --submit` → `friction rank` + `fgos submit`.
- `docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md` § Implementation Alignment: thêm một dòng ghi Observe là component đầu tiên được chuyển trọn sang Rust.
- Doctor check (`src/setup/registrations.mjs`, chỉ `registerCheck`, không có fix):
  - `observe-dir-writable`;
  - `observe-friction-migrated` (có record `migration`, và không có `work.friction` nào mới hơn cursor);
  - <!-- Red Team 2026-09-29 --> `observe-host-resolvable` (`resolveHostBin()` tìm được host đúng version; không thì friction sẽ rơi vào `friction-write-failed`).

## Related Code Files
- Create: `packages/observe/contracts/*.json`, `packages/{run-result,coordination-state,work-state}/contracts/*.read.v1.json`, `scripts/regenerate-observe-fixtures.mjs`, `test/fixtures/observe/**`
- Modify: `docs/specs/observe.md`, `docs/platform/component-boundary.md`, `docs/architect/proposals/component-authority-boundary-map.md` §6–7, `docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md`, `src/setup/registrations.mjs`, `docs/specs/reading-map.md`

## Implementation Steps
1. Viết contract dựa trên code đã chạy ở F2–F5, không viết từ trí nhớ.
2. Viết script regenerate. Chạy hai lần liên tiếp phải không có diff.
3. Thêm test assert fixture ở cả hai phía.
4. Viết decision record và cập nhật các docs ranh giới.
5. Thêm doctor check cùng test.

## Success Criteria
- [x] Regenerate fixture hai lần không có diff; test ở hai phía xanh.
- [x] `fgos doctor` có ba check mới (`observe-dir-writable`, `observe-friction-migrated`, `observe-host-resolvable`), cả ba pass trên forgentX.
- [x] Link check các docs đã sửa xanh.
