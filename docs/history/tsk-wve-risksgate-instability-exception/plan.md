# plan.md — tsk-wve

Mode: **high-risk** — flag count from `fgos-routing`'s Mode-gate (applied
directly here, since no earlier session in this item's history handed off
a lane; direct-entry fallback per `fgos-coding-planning/SKILL.md`): this item
**removes/narrows a validation** (`keywordRiskGate`'s heavy-risk floor),
which is itself one of the named hard-gate flags — any hard-gate flag
forces `high-risk` regardless of count. A second flag also applies:
*existing covered behavior* — `test/intake/plan.test.mjs` already
exercises the exact path being changed.

## Approach

**Chosen path:** add a mechanical "cites real evidence" exception to
`keywordRiskGate`, reusing machinery `decompose.mjs` already trusts for
the same purpose elsewhere, rather than inventing a new judged/LLM check.

Concretely, in `src/intake/plan.mjs`, where `keywordRiskGate` is
computed today (`~line 660`):

```js
const keywordRiskGate = work.risk === HEAVY_RISK && !heavyRiskAlreadyConfirmed;
```

becomes (illustrative — exact variable placement is the implementer's
call, not re-litigated here):

```js
const lockedDecisionIds = extractLockedDecisionIds(lockedContext); // already read earlier in this function
const citesRealEvidence =
  lockedDecisionIds.size > 0 &&
  (verdict.reason?.match(D_ID_PATTERN) ?? []).some((d) => lockedDecisionIds.has(d));
const keywordRiskGate = work.risk === HEAVY_RISK && !heavyRiskAlreadyConfirmed && !citesRealEvidence;
```

`extractLockedDecisionIds`/`D_ID_PATTERN` (`decompose.mjs:150-164`) already
exist and are already trusted for the identical purpose — requiring a
`decompose`-kind child's `action` field to cite a real D-ID from the
item's own locked `CONTEXT.md` (`normalizeChild`, `decompose.mjs:192-196`).
This reuses that exact precedent for the TOP-LEVEL verdict `reason`
instead of inventing a second mechanism.

**Why this, and not full removal (CONTEXT.md D1's own boundary):**
`--verdict need-human` already IS the session's own "I think this is
genuinely unstable" channel (`resolveCallerDecomposeVerdict`,
`decompose.mjs:270-272`) — independent of `keywordRiskGate`, and untouched
by this item. What D1 narrows is the OTHER case: the session is confident
(`pass-through`/`decompose`) but risk is heavy. The mechanical proxy
chosen for "this confident verdict is grounded, not off-the-cuff" is
citing a real, already-locked decision — never a semantic/LLM read of the
reason text, matching gate-bypass's own D2 discipline ("mechanical
completeness... never the session's own confidence/vibe read").

**Known limitation, stated honestly (per Gate's traceability rule,
not silently glossed over):** this is a citation-presence check, not a
citation-relevance check — a reason could cite a real D-ID without that
D-ID actually being on-topic. This is the SAME weakness
`normalizeChild`'s existing child-action check already accepts as
"good enough" for the identical citation pattern — not a new, lower bar
introduced by this item.

**Alternatives rejected:**
- Full removal of `keywordRiskGate` (item's own Câu hỏi 1 option (a)) —
  rejected in `CONTEXT.md` D1: no second reviewer exists anymore
  (`judgeDecompose` retired), so removing the only remaining check on a
  heavy-risk item's own self-graded verdict was declined.
- No change (option (c)) — rejected in `CONTEXT.md` D1: leaves the exact
  friction the item exists to fix.
- A new structured "confidence" field on the verdict shape — considered,
  not chosen: would need a new CLI flag (`--confidence` or similar) with
  no existing precedent for what counts as high/low, whereas the D-ID
  citation path reuses a convention already proven in this same file.

**Files touched:**
- `src/intake/plan.mjs` — `keywordRiskGate` computation (the only
  behavior change).
- `test/intake/plan.test.mjs` — new/updated assertions (Proof
  surface below).

**Order:** single file, single logical change — no ordering decision
needed. `fgos graph --id tsk-wve --json` was run (per this skill's own
Approach step) and confirms `tsk-wve` sits in its own size-1 graph
component with no deps/dependents — `criticalPath`/`topUnblock` carry
nothing actionable for a standalone, unsplit item like this one.

**Impact-analysis posture:** `fgos tool query --capability impact-analysis
--status present` → 1 provider (`gitnexus`), `status: "present"` →
**full** (same read as `CONTEXT.md`'s own scout evidence, re-checked
fresh here per this skill's own rule). The proof point below (regression
coverage on the exact function this item edits) does not itself lean on
blast-radius evidence — `resolveDecompose`'s only direct caller inside
this repo is `bin/fgos.mjs`'s `decompose` CLI case and its own test
suite; no wider blast radius beyond what `test/intake/plan.test.mjs`
already exercises end to end.

## Shape

One piece, no split (Bootstrap/Shape: a single, cohesive change to one
gate's trigger condition in one file, with existing, real test coverage
already in place — splitting this further would be pure ceremony over a
change this small; YAGNI).

**Cases to prove (high-risk lane — full sketch, not abbreviated):**

1. **Existing behavior, no regression:** a heavy-risk root with a verdict
   whose `reason` cites no D-ID (or `CONTEXT.md` carries none) still
   parks `need-human` — byte-identical to today's behavior. Covers the
   item's own "existing covered behavior" risk flag directly.
2. **New exception fires:** a heavy-risk root with a verdict whose
   `reason` cites a REAL D-ID present in the item's own locked
   `CONTEXT.md` `## Locked decisions` table passes through
   (`pass-through`/`decompose` outcome, not `need-human`).
3. **Fail-safe against a fabricated citation:** a heavy-risk root whose
   `CONTEXT.md` carries NO locked decisions at all, but whose `reason`
   text happens to contain a D-ID-shaped token (e.g. "D1") anyway — still
   gates. Proves `lockedDecisionIds.size > 0` guard actually holds (never
   trusts a bare pattern match against nothing real).
4. **`heavyRiskAlreadyConfirmed` interaction unchanged:** re-entering
   `resolveDecompose` after a human already answered the heavy-risk gate
   once still skips it — this item adds an OR-adjacent condition, never
   touches that existing skip.
5. **`blastRadiusGate` untouched:** no test in this item's own diff should
   assert new behavior for `blastRadiusGate` — `CONTEXT.md` D2 keeps it
   explicitly out of scope, confirmed dead code.

**Proof surface:** `npm test -- test/intake/plan.test.mjs` — the
item's own `verify` field, already set via `fgos-researching`'s round 1
verdict and unchanged since. Real and runnable today (confirmed: the file
exists, 398+ lines, exercises `resolveDecompose` against a real store
fixture, not mocked).

## Outstanding questions

None
