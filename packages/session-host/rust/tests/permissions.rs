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
fn every_persona_may_send_mail_and_read_its_own_inbox_without_a_rotation_read_exemption() {
    for persona in ["lead", "planner", "shaper", "supervisor", "secretary"] {
        assert_eq!(
            decision(persona, "mailbox send --to head:supervisor-x hello"),
            Decision::Allow,
            "{persona}"
        );
    }
    for persona in [
        "head",
        "lead",
        "planner",
        "shaper",
        "supervisor",
        "secretary",
    ] {
        for line in ["mailbox inbox", "mailbox inbox --claim"] {
            let verdict = decide(persona, &argv(line)).unwrap();
            assert_eq!(verdict.decision, Decision::Allow, "{persona} {line}");
            let rule = verdict.rule.unwrap();
            assert_eq!(rule.policy, Policy::Forward);
            assert!(!rule.read, "inbox --claim changes the record");
        }
    }
    let verdict = decide(
        "planner",
        &argv("mailbox send --to head:supervisor-x hello"),
    )
    .unwrap();
    assert_eq!(verdict.rule.unwrap().prefix.join(" "), "mailbox send");
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
fn a_flag_before_a_verb_word_cannot_hide_the_verb_from_its_deny_row() {
    // The host takes sub-verbs as the leading positional words wherever flags stand, so these run `questions answer`
    // and `questions cancel` and must be decided as such, never by the broad `questions` row.
    let planner = decide("planner", &argv("questions --option A answer q-abc")).unwrap();
    assert_eq!(planner.decision, Decision::Deny);
    // A flag takes the next word as its value, as the host reads it: `--all answer` leaves `questions q-abc`.
    assert_eq!(
        decision("planner", "questions --all answer q-abc"),
        Decision::Allow
    );
    assert_eq!(
        decision("planner", "--x questions answer q-abc"),
        Decision::Ask
    );
    // A cancel with a flag before the sub-verb is not the allowed `questions cancel` of the lead either.
    assert_eq!(
        decision("lead", "questions --reason x cancel q-abc"),
        Decision::Deny
    );
    // A flag after the verb words is the verb's own and does not change the verdict.
    assert_eq!(
        decision("lead", "questions cancel q-abc --reason x"),
        Decision::Allow
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
    for line in ["questions", "session list"] {
        let read = decide("planner", &argv(line)).unwrap().rule.unwrap();
        assert!(read.read, "{line}");
    }
    for line in ["friction record", "land", "supervisor raise"] {
        let rule = decide("lead", &argv(line)).unwrap().rule.unwrap();
        assert!(!rule.read, "{line}");
    }
    let readers: std::collections::BTreeSet<String> = [
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
    assert_eq!(
        readers,
        ["questions", "session list"]
            .map(String::from)
            .into_iter()
            .collect()
    );
}

#[test]
fn the_policy_verbs_are_node_rows_and_the_supervisors_own_are_native() {
    let policy = |persona, line| decide(persona, &argv(line)).unwrap().rule.unwrap().policy;
    assert_eq!(policy("lead", "land"), Policy::Node);
    assert_eq!(policy("lead", "supervisor widen"), Policy::Node);
    assert_eq!(policy("supervisor", "supervisor widen"), Policy::Forward);
    assert_eq!(policy("secretary", "session start"), Policy::Node);
    assert_eq!(policy("supervisor", "session write"), Policy::Native);
    assert_eq!(policy("shaper", "session save"), Policy::Native);
    assert_eq!(policy("planner", "session bind session"), Policy::Native);
    assert_eq!(policy("supervisor", "supervisor raise"), Policy::Forward);
}

#[test]
fn only_the_shaper_holds_session_save() {
    let shaper_verdict = decide("shaper", &argv("session save")).expect("known persona");
    assert_eq!(shaper_verdict.decision, Decision::Allow);
    assert_eq!(shaper_verdict.rule.unwrap().policy, Policy::Native);

    for persona in ["head", "lead", "planner", "supervisor", "secretary"] {
        assert_ne!(
            decision(persona, "session save"),
            Decision::Allow,
            "{persona}"
        );
    }
}

#[test]
fn the_cage_sizes_are_the_grants_the_personas_held_before() {
    let cage = |persona| cage_of(persona).unwrap();
    let coordinator = ["plans", "plans/backlog/*"].map(String::from).to_vec();
    for persona in ["secretary", "supervisor"] {
        assert!(
            !cage(persona).writes.iter().any(|w| w == "plans/backlog.md"),
            "{persona} is not granted the generated backlog index"
        );
    }
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
    // Every persona holds the help channel, inherited from the base head.
    for persona in [
        "head",
        "planner",
        "shaper",
        "lead",
        "supervisor",
        "secretary",
    ] {
        holds(persona, &["supervisor raise"]);
    }
    holds(
        "lead",
        &[
            "supervisor raise",
            "run",
            "land",
            "worktree create",
            "supervisor widen",
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
            "supervisor widen",
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
    assert_eq!(decision("planner", "supervisor widen"), Decision::Ask);
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

/// Every config key path the schemas mark `x-fgos-sensitivity: command` (the host runs its value as shell outside the
/// sandbox), `*` for a map's free key; array items add no segment, so a command inside a list names the list.
fn command_paths(
    node: &serde_json::Value,
    defs: &serde_json::Value,
    path: &mut Vec<String>,
    out: &mut Vec<String>,
    depth: usize,
) {
    if depth > 12 {
        return;
    }
    let Some(obj) = node.as_object() else { return };
    if obj.get("x-fgos-sensitivity").and_then(|v| v.as_str()) == Some("command") {
        out.push(path.join("."));
    }
    if let Some(target) = obj
        .get("$ref")
        .and_then(|v| v.as_str())
        .and_then(|r| r.strip_prefix("#/$defs/"))
    {
        command_paths(&defs[target], defs, path, out, depth + 1);
    }
    if let Some(props) = obj.get("properties").and_then(|v| v.as_object()) {
        for (key, child) in props {
            path.push(key.clone());
            command_paths(child, defs, path, out, depth + 1);
            path.pop();
        }
    }
    if let Some(child) = obj.get("additionalProperties").filter(|v| v.is_object()) {
        path.push("*".into());
        command_paths(child, defs, path, out, depth + 1);
        path.pop();
    }
    for key in ["items", "then", "else"] {
        if let Some(child) = obj.get(key) {
            command_paths(child, defs, path, out, depth + 1);
        }
    }
    for key in ["allOf", "anyOf", "oneOf"] {
        for child in obj
            .get(key)
            .and_then(|v| v.as_array())
            .into_iter()
            .flatten()
        {
            command_paths(child, defs, path, out, depth + 1);
        }
    }
}

#[test]
fn every_command_sensitive_config_key_is_a_protected_config_path() {
    let dir = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../core/config-schema");
    let guards: Vec<Vec<&str>> = fgos_session_host::permissions::protected_config_paths()
        .iter()
        .map(|g| g.split('.').collect())
        .collect();
    let mut found = 0;
    let mut uncovered = Vec::new();
    for entry in std::fs::read_dir(&dir).expect("core/config-schema") {
        let file = entry.unwrap().path();
        if !file.to_string_lossy().ends_with(".schema.yaml") {
            continue;
        }
        let stem = file
            .file_name()
            .unwrap()
            .to_string_lossy()
            .replace(".schema.yaml", "");
        let bytes = std::fs::read(&file).unwrap();
        let schema = fgos_yaml_doc::parse(&bytes, fgos_yaml_doc::Profile::StrictConfig, "schema")
            .and_then(|doc| doc.to_json())
            .unwrap_or_else(|e| panic!("{} does not parse: {e:?}", file.display()));
        let defs = schema.get("$defs").cloned().unwrap_or_default();
        let mut paths = Vec::new();
        if let Some(props) = schema.get("properties").and_then(|v| v.as_object()) {
            for (key, child) in props {
                // A schema file is one top-level config key: its file stem.
                let mut path = vec![stem.clone(), key.clone()];
                command_paths(child, &defs, &mut path, &mut paths, 0);
            }
        }
        for path in paths {
            found += 1;
            let have: Vec<&str> = path.split('.').collect();
            let covered = guards.iter().any(|guard| {
                guard.len() <= have.len()
                    && guard.iter().zip(&have).all(|(g, h)| *g == "*" || g == h)
            });
            if !covered {
                uncovered.push(format!("{}: {path}", file.display()));
            }
        }
    }
    assert!(
        found >= 8,
        "the walk found only {found} command-sensitive keys"
    );
    assert!(
        uncovered.is_empty(),
        "command-sensitive config keys with no protectedConfigPaths entry: {uncovered:#?}"
    );
}
