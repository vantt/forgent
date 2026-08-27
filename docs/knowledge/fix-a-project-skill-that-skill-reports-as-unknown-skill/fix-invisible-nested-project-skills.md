---
framework: diataxis
mode: how-to
---
# Fix a project skill that `Skill()` reports as "Unknown skill"

Use this when a skill file genuinely exists on disk under
`.claude/skills/`, but `Skill({skill: "<name>"})` fails with
`Unknown skill: <name>` and the skill never appears in a session's
available-skills list — even though there's no typo in the name.

## Check the actual cause first

Don't assume a naming, plugin-registration, or case-collision problem
without checking. From `tsk-d3c` (fgOS work item, `docs/history/fgos-skill-discovery-gap/CONTEXT.md`):

> a plausible mechanism is that the harness's skill-discovery scan
> treats a `.claude/skills/<name>/` subtree as already claimed once a
> plugin named `<name>` (case-insensitively) is enabled

That hypothesis was tested by actually renaming the affected directory
and confirming in a fresh session — and it turned out wrong. The rename
alone did not restore discovery. Don't stop at a plausible-sounding
theory; test it before committing to a fix.

## Confirm the depth-limit cause with a real A/B test

The actual, confirmed cause (`CONTEXT.md` D3):

> the generic `.claude/skills/` project-skill scan enumerates exactly
> one level deep (`.claude/skills/<name>/SKILL.md`) — it does not
> recurse into subdirectories

To confirm this for your own case, drop two disposable probe files and
check both in **one fresh session** (not a continuation — an
already-running session's available-skills list is fixed at start and
will not re-scan mid-session):

```
.claude/skills/zzz-flat-test/SKILL.md          # flat, one level
.claude/skills/zzz-nest-test/inner/SKILL.md    # nested, two levels
```

Give each a minimal frontmatter (`name`, `description`), then in the
fresh session call `Skill({skill: "zzz-flat-test"})` and
`Skill({skill: "zzz-nest-test"})`. If the flat one loads and the nested
one reports "Unknown skill" — with the file's real presence double
checked via `pwd` + `cat` first, to rule out a wrong-directory or
stale-cache false negative — nesting depth is confirmed as the cause.
Delete both probe files once done; they're not meant to persist.

## Fix: flatten, don't just rename

Renaming the nested parent directory does not fix discovery — the
skill is still nested underneath it. The fix is to flatten each skill
to live directly under its own top-level directory:

```
.claude/skills/<parent>/<skill-name>/SKILL.md   # before: invisible
.claude/skills/<skill-name>/SKILL.md            # after: discoverable
```

If a `.agents/skills/` mirror exists (kept byte-identical to
`.claude/skills/` for non-Claude-Code agent runners), flatten it the
same way, in the same commit — a partial flatten that touches one side
without the other will fail any test asserting the two trees match.

Also check for and update:
- Any hardcoded path segment in source that builds a skill path string
  (e.g. `` `.claude/skills/<parent>/${skillName}/SKILL.md` `` →
  `` `.claude/skills/${skillName}/SKILL.md` ``).
- Tests asserting the literal path string.
- A `.gitignore` allowlist entry for the old nested path — replace an
  exact-name entry (`!/.claude/skills/<parent>/`) with a glob covering
  every flattened skill name if they share a naming prefix (e.g.
  `!/.claude/skills/<prefix>-*/`), rather than one entry per skill.
- Any test that diffs one shared parent directory between two mirrored
  roots — after flattening there's no single parent left to diff; the
  test needs to match by directory *name* across both roots instead
  (list entries matching the shared prefix under each root, assert the
  name sets are equal, then byte-compare each matched pair).

## Confirm the fix

Same as the A/B probe: open a genuinely fresh session in the same
worktree (not a continuation of the session that made the change) and
call `Skill({skill: "<flattened-skill-name>"})` directly. A successful
load — not just "the file exists on disk" — is the only real proof;
`npm test` passing tells you the mechanical rename didn't break
anything, not that discovery itself is fixed.
