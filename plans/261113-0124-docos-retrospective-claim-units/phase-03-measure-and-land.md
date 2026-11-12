# Phase 3: measure on real items and land

## Context

Acceptance criterion 3: new active topics per retrospective item, before and after.

## Steps

1. **Baseline** from the registry events: for retrospective items closed in the 30 days before the skill change, count `topic.register` and `doc.reserve` events whose capture is that item, divided by the number of items. Record the query and the number.
2. **After**: run `/fgOS:retro-next` on the next real retrospective items (at least 5, or all in the pool if fewer), one at a time. For each, record: claims stated, units grown, handoffs made, topics registered (expected 0), and whether the item reached cleanup.
3. Write the result to a report at the path `fgos convention path --kind report --slug docos-retrospective-claim-units-measure` returns.
4. Land: merge the worktree branch into main by fast-forward from the main checkout's quiet window, push, ask LAND for a release build when the verb change must reach the active release; update the backlog row `p-ixrbglli5o` to done with the report link, and the area map's build order (step 1 done).

## Validation

- Every measured item reached cleanup; zero topics registered without a person's request.
- `npm test` and `cargo test --workspace` green on the landed tree.

## Rollback

Revert the skill commit; keep the handoff kind (see plan.md).
