# Báo cáo review cụm merge 2026-08-16 — tsk-2t9c + vệ tinh (tsk-60r4)

Scope: tsk-2t9c (Multi-role Team Harness, D1-D18), tsk-2t9c-1/2/3 (wontfix),
tsk-3vk (CHANGELOG), tsk-ogx (doctor check), tsk-3ki (wontfix). Merge
commits xác minh trên main: `e268376e` (fgw/tsk-2t9c), `5236eb10`
(fgw/tsk-3vk), `2a15a63d` (fgw/tsk-ogx), `3b44968e`/`240bb401` (tsk-60f,
nơi resolve tay lần 2).

## Verdict từng nghi vấn

### 1. Thiếu `docs/history/tsk-2t9c/iron-law-evidence.md` — KHÔNG viết bổ sung (chấp nhận, có lý do)

- Contract evidence file có từ tsk-5t3 (2026-07-30,
  `docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md`) — TRƯỚC
  ngày merge, không phải "ra đời sau trên tsk-in1" như nghi vấn nêu. Cái
  tsk-in1/tsk-1y6-1 thêm là `ironLaw.level` + ranh giới trunk (decision
  0032-iron-law), không phải bản thân contract.
- Nội dung bắt buộc của file là "failing-test-first proof" với transcript
  THẬT (fail-trước/pass-sau). Viết hồi tố bây giờ tất yếu phải tái dựng
  transcript — đúng red flag "fabricating or paraphrasing the
  failing-test-first transcript" của `fgos-coding-implement`. File giả
  chứng cứ tệ hơn không có file.
- Không có consumer cơ học nào đọc file này sau merge: gate chỉ fire tại
  `approve`/`merge`/`sync-root` (3 call site, `src/runner/iron-law-gate.mjs`),
  item đã `delivered`. Không doctor check nào scan hồi tố.
- **Observation ngoài scope (không fix):** `approve --acknowledge-iron-law`
  khi pass KHÔNG ghi event nào đánh dấu "gate đã trip và được acknowledge"
  (chỉ mức `warn` ghi `recordIronLawSkip`, `approve.mjs:295-303`). Ai muốn
  audit hồi tố sẽ không phân biệt được "không trip" với "trip + acknowledge".
  Đáng một item riêng nếu anh muốn.

### 2. Thiếu verb đóng "duplicate-of-parent" — KHÔNG phải gap (wontfix đủ)

