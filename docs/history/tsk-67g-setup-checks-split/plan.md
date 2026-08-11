# plan.md — tsk-67g: chẻ `test/setup/checks.test.mjs`

Kế thừa quyết định đã khoá ở
[`../tsk-25b-test-wallclock-split/CONTEXT.md`](../tsk-25b-test-wallclock-split/CONTEXT.md)
(D1/D2/D3) và Phase 2 của item cha. Không mở lại quyết định nào ở đây.

Mode: **standard**

**Flag count: 1** — `existing covered behavior` (di chuyển 85 test đang phủ
thật). Khác `tsk-3um`, item này **không** có cờ `public contracts`: không
đường dẫn nào bị xoá mà item khác đang tham chiếu — `test/setup/checks.test.mjs`
không xuất hiện trong `verify` của bất kỳ item còn bay nào.

Vì sao vẫn không phải `small`: file này chạm `fgos setup`, thứ dựng môi
trường thật (git checkout thật, `~/.fgos/config.json`, `core.hooksPath`), và
phân bố chi phí lệch tới mức đường cắt phải do số đo quyết định chứ không do
chủ đề — xem ngay dưới.

## Số đo P2 (đã chạy, 2026-08-11)

`node --test test/setup/checks.test.mjs`, chạy một mình: **120.0s / 85 test**.

| Nhóm theo từ đầu tên test | Test | Chi phí |
|---|---|---|
| `fgos …` (gồm 10 test `fgos setup …` nặng + 4 test `fgos doctor/check` nhẹ) | 14 | 96.4s |
| `setup …` | 2 | 22.9s |
| 21 nhóm còn lại (`shell-integration-sourced`, `root-drift`, `gate-bypass-configured`, …) | 69 | **0.6s** |

**10 test dựng môi trường thật chiếm ~117.6s — tức 98% chi phí của cả file,
trên 12% số test.** Từng test một: 14.27, 13.21, 11.96, 11.79, 11.27, 11.21,
11.19, 11.08, 10.98, 10.66 (giây).

Hệ quả cho đường cắt, và đây là chỗ số đo bác chính giả định trong plan cha:

- Chia theo **chủ đề** là bất khả thi. Ba test cùng nói về `~/.fgos/config.json`
  (`initializes`, `fills a missing default key`, `run twice`) cộng lại đã
  33.8s — vượt ngưỡng 30s của D3 trước khi thêm bất cứ thứ gì.
- Đơn vị nhỏ nhất khả dụng là **2 test nặng/file ≈ 23s**. Một test nặng/file
  sẽ cho 10 file cho 85 test — vụn vô ích, vì 73 test còn lại gộp hết vào một
  file cũng chỉ tốn 2s.
- Vì vậy: **5 file mới × 2 test nặng, ghép lớn với nhỏ để cân**, và
  **`checks.test.mjs` ở nguyên chỗ cũ** với 75 test nhẹ.

**Không xoá `checks.test.mjs`** — điểm này là đường nhỏ hơn mà vòng shape đầu
bỏ sót và reality gate bắt lại: sau khi 10 test nặng rời đi, file cũ chỉ còn
~2.5s, tức không còn là file chi phối gì cả, nên đổi chỗ nó chẳng mua được
gì mà lại tạo thêm xáo trộn. D1 (xoá hẳn đường dẫn) chỉ ràng buộc
`test/cli/fgos.test.mjs`, không ràng buộc file này — và không item còn bay
nào tham chiếu tới nó, nên cũng không có `verify` nào phải sửa.

