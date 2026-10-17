//! The gate on Windows. It is a member of the attempt's named job (the
//! supervisor spawns it suspended, assigns it, then resumes it) and opens that
//! job by name to hold a handle of its own, so the attempt survives the
//! supervisor. There is no pid 1 and no signal:
//!
//! - the stop request is `stop-requested.json`, polled; the supervisor
//!   publishes it before anything else, exactly as before a Unix SIGTERM;
//! - the agent runs in a nested kill-on-close job of the gate's own, so ending
//!   the agent's tree never ends the gate (which is a member of the outer job);
//! - the agent's end of the domain is "the outer job holds nothing but the gate".

use std::collections::BTreeMap;
use std::fs::{File, OpenOptions};
use std::sync::mpsc;
use std::time::{Duration, Instant};

use fgos_process::facts;
use fgos_process::platform::windows_job::{create_kill_job, job_view, open_job, Job};
use fgos_process::platform::windows_spawn::{spawn, ChildStdio, SpawnSpec, Spawned};
use fgos_process::ProcId;
use serde_json::{json, Value};
use windows_sys::Win32::System::Console::{GenerateConsoleCtrlEvent, CTRL_BREAK_EVENT};
use windows_sys::Win32::System::Threading::{CREATE_NEW_PROCESS_GROUP, CREATE_SUSPENDED};

use super::{ceiling_left, go_matches, load_config, publish_gate_exit, read_side_env, report, stop_cause, stop_for, Config, GateArgs, GoEnd, Stop, EXIT_ENVELOPE_INVALID, EXIT_INTERNAL, EXIT_NO_GO, EXIT_USAGE};
use crate::go_channel::{read_frame, write_frame};
use crate::go_pipe;

/// How often the gate looks at the agent, the stop file and the ceiling.
const POLL: Duration = Duration::from_millis(20);
/// The longest wait for the outer job to hold only the gate after the agent's tree was ended.
const EMPTY_WAIT: Duration = Duration::from_secs(10);

pub fn run(args: &GateArgs) -> i32 {
    let GoEnd::Socket(pipe_path) = &args.go else {
        eprintln!("fgos internal gate: usage: --go-fd is a Unix channel; pass --go-socket");
        return EXIT_USAGE;
    };
    let Some(job_name) = args.job_name.as_deref() else {
        eprintln!("fgos internal gate: usage: --job-name is required on Windows");
        return EXIT_USAGE;
    };
    if !args.lock_fds.is_empty() {
        eprintln!("fgos internal gate: usage: --lock-fds has no meaning on Windows; the lock is scoped to the job");
        return EXIT_USAGE;
    }
    let config = match load_config(&args.envelope) {
        Ok(config) => config,
        Err(why) => {
            report("envelope-invalid", &why);
            return EXIT_ENVELOPE_INVALID;
        }
    };
    if config.preferred != "windows-job" {
        report("wrong-driver", "the envelope does not name windows-job");
        return EXIT_INTERNAL;
    }
    // The second holder of the attempt's job: it outlives the supervisor's handle.
    let outer = match open_job(job_name) {
        Ok(job) => job,
        Err(err) => {
            report("job-open-failed", &format!("{job_name}: {err}"));
            return EXIT_INTERNAL;
        }
    };
    if outer.contains(std::process::id()) != Some(true) {
        report("not-in-job", "the gate is not a member of the attempt's job");
        return EXIT_INTERNAL;
    }

    let mut go = match go_pipe::connect(pipe_path) {
        Ok(file) => file,
        Err(_) => return EXIT_NO_GO,
    };
    if write_frame(&mut go, &json!({"type": "HELLO", "attemptId": config.attempt_id})).is_err() {
        return EXIT_NO_GO;
    }
    let go_frame = match wait_for_go(&go, &config) {
        Some(frame) => frame,
        None => return EXIT_NO_GO,
    };
    if !go_matches(&config, &go_frame) {
        report("go-mismatch", "GO does not name this attempt's envelope");
        return EXIT_ENVELOPE_INVALID;
    }
    let secrets = match read_side_env(&config) {
        Ok(env) => env,
        Err(why) => {
            report("envelope-invalid", &why);
            return EXIT_ENVELOPE_INVALID;
        }
    };
    match supervise_agent(&config, &go_frame, secrets, &mut go, job_name) {
        Ok(()) => 0,
        Err(why) => {
            report("gate-failed", &why);
            EXIT_INTERNAL
        }
    }
}

/// Wait for the GO frame. `None`: EOF, a protocol error, or a stop request
/// before `GO`. The frame is read on a thread so the stop file is still seen
/// while the supervisor has sent nothing.
fn wait_for_go(go: &File, config: &Config) -> Option<Value> {
    let mut reader = go.try_clone().ok()?;
    let (tx, rx) = mpsc::channel();
    std::thread::spawn(move || {
        let _ = tx.send(read_frame(&mut reader).ok());
    });
    loop {
        match rx.recv_timeout(POLL) {
            Ok(frame) => return frame,
            Err(mpsc::RecvTimeoutError::Timeout) => {
                if stop_cause(config).is_some() {
                    return None;
                }
            }
            Err(mpsc::RecvTimeoutError::Disconnected) => return None,
        }
    }
}

