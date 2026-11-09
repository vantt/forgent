//! Owning proof of the snapshot: ladder, merge rules, absent versus null, provenance, trusted root,
//! confined accounts, detected values and refusals. Cases write real files under a temp directory.
#![cfg(unix)]
mod common;

use std::fs;
use std::path::PathBuf;

use common::{cases, files, refs};
use fgos_config::detect::Detectors;
use fgos_config::schema::Schemas;
use fgos_config::snapshot::{snapshot, AccountsState, Context, Snapshot, SnapshotError};
use fgos_config::standard::Standard;
use fgos_yaml_doc::path::{format_path, parse_path};
use fgos_yaml_doc::{Segment, Value as Doc};
use serde_json::{json, Value};

/// The caller's side of the port: answers by formatted path from the fixture.
struct Fixed(Value);

impl Detectors for Fixed {
    fn detect(&self, path: &[Segment]) -> Option<Doc> {
        self.0.get(format_path(path)).map(Doc::from_json)
    }
}

pub fn at<'a>(value: &'a Value, path: &str) -> Option<&'a Value> {
    parse_path(path)
        .unwrap()
        .iter()
        .try_fold(value, |node, segment| match segment {
            Segment::Key(key) => node.get(key.as_str()),
            Segment::Index(index) => node.get(*index),
        })
}

#[test]
fn snapshot_cases() {
    for case in cases("snapshot.v1.json") {
        let (id, input, want) = (
            case["id"].as_str().unwrap(),
            &case["input"],
            &case["expect"],
        );
        let (schema_files, standard_files) = (
            files(&input["schemas"], true),
            files(&input["standard"], false),
        );
        let schemas = Schemas::parse(&refs(&schema_files)).unwrap();
        let standard = Standard::parse(&refs(&standard_files), &schemas).unwrap();
        let dir = common::temp("snap", id);
        let req = common::lay_out(&dir, input);
        let ctx = Context {
            schemas: &schemas,
            standard: &standard,
            digest: "d",
            detectors: &Fixed(input["detect"].clone()),
        };
        let got = snapshot(&ctx, &req);
        if let Some(errors) = want["errors"].as_array() {
            let Err(SnapshotError::Refused(found)) = got else {
                panic!("{id}: expected refusals")
            };
            assert_eq!(found.len(), errors.len(), "{id}: {found:?}");
            for (r, e) in found.iter().zip(errors) {
                let detail = r.detail.clone().unwrap_or_default();
                let checks = [
                    (e[0].as_str(), Some(r.code)),
                    (e[1].as_str(), r.path.as_deref()),
                    (e[2].as_str(), r.file.as_deref()),
                    (
                        e[5].as_str().filter(|k| !k.is_empty()),
                        detail.keyword.as_deref(),
                    ),
                ];
                for (want, have) in checks.into_iter().filter(|(w, _)| w.is_some()) {
                    assert_eq!(have, want, "{id}: {r}");
                }
                if let Some(line) = e[3].as_u64() {
                    assert_eq!(
                        (r.line, r.column),
                        (Some(line as u32), e[4].as_u64().map(|c| c as u32)),
                        "{id}"
                    );
                }
                if let Some(layers) = e[6].as_str().filter(|l| !l.is_empty()) {
                    assert_eq!(detail.layers.join(","), layers, "{id}");
                }
                assert!(
                    !format!("{r} {r:?}").contains("sentinel"),
                    "{id}: a value leaked"
                );
            }
            continue;
        }
        let snap = got.unwrap_or_else(|e| panic!("{id}: {e:?}"));
        for (path, value) in want["at"].as_object().into_iter().flatten() {
            assert_eq!(at(&snap.value, path), Some(value), "{id}: {path}");
        }
        for path in want["absent"].as_array().into_iter().flatten() {
            assert_eq!(
                at(&snap.value, path.as_str().unwrap()),
                None,
                "{id}: {path}"
            );
        }
        let origin = |path: &str| {
            snap.origins
                .iter()
                .find(|o| format_path(&o.path) == path)
                .unwrap_or_else(|| panic!("{id}: no origin {path}"))
        };
        for p in want["prov"].as_array().into_iter().flatten() {
            let found = &origin(p[0].as_str().unwrap()).provenance;
            assert_eq!(
                (
                    found.layer,
                    found.role,
                    found.file.as_deref(),
                    found.line.map(u64::from),
                    found.column.map(u64::from)
                ),
                (
                    p[1].as_str().unwrap(),
                    p[2].as_str().unwrap(),
                    p[3].as_str(),
                    p[4].as_u64(),
                    p[5].as_u64()
                ),
                "{id}: {}",
                p[0]
            );
        }
        for path in want["undescribed"].as_array().into_iter().flatten() {
            assert!(!origin(path.as_str().unwrap()).described, "{id}: {path}");
        }
        for path in want["described"].as_array().into_iter().flatten() {
            assert!(origin(path.as_str().unwrap()).described, "{id}: {path}");
        }
        for role in want["absent_sources"].as_array().into_iter().flatten() {
            assert_eq!(
                snap.revisions[role.as_str().unwrap()],
                "absent",
                "{id}: {role}"
            );
        }
        for role in want["no_revision"].as_array().into_iter().flatten() {
            assert!(
                !snap.revisions.contains_key(role.as_str().unwrap()),
                "{id}: {role}"
            );
        }
        if let Some(state) = want["accounts"].as_str() {
            let confined = snap.accounts == AccountsState::UnavailableConfined;
            assert_eq!(confined, state == "unavailable-confined", "{id}");
        }
        let _ = fs::remove_dir_all(&dir);
    }
}

