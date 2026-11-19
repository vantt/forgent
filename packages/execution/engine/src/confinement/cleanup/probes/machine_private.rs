//! Probe: machine-private roots (Config's private directory, the user runtime directory, Claude Code session
//! sockets, herdr's sockets, the login stores) are hidden from a worker under every built-in policy, and under
//! `hostRead: blind` as well when asked, for a direct and a terminal launch.
//!
//! Stand-ins sit in a short scratch directory, handed to the real resolver and to the worker alike: a home with
//! files planted in `.fgos/private`, a login store, a herdr socket; a user runtime directory with the systemd user
//! manager, the session bus, ssh-agent and two attempts' GO sockets; and a Claude socket base with a session
//! socket. The argv comes from the real driver. The worker must reach none of them, but a terminal launch reaches
//! its own GO socket; it still writes its outbox and sees its workspace the way the policy grants it.

use super::sandbox::{parse_lines, run, CODE_FN};
use super::{ProbePorts, ProbeResult};
use crate::confinement::policy::{builtin_policy, BUILTIN_POLICY_IDS, SESSION_SOCKET_DIR};
use fgos_execution::runner_config::fgos_dir_from_root;
use fgos_run_supervisor::controller::runtime_dir::SOCKET_PATH_MAX_BYTES;
use serde_json::{json, Value};
use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

/// The falsifier names and the stand-ins each one unmasks.
pub const MACHINE_PRIVATE_FALSIFIERS: [(&str, &[&str]); 5] = [
    ("private", &["accounts", "token"]),
    (
        "runtime-dir",
        &["systemd", "bus", "sshAgent", "otherAttempt"],
    ),
    ("session-sockets", &["sessionSocket"]),
    ("herdr", &["herdr"]),
    ("login-stores", &["loginStore"]),
];

/// The red falsifiers of the probe.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MachinePrivateFalsifier {
    None,
    /// Every machine-private mask dropped: the worker must reach everything.
    All,
    /// Exactly one mask dropped (a name in [`MACHINE_PRIVATE_FALSIFIERS`]): the worker must reach exactly what it
    /// hides while everything else stays hidden.
    Mask(&'static str),
    /// A terminal attempt launched with a gate that names no GO socket: its worker must not reach its own.
    OwnSocket,
}

/// Socket names in the order the in-sandbox script takes them.
const SOCKET_NAMES: [&str; 7] = [
    "systemd",
    "bus",
    "sshAgent",
    "otherAttempt",
    "ownAttempt",
    "sessionSocket",
    "herdr",
];
const LONGEST_STAND_IN: &str = "r/fgos/other-attempt.sock";

struct StandIns {
    home: PathBuf,
    runtime_dir: PathBuf,
    claude_socket_base: PathBuf,
    private_dir: PathBuf,
    login_store: PathBuf,
    herdr_socket: PathBuf,
    own_attempt: PathBuf,
    sockets: BTreeMap<&'static str, PathBuf>,
    accounts: PathBuf,
    token: PathBuf,
    login_file: PathBuf,
    masks: BTreeMap<&'static str, PathBuf>,
}

fn stand_ins(short: &Path) -> std::io::Result<StandIns> {
    let home = short.join("h");
    let runtime_dir = short.join("r");
    let claude_socket_base = short.join("c");
    let private_dir = home.join(".fgos/private");
    let herdr_dir = home.join(".config/herdr");
    for dir in [&private_dir, &runtime_dir, &claude_socket_base] {
        fs::create_dir_all(dir)?;
    }
    let login_store = home.join(".stand-in-login");
    fs::create_dir_all(&login_store)?;
    let accounts = private_dir.join("accounts.yaml");
    let token = private_dir.join("gateway-token");
    let login_file = login_store.join("auth.json");
    for file in [&accounts, &token, &login_file] {
        fs::write(file, "PLANTED")?;
    }
    let session_dir = claude_socket_base.join(SESSION_SOCKET_DIR);
    let sockets = BTreeMap::from([
        ("systemd", runtime_dir.join("systemd/private")),
        ("bus", runtime_dir.join("bus")),
        ("sshAgent", runtime_dir.join("openssh_agent")),
        ("otherAttempt", runtime_dir.join("fgos/other-attempt.sock")),
        ("ownAttempt", runtime_dir.join("fgos/own-attempt.sock")),
        ("sessionSocket", session_dir.join("4242.sock")),
        ("herdr", herdr_dir.join("herdr.sock")),
    ]);
    let masks = BTreeMap::from([
        ("private", private_dir.clone()),
        ("runtime-dir", runtime_dir.clone()),
        ("session-sockets", session_dir),
        ("herdr", herdr_dir.clone()),
        ("login-stores", login_store.clone()),
    ]);
    Ok(StandIns {
        herdr_socket: herdr_dir.join("herdr.sock"),
        own_attempt: runtime_dir.join("fgos/own-attempt.sock"),
        home,
        runtime_dir,
        claude_socket_base,
        private_dir,
        login_store,
        sockets,
        accounts,
        token,
        login_file,
        masks,
    })
}

