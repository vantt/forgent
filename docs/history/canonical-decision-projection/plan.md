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

| Mảnh | Rủi ro | Vì sao | Proof point cần ở `fgos-coding-validating` |
|---|---|---|---|
| 1. decision-relation-and-sweep | Đứng | Đổi CLI contract (`--relation` bắt buộc) — mọi caller hiện có của `fgos decision` phải cập nhật | Chạy thử `fgos decision` không `--relation` trên 1 case thật, xác nhận refuse đúng thông báo, không crash |
| 2. scope-field-and-index-generate | Vừa | Thêm field mới, không đổi field cũ — ít rủi ro ngược tương thích hơn mảnh 1 | Generate thử `docs/decisions/index.md` từ `state.decisions` hiện có, `--check` xác nhận byte-stable |
| 3. context-md-render | Vừa | Đổi convention authoring của CONTEXT.md — ảnh hưởng MỌI skill đang ghi CONTEXT.md (exploring/planning/shaping) | Render thử 1 CONTEXT.md thật (chính `tsk-1lv`) từ `state.decisions`, đối chiếu tay với bảng D1-D14 đã viết |
| 4. retire-decisions-corpus | Cao | Xoá/di chuyển 35 file đang được cite ở nhiều nơi (`docs/backlog.md`, `docs/specs/*.md`, skill khác) — rủi ro gãy citation diện rộng | Chạy `check-decision-citation-drift.mjs` (đã nâng cấp ở mảnh 1) trên toàn repo SAU migrate, xác nhận 0 dangling reference |
| 5. four-door-in-retrospective | Vừa | Thêm check mới vào batch loop hiện có — rủi ro chính là false-positive chặn nhầm item vô tội | Chạy `/fgOS:retro-loop` thật trên ≥1 item test có D-ID chưa route, xác nhận đúng 1 finding, không báo thừa trên item sạch |
| 6. compounding-anti-fork | Thấp | Độc lập, chỉ thêm field + check mới, không đổi hành vi ghi hiện có ngoài việc BỎ luật cấm prune | Case thật: 2 capture cùng chủ đề khác tên → hội tụ 1 file; 1 capture phủ định capture cũ → sửa được đoạn cũ |

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
    "title": "fgos decision requires --relation, write-time citation sweep on supersede",
    "verify": "node --test test/state/decision-relation.test.mjs",
    "action": "D2: consistency derive tai thoi diem ghi (write-time sweep), khong phai graph luu tru song song; D3: khong xay decision-store moi, nang cap store hien co",
    "footprint": ["bin/fgos.mjs", "src/state/store.mjs", "scripts/check-decision-citation-drift.mjs", "scripts/check-decision-supersession.mjs", "test/state/decision-relation.test.mjs"],
    "kind": "task",
    "risk": "standard"
  },
  {
    "title": "Add scope/area field to state.decisions, generate docs/decisions/index.md with --check",
    "verify": "node --test test/report/decision-index.test.mjs",
    "action": "D4: 3 loai quyet dinh goc map vao state.decisions, quyet dinh platform-level can them field moi scope/area",
    "footprint": ["src/state/store.mjs", "src/report/decision-index.mjs", "docs/decisions/index.md", "test/report/decision-index.test.mjs"],
    "kind": "task",
    "risk": "standard"
  },
  {
    "title": "CONTEXT.md Locked-Decisions table renders from state.decisions instead of hand-typed prose",
    "verify": "node --test test/report/context-render.test.mjs",
    "action": "D3: wire be mat doc (CONTEXT.md) vao state.decisions da co san, dong khoang trong tsk-1ud de lai",
    "footprint": [".agents/skills/fgos-coding-exploring/SKILL.md", "src/report/context-render.mjs", "test/report/context-render.test.mjs"],
    "kind": "task",
    "risk": "light"
  },
  {
    "title": "Retire docs/decisions/*.md corpus into docs/specs/<area>.md narrative + state.decisions short records",
    "verify": "node --test test/docs/decisions-corpus-retired.test.mjs",
    "action": "D5: retire docs/decisions/*.md corpus, narrative don vao docs/specs/<area>.md, state.decisions giu record ngan lam nguon that",
    "footprint": ["docs/decisions", "docs/specs", "scripts/check-decision-citation-drift.mjs", "test/docs/decisions-corpus-retired.test.mjs"],
    "kind": "task",
    "risk": "high-risk"
  },
  {
    "title": "4-door check (freshness/impact/routing/doc-deferral) inside retrospective batch loop",
    "verify": "node --test test/state/retrospective-doors.test.mjs",
    "action": "D7: 4-door check chay ben trong loi goi hien co cua retrospective, khong gate fgos approve; D9: nhan mang 2+4 tu tsk-37i; D11: door ap moi item khong theo risk-tier",
    "footprint": ["bin/fgos.mjs", "src/state/retrospective-doors.mjs", ".agents/skills/fgos-coding-compounding/SKILL.md", "test/state/retrospective-doors.test.mjs"],
    "kind": "task",
    "risk": "standard"
  },
  {
    "title": "authoritative_for field + skeleton-match port/adapter + allow reconcile in fgos-coding-compounding",
    "verify": "node --test test/report/authoritative-match.test.mjs",
    "action": "D6: cho phep reconcile/retire prose cu; D8: tim-truoc-khi-tao = doctrine + harness backstop, khong phai gate song; D12: skeleton-match qua port/adapter mirror CTR009",
    "footprint": [".agents/skills/fgos-coding-compounding/SKILL.md", "src/report/frontmatter.mjs", "src/report/authoritative-match.mjs", "test/report/authoritative-match.test.mjs"],
    "kind": "task",
    "risk": "light"
  }
]
```
