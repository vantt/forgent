# fgos skill discovery gap — plan

## Mode

**Standard.** *Reshaped at `fgos-executing`*: the first pass at this plan
(below, kept for the record) classified this as a `spike` because a
single yes/no question decides whether any fix is real — that framing
still holds for the *hypothesis*, but executing found the actual blast
radius of applying the fix is far wider than "8 markdown files +
`AGENTS.md`". Flags against `CONTEXT.md`'s D1 (root-cause before
fixing), recounted with the real scope now known:

- **existing covered behavior** — `src/runner/dispatch.mjs:124` hardcodes
  `` `.claude/skills/fgos/${skillName}/SKILL.md` `` to build worker
  dispatch prompts (covered by `test/runner/dispatch.test.mjs:149` and
  `test/runner/prompt-templates.test.mjs:119/127`, which assert the
  literal path string);
- **weak proof around the area** — still true, no one has verified how
  the harness's project-skill scan actually behaves;
- a third, found only at executing: a **tested structural invariant** —
  `.agents/skills/fgos/` mirrors `.claude/skills/fgos/` byte-for-byte
  (`docs/specs/runner.md` D4), enforced by
  `test/skills/fgos-mirror.test.mjs`. A rename that touches one side
  without the other fails that test outright.

3 flags (2 hard-gate-adjacent: covered dispatch behavior + a tested
invariant) puts this at `standard`, not `spike` — the original mode
undercounted because `fgos-planning`'s first pass only grepped
`AGENTS.md`/`CLAUDE.md`, never `src/`/`test/`.

## Approach

**Evidence carried forward from the first pass (cites `CONTEXT.md` D1,
not reopened):**

`plugins/fgOS/` and `.claude/skills/fgos/` are the same string once
case-folded (`"fgOS".toLowerCase() === "fgos"`). Neither `gitnexus` nor
`distill` — both discoverable today — has a same-named plugin under
`plugins/` (`dogfood-fixture/`, `fgOS/` are the only two). This is
still the strongest available lead for *why* the 8 `fgos-*` skills are
invisible to `Skill()`, scoped and unscoped alike.

**Rejected alternative (unchanged from the first pass, now reinforced):**
duplicating the 8 skills into `plugins/fgOS/skills/*` was rejected
because it doubles maintenance of routing-critical text and never
tests the collision hypothesis. That reasoning holds even more now that
the rename is known to be bigger — a bigger rename is still evidence,
where a bigger duplication is just more permanent workaround.

**Full scope, found by `grep -rln '\.claude/skills/fgos/\|\.agents/skills/fgos/' --include='*.md' --include='*.mjs' .` scoped to this repo's own tracked tree (excluding other worktrees under `.claude/worktrees/`, which are separate items' own branches, not this one's to touch):**

| Area | Files | Change |
|---|---|---|
| Skill content | `.claude/skills/fgos/<8 names>/SKILL.md` | `git mv` to `.claude/skills/fgos-workflow/<name>/SKILL.md`; update each file's own self-references to sibling `.claude/skills/fgos/...` paths |
| Mirror | `.agents/skills/fgos/<8 names>/SKILL.md` | Same `git mv` to `.agents/skills/fgos-workflow/`, kept byte-identical per D4 — `fgos-mirror.test.mjs` is the proof this stayed true |
| Runtime | `src/runner/dispatch.mjs:124` | Update the hardcoded `'fgos'` path segment to `'fgos-workflow'` |
| Tests | `test/runner/dispatch.test.mjs:149`, `test/runner/prompt-templates.test.mjs:119,127` | Update literal-string assertions to the new path |
| Specs | `docs/specs/runner.md` (7 refs, incl. the D4 passage itself), `docs/specs/reading-map.md` (1), `docs/specs/enduser-docs-authoring.md` (2), `docs/backlog.md` (3) | Mechanical path-string update, no meaning change |
| Entry doc | `AGENTS.md:47` ("fgOS Workflow" section) | Update the `fgos-routing` pointer path |
| This item's own history | `docs/history/fgos-skill-discovery-gap/{CONTEXT,plan}.md` | **Left as-is** — they document what was true during investigation; rewriting past-tense findings to match the new name would erase the record of what was actually observed |

`fgos graph --what-if tsk-d3c --json` still reports
`unblocksTransitive: 0` — no ordering constraint from other backlog
work.

**Risk map:**

| Component | How risky | What proves it |
|---|---|---|
| Rename both `.claude/skills/fgos/` and `.agents/skills/fgos/` together | Low to apply, but must land in the same commit — a partial rename fails `fgos-mirror.test.mjs` by construction | `npm test` (specifically `test/skills/fgos-mirror.test.mjs`) green after the rename |
| `dispatch.mjs`'s hardcoded segment | Low — one string literal, one line | `test/runner/dispatch.test.mjs` and `test/runner/prompt-templates.test.mjs` green after the update |
| Spec/doc path strings (13 refs across 4 files) | Low — mechanical, no logic | `grep -rln '\.claude/skills/fgos/\|\.agents/skills/fgos/' --include='*.md' --include='*.mjs' -- . AGENTS.md docs src test` (excluding `.claude/worktrees/` and this item's own history docs) returns zero hits |
| Collision hypothesis itself | Medium — unchanged from the first pass, still the one thing `npm test` cannot prove | A fresh Claude Code session (new `/clear` or new session — the available-skills list is fixed at session start) shows the renamed skills discoverable and `Skill()` resolves them |

## Shape (standard — phased)

1. **Rename, together, one commit.** `git mv .claude/skills/fgos
   .claude/skills/fgos-workflow` and `git mv .agents/skills/fgos
   .agents/skills/fgos-workflow` in the same commit — never split
   across two, or the mirror test fails on the intermediate state.
2. **Update the hardcoded runtime path.** `src/runner/dispatch.mjs:124`'s
   `'fgos'` segment → `'fgos-workflow'`.
3. **Update the 3 test files' literal strings** to match.
4. **Update the 8 skill files' self-references**, `AGENTS.md:47`, and
   the 13 spec/doc references (`runner.md` ×7, `reading-map.md` ×1,
   `enduser-docs-authoring.md` ×2, `backlog.md` ×3) — mechanical
   find/replace of the path string, no prose rewrite beyond that.
5. **Run `npm test`** (full suite — this touches a runtime path and a
   tested mirror invariant, so the narrowest-useful-test bar from
   `development-rules.md` is the whole suite, not just the 3 files
   named above, since other tests may reference the old path
   incidentally).
6. **Commit**, then the open question from the first pass still applies
   unchanged: a **fresh session** (this one's available-skills list is
   fixed at start and will not re-scan) checks whether the renamed
   skills are now discoverable and `Skill()` resolves them. A "no"
   here reverts steps 1-4 (cheap — it's all mechanical) and leaves the
   real cause open, same as the first pass's contract.

No split into child items — every piece above is mechanical
(rename/find-replace) except step 6's observation, which cannot be
subdivided further; a `high-risk` phased plan with proof points per
component would overstate work that has exactly one genuinely unproven
element (the hypothesis itself).

## Verify

`npm test` green (specifically `test/skills/fgos-mirror.test.mjs`,
`test/runner/dispatch.test.mjs`, `test/runner/prompt-templates.test.mjs`),
**and**
`grep -rn '\.claude/skills/fgos/\|\.agents/skills/fgos/' AGENTS.md docs src test`
returns zero hits (excluding this item's own history docs, which
intentionally keep the historical path name), **and** a fresh session's
available-skills list includes the renamed `fgos-workflow` skills where
today the `fgos` ones are silently absent.
