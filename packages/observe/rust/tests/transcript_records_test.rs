//! The transcript source on the record contract: usage groups, session activity, and the same totals as the
//! observation path the metrics harness reads.

use fgos_observe::contract::{ObservationSource, RecordSource, Window};
use fgos_observe::record::registry::Registry;
use fgos_observe::record::store::HEALTH_DECLARATION;
use fgos_observe::sources::claude_transcripts::{encode_project_dir, ClaudeTranscriptsSource};
use fgos_observe::sources::transcript_records::{
    ACTIVITY_KIND, TRANSCRIPT_DECLARATION, USAGE_KIND,
};
use std::path::{Path, PathBuf};
use std::sync::Mutex;

/// The source reads `CLAUDE_CONFIG_DIR`, which is process-wide.
static ENV: Mutex<()> = Mutex::new(());

struct Fixture {
    root: PathBuf,
    base: PathBuf,
}

impl Fixture {
    fn new(tag: &str, transcript: &str) -> Self {
        let base =
            std::env::temp_dir().join(format!("transcript_records_{tag}_{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&base);
        let root = base.join("project");
        std::fs::create_dir_all(&root).unwrap();
        let root = root.canonicalize().unwrap();
        let home = base.join("home");
        let dir = home.join("projects").join(encode_project_dir(&root));
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(
            dir.join("s.jsonl"),
            transcript.replace("CWD", root.to_str().unwrap()),
        )
        .unwrap();
        std::env::set_var("CLAUDE_CONFIG_DIR", &home);
        Self { root, base }
    }

    fn sidecar(&self, lines: &str) {
        let dir = self.root.join(".fgos/runtime/session-rotation/head-a");
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("context-sidecar.jsonl"), lines).unwrap();
    }
}

impl Drop for Fixture {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.base);
    }
}

fn line(session: &str, ts: &str, id: &str, model: &str, input: u64, output: u64) -> String {
    format!(
        r#"{{"sessionId":"{session}","cwd":"CWD","timestamp":"{ts}","message":{{"id":"{id}","model":"{model}","usage":{{"input_tokens":{input},"output_tokens":{output},"cache_read_input_tokens":7,"cache_creation_input_tokens":3}}}}}}
"#
    )
}

fn two_models() -> String {
    [
        line(
            "s1",
            "2026-11-01T10:05:00Z",
            "m1",
            "claude-sonnet-5-5",
            100,
            10,
        ),
        line(
            "s1",
            "2026-11-01T10:40:00Z",
            "m2",
            "claude-sonnet-5-5",
            200,
            20,
        ),
        line(
            "s1",
            "2026-11-01T10:50:00Z",
            "m3",
            "claude-haiku-5-5",
            50,
            5,
        ),
        line(
            "s1",
            "2026-11-01T11:10:00Z",
            "m4",
            "claude-haiku-5-5",
            60,
            6,
        ),
    ]
    .concat()
}

fn records_in(
    root: &Path,
    since: Option<&str>,
    until: Option<&str>,
) -> Vec<fgos_observe::record::types::Record> {
    ClaudeTranscriptsSource::new()
        .records(
            root,
            &Window {
                since: since.map(str::to_owned),
                until: until.map(str::to_owned),
            },
        )
        .unwrap()
}

fn records_of(root: &Path, kind: &str) -> Vec<fgos_observe::record::types::Record> {
    ClaudeTranscriptsSource::new()
        .records(root, &Window::default())
        .unwrap()
        .into_iter()
        .filter(|r| r.kind == kind)
        .collect()
}

#[test]
fn a_transcript_with_two_models_gives_one_usage_group_per_model_and_hour() {
    let _g = ENV.lock().unwrap_or_else(|e| e.into_inner());
    let f = Fixture::new("groups", &two_models());
    let usage = records_of(&f.root, USAGE_KIND);
    assert_eq!(usage.len(), 3, "sonnet@10, haiku@10, haiku@11");
    let sonnet: Vec<_> = usage
        .iter()
        .filter(|r| format!("{:?}", r.attrs["gen_ai.request.model"]).contains("sonnet"))
        .collect();
    assert_eq!(sonnet.len(), 1);
    assert_eq!(
        sonnet[0].measures["gen_ai.usage.input_tokens"].as_u64(),
        Some(300)
    );
    assert_eq!(
        sonnet[0].ts, "2026-11-01T10:40:00.000Z",
        "stamped at the latest message"
    );
    assert_eq!(
        sonnet[0].id,
        "session-usage:s1:claude-sonnet-5-5:2026-11-01T10"
    );
    assert_eq!(sonnet[0].subject.id, "s1");
    let registry = Registry::from_embedded(&[TRANSCRIPT_DECLARATION, HEALTH_DECLARATION]).unwrap();
    for r in &usage {
        registry.validate(r).unwrap();
    }
}

