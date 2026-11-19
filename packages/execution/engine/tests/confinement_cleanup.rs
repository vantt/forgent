//! Confinement cleanup against the vectors recorded from the Node modules it ports
//! (`packages/execution/contracts/confinement-cleanup/`, recorded by
//! `test/golden-recorders/confinement-cleanup.recorder.mjs`), plus the behaviour the vectors cannot hold: the sweep of a
//! process that runs from a home about to be deleted, the settle of a held home through the credentials port, and
//! the falsification probes against a real `bwrap` where the machine has one.

#![cfg(unix)]

use fgos_execution_engine::confinement::cleanup::{
    self as cleanup, CleanupError, CleanupHost, CredentialWriteBack, Orphans, SystemHost,
    WriteBackOutcome,
};
use serde_json::{json, Map, Value};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

const NOW: i64 = 1_700_000_000_000;
const DEAD_PID: u32 = 2_000_000_000;

fn vectors(name: &str) -> Value {
    let path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../contracts/confinement-cleanup")
        .join(name);
    serde_json::from_str(
        &fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display())),
    )
    .unwrap()
}

fn scratch(label: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos-cc-{label}-{}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    fs::canonicalize(dir).unwrap()
}

/// The sweep needs no process table for the vectors: nothing runs from a fixture tree. Liveness is the real one.
struct VectorHost;
impl CleanupHost for VectorHost {
    fn stop_inside(&self, _dir: &Path) -> Vec<u32> {
        Vec::new()
    }
    fn owner_is_dead(&self, pid: u32) -> bool {
        SystemHost::default().owner_is_dead(pid)
    }
}

/// A write-back that must never be asked: no vector holds a finalization descriptor.
struct NeverAsked;
impl CredentialWriteBack for NeverAsked {
    fn write_back(&self, home: &Path, _target: Option<&Value>) -> WriteBackOutcome {
        panic!("write-back asked for {}", home.display());
    }
}

// ---- fixtures ----------------------------------------------------------------------------------------------------

fn tokens(value: &Value, home: &Path) -> Value {
    match value {
        Value::String(s) if s == "$SELF" => json!(std::process::id()),
        Value::String(s) if s == "$DEAD" => json!(DEAD_PID),
        Value::String(s) if s == "$HOME" => json!(home.to_string_lossy()),
        Value::Array(list) => Value::Array(list.iter().map(|v| tokens(v, home)).collect()),
        Value::Object(map) => Value::Object(
            map.iter()
                .map(|(k, v)| (k.clone(), tokens(v, home)))
                .collect(),
        ),
        other => other.clone(),
    }
}

/// `JSON.stringify(value, null, indent)`.
fn stringify(value: &Value, compact: bool) -> String {
    if compact {
        serde_json::to_string(value).unwrap()
    } else {
        serde_json::to_string_pretty(value).unwrap()
    }
}

/// `mkdir -p` at 0755 whatever the umask of the machine running the test: the vectors were recorded under 022.
fn mkdirs(path: &Path) {
    use std::os::unix::fs::DirBuilderExt;
    fs::DirBuilder::new()
        .recursive(true)
        .mode(0o755)
        .create(path)
        .unwrap();
}

fn set_mode(path: &Path, mode: u32) {
    use std::os::unix::fs::PermissionsExt;
    fs::set_permissions(path, fs::Permissions::from_mode(mode)).unwrap();
}

fn build(base: &Path, entries: &[Value]) {
    for entry in entries {
        let rel = entry["path"].as_str().unwrap();
        let target = base.join(rel);
        let mode = entry["mode"].as_u64().map(|m| m as u32);
        match entry["kind"].as_str().unwrap() {
            "dir" => {
                mkdirs(&target);
                set_mode(&target, mode.unwrap_or(0o755));
            }
            "age" => {}
            "hardlink" => fs::hard_link(base.join(entry["of"].as_str().unwrap()), &target).unwrap(),
            "symlink" => {
                mkdirs(target.parent().unwrap());
                std::os::unix::fs::symlink(entry["target"].as_str().unwrap(), &target).unwrap();
            }
            _ => {
                mkdirs(target.parent().unwrap());
                let text = match entry.get("json") {
                    Some(json) => {
                        let home = base.join(Path::new(rel).parent().unwrap()).join("home");
                        stringify(
                            &tokens(json, &home),
                            entry["compact"].as_bool().unwrap_or(false),
                        )
                    }
                    None => entry["content"].as_str().unwrap().to_string(),
                };
                fs::write(&target, text).unwrap();
                set_mode(&target, mode.unwrap_or(0o644));
            }
        }
    }
    // Ages last: a child written after its parent would move the parent's mtime again.
    for entry in entries {
        if let Some(ago) = entry["mtimeAgoMs"].as_i64() {
            let when = std::time::UNIX_EPOCH + std::time::Duration::from_millis((NOW - ago) as u64);
            fs::File::open(base.join(entry["path"].as_str().unwrap()))
                .unwrap()
                .set_modified(when)
                .unwrap();
        }
    }
}

