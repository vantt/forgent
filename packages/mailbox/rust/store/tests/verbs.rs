//! The `send` and read-only `inbox` verbs over a real record.
#![cfg(unix)]
mod common;

use common::limits;
use common::record::{key, name_of, register, send_req, TempFgos, T0};
use fgos_mailbox::adapters::version::VersionSources;
use fgos_mailbox::record::{Reported, Wait};
use fgos_mailbox::verbs::{inbox, inbox_claim, send};
use fgos_mailbox_core::record_error_text;

/// Version sources that read nothing: no Claude config directory and a
/// Codex program that does not exist.
fn no_versions() -> VersionSources {
    VersionSources {
        claude_sessions: None,
        codex_program: "/nonexistent/codex".into(),
        max_read_bytes: common::hook_limits().hook.max_read_bytes,
    }
}

/// A record holding one registered head; returns its name.
fn with_head(fgos: &TempFgos, writer: &str) -> String {
    let record = fgos.record();
    let held = record
        .hold(Wait::Try, T0, &limits(), |state, ids| {
            Reported::changing(register(state, writer, T0, &limits(), ids))
        })
        .unwrap();
    name_of(&held.value.value)
}

#[test]
fn send_records_the_message_and_answers_with_the_delivery_report() {
    let fgos = TempFgos::new("verb-send");
    let name = with_head(&fgos, "head-a");

    let answer = send(
        &fgos.record(),
        send_req("sender-x", &name, "hi"),
        Wait::Try,
        T0,
        &limits(),
        &no_versions(),
    );

    assert!(answer.recorded);
    let lines: Vec<&str> = answer.text.lines().collect();
    assert!(lines[0].starts_with("recorded ") && lines[0].ends_with(&format!(" for {name}")));
    assert_eq!(lines[1], "queued: it sees it at its next tool call.");
    let pending = inbox(&fgos.record(), &key("head-a"), Wait::Try, T0, &limits()).unwrap();
    assert_eq!(pending.lines().count(), 1);
}

#[test]
fn a_refused_send_records_no_message_and_answers_with_the_refusal_text() {
    let fgos = TempFgos::new("verb-refused");
    let name = with_head(&fgos, "head-a");

    let answer = send(
        &fgos.record(),
        send_req("head-a", &name, "me"),
        Wait::Try,
        T0,
        &limits(),
        &no_versions(),
    );

    assert!(!answer.recorded);
    assert_eq!(answer.text, "Refused: self.");
    assert_eq!(
        inbox(&fgos.record(), &key("head-a"), Wait::Try, T0, &limits()).unwrap(),
        "No pending mail."
    );
}

#[test]
fn inbox_lists_pending_mail_with_its_state_and_never_writes_the_snapshot() {
    let fgos = TempFgos::new("verb-inbox");
    let name = with_head(&fgos, "head-a");
    let sent = send(
        &fgos.record(),
        send_req("sender-x", &name, "hi"),
        Wait::Try,
        T0,
        &limits(),
        &no_versions(),
    );
    assert!(sent.recorded);
    let snapshot = fgos.paths().snapshot();
    let bytes = std::fs::read(&snapshot).unwrap();
    let mtime = std::fs::metadata(&snapshot).unwrap().modified().unwrap();

    let listed = inbox(&fgos.record(), &key("head-a"), Wait::Try, T0, &limits()).unwrap();

    let line = listed.lines().next().unwrap();
    assert!(
        line.contains(" message from=") && line.ends_with(" state=recorded offers=0"),
        "{line}"
    );
    assert_eq!(std::fs::read(&snapshot).unwrap(), bytes);
    assert_eq!(
        std::fs::metadata(&snapshot).unwrap().modified().unwrap(),
        mtime
    );
    assert_eq!(
        inbox(&fgos.record(), &key("no-binding"), Wait::Try, T0, &limits()).unwrap(),
        "This session has no mailbox address yet; it gets one at its first hook."
    );
}

