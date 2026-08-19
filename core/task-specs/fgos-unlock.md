# task-spec: fgos-unlock

domain: core | role: recovery | trigger: exit-7-lock-error | requires-skill: fgos-unlock

## Input
- CLI claim failure from `fgos take` or `fgos pick`: exit code 7, category `lock-timeout` (`ClaimError('lock-held')` or `ClaimError('lock-ambiguous')`).
- Resolved main checkout root directory (`root=$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)`).

## Output
- Execution of `fgos unlock --dir "$root"`.
- Cleared lock state (`{ cleared: true, reason: "stale-or-free" | "reclaimed" }`) enabling retry of original claim command.
- Or refusal report when lock is genuinely held by a live session.

## Gates
- Soft: Never hand-delete (`rm`) `.fgos/main-checkout.lock` — always use `fgos unlock`.
- Hard: Refusal when lock is held by a live session (`cleared: false`) — do not retry in tight loop, wait for session to finish or escalate to human after TTL.

## Verify-template
- N/A — CLI lock recovery procedure, produces no code artifact.

## Collaboration

| Trigger | Call | To | Reason | Bóng về mang |
|---|---|---|---|---|
| Main checkout lock held by live session past TTL | escalate (async) | human | lock-blocked | manual intervention / session cleanup |
| Lock successfully cleared | retry-claim (sync) | runner | claim-retry | claim result on target item |
| No trigger matches | — execute fgos unlock and report — | | | |
