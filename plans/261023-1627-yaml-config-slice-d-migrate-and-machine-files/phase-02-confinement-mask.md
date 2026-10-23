# Phase 02: The machine-private mask in the Confinement Authority

Depends on 01 (landed on main). Suggested executor: sonnet; independent sonnet review before landing (mount ordering, the probe's falsifier, the refusal). Impact analysis first on `resolveConfinementResources`, `prepareBwrap`, `blindRefusals`, `runAllConfinementProbes`, `computeProbeFingerprint` (record blast radius; HIGH/CRITICAL is reported to the owner before editing).

## Context

Today `hostRead: allow` (both built-in policies) lets a confined worker read the whole host filesystem; only `hostRead: blind` masks anything, and only the project's run-state directories, herdr's socket directory and the confinement temp root (`resources.mjs:26`, mask at `drivers/bwrap.mjs:574-589`). Section 9.3 (phase 01) says: machine-private roots hidden from every confined dispatch. Config does not mask anything; this phase is the whole implementation of G6.

## Files it may touch

`src/runner/dispatch/confinement/resources.mjs`, `drivers/bwrap.mjs`, `probes/harness.mjs`, `authority.mjs` (attestation line only if a field is needed), `policies.mjs` (re-export line), `test/runner/dispatch-confinement-machine-private.test.mjs` (new), the argv/probe pins phase 00 listed (update in the same change; a retired pin names the test that now owns the behaviour), `test/runner/dispatch-confinement-credential-hygiene.test.mjs` (one case).

## Design

- **List (data).** `export const MACHINE_PRIVATE_ROOTS = Object.freeze(['{home}/.fgos/private'])` beside `BLIND_HIDDEN_ROOTS`. `resolveMachinePrivateRoots({ homeDir = os.homedir() } = {})` fills `{home}`, real-paths, skips a root that does not exist or is not a directory (the same rule as `resolveBlindHiddenRoots`, `resources.mjs:197-216`; one shared token-filling helper, not two copies).
- **Resolver.** In `resolveConfinementResources` push one `hidden-root` resource per machine-private root **before and outside** the `if (blind)` block (the same shape as `:429-438`, plus `machinePrivate: true` so the driver can tell the two apart in messages only). Blind adds its own roots after them; duplicates are removed by `identity`.
- **Driver, non-blind branch.** Replace `if (!blind) { mounts.forEach(materialize); bindAttemptFiles(); }` by: `mounts.filter(not inside a machine-private root).forEach(materialize)`, then `--tmpfs` for each machine-private root, `bindAttemptFiles()`, then `--remount-ro` for each. With no machine-private root on the host the argv is byte-identical to today (pinned by the existing tests). The blind branch keeps its documented order and gets the machine-private masks inside its `hidden` set.
- **Refusal.** `blindRefusals` (`bwrap.mjs:173-205`) is generalised to `maskRefusals`: it keeps `blind-hides-workspace` and `blind-ref-hidden` (blind only) and adds `machine-private-hides-workspace` for the workspace, cwd, repo root and any mount resource inside a machine-private root, for every confined request. Same `mismatches` path, so the request is refused before spawn (spec 9.2: refused, never run unmasked).
- **Attestation.** `authority.mjs:97-98` already copies every `hidden-root` into `hiddenRoots`; check that `effectiveControls.hostRead` still reads the policy's own value (`allow`) and that `hiddenRoots` is what makes the claim precise. No new attestation field.
- **Probe.** `probeMachinePrivateHidden({ bwrapBin, scratchDir, policy, blind, brokenConfig })` in `harness.mjs`, patterned on `probePeerRunHidden`: a scratch stand-in home with `.fgos/private/accounts.yaml` and `gateway-token` planted, `resolveConfinementResources({ ..., homeDir: scratchHome })` and the real `prepareBwrapSync`; the worker reports `readFileSync` and `readdirSync` codes for both files and for the directory (expect `ENOENT`/empty), and that its own outbox is writable and the workspace behaves as the policy says. `brokenConfig` drops the machine-private resources and the worker must read `PLANTED` (falsifier). It runs once per id in `BUILTIN_POLICY_IDS` (`policies.mjs:66`, two) with `hostRead` allow, and once more per policy with the blind override. Added to the standard set in `runAllConfinementProbes` (the doc says "8", becomes 9 plus the blind probe). `computeProbeFingerprint` gets `machinePrivate: sha256(JSON.stringify(MACHINE_PRIVATE_ROOTS))`; `BWRAP_DRIVER_VERSION` bumped. Stale proofs refresh on the next required spawn (spec 6.6 rule) and `confinement-probe-freshness` says so.
- **What stays out:** file masks, `hostRead: deny`, any change to the credential provisioning (the runner copies the leased login into the private home outside the sandbox; the account's `credentialStore` directory is not under `~/.fgos/private`).

## Steps

1. Merge `origin/main`; `impact` on the five symbols; post if any is HIGH.
2. Resolver and list first; unit tests (`dispatch-confinement-machine-private.test.mjs`, about 150 lines): token filled from an injected `homeDir`, missing root skipped, resources present for non-blind requests, absent when the host has none, a workspace inside the root refused with the named code, duplicate roots removed.
3. Driver argv: test the exact order for `host-write-denied` and `workspace-write`, non-blind and blind (mounts, `--tmpfs`, attempt binds, `--remount-ro`), and the no-root case equal to today's bytes.
4. Probe, then run it **live with real bwrap on this machine** (`/usr/bin/bwrap`), once with the mask and once with the falsifier; attach both outputs to the landing line. If bwrap cannot run here the probe test is skipped by the same helper the other probe tests use and the phase says so; it does not claim a pass.
5. Credential case: extend the hygiene test by one case: a leased account's login still reaches the private home with the mask on (acceptance 18 second half).
6. Update the pinned tests and the doc counts; run `node --test` on the confinement files alone, then the wider runner dir.
7. Independent review; merge `origin/main`; land; board line with the probe evidence and the Rust/Node line counts (resources +50, bwrap +40, harness +100, others +15; cap 260).

## Owning proofs

| Behaviour | Proof |
|---|---|
| Unreadable under each policy and `hostRead` value, falsifier reads | harness probe (real bwrap) |
| Resolver, order, refusal, no-root argv unchanged | `dispatch-confinement-machine-private.test.mjs` (pure) |
| Leased credential still delivered | hygiene test, one case |

## Validation

`node --test test/runner/dispatch-confinement-machine-private.test.mjs test/runner/dispatch-confinement-blind.test.mjs test/runner/dispatch-confinement-backend-p03.test.mjs test/runner/dispatch-confinement-policies.test.mjs` then the other `dispatch-confinement-*` files; `fgos doctor` rows `confinement-probe-freshness` and `confinement-blind-read` after the first re-probe.

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| A mount (workspace, run-output, private home) sits inside the root and gets masked | L x H | refusal before spawn; test for it; tempRoot defaults are outside `~/.fgos/private` (verify `resolveConfinementTempRoot`) |
| bwrap `--tmpfs` over a directory the worker's cwd needs (a worktree under `~/.fgos`) | L x M | the refusal covers cwd/repo root; documented |
| The probe passes by reading the wrong path (a stand-in home that is not the one the driver masks) | M x H | the probe feeds the same `homeDir` to the resolver and the worker's expected path; the falsifier proves the file is readable without the mask |
| A fingerprint change makes every machine re-probe at once | M x L | one probe run per machine, a second or two; stated in the landing line |

## Rollback

Revert the commits: argv returns to today's bytes, the list and probe go together, stale proofs refresh. Spec text from phase 01 stays and is marked "not implemented" by the revert commit message (and a one-line status edit).
