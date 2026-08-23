# tsk-66l — Kế hoạch: đổi `proposed` → `awaiting-approval`

## Mode

**high-risk.** Đếm cờ áp dụng (theo `CONTEXT.md` D1-D6):

| Cờ | Áp dụng? | Vì sao |
|---|---|---|
| data model | có | đổi giá trị enum lõi của state machine (`work.status`), 1 trong 7 giá trị hợp lệ theo schema |
| audit/security | có | migration ghi đè trực tiếp log audit đã commit (`events.jsonl`), dưới miễn trừ RUL11 — chạm nguyên tắc append-only |
| public contracts | có | `status`/`outcome.actual.outcome` là machine contract công khai (mọi consumer đọc `.status === 'proposed'` phải đổi cùng lúc) |
| existing covered behavior | có | 239 chỗ / 30+ file test đang assert giá trị cũ (`test/state/*`, `test/e2e/*`, `test/cli/*`) |
| multi-domain | có | FSM chung domain-agnostic — `test/e2e/synthetic-domain.test.mjs` chứng minh domain `synthetic` cũng đi qua đúng giá trị này |

5 cờ, gồm cờ hard-gate (audit/security) → **high-risk** theo đúng ngưỡng (4+ cờ, hoặc bất kỳ hard-gate flag nào).

## Approach

**Hướng chọn:** một item fgOS duy nhất (không tách con), thực thi qua 2 pha không đối xứng — Pha A git-tracked (đổi enum trong source `src/`, `bin/fgos.mjs` + toàn bộ test suite + docs + viết migration script, verify bằng `npm test`, merge bình thường) và Pha B runbook thủ công ngoài git (chạy migration script thật lên 3 kho `.fgos` trong phạm vi 0019, ngay trong cùng phiên thao tác sau khi Pha A merge, best-effort tuần tự — chi tiết rủi ro/lý do không cần cơ chế khoá ở dưới). Cộng một decision record MỚI supersede thuật ngữ của 0006 (không sửa 0006 tại chỗ — theo quy ước "Changing a locked law supersedes its decision ID" của `AGENTS.md`).

**Vì sao 1 item, không tách item con (dù có 2 pha):**
- 2 pha không phải 2 "việc" độc lập trong backlog — Pha B không tự đứng được (không có gì để claim/verify/return qua vòng đời fgOS item, chỉ là thao tác vận hành một lần ngay sau merge của chính Pha A).
- `fgos graph --what-if tsk-66l` cho thấy item này không nằm trên `criticalPath` (path: tsk-4fu→tsk-56t→tsk-1an→...), chỉ unblock transitively 1 item (`tsk-u8w`) — không có áp lực song song hoá để tách nhỏ lấy `topUnblock` cao hơn.

**Phương án bị loại (đã khoá ở CONTEXT.md, trích dẫn lại, không mở lại):**
- Thêm field hiển-thị-riêng (statusLabel/hint) — loại theo D6, vá triệu chứng.
- Giữ `proposed` vĩnh viễn + shim dịch 2 chiều trong `replay.mjs` — loại theo D4, vì miễn trừ 0019 làm rewrite rẻ hơn một shim sống mãi.
- Đổi tên gắn nghĩa "merge" (`awaiting-merge`) — loại theo D1, sai bản chất domain-agnostic.

**Ranh giới 2 pha — sửa sau verdict NOT READY của `fgos-coding-validating` (trích `src/runner/merge.mjs:452,458`):**

`merge.mjs` abort cứng bất kỳ diff nào của nhánh `fgw/<id>` chạm path dưới `.fgos/`
(bằng chứng: `merge.mjs:452` lọc `stagedPaths` theo prefix `.fgos`, dòng 458 abort
merge nếu thấy). Vậy migration 3 kho thật KHÔNG THỂ là một commit trên nhánh của
chính item này. Tách rõ 2 pha, KHÔNG phải 2 item fgOS riêng (migration không phải
"việc" trong backlog, là thao tác vận hành một lần):

- **Pha A — git-tracked, thuộc Execute + verify của tsk-66l:** đổi enum trong
  source/test/docs + viết (nhưng KHÔNG chạy) migration script, commit lên
  `fgw/tsk-66l`, merge bình thường (diff không chạm `.fgos/`, qua được guard).
- **Pha B — runbook thủ công, ngoài git, chạy NGAY SAU khi Pha A merge:** thực thi
  migration script lên 3 kho thật. KHÔNG phải việc của Execute/verify — không có
  gì để commit.