/// The recorder's `normalise`: the scratch root is `<root>`, timestamps `<iso>`, the two pids tokens.
fn normalise(text: &str, base: &Path) -> String {
    let mut text = text.replace(base.to_str().unwrap(), "<root>");
    for key in ["createdAt", "since"] {
        let open = format!("\"{key}\": \"");
        while let Some(at) = text.find(&open) {
            let from = at + open.len();
            let Some(len) = text[from..].find('"') else {
                break;
            };
            if &text[from..from + len] == "<iso>" {
                // Already normalised: step over it.
                text.replace_range(at..at + 1, "\u{1}");
                continue;
            }
            text.replace_range(from..from + len, "<iso>");
        }
        text = text.replace('\u{1}', "\"");
    }
    for (pid, token) in [(std::process::id(), "$SELF"), (DEAD_PID, "$DEAD")] {
        text = replace_pid(&text, pid, token);
    }
    text
}

/// `"pid": <pid>` (pretty) and `"pid":<pid>` (compact) both become the token.
fn replace_pid(text: &str, pid: u32, token: &str) -> String {
    ["\": ", "\":"].iter().fold(text.to_string(), |text, sep| {
        replace_pid_with(&text, pid, token, sep)
    })
}

fn replace_pid_with(text: &str, pid: u32, token: &str, sep: &str) -> String {
    let needle = format!("\"pid{sep}{pid}");
    let mut out = String::new();
    let mut rest = text;
    while let Some(at) = rest.find(&needle) {
        let end = at + needle.len();
        let boundary = rest[end..]
            .chars()
            .next()
            .is_none_or(|c| !c.is_ascii_digit());
        out.push_str(&rest[..at]);
        out.push_str(&if boundary {
            format!("\"pid{sep}\"{token}\"")
        } else {
            needle.clone()
        });
        rest = &rest[end..];
    }
    out.push_str(rest);
    out
}

fn dump(base: &Path, dir: &Path, out: &mut Vec<Value>) {
    use std::os::unix::fs::PermissionsExt;
    let mut names: Vec<_> = fs::read_dir(dir)
        .unwrap()
        .map(|e| e.unwrap().file_name())
        .collect();
    names.sort();
    for name in names {
        let full = dir.join(&name);
        let rel = full
            .strip_prefix(base)
            .unwrap()
            .to_string_lossy()
            .into_owned();
        let meta = fs::symlink_metadata(&full).unwrap();
        let mode = meta.permissions().mode() & 0o777;
        if meta.file_type().is_symlink() {
            let target = fs::read_link(&full).unwrap();
            out.push(json!({ "path": rel, "kind": "symlink", "target": normalise(target.to_str().unwrap(), base) }));
        } else if meta.is_dir() {
            out.push(json!({ "path": rel, "kind": "dir", "mode": mode }));
            dump(base, &full, out);
        } else {
            let content = String::from_utf8_lossy(&fs::read(&full).unwrap()).into_owned();
            out.push(json!({ "path": rel, "kind": "file", "mode": mode, "content": normalise(&content, base) }));
        }
    }
}

// ---- ops ---------------------------------------------------------------------------------------------------------

type Op = Result<Value, CleanupError>;

fn path_of(base: &Path, rel: &Value) -> PathBuf {
    base.join(rel.as_str().unwrap())
}

fn roots(base: &Path, list: &Value) -> Vec<PathBuf> {
    list.as_array()
        .map_or_else(Vec::new, |l| l.iter().map(|r| path_of(base, r)).collect())
}

fn text_of(path: PathBuf) -> Op {
    Ok(json!(path.to_string_lossy()))
}

fn orphans_json(orphans: &Orphans) -> Value {
    json!({
        "deadOwned": orphans.dead_owned.iter().map(|(dir, id)| json!({ "dir": dir.to_string_lossy(), "dispatchId": id })).collect::<Vec<_>>(),
        "emptyShells": orphans.empty_shells.iter().map(|d| json!(d.to_string_lossy())).collect::<Vec<_>>(),
        "loose": orphans.loose.iter().map(|d| json!(d.to_string_lossy())).collect::<Vec<_>>(),
    })
}

