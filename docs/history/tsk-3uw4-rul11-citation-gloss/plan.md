# plan.md — tsk-3uw4

Mode: tiny

## Approach

Discovery came back `clear` (no `exploring`/`CONTEXT.md` round needed for
this item — the fix and its precedent were fully resolved by research).
Evidence lives in `RESEARCH.md`'s Round 1 in this same directory; every
claim below traces back to it.

Two mechanically-linked edits, always made together:

1. `docs/specs/platform-foundations.md:74` — the RUL11 line gets a
   self-gloss after `RUL11` (matching every sibling `RULn` line's own
   established shape, RESEARCH.md Round 1) and its `(per D-ADR0036)`
   trailer moves to the `ADR0036 (<gloss>)` shape `citation-format.md`
   requires (same shape already used for `ADR0020`/`ADR0012` elsewhere in
   these same docs, RESEARCH.md Round 1).
2. `test/docs/rul11-anchor-phrase.test.mjs`'s `RUL11_LAW` constant gets
   updated to the exact same new line text — the test's own comment
   ("edit both this test and the spec together if the law changes")
   already names this as the correct move; the assertion logic itself
   (word-for-word match) does not change.

No named library/precedent needed a `consult` dispatch beyond the repo
reads already in RESEARCH.md.

Risk map: single component (one spec line + one test constant), risk
`light` — a pure text/string edit with no runtime code path, already
scoped by tsk-2sp-5's own parked ask to be exactly this and nothing more.
No proof point beyond running the two commands (test + citation checker)
in Verify below; no blast-radius/impact-analysis concern (docs+test only,
no symbol touched).

## Shape

Single piece, no split:

- Edit `docs/specs/platform-foundations.md` line 74 to:
  `- **RUL11 (tùm lum không phải nặng).** Việc trở nặng không vì bản chất
  nó lớn mà vì thiếu và quên — tên đúng của tình trạng đó là tùm lum,
  không phải nặng; thấy tùm lum thì gom lại, gom tới khi hết, quy mô
  không bao giờ là lý do miễn trừ, đích là ranh giới rõ và contract tường
  minh (ADR0036 (khoá RUL11 theo đúng phát biểu gốc của người dùng, cấm
  diễn giải lại)).`
- Edit `test/docs/rul11-anchor-phrase.test.mjs`'s `RUL11_LAW` constant to
  the exact same string (everything after `**RUL11 (...).** `).
- Run the Verify command below; on green, `fgos return`.

No footprint overlap with anything else currently in flight — these two
files are not touched by any other open item (tsk-2sp's own children
already delivered and merged before this item was even claimed).

## Verify

```
node --test test/docs/rul11-anchor-phrase.test.mjs && node scripts/check-decision-citation-drift.mjs --decisions-dir docs/decisions --backlog docs/backlog.md --specs-dir docs/specs --skills-dir .agents/skills --skills-dir plugins/fgOS/skills --write-baseline && node -e "const d=require('./scripts/check-decision-citation-drift.baseline.json'); const r=(d['docs/specs/platform-foundations.md']||[]); if(r.length!==0){console.error('still',r.length,'findings on platform-foundations.md');process.exit(1);} console.log('platform-foundations.md findings: 0');"
```

(`npm test -- <file>` was tried first and rejected: `package.json`'s
`test` script hardcodes `node --test 'test/**/*.test.mjs'` with no
argument-passthrough, so `npm test -- <file>` appends the file as an
extra positional arg alongside the full glob instead of replacing it —
runs the entire suite, not just this test. Confirmed live: it ran past
its 120s timeout instead of the 242ms a scoped `node --test <file>` run
actually took. Calling `node --test` directly is the correct scope.)

impact-analysis: full (`fgos tool query --capability impact-analysis
--status present` shows gitnexus registered and present) — not applied
as evidence here because it is not applicable: this item touches no code
symbol, only a docs/spec prose line and a hardcoded test string
constant, so there is no blast radius for `impact`/`context` to trace.

## Outstanding questions

None