#[test]
fn a_comment_only_edit_changes_the_revision_and_not_the_value() {
    let schema_files = files(&json!({"s": ["type: object"]}), true);
    let schemas = Schemas::parse(&refs(&schema_files)).unwrap();
    let standard = Standard::parse(&[], &schemas).unwrap();
    let ctx = Context {
        schemas: &schemas,
        standard: &standard,
        digest: "d",
        detectors: &Fixed(json!({})),
    };
    let dir = common::temp("snap", "comment-only");
    let req = common::lay_out(
        &dir,
        &json!({"files": {"project/.fgos/config.yaml": ["s:", "  a: 1"]}}),
    );
    let before = snapshot(&ctx, &req).unwrap();
    fs::write(
        dir.join("project/.fgos/config.yaml"),
        "s:\n  # why\n  a: 1\n",
    )
    .unwrap();
    let after = snapshot(&ctx, &req).unwrap();
    let first =
        fgos_yaml_doc::parse(b"s:\n  a: 1\n", fgos_yaml_doc::Profile::StrictConfig, "f").unwrap();
    assert_eq!(before.revisions["project"], first.revision());
    assert_eq!(before.value, after.value);
    assert_ne!(before.revisions["project"], after.revisions["project"]);
    let _ = fs::remove_dir_all(&dir);
}

/// The bundled schema and standard, which alone carry the real confinement entries, read with the
/// given files laid out under a scratch directory.
fn bundled_snapshot(name: &str, files: Value) -> (Result<Snapshot, SnapshotError>, PathBuf) {
    let (schemas, digest) = Schemas::bundled().unwrap();
    let standard = Standard::bundled(&schemas).unwrap();
    let ctx = Context {
        schemas: &schemas,
        standard: &standard,
        digest: &digest,
        detectors: &Fixed(json!({})),
    };
    let dir = common::temp("snap", name);
    let req = common::lay_out(&dir, &json!({ "files": files }));
    (snapshot(&ctx, &req), dir)
}

const ADVISE: &str = "runner.capabilities.advise.confinement";

fn standard_policy() -> Value {
    let (schemas, _) = Schemas::bundled().unwrap();
    let standard = Standard::bundled(&schemas).unwrap();
    at(standard.value(), &format!("{ADVISE}.policy"))
        .unwrap()
        .clone()
}

