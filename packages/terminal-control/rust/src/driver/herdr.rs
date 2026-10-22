//! herdr driver: runs the `herdr` CLI and reads its JSON.
//!
//! The binary path comes from the caller (`FGOS_HERDR_BIN` or `herdr`); a
//! session and socket path, when given, are passed through the environment
//! the way the Node round code does today. Every command has a timeout.
//! An absent binary is `Unsupported`; a timeout, unreadable output or a
//! herdr error is `Unknown`, never closed or gone. No descriptor outlives a
//! command: the child is spawned through the Process descriptor door, which closes
//! every inheritable fd >= 3, and the pipes are dropped when the command
//! returns.

use super::{
    Activity, ActivityDetail, CloseOutcome, CreatedPane, Direction, DriverResult, ForegroundProcess, PaneGeometry,
    PaneLiveness, ProcessInfo, PtySize, Rect, TabGeometry, TerminalDriver,
};
use crate::port::{Refusal, ServerIncarnation};
use serde_json::Value;
use std::cell::RefCell;
use std::io::Read;
use std::process::{Command, Stdio};
use std::sync::mpsc;
use std::time::{Duration, Instant};

pub const DEFAULT_TIMEOUT_MS: u64 = 15_000;
const CLOSE_TIMEOUT_MS: u64 = 5_000;
const READER_GRACE: Duration = Duration::from_secs(2);

/// How to reach one herdr.
#[derive(Debug, Clone, Default)]
pub struct HerdrConfig {
    /// Binary path from the caller; empty means `herdr`.
    pub bin: String,
    /// `HERDR_SESSION` of a confined round, when there is one.
    pub session: Option<String>,
    /// `HERDR_SOCKET_PATH`: the endpoint the CLI follows. Without it the
    /// incarnation asks `herdr status server`.
    pub socket_path: Option<String>,
    /// Per-command timeout; 0 means [`DEFAULT_TIMEOUT_MS`].
    pub timeout_ms: u64,
    /// Extra environment for every command.
    pub env: Vec<(String, String)>,
}

impl HerdrConfig {
    pub fn new(bin: impl Into<String>) -> Self {
        HerdrConfig { bin: bin.into(), ..Default::default() }
    }

    fn bin(&self) -> &str {
        if self.bin.is_empty() {
            "herdr"
        } else {
            &self.bin
        }
    }

    fn timeout(&self) -> Duration {
        Duration::from_millis(if self.timeout_ms == 0 { DEFAULT_TIMEOUT_MS } else { self.timeout_ms })
    }
}

// ---------------------------------------------------------------- JSON shapes

/// `{"error":{"code","message"}}` as herdr answers a failed command.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HerdrError {
    pub code: String,
    pub message: String,
}

/// The `result` of a success envelope, or the body itself when herdr answers
/// without one (`status server`); the error of a failure envelope.
pub fn envelope(body: &Value) -> Result<Value, HerdrError> {
    if let Some(err) = body.get("error").filter(|e| e.is_object()) {
        return Err(HerdrError {
            code: err.get("code").and_then(Value::as_str).unwrap_or("herdr_error").to_string(),
            message: err.get("message").and_then(Value::as_str).unwrap_or_default().to_string(),
        });
    }
    Ok(body.get("result").cloned().unwrap_or_else(|| body.clone()))
}

fn text<'a>(v: &'a Value, key: &str) -> Option<&'a str> {
    v.get(key).and_then(Value::as_str)
}

fn number(v: &Value, key: &str) -> Option<u32> {
    v.get(key).and_then(Value::as_u64).and_then(|n| u32::try_from(n).ok())
}

fn rect(v: &Value) -> Option<Rect> {
    Some(Rect { x: number(v, "x")?, y: number(v, "y")?, width: number(v, "width")?, height: number(v, "height")? })
}

/// `pane layout`: `layout.area`, `layout.panes[].rect`, `layout.tab_id`.
pub fn parse_layout(result: &Value) -> Option<TabGeometry> {
    let layout = result.get("layout")?;
    let panes = layout
        .get("panes")?
        .as_array()?
        .iter()
        .map(|p| Some(PaneGeometry { pane_id: text(p, "pane_id")?.to_string(), rect: rect(p.get("rect")?)?, pty: None }))
        .collect::<Option<Vec<_>>>()?;
    Some(TabGeometry { tab_id: text(layout, "tab_id")?.to_string(), area: rect(layout.get("area")?)?, panes })
}

