# Runner bounded truth correction accounting

Author: codex-session:unit-run-1792060810360-fc3c5695@2026-10-15

Input commit: `24be6cb1d`. Working candidate content is committed by the runner after this turn. This is an author accounting document, not a review pack, verdict or native identity proof. A41/A19/A22; full truth review remains owed at promotion. No source decision record is rewritten to erase superseded history.

23 bounded sentence/assertion replacements; six link-only rebases; 13 added boilerplate removals. Replacement counts refer to edit ranges (some are wrapped sentences), not a new truth-sample denominator.

## 1. A41 F-A: plan sweep may dispatch reviewer

Carrier: `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`. Evidence read before edit: `src/runner/loop.mjs:1641-1655`; `domains/coding/workflows/feature.yaml:75-82`.

Before:

```text
Bước quét này KHÔNG gọi model: nó chỉ cho đi thẳng một item mà bản kế hoạch đã ghi tự khai là một-mảnh, mọi trường hợp khác nó không làm gì cả và chờ một phiên sống phán tay
```

After:

```text
Bước quét này có thể gọi reviewer qua `executeDriverOperationChoice` khi workflow chọn operation `validate-plan`; kết quả reviewer quyết định có được đi tiếp hay không
```

## 2. A41 F-B: remove model-call denial

Carrier: `docs/platform/runner/operations/h-51f5cd7279fd.md`. Evidence read before edit: `src/runner/loop.mjs:1641-1655`.

Before:

```text
- **Side effects:** KHÔNG có lời gọi model nào ở bước này.
```

After:

```text
- **Side effects:** bước này có thể chạy reviewer assignment cho operation `validate-plan` do workflow khai báo.
```

## 3. A41 F-B continuation: validation precedes plan resolution

Carrier: `docs/platform/runner/operations/h-51f5cd7279fd.md`. Evidence read before edit: `src/runner/loop.mjs:1641-1678`.

Before:

```text
 Quét của runner
  không mang theo phán quyết của người/phiên nào, nên nó chỉ đi một trong hai
  đường: bản kế hoạch đã ghi của item tự khai một cỡ việc một-mảnh (không
  chia được nữa) → item đi thẳng sang `executing`; mọi trường hợp còn lại →
  runner không làm gì cả, item nằm nguyên chờ một phiên sống tự phán rồi gọi
  verb chia-việc tay. Đây là fail-safe có chủ đích: sinh con là hành động GHI
  thật, không bao giờ được đoán — khác quét nghiên-cứu, nơi worker tự phán
  được vì phán quyết ở đó không ghi ra item mới nào (fail-safe, xem spec
  Work-State RUL48 (cấu hình runner tự sinh tại đường mặc định khi vắng mặt — không bao giờ đòi người tạo tay trước) (work-state)).
```

After:

```text
 Sinh con là hành động GHI thật, không được đoán; runner dùng kết quả operation validation và chỉ chuyển tiếp khi `canAdvanceEdge` cho phép.
```

## 4. A41 F-D: capacity lock is a directory

Carrier: `docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md`. Evidence read before edit: `src/runner/dispatch/provider-capacity.mjs:44-49`.

Before:

```text
lock ở `~/.fgos/runtime/provider-capacity/state.lock`
```

After:

```text
lock là thư mục `~/.fgos/runtime/provider-capacity/state-lock`
```

## 5. A41 F-D: recovery has 14 classes

Carrier: `docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md`. Evidence read before edit: `src/runner/recovery.mjs:126-141`.

Before:

```text
8 lớp: hỏng-spawn, quá-giờ, chấm-trượt, hỏng-worktree, nhật-ký-hỏng, đề-xuất-bị-trả, việc-kẹt-do-crash, tranh-chấp-ghi
```

After:

```text
14 lớp: `worker-spawn-fail`, `worker-timeout`, `verify-miss`, `verify-timeout`, `worktree-fail`, `corrupt-log`, `reject-returned`, `stale-doing`, `state-conflict`, `dispatch-in-flight`, `dispatch-depth-exceeded`, `provider-limit`, `worker-failed`, `no-executor`
```

