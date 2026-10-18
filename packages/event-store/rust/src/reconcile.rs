//! Ancestry and deterministic two-parent reconciliation through Publication.
use crate::{
    envelope::Seal,
    errors::{invalid, Error, ErrorCode},
    read::descends,
    seal::operation_id,
    walk::git_error,
};
use fgos_git::*;
use std::result::Result;
fn date(port: &dyn Publication, repo: &RepoHandle, oid: &Oid) -> Result<i64, Error> {
    let ReadObject::Present { bytes, .. } = port
        .read_object(repo, oid, ObjectType::Commit)
        .map_err(git_error)?
    else {
        return Err(invalid("missing parent commit"));
    };
    let text = std::str::from_utf8(&bytes).map_err(|e| invalid(e.to_string()))?;
    let line = text
        .split("\n\n")
        .next()
        .unwrap()
        .lines()
        .find(|l| l.starts_with("committer "))
        .ok_or_else(|| invalid("missing committer"))?;
    line.rsplit_once(' ')
        .and_then(|(a, _)| a.rsplit_once(' '))
        .and_then(|(_, n)| n.parse().ok())
        .ok_or_else(|| invalid("invalid committer date"))
}
pub fn reconcile(
    port: &PublicationPort<'_>,
    repo: &RepoHandle,
    reference: &RefName,
    own: Option<Oid>,
    mirror: &Oid,
    machine: &str,
    layout: &crate::layout::Layout,
) -> Result<Oid, Error> {
    let next = match &own {
        Some(own) if descends(port, repo, own, mirror.as_str())? => return Ok(own.clone()),
        Some(own) if !descends(port, repo, mirror, own.as_str())? => {
            let parents = vec![own.clone(), mirror.clone()];
            let bytes = Seal::Merge {
                v: 1,
                machine_id: machine.into(),
                parents: [own.as_str().into(), mirror.as_str().into()],
            }
            .canonical_line()?;
            let blob = port.write_blob(repo, &bytes).map_err(git_error)?;
            let tree = port
                .write_tree(
                    repo,
                    &[TreeEntry {
                        name: b"seal.json".to_vec(),
                        mode: 0o100644,
                        oid: blob,
                    }],
                )
                .map_err(git_error)?;
            crate::publish::event_commit(
                port,
                repo,
                tree,
                parents,
                date(port, repo, own)?.max(date(port, repo, mirror)?),
                b"fgos-events merge".to_vec(),
            )?
        }
        _ => mirror.clone(),
    };
    crate::receipt::authorize_reconcile(layout, reference, own.as_ref(), &next)?;
    let id = operation_id()?;
    let result = port.compare_and_swap(
        repo,
        reference,
        &own.map(ExpectedTip::Oid).unwrap_or(ExpectedTip::Absent),
        &ExpectedTip::Oid(next.clone()),
        &id,
    );
    match result {
        Ok(_) => {
            port.release_pin_and_compact(repo, &id).map_err(git_error)?;
        }
        Err(e) if e.code == ResultCode::Stale => {
            port.release_pin_and_compact(repo, &id).map_err(git_error)?;
            if !matches!(port.read_ref(repo,reference).map_err(git_error)?,RefValue::Direct(ref o) if *o == next)
            {
                return Err(Error::new(
                    ErrorCode::EventStoreRefMoved,
                    "sync CAS lost to outside ref move; retry after verification",
                ));
            }
        }
        Err(e) => return Err(git_error(e)),
    }
    Ok(next)
}
