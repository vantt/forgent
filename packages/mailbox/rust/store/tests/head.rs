//! The stored head against the registering one, through process facts.
//! Every record is a real process's; the judge's own rows belong to the
//! process-facts contract and its tests.
use fgos_mailbox::head::{head_text, is_complete, judge_stored};
use fgos_mailbox_core::{Binding, Liveness, StoredHead};
use fgos_process::facts::{self_identity, Record};

fn own_record() -> Record {
    self_identity()
        .expect("this process can read its own identity")
        .to_record()
}

/// A binding as the store holds it, whose head is `head`.
fn binding_with_head(head: String) -> Binding {
    let binding = serde_json::json!({
        "key": "k",
        "name": "forgent-claude-2b",
        "cli": "claude",
        "generation": 1,
        "head": head,
        "handle": null,
        "registered_at": 0,
        "last_seen": 0,
        "last_drain_at": null,
        "stop_blocks": 0
    });
    serde_json::from_value(binding).expect("a binding in the snapshot shape")
}

#[test]
fn the_running_head_is_the_same_head_after_a_text_round_trip() {
    let own = own_record();
    let text = head_text(&own);
    let back = Record::from_json(&serde_json::from_str(&text).unwrap());
    assert_eq!(back, own, "the record survives the binding's opaque text");

    let judged = judge_stored(&binding_with_head(text), &own);

    assert_eq!(
        judged,
        StoredHead {
            same_head: true,
            liveness: Liveness::Alive
        }
    );
}

#[test]
fn an_unreadable_or_incomplete_head_is_never_the_same_head() {
    let own = own_record();
    let unreadable = judge_stored(&binding_with_head("not json".to_string()), &own);
    assert_eq!(
        unreadable,
        StoredHead {
            same_head: false,
            liveness: Liveness::Unknown
        }
    );

    let empty = Record::default();
    assert!(!is_complete(&empty));
    let defaults = judge_stored(&binding_with_head(head_text(&empty)), &empty);
    assert!(!defaults.same_head, "two default records must not match");

    let mut no_start = own.clone();
    no_start.start_time = None;
    assert!(!is_complete(&no_start));
    let partial = judge_stored(&binding_with_head(head_text(&no_start)), &no_start);
    assert!(
        !partial.same_head,
        "a record without a start time is no head"
    );
}

#[test]
fn a_head_whose_record_loses_a_field_in_its_text_form_is_still_the_same_head() {
    for boot_id in ["", "unknown-boot"] {
        let mut own = own_record();
        own.boot_id = Some(boot_id.to_string());
        assert_ne!(
            Record::from_json(&serde_json::from_str(&head_text(&own)).unwrap()),
            own,
            "the text form drops the {boot_id:?} boot id"
        );

        let judged = judge_stored(&binding_with_head(head_text(&own)), &own);

        assert!(judged.same_head, "boot id {boot_id:?}");
    }
}
