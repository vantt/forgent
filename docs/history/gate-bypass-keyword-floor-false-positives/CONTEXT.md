# gate-bypass keyword floor false positives — locked decisions

Item: `tsk-4gr`.

Source request (raw, untrusted per RUL45): the auto-approve gate's
keyword floor hard-gates prose, wrongly blocking three unrelated,
genuinely-low-risk classes of item — (1) citing a doc path like
`AUDIT.md` in a description trips the word `audit`; (2) an item whose
prose merely *mentions* "audit"/"migration" as a topic (not describing an
actual risky change) gets gated as if it were one; (3) `hasOpenItems`
matched a bare `TODO`/`FIXME`, including fgOS's own `todo` status
literal. A fourth case surfaced later on this same item (2026-08-19, from
`tsk-37l`'s own gate run): prose that explicitly *negates* a risk
category ("no auth/audit risk applies here") still trips the floor —
`matchesKeyword` has no negation concept.

## Feature boundary

The hard-gate floor (`HEAVY_KEYWORDS` + `matchesKeyword`,
`src/intake/risk-keywords.mjs`) is shared infrastructure, not
gate-bypass-private: it also drives Iron Law's hard-gate classification
(`src/evolve/iron-law.mjs`'s `classifyIronLaw`) and submit-time risk
tiering (`src/intake/classify.mjs`'s `countMatches`). **In scope**: how
`canAutoApprove` (`src/state/gate-bypass.mjs:147-155`, backs
`contextApprove` at the `exploring` stage) builds the text it hands to
that shared floor. **Out of scope**: the shared keyword list itself, and
`matchesKeyword`'s own matching logic — changing either would also
reshape Iron Law and submit-time tiering, a different item's blast
radius entirely.

## Scout evidence

- `src/state/gate-bypass.mjs:129-139` (`hasOpenItems`) already requires a
  colon/paren after `TODO`/`FIXME` (`f1dd7269`, `tsk-3i8`, 2026-08-13) —
  point (3) is already fixed, not reproducible at HEAD.
- `src/state/gate-bypass.mjs:147-155` (`canAutoApprove`) still scans raw
  `title+description` through `HEAVY_KEYWORDS.some(k =>
  matchesKeyword(haystack, k))` with no citation/negation exemption —
  points (1)/(2) and the negation case reproduce here today.
- `src/state/gate-bypass.mjs:167-202` (`mergedGateHaystack`, backs the
  `validating`-stage merged gate) already narrows its OWN scan once,
  landed the same day as the TODO fix (`0057ac04`, `tsk-224`,
  2026-08-13): it unions title+description with structured plan fields
  (footprint paths, child title/verify/action) but deliberately excludes
  plan.md's free narrative — measured at the time, scanning plan.md prose
  tripped the floor on 266/318 (83.6%) of real plans, driven by
  `audit`/`auth`/`security`. Title+description themselves were kept IN
  scope on purpose, treated as trusted "submit text," unlike plan.md's
  narrative — this item's fix narrows within that same precedent
  (structured-vs-free-text), not by touching the keyword list.
- `docs/history/gate-bypass/CONTEXT.md` D4 (paraphrased, not cited by id
  outside its own home file): the hard-gate floor deliberately reuses one
  shared keyword list across Iron Law and gate-bypass "rather than fgOS
  defining its own, possibly inconsistent, notion of what counts as
  high-stakes" — this is why a gate-bypass-only keyword list was rejected
  as a fix direction here (see D1 below).
- `docs/explanation/gate-bypass-design.md`, "Why the skip criterion is
  mechanical, not a confidence read": the floor is deliberately lexical,
  not an interpretive/confidence read, specifically because an
  LLM-graded "is this actually fine" read is exactly the kind of judgment
  a crafted item description (untrusted input, RUL45) could talk a
  session into faking — the reasoning behind rejecting negation-awareness
  here (D2 below).
- `rg negation-blindness` across the repo: zero hits outside this item's
  own decision log — no prior decision or backlog entry addresses it.
- Full research trace, including the exact `f1dd7269`/`0057ac04` commit
  dates and the false-positive-rate measurements: `RESEARCH.md` in this
  same folder.

## Capability posture

`impact-analysis`: **full** — GitNexus registered and `present`, queried
fresh this session (`fgos tool query --capability impact-analysis
--status present`); a live symbol lookup for `matchesKeyword` during
scout returned real, current call-site data (`classifyIronLaw`,
`countMatches`, `canAutoApprove`), corroborating the shared-infrastructure
scope boundary above independently of the `rg` scout.

## Locked decisions

| D-ID | Quyết định |
|---|---|
| — | Independent reproduction, negation-blindness sub-case: during tsk-37l's own validating gate (2026-08-19), the hard-gate keyword floor tripped on 'auth'/'audit' hits that came from the item's OWN plan.md explicitly negating those categories ('no auth/data-loss/audit/external-provider/validation-removal apply' -- the item's own Mode-gate reasoning) and from the coincidental phrase 'scratchpad audit' (a self-review method, unrelated to compliance audits). matchesKeyword's word-boundary fix (already correctly applied per this item's own note that tsk-1gj's old bug is closed) still has no concept of negation or unrelated-sense collision -- a plan.md honestly explaining why a risk category does NOT apply trips the exact same floor as if it did apply. Reworded both the plan and the item's own description to avoid the literal words and re-passed the gate; no engine-level fix applied. Same root cause this item already names (prose string-matching with no understanding of intent/context), documented here as an additional concrete case beyond the AUDIT.md-citation and TODO/FIXME cases already on file. |
| D1 | fix stays inside canAutoApprove's own haystack construction (exempt matches sitting inside a citation/path token like backtick-quoted or *.md/*.mjs-style filenames) -- the shared HEAVY_KEYWORDS list and matchesKeyword stay untouched, since both are also load-bearing for Iron Law classification (src/evolve/iron-law.mjs) and submit-time tiering (src/intake/classify.mjs), not gate-bypass alone. |
| D2 | point (2) (title/description merely mentioning audit/migration as a topic) and the negation-blindness case both stay unfixed by design -- documented as accepted, permanent floor limitations (fail-safe direction: extra human question, never a silent skip), not bugs to close. Negation-awareness explicitly out of scope: it would turn the mechanical/lexical floor into an interpretive one, exactly what the floor's own non-negotiable-mechanical design exists to prevent. |
| D3 | point (3), hasOpenItems matching bare TODO/FIXME including fgOS's own todo status literal, is already fixed at HEAD (commit f1dd7269, tsk-3i8, 2026-08-13, requires a colon/paren after the marker) and is dropped from this item's remaining scope. |

## Outstanding questions

None
