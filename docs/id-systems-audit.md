---
title: Audit loại-hình công việc & hệ đặt tên/đánh mã (STR47)
status: FINAL — mọi hệ đã chốt hướng; #1,#3,#4,#5,#6 đã migrate (STR53/55/57/56/54); #7-#10 chốt hướng "giữ nguyên/tài liệu hoá" tại record ADR0017
updated: 2026-07-27
kind: audit
decision: ADR0017
---

# Audit: loại-hình công việc + hệ đặt tên/đánh mã

Tài liệu này trả lời `docs/backlog.md` STR47. Bảng inventory trích thẳng từ
code/docs thật (file:line), không suy đoán. Mọi migration mà audit này chốt
hướng (#1, #3, #4, #5, #6) đã thi công xong qua STR53/STR55/STR57/STR56/STR54
(`docs/backlog.md`, mục Done/Declined). Các hệ còn lại của bee (#7-#10) chốt
hướng "giữ nguyên, chỉ tài liệu hoá ranh giới" — quyết định đầy đủ + bằng
chứng ở `docs/decisions/0017-dong-audit-he-id-ten-goi.md`.

## Bối cảnh (STR47)

> Audit thống nhất **loại-hình công việc** + **hệ đặt tên/đánh mã** đang chạy
> song song trong hệ thống — chưa có review nào gộp chung: (a) `kind`
> work-item; (b) nhiều hệ mã số tách biệt cùng sống mà chưa giải thích ranh
> giới ở một chỗ: P# tuần tự, D-hex, R#, C1-C9, cell-id `<feature>-N`; (c)
> tên feature kebab-case tự đặt tay.

`work.id` (#1) không nằm trong danh sách gốc của STR47 — phát hiện thêm trong
lúc thảo luận, gộp vào audit vì cùng loại vấn đề.

**Khung xét trọng số (thảo luận 2026-07-18):** decision `0004`
(`repo/docs/decisions/0004-pham-vi-va-non-goal.md`) đã khoá: fgOS chạy
**song song, không thay thế** harness phát triển (bee) cho tới khi chạm
"ngưỡng-có-tên". STR50 (`docs/backlog.md`) là chính bước mở ngưỡng đó — induct
skill-workflow của bee vào fgOS. Hệ quả: **hệ id của bee (#7-#10) là giàn
giáo TẠM THỜI** — dùng trong giai đoạn xây fgOS, không cần đầu tư sâu; **hệ
id của fgOS (#1-#6) là SẢN PHẨM VĨNH VIỄN**, và về sau chính fgOS (không cần
bee) sẽ phải tự sinh/tự đọc được các hệ này — đáng đầu tư kỹ hơn. Khung này
là căn cứ cho quyết định "giữ nguyên, chỉ tài liệu hoá" ở #7-#10 (xem §5).

## 1 · Bảng inventory (13 hệ — 6 của fgOS, 7 của bee)

### fgOS (sản phẩm — vĩnh viễn, đã migrate)

| # | Hệ | Định dạng ĐÃ SHIP | Migrate qua | Định nghĩa ở |
|---|---|---|---|---|
| 1 | `work.id` (Task — chính danh work item) | **`tsk-<hash>`** (gốc, chữ thường + gạch nối), **`tsk-<hash>-<n>`** (con, đệ quy theo lineage `parent`) — không còn slug title trong id | STR53 — done | `repo/src/intake/classify.mjs:115-128` (`generateId`), `repo/src/state/work.mjs:22` (`ID_PATTERN`), `repo/src/intake/decompose.mjs:245` (sinh id con) |
| 2 | `kind` work-item | enum tự do (bug/feature/chore/docs, mặc định `task`) | Không đổi | `repo/src/intake/classify.mjs:48-53,79-80` |
| 3 | `P<n>` → **Story** `STR<n>` (đổi tên khỏi "PBI") | `STR<n>` (vd `STR47`) | STR57 — done | `.claude/skills/bee-scribing/references/scribing-reference.md:293`; cột "Story" — `repo/docs/backlog.md` |
| 4 | ADR `NNNN-slug.md` | tên file đầy đủ giữ nguyên; trích dẫn rút gọn = `ADR<n>` (vd `ADR0013`), không bare số | STR55 — done | `repo/docs/decisions/0000-index.md:12-16` |
| 5 | `R#` business rule | `RUL<n>` (vd `RUL042`), không unique toàn cục — trích dẫn ngoài spec gốc kèm tên area (vd `RUL42 (runner)`) | STR56 — done (83 citation ở `runner.md`, 0 bare `R#` còn lại) | `repo/docs/specs/runner.md` |
| 6 | `C1`-`C9` contract | `CTR<n>` 3-digit zero-pad (vd `CTR009`) | STR54 — done, decision `ADR0015` | `repo/docs/architecture-map.md` §7 |

### bee (xưởng — giàn giáo tạm, giữ nguyên)

| # | Hệ | Định dạng hiện tại | Trạng thái | Định nghĩa ở |
|---|---|---|---|---|
| 7 | D-hex global (quyết định TOÀN XƯỞNG) | `randomUUID()`, trích 8-hex khi cite | ✅ Giữ nguyên — luật citation chốt tại §5 | `.bee/bin/lib/decisions.mjs:67,94,113` |
| 8 | `D<n>` local (quyết định CỤC BỘ 1 feature) | số nguyên nhỏ | ✅ Giữ nguyên — luật citation chốt tại §5 | `docs/history/<feature>/CONTEXT.md`, mẫu `.claude/skills/bee-exploring/references/context-template.md:4-6` |
| 9 | cell-id `<feature>-N` | quy ước, regex thật lỏng (`ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/`) | ✅ Giữ nguyên — convention-scoped, chưa từng va chạm thật | `.bee/bin/lib/cells.mjs:363` |
| 10 | feature slug (kebab) | free-text; unique tính bằng hiệu ứng phụ của `bee worktree new` (từ chối branch/dir đã tồn tại), không phải bằng format id | ✅ Giữ nguyên — cùng lý do #9 | `.bee/bin/lib/cells.mjs:594` (`FEATURE_SLUG_PATTERN`) |
| 11 | `P1`/`P2`/`P3` severity | enum 3 giá trị | ✅ Giữ nguyên — va chạm với #3 đã tự giải quyết vì #3 đổi thành `STR<n>` | `.claude/skills/bee-hive/templates/lib/command-registry.mjs:841` |
| 12 | Session id (đa phiên) | `randomUUID()` đầy đủ | ⏸ Không cần đổi — sổ sách vận hành thuần, không ai trích trong văn xuôi | `.bee/bin/lib/claims.mjs:78` (`createSession`) |
| 13 | Capture-stub id | `randomUUID()` đầy đủ | ⏸ Không cần đổi — cùng lý do #12 | `.bee/bin/lib/capture.mjs:64` |

## 1b · Chú giải tiền tố (prefix → chữ đầy đủ)

| Tiền tố | Chữ đầy đủ | #Hệ |
|---|---|---|
| `tsk-` | Task | 1 |
| `STR` | Story | 3 |
| `ADR` | Architecture Decision Record | 4 |
| `RUL` | Rule | 5 |
| `CTR` | Contract | 6 |

Tiền tố đã BAKE-IN type vào chính chuỗi id — tự khai type ở mọi nơi id
xuất hiện (chat, git diff, log), không phụ thuộc tầng hiển thị nhớ ghép nhãn
riêng (đúng lỗi mà bare `P<n>`/`R#`/`C#` cũ mắc phải). **Quy ước bổ sung cho
prose:** lần đầu nhắc 1 id trong một đoạn văn, viết kèm chữ đầy đủ — vd
"Story STR47", "Rule RUL42" — các lần nhắc sau trong cùng đoạn dùng tiền tố
đủ (không cần lặp chữ đầy đủ).

## 2 · Vì sao mỗi lựa chọn — 3 bằng chứng quyết định (không phải cảm tính)

- **`work.id` bỏ slug (#1):** `title` đã lưu sẵn thành field riêng, hiện lên
  ở mọi listing — id không cần lặp lại nó. Mẫu đã có sẵn trong hệ thống:
  Story/ADR/Rule đều tách "id ngắn" khỏi "mô tả dài" — `work.id` là hệ DUY
  NHẤT chưa theo mẫu đó (trước STR53).
- **Con dùng `tsk-<hash>-<n>`, không cần lo lệch dữ liệu:** field `parent`
  **KHÔNG nằm trong `EDITABLE_FIELDS`** (`src/state/store.mjs:184`: chỉ có
  `title, kind, risk, verify, tier, refs, deps`) — comment tại
  `store.mjs:232` xác nhận *"`parent` is NOT editable"*. Sinh 1 lần, không
  bao giờ đổi → nhét vào id con an toàn tuyệt đối, không có nguy cơ id nói
  một đằng, field nói một nẻo.
- **`tsk-` dùng CHUNG cho mọi `kind`, không tách `bug-<hash>`/`ftr-<hash>`...:**
  ngược lại với `parent`, **`kind` CÓ trong `EDITABLE_FIELDS`**
  (`store.mjs:184`) — sửa được qua `fgos edit`. Nếu tiền tố id mã hoá `kind`
  lúc tạo, sau khi `edit` đổi kind thì id nói dối vĩnh viễn (id bất biến,
  kind thì không). Cộng với decision `ADR0002` (mô hình phẳng — loại việc là 1
  field, không phải 1 shape id riêng) → `tsk-` phải đồng nhất.

## 3 · Nguyên tắc dùng khi cân nhắc đổi định dạng

Không phải hệ nào cũng cần tiền tố chữ riêng. Cần tiền tố tường minh khi id
bị trích dẫn rời khỏi ngữ cảnh gốc (không kèm file/cột) HOẶC hai hệ thật sự
trùng ký tự khi đọc cạnh nhau (đúng trường hợp #3 Story vs #11 severity —
đã xử bằng cách đổi #3 thành `STR<n>`).

## 4 · Trạng thái quyết định theo từng hệ (chốt — xem `docs/decisions/0017-dong-audit-he-id-ten-goi.md`)

| # | Hệ | Trạng thái |
|---|---|---|
| 1 | `work.id` → `tsk-<hash>` (+ `-<n>` con) | ✅ Đã migrate — STR53 |
| 2 | `kind` | ✅ Giữ nguyên |
| 3 | Story `P<n>` → `STR<n>` | ✅ Đã migrate — STR57 |
| 4 | ADR → `ADR<n>` khi rút gọn | ✅ Đã migrate — STR55 |
| 5 | `R#` → `RUL<n>` | ✅ Đã migrate — STR56 |
| 6 | `C#` → `CTR<n>` | ✅ Đã migrate — STR54, decision `ADR0015` |
| 7 | D-hex global | ✅ Giữ nguyên — luật citation §5 |
| 8 | `D<n>` local | ✅ Giữ nguyên — luật citation §5 |
| 9 | cell-id | ✅ Giữ nguyên |
| 10 | feature slug | ✅ Giữ nguyên |
| 11 | severity | ✅ Giữ nguyên |

Audit đóng: mọi row đã có trạng thái chốt, không còn row 🟡/⏸ chờ quyết
định. Quyết định + bằng chứng đầy đủ nằm ở `docs/decisions/0017-dong-audit-he-id-ten-goi.md`.

## 5 · #7 D-hex và #8 D-local — của lĩnh vực gì, ai dùng, và luật citation chốt

Cả hai đều là id của **1 câu quyết định** (không phải id của feature, PBI,
hay cell) — nhưng khác nhau ở **AI ghi / AI đọc / phạm vi bao xa**:

| | #8 D-local (`D<n>`) | #7 D-hex global |
|---|---|---|
| **Ghi khi nào** | Lúc bàn/khám phá **1 feature cụ thể** (bee-exploring), điền vào bảng "Locked Decisions" của CHÍNH file `CONTEXT.md` feature đó | Bất cứ lúc nào, bất cứ feature nào, bất cứ phase nào (explore/plan/execute/review) — qua lệnh `bee decisions log` |
| **Đọc bởi ai** | Chỉ người/agent làm TIẾP feature đó (cùng phiên hoặc phiên resume sau) — mở lại đúng file CONTEXT.md đó | Bất kỳ agent nào, feature KHÁC, sau này — tra cứu "chuyện này có ai quyết chưa" trên toàn xưởng |
| **Phạm vi** | 1 file duy nhất — không có sổ tra cứu chéo, không ai ngoài feature đó biết `D2` này là gì | Toàn bộ `.bee/decisions.jsonl` — sổ chung của cả xưởng, mọi feature cộng dồn vào 1 file |
| **Sống bao lâu** | Từ lúc feature mở tới lúc feature đóng (thực tế chỉ còn ý nghĩa trong lúc còn làm feature đó) | Vĩnh viễn, append-only, không xoá |
| **Ví dụ cụ thể** | "Lúc explore `work-graph-intelligence`, nhóm chốt D2: dùng typed-edge graph — chỉ ai đang làm feature này cần biết" | "Feature A (2026-07-10) chốt 'runner là người ghi duy nhất' — 2 tháng sau feature B không liên quan vẫn tra được câu này qua `.bee/decisions.jsonl` hoặc thấy trích trong 1 spec" |

Ẩn dụ ngắn: **D-local = sticky-note dán trong hồ sơ RIÊNG của 1 việc**
(không ai ngoài việc đó đọc); **D-hex = sổ nhật ký CHUNG của cả xưởng**
(ai cũng tra được, mọi việc đều ghi vào).

**ADR (#4) khác cả hai** — không phải "ai ghi lúc nào" mà là **bản tuyển
chọn tay**: 1 người (không phải máy) đọc lại D-hex, chọn RA những quyết định
product-facing đã chốt hẳn, viết lại thành văn xuôi chuẩn cho người NGOÀI
xưởng (không biết bee, không đọc được `.bee/`) hiểu được sản phẩm. Không
phải mọi D-hex đều thành ADR — `0000-index.md:40-64` liệt kê nhiều D-hex
"ngoài phạm vi" (không bao giờ lên ADR).

**Chốt (STR47, `docs/decisions/0017-dong-audit-he-id-ten-goi.md`):** #7 và #8 dùng chung chữ `D`
dù khác phạm vi — thay vì đổi tên (`L<n>`) hay bỏ hẳn bảng cục bộ, luật
được khoá là: **D-local KHÔNG BAO GIỜ được trích dẫn ngoài file `CONTEXT.md`
gốc của nó.** Chi phí migrate = 0 (không sửa `decisions.mjs`, không sửa
`CONTEXT.md` nào đang có); D-local vốn đã single-file trong thực tế, rủi ro
thật chỉ là kỷ luật trích dẫn — luật này đóng đúng rủi ro đó. Theo khung
§Bối-cảnh (bee = giàn giáo tạm), việc này không cần đầu tư sâu hơn.

## 6 · Câu hỏi đã đóng

Cả 5 câu hỏi mở của bản DRAFT 2026-07-18 đã chốt — xem `docs/decisions/0017-dong-audit-he-id-ten-goi.md` để có đầy đủ bằng chứng:

1. ~~`D<n>` local (#8) vs D-hex (#7) — chọn hướng nào?~~ → §5: luật citation, không rename.
2. ~~cell-id (#9) và feature slug (#10) — chưa bàn.~~ → §1, §4: giữ nguyên cả hai, convention-scoped đã đủ.
3. ~~Phụ lục boundary cuối cùng đặt ở đâu?~~ → `docs/architecture-map.md` (Phụ lục B), không phải `reading-map.md` (locator thuần, không host nội dung).
4. ~~`R#`→`RUL<n>` migration scope/sequencing?~~ → Moot — STR56 đã thi công xong.
5. ~~Đã đủ rõ để chuyển sang lập plan thi công chưa?~~ → Đã chuyển và đã xong: STR53/54/55/56/57/58 tất cả `done`.

---

Nguồn: `repo/docs/backlog.md` STR47 (+ STR53-STR58) + thảo luận 2026-07-18 +
đóng audit 2026-07-27 (`docs/decisions/0017-dong-audit-he-id-ten-goi.md`). Bằng chứng đọc trực
tiếp: `src/intake/classify.mjs`, `src/intake/decompose.mjs`,
`src/state/work.mjs`, `src/state/store.mjs`, `.bee/bin/lib/cells.mjs`,
`.bee/bin/lib/decisions.mjs`, `docs/architecture-map.md`,
`docs/specs/reading-map.md`, `docs/specs/runner.md`,
`docs/decisions/0000-index.md`, `docs/decisions/0004-pham-vi-va-non-goal.md`,
`.claude/skills/bee-*/references/*.md`, `.bee/decisions.jsonl`,
`.bee/backlog.jsonl`, và các `docs/history/*/CONTEXT.md` liên quan.
