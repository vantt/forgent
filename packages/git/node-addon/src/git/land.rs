use super::{
    handover::{consume, Loan},
    operation, text,
};
use crate::{check, error};
use fgos_git::*;
use napi::{bindgen_prelude::External, Env, JsObject, Result};
use napi_derive::napi;
use serde_json::{json, Value};
use std::{
    path::Path,
    sync::{Arc, Mutex, MutexGuard, PoisonError},
};
/// What the port may do next. `Pending` is a call running off the JS thread;
/// `closed` records a `close()` that arrived meanwhile, so the session that call
/// produces is dropped when it settles and never holds the destination slot.
enum State {
    Idle,
    Pending { closed: bool },
    Open(Box<LandSession>),
}
struct Core {
    driver: GitDriver,
    repo: RepoHandle,
    writer: String,
}
/// Why a call failed, kept apart from `napi::Error` so it can cross threads.
enum Failure {
    Operation(OperationError),
    Text(&'static str),
}
fn slot(state: &Mutex<State>) -> MutexGuard<'_, State> {
    state.lock().unwrap_or_else(PoisonError::into_inner)
}
/// Ends a pending call. The session is kept only if `close()` did not run meanwhile;
/// the answer says whether it did.
fn settle(state: &Mutex<State>, session: Option<LandSession>) -> bool {
    let mut guard = slot(state);
    let closed = matches!(*guard, State::Pending { closed: true });
    *guard = match session {
        Some(session) if !closed => State::Open(Box::new(session)),
        _ => State::Idle,
    };
    closed
}
fn pending_state(state: &Mutex<State>) -> Result<()> {
    match *slot(state) {
        State::Idle => Ok(()),
        State::Pending { .. } => Err(error("land-call-pending")),
        State::Open(_) => Err(error("land-session-already-open")),
    }
}
fn into_napi(outcome: std::result::Result<Value, Failure>) -> Result<Value> {
    outcome.map_err(|failure| match failure {
        Failure::Operation(e) => operation(e),
        Failure::Text(text) => error(text),
    })
}
fn answer(env: Env, outcome: std::result::Result<Value, Failure>) -> Result<JsObject> {
    let (deferred, promise) = env.create_deferred::<Value, _>()?;
    deferred.resolve(move |_| into_napi(outcome));
    Ok(promise)
}
/// The one rule for a call that panics: the port goes back to idle and the call fails by name.
fn guarded(
    state: &Mutex<State>,
    job: impl FnOnce() -> std::result::Result<Value, Failure>,
) -> std::result::Result<Value, Failure> {
    std::panic::catch_unwind(std::panic::AssertUnwindSafe(job)).unwrap_or_else(|_| {
        *slot(state) = State::Idle;
        Err(Failure::Text("land-worker-failed"))
    })
}
/// Runs a call on its own thread so a wait never blocks the event loop, and
/// returns the promise it settles. A worker that panics leaves the port idle.
fn spawn(
    env: Env,
    state: &Arc<Mutex<State>>,
    job: impl FnOnce() -> std::result::Result<Value, Failure> + Send + 'static,
) -> Result<JsObject> {
    let (deferred, promise) = env.create_deferred::<Value, _>()?;
    let owned = Arc::clone(state);
    let spawned = std::thread::Builder::new()
        .name("fgos-land".into())
        .spawn(move || {
            let outcome = guarded(&owned, job);
            deferred.resolve(move |_| into_napi(outcome));
        });
    if let Err(e) = spawned {
        *slot(state) = State::Idle;
        return Err(error(e));
    }
    Ok(promise)
}
#[napi]
pub struct GitLand {
    core: Arc<Core>,
    state: Arc<Mutex<State>>,
}
#[napi]
impl GitLand {
    #[napi(constructor)]
    pub fn new(
        state_root: String,
        repo_path: String,
        trusted_main: String,
        writer: String,
    ) -> Result<Self> {
        check()?;
        let driver = GitDriver::new(Path::new(&state_root)).map_err(operation)?;
        let repo = match driver
            .resolve_repo(Path::new(&repo_path), Path::new(&trusted_main))
            .map_err(operation)?
        {
            ResolveRepo::Repository(r) => r,
            _ => return Err(error("not-a-repository")),
        };
        Ok(Self {
            core: Arc::new(Core {
                driver,
                repo,
                writer,
            }),
            state: Arc::new(Mutex::new(State::Idle)),
        })
    }
    /// With held locks the call makes one attempt on this thread, because a borrowed
    /// lock never leaves the call that lent it; without them it waits on its own thread.
    #[napi]
    pub fn prepare(&self, env: Env, args: Value, loans: Vec<External<Loan>>) -> Result<JsObject> {
        check()?;
        pending_state(&self.state)?;
        let request: LandRequest = serde_json::from_value(
            args.get("request")
                .cloned()
                .ok_or_else(|| error("missing request"))?,
        )
        .map_err(error)?;
        let wait_ms = match args.get("waitMs") {
            None => 0,
            Some(value) => value.as_u64().ok_or_else(|| error("invalid land waitMs"))?,
        };
        let id = text(&args, "operationId")?.to_owned();
        let held = consume(loans)?;
        if !held.is_empty() && wait_ms > 0 {
            return Err(error("land-wait-with-held-locks"));
        }
        *slot(&self.state) = State::Pending { closed: false };
        let (core, state) = (Arc::clone(&self.core), Arc::clone(&self.state));
        let held_here = !held.is_empty();
        let job = move |held| match core.driver.prepare_land_wait(
            &core.repo,
            held,
            &request,
            &core.writer,
            &id,
            wait_ms,
        ) {
            Ok(session) => {
                let result = json!({"candidate":session.candidate(),"receipt":session.receipt()});
                if settle(&state, Some(session)) {
                    Err(Failure::Text("land-session-closed"))
                } else {
                    Ok(result)
                }
            }
            Err(e) => {
                settle(&state, None);
                Err(Failure::Operation(e))
            }
        };
        if held_here {
            return answer(env, guarded(&self.state, || job(held)));
        }
        spawn(env, &self.state, move || job(Vec::new()))
    }
    #[napi]
    pub fn publish(&self, env: Env, evidence: Value, wait_ms: Option<u32>) -> Result<JsObject> {
        check()?;
        let evidence: LandEvidence = serde_json::from_value(evidence).map_err(error)?;
        let mut session = {
            let mut guard = slot(&self.state);
            match std::mem::replace(&mut *guard, State::Pending { closed: false }) {
                State::Open(session) => *session,
                State::Pending { closed } => {
                    *guard = State::Pending { closed };
                    return Err(error("land-call-pending"));
                }
                State::Idle => {
                    *guard = State::Idle;
                    return Err(error("land-session-required"));
                }
            }
        };
        let (core, state) = (Arc::clone(&self.core), Arc::clone(&self.state));
        spawn(env, &self.state, move || {
            let receipt = core.driver.publish_land_wait(
                &core.repo,
                &mut session,
                &evidence,
                wait_ms.unwrap_or(0).into(),
            );
            settle(&state, Some(session));
            receipt.map(|r| json!(r)).map_err(Failure::Operation)
        })
    }
    #[napi]
    pub fn recover(&self, args: Value, loans: Vec<External<Loan>>) -> Result<Value> {
        check()?;
        pending_state(&self.state)?;
        let id = text(&args, "operationId")?;
        let receipt = self
            .core
            .driver
            .recover_land(&self.core.repo, consume(loans)?, &self.core.writer, id)
            .map_err(operation)?;
        let warnings = match args.get("consumerAcknowledgement") {
            Some(value) => {
                let acknowledgement = value
                    .as_str()
                    .ok_or_else(|| error("expected consumerAcknowledgement string"))?;
                if acknowledgement.is_empty() {
                    return Err(error("land-consumer-acknowledgement-required"));
                }
                self.core
                    .driver
                    .acknowledge_land(&self.core.repo, &self.core.writer, id, acknowledgement)
                    .unwrap_or_else(|e| vec![format!("land-cleanup-deferred: {}", e.cause)])
            }
            None => vec![],
        };
        Ok(json!({"receipt": receipt, "warnings": warnings}))
    }
    #[napi]
    pub fn close(&self) -> Result<()> {
        check()?;
        let mut guard = slot(&self.state);
        *guard = match *guard {
            State::Pending { .. } => State::Pending { closed: true },
            _ => State::Idle,
        };
        Ok(())
    }
}
