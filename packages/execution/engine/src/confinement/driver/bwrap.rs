//! The local bubblewrap backend driver (`bwrap` type, version `local-bwrap-v1`).
//!
//! `assess` checks a request against the one support matrix this driver has: a control or grant it cannot enforce
//! refuses with a named mismatch, never best-effort acceptance. `prepare` builds the sandbox argv strictly from the
//! RESOLVED resources and never branches on the executor, the model or the agent type to decide a confinement
//! guarantee; the one narrow exception is provisioning a selected account's login files into a private home, which
//! grants nothing away and is not a confinement control. Inherited file descriptors are closed inside the sandbox.

use super::attestation::assert_store_isolated;
use super::contract::{Assessment, BackendDriver, Mismatch, Prepared};
use super::ports::{Credentials, EnvFn, PrivateHomeHost, ResourceResolver};
use super::{js, DriverError, ErrorKind};
use fgos_canonical_json::canonical_json;
use serde_json::{json, Map, Value};
use sha2::{Digest, Sha256};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::Duration;

pub const BWRAP_DRIVER_TYPE: &str = "bwrap";
pub const BWRAP_DRIVER_VERSION: &str = "local-bwrap-v1";
/// Set to `1` in every confined worker; the config session class reads it (`CONFINED_MARKER` in
/// `fgos-config`, pinned equal by a test). Information for the session, not a security boundary: the sandbox is the
/// boundary.
pub const CONFINED_MARKER_ENV: &str = "FGOS_CONFINED";
pub const DEFAULT_SEAT_TIMEOUT_MS: u64 = 900_000;
pub const MAILBOX_RECORD_RESOURCE: &str = "mailbox-record";
pub const PEER_SESSIONS_RESOURCE: &str = "peer-sessions";
const DEFAULT_EXECUTABLE: &str = "/usr/bin/bwrap";
const ALLOWED_CONFIG_KEYS: [&str; 5] = [
    "type",
    "enabled",
    "executable",
    "tempRoot",
    "privateHomeRoot",
];
const SUPPORTED_CONTROLS: [&str; 7] = [
    "hostWrite",
    "hostRead",
    "networkEgress",
    "process",
    "home",
    "session",
    "workspace",
];
/// Closes every inherited descriptor from 3 up before the command runs.
const FD_CLOSER_SCRIPT: &str = "for f in $(ls /proc/$$/fd 2>/dev/null); do if [ \"$f\" -ge 3 ] 2>/dev/null; then eval \"exec $f>&-\" 2>/dev/null || true; fi; done; exec \"$@\"";
/// Mounts bound back inside a machine-private root after its mask.
const BOUND_BACK: [&str; 5] = [
    "hidden-root",
    "own-assignment",
    "private-home",
    "launch-program",
    PEER_SESSIONS_RESOURCE,
];

fn refuse(message: impl Into<String>) -> DriverError {
    DriverError::new(ErrorKind::Bwrap, message)
}

fn credential_error(message: impl Into<String>) -> DriverError {
    DriverError::coded(ErrorKind::Bwrap, "credential-provisioning", message)
}

/// Validates a bwrap backend instance config (closed schema).
pub fn validate_bwrap_config(config: &Value, label: &str) -> Result<(), DriverError> {
    let Some(map) = config.as_object() else {
        return Err(refuse(format!("{label} must be an object.")));
    };
    if let Some(key) = map
        .keys()
        .find(|k| !ALLOWED_CONFIG_KEYS.contains(&k.as_str()))
    {
        return Err(refuse(format!(
            "{label} contains unknown config key \"{key}\". Allowed keys: {}.",
            ALLOWED_CONFIG_KEYS.join(", ")
        )));
    }
    if map.get("type").and_then(Value::as_str) != Some(BWRAP_DRIVER_TYPE) {
        return Err(refuse(format!(
            "{label} \"type\" must be \"{BWRAP_DRIVER_TYPE}\", got: {}.",
            js::json(map.get("type"))
        )));
    }
    if map.get("enabled").is_some_and(|e| !e.is_boolean()) {
        return Err(refuse(format!(
            "{label} \"enabled\" must be a boolean when present."
        )));
    }
    for key in ["executable", "tempRoot", "privateHomeRoot"] {
        if map
            .get(key)
            .is_some_and(|v| !v.as_str().is_some_and(|s| !s.trim().is_empty()))
        {
            return Err(refuse(format!(
                "{label} \"{key}\" must be a non-empty string when present."
            )));
        }
    }
    Ok(())
}

/// The one invocation override this driver accepts: `hostRead: blind` and nothing else.
fn is_blind_only_override(override_: Option<&Value>) -> bool {
    let Some(map) = override_.and_then(Value::as_object) else {
        return false;
    };
    if map.len() != 1 {
        return false;
    }
    let Some(controls) = map.get("controls").and_then(Value::as_object) else {
        return false;
    };
    controls.len() == 1 && controls.get("hostRead").and_then(Value::as_str) == Some("blind")
}

/// A request is blind when its override or its policy narrows reads to `blind`.
pub fn request_is_blind(request: &Value) -> bool {
    js::str_at(request, &["override", "controls", "hostRead"]) == Some("blind")
        || js::str_at(request, &["requirement", "policy", "controls", "hostRead"]) == Some("blind")
}

fn host_target(res: &Value) -> Option<&str> {
    js::str_at(res, &["hostTarget"]).filter(|t| !t.is_empty())
}

fn exec_path(res: &Value) -> Option<&str> {
    js::str_at(res, &["executionTarget", "path"]).filter(|t| !t.is_empty())
}

fn resource_name(res: &Value) -> &str {
    js::str_at(res, &["resource"]).unwrap_or("")
}

