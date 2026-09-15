//! Real runnable fixture process implementing `fixture.echo.echo` over component protocol.
//!
//! Frozen fixture contract:
//! - provider id: `fixture.echo.process`
//! - operation id: `fixture.echo.echo`
//! - request contract: `fixture.echo.echo.request@1.0.0`
//! - outcome contract: `fixture.echo.echo.outcome@1.0.0`
//! - component protocol: 4-byte big-endian length-prefixed JSON-RPC 2.0 frames on stdio
//!
//! Proves:
//! - manifest-selected provider was invoked
//! - request id round-tripped
//! - negotiated protocol version was used
//! - response came from a real framed stdio decode, not an in-memory mock

use fgos_host_runtime::providers::external_process::frame_codec::{
    FrameCodec, FrameMessage, JsonRpcError, JsonRpcResponse,
};
use fgos_host_runtime::providers::external_process::{
    COMPONENT_PROTOCOL_VERSION, FIXTURE_OPERATION_ID, FIXTURE_OUTCOME_CONTRACT,
    FIXTURE_PROVIDER_ID, FIXTURE_REQUEST_CONTRACT,
};
use std::env;
use std::fs;
use std::io::{self, BufReader, BufWriter, Write};
use std::time::Duration;

fn main() -> io::Result<()> {
    // If SENTINEL_FILE is set, write to it immediately to record that this process spawned
    if let Ok(sentinel_path) = env::var("SENTINEL_FILE") {
        let _ = fs::write(sentinel_path, format!("spawned: {}\n", std::process::id()));
    }

    let args: Vec<String> = env::args().collect();

    // CLI flags for testing failure modes
    if args.iter().any(|a| a == "--crash-immediately") {
        std::process::exit(42);
    }
    if args.iter().any(|a| a == "--hang") {
        loop {
            std::thread::sleep(Duration::from_secs(60));
        }
    }

    let stdin = io::stdin();
    let mut reader = BufReader::new(stdin.lock());
    let stdout = io::stdout();
    let mut writer = BufWriter::new(stdout.lock());
    let codec = FrameCodec::new();

    let mut negotiated_protocol = COMPONENT_PROTOCOL_VERSION.to_string();

    loop {
        let msg = match codec.decode_from_reader(&mut reader) {
            Ok(Some(m)) => m,
            Ok(None) => break, // Clean EOF
            Err(e) => {
                eprintln!("fixture echo_process decode error: {e}");
                break;
            }
        };

        match msg {
            FrameMessage::Request(req) => {
                if req.method == "handshake" {
                    if args.iter().any(|a| a == "--bad-handshake") {
                        let resp = FrameMessage::Response(JsonRpcResponse {
                            jsonrpc: "2.0".to_string(),
                            id: Some(req.id),
                            result: Some(serde_json::json!({
                                "provider_id": "wrong.untrusted.provider",
                                "protocol_version": "fgos.component.v0",
                            })),
                            error: None,
                        });
                        codec.encode_to_writer(&resp, &mut writer).unwrap();
                        continue;
                    }

                    if let Some(ref params) = req.params {
                        if let Some(proto) = params.get("protocol_version").and_then(|v| v.as_str()) {
                            negotiated_protocol = proto.to_string();
                        }
                    }

                    let resp = FrameMessage::Response(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        id: Some(req.id),
                        result: Some(serde_json::json!({
                            "provider_id": FIXTURE_PROVIDER_ID,
                            "protocol_version": negotiated_protocol,
                            "supported_operations": [
                                {
                                    "operation_id": FIXTURE_OPERATION_ID,
                                    "request_contract": FIXTURE_REQUEST_CONTRACT,
                                    "outcome_contract": FIXTURE_OUTCOME_CONTRACT,
                                }
                            ],
                            "concurrency_limit": 1
                        })),
                        error: None,
                    });
                    codec.encode_to_writer(&resp, &mut writer).unwrap();

                    if args.iter().any(|a| a == "--exit-after-handshake") {
                        // Exit immediately after handshake, before any request is dispatched
                        std::process::exit(0);
                    }
                } else if req.method == "invoke" || req.method == FIXTURE_OPERATION_ID {
                    let params = req.params.clone().unwrap_or(serde_json::Value::Null);
                    let payload = params.get("payload").unwrap_or(&params);

                    // Failure simulation directives in payload
                    let action = payload.get("action").and_then(|a| a.as_str()).unwrap_or("");
                    let crash = payload.get("crash").and_then(|a| a.as_str()).unwrap_or("");
                    if action == "crash_after_dispatch"
                        || crash == "after_dispatch"
                        || crash == "before_response"
                    {
                        // Crashes after dispatch before sending response
                        std::process::exit(101);
                    }

                    if payload.get("malformed_frame").and_then(|m| m.as_bool()) == Some(true)
                        || action == "malformed_frame"
                    {
                        // Write corrupted length-prefixed bytes
                        let bad_bytes = [0x00, 0x00, 0x00, 0x05, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF];
                        writer.write_all(&bad_bytes).unwrap();
                        writer.flush().unwrap();
                        continue;
                    }

                    if action == "flood"
                        || payload.get("flood").and_then(|f| f.as_bool()) == Some(true)
                        || args.iter().any(|a| a == "--flood")
                    {
                        // Emits many/large valid frames to test bounded memory/capture
                        let chunk = "x".repeat(32 * 1024);
                        for i in 0..10_000 {
                            let notif = FrameMessage::notification(
                                "flood_event",
                                Some(serde_json::json!({ "seq": i, "data": &chunk })),
                            );
                            if codec.encode_to_writer(&notif, &mut writer).is_err() {
                                break;
                            }
                        }
                        return Ok(());
                    }

                    if action == "cooperative_cancel"
                        || payload.get("cooperative_cancel").and_then(|c| c.as_bool()) == Some(true)
                    {
                        // Actually read and block on stdin for the cancellation notification
                        eprintln!("fixture echo_process cooperative_cancel: listening on stdin");
                        match codec.decode_from_reader(&mut reader) {
                            Ok(Some(FrameMessage::Notification(notif))) if notif.method == "cancel" => {
                                eprintln!("fixture echo_process received cancellation notification");
                                if let Ok(path) = env::var("CANCEL_SENTINEL_FILE") {
                                    let _ = fs::write(path, "cancelled\n");
                                }
                                std::process::exit(0);
                            }
                            other => {
                                eprintln!("fixture echo_process cooperative_cancel: unexpected frame: {other:?}");
                                std::process::exit(1);
                            }
                        }
                    }

                    if let Some(delay_ms) = payload.get("delay_ms").and_then(|d| d.as_u64()) {
                        std::thread::sleep(Duration::from_millis(delay_ms));
                    }

                    let resp = FrameMessage::Response(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        id: Some(req.id),
                        result: Some(serde_json::json!({
                            "provider_id": FIXTURE_PROVIDER_ID,
                            "operation_id": FIXTURE_OPERATION_ID,
                            "outcome_contract": FIXTURE_OUTCOME_CONTRACT,
                            "protocol_version": negotiated_protocol,
                            "echo": payload
                        })),
                        error: None,
                    });
                    codec.encode_to_writer(&resp, &mut writer).unwrap();
                } else {
                    let resp = FrameMessage::Response(JsonRpcResponse {
                        jsonrpc: "2.0".to_string(),
                        id: Some(req.id),
                        result: None,
                        error: Some(JsonRpcError {
                            code: -32601,
                            message: format!("Method not found: {}", req.method),
                            data: None,
                        }),
                    });
                    codec.encode_to_writer(&resp, &mut writer).unwrap();
                }
            }
            FrameMessage::Notification(notif) => {
                if notif.method == "cancel" {
                    eprintln!("fixture echo_process received cancellation notification");
                    if let Ok(path) = env::var("CANCEL_SENTINEL_FILE") {
                        let _ = fs::write(path, "cancelled\n");
                    }
                    std::thread::sleep(Duration::from_millis(5));
                    std::process::exit(0);
                }
            }
            FrameMessage::Response(_) => {}
        }
    }

    Ok(())
}
