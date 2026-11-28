//! Typed-channel selection and send-path reporting, not terminal classification (typed_wake owns it).
#![cfg(target_os = "linux")]
mod common;
use common::{
    limits,
    record::{key, name_of, send_req, TempFgos, T0},
};
use fgos_mailbox::{
    adapters::{version::VersionSources, NudgeChannel, TestedClis},
    nudge::Nudge,
    record::{Reported, Wait},
    verbs::send,
};
use fgos_mailbox_core::{Cli, RegisterRequest};
use fgos_process::facts::Record;
use std::{cell::RefCell, os::unix::fs::PermissionsExt};

struct Attempt {
    seen: RefCell<Vec<NudgeChannel>>,
    queue_refusal: Option<&'static str>,
    typed_refusal: Option<&'static str>,
}
impl Nudge for Attempt {
    fn nudge(
        &self,
        channel: NudgeChannel,
        _: &fgos_mailbox_core::WriterKey,
        _: &Record,
    ) -> Result<(), String> {
        self.seen.borrow_mut().push(channel);
        let refusal = match channel {
            NudgeChannel::Typed => self.typed_refusal,
            _ => self.queue_refusal,
        };
        refusal.map_or(Ok(()), |why| Err(why.into()))
    }
}

#[test]
fn typed_versions_are_separate_from_push_versions_and_never_enable_deferred_hooks() {
    let tested = TestedClis::embedded();
    for (cli, version, channels) in [
        ("claude", "2.1.332", vec![NudgeChannel::Typed]),
        // codex 0.166.0 is also measured for the queue push, which goes first.
        (
            "codex",
            "0.166.0",
            vec![NudgeChannel::CodexQueue, NudgeChannel::Typed],
        ),
        ("agy", "1.5.18", vec![NudgeChannel::Typed]),
    ] {
        assert_eq!(tested.nudge_channels_for(cli, version), channels, "{cli}");
        assert!(tested.nudge_channels_for(cli, "9.9.9").is_empty());
    }
    // Existing push-channel proofs own their versions; this checks order when both are allowed.
    let mut contract: serde_json::Value =
        serde_json::from_str(include_str!("../../../contracts/adapters.v1.json")).unwrap();
    contract["typedNudges"]["codex"]["versions"] = serde_json::json!(["0.162.1"]);
    let both = TestedClis::from_contract(&contract.to_string()).unwrap();
    assert_eq!(
        both.nudge_channels_for("codex", "0.162.1"),
        vec![NudgeChannel::CodexQueue, NudgeChannel::Typed]
    );
    assert!(!tested.contains(fgos_mailbox::hook::Adapter::Agy));
    assert!(!tested.stop_drains().contains(&Cli::new("agy").unwrap()));
}

#[test]
fn sends_name_the_actual_local_path_and_a_typed_wake_is_not_repeated_while_unread() {
    for (version, queue_refusal, typed_refusal, expected_seen, expected_path) in [
        (
            "0.162.1",
            None,
            None,
            vec![NudgeChannel::CodexQueue],
            "local-pushed",
        ),
        (
            "0.166.0",
            Some("queue-down"),
            None,
            vec![NudgeChannel::CodexQueue, NudgeChannel::Typed],
            "local-typed",
        ),
        (
            "0.166.0",
            Some("queue-down"),
            Some("composer-not-empty"),
            vec![NudgeChannel::CodexQueue, NudgeChannel::Typed],
            "local-next-tool-call",
        ),
        // A version neither channel was measured on: nothing is attempted.
        ("0.163.0", None, None, vec![], "local-next-tool-call"),
    ] {
        let fgos = TempFgos::new("typed-send");
        let record = fgos.record();
        let held = record
            .hold(Wait::Try, T0, &limits(), |state, ids| {
                Reported::changing(
                    state
                        .register(
                            RegisterRequest {
                                key: key("recipient"),
                                cli: Cli::new("codex").unwrap(),
                                project: "example".into(),
                                own_suffix: None,
                                head: String::new(),
                            },
                            None,
                            T0,
                            &limits(),
                            ids,
                        )
                        .unwrap(),
                )
            })
            .unwrap();
        let name = name_of(&held.value.value);
        let program = fgos.scratch().join("codex");
        std::fs::write(&program, format!("#!/bin/sh\necho 'codex-cli {version}'\n")).unwrap();
        std::fs::set_permissions(&program, std::fs::Permissions::from_mode(0o755)).unwrap();
        let versions = VersionSources {
            claude_sessions: None,
            codex_program: program,
            max_read_bytes: 65536,
        };
        let attempt = Attempt {
            seen: RefCell::new(vec![]),
            queue_refusal,
            typed_refusal,
        };
        let request = |body| {
            let mut req = send_req("sender", &name, body);
            req.wake = true;
            req.nudge_clis = TestedClis::embedded().nudge_clis();
            req
        };
        let sent = send(
            &record,
            request("message body never enters the nudge port"),
            Wait::Try,
            T0,
            &limits(),
            &versions,
            &attempt,
        );
        assert!(sent.recorded);
        assert_eq!(sent.path, Some(expected_path));
        assert_eq!(attempt.seen.borrow().as_slice(), expected_seen.as_slice());
        if let Some(cause) = typed_refusal {
            assert!(sent
                .text
                .contains(&format!("could not be nudged ({cause})")));
        }
        if !TestedClis::embedded().lists_version("codex", version) {
            // A version no recording covers is reported as untested, whatever channel it has.
            assert!(sent.text.contains(&format!(
                "Its CLI version {version} is not one this mailbox was tested against; the hook still delivers, but nothing beyond that is verified."
            )));
        }
        if expected_path == "local-typed" {
            let second = send(
                &record,
                request("second message"),
                Wait::Try,
                T0,
                &limits(),
                &versions,
                &attempt,
            );
            assert!(second
                .text
                .contains("An earlier nudge to it is still unread"));
            assert_eq!(attempt.seen.borrow().len(), expected_seen.len());
        }
    }
}
