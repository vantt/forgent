#![allow(dead_code)]
use std::collections::BTreeMap;
use std::fs::{self, File};
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use fgos_process::containment::{GuaranteeLevel, SpawnSpec, StartMode};
#[cfg(windows)]
use fgos_process::containment::ContainmentDriver;

#[cfg(target_os = "linux")]
use std::process::{Command, Stdio};
#[cfg(target_os = "linux")]
use std::sync::LazyLock;

pub fn scratch(name: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let dir = std::env::temp_dir().join(format!("fgos-containment-{name}-{}-{}", std::process::id(), nanos));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

pub fn wait_for(path: &Path) -> String {
    let start = Instant::now();
    loop {
        if let Ok(text) = fs::read_to_string(path) {
            if !text.trim().is_empty() {
                return text;
            }
        }
        assert!(start.elapsed() < Duration::from_secs(20), "timed out waiting for {}", path.display());
        std::thread::sleep(Duration::from_millis(10));
    }
}

pub struct Props {
    pub name: &'static str,
    pub level: GuaranteeLevel,
    pub escapes: &'static [&'static str],
    pub double_fork_escapee_survives: bool,
    pub term_without_handler_kills: bool,
    pub term_phase: bool,
    pub leader_exit_ends_domain: bool,
    pub fast_iterations: u32,
}

#[cfg(target_os = "linux")]
pub const LINUX_PGROUP_PROPS: Props = Props {
    name: "linux-pgroup",
    level: GuaranteeLevel::BestEffort,
    escapes: &["setsid", "reused pgid", "daemons"],
    double_fork_escapee_survives: true,
    term_without_handler_kills: true,
    term_phase: true,
    leader_exit_ends_domain: false,
    fast_iterations: 100,
};

#[cfg(target_os = "linux")]
pub const BWRAP_PIDNS_PROPS: Props = Props {
    name: "bwrap-pidns",
    level: GuaranteeLevel::Kernel,
    escapes: &["herdr", "systemd", "docker"],
    double_fork_escapee_survives: false,
    term_without_handler_kills: false,
    term_phase: true,
    leader_exit_ends_domain: true,
    fast_iterations: 100,
};

#[cfg(target_os = "macos")]
pub const MACOS_TREE_PROPS: Props = Props {
    name: "macos-tree",
    level: GuaranteeLevel::BestEffort,
    escapes: &["double fork", "reused pgid", "launchd"],
    double_fork_escapee_survives: true,
    term_without_handler_kills: true,
    term_phase: true,
    leader_exit_ends_domain: false,
    fast_iterations: 100,
};

#[cfg(windows)]
pub const WINDOWS_JOB_PROPS: Props = Props {
    name: "windows-job",
    level: GuaranteeLevel::Kernel,
    escapes: &["service", "COM server"],
    double_fork_escapee_survives: false,
    term_without_handler_kills: true,
    term_phase: false,
    leader_exit_ends_domain: false,
    fast_iterations: 20,
};

pub trait Workloads: Send + Sync {
    fn tree(&self, dir: &Path) -> SpawnSpec;
    fn sleeper(&self) -> SpawnSpec;
    fn exit_with(&self, code: i32) -> SpawnSpec;
    fn lingering_grandchild(&self, dir: &Path) -> SpawnSpec;
    fn echo(&self, dir: &Path) -> SpawnSpec;
    fn term_probe(&self, dir: &Path, handler: bool) -> SpawnSpec;
}

