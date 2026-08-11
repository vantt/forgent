# CONTEXT: tsk-tku — Skill chủ fgos-coding-discovering cho stage discovery

## Feature boundary

Trong phạm vi domain `coding`. Ba việc, đúng đề bài `DISCUSSION.md`
task 3 (`{#task-discovery-stage-owner}`):

1. **Tạo `fgos-coding-discovering`** (skill chủ mới, cả hai mirror
   `.claude/skills/` và `.agents/skills/`) — soi ambiguity từ những gì đã
   clarify, gọi helper `fgos-researching` bao nhiêu lần tuỳ nhu cầu (helper
   tự ghi `RESEARCH.md`), tự phán `clear`/`unclear`, tự gọi engine verb
   `fgos discover --verdict ...` để kết thúc stage — đúng định nghĩa "skill
   chủ" của D7 (mở file ra, có lệnh gọi `fgos <verb>` chuyển stage).
2. **Trỏ registry**: `skillMap.discovery` trong
   `src/state/workflow-stage-graphs.mjs` đổi từ `'fgos-researching'` sang
   `'fgos-coding-discovering'`.
3. **Gỡ khối ngoại lệ**: xoá toàn bộ section `## Discovery and exploring
   stages` (cùng red flag riêng của nó) khỏi
   `.claude/skills/fgos-coding-driving/SKILL.md` (và mirror
   `.agents/skills/`) — khối đó tồn tại vì `discovery` từng bị giao cho
   helper `fgos-researching` làm chủ tạm; có chủ thật (`fgos-coding-
   discovering` tự gọi `fgos discover`) thì driver quay lại đúng vòng lặp
   generic "invoke skill, nó tự gọi engine verb" không cần case đặc biệt
   nào — kể cả `exploring` (khối cũ tự nói "needs no special handling",
   phần đó cũng biến mất theo, không cần giữ lại riêng).

**Ngoài phạm vi (deferred, đã có chủ khác):** phán lại `tier`/`kind`/`risk`
trên bằng chứng research — đó là task 4 (`tsk-2yo`), KHÔNG phải task này
(D12; xác nhận lại ở `RESEARCH.md` round 3). Không sửa
`worker-prompt-discovery.txt` — prompt trỏ `{skillPath}` resolve qua
`skillForStage` nên tự theo registry mới, không cần đụng file đó (D17).
Không đụng `nextDiscoveryEdge`'s edge-selection theo verdict — đó là task 5
(`tsk-30v`); hôm nay verdict `clear` vẫn đi cạnh `discovery -> exploring`
sẵn có (xác nhận thực nghiệm: verdict `clear` vừa áp cho chính item này ở
vòng research trước đã đưa nó sang `exploring`, không nhảy thẳng
`planning`) — task này không cần sửa để verify của nó pass.

## Locked decisions

Không có D-ID mới cho riêng item này — mọi quyết định sản phẩm liên quan
đã chốt sẵn ở tầng shaping (`DISCUSSION.md` D4/D6/D7/D8/D9), không có bằng
chứng mới nào ở exploring pass này đủ material để mở lại. Trích dẫn lại
cho gọn (nguồn: `DISCUSSION.md` mục 4):

| D-ID | Quyết định (trích, xem DISCUSSION.md để đọc đủ) |
|------|-----------|
| D4 | `fgos-researching` là tool/helper, không phải stage. Gỡ đăng ký `skillMap.discovery` khỏi nó — file skill giữ nguyên, không xoá. |
| D6 | Stage `discovery` là pha máy-một-mình: soi ambiguity từ info đã clarify → gọi helper research → tự phán clear/unclear. |
| D7 | `discovery` cần skill chủ RIÊNG, không nâng `fgos-researching` lên làm chủ (nó được gọi từ nhiều nơi — vừa tool vừa chủ thì cùng file lúc ghi state lúc không tuỳ ai gọi). Định nghĩa "skill chủ": nằm trong `skillMap[stage]` VÀ tự gọi engine verb. |
| D8 | Tên: `fgos-coding-discovering`, không phải `fgos-discover` (khác engine verb `fgos discover` đúng một ký tự — gạch vs cách — rg khớp cả hai, agent sẽ nhầm hai thứ làm một). |
| D9 | Tiền tố domain `coding`, không phải `code` — literal của registry (`DOMAINS.coding`), suy ra cơ học từ `domain` field. |

## Pinned terms

- **"skill chủ" (stage owner)** — phép thử cơ học D7: mở file skill ra, có
  lệnh gọi `fgos <verb>` để chuyển `stage`/`status` của chính item không.
  Có → chủ. Không, chỉ trả verdict/finding về cho caller → helper.
  `fgos-coding-discovering` là chủ; `fgos-researching` vẫn là helper sau
  item này, không đổi vai trò.