fn str_arg<'a>(fields: &'a Value, key: &str) -> Option<&'a str> {
    fields.get(key).and_then(Value::as_str)
}

fn run_op(op: &str, base: &Path, args: &Value) -> Op {
    let host = VectorHost;
    let fields = tokens(args.get("fields").unwrap_or(&Value::Null), base);
    match op {
        "judge-orphans" => Ok(orphans_json(&cleanup::judge_confinement_orphans(&roots(base, &args["roots"]), NOW, &host))),
        "remove-orphans" => {
            let orphans = cleanup::judge_confinement_orphans(&roots(base, &args["roots"]), NOW, &host);
            let removed = cleanup::remove_confinement_orphans(&orphans, &host);
            Ok(json!({ "tightened": removed.tightened, "removedHomes": removed.removed_homes, "removedShells": removed.removed_shells }))
        }
        "cleanup-resource" => {
            let cleaned = cleanup::cleanup_confinement_resource(&path_of(base, &args["dir"]), args["dispatchId"].as_str(), &host);
            Ok(match cleaned {
                cleanup::Cleaned::Removed { path, dispatch_id } => json!({ "cleaned": true, "path": path.to_string_lossy(), "dispatchId": dispatch_id }),
                cleanup::Cleaned::Kept { reason, error: None } => json!({ "cleaned": false, "reason": reason }),
                cleanup::Cleaned::Kept { reason, error: Some(error) } => json!({ "cleaned": false, "reason": reason, "error": error }),
            })
        }
        "remove-dir" => cleanup::remove_confinement_dir(&path_of(base, &args["dir"]), None).map(|()| json!(true)),
        "list-kept" => Ok(Value::Array(
            cleanup::list_kept_credential_homes(&path_of(base, &args["root"]))
                .into_iter()
                .map(|k| json!({ "dir": k.dir.to_string_lossy(), "attempts": k.attempts, "held": k.held, "since": k.since, "record": k.record }))
                .collect(),
        )),
        "settle-held" => {
            let settled = cleanup::settle_held_credential_homes(&roots(base, &args["roots"]), &roots(base, args.get("unretried").unwrap_or(&Value::Null)), &NeverAsked);
            Ok(json!({ "settled": settled.settled, "held": settled.held }))
        }
        "write-marker" => {
            let pid = fields.get("pid").and_then(Value::as_u64).map_or(std::process::id(), |p| p as u32);
            cleanup::write_ownership_marker(&path_of(base, &args["dir"]), str_arg(&fields, "dispatchId").unwrap_or(""), str_arg(&fields, "resource").unwrap_or("private-home"), pid)
                .map(|p| json!(p.to_string_lossy()))
        }
        "write-marker-v2" => cleanup::write_ownership_marker_v2(
            &path_of(base, &args["dir"]),
            str_arg(&fields, "attemptId"),
            str_arg(&fields, "runDir"),
            str_arg(&fields, "dispatchId"),
            str_arg(&fields, "resource").unwrap_or("private-home"),
        )
        .map(|p| json!(p.to_string_lossy())),
        "read-marker" => Ok(cleanup::read_ownership_marker(&path_of(base, &args["dir"])).unwrap_or(Value::Null)),
        "read-attempt-marker" => Ok(cleanup::read_attempt_ownership_marker(&path_of(base, &args["dir"])).unwrap_or(Value::Null)),
        "write-record" => cleanup::write_attempt_home_record(&path_of(base, &args["home"]), &fields).map(|p| json!(p.to_string_lossy())),
        "read-record" => {
            let wanted = args.get("match").unwrap_or(&Value::Null);
            Ok(cleanup::read_attempt_home_record(&path_of(base, &args["home"]), str_arg(wanted, "attemptId"), str_arg(wanted, "runDir")).unwrap_or(Value::Null))
        }
        "count-keep" => Ok(json!(cleanup::count_credential_keep(&path_of(base, &args["home"]), &fields, args["at"].as_i64().unwrap()))),
        "remove-attempt-home" => cleanup::remove_attempt_home(&path_of(base, &args["home"]), args["dispatchId"].as_str().unwrap()).map(|()| json!(true)),
        "describe-home" => Ok(Value::Array(
            cleanup::describe_attempt_home(&path_of(base, &args["home"]))
                .into_iter()
                .map(|e| json!({ "path": e.path, "kind": e.kind, "files": e.files, "bytes": e.bytes }))
                .collect(),
        )),
        "keep-transcript" => {
            let dest = path_of(base, &args["dest"]);
            cleanup::keep_session_transcript(&path_of(base, &args["home"]), args["sessionDir"].as_str().unwrap(), &dest, None)
                .map(|t| json!({ "found": t.found, "files": t.files, "bytes": t.bytes }))
        }
        "ensure-private-dir" => cleanup::ensure_private_dir(&path_of(base, &args["dir"]), Some(&path_of(base, &args["root"]))).and_then(text_of),
        "remove-empty-parent" => {
            cleanup::remove_empty_dispatch_parent(&path_of(base, &args["removed"]), args["dispatchId"].as_str().unwrap());
            Ok(json!(true))
        }
        "temp-root" => text_of(cleanup::resolve_confinement_temp_root(&path_of(base, &args["base"]))),
        "canonical-root" => text_of(cleanup::canonical_root(&path_of(base, &args["root"]))),
        other => panic!("unknown op {other}"),
    }
}