**Rủi ro thật giữa merge (Pha A) và migrate (Pha B) — đo lại chính xác, hẹp hơn
đánh giá ban đầu:**
`validateWorkShape`/`validateWork` (`src/state/work.mjs:122,387`) CHỈ chạy ở write
path (`store.mjs:155` trong `addWork`, `:227` trong `editWork`) — KHÔNG chạy khi
replay/đọc. Vậy `fgos list`/`ready`/`check` đọc event cũ mang `"proposed"` KHÔNG
crash, chỉ fold nguyên chuỗi cũ vào view — an toàn tuyệt đối bất kể thời điểm.

Rủi ro thật hẹp hơn nhiều: `fsm.mjs:162-176`'s `transitionWork` so `work.status`
(fold từ log) với bảng `TRANSITIONS` bằng string literal (`from: 'proposed'`,
dòng 84,96-98). Sau rename, bảng đổi key sang `'awaiting-approval'` — CHỈ item nào
CHƯA migrate (còn `status: 'proposed'` thật trong log) mới bị `FsmError`
(`'no transition from "proposed" to ...'`) khi ai đó gọi `approve`/`reject`/
`return` trên ĐÚNG item đó — lỗi rõ ràng, tự hết khi migrate xong, không phải
crash toàn hệ thống. Đếm thật tại thời điểm viết plan: đúng 3 item đang
`status: proposed` (`tsk-5oa`, `tsk-63c`, `tsk-2z3`) — đây là TOÀN BỘ blast
radius, không phải "mọi worktree khác".

Vì rủi ro tự-chữa-lành và khoanh vùng rõ (chỉ 3 id cụ thể, chỉ hành động
approve/reject/return, không phải đọc), KHÔNG cần nối Pha B vào cửa sổ
`main-checkout-lock` của Pha A (over-engineer cho rủi ro nhỏ này — vi phạm YAGNI).
Chỉ cần: chạy Pha B trong cùng phiên thao tác ngay sau khi Pha A merge (best-effort
tuần tự, không cần cơ chế khoá cơ học); nếu ai đó lỡ gọi `approve` một trong 3 id
trên đúng lúc giữa 2 pha, họ nhận lỗi `FsmError` rõ ràng và thử lại sau khi Pha B
xong — không mất dữ liệu, không hỏng trạng thái nào khác.

**Thứ tự thực hiện (Pha A, 1 commit trên `fgw/tsk-66l`):**
1. Migration script (đọc/ghi 3 kho `.fgos` theo field path cụ thể — KHÔNG blind
   string-replace) — viết, dry-run trên bản sao; KHÔNG chạy lên kho thật ở pha này.
2. Đổi enum trong source (`src/state/*`, `bin/fgos.mjs`).
3. Cập nhật test suite (239 chỗ, 30+ file) theo enum mới.
4. Cập nhật docs: decision record mới supersede 0006 (thuật ngữ, không phải FSM
   edges), `docs/specs/work-state.md` Data Dictionary #4/O4.
5. `npm test` xanh toàn bộ, commit, merge bình thường (diff không chạm `.fgos/`).

**Thứ tự thực hiện (Pha B, runbook thủ công, ngay sau merge — KHÔNG phải
verify/Execute của item):**
1. Chạy migration script thật lên 3 kho phạm vi (kho sống, `dogfood-fixture`,
   `fgos-test-drive` tại `/home/vantt/projects/fgos-test-drive/.fgos`) — xác nhận
   `test/fixtures/phase1-events.jsonl` KHÔNG đổi 1 byte (đã đo: fixture này có 0
   chỗ chứa `"proposed"`, loại trừ vô hại).
2. `fgos rebuild` trên kho sống + xác nhận `fgos list` chạy được bình thường, và
   3 item đang `proposed` (`tsk-5oa`, `tsk-63c`, `tsk-2z3`) đã fold đúng thành
   `awaiting-approval`.

**Chặn thật đã phát hiện khi dry-run script (Execute, `scripts/migrate-status-
proposed-to-awaiting-approval.mjs`), CHƯA giải quyết — để lại cho người chạy
Pha B:** dry-run trên bản sao `dogfood-fixture/.fgos` (9 dòng đổi) và
`fgos-test-drive/.fgos` (2 dòng đổi) sạch, không lỗi. Dry-run trên bản sao KHO
SỐNG throw `seq gap at line 273 -- expected 273, got 272` — đọc trực tiếp: dòng
272 VÀ 273 cùng mang `seq: 272` (2 event `work.move` khác nhau của `tsk-53f`,
cùng `todo->doing`). Đây KHÔNG PHẢI lỗi do script hay do rename gây ra — là lớp
corruption ĐÃ ĐƯỢC BIẾT TRƯỚC, ghi rõ tại `src/state/events.mjs:25`
("spike-confirmed duplicate-seq corruption" — 2 process đọc cùng seq N, cùng
ghi N+1, trước khi `events.lock` hiện tại được thêm để khoá cửa sổ đó). Migration
script kế thừa đúng kỷ luật `migrate-actor-to-role.mjs` (seq phải liên tục),
nên từ chối đúng — không nới lỏng check này chỉ để chạy qua.

