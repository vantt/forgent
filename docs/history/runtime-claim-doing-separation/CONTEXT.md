# CONTEXT — tsk-40m: tách live claim/doing khỏi durable eventlog

> **SUPERSEDED (2026-08-25) — đọc docs/architect/doing-coordination-redesign.md
> trước khi implement bất cứ gì dựa vào file này.** Sau khi round implement đầu
> theo D1-D6 dưới đây bị review round phát hiện vấn đề (settle full-segment
> `work.move(preClaimStatus->doing)` + `work.attempt` + `work.move(doing->
> finalStatus)` vẫn để lại một khoảng hở đủ để race/đọc dở dang thấy durable
> `doing`), user được hỏi trực tiếp qua AskUserQuestion và chọn "Làm ngay":
> settleClaim đổi thành **direct settle** — CHỈ 1 work.move
> (preClaimStatus->finalStatus), không còn leg trung gian `->doing` nào dưới
> events.lock, cộng cạnh FSM mới `todo -> awaiting-approval`. D1 (durable
> vs runtime split) và D2 (CAS mới)/D4 (effective view)/D5 (releaseClaimOnExecuting
> retired)/D6 (reclaim liveness) trong bảng "Locked decisions" bên dưới VẪN
> ĐÚNG; chỉ phần "settle ghi full 3-event segment" của D1's implementation
> (plan.md mục 3) bị thay bằng direct-settle. D3 (anti-loop hard-cut,
> đếm work.attempt(phase:execute), không dual-count legacy) giữ nguyên và đã
> được xác nhận lại — implementation ban đầu lỡ thêm fallback đếm
> work.move->doing chuẩn cũ, đã sửa lại đúng D3 (không còn fallback).
> Nguồn xác nhận: session log tsk-40m, người dùng chọn "Làm ngay" khi được hỏi
> giữa "giữ nguyên full-segment" và "direct settle"; docs/architect/doing-
> coordination-redesign.md được chính user cập nhật cùng ngày với ngôn ngữ
> hard-cut rõ hơn ("Durable workflow edges that write into doing are not
> normal runtime edges after the hard cut").

## Feature boundary

`fgos take`/`fgos pick` claim một item hôm nay ghi durable
`work.move(to:'doing')` vào `.fgos/events/<writer>.jsonl` (D1 tracked,
git-committed) — mỗi claim làm main checkout dirty/checkpoint churn dù
`doing` chỉ là live coordination, không phải lịch sử cần bền. Phạm vi:
tách claim-time ra khỏi durable write, giữ nguyên `doing` như một khái
niệm hợp lệ nhưng derive nó từ overlay (durable status ⊕ active runtime
claim) thay vì ghi thẳng vào eventlog lúc claim. Không migrate
`.fgos/events/*` cũ sang changeset, không thêm daemon.

## Locked decisions

| D-ID | Quyết định |
|---|---|
| D1 | doing tach 2 lop -- doing-current (derive tu active runtime claim overlay, khong ghi durable luc claim-time) vs doing-history (durable work.attempt record ghi luc settle). Claim chi tao/update runtime claim; effective view = durable status XOR active claim (co claim -> doing). |
| D2 | CAS settle moi = claimId ownership + preClaimStatus + preClaimRevision, khong dung expectedStatus:'doing' nua. Schema runtime claim: claimId, id, actor, preClaimStatus, preClaimRevision, branch, branchHeadAtTake, acquiredAt, lastObservedActivityAt, hardExpiresAt. Settle: check claim con ton tai + claimId khop + owner co quyen + durable revision con dung preClaimRevision. |
| D3 | anti-loop chuyen sang dem durable work.attempt event (phase:execute) thay vi work.move->doing. Hard migration -- khong giu dual-count legacy, khong dem clarify/decompose/planning claim (chi execute phase moi an budget, dung y do goc). |
| D4 | frontier/list/worker-slots/return doc effective view (durable status overlay active runtime claim), khong doc durable status tho. Formula: effectiveStatus(item) = activeClaim(item.id) ? 'doing' : durableStatus(item). Dependency-resolved/finality logic van dua durable final states (delivered/done/wontfix/retrospective/cleanup) -- khong doi. |
| D5 | releaseClaimOnExecuting (src/intake/plan.mjs:525-540, claim-lock parag3b) duoc retire trong hard-cut nay -- runtime claim giu nguyen xuyen suot clarify->executing (khong con durable doing de release/reclaim giua chung). Neu can pause/release that, ghi durable work.attempt result:'released' roi xoa runtime claim. |
| D6 | reclaim liveness dung isReclaimEligible/lastActivityAt (claim-liveness.mjs, hoat dong git worktree that) lam primary signal; hardExpiresAt chi la backstop cung. Hard migration -- chap nhan downtime, khong giu backward-compat song song cho write moi; durable-doing cu (ghi truoc migration) van doc dung qua fallback tu nhien cua effectiveStatus formula (khong active claim -> doc durable status, ke ca 'doing' cu). |

## Pinned terms

- **durable status** — trạng thái FSM bền, đọc từ eventlog/changeset
  (`todo`/`blocked`/`awaiting-approval`/`delivered`/...). Nguồn sự thật
  cho workflow lifecycle.
- **runtime claim** — record sống trong `.fgos/runtime/claims/<id>.json`
  (gitignored), đại diện ai đang giữ/làm 1 item ngay lúc này. Không phải
  lịch sử — bị ghi đè/xoá khi release.
- **effective status** — `activeClaim(id) ? 'doing' : durableStatus(id)`.
  View mà list/show/frontier/worker-slots/UI thực sự đọc.
- **doing-current** — effective status `'doing'`, derive từ active
  runtime claim, không phải một giá trị ghi trực tiếp vào durable eventlog
  nữa.
- **doing-history / work.attempt** — record durable ghi lúc settle (return/
  release/fail/reclaim), mô tả một lần attempt/run đã xảy ra. Dùng cho
  audit + anti-loop, phân biệt "todo chưa từng làm" với "todo đã từng làm
  rồi release/fail".
- **preClaimStatus / preClaimRevision** — snapshot durable status + per-item
  event revision tại thời điểm claim, dùng làm cơ sở CAS lúc settle (thay
  cho `expectedStatus:'doing'` cũ).
- **hardExpiresAt** — giới hạn cứng backstop trên runtime claim; không phải
  cơ chế reclaim chính (đó là `isReclaimEligible`/`lastActivityAt`, hoạt
  động git-worktree thật).

## Scout evidence

- `src/runner/claim-port.mjs:97-449` — `claimWork()` đan xen worker-slot
  ceiling (251-261), stale-claim reclaim (245-249, 323-360, đọc durable
  `item.status`+`claimRole`), branch-take (296-300, claim có thể xuất
  phát từ durable `blocked`), claim-lock reclaim exemption (280-283,
  `latestTodoReleaseTrigger` đọc lịch sử event).
- `src/state/store.mjs:656-775` — `moveWork()`: CAS thật hôm nay là
  `transitionWork()` so `expectedStatus` với `work.status` DƯỚI
  `events.lock` (`withEventsLockAndRefresh`), conflict ném
  `FsmError('conflict')`, không ghi event.
- `src/state/status-fsm.mjs:109-160` — `doing` là 1 FSM state đầy đủ, 9
  cạnh thật (`todo↔doing`, `blocked↔doing`, `awaiting-human↔doing`,
  `doing→awaiting-approval`, `doing→delivered`, `doing→wontfix`).
- `src/state/worker-slots.mjs:106-119` — `countWorkerSlots(view,...)`
  PURE, đếm durable `status==='doing'` trực tiếp từ view đã fold.
- `src/runner/anti-loop.mjs:34-86` — `visitCount` đếm số lần
  `payload.to==='doing'` trong lịch sử event (tín hiệu chống-loop).
- `src/runner/loop.mjs:384,404,438,450,915,998` — `startupReap` quét
  durable `status!=='doing'`; return/verify-fail path CAS
  `expectedStatus:'doing'`.
- `src/runner/claim-liveness.mjs:30-115` — `isReclaimEligible`/
  `lastActivityAt` đã có sẵn: đọc hoạt động git worktree thật, ngưỡng
  khác nhau theo `claimRole` (`agentMs` runner, `humanMs` human/session).
- `src/state/frontier.mjs:12` — `doing` tham gia trực tiếp blocking-calc
  (item nào unblock được dependent).
- `src/intake/plan.mjs:525-540` — `releaseClaimOnExecuting` (claim-lock
  §3b): release durable claim về `todo` khi item chạm `executing`, để
  driving loop tự re-claim. Chỉ cần thiết vì durable `doing` tồn tại hôm
  nay — retire theo D5.
- 68 hit `'doing'`/`"doing"` trên 15 file (`src/`+`bin/`) — grep đầy đủ
  ghi tại `RESEARCH.md` round 1; các file còn lại (`entropy.mjs`,
  `command-registry.mjs` mô tả CLI, `work.mjs` STATUSES enum,
  `workflow-stage-graphs.mjs` comment) không cần đổi hành vi.

## Canonical references

- `docs/history/runtime-claim-doing-separation/RESEARCH.md` — round 1
  đầy đủ trích dẫn.
- `src/state/fgos-file-registry.mjs` — path resolver cho `.fgos/cache/`,
  `.fgos/logs/`, `.fgos/runtime/` đã có sẵn (KHÔNG làm lại — dùng nguyên,
  runtime claim files sống dưới `.fgos/runtime/`).

## Outstanding questions

None
