---
phase: 03
title: "Credential and confinement: masks hide every account login store (Q3b), a host-only record beside each private home lets held homes settle again (A7), a written-back login is applied only after the probe proves its account (A8)"
status: pending
depends_on: [02]
parallel: "wave 2, with 04, 05, 07 (disjoint files)"
effort: ~1.5d
net_size: "Node +90 / Rust 0 / tests +100 (estimate)"
---

# Phase 03 — Credential and confinement doors

## Context

Decision 61 Q3b; decision 62 A7, A8; red-team R-5 and the R-1 residual (arbitration §4 A7/A8 rows); simplicity "dead attestation phases" left open by batch B (`lead-261104-1958` Questions). Builds on the landed write-back fix (`0f6843fc6`, `a56d56541`): the target lives only in the finalization descriptor; held homes never settle by themselves.

Code read on `4b116c27e` (paths after P02 where a module moved):
- Masks: `confinement/resources.mjs:72-99` (`MACHINE_PRIVATE_ROOTS`, "a path another component owns enters here as one more entry"), `:312-333` (`resolveMachinePrivateRoots`, directories only via `existingDirectories` `:356`), `:581-582` (pushed as hidden resources); `drivers/bwrap.mjs:559` (`--ro-bind / /`), `:644,654` (`--tmpfs` per hidden root); probe fingerprint hashes the list (`probes/harness.mjs:65`). Inventory schema: `runner.schema.yaml:284-300` (`llmAccounts…credentialStore`: "Login directory per CLI name"), executor `credentialStore` `:625-640` (`use`, `homeEnv`, `files`). Spec non-goal `docs/platform/agent-confinement/spec.md:123`; §9.3 `:516`.
- Private home: `bwrap.mjs:598-615` (`<tempRoot>/<dispatchId>/home`, v2 marker written inside the home `:604`, write-back target computed `:615`), `:702` (target returned into the descriptor); `cleanup.mjs:30` (`resolveConfinementTempRoot`), `:98` (`writeOwnershipMarkerV2`), `:144` (`extendOwnershipMarker`), `:203` (`countCredentialKeep`, counter kept in the marker), `:277` (`listKeptCredentialHomes`).
- Finalize: `authority.mjs:1326-1340` (descriptors), `:1342-1352` (marker read), `:1366-1407` (`finalizeAttemptHome`; `:1384` reads the keep counter from the agent-writable marker).
- Write-back: `provider-credential-renewal.mjs:1202-1209` (`validWriteBack`), `:1217-1258` (`writeBackRenewedCredential`: stage under `credentialStoreDir/pending`, then `applyLeftovers` under the account lock), `:989-1010` (`applyLeftovers`, no probe), `:1039-1100` (`refreshAhead`, async, already probes in `renewInScratch`); probe door `provider-credential-probe.mjs:42` (`credentialProbeCommand`), `:89` (`runCredentialProbe`), `:129` (`createCredentialProbe`).
- Doctor: `src/setup/registrations.mjs:4815-4825` (`credential-copies-retained` check and fix; message "held private homes are recovered by hand" `:4810`).
- Prior art: `git show 0f6843fc6^:src/runner/dispatch/confinement/cleanup.mjs` (`settleHeldCredentialHomes`, `createConfinementCredentialRenewal`) and `0f6843fc6^:src/runner/dispatch/provider-credential-renewal.mjs` (`settleHeldCredentialHome`, the `heldHomes` hook of `refreshAhead`).
- Attestation: `authority.mjs:169` (`buildConfinementAttestation`); every call on main passes `phase: "refused"` (`:527,578,605,639,665,690,701,776`) or the prepared path; batch B found `completed|failed` and `error` with no production caller.

## Requirements

