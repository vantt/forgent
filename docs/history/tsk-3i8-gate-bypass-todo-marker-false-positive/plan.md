# tsk-3i8 — plan.md

Mode: tiny

Flag count: 0 (auth, authorization, data model, audit/security, external
systems, public contracts, cross-platform — none apply). One-line regex
change to one function, one file, no gray areas about what to change —
the engineering judgment (which of the item's two offered fix directions
to use) was already resolved with real evidence in discovery.

## Approach

Change `src/state/gate-bypass.mjs:123` from
`/\b(TODO|FIXME)\b/i.test(text)` to `/\b(TODO|FIXME)\s*[:(]/i.test(text)`
— require the marker to be followed (optionally after whitespace) by a
colon or open-paren, the way a real code marker (`TODO:`, `FIXME:`,
`TODO(name):`) is actually written, instead of matching the bare word
anywhere in prose.

**Why this is sufficient alone** (RESEARCH.md Round 1): tested the
candidate regex against 8 cases — the repo's own existing test fixture
(`TODO: confirm with someone.`, still correctly flags open) plus 6 real
reproduced false-positive shapes (including this exact session's own live
trip on `tsk-2k0`'s `plan.md`) — all 8/8 resolved correctly. No case
needed the item's OTHER offered option (inline-code-span exclusion): a
backtick already breaks the `\s*[:(]` match on its own, so code-span
exclusion would be redundant.

**Alternatives rejected:**
- Excluding inline code spans (backtick-delimited text) instead of, or in
  addition to, the colon/paren requirement — rejected as unnecessary
  complexity. RESEARCH.md Round 1 already proves the simpler fix resolves
  every reproduced case; adding span-exclusion regex logic on top would
  be complexity with no case it uniquely resolves (YAGNI).
- Requiring literal uppercase `TODO`/`FIXME` (dropping the `i` case-
  insensitive flag) instead of the colon/paren requirement — rejected:
  this would still false-positive on prose that happens to write the
  bare word in uppercase (e.g. "the 'TODO' tab label"), and would ALSO
  miss a genuine lowercase marker someone might write (`todo: fix this`).
  The colon/paren requirement is the more precise signal either way.

**Risk map:**

| Component | Risk | What proves it |
|---|---|---|
| `hasOpenItems` (`src/state/gate-bypass.mjs`) | light | `impact({target: "hasOpenItems", direction: "upstream"})` — LOW risk, exactly 2 direct callers (`canAutoApprove`, `canAutoApproveMergedGate`), both in the same file, 0 affected execution flows. The existing test (`gate-bypass.test.mjs:162-164`) already proves the real-marker case stays flagged; a new test proves the false-positive case is now resolved. `npm test` full suite green proves nothing else regressed (this function gates every merged-gate auto-approve call this whole session has used). |

No medium/high risk items — a single-line regex change to a pure
function with a fully enumerated, already-tested caller set.

**Impact-analysis posture:** `full` — GitNexus present and fresh
(re-indexed earlier this session). `impact({target: "hasOpenItems",
direction: "upstream", repo: "/home/vantt/projects/forgentX"})` returned
a real, non-empty result (LOW risk, 2 direct callers) — confirmed above,
not assumed.

## Shape

Single piece, no split — one regex change plus test coverage in the same
file the item's own footprint already names
(`src/state/gate-bypass.mjs`, `test/state/gate-bypass.test.mjs`). New
tests to add: (1) a false-positive-regression fixture proving prose that
references the bare word "todo"/"TODO" without a following colon/paren
(e.g. mirroring the item's own reproduction: "leaves the item at todo")
no longer flags open, alongside a clean `## Outstanding questions` /
`None` section; (2) confirm the existing `OPEN_ARTIFACT_TODO` fixture
(real `TODO:` marker) still flags open — regression guard, already
covered by the existing test at line 162-164, verified in RESEARCH.md
Round 1 to still pass unchanged.

Verify (unchanged from discovery — the item's own recorded verify already
covers both the unit-level proof and the whole-suite regression check):

```
node --test test/state/gate-bypass.test.mjs && npm test
```

## Outstanding questions

None