#[test]
fn a_send_and_an_inbox_whose_record_failed_answer_with_the_record_error_text() {
    let fgos = TempFgos::new("verb-record-error");
    let name = with_head(&fgos, "head-a");
    let snapshot = fgos.paths().snapshot();
    let mut value: serde_json::Value =
        serde_json::from_slice(&std::fs::read(&snapshot).unwrap()).unwrap();
    value["schema_version"] = 2.into();
    std::fs::write(&snapshot, serde_json::to_vec(&value).unwrap()).unwrap();
    let expected = record_error_text("snapshot-newer");

    let answer = send(
        &fgos.record(),
        send_req("sender-x", &name, "hi"),
        Wait::Try,
        T0,
        &limits(),
        &no_versions(),
    );
    assert!(!answer.recorded);
    assert_eq!(answer.text, expected);
    assert_eq!(
        inbox(&fgos.record(), &key("head-a"), Wait::Try, T0, &limits()),
        Err(expected)
    );
}

/// Registers a head of `cli` whose process record is `head`; its name.
fn with_cli_head(fgos: &TempFgos, writer: &str, cli: &str, head: &str) -> String {
    let record = fgos.record();
    let held = record
        .hold(Wait::Try, T0, &limits(), |state, ids| {
            let req = fgos_mailbox_core::RegisterRequest {
                key: key(writer),
                cli: fgos_mailbox_core::Cli::new(cli).unwrap(),
                project: "forgent".to_string(),
                own_suffix: None,
                head: head.to_string(),
                handle: None,
            };
            Reported::changing(state.register(req, None, T0, &limits(), ids).unwrap())
        })
        .unwrap();
    name_of(&held.value.value)
}

/// A child process standing in for a recipient's head; killed on drop.
struct Child(std::process::Child);

impl Drop for Child {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

impl Child {
    fn spawn() -> Self {
        Self(
            std::process::Command::new("sleep")
                .arg("60")
                .spawn()
                .unwrap(),
        )
    }

    fn head_text(&self) -> String {
        let record = fgos_process::facts::identity_of(fgos_process::ProcId(self.0.id()))
            .unwrap()
            .to_record();
        fgos_mailbox::head::head_text(&record)
    }
}

/// An executable script in `dir` that prints `line` (after `delay`
/// seconds) for `--version`.
fn codex_program(dir: &std::path::Path, line: &str, delay: u32) -> std::path::PathBuf {
    use std::os::unix::fs::PermissionsExt;
    let path = dir.join(format!("codex-{delay}"));
    std::fs::write(&path, format!("#!/bin/sh\nsleep {delay}\necho '{line}'\n")).unwrap();
    std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o755)).unwrap();
    path
}

fn report_of(fgos: &TempFgos, to: &str, versions: &VersionSources) -> Vec<String> {
    let answer = send(
        &fgos.record(),
        send_req("sender-x", to, "hi"),
        Wait::Try,
        T0,
        &limits(),
        versions,
    );
    assert!(answer.recorded, "{}", answer.text);
    answer.text.lines().map(String::from).collect()
}

