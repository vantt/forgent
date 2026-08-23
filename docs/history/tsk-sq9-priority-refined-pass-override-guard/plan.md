# Plan: guard plan.mjs's refined pass against clobbering a human priority override

Item: `tsk-sq9`. Mode: **tiny** — one flag applies (existing covered
behavior: `test/intake/plan.test.mjs` already exercises `resolvePlan`'s
priority write), two files, one call site each, no gray areas. Matches
sibling fixes `tsk-1r3`/`tsk-4hb` at the same call site, both also `tiny`.

## Approach

Per CONTEXT.md D1-D3: only `plan.mjs`'s refined pass needs a guard;
`discovery.mjs`'s rough pass stays untouched (D1). The guard is a bare
existence check, not a timestamp comparison, because `resolvePlan`'s
priority block (the `callerVerdict` branch, not the tiny/small bare
pass-through branch which returns before reaching it) only runs once per
item in the real flow: `fgos-coding-validating`'s own hard rule always fires
`fgos plan --verdict ...` explicitly, for every mode including tiny/small
(`fgos-coding-validating/SKILL.md:242`) — so there is exactly one recompute
event to guard, never a repeated one to compare a timestamp against.

Two call sites change:

1. **`bin/fgos.mjs`, the `edit` command's `--priority` handling
   (~line 1747-1758).** After `patch.priority = priority` is set (and the
   patch is actually applied via `editWork`), add one `addDecision(dir, {
   id, text: `priority set to ${priority} via edit --priority`, source:
   'edit', kind: 'priority-override', rationale: 'tsk-sq9: mark this as a
   human override so plan.mjs's refined pass does not silently overwrite
   it' })` call. This is the only writer of `kind: 'priority-override'`
   decisions.
2. **`src/intake/plan.mjs`, `resolvePlan`'s refined pass (line 639,
   immediately before `editWork(dir, { id, patch: { priority }, role
   })`).** Read the item's existing decisions (already available via the
   same `view` this function already reads for `rankImpact`) and check
   whether any decision for this id carries `kind: 'priority-override'`.
   If one exists, skip the `editWork` call — log a decision instead
   (`text: 'priority: skipped refined-pass overwrite -- priority-override
   decision already present'`, mirroring tsk-4hb's own "make the skip
   observable" pattern at this same call site) so the skip is auditable,
   not silent. If none exists, proceed exactly as today — no behavior
   change for every item that has never had `edit --priority` called on
   it (the common case today).

Impact-analysis posture: **full** (`fgos tool query --capability
impact-analysis --status present` returned `gitnexus` as `present`,
checked fresh this session, per CONTEXT.md's scout evidence) — low actual
risk regardless: two small, additive call sites, one existing test file
already covers the changed function.

No split — one honest piece of work, same size class as `tsk-1r3`/`tsk-4hb`.

## Cases

- **Boundary (today's only real case)**: no `priority-override` decision
  exists for the item — `resolvePlan`'s refined pass writes exactly as
  before, byte-identical behavior to pre-change.
- **New behavior**: a human ran `edit --priority` on the item before its
  refined pass fires — the refined pass skips its `editWork` call, logs
  the skip decision, and `work.priority` stays whatever the human set.
- **Existing behavior unchanged**: `discovery.mjs`'s rough pass is
  untouched (D1); `resolvePlan`'s own `tsk-4hb` risk-fallback-visibility
  decision logging still fires independently of this guard.
- **Regression guard**: `test/intake/plan.test.mjs` and
  `test/cli/fgos-edit.test.mjs`'s existing priority-write assertions must
  still pass unchanged for the no-override case.

Verify: `node --test test/intake/plan.test.mjs test/cli/fgos-edit.test.mjs`

## Outstanding questions

None
