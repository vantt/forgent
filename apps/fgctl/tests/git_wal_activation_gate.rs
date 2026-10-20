//! Real controller admission, including publication and same-digest paths.
#![cfg(target_os = "linux")]
use fgos_git::wal::{self, Begin, Intent, OperationKind, Phase, Tip};
use sha2::{Digest, Sha256};
use std::{
    fs,
    io::{BufRead, BufReader},
    path::Path,
    process::{Command, Stdio},
};
fn hash(bytes: &[u8]) -> String {
    format!("sha256:{:x}", Sha256::digest(bytes))
}
fn candidate(root: &Path, wal: bool) {
    use std::os::unix::fs::PermissionsExt;
    let host = b"#!/bin/sh\nexit 0\n";
    let legacy = b"console.log('fixture');\n";
    fs::create_dir_all(root.join("bin")).unwrap();
    fs::create_dir_all(root.join("libexec/legacy-node/bin")).unwrap();
    fs::write(root.join("bin/fgos"), host).unwrap();
    fs::set_permissions(root.join("bin/fgos"), fs::Permissions::from_mode(0o755)).unwrap();
    fs::write(root.join("libexec/legacy-node/bin/fgos.mjs"), legacy).unwrap();
    let mut m = serde_json::json!({"schemaVersion":1,"entries":{"fgos":"bin/fgos"},"capabilities":if wal { vec!["git-wal-v1"] } else { vec![] },"components":{"legacyNode":{"root":"libexec/legacy-node","entry":"bin/fgos.mjs","digest":hash(legacy)}},"requires":{},"stateSchemas":{"read":["1"],"write":["1"],"migrations":[]},"target":{"os":"linux","arch":"x64"},"files":[{"path":"bin/fgos","kind":"file","digest":hash(host),"mode":"755","class":"immutable-entry"},{"path":"libexec/legacy-node/bin/fgos.mjs","kind":"file","digest":hash(legacy),"mode":"644","class":"immutable-runtime"}]});
    let addon = b"fixture native addon";
    fs::create_dir_all(root.join("native")).unwrap();
    fs::write(root.join("native/fgos.node"), addon).unwrap();
    m["components"]["nativeAddon"] = serde_json::json!({"path":"native/fgos.node","digest":format!("{:x}",Sha256::digest(addon)),"target":"linux-x64","napiVersion":8,"capabilities":["git-wal-v1"],"crateChecksums":fgos_distribution::manifest::native_addon_crate_checksums()});
    m["files"].as_array_mut().unwrap().push(serde_json::json!({"path":"native/fgos.node","kind":"file","digest":hash(addon),"mode":"644","class":"immutable-runtime"}));
    let path = root.join("manifest.json");
    fs::write(&path, serde_json::to_vec(&m).unwrap()).unwrap();
    m["artifactDigest"] = fgos_distribution::verify::recompute_artifact_digest(&path)
        .unwrap()
        .into();
    fs::write(path, serde_json::to_vec(&m).unwrap()).unwrap();
}
fn controller(ws: &Path, state: &Path, verb: &str, from: &Path) -> std::process::Output {
    Command::new(env!("CARGO_BIN_EXE_fgctl"))
        .args([verb, "--from"])
        .arg(from)
        .current_dir(ws)
        .env("FGOS_STATE_ROOT", state)
        .output()
        .unwrap()
}
fn success(out: std::process::Output) {
    assert!(
        out.status.success(),
        "{}",
        String::from_utf8_lossy(&out.stderr)
    );
}
struct Authority;
impl wal::PublicationAuthority for Authority {
    fn validate_publication_borrow(&self, _: &Intent) -> wal::WalResult<()> {
        Ok(())
    }
}
#[test]
fn controller_publication_and_idempotent_paths_enforce_wal_and_keep_the_fence() {
    use std::os::unix::fs::PermissionsExt;
    let root = std::env::temp_dir().join(format!("fgctl-git-c5-{}", std::process::id()));
    fs::create_dir_all(&root).unwrap();
    fs::set_permissions(&root, fs::Permissions::from_mode(0o700)).unwrap();
    let ws = root.join("ws");
    fs::create_dir(&ws).unwrap();
    assert!(Command::new("git")
        .args(["init", "-q"])
        .arg(&ws)
        .status()
        .unwrap()
        .success());
    // A linked worktree outside the workspace root: only the Git listing the
    // gate passes to quiesce-scan as --dir makes a process there a member.
    let linked = root.join("linked");
    let git = |args: &[&str]| {
        assert!(Command::new("git")
            .arg("-C")
            .arg(&ws)
            .args(["-c", "user.name=t", "-c", "user.email=t@t"])
            .args(args)
            .status()
            .unwrap()
            .success())
    };
    git(&["commit", "-q", "--allow-empty", "-m", "base"]);
    git(&[
        "worktree",
        "add",
        "-q",
        "-b",
        "linked",
        linked.to_str().unwrap(),
    ]);
    let state = root.join("state");
    fs::create_dir(&state).unwrap();
    fs::set_permissions(&state, fs::Permissions::from_mode(0o700)).unwrap();
    let old = root.join("old");
    let new = root.join("new");
    candidate(&old, false);
    candidate(&new, true);
    success(controller(&ws, &state, "init", &old));
    let scan = Command::new(env!("CARGO_BIN_EXE_fgctl"))
        .args(["internal", "quiesce-scan", "--protocol", "1", "--root"])
        .arg(&ws)
        .env("FGOS_STATE_ROOT", &state)
        .output()
        .unwrap();
    let scan: serde_json::Value = serde_json::from_slice(&scan.stdout).unwrap();
    if scan["result"] == "unavailable" {
        let out = controller(&ws, &state, "upgrade", &new);
        assert!(!out.status.success());
        let message = String::from_utf8_lossy(&out.stderr);
        // The linked worktree listing succeeded; the scan itself refused.
        assert!(
            message.contains("git-predecessor-writer-live")
                && message.contains("process scan unavailable"),
            "{message}"
        );
        assert!(!fgos_holder_lock::tombstone::is_tombstone(
            &ws.join(".fgos/locks/activation.lock"),
            "activation",
            "fgos git"
        ));
        let common = ws.join(".git");
        let journal = wal::Wal::with_filesystem(&common, wal::OsFileSystem).unwrap();
        let intent = Intent {
            kind: OperationKind::PublicationCas,
            request_digest: "1".repeat(64),
            repo_identity: journal.repository_identity().into(),
            resource_set: vec!["refs/fgos/events/test".into()],
            authority_binding: "test".into(),
            writer_identity: "test".into(),
            object_format: fgos_git::ObjectFormat::Sha1,
            expected: Tip::Absent,
            next: Tip::Oid("1".repeat(40)),
        };
        let chain = match journal.begin("pending", intent, &Authority).unwrap() {
            Begin::Created(c) => c,
            _ => panic!(),
        };
        let pending_refusal = controller(&ws, &state, "init", &old);
        assert!(!pending_refusal.status.success());
        assert!(String::from_utf8_lossy(&pending_refusal.stderr).contains("git-wal-pending"));
        journal
            .append(&chain, Phase::Outcome(wal::Outcome::AbandonedBeforeAttempt))
            .unwrap();
        eprintln!(
            "C5 refused unavailable real process scan: {}",
            scan["detail"]
        );
        fs::remove_dir_all(root).unwrap();
        return;
    }
    let script = ws.join("fgos.mjs");
    fs::write(
        &script,
        "console.log('ready'); setInterval(()=>{},10000);\n",
    )
    .unwrap();
    let mut writer = Command::new("node")
        .arg(&script)
        .current_dir(&ws)
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();
    let mut ready = String::new();
    BufReader::new(writer.stdout.take().unwrap())
        .read_line(&mut ready)
        .unwrap();
    assert_eq!(ready.trim(), "ready");
    let rejected = controller(&ws, &state, "upgrade", &new);
    writer.kill().unwrap();
    writer.wait().unwrap();
    assert!(!rejected.status.success());
    let message = String::from_utf8_lossy(&rejected.stderr);
    assert!(
        message.contains("git-predecessor-writer-live") && message.contains("fgos.mjs"),
        "{message}"
    );
    let script = linked.join("fgos.mjs");
    fs::write(
        &script,
        "console.log('ready'); setInterval(()=>{},10000);\n",
    )
    .unwrap();
    let mut writer = Command::new("node")
        .arg(&script)
        .current_dir(&linked)
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();
    let mut ready = String::new();
    BufReader::new(writer.stdout.take().unwrap())
        .read_line(&mut ready)
        .unwrap();
    assert_eq!(ready.trim(), "ready");
    let rejected = controller(&ws, &state, "upgrade", &new);
    writer.kill().unwrap();
    writer.wait().unwrap();
    assert!(!rejected.status.success());
    let message = String::from_utf8_lossy(&rejected.stderr);
    assert!(
        message.contains("git-predecessor-writer-live") && message.contains("fgos.mjs"),
        "{message}"
    );
    let other = root.join("other-workspace");
    fs::create_dir(&other).unwrap();
    let other_script = other.join("fgos.mjs");
    fs::write(
        &other_script,
        "console.log('ready'); setInterval(()=>{},10000);\n",
    )
    .unwrap();
    let mut unrelated = Command::new("node")
        .arg(&other_script)
        .args(["run", "--dir"])
        .arg(&other)
        .current_dir(&other)
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();
    let mut ready = String::new();
    BufReader::new(unrelated.stdout.take().unwrap())
        .read_line(&mut ready)
        .unwrap();
    assert_eq!(ready.trim(), "ready");
    let mut directed = Command::new("node")
        .arg(&other_script)
        .args(["run", "--worktree"])
        .arg(&ws)
        .current_dir(&other)
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();
    let mut ready = String::new();
    BufReader::new(directed.stdout.take().unwrap())
        .read_line(&mut ready)
        .unwrap();
    assert_eq!(ready.trim(), "ready");
    let rejected = controller(&ws, &state, "upgrade", &new);
    directed.kill().unwrap();
    directed.wait().unwrap();
    assert!(!rejected.status.success());
    assert!(String::from_utf8_lossy(&rejected.stderr).contains("git-predecessor-writer-live"));
    let activated = controller(&ws, &state, "upgrade", &new);
    unrelated.kill().unwrap();
    unrelated.wait().unwrap();
    success(activated);
    let fence = ws.join(".fgos/locks/activation.lock");
    assert!(fgos_holder_lock::tombstone::is_tombstone(
        &fence,
        "activation",
        "fgos git"
    ));
    for verb in ["init", "upgrade"] {
        fs::remove_dir_all(&fence).unwrap(); // Simulate activation by a pre-C5 controller.
        success(controller(&ws, &state, verb, &new));
        assert!(fgos_holder_lock::tombstone::is_tombstone(
            &fence,
            "activation",
            "fgos git"
        ));
    }
    let common = ws.join(".git");
    let journal = wal::Wal::with_filesystem(&common, wal::OsFileSystem).unwrap();
    let intent = Intent {
        kind: OperationKind::PublicationCas,
        request_digest: "1".repeat(64),
        repo_identity: journal.repository_identity().into(),
        resource_set: vec!["refs/fgos/events/test".into()],
        authority_binding: "test".into(),
        writer_identity: "test".into(),
        object_format: fgos_git::ObjectFormat::Sha1,
        expected: Tip::Absent,
        next: Tip::Oid("1".repeat(40)),
    };
    let chain = match journal.begin("pending", intent, &Authority).unwrap() {
        Begin::Created(c) => c,
        _ => panic!(),
    };
    let rejected = controller(&ws, &state, "upgrade", &old);
    assert!(!rejected.status.success());
    assert!(String::from_utf8_lossy(&rejected.stderr).contains("git-wal-pending"));
    journal
        .append(&chain, Phase::Outcome(wal::Outcome::AbandonedBeforeAttempt))
        .unwrap();
    success(controller(&ws, &state, "upgrade", &old));
    assert!(fgos_holder_lock::tombstone::is_tombstone(
        &fence,
        "activation",
        "fgos git"
    ));
    fs::remove_dir_all(root).unwrap();
}

