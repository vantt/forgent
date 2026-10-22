//! The machine id: minted once per machine under the state root, read by
//! every owner through this module, and the human handle derived from it.
//!
//! Files under the state root: `machine-id` (`<slug>-<6 chars>`) and the
//! optional `machine-alias` (a handle the owner chose).

use crate::errors::Error;
use crate::text::{random_hex128, slug};
use std::fs;
use std::path::Path;

pub const ID_FILE: &str = "machine-id";
pub const ALIAS_FILE: &str = "machine-alias";
/// Longest machine handle, in characters.
pub const MAX_HANDLE_LENGTH: usize = 40;
const SUFFIX_LENGTH: usize = 6;
const MAX_SLUG_LENGTH: usize = 56;

/// 2-63 characters of `[a-z0-9-]`, the first alphanumeric. The one check of
/// this rule.
pub fn valid_machine_id(value: &str) -> bool {
    (2..=63).contains(&value.len())
        && value.as_bytes()[0].is_ascii_alphanumeric()
        && value
            .bytes()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == b'-')
}

/// The machine id minted under `state_root`.
pub fn read(state_root: &Path) -> Result<String, Error> {
    let raw = fs::read_to_string(state_root.join(ID_FILE)).map_err(|e| {
        if e.kind() == std::io::ErrorKind::NotFound {
            Error::Missing(format!("machine id missing: {e}"))
        } else {
            Error::Io(e)
        }
    })?;
    let value = raw.trim_end_matches(['\r', '\n']);
    if !valid_machine_id(value) {
        return Err(Error::Invalid("invalid machine id; run setup fix".into()));
    }
    Ok(value.to_owned())
}

/// Atomic mint: `<slug of hostname>-<6 base32 chars>`. Returns whether this
/// call created the file, and the id now in force. Readers never observe a
/// partial id, and an existing id is never replaced.
pub fn mint(state_root: &Path, hostname: &str) -> Result<(bool, String), Error> {
    let mut host = slug(hostname);
    if host.is_empty() {
        return Err(Error::Invalid("hostname has no slug characters".into()));
    }
    host.truncate(MAX_SLUG_LENGTH);
    let host = host.trim_end_matches('-');
    let random = random_hex128()?;
    let mut suffix = String::new();
    for offset in (0..SUFFIX_LENGTH * 2).step_by(2) {
        let byte = u8::from_str_radix(&random[offset..offset + 2], 16)
            .map_err(|e| Error::Invalid(e.to_string()))?;
        suffix.push(b"abcdefghijklmnopqrstuvwxyz234567"[(byte & 31) as usize] as char);
    }
    let value = format!("{host}-{suffix}\n");
    let result =
        fgos_durable_file::install_once_with_mode(state_root, ID_FILE, value.as_bytes(), 0o600)
            .map_err(Error::Install)?;
    let meta = fs::symlink_metadata(state_root.join(ID_FILE))?;
    if !meta.is_file() || meta.file_type().is_symlink() {
        return Err(Error::Invalid("existing identity is invalid".into()));
    }
    let id = read(state_root)
        .map_err(|e| Error::Invalid(format!("existing identity is invalid: {e}")))?;
    Ok((result == fgos_durable_file::Installed::Created, id))
}

/// The alias the owner chose, if any. The shape is checked by the caller
/// against the Convention `machine-handle` rule.
pub fn read_alias(state_root: &Path) -> Result<Option<String>, Error> {
    match fs::read_to_string(state_root.join(ALIAS_FILE)) {
        Ok(raw) => Ok(Some(raw.trim().to_owned()).filter(|alias| !alias.is_empty())),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(Error::Io(e)),
    }
}

/// Replace the alias atomically. The caller has checked the shape.
pub fn write_alias(state_root: &Path, alias: &str) -> Result<(), Error> {
    fgos_durable_file::replace_durably_with_mode(
        state_root,
        ALIAS_FILE,
        format!("{alias}\n").as_bytes(),
        0o600,
    )
    .map(|_| ())
    .map_err(Error::Install)
}

/// The machine handle: the alias when there is one, else the id without its
/// last `-<6>` suffix, with an `m-` prefix when it starts with a digit, cut
/// to [`MAX_HANDLE_LENGTH`].
pub fn handle(id: &str, alias: Option<&str>) -> String {
    if let Some(alias) = alias {
        return alias.to_owned();
    }
    let body = match id.rsplit_once('-') {
        Some((head, tail)) if tail.len() == SUFFIX_LENGTH && !head.is_empty() => head,
        _ => id,
    };
    let mut handle = if body.starts_with(|c: char| c.is_ascii_digit()) {
        format!("m-{body}")
    } else {
        body.to_owned()
    };
    handle.truncate(MAX_HANDLE_LENGTH);
    handle.truncate(handle.trim_end_matches('-').len());
    handle
}
