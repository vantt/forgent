//! Route `fgos internal supervise`: owns the attempt after the controller
//! handed it over. It starts the gate inside the attempt's process domain,
//! binds the attempt, sends `GO`, watches the deadlines and the cancel request,
//! publishes the receipt when the gate is gone and runs the post-receipt steps.
//! Contract: `packages/run-supervisor/contracts/internal-route.run-supervisor.v1.json`.
//!
//! The supervisor never holds a pipe of the agent: the gate owns its IO, so a
//! supervisor that dies mid-run changes nothing for the agent.

#![cfg_attr(not(unix), allow(dead_code, unused_imports))]

use std::path::{Path, PathBuf};

use serde_json::{json, Value};
use sha2::{Digest, Sha256};

use crate::publish::{iso_utc_now, publish_once};
use crate::route::{refuse, report, Flags, EXIT_ENVELOPE_INVALID, EXIT_INTERNAL, EXIT_VERSION_MISMATCH};

/// Parsed argv of `fgos internal supervise`.
#[derive(Debug, PartialEq, Eq)]
pub struct SuperviseArgs {
    pub envelope: PathBuf,
}

pub fn parse_args(args: &[String]) -> Result<SuperviseArgs, crate::route::ArgsError> {
    let flags = Flags::parse(args, &["envelope"], 0)?;
    Ok(SuperviseArgs { envelope: PathBuf::from(flags.require("envelope")?) })
}

/// Run the supervisor; the return value is the process exit code.
pub fn run(args: &[String]) -> i32 {
    let args = match parse_args(args) {
        Ok(args) => args,
        Err(err) => return refuse("supervise", err),
    };
    #[cfg(unix)]
    {
        unix::run(&args)
    }
    #[cfg(not(unix))]
    {
        let _ = args;
        report("supervise", "unsupported-platform", "the supervisor has no Windows implementation yet");
        EXIT_INTERNAL
    }
}

/// The receipt outcome for what the gate left behind (`receipt.v1.json`).
/// `None`: no `gate-exit.json`, which means the gate died or never ran the
/// agent (exit 64, 65 or 70 publish nothing): the lock being free proves the
/// domain is empty, so the physical result is `gate-lost`.
pub fn outcome_for(gate_exit: Option<&Value>, outbox_present: bool) -> &'static str {
    match gate_exit.and_then(|g| g["stoppedBy"].as_str()) {
        Some("agent") => "exited",
        Some("soft-deadline" | "idle" | "hard-ceiling") => "timeout",
        Some("cancel") => "cancelled",
        Some("orphan") if outbox_present => "exited",
        _ => "gate-lost",
    }
}

/// `"sha256:<hex>"` of a capture file's bytes, `None` when it does not exist.
fn capture_digest(path: &Path) -> Option<String> {
    use std::io::Read;
    let mut file = std::fs::File::open(path).ok()?;
    let mut hasher = Sha256::new();
    let mut buf = [0u8; 64 * 1024];
    loop {
        let n = file.read(&mut buf).ok()?;
        if n == 0 {
            return Some(format!("sha256:{:x}", hasher.finalize()));
        }
        hasher.update(&buf[..n]);
    }
}

fn outbox_present(outbox: &Path) -> bool {
    let names: Vec<String> = std::fs::read_dir(outbox).into_iter().flatten().flatten().filter_map(|e| e.file_name().to_str().map(String::from)).collect();
    fgos_agent_protocol::direct::newest_result(outbox, names.iter().map(String::as_str)).is_some()
}

/// The `gate-exit.json` of this attempt, when one was published.
fn read_gate_exit(run_dir: &Path, attempt_id: &str) -> Option<Value> {
    let value: Value = serde_json::from_str(&std::fs::read_to_string(run_dir.join("gate-exit.json")).ok()?).ok()?;
    (value["attemptId"] == attempt_id).then_some(value)
}

/// Publish `receipt.json` once and return the outcome of whichever receipt is there.
fn publish_receipt(envelope: &Value, run_dir: &Path) -> std::io::Result<String> {
    publish_receipt_as(envelope, run_dir, "supervisor", false)
}

