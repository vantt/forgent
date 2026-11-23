//! The run directories `fgos lock-status` scans for run-scoped locks.
//!
//! The run-scoped registry rows (`advance`, `recovery`, `attempt`) have their lock files inside directories whose
//! layout belongs to the runner, one layer above the lock crate, so the host lists them and hands the lock report
//! one parameter set per directory. The assignment layout is the engine's (`fgos_execution::assignment_layout`),
//! never a second walk here:
//!
//! * workflow runs: every real directory under the case runs root of `fgos_execution::case_paths` (no case-id
//!   filter, so `.bindings` counts), symbolic links excluded;
//! * assignment runs: every attempt directory the engine's layout lists, open or closed (a symbolic link and the
//!   depth limit are barriers it never reads past);
//! * open attempts: those assignment runs whose `closed.json` does not exist.
//!
//! `test/rust-host/fixtures/run-dirs-vectors.json` pins what each yields for a set of trees.
use fgos_execution::assignment_layout::list_assignment_runs;
use fgos_execution::case_paths::runs_root;
use fgos_holder_lock::status::{Params, RunInstances};
use std::fs;
use std::path::{Path, PathBuf};

/// The case directories under the case runs root, in byte order of the name.
pub fn workflow_case_dirs(fgos_dir: &Path) -> Vec<PathBuf> {
    let Ok(listing) = fs::read_dir(runs_root(fgos_dir)) else {
        return Vec::new();
    };
    let mut dirs: Vec<(String, PathBuf)> = listing
        .filter_map(Result::ok)
        .filter(|entry| entry.file_type().is_ok_and(|kind| kind.is_dir()))
        .map(|entry| {
            (
                entry.file_name().to_string_lossy().into_owned(),
                entry.path(),
            )
        })
        .collect();
    dirs.sort_by(|a, b| a.0.as_bytes().cmp(b.0.as_bytes()));
    dirs.into_iter().map(|(_, path)| path).collect()
}

/// The attempt directories of the assignment layout, open or closed.
pub fn assignment_attempt_dirs(fgos_dir: &Path) -> Vec<PathBuf> {
    list_assignment_runs(fgos_dir)
        .into_iter()
        .map(|run| run.run_dir)
        .collect()
}

/// The attempt directories of the assignment layout that have no `closed.json`.
pub fn unclosed_attempt_dirs(fgos_dir: &Path) -> Vec<PathBuf> {
    let mut dirs = assignment_attempt_dirs(fgos_dir);
    dirs.retain(|dir| !dir.join("closed.json").exists());
    dirs
}

fn text(path: &Path) -> String {
    path.to_string_lossy().into_owned()
}

