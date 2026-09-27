# Unit I17 (Phase 5) — Demand doctrine: fragment, spec fact, trigger

Capability: `execute` (prose/spec, mutate file, verify bằng test có sẵn).
Depends on: none. Land trước mọi link từ this track.
Status: implemented
Branch: `coordination-skill-harness-i17-demand-doctrine`

## Context

- Design record §6–§11:
  `plans/reports/architecture-investigation-260927-1154-capability-aware-dispatch-gate-phase4-decisions.md`
- Cụm fragment hiện có: `core/skills/_shared/capability-catalog.md`,
  `planning-capability-awareness.md`, `executor-dispatch-fallback.md`
- Từ vựng cầu/cung: `docs/history/dispatch-concept-boundary/DISCUSSION.md` §6.4, §7.2
- Ba từ vựng tier: `src/state/work.mjs:161` (`TIERS`),
  `src/runner/dispatch/assignment-policy.mjs:48` (`MIN_RIGOR_VALUES`),
  `src/runner/dispatch/config.mjs:520` (`MODEL_POLICY_TIERS`)

## Requirements

1. Fragment mới `core/skills/_shared/capability-matching.md`:
   - vai trò trong cụm bốn fragment; Q0/Q1/Q2;
   - `DemandFacts` tám thuộc tính, kiểu, nguồn từ vựng;
   - luật khớp (serves, nhiều-thuộc-tính-hơn thắng, hòa/miss → inline + log);
   - mặc định inline; năm lý do dispatch;
   - agent đọc prose để khai facts, máy không đọc prose; override có lý do,
     được log;
   - promotion trigger cho capability domain mới (ví dụ `docs:*`): override
     lặp lại trong log hoặc executor chỉ phục vụ domain đó.
   - không có từ khoá coding/track cụ thể ngoài ví dụ.
2. `capability-catalog.md`: thêm cột `serves` cho mọi entry; thêm hàng
   `review` (generic, finding, không mutate); ghi rõ entry không có `serves`
   hợp lệ nhưng không bao giờ được match tự động.
3. `planning-capability-awareness.md`: một đoạn nối "unit trong plan" với
   `DemandFacts` (plan unit là facts đã khai; lint đọc chúng).
4. `executor-dispatch-fallback.md`: lý do dispatch thứ năm "model mạnh hơn",
   gắn với `rigor`, không gắn với `size`.
5. `core/skills/fgos-capability-dispatching/SKILL.md`: trigger đổi từ
   "before implementing/changing/building code" sang "sau khi `DemandFacts`
   khai `mutates` và domain code"; mặc định inline.
6. `domains/coding/skills/fgos-code-panel/SKILL.md` mô tả: chỉ bắt khi
   facts nói change + code + cần review độc lập; không bắt theo từ
   "implement".
7. `docs/specs/runner.md`, mục "Từ vựng dispatch hiện hành": thêm dòng
   `DemandFacts`/`CapabilityMatch`, ghi `serves` là phần của catalog identity
   theo nghĩa "lời hứa hành vi đọc được bằng máy".
8. `npm run build:skills`; mirrors `.agents/` và `plugins/fgOS/` byte-identical.

## Files

Modify: bốn fragment `_shared`, hai SKILL.md trên, `docs/specs/runner.md`.
Create: `core/skills/_shared/capability-matching.md`.
Không chạm: `coordination-driver.md`, `fgos-plan-loop` (this track đang mở
I16).

## Steps

1. Viết fragment mới từ design record, giữ dưới 900 từ.
2. Sửa ba fragment còn lại, chỉ thêm đoạn, không viết lại.
3. Sửa hai trigger skill; chạy `npm run build:skills`.
4. Cập nhật spec; kiểm link.

## Verification

```sh
node --test test/setup/capability-catalog-doctrine.test.mjs
node --test test/skills/
node scripts/check-skill-projections.mjs   # nếu có; nếu không: git diff --stat .agents plugins/fgOS sau build:skills phải chỉ chứa file vừa sửa
git diff --check
```

Review độc lập: `unresolved` (chưa có `review` cho tới Phase 03); chạy
inline hoặc `fgos dispatch execute <executor-id>` với ad-hoc six-field task.

## Risks / rollback

- Trigger đổi làm session hiện hành bớt gọi `decide` cho code: đó là chủ
  đích; theo dõi log miss sau khi Phase 03 có log.
- Rollback: revert commit prose; không có state.
