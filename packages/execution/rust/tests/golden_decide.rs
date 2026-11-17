//! Replays the vectors of `packages/execution/contracts/decide.v1.json`: the answer of `fgos dispatch decide`, the
//! config root it reads, the `--repo-root` guard, and the dispatch hook's payload, verdict and answer. The vectors
//! are read, never copied. A vector with `nativeExpect` states the native answer where it differs on purpose.

mod common;

use common::{VectorMachine, VectorProbe};
use fgos_execution::decide::{
    attribute_runner_refusal, config_root_for, decide_over, guard_cwd_repo_root,
    refuse_global_rigor_to_tier, run_door_hint, CrateBinder, DecideAnswer, DecideFailure,
    DecideRequest, LoadedRunner, RunnerOrigin, Workspace,
};
use fgos_execution::executor_model::ModelError;
use fgos_execution::hook::{
    dispatch_verdict, hook_answer, normalize_hook_payload, Format, HookCall, Verdict,
};
use fgos_execution::runner_check::{check_runner_config, RunnerCheckError};
use serde_json::{json, Value};

/// A main checkout `<main>`, one linked worktree `<worktree>` of it (with a `sub` directory) and `<outside>`.
struct Layout {
    worktree_config: bool,
    process_in: &'static str,
}

impl Workspace for Layout {
    fn repo_root(&self, dir: &str) -> Result<String, String> {
        match dir {
            "<main>" => Ok("<main>".into()),
            "<worktree>" | "<worktree>/sub" => Ok("<worktree>".into()),
            other => Err(format!("{other} is not inside a repository")),
        }
    }
    fn main_checkout_root(&self, dir: &str) -> Option<String> {
        self.repo_root(dir).ok().map(|_| "<main>".into())
    }
    fn process_main_checkout_root(&self) -> Option<String> {
        self.main_checkout_root(self.process_in)
    }
    fn project_config_present(&self, root: &str) -> bool {
        root == "<main>" || (root == "<worktree>" && self.worktree_config)
    }
    fn load_runner(&self, _: &str) -> Result<LoadedRunner, DecideFailure> {
        unreachable!("the layout vectors read no config")
    }
    fn fgos_dir(&self, root: &str) -> String {
        format!("{root}/.fgos")
    }
}

fn place(name: &str) -> &'static str {
    match name {
        "main" => "<main>",
        "worktree" => "<worktree>",
        "worktree-sub" => "<worktree>/sub",
        "outside" => "<outside>",
        other => panic!("unknown place {other}"),
    }
}

fn text(value: &Value, key: &str) -> Option<String> {
    value.get(key).and_then(Value::as_str).map(str::to_string)
}

fn flag(value: &Value, key: &str) -> bool {
    value.get(key) == Some(&json!(true))
}

fn refusal(error: &ModelError) -> Value {
    json!({ "error": error.to_json() })
}

fn origins_of(args: &Value) -> Vec<RunnerOrigin> {
    args["origins"]
        .as_array()
        .into_iter()
        .flatten()
        .map(|origin| RunnerOrigin {
            path: text(origin, "path").unwrap_or_default(),
            layer: text(origin, "layer").unwrap_or_default(),
            file: text(origin, "file"),
            line: origin.get("line").and_then(Value::as_u64).map(|n| n as u32),
            column: origin
                .get("column")
                .and_then(Value::as_u64)
                .map(|n| n as u32),
        })
        .collect()
}

fn leak(text: &str) -> &'static str {
    Box::leak(text.to_string().into_boxed_str())
}

fn decided_of(value: &Value) -> DecideAnswer {
    DecideAnswer {
        mechanism: leak(value["mechanism"].as_str().expect("a mechanism")),
        agent_type: text(value, "agentType"),
        mcp_tool: None,
        command: None,
        stale: false,
        providers: None,
        configured: flag(value, "configured"),
        reason_codes: value["reasonCodes"]
            .as_array()
            .map(|codes| {
                codes
                    .iter()
                    .filter_map(|c| c.as_str().map(str::to_string))
                    .collect()
            })
            .unwrap_or_default(),
        blocked_reason: value
            .get("blockedReason")
            .map(|r| r.as_str().map(str::to_string)),
        executor_id: text(value, "executorId"),
    }
}

fn failure_of(value: &Value) -> DecideFailure {
    let code = text(value, "code").unwrap_or_default();
    let message = text(value, "message").unwrap_or_default();
    match value["kind"].as_str() {
        Some("door") => DecideFailure::ConfigDoor { code, message },
        Some("door-failed") => DecideFailure::DoorFailed { code, message },
        Some("runner") => DecideFailure::Refused(ModelError {
            name: "RunnerConfigError",
            code: value.get("code").and_then(Value::as_str).map(leak),
            message,
        }),
        _ => DecideFailure::Refused(ModelError {
            name: "Error",
            code: None,
            message,
        }),
    }
}

fn call_of(value: &Value) -> HookCall {
    HookCall {
        format: if value["format"] == "agy" {
            Format::Agy
        } else {
            Format::Standard
        },
        tool_name: value.get("toolName").cloned(),
        tool_input: value["toolInput"].as_object().cloned().unwrap_or_default(),
        transcript_path: text(value, "transcriptPath"),
        project_dir: text(value, "projectDir").unwrap_or_default(),
    }
}

fn verdict_json(verdict: &Verdict) -> Value {
    match verdict {
        Verdict::Allow => json!({ "blocked": false }),
        Verdict::Block(reason) => json!({ "blocked": true, "reason": reason }),
    }
}

