Mode: tiny

Lane decided via direct-entry fallback (no prior Orient handoff): flag
count 0 (no auth, data-loss, audit/security, external-provider, or
removing-a-validation hard-gate flag — this change ADDS reliability to
evidence collection, removes nothing) against `fgos-routing`'s Mode-gate
table → tiny/small; tiny fits since this is one direct edit to one file,
no gray areas.

## Approach

Locked by `docs/history/tsk-2l0-iron-law-check-commit-ordering/CONTEXT.md`
D1 (cited, not reopened): edit `.claude/skills/fgos-coding-implement/SKILL.md`
step 4 so its own text explicitly instructs committing the implementation
(and passing tests) BEFORE running the `classifyIronLaw` check, and update
its example bash snippet's surrounding prose to say so. No code change
(D1/D2/D3 already rule that out — `changedFiles`'s committed-ref diff is
correct and must stay that way; `approve`/`sync-root`'s gate logic is
locked by `tsk-5t3` D4 and stays untouched).

File touched: `.claude/skills/fgos-coding-implement/SKILL.md` only.

`impact-analysis: degraded` (index stale, `251d0b5`) — not load-bearing
here: a prose-only skill-file edit changes no symbol GitNexus tracks, so
blast-radius evidence isn't applicable to this change regardless of index
freshness.

## Shape

Single file, one step's prose. No split — one honest piece of work.

Concrete case to prove against: after the edit, step 4's own text names a
commit step textually BEFORE its `classifyIronLaw` invocation (the ordering
this item exists to fix) — checked mechanically by the item's own verify
command below, not just by a human re-reading the prose.

Proof command for the item:

```
awk '/git add/{c=NR} /git commit/{c=NR} /classifyIronLaw/{i=NR; if (c && c<i) print "ok"; exit}' .claude/skills/fgos-coding-implement/SKILL.md | grep -q ok
```

(same command already recorded via `gate-approve`/`discover` on this item).

## Assumptions

None outstanding — `CONTEXT.md`'s D1-D4 cover every decision this plan
depends on; no mid-planning gap was found.
