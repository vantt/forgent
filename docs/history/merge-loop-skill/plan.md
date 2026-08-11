# Plan: /fgOS:merge-loop skill

Item: `tsk-1sm`. Decisions locked in `CONTEXT.md` (D1, D2) — cited, not
reopened here.

## Mode

Flags counted against the item:
- public contracts — **yes**: adds a new slash-command surface,
  `/fgOS:merge-loop` (the item's own text flags this as the same kind of
  risk as `tsk-4j9`'s own risk-map: a new public-contract surface needs the
  real clarify/plan lifecycle, not a hand-written skill).
- weak proof around the area — **yes**: this is a thin markdown skill
  wrapper with no new CLI logic of its own to unit-test; `merge-next`'s
  own item verify (`node --test test/state/impact.test.mjs && node
  bin/fgos.mjs graph --check-rank-impact-usage`) tests the underlying
  `mergeReadiness`/graph-harness code, not the wrapper prose — same
  pattern applies here, so proof is structural + manual, not a dedicated
  new test file.
- auth / authorization / data model / audit-security / external systems /
  cross-platform / existing covered behavior / multi-domain — no (no code
  touched, no existing tested path modified, no third-party integration;
  `/loop` and `/fgOS:merge-next` are reused unmodified).

2 flags, no hard-gate flag → **standard**. Matches the item's own `tier:
standard`.

## Approach

**Chosen path:** add one new plugin skill directory,
`plugins/fgOS/skills/merge-loop/SKILL.md`, alongside the existing
`merge-list/` and `merge-next/` (both present on branch `fgw/tsk-4j9`, not
yet on `main` — see Ordering below). The skill's own steps:

1. Soft-warn pre-flight (D1): run `git status --short` (or equivalent),
   and if the tree is not clean, print a reminder that a clean tree is
   expected before merging — then proceed anyway, regardless of the
   result.
2. Invoke the existing, built-in `loop` skill (via `/loop`) with
   `prompt: "/fgOS:merge-next"`, dynamic self-pacing (no fixed short
   interval — each `merge-next` call runs a real `npm test`-class verify,
   so duration varies per item; matches `ScheduleWakeup`'s own guidance to
   pace to what's actually being waited on). **Not** `ck-loop` — that is a
   separate, unrelated skill (mechanical-metric optimization: requires
   `Goal`/`Scope`/`Verify`-single-number/`Guard` config, git-commit-then-
   measure per iteration); confirmed by reading
   `~/.claude/skills/ck-loop/SKILL.md` in full at `fgos-coding-validating` and
   ruled out — there is no metric to optimize here, only a repeat-until-
   stop-condition task, which is exactly what the plain `loop` skill's own
   description covers ("run a prompt on a recurring interval... omit the
   interval to let the model self-pace").
3. Each iteration, read `merge-next`'s JSON `data` envelope (exact shapes
   confirmed against `fgw/tsk-4j9:plugins/fgOS/skills/merge-next/
   SKILL.md`):
   - `{picked: null, reason: "nothing ready to merge"}` → stop the loop
     cleanly (`ScheduleWakeup({stop: true})`), nothing to report.
   - `{picked: <id>, approve: {done}}` → normal, continue.
   - `{picked: <id>, approve: {blocked, reason: ...}}` or
     `{picked: <id>, blocked: "iron-law", ...}` → check whether the *same*
     `<id>` was also the blocked pick on the immediately preceding
     iteration. First occurrence for a given id: continue as normal.
     Second consecutive occurrence for the same id (any of the three
     block reasons): stop the loop, report via plain chat message only
     (D2) — never call `fgos ask`, never auto-run
     `--acknowledge-iron-law`.
4. No new CLI verb in `bin/fgos.mjs` — the skill is pure orchestration
   text, same shape as `merge-list`/`merge-next` themselves.

**Alternatives rejected:**
- Recursing into `ck-loop` instead of the plain `loop` skill — rejected:
  wrong tool. `ck-loop` demands a mechanical metric (`Goal`/`Scope`/
  `Verify`-single-number/`Guard`) to optimize over N iterations with git
  keep/discard; this task has no metric, just a repeat-until-a-named-
  stop-condition shape, which is what the plain `loop` skill is for.
- A bespoke interval/timer loop written inside this skill instead of
  recursing into `/loop` — rejected: violates `tsk-4j9`'s own D6
  ("improve the existing process in place, don't build a parallel path"),
  which this item explicitly inherits.
- A new `fgos merge loop` CLI verb — rejected: item's own scope line 4
  forbids touching `merge-next`/`merge-list`/`approve` mechanics or adding
  new CLI surface; a skill-only wrapper is sufficient since all the real
  mechanics already exist.
- Hard-refuse pre-flight on a dirty tree — rejected per locked D1.
- `fgos ask` park on safety stop — rejected per locked D2.

## Risk map

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| Same-id-blocked-2-consecutive-turns tracking | Medium — this state must persist across `ScheduleWakeup` wake-ups within one `/loop` run without misfiring (false-stop on the first block, or never stopping) | Trace the exact stop-condition prose above against `merge-next`'s three real envelope shapes; confirm the SKILL.md text leaves no ambiguity about "consecutive" (same id, immediately-prior iteration only) |
| Recursing into `/loop`'s dynamic self-pace | Low-medium — wrong pacing guidance could read as a fixed short interval instead of dynamic, or could wrongly target `ck-loop` instead | Confirm SKILL.md's `/loop` invocation instructions match the plain `loop` skill's own self-pace contract (`prompt` + omitted interval), and explicitly does not reference `ck-loop` |
| New public-contract surface (`/fgOS:merge-loop`) | Low — mitigated by going through this exact clarify → plan → validate lifecycle instead of ad hoc | Confirm this plan and `CONTEXT.md` were both approved before any execution |
| Dependency chain unmerged (`worktree-in-out` → `tsk-4j9` → `tsk-1sm`, per `fgos graph --json`'s component listing) | High for *today's* buildability, but structurally gated | `fgos-coding-validating`/executing must confirm `tsk-4j9` has actually merged to `main` (and `merge-next`/`merge-list` exist there) before this item is allowed into `executing` — the frontier already enforces this via `deps`, not a new check this item invents |

## Ordering

`fgos graph --json` places `tsk-1sm` in a 7-item component:
`worktree-in-out → tsk-4j9 (+ its 4 children) → tsk-1sm`. `worktree-in-out`
is `topUnblock`-ranked #1 in the whole graph (`unblocks: 2,
newlyUnblocks: 3`) — it and `tsk-4j9` must land on `main` first; nothing
in this plan can be exercised end-to-end until then. This is already
expressed by the item's `deps: ["tsk-4j9"]` field — no new ordering
mechanism needed.

## Shape

Single piece of work, no split: one new file,
`plugins/fgOS/skills/merge-loop/SKILL.md`, following the exact
frontmatter/Steps structure `pick/SKILL.md` and `merge-next/SKILL.md`
already use. No plugin manifest change needed — `plugins/fgOS/
.claude-plugin/plugin.json` is unchanged by `tsk-4j9`'s own addition of
`merge-list`/`merge-next` (skills are discovered by directory, not
manifest-listed).

Cases worth proving at `fgos-coding-validating`:
- `{picked: null}` on the very first iteration (frontier already empty).
- A single `blocked` result followed by a *different* id picked next
  (must NOT trigger the stop condition — only same-id-twice does).
- The same id blocked twice in a row (must trigger the stop, with only a
  chat message, no `fgos ask`).
- Dirty working tree at loop start (must warn, then still call `/loop`).

## Verify command

```
npm test && node -e "const fs=require('node:fs'); const p='plugins/fgOS/skills/merge-loop/SKILL.md'; const s=fs.readFileSync(p,'utf8'); if(!/^name:\s*merge-loop\s*$/m.test(s)) throw new Error('SKILL.md missing name: merge-loop frontmatter'); console.log('merge-loop SKILL.md present and frontmatter valid');"
```

Real and runnable: full suite as a regression guard (trivially unaffected
since no existing code changes), plus a structural check that the new
skill file exists with correct frontmatter — matches the "weak proof"
flag honestly rather than inventing test coverage that doesn't fit a
markdown-only change.

## Split

None. One item, one file, proceeds as itself.
