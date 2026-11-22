# Supervisor wake 2026-11-23 06:51

## Events
- 4 `session-idle` events (two refs, each raised twice at 06:48–06:49) were closed. The heads-stable lead is idle, but its phases 8, 9 and 10 are parked on timed measures written in the phase table (phase 9 ends 2026-11-23 14:20; phases 8 and 10 end 21:06). Phase 11 depends on all three. An unsubmitted instruction ("continue phases 8 to 11") already sits in its input box, so nothing was typed. The component-authority lead is busy polling its phase 5 unit `c-72333-1795391372549`.

## Plans
- Running: `261121-2109-component-authority` (lead live; phase 5 parked on q-4lmw3q6la7; phase 7 gate waits on q-br5rlczzav), `261122-0118-heads-stable-and-able` (lead live; timed measures as above).
- Admission: nothing admissible. `261122-1950-owner-communication-standard` is ready but blocked by four plans. Leads 2/4; lanes free 3.

## Open owner questions (unchanged, all asked by this supervisor)
- q-rfxqncjrax account probe for Miu's quota
- q-zcileomdpa heads-rotate full-suite gate on the host
- q-4lmw3q6la7 relay governance holder-table preview to DOCOS
- q-br5rlczzav component-authority full-suite gate on the host

## Chore bcff1703ff6f6e7f (owner, via the secretary): two checks

### (1) Full-suite gate from a fresh pane
- Already met on the host for both plans, so neither question still blocks:
  - heads-rotate: host run at `4951cf3da`, judged in `plans/261122-2307-heads-rotate-on-their-own/reports/lead-261123-0250-heads-rotate-full-suite-judgment.md`; the plan is `done`. q-zcileomdpa can close.
  - component-authority: host-suite reds classified in `47226a7b8`; its phase 7 is `done`. q-br5rlczzav can close. Phase 5 still waits on q-4lmw3q6la7.
- Fresh-pane try (`fgos run`, unit `unit-run-1795391554341-c307194a`, gemini flash): the unit gets a private empty HOME (`/tmp/fgos-confinement/disp_*/home`), so `~/.local/state/fgos/locks/` does not exist there, and `npm test` started without a lock or read-only error. It spent its 90 s budget installing the rustup toolchain and crates. Report: `.fgos/assignments/unit-run-1795391554341-c307194a/producer/1/runs/01/worker-output/outbox/report-1.md`.
- In this supervisor head, by contrast, `~/.local/state/fgos/locks` is the real path mounted read-only (`touch` gives "Read-only file system").
- A full run in a unit was not started: from a cold home it rebuilds everything, and a PID namespace still hides host process liveness, which the 7 known `apps/fgos/src/wiring/doctor/confinement.rs` reds judge. A unit run would not give a cleaner verdict than the host runs that already exist.

### (2) probe-account from this session
- Cannot. `fgos dispatch probe-account --all --json` returns `{"accounts":[]}`. `--provider claude --account vantt` returns: `no account "vantt" for provider "claude" in runner.llmAccounts (~/.fgos/private/accounts.yaml)`. Confinement redirects HOME, so the private accounts file is not visible. q-rfxqncjrax stays: the owner or an unconfined host session (OPC) runs the probe.