/// `tab create`: the new tab and its root pane.
pub fn parse_tab_created(result: &Value) -> Option<CreatedPane> {
    Some(CreatedPane {
        tab_id: text(result.get("tab")?, "tab_id")?.to_string(),
        pane_id: text(result.get("root_pane")?, "pane_id")?.to_string(),
    })
}

/// `pane split`: the new pane and the tab it landed in.
pub fn parse_split(result: &Value) -> Option<CreatedPane> {
    let pane = result.get("pane")?;
    Some(CreatedPane { tab_id: text(pane, "tab_id")?.to_string(), pane_id: text(pane, "pane_id")?.to_string() })
}

/// `pane process-info`.
pub fn parse_process_info(result: &Value) -> Option<ProcessInfo> {
    let info = result.get("process_info")?;
    // herdr leaves `argv` out for a process with no command line, which is a
    // zombie waiting to be reaped: it holds nothing, so it is not listed.
    let foreground = info
        .get("foreground_processes")?
        .as_array()?
        .iter()
        .filter(|p| p.get("argv").is_some())
        .map(|p| {
            let argv = p.get("argv")?.as_array()?.iter().map(|a| a.as_str().map(str::to_string)).collect::<Option<Vec<_>>>()?;
            Some(ForegroundProcess { pid: number(p, "pid")?, argv })
        })
        .collect::<Option<Vec<_>>>()?;
    Some(ProcessInfo { shell_pid: number(info, "shell_pid")?, foreground_pgid: number(info, "foreground_process_group_id")?, foreground })
}

/// `agent get` (or `pane get`): what herdr's agent detection says about the pane.
pub fn parse_activity(result: &Value) -> Option<Activity> {
    let pane = result.get("agent").or_else(|| result.get("pane"))?;
    Some(Activity {
        state: text(pane, "agent_status")?.to_string(),
        agent: text(pane, "agent").map(str::to_string),
        session: pane.pointer("/agent_session/value").and_then(Value::as_str).map(str::to_string),
        detail: None,
    })
}

/// `agent explain --json`: the screen detector's verdict. herdr answers the
/// verdict as the body itself, or wrapped in `result`.
pub fn parse_explain(body: &Value) -> ActivityDetail {
    let verdict = body.get("result").filter(|r| r.is_object() && body.get("state").is_none()).unwrap_or(body);
    let flag = |name: &str| verdict.get(name).and_then(Value::as_bool) == Some(true);
    let matched = verdict.pointer("/matched_rule/id").and_then(Value::as_str).filter(|s| !s.is_empty());
    let prompt_text = matched
        .and_then(|id| {
            verdict
                .get("evaluated_rules")?
                .as_array()?
                .iter()
                .find(|r| r.get("matched").and_then(Value::as_bool) == Some(true) && r.get("id").and_then(Value::as_str) == Some(id))
        })
        .and_then(|r| r.pointer("/evidence/region_preview"))
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string();
    ActivityDetail {
        state: verdict.get("state").and_then(Value::as_str).map(str::to_string),
        visible_blocker: flag("visible_blocker"),
        visible_idle: flag("visible_idle"),
        visible_working: flag("visible_working"),
        matched_rule: matched.map(str::to_string),
        prompt_text,
    }
}

/// `status server --json`: the socket the CLI talks to, when the server runs.
pub fn parse_status_socket(result: &Value) -> Option<String> {
    if result.get("running").and_then(Value::as_bool) == Some(false) {
        return None;
    }
    text(result, "socket").map(str::to_string)
}

// ------------------------------------------------------------- command runner

struct Output {
    status: Option<i32>,
    stdout: String,
    stderr: String,
}

enum CallError {
    Refusal(Refusal),
    Herdr(HerdrError),
}

impl CallError {
    fn into_refusal(self) -> Refusal {
        match self {
            CallError::Refusal(r) => r,
            CallError::Herdr(e) => unknown(format!("herdr {}: {}", e.code, e.message)),
        }
    }

    fn is_pane_not_found(&self) -> bool {
        matches!(self, CallError::Herdr(e) if e.code == "pane_not_found")
    }
}

fn unknown(reason: impl Into<String>) -> Refusal {
    Refusal::Unknown { reason: reason.into() }
}

fn unsupported(capability: &str, detail: impl Into<String>) -> Refusal {
    Refusal::Unsupported { capability: capability.into(), detail: detail.into() }
}

