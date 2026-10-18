//! The shared attempt writer id vectors, checked against the resolve rule of
//! this crate: every valid case is a usable env id and every invalid case is
//! one the rule would refuse or that the mint contract rejects first.

use fgos_session_identity::{env_identity, Source, WriterId, MAX_ID_LENGTH};
use serde_json::Value;

const VECTORS: &str = include_str!("../../contracts/vectors/attempt-writer-id.v1.json");
const CONTRACT: &str = include_str!("../../contracts/attempt-writer-id.v1.json");

const PREFIX: &str = "att-";

/// Reference form of the contract rule; the mint function in this crate
/// must agree with it case for case.
fn reference_mint(attempt_id: &str, max_attempt_id: usize) -> Option<String> {
    let ok = !attempt_id.is_empty()
        && attempt_id.chars().count() <= max_attempt_id
        && attempt_id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-'));
    ok.then(|| format!("{PREFIX}{attempt_id}"))
}

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
    assert_eq!(c["prefix"], PREFIX);
    assert_eq!(c["maxWriterIdLength"].as_u64().unwrap() as usize, MAX_ID_LENGTH);
    assert_eq!(
        c["maxAttemptIdLength"].as_u64().unwrap() as usize + PREFIX.len(),
        MAX_ID_LENGTH
    );
}

#[test]
fn every_vector_case_reproduces_and_valid_ids_resolve_as_env_ids() {
    let contract: Value = serde_json::from_str(CONTRACT).unwrap();
    let max_attempt_id = contract["constraints"]["maxAttemptIdLength"].as_u64().unwrap() as usize;
    let vectors: Value = serde_json::from_str(VECTORS).unwrap();
    let cases = vectors["cases"].as_array().unwrap();
    assert!(cases.len() >= 10);
    for case in cases {
        let name = case["name"].as_str().unwrap();
        let attempt_id = case_attempt_id(case);
        let minted = reference_mint(&attempt_id, max_attempt_id);
        if case.get("error").is_some() {
            assert_eq!(minted, None, "{name}");
            continue;
        }
        let expected = match case.get("expand") {
            Some(_) => format!("{PREFIX}{attempt_id}"),
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
