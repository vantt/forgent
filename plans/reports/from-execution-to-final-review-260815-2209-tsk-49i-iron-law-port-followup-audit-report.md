# Prompt — audit phần port mới (Iron Law trunk-boundary + level) trên `fgw/tsk-49i`, fix tại chỗ nếu có bug

Dán nguyên khối dưới đây cho một agent review mới (model opus). Nó tự đủ
ngữ cảnh: người chạy không cần biết gì về các phiên trước.

---

## PROMPT BẮT ĐẦU TỪ ĐÂY

Bạn đang audit một mẩu code NHỎ, MỚI, chưa từng được review — khác với
audit trước (đã xong, sạch) chỉ phủ 5 commit gốc của `tsk-49i`.

### Bối cảnh (đã xảy ra trước bạn, không cần làm lại)

`tsk-49i` (refactor tách merge cluster của fgOS ra tầng use-case) đã được
audit kỹ (46 file gốc, không bug) và đã **merge xong vào `main`**
(`bf8d6fb9 Merge branch 'fgw/tsk-49i'`). Item `tsk-49i` hiện
`status:delivered`.

Trong lúc merge, `main` đã tiến thêm một feature riêng
(`d694a7d2 feat(tsk-1y6-1): scope the Iron Law gate to the trunk boundary,
add ironLaw.level`, decision `docs/decisions/0032-cong-iron-law-chi-hoi-
o-ranh-gioi-trunk-them-muc-warn.md`) đụng conflict thật với đúng 3 chỗ
`tsk-49i` vừa refactor (`bin/fgos.mjs`'s `case 'approve'`/`'sync-root'`/
`'merge'`). Người vận hành phiên trước đã:

1. Resolve conflict `bin/fgos.mjs` bằng cách giữ bản `tsk-49i` (1 dòng
   delegate sang use-case), bỏ bản inline dài của `main`.
2. **Port lại thủ công** đúng phần logic mới của `d694a7d2` vào kiến trúc
   use-case mới — đây là phần CẦN AUDIT, chưa ai review:
   - File mới `src/verbs/merge/iron-law-level.mjs` (`readIronLawLevel`,
     `recordIronLawSkip`) — cố ý đặt ở tầng use-case (rank 1), KHÔNG đặt
     trong `src/runner/iron-law-gate.mjs` (tầng infra, rank 2) vì nó cần
     import `IRON_LAW_LEVELS`/`DEFAULT_IRON_LAW_LEVEL` từ
     `src/setup/registrations.mjs` (tầng use-case, rank 1) — infra import
     use-case sẽ vi phạm luật 1 chiều (`docs/architecture-manifest.json`).
   - Sửa `src/verbs/merge/approve.mjs`: thêm discriminator
     `resolveRoot(view, id) === id` (chỉ gate khi merge thật sự chạm
     trunk) + nhánh `warn` (ghi decision `kind:'engine'` + in stderr thay
     vì throw).
   - Sửa `src/verbs/merge/sync-root.mjs`: discriminator KHÁC —
     `!item.parent` (cố ý không dùng `resolveRoot`, vì `sync-root` nhắm
     `fgw/<item.parent>` trực tiếp, khác câu hỏi `resolveRoot` trả lời).
   - Sửa `src/verbs/merge/merge.mjs`'s `wouldTripIronLaw` (pre-check của
     `merge next`): thêm cả 2 — early-return khi `level==='warn'`, và
     `resolveRoot(mergeView, candidateId) !== candidateId` → bỏ qua.
   - `CHANGELOG.md`: gộp cả 2 mục (của `main` và của `tsk-49i`), không mất
     mục nào.
   - `docs/architecture-manifest.json`: đăng ký file mới là `use-case`.
3. Người vận hành đã tự chạy `test/cli/fgos-iron-law-gate.test.mjs` (10
   test mới từ `d694a7d2`, PASS cả 10) và full `npm test` 2 lần (trước
   commit trong worktree, và lại lần nữa trên `main` sau khi merge —
   3369 test, 3364 pass, 0 fail, 5 skip cả 2 lần) — nhưng đây là
   self-check của chính người viết code, **cần một cặp mắt khác xác
   nhận lại**, không coi là đã audit độc lập.
