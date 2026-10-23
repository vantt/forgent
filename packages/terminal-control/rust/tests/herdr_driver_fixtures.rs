//! The recorded herdr answers parse into the driver's types.

use fgos_terminal_control::driver::herdr::*;
use fgos_terminal_control::driver::{ForegroundProcess, PaneGeometry, Rect};
use serde_json::Value;

fn fixture(name: &str) -> Value {
    let path = format!("{}/tests/fixtures/herdr/{name}.json", env!("CARGO_MANIFEST_DIR"));
    serde_json::from_str(&std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{path}: {e}"))).unwrap()
}

fn result(name: &str) -> Value {
    envelope(&fixture(name)).unwrap_or_else(|e| panic!("{name}: {e:?}"))
}

fn r(x: u32, y: u32, width: u32, height: u32) -> Rect {
    Rect { x, y, width, height }
}

#[test]
fn layout_gives_area_and_pane_rects() {
    let geometry = parse_layout(&result("pane-layout-two-panes")).unwrap();
    assert_eq!(geometry.tab_id, "wS:tF9");
    assert_eq!(geometry.area, r(0, 0, 352, 69));
    assert_eq!(
        geometry.panes,
        vec![
            PaneGeometry { pane_id: "wS:p59X".into(), rect: r(0, 0, 176, 69), pty: None },
            PaneGeometry { pane_id: "wS:p59Y".into(), rect: r(176, 0, 176, 69), pty: None },
        ]
    );
}

#[test]
fn tab_create_gives_tab_and_root_pane() {
    let created = parse_tab_created(&result("tab-create")).unwrap();
    assert_eq!((created.tab_id.as_str(), created.pane_id.as_str()), ("wS:tF9", "wS:p59X"));
}

#[test]
fn split_gives_new_pane_and_its_tab() {
    let created = parse_split(&result("pane-split")).unwrap();
    assert_eq!((created.tab_id.as_str(), created.pane_id.as_str()), ("wS:tF9", "wS:p59Y"));
}

#[test]
fn process_info_separates_shell_from_foreground() {
    let running = parse_process_info(&result("pane-process-info-running")).unwrap();
    assert_eq!(running.shell_pid, 2785881);
    assert_eq!(running.foreground_pgid, 2793310);
    assert_eq!(running.foreground, vec![ForegroundProcess { pid: 2793310, argv: vec!["sleep".into(), "300".into()] }]);

    let shell = parse_process_info(&result("pane-process-info-shell")).unwrap();
    assert_eq!(shell.foreground.len(), 1);
    assert_eq!(shell.foreground[0].pid, shell.shell_pid);

    // A zombie in the foreground group comes without argv and is left out;
    // the live process beside it is still read.
    let zombie = parse_process_info(&result("pane-process-info-zombie")).unwrap();
    assert_eq!(zombie.foreground, vec![ForegroundProcess { pid: 1972479, argv: vec!["sleep".into(), "300".into()] }]);
}

#[test]
fn pane_get_gives_agent_activity() {
    let activity = parse_activity(&result("pane-get")).unwrap();
    assert_eq!((activity.state.as_str(), activity.agent.as_deref()), ("working", Some("claude")));
    // A pane without a detected agent still reports a state.
    let plain = parse_activity(&result("pane-split")).unwrap();
    assert_eq!((plain.state.as_str(), plain.agent), ("unknown", None));
}

#[test]
fn status_server_gives_the_socket() {
    assert_eq!(parse_status_socket(&result("status-server")).as_deref(), Some("/home/vantt/.config/herdr/herdr.sock"));
}

#[test]
fn error_envelopes_keep_their_code() {
    for (name, code) in [
        ("pane-close-not-found", "pane_not_found"),
        ("pane-split-dead-anchor", "pane_not_found"),
    ] {
        assert_eq!(envelope(&fixture(name)).unwrap_err().code, code, "{name}");
    }
}

#[test]
fn a_shape_that_does_not_match_is_none_not_a_guess() {
    let wrong = serde_json::json!({"layout": {"panes": [{"pane_id": "p"}]}});
    assert!(parse_layout(&wrong).is_none());
    assert!(parse_process_info(&serde_json::json!({})).is_none());
}

#[test]
fn explain_says_whether_a_screen_rule_matched_or_herdr_only_fell_back() {
    let ruled = serde_json::json!({
        "state": "idle", "visible_idle": true, "matched_rule": { "id": "live_prompt_box" },
        "evaluated_rules": [{ "id": "live_prompt_box", "matched": true, "evidence": { "region_preview": "> typed" } }],
    });
    let seen = parse_explain(&ruled);
    assert_eq!((seen.state.as_deref(), seen.matched_rule.as_deref(), seen.visible_idle, seen.prompt_text.as_str()), (Some("idle"), Some("live_prompt_box"), true, "> typed"));

    let fallback = serde_json::json!({ "state": "idle", "matched_rule": null, "fallback_reason": "default_known_agent_idle_fallback", "visible_idle": false });
    let seen = parse_explain(&fallback);
    assert_eq!(seen.state.as_deref(), Some("idle"));
    assert_eq!(seen.matched_rule, None, "a fallback verdict carries no rule");
    assert!(!seen.visible_idle);
}

#[test]
fn explain_without_a_verdict_is_a_detector_with_no_state() {
    let seen = parse_explain(&serde_json::json!({}));
    assert_eq!(seen.state, None);
    assert!(!seen.visible_blocker && !seen.visible_working);
    assert_eq!(seen.prompt_text, "");
}

#[test]
fn explain_accepts_the_verdict_wrapped_in_a_result() {
    let wrapped = serde_json::json!({ "id": "cli:agent:explain", "result": { "state": "blocked", "visible_blocker": true } });
    let seen = parse_explain(&wrapped);
    assert_eq!(seen.state.as_deref(), Some("blocked"));
    assert!(seen.visible_blocker);
}

#[test]
fn agent_get_gives_the_agent_state_and_session() {
    let body = serde_json::json!({ "agent": { "agent": "claude", "agent_status": "working", "agent_session": { "value": "sess-1" } } });
    let activity = parse_activity(&body).unwrap();
    assert_eq!((activity.state.as_str(), activity.agent.as_deref(), activity.session.as_deref()), ("working", Some("claude"), Some("sess-1")));
}