fn outcome(result: Op) -> Value {
    match result {
        Ok(value) => json!({ "ok": value }),
        Err(err) => {
            let mut map = Map::new();
            map.insert("error".into(), json!(err.message));
            if let Some(code) = err.code {
                map.insert("code".into(), json!(code));
            }
            Value::Object(map)
        }
    }
}

#[test]
fn every_recorded_cleanup_vector_gives_the_same_answer_and_leaves_the_same_tree() {
    // The modes a vector holds follow the umask, and the recorder ran under 022.
    // SAFETY: umask only sets the process's file-creation mask; it touches no memory.
    unsafe { libc::umask(0o022) };
    let doc = vectors("cleanup.v1.json");
    let cases = doc["cases"].as_array().unwrap();
    assert!(cases.len() > 100, "the vectors were recorded");
    let mut failures = Vec::new();
    for case in cases {
        let name = case["name"].as_str().unwrap();
        let base = scratch(&format!("v-{}", name.len()));
        build(&base, case["fixture"].as_array().unwrap());
        let result = run_op(case["op"].as_str().unwrap(), &base, &case["args"]);
        let got: Value =
            serde_json::from_str(&normalise(&outcome(result).to_string(), &base)).unwrap();
        let want = &case["out"];
        let mut tree = Vec::new();
        dump(&base, &base, &mut tree);
        let _ = fs::remove_dir_all(&base);
        if got != *want {
            failures.push(format!("{name}: out {got} != {want}"));
        } else if Value::Array(tree.clone()) != case["tree"] {
            failures.push(format!(
                "{name}: tree {} != {}",
                Value::Array(tree),
                case["tree"]
            ));
        }
    }
    assert!(
        failures.is_empty(),
        "{} of {} vectors differ:\n{}",
        failures.len(),
        cases.len(),
        failures.join("\n")
    );
}

// ---- behaviour the vectors cannot hold -----------------------------------------------------------------------------

const MARKER: &str = ".fgos-confinement-owner.json";

fn plant_owned_home(dir: &Path, dispatch_id: &str, pid: u32) {
    fs::create_dir_all(dir).unwrap();
    cleanup::write_ownership_marker(dir, dispatch_id, "private-home", pid).unwrap();
}

#[test]
fn a_process_running_from_a_home_is_stopped_before_the_home_is_removed() {
    let base = scratch("sweep");
    let home = base.join("t/d1/home");
    plant_owned_home(&home, "d1", DEAD_PID);
    // A leftover of the dispatch: an agent CLI's own background server, running out of the home it was given.
    let mut child = std::process::Command::new("sleep")
        .arg("60")
        .current_dir(&home)
        .spawn()
        .unwrap();
    let cleaned = cleanup::cleanup_confinement_resource(&home, Some("d1"), &SystemHost::default());
    let _ = child.kill();
    let status = child.wait().unwrap();
    assert!(cleaned.is_cleaned(), "{cleaned:?}");
    assert!(!home.exists(), "the home is gone");
    assert!(
        !base.join("t/d1").exists(),
        "the empty dispatch directory went with it"
    );
    assert!(
        !status.success(),
        "the sweeper ended the process before the home went"
    );
    let _ = fs::remove_dir_all(&base);
}

