# Planner brief (template)

The supervisor fills the `<...>` fields and sends this as the whole prompt of one planner run
(a short subagent, or `fgos run "<brief>" --pattern solo --writes <plan dir> --worktree <wt>`).
Nothing else from the conversation is passed.

---

You plan one item. You write only inside the plan directory named below; you change no source, test or doc.

- **Item:** `<backlog id or one-line title>`
- **Source:** `<path to DISCUSSION.md in the worktree>` (read its design and task sections; they are your input)
- **Worktree and branch:** `<linked worktree path>`, `<branch>`, from `<full base sha>`
- **Plan directory:** `<output of fgos convention path --kind plan --slug <slug>>`
- **Planning skill:** `<ak-plan by default; any installed planning skill is allowed>`
- **Scope flags:** `<--yagni if the owner passed it, else none>`

## Contract

Before running the planning skill, read `core/skills/_shared/plan-contract.md`. The skill's output must satisfy it:
frontmatter keys (including `contract: plan-v1`, `footprint`, `base` = the full base sha above, `source`), the
required body sections, owner questions in the five-part form, and a phase table with id, title, depends-on,
footprint, wave and status. Organize the phases so that every phase whose dependencies are met can run in
parallel: disjoint footprints per wave, one writer per hot file, an integration phase last, each phase small
enough for one short leader and written so a fresh leader can run it cold.

## Done

1. Run `node scripts/plan-contract-check.mjs --plan <plan directory>`; fix every error it reports.
2. Set `status: ready` as the last edit, only when the check printed `ok`. If an owner question blocks part of
   the plan, leave the plan `draft` and mark the unblocked phases `ready` in the table.
3. Commit the plan dir on the branch above with a conventional message; push the branch; never push to main.

End your reply with:

```text
Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
Summary: one or two sentences, plus the branch and commit
Concerns/Blockers: optional
```