fn drain<R: Read + Send + 'static>(mut pipe: R) -> mpsc::Receiver<String> {
    let (tx, rx) = mpsc::channel();
    std::thread::spawn(move || {
        let mut buf = Vec::new();
        let _ = pipe.read_to_end(&mut buf);
        let _ = tx.send(String::from_utf8_lossy(&buf).into_owned());
    });
    rx
}

/// Sleep until the child exits or `left` passes: a wake on its exit
/// descriptor where the kernel has one, a short step elsewhere.
fn wait_for_exit(#[cfg(unix)] exit_fd: Option<&std::os::fd::OwnedFd>, left: Duration) {
    #[cfg(unix)]
    if let Some(fd) = exit_fd {
        use std::os::fd::AsRawFd;
        let mut pfd = libc::pollfd { fd: fd.as_raw_fd(), events: libc::POLLIN, revents: 0 };
        let ms = left.as_millis().clamp(1, libc::c_int::MAX as u128) as libc::c_int;
        // SAFETY: one pollfd on a descriptor the caller owns for the call.
        unsafe { libc::poll(&mut pfd, 1, ms) };
        return;
    }
    std::thread::sleep(left.min(Duration::from_millis(1)));
}

fn exec(config: &HerdrConfig, args: &[&str], timeout: Duration) -> DriverResult<Output> {
    let mut cmd = Command::new(config.bin());
    cmd.args(args).stdin(Stdio::null()).stdout(Stdio::piped()).stderr(Stdio::piped());
    if let Some(session) = &config.session {
        cmd.env("HERDR_SESSION", session);
    }
    if let Some(socket) = &config.socket_path {
        cmd.env("HERDR_SOCKET_PATH", socket);
    }
    cmd.envs(config.env.iter().map(|(k, v)| (k, v)));
    let label = args.iter().take(2).copied().collect::<Vec<_>>().join(" ");
    let mut child = fgos_process::control::spawn_with_fds(cmd, &[]).map_err(|e| match e.kind() {
        std::io::ErrorKind::NotFound => unsupported("herdr", format!("herdr binary \"{}\" not found", config.bin())),
        _ => unknown(format!("herdr {label} could not start: {e}")),
    })?;
    let out = child.stdout.take().map(drain);
    let err = child.stderr.take().map(drain);
    let deadline = Instant::now() + timeout;
    #[cfg(unix)]
    let exit_fd = fgos_process::control::exit_descriptor(child.id());
    let status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break status,
            Ok(None) if Instant::now() >= deadline => {
                let _ = child.kill();
                let _ = child.wait();
                return Err(unknown(format!("herdr {label} timed out after {}ms", timeout.as_millis())));
            }
            Ok(None) => wait_for_exit(
                #[cfg(unix)]
                exit_fd.as_ref(),
                deadline.saturating_duration_since(Instant::now()),
            ),
            Err(e) => return Err(unknown(format!("herdr {label} wait failed: {e}"))),
        }
    };
    let grab = |rx: Option<mpsc::Receiver<String>>| rx.and_then(|r| r.recv_timeout(READER_GRACE).ok()).unwrap_or_default();
    Ok(Output { status: status.code(), stdout: grab(out), stderr: grab(err) })
}

/// The first of stdout and stderr that holds a JSON object: herdr answers on
/// stdout when it succeeds and on stderr when it fails.
fn json_body(out: &Output) -> Option<Value> {
    [&out.stdout, &out.stderr]
        .into_iter()
        .filter(|s| !s.trim().is_empty())
        .find_map(|s| serde_json::from_str::<Value>(s.trim()).ok().filter(Value::is_object))
}

fn call(config: &HerdrConfig, args: &[&str], timeout: Duration) -> Result<Value, CallError> {
    let out = exec(config, args, timeout).map_err(CallError::Refusal)?;
    match json_body(&out) {
        Some(body) => envelope(&body).map_err(CallError::Herdr),
        None if out.status == Some(0) && out.stdout.trim().is_empty() && out.stderr.trim().is_empty() => Ok(Value::Object(Default::default())),
        None => {
            let said: String = out.stdout.trim().chars().chain(out.stderr.trim().chars()).take(200).collect();
            Err(CallError::Refusal(unknown(format!(
                "herdr {} returned no parseable JSON (exit {}): {said}",
                args.iter().take(2).copied().collect::<Vec<_>>().join(" "),
                out.status.map_or("none".into(), |c| c.to_string()),
            ))))
        }
    }
}