/// One refusal per candidate directory that lies inside a masked root: the mask would hide it from the worker
/// that was given it.
fn hidden_workspace_refusals(
    candidates: &[(String, Option<String>)],
    roots: &[String],
    code: &str,
    describe: impl Fn(&str, &str, &str) -> String,
) -> Vec<Mismatch> {
    candidates
        .iter()
        .filter_map(|(name, dir)| {
            let real = js::real_path_or_resolved(dir.as_deref().filter(|d| !d.is_empty())?);
            let root = roots
                .iter()
                .find(|hidden| js::is_inside_root(&real, hidden))?;
            Some(Mismatch::new(code, describe(name, &real, root)))
        })
        .collect()
}

fn hidden_root_targets(resources: &[Value], machine_private: bool) -> Vec<String> {
    resources
        .iter()
        .filter(|r| {
            resource_name(r) == "hidden-root"
                && js::truthy(r.get("machinePrivate")) == machine_private
        })
        .filter_map(|r| host_target(r).map(str::to_string))
        .collect()
}

/// Refusals specific to `hostRead: blind`: a workspace inside a hidden root would be masked from its own worker,
/// and a context ref into a hidden root outside the dispatch's own directory could never be read.
fn blind_refusals(request: &Value, resources: &[Value]) -> Vec<Mismatch> {
    let hidden = hidden_root_targets(resources, false);
    let own = resources
        .iter()
        .find(|r| resource_name(r) == "own-assignment")
        .and_then(host_target);
    let context = request.get("context").unwrap_or(&Value::Null);
    let cwd = js::str_at(context, &["cwd"]).map(str::to_string);
    let repo_root = js::str_at(context, &["repoRoot"]).map(str::to_string);
    let mut out = hidden_workspace_refusals(
        &[
            ("cwd".into(), cwd.clone()),
            ("repoRoot".into(), repo_root.clone()),
        ],
        &hidden,
        "blind-hides-workspace",
        |name, real, root| {
            format!("hostRead: blind would hide the {name} \"{real}\" from its own worker: it lies inside the hidden root \"{root}\".")
        },
    );
    let base = cwd
        .filter(|c| !c.is_empty())
        .or_else(|| repo_root.filter(|r| !r.is_empty()))
        .unwrap_or_else(|| js::resolve_cwd("."));
    for reference in js::at(context, &["contextRefs"])
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
    {
        let Some(reference) = reference
            .as_str()
            .filter(|r| !r.is_empty() && !has_scheme(r))
        else {
            continue;
        };
        let real = js::real_path_or_resolved(&js::resolve(Path::new(&base), reference));
        let Some(root) = hidden.iter().find(|h| js::is_inside_root(&real, h)) else {
            continue;
        };
        if !own.is_some_and(|own| js::is_inside_root(&real, own)) {
            out.push(Mismatch::new(
                "blind-ref-hidden",
                format!("context ref \"{reference}\" lies inside the hidden root \"{root}\" and outside the dispatch's own directory; a blind worker could not read it."),
            ));
        }
    }
    out
}

/// `/^[a-z][a-z0-9+.-]*:/i`: a URL-like ref, which is not a path.
fn has_scheme(reference: &str) -> bool {
    let mut chars = reference.chars();
    chars.next().is_some_and(|c| c.is_ascii_alphabetic())
        && reference.split_once(':').is_some_and(|(scheme, _)| {
            scheme
                .chars()
                .all(|c| c.is_ascii_alphanumeric() || "+.-".contains(c))
        })
}

/// Refusals specific to machine-private roots, for every confined request: the workspace, cwd, repo root or a
/// granted mount inside one would be masked from the worker given it; a confinement root inside a writable mount
/// would let the agent plant homes and records.
fn machine_private_refusals(request: &Value, resources: &[Value]) -> Vec<Mismatch> {
    let roots = hidden_root_targets(resources, true);
    if roots.is_empty() {
        return Vec::new();
    }
    let context = request.get("context").unwrap_or(&Value::Null);
    let writable: Vec<&Value> = resources
        .iter()
        .filter(|r| matches!(js::str_at(r, &["access"]), Some("write" | "read-write")))
        .collect();
    let mut candidates: Vec<(String, Option<String>)> = vec![
        (
            "cwd".into(),
            js::str_at(context, &["cwd"]).map(str::to_string),
        ),
        (
            "repoRoot".into(),
            js::str_at(context, &["repoRoot"]).map(str::to_string),
        ),
    ];
    candidates.extend(
        resources
            .iter()
            .filter(|r| !BOUND_BACK.contains(&resource_name(r)))
            .map(|r| {
                (
                    format!("{} mount", resource_name(r)),
                    host_target(r).map(str::to_string),
                )
            }),
    );
    let mut out = hidden_workspace_refusals(
        &candidates,
        &roots,
        "machine-private-hides-workspace",
        |name, real, root| {
            format!("the {name} \"{real}\" lies inside the machine-private root \"{root}\", which is hidden from every confined dispatch.")
        },
    );
    for root in resources
        .iter()
        .filter(|r| js::truthy(r.get("confinementRoot")))
    {
        let Some(target) = host_target(root) else {
            continue;
        };
        for w in &writable {
            let Some(w_target) = host_target(w) else {
                continue;
            };
            if js::is_inside_root(target, &js::real_path_or_resolved(w_target)) {
                out.push(Mismatch::new(
                    "confinement-root-in-writable-grant",
                    format!("the confinement root \"{target}\" lies inside the writable {} mount \"{w_target}\"; move the backend's tempRoot or privateHomeRoot out of it.", resource_name(w)),
                ));
            }
        }
    }
    out
}

