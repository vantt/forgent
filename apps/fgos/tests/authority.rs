//! `fgos authority locate` as a process, over the real model of this checkout: a Vietnamese and an English
//! description of the same work both rank the `durable-file` component first, in a `fgos.v1` envelope. In a
//! project that is not this repository the verb reads and writes `.fgos/authority/model/`: with no model
//! `locate` answers `inactive`, and the first approved `declare` creates the model. The loader, the ranking
//! rules and every refusal of `declare` are owned by the crate's tests (`packages/component-authority/rust/`);
//! this file proves the wiring of the binary over them.

use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicUsize, Ordering};

/// Every project gets its own folder: tests run in parallel threads of one process.
static PROJECTS: AtomicUsize = AtomicUsize::new(0);

fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()
        .unwrap()
}

fn copy_dir(from: &Path, to: &Path) {
    fs::create_dir_all(to).unwrap();
    for entry in fs::read_dir(from).unwrap() {
        let entry = entry.unwrap();
        let target = to.join(entry.file_name());
        if entry.file_type().unwrap().is_dir() {
            copy_dir(&entry.path(), &target);
        } else {
            fs::copy(entry.path(), target).unwrap();
        }
    }
}

fn seed_model(project: &Path) {
    let model = Path::new("packages/component-authority/model");
    copy_dir(&repo_root().join(model), &project.join(model));
    // The contract file is what marks a root as the fgOS repository, which keeps its model in the tree.
    let contract = Path::new("packages/component-authority/contracts/model.v1.json");
    fs::create_dir_all(project.join(contract).parent().unwrap()).unwrap();
    fs::copy(repo_root().join(contract), project.join(contract)).unwrap();
}

/// A fresh checkout has no `.fgos`: the verb needs a project, so the test builds one holding a copy of the real model.
fn temp_project() -> PathBuf {
    let project = std::env::temp_dir().join(format!(
        "fgos-authority-locate-{}-{}",
        std::process::id(),
        PROJECTS.fetch_add(1, Ordering::SeqCst)
    ));
    let _ = fs::remove_dir_all(&project);
    fs::create_dir_all(project.join(".fgos")).unwrap();
    seed_model(&project);
    project
}

/// Every file and directory under `dir` with its size and modification time.
fn listing(dir: &Path) -> Vec<(PathBuf, u64, std::time::SystemTime)> {
    let mut rows = Vec::new();
    for entry in fs::read_dir(dir).unwrap() {
        let entry = entry.unwrap();
        let meta = entry.metadata().unwrap();
        rows.push((entry.path(), meta.len(), meta.modified().unwrap()));
        if meta.is_dir() {
            rows.extend(listing(&entry.path()));
        }
    }
    rows.sort_by(|a, b| a.0.cmp(&b.0));
    rows
}

fn authority_data(args: &[&str]) -> serde_json::Value {
    let project = temp_project();
    let data = authority_data_in(&project, args);
    let _ = fs::remove_dir_all(&project);
    data
}

/// Runs the verb in `project` and leaves the project in place.
fn authority_data_in(project: &Path, args: &[&str]) -> serde_json::Value {
    let output = Command::new(env!("CARGO_BIN_EXE_fgos"))
        .arg("authority")
        .args(args)
        .arg("--json")
        .env_remove("FGOS_CONFINED")
        .env_remove("FGOS_HEAD_REQUEST_SOCKET")
        .current_dir(project)
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "authority {args:?}: {}{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    let envelope: serde_json::Value = serde_json::from_slice(&output.stdout).unwrap();
    assert_eq!(envelope["contract"], "fgos.v1", "{envelope}");
    envelope["data"].clone()
}

fn locate_first(sentence: &str) -> serde_json::Value {
    authority_data(&["locate", sentence])["matches"][0].clone()
}

#[test]
fn a_vietnamese_and_an_english_description_of_atomic_writes_both_rank_durable_file_first() {
    for sentence in ["ghi file nguyên tử", "atomic file write"] {
        let first = locate_first(sentence);
        assert_eq!(first["id"], "durable-file", "{sentence}: {first}");
        assert_eq!(first["kind"], "component", "{sentence}: {first}");
        assert_eq!(first["matchedOn"], "alias", "{sentence}: {first}");
    }
}

