# PLAN: Chống outdate/mâu thuẫn giữa rule, decision, doc (tsk-1lv)

Mode: **high-risk**

Lý do (đếm cờ theo `fgos-routing`'s Mode-gate, mechanical không phải cảm
tính): **4 cờ áp dụng** — (1) *data model*: đổi schema `state.decisions`
(thêm `scope`/`area`, D4) và `docs/decisions/*.md` corpus (retire, D5); (2)
*public contracts*: `fgos decision` CLI verb thêm `--relation` bắt buộc
(D2/D8) — thay đổi hợp đồng CLI mọi project dùng fgOS đang gọi (D1: năng
lực chung, không chỉ dogfood); (3) *existing covered behavior*: đổi hành vi
`fgos-coding-compounding` (luật cấm prune hiện tại, D6), `check-decision-
citation-drift.mjs`/`check-decision-supersession.mjs` (từ detection-only
sang write-time), `fgos approve`/`retrospective` (D7); (4) *weak proof
around the area*: GitNexus `present` nhưng hook báo index stale (xem dưới)
— blast-radius chưa xác nhận tươi cho `src/state/store.mjs`. 4 cờ ≥ 4 →
**high-risk** theo bảng ngưỡng, không cần cờ hard-gate nào khác để xác nhận
mức này.

## Bootstrap

- `docsRef` đã có sẵn (`docs/history/canonical-decision-projection/`, đặt
  bởi `fgos-coding-exploring`) — không cần đăng ký lại.
- `holder` không set trên item (không có `roleGraph` áp dụng) — không cần
  reclaim.
- Không có `Mode:` ghi sẵn từ vòng trước (item vào thẳng qua native-first
  dispatch từ `fgos-coding-shaping` → `fgos-coding-exploring`, không qua
  `fgos-routing`'s Orient) — áp trực tiếp Mode-gate của `fgos-routing`
  (fallback case 3, tsk-da1) như tính ở trên.
- Impact-analysis capability gate (`fgos tool query --capability
  impact-analysis --status present`, chạy lại ở `fgos-coding-exploring`):
  GitNexus `present`, nhưng hook runtime báo "GitNexus index is stale (last
  indexed: 7bb3231)" suốt phiên này — đọc là **degraded** theo CLAUDE.md's
  3 mức (`present` không đảm bảo index tươi). Mọi proof point bên dưới cần
  blast-radius từ GitNexus được đánh dấu YẾU, cần cross-check `rg` tay
  trước khi tin, không tự động full.

## Approach

