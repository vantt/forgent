//! Credential renewal replays the vectors recorded from the Node module it ports
//! (`packages/execution/contracts/credentials/`, recorded by `test/golden-recorders/credentials.recorder.mjs`), and
//! proves copy, stage, write-back, the interrupted-staging sweep and refresh-ahead on a temp home against fakes for
//! the account lock and the credential probe.

use std::cell::RefCell;
use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

use fgos_execution_engine::credentials::files::{b64url_encode, iso_from_ms, parse_date_ms};
use fgos_execution_engine::credentials::store::{pending_name, StoreJudgement, SweepOptions};
use fgos_execution_engine::credentials::*;
use serde_json::{json, Value};

const NOW: f64 = 1_780_315_200_000.0; // 2026-06-01T12:00:00Z, as recorded
const HOUR: f64 = 3_600_000.0;

fn vectors(name: &str) -> Value {
    let path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../contracts/credentials")
        .join(name);
    serde_json::from_str(
        &fs::read_to_string(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display())),
    )
    .unwrap()
}

fn scratch(tag: &str) -> PathBuf {
    use std::sync::atomic::{AtomicU32, Ordering};
    static N: AtomicU32 = AtomicU32::new(0);
    let dir = std::env::temp_dir().join(format!(
        "fgos-credentials-{tag}-{}-{}",
        std::process::id(),
        N.fetch_add(1, Ordering::SeqCst)
    ));
    fs::create_dir_all(&dir).unwrap();
    dir
}

fn lay(dir: &Path, files: &Value) {
    for (rel, content) in files.as_object().unwrap() {
        let target = dir.join(rel);
        fs::create_dir_all(target.parent().unwrap()).unwrap();
        fs::write(target, content.as_str().unwrap()).unwrap();
    }
}

fn read_tree(dir: &Path) -> BTreeMap<String, String> {
    fn walk(root: &Path, current: &Path, out: &mut BTreeMap<String, String>) {
        for entry in fs::read_dir(current).unwrap() {
            let path = entry.unwrap().path();
            if path.is_dir() {
                walk(root, &path, out);
            } else {
                out.insert(
                    path.strip_prefix(root)
                        .unwrap()
                        .to_string_lossy()
                        .into_owned(),
                    fs::read_to_string(&path).unwrap(),
                );
            }
        }
    }
    let mut out = BTreeMap::new();
    if dir.exists() {
        walk(dir, dir, &mut out);
    }
    out
}

fn tree_of(value: &Value) -> BTreeMap<String, String> {
    value
        .as_object()
        .unwrap()
        .iter()
        .map(|(k, v)| (k.clone(), v.as_str().unwrap().to_owned()))
        .collect()
}

fn source_of(value: &Value) -> Option<CredentialSource> {
    let object = value.as_object()?;
    Some(CredentialSource {
        kind: object.get("kind")?.as_str()?.to_owned(),
        home: object
            .get("home")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_owned(),
        files: object
            .get("files")
            .and_then(Value::as_array)
            .map(|f| f.iter().map(|s| s.as_str().unwrap().to_owned()).collect())
            .unwrap_or_default(),
        cli: object.get("cli").and_then(Value::as_str).map(str::to_owned),
    })
}

struct Free;
struct Held(PathBuf);
impl AccountLockGuard for Held {
    fn account_dir(&self) -> &Path {
        &self.0
    }
}
impl AccountLocks for Free {
    fn acquire(
        &self,
        runtime_dir: &Path,
        provider: &str,
        account_id: &str,
        _: u64,
    ) -> Result<Box<dyn AccountLockGuard>, LockBusy> {
        Ok(Box::new(Held(runtime_dir.join(provider).join(account_id))))
    }
    fn try_acquire(
        &self,
        runtime_dir: &Path,
        provider: &str,
        account_id: &str,
    ) -> Option<Box<dyn AccountLockGuard>> {
        self.acquire(runtime_dir, provider, account_id, 0).ok()
    }
}

// ----------------------------------------------------------------------------------------------- vectors