#[test]
fn authority_model_prints_the_loaded_model_with_door_slugs_and_writes_nothing() {
    let project = temp_project();
    let before = listing(&project);
    let data = authority_data_in(&project, &["model"]);
    let after = listing(&project);
    let _ = fs::remove_dir_all(&project);
    assert_eq!(before, after, "authority model changed the project");
    for key in [
        "layers",
        "components",
        "decisionKinds",
        "doors",
        "contracts",
    ] {
        assert!(!data[key].is_null(), "missing {key}: {data}");
    }
    let slugs: Vec<&str> = data["doors"]
        .as_array()
        .unwrap()
        .iter()
        .filter_map(|door| door["slug"].as_str())
        .collect();
    assert!(slugs.contains(&"yaml-parser-loads"), "{slugs:?}");
}

#[test]
fn authority_render_check_finds_every_view_of_this_repository_in_sync_with_the_model() {
    let root = repo_root();
    let output = Command::new(env!("CARGO_BIN_EXE_fgos"))
        .args(["authority", "render", "--check", "--json", "--dir"])
        .arg(&root)
        .env_remove("FGOS_CONFINED")
        .env_remove("FGOS_HEAD_REQUEST_SOCKET")
        .current_dir(&root)
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "authority render --check: {}{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    let envelope: serde_json::Value = serde_json::from_slice(&output.stdout).unwrap();
    assert_eq!(envelope["contract"], "fgos.v1", "{envelope}");
    assert_eq!(
        envelope["data"]["drift"],
        serde_json::json!([]),
        "{envelope}"
    );
}

fn seeded_repo(dir: &Path) {
    fs::create_dir_all(dir).unwrap();
    seed_model(dir);
    for file in [
        "docs/platform/component-boundary.md",
        "docs/platform/README.md",
        "docs/platform/governance.md",
        "docs/platform/system-overview/spec.md",
        "docs/platform/observe/spec.md",
        "docs/platform/workflow/spec.md",
        "docs/platform/architecture-map.md",
    ] {
        let target = dir.join(file);
        fs::create_dir_all(target.parent().unwrap()).unwrap();
        fs::copy(repo_root().join(file), target).unwrap();
    }
}

#[test]
fn authority_render_in_linked_worktree_with_dir_main_renders_the_worktree_and_leaves_main_unchanged(
) {
    let base = std::env::temp_dir().join(format!(
        "fgos-authority-wt-test-{}-{}",
        std::process::id(),
        PROJECTS.fetch_add(1, Ordering::SeqCst)
    ));
    let _ = fs::remove_dir_all(&base);
    fs::create_dir_all(&base).unwrap();
    let main = base.join("main");
    let wt = base.join("wt");

    seeded_repo(&main);

    let git = |args: &[&str], cwd: &Path| {
        let out = Command::new("git")
            .args(args)
            .current_dir(cwd)
            .env("GIT_CONFIG_GLOBAL", "/dev/null")
            .env("GIT_CONFIG_NOSYSTEM", "1")
            .output()
            .unwrap();
        assert!(out.status.success(), "git {args:?}: {out:?}");
    };

    git(&["init", "-q", "-b", "main"], &main);
    git(&["add", "."], &main);
    git(
        &[
            "-c",
            "user.name=t",
            "-c",
            "user.email=t@example.invalid",
            "commit",
            "-m",
            "init",
        ],
        &main,
    );
    git(
        &[
            "worktree",
            "add",
            "-q",
            "-b",
            "wt-branch",
            wt.to_str().unwrap(),
        ],
        &main,
    );

    // Initial render in main so main is completely in sync with the model
    let output = Command::new(env!("CARGO_BIN_EXE_fgos"))
        .args(["authority", "render", "--json", "--dir"])
        .arg(&main)
        .env_remove("FGOS_CONFINED")
        .env_remove("FGOS_HEAD_REQUEST_SOCKET")
        .current_dir(&main)
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "initial render on main: {output:?}"
    );

    // Record main's component-boundary.md bytes
    let main_file = main.join("docs/platform/component-boundary.md");
    let main_bytes_before = fs::read(&main_file).unwrap();

    // Hand-edit component-boundary.md in wt
    let wt_file = wt.join("docs/platform/component-boundary.md");
    let marker = "<!-- generated:component-authority:component-boundary -->";
    let wt_content_before = fs::read_to_string(&wt_file).unwrap();
    assert!(
        wt_content_before.contains(marker),
        "marker not found in wt view file"
    );
    let tampered = wt_content_before.replace(marker, &format!("{marker}\nHAND EDITED ROW\n"));
    assert_ne!(tampered, wt_content_before);
    fs::write(&wt_file, &tampered).unwrap();

    // Run fgos authority render --json --dir <main> with cwd inside wt
    let output = Command::new(env!("CARGO_BIN_EXE_fgos"))
        .args(["authority", "render", "--json", "--dir"])
        .arg(&main)
        .env_remove("FGOS_CONFINED")
        .env_remove("FGOS_HEAD_REQUEST_SOCKET")
        .current_dir(&wt)
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "authority render in wt: {}{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );

    let envelope: serde_json::Value = serde_json::from_slice(&output.stdout).unwrap();
    assert_eq!(envelope["contract"], "fgos.v1", "{envelope}");
    let data = &envelope["data"];
    assert_eq!(
        data["root"],
        wt.canonicalize().unwrap().to_str().unwrap(),
        "{data}"
    );

    let written = data["written"].as_array().expect("written is an array");
    assert!(
        written.iter().any(|entry| {
            entry["view"] == "component-boundary"
                && entry["file"] == "docs/platform/component-boundary.md"
        }),
        "written must name component-boundary: {data}"
    );

    // wt view was re-rendered (tampered content is gone)
    let wt_content_after = fs::read_to_string(&wt_file).unwrap();
    assert!(
        !wt_content_after.contains("HAND EDITED ROW"),
        "wt was not re-rendered"
    );
    assert_eq!(wt_content_after, wt_content_before);

    // main view is byte-identical
    let main_bytes_after = fs::read(&main_file).unwrap();
    assert_eq!(
        main_bytes_after, main_bytes_before,
        "main file was modified"
    );

    let _ = fs::remove_dir_all(&base);
}

