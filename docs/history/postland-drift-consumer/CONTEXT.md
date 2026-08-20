# CONTEXT.md — postland-drift-consumer (tsk-1el)

## Feature boundary

`tsk-2ypd` (D4, `docs/history/merge-conductor-throughput-and-human-release/`)
shipped real-path-overlap detection of post-land drift
(`classifyPostLandDrift`/`detectPostLandDrift`), returning `{notify, stale}`.
Its own plan (`plan-tsk-2ypd.md`) deliberately narrowed execution to
detection-and-return only, explicitly excluding persistence/delivery from
its scope. `postLand.notify`/`.stale` has been dead data ever since —
computed, threaded through `approve`/`sync-root`'s own returned result
object, never read by `bin/fgos.mjs` (zero references), never persisted,
never delivered to anyone. This item builds the missing consumer for the
`notify` branch only: a live session owning a leaf (or nested-root) branch
that now overlaps paths just landed on its target should be able to
discover that — pulled, not pushed, from two independent surfaces — without
guessing at their own next merge's risk.

`stale` (overlap, no live session) is explicitly OUT of scope: D3's
inbound-gate catchup (`approve.mjs:487`, `sync-root.mjs:211`) already runs
unconditionally the moment any item reaches its own real merge turn, so a
session-less drifted branch is already guaranteed a rebase before it ships
— nothing silently breaks. Building a separate `stale` consumer would be
redundant with an already-shipped mechanism.

Full research trail: `docs/history/postland-drift-consumer/RESEARCH.md`.
Architecture brainstorm:
`plans/reports/architecture-brainstorm-260820-1457-postland-drift-consumer-report.md`.

## Pinned terms

- **postLand drift** — a leaf's (or nested-root's) own changed-file set
  overlapping the set of files touched by any commit landed on its target
  ref since that leaf's own fork point from that target.
- **notify** — the branch of D4's classification where a drifted item has
  at least one live session attached (`listSessions`); this item's entire
  build scope.
- **stale** — the branch of D4's classification with no live session
  attached; explicitly out of this item's scope (D2), already covered by
  D3's inbound-gate catchup.
- **recompute-on-read** — computing drift fresh at the moment something
  asks (a doctor run, a driving-loop Orient read), never persisting a
  merge-time snapshot. Matches `src/state/drift-status.mjs`'s own stated
  design principle (no cached drift, avoid a second state-consistency
  surface next to `events.jsonl`).

## Locked decisions

