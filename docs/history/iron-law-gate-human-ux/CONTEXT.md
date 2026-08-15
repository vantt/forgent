# Iron Law gate — UX cho con người (`tsk-1y6`)

Nguồn thảo luận: `DISCUSSION.md` cùng thư mục (8 vòng, `refs` của item trỏ
vào `#tasks`). File này là bản khoá quyết định cho planning đọc.

`impact-analysis: degraded` — `fgos tool query` trả `gitnexus` `status:
present`, nhưng index đang stale (last indexed `7bb3231`, HEAD đã đi xa
hơn). Blast radius do GitNexus báo có thể lỗi thời; mọi phát hiện trong
file này đến từ `rg`/đọc file trực tiếp, không từ GitNexus.

## Ranh giới tính năng

**Trong scope.** Cách cổng Iron Law tương tác với con người: hỏi ở ranh
giới nào, ai gõ lệnh sau khi người đã quyết, có cần gạt hạ cấp không, và
một câu hỏi treo có được phép nghẽn item khác không.

**Ngoài scope, đã loại tường minh.**

- Mọi thay đổi lên nửa từ-khoá của `classifyIronLaw` (D6) → `tsk-1js`.
- Làm Iron Law có nghĩa với project khác dùng fgOS (D6) → `tsk-1js`.
- Cơ chế đo precision từng tín hiệu → `tsk-1js`.
- Field bypass trên workitem (D4).
- Gộp ba bản copy-paste của gate thành helper chung — đã có item backlog
  riêng.
- Thêm cạnh FSM `awaiting-approval → awaiting-human` (D5).

## Vì sao heading dưới đây giữ tiếng Anh

`src/intake/plan.mjs:159` slice bảng quyết định bằng regex literal
`/##\s*Locked decisions/i`. Dịch heading làm `lockedDecisionIds` rỗng, và
ba guard tắt im lặng thay vì báo lỗi — kiểm citation D-ID của child
(`:198`), `findUncoveredLockedDecisions` (`:344`), và trích footprint từ
cùng slice. Ghi chú này cố ý nằm NGOÀI slice: mọi đường dẫn nêu bên trong
slice đó bị `findUncoveredLockedDecisions` đọc thành "file một quyết định
đòi hỏi", nên nhắc `plan.mjs` bên trong sẽ sinh advisory giả.

## Locked decisions

| D-ID | Quyết định |
|------|-----------|
| D1 | Cổng Iron Law chỉ chạy khi merge target **là trunk**. Leaf→`fgw/<root>` và `sync-root` vào nhánh cha đi thẳng, không hỏi. |
| D2 | Người **quyết định**, agent **thao tác**. Người trả lời duyệt trong chat là đủ; agent chạy lệnh, đọc exit code, tự sửa lỗi cơ học, tự retry. |
| D3 | Hai mức `ask` (mặc định, hành vi khi không cấu hình gì) và `warn` (opt-in → in cảnh báo, ghi log, merge tiếp). Key config **riêng**, không nhét vào `gateBypass`. |
| D4 | **Không** làm field bypass trên workitem. |
| D5 | Item bị chặn **không nghẽn** item khác, nhưng cơ chế là *bỏ qua và đi tiếp* ở tầng skill; item ở nguyên `awaiting-approval`. Không `fgos ask`, không `awaiting-human`, không `/fgOS:answer`. |
| D6 | Nửa từ-khoá **ra khỏi scope** item này, chuyển thành phụ thuộc `tsk-1js`. |
| D7 | Key config là `{"ironLaw": {"level": "ask"}}`, hai giá trị `ask`/`warn`, đăng ký check+fix vào `src/setup/registrations.mjs` theo khuôn `gateBypass`. |
| D8 | Ở mức `warn`, mỗi lần bỏ qua ghi một bản ghi `decision` với **`kind: engine`**. Không khai loại sự kiện mới. |
| D9 | **Một** skill `/fgOS:approve` bọc cả `approve` lẫn `sync-root`, tự suy verb từ id; **bắt buộc trình bán kính** (verb nào, gốc nào, bao nhiêu con đi kèm) trước khi hỏi người. |

Lý do đầy đủ của từng D-ID nằm trong `DISCUSSION.md` §4 và trong
`view.decisions` của item (`fgos list --id tsk-1y6 --json`), seq
17694/17695/17730/17731/17732/17742/17870/17871/17872.

## Thuật ngữ đã ghim

- **trunk** — nhánh chính thật của repo, theo `detectTrunk(repoRoot)`
  (`src/runner/merge.mjs`). Không đồng nghĩa "nhánh cha": một gốc có
  `parent` thì target của nó là `fgw/<parent>`, không phải trunk.
- **nửa module / nửa từ-khoá** — hai phép thử độc lập bên trong
  `classifyIronLaw`: `matchedModules` (khớp đường dẫn với `MODULE_RULES`)
  và `matchedFlags` (quét `HEAVY_KEYWORDS` trên `description`).
  `required` là phép HOẶC của hai cái.
