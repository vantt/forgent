//! Replays the vectors recorded from `src/run-supervisor/trust-store.mjs`
//! (`packages/run-supervisor/contracts/controller/trust-store.v1.json`): every call must answer, write and
//! refuse exactly as the Node module did, byte for byte in the stores it rewrites.

use fgos_run_supervisor::controller::trust_store::*;
use serde_json::{json, Value};
use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

fn vectors() -> Value {
    let path =
        Path::new(env!("CARGO_MANIFEST_DIR")).join("../contracts/controller/trust-store.v1.json");
    serde_json::from_str(&fs::read_to_string(path).expect("vector file")).expect("vector json")
}

fn to_value(json: &Json) -> Value {
    match json {
        Json::Null => Value::Null,
        Json::Bool(b) => json!(b),
        Json::Num(n) => json!(n),
        Json::Str(s) => json!(s),
        Json::Arr(items) => Value::Array(items.iter().map(to_value).collect()),
        Json::Obj(entries) => Value::Object(
            entries
                .iter()
                .map(|(k, v)| (k.clone(), to_value(v)))
                .collect(),
        ),
    }
}

fn walk(dir: &Path, base: &Path, out: &mut BTreeMap<String, String>) {
    for entry in fs::read_dir(dir).unwrap() {
        let path = entry.unwrap().path();
        if path.is_dir() {
            walk(&path, base, out);
        } else {
            out.insert(
                path.strip_prefix(base)
                    .unwrap()
                    .to_string_lossy()
                    .into_owned(),
                fs::read_to_string(&path).unwrap(),
            );
        }
    }
}

fn skipped(list: &[HookTrustSkipped]) -> Value {
    Value::Array(
        list.iter()
            .map(|s| json!({"key": s.key, "reason": s.reason}))
            .collect(),
    )
}

fn text(call: &Value, key: &str, dir: &str) -> Option<String> {
    call.get(key)
        .and_then(Value::as_str)
        .map(|s| s.replace("$DIR", dir))
}

fn run_case(call: &Value, dir: &Path) -> Result<Value, TrustStoreError> {
    let d = dir.to_string_lossy().into_owned();
    let at = |key: &str| dir.join(call[key].as_str().unwrap_or(""));
    let project = text(call, "project", &d).unwrap_or_default();
    let repo_root = text(call, "repoRoot", &d).unwrap_or_default();
    let root = call
        .get("root")
        .and_then(Value::as_str)
        .map(|r| dir.join(r));
    let platform = call
        .get("platform")
        .and_then(Value::as_str)
        .unwrap_or("linux");
    Ok(match call["fn"].as_str().unwrap() {
        "readTrust" => json!(read_trust(&at("path"), &project)?),
        "seedTrust" => json!(seed_trust(&at("path"), &project, &repo_root)?),
        "seedClaudeConfigTrust" => json!(seed_claude_config_trust(
            &at("path"),
            &project,
            &repo_root,
            &at("root")
        )?),
        "readCodexTrust" => json!(read_codex_trust(&at("path"), &project)?),
        "seedCodexTrust" => json!(seed_codex_trust(
            &at("path"),
            &project,
            &repo_root,
            root.as_deref()
        )?),
        "removeCodexTrust" => json!(remove_codex_trust(&at("path"), &project)?),
        "codexHookTrustHash" => {
            let handler = Json::parse(&call["handler"].to_string()).unwrap();
            json!(codex_hook_trust_hash(
                call["event"].as_str().unwrap(),
                call.get("matcher").and_then(Value::as_str),
                &handler,
                platform
            ))
        }
        "codexHookTrustEntries" => {
            let found = codex_hook_trust_entries(&at("path"), platform)?;
            json!({"entries": found.entries.iter().map(|e| json!({"key": e.key, "hash": e.hash})).collect::<Vec<_>>(), "skipped": skipped(&found.skipped)})
        }
        "seedCodexHookTrust" => {
            let seeded = seed_codex_hook_trust(
                &at("path"),
                &project,
                &repo_root,
                root.as_deref(),
                platform,
            )?;
            json!({"keys": seeded.keys, "skipped": skipped(&seeded.skipped)})
        }
        "readAgyTrust" => json!(read_agy_trust(&at("path"), &project)),
        "readAgyStore" => to_value(&read_agy_store(&at("path"))?),
        "seedAgyTrust" => json!(seed_agy_trust(
            &at("path"),
            &project,
            &repo_root,
            root.as_deref()
        )?),
        "removeAgyTrust" => json!(remove_agy_trust(&at("path"), &project)?),
        other => panic!("unknown vector function {other}"),
    })
}

