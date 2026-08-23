# Sơ đồ điều phối coding-domain: submit → done

Task: nghiên cứu (đọc file thật, không đoán) end-to-end coordination từ
`/fgOS:submit` tới `done`, liệt kê component/skill/verb, ai gọi ai, file:line.
Canonical source cho mọi skill: `.agents/skills/<name>/SKILL.md` —
`.claude/skills/<name>/SKILL.md` chỉ là generated wrapper (tsk-1qi D5/D7),
mọi trích dẫn dưới đây dùng đường dẫn canonical (trừ `plugins/fgOS/skills/`,
đó là launcher layer riêng, không có bản wrapper).

## 1. Init — trước khi item tồn tại

| Bước | Component | Hành động/quyết định | Gọi tiếp | Rẽ nhánh |
|---|---|---|---|---|
| 1a | `plugins/fgOS/skills/submit/SKILL.md` (bước 1-3) | Đọc `$ARGUMENTS`, scan `fgos list --json` tìm dependency candidate, hỏi người confirm/edit/reject nếu có match | — | có candidate → hỏi người; không → bước 1b |
| 1b | `plugins/fgOS/skills/submit/SKILL.md:105-138` (bước 4) | **Chỉ khi live interactive session** (gate ở dòng 108-116), gọi `fgos-clarifying` trên raw text | invoke skill `fgos-clarifying` | no-soul caller (cron/replay/delegate) → skip thẳng bước 1d |
| 1c | `.agents/skills/fgos-clarifying/SKILL.md` (Flow, dòng 104-136) | Đọc text, phán intent rõ/không rõ (2 outcome), phân loại `domain` qua `Object.keys(DOMAINS)` (`src/state/workflow-stage-graphs.mjs`). Không bao giờ gọi verb nào — verdict-only | trả `{title?, description?, domain, question?}` về caller (`submit/SKILL.md`) | `question` có → dừng, hỏi người NGAY trong hội thoại (chưa có id để park), fold câu trả lời vào text, gọi lại `fgos-clarifying` |
| 1d | `plugins/fgOS/skills/submit/SKILL.md:140-186` (bước 5) | Gọi engine verb thật | `node bin/fgos.mjs submit "<text>" [--deps ids] [--domain <domain>] --dir "$root"` | — |

Item được tạo, `stage: discovery` (mặc định `stages[0]`,
`src/state/workflow-stage-graphs.mjs:105`), `tier/kind/risk` là placeholder
cơ học (D12) — chưa phải phán thật.

## 2. Routing — session mở, claim item, chọn skill theo stage

| Bước | Component | Hành động | Gọi tiếp | file:line |
|---|---|---|---|---|
| 2a | `.agents/skills/fgos-routing/SKILL.md` (Orient) | `fgos list`/`fgos ready` — đọc trạng thái, read-only | — | dòng 27-34 |
| 2b | `fgos-routing` (Claim) | `fgos take --role session [--id <id>]` — claim 1 item qua pull door | verb `take` | dòng 98 |
| 2c | `fgos-routing` (Route by stage) | Đọc `stage`/`domain` của item, resolve skill qua registry — **không hardcode tên** | `skillForStage(getDomain(domain), stage)` từ `src/state/workflow-stage-graphs.mjs` | dòng 133-138 |
| 2d | `fgos-routing` (Precedence) | Xác nhận: routing chỉ là judgment CHỌN skill, không có quyền tự chuyển stage — engine verb luôn thắng | — | dòng 186-198 |

Bảng resolve thật (nguồn `src/state/workflow-stage-graphs.mjs:238-245`,
`skillMap`):

```
discovery     -> fgos-coding-discovering
exploring     -> fgos-coding-exploring
decompose     -> fgos-coding-planning   (legacy alias, drain-only)
planning      -> fgos-coding-planning
executing     -> fgos-coding-implement
retrospective -> fgos-coding-compounding
```

`planning` là MỘT stage duy nhất trong data; "shaping" vs "proving" là
judgment riêng của `fgos-routing` (dòng 148-150): sau khi
`fgos-coding-planning` viết xong `plan.md`, `fgos-routing` tự route tiếp
sang `fgos-coding-validating` — đây KHÔNG phải một entry riêng trong
registry, mà là session-side layering.

## 3. `fgos-coding-driving` — vòng lặp cơ học chạy stage-by-stage

`.agents/skills/fgos-coding-driving/SKILL.md` là driver dùng chung cho
`/fgOS:cook`, `/fgOS:pick`, mọi sweep discovery/planning/execution — KHÔNG
tự router lần 2, luôn đọc lại đúng registry `fgos-routing` dùng
(`getDomain`/`skillForStage`, Hard rules dòng 38-42).

Loop chính (dòng 300-440), tóm tắt:

```
loop:
  đọc {stage, status, domain, holder} FRESH (fgos list --id <id> --json)
  parkReasonForStatus == 'human-question' (awaiting-human) -> STOP, trả câu hỏi
  parkReasonForStatus == 'system-error'   (blocked)        -> STOP, trả block
  parkReasonForStatus == 'natural-finish' (awaiting-approval) AND không có ceiling -> STOP (default)
  openChildren (parent==id, chưa terminal) non-empty -> STOP, anchored-by-open-children
  ceiling stage:<name> hoặc status:<name> đạt -> STOP
  skill = skillForStage(domain, position)
  skill == null -> STOP (position cơ học, vd cleanup)
  [nếu tới executing lần đầu] claim (fgos pick + EnterWorktree, hoặc fgos take nếu worktreeBacked:false)
  invoke skill   <- skill TỰ chạy Socratic/shape/implement + TỰ gọi engine verb
  đọc lại {stage, status} FRESH
  không đổi gì -> STOP no-progress
  quay lại loop
```

- Ceiling check LUÔN trước khi invoke (dòng 51-54).
- Driving loop KHÔNG BAO GIỜ tự apply chuyển stage/status — luôn để
  stage-skill được invoke tự gọi verb của nó (dòng 43-50).
- `awaiting-approval` là ceiling mặc định, override được, nhưng không
  launcher nào trong `plugins/fgOS/skills/**` được set ceiling vượt qua
  merge gate — convention giữ merge làm quyết định người (dòng 101-113).

## 4. Mỗi stage-skill tự gọi verb nào để chuyển chính nó

Đây là chỗ trả lời "task gọi skill hay skill gọi task/verb" — skill tự
đọc task-spec (contract) rồi tự gọi verb (hành động).

| Stage | Skill (canonical) | Verb tự gọi | file:line |
|---|---|---|---|
| discovery | `.agents/skills/fgos-coding-discovering/SKILL.md` | `fgos discover --verdict <clear|unclear>` | dòng 88-89 (định nghĩa), verdict quyết định cạnh: dòng 22 |
| exploring | `.agents/skills/fgos-coding-exploring/SKILL.md` | `fgos discover --verdict clear` (khi CONTEXT.md gate auto-approve) rồi chuyển thẳng sang `fgos-coding-planning` | dòng 485-491 |
| planning (shaping) | `.agents/skills/fgos-coding-planning/SKILL.md` | **KHÔNG tự gọi `fgos plan`** — chỉ viết `plan.md`, hand-back qua `fgos decision` | dòng 25 (`fgos decision`); verb `fgos plan` bị bỏ ngỏ cho `fgos-coding-validating` |
| planning (proving) | `.agents/skills/fgos-coding-validating/SKILL.md` | `fgos plan --verdict <...>` — chính session gọi TRỰC TIẾP sau khi Gate approve, không chờ call mù sau này | dòng 105-116 (đặc biệt dòng 109, 115) |
| executing | `.agents/skills/fgos-coding-implement/SKILL.md` | `fgos return <id>` | dòng 73 (nguyên tắc), dòng 279 (lệnh thật), dòng 334 (kết quả) |
| retrospective | `.agents/skills/fgos-coding-compounding/SKILL.md` | `fgos compound <id> --doc-type ... --doc-path ...` (bước 4, dòng 164-169) rồi `fgos move <id> --to cleanup` (bước 6, dòng 190-197) | — |

**Điểm bất ngờ đáng ghi chú:** `fgos-coding-planning` (task-spec
`shape-plan.md`) tự nó KHÔNG gọi `fgos plan`. Nó chỉ lock shape/children
vào `plan.md`. `fgos-coding-validating` (task-spec `validate-plan.md`) mới
là nơi thực sự bắn `fgos plan --verdict ...` sau khi Gate của chính nó
approve — lý do ghi rõ ở dòng 109-116: gọi ngay lúc này để tránh một
"blind later call" phải spawn lại subprocess judge đã bị retire.

## 5. Dispatch mechanism — điều phối "capacity nào chạy việc" (khác trục với stage routing)

`src/runner/dispatch.mjs` trả lời câu hỏi khác: không phải "item đi tiếp
stage nào" mà "lệnh Agent/Task-tool này nên chạy in-process hay
out-of-process hay unavailable".

- `decideDispatchMechanism` (dòng 1149-1152): `!hasNativeMechanism` →
  `out-of-process`; `forceCliSpawn` → `out-of-process`; còn lại
  `hasLiveTaskAccess ? 'in-process' : 'out-of-process'`.
- `decideCapacityCli` (dòng 1846+, entrypoint CLI `dispatch.mjs decide`):
  resolve `capacityId` từ arg trực tiếp, hoặc `--work <id>` (qua
  `capacityIdForWork`), hoặc `--for <purpose>` (qua
  `resolveCapacityIdForPurpose`), hoặc `--needs-soul` fallback về native.
  Không tìm thấy gì và không `needsSoul` → `{mechanism: 'unavailable'}`
  (dòng 1910) — hợp lệ, không phải lỗi.