#[test]
fn authority_declare_update_changes_a_component_row_and_rerenders_the_views() {
    let project = std::env::temp_dir().join(format!(
        "fgos-authority-update-{}-{}",
        std::process::id(),
        PROJECTS.fetch_add(1, Ordering::SeqCst)
    ));
    let _ = fs::remove_dir_all(&project);
    seeded_repo(&project);
    fs::create_dir_all(project.join(".fgos")).unwrap();
    // Updates revalidate the full row, including its existing source paths.
    fs::create_dir_all(project.join("packages/durable-file/rust")).unwrap();
    authority_data_in(&project, &["render"]);
    let view_file = project.join("docs/platform/component-boundary.md");
    let before = fs::read_to_string(&view_file).unwrap();
    assert!(before.contains("| `durable-file` | — | kernel | 0 | live |"));

    let data = authority_data_in(
        &project,
        &[
            "declare",
            "--kind",
            "component",
            "--update",
            "--row",
            r#"{"id":"durable-file","status":"designed"}"#,
        ],
    );
    assert_eq!(data["declared"]["id"], "durable-file", "{data}");
    assert_eq!(data["declared"]["row"]["status"], "designed", "{data}");
    let written = data["views"]["written"].as_array().expect("views.written");
    assert!(
        written
            .iter()
            .any(|entry| entry["view"] == "component-boundary"),
        "the declare must re-render component-boundary: {data}"
    );

    let after = fs::read_to_string(&view_file).unwrap();
    assert_ne!(before, after, "the update must change the rendered view");
    assert!(after.contains("| `durable-file` | — | kernel | 0 | designed |"));
    let check = authority_data_in(&project, &["render", "--check"]);
    assert_eq!(check["drift"], serde_json::json!([]), "{check}");
    let _ = fs::remove_dir_all(&project);
}

/// A project that is not this repository: its own Git repository with an event store, a state root and a
/// release, so `fgos questions` can ask and answer in it.
#[cfg(target_os = "linux")]
mod project_without_a_model {
    use super::*;
    use sha2::{Digest, Sha256};
    use std::io::Write;
    use std::process::{Output, Stdio};

    const SESSION: &str = "00000000-0000-4000-8000-0000000000aa";

    const QUESTION: &str = r#"{"stage":"planning","headline":"May the model gain a component?","blocks":"plan p","parts":{"what":"declare a component","cause":"the project has none","options":[{"label":"A","does":"d","gain":"g","harm":"h","cost":"c","recommended":true},{"label":"B","does":"d","gain":"g","harm":"h","cost":"c"}],"recommendation":"A","default":"Without an answer the asker declares no component and the project keeps no model","scope":{"allows":"one component","forbids":"others"}}}"#;

