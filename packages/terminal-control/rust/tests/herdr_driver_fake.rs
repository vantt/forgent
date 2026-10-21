//! The herdr driver against a fake `herdr` binary (`FGOS_HERDR_BIN` style):
//! argv per capability, absent and hung herdr, incarnation over a real socket.

use fgos_terminal_control::driver::herdr::{HerdrConfig, HerdrDriver};
use fgos_terminal_control::driver::*;
use fgos_terminal_control::port::{Refusal, ServerIncarnation};
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU32, Ordering};

fn fake_bin() -> String {
    format!("{}/tests/fixtures/herdr/fake-herdr.sh", env!("CARGO_MANIFEST_DIR"))
}

fn scratch(name: &str) -> PathBuf {
    static N: AtomicU32 = AtomicU32::new(0);
    let dir = std::env::temp_dir().join(format!("tcd-{}-{}-{name}", std::process::id(), N.fetch_add(1, Ordering::SeqCst)));
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

struct Fake {
    dir: PathBuf,
    config: HerdrConfig,
}

impl Fake {
    fn new(name: &str) -> Self {
        let dir = scratch(name);
        let mut config = HerdrConfig::new(fake_bin());
        config.timeout_ms = 5_000;
        config.env.push(("FAKE_HERDR_LOG".into(), dir.join("log").to_string_lossy().into_owned()));
        Fake { dir, config }
    }

    fn env(mut self, key: &str, value: &str) -> Self {
        self.config.env.push((key.into(), value.into()));
        self
    }

    fn driver(&self) -> HerdrDriver {
        HerdrDriver::new(self.config.clone())
    }

    /// Argv of every logged call, arguments joined by a space.
    fn calls(&self) -> Vec<String> {
        std::fs::read_to_string(self.dir.join("log"))
            .unwrap_or_default()
            .lines()
            .map(|l| l.trim_end_matches('\t').replace('\t', " "))
            .collect()
    }
}

impl Drop for Fake {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.dir);
    }
}

fn is_unsupported<T: std::fmt::Debug>(r: DriverResult<T>) -> bool {
    matches!(r, Err(Refusal::Unsupported { .. }))
}

fn is_unknown<T: std::fmt::Debug>(r: DriverResult<T>) -> bool {
    matches!(r, Err(Refusal::Unknown { .. }))
}

#[test]
fn declares_what_herdr_can_do_after_one_probe() {
    let fake = Fake::new("caps");
    let driver = fake.driver();
    let caps = driver.capabilities();
    for expected in ["tab.create", "pane.split", "pane.close", "pane.run", "send.text", "send.keys", "read.screen", "process.info", "activity.state", "label", "layout.geometry"] {
        assert!(caps.contains(&expected), "{expected} missing from {caps:?}");
    }
    assert_eq!(caps.contains(&"server.incarnation"), cfg!(unix));
    for never in ["pane.resize", "pane.swap", "pane.move"] {
        assert!(!caps.contains(&never), "{never} is not implemented");
    }
    assert!(caps.iter().all(|c| CAPABILITIES.contains(c)));
    // The probe ran two commands; declaring again asks nothing more.
    let probed = fake.calls().len();
    let _ = driver.capabilities();
    assert_eq!(fake.calls().len(), probed);
    assert_eq!(fake.calls(), vec!["--version".to_string(), "pane layout --help".to_string()]);
}

