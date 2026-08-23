# CONTEXT: tsk-51m — Merge Conductor (throughput + giải phóng người)

## Feature boundary

`tsk-51m` là **item chủ quản** cho việc xây nốt hai phần chưa ship của thiết
kế "Merge Conductor" (2026-08-01), cộng ba hạng mục phát sinh từ buổi shaping.
Nó không tự viết code — nó giữ thiết kế, đẻ ra năm con, và điều phối chúng.

Thiết kế đầy đủ nằm ở
`docs/history/merge-conductor-throughput-and-human-release/DISCUSSION.md`
(§6 thiết kế, §7 năm hạng mục kèm acceptance/footprint/verify). Doc này chỉ
chứa các quyết định đã khoá và bằng chứng scout đứng sau chúng.

**Trong phạm vi**: §E hàng đợi merge theo ref đích; đưa verify về cửa vào để
cửa ra chỉ fast-forward; refresh base lúc pick; phát hiện lệch sau khi land;
playbook escalation cho ba block reason còn lại.

**Ngoài phạm vi**: tsk-280 (guard `fgos move`, D6 chứng minh không chặn);
`checkMergeStillResolves` contract (phần lớn đã ship qua tsk-3bn/tsk-2u0);
sản xuất sự rời rạc từ lúc decompose (§D.4 của thiết kế gốc — người xác nhận
KHÔNG phải ý mình, không mở hạng mục).

## Locked decisions

| D-ID | Quyết định | Bằng chứng |
|---|---|---|
| D1 | Không cho root chưa gom đủ con land từng phần vào `main` | Người quyết: root tồn tại để gom con, root thiếu con ra `main` có thể gây hỏng. Khớp §H.4 thiết kế gốc |
| D2 | Không tự rebase nhánh đang có commit riêng; refresh chỉ bằng merge-target-vào-nhánh | fgOS có worktree sống gắn từng nhánh; rebase viết lại lịch sử nhánh đang checkout = kiểu tai nạn tsk-3au. Merge-in đúng thứ `catchup` đang làm |
| D3 | Verify chạy đúng một lần ở cửa vào (ngoài lock); cửa ra chỉ fast-forward | `mergedTreeAlreadyVerified` (`src/runner/merge.mjs:803`) + `skipRedundantChecks` (`:1046`) đã cho phép bỏ verify cửa ra khi target là ancestor và tip = `branchHeadAtReturn`. Catchup verify là thứ cấp lại bằng chứng đó |
| D4 | Sau-khi-root-sync là điểm **phát hiện**, không phải điểm catchup; trigger bằng giao đường dẫn thật | Root 13 con land tuần tự ⇒ ~78 lượt catchup+verify (~4h) phần lớn vô ích. Dùng `changedFiles` (`merge.mjs:362`) cả hai phía, không dùng footprint khai báo (`graph-metrics.mjs:598` so footprint *khai báo*, có thể thiếu/lệch) |
| D5 | §E đi trước; ba fix nhỏ chạy song song | §E là điều kiện để D3 đứng vững — target không được nhích giữa catchup-verify và land |
| D6 | tsk-280 không chặn §E; tsk-1zd gộp vào §E | `mergedTreeAlreadyVerified` fail-closed khi thiếu/lệch `branchHeadAtReturn` (`merge.mjs:804`), mà `move` không cấp trường đó (`bin/fgos.mjs:1291-1303`; `store.mjs` không guard verify trên đường status) |
| D7 | Khoá merge theo **ref đích**, đặt trong `approve`; **không** đặt trần số merge đồng thời | Ref đích là ranh giới rời/không-rời thật (xem "Bằng chứng scout" bên dưới). `approve` là execution path duy nhất (tsk-3cs D1) nên đặt ở đó bịt luôn đường người gõ tay — đúng nguyên nhân giẫm chân tsk-3cs D5 đo được |

## Thuật ngữ đã ghim

- **Ref đích** — nhánh mà một merge land VÀO: `fgw/<rootId>` với leaf-to-root,
  `main` (hay trunk thật, qua `detectTrunk`) với root-to-main. Đây là **khoá**
  của hàng đợi §E, không phải id item, không phải đường dẫn checkout.
- **Cửa vào** — bước `catchup`: merge ref đích vào nhánh item rồi verify, chạy
  NGOÀI main-checkout lock, trong worktree của chính item.
- **Cửa ra** — bước land: fast-forward + commit, chạy TRONG lock, không verify.
- **Rời (disjoint)** — hai merge không đụng nhau khi khác ref đích. Cùng ref
  đích thì luôn phải xếp hàng, bất kể đường dẫn file có giao hay không.
