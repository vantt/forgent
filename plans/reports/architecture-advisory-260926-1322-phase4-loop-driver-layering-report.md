# Phase 4 Adjustment — Loop Driver Layering Advisory

Date: 2026-09-26 · Track: `plans/260919-coordination-skill-harness-simplification/plan.md` · Position: I12 active, I13 next, Phase 4 after I13 · Type: advisory, no code/plan mutation.

## 1. Kết luận (TL;DR)

- **Có, nên chỉnh Phase 4 ngay bây giờ — chỉnh bằng câu chữ + exit criteria, không đổi kernel/schema/runtime.**
- Layer "generic loop" **cần tồn tại, nhưng ở dạng doctrine (driver discipline), không phải engine/code/entity**. Phần deterministic của loop đã nằm trong control layer (`actions.mjs` action view + `composers.mjs`); phần còn lại là *phán đoán của driver*, thuộc về skill-layer và phải được viết **một lần**.
- `fgos-plan-loop` = **implementation-track facade**, consumer đầu tiên chứng minh driver discipline — **không** phải generic loop engine.
- Phase 5 (architecture-panel) phải là **consumer thứ hai, unlike** dùng *nguyên* fragment đó (V-012). Chỉ khi hai consumer không giống nhau cùng dùng được thì fragment mới được coi là generic.

## 2. Chẩn đoán drift (có bằng chứng)

| # | Drift | Bằng chứng |
|---|---|---|
| D1 | Driver discipline chung bị hàn cứng vào plan-loop cùng track + coding mechanics | `core/skills/fgos-plan-loop/SKILL.md` §2–§5: disposition rules, fix-round cap 3, proof-gap không được `deferred`, escalate-human batching nằm chung với `git worktree`, `testedSha/integratedSha`, `git merge --no-ff`, cell-status table |
| D2 | plan-loop tự nhận "domain-agnostic" nhưng thực chất coding | `SKILL.md:81` "Work-independent, domain-agnostic planning surface" vs §4/§5 merge/worktree/test bắt buộc. Một track không-coding (docs/research) sẽ kế thừa git merge rule |
| D3 | Driver discipline bị nhân bản ở 3 nơi | plan-loop §2–§4; code-panel §1–§4 (direct mode có roster/open/fix/close riêng); architecture-panel "Driver Disposition", "Fresh-Session Resume", "Bounds" |
| D4 | Protocol loop nằm trong pack tên "group-thinking" | `core/protocol-packs/group-thinking.json` có `standalone-master-coordination-loop` — đây là protocol *produce → critique → revise → recheck*, không phải group-communication. Pack thực chất = "gated registered protocols" |
| D5 | Loop protocol đã domain-neutral, nhưng không ai nói vậy | `standalone-master-coordination-loop.yaml`: doer/reviewer/red-team/fixer, không có git/test/worktree; driver nằm ngoài graph ("No `spec.actors[]` entry declares a coordinator/driver role"). Tức là kernel **đã** tách đúng; drift chỉ ở skill layer |
| D6 | Stale close doctrine trong group-thinking skill (Phase 0 leftover) | `core/skills/fgos-group-thinking/SKILL.md:198-200` nói `runCoordinationUseCase` "always attempts" close và "no separate close step". Thực tế `close.mjs` tồn tại; `run.mjs:916-918` non-DAG chỉ close khi `request.close` hoặc step `close` |
| D7 | DAG path vẫn tự close | `run.mjs:916-917`: với `dagDeclaration`, close được attempt tự động khi không partial/caveat. Xung đột với locked direction "explicit close is the sole normal close action" → cần xác nhận trước khi driver discipline ghi "close chỉ là quyết định driver" |
| D8 | Phase 6 cần "shared coding-cell facade" nhưng chưa có owner | Phase 4 "Harness boundary" định nghĩa coding-cell facade *bên trong* plan-loop → Phase 6 code-panel sẽ phải import plan-loop → plan-loop thành god-skill trên thực tế |

