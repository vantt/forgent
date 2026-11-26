//! The contract vectors of `contracts/`: the refusal list, the valid unit, one vector per refusal, the effective set
//! with its digest, and the round trip of the digest.

use std::collections::BTreeSet;
use std::fs;
use std::path::{Path, PathBuf};

use fgos_agent_context_engine::check::{
    check, check_nearest, NearestHit, NearestRules, OwnerList, SearchUnavailable,
};
use fgos_agent_context_engine::refusal::{Refusal, RefusalCode};
use fgos_agent_context_engine::rule::{Lifecycle, RuleFile};
use fgos_agent_context_engine::set::{digest_of, EffectiveSet};
use fgos_agent_context_engine::when_keys::{registry, KeySource, NoLiveValues};
use serde_json::Value;

fn contracts() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR")).join("../contracts")
}

fn json(path: &Path) -> Value {
    serde_json::from_str(
        &fs::read_to_string(path).unwrap_or_else(|e| panic!("{}: {e}", path.display())),
    )
    .unwrap_or_else(|e| panic!("{}: {e}", path.display()))
}

fn vector(name: &str) -> Value {
    json(&contracts().join("vectors").join(name))
}

fn refusal_vectors() -> Vec<(String, Value)> {
    let dir = contracts().join("vectors/refusals");
    let mut files: Vec<_> = fs::read_dir(dir)
        .unwrap()
        .filter_map(Result::ok)
        .map(|e| e.path())
        .collect();
    files.sort();
    files
        .into_iter()
        .map(|p| {
            (
                p.file_stem().unwrap().to_string_lossy().into_owned(),
                json(&p),
            )
        })
        .collect()
}

fn source_of(entry: &Value, unit: &Value) -> String {
    entry
        .get("source")
        .and_then(Value::as_str)
        .map(str::to_string)
        .unwrap_or_else(|| format!("core/instructions/{}.md", unit["id"].as_str().unwrap()))
}

fn read_entry(entry: &Value) -> Result<RuleFile, Refusal> {
    let unit = &entry["unit"];
    RuleFile::read(
        unit,
        entry["body"].as_str().unwrap(),
        &source_of(entry, unit),
    )
}

/// The vector as the corpus the check runs over: the unit and its `others`, all read.
fn corpus_of(vector: &Value) -> Result<Vec<RuleFile>, Refusal> {
    let mut corpus = vec![read_entry(vector)?];
    for other in vector
        .get("others")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
    {
        corpus.push(read_entry(other)?);
    }
    Ok(corpus)
}

fn owners() -> OwnerList {
    OwnerList(
        ["coding", "packaging-distribution"]
            .iter()
            .map(|s| s.to_string())
            .collect(),
    )
}

fn in_force(corpus: &[RuleFile]) -> BTreeSet<String> {
    corpus
        .iter()
        .filter(|f| {
            !matches!(
                f.unit.lifecycle,
                Lifecycle::Draft | Lifecycle::Rejected | Lifecycle::Retracted
            )
        })
        .map(|f| f.unit.id.clone())
        .collect()
}

fn refusals_of(vector: &Value) -> Vec<Refusal> {
    match corpus_of(vector) {
        Err(refusal) => vec![refusal],
        Ok(corpus) => check(&corpus, &in_force(&corpus), &owners(), &NoLiveValues),
    }
}

/// The search port answering what the vector's `nearest` says: hits with scores, or that the search cannot run.
struct VectorSearch(Value);

impl NearestRules for VectorSearch {
    fn nearest(&self, _: &RuleFile) -> Result<Vec<NearestHit>, SearchUnavailable> {
        if let Some(why) = self.0.get("unavailable").and_then(Value::as_str) {
            return Err(SearchUnavailable(why.to_string()));
        }
        Ok(self.0["hits"]
            .as_array()
            .unwrap()
            .iter()
            .map(|h| NearestHit {
                id: h["id"].as_str().unwrap().to_string(),
                score: h["score"].as_f64().unwrap() as f32,
            })
            .collect())
    }
}

/// The refusals of the nearest-rule check of the vector's own unit, the first of its corpus.
fn nearest_refusals_of(vector: &Value) -> Vec<Refusal> {
    let corpus = corpus_of(vector).expect("the vector reads");
    let search = VectorSearch(vector["nearest"].clone());
    let threshold = vector["nearest"]["threshold"].as_f64().unwrap() as f32;
    check_nearest(
        &[&corpus[0]],
        &corpus,
        &in_force(&corpus),
        threshold,
        &search,
    )
    .refusals
}

#[test]
fn the_refusal_codes_categories_and_phases_are_those_of_the_contract() {
    let doc = json(&contracts().join("refusals.v1.json"));
    let listed: Vec<&Value> = doc["refusals"].as_array().unwrap().iter().collect();
    assert_eq!(listed.len(), RefusalCode::ALL.len());
    for row in listed {
        let code = RefusalCode::parse(row["code"].as_str().unwrap())
            .unwrap_or_else(|| panic!("unknown code {}", row["code"]));
        assert_eq!(code.category().as_str(), row["category"], "{code}");
        assert_eq!(code.phase().as_str(), row["phase"], "{code}");
    }
}

