//! The `holderLock` namespace: every lock operation of the Node facade, run in
//! the caller's process on the description Node opened. The lock rules live in
//! `fgos-holder-lock`; this file marshals. Capability: `take` hands out one
//! registration per worker thread and every call that acts on an open lock
//! takes it first, so no module but the facade can mint a lock from an fd.
use crate::check;
use fgos_holder_lock::origin::{self, Holder};
use fgos_holder_lock::{state_root, HelperExe, HoldersList, Probe, Resource, UnavailableReason};
#[cfg(unix)]
use fgos_holder_lock::{HeldReason, Mode, NodeLock, Release, Wait};
#[cfg(unix)]
use napi::{Env, JsObject};
use napi::{bindgen_prelude::External, Error, Result};
use napi_derive::napi;
use serde_json::{json, Value};
use std::{cell::Cell, path::Path};
#[cfg(unix)]
use std::sync::Mutex;

thread_local! { static TAKEN: Cell<bool> = const { Cell::new(false) }; }
pub struct Registration;
/// The lock a successful `lockFd` mints: a duplicate of the description and its creation marks.
#[cfg(unix)]
pub struct LockExternal(pub Mutex<Option<NodeLock>>);
#[cfg(not(unix))]
pub struct LockExternal;

/// The one error code the facade turns into `lock-driver-unavailable`.
fn door() -> Result<()> {
    check().map_err(|e| Error::from_reason(format!("holder-lock-unavailable: {}", e.reason)))
}
fn failed(message: impl std::fmt::Display) -> Error {
    Error::from_reason(message.to_string())
}

#[napi(namespace = "holderLock")]
pub fn take() -> Result<External<Registration>> {
    door()?;
    if TAKEN.with(|taken| taken.replace(true)) {
        return Err(failed("holder-lock-already-taken"));
    }
    Ok(External::new(Registration))
}

#[cfg(unix)]
fn mode_of(mode: &str) -> Result<Mode> {
    match mode {
        "ex" => Ok(Mode::Ex),
        "sh" => Ok(Mode::Sh),
        other => Err(failed(format!("holder-lock-mode-invalid: {other}"))),
    }
}

#[cfg(unix)]
fn wait_of(wait: &Value) -> Result<Wait> {
    match wait.get("kind").and_then(Value::as_str) {
        Some("try") => Ok(Wait::Try),
        Some("ms") => wait.get("ms").and_then(Value::as_u64).filter(|ms| *ms >= 1).map(Wait::Ms).ok_or_else(|| failed("holder-lock-wait-invalid: ms must be an integer >= 1")),
        _ => Err(failed("holder-lock-wait-invalid: kind must be try or ms")),
    }
}

/// Lock the description open on `fd`. `lock` on the answer is the External of an `acquired` lock.
/// Only where a description can be shared: Windows keeps its lock in the `lock-hold` helper.
#[cfg(unix)]
#[napi(namespace = "holderLock", js_name = "lockFd")]
pub fn lock_fd(env: Env, _capability: External<Registration>, fd: i32, mode: String, wait: Value, kill_wait_ms: u32, predecessor_kinds: Vec<String>) -> Result<JsObject> {
    door()?;
    use fgos_holder_lock::LockFd;
    let (mode, wait) = (mode_of(&mode)?, wait_of(&wait)?);
    // SAFETY: the facade owns `fd` and does not close it during this synchronous call.
    let (lock, answer) = match unsafe { fgos_holder_lock::lock_fd(fd, mode, wait, u64::from(kill_wait_ms), &predecessor_kinds) } {
        LockFd::Acquired(lock) => (Some(lock), json!({ "result": "acquired" })),
        LockFd::Held { reason, domain } => (None, held_json(reason, domain)),
        LockFd::Timeout { waited_ms } => (None, json!({ "result": "timeout", "waitedMs": waited_ms })),
        LockFd::Unavailable { reason, detail } => (None, unavailable_json(reason, &detail)),
    };
    let mut object = env.to_js_value(&answer)?.coerce_to_object()?;
    if let Some(lock) = lock {
        object.set("lock", External::new(LockExternal(Mutex::new(Some(lock)))))?;
    }
    Ok(object)
}

#[cfg(unix)]
fn held_json(reason: HeldReason, domain: Option<Value>) -> Value {
    let mut answer = json!({ "result": "held", "reason": reason.as_str() });
    if let Some(domain) = domain {
        answer["domain"] = domain;
    }
    answer
}

fn unavailable_json(reason: UnavailableReason, detail: &str) -> Value {
    json!({ "result": "unavailable", "reason": reason.as_str(), "detail": detail })
}

/// Is the lock free, from a fresh description and a shared try?
#[napi(namespace = "holderLock")]
pub fn probe(path: String) -> Result<Value> {
    door()?;
    let stem = Path::new(&path).file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default();
    match fgos_holder_lock::probe(&Resource::new(stem, &path)) {
        Ok(Probe::Free) => Ok(json!({ "result": "free" })),
        Ok(Probe::Held) => Ok(json!({ "result": "held", "reason": "kernel-lock-held" })),
        Err(err) if err.kind() == std::io::ErrorKind::Unsupported => Ok(unavailable_json(UnavailableReason::UnsupportedPlatform, &err.to_string())),
        Err(err) => Err(failed(format!("holder-lock-io: probe {path}: {err}"))),
    }
}

/// What the driver guarantees for lock files in `dir`.
#[napi(namespace = "holderLock")]
pub fn guarantee(dir: String) -> Result<Value> {
    door()?;
    Ok(fgos_holder_lock::guarantee(Path::new(&dir)).to_json())
}

