//! The OS timers fgOS writes per project: a systemd user timer on Linux, a launchd agent on macOS.
//!
//! A schedule is data (what it runs, how often, how doctor words it); render, scheduler lookup, the owned-unit
//! check and the fix are shared by every schedule. Two exist: `mailbox-sync` takes mail on a machine nobody is
//! typing on, `account-probe` sweeps every provider account between runs. Every unit carries its schedule's
//! marker line and only a unit with that marker is ever removed, so `fix` removes the timer of a project that
//! turned its schedule off and never touches a unit it did not write.
//!
//! The platform is a value chosen at run time ([`Host::platform`]), so the units and plists of both systems are
//! rendered and tested on any host; only the `systemctl` and `launchctl` calls are platform work, and they go
//! through the one bounded runner of the process door.

use fgos_config::machine::{home_dir, project_snapshot};
use fgos_config::snapshot::SnapshotError;
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::path::{Component, Path, PathBuf};
use std::time::Duration;

/// A timer's scheduler calls are bounded: a hung service manager never holds a verb.
const SCHEDULER_TIMEOUT: Duration = Duration::from_secs(15);

/// Config refusals that say the door failed, not that a config file is unusable.
const DOOR_FAILURE_IDS: [&str; 4] = [
    "config-request-invalid",
    "config-io",
    "config-trusted-root-unresolved",
    "config-internal-error",
];

/// One schedule fgOS keeps a timer for.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Schedule {
    MailboxSync,
    AccountProbe,
}

/// What a project's config asks of a schedule.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Found {
    pub interval_sec: u64,
    /// The Event Store remote; only the mailbox sync names one.
    pub remote: Option<String>,
}

/// A command word is written as is, or is a path or name the unit syntax may need to quote.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Word {
    Plain(&'static str),
    Named { name: &'static str, value: String },
}

/// The doctor answer for one timer.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Check {
    pub passed: bool,
    pub message: String,
}

/// The fix answer for one timer.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Fix {
    pub fixed: bool,
    pub message: String,
}

impl Schedule {
    pub const ALL: [Schedule; 2] = [Schedule::MailboxSync, Schedule::AccountProbe];

    pub fn name(self) -> &'static str {
        match self {
            Self::MailboxSync => "mailbox-sync",
            Self::AccountProbe => "account-probe",
        }
    }

    fn label(self) -> &'static str {
        match self {
            Self::MailboxSync => "mailbox sync",
            Self::AccountProbe => "account probe",
        }
    }

    /// The marker line every unit of this schedule carries.
    pub fn marker(self) -> &'static str {
        match self {
            Self::MailboxSync => "fgos-managed: mailbox-sync-timer",
            Self::AccountProbe => "fgos-managed: account-probe-timer",
        }
    }

    fn stem_prefix(self) -> &'static str {
        match self {
            Self::MailboxSync => "fgos-mailbox-sync",
            Self::AccountProbe => "fgos-account-probe",
        }
    }

    fn service_description(self) -> &'static str {
        match self {
            Self::MailboxSync => "fgOS mailbox sync (takes mail from other machines)",
            Self::AccountProbe => {
                "fgOS account probe (calls each provider account directly and records what it found)"
            }
        }
    }

    fn timer_description(self) -> &'static str {
        match self {
            Self::MailboxSync => "fgOS mailbox sync timer",
            Self::AccountProbe => "fgOS account probe timer",
        }
    }

    /// What the project's config asks of this schedule; `None` while it is off. `config` is the project's
    /// effective config value (`None` when its file is unusable, which reads as off).
    pub fn schedule_of(self, config: Option<&Value>) -> Option<Found> {
        let config = config?;
        match self {
            Self::MailboxSync => {
                if config.pointer("/mailbox/crossMachine/enabled") != Some(&Value::Bool(true)) {
                    return None;
                }
                let interval_sec = integer(config.pointer("/eventStore/sync/intervalSec")?)?;
                let remote = config.pointer("/eventStore/remote")?.as_str()?;
                if remote.is_empty() {
                    return None;
                }
                Some(Found {
                    interval_sec,
                    remote: Some(remote.to_string()),
                })
            }
            Self::AccountProbe => Some(Found {
                interval_sec: integer(config.pointer("/dispatch/probeAccount/intervalSec")?)?,
                remote: None,
            }),
        }
    }

    fn command(self, found: &Found, project_root: &Path) -> Vec<Word> {
        let dir = Word::Named {
            name: "projectRoot",
            value: absolute(project_root).to_string_lossy().into_owned(),
        };
        match self {
            Self::MailboxSync => vec![
                Word::Plain("hook"),
                Word::Plain("mailbox-sync"),
                Word::Plain("--dir"),
                dir,
                Word::Plain("--remote"),
                Word::Named {
                    name: "remote",
                    value: found.remote.clone().unwrap_or_default(),
                },
            ],
            // The direct leg only: a timer has no herdr session, so the harness leg would open no pane.
            Self::AccountProbe => vec![
                Word::Plain("dispatch"),
                Word::Plain("probe-account"),
                Word::Plain("--all"),
                Word::Plain("--record"),
                Word::Plain("--leg"),
                Word::Plain("direct"),
                Word::Plain("--dir"),
                dir,
            ],
        }
    }

    /// The service's environment. The probe reads PATH to find the provider CLIs; nothing secret.
    fn service_vars(self, host: &Host) -> Vec<(String, String)> {
        match self {
            Self::MailboxSync => Vec::new(),
            Self::AccountProbe => vec![("PATH".to_string(), host.probe_path())],
        }
    }

    fn off(self) -> &'static str {
        match self {
            Self::MailboxSync => "cross-machine mail is not enabled here (or eventStore.sync.intervalSec is 0), so no timer is needed",
            Self::AccountProbe => "the account probe is not scheduled here (dispatch.probeAccount.intervalSec is 0), so no timer is needed",
        }
    }

    fn no_scheduler(self) -> &'static str {
        match self {
            Self::MailboxSync => "mail is taken when a session runs a tool",
            Self::AccountProbe => "run fgos dispatch probe-account --all --record by hand",
        }
    }

    fn orphan(self, kind: &str, stem: &str) -> String {
        match self {
            Self::MailboxSync => {
                format!("{kind} timer {stem} is still installed but cross-machine mail is off here")
            }
            Self::AccountProbe => format!(
                "{kind} timer {stem} is still installed but dispatch.probeAccount.intervalSec is 0 here"
            ),
        }
    }

    fn active(self, kind: &str, stem: &str, found: &Found) -> String {
        match self {
            Self::MailboxSync => format!(
                "{kind} timer {stem} takes mail every {} s, even when no session is running a tool",
                found.interval_sec
            ),
            Self::AccountProbe => format!(
                "{kind} timer {stem} probes every account every {} s",
                found.interval_sec
            ),
        }
    }

    fn broken(self, kind: &str, state: &str, stem: &str) -> String {
        match self {
            Self::MailboxSync => format!("no working {kind} timer ({state}) for {stem}: mail from another machine waits until a session there runs a tool"),
            Self::AccountProbe => format!(
                "no working {kind} timer ({state}) for {stem}: no account is probed between runs"
            ),
        }
    }

    fn removed(self, kind: &str, stem: &str) -> String {
        match self {
            Self::MailboxSync => {
                format!("removed {kind} timer {stem}: cross-machine mail is off here")
            }
            Self::AccountProbe => {
                format!("removed {kind} timer {stem}: the account probe is off here")
            }
        }
    }
}

