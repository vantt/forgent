# Root-cause: eventlog data loss + merge verify/return chậm (2026-08-19 → 2026-08-21)

## TL;DR

- **2 vấn đề không độc lập — chúng nuôi nhau.** Fix cho vấn đề #1 (data loss) là periodic auto-commit `.fgos/events.jsonl` mỗi ≤15 phút → tạo local dirty-state liên tục trên main checkout → vừa làm merge fail/retry nhiều hơn (vấn đề #2 tệ hơn), vừa mở thêm cửa sổ race cho đúng loại overwrite mà nó được tạo ra để chặn.
- **Guard chống mất data hiện tại chỉ "warn", không "block".** Xác nhận tại source (`src/state/events-jsonl-truncation-guard.mjs:213`, comment "D1: Detect and warn"). Merge-overwrite thật (`fgw/tsk-6al` đè lên `.fgos/*` của main, 2026-08-20 22:51) đã xảy ra 2 giờ sau khi guard này sống, và guard không chặn được — phải restore tay.
- **Guard còn có race riêng của nó**: cảnh báo "regressed" lúc 03:19:28 hôm nay (seq 22816 < mark 22850) là **false positive** — seq 22850 thực ra chỉ được tạo lúc 03:34:38, *sau* cảnh báo 15 phút. Guard mark bị ghi từ 1 session/worktree khác chưa sync vào main checkout dùng chung → không phải mất data thật, nhưng chứng minh guard mark file không có lock/scope per-session, tự nó không đáng tin.
- **Dispatch-ra-agy đã gây 1 sự cố commit thẳng lên main, bỏ qua toàn bộ verify/return/approve** (tsk-43z, xem bên dưới) — khớp đúng nghi ngờ của anh, đã fix nhưng đáng ghi nhận là bằng chứng trực tiếp cho rủi ro của kiến trúc dispatch-out-of-process.
- **Verify full-suite tốn ~6 phút (3777 test)** — chi phí cấu trúc. `fgos return` đã được vá skip-verify (tsk-6al) nhưng chỉ chạy qua đường fanout; `fgos approve`'s post-merge verify **chưa bao giờ được skip**, luôn full run mỗi lần merge.
- Triplication skill 3 nơi (`.agents/`, `core/`, `plugins/fgOS/`) có drift-guard test xanh (39/39) — **không phải root cause tốc độ**, nhưng đã gây ít nhất 1 bug thật (sửa nhầm bản generated, `48fe78af`) và 1 lần trùng lặp công sức 11 giờ (tsk-6av/tsk-c5u cùng làm 1 việc).

---

## Vấn đề #1 — mất data eventlog

### Timeline

| time | hash/evidence | sự kiện |
|---|---|---|
| 2026-08-20 17:13 | `0f09d479` | tsk-6al/tsk-2yog biến mất khỏi events.jsonl — nhiều session ghi đồng thời vào main checkout dùng chung, seq/timestamp bị đảo. Recreate tay từ session context. |
| 2026-08-20 17:33 | `46d74517` | Lặp lại: tsk-2zo/tsk-4zr biến mất, cùng cơ chế race. Recreate tay lần 2. |
| 2026-08-20 20:33 | `5439eaa2` (tsk-1ji) | Response: thêm `events-jsonl-truncation-guard.mjs` (high-water-mark seq+hash, sidecar gitignored) + periodic auto-commit ≤15 phút. **Detect-only, non-blocking** (try/catch swallow tại `merge.mjs:788,911`). |
| 2026-08-20 22:21 | `02:21:35 log` (seq 22815) | `git merge fgw/tsk-577p` fail exit 128: "Your local changes to .fgos/events.jsonl would be overwritten by merge; merge aborted, main unchanged" — git tự chặn được lần này (fail-safe), nhưng cho thấy local dirty-state trên events.jsonl đang va chạm merge thường xuyên. |
| 2026-08-20 22:51 | `e921fdb4` | `Merge branch 'fgw/tsk-6al'` — snapshot `.fgos/` đông cứng của nhánh (theo ADR0020, worktree phải strip `.fgos/` trước khi land) **đè lên** 4 file live của main (`events.jsonl`, `approve-post-success-faults.jsonl`, `changelog-nag-history.jsonl`, `entropy-history.jsonl`), xoá mất nội dung đã commit thật. Guard (mới sống 2h trước) không chặn được — nó không cover cơ chế merge-overwrite này, chỉ cover raw truncate (reset/checkout/clean). |
| 2026-08-20 22:52:56 | `165bc0cb` | Restore tay 4 file về nội dung trước-merge (58 giây sau khi phát hiện). |
| 2026-08-21 00:30 | `8607438e` (tsk-oet) | Fix-của-fix: thêm `FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1` opt-out — vì chính guard tsk-1ji gây friction cho 1 luồng khác trong vòng 4 giờ sau khi ship. |
| 2026-08-21 03:19:28 | `.fgos/main-checkout-guard-warnings.jsonl` (untracked) | Cảnh báo "regressed": seq 22816 < mark 22850. **Xác minh: false positive** — seq 22850 (`tsk-2jz` work.move) chỉ thực sự được ghi lúc 03:34:38, 15 phút SAU cảnh báo. Guard mark 22850 phải đến từ 1 session/worktree khác đã thấy events.jsonl xa hơn (local, chưa sync) rồi ghi vào sidecar dùng chung không khoá → so sánh sai. |

