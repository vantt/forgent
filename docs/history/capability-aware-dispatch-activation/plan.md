# Capability-aware dispatch activation — plan

Mode: high-risk

Flags: external provider (hard gate), public instruction contract, existing covered behavior, weak runtime proof for skill prose. Một lane nhỏ hơn không trung thực vì thay đổi activation quyết định một coding request có được giao ra executor ngoài hay không, dù resolver và execution transport không đổi.

## Objective

Ship lát instruction-first đã khóa trong D1-D5: một agent gặp coding execution phải dùng canonical `code:implement`, hỏi `decide` trước khi làm; planner phải nhận diện capability cho execution unit; capability resolution và executor/provider/model policy hiện tại giữ nguyên.

Dispatch capability: `code:implement`

## Approach

1. Bổ sung `code:implement` vào curated capability defaults dưới dạng portable slot không pin executor; live project config ánh xạ slot mới tới cùng executor/overrides đang phục vụ `fgos-coding-implement`. Giữ key cũ trong lát migration để các đường `--work` hiện hữu không gãy (D1, D4).
2. Đổi shared prose từ “caller đã quyết định dispatch rồi mới hỏi decide” sang “trước một executable unit, chọn canonical capability và hỏi decide; `unavailable` mới là đường inline”. Giữ nguyên ba mechanism và nguyên tắc direct primitive tool calls không phải một execution unit mới (D2, D4).
3. Đưa awareness ra bề mặt được package cài cho project khác, không chỉ root `AGENTS.md` của repo dogfood. Dùng skill/instruction surface hiện có; không thêm daemon, classifier hay dispatch selector mới (D2, D4).
4. Cập nhật planning guidance: mỗi independently executable piece phải ghi đúng một canonical dispatch capability; capability boundary là tín hiệu split, không phải luật xé nhỏ; plan không ghi executor/provider/model (D3, D5).
5. Cập nhật coding implementation guidance dùng `decide --for code:implement` thay cho `decide --work <id>` ở activation step. Work vẫn được dùng cho lifecycle/prompt/return, nhưng không làm dispatch identity (D1, D2).
6. Đồng bộ byte-identical các skill/shared fragment dưới `.agents` và `plugins/fgOS`, cập nhật runner spec, end-user-visible changelog, config/setup doctor coverage và các test tĩnh/behavior hiện có.

## Alternatives rejected

- Giữ `fgos-coding-implement` làm capability: bác vì tên gắn skill/lifecycle, trái D1.
- Dùng `implement-item` hoặc tên task làm purpose: bác vì biến thiên theo workflow/task instance.
- Sửa `decide --work` resolver hoặc thêm `--domain/--operation`: ngoài lát instruction-first D4; `decide --for` đã đủ.
- Chỉ sửa root `AGENTS.md`: bác vì package không ship file đó sang project dùng fgOS, chỉ giúp mission dogfood.
- Thêm capability vào Work/child schema hoặc mutation receipt: hoãn theo D4 cho tới khi có evidence instruction bị bypass.

## Risk map

| Area | Risk | Validation proof point |
|---|---|---|
| Capability config/default merge | High: project config có thể thiếu slot hoặc `prefer` trỏ executor không tồn tại | Load config fixture, setup fill-missing test, `decide --for code:implement` trên configured/unconfigured fixtures. |
| Activation prose | High: agent có thể tiếp tục hiểu là decide-before-dispatch | Positive/negative prose checks; validating review đối chiếu D2; post-merge smoke scenario là bằng chứng runtime trung thực. |
| Planning prose | Medium: capability có thể bị hiểu thành task name hoặc mảng requirements | Check canonical singular `code:implement`, explicit no executor pin, và boundary rule trong cả hai mirrors. |
| Existing Work dispatch | Medium: đổi đường skill có thể vô tình phá runner/headless | Giữ capability cũ, không sửa resolver; full `npm test`. |
| Distribution | Medium: source/mirror lệch hoặc awareness chỉ sống trong repo | `cmp` mirrors, packaging/setup tests, xác nhận new/updated skill nằm trong package `files` hiện hữu. |
| Live `.fgos/config.json` | High operational boundary: worker branch không được chạm `.fgos` | Thực hiện activation config tại main checkout qua config path được phép, tách khỏi branch diff; doctor/config-load xác nhận. |

Impact-analysis posture: inactive theo `fgos tool query --capability impact-analysis --status present`; không dùng blast-radius graph làm proof. GitNexus CLI vẫn được dùng tại symbol-edit gate và pre-commit theo repo instruction.

## Expected footprint

- `.agents/skills/_shared/executor-dispatch-fallback.md`
- `plugins/fgOS/skills/_shared/executor-dispatch-fallback.md`
- `.agents/skills/fgos-coding-planning/SKILL.md`
- `plugins/fgOS/skills/fgos-coding-planning/SKILL.md`
- `.agents/skills/fgos-coding-implement/SKILL.md`
- `plugins/fgOS/skills/fgos-coding-implement/SKILL.md`
- A packaged capability-awareness skill/instruction under `.agents/skills/` and its plugin mirror, if validating confirms this is the smallest distributable entry surface
- `src/setup/registrations.mjs`
- Relevant setup/dispatch/skill-wrapper tests
- `docs/specs/runner.md`
- `CHANGELOG.md`
- `.fgos/config.json` on main checkout only, never in the worker branch
- `docs/history/capability-aware-dispatch-activation/plan.md`