#[test]
fn each_capability_runs_the_expected_command() {
    let fake = Fake::new("argv");
    let d = fake.driver();

    let tab = d.tab_create("lead-1", Some("/work"), &[("HOME".to_string(), "/h".to_string())]).unwrap();
    assert_eq!((tab.tab_id.as_str(), tab.pane_id.as_str()), ("wS:tF9", "wS:p59X"));
    let pane = d.pane_split("wS:p59X", Direction::Down, 0.3, Some("/w2"), &[("A".to_string(), "b".to_string())]).unwrap();
    assert_eq!(pane.pane_id, "wS:p59Y");
    d.pane_run("wS:p59Y", "sh /tmp/launch.sh").unwrap();
    d.send_text("wS:p59Y", "hello world", true).unwrap();
    d.send_text("wS:p59Y", "draft", false).unwrap();
    let seen = d.activity_detail("wS:p59Y").unwrap();
    assert_eq!((seen.state.as_deref(), seen.visible_idle, seen.visible_working), (Some("idle"), true, false));
    assert_eq!((seen.matched_rule.as_deref(), seen.prompt_text.as_str()), (Some("live_prompt_box"), "❯ half typed\n"));
    d.report_agent("wS:p59Y", "claude", "working").unwrap();
    d.send_keys("wS:p59Y", &["Escape".into(), "Enter".into()]).unwrap();
    assert_eq!(d.read_screen("wS:p59Y", Some(40), Some("visible")).unwrap(), "line one\nline two\n");
    assert_eq!(d.process_info("wS:p59Y").unwrap().shell_pid, 2785881);
    assert_eq!(d.activity("wS:p59Y").unwrap().state, "working");
    d.activity_start("wS:p59Y", "seat-1", "claude", &["--model".into(), "opus".into()], 30_000).unwrap();
    d.label_tab("wS:tF9", "fgos lead").unwrap();
    d.label_pane("wS:p59Y", "seat 1").unwrap();
    assert_eq!(d.pane_liveness("wS:p59Y").unwrap(), PaneLiveness::Live);
    assert_eq!(d.layout_geometry("wS:p59Y").unwrap().panes.len(), 2);

    let calls: Vec<String> = fake.calls().into_iter().skip(2).collect();
    let expect = [
        "tab create --label lead-1 --no-focus --cwd /work --env HOME=/h",
        "pane split --pane wS:p59X --direction down --ratio 0.3 --no-focus --cwd /w2 --env A=b",
        "pane run wS:p59Y sh /tmp/launch.sh",
        "agent prompt wS:p59Y hello world",
        "pane send-text wS:p59Y draft",
        "agent explain wS:p59Y --json",
        "pane report-agent wS:p59Y --source fgos --agent claude --state working",
        "pane send-keys wS:p59Y Escape Enter",
        "pane read wS:p59Y --lines 40 --source visible",
        "pane process-info --pane wS:p59Y",
        "agent get wS:p59Y",
        "agent start seat-1 --kind claude --pane wS:p59Y --timeout 30000 -- --model opus",
        "tab rename wS:tF9 fgos lead",
        "pane rename wS:p59Y seat 1",
        "pane get wS:p59Y",
        "pane layout --pane wS:p59Y",
    ];
    assert_eq!(&calls[..expect.len()], &expect);
}

#[test]
fn split_ratio_is_the_share_the_existing_pane_keeps() {
    let fake = Fake::new("ratio");
    fake.driver().pane_split("wS:p59X", Direction::Right, 0.5, None, &[]).unwrap();
    assert!(fake.calls().iter().any(|c| c.contains("--direction right --ratio 0.5")));
}

#[test]
fn session_and_socket_reach_herdr_through_its_environment() {
    let dir = scratch("env");
    let mut config = HerdrConfig::new(fake_bin());
    config.session = Some("confined-1".into());
    config.env.push(("FAKE_HERDR_LOG".into(), dir.join("log").to_string_lossy().into_owned()));
    config.timeout_ms = 5_000;
    // `status server` is the one command that takes the session as an argument.
    config.socket_path = None;
    config.env.push(("FAKE_HERDR_SOCKET".into(), "/nonexistent/herdr.sock".into()));
    let driver = HerdrDriver::new(config);
    let _ = driver.server_incarnation();
    let log = std::fs::read_to_string(dir.join("log")).unwrap();
    assert!(log.contains("--session\tconfined-1\tstatus\tserver\t--json"), "{log}");
    let _ = std::fs::remove_dir_all(&dir);
}

#[test]
fn absent_herdr_declares_nothing_and_every_op_is_unsupported() {
    let mut config = HerdrConfig::new("/nonexistent/herdr-bin");
    config.timeout_ms = 1_000;
    let d = HerdrDriver::new(config);
    assert!(d.capabilities().is_empty());
    assert!(is_unsupported(d.tab_create("x", None, &[])));
    assert!(is_unsupported(d.pane_split("p", Direction::Down, 0.5, None, &[])));
    assert!(is_unsupported(d.read_screen("p", None, None)));
    assert!(is_unsupported(d.layout_geometry("p")));
    assert!(is_unsupported(d.server_incarnation()));
    assert!(is_unsupported(d.pane_liveness("p")));
}

#[test]
fn a_hung_herdr_command_is_unknown_after_the_timeout() {
    for hung in ["agent get", "pane get"] {
        let mut fake = Fake::new("hang").env("FAKE_HERDR_HANG", hung);
        fake.config.timeout_ms = 400;
        let d = fake.driver();
        let started = std::time::Instant::now();
        let refused = if hung == "agent get" { is_unknown(d.activity("wS:p59Y")) } else { is_unknown(d.pane_liveness("wS:p59Y")) };
        assert!(refused, "a hang of `{hung}` is never read as gone or idle");
        assert!(started.elapsed() < std::time::Duration::from_secs(5));
    }
}