- Cả 3 item con đóng qua `wontfix` đều kèm decision record đầy đủ
  ("Duplicate-of-parent: toàn bộ scope đã gộp và commit trực tiếp trên
  fgw/tsk-2t9c (D1-D18), item cha đã return xanh..."). Audit trail có thật,
  đọc được qua `fgos show`.
- Một status/verb riêng đòi sửa FSM (`src/state/status-fsm.mjs`), replay
  compat, statusCategory, frontier terminal-set — cho một kết cục mà
  `wontfix` + reason text đã phủ nghĩa. YAGNI đúng nghĩa; tần suất mới có
  3 case đầu tiên. Nếu pattern lặp nhiều, bước rẻ tiếp theo là flag
  `--reason` có cấu trúc trên move, chưa phải verb mới.

### 3. 5 file conflict resolve tay — 1 bug thật (đã fix), 4 file sạch

| File | Kết quả |
|---|---|
| `CHANGELOG.md` | **BUG THẬT — đã fix.** Bullet "Multi-role team harness, first slice" bị LẶP 2 lần trong `[Unreleased]` dưới 2 heading `### Added` khác nhau: tsk-2t9c mang bản riêng (merge `e268376e`, section Added thứ 2), tsk-3vk mang bản riêng (merge `5236eb10`, section Added đầu). Fix: gộp thành MỘT bullet ở section đầu (giữ phần edge-list đầy đủ của bản tsk-3vk + câu "replays byte-for-byte unaffected" của bản tsk-2t9c), xoá bản lặp. Lưu ý: cấu trúc `[Unreleased]` phân mảnh nhiều section Added/Changed/Fixed là PRE-EXISTING (đã thế từ `a3ae3bfd`, trước cụm này) — ngoài scope, không sửa. |
| `src/setup/registrations.mjs` | Sạch. 31 check id, 7 fix id, 9 config-default id — programmatic scan 0 duplicate. Cặp `events-jsonl-contiguous` xuất hiện 2 lần là check+fix pairing hợp lệ. `domain-workflow-skillmap-coverage` (tsk-ogx) đăng ký đúng 1 lần. |
| `test/setup/checks.test.mjs` | Sạch. 100/100 test pass, không test name trùng. |
| `bin/fgos.mjs` | Sạch. Import merge đủ (`recordCall`/`recordCallReturn`/`EventLogError`...), `case 'handoff'`/`'handoff-return'` mỗi cái đúng 1 lần, không case label trùng trong toàn switch. |
| `docs/specs/distribution.md` | Sạch. Bảng #7 (31 check) và #7b (7 fix) diff programmatic với registry sống: 0 thiếu, 0 thừa, format khớp quy ước hàng hiện có. |
| `docs/architecture-manifest.json` (file thứ 6 trong merge resolve) | Sạch — row `handoff` có mặt, `test/architecture.test.mjs` nằm trong npm test xanh. |

### 4. Title tsk-3ki cắt cụt — KHÔNG phải lỗi tạo item (by design, cosmetic)

`deriveTitle` (`src/intake/classify.mjs:27`) lấy câu đầu của description
rồi `truncateTitle` cap ~96 ký tự — cắt cơ học, không theo word boundary.
Description gốc 333 ký tự còn NGUYÊN VẸN trên item (đã đọc lại, câu đầy
đủ "...reports zero gaps for every currently-registered domain..."). Mọi
item title dài đều bị cắt kiểu này (kể cả tsk-60r4 này). Không mất dữ
liệu; nếu muốn cắt đẹp hơn (word boundary + "…") thì là polish riêng của
intake, ngoài scope cụm này.

### 5. Tương tác handoff/roleGraph × tsk-in1 kind/via — KHÔNG có rủi ro tương tác thật

- Tiền đề của nghi vấn sai một nửa: tsk-2t9c **không đụng**
  `src/runner/dispatch.mjs` (git log rỗng trên range của nhánh). Vùng đụng
  chung thật sự chỉ là `bin/fgos.mjs` + `src/setup/registrations.mjs`
  (đã xác minh sạch ở mục 3). Về ngữ nghĩa: dispatch.mjs không đọc
  roleGraph/holder (0 ref thật — chỉ false positive "placeholder");
  handoff (`src/state/handoff.mjs`, store.mjs) không đọc kind/via.
- Targeted tests trên main sau merge: `test/runner/dispatch.test.mjs` +
  `test/runner/handoff.test.mjs` = 231/231 pass.
- **Dogfood thật sau merge đã có, không cần lượt riêng:** (a) engine-fired
  review handoff (tsk-2t9c D18, `moveWork`) bắn đúng trên tsk-60f lúc
  09:34 hôm nay — SAU khi toàn bộ cụm đã merge (callThreads:
  `auto-fired on reaching awaiting-approval` → `auto-closed at delivered`);
  (b) chính item review này chạy `fgos handoff --reason consult`
  (call-summary), gate-check/gate-approve, và toàn bộ pick/plan/return
  lifecycle trên main code sau merge — chuỗi verb đi qua cả code tsk-2t9c
  lẫn config-đọc kind/via của tsk-in1 trong cùng process.

### 6. (Phát hiện thêm trong scope) Collision số decision 0032 — BUG THẬT, đã fix

Hai nhánh song song cùng lấy số 0032: `0032-cong-iron-law...` (cụm
tsk-in1, merge trước) và `0032-multi-role-team-harness...` (tsk-2t9c,
merge sau). Mọi tham chiếu trần "`0032`" trong `docs/specs/runner.md`
(RUL34/37/64...) và `src/verbs/merge/*.mjs` đều trỏ về iron-law, nên
iron-law GIỮ số. Fix (user chốt tại gate validateApprove):

- `git mv` → `0033-multi-role-team-harness-role-holder-axis-va-handoff.md`,
  sửa title/frontmatter, thêm khối chú thích đánh-số-lại ngay đầu file.
- Thêm row 0033 vào `docs/decisions/0000-index.md` — row này TRƯỚC ĐÓ
  THIẾU HẲN (tsk-2t9c chưa từng index decision record của mình; index
  dừng ở 0032-iron-law).
- Không có ref mồ côi: file multi-role chưa được doc nào ngoài chính nó
  cite theo số trước khi rename (rg toàn repo xác nhận).

## Fixes đã áp (tổng)

1. CHANGELOG dedupe bullet multi-role (giữ 1 bản gộp đủ nội dung 2 bản).
2. Rename decision 0032-multi-role → 0033 + chú thích đánh-số-lại.
3. Bổ sung row 0033 vào `docs/decisions/0000-index.md`.

Verify: `npm test` (kết quả ghi ở decision log của tsk-60r4 + commit).

## Không fix (kèm lý do — tóm tắt)

- Iron-law evidence hồi tố cho tsk-2t9c: sẽ là bằng chứng tái dựng, vi
  phạm chính contract; không consumer cơ học sau merge.
- Verb duplicate-of-parent: YAGNI, wontfix + decision text đủ audit.
- deriveTitle cắt giữa ngoặc: by design, description nguyên vẹn.
- Cấu trúc CHANGELOG phân mảnh section: pre-existing, ngoài scope cụm.

## Unresolved questions

- Có muốn mở item riêng cho: (a) ghi event khi `--acknowledge-iron-law`
  thực sự được dùng trên một gate trip; (b) polish `deriveTitle` cắt theo
  word boundary? Cả hai ngoài scope item này, chưa tạo.