/// `{...a}` then `entries`: JS object spread with later keys winning, keeping the first position of a key.
fn put(map: &mut Map<String, Value>, key: &str, value: Value) {
    map.insert(key.to_string(), value);
}

/// Digest of what a supervised attempt really runs: the bwrap prefix, the gate command that follows it and the
/// agent argv the gate execs. Changing any of them changes the digest.
pub fn launch_digest(
    bwrap_prefix: &[String],
    gate_command: &Value,
    agent_argv: &[String],
) -> String {
    let value = json!({ "bwrapPrefix": bwrap_prefix, "gateCommand": gate_command, "agentArgv": agent_argv });
    let text = canonical_json(&value).expect("argv strings are finite JSON");
    let hex: String = Sha256::digest(text.as_bytes())
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect();
    format!("sha256:{hex}")
}

/// The local bwrap driver: its ports are the resource resolver (confinement policy), the private-home records
/// (confinement cleanup), the login copy (credentials) and the environment.
pub struct BwrapDriver {
    resolver: Arc<dyn ResourceResolver>,
    homes: Arc<dyn PrivateHomeHost>,
    credentials: Arc<dyn Credentials>,
    env: EnvFn,
    /// The user id the run supervisor's fallback socket directory `/tmp/fgos-<uid>` names.
    uid: u32,
}

impl BwrapDriver {
    pub fn new(
        resolver: Arc<dyn ResourceResolver>,
        homes: Arc<dyn PrivateHomeHost>,
        credentials: Arc<dyn Credentials>,
        env: EnvFn,
        uid: u32,
    ) -> Self {
        Self {
            resolver,
            homes,
            credentials,
            env,
            uid,
        }
    }

    /// `$XDG_RUNTIME_DIR/fgos` when that is an absolute path, else `/tmp/fgos-<uid>`.
    pub fn runtime_socket_dir(&self) -> String {
        match (self.env)("XDG_RUNTIME_DIR").filter(|d| Path::new(d).is_absolute()) {
            Some(xdg) => js::resolve(Path::new("/"), &format!("{xdg}/fgos")),
            None => format!("/tmp/fgos-{}", self.uid),
        }
    }

    /// A socket of this attempt that is bound back into the sandbox. Only a socket directly in the run supervisor's
    /// socket directory is: any other path could re-expose something the masks hide.
    fn socket_in_runtime_dir(&self, socket: &Value, what: &str) -> Result<String, DriverError> {
        let dir = self.runtime_socket_dir();
        match socket.as_str().filter(|s| Path::new(s).is_absolute()) {
            Some(s) if Path::new(&js::resolve(Path::new("/"), s)).parent() == Some(Path::new(&dir)) => Ok(s.to_string()),
            _ => Err(DriverError::coded(
                ErrorKind::Bwrap,
                "go-socket-outside-runtime-socket-dir",
                format!("the {what} \"{}\" is not in the run supervisor's socket directory \"{dir}\"; only that is bound back into the sandbox.", js::display(Some(socket))),
            )),
        }
    }

    /// The socket a gate command dials (`--go-socket <path>`), or `None` when it names none.
    fn gate_go_socket(&self, gate_command: Option<&Value>) -> Result<Option<String>, DriverError> {
        let Some(list) = gate_command.and_then(Value::as_array) else {
            return Ok(None);
        };
        let Some(at) = list.iter().position(|a| a.as_str() == Some("--go-socket")) else {
            return Ok(None);
        };
        let socket = list.get(at + 1).unwrap_or(&Value::Null);
        self.socket_in_runtime_dir(socket, "gate's GO socket")
            .map(Some)
    }

    fn expand_credential_home(&self, home: &Value) -> Option<String> {
        let home = home.as_str().filter(|h| !h.trim().is_empty())?;
        let user_home = (self.env)("HOME").unwrap_or_default();
        let expanded = ["${HOME}", "$HOME", "~"]
            .iter()
            .find_map(|prefix| {
                home.strip_prefix(prefix)
                    .filter(|rest| rest.is_empty() || rest.starts_with('/'))
                    .map(|rest| format!("{user_home}{rest}"))
            })
            .unwrap_or_else(|| home.to_string());
        Path::new(&expanded).is_absolute().then_some(expanded)
    }

