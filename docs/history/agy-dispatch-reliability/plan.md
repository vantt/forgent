# plan.md — tsk-1up: agy dispatch reliability (print-timeout root cause)

Mode: tiny (0-1 flags: no auth, no authorization, no data model, no
audit/security, no removed validation, no cross-platform, no multi-domain;
single existing external executor's own config value — the only arguable
flag is "weak proof around the area", since agy's real response-time
distribution under heavy prompts is unmeasured, but that stays an
acknowledged, explicitly-scoped-out risk below rather than a reason to
widen the lane).

## Root cause (RESEARCH.md round 1)

`agy` print-mode (`-p`) has its own internal response-wait timeout,
`--print-timeout`, defaulting to **5 minutes** — independent of, and much
shorter than, the runner's outer `cfg.timeoutMs` (900000ms = 15 minutes,
`.fgos/config.json` `runner.timeoutMs`). `.fgos/config.json`
`runner.executors.agy.invocations[0].args` never sets `--print-timeout`,
so every real dispatch runs at agy's 5-minute default. Live-repro'd:
setting `--print-timeout 2s` against an 8-second task reproduces the exact
observed stderr (`"Error: timeout waiting for response"`, exit 1) from the
real tsk-539 incident, byte-for-byte, in ~2 seconds — the outer 900000ms
timer is structurally ruled out (its own rejection message is a different
string shape, `dispatch.mjs:1568-1573`, and it kills via SIGTERM rather
than letting the child exit(1) on its own).

This is orthogonal to tsk-it0's cwd bug (`--new-project`, already fixed,
delivered) — a second, independent reliability gap in the same `agy`
capacity.

## Approach

Add `"--print-timeout", "10m"` to
`runner.executors.agy.invocations[0].args` in `.fgos/config.json` — same
one-line config-data shape as tsk-it0's own fix, applied to the same
invocation array. `10m` (600s) is chosen deliberately below the outer
`cfg.timeoutMs` (900s/15m): the outer spawn timeout stays the ultimate
backstop (kills a genuinely hung process), while agy's own internal wait
gets 2x its previous silent default — enough headroom for a real
coding-implement prompt's response time without waiting the full outer
budget on every failure.

**Alternatives rejected:**
- Raising `cfg.timeoutMs` alone, leaving `--print-timeout` unset — would
  not help: agy's own 5-minute internal cap fires first regardless of the
  outer setting (confirmed structurally in RESEARCH.md, not a guess).
- Dropping `agy` as the default `fgos-coding-implement` capacity entirely —
  premature on one recorded incident; the cwd bug (the other half of
  agy's observed unreliability) is already fixed separately, and this item
  addresses the second, independent cause directly rather than discarding
  the capacity.
- Adding retry-once/circuit-breaker logic on top — no evidence yet that a
  transient retry would help versus a genuinely slow single response
  (which a retry would just re-trigger); YAGNI until real frequency data
  exists past this one incident (explicitly named as out-of-scope in
  RESEARCH.md's "not yet checked" list).

**Risk map:**
| Component | How risky | What proves it |
|---|---|---|
| `.fgos/config.json` agy args | Light — same shape as tsk-it0's own already-merged one-line fix | Verify command below: config carries the new flag, and a live short-response call using the exact configured args succeeds without tripping the timeout |
| Real-world response time still exceeding 10m for some prompts | Unmeasured (only one incident on record) — acknowledged, not solved here | Out of scope for this item; a future incident past this fix is new evidence for a follow-up, not a silent gap |

Impact-analysis capability gate (CLAUDE.md): `fgos tool query --capability
impact-analysis --status present` → GitNexus present → posture `full`. Not
applicable regardless — this edits one JSON config array element, touches
no function/class/method symbol GitNexus indexes, so there is nothing for
`impact({target:...})` to run against (same conclusion tsk-it0's own
plan.md reached for the identical shape of change).

## Files touched

- `.fgos/config.json` — `runner.executors.agy.invocations[0].args`: append
  `"--print-timeout"`, `"10m"`.

## No split

Single piece — one config-array edit plus its own live-repro verify, same
as tsk-it0's own precedent. Not separable into independently workable
pieces.

## Verify

```bash
bash -c 'set -e
# NEGATIVE (mechanism still real): an explicit short print-timeout still
# trips the exact same error the fix is meant to move past 5m for.
agy -p "Wait 8 seconds then reply with exactly: DONE" --dangerously-skip-permissions --new-project --print-timeout 2s 2>&1 | grep -q "timeout waiting for response"
# POSITIVE (fix applied and effective): the configured agy args now carry
# --print-timeout, and a short real call using those exact args completes
# without hitting it.
node -e "
const c = require(\"./.fgos/config.json\");
const args = c.runner.executors.agy.invocations[0].args;
const i = args.indexOf(\"--print-timeout\");
if (i === -1) process.exit(1);
console.log(args[i + 1]);
" > /tmp/agy-print-timeout-value.txt
grep -qv "^5m" /tmp/agy-print-timeout-value.txt
agy -p "Wait 8 seconds then reply with exactly: DONE" --dangerously-skip-permissions --new-project --print-timeout "$(cat /tmp/agy-print-timeout-value.txt)" | grep -q "^DONE$"
'
```

## Outstanding questions

None