## Shape

One honest piece. The capability slot, activation wording, planning wording and implementation wording form one behavioral contract: splitting them would temporarily teach agents to emit an unregistered capability or register a capability no instruction uses. Hard enforcement remains a separate evidence-triggered follow-up, not a child of this item (D4).

## Verification cases

- Configured `code:implement` resolves through existing `decide --for` to the configured executor without changing mechanism semantics.
- Unconfigured `code:implement` returns the existing unavailable/fallback behavior.
- Existing `fgos-coding-implement` and `decide --work` compatibility tests remain green during migration.
- Planning prose requires one canonical dispatch capability per independently executable piece and forbids executor/provider/model pinning.
- Implementation prose uses `decide --for code:implement`, not `decide --work`, for executor selection.
- Shared and plugin mirrors are byte-identical.
- No source change introduces a Work, stage, flow or task-name dependency into capability identity.

## Verify

```bash
npm test && grep -q 'code:implement' .agents/skills/fgos-coding-planning/SKILL.md && grep -q 'decide --for code:implement' .agents/skills/fgos-coding-implement/SKILL.md && ! grep -q 'decide --work <id> --has-live-task-access' .agents/skills/fgos-coding-implement/SKILL.md && cmp .agents/skills/_shared/executor-dispatch-fallback.md plugins/fgOS/skills/_shared/executor-dispatch-fallback.md && cmp .agents/skills/fgos-coding-planning/SKILL.md plugins/fgOS/skills/fgos-coding-planning/SKILL.md && cmp .agents/skills/fgos-coding-implement/SKILL.md plugins/fgOS/skills/fgos-coding-implement/SKILL.md && ! git diff --name-only main...HEAD | grep -q '^src/runner/dispatch/'
```

Runtime prose comprehension is not claimed by this shell verify. After merge, run two documented fresh-session smoke prompts: one direct implementation request and one plan containing implement/review units; inspect dispatch events for the emitted canonical capability. A failure becomes evidence for the deferred hard-enforcement follow-up (D4).

## Assumptions

- The package's existing `.agents`/plugin skill discovery is the intended distributable prose surface; validating must confirm exact trigger coverage before implementation.
- Keeping `fgos-coding-implement` during the first migration slice is compatible with D1 because it is retained only for existing callers, not taught as the new canonical identity.

## Outstanding questions

None

## Validation result

Verdict: **READY WITH CONSTRAINTS**.

| Concern | Evidence from the current repo | Result |
|---|---|---|
| Can `domain:capability` use the current resolver? | `validateCapabilitiesShape` validates each map entry but does not constrain the key vocabulary; `resolveExecutorAndOverrides` performs an exact lookup at `cfg.capabilities[executorIdOrPurpose]`. | Ready; no resolver change. |
| Is awareness distributable? | `package.json` ships `.agents`; `build-skill-wrappers.mjs` generates host wrappers and mirrors every `fgos-*` skill plus `_shared` into `plugins/fgOS/skills`. Root `AGENTS.md` is not the install surface. | Add one thin `fgos-capability-dispatching` skill and plugin mirror; root prose is dogfood guidance only. |
| Is a new skill smaller than broadening `fgos-coding-implement`? | `fgos-coding-implement` is explicitly stage-bound to one claimed item at `executing`; making it trigger on raw coding requests would recreate the lifecycle coupling this item removes. | New awareness skill is the smallest honest entry surface. |
| Will setup and doctor discover the new slot? | `DEFAULT_CAPABILITY_SLOTS` is merged through the existing `runner` config registration; `config-not-stale` catches a missing default while the dedicated capability check catches malformed present slots. | Extend the default and rename/generalize the dedicated check and its tests to cover all curated slots. |
| Can prose guarantee every agent asks dispatch? | The existing hook guards Agent/Task calls only; direct file edits have no mutation guard. Skill prose can establish the default behavior but cannot prove universal compliance. | First slice remains an experiment. Do not claim hard enforcement; use fresh-session smoke evidence after merge. |
| Does the plan preserve lifecycle boundaries? | Only the implementation skill's executor-selection step changes to `decide --for code:implement`; work id remains in claim, prompt, verification and return paths. | Ready; Work remains lifecycle context, not dispatch identity. |

Constraints carried into execution:

1. The first awareness catalog contains the canonical coding implementation capability `code:implement`; it may explain the generic `capability` / `domain:capability` grammar but must not invent or infer unregistered capability names.
2. The awareness skill must say that one independently executable unit triggers one `decide --for <canonical-capability>` call; primitive reads/searches used inside that unit do not recursively dispatch.
3. Live `.fgos/config.json` activation remains a main-checkout operation outside the worker commit. The branch only ships the portable empty-preference default.
4. Runtime compliance is post-merge smoke evidence, not part of the deterministic shell proof and not a claim of this change.