    /// Copies the login files of the store the invocation declares into the private home: the store's own `files`,
    /// else the account's listed files, else a Codex home's `auth.json`. None present refuses the launch, since the
    /// worker would start logged out. Returns false when the request selects no credential.
    fn provision_selected_credential(
        &self,
        home: &Path,
        request: &Value,
    ) -> Result<bool, DriverError> {
        let Some(store) =
            js::at(request, &["invocation", "credentialStore"]).filter(|s| js::truthy(Some(s)))
        else {
            return Ok(false);
        };
        let capacity = js::at(request, &["providerCapacity"]).unwrap_or(&Value::Null);
        let Some(source) = js::at(capacity, &["credentialSource"]).filter(|s| js::truthy(Some(s)))
        else {
            // An account that keeps one login per CLI and declares none for this CLI has nothing to log in with.
            if js::truthy(js::at(capacity, &["credentialSources"])) {
                return Err(credential_error(format!(
                    "account \"{}\" declares no credential source for CLI \"{}\"",
                    js::display(capacity.get("accountId")),
                    js::at(capacity, &["credentialCli"])
                        .filter(|c| js::truthy(Some(c)))
                        .map_or("unknown".to_string(), |c| js::display(Some(c)))
                )));
            }
            return Ok(false);
        };
        let source_home = self.expand_credential_home(source.get("home").unwrap_or(&Value::Null));
        let kind = js::str_at(source, &["kind"]);
        let mut files: Vec<String> = match kind {
            Some("home-files") => {
                let listed: Vec<String> = js::at(source, &["files"])
                    .and_then(Value::as_array)
                    .map(|l| l.iter().map(|f| js::display(Some(f))).collect())
                    .unwrap_or_default();
                if source_home.is_none() || listed.is_empty() {
                    return Err(credential_error("selected home-files credential needs an absolute \"home\" and a non-empty \"files\" list"));
                }
                listed
            }
            Some("codex-home") => {
                if source_home.is_none() {
                    return Err(credential_error(
                        "selected Codex credential needs an absolute \"home\"",
                    ));
                }
                vec!["auth.json".to_string()]
            }
            _ => {
                return Err(credential_error(format!(
                    "unsupported provider credential source kind \"{}\"",
                    js::display(source.get("kind"))
                )))
            }
        };
        if let Some(own) = js::at(store, &["files"]).and_then(Value::as_array) {
            files = own.iter().map(|f| js::display(Some(f))).collect();
        }
        let source_home = source_home.expect("checked above");
        let timeout = js::at(request, &["context", "timeoutMs"])
            .and_then(Value::as_u64)
            .filter(|t| *t > 0)
            .unwrap_or(DEFAULT_SEAT_TIMEOUT_MS);
        if let Some(problem) = self.credentials.login_life_problem(source, timeout) {
            return Err(credential_error(format!(
                "account \"{}\": {problem}",
                js::display(capacity.get("accountId"))
            )));
        }
        let copied = self
            .credentials
            .copy_files(home, Path::new(&source_home), &files)?;
        if copied.is_empty() {
            return Err(credential_error(format!(
                "credential-store-empty: account \"{}\" has none of [{}] of store \"{}\" under {source_home}",
                js::display(capacity.get("accountId")),
                files.join(", "),
                js::display(store.get("use"))
            )));
        }
        Ok(true)
    }

    /// Builds the resolver input the way the Node driver did.
    fn resolve_input(&self, request: &Value, grants: &Value, backend_config: &Value) -> Value {
        let invocation = request.get("invocation").unwrap_or(&Value::Null);
        let mut context = js::at(request, &["context"])
            .and_then(Value::as_object)
            .cloned()
            .unwrap_or_default();
        if let Some(launch) = request.get("assignmentLaunchContext") {
            put(&mut context, "assignmentLaunchContext", launch.clone());
        }
        if let Some(adapter) = invocation.get("adapter") {
            put(&mut context, "adapter", adapter.clone());
        }
        let store_declared = js::truthy(js::at(invocation, &["credentialStore"]));
        let command_cli = js::str_at(invocation, &["command"])
            .map(|c| {
                Path::new(c)
                    .file_name()
                    .map_or(String::new(), |n| n.to_string_lossy().to_lowercase())
            })
            .filter(|n| !n.is_empty());
        put(
            &mut context,
            "inPlaceLoginCli",
            if store_declared {
                Value::Null
            } else {
                command_cli.map_or(Value::Null, Value::String)
            },
        );
        if let Some(command) = invocation.get("command") {
            put(&mut context, "launchCommand", command.clone());
        }
        if let Some(path) = js::at(invocation, &["env", "PATH"])
            .cloned()
            .or_else(|| (self.env)("PATH").map(Value::String))
        {
            put(&mut context, "launchPath", path);
        }
        json!({
            "dispatchId": request.get("dispatchId").cloned().unwrap_or(Value::Null),
            "context": Value::Object(context),
            "grants": grants,
            "resourceNeeds": request.get("resourceNeeds").cloned().unwrap_or(Value::Null),
            "backendConfig": backend_config,
            "providerSources": {},
            "blind": request_is_blind(request),
        })
    }

    fn is_required(mode: Option<&str>) -> bool {
        mode == Some("required")
    }
}

impl BackendDriver for BwrapDriver {
    fn driver_type(&self) -> &str {
        BWRAP_DRIVER_TYPE
    }

    fn version(&self) -> &str {
        BWRAP_DRIVER_VERSION
    }

    fn validate_config(&self, config: &Value, label: &str) -> Result<(), DriverError> {
        validate_bwrap_config(config, label)
    }

