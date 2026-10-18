//! The local configuration writer. A native config.lock excludes ordinary Git
//! config writers, while repo-config 80 serializes fgOS operations.
use crate::wal::{self, Begin, Intent, OperationKind, Outcome, Phase, Tip, Wal};
use crate::*;
use fgos_holder_lock::{Acquire, Handle, Mode, Resource, Wait};
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
impl RepositoryConfig for GitDriver {
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
        require_lock_scope_platform()?;
        if remote.is_empty()
            || !remote
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b"-_".contains(&b))
        {
            return Err(error("invalid-fetch-mapping-remote"));
        }
        let allowed = [
            format!("+refs/fgos/events/*:refs/fgos/remotes/{remote}/events/*"),
            format!("+refs/fgos/legacy:refs/fgos/remotes/{remote}/legacy"),
        ];
        if refspecs.is_empty() || refspecs.iter().any(|r| !allowed.contains(r)) {
            return Err(error("invalid-publication-fetch-mapping"));
        }
        let locks = repo.trusted_main_root().join(".fgos/locks");
        fs::create_dir_all(&locks).map_err(error)?;
        let handle = match fgos_holder_lock::acquire(
            &Resource::new("repo-config", locks.join("repo-config.lock")),
            Mode::Ex,
            Wait::Ms(5000),
            fgos_holder_lock::DEFAULT_KILL_WAIT_MS,
        ) {
            Acquire::Acquired(h) => h,
            other => return Err(error(format!("repo-config-busy: {other:?}"))),
        };
        wal::require_activation_fence(repo).map_err(error)?;
        let wal = Wal::with_filesystem(repo.common_dir(), filesystem).map_err(error)?;
        let authority = Authority {
            handle: &handle,
            binding: wal::canonical_digest(&(
                wal.repository_identity(),
                "repo-config",
                repo.common_dir(),
            ))
            .map_err(error)?,
        };
        let digest =
            wal::canonical_digest(&("ensureFetchMapping", remote, refspecs)).map_err(error)?;
        let scan = wal.scan(100_000).map_err(error)?;
        if !scan.complete || scan.entries.iter().any(|e| e.error.is_some()) {
            return Err(error("git-wal-unreadable"));
        }
        for chain in wal.active(100_000).map_err(error)? {
            if let OperationKind::ConfigChange(change) = &chain.intent().kind {
                authority
                    .validate_publication_borrow(chain.intent())
                    .map_err(error)?;
                let outcome = if chain
                    .records()
                    .iter()
                    .any(|r| matches!(r.phase, Phase::TargetAttempt { .. }))
                {
                    let observed = self.configured_fetch_refspecs(repo, &change.remote);
                    let installed = observed.as_ref().is_ok_and(|values| {
                        change
                            .refspecs
                            .iter()
                            .all(|r| values.iter().any(|v| v.value == r.as_bytes()))
                    });
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
                Some(Outcome::AbandonedBeforeAttempt) if matches!(&old.intent().kind, OperationKind::ConfigChange(change) if change.refspecs.iter().all(|r| change.old_values.contains(r))) => {
                    Ok(receipt(id, &digest))
                }
                _ => Err(error("config-change-resolved-without-success")),
            };
        }
        let call = |args: &[&str]| {
            self.publication_call(repo, &handle, args, &[], false, Duration::from_secs(30))
        };
        let url = self.remote_url(repo, remote)?;
        let old_values: Vec<String> = self
            .configured_fetch_refspecs(repo, remote)?
            .into_iter()
            .map(|v| String::from_utf8(v.value).map_err(error))
            .collect::<Result<_>>()?;
        let missing: Vec<_> = refspecs
            .iter()
            .filter(|r| !old_values.contains(r))
            .collect();
        let config = repo.common_dir().join("config");
        let old_bytes = fs::read(&config).map_err(error)?;
        let intent = Intent {
            kind: OperationKind::ConfigChange(Box::new(wal::ConfigChange {
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
        let mut chain = match wal.begin(id, intent, &authority).map_err(error)? {
            Begin::Created(c) => c,
            Begin::Existing(_) | Begin::Compacted(_) => {
                return Err(error("config-change-recovery-required"))
            }
        };
        if missing.is_empty() {
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
            filesystem.checkpoint("config-staged").map_err(error)?;
            chain = wal.append(&chain, Phase::Prepared).map_err(error)?;
            // Native config.lock has excluded Git config writers since the snapshot
            // check. A raw editor is detected, never silently overwritten.
            if fs::read(&config).map_err(error)? != old_bytes {
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
            fs::rename(&staging, &config).map_err(error)?;
            filesystem.checkpoint("config-replaced").map_err(error)?;
            File::open(repo.common_dir())
                .and_then(|f| f.sync_all())
                .map_err(error)?;
            let values = self.configured_fetch_refspecs(repo, remote)?;
            if refspecs
                .iter()
                .any(|r| !values.iter().any(|v| v.value == r.as_bytes()))
            {
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
                    .configured_fetch_refspecs(repo, remote)
                    .is_ok_and(|values| {
                        refspecs
                            .iter()
                            .all(|r| values.iter().any(|v| v.value == r.as_bytes()))
                    });
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