Tóm lại: kernel + protocol đã đúng tầng. Drift là **ở skill layer**: 4 mối quan tâm khác nhau (driver discipline / track sequencing / coding-cell policy / interaction pattern naming) đang bị gộp, và wording Phase 4 hiện tại ("Rewrite plan-loop as the first consumer") sẽ đóng rắn sự gộp đó thay vì tách nó.

## 3. Kiến trúc đề xuất

```text
 L5  Use-case facades (skills — intent, unit selection, delivery)
     fgos-plan-loop        fgos-code-panel        fgos-architecture-panel     fgos-panel (router
     (impl track)          (1 coding change)      (1 arch decision)            + thin preset driver)
          |   \                 |      \                 |                         |
          |    +--> coding-cell policy <--+              +--> architecture doctrine/templates
          |         (domain: coding — worktree, proof tiers, verify doer, merge-after-close)
          v                     v                        v                         v
 L4  Driver discipline  — shared doctrine fragment, NO code, NO state
     observe(status) → choose legal action → dispatch → verify evidence(hook) →
     disposition → adapt(revise/recheck/retry/ask) → close|continue → continuity(hook)
          |  reads                      |  writes
          v                             v
 L2  Control layer (code, exists):  action view (actions.mjs) · semantic composers
                                    (composers.mjs / start/close/recover) · template resolver
          |
          v
 L1  Kernel: CoordinationSession · FlowDefinition validation · Assignment/Run/RunResult · Dispatch
          ^
          |  declared data (not a layer that decides anything)
 L3  Interaction protocols: FlowDefinition YAML (+ pack gate fgos-group-thinking)
     roles, graph, activation (required / driver-authorized), visibility windows,
     contribution types, reopen bounds, quorum/rechecks
```

Quy tắc phụ thuộc:

1. Mũi tên chỉ đi xuống. L4 không đọc YAML để tự suy legality — hỏi L2 action view.
2. L3 chỉ khai **"cái gì cần driver quyết"** (`driver-authorized`), không bao giờ khai **"driver quyết gì"**.
3. L4 không biết domain: không có từ `git`, `worktree`, `merge`, `test`, `phase`, `plan.md`. Mọi thứ domain đi qua *hook slots* (§4.1).
4. L5 không restate L1–L4. Facade = chọn unit + điền hook + deliver.

## 4. Responsibility matrix

| Trách nhiệm | L1 Kernel | L2 Control | L3 Protocol | L4 Driver discipline | L5 Facade | Domain policy |
|---|---|---|---|---|---|---|
| Legal next action | enforce | project (`actions`) | declare graph | **chọn** 1 action | — | — |
| Authority / mutation gating / evidence provenance | **own** | pass-through | declare `result.kind` | never bypass | never | — |
| Visibility / reveal windows | enforce | report | **declare** | respect | — | — |
| Dissent / ranking / contribution types | record | report | **declare** | — | — | doctrine của role packet |
| Dispatch executor/model | **own** (dispatch) | — | requirement only | never pin | never pin | — |
| Verify worker output độc lập | — | — | — | **bắt buộc** (luật) | — | **cách** verify (hook) |
| Disposition accepted/rejected/deferred | record | compose | declare vocabulary | **own quy trình** | — | tiêu chí (hook) |
| Revise / recheck / retry / reopen | enforce bounds | compose | declare bounds | **own quyết định** | — | cap cụ thể (hook) |
| Ask human (batch, non-blocking) | record `human-turn` | compose | — | **own luật** | trigger list (hook) | — |
| Close | enforce quorum | `close` door | declare quorum | **own quyết định** | tiêu chí thêm (hook) | — |
| Cold resume | replay | `status/chain` | — | **own luật** "state chỉ từ status + artifact" | artifact nào (hook) | — |
| Chọn unit tiếp theo (cell/case) | — | — | — | — | **own** | — |
| Worktree / tests / merge / cleanup | — | — | — | — | load | **coding-cell policy** |
| Architecture judgment / role packet | — | template resolve | contractTemplate ref | — | — | **architecture doctrine** |

