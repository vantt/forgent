//! The recorded hook fixtures (packages/mailbox/contracts/fixtures/hooks/)
//! and the adapters contract that names the CLI versions they were recorded
//! on. The redaction guard here is independent of the recorder's code
//! (scripts/record-mailbox-hook-fixtures.mjs): it reads the committed files
//! only.
//!
//! Account names the guard refuses, the keys of the owner's
//! `CODEX_ACCOUNTS` and `AGY_ACCOUNTS` tables: fgovn, tetnu, tetcu72,
//! mucdong.
use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};

const ACCOUNT_NAMES: [&str; 4] = ["fgovn", "tetnu", "tetcu72", "mucdong"];

/// The CLIs of the first slice (spec §1).
const FIRST_SLICE: [&str; 3] = ["claude", "codex", "agy"];

/// Prefixes of credentials that must never reach a fixture.
const TOKEN_PREFIXES: [&str; 13] = [
    "sk-",
    "sk-ant-",
    "ghp_",
    "gho_",
    "ghs_",
    "ghu_",
    "github_pat_",
    "xoxb-",
    "xoxp-",
    "AKIA",
    "ya29.",
    "1//0",
    "-----BEGIN",
];

/// The id placeholder family the recorder writes:
/// `00000000-0000-4000-8000-` followed by twelve digits.
const PLACEHOLDER_PREFIX: &str = "00000000-0000-4000-8000-";

/// The shortest run of base64 or hex characters treated as a secret.
const SECRET_RUN: usize = 32;

fn contracts() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../contracts")
}

fn fixture_files() -> Vec<PathBuf> {
    fn walk(dir: &Path, out: &mut Vec<PathBuf>) {
        for entry in fs::read_dir(dir).unwrap() {
            let path = entry.unwrap().path();
            if path.is_dir() {
                walk(&path, out);
            } else {
                out.push(path);
            }
        }
    }
    let mut files = Vec::new();
    walk(&contracts().join("fixtures/hooks"), &mut files);
    files.sort();
    files
}

fn adapters() -> Value {
    let text = fs::read_to_string(contracts().join("adapters.v1.json")).unwrap();
    serde_json::from_str(&text).expect("adapters.v1.json is valid JSON")
}

fn tested_against() -> Vec<(String, String)> {
    adapters()["testedAgainst"]
        .as_array()
        .expect("testedAgainst is a list")
        .iter()
        .map(|entry| {
            (
                entry["cli"].as_str().unwrap().to_string(),
                entry["version"].as_str().unwrap().to_string(),
            )
        })
        .collect()
}

fn is_hex(c: char) -> bool {
    c.is_ascii_hexdigit()
}

/// Every UUID-shaped substring (8-4-4-4-12 hex digits).
fn uuids(text: &str) -> Vec<&str> {
    const SHAPE: [usize; 5] = [8, 4, 4, 4, 12];
    let len: usize = SHAPE.iter().sum::<usize>() + SHAPE.len() - 1;
    let bytes = text.as_bytes();
    let mut found = Vec::new();
    for start in 0..bytes.len().saturating_sub(len - 1) {
        let Some(candidate) = text.get(start..start + len) else {
            continue;
        };
        let groups: Vec<&str> = candidate.split('-').collect();
        let shaped = groups.len() == SHAPE.len()
            && groups
                .iter()
                .zip(SHAPE)
                .all(|(g, n)| g.len() == n && g.chars().all(is_hex));
        if shaped {
            found.push(candidate);
        }
    }
    found
}

/// Runs of base64 or hex characters at least `SECRET_RUN` long that hold a
/// digit. `/` separates runs, so a path of short segments is not one run; a
/// base64 secret holds a `/` only about once in 64 characters, so it still
/// leaves a run this long.
fn secret_runs(text: &str) -> Vec<String> {
    let in_run = |c: char| c.is_ascii_alphanumeric() || matches!(c, '+' | '=');
    text.split(|c: char| !in_run(c))
        .filter(|run| run.len() >= SECRET_RUN && run.chars().any(|c| c.is_ascii_digit()))
        .map(str::to_string)
        .collect()
}

/// Whether `needle` occurs where the character before it is not alphanumeric,
/// so `sk-` in `task-` does not count.
fn occurs_as_word_start(text: &str, needle: &str) -> bool {
    text.match_indices(needle).any(|(at, _)| {
        text[..at]
            .chars()
            .next_back()
            .is_none_or(|c| !c.is_ascii_alphanumeric())
    })
}