/// [`publish_receipt`] for either author. `not_started`: the attempt was never
/// bound, so the receipt names `abandoned-not-started` whatever else is on disk.
pub(crate) fn publish_receipt_as(envelope: &Value, run_dir: &Path, synthesized_by: &str, not_started: bool) -> std::io::Result<String> {
    let attempt_id = envelope["attemptId"].as_str().unwrap_or_default();
    let gate_exit = read_gate_exit(run_dir, attempt_id);
    let launch = &envelope["launch"];
    let present = launch["outboxDir"].as_str().is_some_and(|dir| outbox_present(Path::new(dir)));
    let digest_of = |key: &str| launch["capture"][key].as_str().and_then(|p| capture_digest(Path::new(p))).map_or(Value::Null, Value::from);
    let outcome = if not_started { "abandoned-not-started" } else { outcome_for(gate_exit.as_ref(), present) };
    let mut receipt = json!({
        "v": 1,
        "attemptId": attempt_id,
        "outcome": outcome,
        "captureDigests": {"stdout": digest_of("stdout"), "stderr": digest_of("stderr")},
        "outboxPresent": present,
        "synthesizedBy": synthesized_by,
        "publishedAt": iso_utc_now(),
    });
    if let Some(exit) = gate_exit {
        receipt["gateExit"] = exit;
    }
    publish_once(run_dir, "receipt.json", &serde_json::to_vec(&receipt).map_err(std::io::Error::other)?)?;
    // A receipt that already existed is the one that counts.
    let published: Value = std::fs::read_to_string(run_dir.join("receipt.json")).ok().and_then(|t| serde_json::from_str(&t).ok()).unwrap_or(receipt);
    Ok(published["outcome"].as_str().unwrap_or(outcome).to_string())
}

#[cfg(unix)]
mod unix {
    use std::collections::BTreeMap;
    use std::fs::{self, File, OpenOptions};
    use std::io::Write;
    use std::os::fd::{AsRawFd, OwnedFd};
    use std::os::unix::fs::OpenOptionsExt;
    use std::os::unix::net::UnixStream;
    use std::time::{Duration, Instant};

    use fgos_agent_protocol::direct::{adapter_for, DirectAdapter};
    use fgos_process::containment::{select, ContainmentDomain, ContainmentDriver, GuaranteeLevel, SelectEnv, SpawnSpec, Spawned, StartMode};
    #[cfg(target_os = "linux")]
    use fgos_process::containment::{BwrapPidns, LinuxPgroup};
    use fgos_process::control::{signal_by_identity, take_inherited, Signal};
    use fgos_process::{facts, DomainState, FdSlot};
    use serde_json::{json, Value};

    use super::*;
    use crate::route::emit;
    use crate::envelope;
    use crate::go_channel::{read_frame, write_frame};

    const ATTEMPT_LOCK_SLOT: u32 = 3;
    const CWD_LEASE_SLOT: u32 = 4;
    const GO_SLOT: u32 = 5;
    const TICK: Duration = Duration::from_millis(50);
    const HEARTBEAT_EVERY: Duration = Duration::from_secs(5);
    /// How long the gate has to say HELLO after it started.
    const HELLO_LIMIT: Duration = Duration::from_secs(15);
    /// Slack beyond `gateKillGraceMs` before the supervisor ends the domain itself.
    const GATE_STOP_SLACK: Duration = Duration::from_secs(5);

    /// What the watch needs from the envelope.
    struct Watch {
        attempt_id: String,
        digest: String,
        run_dir: PathBuf,
        soft_at: Option<(String, u64)>,
        idle: Option<Duration>,
        grace: Duration,
        captures: [PathBuf; 2],
        adapter: &'static dyn DirectAdapter,
        boot_id: Option<String>,
    }