    fn git(dir: &Path, args: &[&str]) {
        let out = Command::new("git")
            .arg("-C")
            .arg(dir)
            .args(["-c", "user.name=t", "-c", "user.email=t@example.invalid"])
            .args(args)
            .env("GIT_CONFIG_GLOBAL", "/dev/null")
            .env("GIT_CONFIG_NOSYSTEM", "1")
            .output()
            .unwrap();
        assert!(out.status.success(), "git {args:?}: {out:?}");
    }

    fn digest(bytes: &[u8]) -> String {
        format!("sha256:{:x}", Sha256::digest(bytes))
    }

    fn release(root: &Path) {
        let release = root.join("release");
        fs::create_dir_all(release.join("bin")).unwrap();
        let entry = b"process.exit(0);\n";
        fs::write(release.join("bin/fgos.mjs"), entry).unwrap();
        let mut manifest = serde_json::json!({
            "schemaVersion": 1,
            "entries": { "fgos": "target/debug/fgos" },
            "components": { "legacyNode": { "root": ".", "entry": "bin/fgos.mjs", "digest": digest(entry) } },
            "requires": { "node": ">=18" },
            "target": { "os": "linux", "arch": "x64" },
            "stateSchemas": { "read": ["2"], "write": ["2"], "migrations": [] },
            "files": [serde_json::json!({
                "path": "bin/fgos.mjs", "kind": "file", "digest": digest(entry), "mode": "755", "class": "legacy-node",
            })],
        });
        let canonical = fgos_distribution::verify::to_canonical_json(&manifest);
        manifest["artifactDigest"] = serde_json::json!(digest(canonical.as_bytes()));
        fs::write(
            release.join("manifest.json"),
            serde_json::to_string_pretty(&manifest).unwrap(),
        )
        .unwrap();
    }

    struct Scene {
        root: PathBuf,
    }

    impl Scene {
        fn new() -> Self {
            let root = std::env::temp_dir().join(format!(
                "fgos-authority-project-{}-{}",
                std::process::id(),
                PROJECTS.fetch_add(1, Ordering::SeqCst)
            ));
            let _ = fs::remove_dir_all(&root);
            fs::create_dir_all(root.join("home")).unwrap();
            fs::create_dir_all(root.join("state")).unwrap();
            let root = fs::canonicalize(root).unwrap();
            let project = root.join("project");
            fs::create_dir_all(project.join("plans/p")).unwrap();
            git(&root, &["init", "-q", "-b", "work", "project"]);
            git(&project, &["config", "fgos.machineid", "m-test"]);
            fs::write(project.join("plans/p/plan.md"), "plan\n").unwrap();
            git(&project, &["add", "."]);
            git(&project, &["commit", "-q", "-m", "init"]);
            // What an initialised project holds before its first append.
            let fence = project.join(".fgos/locks/activation.lock");
            fs::create_dir_all(&fence).unwrap();
            fs::write(
                fence.join("TOMBSTONE"),
                "{\"at\":\"fixture\",\"v\":1,\"lock\":\"activation\",\"by\":\"fgos git\"}\n",
            )
            .unwrap();
            let locks = project.join(".git/fgos/events/locks");
            fs::create_dir_all(&locks).unwrap();
            {
                use std::os::unix::fs::PermissionsExt;
                for dir in [root.join("state"), project.join(".git/fgos"), locks] {
                    fs::set_permissions(dir, fs::Permissions::from_mode(0o700)).unwrap();
                }
            }
            fgos_identity::machine::mint_here(&root.join("state")).unwrap();
            release(&root);
            Self { root }
        }

        fn project(&self) -> PathBuf {
            self.root.join("project")
        }

        fn model(&self) -> PathBuf {
            self.project().join(".fgos/authority/model")
        }

