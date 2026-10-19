//! Changeset object construction; all object writes belong to Git.
use crate::{
    envelope::{sha256, Envelope, Seal},
    errors::{invalid, Error},
    layout::StreamId,
    walk::git_error,
};
use fgos_git::{CommitInput, Identity, Oid, Publication, RepoHandle, TreeEntry};
pub fn objects(
    port: &dyn Publication,
    repo: &RepoHandle,
    machine: &str,
    stream: &StreamId,
    bytes: &[u8],
    events: &[Envelope],
    mut parents: Vec<Oid>,
) -> Result<Oid, Error> {
    let first = events.first().ok_or_else(|| invalid("empty seal"))?;
    let last = events.last().unwrap();
    let mut promoted = None;
    for e in events.iter().filter(|e| e.event_type == "store.promote") {
        let oid = Oid::parse(
            e.payload["tip"]
                .as_str()
                .ok_or_else(|| invalid("missing promote tip"))?,
            repo.object_format(),
        )
        .map_err(|e| invalid(e.to_string()))?;
        if promoted.as_ref().is_some_and(|old| *old != oid) {
            return Err(invalid("one segment cannot promote multiple tips"));
        }
        promoted = Some(oid);
    }
    if let Some(oid) = promoted {
        parents.push(oid);
    }
    let header = Seal::Seal {
        v: 1,
        machine_id: machine.into(),
        origin: first.origin.clone(),
        stream: stream.as_str().into(),
        scope: stream.scope(),
        first_seq: first.seq,
        last_seq: last.seq,
        count: events.len() as u64,
        sha256: sha256(bytes),
    };
    let event_blob = port.write_blob(repo, bytes).map_err(git_error)?;
    let seal_blob = port
        .write_blob(repo, &header.canonical_line()?)
        .map_err(git_error)?;
    let tree = port
        .write_tree(
            repo,
            &[
                TreeEntry {
                    name: b"events.jsonl".to_vec(),
                    mode: 0o100644,
                    oid: event_blob,
                },
                TreeEntry {
                    name: b"seal.json".to_vec(),
                    mode: 0o100644,
                    oid: seal_blob,
                },
            ],
        )
        .map_err(git_error)?;
    event_commit(
        port,
        repo,
        tree,
        parents,
        timestamp_seconds(&last.ts)?,
        format!(
            "fgos-events seal {}:{} {}..{}",
            first.origin,
            stream.as_str(),
            first.seq,
            last.seq
        )
        .into_bytes(),
    )
}

/// Seal and merge commits use one identity and one deterministic date encoder.
pub(crate) fn event_commit(
    port: &dyn Publication,
    repo: &RepoHandle,
    tree: Oid,
    parents: Vec<Oid>,
    seconds: i64,
    message: Vec<u8>,
) -> Result<Oid, Error> {
    port.write_commit(repo, &event_commit_input(tree, parents, seconds, message))
        .map_err(git_error)
}

pub(crate) fn event_commit_input(
    tree: Oid,
    parents: Vec<Oid>,
    seconds: i64,
    message: Vec<u8>,
) -> CommitInput {
    let identity = || Identity {
        name: "fgOS Event Store".into(),
        email: "event-store@fgos.invalid".into(),
    };
    let date = format!("{} +0000", seconds.max(0));
    CommitInput {
        tree,
        parents,
        author: identity(),
        committer: identity(),
        author_date: date.clone(),
        committer_date: date,
        message,
    }
}

/// Whole Unix seconds; callers clamp only when constructing a Git commit date.
pub(crate) fn timestamp_seconds(ts: &str) -> Result<i64, Error> {
    if !crate::envelope::valid_timestamp(ts) {
        return Err(invalid("invalid event date"));
    }
    let n = |a: usize, b: usize| ts[a..b].parse::<i64>().unwrap();
    let y = n(0, 4);
    let leaps = |year: i64| year.div_euclid(4) - year.div_euclid(100) + year.div_euclid(400);
    let mut days = (y - 1970) * 365 + leaps(y - 1) - leaps(1969);
    let leap = y % 4 == 0 && (y % 100 != 0 || y % 400 == 0);
    for month in 1..n(5, 7) {
        days += match month {
            2 => {
                if leap {
                    29
                } else {
                    28
                }
            }
            4 | 6 | 9 | 11 => 30,
            _ => 31,
        };
    }
    days += n(8, 10) - 1;
    Ok(days * 86400 + n(11, 13) * 3600 + n(14, 16) * 60 + n(17, 19))
}
