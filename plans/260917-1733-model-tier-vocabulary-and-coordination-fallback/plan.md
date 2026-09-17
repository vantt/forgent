# Model-tier vocabulary migration + code-panel equivalent-tier fallback

Status: in progress
Branch: dedicated worktree, merge to main on close

## Outcome

1. Đổi vocab model-tier từ 5 mức (`lightweight|standard|creative|analytical|critical`)
   sang 6 mức (`nano|mini|standard|advanced|flagship|frontier`) theo
   `plans/260916-account-rotator/design.md`'s "Tier vocabulary" section — lossless,
   dùng đúng model thật hiện có, không đoán model chưa xác nhận tồn tại.
2. Cho `fgos-code-panel`'s 3 role (doer/fixer, reviewer, red-team) real fallback —
   khi primary executor lỗi/hết quota, tự retry sang executor khác cùng modelTier —
   bằng cách nối `actors[].fallbackExecutors` vào cơ chế Provider Capacity Rotator
   fallback đã có sẵn (account-rotator track), không xây retry mới.

## Quyết định đã chốt (2026-09-17)

- Mapping tier cũ → mới: `lightweight→nano, standard→standard, creative→advanced,
  analytical→flagship, critical→frontier`. `critical→frontier` (không phải
  `flagship`) vì gemini's `analytical`(`pro-low`) và `critical`(`pro-high`) là 2
  model THẬT khác nhau — gộp vào cùng 1 slot sẽ mất phân biệt đó.
- Fallback: build thật (không chỉ khai tĩnh) — nhưng sau khi audit code, "build
  thật" ở đây nghĩa là NỐI vào `fallbackExecutors`/Provider Capacity Rotator đã có
  sẵn và đã test kỹ (`assignment-dispatch.test.mjs`), không viết retry loop mới.

## Phase 1 — Tier vocabulary rename (lossless)

Nguồn: agent scan chính xác (loại false-positive khỏi grep thô ~150 file xuống còn
15 file thật).

### src/ (4 file)

- `src/runner/dispatch/config.mjs`: `MODEL_POLICY_TIERS` (L473), `DEFAULT_TIER_TO_POLICY`
  (L478: `light→nano, standard→standard, heavy→frontier`), seed `modelPolicies.claude`
  default (L197-201), comment "5-tier"→"6-tier".
- `src/runner/definitions/schema.mjs`: `MIN_TIER_VALUES` (L29) — đây là enum
  `actors[].tier`/PolicyPatch's `minTier` dùng trực tiếp.
- `src/runner/dispatch/assignment-policy.mjs`: `TIER_STRENGTH` (L31-37, thêm rank
  `mini`), `QUALITY_TIER_BRIDGE` (L58-64, rename key giữ value), literal
  `'analytical'` dùng làm floor cho high-risk work (L159-160) → `'flagship'`.
- `src/setup/registrations.mjs`: `PI_EXECUTOR_DEFAULT.rigorOverrides` (L1798-1800,
  value → `'nano'`), seed `modelPolicies['openai-codex']` (L1812, key → `nano`).

Không sửa (derive thuần, tự theo constant đã rename): `placement-policy.mjs`,
`plan.mjs`, `resolve.mjs`, `execution-contract.mjs`, `dispatch.mjs`,
`cohort-planner.mjs`.

### .fgos/config.json — `runner.modelPolicies.<provider>` (4 provider)

Rename key theo mapping, GIỮ NGUYÊN giá trị model thật (lossless):

```
claude:       {nano:haiku, standard:sonnet, advanced:sonnet, flagship:opus, frontier:opus}
gemini:       {nano:gemini-3.8-flash-low, standard:gemini-3.8-flash-medium,
               advanced:gemini-3.8-flash-high, flagship:gemini-3.1-pro-low,
               frontier:gemini-3.1-pro-high}
openai-codex: {nano:gpt-5.6-luna, standard:gpt-5.6-terra, advanced:gpt-5.6-terra,
               flagship:gpt-5.6-terra, frontier:gpt-5.6-sol}
z-ai:         {nano/standard/advanced/flagship/frontier: z-ai/glm-5.2}  (1 model, all slots)
```

`rigorOverrides` trên `agy`/`codex-pi`/`glm-cli`/`pi` (executors) đổi value theo
cùng mapping (vd `agy`: `{light:nano, standard:standard, heavy:advanced}`).

### test/ (10 file)

