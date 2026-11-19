//! Where per-attempt control sockets live: owner-only, outside any run directory, short enough that
//! `<dir>/<attempt hash>.sock` fits a unix socket path. Port of `runtime-dir.mjs`.

use std::collections::BTreeSet;
use std::fmt;
use std::fs;
use std::path::{Path, PathBuf};

/// sockaddr_un.sun_path holds 108 bytes on Linux (104 on macOS) including the NUL.
pub const SOCKET_PATH_MAX_BYTES: usize = 100;

/// Name length of a hashed attempt socket: 16 hex chars plus `.sock`.
pub const SOCKET_NAME_BYTES: usize = 21;

const PROC_NET_UNIX: &str = "/proc/net/unix";

/// A runtime directory the controller refuses; `code` is the Node `RuntimeDirError` code.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RuntimeDirError {
    pub code: &'static str,
    pub message: String,
}

impl fmt::Display for RuntimeDirError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for RuntimeDirError {}

fn refuse(code: &'static str, message: String) -> RuntimeDirError {
    RuntimeDirError { code, message }
}

/// How a lookup reads the environment: the process environment in production, a map in a test.
pub type EnvLookup<'a> = &'a dyn Fn(&str) -> Option<String>;

/// The process environment as an `EnvLookup`.
pub fn process_env(name: &str) -> Option<String> {
    std::env::var(name).ok()
}

/// The uid of this process; 0 where there is none (Windows), like Node's `process.getuid?.() ?? 0`.
pub fn current_uid() -> u32 {
    #[cfg(unix)]
    {
        // SAFETY: getuid has no arguments and cannot fail.
        unsafe { libc::getuid() }
    }
    #[cfg(not(unix))]
    {
        0
    }
}

/// The one reader of the user runtime directory: `$XDG_RUNTIME_DIR` when it is an absolute path, else None.
pub fn user_runtime_dir(env: EnvLookup) -> Option<PathBuf> {
    env("XDG_RUNTIME_DIR")
        .filter(|xdg| Path::new(xdg).is_absolute())
        .map(PathBuf::from)
}

/// `$XDG_RUNTIME_DIR/fgos`, else `/tmp/fgos-<uid>`; pure path resolution (`ensure_runtime_socket_dir` creates and checks it).
pub fn resolve_runtime_socket_dir(env: EnvLookup, uid: u32) -> PathBuf {
    match user_runtime_dir(env) {
        Some(xdg) => xdg.join("fgos"),
        None => Path::new("/tmp").join(format!("fgos-{uid}")),
    }
}

/// Creates the directory 0700 when missing and refuses one that is not a real directory owned by the user
/// with no group/other access, or whose socket paths would not fit `sun_path`.
pub fn ensure_runtime_socket_dir(env: EnvLookup, uid: u32) -> Result<PathBuf, RuntimeDirError> {
    let dir = resolve_runtime_socket_dir(env, uid);
    if dir.as_os_str().len() + 1 + SOCKET_NAME_BYTES > SOCKET_PATH_MAX_BYTES {
        return Err(refuse(
            "runtime-dir-too-long",
            format!(
                "{} leaves no room for a socket name within {SOCKET_PATH_MAX_BYTES} bytes",
                dir.display()
            ),
        ));
    }
    create_private(&dir).map_err(|e| {
        refuse(
            "runtime-dir-not-directory",
            format!("{}: {e}", dir.display()),
        )
    })?;
    let meta = fs::symlink_metadata(&dir).map_err(|e| {
        refuse(
            "runtime-dir-not-directory",
            format!("{}: {e}", dir.display()),
        )
    })?;
    if !meta.is_dir() {
        return Err(refuse(
            "runtime-dir-not-directory",
            format!("{} is not a directory", dir.display()),
        ));
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        if meta.uid() != uid {
            return Err(refuse(
                "runtime-dir-wrong-owner",
                format!(
                    "{} is owned by uid {}, not {uid}",
                    dir.display(),
                    meta.uid()
                ),
            ));
        }
        if meta.mode() & 0o077 != 0 {
            return Err(refuse(
                "runtime-dir-permissions",
                format!(
                    "{} mode {:o} allows group or other access",
                    dir.display(),
                    meta.mode() & 0o777
                ),
            ));
        }
    }
    Ok(dir)
}

fn create_private(dir: &Path) -> std::io::Result<()> {
    let mut builder = fs::DirBuilder::new();
    builder.recursive(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::DirBuilderExt;
        builder.mode(0o700);
    }
    builder.create(dir)
}

fn is_attempt_socket_name(name: &str) -> bool {
    name.len() == SOCKET_NAME_BYTES
        && name.ends_with(".sock")
        && name[..16]
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

/// Paths some process has bound a unix socket to, read from the kernel table (Linux). None where the table
/// does not exist: nothing can then be judged, and nothing is removed. Probing by connecting is not an
/// option: a live supervisor takes the first connection for its gate.
fn bound_socket_paths(proc_file: &Path) -> Option<BTreeSet<String>> {
    let text = fs::read_to_string(proc_file).ok()?;
    let mut bound = BTreeSet::new();
    for line in text.split('\n').skip(1) {
        let fields: Vec<&str> = line.split_whitespace().collect();
        if fields.len() >= 8 {
            bound.insert(fields[7..].join(" "));
        }
    }
    Some(bound)
}

/// Unlinks the attempt sockets (`<hash>.sock`) in the runtime directory that no process holds any more: the
/// supervisor that listened on one was killed before it could remove the path. Only socket files of this user,
/// never another file or a directory; a missing directory or kernel table removes nothing. Returns the paths removed.
pub fn remove_orphan_attempt_sockets(
    env: EnvLookup,
    uid: Option<u32>,
    proc_file: Option<&Path>,
) -> Vec<PathBuf> {
    let Some(uid) = uid else { return Vec::new() };
    let dir = resolve_runtime_socket_dir(env, uid);
    // The directory is listed before the table is read: a socket bound in between is then not in the
    // listing at all, instead of being listed while missing from an older table.
    let Ok(entries) = fs::read_dir(&dir) else {
        return Vec::new();
    };
    let mut names: Vec<String> = entries
        .filter_map(|e| e.ok()?.file_name().into_string().ok())
        .filter(|n| is_attempt_socket_name(n))
        .collect();
    let Some(bound) = bound_socket_paths(proc_file.unwrap_or(Path::new(PROC_NET_UNIX))) else {
        return Vec::new();
    };
    names.sort();
    let mut removed = Vec::new();
    for name in names {
        let file = dir.join(&name);
        let Ok(meta) = fs::symlink_metadata(&file) else {
            continue;
        };
        #[cfg(unix)]
        let orphan = {
            use std::os::unix::fs::{FileTypeExt, MetadataExt};
            meta.file_type().is_socket()
                && meta.uid() == uid
                && !bound.contains(file.to_string_lossy().as_ref())
        };
        #[cfg(not(unix))]
        let orphan = {
            let _ = (&meta, &bound);
            false
        };
        if !orphan {
            continue;
        }
        if fs::remove_file(&file).is_ok() {
            removed.push(file);
        }
    }
    removed
}