## 6. A41 F-E: item log receives pointer and settled output

Carrier: `docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md`. Evidence read before edit: `src/runner/loop.mjs:349-351`; `src/runner/loop.mjs:1110-1112`; `src/runner/loop.mjs:1150-1163`.

Before:

```text
Cùng file còn nhận chunk stdout/stderr LIVE khi worker đang chạy (STR39, xem "Xem live output worker khi đang chạy") — `tail -f` thấy được ngay, không đợi khối kết-cục cuối
```

After:

```text
Trong lúc worker chạy, file nhận con trỏ tới capture của Unit run; khối output được nối sau khi run kết thúc
```

## 7. A41 F-E: remove raw live-chunk claim

Carrier: `docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md`. Evidence read before edit: `src/runner/loop.mjs:1110-1112`.

Before:

```text
xen giữa các khối kết-cục là chunk thô không bọc, ghi ngay khi đến
```

After:

```text
con trỏ Unit run được ghi khi run được tạo
```

## 8. A41 F-E: replace removed live tee with run capture

Carrier: `docs/platform/runner/operations/h-51f5cd7279fd.md`. Evidence read before edit: `src/runner/loop.mjs:349-351`; `src/runner/loop.mjs:1110-1112`; `src/runner/loop.mjs:1150-1163`.

Before:

```text
- **Runs when:** ngay mỗi khi một chunk stdout/stderr của trợ lý ĐẾN —
  trong lúc worker VẪN ĐANG CHẠY, không đợi lượt dispatch kết thúc (khác
  với khối kết-cục cuối trên, chạy ĐÚNG MỘT LẦN sau khi worker đã xong).
- **What changes:** chunk thô (không header/dấu thời gian, không bọc) được
  nối thẳng vào CÙNG file `.fgos/logs/<id>.log` của chính việc đó — qua
 đúng cửa ghi worker-log.mjs (một-cửa, không mở cửa ghi thứ hai). Mỗi
  việc chỉ ghi vào file của chính nó nên N việc dispatch song song không
  bao giờ giẫm dòng nhau. Khối kết-cục cuối (trên) vẫn chạy nguyên vẹn sau
  đó, không đổi — file cuối cùng mang cả live chunk lẫn khối tổng kết.
```

After:

```text
- **Runs when:** khi Unit run được tạo, runner ghi một con trỏ vào log của item.
- **What changes:** output trong lúc chạy được capture dưới `.fgos/assignments/<unitRunId>/producer/*/runs/*/protected/capture/`; khi settle, output nằm trong `stdout.log` của run và khối output được nối vào `.fgos/logs/<id>.log`.
```

## 9. A41 F-E: item-log tail does not stream worker chunks

Carrier: `docs/platform/runner/operations/h-51f5cd7279fd.md`. Evidence read before edit: `src/runner/loop.mjs:349-351`; `src/runner/loop.mjs:1150-1163`.

Before:

```text
- **Afterwards:** người vận hành `tail -f .fgos/logs/<id>.log` trong lúc
  việc đang `doing` thấy output đến theo thời gian thực, thay vì phải đợi
  worker xong mới đọc được gì. Nền cho chiều-ra của STR38/STR40 (UI tail +
  tmux pane).
```

After:

```text
- **Afterwards:** `tail -f .fgos/logs/<id>.log` thấy con trỏ Unit run trong lúc chạy; đọc capture của run để xem output trước khi khối kết-cục được nối sau settle.
```

## 10. A41 F-F: reconcile supports three actions

Carrier: `docs/platform/runner/architecture/h-69197b459754.md`. Evidence read before edit: `src/runner/dispatch/reconciliation-planner.mjs:203-206`; `src/runner/dispatch/reconciliation-planner.mjs:225-233`; `src/runner/dispatch/reconciliation-planner.mjs:529-534`.

Before:

```text
`collect-result`, `clear-assignment-claim`, and `repair-projection`
```

After:

```text
`collect-result` and `repair-projection`
```

## 11. A41 F-F: remove unsupported action description