| File | Test nặng | Chi phí |
|---|---|---|
| `checks-setup-envelope.test.mjs` (mới) | wrapEnvelope-shaped JSON (14.27) + fills a missing default key (10.66) | ~24.9s |
| `checks-setup-hookspath.test.mjs` (mới) | pre-existing custom core.hooksPath (13.21) + cwd with no .git (10.98) | ~24.2s |
| `checks-setup-idempotent.test.mjs` (mới) | run twice (11.96) + real checkout rc line (11.08) | ~23.0s |
| `checks-setup-rc-line.test.mjs` (mới) | non-git copy declines rc write (11.79) + --pretty (11.19) | ~23.0s |
| `checks-setup-config.test.mjs` (mới) | wires core.hooksPath (11.27) + initializes config.json (11.21) | ~22.5s |
| `checks.test.mjs` (giữ nguyên chỗ) | 75 test nhẹ còn lại (doctor, registry, shell-integration, …) | ~2.5s |

Tên file lấy theo test nặng nhất của nhóm. Ghi thẳng ở đây cho người đọc sau:
**các nhóm này cân theo chi phí, không theo chủ đề** — với phân bố 98%/12%
như trên thì không có cách nào vừa cân vừa gọn chủ đề, và cân là thứ D3 đòi.

## Kết quả sau khi chẻ (2026-08-11)

| Phép đo | Trước | Sau |
|---|---|---|
| File `test/setup/` chậm nhất | 120.0s (`checks.test.mjs`) | **22.82s** (`checks-setup-idempotent`) |
| `checks.test.mjs` | 120.0s / 85 test | **2.55s** / 75 test |
| Test của cả `test/setup/checks*` | 85 | **85, 0 đỏ** — khớp từng test một |

Từng file mới: config 21.58s, envelope 22.02s, hookspath 21.90s, idempotent
22.82s, rc-line 22.47s. Tất cả dưới 30s, biên hẹp nhất ~24%.

**`npm test` trên branch này đo được 161.30s — con số đó KHÔNG nói lên điều
gì về mục tiêu ≤45s**, và đây là chỗ dễ đọc nhầm nhất: `fgw/tsk-67g` fork từ
`3ecec74`, tức trước commit của `tsk-3um`, nên branch này vẫn mang
`test/cli/fgos.test.mjs` nguyên vẹn ở 171s và chính nó là trần. Con số cuối
chỉ đo được ở item cha `tsk-25b`, sau khi cả hai con merge. Verify của item
này vì vậy không đòi ngưỡng toàn suite — nó đòi đúng ba thứ item này kiểm
soát: không mất test, không test đỏ mới, không file `test/setup/` nào vượt 30s.

Một thứ đáng ghi cho người đọc sau: `test/setup/uninstall-wiring.test.mjs`
đo được **21.70s** — không thuộc phạm vi item này, vẫn dưới ngưỡng, nhưng nó
là ứng viên rõ ràng cho trần tiếp theo nếu ai đó muốn hạ nữa.

## Bản đồ rủi ro

| Thành phần | Mức | Proof point |
|---|---|---|
| **Biên chỉ còn ~17%** — nhóm nặng nhất ~24.9s so với ngưỡng 30s. Một test `setup` chậm thêm 5s là vượt. | trung bình | Verify đo từng file và đỏ khi vượt 30s. Nếu sau này chạm ngưỡng, cách xử lý đã biết sẵn: tách nhóm 14.27s ra riêng, đưa test 10.66s sang nhóm nhẹ. |
| **Test dựng môi trường thật, chạy song song nhiều hơn** — 5 file cùng lúc thay vì 1, mỗi file `git init` và ghi `~/.fgos/config.json` trong thư mục tạm riêng. | trung bình | Chính `checks.test.mjs` đã tự cô lập: mỗi test `mkTemp` riêng và `FGOS_CLAUDE_COMMAND` trỏ vào đường dẫn không tồn tại (`test/setup/checks.test.mjs:12-30`), nên không test nào chạm config thật của máy. Verify (0 test đỏ mới) là chỗ bắt nếu giả định này sai. |
| Helper dùng chung nằm rải rác giữa các test, như file CLI | thấp | Cùng cách xử lý đã chạy được ở `tsk-3um`: gom mọi định nghĩa top-level vào một harness cạnh đó, `__dirname` lùi một cấp còn specifier `import` tiến một cấp. |