#[test]
fn an_unreadable_answer_is_unknown() {
    let fake = Fake::new("garbled").env("FAKE_HERDR_GARBLE", "1");
    let d = fake.driver();
    assert!(is_unknown(d.activity("wS:p59Y")));
    assert!(is_unknown(d.process_info("wS:p59Y")));
    assert!(is_unknown(d.layout_geometry("wS:p59Y")));
    assert!(is_unknown(d.pane_liveness("wS:p59Y")), "unreadable is never read as gone");
}

#[test]
fn a_missing_pane_is_gone_only_when_herdr_says_so() {
    let fake = Fake::new("gone").env("FAKE_HERDR_PANE_GONE", "1");
    let d = fake.driver();
    assert_eq!(d.pane_liveness("wS:p59Y").unwrap(), PaneLiveness::Gone);
    assert!(is_unknown(d.activity("wS:p59Y")));
}

#[cfg(target_os = "linux")]
#[test]
fn commands_do_not_inherit_the_callers_descriptors() {
    let mut pipe = [0i32; 2];
    // SAFETY: plain pipe(2) into a two-int array.
    assert_eq!(unsafe { libc::pipe(pipe.as_mut_ptr()) }, 0);
    // High, inheritable copies: low numbers collide with the shell's own script fd.
    // SAFETY: F_DUPFD on the open pipe ends; the originals are closed right after.
    let fds = unsafe { [libc::fcntl(pipe[0], libc::F_DUPFD, 200), libc::fcntl(pipe[1], libc::F_DUPFD, 200)] };
    unsafe {
        libc::close(pipe[0]);
        libc::close(pipe[1]);
    }
    assert!(fds[0] >= 200 && fds[1] >= 200);
    let dir = scratch("fds");
    let dump = dir.join("fds");
    let fake = Fake::new("fds").env("FAKE_HERDR_FDS", &dump.to_string_lossy());
    fake.driver().tab_create("x", None, &[]).unwrap();
    let seen = std::fs::read_to_string(&dump).unwrap();
    let open: Vec<i32> = seen.lines().filter_map(|l| l.trim().parse().ok()).collect();
    // SAFETY: closing the two fds opened above.
    unsafe {
        libc::close(fds[0]);
        libc::close(fds[1]);
    }
    assert!(!open.contains(&fds[0]) && !open.contains(&fds[1]), "leaked {fds:?} into {open:?}");
    let _ = std::fs::remove_dir_all(&dir);
}

#[cfg(windows)]
#[test]
fn windows_declares_nothing() {
    let d = HerdrDriver::new(HerdrConfig::new(fake_bin()));
    assert!(d.capabilities().is_empty());
    assert!(is_unsupported(d.tab_create("x", None, &[])));
}

#[cfg(unix)]
mod incarnation {
    use super::*;
    use std::os::unix::net::UnixListener;
    use std::process::{Child, Command, Stdio};

    /// A listening socket held by another process, so the peer pid differs
    /// from the test's own.
    struct RemoteListener {
        child: Child,
    }

    impl RemoteListener {
        fn start(path: &Path) -> Self {
            let child = Command::new(std::env::current_exe().unwrap())
                .args(["--exact", "incarnation::listener_helper", "--nocapture", "--test-threads=1"])
                .env("TC_LISTEN", path)
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .spawn()
                .unwrap();
            let listener = RemoteListener { child };
            for _ in 0..500 {
                if path.exists() {
                    return listener;
                }
                std::thread::sleep(std::time::Duration::from_millis(10));
            }
            panic!("listener helper never bound {path:?}");
        }
    }

    impl Drop for RemoteListener {
        fn drop(&mut self) {
            let _ = self.child.kill();
            let _ = self.child.wait();
        }
    }

    /// Run as a test, it returns at once. Started by `RemoteListener` with
    /// `TC_LISTEN` set, it listens on that path until killed.
    #[test]
    fn listener_helper() {
        let Some(path) = std::env::var_os("TC_LISTEN") else { return };
        let _listener = UnixListener::bind(&path).unwrap();
        std::thread::sleep(std::time::Duration::from_secs(60));
    }

    fn fake_at(name: &str, socket: &Path) -> Fake {
        let mut fake = Fake::new(name);
        fake.config.socket_path = Some(socket.to_string_lossy().into_owned());
        fake
    }

