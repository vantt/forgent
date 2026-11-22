# Supervisor wake, 2026-11-23 00:06 to 00:20

## What moved
- `261122-0118-heads-stable-and-able`: the lead was idle, waiting for someone allowed to change its footprint to land
  the owner-ordered narrowing (dropping `docs/architecture-manifest.json` and `setup-doctor-registry.md`). I landed it
  as `9fc5261af` and typed the commit id into the lead under event `2c95fb52b63605a5`. The lead resumed phases 8 to 11.
- `261122-2307-heads-rotate-on-their-own`: phase 3 is parked on unit ticket `c-20844-1795366492107`, a gemini `agy`
  worker that is still alive in worktree `-p03`. I raised `2f3952bf1cd10e68` and woke the lead. It is now polling the
  ticket with `fgos request result --wait`, a wait I verified, so I left it alone.
- `261121-2109-component-authority` (owner order 00:15 via Miu, event `bc3471662a98b7c3`): with the heads-stable
  overlap gone and `owner-communication-standard` already listing this plan in its `blockedBy`, I set it `ready`
  (`4d91f3043`) and admitted it (`57d254b66`, status `running`, base `4d91f3043`). I started lead
  `head:lead-forgent-261121-2109-compon-8ee21` after checking that no session held the name. That lead is live and working.
- Event `d077eeccc6016422` (session-idle) named the owner's manual `lead:SUPERVISOR` session, which is not a head. I
  took no action.

## Problems found
- `fgos session type` puts the text into the target's input box without submitting it. A second `type` with `\r` was
  needed to send it.
- `fgos mailbox send` from this confined supervisor is refused with `event-store-unavailable` /
  `git-floor-probe-failed: Read-only file system`.
- `fgos friction record` refused `--subject` in every form I tried (`plan:<dir>`, `plan:plans/<dir>`, `verb:<name>`)
  with `friction-invalid-input ... Expected format kind:id`, so I could not record the two problems above.
- `fgos supervisor plans --json` still shows component-authority as `ready`/`admissible` after `57d254b66` committed
  `running` and a lead. Its `leadsLive` also stayed at 2. A later wake must not admit it again. The live-name check
  stops a second start, but a second admission land would overwrite `base`.
- The land of `4d91f3043` reported `gatesRun: []`, so the land door's plan check did not run for the `ready` transition.

## Open
- Owner question `q-rfxqncjrax` (who runs the account probe for Miu's quota) is still open. It blocks only Miu's
  account move.
