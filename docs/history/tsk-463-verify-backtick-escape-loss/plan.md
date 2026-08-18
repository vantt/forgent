# Plan: tsk-463 — prevent backtick-escape loss when transcribing a verify command

Mode: **small** (direct-entry fallback). Flags: only "existing covered
behavior" arguably applies (skill-prose files have mirror-test coverage);
this is a docs-only, additive, zero-behavior-change piece touching 4
files, no gray areas — small, not tiny (more than "a couple of files").

No `CONTEXT.md` — discovery verdict came back `clear`. Evidence base is
`RESEARCH.md`.

## Approach

**Confirmed still accurate, current code/docs (RESEARCH.md Round 1).**
`work.verify` can lose a backslash-escaped backtick during hand-
transcription from a `plan.md` markdown fence into a `--verify` CLI
argument — the resulting string is still *syntactically valid* shell
(backtick command substitution parses fine), so it fails much later, at
`return` time, with a confusing "command not found" or wrong-output
result rather than a clean syntax error. No existing doc covers this
specific failure mode (`fix-a-verify-command-broken-by-mixed-in-prose.md`
covers a different, syntax-error symptom).

**Relationship to tsk-1yt (dependency, currently `doing` — another
session is live on it right now).** tsk-1yt's own already-locked D2
("syntax only, never semantics") explicitly excludes this bug class: a
string with lost escapes is syntactically fine, so tsk-1yt's own planned
`sh -n`-style check would not reliably catch it. **Not redundant.**
Scoped to avoid any file tsk-1yt's own locked D1 claims (`store.mjs`,
`discovery.mjs`, `plan.mjs`, `verify-pattern-check.mjs`) — this item
touches none of those.

**Fix: prevention at the transcription point, not detection after the
fact.** A new how-to doc, `docs/how-to/preserve-shell-escapes-when-
transcribing-a-verify-command.md`, mirroring
`fix-a-verify-command-broken-by-mixed-in-prose.md`'s own structure
(concrete before/after example, why it happens, how to avoid it) —
pointed to from the two places a session actually writes a `--verify`
value from `plan.md` prose:

1. `fgos-coding-planning`'s own step 5 ("Leave execution alone") — the
   general case, right next to the existing skill-prose-specific pointer
   (`docs/how-to/write-verify-for-a-skill-prose-change.md`), and directly
   inside the sync-step tsk-14a is adding to this same step (a new,
   currently-unmerged call site carrying this identical risk — confirmed
   in `RESEARCH.md`).
2. `fgos-coding-implement`'s own step 3 ("Verify — proof, not
   assertion") — as a diagnostic pointer for when a verify command fails
   with a confusing "command not found"/wrong-output result instead of a
   clean test failure, the same shape
   `fix-a-verify-command-broken-by-mixed-in-prose.md` already gives its
   own symptom.

**Proof point.** `impact-analysis`: not applicable — no `src/` symbol
touched, only skill-prose and a new docs file (per this repo's own
tsk-38h note on `bin/fgos.mjs`'s zero-symbol-coverage, the same class of
"nothing for GitNexus to measure" already established for tsk-14a).

**Smaller path considered and rejected:** folding this into the existing
`write-verify-for-a-skill-prose-change.md` doc instead of a new file.
Rejected: that doc's own opening line scopes it explicitly to
skill-prose-path changes ("Dùng khi item bạn đang làm thay đổi nội dung
prose của một skill") — tsk-463's own reported incident (tsk-12p) is
about an ordinary code-change item's verify command, not a skill-prose
one. Embedding a general warning inside a narrowly-scoped doc would
either widen that doc's own stated scope or bury the warning where a
non-skill-prose item's own session would never be pointed at it.

## Shape

One piece, pass-through (no split). Files touched:

- `docs/how-to/preserve-shell-escapes-when-transcribing-a-verify-command.md`
  (new) — the how-to itself.
- `.claude/skills/fgos-coding-planning/SKILL.md`,
  `.agents/skills/fgos-coding-planning/SKILL.md`,
  `plugins/fgOS/skills/fgos-coding-planning/SKILL.md` (mirrored,
  `test/skills/fgos-mirror.test.mjs`'s own byte-identical requirement,
  confirmed live by tsk-14a's own implementation round) — a pointer at
  step 5.
- `.claude/skills/fgos-coding-implement/SKILL.md`,
  `.agents/skills/fgos-coding-implement/SKILL.md`,
  `plugins/fgOS/skills/fgos-coding-implement/SKILL.md` (same mirror
  requirement) — a pointer at step 3.

### Cases this needs to hold for

- A session writing `fgos edit --verify`/`fgos add --verify` for a
  command containing a backtick, copied from a `plan.md` fence — the new
  doc is reachable from the exact step that does this (`fgos-coding-
  planning` step 5), before the transcription happens.
- A session diagnosing an already-blocked item whose `return` failed with
  a confusing (not-a-clean-syntax-error) result — the new doc is
  reachable from `fgos-coding-implement` step 3, the step that runs
  verify and would hit this symptom.
- tsk-1yt's own eventual work (whatever write-time validation it lands)
  — entirely unaffected; this item touches none of the files tsk-1yt's
  own D1 claims.

## Verify

Per `docs/how-to/write-verify-for-a-skill-prose-change.md` (this item
touches `.claude/skills/**/SKILL.md` paths):

```bash
npm test && \
test -f docs/how-to/preserve-shell-escapes-when-transcribing-a-verify-command.md && \
grep -q 'backslash-escaped backtick' .claude/skills/fgos-coding-planning/SKILL.md && \
grep -q 'backslash-escaped backtick' .claude/skills/fgos-coding-implement/SKILL.md && \
! git diff --name-only main...HEAD | grep -qvE '^(docs/how-to/preserve-shell-escapes-when-transcribing-a-verify-command\.md|\.claude/skills/fgos-coding-(planning|implement)/SKILL\.md|\.agents/skills/fgos-coding-(planning|implement)/SKILL\.md|plugins/fgOS/skills/fgos-coding-(planning|implement)/SKILL\.md|docs/history/tsk-463-verify-backtick-escape-loss/.*)$'
```

- `npm test` — regression floor, plus (via `fgos-mirror.test.mjs`) proof
  the six mirrored skill files stay byte-identical.
- POSITIVE — the new doc exists, and both pointer skills reference it via
  a distinctive phrase.
- NEGATIVE/scope-guard — nothing outside the intended files (and this
  item's own docs history) changed — in particular, none of tsk-1yt's own
  claimed files.

## Outstanding questions

None
