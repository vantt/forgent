# Research — tsk-40m: tách live claim/doing khỏi durable eventlog

## Round 1 (2026-08-25, stage discovery)

**Asked:** 3 goal — (1) cơ chế claim hiện tại (claim-port.mjs/store.mjs),
(2) mọi nơi đọc `status:'doing'` hôm nay, (3) test hiện có.

**Checked:** đọc trực tiếp `src/runner/claim-port.mjs` (toàn file, 449
dòng), `src/state/store.mjs:656-775` (`moveWork`), `src/state/
worker-slots.mjs` (toàn file), `src/state/status-fsm.mjs:100-165`
(TRANSITIONS), `src/runner/anti-loop.mjs`, `src/runner/loop.mjs`
(startupReap + return path), grep `'doing'`/`"doing"` toàn `src/`+`bin/`
(68 hit, 15 file).

**Found:**

1. `claimWork()` (`claim-port.mjs:97-449`) không chỉ "ghi doing" — nó đan
   xen 4 cơ chế đọc DURABLE view để quyết định claim có hợp lệ không:
   - **Worker-slot ceiling** (dòng 251-261): gọi `hasWorkerSlotRoom(view,
     ...)` — `view` là durable fold từ eventlog.
   - **Stale-claim reclaim** (dòng 245-249, 323-360): đọc
     `item.status === 'doing'` + `item.claimRole` (durable) + gọi
     `isReclaimEligible`/`lastActivityAt` (`claim-liveness.mjs`, đọc git
     worktree activity — KHÔNG liên quan .fgos) để tự release claim cũ
     rồi claim lại.
   - **Branch-take** (dòng 296-300): `item.status === 'blocked' &&
     branchAlreadyExists` — claim có thể xuất phát từ `blocked`, không
     chỉ `todo`.
   - **Claim-lock reclaim exemption** (dòng 280-283):
     `latestTodoReleaseTrigger(rawEvents, id) === 'claim-lock-3b'` — đọc
     LỊCH SỬ EVENT (không chỉ status hiện tại) để phân biệt "release do
     planning→executing" (giữ nguyên branchHeadAtTake) với release khác
     (reject/verify-fail, phải tính lại).

2. `moveWork()` (`store.mjs:656-775`) — cơ chế atomic THẬT hôm nay:
   `transitionWork()` (status-fsm.mjs) so `expectedStatus` với
   `work.status` hiện tại DƯỚI `events.lock` (`withEventsLockAndRefresh`)
   — conflict ném `FsmError('conflict')`, KHÔNG ghi event. Đây chính là
   CAS đảm bảo "chỉ 1 claim thắng" hôm nay. `acquireClaim` mới phải tái
   tạo đúng bảo chứng này bằng `.fgos/runtime/claims.lock`, không chỉ
   "ghi file rồi thôi".

3. `status-fsm.mjs:109-160` — `doing` là 1 STATE ĐẦY ĐỦ trong FSM, có 9
   cạnh thật: `todo→doing`, `blocked→doing`, `awaiting-human→doing`,
   `doing→blocked`, `doing→awaiting-approval`, `doing→todo`,
   `doing→delivered`, `doing→awaiting-human`, `doing→wontfix`. Không chỉ
   "claim" — MỌI cạnh ra khỏi `doing` (return, verify-fail, reject,
   park) hôm nay CAS trên `expectedStatus:'doing'` (vd `loop.mjs:404,
   450, 915, 998`). Nếu claim không còn ghi durable `doing`, các CAS này
   compare với gì? Durable status sẽ vẫn là `todo` (chưa từng đổi) —
   `expectedStatus:'doing'` sẽ KHÔNG BAO GIỜ khớp nữa, mọi `return`
   durable sẽ vỡ CAS trừ khi status-fsm.mjs có cạnh MỚI
   (`todo→awaiting-approval`, `todo→blocked`...) hoặc CAS đổi cơ sở
   sang giá trị runtime-claim ghi lại tại thời điểm claim.

