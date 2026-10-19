//! The local configuration writer. A native config.lock excludes ordinary Git
//! config writers, while repo-config 80 serializes fgOS operations.
use crate::wal::{self, Begin, Intent, OperationKind, Outcome, Phase, Tip, Wal};
use crate::*;
use fgos_holder_lock::{Handle, Wait};
use std::fs::{self, File, OpenOptions};
use std::io::{Seek, SeekFrom, Write};
use std::time::Duration;

fn error(cause: impl std::fmt::Display) -> OperationError {
    let cause = cause.to_string();
    let busy = cause.starts_with("repo-config-busy");
    OperationError {
        code: if busy {
            ResultCode::Busy
        } else if cause == "config-change-stale" {
            ResultCode::Stale
        } else if cause.starts_with("invalid-")
            || cause == "operation-id-conflict"
            || cause == "config-change-resolved-without-success"
        {
            ResultCode::Refused
        } else if cause.starts_with("git-wal") || cause == "git-fence-missing" {
            ResultCode::RecoveryRequired
        } else {
            ResultCode::Failed
        },
        retryable: busy || cause == "config-change-stale",
        cause,
        operation_id: None,
        receipt: None,
        exit_code: None,
        signal: None,
        stderr: vec![],
    }
}
struct Authority<'a> {
    handle: &'a Handle,
    binding: String,
}
impl wal::PublicationAuthority for Authority<'_> {
    fn validate_publication_borrow(&self, intent: &Intent) -> wal::WalResult<()> {
        fgos_holder_lock::validate_quiescent(self.handle)
            .map_err(|_| wal::WalError::PublicationBorrowUnavailable)?;
        if intent.authority_binding != self.binding || self.handle.name() != "repo-config" {
            return Err(wal::WalError::PublicationBorrowUnavailable);
        }
        Ok(())
    }
}
fn receipt(id: &str, digest: &str) -> Receipt {
    Receipt {
        operation_id: id.into(),
        request_digest: digest.into(),
        local_effect: LocalEffect {
            expected: ExpectedTip::Absent,
            published_oid: None,
            observed_tip: ExpectedTip::Absent,
            publication_state: PublicationState::NotPublished,
        },
        checkout: Checkout::NotApplicable,
        durability: Durability {
            level: DurabilityLevel::ProcessCrash,
            capability_evidence: vec!["config file and parent synced".into()],
        },
        remote: Remote::NotRequested,
        consumer_settlement: ConsumerSettlement::NotOwnedByGit,
        attribution: Attribution::EffectObservedOnly,
    }
}
/// RepositoryConfig owns the mirror mapping policy for every consumer.
/// A wildcard also matches the empty suffix, preserving the legacy mirror name
/// while allowing ordinary fetch to succeed before the cutover creates the ref.
pub fn publication_fetch_mappings(remote: &str) -> Result<Vec<String>> {
    if remote.is_empty()
        || !remote
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"-_".contains(&b))
    {
        return Err(error("invalid-fetch-mapping-remote"));
    }
    Ok(vec![
        format!("+refs/fgos/events/*:refs/fgos/remotes/{remote}/events/*"),
        legacy_fetch_mapping(remote),
    ])
}

fn legacy_fetch_mapping(remote: &str) -> String {
    format!("+refs/fgos/legacy*:refs/fgos/remotes/{remote}/legacy*")
}

/// The pre-wildcard mapping, which breaks fetch when the source is absent.
pub fn obsolete_legacy_fetch_mapping(remote: &str) -> Result<String> {
    publication_fetch_mappings(remote)?;
    Ok(legacy_fetch_mapping(remote).replace('*', ""))
}

fn mapping_installed(remote: &str, wanted: &[String], actual: &[ConfigFact]) -> bool {
    let Ok(obsolete) = obsolete_legacy_fetch_mapping(remote) else {
        return false;
    };
    wanted
        .iter()
        .all(|r| actual.iter().any(|v| v.value == r.as_bytes()))
        && (!wanted.contains(&legacy_fetch_mapping(remote))
            || !actual.iter().any(|v| v.value == obsolete.as_bytes()))
}

