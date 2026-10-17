# task-spec: fgos-lock-fence

domain: core | role: recovery | trigger: exit-7-lock-error | requires-skill: fgos-lock-fence

## Input
- CLI failure from `fgos take`, `fgos pick`, `fgos approve` or `fgos sync-root`: exit code 7, category `lock-timeout`, message `<lock> is held by another process (pid N)`.
- The lock name from the message, plus any path parameter it needs (`merge-slot` takes `--param ref=<target>`).

## Output
- A decision, from `fgos lock-status` and a look at the holder process, whether the holder is working or wedged.
- For a wedged holder: execution of `fgos lock fence <name> [--param k=v] --yes`, ending in `{ status: "free" | "fenced" }` and a retry of the original command.
- Or the refusal reported to the caller (`lock-fence-self`, `lock-fence-unlistable`, `lock-fence-still-held`).

## Gates
- Soft: never delete or edit `.fgos/locks/*.lock`, never `kill` a holder by hand; only `fgos lock fence` stops a holder.
- Hard: never pass `--yes` for a holder that is a live `approve`/`claim` doing real work; wait instead (the verbs already wait up to a minute by default).
- Hard: `lock-fence-still-held` is handed to a human, not retried.

## Verify-template
- N/A — CLI lock recovery procedure, produces no code artifact.

## Collaboration

| Trigger | Call | To | Reason | Bóng về mang |
|---|---|---|---|---|
| Holder survives SIGKILL or cannot be listed | escalate (async) | human | lock-blocked | manual intervention / holder stop |
| Lock free after fence | retry-claim (sync) | runner | claim-retry | claim result on target item |
| No trigger matches | — run fgos lock-status and report — | | | |