- **Điểm phát hiện** — thời điểm sau khi một item land, dùng để *so sánh* và
  *báo*, không bao giờ để tự chạy catchup (D4).

## Bằng chứng scout

- `impact-analysis: full` — `fgos tool query --capability impact-analysis
  --status present` trả về provider `gitnexus`, `status: present`. Index đã
  reindex trong phiên này (2026-08-12, 14.761 nodes / 20.688 edges tại
  `79fead3`); các commit sau đó trên `fgw/tsk-51m` chỉ là docs, nên blast
  radius trên mã nguồn vẫn đúng.
- **Leaf-to-root đã cô lập sẵn** — `bin/fgos.mjs:3145` gọi
  `withMergeEphemeralWorktree` dựng checkout **detached** tại tip của
  `fgw/<rootId>`, merge ở đó, land bằng `git branch -f`; comment `:3110-3117`
  ghi rõ "never the human's own main checkout". NHƯNG `:3150` truyền
  `lockRoot: repoRoot` — nó giành lock ghim vào main checkout, một tài nguyên
  nó không hề chạm. Đây là chỗ phí cơ hội merge rời lớn nhất.
- **Mutex theo root chưa tồn tại** — comment `bin/fgos.mjs:3123-3125` nói
  "D16's per-root merge-mutex lives in the runner's write-queue", nhưng
  `src/runner/write-queue.mjs:1` tự mô tả là "a sequential async write-queue
  primitive" — hàng đợi ghi tuần tự trong tiến trình runner, không phải khoá
  theo root. Overlap hiện chỉ được *phát hiện* (CAS guard của tsk-46a làm bên
  thua fail loudly) chứ không được *ngăn*.
- **`approve` là execution path duy nhất** — tsk-3cs D1
  (`docs/history/merge-list-tree-bottleneck-priority/DISCUSSION.md`):
  "một execution path duy nhất qua `approve`, không có cơ chế cha-tự-merge-con
  riêng biệt". `merge next` chỉ picker rồi gọi `approve` qua `runVerb`.
- **Nguyên nhân giẫm chân thật** — tsk-3cs D5, đo bằng số: 0 sự kiện
  `capacity.dispatch` lúc 2026-08-10 (phiên này đếm lại: 1 trên ~14.500, và là
  capacity `gather`). Giẫm chân đến từ người tự bấm `approve` ở nhiều terminal,
  không phải fanout tự động. Song song thật: 7–8 item vào `doing` mỗi giờ.
- **Vùng găng hôm nay** — `main-checkout-lock.mjs:80` `DEFAULT_TTL_MS` = 180s;
  comment `:87` ghi "merge.mjs:660, measured up to ~185s in practice"; heartbeat
  chắp thêm ở `merge.mjs:745` (tsk-4l8) để lock khỏi tự hết hạn giữa chừng.
- **Nguồn outdated của nhánh** — `worktree.mjs:436-439`: `opts.baseRef` bị bỏ
  qua trên đường reuse; `worktree.mjs:749`: `createBranchRef(..., baseRef:'main')`
  chạy ngay lúc decompose.
- **Playbook còn thiếu** — `bin/fgos.mjs:3814` `CATCHUP_REASONS` nhận 6 reason;
  mới 2 cái có playbook (`verify-fail-post-merge`, `merge-blocked-other-item`).

## Tham chiếu chuẩn

- `docs/history/merge-conductor-throughput-and-human-release/DISCUSSION.md` —
  thiết kế đầy đủ (§6) và năm hạng mục (§7)
- `plans/reports/internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report.md`
  — thiết kế Conductor gốc §A–§I
- `plans/reports/*260812-134*` — bốn report quét (bug clusters, engine/cost,
  contention, prior art)
- `docs/history/merge-list-tree-bottleneck-priority/DISCUSSION.md` — D1/D5
- `docs/platform-foundations.md` L9, L10 — luật khoá phải tôn trọng

## Rủi ro cần theo dõi (không phải nút thiết kế)

Verify chạy chồng dưới tải có thể sinh **verify-fail giả** — tiền lệ tsk-597
("test đua tiến trình trong porting-store flake khi máy tải nặng, gây
verify-fail giả ở cửa merge"). Người đã bác trần số merge đồng thời như một
nút thiết kế (độ song song tự nổi lên bằng số ref đích có việc); ghi lại đây
để nếu triệu chứng xuất hiện thì biết ngay chỗ nhìn.

## Outstanding questions

None