#[test]
fn a_home_of_a_live_dispatcher_is_never_removed_by_the_orphan_sweep() {
    let base = scratch("live");
    let root = base.join("t");
    fs::create_dir_all(&root).unwrap();
    set_mode(&root, 0o700);
    plant_owned_home(&root.join("live/home"), "live", std::process::id());
    plant_owned_home(&root.join("dead/home"), "dead", DEAD_PID);
    let host = SystemHost::default();
    let judged = cleanup::judge_confinement_orphans(std::slice::from_ref(&root), NOW, &host);
    assert_eq!(
        judged.dead_owned,
        vec![(root.join("dead/home"), "dead".to_string())]
    );
    let removed = cleanup::remove_confinement_orphans(&judged, &host);
    assert_eq!(removed.removed_homes, 1);
    assert!(
        root.join("live/home").join(MARKER).exists(),
        "the live owner's home stays"
    );
    assert!(!root.join("dead/home").exists());
    let _ = fs::remove_dir_all(&base);
}

struct Staging {
    outcome: fn() -> WriteBackOutcome,
    asked: std::sync::Mutex<Vec<(PathBuf, Option<Value>)>>,
}
impl CredentialWriteBack for Staging {
    fn write_back(&self, home: &Path, target: Option<&Value>) -> WriteBackOutcome {
        self.asked
            .lock()
            .unwrap()
            .push((home.to_path_buf(), target.cloned()));
        (self.outcome)()
    }
}

fn plant_held_home(base: &Path, write_back: Value) -> PathBuf {
    let run_dir = base.join("run/a1");
    let root = base.join("t");
    let home = root.join("d1/home");
    fs::create_dir_all(&home).unwrap();
    fs::write(home.join("auth.json"), "x").unwrap();
    let descriptors = run_dir.join("protected/confinement-finalization");
    fs::create_dir_all(&descriptors).unwrap();
    fs::write(
        descriptors.join("launch-1.json"),
        json!({ "resources": [{ "pathRef": home.to_string_lossy(), "credentialWriteBack": write_back }] }).to_string(),
    )
    .unwrap();
    cleanup::write_attempt_home_record(
        &home,
        &json!({
            "attemptId": "a1", "runDir": run_dir.to_string_lossy(), "dispatchId": "d1", "launchCommandId": "launch-1",
            "credentialKept": { "attempts": 5, "since": "S", "lastCountedAt": 1 },
        }),
    )
    .unwrap();
    home
}

fn settle(base: &Path, outcome: fn() -> WriteBackOutcome) -> (cleanup::Settled, Staging) {
    let staging = Staging {
        outcome,
        asked: Default::default(),
    };
    let settled = cleanup::settle_held_credential_homes(&[base.join("t")], &[], &staging);
    (settled, staging)
}

fn staged() -> WriteBackOutcome {
    WriteBackOutcome {
        status: "staged",
        code: None,
        keep_home: false,
    }
}
fn unreadable() -> WriteBackOutcome {
    WriteBackOutcome {
        status: "failed",
        code: Some("home-unreadable"),
        keep_home: false,
    }
}
fn refused() -> WriteBackOutcome {
    WriteBackOutcome {
        status: "failed",
        code: Some("stage-failed"),
        keep_home: true,
    }
}

#[test]
fn a_held_home_is_settled_from_the_descriptor_target_and_removed_once_the_login_is_staged() {
    let base = scratch("settle-ok");
    let target = json!({ "provider": "codex", "accountId": "acc" });
    let home = plant_held_home(&base, target.clone());
    let (settled, staging) = settle(&base, staged);
    assert_eq!((settled.settled, settled.held), (1, 0));
    assert_eq!(
        staging.asked.lock().unwrap().as_slice(),
        &[(home.clone(), Some(target))],
        "the target comes from the descriptor, never from the home"
    );
    assert!(!home.exists() && !base.join("t/d1").exists());
    let _ = fs::remove_dir_all(&base);
}

#[test]
fn a_held_home_whose_login_cannot_be_read_is_removed_but_one_whose_staging_failed_stays() {
    let base = scratch("settle-fail");
    let home = plant_held_home(&base, json!({ "provider": "codex" }));
    let (settled, _) = settle(&base, refused);
    assert_eq!((settled.settled, settled.held), (0, 1));
    assert!(
        home.join("auth.json").exists(),
        "a failed staging keeps the login"
    );
    let (settled, _) = settle(&base, unreadable);
    assert_eq!((settled.settled, settled.held), (1, 0));
    assert!(!home.exists(), "a login that cannot be read is no login");
    let _ = fs::remove_dir_all(&base);
}

#[test]
fn a_home_with_no_write_back_target_is_removed_after_the_credentials_port_says_nothing_is_owed() {
    let base = scratch("settle-none");
    let home = plant_held_home(&base, Value::Null);
    let (settled, staging) = settle(&base, || WriteBackOutcome {
        status: "none",
        code: None,
        keep_home: false,
    });
    assert_eq!(settled.settled, 1);
    assert_eq!(
        staging.asked.lock().unwrap().as_slice(),
        &[(home.clone(), None)]
    );
    assert!(!home.exists());
    let _ = fs::remove_dir_all(&base);
}