fn integer(value: &Value) -> Option<u64> {
    value
        .as_u64()
        .or_else(|| {
            value
                .as_f64()
                .filter(|n| n.fract() == 0.0 && *n >= 0.0)
                .map(|n| n as u64)
        })
        .filter(|n| *n > 0)
}

/// `path` made absolute against the process directory and lexically normalised (Node's `path.resolve`).
fn absolute(path: &Path) -> PathBuf {
    let joined = if path.is_absolute() {
        path.to_path_buf()
    } else {
        std::env::current_dir().unwrap_or_default().join(path)
    };
    let mut out = PathBuf::new();
    for component in joined.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                out.pop();
            }
            other => out.push(other.as_os_str()),
        }
    }
    out
}

/// One short stable name per project root, so two projects never share a unit.
pub fn unit_stem(project_root: &Path, schedule: Schedule) -> String {
    let digest = Sha256::digest(absolute(project_root).to_string_lossy().as_bytes());
    let hex: String = digest.iter().take(4).map(|b| format!("{b:02x}")).collect();
    format!("{}-{hex}", schedule.stem_prefix())
}

/// A unit file is read by a scheduler that expands `%` (systemd specifiers) and ends a line at a control
/// character, so a value holding either would change what the unit runs. The values are refused, never escaped.
pub fn refuse_unsafe_unit_values(values: &[(&str, &str)]) -> Result<(), String> {
    for (name, value) in values {
        if value
            .chars()
            .any(|c| c == '%' || (c as u32) <= 0x1f || c as u32 == 0x7f)
        {
            return Err(format!(
                "the timer refuses {name}: it holds \"%\" or a control character"
            ));
        }
    }
    Ok(())
}

/// Every value a unit would carry that a person or a path decides: the binary, the named words, the variables.
fn unit_values<'a>(
    bin: &'a str,
    words: &'a [Word],
    vars: &'a [(String, String)],
) -> Vec<(&'a str, &'a str)> {
    let mut values = vec![("bin", bin)];
    for word in words {
        if let Word::Named { name, value } = word {
            values.push((name, value));
        }
    }
    values.extend(vars.iter().map(|(k, v)| (k.as_str(), v.as_str())));
    values
}

fn quote(text: &str) -> String {
    let mut out = String::from("\"");
    for c in text.chars() {
        if c == '"' || c == '\\' {
            out.push('\\');
        }
        out.push(c);
    }
    out.push('"');
    out
}

fn xml(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

/// What a unit renders from.
pub struct UnitSpec<'a> {
    pub stem: &'a str,
    pub bin: &'a str,
    pub words: &'a [Word],
    pub vars: &'a [(String, String)],
    pub interval_sec: u64,
    pub schedule: Schedule,
}

/// The two systemd user units: the service runs the child once; the timer repeats it. Name and text, in order.
pub fn render_systemd(spec: &UnitSpec) -> Result<Vec<(String, String)>, String> {
    refuse_unsafe_unit_values(&unit_values(spec.bin, spec.words, spec.vars))?;
    let words = spec
        .words
        .iter()
        .map(|w| match w {
            Word::Plain(text) => (*text).to_string(),
            Word::Named { value, .. } => quote(value),
        })
        .collect::<Vec<_>>()
        .join(" ");
    let mut service = vec![
        format!("# {}", spec.schedule.marker()),
        "[Unit]".to_string(),
        format!("Description={}", spec.schedule.service_description()),
        String::new(),
        "[Service]".to_string(),
        "Type=oneshot".to_string(),
    ];
    service.extend(
        spec.vars
            .iter()
            .map(|(name, value)| format!("Environment={}", quote(&format!("{name}={value}")))),
    );
    service.push(format!("ExecStart={} {words}", quote(spec.bin)));
    service.push(String::new());
    let timer = [
        format!("# {}", spec.schedule.marker()),
        "[Unit]".to_string(),
        format!("Description={}", spec.schedule.timer_description()),
        String::new(),
        "[Timer]".to_string(),
        "OnBootSec=60".to_string(),
        format!("OnUnitActiveSec={}", spec.interval_sec),
        String::new(),
        "[Install]".to_string(),
        "WantedBy=timers.target".to_string(),
        String::new(),
    ];
    Ok(vec![
        (format!("{}.service", spec.stem), service.join("\n")),
        (format!("{}.timer", spec.stem), timer.join("\n")),
    ])
}

/// The launchd agent: the same child on a fixed interval.
pub fn render_launchd(spec: &UnitSpec) -> Result<Vec<(String, String)>, String> {
    refuse_unsafe_unit_values(&unit_values(spec.bin, spec.words, spec.vars))?;
    let mut lines = vec![
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>".to_string(),
        format!("<!-- {} -->", spec.schedule.marker()),
        "<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">".to_string(),
        "<plist version=\"1.0\">".to_string(),
        "<dict>".to_string(),
        format!("  <key>Label</key><string>dev.fgos.{}</string>", spec.stem),
        "  <key>ProgramArguments</key>".to_string(),
        "  <array>".to_string(),
    ];
    lines.push(format!("    <string>{}</string>", xml(spec.bin)));
    for word in spec.words {
        let text = match word {
            Word::Plain(text) => (*text).to_string(),
            Word::Named { value, .. } => value.clone(),
        };
        lines.push(format!("    <string>{}</string>", xml(&text)));
    }
    lines.push("  </array>".to_string());
    if !spec.vars.is_empty() {
        lines.push("  <key>EnvironmentVariables</key>".to_string());
        lines.push("  <dict>".to_string());
        lines.extend(
            spec.vars
                .iter()
                .map(|(k, v)| format!("    <key>{}</key><string>{}</string>", xml(k), xml(v))),
        );
        lines.push("  </dict>".to_string());
    }
    lines.push(format!(
        "  <key>StartInterval</key><integer>{}</integer>",
        spec.interval_sec
    ));
    lines.push("  <key>RunAtLoad</key><true/>".to_string());
    lines.push("</dict>".to_string());
    lines.push("</plist>".to_string());
    lines.push(String::new());
    Ok(vec![(
        format!("dev.fgos.{}.plist", spec.stem),
        lines.join("\n"),
    )])
}

