---
type: how-to
title: BEE_ -> FGOS_ identifier rename plan (tsk-19z)
tags: [naming, bee-coexistence]
timestamp: 2026-08-13T03:29:00.000Z
source_capture_ids: []
date: 2026-08-13
status: locked
source_decisions: []
relates_specs: [runner, work-state]
---

# BEE_ → FGOS_ identifier rename plan (tsk-19z)

Mode: small

## Lane decision

Direct-entry fallback applied (no `fgos-routing` Orient step ran ahead of
this session; no prior `Mode:` line existed in this file). Flag count
against `fgos-routing`'s Mode-gate table: **1 flag** — *existing covered
behavior* (`test/runner/session-identity.test.mjs`,
`test/e2e/main-checkout-lock-hook.test.mjs`,
`test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs`,
`test/cli/fgos-return.test.mjs` already cover `resolveWriterIdentity()`'s
env-var priority and must still pass after the rename). No hard-gate flag
applies — no auth, no data loss, no audit/security surface, no external
provider still in play (CONTEXT.md D1), no public contract, no
cross-platform concern, no multi-domain span, and proof around the area
is not weak (it is already directly tested).

0–1 flags → tiny or small. **Small**, not tiny: the change touches 8
files / 10 locations (CONTEXT.md's rename table) — more than "a couple of
files, one direct task" — but every location is the same mechanical
substitution with no gray areas, so a phased/high-risk plan would be
ceremony this item does not need.

## Approach

Single mechanical rename pass, scoped exactly to `CONTEXT.md`'s locked D4
table — nothing more, nothing less:

1. `src/runner/session-identity.mjs` — rename the `'BEE_SESSION_ID'` key
   in `envSessionId`'s priority array to `'FGOS_SESSION_ID'`; update the
   header comment block (lines 6-8, 20, 33) to describe `FGOS_SESSION_ID`
   plainly and drop the "same precedence as `.bee/bin/lib/lock.mjs`'s
   `envSessionId`" claim (CONTEXT.md D1: no longer true).
2. `plugins/fgOS/skills/terminal/rename.sh` — mirror the same rename at
   lines 60-63 (`fg_ssid="${BEE_SESSION_ID:-}"` → `"${FGOS_SESSION_ID:-}"`)
   and update the comment at 78-79 referencing the old var name.
3. Update the four test files that exercise this constant so they keep
   testing the real behavior under its new name: rename every
   `BEE_SESSION_ID` fixture/env key to `FGOS_SESSION_ID` in
   `test/runner/session-identity.test.mjs`,
   `test/e2e/main-checkout-lock-hook.test.mjs`,
   `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs`,
   `test/cli/fgos-return.test.mjs`. Test *names*/*descriptions* that
   mention the var name in prose get the same rename; test *behavior*
   (what is asserted) is unchanged.
4. `README.md` — rename the `<!-- BEE:BACKLOG-BADGES:START/END -->`
   marker comment to `<!-- FGOS:BACKLOG-BADGES:START/END -->`. Text-only;
   CONTEXT.md's scout confirmed nothing in this repo currently
   reads/writes that literal string, so this cannot change behavior.
5. `docs/specs/runner.md` (~line 1051) and `docs/specs/work-state.md`
   (line 171) — update the prose describing the env-var priority to say
   `FGOS_SESSION_ID`/`CLAUDE_CODE_SESSION_ID` and drop the bee-matching
   claim, since these specs describe the present system.

Order: source (1) before its shell mirror (2) before tests (3), since the
tests assert against the source's actual behavior. README (4) and specs
(5) are independent of 1-3 and can happen in any order relative to them.
`fgos graph --json` shows tsk-19z as an isolated single-item component
(no deps, no children) — there is no cross-item ordering question here,
only intra-item file ordering, covered above.

**No split.** Every piece in CONTEXT.md's D4 table is the same class of
change (rename one constant, everywhere it is fgOS's own naming) with a
shared, single verify pass (see Proof surface below) — splitting into
per-file items would create 8 items with no independent value and no
real parallelism (they all touch the shared identifier's meaning), so
this proceeds as one item.

## Risk map

| Component | How risky | What proves it |
|---|---|---|
| `resolveWriterIdentity()` env priority | Low — pure rename, logic/order unchanged | Existing test suite (`test/runner/session-identity.test.mjs` + the 3 e2e/cli files) still green under the new var name |
| `rename.sh` shell mirror | Low — same substitution pattern, no logic change | Manual read-through (no existing automated test for this script per CONTEXT.md scout — it already no-ops safely outside a herdr pane) |
| README badge marker | None — confirmed behavior-inert (CONTEXT.md D4 scout) | Visual diff only |
| `docs/specs/*.md` prose | None — documentation only | Read-through for accuracy against the actual renamed code |

`impact-analysis` capability posture: `full` (gitnexus present, per
CONTEXT.md's own gate check). `resolveWriterIdentity` is the one
function with real callers outside this item's own files (`src/runner/
session-identity.mjs` is imported elsewhere in the runner) — the
execution session must run `impact({target: "resolveWriterIdentity",
direction: "upstream"})` before editing it, per `CLAUDE.md`'s own rule,
and report the blast radius before proceeding. This plan does not
pre-empt that call; it only flags that it is required.

## Assumptions

- No process outside this repo currently sets `BEE_SESSION_ID` expecting
  fgOS to read it (CONTEXT.md D1, scout-grounded: no `.bee/` in this
  checkout, canary already honest-skips). Not proven for every possible
  external environment, only for this one — pinned as an assumption
  rather than escalated to a question, since CONTEXT.md's own Outstanding
  Questions section already names the larger "should ADR0017 be
  superseded" question as future work, not this item's to resolve.
- `rename.sh` has no automated test today; the manual read-through in the
  risk map above is the only proof available for that file specifically.

## Proof surface

Verify (whole item, no split): `npm test` — the four touched test files
already assert the renamed behavior after step 3's fixture updates, so a
full green `npm test` run is sufficient proof; no new test is needed
since this is a rename of an existing, already-tested code path, not new
behavior. Additionally: `rg "BEE_SESSION_ID" src plugins docs/specs
README.md` returns no match (confirms the in-scope rename is complete),
and `rg "BEE_SESSION_ID|BEE_SKIP" docs/history docs/distillery
plans/reports` still returns the same matches as before this item
started (confirms the excluded categories were left untouched).

## Outstanding questions

None
