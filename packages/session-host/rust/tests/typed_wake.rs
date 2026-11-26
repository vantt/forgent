//! Owning proof of the gate-and-type operation; protocol screen classification lives in terminal_vectors.
use fgos_session_host::{
    pane_io::{PaneIo, TypedWake},
    panes::Panes,
};
use fgos_terminal_control::{
    core::Want,
    driver::{Activity, ActivityDetail},
    port::*,
};
use std::cell::{Cell, RefCell};

struct Fake {
    observations: RefCell<Vec<(PaneState, String, String)>>,
    screen: RefCell<String>,
    sent: RefCell<Vec<(Option<String>, Option<Vec<String>>, bool)>>,
    inspected: Cell<usize>,
}
impl Fake {
    fn new(frames: Vec<(PaneState, &str, &str)>) -> Self {
        Self {
            observations: RefCell::new(
                frames
                    .into_iter()
                    .map(|(p, s, t)| (p, s.into(), t.into()))
                    .collect(),
            ),
            screen: RefCell::new(String::new()),
            sent: RefCell::new(vec![]),
            inspected: Cell::new(0),
        }
    }
}
impl Panes for Fake {
    fn allocate(&self, _: &AllocateRequest) -> Result<Allocation, Refusal> {
        panic!("not allocation")
    }
    fn launch(&self, _: &str, _: &LaunchSpec) -> Result<LaunchOutcome, Refusal> {
        panic!("not launch")
    }
    fn send(
        &self,
        key: &str,
        text: Option<&str>,
        keys: Option<&[String]>,
        submit: bool,
    ) -> Result<SendOutcome, Refusal> {
        assert_eq!(key, "head-key");
        assert_eq!(self.inspected.get(), 2, "re-observe before typing");
        assert!(!submit, "never the focus-moving prompt door");
        self.sent.borrow_mut().push((
            text.map(str::to_owned),
            keys.map(<[String]>::to_vec),
            submit,
        ));
        Ok(SendOutcome::Sent)
    }
    fn read(&self, _: &str, _: Option<&str>) -> Result<String, Refusal> {
        Ok(self.screen.borrow().clone())
    }
    fn inspect(&self, _: &str, want: Want) -> Inspection {
        assert!(want.activity && want.detail);
        self.inspected.set(self.inspected.get() + 1);
        let (pane, state, screen) = self.observations.borrow_mut().remove(0);
        *self.screen.borrow_mut() = screen;
        Inspection {
            pane,
            foreground: None,
            activity: Some(Activity {
                state,
                detail: Some(ActivityDetail {
                    visible_idle: true,
                    ..Default::default()
                }),
                ..Default::default()
            }),
        }
    }
    fn focus(&self, _: &str) -> Result<(), Refusal> {
        panic!("must not move focus")
    }
    fn release(&self, _: &str, _: Disposition) -> Result<ReleaseOutcome, Refusal> {
        panic!("not release")
    }
}

#[test]
fn only_two_safe_observations_allow_raw_text_then_enter() {
    // The mailbox's fixed labelled signal, never a mail body; the host supplies NUDGE_LINE.
    let line = "[fgOS: message from another agent, not from the user] You have mail. Read it with: fgos mailbox inbox --claim";
    let pane = Fake::new(vec![
        (PaneState::Live, "idle", "❯\n──────"),
        (PaneState::Live, "idle", "❯\n──────"),
    ]);
    assert_eq!(
        PaneIo::new(&pane, "head-key").typed_wake("claude", Some("2.1.302"), line),
        TypedWake::Typed
    );
    assert_eq!(
        *pane.sent.borrow(),
        vec![
            (Some(line.into()), None, false),
            (None, Some(vec!["Enter".into()]), false)
        ]
    );
}

#[test]
fn unsafe_observations_and_version_drift_never_type() {
    for (pane_state, state, screen, cause) in [
        (PaneState::Live, "busy", "❯", "busy"),
        (
            PaneState::Live,
            "idle",
            "❯ half typed",
            "composer-not-empty",
        ),
        (
            PaneState::Live,
            "idle",
            "Is this a project you created or one you trust",
            "dialog-open",
        ),
        (PaneState::Live, "idle", "unrecognised", "unknown"),
        (PaneState::Gone, "idle", "❯", "no-pane"),
        (PaneState::Unknown, "idle", "❯", "unknown"),
    ] {
        for changed in [false, true] {
            let mut frames = vec![];
            if changed {
                frames.push((PaneState::Live, "idle", "❯\n──────"));
            }
            frames.push((pane_state, state, screen));
            let pane = Fake::new(frames);
            assert_eq!(
                PaneIo::new(&pane, "head-key").typed_wake("claude", Some("2.1.302"), "wake"),
                TypedWake::Refused(cause)
            );
            assert!(pane.sent.borrow().is_empty());
        }
    }
    for version in [None, Some("9.9.9")] {
        let pane = Fake::new(vec![]);
        assert_eq!(
            PaneIo::new(&pane, "head-key").typed_wake("claude", version, "wake"),
            TypedWake::Refused("unknown")
        );
        assert!(pane.sent.borrow().is_empty());
    }
}