    impl Watch {
        fn from(envelope: &Value, run_dir: &Path) -> Result<Watch, String> {
            let text = |v: &Value, what: &str| v.as_str().map(String::from).ok_or_else(|| format!("envelope field {what} missing"));
            let soft_at = match (envelope["deadlines"]["softAt"]["bootId"].as_str(), envelope["deadlines"]["softAt"]["boottimeNs"].as_u64()) {
                (Some(boot), Some(ns)) => Some((boot.to_string(), ns)),
                _ => None,
            };
            Ok(Watch {
                attempt_id: text(&envelope["attemptId"], "attemptId")?,
                digest: text(&envelope["digest"], "digest")?,
                run_dir: run_dir.to_path_buf(),
                soft_at,
                idle: envelope["deadlines"]["idleMs"].as_u64().map(Duration::from_millis),
                grace: Duration::from_millis(envelope["deadlines"]["gateKillGraceMs"].as_u64().ok_or("envelope field deadlines.gateKillGraceMs missing")?),
                captures: [text(&envelope["launch"]["capture"]["stdout"], "launch.capture.stdout")?.into(), text(&envelope["launch"]["capture"]["stderr"], "launch.capture.stderr")?.into()],
                adapter: adapter_for(envelope["agentProtocol"]["cli"].as_str().unwrap_or_default()),
                boot_id: facts::boot_id(),
            })
        }

        fn soft_deadline_passed(&self) -> bool {
            let Some((boot_id, at)) = &self.soft_at else { return false };
            // Another boot than the recorded one: the instant is meaningless, treat it as past.
            self.boot_id.as_ref().is_some_and(|current| current != boot_id) || boottime_ns() >= *at
        }

        fn cancel_requested(&self) -> bool {
            fs::read_to_string(self.run_dir.join("cancel-requested.json"))
                .ok()
                .and_then(|t| serde_json::from_str::<Value>(&t).ok())
                .is_some_and(|v| v["attemptId"] == self.attempt_id.as_str())
        }
    }

    fn boottime_ns() -> u64 {
        let mut ts = libc::timespec { tv_sec: 0, tv_nsec: 0 };
        #[cfg(target_os = "linux")]
        let clock = libc::CLOCK_BOOTTIME;
        #[cfg(not(target_os = "linux"))]
        let clock = libc::CLOCK_MONOTONIC;
        // SAFETY: clock_gettime writes one timespec.
        unsafe { libc::clock_gettime(clock, &mut ts) };
        ts.tv_sec as u64 * 1_000_000_000 + ts.tv_nsec as u64
    }

    /// New capture bytes since the last look, judged by the adapter.
    struct CaptureTail {
        offsets: [u64; 2],
    }

    impl CaptureTail {
        fn active(&mut self, watch: &Watch) -> bool {
            use std::io::{Read, Seek, SeekFrom};
            let mut active = false;
            for (offset, path) in self.offsets.iter_mut().zip(&watch.captures) {
                let Ok(mut file) = File::open(path) else { continue };
                if file.seek(SeekFrom::Start(*offset)).is_err() {
                    continue;
                }
                let mut delta = Vec::new();
                if file.take(64 * 1024).read_to_end(&mut delta).is_ok() && !delta.is_empty() {
                    *offset += delta.len() as u64;
                    active |= watch.adapter.activity_from(&String::from_utf8_lossy(&delta)).is_active();
                }
            }
            active
        }
    }

    /// An inherited descriptor handed to this process: close-on-exec first.
    fn take_slot(slot: u32) -> Option<File> {
        take_inherited(FdSlot(slot)).ok()
    }

    fn poll_readable(fd: libc::c_int, timeout: Duration) -> bool {
        let mut p = [libc::pollfd { fd, events: libc::POLLIN, revents: 0 }];
        // SAFETY: poll over one valid pollfd.
        unsafe { libc::poll(p.as_mut_ptr(), 1, timeout.as_millis().min(i32::MAX as u128) as libc::c_int) > 0 }
    }