Carrier: `docs/platform/runner/architecture/h-e53a3a9829a8.md`. Evidence read before edit: `src/runner/dispatch/reconciliation-planner.mjs:225-233`.

Before:

```text
, `clear-assignment-claim --assignment
<id>` (removes a dead-holder `dispatch.claim` once no admitted-but-
unmaterialized launch, unsettled Run, or uncollected result is still pending
for that Assignment; also refused on a CoordinationSession-owned claim),
```

After:

```text
,
```

## 12. A41 F-F: reconcile action count

Carrier: `docs/platform/runner/architecture/h-e53a3a9829a8.md`. Evidence read before edit: `src/runner/dispatch/reconciliation-planner.mjs:225-233`.

Before:

```text
Four actions are supported:
```

After:

```text
Three actions are supported:
```

## 13. A41 F-G: Iron Law has no entropy-module rule

Carrier: `docs/platform/runner/operations/h-51f5cd7279fd.md`. Evidence read before edit: `src/evolve/iron-law.mjs:20-45`.

Before:

```text
    module tính-điểm-entropy, mọi file trong nhóm tự-cải-thiện (chính vòng
    evolve),
```

After:

```text
    mọi file trong nhóm `src/evolve/`,
```

## 14. A41 F-H: replace stale live-config assertion with verified current schema; live config not read under assignment boundary

Carrier: `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`. Evidence read before edit: `src/runner/dispatch/config.mjs:457`; `src/runner/dispatch/config.mjs:1015-1023`.

Before:

```text
`.fgos/config.json` SỐNG của chính repo này CHƯA migrate (`agy.kind` vẫn `"cli"`, `gitnexus`/`herdr` vẫn hình dạng cũ) — khác `runner.capabilities` (RUL trên, tsk-in1-3, thuần cộng thêm nên nạp được ở cả code cũ lẫn mới), đổi `kind` là đổi PHÁ VỠ tương thích ngược: code cũ từ chối thẳng `kind:"agent"/"tool"`. Nên KHÔNG commit thẳng lên `main` như các item liền trước (ADR0020 (chặn .fgos/ khỏi worktree worker — fgw/<id> không symlink lẫn bootstrap-copy .fgos/, merge.mjs từ chối cứng diff chạm .fgos/)'s "commit trực tiếp lên main, tách khỏi vòng đời code" chỉ an toàn khi dữ liệu mới còn tương thích code cũ) — phải land ĐỒNG THỜI với code của `fgw/tsk-in1` khi nhánh đó được merge lên `main`, không phải trước.
```

After:

```text
schema hiện hành chỉ nhận executor `kind: "agent"` hoặc `"tool"`; `kind: "cli"` bị validator từ chối. Không dùng câu CHƯA migrate của slice cũ để mô tả cấu hình repo hiện tại.
```

## 15. A41 Data Dictionary: removed effort door

Carrier: `docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md`. Evidence read before edit: `bin/fgos.mjs:960-980`; `src/runner/dispatch/cli.mjs:1268-1274`.

Before:

```text
Cửa compat `fgos dispatch execute --effort` (plain, `--assignment`, `--contract`) và `reasoningEffort` của operation policy đi cùng hàm kiểm đó.
```

After:

```text
Cửa `fgos dispatch execute` (plain, `--assignment`, `--contract`) đã bị xoá; dùng `fgos run --effort` hoặc `reasoningEffort` của operation policy.
```

## 16. A41 F3: trunk detection already exists

Carrier: `docs/platform/runner/subcomponents/h-2e032393add1/spec.md`. Evidence read before edit: `src/runner/merge.mjs:38-40`; `src/runner/merge.mjs:267`; `src/runner/worktree.mjs:255-290`.

Before:

```text
- Tên nhánh trục (trunk) của cổng duyệt hiện là literal `"main"` (`merge.mjs`) — một host project dùng tên nhánh trục khác (vd `master`) sẽ gãy `approve`/`review`; đề xuất là tự phát hiện trunk lúc init/config thay vì literal (friction filed khi viết e2e cell pr-lifecycle-3, layer task-spec, severity P3 — xem `.bee/backlog.jsonl`).
```

