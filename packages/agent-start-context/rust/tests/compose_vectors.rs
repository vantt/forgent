//! compose against the golden vectors of contracts/vectors/, the agent context engine's when-keys registry and its
//! effective-set vector, through test adapters of the four ports. Production adapters are the host's.

use fgos_agent_start_context::{
    compose, Contributor, ContributorError, ContributorRow, DropReason, FactRegistry, Ports,
    RecordSink, Rule, RuleSet, StartRecord, StartRequest, ValueType,
};
use serde_json::Value;
use std::cell::RefCell;
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::time::Duration;

fn repo() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..")
}

fn json(rel: &str) -> Value {
    serde_json::from_str(&std::fs::read_to_string(repo().join(rel)).unwrap()).unwrap()
}

/// ACE's registry: value types and static values from when-keys.v2.json, live values from the vector.
struct Registry {
    types: BTreeMap<String, ValueType>,
    values: BTreeMap<String, Vec<String>>,
}

impl Registry {
    fn new(live: &Value) -> Registry {
        let keys = json("packages/agent-context-engine/contracts/when-keys.v2.json");
        let mut types = BTreeMap::new();
        let mut values = BTreeMap::new();
        for key in keys["keys"].as_array().unwrap() {
            let name = key["key"].as_str().unwrap().to_owned();
            let value_type = match key["valueType"].as_str().unwrap() {
                "enum" => ValueType::Enum,
                _ => ValueType::String,
            };
            types.insert(name.clone(), value_type);
            if key["valueSource"]["type"] == "static" {
                let list = key["valueSource"]["values"].as_array().unwrap();
                values.insert(
                    name,
                    list.iter()
                        .map(|v| v.as_str().unwrap().to_owned())
                        .collect(),
                );
            }
        }
        for (name, list) in live.as_object().unwrap() {
            values.insert(
                name.clone(),
                list.as_array()
                    .unwrap()
                    .iter()
                    .map(|v| v.as_str().unwrap().to_owned())
                    .collect(),
            );
        }
        Registry { types, values }
    }
}

impl FactRegistry for Registry {
    fn value_type(&self, key: &str) -> Option<ValueType> {
        self.types.get(key).copied()
    }
    fn allowed(&self, key: &str) -> Option<Vec<String>> {
        self.values.get(key).cloned()
    }
}

struct Rules {
    digest: String,
    rules: Vec<Rule>,
}

impl Rules {
    fn from_effective_set(set: &Value) -> Rules {
        let rules = set["rules"]
            .as_array()
            .unwrap()
            .iter()
            .map(|r| Rule {
                id: r["id"].as_str().unwrap().to_owned(),
                owner: r["owner"].as_str().unwrap().to_owned(),
                kind: r["kind"].as_str().unwrap().to_owned(),
                body: r["body"].as_str().unwrap_or_default().to_owned(),
                when: r["when"]
                    .as_object()
                    .map(|m| {
                        m.iter()
                            .map(|(k, v)| {
                                (
                                    k.clone(),
                                    v.as_array()
                                        .unwrap()
                                        .iter()
                                        .map(|x| x.as_str().unwrap().to_owned())
                                        .collect(),
                                )
                            })
                            .collect()
                    })
                    .unwrap_or_default(),
            })
            .collect();
        Rules {
            digest: set["digest"].as_str().unwrap().to_owned(),
            rules,
        }
    }
}

impl RuleSet for Rules {
    fn digest(&self) -> &str {
        &self.digest
    }
    fn rules(&self) -> &[Rule] {
        &self.rules
    }
}

#[derive(Default)]
struct Records(RefCell<Vec<StartRecord>>);

impl RecordSink for Records {
    fn append(&self, record: &StartRecord) -> String {
        let mut records = self.0.borrow_mut();
        records.push(record.clone());
        format!("start-{}", records.len())
    }
}

fn vectors() -> Vec<(String, Value)> {
    let mut out = Vec::new();
    let dir = repo().join("packages/agent-start-context/contracts/vectors");
    for sub in [dir.clone(), dir.join("refusals")] {
        let mut names: Vec<_> = std::fs::read_dir(&sub)
            .unwrap()
            .map(|e| e.unwrap().path())
            .filter(|p| p.extension().is_some_and(|e| e == "json"))
            .collect();
        names.sort();
        for path in names {
            out.push((
                path.file_name().unwrap().to_string_lossy().into_owned(),
                serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap(),
            ));
        }
    }
    out
}

