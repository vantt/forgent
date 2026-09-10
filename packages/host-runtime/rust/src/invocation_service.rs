//! Invocation service pipeline for `fgos-host-runtime`.
//!
//! Kernel §6:
//! Pipeline: received -> admit -> Router.select -> grant -> invoke -> normalize -> record.
//!
//! Owns invocation execution, failure normalization, and lifecycle recording.
//! Enforces two-stage authority (CallerAdmission before routing, ProviderGrant after routing).
//! Calls pure [`crate::operation_provider_router::select`] read-only.

use crate::authority_gate::{CallerAdmission, ProviderGrant};
use crate::contracts::{
    ContractRef, HostInvocation, OperationId, ProviderDescriptor, ProviderError, ProviderOutcome,
    RegistrySnapshot,
};
use crate::operation_provider_router::{select, RouterPolicy, SelectionInput, SelectionRefused};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::future::Future;
use std::panic::{catch_unwind, AssertUnwindSafe};
use std::pin::Pin;
use std::sync::{Arc, Mutex, RwLock};
use std::task::{Context, Poll};
use std::time::SystemTime;

/// Trait implemented by operation providers.
///
/// Defined here per kernel §6 sketch (lines 126-134).
pub trait OperationProvider: Send + Sync {
    /// Returns the static descriptor of this provider.
    fn descriptor(&self) -> &ProviderDescriptor;

    /// Asynchronously invokes the operation.
    fn invoke<'a>(
        &'a self,
        invocation: &'a HostInvocation,
        request: crate::contracts::OperationRequest,
        control: InvocationControl,
        events: &'a dyn EventSink,
    ) -> Pin<Box<dyn Future<Output = Result<ProviderOutcome, ProviderError>> + Send + 'a>>;
}

/// Control context passed to an operation provider invocation.
///
/// Carries deadline, cancellation signaling, and granted capabilities.
#[derive(Debug, Clone)]
pub struct InvocationControl {
    pub deadline: Option<SystemTime>,
    pub cancellation_token: Option<String>,
    pub granted_capabilities: Vec<String>,
    cancellation_rx: Option<tokio::sync::watch::Receiver<bool>>,
}

impl InvocationControl {
    pub fn new(
        deadline: Option<SystemTime>,
        cancellation_token: Option<String>,
        granted_capabilities: Vec<String>,
    ) -> Self {
        Self {
            deadline,
            cancellation_token,
            granted_capabilities,
            cancellation_rx: None,
        }
    }

    pub fn with_cancellation_rx(mut self, rx: tokio::sync::watch::Receiver<bool>) -> Self {
        self.cancellation_rx = Some(rx);
        self
    }

    /// Checks if cancellation has been requested.
    pub fn is_cancelled(&self) -> bool {
        if let Some(rx) = &self.cancellation_rx {
            *rx.borrow()
        } else {
            false
        }
    }

    /// Checks if the invocation deadline has been exceeded.
    pub fn is_deadline_exceeded(&self) -> bool {
        if let Some(deadline) = self.deadline {
            SystemTime::now() > deadline
        } else {
            false
        }
    }

    /// Returns the granted capability set.
    pub fn granted_capabilities(&self) -> &[String] {
        &self.granted_capabilities
    }
}

/// Sink for progress, events, and diagnostic records during invocation.
pub trait EventSink: Send + Sync {
    fn record_progress(&self, progress: &str);
    fn record_event(&self, event: &str);
    fn record_diagnostic(&self, diagnostic: &str);
}

/// In-memory implementation of [`EventSink`] collecting entries in thread-safe buffers.
#[derive(Debug, Default)]
pub struct InMemoryEventSink {
    progress: Mutex<Vec<String>>,
    events: Mutex<Vec<String>>,
    diagnostics: Mutex<Vec<String>>,
}

impl InMemoryEventSink {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn progress_entries(&self) -> Vec<String> {
        self.progress.lock().unwrap().clone()
    }

    pub fn events(&self) -> Vec<String> {
        self.events.lock().unwrap().clone()
    }

    pub fn diagnostics(&self) -> Vec<String> {
        self.diagnostics.lock().unwrap().clone()
    }
}

impl EventSink for InMemoryEventSink {
    fn record_progress(&self, progress: &str) {
        self.progress.lock().unwrap().push(progress.to_string());
    }

    fn record_event(&self, event: &str) {
        self.events.lock().unwrap().push(event.to_string());
    }

    fn record_diagnostic(&self, diagnostic: &str) {
        self.diagnostics
            .lock()
            .unwrap()
            .push(diagnostic.to_string());
    }
}

/// No-op implementation of [`EventSink`].
#[derive(Debug, Default, Clone, Copy)]
pub struct NoopEventSink;

impl EventSink for NoopEventSink {
    fn record_progress(&self, _progress: &str) {}
    fn record_event(&self, _event: &str) {}
    fn record_diagnostic(&self, _diagnostic: &str) {}
}

/// Terminal state of an invocation lifecycle record.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum InvocationTerminalState {
    AdmissionRefused,
    SelectionRefused,
    GrantRefused,
    Succeeded,
    // Kernel §8: a parked outcome means the host re-invokes later -- it is
    // NOT the same as Succeeded (MEDIUM-4). Recorded distinctly so a parked
    // invocation is never indistinguishable from a completed one.
    Parked,
    SemanticFailed,
    Cancelled,
    DeadlineExceeded,
    ProviderFailed,
    CompletionUnknown,
}

impl InvocationTerminalState {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::AdmissionRefused => "admission-refused",
            Self::SelectionRefused => "selection-refused",
            Self::GrantRefused => "grant-refused",
            Self::Succeeded => "succeeded",
            Self::Parked => "parked",
            Self::SemanticFailed => "semantic-failed",
            Self::Cancelled => "cancelled",
            Self::DeadlineExceeded => "deadline-exceeded",
            Self::ProviderFailed => "provider-failed",
            Self::CompletionUnknown => "completion-unknown",
        }
    }

    pub fn is_dispatched(&self) -> bool {
        matches!(
            self,
            Self::Succeeded
                | Self::Parked
                | Self::SemanticFailed
                | Self::Cancelled
                | Self::DeadlineExceeded
                | Self::ProviderFailed
                | Self::CompletionUnknown
        )
    }
}