- **bán kính (D9)** — số item thật sẽ land lên trunk trong một lần duyệt.
  Với `approve` là 1; với `sync-root` là cả cây con đã hấp thụ vào gốc.
- **mức `ask`/`warn`** — giá trị của `ironLaw.level`, không liên quan và
  không tái dùng `gateBypass.level`.

## Bằng chứng scout

Mọi dòng dưới đây đã **kiểm lại sau khi merge `main`** (62 commit mới,
merge commit `b1f57afd`, `npm test` 3333 pass / 0 fail) — không dùng lại
số liệu vòng scout đầu.

| Phát hiện | Nguồn |
|---|---|
| Gate bắn ở ba nơi, logic lặp gần nguyên văn | `bin/fgos.mjs:2487` (`wouldTripIronLaw`), `:3494` (`approve`), `:4100` (`sync-root`) |
| Gate không nhìn merge target dù đã có sẵn biến | `approve` tính `rootBranchForIronLaw` rồi vẫn classify; `sync-root` tính `targetBranch = item.parent ? branchNameFor(item.parent) : detectTrunk(repoRoot)` rồi cũng vậy |
| Three-dot diff → nửa module bắt lại 100% ở trunk | `src/runner/merge.mjs:440` (`diff --name-only ${trunk}...${branch}`) |
| `MODULE_RULES` đóng cứng, không có mặt cấu hình | `src/evolve/iron-law.mjs`; grep `src/`+`bin/` không caller nào truyền rule vào |
| `/fgOS:approve` **không tồn tại** | `plugins/fgOS/skills/` không có `approve/`, trong khi `merge-loop/SKILL.md:101` và `merge-next/SKILL.md` đều trỏ người tới nó |
| FSM chỉ có hai cạnh vào `awaiting-human` | `src/state/status-fsm.mjs:146-147` (`todo→`, `doing→`) — không có từ `awaiting-approval` |
| Engine đã park-và-đi-tiếp; skill không đọc | `bin/fgos.mjs:2557-2567` trả `skipped` / `every ready item is blocked`; grep `merge-loop/SKILL.md` chỉ khớp chữ "skipped" ở dòng 145/295, đều là dùng thông thường, không phải field của engine |
| Khuôn đăng ký config check/fix | `src/setup/registrations.mjs:884-931` (`id`/`key`/`check`/`fix` của `gateBypass`) |
| `gateBypass` floor cố ý không chạm Iron Law | `docs/explanation/gate-bypass-design.md` (D4) |
| Iron Law **không** nằm trong platform-foundations | grep `docs/platform-foundations.md` — không khớp; RUL34/RUL37 ở `docs/specs/runner.md`, truy về `D16/D17 self-improve-loop` |
| Tiền lệ một skill dispatch hai verb | `merge-next/SKILL.md` — nhánh `approve` và nhánh `syncRoot: {id, outcome}` (tsk-173) |
| Ba chân skill | `test/skills/fgos-mirror.test.mjs:10-43` — `.agents/skills` canonical cho 14 dev-skill, `.claude/skills` sinh bởi `npm run build:skills`, `plugins/fgOS/skills/` giữ ~35 skill bọc-CLI |
| `fgos decision` **không có** flag `--kind` | `src/cli/command-registry.mjs` — chỉ vài verb tự set `kind` bên trong (vd `driver-report` khai `source: driver-report, kind: engine` ở `:530`); `addDecision` mặc định `kind: design`. **Hệ quả cho D8:** bản ghi mức `warn` phải do engine viết trực tiếp qua `addDecision` với `kind: 'engine'` — KHÔNG được shell ra `fgos decision`, vì đường đó không đặt được kind và sẽ tái tạo đúng lỗi mà backlog đang mở (bản ghi máy-ghi bị cổng retrospective đọc nhầm thành người-suy-ngẫm) |

Số liệu định lượng (đo trên 250 bản `docs/history/*/iron-law-evidence*.md`,
parse được 204): chỉ-module 138 (68%), chỉ-từ-khoá 42 (21%), cả hai 24
(12%). Đây là cơ sở của D6 — chi tiết trong `DISCUSSION.md` §1.

## Tham chiếu chuẩn

- `docs/specs/runner.md` — RUL34, RUL37 (Iron Law), RUL45 (untrusted input)
- `docs/specs/work-state.md` — bảy loại sự kiện, cơ sở của D8
- `docs/explanation/iron-law-evidence-contract-stays-human-gated.md` —
  lý lẽ "second, independent party actually looking at it" mà D2 dựa vào
- `docs/explanation/gate-bypass-design.md` — D4 floor, cơ sở của D3/D7
- `docs/history/tsk-5t3-iron-law-evidence-contract/` — hợp đồng
  `docs/history/<id>/iron-law-evidence.md`, nguồn bằng chứng cho D5/D9
- `AGENTS.md` — install/setup/doctor gate (D7 phải đăng ký vào doctor);
  ưu tiên #2 "Release con người" (cơ sở của D5)

## Outstanding questions

None