    fn driver_for(preferred: &str, bwrap: Option<PathBuf>) -> Result<Box<dyn ContainmentDriver>, String> {
        // The envelope names the driver; Linux builds it directly so a machine
        // with bwrap can still run a `linux-pgroup` envelope.
        #[cfg(target_os = "linux")]
        let driver: Box<dyn ContainmentDriver> = match preferred {
            "linux-pgroup" => Box::new(LinuxPgroup),
            "linux-gate" if bwrap.is_some() => Box::new(BwrapPidns::new(bwrap.clone().unwrap())),
            _ => select(&SelectEnv { bwrap }).map_err(|e| e.to_string())?,
        };
        #[cfg(not(target_os = "linux"))]
        let driver: Box<dyn ContainmentDriver> = select(&SelectEnv { bwrap }).map_err(|e| e.to_string())?;
        let name = match driver.name() {
            "bwrap-pidns" => "linux-gate",
            other => other,
        };
        if name != preferred {
            return Err(format!("the envelope asks for {preferred} but this machine gives {name}"));
        }
        Ok(driver)
    }

    fn write_atomic(dir: &Path, name: &str, value: &Value) -> std::io::Result<()> {
        let temp = dir.join(format!(".{name}.tmp.{}", std::process::id()));
        let mut file = OpenOptions::new().write(true).create(true).truncate(true).mode(0o600).open(&temp)?;
        file.write_all(&serde_json::to_vec(value).map_err(std::io::Error::other)?)?;
        fs::rename(&temp, dir.join(name))
    }

    pub fn run(args: &SuperviseArgs) -> i32 {
        // Before any other syscall: nothing this process spawns may inherit a lock.
        let Some(attempt_lock) = take_slot(ATTEMPT_LOCK_SLOT) else {
            report("supervise", "fd-invalid", "descriptor 3 (the attempt lock) was not handed over");
            return EXIT_INTERNAL;
        };

        let envelope = match envelope::read_verified(&args.envelope) {
            Ok(envelope) => envelope,
            Err(why) => {
                report("supervise", "envelope-invalid", &why);
                return EXIT_ENVELOPE_INVALID;
            }
        };
        if !envelope::host_bin_is_current(&envelope) {
            report("supervise", "host-version-mismatch", "the envelope names another host binary than the one running");
            return EXIT_VERSION_MISMATCH;
        }
        // Slot 4 is a lease only for a mutating attempt; anything else there is not ours.
        let mut cwd_lease = if envelope["mutation"] == "mutating" { take_slot(CWD_LEASE_SLOT) } else { None };
        let Some(run_dir) = envelope["runDir"].as_str().map(PathBuf::from) else {
            report("supervise", "envelope-invalid", "runDir missing");
            return EXIT_ENVELOPE_INVALID;
        };
        if envelope["mode"] != "direct" {
            report("supervise", "internal", "only the direct mode is supervised by this route");
            return EXIT_INTERNAL;
        }
        if envelope["mutation"] == "mutating" && cwd_lease.is_none() {
            report("supervise", "fd-invalid", "a mutating attempt needs descriptor 4 (the cwd lease)");
            return EXIT_INTERNAL;
        }
        let watch = match Watch::from(&envelope, &run_dir) {
            Ok(watch) => watch,
            Err(why) => {
                report("supervise", "envelope-invalid", &why);
                return EXIT_ENVELOPE_INVALID;
            }
        };

        let driver = match open_driver(&envelope) {
            Ok(driver) => driver,
            Err(why) => {
                report("supervise", "internal", &why);
                return EXIT_INTERNAL;
            }
        };
        let mut domain = match driver.create(&watch.attempt_id) {
            Ok(domain) => domain,
            Err(why) => {
                report("supervise", "internal", &why.to_string());
                return EXIT_INTERNAL;
            }
        };
        let (mine, theirs) = match UnixStream::pair() {
            Ok(pair) => pair,
            Err(why) => {
                report("supervise", "internal", &format!("socketpair: {why}"));
                return EXIT_INTERNAL;
            }
        };

        let spec = match gate_spec(&envelope, &run_dir, &attempt_lock, cwd_lease.as_ref(), theirs) {
            Ok(spec) => spec,
            Err(why) => {
                report("supervise", "internal", &why);
                return EXIT_INTERNAL;
            }
        };
        let mut spawned = match driver.spawn_in(&mut domain, spec) {
            Ok(spawned) => spawned,
            Err(why) => {
                report("supervise", "internal", &format!("gate did not start: {why}"));
                return EXIT_INTERNAL;
            }
        };
        let gate_started = Instant::now();

        // The domain is on record before the gate may run anything.
        if let Err(why) = bind(&envelope, &run_dir, &*driver, &domain, &spawned) {
            let _ = driver.kill_all(&mut domain, 0);
            report("supervise", "internal", &why);
            return EXIT_INTERNAL;
        }

        let mut go = mine;
        let hello = wait_for_hello(&mut go, &mut spawned, gate_started);
        let mut sent_go = false;
        if hello {
            let tuple = spawned.root.to_record().to_json();
            sent_go = write_frame(&mut go, &json!({"type": "GO", "attemptId": watch.attempt_id, "envelopeDigest": watch.digest, "gateHostTuple": tuple})).is_ok();
        }
        if !sent_go {
            // Without GO the gate runs nothing and leaves by itself; make sure.
            let _ = driver.kill_all(&mut domain, 0);
        }
        if sent_go {
            watch_gate(&watch, &mut go, &*driver, &mut domain, &mut spawned);
        }
        let _ = spawned.child.wait();

        // The domain must be empty before the lease goes: the gate normally
        // ended it; a best-effort driver may need one more sweep.
        if driver.is_empty(&mut domain) != DomainState::Empty {
            let _ = driver.kill_all(&mut domain, 0);
        }
        // The gate is gone: the cwd lease is released now, not after the steps.
        drop(cwd_lease.take());

        let outcome = match publish_receipt(&envelope, &run_dir) {
            Ok(outcome) => outcome,
            Err(why) => {
                report("supervise", "internal", &format!("receipt.json not published: {why}"));
                return EXIT_INTERNAL;
            }
        };
        let steps = crate::steps::run_steps(&envelope, &run_dir);
        let (result, pending) = match &steps {
            crate::steps::StepsOutcome::Done(ids) => {
                let closed = json!({"v": 1, "attemptId": watch.attempt_id, "closedBy": "supervisor", "steps": ids, "at": iso_utc_now()});
                if let Err(why) = serde_json::to_vec(&closed).map_err(std::io::Error::other).and_then(|b| publish_once(&run_dir, "closed.json", &b)) {
                    report("supervise", "internal", &format!("closed.json not published: {why}"));
                    return EXIT_INTERNAL;
                }
                ("closed", None)
            }
            other => {
                if let crate::steps::StepsOutcome::Retry { reason, .. } | crate::steps::StepsOutcome::Failed { reason, .. } = other {
                    eprintln!("fgos internal supervise: step {} left open: {reason}", other.pending().unwrap_or("?"));
                }
                ("open", other.pending().map(String::from))
            }
        };
        let mut line = json!({"result": result, "outcome": outcome});
        if let Some(step) = pending {
            line["pendingStep"] = Value::String(step);
        }
        emit(line);
        drop(attempt_lock);
        0
    }

