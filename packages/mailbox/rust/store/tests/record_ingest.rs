#![cfg(unix)]
//! `Record::ingest`: verified mail from other machines is saved with its
//! body and the ingest cursor in one write, and a replay after the record is
//! read again from disk is still a duplicate.
mod common;

use common::limits;
use common::record::{key, name_of, read_state, register, TempFgos, T0};
use fgos_mailbox::record::{Reported, Wait};
use fgos_mailbox_core::{Ingested, RemoteMail};
use std::collections::BTreeMap;

fn mail<'a>(
    from: &'a fgos_mailbox_core::WriterKey,
    id: &'a str,
    to: &'a fgos_mailbox_core::WriterKey,
    body: &'a str,
) -> RemoteMail<'a> {
    RemoteMail {
        machine: "peer",
        id,
        from,
        handle: Some("claude-ab12@peer"),
        to,
        body,
        max_body_bytes: 2048,
    }
}

#[test]
fn ingested_mail_is_saved_with_its_body_and_cursor_and_a_replay_after_a_reread_is_a_duplicate() {
    let fgos = TempFgos::new("record-ingest");
    let record = fgos.record();
    let held = record
        .hold(Wait::Try, T0, &limits(), |state, ids| {
            Reported::changing(register(state, "head-b", T0, &limits(), ids))
        })
        .unwrap();
    let _ = name_of(&held.value.value);
    let (from, to) = (key("sender-1"), key("head-b"));
    let mut cursor = BTreeMap::new();
    cursor.insert("origin-a".to_string(), 7u64);

    let held = record
        .ingest(
            &[mail(&from, "m1", &to, "hello remote")],
            &[],
            &cursor,
            Wait::Try,
            T0,
            &limits(),
        )
        .unwrap();
    assert!(held.wrote);
    let Ok(Ingested::Recorded(id)) = &held.value.value[0] else {
        panic!("{:?}", held.value.value)
    };

    let state = read_state(&record);
    assert_eq!(state.remote_cursor().get("origin-a"), Some(&7));
    assert!(state.remote_baselined());
    let header = state.message(id).unwrap();
    assert_eq!(
        record.body(id, header.body_bytes, &limits()).as_deref(),
        Some("hello remote")
    );

    let again = record
        .ingest(
            &[mail(&from, "m1", &to, "hello remote")],
            &[],
            &cursor,
            Wait::Try,
            T0,
            &limits(),
        )
        .unwrap();
    assert_eq!(again.value.value, vec![Ok(Ingested::Duplicate)]);
    assert_eq!(read_state(&record).messages().count(), 1);
}