impl RepositoryConfig for GitDriver {
    fn ensure_hooks(
        &self,
        repo: &RepoHandle,
        owned_path: &std::path::Path,
        id: &str,
    ) -> Result<HooksReport> {
        GitDriver::ensure_hooks(self, repo, owned_path, id)
    }
    fn remove_owned_hooks_config(
        &self,
        repo: &RepoHandle,
        owned_path: &std::path::Path,
        id: &str,
    ) -> Result<HooksReport> {
        GitDriver::remove_owned_hooks_config(self, repo, owned_path, id)
    }
    fn ensure_fetch_mapping(
        &self,
        repo: &RepoHandle,
        remote: &str,
        refspecs: &[String],
        id: &str,
    ) -> Result<Receipt> {
        self.ensure_fetch_mapping_with_filesystem(repo, remote, refspecs, id, &wal::OsFileSystem)
    }
}
impl GitDriver {
    /// Filesystem boundaries shared by real execution and deterministic crash/race probes.
    pub fn ensure_fetch_mapping_with_filesystem<F: wal::FileSystem>(
        &self,
        repo: &RepoHandle,
        remote: &str,
        refspecs: &[String],
        id: &str,
        filesystem: &F,
    ) -> Result<Receipt> {
        self.change_config(repo, remote, refspecs, id, None, filesystem)
    }
    fn change_config<F: wal::FileSystem>(
        &self,
        repo: &RepoHandle,
        remote: &str,
        refspecs: &[String],
        id: &str,
        hooks_request: Option<(&str, bool)>,
        filesystem: &F,
    ) -> Result<Receipt> {
        require_lock_scope_platform()?;
        let allowed = if hooks_request.is_none() {
            publication_fetch_mappings(remote)?
        } else {
            vec![]
        };
        if hooks_request.is_none()
            && (refspecs.is_empty() || refspecs.iter().any(|r| !allowed.contains(r)))
        {
            return Err(error("invalid-publication-fetch-mapping"));
        }
        let locks = repo.trusted_main_root().join(".fgos/locks");
        fs::create_dir_all(&locks).map_err(error)?;
        let mut scope = fgos_holder_lock::LockScope::seeded(vec![]).map_err(error)?;
        scope
            .acquire(
                "repo-config",
                &std::collections::BTreeMap::from([(
                    "fgosDir".into(),
                    repo.trusted_main_root()
                        .join(".fgos")
                        .to_string_lossy()
                        .into_owned(),
                )]),
                Wait::Ms(5000),
            )
            .map_err(error)?;
        let handle = scope
            .handle("repo-config")
            .ok_or_else(|| error("repo-config-busy"))?;
        wal::require_activation_fence(repo).map_err(error)?;
        let wal = Wal::with_filesystem(repo.common_dir(), filesystem).map_err(error)?;
        let authority = Authority {
            handle,
            binding: wal::canonical_digest(&(
                wal.repository_identity(),
                "repo-config",
                repo.common_dir(),
            ))
            .map_err(error)?,
        };
        let digest = if hooks_request.is_none() {
            wal::canonical_digest(&("ensureFetchMapping", remote, refspecs))
        } else {
            wal::canonical_digest(&("hooksConfig", hooks_request))
        }
        .map_err(error)?;
        let scan = wal.scan(100_000).map_err(error)?;
        if !scan.complete || scan.entries.iter().any(|e| e.error.is_some()) {
            return Err(error("git-wal-unreadable"));
        }
        for chain in wal.active(100_000).map_err(error)? {
            if let OperationKind::ConfigChange(change) = &chain.intent().kind {
                authority
                    .validate_publication_borrow(chain.intent())
                    .map_err(error)?;
                let staging = chain
                    .records()
                    .iter()
                    .rev()
                    .find_map(|r| match &r.phase {
                        Phase::NativeLockOwned(a) => Some(a),
                        _ => None,
                    })
                    .or(change.staging.as_ref());
                let report = crate::native_lock::quarantine_owned_artifact(
                    repo,
                    &chain.last().operation_id,
                    &repo.common_dir().join("config.lock"),
                    staging,
                    filesystem,
                    || {
                        authority
                            .validate_publication_borrow(chain.intent())
                            .map_err(error)
                    },
                )?;
                if !["absent", "quarantined"].contains(&report.status.as_str()) {
                    return Err(error(format!(
                        "git-wal-config-lock-preserved: {}",
                        report.inspection
                    )));
                }
                let outcome = if chain
                    .records()
                    .iter()
                    .any(|r| matches!(r.phase, Phase::TargetAttempt { .. }))
                {
                    let installed = self.config_change_installed(repo, change)?;
                    Outcome::Transfer {
                        acknowledged: installed,
                        unknown: !installed,
                        observations: vec![],
                        details: vec![if installed {
                            "effectObservedOnly"
                        } else {
                            "uncertain"
                        }
                        .into()],
                    }
                } else {
                    Outcome::AbandonedBeforeAttempt
                };
                wal.append(&chain, Phase::Outcome(outcome)).map_err(error)?;
            }
        }
        if let Ok(old) = wal.inspect(id) {
            if old.intent().request_digest != digest {
                return Err(error("operation-id-conflict"));
            }
            return match old.outcome() {
                Some(Outcome::ConfigApproved) => Ok(receipt(id, &digest)),
                Some(Outcome::Transfer {
                    acknowledged: true, ..
                }) => Ok(receipt(id, &digest)),
                Some(Outcome::AbandonedBeforeAttempt) if matches!(&old.intent().kind, OperationKind::ConfigChange(change) if change.hooks.is_none() && change.refspecs.iter().all(|r| change.old_values.contains(r))) => {
                    Ok(receipt(id, &digest))
                }
                _ => Err(error("config-change-resolved-without-success")),
            };
        }
        let call = |args: &[&str]| {
            self.publication_call(repo, handle, args, &[], false, Duration::from_secs(30))
        };
        let hooks = if let Some((path, remove)) = hooks_request {
            let old = self.local_hooks_value(repo)?;
            if !remove && old.is_none() && self.hooks_value(repo)?.is_some() {
                return Err(error("hooks-skipped-existing: enforcement-missing"));
            }
            if remove {
                if old.as_deref() != Some(path) || !self.hooks_owned(repo, path)? {
                    return Err(error("hooks-config-not-owned"));
                }
            } else if old.is_some() && old.as_deref() != Some(path) {
                return Err(error("hooks-skipped-existing: enforcement-missing"));
            } else if old.is_some() && !self.hooks_owned(repo, path)? {
                return Err(error("hooks-skipped-existing: ownership-unproven"));
            }
            Some(wal::HooksChange {
                old,
                next: if remove { None } else { Some(path.into()) },
                owner_path: path.into(),
            })
        } else {
            None
        };
        let url = if hooks.is_none() {
            self.remote_url(repo, remote)?
        } else {
            "hooks".into()
        };
        let old_values: Vec<String> = (if hooks.is_none() {
            self.configured_fetch_refspecs(repo, remote)?
        } else {
            vec![]
        })
        .into_iter()
        .map(|v| String::from_utf8(v.value).map_err(error))
        .collect::<Result<_>>()?;
        let obsolete = if hooks.is_none() {
            obsolete_legacy_fetch_mapping(remote)?
        } else {
            String::new()
        };
        let replace_legacy =
            refspecs.contains(&legacy_fetch_mapping(remote)) && old_values.contains(&obsolete);
        let missing: Vec<_> = refspecs
            .iter()
            .filter(|r| !old_values.contains(r))
            .collect();
        let config = repo.common_dir().join("config");
        let old_bytes = fs::read(&config).map_err(error)?;
        let staging = repo.common_dir().join("config.lock");
        let mut file = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&staging)
            .map_err(|e| {
                if e.kind() == std::io::ErrorKind::AlreadyExists {
                    error("repo-config-busy: native config.lock")
                } else {
                    error(e)
                }
            })?;
        let cleanup = StagingFile::new(staging.clone(), file.metadata().map_err(error)?);
        let intent = Intent {
            kind: OperationKind::ConfigChange(Box::new(wal::ConfigChange {
                config_sequence: Some(wal.next_config_sequence().map_err(error)?),
                staging: Some(crate::NativeLockArtifact::capture(
                    &staging,
                    &fgos_process::facts::self_identity()
                        .ok_or_else(|| error("config-owner-identity-unavailable"))?,
                    &file,
                )?),
                hooks: hooks.clone(),
                remote: remote.into(),
                url,
                refspecs: refspecs.to_vec(),
                old_values,
                old_config_digest: wal::canonical_digest(&old_bytes).map_err(error)?,
            })),
            request_digest: digest.clone(),
            repo_identity: wal.repository_identity().into(),
            resource_set: vec!["config:local".into()],
            authority_binding: authority.binding.clone(),
            writer_identity: "repository-config".into(),
            object_format: repo.object_format(),
            expected: Tip::Absent,
            next: Tip::Absent,
        };
        let mut chain = match wal.begin(id, intent, &authority).map_err(error)? {
            Begin::Created(c) => c,
            Begin::Existing(_) | Begin::Compacted(_) => {
                return Err(error("config-change-recovery-required"))
            }
        };
        if missing.is_empty() && !replace_legacy && hooks.as_ref().is_none_or(|h| h.old == h.next) {
            // Approval has no target effect. Preserve URL provenance in Intent
            // with one typed terminal record, never a fictitious transfer.
            chain = wal
                .append(&chain, Phase::Outcome(Outcome::ConfigApproved))
                .map_err(error)?;
            return Ok(receipt(id, &chain.intent().request_digest));
        }
        let result = (|| {
            file.set_permissions(fs::metadata(&config).map_err(error)?.permissions())
                .map_err(error)?;
            // Git's config writer renames its --file input. Keep native config.lock's
            // original inode untouched; edit a private draft then copy into our fd.
            let draft_dir = locks.join(format!("config-draft-{id}"));
            let builder = fs::DirBuilder::new();
            #[cfg(unix)]
            let mut builder = builder;
            #[cfg(unix)]
            {
                use std::os::unix::fs::DirBuilderExt;
                builder.mode(0o700);
            }
            builder.create(&draft_dir).map_err(error)?;
            let _draft = Draft(draft_dir.clone());
            let draft = draft_dir.join("config");
            fs::write(&draft, &old_bytes).map_err(error)?;
            let staging_text = draft
                .to_str()
                .ok_or_else(|| error("non-utf8-config-path"))?;
            let key = format!("remote.{remote}.fetch");
            if let Some(hooks) = &hooks {
                let out = if let Some(next) = &hooks.next {
                    call(&["config", "--file", staging_text, "core.hooksPath", next])?
                } else {
                    call(&[
                        "config",
                        "--file",
                        staging_text,
                        "--fixed-value",
                        "--unset-all",
                        "core.hooksPath",
                        hooks.old.as_deref().unwrap_or(""),
                    ])?
                };
                if !out.success {
                    return Err(out.error("config-change-staging-failed"));
                }
            }
            if replace_legacy {
                let out = call(&[
                    "config",
                    "--file",
                    staging_text,
                    "--fixed-value",
                    "--unset-all",
                    &key,
                    &obsolete,
                ])?;
                if !out.success {
                    return Err(out.error("config-change-staging-failed"));
                }
            }
            for refspec in missing {
                let out = call(&["config", "--file", staging_text, "--add", &key, refspec])?;
                if !out.success {
                    return Err(out.error("config-change-staging-failed"));
                }
            }
            file.seek(SeekFrom::Start(0)).map_err(error)?;
            file.set_len(0).map_err(error)?;
            file.write_all(&fs::read(&draft).map_err(error)?)
                .map_err(error)?;
            file.sync_all().map_err(error)?;
            chain = wal
                .append(
                    &chain,
                    Phase::NativeLockOwned(crate::NativeLockArtifact::capture(
                        &staging,
                        &fgos_process::facts::self_identity()
                            .ok_or_else(|| error("config-owner-identity-unavailable"))?,
                        &file,
                    )?),
                )
                .map_err(error)?;
            filesystem.checkpoint("config-staged").map_err(error)?;
            chain = wal.append(&chain, Phase::Prepared).map_err(error)?;
            // Native config.lock has excluded Git config writers since the snapshot
            // check. A raw editor is detected, never silently overwritten.
            if fs::read(&config).map_err(error)? != old_bytes
                || hooks
                    .as_ref()
                    .is_some_and(|h| self.local_hooks_value(repo).ok().as_ref() != Some(&h.old))
            {
                return Err(error("config-change-stale"));
            }
            authority
                .validate_publication_borrow(chain.intent())
                .map_err(error)?;
            chain = wal
                .append(
                    &chain,
                    Phase::TargetAttempt {
                        prior_target_attempt: None,
                        expected: Tip::Absent,
                        next: Tip::Absent,
                    },
                )
                .map_err(error)?;
            if !cleanup.is_owned() {
                return Err(error("config-lock-replaced"));
            }
            if fs::read(&config).map_err(error)? != old_bytes
                || hooks
                    .as_ref()
                    .is_some_and(|h| self.local_hooks_value(repo).ok().as_ref() != Some(&h.old))
            {
                return Err(error("config-change-stale"));
            }
            fs::rename(&staging, &config).map_err(error)?;
            filesystem.checkpoint("config-replaced").map_err(error)?;
            File::open(repo.common_dir())
                .and_then(|f| f.sync_all())
                .map_err(error)?;
            if !self.config_change_installed(
                repo,
                match &chain.intent().kind {
                    OperationKind::ConfigChange(c) => c,
                    _ => unreachable!(),
                },
            )? {
                return Err(error("config-change-readback-failed"));
            }
            wal.append(
                &chain,
                Phase::Outcome(Outcome::Transfer {
                    acknowledged: true,
                    unknown: false,
                    observations: vec![],
                    details: vec!["local fetch mapping installed".into()],
                }),
            )
            .map_err(error)?;
            Ok(receipt(id, &digest))
        })();
        if result.is_err() {
            let outcome = if chain
                .records()
                .iter()
                .any(|r| matches!(r.phase, Phase::TargetAttempt { .. }))
            {
                let installed = self
                    .config_change_installed(
                        repo,
                        match &chain.intent().kind {
                            OperationKind::ConfigChange(c) => c,
                            _ => unreachable!(),
                        },
                    )
                    .unwrap_or(false);
                Outcome::Transfer {
                    acknowledged: installed,
                    unknown: !installed,
                    observations: vec![],
                    details: vec![if installed {
                        "effectObservedOnly"
                    } else {
                        "uncertain"
                    }
                    .into()],
                }
            } else {
                Outcome::AbandonedBeforeAttempt
            };
            wal.append(&chain, Phase::Outcome(outcome)).map_err(error)?;
        }
        result
    }
}
use wal::PublicationAuthority;