#[cfg(target_os = "linux")]
pub fn require_bwrap() -> Option<PathBuf> {
    // Unprivileged bwrap cannot create user namespaces when already confined in a nested user namespace.
    static NESTED_USERNS: LazyLock<Option<String>> = LazyLock::new(|| {
        let content = fs::read_to_string("/proc/self/uid_map").ok()?;
        let lines: Vec<&str> = content.lines().collect();
        if lines.len() == 1 && lines[0].split_whitespace().collect::<Vec<_>>() == ["0", "0", "4294967295"] {
            None
        } else {
            Some(lines.first().map(|l| l.trim().to_string()).unwrap_or_default())
        }
    });

    static PROBE_RESULT: LazyLock<Result<PathBuf, String>> = LazyLock::new(|| {
        let bwrap = PathBuf::from("/usr/bin/bwrap");
        if !bwrap.is_file() {
            return Err("/usr/bin/bwrap not found".to_string());
        }
        match Command::new(&bwrap)
            .args(["--unshare-user", "--unshare-pid", "--as-pid-1", "--dev-bind", "/", "/", "--proc", "/proc", "--", "/bin/true"])
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::piped())
            .output()
        {
            Ok(out) if out.status.success() => Ok(bwrap),
            Ok(out) => Err(String::from_utf8_lossy(&out.stderr).into_owned()),
            Err(e) => Err(e.to_string()),
        }
    });

    match &*PROBE_RESULT {
        Ok(bwrap) => Some(bwrap.clone()),
        Err(stderr) => {
            if let Some(line) = &*NESTED_USERNS {
                eprintln!("skip: bwrap-pidns: inside a nested user namespace (uid_map: {line})");
                None
            } else {
                panic!("bwrap-pidns probe failed: {stderr}");
            }
        }
    }
}

#[cfg(unix)]
pub struct UnixWorkloads;

#[cfg(unix)]
fn unix_spec(argv: &[&str]) -> SpawnSpec {
    SpawnSpec {
        argv: argv.iter().map(|a| a.to_string()).collect(),
        bwrap_prefix: None,
        fd_map: Vec::new(),
        env: BTreeMap::from([("PATH".to_string(), "/usr/bin:/bin".to_string())]),
        cwd: std::env::temp_dir(),
        stdin: None,
        stdout: None,
        stderr: None,
        mode: StartMode::Direct,
    }
}

#[cfg(unix)]
impl Workloads for UnixWorkloads {
    fn tree(&self, dir: &Path) -> SpawnSpec {
        const SCRIPT: &str = r#"
if command -v setsid >/dev/null 2>&1; then
    run_setsid() { setsid "$@"; }
else
    run_setsid() { perl -MPOSIX -e 'POSIX::setsid(); exec @ARGV' "$@"; }
fi
for i in $(seq 1 15); do sleep 600 & done
run_setsid sleep 600 &
echo $! > "$1/setsid.pid"
(run_setsid sh -c 'echo $$ > "$1/escape.pid"; exec sleep 600' sh "$1" &)
wait
"#;
        unix_spec(&["sh", "-c", SCRIPT, "sh", &dir.display().to_string()])
    }

    fn sleeper(&self) -> SpawnSpec {
        unix_spec(&["sleep", "600"])
    }

    fn exit_with(&self, code: i32) -> SpawnSpec {
        unix_spec(&["sh", "-c", &format!("exit {code}")])
    }

    fn lingering_grandchild(&self, _dir: &Path) -> SpawnSpec {
        unix_spec(&["sh", "-c", "sleep 600 &"])
    }

    fn echo(&self, dir: &Path) -> SpawnSpec {
        let stdin_path = dir.join("stdin.txt");
        let stdout_path = dir.join("stdout.txt");
        let stderr_path = dir.join("stderr.txt");
        fs::write(&stdin_path, "conformance stdin\n").unwrap();

        let script = r#"read -r line; echo "stdin:$line"; echo "cwd:$(pwd)"; echo "a:$FGOS_CONF_A"; echo "b:$FGOS_CONF_B"; echo "err:out" >&2; exit 7"#;
        let stdin_file = File::open(&stdin_path).unwrap();
        let stdout_file = File::create(&stdout_path).unwrap();
        let stderr_file = File::create(&stderr_path).unwrap();

        let mut spec = unix_spec(&["sh", "-c", script]);
        spec.env.insert("FGOS_CONF_A".to_string(), "alpha".to_string());
        spec.env.insert("FGOS_CONF_B".to_string(), "beta".to_string());
        spec.cwd = dir.to_path_buf();
        spec.stdin = Some(stdin_file);
        spec.stdout = Some(stdout_file);
        spec.stderr = Some(stderr_file);
        spec
    }

