//! The run directories `fgos lock-status` scans for run-scoped locks.
//!
//! The run-scoped registry rows (`advance`, `recovery`, `attempt`) have their lock files inside directories whose
//! layout belongs to the runner, one layer above the lock crate, so the host lists them and hands the lock report
//! one parameter set per directory. These are three listers because the Node CLI's three are three different
//! rules, kept as they are until the runner's layouts move to Rust:
//!
//! * workflow runs: every real directory under `<fgosDir>/workflow-runs` (no case-id filter, so `.bindings`
//!   counts), symbolic links excluded;
//! * assignment runs (`scanAssignmentLayout`): every attempt directory under a `runs` directory of
//!   `<fgosDir>/assignments`, open or closed, at most 16 levels deep, a symbolic link a barrier that is never read;
//! * open attempts (`listOpenAttemptDirs`): every attempt directory under a `runs` directory at any depth whose
//!   `closed.json` does not exist, symbolic links excluded.
//!
//! One fixture, `test/rust-host/fixtures/run-dirs-vectors.json`, pins what each yields for a set of trees; the Node
//! listers' tests read the same file.
use fgos_holder_lock::status::{Params, RunInstances};
use std::fs;
use std::path::{Path, PathBuf};

/// How many directories below `assignments` the assignment lister descends.
const ASSIGNMENT_LAYOUT_MAX_DEPTH: usize = 16;

/// What a directory lists: the entries' names and whether each is a real directory, a real file or neither (a
/// symbolic link is neither), in byte order of the name.
struct Entry {
    name: String,
    path: PathBuf,
    is_dir: bool,
    is_symlink: bool,
}

fn entries(dir: &Path) -> Vec<Entry> {
    let Ok(listing) = fs::read_dir(dir) else {
        return Vec::new();
    };
    let mut found: Vec<Entry> = listing
        .filter_map(Result::ok)
        .filter_map(|entry| {
            let kind = entry.file_type().ok()?;
            Some(Entry {
                name: entry.file_name().to_string_lossy().into_owned(),
                path: entry.path(),
                is_dir: kind.is_dir(),
                is_symlink: kind.is_symlink(),
            })
        })
        .collect();
    found.sort_by(|a, b| a.name.as_bytes().cmp(b.name.as_bytes()));
    found
}

/// The case directories of `<fgos_dir>/workflow-runs`.
pub fn workflow_run_dirs(fgos_dir: &Path) -> Vec<PathBuf> {
    entries(&fgos_dir.join("workflow-runs"))
        .into_iter()
        .filter(|entry| entry.is_dir)
        .map(|entry| entry.path)
        .collect()
}

/// The attempt directories of the assignment layout, open or closed.
pub fn assignment_run_dirs(fgos_dir: &Path) -> Vec<PathBuf> {
    fn walk(dir: &Path, depth: usize, runs: &mut Vec<PathBuf>) {
        for entry in entries(dir) {
            if entry.is_symlink || !entry.is_dir {
                continue;
            }
            if entry.name == "runs" {
                for attempt in entries(&entry.path) {
                    if attempt.is_dir {
                        runs.push(attempt.path);
                    }
                }
            } else if depth < ASSIGNMENT_LAYOUT_MAX_DEPTH {
                walk(&entry.path, depth + 1, runs);
            }
        }
    }
    let base = fgos_dir.join("assignments");
    let mut runs = Vec::new();
    // The root itself is read only when it is a real directory.
    if fs::symlink_metadata(&base).is_ok_and(|meta| meta.is_dir()) {
        walk(&base, 0, &mut runs);
    }
    runs
}

/// The attempt directories under `assignments_root` that have no `closed.json`, sorted.
pub fn open_attempt_dirs(assignments_root: &Path) -> Vec<PathBuf> {
    fn walk(dir: &Path, found: &mut Vec<PathBuf>) {
        for entry in entries(dir) {
            if !entry.is_dir {
                continue;
            }
            if entry.name != "runs" {
                walk(&entry.path, found);
                continue;
            }
            for attempt in entries(&entry.path) {
                if attempt.is_dir && !attempt.path.join("closed.json").exists() {
                    found.push(attempt.path);
                }
            }
        }
    }
    let mut found = Vec::new();
    walk(assignments_root, &mut found);
    found.sort_by(|a, b| {
        a.as_os_str()
            .as_encoded_bytes()
            .cmp(b.as_os_str().as_encoded_bytes())
    });
    found
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
        workflow_run_dirs(fgos_dir)
            .iter()
            .map(|dir| single("workflowRunDir", dir))
            .collect(),
    );
    instances.insert(
        "recovery".into(),
        assignment_run_dirs(fgos_dir)
            .iter()
            .map(|dir| single("runDir", dir))
            .collect(),
    );
    instances.insert(
        "attempt".into(),
        open_attempt_dirs(&fgos_dir.join("assignments"))
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
                tree.relative(workflow_run_dirs(&fgos)),
                strings(&expect["workflowRuns"]),
                "workflow runs: {name}"
            );
            assert_eq!(
                tree.relative(assignment_run_dirs(&fgos)),
                strings(&expect["assignmentRuns"]),
                "assignment runs: {name}"
            );
            assert_eq!(
                tree.relative(open_attempt_dirs(&fgos.join("assignments"))),
                strings(&expect["openAttempts"]),
                "open attempts: {name}"
            );
        }
    }

    #[test]
    fn the_three_rows_get_the_parameters_their_templates_name() {
        let tree = Tree::build(&[
            serde_json::json!({"path": "workflow-runs/case-1", "kind": "dir"}),
            serde_json::json!({"path": "assignments/work/runs/02", "kind": "dir"}),
        ]);
        let instances = run_instances(&tree.fgos());
        let fgos = text(&tree.fgos());
        assert_eq!(
            instances["advance"],
            vec![Params::from([(
                "workflowRunDir".to_owned(),
                format!("{fgos}/workflow-runs/case-1")
            )])]
        );
        assert_eq!(
            instances["recovery"],
            vec![Params::from([(
                "runDir".to_owned(),
                format!("{fgos}/assignments/work/runs/02")
            )])]
        );
        assert_eq!(
            instances["attempt"],
            vec![Params::from([
                ("runDir".to_owned(), format!("{fgos}/assignments/work")),
                ("NN".to_owned(), "02".to_owned())
            ])]
        );
    }
}