#[test]
fn a_sidecar_record_moves_the_activity_instant_past_the_last_transcript_message() {
    let _g = ENV.lock().unwrap_or_else(|e| e.into_inner());
    let f = Fixture::new("activity", &two_models());
    let before = records_of(&f.root, ACTIVITY_KIND);
    assert_eq!(before.len(), 1);
    assert_eq!(before[0].ts, "2026-11-01T11:10:00.000Z");
    f.sidecar(
        "{\"ts\":\"2026-11-01T12:00:00Z\",\"session_id\":\"s1\"}\n{\"ts\":1793534400000,\"session_id\":\"s9\"}\n",
    );
    let after = records_of(&f.root, ACTIVITY_KIND);
    let s1 = after.iter().find(|r| r.subject.id == "s1").unwrap();
    assert_eq!(s1.ts, "2026-11-01T12:00:00.000Z");
    assert!(
        after.iter().any(|r| r.subject.id == "s9"),
        "a sidecar-only session is active too"
    );
    let registry = Registry::from_embedded(&[TRANSCRIPT_DECLARATION, HEALTH_DECLARATION]).unwrap();
    for r in &after {
        registry.validate(r).unwrap();
    }
}

#[test]
fn harness_token_totals_equal_the_usage_record_totals() {
    let _g = ENV.lock().unwrap_or_else(|e| e.into_inner());
    let f = Fixture::new("totals", &two_models());
    let obs = ClaudeTranscriptsSource::new()
        .observations(&f.root, &Window::default())
        .unwrap();
    let obs_sum = |key: &str| -> u64 { obs.iter().map(|o| o.attrs[key].as_u64().unwrap()).sum() };
    let usage = records_of(&f.root, USAGE_KIND);
    let rec_sum = |name: &str| -> u64 {
        usage
            .iter()
            .map(|r| r.measures[name].as_u64().unwrap())
            .sum()
    };
    assert_eq!(obs.len(), 4);
    assert_eq!(
        obs_sum("input_tokens"),
        rec_sum("gen_ai.usage.input_tokens")
    );
    assert_eq!(
        obs_sum("output_tokens"),
        rec_sum("gen_ai.usage.output_tokens")
    );
    assert_eq!(
        obs_sum("cache_read"),
        rec_sum("gen_ai.usage.cache_read.input_tokens")
    );
    assert_eq!(
        obs_sum("cache_creation"),
        rec_sum("gen_ai.usage.cache_creation.input_tokens")
    );
}

#[test]
fn a_mid_hour_since_returns_the_whole_bucket_and_the_same_record_as_any_other_window() {
    let _g = ENV.lock().unwrap_or_else(|e| e.into_inner());
    let f = Fixture::new("midhour", &two_models());
    let usage_10 = |recs: Vec<fgos_observe::record::types::Record>| {
        recs.into_iter()
            .find(|r| r.id == "session-usage:s1:claude-sonnet-5-5:2026-11-01T10")
            .expect("the 10h sonnet bucket")
    };
    let mid = usage_10(records_in(&f.root, Some("2026-11-01T10:20:00Z"), None));
    assert_eq!(
        mid.measures["gen_ai.usage.input_tokens"].as_u64(),
        Some(300)
    );
    let other = usage_10(records_in(
        &f.root,
        Some("2026-11-01T10:30:00Z"),
        Some("2026-11-01T10:45:00Z"),
    ));
    let all = usage_10(records_in(&f.root, None, None));
    assert_eq!(mid, other);
    assert_eq!(mid, all);
}

#[test]
fn a_utc_plus_seven_timestamp_lands_in_its_utc_hour() {
    let _g = ENV.lock().unwrap_or_else(|e| e.into_inner());
    // 06:30+07:00 is 23:30Z of the previous day.
    let f = Fixture::new(
        "offset",
        &line(
            "s1",
            "2026-11-02T06:30:00+07:00",
            "m1",
            "claude-sonnet-5-5",
            5,
            1,
        ),
    );
    let usage = records_of(&f.root, USAGE_KIND);
    assert_eq!(usage.len(), 1);
    assert_eq!(
        usage[0].id,
        "session-usage:s1:claude-sonnet-5-5:2026-11-01T23"
    );
    assert_eq!(usage[0].ts, "2026-11-01T23:30:00.000Z");
}

#[test]
fn activity_moves_on_a_transcript_line_without_usage() {
    let _g = ENV.lock().unwrap_or_else(|e| e.into_inner());
    let transcript = format!(
        "{}{}",
        line(
            "s1",
            "2026-11-01T10:05:00Z",
            "m1",
            "claude-sonnet-5-5",
            1,
            1
        ),
        r#"{"sessionId":"s1","cwd":"CWD","timestamp":"2026-11-01T13:00:00Z","type":"user","message":{"role":"user","content":"hi"}}
"#
    );
    let f = Fixture::new("prompt", &transcript);
    let activity = records_of(&f.root, ACTIVITY_KIND);
    assert_eq!(activity.len(), 1);
    assert_eq!(activity[0].ts, "2026-11-01T13:00:00.000Z");
    let windowed = records_in(&f.root, None, Some("2026-11-01T12:00:00Z"));
    let a = windowed.iter().find(|r| r.kind == ACTIVITY_KIND).unwrap();
    assert_eq!(a.ts, "2026-11-01T10:05:00.000Z");
}