After:

```text
- Tên nhánh trục của cổng duyệt được phát hiện bằng `detectTrunk(repoRoot)` (origin/HEAD, rồi local `main`/`master`); không còn hardcode literal `"main"`.
```

## 17. A41 F2: replace deleted entropy pointer

Carrier: `docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md`. Evidence read before edit: `packages/observe/rust/src/metrics_cli/entropy.rs:1-8`; `packages/observe/rust/src/metrics_cli/entropy.rs:107-127`.

Before:

```text
- `src/report/entropy.mjs` — thuần, không fs/Date.now(): `computeEntropy(view)` → `{score, parts}` (5 tín hiệu có trọng số, mỗi phần giải thích được); `computeCounts(view)` → tổng phẳng outcome/friction/settlement cho seal-digest; đọc/ghi lịch sử xu hướng (`.fgos/logs/entropy-history.jsonl`, gitignored, kể từ phase-01 plans/260825-0842-fgos-logs-dir-bucketing) và định dạng seal-digest là việc của `bin/fgos.mjs`'s verb `check`, không phải module này
```

After:

```text
- `packages/observe/rust/src/metrics_cli/entropy.rs` — handler hiện hành cho `fgos metrics entropy`, tính score/parts và delta từ snapshot; `src/report/entropy.mjs` và CLI `check` cũ đã bị xoá.
```

## 18. A41 F1: replace deleted ranking pointer

Carrier: `docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md`. Evidence read before edit: `bin/fgos.mjs:4640-4643`; `bin/fgos.mjs:4373-4380`.

Before:

```text
- `src/evolve/candidates.mjs` — Gate A candidate ranking (self-improve loop STR13 Slice 1): thuần (`rankCandidates(view)`), không fs/Date.now, tái dùng `entropy.mjs`'s `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` (không tự định nghĩa "chưa ngã-ngũ" hay trọng số riêng); một candidate mỗi id còn friction chưa ngã-ngũ, trường hiển thị lấy từ bản ghi MỚI NHẤT theo `ts`, `score` cộng dồn TOÀN BỘ bản ghi chưa ngã-ngũ của id đó, sắp xếp score giảm dần rồi id tăng dần (tie-break). Manifest layer: domain.
```

After:

```text
- `src/evolve/candidates.mjs` đã bị xoá; CLI hiện hành không có verb `evolve`, và `rankCandidates` chỉ còn được nhắc trong comment của entrypoint.
```

## 19. A41 F-C: evolve/ranking is absent

Carrier: `docs/platform/runner/operations/h-51f5cd7279fd.md`. Evidence read before edit: `bin/fgos.mjs:4373-4380`; `bin/fgos.mjs:4640-4643`.

Before:

```text
    - `fgos evolve` — xếp hạng MỖI id còn friction chưa ngã-ngũ
 (`src/evolve/candidates.mjs`'s `rankCandidates`, tái dùng cơ học
      `listUnsettledFrictionsByWork`/`WEIGHTS.frictionUnsettled` của
      `entropy.mjs`, không tự định nghĩa lại "chưa ngã-ngũ" hay trọng số
      riêng) rồi in TOÀN BỘ danh sách — mỗi dòng mang đủ id/score/
      disposition/errorClass/layer/attempts/detail, không cắt bớt (cùng kỷ
      luật "mọi trường người cần để phán" như phần friction của `check`).
      Không friction chưa ngã-ngũ nào → một thông điệp trạng-thái-rỗng rõ
      ràng, exit 0 — chưa khởi tạo `.fgos/` nếu nó chưa tồn tại, giữ đúng hợp
      đồng đọc-thuần của `ready`/`list`.
```

After:

```text
    - CLI hiện hành không có verb `fgos evolve`; module `src/evolve/candidates.mjs` đã bị xoá và không có hàm `rankCandidates` đang chạy.
```

## 20. A41 F1: remove unavailable entry point

Carrier: `docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md`. Evidence read before edit: `bin/fgos.mjs:4373-4380`; `bin/fgos.mjs:4640-4643`.

Before:

