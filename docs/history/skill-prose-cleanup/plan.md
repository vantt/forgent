# Plan: Skill prose cleanup (tsk-56w)

Mode: **standard**

Lane quyết định bằng Mode-gate của `fgos-routing` (không có phiên Orient
riêng đưa lane sẵn — item đi thẳng shaping→exploring→planning, áp dụng
"Direct-entry fallback"). Đếm cờ áp dụng: **existing covered behavior**
(7 skill đang sửa là cơ chế lõi, được gọi mỗi phiên fgOS thật —
`test/skills/fgos-mirror.test.mjs` đã cover 1 phần), **weak proof around
the area** (D5 tự nhận verify+smoke-test chỉ chứng minh đường thuận,
không bắt được ca âm) → 2 cờ → **standard**. Không cờ hard-gate nào
(auth/data-loss/audit-security/external-provider/removing-validation) →
không phải `high-risk`. Không phải câu hỏi yes/no đơn lẻ → không phải
`spike`.

## Approach

**Đường đi chọn**: thực thi đúng theo thiết kế đã chốt ở
`DISCUSSION.md` §6 (7 skill tách SKILL.md/references theo chuẩn
skill-creator, boilerplate CLI-fallback gom `_shared/`, citation trần
xoá theo ranh giới D1) — không có đường khác được cân nhắc nghiêm túc,
vì toàn bộ round shaping (6 vòng, D1-D6) đã tự loại các phương án khác
(footnote, tách theo loại-ID thay vì vai-trò-artifact, chờ `tsk-5zi`
mới làm) ngay trong lúc thảo luận — không lặp lại ở đây.

**Risk map**:

| Phần | Rủi ro | Proof point (validating) |
|---|---|---|
| 6 skill core (driving/exploring/planning/validating/implement/fanout) | **Standard** — skill được `fgos-coding-driving`/mọi phiên coding gọi trực tiếp; sửa sai làm nghẽn toàn bộ vòng đời item | Smoke-test thật (D5) — item `chore` verify:"true", claim, đọc `.fgos/events.jsonl` kỳ vọng `attempts:1, errorClass:null` |
| `merge-loop` | Light — CLI-wrapper phụ, không nằm trên đường chính của mọi item | Cùng smoke-test, phạm vi hẹp hơn (chỉ ảnh hưởng `/fgOS:merge-loop`) |
| CLI-fallback dedupe (23 file) | Light — cơ học, không đổi hành vi, chỉ đổi cách trỏ | Verify: mỗi wrapper vẫn gọi đúng verb sau khi sửa |
| Citation cleanup còn lại (routing/approve/pick) | Light — dưới 300 dòng, không đổi cấu trúc | Verify grep-pattern D5 |

