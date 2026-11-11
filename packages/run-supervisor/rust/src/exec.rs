//! `fgos exec <cli> [args...]`: the door an external agent host (paseo, an ACP client, the Claude Agent
//! SDK) is configured to start instead of the agent CLI itself.
//!
//! Without `FGOS_ATTEMPT_DIR` it becomes the CLI unchanged: a host probes its provider (`--version`, a
//! model list) through the same command, and a probe is not an attempt. With it, it becomes the gate of
//! that attempt: the envelope must be in `external` mode and name this CLI, and the gate dials the
//! supervisor that is already waiting on the attempt's socket. Either way this process is replaced by
//! `exec`: the host's pipes reach the agent untouched and nothing here copies a byte.

use std::ffi::CString;
use std::path::{Path, PathBuf};

use serde_json::Value;

use crate::envelope;

/// The variable an external host sets per agent to name the attempt directory.
pub const ATTEMPT_DIR_ENV: &str = "FGOS_ATTEMPT_DIR";

/// Exit codes of a refusal (an `exec` that succeeded never returns).
const EXIT_USAGE: i32 = 2;
const EXIT_REFUSED: i32 = 65;
const EXIT_EXEC_FAILED: i32 = 127;

fn refuse(code: i32, why: &str) -> i32 {
    eprintln!("fgos exec: {why}");
    code
}

/// What to exec for one attempt: the program and its argv (argv[0] included).
#[derive(Debug, PartialEq, Eq)]
pub struct Launch {
    pub program: String,
    pub argv: Vec<String>,
}

/// The gate command line for `cli args` under the attempt in `attempt_dir`, read from its envelope.
pub fn attempt_launch(attempt_dir: &Path, cli: &str, args: &[String]) -> Result<Launch, String> {
    let envelope_path = attempt_dir.join("envelope.json");
    let value = envelope::read_verified(&envelope_path)?;
    if value["mode"] != "external" {
        return Err(format!(
            "{} is not an external attempt",
            envelope_path.display()
        ));
    }
    let declared = value["agentProtocol"]["cli"].as_str().unwrap_or_default();
    if declared != cli {
        return Err(format!("the attempt runs {declared}, not {cli}"));
    }
    let text = |v: &Value, what: &str| {
        v.as_str()
            .map(String::from)
            .ok_or_else(|| format!("envelope field {what} missing"))
    };
    let host_bin = text(&value["hostBin"], "hostBin")?;
    let socket = text(&value["external"]["socketPath"], "external.socketPath")?;
    let agent_argv = serde_json::to_string(args).map_err(|e| e.to_string())?;
    let gate: Vec<String> = [
        host_bin.as_str(),
        "internal",
        "gate",
        "--protocol",
        "1",
        "--envelope",
    ]
    .iter()
    .map(|s| s.to_string())
    .chain([
        envelope_path.to_string_lossy().into_owned(),
        "--go-socket".into(),
        socket,
        "--agent-argv".into(),
        agent_argv,
    ])
    .collect();
    let prefix: Vec<String> = value["containment"]["bwrapPrefix"]
        .as_array()
        .map(|items| {
            items
                .iter()
                .filter_map(Value::as_str)
                .map(String::from)
                .collect()
        })
        .unwrap_or_default();
    let argv: Vec<String> = if prefix.is_empty() {
        gate
    } else {
        let mut argv = prefix;
        if argv.last().map(String::as_str) != Some("--") {
            argv.push("--".into());
        }
        argv.extend(gate);
        argv
    };
    Ok(Launch {
        program: argv[0].clone(),
        argv,
    })
}

/// Replace this process. Returns only when `execvp` failed.
fn exec(program: &str, argv: &[String]) -> std::io::Error {
    let to_c = |s: &str| CString::new(s).map_err(|_| std::io::ErrorKind::InvalidInput);
    let program = match to_c(program) {
        Ok(p) => p,
        Err(kind) => return kind.into(),
    };
    let argv: Vec<CString> = match argv.iter().map(|a| to_c(a)).collect::<Result<_, _>>() {
        Ok(v) => v,
        Err(kind) => return kind.into(),
    };
    let mut ptrs: Vec<*const libc::c_char> = argv.iter().map(|a| a.as_ptr()).collect();
    ptrs.push(std::ptr::null());
    // SAFETY: both arrays are NUL-terminated and outlive the call; execvp returns only on failure.
    unsafe { libc::execvp(program.as_ptr(), ptrs.as_ptr()) };
    std::io::Error::last_os_error()
}

