# Phase 00 Dirty Checkout Baseline

- Outcome: `baseline-stable`
- Source Commit: `81437ffffd81d2cf9c81720b646d2a6271d96099`
- Branch: `main`
- Node Environment: `v24.18.0`

## Lock Assessment
- Status: **stale**
- Evidence: File lock tồn tại với PID 1378496 (tiến trình zsh còn sống). Tuy nhiên, sử dụng `inspectMainCheckoutLock` từ mã nguồn nội bộ xác nhận lockAgeMs (hơn 3 giờ) đã vượt quá `DEFAULT_TTL_MS` (3 phút). Contract đánh giá đây là lock `stale` / có thể recover, không block an toàn của checkout.

## Fingerprint
- Algorithm: `dirty-checkout-fingerprint.v2` tạo JSON object chứa commit,
  branch, Node version, lockfile digest, danh sách
  `git status --porcelain=v2 --untracked-files=all -z` đã sort theo byte và
  loại trừ hai report tự tham chiếu, staged/unstaged diff digest, cùng SHA-256
  nội dung của từng untracked file. SHA-256 của JSON canonical payload là
  semantic fingerprint; timestamp không tham gia.
- Run 1 Digest: `b3ab4df0c5c43ede2b08ee9ab1acb43a7494ea0d3013569d33ac52d3004fcdbf`
- Run 2 Digest: `b3ab4df0c5c43ede2b08ee9ab1acb43a7494ea0d3013569d33ac52d3004fcdbf`
- Run 3 Digest: `b3ab4df0c5c43ede2b08ee9ab1acb43a7494ea0d3013569d33ac52d3004fcdbf`

Ba artifact do lần đo đầu tạo (`scratch_fingerprint.sh`,
`fingerprint1.txt`, `fingerprint2.txt`) đã được owner cho phép xoá ngày
2026-09-20. Chúng không còn trong checkout và không tham gia fingerprint v2.

## Inventory
| Path | Status | Purpose | Evidence | Action |
| --- | --- | --- | --- | --- |
| `.agents/skills/fgos-plan-loop/SKILL.md` | Tracked modified | Generated projection cần đối chiếu canonical source | Đường dẫn file thuộc loại projection | `preserve` |
| `.fgos/config.json` | Tracked modified | Pre-existing product change cần giữ nguyên | Không thuộc scope sửa đổi track này | `preserve` |
| `AGENTS.md` | Tracked modified | Pre-existing product change cần giữ nguyên | Không thuộc scope sửa đổi track này | `preserve` |
| `CHANGELOG.md` | Tracked modified | Pre-existing product change cần giữ nguyên | Không thuộc scope sửa đổi track này | `preserve` |
| `CLAUDE.md` | Tracked modified | Pre-existing product change cần giữ nguyên | Không thuộc scope sửa đổi track này | `preserve` |
| `core/skills/fgos-plan-loop/SKILL.md` | Tracked modified | Thay đổi thuộc coordination close/recheck đang làm dở | Thuộc scope close/recheck | `preserve` |
| `docs/architect/agent-coordination/contracts/coordination-session.md` | Tracked modified | Thay đổi thuộc coordination close/recheck đang làm dở | Thuộc scope close/recheck | `preserve` |
| `docs/platform/agent-coordination/README.md` | Tracked modified | Pre-existing product change cần giữ nguyên | Không thuộc scope sửa đổi track này | `preserve` |
| `docs/platform/agent-coordination/contracts/coordination-session.md` | Tracked modified | Thay đổi thuộc coordination close/recheck đang làm dở | Thuộc scope close/recheck | `preserve` |
| `docs/specs/runner.md` | Tracked modified | Pre-existing product change cần giữ nguyên | Không thuộc scope sửa đổi track này | `preserve` |
| `plugins/fgOS/skills/fgos-plan-loop/SKILL.md` | Tracked modified | Generated projection cần đối chiếu canonical source | Đường dẫn file thuộc loại projection | `preserve` |
| `src/runner/coordination/session-engine.mjs` | Tracked modified | Thay đổi thuộc coordination close/recheck đang làm dở | Thuộc scope close/recheck | `preserve` |
| `test/runner/coordination-recheck-discharge.test.mjs` | Tracked modified | Thay đổi thuộc coordination close/recheck đang làm dở | Thuộc scope close/recheck | `preserve` |
| `.fgos/instructions/effective/repo.json` | Untracked | Generated projection cần đối chiếu canonical source | Đường dẫn file thuộc loại projection | `preserve` |
| `count.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `debug_args.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `debug_spec.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `dump.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `fix_assignment.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `fix_herdr.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `fix_herdr2.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `fix_openSession.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `fix_openSession2.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `fix_openSession3.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `fix_openSession4.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `fix_openSession5.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `fix_openSession6.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `fix_openSession_safe.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `fix_test_legacy.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `fix_tests.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `openSession.txt` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `original.txt` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `patch_cli.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `patch_dispatch_test.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `plans/260919-coordination-skill-harness-simplification/phase-00-baseline-and-action-contract.md` | Untracked | Documentation của track hiện tại | Đường dẫn thư mục track hiện tại | `preserve` |
| `plans/260919-coordination-skill-harness-simplification/plan.md` | Untracked | Documentation của track hiện tại | Đường dẫn thư mục track hiện tại | `preserve` |
| `plans/reports/coordination-skill-harness-architecture-audit-260919-report.md` | Untracked | Documentation của track hiện tại | Đường dẫn thư mục track hiện tại | `preserve` |
| `reverse.patch` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `rewrite_store.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `scripts/migration-proof-2a.mjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `store_refactor.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `test_atomics.mjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `test_concurrency.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `test_concurrency.log` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `test_concurrency2.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `test_concurrency2.log` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `test_herdr.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `test_regex.cjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `timed-executor.mjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |
| `timed-executor2.mjs` | Untracked | Debug/reproduction artifact / Log tạm | Extension .cjs, .log, .mjs, script tự do | `exclude-from-track` |

## Blockers
- Không có.

## Ready for Unit 0B
- Yes.
