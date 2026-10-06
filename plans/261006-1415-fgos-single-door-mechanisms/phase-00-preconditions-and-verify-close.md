---
title: "Preconditions and baseline evidence"
status: done
dependencies: []
requiresReview: true
---

# Phase 00 — Preconditions và verify-and-close

> Historical revision note: Revision ready — baseline evidence completed; implementation not started or authorized in that planning assignment.

**Current execution evidence:** baseline/preconditions complete; see [execution preconditions](reports/execution-preconditions.md) and [full-plan sync](reports/final-plan-sync.md). The CLI's zero-number rejection was resolved without a manual status edit: the owned file was temporarily renamed to unused Phase99, closed through the supported CLI, restored to this original path and reindexed. Phase00 frontmatter is now `done`; no temporary phase file remains. Downstream implementation proof is recorded in the phase reports; the historical baseline observations and future-work wording below describe the original snapshot, not current whole-plan progress.

Dependencies: none. Evidence completion is not implementation acceptance.

## Context links

- [plan.md](plan.md); synthesis [§5 V2, V4](../reports/harness-investigation-261006-synthesis.md), [§7 H1](../reports/harness-investigation-261006-synthesis.md)
- Evidence: cases M06, M10, T03, T06 trong [behavior-forensics-cases-261006.csv](../reports/harness-investigation-261006/behavior-forensics-cases-261006.csv)
- `AGENTS.md` "Prior art before design", `CLAUDE.md` "Impact-analysis capability gate"

## Requirements

1. Baseline đã được thu thập read-only trong [reports/phase-00-baseline.md](reports/phase-00-baseline.md), snapshot HEAD `b3d8fa4`. Không chạy lại để xác nhận quan sát đã báo; chỉ lấy số đo mới nếu cây thực thi đã đổi và ghi rõ snapshot.
2. H1d (M06) đóng bằng commit và caller hiện hành; T03 vắng trong snapshot, không suy ra mọi acceptance của plan đã qua.
3. PC1 đã xử lý bằng commit riêng `5df843bdb`; vẫn cần kiểm contemporaneous trước Phase 06, không tự revert thay đổi của người khác.
4. Impact-analysis khả dụng nhưng posture **degraded** vì index cũ 19 commit và bound main checkout; đối chiếu current-source search.
5. Historical confinement binding trả required `host-write-denied`, nhưng live enforcement chưa đo; `bind()+resolvePosture()` không phải sandbox proof. Phase 01 giữ source-binding smoke và config confinement đúng phạm vi single-door. Early runtime feasibility và installed advisory product/confinement acceptance thuộc [advisory capability completion](../261006-1408-advisory-capability-completion/plan.md), không phải prerequisite của plan này.

## Files

- Source/config/doctrine: **không sửa**. Báo cáo đã có tại `reports/phase-00-baseline.md`; chỉ bổ sung bằng chứng mới có provenance khi được giao. Không build, test, stage, setup hoặc đổi activation trong phase baseline.

## Steps

1. **PC1 completed snapshot; fresh gate retained.** Report §1 ghi main `AGENTS.md`/`CLAUDE.md` clean theo quan sát do parent cung cấp, thống kê GitNexus đã commit riêng `5df843bdb`. Trước Phase 06 kiểm trạng thái hiện tại và ownership của mọi diff mới; không commit lẫn hoặc discard chúng.
2. **Impact-analysis posture recorded.** Report §2: provider GitNexus present, indexed commit `b3346957`, HEAD `b3d8fa4`, stale 19 commit. Dùng explicit repository path thay vì tên `forgent` mơ hồ; mọi “0 caller”, nhất là `registrations.mjs`, phải đối chiếu tìm kiếm source hiện hành. Không reindex trong baseline.
3. **H1a baseline completed (report §3, raw Node scan).**
   - Baseline đủ **28** retired-token occurrences, đều trong `core/skills/fgos-architecture-panel/SKILL.md`: `claude-bwrap` (9) ở 134,137,163,191,223,224,225,229,606; `agy-bwrap` (10) ở 134,163,168,191,226,228,230,606,613,682; `codex-bwrap` (9) ở 134,159,171,191,194,227,230,231,607. Report §3 thay cho danh sách thiếu khối 134–171.
   - Configured model values: `gemini-3.1-pro-low`, `gpt-5.6-terra`, `gemini-3.1-pro-high`; thêm nonconfigured `gpt-5.6-sol` tại panel. Shape scan có hai historical model mentions trong `_shared/coding-worker-contract.md`; ghi allowlist historical riêng, không biến chúng thành scope rewrite mới.
   - `git log --diff-filter=D --oneline -- '*fgos-plan-loop/SKILL.md' '*fgos-code-panel/SKILL.md'` → `6527596eb`. Ghi đính chính: synthesis ghi `8eff54d0f`, commit đó chỉ đổi thành stub.
   - `node -e` đọc `.fgos/config.json`: `runner.pools` không tồn tại; roster nằm ở `runner.executors` và `runner.capabilities[*].prefer`.
