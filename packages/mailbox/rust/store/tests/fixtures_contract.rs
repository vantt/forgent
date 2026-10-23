//! The recorded hook fixtures (packages/mailbox/contracts/fixtures/hooks/)
//! and the adapters contract that names the CLI versions they were recorded
//! on. The redaction guard here is independent of the recorder's code
//! (scripts/record-mailbox-hook-fixtures.mjs): it reads the committed files
//! only. It is an allowlist: every string value must have an allowed shape.
//! Only the recorder's own prose (`source`, `note`) is free text, and it is
//! searched for forbidden values instead.
//!
//! Account names the guard refuses, the keys of the owner's
//! `CODEX_ACCOUNTS` and `AGY_ACCOUNTS` tables and their stems: fgovn, tetnu,
//! tetcu72, tetcu, mucdong.
mod common;

use common::{contracts_dir, files, hook_fixtures_dir, ADAPTERS_CONTRACT};
use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};

const ACCOUNT_NAMES: [&str; 5] = ["fgovn", "tetnu", "tetcu72", "tetcu", "mucdong"];

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
    walk(&hook_fixtures_dir(), &mut files);
    files.sort();
    files
}

fn adapters() -> Value {
    let text = fs::read_to_string(contracts_dir().join(ADAPTERS_CONTRACT)).unwrap();
    serde_json::from_str(&text).expect("the adapters contract is valid JSON")
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

/// Path roots a fixture path may start with: the recorder's placeholders.
const PATH_ROOTS: [&str; 3] = ["/run-dir/", "/repo/", "/home/user/"];

/// The values each payload key may hold as written by the CLI, when it is
/// not a placeholder, a path, `<redacted>`, `{{TEXT}}` or empty.
const PAYLOAD_LITERALS: &[(&str, &[&str])] = &[
    ("hook_event_name", &["Stop", "PostToolUse", "SubagentStart", "SubagentStop"]),
    ("hookEventName", &["PostToolUse"]),
    ("tool_name", &["Bash"]),
    ("name", &["run_command"]),
    ("permission_mode", &["bypassPermissions"]),
    ("level", &["low", "medium", "high"]),
    ("decision", &["block"]),
    ("stdout", &["mailbox-fixture", "mailbox-subagent"]),
    ("last_assistant_message", &["done"]),
    (
        "command",
        &[
            "env | grep -E '^(CODEX_THREAD_ID|CLAUDE_CODE_SESSION_ID|FGOS_SESSION_ID)=' > tool-env.txt; echo mailbox-fixture",
            "env | grep -E '^(CODEX_THREAD_ID|CLAUDE_CODE_SESSION_ID|FGOS_SESSION_ID)=' > sub-env.txt; echo mailbox-subagent",
        ],
    ),
];

/// Keys of `vectors.json` entries whose values are the test author's
/// kebab-case words.
const VECTOR_WORD_KEYS: [&str; 7] = [
    "name",
    "kind",
    "event",
    "unparsed",
    "cli",
    "source",
    "agent_type",
];

/// Keys holding the recorder's own prose.
const PROSE_KEYS: [&str; 2] = ["source", "note"];

fn is_placeholder(value: &str) -> bool {
    value.len() == PLACEHOLDER_PREFIX.len() + 12
        && value.starts_with(PLACEHOLDER_PREFIX)
        && value[PLACEHOLDER_PREFIX.len()..]
            .chars()
            .all(|c| c.is_ascii_digit())
}

/// A path under a placeholder root whose segments are file-name words.
fn is_fixture_path(value: &str) -> bool {
    PATH_ROOTS.iter().any(|root| value.starts_with(root))
        && value.split('/').skip(1).all(|segment| {
            !segment.is_empty()
                && segment
                    .chars()
                    .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | '-'))
        })
}

fn is_kebab_word(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 64
        && value.split('-').all(|part| {
            !part.is_empty()
                && part
                    .chars()
                    .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit())
        })
}

/// Whether one string value of a fixture has an allowed shape. `key` is
/// the key holding it (an array element takes its array's key); `in_vectors`
/// says the file is a `vectors.json`.
fn allowed(key: &str, value: &str, in_vectors: bool) -> bool {
    let generic = value.is_empty()
        || value == "<redacted>"
        || value == "{{TEXT}}"
        || is_placeholder(value)
        || is_fixture_path(value);
    let literal = PAYLOAD_LITERALS.iter().any(|(k, values)| {
        (*k == key || (*k == "command" && key == "CommandLine")) && values.contains(&value)
    });
    let vector_word = in_vectors
        && (VECTOR_WORD_KEYS.contains(&key) && is_kebab_word(value)
            || key == "file"
                && value.ends_with(".json")
                && is_kebab_word(&value[..value.len() - 5])
            || key == "text" && value == "not json");
    generic || literal || vector_word
}