fn scratch(label: &str) -> PathBuf {
    let dir =
        std::env::temp_dir().join(format!("fgos-trust-vectors-{}-{label}", std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
fn every_recorded_trust_store_call_answers_and_writes_as_node_did() {
    // The machine lock `seedTrust` takes lives under the state root: keep it inside the scratch space.
    let state = scratch("state");
    std::env::set_var("FGOS_STATE_ROOT", &state);
    let doc = vectors();
    let cases = doc["cases"].as_array().unwrap();
    assert!(cases.len() >= 50, "the vector file lost cases");
    for (index, case) in cases.iter().enumerate() {
        let name = case["name"].as_str().unwrap();
        let dir = scratch(&index.to_string());
        let d = dir.to_string_lossy().into_owned();
        for (rel, body) in case["files"].as_object().unwrap() {
            let file = dir.join(rel);
            fs::create_dir_all(file.parent().unwrap()).unwrap();
            fs::write(&file, body.as_str().unwrap().replace("$DIR", &d)).unwrap();
        }
        #[cfg(unix)]
        for (rel, mode) in case
            .get("modeFiles")
            .and_then(Value::as_object)
            .into_iter()
            .flatten()
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(
                dir.join(rel),
                fs::Permissions::from_mode(mode.as_u64().unwrap() as u32),
            )
            .unwrap();
        }
        let outcome = run_case(&case["call"], &dir);
        match (&outcome, case.get("error")) {
            (Ok(got), None) => {
                assert_eq!(got, &case["result"].clone().tap_dir(&d), "{name}: result")
            }
            (Err(err), Some(want)) => assert_eq!(
                err.code,
                want["code"].as_str().unwrap(),
                "{name}: error code ({})",
                err.message
            ),
            (got, want) => panic!("{name}: answered {got:?}, recorded {want:?}"),
        }
        let mut after = BTreeMap::new();
        walk(&dir, &dir, &mut after);
        let after: BTreeMap<String, String> = after
            .into_iter()
            .map(|(k, v)| (k, v.replace(&d, "$DIR")))
            .collect();
        let want: BTreeMap<String, String> = case["after"]
            .as_object()
            .unwrap()
            .iter()
            .map(|(k, v)| (k.clone(), v.as_str().unwrap().to_string()))
            .collect();
        assert_eq!(after, want, "{name}: files after the call");
        #[cfg(unix)]
        for (rel, mode) in case["modes"].as_object().unwrap() {
            use std::os::unix::fs::PermissionsExt;
            assert_eq!(
                fs::metadata(dir.join(rel)).unwrap().permissions().mode() & 0o777,
                mode.as_u64().unwrap() as u32,
                "{name}: mode of {rel}"
            );
        }
        let _ = fs::remove_dir_all(&dir);
    }
    let _ = fs::remove_dir_all(&state);
}

/// The recorded results carry `$DIR` for the scratch directory; put it back.
trait TapDir {
    fn tap_dir(self, dir: &str) -> Value;
}

impl TapDir for Value {
    fn tap_dir(self, dir: &str) -> Value {
        serde_json::from_str(&self.to_string().replace("$DIR", dir)).unwrap()
    }
}

#[test]
fn the_ordered_json_keeps_key_order_and_writes_as_javascript_does() {
    let text = "{\"b\":[1,2.5,1e21],\"a\":{\"z\":null,\"y\":\"\\u0001\u{e9}\"}}";
    let json = Json::parse(text).unwrap();
    assert_eq!(
        json.compact(),
        "{\"b\":[1,2.5,1e+21],\"a\":{\"z\":null,\"y\":\"\\u0001\u{e9}\"}}"
    );
    assert!(json.pretty().starts_with("{\n  \"b\": [\n    1,"));
}
