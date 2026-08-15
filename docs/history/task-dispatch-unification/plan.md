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
DISCUSSION.md §7's "Quan hệ" (bằng chứng thật, không phải judgment mới),
**với 1 điều chỉnh sau review độc lập (xem "Second finding" ở Gate section
dưới): D4 dời xuống CUỐI CÙNG** thay vì nằm giữa D5 và D11/D9 — lý do là
D4 là mảnh `heavy` duy nhất còn proof (wall-clock) chỉ đo được sau khi có
code thật; đặt nó giữa chain sẽ khiến 1 stall ở D4 chặn luôn 2 mảnh
D11/D9 mà DISCUSSION.md §7 đã tự xác nhận "độc lập, có thể build song song
bất kỳ lúc nào" — dời D4 xuống cuối giữ nguyên dependency THẬT duy nhất
(D5 phải xong trước D4) mà không còn chặn nhầm 2 mảnh độc lập kia:

1. `#task-retire-needs` (D1) và `#task-remove-gather` (D6) — ĐỘC LẬP hoàn
   toàn với nhau và với mọi mảnh khác, có thể chạy song song hoặc theo thứ
   tự bất kỳ. Lưu ý nội bộ: bước sửa doc `needs` trong `#task-remove-gather`
   nên làm SAU khi `#task-retire-needs` landed (cùng 1 quan sát DISCUSSION.md
   §7 đã ghi, không đổi).
2. `#task-dispatch-self-execute` (D5) landed tiếp — không phụ thuộc D1/D6,
   nhưng cùng chạm `dispatch.mjs` nên xếp liền sau cho gọn chain.
3. `#task-executor-registry-restructure` (D11) và `#task-provider-tier-
   policy` (D9) — độc lập với D1/D6/D5/D4, xếp NGAY SAU D5 (không phải đợi
   D4) để không bị chặn nhầm bởi mảnh rủi ro nhất.
