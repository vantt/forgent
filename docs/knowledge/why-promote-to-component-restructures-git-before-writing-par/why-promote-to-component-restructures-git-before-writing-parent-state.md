---
framework: diataxis
mode: explanation
---
# Why `promote-to-component` restructures git before writing parent state

fgOS sometimes finds that N items filed as independent, flatly linked
only through `deps`/`mergeAfter`, are actually one component that needs
to merge together through a single integration branch before reaching
`main`. `fgos edit --parent` already exists for setting the `parent`
field, but using it alone here is a real trap: it makes state say "child
of root X" while the item's real git branch never had its base or target
retargeted onto `fgw/root-X` — leaving `approve`'s leaf-merge routing to
merge into the wrong place.

## Why this needs one atomic action, not a sequence of separate steps

`promote-to-component` (Layer 2, mutate — not the Layer-1 harness that
*detects* when promotion is warranted) has to do all of the following
together:

1. create or reuse one integration branch,
2. for each member item already running on its own independent branch,
   rebase/retarget that branch onto the shared integration branch — or
   report it unsafe to do automatically and hand off to a person, never
   force a risky rebase,
3. only *after* (2) genuinely succeeds, set the `parent` field in state
   to match git reality,
4. record a real decision documenting the convergence.

## Why decompose split this into three children instead of one

`judgeDecompose`'s own verdict named the reason precisely:

> Action gộp 3 lớp rủi ro khác nhau trong 1 việc: (1) phán an-toàn có
> được rebase/retarget nhánh thành viên không (read-only, chính là chỗ
> tránh sự cố tsk-3au trên checkout chia sẻ), (2) thực thi restructure
> git thật (tạo/dùng nhánh tích hợp + retarget, dùng chung cơ chế
> tsk-3bn), (3) chỉ-sau-khi-git-xanh mới ghi state parent + decision
> record, có đường từ chối/rollback. Mỗi lớp có bề mặt lỗi và test riêng.

Three genuinely different risk surfaces — a read-only safety judgment, a
real git mutation, and a state write gated on that mutation's success —
each need their own error surface and their own tests. The state-write
step wasn't split further away from the git-restructure step, though:
atomicity requires the git-before-state ordering to live inside one
transaction, not two independently-failable steps.

## The real hazard this design avoids

Rebasing a branch someone else is actively working on, on a shared
checkout, is nearly the exact same kind of near-miss incident `tsk-3au`
had already warned about — a destructive-adjacent operation on state
other sessions may be touching concurrently. That's why step (2) can
refuse and hand off to a person instead of forcing a rebase whenever it
detects real risk, rather than always attempting it.

## Real guards in the shipped implementation

```js
case 'promote-to-component': {
  const ids = parseListFlag(flags.ids ?? positional.join(','));
  if (!Array.isArray(ids) || ids.length < 2) {
    throw new StoreError('validation', 'promote-to-component requires --ids (or positional args) listing at least 2 member item ids.');
  }
  const repoRoot = process.cwd();
  if (!isMainWorktree(repoRoot)) {
    throw new StoreError(
      'validation',
      `promote-to-component: refusing to run from "${repoRoot}" — this must run from the main checkout, which a linked worktree structurally is not.`,
    );
  }
  ...
  for (const id of ids) {
    const member = view.work[id];
    if (!member) throw new StoreError('validation', `promote-to-component: work "${id}" not found.`);
    if (member.parent) {
      throw new StoreError('validation', `promote-to-component: "${id}" already has parent "${member.parent}" — only flat items (no parent yet) can be promoted.`);
    }
  }
  // D2 light validation: the given ids must form one connected set via
  // deps/mergeAfter (undirected) — never re-deriving WHICH items belong
  // together (that judgment stays outside this action), only confirming
  // the caller's own claim is at least internally consistent.
  ...
}
```

Three real preconditions checked before anything mutates: it must run
from the actual main checkout (never a linked worktree), every named
member must still be flat (no `parent` already set — this action never
re-parents an already-promoted item), and the given ids must form one
connected set via `deps`/`mergeAfter`. That last check deliberately
never *decides* which items belong together — that judgment is the
Layer-1 harness's job (`tsk-3bn`/`tsk-3hk`'s scope); this action only
confirms the caller's own claim is internally consistent before
mutating anything.

## Real dependency on `sync-root`

`--root-id` lets a caller promote an *existing* member into the root
role instead of always creating a fresh milestone-style root item. Once
promoted, the root's own branch needs the same drift-closing mechanism
`tsk-3bn` designed — and this item's own real decision log shows that
mechanism actually being exercised on itself three times during
execution:

> sync-root: merged fgw/tsk-3gx into main at 6cf8106...
> sync-root: merged fgw/tsk-3gx into main at 938967a...
> sync-root: merged fgw/tsk-3gx into main at 8963778...

Each one rationale-tagged "fgos sync-root tsk-3gx — closes the drift
window this item's own design exists to prevent" — real, live proof that
the two features (`sync-root` and `promote-to-component`) compose
correctly together, not just independently unit-tested.