/// Every string value of `doc` without an allowed shape, as `key = value`;
/// prose values go to `prose` instead.
fn disallowed_values(doc: &Value, in_vectors: bool, prose: &mut Vec<String>) -> Vec<String> {
    fn walk(
        node: &Value,
        key: &str,
        depth: usize,
        in_vectors: bool,
        prose: &mut Vec<String>,
        out: &mut Vec<String>,
    ) {
        match node {
            Value::Object(map) => {
                for (k, v) in map {
                    walk(v, k, depth + 1, in_vectors, prose, out);
                }
            }
            Value::Array(items) => items
                .iter()
                .for_each(|v| walk(v, key, depth, in_vectors, prose, out)),
            Value::String(text) => {
                // The recorder's prose sits at the top of its document.
                if depth == 1 && PROSE_KEYS.contains(&key) {
                    prose.push(text.clone());
                } else if !allowed(key, text, in_vectors) {
                    out.push(format!("{key} = {text}"));
                }
            }
            _ => {}
        }
    }
    let mut out = Vec::new();
    walk(doc, "", 0, in_vectors, prose, &mut out);
    out
}

/// The machine's host name, read at test time like the user name.
fn host_name() -> Option<String> {
    fs::read_to_string("/etc/hostname")
        .ok()
        .map(|h| h.trim().to_string())
        .filter(|h| !h.is_empty())
}

/// Forbidden values in free text: the OS user and host names, account
/// names, user homes other than `/home/user`, macOS and root homes,
/// non-placeholder UUIDs, credential prefixes, JWTs, long base64 or hex
/// runs and e-mail addresses.
fn forbidden_in(text: &str) -> Vec<String> {
    let mut found = Vec::new();
    let machine: Vec<String> = ["USER", "LOGNAME"]
        .iter()
        .filter_map(|v| std::env::var(v).ok())
        .chain(host_name())
        .filter(|name| !name.is_empty() && name != "user")
        .collect();
    for name in &machine {
        if text.contains(name.as_str()) {
            found.push(format!("machine name {name}"));
        }
    }
    for name in ACCOUNT_NAMES {
        if text.contains(name) {
            found.push(format!("account name {name}"));
        }
    }
    for home in foreign_homes(text) {
        found.push(format!("home /home/{home}"));
    }
    for root in ["/Users/", "/root/"] {
        if text.contains(root) {
            found.push(format!("home {root}"));
        }
    }
    for uuid in uuids(text) {
        if !uuid.starts_with(PLACEHOLDER_PREFIX) {
            found.push(format!("uuid {uuid}"));
        }
    }
    for prefix in TOKEN_PREFIXES {
        if occurs_as_word_start(text, prefix) {
            found.push(format!("credential prefix {prefix}"));
        }
    }
    if has_jwt(text) {
        found.push("jwt".to_string());
    }
    found.extend(
        secret_runs(text)
            .into_iter()
            .map(|run| format!("long run {run}")),
    );
    if has_email(text) {
        found.push("e-mail".to_string());
    }
    found
}

/// Everything the guard refuses in one fixture file's text.
fn guard(text: &str, in_vectors: bool) -> Vec<String> {
    let doc: Value = match serde_json::from_str(text) {
        Ok(doc) => doc,
        Err(e) => return vec![format!("not valid JSON: {e}")],
    };
    let mut prose = Vec::new();
    let mut found = disallowed_values(&doc, in_vectors, &mut prose);
    found.extend(forbidden_in(text));
    found.extend(prose.iter().flat_map(|p| forbidden_in(p)));
    found
}

#[test]
fn fixtures_hold_no_secret_or_personal_value() {
    let files = fixture_files();
    assert!(!files.is_empty(), "no hook fixture is committed");
    for file in files {
        let text = fs::read_to_string(&file).unwrap();
        let in_vectors = file.file_name().is_some_and(|n| n == files::VECTORS);
        assert_eq!(
            guard(&text, in_vectors),
            Vec::<String>::new(),
            "{}",
            file.display()
        );
    }
}

#[test]
fn the_guard_refuses_planted_personal_values() {
    let planted = [
        "/Users/someone/projects/forgent",
        "/root/.claude/projects/x.jsonl",
        "Jane Doe at example org",
        "someone-thinkpad",
        "aB3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1xY3zA5bC7dE9fG1hJ3kL5mN7pQ9r_-x",
    ];
    for value in planted {
        let payload = serde_json::json!({ "cwd": value, "hook_event_name": "Stop" }).to_string();
        assert_ne!(
            guard(&payload, false),
            Vec::<String>::new(),
            "{value} passed the payload guard"
        );
    }
    let prose = serde_json::json!({ "source": "recorded under /Users/someone/x", "vectors": [] })
        .to_string();
    assert_ne!(
        guard(&prose, true),
        Vec::<String>::new(),
        "a macOS home passed the prose guard"
    );
}