// ---- fingerprint ---------------------------------------------------------------------------------------------------

fn sha256_hex(text: &str) -> String {
    use sha2::{Digest, Sha256};
    Sha256::digest(text.as_bytes())
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect()
}

#[test]
fn the_probe_fingerprint_names_what_a_stored_proof_is_valid_for() {
    use cleanup::probes::{self, FingerprintInput};
    let doc = vectors("fingerprint.v1.json");
    assert_eq!(probes::PROOF_PROFILE, doc["proofProfile"]);
    let platform = &doc["platform"];
    assert_eq!(
        sha256_hex(&probes::platform_payload(
            "linux",
            "6.1.0",
            "x64",
            "bubblewrap 0.8.0"
        )),
        platform["digest"].as_str().unwrap()
    );
    for case in doc["fingerprints"].as_array().unwrap() {
        let input = &case["input"];
        let mut wanted = FingerprintInput {
            bwrap_executable: "/nonexistent/bwrap".into(),
            ..Default::default()
        };
        if let Some(p) = input["policy"].as_str() {
            wanted.policy = p.into();
        }
        if let Some(v) = input["driverVersion"].as_str() {
            wanted.driver_version = v.into();
        }
        if !input["backendConfig"].is_null() {
            wanted.backend_config = input["backendConfig"].clone();
        }
        wanted.blind = input["blind"].as_bool().unwrap_or(false);
        let mut got = probes::compute_probe_fingerprint(&wanted);
        let digest = got
            .as_object_mut()
            .unwrap()
            .remove("platformDigest")
            .unwrap();
        assert!(
            digest
                .as_str()
                .is_some_and(|d| d.len() == 64 && d.chars().all(|c| c.is_ascii_hexdigit())),
            "{digest}"
        );
        assert_eq!(got, case["out"], "{}", case["name"]);
    }
}

#[test]
fn the_machine_private_falsifiers_name_the_stand_ins_each_mask_hides() {
    let doc = vectors("fingerprint.v1.json");
    let want = doc["falsifiers"].as_object().unwrap();
    let got: HashMap<&str, Vec<&str>> = cleanup::probes::MACHINE_PRIVATE_FALSIFIERS
        .iter()
        .map(|(k, v)| (*k, v.to_vec()))
        .collect();
    assert_eq!(got.len(), want.len());
    for (name, keys) in want {
        let keys: Vec<&str> = keys
            .as_array()
            .unwrap()
            .iter()
            .map(|k| k.as_str().unwrap())
            .collect();
        assert_eq!(got[name.as_str()], keys, "{name}");
    }
}

// ---- probes against a real bwrap ---------------------------------------------------------------------------------

/// The path of a bwrap that runs here, or `None`: asked of the driver's own smoke test, as doctor asks it.
fn working_bwrap() -> Option<String> {
    use fgos_execution_engine::confinement::driver::bwrap::SmokeProbe;
    let path = std::env::var("PATH").unwrap_or_default();
    let smoke = SmokeProbe::new().check("bwrap", &path);
    if !smoke.passed {
        eprintln!("skipped: no working bwrap here ({})", smoke.message);
        return None;
    }
    Some("bwrap".to_string())
}

#[test]
fn each_basic_probe_passes_on_a_sound_sandbox_and_fails_on_its_red_falsifier() {
    use cleanup::probes::*;
    let Some(bwrap) = working_bwrap() else { return };
    let base = scratch("probes");
    let dir = |n: &str| {
        let d = base.join(n);
        fs::create_dir_all(&d).unwrap();
        d
    };
    let (run_dir, target, ws, outside, other, host_home, private_home, creds) = (
        dir("run"),
        dir("target"),
        dir("ws"),
        dir("outside"),
        dir("other"),
        dir("host-home"),
        dir("private-home"),
        dir("creds"),
    );
    let file = base.join("fd.txt");
    let pairs = [
        (
            run_output_writable(&bwrap, &run_dir, false),
            run_output_writable(&bwrap, &run_dir, true),
        ),
        (
            host_write_denied(&bwrap, &target, false),
            host_write_denied(&bwrap, &target, true),
        ),
        (
            workspace_writable(&bwrap, &ws, &outside, WorkspaceFalsifier::None),
            workspace_writable(&bwrap, &ws, &outside, WorkspaceFalsifier::WorkspaceReadOnly),
        ),
        (
            other_run_dir_denied(&bwrap, &run_dir, &other, false),
            other_run_dir_denied(&bwrap, &run_dir, &other, true),
        ),
        (
            private_home_isolated(&bwrap, &host_home, &private_home, false),
            private_home_isolated(&bwrap, &host_home, &private_home, true),
        ),
        (
            no_inherited_writable_fd(&bwrap, &file, false),
            no_inherited_writable_fd(&bwrap, &file, true),
        ),
        (
            executor_credentials_read_only(&bwrap, &creds, false),
            executor_credentials_read_only(&bwrap, &creds, true),
        ),
    ];
    for (sound, broken) in pairs {
        assert!(sound.passed, "{}: {}", sound.probe, sound.detail);
        assert!(
            !broken.passed,
            "{} must catch its red falsifier",
            broken.probe
        );
    }
    assert!(!workspace_writable(&bwrap, &ws, &outside, WorkspaceFalsifier::OutsideWritable).passed);
    // The host may have no interface beyond loopback; the falsifier must fail either way.
    assert!(!host_read_and_network_not_overclaimed(&bwrap, true).passed);
    let _ = fs::remove_dir_all(&base);
}