`assignment-policy.test.mjs`, `dispatch.test.mjs`, `execution-contract.test.mjs`,
`group-cognition-framework.test.mjs`, `coordination.test.mjs`,
`dispatch-recovery.test.mjs`, `placement-policy-matrix-coverage.test.mjs`,
`placement-policy.test.mjs`, `executor-profile-warnings.test.mjs`,
`dispatch-coordination-role-tiers.test.mjs`.

`dispatch-policy-baseline-snapshot.test.mjs`: KHÔNG sửa (chỉ dùng work-tier
`light/standard/heavy`, không phải modelTier).

### docs/ + skill (2 file)

- `docs/specs/runner.md` — đọc lại phần liệt vocab tier (nếu có), cập nhật 6-tier.
- `domains/coding/skills/fgos-code-panel/SKILL.md` — actor `tier` value
  `"standard"`→giữ, `"analytical"`→`"flagship"` (doer/fixer giữ `standard`,
  reviewer/red-team đổi `analytical`→`flagship`). Regenerate mirror qua
  `npm run build:skills` — KHÔNG sửa tay `.agents/skills/`/`plugins/fgOS/skills/`.

## Phase 2 — `actors[].fallbackExecutors` plumbing

Cơ chế đã có sẵn, chỉ thiếu 1 chặng: actor-level request field chưa được đọc.

- `src/verbs/coordination/schema.mjs`: `ACTOR_ALLOWED_KEYS` thêm
  `'fallbackExecutors'`; validate là array-of-string executor id thật (đối chiếu
  registered executors, theo đúng pattern `registrations.mjs`'s
  `findWorkflowStageOperationProblems` đã làm cho `policy.fallbackExecutors`).
- `src/verbs/coordination/run.mjs`'s `actorPolicyFields()`: thêm trích
  `actorEntry?.fallbackExecutors` vào field trả về (mirror cách `preferInvocation`
  đã làm) — chảy vào `cliPolicy`→`dispatchDeclaredOperation`'s PolicyPatch
  stack→`cliOverride.fallbackExecutors`→`executeAssignment`'s
  `resolveAssignmentDispatchPolicy` (đã test kỹ ở `assignment-dispatch.test.mjs`).
- Verify: PolicyPatch scope-merge precedence (session-engine.mjs `PORTABLE_POLICY_SCOPES`
  check ở L814) chỉ chặn `preferExecutor` tại scope không phải cli — xác nhận
  `fallbackExecutors` không bị chặn tương tự trước khi merge.
- Test mới: actor khai `fallbackExecutors`, primary executor lỗi giả lập → xác nhận
  round dùng đúng fallback, tier tương đương giữ nguyên.

## Phase 3 — Code-panel roster: equivalent-tier fallback

Với mỗi role, fallback = 1 trong 2 executor còn lại trong roster (agy/claude/codex),
cùng `modelTier` sau rename:

- doer/fixer (agy, standard) → fallback: `codex` (openai-codex.standard=terra, cùng
  slot `standard`).
- reviewer (claude, flagship) → fallback: `codex` (openai-codex.flagship=terra —
  lưu ý: terra là model DUY NHẤT openai-codex có ở mức cao, không có model
  riêng cho flagship — chấp nhận được vì vẫn đúng SLOT modelTier, không giả vờ
  ngang sức opus).
- red-team (codex, flagship) → fallback: `claude` (claude.flagship=opus, thật sự
  mạnh hơn — fallback tốt).

Cập nhật `actors[]` trong cả 2 roster (default headless + herdr visible-pane) +
fix-round roster trong `domains/coding/skills/fgos-code-panel/SKILL.md`.

## Verify

- `node scripts/run-tests.mjs` (narrow: runner/dispatch/coordination/setup dirs
  trước, full suite sau).
- Load thật `.fgos/config.json` qua `resolvePolicyTierModel` cho mọi
  role/executor/tier để xác nhận model resolve BYTE-IDENTICAL với trước rename
  (Phase 1 phải lossless).
- 1 test coordination-run thật với fallback: giả lập primary executor lỗi, xác
  nhận fallback executor được dùng, modelTier equivalent giữ nguyên.

## Rollback

Mọi thay đổi Phase 1 là rename thuần (key/value 1-1), revert bằng git nếu cần.
Phase 2/3 additive (field mới, optional) — không đổi hành vi actor không khai
`fallbackExecutors`.