/// Which scheduler a platform has and how it is told.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Kind {
    Systemd,
    Launchd,
}

impl Kind {
    pub fn name(self) -> &'static str {
        match self {
            Self::Systemd => "systemd",
            Self::Launchd => "launchd",
        }
    }
}

/// Where the files go and which scheduler reads them.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Scheduler {
    pub kind: Kind,
    pub dir: PathBuf,
}

/// The machine facts a timer depends on, named once so a test can state both platforms.
#[derive(Debug, Clone)]
pub struct Host {
    /// Node's `process.platform` names: `linux`, `darwin`, `win32`, or another OS name.
    pub platform: String,
    pub home: PathBuf,
    pub uid: u32,
    pub xdg_config_home: Option<String>,
}

impl Host {
    /// The machine this process runs on; `None` when no home directory is known.
    pub fn system(lookup: impl Fn(&str) -> Option<String>) -> Option<Host> {
        Some(Host {
            platform: platform_name().to_string(),
            home: home_dir(&lookup)?,
            uid: current_uid(),
            xdg_config_home: lookup("XDG_CONFIG_HOME"),
        })
    }

    /// The folders a user-level CLI install lands in; a timer's service starts with a bare system PATH.
    fn probe_path(&self) -> String {
        let mut dirs = vec![
            self.home
                .join(".local")
                .join("bin")
                .to_string_lossy()
                .into_owned(),
            "/usr/local/bin".to_string(),
            "/usr/bin".to_string(),
            "/bin".to_string(),
        ];
        if self.platform == "darwin" {
            dirs.insert(1, "/opt/homebrew/bin".to_string());
        }
        dirs.join(":")
    }

    /// Where the files go and how the OS is told, or `None` on a platform without a supported scheduler.
    pub fn scheduler(&self) -> Option<Scheduler> {
        match self.platform.as_str() {
            "linux" => {
                let config = match self.xdg_config_home.as_deref().filter(|x| !x.is_empty()) {
                    Some(xdg) => PathBuf::from(xdg),
                    None => self.home.join(".config"),
                };
                Some(Scheduler {
                    kind: Kind::Systemd,
                    dir: config.join("systemd").join("user"),
                })
            }
            "darwin" => Some(Scheduler {
                kind: Kind::Launchd,
                dir: self.home.join("Library").join("LaunchAgents"),
            }),
            _ => None,
        }
    }

    fn domain(&self) -> String {
        format!("gui/{}", self.uid)
    }
}

fn platform_name() -> &'static str {
    if cfg!(target_os = "linux") {
        "linux"
    } else if cfg!(target_os = "macos") {
        "darwin"
    } else if cfg!(windows) {
        "win32"
    } else {
        std::env::consts::OS
    }
}

#[cfg(unix)]
fn current_uid() -> u32 {
    // SAFETY: getuid has no preconditions and cannot fail.
    unsafe { libc::getuid() }
}

#[cfg(not(unix))]
fn current_uid() -> u32 {
    0
}

/// One scheduler call: a program and its arguments; the error is the message a failed call gives.
pub type Run<'a> = &'a dyn Fn(&str, &[String]) -> Result<(), String>;

/// The scheduler calls of a real run: a cleared environment plus the few variables a per-user service
/// manager needs to find its bus, bounded by [`SCHEDULER_TIMEOUT`]. The only programs started are the two
/// scheduler front ends.
pub fn run_scheduler_call(program: &str, args: &[String]) -> Result<(), String> {
    if program != "systemctl" && program != "launchctl" {
        return Err(format!("a managed timer does not start {program}"));
    }
    let mut env = vec![(
        "PATH".to_string(),
        "/usr/local/bin:/usr/bin:/bin".to_string(),
    )];
    for key in [
        "HOME",
        "USER",
        "LOGNAME",
        "XDG_RUNTIME_DIR",
        "DBUS_SESSION_BUS_ADDRESS",
    ] {
        if let Some(value) = std::env::var(key).ok().filter(|v| !v.is_empty()) {
            env.push((key.to_string(), value));
        }
    }
    let command_line = format!("{program} {}", args.join(" "));
    match fgos_process::spawn::run_bounded(program, args, &env, None, None, SCHEDULER_TIMEOUT) {
        Ok(fgos_process::spawn::Outcome::Exited(out)) if out.status.success() => Ok(()),
        Ok(fgos_process::spawn::Outcome::Exited(_)) => {
            Err(format!("Command failed: {command_line}"))
        }
        Ok(fgos_process::spawn::Outcome::TimedOut { .. }) => {
            Err(format!("spawnSync {program} ETIMEDOUT"))
        }
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
            Err(format!("spawnSync {program} ENOENT"))
        }
        Err(e) => Err(format!("spawnSync {program} {e}")),
    }
}

fn strings(parts: &[&str]) -> Vec<String> {
    parts.iter().map(|p| (*p).to_string()).collect()
}

impl Scheduler {
    fn render(&self, spec: &UnitSpec) -> Result<Vec<(String, String)>, String> {
        match self.kind {
            Kind::Systemd => render_systemd(spec),
            Kind::Launchd => render_launchd(spec),
        }
    }

    fn enabled(&self, host: &Host, stem: &str, run: Run) -> Result<(), String> {
        match self.kind {
            Kind::Systemd => run(
                "systemctl",
                &strings(&["--user", "is-enabled", &format!("{stem}.timer")]),
            ),
            Kind::Launchd => run(
                "launchctl",
                &strings(&["print", &format!("{}/dev.fgos.{stem}", host.domain())]),
            ),
        }
    }

    fn disable(&self, host: &Host, stem: &str, run: Run) -> Result<(), String> {
        match self.kind {
            Kind::Systemd => {
                run(
                    "systemctl",
                    &strings(&["--user", "disable", "--now", &format!("{stem}.timer")]),
                )?;
                run("systemctl", &strings(&["--user", "daemon-reload"]))
            }
            Kind::Launchd => run(
                "launchctl",
                &strings(&["bootout", &format!("{}/dev.fgos.{stem}", host.domain())]),
            ),
        }
    }