#[test]
fn the_when_key_registry_is_the_contract_with_its_version() {
    let doc = json(&contracts().join("when-keys.v2.json"));
    let keys = registry();
    assert_eq!(u64::from(keys.version), doc["version"].as_u64().unwrap());
    assert_eq!(keys.version, 2);
    let names: Vec<&str> = keys.keys.iter().map(|k| k.key.as_str()).collect();
    assert_eq!(
        names,
        [
            "domain",
            "workType",
            "workflow",
            "stage",
            "project",
            "persona",
            "role",
            "sessionType",
            "agentFamily",
            "agentCli",
            "agentLifecycle"
        ]
    );
    let fixed = |key: &str, values: &[&str]| {
        assert_eq!(
            keys.get(key).unwrap().source,
            KeySource::Static(values.iter().map(|v| v.to_string()).collect()),
            "{key}"
        );
    };
    fixed("sessionType", &["head", "worker", "hand-opened"]);
    fixed("agentFamily", &["claude", "openai", "gemini"]);
    fixed("agentLifecycle", &["start", "rotate"]);
    assert_eq!(
        keys.get("agentCli").unwrap().source,
        KeySource::Live("agent-protocol adapters".into())
    );
}

#[test]
fn the_valid_unit_vector_is_clean() {
    let v = vector("valid-unit.json");
    assert_eq!(v["expect"], "valid");
    assert_eq!(refusals_of(&v), Vec::<Refusal>::new());
}

#[test]
fn every_refusal_of_the_contract_has_a_vector_that_raises_it() {
    let vectors = refusal_vectors();
    let named: BTreeSet<String> = vectors.iter().map(|(n, _)| n.clone()).collect();
    let all: BTreeSet<String> = RefusalCode::ALL
        .iter()
        .map(|c| c.as_str().to_string())
        .collect();
    assert_eq!(named, all, "one vector per refusal code");
    for (name, v) in vectors {
        let expected = RefusalCode::parse(v["expect"]["refusal"].as_str().unwrap()).unwrap();
        assert_eq!(expected.as_str(), name);
        if v.get("set").is_some() {
            let bytes = serde_json::to_vec(&v["set"]).unwrap();
            assert_eq!(
                EffectiveSet::read(&bytes)
                    .expect_err("the set is refused")
                    .code,
                expected,
                "{name}"
            );
        } else if v.get("nearest").is_some() {
            let found: Vec<RefusalCode> = nearest_refusals_of(&v).iter().map(|r| r.code).collect();
            assert_eq!(found, [expected], "{name}");
        } else {
            let found: Vec<RefusalCode> = refusals_of(&v).iter().map(|r| r.code).collect();
            assert!(found.contains(&expected), "{name}: raised {found:?}");
        }
    }
}

#[test]
fn the_effective_set_vector_reads_and_its_digest_is_the_canonical_digest_of_its_rules() {
    let v = vector("effective-set.json");
    let bytes = serde_json::to_vec(&v).unwrap();
    let set = EffectiveSet::read(&bytes).expect("the vector is a valid set");
    assert_eq!(set.digest, v["digest"].as_str().unwrap());
    assert_eq!(digest_of(&v["rules"]), set.digest);
}

#[test]
fn a_set_compiled_from_the_valid_unit_is_the_effective_set_vector() {
    let v = vector("valid-unit.json");
    let corpus = corpus_of(&v).unwrap();
    let ordered = fgos_agent_context_engine::compose::compose(&corpus, &in_force(&corpus)).unwrap();
    let compiled = EffectiveSet::from_composed(&ordered);
    let expected: EffectiveSet = serde_json::from_value(vector("effective-set.json")).unwrap();
    assert_eq!(compiled, expected);
}

#[test]
fn the_unit_schema_requires_what_the_reader_requires() {
    let doc = json(&contracts().join("rule-unit.v1.json"));
    let required: Vec<&str> = doc["schema"]["required"]
        .as_array()
        .unwrap()
        .iter()
        .filter_map(Value::as_str)
        .collect();
    assert_eq!(
        required,
        [
            "id",
            "owner",
            "kind",
            "mode",
            "scope",
            "specificity",
            "title",
            "lifecycle",
            "valid_from"
        ]
    );
    let props = doc["schema"]["properties"].as_object().unwrap();
    let known: BTreeSet<&str> = props.keys().map(String::as_str).collect();
    let valid = vector("valid-unit.json");
    for key in valid["unit"].as_object().unwrap().keys() {
        assert!(known.contains(key.as_str()), "{key}");
    }
    let edges: Vec<&str> = doc["pkm"]["edges"]
        .as_array()
        .unwrap()
        .iter()
        .filter_map(Value::as_str)
        .collect();
    assert_eq!(
        edges,
        ["refines", "depends_on", "conflicts_with", "related"]
    );
}
