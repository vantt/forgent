//! Replays the vectors of `packages/execution/contracts/executor-model.v1.json`, the one owner of what an
//! executor entry means (contract: `docs/platform/runner/contracts/executor-model.md`). The vectors are read, never
//! copied. A vector marked `knownDefect` records behaviour that looks wrong; the port keeps it, so it is replayed
//! like any other.

use fgos_execution::accounts::{legacy_state_key, provider_account_inventory, read_llm_accounts};
use fgos_execution::executor_model::{
    agent_cli_missing_refusal, capability_confinement, credential_store_of, family_of,
    launch_facts, lookup_executor, mechanism, rendered_effort_levels, resolve_executor_governance,
    resolve_executor_provider, resolve_posture_invocation, tool_for_entries, with_default_executor,
    Candidate, FamilySource, Governance, ModelError, Session,
};
use fgos_execution::ports::{Backend, Machine};
use serde_json::{json, Map, Value};
use std::collections::BTreeMap;

/// Facts whose derivation reads state this crate does not own yet; each names the phase that ports it and replays
/// the same vectors. `toolProviders` is replayed here for what an entry says (who serves a capability, its mcp tool
/// and command); the live status of each waits for the probe port.
const REPLAYED_LATER: &[(&str, &str)] = &[
    ("accountQuarantine", "reads the lease state file (the bind)"),
    ("validate", "the runner semantic check (the decision)"),
];

struct VectorMachine {
    path_commands: Vec<String>,
    registry: Option<Value>,
    home: Option<String>,
    herdr: bool,
}

impl VectorMachine {
    fn of(vector: &Value, herdr: bool) -> Self {
        let machine = vector.get("machine");
        let registry = machine
            .and_then(|m| m.get("registry"))
            .and_then(|doc| match doc {
                Value::String(raw) => serde_json::from_str::<Value>(raw).ok(),
                Value::Null => None,
                other => Some(other.clone()),
            })
            .filter(|doc| {
                doc.get("contract") == Some(&json!("confinement-backend-registry.v1"))
                    && doc.get("confinementBackends").is_some_and(Value::is_object)
            });
        VectorMachine {
            path_commands: machine
                .and_then(|m| m.get("pathCommands"))
                .and_then(Value::as_array)
                .map(|list| {
                    list.iter()
                        .filter_map(|c| c.as_str().map(str::to_string))
                        .collect()
                })
                .unwrap_or_default(),
            registry,
            home: machine
                .and_then(|m| m.get("home"))
                .and_then(Value::as_str)
                .map(str::to_string),
            herdr,
        }
    }
}

impl Machine for VectorMachine {
    fn on_path(&self, program: &str) -> bool {
        !program.contains('/') && self.path_commands.iter().any(|c| c == program)
    }

    fn posture_backend(&self, id: &str) -> Option<Backend> {
        let instance = self
            .registry
            .as_ref()?
            .get("confinementBackends")?
            .get(id)?;
        Some(Backend {
            enabled: instance.get("enabled") != Some(&json!(false)),
            kind: instance
                .get("type")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string(),
            executable: instance
                .get("executable")
                .and_then(Value::as_str)
                .filter(|e| !e.is_empty())
                .map(str::to_string),
        })
    }

    fn herdr_present(&self) -> bool {
        self.herdr
    }

    fn home_dir(&self) -> Option<String> {
        self.home.clone()
    }
}

fn refused(error: ModelError) -> Value {
    json!({ "error": error.to_json() })
}

fn answer_or_refusal<T: Into<Value>>(result: Result<T, ModelError>) -> Value {
    result.map(Into::into).unwrap_or_else(refused)
}

fn args_of(vector: &Value) -> &Value {
    vector.get("args").unwrap_or(&Value::Null)
}

fn runner_of(vector: &Value) -> &Value {
    vector.get("runner").unwrap_or(&Value::Null)
}

fn string_list(value: Option<&Value>) -> Vec<String> {
    value
        .and_then(Value::as_array)
        .map(|list| {
            list.iter()
                .filter_map(|s| s.as_str().map(str::to_string))
                .collect()
        })
        .unwrap_or_default()
}

