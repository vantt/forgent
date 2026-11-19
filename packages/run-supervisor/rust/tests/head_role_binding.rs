//! A head attempt holds its role in Identity before its agent exists. The supervisor runs against a fake herdr
//! with one real pane; Identity is a real state root. The registration is made before the gate is told to go, so a
//! refusal ends the attempt as not started with a named code (`start-refused.json`) and no agent ever runs.
#![cfg(target_os = "linux")]

mod support;

use std::fs;
use std::process::{Child, Command, Stdio};
use std::time::Duration;

use fgos_identity::directory::{register_writer, HeadIds, Ids, Listed};
use fgos_identity::resolve::{HeadRef, WriterKey, ENV_ORDER};
use fgos_process::{facts, ProcId};
use serde_json::{json, Value};
use support::herdr::FakeHerdr;
use support::supervisor::*;

const LIMIT: Duration = Duration::from_secs(90);
const STEP: Duration = Duration::from_secs(40);
const ROLE: &str = "head:planner-probe";

/// A head attempt of `ROLE`, generation `gen`, over `herdr`; the agent only waits.
fn head_run(name: &str, herdr: &FakeHerdr, role: &str, gen: u64) -> SupRun {
    let dir = std::env::temp_dir().join(format!("fgos-sup-{name}-{}", std::process::id()));
    let mut opts = RunOpts::agent(0);
    opts.preferred = "linux-pgroup".into();
    opts.grace_ms = 500;
    opts.steps = vec![
        json!({"stepId": "release-slot", "builtin": true, "disposition": {"onSuccess": "close", "onFailure": "retain"}}),
    ];
    let socket = herdr.go_socket().to_string_lossy().into_owned();
    let role = role.to_string();
    let run = SupRun::new_with(name, &opts, |e| {
        let attempt_id = e["attemptId"].as_str().unwrap().to_string();
        e["mode"] = json!("terminal");
        e["agentProtocol"]["mode"] = json!("terminal");
        e["slot"] = json!({"key": attempt_id, "groupKey": "g"});
        e["terminal"] = json!({"socketPath": socket, "exitCommand": null, "orphanSettleMs": 300});
        e["identity"] = json!({"writerId": format!("att-{attempt_id}"), "parentWriterId": null});
        e["session"] =
            json!({"role": role, "verbs": [], "persona": "planner", "name": "probe", "gen": gen});
        e["steps"].as_array_mut().unwrap().remove(0);
        e["launch"]["command"] = json!("/bin/sh");
        e["launch"]["args"] = json!(["-c", "sleep 600"]);
        e["launch"]["briefPath"] = json!(dir.join("brief.md"));
    });
    let envelope = run.json("envelope.json").unwrap();
    for stream in ["stdout", "stderr"] {
        fs::write(envelope["launch"]["capture"][stream].as_str().unwrap(), "").unwrap();
    }
    fs::write(run.path("brief.md"), "Work.\n").unwrap();
    herdr.allocate(&run.attempt_id);
    run
}

/// Registers `writer` as a session holding the role, on `pid` as its head; `gen` makes it a generation of the head.
fn hold(herdr: &FakeHerdr, writer: &str, pid: u32, gen: Option<u64>) {
    fs::write(herdr.state_root.join("machine-id"), "fg-abc234\n").unwrap();
    let head = HeadRef {
        pid,
        start_time: facts::identity_of(ProcId(pid)).unwrap().start_time,
    };
    let key = WriterKey {
        source: ENV_ORDER[0],
        value: writer,
    };
    let ids = gen.map(|gen| Ids {
        head: Some(HeadIds {
            persona: "planner".into(),
            name: "probe".into(),
            gen,
        }),
        ..Ids::default()
    });
    register_writer(
        &herdr.state_root,
        None,
        &key,
        &head,
        &[ROLE.to_string()],
        false,
        ids.as_ref(),
    )
    .unwrap_or_else(|r| panic!("register {writer}: {} {}", r.reason, r.detail));
}

fn holder(herdr: &FakeHerdr) -> Result<Listed, fgos_identity::refusal::Refusal> {
    fgos_identity::directory::resolve(
        &herdr.state_root,
        ROLE,
        &facts::judge_here,
        None,
        &fgos_identity::directory::NoTerminal,
    )
}