#[test]
fn addon_admission_names_missing_payload_or_capability_and_preserves_activation() {
    let root = std::env::temp_dir().join(format!("fgctl-addon-m10-{}", std::process::id()));
    fs::create_dir_all(&root).unwrap();
    let ws = root.join("ws");
    fs::create_dir_all(&ws).unwrap();
    assert!(Command::new("git")
        .args(["init", "-q"])
        .arg(&ws)
        .status()
        .unwrap()
        .success());
    let state = root.join("state");
    fs::create_dir_all(&state).unwrap();
    // The Git driver refuses a state root that is group or world writable, whatever the umask.
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(&state, fs::Permissions::from_mode(0o700)).unwrap();
    let good = root.join("good");
    candidate(&good, false);
    success(controller(&ws, &state, "init", &good));
    let activation = ws.join(".fgos/installation/activation.json");
    let before = fs::read(&activation).unwrap();
    for missing in [true, false] {
        let bad = root.join(if missing { "missing" } else { "capability" });
        candidate(&bad, false);
        let manifest = bad.join("manifest.json");
        let mut m: serde_json::Value =
            serde_json::from_slice(&fs::read(&manifest).unwrap()).unwrap();
        if missing {
            m["components"]
                .as_object_mut()
                .unwrap()
                .remove("nativeAddon");
        } else {
            m["components"]["nativeAddon"]["capabilities"] = serde_json::json!([]);
        }
        m.as_object_mut().unwrap().remove("artifactDigest");
        fs::write(&manifest, serde_json::to_vec(&m).unwrap()).unwrap();
        m["artifactDigest"] = fgos_distribution::verify::recompute_artifact_digest(&manifest)
            .unwrap()
            .into();
        fs::write(&manifest, serde_json::to_vec(&m).unwrap()).unwrap();
        for verb in ["init", "upgrade"] {
            let fresh = root.join(if missing {
                "fresh-missing"
            } else {
                "fresh-capability"
            });
            fs::create_dir_all(&fresh).unwrap();
            assert!(Command::new("git")
                .args(["init", "-q"])
                .arg(&fresh)
                .status()
                .unwrap()
                .success());
            let out = controller(
                if verb == "init" { &fresh } else { &ws },
                &state,
                verb,
                &bad,
            );
            assert!(!out.status.success());
            assert!(
                String::from_utf8_lossy(&out.stderr).contains("git-addon-missing"),
                "{}",
                String::from_utf8_lossy(&out.stderr)
            );
            assert_eq!(fs::read(&activation).unwrap(), before);
        }
        success(controller(&ws, &state, "stage", &bad));
        let mut rollback_binding: serde_json::Value = serde_json::from_slice(&before).unwrap();
        rollback_binding["previousArtifactDigest"] = m["artifactDigest"].clone();
        fs::write(&activation, serde_json::to_vec(&rollback_binding).unwrap()).unwrap();
        let rollback_before = fs::read(&activation).unwrap();
        let repair = Command::new(env!("CARGO_BIN_EXE_fgctl"))
            .arg("repair")
            .current_dir(&ws)
            .env("FGOS_STATE_ROOT", &state)
            .output()
            .unwrap();
        assert!(!repair.status.success());
        assert!(
            String::from_utf8_lossy(&repair.stderr).contains("git-addon-missing"),
            "{}",
            String::from_utf8_lossy(&repair.stderr)
        );
        assert_eq!(fs::read(&activation).unwrap(), rollback_before);
        fs::write(&activation, &before).unwrap();
        let mut parsed: fgos_distribution::manifest::ReleaseManifest =
            serde_json::from_value(m).unwrap();
        parsed.target.os = "windows".into();
        parsed.target.arch = "x64".into();
        parsed.components.native_addon = None;
        assert!(fgos_distribution::verify::require_git_addon(&parsed).is_ok());
    }
    fs::remove_dir_all(root).unwrap();
}