### 4.1 Hook slots (contract giữa L4 và L5 — prose, không phải code)

| Hook | plan-loop | code-panel direct | architecture-panel |
|---|---|---|---|
| `unit` — đơn vị lặp | phase/cell kế tiếp chưa merged | 1 change | 1 decision case |
| `open-inputs` | phase file → objective/context refs | request text | raw intent → intake |
| `verify-evidence` | coding-cell: git log + focused test trong worktree | coding-cell | artifact có thật + rubric |
| `disposition-criteria` | proof-gap không được deferred | như plan-loop | driver không quyết thay advisor câu hỏi kỹ thuật |
| `adapt-bounds` | fix rounds ≤ 3 | ≤ 3 | protocol reopen caps (≤2) |
| `escalate-human` | product decision mở, 2 lần fail, merge conflict | như plan-loop | Decision Request (scout-before-ask) |
| `close-criteria` | + checkpoint identity | + focused/full proof | + explanation delivered |
| `after-close` | merge `--no-ff`, drop worktree | merge, cleanup | deliver packet, không mutation |
| `continuity-artifact` | plan.md cell table + trace | none/trace | intake + dialogue files |

Chính bảng này là "proof of generality": nếu Phase 5 điền được cột thứ 3 mà **không sửa** L4, layer là thật.

## 5. Khuyến nghị theo từng surface

- **`fgos-plan-loop`** — implementation-track facade. Giữ: track sequencing (chọn cell, đọc `chain`, cell-status table là *query*, closeout). Load: driver-discipline fragment + coding-cell policy. Bỏ: mọi luật driver chung (chuyển lên L4), mọi coding mechanics (chuyển xuống coding-cell policy). Sửa câu "domain-agnostic" thành "implementation-track (coding) facade; track sequencing domain-neutral, cell policy coding". Không làm non-coding track support (YAGNI) — chỉ không hard-wire.
- **`fgos-code-panel`** — giữ đúng: coding implementation facade. Direct mode = driver discipline + coding-cell policy trên 1 unit (không cần plan-loop). Planned mode = delegate plan-loop by reference (như hiện tại). Phase 6 xoá roster/open/fix/close/worktree duplicate.
- **`fgos-architecture-panel`** — advisory decision facade = driver discipline + `architecture-advisory-panel-v1` (qua pack gate) + architecture doctrine (role packets → templates). `after-close` = không mutation. Là consumer thứ hai của L4.
- **`fgos-panel`** — router. Với preset không có facade riêng (rfc-review-lite, nominal-group, delphi) nó đang tự drive (bước 5) → nên *tham chiếu* L4 fragment thay vì tự chế; không thêm logic.
- **`fgos-group-thinking`** — pack gate. Own: membership, version pin, `protocolRef` khớp, refuse agent-led. **Never own**: chọn action, disposition, retry, hỏi người, thời điểm close, tiêu chí domain, worktree. Sửa D6 (stale close). Thay `node -e` bằng public CLI (đã có ở Phase 5).
- **Protocols (L3)** — own interaction pattern: ai nói với ai, private/shared, reveal window, dissent/synthesis/ranking, reopen bound, quorum. Không phải loop, không chứa quyết định driver.
- **Future research/business loops** — = facade mới + protocol có sẵn/mới + L4 fragment + domain policy riêng. **Không** đi qua plan-loop, **không** cần engine mới. Nếu cần persisted track: không — continuity-artifact hook là đủ (V-011).

## 6. Đề xuất điều chỉnh Phase 4

### 6.1 Wording tối thiểu (an toàn, chỉ sửa text plan)

Đổi tiêu đề:

> **Phase 4 — Extract the shared driver discipline and prove it through plan-loop as the first implementation-track consumer**

Objective thay bằng:

> Prove the shared control layer on the most operationally demanding consumer **and** separate three concerns now fused in plan-loop: (a) a domain-neutral driver discipline shared by every coordination facade, (b) plan-driven track sequencing owned by plan-loop, (c) coding-cell policy owned by the coding domain and reusable by code-panel direct mode. plan-loop is a facade over (a)+(c), never the universal loop engine. No code, schema, entity, or runtime is added for (a).

Thêm vào "Work":

1. Author one shared driver-discipline fragment (skill `_shared`, canonical under `core/skills/_shared/`, rendered by `npm run build:skills`) from plan-loop §2–§5, architecture-panel's Driver Disposition/Resume/Bounds and `master-coordinator.md`; it defines the cycle, its invariants, and the named hook slots.
2. Author one coding-cell policy fragment (domain: coding) — worktree, proof tiers, independent doer verification, merge-after-explicit-close, tested/integrated identity — with no track/plan assumptions.
3. Rewrite plan-loop as track sequencing + hook values, loading 1 and 2.

Thêm vào "Exit":

- driver-discipline fragment contains no coding/track vocabulary (drift test: `git|worktree|merge|npm test|phase|plan.md` absent);
- coding-cell fragment usable for a single cell with no plan/track (checked against code-panel direct-mode scenario, read-only walk-through; code-panel rewrite stays Phase 6);
- plan-loop restates no rule owned by either fragment.

Thêm vào Phase 5 Exit:

- architecture-panel and fgos-panel generic presets consume the Phase 4 driver-discipline fragment **unchanged**; any required change edits the fragment and re-verifies plan-loop (two-unlike-consumer proof, V-012).

Thêm vào Phase 6 Work:

- direct mode = driver-discipline fragment + coding-cell fragment; no dependency on plan-loop for single-cell.

Thêm Risk map row:

| plan-loop becomes the de facto universal loop engine | high | shared driver fragment has zero domain vocabulary; architecture-panel consumes it unchanged in Phase 5; code-panel direct mode does not import plan-loop |

### 6.2 Hướng kiến trúc lý tưởng (không làm ngay)

- Sau Phase 6: nếu một bước của driver discipline lặp *identically và deterministically* ở cả ba consumer (ví dụ "disposition trước revise", "không close khi còn caveat"), mới chuyển nó xuống L2 dưới dạng blocker/`required` trong action view — không tạo module "loop driver".
- Phase 7 hoặc sau: tách/đổi tên pack ("group-thinking" → gated protocols, phân loại theo interaction pattern). Không làm trước vì pack id/version đang được pin, đụng replay.

### 6.3 Migration path

1. **Bây giờ (song song I12/I13, doc-only — plan cho phép "Documentation-only preparation may proceed earlier")**: sửa text Phase 4/5/6 + risk map như §6.1; thêm dòng vào `docs/platform/intent-preservation-ledger.md` (vision: generic driver layer; slice hiện tại: doctrine fragment, chưa code). Ghi `No component-boundary change` (chỉ skill layer).
2. **Trước khi mở Phase 4**: xác nhận D7 (DAG auto-close) có đúng intended không; nếu intended, fragment ghi rõ ngoại lệ; nếu không, là finding cho Phase 7 contract work — không sửa trong I12/I13.
3. **Phase 4**: fragment (a) → fragment (c) → rewrite plan-loop; sửa D6 trong lượt docs của phase (hoặc Phase 5 khi rewrite group-thinking).
4. **Phase 5**: architecture-panel + fgos-panel consume (a) unchanged.
5. **Phase 6**: code-panel direct = (a)+(c).
6. **Phase 7**: drift tests (vocab-free fragment, no duplicated driver rules in facades), pack naming decision.

### 6.4 Không đổi lúc này

- Kernel, `schema.mjs`, FlowDefinition schema, Assignment/Run/RunResult, dispatch, session store.
- Protocol YAML và pack membership/id.
- Bất kỳ persisted entity/ledger/track-state nào.
- Thứ tự I12 → I13 → Phase 4; không chen việc vào I12/I13.
- code-panel mode-selection rules; architecture-panel 9-role protocol.

