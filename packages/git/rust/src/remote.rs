//! Explicit non-event transfers. Remote transport is never enabled by another port.
use crate::{
    driver::{Output, Policy},
    refs::{admission, direct, failure, pending, receipt, recovery, sync_refs, tip, Authority},
    wal::{self, Begin, Intent, OperationKind, Outcome, Phase, Tip, Wal},
    *,
};
use fgos_holder_lock::{BorrowedHandle, LockScope};
use serde::Serialize;
use std::time::Duration;
#[derive(Debug, Clone, Serialize)]
pub struct RefMapping {
    pub source: RefName,
    pub destination: RefName,
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RemoteRef {
    pub name: RefName,
    pub oid: Oid,
}
impl GitDriver {
    fn transfer_url(
        &self,
        repo: &RepoHandle,
        grant: &RemoteGrant,
    ) -> Result<(String, &'static str)> {
        if grant.name.is_empty()
            || !grant
                .name
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b"_-".contains(&b))
        {
            return Err(failure("remote-not-granted"));
        }
        let url = Inspect::remote_url(self, repo, &grant.name)?;
        if url != grant.pinned_url || url_has_credentials_or_controls(&url) || url.starts_with('-')
        {
            return Err(failure("remote-url-not-pinned-or-credentials-present"));
        }
        let scheme = if url.starts_with('/') || url.starts_with("file://") {
            "file"
        } else if url.starts_with("https://") {
            "https"
        } else if url.starts_with("ssh://") {
            "ssh"
        } else {
            return Err(failure("remote-protocol-not-supported"));
        };
        Ok((url, scheme))
    }
    fn transfer_call(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        scheme: &str,
        args: &[String],
    ) -> Result<Output> {
        scope.validate().map_err(failure)?;
        self.preflight(repo)?;
        let mut argv = vec![
            "-c".into(),
            "protocol.allow=never".into(),
            "-c".into(),
            format!("protocol.{scheme}.allow=always"),
            "-c".into(),
            "core.sshCommand=ssh -oBatchMode=yes".into(),
            "-c".into(),
            "core.askPass=".into(),
        ];
        argv.extend_from_slice(args);
        let held = scope.holding().map_err(failure)?;
        let loan = held.last().and_then(|h| scope.handle(&h.name));
        self.invoke(
            Some(repo),
            repo.trusted_main_root(),
            &argv.iter().map(String::as_str).collect::<Vec<_>>(),
            Policy::Remote,
            loan.map(|h| h as &dyn crate::driver::BorrowedSpawn),
            true,
            16 * 1024 * 1024,
            Duration::from_secs(120),
        )
    }
    fn remote_scope<'a>(&self, held: Vec<BorrowedHandle<'a>>) -> Result<LockScope<'a>> {
        require_lock_scope_platform()?;
        let scope = LockScope::seeded(held).map_err(failure)?;
        if scope
            .holding()
            .map_err(failure)?
            .iter()
            .any(|h| h.rank >= 60)
        {
            return Err(failure("lock-order-violation"));
        }
        Ok(scope)
    }
    fn advertised(
        &self,
        repo: &RepoHandle,
        scope: &LockScope<'_>,
        url: &str,
        scheme: &str,
        names: &[RefName],
    ) -> Result<Vec<RemoteRef>> {
        if names.is_empty()
            || names.len() > 256
            || names.iter().any(|n| n.as_str().starts_with("refs/fgos/"))
        {
            return Err(failure("invalid-explicit-remote-refs"));
        }
        let mut args = vec!["ls-remote".into(), "--refs".into(), "--".into(), url.into()];
        args.extend(names.iter().map(|n| n.as_str().into()));
        let out = self.transfer_call(repo, scope, scheme, &args)?;
        if !out.success {
            return Err(out.error("remote-advertisement-failed"));
        }
        let mut result = vec![];
        for line in std::str::from_utf8(&out.stdout).map_err(failure)?.lines() {
            let (oid, name) = line
                .split_once('\t')
                .ok_or_else(|| failure("invalid-remote-advertisement"))?;
            let name = RefName::parse(name).map_err(failure)?;
            if !names.contains(&name) {
                return Err(failure("unexpected-remote-ref"));
            }
            result.push(RemoteRef {
                name,
                oid: Oid::parse(oid, repo.object_format()).map_err(failure)?,
            });
        }
        Ok(result)
    }
    pub fn inspect_remote(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        grant: &RemoteGrant,
        names: &[RefName],
    ) -> Result<Vec<RemoteRef>> {
        let scope = self.remote_scope(held)?;
        let (url, scheme) = self.transfer_url(repo, grant)?;
        self.advertised(repo, &scope, &url, scheme, names)
    }
    pub fn fetch_refs(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        grant: &RemoteGrant,
        mappings: &[RefMapping],
        writer: &str,
        id: &str,
    ) -> Result<Receipt> {
        self.transfer_refs(
            repo,
            held,
            grant,
            mappings,
            writer,
            id,
            false,
            &wal::OsFileSystem,
        )
    }
    pub fn push_refs(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        grant: &RemoteGrant,
        mappings: &[RefMapping],
        writer: &str,
        id: &str,
    ) -> Result<Receipt> {
        self.transfer_refs(
            repo,
            held,
            grant,
            mappings,
            writer,
            id,
            true,
            &wal::OsFileSystem,
        )
    }
    #[allow(clippy::too_many_arguments)]
    pub fn transfer_refs<F: wal::FileSystem>(
        &self,
        repo: &RepoHandle,
        held: Vec<BorrowedHandle<'_>>,
        grant: &RemoteGrant,
        mappings: &[RefMapping],
        writer: &str,
        id: &str,
        push: bool,
        filesystem: &F,
    ) -> Result<Receipt> {
        let scope = crate::refs::acquire_worktree_admin(repo, held)?;
        if writer.is_empty() || mappings.is_empty() || mappings.len() > 256 {
            return Err(failure("invalid-remote-mappings"));
        }
        let mut destinations = std::collections::BTreeSet::new();
        for m in mappings {
            if m.source.as_str().starts_with("refs/fgos/")
                || m.destination.as_str().starts_with("refs/fgos/")
                || (!push && !m.destination.as_str().starts_with("refs/remotes/"))
                || (push && !m.destination.as_str().starts_with("refs/heads/"))
                || !destinations.insert(m.destination.as_str())
            {
                return Err(failure("invalid-remote-mappings"));
            }
        }
        let (url, scheme) = self.transfer_url(repo, grant)?;
        wal::require_activation_fence(repo).map_err(failure)?;
        let wal = Wal::with_filesystem(repo.common_dir(), filesystem).map_err(failure)?;
        let resources: Vec<String> = destinations.into_iter().map(str::to_owned).collect();
        admission(&wal, id, &resources)?;
        let digest = wal::canonical_digest(&(push, &url, mappings, writer)).map_err(failure)?;
        // Terminal replay returns its recorded acknowledgement, without a new
        // network request. A pending id can never send a second transfer.
        match wal.inspect(id) {
            Ok(c) => {
                if c.intent().request_digest != digest {
                    return Err(failure("operation-id-conflict"));
                }
                return match c.outcome() {
                    Some(Outcome::Transfer {
                        acknowledged,
                        unknown,
                        ..
                    }) => receipt(
                        id,
                        c.intent(),
                        ExpectedTip::Absent,
                        false,
                        Checkout::NotApplicable,
                        if *acknowledged {
                            Remote::Acknowledged
                        } else if *unknown {
                            Remote::Unknown
                        } else {
                            Remote::Rejected
                        },
                    ),
                    _ => Err(recovery("operation-recovery-required")),
                };
            }
            Err(wal::WalError::Io(e)) if e.kind() == std::io::ErrorKind::NotFound => (),
            Err(e) => return Err(recovery(format!("git-wal-unreadable: {e}"))),
        }
        // Advertisement is read-only. Bind exact old/new targets in Intent.
        let names: Vec<_> = mappings
            .iter()
            .map(|m| {
                if push {
                    m.destination.clone()
                } else {
                    m.source.clone()
                }
            })
            .collect();
        let advertised = self.advertised(repo, &scope, &url, scheme, &names)?;
        let mut updates = vec![];
        for m in mappings {
            let remote = advertised
                .iter()
                .find(|r| {
                    r.name
                        == if push {
                            m.destination.clone()
                        } else {
                            m.source.clone()
                        }
                })
                .map(|r| ExpectedTip::Oid(r.oid.clone()))
                .unwrap_or(ExpectedTip::Absent);
            let local = direct(self, repo, if push { &m.source } else { &m.destination })?;
            let (old, next) = if push {
                (remote, local)
            } else {
                (local, remote)
            };
            let next = match next {
                ExpectedTip::Oid(o) => o,
                _ => return Err(failure("remote-source-absent")),
            };
            if push {
                self.checked(
                    repo,
                    &["cat-file", "-e", &format!("{}^{{commit}}", next.as_str())],
                    Policy::Inspect,
                )?;
            }
            updates.push((&m.destination, old, next));
        }
        let refspecs = mappings
            .iter()
            .map(|m| format!("{}:{}", m.source.as_str(), m.destination.as_str()))
            .collect();
        let targets = updates
            .iter()
            .map(|(n, o, v)| (n.as_str().into(), tip(o), Tip::Oid(v.as_str().into())))
            .collect();
        let kind = if push {
            OperationKind::RemotePush {
                url: url.clone(),
                refspecs,
                targets,
            }
        } else {
            OperationKind::RemoteFetch {
                url: url.clone(),
                refspecs,
                targets,
            }
        };
        let intent = Intent {
            kind,
            request_digest: digest.clone(),
            repo_identity: wal.repository_identity().into(),
            resource_set: resources,
            authority_binding: wal::canonical_digest(&(
                wal.repository_identity(),
                "remote",
                &grant.name,
                &url,
            ))
            .map_err(failure)?,
            writer_identity: writer.into(),
            object_format: repo.object_format(),
            expected: Tip::Absent,
            next: Tip::Absent,
        };
        let authority = Authority {
            scope: &scope,
            binding: intent.authority_binding.clone(),
        };
        let chain = match wal.begin(id, intent, &authority).map_err(failure)? {
            Begin::Created(c) => c,
            Begin::Existing(c) => {
                return match c.outcome() {
                    Some(Outcome::Transfer {
                        acknowledged,
                        unknown,
                        ..
                    }) => receipt(
                        id,
                        c.intent(),
                        ExpectedTip::Absent,
                        false,
                        Checkout::NotApplicable,
                        if *acknowledged {
                            Remote::Acknowledged
                        } else if *unknown {
                            Remote::Unknown
                        } else {
                            Remote::Rejected
                        },
                    ),
                    _ => Err(recovery("operation-recovery-required")),
                };
            }
            Begin::Compacted(_) => return Err(recovery("operation-recovery-required")),
        };
        let chain = wal.append(&chain, Phase::Prepared).map_err(failure)?;
        scope.validate().map_err(failure)?;
        let attempted = wal
            .append(
                &chain,
                Phase::TargetAttempt {
                    prior_target_attempt: None,
                    expected: Tip::Absent,
                    next: Tip::Absent,
                },
            )
            .map_err(failure)?;
        let mut install_attempted = false;
        let result = (|| {
            filesystem
                .checkpoint("before-remote-transfer")
                .map_err(failure)?;
            let mut args: Vec<String> = if push {
                vec![
                    "push",
                    "--atomic",
                    "--porcelain",
                    "--no-verify",
                    "--no-follow-tags",
                    "--recurse-submodules=no",
                    "--",
                ]
            } else {
                vec![
                    "-c",
                    "core.fsync=all",
                    "fetch",
                    "--no-write-fetch-head",
                    "--no-tags",
                    "--no-recurse-submodules",
                    "--no-auto-maintenance",
                    "--",
                ]
            }
            .into_iter()
            .map(str::to_owned)
            .collect();
            args.push(url.clone());
            args.extend(updates.iter().map(|(dest, _, oid)| {
                if push {
                    format!("{}:{}", oid.as_str(), dest.as_str())
                } else {
                    oid.as_str().into()
                }
            }));
            let out = self.transfer_call(repo, &scope, scheme, &args)?;
            filesystem
                .checkpoint("after-remote-transfer")
                .map_err(failure)?;
            let mut observations = vec![];
            let mut acknowledged = out.success;
            let mut installed = 0;
            if push {
                let actual = self.advertised(
                    repo,
                    &scope,
                    &url,
                    scheme,
                    &mappings
                        .iter()
                        .map(|m| m.destination.clone())
                        .collect::<Vec<_>>(),
                )?;
                for (name, _, next) in &updates {
                    let observed = actual
                        .iter()
                        .find(|r| r.name == **name)
                        .map(|r| ExpectedTip::Oid(r.oid.clone()))
                        .unwrap_or(ExpectedTip::Absent);
                    acknowledged &= observed == ExpectedTip::Oid(next.clone());
                    observations.push((name.as_str().into(), tip(&observed)));
                }
            } else if out.success {
                sync_downloaded_objects(repo)?;
                // Fetch objects only. Install remote-tracking destinations using
                // exact-old no-dereference CAS, never Git fetch's blind mapping.
                let mut stale = false;
                for (name, old, _) in &updates {
                    stale |= direct(self, repo, name)? != *old;
                }
                for (name, old, next) in &updates {
                    scope.validate().map_err(failure)?;
                    if stale {
                        acknowledged = false;
                        observations.push((name.as_str().into(), tip(&direct(self, repo, name)?)));
                        continue;
                    }
                    let zero = "0".repeat(if repo.object_format() == ObjectFormat::Sha1 {
                        40
                    } else {
                        64
                    });
                    let prior = old.clone();
                    let old = match old {
                        ExpectedTip::Oid(o) => o.as_str(),
                        _ => zero.as_str(),
                    };
                    self.preflight(repo)?;
                    let held = scope.holding().map_err(failure)?;
                    let loan = held.last().and_then(|h| scope.handle(&h.name));
                    install_attempted = true;
                    let cas = self.invoke(
                        Some(repo),
                        repo.trusted_main_root(),
                        &[
                            "-c",
                            "core.fsync=all",
                            "update-ref",
                            "--no-deref",
                            name.as_str(),
                            next.as_str(),
                            old,
                        ],
                        if loan.is_some() {
                            Policy::Publication
                        } else {
                            Policy::LocalMutation
                        },
                        loan.map(|h| h as &dyn crate::driver::BorrowedSpawn),
                        true,
                        1024 * 1024,
                        Duration::from_secs(30),
                    )?;
                    let observed = direct(self, repo, name)?;
                    if !cas.success || observed != ExpectedTip::Oid(next.clone()) {
                        acknowledged = false;
                    }
                    if cas.success
                        && observed == ExpectedTip::Oid(next.clone())
                        && observed != prior
                    {
                        installed += 1;
                    }
                    sync_refs(repo, name)?;
                    observations.push((name.as_str().into(), tip(&observed)));
                }
            }
            if !push && !out.success {
                for (name, _, _) in &updates {
                    observations.push((name.as_str().into(), tip(&direct(self, repo, name)?)));
                }
            }
            // All unchanged targets establish rejection. Partial/mismatched
            // observations cannot establish an atomic remote outcome.
            let unchanged = updates.iter().all(|(name, old, _)| {
                observations
                    .iter()
                    .any(|(n, value)| n == name.as_str() && *value == tip(old))
            });
            let unknown = !acknowledged && if push { !unchanged } else { installed > 0 };
            wal.append(
                &attempted,
                Phase::Outcome(Outcome::Transfer {
                    acknowledged,
                    unknown,
                    observations,
                    details: vec![if acknowledged {
                        "acknowledged"
                    } else if unknown {
                        "remote-outcome-unknown"
                    } else {
                        "rejected"
                    }
                    .into()],
                }),
            )
            .map_err(failure)?;
            receipt(
                id,
                attempted.intent(),
                ExpectedTip::Absent,
                false,
                Checkout::NotApplicable,
                if acknowledged {
                    Remote::Acknowledged
                } else if unknown {
                    Remote::Unknown
                } else {
                    Remote::Rejected
                },
            )
        })();
        if !push && !install_attempted {
            if let Err(error) = &result {
                let observations: Result<Vec<_>> = updates
                    .iter()
                    .map(|(name, _, _)| Ok((name.as_str().into(), tip(&direct(self, repo, name)?))))
                    .collect();
                if let Ok(observations) = observations {
                    if wal
                        .append(
                            &attempted,
                            Phase::Outcome(Outcome::Transfer {
                                acknowledged: false,
                                unknown: false,
                                observations,
                                details: vec![error.cause.clone()],
                            }),
                        )
                        .is_ok()
                    {
                        return receipt(
                            id,
                            attempted.intent(),
                            ExpectedTip::Absent,
                            false,
                            Checkout::NotApplicable,
                            Remote::Rejected,
                        );
                    }
                }
            }
        }
        result.map_err(|e| {
            let mut e = pending(e, id);
            if push {
                e.code = ResultCode::RemoteOutcomeUnknown;
                e.cause = "remote-outcome-unknown".into();
            }
            e
        })
    }
}

