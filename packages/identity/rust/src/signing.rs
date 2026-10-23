//! The machine signing key and `sign` / `verify` over it. Every call to
//! `ssh-keygen` in the repository lives in this file: no other module shells
//! out to it, and no crypto crate is linked.
//!
//! The key is an ed25519 OpenSSH key under `<state root>/identity/`
//! (`machine-key`, mode 600, plus `machine-key.pub`). Signatures are SSHSIG
//! armor in the namespace [`NAMESPACE`], so a signature made for fgOS is not
//! valid for any other SSH purpose. Identity signs exactly the bytes it is
//! given; the caller prefixes its own domain-separation text.
//!
//! The private key is only ever handed to `ssh-keygen` as a file path (`-f`),
//! never read, printed or logged here, and the ssh agent is never consulted.

use crate::machine;
use crate::pins::{self, Pin, Recorded};
use crate::refusal::Refusal;
use crate::text::{iso_utc_now, random_hex128};
use serde::{Deserialize, Serialize};
use std::ffi::OsStr;
use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

pub const NAMESPACE: &str = "fgos-identity";
pub const KEY_FILE: &str = "machine-key";
pub const PUBLIC_KEY_FILE: &str = "machine-key.pub";
const KEY_TYPE: &str = "ssh-ed25519";
const ARMOR_HEADER: &str = "-----BEGIN SSH SIGNATURE-----";
const MAX_PUBLIC_KEY_LENGTH: usize = 256;
const MAX_SIGNATURE_LENGTH: usize = 4096;
/// The principal name in the one-line allowed-signers file `verify` writes.
const PRINCIPAL: &str = "fgos";

/// A signature that carries everything a verifier needs but trust: the signer's
/// machine id, its public key (so a first-seen key can be pinned) and the
/// armored SSHSIG.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Signature {
    pub machine_id: String,
    /// `ssh-ed25519 <base64>`, no comment.
    pub public_key: String,
    pub sig: String,
}

/// A signature that holds: whose it is and which key made it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Verified {
    pub machine_id: String,
    /// `SHA256:<base64>`.
    pub fingerprint: String,
    /// True when this call pinned the key because the machine was unknown.
    pub first_seen: bool,
}

fn refuse(reason: &'static str, detail: impl Into<String>) -> Refusal {
    Refusal { reason, detail: detail.into(), candidates: Vec::new() }
}

fn identity_dir(state_root: &Path) -> PathBuf {
    state_root.join("identity")
}

fn key_path(state_root: &Path) -> PathBuf {
    identity_dir(state_root).join(KEY_FILE)
}

#[cfg(unix)]
fn private_dir(path: &Path) -> io::Result<()> {
    use std::os::unix::fs::DirBuilderExt;
    fs::DirBuilder::new().recursive(true).mode(0o700).create(path)
}

#[cfg(not(unix))]
fn private_dir(path: &Path) -> io::Result<()> {
    fs::create_dir_all(path)
}

/// A private scratch directory under the state root's own `tmp`, removed when
/// dropped. `ssh-keygen` needs a file for some inputs; they never go to a
/// shared temp directory.
struct Scratch(PathBuf);

impl Scratch {
    fn new(state_root: &Path) -> Result<Self, Refusal> {
        let name = random_hex128().map_err(|e| refuse("random-unavailable", e.to_string()))?;
        let path = state_root.join("tmp").join(format!("signing-{name}"));
        private_dir(&path).map_err(|e| refuse("signing-scratch-failed", format!("{}: {e}", path.display())))?;
        Ok(Self(path))
    }

    fn file(&self, name: &str, bytes: &[u8]) -> Result<PathBuf, Refusal> {
        let path = self.0.join(name);
        fs::write(&path, bytes).map_err(|e| refuse("signing-scratch-failed", format!("{}: {e}", path.display())))?;
        Ok(path)
    }
}

impl Drop for Scratch {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.0);
    }
}

/// The only place `ssh-keygen` is started. The agent socket is removed from
/// the environment so a key is only ever taken from the file named by `-f`.
fn ssh_keygen(args: &[&OsStr], stdin: &[u8]) -> Result<std::process::Output, Refusal> {
    let mut child = Command::new("ssh-keygen")
        .args(args)
        .env_remove("SSH_AUTH_SOCK")
        .env("LC_ALL", "C")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| {
            if e.kind() == io::ErrorKind::NotFound {
                refuse("ssh-keygen-missing", "ssh-keygen is not installed or not on PATH; install OpenSSH 8.1 or later")
            } else {
                refuse("ssh-keygen-failed", format!("cannot start ssh-keygen: {e}"))
            }
        })?;
    let mut pipe = child.stdin.take().expect("stdin was piped");
    // The writer runs beside the reader so large input never deadlocks on a full output pipe.
    let output = std::thread::scope(|scope| {
        scope.spawn(move || {
            // A closed pipe means ssh-keygen stopped reading; its exit status tells why.
            let _ = pipe.write_all(stdin);
        });
        child.wait_with_output()
    });
    output.map_err(|e| refuse("ssh-keygen-failed", format!("ssh-keygen did not finish: {e}")))
}