```text
- `fgos evolve` / `fgos evolve --pick <id>` / `fgos evolve --submit <id>` (ngoài vòng runner, gọi bởi người vận hành, on-demand — self-improve loop STR13) — Gate A của vòng tự cải thiện: xếp hạng candidate từ friction chưa ngã-ngũ, người chọn một hoặc dừng (đọc-thuần tuyệt đối), hoặc bắc cầu candidate đã chọn sang một việc thật (`--submit`, hành động ghi duy nhất của bề mặt evolve) — xem "Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)" dưới
```

After:

```text
- `fgos evolve`, `fgos evolve --pick` và `fgos evolve --submit` không còn là entry point hiện hành; module ranking cũ đã bị xoá.
```

## 21. A41 F4: candidate authoring date

Carrier: `docs/platform/runner/spec.md`. Evidence read before edit: `docs/specs/runner.md:3193-3200`.

Before:

```text
updated: 2026-08-12
```

After:

```text
updated: 2026-10-15
```

## 22. A41 F4: no current full-coverage certification

Carrier: `docs/platform/runner/spec.md`. Evidence read before edit: `docs/specs/runner.md:3193-3200`.

Before:

```text
coverage: full
```

After:

```text
coverage: candidate-unverified
```

## 23. A41 F-C: scope the old Gate A contract explicitly; unavailable verb is not described as current

Carrier: `docs/platform/runner/operations/h-51f5cd7279fd.md`. Evidence read before edit: `bin/fgos.mjs:4373-4380`; `git log -- src/evolve/candidates.mjs`.

Before:

```text
- **Runs when:** người vận hành gọi `fgos evolve`
```

After:

```text
- **Runs when:** CLI hiện hành không có `fgos evolve`; phần còn lại của mục này lưu hợp đồng Gate A trước khi module ranking bị xoá, không mô tả hành vi hiện hành. Theo hợp đồng cũ, người vận hành gọi `fgos evolve`
```

## True or historical text retained

- 0062 R3_PENDING_WORK_CALLERS: dated decision history, superseded by 0063; no truth correction. Evidence: `docs/platform/runner/decisions/h-36d872fbb0e5.md:1718-1746`, `test/architecture.test.mjs (no R3_PENDING_WORK_CALLERS match)`.
- deleted-module references explicitly saying deleted / superseded RUL68 and RUL76: true historical statements left unchanged. Evidence: `src/runner/dispatch/cli.mjs:1268-1274`.
- live config exact values: not read: assignment forbids .fgos access; replaced false status with code-verifiable schema fact, no independent live-config claim. Evidence: `src/runner/dispatch/config.mjs:457`, `src/runner/dispatch/config.mjs:1019-1023`.
- ExecutorProfile proposed migration and superseded RUL68/RUL76: Labelled proposal/history retained, not treated as current implementation assertions. Evidence: `docs/platform/runner/contracts/h-b3eb60fb4d2b.md:69-73`, `src/runner/dispatch/config.mjs:457`, `src/runner/dispatch/cli.mjs:1268-1274`.

The live config was not inspected: assignment forbids `.fgos/` access. F-H now states the code-verified current schema rather than claiming fresh observation of live values. The legacy `sources`/`decisions` front-matter lists remain provenance lists, explicitly labelled as incomplete for current truth. Stale `runner.md:<line>` citations receive a stale label only in the candidate notes; their numbers remain unchanged.

## Changed-unit boundary

[Full machine-readable before/after](step9-rebound-units.json) records 68 candidate units (including changed direct-section headings and labelled wrapper/navigation units), their full text, ancestry and digests; 34 source-row bindings rebound to their actual current targets, all pending with no approval carry. The remaining 34 candidate-unit changes have no source-row decision; their native target identities and candidate-list receipts must be refreshed after commit. All 495 source rows remain pending; 461 Weak-exact, 34 Judgment. No reviewer sample/seed/verdict chosen.

The six rebased links preserve labels and point to the same existing repository referents. Their leaf source rows and changed containing direct sections are included in the 34 rebound rows. The old native review packs and request files are untouched; do not apply any old verdict to a changed digest.