4. `#task-fanout-consult-dispatch` (D4) CUỐI CÙNG — PHẢI landed sau
   `#task-dispatch-self-execute` (D5, dependency thật duy nhất — D4 cần
   nhánh out-of-process D5 tạo ra) nhưng không cần đợi D11/D9.

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
    "risk": "light",
    "deps": []
  },
  {
    "title": "Remove gather capacity, its tool-registry entry, and dead references",
    "verify": "npm test",
    "action": "D6: xoa capacity gather khoi .fgos/config.json - con duong cross-provider duy nhat khong co ly do kien truc ghi lai, ly do song song hoa da duoc native Task-tool dap ung du",
    "footprint": [".fgos/config.json", "src/runner/dispatch.mjs", "test/runner/dispatch.test.mjs", "docs/how-to/wire-a-skill-to-a-capacity-by-purpose-not-name.md", "docs/explanation/dispatch-binding-moves-from-name-keying-to-needs-for-capability-declaration.md", ".agents/skills/fgos-researching/SKILL.md"],
    "kind": "task",
    "risk": "standard",
    "deps": [0]
  },
  {
    "title": "Add dispatch.mjs execute subcommand for adapter-resolvable self-execution",
    "verify": "node --test test/runner/dispatch.test.mjs",
    "action": "D5: dispatch.mjs can tu thuc thi (self-execute) cho case adapter-resolvable, khop run_task() cua marketing-cockpit - EXECUTOR_ADAPTERS duoc validate nhung chi Flow B goi, Flow A luon hand-back tran. D12(i): rut _shared/capacity-dispatch-fallback.md con 3 buoc la he qua tat yeu cua piece nay, gop chung khong tach rieng.",
    "footprint": [".agents/skills/_shared/capacity-dispatch-fallback.md", "src/runner/dispatch.mjs", "test/runner/dispatch.test.mjs"],
    "kind": "task",
    "risk": "standard",
    "deps": [0, 1]
  },
  {
    "title": "Restructure capacities registry shape to executor-keyed invocations[]",
    "verify": "node --test test/runner/dispatch.test.mjs",
    "action": "D11: schema executor-keyed-by-name giu top-level key capacities KHONG doi thanh executors - va cham that voi cfg.executors tier-keyed da co, validate chat boi tsk-4eu",
    "footprint": [".fgos/config.json", "src/runner/dispatch.mjs", "test/runner/dispatch.test.mjs"],
    "kind": "task",
    "risk": "standard",
    "deps": [0, 1, 2]
  },
  {
    "title": "Move model/tier resolution to provider-keyed modelPolicies with 5-tier vocab and rigorOverrides",
    "verify": "node --test test/runner/dispatch.test.mjs",
    "action": "D9: doi model/tier resolution tu 1 map phang sang N-map theo provider + mo rong tier vocab 3->5 + truc rigorOverrides - modelForTier chi doc ten model Claude, executor non-Claude nhan sai ten khong throw. Rang buoc: giu nguyen signature modelForTier(cfg, tier) nhan tier 3-vocab (light/standard/heavy) dau vao, tu map noi bo sang 1 trong 5 model-policy tier - loop.mjs:1324 (call site that duy nhat ben ngoai dispatch.mjs) khong duoc doi.",
    "footprint": [".fgos/config.json", "src/runner/dispatch.mjs", "test/runner/dispatch.test.mjs"],
    "kind": "task",
    "risk": "heavy",
    "deps": [0, 1, 2, 3]
  },
  {
    "title": "Wire fgos-fanout to consult dispatch decision protocol before firing Agent batch",
    "verify": "node --test test/runner/dispatch.test.mjs",
    "action": "D4: tong quat hoa dispatch quanh khai niem task, mo rong pham vi da khoa cua tsk-3ik D3 - fgos-fanout hardcode Agent tool, chua tung consult decision protocol du dung pham vi tsk-3ik D3 da tuyen bo. D12(iii): export capacityIdForWork (dispatch.mjs:1090, hien module-private) + them CLI flag decide --work <id> - day la co che work-item-shaped lookup fgos-fanout can de consult, khong co child nao khac so huu viec nay.",
    "footprint": [".agents/skills/fgos-fanout/SKILL.md", "src/runner/dispatch.mjs", "test/runner/dispatch.test.mjs"],
    "kind": "task",
    "risk": "heavy",
    "deps": [0, 1, 2, 3, 4]
  }
]
```

**Deps là hàng rào chống xung đột footprint, không phải claim logic mới.**
`fgos plan --verdict decompose` lần đầu (không có `deps`) bị engine tự động
park `need-human` — 15/15 cặp con trùng `src/runner/dispatch.mjs` (đa số
cũng trùng `test/runner/dispatch.test.mjs`), đúng cơ chế
`footprintOverlapAmong` (`plan.mjs:907-915`) đã thiết kế: 1 file bị ≥2 việc
con cùng sửa mà không có `deps` nối chúng là 1 dispatch hazard thật, không
phải false positive. Sửa bằng full pairwise chain (mỗi child liệt kê MỌI
index đứng trước nó) — engine's `footprintOverlapAmong` chỉ miễn trừ 1 cặp
khi có edge TRỰC TIẾP giữa đúng cặp đó (không bắc cầu qua deps của deps),
nên 1 chain tuyến tính không đủ, cần liệt kê đủ. Thứ tự chain (D1→D6→D5→
D11→D9→D4) khớp đúng "Thứ tự thực thi" phía trên, gồm cả điều chỉnh dời D4
xuống cuối sau review độc lập (xem "Second finding" ở Gate section) — không
đảo lại bất kỳ quyết định D-ID nào, chỉ mã hoá thứ tự thực thi vào `deps`
field thay vì để trong prose.

Ghi chú riêng cho piece D9 (`modelPolicies`, index 4): `verify` ở trên là
điểm khởi đầu (test suite hiện có phải xanh), NHƯNG DISCUSSION.md §7 tự
nhận "verify nháp: chưa xác định — phụ thuộc kết quả rà blast radius" cho
mảnh này. `fgos-coding-validating` PHẢI chạy `grep -rn "work.tier\|
modelForTier\|cfg.models"` thật và bổ sung 1 test cụ thể xác nhận executor
non-Claude resolve đúng tên model trước khi coi piece này đã có proof đầy
đủ — action đã cite D9 hợp lệ nên `normalizeChild` chấp nhận shape, nhưng
gate thật (reality check) không được coi verify hiện tại là đủ mà không có
bổ sung đó.