#[test]
fn expiry_vectors_name_each_layouts_entries_and_failure_codes() {
    let v = vectors("expiry.v1.json");
    for case in v["expiry"].as_array().unwrap() {
        let id = case["id"].as_str().unwrap();
        let dir = scratch("expiry");
        lay(&dir, &case["files"]);
        let got = read_credential_expiry(case["layout"].as_str().unwrap(), &dir, &NoSqlite);
        let expected = &case["expected"];
        match got {
            Ok(entries) => {
                assert_eq!(expected["ok"], json!(true), "{id}");
                let want = expected["entries"].as_array().unwrap();
                assert_eq!(entries.len(), want.len(), "{id}");
                for (e, w) in entries.iter().zip(want) {
                    assert_eq!(e.key, w["key"].as_str().unwrap(), "{id}");
                    assert_eq!(e.expires_ms, w["expiresMs"].as_f64().unwrap(), "{id}");
                    assert_eq!(e.due_ms, w["dueMs"].as_f64().unwrap(), "{id}");
                }
            }
            Err(code) => assert_eq!(
                (expected["ok"].as_bool(), expected["code"].as_str()),
                (Some(false), Some(code)),
                "{id}"
            ),
        }
        fs::remove_dir_all(dir).unwrap();
    }
}

#[test]
fn layout_is_named_from_the_credential_source_omp_before_pi() {
    for case in vectors("expiry.v1.json")["layouts"].as_array().unwrap() {
        let got = source_of(&case["source"])
            .and_then(|s| credential_layout(&s))
            .map(Layout::name);
        assert_eq!(got, case["expected"].as_str(), "{}", case["id"]);
    }
}

#[test]
fn refresh_windows_and_constants_match_the_recorded_ones() {
    let v = vectors("expiry.v1.json");
    let c = &v["constants"];
    assert_eq!(
        DEFAULT_REFRESH_AHEAD_MIN_THRESHOLD_MS,
        c["defaultRefreshAheadMinThresholdMs"].as_f64().unwrap()
    );
    assert_eq!(
        CODEX_REFRESH_INTERVAL_MS,
        c["codexRefreshIntervalMs"].as_f64().unwrap()
    );
    assert_eq!(
        DEFAULT_RENEWAL_COOLDOWN_MS,
        c["renewalCooldownMs"].as_f64().unwrap()
    );
    assert_eq!(
        MAX_PENDING_COPIES as f64,
        c["maxPendingCopies"].as_f64().unwrap()
    );
    assert_eq!(STAGING_MIN_AGE_MS, c["stagingMinAgeMs"].as_f64().unwrap());
    for w in v["windows"].as_array().unwrap() {
        assert_eq!(
            default_refresh_ahead_threshold_ms(w["probeTimeoutMs"].as_f64().unwrap()),
            w["expected"].as_f64().unwrap()
        );
    }
}

#[test]
fn a_seat_may_not_start_on_a_login_that_would_refresh_inside_its_home() {
    for case in vectors("expiry.v1.json")["life"].as_array().unwrap() {
        let id = case["id"].as_str().unwrap();
        let dir = scratch("life");
        lay(&dir, &case["files"]);
        let file = case["files"]
            .as_object()
            .unwrap()
            .keys()
            .next()
            .unwrap()
            .clone();
        let source = CredentialSource {
            kind: "home-files".into(),
            home: dir.to_string_lossy().into_owned(),
            files: vec![file],
            cli: None,
        };
        let got = login_life_problem(
            &source,
            case["timeoutMs"].as_f64(),
            case["now"].as_f64().unwrap(),
            &NoSqlite,
        );
        assert_eq!(got.as_deref(), case["expected"].as_str(), "{id}");
        fs::remove_dir_all(dir).unwrap();
    }
}

