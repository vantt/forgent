# plan.md — tsk-40m: tách live claim/doing khỏi durable eventlog

> **SUPERSEDED (2026-08-25)** — mục 3 dưới đây ("ghi ĐÚNG 1 lần dưới
> events.lock full segment `work.move(preClaimStatus->doing)` +
> `work.attempt` + `work.move(doing->finalStatus)`") đã bị thay bằng
> **direct settle** (settleClaim ghi thẳng `work.move(preClaimStatus->
> finalStatus)`, không còn leg `->doing` trung gian nào), sau khi review
> phát hiện full-segment vẫn để lại một khoảng hở durable-doing thật giữa
> hai lần append. Quyết định do user chọn trực tiếp (AskUserQuestion,
> "Làm ngay") — xem docs/history/runtime-claim-doing-separation/
> CONTEXT.md's ghi chú SUPERSEDED và docs/architect/doing-coordination-
> redesign.md cho thiết kế hiện hành. Mọi mục khác trong plan này (1, 2,
> 4-11) vẫn đúng nguyên trạng.

Mode: high-risk

**Vì sao không phải standard trở xuống**: đếm flag theo `fgos-routing`'s
Mode-gate — data model (đổi CAS/claim data model trung tâm của toàn hệ
lifecycle), audit/security (đổi durable audit trail: anti-loop, attempt
history), public contracts (`claimWork()`'s return shape, `moveWork`'s
CAS contract cho return/reject/verify-fail đều đổi), existing covered
behavior (đè lên hành vi đã có test bao phủ dày: `claim-port.test.mjs`,
`store.test.mjs`, `loop.mjs`'s startupReap, frontier/worker-slots) — 4/5
flag khớp, vượt ngưỡng 4+ → high-risk. Bản thân cơ chế đang sửa (claim/
CAS) đang bảo vệ chính live production usage của repo này (fgOS tự
dogfood chính nó — tsk-40m đang chạy DƯỚI cơ chế CŨ ngay lúc viết plan
này).

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` → 1
provider (`gitnexus`, status `present`). Nhưng session-start hook báo
"GitNexus index is stale (last indexed 7bb3231)" — index đó CŨ HƠN cả
commit lúc bắt đầu phiên này. Theo CLAUDE.md's impact-analysis gate:
`present` nhưng `stale` → **degraded**, không dùng GitNexus cho blast
radius ở đây. Cross-check thay thế: grep thủ công đầy đủ trên toàn
`src/`+`bin/` (68 hit `'doing'`/`"doing"`, 15 file — RESEARCH.md round 1),
đọc trực tiếp từng file liên quan thay vì tin GitNexus.

## Approach

**Đường đi chọn**: một item nguyên khối (không split) — 6 mảnh trong
implementation checklist của anh phụ thuộc lẫn nhau CHẶT: claim-time
ngừng ghi durable doing (D1) BẮT BUỘC đi cùng CAS mới (D2) và effective
view (D4) trong CÙNG một lần merge, nếu không hệ thống vỡ giữa chừng
(vd claim ngừng ghi doing nhưng frontier vẫn đọc durable → item đang
làm hiện lại ready, bị pick trùng — đúng bug D4 cảnh báo). Không có
"mảnh nào tự đứng được, tự thấy giá trị" theo đúng nghĩa `fgos-coding-
planning`'s split test — nên viết spec 1 mảnh, không tạo child.

**Thứ tự file, theo phụ thuộc (đọc trước khi sửa, sửa theo thứ tự
này)**:

1. `src/state/fgos-file-registry.mjs` — thêm 2 entry vào `FGOS_FILE`/
   `FGOS_FILE_RESOLVERS` đã có sẵn (KHÔNG tạo bảng mới — dùng nguyên cơ
   chế `resolveFgosFile(dir, kind)` đã build ở tsk phase-03): claims dir
   (`.fgos/runtime/claims/`) và claims lock (`.fgos/runtime/claims.lock`).
   `.fgos/runtime/` đã gitignore sẵn — không sửa ignore rule.

2. `src/state/runtime-coordination.mjs` (MỚI) — `acquireClaim(fgosDir,
   {id, actor, source, branch, branchHeadAtTake, headAtTake,
   claimTrigger, preClaimStatus, preClaimRevision})`, `releaseClaim
   (fgosDir, {id, claimId, reason})`, `readClaims(fgosDir)`,
   `readClaim(fgosDir, id)`. Atomic qua 1 lock file chung
   (`.fgos/runtime/claims.lock`, cùng kiểu atomic-rename-based
   `main-checkout-lock.mjs` đã dùng — không phải khoá per-item, khoá cả
   thư mục claims/ trong lúc acquire/release, giữ ngắn vì chỉ ghi/xoá 1
   file JSON nhỏ). Record 1 file JSON/id dưới `.fgos/runtime/claims/
   <id>.json` (D2's schema: claimId, id, actor, preClaimStatus,
   preClaimRevision, branch, branchHeadAtTake, headAtTake, claimTrigger,
   acquiredAt, lastObservedActivityAt, hardExpiresAt).
   `preClaimRevision` = hash/seq mới nhất của item đó trong durable log
   tại thời điểm acquire (đọc qua `readRawEvents`/fold hiện có, không
   cần cơ chế mới).

3. `src/state/store.mjs` — thêm hàm mới `settleClaim(dir, {id, claimId,
   finalStatus, ...})` cạnh `moveWork` hiện có (không sửa `moveWork`'s
   chữ ký công khai): validate qua `runtime-coordination.mjs`'s
   `readClaim` (claimId khớp, preClaimRevision còn đúng — CAS D2, không
   dùng `expectedStatus:'doing'` nữa), rồi ghi ĐÚNG 1 lần dưới
   `events.lock` full segment `work.move(preClaimStatus->doing)` +
   `work.attempt(phase:execute,...)` + `work.move(doing->finalStatus)`
   — 3 event nối tiếp trong cùng 1 lần giữ lock (không phải 3 lời gọi
   `moveWork` riêng — tránh race giữa các bước). Release runtime claim
   SAU KHI durable write thành công (D2 thứ tự 6-7).

4. `src/state/replay.mjs` — `applyEvent`'s switch thêm case
   `'work.attempt'`: fold vào `item.attemptCount` (+1) và
   `item.lastAttempt` (snapshot `{phase, result, endedAt}`) — additive,
   không đổi field cũ. `work.move` case giữ nguyên (segment vẫn dùng
   đúng event type cũ, chỉ đổi AI/KHI NÀO ghi).

5. `src/runner/claim-port.mjs` — `claimWork()`: bỏ lời gọi
   `moveWork(dir,{to:'doing',...})` (dòng 365-373 hiện tại), thay bằng
   `acquireClaim(...)`. Giữ nguyên thứ tự: đọc durable view (đã có) →
   check claimable (worker-slot/deps-not-merged/branch-take, ĐỔI nguồn
   worker-slot ceiling sang đọc effective view — xem mục 7) → acquire
   runtime claim → tạo/reuse worktree nếu `isolate` → nếu tạo worktree
   fail, `releaseClaim` (thay vì `moveWork` revert dòng 432 hiện tại).
   Stale-claim reclaim (dòng 245-360) đổi nguồn đọc từ durable
   `item.status==='doing'` sang `readClaims`'s active claim, nhưng vẫn
   dùng NGUYÊN `isReclaimEligible`/`lastActivityAt` (D6 — không viết lại
   liveness). `event.seq` trong return value đổi thành `claimId` (không
   còn seq durable ở claim-time).

6. `src/runner/loop.mjs` — `startupReap` (dòng 384-450): quét
   `readClaims` thay vì durable `status!=='doing'`; return path (dòng
   915, 998) gọi `settleClaim` thay vì `moveWork(...,expectedStatus:
   'doing')`.

7. `src/state/worker-slots.mjs` — `countWorkerSlots(view,...)` nhận
   thêm effective view (durable view đã merge active claims — hàm merge
   này sống ở đâu cần chốt lúc implement: có thể 1 hàm mới
   `buildEffectiveView(durableView, claims)` trong
   `runtime-coordination.mjs`, hoặc `replay.mjs`). Giữ `worker-slots.mjs`
   PURE (nhận view đã merge sẵn, không tự đọc `.fgos/runtime/`) — đúng
   nguyên tắc file tự khai từ đầu.

8. `src/state/frontier.mjs` — mọi chỗ đọc `item.status==='doing'` cho
   blocking-calc (dòng 12 vùng liên quan) đổi sang nhận effective view
   từ caller — PURE, không tự đọc `.fgos/runtime/` (cùng nguyên tắc mục 7).

9. `src/runner/anti-loop.mjs` — `visitCount` đổi từ đếm
   `payload.to==='doing'` sang đếm `event.type==='work.attempt' &&
   payload.phase==='execute'` (D3, hard migration — không dual-count).

10. `src/intake/plan.mjs` — retire `releaseClaimOnExecuting` (dòng
    525-540, D5). Runtime claim giữ nguyên qua planning→executing,
    không release/reclaim durable nữa.

11. Mọi caller/consumer khác đọc `status==='doing'` để suy ra "đang
    chạy" (`fgos list/show`, `bin/fgos.mjs`'s CLI output, `entropy.mjs`
    dòng 112) đổi sang đọc effective view.

**Rủi ro chính + proof point cho validating**:

- **CAS đúng dưới concurrent claim** — 2 process claim cùng id cùng
  lúc: chỉ 1 acquire thắng, loser nhận lỗi typed, KHÔNG ghi event nào
  (test tương đương `addWork under concurrent OS processes` đã có trong
  `store.test.mjs`, viết bản mới cho `acquireClaim`).
- **`git status --short -- .fgos/events .fgos/events.jsonl` không đổi
  sau `pick`/`take`** — acceptance criteria #1, test bằng cách thật:
  init repo, commit baseline, `pick`, diff git status trước/sau.
- **worktree-creation fail không để lại durable doing lẫn stale runtime
  claim** — test giả lập `createClaimWorktree` throw, assert cả 2 phía
  sạch.
- **Effective view đúng cho item đã claim TỪ TRƯỚC migration** (durable
  status vẫn `'doing'` cũ, không có runtime claim tương ứng) — fallback
  tự nhiên của formula `effectiveStatus = activeClaim ? 'doing' :
  durableStatus` phải tự cho ra đúng `'doing'` không cần code đặc biệt;
  cần 1 test xác nhận đúng thật, không chỉ suy luận trên giấy.
- **`fgos return`/verify-fail settle đúng full-segment, đúng thứ tự
  event** — durable log sau settle phải đọc lại y hệt hành vi cũ qua
  `foldEvents` (test round-trip).

## Assumptions (implementation-level, không phải CONTEXT.md gap)

- `buildEffectiveView`/hàm merge durable+claims cụ thể sống ở module
  nào (`runtime-coordination.mjs` vs `replay.mjs`) — quyết định lúc
  implement, không ảnh hưởng scope/behavior/acceptance.
- Khoá `.fgos/runtime/claims.lock` dùng atomic-rename pattern giống
  `main-checkout-lock.mjs` — chi tiết cụ thể (TTL nội bộ của LOCK này,
  khác `hardExpiresAt` của claim) là chi tiết implement.
- `work.attempt`'s field shape đầy đủ (ngoài `phase`/`result` đã chốt)
  do implement tự thiết kế theo nhu cầu thật lúc code, miễn giữ đúng
  semantics D3 (anti-loop đếm được `phase==='execute'`).

## Files touched (footprint)

`docs/history/runtime-claim-doing-separation/plan.md`,
`src/state/fgos-file-registry.mjs`, `src/state/runtime-coordination.mjs`,
`src/state/store.mjs`, `src/state/replay.mjs`, `src/runner/claim-port.mjs`,
`src/runner/loop.mjs`, `src/state/worker-slots.mjs`,
`src/state/frontier.mjs`, `src/runner/anti-loop.mjs`, `src/intake/plan.mjs`,
`bin/fgos.mjs`, `test/runner/claim-port.test.mjs`, `test/state/store.test.mjs`,
`test/runner/loop.test.mjs` (nếu tồn tại — xác nhận lúc implement),
`test/state/worker-slots.test.mjs`, `test/state/frontier.test.mjs`,
`test/runner/anti-loop.test.mjs`.

## Verify

`npm test` (whole-suite regression — thay đổi chạm core FSM/claim/CAS,
không có 1 lệnh hẹp nào chứng minh đủ; mọi test hiện có phải xanh CỘNG
test mới cho `acquireClaim`/`settleClaim`/effective-view).

## Outstanding questions

None
