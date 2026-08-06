Mode: high-risk

Lane decided via direct-entry fallback (`fgos-planning`'s own Bootstrap
step 1): no lane was handed off from `fgos-routing` — this session went
straight from `fgos-exploring` into planning — and `plan.md` carried no
prior `Mode:` line. Applying `fgos-routing`'s Mode-gate table directly:
flag count is 0 (no auth, no data-loss, no audit/security, no external
system, no cross-platform, no multi-domain, no weak-proof area, no
existing-covered-behavior regression target), but the change itself trips
the hard-gate flag **"removing a validation"** — `editWork` will re-check
fewer fields on patch than it does today. Per the table, any hard-gate flag
forces `high-risk` regardless of flag count. Recorded honestly: the actual
blast radius (below) is small; the lane is high because of what kind of
change this is, not because it touches many files or systems.

## Approach

Locked by `docs/history/tsk-1ne-editwork-scoped-validation/CONTEXT.md`
(D1/D2/D3) — cited, not reopened, here.

**Chosen path**: change `editWork` (`src/state/store.mjs:258-299`) so
`validateWork(candidate, ...)` (currently called on the full `{...work,
...normalizedPatch}` merge at line 289-290) skips re-checking a field
`validateWorkShape`/its sibling validators cover when that field is both
(a) absent from `patch` and (b) unchanged from `before.work[id]`. Fields
present in `patch`, or fields whose validator reads a combination touching
a patched field (e.g. `validateDeps` when `patch.deps` is present), are
still validated exactly as today — this is a narrowing of WHAT gets
re-checked, never a narrowing of the RULES themselves.

**Alternatives rejected** (CONTEXT.md D1): adding a `compound-learn` stage
enum allowance (fixes only 61/65 items, permanent enum pollution);
migrating the 65 items' `stage`/`id` (rewrites historical `done`/
`wontfix`/`retrospective` records, risks id-rename ripple through `refs`/
`deps`/`parent`/branch names).

**Risk map**:

| Component | How risky | What proves it |
|---|---|---|
| `editWork`'s scoped re-validation | Low in isolation (CONTEXT.md D2: `id`/`stage` are not in `EDITABLE_FIELDS`, so no patch could ever have exercised the removed re-checks on those two fields) | `fgos-validating`: confirm `EDITABLE_FIELDS` still excludes `id`/`stage`/`status`/`domain` today (the whole safety argument depends on this staying true) |
| Other validators inside `validateWork` (`validateDeps`, `validateMergeAfter`, `validateSupersededBy`, `validateDuplicates`, `validateDomainFields`) | Medium — these are relational (a patched `deps` array must still resolve against the WHOLE current id set, not just the patch), so "scope to patched fields" must mean "still fully validate any check a patched field participates in," not "skip validation entirely for untouched fields when a relational rule reads them" | `fgos-validating`: walk each validator in `validateWork`'s call chain and confirm the new scoping logic still runs it whenever ANY field it reads is in `patch` |
| Regression on the 65-item unblock itself | Low, directly provable | New/updated test: patch an unrelated field (e.g. `description`) on a fixture item with `stage: compound-learn` or an over-length `id`, assert it now succeeds |
| Blast radius of touching `editWork` | Low — confirmed by both `mcp__gitnexus__impact(editWork, upstream)` (LOW risk, 3 upstream symbols: `resolveDecompose`, `resolveDiscovery`, `runOnce`) and a manual grep cross-check (GitNexus index is stale — last indexed `251d0b5` per this session's own tool-use hook — so the automated result was cross-checked per `CLAUDE.md`'s gate note). Grep found 4 real call sites total: `src/intake/discovery.mjs:628`, `src/intake/decompose.mjs:816` (both priority-only patches, matching GitNexus's 2 direct hits), plus `bin/fgos.mjs:1486` (the `fgos edit` CLI door — the actual path that hit this bug) and `bin/fgos.mjs:3260` (a `parent`-only patch during decompose splitting) — GitNexus's stale index missed both `bin/fgos.mjs` call sites | None of the 4 call sites patch `id`/`stage`, so none are affected beyond gaining the fix; `fgos-validating` should re-run this same grep to catch any new call site added since this plan was written |

`impact-analysis: degraded` — `gitnexus` reports status `present`, but the
index is confirmed stale (`251d0b5`, this session's own tool-use hooks),
which `CLAUDE.md`'s gate names explicitly as the degraded case ("present
but flagged stale"). Per that gate's own instruction, the callgraph result
above was cross-checked with a direct grep rather than trusted alone —
the grep found 2 real call sites (`bin/fgos.mjs:1486`, `bin/fgos.mjs:3260`)
the stale index missed entirely, confirming the degradation was real, not
theoretical.

## Shape

Single-file change, one function. No split — this is one honest piece of
work (Approach step 4: only splits when more than one independently
workable piece exists; there is exactly one here).

Concrete cases to prove against, scaled to `high-risk` given the
validation-removal flag:

1. Patch an unrelated field (`description`) on an item with `stage:
   compound-learn` → succeeds, and the stored item's `stage` is still
   `compound-learn` afterward (unchanged, not silently "fixed").
2. Patch an unrelated field on an item with a >30-char legacy `id` →
   succeeds.
3. Patch `deps` on an item whose `deps` array already contains a (still
   nonexistent) dangling id from before dep-validation existed, adding one
   MORE dep → still rejects if the NEW dep is unknown (relational check on
   the touched field still runs in full).
4. Attempt to patch `id` or `stage` directly via `edit` → still rejected
   by `EDITABLE_FIELDS`'s existing allowlist check (line 270-276, unchanged
   by this fix, runs before the merge/validate step this fix touches).
5. Normal patch on an already-fully-valid item (the common case, ~47/112
   items) → unchanged behavior, still fully validated.

Proof command for the item as a whole:

```
node --test test/state/store.test.mjs
```

(This is the same verify already recorded via `gate-approve`/`discover`
on this item — `fgos-code-implement` extends this suite with cases 1-5
above rather than replacing it.)

## Assumptions

None outstanding — `CONTEXT.md`'s D1-D3 cover every product decision this
plan depends on; no mid-planning gap was found.