| D-ID | Quyết định |
|---|---|
| — | Bằng chứng chi tiết cho gap postLand.notify/postLand.stale không có consumer: (1) src/runner/merge.mjs:326 detectPostLandDrift + src/state/graph-harness.mjs:455 classifyPostLandDrift đúng thiết kế D4 — grep xác nhận KHÔNG còn code path catchup hàng loạt theo topology root-vừa-nhích; 9 test xanh (test/runner/merge.test.mjs, test/state/graph-harness.test.mjs) gồm test khẳng định zero verify chạy trong đường detection — triệu chứng gốc người dùng báo cáo ('test chạy lặp đi lặp lại sau return/catchup') đã hết. (2) GAP: postLand được gắn vào kết quả mergeRunnerItem (merge.mjs:814-828, chỉ khi outcome==='merged'), approve.mjs (dòng 649,660,805,816) và sync-root.mjs:186 pass-through nguyên xi vào JSON trả về, nhưng grep toàn repo xác nhận bin/fgos.mjs có 0 tham chiếu postLand (dùng use-case layer từ commit 9a600342) và không skill nào (plugins/fgOS/skills/approve, merge-next, merge-loop, fgos-fanout) đọc notify/stale. Kết quả: nhánh (b) của D4 — báo phiên sống tự sửa lúc rẻ — không có consumer, hiện chỉ là dữ liệu chết trong stdout JSON. (3) Không phải regression an toàn: D3's inbound-gate catchup (approve.mjs:487, sync-root.mjs:211) vẫn chạy vô điều kiện mỗi khi item thật sự tới lượt land, nên nhánh (c) 'stale' không cần consumer riêng. Chỉ nhánh (b) 'notify' mất tác dụng. (4) plan-tsk-2ypd.md tự loại rõ 'ghi mark vào event log' khỏi scope — đây không phải lỗi thực thi của tsk-2ypd, là phần nối tiếp chưa ai submit. Đề xuất hướng giải cho planning: approve/sync-root tự in cảnh báo khi notify không rỗng (rẻ nhất) \| fgos-fanout/orchestrating session đọc field và SendMessage cho phiên con \| ghi notification thật vào .fgos/sessions.json. |
| — | Bổ sung ranh giới module/boundary quản lý cơ chế landing này, để phiên đang explore có đủ ngữ cảnh: (1) CODE — 3 lớp theo tsk-49i: src/state/graph-harness.mjs (thuần: classifyPostLandDrift, openLeavesSharingTarget, mergeReadiness — không fs/git) → src/runner/merge.mjs (cơ chế git thật: mergeRunnerItem, detectPostLandDrift, changedFiles, performCatchUp) → src/verbs/merge/*.mjs (use-case layer, approve.mjs/sync-root.mjs/catchup.mjs/review.mjs/reject.mjs, chữ ký <verb>UseCase(ctx, options), từ commit 9a600342) → bin/fgos.mjs (CLI parse args + tính repoRoot theo policy riêng từng verb + gọi use-case + bọc envelope fgos.v1 — cửa ghi state duy nhất, L10). (2) SPEC AREA — docs/specs/reading-map.md dòng 30-31 chốt cả src/runner/merge.mjs lẫn src/verbs/merge/*.mjs cùng trỏ về docs/specs/runner.md ('Spec: Runner (vòng tự hành)') — đây là ranh giới BA-grade quản lý toàn bộ landing (integration drift §82, catch-up §88, cổng duyệt PR nội bộ §263 trong runner.md). (3) SPEC GAP phát hiện thêm: docs/specs/runner.md hiện 0 tham chiếu postLand/tsk-2ypd/D4 — cơ chế post-land-drift-detection đã merge vào code (tsk-2ypd) nhưng spec runner.md CHƯA cập nhật để phản ánh nó; nên cân nhắc thêm một mục mô tả D4 vào runner.md như một phần scope của item này, khớp rule AGENTS.md 'When To Update Docs' (architecture/behavior đổi thì cập nhật spec). (4) GOVERNANCE — src/evolve/iron-law.mjs's MODULE_RULES dòng 21 khớp {prefix:'src/runner/'} nên bất kỳ đổi nào trong src/runner/merge.mjs đều bắt buộc qua cổng Iron Law bất kể mô tả có từ khoá rủi ro hay không. (5) NGUỒN THẨM QUYỀN THIẾT KẾ — D1-D7 trong docs/history/merge-conductor-throughput-and-human-release/DISCUSSION.md (item mẹ tsk-51m); D4 cụ thể là quyết định khoá cho đúng cơ chế postLand đang bàn ở item này. |
| D1 | 'phien song' target for the notify consumer is the live session that owns the drifted LEAF branch, not the merging session's own terminal. |
| D2 | scope narrowed to the notify branch only; stale is excluded because D3's inbound-gate catchup (approve.mjs:487, sync-root.mjs:211) already runs unconditionally at every item's own merge turn, so a session-less drifted branch never ships broken silently. |
| D3 | recompute-on-read, not persist-at-merge-time snapshot -- matches driftStatus/unmergedDeliveries (src/state/drift-status.mjs) precedent, avoids a second state-consistency surface next to events.jsonl. Delivery splits into two independent pull surfaces in this item's scope: a new fgos doctor check (registered like checkRootDrift, src/setup/registrations.mjs:824) and a line in fgos-coding-driving's existing Orient re-read. A herdr-cockpit-notify.mjs push extension is explicitly optional/deferred, out of this item's build scope. |
| D4 | rejected two prior-proposed alternatives -- writing into .fgos/sessions.json (mixes a notification concern into a file whose single responsibility is session liveness, SRP violation); relying on fgos-fanout SendMessage as the primary delivery mechanism (only covers fanout-launched topology, most leaf claims have no orchestrating parent). |
| D5 | the new compute module lands under src/state/ (matching drift-status.mjs's own precedent), not src/runner/ -- avoids iron-law.mjs's mandatory {prefix:'src/runner/'}/{equals:'bin/fgos.mjs'} gate, and matches DISCUSSION.md's own already-open module-boundary choice for task-post-sync-detection ('mo-dun moi duoi src/state/ hoac src/runner/, ranh gioi do planning chot'). |
| D6 | drift-file computation is cumulative -- the leaf's own changed-file set intersected against every file touched by any commit landed on its target since the leaf's own fork point (one git diff between merge-base and target's current tip), not limited to the single most recent land. Recompute-on-read can miss earlier drift otherwise. |
| D7 | item-selection scope reuses openLeavesSharingTarget (graph-harness.mjs:422-434) unchanged -- any open item sharing the same parent/target ref (leaf or nested root), excluding todo/resolved. No leaf-vs-nested-root narrowing. |
| D8 | a target branch gone by check time is skipped silently, never throws -- reuses the same guard shape driftStatus/plan-tsk-2ypd.md's own accepted edge case already use for a deleted leaf branch mid-flight. |
| D9 | scope includes adding a section to docs/specs/runner.md describing the D4/postLand-drift mechanism (already shipped by tsk-2ypd) plus this item's new notify consumer -- runner.md currently has zero references to postLand/tsk-2ypd despite reading-map.md routing both merge.mjs and src/verbs/merge/*.mjs to it. |

## Scout evidence

- `src/state/graph-harness.mjs:457-469` — `classifyPostLandDrift` (pure,
  zero fs/git). `openLeavesSharingTarget` (`:422-434`) — item-selection
  scope this item's new check reuses unchanged (D7).
- `src/runner/merge.mjs:774-857` — `detectPostLandDrift`, the git I/O shim
  half of D4's original detection; `merge.mjs:314` — comment documenting
  the three-branch intent ("nothing / notify the owning session / mark
  stale").
- `src/verbs/merge/approve.mjs:644,655,800,811`,
  `src/verbs/merge/sync-root.mjs:181` — `postLand: result.postLand`
  forward-only pass-through, never read again.
- `grep -n "postLand" bin/fgos.mjs` → zero matches — confirmed dead data at
  the CLI layer.
- `scripts/herdr-cockpit-notify.mjs` — the one existing "alert a live
  session" precedent in the repo; polls persisted `status` via `fgos list
  --json`, structurally can't see `postLand` since it's never persisted.
  Reference for an optional future push layer (D3 of this item), not part
  of this item's build scope.
- `src/state/drift-status.mjs` (header comment) — the recompute-on-read,
  no-caching design principle this item's D3 follows; `driftStatus`/
  `unmergedDeliveries` consumed live by `src/setup/registrations.mjs:824`
  (`checkRootDrift`, a `fgos doctor` check) and by
  `src/verbs/merge/merge.mjs:32` (readiness ranking) — zero persistence in
  either consumer.
- `src/evolve/iron-law.mjs:20-24` `MODULE_RULES` — `{prefix:
  'src/runner/'}` and `{equals: 'bin/fgos.mjs'}` mandatorily gate any
  change to those paths through Iron Law regardless of description
  keywords. Grounds D5 (new module under `src/state/`, not `src/runner/`).
- `docs/history/merge-conductor-throughput-and-human-release/DISCUSSION.md:395` —
  the original `task-post-sync-detection` spec already left the new
  module's home open between `src/state/` and `src/runner/`, "ranh giới do
  planning chốt" (boundary is planning's call) — D5 is that call, not a
  deviation.
- `DISCUSSION.md:404` — D4's own original acceptance criterion #2 ("Có
  giao path + leaf có phiên đang sống ⇒ sinh thông báo cho đúng phiên đó")
  already specified generating a real notification for the live session —
  `plan-tsk-2ypd.md` knowingly deferred that half. This item closes that
  gap, not a new one.
- `docs/specs/reading-map.md:30-31` — routes both `src/runner/merge.mjs`
  and `src/verbs/<domain>/<verb>.mjs` to `docs/specs/runner.md`.
  `grep -n "postLand|tsk-2ypd" docs/specs/runner.md` → zero matches,
  confirming the doc gap D9 closes.
- Impact-analysis posture: **degraded** — `fgos tool query --capability
  impact-analysis --status present` returns `gitnexus`/`present`, but a
  sibling item (`tsk-1lg`, open) already reports the GitNexus index 434
  commits behind. Proceeded via direct grep/Read cross-check throughout
  this item's discovery and exploring passes instead of trusting graph
  queries.

## Outstanding questions

None
