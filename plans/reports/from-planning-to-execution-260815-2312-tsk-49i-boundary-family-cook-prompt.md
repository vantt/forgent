# Prompt cho `/fgOS:cook` — hậu kiểm bộ task tách module boundary (tsk-49i family) + phần port Iron Law chưa ai audit

Dán nguyên khối dưới "PROMPT BẮT ĐẦU" làm free-text task cho
`/fgOS:cook`. Nó sẽ tự `submit`, tự đi qua discovery/exploring/planning/
validating, rồi implement thật trong nhánh/worktree riêng của item mới —
khác 2 prompt trước (dán tay cho agent review), lần này đi đúng cửa
lifecycle của fgOS.

---

## PROMPT BẮT ĐẦU

Hậu kiểm (post-hoc audit) bộ task đã tách module boundary cho merge
cluster của fgOS, đã merge xong vào `main` — và fix trực tiếp nếu tìm ra
bug thật, vì item này chạy trong nhánh/worktree riêng của chính nó.

### Phạm vi — 2 lớp việc, cả 2 đều CHƯA có audit độc lập đáng tin

**Lớp 1 — bộ task `tsk-49i` (đã audit 1 lần, sạch, nhưng review lại không
hại gì vì lớp 2 bên dưới đụng đúng file lớp 1 vừa tạo ra):**

- `tsk-49i` (root, delivered), `tsk-49i-1` (retrospective), `tsk-49i-2`
  (delivered) — tách 5 cạnh import `state/`→`runner/`, gộp Iron Law
  check, tách tầng use-case `src/verbs/merge/*.mjs`.
- `tsk-55f`, `tsk-2fx`, `tsk-h6r` (delivered) — 3 bug tìm được TRONG lúc
  làm lớp 1 (side-effect/refusal nhảy qua guard), đã fix.
- Report audit gốc (đọc trước, đừng làm lại từ đầu — nó đã kỹ và sạch):
  `plans/reports/from-execution-to-final-review-260815-1616-tsk-49i-parent-branch-regression-audit-report.md`

**Lớp 2 — phần port KHÔNG ai audit độc lập, chỉ có self-check của người
viết (đây mới là trọng tâm cần soi kỹ):**

