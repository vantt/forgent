# RESEARCH — tsk-nwz

Accumulating record. Each round appends its own dated section; nothing here
is ever overwritten by a later round.

## Round 1 — 2026-08-13

### Asked

1. Does this repo already have an established PROSE convention, inside a
   launcher/agent skill, for telling an agent that a null/absent value in a
   `--json` field means "unarmed / no ceiling / behave exactly as before"?
   Match an existing wording pattern, or invent one?
2. What is the correct `verify` for a change that only edits
   `.claude/skills/fgos-fanout/SKILL.md`, its `.agents/` mirror, and two
   files under `docs/`? Does `test/skills/fgos-mirror.test.mjs` cover
   `fgos-fanout` today, and is there a narrower invocation than `npm test`?

### Checked

Repo-first, per this skill's mechanical routing rule. Neither goal named
anything absent from the repo, so no external lookup fired.

- `rg -n "unarmed|no ceiling|is null|== null|means no |not configured|absent" .claude/skills plugins/fgOS/skills`
- `ls .agents/skills/fgos-fanout/`, `diff -q` against the `.claude/` copy
- `package.json` `scripts.test`

### Found

**Goal 1 — the convention exists, and it covers this exact failure class.**

`plugins/fgOS/skills/list/SKILL.md:87-89` and
`plugins/fgOS/skills/triage/SKILL.md:107-108` both carry the same sentence,
verbatim, about a different optional field:

> An item with no explicit priority renders its cell as `-`, not blank,
> `0`, or "undefined" — **never confuse absent with priority 0.**

That is the same defect shape this item is about: an optional JSON field
that is absent/null, read by an agent as the number zero. The established
pattern has three parts, all placed at the point the field is read:

1. state that the field is optional and what absent MEANS,
2. state the correct behavior for the absent case explicitly,
3. close with a named anti-pattern sentence — "never confuse absent with
   `<the wrong reading>`".

A weaker second precedent: `.claude/skills/fgos-routing/SKILL.md:179`
("registry's own default when absent") states the absent-case behavior but
carries no anti-pattern sentence.

Finding: match the `list`/`triage` three-part pattern. Do not invent new
wording, and do not settle for the weaker `fgos-routing` shape — the
anti-pattern sentence is the half that actually prevents the misread, and
this item exists because that half was missing.

**Goal 2 — the mirror is covered and currently clean; `npm test` is the
standing answer.**

- `.agents/skills/fgos-fanout/SKILL.md` exists (12.5K) and `diff -q`
  against `.claude/skills/fgos-fanout/SKILL.md` reports no difference — the
  two are byte-identical as of this round, so the mirror test passes today
  and any edit must land on both copies in the same change.
- `test/skills/fgos-mirror.test.mjs` selects by directory name prefix
  (`entry.name.startsWith('fgos-')` against both roots), so `fgos-fanout`
  is covered automatically — there is no per-skill allowlist to add to.
- `package.json:24` — `"test": "node --test 'test/**/*.test.mjs'"`. The
  repo declares no narrower skill-only script. The narrowest useful
  invocation for the red/green proof is
  `node --test test/skills/fgos-mirror.test.mjs`; `npm test` is the
  standing full-suite answer and is what belongs on the item's `verify`,
  since AGENTS.md L5 question 5 names `npm test` as the proof of done.

### Still open

Nothing for either goal.

### Verdict returned to caller

`{clear: true, verify: "npm test"}`