// --------------------------------------------------------------------- driver

pub struct HerdrDriver {
    config: HerdrConfig,
    caps: Vec<&'static str>,
    /// Why `caps` is empty, when it is.
    absent: Option<String>,
    endpoint: RefCell<Option<String>>,
}

impl HerdrDriver {
    /// Probe herdr once: `--version` runs and `pane layout` exists. A herdr
    /// that is missing, hangs or does not answer declares no capability.
    pub fn new(config: HerdrConfig) -> Self {
        let (caps, absent) = probe(&config);
        HerdrDriver { config, caps, absent, endpoint: RefCell::new(None) }
    }

    fn require(&self, capability: &str) -> DriverResult<()> {
        if self.caps.contains(&capability) {
            return Ok(());
        }
        let why = self.absent.clone().unwrap_or_else(|| format!("herdr driver does not declare {capability}"));
        Err(unsupported(capability, why))
    }

    fn call(&self, args: &[&str]) -> Result<Value, CallError> {
        call(&self.config, args, self.config.timeout())
    }

    fn run(&self, args: &[&str]) -> DriverResult<Value> {
        self.call(args).map_err(CallError::into_refusal)
    }

    fn endpoint(&self) -> DriverResult<String> {
        if let Some(known) = self.endpoint.borrow().clone() {
            return Ok(known);
        }
        // Without a socket from the caller the CLI itself says which socket it
        // follows (it honors `HERDR_SOCKET_PATH` from the inherited environment).
        let endpoint = match self.config.socket_path.clone().filter(|p| !p.is_empty()) {
            Some(path) => path,
            None => {
                let mut args = vec![];
                if let Some(session) = &self.config.session {
                    args.extend(["--session", session.as_str()]);
                }
                args.extend(["status", "server", "--json"]);
                let status = self.run(&args)?;
                parse_status_socket(&status).ok_or_else(|| unknown("herdr status server reports no running socket"))?
            }
        };
        *self.endpoint.borrow_mut() = Some(endpoint.clone());
        Ok(endpoint)
    }

    /// Real pty size of a pane, when the OS lets this process ask.
    fn pane_pty(&self, pane: &str) -> Option<PtySize> {
        let info = self.process_info(pane).ok()?;
        pty_size(info.shell_pid)
    }
}

fn env_pairs(env: &[(String, String)]) -> Vec<String> {
    env.iter().map(|(k, v)| format!("{k}={v}")).collect()
}

fn probe(config: &HerdrConfig) -> (Vec<&'static str>, Option<String>) {
    if cfg!(windows) {
        return (vec![], Some("herdr is not supported on this platform".into()));
    }
    let timeout = config.timeout();
    match exec(config, &["--version"], timeout) {
        Ok(out) if out.status == Some(0) => {}
        Ok(out) => return (vec![], Some(format!("herdr --version exited {}", out.status.map_or("none".into(), |c| c.to_string())))),
        Err(Refusal::Unsupported { detail, .. }) => return (vec![], Some(detail)),
        Err(Refusal::Unknown { reason }) => return (vec![], Some(reason)),
    }
    let mut caps = vec![
        "tab.create",
        "pane.split",
        "pane.close",
        "pane.run",
        "send.text",
        "send.keys",
        "read.screen",
        "process.info",
        "activity.state",
        "label",
    ];
    if matches!(exec(config, &["pane", "layout", "--help"], timeout), Ok(out) if out.status == Some(0)) {
        caps.push("layout.geometry");
    }
    if cfg!(unix) {
        caps.push("server.incarnation");
    }
    (caps, None)
}