    fn open_driver(envelope: &Value) -> Result<Box<dyn ContainmentDriver>, String> {
        let preferred = envelope["containment"]["preferred"].as_str().ok_or("containment.preferred missing")?;
        let bwrap = envelope["containment"]["bwrapPrefix"].as_array().and_then(|p| p.first()).and_then(Value::as_str).map(PathBuf::from);
        driver_for(preferred, bwrap)
    }

    fn gate_spec(envelope: &Value, run_dir: &Path, lock: &File, lease: Option<&File>, go_end: UnixStream) -> Result<SpawnSpec, String> {
        let host_bin = envelope["hostBin"].as_str().ok_or("hostBin missing")?;
        let mut argv = vec![host_bin.to_string(), "internal".into(), "gate".into(), "--protocol".into(), "1".into(), "--envelope".into(), run_dir.join("envelope.json").to_string_lossy().into_owned(), "--go-fd".into(), GO_SLOT.to_string()];
        let mut fd_map = vec![(FdSlot(ATTEMPT_LOCK_SLOT), lock.try_clone().map_err(|e| e.to_string())?)];
        let mut lock_fds = ATTEMPT_LOCK_SLOT.to_string();
        if let Some(lease) = lease {
            fd_map.push((FdSlot(CWD_LEASE_SLOT), lease.try_clone().map_err(|e| e.to_string())?));
            lock_fds.push_str(&format!(",{CWD_LEASE_SLOT}"));
        }
        fd_map.push((FdSlot(GO_SLOT), File::from(OwnedFd::from(go_end))));
        argv.extend(["--lock-fds".to_string(), lock_fds]);

        // The envelope's prefix ends with the `--` that separates bwrap's own
        // options from its command; the driver appends `--info-fd N --` itself.
        let bwrap_prefix = envelope["containment"]["bwrapPrefix"].as_array().map(|items| {
            let mut prefix: Vec<String> = items.iter().filter_map(Value::as_str).map(String::from).collect();
            if prefix.last().is_some_and(|last| last == "--") {
                prefix.pop();
            }
            prefix
        });
        let log = || OpenOptions::new().create(true).append(true).mode(0o600).custom_flags(libc::O_CLOEXEC).open(run_dir.join("supervisor.log")).map_err(|e| format!("supervisor.log: {e}"));
        Ok(SpawnSpec {
            argv,
            bwrap_prefix,
            fd_map,
            env: BTreeMap::new(),
            cwd: envelope["cwd"].as_str().ok_or("cwd missing")?.into(),
            stdin: None,
            stdout: Some(log()?),
            stderr: Some(log()?),
            mode: StartMode::Direct,
        })
    }

