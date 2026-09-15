//! Integration tests for R2-P3 / R2-P4: Frame Codec and Process Supervisor.
//!
//! Proves:
//! - Frame codec round-trips request, response, and notification frames
//! - Frame codec rejects oversized frames
//! - Frame codec rejects truncated frames
//! - Frame codec rejects invalid UTF-8
//! - Frame codec rejects invalid JSON
//! - Frame codec rejects non-JSON-RPC-2.0 shapes
//! - Supervisor happy-path fixture invocation
//! - Supervisor startup failure
//! - Supervisor bad handshake
//! - Supervisor timeout (handshake and request)
//! - Supervisor crash before dispatch (maps to ProviderCrash)
//! - Supervisor crash after dispatch (maps to CompletionUnknown)
//! - Supervisor malformed frame (maps to ProtocolViolation)
//! - Supervisor cancellation path (sends cancel notification, bounded grace, terminates, maps to CallerCancelled)
//! - Discovery-time test proving the fixture process is never spawned except when explicitly invoked

use fgos_host_runtime::contracts::{
    ContractRef, OperationId, ProviderDescriptor, ProviderError, ProviderLifecycle,
};
use fgos_host_runtime::providers::external_process::{
    frame_codec::{
        CodecError, FrameCodec, FrameMessage, JsonRpcError, RequestId,
    },
    supervisor::{ExternalProcessConfig, ExternalProcessRequest, ExternalProcessSupervisor},
    COMPONENT_PROTOCOL_VERSION, FIXTURE_OPERATION_ID, FIXTURE_OUTCOME_CONTRACT,
    FIXTURE_PROVIDER_ID, FIXTURE_REQUEST_CONTRACT,
};
use std::borrow::Cow;
use std::path::PathBuf;
use std::time::Duration;

fn fixture_bin() -> PathBuf {
    if let Ok(path) = std::env::var("CARGO_BIN_EXE_fixture-echo-process") {
        let p = PathBuf::from(path);
        if p.exists() {
            return p;
        }
    }
    let current = std::env::current_exe().expect("current exe");
    let dir = current.parent().expect("parent dir");
    let candidate = dir.join("fixture-echo-process");
    if candidate.exists() {
        return candidate;
    }
    if let Some(grandparent) = dir.parent() {
        let candidate = grandparent.join("fixture-echo-process");
        if candidate.exists() {
            return candidate;
        }
    }
    let root = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let target_debug = root.join("../../target/debug/fixture-echo-process");
    if target_debug.exists() {
        return target_debug;
    }
    panic!("could not locate fixture-echo-process binary");
}

// -----------------------------------------------------------------------------
// 1. Frame Codec Tests
// -----------------------------------------------------------------------------

#[test]
fn test_frame_codec_round_trips_request_response_notification() {
    let codec = FrameCodec::new();

    // 1. Request with number ID
    let req1 = FrameMessage::request(
        "fixture.echo.echo",
        Some(serde_json::json!({ "msg": "hello" })),
        RequestId::Number(42),
    );
    let bytes1 = codec.encode(&req1).expect("encode request");
    let (decoded1, len1) = codec.decode(&bytes1).expect("decode request");
    assert_eq!(len1, bytes1.len());
    assert_eq!(decoded1, req1);

    // 2. Request with string ID
    let req2 = FrameMessage::request(
        "handshake",
        Some(serde_json::json!({ "proto": "v1" })),
        RequestId::String("req-abc-123".to_string()),
    );
    let bytes2 = codec.encode(&req2).expect("encode request");
    let (decoded2, len2) = codec.decode(&bytes2).expect("decode request");
    assert_eq!(len2, bytes2.len());
    assert_eq!(decoded2, req2);

    // 3. Response with result
    let res1 = FrameMessage::response(
        Some(RequestId::Number(42)),
        serde_json::json!({ "status": "ok", "count": 10 }),
    );
    let bytes3 = codec.encode(&res1).expect("encode response");
    let (decoded3, len3) = codec.decode(&bytes3).expect("decode response");
    assert_eq!(len3, bytes3.len());
    assert_eq!(decoded3, res1);

    // 4. Response with error
    let res2 = FrameMessage::response_error(
        Some(RequestId::Number(42)),
        JsonRpcError {
            code: -32600,
            message: "Invalid Request".to_string(),
            data: Some(serde_json::json!({ "details": "bad frame" })),
        },
    );
    let bytes4 = codec.encode(&res2).expect("encode error response");
    let (decoded4, len4) = codec.decode(&bytes4).expect("decode error response");
    assert_eq!(len4, bytes4.len());
    assert_eq!(decoded4, res2);

    // 5. Notification
    let notif = FrameMessage::notification(
        "cancel",
        Some(serde_json::json!({ "id": 42 })),
    );
    let bytes5 = codec.encode(&notif).expect("encode notification");
    let (decoded5, len5) = codec.decode(&bytes5).expect("decode notification");
    assert_eq!(len5, bytes5.len());
    assert_eq!(decoded5, notif);

    // Test stream decoding from reader
    let mut stream = Vec::new();
    stream.extend_from_slice(&bytes1);
    stream.extend_from_slice(&bytes3);
    stream.extend_from_slice(&bytes5);

    let mut cursor = std::io::Cursor::new(stream);
    let r1 = codec.decode_from_reader(&mut cursor).expect("stream decode 1");
    let r2 = codec.decode_from_reader(&mut cursor).expect("stream decode 2");
    let r3 = codec.decode_from_reader(&mut cursor).expect("stream decode 3");
    let r4 = codec.decode_from_reader(&mut cursor).expect("stream EOF");

    assert_eq!(r1, Some(req1));
    assert_eq!(r2, Some(res1));
    assert_eq!(r3, Some(notif));
    assert_eq!(r4, None);
}

