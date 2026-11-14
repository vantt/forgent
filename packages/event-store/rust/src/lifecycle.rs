//! The maintain policy of a store's lifecycle triggers (spec section 16): which open streams a trigger seals,
//! whether a publish is due, and the one answer to "does the Event Store run here". The per-command wrapper
//! that decides when a trigger runs stays with its process; the publish itself runs in a detached child the
//! caller starts when `sync_due` says so.
use crate::{
    errors::Error,
    layout::{Layout, StreamId},
    resolve::{resolve, ResolveError},
    seal::{seal_all, seal_if_due, SealRequest},
    sync::sync_status,
};
use std::path::Path;

/// The Event Store runs on Linux only: the one answer every caller asks.
pub fn platform_supported() -> bool {
    cfg!(target_os = "linux")
}

/// The code a caller reports when this platform has no Event Store.
pub const UNSUPPORTED_PLATFORM: &str = "event-store-unsupported-platform";

/// The three timers and the name a trigger reads from the `eventStore` config section.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Timers {
    /// The remote a publish goes to; a last attempt that went elsewhere makes a publish due.
    pub remote: String,
    /// Seconds an open stream may hold unsealed events before a trigger seals it.
    pub seal_interval_sec: u64,
    /// Seconds between publishes; 0 turns publishing off.
    pub sync_interval_sec: u64,
}

/// What kind of trigger this is.
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct Policy {
    /// A clean writer exit: seal every open stream.
    pub shutdown: bool,
    /// The end of a command: also decide whether a publish is due.
    pub end: bool,
    /// A dispatched worker never publishes; only the clone owner's own session does.
    pub dispatched: bool,
}

pub struct Request<'a> {
    pub cwd: &'a Path,
    pub trusted_main: &'a Path,
    pub state_root: &'a Path,
    pub timers: &'a Timers,
    pub policy: Policy,
    pub held_ranks: &'a [u32],
    pub hot_lock_depth: u32,
    /// Seconds since the epoch, as the caller's clock reads them.
    pub now_sec: f64,
}

#[derive(Debug, Default, PartialEq, Eq)]
pub struct Outcome {
    /// The code of the first step that failed, else its detail; later steps still ran.
    pub error: Option<String>,
    /// A publish is due and the caller starts the one detached child. Only ever set when `end` and not `dispatched`.
    pub sync_due: bool,
}

/// A publish is due when none was attempted yet, the last one went to another remote, or the last attempt is older than the
/// interval. An attempt is any sync that ran, including one that failed before its push (an offline fetch), so an offline
/// machine tries once per interval, not once per command.
pub fn sync_due(timers: &Timers, last_attempt: Option<(u64, &str)>, now_sec: f64) -> bool {
    if timers.sync_interval_sec == 0 {
        return false;
    }
    match last_attempt {
        None => true,
        Some((time, remote)) => {
            remote != timers.remote || now_sec - time as f64 >= timers.sync_interval_sec as f64
        }
    }
}

fn code_of(error: &Error) -> String {
    error.code.to_string()
}

/// Run the trigger for the store of `cwd`. Every step is attempted on its own and the first failure is the outcome's
/// error: a trigger never fails its caller. Durable open batches stay on disk, so the next trigger retries.
pub fn maintain(request: &Request) -> Outcome {
    let mut outcome = Outcome::default();
    let mut fail = |code: String| {
        outcome.error.get_or_insert(code);
    };
    if !platform_supported() {
        fail(UNSUPPORTED_PLATFORM.into());
        return outcome;
    }
    if let Err(e) = crate::locks::validate_seal_context(request.held_ranks, request.hot_lock_depth)
    {
        fail(code_of(&e));
        return outcome;
    }
    let resolved = match resolve(request.cwd, request.state_root, request.trusted_main, false) {
        Ok(resolved) => resolved,
        Err(e) => {
            fail(match &e {
                ResolveError::Machine(e) => code_of(e),
                other => other.code(),
            });
            return outcome;
        }
    };
    let layout = match Layout::from_common_dir(Some(resolved.repo.common_dir())) {
        Ok(layout) => layout,
        Err(e) => {
            fail(code_of(&e));
            return outcome;
        }
    };
    let streams = match layout.streams() {
        Ok(streams) => streams,
        Err(e) => {
            fail(code_of(&e));
            return outcome;
        }
    };
    let attempt = match sync_status(&layout) {
        Ok(record) => (record.time > 0).then_some((record.time, record.remote)),
        Err(e) => {
            fail(code_of(&e));
            return outcome;
        }
    };
    let (driver, repo) = (&resolved.driver, &resolved.repo);
    if request.policy.shutdown {
        if let Err(e) = seal_all(
            driver,
            repo,
            &layout,
            &resolved.machine,
            &streams,
            request.held_ranks,
            request.hot_lock_depth,
        ) {
            fail(code_of(&e));
        }
    } else {
        for stream in &streams {
            if let Err(e) = seal_one_if_due(request, &resolved, &layout, stream) {
                fail(code_of(&e));
            }
        }
    }
    if request.policy.end && !request.policy.dispatched {
        let last = attempt
            .as_ref()
            .map(|(time, remote)| (*time, remote.as_str()));
        outcome.sync_due = sync_due(request.timers, last, request.now_sec);
    }
    outcome
}

fn seal_one_if_due(
    request: &Request,
    resolved: &crate::resolve::Resolved,
    layout: &Layout,
    stream: &StreamId,
) -> Result<(), Error> {
    seal_if_due(
        &resolved.driver,
        &resolved.repo,
        SealRequest {
            layout,
            machine: &resolved.machine,
            stream,
            held_ranks: request.held_ranks,
            hot_lock_depth: request.hot_lock_depth,
            opportunistic: true,
        },
        request.timers.seal_interval_sec,
    )
    .map(drop)
}
