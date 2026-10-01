# Prompt: tiếp tục plan tier/rigor (T): đóng phase 2, làm phase 3, 4, merge main

Dán phần dưới dòng `---` cho agent thực thi. **Mở agent trong `~/projects/forgentX-tier-rigor-consolidation`** (không phải checkout chính: plan T không có trên `main`, mở ở checkout chính sẽ báo "plan absent").

---

## Plan

`/home/vantt/projects/forgentX-tier-rigor-consolidation/plans/260930-0445-tier-rigor-vocabulary-consolidation/plan.md`. Đọc `plan.md` và cả 4 phase file trước khi làm.

Nhánh plan: `plan/260930-tier-rigor-consolidation`. Worktree nhánh plan: `~/projects/forgentX-tier-rigor-consolidation`.

## Trạng thái thật (2026-10-01 18:10)

| Phase | Trạng thái | Ghi chú |
|---|---|---|
| 1 | done, đã merge vào nhánh plan | |
| 2 | **code xong, suite xanh**; frontmatter còn `in-progress` | Đã merge vào nhánh plan (`92b52d28f` + hai correction). Sau đó discussion lead đã: merge `main` vào nhánh plan (`bced74bf5`, giải 3 xung đột theo RunResult v3), sửa fixture `test/fixtures/confinement-migrated-executors.json` sang `modelPolicies` + `rigorToTier` (`302cf1ed5`). Full suite trên nhánh plan trước fixture fix: 7836 pass / **1 fail** (đúng fixture đó, nay pass 20/20). 18 fail agent trước báo là do nhánh chưa có các bản sửa test baseline của main. |
| 3 | pending | Work: tách `work.tier` → `work.size` + `work.rigor` |
| 4 | pending | guard từ chết, doctor, docs, full suite, merge `main` |

## Việc

1. **Đóng phase 2:** chạy lại full suite trên nhánh plan (`env -u CLAUDE_CODE_SESSION_ID npm test`, không pipe qua `tail` khi cần mã thoát). Xanh → đánh dấu phase 2 `done` qua `ak plan` (xem `ak plan --help`); commit.
2. **Phase 3**, rồi **phase 4**, theo phase file. Mỗi phase: worktree riêng từ nhánh plan (`git worktree add ../forgentX-tier-rigor-p03 -b plan/260930-tier-rigor-consolidation--phase-03 plan/260930-tier-rigor-consolidation`); symlink `node_modules` **và** `target` ngay sau khi tạo; GitNexus `impact` trước khi sửa symbol; test trước; commit; merge vào nhánh plan.
3. **Phase 4 merge `main`:** trước khi merge, merge `main` mới nhất vào nhánh plan một lần nữa, giải xung đột, chạy full suite. Xanh → merge nhánh plan vào `main` (`--no-ff`). Checkout chính `/home/vantt/projects/forgentX` đang ở `main`: chạy `git merge` ở đó, **không** checkout nhánh khác trong checkout chính. Kiểm `pwd` + `git branch --show-current` trước mọi lệnh git.
4. Dọn worktree phase (p01, p02, p03, p04) sau khi plan merge `main`. Worktree `~/projects/forgentX-tier-rigor-p02` có `AGENTS.md`, `CLAUDE.md` bị sửa chưa commit (nhiều khả năng do GitNexus sinh lại): kiểm `git diff` trước, bỏ nếu chỉ là khối GitNexus.

## Ràng buộc

- `test/runner/dead-vocabulary-guard.test.mjs` là file plan này tạo; các plan sau (track request-to-run) sẽ **append** vào nó. Giữ cấu trúc dễ append (danh sách từ + phạm vi rõ ràng).
- Track request-to-run P1 chờ plan này merge `main`: giữ `capabilities.<cap>.rigor` (sàn rigor theo capability) đúng như phase 2 đã định; không thêm khối `capabilities.*.overrides`.
- Không chạy `fgos submit/pick/move/approve`.
- Hết context giữa chừng: commit những gì đã xanh, ghi trạng thái từng phase vào frontmatter và một dòng vào `plan.md` (đang ở phase nào, bước nào, commit nào), để agent kế nhận được.

## Bàn giao

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED
Phase 2/3/4: trạng thái + commit
Full npm test trên main sau merge: tests/pass/fail
Merge commit trên main
Concerns
```
