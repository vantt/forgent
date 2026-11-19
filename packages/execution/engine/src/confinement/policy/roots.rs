//! The host directories a confined worker must not reach and the helpers that find them: the machine-private roots
//! hidden from every dispatch, the roots `hostRead: blind` hides, the user runtime directory and Claude Code's
//! session socket directory, and the containment check every grant passes.

use std::fs;
use std::io;

use super::error::ConfinementResourceError;
use super::paths::{
    basename, dirname, exists, is_absolute, is_dir, is_inside_root, join, real_or_null, resolve,
};

/// The directory Claude Code keeps one control socket per open session in (`<pid>.sock`).
pub const SESSION_SOCKET_DIR: &str = "cc-socks";

/// The roots `hostRead: blind` leaves the host readable except: the run state of other dispatches, the mailbox
/// record of the project's live agent sessions and the confinement temp root (sibling private homes). Only peer run
/// state and the mailbox record are listed, never all of `.fgos`: tracked files live there and would appear deleted
/// in the checkout status under a mask.
pub const BLIND_HIDDEN_ROOTS: [&str; 5] = [
    "{fgosDir}/assignments",
    "{fgosDir}/workflow-runs",
    "{fgosDir}/dispatch-runs",
    "{fgosDir}/runtime/mailbox",
    "{confinementTempRoot}",
];

/// Hidden roots a blind launch creates (mode 0700) when missing instead of skipping them: an independent session
/// creates the mailbox record at any time, and the mask is fixed when the worker starts.
const BLIND_ROOTS_CREATED_WHEN_MISSING: [&str; 1] = ["{fgosDir}/runtime/mailbox"];

/// Host directories that hold per-machine private files and are hidden from EVERY confined dispatch, whatever its
/// `hostRead`. `{home}` is the host user's home, not a dispatch's private home. A listed path is a directory.
/// - `{runtimeDir}`: the user runtime directory (systemd user manager, session bus, ssh-agent, gpg-agent, keyring,
///   audio, Claude Code's session sockets, the run supervisor's attempt sockets).
/// - `{claudeSocketBase}/cc-socks`: where Claude Code keeps one control socket per session.
/// - herdr's API sockets: `{home}/.config/herdr`, `{xdgConfigHome}/herdr`, and `{herdrSocketDir}`, the directory of
///   the caller's own socket, refused when it is the home, the config directory, `/tmp` or one of their ancestors.
/// - `{loginStore}`: every login directory of the machine; a worker gets a copy of the one login it was leased.
/// - `{confinementRoot}`: every root private homes live under; the dispatch's own home is bound back after the mask.
pub const MACHINE_PRIVATE_ROOTS: [&str; 8] = [
    "{home}/.fgos/private",
    "{runtimeDir}",
    "{claudeSocketBase}/cc-socks",
    "{home}/.config/herdr",
    "{xdgConfigHome}/herdr",
    "{herdrSocketDir}",
    "{loginStore}",
    "{confinementRoot}",
];

/// The user runtime directory when `$XDG_RUNTIME_DIR` is an absolute path (the one reader of that variable).
fn user_runtime_dir(xdg_runtime_dir: Option<&str>) -> Option<String> {
    xdg_runtime_dir
        .filter(|dir| is_absolute(dir))
        .map(str::to_string)
}

fn absolute_or_null(value: Option<&str>) -> Option<String> {
    value.filter(|v| is_absolute(v)).map(str::to_string)
}

/// The user runtime directory to mask: `$XDG_RUNTIME_DIR`, else the directory systemd-logind keeps for this user,
/// `<run_user_base>/<uid>`, when it is a real directory (not a link) of this user with mode 0700. A runner started
/// without the variable (cron, `su`, a scrubbed service environment) still runs beside the user's bus and agents.
pub fn runtime_dir_for_mask(
    xdg_runtime_dir: Option<&str>,
    uid: Option<u32>,
    run_user_base: &str,
) -> Option<String> {
    if let Some(dir) = user_runtime_dir(xdg_runtime_dir) {
        return Some(dir);
    }
    let uid = uid?;
    let dir = join(run_user_base, &uid.to_string());
    let meta = fs::symlink_metadata(&dir).ok()?;
    owner_only_dir_of(&meta, uid).then_some(dir)
}

#[cfg(unix)]
fn owner_only_dir_of(meta: &fs::Metadata, uid: u32) -> bool {
    use std::os::unix::fs::{MetadataExt, PermissionsExt};
    meta.is_dir() && meta.uid() == uid && meta.permissions().mode() & 0o777 == 0o700
}

#[cfg(not(unix))]
fn owner_only_dir_of(_meta: &fs::Metadata, _uid: u32) -> bool {
    false
}