/// The parameter sets that fill the templates of the three run-scoped rows: `<workflowRunDir>`, `<runDir>` (an
/// attempt directory) and, for the attempt lock, `<runDir>` (the assignment directory) with `<NN>` (the attempt).
pub fn run_instances(fgos_dir: &Path) -> RunInstances {
    let single = |key: &str, path: &Path| Params::from([(key.to_owned(), text(path))]);
    let mut instances = RunInstances::new();
    instances.insert(
        "advance".into(),
        workflow_case_dirs(fgos_dir)
            .iter()
            .map(|dir| single("workflowRunDir", dir))
            .collect(),
    );
    instances.insert(
        "recovery".into(),
        assignment_attempt_dirs(fgos_dir)
            .iter()
            .map(|dir| single("runDir", dir))
            .collect(),
    );
    instances.insert(
        "attempt".into(),
        unclosed_attempt_dirs(fgos_dir)
            .iter()
            .filter_map(|dir| {
                let assignment = dir.parent()?.parent()?;
                let attempt = dir.file_name()?;
                Some(Params::from([
                    ("runDir".to_owned(), text(assignment)),
                    ("NN".to_owned(), attempt.to_string_lossy().into_owned()),
                ]))
            })
            .collect(),
    );
    instances
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::Value;
    use std::sync::atomic::{AtomicU32, Ordering};

    static NEXT: AtomicU32 = AtomicU32::new(0);

    /// Builds one fixture tree under a scratch `.fgos`; removed on drop.
    struct Tree(PathBuf);

    impl Tree {
        fn build(entries: &[Value]) -> Self {
            let root = std::env::temp_dir().join(format!(
                "fgos-run-dirs-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::Relaxed)
            ));
            let fgos = root.join(".fgos");
            fs::create_dir_all(&fgos).unwrap();
            for entry in entries {
                let path = fgos.join(entry["path"].as_str().unwrap());
                fs::create_dir_all(path.parent().unwrap()).unwrap();
                match entry["kind"].as_str().unwrap() {
                    "dir" => fs::create_dir_all(&path).unwrap(),
                    "file" => fs::write(&path, "").unwrap(),
                    "symlink" =>
                    {
                        #[cfg(unix)]
                        std::os::unix::fs::symlink(entry["points"].as_str().unwrap(), &path)
                            .unwrap()
                    }
                    other => panic!("unknown kind {other}"),
                }
            }
            Tree(root)
        }
        fn fgos(&self) -> PathBuf {
            self.0.join(".fgos")
        }
        fn relative(&self, dirs: Vec<PathBuf>) -> Vec<String> {
            dirs.iter()
                .map(|dir| {
                    dir.strip_prefix(self.fgos())
                        .unwrap()
                        .to_string_lossy()
                        .into_owned()
                })
                .collect()
        }
    }

    impl Drop for Tree {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    fn strings(value: &Value) -> Vec<String> {
        value
            .as_array()
            .unwrap()
            .iter()
            .map(|item| item.as_str().unwrap().to_owned())
            .collect()
    }

    #[cfg(unix)]
    #[test]
    fn each_of_the_three_listers_yields_what_the_shared_fixture_says_for_every_tree() {
        let doc: Value = serde_json::from_str(include_str!(
            "../../../../test/rust-host/fixtures/run-dirs-vectors.json"
        ))
        .unwrap();
        let vectors = doc["vectors"].as_array().unwrap();
        assert!(vectors.len() >= 10);
        for vector in vectors {
            let tree = Tree::build(vector["tree"].as_array().unwrap());
            let fgos = tree.fgos();
            let name = &vector["name"];
            let expect = &vector["expect"];
            assert_eq!(
                tree.relative(workflow_case_dirs(&fgos)),
                strings(&expect["workflowRuns"]),
                "workflow runs: {name}"
            );
            assert_eq!(
                tree.relative(assignment_attempt_dirs(&fgos)),
                strings(&expect["assignmentRuns"]),
                "assignment runs: {name}"
            );
            // The open-attempt rows of these two trees are the retired Node lister's own rules (it read through a
            // symlinked assignments root and had no depth limit); the engine's layout is the rule now.
            let node_lister_only = [
                "a symlinked assignments root is never read",
                "the depth limit stops the recovery lister at 16 levels and not the attempt lister",
            ];
            if !node_lister_only.contains(&name.as_str().unwrap()) {
                assert_eq!(
                    tree.relative(unclosed_attempt_dirs(&fgos)),
                    strings(&expect["openAttempts"]),
                    "open attempts: {name}"
                );
            }
        }
    }

    #[test]
    fn the_three_rows_get_the_parameters_their_templates_name() {
        let tree = Tree::build(&[
            serde_json::json!({"path": "workflow-runs/case-1", "kind": "dir"}),
            serde_json::json!({"path": "assignments/work/runs/02", "kind": "dir"}),
        ]);
        let instances = run_instances(&tree.fgos());
        // The directories are named with the platform's own separators.
        let under = |tail: &[&str]| {
            tail.iter()
                .fold(tree.fgos(), |dir, part| dir.join(part))
                .to_string_lossy()
                .into_owned()
        };
        assert_eq!(
            instances["advance"],
            vec![Params::from([(
                "workflowRunDir".to_owned(),
                under(&["workflow-runs", "case-1"])
            )])]
        );
        assert_eq!(
            instances["recovery"],
            vec![Params::from([(
                "runDir".to_owned(),
                under(&["assignments", "work", "runs", "02"])
            )])]
        );
        assert_eq!(
            instances["attempt"],
            vec![Params::from([
                ("runDir".to_owned(), under(&["assignments", "work"])),
                ("NN".to_owned(), "02".to_owned())
            ])]
        );
    }
}
