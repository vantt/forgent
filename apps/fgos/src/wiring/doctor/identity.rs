//! The doctor rows of the Identity component: the machine id, the machine signing key and the OpenSSH it needs,
//! the project id, the shared directory of other machines' sessions, and whether the writer identity resolves
//! through this host and through the host a plain `git commit` hook runs. The facts are the identity crate's;
//! this adapter words them as the report's `{ passed, message }`. Levels follow the doctor convention: `passed:
//! false` fails, a message starting with `warning:` warns, anything else passes.

use fgos_distribution::doctor::{FixResult, RowOutcome, RowResult};
use fgos_identity::refusal::Refusal;
use fgos_identity::{current, machine, project, shared, signing};
use std::path::{Path, PathBuf};
use std::time::Duration;

pub const ROW_IDS: &[&str] = &[
    "writer-identity-resolvable",
    "identity-machine-id",
    "identity-machine-key",
    "identity-ssh-keygen",
    "identity-project-id",
    "identity-shared-directory",
];

pub const FIX_IDS: &[&str] = &["identity-machine-id", "identity-machine-key"];

const PROBE_TIMEOUT: Duration = Duration::from_secs(2);

/// The adapter the doctor registers for the identity rows and fixes.
pub const GROUP: super::Rows = super::Rows {
    rows: ROW_IDS,
    fixes: FIX_IDS,
    judge: judge_rows,
    fix: run_fixes,
};

fn row(passed: bool, message: impl Into<String>) -> RowOutcome {
    RowOutcome::Judged(RowResult {
        passed,
        status: None,
        message: Some(message.into()),
        fix_command: None,
        detail: None,
    })
}

fn warn(message: impl AsRef<str>) -> RowOutcome {
    row(true, format!("warning: {}", message.as_ref()))
}

/// How a refusal reads when a verb of this host fails with it: the host's own stderr line.
fn failed(host: &Path, verb: &str, refusal: &Refusal) -> RowOutcome {
    let stderr = format!("fgos: error: {} [{}]", refusal.detail, refusal.reason);
    let shown: String = stderr.chars().take(300).collect();
    row(
        false,
        format!(
            "{} identity {verb} failed (exit 65): {shown}",
            host.display()
        ),
    )
}

/// pass when the machine id is minted and valid, warn when it is absent, fail when it is unreadable.
pub fn machine_id_row(state_root: &Path, host: &Path) -> RowOutcome {
    match current::machine_info(state_root) {
        Ok(info) => row(
            true,
            format!(
                "machine {}, handle {}{}",
                info.id,
                info.handle,
                if info.alias.is_some() { " (alias)" } else { "" }
            ),
        ),
        Err(refusal) if refusal.reason == "machine-id-missing" => {
            warn("no machine id minted yet; run `fgos doctor --fix`")
        }
        Err(refusal) => failed(host, "machine", &refusal),
    }
}

/// pass with the fingerprint when this machine holds a signing key, warn when it has none; `fgos doctor --fix`
/// mints it and it is never replaced.
pub fn machine_key_row(state_root: &Path, host: &Path) -> RowOutcome {
    match current::machine_info(state_root) {
        Err(refusal) if refusal.reason == "machine-id-missing" => warn(
            "no machine id minted yet, so no machine signing key; run `fgos doctor --fix`",
        ),
        Err(refusal) => failed(host, "machine", &refusal),
        Ok(_) => match signing::key_fingerprint(state_root).ok().flatten() {
            None => warn(
                "no machine signing key can be read; run `fgos doctor --fix` (and check identity-ssh-keygen)",
            ),
            Some(fingerprint) => row(true, format!("machine signing key {fingerprint}")),
        },
    }
}

/// pass when `ssh-keygen` exists and OpenSSH is 8.1 or later; fail otherwise. No fix: install OpenSSH.
pub fn ssh_keygen_row(probe: &signing::OpensshProbe) -> RowOutcome {
    match signing::judge_openssh(probe) {
        Ok(version) => row(true, version),
        Err(why) => row(false, why),
    }
}