    fn assess(&self, request: &Value, backend: &Value) -> Result<Assessment, DriverError> {
        let backend_id = js::str_at(backend, &["id"]).unwrap_or("bwrap");
        let default_config = json!({ "type": BWRAP_DRIVER_TYPE });
        let backend_config = js::at(backend, &["config"])
            .filter(|c| js::truthy(Some(c)))
            .unwrap_or(&default_config);
        validate_bwrap_config(backend_config, &format!("backend \"{backend_id}\""))?;

        let mut mismatches: Vec<Mismatch> = Vec::new();
        let mut coverage = Map::new();
        let mut readiness = Map::new();
        let unsupported = |detail: String| Mismatch::new("confinement-unsupported", detail);
        let cover = |coverage: &mut Map<String, Value>, key: &str, state: &str| {
            coverage.insert(key.to_string(), json!(state));
        };

        let mode = js::str_at(request, &["requirement", "mode"]);
        if mode == Some("preferred") {
            mismatches.push(unsupported("preferred confinement mode is not supported in local-bwrap-v1; use required or unconfined.".into()));
        }
        let override_ = request.get("override");
        let blind_override = is_blind_only_override(override_);
        if override_
            .and_then(Value::as_object)
            .is_some_and(|o| !o.is_empty())
            && !blind_override
        {
            mismatches.push(unsupported(
                "invocation confinement override is not supported in local-bwrap-v1.".into(),
            ));
        }

        let policy = js::at(request, &["requirement", "policy"]);
        let controls = policy.and_then(|p| p.get("controls"));
        if !controls.is_some_and(Value::is_object) {
            mismatches.push(unsupported(
                "required confinement policy must declare a controls object.".into(),
            ));
        } else if let Some(map) = controls.and_then(Value::as_object) {
            for key in map
                .keys()
                .filter(|k| !SUPPORTED_CONTROLS.contains(&k.as_str()))
            {
                mismatches.push(unsupported(format!(
                    "control \"{key}\" is not supported by local-bwrap-v1."
                )));
                cover(&mut coverage, &format!("control:{key}"), "unsatisfied");
            }
            if Self::is_required(mode) {
                for key in SUPPORTED_CONTROLS.iter().filter(|k| !map.contains_key(**k)) {
                    mismatches.push(unsupported(format!(
                        "required confinement policy is missing control \"{key}\"."
                    )));
                    cover(&mut coverage, &format!("control:{key}"), "unsatisfied");
                }
            }
        }

        if js::truthy(controls) {
            let control = |name: &str| controls.and_then(|c| js::at(c, &[name]));
            let text = |name: &str| js::str_at(controls.unwrap_or(&Value::Null), &[name]);
            match text("hostWrite") {
                Some("deny") => cover(&mut coverage, "control:hostWrite", "satisfied"),
                Some("allow") if Self::is_required(mode) => {
                    mismatches.push(unsupported("required policy cannot specify hostWrite: allow on bwrap backend; must be deny.".into()));
                    cover(&mut coverage, "control:hostWrite", "unsatisfied");
                }
                Some("allow") => cover(&mut coverage, "control:hostWrite", "satisfied"),
                _ => cover(&mut coverage, "control:hostWrite", "unknown"),
            }
            let host_read = if blind_override {
                Some("blind")
            } else {
                text("hostRead")
            };
            if matches!(host_read, Some("allow" | "blind")) {
                cover(&mut coverage, "control:hostRead", "satisfied");
            } else {
                let shown = if blind_override {
                    "blind".to_string()
                } else {
                    js::display(control("hostRead"))
                };
                mismatches.push(unsupported(format!("hostRead: {shown} is not supported by local-bwrap-v1 (only hostRead: allow and blind are supported).")));
                cover(&mut coverage, "control:hostRead", "unsatisfied");
            }
            if text("networkEgress") == Some("allow") {
                cover(&mut coverage, "control:networkEgress", "satisfied");
            } else {
                mismatches.push(unsupported(format!("networkEgress: {} is not supported by local-bwrap-v1 (only networkEgress: allow is supported).", js::display(control("networkEgress")))));
                cover(&mut coverage, "control:networkEgress", "unsatisfied");
            }
            if text("process") == Some("host") {
                cover(&mut coverage, "control:process", "satisfied");
            } else {
                mismatches.push(unsupported(format!("process: {} is not supported as a verified claim by local-bwrap-v1 (only process: host is supported).", js::display(control("process")))));
                cover(&mut coverage, "control:process", "unsatisfied");
            }
            // `host` is the root mount itself; `private` needs a dedicated HOME mount this driver does not emit.
            cover(
                &mut coverage,
                "control:home",
                match text("home") {
                    Some("host") => "satisfied",
                    Some("private") => "unverified",
                    _ => "unknown",
                },
            );
            cover(
                &mut coverage,
                "control:session",
                if text("session") == Some("shared") {
                    "satisfied"
                } else {
                    "unverified"
                },
            );
            cover(
                &mut coverage,
                "control:workspace",
                match text("workspace") {
                    Some("shared") => "satisfied",
                    Some("own") => "unverified",
                    _ => "unknown",
                },
            );
        }

        let grants_value = policy
            .and_then(|p| p.get("grants"))
            .filter(|g| g.is_array())
            .cloned()
            .unwrap_or_else(|| json!([]));
        let grants: &[Value] = grants_value.as_array().map_or(&[], Vec::as_slice);
        let policy_id = js::at(request, &["requirement", "policyId"]);
        let mut allowed: Vec<&str> = vec![
            "run-output",
            "private-home",
            "executor-credentials",
            "workspace-paths",
        ];
        // The mailbox record and the peer sessions are a head session's grants only: no other launch binds them, so a
        // worker always keeps its own pid namespace.
        if js::str_at(request, &["assignmentLaunchContext", "kind"]) == Some("session") {
            allowed.extend([MAILBOX_RECORD_RESOURCE, PEER_SESSIONS_RESOURCE]);
        }
        if js::str_at(request, &["requirement", "policyId"]) == Some("workspace-write") {
            allowed.extend(["workspace", "workspace-git-metadata"]);
        }
        for grant in grants {
            let name = js::str_at(grant, &["resource"]).unwrap_or("");
            let key = format!("grant:{}", js::display(grant.get("resource")));
            if allowed.contains(&name) {
                cover(&mut coverage, &key, "satisfied");
            } else {
                mismatches.push(Mismatch::new(
                    "confinement-grant-invalid",
                    format!(
                        "resource \"{}\" is not supported or not permitted under policy \"{}\".",
                        js::display(grant.get("resource")),
                        js::display(policy_id)
                    ),
                ));
                cover(&mut coverage, &key, "unsatisfied");
            }
        }

        // A store is handed over through the private home: a policy that grants none leaves the worker nowhere to
        // find it, and its home variable would keep naming the real store.
        let store = js::at(request, &["invocation", "credentialStore"]);
        if js::truthy(store)
            && js::truthy(policy)
            && !grants
                .iter()
                .any(|g| js::str_at(g, &["resource"]) == Some("private-home"))
        {
            mismatches.push(Mismatch::new(
                "confinement-grant-invalid",
                format!("the invocation reads login store \"{}\" through a private home, and policy \"{}\" grants no \"private-home\".", js::display(store.and_then(|s| s.get("use"))), js::display(policy_id)),
            ));
        }

        let mut resolved: Vec<Value> = Vec::new();
        let input = self.resolve_input(request, &grants_value, backend_config);
        match self.resolver.resolve(&input) {
            Ok(resources) => {
                resolved = resources;
                mismatches.extend(machine_private_refusals(request, &resolved));
                if request_is_blind(request) {
                    mismatches.extend(blind_refusals(request, &resolved));
                }
            }
            Err(err) => mismatches.push(Mismatch::new(
                err.code.as_deref().unwrap_or("confinement-grant-invalid"),
                err.message,
            )),
        }

        // No provider credential source is resolved or mounted here: never turn that absence into a satisfied claim.
        if let Some(grant) = grants
            .iter()
            .find(|g| js::str_at(g, &["resource"]) == Some("executor-credentials"))
        {
            if !resolved
                .iter()
                .any(|r| resource_name(r) == "executor-credentials")
            {
                cover(&mut coverage, "grant:executor-credentials", "unverified");
                if grant.get("optional") == Some(&Value::Bool(false)) {
                    mismatches.push(unsupported("required executor credentials were requested but no provider credential source was resolved for mounting.".into()));
                }
            }
        }

        for need in js::at(request, &["resourceNeeds"])
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
        {
            let name = js::str_at(need, &["resource"]).unwrap_or("");
            let key = js::display(need.get("resource"));
            if resolved.iter().any(|r| resource_name(r) == name) {
                readiness.insert(key, json!("satisfied"));
            } else {
                readiness.insert(key.clone(), json!("unsatisfied"));
                mismatches.push(Mismatch::new(
                    "confinement-need-unsatisfied",
                    format!("required resource need \"{key}\" could not be resolved."),
                ));
            }
        }

        // Fail closed when the attestation store overlaps any writable resource.
        let context = request.get("context").unwrap_or(&Value::Null);
        if let Err(err) = assert_store_isolated(context, &resolved, self.env.as_ref()) {
            mismatches.push(Mismatch::new("confinement-grant-invalid", err.message));
            cover(&mut coverage, "control:hostWrite", "unsatisfied");
        }

        Ok(Assessment {
            coverage,
            resources: resolved,
            readiness,
            mismatches,
        })
    }

