# fgos run: work that gets reviewed before you see it

AI coding agents are quick to say "done". Too often, you're the only one who checks.

`fgos run` takes a unit of work and runs it through a producer and an independent reviewer, in one command:

```bash
fgos run --unit task.yaml --pattern reviewed
```

The producer does the work. A separate reviewer, a different executor from the one that wrote it, checks the result. Findings come back with the outcome, so the author never grades its own homework and you stop being the manual reviewer for every step.

Prefer no review? `--pattern solo` skips it. Add `--json` for scripting.

Try it on one small task today.