/// pass when this repository carries a valid project id, warn when it has none, fail when the file is
/// unreadable. No fix: the id is minted once by hand on one machine, committed and pulled everywhere else.
pub fn project_id_row(state_root: &Path, root: &Path, host: &Path) -> RowOutcome {
    match project::project_info(state_root, root) {
        Ok(info) => row(true, format!("project {}, handle {}", info.id, info.handle)),
        Err(refusal) if refusal.reason == "project-id-missing" => warn(
            "no project id yet; run `fgos identity project --init` once on one machine, commit, pull elsewhere",
        ),
        Err(refusal) => failed(host, "project", &refusal),
    }
}

/// The crate's judgement of the shared directory, read from its cache only. Passes with the counts; warns on
/// dropped events, on entries of another project than this clone's and on a machine shown by its id because
/// another machine has its handle. A clone with no project id or no readable cache passes: no shared directory yet.
pub fn shared_directory_row(root: &Path) -> RowOutcome {
    let Some(judged) = shared::judge_directory(root) else {
        return row(true, "no shared directory yet");
    };
    let summary = format!(
        "{} machine(s), {} entries, fetched {}",
        judged.machines,
        judged.entries,
        judged.fetched_at.as_deref().unwrap_or("never")
    );
    let mut warnings = Vec::new();
    if !judged.dropped.is_empty() {
        let each: Vec<String> = judged
            .dropped
            .iter()
            .map(|drop| format!("{} from {}", drop.reason, drop.machine_id))
            .collect();
        warnings.push(format!(
            "{} dropped ({})",
            judged.dropped.len(),
            each.join(", ")
        ));
    }
    if judged.foreign_entries > 0 {
        warnings.push(format!(
            "{} of another project ({})",
            judged.foreign_entries,
            judged.foreign_project_ids.join(", ")
        ));
    }
    if !judged.shared_handle_machines.is_empty() {
        warnings.push(format!(
            "machine handle shared, shown by id: {} (set one apart with `fgos identity machine --alias`)",
            judged.shared_handle_machines.join(", ")
        ));
    }
    if warnings.is_empty() {
        row(true, summary)
    } else {
        warn(format!("{summary}; {}", warnings.join("; ")))
    }
}