    fn enable(&self, host: &Host, stem: &str, run: Run) -> Result<(), String> {
        match self.kind {
            Kind::Systemd => {
                run("systemctl", &strings(&["--user", "daemon-reload"]))?;
                run(
                    "systemctl",
                    &strings(&["--user", "enable", "--now", &format!("{stem}.timer")]),
                )
            }
            Kind::Launchd => {
                let file = self.dir.join(format!("dev.fgos.{stem}.plist"));
                let domain = host.domain();
                // Not loaded yet is fine.
                let _ = run(
                    "launchctl",
                    &strings(&["bootout", &format!("{domain}/dev.fgos.{stem}")]),
                );
                run(
                    "launchctl",
                    &strings(&["bootstrap", &domain, &file.to_string_lossy()]),
                )
            }
        }
    }

    /// The unit files of this project's timer that carry the schedule's marker, by name.
    fn owned_units(&self, stem: &str, schedule: Schedule) -> Vec<String> {
        let spec = UnitSpec {
            stem,
            bin: "x",
            words: &[],
            vars: &[],
            interval_sec: 1,
            schedule,
        };
        let Ok(names) = self.render(&spec) else {
            return Vec::new();
        };
        names
            .into_iter()
            .map(|(name, _)| name)
            .filter(|name| {
                std::fs::read_to_string(self.dir.join(name))
                    .map(|text| text.contains(schedule.marker()))
                    .unwrap_or(false)
            })
            .collect()
    }
}

/// What a timer call needs from outside: the machine, the config read, the host binary lookup and the
/// scheduler call. [`TimerEnv::system`] is the real one; a test replaces any part.
pub struct TimerEnv<'a> {
    pub host: Host,
    /// The project's effective config value; `Ok(None)` when its file is unusable, `Err` when the door failed.
    pub config: &'a dyn Fn(&Path) -> Result<Option<Value>, String>,
    pub host_bin: &'a dyn Fn(&Path) -> Option<PathBuf>,
    pub run: Run<'a>,
}

/// The project's effective config value through the config crate, with Node's reading of a failure: an
/// unusable file reads as off, a failure of the door is an error.
pub fn read_project_config(root: &Path) -> Result<Option<Value>, String> {
    match project_snapshot(root, |key| std::env::var(key).ok()) {
        Ok(snapshot) => Ok(Some(snapshot.value)),
        Err(SnapshotError::Refused(refusals)) => {
            match refusals.iter().find(|r| DOOR_FAILURE_IDS.contains(&r.code)) {
                Some(failure) => Err(failure.to_string()),
                None => Ok(None),
            }
        }
        Err(SnapshotError::Io(e)) => Err(e.to_string()),
    }
}

/// The host binary of the release this project has activated; never a checkout script, a project-local
/// install or whatever `fgos` the PATH holds.
pub fn activated_host_bin(project_root: &Path) -> Option<PathBuf> {
    let text = std::fs::read_to_string(
        project_root
            .join(".fgos")
            .join("installation")
            .join("activation.json"),
    )
    .ok()?;
    let activation: Value = serde_json::from_str(&text).ok()?;
    if activation.get("status")?.as_str()? != "ready" {
        return None;
    }
    let release = activation
        .get("releasePath")?
        .as_str()
        .filter(|p| !p.is_empty())?;
    let base = absolute(Path::new(release));
    let real_base = std::fs::canonicalize(&base).ok()?;
    ["fgos", "fgos.exe"]
        .iter()
        .map(|name| base.join("bin").join(name))
        .find(|candidate| {
            is_executable_file(candidate)
                && std::fs::canonicalize(candidate)
                    .map(|real| real.starts_with(&real_base))
                    .unwrap_or(false)
        })
}

fn is_executable_file(path: &Path) -> bool {
    match std::fs::metadata(path) {
        Ok(meta) if meta.is_file() => has_execute_bit(&meta),
        _ => false,
    }
}

#[cfg(unix)]
fn has_execute_bit(meta: &std::fs::Metadata) -> bool {
    use std::os::unix::fs::PermissionsExt;
    meta.permissions().mode() & 0o111 != 0
}

#[cfg(not(unix))]
fn has_execute_bit(_: &std::fs::Metadata) -> bool {
    true
}

fn is_executable_path(path: &Path) -> bool {
    match std::fs::metadata(path) {
        Ok(meta) => has_execute_bit(&meta),
        Err(_) => false,
    }
}

impl TimerEnv<'static> {
    /// The real machine: the config crate, the activation record, the scheduler front ends. `None` when no
    /// home directory is known.
    pub fn system() -> Option<TimerEnv<'static>> {
        Some(TimerEnv {
            host: Host::system(|key| std::env::var(key).ok())?,
            config: &read_project_config,
            host_bin: &activated_host_bin,
            run: &run_scheduler_call,
        })
    }
}

enum Plan {
    Orphan {
        chosen: Scheduler,
        stem: String,
        owned: Vec<String>,
    },
    Skip(String),
    Refused(String),
    Ready {
        chosen: Scheduler,
        stem: String,
        files: Vec<(String, String)>,
        found: Found,
    },
}

/// What to do for one schedule: `found` is what the config asks (`None` removes an owned timer).
fn plan(schedule: Schedule, cwd: &Path, found: Option<Found>, env: &TimerEnv) -> Plan {
    let chosen = env.host.scheduler();
    let Some(found) = found else {
        let stem = unit_stem(cwd, schedule);
        let owned = chosen
            .as_ref()
            .map(|c| c.owned_units(&stem, schedule))
            .unwrap_or_default();
        return match chosen {
            Some(chosen) if !owned.is_empty() => Plan::Orphan {
                chosen,
                stem,
                owned,
            },
            _ => Plan::Skip(schedule.off().to_string()),
        };
    };
    let Some(chosen) = chosen else {
        return Plan::Skip(format!(
            "no supported scheduler on {}; {}",
            env.host.platform,
            schedule.no_scheduler()
        ));
    };
    // The project's installation shim outlives an upgrade; a release path would not.
    let shim = cwd
        .join(".fgos")
        .join("installation")
        .join("bin")
        .join("fgos");
    let bin = if is_executable_path(&shim) {
        Some(shim)
    } else {
        (env.host_bin)(cwd)
    };
    let Some(bin) = bin else {
        return Plan::Skip(
            "no activated fgos host resolves here, so the timer cannot name one".to_string(),
        );
    };
    let stem = unit_stem(cwd, schedule);
    let words = schedule.command(&found, cwd);
    let vars = schedule.service_vars(&env.host);
    let spec = UnitSpec {
        stem: &stem,
        bin: &bin.to_string_lossy(),
        words: &words,
        vars: &vars,
        interval_sec: found.interval_sec,
        schedule,
    };
    match chosen.render(&spec) {
        Ok(files) => Plan::Ready {
            chosen,
            stem,
            files,
            found,
        },
        Err(message) => Plan::Refused(message),
    }
}

