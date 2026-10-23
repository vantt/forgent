# Identity I5: machine signing key, sign/verify, pins - implementation report

## Rust signatures (`fgos-identity`, feature `directory`)
```rust
pub struct Signature { pub machine_id: String, pub public_key: String /* "ssh-ed25519 AAAA" */, pub sig: String /* armored SSHSIG */ } // serde camelCase
pub struct Verified  { pub machine_id: String, pub fingerprint: String /* SHA256:.. */, pub first_seen: bool }                   // serde camelCase
pub fn sign(state_root: &Path, bytes: &[u8]) -> Result<Signature, Refusal>
pub fn verify(state_root: &Path, bytes: &[u8], signature: &Signature) -> Result<Verified, Refusal>
// signing.rs: mint_key(&Path) -> Result<(bool, String), Refusal>; own_public_key; key_fingerprint(&Path) -> Result<Option<String>, Refusal>; fingerprint(&str)
// pins.rs: Pin{v,machine_id,public_key,fingerprint,first_seen}; record(&Path,&Pin)->Result<Recorded,Refusal> (Created|Same|Different(Pin)); list(&Path)->Result<Vec<Pin>,Refusal>; forget(&Path,&str)->Result<Pin,Refusal>
```
Re-exported from lib.rs: `sign, verify, Signature, Verified, Pin, Recorded`.

## Refusal codes
machine-key-missing, machine-key-unreadable, machine-key-write-failed, ssh-keygen-missing, ssh-keygen-failed, invalid-signature, bad-signature, machine-key-changed, machine-id-missing/-unreadable (sign), pins-unreadable, pin-write-failed, pin-not-found, invalid-machine-id, signing-scratch-failed, random-unavailable.

## JSON shapes
- `identity machine`: `{id, handle, alias, keyFingerprint}` (`keyFingerprint` null when no key readable). Also on `--alias`.
- `identity pins`: `{"pins":[{v:1, machineId, publicKey, fingerprint, firstSeen}]}` (identity.read).
- `identity pins --forget <id>`: `{"forgotten": pin}` (identity.write).
- Node addon: `sessionIdentity.mintMachineKey(stateRoot) -> {changed, fingerprint, message}`.

## Doctor rows
identity-machine-key (warn absent; fix mints via addon), identity-ssh-keygen (fail if ssh-keygen missing or OpenSSH < 8.1; no fix), identity-pinned-machines (informational list).

## Files changed
- New: packages/identity/rust/src/{signing,pins}.rs, packages/identity/rust/tests/signing.rs
- Rust: identity lib.rs (mods + pub use only), provider.rs, apps/fgos/src/cli_projector.rs, apps/fgos/tests/cli_tests.rs, packages/git/node-addon/{Cargo.toml (identity feature `directory`), src/session_identity.rs}
- Contracts/routes/registry: identity.read.v1.json, identity.write.v1.json, command-routes.json, src/cli/command-registry.mjs
- Doctor: src/setup/{identity-checks,registrations}.mjs, src/util/identity-mint.mjs, test/setup/{identity-checks,checks}.test.mjs
- Docs: docs/platform/identity/spec.md (5a, I5 row, history), CHANGELOG.md

## Tests (TMPDIR on ext4)
- `cargo test -p fgos-identity`: all green (7 new signing tests: sign/verify/pin, second verify first_seen false, flipped byte, changed key + forget, forged own-machine, racing first pins -> one, missing key, concurrent mint, shape refusals, pins list/forget/corrupt).
- `cargo test -p fgos --test cli_tests identity`: 9 pass (new pins wiring test; machine test now expects keyFingerprint null).
- Node focused (staged addon+host): identity-checks, checks, command-routes, subcommand-flag-drift, fgos-help: all pass (72 + 22).
- one-door scan: no site mentions the new code (5 pre-existing unresolved-binary sites, unrelated).
- Not run: full workspace and `npm test` (IDENT lead).

## Deviations
- Verify uses `-Y verify` with a one-line allowed-signers file holding `public_key` (binds signature to exactly that key, no output parsing) instead of check-novalidate; explained in a code comment.
- Own-machine forgery is refused `machine-key-changed` (plan gave no code).
- Fingerprint via `ssh-keygen -l -f -` (stays in the one module; no base64 code). `identity machine` swallows a fingerprint failure into null; doctor rows name the cause.
- Pin json output includes `v`.
- `identity-ssh-keygen` row probes `ssh-keygen -?` and `ssh -V` in Node (not an ssh-keygen verification call).
- The addon now enables identity feature `directory` (needs Refusal); no new dependencies.
- Did not run real `fgos doctor --fix`; real state untouched.
