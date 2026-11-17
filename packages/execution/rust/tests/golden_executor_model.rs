//! Replays the vectors of `packages/execution/contracts/executor-model.v1.json`, the one owner of what an
//! executor entry means (contract: `docs/platform/runner/contracts/executor-model.md`). The vectors are read, never
//! copied. A vector marked `knownDefect` records behaviour that looks wrong; the port keeps it, so it is replayed
//! like any other.

mod common;

use common::VectorMachine;

use fgos_execution::accounts::{legacy_state_key, provider_account_inventory, read_llm_accounts};
use fgos_execution::bind::{preflight, AccountPin, BindSession};
use fgos_execution::executor_model::{
    agent_cli_missing_refusal, capability_confinement, credential_store_of, family_of,
    launch_facts, lookup_executor, mechanism, rendered_effort_levels, resolve_executor_governance,
    resolve_executor_provider, resolve_posture_invocation, tool_for_entries, with_default_executor,
    Candidate, FamilySource, Governance, ModelError, Session,
};
use serde_json::{json, Map, Value};

/// What this replay does not state yet, so a vector can never be skipped unseen. An entry is (fact, field, owning
/// module): with a field, only that field of the expected answer is left out of the comparison; with none, the
/// whole fact is not replayed and `evaluate` must still know nothing of it. The module named is the one that
/// replays it from this same file and removes the entry.
const REPLAYED_LATER: &[(&str, Option<&str>, &str)] = &[
    ("validate", None, "runner_check.rs"),
    ("toolProviders", Some("status"), "tools.rs"),
];

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
        "accountQuarantine" => {
            // The lease state arrives as Dispatch's adapter reads it (`leaseRead`), never as the document.
            let account = &args["account"];
            let pin = AccountPin {
                pool: account["pool"].as_str().unwrap_or_default().to_string(),
                id: account["id"].as_str().unwrap_or_default().to_string(),
            };
            let facts = preflight(
                runner,
                &BindSession::default(),
                Some(&pin),
                vector.get("leaseRead"),
                &machine,
                args["now"].as_u64().expect("a quarantine vector states now"),
            );
            json!(facts.pin_quarantined_until)
        }
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

/// The expected answer without the fields `REPLAYED_LATER` leaves out for the vector's fact.
fn expected(vector: &Value) -> Value {
    let dropped: Vec<&str> = REPLAYED_LATER
        .iter()
        .filter(|(fact, field, _)| vector["fact"] == *fact && field.is_some())
        .filter_map(|(_, field, _)| *field)
        .collect();
    let without = |answer: &Value| match answer {
        Value::Object(fields) => {
            let mut kept = fields.clone();
            dropped.iter().for_each(|field| {
                kept.remove(*field);
            });
            Value::Object(kept)
        }
        other => other.clone(),
    };
    match &vector["expect"] {
        Value::Array(list) => Value::Array(list.iter().map(without).collect()),
        other => without(other),
    }
}

/// Whether the vector's recorded answer carries the field (an array answer: any of its items).
fn states_field(vector: &Value, field: &str) -> bool {
    match &vector["expect"] {
        Value::Array(list) => list.iter().any(|item| item.get(field).is_some()),
        other => other.get(field).is_some(),
    }
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

    let mut replayed = 0;
    let mut later = 0;
    let mut wrong = Vec::new();
    for vector in vectors {
        let fact = vector["fact"].as_str().expect("fact");
        let name = vector["name"].as_str().unwrap_or_default();
        let whole_fact_later = REPLAYED_LATER
            .iter()
            .any(|(later_fact, field, _)| *later_fact == fact && field.is_none());
        let answer = evaluate(vector);
        if whole_fact_later {
            if answer.is_some() {
                wrong.push(format!(
                    "{name}\n   replayed now; remove from REPLAYED_LATER"
                ));
            }
            later += 1;
            continue;
        }
        match answer {
            Some(answer) if answer == expected(vector) => replayed += 1,
            Some(answer) => wrong.push(format!(
                "{name}\n   got      {answer}\n   expected {}",
                expected(vector)
            )),
            None => wrong.push(format!(
                "{name}\n   names the fact {fact:?} that nothing replays and REPLAYED_LATER does not list"
            )),
        }
    }
    for (fact, field, owner) in REPLAYED_LATER {
        let own: Vec<&Value> = vectors.iter().filter(|v| v["fact"] == *fact).collect();
        let used = match field {
            None => !own.is_empty(),
            Some(field) => own.iter().any(|v| states_field(v, field)),
        };
        if !used {
            wrong.push(format!(
                "REPLAYED_LATER entry ({fact}, {field:?}, {owner}) matches no vector"
            ));
        }
    }
    assert!(
        wrong.is_empty(),
        "{} problems:\n{}",
        wrong.len(),
        wrong.join("\n")
    );
    assert_eq!(replayed + later, vectors.len());
}