**Files chạm tới** (đủ cho 9 mảnh, không chồng lấn — xem Shape):
`.agents/skills/fgos-coding-{driving,exploring,planning,validating,
implement}/SKILL.md` (+ `references/*.md` mới), `.agents/skills/
fgos-fanout/SKILL.md` (+ `references/`), `.agents/skills/fgos-routing/
SKILL.md`, `plugins/fgOS/skills/{7 skill trên}/SKILL.md` (bản copy,
đồng bộ theo D1's yêu cầu byte-identical), `plugins/fgOS/skills/
merge-loop/SKILL.md` (+ `references/`), `plugins/fgOS/skills/_shared/
fgos-cli-fallback.md` (mới), `plugins/fgOS/skills/{answer,ask,approve,
check,cleanup-next,conflicts,discover,goal,graph,list,merge-list,
merge-next,move,pick,plan,ready,return,rollup,show,stale,submit,
triage,unlock}/SKILL.md` (23 file, chỉ đổi khối fallback).

**Thứ tự**: chạy `fgos graph --json` — `tsk-56w` không nằm trên
`criticalPath` hiện tại của repo, `--what-if` per-candidate không áp
dụng được vì 9 mảnh chưa phải item thật (chưa materialize). Tự kiểm
footprint 9 mảnh bên dưới: **không chồng lấn nhau** (mỗi mảnh chạm file
khác nhau hoàn toàn) → không có ràng buộc thứ tự bắt buộc, cả 9 chạy
song song được (đúng hình dạng `fgos-fanout` vốn xử lý tốt). Khuyến nghị
duy nhất không bắt buộc: 2 skill có pseudocode thật (driving/fanout) nên
cùng 1 người/phiên làm để giữ văn phong nhất quán (đã ghi ở DISCUSSION.md
§7), nhưng không phải dependency kỹ thuật.

**Impact-analysis posture**: `full` (GitNexus present, xem CONTEXT.md) —
không áp dụng trực tiếp cho proof point nào ở đây, vì cả 9 mảnh chỉ sửa
file `.md`, không đụng symbol code GitNexus index.

## Shape

9 mảnh độc lập, không mảnh nào cần tách nhỏ hơn — mỗi mảnh là 1 đơn vị
làm/verify/smoke-test trọn vẹn theo D5. Đặc tả đủ để `fgos-coding-validating`
materialize trực tiếp, không cần suy diễn thêm:

```json
[
  {
    "title": "fgos-coding-driving: tách SKILL.md/references, bỏ pseudocode, xoá citation trần",
    "verify": "npm test && test -f .agents/skills/fgos-coding-driving/SKILL.md && [ \"$(wc -l < .agents/skills/fgos-coding-driving/SKILL.md)\" -lt 300 ] && ls .agents/skills/fgos-coding-driving/references/*.md >/dev/null && ! rg --hidden -q '^loop:' .agents/skills/fgos-coding-driving/SKILL.md && ! rg --hidden -q '\\b(ADR|RUL|D)\\d{1,4}\\b|\\btsk-[0-9a-z]+(-[0-9]+)?\\b' .agents/skills/fgos-coding-driving/SKILL.md .agents/skills/fgos-coding-driving/references/*.md && diff -q .agents/skills/fgos-coding-driving/SKILL.md plugins/fgOS/skills/fgos-coding-driving/SKILL.md",
    "action": "D4: apply skill-creator SKILL.md<300+references split; D1: remove all governance-id citations at the .agents/skills source",
    "footprint": [".agents/skills/fgos-coding-driving/SKILL.md", ".agents/skills/fgos-coding-driving/references/", "plugins/fgOS/skills/fgos-coding-driving/SKILL.md"],
    "kind": "docs",
    "risk": "standard"
  },
  {
    "title": "fgos-fanout: tách SKILL.md/references, bỏ pseudocode, xoá citation trần",
    "verify": "npm test && test -f .agents/skills/fgos-fanout/SKILL.md && [ \"$(wc -l < .agents/skills/fgos-fanout/SKILL.md)\" -lt 300 ] && ls .agents/skills/fgos-fanout/references/*.md >/dev/null && ! rg --hidden -q '^loop:' .agents/skills/fgos-fanout/SKILL.md && ! rg --hidden -q '\\b(ADR|RUL|D)\\d{1,4}\\b|\\btsk-[0-9a-z]+(-[0-9]+)?\\b' .agents/skills/fgos-fanout/SKILL.md .agents/skills/fgos-fanout/references/*.md && diff -q .agents/skills/fgos-fanout/SKILL.md plugins/fgOS/skills/fgos-fanout/SKILL.md",
    "action": "D4: apply skill-creator SKILL.md<300+references split (content-type criterion, not length-conditional per DISCUSSION.md fanout-consistency fix); D1: remove all governance-id citations at source",
    "footprint": [".agents/skills/fgos-fanout/SKILL.md", ".agents/skills/fgos-fanout/references/", "plugins/fgOS/skills/fgos-fanout/SKILL.md"],
    "kind": "docs",
    "risk": "standard"
  },
  {
    "title": "fgos-coding-exploring: tách SKILL.md/references, xoá citation trần",
    "verify": "npm test && test -f .agents/skills/fgos-coding-exploring/SKILL.md && [ \"$(wc -l < .agents/skills/fgos-coding-exploring/SKILL.md)\" -lt 300 ] && ls .agents/skills/fgos-coding-exploring/references/*.md >/dev/null && ! rg --hidden -q '\\b(ADR|RUL|D)\\d{1,4}\\b|\\btsk-[0-9a-z]+(-[0-9]+)?\\b' .agents/skills/fgos-coding-exploring/SKILL.md .agents/skills/fgos-coding-exploring/references/*.md && diff -q .agents/skills/fgos-coding-exploring/SKILL.md plugins/fgOS/skills/fgos-coding-exploring/SKILL.md",
    "action": "D4: apply skill-creator SKILL.md<300+references split; D1: remove all governance-id citations at source",
    "footprint": [".agents/skills/fgos-coding-exploring/SKILL.md", ".agents/skills/fgos-coding-exploring/references/", "plugins/fgOS/skills/fgos-coding-exploring/SKILL.md"],
    "kind": "docs",
    "risk": "standard"
  },
  {
    "title": "fgos-coding-planning: tách SKILL.md/references, xoá citation trần",
    "verify": "npm test && test -f .agents/skills/fgos-coding-planning/SKILL.md && [ \"$(wc -l < .agents/skills/fgos-coding-planning/SKILL.md)\" -lt 300 ] && ls .agents/skills/fgos-coding-planning/references/*.md >/dev/null && ! rg --hidden -q '\\b(ADR|RUL|D)\\d{1,4}\\b|\\btsk-[0-9a-z]+(-[0-9]+)?\\b' .agents/skills/fgos-coding-planning/SKILL.md .agents/skills/fgos-coding-planning/references/*.md && diff -q .agents/skills/fgos-coding-planning/SKILL.md plugins/fgOS/skills/fgos-coding-planning/SKILL.md",
    "action": "D4: apply skill-creator SKILL.md<300+references split; D1: remove all governance-id citations at source",
    "footprint": [".agents/skills/fgos-coding-planning/SKILL.md", ".agents/skills/fgos-coding-planning/references/", "plugins/fgOS/skills/fgos-coding-planning/SKILL.md"],
    "kind": "docs",
    "risk": "standard"
  },
  {
    "title": "fgos-coding-validating: tách SKILL.md/references, xoá citation trần",
    "verify": "npm test && test -f .agents/skills/fgos-coding-validating/SKILL.md && [ \"$(wc -l < .agents/skills/fgos-coding-validating/SKILL.md)\" -lt 300 ] && ls .agents/skills/fgos-coding-validating/references/*.md >/dev/null && ! rg --hidden -q '\\b(ADR|RUL|D)\\d{1,4}\\b|\\btsk-[0-9a-z]+(-[0-9]+)?\\b' .agents/skills/fgos-coding-validating/SKILL.md .agents/skills/fgos-coding-validating/references/*.md && diff -q .agents/skills/fgos-coding-validating/SKILL.md plugins/fgOS/skills/fgos-coding-validating/SKILL.md",
    "action": "D4: apply skill-creator SKILL.md<300+references split; D1: remove all governance-id citations at source",
    "footprint": [".agents/skills/fgos-coding-validating/SKILL.md", ".agents/skills/fgos-coding-validating/references/", "plugins/fgOS/skills/fgos-coding-validating/SKILL.md"],
    "kind": "docs",
    "risk": "standard"
  },
  {
    "title": "fgos-coding-implement: tách SKILL.md/references (mẫu ck:cook), xoá citation trần",
    "verify": "npm test && test -f .agents/skills/fgos-coding-implement/SKILL.md && [ \"$(wc -l < .agents/skills/fgos-coding-implement/SKILL.md)\" -lt 300 ] && ls .agents/skills/fgos-coding-implement/references/*.md >/dev/null && ! rg --hidden -q '\\b(ADR|RUL|D)\\d{1,4}\\b|\\btsk-[0-9a-z]+(-[0-9]+)?\\b' .agents/skills/fgos-coding-implement/SKILL.md .agents/skills/fgos-coding-implement/references/*.md && diff -q .agents/skills/fgos-coding-implement/SKILL.md plugins/fgOS/skills/fgos-coding-implement/SKILL.md",
    "action": "D4: apply skill-creator SKILL.md<300+references split (ck:cook as concrete template per DISCUSSION.md); D1: remove all governance-id citations at source",
    "footprint": [".agents/skills/fgos-coding-implement/SKILL.md", ".agents/skills/fgos-coding-implement/references/", "plugins/fgOS/skills/fgos-coding-implement/SKILL.md"],
    "kind": "docs",
    "risk": "standard"
  },
  {
    "title": "merge-loop: tách SKILL.md/references, xoá citation trần",
    "verify": "test -f plugins/fgOS/skills/merge-loop/SKILL.md && [ \"$(wc -l < plugins/fgOS/skills/merge-loop/SKILL.md)\" -lt 300 ] && ls plugins/fgOS/skills/merge-loop/references/*.md >/dev/null && ! rg --hidden -q '\\b(ADR|RUL|D)\\d{1,4}\\b|\\btsk-[0-9a-z]+(-[0-9]+)?\\b' plugins/fgOS/skills/merge-loop/SKILL.md plugins/fgOS/skills/merge-loop/references/*.md",
    "action": "D4: apply skill-creator SKILL.md<300+references split",
    "footprint": ["plugins/fgOS/skills/merge-loop/SKILL.md", "plugins/fgOS/skills/merge-loop/references/"],
    "kind": "docs",
    "risk": "light"
  },
  {
    "title": "Gom khối \"fgos CLI fallback\" 23 skill-wrapper về _shared/",
    "verify": "test -f plugins/fgOS/skills/_shared/fgos-cli-fallback.md && for f in answer ask approve check cleanup-next conflicts discover goal graph list merge-list merge-next move pick plan ready return rollup show stale submit triage unlock; do rg --hidden -q '_shared/fgos-cli-fallback.md' \"plugins/fgOS/skills/$f/SKILL.md\" || exit 1; ! rg --hidden -q 'fgos CLI fallback \\(tsk-1no D3\\)' \"plugins/fgOS/skills/$f/SKILL.md\" || exit 1; done",
    "action": "D4: skill-creator's no-duplication rule (token-efficiency-criteria.md) applied repo-wide, not only the 7 oversized skills; precedent already established by _shared/citation-format.md (see DISCUSSION.md §3 mục 5)",
    "footprint": ["plugins/fgOS/skills/_shared/fgos-cli-fallback.md", "plugins/fgOS/skills/{answer,ask,approve,check,cleanup-next,conflicts,discover,goal,graph,list,merge-list,merge-next,move,pick,plan,ready,return,rollup,show,stale,submit,triage,unlock}/SKILL.md"],
    "kind": "docs",
    "risk": "light"
  },
  {
    "title": "Dọn citation trần còn lại: fgos-routing, approve, pick",
    "verify": "! rg --hidden -q '\\b(ADR|RUL|D)\\d{1,4}\\b|\\btsk-[0-9a-z]+(-[0-9]+)?\\b' .agents/skills/fgos-routing/SKILL.md plugins/fgOS/skills/approve/SKILL.md plugins/fgOS/skills/pick/SKILL.md && diff -q .agents/skills/fgos-routing/SKILL.md plugins/fgOS/skills/fgos-routing/SKILL.md",
    "action": "D1: remove all governance-id citations at the .agents/skills source (and the plugins-only wrapper skills it does not mirror)",
    "footprint": [".agents/skills/fgos-routing/SKILL.md", "plugins/fgOS/skills/fgos-routing/SKILL.md", "plugins/fgOS/skills/approve/SKILL.md", "plugins/fgOS/skills/pick/SKILL.md"],
    "kind": "docs",
    "risk": "light"
  }
]
```

**Assumptions** (không material, không cần hand-back exploring):
- Tên file cụ thể trong `references/*.md` (vd `loop-mechanics.md`,
  `reclaim-and-role-graph.md`) là chi tiết implementer tự đặt theo ranh
  giới logic thật của từng skill khi viết, không cố định trước ở đây —
  DISCUSSION.md §7 đã gợi ý nhưng không khoá tên chính xác.
- Audit frontmatter `description` (chuẩn `metadata-quality-criteria.md`)
  gộp vào bước Orient của chính `fgos-coding-exploring`/việc đọc file khi
  implementer mở từng skill ra sửa — không phải bước verify riêng, vì
  không có cách kiểm máy "description có đủ trigger cụ thể" (thuộc loại
  review người, giống ranh giới D5 đã vạch cho "content coherence").
- Mảnh #7 (CLI-fallback dedupe) trích D4 cho phần "no duplication" dù D4
  gốc khoanh vùng 7 skill vượt 300 dòng — nguyên tắc no-duplication của
  `skill-creator` áp dụng chung, không riêng nhóm đó; ghi rõ đường nối ở
  đây để không phải một trích dẫn D-ID gán ép.

## Outstanding questions

None