#[test]
fn test_frame_codec_rejects_oversized_frame() {
    let codec = FrameCodec::new().with_max_frame_size(50);

    // 1. Oversized during decode from length prefix
    let mut header = Vec::new();
    let declared_len = 1000u32;
    header.extend_from_slice(&declared_len.to_be_bytes());
    header.extend_from_slice(&[0u8; 100]);
    let err = codec.decode(&header).unwrap_err();
    assert_eq!(
        err,
        CodecError::OversizedFrame {
            size: 1000,
            max: 50
        }
    );

    // 2. Oversized during encode
    let big_payload = "a".repeat(100);
    let req = FrameMessage::request("large", Some(serde_json::json!({ "data": big_payload })), 1);
    let err = codec.encode(&req).unwrap_err();
    assert!(matches!(err, CodecError::OversizedFrame { size, max } if size > 50 && max == 50));
}

#[test]
fn test_frame_codec_rejects_truncated_frame() {
    let codec = FrameCodec::new();

    // 1. Fewer than 4 bytes for length prefix
    let err = codec.decode(&[0x00, 0x00]).unwrap_err();
    assert_eq!(err, CodecError::TruncatedFrame);

    // 2. Declared length is 20, but only 5 payload bytes provided
    let mut truncated = Vec::new();
    truncated.extend_from_slice(&20u32.to_be_bytes());
    truncated.extend_from_slice(b"12345");
    let err = codec.decode(&truncated).unwrap_err();
    assert_eq!(err, CodecError::TruncatedFrame);

    // 3. Reader truncated in length prefix
    let mut cursor = std::io::Cursor::new(vec![0x00, 0x00, 0x00]);
    let err = codec.decode_from_reader(&mut cursor).unwrap_err();
    assert_eq!(err, CodecError::TruncatedFrame);

    // 4. Reader truncated in payload
    let mut cursor_payload = std::io::Cursor::new(truncated);
    let err = codec.decode_from_reader(&mut cursor_payload).unwrap_err();
    assert_eq!(err, CodecError::TruncatedFrame);
}

#[test]
fn test_frame_codec_rejects_invalid_utf8() {
    let codec = FrameCodec::new();
    let bad_utf8 = [0xFF, 0xFE, 0xFD];
    let mut frame = Vec::new();
    frame.extend_from_slice(&(bad_utf8.len() as u32).to_be_bytes());
    frame.extend_from_slice(&bad_utf8);

    let err = codec.decode(&frame).unwrap_err();
    assert!(matches!(err, CodecError::InvalidUtf8(_)));
}