/// `fgos identity --pid <pid> --fgos-dir <dir>` answered by another host binary, or why it could not.
fn ask_host(activation: &serde_json::Value, pid: u32, fgos_dir: &Path) -> Result<String, String> {
    use fgos_process::spawn::{run_bounded, Outcome};
    let env: Vec<(String, String)> = std::env::vars()
        .filter(|(name, _)| name != "FGOS_INVOCATION_RECORD_PATH")
        .collect();
    let args = [
        "identity".to_owned(),
        "--pid".to_owned(),
        pid.to_string(),
        "--fgos-dir".to_owned(),
        fgos_dir.display().to_string(),
    ];
    // The program is what the activation record names: data of the project, not a name this code picks.
    let bin = Path::new(activation["bin"].as_str().unwrap_or_default());
    let host = bin.display();
    let output = match run_bounded(
        activation["bin"].as_str().unwrap_or_default(),
        args,
        &env,
        None,
        None,
        PROBE_TIMEOUT,
    ) {
        Ok(Outcome::Exited(output)) => output,
        Ok(Outcome::TimedOut { .. }) => {
            return Err(format!(
                "host-error: {host} identity failed (error ETIMEDOUT)"
            ))
        }
        Err(error) => {
            let code = match error.kind() {
                std::io::ErrorKind::NotFound => Some("ENOENT"),
                std::io::ErrorKind::PermissionDenied => Some("EACCES"),
                _ => None,
            };
            return Err(match code {
                Some(code) => format!("host-missing: cannot run {host} ({code})"),
                None => format!("host-error: {host} identity failed (error {error})"),
            });
        }
    };
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_owned();
    if !output.status.success() {
        if output.status.code() == Some(4) && stderr.contains("unknown verb \"identity\"") {
            return Err(format!(
                "host-version-mismatch: {host} has no \"identity\" verb: the active release is older than this payload; restage/activate it (fgctl), or run a plain `git commit` with FGOS_HOST_BIN pointing at a host built from this checkout"
            ));
        }
        let how = match output.status.code() {
            Some(code) => format!("exit {code}"),
            None => "signal".to_owned(),
        };
        let shown: String = stderr.chars().take(500).collect();
        let tail = if shown.is_empty() {
            String::new()
        } else {
            format!(": {shown}")
        };
        return Err(format!("host-error: {host} identity failed ({how}){tail}"));
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    let unexpected = || {
        let shown: String = stdout.chars().take(200).collect();
        format!("host-error: {host} identity printed an unexpected answer: {shown}")
    };
    let envelope: serde_json::Value = serde_json::from_str(&stdout).map_err(|_| unexpected())?;
    if envelope["contract"] != "fgos.v1" {
        return Err(unexpected());
    }
    let data = &envelope["data"];
    let named = data["id"].as_str().is_some_and(|id| !id.is_empty())
        && matches!(data["source"].as_str(), Some("registry" | "env"));
    let numbered = data["id"].as_u64().is_some_and(|id| id > 0)
        && matches!(data["source"].as_str(), Some("pid" | "unresolved"));
    if !named && !numbered {
        return Err(unexpected());
    }
    Ok(serde_json::json!({ "id": data["id"], "source": data["source"] }).to_string())
}

/// What this process is as a writer, in the `{"id","source"}` form the host prints.
fn here(fgos_dir: &Path) -> String {
    let tree = fgos_identity::os_process_tree();
    let identity = fgos_identity::resolve(
        &|key| std::env::var(key).ok(),
        tree.as_ref(),
        std::process::id(),
        Some(fgos_dir),
    );
    serde_json::json!({ "id": identity.id, "source": identity.source }).to_string()
}

/// The host a plain `git commit` hook runs for the project at `root`: the nearest ready activation, from the
/// project itself up. `tried` names every place looked at.
fn activation_host(root: &Path) -> (Option<PathBuf>, Vec<String>) {
    let record = fgos_distribution::activation_record_path;
    let mut tried = vec![record(root).display().to_string()];
    if let Some(bin) = fgos_distribution::activated_host_bin(root) {
        return (Some(bin), tried);
    }
    for dir in root.ancestors() {
        if record(dir).exists() {
            tried.push(record(dir).display().to_string());
            return (fgos_distribution::activated_host_bin(dir), tried);
        }
    }
    tried.push(format!(
        "no {} above {}",
        record(Path::new("")).display(),
        root.display()
    ));
    (None, tried)
}

/// The writer identity resolves through the running host and through the host a plain `git commit` hook uses
/// (the workspace activation). The activation's binary is asked directly, never through a cache, so an older
/// activated release shows up as a version mismatch even when this host is newer.
pub fn writer_identity_row(root: &Path, running: &Path) -> RowOutcome {
    let fgos_dir = root.join(".fgos");
    let pid = std::process::id();
    let mut parts = vec![format!(
        "current host: {} -> {}",
        running.display(),
        here(&fgos_dir)
    )];
    let mut failure: Option<String> = None;
    let door = "activation (git commit hook)";
    let (bin, tried) = activation_host(root);
    match bin {
        None if !fgos_distribution::activation_record_path(root).exists() => parts.push(format!(
            "{door}: no activation in {} (a plain git commit at home cannot resolve a writer)",
            root.display()
        )),
        None => {
            failure.get_or_insert(format!(
                "{door}: no host binary (tried {}) -- run fgctl init/repair, or set FGOS_HOST_BIN",
                tried.join("; ")
            ));
        }
        Some(bin) => {
            let same = std::fs::canonicalize(&bin).ok() == std::fs::canonicalize(running).ok();
            let answer = if same {
                Ok(here(&fgos_dir))
            } else {
                ask_host(&serde_json::json!({ "bin": bin }), pid, &fgos_dir)
            };
            match answer {
                Ok(json) => parts.push(format!("{door}: {} -> {json}", bin.display())),
                Err(why) => {
                    failure.get_or_insert(format!("{door}: {} -> {why}", bin.display()));
                }
            }
        }
    }
    match failure {
        Some(failure) => {
            let mut all = vec![failure];
            all.extend(parts);
            row(false, all.join(" | "))
        }
        None => row(true, parts.join(" | ")),
    }
}

/// Judges the Identity rows `ids` of the project at `root`.
pub fn judge_rows(root: &Path, ids: &[&str]) -> Vec<RowOutcome> {
    let state_root = fgos_holder_lock::state_root::state_root().0;
    let host = std::env::current_exe().unwrap_or_else(|_| PathBuf::from("fgos"));
    ids.iter()
        .map(|id| match *id {
            "writer-identity-resolvable" => writer_identity_row(root, &host),
            "identity-machine-id" => machine_id_row(&state_root, &host),
            "identity-machine-key" => machine_key_row(&state_root, &host),
            "identity-ssh-keygen" => ssh_keygen_row(&signing::probe_openssh()),
            "identity-project-id" => project_id_row(&state_root, root, &host),
            "identity-shared-directory" => shared_directory_row(root),
            other => RowOutcome::Unavailable {
                message: format!("no identity row {other}"),
                next: "run fgos doctor again".to_owned(),
            },
        })
        .collect()
}

/// Mints the machine id once; an existing one is never replaced.
pub fn fix_machine_id(state_root: &Path) -> FixResult {
    match machine::mint_here(state_root) {
        Ok((true, id)) => FixResult::done(
            "identity-machine-id",
            true,
            format!("minted machine id {id}"),
        ),
        Ok((false, id)) => FixResult::done(
            "identity-machine-id",
            false,
            format!("machine id {id} already minted"),
        ),
        Err(error) => FixResult::done(
            "identity-machine-id",
            false,
            format!("machine id not minted: {error}"),
        ),
    }
}

/// Mints the signing key once; an existing one is never replaced.
pub fn fix_machine_key(state_root: &Path) -> FixResult {
    let id = "identity-machine-key";
    let minted = machine::prepare_state_root(state_root)
        .map_err(|error| error.to_string())
        .and_then(|root| {
            signing::mint_key(&root)
                .map_err(|refusal| format!("{}: {}", refusal.reason, refusal.detail))
        });
    match minted {
        Ok((true, fingerprint)) => FixResult::done(
            id,
            true,
            format!("minted machine signing key {fingerprint}"),
        ),
        Ok((false, fingerprint)) => FixResult::done(
            id,
            false,
            format!("machine signing key {fingerprint} already minted"),
        ),
        Err(why) => FixResult::done(id, false, format!("machine signing key not minted: {why}")),
    }
}

/// Runs the Identity fixes `ids` in the order given.
pub fn run_fixes(_root: &Path, ids: &[&str]) -> Vec<FixResult> {
    let state_root = fgos_holder_lock::state_root::state_root().0;
    ids.iter()
        .map(|id| match *id {
            "identity-machine-id" => fix_machine_id(&state_root),
            "identity-machine-key" => fix_machine_key(&state_root),
            other => FixResult::done(other, false, format!("no identity fix {other}")),
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn temp(tag: &str) -> PathBuf {
        let dir =
            std::env::temp_dir().join(format!("fgos-doctor-identity-{tag}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn judged(outcome: RowOutcome) -> RowResult {
        match outcome {
            RowOutcome::Judged(result) => result,
            RowOutcome::Unavailable { message, .. } => panic!("{message}"),
        }
    }

    fn message(outcome: RowOutcome) -> (bool, String) {
        let result = judged(outcome);
        (result.passed, result.message.unwrap())
    }

    #[test]
    fn the_machine_id_row_warns_while_none_exists_mints_once_on_fix_then_passes_without_replacing_it(
    ) {
        let state = temp("id");
        let host = Path::new("/h/fgos");
        let (passed, text) = message(machine_id_row(&state, host));
        assert!(
            passed && text.starts_with("warning: no machine id minted yet"),
            "{text}"
        );
        let first = fix_machine_id(&state);
        assert_eq!(first.changed, Some(true));
        let id = fs::read_to_string(state.join("machine-id")).unwrap();
        let id = id.trim();
        assert_eq!(
            first.message.as_deref(),
            Some(format!("minted machine id {id}").as_str())
        );
        let (passed, text) = message(machine_id_row(&state, host));
        assert!(
            passed && text.starts_with(&format!("machine {id}, handle ")),
            "{text}"
        );
        let second = fix_machine_id(&state);
        assert_eq!(second.changed, Some(false));
        assert_eq!(
            second.message.as_deref(),
            Some(format!("machine id {id} already minted").as_str())
        );
        assert_eq!(
            fs::read_to_string(state.join("machine-id")).unwrap().trim(),
            id
        );
        let _ = fs::remove_dir_all(state);
    }

    #[test]
    fn a_machine_id_that_is_not_a_valid_id_fails_with_the_hosts_own_words() {
        let state = temp("bad");
        fs::write(state.join("machine-id"), "BAD\n").unwrap();
        let (passed, text) = message(machine_id_row(&state, Path::new("/h/fgos")));
        assert!(!passed);
        assert!(
            text.starts_with(
                "/h/fgos identity machine failed (exit 65): fgos: error: invalid machine id"
            ) && text.ends_with("[machine-id-unreadable]"),
            "{text}"
        );
        let _ = fs::remove_dir_all(state);
    }

    #[test]
    fn minting_beneath_symlinked_ancestors_lands_in_the_canonical_directory() {
        #[cfg(unix)]
        {
            let base = temp("link");
            fs::create_dir_all(base.join("real")).unwrap();
            std::os::unix::fs::symlink(base.join("real"), base.join("alias")).unwrap();
            let via = base.join("alias").join("state");
            let result = fix_machine_id(&via);
            assert_eq!(result.changed, Some(true));
            assert!(base.join("real/state/machine-id").is_file());
            let _ = fs::remove_dir_all(base);
        }
    }

    #[test]
    fn the_key_row_warns_without_an_id_or_a_key_mints_once_on_fix_then_shows_the_fingerprint() {
        let state = temp("key");
        let host = Path::new("/h/fgos");
        let (passed, text) = message(machine_key_row(&state, host));
        assert!(
            passed && text.contains("no machine id minted yet, so no machine signing key"),
            "{text}"
        );
        fix_machine_id(&state);
        let (passed, text) = message(machine_key_row(&state, host));
        assert!(
            passed && text.contains("no machine signing key can be read"),
            "{text}"
        );
        let minted = fix_machine_key(&state);
        if minted.changed != Some(true) {
            // No OpenSSH on this machine: the fix says so and the row keeps warning.
            assert!(minted
                .message
                .unwrap()
                .starts_with("machine signing key not minted: ssh-keygen-missing"));
            let _ = fs::remove_dir_all(state);
            return;
        }
        let (passed, text) = message(machine_key_row(&state, host));
        assert!(
            passed && text.starts_with("machine signing key SHA256:"),
            "{text}"
        );
        assert_eq!(fix_machine_key(&state).changed, Some(false));
        let _ = fs::remove_dir_all(state);
    }

    #[test]
    fn the_ssh_keygen_row_shows_the_version_or_why_the_machine_cannot_sign() {
        let probe = |present, text: &str| signing::OpensshProbe {
            keygen_present: present,
            version_text: text.to_owned(),
        };
        assert_eq!(
            message(ssh_keygen_row(&probe(true, "OpenSSH_9.6p1"))),
            (true, "OpenSSH 9.6".into())
        );
        assert!(!message(ssh_keygen_row(&probe(false, "OpenSSH_9.6p1"))).0);
        assert!(!message(ssh_keygen_row(&probe(true, "OpenSSH_7.4"))).0);
    }

    #[test]
    fn the_shared_directory_row_says_there_is_none_when_the_clone_has_no_project_id() {
        let root = temp("shared");
        assert_eq!(
            message(shared_directory_row(&root)),
            (true, "no shared directory yet".into())
        );
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn the_project_row_outside_a_repository_fails_naming_the_host_and_the_refusal() {
        let state = temp("pstate");
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&state, fs::Permissions::from_mode(0o700)).unwrap();
        }
        let root = temp("pdir");
        let (passed, text) = message(project_id_row(&state, &root, Path::new("/h/fgos")));
        assert!(!passed);
        assert!(
            text.starts_with("/h/fgos identity project failed (exit 65): fgos: error: "),
            "{text}"
        );
        assert!(text.ends_with("[not-a-repository]"), "{text}");
        let _ = fs::remove_dir_all(state);
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn the_writer_row_names_the_running_host_and_says_a_project_without_an_activation_cannot_resolve_at_home(
    ) {
        let root = temp("writer");
        let (passed, text) = message(writer_identity_row(&root, Path::new("/h/fgos")));
        assert!(passed, "{text}");
        assert!(
            text.starts_with("current host: /h/fgos -> {\"id\":"),
            "{text}"
        );
        let activation = format!(
            "activation (git commit hook): no activation in {} (a plain git commit at home cannot resolve a writer)",
            root.display()
        );
        assert!(text.ends_with(&activation), "{text}");
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn an_activation_that_names_no_usable_host_fails_the_row_naming_every_place_looked_at() {
        let root = temp("writer-broken");
        fs::create_dir_all(root.join(".fgos/installation")).unwrap();
        fs::write(
            root.join(".fgos/installation/activation.json"),
            "{\"status\":\"pending\"}",
        )
        .unwrap();
        let (passed, text) = message(writer_identity_row(&root, Path::new("/h/fgos")));
        assert!(!passed);
        assert!(
            text.starts_with("activation (git commit hook): no host binary (tried "),
            "{text}"
        );
        assert!(
            text.contains("-- run fgctl init/repair, or set FGOS_HOST_BIN | current host:"),
            "{text}"
        );
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn an_activation_pointing_at_a_binary_that_does_not_answer_is_a_host_error_never_a_pass() {
        let root = temp("writer-dead");
        let release = root.join("release");
        fs::create_dir_all(release.join("bin")).unwrap();
        fs::create_dir_all(root.join(".fgos/installation")).unwrap();
        let script = release.join("bin/fgos");
        fs::write(&script, "#!/bin/sh\necho nothing useful\nexit 0\n").unwrap();
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&script, fs::Permissions::from_mode(0o755)).unwrap();
        }
        fs::write(
            root.join(".fgos/installation/activation.json"),
            format!(
                "{{\"status\":\"ready\",\"releasePath\":\"{}\"}}",
                release.display()
            ),
        )
        .unwrap();
        let (passed, text) = message(writer_identity_row(&root, Path::new("/h/fgos")));
        #[cfg(unix)]
        {
            assert!(!passed);
            assert!(
                text.contains("-> host-error:") && text.contains("printed an unexpected answer"),
                "{text}"
            );
        }
        let _ = (passed, text);
        let _ = fs::remove_dir_all(root);
    }
}
