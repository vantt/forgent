# plan.md — tsk-22b: Data Dictionary #7/#7b missing `no-stuck-merge-abort`

Mode: tiny

Lane decided directly (no prior `fgos-routing` Orient handoff in this
drive): flag count 1 — "existing covered behavior"
(`test/setup/registrations.test.mjs`'s Data Dictionary #7/#7b tests already
cover this exact contract and are currently red). No auth, data model,
audit/security code change, external system, public contract, cross-platform,
weak-proof area, or multi-domain flag applies — this is a docs-only string
addition. 0–1 flags → tiny/small; tiny fits: one file, one direct task.

`fgos graph --json`'s `criticalPath`/`topUnblock` do not name tsk-22b or
anything touching `docs/specs/distribution.md` — this item is a standalone
leaf, no ordering dependency to honor.

## Approach

**Chosen path:** add `` `no-stuck-merge-abort` (tsk-40a) `` to the end of
both Data Dictionary row #7 ("Today's registered checks") and row #7b
("Today's registered fixes") lists in `docs/specs/distribution.md`, matching
the exact citation format every other cited entry in those rows already
uses (backtick id, optional space + `(tsk-xxx)`). See
`RESEARCH.md` Round 1 for the confirmed current row text, the confirmed
registry source (`src/setup/registrations.mjs:2424-2433`), and the confirmed
citation format.

**Alternatives rejected:** none genuinely competing — this is a direct
1:1 fix for a confirmed drift between the registry and its own Data
Dictionary spec row (the exact class of bug those two `registrations.test.mjs`
tests exist to catch). No design choice to debate.

**Risk map:** one component (`docs/specs/distribution.md` prose), risk light
— a string-list addition, unambiguous target/format confirmed live. No proof
point beyond the verify command below; impact-analysis gate not consulted
(no blast-radius claim to back — this is a doc row, not code).

**Files touched, in order:**
1. `docs/specs/distribution.md` — append the citation to row #7, then row #7b.

## Shape

Single direct edit, no split. Concrete case sketched: after the edit,
`test/setup/registrations.test.mjs`'s two Data Dictionary tests
(`deepStrictEqual` against the live registry) must both pass, going from
26 pass / 2 fail to 28 pass / 0 fail — this is both the boundary case (exact
list match, no stray entry, no missing one) and the regression check
(nothing else in the suite affected, since only these two rows' prose text
changes).

## Outstanding questions

None

## Verify

```
node --test test/setup/registrations.test.mjs
```
