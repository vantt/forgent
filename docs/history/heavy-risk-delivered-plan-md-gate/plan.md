# plan.md — tsk-2p6: heavy-risk item reaching delivered without a plan.md

Mode: standard

2 flags — **existing covered behavior** (touches `moveWork`'s existing
`to === 'delivered'` gate point and `approve`'s existing pre-flight call
sites, both already covered by `test/state/store.test.mjs`/
`test/cli/fgos-approve.test.mjs`) and **weak proof around the area** (a
merge/branch-content check is inherently harder to fixture than a pure
function). No hard-gate flag (this is a governance/process gate, not
auth/data-loss/audit-security/external-provider/removing-a-validation).
No CONTEXT.md: discovery verdict was clear.

## Approach

**Chosen path:** follow the exact precedent `assertAcceptanceEvidence`
(RUL58, `src/state/store.mjs:447-470`) already set for this shape of gate
— a small assert function, called from BOTH `moveWork`'s inline
`to === 'delivered'` check (the backstop, `store.mjs:685-687`) AND
`approve`'s two pre-flight call sites in `bin/fgos.mjs` (before the real
merge, so a refusal never touches the target branch). New function:
`assertPlanEvidence(id, work, repoRoot)`.

**Trigger:** `work.risk === 'heavy'` only — not a live re-derivation of
"touches an Iron-Law-gated module" (which would need `changedFiles`/
`classifyIronLaw` against a branch that may not exist post-merge, and is
already the SEPARATE, existing Iron Law gate's own job). `risk: heavy` is
this codebase's own established mechanical proxy for exactly this kind of
governance gate (see `fgos-coding-validating`'s own heavy-risk human
confirmation, this session's own tsk-2xj/tsk-37t items) — reusing it
here, not inventing a second criterion.

**Where to look for plan.md:** checked via `git cat-file -e
<branch>:<path>` against the item's own `fgw/<id>` branch — never a plain
`fs.existsSync` on the caller's current working tree. This is the one
detail that makes the pre-flight call sites (which run BEFORE the real
merge, so the branch's files are not yet in `repoRoot`'s checkout) and the
backstop call site (which runs after) both correct with the same
function, no special-casing per call site. Checked paths: the item's own
`docsRef` (if set) joined with `plan.md`, and `docs/history/<id>/plan.md`
as a fallback — the two shapes this session's own items have used.

**tsk-4ax/tsk-55p (the two items that motivated this) are NOT touched.**
Per the item's own text: writing a plan.md retroactively for either would
be fabrication (a plan must be written before code, never after) — this
gate only applies going forward, at the moment of transition; it cannot
and does not re-evaluate items that already reached `delivered` before it
existed.

**Alternatives rejected:**
- *A doctor check re-scanning every delivered item* — rejected. Doctor
  checks are point-in-time diagnostics re-run on demand; a check like this
  would permanently report `tsk-4ax`/`tsk-55p` as violations forever
  (they can never gain a plan.md honestly), turning `fgos doctor` red
  indefinitely for accepted historical debt instead of gating only the
  moment that actually matters (a NEW item about to reach `delivered`).
  The item's own phrasing ("cảnh báo/từ chối KHI một item... CHUYỂN SANG
  delivered") asks for a transition-time gate, not a standing scan.

**Risk map:**

| Component | How risky | Proof point |
|---|---|---|
| `assertPlanEvidence` + `moveWork` backstop | Heavy (Iron-Law-gated: `src/state/store.mjs`) — refuses a real state transition | A heavy item with no plan.md on its branch is refused `doing -> delivered`/`awaiting-approval -> delivered`; one WITH a plan.md (any of the two checked path shapes) succeeds; a light-risk item is never gated at all |
| `approve`'s two pre-flight call sites (`bin/fgos.mjs`) | Heavy (Iron-Law-gated: `bin/fgos.mjs`) — refuses before a real git merge | A heavy item with no plan.md on its branch is refused by `approve` BEFORE the merge touches the target branch |

**Impact-analysis posture:** `degraded` (GitNexus present but stale, same
posture recorded for tsk-2xj this session).

## Shape

- `src/state/store.mjs` — `assertPlanEvidence(id, work, repoRoot)`, called
  from `moveWork`'s `to === 'delivered'` block alongside
  `assertAcceptanceEvidence`.
- `bin/fgos.mjs` — call `assertPlanEvidence(id, item, repoRoot)` at both
  existing `assertAcceptanceEvidence(id, item)` pre-flight call sites
  (the GitHub-merge path and the local runner-merge path).
- `test/state/store.test.mjs` — unit tests: heavy item with no plan.md on
  its branch refused; heavy item with a plan.md at either checked path
  shape succeeds; light-risk item never gated.
- `test/cli/fgos-approve.test.mjs` — one e2e-shaped test proving the
  pre-flight refusal fires before the merge (target branch unchanged
  after a refused attempt).

**Concrete cases to prove against:**
- Empty/boundary: `work.risk` is anything other than `'heavy'` (light,
  standard, or absent) — never gated, byte-identical to before this item.
- Existing behavior that must not regress: a heavy item that DOES carry a
  real plan.md still delivers normally.
- The actual bug case: a heavy item with no plan.md anywhere on its own
  branch is refused, with a clear message naming what's missing.
- Partial failure: the item's branch (`fgw/<id>`) does not exist at all
  (an edge shape, e.g. a non-worktree-backed domain) — `git cat-file -e`
  fails gracefully to "not found" rather than throwing an unrelated git
  error.

## Split decision

No split.

## Outstanding questions

None
