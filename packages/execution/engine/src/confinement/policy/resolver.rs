//! Resolves the grants of a confinement policy into the host resources a driver binds or masks, in the order a
//! driver applies them (a bind over a directory hides every mount made in it before). Every path is canonically
//! resolved; a symlink that leaves its declared root refuses the grant by name and is never clamped.

use std::collections::BTreeMap;
use std::fs;
use std::io;

use serde::Serialize;
use serde_json::Value;

use super::error::ConfinementResourceError;
use super::paths::{
    basename, dirname, exists, is_inside_root, join, lstat_if_present, real_or_null, resolve,
};
use super::roots::{
    canonicalize_and_verify_subpath, confinement_temp_root_for, create_blind_roots_when_missing,
    ensure_session_socket_dir, make_dir, resolve_blind_hidden_roots, resolve_machine_private_roots,
    MachineRootsInput, SESSION_SOCKET_DIR,
};
use super::workspace_paths::{
    validate_workspace_paths, MAILBOX_RECORD_RESOURCE, PEER_SESSIONS_RESOURCE,
};

type Resolved<T> = Result<T, ConfinementResourceError>;

/// Where a resource is delivered from: always the host here.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ExecutionTarget {
    pub location: &'static str,
    pub path: String,
}

/// One resolved resource: what to bind or mask, where, and how.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedResource {
    pub resource: String,
    pub identity: String,
    pub host_target: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temp_root: Option<String>,
    pub execution_target: ExecutionTarget,
    pub delivery: &'static str,
    pub collect: &'static str,
    pub access: String,
    pub allocation: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub env: Option<BTreeMap<String, String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub machine_private: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confinement_root: Option<bool>,
}

/// One grant of the effective policy.
#[derive(Debug, Clone, Default)]
pub struct Grant {
    pub resource: String,
    pub access: String,
    /// `run-output` only: which subdirectory of the run directory the worker writes.
    pub subpath: Option<String>,
    /// `workspace-paths` only: the named paths of the project root.
    pub paths: Option<Value>,
}

/// What the launch knows about where it runs.
#[derive(Debug, Clone, Default)]
pub struct ResolveContext {
    pub run_dir: Option<String>,
    pub fgos_dir: Option<String>,
    pub repo_root: Option<String>,
    pub cwd: Option<String>,
    pub adapter: Option<String>,
    pub assignment_launch_context: bool,
    pub launch_command: Option<String>,
    pub launch_path: Option<String>,
}

/// Everything a resolution reads: the grants, the launch context and every machine fact, passed in.
#[derive(Debug, Clone, Default)]
pub struct ResolveInput {
    pub dispatch_id: String,
    pub context: ResolveContext,
    pub grants: Vec<Grant>,
    pub private_home_root: Option<String>,
    pub temp_root: Option<String>,
    /// The confinement temp root when the backend names none.
    pub default_temp_root: String,
    pub credentials_path: Option<String>,
    pub credentials_dir: Option<String>,
    /// `<global fgOS dir>/credentials`, where credentials sit when the provider names no path.
    pub default_credentials_dir: String,
    pub blind: bool,
    pub home_dir: String,
    pub claude_socket_base: String,
    pub xdg_runtime_dir: Option<String>,
    pub xdg_config_home: Option<String>,
    pub herdr_socket_path: Option<String>,
    pub login_stores: Vec<String>,
    pub confinement_roots: Vec<String>,
    /// The holder-lock registry's path of the `mailbox` lock for this project's `.fgos`.
    pub mailbox_lock_path: String,
    pub uid: Option<u32>,
}

fn root_of(context: &ResolveContext) -> Option<&str> {
    [context.repo_root.as_deref(), context.cwd.as_deref()]
        .into_iter()
        .flatten()
        .find(|r| !r.is_empty())
}

fn host(path: &str) -> ExecutionTarget {
    ExecutionTarget {
        location: "host",
        path: path.to_string(),
    }
}