    #[test]
    fn incarnation_is_the_socket_owner_identified_by_the_os() {
        let fake = Fake::new("inc");
        let sock = fake.dir.join("s");
        let _listener = UnixListener::bind(&sock).unwrap();
        let d = fake_at("inc2", &sock).driver();
        let got = d.server_incarnation().unwrap();

        let own = fgos_process::facts::self_identity().unwrap();
        assert_eq!(got.pid, std::process::id());
        assert_eq!(got.start_time, own.start_time);
        assert_eq!(got.boot_id, own.boot_id.unwrap_or_default());
        assert_eq!(got.pid_ns, own.pid_ns);
        assert_eq!(got.host, own.host);
        assert_eq!(got.endpoint, sock.to_string_lossy());
        // Asking again yields the same tuple.
        assert_eq!(d.server_incarnation().unwrap(), got);
    }

    #[test]
    fn endpoint_falls_back_to_status_server_when_none_is_given() {
        let fake = Fake::new("status");
        let sock = fake.dir.join("s");
        let _listener = UnixListener::bind(&sock).unwrap();
        let fake = fake.env("FAKE_HERDR_SOCKET", &sock.to_string_lossy());
        let got = fake.driver().server_incarnation().unwrap();
        assert_eq!(got.endpoint, sock.to_string_lossy());
        assert_eq!(got.pid, std::process::id());
    }

    #[test]
    fn an_unreachable_socket_is_unknown() {
        let fake = Fake::new("dead");
        let d = fake_at("dead2", &fake.dir.join("nobody-listens")).driver();
        assert!(is_unknown(d.server_incarnation()));
    }

    #[test]
    fn close_runs_when_the_incarnation_is_unchanged() {
        let fake = Fake::new("close-ok");
        let sock = fake.dir.join("s");
        let _listener = UnixListener::bind(&sock).unwrap();
        let fake = fake_at("close-ok2", &sock);
        let d = fake.driver();
        let inc = d.server_incarnation().unwrap();
        assert_eq!(d.pane_close("wS:p59Y", &inc).unwrap(), CloseOutcome::Closed);
        assert!(fake.calls().iter().any(|c| c == "pane close wS:p59Y"));
    }

    #[test]
    fn close_of_a_vanished_pane_reports_already_gone() {
        let fake = Fake::new("close-gone");
        let sock = fake.dir.join("s");
        let _listener = UnixListener::bind(&sock).unwrap();
        let fake = fake_at("close-gone2", &sock).env("FAKE_HERDR_PANE_GONE", "1");
        let d = fake.driver();
        let inc = d.server_incarnation().unwrap();
        assert_eq!(d.pane_close("wS:p59Y", &inc).unwrap(), CloseOutcome::AlreadyGone);
    }

    #[test]
    fn close_is_refused_when_the_expected_incarnation_is_not_the_live_one() {
        let fake = Fake::new("close-stale");
        let sock = fake.dir.join("s");
        let _listener = UnixListener::bind(&sock).unwrap();
        let fake = fake_at("close-stale2", &sock);
        let d = fake.driver();
        let mut stale: ServerIncarnation = d.server_incarnation().unwrap();
        stale.pid += 1;
        assert!(is_unknown(d.pane_close("wS:p59Y", &stale)));
        assert!(!fake.calls().iter().any(|c| c.starts_with("pane close")), "a stale incarnation must not reach herdr");
    }

