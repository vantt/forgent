//! The probes that need only a sandbox and a shell: each plants a file or reads one from inside, then judges from
//! the host side what the sandbox let through.

#[cfg(unix)]
use super::sandbox::run_with_fd9;
use super::sandbox::{base_args, bind, in_sandbox};
use super::ProbeResult;
use std::fs;
use std::path::Path;

fn remove(file: &Path) {
    let _ = fs::remove_file(file);
}

fn read(file: &Path) -> Option<String> {
    fs::read_to_string(file).ok()
}

/// Probe 1: run-output is writable. RED FALSIFIER (`broken`): mounted read-only.
pub fn run_output_writable(bwrap: &str, run_dir: &Path, broken: bool) -> ProbeResult {
    let marker = run_dir.join("probe-out.txt");
    remove(&marker);
    let mut args = base_args();
    args.extend(bind(if broken { "--ro-bind" } else { "--bind" }, run_dir));
    let ran = in_sandbox(
        bwrap,
        args,
        "printf WRITTEN > \"$1\"",
        &[&marker.to_string_lossy()],
    );
    let passed = ran.status == Some(0) && read(&marker).as_deref() == Some("WRITTEN");
    remove(&marker);
    let why = ran.why();
    ProbeResult::new(
        "run-output-writable",
        passed,
        "run-output is writable",
        format!(
            "failed to write run-output: {}",
            if why.is_empty() {
                "file not created"
            } else {
                &why
            }
        ),
    )
}

/// Probe 2: the cwd/repo root is denied for host-write-denied. RED FALSIFIER: mounted writable.
pub fn host_write_denied(bwrap: &str, target_dir: &Path, broken: bool) -> ProbeResult {
    let file = target_dir.join("should-not-exist.txt");
    remove(&file);
    let mut args = base_args();
    if broken {
        args.extend(bind("--bind", target_dir));
    }
    in_sandbox(
        bwrap,
        args,
        "printf LEAK > \"$1\" 2>/dev/null; exit 0",
        &[&file.to_string_lossy()],
    );
    let leaked = file.exists();
    remove(&file);
    ProbeResult::new(
        "host-write-denied",
        !leaked,
        "host directory write denied",
        "host directory was writable (leak detected)".into(),
    )
}

/// The two broken shapes of the workspace probe.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WorkspaceFalsifier {
    None,
    /// The workspace is not writable.
    WorkspaceReadOnly,
    /// The outside directory leaked as writable.
    OutsideWritable,
}

/// Probe 3: the workspace is writable, and nothing outside it is.
pub fn workspace_writable(
    bwrap: &str,
    workspace_dir: &Path,
    outside_dir: &Path,
    broken: WorkspaceFalsifier,
) -> ProbeResult {
    let ws_file = workspace_dir.join("ws-test.txt");
    let outside_file = outside_dir.join("outside-test.txt");
    remove(&ws_file);
    remove(&outside_file);
    let mut args = base_args();
    match broken {
        WorkspaceFalsifier::WorkspaceReadOnly => args.extend(bind("--ro-bind", workspace_dir)),
        WorkspaceFalsifier::OutsideWritable => {
            args.extend(bind("--bind", workspace_dir));
            args.extend(bind("--bind", outside_dir));
        }
        WorkspaceFalsifier::None => args.extend(bind("--bind", workspace_dir)),
    }
    in_sandbox(
        bwrap,
        args,
        "printf WS_OK > \"$1\" 2>/dev/null; printf OUTSIDE_LEAK > \"$2\" 2>/dev/null; exit 0",
        &[&ws_file.to_string_lossy(), &outside_file.to_string_lossy()],
    );
    let ws_written = read(&ws_file).as_deref() == Some("WS_OK");
    let outside_written = outside_file.exists();
    remove(&ws_file);
    remove(&outside_file);
    ProbeResult::new(
        "workspace-writable",
        ws_written && !outside_written,
        "workspace is writable and outside directory remains denied",
        format!("workspace writable probe failed: wsWritten={ws_written}, outsideWritten={outside_written}"),
    )
}

/// Probe 4: another dispatch's own run directory is denied. RED FALSIFIER: bound writable.
pub fn other_run_dir_denied(
    bwrap: &str,
    own_run_dir: &Path,
    other_run_dir: &Path,
    broken: bool,
) -> ProbeResult {
    let file = other_run_dir.join("tamper.txt");
    remove(&file);
    let mut args = base_args();
    args.extend(bind("--bind", own_run_dir));
    if broken {
        args.extend(bind("--bind", other_run_dir));
    }
    in_sandbox(
        bwrap,
        args,
        "printf TAMPERED > \"$1\" 2>/dev/null; exit 0",
        &[&file.to_string_lossy()],
    );
    let tampered = file.exists();
    remove(&file);
    ProbeResult::new(
        "other-rundir-denied",
        !tampered,
        "other runDir is denied",
        "other runDir was writable (tampering leak)".into(),
    )
}

