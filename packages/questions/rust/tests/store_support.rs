//! Shared fixtures of the `store_*` tests: an in-memory log, a fixed caller, a temp checkout that is a real
//! Git repository with a plan and a discussion, and a valid decision question.
#![allow(dead_code)]

use fgos_questions::caller::{Caller, CallerSource};
use fgos_questions::store::{LoggedEvent, QuestionLog};
use fgos_questions::usecase::Questions;
use fgos_questions::Refusal;
use serde_json::{json, Value};
use std::cell::RefCell;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::Once;

#[derive(Default)]
pub struct MemLog {
    pub events: RefCell<Vec<LoggedEvent>>,
}

impl QuestionLog for MemLog {
    fn append(&self, event_type: &str, payload: Value) -> Result<(), Refusal> {
        self.events.borrow_mut().push(LoggedEvent {
            event_type: event_type.to_owned(),
            payload,
        });
        Ok(())
    }

    fn read(&self) -> Result<Vec<LoggedEvent>, Refusal> {
        Ok(self.events.borrow().clone())
    }
}

pub struct Fixed(pub Result<Caller, Refusal>);

impl CallerSource for Fixed {
    fn caller(&self) -> Result<Caller, Refusal> {
        self.0.clone()
    }
}

pub fn caller(session: &str, handle: &str, roles: &[&str], is_agent: bool) -> Caller {
    Caller {
        session_id: session.into(),
        handle: handle.into(),
        roles: roles.iter().map(|r| (*r).into()).collect(),
        persona: None,
        pane: None,
        machine: "m-1".into(),
        is_agent,
    }
}

/// An agent session holding the `head:` role of `role`.
pub fn head(session: &str, role: &str) -> Caller {
    caller(session, &format!("{session}-handle"), &[role], true)
}

/// The owner at a terminal: no agent among the ancestors, no role.
pub fn owner() -> Caller {
    caller("m-1/owner", "owner-terminal", &[], false)
}

static STATE: Once = Once::new();
static NEXT: AtomicU32 = AtomicU32::new(0);

fn scratch(label: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "fgos-questions-{label}-{}-{}",
        std::process::id(),
        NEXT.fetch_add(1, Ordering::SeqCst)
    ));
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

/// Pins the Git driver's state root to a private directory, once for the test process.
fn pin_state_root() {
    STATE.call_once(|| {
        let root = scratch("state");
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&root, std::fs::Permissions::from_mode(0o700)).unwrap();
        }
        std::env::set_var("FGOS_STATE_ROOT", &root);
    });
}

fn git(dir: &Path, args: &[&str]) {
    let status = Command::new("git")
        .args(["-c", "user.name=t", "-c", "user.email=t@example.invalid"])
        .args(args)
        .current_dir(dir)
        .status()
        .unwrap();
    assert!(status.success(), "git {args:?}");
}

pub struct Checkout {
    pub root: PathBuf,
    pub cache: PathBuf,
}

impl Drop for Checkout {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.root);
    }
}

/// A repository with one commit holding `plans/p/plan.md`, `plans/p/phase-01-x.md` and a discussion `d`.
pub fn checkout() -> Checkout {
    pin_state_root();
    let root = scratch("repo");
    git(&root, &["init", "-q", "-b", "work"]);
    git(&root, &["config", "fgos.machineid", "m-test"]);
    for (path, text) in [
        ("plans/p/plan.md", "plan\n"),
        ("plans/p/phase-01-x.md", "phase\n"),
        ("docs/discussions/d/QUESTIONS.md", "q\n"),
    ] {
        let file = root.join(path);
        std::fs::create_dir_all(file.parent().unwrap()).unwrap();
        std::fs::write(file, text).unwrap();
    }
    git(&root, &["add", "."]);
    git(&root, &["commit", "-q", "-m", "init"]);
    let cache = root.join(".fgos/cache");
    Checkout { root, cache }
}

pub fn wired<'a>(
    log: &'a dyn QuestionLog,
    who: &'a Fixed,
    checkout: &'a Checkout,
) -> Questions<'a> {
    Questions {
        log,
        caller: who,
        checkout: &checkout.root,
        cache_dir: &checkout.cache,
    }
}

pub fn option(label: &str, recommended: bool) -> Value {
    json!({ "label": label, "does": "d", "gain": "g", "harm": "h", "cost": "c", "recommended": recommended })
}

/// A decision question that passes every rule.
pub fn input(reference: &str) -> Value {
    json!({
        "stage": "planning",
        "ref": reference,
        "headline": "Which store do we use?",
        "blocks": "plan p phase 3",
        "parts": {
            "what": "choose a store",
            "cause": "two stores exist",
            "options": [option("A", true), option("B", false)],
            "recommendation": "A",
            "scope": { "allows": "A for this plan", "forbids": "changing other plans" }
        }
    })
}

pub fn ask_as(log: &MemLog, who: Caller, checkout: &Checkout, input: &Value) -> String {
    let who = Fixed(Ok(who));
    wired(log, &who, checkout).ask(input).unwrap().value
}
