# plan.md — tsk-580: `--verify-from-children`/`--verify-from-targets` trên `fgos edit`

## Mode gate

Đếm flag áp dụng: auth (không) · authorization (không) · data model (không
— tái dùng field `verify` sẵn có, không schema mới) · audit/security
(không) · external systems (không) · **public contracts (có — thêm 2 flag
CLI mới, dù additive)** · cross-platform (không) · existing covered
behavior (không — nhánh mới độc lập, không đổi hành vi flag hiện có) ·
weak proof around area (không — `edit` case đã có test suite dày đặc làm
mẫu) · multi-domain (không).

**Đếm: 1 flag → mode = small.** Vài file (`bin/fgos.mjs`,
`test/cli/fgos.test.mjs`, 2 how-to doc cập nhật tham chiếu), không gray
area — thiết kế đã chốt đầy đủ qua `fgos-coding-shaping` + `fgos-coding-exploring`
(D1-D3, CONTEXT.md). `fgos graph --json` xác nhận tsk-580 đứng độc lập
(`deps: []`, không component nào phụ thuộc) — không cần xét thứ tự với
việc khác.

## Approach

Path đã chọn: thêm 2 block flag riêng vào `case 'edit'`
(`bin/fgos.mjs:1191-1343`) theo đúng pattern hiện có của
`--docs-ref`/`--goal-tier`/`--merge-after` (mỗi flag kebab→camelCase một
block riêng, viết thẳng vào `patch` trước khi gọi `editWork`). Không có
alternative nào khác được cân nhắc nghiêm túc — đây đúng nghĩa "thêm 1
flag vào 1 verb đã có sẵn pattern", không phải quyết định kiến trúc.

### Risk map

| Thành phần | Rủi ro | Cách chứng minh (proof point cho `fgos-coding-validating`) |
|---|---|---|
| Enumerate children (`w.parent === id`) | Thấp — tái dùng chính xác pattern `collectRollupData` (bin/fgos.mjs:671-686) | Test: parent có 2+ children ở trạng thái khác nhau → command sinh ra chứa đúng tập id con |
| Enumerate targets (`item.targets`) | Thấp — đọc thẳng field có sẵn | Test: item có `targets` → command chứa đúng tập id target |
| Root resolution cho `--dir` | **Trung bình** — CONTEXT.md đã sửa 1 lỗi thật (resolveRepoRoot dùng `--show-toplevel`, SAI khi chạy trong worktree vì trả về root worktree, không phải main checkout nơi `.fgos/` thật sự nằm) | Test PHẢI chạy trong ngữ cảnh mô phỏng worktree (hoặc ít nhất assert dùng đúng `git rev-parse --path-format=absolute --git-common-dir` + `dirname`, không phải `--show-toplevel`) — đây là proof point quan trọng nhất, `fgos-coding-validating` cần xác nhận cách test dựng lên có thật sự phơi bày được lỗi này không |
| Guard danh sách rỗng | Thấp — logic đơn giản (`if length === 0 throw`) | Test: parent không có con / item không có target → `edit` exit non-zero, message rõ ràng, verify KHÔNG được ghi |
| Check mặc định resolved-set (D3) | Thấp — tái dùng `isResolvedStatus`/`TAIL_RESOLVED_STATUSES` đã import sẵn (frontier.mjs, đã import vào bin/fgos.mjs dòng import `isResolvedStatus`) | Test: con ở `delivered` (chưa `cleanup`/`done`) → command vẫn coi là thoả điều kiện |

Impact-analysis posture (CLAUDE.md gate, chạy lại đúng lúc lập kế hoạch):
`fgos tool query --capability impact-analysis --status present` → GitNexus
`present`, nhưng hook riêng session này báo index cũ ("last indexed:
251d0b5") → **degraded** theo đúng 3 nhánh của CLAUDE.md (present nhưng
stale). Không dựa vào GitNexus cho proof point nào ở trên — toàn bộ dựa
trực tiếp vào đọc code thật (`bin/fgos.mjs`, `src/runner/paths.mjs`,
`src/cli/invocation-fault-log.mjs`) + test tự viết, rủi ro lan toả vốn đã
thấp (1 file, 1 verb, nhánh mới độc lập không đụng flag cũ).

## Shape

Không cần split — 1 mảnh việc thật, đã có sẵn ở
`docs/history/rollup-parent-auto-close/DISCUSSION.md#task-verify-from-flags`.
Case cụ thể cần test (phù hợp mode `small`, không cần ma trận đầy đủ như
`high-risk`):

