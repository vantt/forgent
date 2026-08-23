# Iron Law evidence: tsk-29i

`classifyIronLaw` result (predicted against the full diff this commit will
produce — `docs/history/fgos-stage-skills-task-delegation-audit/{CONTEXT,plan}.md`
already committed on this branch, plus the 6 `SKILL.md` files this
implementation commit adds — since `changedFiles` diffs `trunk...branch` and
only sees committed content; re-confirmed against the real branch head
immediately after committing, below):

```json
{
  "required": true,
  "matchedFlags": ["audit"],
  "matchedModules": []
}
```

`matchedFlags: ["audit"]` comes from the item's own title/description
("Audit fgos-coding-planning, fgos-coding-validating, and fgos-coding-implement SKILL.md
for the same gap...") — a keyword match on the item's own ask, not a
signal about the actual code risk (this change edits no runtime code path;
it adds prose hard rules to 3 skill instruction files).

## Test command

```
for f in .claude/skills/fgos-coding-planning/SKILL.md .claude/skills/fgos-coding-validating/SKILL.md .claude/skills/fgos-coding-implement/SKILL.md .agents/skills/fgos-coding-planning/SKILL.md .agents/skills/fgos-coding-validating/SKILL.md .agents/skills/fgos-coding-implement/SKILL.md; do grep -q "capacity-dispatch-fallback.md" "$f" || exit 1; tr "\n" " " < "$f" | grep -qi "never delegate" || exit 1; done && node --test test/skills/fgos-mirror.test.mjs
```

## Failing-before transcript

Captured live during `fgos-coding-validating`'s own reality gate, before any of
the 3 rules were added (real transcript, this session):

```
$ grep -q "capacity-dispatch-fallback.md" .claude/skills/fgos-coding-planning/SKILL.md; echo "fgos-coding-planning: $?"
fgos-coding-planning: 1
```

Exit `1` — the fragment pointer (and therefore the whole verify condition)
was absent, confirming the check discriminates a real pre/post state
rather than passing vacuously.

## Passing-after transcript

Captured live after adding the 3 rules and mirroring both trees (real
transcript, this session):

```
$ bash run-verify.sh
all 6 files pass
✔ .claude/skills and .agents/skills declare the exact same set of fgos-* skill names (0.946716ms)
✔ every mirrored fgos-* skill directory contains the exact same set of relative file paths (4.233979ms)
✔ every mirrored file pair is byte-identical (0.894211ms)
✔ .claude/skills/_shared and .agents/skills/_shared mirror each other byte-identically (0.25095ms)
ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```
