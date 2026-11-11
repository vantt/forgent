---
status: in-progress
branch: spike/paseo-external
origin: plans/261111-1255-paseo-external-launch-spike/plan.md
---

# Runner adapter `paseo-spawn`

## Outcome

`fgos run "<prompt>" --override '[{"executor":"<id>","invocation":"<id>"}]'` with an invocation `adapter: paseo-spawn` runs the Unit as an
`external` attempt of the run supervisor: the controller prepares the attempt exactly as for the other two
adapters (admission, locks, confinement, envelope, side file, settle steps), starts the supervisor, then asks a
paseo daemon to start the agent through `fgos-exec-<cli>` with `FGOS_ATTEMPT_DIR`. The agent's turn ending closes
the paseo agent; the receipt, settle and finalize-home run as for any attempt. While it runs, paseo can steer it.

## Acceptance

1. Schema, registry, transport label and supervised-only stub know `paseo-spawn`; an unpinned bind never takes it.
2. `buildEnvelope` writes `mode: external` with `external {socketPath, orphanSettleMs, helloLimitMs}`, `launch.args: []`,
   the confined `TMPDIR`, `--die-with-parent` in the bwrap prefix; contracts `envelope.v3` and `attempt-intent.v1` list it.
3. The launch driver (`src/runner/dispatch/paseo-launch.mjs`) refreshes the `fgos-exec-<cli>` link to the attempt's
   host, waits for the supervisor's socket, runs `paseo run --no-wait --json --provider fgos-<cli> --mode <mode>
   --env FGOS_ATTEMPT_DIR=<runDir> --cwd <cwd> --title <unit> <brief>`, records the agent id, then
   `paseo wait` and `paseo agent archive`. A refused or failed start ends the attempt with a named code.
4. Settle records `adapter: paseo-spawn`; a doctor row reports paseo readiness only when an invocation uses it.
5. Spec `run-supervisor` gets section "External mode" and a decision entry; CHANGELOG line.
6. Live: `fgos run` through the dev host, Codex under bwrap, receipt `exited`, result settled, steer lands.
7. `npm test` and `cargo test --workspace` green (sequential, `-j 4`).

## Decisions taken in this plan

- Paseo is chosen only by pin (`--override` naming the invocation), like a herdr invocation outside herdr: no bind preference.
- The controller drives paseo (run, wait, archive); the supervisor stays host-agnostic (no paseo in Rust).
- Codex's own sandbox is off through paseo's agent mode whenever fgOS confines the attempt (`full-access`);
  fgOS's bwrap is the boundary, as for `codex-cli-bwrap` (`-s danger-full-access`). Unconfined, paseo's default.
- The link `fgos-exec-<cli>` lives in the fgOS state root (`bin/`); paseo's provider `fgos-<cli>` points its
  `command` at it. The launch refreshes the link; doctor prints the provider entry when it is missing.
- The brief travels as paseo's prompt argument (Linux caps one argument at 128 KiB: a larger brief is refused).

## Result (2026-11-11, paseo 0.15.4, Codex, bwrap)

`fgos run "<prompt>" --override '[{"executor":"codex-paseo","invocation":"codex-paseo"}]'` through the dev host,
with a scratch HOME holding the executor and a `codex` login store (the installed release does not know
`paseo-spawn`, so the user's global config must not name it before a release that does is activated):

| # | Result |
|---|---|
| 1 | Met. Bind keeps the plain confined invocation unpinned; the pin records transport `paseo` (bind test) |
| 2 | Met. Envelope `external` with socket, hello limit, empty args, `TMPDIR=/tmp`; bwrap `--die-with-parent` and socket bind (driver test); contracts updated |
| 3 | Met. Link refreshed, socket waited, `paseo run` with `--mode full-access`, `external-agent.json` records agent id and `closed {waited: 0, archived: 0}` |
| 4 | Met. Run settled `pass`, adapter `paseo-spawn`, receipt `exited`, `outboxPresent`; doctor row tested with an injected daemon answer |
| 5 | Met. Spec section 5.4, two known limits, decision entry; CHANGELOG |
| 6 | Met. A steer sent during `sleep 90` was answered and quoted verbatim in the settled claim. A run whose agent was never requested ended `abandoned-not-started (start-refused:external-gate-silent)` after the 30 s hello limit |
| 7 | Pending: full suites |

Found live and fixed: `resolveStateRoot()` returns an object (`.stateRoot`); `permissionMode: bypass` is refused for a
read-only Unit (it needs full confinement), and the Codex sandbox is a confinement matter, not a permission one, so the
paseo mode follows confinement, as `-s danger-full-access` does for a cli invocation.

## Not in this plan

Daemon loss mapped to `carrier-lost` (today: gate dies by PDEATHSIG, receipt from the supervisor's gate-lost
path); notify-on-finish; paseo providers other than Codex verified live; writing paseo's config.
