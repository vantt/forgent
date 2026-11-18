//! Named definitions through `fgos metrics query --def`: the seven detections and measures that consumers write,
//! over the test-local declarations of the query fixtures; no Observe source names any of their kinds.

use fgos_observe::definition::DEFINITION_SUFFIX;
use fgos_observe::metrics_cli::query::dispatch_query;
use fgos_observe::metrics_cli::RecordEnvironment;
use fgos_observe::record::registry::EmbeddedDeclaration;
use fgos_observe::record::store::RecordDoor;
use fgos_observe::record::types::Record;
use fgos_observe::{ObserveRequest, RecordSource};
use serde_json::{json, Value};
use std::path::{Path, PathBuf};

const NOW: &str = "2026-11-18T12:00:00Z";
const NAMES: [&str; 7] = [
    "head-gone",
    "plan-no-progress",
    "lane-freed",
    "plan-became-ready",
    "watcher-overdue",
    "supervisor-idle-burn",
    "owner-wait",
];

fn fixtures() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../test/fixtures/observe/query")
}

/// An environment with the store's health declaration (the fixture declares the session kinds itself) and a fixed config value per key.
struct TestEnvironment {
    config: Vec<(&'static str, f64)>,
}

impl RecordEnvironment for TestEnvironment {
    fn embedded_declarations(&self) -> Vec<EmbeddedDeclaration> {
        vec![fgos_observe::record::store::HEALTH_DECLARATION]
    }
    fn payload_root(&self) -> Option<PathBuf> {
        None
    }
    fn record_sources(&self) -> Vec<Box<dyn RecordSource>> {
        Vec::new()
    }
    fn config_number(&self, _: &Path, key: &str) -> Result<Option<f64>, String> {
        Ok(self.config.iter().find(|(k, _)| *k == key).map(|(_, v)| *v))
    }
}

fn scratch(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos-definition-{name}-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

/// A project root holding the fixture declarations and the fixture records.
fn project(name: &str, with_declarations: bool) -> PathBuf {
    let root = scratch(name);
    if with_declarations {
        let kinds = root.join(".fgos/observe/kinds");
        std::fs::create_dir_all(&kinds).unwrap();
        std::fs::copy(
            fixtures().join("declarations.json"),
            kinds.join("fixture.json"),
        )
        .unwrap();
    }
    let env = TestEnvironment { config: vec![] };
    let door = RecordDoor::new(root.clone(), env.embedded_declarations(), None);
    for line in std::fs::read_to_string(fixtures().join("records.jsonl"))
        .unwrap()
        .lines()
    {
        let record: Record = serde_json::from_str(line).unwrap();
        if with_declarations {
            assert_eq!(
                door.write(record),
                fgos_observe::record::store::WriteOutcome::Written
            );
        }
    }
    root
}

/// The fixture query, wrapped as a definition file with the kinds it requires.
fn write_definition(dir: &Path, name: &str, mutate: impl FnOnce(&mut Value)) {
    let query: Value = serde_json::from_str(
        &std::fs::read_to_string(fixtures().join(format!("definitions/{name}.json"))).unwrap(),
    )
    .unwrap();
    let requires = query["kind"].clone();
    let mut definition = json!({ "name": name, "requires": requires, "query": query });
    if name == "watcher-overdue" {
        definition["params"] = json!({ "min_running": { "value": 0 } });
    }
    mutate(&mut definition);
    std::fs::write(
        dir.join(format!("{name}{DEFINITION_SUFFIX}")),
        serde_json::to_string(&definition).unwrap(),
    )
    .unwrap();
}

fn query(root: &Path, args: &[&str], env: &TestEnvironment) -> Value {
    let request = ObserveRequest {
        operation: "observe.metrics".to_owned(),
        sub: "query".to_owned(),
        args: args.iter().map(|a| (*a).to_owned()).collect(),
        root: root.to_path_buf(),
        stdin: None,
    };
    dispatch_query(&request, env).unwrap()
}

fn answer<'a>(all: &'a Value, name: &str) -> &'a Value {
    all["definitions"]
        .as_array()
        .unwrap()
        .iter()
        .find(|d| d["name"] == name)
        .unwrap_or_else(|| panic!("no answer named {name}"))
}

fn groups(answer: &Value, key: &str) -> Vec<String> {
    answer["rows"]
        .as_array()
        .unwrap()
        .iter()
        .map(|r| r["group"][key].as_str().unwrap().to_owned())
        .collect()
}

