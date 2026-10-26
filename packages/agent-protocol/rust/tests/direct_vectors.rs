use std::fs;
use std::path::{Path, PathBuf};

use fgos_agent_protocol::direct::{adapter_for, newest_result};
use fgos_agent_protocol::{Activity, BlockedReason, ExitInfo, Outcome};
use serde_json::Value;

const CLIS: [&str; 5] = ["claude", "codex", "agy", "pi", "omp"];

fn fixture_dir(cli: &str) -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../contracts/fixtures/direct")
        .join(cli)
}

fn expected(expect: &Value, outbox: &Path) -> Outcome {
    match expect["kind"].as_str().unwrap() {
        "completed" => Outcome::Completed {
            result_path: outbox.join(expect["resultFile"].as_str().unwrap()),
        },
        "exited" => Outcome::Exited {
            code: expect["code"].as_i64().map(|c| c as i32),
        },
        "blocked" => Outcome::Blocked(match expect["reason"].as_str().unwrap() {
            "login" => BlockedReason::Login,
            "usage-limit" => BlockedReason::UsageLimit,
            other => panic!("unknown reason {other}"),
        }),
        other => panic!("unknown kind {other}"),
    }
}

#[test]
fn every_cli_vector_classifies_as_recorded() {
    let outbox = Path::new("/run/outbox");
    for cli in CLIS {
        let doc: Value = serde_json::from_str(
            &fs::read_to_string(fixture_dir(cli).join("vectors.json")).unwrap(),
        )
        .unwrap();
        let adapter = adapter_for(cli);
        assert_eq!(adapter.cli(), cli);
        let vectors = doc["vectors"].as_array().unwrap();
        assert!(vectors.len() >= 5, "{cli} has too few vectors");
        for vector in vectors {
            let result = vector["resultFile"].as_str().map(|name| outbox.join(name));
            let exit = ExitInfo {
                code: vector["exitCode"].as_i64().map(|c| c as i32),
            };
            let got = adapter.classify(
                exit,
                vector["captureTail"].as_str().unwrap(),
                result.as_deref(),
            );
            assert_eq!(
                got,
                expected(&vector["expect"], outbox),
                "{cli}: {}",
                vector["name"]
            );
        }
    }
}

#[test]
fn unknown_cli_gets_exit_and_outbox_only() {
    let adapter = adapter_for("some-other-cli");
    assert_eq!(adapter.cli(), "generic");
    let login = "No API key found for openrouter.\n";
    assert_eq!(
        adapter.classify(ExitInfo { code: Some(1) }, login, None),
        Outcome::Exited { code: Some(1) }
    );
    let done = Path::new("/run/outbox/result-1.json");
    assert_eq!(
        adapter.classify(ExitInfo { code: Some(0) }, "", Some(done)),
        Outcome::Completed {
            result_path: done.to_path_buf()
        }
    );
}

#[test]
fn cli_name_is_matched_case_insensitively() {
    assert_eq!(adapter_for(" Claude ").cli(), "claude");
}

#[test]
fn newest_result_takes_the_highest_number() {
    let outbox = Path::new("/run/outbox");
    let names = [
        "result-2.json",
        "result-10.json",
        "result-x.json",
        "agent-1.json",
        "result-3.json.tmp",
        "result-+99.json",
    ];
    assert_eq!(
        newest_result(outbox, names),
        Some(outbox.join("result-10.json"))
    );
    assert_eq!(newest_result(outbox, ["agent-1.json"]), None);
    assert_eq!(newest_result(outbox, ["result-007.json", "result-00.json"]), None, "leading zeros are not issued names");
    assert_eq!(newest_result(outbox, ["result-0.json"]), Some(outbox.join("result-0.json")));
}

#[test]
fn activity_counts_growth() {
    let adapter = adapter_for("pi");
    assert_eq!(adapter.activity_from(""), Activity::Quiet);
    assert_eq!(adapter.activity_from("  \n\n"), Activity::Quiet);
    assert_eq!(adapter.activity_from("compiling...\n"), Activity::Output);
    assert_eq!(adapter.activity_from("{\"type\":\"message_end\"}\n"), Activity::Output);
    assert!(Activity::Output.is_active() && !Activity::Quiet.is_active());
}

#[test]
fn later_api_key_wording_on_a_line_still_blocks() {
    let adapter = adapter_for("claude");
    let tail = "the api key you gave is wrong; api key invalid\n";
    assert_eq!(
        adapter.classify(ExitInfo { code: Some(1) }, tail, None),
        Outcome::Blocked(BlockedReason::Login)
    );
}