// ---- the driver's home port and the driver-backed probes -----------------------------------------------------------

use fgos_execution_engine::confinement::driver::bwrap::BwrapDriver;
use fgos_execution_engine::confinement::driver::{
    BackendDriver, Credentials, DriverError, EnvFn, ErrorKind, PrivateHomeHost, ResourceResolver,
};
use fgos_execution_engine::confinement::policy::{
    resolve_confinement_resources, Grant, ResolveContext, ResolveInput,
};
use std::sync::Arc;

#[test]
fn the_home_port_writes_the_markers_and_removes_only_a_home_its_dispatch_owns() {
    let base = scratch("homes");
    let homes = cleanup::CleanupHomes::<SystemHost>::default();
    let home = base.join("t/d1/home");
    homes.ensure_private_dir(&home, &base.join("t")).unwrap();
    homes
        .write_ownership_marker(&home, "d1", "private-home")
        .unwrap();
    assert!(cleanup::read_ownership_marker(&home).is_some());
    let record = homes
        .write_attempt_home_record(&home, &json!({ "attemptId": "a1", "runDir": "/run/a1", "dispatchId": "d1", "launchCommandId": "launch-1" }))
        .unwrap();
    assert_eq!(record, base.join("t/d1/attempt-home.json"));
    // Another dispatch's removal leaves the home; its own takes it and the empty dispatch directory.
    homes.cleanup_resource(&home, "other").unwrap();
    assert!(home.exists());
    fs::remove_file(&record).unwrap();
    homes.cleanup_resource(&home, "d1").unwrap();
    assert!(!base.join("t/d1").exists());
    let refused = homes.write_attempt_marker(&home, &json!({ "runDir": "/run/a1" }));
    assert!(
        matches!(
            refused,
            Err(DriverError {
                kind: ErrorKind::Port,
                ..
            })
        ),
        "{refused:?}"
    );
    let _ = fs::remove_dir_all(&base);
}

/// The policy resolver behind the driver's port: a request's JSON in, the resolved resources as JSON out.
struct PolicyResolver;
impl ResourceResolver for PolicyResolver {
    fn resolve(&self, input: &Value) -> Result<Vec<Value>, DriverError> {
        let text = |path: &[&str]| {
            path.iter()
                .try_fold(input, |v, k| v.get(*k))
                .and_then(Value::as_str)
                .map(str::to_string)
        };
        let context = &input["context"];
        let ctx = |key: &str| context.get(key).and_then(Value::as_str).map(str::to_string);
        let resolve_input = ResolveInput {
            dispatch_id: text(&["dispatchId"]).unwrap_or_default(),
            context: ResolveContext {
                run_dir: ctx("runDir"),
                fgos_dir: ctx("fgosDir"),
                repo_root: ctx("repoRoot"),
                cwd: ctx("cwd"),
                assignment_launch_context: context.get("assignmentLaunchContext").is_some(),
                ..Default::default()
            },
            grants: input["grants"]
                .as_array()
                .map(|list| {
                    list.iter()
                        .map(|g| Grant {
                            resource: g["resource"].as_str().unwrap_or_default().into(),
                            access: g["access"].as_str().unwrap_or_default().into(),
                            ..Default::default()
                        })
                        .collect()
                })
                .unwrap_or_default(),
            temp_root: text(&["backendConfig", "tempRoot"]),
            default_temp_root: cleanup::resolve_confinement_temp_root(&std::env::temp_dir())
                .to_string_lossy()
                .into_owned(),
            credentials_path: text(&["providerSources", "credentialsPath"]),
            default_credentials_dir: std::env::temp_dir()
                .join("fgos-credentials")
                .to_string_lossy()
                .into_owned(),
            blind: input["blind"].as_bool().unwrap_or(false),
            home_dir: text(&["homeDir"])
                .unwrap_or_else(|| std::env::var("HOME").unwrap_or_default()),
            claude_socket_base: text(&["claudeSocketBase"])
                .unwrap_or_else(|| std::env::temp_dir().to_string_lossy().into_owned()),
            xdg_runtime_dir: text(&["xdgRuntimeDir"]),
            xdg_config_home: text(&["xdgConfigHome"]),
            herdr_socket_path: text(&["herdrSocketPath"]),
            login_stores: input["loginStores"]
                .as_array()
                .map(|l| {
                    l.iter()
                        .filter_map(|s| s.as_str().map(str::to_string))
                        .collect()
                })
                .unwrap_or_default(),
            ..Default::default()
        };
        let resolved = resolve_confinement_resources(&resolve_input)
            .map_err(|e| DriverError::new(ErrorKind::Port, e.to_string()))?;
        Ok(resolved
            .iter()
            .map(|r| serde_json::to_value(r).unwrap())
            .collect())
    }
}

