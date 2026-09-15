//! Process supervisor for external process providers.
//!
//! Spawns and supervises the provider process ONLY at invocation time, never during discovery.
//! Enforces:
//! - bounded startup/handshake deadline
//! - bounded request deadline
//! - bounded stdout/stderr capture
//! - cancellation notification with bounded grace then hard termination
//! - crash mapping to `ProviderCrash` (before dispatch) or `CompletionUnknown` (after dispatch)
//! - protocol violation mapping to `ProtocolViolation`

use super::frame_codec::{FrameCodec, FrameMessage, RequestId};
use crate::contracts::{ContractRef, ProviderError, ProviderOutcome};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::Read;
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

/// Configuration for an external process provider.
#[derive(Debug, Clone)]
pub struct ExternalProcessConfig {
    pub provider_id: String,
    pub executable_path: PathBuf,
    pub arguments: Vec<String>,
    pub environment: HashMap<String, String>,
    pub working_dir: Option<PathBuf>,
    pub startup_timeout: Duration,
    pub request_timeout: Duration,
    pub cancellation_grace_period: Duration,
    pub max_capture_bytes: usize,
    pub max_frame_size: usize,
    pub protocol_version: String,
}

impl ExternalProcessConfig {
    pub fn new(provider_id: impl Into<String>, executable_path: impl Into<PathBuf>) -> Self {
        Self {
            provider_id: provider_id.into(),
            executable_path: executable_path.into(),
            arguments: Vec::new(),
            environment: HashMap::new(),
            working_dir: None,
            startup_timeout: Duration::from_millis(2000),
            request_timeout: Duration::from_millis(5000),
            cancellation_grace_period: Duration::from_millis(200),
            max_capture_bytes: 1024 * 1024,      // 1 MB
            max_frame_size: 4 * 1024 * 1024,     // 4 MB
            protocol_version: "fgos.component.v1".to_string(),
        }
    }

    pub fn with_arguments(mut self, args: Vec<String>) -> Self {
        self.arguments = args;
        self
    }

    pub fn with_environment(mut self, env: HashMap<String, String>) -> Self {
        self.environment = env;
        self
    }

    pub fn with_working_dir(mut self, dir: PathBuf) -> Self {
        self.working_dir = Some(dir);
        self
    }

    pub fn with_startup_timeout(mut self, timeout: Duration) -> Self {
        self.startup_timeout = timeout;
        self
    }

    pub fn with_request_timeout(mut self, timeout: Duration) -> Self {
        self.request_timeout = timeout;
        self
    }

    pub fn with_cancellation_grace_period(mut self, grace: Duration) -> Self {
        self.cancellation_grace_period = grace;
        self
    }

    pub fn with_max_capture_bytes(mut self, max: usize) -> Self {
        self.max_capture_bytes = max;
        self
    }

    pub fn with_max_frame_size(mut self, max: usize) -> Self {
        self.max_frame_size = max;
        self
    }

    pub fn with_protocol_version(mut self, proto: impl Into<String>) -> Self {
        self.protocol_version = proto.into();
        self
    }
}

/// Request sent to the external process.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExternalProcessRequest {
    pub operation_id: String,
    pub request_contract: String,
    pub payload: serde_json::Value,
    pub request_id: Option<RequestId>,
}

impl ExternalProcessRequest {
    pub fn new(
        operation_id: impl Into<String>,
        request_contract: impl Into<String>,
        payload: serde_json::Value,
    ) -> Self {
        Self {
            operation_id: operation_id.into(),
            request_contract: request_contract.into(),
            payload,
            request_id: None,
        }
    }

    pub fn with_request_id(mut self, id: impl Into<RequestId>) -> Self {
        self.request_id = Some(id.into());
        self
    }
}

/// Outcome received from the external process.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ExternalProcessOutcome {
    pub provider_id: String,
    pub operation_id: String,
    pub outcome_contract: String,
    pub protocol_version: String,
    pub echo: serde_json::Value,
}

impl ExternalProcessOutcome {
    pub fn to_provider_outcome(&self) -> Result<ProviderOutcome, ProviderError> {
        let (id, version) = self.outcome_contract.split_once('@').ok_or_else(|| {
            ProviderError::ProtocolViolation(format!(
                "outcome_contract '{}' missing version delimiter '@'",
                self.outcome_contract
            ))
        })?;
        if id.is_empty() || version.is_empty() {
            return Err(ProviderError::ProtocolViolation(format!(
                "outcome_contract '{}' has empty id or version",
                self.outcome_contract
            )));
        }
        Ok(ProviderOutcome::completed(
            ContractRef::new(id, version),
            Box::new(self.echo.clone()),
        ))
    }
}