/// Remove only the staging inode owned by this invocation. A substituted path
/// is evidence for the operator, never permission to unlink another writer.
struct StagingFile {
    path: std::path::PathBuf,
    identity: fs::Metadata,
}
impl StagingFile {
    fn new(path: std::path::PathBuf, identity: fs::Metadata) -> Self {
        Self { path, identity }
    }
    fn is_owned(&self) -> bool {
        #[cfg(unix)]
        {
            use std::os::unix::fs::MetadataExt;
            fs::symlink_metadata(&self.path).is_ok_and(|now| {
                now.is_file()
                    && now.dev() == self.identity.dev()
                    && now.ino() == self.identity.ino()
            })
        }
        #[cfg(not(unix))]
        {
            let _ = &self.identity;
            false
        }
    }
}
impl Drop for StagingFile {
    fn drop(&mut self) {
        if self.is_owned() {
            let _ = fs::remove_file(&self.path);
        }
    }
}
struct Draft(std::path::PathBuf);
impl Drop for Draft {
    fn drop(&mut self) {
        let _ = fs::remove_file(self.0.join("config"));
        let _ = fs::remove_file(self.0.join("config.lock"));
        let _ = fs::remove_dir(&self.0);
    }
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HooksReport {
    pub status: String,
    pub configured_path: Option<String>,
    pub enforcement_missing: bool,
    pub provenance: Option<String>,
}
impl GitDriver {
    fn hooks_value(&self, repo: &RepoHandle) -> Result<Option<String>> {
        // Git emits config in precedence order. A lower-scope setting must
        // keep the installation slot occupied even without a local setting.
        crate::driver::config_facts(self, repo, "core.hookspath")?
            .into_iter().last()
            .map(|v| String::from_utf8(v.value).map_err(error)).transpose()
    }
    fn local_hooks_value(&self, repo: &RepoHandle) -> Result<Option<String>> {
        let out = self.invoke(None, repo.trusted_main_root(),
            &["config", "--null", "--show-scope", "--list"],
            crate::driver::Policy::Inspect, None, false, 1024 * 1024,
            Duration::from_secs(30))?;
        if !out.success { return Err(error("hooks-config-read-failed")); }
        let values: Vec<_> = crate::driver::parse_config(&out.stdout)?
            .into_iter().filter(|(scope, key, _)| scope == b"local" && key == "core.hookspath").collect();
        if values.len() > 1 {
            return Err(error("hooks-config-ambiguous"));
        }
        values.into_iter().next()
            .map(|(_, _, value)| String::from_utf8(value).map_err(error)).transpose()
    }
    fn config_change_installed(
        &self,
        repo: &RepoHandle,
        change: &wal::ConfigChange,
    ) -> Result<bool> {
        if let Some(h) = &change.hooks {
            return Ok(self.local_hooks_value(repo)? == h.next);
        }
        Ok(mapping_installed(
            &change.remote,
            &change.refspecs,
            &self.configured_fetch_refspecs(repo, &change.remote)?,
        ))
    }
    fn hooks_owned(&self, repo: &RepoHandle, path: &str) -> Result<bool> {
        Ok(self.hooks_provenance(repo, path)?.is_some())
    }
    fn hooks_provenance(&self, repo: &RepoHandle, path: &str) -> Result<Option<String>> {
        let wal = match Wal::open_existing(repo.common_dir(), wal::OsFileSystem) {
            Ok(w) => w,
            Err(wal::WalError::Io(e)) if e.kind() == std::io::ErrorKind::NotFound => {
                return Ok(None)
            }
            Err(e) => return Err(error(e)),
        };
        let scan = wal.scan(100_000).map_err(error)?;
        if !scan.complete || scan.entries.iter().any(|e| e.error.is_some()) {
            return Err(error("git-wal-unreadable"));
        }
        let mut latest = None;
        let mut ambiguous = false;
        for entry in scan.entries {
            let chain = wal.inspect(&entry.operation_id).map_err(error)?;
            if matches!(
                chain.outcome(),
                Some(Outcome::ConfigApproved)
                    | Some(Outcome::Transfer {
                        acknowledged: true,
                        unknown: false,
                        ..
                    })
            ) {
                if let OperationKind::ConfigChange(c) = &chain.intent().kind {
                    if let Some(h) = &c.hooks {
                        if h.owner_path == path {
                            let stamp = chain.config_sequence();
                            // Multiple historical records have no durable relative
                            // order. Refuse ownership rather than guess from mtimes.
                            if latest.as_ref().is_some_and(|(old, _)| *old == stamp) {
                                ambiguous = true;
                            }
                            if latest.as_ref().is_none_or(|(old, _)| stamp > *old) {
                                ambiguous = false;
                                latest = Some((
                                    stamp,
                                    h.next.as_ref().map(|_| entry.operation_id.clone()),
                                ));
                            }
                        }
                    }
                }
            }
        }
        if ambiguous {
            return Err(error("hooks-provenance-order-unknown"));
        }
        Ok(latest.and_then(|(_, id)| id))
    }
    pub fn inspect_hooks(
        &self,
        repo: &RepoHandle,
        owned_path: &std::path::Path,
    ) -> Result<HooksReport> {
        if !owned_path.is_absolute() {
            return Err(error("invalid-hooks-path"));
        }
        let path = owned_path
            .to_str()
            .ok_or_else(|| error("invalid-hooks-path"))?;
        let configured = self.hooks_value(repo)?;
        let provenance = if self.local_hooks_value(repo)?.as_deref() == Some(path) {
            self.hooks_provenance(repo, path)?
        } else {
            None
        };
        let hook = owned_path.join("pre-commit");
        let executable = hook.metadata().is_ok_and(|m| {
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                m.is_file() && m.permissions().mode() & 0o111 != 0
            }
            #[cfg(not(unix))]
            {
                m.is_file()
            }
        });
        let enforcement_missing = configured.as_deref() != Some(path) || !executable;
        Ok(HooksReport {
            status: if configured.is_none() {
                "empty"
            } else if provenance.is_some() {
                "owned"
            } else {
                "skippedExisting"
            }
            .into(),
            configured_path: configured,
            enforcement_missing,
            provenance,
        })
    }
    pub fn ensure_hooks(
        &self,
        repo: &RepoHandle,
        owned_path: &std::path::Path,
        id: &str,
    ) -> Result<HooksReport> {
        self.ensure_hooks_with_filesystem(repo, owned_path, id, &wal::OsFileSystem)
    }
    pub fn ensure_hooks_with_filesystem<F: wal::FileSystem>(
        &self,
        repo: &RepoHandle,
        owned_path: &std::path::Path,
        id: &str,
        filesystem: &F,
    ) -> Result<HooksReport> {
        let before = self.inspect_hooks(repo, owned_path)?;
        if before.status == "skippedExisting" {
            return Ok(before);
        }
        let path = owned_path
            .to_str()
            .ok_or_else(|| error("invalid-hooks-path"))?;
        self.change_config(repo, "", &[], id, Some((path, false)), filesystem)?;
        self.inspect_hooks(repo, owned_path)
    }
    pub fn remove_owned_hooks_config(
        &self,
        repo: &RepoHandle,
        owned_path: &std::path::Path,
        id: &str,
    ) -> Result<HooksReport> {
        let before = self.inspect_hooks(repo, owned_path)?;
        if before.status != "owned" {
            return Ok(before);
        }
        let path = owned_path
            .to_str()
            .ok_or_else(|| error("invalid-hooks-path"))?;
        self.change_config(repo, "", &[], id, Some((path, true)), &wal::OsFileSystem)?;
        self.inspect_hooks(repo, owned_path)
    }
}

