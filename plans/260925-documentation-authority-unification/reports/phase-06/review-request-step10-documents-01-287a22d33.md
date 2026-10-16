# Bounded re-review: documents 1

Author session: `codex-session:unit-run-1792114313040-56132651@2026-10-16`
Packaged by: `codex-session:unit-run-1792116045118-73cfbb42@2026-10-16`
Content commit: `287a22d33a0eaf2d9e47549a1142daf62361bb8c` (author changes at `0d8c602e2`)
Comparison base: `5035fed52e60254ecbe034cc987553feb24616f4`
Entries: **10**; each request at most60 entries and400000 bytes.

[Single request index](review-request-step10-index-287a22d33.md). Before values are historical; currentDecision and after for content rows come from `git show <content commit>:<shard>` through unchanged `reviewEntryFromCommittedRow`. New package-native predecessor rows are explicitly labelled overlay and require the runner package commit. No seed, sample IDs or verdict chosen by producer.

Reproduce all-shard consistency and every714 generated rationale (unchanged checker, no --apply):

```sh
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work python3 plans/260925-documentation-authority-unification/reports/phase-06/step10-sync287-reproduce.py consistency
```

Reproduce tests yourself (473 expected):

```sh
env -u CLAUDE_CODE_SESSION_ID TMPDIR=/tmp/fgos-work node --test test/scripts/doc-*.test.mjs test/scripts/check-doc-*.test.mjs test/scripts/generate-doc-inventory.test.mjs test/scripts/list-doc-anchors.test.mjs test/scripts/verify-phase-02.test.mjs test/scripts/next-doc-id.test.mjs
```

Run at the runner package checkout from repository root. The consistency reproduction materializes scratch only under `/tmp/fgos-work/`, checks all90 pinned shards with the original checker, verifies their current-row equality, then audits all4 package-native rows with unchanged `checkLegacyRationale`:12893 rows/91 nonempty shards in total. The original checker directly on the new shard errors because its historical oldRow lookup assumes every shard existed at5035fed52; that observed limitation is preserved in `step10-sync287-rationale-consistency.log`. No checker code was altered or bypassed for a pass.

Review every submitted current claim with an ordinary verdict and full digest/anchor/shard equality. Rationales are grouped for mechanical regeneration plus an independent seeded deep sample of at least108/714. A36 additionally requires reviewer-seeded at least162/1079 conservative Weak-exact/Judgment population, every unequal source/target digest and partial/historical row deep. One independently selected draw may satisfy both populations if both coverage thresholds are met; otherwise add draws. All exact doc corrections, tool changes and marked native predecessor transitions are deep. >3% deep rework escalates to the entire pack. Report seed/sample IDs and each claim's deep/mechanical note. Independent checkpoint/truth/red-team obligations remain. Confirmations retain existing committed approvals; metadata/evidence/native entries do not approve claims.

## Entry documents-001

```json
{
  "kind": "complete-doc-line-diff",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "path": "docs/platform/host-invocation-routing/vision.md",
  "beforeCommit": "5035fed52e60254ecbe034cc987553feb24616f4",
  "afterCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "diff": "diff --git a/docs/platform/host-invocation-routing/vision.md b/docs/platform/host-invocation-routing/vision.md\nindex 4930380cf..6e8baf504 100644\n--- a/docs/platform/host-invocation-routing/vision.md\n+++ b/docs/platform/host-invocation-routing/vision.md\n@@ -58,14 +58,14 @@ Host invocation does not own:\n \n ## 5. Design Direction\n \n | Direction | Status | Alignment |\n | --- | --- | --- |\n-| CLI, remote, and chat are peer hosts that feed one semantic invocation service. | `accepted-not-implemented` | Preserved from [host-invocation-provider-routing.md](spec.md); proof gap in [verification/implementation-alignment.md](verification/implementation-alignment.md). |\n+| CLI, remote, and chat are peer hosts that feed one semantic invocation service. | `accepted-not-implemented` | Preserved from [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md); proof gap in [verification/implementation-alignment.md](verification/implementation-alignment.md). |\n | Legacy Node compatibility is transitional and CLI-local unless a per-operation semantic bridge is needed. | `accepted-not-implemented` with `legacy-current` behavior | Preserved from [legacy-cli-transition.md](../../architect/host-invocation-routing/legacy-cli-transition.md). |\n-| Provider manifests describe capability requests and operation claims but never grant authority. | `accepted-not-implemented` | Preserved from [external-provider-protocol.md](architecture/external-provider-protocol.md). |\n-| Rust host migration proceeds by complete component/use-case boundaries, reads before writers, and no write dual-run. | `planned` | Preserved from [node-to-rust-component-migration.md](architecture/node-to-rust-migration.md). |\n+| Provider manifests describe capability requests and operation claims but never grant authority. | `accepted-not-implemented` | Preserved from [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md). |\n+| Rust host migration proceeds by complete component/use-case boundaries, reads before writers, and no write dual-run. | `planned` | Preserved from [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md). |\n | Rollback of native R1/R2 behavior is a release rollback through `fgctl`, not a runtime provider-selection toggle. | `accepted-not-implemented` | Depends on packaging-distribution contracts. |\n \n ## 6. Related Files\n \n | Relationship | File |\n",
  "deepRequired": true,
  "entryId": "documents-001"
}
```