#[test]
fn apply_replaces_only_a_strictly_newer_entry_with_a_different_refresh_token() {
    for case in vectors("apply.v1.json")["cases"].as_array().unwrap() {
        let id = case["id"].as_str().unwrap();
        let (source, copy) = (scratch("apply-source"), scratch("apply-copy"));
        lay(&source, &case["source"]);
        lay(&copy, &case["copy"]);
        let request = ApplyRequest {
            layout_name: case["layout"].as_str().unwrap(),
            source_home: &source,
            copy_home: &copy,
            provider: case["provider"].as_str(),
            require_future: case["requireFuture"].as_bool().unwrap(),
            now: case["now"].as_f64().unwrap(),
            sqlite: &NoSqlite,
        };
        let got = apply_renewed_credential(&request).unwrap();
        let want = &case["expected"]["result"];
        assert_eq!(got.status(), want["status"].as_str().unwrap(), "{id}");
        match &got {
            ApplyOutcome::Applied(keys) => assert_eq!(json!(keys), want["keys"], "{id}"),
            ApplyOutcome::Unchanged => assert_eq!(want["keys"], json!([]), "{id}"),
            ApplyOutcome::Unreadable(code) => {
                assert_eq!(Some(*code), want["code"].as_str(), "{id}")
            }
            ApplyOutcome::ApplyDeferred(code) => {
                assert_eq!(Some(code.as_str()), want["code"].as_str(), "{id}")
            }
        }
        assert_eq!(
            read_tree(&source),
            tree_of(&case["expected"]["sourceAfter"]),
            "{id}: the source store after it, byte for byte"
        );
        fs::remove_dir_all(source).unwrap();
        fs::remove_dir_all(copy).unwrap();
    }
}

#[test]
fn write_back_target_is_chosen_from_the_source_and_refused_when_unsafe() {
    for case in vectors("write-back.v1.json")["targets"].as_array().unwrap() {
        let args = &case["args"];
        let got = source_of(&args["credentialSource"]).and_then(|s| {
            credential_write_back_target(
                args["provider"].as_str().unwrap(),
                args["accountId"].as_str().unwrap(),
                &s,
                Path::new(args["runtimeDir"].as_str().unwrap()),
            )
        });
        assert_eq!(
            got.unwrap_or(Value::Null),
            case["expected"],
            "{}",
            case["id"]
        );
    }
}

/// `<15 digits>-agent-<8 hex>` as the recorder normalises it.
fn normalised(name: &str) -> String {
    let (at, rest) = name.split_once('-').unwrap();
    assert!(
        at.len() == 15 && at.bytes().all(|b| b.is_ascii_digit()),
        "{name}"
    );
    let hexid = rest
        .strip_prefix("agent-")
        .unwrap_or_else(|| panic!("{name}"));
    assert!(
        hexid.len() == 8
            && hexid
                .bytes()
                .all(|b| matches!(b, b'0'..=b'9' | b'a'..=b'f')),
        "{name}"
    );
    format!("{at}-agent-<hex8>")
}

#[test]
fn write_back_stages_a_newer_login_beside_the_source_and_never_applies_it() {
    for case in vectors("write-back.v1.json")["cases"].as_array().unwrap() {
        let id = case["id"].as_str().unwrap();
        let (source, home, runtime) = (
            scratch("wb-source"),
            scratch("wb-home"),
            scratch("wb-runtime"),
        );
        lay(&source, &case["source"]);
        lay(&home, &case["home"]);
        let provider = case["provider"].as_str().unwrap();
        let mut target = json!({ "provider": provider, "accountId": "acct", "kind": "home-files", "home": source.to_str().unwrap(), "layout": case["layout"], "runtimeDir": runtime.to_str().unwrap() });
        if let Some(store) = case["store"].as_str() {
            target["store"] = json!(store);
        }
        let got = write_back_renewed_credential(
            &home,
            Some(&target),
            case["now"].as_f64().unwrap(),
            &NoSqlite,
            &Free,
        );
        let want = &case["expected"]["result"];
        assert_eq!(
            (got.status, got.code, got.keep_home),
            (
                want["status"].as_str().unwrap(),
                want["code"].as_str(),
                want["keepHome"].as_bool().unwrap_or(false)
            ),
            "{id}"
        );

        let account = runtime.join("account-locks").join(provider).join("acct");
        let store_dir = match case["store"].as_str() {
            Some(cli) => account.join("stores").join(cli),
            None => account,
        };
        let pending = store_dir.join("pending");
        let mut staged: Vec<Value> = Vec::new();
        if pending.exists() {
            let mut names: Vec<String> = fs::read_dir(&pending)
                .unwrap()
                .map(|e| e.unwrap().file_name().to_string_lossy().into_owned())
                .collect();
            names.sort();
            for name in names {
                staged.push(
                    json!({ "name": normalised(&name), "files": read_tree(&pending.join(&name)) }),
                );
            }
        }
        assert_eq!(
            json!(staged),
            case["expected"]["staged"],
            "{id}: the staged copy keeps the same file names and bytes"
        );
        assert_eq!(
            read_tree(&source),
            tree_of(&case["source"]),
            "{id}: staging never touches the source"
        );

        let retained: Vec<Value> = inspect_retained_credential_copies(&runtime, NOW, 0.0, None).into_iter().map(|c| json!({ "provider": c.provider, "accountId": c.account_id, "kind": c.kind, "stranded": c.stranded })).collect();
        assert_eq!(json!(retained), case["expected"]["retained"], "{id}");
        for dir in [source, home, runtime] {
            fs::remove_dir_all(dir).unwrap();
        }
    }
    for case in vectors("write-back.v1.json")["edge"].as_array().unwrap() {
        let home = scratch("wb-edge");
        let got = write_back_renewed_credential(
            &home,
            Some(&case["args"]).filter(|a| !a.is_null()),
            NOW,
            &NoSqlite,
            &Free,
        );
        let want = &case["expected"];
        assert_eq!(
            (got.status, got.code),
            (want["status"].as_str().unwrap(), want["code"].as_str()),
            "{}",
            case["id"]
        );
        fs::remove_dir_all(home).unwrap();
    }
}

