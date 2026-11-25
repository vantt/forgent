//! Owning proof of the head permission table: inheritance, the longest prefix, the strictest tie, the default `ask`,
//! the successor `read` flag, and that the table reproduces what the persona grants held before it.

use fgos_session_host::permissions::{
    allowed_verbs, cage_of, decide, persona_of_role, Decision, Policy,
};

fn argv(line: &str) -> Vec<String> {
    line.split(' ').map(String::from).collect()
}

fn decision(persona: &str, line: &str) -> Decision {
    decide(persona, &argv(line))
        .expect("known persona")
        .decision
}

#[test]
fn a_persona_inherits_the_rows_of_the_persona_it_extends() {
    // head < supervisor < secretary: the supervisor's `session read` is the secretary's too, and `head` has neither.
    assert_eq!(decision("supervisor", "session read s1"), Decision::Allow);
    assert_eq!(decision("secretary", "session read s1"), Decision::Allow);
    assert_eq!(decision("planner", "session read s1"), Decision::Ask);
    // Every persona inherits the head rows.
    for persona in ["lead", "planner", "shaper", "supervisor", "secretary"] {
        assert_eq!(
            decision(persona, "friction record --kind bug"),
            Decision::Allow,
            "{persona}"
        );
    }
}

#[test]
fn a_row_of_the_child_replaces_the_inherited_row_of_the_same_prefix() {
    assert_eq!(decision("supervisor", "supervisor done"), Decision::Allow);
    assert_eq!(decision("secretary", "supervisor done"), Decision::Deny);
    assert_eq!(
        decision("supervisor", "questions answer q1"),
        Decision::Deny
    );
    assert_eq!(
        decision("secretary", "questions answer q1"),
        Decision::Allow
    );
}

#[test]
fn the_most_specific_prefix_wins() {
    // `questions` reads and is allowed; `questions answer` is a longer prefix and is denied to a planner.
    assert_eq!(decision("planner", "questions --all"), Decision::Allow);
    assert_eq!(decision("planner", "questions answer q1"), Decision::Deny);
}

#[test]
fn an_argv_no_row_matches_is_ask() {
    let verdict = decide("supervisor", &argv("deploy production")).unwrap();
    assert_eq!(verdict.decision, Decision::Ask);
    assert!(verdict.rule.is_none());
    // `worktree remove` is allowed only with the delivered-to guard.
    assert_eq!(
        decision("supervisor", "worktree remove ../w --delivered-to main"),
        Decision::Allow
    );
    assert_eq!(
        decision("supervisor", "worktree remove ../w"),
        Decision::Ask
    );
    assert_eq!(
        decision("lead", "worktree remove ../w --delivered-to main"),
        Decision::Ask
    );
}

#[test]
fn a_persona_the_table_does_not_name_has_no_verdict() {
    assert!(decide("stranger", &argv("slots")).is_none());
    assert!(cage_of("stranger").is_none());
}

#[test]
fn the_strictest_decision_wins_a_tie() {
    // `activate` and `release activate` are denied on the head row; nothing below may loosen a deny of the same length.
    assert_eq!(decision("secretary", "activate"), Decision::Deny);
    assert_eq!(decision("secretary", "release activate"), Decision::Deny);
}

#[test]
fn only_the_read_rows_may_be_used_before_a_rotation_successor_holds_the_role() {
    let read = decide("planner", &argv("questions")).unwrap().rule.unwrap();
    assert!(read.read);
    for line in ["friction record", "land", "supervisor raise"] {
        let rule = decide("lead", &argv(line)).unwrap().rule.unwrap();
        assert!(!rule.read, "{line}");
    }
    let readers: Vec<String> = [
        "head",
        "lead",
        "planner",
        "shaper",
        "supervisor",
        "secretary",
    ]
    .iter()
    .flat_map(|p| allowed_verbs(p))
    .filter(|verb| {
        decide("secretary", &argv(verb))
            .and_then(|v| v.rule)
            .is_some_and(|rule| rule.read)
    })
    .collect();
    assert!(
        readers.iter().all(|verb| verb == "questions"),
        "{readers:?}"
    );
}