- `hasExplicitCapacity` check (dòng 1886-1890): item resolve qua `--work`
  mà KHÔNG có `cfg.capacities` entry tường minh → mặc định về native
  dispatch (Native-First Dispatch Doctrine, `docs/decisions/0026`), khác
  với path `--for <purpose>` (mặc định `out-of-process` khi không có
  capacity — giữ hành vi pre-D4 y nguyên).

**PreToolUse hook** (theo `AGENTS.md`) tự chạy `decide` trước mọi
Agent/Task-tool call và refuse nếu kết quả khác `in-process` — đây là điều
phối tầng RUNTIME, tách biệt hoàn toàn với stage-routing tầng 2-4 ở trên.

## 6. Merge/approve — quyết định người, verb thực thi

`plugins/fgOS/skills/approve/SKILL.md`:

- **D2** (dòng 27): người quyết định trong chat ("yes"), skill tự chạy
  lệnh, đọc exit code, tự fix lỗi cơ học và retry — không bao giờ in lệnh
  ra cho người tự gõ.
- Skill tự suy luận cần verb nào (bảng dòng 85, 103):
  - `fgos approve <id>` — item thường, chưa có children đang mở.
  - `fgos sync-root <id>` — item là root có branch `fgw/<id>` đi trước
    target của nó (mọi child đã merge vào root branch); **không đổi
    status/stage của root**.
- Cả hai verb refuse cứng nếu chạy từ linked worktree (dòng 38-40) — chỉ
  chạy từ main checkout.

Đây là ranh giới `awaiting-approval → delivered` — driving loop
(mục 3) không bao giờ tự vượt qua ranh này (convention dòng 101-113 ở
`fgos-coding-driving`).

## 7. Retrospective → compound-learn → indexing → cleanup

| Bước | Component | Verb/hành động | file:line |
|---|---|---|---|
| 7a | `plugins/fgOS/skills/retro-next/SKILL.md` | Sweep mọi `delivered` → `retrospective`: `fgos retrospective --dir "$root"` | dòng 55 |
| 7b | cùng skill | Pick 1 item (`pickNextRetrospectiveItem`, FIFO), resolve skill qua registry `skillForStage(getDomain(domain), 'retrospective')` → `fgos-coding-compounding` cho domain `coding` | dòng 108-112 |
| 7c | cùng skill | Gọi `fgos-coding-driving` với `ceiling: status:cleanup` (không vượt merge gate, TTL-gate cleanup để `/fgOS:cleanup-next` lo) | dòng 100-107 |
| 7d | `.agents/skills/fgos-coding-compounding/SKILL.md` | 6 bước: gather (`fgos check <id>`) → classify quadrant → viết doc → `fgos compound <id> --doc-type ... --doc-path ...` → confirm (`fgos check <id>` lại) → `fgos move <id> --to cleanup` | dòng 78, 84, 96, 164-169, 182, 190-197 |
| 7e | `plugins/fgOS/skills/cleanup-next/SKILL.md` | Pick item TTL-ready (`pickNextCleanupItem`), chạy `fgos cleanup <id> --dir "$root"` | dòng 45-53, 81 |

**Gap tìm thấy (không suy diễn thêm):** `fgos-indexing` SKILL.md tự mô tả
"Run this once, right after step 4/5 of `fgos-coding-compounding`", NHƯNG
grep toàn bộ `.agents/skills/` và `plugins/fgOS/skills/` không thấy bất kỳ
skill nào (kể cả `fgos-coding-compounding` chính nó, kể cả `retro-next`)
thực sự gọi tên `fgos-indexing` như một bước trong Flow của mình.
`fgos-coding-compounding/SKILL.md`'s 6 bước dừng ở bước 6 (`fgos move
... cleanup`), không có bước nào invoke `fgos-indexing`. → **cần hỏi
user/đọc thêm CONTEXT.md lịch sử của `fgos-indexing` để xác nhận đây là
gap thật hay mình đọc thiếu chỗ khác.**

## 8. Nguồn sự thật cho mọi lookup ở trên

`src/state/workflow-stage-graphs.mjs`:
- `stages` (dòng 105): `['discovery','exploring','decompose','planning','executing']`
- `skillMap` (dòng 238-245): stage → skill
- `taskSpecMap` (dòng 254-260): stage → task-spec contract
- `DOMAINS` (dòng 464+): registry cho mọi domain (`coding`, và 3 domain
  khác — `synthetic`/`triage`/`fixture-marketing`, mỗi domain có
  `stages`/`skillMap` riêng, không dùng chung bảng coding)

## Câu hỏi chưa giải quyết

1. `fgos-indexing` — chưa tìm được call site thật gọi nó (mục 7, gap).
   Cần hỏi user hoặc tìm trong `docs/history/` xem có launcher/hook nào
   khác gọi ngoài phạm vi 2 thư mục skills đã grep.
2. Chưa verify `fgos sync-root`/`fgos approve` implementation ở
   `src/` (chỉ đọc skill prose, chưa đọc code verb thật) — nếu cần độ
   chính xác cao hơn cho phần merge, nên đọc thêm `bin/fgos.mjs` case
   `approve`/`sync-root`.