#[test]
fn every_tested_cli_has_its_fixtures() {
    for (cli, version) in tested_against() {
        let dir = hook_fixtures_dir().join(&cli);
        for name in [
            files::STOP,
            files::POST_TOOL_USE,
            files::ACCEPTED_STOP,
            files::ACCEPTED_POST_TOOL_USE,
            files::VECTORS,
        ] {
            assert!(dir.join(name).is_file(), "{cli} has no {name}");
        }
        let vectors: Value =
            serde_json::from_str(&fs::read_to_string(dir.join(files::VECTORS)).unwrap()).unwrap();
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

fn limits_keys() -> Vec<Value> {
    let text = fs::read_to_string(contracts_dir().join("limits.v1.json")).unwrap();
    let contract: Value = serde_json::from_str(&text).unwrap();
    contract["keys"].as_array().unwrap().clone()
}

#[test]
fn every_drained_cli_names_its_hook_topology_shell_head_executables_and_output_bound() {
    use fgos_mailbox::adapters::TestedClis;
    use fgos_mailbox::head::Topology;
    use fgos_mailbox::hook::Adapter;
    let text = fs::read_to_string(contracts_dir().join(ADAPTERS_CONTRACT)).unwrap();
    let tested = TestedClis::from_contract(&text).expect("the adapters contract parses");
    assert_eq!(
        &tested,
        TestedClis::embedded(),
        "the embedded contract is this file"
    );
    for adapter in [Adapter::Claude, Adapter::Codex] {
        assert!(tested.contains(adapter));
        let facts = tested.facts(adapter).expect("a drained CLI has hookFacts");
        assert!(facts.post_tool_use_max_bytes.is_some_and(|b| b > 0));
    }
    // The accepted hop shells and head executables, pinned (review M3, M4):
    // a change to either is a change to the caller check.
    let claude = tested.facts(Adapter::Claude).unwrap();
    assert_eq!(claude.topology, Topology::OneShellHop);
    assert_eq!(claude.hook_shell.as_deref(), Some(Path::new("/bin/sh")));
    let codex = tested.facts(Adapter::Codex).unwrap();
    assert_eq!(codex.topology, Topology::Direct);
    assert_eq!(codex.hook_shell, None);
    assert_eq!(codex.head_executables, vec!["codex".to_string()]);
    assert!(!tested.contains(Adapter::Agy) && tested.facts(Adapter::Agy).is_none());
}

#[test]
fn every_drained_cli_lists_both_channel_facts_and_only_a_channel_not_reaching_the_model_as_user_delivers(
) {
    use fgos_mailbox::adapters::TestedClis;
    use fgos_mailbox::hook::Adapter;
    let text = fs::read_to_string(contracts_dir().join(ADAPTERS_CONTRACT)).unwrap();
    let contract: Value = serde_json::from_str(&text).unwrap();
    for (cli, facts) in contract["hookFacts"].as_object().unwrap() {
        for channel in ["stop", "postToolUse"] {
            let fact = &facts["channels"][channel];
            assert!(fact["deliver"].is_boolean(), "{cli}.{channel}.deliver");
            assert!(
                fact["role"].as_str().is_some_and(|r| !r.is_empty()),
                "{cli}.{channel}.role"
            );
            assert!(
                fact["source"].as_str().is_some_and(|s| !s.is_empty()),
                "{cli}.{channel}.source"
            );
            assert!(
                !(fact["deliver"] == true && fact["role"] == "user"),
                "{cli}.{channel} delivers under the user role"
            );
        }
    }
    let tested = TestedClis::embedded();
    // Codex hands a Stop block reason to the model as a user message, so its
    // Stop takes no mail; Claude Code's Stop still does.
    assert!(!tested.facts(Adapter::Codex).unwrap().stop_delivers);
    assert_eq!(
        contract["hookFacts"]["codex"]["channels"]["stop"]["role"],
        "user"
    );
    assert_eq!(
        contract["hookFacts"]["codex"]["channels"]["postToolUse"]["role"],
        "developer"
    );
    assert!(tested.facts(Adapter::Claude).unwrap().stop_delivers);
    let drains: Vec<String> = tested
        .stop_drains()
        .iter()
        .map(|cli| cli.as_str().to_string())
        .collect();
    assert_eq!(drains, vec!["claude".to_string()]);
}

#[test]
fn the_adapters_contract_refuses_missing_or_inconsistent_hook_facts() {
    use fgos_mailbox::adapters::TestedClis;
    let text = fs::read_to_string(contracts_dir().join(ADAPTERS_CONTRACT)).unwrap();
    let base: Value = serde_json::from_str(&text).unwrap();
    let refused = |label: &str, change: &dyn Fn(&mut Value)| {
        let mut contract = base.clone();
        change(&mut contract);
        assert!(
            TestedClis::from_contract(&contract.to_string()).is_err(),
            "{label} was accepted"
        );
    };
    refused("a tested CLI without hookFacts", &|c| {
        c["hookFacts"].as_object_mut().unwrap().remove("codex");
    });
    refused("hookFacts of a CLI that is not tested", &|c| {
        c["hookFacts"]["agy"] = c["hookFacts"]["codex"].clone();
        c["hookFacts"]["agy"]["measuredOn"]["versions"] = serde_json::json!([]);
    });
    refused("a measuredOn version not under testedAgainst", &|c| {
        c["hookFacts"]["codex"]["measuredOn"]["versions"] = serde_json::json!(["9.9.9"]);
    });
    refused("a direct entry without head executables", &|c| {
        c["hookFacts"]["codex"]["headExecutables"] = serde_json::json!([]);
    });
    refused("a direct entry with a hook shell", &|c| {
        c["hookFacts"]["codex"]["hookShell"] = Value::from("/bin/sh");
    });
    refused("a one-shell-hop entry with a relative hook shell", &|c| {
        c["hookFacts"]["claude"]["hookShell"] = Value::from("sh");
    });
    refused("a one-shell-hop entry without a hook shell", &|c| {
        c["hookFacts"]["claude"]["hookShell"] = Value::Null;
    });
    refused("an unknown topology", &|c| {
        c["hookFacts"]["claude"]["hookTopology"] = Value::from("two-shell-hop");
    });
    refused("an unknown field", &|c| {
        c["hookFacts"]["claude"]["hookShells"] = serde_json::json!(["/bin/sh"]);
    });
    refused("a delivering Stop channel whose role is user", &|c| {
        c["hookFacts"]["codex"]["channels"]["stop"]["deliver"] = Value::from(true);
    });
    refused(
        "a delivering PostToolUse channel whose role is user",
        &|c| {
            c["hookFacts"]["claude"]["channels"]["postToolUse"]["role"] = Value::from("user");
        },
    );
    refused(
        "a PostToolUse channel that delivers without an output bound",
        &|c| {
            c["hookFacts"]["codex"]["postToolUseContextMaxBytes"] = Value::Null;
        },
    );
    for role in [
        "User",
        " user",
        "user ",
        "admin",
        "transcript:",
        "transcript:a b",
    ] {
        let label = format!("a channel role outside the closed set: {role:?}");
        refused(&label, &|c| {
            c["hookFacts"]["codex"]["channels"]["stop"]["role"] = Value::from(role);
        });
    }
    refused("a drained CLI without channel facts", &|c| {
        c["hookFacts"]["claude"]
            .as_object_mut()
            .unwrap()
            .remove("channels");
    });
}

#[test]
fn hook_facts_measured_on_another_platform_are_not_used_so_that_cli_is_quiet_as_untested() {
    use fgos_mailbox::adapters::TestedClis;
    use fgos_mailbox::hook::Adapter;
    let text = fs::read_to_string(contracts_dir().join(ADAPTERS_CONTRACT)).unwrap();
    let mut contract: Value = serde_json::from_str(&text).unwrap();
    contract["hookFacts"]["claude"]["measuredOn"]["platform"] = Value::from("plan9");
    let tested = TestedClis::from_contract(&contract.to_string()).expect("still a valid contract");
    assert!(tested.contains(Adapter::Claude), "still a tested CLI");
    assert!(
        tested.facts(Adapter::Claude).is_none(),
        "facts from another platform never drive the caller check here"
    );
    assert!(
        tested.facts(Adapter::Codex).is_some(),
        "the other CLI is unchanged"
    );
}

#[test]
fn the_limits_contract_holds_the_breaker_and_p95_keys_with_their_sources() {
    let keys = limits_keys();
    let key = |name: &str| {
        keys.iter()
            .find(|k| k["key"] == name)
            .unwrap_or_else(|| panic!("{name} missing"))
            .clone()
    };
    for (name, reader, default, source) in [
        ("mailbox.hook.breaker.failures", "hook", 3, "spec §12"),
        ("mailbox.hook.breaker.pauseSec", "hook", 60, "spec §12"),
        (
            "mailbox.hook.p95TargetMs",
            "harness",
            50,
            "owner decision 2026-10-20",
        ),
    ] {
        let entry = key(name);
        assert_eq!(entry["reader"], reader, "{name}");
        assert_eq!(entry["default"], default, "{name}");
        assert!(entry["source"].as_str().unwrap().contains(source), "{name}");
        assert!(
            entry["status"].as_str().is_some_and(|s| !s.is_empty()),
            "{name}"
        );
    }
}