Trong lúc merge `tsk-49i` vào `main`, `main` đã tiến thêm
`d694a7d2 feat(tsk-1y6-1): scope the Iron Law gate to the trunk boundary,
add ironLaw.level` (decision `docs/decisions/0032-cong-iron-law-chi-hoi-
o-ranh-gioi-trunk-them-muc-warn.md`, item `tsk-1y6-1`, delivered) — đụng
conflict thật với đúng 3 call site lớp 1 vừa refactor
(`bin/fgos.mjs`'s `case 'approve'`/`'sync-root'`/`'merge'`). Người vận
hành phiên trước tự resolve + tự port logic mới vào kiến trúc use-case
mới, tự chạy test tự thấy xanh — **chưa ai khác review**. Cụ thể đã đổi:

- File mới `src/verbs/merge/iron-law-level.mjs` (`readIronLawLevel`,
  `recordIronLawSkip`), đặt tầng use-case (rank 1) vì cần import
  `IRON_LAW_LEVELS`/`DEFAULT_IRON_LAW_LEVEL` từ `src/setup/
  registrations.mjs` (cũng use-case) — đặt trong `src/runner/
  iron-law-gate.mjs` (infra, rank 2) sẽ vi phạm luật import 1 chiều.
- `src/verbs/merge/approve.mjs`: discriminator `resolveRoot(view, id)
  === id` (chỉ gate khi merge chạm trunk) + nhánh `warn`.
- `src/verbs/merge/sync-root.mjs`: discriminator KHÁC — `!item.parent`
  (cố ý không dùng `resolveRoot`, vì `sync-root` nhắm `fgw/<item.parent>`
  trực tiếp).
- `src/verbs/merge/merge.mjs`'s `wouldTripIronLaw`: thêm cả early-return
  `level==='warn'` và `resolveRoot(mergeView, candidateId) !== candidateId`.
- `CHANGELOG.md`: gộp 2 mục (của `main` và của `tsk-49i`).
- `docs/architecture-manifest.json`: đăng ký file mới.
- Sự cố phụ tự phát hiện + tự fix: merge commit ban đầu lỡ kéo theo diff
  thật dưới `.fgos/` (git 3-way merge tự động), đã reset về khớp `main`
  tip trước khi commit — **verify lại claim này bằng lệnh thật**, đừng
  tin lời kể.

Report có checklist chi tiết cho lớp 2 (đọc, dùng làm điểm khởi đầu, đừng
coi là danh sách đóng — tự tìm thêm nếu nghi còn sót):
`plans/reports/from-execution-to-final-review-260815-2209-tsk-49i-iron-law-port-followup-audit-report.md`
(prompt này VIẾT SẴN cho việc dán tay, CHƯA từng chạy — coi như tài liệu
tham khảo checklist, không phải bằng chứng đã audit).

### SHA tham chiếu (repo đã ở trạng thái này trên `main`, không cần dựng lại)

- `main` hiện tại = `bf8d6fb9b476ee7b3988d09943c75a4463441b3d` (đã chứa
  toàn bộ lớp 1 + lớp 2).
- SHA lớp 1 trước khi port lớp 2: `7c8108df9d2be8d51bd237d83cc5e432ea33a5ec`
  (tip cũ của `fgw/tsk-49i`, đã audit sạch).
- SHA sau khi port lớp 2 (merge commit): `5f4005fa945877c7a6b249f44891b465dda48aaf`.
- SHA gốc `main` tự viết cho lớp 2 (bản THAM CHIẾU để đối chiếu port có
  đúng không): `d694a7d2737c0a43cab2e62399243726078b109e`.
- `git diff --stat 7c8108df..5f4005fa -- src/verbs/merge/ CHANGELOG.md docs/architecture-manifest.json bin/fgos.mjs`
  cho đúng 6 file đổi (125+/8-) — phạm vi lớp 2 gói gọn trong đó.

### Việc cần làm

1. Đọc 2 report trên để không lặp lại việc đã làm.
2. Đối chiếu lớp 2 (6 file) với bản gốc `d694a7d2` — tương đương ngữ
   nghĩa, đúng thứ tự guard, đúng discriminator từng call site (đừng lẫn
   `resolveRoot===id` với `!item.parent`), message refusal/warn đúng chữ.
3. Quét xem `d694a7d2` có đụng file nào khác ngoài `bin/fgos.mjs` mà lớp
   2 bỏ sót không (vd doctor check `ensureSharedConfigDefaults` trong
   `src/setup/checks.mjs` — có phụ thuộc `readIronLawLevel` không, có
   lệch đường đọc config không).
4. Xác minh thật `.fgos/` sạch trong merge commit (`git show 5f4005fa
   --stat -- .fgos` phải rỗng khi so với `main` tip lúc đó
   `ede5994b5c11873c6f8a6fd57a7a9b8a874f8c6d`).
5. `npm test` phải xanh thật (không tin số cũ, tự chạy lại).
6. Bug thật thì **fix ngay** trong nhánh/worktree của chính item này (đây
   là lý do chạy qua `fgos-coding-implement` thay vì dán tay cho agent
   read-only) — sửa file, test lại, commit bình thường theo verify của
   item.

### Ràng buộc

- KHÔNG động vào `tsk-49i`/`tsk-1y6-1` hay bất kỳ item nào đã
  `delivered`/`retrospective` khác — chúng đã tiêu thụ xong cửa approve,
  không thể "sửa lại" qua item cũ. Bug tìm được thì fix trong nhánh của
  CHÍNH item mới này, không cherry-pick ngược, không đụng worktree cũ
  của `tsk-49i` (`/home/vantt/projects/forgentX/.claude/worktrees/tsk-49i-j2D6lz`
  — bỏ qua, không dùng).
- `npm test` là proof bắt buộc, không phải tuỳ chọn.
- Nếu không tìm ra bug thật (chỉ OPINION/style), verify vẫn phải chứng
  minh bằng npm test xanh + đối chiếu evidence cụ thể — không tự khai
  "đã audit" mà không có bằng chứng kèm theo (file:line, lệnh đã chạy).

## PROMPT KẾT THÚC