Ghi chú riêng cho piece D4 (fanout wiring, index 5, cuối chain): cùng caveat
như D9 — `node --test test/runner/dispatch.test.mjs` phủ được bề mặt
`--work`/`decide` (nếu action's D12(iii) landed), nhưng KHÔNG verify được
việc SKILL.md prose của `fgos-fanout` đã wiring đúng, KHÔNG xác nhận "decide
gọi đúng 1 lần/candidate trước khi Agent fire", và KHÔNG đo được số
wall-clock risk map đòi hỏi. `fgos-coding-validating`/execute PHẢI bổ sung:
(a) đọc lại `fgos-fanout/SKILL.md` sau khi sửa để xác nhận announce-loop
vẫn gọi `decide` đúng vị trí; (b) đo wall-clock 1 batch thật trước/sau.

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
  đã ship. Sau fix ở Gate section (D12(iii) gộp vào child D4's action),
  `--work` flag ship ở mảnh CUỐI CÙNG (D4, chain position cuối) — nghĩa là
  D7's precondition chỉ thoả sau khi TOÀN BỘ 6 mảnh landed, không sớm hơn.
  Việc chèn đoạn văn vào `AGENTS.md` vẫn là 1 mảnh việc TƯƠNG LAI, ngoài
  phạm vi split lần này — không bỏ sót, chỉ đúng như D7 đã tự khoá timing,
  giờ đã rõ mốc thời gian cụ thể hơn.
- `_shared/capacity-dispatch-fallback.md`'s rút gọn (D12's phần (i)) là hệ
  quả TỰ ĐỘNG của `#task-dispatch-self-execute` (D5) landing — gộp vào
  footprint + action của piece đó (index 2) khi thực thi, không tách mảnh
  riêng (D12 tự nói "hệ quả tất yếu của D5, không có phương án khác").
- **Cross-checkout hazard cho mọi child chạm `.fgos/config.json` (children
  0, 1, 3, 4 — index D1/D6/D11/D9):** worktree của child đó không giữ bản
  copy `.fgos/` riêng (`ADR0020` strip ngay sau `git worktree add`), và
  `committedRunnerConfig()` trong test suite đọc thẳng config của MAIN
  checkout (verify thật: `test/runner/dispatch.test.mjs:621-629`) — không
  phải config trong worktree của child. Vì vậy mỗi child đó phải chủ động
  sequencing: sửa test trong worktree của mình TRƯỚC, rồi hand-commit
  `.fgos/config.json` change sang MAIN checkout theo đúng con đường
  `tsk-49u` đã dùng (comment của chính test file trích dẫn) — không phải
  edit file bình thường trong worktree. Mutation vào MAIN visible ngay cho
  mọi session khác đang chạy sống — nếu child đó rollback, MAIN đã bị mutate
  rồi cần dọn tay, không tự động revert theo child.

## Feasibility matrix (`fgos-coding-validating` pass)

Rows for the 2 `heavy`-risk pieces (D4, D9) — the only risk-map entries
flagged medium-or-higher. Evidence gathered live against the real repo,
impact-analysis posture re-confirmed `full` (GitNexus `status:"present"`,
re-queried fresh at this pass — matches the posture `fgos-coding-planning`
already recorded, no drift). Note: GitNexus's own graph index is reported
stale by this session's tool hook (`last indexed: c0cedaa`) — evidence below
was gathered by direct `grep`/`Read`, the documented cross-check for exactly
this situation (`CLAUDE.md`'s impact-analysis gate), not by trusting a
possibly-stale `impact()` MCP call.

| Assumption | Risk | Proof required | Evidence found | Result |
|---|---|---|---|---|
| D4: adding a `decide` call per fanout candidate before firing the Agent batch does not serialize the actual parallel dispatch | heavy | Real read of `fgos-fanout`'s own batching mechanism | `.agents/skills/fgos-fanout/SKILL.md`: batch capped at max 5 members (`hasWorkerSlotRoom`/D8's trim rule); the skill ALREADY runs a serial per-candidate step before firing ("Announce every dispatch before firing it... print one line per candidate", then "for each id in the batch: print its announce line") — the actual Agent-tool fire stays 1 batched parallel message regardless. A `decide` call slots into that same existing serial loop, bounded by the same 5-item cap; it cannot turn the already-parallel fire step sequential. Re-verified independently by a second reviewer (see below) — confirmed. | **PROVEN bounded** — real wall-clock number still needs measuring once code exists (see D4's own verify-caveat note above), but the *structural* risk ("does this force full serialization") is closed now, not deferred |
| D9: expanding the model-policy tier vocab 3→5 does not require migrating `work.tier`'s own 3-value classification (`light/standard/heavy`) or touching `decompose.mjs`'s `HEAVY_RISK` gate | heavy | Full blast-radius grep of `modelForTier`/`cfg.models`/`work.tier` outside `dispatch.mjs`, confirm shape | `grep -rn "modelForTier\|cfg\.models\b\|work\.tier\b" src bin --include="*.mjs"` outside `dispatch.mjs`: only 4 files. `loop.mjs` — exactly ONE real `modelForTier` call site (`loop.mjs:1324`, the dry-run dispatch path); every other `tier` reference there is bookkeeping/logging of the EXISTING `work.tier` value, unchanged by this piece. `plan.mjs:974` — carries `work.tier` through to a child spec verbatim, no lookup. `work.mjs:381-383` — validates `work.tier` against `TIERS` (`work.mjs:156`, still `['light','standard','heavy']`), untouched by D9's own text (D9 targets `cfg.modelPolicies`, a NEW config field — never says `work.mjs`'s `TIERS` export changes). `graph-harness.mjs:95` is a doc-comment only, not a code read. Re-verified independently by a second reviewer (see below) — confirmed, plus flagged 2 residual soft spots for the implementer (not blockers): (a) the 3→5 mapping for `heavy` — does it map to `critical` or `analytical`? — is a real semantic choice, not mechanical; (b) `rigorOverrides` has no specified semantics anywhere beyond "matches marketing-cockpit". | **PROVEN contained**, PROVIDED the 5-tier vocab lives ONLY inside `cfg.modelPolicies` as its own internal concept (decoupled from `work.tier`/`work.risk`'s shared 3-value classification, per `workflow-stage-graphs.mjs:328`'s own comment that the two are "deliberately the SAME vocabulary") — pinned as an assumption below, the reversible reading of D9's own text |

Neither row required asking a person (Gate step 1, tier A): both gaps closed
by running the real command/read. Cost verdict: **REVERSIBLE** — the D9
reading taken is the additive, no-migration option; if a future session
decides `work.tier`/`work.risk`'s own vocab genuinely needs to grow too,
that is new, separate work with its own decision, not a correction of this
one.

## Pinned assumptions (added at `fgos-coding-validating`)

- **D9 scope boundary:** `cfg.modelPolicies`'s 5-tier vocab
  (`lightweight/standard/creative/analytical/critical`) is a NEW, internal
  concept scoped to model/executor resolution inside `dispatch.mjs` —
  `work.mjs`'s `TIERS` export (`light/standard/heavy`, shared with
  `work.risk` per `workflow-stage-graphs.mjs:328`) is NOT touched by
  `#task-provider-tier-policy`. Whoever executes that piece still owes a
  mapping from a work item's existing `tier`/a capacity's `rigorOverrides`
  onto one of the 5 model-policy tiers — that mapping's exact shape
  (including the semantically-loaded `heavy`→? choice) is the genuinely
  open implementation detail, not whether `work.tier` itself changes.
