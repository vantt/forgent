# Dispatch Visibility V0 — live proof

Date: 2026-09-07 | Branch: `dispatch-visibility-v0` | herdr 0.8.2
Artifacts: [`proofs/2026-09-07-v0/`](proofs/2026-09-07-v0/) — four runnable scripts and the
JSON each one wrote.

Every number below came out of a real run against a real herdr and a real agent.
Nothing here was read off a terminal, and nothing was inferred from a status word.

## Safety of the runs themselves

All four probes created their own herdr session (`fgos-v0-proof`,
`fgos-v0-proof2`, `fgos-v0-p1`, `fgos-worker`), spoke only to that session's socket,
and stopped and deleted only what they had created. Each one recorded the session
list on the way out; all four recorded `default(running)`. The confinement probe
read the operator's agent list once, to have something to compare against, and
never addressed it for a write. The operator's session, with its
live work in it, was never addressed — including by the restart case, which
restarted the probe's own session.

## What was proved

| Case | Fake | Live | Result |
|---|---|---|---|
| A. Settled end to end | ✅ | ✅ claude | `settled` in 39.1s; brief carried the multi-line prompt verbatim; worker wrote ack, report and result; the task file landed with exactly the expected content |
| B. Died | ✅ | ✅ claude | agent killed mid-round → `died` in **1525 ms**, pane kept |
| C. Descendant survives `pane close` | — | ✅ | `setsid` child (pid 1997998) still alive after the pane closed |
| D. Observer is a different process | ✅ | ✅ | a separate OS process running `fgos dispatch watch` took 15 readings while another process drove the run |
| P3. Gateway restart | — | ✅ | panes survived: `[w1:p1, w1:p2]` before and after → **`resume: reattach-or-relaunch`** |
| Startup race: premature idle | ✅ | (covered by A) | a premature `idle` cannot end a round; only the result file does |
| `agent_not_ready` / `agent_blocked` | ✅ | — | three transport failures stay three named answers |
| Ack lost, resend capped | ✅ | — | first delivery plus exactly `maxResends`, never more |
| Pane id reuse | ✅ | — | a handle that finds nothing means gone, never someone else's pane |
| Crash before/after RunResult | ✅ | — | reconciles to `settled` / `died` / `unknown` |
| P1. agy conformance | — | ✅ | see below |
| Worker escapes its lane | ✅ | ✅ | confined: worker session socket, private HOME, operator cockpit unreachable — see below |

## Case A — the shape works

A real `claude` agent, started by `herdr agent start`, given a seven-line prompt
through `brief-1.md` and a one-line pointer, wrote `ack-1.json`, `report-1.md` and
`result-1.json` itself, and created the file the task asked for containing exactly
`v0-live-proof`. The adapter concluded from those files and closed the pane.

`visibility.json` recorded the pane id and the agent session
(`c835bb2d-…`) at the moment the agent became ready, then reconciled to
`settled` — which is what makes a reattach after a restart possible at all.

This is the end-to-end shape that the old path could never reach: it corrupted
every multi-line prompt before the agent saw it.

## Case B — death is detected, and the pane is kept

A real `claude` process was killed with SIGKILL while the agent was working. The
adapter reported `outcome: died` **1525 ms** later, with the message *"no agent
process in the pane on 3 consecutive reads"*, and left the pane open. The pane was
confirmed still present afterwards.

That timing is the ladder working as designed: three consecutive `absent` readings
at 500 ms. A single unreadable probe would have reset the count.

## Case C — closing a pane is not cancelling a worker

A `setsid` child started in a pane was still running after `herdr pane close`. This
is why no outcome in V0 is ever reported as `cancelled`: the foreground process
dies and the descendant does not.

## Case D — observing needs no permission

A separate OS process ran the real `fgos dispatch watch` CLI against the same run
while another process drove it, and took 15 readings without holding a lease or
asking the driver for anything. Sample line:

```txt
fgos: run=run_v0_… status=running pane=w1:p2 visibility=pane-created outbox=0
```

The first probe could not answer this and said so rather than claiming it: the
adapter's herdr calls are synchronous, so an in-process timer never got to run.
The fix was to make the watcher a genuinely separate process, which is what the
requirement asked for in the first place.

