# RESEARCH.md — tsk-2vn (out-of-process dispatch timeout vs npm-test runtime)

## Round 1 — 2026-08-20

**Asked:** where is the cli-spawn/agy provider's own response-wait timeout
configured, what is its current live value, and does it actually sit
shorter than this repo's real `npm test` runtime (~224-386s, as the item
claims)?

**Checked — repo, `src/runner/dispatch/config.mjs` + `transport.mjs`:**
- Outer spawn-level cap: `cfg.timeoutMs` (`config.mjs:142` default
  900000ms/15m historically; live value below). Structurally ruled out as
  the source of the observed `"Error: timeout waiting for response"`
  stderr in a prior, separate investigation (`docs/history/agy-dispatch-
  reliability/RESEARCH.md` round 1, item tsk-1up) — that outer timeout
  kills via `SIGTERM` and rejects with a different message shape
  (`dispatch.mjs:1568-1573`, "executor timed out after…"), never the
  observed string.
- Real source: `agy` CLI's own `--print-timeout` flag (`agy --help`:
  "Timeout for print mode wait (default 5m0s)") — an internal, independent
  response-silence timer, live-repro'd byte-for-byte against the real
  observed stderr in that same prior investigation.

**Checked — live `.fgos/config.json` (main checkout, current HEAD):**
```
runner.timeoutMs: 2100000        (35m)
runner.executors.agy.invocations[0].args: [..., "--print-timeout", "30m", ...]
```
Both values were raised TODAY, commit `77194dbf` ("fix(config): raise agy
dispatch timeout from 10m to 30m", author date 2026-08-20T12:50:10+07:00 =
`2026-08-20T05:50:10Z`) — before that commit, `--print-timeout` was `10m`
(added by tsk-1up, delivered) and `runner.timeoutMs` was `900000` (15m).
Commit message: "`--print-timeout` was capping agy CLI runs at 10 minutes
while the runner's own kill timeout (900000ms/15m) would have force-killed
the process before agy's internal timeout even fired. Raised both...".

**Checked — tsk-vuj's own ask/answer (`fgos show tsk-vuj`), the item this
tsk-2vn's description cites as its live evidence:**
- `ask` (still stored as the item's current/only ask) is near-verbatim the
  same incident tsk-2vn's description narrates: two out-of-process `agy`
  dispatch failures, both `"Error: timeout waiting for response"`, second
  one specifically after the worker announced it would wait for
  `npm test`. It offered the person three options including "(b) raise the
  out-of-process executor's own response-wait timeout in its capacity
  config".
- `answer` (`ts: 2026-08-20T06:01:59.628Z`, ~11 minutes AFTER commit
  `77194dbf` landed) chose option (a) only — "run verify+commit directly
  this one time" — not (b). Consistent with the raise already being live
  by the time the person answered (no need to also ask for a retry with
  the new value; the diff was already sitting there validated).

**Finding: fix direction (a) from tsk-2vn's own "Suggested fix directions"
is already applied and live**, not merely proposed. Current live
`--print-timeout` (30m/1800s) and `runner.timeoutMs` (35m/2100s) both sit
far above the item's own cited real `npm test` runtime ceiling
(~386s/6.4min) — roughly 4.7x headroom on the binding (smaller) of the two
timeouts. The item's own problem statement ("out-of-process is guaranteed
to fail there today", "will hit this same guaranteed-timeout wall every
time") is no longer accurate as of this fix landing — it was accurate at
the time the two tsk-vuj failures happened (both occurred before
`77194dbf`), but is stale relative to the item text as currently written.

**Checked — tsk-4oq (the item tsk-2vn's own description calls "related but
distinct"):** confirmed genuinely distinct scope — tsk-4oq is about adding
an `outcome:"unsignaled"` diagnostic field to `dispatch.mjs execute`'s
return shape (so a driver can tell "crashed after committing" from "lost
work" without manual forensics), never about the timeout value or the
dispatch-decide mechanism itself. No overlap with tsk-2vn's suggested fix
direction (b) (making `dispatch.mjs decide` slow-verify-aware).

**Not yet checked (left for a person, not discovery's own scope):** whether
fix direction (b) — teaching `dispatch.mjs decide` to detect a known-slow
verify (e.g. contains `npm test`) and prefer in-process for such items — is
still wanted now that (a) already gives ~4.7x headroom, or whether that
structural change is no longer worth building given (a) alone already
closes the observed failure mode; whether npm test's real runtime could
ever grow past the new 30m/1800s ceiling (no evidence either way, single
data point of 224-386s observed).

**Open:** yes — this is a real scope ambiguity, not resolvable from
evidence alone. The item's own literal problem statement is now partially
stale (fix (a) already shipped) but its structural suggestion (b) remains
genuinely unaddressed and undecided. A person needs to choose: close as
already-mitigated / narrow scope to (b) only / keep as-is pending more
real-world frequency data. This is a product-scope call, not something
this discovery pass should decide unilaterally.

**Verify (real, confirms the live config values cited above):**
```bash
node -e '
const c = require("./.fgos/config.json");
console.log("runner.timeoutMs:", c.runner.timeoutMs);
const args = c.runner.executors.agy.invocations[0].args;
console.log("agy --print-timeout:", args[args.indexOf("--print-timeout") + 1]);
'
```