4. **H1d verified closed (M06).** Report §4: `e92cfe66f` (tsk-c5u, shared playbook `_shared/catchup-self-recovery.md`) và `d74dfea58` (tsk-6av, approve owns recovery, merge callers thin); ba caller approve/merge-next/merge-loop hiện trỏ một playbook. Red flag approve là vượt retry ceiling hoặc bỏ evidence bar. Không thêm check; mirror protection tồn tại nhưng chưa được chạy trong baseline. M10 source bị xoá tại `6527596eb`.
5. **T03 completed absence evidence.** Report §5 raw Node scan tracked `src/`, `bin/`, `test/`, `scripts/`: 0 files/0 occurrences `FGOS_TEST_SUITE`; Phase 06 giữ anti-recurrence rule.
6. **Render baseline completed.** Report §6: `.agents` 53/53 thiếu; plugin 48/48 thiếu; `.claude/skills/fgos-*/**` có 37 markdown, 18 wrapper marker và 19 reference thiếu cả marker/header. Tổng 138 file, 120 thiếu cả hai; 18 wrappers không phải toàn bộ recursive target.
7. **Root baseline completed.** Report §7: 45 tracked root files; 32 additions lịch sử từ `ca854f443`, còn 30 tracked hiện tại. D2 move vào `docs/history/` cho số đích `45-30-1=14`. Main-only ignored `output.txt` 19 bytes; không tồn tại ở worktree này. G1 vẫn cần tag `pre-root-junk-cleanup` và xác nhận cuối lúc thi hành, chưa xoá gì.
8. **H6 ownership completed.** Report §8 xác nhận plan H6 chưa được authorize; không sửa `docs/specs/reading-map.md`.
9. **Extra inventories completed.** Report ghi 8 manifests, 2 có 233 `node_modules` entries, active có 0; 16 hook-test consumer files và 7 builder consumers liệt kê đầy đủ ở report. Không suy ra release integrity hoặc test pass.
10. **Historical advisory handoff.** Report ghi old eight-role/actors/specialist contract không map bằng roster-only edit; expanded advisory completion được chuyển sang [advisory capability completion](../261006-1408-advisory-capability-completion/plan.md). Giữ provenance của `bind()+resolvePosture()` như static binding evidence, không sandbox proof; old-v-current quality history **NOT RUN**, không phải gate hoàn tất single-door.

## Tests / validation

- Evidence gate đã hoàn thành: report có tám mục và ba extra inventories với provenance/snapshot. Không có tests chạy. Fresh PC1, Phase 01 source-binding/config-confinement acceptance, release drift và native implementation acceptance vẫn là bằng chứng tương lai. Advisory runtime/quality/product proof thuộc plan advisory riêng; không được đánh dấu xanh từ baseline và không chặn plan single-door.

## Risks

- Đếm qua rtk bị nén/cắt (synthesis §0b: 130 vs 3320). Mọi phép đếm dùng `rtk proxy` hoặc script Node.

## Rollback

- Không có gì để rollback.