/// The directory Claude Code creates its session socket directory in, in its own order: the user runtime directory,
/// else `$CLAUDE_CODE_TMPDIR`, else the temp directory (`TMPDIR`, `TMP`, `TEMP`, then `/tmp`). `env` reads one
/// variable.
pub fn resolve_claude_socket_base(env: &dyn Fn(&str) -> Option<String>) -> String {
    let get = |name: &str| env(name);
    user_runtime_dir(get("XDG_RUNTIME_DIR").as_deref())
        .or_else(|| absolute_or_null(get("CLAUDE_CODE_TMPDIR").as_deref()))
        .or_else(|| absolute_or_null(get("TMPDIR").as_deref()))
        .or_else(|| absolute_or_null(get("TMP").as_deref()))
        .or_else(|| absolute_or_null(get("TEMP").as_deref()))
        .unwrap_or_else(|| "/tmp".to_string())
}

/// Creates `<base>/cc-socks` owner-only when it is missing, so it exists, and is masked, before a worker starts: a
/// directory that appears on the host after launch would be visible to the worker. Skipped when the base is not a
/// real directory of this user; an existing entry is left exactly as it is, never chmod-ed or chown-ed.
pub fn ensure_session_socket_dir(base: &str, uid: Option<u32>) {
    let Some(uid) = uid else { return };
    let Ok(meta) = fs::symlink_metadata(base) else {
        return;
    };
    if !is_dir_owned_by(&meta, uid) {
        return;
    }
    // EEXIST leaves the entry as it is; any other error leaves nothing to mask.
    let _ = make_dir(&join(base, SESSION_SOCKET_DIR), 0o700, false);
}

#[cfg(unix)]
fn is_dir_owned_by(meta: &fs::Metadata, uid: u32) -> bool {
    use std::os::unix::fs::MetadataExt;
    meta.is_dir() && meta.uid() == uid
}

#[cfg(not(unix))]
fn is_dir_owned_by(_meta: &fs::Metadata, _uid: u32) -> bool {
    false
}

/// `mkdir` with a mode (ignored where the platform has none); `recursive` also makes every missing parent.
pub(super) fn make_dir(path: &str, mode: u32, recursive: bool) -> io::Result<()> {
    let mut builder = fs::DirBuilder::new();
    builder.recursive(recursive);
    #[cfg(unix)]
    {
        use std::os::unix::fs::DirBuilderExt;
        builder.mode(mode);
    }
    #[cfg(not(unix))]
    let _ = mode;
    builder.create(path)
}

/// Canonically resolves a target path and the root it must stay inside.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Canonical {
    pub host_target: String,
    pub declared_root: String,
}

/// Canonically resolves a path and verifies it stays inside the declared root. Refuses on a symlink escape; never
/// silently clamps. A target that does not exist yet is resolved through its closest existing ancestor.
pub fn canonicalize_and_verify_subpath(
    target_path: &str,
    declared_root: &str,
    resource_name: &str,
) -> Result<Canonical, ConfinementResourceError> {
    if target_path.trim().is_empty() {
        return Err(ConfinementResourceError::invalid(format!(
            "resource \"{resource_name}\" target path must be a non-empty string."
        )));
    }
    if declared_root.trim().is_empty() {
        return Err(ConfinementResourceError::invalid(format!(
            "resource \"{resource_name}\" declared root must be a non-empty string."
        )));
    }
    let abs_root = resolve(declared_root);
    let abs_target = resolve(target_path);

    let real_root = if exists(&abs_root) {
        fs::canonicalize(&abs_root)
            .map(|p| p.to_string_lossy().into_owned())
            .map_err(|err| {
                ConfinementResourceError::invalid(format!(
                    "failed to resolve canonical root for resource \"{resource_name}\": {err}"
                ))
            })?
    } else {
        abs_root
    };

    let real_target = if exists(&abs_target) {
        fs::canonicalize(&abs_target)
            .map(|p| p.to_string_lossy().into_owned())
            .map_err(|err| {
                ConfinementResourceError::invalid(format!(
                    "failed to resolve canonical target for resource \"{resource_name}\": {err}"
                ))
            })?
    } else {
        let mut ancestor = dirname(&abs_target);
        let mut tail = basename(&abs_target);
        while ancestor != dirname(&ancestor) && !exists(&ancestor) {
            tail = join(&basename(&ancestor), &tail);
            ancestor = dirname(&ancestor);
        }
        if exists(&ancestor) {
            let real_ancestor = fs::canonicalize(&ancestor)
                .map(|p| p.to_string_lossy().into_owned())
                .map_err(|err| {
                    ConfinementResourceError::invalid(format!(
                        "failed to resolve canonical target for resource \"{resource_name}\": {err}"
                    ))
                })?;
            join(&real_ancestor, &tail)
        } else {
            abs_target
        }
    };

    let inside = real_target == real_root || real_target.starts_with(&format!("{real_root}/"));
    if !inside {
        return Err(ConfinementResourceError::invalid(format!(
            "symlink escape or out-of-bounds path detected for resource \"{resource_name}\": resolved path \"{real_target}\" escapes declared root \"{real_root}\"."
        )));
    }
    Ok(Canonical {
        host_target: real_target,
        declared_root: real_root,
    })
}

