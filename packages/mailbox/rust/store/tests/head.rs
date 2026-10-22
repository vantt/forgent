//! The stored head against the registering one, through process facts.
//! Every record is a real process's; the judge's own rows belong to the
//! process-facts contract and its tests.
use fgos_mailbox::adapters::{AdapterFacts, TestedClis};
use fgos_mailbox::head::{
    caller_is_head, head_position, head_text, is_complete, judge_stored, Ancestry, NoHead,
};
use fgos_mailbox::hook::Adapter;
use fgos_mailbox_core::{Binding, Liveness, StoredHead};
use fgos_process::facts::{relation_of, self_identity, Record};
use fgos_process::ProcId;
use std::path::PathBuf;

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

/// An ancestry whose parent is `parent`, running `exe` invoked as
/// `argv0`, under `grandparent`.
fn under(parent: Record, exe: &str, argv0: &str, grandparent: Option<Record>) -> Ancestry {
    Ancestry {
        parent,
        parent_relation: relation_of(ProcId(std::process::id())).unwrap(),
        parent_exe: Some(PathBuf::from(exe)),
        parent_argv0: Some(argv0.to_string()),
        grandparent,
    }
}

fn facts(adapter: Adapter) -> AdapterFacts {
    TestedClis::embedded().facts(adapter).unwrap().clone()
}

fn real_sh() -> String {
    std::fs::canonicalize("/bin/sh")
        .unwrap()
        .display()
        .to_string()
}

#[test]
fn the_caller_check_accepts_only_the_same_complete_record_at_the_topologys_head_position() {
    let head = own_record();
    let codex = facts(Adapter::Codex);
    let claude = facts(Adapter::Claude);
    let codex_exe = "/opt/codex/releases/0.161.0/bin/codex";

    assert!(caller_is_head(
        &under(head.clone(), codex_exe, "codex", None),
        &codex,
        &head
    ));
    assert!(caller_is_head(
        &under(Record::default(), &real_sh(), "/bin/sh", Some(head.clone())),
        &claude,
        &head
    ));

    let reused = Record {
        start_time: Some(format!("{}0", head.start_time.clone().unwrap())),
        ..head.clone()
    };
    assert!(
        !caller_is_head(&under(reused, codex_exe, "codex", None), &codex, &head),
        "the same pid with another start time is another process"
    );
    let incomplete = Record {
        start_time: None,
        ..head.clone()
    };
    assert!(
        !caller_is_head(
            &under(incomplete.clone(), codex_exe, "codex", None),
            &codex,
            &incomplete
        ),
        "an incomplete record never stands for a head"
    );
    let other = Record {
        pid: Some(ProcId(head.pid.unwrap().0 + 1)),
        ..head.clone()
    };
    assert!(
        !caller_is_head(&under(other, codex_exe, "codex", None), &codex, &head),
        "a different parent is not the head"
    );
}

#[test]
fn only_the_shell_the_cli_invokes_for_hooks_is_accepted_as_the_hop_and_a_login_zsh_is_refused() {
    let head = own_record();
    let claude = facts(Adapter::Claude);
    assert_eq!(
        claude.hook_shell.as_deref(),
        Some(std::path::Path::new("/bin/sh"))
    );
    let hop = |exe: &str, argv0: &str| under(Record::default(), exe, argv0, Some(head.clone()));

    assert_eq!(
        head_position(&hop(&real_sh(), "/bin/sh"), &claude),
        Ok(&head)
    );
    // A tool's login shell, as Claude Code 2.1.308 starts it.
    assert_eq!(
        head_position(&hop("/usr/bin/zsh", "/usr/bin/zsh"), &claude),
        Err(NoHead::WrongTopology)
    );
    // The same shell program invoked under another path is not what the
    // CLI invokes for hooks.
    assert_eq!(
        head_position(&hop(&real_sh(), "sh"), &claude),
        Err(NoHead::WrongTopology)
    );
    assert_eq!(
        head_position(&hop(&real_sh(), "/usr/bin/zsh"), &claude),
        Err(NoHead::WrongTopology)
    );
    // A program that only calls itself /bin/sh.
    assert_eq!(
        head_position(&hop("/usr/bin/zsh", "/bin/sh"), &claude),
        Err(NoHead::WrongTopology)
    );
    assert_eq!(
        head_position(
            &under(Record::default(), &real_sh(), "/bin/sh", None),
            &claude
        ),
        Err(NoHead::WrongTopology),
        "a hop with no grandparent has no head"
    );
}

#[test]
fn the_hop_shell_is_matched_by_resolved_executable_and_invoked_path_not_by_comm() {
    let head = own_record();
    let mut bash_hooks = facts(Adapter::Claude);
    bash_hooks.hook_shell = Some(PathBuf::from("/bin/bash"));
    let bash = std::fs::canonicalize("/bin/bash")
        .unwrap()
        .display()
        .to_string();
    let hop = |exe: &str, argv0: &str| under(Record::default(), exe, argv0, Some(head.clone()));

    assert_eq!(
        head_position(&hop(&bash, "/bin/bash"), &bash_hooks),
        Ok(&head)
    );
    assert_eq!(
        head_position(&hop(&real_sh(), "/bin/sh"), &bash_hooks),
        Err(NoHead::WrongTopology),
        "the contract's shell is the only one accepted"
    );
}
