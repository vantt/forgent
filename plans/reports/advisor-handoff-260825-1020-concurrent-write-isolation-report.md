# Prompt gửi advisor agent — cách ly concurrent write / chống main dirty (fgOS)

> Copy nguyên khối dưới đây làm prompt cho một advisor agent độc lập (không
> có lịch sử chat này). Agent đó chỉ cần đọc repo thật (đường dẫn đã trỏ sẵn),
> không cần thêm context từ chúng ta.

---

## Bối cảnh

Bạn đang tư vấn kiến trúc cho **fgOS** (repo hiện tại), một hệ điều phối
nhiều agent/session làm việc song song trên cùng một git repo. Mỗi worker
claim một work item, chạy trong một **ephemeral git worktree** riêng (code).
Nhưng theo **ADR0020** (`docs/decisions/index.md`, narrative đầy đủ ở
`docs/specs/runner.md`): worktree KHÔNG bao giờ mang theo `.fgos/` — thư mục
này bị xoá hẳn khỏi mọi worktree checkout, và `merge.mjs` từ chối cứng bất kỳ
diff nào chạm `.fgos/` đến từ nhánh worker. Hệ quả: **mọi write vào
`.fgos/`** (event log điều phối, lock, state) **chỉ được phép xảy ra trên
MỘT working directory duy nhất — main checkout** — bất kể có bao nhiêu
worker đang chạy song song trong các worktree riêng của họ.

Đọc trực tiếp các file này trước khi kết luận bất cứ điều gì (đừng suy diễn
từ prompt, tự verify):

- `src/state/store.mjs` — điểm chạm tên file, `withEventsLockAndRefresh`
  (gộp CAS-precondition + append + refreshView vào một critical section).
- `src/state/events.mjs` — `withEventsLock`/`appendEvent`, lock scope =
  toàn bộ `dirname(logPath)` tức toàn bộ `.fgos/`, không phải per-file.
- `src/state/replay.mjs` — multi-file discovery + dedupe theo content-hash,
  `tryIncrementalRebuild`.
- `src/state/events-jsonl-truncation-guard.mjs` — checkpoint tự động:
  `PERIODIC_CHECKPOINT_INTERVAL_SEC = 900`,
  `DEFAULT_CHECKPOINT_EVENT_THRESHOLD = 50`, tạo commit
  `chore(.fgos): periodic events.jsonl checkpoint`.
- `src/runner/merge.mjs` — `performCatchUp` (merge `main` vào worker branch
  trong ephemeral worktree), `mergeRunnerItemLocked`/`abortMergeIfPossible`
  (đường approve/merge lên main).
- `docs/decisions/index.md` mục D-ADR0020, và `docs/specs/runner.md` phần
  narrative của ADR0020.

## Đã làm gì 2 ngày trước (2026-08-23) — "Tầng A" và "Tầng B"

Team đã dành nhiều thời gian nghiên cứu để cách ly concurrent write, chia
làm hai item:

**Tầng A — `tsk-3ve`, thư mục
`docs/history/eventlog-tier-a-multifile-content-hash/`** (đã land, xem
`CONTEXT.md`/`DISCUSSION.md` ở đó cho đủ 16 decision TA-D0..TA-D15): đổi
**cấu trúc dữ liệu** của event log —
- identity mỗi event = content-hash (SHA-256 cắt 16 hex) thay vì `seq`
  đơn thuần;
- tách `events.jsonl` thành nhiều file nhỏ theo **session/writer** dưới
  `.fgos/events/<writer-id>-<openTs>.jsonl` — 2 writer đồng thời = 2 file
  khác tên, replay gom + sort theo `(ts, tên-file, seq-trong-file)`;
- compaction gộp file nguội (idle) vào baseline mới, có verify gate;
- **TA-D14 chốt tường minh: `events.lock` giữ nguyên phạm vi TOÀN THƯ MỤC
  `.fgos/` — "per-file lock là sai".**
- **TA-D0 chốt tường minh: Tầng A KHÔNG đụng vị trí ghi — mọi write vẫn về
  main checkout, ADR0020 không đảo.**