    #[test]
    fn a_server_swapped_while_closing_is_unknown() {
        let dir = scratch("swap");
        let (first, second) = (dir.join("a"), dir.join("b"));
        let _a = RemoteListener::start(&first);
        let _b = RemoteListener::start(&second);
        let mut fake = Fake::new("swap");
        fake.config.socket_path = Some(first.to_string_lossy().into_owned());
        let fake = fake.env("FAKE_HERDR_ON_CLOSE", &format!("mv -f {} {}", second.display(), first.display()));
        let d = fake.driver();
        let before = d.server_incarnation().unwrap();
        assert_ne!(before.pid, std::process::id());

        let outcome = d.pane_close("wS:p59Y", &before);
        assert!(is_unknown(outcome), "the other server answered after the close; nothing may be called closed");
        assert!(fake.calls().iter().any(|c| c == "pane close wS:p59Y"), "the close itself was issued once");
        assert_eq!(fake.calls().iter().filter(|c| c.starts_with("pane close")).count(), 1, "never closed a second time");
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn a_brief_sent_to_a_pane_whose_shell_holds_the_foreground_is_not_typed_and_nothing_runs() {
        use fgos_terminal_control::core::{Core, CoreConfig};
        use fgos_terminal_control::policy::{measured_split::MeasuredSplit, Limits};
        use fgos_terminal_control::port::{AllocateRequest, Display, SendOutcome};

        let fake = Fake::new("shell-fg");
        let sock = fake.dir.join("s");
        let _listener = UnixListener::bind(&sock).unwrap();
        // The pane's shell is its only foreground process, and this fake's shell runs what is typed at it.
        let fake = fake_at("shell-fg2", &sock).env("FAKE_HERDR_FOREGROUND", "shell");
        let driver = fake.driver();
        let config = CoreConfig { state_root: fake.dir.join("state"), limits: Limits { min_cols: 1, min_rows: 1, max_panes_per_tab: 4 }, allocation_grace_ms: 60_000, launch_identify_timeout_ms: 200 };
        let core = Core::new(&driver, &MeasuredSplit, config);
        core.allocate(&AllocateRequest { key: "k".into(), group_key: "g".into(), display: Display { label: "shell-fg".into(), ..Default::default() }, role_hint: None, cwd: None, env: Default::default() }).unwrap();

        let typed = fake.dir.join("typed");
        let prompted = fake.dir.join("prompted");
        let brief = |marker: &Path| format!("# Brief 1\n\nWrite it as `touch {}` first, then rename it.\n", marker.display());
        for (marker, submit) in [(&typed, false), (&prompted, true)] {
            match core.send("k", Some(&brief(marker)), None, submit).unwrap() {
                SendOutcome::ForegroundNotAgent { reason } => assert!(reason.contains("shell"), "{reason}"),
                other => panic!("a shell in the foreground must refuse the send (submit {submit}), got {other:?}"),
            }
        }
        assert!(matches!(core.send("k", None, Some(&["Enter".to_string()]), false).unwrap(), SendOutcome::ForegroundNotAgent { .. }));
        let sends: Vec<String> = fake.calls().into_iter().filter(|c| c.starts_with("pane send") || c.starts_with("agent prompt")).collect();
        assert!(sends.is_empty(), "nothing may be typed at the shell: {sends:?}");
        assert!(!typed.exists() && !prompted.exists(), "the backtick span ran");

        // The control: the same text typed past the core reaches this pane's shell, and the span runs.
        let control = fake.dir.join("control");
        driver.send_text("wS:p59X", &brief(&control), false).unwrap();
        assert!(control.exists(), "the fake's shell must run typed text, or the check above proves nothing");
    }
}

#[test]
fn a_session_without_a_workspace_gets_one_and_its_root_pane_is_the_first_pane() {
    let fake = Fake::new("no-workspace").env("FAKE_HERDR_NO_WORKSPACE", "1");
    let created = fake.driver().tab_create("lead-1", Some("/work"), &[]).unwrap();
    assert_eq!((created.tab_id.as_str(), created.pane_id.as_str()), ("wS:tF9", "wS:p59X"));
    let calls: Vec<String> = fake.calls().into_iter().skip(2).collect();
    assert_eq!(
        calls,
        [
            "tab create --label lead-1 --no-focus --cwd /work",
            "workspace create --label lead-1 --no-focus --cwd /work",
            "tab rename wS:tF9 lead-1",
        ]
    );
}

#[test]
fn a_screen_comes_back_as_plain_text_or_in_the_envelope_and_a_failure_is_named() {
    let plain = Fake::new("read-plain");
    assert_eq!(plain.driver().read_screen("wS:p59Y", Some(60), None).unwrap(), "line one\nline two\n");
    assert!(plain.calls().iter().any(|c| c == "pane read wS:p59Y --lines 60"));

    let enveloped = Fake::new("read-json").env("FAKE_HERDR_READ_JSON", "1");
    assert_eq!(enveloped.driver().read_screen("wS:p59Y", None, None).unwrap(), "enveloped screen");

    let failing = Fake::new("read-fail").env("FAKE_HERDR_PANE_GONE", "1");
    match failing.driver().read_screen("wS:p59Y", None, None) {
        Err(Refusal::Unknown { reason }) => assert!(reason.contains("pane_not_found"), "{reason}"),
        other => panic!("a failed read must be a named refusal, got {other:?}"),
    }
}

#[test]
fn a_pane_with_no_recognised_agent_answers_unknown_state_while_a_failed_read_stays_a_refusal() {
    let none = Fake::new("no-agent").env("FAKE_HERDR_AGENT_NOT_FOUND", "1");
    let activity = none.driver().activity("wS:p59Y").unwrap();
    assert_eq!((activity.state.as_str(), activity.agent), ("unknown", None));

    let failing = Fake::new("agent-get-garbled").env("FAKE_HERDR_GARBLE", "1");
    assert!(is_unknown(failing.driver().activity("wS:p59Y")), "an unreadable answer is not \"no agent\"");
}