fn sleeper() -> Child {
    Command::new("sleep")
        .arg("600")
        .stdin(Stdio::null())
        .spawn()
        .unwrap()
}

/// The attempt ended as not started with this code, and its agent never ran.
fn refused_with(run: &SupRun, code: &str) -> Value {
    let note = run
        .json("start-refused.json")
        .expect("a start refusal is published");
    assert_eq!(note["code"], code, "{}", run.log());
    assert!(
        run.json("agent-binding.json").is_none(),
        "the agent must not start without its role: {}",
        run.log()
    );
    note
}

fn ends_when_pane_goes(herdr: &FakeHerdr, supervisor: Child, run: &SupRun) {
    herdr.set_flag("gone", true);
    let (code, _) = finish(supervisor, LIMIT);
    assert_eq!(code, 0, "{}", run.log());
}

#[test]
fn a_head_whose_role_binding_is_refused_by_identity_does_not_start_and_names_identitys_code() {
    let herdr = FakeHerdr::new("bind-bad");
    fs::write(herdr.state_root.join("machine-id"), "fg-abc234\n").unwrap();
    let mut run = head_run("hrb-bad", &herdr, "head:Not A Role", 1);
    let supervisor = run.start_with_env(&herdr.env());
    let _ = finish(supervisor, LIMIT);
    let note = refused_with(&run, "head-role-not-bound");
    assert!(
        note["why"].as_str().unwrap().contains("invalid-role"),
        "Identity's code is in the detail: {note}"
    );
}

#[test]
fn a_fresh_head_takes_the_role_from_a_holder_whose_process_is_dead() {
    let herdr = FakeHerdr::new("bind-dead");
    let mut dead = sleeper();
    hold(&herdr, "att-dead-holder", dead.id(), Some(1));
    dead.kill().unwrap();
    dead.wait().unwrap();
    let mut run = head_run("hrb-dead", &herdr, ROLE, 2);
    let supervisor = run.start_with_env(&herdr.env());
    wait_until(STEP, "the new head to hold the role", || {
        holder(&herdr).is_ok_and(|h| h.id.ends_with(&format!("/att-{}", run.attempt_id)))
    });
    ends_when_pane_goes(&herdr, supervisor, &run);
}

#[test]
fn a_fresh_head_is_refused_by_name_when_a_live_session_that_is_not_its_predecessor_holds_the_role()
{
    let herdr = FakeHerdr::new("bind-live");
    // This test process is the live holder; its record names no head, so it is nobody's predecessor.
    hold(&herdr, "att-live-holder", std::process::id(), None);
    let mut run = head_run("hrb-live", &herdr, ROLE, 2);
    let supervisor = run.start_with_env(&herdr.env());
    let _ = finish(supervisor, LIMIT);
    let note = refused_with(&run, "head-role-held");
    assert!(
        note["why"]
            .as_str()
            .unwrap()
            .contains("held by the live session"),
        "Identity's own words name the live holder: {note}"
    );
    assert!(holder(&herdr).unwrap().id.ends_with("/att-live-holder"));
}

#[test]
fn a_rotation_successor_starts_beside_its_live_predecessor_and_leaves_it_the_role() {
    let herdr = FakeHerdr::new("bind-succ");
    hold(&herdr, "att-predecessor", std::process::id(), Some(2));
    let mut run = head_run("hrb-succ", &herdr, ROLE, 3);
    let supervisor = run.start_with_env(&herdr.env());
    wait_until(STEP, "the successor to be registered beside it", || {
        run.json("agent-binding.json").is_some()
    });
    assert!(
        holder(&herdr).unwrap().id.ends_with("/att-predecessor"),
        "the role moves only when rotation moves it"
    );
    assert!(run.json("start-refused.json").is_none(), "{}", run.log());
    // The successor has its own Identity entry with no roles: the record a later bind of its agent session moves them to.
    let listed =
        fgos_identity::directory::list(&herdr.state_root, None, false, &facts::judge_here, None)
            .unwrap_or_else(|r| panic!("list: {} {}", r.reason, r.detail));
    let own = listed
        .sessions
        .iter()
        .find(|s| s.id.ends_with(&format!("/att-{}", run.attempt_id)))
        .expect("the successor is registered in Identity");
    assert!(
        own.roles.is_empty(),
        "the successor holds no role yet: {:?}",
        own.roles
    );
    ends_when_pane_goes(&herdr, supervisor, &run);
}