/// Probe 5: the private home is writable without writing the real host home. RED FALSIFIER: the host home is
/// the one mounted.
pub fn private_home_isolated(
    bwrap: &str,
    host_home: &Path,
    private_home: &Path,
    broken: bool,
) -> ProbeResult {
    let host_marker = host_home.join("home-leak.txt");
    let private_marker = private_home.join("home-ok.txt");
    remove(&host_marker);
    remove(&private_marker);
    let mut args = base_args();
    let target = if broken { host_home } else { private_home };
    args.extend(bind("--bind", target));
    args.extend([
        "--setenv".into(),
        "HOME".into(),
        target.to_string_lossy().into_owned(),
    ]);
    in_sandbox(
        bwrap,
        args,
        "printf OK > \"$HOME/home-ok.txt\" 2>/dev/null; printf LEAK > \"$1\" 2>/dev/null; exit 0",
        &[&host_marker.to_string_lossy()],
    );
    let private_written = private_marker.exists();
    let host_written = host_marker.exists();
    remove(&private_marker);
    remove(&host_marker);
    ProbeResult::new(
        "private-home-isolated",
        private_written && !host_written,
        "private home is writable without leaking to host home",
        format!("private home probe failed: privateWritten={private_written}, hostWritten={host_written}"),
    )
}

/// Closes every descriptor from 3 up before it runs the rest of its argv.
const FD_CLOSER: &str = "for f in $(ls /proc/$$/fd 2>/dev/null); do if [ \"$f\" -ge 3 ] 2>/dev/null; then eval \"exec $f>&-\" 2>/dev/null || true; fi; done; exec \"$@\"";
const WRITE_FD9: &str = "printf TAMPERED >&9 2>/dev/null; exit 0";

/// Probe 6: no inherited writable descriptor survives outside an explicit grant. RED FALSIFIER: no closer.
pub fn no_inherited_writable_fd(bwrap: &str, host_file: &Path, broken: bool) -> ProbeResult {
    if fs::write(host_file, "ORIGINAL").is_err() {
        return ProbeResult::new(
            "no-inherited-writable-fd",
            false,
            "",
            format!("cannot write {}", host_file.display()),
        );
    }
    #[cfg(unix)]
    {
        use std::os::fd::AsRawFd;
        let Ok(file) = fs::OpenOptions::new()
            .read(true)
            .write(true)
            .open(host_file)
        else {
            return ProbeResult::new(
                "no-inherited-writable-fd",
                false,
                "",
                format!("cannot open {}", host_file.display()),
            );
        };
        let mut args = base_args();
        args.push("--".into());
        if broken {
            args.extend(["sh".into(), "-c".into(), WRITE_FD9.into()]);
        } else {
            args.extend([
                "sh".into(),
                "-c".into(),
                FD_CLOSER.into(),
                "wrapper".into(),
                "sh".into(),
                "-c".into(),
                WRITE_FD9.into(),
            ]);
        }
        run_with_fd9(bwrap, &args, file.as_raw_fd());
    }
    let content = read(host_file).unwrap_or_default();
    ProbeResult::new(
        "no-inherited-writable-fd",
        content == "ORIGINAL",
        "inherited writable fd was successfully closed",
        "inherited writable fd leaked and wrote to host file".into(),
    )
}

/// Probe 7: executor credentials are readable and read-only. RED FALSIFIER: mounted writable.
pub fn executor_credentials_read_only(bwrap: &str, creds_dir: &Path, broken: bool) -> ProbeResult {
    let file = creds_dir.join("test-cred.json");
    let _ = fs::write(&file, "{\"secret\": \"token\"}");
    let mut args = base_args();
    args.extend(bind(if broken { "--bind" } else { "--ro-bind" }, creds_dir));
    // Exit 2: the read worked and the write was refused.
    let script = "grep -q token \"$1\" || exit 1; if ( printf '{\"secret\": \"hacked\"}' > \"$1\" ) 2>/dev/null; then exit 0; else exit 2; fi";
    let ran = in_sandbox(bwrap, args, script, &[&file.to_string_lossy()]);
    let passed = ran.status == Some(2) && read(&file).as_deref() == Some("{\"secret\": \"token\"}");
    ProbeResult::new(
        "executor-credentials-readonly",
        passed,
        "executor credentials readable but read-only",
        format!(
            "credentials write not denied: status={}",
            ran.status.map_or("null".into(), |s| s.to_string())
        ),
    )
}

/// Does the sandbox's own `/proc/net/dev` list an interface other than loopback?
const EXTERNAL_INTERFACE: &str = "tail -n +3 /proc/net/dev | grep -v '^ *lo:' | grep -q .";

/// Probe 8: host read and network are not overclaimed. RED FALSIFIER: the network is unshared.
pub fn host_read_and_network_not_overclaimed(bwrap: &str, broken: bool) -> ProbeResult {
    let mut args: Vec<String> = [
        "--dev",
        "/dev",
        "--proc",
        "/proc",
        "--tmpfs",
        "/tmp",
        "--ro-bind",
        "/",
        "/",
    ]
    .map(String::from)
    .to_vec();
    if broken {
        args.push("--unshare-net".into());
    }
    let script = format!("[ -e /etc/os-release ] || [ -e /etc/hosts ] || exit 1; {EXTERNAL_INTERFACE} || exit 2; exit 0");
    let ran = in_sandbox(bwrap, args, &script, &[]);
    ProbeResult::new(
        "host-read-network-not-overclaimed",
        ran.status == Some(0),
        "host read and network access are available (not overclaimed)",
        format!(
            "overclaim detected: status={}",
            ran.status.map_or("null".into(), |s| s.to_string())
        ),
    )
}
