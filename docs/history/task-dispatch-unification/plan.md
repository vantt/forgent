# plan.md — Tổng quát hoá tầng capacity/executor dispatch quanh khái niệm "task"

Item: `tsk-5tm`. Input: `docs/history/task-dispatch-unification/CONTEXT.md`
(D1-D12 locked, kế thừa nguyên vẹn từ `DISCUSSION.md`). Pass này không mở lại
bất kỳ quyết định nào — chỉ chọn approach, viết risk map, và quyết định
split.

Mode: **high-risk**

Lane quyết bởi `fgos-coding-planning`'s direct-entry fallback (không có
Orient step nào của `fgos-routing` chạy trong phiên này — Native-First
handoff đi thẳng `fgos-coding-shaping` → `fgos-coding-exploring` →
`fgos-coding-planning`, `plan.md` chưa từng tồn tại trước pass này), áp
`fgos-routing`'s Mode-gate trực tiếp. Đếm flag:

- **external systems** — có (nhẹ): D11's ví dụ `agy`/Gemini là executor
  cross-provider tham chiếu, dù chưa gắn `for` nào cho producer thật.
- **public contracts** — có: `capacities.<id>` config schema và
  `dispatch.mjs`'s CLI surface (`decide`/`execute`/`--work`) là hợp đồng 3
  producer đang/sẽ dùng chung (`fgos-researching`, `fgos-fanout`,
  `_shared/capacity-dispatch-fallback.md`).
- **existing covered behavior** — có: `test/runner/dispatch.test.mjs` (11
  fixture `for:'gather'` + 1 assert cứng), `cfg.models`/`modelForTier`'s
  hiện tại consumer.
- **removing a validation** (hard-gate flag) — có: D1 xoá gate `needs` khỏi
  `resolveExecutorConfig`; D6 xoá `'gather'` khỏi `CAPACITY_PURPOSES` enum
  (một validation constraint trên capacity shape).

≥4 flags kèm 1 hard-gate flag (removing a validation) → **high-risk** theo
bảng của `fgos-routing`'s Mode-gate, bất kể flag count đơn thuần đã đủ
ngưỡng 4+ hay chưa.

## Approach

**Chọn:** Tách thành 6 mảnh việc độc lập hoặc phụ thuộc rõ ràng (xem Shape
bên dưới), mỗi mảnh có `verify` riêng, thay vì gộp 1 lần thực thi duy nhất.

**Phương án bị bác:** Gộp toàn bộ D1/D4/D5/D6/D9/D11 vào 1 lần thực thi.
Bác bỏ vì: (a) footprint tổng hợp trải trên >8 file thuộc 3 lớp khác nhau
(runtime `dispatch.mjs`, config `.fgos/config.json`, 2 producer skill +
1 shared fragment, 2 doc giải thích, 1 test file) với ≥3 cặp quyết định
ĐỘC LẬP THẬT (D1⊥D6, {D9,D11}⊥{D4,D5}) — DISCUSSION.md §7 "Quan hệ" của
từng `#task-*` đã tự xác nhận điều này, không phải suy đoán mới; (b) 1
`verify` command không thể chứng minh trung thực 6 hành vi khác nhau cùng
lúc — vi phạm "smallest honest plan"; (c) D4 (`fgos-fanout` consult
dispatch) PHỤ THUỘC THẬT vào D5 (`execute` subcommand) đã ship trước —
gộp chung che mất thứ tự bắt buộc này.

**Impact-analysis posture (chạy fresh trong `fgos-coding-exploring` pass
trước, `CONTEXT.md` §4):** `full` — GitNexus `status:"present"`. Mọi proof
point dựa vào blast-radius bên dưới giữ nguyên yêu cầu `impact()` thật,
không hạ chuẩn.

### Risk map