### Root cause thật (2 cơ chế riêng, cộng dồn)

1. **Concurrent-write race** trên main checkout dùng chung (nhiều session/worktree ghi cùng lúc, không serialize đủ) — nguồn gốc 2 lần mất data đầu (17:13, 17:33).
2. **Merge-strip-overwrite defect**: ADR0020 nói worktree không mang `.fgos/` sống khi land, nhưng merge `fgw/tsk-6al` vẫn để snapshot đông cứng của nhánh thắng thế trên 4 file live — đây là lỗi thứ tự merge/strip, khác hẳn race, và guard hiện tại **không cover** case này (nó chỉ detect chữ ký truncate-then-reappend, không detect merge chọn sai phía).
3. **Guard mark file tự nó có race**: không lock, không scope theo session → có thể sinh false positive/false negative tùy session nào ghi mark cuối. Làm giảm độ tin cậy của toàn bộ cơ chế detect.

### Trạng thái hiện tại: **chưa ổn định, vẫn rủi ro thật**

- Cơ chế merge-overwrite (root cause #2, nghiêm trọng nhất — đã từng xoá data thật) **chưa có fix nào cả**, guard chỉ vá phần race (root cause #1) và detect raw-truncate, không phải merge-overwrite.
- Uncommitted diff hiện tại trên `.fgos/events.jsonl`/`approve-post-success-faults.jsonl` (working tree) trông như ghi thêm bình thường, không phải mất data đang diễn ra.

---

## Vấn đề #2 — merge verify/return chậm

### Cơ chế tối ưu tốc độ trước đây (đã xác nhận)

`88619f23` (2026-08-20 20:24, tsk-6al): `fgos return <id> --worker-verified-sha <sha>` — nếu sha khớp tip nhánh, skip hẳn verify trong worktree tạm (tránh `npm install` + full `npm test` lần 2). Optimization này được tạo ra **để bù lại** chi phí do chính redesign dispatch-out-of-process (`f7850e2e`/`d1cc7093`, 2026-08-18) sinh ra — trước đó code-implement chạy in-process, verify 1 lần; sau redesign, worker verify 1 lần + return verify lại lần 2 = double cost.

### Tại sao chậm quay lại

1. **Optimization chỉ che 1 nửa đường.** `--worker-verified-sha` chỉ được thread qua `fanoutBatchExecutorCli`; các drive đơn lẻ qua `/fgOS:pick` không qua fanout im lặng rơi về `fgos return <id>` trần — full re-verify, không skip. Lợi ích không đồng đều tùy call path.
2. **`fgos approve`'s post-merge verify không bao giờ được skip** — cấu trúc buộc phải verify cây đã merge (không thể tái dùng verify của branch tip). Full suite = **~6 phút** (3777 test, đo thật từ `docs/history/tsk-c5u/iron-law-evidence.md`), trả phí này mỗi lần approve, không có đường tắt.
3. **Chính fix của vấn đề #1 đang làm vấn đề #2 tệ hơn**: 17 commit "periodic events.jsonl checkpoint" landed lên main trong <13 giờ (có lúc dày 5–15 phút/commit) → HEAD main di chuyển nhanh hơn → mọi nhánh `fgw/<id>` đang mở phải catch-up-merge thường xuyên hơn (bằng chứng: `tsk-577p` catch-up 2 lần trong 40 phút). Đây là side-effect đo được, trực tiếp, của guard/checkpoint mới ship — khớp với cảm giác "trước đã giải quyết được, giờ chậm lại" của anh.
4. Triplication `.agents/`/`core/`/`plugins/fgOS/` **không phải nguồn tốc độ chính** — drift-guard test (`test/setup/skill-wrappers.test.mjs`, `test/skills/fgos-mirror.test.mjs`) chạy xanh 39/39. Nó góp phần gián tiếp qua churn (commit dồn dập trên main từ việc dọn dẹp trùng lặp) chứ không phải lỗi layout tự thân.

---

## Sự cố xác nhận khớp nghi ngờ dispatch-ra-agy

**`tsk-43z`**: `dispatch.mjs execute` dùng chung `cwd` (main checkout) cho cả config-resolution lẫn spawn executor thật. Khi đẩy Implement stage của `tsk-5dnt` (worktree-backed) ra ngoài qua agy, worker spawn **ngay trong main checkout** thay vì `fgw/tsk-5dnt` → 1 fix hợp lệ bị commit thẳng lên lịch sử main (`47864e01`), bỏ qua toàn bộ verify/return/approve. Phải `git revert` (`4bc0de28`) và làm lại in-process. Đã fix (`58fe681b`, 22:19 20/8) — nhưng đây là bằng chứng thật, không phải giả thuyết, cho đúng cơ chế anh nghi ngờ.

---

## Work item cần raise ngay

| id | vấn đề | đề xuất |
|---|---|---|
| **`.fgos/config.json` uncommitted diff** (`dispatch.executors.models: {light:haiku, standard:sonnet, heavy:opus}`) | Không gắn với bất kỳ task nào trong 12 task đã audit 2 ngày qua — orphaned change, nguồn gốc không rõ | Anh xác nhận nguồn gốc trước khi commit/revert — không tự ý làm |
| **Guard `merge.mjs:788,911`** | Detect-only, không block; đã chứng minh không chặn được merge-overwrite thật (22:51 20/8) | Cần quyết định: có nên fail-closed (chặn merge khi guard `ok:false`) thay vì chỉ warn? Trade-off: an toàn hơn nhưng thêm 1 điểm block mới, cần review kỹ false-positive rate (đã thấy 1 false positive hôm nay) trước khi bật fail-closed |
| **Periodic checkpoint interval (≤15 phút)** | Đang là nguồn churn trực tiếp làm catchup-merge dày hơn, gián tiếp làm #2 tệ hơn | Cân nhắc giãn interval hoặc đổi cơ chế (commit theo event-count thay vì thời gian) — nhưng giãn ra sẽ mở lại cửa sổ mất-data cho race gốc. Cần anh quyết trade-off tốc độ vs an toàn, không tự chọn |
| **`tsk-6av`** (status vừa tụt về `todo`) | Trùng phạm vi với `tsk-c5u` (đã delivered, cùng việc "consolidate merge/approve catchup self-recovery") | Khả năng cao đã redundant — cần anh xác nhận đóng `tsk-6av` hay còn phần việc thật chưa cover |
| **Guard mark file** (`events-jsonl.truncation-guard.json`) | Không có lock/scope per-session → tự sinh false positive như sáng nay | Cần fix kỹ thuật (không phải quyết định sản phẩm) — flag để đưa vào backlog |

---

## Update sau khi rà soát trùng lặp (2026-08-21 11:06)

Trước khi tạo item mới cho mục "merge-overwrite chưa ai target", đã quét toàn bộ `fgos list --json --all` và phát hiện phần lớn phạm vi đã có item mở sẵn — tránh lặp lại đúng lỗi tsk-6av/tsk-c5u. Đã tạo **`tsk-1i3`** (deps: `tsk-1vc`, `tsk-56u`), scope hẹp đúng phần chưa ai cover: merge-content-precedence overwrite (`e921fdb4`/`165bc0cb`).

## Lộ trình giải quyết đầy đủ (thứ tự đề xuất)

Nền tảng đã xong (không cần làm gì thêm, chỉ để hiểu bối cảnh): `tsk-24e` (evidence gốc) → `tsk-1ji` (guard v1, detect-only) → `tsk-6al` (skip-verify return) → `tsk-oet` (fix npm test do tsk-6al) → `tsk-43z` (fix dispatch cwd bug).

### Nhóm A — An toàn dữ liệu (P0, làm trước vì P1 phụ thuộc kết quả ở đây)

| # | item | trạng thái | vì sao thứ tự này |
|---|---|---|---|
| 1 | `tsk-5k1` | todo | tsk-1ji's checks đang phá 7 test có sẵn (extra commit/write không lường trước) — dọn nhiễu này trước khi tin tưởng guard |
| 2 | `tsk-1vc` | todo, heavy | Điều tra false-positive/silent-loss + fix "warning ghi ra không ai đọc lại" — nền tảng độ tin cậy cho toàn bộ guard mechanism, và đúng chỗ để quyết checkpoint-interval trade-off (xem dưới) |
| 3 | `tsk-56u` | đang review, gần xong | Chặn `git add -A`/stash làm mất `.fgos/` tại COMMIT time — độc lập, gần hoàn thành, nên land sớm |
| 4 | `tsk-1i3` (mới) | todo, heavy, deps=[1vc,56u] | Chặn đúng cơ chế đã thật sự xoá data (merge content-precedence) — cần 2 item trên land trước để có nền tảng guard đáng tin |
| 5 | `tsk-2f6` | todo, light | Deadlock catchup/approve khi `.fgos/*` lệch fork-point — liên quan, có thể làm song song, không chặn đường trên |

### Nhóm B — Tốc độ merge/verify (P1, nên bắt đầu sau khi Nhóm A ổn vì chính periodic-checkpoint ở A đang là 1 nguồn churn của B)

| # | item | trạng thái | vì sao thứ tự này |
|---|---|---|---|
| 1 | `tsk-2lq` | todo | Fix lõi: `approve`'s skip-fast-path (`mergedTreeAlreadyVerified`) có hit-rate gần 0 trên trunk đông người merge — đây mới là chỗ đáng sửa nhất cho tốc độ, không phải guard |
| 2 | `tsk-1uf` | retrospective, gần xong | Doc hướng dẫn chạy verify background (tránh Bash tool timeout 120s) — nhỏ, độc lập, land bất cứ lúc nào |
| 3 | *(chưa có item)* checkpoint-interval tuning | — | **Không tạo item riêng** — nên là 1 quyết định trong lúc làm `tsk-1vc` (Nhóm A #2), vì cùng subsystem và cùng phải cân bằng đúng trade-off "khoảng cách safety-window vs churn tần suất catchup". Tạo item riêng lúc này sẽ chỉ thêm 1 chỗ nữa dễ lạc trôi khỏi ngữ cảnh |
| 4 | `tsk-9tu` | todo, heavy, discussion-only | Tension chính sách dispatch-ra-agy mặc định — không block, để bàn sau khi 2 nhóm trên ổn |

### Việc đã raise xong, không cần theo dõi thêm
- `tsk-6av` — trùng `tsk-c5u`, đang tự self-check theo xác nhận của anh, bỏ qua.
- `.fgos/config.json`'s `models: {light/standard/heavy}` diff — đã được checkpoint tự động commit vào `c6f486d6`, nội dung khớp đúng thiết kế STR41/tsk-5tm đã document ở `docs/specs/runner.md`. Không phải orphaned, không cần hành động.

## Câu hỏi chưa giải (unresolved)

1. Merge-overwrite mechanism (root cause nghiêm trọng nhất, 22:51 20/8) — **chưa có item nào trong 12 task audit trực tiếp target nó**. Cần xác nhận: có nên submit 1 task mới riêng cho đúng cơ chế này (khác tsk-1ji), hay đã có ai đang làm mà audit chưa thấy?
2. `self-recovery` auto-resolve merge-conflict policy (gốc từ tsk-60h, đang được tsk-6av/tsk-c5u refactor dở dang) có phải chính là thứ chọn sai phía khi `.fgos/` bị conflict delete-vs-modify trong merge `fgw/tsk-6al`? Chưa verify trực tiếp — chỉ là giả thuyết có evidence gián tiếp (thời điểm trùng).
3. Có bao nhiêu drive đơn lẻ (`/fgOS:pick` không qua fanout) đang âm thầm mất lợi ích skip-verify? Chưa đo được — cần log thực tế call path nào đang chạy để biết mức độ nghiêm trọng của gap #2.1.