## P1 — does agy honour the contract?

Threshold declared in advance, so the result could not be rationalised afterwards:
**≥9/10 rounds produce an ack**, and **10/10 produce either a result or a named
failure**. Below that, agy loses its interactive label and falls back to
`cli-spawn` — a conclusion about agy, never a reason to adjust the design.

**Result: 10/10 `settled`, 10/10 ack, 10/10 result. PASS — agy keeps its
interactive label.** Median round 26.5 s, fastest 24.0 s, slowest 50.3 s.

This is the executor that was completely broken on the old path. Two separate
defects were recorded against it: it never received the prompt at all under `-i`
(so it sat at an idle banner while the adapter reported success), and every
multi-line prompt was corrupted before it arrived. Neither can happen now — the
prompt is a file, and completion is a file the worker wrote — and ten consecutive
real rounds landed clean.

One qualification, stated because it bounds the claim: the task was small and the
prompt was six lines. This measures contract conformance — does agy read a pointer,
find the brief, and write the three files — not whether agy does hard work well.

Worth recording alongside it: `herdr integration status` reports
`antigravity-cli: not installed` on this machine, so herdr has no hook for agy's
agent state. Ten rounds still passed, which is the point of no longer concluding
anything from agent state.

## The escape lane — measured closed

Asked from **inside a confined worker's own pane**, with the operator's session
holding 16 live agents at the time:

| Question | Answer |
|---|---|
| Which socket did herdr hand the worker? | `…/sessions/fgos-worker/herdr.sock` — the worker session's own, not the operator's |
| Is `HOME` the private one? | yes (`/tmp/worker-confine-…`) |
| Is the operator's cockpit socket reachable through `$HOME`? | **no** — the fallback is closed |
| Can the worker enumerate the operator's agents? | no — it saw its own session, not the 16 |

Both halves were needed and neither was sufficient. A private HOME closes the
`$HOME/.config/herdr/herdr.sock` fallback a worker finds with no environment
variable at all. It does **not** stop the worker reaching a cockpit, because
herdr injects `HERDR_SOCKET_PATH` into every pane it creates and overwrites any
override — so a worker cannot be denied a socket, only handed a different one.
Putting the worker in its own session is what makes the socket it is handed
harmless.

The adapter now applies both when an executor declares them, and **refuses the
dispatch** when confinement was declared and could not be established — running
anyway would place a worker on the operator's socket while the profile claimed
otherwise. An executor that declares nothing behaves exactly as before.

## Two findings the probes produced by failing first

**`herdr pane split` needs a pane to split from.** The first run of probe A died in
8 ms with herdr's own `pane_not_found`. A freshly started session has no pane, and
the adapter always splits, so it cannot open the first pane in an empty session. In
the operator's session a pane always exists, which is why this had never shown up.
Recorded as a constraint on the adapter rather than worked around silently.

That failure was also an unplanned proof of two things built earlier: the error
arrived as herdr's own named code rather than a generic timeout, and
`visibility.json` had already been written with `status: requested`, so even a
dispatch that failed in 8 ms left a trace behind.

**The trust store's derive-from-a-trusted-root rule is real.** Seeding trust for a
throwaway directory under `/var/tmp` was refused, because `/var/tmp` is not itself
trusted and there was nothing to derive from. The probe moved its workspace under
an already-trusted root instead of loosening the rule.

## Still open, stated rather than closed quietly

**The worker still holds a copy of the operator's provider credential.** The
private HOME gets a copy so the agent can authenticate at all, and it is removed
when the round settles. Only a relay removes the copy itself, and V0 has none.

**Workers share one session, so one worker could address another's pane.** The
boundary proved below is worker-versus-operator, not worker-versus-worker. Given
the recorded threat model — the real risk is unintentional drift, not malice —
that is accepted for V0 and named here rather than left to be discovered.

**Hang detection remains unsolved.** V0 has an idle timeout and a ceiling. Upstream
measured that neither CPU nor an output counter distinguishes a thinking agent from
a stuck one; calling that a gap is more honest than pretending the timeouts cover
it.
