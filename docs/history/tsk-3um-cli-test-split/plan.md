# plan.md — tsk-3um: chẻ `test/cli/fgos.test.mjs`

Kế thừa quyết định đã khoá ở
[`../tsk-25b-test-wallclock-split/CONTEXT.md`](../tsk-25b-test-wallclock-split/CONTEXT.md)
(D1/D2/D3) và Phase 1 của
[`../tsk-25b-test-wallclock-split/plan.md`](../tsk-25b-test-wallclock-split/plan.md).
Không mở lại quyết định nào ở đây.

Mode: **standard**

**Flag count: 2** — `public contracts` (D1 xoá hẳn đường dẫn
`test/cli/fgos.test.mjs`, thứ 55 item tham chiếu trong `verify` và 158 doc
nhắc tới), `existing covered behavior` (di chuyển 547 test đang phủ thật).
Không cờ hard-gate: D2 cấm sửa/xoá test, chỉ cho di chuyển, nên đây **không**
phải `removing a validation`.

Vì sao không `small`: 547 test, một file 9761 dòng có helper dùng chung phải
trích ra, cộng việc sửa `verify` của item khác đang bay. Không phải "vài
file, không vùng xám".

## Số đo baseline (P1 đã chạy — vòng validating 2026-08-11)

Đo trên chính worktree này, mỗi phép chạy một mình, tuần tự:

| Phép đo | Kết quả |
|---|---|
| `npm test` toàn bộ 118 file | **169.76s**, **1 test đỏ** |
| 116 file còn lại (trừ `fgos.test.mjs` + `checks.test.mjs`) | **29.70s** |

**29.70s trả lời câu hỏi rủi ro cao nhất**: trần của cả suite sau khi chẻ hai
file kia không thể thấp hơn con số này, và cũng không cao hơn nó bao nhiêu
nếu mọi nhóm mới đều dưới 30s. Mục tiêu ≤45s của D3 **khả thi** — không cần
chỉnh D3.

**1 test đỏ là lỗi sẵn có, không liên quan item này**: `NEGATIVE:
"orchestrator" does not appear in fgOS-owned prose outside the allowlist`
(`test/docs/launcher-vocabulary-guard.test.mjs`), đỏ vì
`docs/history/branch-content-mismatch-post-merge-false-positive/plan.md`
chưa có trong allowlist của guard đó. File này đến từ commit `d0ce4728`
(tsk-107), nằm trước điểm branch này fork. Sửa nó nằm ngoài `CONTEXT.md`
của tsk-25b, nên item này **không** sửa — verify bên dưới được viết để
phân biệt "lỗi sẵn có" với "regression do item này gây ra".

## Approach

### Đường cắt

Cắt theo **verb của CLI** — đơn vị chủ đề tự nhiên của file này, và đúng quy
ước sẵn có của thư mục (`fgos-help.test.mjs`, `fgos-manifest.test.mjs`,
`fgos-tool.test.mjs`, `take-pick-claim-eligibility.test.mjs`). Phân bố thật,
đếm từ `^test('<verb>` trên chính file:

| Verb | Test |
|---|---|
| approve 47, merge 17 | 64 |
| edit 41, add 39 | 80 |
| return 43, review 15, reject 4 | 62 |
| take 17, pick 18, session 11, unlock 6, lock-status 6, main-checkout-reset 3 | 61 |
| submit 24, move 16, ask/answer 5, decision 4 | 49 |
| list 22, show 6, ready 11, triage 6, graph 4, rollup 11, stale 4, conflicts 4, goal 6 | 74 |
| discover 11, decompose 8, evolve 13, promote-to-component 8, sync-root 10, check 20 | 70 |
| cleanup 7, compound 9, catchup 9, init 9, docs-index 5, doc-sources 5, + phần lẻ | ~87 |

**8 nhóm**, trung bình ~68 test/nhóm. Với ~0.31s/test (171.0s / 547) thì mỗi
nhóm ≈ 21s — dưới ngưỡng 30s của D3, còn biên cho nhóm lệch.

Ranh giới cuối cùng **cân bằng theo chi phí đo được, không theo đếm đầu
test** (xem P1b). Bảng trên là điểm xuất phát, không phải con số bất di.

### Helper dùng chung