    fn prepare(
        &self,
        plan: &Value,
        request: &Value,
        backend: &Value,
    ) -> Result<Prepared, DriverError> {
        let resources: &[Value] = js::at(plan, &["resources"])
            .and_then(Value::as_array)
            .map_or(&[], Vec::as_slice);
        let context = request.get("context").unwrap_or(&Value::Null);
        assert_store_isolated(context, resources, self.env.as_ref())?;

        let mut allocated: Vec<PathBuf> = Vec::new();
        let mut written: Vec<PathBuf> = Vec::new();
        match self.build(
            plan,
            request,
            backend,
            resources,
            &mut allocated,
            &mut written,
        ) {
            Ok(prepared) => Ok(prepared),
            Err(err) => {
                // On a prepare error: remove the host records and every allocated home before refusing.
                for file in &written {
                    let _ = std::fs::remove_file(file);
                }
                let dispatch_id = js::str_at(request, &["dispatchId"]).unwrap_or("");
                for path in &allocated {
                    let _ = self.homes.cleanup_resource(path, dispatch_id);
                }
                Err(err)
            }
        }
    }
}

impl BwrapDriver {
    fn build(
        &self,
        plan: &Value,
        request: &Value,
        backend: &Value,
        resources: &[Value],
        allocated: &mut Vec<PathBuf>,
        written: &mut Vec<PathBuf>,
    ) -> Result<Prepared, DriverError> {
        let executable = js::str_at(backend, &["config", "executable"])
            .filter(|e| !e.is_empty())
            .unwrap_or(DEFAULT_EXECUTABLE);
        let dispatch_id = js::str_at(request, &["dispatchId"])
            .unwrap_or("")
            .to_string();
        // A launch that binds peer sessions keeps the host pid space: inside a pid namespace a peer's pid reads 0 and
        // its liveness cannot be checked. Every other launch gets its own pid namespace with the launched command as pid 1.
        let host_pid_space = resources
            .iter()
            .any(|r| resource_name(r) == PEER_SESSIONS_RESOURCE);
        let mut args: Vec<String> = [
            "--ro-bind",
            "/",
            "/",
            "--dev",
            "/dev",
            "--proc",
            "/proc",
            "--tmpfs",
            "/tmp",
        ]
        .iter()
        .map(|s| s.to_string())
        .collect();
        if !host_pid_space {
            args.extend(["--unshare-pid".into(), "--as-pid-1".into()]);
        }
        args.extend(["--setenv".into(), CONFINED_MARKER_ENV.into(), "1".into()]);
        // Only a terminal launch is tied to its launcher's lifetime: a direct attempt outlives a dead supervisor.
        let terminal = js::str_at(request, &["launchMode"]) == Some("terminal");
        if terminal {
            args.push("--die-with-parent".into());
        }
        let attempt_id = js::str_at(request, &["attemptId"]).filter(|a| !a.is_empty());
        let gate_command = request.get("gateCommand");
        // The private /tmp hides what lives under the host's /tmp; the gate reads its envelope from the run directory
        // and is itself a host binary, so each is bound back where it sits.
        if attempt_id.is_some() {
            let gate_bin = gate_command
                .and_then(Value::as_array)
                .and_then(|g| g.first())
                .and_then(Value::as_str)
                .filter(|g| Path::new(g).is_absolute());
            for host_path in [js::str_at(context_of(request), &["runDir"]), gate_bin]
                .into_iter()
                .flatten()
            {
                let resolved = js::resolve_cwd(host_path);
                if js::is_inside_root(&resolved, "/tmp") {
                    args.extend(["--ro-bind".into(), resolved.clone(), resolved]);
                }
            }
        }

        let blind = request_is_blind(request);
        let hidden: Vec<&Value> = resources
            .iter()
            .filter(|r| resource_name(r) == "hidden-root" && exec_path(r).is_some())
            .collect();
        let own = if blind {
            resources
                .iter()
                .find(|r| resource_name(r) == "own-assignment")
        } else {
            None
        };
        if blind && own.is_none() {
            return Err(refuse(
                "hostRead: blind plan has no own-assignment resource to bind back.",
            ));
        }

        let mut credential_provisioned = false;
        let mut credential_write_back: Option<Value> = None;
        let mut materialize = |res: &Value, args: &mut Vec<String>| -> Result<(), DriverError> {
            let (Some(host), Some(target)) = (host_target(res), exec_path(res)) else {
                return Ok(());
            };
            if js::str_at(res, &["allocation"]) == Some("temporary") {
                // <tempRoot>/<dispatchId>/home: the root, the per-dispatch parent and the home end up owner-only,
                // since the home receives a login copy. Nothing above the named root is touched.
                let root = js::str_at(res, &["tempRoot"])
                    .filter(|r| !r.is_empty())
                    .unwrap_or(host);
                self.homes
                    .ensure_private_dir(Path::new(host), Path::new(root))?;
                let run_dir = js::at(context_of(request), &["runDir"])
                    .cloned()
                    .unwrap_or(Value::Null);
                if let Some(attempt) = attempt_id {
                    // An attempt home is removed only by adopt's finalize-home step.
                    self.homes.write_attempt_marker(Path::new(host), &json!({ "attemptId": attempt, "runDir": run_dir, "dispatchId": dispatch_id, "resource": resource_name(res) }))?;
                } else {
                    // A dispatch outside the assignment door removes its own home when it settles.
                    self.homes.write_ownership_marker(
                        Path::new(host),
                        &dispatch_id,
                        resource_name(res),
                    )?;
                }
                allocated.push(PathBuf::from(host));
                if resource_name(res) == "private-home" {
                    let provisioned =
                        self.provision_selected_credential(Path::new(host), request)?;
                    credential_provisioned = provisioned || credential_provisioned;
                    // Only an attempt home is written back: its finalize-home step is the one removal that reads the descriptor.
                    if let (true, Some(_)) = (provisioned, attempt_id) {
                        credential_write_back = js::at(request, &["providerCapacity"])
                            .filter(|c| js::truthy(c.get("credentialWriteBack")))
                            .and_then(|c| self.credentials.write_back_target(c));
                    }
                    // The host's record beside the home, outside every grant: what a settle reads, never the home.
                    if let Some(attempt) = attempt_id {
                        let launch_command_id = js::str_at(
                            request,
                            &["assignmentLaunchContext", "command", "launchCommandId"],
                        )
                        .unwrap_or(attempt);
                        let record = self.homes.write_attempt_home_record(Path::new(host), &json!({ "attemptId": attempt, "runDir": run_dir, "dispatchId": dispatch_id, "launchCommandId": launch_command_id }))?;
                        written.push(record);
                    }
                }
            }
            let writable = matches!(js::str_at(res, &["access"]), Some("write" | "read-write"));
            args.extend([
                if writable { "--bind" } else { "--ro-bind" }.to_string(),
                host.to_string(),
                target.to_string(),
            ]);
            Ok(())
        };

        // A later mount over a parent hides an earlier one beneath it, so the order is the contract: mounts outside
        // every hidden root, the masks, a blind dispatch's own directory read-only, the mounts inside a hidden root
        // (outbox, own home, the program and its install directories), the attempt's files, and last the masks made
        // read-only.
        let mounts: Vec<&Value> = resources
            .iter()
            .filter(|r| !matches!(resource_name(r), "hidden-root" | "own-assignment"))
            .collect();
        let masks: Vec<&Value> = hidden.iter().copied().chain(own).collect();
        let inside_masked = |res: &Value| {
            exec_path(res).is_some_and(|p| {
                masks
                    .iter()
                    .any(|m| exec_path(m).is_some_and(|mask| js::is_inside_root(p, mask)))
            })
        };
        for res in mounts.iter().filter(|r| !inside_masked(r)) {
            materialize(res, &mut args)?;
        }
        for h in &hidden {
            args.extend([
                "--tmpfs".into(),
                exec_path(h).unwrap_or_default().to_string(),
            ]);
        }
        if let Some(own) = own {
            args.extend([
                "--ro-bind".into(),
                host_target(own).unwrap_or_default().to_string(),
                exec_path(own).unwrap_or_default().to_string(),
            ]);
        }
        for res in mounts.iter().filter(|r| inside_masked(r)) {
            materialize(res, &mut args)?;
        }
        if attempt_id.is_some() {
            // Files of the attempt the gate must write from inside the sandbox (its exit record and capture files).
            // A terminal attempt's gate dials its own GO socket, which the supervisor listens on before the pane runs
            // the launcher; the runtime directory around it is masked, so that one socket is bound back read-only.
            for file in js::at(request, &["attemptBinds"])
                .and_then(Value::as_array)
                .into_iter()
                .flatten()
            {
                let file = js::display(Some(file));
                args.extend(["--bind".into(), file.clone(), file]);
            }
            if terminal {
                if let Some(socket) = self.gate_go_socket(gate_command)? {
                    args.extend(["--ro-bind".into(), socket.clone(), socket]);
                }
                if let Some(socket) = request.get("requestSocket").filter(|s| !s.is_null()) {
                    let socket = self.socket_in_runtime_dir(socket, "request socket")?;
                    args.extend(["--ro-bind".into(), socket.clone(), socket]);
                }
            }
        }
        for h in &hidden {
            args.extend([
                "--remount-ro".into(),
                exec_path(h).unwrap_or_default().to_string(),
            ]);
        }

        // The invocation names the variable its CLI reads its login home from; it points at the private home and wins
        // over a value the invocation's own env carries, which names the real store.
        let invocation = js::at(request, &["invocation"])
            .filter(|i| i.is_object())
            .ok_or_else(|| refuse("the request has no invocation to launch."))?;
        let mut env = js::at(invocation, &["env"])
            .and_then(Value::as_object)
            .cloned()
            .unwrap_or_default();
        let final_args: Vec<String> = js::at(invocation, &["args"])
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .map(|a| js::display(Some(a)))
            .collect();
        let private_home = resources
            .iter()
            .find(|r| resource_name(r) == "private-home");
        if let (Some(home_env), Some(home)) = (
            js::str_at(invocation, &["credentialStore", "homeEnv"]).filter(|h| !h.is_empty()),
            private_home,
        ) {
            env.insert(
                home_env.to_string(),
                json!(exec_path(home).unwrap_or_default()),
            );
        }
        for res in resources {
            if let Some(extra) = res.get("env").and_then(Value::as_object) {
                for (key, value) in extra {
                    env.insert(key.clone(), value.clone());
                }
            }
        }

        let original = js::display(invocation.get("command"));
        let agent_argv: Vec<String> = std::iter::once(original).chain(final_args).collect();
        // A supervised attempt hands the prefix to the envelope and the gate is the command, so the worker argv is
        // not appended here; every other launch closes inherited descriptors first.
        if attempt_id.is_some() {
            args.push("--".into());
        } else {
            args.extend(["--", "bash", "-c", FD_CLOSER_SCRIPT, "bwrap-launch"].map(String::from));
            args.extend(agent_argv.iter().cloned());
        }

        let mut prepared_invocation = invocation.as_object().cloned().unwrap_or_default();
        put(&mut prepared_invocation, "command", json!(executable));
        put(&mut prepared_invocation, "args", json!(args));
        put(&mut prepared_invocation, "env", Value::Object(env));

        let digest = (attempt_id.is_some() && gate_command.is_some_and(Value::is_array))
            .then(|| launch_digest(&args, gate_command.unwrap_or(&Value::Null), &agent_argv));
        Ok(Prepared {
            invocation: Value::Object(prepared_invocation),
            claims: js::at(plan, &["coverage"])
                .and_then(Value::as_object)
                .cloned()
                .unwrap_or_default(),
            bwrap_prefix: attempt_id.is_some().then(|| args.clone()),
            agent_argv: attempt_id.is_some().then(|| agent_argv.clone()),
            launch_digest: digest,
            provider_capacity: credential_provisioned
                .then(|| json!({ "credentialProvisioned": true })),
            credential_write_back,
            allocated_paths: allocated.clone(),
            dispatch_id,
        })
    }
}