/// A fresh directory under the first candidate whose longest stand-in socket fits a unix socket path.
fn short_stand_in_dir(root: &Path) -> Option<PathBuf> {
    for parent in [root, Path::new("/var/tmp")] {
        if parent
            .join("fgos-rt-XXXXXX")
            .join(LONGEST_STAND_IN)
            .as_os_str()
            .len()
            > SOCKET_PATH_MAX_BYTES
        {
            continue;
        }
        for attempt in 0..100u32 {
            let dir = parent.join(format!("fgos-rt-{}-{attempt}", std::process::id()));
            if fs::create_dir(&dir).is_ok() {
                return Some(dir);
            }
        }
    }
    None
}

fn text(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

/// Probe: see the module documentation. `scratch` must not be under /tmp (the sandbox starts with an empty /tmp,
/// which would hide a planted file by itself); one that is gets a directory under /var/tmp instead.
pub fn machine_private_hidden(
    bwrap: &str,
    scratch: &Path,
    blind: bool,
    ports: &ProbePorts<'_>,
    broken: MachinePrivateFalsifier,
) -> ProbeResult {
    let name = "machine-private-hidden";
    let fail = |why: String| {
        ProbeResult::new(
            name,
            false,
            "",
            format!("machine-private probe failed: {why}"),
        )
    };
    if let MachinePrivateFalsifier::Mask(mask) = broken {
        if !MACHINE_PRIVATE_FALSIFIERS
            .iter()
            .any(|(known, _)| *known == mask)
        {
            return fail(format!("unknown machine-private falsifier \"{mask}\""));
        }
    }
    let scratch = match fs::canonicalize(scratch) {
        Ok(dir) => dir,
        Err(err) => return fail(err.to_string()),
    };
    let owns_root = scratch.starts_with("/tmp");
    let root = if owns_root {
        match fresh_var_tmp() {
            Some(dir) => dir,
            None => return fail("no writable /var/tmp".into()),
        }
    } else {
        scratch
    };
    let result = match short_stand_in_dir(&root) {
        None => fail(format!(
            "no directory short enough for a unix socket path (tried {} and /var/tmp)",
            root.display()
        )),
        Some(short) => {
            let outcome = with_listeners(&short, |stand| {
                probe_in(bwrap, &root, stand, blind, ports, broken)
            });
            let _ = fs::remove_dir_all(&short);
            outcome.unwrap_or_else(|err| fail(err.to_string()))
        }
    };
    if owns_root {
        let _ = fs::remove_dir_all(&root);
    }
    result
}

fn fresh_var_tmp() -> Option<PathBuf> {
    (0..100u32).find_map(|attempt| {
        let dir = PathBuf::from(format!(
            "/var/tmp/fgos-machine-private-probe-{}-{attempt}",
            std::process::id()
        ));
        fs::create_dir(&dir).ok().map(|_| dir)
    })
}

/// Builds the stand-ins and keeps a listener on each socket while `body` runs, so a connect that reaches one is a
/// real connect.
fn with_listeners(
    short: &Path,
    body: impl FnOnce(&StandIns) -> ProbeResult,
) -> std::io::Result<ProbeResult> {
    let stand = stand_ins(short)?;
    #[cfg(unix)]
    let _servers: Vec<_> = stand
        .sockets
        .values()
        .map(|socket| {
            if let Some(parent) = socket.parent() {
                fs::create_dir_all(parent)?;
            }
            std::os::unix::net::UnixListener::bind(socket)
        })
        .collect::<Result<_, _>>()?;
    Ok(body(&stand))
}

fn dropped_by_falsifier(res: &Value, broken: MachinePrivateFalsifier, stand: &StandIns) -> bool {
    if res.get("machinePrivate").and_then(Value::as_bool) != Some(true) {
        return false;
    }
    match broken {
        MachinePrivateFalsifier::None | MachinePrivateFalsifier::OwnSocket => false,
        MachinePrivateFalsifier::All => true,
        MachinePrivateFalsifier::Mask(mask) => {
            let target = stand
                .masks
                .get(mask)
                .and_then(|dir| fs::canonicalize(dir).ok());
            res.get("hostTarget")
                .and_then(Value::as_str)
                .map(PathBuf::from)
                == target
        }
    }
}

/// The in-sandbox script: `test -S` per socket (a masked one is absent), then the planted files, the private
/// directory's entries and the two writes. Positional arguments: 1-7 sockets, 8 accounts, 9 token, 10 login file,
/// 11 private directory, 12 outbox file, 13 workspace file.
fn script() -> String {
    let sockets: String = SOCKET_NAMES
        .iter()
        .enumerate()
        .map(|(i, name)| {
            format!(
                "if [ -S \"${}\" ]; then echo \"{name}=ok\"; else echo \"{name}=ENOENT\"; fi; ",
                i + 1
            )
        })
        .collect();
    format!(
        "{CODE_FN}{sockets}echo \"marker=$FGOS_CONFINED\"; echo \"accounts=$(code cat \"$8\")\"; echo \"token=$(code cat \"$9\")\"; echo \"loginStore=$(code cat \"${{10}}\")\"; if ls -A \"${{11}}\" >/dev/null 2>&1; then echo \"entries=$(ls -A \"${{11}}\" | wc -l | tr -d ' ')\"; else echo \"entries=ENOENT\"; fi; echo \"outbox=$(code sh -c 'printf WRITTEN > \"$1\"' x \"${{12}}\")\"; echo \"workspace=$(code sh -c 'printf WRITTEN > \"$1\"' x \"${{13}}\")\""
    )
}

fn probe_in(
    bwrap: &str,
    root: &Path,
    stand: &StandIns,
    blind: bool,
    ports: &ProbePorts<'_>,
    broken: MachinePrivateFalsifier,
) -> ProbeResult {
    let name = "machine-private-hidden";
    let hidden_keys: Vec<&str> = MACHINE_PRIVATE_FALSIFIERS
        .iter()
        .flat_map(|(_, keys)| keys.iter().copied())
        .collect();
    let mut failures: Vec<String> = Vec::new();
    let mut variants: Vec<(&str, bool, &str)> = Vec::new();
    for policy in BUILTIN_POLICY_IDS {
        for blind_variant in if blind {
            vec![false, true]
        } else {
            vec![false]
        } {
            for mode in ["direct", "terminal"] {
                variants.push((policy, blind_variant, mode));
            }
        }
    }
    for (policy_id, blind_variant, launch_mode) in &variants {
        let label = format!(
            "{policy_id}{}/{launch_mode}",
            if *blind_variant { "+blind" } else { "" }
        );
        let slug = label.replace(['+', '/'], "-");
        let dir = root.join(&slug);
        let project = dir.join("project");
        let fgos_dir = fgos_dir_from_root(&text(&project));
        let own_dir = Path::new(&fgos_dir).join("assignments/probe-unit/self/1");
        let run_dir = own_dir.join("runs/01");
        let outbox = run_dir.join("worker-output/outbox/probe-out.txt");
        let workspace_file = project.join("probe-workspace.txt");
        let creds_dir = dir.join("creds");
        let prepared_dirs = [
            outbox.parent().expect("has a parent").to_path_buf(),
            creds_dir.clone(),
        ];
        if let Some(err) = prepared_dirs
            .iter()
            .find_map(|d| fs::create_dir_all(d).err())
        {
            failures.push(format!("{label}: {err}"));
            continue;
        }
        if let Err(err) = fs::write(own_dir.join("brief.md"), "OWN") {
            failures.push(format!("{label}: {err}"));
            continue;
        }
        let policy = builtin_policy(policy_id).expect("a built-in policy id names a policy");
        let grants = policy["grants"].clone();
        let dispatch_id = format!("probe-machine-private-{slug}");
        let context = json!({ "cwd": text(&project), "repoRoot": text(&project), "runDir": text(&run_dir), "fgosDir": fgos_dir });
        let mut resolve_context = context.clone();
        resolve_context["assignmentLaunchContext"] = json!({});
        let resolved = ports.resolver.resolve(&json!({
            "dispatchId": dispatch_id,
            "context": resolve_context,
            "grants": grants,
            "backendConfig": { "tempRoot": text(&dir.join("confinement-temp")) },
            "providerSources": { "credentialsPath": text(&creds_dir) },
            "blind": blind_variant,
            "homeDir": text(&stand.home),
            "claudeSocketBase": text(&stand.claude_socket_base),
            "xdgRuntimeDir": text(&stand.runtime_dir),
            "xdgConfigHome": Value::Null,
            "herdrSocketPath": text(&stand.herdr_socket),
            "loginStores": [text(&stand.login_store)],
        }));
        let resources: Vec<Value> = match resolved {
            Ok(list) => list
                .into_iter()
                .filter(|res| !dropped_by_falsifier(res, broken, stand))
                .collect(),
            Err(err) => {
                failures.push(format!("{label}: {err}"));
                continue;
            }
        };
        let terminal = *launch_mode == "terminal";
        let script_args: Vec<String> = SOCKET_NAMES
            .iter()
            .map(|n| text(&stand.sockets[n]))
            .chain(
                [
                    &stand.accounts,
                    &stand.token,
                    &stand.login_file,
                    &stand.private_dir,
                    &outbox,
                    &workspace_file,
                ]
                .map(|p| text(p)),
            )
            .collect();
        let mut invocation_args = vec!["-c".to_string(), script(), "sh".to_string()];
        invocation_args.extend(script_args.clone());
        let mut request = json!({
            "dispatchId": dispatch_id,
            "invocation": { "command": "sh", "args": invocation_args, "env": {} },
            "context": context,
        });
        if *blind_variant {
            request["override"] = json!({ "controls": { "hostRead": "blind" } });
        }
        if terminal {
            // A terminal attempt: the prefix ends in `--` and its gate would dial its own GO socket.
            let mut gate = vec![json!("/bin/true"), json!("internal"), json!("gate")];
            if broken != MachinePrivateFalsifier::OwnSocket {
                gate.extend([json!("--go-socket"), json!(text(&stand.own_attempt))]);
            }
            request["launchMode"] = json!("terminal");
            request["attemptId"] = json!(format!("probe-{slug}"));
            request["gateCommand"] = Value::Array(gate);
        }
        // The driver binds back only a GO socket in the run supervisor's socket directory, which it reads from
        // the environment it was built with: build it over the stand-in runtime directory.
        let driver = (ports.driver_for)(&stand.runtime_dir);
        let prepared = match driver.prepare(
            &json!({ "resources": resources }),
            &request,
            &json!({ "id": "bwrap", "config": { "executable": bwrap } }),
        ) {
            Ok(prepared) => prepared,
            Err(err) => {
                failures.push(format!("{label}: {err}"));
                continue;
            }
        };
        let command = prepared
            .invocation
            .get("command")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_string();
        let mut args: Vec<String> = prepared
            .invocation
            .get("args")
            .and_then(Value::as_array)
            .map(|list| {
                list.iter()
                    .filter_map(|a| a.as_str().map(str::to_string))
                    .collect()
            })
            .unwrap_or_default();
        if terminal {
            args.extend([
                "sh".to_string(),
                "-c".to_string(),
                script(),
                "sh".to_string(),
            ]);
            args.extend(script_args);
        }
        let ran = run(&command, &args);
        let seen = parse_lines(&ran.stdout);
        let workspace_writable = grants.as_array().is_some_and(|list| {
            list.iter()
                .any(|g| g["resource"] == "workspace" && g["access"] != "read")
        });
        let outbox_host_side = fs::read_to_string(&outbox).is_ok_and(|c| c == "WRITTEN");
        let is = |key: &str, want: &str| seen.get(key).is_some_and(|v| v == want);
        let ok = !seen.is_empty()
            && is("marker", "1")
            && hidden_keys.iter().all(|key| is(key, "ENOENT"))
            && is("entries", "0")
            && is("ownAttempt", if terminal { "ok" } else { "ENOENT" })
            && is("outbox", "ok")
            && outbox_host_side
            && is("workspace", if workspace_writable { "ok" } else { "EROFS" });
        if !ok {
            let shown = if seen.is_empty() {
                if ran.stderr.is_empty() {
                    "worker reported nothing".to_string()
                } else {
                    ran.stderr.clone()
                }
            } else {
                ran.stdout.trim().replace('\n', ", ")
            };
            failures.push(format!("{label}: {shown}"));
        }
    }
    let passed = failures.is_empty();
    ProbeResult::new(
        name,
        passed,
        &format!("a worker under {} policy, hostRead and launch combinations cannot read a machine-private directory or a login store or reach a runtime-directory, Claude Code session, herdr or other attempt's socket, and keeps its own GO socket, outbox and workspace", variants.len()),
        format!("machine-private probe failed: {}", failures.join("; ")),
    )
}
