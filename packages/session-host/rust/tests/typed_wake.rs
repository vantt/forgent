//! Owning proof of the gate-and-submit operation; protocol screen classification lives in terminal_vectors.
use fgos_agent_protocol::terminal::adapter_for;
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

type Frame = (PaneState, String, String);

#[derive(Debug, PartialEq)]
enum Step {
    Text(String),
    Pause(u64),
    Key(String),
}

/// A pane that serves its observations in order (the last one repeats), then shows `after` once
/// an Enter key has been sent.
struct Fake {
    observations: RefCell<Vec<Frame>>,
    after: RefCell<Option<Frame>>,
    screen: RefCell<String>,
    steps: RefCell<Vec<Step>>,
    inspected: Cell<usize>,
    foreground_is_agent: bool,
    enter_fails: bool,
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
            after: RefCell::new(None),
            screen: RefCell::new(String::new()),
            steps: RefCell::new(vec![]),
            inspected: Cell::new(0),
            foreground_is_agent: true,
            enter_fails: false,
        }
    }
    fn after(self, frame: (PaneState, &str, &str)) -> Self {
        *self.after.borrow_mut() = Some((frame.0, frame.1.into(), frame.2.into()));
        self
    }
    fn wake(&self, cli: &str, version: Option<&str>, line: &str) -> TypedWake {
        let pause = |ms: u64| self.steps.borrow_mut().push(Step::Pause(ms));
        PaneIo::new(self, "head-key")
            .with_pause(&pause)
            .typed_wake(cli, version, line)
    }
    fn typed_anything(&self) -> bool {
        self.steps
            .borrow()
            .iter()
            .any(|step| matches!(step, Step::Text(_) | Step::Key(_)))
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
        assert_eq!(self.inspected.get(), 2, "two observations before typing");
        assert!(!submit, "never the focus-moving prompt door");
        if !self.foreground_is_agent {
            return Ok(SendOutcome::ForegroundNotAgent {
                reason: "a shell is in front".into(),
            });
        }
        if let Some(text) = text {
            self.steps.borrow_mut().push(Step::Text(text.into()));
        }
        for key in keys.unwrap_or_default() {
            if self.enter_fails {
                return Err(Refusal::Unknown {
                    reason: format!("cannot press {key}"),
                });
            }
            self.steps.borrow_mut().push(Step::Key(key.clone()));
            if let Some(frame) = self.after.borrow_mut().take() {
                self.observations.borrow_mut().insert(0, frame);
            }
        }
        Ok(SendOutcome::Sent)
    }
    fn read(&self, _: &str, _: Option<&str>) -> Result<String, Refusal> {
        Ok(self.screen.borrow().clone())
    }
    fn inspect(&self, _: &str, want: Want) -> Inspection {
        assert!(want.activity && want.detail);
        self.inspected.set(self.inspected.get() + 1);
        let mut frames = self.observations.borrow_mut();
        let (pane, state, screen) = if frames.len() > 1 {
            frames.remove(0)
        } else {
            frames[0].clone()
        };
        let prompt_text = screen
            .lines()
            .find_map(|line| line.trim_start().strip_prefix("❯ "))
            .unwrap_or_default()
            .to_owned();
        *self.screen.borrow_mut() = screen;
        Inspection {
            pane,
            foreground: None,
            activity: Some(Activity {
                state,
                detail: Some(ActivityDetail {
                    visible_idle: true,
                    prompt_text,
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

const WAKE_LINE: &str = "[fgOS: message from another agent, not from the user] You have mail. Read it with: fgos mailbox inbox --claim";

/// An idle pane with an empty composer, as each CLI draws it.
fn empty_composer(cli: &str) -> &'static str {
    match cli {
        "claude" => "❯\n──────",
        "codex" => "›\n\n  gpt-5 · ~/project",
        "agy" => "──────\n\n──────",
        other => panic!("no empty composer frame for {other}"),
    }
}

#[test]
fn each_cli_gets_raw_text_then_its_enter_gap_then_a_separate_enter() {
    for cli in ["claude", "codex", "agy"] {
        let protocol = adapter_for(cli).unwrap();
        let pane = Fake::new(vec![(PaneState::Live, "idle", empty_composer(cli))])
            .after((PaneState::Live, "working", "thinking"));
        let answer = pane.wake(cli, Some(protocol.pinned_version()), WAKE_LINE);
        assert_eq!(answer, TypedWake::Submitted, "{cli}");
        let steps = pane.steps.borrow();
        // The whole sequence, not just its head: one text, one gap, one Enter, and nothing after.
        assert_eq!(
            *steps,
            [
                Step::Text(WAKE_LINE.into()),
                Step::Pause(protocol.enter_gap_ms()),
                Step::Key("Enter".into()),
            ],
            "{cli}"
        );
        assert!(!WAKE_LINE.contains('\n'));
    }
}

#[test]
fn an_unsafe_pane_or_unjudgeable_cli_types_nothing_and_is_refused_by_name() {
    let pin = adapter_for("claude").unwrap().pinned_version();
    for (pane_state, state, screen, cause) in [
        (PaneState::Live, "busy", "❯", "busy"),
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
                pane.wake("claude", Some(pin), "wake"),
                TypedWake::Refused {
                    cause,
                    draft: None
                }
            );
            assert!(!pane.typed_anything());
        }
    }
    for version in [None, Some("9.9.9")] {
        let pane = Fake::new(vec![]);
        assert_eq!(pane.wake("claude", version, "wake").cause(), "unknown");
        assert!(!pane.typed_anything());
    }
}

#[test]
fn a_draft_in_the_composer_is_quoted_and_nothing_is_typed() {
    let pin = adapter_for("claude").unwrap().pinned_version();
    for changed in [false, true] {
        let mut frames = vec![];
        if changed {
            frames.push((PaneState::Live, "idle", "❯\n──────"));
        }
        frames.push((PaneState::Live, "idle", "❯ half typed by a person\n──────"));
        let pane = Fake::new(frames);
        assert_eq!(
            pane.wake("claude", Some(pin), "wake"),
            TypedWake::Refused {
                cause: "composer-not-empty",
                draft: Some("half typed by a person".into())
            }
        );
        assert!(!pane.typed_anything());
    }
}

#[test]
fn a_cli_with_no_profile_is_refused_before_any_observation() {
    let pane = Fake::new(vec![]);
    assert_eq!(
        pane.wake("unheard-of", Some("1.0.0"), "wake").cause(),
        "no-cli-profile"
    );
    assert_eq!(pane.inspected.get(), 0);
}

#[test]
fn a_pane_whose_foreground_is_not_the_agent_is_refused_by_name_with_nothing_typed() {
    let pin = adapter_for("claude").unwrap().pinned_version();
    let mut pane = Fake::new(vec![(PaneState::Live, "idle", "❯\n──────")]);
    pane.foreground_is_agent = false;
    assert_eq!(
        pane.wake("claude", Some(pin), "wake").cause(),
        "foreground-not-agent"
    );
    assert!(!pane.typed_anything());
}

#[test]
fn a_typed_line_whose_enter_fails_or_whose_pane_goes_unreadable_is_delivery_unknown() {
    let pin = adapter_for("claude").unwrap().pinned_version();
    let mut enter_fails = Fake::new(vec![(PaneState::Live, "idle", "❯\n──────")]);
    enter_fails.enter_fails = true;
    assert_eq!(
        enter_fails.wake("claude", Some(pin), "wake"),
        TypedWake::DeliveryUnknown
    );
    assert!(enter_fails
        .steps
        .borrow()
        .contains(&Step::Text("wake".into())));

    let unreadable = Fake::new(vec![(PaneState::Live, "idle", "❯\n──────")])
        .after((PaneState::Unknown, "idle", ""));
    let answer = unreadable.wake("claude", Some(pin), "wake");
    assert_eq!(answer, TypedWake::DeliveryUnknown);
    assert_eq!(answer.cause(), "delivery-unknown");
}