| Component | Rủi ro | Proof point (tại `fgos-coding-validating`/execute) |
|---|---|---|
| `dispatch.mjs`'s `resolveExecutorConfig` gate (D1) | light — dead code, 0 live consumer đã xác nhận (`CONTEXT.md` §4 D1) | `impact({target:"resolveExecutorConfig", direction:"upstream"})` trước khi sửa; `node --test test/runner/dispatch.test.mjs` xanh |
| `.fgos/config.json` + `CAPACITY_PURPOSES` enum + tool-registry entry (D6) | standard — xoá 1 capacity + 1 enum value + 11 fixture test + 2 doc + 1 skill md | `npm test` xanh; `grep -rn "gather" .fgos/config.json` rỗng; `grep -n "'gather'" src/runner/dispatch.mjs` chỉ còn trong comment/lịch sử |
| `EXECUTOR_ADAPTERS` self-execute path, subcommand `execute` mới (D5) | standard — thêm hành vi runtime mới (self-execute), không sửa hành vi Flow B hiện có | `impact({target:"EXECUTOR_ADAPTERS", direction:"upstream"})`; test mới xác nhận adapter ĐƯỢC GỌI (không chỉ validate), case native vẫn hand-back |
| `fgos-fanout` wiring vào dispatch decision protocol (D4) | **heavy** — sửa 1 producer đang chạy song song thật; rủi ro tuần tự hoá latency đã được DISCUSSION.md tự nêu, chưa đo | Đo wall-clock 1 batch fanout thật trước/sau — xác nhận vẫn parallel; test xác nhận `decide` gọi 1 lần/candidate trước khi Agent tool fire |
| Registry shape restructure — `invocations[]`, key theo executor (D11) | standard — thêm shape mới, `judge-discovery`/`judge-decompose` không cần migrate (đã tương thích tự nhiên) | `npm test` xanh với `capacities.agy` mới; `validateCapacityShape` test mới chấp nhận `invocations[]`, từ chối `kind` sai |
| Model/tier N-map theo provider, vocab 3→5 (D9) | **heavy** — `work.tier` đọc ở NHIỀU nơi ngoài `modelForTier`, blast radius CHƯA rà (tự DISCUSSION.md nêu, không phải suy đoán mới ở đây) | `impact({target:"modelForTier", direction:"upstream"})` + `grep -rn "work.tier\|modelForTier\|cfg.models"` TRƯỚC khi sửa; verify cụ thể còn `chưa xác định` — `fgos-coding-validating` phải rà xong blast radius mới chốt được |
| 2 doc + `fgos-researching` SKILL.md prose (D6 phần C/D) | light — thuần prose, không runtime | review nội dung khớp entry thật (`judge-discovery`), không còn trỏ ví dụ chết |

**Thứ tự thực thi** — không có `fgos graph --what-if` khả dụng (children
chưa materialize, chưa có id), nên dùng đúng dependency đã map ở
DISCUSSION.md §7's "Quan hệ" (bằng chứng thật, không phải judgment mới):

1. `#task-retire-needs` (D1) và `#task-remove-gather` (D6) — ĐỘC LẬP hoàn
   toàn với nhau và với mọi mảnh khác, có thể chạy song song hoặc theo thứ
   tự bất kỳ. Lưu ý nội bộ: bước sửa doc `needs` trong `#task-remove-gather`
   nên làm SAU khi `#task-retire-needs` landed (cùng 1 quan sát DISCUSSION.md
   §7 đã ghi, không đổi).
2. `#task-dispatch-self-execute` (D5) PHẢI landed TRƯỚC `#task-fanout-
   consult-dispatch` (D4) — D4 cần nhánh out-of-process thật D5 tạo ra.
3. `#task-executor-registry-restructure` (D11) và `#task-provider-tier-
   policy` (D9) — độc lập với cả 2 cặp trên, có thể build song song bất kỳ
   lúc nào.

## Shape

6 mảnh việc, mỗi mảnh 1 D-ID chính (hoặc bộ D-ID liên quan), độc lập
workable theo đúng ranh giới DISCUSSION.md §7 đã shape. Không mảnh nào đủ
nhỏ để gọi là `tiny`/`small` — mỗi mảnh chạm ≥1 file runtime + ≥1 test,
khớp lane `standard` cho từng piece riêng lẻ (item cha `high-risk` là vì
gộp cả 6 + hard-gate flag, không phải mỗi piece tự thân đã high-risk, trừ
D4/D9 — xem risk map).

