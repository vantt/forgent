//! The shared attempt writer id vectors against the real mint function and the
//! resolve rule of this crate: every valid case mints to its writer id and
//! resolves as an env id; every invalid case is refused by the mint.

use fgos_identity::{
    env_identity, is_attempt_writer_id, mint_attempt_writer_id, scrub_and_set, Source, WriterId, ATTEMPT_PREFIX, MAX_ATTEMPT_ID_LENGTH, MAX_ID_LENGTH,
};
use std::collections::BTreeMap;
use serde_json::Value;

const VECTORS: &str = include_str!("../../contracts/vectors/attempt-writer-id.v1.json");
const CONTRACT: &str = include_str!("../../contracts/attempt-writer-id.v1.json");

fn case_attempt_id(case: &Value) -> String {
    match case.get("expand") {
        Some(expand) => {
            let ch = expand["char"].as_str().unwrap();
            ch.repeat(expand["count"].as_u64().unwrap() as usize)
        }
        None => case["attemptId"].as_str().unwrap().to_string(),
    }
}

#[test]
fn contract_bounds_match_the_resolve_rule() {
    let contract: Value = serde_json::from_str(CONTRACT).unwrap();
    let c = &contract["constraints"];
    assert_eq!(c["prefix"], ATTEMPT_PREFIX);
    assert_eq!(c["maxWriterIdLength"].as_u64().unwrap() as usize, MAX_ID_LENGTH);
    let scrubbed: Vec<&str> = contract["environment"]["scrubbed"].as_array().unwrap().iter().map(|v| v.as_str().unwrap()).collect();
    assert_eq!(scrubbed, fgos_identity::launcher::SCRUBBED);
    assert_eq!(c["maxAttemptIdLength"].as_u64().unwrap() as usize, MAX_ATTEMPT_ID_LENGTH);
}

#[test]
fn every_vector_case_reproduces_and_valid_ids_resolve_as_env_ids() {
    let vectors: Value = serde_json::from_str(VECTORS).unwrap();
    let cases = vectors["cases"].as_array().unwrap();
    assert!(cases.len() >= 10);
    for case in cases {
        let name = case["name"].as_str().unwrap();
        let attempt_id = case_attempt_id(case);
        let minted = mint_attempt_writer_id(&attempt_id).ok();
        if case.get("error").is_some() {
            assert_eq!(minted, None, "{name}");
            continue;
        }
        let expected = match case.get("expand") {
            Some(_) => format!("{ATTEMPT_PREFIX}{attempt_id}"),
            None => case["writerId"].as_str().unwrap().to_string(),
        };
        assert_eq!(minted.as_deref(), Some(expected.as_str()), "{name}");
        let id = minted.unwrap();
        let env = {
            let id = id.clone();
            move |key: &str| (key == "FGOS_SESSION_ID").then(|| id.clone())
        };
        let resolved = env_identity(&env, None).unwrap_or_else(|| panic!("{name}: rule refused the id"));
        assert_eq!(resolved.source, Source::Env, "{name}");
        assert_eq!(resolved.id, WriterId::Session(id), "{name}");
    }
}

#[test]
fn an_attempt_writer_id_is_recognised_by_its_prefix_and_nothing_else_is() {
    let minted = mint_attempt_writer_id("asgn-demo_01").unwrap();
    assert!(is_attempt_writer_id(&minted));
    for other in ["", "att", "ATT-x", "xatt-x", "claude-2b", "pid-0123456789ab", " att-x"] {
        assert!(!is_attempt_writer_id(other), "{other:?} is not an attempt writer id");
    }
}

#[test]
fn minting_twice_gives_the_same_id() {
    assert_eq!(mint_attempt_writer_id("att_asgn-demo_01_7f3a"), mint_attempt_writer_id("att_asgn-demo_01_7f3a"));
}

fn env_of(pairs: &[(&str, &str)]) -> BTreeMap<String, String> {
    pairs.iter().map(|(k, v)| (k.to_string(), v.to_string())).collect()
}

#[test]
fn scrub_and_set_keeps_no_inherited_session_id_and_sets_the_minted_one() {
    let mut env = env_of(&[
        ("PATH", "/usr/bin"),
        ("FGOS_SESSION_ID", "parent-session"),
        ("CLAUDE_CODE_SESSION_ID", "claude-parent"),
        ("CODEX_THREAD_ID", "codex-parent"),
        ("FGOS_PARENT_WRITER_ID", "grandparent"),
    ]);
    scrub_and_set(&mut env, "att-a1", Some("ctl-1")).unwrap();
    assert_eq!(env.get("FGOS_SESSION_ID").map(String::as_str), Some("att-a1"));
    assert_eq!(env.get("FGOS_PARENT_WRITER_ID").map(String::as_str), Some("ctl-1"));
    assert_eq!(env.get("PATH").map(String::as_str), Some("/usr/bin"));
    assert!(!env.contains_key("CLAUDE_CODE_SESSION_ID"));
    assert!(!env.contains_key("CODEX_THREAD_ID"));
}

#[test]
fn an_empty_inherited_session_id_does_not_survive() {
    let mut env = env_of(&[("FGOS_SESSION_ID", ""), ("FGOS_PARENT_WRITER_ID", "old")]);
    scrub_and_set(&mut env, "att-a1", None).unwrap();
    assert_eq!(env.get("FGOS_SESSION_ID").map(String::as_str), Some("att-a1"));
    assert!(!env.contains_key("FGOS_PARENT_WRITER_ID"), "no controller id, no inherited lineage");
    let resolved = env_identity(&|k: &str| env.get(k).cloned(), None).unwrap();
    assert_eq!(resolved.id, WriterId::Session("att-a1".into()));
}

#[test]
fn an_empty_writer_id_is_refused_and_leaves_env_untouched() {
    let mut env = env_of(&[("CODEX_THREAD_ID", "t")]);
    assert!(scrub_and_set(&mut env, "", None).is_err());
    assert_eq!(env, env_of(&[("CODEX_THREAD_ID", "t")]));
}