fn found_of(schedule: Schedule, cwd: &Path, env: &TimerEnv) -> Result<Option<Found>, String> {
    Ok(schedule.schedule_of((env.config)(cwd)?.as_ref()))
}

fn state_of(
    env: &TimerEnv,
    chosen: &Scheduler,
    files: &[(String, String)],
    stem: &str,
) -> &'static str {
    for (name, text) in files {
        match std::fs::read_to_string(chosen.dir.join(name)) {
            Err(_) => return "missing",
            Ok(have) if have != *text => return "stale",
            Ok(_) => {}
        }
    }
    if chosen.enabled(&env.host, stem, env.run).is_err() {
        return "disabled";
    }
    "ok"
}

/// Doctor's reading of one schedule's timer for this project. An `Err` is a failed config door.
pub fn check_managed_timer(
    schedule: Schedule,
    cwd: &Path,
    env: &TimerEnv,
) -> Result<Check, String> {
    check_with(schedule, cwd, found_of(schedule, cwd, env)?, env)
}

/// [`check_managed_timer`] with the config reading replaced by `found`.
pub fn check_with(
    schedule: Schedule,
    cwd: &Path,
    found: Option<Found>,
    env: &TimerEnv,
) -> Result<Check, String> {
    Ok(match plan(schedule, cwd, found, env) {
        Plan::Orphan { chosen, stem, .. } => Check {
            passed: false,
            message: format!(
                "{} (fgos doctor --fix removes it; only files with the {} marker are touched)",
                schedule.orphan(chosen.kind.name(), &stem),
                schedule.marker()
            ),
        },
        Plan::Skip(message) => Check {
            passed: true,
            message,
        },
        Plan::Refused(message) => Check {
            passed: true,
            message: format!("warning: no {} timer: {message}", schedule.label()),
        },
        Plan::Ready {
            chosen,
            stem,
            files,
            found,
        } => {
            let state = state_of(env, &chosen, &files, &stem);
            if state == "ok" {
                Check {
                    passed: true,
                    message: schedule.active(chosen.kind.name(), &stem, &found),
                }
            } else {
                Check {
                    passed: false,
                    message: format!(
                        "{} (fgos doctor --fix writes it under {})",
                        schedule.broken(chosen.kind.name(), state, &stem),
                        chosen.dir.display()
                    ),
                }
            }
        }
    })
}

/// Writes the unit files and enables them; leaves any other unit as it was. An `Err` is a failed config door.
pub fn fix_managed_timer(schedule: Schedule, cwd: &Path, env: &TimerEnv) -> Result<Fix, String> {
    Ok(fix_with(schedule, cwd, found_of(schedule, cwd, env)?, env))
}

/// Removes this project's timer of `schedule` when it carries the marker, whatever the config says
/// (`uninstall` and a project that turned the schedule off).
pub fn remove_managed_timer(schedule: Schedule, cwd: &Path, env: &TimerEnv) -> Fix {
    fix_with(schedule, cwd, None, env)
}

