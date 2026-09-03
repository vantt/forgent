---
authoritative_for: gate-bypass auto-approve keyword false positives, stripCitations helper, hasOpenItems TODO status-literal fix
---

# Three real false positives in the auto-approve keyword gate, and their fixes

`tsk-4gr` fixed three confirmed false positives in `canAutoApprove`/
`canAutoApproveMergedGate` (`src/state/gate-bypass.mjs`), each verified
directly against the real functions before being fixed, and each
hard-gating an item for the wrong reason.

## 1. A file-path citation triggered the hard-gate

`canAutoApprove` checks `HEAVY_KEYWORDS` against title+description
*before* even looking at tier. `matchesKeyword` is word-boundary-aware,
so simply **citing a doc path** like `AUDIT.md` in an item's own
description matched the keyword `audit` — a session had to rename a file
to `FINDINGS.md` just to avoid self-gating. The guard was reshaping
content instead of assessing real risk.

## 2. A prose-only change mentioning a risky word still got gated as if it were risky

Because the same keyword list covers both "audit" and "migration," an
item that only edits *prose describing* an audit or migration (never
touching the actual risky mechanism) was gated identically to a change
that really does one.

## 3. The `todo` status literal self-gated any plan describing fgOS's own FSM

The heaviest of the three: `hasOpenItems` used to match bare
`\b(TODO|FIXME)\b` anywhere in an artifact's text. `todo` is one of
fgOS's own core work-item statuses — so any `plan.md` describing the
status chain `todo → doing → awaiting-approval` self-gated, even with
`## Outstanding questions` correctly reading `None`. Confirmed live on
`tsk-1uw`. Raising `gateBypass.level` to `heavy` couldn't clear it either,
because the keyword check runs *before* the tier check.

## The fixes

**A private `stripCitations(text)` helper** in `gate-bypass.mjs` strips
backtick-quoted spans and bare filename-shaped tokens (`word.ext` for
`md|mjs|js|cjs|ts|json|yml|yaml|txt`) from the title+description haystack
before the keyword scan runs — applied at both `canAutoApprove` and
`canAutoApproveMergedGate`'s haystack-construction sites (both build the
identical `${title}\n${description}` shape, so both carried the same
false positive, even though the item's own locked decisions named only
`canAutoApprove` explicitly — applying the fix to both is the same
principle at the same pattern, not a new product decision).

**`hasOpenItems` now requires the real code-marker shape**: `TODO`/`FIXME`
immediately followed (optionally after whitespace) by `:` or `(` —
`TODO:`, `FIXME:`, `TODO(name):` — instead of a bare word-boundary match.
This resolves the false positive on fgOS's own `todo` status literal (or
an enum like `WorkTab::Todo`) while still catching a genuine unfinished
marker.

## Why the fix lives in `gate-bypass.mjs`, not `risk-keywords.mjs`

`risk-keywords.mjs`'s `matchesKeyword`/`HEAVY_KEYWORDS` are also imported
by Iron Law (`classifyIronLaw`) and submit-time tiering (`countMatches`)
— confirmed by direct read of both call sites. Fixing the false positive
there would reshape those two unrelated mechanisms' own blast radius.
`stripCitations` stays private inside `gate-bypass.mjs`, applied only to
what `canAutoApprove`/`canAutoApproveMergedGate` hand to the shared
keyword floor — narrowing the input at the gate-bypass call sites, never
touching the shared floor mechanism itself or its other two consumers.

## What was NOT changed (rejected alternatives)

- A second, gate-bypass-only keyword list — rejected, collides with the
  already-locked one-shared-list design.
- Negation-aware matching (e.g. distinguishing "no security risk here"
  from a genuine security concern) — rejected, out of scope by design.