/// Supervisor that manages an external process provider lifecycle.
#[derive(Debug, Clone)]
pub struct ExternalProcessSupervisor {
    config: ExternalProcessConfig,
    codec: FrameCodec,
}

impl ExternalProcessSupervisor {
    pub fn new(config: ExternalProcessConfig) -> Self {
        let codec = FrameCodec::new().with_max_frame_size(config.max_frame_size);
        Self { config, codec }
    }

    pub fn config(&self) -> &ExternalProcessConfig {
        &self.config
    }

    /// Invokes the external process provider.
    pub async fn invoke(
        &self,
        request: &ExternalProcessRequest,
    ) -> Result<ExternalProcessOutcome, ProviderError> {
        self.invoke_with_cancellation(request, None).await
    }

    /// Invokes the external process provider with an optional cancellation receiver.
    pub async fn invoke_with_cancellation(
        &self,
        request: &ExternalProcessRequest,
        cancellation_rx: Option<tokio::sync::watch::Receiver<bool>>,
    ) -> Result<ExternalProcessOutcome, ProviderError> {
        // Step 1: Pre-spawn cancellation check
        if cancellation_rx.as_ref().map(|rx| *rx.borrow()).unwrap_or(false) {
            return Err(ProviderError::CallerCancelled(
                "invocation cancelled before process spawned".to_string(),
            ));
        }

        // Step 2: Spawn process
        let mut cmd = Command::new(&self.config.executable_path);
        cmd.args(&self.config.arguments);
        cmd.envs(&self.config.environment);
        if let Some(ref cwd) = self.config.working_dir {
            cmd.current_dir(cwd);
        }
        cmd.stdin(Stdio::piped());
        cmd.stdout(Stdio::piped());
        cmd.stderr(Stdio::piped());

        let mut child = cmd.spawn().map_err(|e| {
            ProviderError::ProviderUnavailable(format!(
                "failed to spawn provider process '{}': {e}",
                self.config.executable_path.display()
            ))
        })?;

        let mut stdin = child.stdin.take().ok_or_else(|| {
            kill_child(&mut child);
            ProviderError::ProviderUnavailable("failed to capture child stdin".to_string())
        })?;
        let stdout = child.stdout.take().ok_or_else(|| {
            kill_child(&mut child);
            ProviderError::ProviderUnavailable("failed to capture child stdout".to_string())
        })?;
        let stderr_opt = child.stderr.take();

        // Step 3: Bounded stderr capture in background thread
        let stderr_captured = Arc::new(Mutex::new(Vec::new()));
        let stderr_clone = Arc::clone(&stderr_captured);
        let max_capture = self.config.max_capture_bytes;
        if let Some(mut stderr) = stderr_opt {
            std::thread::spawn(move || {
                const TRUNCATION_MARKER: &[u8] = b"\n[stderr truncated]\n";
                let mut buf = [0u8; 1024];
                let mut total = 0;
                let mut truncated = false;
                while let Ok(n) = stderr.read(&mut buf) {
                    if n == 0 {
                        break;
                    }
                    if truncated {
                        continue;
                    }
                    let mut lock = stderr_clone.lock().unwrap();
                    if total + n <= max_capture {
                        lock.extend_from_slice(&buf[..n]);
                        total += n;
                    } else {
                        truncated = true;
                        if max_capture >= TRUNCATION_MARKER.len() {
                            let available = max_capture - TRUNCATION_MARKER.len();
                            if total < available {
                                let take = available - total;
                                lock.extend_from_slice(&buf[..take.min(n)]);
                            } else {
                                lock.truncate(available);
                            }
                            lock.extend_from_slice(TRUNCATION_MARKER);
                        } else {
                            let remaining = max_capture.saturating_sub(total);
                            lock.extend_from_slice(&buf[..remaining.min(n)]);
                        }
                        total = max_capture;
                    }
                }
            });
        }

        // Step 4: Background stdout reader thread sending frames to bounded channel
        const STDOUT_FRAME_QUEUE_BOUND: usize = 32;
        let (tx, rx) = std::sync::mpsc::sync_channel(STDOUT_FRAME_QUEUE_BOUND);
        let overflow_captured = Arc::new(Mutex::new(None));
        let overflow_clone = Arc::clone(&overflow_captured);
        let codec_clone = self.codec.clone();
        let max_stdout_bytes = self.config.max_capture_bytes;
        std::thread::spawn(move || {
            let mut reader = BudgetReader {
                inner: stdout,
                bytes_read: 0,
                max_bytes: max_stdout_bytes,
            };
            loop {
                match codec_clone.decode_from_reader(&mut reader) {
                    Ok(Some(msg)) => {
                        if reader.bytes_read > reader.max_bytes {
                            *overflow_clone.lock().unwrap() = Some(format!(
                                "stdout byte budget exceeded: {} bytes > max {}",
                                reader.bytes_read, reader.max_bytes
                            ));
                            break;
                        }
                        match tx.try_send(Ok(msg)) {
                            Ok(()) => {}
                            Err(std::sync::mpsc::TrySendError::Full(_)) => {
                                *overflow_clone.lock().unwrap() = Some(format!(
                                    "stdout frame queue capacity exceeded (bound: {STDOUT_FRAME_QUEUE_BOUND})"
                                ));
                                break;
                            }
                            Err(std::sync::mpsc::TrySendError::Disconnected(_)) => {
                                break;
                            }
                        }
                    }
                    Ok(None) => break,
                    Err(e) => {
                        if reader.bytes_read > reader.max_bytes {
                            *overflow_clone.lock().unwrap() = Some(format!(
                                "stdout byte budget exceeded: {} bytes > max {}",
                                reader.bytes_read, reader.max_bytes
                            ));
                        } else {
                            let _ = tx.try_send(Err(e));
                        }
                        break;
                    }
                }
            }
        });

        // Step 5: Handshake with bounded startup deadline
        let handshake_req = FrameMessage::request(
            "handshake",
            Some(serde_json::json!({
                "protocol_version": self.config.protocol_version,
                "expected_provider_id": self.config.provider_id,
            })),
            RequestId::Number(1),
        );

        if let Err(e) = self.codec.encode_to_writer(&handshake_req, &mut stdin) {
            kill_child(&mut child);
            let stderr_tail = format_stderr_tail(&stderr_captured);
            return Err(ProviderError::ProviderCrash(format!(
                "failed to send handshake to provider process: {e}{stderr_tail}"
            )));
        }

        let handshake_deadline = Instant::now() + self.config.startup_timeout;
        'handshake: loop {
            if Instant::now() > handshake_deadline {
                kill_child(&mut child);
                let stderr_tail = format_stderr_tail(&stderr_captured);
                return Err(ProviderError::DeadlineExceeded(format!(
                    "startup/handshake deadline exceeded{stderr_tail}"
                )));
            }

            if cancellation_rx.as_ref().map(|rx| *rx.borrow()).unwrap_or(false) {
                kill_child(&mut child);
                return Err(ProviderError::CallerCancelled(
                    "invocation cancelled during handshake".to_string(),
                ));
            }

            if let Some(ref err) = *overflow_captured.lock().unwrap() {
                kill_child(&mut child);
                let stderr_tail = format_stderr_tail(&stderr_captured);
                return Err(ProviderError::ProtocolViolation(format!(
                    "protocol violation during handshake: {err}{stderr_tail}"
                )));
            }

            // Drain response channel non-blocking BEFORE calling child.try_wait()
            match rx.try_recv() {
                Ok(Ok(FrameMessage::Response(res))) => {
                    let stderr_tail = format_stderr_tail(&stderr_captured);
                    if let Some(err) = res.error {
                        kill_child(&mut child);
                        return Err(ProviderError::ProtocolViolation(format!(
                            "handshake error response from provider: {}: {}{stderr_tail}",
                            err.code, err.message
                        )));
                    }
                    let result = res.result.ok_or_else(|| {
                        kill_child(&mut child);
                        ProviderError::ProtocolViolation(format!(
                            "handshake response missing result{stderr_tail}"
                        ))
                    })?;
                    let provider_id = result
                        .get("provider_id")
                        .and_then(|v| v.as_str())
                        .unwrap_or("");
                    if provider_id != self.config.provider_id {
                        kill_child(&mut child);
                        return Err(ProviderError::ProtocolViolation(format!(
                            "handshake provider id mismatch: expected '{}', got '{}'{stderr_tail}",
                            self.config.provider_id, provider_id
                        )));
                    }
                    // Handshake successfully completed!
                    break;
                }
                Ok(Ok(other)) => {
                    kill_child(&mut child);
                    let stderr_tail = format_stderr_tail(&stderr_captured);
                    return Err(ProviderError::ProtocolViolation(format!(
                        "expected handshake response, received {other:?}{stderr_tail}"
                    )));
                }
                Ok(Err(codec_err)) => {
                    kill_child(&mut child);
                    let stderr_tail = format_stderr_tail(&stderr_captured);
                    return Err(ProviderError::ProtocolViolation(format!(
                        "protocol violation during handshake: {codec_err}{stderr_tail}"
                    )));
                }
                Err(std::sync::mpsc::TryRecvError::Disconnected) => {
                    kill_child(&mut child);
                    let stderr_tail = format_stderr_tail(&stderr_captured);
                    return Err(ProviderError::ProviderCrash(format!(
                        "provider stdout disconnected during handshake{stderr_tail}"
                    )));
                }
                Err(std::sync::mpsc::TryRecvError::Empty) => {
                    // Only classify child exit as ProviderCrash when channel is empty AND disconnected
                    if let Ok(Some(status)) = child.try_wait() {
                        loop {
                            match rx.try_recv() {
                                Ok(Ok(FrameMessage::Response(res))) => {
                                    let stderr_tail = format_stderr_tail(&stderr_captured);
                                    if let Some(err) = res.error {
                                        kill_child(&mut child);
                                        return Err(ProviderError::ProtocolViolation(format!(
                                            "handshake error response from provider: {}: {}{stderr_tail}",
                                            err.code, err.message
                                        )));
                                    }
                                    let result = res.result.ok_or_else(|| {
                                        kill_child(&mut child);
                                        ProviderError::ProtocolViolation(format!(
                                            "handshake response missing result{stderr_tail}"
                                        ))
                                    })?;
                                    let provider_id = result
                                        .get("provider_id")
                                        .and_then(|v| v.as_str())
                                        .unwrap_or("");
                                    if provider_id != self.config.provider_id {
                                        kill_child(&mut child);
                                        return Err(ProviderError::ProtocolViolation(format!(
                                            "handshake provider id mismatch: expected '{}', got '{}'{stderr_tail}",
                                            self.config.provider_id, provider_id
                                        )));
                                    }
                                    break 'handshake;
                                }
                                Ok(Ok(other)) => {
                                    kill_child(&mut child);
                                    let stderr_tail = format_stderr_tail(&stderr_captured);
                                    return Err(ProviderError::ProtocolViolation(format!(
                                        "expected handshake response, received {other:?}{stderr_tail}"
                                    )));
                                }
                                Ok(Err(codec_err)) => {
                                    kill_child(&mut child);
                                    let stderr_tail = format_stderr_tail(&stderr_captured);
                                    return Err(ProviderError::ProtocolViolation(format!(
                                        "protocol violation during handshake: {codec_err}{stderr_tail}"
                                    )));
                                }
                                Err(std::sync::mpsc::TryRecvError::Disconnected) => {
                                    kill_child(&mut child);
                                    let stderr_tail = format_stderr_tail(&stderr_captured);
                                    return Err(ProviderError::ProviderCrash(format!(
                                        "provider process exited before handshake completed with status {status:?}{stderr_tail}"
                                    )));
                                }
                                Err(std::sync::mpsc::TryRecvError::Empty) => {
                                    tokio::time::sleep(Duration::from_millis(2)).await;
                                }
                            }
                        }
                    }
                    tokio::time::sleep(Duration::from_millis(5)).await;
                }
            }
        }

