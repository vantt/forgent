use fgos_session_identity::{
    env_identity, resolve, tree_identity, ProcStat, ProcessTree, ENV_ORDER, MAX_ID_LENGTH,
    REGISTRY_FILE,
};
use serde::Deserialize;
use serde_json::Value;
use std::collections::HashMap;
use std::path::PathBuf;

const GOLDEN: &str = include_str!("../../contracts/session-identity.golden.v1.json");
const CONTRACT: &str = include_str!("../../contracts/session-identity.resolve.v1.json");

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Golden {
    contract: String,
    env_cases: Vec<EnvCase>,
    tree_cases: Vec<TreeCase>,
}

#[derive(Deserialize)]
struct EnvCase {
    name: String,
    env: HashMap<String, String>,
    registry: Value,
    expected: Option<Value>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct TreeCase {
    name: String,
    processes: Vec<Proc>,
    caller_pid: u32,
    expected: Value,
}

#[derive(Deserialize)]
struct Proc {
    pid: u32,
    ppid: u32,
    session: u32,
    tty: i64,
}

struct Table(HashMap<u32, ProcStat>);

impl ProcessTree for Table {
    fn stat(&self, pid: u32) -> Option<ProcStat> {
        self.0.get(&pid).copied()
    }
}

fn golden() -> Golden {
    serde_json::from_str(GOLDEN).expect("golden parses")
}

fn scratch_dir(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!(
        "fgos-session-identity-golden-{}-{}",
        std::process::id(),
        name.replace(|c: char| !c.is_ascii_alphanumeric(), "-")
    ));
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

/// Builds the registry state a case names; `None` means no fgos dir passed.
fn registry_dir(case: &EnvCase) -> Option<PathBuf> {
    match case.registry["kind"].as_str().unwrap() {
        "none" => None,
        "absent" => Some(scratch_dir(&case.name)),
        "rows" => {
            let dir = scratch_dir(&case.name);
            std::fs::write(dir.join(REGISTRY_FILE), case.registry["rows"].to_string()).unwrap();
            Some(dir)
        }
        "raw" => {
            let dir = scratch_dir(&case.name);
            std::fs::write(
                dir.join(REGISTRY_FILE),
                case.registry["raw"].as_str().unwrap(),
            )
            .unwrap();
            Some(dir)
        }
        other => panic!("unknown registry kind {other}"),
    }
}

#[test]
fn env_cases_follow_the_golden_vectors() {
    let golden = golden();
    assert_eq!(golden.contract, "session-identity.golden.v1");
    for case in &golden.env_cases {
        let dir = registry_dir(case);
        let env = case.env.clone();
        let lookup = move |key: &str| env.get(key).cloned();
        let actual =
            env_identity(&lookup, dir.as_deref()).map(|id| serde_json::to_value(id).unwrap());
        assert_eq!(actual, case.expected, "env case: {}", case.name);
        if let Some(dir) = dir {
            let _ = std::fs::remove_dir_all(dir);
        }
    }
}

#[test]
fn tree_cases_follow_the_golden_vectors() {
    for case in golden().tree_cases {
        let table = Table(
            case.processes
                .iter()
                .map(|p| {
                    (
                        p.pid,
                        ProcStat {
                            ppid: p.ppid,
                            session: p.session,
                            tty_nr: p.tty,
                        },
                    )
                })
                .collect(),
        );
        let actual = serde_json::to_value(tree_identity(&table, case.caller_pid)).unwrap();
        assert_eq!(actual, case.expected, "tree case: {}", case.name);
    }
}

#[test]
fn a_usable_env_id_wins_over_the_process_tree() {
    let table = Table(HashMap::from([(
        5,
        ProcStat {
            ppid: 1,
            session: 5,
            tty_nr: 1,
        },
    )]));
    let lookup = |key: &str| (key == "CODEX_THREAD_ID").then(|| "thread-x".to_string());
    let actual = serde_json::to_value(resolve(&lookup, &table, 5, None)).unwrap();
    assert_eq!(
        actual,
        serde_json::json!({ "id": "thread-x", "source": "env" })
    );
}

#[test]
fn contract_names_the_same_env_order_and_limits() {
    let contract: Value = serde_json::from_str(CONTRACT).unwrap();
    let order: Vec<&str> = contract["x-envOrder"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_str().unwrap())
        .collect();
    assert_eq!(order, ENV_ORDER);
    assert_eq!(
        contract["x-maxIdLength"].as_u64().unwrap() as usize,
        MAX_ID_LENGTH
    );
    assert_eq!(contract["x-registryFile"].as_str().unwrap(), REGISTRY_FILE);
}