fn text(bytes: &[u8]) -> String {
    String::from_utf8_lossy(bytes).trim().to_owned()
}

fn failed(what: &str, output: &std::process::Output) -> Refusal {
    refuse("ssh-keygen-failed", format!("{what}: {}", text(&output.stderr)))
}

/// The first two fields of an OpenSSH public key line: the type and the key,
/// without the comment.
fn key_without_comment(line: &str) -> String {
    line.split_whitespace().take(2).collect::<Vec<_>>().join(" ")
}

/// The single accepted shape of a public key that travels: `ssh-ed25519 <base64>`.
/// Anything else (another type, a comment, a newline that would add a line to
/// the allowed-signers file) is refused before any process starts.
fn check_public_key(public_key: &str) -> Result<(), Refusal> {
    let valid = public_key.len() <= MAX_PUBLIC_KEY_LENGTH
        && public_key.split_once(' ').is_some_and(|(kind, blob)| {
            kind == KEY_TYPE
                && !blob.is_empty()
                && blob.bytes().all(|c| c.is_ascii_alphanumeric() || matches!(c, b'+' | b'/' | b'='))
        });
    if valid {
        Ok(())
    } else {
        Err(refuse("invalid-signature", format!("public key must be `{KEY_TYPE} <base64>` of at most {MAX_PUBLIC_KEY_LENGTH} characters")))
    }
}

fn check_armor(sig: &str) -> Result<(), Refusal> {
    let valid = sig.len() <= MAX_SIGNATURE_LENGTH
        && sig.starts_with(ARMOR_HEADER)
        && sig.chars().all(|c| c == '\n' || c == '\r' || c.is_ascii_graphic() || c == ' ');
    if valid {
        Ok(())
    } else {
        Err(refuse("invalid-signature", "sig must be an armored SSH signature of at most 4096 printable characters"))
    }
}

/// `SHA256:<base64>` of a public key, as OpenSSH prints it.
pub fn fingerprint(public_key: &str) -> Result<String, Refusal> {
    check_public_key(public_key)?;
    let output = ssh_keygen(&["-l".as_ref(), "-f".as_ref(), "-".as_ref()], format!("{public_key}\n").as_bytes())?;
    if !output.status.success() {
        return Err(failed("cannot fingerprint the public key", &output));
    }
    text(&output.stdout)
        .split_whitespace()
        .nth(1)
        .filter(|print| print.starts_with("SHA256:"))
        .map(str::to_owned)
        .ok_or_else(|| refuse("ssh-keygen-failed", "ssh-keygen printed no SHA256 fingerprint"))
}

/// This machine's public key, derived from the private key file so it cannot
/// drift from it. `machine-key-missing` when no key was minted.
pub fn own_public_key(state_root: &Path) -> Result<String, Refusal> {
    let key = key_path(state_root);
    if !key.is_file() {
        return Err(refuse("machine-key-missing", "no machine signing key yet; run `fgos doctor --fix` to mint it"));
    }
    let output = ssh_keygen(&["-y".as_ref(), "-f".as_ref(), key.as_os_str()], b"")?;
    if !output.status.success() {
        return Err(failed("cannot read the machine key", &output));
    }
    let public_key = key_without_comment(&text(&output.stdout));
    check_public_key(&public_key).map_err(|_| refuse("machine-key-unreadable", "the machine key is not an ed25519 key"))?;
    Ok(public_key)
}

/// The fingerprint of this machine's key; `None` when no key was minted.
pub fn key_fingerprint(state_root: &Path) -> Result<Option<String>, Refusal> {
    match own_public_key(state_root) {
        Ok(public_key) => fingerprint(&public_key).map(Some),
        Err(refusal) if refusal.reason == "machine-key-missing" => Ok(None),
        Err(refusal) => Err(refusal),
    }
}

/// Mints this machine's key once and never replaces an existing one. Returns
/// whether this call created it, and the fingerprint now in force. The pair is
/// generated in a private scratch directory and installed atomically (the
/// private key is the name that decides who won a race); the public file is a
/// convenience copy, rewritten from the private key.
pub fn mint_key(state_root: &Path) -> Result<(bool, String), Refusal> {
    let dir = identity_dir(state_root);
    private_dir(&dir).map_err(|e| refuse("machine-key-write-failed", format!("{}: {e}", dir.display())))?;
    let write_failed = |e: fgos_durable_file::InstallError| refuse("machine-key-write-failed", e.to_string());
    let mut created = false;
    if !key_path(state_root).exists() {
        let scratch = Scratch::new(state_root)?;
        let key = scratch.0.join("key");
        let output = ssh_keygen(
            &["-q".as_ref(), "-t".as_ref(), "ed25519".as_ref(), "-N".as_ref(), "".as_ref(), "-C".as_ref(), "fgos-machine".as_ref(), "-f".as_ref(), key.as_os_str()],
            b"",
        )?;
        if !output.status.success() {
            return Err(failed("cannot generate the machine key", &output));
        }
        let private = fs::read(&key).map_err(|e| refuse("machine-key-write-failed", e.to_string()))?;
        created = fgos_durable_file::install_once_with_mode(&dir, KEY_FILE, &private, 0o600)
            .map_err(write_failed)?
            == fgos_durable_file::Installed::Created;
    }
    let public_key = own_public_key(state_root)?;
    if created || !dir.join(PUBLIC_KEY_FILE).is_file() {
        fgos_durable_file::replace_durably_with_mode(&dir, PUBLIC_KEY_FILE, format!("{public_key}\n").as_bytes(), 0o644)
            .map_err(write_failed)?;
    }
    Ok((created, fingerprint(&public_key)?))
}