    /// `declare_domain` on the attempt lock, then `supervisor-binding.json`.
    fn bind(envelope: &Value, run_dir: &Path, driver: &dyn ContainmentDriver, domain: &ContainmentDomain, spawned: &Spawned) -> Result<(), String> {
        let record = domain.domain().ok_or("the driver returned no domain id")?;
        // The supervisor holds the attempt lock exclusively through the inherited description.
        let predecessor = fgos_holder_lock::predecessor::record_path(&run_dir.join("attempt.lock"));
        fgos_holder_lock::predecessor::declare(&predecessor, record).map_err(|e| format!("declare_domain: {e}"))?;
        let declared = fgos_holder_lock::predecessor::domain_json(record);
        let me = facts::self_identity().ok_or("the supervisor's own identity is unreadable")?;
        let guarantee = driver.guarantee();
        let binding = json!({
            "v": 1,
            "attemptId": envelope["attemptId"],
            "envelopeDigest": envelope["digest"],
            "supervisor": me.to_record().to_json(),
            "gate": spawned.root.to_record().to_json(),
            "domain": {"kind": declared["domainKind"], "id": declared["domainId"]},
            "guarantee": {
                "containment": if guarantee.level == GuaranteeLevel::Kernel { "kernel" } else { "best-effort" },
                "lock": "kernel",
            },
            "boundAt": iso_utc_now(),
        });
        publish_once(run_dir, "supervisor-binding.json", &serde_json::to_vec(&binding).map_err(|e| e.to_string())?).map_err(|e| format!("supervisor-binding.json: {e}"))?;
        Ok(())
    }

    /// `true` when the gate said HELLO; `false` when it left first or took too long.
    fn wait_for_hello(go: &mut UnixStream, spawned: &mut Spawned, since: Instant) -> bool {
        loop {
            if poll_readable(go.as_raw_fd(), TICK) {
                return read_frame(go).is_ok_and(|f| f["type"] == "HELLO");
            }
            if spawned.child.try_wait().ok().flatten().is_some() || since.elapsed() > HELLO_LIMIT {
                return false;
            }
        }
    }

