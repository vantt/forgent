//! The supervisor's `external` launch mode: an external agent host (paseo, an ACP client) starts the
//! agent CLI through `fgos exec`, which execs the gate. The host keeps the agent's stdio and speaks the
//! CLI's protocol over it; the supervisor holds the attempt lock, the deadlines and the receipt, and
//! never sees a byte of the agent's IO.
//!
//! The order follows the terminal mode: the socket exists before the controller asks the host to start
//! the agent; `GO` goes out only after the gate's identity is on the lock (`declare_domain`) and the
//! attempt is bound. There is no brief, no screen and no capture file, so no idle timer and no output
//! budget: the stop causes are cancel and the soft deadline, and the hard ceiling stays the gate's.

use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use fgos_process::facts::{self, ProcTuple};
use fgos_process::{domain_is_empty, domain_kill_all, Domain, DomainState, ProcId};
use serde_json::{json, Value};

use super::terminal::{domain_of, send_frame_with_fds, tuple_of, AttemptSocket};
use super::{
    os, request_stop, GateLink, Refusal, TerminalEnd, Watch, GATE_STOP_SLACK, HELLO_LIMIT, TICK,
};
use crate::route::EXIT_ENVELOPE_INVALID;

/// How long past the grace a refused domain kill is retried before the attempt is published as it stands.
const DOMAIN_END_WAIT: Duration = Duration::from_secs(10);

struct Plan {
    socket_path: PathBuf,
    domain_kind: String,
    hello_limit: Duration,
}

impl Plan {
    fn from(envelope: &Value) -> Result<Plan, Refusal> {
        let invalid = |why: String| Refusal {
            exit: EXIT_ENVELOPE_INVALID,
            code: "envelope-invalid",
            why,
        };
        let text = |v: &Value, what: &str| {
            v.as_str()
                .map(String::from)
                .ok_or_else(|| invalid(format!("envelope field {what} missing")))
        };
        Ok(Plan {
            socket_path: PathBuf::from(text(
                &envelope["external"]["socketPath"],
                "external.socketPath",
            )?),
            domain_kind: text(
                &envelope["containment"]["preferred"],
                "containment.preferred",
            )?,
            hello_limit: envelope["external"]["helloLimitMs"]
                .as_u64()
                .map_or(HELLO_LIMIT, Duration::from_millis),
        })
    }
}

/// The gate as the host sees it: the connecting process itself, from the kernel's peer credentials
/// (translated for a reader in an ancestor PID namespace). Behind a sandbox it must be pid 1 of its
/// own namespace, or it is not the gate the envelope asked for.
fn gate_tuple(
    stream: &std::os::unix::net::UnixStream,
    sandboxed: bool,
) -> Result<ProcTuple, String> {
    let pid = crate::go_channel::peer_cred(stream)
        .map(|c| c.pid as u32)
        .filter(|pid| *pid != 0)
        .ok_or("the gate's peer credentials name no process")?;
    if sandboxed
        && !facts::ns_pids_of(ProcId(pid)).is_some_and(|ns| ns.len() > 1 && ns.last() == Some(&1))
    {
        return Err(format!(
            "process {pid} is not pid 1 of a namespace of its own"
        ));
    }
    facts::identity_of(ProcId(pid)).ok_or_else(|| format!("process {pid} is gone"))
}

pub(super) fn run(
    envelope: &Value,
    run_dir: &Path,
    mut locks: os::Locks,
    watch: &Watch,
) -> Result<i32, Refusal> {
    let plan = Plan::from(envelope)?;
    let mut socket = AttemptSocket::bind(&plan.socket_path).map_err(Refusal::internal)?;

    let Some(stream) = socket.accept_gate(&watch.attempt_id, plan.hello_limit) else {
        socket.close();
        return super::not_started(
            envelope,
            run_dir,
            watch,
            locks,
            "external-gate-silent",
            "the external host did not start the gate in time",
        );
    };
    // One gate per attempt: a host that starts the agent again finds no socket and runs nothing.
    socket.close();

    let gate = gate_tuple(&stream, plan.domain_kind == "linux-gate").map_err(Refusal::internal)?;
    let domain = domain_of(&plan.domain_kind, gate.clone()).map_err(Refusal::internal)?;
    if let Err(why) = super::bind_record(
        envelope,
        run_dir,
        &locks,
        &domain,
        &gate,
        plan.domain_kind == "linux-gate",
    ) {
        let _ = domain_kill_all(&domain);
        return Err(Refusal::internal(why));
    }
    let go_frame = json!({"type": "GO", "attemptId": watch.attempt_id, "envelopeDigest": watch.digest, "gateHostTuple": gate.to_record().to_json()});
    if let Err(why) = send_frame_with_fds(&stream, &go_frame, &locks.raw_fds()) {
        // Without GO the gate runs nothing and leaves by itself; make sure.
        let _ = domain_kill_all(&domain);
        return super::not_started(
            envelope,
            run_dir,
            watch,
            locks,
            "external-go-not-sent",
            &format!("GO was not sent: {why}"),
        );
    }

    let mut go = os::Go::from_stream(stream);
    let mut link = GateLink::new();
    let mut stopped: Option<Instant> = None;
    let mut gate_gone = false;
    let give_up_after = watch.grace + GATE_STOP_SLACK + DOMAIN_END_WAIT;
    loop {
        if domain_is_empty(&domain) == DomainState::Empty {
            gate_gone = true;
        }
        link.read_frames(watch, &mut go, gate_gone);
        if gate_gone || stopped.is_some_and(|at| at.elapsed() >= give_up_after) {
            break;
        }
        match stopped {
            None => {
                let cause = if watch.cancel_requested() {
                    Some("cancel")
                } else if watch.soft_deadline_passed() {
                    Some("soft-deadline")
                } else {
                    None
                };
                if let Some(cause) = cause {
                    stopped = Some(Instant::now());
                    request_stop(watch, &mut go, &gate, cause);
                }
            }
            Some(at) => link.escalate(watch, at, || domain_kill_all(&domain)),
        }
        std::thread::sleep(TICK);
    }

    if domain_is_empty(&domain) != DomainState::Empty {
        let _ = domain_kill_all(&domain);
    }
    // A process group does not hold the agent (it leads a session of its own): end it by identity.
    if let (Domain::LinuxPgroup(_), Some(agent)) = (&domain, link.agent.as_ref().and_then(tuple_of))
    {
        let _ =
            fgos_process::control::signal_by_identity(&agent, fgos_process::control::Signal::Kill);
    }
    drop(go);
    locks.release_cwd();
    super::finish(
        envelope,
        run_dir,
        watch,
        locks,
        false,
        &TerminalEnd::default(),
    )
}