fn supervise_agent(config: &Config, go_frame: &Value, secrets: BTreeMap<String, String>, go: &mut File, job_name: &str) -> Result<(), String> {
    // The agent's own job: ending it ends the agent's tree and nothing else.
    let nested = create_kill_job(&format!("Local\\fgos-gate-agent-{}", job_suffix(job_name))).map_err(|e| format!("agent job: {e}"))?;
    let mut stop: Option<Stop> = None;
    let mut exit_code: Option<u32> = None;
    let mut agent: Option<Spawned> = None;

    if ceiling_left(config) == Some(Duration::ZERO) {
        // A ceiling already behind us: the agent never starts.
        stop = Some(Stop { stopped_by: "hard-ceiling", cause: "hard-ceiling".into() });
    } else {
        let started = spawn_agent(config, go_frame, secrets, &nested)?;
        let tuple = facts::identity_of(ProcId(started.id())).map_or(Value::Null, |t| t.to_record().to_json());
        let _ = write_frame(go, &json!({"type": "AGENT", "tuple": tuple}));
        agent = Some(started);
    }

    let mut grace_ends: Option<Instant> = None;
    let mut escalated = false;
    while let Some(running) = agent.as_ref() {
        match running.try_wait().map_err(|e| format!("agent wait: {e}"))? {
            Some(code) => {
                exit_code = Some(code);
                break;
            }
            None => {}
        }
        if stop.is_none() {
            if let Some(cause) = stop_cause(config) {
                stop = Some(stop_for(Some(cause)));
                grace_ends = Some(Instant::now() + config.grace);
                ask_agent_to_stop(running);
            }
        }
        if stop.is_none() && ceiling_left(config) == Some(Duration::ZERO) {
            stop = Some(Stop { stopped_by: "hard-ceiling", cause: "hard-ceiling".into() });
            grace_ends = Some(Instant::now() + config.grace);
            ask_agent_to_stop(running);
        }
        if !escalated && grace_ends.is_some_and(|at| Instant::now() >= at) {
            // Retried on the next poll when the kill was refused.
            escalated = nested.terminate().is_ok();
        }
        std::thread::sleep(POLL);
    }

    end_domain(&nested, job_name);

    publish_gate_exit(config, exit_code.map_or(Value::Null, Value::from), Value::Null, stop)
}

/// The part of the job name that is unique to the attempt, for the nested job's name.
fn job_suffix(job_name: &str) -> String {
    job_name.rsplit('\\').next().unwrap_or(job_name).chars().take(120).collect()
}

fn spawn_agent(config: &Config, go_frame: &Value, secrets: BTreeMap<String, String>, nested: &Job) -> Result<Spawned, String> {
    let append = |path: &std::path::Path| OpenOptions::new().create(true).append(true).open(path).map_err(|e| format!("capture {}: {e}", path.display()));
    let stdout = append(&config.stdout)?;
    let stderr = append(&config.stderr)?;
    let stdin = match &config.brief {
        Some(path) => ChildStdio::File(File::open(path).map_err(|e| format!("brief {}: {e}", path.display()))?),
        None => ChildStdio::Null,
    };
    let mut env: BTreeMap<String, String> = config.env.clone();
    env.extend(secrets);
    env.remove("FGOS_PIDNS_ANCHOR");
    if let Some(anchor) = go_frame.get("gateHostTuple").filter(|t| !t.is_null()) {
        env.insert("FGOS_PIDNS_ANCHOR".into(), anchor.to_string());
    }
    let spec = SpawnSpec {
        program: config.command.clone().into(),
        args: config.args.iter().map(Into::into).collect(),
        cwd: Some(config.cwd.clone()),
        env: Some(env.into_iter().map(|(k, v)| (k.into(), v.into())).collect()),
        // Suspended so the agent runs its first instruction inside the nested job; its own
        // process group so a console break can be aimed at it alone.
        creation_flags: CREATE_SUSPENDED | CREATE_NEW_PROCESS_GROUP,
        stdin,
        stdout: ChildStdio::File(stdout),
        stderr: ChildStdio::File(stderr),
    };
    let agent = spawn(spec).map_err(|e| format!("agent {} did not start: {e}", config.command))?;
    agent.assign_and_resume(nested).map_err(|e| format!("agent could not enter its job: {e}"))?;
    Ok(agent)
}

/// The polite stop: a console break to the agent's process group. It reaches
/// the agent only when the gate has a console; the grace then runs out and the
/// job is ended, which is the guarantee.
fn ask_agent_to_stop(agent: &Spawned) {
    // SAFETY: the group id is the pid of the process this gate created with CREATE_NEW_PROCESS_GROUP.
    unsafe { GenerateConsoleCtrlEvent(CTRL_BREAK_EVENT, agent.id()) };
}

/// End everything in the agent's job, then wait for the attempt's job to hold
/// only the gate. Bounded: a member that cannot be ended is named on stderr and
/// left to the supervisor's `kill_all`, which can end the gate too.
fn end_domain(nested: &Job, job_name: &str) {
    let me = std::process::id();
    let _ = nested.terminate();
    let Some(mut view) = job_view(job_name) else { return };
    let start = Instant::now();
    loop {
        let others: Vec<u32> = view.live_pids().into_iter().filter(|pid| *pid != me).collect();
        if others.is_empty() {
            return;
        }
        if start.elapsed() >= EMPTY_WAIT {
            eprintln!("fgos internal gate: processes still in the job after {EMPTY_WAIT:?}: {others:?}");
            return;
        }
        let _ = nested.terminate();
        std::thread::sleep(Duration::from_millis(10));
    }
}
