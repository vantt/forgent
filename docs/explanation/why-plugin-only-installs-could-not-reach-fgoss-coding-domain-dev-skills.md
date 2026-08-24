---
type: explanation
title: Why plugin-only installs could not reach fgOS's coding-domain dev-skills
tags: [distribution, plugin, skills, mirror, packaging]
source_capture_ids: [tsk-32b]
authoritative_for: why a repo that only installs fgOS as a Claude Code plugin got Unknown skill errors, and why the fix is a third enforced mirror rather than a runtime fallback
---
# Why plugin-only installs could not reach fgOS's coding-domain dev-skills

`tsk-32b`. Reproduced live 2026-08-12: a session in a completely
different repo (`mdview`), working `tsk-5yf` via `/fgOS:pick`, invoked
`Skill(fgos-coding-driving)` exactly as `/fgOS:cook`'s own step 2
instructs — and got `Error: Unknown skill: fgos-coding-driving`.

## Root cause: two separate skill families, only one shipped in the plugin

`plugins/fgOS/skills/` — the directory actually distributed with the
installed plugin — only ever packaged the 34 top-level slash-command
wrapper skills (`cook`, `discover`, `plan`, `pick`, `submit`, and the
`merge-*`/`plan-*`/`discover-*`/`retro-*`/`cleanup-*` families). But
those wrappers all dispatch, via the `Skill` tool, into a second family —
the coding-domain dev-skills (`fgos-coding-driving`,
`fgos-coding-exploring`, `fgos-coding-planning`, `fgos-coding-validating`,
`fgos-coding-implement`, `fgos-coding-discovering`, `fgos-coding-shaping`,
`fgos-coding-compounding`, `fgos-routing`, `fgos-clarifying`,
`fgos-researching`, `fgos-fanout`, `fgos-indexing`, `fgos-unlock`) that
exist only under this repo's own `.claude/skills/` (mirrored to
`.agents/skills/`). `plugins/fgOS/.claude-plugin/plugin.json` declares no
`skills` manifest field, so the plugin loader only ever sees its default
`skills/` scan — never this repo's own `.claude/skills/`. A session whose
cwd is a repo that installed fgOS solely as a plugin has no forgentX
checkout anywhere reachable, so those dev-skills simply do not exist for
it at dispatch time.

This is distinct from an earlier, already-closed bug
(`tsk-d3c`, "fgOS skill discovery gap") — that one was the *project*-skill
scanner only enumerating one directory level deep, fixed by flattening
`.claude/skills/fgos-coding-driving/`. That fix explains why the
directory is flat today, but it is a different discovery mechanism from
the *plugin* skill loader this item is about, and does not help a
plugin-only consumer at all.

## Why the tempting runtime fallback was rejected

Three directions were researched. One — a plugin skill catching `Unknown
skill` at runtime and `Read`-ing the target `SKILL.md` directly off a
forgentX checkout — was explicitly rejected. It only works when a
forgentX checkout happens to be reachable from the calling session's own
machine, which is true of this item's own reproduction case (an fgOS
contributor testing against `mdview`) but false for the actual target
audience: a genuine plugin-only consumer, `AGENTS.md`'s mission #1/#2,
who never has a forgentX checkout at all.

## The fix: a third enforced mirror, not a second manually-maintained one

`plugins/fgOS/` gets its own physical copies of the coding-domain
dev-skills. Two decisions kept this from becoming a maintenance trap:

- **`.claude/skills/fgos-coding-*` (mirrored to `.agents/skills/`) stays
  the single edited source of truth.** The plugin copies are an
  additional generated/enforced mirror, never a third independently-edited
  copy — the person's own stated requirement was explicit: "must not
  create a second manually-maintained mirror alongside the existing one."
- **Enforcement reuses the existing precedent rather than inventing a new
  mechanism.** `test/skills/fgos-mirror.test.mjs` already asserts
  `.claude/skills/fgos-*` and `.agents/skills/fgos-*` are byte-identical —
  the same test-based enforcement now also compares
  `plugins/fgOS/skills/fgos-*` against `.claude/skills/fgos-*`, so a real
  `npm test` failure catches drift instead of relying on a documented
  convention nobody re-checks.

A companion doctor check sits beside the existing
`plugin-skill-cli-reachable` check (`src/setup/registrations.mjs:1092`)
and reports whether the coding-domain dev-skills the plugin's own
slash-commands depend on are actually present in the installed plugin's
own directory — it verifies D1(a)'s fix artifact exists; it has no hook
into a live `Skill()` dispatch failure at runtime, so it can only catch
this class of gap before someone hits it, not during. `docs/distribution-
vision.md` and `docs/specs/distribution.md` now state the posture
explicitly: before this fix, `/fgOS:cook`/`/fgOS:discover`/`/fgOS:plan`/
`/fgOS:pick`'s own dev-skill dispatch only worked from a forgentX
checkout; after, a plugin-only install works too.

## Why this belongs to mission #1/#2, not #3

Per `AGENTS.md`'s own mission boundary (D-ADR0035), this is not fgOS
polishing itself for its own contributors — the actual failure mode was a
different repo, `mdview`, running fgOS purely as an installed platform
dependency and hitting a hard dispatch error on its very first `/fgOS:
cook` call. Fixing it is squarely mission #1/#2 (fgOS as the platform
layer another project builds on), the same reason the rejected runtime
fallback — which only helps a contributor working inside forgentX
itself — was the wrong fix even though it would have "worked" for the
literal reproduction session.