4. Một sự cố phụ đã tự phát hiện + tự fix: merge commit ban đầu vô tình
   kéo theo diff thật dưới `.fgos/` (do `git merge main` tự động 3-way
   merge file append-only `.fgos/changelog-nag-history.jsonl`) — đã
   `git checkout <main-tip> -- .fgos` rồi amend commit để `.fgos/` trong
   merge commit khớp byte-for-byte với `main` tip lúc đó, tránh
   `mergeRunnerItem`'s `fgos-write-rejected` guard (`src/runner/
   merge.mjs` dòng ~1256: `git diff --name-only --cached` thấy path nào
   dưới `.fgos/` là abort). **Xác minh lại claim này** — không tin lời kể,
   tự `git show <sha> --stat -- .fgos` mà kiểm.

### Phạm vi audit — CHỈ 6 file, diff nhỏ

```
git diff --stat 7c8108df9d2be8d51bd237d83cc5e432ea33a5ec..5f4005fa945877c7a6b249f44891b465dda48aaf -- \
  src/verbs/merge/ CHANGELOG.md docs/architecture-manifest.json bin/fgos.mjs
```

Kết quả (đã chạy sẵn, xác nhận lại cho chắc):

```
 CHANGELOG.md                       | 29 ++++++++++++++++++++++++++-
 docs/architecture-manifest.json    |  1 +
 src/verbs/merge/approve.mjs        | 28 +++++++++++++++++++++-----
 src/verbs/merge/iron-law-level.mjs | 41 ++++++++++++++++++++++++++++++++++++++
 src/verbs/merge/merge.mjs          | 11 ++++++++++
 src/verbs/merge/sync-root.mjs      | 23 +++++++++++++++++++--
 6 files changed, 125 insertions(+), 8 deletions(-)