/// The answer of one vector. Seat Binding binds through the crate's own bind over the machine the vector
/// describes, from the config alone, as `bindWorkSeat` does.
fn evaluate(vector: &Value) -> Value {
    let args = vector.get("args").cloned().unwrap_or(Value::Null);
    let runner = vector.get("runner").cloned().unwrap_or_else(|| json!({}));
    let machine = VectorMachine::of(vector, false);
    let binder = CrateBinder {
        machine: &machine,
        now: 0,
    };
    let answer = match vector["fact"].as_str().expect("a fact") {
        "decide" => {
            let request = DecideRequest {
                executor_id: text(&args, "executorId"),
                purpose: text(&args, "for"),
                work_id: text(&args, "workId"),
                work_hint: args.get("workHint").cloned(),
                assignment: text(&args, "assignment"),
                assignment_record: args.get("assignmentItem").cloned(),
                needs_soul: flag(&args, "needsSoul"),
                has_live_task_access: flag(&args, "hasLiveTaskAccess"),
            };
            match check_runner_config(&runner, "vector runner") {
                Err(refused) => refusal(&refused.error),
                Ok(_) => match decide_over(&runner, &request, &VectorProbe::of(vector), &binder) {
                    Ok(answer) => answer.to_json(),
                    Err(DecideFailure::Refused(error)) => refusal(&error),
                    Err(DecideFailure::SeatRefused { code, message }) => json!({
                        "error": { "name": "RunnerConfigError", "code": code, "message": message }
                    }),
                    Err(other) => panic!("a pure decide fails only by refusal: {other:?}"),
                },
            }
        }
        "configRoot" => {
            let layout = Layout {
                worktree_config: flag(&args, "worktreeConfig"),
                process_in: "<main>",
            };
            let cwd = match args["cwd"].as_str() {
                Some("none") | None => None,
                Some(name) => Some(place(name)),
            };
            json!(config_root_for(&layout, cwd, "<main>"))
        }
        "repoRootGuard" => {
            let layout = Layout {
                worktree_config: false,
                process_in: place(args["processIn"].as_str().expect("processIn")),
            };
            let named = |key: &str| args.get(key).and_then(Value::as_str).map(place);
            match guard_cwd_repo_root(&layout, named("cwd"), named("repoRoot"), str::to_string) {
                Ok(()) => json!({ "ok": true }),
                Err(error) => refusal(&error),
            }
        }
        "hookPayload" => normalize_hook_payload(
            args["raw"].as_str().unwrap_or_default(),
            args.get("format").and_then(Value::as_str),
            args.get("env")
                .and_then(|env| env.get("CLAUDE_PROJECT_DIR"))
                .and_then(Value::as_str),
            args["cwd"].as_str().unwrap_or_default(),
        )
        .map_or(Value::Null, |call| call.to_json()),
        "hookVerdict" => {
            let call = call_of(&args["call"]);
            let verdict = dispatch_verdict(
                &call,
                flag(&args, "projectDirExists"),
                |_| match args.get("failure") {
                    Some(failure) => Err(failure_of(failure)),
                    None => Ok(decided_of(&args["decided"])),
                },
                |executor, capability| run_door_hint(Some(&runner), executor, Some(capability)),
            );
            verdict_json(&verdict)
        }
        "hookAnswer" => {
            let verdict = match args["verdict"].get("reason").and_then(Value::as_str) {
                Some(reason) if flag(&args["verdict"], "blocked") => Verdict::Block(reason.into()),
                _ => Verdict::Allow,
            };
            let format = if args["format"] == "agy" {
                Format::Agy
            } else {
                Format::Standard
            };
            let answer = hook_answer(&verdict, format);
            json!({ "exitCode": answer.exit_code, "stdout": answer.stdout, "stderr": answer.stderr })
        }
        "attribute" => {
            let error = &args["error"];
            let raised = RunnerCheckError {
                error: ModelError {
                    name: "RunnerConfigError",
                    code: error.get("code").and_then(Value::as_str).map(leak),
                    message: text(error, "message").unwrap_or_default(),
                },
                path: text(error, "path"),
                paths: error["paths"]
                    .as_array()
                    .map(|p| {
                        p.iter()
                            .filter_map(|s| s.as_str().map(str::to_string))
                            .collect()
                    })
                    .unwrap_or_default(),
                detail: text(error, "detail"),
            };
            let project_dir = args["projectDir"].as_str().unwrap_or_default();
            refusal(&attribute_runner_refusal(
                raised,
                &origins_of(&args),
                project_dir,
            ))
        }
        "globalRigorToTier" => match refuse_global_rigor_to_tier(&origins_of(&args)) {
            Ok(()) => json!({ "ok": true }),
            Err(error) => refusal(&error),
        },
        other => panic!("vector names the unknown fact {other:?}"),
    };
    answer
}

#[test]
fn every_decide_and_hook_vector_has_the_answer_the_contract_records() {
    let path = concat!(env!("CARGO_MANIFEST_DIR"), "/../contracts/decide.v1.json");
    let contract: Value =
        serde_json::from_str(&std::fs::read_to_string(path).expect("the vector file is committed"))
            .expect("the vector file is JSON");
    assert_eq!(contract["version"], "decide.v1");
    let vectors = contract["vectors"].as_array().expect("vectors");
    let mut wrong = Vec::new();
    let mut replayed = 0;
    for vector in vectors {
        let name = vector["name"].as_str().unwrap_or_default();
        let answer = evaluate(vector);
        let expected = vector.get("nativeExpect").unwrap_or(&vector["expect"]);
        if answer == *expected {
            replayed += 1;
        } else {
            wrong.push(format!(
                "{name}\n   got      {answer}\n   expected {expected}"
            ));
        }
    }
    assert!(
        wrong.is_empty(),
        "{} problems:\n{}",
        wrong.len(),
        wrong.join("\n")
    );
    assert_eq!(replayed, vectors.len());
}
