---
title: Audit loại-hình công việc & hệ đặt tên/đánh mã (P47)
status: DRAFT — nhiều hệ đã chốt hướng, #7/#8/#9/#10 còn mở
updated: 2026-07-18
kind: audit-draft
---

# Audit: loại-hình công việc + hệ đặt tên/đánh mã

**DRAFT.** Tài liệu này trả lời `docs/backlog.md` P47. Bảng inventory trích
thẳng từ code/docs thật (file:line), không suy đoán. §4 ghi nhận trạng thái
quyết định theo từng hệ — **ghi nhận trước, điều chỉnh sau**: các hướng đã
chốt (✅) vẫn CHƯA áp dụng vào `runner.md`/`architecture-map.md`/
`classify.mjs`/… — đây là bước ghi lại hướng, migration thật là 1 plan thi
công riêng sau khi chốt hết.

## Bối cảnh (P47)

> Audit thống nhất **loại-hình công việc** + **hệ đặt tên/đánh mã** đang chạy
> song song trong hệ thống — chưa có review nào gộp chung: (a) `kind`
> work-item; (b) nhiều hệ mã số tách biệt cùng sống mà chưa giải thích ranh
> giới ở một chỗ: P# tuần tự, D-hex, R#, C1-C9, cell-id `<feature>-N`; (c)
> tên feature kebab-case tự đặt tay.