impl std::fmt::Display for InvocationTerminalState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

/// Record of an invocation's lifecycle and terminal outcome.
///
/// Enforces exactly one terminal state per invocation.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct InvocationLifecycleRecord {
    pub invocation_id: String,
    pub host_kind: String,
    pub operation_id: OperationId,
    pub provider_id: Option<String>,
    pub registry_fingerprint: Option<String>,
    pub request_contract: Option<ContractRef>,
    pub outcome_contract: Option<ContractRef>,
    pub trace_context: Option<String>,
    pub dispatched: bool,
    pub terminal_state: InvocationTerminalState,
    pub terminal_error: Option<String>,
    pub diagnostics: Vec<String>,
    pub started_at: SystemTime,
    pub completed_at: SystemTime,
}

/// Thread-safe lifecycle record store enforcing exactly one terminal record per invocation.
#[derive(Debug, Default)]
pub struct LifecycleTracker {
    records: Mutex<HashMap<String, InvocationLifecycleRecord>>,
    record_history: Mutex<Vec<InvocationLifecycleRecord>>,
}

impl LifecycleTracker {
    /// Writes the terminal lifecycle record. If a record already exists for the given invocation ID,
    /// appends the new status/response as diagnostic evidence and leaves the initial terminal state intact.
    pub fn write_terminal(&self, record: InvocationLifecycleRecord) -> InvocationLifecycleRecord {
        let mut map = self.records.lock().unwrap();
        let mut history = self.record_history.lock().unwrap();

        if let Some(existing) = map.get_mut(&record.invocation_id) {
            existing.diagnostics.push(format!(
                "late response arriving after terminal state '{}': attempted terminal '{}' (error: {:?})",
                existing.terminal_state.as_str(),
                record.terminal_state.as_str(),
                record.terminal_error
            ));
            existing.clone()
        } else {
            map.insert(record.invocation_id.clone(), record.clone());
            history.push(record.clone());
            record
        }
    }

    /// Records a late response arriving after termination as diagnostic evidence.
    pub fn record_late_response(
        &self,
        invocation_id: &str,
        outcome: &Result<ProviderOutcome, ProviderError>,
    ) {
        let mut map = self.records.lock().unwrap();
        if let Some(existing) = map.get_mut(invocation_id) {
            existing.diagnostics.push(format!(
                "late response arriving after terminal state '{}': {:?}",
                existing.terminal_state.as_str(),
                outcome
            ));
        }
    }

    /// Retrieves the lifecycle record for an invocation ID.
    pub fn get_record(&self, invocation_id: &str) -> Option<InvocationLifecycleRecord> {
        self.records.lock().unwrap().get(invocation_id).cloned()
    }

    /// Retrieves all recorded lifecycle records in order.
    pub fn all_records(&self) -> Vec<InvocationLifecycleRecord> {
        self.record_history.lock().unwrap().clone()
    }
}

/// Wrapper future to catch panics from provider invoke futures.
struct CatchUnwind<F> {
    inner: F,
}

impl<F: Future> Future for CatchUnwind<F> {
    type Output = Result<F::Output, Box<dyn std::any::Any + Send>>;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let inner = unsafe { self.map_unchecked_mut(|s| &mut s.inner) };
        match catch_unwind(AssertUnwindSafe(|| inner.poll(cx))) {
            Ok(Poll::Ready(val)) => Poll::Ready(Ok(val)),
            Ok(Poll::Pending) => Poll::Pending,
            Err(payload) => Poll::Ready(Err(payload)),
        }
    }
}

/// One `cancellation_txs` registration: a monotonic per-registration
/// generation number alongside the sender, so a guard drop can identify and
/// remove exactly its own registration -- never a different, still-live
/// invocation that happens to share the same invocation_id.
struct CancellationEntry {
    generation: u64,
    tx: tokio::sync::watch::Sender<bool>,
}

/// RAII guard removing one registration from `cancellation_txs` when
/// dropped -- but ONLY the exact generation this guard itself registered,
/// never a sibling registration sharing the same invocation_id.
///
/// MEDIUM-6: `cancellation_txs` had no removal path anywhere -- unbounded
/// growth for a long-running host (kernel §6). Binding this guard for the
/// lifetime of `invoke_internal`'s call means its registration is pruned
/// the moment that invocation reaches ANY terminal return, regardless of
/// which of the function's many early-return paths fires.
///
/// `cancellation_txs` maps an invocation_id to a `Vec` of registrations,
/// not a single slot (red-team MEDIUM, P06 round 2): two genuinely
/// concurrent invocations sharing an id, however that happened, must not
/// let whichever one registers SECOND silently drop the first one's
/// `watch::Sender` by overwriting a single map slot -- `invoke_internal`
/// treats its own sender being dropped (the watch channel closing) the
/// same as an explicit cancellation, so a plain single-slot `insert` would
/// spuriously cancel the earlier invocation the instant the later one
/// registers, with no caller ever calling `cancel()` at all. Appending to a
/// `Vec` keeps every concurrent registration's sender alive independently;
/// `cancel()` then signals every live registration under that id, and each
/// guard drop removes only its own entry (by generation) from the `Vec`,
/// removing the `Vec` itself only once it is empty.
struct CancellationTxGuard<'a> {
    txs: &'a Mutex<HashMap<String, Vec<CancellationEntry>>>,
    invocation_id: String,
    generation: u64,
}