**Tầng B — `tsk-3tp`, thư mục
`docs/history/tsk-3tp-worker-write-events-tang-b/`**: mục tiêu BAN ĐẦU là
cho worker ghi `.fgos/` ngay từ trong worktree của họ (tức mới thực sự cách
ly nơi ghi). Quyết định D3 (log trong `CONTEXT.md` cùng thư mục): **"Tầng B
đóng vĩnh viễn — ADR0020 giữ nguyên không ngoại lệ."** Item bị repurpose
tại chỗ thành một việc hẹp hơn nhiều — "sweep checkpoint redesign": thay vì
tạo commit checkpoint riêng theo timer/đếm-event, gom (sweep) các shard dirty
vào chính các merge/approve commit main đằng nào cũng đang tạo, cộng một
fallback thưa (~60 phút) cho khoảng lặng. KHÔNG đổi nơi ghi, KHÔNG đổi cơ
chế `events.lock`.

**⇒ Việc cần đánh giá:** cả hai tầng cộng lại thay đổi *định dạng file* và
*nhịp commit* của event log, nhưng **không hề thay đổi việc mọi writer vẫn
phải serialize qua đúng MỘT working directory và MỘT lock phủ toàn bộ
`.fgos/`**. Nguyên nhân gốc — nhiều worker cùng tranh chấp một checkout —
có vẻ chưa được động tới. Team tự nhận thấy điều này ("hình như không giải
quyết được gì") sau khi trải qua sự cố hôm sau; hãy verify độc lập xem nhận
định đó có đúng không, và nếu đúng, vì sao — thiết kế sai hướng, hay chỉ là
scope Tầng A/B cố tình hẹp và phần việc thật vẫn còn ở phía trước?

## Sự cố hôm qua (2026-08-24)

Theo báo cáo của người vận hành (chưa verify hết bằng số liệu — bạn tự đối
chiếu):
- Một lần merge kéo dài **~3 tiếng**.
- **20+ lần catchup**, phần lớn do dirty gây ra bởi các checkpoint liên
  quan `.fgos/` (data, không phải code).
- Một sự cố **mất dữ liệu liên quan tới merge**.

Bằng chứng đã tự verify được trong repo (dùng làm điểm neo, không phải toàn
bộ sự thật — đào thêm nếu cần):
- `git log` ngày 2026-08-24 (00:00→2026-08-25 08:00): **503 commit tổng**,
  trong đó **169 commit** (~34%) là `chore(.fgos): periodic events.jsonl
  checkpoint` — TỨC LÀ ngay cả sau khi Tầng A/B (sweep redesign) đang land,
  khối lượng checkpoint churn hôm qua vẫn rất lớn.
- Report cũ hơn 4 ngày (`plans/reports/investigation-260821-1050-eventlog-loss-merge-speed-root-cause-report.md`)
  đã đo: 17 commit checkpoint trong <13h, 2 catchup/40 phút trên 1 nhánh —
  tức là churn này đã được lượng hoá TRƯỚC sự cố hôm qua, và hướng fix chọn
  (Tầng A + Tầng B thu hẹp) nhắm vào nhịp commit + định dạng file, không
  nhắm vào gốc rễ "một checkout dùng chung".
- `tsk-3ve`'s CONTEXT.md tự ghi một **INCIDENT sống ngay trong lúc nghiên
  cứu** (2026-08-23 ~10:29-10:33Z): 7 lệnh `fgos decision` exit 0 nhưng event
  không bao giờ xuất hiện trong `.fgos/events.jsonl` main checkout — không
  checkpoint commit nào từng chứa, guard không fire. Cùng class với
  `tsk-1vc` (silent loss, "exit-0-nhưng-mất").
- Một chuỗi item xử lý cùng một họ triệu chứng kéo dài nhiều tuần, mỗi item
  đóng một cơ chế cụ thể rồi để ngỏ câu hỏi lớn hơn:
  `tsk-1vc`/`tsk-1vc-1/2/3` (silent eventlog loss), `tsk-1i3` (merge content
  precedence overwrite), `tsk-3wq` (merge driver recurring write loss),
  `tsk-1ji` (`events-jsonl-merge-abort-truncation-gap` — tự kết luận
  "interleaving này không mất dữ liệu nhưng để lại main checkout ở trạng
  thái broken/half-aborted cần recovery tay", và **tự để ngỏ nguyên văn**:
  "cơ chế thật đằng sau các sự cố mất dữ liệu" vẫn CHƯA xác định), `tsk-4te`
  (đóng làm trùng tsk-1vc), `tsk-5et` (đóng hôm qua 2026-08-24 — `fgos
  catchup`'s `performCatchUp` xử sai một kiểu từ chối merge của git —
  "not uptodate" pre-merge refusal không có `MERGE_HEAD` — như một lỗi mù
  mờ thay vì một outcome có kiểu).
- Có thư mục `docs/history/catchup-manual-merge-fgos-write-rejected-deadlock/`
  — đọc để lấy thêm bằng chứng cụ thể về sự cố catchup/deadlock nếu cần.

Bạn cần tự đọc các `RESEARCH.md`/`CONTEXT.md` liên quan (đường dẫn ở trên)
để xác nhận độc lập, không tin số liệu trong prompt này là đủ.

## Câu hỏi cần bạn tư vấn (tập trung đúng 3 mảng: store, lock, cách ly eventlog)

1. **Store**: `.fgos/events.jsonl` (baseline-0, đông cứng) +
   `.fgos/events/<writer>-<ts>.jsonl` (per-writer shard, git-tracked) là
   nguồn thật; `state.json` là view dẫn xuất (gitignored). Thiết kế này có
   đủ để chống mất dữ liệu và giảm merge conflict không, hay bản chất vấn
   đề nằm ở tầng dưới (filesystem/git, không phải format)?

2. **Lock**: `events.lock` khoá TOÀN BỘ `.fgos/` cho mọi thao tác đọc/ghi
   (TA-D14 đã cân nhắc per-file lock và bác bỏ). Có phải đây là điểm nghẽn
   thật (mọi writer serialize qua 1 khoá, dù đã tách file) không? Có mô
   hình lock nào khác (ví dụ optimistic/CAS thuần theo content-hash, không
   cần lock exclusivity ở mức directory) giải quyết được mà vẫn giữ đúng
   ADR0020 không?

3. **Cách ly eventlog chống conflict/main dirty**: ADR0020 buộc mọi
   `.fgos/` write đi qua đúng MỘT working directory (main checkout) —
   Tầng B (phương án cho worker ghi từ worktree riêng) đã bị đóng vĩnh viễn
   với lý do giữ nguyên ADR0020 không ngoại lệ. Đây có phải chính là nút
   thắt cần tháo không? Nếu ADR0020 là hằng số không đổi được (lý do gốc:
   xem `docs/specs/runner.md` phần narrative D-ADR0020), thì trong ràng
   buộc đó có phương án nào KHÁC Tầng A/B đã thử mà thật sự giảm được
   tranh chấp trên main checkout không (ví dụ: hàng đợi ghi off-checkout
   rồi apply tuần tự, một daemon single-writer, batch nhiều event của
   nhiều worker vào một lần khoá ngắn thay vì mỗi worker tự khoá riêng,
   v.v.)? Nếu KHÔNG có phương án nào trong ràng buộc đó thực sự hiệu quả,
   nói thẳng — và nêu rõ cái giá phải trả nếu revisit ADR0020.

## Yêu cầu output

- Đánh giá thẳng: Tầng A + Tầng B (thu hẹp) có giải quyết được nguyên nhân
  gốc của sự cố hôm qua (3 tiếng merge, 20+ catchup, mất dữ liệu) không —
  có bằng chứng cụ thể trích từ repo, không phỏng đoán.
- Nếu không, chỉ rõ: root cause thật là gì (dùng bằng chứng, không lý
  thuyết suông), và ADR0020 có phải là ràng buộc đang chặn mọi fix hiệu
  quả không.
- Đề xuất 1-3 hướng cụ thể (ưu tiên hướng khả thi trong ràng buộc hiện có
  trước, hướng đòi sửa ADR0020 nêu riêng kèm trade-off), không cần code,
  chỉ cần kiến trúc + lý do.
- Liệt kê câu hỏi còn treo cần người quyết (nếu có) ở cuối.
