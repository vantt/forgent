use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use fgos_process::containment::{SpawnSpec, StartMode};
#[cfg(target_os = "linux")]
use std::sync::LazyLock;

pub fn scratch(name: &str) -> PathBuf {
    let nanos = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos();
    let dir = std::env::temp_dir().join(format!("fgos-test-{name}-{}-{}", std::process::id(), nanos));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

pub fn wait_for(path: &Path) -> String {
    let start = Instant::now();
    loop {
        if let Ok(text) = fs::read_to_string(path) {
            if !text.trim().is_empty() { return text; }
        }
        assert!(start.elapsed() < Duration::from_secs(20), "timeout: {}", path.display());
        std::thread::sleep(Duration::from_millis(10));
    }
}

pub fn spec(argv: impl IntoIterator<Item = impl AsRef<str>>) -> SpawnSpec {
    SpawnSpec {
        argv: argv.into_iter().map(|a| a.as_ref().to_string()).collect(),
        bwrap_prefix: None,
        fd_map: Vec::new(),
        env: BTreeMap::from([("PATH".into(), "/usr/bin:/bin".into())]),
        cwd: std::env::temp_dir(),
        stdin: None,
        stdout: None,
        stderr: None,
        mode: StartMode::Direct,
    }
}

#[cfg(target_os = "linux")]
pub fn require_bwrap() -> Option<PathBuf> {
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
        match std::process::Command::new(&bwrap)
            .args(["--unshare-user", "--unshare-pid", "--as-pid-1", "--dev-bind", "/", "/", "--proc", "/proc", "--", "/bin/true"])
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::piped())
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

#[cfg(windows)]
pub fn helper_argv() -> Vec<String> {
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
pub fn win_spec(role: &str, dir: &Path, extra: &[(&str, &str)]) -> SpawnSpec {
    let mut s = spec(helper_argv());
    s.cwd = dir.to_path_buf();
    s.env = std::env::vars().collect();
    s.env.insert("FGOS_TEST_ROLE".into(), role.into());
    s.env.insert("FGOS_TEST_DIR".into(), dir.display().to_string());
    for (k, v) in extra {
        s.env.insert((*k).into(), (*v).into());
    }
    s
}

#[cfg(windows)]
fn write_pid(dir: &Path, name: &str, pid: u32) {
    let tmp = dir.join(format!("{name}.tmp"));
    let _ = fs::write(&tmp, pid.to_string());
    let _ = fs::rename(&tmp, dir.join(name));
}

#[cfg(windows)]
pub fn run_helper_role() {
    use std::io::BufRead;
    use std::os::windows::process::CommandExt;
    let Ok(role) = std::env::var("FGOS_TEST_ROLE") else { return; };
    let dir = PathBuf::from(std::env::var("FGOS_TEST_DIR").unwrap());
    match role.as_str() {
        "sleep" => loop { std::thread::sleep(Duration::from_secs(3600)); },
        "tree" => {
            let child = helper_command().creation_flags(0).spawn().unwrap();
            write_pid(&dir, "child.pid", child.id());
            let detached = helper_command().creation_flags(0x0000_0008).spawn().unwrap();
            write_pid(&dir, "detached.pid", detached.id());
            let nest = helper_command().env("FGOS_TEST_ROLE", "nest").env("FGOS_TEST_DIR", &dir).spawn().unwrap();
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
            let _ = helper_command().creation_flags(0x0000_0008).spawn().unwrap();
            std::process::exit(0);
        }
        "echo" => {
            let mut line = String::new();
            let _ = std::io::stdin().lock().read_line(&mut line);
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
            let _ = fs::write(dir.join("breakaway.txt"), outcome);
            loop { std::thread::sleep(Duration::from_secs(3600)); }
        }
        "holder" => {
            let _keep = fgos_process::platform::windows_job::open_job(&std::env::var("FGOS_TEST_JOB").unwrap()).unwrap();
            let agent = helper_command().creation_flags(0).spawn().unwrap();
            write_pid(&dir, "agent.pid", agent.id());
            write_pid(&dir, "gate.pid", std::process::id());
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