#[test]
fn every_golden_vector_gets_its_expected_context_or_refusal() {
    let mut ran = 0;
    for (name, vector) in vectors() {
        let expect = &vector["expect"];
        // A rule set that does not verify is refused by the agent context engine's reader, wired in a later phase.
        if expect["refusal"] == "start-rule-set-invalid" {
            continue;
        }
        let rule_set = match &vector["ruleSet"] {
            Value::String(rel) => json(rel),
            inline => inline.clone(),
        };
        let rules = Rules::from_effective_set(&rule_set);
        let registry = Registry::new(&vector["liveValues"]);
        let records = Records::default();
        let ports = Ports {
            rules: &rules,
            facts: &registry,
            record: &records,
            contributors: Vec::new(),
            budget_bytes: None,
        };
        let answer = StartRequest::from_json(&vector["request"])
            .and_then(|request| compose(&request, &ports));
        match expect["refusal"].as_str() {
            Some(code) => {
                let refusal = answer.expect_err(&format!("{name}: expected the refusal {code}"));
                assert_eq!(refusal.code.as_str(), code, "{name}: {refusal}");
                if let Some(missing) = expect["missing"].as_array() {
                    let want: Vec<String> = missing
                        .iter()
                        .map(|m| m.as_str().unwrap().to_owned())
                        .collect();
                    assert_eq!(refusal.missing, want, "{name}");
                }
                assert!(
                    records.0.borrow().is_empty(),
                    "{name}: a refused start writes no record"
                );
            }
            None => {
                let context = answer.unwrap_or_else(|refusal| panic!("{name}: {refusal}"));
                let sources: Vec<&str> = context.blocks.iter().map(|b| b.source.as_str()).collect();
                let want: Vec<&str> = expect["blockSources"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|s| s.as_str().unwrap())
                    .collect();
                assert_eq!(sources, want, "{name}");
                let matched: Vec<&str> = expect["matched"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|s| s.as_str().unwrap())
                    .collect();
                assert_eq!(context.matched, matched, "{name}");
                assert_eq!(
                    context.rule_set_digest,
                    expect["ruleSetDigest"].as_str().unwrap(),
                    "{name}"
                );
                assert!(
                    context.blocks.iter().all(|b| b.bytes == b.text.len()),
                    "{name}: bytes is the UTF-8 length"
                );
                assert_eq!(records.0.borrow().len(), 1, "{name}: one record per start");
                assert_eq!(context.record, "start-1", "{name}");
            }
        }
        ran += 1;
    }
    assert!(ran >= 8, "every vector but the rule-set one ran ({ran})");
}

fn rule(id: &str, kind: &str, body: &str) -> Rule {
    Rule {
        id: id.into(),
        owner: "core".into(),
        kind: kind.into(),
        body: body.into(),
        when: BTreeMap::new(),
    }
}

fn head_request() -> StartRequest {
    let raw = serde_json::json!({
        "facts": {"sessionType": "head", "persona": "lead", "project": "forgent", "agentCli": "claude", "agentLifecycle": "start"},
        "payloads": [{"kind": "task", "path": "plans/x/plan.md", "itemKind": "plan"}],
        "delivery": "opening"
    });
    StartRequest::from_json(&raw).unwrap()
}

fn live() -> Value {
    serde_json::json!({"persona": ["lead"], "project": ["forgent"], "agentCli": ["claude"], "role": ["producer"]})
}

struct Fixed(Result<Option<String>, ContributorError>);
impl Contributor for Fixed {
    fn contribute(
        &self,
        _facts: &BTreeMap<String, String>,
        _timeout: Duration,
    ) -> Result<Option<String>, ContributorError> {
        self.0.clone()
    }
}

fn row(id: &str) -> ContributorRow {
    ContributorRow {
        id: id.into(),
        when: BTreeMap::new(),
        owner: "session-host".into(),
        budget_bytes: 1000,
        timeout_ms: 50,
    }
}