    fn term_probe(&self, dir: &Path, handler: bool) -> SpawnSpec {
        if handler {
            const SCRIPT: &str = r#"
trap 'echo term > "$1/term.txt"' TERM
echo ready > "$1/ready.txt"
while true; do sleep 1 & wait $!; done
"#;
            unix_spec(&["sh", "-c", SCRIPT, "sh", &dir.display().to_string()])
        } else {
            const SCRIPT: &str = r#"
echo ready > "$1/ready.txt"
exec sleep 600
"#;
            unix_spec(&["sh", "-c", SCRIPT, "sh", &dir.display().to_string()])
        }
    }
}

#[cfg(windows)]
pub struct WindowsWorkloads;

#[cfg(windows)]
fn helper_argv() -> Vec<String> {
    let me = std::env::current_exe().unwrap().display().to_string();
    vec![me, "--exact".into(), "helper_role".into(), "--nocapture".into(), "--test-threads=1".into()]
}

#[cfg(windows)]
pub fn helper_command() -> std::process::Command {
    let argv = helper_argv();
    let mut cmd = std::process::Command::new(&argv[0]);
    cmd.args(&argv[1..]);
    cmd
}

#[cfg(windows)]
fn helper_env(role: &str, dir: &Path, extra: &[(&str, &str)]) -> BTreeMap<String, String> {
    let mut env: BTreeMap<String, String> = std::env::vars().collect();
    env.insert("FGOS_TEST_ROLE".into(), role.into());
    env.insert("FGOS_TEST_DIR".into(), dir.display().to_string());
    for (k, v) in extra {
        env.insert((*k).into(), (*v).into());
    }
    env
}

#[cfg(windows)]
pub fn win_spec(role: &str, dir: &Path, extra: &[(&str, &str)]) -> SpawnSpec {
    SpawnSpec {
        argv: helper_argv(),
        bwrap_prefix: None,
        fd_map: Vec::new(),
        env: helper_env(role, dir, extra),
        cwd: dir.to_path_buf(),
        stdin: None,
        stdout: None,
        stderr: None,
        mode: StartMode::Direct,
    }
}

#[cfg(windows)]
impl Workloads for WindowsWorkloads {
    fn tree(&self, dir: &Path) -> SpawnSpec {
        win_spec("tree", dir, &[])
    }

    fn sleeper(&self) -> SpawnSpec {
        win_spec("sleep", &std::env::temp_dir(), &[])
    }

    fn exit_with(&self, code: i32) -> SpawnSpec {
        let code_str = code.to_string();
        win_spec("exit", &std::env::temp_dir(), &[("FGOS_TEST_EXIT_CODE", &code_str)])
    }

    fn lingering_grandchild(&self, dir: &Path) -> SpawnSpec {
        win_spec("lingering", dir, &[])
    }

    fn echo(&self, dir: &Path) -> SpawnSpec {
        let stdin_path = dir.join("stdin.txt");
        let stdout_path = dir.join("stdout.txt");
        let stderr_path = dir.join("stderr.txt");
        fs::write(&stdin_path, "conformance stdin\n").unwrap();
        let stdin_file = File::open(&stdin_path).unwrap();
        let stdout_file = File::create(&stdout_path).unwrap();
        let stderr_file = File::create(&stderr_path).unwrap();
        let mut spec = win_spec("echo", dir, &[("FGOS_CONF_A", "alpha"), ("FGOS_CONF_B", "beta")]);
        spec.stdin = Some(stdin_file);
        spec.stdout = Some(stdout_file);
        spec.stderr = Some(stderr_file);
        spec
    }

    fn term_probe(&self, dir: &Path, _handler: bool) -> SpawnSpec {
        fs::write(dir.join("ready.txt"), "ready\n").unwrap();
        win_spec("sleep", dir, &[])
    }
}