impl Drop for CancellationTxGuard<'_> {
    fn drop(&mut self) {
        // .unwrap_or_else(PoisonError::into_inner), not .unwrap() (LOW-4):
        // a Drop running during an unwind (e.g. a caller-supplied
        // &dyn EventSink panicking outside CatchUnwind's reach) while this
        // same mutex is already poisoned would otherwise be panic-during-
        // unwind, which aborts the whole process. Best-effort cleanup of a
        // poisoned map is strictly better than an abort here.
        let mut map = self
            .txs
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        if let std::collections::hash_map::Entry::Occupied(mut entry) =
            map.entry(self.invocation_id.clone())
        {
            entry.get_mut().retain(|e| e.generation != self.generation);
            if entry.get().is_empty() {
                entry.remove();
            }
        }
    }
}

/// Invocation service managing the six-stage invocation pipeline.
pub struct InvocationService {
    snapshot: RegistrySnapshot,
    providers: RwLock<HashMap<String, Arc<dyn OperationProvider>>>,
    admission: CallerAdmission,
    grant: ProviderGrant,
    tracker: Arc<LifecycleTracker>,
    cancellation_txs: Mutex<HashMap<String, Vec<CancellationEntry>>>,
    cancellation_generation: std::sync::atomic::AtomicU64,
}

impl InvocationService {
    /// Creates a new [`InvocationService`] with the given snapshot.
    ///
    /// Default admission trusts exactly the policies `snapshot`'s own
    /// catalog declares (`CallerAdmission::allow_catalog_policies`, HIGH-1
    /// fix) -- never `CallerAdmission::default()`, which denies everything
    /// past the structural checks and would make this constructor useless
    /// out of the box. Override with `.with_admission(..)` for a real,
    /// externally-configured policy once one exists (Phase 08+).
    pub fn new(snapshot: RegistrySnapshot) -> Self {
        let admission = CallerAdmission::allow_catalog_policies(snapshot.catalog());
        Self {
            snapshot,
            providers: RwLock::new(HashMap::new()),
            admission,
            grant: ProviderGrant::default(),
            tracker: Arc::new(LifecycleTracker::default()),
            cancellation_txs: Mutex::new(HashMap::new()),
            cancellation_generation: std::sync::atomic::AtomicU64::new(0),
        }
    }

    /// Sets custom caller admission policy.
    pub fn with_admission(mut self, admission: CallerAdmission) -> Self {
        self.admission = admission;
        self
    }

    /// Sets custom provider grant policy.
    pub fn with_grant(mut self, grant: ProviderGrant) -> Self {
        self.grant = grant;
        self
    }

    /// Registers an in-process operation provider instance.
    pub fn register_provider(&self, provider: Arc<dyn OperationProvider>) {
        let id = provider.descriptor().provider_id.to_string();
        self.providers.write().unwrap().insert(id, provider);
    }