// ----------------------------------------------------------------------------------------------- integration

fn pi_auth(refresh: &str, expires: f64) -> String {
    format!("{}\n", serde_json::to_string_pretty(&json!({ "openai-codex": { "type": "oauth", "access": "a", "refresh": refresh, "expires": expires } })).unwrap())
}

fn source_pi(home: &Path) -> CredentialSource {
    CredentialSource {
        kind: "home-files".into(),
        home: home.to_string_lossy().into_owned(),
        files: vec!["auth.json".into()],
        cli: None,
    }
}

#[test]
fn copy_makes_owner_only_files_at_the_same_relative_paths_and_refuses_what_escapes() {
    let (home, outside, dest) = (
        scratch("copy-home"),
        scratch("copy-outside"),
        scratch("copy-dest"),
    );
    fs::create_dir_all(home.join(".claude")).unwrap();
    fs::write(home.join("auth.json"), "{}").unwrap();
    fs::write(home.join(".claude/.credentials.json"), "{}").unwrap();
    fs::write(outside.join("secret"), "x").unwrap();
    #[cfg(unix)]
    std::os::unix::fs::symlink(outside.join("secret"), home.join("link.json")).unwrap();
    let ok = |files: &[&str], skip| {
        copy_credential_files(
            &dest,
            &home,
            &files.iter().map(|f| (*f).to_owned()).collect::<Vec<_>>(),
            &CopyOptions {
                sqlite: &NoSqlite,
                skip_missing: skip,
            },
        )
    };

    assert_eq!(
        ok(&["auth.json", ".claude/.credentials.json"], false).unwrap(),
        vec!["auth.json", ".claude/.credentials.json"]
    );
    assert_eq!(
        fs::read_to_string(dest.join(".claude/.credentials.json")).unwrap(),
        "{}"
    );
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        assert_eq!(
            fs::metadata(dest.join("auth.json"))
                .unwrap()
                .permissions()
                .mode()
                & 0o777,
            0o600
        );
    }
    assert!(ok(&["../x"], false).unwrap_err().contains("without \"..\""));
    assert!(ok(&["/etc/passwd"], false).is_err());
    assert!(ok(&["absent.json"], false)
        .unwrap_err()
        .contains("is missing"));
    assert_eq!(ok(&["absent.json"], true).unwrap(), Vec::<String>::new());
    #[cfg(unix)]
    assert!(ok(&["link.json"], false)
        .unwrap_err()
        .contains("not a regular file inside the credential home"));
    for dir in [home, outside, dest] {
        fs::remove_dir_all(dir).unwrap();
    }
}