impl TerminalDriver for HerdrDriver {
    fn name(&self) -> &'static str {
        "herdr"
    }

    fn capabilities(&self) -> Vec<&'static str> {
        self.caps.clone()
    }

    fn server_incarnation(&self) -> DriverResult<ServerIncarnation> {
        self.require("server.incarnation")?;
        let endpoint = self.endpoint()?;
        let pid = peer_pid(&endpoint)?;
        let tuple = fgos_process::facts::identity_of(fgos_process::ProcId(pid))
            .ok_or_else(|| unknown(format!("herdr server pid {pid} is not observable")))?;
        Ok(ServerIncarnation {
            host: tuple.host,
            boot_id: tuple.boot_id.unwrap_or_default(),
            pid_ns: tuple.pid_ns,
            pid,
            start_time: tuple.start_time,
            endpoint,
        })
    }

    fn tab_create(&self, label: &str, cwd: Option<&str>, env: &[(String, String)]) -> DriverResult<CreatedPane> {
        self.require("tab.create")?;
        let mut args = vec!["tab", "create", "--label", label, "--no-focus"];
        if let Some(cwd) = cwd {
            args.extend(["--cwd", cwd]);
        }
        let pairs = env_pairs(env);
        for pair in &pairs {
            args.extend(["--env", pair]);
        }
        let result = match self.call(&args) {
            Ok(result) => result,
            // A session that has just started has no workspace to hold a tab:
            // its first workspace comes with a tab and a root pane, which is
            // the group's first pane, and the tab takes the group's label.
            Err(CallError::Herdr(e)) if e.code == "workspace_not_found" => {
                let mut ws = vec!["workspace", "create", "--label", label, "--no-focus"];
                if let Some(cwd) = cwd {
                    ws.extend(["--cwd", cwd]);
                }
                for pair in &pairs {
                    ws.extend(["--env", pair]);
                }
                let created = self.run(&ws)?;
                let pane = parse_tab_created(&created).ok_or_else(|| unknown("herdr workspace create returned no tab_id/pane_id"))?;
                let _ = self.run(&["tab", "rename", &pane.tab_id, label]);
                return Ok(pane);
            }
            Err(other) => return Err(other.into_refusal()),
        };
        parse_tab_created(&result).ok_or_else(|| unknown("herdr tab create returned no tab_id/pane_id"))
    }

    fn pane_split(&self, anchor_pane: &str, direction: Direction, ratio: f64, cwd: Option<&str>, env: &[(String, String)]) -> DriverResult<CreatedPane> {
        self.require("pane.split")?;
        let direction = match direction {
            Direction::Right => "right",
            Direction::Down => "down",
        };
        let ratio = ratio.to_string();
        let mut args = vec!["pane", "split", "--pane", anchor_pane, "--direction", direction, "--ratio", &ratio, "--no-focus"];
        if let Some(cwd) = cwd {
            args.extend(["--cwd", cwd]);
        }
        let pairs = env_pairs(env);
        for pair in &pairs {
            args.extend(["--env", pair]);
        }
        let result = self.run(&args)?;
        parse_split(&result).ok_or_else(|| unknown("herdr pane split returned no pane_id"))
    }

    fn pane_close(&self, pane: &str, expected: &ServerIncarnation) -> DriverResult<CloseOutcome> {
        self.require("pane.close")?;
        self.require("server.incarnation")?;
        if &self.server_incarnation()? != expected {
            return Err(unknown("herdr server incarnation changed before close; pane kept"));
        }
        let timeout = self.config.timeout().min(Duration::from_millis(CLOSE_TIMEOUT_MS));
        match call(&self.config, &["pane", "close", pane], timeout) {
            Ok(_) => {}
            Err(e) if e.is_pane_not_found() => return Ok(CloseOutcome::AlreadyGone),
            Err(e) => return Err(e.into_refusal()),
        }
        match self.server_incarnation() {
            Ok(after) if &after == expected => Ok(CloseOutcome::Closed),
            Ok(_) => Err(unknown("herdr server incarnation changed while the pane was closing")),
            Err(Refusal::Unknown { reason }) => Err(unknown(format!("herdr server incarnation unreadable after close: {reason}"))),
            Err(other) => Err(other),
        }
    }

    fn pane_liveness(&self, pane: &str) -> DriverResult<PaneLiveness> {
        self.require("process.info")?;
        match self.call(&["pane", "get", pane]) {
            Ok(_) => Ok(PaneLiveness::Live),
            Err(e) if e.is_pane_not_found() => Ok(PaneLiveness::Gone),
            Err(e) => Err(e.into_refusal()),
        }
    }

    fn pane_run(&self, pane: &str, command_line: &str) -> DriverResult<()> {
        self.require("pane.run")?;
        self.run(&["pane", "run", pane, command_line]).map(|_| ())
    }

    fn send_text(&self, pane: &str, text: &str, submit: bool) -> DriverResult<()> {
        self.require("send.text")?;
        if submit {
            // The agent's own prompt door: it types and submits, and answers
            // by name when the agent is blocked or not ready.
            self.require("activity.state")?;
            return self.run(&["agent", "prompt", pane, text]).map(|_| ());
        }
        self.run(&["pane", "send-text", pane, text]).map(|_| ())
    }

    fn send_keys(&self, pane: &str, keys: &[String]) -> DriverResult<()> {
        self.require("send.keys")?;
        let mut args = vec!["pane", "send-keys", pane];
        args.extend(keys.iter().map(String::as_str));
        self.run(&args).map(|_| ())
    }

    fn read_screen(&self, pane: &str, lines: Option<u32>, source: Option<&str>) -> DriverResult<String> {
        self.require("read.screen")?;
        let lines = lines.map(|n| n.to_string());
        let mut args = vec!["pane", "read", pane];
        if let Some(lines) = &lines {
            args.extend(["--lines", lines]);
        }
        if let Some(source) = source {
            args.extend(["--source", source]);
        }
        // herdr prints the screen as plain text, not in the JSON envelope; a
        // failure still comes back as an error envelope.
        let out = exec(&self.config, &args, self.config.timeout())?;
        if let Some(body) = json_body(&out) {
            match envelope(&body) {
                Err(e) => return Err(CallError::Herdr(e).into_refusal()),
                Ok(result) => {
                    if let Some(screen) = result.pointer("/read/text").or_else(|| result.get("text")).and_then(Value::as_str) {
                        return Ok(screen.to_string());
                    }
                }
            }
        }
        if out.status == Some(0) {
            Ok(out.stdout)
        } else {
            Err(unknown(format!("herdr pane read failed (exit {}): {}", out.status.map_or("none".into(), |c| c.to_string()), out.stderr.trim())))
        }
    }

    fn process_info(&self, pane: &str) -> DriverResult<ProcessInfo> {
        self.require("process.info")?;
        let result = self.run(&["pane", "process-info", "--pane", pane])?;
        parse_process_info(&result).ok_or_else(|| unknown("herdr pane process-info answered an unexpected shape"))
    }

    fn activity(&self, pane: &str) -> DriverResult<Activity> {
        self.require("activity.state")?;
        // `agent get` answers only for a pane herdr knows an agent in: for any
        // other pane it says `agent_not_found`, which is "no activity", not a fault.
        let result = match self.call(&["agent", "get", pane]) {
            Ok(result) => result,
            // herdr answered: no agent is recognised in this pane. That is an answer
            // (`unknown` state), not a failure to read one.
            Err(CallError::Herdr(e)) if e.code == "agent_not_found" => return Ok(Activity { state: "unknown".into(), ..Default::default() }),
            Err(other) => return Err(other.into_refusal()),
        };
        parse_activity(&result).ok_or_else(|| unknown("herdr agent get reported no agent_status"))
    }

    fn activity_start(&self, pane: &str, name: &str, kind: &str, args: &[String], timeout_ms: u64) -> DriverResult<()> {
        self.require("activity.state")?;
        let wait = timeout_ms.to_string();
        let mut argv = vec!["agent", "start", name, "--kind", kind, "--pane", pane, "--timeout", &wait];
        if !args.is_empty() {
            argv.push("--");
            argv.extend(args.iter().map(String::as_str));
        }
        // The call blocks up to `timeout_ms`; a margin keeps a slow herdr from
        // being killed mid-answer and reported as unreachable.
        let timeout = Duration::from_millis(timeout_ms + DEFAULT_TIMEOUT_MS);
        call(&self.config, &argv, timeout).map(|_| ()).map_err(CallError::into_refusal)
    }

    fn activity_detail(&self, pane: &str) -> DriverResult<ActivityDetail> {
        self.require("activity.state")?;
        let out = exec(&self.config, &["agent", "explain", pane, "--json"], self.config.timeout())?;
        let body = json_body(&out).ok_or_else(|| unknown(format!("herdr agent explain returned no parseable JSON (exit {})", out.status.map_or("none".into(), |c| c.to_string()))))?;
        if let Err(e) = envelope(&body).map(|_| ()) {
            return Err(CallError::Herdr(e).into_refusal());
        }
        Ok(parse_explain(&body))
    }

    fn report_agent(&self, pane: &str, agent: &str, state: &str) -> DriverResult<()> {
        self.require("activity.state")?;
        self.run(&["pane", "report-agent", pane, "--source", "fgos", "--agent", agent, "--state", state]).map(|_| ())
    }

    fn label_tab(&self, tab: &str, label: &str) -> DriverResult<()> {
        self.require("label")?;
        self.run(&["tab", "rename", tab, label]).map(|_| ())
    }

    fn label_pane(&self, pane: &str, label: &str) -> DriverResult<()> {
        self.require("label")?;
        self.run(&["pane", "rename", pane, label]).map(|_| ())
    }

    fn layout_geometry(&self, pane: &str) -> DriverResult<TabGeometry> {
        self.require("layout.geometry")?;
        let result = self.run(&["pane", "layout", "--pane", pane])?;
        let mut geometry = parse_layout(&result).ok_or_else(|| unknown("herdr pane layout answered an unexpected shape"))?;
        // The rect herdr reports can differ from the pty when several clients
        // are attached, so the pty size is read when the OS allows it.
        for p in &mut geometry.panes {
            p.pty = self.pane_pty(&p.pane_id);
        }
        Ok(geometry)
    }
}

