//! Replays the vectors of `packages/execution/contracts/bind.v1.json`: the binding of one seat, the dispatch explain
//! answer, the pre-admission facts, the seat config slice and its digest, and effective rigor. The vectors are read,
//! never copied. Lease state arrives as Dispatch's adapter reads it (`leaseRead`), the input the bind takes; a vector
//! marked `decided` states a rule decided after the Node bind was written and is replayed like any other.

mod common;

use common::VectorMachine;
use fgos_execution::bind::{
    bind, effective_rigor, preflight, seat_config, seat_config_digest, AccountPin, BindRequest,
    BindSession,
};
use fgos_execution::explain::explain_capability;
use serde_json::{json, Value};

static NULL: Value = Value::Null;

fn session_of(args: &Value) -> BindSession {
    let session = &args["session"];
    BindSession {
        headless: session["headless"] == json!(true),
        has_native_agent: session["hasNativeAgent"] == json!(true),
        posture_at_launch: session["postureAtLaunch"] == json!(true),
    }
}

fn machine_of(vector: &Value) -> VectorMachine {
    VectorMachine::of(
        vector,
        vector["args"]["session"]["herdrPresent"] == json!(true),
    )
}

fn now_of(args: &Value) -> u64 {
    args["now"].as_u64().expect("a vector states the time it runs at")
}

fn answer<T: Into<Value>>(result: Result<T, fgos_execution::executor_model::ModelError>) -> Value {
    result
        .map(Into::into)
        .unwrap_or_else(|error| json!({ "error": error.to_json() }))
}

fn evaluate(vector: &Value) -> Value {
    let runner = vector.get("runner").unwrap_or(&NULL);
    let args = vector.get("args").unwrap_or(&NULL);
    let machine = machine_of(vector);
    match vector["fact"].as_str().expect("a vector names its fact") {
        "bind" => {
            let request = BindRequest {
                ask: &args["ask"],
                runner,
                session: session_of(args),
                walk: args.get("walk").unwrap_or(&NULL),
                account_state: if args.get("accounts").is_some() {
                    vector.get("leaseRead")
                } else {
                    None
                },
            };
            answer(bind(&request, &machine, now_of(args)))
        }
        "explain" => answer(explain_capability(
            runner,
            args["capability"].as_str().unwrap_or_default(),
            args["rigor"].as_str(),
            &session_of(args),
            &machine,
            now_of(args),
        )),
        "preflight" => {
            let pin = args.get("pin").map(|pin| AccountPin {
                pool: pin["pool"].as_str().unwrap_or_default().to_string(),
                id: pin["id"].as_str().unwrap_or_default().to_string(),
            });
            json!(preflight(
                runner,
                &session_of(args),
                pin.as_ref(),
                vector.get("leaseRead"),
                &machine,
                now_of(args),
            ))
        }
        "seatConfig" => json!({ "config": seat_config(runner), "digest": seat_config_digest(runner) }),
        "effectiveRigor" => answer(
            effective_rigor(&args["unit"], runner).map(|rigor| json!(rigor.unwrap_or("standard"))),
        ),
        other => panic!("vector {} names the unknown fact {other}", vector["name"]),
    }
}

#[test]
fn every_bind_vector_has_the_answer_the_contract_records() {
    let path = concat!(env!("CARGO_MANIFEST_DIR"), "/../contracts/bind.v1.json");
    let contract: Value =
        serde_json::from_str(&std::fs::read_to_string(path).expect("the vector file is committed"))
            .expect("the vector file is JSON");
    assert_eq!(contract["version"], "bind.v1");
    let vectors = contract["vectors"].as_array().expect("vectors");
    let wrong: Vec<String> = vectors
        .iter()
        .filter_map(|vector| {
            let got = evaluate(vector);
            (got != vector["expect"]).then(|| {
                format!(
                    "{}\n   got      {got}\n   expected {}",
                    vector["name"].as_str().unwrap_or_default(),
                    vector["expect"]
                )
            })
        })
        .collect();
    assert!(
        wrong.is_empty(),
        "{} of {} vectors differ:\n{}",
        wrong.len(),
        vectors.len(),
        wrong.join("\n")
    );
}
