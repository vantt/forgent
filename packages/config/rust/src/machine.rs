//! Machine files (spec sections 3, 8, 9): the private directory, the gateway token file, the
//! accounts-only read and the mode findings of the four machine paths. File access reuses the
//! no-follow primitives of Durable File; this module owns the rules and never echoes a value.
use std::io;
use std::path::Path;

use fgos_yaml_doc::Profile;
use serde_json::{json, Map, Value};

use crate::files::{read_beneath, FileError, PRIVATE_FILE_MODE};
use crate::snapshot::{accounts_source, split_global, SnapshotError};
use crate::ConfigRefusal;

#[cfg(unix)]
use {
    crate::files::{check_mode, ModeFinding, PRIVATE_DIR_MODE},
    crate::locks::{scope_params, GLOBAL_CONFIG},
    fgos_durable_file::{ensure_dir_beneath, install_once_with_mode, open_beneath},
    fgos_durable_file::{open_dir_beneath, BeneathError, DirIdentity, Installed},
    fgos_holder_lock::{Acquire, LockScope, ScopeError, Wait},
};

/// The tokens' file below the global directory, and the longest line it may hold.
const TOKEN_FILE: &str = "private/gateway-token";
const TOKEN_MAX: usize = 512;

pub(crate) fn refused(code: &'static str, file: &str, why: Option<&str>) -> SnapshotError {
    let mut refusal = ConfigRefusal::new(code).in_file(file);
    refusal.detail_mut().keyword = why.map(str::to_string);
    refusal.into()
}

#[cfg(unix)]
pub(crate) fn beneath(error: BeneathError) -> SnapshotError {
    match error {
        BeneathError::Refused(_) => ConfigRefusal::new("config-path-symlink").into(),
        BeneathError::Io(error) => error.into(),
    }
}

/// The private directory `~/.fgos/private` (0700 when created; one that exists keeps its mode,
/// which `modes` reports). A symlinked `~/.fgos` or `private` is `config-path-symlink`.
#[cfg(unix)]
pub fn ensure_private_dir(global_dir: &Path) -> Result<DirIdentity, SnapshotError> {
    let (parent, dir) = split_global(global_dir)?;
    ensure_dir_beneath(parent, &dir.join("private"), PRIVATE_DIR_MODE)
        .and_then(|made| made.identity())
        .map_err(beneath)
}

/// Holds `global-config` until dropped; the lock is held or timed out as `config-write-conflict`.
#[cfg(unix)]
pub(crate) fn hold_global(
    lock_root: &Path,
    wait_ms: u64,
) -> Result<LockScope<'static>, SnapshotError> {
    let other = |e: &dyn ToString| io::Error::other(e.to_string());
    let mut scope = LockScope::seeded(Vec::new()).map_err(|e| other(&e))?;
    let params = scope_params(Path::new(""), lock_root);
    match scope.acquire(GLOBAL_CONFIG, &params, Wait::Ms(wait_ms)) {
        Ok(_) => Ok(scope),
        Err(ScopeError::Acquire(why))
            if matches!(*why, Acquire::Held { .. } | Acquire::Timeout { .. }) =>
        {
            Err(refused("config-write-conflict", "", Some("lock-held")))
        }
        Err(e) => Err(other(&e).into()),
    }
}

/// A token or other secret value carried in process: no `Display`, and `Debug` shows none of it.
pub struct Secret(String);

impl Secret {
    pub fn expose(&self) -> &str {
        &self.0
    }
}

impl std::fmt::Debug for Secret {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("Secret(<redacted>)")
    }
}

pub mod token {
    use super::*;

    /// The one line of a token file: printable ASCII without a space, 1 to 512 characters, one
    /// optional final newline.
    pub(crate) fn line(bytes: &[u8]) -> Option<&str> {
        let bytes = bytes.strip_suffix(b"\n").unwrap_or(bytes);
        let plain = bytes.iter().all(|b| (0x21..=0x7e).contains(b));
        let text = std::str::from_utf8(bytes).ok().filter(|_| plain)?;
        (1..=TOKEN_MAX).contains(&text.len()).then_some(text)
    }

    /// `Ok(None)` when no token file exists. A symlink or non-regular file, a mode wider than 0600
    /// or anything but one valid line is `config-token-invalid` with its reason, never the value.
    pub fn read(global_dir: &Path) -> Result<Option<Secret>, SnapshotError> {
        let (parent, dir) = split_global(global_dir)?;
        let invalid = |why| refused("config-token-invalid", TOKEN_FILE, Some(why));
        let file = match read_beneath(parent, &dir.join(TOKEN_FILE), TOKEN_MAX * 2) {
            Ok(Some(file)) => file,
            Ok(None) => return Ok(None),
            Err(FileError::Io(error)) => return Err(error.into()),
            Err(FileError::Refused(r)) if r.code == "config-parse" => return Err(invalid("shape")),
            Err(FileError::Refused(_)) => return Err(invalid("symlink")),
        };
        match line(&file.bytes) {
            _ if file.mode & !PRIVATE_FILE_MODE != 0 => Err(invalid("mode")),
            Some(text) => Ok(Some(Secret(text.to_string()))),
            None => Err(invalid("shape")),
        }
    }