4. `anti-loop.mjs` (`visitCount`, dùng bởi `claim-port.mjs:163` cho
   `priorVisits`) đếm SỐ LẦN `work.move` với `to:'doing'` đã từng xảy ra
   cho 1 id — đây là tín hiệu chống-loop dựa trên LỊCH SỬ EVENT. Nếu
   claim không còn ghi event, tín hiệu này biến mất trừ khi thay bằng
   nguồn khác (runtime claim không có lịch sử tích luỹ qua nhiều lần
   claim/release — mỗi file bị ghi đè).

5. `loop.mjs`'s `startupReap` (dòng 384, 404, 438, 450) quét
   `item.status !== 'doing'` (durable) để tìm item kẹt sau crash runner,
   rồi `moveWork(..., expectedStatus:'doing')` để đẩy về
   `blocked`/`resolution.to`. Đây CHÍNH LÀ "stale/reclaim logic" trong
   acceptance criteria — nhưng hôm nay nó quét DURABLE view, không phải
   runtime claim. Phải viết lại để quét runtime claims + TTL/liveness
   (`claim-liveness.mjs` đã có cơ chế liveness riêng, tách biệt).

6. 68 hit `'doing'` trải trên 15 file: `claim-port.mjs`, `anti-loop.mjs`,
   `frontier.mjs`, `entropy.mjs`, `command-registry.mjs`, `status-fsm.mjs`,
   `intake/plan.mjs`, `work.mjs`, `loop.mjs`, `worker-slots.mjs`,
   `replay.mjs`, `workflow-stage-graphs.mjs`, `store.mjs`, `bin/fgos.mjs`,
   `intake/discovery.mjs`. `frontier.mjs`'s comment (dòng 12) xác nhận
   `doing` tham gia trực tiếp vào tính "item nào unblock được dependent" —
   một use khác chưa nằm trong danh sách 4 consumer acceptance criteria
   liệt kê (list/show/status, worker-slots, return, stale-reclaim).

**Còn mở (chưa đủ bằng chứng để tự phán clear):**

- Task spec không nói rõ: `doing` có còn tồn tại như một GIÁ TRỊ hợp lệ
  trong `status-fsm.mjs`'s TRANSITIONS không, hay các cạnh vào/ra nó
  (return, reject, verify-fail-park) phải thêm cạnh MỚI bỏ qua `doing`
  hoàn toàn trong durable FSM (`todo→awaiting-approval`,
  `todo→blocked`...)? Đây là quyết định kiến trúc thật, ảnh hưởng
  `status-fsm.mjs` (module trung tâm nhất, mọi consumer phụ thuộc).
- `anti-loop.mjs`'s `visitCount` (chống thrash/loop) dựa 100% vào lịch sử
  event `to:'doing'` — chuyển claim ra runtime thì tín hiệu này mất, cần
  quyết định: bỏ hẳn (chấp nhận rủi ro loop không phát hiện được), hay
  runtime claim phải tự giữ lịch sử riêng (mâu thuẫn với record
  "1 file/id, ghi đè" mà task đề xuất)?
- `frontier.mjs` cũng đọc `doing` cho blocking-calc — chưa được liệt kê
  trong danh sách consumer cần đổi của task; cần xác nhận có nằm trong
  phạm vi hay không.
- CAS-check-basis mới cho `return`/verify-fail/reject: so `expectedStatus`
  với cái gì nếu durable status không còn đi qua `doing`? (runtime claim
  tự ghi lại `preClaimStatus` để CAS so sánh khi release?)

**Verdict:** `unclear` — 4 điểm trên là quyết định kiến trúc thật (đổi
FSM transition table, đánh đổi tín hiệu anti-loop, phạm vi frontier.mjs,
cơ sở CAS mới), không phải thiếu thông tin có thể tự tra thêm. Cần một
người chốt ở `exploring` trước khi viết plan.