/// A resource that is an existing host path, mounted as is.
fn mount(
    resource: &str,
    identity: String,
    host_target: &str,
    collect: &'static str,
    access: &str,
) -> ResolvedResource {
    ResolvedResource {
        resource: resource.to_string(),
        identity,
        host_target: Some(host_target.to_string()),
        temp_root: None,
        execution_target: host(host_target),
        delivery: "mount",
        collect,
        access: access.to_string(),
        allocation: "existing",
        env: None,
        machine_private: None,
        confinement_root: None,
    }
}

fn hidden(root: &str, machine_private: bool, confinement_root: bool) -> ResolvedResource {
    ResolvedResource {
        resource: "hidden-root".to_string(),
        identity: format!("hidden-root:{root}"),
        host_target: Some(root.to_string()),
        temp_root: None,
        execution_target: host(root),
        delivery: "mask",
        collect: "none",
        access: "hidden".to_string(),
        allocation: "existing",
        env: None,
        machine_private: machine_private.then_some(true),
        confinement_root: confinement_root.then_some(true),
    }
}

/// `rel` under `root` as one real path: `root` is resolved once, and every component below it that exists must be
/// what it names, never a symbolic link, so a link at the target or at any directory between them cannot redirect a
/// grant elsewhere (`runtime/mailbox -> ..` would grant all of `.fgos`, `docs -> .` the whole project).
fn unredirected_path(root: &str, rel: &str, label: &str) -> Resolved<(String, String)> {
    let real_root = fs::canonicalize(root)
        .map(|p| p.to_string_lossy().into_owned())
        .map_err(|err| io_error(label, &err))?;
    let mut at = real_root.clone();
    for part in rel.split(['/', '\\']).filter(|p| !p.is_empty()) {
        at = join(&at, part);
        let seen = lstat_if_present(&at).map_err(|err| io_error(label, &err))?;
        if seen.is_some_and(|m| m.file_type().is_symlink()) {
            let shown = at
                .strip_prefix(&format!("{real_root}/"))
                .unwrap_or(&at)
                .to_string();
            return Err(ConfinementResourceError::invalid(format!(
                "{label}: \"{shown}\" under {real_root} is a symbolic link; a grant names real paths only."
            )));
        }
    }
    Ok((real_root, at))
}

fn io_error(label: &str, err: &io::Error) -> ConfinementResourceError {
    ConfinementResourceError::invalid(format!("{label}: {err}"))
}

/// Makes the directory `rel` of `real_root` one component at a time, refusing a link or a non-directory on the way.
fn ensure_real_dir(
    real_root: &str,
    rel: &str,
    mode: u32,
    label: &str,
) -> Result<String, ConfinementResourceError> {
    let mut at = real_root.to_string();
    for part in rel.split('/') {
        at = join(&at, part);
        match make_dir(&at, mode, false) {
            Ok(()) => {}
            Err(err) if err.kind() == io::ErrorKind::AlreadyExists => {}
            Err(err) => return Err(unavailable_io(real_root, &err)),
        }
        let seen = fs::symlink_metadata(&at).map_err(|err| unavailable_io(real_root, &err))?;
        if seen.file_type().is_symlink() || !seen.is_dir() {
            return Err(ConfinementResourceError::invalid(format!(
                "{label}: {at} is not a real directory; a grant names real paths only."
            )));
        }
    }
    Ok(at)
}

fn unavailable_io(fgos_dir: &str, err: &io::Error) -> ConfinementResourceError {
    ConfinementResourceError::new(
        "mailbox-record-unavailable",
        format!("the mailbox record under {fgos_dir} cannot be prepared: {err}"),
    )
}

/// Opens the lock file in place (created when missing, never replaced) and closes it, refusing a link at the path.
fn touch_lock_file(lock: &str) -> io::Result<()> {
    fs::OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .truncate(false)
        .open(lock)
        .map(drop)
}