// Git syncs object bytes with core.fsync=all; persist pack/fanout names before
// installing fetched refs. Refuse links instead of following an object escape.
fn sync_downloaded_objects(repo: &RepoHandle) -> Result<()> {
    let objects = repo.common_dir().join("objects");
    for entry in std::fs::read_dir(&objects).map_err(failure)? {
        let entry = entry.map_err(failure)?;
        let meta = entry.file_type().map_err(failure)?;
        if meta.is_symlink() {
            return Err(failure("untrusted-object-directory"));
        }
        if meta.is_dir() {
            fgos_durable_file::sync_directory(&entry.path()).map_err(failure)?;
        }
    }
    fgos_durable_file::sync_directory(&objects).map_err(failure)
}

// SSH user names select an account, not a password. Other userinfo and all
// password-bearing SSH userinfo are refused before transport.
pub(crate) fn url_has_credentials_or_controls(url: &str) -> bool {
    if url.contains(['\n', '\r', '\0']) {
        return true;
    }
    let Some((scheme, rest)) = url.split_once("://") else {
        return false;
    };
    let authority = rest.split('/').next().unwrap_or("");
    match authority.rsplit_once('@') {
        None => false,
        Some((user, _)) => scheme != "ssh" || user.is_empty() || user.contains([':', '%', '@']),
    }
}


