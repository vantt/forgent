//! The controller's cancel registry and signal flow: the cancel request on disk, the refusals after a
//! cancel, the bounded wait and the exit code. Registry state is process-wide, so one test walks it in order.

use fgos_run_supervisor::controller::cancel::*;
use serde_json::Value;
use std::path::PathBuf;

fn vectors() -> Value {
    let path =
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../contracts/controller/cancel.v1.json");
    serde_json::from_slice(&std::fs::read(path).unwrap()).unwrap()
}

fn scratch(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "rs-controller-cancel-{name}-{}",
        std::process::id()
    ));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
fn request_body_has_the_recorded_keys_in_the_recorded_values() {
    let v = vectors();
    let body = cancel_request_body("attempt-1", "SIGINT", serde_json::json!({}), "t", 7);
    let mut keys: Vec<&String> = body.as_object().unwrap().keys().collect();
    let mut want: Vec<String> = v["keys"]
        .as_array()
        .unwrap()
        .iter()
        .map(|k| k.as_str().unwrap().into())
        .collect();
    keys.sort();
    want.sort();
    assert_eq!(keys.into_iter().cloned().collect::<Vec<_>>(), want);
    assert_eq!(body["v"], v["fixed"]["v"]);
    assert_eq!(body["attemptId"], v["fixed"]["attemptId"]);
    assert_eq!(body["by"], v["fixed"]["by"]);
    assert_eq!(
        exit_code_of("SIGINT"),
        Some(v["exitCodes"]["SIGINT"].as_i64().unwrap() as i32)
    );
    assert_eq!(
        exit_code_of("SIGTERM"),
        Some(v["exitCodes"]["SIGTERM"].as_i64().unwrap() as i32)
    );
    assert_eq!(
        RunCancelledError {
            signal: "SIGINT".into()
        }
        .to_string(),
        v["cancelledMessage"].as_str().unwrap()
    );
}

#[test]
fn request_cancel_publishes_once_and_a_run_without_envelope_gets_none() {
    let dir = scratch("request");
    let run = dir.join("run");
    std::fs::create_dir_all(&run).unwrap();
    assert!(
        !request_cancel(&run, "SIGINT"),
        "no envelope, no attempt id, no request"
    );
    std::fs::write(
        run.join("envelope.json"),
        r#"{"attemptId":"attempt-1","unitRunId":"unit-1"}"#,
    )
    .unwrap();
    assert!(request_cancel(&run, "SIGINT"));
    assert!(
        request_cancel(&run, "SIGTERM"),
        "a request already there stands"
    );
    let record: Value =
        serde_json::from_slice(&std::fs::read(run.join("cancel-requested.json")).unwrap()).unwrap();
    assert_eq!(record["by"], "signal:SIGINT");
    assert_eq!(record["attemptId"], "attempt-1");
    assert_eq!(
        record["requestedBy"],
        format!("controller pid {}", std::process::id())
    );
    assert!(record["at"].as_str().unwrap().ends_with('Z'));
    let _ = std::fs::remove_dir_all(dir);
}

#[test]
fn first_signal_asks_every_attempt_waits_bounded_prints_resume_and_exits_with_the_signal_code() {
    let dir = scratch("flow");
    let delivered = dir.join("delivered");
    let launching = dir.join("launching");
    for (d, unit) in [(&delivered, "unit-d"), (&launching, "unit-l")] {
        std::fs::create_dir_all(d).unwrap();
        std::fs::write(
            d.join("envelope.json"),
            format!(r#"{{"attemptId":"a-{unit}","unitRunId":"{unit}"}}"#),
        )
        .unwrap();
    }
    reset_cancel_request();
    assert!(assert_not_cancelled().is_ok());
    register(&delivered);
    begin_launch(&launching).unwrap();
    assert_eq!(registered_runs(), vec![delivered.clone()]);

    let mut code = None;
    let mut err = Vec::new();
    cancel_flow(
        "SIGTERM",
        CancelFlow {
            cancel_wait_ms: 150,
            exit: &mut |c| code = Some(c),
            stderr: &mut err,
        },
    );

    assert_eq!(code, Some(143));
    assert!(delivered.join("cancel-requested.json").exists());
    assert!(
        launching.join("cancel-requested.json").exists(),
        "a launch in progress is asked at once"
    );
    let text = String::from_utf8(err).unwrap();
    assert!(text.contains("unit unit-d chờ resume: fgos run --resume unit-d\n"));
    assert!(text.contains("unit unit-l chờ resume: fgos run --resume unit-l\n"));
    assert_eq!(assert_not_cancelled().unwrap_err().signal, "SIGTERM");
    assert!(begin_launch(&dir).is_err(), "no new launch after a cancel");

    reset_cancel_request();
    end_launch(&launching);
    unregister(&delivered);
    assert!(registered_runs().is_empty());
    assert!(begin_launch(&dir).is_ok());
    end_launch(&dir);
    let _ = std::fs::remove_dir_all(dir);
}