## Entry documents-002

```json
{
  "kind": "complete-doc-line-diff",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "path": "docs/platform/packaging-distribution/spec.md",
  "beforeCommit": "5035fed52e60254ecbe034cc987553feb24616f4",
  "afterCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "diff": "diff --git a/docs/platform/packaging-distribution/spec.md b/docs/platform/packaging-distribution/spec.md\nindex 30e3b5de5..accbded3a 100644\n--- a/docs/platform/packaging-distribution/spec.md\n+++ b/docs/platform/packaging-distribution/spec.md\n@@ -434,11 +434,11 @@ Use this legacy file for: Redirect only\n Do not use this legacy file for: Current model detail\n Last reviewed: 2026-09-13\n ```\n \n > Status: historical redirect. Active topology remains\n-> [docs/architect/workspace-topology.md](../system-architecture/architecture/workspace-topology.md), while active\n+> [docs/architect/workspace-topology.md](../../architect/workspace-topology.md), while active\n > packaging-distribution runtime records live under\n > [docs/platform/packaging-distribution/](README.md).\n > Keep this file only as the old pointer that explains the split.\n \n **Status:** Moved.\n",
  "deepRequired": true,
  "entryId": "documents-002"
}
```

## Entry documents-003

```json
{
  "kind": "complete-doc-line-diff",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "path": "docs/platform/runner/operations/h-51f5cd7279fd.md",
  "beforeCommit": "5035fed52e60254ecbe034cc987553feb24616f4",
  "afterCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "diff": "diff --git a/docs/platform/runner/operations/h-51f5cd7279fd.md b/docs/platform/runner/operations/h-51f5cd7279fd.md\nindex 7ad9a2762..e65c10e77 100644\n--- a/docs/platform/runner/operations/h-51f5cd7279fd.md\n+++ b/docs/platform/runner/operations/h-51f5cd7279fd.md\n@@ -451,11 +451,11 @@ một lệnh sẽ luôn gãy ngay lần dùng đầu tiên:\n   mang lý do cụ thể, đậu lại chờ người, cùng luật \"không tự rebase, không\n   halt cả vòng runner\" như mọi lần đỗ khác.\n \n ### Gate A — xếp hạng candidate, bắc cầu sang việc thật (evolve)\n \n-Added in candidate — A41/A42 correction: CLI hiện hành không có verb `evolve` (`bin/fgos.mjs:4415,4461`; `evolve --help` trả \"unknown verb\"). Module ranking đã bị xoá ở commit `120af6b3d`. Đoạn dưới ghi lại hợp đồng Gate A trước khi bị gỡ, không xác nhận triển khai hiện hành; full truth check owed at promotion.\n+Added in candidate — A41/A42 correction: CLI hiện hành không có verb `evolve` (`bin/fgos.mjs:4415,4503`; `evolve --help` trả \"unknown verb\"). Module ranking đã bị xoá ở commit `120af6b3d`. Đoạn dưới ghi lại hợp đồng Gate A trước khi bị gỡ, không xác nhận triển khai hiện hành; full truth check owed at promotion.\n Bước vào trước đây của vòng tự cải thiện (self-improve loop, STR13 — CONTEXT.md):\n Theo hợp đồng cũ, fgOS xếp hạng chính friction chưa ngã-ngũ của nó thành\n một danh sách candidate, người chọn đúng một hoặc dừng (Slice 1), rồi có thể\n bắc cầu candidate đã chọn sang một việc thật để runner thi công (Slice 3,\n `--submit`). Loop này chỉ nhắm vào chính `repo/src` của fgOS — không\n",
  "deepRequired": true,
  "entryId": "documents-003"
}
```

## Entry documents-004

```json
{
  "kind": "complete-doc-line-diff",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "path": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
  "beforeCommit": "5035fed52e60254ecbe034cc987553feb24616f4",
  "afterCommit": "287a22d33a0eaf2d9e47549a1142daf62361bb8c",
  "diff": "diff --git a/docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md b/docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md\nindex 9bfb9b6e5..349fd3db8 100644\n--- a/docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md\n+++ b/docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md\n@@ -18,11 +18,11 @@ Related:\n - docs/specs/runner.md\n Supersedes: None; legacy authority retained\n Superseded by: None\n ```\n \n-> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim. Corrections in this candidate: A41 F2: replace deleted entropy pointer (packages/observe/rust/src/metrics_cli/entropy.rs:1-8; packages/observe/rust/src/metrics_cli/entropy.rs:107-127); A41 F1: replace deleted ranking pointer (bin/fgos.mjs:4640-4643; bin/fgos.mjs:4415-4380); R9-5: remove decisions-placement boilerplate from non-decision carrier.\n+> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim. Corrections in this candidate: A41 F2: replace deleted entropy pointer (packages/observe/rust/src/metrics_cli/entropy.rs:1-8; packages/observe/rust/src/metrics_cli/entropy.rs:107-127); A41 F1: replace deleted ranking pointer (bin/fgos.mjs:4414-4417); R9-5: remove decisions-placement boilerplate from non-decision carrier.\n \n ## Pointers (implementation)\n \n - `bin/fgos-runner.mjs` — CLI (--once/--dry-run/--watch/--poll-ms — str7-str8-priority-intent; `--config` bỏ ở RUL93 (the runner loop's worker and the fan-out batch run as one Unit run each)), exit theo phạm trù; nhánh `--watch` đăng ký `SIGINT`/`SIGTERM` lên một `AbortController` chung TRƯỚC khi gọi `runWatch`, tín hiệu thứ hai buộc `process.exit(130)`; hàm `printResult` (dùng chung giữa `--once` và `onCycle` của `--watch`) nay bọc `result` (trừ `exitCode`) qua `wrapEnvelope` (`src/state/envelope.mjs`, cùng hàm `bin/fgos.mjs` dùng) và in JSON một dòng — không `JSON.stringify(..., null, 2)` như `fgos.mjs` — vì `--watch` phát nhiều phong bì nối tiếp theo thời gian (per str46-io-contract, xem RUL61 (kết-cục cuối của `fgos-runner` nay bọc cùng phong bì máy-đọc `fgos.v1` như mọi verb)); exit-code prose ở đầu file trỏ về `src/state/store.mjs`'s `EXIT_CODES` + `src/runner/loop.mjs`'s `EXIT_BUSY` thay vì tự liệt lại bảng\n - `src/runner/loop.mjs` — vòng + startup reap (SKIP claim `human`/`session` — xem \"Gặt-lại lúc khởi động\") + khoá liên-tiến-trình `.fgos/runner.lock` (busy exit 6); NGAY SAU reap, TRƯỚC vòng dispatch: (1) quét mọi item `stage==='discovery' && status==='todo'` (không đọc `item.mode`), dựng worktree tạm + `spawnWorker` với `stage: 'discovery'` cho từng item, đọc khối phán quyết trong output của worker rồi gọi `resolveDiscovery` (`src/intake/discovery.mjs`) với chính verdict đó, truyền `'runner'` — nhánh không có commit nào, hoặc không đọc được verdict, thì item được để nguyên tại chỗ cho lượt sau; (2) đọc lại view tươi rồi quét mọi item ở `stageForStep(domain,'Divide')` (`planning`) CỘNG tên di sản `decompose`, với `status==='todo'`, và gọi `resolvePlan` (`src/intake/plan.mjs`) cho từng item, cùng truyền `'runner'` — không kèm verdict, nên nó chỉ cho đi thẳng khi `plan.md` của item khai mode `tiny`/`small`, còn lại no-op an toàn; cùng lượt chạy có thể chaining cả hai sweep trên một item vừa rời `discovery`; ghi bản outcome dự đoán tại claim + thực tế ở cả hai lối ra cuối (thành đề xuất, hoặc đỗ/dừng) qua `addOutcome` của store; mọi `moveWork` runner tự gọi (claim/propose/park) truyền `role:'runner'`; gọi `runGoalCheck` (từ `goal-check.mjs`, không còn tự triển khai) cho cả proof lúc dispatch lẫn proof lúc gặt-lại; ngay trước khi spawn worker, đọc lại view TƯƠI qua `listWork(dir)` rồi truyền `feedback: {answer: view.gates?.[item.id]?.answer, reason: view.work?.[item.id]?.reason}` vào `spawnWorker` (per worker-execution STR33 / 396d9d9e, xem RUL23 (phản hồi người threading vào prompt worker)); `dispatch.mjs` — prompt/config/spawn (argv-only, spawnSync timeout; caveat grandchild SIGTERM ghi trong doc comment) + `resolveExecutorCommand`/`resolveTierModel` (dùng chung cho mọi lượt spawn worker, kể cả lượt dispatch nghiên-cứu — không còn call site nào cho một lời gọi model phán lồng bên trong engine); `buildPrompt(work, feedback?)` dựng 5 section cố định (Goal, Description, Worktree boundary, Expected proof, Constraints — hợp đồng test pin presence) cộng mục `# Human feedback` TÙY CHỌN khi `feedback.answer`/`feedback.reason` có mặt (nguyên văn, xem RUL23 (phản hồi người threading vào prompt worker)); `description` là `work.description` nguyên văn, degrade \"(không có)\" khi vắng (per discovery-context STR30); `spawnWorker(work, cfg, cwd, opts)` nhận `opts.feedback` truyền xuống `buildPrompt`; `worktree.mjs` — lifecycle + reclaimOrphanedCheckout + `detectTrunk(repoRoot)`/`isMainWorktree(repoRoot)` (dời từ `merge.mjs` sang đây per tsk-49i — cả hai là danh tính worktree/nhánh, không mang ngữ nghĩa nội dung merge; dời đi cũng cắt luôn import vòng `merge.mjs` ↔ `worktree.mjs`) + `createBranchRef(repoRoot, id, opts)` (tạo `fgw/<id>` chỉ-là-ref, không worktree, idempotent) + `createWorktree`'s `opts.baseRef` (fork worktree mới từ một ref chỉ định thay vì HEAD hiện tại — dùng cho con fork từ tip nhánh gốc); `recovery.mjs` — 8 lớp; `anti-loop.mjs` — `visitCount` (lifetime, dùng cho outcome/metric) + `visitsSinceLastHumanEvent(events, id)` (ngân sách CỔNG, per-item, reset trên `role==='human'` mang `answer` hoặc `reason`, xem RUL29 (cổng chống-lặp reset theo can thiệp người cuối cùng của chính việc)) + breaker; `loop.mjs`'s gate (cả nhánh dry-run đơn lẻ lẫn nhánh lọc `overLimit` của batch dispatch dưới) gọi `visitsSinceLastHumanEvent`, không còn `visitCount`, để quyết park; `createMissBreaker` nay PER-ITEM (Map theo id, `consecutiveMissesFor(itemId)`; `consecutiveMisses` getter cũ giữ nguyên qua một khóa sentinel tương thích ngược, per fan-out-parallel-5). `runOnce`'s vòng dispatch nay là pool-loop batch (cell fan-out-parallel-8): đọc TOÀN BỘ `readyWork(dir)`, lọc qua `root-affinity.mjs`'s `steerFrontier`, nhóm theo gốc và cắt còn tối đa `parallel.maxRoots × parallel.maxLeavesPerRoot` (đọc từ `.fgos/config.json`'s `runner` section, mặc định 4×4 khi vắng khối `parallel`), claim từng việc bên trong callback của `write-queue.mjs`'s `enqueue` (bắt buộc — giải-và-ghi phải cùng một giao dịch hàng đợi để giữ đúng chứng minh chống-tranh-giành), rồi dispatch cả mẻ đồng thời qua `Promise.allSettled`; mỗi việc claim xong xác định LEAF hay ROOT qua `state/frontier.mjs`'s `resolveRoot(view, id)` — leaf: `createBranchRef(repoRoot, rootId, {baseRef:'main'})` rồi `createWorktree(repoRoot, item.id, {worktreeDir, baseRef: branchNameFor(rootId)})`; root: `createWorktree` không đổi, tự nhiên tái dùng nhánh đã có nếu tồn tại. Mẻ xong → đọc lại `readyWork` tươi, lặp tới khi không còn việc đang chạy VÀ không còn việc sẵn-sàng; `runOnce` trả `{outcome, dispatched, parked, reap, exitCode}` thay vì kết quả một item\n",
  "deepRequired": true,
  "entryId": "documents-004"
}
```

## Entry documents-005

```json
{
  "kind": "exact-authorized-line-edit",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "path": "docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md",
  "line": 23,
  "before": "bin/fgos.mjs:4640-4643; bin/fgos.mjs:4415-4380",
  "after": "bin/fgos.mjs:4414-4417",
  "label": "L10-24/citation-scaffold",
  "beforeFragment": "bin/fgos.mjs:4640-4643; bin/fgos.mjs:4415-4380",
  "afterFragment": "bin/fgos.mjs:4414-4417",
  "beforeLine": "> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim. Corrections in this candidate: A41 F2: replace deleted entropy pointer (packages/observe/rust/src/metrics_cli/entropy.rs:1-8; packages/observe/rust/src/metrics_cli/entropy.rs:107-127); A41 F1: replace deleted ranking pointer (bin/fgos.mjs:4640-4643; bin/fgos.mjs:4415-4380); R9-5: remove decisions-placement boilerplate from non-decision carrier.",
  "afterLine": "> Added in candidate: Metadata and map-based placement scaffolding. Original source heading levels, ids and direct sections are retained. Known stale carried sentences; full truth check owed at promotion. A19 carriage and explicit Lead A35 note preserve deleted-module, retired-corpus, moved-plan and runner.md:<line> text verbatim. Corrections in this candidate: A41 F2: replace deleted entropy pointer (packages/observe/rust/src/metrics_cli/entropy.rs:1-8; packages/observe/rust/src/metrics_cli/entropy.rs:107-127); A41 F1: replace deleted ranking pointer (bin/fgos.mjs:4414-4417); R9-5: remove decisions-placement boilerplate from non-decision carrier.",
  "deepRequired": true,
  "entryId": "documents-005"
}
```

## Entry documents-006

```json
{
  "kind": "exact-authorized-line-edit",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "path": "docs/platform/runner/operations/h-51f5cd7279fd.md",
  "line": 456,
  "before": "bin/fgos.mjs:4415,4461",
  "after": "bin/fgos.mjs:4415,4503",
  "label": "L10-24/citation-refuseHelp",
  "beforeFragment": "bin/fgos.mjs:4415,4461",
  "afterFragment": "bin/fgos.mjs:4415,4503",
  "beforeLine": "Added in candidate — A41/A42 correction: CLI hiện hành không có verb `evolve` (`bin/fgos.mjs:4415,4461`; `evolve --help` trả \"unknown verb\"). Module ranking đã bị xoá ở commit `120af6b3d`. Đoạn dưới ghi lại hợp đồng Gate A trước khi bị gỡ, không xác nhận triển khai hiện hành; full truth check owed at promotion.",
  "afterLine": "Added in candidate — A41/A42 correction: CLI hiện hành không có verb `evolve` (`bin/fgos.mjs:4415,4503`; `evolve --help` trả \"unknown verb\"). Module ranking đã bị xoá ở commit `120af6b3d`. Đoạn dưới ghi lại hợp đồng Gate A trước khi bị gỡ, không xác nhận triển khai hiện hành; full truth check owed at promotion.",
  "deepRequired": true,
  "entryId": "documents-006"
}
```

## Entry documents-007

```json
{
  "kind": "exact-authorized-line-edit",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "path": "docs/platform/host-invocation-routing/vision.md",
  "line": 63,
  "before": "Preserved from [host-invocation-provider-routing.md](spec.md)",
  "after": "Preserved from [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md)",
  "label": "L10-23",
  "beforeFragment": "Preserved from [host-invocation-provider-routing.md](spec.md)",
  "afterFragment": "Preserved from [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md)",
  "beforeLine": "| CLI, remote, and chat are peer hosts that feed one semantic invocation service. | `accepted-not-implemented` | Preserved from [host-invocation-provider-routing.md](spec.md); proof gap in [verification/implementation-alignment.md](verification/implementation-alignment.md). |",
  "afterLine": "| CLI, remote, and chat are peer hosts that feed one semantic invocation service. | `accepted-not-implemented` | Preserved from [host-invocation-provider-routing.md](../../architect/host-invocation-routing/host-invocation-provider-routing.md); proof gap in [verification/implementation-alignment.md](verification/implementation-alignment.md). |",
  "deepRequired": true,
  "entryId": "documents-007"
}
```

## Entry documents-008

```json
{
  "kind": "exact-authorized-line-edit",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "path": "docs/platform/host-invocation-routing/vision.md",
  "line": 65,
  "before": "Preserved from [external-provider-protocol.md](architecture/external-provider-protocol.md)",
  "after": "Preserved from [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md)",
  "label": "L10-23",
  "beforeFragment": "Preserved from [external-provider-protocol.md](architecture/external-provider-protocol.md)",
  "afterFragment": "Preserved from [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md)",
  "beforeLine": "| Provider manifests describe capability requests and operation claims but never grant authority. | `accepted-not-implemented` | Preserved from [external-provider-protocol.md](architecture/external-provider-protocol.md). |",
  "afterLine": "| Provider manifests describe capability requests and operation claims but never grant authority. | `accepted-not-implemented` | Preserved from [external-provider-protocol.md](../../architect/host-invocation-routing/external-provider-protocol.md). |",
  "deepRequired": true,
  "entryId": "documents-008"
}
```

## Entry documents-009

```json
{
  "kind": "exact-authorized-line-edit",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "path": "docs/platform/host-invocation-routing/vision.md",
  "line": 66,
  "before": "Preserved from [node-to-rust-component-migration.md](architecture/node-to-rust-migration.md)",
  "after": "Preserved from [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md)",
  "label": "L10-23",
  "beforeFragment": "Preserved from [node-to-rust-component-migration.md](architecture/node-to-rust-migration.md)",
  "afterFragment": "Preserved from [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md)",
  "beforeLine": "| Rust host migration proceeds by complete component/use-case boundaries, reads before writers, and no write dual-run. | `planned` | Preserved from [node-to-rust-component-migration.md](architecture/node-to-rust-migration.md). |",
  "afterLine": "| Rust host migration proceeds by complete component/use-case boundaries, reads before writers, and no write dual-run. | `planned` | Preserved from [node-to-rust-component-migration.md](../../architect/host-invocation-routing/node-to-rust-component-migration.md). |",
  "deepRequired": true,
  "entryId": "documents-009"
}
```

## Entry documents-010

```json
{
  "kind": "exact-authorized-line-edit",
  "authorSession": "codex-session:unit-run-1792114313040-56132651@2026-10-16",
  "path": "docs/platform/packaging-distribution/spec.md",
  "line": 439,
  "before": "[docs/architect/workspace-topology.md](../system-architecture/architecture/workspace-topology.md)",
  "after": "[docs/architect/workspace-topology.md](../../architect/workspace-topology.md)",
  "label": "L10-26",
  "beforeFragment": "[docs/architect/workspace-topology.md](../system-architecture/architecture/workspace-topology.md)",
  "afterFragment": "[docs/architect/workspace-topology.md](../../architect/workspace-topology.md)",
  "beforeLine": "> [docs/architect/workspace-topology.md](../system-architecture/architecture/workspace-topology.md), while active",
  "afterLine": "> [docs/architect/workspace-topology.md](../../architect/workspace-topology.md), while active",
  "deepRequired": true,
  "entryId": "documents-010"
}
```