// ------------------------------------------------------------ OS-level reads

/// Pid of the process that owns the listening end of the unix socket at `path`.
#[cfg(unix)]
fn peer_pid(path: &str) -> DriverResult<u32> {
    use std::os::fd::AsRawFd;
    let stream = std::os::unix::net::UnixStream::connect(path).map_err(|e| unknown(format!("herdr socket {path} is not reachable: {e}")))?;
    let fd = stream.as_raw_fd();

    #[cfg(target_os = "linux")]
    {
        let mut cred: libc::ucred = unsafe { std::mem::zeroed() };
        let mut len = std::mem::size_of::<libc::ucred>() as libc::socklen_t;
        // SAFETY: `cred` and `len` are valid for the call; `fd` is a live socket.
        let rc = unsafe { libc::getsockopt(fd, libc::SOL_SOCKET, libc::SO_PEERCRED, (&mut cred as *mut libc::ucred).cast(), &mut len) };
        if rc != 0 {
            return Err(unknown(format!("SO_PEERCRED failed on {path}: {}", std::io::Error::last_os_error())));
        }
        u32::try_from(cred.pid).ok().filter(|p| *p != 0).ok_or_else(|| unknown("SO_PEERCRED returned no pid"))
    }
    #[cfg(target_os = "macos")]
    {
        let mut pid: libc::pid_t = 0;
        let mut len = std::mem::size_of::<libc::pid_t>() as libc::socklen_t;
        // SAFETY: `pid` and `len` are valid for the call; `fd` is a live socket.
        let rc = unsafe { libc::getsockopt(fd, libc::SOL_LOCAL, libc::LOCAL_PEERPID, (&mut pid as *mut libc::pid_t).cast(), &mut len) };
        if rc != 0 {
            return Err(unknown(format!("LOCAL_PEERPID failed on {path}: {}", std::io::Error::last_os_error())));
        }
        u32::try_from(pid).ok().filter(|p| *p != 0).ok_or_else(|| unknown("LOCAL_PEERPID returned no pid"))
    }
    #[cfg(not(any(target_os = "linux", target_os = "macos")))]
    {
        let _ = fd;
        Err(unsupported("server.incarnation", "no peer credential lookup on this platform"))
    }
}

