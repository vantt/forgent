# Prompt — final regression audit of `fgw/tsk-49i`

Dán nguyên khối dưới đây cho một agent review mới (model opus). Nó tự
đủ ngữ cảnh: người chạy không cần biết gì về các phiên trước.

---

## PROMPT BẮT ĐẦU TỪ ĐÂY

Bạn đang audit lần cuối một nhánh refactor đã hoàn thành trong repo fgOS.
**CHỈ ĐỌC, CHỈ BÁO CÁO.** Không sửa file nào, không chạy bất kỳ lệnh
`fgos` nào, không đụng `.fgos/`, không commit/merge/push/**stash**, không
tạo/xoá worktree của repo thật. Được phép: `git show`, `git diff`,
`git log`, `git archive`, `grep`, `sed`, `node --check`, `node --test`, và
chạy `bin/fgos.mjs` **chỉ trong repo tạm do chính bạn dựng dưới `/tmp`**.

### Môi trường

- Repo (main checkout): `/home/vantt/projects/forgentX` — chạy git từ đây.
- Nhánh cần audit: `fgw/tsk-49i`, tip `7c8108df`. Baseline: `main`.
- Phạm vi: `git diff main...fgw/tsk-49i` — 46 file, ~2515+/1873−.
- Node có sẵn; repo **không có lint/typecheck/build**, chỉ `npm test`
  (`node --test 'test/**/*.test.mjs'`, ~3350 test, ~50s).

### Nhánh này làm gì

Năm commit mã (bỏ qua mọi commit `docs(tsk-49i)`, chúng là tài liệu thiết
kế viết trước khi thi công):

| SHA | Nội dung |
|---|---|
| `34c34e87` | Cắt cả 5 cạnh import `src/state/` → `src/runner/`; gộp 3 bản copy-paste Iron Law vào `src/runner/iron-law-gate.mjs`; dời `detectTrunk`/`isMainWorktree` sang `runner/worktree.mjs`; dời `session-identity.mjs` sang `src/util/` (KHÔNG shim); dời `normalizePath` sang `src/util/normalize-path.mjs`; `driftStatus`/`unmergedDeliveries` nhận `{trunk}` bắt buộc; bump plugin 1.1.0 → 1.2.0 |
| `9a600342` | Tách tầng use-case 7 verb merge vào `src/verbs/merge/*.mjs` (`merge`, `approve`, `review`, `sync-root`, `catchup`, `reject`, `promote-to-component`); tạo `src/report/item-trace.mjs`; dời `performCatchUp` → `runner/merge.mjs`; dời `ensureBranchPushed`/`currentHead`/`resolveRefSha`/`realpathOrSelf` → `runner/worktree.mjs` |
| `c25d212c` | fix: `resolveTimeoutMs` thành thunk (lazy) |
| `19f283cf` | fix: `resolveWaitFlags` thành thunk (lazy) + xoá import chết `changedFiles` |
| `804005cd` | fix: `review --pr` validate trong use case thay vì adapter |

Ý đồ thiết kế nằm ở (đọc để hiểu chủ đích, **không** phải deliverable):
`docs/history/state-runner-merge-boundary/CONTEXT.md` (quyết định khoá
D1–D5), `plan.md` (risk map + assumption A-1/A-2), `RESEARCH.md`.

### Ràng buộc cứng của nhánh

**KHÔNG được đổi hành vi.** Contract CLI là `fgos.v1`. Điểm mấu chốt:
test suite assert **từng field riêng lẻ**, không bao giờ `deepEqual` cả
payload (`plan.md` assumption A-2) — nên một field không ai assert có thể
đổi mà suite vẫn xanh. Ba bug đã tìm ra ở phiên trước đều thuộc đúng lớp
"suite xanh nhưng hành vi đã đổi". **Giả định còn sót nữa.**

### Ba bug ĐÃ tìm ra và ĐÃ fix — việc của bạn là xác minh chúng đứng vững, không phải tìm lại

Nguyên nhân chung: chuyển parse flag lên adapter làm **side effect và
refusal nhảy lên trước guard**.

1. `parseMergeClusterOptions` gọi `resolveVerifyTimeoutMs` sớm →
   `ensureRunnerConfigForDir` **GHI** `.fgos/config.json` + warn stderr
   trên đường từ chối của `sync-root` và trên lượt `merge next` rỗng.
   Fix `c25d212c`.
