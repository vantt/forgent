# Plan: drop bare D-local citation from generated skill wrappers

Mode: **small** (1 flag per fgos-routing's Mode gate — "existing covered
behavior": `test/setup/skill-wrappers.test.mjs` +
`test/skills/fgos-mirror.test.mjs` already cover this function/its
output and must keep passing. No other flag applies). No `CONTEXT.md` —
discovery's own verdict was `clear`, skipping `exploring`; every claim
below traces to `RESEARCH.md`'s Round 1 (same dir).

## Approach

**The bug (F8, RESEARCH.md Round 1):** `generateWrapperContent`
(`src/setup/skill-wrappers.mjs:38-49`) embeds the literal line `'This is
a generated thin wrapper (tsk-1qi D5/D7) -- do not edit directly, edit
the source instead.\n'` into every generated `.claude/skills/**/SKILL.md`.
`D5/D7` is a D-local id cited outside its own home `CONTEXT.md`
(`docs/history/install-setup-external-project-reliability/CONTEXT.md`),
violating decision 0017's own locked rule, verbatim: "D-local không bao
giờ được trích dẫn ngoài file `CONTEXT.md` gốc của nó."

**Chosen fix:** drop the `D5/D7` suffix, keep `tsk-1qi` (a work-item id,
not a D-local id — fine to cite anywhere; `fgos show tsk-1qi` is
sufficient traceability to the real decisions for anyone who needs them).
The sentence itself needs no D5/D7 content inlined — "this is generated,
edit the source instead" is already fully self-contained; the citation
was pure traceability breadcrumb, never load-bearing meaning (RESEARCH.md
confirms this by reading D5/D7's own real content: source/generator
design decisions, irrelevant to a reader following the wrapper's redirect
instruction).

**Rejected alternative:** inline D5/D7's actual content into the
sentence. Rejected — decision 0017's own remedy ("inline the content and
delete the id") applies when the CONTENT is needed to understand the
citing sentence; here it is not (confirmed by reading D5/D7's real text
in RESEARCH.md) — inlining would just bloat 22 generated files with
design-decision prose irrelevant to a wrapper reader.

**Files touched:**
- `src/setup/skill-wrappers.mjs:45` — the one template-string line.
- `.claude/skills/**/SKILL.md` (22 files, 15 of which currently carry the
  string) — regenerated via `npm run build:skills`
  (`scripts/build-skill-wrappers.mjs`), never hand-edited (they're
  generated output; `test/skills/fgos-mirror.test.mjs` enforces this).
- `test/setup/skill-wrappers.test.mjs` — one new regression test.

**Order:** template-string fix first (one line), then regen (depends on
the fixed template being correct — verified by the new unit test first,
so the regen is trusted), then the full verify command last (proves the
regenerated files are consistent with everything else).

**Impact-analysis posture:** `degraded`. `fgos tool query --capability
impact-analysis --status present` reports gitnexus `present`, but
`impact({target:'generateWrapperContent', direction:'upstream'})`
returned `impactedCount: 0` with `epistemic: 'exact'` — a **suspicious
zero-result** per `CLAUDE.md`'s own gate (GitNexus's own inline tool-map
note earlier in this session already named real callers:
`fgos-mirror.test.mjs`, `skill-wrappers.test.mjs`,
`generateAllSkillWrappers`, directly contradicting this call's "exact
zero" claim). Cross-checked directly: `grep -rn "generateWrapperContent"
src/ test/ scripts/` confirms 3 real call sites — `generateAllSkillWrappers`
(same file, `:74`), and both test files (4 call sites total across them).
Blast radius is real, small, and confirmed by grep, not the (wrong) tool
result.

## Risk map

| Component | How risky | What proves it |
|---|---|---|
| Template-string edit (1 line) | Low — pure string literal change, no logic touched | New unit test asserting the generated wrapper no longer contains a bare `D<n>` pattern outside its own CONTEXT.md context |
| Regenerating 22 `.claude/skills/**/SKILL.md` files | Low — mechanical, deterministic (`npm run build:skills` already exists and is exercised by CI-equivalent `fgos-mirror.test.mjs`) | Full verify command (`npm run build:skills && npm test`) — broadened beyond this file's own narrow test because the regen touches 22 committed files repo-wide; matches this session's own precedent for "regenerate many files, verify broadly" (tsk-3x8's baseline regen) |
| `plugins/fgOS/skills/` / `.agents/skills/` | None — confirmed via grep (RESEARCH.md): neither tree contains this string at all, so this fix cannot touch them | n/a, out of blast radius entirely |

## Shape

One honest piece of work, no split (pass-through). Concrete case to prove
against:

- **Regression case for F8 (the actual fix):** call `generateWrapperContent`
  with a sample frontmatter-bearing source, assert the output does NOT
  match `/\bD\d{1,2}\b/` (no bare D-local id survives), and DOES still
  contain `tsk-1qi` (traceability preserved).
- **Existing behavior preserved:** all 4 existing
  `test/setup/skill-wrappers.test.mjs` tests (frontmatter-byte-identical,
  redirect-path-named, no-source-body-leak, throws-on-no-frontmatter) and
  `test/skills/fgos-mirror.test.mjs`'s byte-identical mirror check keep
  passing unmodified — the fix changes only prose wording, never the
  structural contract those tests assert.
- **Regen consistency:** `npm run build:skills` run once after the
  template fix, then `npm test` proves every regenerated
  `.claude/skills/**/SKILL.md` is self-consistent with the fixed
  generator (the mirror test's own job).

## Verify

`npm run build:skills && npm test` — already the item's own real
`verify` field (synced at discovery). Broadened past this one file's own
test on purpose: the fix's real output is 22 regenerated, committed
files, so the full suite is the honest proof surface, not a narrower
slice that would leave the regen's repo-wide effect unchecked.

## Outstanding questions

None for this item's own actionable scope (F8). The other two findings
from the same review round — (a) whether to port or retire
citation-format checking once `tsk-1lv` lands, and (b) widening
`WIDE_SWEEP_ROOTS` to cover `.agents/skills`/`.claude/skills` — are
**explicitly blocked on `tsk-1lv` merging first** (its own target code,
`scripts/check-decision-citation-drift.mjs`'s rewrite and
`WIDE_SWEEP_ROOTS`, does not exist on `main` yet — nothing to edit here
today). Not silently dropped: recorded on `tsk-1lv` itself via `fgos
decision` (this session, prior turn) so whoever lands that branch sees
it, and named here so this item's own scope stays honest about what it
did NOT attempt.