impl GitDriver {
    /// A transport timeout stays unknown: observation never repeats the request.
    pub fn recover_transfer(&self, repo: &RepoHandle, held: Vec<BorrowedHandle<'_>>, writer: &str, id: &str) -> Result<Outcome> {
        let mut scope = crate::refs::acquire_worktree_admin(repo, held)?;
        crate::recovery::leaf(&mut scope, repo)?;
        let wal = Wal::open_existing(repo.common_dir(), wal::OsFileSystem).map_err(failure)?;
        let chain = wal.inspect(id).map_err(failure)?;
        if !matches!(chain.intent().kind, OperationKind::RemoteFetch {..} | OperationKind::RemotePush {..}) { return Err(failure("not-remote-transfer-operation")); }
        if chain.intent().writer_identity != writer || chain.intent().repo_identity != wal.repository_identity() { return Err(failure("remote-authority-mismatch")); }
        if let Some(o) = chain.outcome() { return Ok(o.clone()); }
        let attempted = chain.records().iter().any(|r| matches!(r.phase, Phase::TargetAttempt {..}));
        let outcome = if !attempted { Outcome::AbandonedBeforeAttempt } else {
            let observations = chain.intent().resource_set.iter().map(|n| Ok((n.clone(), tip(&direct(self,repo,&RefName::parse(n).map_err(failure)?)?)))).collect::<Result<Vec<_>>>()?;
            Outcome::Transfer {acknowledged:false,unknown:true,observations,details:vec!["outcome-unknown; query remote before any new request".into()]}
        };
        wal.append(&chain,Phase::Outcome(outcome.clone())).map_err(failure)?;
        Ok(outcome)
    }
}

#[cfg(test)]
mod tests {
    use super::url_has_credentials_or_controls;
    #[test]
    fn ssh_usernames_are_not_password_credentials() {
        for url in [
            "ssh://git@example.invalid/repo",
            "ssh://example.invalid/repo",
            "https://example.invalid/repo",
            "/tmp/a@b.git",
        ] {
            assert!(!url_has_credentials_or_controls(url), "{url}");
        }
        for url in [
            "ssh://git:password@example.invalid/repo",
            "ssh://git%3Asecret@example.invalid/repo",
            "https://user@example.invalid/repo",
            "https://user:secret@example.invalid/repo",
            "ssh://git@example.invalid/repo\n",
        ] {
            assert!(url_has_credentials_or_controls(url), "{url}");
        }
    }
}
