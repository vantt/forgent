# RESEARCH — merge-approve-inline-confirm (tsk-ut6)

## Round 1 — 2026-08-20

**Asked:** Is there an established repo pattern for one Claude Skill
directly invoking another Skill (via the Skill tool) within the same
turn/session, so `/fgOS:merge-next`/`/fgOS:merge-loop` could invoke the
`approve` skill directly instead of printing its name for the person to
type as a new command? Any documented convention forbidding or requiring
caution around a launcher-tier skill (`plugins/fgOS/skills/merge-next`,
`merge-loop`) invoking another launcher-tier skill (`approve`) this way?

**Checked (repo):**

- `plugins/fgOS/skills/discover/SKILL.md:1-20` (`rg -n "dispatches it
  through fgos-coding-driving" plugins/fgOS/skills/discover/SKILL.md`) —
  `/fgOS:discover` (a launcher-tier plugin skill) "dispatches it through
  `fgos-coding-driving`" directly: a launcher skill invoking a dev-skill
  via the Skill tool is an established, already-shipped pattern.
- `.agents/skills/fgos-coding-driving/SKILL.md:213-220` and
  `references/loop-mechanics.md:169-171` — "Invoke `skill`" is this
  driver's own Step 5/Step 8: it resolves a stage skill from a registry
  and calls it directly via the Skill tool, no intermediate slash-command
  text for a person to retype. Same pattern, dev-skill invoking dev-skill.
- `.agents/skills/fgos-coding-driving/references/caller-contract.md:32` —
  "Invoke the `fgos-fanout` skill with `parentId` = ..." — another
  dev-skill-invokes-dev-skill precedent.
- `rg -n "Skill tool" .agents/skills/*/SKILL.md plugins/fgOS/skills/*/SKILL.md`
  — only `plugins/fgOS/skills/cook/SKILL.md` names the mechanism
  explicitly by phrase, but the mechanism itself (a skill's prose saying
  "invoke `<skill>`") is used consistently across `fgos-coding-driving`,
  `fgos-routing`, `discover`, `plan`, `cook`.
- No file under `.agents/skills/**` or `plugins/fgOS/skills/**` restricts
  Skill-tool invocation to same-tier calls only, or forbids a launcher
  skill from invoking a peer launcher skill. The launcher/dev-skill split
  is a packaging/user-invocability distinction
  (`test/setup/registrations.test.mjs`'s `pluginDevSkillsPackagedCheck`
  checks dev-skills ship inside plugin packaging, not that they can't be
  called cross-tier) — not an invocation-direction rule.
- `plugins/fgOS/skills/merge-loop/SKILL.md:50` — merge-loop's own existing
  cross-skill call is different in kind: it invokes the generic `loop`
  skill with `prompt: "/fgOS:merge-next"`, i.e. re-issuing the slash
  command as a fresh prompt each iteration, not a direct Skill-tool call
  into `merge-next`'s body. This is the one place in this family where
  "hand a command string to something to re-invoke" is the *existing,
  correct* pattern (for `/loop`'s own re-firing contract) — worth citing
  in planning so tsk-ut6's fix is not confused with breaking that.
- `plugins/fgOS/skills/approve/SKILL.md:27-31` — approve's own contract
  already reads as a callee built for exactly this: "**The person decides,
  this skill operates.** A human answering 'yes' in chat is full approval
  ... Printing a command for the person to paste is a failure of this
  skill, not a handoff." Nothing in approve's own file assumes it is only
  ever entered by a person typing `/fgOS:approve` — it reads its own state
  fresh (`fgos list --id <id> --json`, `fgos merge list --json`) and asks
  from there, which is exactly what a direct Skill-tool invocation with no
  prior turn's context needs.
- `plugins/fgOS/skills/cook/SKILL.md` hard rules — cook explicitly forbids
  itself from ever calling `fgos approve`/`reject`/`review` ("the internal
  PR review gate is a human decision, always"). This is a *different*
  concern (a fully-unattended driver never landing to trunk on its own
  authority) than tsk-ut6's ask, which keeps the human decision (approve's
  own step 5 "ask once") intact — it only removes the extra manual
  slash-command round-trip between merge-next reporting the block and
  approve asking its question. tsk-ut6 does not touch cook's own
  never-call-approve rule.

**Found:** Direct Skill-tool invocation of one skill by another, including
a launcher-tier skill invoking a further skill, is an established,
shipped pattern (`/fgOS:discover` → `fgos-coding-driving` →
`fgos-coding-discovering`/etc.). No repo rule restricts this to same-tier
calls. `approve`'s own SKILL.md is already written to be entered
standalone (reads its own state, presents blast radius, asks once) and
already states its own contract as "a human answering yes in chat is full
approval" — it does not require having been reached via a person typing
`/fgOS:approve` specifically. `merge-loop`'s existing `/loop`-wrapped
re-invocation of `merge-next` is a distinct, unrelated mechanism that
should not be touched by this fix.

**Still open:** None for feasibility. A planning-level detail remains
non-blocking: whether `merge-loop`'s own end-of-run batch (which can hold
several Iron-Law-blocked ids at once, gathered per its Step 5/6
"read together, decide together" design) offers the `approve` invocation
once per id in sequence after presenting the whole list, versus some other
sequencing — this is an implementation-shape choice for
`fgos-coding-planning`, not a discovery-stage ambiguity: either sequencing
preserves the existing "gathered call-back" design and the human-decides
contract, so nothing here blocks moving forward.

## Verdict

`{clear: true, verify: "npm test && grep -q 'approve' plugins/fgOS/skills/merge-next/SKILL.md && grep -q 'approve' plugins/fgOS/skills/merge-loop/SKILL.md"}`