```

`bin/fgos.mjs` KHÔNG đổi gì giữa 2 sha này (đã confirm 0 diff) — không
cần soát lại.

- SHA gốc (trước port, đã audit sạch): `7c8108df9d2be8d51bd237d83cc5e432ea33a5ec`
- SHA sau port (merge commit, trên branch `fgw/tsk-49i`, ĐÃ merge vào main):
  `5f4005fa945877c7a6b249f44891b465dda48aaf`
- SHA gốc của `d694a7d2` trên `main` (bản THAM CHIẾU cần port đúng theo):
  `d694a7d2737c0a43cab2e62399243726078b109e` — `git show d694a7d2 -- bin/fgos.mjs`
  để xem bản gốc main tự viết, so với bản đã port.

### Checklist audit

1. **Tương đương ngữ nghĩa với `d694a7d2`.** Diff từng đoạn code trong
   `d694a7d2 -- bin/fgos.mjs` (3 call site: `wouldTripIronLaw`, `approve`'s
   gate, `sync-root`'s gate) với bản port trong 3 file `.mjs` mới. Discriminator
   đúng như mô tả (approve/merge-next: `resolveRoot===id`; sync-root:
   `!item.parent`, KHÔNG lẫn lộn 2 cái)? Message refusal, message warn,
   `recordIronLawSkip`'s `text`/`rationale`/`kind` — copy đúng chữ, đúng ký
   tự, không lệch 1 từ nào so với bản gốc (test đã pass không có nghĩa
   message giống hệt — test có thể chỉ match substring).
2. **Thứ tự guard trong `approve.mjs`/`sync-root.mjs`.** Discriminator mới
   (`resolveRoot===id` / `!item.parent`) có chèn ĐÚNG VỊ TRÍ — trước hay
   sau `acknowledgeIronLaw`? Trước hay sau các guard khác (worktree-identity,
   targets-drift, resolved-root)? Đối chiếu lại với đúng vị trí trong
   `d694a7d2`'s diff.
3. **Tầng kiến trúc `iron-law-level.mjs`.** Xác nhận `docs/architecture-
   manifest.json` đã đăng ký đúng rank. `test/architecture.test.mjs` (nếu
   có) chạy pass không giả (đọc import thật, không tin test xanh mù
   quáng — xem cảnh báo về regex-blind ở phần dưới). Có file nào khác
   (ngoài `approve.mjs`/`sync-root.mjs`/`merge.mjs`) LẼ RA cũng cần
   `readIronLawLevel`/`recordIronLawSkip` mà bị bỏ sót không? Gợi ý: xem
   toàn bộ diff `d694a7d2` một lần nữa, đừng chỉ tin 3 call site đã liệt
   kê ở trên — quét lại `git show d694a7d2 --stat` cho MỌI file nó đụng,
   không chỉ `bin/fgos.mjs`.
4. **`test/setup/checks.test.mjs` / doctor check cho `ironLaw.level`.**
   `d694a7d2` thêm doctor check (`ensureSharedConfigDefaults`,
   `src/setup/checks.mjs`) — phần này auto-merge sạch (không trong 6 file
   ở trên), nhưng CÓ PHỤ THUỘC vào `readIronLawLevel` không? Nếu doctor
   check tự đọc `.fgos/config.json` theo cách khác (không qua
   `readIronLawLevel`) thì 2 đường đọc config có thể lệch nhau — kiểm tra.
5. **`.fgos/` trong merge commit.** `git show 5f4005fa --stat -- .fgos`
   và `git diff ede5994b5c11873c6f8a6fd57a7a9b8a874f8c6d 5f4005fa -- .fgos`
   (`ede5994b` là tip `main` lúc port) — PHẢI rỗng. Nếu không rỗng, đây là
   **BUG thật, mức độ nghiêm trọng cao** — nghĩa là claim "đã fix" ở trên
   sai, và branch (đã merge vào main) đang mang theo snapshot `.fgos` lệch.
6. **Test coverage của chính phần port.** `test/cli/fgos-iron-law-gate.test.mjs`
   — đọc lại, xác nhận 10 test này thật sự exercise được code MỚI (port),
   không phải code cũ đã bị xoá. Nghĩ xem sửa code port kiểu gì thì bug
   quay lại mà test vẫn xanh (vacuous check, như audit trước đã làm với 3
   test kia).
7. **`CHANGELOG.md`.** Đọc lại đoạn đã gộp — 2 mục còn nguyên nội dung,
   không trùng lặp, không câu nào bị cắt cụt giữa chừng do resolve conflict
   ẩu.

### Định dạng báo cáo — BUG thì fix luôn, tại chỗ

Khác audit trước (chỉ đọc, chỉ báo cáo): lần này **NẾU tìm ra BUG thật,
hãy fix ngay** trong worktree đang có sẵn của item:

```
/home/vantt/projects/forgentX/.claude/worktrees/tsk-49i-j2D6lz
```

(đang checkout `fgw/tsk-49i`, tip hiện tại `5f4005fa`). Được phép sửa
file, chạy `npm test`/`node --test <file>` trong worktree đó, commit fix
vào branch `fgw/tsk-49i` tại đó. **Vẫn áp mọi ràng buộc an toàn của audit
trước**: không đụng `.fgos/` bằng tay ngoài việc kiểm tra, không
`git push`, không chạy lệnh `fgos` nào trong repo tạm ngoài worktree này,
không commit gì vào main checkout (`/home/vantt/projects/forgentX` gốc).

**Ràng buộc quan trọng phải nói rõ trong báo cáo, dù có fix hay không:**
item `tsk-49i` đã `status:delivered`, đã merge vào `main` qua
`bf8d6fb9`. Một commit fix mới trên `fgw/tsk-49i` **KHÔNG tự động lên
lại `main`** — item này coi như đã tiêu thụ xong cửa approve của nó. Đừng
tự ý `git push`/cherry-pick/merge fix đó vào `main` — chỉ commit tại
worktree rồi báo cáo SHA, để người vận hành quyết định đường đưa fix lên
main (item mới, hay cherry-pick tay).

Format báo cáo: liệt kê phát hiện, mỗi cái `file:line`, nhãn **BUG** (kèm
`outcome: fixed` + SHA commit fix nếu đã sửa, hoặc `outcome: unresolved`
kèm lý do nếu không tự sửa được) hoặc **OPINION**. BUG nặng nhất lên đầu.
Không chắc thì nói thẳng không chắc. Check nào sạch ghi 1 dòng "sạch".

Trả kết quả bằng chính message cuối cùng của bạn. Nếu có commit fix, nói
rõ SHA + `git log -1 --stat` của commit đó trong báo cáo, đừng chỉ nói
"đã fix" suông.

## PROMPT KẾT THÚC Ở ĐÂY