    fn watch_gate(watch: &Watch, go: &mut UnixStream, driver: &dyn ContainmentDriver, domain: &mut ContainmentDomain, spawned: &mut Spawned) {
        let started = Instant::now();
        let mut last_active = started;
        let mut tail = CaptureTail { offsets: [0, 0] };
        let mut last_beat: Option<Instant> = None;
        let mut stopped: Option<Instant> = None;
        let mut ended_domain = false;
        let gate = spawned.root.clone();
        let mut channel_open = true;
        let mut agent_bound = false;
        loop {
            if spawned.child.try_wait().ok().flatten().is_some() {
                return;
            }
            if channel_open && poll_readable(go.as_raw_fd(), Duration::ZERO) {
                match read_frame(go) {
                    Ok(frame) if frame["type"] == "AGENT" && !agent_bound => {
                        agent_bound = true;
                        let body = json!({"v": 1, "attemptId": watch.attempt_id, "envelopeDigest": watch.digest, "agent": frame["tuple"], "at": iso_utc_now()});
                        if let Ok(bytes) = serde_json::to_vec(&body) {
                            let _ = publish_once(&watch.run_dir, "agent-binding.json", &bytes);
                        }
                    }
                    Ok(_) => {}
                    // The gate closed or broke the channel: it still reports through gate-exit.json.
                    Err(_) => channel_open = false,
                }
            }
            if tail.active(watch) {
                last_active = Instant::now();
            }
            if last_beat.is_none_or(|at| at.elapsed() >= HEARTBEAT_EVERY) {
                last_beat = Some(Instant::now());
                let _ = write_atomic(&watch.run_dir, "supervisor-heartbeat.json", &json!({"v": 1, "attemptId": watch.attempt_id, "at": iso_utc_now(), "agentBound": agent_bound}));
            }
            if stopped.is_none() {
                let cause = if watch.cancel_requested() {
                    Some("cancel")
                } else if watch.soft_deadline_passed() {
                    Some("soft-deadline")
                } else if watch.idle.is_some_and(|idle| last_active.elapsed() >= idle) {
                    Some("idle")
                } else {
                    None
                };
                if let Some(cause) = cause {
                    stopped = Some(Instant::now());
                    request_stop(watch, go, &gate, cause);
                }
            } else if !ended_domain && stopped.is_some_and(|at| at.elapsed() >= watch.grace + GATE_STOP_SLACK) {
                // The gate outlived its own grace: end the whole domain.
                ended_domain = true;
                let _ = driver.kill_all(domain, 0);
            }
            std::thread::sleep(TICK);
        }
    }

    /// `stop-requested.json` first, so the gate can name the cause, then STOP
    /// on the channel and SIGTERM to the gate by identity.
    fn request_stop(watch: &Watch, go: &mut UnixStream, gate: &facts::ProcTuple, cause: &str) {
        let body = json!({"v": 1, "attemptId": watch.attempt_id, "cause": cause, "at": iso_utc_now()});
        if let Ok(bytes) = serde_json::to_vec(&body) {
            let _ = publish_once(&watch.run_dir, "stop-requested.json", &bytes);
        }
        let _ = write_frame(go, &json!({"type": "STOP", "cause": cause}));
        let _ = signal_by_identity(gate, Signal::Term);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn outcome_follows_the_receipt_contract() {
        let exit = |by: &str| json!({"stoppedBy": by});
        assert_eq!(outcome_for(Some(&exit("agent")), false), "exited");
        for by in ["soft-deadline", "idle", "hard-ceiling"] {
            assert_eq!(outcome_for(Some(&exit(by)), false), "timeout");
        }
        assert_eq!(outcome_for(Some(&exit("cancel")), false), "cancelled");
        assert_eq!(outcome_for(Some(&exit("orphan")), true), "exited");
        assert_eq!(outcome_for(Some(&exit("orphan")), false), "gate-lost");
        assert_eq!(outcome_for(None, true), "gate-lost");
    }

    #[test]
    fn argv_needs_protocol_one_and_an_envelope() {
        let argv = |items: &[&str]| items.iter().map(|s| s.to_string()).collect::<Vec<_>>();
        assert_eq!(parse_args(&argv(&["--protocol", "1", "--envelope", "/e.json"])).unwrap().envelope, PathBuf::from("/e.json"));
        assert_eq!(parse_args(&argv(&["--envelope", "/e"])), Err(crate::route::ArgsError::VersionMismatch));
        assert!(matches!(parse_args(&argv(&["--protocol", "1"])), Err(crate::route::ArgsError::Usage(_))));
        assert!(matches!(parse_args(&argv(&["--protocol", "1", "--envelope", "/e", "--x", "1"])), Err(crate::route::ArgsError::Usage(_))));
    }
}