```json
[
  {
    "title": "Retire needs field from capacities config and dispatch gate",
    "verify": "node --test test/runner/dispatch.test.mjs",
    "action": "D1: retire field needs khoi capacities.<id> - needs la data chet 100% voi moi entry kind:task, tool-registry + fgos tool query la noi hoi staleness thay the",
    "footprint": [".fgos/config.json", "src/runner/dispatch.mjs", "test/runner/dispatch.test.mjs"],
    "kind": "task",
    "risk": "light"
  },
  {
    "title": "Remove gather capacity, its tool-registry entry, and dead references",
    "verify": "npm test",
    "action": "D6: xoa capacity gather khoi .fgos/config.json - con duong cross-provider duy nhat khong co ly do kien truc ghi lai, ly do song song hoa da duoc native Task-tool dap ung du",
    "footprint": [".fgos/config.json", "src/runner/dispatch.mjs", "test/runner/dispatch.test.mjs", "docs/how-to/wire-a-skill-to-a-capacity-by-purpose-not-name.md", "docs/explanation/dispatch-binding-moves-from-name-keying-to-needs-for-capability-declaration.md", ".agents/skills/fgos-researching/SKILL.md"],
    "kind": "task",
    "risk": "standard"
  },
  {
    "title": "Add dispatch.mjs execute subcommand for adapter-resolvable self-execution",
    "verify": "node --test test/runner/dispatch.test.mjs",
    "action": "D5: dispatch.mjs can tu thuc thi (self-execute) cho case adapter-resolvable, khop run_task() cua marketing-cockpit - EXECUTOR_ADAPTERS duoc validate nhung chi Flow B goi, Flow A luon hand-back tran",
    "footprint": ["src/runner/dispatch.mjs", "test/runner/dispatch.test.mjs"],
    "kind": "task",
    "risk": "standard"
  },
  {
    "title": "Wire fgos-fanout to consult dispatch decision protocol before firing Agent batch",
    "verify": "node --test test/runner/dispatch.test.mjs",
    "action": "D4: tong quat hoa dispatch quanh khai niem task, mo rong pham vi da khoa cua tsk-3ik D3 - fgos-fanout hardcode Agent tool, chua tung consult decision protocol du dung pham vi tsk-3ik D3 da tuyen bo",
    "footprint": [".agents/skills/fgos-fanout/SKILL.md", "src/runner/dispatch.mjs", "test/runner/dispatch.test.mjs"],
    "kind": "task",
    "risk": "heavy"
  },
  {
    "title": "Restructure capacities registry shape to executor-keyed invocations[]",
    "verify": "node --test test/runner/dispatch.test.mjs",
    "action": "D11: schema executor-keyed-by-name giu top-level key capacities KHONG doi thanh executors - va cham that voi cfg.executors tier-keyed da co, validate chat boi tsk-4eu",
    "footprint": [".fgos/config.json", "src/runner/dispatch.mjs", "test/runner/dispatch.test.mjs"],
    "kind": "task",
    "risk": "standard"
  },
  {
    "title": "Move model/tier resolution to provider-keyed modelPolicies with 5-tier vocab and rigorOverrides",
    "verify": "node --test test/runner/dispatch.test.mjs",
    "action": "D9: doi model/tier resolution tu 1 map phang sang N-map theo provider + mo rong tier vocab 3->5 + truc rigorOverrides - modelForTier chi doc ten model Claude, executor non-Claude nhan sai ten khong throw",
    "footprint": ["src/runner/dispatch.mjs", "test/runner/dispatch.test.mjs"],
    "kind": "task",
    "risk": "heavy"
  }
]
```

Ghi chú riêng cho piece cuối (`modelPolicies`, D9): `verify` ở trên là điểm
khởi đầu (test suite hiện có phải xanh), NHƯNG DISCUSSION.md §7 tự nhận
"verify nháp: chưa xác định — phụ thuộc kết quả rà blast radius" cho mảnh
này. `fgos-coding-validating` PHẢI chạy `grep -rn "work.tier\|modelForTier\|
cfg.models"` thật và bổ sung 1 test cụ thể xác nhận executor non-Claude
resolve đúng tên model trước khi coi piece này đã có proof đầy đủ — action
đã cite D9 hợp lệ nên `normalizeChild` chấp nhận shape, nhưng gate thật
(reality check) không được coi verify hiện tại là đủ mà không có bổ sung đó.

## Assumptions (không material, không cần hỏi lại)

- Tool-registry entry `gather`→`prompt-completion` sống trong event log
  (`registerTool`, `src/state/tool-registry.mjs`), không phải 1 dòng JSON
  tĩnh riêng — xoá nó là 1 lệnh CLI (`fgos tool` verb tương ứng) chạy ở
  execute time, không phải 1 edit file độc lập; đã gộp vào footprint
  `.fgos/config.json`/`src/runner/dispatch.mjs` của `#task-remove-gather`
  vì đó là nơi capacity + enum thật sự sống. Chi tiết verb chính xác
  (`fgos tool remove`/tương đương) là quyết định của người thực thi, không
  material tới scope/D-ID nào.
- `AGENTS.md`'s đoạn hợp đồng dispatch (D7's target-text đã soạn xong,
  `DISCUSSION.md` §3) KHÔNG phải 1 trong 6 mảnh trên — D7 tự nêu rõ hoãn
  đưa vào file tới khi `#task-dispatch-self-execute` (D5) + `--work` flag
  (nằm trong D12's shared-helper, chưa tự có `#task-*` riêng ở §7) đã ship.
  Việc chèn đoạn văn đó là 1 mảnh việc TƯƠNG LAI, ngoài phạm vi split lần
  này — không bỏ sót, chỉ đúng như D7 đã tự khoá timing.
- `_shared/capacity-dispatch-fallback.md`'s rút gọn (D12's phần (i)) là hệ
  quả TỰ ĐỘNG của `#task-dispatch-self-execute` (D5) landing — không tách
  thành mảnh riêng, gộp vào footprint của piece đó khi thực thi (D12 tự
  nói "hệ quả tất yếu của D5, không có phương án khác").

## Outstanding questions

None