    /// Signals cancellation for an active invocation by ID.
    ///
    /// If multiple concurrent invocations somehow share an id, this signals
    /// every one of them still live -- `cancellation_txs` holds a `Vec` of
    /// registrations per id precisely so a shared id cancels all of them,
    /// not an arbitrary pick (P06 round 2).
    pub fn cancel(&self, invocation_id: &str) -> bool {
        let map = self
            .cancellation_txs
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner());
        match map.get(invocation_id) {
            Some(entries) if !entries.is_empty() => {
                for entry in entries {
                    let _ = entry.tx.send(true);
                }
                true
            }
            _ => false,
        }
    }

    /// Returns the lifecycle tracker.
    pub fn tracker(&self) -> Arc<LifecycleTracker> {
        Arc::clone(&self.tracker)
    }

    /// Retrieves the lifecycle record for an invocation ID.
    pub fn get_record(&self, invocation_id: &str) -> Option<InvocationLifecycleRecord> {
        self.tracker.get_record(invocation_id)
    }

    /// Retrieves all recorded lifecycle records.
    pub fn records(&self) -> Vec<InvocationLifecycleRecord> {
        self.tracker.all_records()
    }

    /// Executes an invocation through the six-stage pipeline.
    pub async fn invoke(
        &self,
        invocation: HostInvocation,
        request: crate::contracts::OperationRequest,
    ) -> Result<ProviderOutcome, ProviderError> {
        self.invoke_with_sink(invocation, request, &NoopEventSink)
            .await
    }

    /// Executes an invocation with a specific [`EventSink`].
    pub async fn invoke_with_sink(
        &self,
        invocation: HostInvocation,
        request: crate::contracts::OperationRequest,
        sink: &dyn EventSink,
    ) -> Result<ProviderOutcome, ProviderError> {
        let (res, _record) = self.invoke_internal(invocation, request, sink).await;
        res
    }

    /// Executes an invocation and returns both the outcome result and the final lifecycle record.
    pub async fn invoke_with_record(
        &self,
        invocation: HostInvocation,
        request: crate::contracts::OperationRequest,
        sink: &dyn EventSink,
    ) -> (
        Result<ProviderOutcome, ProviderError>,
        InvocationLifecycleRecord,
    ) {
        self.invoke_internal(invocation, request, sink).await
    }

    async fn invoke_internal(
        &self,
        invocation: HostInvocation,
        request: crate::contracts::OperationRequest,
        sink: &dyn EventSink,
    ) -> (
        Result<ProviderOutcome, ProviderError>,
        InvocationLifecycleRecord,
    ) {
        // Stage 1: received
        let started_at = SystemTime::now();
        let invocation_id = invocation.invocation_id.clone().unwrap_or_else(|| {
            format!(
                "inv_{:x}",
                SystemTime::now()
                    .duration_since(SystemTime::UNIX_EPOCH)
                    .unwrap()
                    .as_nanos()
            )
        });
        let host_kind = invocation.host_kind.clone();
        let operation_id = request.operation.clone();
        let trace_context = invocation.trace_context.clone();
        let request_contract = Some(request.contract.clone());

        sink.record_event("invocation.received");
        sink.record_progress("stage: received");

        // Prepare cancellation watch channel. The generation number this
        // registration gets is what lets its own guard tell "my entry" apart
        // from a different, later registration under the same id (P06
        // round 2 fix for red-team's concurrent-duplicate-id finding).
        let (cancel_tx, cancel_rx) = tokio::sync::watch::channel(false);
        let generation = self
            .cancellation_generation
            .fetch_add(1, std::sync::atomic::Ordering::Relaxed);
        {
            self.cancellation_txs
                .lock()
                .unwrap_or_else(|poisoned| poisoned.into_inner())
                .entry(invocation_id.clone())
                .or_default()
                .push(CancellationEntry {
                    generation,
                    tx: cancel_tx,
                });
        }
        // Held for the rest of this function's scope: pruned on every return
        // path via Drop (MEDIUM-6), but only if this generation is still the
        // live one (round-2 fix above).
        let _cancellation_guard = CancellationTxGuard {
            txs: &self.cancellation_txs,
            invocation_id: invocation_id.clone(),
            generation,
        };

        // Stage 2: admit (before routing)
        sink.record_progress("stage: admit");
        let admitted =
            match self
                .admission
                .admit(&invocation, &request.operation, self.snapshot.catalog())
            {
                Ok(adm) => {
                    sink.record_event("invocation.admitted");
                    adm
                }
                Err(refuse) => {
                    sink.record_event("invocation.admission-refused");
                    let err = ProviderError::CallerAdmissionDenied(refuse.to_string());
                    let record = InvocationLifecycleRecord {
                        invocation_id,
                        host_kind,
                        operation_id,
                        provider_id: None,
                        registry_fingerprint: Some(self.snapshot.fingerprint().to_string()),
                        request_contract,
                        outcome_contract: None,
                        trace_context,
                        dispatched: false,
                        terminal_state: InvocationTerminalState::AdmissionRefused,
                        terminal_error: Some(refuse.to_string()),
                        diagnostics: vec![],
                        started_at,
                        completed_at: SystemTime::now(),
                    };
                    let final_record = self.tracker.write_terminal(record);
                    return (Err(err), final_record);
                }
            };

        // Stage 3: select (pure Router)
        sink.record_progress("stage: select");
        let selection_input = SelectionInput {
            operation: request.operation.clone(),
            request_contract_version: request.contract.version(),
            outcome_contract_version: admitted.operation.outcome_contract.version(),
            host_kind: &invocation.host_kind,
            invocation_mode: "sync",
            policy: RouterPolicy,
        };

        let selected_provider = match select(selection_input, &self.snapshot) {
            Ok(p) => {
                sink.record_event("invocation.selected");
                p
            }
            Err(selection_refused) => {
                sink.record_event("invocation.selection-refused");
                let err = match &selection_refused {
                    SelectionRefused::MissingBinding { .. } => {
                        ProviderError::NoBinding(selection_refused.to_string())
                    }
                    SelectionRefused::AmbiguousBinding { .. } => {
                        ProviderError::AmbiguousBinding(selection_refused.to_string())
                    }
                    SelectionRefused::IncompatibleContract { .. } => {
                        ProviderError::IncompatibleContract(selection_refused.to_string())
                    }
                    SelectionRefused::DisallowedHostKind { .. } => {
                        ProviderError::CallerAdmissionDenied(selection_refused.to_string())
                    }
                    SelectionRefused::WrongInvocationMode { .. } => {
                        ProviderError::Precondition(selection_refused.to_string())
                    }
                };
                let record = InvocationLifecycleRecord {
                    invocation_id,
                    host_kind,
                    operation_id,
                    provider_id: None,
                    registry_fingerprint: Some(self.snapshot.fingerprint().to_string()),
                    request_contract,
                    outcome_contract: Some(admitted.operation.outcome_contract.clone()),
                    trace_context,
                    dispatched: false,
                    terminal_state: InvocationTerminalState::SelectionRefused,
                    terminal_error: Some(selection_refused.to_string()),
                    diagnostics: vec![],
                    started_at,
                    completed_at: SystemTime::now(),
                };
                let final_record = self.tracker.write_terminal(record);
                return (Err(err), final_record);
            }
        };

        // Stage 4: grant (after routing)
        sink.record_progress("stage: grant");
        let provider_id = selected_provider.provider_id.to_string();
        let outcome_contract = Some(selected_provider.outcome_contract.clone());

        let granted_capabilities = match self.grant.grant(&admitted, selected_provider) {
            Ok(caps) => {
                sink.record_event("invocation.granted");
                caps
            }
            Err(grant_refused) => {
                sink.record_event("invocation.grant-refused");
                let err =
                    ProviderError::SelectedProviderCapabilityDenied(grant_refused.to_string());
                let record = InvocationLifecycleRecord {
                    invocation_id,
                    host_kind,
                    operation_id,
                    provider_id: Some(provider_id),
                    registry_fingerprint: Some(self.snapshot.fingerprint().to_string()),
                    request_contract,
                    outcome_contract,
                    trace_context,
                    dispatched: false,
                    terminal_state: InvocationTerminalState::GrantRefused,
                    terminal_error: Some(grant_refused.to_string()),
                    diagnostics: vec![],
                    started_at,
                    completed_at: SystemTime::now(),
                };
                let final_record = self.tracker.write_terminal(record);
                return (Err(err), final_record);
            }
        };

        // Stage 5: invoke
        sink.record_progress("stage: invoke");
        // `dispatched` (kernel §8: the point past which a transport loss may
        // be recorded as completion-unknown rather than a clean failure)
        // stays false until the provider's own invoke() future is actually
        // constructed below -- NOT here, where provider-not-registered and
        // the two pre-invoke fast-path checks (cancellation, deadline) can
        // still return without ever reaching the provider (MEDIUM-3).
        let mut dispatched = false;

        let provider_instance = {
            let map = self.providers.read().unwrap();
            map.get(&provider_id).cloned()
        };

        let provider_instance = match provider_instance {
            Some(p) => p,
            None => {
                let err = ProviderError::ProviderUnavailable(format!(
                    "provider '{}' is selected but not registered in InvocationService",
                    provider_id
                ));
                let record = InvocationLifecycleRecord {
                    invocation_id,
                    host_kind,
                    operation_id,
                    provider_id: Some(provider_id),
                    registry_fingerprint: Some(self.snapshot.fingerprint().to_string()),
                    request_contract,
                    outcome_contract,
                    trace_context,
                    dispatched,
                    terminal_state: InvocationTerminalState::ProviderFailed,
                    terminal_error: Some(err.to_string()),
                    diagnostics: vec![],
                    started_at,
                    completed_at: SystemTime::now(),
                };
                let final_record = self.tracker.write_terminal(record);
                return (Err(err), final_record);
            }
        };

        let control = InvocationControl::new(
            invocation.deadline,
            invocation.cancellation_token.clone(),
            granted_capabilities,
        )
        .with_cancellation_rx(cancel_rx.clone());

        // Fast-path cancellation check before invoking
        if *cancel_rx.borrow() {
            let err = ProviderError::CallerCancelled("invocation cancelled by caller".to_string());
            let record = InvocationLifecycleRecord {
                invocation_id,
                host_kind,
                operation_id,
                provider_id: Some(provider_id),
                registry_fingerprint: Some(self.snapshot.fingerprint().to_string()),
                request_contract,
                outcome_contract,
                trace_context,
                dispatched,
                terminal_state: InvocationTerminalState::Cancelled,
                terminal_error: Some(err.to_string()),
                diagnostics: vec![],
                started_at,
                completed_at: SystemTime::now(),
            };
            let final_record = self.tracker.write_terminal(record);
            return (Err(err), final_record);
        }

        // Fast-path deadline check before invoking
        if let Some(deadline) = invocation.deadline {
            if SystemTime::now() >= deadline {
                let err = ProviderError::DeadlineExceeded(
                    "invocation deadline already expired".to_string(),
                );
                let record = InvocationLifecycleRecord {
                    invocation_id,
                    host_kind,
                    operation_id,
                    provider_id: Some(provider_id),
                    registry_fingerprint: Some(self.snapshot.fingerprint().to_string()),
                    request_contract,
                    outcome_contract,
                    trace_context,
                    dispatched,
                    terminal_state: InvocationTerminalState::DeadlineExceeded,
                    terminal_error: Some(err.to_string()),
                    diagnostics: vec![],
                    started_at,
                    completed_at: SystemTime::now(),
                };
                let final_record = self.tracker.write_terminal(record);
                return (Err(err), final_record);
            }
        }

        // The real dispatch point (MEDIUM-3): everything before this line can
        // still return without ever reaching the provider.
        dispatched = true;
        sink.record_event("invocation.dispatched");

        let caught_fut = CatchUnwind {
            inner: provider_instance.invoke(&invocation, request, control, sink),
        };

        let mut cancel_watch = cancel_rx;
        let execution_result = if let Some(deadline) = invocation.deadline {
            let now = SystemTime::now();
            let duration = deadline
                .duration_since(now)
                .unwrap_or(std::time::Duration::from_millis(0));

            tokio::select! {
                res = caught_fut => {
                    match res {
                        Ok(inner_res) => inner_res,
                        Err(panic_payload) => {
                            let msg = if let Some(s) = panic_payload.downcast_ref::<&str>() {
                                s.to_string()
                            } else if let Some(s) = panic_payload.downcast_ref::<String>() {
                                s.clone()
                            } else {
                                "provider panicked".to_string()
                            };
                            Err(ProviderError::ProviderFailed(msg))
                        }
                    }
                }
                _ = tokio::time::sleep(duration) => {
                    Err(ProviderError::DeadlineExceeded("invocation deadline exceeded".to_string()))
                }
                changed = cancel_watch.changed() => {
                    if changed.is_ok() && *cancel_watch.borrow() {
                        Err(ProviderError::CallerCancelled("invocation cancelled mid-invoke".to_string()))
                    } else {
                        Err(ProviderError::CallerCancelled("invocation cancelled by caller".to_string()))
                    }
                }
            }
        } else {
            tokio::select! {
                res = caught_fut => {
                    match res {
                        Ok(inner_res) => inner_res,
                        Err(panic_payload) => {
                            let msg = if let Some(s) = panic_payload.downcast_ref::<&str>() {
                                s.to_string()
                            } else if let Some(s) = panic_payload.downcast_ref::<String>() {
                                s.clone()
                            } else {
                                "provider panicked".to_string()
                            };
                            Err(ProviderError::ProviderFailed(msg))
                        }
                    }
                }
                changed = cancel_watch.changed() => {
                    if changed.is_ok() && *cancel_watch.borrow() {
                        Err(ProviderError::CallerCancelled("invocation cancelled mid-invoke".to_string()))
                    } else {
                        Err(ProviderError::CallerCancelled("invocation cancelled by caller".to_string()))
                    }
                }
            }
        };

        // Stage 6: normalize & record
        sink.record_progress("stage: normalize");
        let (terminal_state, terminal_error, outcome_result, diags) = match execution_result {
            Ok(outcome @ ProviderOutcome::Parked { .. }) => {
                // MEDIUM-4: a parked outcome means the host re-invokes later
                // (kernel §8) -- recorded distinctly, never folded into
                // Succeeded, which would make it indistinguishable from a
                // completed invocation.
                let diagnostics = outcome.diagnostics().to_vec();
                sink.record_event("invocation.parked");
                (
                    InvocationTerminalState::Parked,
                    None,
                    Ok(outcome),
                    diagnostics,
                )
            }
            Ok(outcome) => {
                let diagnostics = outcome.diagnostics().to_vec();
                sink.record_event("invocation.succeeded");
                (
                    InvocationTerminalState::Succeeded,
                    None,
                    Ok(outcome),
                    diagnostics,
                )
            }
            Err(err) => {
                let state = match &err {
                    ProviderError::SemanticValidation(_)
                    | ProviderError::Precondition(_)
                    | ProviderError::Conflict(_)
                    | ProviderError::NotFound(_) => {
                        sink.record_event("invocation.semantic-failed");
                        InvocationTerminalState::SemanticFailed
                    }
                    ProviderError::CallerCancelled(_) => {
                        sink.record_event("invocation.cancelled");
                        InvocationTerminalState::Cancelled
                    }
                    ProviderError::DeadlineExceeded(_) => {
                        sink.record_event("invocation.deadline-exceeded");
                        InvocationTerminalState::DeadlineExceeded
                    }
                    ProviderError::ProviderCrash(_)
                    | ProviderError::ProviderFailed(_)
                    | ProviderError::ProtocolViolation(_)
                    | ProviderError::ProviderUnavailable(_) => {
                        sink.record_event("invocation.provider-failed");
                        InvocationTerminalState::ProviderFailed
                    }
                    ProviderError::CompletionUnknown(_) => {
                        sink.record_event("invocation.completion-unknown");
                        InvocationTerminalState::CompletionUnknown
                    }
                    ProviderError::CallerAdmissionDenied(_) => {
                        InvocationTerminalState::AdmissionRefused
                    }
                    ProviderError::SelectedProviderCapabilityDenied(_) => {
                        InvocationTerminalState::GrantRefused
                    }
                    ProviderError::NoBinding(_)
                    | ProviderError::AmbiguousBinding(_)
                    | ProviderError::IncompatibleContract(_) => {
                        InvocationTerminalState::SelectionRefused
                    }
                };
                (state, Some(err.to_string()), Err(err), vec![])
            }
        };

        sink.record_progress("stage: record");
        let record = InvocationLifecycleRecord {
            invocation_id,
            host_kind,
            operation_id,
            provider_id: Some(provider_id),
            registry_fingerprint: Some(self.snapshot.fingerprint().to_string()),
            request_contract,
            outcome_contract,
            trace_context,
            dispatched,
            terminal_state,
            terminal_error,
            diagnostics: diags,
            started_at,
            completed_at: SystemTime::now(),
        };

        let final_record = self.tracker.write_terminal(record);
        (outcome_result, final_record)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::catalog::CATALOG;
    use crate::contracts::{
        ContractRef, HostInvocation, OperationId, OperationRequest, ProviderLifecycle,
    };
    use crate::providers::builtin::{EchoAction, EchoProvider, ECHO_PROVIDER_DESCRIPTOR};
    use std::borrow::Cow;
    use std::time::Duration;

    fn build_test_service() -> InvocationService {
        static TEST_PROVIDERS: &[ProviderDescriptor] = &[ECHO_PROVIDER_DESCRIPTOR];
        let snapshot = RegistrySnapshot {
            catalog: CATALOG,
            providers: TEST_PROVIDERS,
            fingerprint: "test-snapshot-p06",
        };
        let service = InvocationService::new(snapshot);
        service.register_provider(Arc::new(EchoProvider::new()));
        service
    }

    mod deadline {
        use super::*;

        #[tokio::test]
        async fn deadline() {
            let service = build_test_service();
            let mut invocation = HostInvocation::new("cli");
            invocation.deadline = Some(SystemTime::now() + Duration::from_millis(20));

            let request = OperationRequest::new(
                OperationId::from_static("test.fixture.echo"),
                ContractRef::from_static("test.fixture.echo.request", "1.0.0"),
                Box::new(EchoAction::Delay {
                    duration: Duration::from_millis(200),
                    message: "delayed".to_string(),
                }),
            );

            let sink = InMemoryEventSink::new();
            let (result, record) = service.invoke_with_record(invocation, request, &sink).await;

            assert!(matches!(result, Err(ProviderError::DeadlineExceeded(_))));
            assert_eq!(
                record.terminal_state,
                InvocationTerminalState::DeadlineExceeded
            );
            assert!(record.dispatched);
        }
    }

    mod cancellation {
        use super::*;

        #[tokio::test]
        async fn cancellation() {
            let service = Arc::new(build_test_service());
            let mut invocation = HostInvocation::new("cli");
            invocation.invocation_id = Some("inv_cancel_test".to_string());

            let request = OperationRequest::new(
                OperationId::from_static("test.fixture.echo"),
                ContractRef::from_static("test.fixture.echo.request", "1.0.0"),
                Box::new(EchoAction::Delay {
                    duration: Duration::from_millis(250),
                    message: "delayed".to_string(),
                }),
            );

            let service_clone = Arc::clone(&service);
            tokio::spawn(async move {
                tokio::time::sleep(Duration::from_millis(30)).await;
                service_clone.cancel("inv_cancel_test");
            });

            let sink = InMemoryEventSink::new();
            let (result, record) = service.invoke_with_record(invocation, request, &sink).await;

            assert!(matches!(result, Err(ProviderError::CallerCancelled(_))));
            assert_eq!(record.terminal_state, InvocationTerminalState::Cancelled);
            assert!(record.dispatched);
        }
    }

    mod admission_refused {
        use super::*;

        #[tokio::test]
        async fn admission_refused() {
            let service = build_test_service().with_admission(CallerAdmission::deny_all());
            let invocation = HostInvocation::new("cli");
            let request = OperationRequest::new(
                OperationId::from_static("test.fixture.echo"),
                ContractRef::from_static("test.fixture.echo.request", "1.0.0"),
                Box::new("hello".to_string()),
            );

            let sink = InMemoryEventSink::new();
            let (result, record) = service.invoke_with_record(invocation, request, &sink).await;

            assert!(matches!(
                result,
                Err(ProviderError::CallerAdmissionDenied(_))
            ));
            assert_eq!(
                record.terminal_state,
                InvocationTerminalState::AdmissionRefused
            );
            assert!(!record.dispatched);

            // Assert that the Router was NOT called (LOW-3: check for the
            // "stage: select" progress marker's absence too, not just the
            // success event -- a Router call that itself REFUSED would emit
            // "invocation.selection-refused", not "invocation.selected", and
            // the original assertion alone would not have caught that).
            let events = sink.events();
            assert!(events.contains(&"invocation.admission-refused".to_string()));
            assert!(!events.contains(&"invocation.selected".to_string()));
            assert!(!events.contains(&"invocation.selection-refused".to_string()));
            assert!(!sink
                .progress_entries()
                .contains(&"stage: select".to_string()));
        }
    }

    mod grant_refused {
        use super::*;

        #[tokio::test]
        async fn grant_refused() {
            // Create a provider descriptor that requests an unpermitted capability
            static PRIVILEGED_PROVIDERS: &[ProviderDescriptor] = &[ProviderDescriptor {
                provider_id: Cow::Borrowed("test.privileged.echo"),
                operation_id: OperationId::from_static("test.fixture.echo"),
                component_class: Cow::Borrowed("test"),
                mechanism: Cow::Borrowed("builtin"),
                lifecycle: ProviderLifecycle::Singleton,
                request_contract: ContractRef::from_static("test.fixture.echo.request", "1.0.0"),
                outcome_contract: ContractRef::from_static("test.fixture.echo.outcome", "1.0.0"),
                allowed_hosts: &["cli", "remote", "test"],
                allowed_modes: &["sync", "test"],
                capabilities: &["unpermitted.network.access"],
                replacement: None,
                concurrency: None,
                health: None,
            }];

            static SNAPSHOT: RegistrySnapshot = RegistrySnapshot {
                catalog: CATALOG,
                providers: PRIVILEGED_PROVIDERS,
                fingerprint: "test-grant-refused",
            };

            let service = InvocationService::new(SNAPSHOT.clone());
            service.register_provider(Arc::new(EchoProvider::with_descriptor(
                PRIVILEGED_PROVIDERS[0].clone(),
            )));

            let invocation = HostInvocation::new("cli");
            let request = OperationRequest::new(
                OperationId::from_static("test.fixture.echo"),
                ContractRef::from_static("test.fixture.echo.request", "1.0.0"),
                Box::new("hello".to_string()),
            );

            let sink = InMemoryEventSink::new();
            let (result, record) = service.invoke_with_record(invocation, request, &sink).await;

            assert!(matches!(
                result,
                Err(ProviderError::SelectedProviderCapabilityDenied(_))
            ));
            assert_eq!(record.terminal_state, InvocationTerminalState::GrantRefused);
            assert!(!record.dispatched);

            // Assert that provider invoke was NOT called
            let events = sink.events();
            assert!(events.contains(&"invocation.grant-refused".to_string()));
            assert!(!events.contains(&"echo.invoked".to_string()));
        }
    }

    mod provider_crash {
        use super::*;

        #[tokio::test]
        async fn provider_crash() {
            let service = build_test_service();
            let invocation = HostInvocation::new("cli");
            let request = OperationRequest::new(
                OperationId::from_static("test.fixture.echo"),
                ContractRef::from_static("test.fixture.echo.request", "1.0.0"),
                Box::new(EchoAction::Panic("simulated panic crash".to_string())),
            );

            let sink = InMemoryEventSink::new();
            let (result, record) = service.invoke_with_record(invocation, request, &sink).await;

            assert!(matches!(result, Err(ProviderError::ProviderFailed(_))));
            // Must normalize to provider-failed, NEVER a semantic failure
            assert_eq!(
                record.terminal_state,
                InvocationTerminalState::ProviderFailed
            );
            assert_ne!(
                record.terminal_state,
                InvocationTerminalState::SemanticFailed
            );
            assert!(record.dispatched);
        }
    }

    mod parked {
        use super::*;

        /// Regression for MEDIUM-4: a Parked outcome must record
        /// InvocationTerminalState::Parked, never Succeeded -- driven
        /// through the real InvocationService, not constructed by hand.
        #[tokio::test]
        async fn parked() {
            let service = build_test_service();
            let invocation = HostInvocation::new("cli");
            let request = OperationRequest::new(
                OperationId::from_static("test.fixture.echo"),
                ContractRef::from_static("test.fixture.echo.request", "1.0.0"),
                Box::new(EchoAction::Park("awaiting external callback".to_string())),
            );

            let sink = InMemoryEventSink::new();
            let (result, record) = service.invoke_with_record(invocation, request, &sink).await;

            assert!(result.is_ok());
            assert_eq!(record.terminal_state, InvocationTerminalState::Parked);
            assert_ne!(record.terminal_state, InvocationTerminalState::Succeeded);
            assert!(record.dispatched);
            assert!(sink.events().iter().any(|e| e == "invocation.parked"));
        }
    }

    mod cancellation_tx_pruned_after_terminal {
        use super::*;

        /// Regression for MEDIUM-6: cancellation_txs must not grow
        /// unboundedly -- its entry for an invocation is pruned the moment
        /// that invocation reaches a terminal record. `cancel()` on an
        /// already-terminal invocation id must return false (nothing to
        /// signal), not silently succeed against a stale sender.
        #[tokio::test]
        async fn cancellation_tx_pruned_after_terminal() {
            let service = build_test_service();
            let invocation = HostInvocation::new("cli");
            let request = OperationRequest::new(
                OperationId::from_static("test.fixture.echo"),
                ContractRef::from_static("test.fixture.echo.request", "1.0.0"),
                Box::new(EchoAction::Echo("hello".to_string())),
            );

            let sink = InMemoryEventSink::new();
            let (result, record) = service.invoke_with_record(invocation, request, &sink).await;
            assert!(result.is_ok());

            assert!(
                !service.cancel(&record.invocation_id),
                "cancellation_txs entry for a terminal invocation must already be pruned"
            );
        }
    }

    mod concurrent_duplicate_invocation_id_cancellation {
        use super::*;

        /// Regression for red-team's P06 round-2 MEDIUM: two invocations
        /// that (however it happened caller-side) share one invocation_id
        /// must not let whichever one reaches a terminal record FIRST
        /// silently orphan the other's still-live cancellation channel by
        /// removing its entry out from underneath it.
        #[tokio::test]
        async fn concurrent_duplicate_invocation_id_cancellation() {
            let service = Arc::new(build_test_service());
            let shared_id = "inv_dup_test";

            let mut invocation_a = HostInvocation::new("cli");
            invocation_a.invocation_id = Some(shared_id.to_string());
            let request_a = OperationRequest::new(
                OperationId::from_static("test.fixture.echo"),
                ContractRef::from_static("test.fixture.echo.request", "1.0.0"),
                Box::new(EchoAction::Delay {
                    duration: Duration::from_millis(20),
                    message: "a".to_string(),
                }),
            );
            let service_a = Arc::clone(&service);
            let handle_a = tokio::spawn(async move {
                service_a
                    .invoke_with_record(invocation_a, request_a, &NoopEventSink)
                    .await
            });

            // Let A run up to its own first internal await point (inside
            // its Delay future) before spawning B: A's cancellation_txs
            // insert is entirely synchronous (Stage 1, before any await),
            // so this guarantees A registers generation 0 before B
            // registers a later generation under the same id.
            tokio::task::yield_now().await;

            let mut invocation_b = HostInvocation::new("cli");
            invocation_b.invocation_id = Some(shared_id.to_string());
            let request_b = OperationRequest::new(
                OperationId::from_static("test.fixture.echo"),
                ContractRef::from_static("test.fixture.echo.request", "1.0.0"),
                Box::new(EchoAction::Delay {
                    duration: Duration::from_millis(200),
                    message: "b".to_string(),
                }),
            );
            let service_b = Arc::clone(&service);
            let handle_b = tokio::spawn(async move {
                service_b
                    .invoke_with_record(invocation_b, request_b, &NoopEventSink)
                    .await
            });
            tokio::task::yield_now().await;

            // A's short delay elapses well before B's; A finishes and its
            // guard drops first.
            let (result_a, _record_a) = handle_a.await.unwrap();
            // Before the Vec-per-id fix, B's registration would have
            // overwritten A's single map slot and dropped A's sender,
            // which invoke_internal's cancellation watch treats the same
            // as an explicit cancel -- spuriously cancelling A even though
            // nobody ever called `cancel()`.
            assert!(result_a.is_ok(), "result_a: {:?}", result_a);

            // Without generation tagging, A's drop would have removed the
            // shared-id map entry outright, orphaning B's still-live
            // cancellation channel. With it, B's later (higher-generation)
            // registration survives A's drop.
            assert!(
                service.cancel(shared_id),
                "B's cancellation entry must still be reachable after A's guard drops"
            );

            let (result_b, _record_b) = handle_b.await.unwrap();
            assert!(matches!(result_b, Err(ProviderError::CallerCancelled(_))));

            // Both are now terminal; the shared id must be fully pruned.
            assert!(!service.cancel(shared_id));
        }
    }

    mod late_response_after_cancel {
        use super::*;

        #[tokio::test]
        async fn late_response_after_cancel() {
            let service = Arc::new(build_test_service());
            let mut invocation = HostInvocation::new("cli");
            invocation.invocation_id = Some("inv_late_resp".to_string());

            let request = OperationRequest::new(
                OperationId::from_static("test.fixture.echo"),
                ContractRef::from_static("test.fixture.echo.request", "1.0.0"),
                Box::new(EchoAction::Delay {
                    duration: Duration::from_millis(200),
                    message: "late result".to_string(),
                }),
            );

            let service_clone = Arc::clone(&service);
            tokio::spawn(async move {
                tokio::time::sleep(Duration::from_millis(25)).await;
                service_clone.cancel("inv_late_resp");
            });

            let sink = InMemoryEventSink::new();
            let (result, record) = service.invoke_with_record(invocation, request, &sink).await;

            assert!(matches!(result, Err(ProviderError::CallerCancelled(_))));
            assert_eq!(record.terminal_state, InvocationTerminalState::Cancelled);

            // Now a late response arrives
            let late_outcome = Ok(ProviderOutcome::completed(
                ContractRef::from_static("test.fixture.echo.outcome", "1.0.0"),
                Box::new("late completion".to_string()),
            ));
            service
                .tracker()
                .record_late_response("inv_late_resp", &late_outcome);

            // Also test write_terminal called again with another outcome
            let duplicate_record = InvocationLifecycleRecord {
                invocation_id: "inv_late_resp".to_string(),
                host_kind: "cli".to_string(),
                operation_id: OperationId::from_static("test.fixture.echo"),
                provider_id: Some("test.fixture.echo.builtin".to_string()),
                registry_fingerprint: Some("test-snapshot-p06".to_string()),
                request_contract: None,
                outcome_contract: None,
                trace_context: None,
                dispatched: true,
                terminal_state: InvocationTerminalState::Succeeded,
                terminal_error: None,
                diagnostics: vec![],
                started_at: SystemTime::now(),
                completed_at: SystemTime::now(),
            };
            service.tracker().write_terminal(duplicate_record);

            // Verify: terminal state is STILL Cancelled, NOT overwritten
            let final_stored_record = service.get_record("inv_late_resp").unwrap();
            assert_eq!(
                final_stored_record.terminal_state,
                InvocationTerminalState::Cancelled
            );

            // Exactly ONE record exists in tracker history
            let all_records = service.records();
            let matches_count = all_records
                .iter()
                .filter(|r| r.invocation_id == "inv_late_resp")
                .count();
            assert_eq!(matches_count, 1);

            // Diagnostic evidence was added
            assert!(!final_stored_record.diagnostics.is_empty());
            assert!(final_stored_record
                .diagnostics
                .iter()
                .any(|d| d.contains("late response arriving after terminal state 'cancelled'")));
        }
    }
}
