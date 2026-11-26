---
phase: 2
title: Integration and full gates
status: draft
capability: code:test
---

# Phase 2: Integration and full gates

Re-run the full gate on main after phase 1 lands and record the result.

## Inputs

- `plan.md` acceptance criteria 1-6.
- The landed phase-1 commit on main.

## Files it may write

`plans/261126-1851-ace-when-keys-v2/reports/**` only.

## Steps

1. On a tree at main with phase 1 landed, run the commands under Verify.
2. Check `plans/261122-1946-agent-start-context/plan.md` lists `261126-1851-ace-when-keys-v2` in `blockedBy`.
3. Write `reports/integration.md`: each command, its exit code, and the tail of any failure.

## Verify

```bash
cargo test --workspace
npm test
fgos authority render --check
rg -n 'when-keys\.v1' packages docs core apps src   # no output
node scripts/plan-contract-check.mjs --plan plans/261126-1851-ace-when-keys-v2
```

Pass: every command exits 0 and the `rg` prints nothing. A failure goes back to phase 1 as a fix on its branch; this
phase never edits code.

## Rollback

Nothing to undo; it writes only its report.
