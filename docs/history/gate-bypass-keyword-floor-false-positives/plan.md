# Plan: gate-bypass keyword floor false positives (tsk-4gr)

Mode: high-risk

4 flags counted at the Mode gate: audit/security (this item edits the
hard-gate floor itself — `canAutoApprove`/`canAutoApproveMergedGate` in
`src/state/gate-bypass.mjs`, the mechanism that decides whether a human
reviews a change), existing covered behavior (`test/state/gate-bypass.test.mjs`
already exercises both functions), weak proof around blast radius (see
Impact-analysis posture below), and one hard-gate flag alone (audit/security)
already forces `high-risk` regardless of count.

## Approach

**Chosen path**: add one small, private helper inside
`src/state/gate-bypass.mjs` — `stripCitations(text)` — that removes
backtick-quoted spans and bare filename-shaped tokens (`word.ext` for
`md|mjs|js|cjs|ts|json|yml|yaml|txt`) from a string before it is handed to
the keyword scan. Apply it to the title+description component of the
haystack in **both** `canAutoApprove` (line 148) and
`canAutoApproveMergedGate` (`mergedGateHaystack`, line 185) — both build
their title+description component identically (`${item?.title ??
''}\n${item?.description ?? ''}`), so both carry the same citation
false-positive, even though CONTEXT.md's D1 only names `canAutoApprove`
explicitly. Applying the same helper at both sites is not reopening D1 —
it is the identical locked principle ("narrow what canAutoApprove hands to
the shared floor, never touch the floor itself") applied everywhere that
exact pattern already lives, which is an implementation detail this stage
owns, not a new product question.

**Alternatives rejected** (per CONTEXT.md D1/D2, already locked — cited,
not reopened here):
- A second, gate-bypass-only keyword list — rejected, collides with the
  locked one-shared-list design (D1).
- Negation-aware matching — rejected, out of scope by design (D2).
- Fixing this inside `matchesKeyword`/`risk-keywords.mjs` itself —
  rejected: that module is imported by Iron Law (`classifyIronLaw`) and
  submit-time tiering (`countMatches`) too (confirmed via direct read of
  both call sites plus a live GitNexus symbol lookup during discovery/
  exploring scout — see CONTEXT.md's Capability posture). Changing it
  there would reshape those two unrelated mechanisms' blast radius,
  exactly what D1 rules out. The new helper therefore lives in
  `gate-bypass.mjs` itself, private, never exported from
  `risk-keywords.mjs`.

**Files touched**: `src/state/gate-bypass.mjs` only (add `stripCitations`,
call it at both haystack-construction sites) — a single-file, no-split
change. `test/state/gate-bypass.test.mjs` gets new cases (see Shape). No
split into child items: this is one honest, self-contained piece.

**Order**: no meaningful ordering question — one function added, two call
sites updated, tests added alongside. `fgos graph` was checked: `tsk-4gr`
has no recorded `deps` and is its own single-item component (not on any
other item's critical path or unblock list), so there is no cross-item
sequencing to honor.

### Impact-analysis posture: **degraded**

`fgos tool query --capability impact-analysis --status present` reports
GitNexus `present` at the repo level, but `list_repos` shows no indexed
entry (main or sibling) whose path matches this exact worktree
(`/home/vantt/projects/forgentX/.claude/worktrees/tsk-4gr-cpY7qv`) — the
closest sibling indexes are 5-811 commits behind and belong to other
items' branches, not this one. Per the project's own capability gate,
this is registered-but-not-confirmed-fresh-for-this-tree — treated as
degraded, not full. **Cross-checked manually instead** (both during
discovery's research pass and again here): `rg -- "matchesKeyword" src
bin test docs` plus a live GitNexus symbol lookup on `matchesKeyword`
(auto-surfaced during scout, from whichever sibling index answered it)
agree on the same three real callers — `classifyIronLaw`
(`src/evolve/iron-law.mjs`), `countMatches` (`src/intake/classify.mjs`),
`canAutoApprove`/`canAutoApproveMergedGate` (`src/state/gate-bypass.mjs`).
No fourth caller found by either method — the two independent checks
agree, so the blast-radius claim above (scoping the fix to
`gate-bypass.mjs` alone) is trusted despite the degraded posture, not
treated as full-strength proof.

## Shape

Concrete cases to prove at `fgos-coding-validating`/implement:

1. **Point (1), the reported bug**: an item whose description cites
   `` `AUDIT.md` `` (backtick-quoted) or a bare `AUDIT.md` token is no
   longer hard-gated by the `audit` keyword alone, in both
   `canAutoApprove` and `canAutoApproveMergedGate`.
2. **Regression — real risk still gates**: an item whose description
   contains "audit" or "migration" as a genuine, non-citation-shaped
   prose word (e.g. "run a security audit of the login flow") still hard-
   gates in both functions. This is the proof point for the risk-map
   entry below — it is what keeps the fix from silently widening the
   floor's blind spot.
3. **Existing behavior unchanged**: full `npm test` run — `hasOpenItems`'s
   own TODO/FIXME behavior, `isTierCovered`, `mergedGateHaystack`'s
   existing footprint/child-spec/plan.md-exclusion behavior, and every
   existing `gate-bypass.test.mjs` case pass unmodified.
4. **Point (2) and negation-blindness**: explicitly NOT tested as bugs —
   per CONTEXT.md D2, add one code comment on `HEAVY_KEYWORDS`'
   `canAutoApprove` usage documenting both as known, permanent floor
   limitations (mirroring `hasOpenItems`'s own doc-comment discipline),
   not a behavior to assert against.

**Risk map**:

| Component | Risk | Proof point |
|---|---|---|
| `canAutoApprove`/`canAutoApproveMergedGate` citation exemption | medium — a crafted "citation-shaped" token (e.g. a fake `payment.mjs` mention) could theoretically smuggle a real risk word past this ONE gate | Case 2 above (regression test: genuine prose mention still gates) bounds this; also, gaming `canAutoApprove` alone only skips the `exploring`-stage CONTEXT.md question — the separate `canAutoApproveMergedGate` check at `validating` still runs against real structured footprint/child-spec data (not free text), which is far harder to fake plausibly, so the actual blast radius of gaming this one exemption is bounded to skipping one non-final approval step, not bypassing review entirely |
| Shared-module blast radius (touching the wrong file) | low, already checked | Impact-analysis posture above — degraded GitNexus, cross-checked manually against two independent methods, both agree the change stays inside `gate-bypass.mjs` |

## Verify

`npm test` (full suite — this touches a shared state module with
existing coverage, not narrow enough for a single-file test run to be
sufficient proof) plus, named for a fast local loop:
`node --test test/state/gate-bypass.test.mjs`.

## Split

No split. One honest, single-file piece — no child specs written.

## Outstanding questions

None