        // Step 6: Check child liveness and cancellation BEFORE dispatch
        if let Ok(Some(status)) = child.try_wait() {
            kill_child(&mut child);
            let stderr_tail = format_stderr_tail(&stderr_captured);
            return Err(ProviderError::ProviderCrash(format!(
                "provider process crashed before dispatch with status {status:?}{stderr_tail}"
            )));
        }

        if cancellation_rx.as_ref().map(|rx| *rx.borrow()).unwrap_or(false) {
            kill_child(&mut child);
            return Err(ProviderError::CallerCancelled(
                "invocation cancelled before dispatch".to_string(),
            ));
        }

        // Step 7: DISPATCH POINT
        // From this moment onward, any crash maps to CompletionUnknown
        let req_id = request
            .request_id
            .clone()
            .unwrap_or_else(|| RequestId::Number(2));
        let invoke_msg = FrameMessage::request(
            "invoke",
            Some(serde_json::json!({
                "operation_id": request.operation_id,
                "request_contract": request.request_contract,
                "payload": request.payload,
            })),
            req_id.clone(),
        );

        if let Err(e) = self.codec.encode_to_writer(&invoke_msg, &mut stdin) {
            kill_child(&mut child);
            let stderr_tail = format_stderr_tail(&stderr_captured);
            return Err(ProviderError::ProviderCrash(format!(
                "failed to dispatch request to provider: {e}{stderr_tail}"
            )));
        }