fn evaluate(vector: &Value) -> Option<Value> {
    let fact = vector["fact"].as_str().expect("a vector names its fact");
    let args = args_of(vector);
    let runner = runner_of(vector);
    let herdr_arg = args.get("herdrPresent") == Some(&json!(true));
    let machine = VectorMachine::of(vector, herdr_arg);
    Some(match fact {
        "defaultExecutor" => with_default_executor(runner),
        "family" => {
            let source = match (vector.get("entry"), args.get("source")) {
                (Some(entry), _) => FamilySource::from_json(Some(entry)),
                (None, source) => FamilySource::from_json(source),
            };
            json!(family_of(
                source,
                args.get("command").and_then(Value::as_str)
            ))
        }
        "executorLookup" => {
            let found = lookup_executor(runner, args.get("executorId").and_then(Value::as_str));
            let mut out = Map::new();
            out.insert("executorId".into(), json!(found.executor_id));
            if let Some(entry) = found.executor {
                out.insert("executor".into(), entry.clone());
            }
            out.insert("configured".into(), json!(found.configured));
            out.insert("bindingSource".into(), json!(found.binding_source));
            Value::Object(out)
        }
        "governance" => {
            let options = args.get("options").unwrap_or(&Value::Null);
            let governance = Governance {
                disallowed_providers: string_list(options.get("disallowedProviders")),
                disallowed_executors: string_list(options.get("disallowedExecutors")),
            };
            let primary = args["primaryExecutor"]
                .as_str()
                .expect("governance names an executor");
            answer_or_refusal(resolve_executor_provider(runner, primary, &governance).and_then(|resolved| {
                let canonical = resolve_executor_governance(primary, &resolved.family, &governance)?;
                Ok(json!({ "resolvedProvider": resolved.family, "canonicalProvider": canonical }))
            }))
        }
        "capabilityConfinement" => {
            let capability = args["capability"].as_str().unwrap_or_default();
            capability_confinement(runner, capability)
                .cloned()
                .unwrap_or(Value::Null)
        }
        "credentialStore" => credential_store_of(&args["invocation"])
            .cloned()
            .unwrap_or(Value::Null),
        "effortLevels" => json!(rendered_effort_levels(
            args.get("command").and_then(Value::as_str)
        )),
        "mechanism" => json!(mechanism(
            runner,
            args.get("executorId").and_then(Value::as_str),
            args.get("hasLiveTaskAccess") == Some(&json!(true)),
        )
        .as_str()),
        "posture" => {
            let candidate = &args["candidate"];
            let posture = resolve_posture_invocation(
                runner,
                &Candidate {
                    executor: candidate.get("executor").and_then(Value::as_str),
                    invocation: candidate.get("invocation").and_then(Value::as_str),
                },
                &machine,
            );
            json!({ "ok": posture.ok, "invocation": posture.invocation })
        }
        "launchFacts" => {
            let session = args.get("session").unwrap_or(&Value::Null);
            let machine =
                VectorMachine::of(vector, session.get("herdrPresent") == Some(&json!(true)));
            let facts = launch_facts(
                runner,
                &Session {
                    has_native_agent: session.get("hasNativeAgent") == Some(&json!(true)),
                    posture_at_launch: session.get("postureAtLaunch") == Some(&json!(true)),
                },
                &machine,
            );
            Value::Object(
                facts
                    .into_iter()
                    .map(|(id, facts)| (id, json!(facts)))
                    .collect(),
            )
        }
        "missingCli" => {
            let session = Session {
                has_native_agent: args.get("hasNativeAgent") == Some(&json!(true)),
                posture_at_launch: false,
            };
            match agent_cli_missing_refusal(runner, &session, &machine) {
                Some(refusal) => json!(refusal),
                None => Value::Null,
            }
        }
        "accountInventory" => {
            answer_or_refusal(provider_account_inventory(runner, &machine).map(Value::Object))
        }
        "llmAccounts" => read_llm_accounts(runner, &machine).to_json(),
        "stateKey" => json!(legacy_state_key(args["pool"].as_str().unwrap_or_default())),
        "toolProviders" => {
            // What an entry says: who serves the capability, with its mcp tool and cli command. The expected
            // answer also carries each tool's live `status`, which the probe port replays later.
            let capability = args.get("capability").and_then(Value::as_str);
            let served = tool_for_entries(runner, capability);
            Value::Array(
                served
                    .into_iter()
                    .map(|entry| {
                        let mut out = Map::new();
                        out.insert("executorId".into(), json!(entry.executor_id));
                        out.insert("capability".into(), json!(entry.capability));
                        if let Some(tool) = entry.mcp_tool {
                            out.insert("mcpTool".into(), json!(tool));
                        }
                        if let Some(command) = entry.command {
                            out.insert("command".into(), json!(command));
                        }
                        Value::Object(out)
                    })
                    .collect(),
            )
        }
        _ => return None,
    })
}

/// The expected answer, reduced to what `evaluate` can state for the fact.
fn expected(vector: &Value) -> Value {
    let expect = vector["expect"].clone();
    if vector["fact"] != "toolProviders" {
        return expect;
    }
    Value::Array(
        expect
            .as_array()
            .expect("a tool provider vector lists providers")
            .iter()
            .map(|provider| {
                let mut kept = provider
                    .as_object()
                    .expect("a provider is an object")
                    .clone();
                kept.remove("status");
                Value::Object(kept)
            })
            .collect(),
    )
}

#[test]
fn every_executor_model_vector_has_the_answer_the_contract_records() {
    let path = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../contracts/executor-model.v1.json"
    );
    let contract: Value =
        serde_json::from_str(&std::fs::read_to_string(path).expect("the vector file is committed"))
            .expect("the vector file is JSON");
    assert_eq!(contract["version"], "executor-model.v1");
    let vectors = contract["vectors"].as_array().expect("vectors");

    let mut replayed: BTreeMap<String, usize> = BTreeMap::new();
    let mut later: BTreeMap<String, usize> = BTreeMap::new();
    let mut wrong = Vec::new();
    for vector in vectors {
        let fact = vector["fact"].as_str().expect("fact").to_string();
        if REPLAYED_LATER
            .iter()
            .any(|(later_fact, _)| *later_fact == fact)
        {
            *later.entry(fact).or_default() += 1;
            continue;
        }
        match evaluate(vector) {
            Some(answer) if answer == expected(vector) => *replayed.entry(fact).or_default() += 1,
            Some(answer) => wrong.push(format!(
                "{}\n   got      {}\n   expected {}",
                vector["name"].as_str().unwrap_or_default(),
                answer,
                expected(vector)
            )),
            None => panic!(
                "vector {:?} names the fact {fact:?} that nothing replays",
                vector["name"]
            ),
        }
    }
    assert!(
        wrong.is_empty(),
        "{} vectors differ:\n{}",
        wrong.len(),
        wrong.join("\n")
    );

    let facts: Vec<&str> = contract["facts"]
        .as_array()
        .unwrap()
        .iter()
        .map(|f| f.as_str().unwrap())
        .collect();
    for fact in &facts {
        assert!(
            replayed.contains_key(*fact) || later.contains_key(*fact),
            "the fact {fact} has no replay and is not listed in REPLAYED_LATER"
        );
    }
    assert_eq!(
        replayed.values().sum::<usize>() + later.values().sum::<usize>(),
        vectors.len()
    );
}