2. `parseWaitFlags` sớm → `merge next --wait 0` lúc rỗng trả **exit 4**
   thay vì `{picked:null}` exit 0 (vỡ stop-rule của merge-loop). Fix
   `19f283cf`.
3. `review --pr` validate ở adapter → lỗi flag vượt mặt guard
   item-not-found. Fix `804005cd`.

Hãy **xác minh lại bằng thực nghiệm** rằng cả 3 giờ khớp `main`, và quan
trọng hơn: **quét xem còn chỗ nào cùng lớp đó chưa bị phát hiện**.

### KHÔNG báo lại mấy thứ này (đã kiểm, đã kết luận)

- `visitCount` trong `bin/fgos.mjs` là import chết **từ trước** nhánh này.
- Verify đã đăng ký của item `tsk-49i-1` có clause
  `grep -qF ironLawForItem bin/fgos.mjs`, nay 0 match vì commit sau dời
  hết call site Iron Law ra khỏi `bin`. Stale **có chủ đích**, không sửa.
- `test/scripts/project-agents.test.mjs` fail với
  `ERR_MODULE_NOT_FOUND: 'yaml'` trong worktree detached / cây trích bằng
  `git archive` — thiếu `node_modules`, không phải regression. Nó fail y
  hệt trên `main`.
- `approve <id> --wait <sai>`: `main` ghi runner config trước rồi mới báo
  lỗi, nhánh báo lỗi luôn. Đã biết, nhánh **ít** side effect hơn, chấp nhận.

### Cách làm đã chứng minh là hiệu quả — hãy dùng lại

Đọc code không tìm ra được 3 bug trên; hai thứ này mới tìm ra:

1. **Diff mức câu lệnh.** Với mỗi verb: cắt thân `case '<verb>'` từ
   `git show main:bin/fgos.mjs` theo độ sâu ngoặc, cắt thân use-case mới,
   bỏ indent + dòng comment + dòng trống, rồi so hai tập dòng. Mọi dòng
   lệch phải giải thích được. Dòng nghiệp vụ biến mất hoặc xuất hiện mà
   không giải thích được = nghi vấn.
2. **A/B hai binary trên cùng input.** Dựng 2 repo git tạm giống hệt nhau
   dưới `/tmp`, `fgos init` mỗi cái, rồi chạy **binary của `main`** và
   **binary của nhánh** trên cùng câu lệnh, so **stdout, stderr, exit
   code, và file sinh ra trên đĩa**. Đây là thứ duy nhất bắt được việc ghi
   config lén. Ví dụ dựng:
   ```
   mkdir -p /tmp/audit/{old,new}
   for d in old new; do (cd /tmp/audit/$d && git init -q -b main \
     && git config user.email t@e.com && git config user.name T \
     && echo s > s.txt && git add s.txt && git commit -q -m s); done
   node /home/vantt/projects/forgentX/bin/fgos.mjs init --dir /tmp/audit/old/.fgos
   # binary nhánh: git archive fgw/tsk-49i | tar -x -C /tmp/audit/branch-src
   ```
   Nhớ: so cả **có file nào mới sinh ra dưới `.fgos/` không**, không chỉ
   so text.

### Checklist, xếp theo mức quan trọng

1. **Side effect / refusal nhảy qua guard — lớp đã sinh ra cả 3 bug.**
   Quét MỌI thứ adapter nay làm sớm hơn case block cũ, hoặc use-case nay
   làm muộn hơn: ghi file, spawn git, lấy lock, append event log, in
   stderr, throw. Đặc biệt soi `parseMergeClusterOptions`
   (`bin/fgos.mjs`) và thứ tự trong 7 adapter case. Đây là ưu tiên số 1.
2. **Tương đương payload** từng nhánh `return`, cả 7 verb, so với
   `git show main:bin/fgos.mjs`. Tên field, field có/không, giá trị tính
   ra, nhánh tồn tại ở bên này mà không có bên kia.
3. **Thứ tự guard** từng verb: cùng guard, cùng thứ tự, cùng error class
   và message.
4. **Lồng lock/merge** trong `approve` và `sync-root`:
   `withMergeTargetSlot`, `withMergeEphemeralWorktree`, `withLockRetry`
   (closure `runMerge`), `performCatchUp`, `mergeRunnerItem` — cùng thứ
   tự, cùng tham số (`lockRoot`, `targetSlot`).