/// A capability confinement is one decision, so a higher layer replaces the standard's whole entry.
/// A global file that sets `mode: unconfined` must not inherit the standard's `policy`, which the
/// runner refuses for an unconfined mode.
#[test]
fn an_unconfined_capability_does_not_inherit_the_standard_policy() {
    assert!(standard_policy().is_string());
    let (snap, dir) = bundled_snapshot(
        "confinement-replace",
        json!({"home/.fgos/config.yaml": [
            "runner:",
            "  capabilities:",
            "    advise:",
            "      confinement:",
            "        mode: unconfined"
        ]}),
    );
    assert_eq!(
        at(&snap.unwrap().value, ADVISE),
        Some(&json!({"mode": "unconfined"}))
    );
    let _ = fs::remove_dir_all(&dir);
}

/// A project file is committed by whoever can push to the repository, so over a stricter layer
/// below it a capability's confinement may be equalled or raised, never lowered: the file is
/// refused by name, at the project's line.
#[test]
fn a_project_file_cannot_lower_a_capability_confinement() {
    let (snap, dir) = bundled_snapshot(
        "confinement-lowered",
        json!({"project/.fgos/config.yaml": [
            "runner:",
            "  capabilities:",
            "    advise:",
            "      confinement:",
            "        mode: unconfined"
        ]}),
    );
    match snap {
        Err(SnapshotError::Refused(found)) => {
            assert_eq!(found.len(), 1, "{found:?}");
            assert_eq!(
                found[0].code, "config-confinement-lowered",
                "{:?}",
                found[0]
            );
            assert_eq!(found[0].path.as_deref(), Some(ADVISE));
            assert_eq!(found[0].line, Some(4), "{:?}", found[0]);
        }
        other => panic!(
            "a project file lowered {ADVISE} from required to {:?} and was accepted",
            other.map(|snap| at(&snap.value, ADVISE).cloned())
        ),
    }
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn a_project_file_may_equal_or_raise_a_capability_confinement() {
    let policy = standard_policy();
    let policy = policy.as_str().unwrap();
    let project = |mode: &str| {
        json!({"project/.fgos/config.yaml": [
            "runner:",
            "  capabilities:",
            "    advise:",
            "      confinement:",
            format!("        mode: {mode}"),
            format!("        policy: {policy}")
        ]})
    };
    let global = json!({"home/.fgos/config.yaml": [
        "runner:",
        "  capabilities:",
        "    advise:",
        "      confinement:",
        "        mode: preferred",
        format!("        policy: {policy}")
    ]});
    for (name, mode, below) in [
        ("equal", "required", json!({})),
        ("raise", "required", global.clone()),
        ("same", "preferred", global.clone()),
    ] {
        let mut files = project(mode);
        files
            .as_object_mut()
            .unwrap()
            .extend(below.as_object().unwrap().clone());
        let (snap, dir) = bundled_snapshot(&format!("confinement-{name}"), files);
        let snap = snap.unwrap_or_else(|e| panic!("{name}: {e:?}"));
        assert_eq!(
            at(&snap.value, &format!("{ADVISE}.mode")),
            Some(&json!(mode)),
            "{name}"
        );
        let _ = fs::remove_dir_all(&dir);
    }
}

/// A project file is committed by whoever can push to the repository, so a key that decides which
/// program runs or how little it is confined belongs to the machine's own file: the project file is
/// refused by name at its line, and the same text in the global file is accepted.
#[test]
fn a_project_file_cannot_set_what_runs_or_loosen_how_it_is_confined() {
    let cases: [(&str, &[&str], &str); 11] = [
        (
            "executor-command",
            &["runner:", "  executor:", "    command: tool"],
            "runner.executor.command",
        ),
        (
            "executor-args",
            &["runner:", "  executor:", "    args: [a]"],
            "runner.executor.args",
        ),
        (
            "executor-entry-command",
            &[
                "runner:",
                "  executors:",
                "    ex:",
                "      kind: agent",
                "      command: tool",
            ],
            "runner.executors.ex.command",
        ),
        (
            "executor-entry-args",
            &[
                "runner:",
                "  executors:",
                "    ex:",
                "      kind: agent",
                "      args: [a]",
            ],
            "runner.executors.ex.args",
        ),
        (
            "invocation-list",
            &[
                "runner:",
                "  executors:",
                "    ex:",
                "      kind: agent",
                "      invocations:",
                "        - via: cli",
                "          command: tool",
                "          args: [a]",
            ],
            "runner.executors.ex.invocations",
        ),
        (
            "invocation-permission-mode",
            &[
                "runner:",
                "  executors:",
                "    ex:",
                "      kind: agent",
                "      permissionMode: bypass",
            ],
            "runner.executors.ex.permissionMode",
        ),
        (
            "confinement-backend",
            &[
                "runner:",
                "  executors:",
                "    ex:",
                "      kind: agent",
                "      confinement:",
                "        backend: none",
            ],
            "runner.executors.ex.confinement.backend",
        ),
        (
            "confinement-private-home",
            &[
                "runner:",
                "  executors:",
                "    ex:",
                "      kind: agent",
                "      confinement:",
                "        privateHome: false",
            ],
            "runner.executors.ex.confinement.privateHome",
        ),
        (
            "confinement-isolated-session",
            &[
                "runner:",
                "  executors:",
                "    ex:",
                "      kind: agent",
                "      confinement:",
                "        isolatedSession: false",
            ],
            "runner.executors.ex.confinement.isolatedSession",
        ),
        (
            "confinement-controls",
            &[
                "runner:",
                "  executors:",
                "    ex:",
                "      kind: agent",
                "      confinement:",
                "        controls:",
                "          home: host",
            ],
            "runner.executors.ex.confinement.controls",
        ),
        (
            "capability-aliases",
            &[
                "runner:",
                "  capabilities:",
                "    advise:",
                "      aliases: [open]",
            ],
            "runner.capabilities.advise.aliases",
        ),
    ];
    // A command and its args are valid only together in any one file.
    let executor = [
        "runner:",
        "  executor:",
        "    command: tool",
        "    args: [a]",
    ];
    let entry = [
        "runner:",
        "  executors:",
        "    ex:",
        "      kind: agent",
        "      command: tool",
        "      args: [a]",
    ];
    for (name, lines, path) in cases {
        let global: &[&str] = if path.starts_with("runner.executor.") {
            &executor
        } else if path.starts_with("runner.executors.ex.")
            && (path.ends_with(".command") || path.ends_with(".args"))
        {
            &entry
        } else {
            lines
        };
        let (snap, dir) = bundled_snapshot(
            &format!("global-only-{name}"),
            json!({"project/.fgos/config.yaml": lines}),
        );
        match snap {
            Err(SnapshotError::Refused(found)) => {
                assert_eq!(found.len(), 1, "{name}: {found:?}");
                assert_eq!(found[0].code, "config-key-out-of-scope", "{name}");
                assert_eq!(found[0].path.as_deref(), Some(path), "{name}");
                let key = format!("{}:", path.rsplit('.').next().unwrap());
                let line = lines.iter().position(|l| l.trim_start().starts_with(&key));
                assert_eq!(found[0].line, line.map(|n| n as u32 + 1), "{name}");
            }
            other => panic!("{name}: a project file set {path} and it was accepted: {other:?}"),
        }
        let _ = fs::remove_dir_all(&dir);
        let (snap, dir) = bundled_snapshot(
            &format!("global-allowed-{name}"),
            json!({"home/.fgos/config.yaml": global}),
        );
        let snap = snap.unwrap_or_else(|e| panic!("{name}: the global file was refused: {e:?}"));
        assert!(at(&snap.value, path).is_some(), "{name}");
        let _ = fs::remove_dir_all(&dir);
    }
}