/// A hidden-root template's one `{token}`, if it has one.
fn token_of(template: &str) -> Option<&str> {
    let start = template.find('{')?;
    let end = template[start..].find('}')? + start;
    let name = &template[start + 1..end];
    (!name.is_empty() && name.chars().all(|c| c.is_ascii_alphabetic()))
        .then(|| &template[start..=end])
}

/// What a template's token stands for.
pub(super) enum TokenValue {
    Absent,
    One(String),
    Many(Vec<String>),
}

/// The templates with their token filled in, real-pathed, kept when they are directories, without repeats. A token
/// may stand for several values; a template whose token has no value is skipped.
pub(super) fn existing_directories(
    templates: &[&str],
    tokens: &[(&str, TokenValue)],
) -> Vec<String> {
    let mut roots: Vec<String> = Vec::new();
    for template in templates {
        let token = token_of(template);
        let values: Vec<&str> = match token {
            None => vec![*template],
            Some(token) => match tokens.iter().find(|(name, _)| *name == token) {
                Some((_, TokenValue::One(value))) => vec![value.as_str()],
                Some((_, TokenValue::Many(values))) => values.iter().map(String::as_str).collect(),
                _ => Vec::new(),
            },
        };
        for value in values {
            let path = match token {
                Some(token) => template.replacen(token, value, 1),
                None => value.to_string(),
            };
            if let Some(real) = real_or_null(&path) {
                if is_dir(&real) && !roots.contains(&real) {
                    roots.push(real);
                }
            }
        }
    }
    roots
}

/// Where private homes of this machine's dispatches live: the backend's own root, else the default one.
pub(super) fn confinement_temp_root_for(
    private_home_root: Option<&str>,
    temp_root: Option<&str>,
    default_root: &str,
) -> String {
    [private_home_root, temp_root]
        .into_iter()
        .flatten()
        .find(|root| !root.is_empty())
        .unwrap_or(default_root)
        .to_string()
}

/// The absolute paths `hostRead: blind` hides for a dispatch (the hidden roots with their tokens filled in). A pure
/// lookup: a root that does not exist on this machine is skipped, as there is nothing to hide.
pub fn resolve_blind_hidden_roots(
    fgos_dir: &str,
    confinement_temp_root: &str,
) -> Result<Vec<String>, ConfinementResourceError> {
    if fgos_dir.trim().is_empty() {
        return Err(ConfinementResourceError::invalid(
            "hostRead: blind requires context.fgosDir to name the run state it hides.",
        ));
    }
    let tokens = [
        ("{fgosDir}", TokenValue::One(resolve(fgos_dir))),
        (
            "{confinementTempRoot}",
            TokenValue::One(confinement_temp_root.to_string()),
        ),
    ];
    Ok(existing_directories(&BLIND_HIDDEN_ROOTS, &tokens))
}

/// The blind launch's one write before its hidden roots are resolved: each root that must exist is created (mode
/// 0700) when missing. A no-op when the `.fgos` directory does not exist, and when it cannot take the directory
/// (read-only, foreign-owned, `runtime` a plain file): the root then stays missing and the resolver skips it.
pub fn create_blind_roots_when_missing(fgos_dir: &str) -> io::Result<()> {
    if fgos_dir.trim().is_empty() {
        return Ok(());
    }
    let base = resolve(fgos_dir);
    if !exists(&base) {
        return Ok(());
    }
    for template in BLIND_ROOTS_CREATED_WHEN_MISSING {
        let root = template.replacen("{fgosDir}", &base, 1);
        if let Err(err) = make_dir(&root, 0o700, true) {
            // EACCES, EPERM, EROFS, ENOTDIR leave the root missing; anything else is a real fault.
            if !matches!(err.raw_os_error(), Some(13 | 1 | 30 | 20)) {
                return Err(err);
            }
        }
    }
    Ok(())
}

/// The facts the machine-private roots are resolved from.
#[derive(Debug, Clone, Default)]
pub struct MachineRootsInput {
    pub home_dir: String,
    pub claude_socket_base: String,
    pub xdg_runtime_dir: Option<String>,
    pub xdg_config_home: Option<String>,
    pub herdr_socket_path: Option<String>,
    /// Every login directory of the machine (the account inventory's answer).
    pub login_stores: Vec<String>,
    /// Every root private homes live under.
    pub confinement_roots: Vec<String>,
    /// The uid that must own the session socket base for it to be prepared; `None` prepares nothing.
    pub uid: Option<u32>,
}