    /// A new token: 32 bytes from the operating system as hex. No fallback to a weaker source.
    pub fn generate() -> Result<String, SnapshotError> {
        #[cfg(unix)]
        {
            use std::io::Read;
            let mut bytes = [0u8; 32];
            std::fs::File::open("/dev/urandom")?.read_exact(&mut bytes)?;
            Ok(bytes.iter().map(|b| format!("{b:02x}")).collect())
        }
        #[cfg(not(unix))]
        Err(ConfigRefusal::new("config-platform-unsupported").into())
    }

    /// Creates `private/gateway-token` (0600, `text` and a newline) only when it is missing, under
    /// the `global-config` lock; `AlreadyExists` means a token was there and is kept, never rotated.
    #[cfg(unix)]
    pub fn ensure(
        global_dir: &Path,
        lock_root: &Path,
        lock_wait_ms: u64,
        text: impl FnOnce() -> Result<String, SnapshotError>,
    ) -> Result<Installed, SnapshotError> {
        let held = ensure_private_dir(global_dir)?;
        let _lock = hold_global(lock_root, lock_wait_ms)?;
        if ensure_private_dir(global_dir)? != held {
            return Err(refused(
                "config-write-conflict",
                "",
                Some("directory-changed"),
            ));
        }
        let bytes = text()? + "\n";
        let dir = global_dir.join("private");
        install_once_with_mode(&dir, "gateway-token", bytes.as_bytes(), PRIVATE_FILE_MODE)
            .map_err(|e| io::Error::other(e.to_string()).into())
    }
}

pub mod accounts {
    use super::*;
    use crate::snapshot::{build, AccountsState, Context, SessionClass, SnapshotRequest};

    /// The account pools: `{runner: {llmAccounts, providers: {<name>: {accounts}}}}`, the plain
    /// data the account readers consume, and whether the file exists.
    pub struct AccountsView {
        pub present: bool,
        pub state: AccountsState,
        pub revision: Option<String>,
        pub value: Value,
    }

    /// Reads the accounts file alone: judged as an accounts source, merged over the standard and
    /// validated, so it needs no valid project or global file. A confined session gets
    /// `UnavailableConfined` and the file is not opened; a missing file is `present: false`.
    pub fn read(ctx: &Context, req: &SnapshotRequest) -> Result<AccountsView, SnapshotError> {
        let none = |state, revision| AccountsView {
            present: false,
            state,
            revision,
            value: Value::Null,
        };
        if req.class == SessionClass::Confined {
            return Ok(none(AccountsState::UnavailableConfined, None));
        }
        let src = accounts_source(&req.global_dir, Profile::StrictConfig.limits().input_bytes)?;
        if src.file.is_none() {
            return Ok(none(AccountsState::Present, None));
        }
        let snapshot = build(ctx, req, &[src])?;
        let runner = &snapshot.value["runner"];
        let mut out = Map::new();
        out.extend(
            runner
                .get("llmAccounts")
                .map(|l| ("llmAccounts".to_string(), l.clone())),
        );
        let pools = runner["providers"].as_object().into_iter().flatten();
        let providers = pools
            .filter_map(|(name, p)| Some((name.clone(), json!({"accounts": p.get("accounts")?}))));
        out.insert("providers".into(), Value::Object(providers.collect()));
        Ok(AccountsView {
            present: true,
            state: AccountsState::Present,
            revision: snapshot.revisions.get("accounts").cloned(),
            value: json!({"runner": out}),
        })
    }
}

/// Each of the four machine paths (spec section 9) that exists, opened without following a
/// symlink; one whose mode differs is a finding, and with `fix` its mode is set through the
/// descriptor it was opened by, never through the path.
#[cfg(unix)]
fn sweep(global_dir: &Path, fix: bool) -> Result<Vec<ModeFinding>, SnapshotError> {
    let (parent, dir) = split_global(global_dir)?;
    let mut out = Vec::new();
    let mut judge = |name: &str, want, have, set: &dyn Fn(u32) -> Result<(), BeneathError>| {
        let found = check_mode(name, have, want);
        found.map_or(Ok(()), |found| {
            out.push(found);
            if fix {
                set(want)
            } else {
                Ok(())
            }
        })
    };
    let files = [
        "config.yaml",
        "config.json",
        "private/accounts.yaml",
        TOKEN_FILE,
    ];
    for name in files {
        if let Some(file) = open_beneath(parent, &dir.join(name)).map_err(beneath)? {
            judge(
                name,
                PRIVATE_FILE_MODE,
                file.mode().map_err(beneath)?,
                &|m| file.set_mode(m),
            )
            .map_err(beneath)?;
        }
    }
    if let Some(private) = open_dir_beneath(parent, &dir.join("private")).map_err(beneath)? {
        judge(
            "private",
            PRIVATE_DIR_MODE,
            private.mode().map_err(beneath)?,
            &|m| private.set_mode(m),
        )
        .map_err(beneath)?;
    }
    Ok(out)
}

/// The machine paths whose mode is not the expected one (0600 files, 0700 `private`).
#[cfg(unix)]
pub fn modes(global_dir: &Path) -> Result<Vec<ModeFinding>, SnapshotError> {
    sweep(global_dir, false)
}

/// Sets the expected mode on exactly the paths [`modes`] reports and returns them.
#[cfg(unix)]
pub fn fix_modes(global_dir: &Path) -> Result<Vec<ModeFinding>, SnapshotError> {
    sweep(global_dir, true)
}