#[test]
fn a_pending_copy_survives_an_interrupted_staging_and_is_applied_by_the_next_renewal() {
    let (source, runtime) = (scratch("pending-source"), scratch("pending-runtime"));
    fs::write(source.join("auth.json"), pi_auth("old", NOW + HOUR)).unwrap();
    let account = runtime.join("account-locks/openai-codex/acct");

    // A writer died mid-staging: its half copy sits under a hidden name beside a complete pending copy.
    let pending = account.join("pending");
    fs::create_dir_all(pending.join(".tmp-4000000-deadbeef")).unwrap();
    fs::write(
        pending.join(".tmp-4000000-deadbeef/auth.json"),
        pi_auth("newer", NOW + 9.0 * HOUR),
    )
    .unwrap();
    let complete = pending.join(pending_name(NOW, None));
    fs::create_dir_all(&complete).unwrap();
    fs::write(complete.join("auth.json"), pi_auth("new", NOW + 5.0 * HOUR)).unwrap();

    // The sweep keeps the staging: the source does not prove it is not newer, and it is not empty or a duplicate.
    let resolve = |_: &str, _: &str, _: Option<&str>| StoreJudgement::Judge {
        layout: Layout::PiAuthJson,
        source_home: source.clone(),
    };
    let swept = sweep_interrupted_stagings(&SweepOptions {
        runtime_dir: &runtime,
        resolve_store: Some(&resolve),
        now: NOW,
        min_age_ms: f64::NEG_INFINITY,
        locks: &Free,
        sqlite: &NoSqlite,
    });
    assert_eq!((swept.removed, swept.kept), (0, 1));
    assert!(
        pending.join(".tmp-4000000-deadbeef/auth.json").exists(),
        "the interrupted staging still holds its login"
    );
    assert!(complete.join("auth.json").exists());
    let kinds: Vec<&str> = inspect_retained_credential_copies(&runtime, NOW, 0.0, None)
        .iter()
        .map(|c| c.kind)
        .collect();
    assert!(kinds.contains(&"pending"), "{kinds:?}");

    // The next renewal applies the pending copy and removes it once the source proves it applied.
    let probe = Never;
    let now = || NOW;
    let outcome = refresh_ahead(
        &RefreshRequest {
            provider: "openai-codex",
            account_id: "acct",
            credential_source: &source_pi(&source),
            runtime_dir: &runtime,
        },
        &RefreshOptions::new(&Free, &probe, &NoSqlite, &now),
    );
    assert_eq!(outcome.status, "fresh");
    assert!(fs::read_to_string(source.join("auth.json"))
        .unwrap()
        .contains("\"refresh\": \"new\""));
    assert!(!complete.exists(), "an applied pending copy is removed");
    assert!(
        pending.join(".tmp-4000000-deadbeef/auth.json").exists(),
        "the interrupted staging is still kept"
    );
    for dir in [source, runtime] {
        fs::remove_dir_all(dir).unwrap();
    }
}

#[test]
fn a_staging_that_is_empty_or_a_duplicate_of_a_kept_copy_is_removed_and_one_whose_writer_lives_is_not(
) {
    let runtime = scratch("sweep-runtime");
    let pending = runtime.join("account-locks/openai-codex/acct/pending");
    let kept = pending.join(pending_name(NOW, None));
    fs::create_dir_all(&kept).unwrap();
    fs::write(kept.join("auth.json"), pi_auth("x", NOW)).unwrap();
    let empty = pending.join(".tmp-4000001-aaaaaaaa");
    let duplicate = pending.join(".tmp-4000002-bbbbbbbb");
    let alive = pending.join(format!(".tmp-{}-cccccccc", std::process::id()));
    for dir in [&empty, &duplicate, &alive] {
        fs::create_dir_all(dir).unwrap();
    }
    fs::write(duplicate.join("auth.json"), pi_auth("x", NOW)).unwrap();
    let swept = sweep_interrupted_stagings(&SweepOptions {
        runtime_dir: &runtime,
        resolve_store: None,
        now: NOW,
        min_age_ms: f64::NEG_INFINITY,
        locks: &Free,
        sqlite: &NoSqlite,
    });
    assert_eq!(
        (swept.removed, swept.kept),
        (2, 0),
        "the live writer's staging is never considered"
    );
    assert!(!empty.exists() && !duplicate.exists() && alive.exists() && kept.exists());
    fs::remove_dir_all(runtime).unwrap();
}