Đây là chặn thật cho Pha B trên KHO SỐNG cụ thể, KHÔNG chặn Pha A (rename source/
test/docs của chính item này đã xong, `npm test` xanh). Quyết định sửa
corruption lịch sử này (tay hay bằng công cụ riêng) là quyết định phạm vi khác,
ngoài item tsk-66l — nêu rõ cho người chạy Pha B, không tự ý sửa ở đây.

## Risk map

| Thành phần | Rủi ro | Điểm chứng minh (cho fgos-coding-validating) |
|---|---|---|
| Migration script đúng field-path, không blind replace | CAO | Dry-run diff trên bản sao kho thật trước khi ghi kho thật; xác nhận CHỈ field `status`/`work.move.to`/`work.move.from`/`outcome.actual.outcome` đổi — text tự do (title/description) chứa chữ "proposed" không bị đụng |
| Migration đủ cả 3 kho, đúng phạm vi 0019 | CAO | Checklist tường minh: kho sống dùng chung, `dogfood-fixture/.fgos` (đã xác nhận tồn tại), `fgos-test-drive` tại `/home/vantt/projects/fgos-test-drive/.fgos` (đã xác nhận tồn tại, có `events.jsonl`); `test/fixtures/phase1-events.jsonl` byte-diff = rỗng (đã đo: 0 chỗ chứa `"proposed"`) |
| Khe hở merge→migrate (Pha A xong, Pha B chưa chạy) | THẤP (đã hạ từ CAO sau khi đo lại) | `store.mjs:155,227` xác nhận `validateWork` chỉ chạy write path, đọc/replay an toàn tuyệt đối; `fsm.mjs:162-176,84,96-98` xác nhận rủi ro thật CHỈ là `FsmError` precondition khi approve/reject/return đúng 1 trong 3 item hiện đang `proposed` (`tsk-5oa`, `tsk-63c`, `tsk-2z3`, đếm thật lúc viết plan) trong lúc chưa migrate — tự hết khi Pha B chạy xong, không mất dữ liệu |
| Source + test rename đủ 239 chỗ / 30+ file | TRUNG BÌNH | `rg -n "'proposed'" src bin test` đếm trước/sau — kỳ vọng 0 chỗ còn lại ngoài text mô tả lịch sử (comment/docs nhắc tên cũ có chủ đích); `npm test` toàn bộ xanh |
| Hash/revision ổn định sau rewrite | TRUNG BÌNH | `fgos rebuild` xong, so `data_hash`/view trước-sau trên cùng 1 trạng thái logic — theo đúng tinh thần `test/e2e/rebuild-determinism.test.mjs` đã có |
| Decision record mới supersede đúng 0006 | THẤP | Đọc lại `docs/decisions/0006-*.md` sau khi thêm record mới — xác nhận 0006 không bị sửa tại chỗ, chỉ được trích dẫn ngược (đúng khuôn 0019 đã làm với RUL11) |

## Verify

Theo đúng verdict `fgos discover` đã phán (`clear`, không tự ý đổi ở đây):

```
npm test && npm run cli -- list | head -10
```

## Split

**Không tách.** Một mảnh việc trung thực duy nhất — Pha B (runbook migrate 3 kho) không phải một item fgOS độc lập được, vì không tự có vòng đời claim/verify/return riêng; nó là phần đuôi vận hành bắt buộc của chính Pha A, chạy ngay sau (best-effort, rủi ro khe hở đã đo là THẤP/tự-chữa-lành). Lý do đầy đủ ở mục Approach trên.

## Câu hỏi còn mở (kế thừa từ CONTEXT.md, chưa cần chặn kế hoạch)

- ~~Đường dẫn thật của kho `fgos-test-drive`~~ — đã xác nhận: `/home/vantt/projects/fgos-test-drive/.fgos` (giải quyết tại `fgos-coding-validating`).
- Có cần 1 test migration riêng (giống `test/state/backward-compat.test.mjs`) khoá hành vi replay sau rewrite hay không — quyết định cụ thể để `fgos-coding-implement` cân nhắc.
- ~~Cách nối Pha B vào main-checkout-lock của Pha A~~ — không cần nữa: đo lại (`fgos-coding-validating`, vòng 2) xác nhận rủi ro khe hở THẤP và tự-chữa-lành, không cần cơ chế khoá.