/// Signs exactly `bytes` with this machine's key.
pub fn sign(state_root: &Path, bytes: &[u8]) -> Result<Signature, Refusal> {
    let public_key = own_public_key(state_root)?;
    let machine_id = machine::read(state_root).map_err(|e| match e {
        crate::Error::Missing(_) => refuse("machine-id-missing", "no machine id yet; run `fgos doctor --fix` to mint it"),
        e => refuse("machine-id-unreadable", e.to_string()),
    })?;
    let key = key_path(state_root);
    let output = ssh_keygen(&["-Y".as_ref(), "sign".as_ref(), "-f".as_ref(), key.as_os_str(), "-n".as_ref(), NAMESPACE.as_ref()], bytes)?;
    if !output.status.success() {
        return Err(failed("cannot sign", &output));
    }
    let sig = String::from_utf8(output.stdout).map_err(|_| refuse("ssh-keygen-failed", "ssh-keygen printed a signature that is not text"))?;
    check_armor(&sig)?;
    Ok(Signature { machine_id, public_key, sig })
}

/// Checks that `signature` holds for `bytes`, then that its key is the one
/// pinned for its machine (pinning it when the machine is unknown).
///
/// The signature is checked with `-Y verify` against an allowed-signers file
/// holding only `signature.public_key` for the fgOS namespace. That is the
/// check that binds the signature to exactly that key: `-Y check-novalidate`
/// only proves that the signature is well formed for whatever key it
/// embeds, and would leave the comparison with the claimed key to parsing its
/// output. The pin comes after the signature, so only a signature that holds
/// can pin a machine.
pub fn verify(state_root: &Path, bytes: &[u8], signature: &Signature) -> Result<Verified, Refusal> {
    check_public_key(&signature.public_key)?;
    check_armor(&signature.sig)?;
    if !machine::valid_machine_id(&signature.machine_id) {
        return Err(refuse("invalid-signature", "machineId is not a machine id"));
    }
    let fingerprint = fingerprint(&signature.public_key)?;
    if machine::read(state_root).is_ok_and(|own| own == signature.machine_id) {
        // A signature in this machine's name must come from this machine's key.
        let own = own_public_key(state_root)?;
        if own != signature.public_key {
            return Err(refuse(
                "machine-key-changed",
                format!(
                    "machine {} is this machine and its key is {}, not {fingerprint}",
                    signature.machine_id,
                    self::fingerprint(&own)?
                ),
            ));
        }
    }
    let scratch = Scratch::new(state_root)?;
    let sig_file = scratch.file("signature", signature.sig.as_bytes())?;
    let allowed = scratch.file("allowed-signers", format!("{PRINCIPAL} namespaces=\"{NAMESPACE}\" {}\n", signature.public_key).as_bytes())?;
    let output = ssh_keygen(
        &[
            "-Y".as_ref(), "verify".as_ref(), "-f".as_ref(), allowed.as_os_str(), "-I".as_ref(), PRINCIPAL.as_ref(),
            "-n".as_ref(), NAMESPACE.as_ref(), "-s".as_ref(), sig_file.as_os_str(),
        ],
        bytes,
    )?;
    if !output.status.success() {
        return Err(refuse("bad-signature", format!("the signature does not hold for these bytes under {}: {}", signature.public_key, text(&output.stderr))));
    }
    let pin = Pin::new(&signature.machine_id, &signature.public_key, &fingerprint, &iso_utc_now());
    let first_seen = match pins::record(state_root, &pin)? {
        Recorded::Created => true,
        Recorded::Same => false,
        Recorded::Different(pinned) => {
            return Err(refuse(
                "machine-key-changed",
                format!(
                    "machine {} is pinned to {} but this signature is by {fingerprint}; if the machine was re-keyed on purpose, run `fgos identity pins --forget {}`",
                    signature.machine_id, pinned.fingerprint, signature.machine_id
                ),
            ))
        }
    };
    Ok(Verified { machine_id: signature.machine_id.clone(), fingerprint, first_seen })
}