#[cfg(windows)]
fn write_pid(dir: &Path, name: &str, pid: u32) {
    let tmp = dir.join(format!("{name}.tmp"));
    let _ = fs::write(&tmp, pid.to_string());
    let _ = fs::rename(&tmp, dir.join(name));
}

#[cfg(windows)]
pub fn run_helper_role() {
    use std::os::windows::process::CommandExt;
    let Ok(role) = std::env::var("FGOS_TEST_ROLE") else {
        return;
    };
    let dir = PathBuf::from(std::env::var("FGOS_TEST_DIR").unwrap());
    match role.as_str() {
        "sleep" => loop { std::thread::sleep(Duration::from_secs(3600)); },
        "tree" => {
            let child = helper_command().creation_flags(0).spawn().unwrap();
            write_pid(&dir, "child.pid", child.id());
            let detached = helper_command().creation_flags(0x0000_0008).spawn().unwrap();
            write_pid(&dir, "detached.pid", detached.id());
            let mut nest = helper_command();
            nest.env("FGOS_TEST_ROLE", "nest").env("FGOS_TEST_DIR", &dir);
            let nest = nest.spawn().unwrap();
            write_pid(&dir, "nest.pid", nest.id());
            loop { std::thread::sleep(Duration::from_secs(3600)); }
        }
        "nest" => {
            let grandchild = helper_command().creation_flags(0).spawn().unwrap();
            write_pid(&dir, "grandchild.pid", grandchild.id());
            loop { std::thread::sleep(Duration::from_secs(3600)); }
        }
        "exit" => {
            let code: i32 = std::env::var("FGOS_TEST_EXIT_CODE").ok().and_then(|c| c.parse().ok()).unwrap_or(0);
            std::process::exit(code);
        }
        "lingering" => {
            let _grandchild = helper_command().creation_flags(0x0000_0008).spawn().unwrap();
            std::process::exit(0);
        }
        "echo" => {
            use std::io::BufRead;
            let stdin = std::io::stdin();
            let mut line = String::new();
            let _ = stdin.lock().read_line(&mut line);
            println!("stdin:{}", line.trim_end());
            println!("cwd:{}", std::env::current_dir().unwrap().display());
            println!("a:{}", std::env::var("FGOS_CONF_A").unwrap_or_default());
            println!("b:{}", std::env::var("FGOS_CONF_B").unwrap_or_default());
            eprintln!("err:out");
            std::process::exit(7);
        }
        "breakaway" => {
            let outcome = match helper_command().creation_flags(0x0100_0000).spawn() {
                Ok(child) => format!("allowed {}", child.id()),
                Err(_) => "denied".to_string(),
            };
            fs::write(dir.join("breakaway.txt"), outcome).unwrap();
            loop { std::thread::sleep(Duration::from_secs(3600)); }
        }
        "holder" => {
            let job = fgos_process::platform::windows_job::open_job(&std::env::var("FGOS_TEST_JOB").unwrap()).unwrap();
            let agent = helper_command().creation_flags(0).spawn().unwrap();
            write_pid(&dir, "agent.pid", agent.id());
            write_pid(&dir, "gate.pid", std::process::id());
            let _keep = job;
            loop { std::thread::sleep(Duration::from_secs(3600)); }
        }
        "supervisor" => {
            let driver = fgos_process::containment::WindowsJobDriver;
            let mut domain = driver.create("attempt-supervisor").unwrap();
            let job = fgos_process::containment::WindowsJobDriver::job_name(&domain).unwrap().to_string();
            let _spawned = driver.spawn_in(&mut domain, win_spec("holder", &dir, &[("FGOS_TEST_JOB", &job)])).unwrap();
            write_pid(&dir, "supervisor.pid", std::process::id());
            loop { std::thread::sleep(Duration::from_secs(3600)); }
        }
        other => panic!("unknown role {other}"),
    }
}