/// What a mailbox-record grant binds, created when missing so the bind can be made: the lock file of the holder-lock
/// registry's `mailbox` row (an existing inode, opened and flocked in place) and the mailbox runtime directory,
/// where the record is written by temp file and rename. Exactly those two real paths of the real `.fgos`: a
/// symbolic link at either or at any directory between them refuses the grant, and nothing is created through one.
fn mailbox_record_paths(fgos_dir: &str, lock_path: &str) -> Resolved<[(&'static str, String); 2]> {
    let label = MAILBOX_RECORD_RESOURCE;
    let base = resolve(fgos_dir);
    let lock_rel = lock_path
        .strip_prefix(&format!("{base}/"))
        .unwrap_or(lock_path)
        .to_string();
    let dir_rel = "runtime/mailbox";
    let (real_root, lock) =
        unredirected_path(fgos_dir, &lock_rel, label).map_err(|e| to_unavailable(e, fgos_dir))?;
    unredirected_path(fgos_dir, dir_rel, label).map_err(|e| to_unavailable(e, fgos_dir))?;
    ensure_real_dir(&real_root, &dirname(&lock_rel), 0o755, label)?;
    // A link at the lock path was refused above; the open creates the file only when nothing is there.
    touch_lock_file(&lock).map_err(|err| unavailable_io(fgos_dir, &err))?;
    let meta = fs::symlink_metadata(&lock).map_err(|err| unavailable_io(fgos_dir, &err))?;
    if meta.file_type().is_symlink() {
        return Err(ConfinementResourceError::invalid(format!(
            "{label}: {lock} is a symbolic link; a grant names real paths only."
        )));
    }
    if !meta.is_file() {
        return Err(ConfinementResourceError::invalid(format!(
            "{label}: {lock} is not a regular file."
        )));
    }
    let dir = ensure_real_dir(&real_root, dir_rel, 0o700, label)?;
    Ok([("lock", lock), ("record", dir)])
}

/// A failure that is not already a named refusal is "unavailable": the `.fgos` cannot take the record.
fn to_unavailable(err: ConfinementResourceError, fgos_dir: &str) -> ConfinementResourceError {
    if err.code == "confinement-grant-invalid" && err.message.contains("a symbolic link") {
        return err;
    }
    ConfinementResourceError::new(
        "mailbox-record-unavailable",
        format!(
            "the mailbox record under {fgos_dir} cannot be prepared: {}",
            err.message
        ),
    )
}

/// The git directory of the checkout rooted at `workspace_root` (a linked worktree's own git directory, not the
/// shared one), or `None` when `workspace_root` is not itself a checkout root. A `.git` directory is the git
/// directory; a `.git` file names it (`gitdir: <path>`, relative to the checkout).
pub fn resolve_workspace_git_metadata(workspace_root: &str) -> Resolved<Option<String>> {
    let dot_git = join(workspace_root, ".git");
    let Some(meta) = lstat_if_present(&dot_git).map_err(|e| git_unreadable(workspace_root, &e))?
    else {
        return Ok(None);
    };
    let git_dir = if meta.is_dir() {
        dot_git
    } else {
        let text = fs::read_to_string(&dot_git).map_err(|e| git_unreadable(workspace_root, &e))?;
        let Some(named) = text
            .lines()
            .find_map(|line| line.strip_prefix("gitdir:"))
            .map(str::trim)
        else {
            return Ok(None);
        };
        if named.starts_with('/') {
            named.to_string()
        } else {
            join(workspace_root, named)
        }
    };
    real_or_null(&git_dir).map(Some).ok_or_else(|| {
        ConfinementResourceError::invalid(format!("git metadata of workspace \"{workspace_root}\" is unreadable: {git_dir} does not exist."))
    })
}

fn git_unreadable(workspace_root: &str, err: &io::Error) -> ConfinementResourceError {
    ConfinementResourceError::invalid(format!(
        "git metadata of workspace \"{workspace_root}\" is unreadable: {err}"
    ))
}

/// The directory that belongs to this dispatch alone under the hidden roots: its assignment round directory
/// (`<assignments>/<unit run>/<role>/<round>`, the parent of `runs/<attempt>`), or the run directory itself when the
/// dispatch has no assignment.
fn own_dispatch_dir(run_dir: &str) -> String {
    let run = resolve(run_dir);
    if basename(&dirname(&run)) == "runs" {
        dirname(&dirname(&run))
    } else {
        run
    }
}

fn real_dir(path: &str) -> Option<String> {
    real_or_null(path).filter(|real| fs::metadata(real).map(|m| m.is_dir()).unwrap_or(false))
}

/// The directories a peer-sessions grant binds, read-write: the host's session socket directory at its own path, and
/// the host's session registry (`{home}/.claude/sessions`) where the head's Claude Code reads it, under its config
/// directory: the private home when the launch has one, else the host's own. A directory that does not exist is not
/// bound (no session ever ran there, so there is nobody to reach); a symbolic link is followed to the real directory.
fn peer_session_resources(
    input: &ResolveInput,
    private_home: Option<&str>,
    access: &str,
) -> Vec<ResolvedResource> {
    let base = resolve(&input.claude_socket_base);
    ensure_session_socket_dir(&base, input.uid);
    let sockets = real_dir(&join(&base, SESSION_SOCKET_DIR));
    let registry = real_dir(&join(
        &join(&resolve(&input.home_dir), ".claude"),
        "sessions",
    ));
    let runtime_is_base = input
        .xdg_runtime_dir
        .as_deref()
        .is_some_and(|x| x.starts_with('/') && resolve(x) == base);
    let base_env = if runtime_is_base {
        "XDG_RUNTIME_DIR"
    } else {
        "CLAUDE_CODE_TMPDIR"
    };
    let mut out = Vec::new();
    if let Some(sockets) = sockets {
        let target = join(&base, SESSION_SOCKET_DIR);
        let mut resource = mount(
            PEER_SESSIONS_RESOURCE,
            format!("{PEER_SESSIONS_RESOURCE}:sockets"),
            &sockets,
            "none",
            access,
        );
        resource.execution_target = host(&target);
        resource.env = Some(BTreeMap::from([(base_env.to_string(), base.clone())]));
        out.push(resource);
    }
    if let Some(registry) = registry {
        let target = private_home.map_or_else(|| registry.clone(), |home| join(home, "sessions"));
        let mut resource = mount(
            PEER_SESSIONS_RESOURCE,
            format!("{PEER_SESSIONS_RESOURCE}:registry"),
            &registry,
            "none",
            access,
        );
        resource.execution_target = host(&target);
        out.push(resource);
    }
    out
}

/// The install directories an agent CLI keeps inside its own login home, relative to that home; none holds a login
/// file. pi: `bin` and `install`; codex: `packages`.
const CLI_INSTALL_SUBTREES: [&str; 3] = ["bin", "install", "packages"];

/// The real path of the file `command` runs (looked up on `search_path` when it names no directory), or `None`.
fn launch_program(command: Option<&str>, search_path: Option<&str>) -> Option<String> {
    let command = command.filter(|c| !c.is_empty())?;
    let candidates: Vec<String> = if command.contains('/') {
        vec![resolve(command)]
    } else {
        search_path
            .unwrap_or("")
            .split(':')
            .filter(|d| !d.is_empty())
            .map(|dir| join(dir, command))
            .collect()
    };
    candidates
        .iter()
        .filter_map(|c| real_or_null(c))
        .find(|real| fs::metadata(real).map(|m| m.is_file()).unwrap_or(false))
}

/// What is bound back, read-only, after the masks so a program that resolves inside a masked root starts: the
/// install directories of that root that exist, else the program file alone. A directory whose real path is or
/// holds a masked root is never bound back.
fn launch_program_bind_backs(program: Option<&str>, masked: &[String]) -> Vec<String> {
    let Some(program) = program else {
        return Vec::new();
    };
    let Some(root) = masked.iter().find(|m| is_inside_root(program, m)) else {
        return Vec::new();
    };
    let exposes_masked = |real: &str| masked.iter().any(|m| is_inside_root(m, real));
    let subtrees: Vec<String> = CLI_INSTALL_SUBTREES
        .iter()
        .map(|name| join(root, name))
        .filter(|dir| real_dir(dir).is_some_and(|real| !exposes_masked(&real)))
        .collect();
    if subtrees.iter().any(|dir| is_inside_root(program, dir)) {
        subtrees
    } else {
        vec![program.to_string()]
    }
}

fn grant_of<'a>(grants: &'a [Grant], resource: &str) -> Option<&'a Grant> {
    grants.iter().rev().find(|g| g.resource == resource)
}

