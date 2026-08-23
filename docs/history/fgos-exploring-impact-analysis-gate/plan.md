# fgos-coding-exploring-impact-analysis-gate — plan

Item: `tsk-17w`. Decisions: `CONTEXT.md` D1-D3 (this directory).

## Mode

**tiny.** Flag count against the mode-gate checklist: 0 of auth,
authorization, data model, audit/security, external systems, public
contracts, cross-platform, existing covered behavior, weak proof, or
multi-domain apply. This is a one-file, one-section markdown edit inside a
Claude Code skill's own instruction prose — no runtime code, no CLI
surface, no schema, no test suite covers `SKILL.md` prose today (scouted:
no hit for `fgos-coding-exploring` content assertions in `test/`, only its FSM
routing entry in `test/state/workflow-stage-graphs.test.mjs` and
`test/cli/fgos.test.mjs`, neither of which reads `SKILL.md` text). A direct
note is the honest size — a phased plan would invent structure this item
doesn't need.

Not on `fgos graph --json`'s `criticalPath` or `topUnblock` (tsk-17w has no
deps and blocks nothing) — no ordering decision to make; it is a single
piece done in one pass.

## Approach

Edit `.claude/skills/fgos-coding-exploring/SKILL.md` step 1 ("Scope the gray
areas") only. Directly after the existing `rg` keyword-scout code block
(current line ~72, ending `| head -20`) and before the "Cite what the scout
actually found..." paragraph, insert a new paragraph + code block that:

1. Resolves `root` the same way this skill's own Hard Rules section already
   does (`git rev-parse --path-format=absolute --git-common-dir | xargs
   dirname`) — reuse, don't reintroduce a second resolution.
2. Runs `node "$root/bin/fgos.mjs" tool query --capability impact-analysis
   --status present --dir "$root"` (per CONTEXT.md D2: `--dir` is
   mandatory — `tool query` is `requiresExistingStore: true`
   (`src/cli/command-registry.mjs:750`), and the bare form was proven to
   fail exit 4 from inside this exact worktree).
3. States the posture recording rule per CONTEXT.md D3: fold the query
   result into `CLAUDE.md`'s three-way framing
   (`impact-analysis: inactive|degraded|full`) and write that line into the
   feature's `CONTEXT.md` in step 3, alongside the other scout evidence —
   informational only, never gating which candidate decisions get asked
   (this skill has no proof points and edits no code).

Also update this skill's own Hard Rules bullet (today: "Every bare `fgos
<verb>` this skill calls (`add`, `ask`, `answer`, `decision`, `discover`)
is `requiresExistingStore: true`...") to add `tool` to that enumerated
list, so the rule's own text stays accurate once the new call exists.

Risk map:

| Component | Risk | What would prove it |
|---|---|---|
| `.claude/skills/fgos-coding-exploring/SKILL.md` edit | low — prose-only, no code path, no schema | grep-based verify below; a human/agent read-through of the edited section for the three required elements |

No medium/high risk entry — no proof point carried to `fgos-coding-validating`
beyond the verify command itself.

**Impact-analysis capability gate** (checked per this skill's step 3, `fgos
tool query --capability impact-analysis --status present --dir "$root"`):
`impact-analysis: full` (gitnexus present) — recorded for completeness;
not load-bearing here since this plan edits no symbol GitNexus's blast-radius
analysis would apply to (a `.md` file, not indexed code).

## Shape (direct note — tiny mode)

Single task, no split:

- **Task**: extend `.claude/skills/fgos-coding-exploring/SKILL.md` step 1 with the
  impact-analysis capability query + posture-recording sub-step described
  above, and add `tool` to the Hard Rules bare-verb list.
- **Verify**: `rg -n "tool query --capability impact-analysis" .claude/skills/fgos-coding-exploring/SKILL.md`
  matches (the new query call exists), and
  `rg -n "add, ask, answer, decision, discover, tool" .claude/skills/fgos-coding-exploring/SKILL.md`
  matches (the Hard Rules list was updated) — both real, runnable commands,
  not placeholders.

## Execution note

Per the locked decision that Execute and its verify already have a working
mechanical path, this plan does not redesign that — it names the one task
and its one verify command above; `fgos-coding-implement` runs it.
