# Research — tsk-4sx

## Round 1 — 2026-08-16

**Asked:** Is there existing precedent for auto-registering `docsRef` back
onto the current item after a stage-skill creates a fresh
`docs/history/<feature>/` directory, versus forcing `<feature>` to always
equal the item id when `docsRef` is empty? Is one option clearly better on
evidence, or is this a real design decision needing a person?

**Checked:**
- `.agents/skills/fgos-coding-exploring/SKILL.md` (repo search, `rg
  docs-ref`/`docsRef`) — every mention read directly, `file:line`:
  - `:145` — only *reads* an existing `docsRef` if the item already has one.
  - `:346-364` — the only place this skill ever writes `--docs-ref` is
    when creating a NEW CHILD item via `fgos add`, passing the PARENT's
    already-known feature dir down to the child. It never calls `fgos
    edit --docs-ref` to register the CURRENT item's own `docsRef`.
  - `:307-311` (the "Write the decision doc" step) — instructs writing
    `docs/history/<feature>/CONTEXT.md` with no naming rule for
    `<feature>` at all; it is left to the session's own judgment (a
    descriptive feature-slug), same free-naming pattern this item's own
    symptom hit in `fgos-coding-planning`.
  - **Conclusion: `fgos-coding-exploring` has the exact same gap tsk-61j
    already named** — it never registers the current item's own
    `docsRef` either, confirming tsk-61j's root-cause claim is broader
    than just this item's own `fgos-coding-planning` branch.
- `rg -rn "edit.*--docs-ref|docs-ref.*edit" .agents/skills/` — **zero
  hits** anywhere in the skill tree. No skill, anywhere in the system,
  currently calls `fgos edit --docs-ref` to register the CURRENT item's
  own feature dir back onto itself. There is no established precedent
  for that call existing yet at all — tsk-61j's own proposal would be the
  FIRST instance of it, not a pattern to copy from an existing working
  example.
- `bin/fgos.mjs:1623` — `fgos edit --docs-ref` itself exists and is wired
  (`patch.docsRef = optionalField(flags['docs-ref'], ...)`), confirmed in
  the original bug report for tsk-bc7/tsk-4sx.
- tsk-61j (`fgos list --id tsk-61j --json`) — status `todo`, stage
  `discovery`. **Not implemented yet** — its own proposed fix
  ("fgos-exploring sau khi ghi CONTEXT.md phải gọi `fgos edit <id>
  --docs-ref docs/history/<feature>/`") is still just a proposal in that
  item's own description, not code on `main`.

**Found:**
1. Free-naming of `<feature>` (a descriptive slug, not forced to equal the
   item id) is the ESTABLISHED norm across every stage-skill that creates
   a `docs/history/<feature>/` directory — not a one-off choice unique to
   `fgos-coding-planning`'s clear-discovery branch. Forcing `<feature> ==
   id` (option (a) in the original bug report) would be a NEW, narrower
   constraint that breaks with this established convention everywhere
   else in the system, losing the descriptive naming every other feature
   dir in `docs/history/` already uses (confirmed by the dozens of
   non-id-named `docs/history/*` directories visible in this repo's own
   `git diff --stat` output from the tsk-bc7 session, e.g.
   `docs/history/iron-law-gate-human-ux/`, `docs/history/execution-fanout/`).
2. Option (b) — auto-calling `fgos edit <id> --docs-ref
   docs/history/<feature>/` right after creating a new feature dir, when
   `item.docsRef` is still empty — has NO working precedent yet, but IS
   already the exact direction tsk-61j independently proposed for the
   sibling skill (`fgos-coding-exploring`). Adopting the same shape for
   `fgos-coding-planning` keeps both fixes consistent with each other
   (same call, same trigger condition — `docsRef` empty after creating a
   new feature dir) rather than solving the same problem two different
   ways in two different skills.

**Still open:** none for the purpose of this item's own scope decision.
Whether tsk-61j and this item's eventual fixes should share a common
helper/fragment (like `_shared/capacity-dispatch-fallback.md`) instead of
each skill inlining the same `fgos edit --docs-ref` call separately is a
legitimate follow-up question, but not one that blocks scoping THIS
item's own fix — noted as an Outstanding question for planning to weigh,
not a gap that needs a person before discovery can close.