#[test]
fn test_frame_codec_rejects_invalid_json() {
    let codec = FrameCodec::new();
    let bad_json = b"{ not a valid json: 123 ";
    let mut frame = Vec::new();
    frame.extend_from_slice(&(bad_json.len() as u32).to_be_bytes());
    frame.extend_from_slice(bad_json);

    let err = codec.decode(&frame).unwrap_err();
    assert!(matches!(err, CodecError::InvalidJson(_)));
}

#[test]
fn test_frame_codec_rejects_non_jsonrpc_shapes() {
    let codec = FrameCodec::new();

    let check_bad_shape = |json_str: &str| {
        let bytes = json_str.as_bytes();
        let mut frame = Vec::new();
        frame.extend_from_slice(&(bytes.len() as u32).to_be_bytes());
        frame.extend_from_slice(bytes);
        let err = codec.decode(&frame).unwrap_err();
        assert!(
            matches!(err, CodecError::NonJsonRpcShape(_)),
            "expected NonJsonRpcShape for '{}', got {:?}",
            json_str,
            err
        );
    };

    // Array instead of object
    check_bad_shape("[1, 2, 3]");
    // String primitive
    check_bad_shape("\"just a string\"");
    // Missing jsonrpc member
    check_bad_shape(r#"{"method": "test", "id": 1}"#);
    // Unsupported jsonrpc version
    check_bad_shape(r#"{"jsonrpc": "1.0", "method": "test", "id": 1}"#);
    // Both method and result
    check_bad_shape(r#"{"jsonrpc": "2.0", "method": "test", "result": 42, "id": 1}"#);
    // Both method and error
    check_bad_shape(r#"{"jsonrpc": "2.0", "method": "test", "error": {"code": 1, "message": "err"}, "id": 1}"#);
    // Both result and error
    check_bad_shape(r#"{"jsonrpc": "2.0", "result": 42, "error": {"code": 1, "message": "err"}, "id": 1}"#);
    // Method is not a string
    check_bad_shape(r#"{"jsonrpc": "2.0", "method": 123, "id": 1}"#);
    // ID is an object/array (not string/number/null)
    check_bad_shape(r#"{"jsonrpc": "2.0", "method": "test", "id": {"obj": true}}"#);
    // Response error is not an object
    check_bad_shape(r#"{"jsonrpc": "2.0", "error": "error string", "id": 1}"#);
    // Response error missing integer code
    check_bad_shape(r#"{"jsonrpc": "2.0", "error": {"code": "not_int", "message": "msg"}, "id": 1}"#);
    // Response error missing message
    check_bad_shape(r#"{"jsonrpc": "2.0", "error": {"code": 1}, "id": 1}"#);
    // Neither method nor result/error
    check_bad_shape(r#"{"jsonrpc": "2.0", "id": 1}"#);
}

// -----------------------------------------------------------------------------
// 2. Supervisor Tests
// -----------------------------------------------------------------------------

#[tokio::test]
async fn test_supervisor_happy_path_fixture_invocation() {
    let bin = fixture_bin();
    let config = ExternalProcessConfig::new(FIXTURE_PROVIDER_ID, bin);
    let supervisor = ExternalProcessSupervisor::new(config);

    let payload = serde_json::json!({
        "message": "hello from supervisor",
        "nested": { "val": 42 }
    });
    let request = ExternalProcessRequest::new(
        FIXTURE_OPERATION_ID,
        FIXTURE_REQUEST_CONTRACT,
        payload.clone(),
    )
    .with_request_id(RequestId::Number(99));

    let outcome = supervisor.invoke(&request).await.expect("happy path invoke");

    assert_eq!(outcome.provider_id, FIXTURE_PROVIDER_ID);
    assert_eq!(outcome.operation_id, FIXTURE_OPERATION_ID);
    assert_eq!(outcome.outcome_contract, FIXTURE_OUTCOME_CONTRACT);
    assert_eq!(outcome.protocol_version, COMPONENT_PROTOCOL_VERSION);
    assert_eq!(outcome.echo, payload);

    let provider_outcome = outcome.to_provider_outcome().expect("to_provider_outcome succeeds");
    assert_eq!(provider_outcome.contract().id(), "fixture.echo.echo.outcome");
    assert_eq!(provider_outcome.contract().version(), "1.0.0");
}

#[tokio::test]
async fn test_supervisor_startup_failure() {
    let config = ExternalProcessConfig::new(
        FIXTURE_PROVIDER_ID,
        PathBuf::from("/nonexistent/path/to/fixture_binary"),
    );
    let supervisor = ExternalProcessSupervisor::new(config);

    let request = ExternalProcessRequest::new(
        FIXTURE_OPERATION_ID,
        FIXTURE_REQUEST_CONTRACT,
        serde_json::json!({}),
    );

    let err = supervisor.invoke(&request).await.unwrap_err();
    assert!(
        matches!(err, ProviderError::ProviderUnavailable(_)),
        "expected ProviderUnavailable, got {:?}",
        err
    );
}

#[tokio::test]
async fn test_supervisor_bad_handshake() {
    let bin = fixture_bin();
    let config = ExternalProcessConfig::new(FIXTURE_PROVIDER_ID, bin)
        .with_arguments(vec!["--bad-handshake".to_string()]);
    let supervisor = ExternalProcessSupervisor::new(config);

    let request = ExternalProcessRequest::new(
        FIXTURE_OPERATION_ID,
        FIXTURE_REQUEST_CONTRACT,
        serde_json::json!({}),
    );

    let err = supervisor.invoke(&request).await.unwrap_err();
    assert!(
        matches!(err, ProviderError::ProtocolViolation(_)),
        "expected ProtocolViolation for bad handshake, got {:?}",
        err
    );
}

#[tokio::test]
async fn test_supervisor_timeout_handshake() {
    let bin = fixture_bin();
    let config = ExternalProcessConfig::new(FIXTURE_PROVIDER_ID, bin)
        .with_arguments(vec!["--hang".to_string()])
        .with_startup_timeout(Duration::from_millis(50));
    let supervisor = ExternalProcessSupervisor::new(config);

    let request = ExternalProcessRequest::new(
        FIXTURE_OPERATION_ID,
        FIXTURE_REQUEST_CONTRACT,
        serde_json::json!({}),
    );

    let err = supervisor.invoke(&request).await.unwrap_err();
    assert!(
        matches!(err, ProviderError::DeadlineExceeded(_)),
        "expected DeadlineExceeded for handshake timeout, got {:?}",
        err
    );
}

#[tokio::test]
async fn test_supervisor_timeout_request() {
    let bin = fixture_bin();
    let config = ExternalProcessConfig::new(FIXTURE_PROVIDER_ID, bin)
        .with_request_timeout(Duration::from_millis(50));
    let supervisor = ExternalProcessSupervisor::new(config);

    let request = ExternalProcessRequest::new(
        FIXTURE_OPERATION_ID,
        FIXTURE_REQUEST_CONTRACT,
        serde_json::json!({ "delay_ms": 1000 }),
    );

    let err = supervisor.invoke(&request).await.unwrap_err();
    assert!(
        matches!(err, ProviderError::DeadlineExceeded(_)),
        "expected DeadlineExceeded for request timeout, got {:?}",
        err
    );
}

#[tokio::test]
async fn test_supervisor_drain_bounded_when_grandchild_holds_stdout_handshake() {
    // Scenario: Direct child process exits immediately during handshake, but a grandchild
    // process inherits stdout and keeps the pipe open. The inner drain loop must be bounded
    // by the startup deadline and terminate instead of spinning unboundedly.
    let config = ExternalProcessConfig::new(FIXTURE_PROVIDER_ID, PathBuf::from("sh"))
        .with_arguments(vec!["-c".to_string(), "sleep 10 & exit 0".to_string()])
        .with_startup_timeout(Duration::from_millis(50));
    let supervisor = ExternalProcessSupervisor::new(config);

    let request = ExternalProcessRequest::new(
        FIXTURE_OPERATION_ID,
        FIXTURE_REQUEST_CONTRACT,
        serde_json::json!({}),
    );

    let start = std::time::Instant::now();
    let err = supervisor.invoke(&request).await.unwrap_err();
    let elapsed = start.elapsed();

    assert!(
        matches!(err, ProviderError::DeadlineExceeded(_)),
        "expected DeadlineExceeded when child exits but pipe remains open, got {:?}",
        err
    );
    assert!(
        elapsed < Duration::from_millis(1500),
        "drain loop took too long ({:?}), expected bounded by startup timeout (~50ms)",
        elapsed
    );
}

#[tokio::test]
async fn test_supervisor_drain_bounded_when_grandchild_holds_stdout_dispatch() {
    // Scenario: Direct child completes handshake, but upon receiving invoke dispatch,
    // spawns a background grandchild holding stdout open and exits immediately.
    // The inner response-drain loop after dispatch must be bounded by request deadline.
    if std::process::Command::new("python3").arg("--version").output().is_err() {
        return;
    }

    let py_script = r#"
import sys, struct, json, os, time
# Step 1: Handshake
prefix = sys.stdin.buffer.read(4)
if len(prefix) == 4:
    n = struct.unpack('>I', prefix)[0]
    sys.stdin.buffer.read(n)
    resp = json.dumps({
        'jsonrpc': '2.0',
        'id': 1,
        'result': {
            'provider_id': 'fixture.echo.process',
            'protocol_version': 'fgos.component.v1',
            'supported_operations': []
        }
    }).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('>I', len(resp)) + resp)
    sys.stdout.buffer.flush()

    # Step 2: Invoke dispatch
    prefix = sys.stdin.buffer.read(4)
    if len(prefix) == 4:
        n = struct.unpack('>I', prefix)[0]
        sys.stdin.buffer.read(n)
        # Fork grandchild that inherits stdout and sleeps
        if os.fork() == 0:
            time.sleep(10)
            os._exit(0)
        # Direct child exits immediately
        os._exit(0)
"#;

    let config = ExternalProcessConfig::new(FIXTURE_PROVIDER_ID, PathBuf::from("python3"))
        .with_arguments(vec!["-c".to_string(), py_script.to_string()])
        .with_request_timeout(Duration::from_millis(50));
    let supervisor = ExternalProcessSupervisor::new(config);

    let request = ExternalProcessRequest::new(
        FIXTURE_OPERATION_ID,
        FIXTURE_REQUEST_CONTRACT,
        serde_json::json!({}),
    );

    let start = std::time::Instant::now();
    let err = supervisor.invoke(&request).await.unwrap_err();
    let elapsed = start.elapsed();

    assert!(
        matches!(err, ProviderError::DeadlineExceeded(_)),
        "expected DeadlineExceeded when child exits after dispatch but grandchild holds pipe, got {:?}",
        err
    );
    assert!(
        elapsed < Duration::from_millis(1500),
        "dispatch drain loop took too long ({:?}), expected bounded by request timeout (~50ms)",
        elapsed
    );
}

#[tokio::test]
async fn test_supervisor_crash_before_dispatch() {
    let bin = fixture_bin();
    let config = ExternalProcessConfig::new(FIXTURE_PROVIDER_ID, bin)
        .with_arguments(vec!["--exit-after-handshake".to_string()]);
    let supervisor = ExternalProcessSupervisor::new(config);

    let request = ExternalProcessRequest::new(
        FIXTURE_OPERATION_ID,
        FIXTURE_REQUEST_CONTRACT,
        serde_json::json!({}),
    );

    let err = supervisor.invoke(&request).await.unwrap_err();
    match err {
        ProviderError::ProviderCrash(ref msg) => {
            assert!(
                msg.contains("before dispatch"),
                "expected ProviderCrash before dispatch, got: {msg}"
            );
        }
        other => panic!("expected ProviderCrash before dispatch, got {:?}", other),
    }
}

#[tokio::test]
async fn test_supervisor_crash_after_dispatch() {
    let bin = fixture_bin();
    let config = ExternalProcessConfig::new(FIXTURE_PROVIDER_ID, bin);
    let supervisor = ExternalProcessSupervisor::new(config);

    let request = ExternalProcessRequest::new(
        FIXTURE_OPERATION_ID,
        FIXTURE_REQUEST_CONTRACT,
        serde_json::json!({ "action": "crash_after_dispatch" }),
    );

    let err = supervisor.invoke(&request).await.unwrap_err();
    assert!(
        matches!(err, ProviderError::CompletionUnknown(_)),
        "expected CompletionUnknown after dispatch, got {:?}",
        err
    );
}

#[tokio::test]
async fn test_supervisor_malformed_frame() {
    let bin = fixture_bin();
    let config = ExternalProcessConfig::new(FIXTURE_PROVIDER_ID, bin);
    let supervisor = ExternalProcessSupervisor::new(config);

    let request = ExternalProcessRequest::new(
        FIXTURE_OPERATION_ID,
        FIXTURE_REQUEST_CONTRACT,
        serde_json::json!({ "malformed_frame": true }),
    );

    let err = supervisor.invoke(&request).await.unwrap_err();
    assert!(
        matches!(err, ProviderError::ProtocolViolation(_)),
        "expected ProtocolViolation for malformed frame, got {:?}",
        err
    );
}

#[tokio::test]
async fn test_supervisor_cancellation_path() {
    let bin = fixture_bin();
    let cancel_marker_path = std::env::temp_dir().join(format!(
        "fgos_test_cancel_marker_{}_{}.marker",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    if cancel_marker_path.exists() {
        let _ = std::fs::remove_file(&cancel_marker_path);
    }

    let spawn_sentinel_path = std::env::temp_dir().join(format!(
        "fgos_test_spawn_marker_{}_{}.marker",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    if spawn_sentinel_path.exists() {
        let _ = std::fs::remove_file(&spawn_sentinel_path);
    }

    let mut env = std::collections::HashMap::new();
    env.insert(
        "CANCEL_SENTINEL_FILE".to_string(),
        cancel_marker_path.to_string_lossy().to_string(),
    );
    env.insert(
        "SENTINEL_FILE".to_string(),
        spawn_sentinel_path.to_string_lossy().to_string(),
    );

    let grace_period = Duration::from_millis(1000);
    let config = ExternalProcessConfig::new(FIXTURE_PROVIDER_ID, bin)
        .with_environment(env)
        .with_cancellation_grace_period(grace_period);
    let supervisor = ExternalProcessSupervisor::new(config);

    let request = ExternalProcessRequest::new(
        FIXTURE_OPERATION_ID,
        FIXTURE_REQUEST_CONTRACT,
        serde_json::json!({ "action": "cooperative_cancel" }),
    );

    let (cancel_tx, cancel_rx) = tokio::sync::watch::channel(false);

    // Cancel after 30ms while the child is blocking on stdin
    tokio::spawn(async move {
        tokio::time::sleep(Duration::from_millis(30)).await;
        let _ = cancel_tx.send(true);
    });

    let invoke_start = std::time::Instant::now();
    let err = supervisor
        .invoke_with_cancellation(&request, Some(cancel_rx))
        .await
        .unwrap_err();
    let elapsed = invoke_start.elapsed();

    // 1. Assert CallerCancelled was returned
    assert!(
        matches!(err, ProviderError::CallerCancelled(_)),
        "expected CallerCancelled on cancellation, got {:?}",
        err
    );

    // 2. Assert the cancel notification was genuinely sent and received by the child
    assert!(
        cancel_marker_path.exists(),
        "fixture MUST have received the cooperative cancel notification and written marker"
    );

    // 3. Assert the grace bound was respected (elapsed comfortably under the 1000ms grace deadline)
    assert!(
        elapsed < Duration::from_millis(400),
        "cooperative cancellation took too long ({:?}), expected exit well under grace deadline (1000ms)",
        elapsed
    );

    // 4. Assert the child process was terminated
    let spawn_content = std::fs::read_to_string(&spawn_sentinel_path).expect("read spawn sentinel");
    let pid_str = spawn_content
        .lines()
        .next()
        .and_then(|l| l.strip_prefix("spawned: "))
        .expect("parse pid from spawn sentinel");
    let pid: u32 = pid_str.trim().parse().expect("parse pid as integer");

    #[cfg(target_os = "linux")]
    {
        let proc_path = format!("/proc/{}", pid);
        assert!(
            !std::path::Path::new(&proc_path).exists(),
            "child process (pid {pid}) MUST be terminated and reaped"
        );
    }

    // Clean up markers
    let _ = std::fs::remove_file(&cancel_marker_path);
    let _ = std::fs::remove_file(&spawn_sentinel_path);
}

#[tokio::test]
async fn test_supervisor_flood_bounds_memory_and_terminates() {
    let bin = fixture_bin();
    let config = ExternalProcessConfig::new(FIXTURE_PROVIDER_ID, bin)
        .with_max_capture_bytes(64 * 1024); // 64 KB limit
    let supervisor = ExternalProcessSupervisor::new(config);

    let request = ExternalProcessRequest::new(
        FIXTURE_OPERATION_ID,
        FIXTURE_REQUEST_CONTRACT,
        serde_json::json!({ "action": "flood" }),
    );

    let err = supervisor.invoke(&request).await.unwrap_err();
    match err {
        ProviderError::ProtocolViolation(ref msg) => {
            assert!(
                msg.contains("stdout byte budget exceeded")
                    || msg.contains("stdout frame queue capacity exceeded"),
                "expected ProtocolViolation due to byte budget or queue capacity overflow, got: {msg}"
            );
        }
        other => panic!("expected ProtocolViolation on flood overflow, got {:?}", other),
    }
}

#[test]
fn test_to_provider_outcome_rejects_missing_version_delimiter() {
    let outcome = fgos_host_runtime::providers::external_process::supervisor::ExternalProcessOutcome {
        provider_id: FIXTURE_PROVIDER_ID.to_string(),
        operation_id: FIXTURE_OPERATION_ID.to_string(),
        outcome_contract: "fixture.echo.echo.outcome".to_string(), // missing '@'
        protocol_version: COMPONENT_PROTOCOL_VERSION.to_string(),
        echo: serde_json::json!({}),
    };
    let err = outcome.to_provider_outcome().unwrap_err();
    assert!(
        matches!(err, ProviderError::ProtocolViolation(_)),
        "expected ProtocolViolation for missing '@', got {:?}",
        err
    );
}

#[tokio::test]
async fn test_discovery_does_not_spawn_fixture_process() {
    let bin = fixture_bin();
    let marker_path = std::env::temp_dir().join(format!(
        "fgos_test_sentinel_{}_{}.marker",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));

    // Ensure marker does not exist
    if marker_path.exists() {
        let _ = std::fs::remove_file(&marker_path);
    }

    let mut env = std::collections::HashMap::new();
    env.insert(
        "SENTINEL_FILE".to_string(),
        marker_path.to_string_lossy().to_string(),
    );

    // DISCOVERY PHASE:
    // Construct configuration, supervisor, and descriptor
    let config = ExternalProcessConfig::new(FIXTURE_PROVIDER_ID, bin).with_environment(env);
    let supervisor = ExternalProcessSupervisor::new(config);

    // Construct in-memory descriptor
    let descriptor = ProviderDescriptor {
        provider_id: Cow::Borrowed(FIXTURE_PROVIDER_ID),
        operation_id: OperationId::from_static(FIXTURE_OPERATION_ID),
        component_class: Cow::Borrowed("fixture"),
        mechanism: Cow::Borrowed("process"),
        lifecycle: ProviderLifecycle::PerInvocation,
        request_contract: ContractRef::from_static("fixture.echo.echo.request", "1.0.0"),
        outcome_contract: ContractRef::from_static("fixture.echo.echo.outcome", "1.0.0"),
        allowed_hosts: &["cli", "test"],
        allowed_modes: &["sync", "test"],
        capabilities: &[],
        replacement: None,
        concurrency: Some(1),
        health: None,
    };

    // Inspect descriptor fields during discovery
    assert_eq!(descriptor.provider_id, FIXTURE_PROVIDER_ID);
    assert_eq!(descriptor.operation_id.as_str(), FIXTURE_OPERATION_ID);
    assert_eq!(supervisor.config().provider_id, FIXTURE_PROVIDER_ID);

    // ASSERT: During discovery/registration/inspection, the fixture process was NOT spawned!
    assert!(
        !marker_path.exists(),
        "fixture process MUST NOT be spawned during discovery/construction"
    );

    // INVOCATION PHASE:
    // Explicitly invoke the provider
    let request = ExternalProcessRequest::new(
        FIXTURE_OPERATION_ID,
        FIXTURE_REQUEST_CONTRACT,
        serde_json::json!({ "invoked": true }),
    );
    let outcome = supervisor.invoke(&request).await.expect("invoke succeeds");
    assert_eq!(outcome.provider_id, FIXTURE_PROVIDER_ID);

    // ASSERT: Now that invocation was explicitly called, the process was spawned!
    assert!(
        marker_path.exists(),
        "fixture process MUST be spawned upon explicit invocation"
    );

    // Clean up marker
    let _ = std::fs::remove_file(&marker_path);
}