#[test]
fn send_adds_the_untested_version_clause_from_the_recipients_version() {
    let fgos = TempFgos::new("verb-version-untested");
    let head = Child::spawn();
    let name = with_cli_head(&fgos, "head-a", "claude", &head.head_text());
    let sessions = fgos.scratch().join("sessions");
    std::fs::create_dir_all(&sessions).unwrap();
    let pid = head.0.id();
    let session = |version: &str| {
        std::fs::write(
            sessions.join(format!("{pid}.json")),
            format!(r#"{{"pid":{pid},"sessionId":"s","version":"{version}"}}"#),
        )
        .unwrap();
    };
    let versions = VersionSources {
        claude_sessions: Some(sessions.clone()),
        ..no_versions()
    };

    session("9.9.9");
    let lines = report_of(&fgos, &name, &versions);
    assert_eq!(lines.len(), 3);
    assert!(lines[2].contains("9.9.9 is not one"), "{}", lines[2]);

    let contract: serde_json::Value = serde_json::from_str(
        &std::fs::read_to_string(common::contracts_dir().join(common::ADAPTERS_CONTRACT)).unwrap(),
    )
    .unwrap();
    let listed: Vec<&str> = contract["testedAgainst"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|entry| entry["cli"] == "claude")
        .map(|entry| entry["version"].as_str().unwrap())
        .collect();
    assert!(listed.contains(&"2.1.309"), "{listed:?}");
    for version in listed {
        session(version);
        assert_eq!(
            report_of(&fgos, &name, &versions).len(),
            2,
            "tested version {version} adds nothing"
        );
    }

    let codex_name = with_cli_head(&fgos, "head-b", "codex", "{}");
    let codex = VersionSources {
        codex_program: codex_program(&fgos.scratch(), "codex-cli 0.999.0", 0),
        ..no_versions()
    };
    assert!(report_of(&fgos, &codex_name, &codex)[2].contains("0.999.0 is not one"));
    let tested = VersionSources {
        codex_program: codex_program(&fgos.scratch().join(".."), "codex-cli 0.161.0", 0),
        ..no_versions()
    };
    assert_eq!(report_of(&fgos, &codex_name, &tested).len(), 2);
}

#[test]
fn send_adds_the_unknown_version_clause_when_no_version_can_be_read() {
    let fgos = TempFgos::new("verb-version-unknown");
    let head = Child::spawn();
    let name = with_cli_head(&fgos, "head-a", "claude", &head.head_text());
    let unknown = "Its CLI version could not be read; the hook still delivers, but nothing beyond that is verified.";

    // No Claude config directory known, and a session file of another pid.
    assert_eq!(report_of(&fgos, &name, &no_versions())[2], unknown);
    let sessions = fgos.scratch().join("sessions");
    std::fs::create_dir_all(&sessions).unwrap();
    std::fs::write(
        sessions.join(format!("{}.json", head.0.id())),
        r#"{"pid":1,"version":"2.1.308"}"#,
    )
    .unwrap();
    let versions = VersionSources {
        claude_sessions: Some(sessions),
        ..no_versions()
    };
    assert_eq!(report_of(&fgos, &name, &versions)[2], unknown);

    // A Codex program that answers too late is given up on, and so is one
    // that prints something else.
    let codex_name = with_cli_head(&fgos, "head-b", "codex", "{}");
    let slow = VersionSources {
        codex_program: codex_program(&fgos.scratch(), "codex-cli 0.161.0", 5),
        ..no_versions()
    };
    let started = std::time::Instant::now();
    assert_eq!(report_of(&fgos, &codex_name, &slow)[2], unknown);
    assert!(
        started.elapsed() < std::time::Duration::from_secs(4),
        "{:?}",
        started.elapsed()
    );
    let odd = VersionSources {
        codex_program: codex_program(&fgos.scratch(), "something else", 0),
        ..no_versions()
    };
    assert_eq!(report_of(&fgos, &codex_name, &odd)[2], unknown);
}

#[test]
fn inbox_claim_claims_emits_and_finishes_like_a_drain_and_a_failed_write_never_finishes() {
    let fgos = TempFgos::new("verb-inbox-claim");
    let name = with_head(&fgos, "head-a");
    let first = send(
        &fgos.record(),
        send_req("sender-x", &name, "first"),
        Wait::Try,
        T0,
        &limits(),
        &no_versions(),
    );
    let second = send(
        &fgos.record(),
        send_req("sender-x", &name, "second"),
        Wait::Try,
        T0,
        &limits(),
        &no_versions(),
    );
    assert!(first.recorded && second.recorded);
    let clock = || T0;

    // A failed write: the claim stays in flight, never finished.
    struct Broken;
    impl std::io::Write for Broken {
        fn write(&mut self, _: &[u8]) -> std::io::Result<usize> {
            Err(std::io::Error::other("closed"))
        }
        fn flush(&mut self) -> std::io::Result<()> {
            Ok(())
        }
    }
    let failed = inbox_claim(
        &fgos.record(),
        &key("head-a"),
        Wait::Try,
        &clock,
        &limits(),
        &|_, _, _| None,
        &mut Broken,
    )
    .unwrap();
    assert_eq!(failed.claimed.len(), 2);
    assert!(!failed.written && !failed.finished);
    let listed = inbox(&fgos.record(), &key("head-a"), Wait::Try, T0, &limits()).unwrap();
    assert!(
        listed.lines().all(|l| l.contains("state=in-flight")),
        "{listed}"
    );

    // After the in-flight deadline the same items are claimed again and finished.
    let later = T0.plus_secs(limits().in_flight_ttl_sec + 1);
    let clock = move || later;
    let mut out = Vec::new();
    let done = inbox_claim(
        &fgos.record(),
        &key("head-a"),
        Wait::Try,
        &clock,
        &limits(),
        &|_, _, _| None,
        &mut out,
    )
    .unwrap();
    let text = String::from_utf8(out).unwrap();
    assert_eq!(done.claimed, failed.claimed);
    assert!(done.written && done.finished);
    assert!(text.contains("| first") && text.contains("| second") && text.ends_with('\n'));
    assert!(text.contains(r#"attempt="2""#), "{text}");
    assert_eq!(
        inbox(&fgos.record(), &key("head-a"), Wait::Try, later, &limits()).unwrap(),
        "No pending mail."
    );
    let mut out = Vec::new();
    inbox_claim(
        &fgos.record(),
        &key("head-a"),
        Wait::Try,
        &clock,
        &limits(),
        &|_, _, _| None,
        &mut out,
    )
    .unwrap();
    assert_eq!(String::from_utf8(out).unwrap(), "No pending mail.\n");
}

#[test]
fn inbox_claim_after_a_pointer_line_offers_every_pending_message_once() {
    let fgos = TempFgos::new("verb-inbox-after-pointer");
    let name = with_head(&fgos, "head-a");
    for body in ["first", "second", "third"] {
        assert!(
            send(
                &fgos.record(),
                send_req("sender-x", &name, body),
                Wait::Try,
                T0,
                &limits(),
                &no_versions(),
            )
            .recorded
        );
    }
    // The pointer a pointer-mode hook prints: it names the count and claims nothing.
    let pointed = fgos
        .record()
        .hold(Wait::Try, T0, &limits(), |state, ids| {
            let generation = state.binding(&key("head-a")).unwrap().generation;
            let pointed = state.point(&key("head-a"), generation, T0, &limits(), ids);
            Reported {
                value: pointed,
                changed: pointed.changed,
            }
        })
        .unwrap()
        .value
        .value;
    assert_eq!(pointed.count, 3);

    let clock = || T0;
    let mut out = Vec::new();
    let done = inbox_claim(
        &fgos.record(),
        &key("head-a"),
        Wait::Try,
        &clock,
        &limits(),
        &|_, _, _| None,
        &mut out,
    )
    .unwrap();
    let text = String::from_utf8(out).unwrap();
    assert_eq!(done.claimed.len(), 3);
    assert!(done.written && done.finished);
    for body in ["first", "second", "third"] {
        assert_eq!(text.matches(&format!("| {body}")).count(), 1, "{text}");
    }
    assert_eq!(text.matches(r#"attempt="1""#).count(), 3, "{text}");
    let mut again = Vec::new();
    inbox_claim(
        &fgos.record(),
        &key("head-a"),
        Wait::Try,
        &clock,
        &limits(),
        &|_, _, _| None,
        &mut again,
    )
    .unwrap();
    assert_eq!(String::from_utf8(again).unwrap(), "No pending mail.\n");
}

#[test]
fn inbox_claim_of_an_unregistered_caller_answers_no_address() {
    let fgos = TempFgos::new("verb-inbox-claim-none");
    let runner = fgos_identity::mint_attempt_writer_id("asgn-1").unwrap();
    with_head(&fgos, &runner);
    let clock = || T0;
    let no_address = "This session has no mailbox address yet; it gets one at its first hook.\n";
    for caller in ["no-binding", runner.as_str()] {
        let mut out = Vec::new();
        let answer = inbox_claim(
            &fgos.record(),
            &key(caller),
            Wait::Try,
            &clock,
            &limits(),
            &|_, _, _| None,
            &mut out,
        )
        .unwrap();
        assert_eq!(String::from_utf8(out).unwrap(), no_address, "{caller}");
        assert!(answer.claimed.is_empty() && answer.written);
    }
}

#[test]
fn heads_lists_every_head_not_judged_dead_with_its_name_cli_and_liveness_and_writes_nothing() {
    use fgos_mailbox::verbs::heads;
    use fgos_mailbox_core::Liveness;
    let fgos = TempFgos::new("verb-heads");
    let live = Child::spawn();
    let live_name = with_cli_head(&fgos, "head-live", "codex", &live.head_text());
    let dead = Child::spawn();
    with_cli_head(&fgos, "head-dead", "claude", &dead.head_text());
    drop(dead);
    let unknown_name = with_cli_head(&fgos, "head-unknown", "claude", "not a process record");
    let before = std::fs::read(fgos.paths().snapshot()).unwrap();

    let listed = heads(&fgos.fgos_dir(), &limits()).unwrap();

    let rows: Vec<(String, String, String, Liveness)> = listed
        .iter()
        .map(|h| {
            (
                h.key.as_str().to_string(),
                h.name.as_str().to_string(),
                h.cli.as_str().to_string(),
                h.liveness,
            )
        })
        .collect();
    assert_eq!(
        rows,
        vec![
            (
                "head-live".to_string(),
                live_name,
                "codex".to_string(),
                Liveness::Alive
            ),
            (
                "head-unknown".to_string(),
                unknown_name,
                "claude".to_string(),
                Liveness::Unknown
            ),
        ]
    );
    assert_eq!(std::fs::read(fgos.paths().snapshot()).unwrap(), before);
}

#[test]
fn heads_never_lists_a_runner_attempt_key() {
    use fgos_mailbox::verbs::heads;
    let fgos = TempFgos::new("verb-heads-runner");
    let live = Child::spawn();
    with_cli_head(&fgos, "att-0123456789abcdef", "claude", &live.head_text());

    assert!(heads(&fgos.fgos_dir(), &limits()).unwrap().is_empty());
}

#[test]
fn status_reports_each_signal_from_a_record_seeded_through_the_stores_own_holds_and_creates_nothing(
) {
    use fgos_mailbox::verbs::status;
    use fgos_mailbox_core::{Checkpoint, Timestamp};
    let at = |secs: u64| Timestamp::from_millis(T0.as_millis() + secs * 1000);
    let fgos = TempFgos::new("verb-status");

    let none = status(&fgos.fgos_dir(), T0, &limits());
    assert_eq!(none.json["record"], "none");
    assert!(none.record_ok);
    assert!(
        !fgos.fgos_dir().join("runtime").exists(),
        "status created nothing"
    );

    let name = with_head(&fgos, "head-a");
    // A runner attempt's binding and a dead head are not heads, for status
    // as for list.
    let gone = Child::spawn();
    with_cli_head(&fgos, "head-dead", "claude", &gone.head_text());
    drop(gone);
    let live = Child::spawn();
    with_cli_head(&fgos, "att-0123456789abcdef", "claude", &live.head_text());
    let record = fgos.record();
    for (secs, body) in [(0, "one"), (0, "two")] {
        record
            .send(
                send_req("sender-x", &name, body),
                Wait::Try,
                at(secs),
                &limits(),
            )
            .unwrap();
    }
    record
        .hold(Wait::Try, at(5), &limits(), |state, ids| {
            let generation = state.binding(&key("head-a")).unwrap().generation;
            let claim = state.claim(
                &key("head-a"),
                generation,
                Checkpoint::Step,
                at(5),
                &limits(),
                ids,
            );
            state.finish(&key("head-a"), generation, &claim.token.unwrap(), at(5));
            Reported::changing(())
        })
        .unwrap();
    record
        .send(
            send_req("sender-x", &name, "three"),
            Wait::Try,
            at(10),
            &limits(),
        )
        .unwrap();
    record
        .send(
            send_req("sender-x", "nobody", "lost"),
            Wait::Try,
            at(11),
            &limits(),
        )
        .unwrap();
    let before = std::fs::read(fgos.paths().snapshot()).unwrap();

    let answer = status(&fgos.fgos_dir(), at(60), &limits());

    let json = &answer.json;
    assert_eq!(json["record"], "ok");
    assert_eq!(json["recordBytes"], before.len() as u64);
    assert_eq!(json["heads"], 1);
    let s = &json["signals"];
    assert_eq!(
        s["offerLatencyMs"],
        serde_json::json!({ "n": 2, "p50": 5000, "p95": 5000, "max": 5000 })
    );
    assert_eq!(s["refusals"], serde_json::json!({ "unknown-name": 1 }));
    assert_eq!(s["offers"], serde_json::json!({ "max": 1, "repeated": 0 }));
    assert_eq!(
        s["queue"],
        serde_json::json!({ "pending": 1, "oldestAgeMs": 50_000 })
    );
    assert_eq!(
        s["undrained"],
        serde_json::json!([{ "name": name, "pending": 1, "lastDrainAgeMs": 55_000 }])
    );
    assert_eq!(
        s["offeredUnanswered"],
        serde_json::json!({ "offered": 2, "unanswered": 2 })
    );
    assert_eq!(json["hookOutcome"], serde_json::Value::Null);
    assert!(
        answer.text.contains("offered and never answered: 2 of 2"),
        "{}",
        answer.text
    );
    assert_eq!(
        std::fs::read(fgos.paths().snapshot()).unwrap(),
        before,
        "status wrote nothing"
    );
}