1. `--verify-from-children` trên item có ≥2 children (trạng thái khác nhau,
   ít nhất 1 con ở `delivered` — không `cleanup`/`done`) → verify sinh ra
   chứa đủ id con + resolved-set 4 giá trị + `--dir` = root MAIN CHECKOUT
   (không phải cwd hiện tại nếu test giả lập chạy trong 1 thư mục con/
   worktree).
2. `--verify-from-targets` trên item `goalTier` có `targets` — tương tự
   trên nhưng đọc thẳng field, không quét.
3. `--verify-from-children` trên item KHÔNG có con nào → `edit` throw lỗi
   rõ ràng, exit non-zero, `verify` field KHÔNG bị ghi đè (kiểm bằng đọc
   lại item sau lệnh thất bại).
4. `--verify-from-targets` trên item không có `targets` (rỗng/absent) →
   cùng hành vi throw như (3).
5. (Không bắt buộc nhưng nên có) command sinh ra thật sự PASS khi chạy tay
   qua `fgos return` trên 1 fixture item con đã `delivered` — chứng minh
   command không chỉ đúng cú pháp mà còn đúng ngữ nghĩa, giải quyết đúng
   loại lo ngại `judgeVerifySemanticCorrectness` đã nêu lúc `fgos-coding-exploring`
   (xem CONTEXT.md, dispute round 2-3 + `--force` override).

## Verify cho tsk-580 — sửa lại tại `fgos-coding-validating` (bug thật vừa phát hiện)

Verify chốt ở `fgos-coding-exploring` (`grep "^# pass [1-9]"`) SAI trên thực tế —
`node --test` với Node v24.18.0 dùng reporter mặc định in `ℹ pass N` (không
có tiền tố `#`), và quan trọng hơn: **`--test-name-pattern` không match
test nào vẫn báo `tests 1 / pass 1`** — Node đếm chính file đó như 1 "test"
bọc ngoài, không phải test con thật. Đã tự tay chạy cả 2 case để chứng
minh (không phải suy đoán):

- Pattern `"verify-from"` (chưa có test nào match thật) → `tests 1, pass 1,
  fail 0` — dòng "✔" duy nhất là path của FILE, không phải tên test nào.
- Pattern `"edit --priority"` (test thật đang tồn tại) → cũng `tests 1,
  pass 1` — dòng "✔" lần này là đúng tên test thật.

Hai case cho cùng số đếm — nghĩa là đếm pass/fail không phân biệt được
"có test thật match" với "không test nào match". Đây chính xác là loại lo
ngại `judgeVerifySemanticCorrectness` nêu ở dispute round 2-3 (`fgos-
exploring`, xem CONTEXT.md) — hoá ra đúng, dù lúc đó lý do nó đưa ra
("chưa xác minh test coverage") không diễn đạt được kỹ thuật chính xác
bằng thực nghiệm này.

**Verify đã sửa** — chỉ pass khi có dòng "✔" (bất kể ký tự chính xác nào,
`^. .*` bắt cả unicode) chứa ĐÚNG 1 trong 4 tên test case dưới, VÀ fail
count = 0:

```
out=$(node --test --test-name-pattern="verify-from" test/cli/fgos.test.mjs 2>&1); fail=$(echo "$out" | grep -oE "^. fail [0-9]+" | grep -oE "[0-9]+$"); test "$fail" = "0" && echo "$out" | grep -qE "^. .*verify-from-children generates" && echo "$out" | grep -qE "^. .*verify-from-targets generates" && echo "$out" | grep -qE "^. .*verify-from-children with no children" && echo "$out" | grep -qE "^. .*verify-from-targets with empty targets"
```

Đã tự chạy tay lệnh này ngay bây giờ (trước khi implement) — **exit 1**
(đúng như kỳ vọng, vì 4 test case chưa tồn tại) — chứng minh không còn
vacuous-pass. Bốn test case (1)-(4) ở phần Shape PHẢI đặt tên chứa đúng 4
substring sau (ràng buộc thật, không phải gợi ý):

1. `...verify-from-children generates...`
2. `...verify-from-targets generates...`
3. `...verify-from-children with no children...`
4. `...verify-from-targets with empty targets...`

## Reality gate (fgos-coding-validating)

- **Mode fit — PASS**: mode `small` (1 flag đếm được: public contracts) khớp
  quy mô thật (1 file chính + test + 2 doc tham chiếu cập nhật), không thấy
  over/under-build.
