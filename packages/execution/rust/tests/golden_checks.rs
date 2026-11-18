//! Replays the vectors of `packages/execution/contracts/checks.v1.json`, the one owner of what each doctor row
//! over the runner config and the machine it names says. The vectors are read, never copied; `$ROOT` in a vector
//! stands for the directory its machine is built under.

mod common;

use common::VectorProbe;
use fgos_execution::checks::{
    agy_sub_homes_configured, capability_serves_valid, executor_confinement,
    invocation_git_write_grants, omp_executors_of, omp_natives_present, runner_generated_paths,
    tool_registry_configured, CheckResult, OmpHost, SubHomes,
};
use fgos_execution::tools::tool_posture;
use serde_json::{json, Value};
use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

const ROOT: &str = "/vector-root";

/// The vector with `$ROOT` written as the directory the replay's machine lives at.
fn rooted(value: &Value) -> Value {
    serde_json::from_str(&value.to_string().replace("$ROOT", ROOT)).unwrap()
}

/// The paths a vector's machine holds: every file and directory it names, and every directory above them.
struct Tree {
    dirs: BTreeSet<PathBuf>,
    files: BTreeSet<PathBuf>,
}

impl Tree {
    fn of(machine: &Value) -> Self {
        let mut tree = Tree {
            dirs: BTreeSet::new(),
            files: BTreeSet::new(),
        };
        let names = |key: &str| -> Vec<PathBuf> {
            machine[key]
                .as_array()
                .into_iter()
                .flatten()
                .filter_map(|p| p.as_str().map(PathBuf::from))
                .collect()
        };
        tree.dirs.insert(Path::new(ROOT).join("home"));
        for dir in names("dirs") {
            tree.dirs.extend(dir.ancestors().map(Path::to_path_buf));
        }
        for file in names("files") {
            tree.dirs
                .extend(file.ancestors().skip(1).map(Path::to_path_buf));
            tree.files.insert(file);
        }
        tree
    }
}

struct VectorOmp<'a> {
    machine: &'a Value,
    tree: Tree,
}

impl OmpHost for VectorOmp<'_> {
    fn omp_version_output(&self) -> Result<String, String> {
        let omp = &self.machine["omp"];
        if let Some(output) = omp["output"].as_str() {
            Ok(format!("{output}\n"))
        } else if omp["exit"].is_number() {
            Err("Command failed: omp --version".to_owned())
        } else {
            Err("ENOENT".to_owned())
        }
    }
    fn env(&self, key: &str) -> Option<String> {
        self.machine["env"][key].as_str().map(str::to_owned)
    }
    fn exists(&self, path: &Path) -> bool {
        self.tree.dirs.contains(path) || self.tree.files.contains(path)
    }
    fn home(&self) -> PathBuf {
        Path::new(ROOT).join("home")
    }
    fn platform(&self) -> &str {
        self.machine["platform"].as_str().unwrap_or("linux")
    }
    fn arch(&self) -> &str {
        self.machine["arch"].as_str().unwrap_or("x64")
    }
}

struct VectorHomes {
    tree: Tree,
}

impl SubHomes for VectorHomes {
    fn home(&self) -> String {
        format!("{ROOT}/home")
    }
    fn resolve(&self, path: &str) -> String {
        path.to_owned()
    }
    fn is_dir(&self, path: &str) -> bool {
        self.tree.dirs.contains(Path::new(path))
    }
}

fn evaluate(vector: &Value) -> CheckResult {
    let runner = rooted(&vector["runner"]);
    let machine = rooted(&vector["machine"]);
    match vector["row"].as_str().unwrap() {
        "runner-generated-paths" => runner_generated_paths(&runner),
        "executor-confinement" => executor_confinement(&runner),
        "invocation-git-write-grants" => invocation_git_write_grants(&runner),
        "capability-serves-valid" => capability_serves_valid(&runner),
        "omp-natives-present" => {
            let host = VectorOmp {
                tree: Tree::of(&machine),
                machine: &machine,
            };
            omp_natives_present(&host, &omp_executors_of(&runner))
        }
        "agy-sub-homes-configured" => agy_sub_homes_configured(
            &runner,
            &VectorHomes {
                tree: Tree::of(&machine),
            },
        ),
        "tool-registry-configured" => {
            let probe = VectorProbe::of(&json!({ "machine": machine }));
            tool_registry_configured(&tool_posture(&runner, &probe))
        }
        other => panic!("no judge for row {other}"),
    }
}

#[test]
fn every_vector_of_the_checks_contract_is_answered_as_recorded() {
    let contract: Value =
        serde_json::from_str(include_str!("../../contracts/checks.v1.json")).unwrap();
    let vectors = contract["vectors"].as_array().unwrap();
    assert!(vectors.len() >= 50);
    let mut rows = BTreeSet::new();
    for vector in vectors {
        let name = vector["name"].as_str().unwrap();
        let expected = rooted(&vector["expect"]);
        let got = evaluate(vector);
        assert_eq!(
            json!({ "passed": got.passed, "message": got.message }),
            expected,
            "{name}"
        );
        rows.insert(vector["row"].as_str().unwrap().to_owned());
    }
    assert_eq!(
        rows.len(),
        7,
        "every row of the contract has vectors: {rows:?}"
    );
}