        // Step 8: Wait for response with bounded request deadline, handling cancellation and crashes
        let request_deadline = Instant::now() + self.config.request_timeout;
        loop {
            // Check cancellation: notify, wait grace period, then hard terminate
            if cancellation_rx.as_ref().map(|rx| *rx.borrow()).unwrap_or(false) {
                let cancel_msg = FrameMessage::notification(
                    "cancel",
                    Some(serde_json::json!({
                        "id": req_id,
                    })),
                );
                let _ = self.codec.encode_to_writer(&cancel_msg, &mut stdin);

                let grace_deadline = Instant::now() + self.config.cancellation_grace_period;
                while Instant::now() < grace_deadline {
                    if let Ok(Some(_)) = child.try_wait() {
                        break;
                    }
                    tokio::time::sleep(Duration::from_millis(5)).await;
                }

                kill_child(&mut child);
                return Err(ProviderError::CallerCancelled(
                    "invocation cancelled by caller".to_string(),
                ));
            }

            // Check request deadline
            if Instant::now() > request_deadline {
                kill_child(&mut child);
                let stderr_tail = format_stderr_tail(&stderr_captured);
                return Err(ProviderError::DeadlineExceeded(format!(
                    "request deadline exceeded ({}ms){stderr_tail}",
                    self.config.request_timeout.as_millis()
                )));
            }

            // Check overflow
            if let Some(ref err) = *overflow_captured.lock().unwrap() {
                kill_child(&mut child);
                let stderr_tail = format_stderr_tail(&stderr_captured);
                return Err(ProviderError::ProtocolViolation(format!(
                    "protocol violation: {err}{stderr_tail}"
                )));
            }

            // Drain response channel non-blocking BEFORE calling child.try_wait()
            match rx.try_recv() {
                Ok(Ok(FrameMessage::Response(res))) => {
                    let stderr_tail = format_stderr_tail(&stderr_captured);
                    if res.id != Some(req_id.clone()) {
                        kill_child(&mut child);
                        return Err(ProviderError::ProtocolViolation(format!(
                            "response id mismatch: expected {:?}, got {:?}{stderr_tail}",
                            req_id, res.id
                        )));
                    }

                    if let Some(err) = res.error {
                        kill_child(&mut child);
                        return Err(ProviderError::ProviderFailed(format!(
                            "provider error {}: {}{stderr_tail}",
                            err.code, err.message
                        )));
                    }

                    let result = res.result.ok_or_else(|| {
                        kill_child(&mut child);
                        ProviderError::ProtocolViolation(format!("response missing result{stderr_tail}"))
                    })?;

                    let outcome: ExternalProcessOutcome = serde_json::from_value(result).map_err(|e| {
                        kill_child(&mut child);
                        ProviderError::ProtocolViolation(format!(
                            "failed to parse outcome payload: {e}{stderr_tail}"
                        ))
                    })?;

                    if outcome.outcome_contract.split_once('@').is_none() {
                        kill_child(&mut child);
                        return Err(ProviderError::ProtocolViolation(format!(
                            "outcome_contract '{}' missing version delimiter '@'{stderr_tail}",
                            outcome.outcome_contract
                        )));
                    }

                    kill_child(&mut child);
                    return Ok(outcome);
                }
                Ok(Ok(other)) => {
                    kill_child(&mut child);
                    let stderr_tail = format_stderr_tail(&stderr_captured);
                    return Err(ProviderError::ProtocolViolation(format!(
                        "expected response, received {other:?}{stderr_tail}"
                    )));
                }
                Ok(Err(codec_err)) => {
                    kill_child(&mut child);
                    let stderr_tail = format_stderr_tail(&stderr_captured);
                    return Err(ProviderError::ProtocolViolation(format!(
                        "protocol violation in response frame: {codec_err}{stderr_tail}"
                    )));
                }
                Err(std::sync::mpsc::TryRecvError::Disconnected) => {
                    kill_child(&mut child);
                    let stderr_tail = format_stderr_tail(&stderr_captured);
                    return Err(ProviderError::CompletionUnknown(format!(
                        "provider process closed stdout after dispatch before completing response{stderr_tail}"
                    )));
                }
                Err(std::sync::mpsc::TryRecvError::Empty) => {
                    // Check if child crashed AFTER dispatch
                    if let Ok(Some(status)) = child.try_wait() {
                        // Wait until rx yields the response or channel is disconnected
                        loop {
                            match rx.try_recv() {
                                Ok(Ok(FrameMessage::Response(res))) => {
                                    let stderr_tail = format_stderr_tail(&stderr_captured);
                                    if res.id != Some(req_id.clone()) {
                                        kill_child(&mut child);
                                        return Err(ProviderError::ProtocolViolation(format!(
                                            "response id mismatch: expected {:?}, got {:?}{stderr_tail}",
                                            req_id, res.id
                                        )));
                                    }
                                    if let Some(err) = res.error {
                                        kill_child(&mut child);
                                        return Err(ProviderError::ProviderFailed(format!(
                                            "provider error {}: {}{stderr_tail}",
                                            err.code, err.message
                                        )));
                                    }
                                    let result = res.result.ok_or_else(|| {
                                        kill_child(&mut child);
                                        ProviderError::ProtocolViolation(format!("response missing result{stderr_tail}"))
                                    })?;
                                    let outcome: ExternalProcessOutcome = serde_json::from_value(result).map_err(|e| {
                                        kill_child(&mut child);
                                        ProviderError::ProtocolViolation(format!(
                                            "failed to parse outcome payload: {e}{stderr_tail}"
                                        ))
                                    })?;
                                    if outcome.outcome_contract.split_once('@').is_none() {
                                        kill_child(&mut child);
                                        return Err(ProviderError::ProtocolViolation(format!(
                                            "outcome_contract '{}' missing version delimiter '@'{stderr_tail}",
                                            outcome.outcome_contract
                                        )));
                                    }
                                    kill_child(&mut child);
                                    return Ok(outcome);
                                }
                                Ok(Ok(other)) => {
                                    kill_child(&mut child);
                                    let stderr_tail = format_stderr_tail(&stderr_captured);
                                    return Err(ProviderError::ProtocolViolation(format!(
                                        "expected response, received {other:?}{stderr_tail}"
                                    )));
                                }
                                Ok(Err(codec_err)) => {
                                    kill_child(&mut child);
                                    let stderr_tail = format_stderr_tail(&stderr_captured);
                                    return Err(ProviderError::ProtocolViolation(format!(
                                        "protocol violation in response frame: {codec_err}{stderr_tail}"
                                    )));
                                }
                                Err(std::sync::mpsc::TryRecvError::Disconnected) => {
                                    kill_child(&mut child);
                                    let stderr_tail = format_stderr_tail(&stderr_captured);
                                    return Err(ProviderError::CompletionUnknown(format!(
                                        "provider process crashed after dispatch before response received (status: {status:?}){stderr_tail}"
                                    )));
                                }
                                Err(std::sync::mpsc::TryRecvError::Empty) => {
                                    tokio::time::sleep(Duration::from_millis(2)).await;
                                }
                            }
                        }
                    }
                    tokio::time::sleep(Duration::from_millis(5)).await;
                }
            }
        }
    }
}

struct BudgetReader<R> {
    inner: R,
    bytes_read: usize,
    max_bytes: usize,
}

impl<R: Read> Read for BudgetReader<R> {
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        let n = self.inner.read(buf)?;
        self.bytes_read += n;
        Ok(n)
    }
}

fn format_stderr_tail(stderr_captured: &Arc<Mutex<Vec<u8>>>) -> String {
    let lock = stderr_captured.lock().unwrap();
    if lock.is_empty() {
        String::new()
    } else {
        let text = String::from_utf8_lossy(&lock);
        let trimmed = text.trim();
        if trimmed.is_empty() {
            String::new()
        } else {
            format!(" (stderr: {trimmed})")
        }
    }
}

fn kill_child(child: &mut Child) {
    let _ = child.kill();
    let _ = child.wait();
}
