# RESEARCH: F8 fix -- drop bare D-local citation from generated wrappers

## Round 1 (tsk-352f, stage discovery)

**Goal:** resolve exactly how to fix F8 (src/setup/skill-wrappers.mjs:45
embeds "D5/D7" — a bare D-local citation — into every generated skill
wrapper) with real grounding, not a guess.

**Checked:** `docs/decisions/0017-dong-audit-he-id-ten-goi.md` (full read),
`docs/history/install-setup-external-project-reliability/{CONTEXT,plan,
DISCUSSION}.md` (D5/D7's real content), `src/setup/skill-wrappers.mjs`
(full read), `test/setup/skill-wrappers.test.mjs`,
`test/skills/fgos-mirror.test.mjs`, `test/e2e/coexistence-canary.test.mjs`.

**Decision 0017's exact rule, confirmed by direct quote** (`:51-52`):
"**D-local không bao giờ được trích dẫn ngoài file `CONTEXT.md` gốc của
nó.**" (a D-local id is never cited outside its own home CONTEXT.md,
gloss or not) — matches exactly what
`check-decision-citation-drift.mjs`'s `d-local-outside-home` finding
message already says ("inline the content, delete the id").

**D5/D7's real content, confirmed by direct quote** (not guessed):
- **D5** (`DISCUSSION.md:43`): `.agents/skills` becomes the real
  orchestrator-neutral skill source; `.claude/skills` becomes a thin
  wrapper `fgos setup` auto-generates for every project.
- **D7** (`DISCUSSION.md:58`): wrapper generation uses ONE shared
  generator function (`src/setup/skill-wrappers.mjs`), called from two
  places (`npm run build:skills` and `fgos setup`'s external-project
  materialize path); wrapper is always self-contained in the target
  project (never points back at a global install path).

**Fix is minimal, no information loss:** the wrapper's own sentence
("This is a generated thin wrapper -- do not edit directly, edit the
source instead.") is already fully self-contained — a reader does not
need D5/D7's content to understand or act on that instruction. The
citation was a pure traceability breadcrumb, not load-bearing
information, so dropping it (not inlining D5/D7's content) is the
correct minimal fix — "tsk-1qi" (the work-item id) already stays in the
sentence and is sufficient traceability on its own (`fgos show tsk-1qi`
finds D5/D7 for anyone who needs them); item ids are not D-local ids and
are fine to cite anywhere, unlike `D<n>`.

**Blast radius, confirmed by direct grep:**
- The literal string `"generated thin wrapper (tsk-1qi D5/D7)"` exists
  ONLY in `.claude/skills/**/SKILL.md` (15 of 22 files there — the
  launcher/orchestrator skills like `cook`/`submit`/`pick` are not thin
  wrappers and don't carry it). Zero occurrences in
  `plugins/fgOS/skills/` (a full byte-identical mirror of
  `.agents/skills` sources, no wrapper boilerplate) or `.agents/skills/`
  itself (the canonical source, naturally has none).
- `src/setup/skill-wrappers.mjs`'s own header/doc comments (`:2`, `:98`)
  also cite "D5/D7" — these are source-code comments, never scanned by
  any citation checker (`--skills-dir` only ever covered `.md` skill
  files), and not user-facing generated output — left alone, out of this
  fix's scope (a comment inside its own source file citing the decision
  that motivated it is normal engineering practice, not the
  cited-outside-its-home pattern decision 0017 is about).
- `test/e2e/coexistence-canary.test.mjs` also mentions "D5/D7" — a
  DIFFERENT decision's own D5/D7 (install-coexistence, unrelated to
  tsk-1qi) — not touched by this fix.

**Tests checked, none assert the exact string:** `test/setup/skill-wrappers.test.mjs`
asserts frontmatter preservation, redirect-path presence, no-source-body-leak,
no-global-path-leak — never the literal boilerplate sentence text.
`test/skills/fgos-mirror.test.mjs` asserts byte-identical mirroring
between `.claude/skills`/`plugins/fgOS/skills` and their sources — this
means after changing the template, every existing `.claude/skills/**/SKILL.md`
wrapper file must be regenerated (`npm run build:skills`,
`scripts/build-skill-wrappers.mjs`) or this mirror test will fail on the
stale committed wrappers.

**Fix approach:** in `generateWrapperContent`
(`src/setup/skill-wrappers.mjs:38-49`), change the boilerplate line at
`:45` from `'This is a generated thin wrapper (tsk-1qi D5/D7) -- ...'`
to `'This is a generated thin wrapper (tsk-1qi) -- ...'` (drop the
D-local suffix, keep the item id). Then run `npm run build:skills` to
regenerate all 22 `.claude/skills/**/SKILL.md` wrapper files so the
mirror test stays green.

**Verify strategy:** `npm run build:skills && npm test` — the build
regenerates every wrapper from the fixed template, and the existing test
suite (`test/setup/skill-wrappers.test.mjs`, `test/skills/fgos-mirror.test.mjs`)
already proves the wrapper's structural correctness; a grep-based
assertion that no generated wrapper contains a bare `D<n>` pattern
outside its own `CONTEXT.md` closes the loop for THIS specific
regression (added as a new unit test on `generateWrapperContent`'s
output, not a new CLI flag).
