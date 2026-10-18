//! The local configuration writer. A native config.lock excludes ordinary Git
//! config writers, while repo-config 80 serializes fgOS operations.
use crate::wal::{self, Begin, Intent, OperationKind, Outcome, Phase, Tip, Wal};
use crate::*;
use fgos_holder_lock::{Acquire, Handle, Mode, Resource, Wait};
use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::time::Duration;

fn error(cause: impl std::fmt::Display) -> OperationError {
    OperationError {
        code: ResultCode::RecoveryRequired,
        cause: cause.to_string(),
        retryable: false,
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
            2000,
        ) {
            Acquire::Acquired(h) => h,
            other => return Err(error(format!("repo-config-busy: {other:?}"))),
        };
        let wal = Wal::open(repo).map_err(error)?;
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
        // An existing id is never retried after TargetAttempt. Even a different
        // current config cannot turn an unknown attempt into permission to write.
        if let Ok(old) = wal.inspect(id) {
            if old.intent().request_digest != digest {
                return Err(error("operation-id-conflict"));
            }
            return if old.outcome().is_some() {
                Ok(receipt(id, &digest))
            } else {
                Err(error("config-change-recovery-required"))
            };
        }
        let scan = wal.scan(100_000).map_err(error)?;
        if !scan.complete || scan.entries.iter().any(|e| e.error.is_some()) {
            return Err(error("git-wal-unreadable"));
        }
        for chain in wal.active(100_000).map_err(error)? {
            if matches!(chain.intent().kind, OperationKind::ConfigChange(_)) {
                return Err(error("config-change-recovery-required"));
            }
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
        let mut chain = match wal.begin(id, intent, &authority).map_err(error)? {
            Begin::Created(c) => c,
            Begin::Existing(_) | Begin::Compacted(_) => {
                return Err(error("config-change-recovery-required"))
            }
        };
        if missing.is_empty() {
            chain = wal
                .append(&chain, Phase::Outcome(Outcome::AbandonedBeforeAttempt))
                .map_err(error)?;
            return Ok(receipt(id, &chain.intent().request_digest));
        }
        let staging = repo.common_dir().join("config.lock");
        let mut file = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&staging)
            .map_err(error)?;
        file.set_permissions(fs::metadata(&config).map_err(error)?.permissions())
            .map_err(error)?;
        file.write_all(&old_bytes).map_err(error)?;
        file.sync_all().map_err(error)?;
        drop(file);
        let staging_text = staging
            .to_str()
            .ok_or_else(|| error("non-utf8-config-path"))?;
        let key = format!("remote.{remote}.fetch");
        for refspec in missing {
            let out = call(&["config", "--file", staging_text, "--add", &key, refspec])?;
            if !out.success {
                return Err(out.error("config-change-staging-failed"));
            }
        }
        File::open(&staging)
            .and_then(|f| f.sync_all())
            .map_err(error)?;
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
        fs::rename(&staging, &config).map_err(error)?;
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
    }
}
use wal::PublicationAuthority;
