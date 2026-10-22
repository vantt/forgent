//! The `send` and read-only `inbox` verbs over a real record.
#![cfg(unix)]
mod common;

use common::limits;
use common::record::{key, name_of, register, send_req, TempFgos, T0};
use fgos_mailbox::record::{Reported, Wait};
use fgos_mailbox::verbs::{inbox, send};

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