/// [`fix_managed_timer`] with the config reading replaced by `found`.
pub fn fix_with(schedule: Schedule, cwd: &Path, found: Option<Found>, env: &TimerEnv) -> Fix {
    match plan(schedule, cwd, found, env) {
        Plan::Orphan {
            chosen,
            stem,
            owned,
        } => {
            // Not loaded: the files are still removed.
            let _ = chosen.disable(&env.host, &stem, env.run);
            for name in owned {
                let _ = std::fs::remove_file(chosen.dir.join(name));
            }
            Fix {
                fixed: true,
                message: schedule.removed(chosen.kind.name(), &stem),
            }
        }
        Plan::Skip(message) | Plan::Refused(message) => Fix {
            fixed: false,
            message: format!("skipped: {message}"),
        },
        Plan::Ready {
            chosen,
            stem,
            files,
            found,
        } => {
            if let Err(e) = std::fs::create_dir_all(&chosen.dir) {
                return Fix {
                    fixed: false,
                    message: format!("could not create {}: {e}", chosen.dir.display()),
                };
            }
            for (name, text) in &files {
                if let Err(e) = fgos_durable_file::replace_durably_with_mode(
                    &chosen.dir,
                    name,
                    text.as_bytes(),
                    0o644,
                ) {
                    // Installed but not made durable still leaves the unit in place.
                    if e.installed.is_none() {
                        return Fix {
                            fixed: false,
                            message: format!(
                                "could not write {name} under {}: {}",
                                chosen.dir.display(),
                                e.source
                            ),
                        };
                    }
                }
            }
            if let Err(message) = chosen.enable(&env.host, &stem, env.run) {
                let names: Vec<&str> = files.iter().map(|(n, _)| n.as_str()).collect();
                return Fix {
                    fixed: false,
                    message: format!(
                        "wrote {} under {}, but enabling failed: {}",
                        names.join(", "),
                        chosen.dir.display(),
                        message.lines().next().unwrap_or_default()
                    ),
                };
            }
            Fix {
                fixed: true,
                message: format!(
                    "enabled {} timer {stem} (every {} s); remove the files under {} to undo",
                    chosen.kind.name(),
                    found.interval_sec,
                    chosen.dir.display()
                ),
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_scratch::{scratch, Scratch};
    use serde_json::json;
    use std::cell::RefCell;

    fn host(platform: &str, home: &Path) -> Host {
        Host {
            platform: platform.to_string(),
            home: home.to_path_buf(),
            uid: 501,
            xdg_config_home: Some(home.join("cfg").to_string_lossy().into_owned()),
        }
    }

    const BIN: &str = "/opt/fgos/bin/fgos";

    struct World {
        home: Scratch,
        calls: RefCell<Vec<String>>,
        fail_enable: bool,
    }

    impl World {
        fn new() -> Self {
            Self {
                home: scratch("home"),
                calls: RefCell::new(Vec::new()),
                fail_enable: false,
            }
        }
        fn units(&self) -> PathBuf {
            self.home.join("cfg").join("systemd").join("user")
        }
        fn with<T>(&self, host_bin: Option<PathBuf>, body: impl FnOnce(&TimerEnv) -> T) -> T {
            let run = |program: &str, args: &[String]| -> Result<(), String> {
                let line = format!("{program} {}", args.join(" "));
                self.calls.borrow_mut().push(line.clone());
                if self.fail_enable && args.iter().any(|a| a == "enable") {
                    return Err("Failed to connect to bus\nmore".to_string());
                }
                Ok(())
            };
            let host_bin_fn = move |_: &Path| host_bin.clone();
            let env = TimerEnv {
                host: host("linux", &self.home),
                config: &|_| Ok(None),
                host_bin: &host_bin_fn,
                run: &run,
            };
            body(&env)
        }
        fn calls(&self) -> Vec<String> {
            self.calls.borrow().clone()
        }
    }

    fn on(schedule: Schedule) -> Option<Found> {
        Some(match schedule {
            Schedule::MailboxSync => Found {
                interval_sec: 300,
                remote: Some("origin".into()),
            },
            Schedule::AccountProbe => Found {
                interval_sec: 300,
                remote: None,
            },
        })
    }

    fn with_bin<T>(w: &World, body: impl FnOnce(&TimerEnv) -> T) -> T {
        w.with(Some(PathBuf::from(BIN)), body)
    }

    fn schedule_by_name(name: &str) -> Schedule {
        Schedule::ALL
            .into_iter()
            .find(|s| s.name() == name)
            .unwrap()
    }

    #[test]
    fn units_and_plists_have_the_bytes_node_wrote_on_both_platforms() {
        let vectors: Vec<Value> =
            serde_json::from_str(include_str!("../tests/goldens/managed-timer-units.json"))
                .unwrap();
        assert_eq!(vectors.len(), 4);
        for v in vectors {
            let schedule = schedule_by_name(v["schedule"].as_str().unwrap());
            let root = PathBuf::from(v["projectRoot"].as_str().unwrap());
            let found = Found {
                interval_sec: v["intervalSec"].as_u64().unwrap(),
                remote: v["remote"].as_str().map(str::to_string),
            };
            let stem = unit_stem(&root, schedule);
            assert_eq!(stem, v["stem"].as_str().unwrap());
            let words = schedule.command(&found, &root);
            let vars =
                schedule.service_vars(&host("linux", Path::new(v["home"].as_str().unwrap())));
            let spec = UnitSpec {
                stem: &stem,
                bin: v["bin"].as_str().unwrap(),
                words: &words,
                vars: &vars,
                interval_sec: found.interval_sec,
                schedule,
            };
            for (render, key) in [
                (render_systemd(&spec).unwrap(), "systemd"),
                (render_launchd(&spec).unwrap(), "launchd"),
            ] {
                let want = v[key].as_object().unwrap();
                assert_eq!(render.len(), want.len(), "{key} file count");
                for (name, text) in render {
                    assert_eq!(Some(text.as_str()), want[&name].as_str(), "{key} {name}");
                }
            }
        }
    }

    #[test]
    fn the_probe_path_adds_the_homebrew_folder_only_on_darwin() {
        let home = Path::new("/home/u");
        assert_eq!(
            host("linux", home).probe_path(),
            "/home/u/.local/bin:/usr/local/bin:/usr/bin:/bin"
        );
        assert_eq!(
            host("darwin", home).probe_path(),
            "/home/u/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
        );
    }

    #[test]
    fn each_platform_has_its_scheduler_directory_and_others_have_none() {
        let home = Path::new("/h");
        let mut linux = host("linux", home);
        linux.xdg_config_home = None;
        assert_eq!(
            linux.scheduler(),
            Some(Scheduler {
                kind: Kind::Systemd,
                dir: PathBuf::from("/h/.config/systemd/user")
            })
        );
        assert_eq!(
            host("darwin", home).scheduler().unwrap().dir,
            PathBuf::from("/h/Library/LaunchAgents")
        );
        assert_eq!(host("win32", home).scheduler(), None);
    }

    #[test]
    fn a_unit_is_never_written_with_percent_or_a_control_character() {
        let words = |root: &str, remote: &str| {
            Schedule::MailboxSync.command(
                &Found {
                    interval_sec: 60,
                    remote: Some(remote.into()),
                },
                Path::new(root),
            )
        };
        let spec = |bin: &'static str,
                    words: &'static [Word],
                    vars: &'static [(String, String)]| UnitSpec {
            stem: "s",
            bin,
            words,
            vars,
            interval_sec: 60,
            schedule: Schedule::MailboxSync,
        };
        let ok: &'static [Word] = Box::leak(words("/p", "origin").into_boxed_slice());
        assert!(render_systemd(&spec("/b/fgos", ok, &[])).is_ok());
        for bad in ["/x%h", "/x\nExecStartPost=/bin/sh", "/x\u{7}", "/x\u{7f}"] {
            let leaked = |w: Vec<Word>| -> &'static [Word] { Box::leak(w.into_boxed_slice()) };
            let cases = [
                (
                    "bin",
                    spec(Box::leak(bad.to_string().into_boxed_str()), ok, &[]),
                ),
                (
                    "projectRoot",
                    spec("/b/fgos", leaked(words(bad, "origin")), &[]),
                ),
                ("remote", spec("/b/fgos", leaked(words("/p", bad)), &[])),
            ];
            for (field, unit) in cases {
                for result in [render_systemd(&unit), render_launchd(&unit)] {
                    let err = result.unwrap_err();
                    assert!(
                        err.contains(&format!("refuses {field}")),
                        "{field} {bad:?}: {err}"
                    );
                }
            }
        }
        let vars: &'static [(String, String)] =
            Box::leak(vec![("PATH".to_string(), "/a%h".to_string())].into_boxed_slice());
        assert!(render_systemd(&spec("/b/fgos", ok, vars))
            .unwrap_err()
            .contains("refuses PATH"));
    }

    #[test]
    fn config_turns_a_schedule_on_only_with_a_positive_integer_interval() {
        let mail = |enabled: Value, interval: Value, remote: Value| json!({"mailbox": {"crossMachine": {"enabled": enabled}}, "eventStore": {"sync": {"intervalSec": interval}, "remote": remote}});
        let schedule = Schedule::MailboxSync;
        assert_eq!(
            schedule.schedule_of(Some(&mail(json!(true), json!(120), json!("origin")))),
            Some(Found {
                interval_sec: 120,
                remote: Some("origin".into())
            })
        );
        for off in [
            mail(json!(false), json!(120), json!("origin")),
            mail(json!(true), json!(0), json!("origin")),
            mail(json!(true), json!(1.5), json!("origin")),
            mail(json!(true), json!(120), json!("")),
            mail(json!(true), json!(120), json!(null)),
            json!({}),
        ] {
            assert_eq!(schedule.schedule_of(Some(&off)), None, "{off}");
        }
        assert_eq!(schedule.schedule_of(None), None);
        let probe = |n: Value| json!({"dispatch": {"probeAccount": {"intervalSec": n}}});
        assert_eq!(
            Schedule::AccountProbe.schedule_of(Some(&probe(json!(600)))),
            Some(Found {
                interval_sec: 600,
                remote: None
            })
        );
        assert_eq!(
            Schedule::AccountProbe.schedule_of(Some(&probe(json!(0)))),
            None
        );
        assert_eq!(Schedule::AccountProbe.schedule_of(Some(&json!({}))), None);
    }

    #[test]
    fn a_project_that_does_not_use_a_schedule_needs_no_timer_and_a_platform_without_a_scheduler_says_so(
    ) {
        for schedule in Schedule::ALL {
            let w = World::new();
            let cwd = Path::new("/p");
            with_bin(&w, |env| {
                assert!(check_with(schedule, cwd, None, env).unwrap().passed);
                assert!(!fix_with(schedule, cwd, None, env).fixed);
            });
            let none = World::new();
            let run = |_: &str, _: &[String]| Ok(());
            let bin = |_: &Path| Some(PathBuf::from(BIN));
            let env = TimerEnv {
                host: host("win32", &none.home),
                config: &|_| Ok(None),
                host_bin: &bin,
                run: &run,
            };
            let check = check_with(schedule, cwd, on(schedule), &env).unwrap();
            assert!(check.passed);
            assert!(
                check
                    .message
                    .starts_with("no supported scheduler on win32; "),
                "{}",
                check.message
            );
        }
    }

    #[test]
    fn doctor_fails_while_units_are_missing_the_fix_writes_and_enables_and_a_changed_interval_is_stale(
    ) {
        for schedule in Schedule::ALL {
            let w = World::new();
            let cwd = Path::new("/p");
            let stem = unit_stem(cwd, schedule);
            with_bin(&w, |env| {
                let before = check_with(schedule, cwd, on(schedule), env).unwrap();
                assert!(!before.passed);
                assert!(before.message.contains("(missing)"), "{}", before.message);
                assert!(before.message.contains("fgos doctor --fix writes it under"));
                let fixed = fix_with(schedule, cwd, on(schedule), env);
                assert!(fixed.fixed, "{}", fixed.message);
                assert!(fixed
                    .message
                    .starts_with(&format!("enabled systemd timer {stem} (every 300 s)")));
                assert!(check_with(schedule, cwd, on(schedule), env).unwrap().passed);
                let mut other = on(schedule).unwrap();
                other.interval_sec = 60;
                let changed = check_with(schedule, cwd, Some(other), env).unwrap();
                assert!(!changed.passed);
                assert!(changed.message.contains("(stale)"));
            });
            let calls = w.calls();
            assert!(
                calls
                    .iter()
                    .any(|c| c == &format!("systemctl --user enable --now {stem}.timer")),
                "{calls:?}"
            );
            assert!(calls.iter().any(|c| c == "systemctl --user daemon-reload"));
        }
    }

    #[test]
    fn a_timer_written_but_refused_by_the_os_is_reported_not_claimed_fixed() {
        let mut w = World::new();
        w.fail_enable = true;
        let fix = with_bin(&w, |env| {
            fix_with(
                Schedule::MailboxSync,
                Path::new("/p"),
                on(Schedule::MailboxSync),
                env,
            )
        });
        assert!(!fix.fixed);
        assert!(
            fix.message
                .contains("enabling failed: Failed to connect to bus"),
            "{}",
            fix.message
        );
        assert!(!fix.message.contains("more"));
    }

    #[test]
    fn a_timer_that_is_disabled_by_the_scheduler_reads_as_disabled() {
        let w = World::new();
        let schedule = Schedule::AccountProbe;
        let cwd = Path::new("/p");
        with_bin(&w, |env| {
            assert!(fix_with(schedule, cwd, on(schedule), env).fixed);
        });
        let run = |_: &str, _: &[String]| Err("inactive".to_string());
        let bin = |_: &Path| Some(PathBuf::from(BIN));
        let env = TimerEnv {
            host: host("linux", &w.home),
            config: &|_| Ok(None),
            host_bin: &bin,
            run: &run,
        };
        let check = check_with(schedule, cwd, on(schedule), &env).unwrap();
        assert!(!check.passed);
        assert!(check.message.contains("(disabled)"));
    }

    #[test]
    fn the_timer_names_the_project_shim_when_there_is_one() {
        for schedule in Schedule::ALL {
            let w = World::new();
            let project = scratch("project");
            let shim = project
                .join(".fgos")
                .join("installation")
                .join("bin")
                .join("fgos");
            std::fs::create_dir_all(shim.parent().unwrap()).unwrap();
            std::fs::write(&shim, "#!/bin/sh\n").unwrap();
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                std::fs::set_permissions(&shim, std::fs::Permissions::from_mode(0o755)).unwrap();
            }
            let fix = w.with(None, |env| fix_with(schedule, &project, on(schedule), env));
            assert!(fix.fixed, "{}", fix.message);
            let service = std::fs::read_dir(w.units())
                .unwrap()
                .map(|e| e.unwrap().path())
                .find(|p| p.extension().is_some_and(|e| e == "service"))
                .unwrap();
            assert!(std::fs::read_to_string(service)
                .unwrap()
                .contains(shim.to_str().unwrap()));
        }
    }

    #[test]
    fn without_a_shim_or_an_activated_host_no_timer_is_written() {
        let w = World::new();
        let project = scratch("noproj");
        std::fs::create_dir_all(project.join("bin")).unwrap();
        std::fs::write(project.join("bin").join("fgos.mjs"), "").unwrap();
        let check = w.with(None, |env| {
            check_with(
                Schedule::MailboxSync,
                &project,
                on(Schedule::MailboxSync),
                env,
            )
            .unwrap()
        });
        assert!(check.passed);
        assert!(check
            .message
            .contains("no activated fgos host resolves here"));
        assert!(!w.units().exists());
    }

    #[test]
    fn the_activation_record_names_the_host_only_when_ready_and_inside_the_release() {
        let project = scratch("act");
        assert_eq!(activated_host_bin(&project), None);
        let release = project.join("release");
        std::fs::create_dir_all(release.join("bin")).unwrap();
        let bin = release.join("bin").join("fgos");
        std::fs::write(&bin, "#!/bin/sh\n").unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&bin, std::fs::Permissions::from_mode(0o755)).unwrap();
        }
        let record = project.join(".fgos").join("installation");
        std::fs::create_dir_all(&record).unwrap();
        let write = |value: Value| {
            std::fs::write(record.join("activation.json"), value.to_string()).unwrap()
        };
        write(json!({"status": "pending", "releasePath": release}));
        assert_eq!(activated_host_bin(&project), None);
        write(json!({"status": "ready", "releasePath": release}));
        assert_eq!(activated_host_bin(&project), Some(bin.clone()));
        #[cfg(unix)]
        {
            // A binary that is a link leading outside the release is refused.
            let outside_dir = scratch("outside");
            let outside = outside_dir.join("fgos");
            std::fs::write(&outside, "#!/bin/sh\n").unwrap();
            {
                use std::os::unix::fs::PermissionsExt;
                std::fs::set_permissions(&outside, std::fs::Permissions::from_mode(0o755)).unwrap();
            }
            std::fs::remove_file(&bin).unwrap();
            std::os::unix::fs::symlink(&outside, &bin).unwrap();
            assert_eq!(activated_host_bin(&project), None);
        }
    }

    #[test]
    fn turning_a_schedule_off_names_the_leftover_and_the_fix_removes_only_marked_units() {
        for schedule in Schedule::ALL {
            let w = World::new();
            let cwd = Path::new("/p");
            let stem = unit_stem(cwd, schedule);
            let units = w.units();
            with_bin(&w, |env| {
                assert!(fix_with(schedule, cwd, on(schedule), env).fixed)
            });
            let foreign = units.join("someone-elses.timer");
            std::fs::write(&foreign, "[Timer]\n").unwrap();
            with_bin(&w, |env| {
                let found = check_with(schedule, cwd, None, env).unwrap();
                assert!(!found.passed);
                assert!(
                    found.message.contains("still installed"),
                    "{}",
                    found.message
                );
                let removed = fix_with(schedule, cwd, None, env);
                assert!(removed.fixed, "{}", removed.message);
                assert!(check_with(schedule, cwd, None, env).unwrap().passed);
            });
            assert!(w
                .calls()
                .iter()
                .any(|c| c == &format!("systemctl --user disable --now {stem}.timer")));
            let left: Vec<_> = std::fs::read_dir(&units)
                .unwrap()
                .map(|e| e.unwrap().file_name())
                .collect();
            assert_eq!(left, vec![std::ffi::OsString::from("someone-elses.timer")]);
        }
    }

    #[test]
    fn a_unit_without_the_marker_is_never_removed_even_under_this_projects_name() {
        for schedule in Schedule::ALL {
            let w = World::new();
            let cwd = Path::new("/p");
            std::fs::create_dir_all(w.units()).unwrap();
            let unmarked = w
                .units()
                .join(format!("{}.timer", unit_stem(cwd, schedule)));
            std::fs::write(&unmarked, "[Timer]\nOnBootSec=1\n").unwrap();
            let fix = with_bin(&w, |env| fix_with(schedule, cwd, None, env));
            assert!(!fix.fixed);
            assert!(unmarked.exists());
        }
    }

    #[test]
    fn one_schedule_never_removes_the_units_of_the_other_for_the_same_project() {
        let w = World::new();
        let cwd = Path::new("/p");
        with_bin(&w, |env| {
            assert!(fix_with(Schedule::MailboxSync, cwd, on(Schedule::MailboxSync), env).fixed);
            assert!(!fix_with(Schedule::AccountProbe, cwd, None, env).fixed);
        });
        assert_eq!(std::fs::read_dir(w.units()).unwrap().count(), 2);
    }

    #[test]
    fn an_unsafe_project_path_leaves_the_timer_unwritten_and_doctor_says_why_as_a_warning() {
        let w = World::new();
        let dir = w.home.join("proj%x");
        let schedule = Schedule::MailboxSync;
        with_bin(&w, |env| {
            let check = check_with(schedule, &dir, on(schedule), env).unwrap();
            assert!(check.passed);
            assert!(
                check
                    .message
                    .starts_with("warning: no mailbox sync timer: "),
                "{}",
                check.message
            );
            assert!(check.message.contains("projectRoot"));
            let fix = fix_with(schedule, &dir, on(schedule), env);
            assert!(!fix.fixed);
        });
        assert!(!w.units().exists(), "nothing was written");
    }

    #[test]
    fn the_launchd_enable_boots_out_then_bootstraps_the_plist_in_the_user_domain() {
        let w = World::new();
        let calls = RefCell::new(Vec::new());
        let run = |program: &str, args: &[String]| -> Result<(), String> {
            calls
                .borrow_mut()
                .push(format!("{program} {}", args.join(" ")));
            Ok(())
        };
        let bin = |_: &Path| Some(PathBuf::from(BIN));
        let env = TimerEnv {
            host: host("darwin", &w.home),
            config: &|_| Ok(None),
            host_bin: &bin,
            run: &run,
        };
        let cwd = Path::new("/p");
        let stem = unit_stem(cwd, Schedule::AccountProbe);
        let fix = fix_with(
            Schedule::AccountProbe,
            cwd,
            on(Schedule::AccountProbe),
            &env,
        );
        assert!(fix.fixed, "{}", fix.message);
        let plist = w
            .home
            .join("Library/LaunchAgents")
            .join(format!("dev.fgos.{stem}.plist"));
        assert!(plist.exists());
        let calls = calls.borrow();
        assert_eq!(
            calls[0],
            format!("launchctl bootout gui/501/dev.fgos.{stem}")
        );
        assert_eq!(
            calls[1],
            format!("launchctl bootstrap gui/501 {}", plist.display())
        );
    }

    #[test]
    fn the_real_config_read_turns_a_probe_interval_on_and_reads_an_unusable_file_as_off() {
        let project = scratch("config");
        let fgos = project.join(".fgos");
        std::fs::create_dir_all(&fgos).unwrap();
        std::fs::write(
            fgos.join("config.yaml"),
            "dispatch:\n  probeAccount:\n    intervalSec: 300\n",
        )
        .unwrap();
        let value = read_project_config(&project).unwrap();
        assert_eq!(
            Schedule::AccountProbe.schedule_of(value.as_ref()),
            Some(Found {
                interval_sec: 300,
                remote: None
            })
        );
        std::fs::write(fgos.join("config.yaml"), "dispatch: [unclosed\n").unwrap();
        assert_eq!(read_project_config(&project), Ok(None));
    }

    #[test]
    fn the_real_scheduler_call_starts_only_the_two_front_ends() {
        let err = run_scheduler_call("sh", &["-c".to_string(), "true".to_string()]).unwrap_err();
        assert_eq!(err, "a managed timer does not start sh");
    }
}
