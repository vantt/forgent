//! The owning proof of start text: compose every recorded head opening and compare it, byte for byte, with the
//! golden captured from the producers it replaced (packages/agent-start-context/goldens/, NOTES.md names the allowed
//! changes). Rules come from the head rule units, personas from core/agents; fact validation is the vector tests'.

use fgos_agent_start_context::{
    compose, FactRegistry, PersonaFields, PersonaLookup, Personas, Ports, RecordSink, Rule,
    RuleSet, StartRecord, StartRequest, ValueType,
};
use fgos_yaml_doc::Profile;
use serde_json::{json, Value};
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};

fn repo() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../../..")
}

fn yaml(path: &Path) -> Value {
    let bytes = std::fs::read(path).unwrap();
    fgos_yaml_doc::parse(&bytes, Profile::Tool, &path.to_string_lossy())
        .unwrap()
        .to_json()
        .unwrap()
}

fn text(v: Option<&Value>) -> String {
    v.and_then(Value::as_str)
        .map(|s| s.trim().to_owned())
        .unwrap_or_default()
}

fn list(v: Option<&Value>) -> Vec<String> {
    v.and_then(Value::as_array)
        .into_iter()
        .flatten()
        .map(|x| text(Some(x)))
        .filter(|t| !t.is_empty())
        .collect()
}

/// The head rule units, read from their files.
struct HeadRules(Vec<Rule>);

impl HeadRules {
    fn read() -> HeadRules {
        let dir = repo().join("core/instructions");
        let mut rules = Vec::new();
        let mut names: Vec<_> = std::fs::read_dir(&dir)
            .unwrap()
            .map(|e| e.unwrap().path())
            .collect();
        names.sort();
        for path in names.into_iter().filter(|p| {
            p.file_name()
                .unwrap()
                .to_string_lossy()
                .starts_with("head-")
        }) {
            let file = std::fs::read_to_string(&path).unwrap();
            let rest = file.strip_prefix("---\n").unwrap();
            let (front, body) = rest.split_once("\n---\n").unwrap();
            let unit = fgos_yaml_doc::parse(front.as_bytes(), Profile::Tool, "unit")
                .unwrap()
                .to_json()
                .unwrap();
            let when = unit["when"]
                .as_object()
                .map(|m| m.iter().map(|(k, v)| (k.clone(), list(Some(v)))).collect())
                .unwrap_or_default();
            rules.push(Rule {
                id: text(unit.get("id")),
                owner: text(unit.get("owner")),
                kind: text(unit.get("kind")),
                body: body.trim_start_matches('\n').to_owned(),
                when,
            });
        }
        HeadRules(rules)
    }
}

impl RuleSet for HeadRules {
    fn digest(&self) -> &str {
        "0000000000000000000000000000000000000000000000000000000000000000"
    }
    fn rules(&self) -> &[Rule] {
        &self.0
    }
}

struct AnyFacts;
impl FactRegistry for AnyFacts {
    fn value_type(&self, _key: &str) -> Option<ValueType> {
        Some(ValueType::String)
    }
    fn allowed(&self, _key: &str) -> Option<Vec<String>> {
        None
    }
}

struct NoRecord;
impl RecordSink for NoRecord {
    fn append(&self, _record: &StartRecord) -> String {
        "golden".into()
    }
}

/// The persona definitions of core/agents, read the way the host reads them.
struct CorePersonas;
impl Personas for CorePersonas {
    fn lookup(&self, persona: &str) -> PersonaLookup {
        let path = repo().join(format!("core/agents/{persona}.yaml"));
        if !path.exists() {
            return PersonaLookup::NotFound;
        }
        let d = yaml(&path);
        PersonaLookup::Found(PersonaFields {
            description: text(d.get("description")),
            voice: text(d.pointer("/persona/voice")),
            style: text(d.pointer("/persona/style")),
            archetype: text(d.pointer("/persona/archetype")),
            skills: list(d.get("skills")),
            can_decide: list(d.pointer("/decision_boundary/can_decide")),
            must_escalate: list(d.pointer("/decision_boundary/must_escalate")),
            on_wake: text(d.get("on_wake")),
        })
    }
}

#[test]
fn every_head_opening_golden_is_composed_byte_for_byte() {
    let goldens = repo().join("packages/agent-start-context/goldens");
    let cases: Value =
        serde_json::from_str(&std::fs::read_to_string(goldens.join("cases.json")).unwrap())
            .unwrap();
    let rules = HeadRules::read();
    let mut checked = 0;
    for case in cases["cases"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|c| c["delivery"] == "opening")
    {
        let persona = case["persona"].as_str().unwrap();
        let mut payloads = vec![json!({"kind": "session", "name": case["name"]})];
        if let Some(task) = case.get("task") {
            payloads.push(json!({"kind": "task", "path": task["path"], "itemKind": "plan"}));
        }
        if let Some(handoff) = case.get("handoff") {
            payloads.push(json!({"kind": "handoff", "path": handoff["path"]}));
        }
        if let Some(q) = case.get("forQuestion") {
            payloads.push(json!({"kind": "for-question", "questionId": q}));
        }
        let request = StartRequest::from_json(&json!({
            "facts": {"sessionType": "head", "persona": persona, "project": "forgent", "agentCli": "claude", "agentLifecycle": "start"},
            "payloads": payloads,
            "delivery": "opening"
        }))
        .unwrap();
        let ports = Ports {
            rules: &rules,
            facts: &AnyFacts,
            record: &NoRecord,
            personas: Some(&CorePersonas),
            contributors: Vec::new(),
            budget_bytes: None,
        };
        let composed = compose(&request, &ports).unwrap().text() + "\n";
        let id = case["id"].as_str().unwrap();
        let golden = std::fs::read_to_string(goldens.join(format!("opening/{id}.txt"))).unwrap();
        assert_eq!(composed, golden, "{id}");
        checked += 1;
    }
    assert_eq!(checked, 20, "every recorded head opening");
    let _ = BTreeMap::<String, String>::new();
}
