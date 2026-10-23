---
title: "Identity I5: machine signing key, sign and verify, pinned machine keys"
status: in-progress
lane: IDENT
spec: docs/platform/identity/spec.md
created: 2026-10-23
---

# Identity I5: machine signing key and pins

## Outcome

Every machine holds one signing key that Identity minted, and Identity exports `sign(bytes)` and `verify(bytes, &Signature)`. A verifier pins the first key it sees for each machine id, in user state outside the repository, and refuses a different key for that machine afterwards. MAIL (cross-machine delivery) and the shared directory (I4) call these two functions and design no key, algorithm or trust list of their own.

## Owner decisions (2026-10-23 16:58, "1a 2b")

- **1a.** Identity mints a per-machine ed25519 key in `fgos doctor --fix`, like the machine id. No person creates or configures a key.
- **2b.** Trust is pinned per machine in local state, like SSH `known_hosts`. A machine's key is pinned the first time it is seen. A different key claimed for a pinned machine is refused and shown by doctor. Doctor lists the pinned fingerprints so the owner can compare them across machines once. A repository-tracked trust list was rejected because anyone who can push could add themselves; a per-machine approve command was rejected for its N x (N-1) approvals.

Evidence: [signing key survey](../reports/research-261023-1248-identity-i5-signing-key-survey.md). No machine has a key fit to reuse, none has Git signing or GPG configured, and all three have OpenSSH 8.9 or later.

## Frame (approved scope and budget)

- Scope: key mint and read, `sign`, `verify`, the pin store, `fgos identity machine` showing the own key fingerprint, `fgos identity pins [--forget <machine-id>]`, doctor rows, spec, CHANGELOG. About 500 lines of Rust, 300 of tests, 100 of docs.
- Out of scope: carrying signatures on directory entries and messages across machines (I4 and MAIL, after Event Store publication), key rotation beyond `--forget`, signing commits.

## Design

| Part | Rule |
|---|---|
| Key | ed25519, OpenSSH format, `<stateRoot>/identity/machine-key` (mode 600) and `machine-key.pub`; minted once by `fgos doctor --fix` (row `identity-machine-key`, warn when absent), created atomically like the machine id, never replaced by doctor |
| Crypto | `ssh-keygen -Y sign` / `-Y verify` / `-Y check-novalidate` with namespace `fgos-identity`, so no new crypto crate. Doctor row `identity-ssh-keygen` checks OpenSSH 8.1 or later. Every call goes through one module (`packages/identity/rust/src/signing.rs`); no other caller shells out to `ssh-keygen` |
| `sign(state_root, bytes) -> Result<Signature, Refusal>` | `Signature { machine_id, public_key /* "ssh-ed25519 AAAA…" */, sig /* armored SSHSIG */ }`. The public key travels with the signature so a first-seen key can be pinned. Refused `machine-key-missing` |
| `verify(state_root, bytes, &Signature) -> Result<Verified, Refusal>` | Checks the signature against `public_key`, then the pin of `machine_id`: no pin pins it (`Verified { machine_id, fingerprint, first_seen: true }`), an equal pin passes, a different pin is refused `machine-key-changed` (both fingerprints in the detail). A bad signature is refused `bad-signature`. A signature by this machine's own id must match this machine's own key |
| Domain separation | The caller prefixes its own bytes (MAIL: `fgos-mailbox-message/1\n`). Identity signs exactly the bytes it is given. The SSHSIG namespace separates fgOS signatures from other SSH signatures |
| Pins | `<stateRoot>/identity/pins/<machine-id>` = `{"v":1,"machineId","publicKey","fingerprint","firstSeen"}`, created once atomically (racing first sightings settle by the create; a loser compares). User level, so every project on the machine shares them. Not in any repository |
| Verbs | `fgos identity machine` adds `keyFingerprint` (null when no key). `fgos identity pins [--json]` lists pins (`identity.read`); `fgos identity pins --forget <machine-id>` removes one pin after a legitimate re-key (`identity.write`) |
| Doctor | `identity-machine-key` (warn absent, fix mints), `identity-ssh-keygen` (fail when missing or older than 8.1), `identity-pinned-machines` (informational: the pinned machine ids and fingerprints, for the one-time comparison) |

The `verify` signature drops the `project` parameter of the 12:15 proposal to MAIL: trust is per machine, and binding a message to a project belongs to the caller's signed bytes (MAIL already signs `project`).

## Proof

- `cargo test -p fgos-identity`:
  - sign then verify passes and pins;
  - a second verify passes with `first_seen: false`;
  - a flipped byte gives `bad-signature`;
  - a different key for a pinned machine gives `machine-key-changed`;
  - a forged own-machine signature is refused;
  - concurrent first pins settle to one;
  - a missing key gives `machine-key-missing`.
  Tests run real `ssh-keygen` on temporary state roots.
- Doctor wiring proof in `test/setup/checks.test.mjs` (one per row, extended in place).
- `cargo test --workspace` and `npm test` green apart from the known reds; landed on all three machines, each running `fgos doctor --fix` and posting its fingerprint on the board.

## Risk and rollback

- `ssh-keygen` missing on a future machine: the doctor row names it, and `sign`/`verify` refuse with `ssh-keygen-missing`; nothing else depends on I5 yet.
- Rollback: revert; the key and pin files stay in user state, harmless.
