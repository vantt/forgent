---
authoritative_for: --worker-verified-sha/verifiedSha documentation regressed on main by an incidental npm run build:skills side-effect during an unrelated commit; a prior revert-based restore attempt did not survive a 3-way merge because reverting to match base doesn't forward-apply content, fixed by forward-applying the content as a fresh diff against current main instead
---

# A revert that vanished at the next merge, because it reverted instead of restoring

`tsk-os6` restored `--worker-verified-sha`/`verifiedSha` documentation in
`.claude/skills/fgos-coding-implement/references/{implement-and-collaboration.md,
return-mechanics.md}` on main — content that had been regressed by an
incidental `npm run build:skills` side-effect during commit `180f58cf`
(merged via `fgw/tsk-3gr` — `tsk-ri8`'s own out-of-process dispatch had
landed on the wrong branch).

## Why the first restore attempt didn't stick

A prior fix had already tried to restore this content via a revert
(`fgw/tsk-ri8` commit `7657f290`). That revert did not survive the next
3-way merge — reverting a commit makes the tree match what it looked like
*before* that commit, which is a different operation from forward-applying
the missing content as its own diff against whatever main looks like
*now*. Once main moved past the reverted commit through further merges,
the revert's effect could be silently absorbed/overridden by the 3-way
merge logic, since there was no independent diff asserting "this content
must be present" — only a diff asserting "undo that specific prior change."

## What shipped

This item forward-applied the correct `verifiedSha` content as a fresh
diff against current main — restoring it in the canonical source
(`domains/coding/skills/fgos-coding-implement/references/{return-mechanics.md,
implement-and-collaboration.md}`), then running `npm run build:skills` to
regenerate the three downstream mirrors
(`.agents/`, `.claude/`, `plugins/fgOS/`). Not a revert — a direct content
restoration that stands on its own regardless of what commit originally
removed it.

## Takeaway for future restores of regressed content

When content is lost via an incidental side-effect of an unrelated commit
(here, a generated-mirror regeneration step), restoring it via `git revert`
of the losing commit is not reliably durable if further merges happen
afterward — the revert's effect can be lost again without an obvious
trace. Forward-applying the correct content as a fresh diff against the
current state is the more durable fix.
