# Plan: main-checkout-hook-wired false negative on absolute core.hooksPath

**Item:** tsk-1gn
**Mode: small** (1 flag — existing covered behavior; no hard-gate flags. Decided by `fgos-routing`'s Orient step before this plan was written.)

## Approach

Fix the exact-string `core.hooksPath` comparison in
`src/setup/git-hooks.mjs` per CONTEXT.md D1/D2: replace `=== '.githooks'`
(and its inverse) with a resolved-absolute-path comparison in all three
functions that make this comparison — `mainCheckoutHookWired`,
`installGitHooks`, `uninstallGitHooks`. No split: one file, one class of
bug, three call sites already co-located in the same module — this is one
honest piece of work (CONTEXT.md D1 already locked "all 3 functions" as
one item's scope, not three).

**Rejected alternative:** fixing only `mainCheckoutHookWired` (the
doctor-facing check literally named in the item title) and leaving
`installGitHooks`/`uninstallGitHooks` for a follow-up item. Rejected per
CONTEXT.md D1 — the scout already proved the identical bug pattern hits
those two with real misleading behavior on this checkout (fill-only
misreport, refused unwire), splitting would leave a known bug in landed
code with no item tracking it.

**Impact-analysis capability gate:** `impact-analysis: full` (GitNexus
present, checked via `fgos tool query --capability impact-analysis
--status present` during `fgos-coding-exploring`). Applied below.

## Risk map

| Component | Risk | Proof point (for fgos-coding-validating) |
|---|---|---|
| `mainCheckoutHookWired` (read check, feeds `fgos doctor`) | Low — pure function, already covered by 4 existing unit tests (`checks.test.mjs:429-454`) that must keep passing unchanged | Existing tests still pass + new absolute-path case added |
| `installGitHooks` fill-only detector | Medium — its "already wired" branch and its "found a foreign custom hook" branch both currently keyed off the same exact-string compare; changing the compare changes which branch an absolute-but-correct value takes | GitNexus `impact({target: "installGitHooks", direction: "upstream"})` before editing (impact-analysis: full, MUST run per CLAUDE.md gate) + existing `checks.test.mjs:485-522` wiring/fill-only e2e tests still pass + new absolute-path case |
| `uninstallGitHooks` ownership detector | Low — same pattern, no existing e2e test currently exercises it directly (only `install-git-hooks.test.mjs` unit-level) | New absolute-path case added; existing `uninstallGitHooks` tests still pass |
| Shared normalization logic (if factored into a helper) | Low — pure path math, no I/O of its own | Covered transitively by the three call sites' own tests above; no separate proof point needed |

Existing-covered-behavior flag (the one flag that put this at `small`
rather than `tiny`): every existing test in `checks.test.mjs:429-522` and
`test/scripts/install-git-hooks.test.mjs` exercising these three functions
with the literal relative `.githooks` value must still pass unchanged —
the fix only widens what counts as "wired," it never narrows it.

## Files touched

- `src/setup/git-hooks.mjs` — the fix itself (all 3 functions).
- `test/setup/checks.test.mjs` — new `mainCheckoutHookWired`
  absolute-path case, alongside the existing 4.
- `test/scripts/install-git-hooks.test.mjs` — new `installGitHooks`
  absolute-path case (existing coverage: `installGitHooks sets
  core.hooksPath...`, `...is idempotent...`, etc.).
- `test/setup/uninstall-wiring.test.mjs` — new `uninstallGitHooks`
  absolute-path case (existing coverage confirmed by `fgos-coding-validating`'s
  reality gate — 4 tests: unwire+delete, custom-path-untouched,
  no-op-when-unset, refuse-when-not-exactly-`.githooks` — plan's original
  claim that this coverage lived in `install-git-hooks.test.mjs` was
  wrong; corrected here).

No other files: `checkMainCheckoutHookWired`
(`src/setup/registrations.mjs:321-326`) and its doctor registration
(`registrations.mjs:374-378`) call `mainCheckoutHookWired` as a black box
and need no change — the fix is entirely inside `git-hooks.mjs`.

## Order

Single-node component, no `deps`, nothing to unblock (`fgos graph --json`
confirms `tsk-1gn` sits alone in its own component). No cross-item
ordering question — implement in the one item as one commit.

## Split

None. One honest piece of work per CONTEXT.md D1 and the risk map above —
does not proceed as a decomposed set of children.

## Verify

`node --test test/setup/checks.test.mjs test/scripts/install-git-hooks.test.mjs test/setup/uninstall-wiring.test.mjs`
— must include the new cases named in CONTEXT.md D4:
- `mainCheckoutHookWired is true when core.hooksPath is an absolute path
  resolving to repoRoot/.githooks` (`checks.test.mjs`)
- an absolute-path-equivalence case for `installGitHooks`
  (`install-git-hooks.test.mjs`)
- an absolute-path-equivalence case for `uninstallGitHooks`
  (`uninstall-wiring.test.mjs` — corrected by `fgos-coding-validating`'s reality
  gate; the plan originally cited `install-git-hooks.test.mjs` for this
  case, which has no `uninstallGitHooks` coverage at all)

Same command as the item's own `verify` field (CONTEXT.md D4) — this plan
does not redesign Execute's proof mechanism, per this skill's own "leave
execution alone" rule.

## Assumptions

None left unaddressed — every gray area CONTEXT.md's D1-D4 could settle,
it settled. No mid-planning `CONTEXT.md` gap found.

## Open questions

None.