- **"khối ngoại lệ" trong `fgos-coding-driving`** — section `##
  Discovery and exploring stages`: nó là triệu chứng của một stage
  (`discovery`) bị giao cho helper (`fgos-researching`) làm chủ tạm, đứng
  ngoài vòng lặp generic "invoke resolved skill, nó tự gọi engine verb".
  Có chủ thật rồi thì khối đó không còn lý do tồn tại — tự tan, không phải
  thay bằng một khối mới nói về `fgos-coding-discovering`.

## Scout evidence

- `src/state/workflow-stage-graphs.mjs:89` — `stages` domain `coding` đã
  đọc `['discovery', 'exploring', 'decompose', 'planning', 'executing']`
  (rename family task 1, `tsk-403`, đã delivered — xác nhận qua việc mọi
  skill khác đã mang tiền tố `coding-` trong `skillMap` hiện tại).
- `src/state/workflow-stage-graphs.mjs:212-219` — `skillMap.discovery`
  hôm nay vẫn là `'fgos-researching'` (đúng điểm cần sửa); mọi entry khác
  đã đổi tên (`fgos-coding-exploring`, `fgos-coding-planning`,
  `fgos-coding-implement`, `fgos-coding-compounding`).
- `bin/fgos.mjs:1183-1215`, `case 'discover':` — verb `fgos discover` đã
  domain-aware qua `discoverableStages(getDomain(...))` (tsk-4b2), nhận
  caller-supplied verdict qua `resolveDiscovery(dir, id, cfg, 'session',
  callerVerdict)`. Không cần sửa gì ở engine verb cho task này (khớp D17's
  "con 3 nhỏ hơn").
- `.claude/skills/fgos-coding-driving/SKILL.md` (đọc toàn văn trong phiên
  này) — section `## Discovery and exploring stages` còn nguyên, kèm red
  flag riêng của nó ("invoking `fgos-researching` at stage `discovery` and
  treating its returned verdict as informational..."). Đây chính là target
  literal của điều kiện verify thứ tư của item.
- `find .claude/skills`, `find .agents/skills` — cả hai mirror đã tồn tại
  song song cho mọi skill `fgos-coding-*` hiện có (vd. `fgos-coding-
  exploring` có mặt ở cả hai cây); `fgos-coding-discovering` cần dựng ở cả
  hai, đúng khuôn D15 đã áp cho lần rename trước.
- `rg -- "fgos-coding-discovering"` trên `src bin test docs
  dogfood-fixture` — chỉ khớp trong chính `DISCUSSION.md`/`RESEARCH.md`
  (tài liệu thiết kế); chưa có code/skill file thật nào tham chiếu tên
  này. Xác nhận đây là việc dựng mới, không phải sửa cái đã có.
- `impact-analysis` capability gate (`fgos tool query --capability
  impact-analysis --status present`): provider `gitnexus`, `status:
  "present"` → **full**. Ghi lại cho `fgos-coding-planning`/`fgos-coding-
  validating` đọc tiếp — 3 file cần sửa (`workflow-stage-graphs.mjs`,
  `fgos-coding-driving/SKILL.md` × 2 mirror) đều là registry/prose, không
  phải symbol code gọi qua call-graph, nên MUST-run-impact-trước-khi-sửa
  của `CLAUDE.md` áp dụng theo nghĩa nhẹ (không có "symbol" hàm để chạy
  `impact()` lên registry object literal/markdown prose) — việc chạy
  `detect_changes()` trước commit (bắt buộc không điều kiện) vẫn áp dụng
  đầy đủ.

## Canonical references

- `docs/history/discover-stage-graph-and-skill-layering/DISCUSSION.md`
  mục 4 (D4/D6/D7/D8/D9), mục 6 (thiết kế đã chốt — sơ đồ tầng gọi nhau),
  mục 7 task 3 (`{#task-discovery-stage-owner}`) — nguồn quyết định gốc.
- `docs/history/discover-stage-graph-and-skill-layering/RESEARCH.md`
  round 3 (2026-08-11, tsk-tku) — xác nhận lại prerequisite (`tsk-403`,
  `tsk-qod`) đã delivered thật trên đĩa, không chỉ đã quyết.
- Tiền lệ cùng cây: `tsk-qod` (đã delivered) — cùng khuôn "một skill chủ tự
  gọi engine verb thay vì để driver đặc cách", `tsk-403` — cùng khuôn
  "mirror `.claude/` + `.agents/`".

## Outstanding questions

None
