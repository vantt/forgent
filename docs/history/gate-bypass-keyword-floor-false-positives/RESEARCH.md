# Research log — gate-bypass keyword floor false positives (tsk-4gr)

Accumulating log. Each round appends a new dated section; never overwrite.

## Round 1 — 2026-08-19 (discovery stage, tsk-4gr)

**Goal:** resolve discovery-stage ambiguity for tsk-4gr — is the reported
bug still accurate at HEAD, and is there a clear fix direction, or does it
need a person's product decision.

### A. Current-HEAD accuracy check

`src/state/gate-bypass.mjs` at HEAD (branch `fgw/tsk-4gr`, forked from
`main` @ `c5c9120d`):

- **`hasOpenItems` (line 129-139) is ALREADY FIXED** relative to the
  item's point (3). It now requires `TODO`/`FIXME` be followed by `:` or
  `(` (`/\b(TODO|FIXME)\s*[:(]/i`), landed in `f1dd7269` (`tsk-3i8`,
  2026-08-13), whose own doc comment (lines 123-127) names the exact false
  positive tsk-4gr describes: "a bare `\b(TODO|FIXME)\b` match fires on
  prose that legitimately discusses fgOS's own `todo` status literal ...
  without ever getting closer to a genuine unfinished marker." **tsk-4gr's
  point (3) is stale — already resolved, no longer reproducible.**

- **`canAutoApprove` (line 147-155, backs `contextApprove` at the
  `exploring` stage) is STILL LIVE-VULNERABLE.** `haystack =
  title+description` raw, checked via `HEAVY_KEYWORDS.some(k =>
  matchesKeyword(haystack, k))` with no exemption for citations, doc
  paths, or negation. This is where points (1) and (2) reproduce today.

- **`canAutoApproveMergedGate` (line 230-239, backs the merged gate at
  `validating`) is PARTIALLY narrowed already, but still shares the same
  gap.** `mergedGateHaystack` (line 184-202, landed in `0057ac04`,
  `tsk-224`, 2026-08-13, D10) unions title+description with STRUCTURED
  plan fields (footprint paths, child title/verify/action) and
  *deliberately excludes plan.md's free narrative* — measured at the time:
  scanning plan.md prose would trip the floor on 266/318 (83.6%) of real
  plans, driven by `audit`/`auth`/`security`. But title+description
  themselves are still raw-scanned with the same `matchesKeyword`, so a
  doc-path citation or negated-risk sentence living in the item's own
  title/description (not plan.md) still trips this gate too — consistent
  with the decision already logged on tsk-4gr (2026-08-19, from tsk-37l's
  own validating run: "auth"/"audit" hits off the item's own
  title/description-echoed Mode-gate reasoning and "scratchpad audit").

- `src/intake/risk-keywords.mjs`: `HEAVY_KEYWORDS` (31 EN+VI terms) +
  `matchesKeyword` (word-boundary via `\p{L}\p{N}_` lookaround, landed
  `tsk-2as`/`tsk-1gj`). Word-boundary already correctly closes the
  `AUDIT.md`-matches-`audit` case's OLD failure mode (substring match) —
  what remains is that a *correctly word-bounded* match still fires on a
  citation (`AUDIT.md` still contains the standalone word `audit`) and on
  negated prose (`matchesKeyword` has no negation concept at all — purely
  lexical).

### B. Prior design intent (docs/explanation/gate-bypass-design.md, docs/history/gate-bypass/CONTEXT.md)

**Locked decision directly in tension with tsk-4gr's proposed direction.**
tsk-4gr's own description proposes: "tách 'từ khoá rủi ro' khỏi 'từ vựng
lõi của hệ thống'" (split the risk-keyword list from the system's core
vocabulary — i.e. a second, gate-bypass-specific keyword list). This
collides with **D4** (`docs/history/gate-bypass/CONTEXT.md:48`, restated
at `docs/explanation/gate-bypass-design.md` "Why the floor never bends"):
the hard-gate floor deliberately **reuses** `HEAVY_KEYWORDS` — "not a new
list invented for this feature... rather than fgOS defining its own,
possibly inconsistent, notion of what counts as high-stakes." A
gate-bypass-only keyword list is exactly the thing D4 was written to rule
out.

**D10** (`docs/history/gate-bypass/CONTEXT.md:55`, tsk-224, 2026-08-13)
already faced this same false-positive shape once — it responded by
narrowing the *source* (exclude plan.md narrative), not the *keyword
list*, and only for the merged gate. Title+description were kept IN
scope on purpose: D10 frames title+description as the item's own "submit
text," treated as trustworthy/structured input to the floor, unlike
plan.md's free narrative. tsk-4gr's points (1)/(2) live exactly in that
still-included title+description surface — so "exclude more free text"
(D10's own precedent) doesn't obviously apply to fixing this without
re-opening whether title+description should keep that trusted-structured
status.

**No prior decision anywhere in the repo (`rg negation-blindness` — zero
hits outside tsk-4gr's own decision log) addresses negation-awareness.**
D2 (`docs/explanation/gate-bypass-design.md` "Why the skip criterion is
mechanical, not a confidence read") is directly relevant context: the
floor is deliberately mechanical/lexical, NOT a confidence read,
specifically because "an LLM's in-context read of 'is this actually fine
to skip' is exactly the kind of judgment a crafted item description
(untrusted input, RUL45) could talk a session into faking." Adding
negation-awareness to a floor whose own design principle is "mechanical,
never a confidence read" is a direct tension: a hard gate that can be
talked past by writing "no audit risk here" in the description is
arguably *more* exploitable by the exact adversarial-prose threat D2
exists to close off, not less.

### C. Scope question: is the negation-blindness case part of THIS item?

The decision already logged on tsk-4gr (2026-08-19) explicitly frames it
as belonging here: "documented here as an additional concrete case beyond
the AUDIT.md-citation and TODO/FIXME cases already on file" (not a
separate item). No other item or doc references it. So scope-wise it is
already folded into tsk-4gr — but whether the *fix* should attempt to
close it (given the D2 tension above) is exactly the open question below.

## Verdict

**`unclear`.** Two real product decisions block a fix, both traceable to
locked design intent this discovery pass is not authorized to override on
its own (`review-audit-self-decision.md`'s "User Decisions" rule):

1. **Does closing points (1)/(2) require touching the shared
   `HEAVY_KEYWORDS`/`matchesKeyword` mechanism at all, or should the fix
   stay inside `canAutoApprove`'s own haystack-construction (e.g. strip
   markdown-style file citations like `AUDIT.md`/backtick-quoted paths
   before scanning title+description, mirroring D10's structured-vs-free-
   text distinction) — leaving the shared keyword list and its Iron-Law
   reuse (D4) completely untouched?** The item's own description text
   asks for a split list, which D4 was written specifically to rule out;
   a citation-stripping fix would not need one.
2. **Is negation-awareness in scope for this item's fix at all, given D2's
   explicit "mechanical, not a confidence read" design principle exists
   precisely to resist adversarial prose gaming the floor?** If yes, what
   bounds keep a "no risk here" sentence from being trusted uncritically
   by an untrusted (RUL45) item description. If no, the fix should
   explicitly document the negation case as a known, deliberately
   unaddressed limitation rather than silently drop it.

Point (3) (`hasOpenItems`/TODO-FIXME) is already fixed at HEAD (`tsk-3i8`)
and should be dropped from this item's remaining scope once locked.