#[cfg(not(unix))]
fn peer_pid(_path: &str) -> DriverResult<u32> {
    Err(unsupported("server.incarnation", "no unix socket on this platform"))
}

/// The pty window size behind a shell's stdin, read from `/proc` (same user).
#[cfg(target_os = "linux")]
fn pty_size(shell_pid: u32) -> Option<PtySize> {
    use std::os::fd::AsRawFd;
    use std::os::unix::fs::OpenOptionsExt;
    let tty = std::fs::OpenOptions::new()
        .read(true)
        .custom_flags(libc::O_NOCTTY | libc::O_NONBLOCK)
        .open(format!("/proc/{shell_pid}/fd/0"))
        .ok()?;
    let mut size: libc::winsize = unsafe { std::mem::zeroed() };
    // SAFETY: `size` is a valid winsize for TIOCGWINSZ; the fd is open.
    let rc = unsafe { libc::ioctl(tty.as_raw_fd(), libc::TIOCGWINSZ, &mut size) };
    (rc == 0 && size.ws_col > 0 && size.ws_row > 0).then(|| PtySize { cols: u32::from(size.ws_col), rows: u32::from(size.ws_row) })
}

#[cfg(not(target_os = "linux"))]
fn pty_size(_shell_pid: u32) -> Option<PtySize> {
    None
}
