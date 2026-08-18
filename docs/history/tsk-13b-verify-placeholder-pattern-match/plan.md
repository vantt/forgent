# plan.md — tsk-13b

Mode: standard

Flag count: 2 — "existing covered behavior" (hasRealVerify is a load-bearing
helper `resolveDiscovery` depends on, per `RESEARCH.md` Q1) and "weak proof
around the area" (this exact area shipped two related fixes, tsk-14a and
tsk-4m4, days before this bug was found — the area's own proof record is
thin). No hard-gate flag applies (no auth/data-loss/audit/external-provider/
validation-removal). 2 flags → standard lane per `fgos-routing`'s Mode gate
(no lane was handed off from Orient — this session entered planning
directly from `fgos-coding-discovering`'s `clear` verdict, so the
direct-entry fallback applies: no `plan.md` `Mode:` line existed yet and no
prior Orient prose was carried, so the lane is derived here from the flag
count directly).

No `CONTEXT.md` exists for this item — discovery's verdict was `clear`, so
`exploring` was skipped outright (the intended fast path, per
`fgos-routing`'s own description of the core loop). Nothing here reopens or
needs a locked decision; every fact below traces to `RESEARCH.md`'s Round 1
(2026-08-13) or to this planning session's own direct reads.

## Approach

**Chosen path: pattern-match, not normalize (RESEARCH.md option (a), not
(b)).** Change `hasRealVerify(verify)` in `src/intake/discovery.mjs:89-91`
from exact-equality against two literal constants (`FALLBACK_VERIFY`,
`RETIRED_P14_PLACEHOLDER`) to a prefix check: `!verify.startsWith('chưa
xác định —')` (keeping the existing `typeof`/`trim` guards).

**Why not option (b) (normalize every placeholder-generation site to the
two exported constants).** `RESEARCH.md` Round 1 Q1 found no central code
path that generates the free-text placeholder variants seen in the live
backlog (e.g. `'chưa xác định — cần thiết kế (...)'`) — those strings are
written ad hoc by whichever session created the item, following a prose
convention, not a shared function. Normalizing would mean constraining
every future session's free text at write time across an unbounded set of
call sites (skill prose, not code) — not a one-file fix, and not something
this item's own scope covers. Pattern-matching is confined entirely to
`hasRealVerify()` itself, the one place semantics actually branch on this
distinction.

**Impact analysis (GitNexus, full posture — `fgos tool query
--capability impact-analysis --status present` returned `gitnexus`
`present`).** `impact({target: "hasRealVerify", direction: "upstream",
file_path: "src/intake/discovery.mjs"})` → risk `LOW`, exactly 1 direct
caller: `resolveDiscovery` (same file), 1 module affected (`State`).
Cross-checked against a direct grep of all 3 call sites
(`discovery.mjs:327,478,506`) — all 3 fall inside `resolveDiscovery`
(spans line 272 onward, next function boundary is EOF), matching
GitNexus's single-edge collapse exactly. No stale-index mismatch. Blast
radius is genuinely narrow: one function, one file, one caller.

**Risk map:**

| Component | How risky | What proves it |
|---|---|---|
| `hasRealVerify()` logic change | Low — pure predicate, 1 caller, no external I/O | Existing unit tests for `discovery.mjs` plus a new case: a `'chưa xác định — <anything>'` string must resolve as NOT real, matching the 2 hardcoded cases exactly as before |
| Behavior change for the 3 live backlog items (tsk-8v1, tsk-45f, tsk-3y2) | Low — they move from "silently treated as real" to "correctly treated as placeholder", which is the fix's whole point, not a regression | `npm test` (existing suite) plus manual `fgos list --id <each>` read-after showing `verify` still flagged as placeholder-shaped by the new logic (no state mutation needed to prove this — `hasRealVerify` is read-only) |
| Regression on the 2 existing exact-match cases (`FALLBACK_VERIFY`, `RETIRED_P14_PLACEHOLDER`) | Low — both already start with the same prefix, so a prefix check is a strict superset of the old exact check | Existing test suite already covers both constants; a prefix check cannot un-catch a string the exact check already caught |

No medium/high risk entries — nothing here needs a proof point beyond the
existing test suite plus the one new case named above.

**Files touched:** `src/intake/discovery.mjs` only (the `hasRealVerify`
function body, lines 89-91). No other file calls it (confirmed above), so
no other file needs a change for the fix itself. A test file under
`test/` covering `discovery.mjs` gets the one new case — exact path
identified when writing the test at `executing` (existing test file
naming convention applies, not invented here).

**Order:** single change, single file — no ordering decision needed.

## Shape

One honest piece of work — no split. The fix is a 2-line predicate change
confined to one function with one caller, already proven low-risk by
GitNexus impact analysis above. Verify command:

```
npm test
```

This is the item's own current `verify` value already (`fgos list --id
tsk-13b` showed `verify: "npm test"` before this planning session began,
and it is not one of the two placeholder constants) — real and distinct
already, so no sync edit is needed here (`fgos-coding-planning`'s own
step 5 sync rule only fires when the item's current verify is still a
placeholder; this one already isn't).

Concrete cases the fix must hold under, sketched at `standard` depth:

- **Boundary:** the 2 existing exact-match strings (`FALLBACK_VERIFY`,
  `RETIRED_P14_PLACEHOLDER`) must still resolve as NOT real — a prefix
  check is a superset, so this is a non-regression check, not new
  behavior.
- **New pattern case:** any string starting with `'chưa xác định —'` but
  not matching either constant (e.g. the 3 live backlog strings) must now
  also resolve as NOT real — this is the bug fix itself.
- **Existing behavior that must not regress:** a genuine real verify
  command (e.g. `'npm test'`, or any string not starting with the
  placeholder prefix) must still resolve as real — untouched by this
  change since the prefix check only narrows what counts as fake, never
  widens what counts as real.
- **Empty/whitespace input:** already guarded by the existing `typeof
  verify === 'string' && verify.trim()` check, unchanged by this fix.

No concurrent-access or partial-failure case applies — `hasRealVerify` is
a synchronous, side-effect-free predicate.

## Outstanding questions

None