- **Repo fit — PASS**: mọi file/hàm/pattern plan dựa vào đã đọc trực tiếp và
  tồn tại đúng như mô tả — `bin/fgos.mjs` case `edit` (1191-1343+),
  `collectRollupData` (671-686), import `isResolvedStatus`, `test/cli/
  fgos.test.mjs` có sẵn test suite cho `edit`.
- **Assumptions — PASS**: 2 assumption trong plan.md (không export helper
  mới; message lỗi guard không cần format cố định) đều thấp rủi ro, có tiền
  lệ code thật hỗ trợ.
- **Smaller path — PASS (không có path nhỏ hơn)**: đã là 1 flag đơn giản
  nhất có thể theo pattern sẵn có, không thấy cách rút gọn thêm mà không mất
  behavior.
- **Proof surface — PASS (sau khi sửa)**: verify ban đầu ở `fgos-coding-exploring`
  có bug thật (vacuous-pass + sai reporter format) — đã tự chạy tay phát
  hiện và sửa ngay tại bước này (xem phần "Verify cho tsk-580" ở trên và
  matrix bên dưới). Verify mới đã tự chứng minh KHÔNG vacuous (exit 1 trên
  state hiện tại, đúng kỳ vọng).
- **Impact-analysis posture — PASS**: `degraded` (present, index stale) —
  khớp đúng những gì plan.md đã ghi ở bước `fgos-coding-planning`, chạy lại xác
  nhận không đổi; không proof point nào ở trên dựa vào GitNexus nên gap này
  không chặn gì.

## Feasibility matrix (fgos-coding-validating)

| Assumption | Rủi ro | Proof yêu cầu | Evidence tìm được | Kết quả |
|---|---|---|---|---|
| Root resolution: `resolveRepoRoot` sai (show-toplevel = worktree), phải dùng git-common-dir | Trung bình | Chạy thật cả 2 lệnh git từ bên trong worktree này, so sánh kết quả | Đã chạy: `git rev-parse --show-toplevel` → `.../worktrees/tsk-580-23JPo5` (SAI); `git rev-parse --path-format=absolute --git-common-dir` + dirname → `/home/vantt/projects/forgentX` (ĐÚNG, main checkout thật) | **PASS** — divergence thật, không phải suy đoán |
| Verify command tsk-580 không vacuous-pass | Cao (phát hiện thêm ở bước này, plan.md ban đầu không lường tới) | Chạy thật verify command trên state hiện tại (chưa implement) | Đã chạy: version cũ (`grep "^# pass"`) sai reporter format + vacuous trên 0-match (thực nghiệm: pattern match 0 test thật vẫn ra `tests 1/pass 1` giống hệt pattern match 1 test thật) → đã sửa sang check `^✔.*<tên test cụ thể>` cho từng 1-trong-4 case, chạy lại: **exit 1** (đúng, vì test chưa viết) | **PASS** (sau khi sửa) |
| `isResolvedStatus` đã import sẵn trong bin/fgos.mjs | Thấp | Đọc trực tiếp file | Xác nhận qua grep: `import { isResolvedStatus } from '../src/state/frontier.mjs'` có trong danh sách import đầu file | PASS |
| `collectRollupData` pattern enumerate children đúng như mô tả | Thấp | Đọc trực tiếp hàm | Đã Read `bin/fgos.mjs:671-686` nguyên văn | PASS |
| Impact-analysis posture = degraded, không cần block | Thấp | `fgos tool query --capability impact-analysis --status present` | Chạy lại: GitNexus `present`, hook báo index stale — khớp đúng "degraded" đã ghi ở plan.md, không dựa vào GitNexus cho proof point nào ở trên | PASS |

## Assumptions

- Không export helper `resolveMainCheckoutRoot` mới trong `paths.mjs` —
  inline `execFileSync` trực tiếp trong 2 block flag mới, giống 3 tiền lệ
  đã có (`invocation-fault-log.mjs`, `merge.mjs`, `registrations.mjs`) —
  giữ scope, tránh mở rộng ngoài yêu cầu (YAGNI). Đây là assumption thuần
  implementation, không material với CONTEXT.md's decisions, nên không cần
  hỏi lại `fgos-coding-exploring`.
- Câu message lỗi guard (danh sách rỗng) không cần format cụ thể đã chốt —
  chỉ cần rõ ràng, non-zero exit, tương tự các lỗi validation khác trong
  file (`StoreError('validation', ...)`).

## Verdict (fgos-coding-validating)

**READY** — mọi dimension của reality gate PASS (bug thật ở proof surface
đã được phát hiện VÀ sửa ngay tại bước này, không phải note-và-bỏ-qua). Đủ
điều kiện qua edge `decompose` → `executing`.