- **Q3b masks.** `resolveMachinePrivateRoots` gains one more source: the login directories named by the machine account inventory (every account's `credentialStore` per CLI, expanded as the renewal module expands them) and each executor's `credentialStore` home (the `homeEnv` value of the runner's env, else the CLI's default home). Each existing directory becomes a hidden machine-private root (`--tmpfs`), outermost-only as today. The leased account's own store is never needed inside: the worker gets its copy in the private home (already). A name that resolves to a file, a relative path or the home itself is refused by name (`login-store-not-a-directory`, `login-store-is-home`), never skipped. `~/.config/gh` and `~/.ssh` are not added (owner). The probe fingerprint changes with the list (`harness.mjs:65`), so attestations re-probe once: say so in the CHANGELOG line.
- **A7 host-only record.** When `prepareBwrapSync` makes a private home at `<tempRoot>/<dispatchId>/home`, it also writes `<tempRoot>/<dispatchId>/<record>.json` (name from `fgos convention name`; 0600 in the 0700 dispatch directory, which is not bound into the sandbox: lead proves it with a confined `ls`) holding `attemptId`, `runDir`, `dispatchId`, the write-back target (the same object the descriptor holds) and the keep counter. `finalizeAttemptHome` reads the counter from that record, not from the marker (`authority.mjs:1384`), and increments it there (`countCredentialKeep` moves its storage; the marker keeps identity only). Held homes settle again: restore the settle path removed in `0f6843fc6` (refresh-ahead `heldHomes` hook and `doctor --fix`) reading the target and counter only from the host record; a home with no host record (older release, or tampered) stays held and doctor names it as today.
- **A8 probe gate.** A copy written back from an agent's private home is staged and marked as agent-origin in the pending directory (host-only); it is never applied in `writeBackRenewedCredential` itself (that runs in the finalize step, which is sync and bounded). `refreshAhead` (and the A7 settle) applies an agent-origin copy only after (1) the existing credential probe accepts the copy's home and (2) the copy's account identity equals the source's. Identity per layout is read from the login itself (lead documents the field per layout: codex JWT account claim, pi/omp account fields); a layout that cannot name an identity is never applied automatically (kept, doctor names it). fgOS-scratch copies (`renewInScratch`) keep today's path.
- **Dead attestation phases.** If `rg -n "phase: ['\"](completed|failed)['\"]" src` finds no caller, delete the `completed`/`failed`/`error` branches of `buildConfinementAttestation` and any unreachable non-supervised branch of `prepareConfinementForLaunch` the lead proves unreachable (L10); else record why they stay.
- Doctor `credential-copies-retained`: message and fix follow A7 (held homes settle when the host record allows; "recovered by hand" only for homes without one).
- CHANGELOG: confined workers no longer see other accounts' login stores; held homes settle by themselves again; a written-back login is applied only after the probe.

## Files

**Create:** none (the host record is a runtime file).

**Modify:**
- `src/runner/dispatch/confinement/resources.mjs` (`:72-99`, `:312-333`)
- `src/runner/dispatch/confinement/drivers/bwrap.mjs` (`:598-615`, `:693-709` rollback removes the record too)
- `src/runner/dispatch/confinement/cleanup.mjs` (`:98-156` marker identity only, `:203-224` counter storage, `:277-308` listing reads host records, settle restored)
- `src/runner/dispatch/confinement/authority.mjs` (`:169` attestation phases, `:1366-1407`)
- `src/runner/dispatch/confinement/probes/harness.mjs` (stand-in login stores in the blind-read probe, so `confinement-blind-read` proves the new masks)
- `src/runner/dispatch/provider-credential-renewal.mjs` (`:989-1100`, `:1217-1258`)
- `src/runner/dispatch/provider-credential-probe.mjs` (only if the identity read lives with the probe)
- `src/setup/registrations.mjs` (`:4805-4825`)
- Tests: `test/runner/provider-credential-renewal.test.mjs`, `test/setup/credential-copies-retained-check.test.mjs`, `test/runner/dispatch-confinement-p04.test.mjs` (or the blind-read owner), `test/run-supervisor/attempt-steps.test.mjs` (finalize-home), `test/runner/dispatch-confinement-credential-hygiene.test.mjs`
- `CHANGELOG.md`, census

**Delete:** the keep counter field in the marker; `buildConfinementAttestation` `completed|failed` branches if unreachable.

**Tests to retire:**
- Cases in `provider-credential-renewal.test.mjs` that assert "held homes are never settled automatically" (added by `0f6843fc6`): behaviour reversed by A7; owner: the P01 red case "a held home settles by itself once its login is safe" plus a case "a home without a host record stays held".
- Cases asserting a write-back applies a newer copy at once: owner becomes "a renewed login whose account differs from the leased account is never applied" and "an agent-origin copy is applied after the probe accepts it" (same file). The lead lists each retired title.
- Attestation tests of the `completed`/`failed` phases, if the branches go: behaviour removed.

## Net size

Node: masks +20, host record and counter +30, settle restored +30 (reused shape), probe gate +30, dead phases −20 → about +90. Tests: P01 rows +60, masks +30, settle/probe cases +40, retired −30 → about +100.

## Steps

1. Take P01's three rows (masks, account mismatch, held settle); confirm red.
2. Masks; run the confinement and probe tests; one confined smoke with stand-in stores.
3. Host record and counter; finalize reads it; the settle path restored from `0f6843fc6^` against the record.
4. Probe gate in `refreshAhead`/settle; identity per layout.
5. Attestation dead branches; doctor message; CHANGELOG; census.

## Validation (focused)

- FR `test/runner/provider-credential-renewal.test.mjs test/setup/credential-copies-retained-check.test.mjs test/runner/dispatch-confinement-p04.test.mjs test/runner/dispatch-confinement-credential-hygiene.test.mjs test/run-supervisor/attempt-steps.test.mjs test/runner/provider-per-cli-credential-sources.test.mjs test/runner/provider-credential-probe.test.mjs`
- `rg -n "credentialKept" src` shows the counter only in the host-record reader/writer.
- On fg-server2 after land: one confined seat smoke; `fgos doctor` rows `confinement-blind-read`, `confinement-probe-freshness`, `credential-copies-retained` pass.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A mask hides a store a confined seat reads in place (no `credentialStore` copy) and its login fails | M × M | Every executor that runs confined uses its private-home copy (spec); the smoke runs one confined seat per CLI family available; a seat that breaks is reported with its executor, not worked around. |
| The dispatch directory turns out reachable from the sandbox | L × H | Lead proves with a confined `ls <tempRoot>/<dispatchId>`; if reachable, stop and ask (the record would be as forgeable as the marker). |
| Probe takes up to 90 s inside `refreshAhead` on the launch path (S-6) | M × M | Only agent-origin copies are probed, once, under the existing account lock and cooldown; S-6 stays a backlog row (H-T5b). |
| Rollback reopens the A8 residual (old release applies agent copies directly) | L × M | Listed in the guide's rollback line. |

## Rollback

Revert the merge; re-activate the previous release. On disk: host records stay beside homes (old release ignores them, keeps such homes held); agent-origin marks in `pending` are ignored by the old release, which applies those copies without a probe.

## Done when

P01 rows green; masks proven by the blind-read probe and a confined smoke; held homes settle with a host record; no agent copy applied without probe and identity; landed with a confined smoke; guide section written.

## Lead brief essentials

Reuse the removed settle shape from `0f6843fc6^`; never read authority from inside a home. Masks refuse by name, never skip. No real login touched in tests. All plan.md lead rules apply.