`work.id` (#1) không nằm trong danh sách gốc của P47 — phát hiện thêm trong
lúc thảo luận, gộp vào audit vì cùng loại vấn đề.

**Khung xét trọng số (thảo luận 2026-07-18):** decision `0004`
(`repo/docs/decisions/0004-pham-vi-va-non-goal.md`) đã khoá: fgOS chạy
**song song, không thay thế** harness phát triển (bee) cho tới khi chạm
"ngưỡng-có-tên". P50 (`docs/backlog.md`) là chính bước mở ngưỡng đó — induct
skill-workflow của bee vào fgOS. Hệ quả: **hệ id của bee (#7-#10) là giàn
giáo TẠM THỜI** — dùng trong giai đoạn xây fgOS, không cần đầu tư sâu; **hệ
id của fgOS (#1-#6) là SẢN PHẨM VĨNH VIỄN**, và về sau chính fgOS (không cần
bee) sẽ phải tự sinh/tự đọc được các hệ này — đáng đầu tư kỹ hơn.

## 1 · Bảng inventory (13 hệ — 6 của fgOS, 7 của bee)

### fgOS (sản phẩm — vĩnh viễn)

| # | Hệ | Định dạng hiện tại | Định dạng đã chốt hướng | Định nghĩa ở |
|---|---|---|---|---|
| 1 | `work.id` (Task — chính danh work item) | `slugify(title,≤40)` + `-` + hash 3-8 ký tự | **`TSK<hash>`** (gốc), **`TSK<hash>-<n>`** (con, đệ quy theo lineage `parent`) — bỏ hẳn slug title khỏi id; muốn dễ hiểu thì ghép slug(title) lúc HIỂN THỊ/TRÍCH DẪN, không lưu vào id | `repo/src/intake/classify.mjs:124` (`generateId`), `repo/src/state/work.mjs:22` (`ID_PATTERN`), `repo/src/intake/decompose.mjs:245` (sinh id con) |
| 2 | `kind` work-item | enum tự do (bug/feature/chore/docs, mặc định `task`) | Không đổi | `repo/src/intake/classify.mjs:48-53,79-80` |
| 3 | `P<n>` **Story** (đổi tên khỏi "PBI") | số nguyên tuần tự | **`STR<n>`** (vd `STR47`) | `.claude/skills/bee-scribing/references/scribing-reference.md:293`; cột "Story" — `repo/docs/backlog.md:3` |
| 4 | ADR `NNNN-slug.md` | số nguyên 4-digit zero-pad + slug | Không đổi dạng đầy đủ; dạng rút gọn = **`ADR<n>`** (vd `ADR0013`), không bare số | `repo/docs/decisions/0000-index.md:12-16` |
| 5 | `R#` business rule | số nguyên tuần tự, phạm vi 1 spec file | **`RUL<n>`** (vd `RUL042`) | `repo/docs/specs/runner.md:698` |
| 6 | `C1`-`C9` contract | ID cố định, 1 bảng | **`CTR<n>`** (vd `CTR009`) | `repo/docs/architecture-map.md` §7, `:330-340` |

### bee (xưởng — giàn giáo tạm)

| # | Hệ | Định dạng hiện tại | Trạng thái | Định nghĩa ở |
|---|---|---|---|---|
| 7 | D-hex global (quyết định TOÀN XƯỞNG) | `randomUUID()`, trích 8-hex khi cite | 🟡 Còn mở — xem §5 | `.bee/bin/lib/decisions.mjs:67,94,113` |
| 8 | `D<n>` local (quyết định CỤC BỘ 1 feature) | số nguyên nhỏ | 🟡 Còn mở — xem §5 | `docs/history/<feature>/CONTEXT.md`, mẫu `.claude/skills/bee-exploring/references/context-template.md:4-6` |
| 9 | cell-id `<feature>-N` | quy ước, regex thật lỏng hơn | ⏸ Để sau | `.bee/bin/lib/cells.mjs:33` |
| 10 | feature slug (kebab) | free-text, không generator | ⏸ Để sau | `.claude/skills/bee-hive/templates/lib/state.mjs:1202-1208` |
| 11 | `P1`/`P2`/`P3` severity | enum 3 giá trị | ✅ Giữ nguyên — va chạm với #3 đã tự giải quyết vì #3 đổi thành `STR<n>` | `.claude/skills/bee-hive/templates/lib/command-registry.mjs:841` |
| 12 | Session id (đa phiên) | `randomUUID()` đầy đủ | ⏸ Không cần đổi — sổ sách vận hành thuần, không ai trích trong văn xuôi | `.bee/bin/lib/claims.mjs:78` (`createSession`) |
| 13 | Capture-stub id | `randomUUID()` đầy đủ | ⏸ Không cần đổi — cùng lý do #12 | `.bee/bin/lib/capture.mjs:64` |

## 1b · Chú giải tiền tố (prefix → chữ đầy đủ)

| Tiền tố | Chữ đầy đủ | #Hệ |
|---|---|---|
| `TSK` | Task | 1 |
| `STR` | Story | 3 |
| `ADR` | Architecture Decision Record | 4 |
| `RUL` | Rule | 5 |
| `CTR` | Contract | 6 |

Tiền tố 3 chữ đã BAKE-IN type vào chính chuỗi id — tự khai type ở mọi nơi id
xuất hiện (chat, git diff, log), không phụ thuộc tầng hiển thị nhớ ghép nhãn
riêng (đúng lỗi mà bare `P<n>`/`R#`/`C#` cũ mắc phải). **Quy ước bổ sung cho
prose:** lần đầu nhắc 1 id trong một đoạn văn, viết kèm chữ đầy đủ — vd
"Story STR47", "Rule RUL42" — các lần nhắc sau trong cùng đoạn dùng tiền tố
đủ (không cần lặp chữ đầy đủ).

## 2 · Vì sao mỗi lựa chọn — 3 bằng chứng quyết định (không phải cảm tính)

- **`work.id` bỏ slug (#1):** `title` đã lưu sẵn thành field riêng, hiện lên
  ở mọi listing — id không cần lặp lại nó. Mẫu đã có sẵn trong hệ thống:
  Story/ADR/Rule đều tách "id ngắn" khỏi "mô tả dài" — `work.id` là hệ DUY
  NHẤT chưa theo mẫu đó.
- **Con dùng `TSK<hash>-<n>`, không cần lo lệch dữ liệu:** field `parent`
  **KHÔNG nằm trong `EDITABLE_FIELDS`** (`src/state/store.mjs:184`: chỉ có
  `title, kind, risk, verify, tier, refs, deps`) — comment tại
  `store.mjs:232` xác nhận *"`parent` is NOT editable"*. Sinh 1 lần, không
  bao giờ đổi → nhét vào id con an toàn tuyệt đối, không có nguy cơ id nói
  một đằng, field nói một nẻo.
- **`TSK` dùng CHUNG cho mọi `kind`, không tách `BUG<hash>`/`FTR<hash>`...:**
  ngược lại với `parent`, **`kind` CÓ trong `EDITABLE_FIELDS`**
  (`store.mjs:184`) — sửa được qua `fgos edit`. Nếu tiền tố id mã hoá `kind`
  lúc tạo, sau khi `edit` đổi kind thì id nói dối vĩnh viễn (id bất biến,
  kind thì không). Cộng với decision `ADR0002` (mô hình phẳng — loại việc là 1
  field, không phải 1 shape id riêng) → `TSK` phải đồng nhất.

## 3 · Nguyên tắc dùng khi cân nhắc đổi định dạng

Không phải hệ nào cũng cần tiền tố chữ riêng. Cần tiền tố tường minh khi id
bị trích dẫn rời khỏi ngữ cảnh gốc (không kèm file/cột) HOẶC hai hệ thật sự
trùng ký tự khi đọc cạnh nhau (đúng trường hợp #3 Story vs #11 severity —
đã xử bằng cách đổi #3 thành `STR<n>`).

## 4 · Trạng thái quyết định theo từng hệ

| # | Hệ | Trạng thái |
|---|---|---|
| 1 | `work.id` → `TSK<hash>` (+ `-<n>` con) | ✅ Đã chốt hướng |
| 2 | `kind` | ✅ Giữ nguyên |
| 3 | Story `P<n>` → `STR<n>` | ✅ Đã chốt hướng |
| 4 | ADR → `ADR<n>` khi rút gọn | ✅ Đã chốt |
| 5 | `R#` → `RUL<n>` | ✅ Đã chốt hướng (chưa migrate) |
| 6 | `C#` → `CTR<n>` | ✅ Đã migrate (P54, 2026-07-18) — `CTR001`-`CTR009`, decision `ADR0015` |
| 7 | D-hex global | 🟡 Còn mở — xem §5 |
| 8 | `D<n>` local | 🟡 Còn mở — xem §5 |
| 9 | cell-id | ⏸ Để sau |
| 10 | feature slug | ⏸ Để sau |
| 11 | severity | ✅ Giữ nguyên |

**Chưa áp dụng gì vào code/docs thật** — bảng trên là hướng đã chốt trong
bàn luận, chưa phải lệnh thi hành.

## 5 · #7 D-hex và #8 D-local — của lĩnh vực gì, ai dùng

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

**Xung đột hình dạng còn treo:** #7 và #8 dùng CHUNG chữ `D` dù khác phạm vi
— đọc "per D2" một mình, không biết trước ngữ cảnh thì không phân biệt được
với D-hex. 3 hướng gợi ý (chưa chọn): đổi D-local → `L<n>`; hoặc bỏ hẳn bảng
cục bộ, ghi thẳng qua D-hex; hoặc khoá luật "D-local không bao giờ cite
ngoài file gốc". Theo khung §Bối-cảnh (bee = giàn giáo tạm), việc này không
cần đầu tư sâu — chỉ cần đủ rõ để không nhầm trong lúc bee còn sống.

## 6 · Câu hỏi còn mở

1. `D<n>` local (#8) vs D-hex (#7) — chọn hướng nào trong 3 gợi ý ở §5?
2. cell-id (#9) và feature slug (#10) — chưa bàn.
3. Phụ lục boundary cuối cùng (sau khi chốt hết) đặt ở `architecture-map.md`
   hay `reading-map.md`, hay cả hai?
4. `R#`→`RUL<n>` và `C#`→`CTR<n>` là migration có quy mô (R1-R45 trong 5
   spec file, C1-C9 rải khắp `architecture-map.md` + mermaid + docs khác) —
   cần liệt kê hết call site trước khi đổi.
5. `work.id`/Story/ADR-ngắn/RUL/CTR đã đủ rõ để chuyển sang lập plan thi
   công (code + migration thật) chưa, hay còn muốn bàn thêm?

---

Nguồn: `repo/docs/backlog.md` P47 + thảo luận 2026-07-18. Bằng chứng đọc
trực tiếp: `src/intake/classify.mjs`, `src/intake/decompose.mjs`,
`src/state/work.mjs`, `src/state/store.mjs`, `.bee/bin/lib/cells.mjs`,
`.bee/bin/lib/decisions.mjs`, `docs/architecture-map.md`,
`docs/specs/reading-map.md`, `docs/decisions/0000-index.md`,
`docs/decisions/0004-pham-vi-va-non-goal.md`,
`.claude/skills/bee-*/references/*.md`, `.bee/decisions.jsonl`,
`.bee/backlog.jsonl`, `.fgos/events.jsonl`, và các
`docs/history/*/CONTEXT.md` liên quan.