/// No account login in a probe: nothing is ever copied.
struct NoCredentials;
impl Credentials for NoCredentials {
    fn login_life_problem(&self, _source: &Value, _timeout_ms: u64) -> Option<String> {
        None
    }
    fn copy_files(
        &self,
        _private_home: &Path,
        _source_home: &Path,
        _files: &[String],
    ) -> Result<Vec<String>, DriverError> {
        Ok(Vec::new())
    }
    fn write_back_target(&self, _capacity: &Value) -> Option<Value> {
        None
    }
}

fn driver_over(runtime_dir: &Path) -> Arc<dyn BackendDriver> {
    let runtime = runtime_dir.to_string_lossy().into_owned();
    let env: EnvFn = Arc::new(move |name| match name {
        "XDG_RUNTIME_DIR" if !runtime.is_empty() => Some(runtime.clone()),
        "HOME" => std::env::var("HOME").ok(),
        _ => None,
    });
    // SAFETY: getuid has no failure mode and touches no memory.
    let uid = unsafe { libc::getuid() };
    Arc::new(BwrapDriver::new(
        Arc::new(PolicyResolver),
        Arc::new(cleanup::CleanupHomes::<SystemHost>::default()),
        Arc::new(NoCredentials),
        env,
        uid,
    ))
}

#[test]
fn the_driver_backed_probes_hold_on_a_sound_sandbox_and_catch_their_red_falsifiers() {
    use cleanup::probes::*;
    let Some(bwrap) = working_bwrap() else { return };
    let base = scratch("driver-probes");
    let ports = ProbePorts {
        resolver: &PolicyResolver,
        driver_for: &driver_over,
    };
    let dir = |n: &str| {
        let d = base.join(n);
        fs::create_dir_all(&d).unwrap();
        d
    };
    let blind = peer_run_hidden(&bwrap, &dir("blind"), std::process::id(), &ports, false);
    assert!(blind.passed, "{}", blind.detail);
    assert!(
        !peer_run_hidden(
            &bwrap,
            &dir("blind-broken"),
            std::process::id(),
            &ports,
            true
        )
        .passed
    );
    let sound = machine_private_hidden(
        &bwrap,
        &dir("mp"),
        true,
        &ports,
        MachinePrivateFalsifier::None,
    );
    assert!(sound.passed, "{}", sound.detail);
    for (name, _) in MACHINE_PRIVATE_FALSIFIERS {
        let broken = machine_private_hidden(
            &bwrap,
            &dir(&format!("mp-{name}")),
            false,
            &ports,
            MachinePrivateFalsifier::Mask(name),
        );
        assert!(!broken.passed, "the {name} mask must be caught");
    }
    assert!(
        !machine_private_hidden(
            &bwrap,
            &dir("mp-all"),
            false,
            &ports,
            MachinePrivateFalsifier::All
        )
        .passed
    );
    assert!(
        !machine_private_hidden(
            &bwrap,
            &dir("mp-own"),
            false,
            &ports,
            MachinePrivateFalsifier::OwnSocket
        )
        .passed
    );
    let all = run_all_confinement_probes(&bwrap, &dir("all"), true, &ports);
    assert_eq!(all.results.len(), 10, "{}", all.message);
    let _ = fs::remove_dir_all(&base);
}