fn has_email(text: &str) -> bool {
    text.match_indices('@').any(|(at, _)| {
        let local = text[..at].chars().next_back();
        let domain: String = text[at + 1..]
            .chars()
            .take_while(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '-'))
            .collect();
        local.is_some_and(|c| c.is_ascii_alphanumeric())
            && domain.contains('.')
            && !domain.ends_with('.')
    })
}

fn has_jwt(text: &str) -> bool {
    text.match_indices("eyJ").any(|(at, _)| {
        text[at..]
            .chars()
            .take_while(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.'))
            .filter(|c| *c == '.')
            .count()
            >= 1
    })
}

/// Every absolute path `/home/<x>/` whose `<x>` is not `user`. A `home`
/// directory inside another path (a CLI home under the run directory) is
/// not a user's home.
fn foreign_homes(text: &str) -> Vec<String> {
    text.match_indices("/home/")
        .filter(|(at, _)| {
            text[..*at]
                .chars()
                .next_back()
                .is_none_or(|c| matches!(c, '"' | ' ' | '`' | '\'' | '=' | ':' | '('))
        })
        .map(|(at, _)| {
            text[at + "/home/".len()..]
                .chars()
                .take_while(|c| *c != '/' && *c != '"')
                .collect::<String>()
        })
        .filter(|name| name != "user")
        .collect()
}

#[test]
fn fixtures_hold_no_secret_or_personal_value() {
    let user_names: Vec<String> = ["USER", "LOGNAME"]
        .iter()
        .filter_map(|v| std::env::var(v).ok())
        .filter(|name| !name.is_empty() && name != "user")
        .collect();
    let files = fixture_files();
    assert!(!files.is_empty(), "no hook fixture is committed");
    for file in files {
        let shown = file.display();
        let text = fs::read_to_string(&file).unwrap();
        serde_json::from_str::<Value>(&text)
            .unwrap_or_else(|e| panic!("{shown} is not valid JSON: {e}"));
        for name in &user_names {
            assert!(
                !text.contains(name.as_str()),
                "{shown} holds the OS user name"
            );
        }
        for name in ACCOUNT_NAMES {
            assert!(!text.contains(name), "{shown} holds an account name");
        }
        assert_eq!(
            foreign_homes(&text),
            Vec::<String>::new(),
            "{shown} holds a home directory other than /home/user"
        );
        for uuid in uuids(&text) {
            assert!(
                uuid.starts_with(PLACEHOLDER_PREFIX),
                "{shown} holds a UUID outside the placeholder family: {uuid}"
            );
        }
        for prefix in TOKEN_PREFIXES {
            assert!(
                !occurs_as_word_start(&text, prefix),
                "{shown} holds a credential prefix {prefix}"
            );
        }
        assert!(!has_jwt(&text), "{shown} holds a JWT");
        assert_eq!(
            secret_runs(&text),
            Vec::<String>::new(),
            "{shown} holds a long base64 or hex run"
        );
        assert!(!has_email(&text), "{shown} holds an e-mail address");
    }
}

#[test]
fn every_tested_cli_has_its_fixtures() {
    for (cli, version) in tested_against() {
        let dir = contracts().join("fixtures/hooks").join(&cli);
        for name in [
            "stop.json",
            "post-tool-use.json",
            "accepted-stop.json",
            "accepted-post-tool-use.json",
            "vectors.json",
        ] {
            assert!(dir.join(name).is_file(), "{cli} has no {name}");
        }
        let vectors: Value =
            serde_json::from_str(&fs::read_to_string(dir.join("vectors.json")).unwrap()).unwrap();
        assert_eq!(vectors["cli"], cli.as_str());
        let source = vectors["source"].as_str().unwrap();
        assert!(
            source.contains(&format!("{cli} {version}")),
            "{cli}'s vectors.json source does not name version {version}"
        );
    }
}

#[test]
fn every_cli_of_the_first_slice_is_tested_or_deferred_with_a_reason() {
    let tested: Vec<String> = tested_against().into_iter().map(|(cli, _)| cli).collect();
    let contract = adapters();
    let deferred = contract["deferred"].as_array().cloned().unwrap_or_default();
    for cli in FIRST_SLICE {
        let is_tested = tested.iter().any(|t| t == cli);
        let reason = deferred
            .iter()
            .find(|d| d["cli"] == cli)
            .and_then(|d| d["reason"].as_str())
            .filter(|r| !r.trim().is_empty());
        assert!(
            is_tested != reason.is_some(),
            "{cli} must be in exactly one of testedAgainst and deferred (with a reason)"
        );
    }
}