impl GitDriver {
    pub(crate) fn recover_config_change(
        &self,
        repo: &RepoHandle,
        id: &str,
        change: &wal::ConfigChange,
    ) -> Result<()> {
        let hooks = change.hooks.as_ref().map(|h| (h.owner_path.as_str(), h.next.is_none()));
        match self.change_config(repo, &change.remote, &change.refspecs, id, hooks, &wal::OsFileSystem) {
            Ok(_) => Ok(()),
            Err(e) if e.cause == "config-change-resolved-without-success" => Ok(()),
            Err(e) => Err(e),
        }
    }
    /// Settle an interrupted hooks change by observation, never replay its effect.
    pub fn recover_hooks_config(&self, repo: &RepoHandle, id: &str) -> Result<HooksReport> {
        let wal = Wal::open_existing(repo.common_dir(), wal::OsFileSystem).map_err(error)?;
        let chain = wal.inspect(id).map_err(error)?;
        let OperationKind::ConfigChange(change) = &chain.intent().kind else {
            return Err(error("invalid-hooks-operation"));
        };
        let h = change
            .hooks
            .as_ref()
            .ok_or_else(|| error("invalid-hooks-operation"))?;
        self.recover_config_change(repo, id, change)?;
        self.inspect_hooks(repo, std::path::Path::new(&h.owner_path))
    }
}
