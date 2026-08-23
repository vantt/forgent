# fgos skill discovery gap — plan

## Mode

**Standard.** *Reshaped at `fgos-coding-implement`*: the first pass at this plan
(below, kept for the record) classified this as a `spike` because a
single yes/no question decides whether any fix is real — that framing
still holds for the *hypothesis*, but executing found the actual blast
radius of applying the fix is far wider than "9 markdown files +
`AGENTS.md`" (also corrected at this reshape: the first pass, following
this item's own original acceptance text, undercounted at 8 — the real
directory holds 9, `fgos-unlock` included). Flags against `CONTEXT.md`'s D1 (root-cause before
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
undercounted because `fgos-coding-planning`'s first pass only grepped
`AGENTS.md`/`CLAUDE.md`, never `src/`/`test/`.

## Approach

**Evidence carried forward from the first pass (cites `CONTEXT.md` D1,
not reopened):**

`plugins/fgOS/` and `.claude/skills/fgos/` are the same string once
case-folded (`"fgOS".toLowerCase() === "fgos"`). Neither `gitnexus` nor
`distill` — both discoverable today — has a same-named plugin under
`plugins/` (`dogfood-fixture/`, `fgOS/` are the only two). This is
still the strongest available lead for *why* the 9 `fgos-*` skills are
invisible to `Skill()`, scoped and unscoped alike.

**Rejected alternative (unchanged from the first pass, now reinforced):**
duplicating the 9 skills into `plugins/fgOS/skills/*` was rejected
because it doubles maintenance of routing-critical text and never
tests the collision hypothesis. That reasoning holds even more now that
the rename is known to be bigger — a bigger rename is still evidence,
where a bigger duplication is just more permanent workaround.

**Full scope, found by `grep -rln '\.claude/skills/fgos/\|\.agents/skills/fgos/' --include='*.md' --include='*.mjs' .` scoped to this repo's own tracked tree (excluding other worktrees under `.claude/worktrees/`, which are separate items' own branches, not this one's to touch):**

| Area | Files | Change |
|---|---|---|
| Skill content | `.claude/skills/fgos/<9 names>/SKILL.md` | `git mv` to `.claude/skills/fgos-workflow/<name>/SKILL.md`; update each file's own self-references to sibling `.claude/skills/fgos/...` paths |
| Mirror | `.agents/skills/fgos/<9 names>/SKILL.md` | Same `git mv` to `.agents/skills/fgos-workflow/`, kept byte-identical per D4 — `fgos-mirror.test.mjs` is the proof this stayed true |
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
4. **Update the 9 skill files' self-references**, `AGENTS.md:47`, and
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

## Verify (superseded — see D3 shape below)

`npm test` green (specifically `test/skills/fgos-mirror.test.mjs`,
`test/runner/dispatch.test.mjs`, `test/runner/prompt-templates.test.mjs`),
**and**
`grep -rn '\.claude/skills/fgos/\|\.agents/skills/fgos/' AGENTS.md docs src test`
returns zero hits (excluding this item's own history docs, which
intentionally keep the historical path name), **and** a fresh session's
available-skills list includes the renamed `fgos-workflow` skills where
today the `fgos` ones are silently absent.

## D3 shape — flatten, not rename (supersedes this plan's rename shape)

`CONTEXT.md` D3: a controlled A/B test confirmed the real cause —
the generic `.claude/skills/` scan is flat-only, one level, no
recursion. The rename tested above kept the nesting (`fgos-workflow/<name>/`
is still two levels deep) so it could never have worked; this shape
replaces "rename the parent" with **flatten each skill to its own
top-level directory**, matching `distill`'s proven shape exactly.

**Target layout:** `.claude/skills/fgos/<name>/SKILL.md` →
`.claude/skills/<name>/SKILL.md` for all 9 names (`fgos-routing`,
`fgos-coding-exploring`, `fgos-coding-planning`, `fgos-coding-validating`, `fgos-coding-implement`,
`fgos-coding-compounding`, `fgos-indexing`, `fgos-submit-assist`,
`fgos-unlock`) — no shared parent folder at all. Same flatten for
`.agents/skills/fgos/<name>/` → `.agents/skills/<name>/`.

**Files touched (re-verified against the current, reverted tree — same
count as the rename pass, confirming nothing else changed underneath):**