- **D4 batch bound:** the `decide`-before-fire step must stay inside
  `fgos-fanout`'s existing per-candidate serial loop (max 5 members per
  batch, per D8's trim rule) — never a design that adds an unbounded or
  per-wave-unbounded synchronous pass.

## Gate — `validateApprove`

`gate-check --gate validateApprove --cost REVERSIBLE` returned
`canAutoApprove: false` — not a content gap (cost verdict was already
`REVERSIBLE`, no T1/T2/T3 trigger fired, both `heavy` rows closed with real
evidence above), but the tier ceiling: 2 of 6 children are `risk: heavy`
(D4, D9), which gate-bypass level `standard` does not cover. Asked the
person to confirm materializing all 6 as split, vs. pulling D4/D9 into a
more-supervised item — person answered **go ahead, all 6 as planned**.
Recorded via `fgos gate-approve --actor human`.

### Second finding: engine's own footprint gate (independent of the human gate above)

Firing `fgos plan --verdict decompose` with the original (no-`deps`)
children came back `outcome: "need-human"` — a SEPARATE, mechanical gate
inside `resolvePlan` itself (`plan.mjs:907-915`, `footprintOverlapAmong`),
not the `validateApprove` gate already cleared above. All 15 pairs among
the 6 children share `src/runner/dispatch.mjs` (most also
`test/runner/dispatch.test.mjs`) with no `deps` edge connecting them — a
real parallel-dispatch hazard, not a false positive, and the item got
auto-parked `awaiting-human` (`ask` field lists all 15 pairs verbatim,
suggestion: "sequence/hoist/re-slice").

