# plan.md — tsk-51i: apply the stitch design pass into React

Mode: **light** (`fgos submit`'s own auto-classify; confirmed at planning
— pure frontend styling + two small, already-spec'd behaviors, no
gateway/auth-mechanism change, no locked-law edit).

## Approach

1. **Design tokens** (`herdr-plugin/web/src/index.css`, Tailwind v4
   `@theme`): extracted from the stitch export's own Tailwind config
   (`herdr-plugin/web/stitch-exports/S02/design.html`'s embedded
   `tailwind.config` block) rather than re-guessed — brand purple,
   light SaaS background/surface, and the 4 status colors (amber/blue/
   slate/green) matching the mockups exactly. A shared `lib/status.ts`
   maps every real status string (`src/state/work.mjs`'s `STATUSES`) to
   one of those 4 buckets, used by both Taskboard and TaskDetail so a
   status reads the same color everywhere.
2. **S01 (`App.tsx`)**: styled per the mockup, AND made the token gate
   real — the draft token is proven against the gateway (`GET
   /state/digest`, the cheapest authenticated read) before being stored,
   so ERR-AUTH (`docs/ui-spec/screens/S01-sign-in.md`) is a real
   rejection, not a client-side guess a wrong token would silently pass.
3. **S02 (`Taskboard.tsx`)**: styled group view (unchanged testids/DOM
   shape, only classes added) plus a NEW kanban view (D16) behind a
   toggle, remembered in localStorage the same way collapse state
   already is. Kanban cards are draggable; dropping on a column calls
   `client.moveWork` (A-S02-013), the same one-door-write verb a quick
   action would use -- never a client-side status edit.
4. **S03 (`TaskDetail.tsx`)**: CONTEXT region expanded per D17 to render
   the real `WorkItem` fields (`description`/`verify`/`footprint`/
   `docsRef`/`deps`/`tier`/`domain`) instead of just id/status -- a field
   absent on a given item renders no row, never a fabricated placeholder
   (same convention `docsRef` already used).
5. **S04 (`NeedsAnswer.tsx`)**: styled per the mockup, no behavior change.

**Files touched:** `herdr-plugin/web/src/index.css`,
`herdr-plugin/web/src/lib/status.ts` (new), `herdr-plugin/web/src/App.tsx`,
`herdr-plugin/web/src/screens/{Taskboard,TaskDetail,NeedsAnswer}.tsx`,
matching `*.test.tsx` files (new/updated), `herdr-plugin/web/src/App.test.tsx`
(new).

## Risk map

| Thành phần | Mức | Chứng minh gì |
|---|---|---|
| Mọi testid/DOM cũ của group view không đổi | Thấp | 43 test cũ chạy lại xanh nguyên, không sửa assertion nào |
| Kanban view + drag-drop hoạt động thật, gọi đúng verb | Thấp | Test thật: drop gọi `moveWork(id, toStatus)`, không phải state edit client-side |
| S01 token gate không còn "lưu mù" | Thấp | Test thật: token sai (401 hoặc network fail) → không ghi localStorage, hiện đúng 1 message cố định |
| D17 field field-absent không fabricate | Thấp | Test thật: item không có field nào → không testid nào render |
| Tailwind class không bị JIT bỏ sót (class ghép chuỗi runtime) | Thấp | Đã sửa 1 chỗ derive-by-replace thành literal class; build thật generate CSS 18.72kB (tăng thật so với bundle cũ, xác nhận class được nhặt) |

## Verify

```
cd herdr-plugin/web && npm ci && npx vitest run && npx tsc -b
```

## Decide the split

Một mảnh — style + 2 hành vi nhỏ (kanban toggle, token validation) đều
phục vụ đúng một mục tiêu quan sát được ("dashboard đã build đúng theo
design pass D16/D17"), tách nhỏ hơn không tự đứng được.