| Area | Files | Change |
|---|---|---|
| Skill content | `.claude/skills/fgos/<name>/SKILL.md` (9) | `git mv` each to `.claude/skills/<name>/SKILL.md` — 9 separate moves, no parent dir survives |
| Mirror | `.agents/skills/fgos/<name>/SKILL.md` (9) | Same flatten to `.agents/skills/<name>/SKILL.md` |
| Runtime | `src/runner/dispatch.mjs:124` | `` `.claude/skills/fgos/${skillName}/SKILL.md` `` → `` `.claude/skills/${skillName}/SKILL.md` `` (`skillName` already resolves to e.g. `fgos-coding-implement`, confirmed by `skillForStage`'s own test) |
| Tests (string) | `test/runner/dispatch.test.mjs:149`, `test/runner/prompt-templates.test.mjs:119,127` | Literal path strings updated to the flat form |
| **Test (structural — new, not just a string swap)** | `test/skills/fgos-mirror.test.mjs` | `CLAUDE_SKILLS_DIR`/`AGENTS_SKILLS_DIR` currently point at one parent (`.claude/skills/fgos`) and recursively diff its contents. After flattening there is no single parent — the test must instead: (a) list top-level dirs under `.claude/skills/` matching `fgos-*`, (b) do the same under `.agents/skills/`, (c) assert the two name-sets are equal, then (d) byte-compare each matched pair's files, same as today just per-skill instead of per-parent |
| Specs | `docs/specs/runner.md` (7), `docs/specs/reading-map.md` (1), `docs/specs/enduser-docs-authoring.md` (2), `docs/backlog.md` (3) | Path-string update: `.claude/skills/fgos/<name>/` → `.claude/skills/<name>/` |
| Entry doc | `AGENTS.md:47` | Same flat-path update |
| `.gitignore` | lines allowlisting `!/.claude/skills/fgos/` and `!/.agents/skills/fgos/` | Replace each with a single-segment glob, `!/.claude/skills/fgos-*/` and `!/.agents/skills/fgos-*/` — covers all 9 flattened dirs (and any future `fgos-*` skill) without 9 separate lines |
| This item's own history | `docs/history/fgos-skill-discovery-gap/{CONTEXT,plan}.md` | Left as-is, same reasoning as before |

**Risk map:**

| Component | Risk | Proof |
|---|---|---|
| 18 individual `git mv` operations (9 + 9 mirror) landing in one commit | Low, purely mechanical, but easy to miss one — `fgos-mirror.test.mjs` (once itself updated) catches any name-set mismatch | `npm test` green |
| `fgos-mirror.test.mjs`'s own restructuring | Low-medium — this is real logic change, not a string replace; must not silently pass by comparing empty sets | New test still asserts `claudeFiles.length > 0` per matched skill dir (already in the current test, kept) |
| `dispatch.mjs` + 2 test files | Low, one string each | `test/runner/dispatch.test.mjs`, `test/runner/prompt-templates.test.mjs` green |
| `.gitignore` glob correctness | Low — single-segment `*` glob is standard, already proven pattern-wise by the existing `!/.claude/skills/distill/`-style exact-match entries | `git status` shows the 9 new flat dirs as tracked (not falling back to "ignored" warnings) after `git add` |
| The hypothesis itself | **None remaining** — already confirmed by the A/B test (D3), not still open the way D2's was | N/A — this is no longer an unproven assumption |

**Shape (standard, phased):**

1. Flatten both trees, 18 `git mv` calls (9 skill + 9 mirror), one commit boundary only after everything below also lands (avoid an intermediate half-flattened commit).
2. Update `dispatch.mjs`'s hardcoded segment.
3. Update the 2 literal-string test files.
4. **Rewrite `fgos-mirror.test.mjs`'s directory-comparison logic** (structural, per the table above) — this is the one piece that is not a pure find/replace.
5. Update `AGENTS.md`, the 13 spec/doc references, and `.gitignore`'s two allowlist lines (switch to the glob form).
6. `npm test` full suite green.
7. Commit, `fgos edit --verify` stays `npm test` (already correct, no change needed), `fgos return`.
8. No further fresh-session check needed for the hypothesis itself (already confirmed by the A/B probe) — but a fresh session naturally re-validates end-to-end once this lands, since that's exactly how the original bug was noticed in the first place.

No child-item split — same reasoning as the rename pass: everything is mechanical except item 4, which is a small, self-contained test rewrite, not an open-ended design question.

## Verify (D3 shape, current)

`npm test` green (all suites, specifically the rewritten
`test/skills/fgos-mirror.test.mjs`, `test/runner/dispatch.test.mjs`,
`test/runner/prompt-templates.test.mjs`), **and**
`grep -rn '\.claude/skills/fgos/\|\.agents/skills/fgos/' AGENTS.md docs src test .gitignore`
returns zero hits (excluding this item's own history docs), **and**
`git status` shows all 9+9 flattened files as tracked, not ignored.