`run()`, `rawTmpCwd()`, `tmpCwd()` và các fixture git (`fgos.test.mjs:44-190`)
trích ra `test/cli/helpers/fgos-cli-harness.mjs`, import vào từng file mới.
Nằm trong định nghĩa "chẻ cơ học" đã pin ở `CONTEXT.md` ("kèm phần
import/helper cần thiết"). Đặt dưới `helpers/` với đuôi không phải
`.test.mjs` nên glob `test/**/*.test.mjs` không nhặt nó làm file test.

### Bản đồ rủi ro

| Thành phần | Mức | Proof point |
|---|---|---|
| ~~Ngưỡng 45s có thể bất khả thi~~ | ~~cao~~ | **P1 — ĐÃ ĐÓNG**, xem bảng số đo trên: 116 file còn lại chạy hết trong 29.70s, nên trần sau khi chẻ ≈ 30s và mục tiêu 45s khả thi. Đo bằng một lần chạy trên tập-trừ-hai-file, rẻ hơn nhiều so với đo tuần tự 118 file mà cho đúng con số cần biết (makespan, chính là thứ quyết định wall-clock). |
| **Baseline không xanh** — suite có sẵn 1 test đỏ không liên quan, nên verify dạng "0 fail" là bất khả thi và sẽ chặn item ở `fgos return`. | **cao** | Verify được viết lại để so tập đỏ sau với tập đỏ baseline thay vì đòi rỗng — xem "Proof surface" bên dưới. Không mở scope sang sửa lỗi của tsk-107. |
| **Chia nhóm theo đếm đầu có thể lệch** — giả định ~0.31s/test đều nhau chưa được chứng minh cho file này. | trung bình | **P1b**: chạy `node --test --test-reporter=spec test/cli/fgos.test.mjs` một lần (~171s), lấy duration từng test, cộng theo nhóm ở bảng trên, chỉnh ranh giới cho nhóm nặng nhất < 30s. |
| **Test phụ thuộc side effect của test chạy trước nó trong cùng file** — tách file là tách process, side effect biến mất. | trung bình | Không cần proof riêng: nếu có, nó đỏ ngay lần chạy đầu sau khi chẻ. Bắt bởi chính verify — mệnh đề (2) chỉ tha đúng một lỗi guard sẵn có, mọi test đỏ khác đều làm verify đỏ. |
| **5 item còn bay có `verify` trỏ đường dẫn cũ**; 2 trong số đó (`tsk-4uj`, `tsk-1cp`) đang `doing` — phiên khác đang chạm. | trung bình | **P3**: đọc lại danh sách ngay trước khi sửa (danh sách chụp 2026-08-11 có thể đã đổi), chỉ ghi qua verb của engine, không sửa tay `.fgos/`. |
| Vỡ ràng buộc kiến trúc | không | `test/` ngoài `docs/architecture-manifest.json`; `test/architecture.test.mjs` chỉ quét `src/`+`bin/`. |

`impact-analysis: full` (gitnexus `present`). Ghi chú trung thực: không proof
point nào ở trên dựa vào nó — gitnexus chỉ index `src/`+`bin/`, không nói gì
được về `test/`.

## Proof surface

Verify của item (đã cập nhật qua `fgos edit --verify`), chạy được nguyên
văn, tự đỏ khi sai:

```sh
npm test >/tmp/tsk-3um-verify.log 2>&1
awk '/^ℹ tests /{t=$3} /^ℹ fail /{f=$3} END{exit !(t>=2827 && f<=1)}' /tmp/tsk-3um-verify.log \
  && ! grep '^✖' /tmp/tsk-3um-verify.log | grep -v 'failing tests:' \
       | grep -qv 'orchestrator" does not appear in fgOS-owned prose' \
  && for f in test/cli/*.test.mjs; do
       s=$( { /usr/bin/time -f %e node --test "$f" >/dev/null 2>&1; } 2>&1 | tail -1 )
       awk -v s="$s" 'BEGIN{exit (s>30)}' || { echo "SLOW $f ${s}s"; exit 1; }
     done
```

Ba mệnh đề: (1) tổng test không giảm dưới 2827 và không quá 1 test đỏ;
(2) test đỏ duy nhất được phép là đúng lỗi guard sẵn có — bất kỳ test đỏ nào
khác đều làm verify đỏ; (3) không file nào trong `test/cli/` vượt 30s.

Dùng `ℹ tests`/`ℹ fail` — đúng định dạng reporter mặc định của Node in ra
(kiểm chứng trực tiếp trên `test/architecture.test.mjs`), **không** phải dạng
TAP `^# pass`/`^# fail` mà
`docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md` cấm vì
reporter mặc định không bao giờ in.

## Shape

1. **Đo per-test cost** — chạy `node --test --test-reporter=spec
   test/cli/fgos.test.mjs` một lần (~171s), lấy duration từng test, cộng
   theo nhóm ở bảng trên, chỉnh ranh giới cho nhóm nặng nhất < 30s (P1b —
   đây là dữ liệu để chia nhóm, thuộc thi công, không phải proof point
   feasibility; P1 ở trên mới là cái gate tính khả thi và nó đã đóng).
2. **Trích helper** ra `test/cli/helpers/fgos-cli-harness.mjs`.
3. **Chuyển test theo 8 nhóm**, ranh giới chốt theo số đo ở P1b. Mỗi nhóm
   một file `test/cli/fgos-<chủ-đề>.test.mjs`.
4. **Xoá `test/cli/fgos.test.mjs`** (D1).
5. **Sửa `verify` của 5 item còn bay** qua verb của engine (P3).
6. **Đo lại** — `npm test` 0 fail, tổng test không giảm, không file nào
   trong `test/cli/` vượt 30s.

### Trường hợp đáng chứng minh

- **Không mất test**: tổng sau = tổng trước (547 trong file này, ~2827 cả
  suite). Bắt bởi verify.
- **Không double-count**: một test bị copy vào hai nhóm sẽ làm tổng > trước —
  cùng phép so bắt được cả hai chiều.
- **Ngưỡng biên**: nhóm nặng nhất phải < 30s chứ không phải ≈ 30s. 8 nhóm
  thay vì 6 chính là biên đó.
- **Helper không thành file test**: `test/cli/helpers/*.mjs` không khớp glob
  `test/**/*.test.mjs`; kiểm bằng chính tổng số test không đổi.

## Assumptions

- **A1** — chi phí mỗi test trong file này tương đối đều (~0.31s). Không dựa
  vào giả định này: P1b đo thật trước khi chốt ranh giới.
- **A2** — 50 item đã ở `cleanup`/`done` mang `verify` trỏ đường dẫn cũ sẽ
  không chạy lại verify, nên không cần sửa (verify chỉ chạy ở `return` và
  post-merge, cả hai đã qua).
- **A3** — tăng số file bận trong `test/cli/` từ 1 lên 8 vẫn nằm trong 16
  core; nếu sai thì wall-clock chạm trần CPU chứ không chạm trần file, và
  P1 sẽ lộ ra khi so số.

## Outstanding questions

None
