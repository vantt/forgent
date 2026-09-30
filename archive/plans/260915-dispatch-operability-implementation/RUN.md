# Run Prompt

Use this prompt from `/home/vantt/projects/dispatch-operability-implementation`:

```text
Run the `dispatch-operability-implementation` track with fgos-plan-loop until
the next required stop. Read
`plans/260915-dispatch-operability-implementation/plan.md`, open the next
planned cell in order, use a private cell worktree branch, preserve all global
invariants, and do not close any capability without its production-door proof.
```

If resuming cold, first run:

```sh
fgos coordination chain dispatch-operability-implementation --json
```

Then follow `plan.md` and the matching phase file for the next unmerged cell.
