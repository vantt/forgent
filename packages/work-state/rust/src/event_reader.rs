//! In-process Work adapter. Event Store owns discovery, integrity and order.
use fgos_event_store::{
    cursor::Cursor,
    identity::{machine_id, StoreIdentity},
    layout::{Layout, StreamId},
    read::{read, ReadRequest},
};
use fgos_git::{GitDriver, Inspect, ResolveRepo};
use fgos_observe::contract::SourceError;
use serde_json::{json, Value};
use std::path::Path;

pub(crate) fn events(root: &Path) -> Result<Vec<(String, Value)>, SourceError> {
    let failed = |e: &dyn std::fmt::Display| SourceError::ReadFailed {
        source_id: "work",
        message: e.to_string(),
    };
    let (state, _) = fgos_holder_lock::state_root();
    let driver = GitDriver::new(&state).map_err(|e| failed(&format!("{e:?}")))?;
    let repo = match driver
        .resolve_repo(root, root)
        .map_err(|e| failed(&format!("{e:?}")))?
    {
        ResolveRepo::Repository(repo) => repo,
        ResolveRepo::NotARepository => return Err(failed(&"event-store-no-repository")),
    };
    let configured = driver
        .machine_id(&repo)
        .map_err(|e| failed(&format!("{e:?}")))?;
    let configured = configured
        .as_ref()
        .map(|f| std::str::from_utf8(&f.value))
        .transpose()
        .map_err(|e| failed(&format!("{e:?}")))?;
    let machine = machine_id(configured, &state).map_err(|e| failed(&format!("{e:?}")))?;
    let layout =
        Layout::from_common_dir(Some(repo.common_dir())).map_err(|e| failed(&format!("{e:?}")))?;
    let origin = match std::fs::symlink_metadata(layout.store()) {
        Ok(_) => {
            StoreIdentity::open(&layout, &machine)
                .map_err(|e| failed(&format!("{e:?}")))?
                .store_id
        }
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => String::new(),
        Err(e) => return Err(failed(&e)),
    };
    let streams = [StreamId::parse("project").map_err(|e| failed(&format!("{e:?}")))?];
    let result = read(
        &driver,
        &repo,
        ReadRequest {
            layout: &layout,
            origin: &origin,
            machine: &machine,
            streams: &streams,
            cursor: &Cursor::default(),
            folded: &[],
            project: true,
        },
    )
    .map_err(|e| failed(&format!("{e:?}")))?;
    if !result.deferred.is_empty() || !result.missing.is_empty() {
        return Err(failed(&"event-store-incomplete-history"));
    }
    let mut events: Vec<_> = result
        .legacy
        .into_iter()
        .map(|e| {
            (
                e.provenance
                    .file
                    .strip_prefix(".fgos/")
                    .unwrap_or(&e.provenance.file)
                    .to_owned(),
                e.event,
            )
        })
        .collect();
    events.extend(result.sequence.into_iter().map(|e| {
        (
            format!("{}:{}", e.origin, e.stream),
            json!({"type":e.event_type,"ts":e.ts,"seq":e.seq,"payload":e.payload}),
        )
    }));
    Ok(events)
}