5. **6 nhánh outcome dispatch của `approve`** còn đủ, đúng thứ tự, trên
   **cả hai** đường leaf→root và root→main.
6. **Forward option của `merge next`** → `approve`/`sync-root`. Trước đây
   forward nguyên bag `flags` qua `runVerb` đệ quy; nay
   `parseMergeClusterOptions` dựng một lần rồi truyền nguyên khối. Liệt kê
   MỌI flag/env hai case cũ từng đọc, xác nhận từng cái tới nơi với đúng
   giá trị và đúng kiểu. Lưu ý `resolveTimeoutMs`/`resolveWaitFlags` cố ý
   là thunk.
7. **stderr của `detectTrunk`/`isMainWorktree`.** Chúng rời `merge.mjs`
   (helper `git` riêng có `stdio: ['ignore','pipe','pipe']`) sang
   `worktree.mjs` (helper `git` KHÔNG có). Tác giả thêm `gitQuiet`. Kiểm
   mọi call site đã dời có dùng đúng nó, và `ensureBranchPushed`/
   `currentHead`/`resolveRefSha`/`performCatchUp` có mất/thêm suppression
   so với chỗ ở cũ không.
8. **`driftStatus`/`unmergedDeliveries` nay đòi `{trunk}`.** Cả 5 call
   site có truyền đúng giá trị trunk mà hàm tự tính trước đây không?
   `requireTrunk` throw `TypeError` — class đó có đúng với cách
   `bin/fgos.mjs` map exception ra exit code không?
9. **Manifest tầng** (`docs/architecture-manifest.json`): mọi file mới
   đăng ký đúng tầng. Rank: entry 0 → use-case 1 → infra 2 → domain 3 →
   kernel 4; vi phạm là `rank(file) > rank(target)`.
   **`test/architecture.test.mjs` dò import bằng REGEX chỉ thấy
   `import … from '<relative>'` bắt đầu ở cột 0** — re-export, import thụt
   lề, `await import()` đều vô hình với nó. **Đừng coi test xanh là bằng
   chứng**; đọc import thật.
10. **`grep -rn "runner/" src/state/`** phải không còn cạnh import nào —
    cả 5, không phải 4. Kiểm cả bắc cầu (closure import).
11. **Use case không được đọc `process.env` / `process.cwd()` / argv.**
    Hai seam `FGOS_GH_COMMAND` và `FGOS_TEST_FORCE_APPROVE_LOCK_TIMEOUT`
    phải đọc ở adapter.
12. **Đường dẫn cũ còn sót**: `.githooks/pre-commit`,
    `plugins/fgOS/skills/terminal/rename.sh`,
    `plugins/fgOS/skills/_shared/capacity-dispatch-fallback.md` (phải
    byte-identical với bản `.agents/skills/_shared/`), key path file test
    trong `scripts/check-decision-codes.baseline.json`, `docs/specs/*`.
13. **Code chết**: import thừa trong `bin/fgos.mjs`, hàm dời đi mà bản cũ
    còn nằm lại, comment/JSDoc mô tả sai vị trí mới.
14. **Test coverage của chính các fix**: `test/cli/fgos-merge-next-no-config-write.test.mjs`,
    `fgos-merge-next-idle-turn.test.mjs`, `fgos-review-pr-precedence.test.mjs`
    có thật sự pin được invariant không, hay pass vì lý do khác (vacuous)?
    Thử nghĩ xem đổi code kiểu gì thì bug quay lại mà test vẫn xanh.

### Định dạng báo cáo

Chỉ liệt kê phát hiện, mỗi cái có `file:line` (trên nhánh), gắn nhãn:

- **BUG** — khác biệt hành vi thật, tham chiếu hỏng, hoặc lỗi đúng/sai.
- **OPINION** — style/cấu trúc, không hệ quả hành vi.

BUG trước, nặng nhất lên đầu. Mỗi BUG nói rõ **tình huống cụ thể kích
hoạt nó** và **người dùng hoặc phiên khác sẽ thấy gì**. Chỗ nào không
chắc thì **nói thẳng là không chắc**, đừng khẳng định. Check nào sạch thì
ghi một dòng "sạch" — đừng viết dài.

Trả kết quả bằng chính message cuối cùng của bạn. **Không tạo file nào.**

## PROMPT KẾT THÚC Ở ĐÂY
