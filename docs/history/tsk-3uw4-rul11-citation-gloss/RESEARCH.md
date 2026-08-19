# RESEARCH.md — tsk-3uw4

## Round 1 — 2026-08-19

**Asked:** What does `test/docs/rul11-anchor-phrase.test.mjs` actually
assert against `docs/specs/platform-foundations.md`'s RUL11 line, what is
the current RUL11 line text, what does `citation-format.md`'s gloss
contract require, and does decision 0036 (ADR0036) lock the wording in a
way that forbids a synced test+spec change?

**Checked:**
- `test/docs/rul11-anchor-phrase.test.mjs` (read in full). Four tests:
  anchor phrase in `AGENTS.md`, a `**RUL11.**` line exists, that line
  matches a hardcoded `RUL11_LAW` constant word-for-word, and a
  `### 0036 — Khoá RUL11` heading exists. The third test's own inline
  comment: `"RUL11 text must match the locked wording exactly -- edit
  both this test and the spec together if the law changes"` — the
  mechanism explicitly expects synced test+spec edits, not a permanent
  freeze.
- `docs/specs/platform-foundations.md:74` — current line: `- **RUL11.**
  Việc trở nặng ... (per D-ADR0036).` — no self-gloss after `RUL11`
  (unlike every other RULn line in this file), and the trailing `(per
  D-ADR0036)` puts the `ADR0036` id inside a parenthetical instead of
  being immediately followed by its own gloss parenthetical.
- `.agents/skills/_shared/citation-format.md` — the rule: `ADR`/`RUL`
  ids cite as `<ID> (<gloss>)`, gloss must sit immediately after the id.
- `scripts/check-decision-citation-drift.mjs` — `CITATION_RE =
  /\b(ADR|RUL|D)(\d{1,4})\b(\s*(\([^)]*\)))?/g`; `isGlossed()` requires a
  real parenthetical directly after the matched id. On the RUL11 line
  this fires twice: once for `RUL11` itself (no `(...)` right after it),
  once for `ADR0036` (matched inside the *existing* `(per D-ADR0036)`
  parenthetical, but nothing new follows `0036` before the closing
  paren).
- `docs/specs/platform-foundations.md:64-73` (RUL1–RUL10) — established,
  consistent precedent: every one already reads `**RULn (<short
  gloss>).**`, e.g. `**RUL9 (doctrine nạp-mọi-turn: placement test,
  transport mệnh lệnh, anchor phrase).**`. RUL11 is the only outlier
  missing this shape.
- Other prose in the SAME file (lines 444/449/463) already glosses RUL11
  consistently as `RUL11 (tùm lum không phải nặng)` when referring to it
  — this is the file's own already-adopted gloss for RUL11, not a new
  invention.
- `docs/specs/platform-foundations.md:387-420` (`### 0036 — Khoá RUL11`)
  — the decision narrative: the user's original quote (Bối cảnh) is the
  free-flowing tùm lum/nặng paragraph; the Business Rules entry is
  already a "bản chưng" (formalized rendering) of it, not the raw quote
  verbatim. The citation trailer `(per D-ADR0036)` is not part of the
  user's quote at all — it is packaging added when the rule was written
  into Business Rules, using the OLDER pre-`citation-format.md` bare-cite
  convention. Decision 0036 locks the rule's *substantive content*
  (tùm lum ≠ nặng, gom lại, no scale exemption, clear boundary/contract),
  never the citation-format packaging around it.
- Other files' established precedent for glossing an `ADR<n>` id inline,
  matching the required shape: `ADR0020 (chặn .fgos/ khỏi worktree worker
  — ...)` (`docs/specs/enduser-docs-index.md:91,193`, `docs/specs/
  runner.md:965`), `ADR0012 (đồ thị typed-edge derive trên work item —
  ...)` (`docs/specs/work-state.md:48`).

**Found:**
- The two findings are: (1) `RUL11` itself needs a self-gloss matching
  every sibling RULn line's own shape, and (2) `ADR0036`'s citation needs
  to move from `(per D-ADR0036)` to `ADR0036 (<gloss>)` per the same rule
  every other `ADR<n>` citation in the docs already follows.
- The minimal correct fix, keeping the test's own locked-wording
  discipline intact (edit both together, per the test's own comment):
  - Spec line 74 becomes: `- **RUL11 (tùm lum không phải nặng).** Việc
    trở nặng không vì bản chất nó lớn mà vì thiếu và quên — tên đúng của
    tình trạng đó là tùm lum, không phải nặng; thấy tùm lum thì gom lại,
    gom tới khi hết, quy mô không bao giờ là lý do miễn trừ, đích là
    ranh giới rõ và contract tường minh (ADR0036 (khoá RUL11 theo đúng
    phát biểu gốc của người dùng, cấm diễn giải lại)).`
  - `test/docs/rul11-anchor-phrase.test.mjs`'s `RUL11_LAW` constant
    updated to the exact same new string (the third test still asserts
    exact match — that assertion itself does not change, only the two
    constants/spec-line move together).
  - `docs/specs/platform-foundations.md`'s existing prose references to
    "RUL11 (tùm lum không phải nặng)" (lines ~444/449/463) already use
    this exact gloss text — no change needed there, confirms consistency.
- No lock forbids this: decision 0036's own narrative and the test's own
  comment both anticipate exactly this kind of synced update.

**Still open:** none — both findings have a concrete, precedent-backed
fix; the premise (test change unlocks a citation-format-only wording
change) is confirmed permitted, not forbidden.

**Verdict:** clear. Verify: `npm test -- test/docs/rul11-anchor-phrase.test.mjs
&& node scripts/check-decision-citation-drift.mjs --decisions-dir docs/decisions
--backlog docs/backlog.md --specs-dir docs/specs --skills-dir .agents/skills
--skills-dir plugins/fgOS/skills --write-baseline && node -e "const d=require('./scripts/check-decision-citation-drift.baseline.json');
const r=(d['docs/specs/platform-foundations.md']||[]); if(r.length!==0){console.error('still',r.length,'findings on platform-foundations.md');process.exit(1);}
console.log('platform-foundations.md findings: 0');"`