#[cfg(unix)]
fn open_lock<R>(lock: &External<LockExternal>, call: impl FnOnce(&mut NodeLock) -> R) -> Result<R> {
    let mut guard = lock.0.lock().map_err(failed)?;
    Ok(call(guard.as_mut().ok_or_else(|| failed("holder-lock-closed"))?))
}

/// End what still holds the lock's description after the borrowing child `child_pid` exited.
#[cfg(target_os = "linux")]
#[napi(namespace = "holderLock", js_name = "drainChild")]
pub fn drain_child(_capability: External<Registration>, lock: External<LockExternal>, child_pid: u32, protected_roots: Vec<u32>) -> Result<Value> {
    door()?;
    open_lock(&lock, |lock| match fgos_holder_lock::drain_borrowed_description(lock, child_pid, &protected_roots) {
        Ok(killed) => json!({ "result": "drained", "leftoversKilled": killed, "remaining": [] }),
        Err(left) => json!({ "result": "not-drained", "leftoversKilled": left.killed, "remaining": left.pids }),
    })
}

/// Record a completed handoff under the held exclusive description.
#[cfg(unix)]
#[napi(namespace = "holderLock", js_name = "clearDomain")]
pub fn clear_domain(_capability: External<Registration>, lock: External<LockExternal>, path: String) -> Result<Value> {
    door()?;
    open_lock(&lock, |lock| match lock.clear_domain(Path::new(&path)) {
        Ok(()) => json!({ "result": "cleared" }),
        Err(err) if err.kind() == std::io::ErrorKind::InvalidInput => json!({ "result": "lock-handle-invalid", "detail": err.to_string() }),
        Err(err) => json!({ "result": "lock-domain-not-empty", "detail": err.to_string() }),
    })
}

/// Settle a lock whose own descriptor the caller already closed: end escaped copies and prove the lock gone.
#[cfg(unix)]
#[napi(namespace = "holderLock", js_name = "releaseFd")]
pub fn release_fd(_capability: External<Registration>, lock: External<LockExternal>) -> Result<Value> {
    door()?;
    let taken = lock.0.lock().map_err(failed)?.take();
    let Some(mut taken) = taken else { return Ok(json!({ "settled": "closed", "killed": 0, "pids": [] })) };
    Ok(match fgos_holder_lock::release_description(&mut taken) {
        Release::Released { killed } => json!({ "settled": "released", "killed": killed, "pids": [] }),
        Release::Stuck { killed, pids } => json!({ "settled": "stuck", "killed": killed, "pids": pids }),
    })
}

/// Drop the duplicate of a description that lives on in a process it was handed to.
#[cfg(unix)]
#[napi(namespace = "holderLock", js_name = "closeHandedOver")]
pub fn close_handed_over(_capability: External<Registration>, lock: External<LockExternal>) -> Result<()> {
    drop(lock.0.lock().map_err(failed)?.take());
    Ok(())
}

/// The state root of `env` and the input that decided it.
#[napi(namespace = "holderLock", js_name = "stateRoot")]
pub fn state_root_of(env: Value) -> Result<Value> {
    door()?;
    let (root, source) = state_root::state_root_from(|key| env.get(key).and_then(Value::as_str).map(String::from));
    Ok(json!({ "stateRoot": root.to_string_lossy(), "lockRoot": root.join("locks").to_string_lossy(), "source": source.as_str() }))
}

fn holder_json(holder: &Holder) -> Value {
    let tuple = &holder.tuple;
    json!({
        "pid": tuple.pid.0, "startTime": tuple.start_time, "host": tuple.host, "bootId": tuple.boot_id, "pidNs": tuple.pid_ns,
        "origin": holder.origin.as_str(), "cmdline": holder.cmdline,
    })
}

/// The processes holding the lock file at `path`, each with the origin Rust decided for the lock `lock_name`.
#[napi(namespace = "holderLock")]
pub fn holders(path: String, lock_name: String) -> Result<Value> {
    door()?;
    Ok(match fgos_holder_lock::holders(&Resource::new(&lock_name, &path)) {
        Ok(HoldersList::List(tuples)) => {
            let holders = origin::describe(tuples, &lock_name, &state_root::state_root().0);
            json!({ "kind": "list", "holders": holders.iter().map(holder_json).collect::<Vec<_>>() })
        }
        Ok(HoldersList::Unlistable(reason)) => json!({ "kind": "unlistable", "reason": reason }),
        Err(err) => json!({ "kind": "unlistable", "reason": format!("cannot open {path}: {err}") }),
    })
}

/// One reading of the predecessor record next to `lock_file`; never kills, never edits.
#[napi(namespace = "holderLock", js_name = "predecessorState")]
pub fn predecessor_state(lock_file: String) -> Result<Value> {
    door()?;
    let mut view = fgos_holder_lock::predecessor::contender_view(Path::new(&lock_file));
    view["result"] = "predecessor".into();
    Ok(view)
}

/// The two-process kernel-semantics probe in `dir`: elapsed milliseconds, or the named failure.
#[napi(namespace = "holderLock", js_name = "twoProcessProbe")]
pub fn two_process_probe(dir: String, helper_exe: Option<String>) -> Result<f64> {
    door()?;
    fgos_holder_lock::semantics::two_process_probe(Path::new(&dir), &HelperExe(helper_exe.unwrap_or_default().into())).map_err(failed)
}