/// The login stores that exist, real-pathed; one that is relative or a file (`login-store-not-a-directory`), or the
/// home or a parent of it (`login-store-is-home`), is refused by name, never skipped.
fn login_store_roots(
    stores: &[String],
    home: &str,
) -> Result<Vec<String>, ConfinementResourceError> {
    let real_home = real_or_null(home).unwrap_or_else(|| home.to_string());
    let mut roots = Vec::new();
    for store in stores {
        if !is_absolute(store) {
            return Err(ConfinementResourceError::new(
                "login-store-not-a-directory",
                format!("the login store \"{store}\" is not an absolute directory."),
            ));
        }
        let Some(real) = real_or_null(store) else {
            continue;
        };
        if is_inside_root(&real_home, &real) {
            return Err(ConfinementResourceError::new(
                "login-store-is-home",
                format!(
                    "the login store \"{store}\" is the home \"{real_home}\" or holds it; masking it would hide the whole home."
                ),
            ));
        }
        if !is_dir(&real) {
            return Err(ConfinementResourceError::new(
                "login-store-not-a-directory",
                format!("the login store \"{store}\" is not a directory."),
            ));
        }
        roots.push(real);
    }
    Ok(roots)
}

/// The directory of the caller's own herdr socket, or `None` when it names none. A directory that is, or contains,
/// one of `broad` (the home, the config directory, `/tmp`) is refused by name: masking it would hide far more than
/// herdr, and a workspace under it could not run.
fn herdr_socket_dir_of(
    socket_path: Option<&str>,
    broad: &[Option<String>],
) -> Result<Option<String>, ConfinementResourceError> {
    let Some(socket_path) = socket_path.filter(|p| is_absolute(p)) else {
        return Ok(None);
    };
    let dir = dirname(&resolve(socket_path));
    let covered = broad
        .iter()
        .flatten()
        .find(|b| !b.is_empty() && is_inside_root(&resolve(b), &dir));
    if let Some(covered) = covered {
        return Err(ConfinementResourceError::new(
            "herdr-socket-dir-too-broad",
            format!(
                "$HERDR_SOCKET_PATH \"{socket_path}\" lies directly in \"{dir}\", which holds \"{covered}\"; masking it would hide far more than herdr's sockets."
            ),
        ));
    }
    Ok(Some(dir))
}

/// The absolute machine-private roots that exist on this host, outermost only: a root inside another listed root is
/// masked by that one. The session socket directory is created first when it is missing outside the runtime
/// directory; under it, the runtime directory's mask already hides whatever appears later. A root that does not
/// exist, or whose token has no value here, is skipped.
pub fn resolve_machine_private_roots(
    input: &MachineRootsInput,
) -> Result<Vec<String>, ConfinementResourceError> {
    let home = resolve(&input.home_dir);
    let base = resolve(&input.claude_socket_base);
    let runtime = absolute_or_null(input.xdg_runtime_dir.as_deref());
    let config_home = absolute_or_null(input.xdg_config_home.as_deref()).map(|c| resolve(&c));
    if runtime
        .as_ref()
        .is_none_or(|r| !is_inside_root(&base, &resolve(r)))
    {
        ensure_session_socket_dir(&base, input.uid);
    }
    let broad = [
        Some(home.clone()),
        Some(join(&home, ".config")),
        config_home.clone(),
        Some("/tmp".to_string()),
    ];
    let herdr_dir = herdr_socket_dir_of(input.herdr_socket_path.as_deref(), &broad)?;
    let stores = login_store_roots(&input.login_stores, &home)?;
    let one = |value: Option<String>| value.map_or(TokenValue::Absent, TokenValue::One);
    let tokens = [
        ("{home}", TokenValue::One(home)),
        ("{runtimeDir}", one(runtime)),
        ("{claudeSocketBase}", TokenValue::One(base)),
        ("{xdgConfigHome}", one(config_home)),
        ("{herdrSocketDir}", one(herdr_dir)),
        ("{loginStore}", TokenValue::Many(stores)),
        (
            "{confinementRoot}",
            TokenValue::Many(input.confinement_roots.clone()),
        ),
    ];
    let roots = existing_directories(&MACHINE_PRIVATE_ROOTS, &tokens);
    Ok(roots
        .iter()
        .filter(|root| {
            !roots
                .iter()
                .any(|other| other != *root && is_inside_root(root, other))
        })
        .cloned()
        .collect())
}
