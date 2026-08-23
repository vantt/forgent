# CONTEXT — tsk-3tp: Sweep checkpoint redesign cho `.fgos/events`

## Feature boundary

Đổi CÁCH và THỜI ĐIỂM commit `.fgos/events/` shard lên git history của main
checkout: bỏ commit chuyên dụng theo timer/đếm-event, thay bằng gom (sweep)
shard dirty vào các merge/approve commit sẵn có + một fallback thưa. KHÔNG
đổi: nơi event được ghi (main checkout working dir), cơ chế visibility
(đọc working dir qua `--dir`), `events.lock`/write-queue, ADR0020
(worktree không mang `.fgos/`), merge guard `.fgos-write-rejected`.

Item này repurposed từ "Tầng B — worker ghi `.fgos/` trong worktree" (đóng
vĩnh viễn theo D3). Toàn bộ lịch sử thảo luận, bằng chứng đo đạc, và scout
upstream: `DISCUSSION.md` cùng thư mục (7 mục, §5 có Q&A log 7 vòng).

## Quyết định đã chốt (từ decision log, `fgos show tsk-3tp`)

| D-ID | Quyết định | Seq |
|---|---|---|
| D1 | `.fgos` state phải sống cùng một git history với code (in-repo) — bác nested-repo/separate-ref; mọi thiết kế write-path phải thỏa constraint này. | 23876 |
| D2 | Xóa checkpoint-commit chuyên dụng; thay bằng sweep — gom dirty `.fgos/events/` shard vào chính các merge/approve commit main đằng nào cũng tạo + fallback thưa. Visibility coordination vẫn là working-dir append tức thì, không đổi. | 23877 |
| D3 | Tầng B (worker/worktree ghi `.fgos/` từ trong worktree, ngoại lệ merge-guard) đóng vĩnh viễn — ADR0020 giữ nguyên không ngoại lệ; tsk-3tp repurpose tại chỗ thành item sweep checkpoint redesign. | 23878 |

## Pinned terms

- **Coordination event** — `work.move`/`work.stage`/`work.add` (~40% volume
  đo trên 23.847 event thật): cần visibility toàn cục tức thì để chống
  double-claim. Visibility đến từ working-dir append, KHÔNG phụ thuộc commit.
- **Narrative event** — decision/discovery/outcome/gate/friction/… (~55-60%):
  chuyện của item đang làm.
- **Sweep** — hành vi gom file shard dirty dưới `.fgos/events/` vào một
  commit mà main đằng nào cũng đang tạo (merge/approve), thay vì tạo commit
  riêng chỉ để chở metadata.
- **Fallback thưa** — commit vét cho khoảng lặng không có merge nào
  (~60 phút hoặc end-of-session), thay timer 15ph/50-event hiện tại.

## Scout evidence (đọc thật, không suy diễn)

- `src/state/events-jsonl-truncation-guard.mjs:195-209,264-380` — cơ chế
  checkpoint hiện tại: `PERIODIC_CHECKPOINT_INTERVAL_SEC = 900`,
  `DEFAULT_CHECKPOINT_EVENT_THRESHOLD = 50`, commit message
  `chore(.fgos): periodic events.jsonl checkpoint`, opt-out env
  `FGOS_DISABLE_OPPORTUNISTIC_CHECKS`, caller truyền `commitEnv` (holder
  pid cho pre-commit hook re-check). Caller: `merge.mjs` (dòng ~788/911
  vùng opportunistic checks) và `src/runner/claim-port.mjs`.
- `src/runner/merge.mjs:17,856,1217` — merge path đã là staged-verify:
  `git merge --no-commit --no-ff` → check `.fgos-write` → verify → commit.
- `.gitignore:4-5` — `state.json` đã gitignored ("events.jsonl is truth
  (committed); state.json is a derived view").
- Report 21/8 (`plans/reports/investigation-260821-1050-...`): 17 commit
  checkpoint trong <13h, catchup 2 lần/40ph trên tsk-577p — churn thật.
- Upstream (scout 23/8, source thật): beehive không commit coordination
  (gitignored + lockfile + ledger main-only); harness commit changeset do
  orchestrator quyết thời điểm — không upstream nào commit coordination ở
  cadence mịn. Chi tiết: DISCUSSION.md §5 vòng 4.

## Canonical references

- `DISCUSSION.md` cùng thư mục — toàn bộ lý lẽ, bảng so sánh 3 hệ, audit
  upstream. Anchor của item này: `DISCUSSION.md#task-sweep-checkpoint`.
- `docs/specs/runner.md` — D-ADR0020 (block-tree), D-ADR0001 (event log là
  sự thật, git-committed).
- Dep cứng: `tsk-3ve` (Tầng A T3-T6) — shard/replay/compaction phải land
  trước; điều kiện an toàn của coarse cadence đứng trên đó.
- Item liên quan, KHÔNG thuộc scope: `tsk-2l8` (lock self-heal),
  `tsk-34o5` (attestation level 2).

## Outstanding questions

None — mọi điểm thiết kế đã chốt D1-D3; các lựa chọn còn lại (tham số
fallback, vị trí hook sweep chính xác) là chuyện của plan.md/implementer,
không phải product decision.
