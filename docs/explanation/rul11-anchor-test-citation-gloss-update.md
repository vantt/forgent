---
authoritative_for: RUL11 anchor-phrase test updated to accept a glossed ADR0036 citation (tsk-3uw4)
---

# Why the RUL11 anchor-phrase test needed updating for a citation gloss

`tsk-2sp-5`'s citation-format cleanup pass hit a real blocker on
`docs/specs/platform-foundations.md`'s RUL11 line: the bare `ADR0036`
citation needed a one-line gloss to satisfy `check-decision-citation-
drift.mjs`, but `test/docs/rul11-anchor-phrase.test.mjs`
(`tsk-7u7`) asserted the RUL11 law text **word-for-word**, with no gloss
— any edit to add one would break that test. This was parked as an
`ask` rather than silently choosing a side.

## The decision (2026-08-19)

The user picked **option (b)**: update the test to accept the glossed
line, and apply the real gloss fix — over the alternative (a permanent
baseline exception carving this one line out of the citation-drift
check forever). The reasoning: a permanent exception hides real citation
debt behind an excuse, while updating the test's expected string is a
one-time, honest cost.

## What changed

`docs/specs/platform-foundations.md`'s RUL11 line now reads (excerpt):

```
- **RUL11 (tùm lum không phải nặng).** ... đích là ranh giới rõ và contract
  tường minh (ADR0036 (khoá RUL11 theo đúng phát biểu gốc của người dùng,
  cấm diễn giải lại)).
```

`test/docs/rul11-anchor-phrase.test.mjs`'s `RUL11_LAW` constant was
updated to match this exact string, including the gloss — the test's own
comment now notes both files must be edited together if the law's wording
ever changes again. `check-decision-citation-drift.mjs` reports 0
findings on this line as a result (previously 2).

## The general lesson

A locked-law test that asserts prose text word-for-word will collide with
any later documentation-quality pass (like a citation-format cleanup) that
needs to touch that same text. When that collision surfaces, the choice
is between updating the test's expectation (small, one-time,
maintainability cost stays low) or carving a permanent exception into a
different check (which quietly grows unbounded to cover more special
cases over time). This item is the concrete precedent for picking the
former.