#[test]
fn pending_copies_over_the_limit_drop_only_redundant_ones() {
    let (source, runtime) = (scratch("cap-source"), scratch("cap-runtime"));
    fs::write(source.join("auth.json"), pi_auth("old", NOW + HOUR)).unwrap();
    let pending = runtime.join("account-locks/openai-codex/acct/pending");
    for i in 0..7 {
        // Two logins, the second repeated: five copies hold the same pair.
        let refresh = if i < 2 {
            format!("distinct-{i}")
        } else {
            "same".to_owned()
        };
        let dir = pending.join(format!("{:015}-aaaaaaa{i}", NOW as i64 + i));
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("auth.json"), pi_auth(&refresh, NOW + 5.0 * HOUR)).unwrap();
    }
    let over = inspect_pending_copies_over_limit(&runtime, None);
    assert_eq!(over.len(), 1);
    assert_eq!(over[0].count, 7);
    let target = json!({ "provider": "openai-codex", "accountId": "acct", "kind": "home-files", "home": source.to_str().unwrap(), "layout": "pi-auth-json", "runtimeDir": runtime.to_str().unwrap() });
    let home = scratch("cap-home");
    fs::write(
        home.join("auth.json"),
        pi_auth("fresh-pane", NOW + 8.0 * HOUR),
    )
    .unwrap();
    let got = write_back_renewed_credential(&home, Some(&target), NOW + 100.0, &NoSqlite, &Free);
    assert_eq!(got.status, "staged");
    let left: Vec<String> = fs::read_dir(&pending)
        .unwrap()
        .map(|e| fs::read_to_string(e.unwrap().path().join("auth.json")).unwrap())
        .collect();
    assert_eq!(
        left.len(),
        5,
        "the surplus of three went, all of them duplicates of a login another copy holds"
    );
    for distinct in ["distinct-0", "distinct-1", "fresh-pane", "same"] {
        assert!(
            left.iter()
                .any(|t| t.contains(&format!("\"refresh\": \"{distinct}\""))),
            "{distinct} must stay"
        );
    }
    for dir in [source, runtime, home] {
        fs::remove_dir_all(dir).unwrap();
    }
}

struct Never;
impl CredentialProbe for Never {
    fn run(&self, _: &ProbeRequest<'_>, _: &dyn AccountLockGuard) -> ProbeRun {
        ProbeRun::NoProbe
    }
}

/// A probe that renews the scratch copy the way the CLI would: a new pair with a later expiry.
struct Renews {
    seen: RefCell<Vec<String>>,
    renew: bool,
}
impl CredentialProbe for Renews {
    fn run(&self, request: &ProbeRequest<'_>, _: &dyn AccountLockGuard) -> ProbeRun {
        self.seen.borrow_mut().push(
            request
                .home
                .file_name()
                .unwrap()
                .to_string_lossy()
                .into_owned(),
        );
        if self.renew {
            fs::write(
                request.home.join("auth.json"),
                pi_auth("renewed", NOW + 24.0 * HOUR),
            )
            .unwrap();
        }
        ProbeRun::Ran { ok: self.renew }
    }
}

#[test]
fn refresh_ahead_renews_inside_a_scratch_copy_and_applies_it_to_the_source() {
    let (source, runtime) = (scratch("renew-source"), scratch("renew-runtime"));
    fs::write(
        source.join("auth.json"),
        pi_auth("old", NOW + 10.0 * 60_000.0),
    )
    .unwrap();
    let probe = Renews {
        seen: RefCell::new(vec![]),
        renew: true,
    };
    let now = || NOW;
    let request = RefreshRequest {
        provider: "openai-codex",
        account_id: "acct",
        credential_source: &source_pi(&source),
        runtime_dir: &runtime,
    };
    let outcome = refresh_ahead(
        &request,
        &RefreshOptions::new(&Free, &probe, &NoSqlite, &now),
    );
    assert_eq!(
        (outcome.status, outcome.reason.as_str()),
        ("renewed", "applied")
    );
    assert!(fs::read_to_string(source.join("auth.json"))
        .unwrap()
        .contains("\"refresh\": \"renewed\""));
    assert!(
        probe.seen.borrow()[0].starts_with("scratch-"),
        "the CLI ran on a scratch copy, never on the source"
    );
    let account = runtime.join("account-locks/openai-codex/acct");
    assert!(
        fs::read_dir(&account).unwrap().all(|e| !e
            .unwrap()
            .file_name()
            .to_string_lossy()
            .starts_with("scratch-")),
        "the scratch copy is removed"
    );
    assert!(!account.join("cooldown.json").exists());

    // A login far from expiry is left alone.
    fs::write(
        source.join("auth.json"),
        pi_auth("later", NOW + 48.0 * HOUR),
    )
    .unwrap();
    assert_eq!(
        refresh_ahead(
            &request,
            &RefreshOptions::new(&Free, &probe, &NoSqlite, &now)
        )
        .status,
        "fresh"
    );
    for dir in [source, runtime] {
        fs::remove_dir_all(dir).unwrap();
    }
}