## 7. Trả lời trực tiếp 9 câu hỏi

1. **Layered architecture**: L1 kernel → L2 control (action view/composers/templates) → L4 driver discipline (doctrine) → L5 facades + domain policy; L3 protocols là declared data cắm vào L1/L2 (§3).
2. **Định nghĩa generic loop layer ngay?** Có — tối thiểu = 1 doctrine fragment + hook table, không code. An toàn vì chỉ tách text đang tồn tại; V-011/V-008 không bị vi phạm.
3. **plan-loop là gì?** Implementation-track facade và là consumer đầu tiên chứng minh driver discipline. Không phải engine, không "cả hai tạm thời".
4. **code-panel ↔ plan-loop**: planned mode delegate plan-loop; direct mode dùng chung (a)+(c), **không** phụ thuộc plan-loop.
5. **architecture-panel**: driver discipline (L4) + protocol architecture-advisory (L3, qua pack gate) + architecture doctrine. Group-thinking protocol cho nó *hình dạng giao tiếp*; driver discipline cho nó *vòng quyết định*.
6. **Group-thinking own / never own**: §5.
7. **Minimal changes trước Phase 4**: §6.3 bước 1–2 (text plan + ledger + xác nhận D7). Không đụng skill trước Phase 4.
8. **Không đổi kernel/schema/runtime?** Được. Toàn bộ là plan text + skill fragments + skill rewrite đã nằm trong scope Phase 4/5/6.
9. **Rủi ro nếu giữ wording hiện tại**: (i) Phase 4 thu nhỏ plan-loop nhưng vẫn gộp (a)+(b)+(c) → Phase 5 viết lại driver discipline lần 2 trong architecture-panel → drift kép; (ii) Phase 6 import plan-loop cho coding-cell → plan-loop thành god-skill; (iii) research/business loops tương lai bị ép qua plan-loop (dính git/merge) hoặc copy nó; (iv) mục tiêu −60% token đạt bằng cách xoá judgment thay vì dời judgment; (v) câu "domain-agnostic" sai tiếp tục định hướng người đọc sai.

Rủi ro ngược (over-correction) cần tránh: tạo module/engine "loop driver", entity Track/Mission, hoặc scheduler — vi phạm non-goals của track và V-011.

## 8. Quyết định của owner (2026-09-26, sau thảo luận)

- D7: **không có ngoại lệ** — DAG auto-close là lỗi; thêm Unit I14 (code:implement) sau I13, là entry gate của Phase 4.
- Protocol `standalone-master-coordination-loop` → id đích `produce-review-revise`; đổi ở Phase 7, id cũ vẫn load được cho replay (256 session đang tham chiếu, loader chưa có alias).
- `fgos-plan-loop` + `fgos-code-panel` gộp thành **một** facade coding `fgos-code-change` ở Phase 6 (1 thay đổi = plan 1 cell; plan mode là reference file). `fgos-code-implement` bị loại vì trùng gần với `fgos-coding-implement`. Phase 4 viết lại plan-loop tại chỗ, chỉ rename một lần.
- `fgos-group-thinking` không phải skill thảo luận; gộp vào `fgos-panel` ở Phase 5, gate giữ trong code.
- Tên cũ giữ làm stub deprecated tới hết compatibility window Phase 7.
- Áp dụng vào: track `plan.md` (Goal, Architecture § "Layering above the control layer", Phase 4–7, Unit I14, risk map) và `docs/platform/agent-coordination/intent-preservation-ledger.md` (AC-I010). No component-boundary change (chỉ tầng skill/doctrine).

## Câu hỏi còn mở

- Tên file fragment (`_shared/coordination-driver.md` hay tương tự) chốt khi thi công Phase 4.
- Pack `group-thinking` đổi id thành gì — quyết ở Phase 7.