#[test]
fn a_directory_of_definitions_answers_every_detection_in_one_call() {
    let root = project("directory", true);
    let defs = root.join("definitions");
    std::fs::create_dir_all(&defs).unwrap();
    for name in NAMES {
        write_definition(&defs, name, |_| {});
    }
    let all = query(
        &root,
        &["--def", defs.to_str().unwrap(), "--now", NOW],
        &TestEnvironment { config: vec![] },
    );
    assert_eq!(all["definitions"].as_array().unwrap().len(), 7);
    assert_eq!(groups(answer(&all, "head-gone"), "subject.id"), ["h1"]);
    assert_eq!(
        groups(answer(&all, "plan-no-progress"), "subject.id"),
        ["B"]
    );
    assert_eq!(
        groups(answer(&all, "plan-became-ready"), "subject.id"),
        ["E"]
    );
    assert_eq!(
        groups(answer(&all, "lane-freed"), "origin.host"),
        ["alpha", "beta"]
    );
    assert_eq!(
        groups(answer(&all, "owner-wait"), "ref:question"),
        ["q1", "q2"]
    );
    assert_eq!(
        answer(&all, "watcher-overdue")["rows"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
    assert_eq!(
        answer(&all, "supervisor-idle-burn")["rows"][0]["aggs"]
            ["sum:join.gen_ai.usage.input_tokens"],
        300
    );
    for name in NAMES {
        assert!(answer(&all, name)["unmeasured"].is_null(), "{name}");
    }
}

#[test]
fn definition_flags_repeat_and_one_call_returns_the_rows_of_each() {
    let root = project("repeat", true);
    let first = root.join("first");
    let second = root.join("second");
    std::fs::create_dir_all(&first).unwrap();
    std::fs::create_dir_all(&second).unwrap();
    write_definition(&first, "head-gone", |_| {});
    write_definition(&second, "owner-wait", |_| {});
    let all = query(
        &root,
        &[
            "--def",
            first.join("head-gone.query.json").to_str().unwrap(),
            "--def",
            second.to_str().unwrap(),
            "--now",
            NOW,
        ],
        &TestEnvironment { config: vec![] },
    );
    let names: Vec<&str> = all["definitions"]
        .as_array()
        .unwrap()
        .iter()
        .map(|d| d["name"].as_str().unwrap())
        .collect();
    assert_eq!(names, ["head-gone", "owner-wait"]);
}

#[test]
fn a_required_kind_that_is_undeclared_or_has_no_source_is_unmeasured_with_the_reason() {
    // No declarations at all: every fixture kind is undeclared.
    let bare = project("undeclared", false);
    let defs = bare.join("definitions");
    std::fs::create_dir_all(&defs).unwrap();
    write_definition(&defs, "head-gone", |_| {});
    let all = query(
        &bare,
        &["--def", defs.to_str().unwrap(), "--now", NOW],
        &TestEnvironment { config: vec![] },
    );
    assert_eq!(
        answer(&all, "head-gone")["unmeasured"],
        "kind-undeclared: fgos.head.state"
    );

    // A prefix requirement that matches no declared kind is undeclared too, while the query itself is never run.
    let root = project("glob", true);
    let defs = root.join("definitions");
    std::fs::create_dir_all(&defs).unwrap();
    write_definition(&defs, "owner-wait", |d| {
        d["requires"] = json!(["fgos.nothing.*"]);
    });
    let all = query(
        &root,
        &["--def", defs.to_str().unwrap(), "--now", NOW],
        &TestEnvironment { config: vec![] },
    );
    assert_eq!(
        answer(&all, "owner-wait")["unmeasured"],
        "kind-undeclared: fgos.nothing.*"
    );

    // The store serves the declared kinds it holds, so a prefix over stored kinds measures.
    write_definition(&defs, "owner-wait", |d| {
        d["requires"] = json!(["fgos.question.*"]);
    });
    let all = query(
        &root,
        &["--def", defs.to_str().unwrap(), "--now", NOW],
        &TestEnvironment { config: vec![] },
    );
    assert!(answer(&all, "owner-wait")["unmeasured"].is_null());

    // A declared kind nothing has written and no source serves has no source.
    write_definition(&defs, "owner-wait", |d| {
        d["requires"] = json!(["fgos.stale.kind"]);
    });
    let all = query(
        &root,
        &["--def", defs.to_str().unwrap(), "--now", NOW],
        &TestEnvironment { config: vec![] },
    );
    assert_eq!(
        answer(&all, "owner-wait")["unmeasured"],
        "no-source: fgos.stale.kind"
    );
}

#[test]
fn a_config_backed_parameter_is_resolved_by_the_composition_root_and_an_unset_key_is_unmeasured() {
    let root = project("config", true);
    let defs = root.join("definitions");
    std::fs::create_dir_all(&defs).unwrap();
    // Plans running at the newest alpha tick: the threshold decides whether the watcher is overdue.
    write_definition(&defs, "watcher-overdue", |d| {
        d["query"]["where"] = json!([{ "field": "origin.host", "op": "eq", "value": "alpha" }]);
        d["params"] = json!({ "min_running": { "configKey": "supervisor.minRunning" } });
    });
    let rows = |value: f64| {
        let env = TestEnvironment {
            config: vec![("supervisor.minRunning", value)],
        };
        let all = query(
            &root,
            &["--def", defs.to_str().unwrap(), "--now", NOW],
            &env,
        );
        answer(&all, "watcher-overdue")["rows"]
            .as_array()
            .unwrap()
            .len()
    };
    assert_eq!(rows(0.0), 1);
    assert_eq!(rows(1.0), 0);

    let all = query(
        &root,
        &["--def", defs.to_str().unwrap(), "--now", NOW],
        &TestEnvironment { config: vec![] },
    );
    assert_eq!(
        answer(&all, "watcher-overdue")["unmeasured"],
        "config-unset: supervisor.minRunning"
    );
}

#[test]
fn since_and_until_window_every_definition_run_and_a_relative_since_counts_from_now() {
    let root = project("window", true);
    let defs = root.join("definitions");
    std::fs::create_dir_all(&defs).unwrap();
    write_definition(&defs, "head-gone", |_| {});
    write_definition(&defs, "owner-wait", |_| {});
    let env = TestEnvironment { config: vec![] };
    let run = |window: &[&str]| {
        let mut args = vec!["--def", defs.to_str().unwrap(), "--now", NOW];
        args.extend_from_slice(window);
        let all = query(&root, &args, &env);
        (
            groups(answer(&all, "head-gone"), "subject.id"),
            groups(answer(&all, "owner-wait"), "ref:question"),
        )
    };
    // Unbounded, q1 is asked and answered; from 09:15 its asking falls outside, so only q2 pairs up.
    assert_eq!(run(&[]).1, ["q1", "q2"]);
    let absolute = run(&["--since", "2026-11-18T09:15:00Z"]);
    assert_eq!(absolute, (vec!["h1".to_owned()], vec!["q2".to_owned()]));
    assert_eq!(run(&["--since", "-165m"]), absolute);
    // Until 10:30, q2's answer, h1's going and h3's return are outside: only q1 pairs up and h3 is the head gone.
    let until = run(&["--until", "2026-11-18T10:30:00Z"]);
    assert_eq!(until, (vec!["h3".to_owned()], vec!["q1".to_owned()]));
}

#[test]
fn the_grammar_flags_run_one_query_and_a_definition_takes_no_other_flag() {
    let root = project("flags", true);
    let env = TestEnvironment { config: vec![] };
    let by_host = query(
        &root,
        &[
            "--kind",
            "fgos.run.attempt",
            "--by",
            "origin.host",
            "--agg",
            "count",
            "--now",
            NOW,
        ],
        &env,
    );
    assert!(by_host["rows"].as_array().unwrap().len() >= 2);
    assert_eq!(by_host["ok"], true);

    let defs = root.join("definitions");
    std::fs::create_dir_all(&defs).unwrap();
    write_definition(&defs, "head-gone", |_| {});
    let request = ObserveRequest {
        operation: "observe.metrics".to_owned(),
        sub: "query".to_owned(),
        args: ["--def", defs.to_str().unwrap(), "--kind", "fgos.head.state"]
            .iter()
            .map(|a| (*a).to_owned())
            .collect(),
        root: root.clone(),
        stdin: None,
    };
    assert!(dispatch_query(&request, &env)
        .unwrap_err()
        .contains("--kind cannot be used with --def"));
}

#[test]
fn two_definitions_with_one_name_are_refused() {
    let root = project("duplicate", true);
    let defs = root.join("definitions");
    std::fs::create_dir_all(&defs).unwrap();
    write_definition(&defs, "head-gone", |_| {});
    std::fs::copy(
        defs.join("head-gone.query.json"),
        defs.join("copy.query.json"),
    )
    .unwrap();
    let refused = |paths: &[&Path]| {
        let request = ObserveRequest {
            operation: "observe.metrics".to_owned(),
            sub: "query".to_owned(),
            args: paths
                .iter()
                .flat_map(|p| ["--def".to_owned(), p.to_str().unwrap().to_owned()])
                .collect(),
            root: root.clone(),
            stdin: None,
        };
        dispatch_query(&request, &TestEnvironment { config: vec![] }).unwrap_err()
    };
    // Inside one directory, and across two --def paths, with both files named.
    let within = refused(&[&defs]);
    assert!(within.contains("defined twice"), "{within}");
    let across = refused(&[
        &defs.join("copy.query.json"),
        &defs.join("head-gone.query.json"),
    ]);
    assert!(
        across.contains("defined twice") && across.contains("copy.query.json"),
        "{across}"
    );
}