#[test]
fn a_renewal_that_returns_nothing_cools_the_account_and_leaves_the_source_untouched() {
    let (source, runtime) = (scratch("cool-source"), scratch("cool-runtime"));
    let original = pi_auth("old", NOW + 10.0 * 60_000.0);
    fs::write(source.join("auth.json"), &original).unwrap();
    let probe = Renews {
        seen: RefCell::new(vec![]),
        renew: false,
    };
    let now = || NOW;
    let request = RefreshRequest {
        provider: "openai-codex",
        account_id: "acct",
        credential_source: &source_pi(&source),
        runtime_dir: &runtime,
    };
    let first = refresh_ahead(
        &request,
        &RefreshOptions::new(&Free, &probe, &NoSqlite, &now),
    );
    assert_eq!(
        (first.status, first.reason.as_str()),
        ("failed", "probe-failed")
    );
    assert_eq!(
        fs::read_to_string(source.join("auth.json")).unwrap(),
        original
    );
    let cooldown =
        fs::read_to_string(runtime.join("account-locks/openai-codex/acct/cooldown.json")).unwrap();
    assert!(
        cooldown.contains(&iso_from_ms(NOW)) && cooldown.contains("probe-failed"),
        "{cooldown}"
    );
    let second = refresh_ahead(
        &request,
        &RefreshOptions::new(&Free, &probe, &NoSqlite, &now),
    );
    assert_eq!(second.status, "cooldown");
    assert_eq!(
        probe.seen.borrow().len(),
        1,
        "the cooldown stops a second call"
    );
    for dir in [source, runtime] {
        fs::remove_dir_all(dir).unwrap();
    }
}

#[test]
fn a_busy_account_lock_skips_the_renewal_and_a_copy_without_a_probe_never_touches_the_source() {
    let (source, runtime) = (scratch("busy-source"), scratch("busy-runtime"));
    fs::write(
        source.join("auth.json"),
        pi_auth("old", NOW + 10.0 * 60_000.0),
    )
    .unwrap();
    let now = || NOW;
    let request = RefreshRequest {
        provider: "openai-codex",
        account_id: "acct",
        credential_source: &source_pi(&source),
        runtime_dir: &runtime,
    };
    let busy = refresh_ahead(
        &request,
        &RefreshOptions::new(&NoLocks, &Never, &NoSqlite, &now),
    );
    assert_eq!(
        (busy.status, busy.reason.as_str()),
        ("skipped", "lock-busy")
    );
    // No probe exists: the scratch copy renewed nothing, so nothing is applied.
    let none = refresh_ahead(
        &request,
        &RefreshOptions::new(&Free, &Never, &NoSqlite, &now),
    );
    assert_eq!(
        (none.status, none.reason.as_str()),
        ("failed", "probe-failed")
    );
    assert!(fs::read_to_string(source.join("auth.json"))
        .unwrap()
        .contains("\"refresh\": \"old\""));
    for dir in [source, runtime] {
        fs::remove_dir_all(dir).unwrap();
    }
}

#[test]
fn home_expands_only_a_leading_home_marker_and_dates_parse_as_iso() {
    let home = std::env::var("HOME").unwrap_or_default();
    assert_eq!(
        expand_credential_home("~/x").unwrap().to_string_lossy(),
        format!("{home}/x")
    );
    assert_eq!(
        expand_credential_home("$HOME").unwrap().to_string_lossy(),
        home
    );
    assert!(expand_credential_home("${HOME}x").is_none() || !home.is_empty());
    assert!(expand_credential_home("relative").is_none() && expand_credential_home("  ").is_none());
    assert_eq!(parse_date_ms("2026-06-01T12:00:00Z"), Some(NOW));
    assert_eq!(parse_date_ms("2026-06-01T13:00:00+01:00"), Some(NOW));
    assert_eq!(parse_date_ms("not a date"), None);
    assert_eq!(iso_from_ms(NOW + 123.0), "2026-06-01T12:00:00.123Z");
    assert_eq!(b64url_encode(b"{\"exp\":1}"), "eyJleHAiOjF9");
}