Toàn bộ path/alternative/risk đã được cân nhắc kỹ trong 16 round thảo luận
tại `docs/history/canonical-decision-projection/DISCUSSION.md` — plan.md
này ĐÚC KẾT, không lặp lại lý do đầy đủ. Hướng đã chọn: nâng cấp cơ chế
sẵn có của fgOS (event-sourced `state.decisions`, 2 script detection-only,
`retrospective`/`fgos-coding-compounding`) thay vì xây mới — D2/D3 cấm
tường minh việc xây store/graph/daemon song song. Alternative bị loại: xây
knowledge-graph riêng (round 2, sửa lại round 3 sau khi đọc bee's R9 "no
stored graph, no daemon"); gate ở `fgos approve` (round 3-4, sửa lại round
10-11 vì mâu thuẫn tsk-1ca's evidence-hoá 3 lần); semantic search cho
tìm-trước-khi-tạo (round 14, loại theo YAGNI + bee's own chosen limit).

`fgos graph --json` đã chạy (816 node, 449 component) — `tsk-1lv` hiện là
component riêng (size 1, không `deps`), nên `criticalPath`/`topUnblock`
CHƯA có tín hiệu dùng được cho việc sắp thứ tự 6 mảnh bên dưới (đúng như kỳ
vọng — graph metrics có ý nghĩa nhất SAU khi con thật tồn tại, `--what-if`
áp cho con lúc `fgos-coding-validating` cân nhắc thứ tự materialize thật).
Thứ tự dưới đây suy ra từ chuỗi phụ thuộc DỮ LIỆU thật (field nào cần tồn
tại trước field khác dùng được), không phải suy đoán.

### Risk map

**Đã qua 1 vòng review độc lập (opus code-reviewer subagent, đọc trực tiếp
DISCUSSION.md/CONTEXT.md/plan.md, tự re-verify claim thay vì tin theo tóm
tắt) trước khi materialize — 8 lỗi cơ học tìm thấy và đã sửa ngay dưới đây
(footprint thiếu file thật, risk-tier lệch giữa map và JSON, 2 mảnh tưởng
độc lập nhưng đụng cùng file), cộng 1 điểm cần người dùng quyết (xem cuối
file). Đã tự re-verify 3 claim nặng nhất bằng grep trực tiếp:
`src/runner/merge.mjs:393-394` hardcode `DECISION_INDEX_PATH`/
`DECISION_FILE_RE`; `check-decision-supersession.mjs:136` throw cứng nếu
thiếu `0000-index.md`; `test/skills/fgos-mirror.test.mjs` enforce
byte-identical giữa `.agents/skills/`↔`plugins/fgOS/skills/`.**

| Mảnh | Rủi ro | Vì sao | Proof point cần ở `fgos-coding-validating` |
|---|---|---|---|
| 1. decision-relation-and-sweep | Cao | Đổi CLI contract (`--relation` bắt buộc) — mọi caller hiện có của `fgos decision` (mọi skill + mọi project dùng fgOS, D1) phải cập nhật, breaking nếu không backward-compat. Sweep phải quét `docs/**`+`src/**`+`plugins/**` (đúng D2's "sweep docs/**"), KHÔNG chỉ `docs/backlog.md`+`docs/specs/*.md` như `check-decision-citation-drift.mjs` hiện đang quét — review tìm ra 32 hit thật trong `docs/enduser-docs-index.json` nằm NGOÀI phạm vi quét hiện tại | Chạy thử `fgos decision` không `--relation`, xác nhận refuse đúng thông báo; kiểm đếm caller hiện có (6 skill: discovering/exploring/planning/shaping/validating/coding-shape-distill+merge-loop, đã grep xác nhận) trước khi khoá breaking; xác nhận sweep mới bắt được ≥1 case thật ngoài phạm vi cũ |
| 2. scope-field-and-index-generate | Vừa | Thêm field mới, không đổi field cũ — ít rủi ro ngược tương thích hơn mảnh 1. `docs/decisions/` VẪN LÀ MỘT THƯ MỤC sau feature này, chỉ còn chứa `index.md` generate-được (mirror bee's "standing exemption" cho `docs/decisions/index.md` — path/owner/shape giữ nguyên) | Generate thử `docs/decisions/index.md` từ `state.decisions` hiện có, `--check` xác nhận byte-stable; round-trip thật qua `addDecision` (`src/state/store.mjs:1123`) xác nhận field `scope` ghi/đọc đúng, không chỉ test index tĩnh |
| 3. context-md-render | Vừa | Đổi convention authoring của CONTEXT.md — ảnh hưởng MỌI skill đang ghi CONTEXT.md (exploring/planning/shaping, không chỉ exploring) VÀ `src/intake/plan.mjs`'s literal-regex slice trên heading "## Locked decisions" (đã có `scripts/check-locked-decisions-heading-drift.mjs` canh riêng) | Render thử 1 CONTEXT.md thật (chính `tsk-1lv`) từ `state.decisions`, đối chiếu tay với bảng D1-D14 đã viết; xác nhận heading/table shape không đổi |
| 4. retire-decisions-corpus | Cao | Xoá/di chuyển 35 file đang được cite RỘNG hơn ban đầu tưởng — không chỉ `docs/backlog.md`/`docs/specs/*.md`, còn `src/runner/merge.mjs` (hardcode collision-resolve subsystem ~250 dòng), `check-decision-supersession.mjs` (throw cứng nếu thiếu `0000-index.md`) | Chạy `check-decision-citation-drift.mjs` (đã nâng cấp phạm vi quét ở mảnh 1) trên TOÀN repo SAU migrate, xác nhận 0 dangling reference — proof này giờ mới thật sự đáng tin vì phạm vi quét đã mở rộng đúng |
| 5. four-door-in-retrospective | Vừa | Thêm check mới vào batch loop hiện có (`bin/fgos.mjs`'s `retrospective` verb, dòng 1438 — xác nhận thật) — rủi ro chính là false-positive chặn nhầm item vô tội. KHÔNG chạm `fgos-coding-compounding/SKILL.md` (door là harness-only, không phải doctrine agent đọc — sửa lại từ bản trước, tránh đụng mảnh 6) | Chạy `/fgOS:retro-loop` thật trên ≥1 item test có D-ID chưa route, xác nhận đúng 1 finding, không báo thừa trên item sạch |
| 6. compounding-anti-fork | Thấp | Độc lập THẬT (sau khi bỏ overlap với mảnh 5) — chỉ thêm field + check mới, không đổi hành vi ghi hiện có ngoài việc BỎ luật cấm prune | Case thật: 2 capture cùng chủ đề khác tên → hội tụ 1 file; 1 capture phủ định capture cũ → sửa được đoạn cũ |

Mảnh 4 (Cao) là proof point nặng nhất trong high-risk lane này — cần
`fgos-coding-validating` xác nhận thật trước khi materialize, không chỉ
"trust design".

## Shape

**Split — 6 mảnh độc lập-workable**, không phải 1 việc. Lý do split (không
phải 1 piece đủ trung thực): 6 mảnh chạm 4 vùng code khác nhau (CLI verb
contract, report/generator layer, skill-prose doctrine, batch-loop harness)
với 2 chuỗi phụ thuộc dữ liệu rõ ràng và 1 nhánh độc lập hoàn toàn (mảnh
6) — gộp thành 1 item sẽ ép `fgos-coding-validating` phải chứng minh feasibility
cho cả 4 vùng cùng lúc, trong khi mảnh 6 không cần chờ 5 mảnh kia.

Thứ tự phụ thuộc dữ liệu thật:
- Mảnh 1 → Mảnh 2 (field `scope` cần schema `--relation` đã ổn định trước
  khi index group theo nó có ý nghĩa)
- Mảnh 1 → Mảnh 3 (CONTEXT.md render cần field ghi ổn định trước khi đổi
  convention đọc)
- Mảnh 2 → Mảnh 4 (migrate corpus cần field `scope` tồn tại để gắn vào
  record ngắn thay thế)
- Mảnh 1 + Mảnh 4 → Mảnh 5 (routing/impact door cần biết đích cite thật —
  `docs/specs/` sau khi mảnh 4 xong, không phải `docs/decisions/` cũ)
- Mảnh 6 — độc lập hoàn toàn, chạy song song bất kỳ lúc nào

## Outstanding questions

None

## Split children

```json
[
  {
    "title": "fgos decision requires --relation, write-time citation sweep on supersede (widened scan scope)",
    "verify": "node --test test/state/decision-relation.test.mjs",
    "action": "D2: consistency derive tai thoi diem ghi (write-time sweep qua docs/**+src/**+plugins/**, khong chi docs/backlog.md+docs/specs/*.md nhu hien tai), khong phai graph luu tru song song; D3: khong xay decision-store moi, nang cap store hien co",
    "footprint": ["bin/fgos.mjs", "src/state/store.mjs", "scripts/check-decision-citation-drift.mjs", "scripts/check-decision-supersession.mjs", "test/state/decision-relation.test.mjs"],
    "kind": "task",
    "risk": "heavy",
    "deps": []
  },
  {
    "title": "Add scope/area field to state.decisions, generate docs/decisions/index.md with --check (directory persists, only index.md, mirrors merge.mjs collision-resolve subsystem)",
    "verify": "node --test test/report/decision-index.test.mjs test/state/decision-scope-field.test.mjs test/runner/merge.test.mjs",
    "action": "D4: 3 loai quyet dinh goc map vao state.decisions, quyet dinh platform-level can them field moi scope/area. docs/decisions/ van la thu muc, chi con index.md generate-duoc (mirror bee's standing exemption)",
    "footprint": ["src/state/store.mjs", "src/report/decision-index.mjs", "docs/decisions/index.md", "src/runner/merge.mjs", "scripts/check-decision-supersession.mjs", "test/report/decision-index.test.mjs", "test/state/decision-scope-field.test.mjs", "test/runner/merge.test.mjs", "test/cli/fgos-merge.test.mjs"],
    "kind": "task",
    "risk": "standard",
    "deps": [0]
  },
  {
    "title": "CONTEXT.md Locked-Decisions table renders from state.decisions instead of hand-typed prose (exploring/planning/shaping)",
    "verify": "node --test test/report/context-render.test.mjs",
    "action": "D3: wire be mat doc (CONTEXT.md) vao state.decisions da co san, dong khoang trong tsk-1ud de lai. Ap dung ca 3 skill dang ghi CONTEXT.md: exploring/planning/shaping, khong chi exploring",
    "footprint": [".agents/skills/fgos-coding-exploring/SKILL.md", ".agents/skills/fgos-coding-planning/SKILL.md", ".agents/skills/fgos-coding-shaping/SKILL.md", "plugins/fgOS/skills/fgos-coding-exploring/SKILL.md", "plugins/fgOS/skills/fgos-coding-planning/SKILL.md", "plugins/fgOS/skills/fgos-coding-shaping/SKILL.md", "src/report/context-render.mjs", "src/intake/plan.mjs", "test/report/context-render.test.mjs"],
    "kind": "task",
    "risk": "standard",
    "deps": [0]
  },
  {
    "title": "Retire docs/decisions/*.md corpus into docs/specs/<area>.md narrative + state.decisions short records (directory persists with index.md only)",
    "verify": "node --test test/docs/decisions-corpus-retired.test.mjs",
    "action": "D5: retire docs/decisions/*.md corpus (35 file nguoi-quyet-dinh), narrative don vao docs/specs/<area>.md, state.decisions giu record ngan lam nguon that. docs/decisions/ giu lai la thu muc, chi con index.md",
    "footprint": ["docs/decisions", "docs/specs", "src/runner/merge.mjs", "scripts/check-decision-citation-drift.mjs", "scripts/check-decision-supersession.mjs", "test/docs/decisions-corpus-retired.test.mjs"],
    "kind": "task",
    "risk": "heavy",
    "deps": [0, 1]
  },
  {
    "title": "4-door check (freshness/impact/routing/doc-deferral) inside retrospective batch loop -- harness-only, no skill-prose touch",
    "verify": "node --test test/state/retrospective-doors.test.mjs",
    "action": "D7: 4-door check chay ben trong loi goi hien co cua retrospective (bin/fgos.mjs case 'retrospective', dong 1438), khong gate fgos approve; D9: nhan mang 2+4 tu tsk-37i; D11: door ap moi item khong theo risk-tier",
    "footprint": ["bin/fgos.mjs", "src/state/retrospective-doors.mjs", "test/state/retrospective-doors.test.mjs"],
    "kind": "task",
    "risk": "standard",
    "deps": [0, 3]
  },
  {
    "title": "authoritative_for field + skeleton-match port/adapter + allow reconcile in fgos-coding-compounding",
    "verify": "node --test test/report/authoritative-match.test.mjs",
    "action": "D6: cho phep reconcile/retire prose cu; D8: tim-truoc-khi-tao = doctrine + harness backstop, khong phai gate song; D12: skeleton-match qua port/adapter mirror CTR009",
    "footprint": [".agents/skills/fgos-coding-compounding/SKILL.md", "plugins/fgOS/skills/fgos-coding-compounding/SKILL.md", "src/report/frontmatter.mjs", "src/report/authoritative-match.mjs", "test/report/authoritative-match.test.mjs"],
    "kind": "task",
    "risk": "light",
    "deps": []
  }
]
```