/// Resolves a dispatch's grants into host resources (run output, workspace, named workspace paths, the mailbox
/// record, git metadata, private home, credentials, peer sessions), then the machine-private masks, the launch
/// program's bind-backs, and — for a blind launch — the hidden roots and the dispatch's own directory.
pub fn resolve_confinement_resources(input: &ResolveInput) -> Resolved<Vec<ResolvedResource>> {
    if input.dispatch_id.is_empty() {
        return Err(ConfinementResourceError::invalid("dispatchId is required."));
    }
    let context = &input.context;
    let mut resolved: Vec<ResolvedResource> = Vec::new();
    let temp_root = confinement_temp_root_for(
        input.private_home_root.as_deref(),
        input.temp_root.as_deref(),
        &input.default_temp_root,
    );

    // 1. run-output (required for dispatch)
    if let Some(grant) = grant_of(&input.grants, "run-output") {
        let run_dir = context
            .run_dir
            .as_deref()
            .filter(|d| !d.is_empty())
            .ok_or_else(|| {
                ConfinementResourceError::invalid(
                    "run-output resource requires context.runDir to be specified.",
                )
            })?;
        let fgos_dir = context.fgos_dir.as_deref().filter(|d| !d.is_empty()).ok_or_else(|| {
            ConfinementResourceError::invalid("run-output resource requires context.fgosDir so its containment boundary can be verified.")
        })?;
        // The subdirectory that must be writable depends on which adapter runs in the sandbox: herdr-spawn's worker
        // writes a bare `outbox` under the run directory, cli-spawn's worker commits to `worker-output/outbox`.
        let subpath = grant.subpath.as_deref();
        let target = if context.adapter.as_deref() == Some("herdr-spawn") {
            let dir = join(run_dir, "outbox");
            let _ = fs::create_dir_all(&dir);
            dir
        } else if context.assignment_launch_context
            || subpath == Some("worker-output")
            || subpath == Some("worker-output/outbox")
        {
            let dir = join(&join(run_dir, "worker-output"), "outbox");
            let _ = fs::create_dir_all(&dir);
            dir
        } else {
            run_dir.to_string()
        };
        let canonical = canonicalize_and_verify_subpath(&target, fgos_dir, "run-output")?;
        resolved.push(mount(
            "run-output",
            format!("run-output:{}", input.dispatch_id),
            &canonical.host_target,
            "artifact",
            &grant.access,
        ));
    }

    // 2. workspace
    if let Some(grant) = grant_of(&input.grants, "workspace") {
        let declared = root_of(context).ok_or_else(|| {
            ConfinementResourceError::invalid(
                "workspace resource requires context.repoRoot or context.cwd.",
            )
        })?;
        let canonical = canonicalize_and_verify_subpath(declared, &dirname(declared), "workspace")?;
        if canonical.host_target != resolve(declared) {
            return Err(ConfinementResourceError::invalid(format!(
                "workspace root \"{declared}\" resolves through a symlink to \"{}\"; use its canonical path.",
                canonical.host_target
            )));
        }
        resolved.push(mount(
            "workspace",
            format!("workspace:{}", basename(&canonical.host_target)),
            &canonical.host_target,
            "workspace-change",
            &grant.access,
        ));
    }

    // 2b. workspace-paths: named paths of the project root; a granted directory is bound writable on its own, a
    // granted file stays read-only, and nothing else of the root is writable.
    if let Some(grant) = grant_of(&input.grants, "workspace-paths") {
        let root = root_of(context).ok_or_else(|| {
            ConfinementResourceError::invalid(
                "workspace-paths requires context.repoRoot or context.cwd.",
            )
        })?;
        validate_workspace_paths(grant.paths.as_ref(), "workspace-paths grant")
            .map_err(|err| ConfinementResourceError::invalid(err.0))?;
        let mut directories: Vec<(String, String)> = Vec::new();
        for rel in grant
            .paths
            .as_ref()
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .filter_map(Value::as_str)
        {
            let target = join(root, rel);
            let seen =
                lstat_if_present(&target).map_err(|err| io_error("workspace-paths", &err))?;
            let Some(seen) = seen else {
                return Err(ConfinementResourceError::new(
                    "workspace-path-missing",
                    format!(
                        "workspace-paths entry \"{rel}\" does not exist under {root}; create it before the session starts."
                    ),
                ));
            };
            if seen.file_type().is_symlink() {
                return Err(ConfinementResourceError::invalid(format!(
                    "workspace-paths entry \"{rel}\" is a symbolic link; name the real path."
                )));
            }
            let (_, real) = unredirected_path(root, rel, "workspace-paths")?;
            canonicalize_and_verify_subpath(&real, root, "workspace-paths")?;
            // A granted file gets no bind at all: the sandbox reads it live through the read-only project, and only
            // the head's supervisor writes it, so its directory and every sibling stay read-only whatever the host
            // replaces. A granted directory is bound writable.
            if seen.is_dir() {
                directories.push((rel.to_string(), real));
            }
        }
        for (rel, host_target) in directories {
            resolved.push(mount(
                "workspace-paths",
                format!("workspace-paths:{rel}"),
                &host_target,
                "none",
                &grant.access,
            ));
        }
    }

    // 2c. mailbox-record: the project's mailbox lock file and the mailbox runtime directory, writable, and nothing
    // else of `.fgos`.
    if let Some(grant) = grant_of(&input.grants, MAILBOX_RECORD_RESOURCE) {
        let fgos_dir = context
            .fgos_dir
            .as_deref()
            .filter(|d| !d.is_empty())
            .ok_or_else(|| {
                ConfinementResourceError::invalid(format!(
                    "{MAILBOX_RECORD_RESOURCE} requires context.fgosDir."
                ))
            })?;
        for (kind, host_target) in mailbox_record_paths(fgos_dir, &input.mailbox_lock_path)? {
            resolved.push(mount(
                MAILBOX_RECORD_RESOURCE,
                format!("{MAILBOX_RECORD_RESOURCE}:{kind}"),
                &host_target,
                "none",
                &grant.access,
            ));
        }
    }

    // 3. workspace-git-metadata
    if let Some(grant) = grant_of(&input.grants, "workspace-git-metadata") {
        let root = root_of(context).ok_or_else(|| {
            ConfinementResourceError::invalid(
                "workspace-git-metadata requires context.repoRoot or context.cwd.",
            )
        })?;
        if let Some(git_dir) = resolve_workspace_git_metadata(root)? {
            resolved.push(mount(
                "workspace-git-metadata",
                format!("workspace-git-metadata:{}", basename(&git_dir)),
                &git_dir,
                "none",
                &grant.access,
            ));
        }
    }

    // 4. private-home
    if let Some(grant) = grant_of(&input.grants, "private-home") {
        let allocated = join(&join(&temp_root, &input.dispatch_id), "home");
        // Validate before any mutation: a hostile dispatch id must never leave an escaped directory behind.
        let canonical = canonicalize_and_verify_subpath(&allocated, &temp_root, "private-home")?;
        let mut home = mount(
            "private-home",
            format!("private-home:{}", input.dispatch_id),
            &canonical.host_target,
            "none",
            &grant.access,
        );
        home.temp_root = Some(canonical.declared_root);
        home.allocation = "temporary";
        resolved.push(home);
    }

    // 5. executor-credentials
    if let Some(grant) = grant_of(&input.grants, "executor-credentials") {
        if grant.access != "read" {
            return Err(ConfinementResourceError::invalid(format!(
                "executor-credentials resource access must be strictly \"read\", got \"{}\".",
                grant.access
            )));
        }
        let credentials = [
            input.credentials_path.as_deref(),
            input.credentials_dir.as_deref(),
        ]
        .into_iter()
        .flatten()
        .find(|p| !p.is_empty())
        .unwrap_or(&input.default_credentials_dir);
        if exists(credentials) {
            let canonical = canonicalize_and_verify_subpath(
                credentials,
                &dirname(credentials),
                "executor-credentials",
            )?;
            resolved.push(mount(
                "executor-credentials",
                format!("executor-credentials:{}", basename(&canonical.host_target)),
                &canonical.host_target,
                "none",
                "read",
            ));
        }
    }

    // 5b. peer-sessions: the host's session sockets and session registry, read-write, after the private home they
    // may land in (a bind over a directory hides every mount made in it before).
    if let Some(grant) = grant_of(&input.grants, PEER_SESSIONS_RESOURCE) {
        if grant.access != "read-write" {
            return Err(ConfinementResourceError::invalid(format!(
                "{PEER_SESSIONS_RESOURCE} access must be strictly \"read-write\", got \"{}\".",
                grant.access
            )));
        }
        let private_home = resolved
            .iter()
            .find(|r| r.resource == "private-home")
            .map(|r| r.execution_target.path.clone());
        resolved.extend(peer_session_resources(
            input,
            private_home.as_deref(),
            "read-write",
        ));
    }

    // 6. machine-private roots: hidden from every dispatch, whatever its hostRead
    let machine_input = MachineRootsInput {
        home_dir: input.home_dir.clone(),
        claude_socket_base: input.claude_socket_base.clone(),
        xdg_runtime_dir: input.xdg_runtime_dir.clone(),
        xdg_config_home: input.xdg_config_home.clone(),
        herdr_socket_path: input.herdr_socket_path.clone(),
        login_stores: input.login_stores.clone(),
        confinement_roots: input.confinement_roots.clone(),
        uid: input.uid,
    };
    let machine_private = resolve_machine_private_roots(&machine_input)?;
    let real_confinement_roots: Vec<String> = input
        .confinement_roots
        .iter()
        .map(|root| real_or_null(root).unwrap_or_else(|| root.clone()))
        .collect();
    for root in &machine_private {
        resolved.push(hidden(root, true, real_confinement_roots.contains(root)));
    }
    let program = launch_program(
        context.launch_command.as_deref(),
        context.launch_path.as_deref(),
    );
    for target in launch_program_bind_backs(program.as_deref(), &machine_private) {
        let mut bound = mount(
            "launch-program",
            format!("launch-program:{target}"),
            &target,
            "none",
            "read",
        );
        bound.host_target = real_or_null(&target);
        resolved.push(bound);
    }

    // 7. hostRead: blind — hide the hidden roots, keep the dispatch's own directory
    if input.blind {
        let run_dir = context
            .run_dir
            .as_deref()
            .filter(|d| !d.is_empty())
            .ok_or_else(|| {
                ConfinementResourceError::invalid("hostRead: blind requires context.runDir.")
            })?;
        let fgos_dir = context.fgos_dir.as_deref().unwrap_or("");
        // The mask is fixed when the worker starts, so the mailbox record is created before it is resolved.
        if let Err(err) = create_blind_roots_when_missing(fgos_dir) {
            return Err(ConfinementResourceError::invalid(format!(
                "hostRead: blind cannot prepare its hidden roots: {err}"
            )));
        }
        let hidden_roots = resolve_blind_hidden_roots(fgos_dir, &temp_root)?;
        let own = canonicalize_and_verify_subpath(
            &own_dispatch_dir(run_dir),
            fgos_dir,
            "own-assignment",
        )?;
        if !exists(&own.host_target) {
            return Err(ConfinementResourceError::invalid(format!(
                "hostRead: blind needs the dispatch's own directory \"{}\" to exist before launch.",
                own.host_target
            )));
        }
        for root in &hidden_roots {
            if !machine_private.iter().any(|mp| is_inside_root(root, mp)) {
                resolved.push(hidden(root, false, false));
            }
        }
        resolved.push(mount(
            "own-assignment",
            format!("own-assignment:{}", basename(&own.host_target)),
            &own.host_target,
            "none",
            "read",
        ));
    }

    Ok(resolved)
}