fn context_of(request: &Value) -> &Value {
    request.get("context").unwrap_or(&Value::Null)
}

/// Removes the homes a preparation allocated, through the private-home host.
pub fn cleanup_prepared(
    prepared: &Prepared,
    homes: &dyn PrivateHomeHost,
) -> Result<(), DriverError> {
    for path in &prepared.allocated_paths {
        homes.cleanup_resource(path, &prepared.dispatch_id)?;
    }
    Ok(())
}

/// The outcome of the bwrap smoke test.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SmokeResult {
    pub passed: bool,
    pub message: String,
}

/// The bwrap smoke test for a named binary: `<binary> --ro-bind / / -- true` must run and exit 0. The result for
/// the default binary name is kept for the life of the probe, as the doctor rows ask for it more than once.
#[derive(Default)]
pub struct SmokeProbe {
    cached: Mutex<Option<SmokeResult>>,
}

const SMOKE_TIMEOUT: Duration = Duration::from_secs(10);

impl SmokeProbe {
    pub fn new() -> Self {
        Self::default()
    }

    /// Runs the smoke test; `path_env` is the PATH a bare `binary` name is looked up in.
    pub fn check(&self, binary: &str, path_env: &str) -> SmokeResult {
        let is_default = binary == "bwrap";
        if is_default {
            if let Some(hit) = self.cached.lock().expect("smoke cache lock").clone() {
                return hit;
            }
        }
        let result = run_smoke(binary, path_env);
        if is_default {
            *self.cached.lock().expect("smoke cache lock") = Some(result.clone());
        }
        result
    }
}

fn run_smoke(binary: &str, path_env: &str) -> SmokeResult {
    let failed = |why: String| SmokeResult {
        passed: false,
        message: format!("{binary} is unavailable or failed smoke test: {why}"),
    };
    let Some(program) = fgos_process::spawn::resolve_program(binary, path_env, "", cfg!(windows))
    else {
        return failed(format!("{binary}: not found on PATH"));
    };
    match fgos_process::spawn::run_bounded(
        program,
        ["--ro-bind", "/", "/", "--", "true"],
        &[],
        None,
        None,
        SMOKE_TIMEOUT,
    ) {
        Ok(fgos_process::spawn::Outcome::Exited(out)) if out.status.success() => SmokeResult {
            passed: true,
            message: format!(
                "{binary} is available on PATH and smoke test (bwrap --ro-bind / / -- true) passed"
            ),
        },
        Ok(fgos_process::spawn::Outcome::Exited(out)) => {
            failed(format!("exited with {}", out.status))
        }
        Ok(fgos_process::spawn::Outcome::TimedOut { .. }) => failed("timed out".into()),
        Err(err) => failed(err.to_string()),
    }
}