#[cfg(test)]
pub(crate) fn import_fixture(root: &Path, content: &str) {
    use std::{fs, process::Command};
    let git = |args: &[&str]| {
        let output = Command::new("git")
            .arg("-C")
            .arg(root)
            .args(args)
            .output()
            .unwrap();
        assert!(
            output.status.success(),
            "{}",
            String::from_utf8_lossy(&output.stderr)
        );
        String::from_utf8(output.stdout).unwrap().trim().to_owned()
    };
    git(&["init", "-q"]);
    git(&["config", "user.name", "Fixture"]);
    git(&["config", "user.email", "fixture@example.test"]);
    git(&["config", "fgos.machineId", "work-fixture"]);
    let fence = root.join(".fgos/locks/activation.lock");
    fs::create_dir_all(&fence).unwrap();
    fs::write(
        fence.join("TOMBSTONE"),
        r#"{"lock":"activation","by":"fgos git","at":"fixture"}"#,
    )
    .unwrap();
    fs::write(root.join(".fgos/events.jsonl"), content).unwrap();
    git(&["add", ".fgos/events.jsonl"]);
    git(&["commit", "-qm", "legacy fixture"]);
    let (state, _) = fgos_holder_lock::state_root();
    let driver = GitDriver::new(&state).unwrap();
    let repo = match driver.resolve_repo(root, root).unwrap() {
        ResolveRepo::Repository(repo) => repo,
        _ => panic!("repository required"),
    };
    let layout = Layout::from_common_dir(Some(repo.common_dir())).unwrap();
    fs::create_dir_all(layout.root.join("locks")).unwrap();
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        for dir in [
            repo.common_dir().join("fgos"),
            layout.root.clone(),
            layout.root.join("locks"),
        ] {
            fs::set_permissions(dir, fs::Permissions::from_mode(0o700)).unwrap();
        }
    }
    // An earlier release's migration: the legacy file published as a sealed commit at
    // `refs/fgos/legacy`, then retired from HEAD behind the tracked fence that names it.
    let git_with = |args: &[&str], input: &[u8]| {
        use std::io::Write;
        let mut child = Command::new("git")
            .arg("-C")
            .arg(root)
            .args(args)
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .spawn()
            .unwrap();
        child.stdin.take().unwrap().write_all(input).unwrap();
        let output = child.wait_with_output().unwrap();
        assert!(output.status.success(), "git {args:?} failed");
        String::from_utf8(output.stdout).unwrap().trim().to_owned()
    };
    let blob_tree = |name: &str, blob: &str| {
        git_with(&["mktree"], format!("100644 blob {blob}\t{name}\n").as_bytes())
    };
    let head = git(&["rev-parse", "HEAD"]);
    let events_blob = git(&["hash-object", "-w", ".fgos/events.jsonl"]);
    let data_tree = blob_tree("events.jsonl", &events_blob);
    let seal = fgos_event_store::envelope::Seal::Legacy {
        from_commit: head.clone(),
        tree_of_fgos_events: data_tree,
    };
    let seal_blob = git_with(
        &["hash-object", "-w", "--stdin"],
        &seal.canonical_line().unwrap(),
    );
    let legacy_tree = git_with(
        &["mktree"],
        format!("100644 blob {events_blob}\tevents.jsonl\n100644 blob {seal_blob}\tseal.json\n")
            .as_bytes(),
    );
    let legacy_commit = git(&["commit-tree", &legacy_tree, "-m", "fgos-events legacy import"]);
    git(&["update-ref", "refs/fgos/legacy", &legacy_commit]);
    let pin = json!({
        "legacyRefOid": legacy_commit,
        "sealDigest": seal.digest().unwrap(),
        "fromCommit": head,
    });
    // No legacy worktree reader can satisfy these fixtures after import.
    fs::remove_file(root.join(".fgos/events.jsonl")).unwrap();
    fs::write(root.join(".fgos/events"), serde_json::to_vec(&pin).unwrap()).unwrap();
    git(&["add", "-A", ".fgos/events.jsonl", ".fgos/events"]);
    git(&["commit", "-qm", "cutover fixture"]);
}

#[cfg(test)]
mod tests {
    use super::*;
    use fgos_event_store::{
        append::{append, AppendRequest, EventInput},
        registry::Registry,
    };
    use fgos_observe::contract::{ObservationSource, Window};
    #[test]
    fn work_reads_real_open_batches_and_rejects_acknowledged_corruption() {
        let root = std::env::temp_dir().join(format!("work-native-reader-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(&root).unwrap();
        import_fixture(&root, "");
        let layout = Layout::from_common_dir(Some(&root.join(".git"))).unwrap();
        let mut registry = Registry::default();
        registry
            .load_files(&[
                Path::new(env!("CARGO_MANIFEST_DIR")).join("../contracts/event-streams.v1.json")
            ])
            .unwrap();
        let stream = StreamId::parse("project").unwrap();
        append(
            &layout,
            &registry,
            AppendRequest {
                stream: &stream,
                events: &[EventInput {
                    event_type: "work.add".into(),
                    schema_version: 1,
                    payload: json!({"id":"native-one","kind":"task"}),
                    ts: "2026-10-20T00:00:00.000Z".into(),
                }],
                cursor: &Default::default(),
                writer: "native-fixture",
                machine: "work-fixture",
                held_ranks: &[],
            },
        )
        .unwrap();
        let source = crate::work_source::WorkSource::new();
        let window = Window {
            since: None,
            until: None,
        };
        let got = source.observations(&root, &window).unwrap();
        assert_eq!(got.len(), 1);
        assert_eq!(got[0].subject.id, "native-one");
        let active = layout.stream(&stream).active();
        let bytes = std::fs::read_to_string(&active)
            .unwrap()
            .replace("work.add", "work.bad");
        std::fs::write(active, bytes).unwrap();
        assert!(source.observations(&root, &window).is_err());
        std::fs::remove_dir_all(root).unwrap();
    }
}