        fn run(&self, args: &[&str], stdin: &[u8]) -> Output {
            let mut child = Command::new(env!("CARGO_BIN_EXE_fgos"))
                .current_dir(self.project())
                .env_clear()
                .env("HOME", self.root.join("home"))
                .env("PATH", std::env::var_os("PATH").unwrap_or_default())
                .env("FGOS_STATE_ROOT", self.root.join("state"))
                .env("FGOS_SESSION_ID", SESSION)
                .env("FGOS_ACTIVE_RELEASE_PATH", self.root.join("release"))
                .args(args)
                .stdin(Stdio::piped())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
                .unwrap();
            let _ = child.stdin.take().unwrap().write_all(stdin);
            child.wait_with_output().unwrap()
        }

        fn data(&self, args: &[&str]) -> serde_json::Value {
            let mut all = vec!["authority"];
            all.extend_from_slice(args);
            all.push("--json");
            let out = self.run(&all, b"");
            assert!(
                out.status.success(),
                "{all:?}: {}{}",
                String::from_utf8_lossy(&out.stdout),
                String::from_utf8_lossy(&out.stderr)
            );
            let envelope: serde_json::Value = serde_json::from_slice(&out.stdout).unwrap();
            assert_eq!(envelope["contract"], "fgos.v1", "{envelope}");
            envelope["data"].clone()
        }

        fn declare(&self, row: &str, approved_by: Option<&str>) -> Output {
            let mut args = vec!["authority", "declare", "--kind", "component", "--row", row];
            if let Some(question) = approved_by {
                args.extend(["--approved-by", question]);
            }
            self.run(&args, b"")
        }
    }

    impl Drop for Scene {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.root);
        }
    }

    const ROW: &str = r#"{"id":"billing","canonical":"billing","aliases":["invoicing"],"meaning":"charges customers","layer":"domain","tier":3,"paths":["plans/"],"owns":[],"mustNotOwn":[],"spec":"plans/p/plan.md","source":[],"status":"designed"}"#;

    fn under_an_agent() -> bool {
        let tree = fgos_identity::os_process_tree();
        fgos_identity::resolve::agent_in_ancestry(tree.as_ref(), Some(std::process::id())).is_some()
    }

    #[test]
    fn locate_answers_inactive_and_an_approved_declare_creates_the_model_under_dot_fgos() {
        let scene = Scene::new();

        let inactive = scene.data(&["locate", "billing"]);
        assert_eq!(inactive["authority"], "inactive", "{inactive}");
        assert_eq!(scene.data(&["model"])["authority"], "inactive");

        let refused = scene.declare(ROW, None);
        assert!(!refused.status.success(), "{refused:?}");

        let asked = scene.run(
            &["questions", "ask", "--ref", "plan:p", "--input", "-"],
            QUESTION.as_bytes(),
        );
        assert!(asked.status.success(), "ask: {asked:?}");
        let question = String::from_utf8(asked.stdout).unwrap().trim().to_owned();
        let open = scene.declare(ROW, Some(&question));
        assert!(
            !open.status.success(),
            "an open question approves nothing: {open:?}"
        );
        assert!(
            String::from_utf8_lossy(&open.stderr).contains("approval-not-answered"),
            "{}",
            String::from_utf8_lossy(&open.stderr)
        );
        assert!(
            !scene.project().join(".fgos/authority").exists(),
            "a refused declare created a model"
        );

        let answered = scene.run(&["questions", "answer", &question, "--option", "A"], b"");
        if under_an_agent() {
            // The owner rule of `answer` refuses an agent caller; the approved half runs from a person's shell.
            assert_eq!(answered.status.code(), Some(2), "{answered:?}");
            return;
        }
        assert!(answered.status.success(), "answer: {answered:?}");

        let declared = scene.data(&[
            "declare",
            "--kind",
            "component",
            "--row",
            ROW,
            "--approved-by",
            &question,
        ]);
        assert_eq!(declared["declared"]["id"], "billing", "{declared}");
        assert_eq!(declared["declared"]["createdModel"], true, "{declared}");
        assert!(declared.get("views").is_none(), "{declared}");
        assert!(
            !scene.project().join("packages").exists(),
            "the model of another project must not land under packages/"
        );
        let model = fgos_component_authority::Model::load_dir(&scene.model())
            .expect("the five created files load and validate");
        assert_eq!(model.components.len(), 1);
        assert!(
            model.decision_kinds.is_empty() && model.contracts.is_empty() && model.doors.is_empty()
        );

        let found = scene.data(&["locate", "invoicing"]);
        assert_eq!(found["matches"][0]["id"], "billing", "{found}");
        assert_ne!(found["authority"], "inactive", "{found}");
    }
}