/// `fgos exec <cli> [args...]`. Returns an exit code only when it could not become the target.
pub fn main(args: &[String]) -> i32 {
    let Some((cli, rest)) = args.split_first() else {
        return refuse(EXIT_USAGE, "usage: fgos exec <cli> [args...]");
    };
    let attempt_dir = std::env::var_os(ATTEMPT_DIR_ENV).map(PathBuf::from);
    let Some(dir) = attempt_dir else {
        // A probe or any use outside an attempt: become the CLI itself.
        let mut argv = vec![cli.clone()];
        argv.extend(rest.iter().cloned());
        let err = exec(cli, &argv);
        return refuse(EXIT_EXEC_FAILED, &format!("{cli}: {err}"));
    };
    let launch = match attempt_launch(&dir, cli, rest) {
        Ok(launch) => launch,
        Err(why) => return refuse(EXIT_REFUSED, &why),
    };
    // The gate leads a process group of its own, so the supervisor's group domain is the gate's and
    // never the host's. A process that already leads one (a host that started it detached) keeps it.
    // SAFETY: setsid has no preconditions; it fails only for a process that already leads a group.
    unsafe { libc::setsid() };
    let err = exec(&launch.program, &launch.argv);
    refuse(EXIT_EXEC_FAILED, &format!("{}: {err}", launch.program))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn argv(items: &[&str]) -> Vec<String> {
        items.iter().map(|s| s.to_string()).collect()
    }

    /// A fresh directory per test under the system temp dir; removed when the guard goes.
    struct Scratch(PathBuf);

    impl Scratch {
        fn new(name: &str) -> Scratch {
            let dir = std::env::temp_dir().join(format!("fgos-exec-{name}-{}", std::process::id()));
            let _ = std::fs::remove_dir_all(&dir);
            std::fs::create_dir_all(&dir).unwrap();
            Scratch(dir)
        }

        fn path(&self) -> &Path {
            &self.0
        }
    }

    impl Drop for Scratch {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    fn write_envelope(dir: &Path, body: Value) {
        let mut body = body;
        let digest = envelope::digest(&body).unwrap();
        body["digest"] = Value::String(digest);
        std::fs::write(
            dir.join("envelope.json"),
            serde_json::to_vec(&body).unwrap(),
        )
        .unwrap();
    }

    fn external_envelope(dir: &Path, cli: &str, bwrap: Option<Vec<&str>>) -> Value {
        let mut body = serde_json::json!({
            "v": 3,
            "protocolId": 1,
            "attemptId": "a1",
            "runDir": dir,
            "mode": "external",
            "hostBin": "/opt/fgos/bin/fgos",
            "agentProtocol": {"cli": cli, "mode": "external"},
            "external": {"socketPath": "/run/user/1/fgos/s.sock", "orphanSettleMs": 0},
            "containment": {"preferred": "linux-pgroup"},
        });
        if let Some(prefix) = bwrap {
            body["containment"] =
                serde_json::json!({"preferred": "linux-gate", "bwrapPrefix": prefix});
        }
        body
    }

    #[test]
    fn an_external_attempt_becomes_its_gate_with_the_host_arguments() {
        let dir = Scratch::new("gate");
        write_envelope(dir.path(), external_envelope(dir.path(), "codex", None));
        let launch = attempt_launch(
            dir.path(),
            "codex",
            &argv(&["app-server", "--enable", "goals"]),
        )
        .unwrap();
        assert_eq!(launch.program, "/opt/fgos/bin/fgos");
        assert_eq!(
            launch.argv,
            argv(&[
                "/opt/fgos/bin/fgos",
                "internal",
                "gate",
                "--protocol",
                "1",
                "--envelope",
                &dir.path().join("envelope.json").to_string_lossy(),
                "--go-socket",
                "/run/user/1/fgos/s.sock",
                "--agent-argv",
                r#"["app-server","--enable","goals"]"#,
            ])
        );
    }

    #[test]
    fn a_sandboxed_attempt_runs_the_gate_behind_the_bwrap_prefix() {
        let dir = Scratch::new("bwrap");
        write_envelope(
            dir.path(),
            external_envelope(
                dir.path(),
                "codex",
                Some(vec!["/usr/bin/bwrap", "--unshare-pid", "--"]),
            ),
        );
        let launch = attempt_launch(dir.path(), "codex", &argv(&["app-server"])).unwrap();
        assert_eq!(launch.program, "/usr/bin/bwrap");
        assert_eq!(
            &launch.argv[..4],
            &argv(&[
                "/usr/bin/bwrap",
                "--unshare-pid",
                "--",
                "/opt/fgos/bin/fgos"
            ])
        );
    }

    #[test]
    fn another_cli_or_another_mode_is_refused() {
        let dir = Scratch::new("refuse");
        write_envelope(dir.path(), external_envelope(dir.path(), "codex", None));
        assert!(attempt_launch(dir.path(), "pi", &[])
            .unwrap_err()
            .contains("runs codex"));
        let mut direct = external_envelope(dir.path(), "codex", None);
        direct["mode"] = "direct".into();
        let other = Scratch::new("refuse-direct");
        write_envelope(other.path(), direct);
        assert!(attempt_launch(other.path(), "codex", &[])
            .unwrap_err()
            .contains("not an external attempt"));
    }
}