`impact-analysis: full` (gitnexus `present`), nhưng nó chỉ index `src/`+`bin/`
nên không nói gì được về `test/` — không proof point nào dựa vào nó.

## Proof surface

```sh
npm test >/tmp/tsk-67g-verify.log 2>&1
awk '/^ℹ tests /{t=$3} /^ℹ fail /{f=$3} END{exit !(t>=2878 && f<=1)}' /tmp/tsk-67g-verify.log \
  && ! grep '^✖' /tmp/tsk-67g-verify.log | grep -v 'failing tests:' \
       | grep -qv 'orchestrator" does not appear in fgOS-owned prose' \
  && for f in test/setup/*.test.mjs; do
       /usr/bin/time -f %e -o /tmp/tsk-67g-one.txt node --test "$f" >/dev/null 2>&1
       s=$(cat /tmp/tsk-67g-one.txt)
       case "$s" in ''|*[!0-9.]*) echo "BAD TIMING for $f: [$s]"; exit 1;; esac
       awk -v s="$s" 'BEGIN{exit (s>30)}' || { echo "SLOW $f ${s}s"; exit 1; }
     done
```

Cùng ba mệnh đề như `tsk-3um`, với hai khác biệt: ngưỡng tổng test là **2878**
(số đo sau khi `tsk-3um` xong, không phải 2827 của baseline cũ), và vòng đo
quét `test/setup/` thay vì `test/cli/`. Dùng `ℹ tests`/`ℹ fail` — đúng định
dạng reporter mặc định của Node, không phải dạng TAP `^# pass` mà
`docs/how-to/avoid-vacuous-pass-with-node-test-test-name-pattern.md` cấm.

`case "$s" in ''|*[!0-9.]*)` không phải trang trí: bản verify đầu của `tsk-3um`
đo thời gian bằng `{ /usr/bin/time … 2>&1; } 2>&1`, bị nuốt mất số đo, và
`awk -v s=""  'BEGIN{exit (s>30)}'` trả 0 — verify xanh giả với mọi file.
Guard này chặn đúng lớp lỗi đó.

## Shape

1. Gom mọi định nghĩa top-level của `checks.test.mjs` vào
   `test/setup/helpers/setup-checks-harness.mjs`, và cho chính
   `checks.test.mjs` import lại từ đó — nó cũng cần đúng bộ helper ấy.
2. Chuyển 10 test nặng sang 5 file mới theo bảng trên, thân test bê nguyên
   văn (D2). `checks.test.mjs` giữ nguyên chỗ với 75 test còn lại.
3. Sửa comment đầu `checks.test.mjs` cho khớp nội dung mới (nó đang tự mô tả
   là chứa cả phần `fgos setup`, phần vừa dọn đi) — comment, không phải test.
4. Đo lại: tổng test không giảm, không test đỏ mới, không file `test/setup/`
   nào vượt 30s.

### Trường hợp đáng chứng minh

- **Không mất/thừa test**: tổng test của cả 6 file `test/setup/` phải bằng đúng 85 —
  cùng phép đối chiếu đã bắt được lỗi ở `tsk-3um` (581 = 581).
- **Đường dẫn trong helper**: `checks.test.mjs` cũng dùng
  `path.resolve(__dirname, '../../bin/fgos.mjs')`; phép sửa phải là `__dirname`
  lùi một cấp chứ không phải sửa từng chuỗi, đúng bài học `REAL_REPO_ROOT`.
- **Ngưỡng biên**: nhóm nặng nhất phải dưới 30s chứ không phải xấp xỉ.

## Assumptions

- **A1** — 73 test nhẹ gộp một file vẫn ~2.5s, không đội lên khi chạy cùng
  process. Chứng minh bởi chính P2: chúng đã chạy cùng process trong file gốc.
- **A2** — trần cuối của cả suite sau khi cả hai item xong sẽ là ~25s (nhóm
  nặng nhất của item này) cộng phần tranh CPU, tức dưới 45s của D3. Chỉ đo
  được ở item cha `tsk-25b`, không phải ở đây.

## Outstanding questions

None