#[test]
fn blocks_come_in_rule_then_payload_then_contributor_order_and_the_budget_drops_contributors_then_late_rules_never_laws_or_payloads(
) {
    let rules = Rules {
        digest: "d".repeat(64),
        rules: vec![
            rule("law-a", "law", "LAW"),
            rule("proc-b", "procedure", "PROCEDURE-B"),
            rule("proc-c", "procedure", "PROCEDURE-C"),
        ],
    };
    let registry = Registry::new(&live());
    let records = Records::default();
    let live_ctx = Fixed(Ok(Some("LIVE".into())));
    let request = head_request();

    let ports = Ports {
        rules: &rules,
        facts: &registry,
        record: &records,
        contributors: vec![(row("handoff"), &live_ctx)],
        budget_bytes: None,
    };
    let all = compose(&request, &ports).unwrap();
    let ids: Vec<&str> = all.blocks.iter().map(|b| b.id.as_str()).collect();
    assert_eq!(ids, ["law-a", "proc-b", "proc-c", "task", "handoff"]);

    // Room for the law, the task and one procedure only: the contributor goes first, then the latest rule.
    let task_bytes = all.blocks[3].bytes;
    let budget = 3 + 11 + task_bytes;
    let ports = Ports {
        rules: &rules,
        facts: &registry,
        record: &records,
        contributors: vec![(row("handoff"), &live_ctx)],
        budget_bytes: Some(budget),
    };
    let cut = compose(&request, &ports).unwrap();
    let ids: Vec<&str> = cut.blocks.iter().map(|b| b.id.as_str()).collect();
    assert_eq!(ids, ["law-a", "proc-b", "task"]);
    let dropped: Vec<(&str, DropReason)> = cut
        .dropped
        .iter()
        .map(|d| (d.id.as_str(), d.reason))
        .collect();
    assert_eq!(
        dropped,
        [
            ("handoff", DropReason::OverBudget),
            ("proc-c", DropReason::OverBudget)
        ]
    );
    assert_eq!(
        cut.matched,
        ["law-a", "proc-b"],
        "a dropped rule is not reported as matched"
    );

    // A budget below the required blocks keeps them all: laws and payloads are never dropped.
    let ports = Ports {
        rules: &rules,
        facts: &registry,
        record: &records,
        contributors: Vec::new(),
        budget_bytes: Some(1),
    };
    let floor = compose(&request, &ports).unwrap();
    let ids: Vec<&str> = floor.blocks.iter().map(|b| b.id.as_str()).collect();
    assert_eq!(ids, ["law-a", "task"]);
    let last = records.0.borrow().last().cloned().unwrap();
    assert_eq!(last.dropped.len(), 2, "every drop is in the record");
}

#[test]
fn a_contributor_that_fails_or_times_out_is_left_out_and_recorded_and_the_start_goes_on() {
    let rules = Rules {
        digest: "d".repeat(64),
        rules: vec![rule("law-a", "law", "LAW")],
    };
    let registry = Registry::new(&live());
    let records = Records::default();
    let broken = Fixed(Err(ContributorError::Failed("socket closed".into())));
    let slow = Fixed(Err(ContributorError::Timeout));
    let ok = Fixed(Ok(Some("LIVE".into())));
    let mut scoped = row("workers-only");
    scoped
        .when
        .insert("sessionType".into(), vec!["worker".into()]);
    let ports = Ports {
        rules: &rules,
        facts: &registry,
        record: &records,
        contributors: vec![
            (row("broken"), &broken),
            (row("slow"), &slow),
            (scoped, &ok),
            (row("ok"), &ok),
        ],
        budget_bytes: None,
    };
    let context = compose(&head_request(), &ports).unwrap();
    let ids: Vec<&str> = context.blocks.iter().map(|b| b.id.as_str()).collect();
    assert_eq!(
        ids,
        ["law-a", "task", "ok"],
        "a contributor whose when: does not match is not called"
    );
    let dropped: Vec<(&str, DropReason)> = context
        .dropped
        .iter()
        .map(|d| (d.id.as_str(), d.reason))
        .collect();
    assert_eq!(
        dropped,
        [
            ("broken", DropReason::ContributorFailed),
            ("slow", DropReason::ContributorTimeout)
        ]
    );
    assert_eq!(records.0.borrow()[0].dropped, context.dropped);
}

#[test]
fn the_task_and_question_payloads_keep_the_words_a_head_receives_today() {
    let raw = serde_json::json!({
        "facts": {"sessionType": "head", "persona": "lead", "project": "forgent", "agentCli": "claude", "agentLifecycle": "start"},
        "payloads": [
            {"kind": "task", "path": "plans/261122-1946-agent-start-context/plan.md", "itemKind": "plan"},
            {"kind": "for-question", "questionId": "q-golden0001"}
        ],
        "delivery": "opening"
    });
    let request = StartRequest::from_json(&raw).unwrap();
    let rules = Rules {
        digest: "d".repeat(64),
        rules: Vec::new(),
    };
    let registry = Registry::new(&live());
    let records = Records::default();
    let ports = Ports {
        rules: &rules,
        facts: &registry,
        record: &records,
        contributors: Vec::new(),
        budget_bytes: None,
    };
    let context = compose(&request, &ports).unwrap();
    let lead_task = std::fs::read_to_string(
        repo().join("packages/agent-start-context/goldens/opening/lead-task.txt"),
    )
    .unwrap();
    let lead_question = std::fs::read_to_string(
        repo().join("packages/agent-start-context/goldens/opening/lead-question.txt"),
    )
    .unwrap();
    assert!(
        lead_task.contains(&context.blocks[0].text),
        "{}",
        context.blocks[0].text
    );
    assert!(
        lead_question.contains(&context.blocks[1].text),
        "{}",
        context.blocks[1].text
    );
}