#[test]
fn the_policy_verbs_are_node_rows_and_the_supervisors_own_are_native() {
    let policy = |persona, line| decide(persona, &argv(line)).unwrap().rule.unwrap().policy;
    assert_eq!(policy("lead", "land"), Policy::Node);
    assert_eq!(policy("secretary", "session start"), Policy::Node);
    assert_eq!(policy("supervisor", "session write"), Policy::Native);
    assert_eq!(policy("planner", "session bind session"), Policy::Native);
    assert_eq!(policy("supervisor", "supervisor raise"), Policy::Forward);
}

#[test]
fn the_cage_sizes_are_the_grants_the_personas_held_before() {
    let cage = |persona| cage_of(persona).unwrap();
    let coordinator = ["plans", "plans/backlog.md", "plans/backlog/*"]
        .map(String::from)
        .to_vec();
    assert_eq!(
        (
            cage("secretary").writes,
            cage("secretary").mailbox,
            cage("secretary").peers
        ),
        (coordinator.clone(), true, true)
    );
    assert_eq!(
        (
            cage("supervisor").writes,
            cage("supervisor").mailbox,
            cage("supervisor").peers
        ),
        (coordinator, true, true)
    );
    assert_eq!(
        (
            cage("shaper").writes,
            cage("shaper").mailbox,
            cage("shaper").peers
        ),
        (vec!["plans/discussions".to_string()], true, false)
    );
    assert_eq!(
        (
            cage("planner").writes,
            cage("planner").mailbox,
            cage("planner").peers
        ),
        (vec!["plans".to_string()], false, false)
    );
    // A lead's writes are its plan directory, which the launch fills in.
    assert_eq!(
        (
            cage("lead").writes,
            cage("lead").mailbox,
            cage("lead").peers
        ),
        (vec![], false, false)
    );
}

#[test]
fn the_verbs_each_persona_held_before_are_still_allowed() {
    let holds = |persona: &str, verbs: &[&str]| {
        for verb in verbs {
            assert_eq!(decision(persona, verb), Decision::Allow, "{persona} {verb}");
        }
    };
    let head = [
        "session bind session",
        "session rotate",
        "session answered",
        "session restore role",
        "friction record",
        "questions",
        "questions ask",
        "questions ack",
        "questions cancel",
    ];
    holds("planner", &head);
    holds("planner", &["land", "request result"]);
    holds("shaper", &["land", "request result"]);
    holds(
        "lead",
        &[
            "supervisor raise",
            "run",
            "land",
            "worktree create",
            "request result",
        ],
    );
    holds("lead", &head);
    let coordinator = [
        "session start",
        "session stop",
        "session write",
        "land",
        "request result",
        "supervisor plans",
        "supervisor queue",
        "slots",
        "supervisor raise",
        "supervisor wake",
        "run",
        "metrics record",
    ];
    holds("secretary", &coordinator);
    holds("secretary", &["questions answer"]);
    holds("supervisor", &coordinator);
    holds(
        "supervisor",
        &[
            "supervisor handled",
            "supervisor done",
            "session read",
            "session type",
            "watcher tune",
            "metrics prune",
            "config patch x.yaml",
            "git recover",
            "dispatch probe-account",
        ],
    );
    // Never held: the lead starts no session; a planner answers no question.
    assert_ne!(decision("lead", "session start"), Decision::Allow);
    assert_eq!(decision("planner", "questions answer"), Decision::Deny);
}

#[test]
fn a_role_names_its_longest_persona() {
    assert_eq!(
        persona_of_role("head:supervisor-forgent"),
        Some("supervisor")
    );
    assert_eq!(
        persona_of_role("head:lead-forgent-261124-0004"),
        Some("lead")
    );
    assert_eq!(persona_of_role("head:nobody-x"), None);
    assert_eq!(persona_of_role("worker:planner-x"), None);
    assert_eq!(persona_of_role("head:planner"), None);
}