**Fix applied:** added `deps` to every child — a full pairwise chain (each
child lists every index before it), since `footprintOverlapAmong` only
exempts a pair with a DIRECT edge between them, not a transitive one.

### Third pass: independent second-opinion review (Fable model, separate session)

Per an explicit instruction to get a second opinion before re-firing
decompose, a fresh agent session (model `fable`) independently re-read
`DISCUSSION.md`/`CONTEXT.md`/`plan.md` and re-verified every code citation
live against the repo. Verdict: **READY WITH CHANGES**. All D1-D12
citations held; the 6-way split granularity and the deps-chain mechanism
were both confirmed correct. It found 3 concrete gaps, all fixed above
before this `plan.md` was considered final:

1. Child D9 (`modelPolicies`)'s footprint was missing `.fgos/config.json`
   — the committed config's real `runner.models` map
   (`{light:haiku, standard:sonnet, heavy:opus}`, re-verified live) is
   exactly what D9 renames/restructures, so the config file IS touched.
   Fixed: added to footprint, plus a constraint note in the action text
   about keeping `modelForTier`'s signature stable for `loop.mjs:1324`.
2. D12(iii) (`decide --work <id>` + exporting `capacityIdForWork`) was
   owned by no child — yet D4 (fanout consult) structurally needs exactly
   that work-item-shaped lookup mechanism, and D7's AGENTS.md
   precondition ("`--work` shipped") could never be met by the split as
   originally written. Fixed: folded into D4's own `action` text (its
   footprint already covers `dispatch.mjs`) — no 7th child needed.
3. Child D5's footprint was missing
   `.agents/skills/_shared/capacity-dispatch-fallback.md` — the
   Assumptions section already said D12(i)'s fragment-shortening lands as
   part of that piece, but the declared footprint didn't cover it (file
   existence re-verified). Fixed: added to footprint.

Also adopted (non-blocking but adopted): reordering the chain to put D4
(the one `heavy` piece whose proof needs post-implementation wall-clock
measurement) LAST instead of in the middle — the original chain had D4
blocking D11/D9, two pieces DISCUSSION.md §7 explicitly called
independent. Reflected in the "Thứ tự thực thi" section and the JSON block
above; the one real dependency (D5 before D4) is preserved.

Two residual soft spots the reviewer flagged for whoever executes D9 (not
blockers, no plan change needed — genuinely implementation-level): the
3→5 tier mapping for `heavy` is a real semantic choice, and
`rigorOverrides` has no specified shape anywhere yet. Folded into the
Pinned assumptions section above so the executing session sees it without
re-deriving.

Full review report: `plans/reports/plan-review-260814-1744-tsk-5tm-
fable-second-opinion-report.md`.

**Not yet re-fired.** `fgos plan --verdict decompose` with this corrected
`plan.md` has not been run yet — held for an explicit go-ahead. The item
is still parked `status: awaiting-human` from the first (pre-fix) attempt.

## Outstanding questions

None — everything above is either locked (D1-D12), evidenced (feasibility
matrix, independently re-verified), or a mechanical fix already applied to
`plan.md` (the `deps` chain, the 3 footprint/action gaps, the D4 reorder).
The only remaining step is re-firing `fgos plan --verdict decompose` with
the corrected children — held for an explicit go-ahead, not because
anything here is still undecided.
